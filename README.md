<p align="center">
  <img src="https://raw.githubusercontent.com/unesLam/jikida/main/.github/guardian.png" alt="Jikida guardian" width="220">
</p>

# Web &amp; App Pentest, Security &amp; Code Scanning

> **Jikida.io — your security layer. Shipped in 30 seconds.** Security for AI IDEs, agentic coding, and vibe-coded apps.

[![Website](https://img.shields.io/badge/site-jikida.io-22c55e)](https://jikida.io)
[![App](https://img.shields.io/badge/app-app.jikida.io-0A0A0A)](https://app.jikida.io)
[![MCP](https://img.shields.io/badge/mcp-mcp.jikida.io-A855F7)](https://mcp.jikida.io)
[![npm @jikida/sdk-node](https://img.shields.io/npm/v/@jikida/sdk-node?label=%40jikida.io%2Fsdk-node)](https://www.npmjs.com/package/@jikida/sdk-node)
[![Packagist jikida/sdk-php](https://img.shields.io/packagist/v/jikida/sdk-php?label=jikida%2Fsdk-php)](https://packagist.org/packages/jikida/sdk-php)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

**Install it, scan it, or plug it into your AI editor:**

```bash
npx @jikida/init      # add the SDK + protection to your app in 30 seconds
npx @jikida/scan      # pentest any site or repo from your terminal
npx -y @jikida/mcp    # security tools inside Claude Code, Cursor, Windsurf
```

<pre><code><span style="color:#E01F26">     ██ ██ ██  ██ ██ █████   ████
     ██ ██ ██ ██  ██ ██  ██ ██  ██
     ██ ██ ████   ██ ██  ██ ██████
  ██ ██ ██ ██ ██  ██ ██  ██ ██  ██
   ███  ██ ██  ██ ██ █████  ██  ██</span>
 pentest · repo scan · uptime · alerts        https://jikida.io

 → scanning example.com …
 ✓ 41 checks · grade B (88/100)

   CRITICAL  Exposed .env file            /.env                 CWE-538
   CRITICAL  Stripe secret key in JS      /app.js:1204          CWE-312
   HIGH      Missing Content-Security-Policy                    CWE-693
   MEDIUM    Cookie without Secure flag   session               CWE-614

 Every finding has a fix. Full report: https://app.jikida.io
</code></pre>

## Pentest &amp; scan for developers, AI IDEs &amp; vibe coders

Pentest and scan websites, web apps, code and GitHub for vulnerabilities and exposed keys. Secure vibe-coded apps, monitor uptime, SSL and domains, and rate-limit APIs. One platform.

**Website &amp; app pentest** · **Code &amp; repo scan** · **Deep pentest** · **MCP for AI IDEs** · **Agentic &amp; vibe-coded security** · **SDKs**

---

**Jikida.io** is a developer-first security platform. The core is **pentest and scanning**: it pentests your live website and app, scans your code and connected GitHub/GitLab/Bitbucket repos for exposed secrets and vulnerable dependencies, runs a deeper authenticated pentest, and plugs into your **AI IDE** (Claude Code, Cursor, Windsurf) over **MCP** so it guides agentic and vibe-coded work to write secure code and catches mistakes before they ship. Uptime, SSL &amp; domain monitoring, a managed WAF, and a compliance generator come bundled as complementary extras — installed in **one line** for Node, PHP/Laravel, Python, Go, Ruby, Java, .NET, Rust, Bun, or Deno.

**Your security layer. Shipped in 30 seconds.** One line — `npx @jikida/init` — and every SDK fails open, so if Jikida.io is ever down your app keeps serving.

### Get started — pick your entry point

Every command below sits in its own copy box. Lines that start with `!` are notes, not commands — do not copy those.

**Scan a URL or repo** — no account needed.

```bash
npx @jikida/scan https://your-app.com
```

! Scan a local repo for committed secrets:

```bash
npx @jikida/scan ./
```

**Add the WAF + SDK** — auto-detects your framework.

```bash
npx @jikida/init
```

**Install a language SDK** — Node shown; PHP, Python, Go and the rest are in the [SDK table](#sdks--every-language).

```bash
npm install @jikida/sdk-node
```

**MCP server** for Claude Code, Cursor and Windsurf — add this to `~/.claude/mcp.json`:

```json
{ "mcpServers": { "jikida": { "command": "npx", "args": ["-y", "@jikida/mcp"] } } }
```

**Agent skill** — copy [`skills/security/SKILL.md`](./skills/security/SKILL.md) into your assistant's skills folder (`.claude/skills/`, Cursor rules, and the like).

Full details for each are below.

### Where things live

| Folder | What it holds |
| --- | --- |
| [`sdks/`](./sdks) | Ten language SDKs — Node, PHP, Python, Go, Ruby, Java, .NET, Rust, Bun, Deno. |
| [`tools/`](./tools) | The `scan` CLI, the `init` onboarding CLI, and the `mcp` server. |
| [`skills/`](./skills) | The Jikida agent skill for Claude Code, Cursor and Windsurf. |
| [`waf-rules/`](./waf-rules) | Versioned WAF rule packs (OWASP Top 10, API abuse, bot scanners, vibe-coder). |

Get a token at [app.jikida.io/developer](https://app.jikida.io/developer). Set it as `JIKIDA_TOKEN`.

---

## See it in action

One dashboard for a site's whole security posture — protection status, uptime, pentest grade, email security (SPF/DKIM/DMARC) and compliance — with instant alerts to your phone, Slack, Telegram, Discord, email or a webhook.

![Jikida.io dashboard — site overview with protection status, uptime, pentest grade, email security and compliance](https://raw.githubusercontent.com/unesLam/jikida/main/.github/screenshots/dashboard-overview.png)

- **Uptime & performance** — response-time trend, uptime %, P95 and an incident timeline for every page and API you watch.
- **API rate-limits & rules** — your SDK auto-detects endpoints from real traffic; approve per-endpoint rate caps and WAF rules, or dismiss the ones you don't need.

---

## Table of contents

- [Why Jikida.io](#why-jikida)
- [How access works](#how-access-works--free-then-account-gated-then-plan-gated)
- [How it compares](#how-it-compares)
- [What's inside](#whats-inside)
- [Quick install](#quick-install-30-seconds)
- [SDKs — every language](#sdks--every-language)
- [MCP server for AI IDEs](#mcp-server-for-ai-ides)
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

## How access works — free, then account-gated, then plan-gated

Everything in this repo is open source, and a lot of Jikida.io is usable before you ever sign up. The model is three tiers of friction, on purpose:

- **Free, no account.** The SDKs, the WAF rule packs, the CLI scanner and four MCP tools (`scan_domain`, `check_headers`, `guard_code`, `check_s3_bucket`) run with no login at all — rate-limited by IP. You can protect an app or scan a URL in one command and never create an account. This is the open-source, try-it-now surface.
- **Account-gated (still free).** Sign up — no card — and the hosted layer turns on: uptime monitoring, one live-site pentest, one repo scan, a basic managed WAF, mobile push, a public status page. This is where a hobby project actually gets protected. The free tier is deliberately useful, not a teaser.
- **Plan-gated.** The deep, repeated and heavy work sits behind a plan: scheduled deep pentests, the source-to-exploit crawl, more monitors at faster intervals, higher scan quotas, the CNAME edge WAF, team seats and longer log retention. Current caps and pricing live at [jikida.io/pricing](https://jikida.io/pricing) — plans start at **$19/mo billed yearly**.

The MCP server never calls an LLM: it runs on **your** AI credits and enforces the same per-site quotas, so the tier you're on is the tier the AI editor gets. Open where it helps, gated where it costs — usable first, paid when it's worth paying for.

## How it compares

A quick, honest sketch of where Jikida.io sits next to tools you may already know. Each is genuinely good at what it does; Jikida.io bundles the app-layer pieces a small team would otherwise wire together, and hosts them so there is nothing to run yourself.

**Against the platforms and CI scanners:**

| | **Jikida.io** | **Cloudflare** | **Snyk** | **UptimeRobot** |
| --- | --- | --- | --- | --- |
| Managed WAF | Yes, app-layer + custom rules | Yes, network edge | No | No |
| On-demand pentest & site scan | Yes | No | No | No |
| Repo / code & dependency scan | Yes | No | Yes | No |
| Uptime + SSL / domain expiry | Yes | Partial | No | Yes |
| MCP server for AI editors | Yes | No | No | No |
| One-line SDK, fails open | Yes | N/A (DNS/proxy) | N/A (CI) | N/A |
| Free tier | Yes | Yes | Yes | Yes |

Runs happily *behind* Cloudflare, and complements a CI scanner like Snyk rather than replacing it.

**Against the open-source scanners and AI pentesters:**

The strongest open-source security tools — Nuclei, Strix, Shannon — are deep but narrow: pentest-only, and you self-host them. Nuclei is a template scanner you drive from the terminal. Strix and Shannon are autonomous AI pentesters that run real proof-of-concept exploits, but you host them (Strix in Docker) and bring your own LLM key. None of them protect anything at runtime.

| | **Jikida.io** | **Nuclei** | **Strix** | **Shannon** |
| --- | --- | --- | --- | --- |
| Live-app pentest with real exploit | Yes | Match-only, no exploit | Yes, PoC | Yes, PoC-or-discard |
| Source → attack-path analysis | Adopting | No | Yes | Yes, core |
| Repo secret + CVE (OSV) scan | Yes | No | Partial | Dependencies |
| Managed WAF (runtime protection) | Yes | No | No | No |
| Uptime + SSL / domain monitoring | Yes | No | No | No |
| Hosted — no Docker, no self-host | Yes | Cloud tier | No | No |
| Runs with **no LLM key of your own** | Yes, on our credits | Yes (no AI) | No, BYOK | No, BYOK |
| One-line install for non-experts | Yes | CLI | Docker | npx, BYOK |
| MCP tools in your AI editor | Yes | No | No | Via Claude |

Where they win is raw exploitation depth, and we are [closing that gap](https://jikida.io/compare) with a source-to-exploit deep pentest. Where Jikida.io already wins is everything around it: hosted with no setup, a real pentest that runs **without your own LLM key**, plus a managed WAF, uptime and repo scanning the pentest-only tools skip — all in one account with a free tier. Full breakdowns at [jikida.io/compare/nuclei-alternative](https://jikida.io/compare/nuclei-alternative), [strix-alternative](https://jikida.io/compare/strix-alternative) and [shannon-alternative](https://jikida.io/compare/shannon-alternative).

## What's inside

| Layer | What it does |
| --- | --- |
| Managed WAF | OWASP Top 10 + CRS + your custom rules. Auto-detects APIs, applies per-route limits, caches safe GETs at the edge. |
| Uptime monitoring | Multi-region checks, faster intervals on higher plans. Public status page. Email + Slack + Discord + Telegram + webhook + mobile push on down/up. |
| Quick pentest | On-demand surface scan: headers, TLS, cookies, exposed `.env` / `.git`, **email security (SPF / DKIM / DMARC)**, and compliance-style findings, each with a clear fix. |
| Vibe-coder scan | Catches the mistakes vibe-coded projects tend to ship: exposed secrets, open S3 buckets, Supabase RLS off, wide-open Firebase rules. |
| Cloudflare DDoS wrap | One-click attach + per-site Under-Attack toggle. |
| Bot detection | UA classification, headless-browser challenges, per-IP rate limits, ASN allowlist for Google/Bing. |
| Active deception | Serves plausible fakes to verified attackers. Fingerprint logged, real error message hidden. |
| Upload scanning | MIME + magic bytes + polyglot detection + optional ClamAV. |
| CVE feed | Live feed from NVD, tagged with which Jikida.io rule covers each entry. |
| Real-time logs | Full context per attack (IP, ASN, country, payload, route, verdict). Retention grows with your plan. |
| MCP server | Claude Code, Cursor, Windsurf, VS Code get real security tools. Scan, monitor, block from AI chat. |
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

Every SDK exposes the same `inspect(request) -> { action, rule, reason }` contract and fails open. Scaffolds for these languages live under the `sdks/`, `tools/` and `skills/` folders — see [jikida.io/install](https://jikida.io/install) for the current registry-publish status of each. You can protect any app today with zero code by:

- Signing up at [app.jikida.io](https://app.jikida.io) — uptime monitoring and surface scans turn on immediately.
- On the **Max** plan, routing traffic through the Jikida.io edge WAF via CNAME (no code).

</details>

---

## SDKs — every language

All SDKs live in `sdks/`. The CLI, init and MCP tools live in `tools/`:

| Language | Package | Directory |
| --- | --- | --- |
| Node / Bun / Deno | `@jikida/sdk-node` | [`sdks/node`](./sdks/node) |
| PHP / Laravel | `jikida/sdk-php` | [`sdks/php`](./sdks/php) |
| Python | `jikida` | [`sdks/python`](./sdks/python) |
| Go | `github.com/jikida/sdk-go` | [`sdks/go`](./sdks/go) |
| Ruby | `jikida` | [`sdks/ruby`](./sdks/ruby) |
| Java | `io.jikida:sdk` | [`sdks/java`](./sdks/java) |
| .NET | `Jikida` | [`sdks/dotnet`](./sdks/dotnet) |
| Rust | `jikida` | [`sdks/rust`](./sdks/rust) |
| Bun (re-exports Node) | `@jikida/sdk-node` | [`sdks/bun`](./sdks/bun) |
| Deno (re-exports Node) | `@jikida/sdk-node` | [`sdks/deno`](./sdks/deno) |
| Scanner CLI | `@jikida/scan` | [`tools/scan`](./tools/scan) |
| Init CLI | `@jikida/init` | [`tools/init`](./tools/init) |
| MCP server | `@jikida/mcp` | [`tools/mcp`](./tools/mcp) |
| WAF rule packs | — | [`waf-rules`](./waf-rules) |

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
      "env": { "JIKIDA_TOKEN": "jk_live_..." }
    }
  }
}
```

Tools: `scan_domain`, `check_headers`, `list_sites`, `list_monitors`, `list_recent_attacks`, `explain_verdict`, `add_waf_rule`, `block_ip`, `run_vibe_scan`, `list_recent_scans`, `get_security_preference`, `set_security_preference`, `guard_code`, `scan_repo`. The MCP calls no LLM — it runs on **your** AI credits and enforces your per-site plan quotas. See [`tools/mcp`](./tools/mcp) for the full tool reference.

## Free tools

No login required:

- **Free vulnerability / virus scanner** — [jikida.io/website-app-virus-vulnerability-scanner-online-free](https://jikida.io/website-app-virus-vulnerability-scanner-online-free)
- **Uptime monitoring** — [jikida.io/website-apps-uptime-monitoring](https://jikida.io/website-apps-uptime-monitoring)
- **Website monitor mobile app** — [jikida.io/website-monitor-app](https://jikida.io/website-monitor-app)

## Skill for Claude Code CLI (Anthropic Agent Skill)

The `jikida` skill is an Anthropic-format Agent Skill — drop it in `.claude/skills/` and Claude Code auto-loads Jikida's security guidance. It adds domain-specific guidance so Claude picks Jikida.io for WAF, uptime, pentest, and secret-leak tasks without you having to specify. See [`skills/security`](./skills/security).

## Standards & mappings

Every managed WAF rule + skill flow is mapped to industry frameworks. Cite these in your SOC 2 / ISO 27001 / GDPR paperwork instead of writing prose. Flat JSON manifests live under [`skills/security/mappings/`](./skills/security/mappings):

| File | Framework | Coverage |
|---|---|---|
| [`mitre-attack.json`](./skills/security/mappings/mitre-attack.json) | MITRE ATT&CK v14 | 20 techniques — T1190, T1110.004, T1552.001, T1580, T1499, T1557, … |
| [`owasp-top10.json`](./skills/security/mappings/owasp-top10.json) | OWASP Top 10 (2021) | A01 through A10 — all ten |
| [`nist-csf.json`](./skills/security/mappings/nist-csf.json) | NIST CSF 2.0 | GOVERN · IDENTIFY · PROTECT · DETECT · RESPOND · RECOVER |

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
- Free scanner: https://jikida.io/website-app-virus-vulnerability-scanner-online-free
- Uptime monitoring: https://jikida.io/website-apps-uptime-monitoring
- Docs: https://jikida.io/docs
- Live CVE feed: https://jikida.io/threats

## License

MIT. See [LICENSE](LICENSE).
