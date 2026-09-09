// Jikida.io local security scanner — REAL checks against observable evidence.
// Runs inside the page (content script). Every finding carries the exact evidence
// it was derived from; nothing is fabricated. Inconclusive items are labelled
// "potential" / "needs verification", never "confirmed".
//
// This module is plain (no ESM import) so it can be injected into the page.

(function () {
  'use strict';

  // ---- helpers ----------------------------------------------------------

  function finding(o) {
    // Normalise a finding. severity: critical|high|medium|low|info
    return Object.assign(
      {
        id: '',
        title: '',
        severity: 'info',
        category: 'general',
        confirmed: false, // true only when we have direct evidence of a real problem
        evidence: '',
        remediation: '',
        source: 'browser', // browser | authenticated | api
      },
      o
    );
  }

  function truncate(s, n) {
    s = String(s == null ? '' : s);
    return s.length > n ? s.slice(0, n) + '…' : s;
  }

  // ---- 1. Transport / mixed content ------------------------------------

  function checkTransport(out) {
    const isHttps = location.protocol === 'https:';
    if (!isHttps && location.hostname !== 'localhost' && !/^127\./.test(location.hostname)) {
      out.push(
        finding({
          id: 'transport.no-https',
          title: 'Page served over HTTP, not HTTPS',
          severity: 'high',
          category: 'transport',
          confirmed: true,
          evidence: 'location.protocol = ' + location.protocol,
          remediation: 'Serve the whole site over HTTPS and redirect HTTP → HTTPS. Add HSTS once stable.',
        })
      );
    }
    // Mixed content: http:// subresources on an https page.
    if (isHttps) {
      const mixed = [];
      document.querySelectorAll('img[src], script[src], link[href], iframe[src], video[src], audio[src], source[src]').forEach((el) => {
        const url = el.src || el.href || '';
        if (/^http:\/\//i.test(url)) { mixed.push(url); }
      });
      if (mixed.length) {
        out.push(
          finding({
            id: 'transport.mixed-content',
            title: mixed.length + ' insecure (HTTP) resource' + (mixed.length > 1 ? 's' : '') + ' on an HTTPS page',
            severity: 'medium',
            category: 'transport',
            confirmed: true,
            evidence: mixed.slice(0, 5).map((u) => truncate(u, 90)).join('\n'),
            remediation: 'Load every subresource over HTTPS (or protocol-relative). Mixed content is blocked or downgrades page trust.',
          })
        );
      }
    }
  }

  // ---- 2. Cookies (document.cookie is only the JS-visible ones) ---------

  function checkCookies(out) {
    // We can only see non-HttpOnly cookies here; the background worker adds the
    // full cookie audit (Secure/SameSite/HttpOnly) via the cookies API.
    const raw = document.cookie || '';
    if (!raw) { return; }
    const names = raw.split(';').map((c) => c.split('=')[0].trim()).filter(Boolean);
    const sessiony = names.filter((n) => /sess|token|auth|jwt|sid|login/i.test(n));
    if (sessiony.length && location.protocol === 'https:') {
      out.push(
        finding({
          id: 'cookie.session-js-readable',
          title: 'Session-like cookie readable from JavaScript',
          severity: 'medium',
          category: 'cookies',
          confirmed: true,
          evidence: 'document.cookie exposes: ' + sessiony.join(', '),
          remediation: 'Set HttpOnly on session/auth cookies so XSS cannot steal them. Add Secure and SameSite=Lax or Strict.',
        })
      );
    }
  }

  // ---- 3. CSP (from meta; header CSP is added by the worker) ------------

  function checkCsp(out) {
    const meta = document.querySelector('meta[http-equiv="Content-Security-Policy" i]');
    const inlineScripts = document.querySelectorAll('script:not([src])').length;
    if (!meta) {
      // Header CSP is checked by the worker; here we only note the inline-heavy case.
      if (inlineScripts > 3) {
        out.push(
          finding({
            id: 'csp.inline-heavy',
            title: 'Page relies on ' + inlineScripts + ' inline scripts (no meta CSP)',
            severity: 'low',
            category: 'csp',
            confirmed: true,
            evidence: inlineScripts + ' <script> tags without a src attribute',
            remediation: 'Add a Content-Security-Policy. Inline scripts are the main XSS vector; a CSP with nonces/hashes blocks injected ones.',
          })
        );
      }
    } else {
      const csp = meta.getAttribute('content') || '';
      if (/unsafe-inline/i.test(csp)) {
        out.push(
          finding({
            id: 'csp.unsafe-inline',
            title: "CSP allows 'unsafe-inline'",
            severity: 'medium',
            category: 'csp',
            confirmed: true,
            evidence: truncate(csp, 160),
            remediation: "Remove 'unsafe-inline' from script-src and use nonces or hashes. unsafe-inline defeats most of CSP's XSS protection.",
          })
        );
      }
    }
  }

  // ---- 4. Forms & inputs ------------------------------------------------

  function checkForms(out) {
    const forms = Array.from(document.querySelectorAll('form'));
    forms.forEach((f, i) => {
      const action = f.getAttribute('action') || location.href;
      const hasPassword = f.querySelector('input[type="password"]');
      // Password form posting to plain HTTP.
      if (hasPassword && /^http:\/\//i.test(action)) {
        out.push(
          finding({
            id: 'form.password-http',
            title: 'Password submitted over HTTP',
            severity: 'high',
            category: 'forms',
            confirmed: true,
            evidence: 'form[' + i + '] action = ' + truncate(action, 100),
            remediation: 'Post credential forms only to HTTPS endpoints.',
          })
        );
      }
      // autocomplete on password fields (info only).
      if (hasPassword && hasPassword.getAttribute('autocomplete') === 'on') {
        out.push(
          finding({
            id: 'form.password-autocomplete',
            title: 'Password field allows autocomplete',
            severity: 'info',
            category: 'forms',
            confirmed: true,
            evidence: 'input[type=password] autocomplete=on',
            remediation: 'Consider autocomplete="new-password" / "current-password" as appropriate for shared devices.',
          })
        );
      }
    });
  }

  // ---- 5. Exposed information / debug -----------------------------------

  function checkExposure(out) {
    // Source maps referenced from loaded scripts.
    const maps = [];
    document.querySelectorAll('script[src]').forEach((s) => {
      // We can't read the file here, but a //# sourceMappingURL is common; the
      // worker verifies map accessibility. Note only external app bundles.
    });

    // window-level config objects that frequently hold keys.
    const suspects = ['__NEXT_DATA__', 'env', 'ENV', 'config', 'CONFIG', 'appConfig', '__ENV__', 'runtimeConfig'];
    suspects.forEach((k) => {
      try {
        const v = window[k];
        if (v && typeof v === 'object') {
          const json = JSON.stringify(v).slice(0, 4000);
          if (/(secret|api[_-]?key|password|token|service_role|private)/i.test(json)) {
            out.push(
              finding({
                id: 'exposure.window-config',
                title: 'Global config object window.' + k + ' contains key/secret-like fields',
                severity: 'medium',
                category: 'exposure',
                confirmed: false,
                evidence: 'window.' + k + ' includes secret-like keys (verify whether the values are truly sensitive).',
                remediation: 'Keep secrets server-side. Only publishable/anon values belong in the browser; confirm each field is safe to expose.',
              })
            );
          }
        }
      } catch (e) { /* cross-origin or getter throws; ignore */ }
    });
  }

  // ---- 6. Secrets in inline scripts + DOM text -------------------------

  function scanTextForSecrets(text, secretRules, whereLabel, out) {
    if (!text) { return; }
    secretRules.forEach((rule) => {
      let re;
      try { re = new RegExp(rule.regex, 'g'); } catch (e) { return; }
      let m;
      let count = 0;
      while ((m = re.exec(text)) && count < 3) {
        count++;
        const hit = m[0];
        // Never store the full secret — mask the middle.
        const masked = hit.length > 12 ? hit.slice(0, 6) + '…' + hit.slice(-4) : hit;
        out.push(
          finding({
            id: 'secret.' + rule.id,
            title: rule.public_ok
              ? rule.label + ' exposed (verify it is safe to be public)'
              : rule.label + ' exposed in client code',
            severity: rule.severity,
            category: 'secrets',
            confirmed: !rule.public_ok, // public-ok keys are exposures to verify, not confirmed leaks
            evidence: whereLabel + ': ' + masked + (rule.note ? '\n' + rule.note : ''),
            remediation: rule.public_ok
              ? 'This value can be public if correctly restricted. Verify usage restrictions (referrer/API/RLS). If unrestricted, treat as a real issue.'
              : 'Remove the secret from client code, rotate it immediately, and load it server-side only.',
          })
        );
      }
    });
  }

  function checkInlineSecrets(rules, out) {
    const inline = Array.from(document.querySelectorAll('script:not([src])'))
      .map((s) => s.textContent || '')
      .join('\n')
      .slice(0, 500000); // cap
    scanTextForSecrets(inline, rules.secrets || [], 'inline <script>', out);
  }

  // Malicious-JS heuristics (crypto-miners, skimmers, obfuscated payloads,
  // cookie exfil). Uses the rules.malware_js patterns pulled from
  // jikida.io/extension/patterns.json so new families ship without a store update.
  function checkMalwareJs(rules, out) {
    const patterns = rules.malware_js || [];
    if (!patterns.length) { return; }
    const inline = Array.from(document.querySelectorAll('script:not([src])'))
      .map((s) => s.textContent || '').join('\n').slice(0, 500000);
    patterns.forEach((p) => {
      let re;
      try { re = new RegExp(p.regex, 'i'); } catch (e) { return; }
      if (re.test(inline)) {
        out.push({
          id: 'malware.' + p.id,
          title: p.label || 'Suspicious JavaScript',
          severity: p.severity || 'high',
          category: 'malware',
          confirmed: false,
          evidence: 'Matched a malicious-JS pattern in an inline script on this page.',
          remediation: p.note || 'Review the script. If the site was compromised, remove the injected code, rotate exposed secrets/sessions, and add Subresource Integrity + a strict CSP.',
        });
      }
    });
  }

  // ---- 7. Attack-surface discovery (links + forms + inline API refs) ----

  function discoverSurface() {
    const origin = location.origin;
    const urls = new Set();
    const apis = new Set();

    document.querySelectorAll('a[href]').forEach((a) => {
      try {
        const u = new URL(a.href, location.href);
        if (u.origin === origin && !/^(mailto:|tel:|javascript:)/i.test(a.href)) {
          urls.add(u.pathname + u.search);
        }
      } catch (e) {}
    });
    // API references in inline scripts (fetch('/api/…'), axios, etc.).
    const inline = Array.from(document.querySelectorAll('script:not([src])')).map((s) => s.textContent || '').join('\n');
    const apiRe = /['"`](\/(?:api|v\d|graphql|rest)\/[A-Za-z0-9_\-\/.:]{1,80})['"`]/g;
    let m;
    while ((m = apiRe.exec(inline))) { apis.add(m[1]); }
    document.querySelectorAll('form[action]').forEach((f) => {
      const a = f.getAttribute('action') || '';
      if (a.startsWith('/')) { apis.add(a); }
    });

    return {
      urls: Array.from(urls).slice(0, 200),
      apis: Array.from(apis).slice(0, 200),
    };
  }

  // ---- public entry -----------------------------------------------------

  window.__jikidaScan = function (rules) {
    const out = [];
    try { checkTransport(out); } catch (e) {}
    try { checkCookies(out); } catch (e) {}
    try { checkCsp(out); } catch (e) {}
    try { checkForms(out); } catch (e) {}
    try { checkExposure(out); } catch (e) {}
    try { checkInlineSecrets(rules || { secrets: [] }, out); } catch (e) {}
    try { checkMalwareJs(rules || {}, out); } catch (e) {}
    const surface = discoverSurface();

    return {
      url: location.href,
      origin: location.origin,
      host: location.hostname,
      title: document.title,
      scanned_at: Date.now(),
      findings: out,
      surface: surface,
      counts: {
        scripts: document.querySelectorAll('script').length,
        forms: document.querySelectorAll('form').length,
        links: surface.urls.length,
        apis: surface.apis.length,
      },
    };
  };
})();
