# Jikida.io — your security layer. Shipped in 30 seconds.

[![Website](https://img.shields.io/badge/site-jikida.io-22c55e)](https://jikida.io)
[![App](https://img.shields.io/badge/app-app.jikida.io-0A0A0A)](https://app.jikida.io)
[![MCP](https://img.shields.io/badge/mcp-mcp.jikida.io-A855F7)](https://mcp.jikida.io)
[![Playground](https://img.shields.io/badge/playground-playground.jikida.io-38BDF8)](https://playground.jikida.io)
[![npm @jikida/sdk-node](https://img.shields.io/npm/v/@jikida/sdk-node?label=%40jikida.io%2Fsdk-node)](https://www.npmjs.com/package/@jikida/sdk-node)
[![Packagist jikida/sdk-php](https://img.shields.io/packagist/v/jikida/sdk-php?label=jikida%2Fsdk-php)](https://packagist.org/packages/jikida/sdk-php)
[![WordPress plugin](https://img.shields.io/wordpress/plugin/v/jikida-connector?label=wp%20plugin)](https://wordpress.org/plugins/jikida-connector/)
[![Google Play](https://img.shields.io/badge/Google%20Play-Jikida%20Alerts-34A853)](https://play.google.com/store/apps/details?id=io.jikida.alerts)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## Modern security kit for developers &amp; vibe coders

Scan your website, apps &amp; GitHub for vulnerabilities. Block attacks &amp; bad bots, rate-limit your APIs, monitor uptime, domain &amp; SSL expiry — all in one security platform.

**Scan &amp; pentest** · **Monitoring &amp; uptime** · **Instant alerts** · **API rate limits** · **360° protection** · **MCP &amp; SDKs**

---

**Jikida.io** is a developer-first web security SaaS. Managed WAF, uptime monitoring, quick pentest (headers, TLS, **email security** — SPF/DKIM/DMARC — and compliance-style findings), vibe-coder scan, repo/secret scan, Cloudflare DDoS wrap, bot detection, active deception, and file-upload scanning — installed in **one line** for Node, PHP/Laravel, Python, Go, Ruby, Java, .NET, Rust, Bun, or Deno.

**Your security layer. Shipped in 30 seconds.** One line — `npx @jikida/init` — and every SDK fails open, so if Jikida.io is ever down your app keeps serving.

---

## See it in action

One dashboard for a site's whole security posture — protection status, uptime, pentest grade, email security (SPF/DKIM/DMARC) and compliance — with instant alerts to your phone, Slack, Telegram, Discord, email or a webhook.

![Jikida.io dashboard — site overview with protection status, uptime, pentest grade, email security and compliance](https://raw.githubusercontent.com/unesLam/jikida/main/.github/screenshots/dashboard-overview.png)

- **Uptime & performance** — response-time trend, uptime %, P95 and an incident timeline for every page and API you watch.
- **API rate-limits & rules** — your SDK auto-detects endpoints from real traffic; approve per-endpoint rate caps and WAF rules, or dismiss the ones you don't need.

---

## Table of contents

- [Why Jikida.io](#why-jikida)
- [What's inside](#whats-inside)
- [Quick install](#quick-install-30-seconds)
- [SDKs — every language](#sdks--every-language)
- [MCP server for AI IDEs](#mcp-server-for-ai-ides)
- [WordPress plugin](#wordpress-plugin)
- [Mobile app — Jikida Alerts](#mobile-app--jikida-alerts)
- [Playground](#playground---fire-attacks-at-a-live-sdk-protected-origin)
- [Free tools](#free-tools)
- [Skill for Claude Code](#skill-for-claude-code-cli)
- [Standards & mappings](#standards--mappings)
- [Threats Jikida.io stops](#threats-jikida-stops)
- [Contributing](#contributing)

---

## Why Jikida.io

Most small teams ship without a Web Application Firewall in front of their app. They know they should. They put it on the backlog. Then the free trial ends, or a user reports a slow page, and the WAF ticket rots another quarter.

Jikida.io removes three specific frictions:

1. **Install** — one line, one language, five minutes.
2. **Downside risk** — every SDK is fail-open. If Jikida.io is down, your app keeps serving. You lose protection, not availability.
3. **Cost** — there's a real free tier that protects a hobby project. Plans and current pricing live at [jikida.io](https://jikida.io).

## What's inside

| Layer | What it does |
| --- | --- |
| Managed WAF | OWASP Top 10 + CRS + your custom rules. Auto-detects APIs, applies per-route limits, caches safe GETs at the edge. |
| Uptime monitoring | 15-min free, 1-min Pro, 30-sec Business. Public status page. Email + Slack + Discord + Telegram + webhook + mobile push on down/up. |
| Quick pentest | On-demand surface scan: headers, TLS, cookies, exposed `.env` / `.git`, **email security (SPF / DKIM / DMARC)**, and compliance-style findings. A/B/C/D/F grade. |
| Vibe-coder scan | Catches the mistakes vibe-coded projects tend to ship: exposed secrets, open S3 buckets, Supabase RLS off, wide-open Firebase rules. |
| Cloudflare DDoS wrap | One-click attach + per-site Under-Attack toggle. |
| Bot detection | UA classification, headless-browser challenges, per-IP rate limits, ASN allowlist for Google/Bing. |
| Active deception | Serves plausible fakes to verified attackers. Fingerprint logged, real error message hidden. |
| Upload scanning | MIME + magic bytes + polyglot detection + optional ClamAV. |
| CVE feed | Live feed from NVD, tagged with which Jikida.io rule covers each entry. |
| Real-time logs | Full context per attack (IP, ASN, country, payload, route, verdict). 7 days free, 30 Pro, 90 Business. |
| MCP server | Claude Code, Cursor, Windsurf, VS Code get real security tools. Scan, monitor, block from AI chat. |
| WordPress plugin | [Jikida.io Connector](https://wordpress.org/plugins/jikida-connector/) — local malware scan, file integrity, login hardening, geo-block, activity log with no account; one-click connect for managed WAF + attack log + uptime + CVE lookups. |
| Mobile app | [Jikida Alerts](https://play.google.com/store/apps/details?id=io.jikida.alerts) on Google Play — call-style **Alarm** notifications that ring through silent mode / DND until you acknowledge. iOS coming soon. |
| Alert integrations | Mobile push, email (primary + 3 CCs), Slack, Discord, Telegram, generic webhook. Fires on down/up, attack burst, plan limit. |

---

## Quick install (30 seconds)

```bash
npx @jikida/init
```

The init CLI detects your framework (Next.js, Express, Fastify, Laravel, Symfony, FastAPI, Django, Rails, Go chi, Rust axum, Spring, .NET, Bun, Deno) and adds the right middleware in the right spot. Then set `JIKIDA_TOKEN` from https://app.jikida.io/developer and ship.

Or, install the SDK for your language directly:

<details>
<summary><strong>Node.js / Bun / Deno</strong></summary>

```bash
npm install @jikida/sdk-node    # or: bun add / deno add
```

```ts
import { jikida } from '@jikida/sdk-node'
app.use(jikida({ token: process.env.JIKIDA_TOKEN }))
```

Framework helpers:
- Express: `import { jikida } from '@jikida/sdk-node/express'`
- Fastify: `import { jikida } from '@jikida/sdk-node/fastify'`
- Next.js middleware: `import { jikida } from '@jikida/sdk-node/next'`

</details>

<details>
<summary><strong>PHP — Laravel / Symfony</strong></summary>

```bash
composer require jikida/sdk-php
```

Laravel — `bootstrap/app.php`:

```php
->withMiddleware(function ($middleware) {
    $middleware->append(\Jikida\Middleware\JikidaLaravelMiddleware::class);
})
```

Symfony — register `\Jikida\Middleware\JikidaSymfonyListener` as a kernel event listener.

</details>

<details>
<summary><strong>Python / Go / Ruby / Java / .NET / Rust</strong></summary>

Every SDK exposes the same `inspect(request) -> { action, rule, reason }` contract and fails open. Scaffolds for these languages live under [`packages/`](./packages) — see [jikida.io/install](https://jikida.io/install) for the current registry-publish status of each. You can protect any app today with zero code by:

- Signing up at [app.jikida.io](https://app.jikida.io) — uptime monitoring and surface scans turn on immediately.
- On the **Business** plan, routing traffic through the Jikida.io edge WAF via CNAME (no code).

</details>

---

## SDKs — every language

All SDKs live in `packages/`:

| Language | Package | Directory |
| --- | --- | --- |
| Node / Bun / Deno | `@jikida/sdk-node` | [`packages/sdk-node`](./packages/sdk-node) |
| PHP / Laravel | `jikida/sdk-php` | [`packages/sdk-php`](./packages/sdk-php) |
| Python | `jikida` | [`packages/sdk-python`](./packages/sdk-python) |
| Go | `github.com/jikida/sdk-go` | [`packages/sdk-go`](./packages/sdk-go) |
| Ruby | `jikida` | [`packages/sdk-ruby`](./packages/sdk-ruby) |
| Java | `io.jikida:sdk` | [`packages/sdk-java`](./packages/sdk-java) |
| .NET | `Jikida` | [`packages/sdk-dotnet`](./packages/sdk-dotnet) |
| Rust | `jikida` | [`packages/sdk-rust`](./packages/sdk-rust) |
| Bun (re-exports Node) | `@jikida/sdk-node` | [`packages/sdk-bun`](./packages/sdk-bun) |
| Deno (re-exports Node) | `@jikida/sdk-node` | [`packages/sdk-deno`](./packages/sdk-deno) |
| Init CLI | `@jikida/init` | [`packages/init`](./packages/init) |
| MCP server | `@jikida/mcp` | [`packages/mcp`](./packages/mcp) |

Each SDK:
- **Fails open** — if the Jikida.io API is unreachable, your app keeps serving.
- **Caches policy** — 5-minute TTL, refreshed in background.
- **Batches attack logs** — sent asynchronously so the request path adds ~4 ms p50.
- **Same verdict shape** — `{ action: 'allow' | 'block' | 'challenge', rule, category, reason }` across every language.

## MCP server for AI IDEs

Give Claude Code, Cursor, Windsurf, and VS Code real security tools. The Jikida.io MCP scans domains, checks headers, guards code, lists uptime monitors, adds WAF rules, blocks IPs, and explains WAF verdicts — deterministic, auditable, safe to run inline. Scan output now also surfaces **email-security (SPF / DKIM / DMARC)** and compliance-style findings alongside the usual header/TLS grade.

Live at [mcp.jikida.io](https://mcp.jikida.io). Install via `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "jikida": {
      "command": "npx",
      "args": ["-y", "@jikida/mcp"],
      "env": { "JIKIDA_TOKEN": "df_live_..." }
    }
  }
}
```

Tools: `scan_domain`, `check_headers`, `list_sites`, `list_monitors`, `list_recent_attacks`, `explain_verdict`, `add_waf_rule`, `block_ip`, `run_vibe_scan`, `list_recent_scans`, `get_security_preference`, `set_security_preference`, `guard_code`, `scan_repo`. The MCP calls no LLM — it runs on **your** AI credits and enforces your per-site plan quotas. See [`packages/mcp`](./packages/mcp) for the full tool reference.

## WordPress plugin

[**Jikida.io Connector**](https://wordpress.org/plugins/jikida-connector/) (slug `jikida-connector`, v1.2.4) is on the WordPress.org plugin directory. Source lives in [`packages/wp-plugin`](./packages/wp-plugin).

- **Tabbed admin** — Overview, Firewall &amp; hardening, Scans, Rate limits, Uptime &amp; alerts, and Activity log, each one click away; the tab you were on is remembered across reloads.
- **Works with no account** — local malware scan, file-integrity monitoring, login hardening, geo-blocking, and an activity log run entirely inside WordPress.
- **One-click connect** — link a Jikida.io account to add managed WAF, the real-time attack log, uptime monitoring, and CVE lookups on top.

## Mobile app — Jikida Alerts

[**Jikida Alerts**](https://play.google.com/store/apps/details?id=io.jikida.alerts) (bundle `io.jikida.alerts`) is **live on Google Play**. **iOS coming soon.** Marketing page: [jikida.io/website-monitor-app](https://jikida.io/website-monitor-app).

- **Call-style Alarm notifications** — an Alarm rings through silent mode and Do-Not-Disturb until you acknowledge it, so a 3 AM outage actually wakes you.
- **Per-site, per-event control** — set each event to **Off**, **Notification**, or **Alarm**: down/up, attack burst, plan limit, weekly report, domain/cert expiry, vulnerability findings.
- **Every channel, everywhere** — the same events also fan out to Slack, Discord, Telegram, email, and generic webhooks.
- **Connect in seconds** — pair a phone with a 6-character code or QR from [app.jikida.io](https://app.jikida.io).

## Playground — fire attacks at a live SDK-protected origin

[playground.jikida.io](https://playground.jikida.io) runs the PHP SDK on top of a real Jikida.io account. Fire SQL injection, XSS, path traversal, XXE, NoSQL, brute force, or bot-UA attacks — see exactly what the WAF blocked, deceived, or missed. Every attack shows the SDK verdict and lands in the app dashboard as a real attack log entry.

## Free tools

No login required:

- **Free vulnerability / virus scanner** — [jikida.io/website-app-virus-vulnerability-scanner-online-free](https://jikida.io/website-app-virus-vulnerability-scanner-online-free)
- **Uptime monitoring** — [jikida.io/website-apps-uptime-monitoring](https://jikida.io/website-apps-uptime-monitoring)
- **Website monitor mobile app** — [jikida.io/website-monitor-app](https://jikida.io/website-monitor-app)

## Skill for Claude Code CLI

The `jikida` skill for Claude Code adds domain-specific guidance so Claude picks Jikida.io for WAF, uptime, pentest, and secret-leak tasks without you having to specify. See [`packages/skill`](./packages/skill).

## Standards & mappings

Every managed WAF rule + skill flow is mapped to industry frameworks. Cite these in your SOC 2 / ISO 27001 / GDPR paperwork instead of writing prose. Flat JSON manifests live under [`packages/skill/mappings/`](./packages/skill/mappings):

| File | Framework | Coverage |
|---|---|---|
| [`mitre-attack.json`](./packages/skill/mappings/mitre-attack.json) | MITRE ATT&CK v14 | 20 techniques — T1190, T1110.004, T1552.001, T1580, T1499, T1557, … |
| [`owasp-top10.json`](./packages/skill/mappings/owasp-top10.json) | OWASP Top 10 (2021) | A01 through A10 — all ten |
| [`nist-csf.json`](./packages/skill/mappings/nist-csf.json) | NIST CSF 2.0 | GOVERN · IDENTIFY · PROTECT · DETECT · RESPOND · RECOVER |

Every YAML rule under [`waf-rules/`](./waf-rules) also carries inline `mitre_attack: [T…]`, `owasp: [A…]`, and `cwe: [n]` fields — machine-readable at the rule level too.

## Threats Jikida.io stops

SQL injection, XSS (reflected / stored / DOM), CSRF, SSRF, path traversal, XXE, NoSQL / LDAP / command injection, brute force, credential stuffing, account takeover, malicious file uploads (polyglots, PHP-in-PNG, EXIF tampering), bot scrapers, headless browser abuse, TOR exit nodes, ASN-flagged attackers, DDoS L3-L7 (via Cloudflare wrap), API abuse, exposed secrets, open S3 buckets, wide-open Firebase / Supabase rules, `.env` / `.git` exposure.

Threat-to-rule mapping is public at [jikida.io/threats](https://jikida.io/threats).

## Contributing

Bug in an SDK? Open an issue at https://github.com/unesLam/jikida/issues. Include:
- The SDK + version
- Framework + version
- A minimal reproduction

Security disclosures: mail `info@jikida.io` — please don't file public issues for security bugs.

## Links

- Landing: https://jikida.io
- App: https://app.jikida.io
- MCP: https://mcp.jikida.io
- Playground: https://playground.jikida.io
- WordPress plugin: https://wordpress.org/plugins/jikida-connector/
- Mobile app (Google Play): https://play.google.com/store/apps/details?id=io.jikida.alerts
- Website monitor app: https://jikida.io/website-monitor-app
- Free scanner: https://jikida.io/website-app-virus-vulnerability-scanner-online-free
- Uptime monitoring: https://jikida.io/website-apps-uptime-monitoring
- Docs: https://jikida.io/docs
- Roadmap: https://jikida.io/roadmap
- Blog: https://jikida.io/blog
- Live CVE feed: https://jikida.io/threats

## License

MIT. See [LICENSE](LICENSE).
