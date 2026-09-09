import { JIKIDA, SEVERITY, KEYS } from '../lib/config.js';

const $ = (id) => document.getElementById(id);
let currentTab = null;
let connected = false; // signed-in Jikida.io account → all fixes unlocked
const FREE_FIXES = 2;  // fixes shown free per scan before a quiet sign-in nudge

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Resolve null if the worker doesn't answer in 8s so an await never hangs the
// popup (asleep/reloading worker). Reads lastError to silence Chrome's log.
function send(msg) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    const t = setTimeout(() => finish(null), 8000);
    try {
      chrome.runtime.sendMessage(msg, (resp) => {
        void chrome.runtime.lastError;
        clearTimeout(t); finish(resp);
      });
    } catch (e) { clearTimeout(t); finish(null); }
  });
}

function setStatus(state, line, sub) {
  $('statusDot').className = 'status-dot ' + state;
  $('statusLine').textContent = line;
  $('statusSub').textContent = sub || '';
}

// Severity → the summary bucket it counts toward.
function bucketOf(sev) {
  if (sev === 'critical' || sev === 'high') { return 'fail'; }
  if (sev === 'medium') { return 'warn'; }
  if (sev === 'info') { return 'info'; }
  return 'low';
}

function renderSummary(result) {
  const box = $('summary');
  const findings = (result && result.findings) || [];
  if (!findings.length) { box.hidden = true; return; }
  const c = { fail: 0, warn: 0, low: 0 };
  findings.forEach((f) => { const b = bucketOf(f.severity); if (c[b] !== undefined) { c[b]++; } });
  $('sumFail').textContent = c.fail;
  $('sumWarn').textContent = c.warn;
  $('sumLow').textContent = c.low;
  $('sumTotal').textContent = findings.length;
  box.hidden = false;
}

// Uptime + SSL/domain-expiry promo: shown after a scan for signed-OUT users,
// naming the scanned host (the "remembered domain"). "Connect free" deep-links
// the app's add-site flow pre-filled with that host, where monitoring turns on.
function renderMonitorPromo(result) {
  const box = $('monitorPromo');
  if (!box) { return; }
  const host = (result && result.host) || (currentTab && currentTab.url && /^https?:/.test(currentTab.url) ? new URL(currentTab.url).hostname : '');
  // Only for a real host, and only when not already signed in.
  if (!host || connected) { box.hidden = true; return; }
  $('monHost').textContent = host;
  box.hidden = false;
}

function renderFindings(result) {
  $('intro').hidden = true; // a result exists — hide the pre-scan explainer
  renderSummary(result);
  renderMonitorPromo(result);
  const ul = $('findings');
  ul.innerHTML = '';
  const findings = (result && result.findings) || [];
  const actionable = findings.filter((f) => f.severity !== 'info');
  if (!findings.length) {
    ul.innerHTML =
      '<li class="empty"><svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg><br>No issues found on this page.<br><span style="font-size:11px;color:var(--ink-3)">Scanned headers, cookies, CSP, secrets and forms.</span></li>';
    setStatus('good', 'Looks good', 'No issues on this page');
    return;
  }
  if (!actionable.length) {
    setStatus('good', 'Looks good', findings.length + ' informational note' + (findings.length > 1 ? 's' : ''));
  } else {
    setStatus('issues', actionable.length + ' issue' + (actionable.length > 1 ? 's' : '') + ' found', 'On ' + (result.host || 'this page'));
  }
  // Fixes: the first FREE_FIXES actionable findings show their fix inline for
  // free; the rest are gated behind a quiet one-line sign-in nudge (never loud).
  // A signed-in account unlocks all fixes. `fixShown` counts only actionable
  // findings that actually carry a remediation.
  let fixShown = 0;
  findings.forEach((f) => {
    const li = document.createElement('li');
    li.className = 'finding';
    const potential = !f.confirmed;
    const hasFix = !!f.remediation;
    const isActionable = f.severity !== 'info';
    const unlocked = connected || !isActionable || fixShown < FREE_FIXES;
    if (hasFix && isActionable && unlocked) { fixShown++; }
    li.innerHTML =
      '<span class="sev-bar sev-' + f.severity + '"></span>' +
      '<div class="f-body">' +
      '<div class="f-title' + (potential ? ' potential' : '') + '"></div>' +
      '<div class="f-meta">' +
      '<span class="f-tag ' + (potential ? 'potential' : 'confirmed') + '">' + (potential ? 'Needs verification' : 'Confirmed') + '</span>' +
      '<span>' + f.severity + '</span><span>' + (f.category || '') + '</span>' +
      (hasFix ? '<button class="f-fixbtn" type="button">' + (unlocked ? 'View fix' : 'Fix locked') + '</button>' : '') +
      '</div>' +
      (hasFix ? '<div class="f-fix" hidden></div>' : '') +
      '</div>';
    li.querySelector('.f-title').textContent = f.title;
    if (hasFix) {
      const fixEl = li.querySelector('.f-fix');
      const btn = li.querySelector('.f-fixbtn');
      if (unlocked) {
        fixEl.textContent = f.remediation;
        btn.addEventListener('click', () => {
          const open = fixEl.hidden;
          fixEl.hidden = !open;
          btn.textContent = open ? 'Hide fix' : 'View fix';
        });
      } else {
        // Past the 2 free fixes: the button opens the full report for THIS site
        // on app.jikida.io, where all fixes live (and sign-in / upgrade if needed).
        // Quiet, not a paywall wall — just "see all fixes" pointing at the app.
        btn.textContent = 'See all fixes →';
        btn.classList.add('f-fixbtn-app');
        btn.addEventListener('click', () => { openAppScan(); });
      }
    }
    ul.appendChild(li);
  });
}

async function scan() {
  setStatus('scanning', 'Scanning…', currentTab.url ? new URL(currentTab.url).hostname : '');
  $('scanBtn').disabled = true;
  const r = await send({ type: 'scan', tabId: currentTab.id, url: currentTab.url });
  $('scanBtn').disabled = false;
  if (r && r.ok) {
    renderFindings(r.result);
    $('viewAll').hidden = false;
  } else {
    setStatus('', 'Could not scan this page', r && r.error ? r.error : 'Restricted page (chrome:// or store).');
  }
}

async function auto() {
  $('progress').hidden = false;
  $('autoBtn').disabled = true;
  setStatus('scanning', 'Auto scanning…', 'Discovering same-origin pages');
  await send({ type: 'autoscan', max: 10 });
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'autoscan-progress') {
    const pct = Math.round((msg.done / msg.max) * 100);
    $('progressFill').style.width = pct + '%';
    $('progressTxt').textContent = 'Scanning ' + msg.done + ' / ' + msg.max + (msg.running ? '' : ' — done');
    if (!msg.running && msg.findings) {
      $('autoBtn').disabled = false;
      renderFindings({ findings: msg.findings, host: currentTab && new URL(currentTab.url).hostname });
      setTimeout(() => { $('progress').hidden = true; }, 1500);
    }
  }
});

async function init() {
  // Wire controls FIRST (before any await) so a hung tab/worker lookup can't
  // leave a dead popup. All the async work is wrapped so it can't blank the UI.
  try {
    $('scanBtn').addEventListener('click', scan);
    $('autoBtn').addEventListener('click', auto);
    $('viewAll').addEventListener('click', () => openPanel());
    $('openPanel').addEventListener('click', () => openPanel());
    $('connectBtn').addEventListener('click', () => chrome.tabs.create({ url: JIKIDA.DEVELOPER_TOKEN_URL }));
    $('monConnect').addEventListener('click', () => openAppScan());
    $('histToggle').addEventListener('click', () => {
      const list = $('histList');
      const open = list.hidden;
      list.hidden = !open;
      $('history').classList.toggle('open', open);
    });
  } catch (e) { /* best-effort */ }

  try {
    currentTab = await activeTab();
    const host = currentTab && currentTab.url && /^https?:/.test(currentTab.url) ? new URL(currentTab.url).hostname : null;
    if (!host) {
      setStatus('', 'Open a website to scan', 'This page cannot be scanned.');
      $('scanBtn').disabled = true; $('autoBtn').disabled = true;
      return;
    }
    const origin = new URL(currentTab.url).origin;
    const cached = await send({ type: 'get-result', origin });
    if (cached && cached.ok && cached.result) {
      renderFindings(cached.result);
      $('viewAll').hidden = false;
    } else {
      setStatus('', 'Ready to scan', host);
      $('intro').hidden = false; // show the "what a scan checks" explainer
    }
    await renderHistory(origin);
    const acct = await send({ type: 'account' });
    connected = !!(acct && acct.token);
    if (connected) {
      $('connectBtn').textContent = 'Jikida.io ✓';
      if (cached && cached.ok && cached.result) { renderFindings(cached.result); } // re-render with all fixes unlocked
    }
  } catch (e) {
    setStatus('', 'Ready to scan', 'Open a website, then click Scan');
  }
}

// Grouped "Recent scans" — every origin the user has scanned, newest first,
// read from the same per-origin store the background writes. Current origin is
// pinned to the top and marked. Click a row to open that origin in a tab.
async function renderHistory(currentOrigin) {
  const wrap = $('history');
  const list = $('histList');
  let store = {};
  try { store = (await chrome.storage.local.get(KEYS.RESULTS))[KEYS.RESULTS] || {}; } catch (e) { store = {}; }
  const rows = Object.entries(store)
    .map(([origin, r]) => ({ origin, r }))
    .filter((x) => x.r && Array.isArray(x.r.findings))
    .sort((a, b) => (b.r.scannedAt || 0) - (a.r.scannedAt || 0));
  if (rows.length <= 1) { wrap.hidden = true; return; }
  wrap.hidden = false;
  list.innerHTML = '';
  rows.slice(0, 12).forEach(({ origin, r }) => {
    const findings = r.findings || [];
    const high = findings.filter((f) => bucketOf(f.severity) === 'fail').length;
    const med = findings.filter((f) => bucketOf(f.severity) === 'warn').length;
    let host = origin;
    try { host = new URL(origin).hostname; } catch (e) { /* keep raw */ }
    const isCurrent = origin === currentOrigin;
    const when = r.scannedAt ? timeAgo(r.scannedAt) : '';
    const badge = high ? '<span class="h-badge fail">' + high + ' high</span>'
      : med ? '<span class="h-badge warn">' + med + ' med</span>'
        : '<span class="h-badge ok">clean</span>';
    const li = document.createElement('li');
    li.className = 'hist-item' + (isCurrent ? ' current' : '');
    li.innerHTML =
      '<span class="h-host"></span>' + badge +
      '<span class="h-when">' + when + '</span>';
    li.querySelector('.h-host').textContent = host + (isCurrent ? ' · this site' : '');
    li.title = origin;
    // Open the full REPORT for this scanned site (not just the site itself) —
    // the report page reads ?origin= and loads that scan's findings + URLs.
    li.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('sidebar/sidebar.html') + '?origin=' + encodeURIComponent(origin) });
    });
    list.appendChild(li);
  });
}

function timeAgo(ts) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) { return 'just now'; }
  const m = Math.floor(s / 60);
  if (m < 60) { return m + 'm ago'; }
  const h = Math.floor(m / 60);
  if (h < 24) { return h + 'h ago'; }
  return Math.floor(h / 24) + 'd ago';
}

// "Open full view" opens the full report page (sidebar.html) as a NORMAL browser
// TAB. We deliberately do NOT use chrome.sidePanel.open() — opening the Chrome
// side panel from a popup context is unreliable (the popup closing races the
// open() gesture), which is why it kept failing. A tab always works.
function openPanel() {
  chrome.tabs.create({ url: chrome.runtime.getURL('sidebar/sidebar.html') });
}

// Open the full report for the SCANNED site on app.jikida.io. Routes to the
// add-site flow pre-filled with this site's host (?scan=) — the app already
// reads that param (SiteController::create → prefillScan). If the user is signed
// in and the site is already added, they land on it; otherwise they add + scan
// it there. That's where ALL fixes, history and export live, plus sign-in/upgrade.
function openAppScan() {
  let host = '';
  try {
    const u = currentTab && currentTab.url ? currentTab.url : '';
    if (/^https?:/.test(u)) { host = new URL(u).hostname; }
  } catch (e) { host = ''; }
  const target = JIKIDA.ADD_SITE_URL + (host ? '?scan=' + encodeURIComponent(host) : '');
  chrome.tabs.create({ url: target });
}

init();
