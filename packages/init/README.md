# @jikida/init

**The one-command way to add pentest scans, code scanning, uptime monitoring and a managed firewall to any app.** No config files. No DevOps ticket. `npx @jikida/init` detects your framework, adds the right SDK, wires the middleware, and prints your next step — all in about 30 seconds.

```bash
npx @jikida/init
```

Free to start. Powered by [Jikida](https://jikida.io) — the security layer built for indie developers, vibe coders, AI-first shipping teams, and small startups shipping fast.

[![Website](https://img.shields.io/badge/site-jikida.io-22c55e)](https://jikida.io)
[![App](https://img.shields.io/badge/app-app.jikida.io-0A0A0A)](https://app.jikida.io)
[![MCP](https://img.shields.io/badge/mcp-mcp.jikida.io-A855F7)](https://mcp.jikida.io)
[![Playground](https://img.shields.io/badge/playground-playground.jikida.io-38BDF8)](https://playground.jikida.io)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

<p align="center">
  <img src="https://raw.githubusercontent.com/unesLam/jikida/main/.github/screenshots/dashboard-overview.png" alt="Jikida.io dashboard — one place for protection status, uptime, pentest grade, email security and compliance, with instant phone alerts" width="90%">
</p>

---

## Table of contents

- [Why this exists](#why-this-exists)
- [What Jikida protects against](#what-jikida-protects-against)
- [What `@jikida/init` actually does](#what-jikida-init-actually-does)
- [Quick start](#quick-start)
- [Framework support](#framework-support)
- [How the underlying SDK works](#how-the-underlying-sdk-works)
- [Comparison with other tools](#comparison-with-other-tools)
- [Uptime monitoring, alerts, pentest, vibe-coder scan](#everything-else-you-get)
- [MCP server for Claude Code, Cursor, Windsurf, VS Code](#mcp-server-for-ai-ides)
- [Playground: live attack sandbox](#live-sdk-playground)
- [Frequently asked questions](#frequently-asked-questions)
- [If you already have a Jikida account](#if-you-already-have-a-jikida-account)
- [Companion packages](#companion-packages)
- [Links](#links)
- [License](#license)

---

## Why this exists

Small teams ship without a Web Application Firewall in front of their app because the friction is real:

1. Enterprise WAFs (AWS WAF, Cloudflare Enterprise, Imperva, F5) are priced for enterprise teams and take days to onboard
2. Cloud provider defaults stop L3/L4 DDoS but not SQL injection, XSS, credential stuffing, exposed `.env` files, or the twenty other things that actually take down small sites
3. Every "install a WAF" backlog ticket rots for another quarter

Jikida removes the friction. `@jikida/init` is the front door: **one command, every framework, zero config**.

## What Jikida protects against

Every OWASP Top 10 category, plus the modern attacks that actually hit sites shipped fast:

| Category | Attacks blocked |
|---|---|
| **Injection** | SQL injection (classic + blind + time-based), NoSQL injection, LDAP filter injection, command injection, XPath, template injection |
| **Cross-site scripting** | Reflected, stored, DOM-based, mXSS, SVG payloads, event-handler injection |
| **Authentication attacks** | Brute force, credential stuffing (HIBP-backed), account takeover, session fixation |
| **Broken access control** | Path traversal (`../`, `%2e%2e%2f`, Unicode variants), IDOR probes, admin-panel enumeration |
| **Security misconfiguration** | Exposed `.env`, `.git/config`, `wp-config.php`, `.aws/credentials`, wide-open Firebase / Supabase rules, public S3 buckets |
| **Server-side attacks** | SSRF, XXE (XML external entity), deserialization, log4shell-style JNDI |
| **Cross-site + CSRF** | Origin mismatch, missing-token detection, cookie flag misuse |
| **File uploads** | Polyglots, PHP-in-PNG, EXIF tampering, MIME sniffing tricks, optional ClamAV integration |
| **Bots + scrapers** | TLS fingerprinting (JA4), headless browser detection, sqlmap / Nikto / Nuclei UA signatures, behavioral baselines |
| **DDoS L3/L7** | Cloudflare wrap with one-click per-site Under-Attack toggle |
| **API abuse** | Per-endpoint rate limits, per-account velocity limits, ASN + country allowlists |
| **Malicious ASNs** | TOR exit nodes, known-bad ASNs, spam infrastructure |

Full threat-to-rule map with links to the CVEs / research behind each rule: [jikida.io/threats](https://jikida.io/threats).

## What `@jikida/init` actually does

When you run `npx @jikida/init` in a project directory:

| Step | Action |
|---|---|
| 1 | Reads `next.config.*`, `package.json`, `artisan`, `composer.json` / `symfony.lock`, or `manage.py` / `main.py` / `app.py` to detect your framework |
| 2 | Picks the right SDK — `@jikida/sdk-node` (Node) and `jikida/sdk-php` (PHP) are published today; Python, Go, Ruby, Rust, Java, and .NET SDKs are in development |
| 3 | Installs the SDK with `npm` (Node) or `composer` (PHP); for Python it prints the `pip install jikida` command to run yourself |
| 4 | For Next.js, writes `middleware.ts`; for every other framework it prints the middleware/listener snippet to paste into your wire-up file |
| 5 | Uses `process.env.JIKIDA_TOKEN` in the wire-up — never a hardcoded secret |
| 6 | Appends a `JIKIDA_TOKEN=` stub to your `.env` |
| 7 | Prints a clear next-step checklist so you know exactly what remains |

**Idempotent.** Re-running skips steps already done — an existing `middleware.ts` is left untouched and a `.env` that already has `JIKIDA_TOKEN` is left as-is.

## Quick start

```bash
# 1. Bootstrap
npx @jikida/init

# 2. Sign up (or log in) at https://app.jikida.io
#    Copy your JIKIDA_TOKEN from the Developer tab

# 3. Paste into .env
JIKIDA_TOKEN=df_live_...

# 4. Deploy. That's it.
```

**Token format**: `df_live_` prefix + 40 random characters. Get it at [app.jikida.io/developer](https://app.jikida.io/developer).

## Framework support

`@jikida/init` auto-detects and wires the frameworks below. For everything else it prints the manual install snippet and exits.

**Node.js / TypeScript** — installs `@jikida/sdk-node`

| Framework | Detected by | Wire-up |
|---|---|---|
| Next.js (App + Pages router) | `next.config.*` or `next` dep | Writes `middleware.ts` |
| Express | `express` dep in `package.json` | Prints the `app.use(jikida(...))` snippet |
| Fastify | `fastify` dep in `package.json` | Prints the `app.register(jikidaFastify, ...)` snippet |

**PHP** — installs `jikida/sdk-php`

| Framework | Detected by | Wire-up |
|---|---|---|
| Laravel | `artisan` + `composer.json` | Prints the `bootstrap/app.php` middleware snippet |
| Symfony | `symfony/framework-bundle` in `composer.json` or `symfony.lock` | Prints the `services.yaml` listener snippet |

**Python** — prints install + wiring instructions (SDK not auto-installed)

| Framework | Detected by | Wire-up |
|---|---|---|
| Django | `manage.py` | Prints `pip install jikida` + docs link |
| FastAPI | `FastAPI` in `main.py` / `app.py` | Prints `pip install jikida` + docs link |
| Flask | `Flask` in `main.py` / `app.py` | Prints `pip install jikida` + docs link |

If your framework isn't detected, `@jikida/init` prints the manual install commands (`npm i @jikida/sdk-node`, `composer require jikida/sdk-php`, or `pip install jikida`) and a link to the docs so you can wire it yourself.

## How the underlying SDK works

Every Jikida SDK — regardless of language — follows the same three-part contract:

1. **Fetches WAF policy** — pulls your rules from `https://app.jikida.io/api/policy` every 5 minutes and caches them in-process. Zero per-request network calls.
2. **Inspects the request** — in-process, against the cached policy. Latency: **~0.1 ms per request**. If a rule matches, the SDK returns `{ action: 'allow' | 'block' | 'challenge', rule, reason, category }`.
3. **Logs attacks async** — hits get queued in-memory and batch-flushed to `https://app.jikida.io/api/attacks/ingest` every 10 seconds (or when the batch hits 50 events). Your request never blocks on log I/O.

**Fails open.** If Jikida's API is unreachable — degraded network, our incident, whatever — the SDK returns `allow` for every request. Your app keeps serving traffic. You lose protection during the outage, not availability. This is a deliberate design choice: a WAF that takes your site down when *it* has a bad day is worse than no WAF.

## Comparison with other tools

Different tools solve different parts of the problem. Here's how Jikida fits with what you probably already have:

| Feature | Jikida | Cloudflare WAF | AWS WAF | ModSecurity | Vercel Firewall |
|---|---|---|---|---|---|
| Install command | `npx @jikida/init` | Change nameservers | Terraform + rule wiring | Recompile nginx/apache | Vercel-only |
| Setup time | ~30 seconds | Hours | Days | Days | Minutes |
| Language coverage | 10 SDKs, same API | Any (edge) | Any (edge) | Any (server) | Node only |
| Custom rules from your IDE | ✅ via MCP | Dashboard only | Terraform | Config files | Dashboard only |
| Attack log per site | ✅ 7-90 day retention | Enterprise plan | ✅ (CloudWatch) | Log files | Basic |
| Public status page | ✅ built-in | Extra plan | Extra service | ❌ | ❌ |
| Uptime monitoring included | ✅ 30s-15min | ❌ | ❌ | ❌ | ❌ |
| Pentest scanner included | ✅ | ❌ | ❌ | ❌ | ❌ |
| Vibe-coder / secret scanner | ✅ | ❌ | ❌ | ❌ | ❌ |
| Real free tier for real projects | ✅ | Free plan basic | Pay per request | Free (self-host) | Included |
| Fails open on our incident | ✅ by design | N/A (edge) | N/A (edge) | Config-dependent | Yes |
| MCP for AI IDEs | ✅ | ❌ | ❌ | ❌ | ❌ |

**Jikida complements Cloudflare** — most Jikida customers run both. Cloudflare handles L3/L4 DDoS + TLS termination at the edge. Jikida runs in your app process (or optionally at our edge via CNAME) doing L7 rule matching, deception, custom rules, and detailed logging.

## Everything else you get

`@jikida/init` gets you the WAF SDK. Your Jikida account also gets you, automatically, per site added:

**Uptime monitoring**

- Auto-created when you add a site — no forms
- Check interval scales with your plan: from 15 min on the free tier down to 30 sec on higher plans
- Latency tier per check: Fast (< 300 ms), OK (< 900 ms), Slow (< 2 s), Bad (≥ 2 s)
- Only 2xx/3xx counts as up — no "warning" state on a 500 for two hours
- Public status page every site gets, embeddable
- Alerts to email (1 primary + up to 3 CCs), Slack, Telegram, or generic webhook
- Down/up + slow-response notifications with a **probable-cause** paragraph tailored to the HTTP status seen ("HTTP 522 → Cloudflare could not reach origin — usually origin down or firewall")
- Anti-spam send policy: max 2 emails per outage (initial + still-down-24h), then silent until recovery

**Quick pentest scanner**

- Grade A-F on TLS, headers, cookies, exposed `.env` / `.git`, WordPress probes, common misconfigurations
- One-click from your dashboard, or auto-run weekly (Sunday 3 AM)
- Monthly scan count scales with your plan (unlimited on higher plans)

**Vibe-coder scan**

- Catches mistakes AI-generated projects tend to ship: hardcoded secrets, open S3 buckets, Supabase RLS off, wide-open Firebase rules, committed `.env`
- Auto-run weekly (Monday 4 AM)
- Monthly scan count scales with your plan (unlimited on higher plans)

**Live CVE feed**

- Pulled from NVD every 6 hours
- Each CVE tagged with which Jikida WAF rule covers it

## MCP server for AI IDEs

Jikida ships an official [Model Context Protocol](https://modelcontextprotocol.io) server that plugs into **Claude Code, Cursor, Windsurf, and VS Code Copilot**. Once installed, your AI coding tool gets six new tools:

| Tool | What it does |
|---|---|
| `scan_domain(url)` | Quick pentest surface scan of any public URL |
| `check_headers(url)` | TLS grade, HSTS, CSP, cookie flags, common exposures |
| `list_sites()` | Every site under your Jikida account with plan + status |
| `list_monitors()` | Uptime monitors + latest status |
| `list_recent_attacks(hours=24)` | Attacks blocked / deceived / allowed in a window |
| `explain_verdict(rule_id)` | Plain-English explanation of what a WAF rule catches |

Install via `~/.claude/mcp.json`:

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

Now Claude can say *"hey, this endpoint you just wrote has an SQL injection surface — want me to add a WAF rule for it?"* and *actually do it* against your real Jikida account, in your IDE, no context switch.

## Live SDK playground

[playground.jikida.io](https://playground.jikida.io) is a hosted attack sandbox running the PHP SDK in front of a real Jikida paid-tier account. Fire SQL injection, XSS, path traversal, XXE, NoSQL, brute force, or bot-UA attacks at it — the response tells you exactly what the WAF blocked, deceived, or missed. Every attack is logged in the dashboard as a real event. Rate-limited so you can't abuse it.

Perfect for evaluating whether Jikida would catch the specific attack pattern you're worried about before you install it.

## Frequently asked questions

<details>
<summary><strong>Does this replace Cloudflare?</strong></summary>

No — it complements it. Cloudflare handles L3/L4 DDoS + TLS termination at the edge. Jikida runs in your app process (or optionally at our edge via CNAME) doing L7 rule matching, custom rules, deception, and detailed logging. Most Jikida customers run both.
</details>

<details>
<summary><strong>Does it work on Vercel / Netlify / Cloudflare Pages / Deno Deploy?</strong></summary>

Yes. The Node SDK ships an Edge-compatible build. `@jikida/init` detects the platform and installs the right variant.
</details>

<details>
<summary><strong>Will it slow down my app?</strong></summary>

~0.1 ms per request in-process. Rule evaluation is local — no network call on the hot path. Policy is refreshed every 5 minutes in the background. Attack logs are batched and flushed asynchronously.
</details>

<details>
<summary><strong>What happens if Jikida goes down?</strong></summary>

Every request is allowed. You lose protection until we recover. Your site keeps serving traffic. This is deliberate — a WAF that takes your site down when *it* has a bad day is worse than no WAF.
</details>

<details>
<summary><strong>How does the token get to production?</strong></summary>

Same way you handle any secret. Add `JIKIDA_TOKEN` in Vercel/Netlify/Fly/Railway/Heroku dashboard, or your infra's env-var mechanism. Never commit it. The `@jikida/init` CLI writes a `JIKIDA_TOKEN=` stub to `.env` with a placeholder value for you to replace — never a real secret.
</details>

<details>
<summary><strong>Can I self-host Jikida?</strong></summary>

The SDK accepts a custom `api` URL. Point it at your own policy + ingest endpoints. Self-host guide is in the docs.
</details>

<details>
<summary><strong>What framework was Jikida built with?</strong></summary>

The app is Laravel 12 + PHP 8.4 + MariaDB, deployed on our own infrastructure. The SDKs are hand-written per language — no framework bloat, no runtime dependencies beyond the language's standard HTTP client.
</details>

<details>
<summary><strong>Is the source public?</strong></summary>

Every SDK is MIT-licensed and public: [github.com/unesLam/jikida](https://github.com/unesLam/jikida). The core Jikida app (WAF engine, dashboard, billing) is closed-source but the SDKs, MCP server, docs, and this CLI are all open.
</details>

<details>
<summary><strong>Do you sell my data?</strong></summary>

No. Attack logs stay in your account, tied to your plan's retention window. We do not sell, share, or aggregate for third parties. The [privacy policy](https://jikida.io/privacy) lists every third party we touch (Stripe for billing, Cloudflare for DDoS wrap on Pro+, N0C for email delivery).
</details>

<details>
<summary><strong>How do I remove Jikida?</strong></summary>

Delete the middleware line the CLI added, then uninstall the SDK (`npm rm @jikida/sdk-node` or `composer remove jikida/sdk-php`). Your app keeps working.
</details>

## If you already have a Jikida account

`@jikida/init` doesn't require you to sign up first — you can install the SDK and grab a token later. But if you already have an account:

1. Bootstrap runs the same way: `npx @jikida/init`
2. When prompted, paste your existing `df_live_...` token
3. The site auto-registers in your dashboard on the first request
4. You get real-time attack logs immediately

If you have **multiple sites**, the token you use determines which account the traffic gets attributed to. One token per account; sites are distinguished by the `Host` header of each request.

If you're on **Pro or Max**, unlock:
- Custom WAF rules editor at [app.jikida.io](https://app.jikida.io)
- CNAME edge proxying (put Jikida in front of your origin at the DNS level)
- Slack Connect for direct alerts to a shared channel
- 30/90-day log retention
- MCP integration for Claude Code / Cursor / Windsurf / VS Code

## Companion packages

| Package | Registry | Language | Status |
|---|---|---|---|
| [`@jikida/sdk-node`](https://www.npmjs.com/package/@jikida/sdk-node) | npm | Node / Bun / Deno | ✅ published |
| [`jikida/sdk-php`](https://packagist.org/packages/jikida/sdk-php) | Packagist | PHP 8.2+ | ✅ published |
| [`@jikida/mcp`](https://www.npmjs.com/package/@jikida/mcp) | npm | MCP server (any client) | ✅ published |
| `jikida` | PyPI | Python 3.10+ | 🚧 in development |
| `github.com/jikida/sdk-go` | Go modules | Go 1.21+ | 🚧 in development |
| `jikida` | RubyGems | Ruby 3.0+ | 🚧 in development |
| `jikida` | crates.io | Rust 1.75+ | 🚧 in development |
| `io.jikida:sdk` | Maven Central | Java 17+ | 🚧 in development |
| `Jikida` | NuGet | .NET 8+ | 🚧 in development |

Beyond the SDKs, Jikida also ships the [**Jikida.io Connector**](https://wordpress.org/plugins/jikida-connector/) WordPress plugin (local hardening + one-click managed WAF) and the [**Jikida Alerts**](https://play.google.com/store/apps/details?id=io.jikida.alerts) Android app (push the moment a site goes down or is attacked).

## Links

- **Marketing**: [jikida.io](https://jikida.io)
- **App / dashboard**: [app.jikida.io](https://app.jikida.io)
- **MCP server**: [mcp.jikida.io](https://mcp.jikida.io)
- **Playground (attack sandbox)**: [playground.jikida.io](https://playground.jikida.io)
- **WordPress plugin**: [Jikida.io Connector](https://wordpress.org/plugins/jikida-connector/)
- **Mobile app (Google Play)**: [Jikida Alerts](https://play.google.com/store/apps/details?id=io.jikida.alerts)
- **Documentation**: [jikida.io/docs](https://jikida.io/docs)
- **Uptime monitoring**: [jikida.io/uptime](https://jikida.io/uptime)
- **Threat coverage map**: [jikida.io/threats](https://jikida.io/threats)
- **Live CVE feed**: [jikida.io/threats](https://jikida.io/threats)
- **Blog**: [jikida.io/blog](https://jikida.io/blog)
- **Public source (SDKs + MCP + docs)**: [github.com/unesLam/jikida](https://github.com/unesLam/jikida)
- **Issues**: [github.com/unesLam/jikida/issues](https://github.com/unesLam/jikida/issues)
- **Contact**: info@jikida.io
- **Enterprise inquiry**: [jikida.io/enterprise](https://jikida.io/enterprise)

## How Jikida.io compares

Most teams run four or five tools. Jikida.io puts them in one account and one install line.

| | **Jikida.io** | Nuclei | Snyk | GitGuardian | UptimeRobot |
|---|:---:|:---:|:---:|:---:|:---:|
| Web pentest (surface + deep) | ✅ | ✅ | ⚠️ | ❌ | ❌ |
| Live-CVE dependency scan (OSV) | ✅ | ❌ | ✅ | ❌ | ❌ |
| Committed-secret / repo scan | ✅ | ❌ | ✅ | ✅ | ❌ |
| Malicious-package feed (auto-update) | ✅ | ❌ | ⚠️ | ❌ | ❌ |
| Uptime + SSL + domain monitoring | ✅ | ❌ | ❌ | ❌ | ✅ |
| MCP tools for AI editors | ✅ (18) | ❌ | ⚠️ | ❌ | ❌ |
| One-line install (`npx @jikida/init`) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Managed WAF + rate limits | ✅ | ❌ | ❌ | ❌ | ❌ |

## License

MIT. Free for commercial use. See [LICENSE](https://github.com/unesLam/jikida/blob/main/LICENSE).

---

### Keywords for npm and search engines

`security` `WAF` `web application firewall` `DDoS protection` `bot detection` `uptime monitoring` `pentest` `security SaaS` `OWASP` `OWASP Top 10` `SQL injection` `XSS` `brute force` `credential stuffing` `account takeover` `CSRF` `SSRF` `XXE` `NoSQL injection` `path traversal` `deception` `honeypot` `upload scanning` `file upload security` `Cloudflare wrap` `edge security` `vibe coder security` `AI-first security` `Claude Code security` `Cursor security` `Windsurf security` `MCP` `Model Context Protocol` `indie developer security` `small team security` `Next.js security` `Laravel security` `Symfony security` `Django security` `FastAPI security` `Rails security` `Express security` `Fastify security` `Nuxt security` `SvelteKit security` `Astro security` `Vercel security` `Netlify security` `Bun security` `Deno security` `Node security` `PHP security` `Python security` `Go security` `Ruby security` `Rust security` `Java security` `.NET security`
