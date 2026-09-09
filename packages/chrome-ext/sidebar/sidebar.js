import { JIKIDA, SEVERITY, KEYS } from '../lib/config.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
let tab = null;
let result = null;
let sevFilter = 'all';

// Resolve with null if the background worker doesn't answer within 8s (asleep,
// reloading, or errored) so an await never hangs the sidebar. Also swallows the
// lastError access that Chrome logs when a worker is gone.
const send = (msg) => new Promise((resolve) => {
  let done = false;
  const finish = (v) => { if (!done) { done = true; resolve(v); } };
  const t = setTimeout(() => finish(null), 8000);
  try {
    chrome.runtime.sendMessage(msg, (resp) => {
      void chrome.runtime.lastError; // read to silence "message port closed"
      clearTimeout(t); finish(resp);
    });
  } catch (e) { clearTimeout(t); finish(null); }
});
const activeTab = async () => (await chrome.tabs.query({ active: true, currentWindow: true }))[0];

// The most-recently-scanned result across all origins (newest scannedAt first).
// Used when the report page is opened as a standalone tab, where there's no
// "current site" to read — we show the last scan instead of an empty page.
async function latestStoredResult() {
  try {
    const store = (await chrome.storage.local.get(KEYS.RESULTS))[KEYS.RESULTS] || {};
    const rows = Object.values(store).filter((r) => r && Array.isArray(r.findings));
    rows.sort((a, b) => (b.scannedAt || 0) - (a.scannedAt || 0));
    return rows[0] || null;
  } catch (e) { return null; }
}

function gradeFor(findings) {
  // Grade from the worst confirmed finding — evidence-based, not cosmetic.
  const worst = findings.reduce((w, f) => (f.confirmed && SEVERITY[f.severity] > SEVERITY[w] ? f.severity : w), 'info');
  const actionable = findings.filter((f) => f.severity !== 'info').length;
  if (worst === 'critical') return { g: 'F', cls: 'f' };
  if (worst === 'high') return { g: 'D', cls: 'd' };
  if (worst === 'medium') return { g: 'C', cls: 'c' };
  if (actionable) return { g: 'B', cls: 'b' };
  return { g: 'A', cls: 'a' };
}

function setScore(res) {
  const findings = (res && res.findings) || [];
  const grade = gradeFor(findings);
  $('#scoreGrade').className = 'score-grade ' + grade.cls;
  $('#scoreGrade').textContent = grade.g;
  const actionable = findings.filter((f) => f.severity !== 'info');
  $('#scoreLine').textContent = actionable.length
    ? actionable.length + ' issue' + (actionable.length > 1 ? 's' : '') + ' to review'
    : 'No issues found';
  $('#scoreSub').textContent = res && res.host ? res.host : '';
  $('#cFindings').textContent = actionable.length || '';
}

function renderFindings() {
  const ul = $('#findings');
  ul.innerHTML = '';
  let findings = (result && result.findings) || [];
  if (sevFilter !== 'all') { findings = findings.filter((f) => f.severity === sevFilter); }
  if (!findings.length) {
    ul.innerHTML = '<li class="empty"><svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg><br>' + (result ? 'Nothing here.' : 'Scan the page to see findings.') + '</li>';
    return;
  }
  findings.forEach((f) => {
    const li = document.createElement('li');
    li.className = 'finding';
    const potential = !f.confirmed;
    li.innerHTML =
      '<span class="sev-bar sev-' + f.severity + '"></span>' +
      '<div style="min-width:0;flex:1"><div class="f-title"></div>' +
      '<div class="f-meta"><span class="f-tag ' + (potential ? 'potential' : 'confirmed') + '">' +
      (potential ? 'Needs verification' : 'Confirmed') + '</span><span>' + f.severity + '</span><span>' + (f.category || '') + '</span>' +
      (f.source === 'authenticated' ? '<span>authenticated</span>' : '') + '</div></div>';
    li.querySelector('.f-title').textContent = f.title;
    li.addEventListener('click', () => openDrawer(f));
    ul.appendChild(li);
  });
}

function renderFilters() {
  const box = $('#sevFilters');
  const findings = (result && result.findings) || [];
  const counts = {};
  findings.forEach((f) => { counts[f.severity] = (counts[f.severity] || 0) + 1; });
  const order = ['all', 'critical', 'high', 'medium', 'low', 'info'];
  box.innerHTML = '';
  order.forEach((s) => {
    const n = s === 'all' ? findings.length : (counts[s] || 0);
    if (s !== 'all' && !n) return;
    const b = document.createElement('button');
    b.className = 'chip' + (sevFilter === s ? ' on' : '');
    b.textContent = (s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)) + ' ' + n;
    b.addEventListener('click', () => { sevFilter = s; renderFilters(); renderFindings(); });
    box.appendChild(b);
  });
}

function renderSurface() {
  const s = (result && result.surface) || { urls: [], apis: [] };
  const perPage = (result && result.per_page) || {};
  const origin = (result && result.origin) || (tab && /^https?:/.test(tab.url) ? new URL(tab.url).origin : '');
  const pages = (result && result.pages_scanned) || 1;
  const totalIssues = ((result && result.findings) || []).filter((f) => f.severity !== 'info').length;

  $('#surfStats').innerHTML =
    stat(pages, 'Pages') + stat(totalIssues, 'Issues') + stat(s.urls.length, 'URLs') + stat(s.apis.length, 'APIs');

  function pageIssues(path) {
    const full = path.startsWith('http') ? path : origin + path;
    if (Object.prototype.hasOwnProperty.call(perPage, full)) { return perPage[full]; }
    if (Object.prototype.hasOwnProperty.call(perPage, path)) { return perPage[path]; }
    return null;
  }
  function urlRow(u) {
    const n = pageIssues(u);
    let badge;
    if (n === null) { badge = '<span class="surf-badge muted">not scanned</span>'; }
    else if (n === 0) { badge = '<span class="surf-badge ok">clean</span>'; }
    else { badge = '<span class="surf-badge warn">' + n + ' issue' + (n > 1 ? 's' : '') + '</span>'; }
    return '<li class="surf-row"><span class="surf-path">' + esc(u) + '</span>' + badge + '</li>';
  }
  $('#surfUrls').innerHTML = s.urls.length ? s.urls.map(urlRow).join('') : '<li style="color:var(--ink-3)">None discovered yet.</li>';
  $('#surfApis').innerHTML = s.apis.length ? s.apis.map((u) => '<li class="surf-row"><span class="surf-path">' + esc(u) + '</span><span class="surf-badge api">API</span></li>').join('') : '<li style="color:var(--ink-3)">None discovered yet.</li>';
  $('#surfNote').textContent = pages > 1
    ? 'Crawled ' + pages + ' pages behind your session. Each row shows how many issues that page had — pages an external pentest cannot see behind your login.'
    : 'Discovered from this page. Run Auto scan to crawl more pages behind your login and get per-page issue counts.';
}
function stat(n, l) { return '<div class="surf-stat"><b>' + n + '</b><span>' + l + '</span></div>'; }
function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

// A plan counts as "paid" when it's anything other than free/none. Used to
// decide whether to show the upgrade banner and whether premium toggles are on.
function isPaidPlan(plan) {
  const p = String(plan || '').toLowerCase();
  return p !== '' && p !== 'free' && p !== 'none' && p !== 'site';
}

// The monitor toggles (Uptime, SSL/domain). Rendered in three states:
//  - disconnected → clicking any opens the register page
//  - connected + free → shown "off" with a lock; clicking opens upgrade
//  - connected + paid → shown "on" (these run for the site already)
function monitorTogglesHtml(state) {
  const rows = [
    { key: 'uptime', label: 'Uptime monitoring', sub: 'Know the second the site goes down' },
    { key: 'ssl', label: 'SSL & domain expiry', sub: 'Alert before a cert or domain lapses' },
  ];
  return '<div class="acct-card"><div class="acct-h">Monitor this site</div>' +
    rows.map((r) => {
      const on = state === 'paid';
      return '<div class="mon-row" data-mon="' + r.key + '">' +
        '<div style="min-width:0"><div class="mon-label">' + r.label + (state === 'free' ? ' <span class="mon-lock">Plan</span>' : '') + '</div>' +
        '<div class="mon-sub">' + r.sub + '</div></div>' +
        '<span class="mon-switch' + (on ? ' on' : '') + '" role="button" tabindex="0"><span class="mon-knob"></span></span></div>';
    }).join('') +
    (state === 'disconnected'
      ? '<p class="acct-p" style="margin:10px 0 0">Connect a free account to turn these on.</p>'
      : state === 'free'
        ? '<p class="acct-p" style="margin:10px 0 0">Included from the Uptime plan up. <a href="' + JIKIDA.PRICING_URL + '" target="_blank" rel="noopener" style="color:var(--brand)">See plans →</a></p>'
        : '') +
    '</div>';
}

async function renderAccount() {
  const box = $('#accountBox');
  const acct = await send({ type: 'account' });
  box.className = 'acct';
  const host = tab && /^https?:/.test(tab.url) ? new URL(tab.url).hostname : '';
  if (acct && acct.token && acct.account) {
    const sites = acct.account.sites || [];
    const known = sites.find((s) => (s.host || s.url || '').includes(host));
    const paid = sites.some((s) => isPaidPlan(s.plan)) || (known && isPaidPlan(known.plan));
    const monState = paid ? 'paid' : 'free';
    box.innerHTML =
      '<div class="acct-card"><div class="acct-h">Connected ✓</div>' +
      '<p class="acct-p">Your scans sync into the matching Jikida.io site and merge with your external pentest, repo scan and monitoring into one report.</p>' +
      (host ? (known
        ? '<div class="site-row"><span>' + esc(host) + ' <span class="plan-pill">' + esc(known.plan || 'site') + '</span></span><button class="site-add" id="syncBtn">Sync results</button></div>'
        : '<div class="site-row"><span>' + esc(host) + ' — not a site yet</span><button class="site-add" id="addBtn">Add site</button></div>') : '') +
      '</div>' +
      monitorTogglesHtml(monState) +
      // Free users: the deep, sensitive discovery is where the paid value is.
      (!paid
        ? '<div class="acct-card up-banner"><div class="acct-h">Unlock the sensitive fixes</div>' +
          '<p class="acct-p">Deep authenticated discovery, repo secret scans, AI fix analysis and the fixes for your highest-severity findings need a plan. Free shows what\'s wrong — a plan shows how to fix it, at scale.</p>' +
          '<button class="btn btn-primary" id="upgradeBtn" style="width:100%">See plans</button></div>'
        : '') +
      '<div class="acct-card"><div class="acct-h">Authenticated pentest</div><p class="acct-p">Browse behind your login and Jikida.io analyzes the pages and APIs your external scan can never reach. Deeper discovery scales with your plan.</p>' +
      '<button class="btn btn-primary" id="authScan" style="width:100%">Start authenticated scan</button></div>';
    const sync = $('#syncBtn'); if (sync) sync.addEventListener('click', () => doSync(host));
    const add = $('#addBtn'); if (add) add.addEventListener('click', () => chrome.tabs.create({ url: JIKIDA.ADD_SITE_URL + '?scan=' + encodeURIComponent(host) }));
    const auth = $('#authScan'); if (auth) auth.addEventListener('click', () => { switchTab('findings'); auto(); });
    const up = $('#upgradeBtn'); if (up) up.addEventListener('click', () => chrome.tabs.create({ url: JIKIDA.PRICING_URL }));
    // Premium monitor toggles → upgrade for free users (they're already on for paid).
    wireMonitorToggles(monState, host);
  } else {
    box.innerHTML =
      '<div class="acct-card"><div class="acct-h">Connect Jikida.io</div>' +
      '<p class="acct-p">Free to connect. Save scans, sync to your pentests, monitor uptime/SSL/domain, get alerts, and unlock deeper authenticated discovery + AI analysis on your plan.</p>' +
      '<input class="field" id="tokenInput" placeholder="Paste your API token (app.jikida.io/developer)">' +
      '<button class="btn btn-primary" id="connectSave" style="width:100%">Connect</button>' +
      '<p class="acct-p" style="margin:10px 0 0"><a href="' + JIKIDA.DEVELOPER_TOKEN_URL + '" target="_blank" rel="noopener" style="color:var(--brand)">Get your token →</a> · <a href="' + JIKIDA.SIGNUP_URL + '" target="_blank" rel="noopener" style="color:var(--brand)">Create a free account</a></p></div>' +
      monitorTogglesHtml('disconnected');
    $('#connectSave').addEventListener('click', connect);
    wireMonitorToggles('disconnected', host);
  }
}

// Clicking a monitor toggle takes the shortest path to conversion:
//   disconnected → register · free → pricing · paid → open the site's uptime tab.
function wireMonitorToggles(state, host) {
  $$('.mon-row').forEach((row) => {
    const sw = row.querySelector('.mon-switch');
    const act = () => {
      if (state === 'disconnected') { chrome.tabs.create({ url: JIKIDA.SIGNUP_URL }); }
      else if (state === 'free') { chrome.tabs.create({ url: JIKIDA.PRICING_URL }); }
      else { chrome.tabs.create({ url: JIKIDA.APP + '/sites' + (host ? '?q=' + encodeURIComponent(host) : '') }); }
    };
    sw.addEventListener('click', act);
    sw.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
  });
}

async function connect() {
  const token = $('#tokenInput').value.trim();
  if (!token) return;
  await chrome.storage.local.set({ [KEYS.TOKEN]: token });
  const r = await send({ type: 'connect' });
  if (r && r.ok) { renderAccount(); }
  else {
    await chrome.storage.local.remove(KEYS.TOKEN);
    $('#tokenInput').style.borderColor = 'var(--danger)';
    $('#tokenInput').value = '';
    $('#tokenInput').placeholder = 'Token invalid — copy a fresh one';
  }
}

async function doSync(host) {
  const r = await send({ type: 'sync', host });
  const btn = $('#syncBtn');
  if (btn) btn.textContent = r && r.ok ? 'Synced ✓' : 'Sync failed';
}

function openDrawer(f) {
  const d = $('#drawerBody');
  const potential = !f.confirmed;
  d.innerHTML =
    '<div class="d-title">' + esc(f.title) + '</div>' +
    '<div class="f-meta"><span class="f-tag ' + (potential ? 'potential' : 'confirmed') + '">' + (potential ? 'Needs verification' : 'Confirmed') + '</span><span>' + f.severity + '</span><span>' + esc(f.category || '') + '</span><span>source: ' + esc(f.source || 'browser') + '</span></div>' +
    '<div class="d-sec-h">Scanner evidence</div><div class="d-evidence">' + esc(f.evidence || 'n/a') + '</div>' +
    '<div class="d-sec-h">How to fix</div><div class="d-fix">' + esc(f.remediation || 'See the Jikida.io docs.') + '</div>' +
    '<div id="aiWrap"></div>';
  $('#drawer').hidden = false;
  // AI analysis (connected + plan gated on the server).
  send({ type: 'account' }).then((acct) => {
    if (acct && acct.token) {
      const w = $('#aiWrap');
      w.innerHTML = '<div class="d-sec-h">AI analysis</div><button class="btn" id="aiBtn" style="width:100%">Analyze with AI</button>';
      $('#aiBtn').addEventListener('click', async () => {
        $('#aiBtn').textContent = 'Analyzing…'; $('#aiBtn').disabled = true;
        const r = await send({ type: 'ai', finding: f.id });
        w.innerHTML = '<div class="d-sec-h">AI analysis <span style="color:var(--ink-3);font-weight:400;text-transform:none;letter-spacing:0">· interpretation, from the evidence above</span></div><div class="d-ai">' + esc((r && r.data && (r.data.explanation || r.data.message)) || 'AI analysis needs a plan that includes it. Upgrade at app.jikida.io.') + '</div>';
      });
    }
  });
}

function switchTab(name) {
  $$('.tab').forEach((t) => t.classList.toggle('on', t.dataset.tab === name));
  $$('.pane').forEach((p) => p.classList.toggle('on', p.dataset.pane === name));
  // Every pane must paint on entry — otherwise a tab the user never scanned
  // into (or returned to) stays blank. Findings previously only rendered from
  // refresh(), which never ran without a cached result → empty "view all
  // results". Render it here so it always shows findings or a clear empty state.
  if (name === 'findings') { renderFilters(); renderFindings(); }
  if (name === 'account') renderAccount();
  if (name === 'surface') renderSurface();
}

async function scan() {
  $('#scanBtn').disabled = true;
  $('#scoreLine').textContent = 'Scanning…';
  const r = await send({ type: 'scan', tabId: tab.id, url: tab.url });
  $('#scanBtn').disabled = false;
  if (r && r.ok) { result = r.result; refresh(); }
  else if (r && r.error === 'daily_limit') { limitNudge(r.message); }
}
async function auto() {
  const r = await send({ type: 'autoscan', max: 10 });
  if (r && r.error === 'account_required') { limitNudge(r.message); if (typeof switchTab === 'function') { switchTab('account'); } return; }
  $('#progress').hidden = false; $('#autoBtn').disabled = true;
}

// Surface a soft limit message + push toward connecting an account.
function limitNudge(message) {
  if ($('#scoreLine')) { $('#scoreLine').textContent = message || 'Free limit reached — connect an account for more.'; }
}
function refresh() { setScore(result); renderFilters(); renderFindings(); renderSurface(); showExport(); }

function showExport() {
  const row = $('#exportRow');
  if (row) { row.hidden = !(result && (result.findings || []).length); }
}

// Build a self-contained, offline HTML report of the current scan and download
// it to the user's laptop (Blob + <a download> — no downloads permission, no
// server round-trip; everything already lives locally).
// Our ONE logo, embedded as a base64 data URI so every report/export shows the
// same Jikida.io mark (an image, not a re-drawn inline SVG) and it survives when
// the HTML file is saved and opened offline. Fetched once, cached.
let _logoDataUri = null;
async function logoDataUri() {
  if (_logoDataUri !== null) { return _logoDataUri; }
  try {
    const res = await fetch(chrome.runtime.getURL('icons/icon128.png'));
    const blob = await res.blob();
    _logoDataUri = await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => resolve('');
      r.readAsDataURL(blob);
    });
  } catch (e) { _logoDataUri = ''; }
  return _logoDataUri;
}

async function buildReportHtml() {
  const findings = (result && result.findings) || [];
  const host = (result && result.host) || 'page';
  const surfUrls = (result && result.surface && Array.isArray(result.surface.urls)) ? result.surface.urls : [];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sev = (s) => ({ critical: '#B4272C', high: '#B4272C', medium: '#96591A', low: '#706B66', info: '#A8A29E' }[s] || '#706B66');
  const logo = await logoDataUri();

  const rows = findings.map((f) =>
    '<div style="border-left:3px solid ' + sev(f.severity) + ';background:#FAFAF9;border-radius:0 8px 8px 0;padding:11px 14px;margin:0 0 10px;">' +
    '<div style="font-weight:700;font-size:13px;">' + esc(f.title) + '</div>' +
    '<div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:' + sev(f.severity) + ';margin:2px 0 6px;">' + esc(f.severity) + (f.category ? ' · ' + esc(f.category) : '') + '</div>' +
    (f.evidence ? '<div style="font-size:12px;color:#57534E;">' + esc(f.evidence) + '</div>' : '') +
    (f.remediation ? '<div style="font-size:11.5px;color:#44403C;background:#F1F0EE;border-radius:6px;padding:7px 10px;margin-top:6px;"><b>Fix:</b> ' + esc(f.remediation) + '</div>' : '') +
    '</div>').join('');

  // The pages actually scanned, so the reader sees the exact surface covered.
  const urlsBlock = surfUrls.length
    ? '<h2 style="font-size:14px;margin:26px 0 8px;border-bottom:1px solid #E7E5E4;padding-bottom:6px;">Scanned URLs <span style="color:#A8A29E;font-weight:400;font-size:11px;">· ' + surfUrls.length + '</span></h2>' +
      '<ul style="list-style:none;margin:0;padding:0;">' +
      surfUrls.map((u) => '<li style="font-family:ui-monospace,Menlo,monospace;font-size:11.5px;color:#57534E;padding:5px 0;border-bottom:1px solid #F1F0EE;word-break:break-all;">' + esc(u) + '</li>').join('') +
      '</ul>'
    : '';

  const brand = logo
    ? '<img src="' + logo + '" alt="Jikida.io" width="26" height="26" style="border-radius:6px;background:#fff;">'
    : '<b style="letter-spacing:.16em;">JIKIDA.IO</b>';

  return '<!doctype html><html><head><meta charset="utf-8"><title>Jikida.io scan — ' + esc(host) + '</title></head>' +
    '<body style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:820px;margin:0 auto;padding:32px 28px;color:#0A0A0A;">' +
    '<div style="background:#0A0A0A;color:#fff;padding:13px 18px;border-radius:11px;margin-bottom:22px;display:flex;justify-content:space-between;align-items:center;gap:10px;">' +
    '<span style="display:flex;align-items:center;gap:10px;">' + brand + '<b style="letter-spacing:.16em;">JIKIDA.IO</b></span>' +
    '<span style="color:#A8A29E;font-size:11px;">BROWSER SCAN REPORT</span></div>' +
    '<h1 style="font-size:22px;margin:0 0 4px;">' + esc(host) + '</h1>' +
    '<p style="color:#706B66;font-size:12px;margin:0 0 20px;">' + findings.length + ' findings · ' + surfUrls.length + ' URLs scanned · ' + new Date().toLocaleString() + '</p>' +
    (rows || '<p style="color:#0B7C55;">No issues found on this page.</p>') +
    urlsBlock +
    '<p style="margin-top:28px;font-size:10px;color:#A8A29E;border-top:1px solid #E7E5E4;padding-top:12px;">Generated locally by the Jikida.io browser extension. No data left your device.</p>' +
    '</body></html>';
}

async function downloadReport() {
  const host = (result && result.host) || 'page';
  const html = await buildReportHtml();
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'jikida-scan-' + host.replace(/[^a-z0-9.-]/gi, '-') + '.html';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// "Save as PDF" opens the report in a new tab and triggers the browser's print
// dialog — the user picks "Save as PDF". No PDF library needed in the extension.
async function printReport() {
  const html = await buildReportHtml();
  const withPrint = html.replace('</body>', '<script>window.onload=function(){window.print()}<\/script></body>');
  const blob = new Blob([withPrint], { type: 'text/html' });
  chrome.tabs.create({ url: URL.createObjectURL(blob) });
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'autoscan-progress') {
    $('#progressFill').style.width = Math.round((msg.done / msg.max) * 100) + '%';
    $('#progressTxt').textContent = 'Scanning ' + msg.done + ' / ' + msg.max + (msg.running ? '' : ' — done');
    if (!msg.running) {
      $('#autoBtn').disabled = false;
      // Prefer the full aggregated result (findings + accumulated surface +
      // per-page counts). If the message lost it (tab was navigating), re-fetch
      // the stored result so we never show "nothing" after a completed scan.
      if (msg.result) {
        result = msg.result;
        refresh();
      } else {
        reloadStoredResult();
      }
      setTimeout(() => { $('#progress').hidden = true; }, 1500);
    }
  }
});

// Re-fetch the saved scan result for the current origin — the safety net for a
// dropped final progress message during auto-scan (the tab navigates away and
// can suspend this listener).
async function reloadStoredResult() {
  try {
    if (!tab || !tab.url || !/^https?:/.test(tab.url)) { return; }
    const origin = new URL(tab.url).origin;
    const cached = await send({ type: 'get-result', origin });
    if (cached && cached.ok && cached.result) { result = cached.result; refresh(); }
  } catch (e) { /* leave the current view */ }
}

async function init() {
  // Wire the controls FIRST, before any await — if activeTab()/send() throws or
  // hangs (sidebar opened on a chrome:// page, before the tab is ready, or before
  // the background worker is up), the buttons/tabs still work and the panes are
  // never left blank. The whole body is wrapped so a rejection can't blank the UI.
  try {
    $('#scanBtn').addEventListener('click', scan);
    $('#autoBtn').addEventListener('click', auto);
    if ($('#exportHtml')) { $('#exportHtml').addEventListener('click', downloadReport); }
    if ($('#exportPrint')) { $('#exportPrint').addEventListener('click', printReport); }
    $$('.tab').forEach((t) => t.addEventListener('click', () => switchTab(t.dataset.tab)));
    $('#drawerBack').addEventListener('click', () => { $('#drawer').hidden = true; });
    // Always paint the default (Findings) pane so it's never blank, even if the
    // tab/cache lookup below fails.
    renderFilters(); renderFindings();
  } catch (e) { /* controls are best-effort */ }

  // If opened for a SPECIFIC scan (popup history row → ?origin=), load exactly
  // that site's report — takes priority over the active tab / latest fallback.
  try {
    const wantOrigin = new URLSearchParams(location.search).get('origin');
    if (wantOrigin) {
      let cached = null;
      try { cached = await send({ type: 'get-result', origin: wantOrigin }); } catch (e) { cached = null; }
      if (cached && cached.ok && cached.result) {
        result = cached.result;
        refresh();
        let h = ''; try { h = result.host || new URL(wantOrigin).hostname; } catch (e) { h = wantOrigin; }
        if ($('#hostChip')) { $('#hostChip').textContent = h; }
        if ($('#scanBtn')) { $('#scanBtn').disabled = true; }
        if ($('#autoBtn')) { $('#autoBtn').disabled = true; }
        return;
      }
    }
  } catch (e) { /* fall through to the tab / latest logic below */ }

  try {
    tab = await activeTab();
    const host = tab && tab.url && /^https?:/.test(tab.url) ? new URL(tab.url).hostname : null;
    if (host) {
      // Opened over a real website: show that site's cached scan (if any).
      if ($('#hostChip')) { $('#hostChip').textContent = host; }
      const origin = new URL(tab.url).origin;
      let cached = null;
      try { cached = await send({ type: 'get-result', origin }); } catch (e) { cached = null; }
      if (cached && cached.ok && cached.result) { result = cached.result; refresh(); }
      else { renderFilters(); renderFindings(); }
    } else {
      // Opened as a standalone TAB (this is the full report page — the "active
      // tab" is the extension page itself, no site). Load the MOST RECENT scan
      // from storage so the report isn't empty. The scan buttons here would have
      // no page to act on, so they're disabled with a hint to scan from the popup.
      const recent = await latestStoredResult();
      if (recent) {
        result = recent;
        refresh();
        let rHost = '';
        try { rHost = result.host || ''; } catch (e) { rHost = ''; }
        if ($('#hostChip')) { $('#hostChip').textContent = rHost || 'last scan'; }
      } else {
        renderFilters(); renderFindings();
        if ($('#hostChip')) { $('#hostChip').textContent = 'no scans yet'; }
        if ($('#scoreLine')) { $('#scoreLine').textContent = 'Scan a page from the Jikida.io popup to see it here'; }
      }
      if ($('#scanBtn')) { $('#scanBtn').disabled = true; }
      if ($('#autoBtn')) { $('#autoBtn').disabled = true; }
    }
  } catch (e) {
    // Last-resort: keep the panel usable with a clear message instead of blank.
    try {
      renderFilters(); renderFindings();
      if ($('#scoreLine')) { $('#scoreLine').textContent = 'Open a website, then click Scan'; }
      if ($('#hostChip')) { $('#hostChip').textContent = 'ready'; }
    } catch (e2) { /* nothing more we can do */ }
  }
}
init();
