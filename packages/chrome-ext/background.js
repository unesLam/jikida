import { JIKIDA, KEYS, SEVERITY, AUTOSCAN_MAX_DEFAULT, getToken, getAccount } from './lib/config.js';

// ---- rules cache ---------------------------------------------------------

let RULES = null;

const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const MAX_LIST = 200;
const MAX_STR = 2000;

function safeStr(v, max) {
  return typeof v === 'string' && v.length > 0 && v.length <= (max || MAX_STR) ? v : null;
}

function safeSeverity(v) {
  return SEVERITIES.includes(v) ? v : 'medium';
}

function isSafeRegex(src) {
  if (typeof src !== 'string' || src.length === 0 || src.length > 500) {
    return false;
  }
  try {
    new RegExp(src);
    return true;
  } catch (e) {
    return false;
  }
}

function sanitizeRules(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  const version = Number.isFinite(raw.version) ? raw.version : 0;
  const secrets = Array.isArray(raw.secrets) ? raw.secrets.slice(0, MAX_LIST) : [];
  const paths = Array.isArray(raw.sensitive_paths) ? raw.sensitive_paths.slice(0, MAX_LIST) : [];
  const headers = Array.isArray(raw.security_headers) ? raw.security_headers.slice(0, MAX_LIST) : [];

  const cleanSecrets = [];
  secrets.forEach((s) => {
    if (!s || typeof s !== 'object') { return; }
    const label = safeStr(s.label, 200);
    const regex = isSafeRegex(s.regex) ? s.regex : null;
    if (!label || !regex) { return; }
    cleanSecrets.push({
      id: safeStr(s.id, 100) || label,
      label,
      regex,
      severity: safeSeverity(s.severity),
      public_ok: s.public_ok === true,
      note: safeStr(s.note, MAX_STR) || '',
    });
  });

  const cleanPaths = [];
  paths.forEach((p) => {
    if (!p || typeof p !== 'object') { return; }
    const path = safeStr(p.path, 300);
    const label = safeStr(p.label, 200);
    if (!path || !path.startsWith('/') || !label) { return; }
    cleanPaths.push({ path, label, severity: safeSeverity(p.severity) });
  });

  const cleanHeaders = [];
  headers.forEach((h) => {
    if (!h || typeof h !== 'object') { return; }
    const name = safeStr(h.name, 100);
    if (!name) { return; }
    cleanHeaders.push({
      id: safeStr(h.id, 100) || name,
      name,
      severity: safeSeverity(h.severity),
      why: safeStr(h.why, MAX_STR) || '',
    });
  });

  if (!cleanSecrets.length && !cleanPaths.length && !cleanHeaders.length) {
    return null;
  }
  return { version, secrets: cleanSecrets, sensitive_paths: cleanPaths, security_headers: cleanHeaders };
}

async function fetchBundledRules() {
  try {
    const raw = await fetch(chrome.runtime.getURL('rules/patterns.json')).then((r) => r.json());
    return sanitizeRules(raw);
  } catch (e) {
    return null;
  }
}

async function fetchRemoteRules() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(JIKIDA.RULES_URL, {
      method: 'GET',
      credentials: 'omit',
      redirect: 'error',
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) { return null; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('json')) { return null; }
    return sanitizeRules(await res.json());
  } catch (e) {
    return null;
  }
}

async function loadRules() {
  const store = await chrome.storage.local.get([KEYS.RULES, KEYS.RULES_AT]);
  const age = Date.now() - (store[KEYS.RULES_AT] || 0);
  if (store[KEYS.RULES] && age < JIKIDA.RULES_TTL_MS) {
    RULES = store[KEYS.RULES];
    return RULES;
  }

  const bundled = await fetchBundledRules();
  const remote = await fetchRemoteRules();

  let chosen = bundled;
  if (remote && (!bundled || remote.version >= bundled.version)) {
    chosen = remote;
  }
  if (!chosen) {
    chosen = { version: 0, secrets: [], sensitive_paths: [], security_headers: [] };
  }

  RULES = chosen;
  await chrome.storage.local.set({ [KEYS.RULES]: chosen, [KEYS.RULES_AT]: Date.now() });
  return RULES;
}

// ---- header + cookie audit (needs the worker's privileged APIs) ---------

async function auditResponseHeaders(url) {
  // A single, safe HEAD/GET to read response headers. We do NOT send the body
  // anywhere; headers are analysed locally.
  const findings = [];
  let headers = null;
  try {
    const res = await fetch(url, { method: 'GET', credentials: 'omit', redirect: 'follow' });
    headers = res.headers;
  } catch (e) {
    return findings; // can't reach — skip header audit silently
  }
  const rules = (RULES && RULES.security_headers) || [];
  const has = (n) => headers.has(n);
  rules.forEach((h) => {
    if (!has(h.name) && !(h.id === 'content-security-policy' && has('content-security-policy-report-only'))) {
      findings.push({
        id: 'header.' + h.id,
        title: 'Missing ' + h.name + ' header',
        severity: h.severity,
        category: 'headers',
        confirmed: true,
        evidence: 'Response for ' + url + ' has no ' + h.name + ' header.',
        remediation: h.why,
        source: 'browser',
      });
    }
  });
  // Server banner leaks.
  const server = headers.get('server');
  const xpb = headers.get('x-powered-by');
  if (xpb) {
    findings.push({
      id: 'header.x-powered-by',
      title: 'X-Powered-By reveals stack: ' + xpb,
      severity: 'low',
      category: 'headers',
      confirmed: true,
      evidence: 'X-Powered-By: ' + xpb,
      remediation: 'Remove the X-Powered-By header so you do not advertise the framework/version to attackers.',
      source: 'browser',
    });
  }
  if (server && /\/\d/.test(server)) {
    findings.push({
      id: 'header.server-version',
      title: 'Server header exposes version: ' + server,
      severity: 'low',
      category: 'headers',
      confirmed: true,
      evidence: 'Server: ' + server,
      remediation: 'Strip the version from the Server header to avoid targeted CVE probing.',
      source: 'browser',
    });
  }
  // Insecure CORS.
  const acao = headers.get('access-control-allow-origin');
  const acac = headers.get('access-control-allow-credentials');
  if (acao === '*' && acac === 'true') {
    findings.push({
      id: 'header.cors-wildcard-creds',
      title: 'CORS allows any origin WITH credentials',
      severity: 'high',
      category: 'api',
      confirmed: true,
      evidence: 'Access-Control-Allow-Origin: * and Access-Control-Allow-Credentials: true',
      remediation: 'Never combine a wildcard origin with credentials. Echo only a strict allowlist of trusted origins.',
      source: 'browser',
    });
  }
  return findings;
}

async function auditCookies(url) {
  const findings = [];
  try {
    const cookies = await chrome.cookies.getAll({ url });
    cookies.forEach((c) => {
      const sessiony = /sess|token|auth|jwt|sid|login|csrf/i.test(c.name);
      if (!sessiony) { return; }
      const issues = [];
      if (!c.secure && url.startsWith('https')) { issues.push('not Secure'); }
      if (!c.httpOnly) { issues.push('not HttpOnly'); }
      if (!c.sameSite || c.sameSite === 'no_restriction' || c.sameSite === 'unspecified') { issues.push('no SameSite'); }
      if (issues.length) {
        findings.push({
          id: 'cookie.flags.' + c.name,
          title: 'Session cookie "' + c.name + '" — ' + issues.join(', '),
          severity: issues.includes('not HttpOnly') ? 'medium' : 'low',
          category: 'cookies',
          confirmed: true,
          evidence: 'Cookie ' + c.name + ': Secure=' + c.secure + ' HttpOnly=' + c.httpOnly + ' SameSite=' + (c.sameSite || 'none'),
          remediation: 'Set Secure, HttpOnly and SameSite=Lax (or Strict) on session/auth cookies.',
          source: 'browser',
        });
      }
    });
  } catch (e) { /* cookies permission may be denied on some pages */ }
  return findings;
}

// ---- sensitive-path probe (safe GET, same-origin only) ------------------

async function probeSensitivePaths(origin) {
  const findings = [];
  const paths = (RULES && RULES.sensitive_paths) || [];
  // Only probe a small, fixed list, GET only, no auth, and treat a real file
  // (200 + non-HTML content) as evidence — an SPA catch-all returning index.html
  // must NOT be flagged.
  for (const p of paths) {
    try {
      const res = await fetch(origin + p.path, { method: 'GET', credentials: 'omit', redirect: 'manual' });
      if (res.status !== 200) { continue; }
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      const body = (await res.text()).slice(0, 400);
      const looksHtml = ct.includes('text/html') || /<!doctype html|<html/i.test(body);
      // Evidence that it's the real file, not an SPA fallback:
      const realEnv = p.path.includes('.env') && /[A-Z0-9_]+=.+/.test(body) && !looksHtml;
      const realGit = p.path.includes('.git') && /(ref:|\[core\]|repositoryformatversion)/i.test(body);
      const realSql = p.path.includes('.sql') && /(INSERT INTO|CREATE TABLE|DROP TABLE)/i.test(body);
      const realOther = !looksHtml && !p.path.includes('.env') && !p.path.includes('.git') && !p.path.includes('.sql') && body.length > 0;
      if (realEnv || realGit || realSql || realOther) {
        findings.push({
          id: 'path.' + p.path.replace(/[^a-z0-9]+/gi, '-'),
          title: p.label + ' is publicly accessible',
          severity: p.severity,
          category: 'exposure',
          confirmed: true,
          evidence: origin + p.path + ' → 200 (' + ct + ')\n' + body.slice(0, 120),
          remediation: 'Block public access to ' + p.path + ' at the server/CDN. Rotate anything it exposed.',
          source: 'browser',
        });
      }
    } catch (e) { /* network/CORS — skip */ }
  }
  return findings;
}

// ---- run a full scan of one tab -----------------------------------------

async function scanTab(tabId, url) {
  await loadRules();
  const origin = new URL(url).origin;

  // 1) In-page scan (DOM, inline secrets, forms, surface). Inject the scanner
  //    definition into the MAIN world, then call it with the current rules.
  let pageResult = { findings: [], surface: { urls: [], apis: [] }, counts: {} };
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      files: ['lib/scanner.js'],
    });
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: (rules) => (window.__jikidaScan ? window.__jikidaScan(rules) : null),
      args: [RULES],
    });
    if (result) { pageResult = result; }
  } catch (e) { /* restricted page (chrome://, store) */ }

  // 2) Privileged audits from the worker.
  const [hdr, ck, paths] = await Promise.all([
    auditResponseHeaders(url),
    auditCookies(url),
    probeSensitivePaths(origin),
  ]);

  const findings = dedupe([...(pageResult.findings || []), ...hdr, ...ck, ...paths]);
  const result = {
    url,
    origin,
    host: new URL(url).hostname,
    title: pageResult.title || '',
    scanned_at: Date.now(),
    findings,
    surface: pageResult.surface || { urls: [], apis: [] },
    counts: pageResult.counts || {},
  };
  await saveResult(origin, result);
  await updateBadge(tabId, findings);
  return result;
}

function dedupe(list) {
  const seen = new Set();
  return list.filter((f) => {
    const k = f.id + '|' + (f.title || '');
    if (seen.has(k)) { return false; }
    seen.add(k);
    return true;
  }).sort((a, b) => (SEVERITY[b.severity] || 0) - (SEVERITY[a.severity] || 0));
}

async function saveResult(origin, result) {
  const store = await chrome.storage.local.get(KEYS.RESULTS);
  const all = store[KEYS.RESULTS] || {};
  // Stamp when this origin was scanned so the popup's grouped "Recent scans"
  // history can show "3m ago" and sort newest-first. Keep the store bounded to
  // the 30 most-recently-scanned origins so it can't grow unbounded.
  all[origin] = { ...result, scannedAt: Date.now() };
  const entries = Object.entries(all).sort((a, b) => (b[1].scannedAt || 0) - (a[1].scannedAt || 0));
  const trimmed = Object.fromEntries(entries.slice(0, 30));
  await chrome.storage.local.set({ [KEYS.RESULTS]: trimmed });
}

async function updateBadge(tabId, findings) {
  const actionable = findings.filter((f) => f.severity !== 'info').length;
  const worst = findings.reduce((w, f) => Math.max(w, SEVERITY[f.severity] || 0), 0);
  const color = worst >= 3 ? '#DC2626' : worst === 2 ? '#D97706' : '#0F62FE';
  try {
    await chrome.action.setBadgeText({ tabId, text: actionable ? String(actionable) : '' });
    await chrome.action.setBadgeBackgroundColor({ tabId, color });
  } catch (e) {}
}

// ---- auto-scan (capped, same-origin, safe) ------------------------------

const autoState = {}; // tabId -> { running, done, max, visited:Set, findings:[] }

async function autoScan(tabId, startUrl, max) {
  max = Math.min(max || AUTOSCAN_MAX_DEFAULT, 50);
  const origin = new URL(startUrl).origin;
  const first = await scanTab(tabId, startUrl);
  const queue = (first.surface.urls || []).map((p) => (p.startsWith('http') ? p : origin + p));
  const visited = new Set([startUrl]);
  const allFindings = [...first.findings];
  // Accumulate the surface across EVERY page crawled, and remember which page
  // each finding came from so the report can show per-page issue counts. Without
  // this the saved result only kept the LAST page's surface (empty-list bug).
  const surfUrls = new Set((first.surface.urls || []));
  const surfApis = new Set((first.surface.apis || []));
  const perPage = { [startUrl]: first.findings.length };
  first.findings.forEach((f) => { f.page = f.page || startUrl; });
  const state = { running: true, done: 1, max, visited, findings: allFindings };
  autoState[tabId] = state;
  notifyProgress(tabId, state);

  for (const next of queue) {
    if (state.done >= max) { break; }
    if (visited.has(next)) { continue; }
    visited.add(next);
    // Navigate the tab so we scan the AUTHENTICATED, rendered page with the
    // user's own session. This stays inside the same origin and never submits
    // forms or mutates data.
    try {
      await navigateAndWait(tabId, next);
      const r = await scanTab(tabId, next);
      r.findings.forEach((f) => { f.page = f.page || next; allFindings.push(f); });
      (r.surface.urls || []).forEach((u) => surfUrls.add(u));
      (r.surface.apis || []).forEach((u) => surfApis.add(u));
      perPage[next] = r.findings.length;
      state.done++;
      notifyProgress(tabId, state);
    } catch (e) { /* skip page that fails to load */ }
  }
  state.running = false;
  state.findings = dedupe(allFindings);
  // Persist the AGGREGATED result so the sidebar can re-fetch it even if the
  // final progress message is dropped while the tab was navigating (the
  // "reports nothing" bug). saveResult keys by origin.
  const aggregated = {
    url: startUrl,
    origin,
    host: new URL(startUrl).hostname,
    scanned_at: Date.now(),
    findings: state.findings,
    surface: { urls: Array.from(surfUrls).slice(0, 300), apis: Array.from(surfApis).slice(0, 300) },
    counts: first.counts || {},
    pages_scanned: state.done,
    per_page: perPage,
  };
  await saveResult(origin, aggregated);
  state.result = aggregated;
  notifyProgress(tabId, state);
  return state;
}

function navigateAndWait(tabId, url) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { cleanup(); reject(new Error('timeout')); }, 15000);
    function listener(id, info) {
      if (id === tabId && info.status === 'complete') { cleanup(); setTimeout(resolve, 400); }
    }
    function cleanup() { clearTimeout(timer); chrome.tabs.onUpdated.removeListener(listener); }
    chrome.tabs.onUpdated.addListener(listener);
    chrome.tabs.update(tabId, { url });
  });
}

function notifyProgress(tabId, state) {
  chrome.runtime.sendMessage({
    type: 'autoscan-progress',
    tabId,
    done: state.done,
    max: state.max,
    running: state.running,
    findings: state.running ? undefined : state.findings,
    result: state.running ? undefined : state.result,
  }).catch(() => {});
}

// Anonymous daily single-page-scan gate. Resets each calendar day (local time).
// Stored in chrome.storage.local as { day: 'YYYY-MM-DD', count: n }.
const ANON_DAILY_SCAN_LIMIT = 15;
async function dailyScanGate() {
  const today = new Date().toISOString().slice(0, 10);
  const store = await chrome.storage.local.get('df_scan_quota');
  let q = store.df_scan_quota;
  if (!q || q.day !== today) { q = { day: today, count: 0 }; }
  if (q.count >= ANON_DAILY_SCAN_LIMIT) {
    return { ok: false, used: q.count, limit: ANON_DAILY_SCAN_LIMIT };
  }
  q.count += 1;
  await chrome.storage.local.set({ df_scan_quota: q });
  return { ok: true, used: q.count, limit: ANON_DAILY_SCAN_LIMIT };
}

// ---- API (keyless header check + connected-account calls) ---------------

async function api(path, body, useToken) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (useToken) {
    const t = await getToken();
    if (t) { headers.Authorization = 'Bearer ' + t; }
  }
  const res = await fetch(JIKIDA.MCP + path, { method: 'POST', headers, body: JSON.stringify(body || {}) });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data: json };
}

// Best-effort "email us if the extension hits an issue" beacon. Fire-and-forget:
// POSTs a short error record to the app, which routes it to ops email. Never
// throws, and self-limits to one report per error signature per session so a
// broken page can't spam. No page content is sent — only the error + version.
const _reportedIssues = new Set();
function reportIssue(where, err) {
  try {
    const sig = where + ':' + (err && err.message ? err.message : String(err)).slice(0, 120);
    if (_reportedIssues.has(sig)) { return; }
    _reportedIssues.add(sig);
    const v = (chrome.runtime.getManifest && chrome.runtime.getManifest().version) || '?';
    fetch(JIKIDA.APP + '/api/extension/issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ where, message: sig, version: v, ua: navigator.userAgent }),
      keepalive: true,
    }).catch(() => {});
  } catch (e) { /* reporting must never break anything */ }
}

// ---- message router ------------------------------------------------------

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      if (msg.type === 'scan') {
        const tab = msg.tabId ? { id: msg.tabId, url: msg.url } : (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
        if (!tab || tab.id == null || !tab.url || !/^https?:/.test(tab.url)) {
          sendResponse({ ok: false, error: 'no scannable active tab' });
          return;
        }
        // Anonymous users get a generous daily cap on single-page scans (like the
        // keyless MCP tier); a connected account is unlimited. Scans run locally
        // so this only nudges signup on heavy use, it doesn't gate cost.
        const acctS = await getAccount();
        if (!acctS || !acctS.sites) {
          const gate = await dailyScanGate();
          if (!gate.ok) {
            sendResponse({ ok: false, error: 'daily_limit', message: 'Free daily scan limit reached (' + gate.limit + '/day). Connect a free account for unlimited scans.', used: gate.used, limit: gate.limit });
            return;
          }
        }
        const r = await scanTab(tab.id, tab.url);
        sendResponse({ ok: true, result: r });
      } else if (msg.type === 'get-result') {
        const store = await chrome.storage.local.get(KEYS.RESULTS);
        sendResponse({ ok: true, result: (store[KEYS.RESULTS] || {})[msg.origin] || null });
      } else if (msg.type === 'autoscan') {
        const tab = (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
        if (!tab || tab.id == null || !tab.url || !/^https?:/.test(tab.url)) {
          sendResponse({ ok: false, error: 'no scannable active tab' });
          return;
        }
        // Auto-scan crawls multiple pages (navigates the tab) — the aggressive,
        // authenticated-discovery feature. Gate it behind a connected account,
        // and scale crawl depth to plan (like MCP quotas). Anonymous users get
        // single-page scans only.
        const acctA = await getAccount();
        if (!acctA || !acctA.sites) {
          sendResponse({ ok: false, error: 'account_required', message: 'Connect a free Jikida.io account to run a multi-page authenticated scan. Single-page scans stay free.' });
          return;
        }
        const paidA = (acctA.sites || []).some((s) => { const p = String(s.plan || '').toLowerCase(); return p && p !== 'free' && p !== 'none' && p !== 'site'; });
        const capA = paidA ? 25 : 5;
        autoScan(tab.id, tab.url, Math.min(msg.max || capA, capA)); // fire and forget; progress via messages
        sendResponse({ ok: true });
      } else if (msg.type === 'deep-check') {
        // Server-side header/TLS grade via the keyless MCP endpoint.
        const r = await api('/check_headers', { url: msg.url }, false);
        sendResponse(r);
      } else if (msg.type === 'connect') {
        // Validate a token by listing sites; store account + plan.
        const r = await api('/list_sites', {}, true);
        if (r.ok) {
          const sites = r.data.sites || r.data || [];
          const acct = { connected: true, sites, at: Date.now() };
          await chrome.storage.local.set({ [KEYS.ACCOUNT]: acct });
        }
        sendResponse(r);
      } else if (msg.type === 'account') {
        sendResponse({ ok: true, account: await getAccount(), token: !!(await getToken()) });
      } else if (msg.type === 'sync') {
        // Push the authenticated discovery to the matching site (deep tier).
        const r = await api('/pentest_status', { host: msg.host }, true);
        sendResponse(r);
      } else if (msg.type === 'ai') {
        const r = await api('/explain_verdict', { rule_id: msg.finding }, true);
        sendResponse(r);
      } else {
        sendResponse({ ok: false, error: 'unknown message' });
      }
    } catch (e) {
      // An unexpected failure handling a UI message is a real bug — beacon it so
      // we hear about it (best-effort; never blocks the response).
      reportIssue('onMessage:' + (msg && msg.type || '?'), e);
      sendResponse({ ok: false, error: String(e && e.message || e) });
    }
  })();
  return true; // async
});

// NOTE: no passive chrome.tabs.onUpdated auto-scan. The extension is strictly
// activeTab: it only reads/probes a page the user explicitly scanned from the
// side panel (which grants activeTab for that tab in that gesture). We never
// scan, read a URL, or probe paths on pages the user didn't ask us to — that
// keeps us honest with the declared permissions and off third-party sites the
// user is just browsing.

// Clicking the toolbar icon opens the POPUP (action.default_popup). The popup's
// "Full report" button opens the full report page (sidebar/sidebar.html) as a
// NORMAL TAB — we no longer use the Chrome side panel API at all (opening it
// from a popup was unreliable). No chrome.action.onClicked handler either: with
// a default_popup set it never fires.
chrome.runtime.onInstalled.addListener((details) => {
  loadRules();

  if (details && details.reason === 'install') {
    chrome.tabs.create({ url: 'https://jikida.io/extension/welcome?src=ext_install' }).catch(() => {});
  }
});

try {
  chrome.runtime.setUninstallURL('https://jikida.io/extension/goodbye?src=ext_uninstall');
} catch (e) { /* noop */ }
