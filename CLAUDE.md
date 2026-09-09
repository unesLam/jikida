# CLAUDE.md

Guidance for Claude Code and other AI assistants working in this repository.

## What this repository is

This is the public, open-source distribution for **Jikida** — a developer-first security platform (web and app pentest, code and dependency scanning, secret detection, uptime monitoring, and a managed WAF). The hosted service lives at https://jikida.io; this repo holds the client-side pieces developers install and run:

- **Language SDKs** — thin, fail-open guard clients for ten runtimes under `sdks/` (`node`, `python`, `php`, `go`, `ruby`, `java`, `rust`, `dotnet`, `bun`, `deno`).
- **CLI scanner** — `tools/scan`, a standalone template-driven scanner (SARIF and JSON output, CI fail-on gates).
- **Project init** — `tools/init`, the `@jikida/init` one-command onboarding.
- **MCP server** — `tools/mcp`, a Model Context Protocol server exposing Jikida tools to AI IDEs.
- **Agent skill** — `skills/security`, a portable skill definition.
- **WAF rule packs** — `waf-rules/`, versioned rule sets in a portable format.

The hosted application, database, billing, and scan engine are **not** in this repository.

## Core principles

These are hard constraints. Preserve them in any change.

- **Fail open, always.** A client SDK must never take down the app it protects. If Jikida is unreachable, times out, or errors, the request proceeds. Any code path that could block traffic on our failure is a bug.
- **No real exploitation.** Scanners and probes are passive or use inert, self-identifying markers. Never write code that extracts data, sends destructive HTTP methods, or performs an actual attack against a target.
- **Secrets never land in output.** Findings, logs, and reports must not echo back the credential values they detect — report the *kind* of secret and where it was found, not the secret itself. Never print or commit real tokens.
- **No incremental internal IDs.** Anything user-facing uses opaque public IDs, never raw database identifiers.

## Repository layout

```
sdks/       node/ python/ php/ go/ ruby/ java/ rust/ dotnet/ bun/ deno/
tools/      scan/    # CLI scanner (templates + engine)
            init/    # @jikida/init onboarding
            mcp/     # MCP server for AI IDEs
skills/     security/    # portable agent skill (SKILL.md + framework mappings)
waf-rules/  owasp-top10/ api-abuse/ bot-scanners/ vibe-coder/
README.md   # the developer-facing overview
```

Each package under `sdks/`, `tools/` and `skills/` is self-contained and versioned independently. Read that package's own `README.md` and manifest (`package.json`, `composer.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `*.csproj`, `*.gemspec`, `pom.xml`) before changing it.

## Development commands

Commands depend on the package you are in. Determine the toolchain from the manifest, then use its conventions:

- **Node / Bun / Deno** (`sdks/node`, `sdks/bun`, `sdks/deno`, `tools/scan`, `tools/init`, `tools/mcp`): `npm install`, `npm test`, `npm run build`.
- **Python** (`sdks/python`): install with the declared build backend, run `pytest`.
- **PHP** (`sdks/php`): `composer install`, `composer test`.
- **Go** (`sdks/go`): `go build ./...`, `go test ./...`.
- **Ruby** (`sdks/ruby`): `bundle install`, `bundle exec rspec`.
- **Java** (`sdks/java`): `mvn verify`.
- **Rust** (`sdks/rust`): `cargo build`, `cargo test`.
- **.NET** (`sdks/dotnet`): `dotnet build`, `dotnet test`.

Run only the affected package's tests. Do not add a dependency or change a published version number unless the task explicitly calls for it.

## Architecture notes

- **SDKs are thin.** An SDK collects request signals, calls the Jikida decision API, and enforces the verdict, with a short-lived local policy cache so it keeps working during a brief outage. Detection logic lives server-side; the SDK is the enforcement point. Keep added latency minimal.
- **The CLI scanner is template-driven.** Checks are declared as data (paths, regex signatures, severities), not hand-coded per check, so the hosted scanner and the CLI share one canonical signature set. When you touch a signature, keep the shared copy in sync and make sure every regex compiles.
- **The MCP server exposes a fixed tool set.** Some tools are keyless and IP-rate-limited; others require a `df_live_` token. Do not advertise a tool the server does not actually implement.

## Contributing rules for automated changes

- Every behavior change ships with a test in the same package, and that package's tests must pass before you finish.
- Match the surrounding code's style; do not reformat unrelated files.
- Do not add narration comments that explain internal reasoning in shipped client code — keep comments minimal and technical.
- When in doubt about scope, prefer the smallest correct change.

## Links

- Website: https://jikida.io
- App: https://app.jikida.io
- MCP: https://mcp.jikida.io
