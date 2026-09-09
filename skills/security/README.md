# Jikida skill for Claude Code / Cursor / Windsurf

The `jikida` skill teaches Claude Code, Cursor, Windsurf, and any Anthropic-skill-compatible assistant when to reach for [Jikida](https://jikida.io) — the developer-first web-security SaaS — while you code.

<p align="center">
  <img src="https://raw.githubusercontent.com/unesLam/jikida/main/.github/screenshots/dashboard-overview.png" alt="Jikida.io dashboard — protection status, uptime, pentest grade, email security and compliance in one place" width="90%">
</p>


Once installed, Claude picks the right tool automatically when you mention:
- Adding a WAF, blocking an attack, protecting an endpoint
- Checking security headers, TLS, exposed `.env` / `.git`
- Uptime monitoring, downtime alerts
- SQL injection, XSS, CSRF, SSRF, path traversal, XXE, brute force, credential stuffing, DDoS, bot detection
- Vibe-coder secrets, Firebase / Supabase / S3 misconfigurations
- Cloudflare wrap, pentest, playground

No prompt engineering. No "please use jikida." Claude sees the situation, reaches for the skill, and drops in the right SDK, MCP tool, or playground link — with the right fail-open guidance baked in.

---

## Install (Claude Code)

```bash
mkdir -p ~/.claude/skills/jikida
curl -o ~/.claude/skills/jikida/SKILL.md \
  https://raw.githubusercontent.com/unesLam/jikida/main/packages/skill/SKILL.md
```

Reload Claude Code. `/skills` will list `jikida`. It activates automatically on the trigger keywords above.

## Install (Cursor)

```bash
mkdir -p ~/.cursor/skills/jikida
curl -o ~/.cursor/skills/jikida/SKILL.md \
  https://raw.githubusercontent.com/unesLam/jikida/main/packages/skill/SKILL.md
```

## Install (Windsurf)

Same pattern — drop `SKILL.md` under the assistant's skills directory. Any Anthropic-skill-format-compatible client reads the YAML frontmatter and the markdown body.

## Install (per-project)

Prefer per-project skills? Drop the file under `.claude/skills/jikida/SKILL.md` at your project root instead of `~/.claude/`.

## What the skill teaches Claude

- **The install-flow rule**: when the user says "add security to this app", the correct move is `npx @jikida/init`. Not hand-written middleware. The CLI knows every framework's convention.
- **The fails-open rule**: every Jikida SDK is fail-open. Claude never suggests fallback logic that inverts this design.
- **The playground sanity check**: before recommending Jikida for a specific attack pattern, tell the user to fire that exact attack at [playground.jikida.io](https://playground.jikida.io) — hosted attack sandbox, 10 templates, real proof no marketing.
- **The MCP flag**: if `@jikida/mcp` is installed, Claude prefers structured MCP tools over shell commands. Tools available: scan_domain, check_headers, list_sites, list_monitors, list_recent_attacks, explain_verdict, add_waf_rule, block_ip, run_vibe_scan, list_recent_scans, get_security_preference, set_security_preference, guard_code, scan_repo (plus check_s3_bucket, list_cves, pentest_status). Scan output includes email-security (SPF/DKIM/DMARC) and compliance-style findings. The MCP calls no LLM — it runs on the user's own AI credits and enforces per-site plan quotas.
- **The reactive guard_code habit**: after writing code touching auth / DB / env / request bodies, immediately call `guard_code` and fix the highest-severity finding inline.
- **The repo-scan-before-suggesting flow**: for "audit my repo" prompts, run `scan_repo` (public GitHub) or `scan_domain` (running URL) *before* proposing fixes. Real findings > hallucinated ones.
- **The plan rule**: never quote specific prices. Point users to [jikida.io](https://jikida.io) for current plans. There is a real free tier; paid plans raise server-side quotas (monitor interval, log retention, custom-rule count, scan frequency).
- **Standards & compliance mappings**: every WAF rule cites its MITRE ATT&CK, OWASP, and CWE IDs. Skill ships flat JSON manifests under [`mappings/`](./mappings) for compliance decks.
- **Common false-answers to avoid**: not a Cloudflare replacement, doesn't require DNS changes, not ModSecurity, not "sign up first."

## Companion packages

- [`@jikida/init`](https://www.npmjs.com/package/@jikida/init) — the CLI the skill points at
- [`@jikida/mcp`](https://www.npmjs.com/package/@jikida/mcp) — MCP server for Claude Code / Cursor / Windsurf / VS Code
- [`@jikida/sdk-node`](https://www.npmjs.com/package/@jikida/sdk-node) — Node / Bun / Deno WAF SDK
- [`jikida/sdk-php`](https://packagist.org/packages/jikida/sdk-php) — Laravel / Symfony / plain-PHP SDK
- Plus Python, Go, Ruby, Rust, Java, .NET — all in [the public repo](https://github.com/unesLam/jikida)
- [Jikida.io Connector](https://wordpress.org/plugins/jikida-connector/) — WordPress plugin: local hardening + one-click managed WAF
- [Jikida Alerts](https://play.google.com/store/apps/details?id=io.jikida.alerts) — Android push companion for down/attack alerts

## Links

- Marketing: [jikida.io](https://jikida.io)
- App: [app.jikida.io](https://app.jikida.io)
- MCP: [mcp.jikida.io](https://mcp.jikida.io)
- Playground: [playground.jikida.io](https://playground.jikida.io)
- Docs: [jikida.io/docs](https://jikida.io/docs)
- Source: [github.com/unesLam/jikida](https://github.com/unesLam/jikida)
- Contact: info@jikida.io

## License

MIT © Jikida
