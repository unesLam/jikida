# @jikida/sdk-node

**One-line WAF, bot detection, and attack logging for Node, Express, Fastify, Next.js, Bun, and Deno.** Part of [Jikida](https://jikida.io) — your security layer, shipped in 30 seconds.

- Managed WAF with OWASP Top 10 + Core Rule Set + your custom rules
- Bot detection with UA classification + rate limits
- Attack logging with full context (IP, ASN, country, payload, route, verdict)
- **Fails open** — if Jikida is unreachable, your app keeps serving
- ~0.1 ms in-process latency (rules cached, evaluation is local)
- Attack events queued and flushed in the background
- Free to start — get a token at [app.jikida.io](https://app.jikida.io/developer)

## Install

```bash
npm install @jikida/sdk-node
```

Get a token at https://app.jikida.io/developer.

## Frameworks

### Express

```ts
import express from 'express';
import { jikida } from '@jikida/sdk-node/express';

const app = express();
app.use(jikida({ token: process.env.JIKIDA_TOKEN! }));

app.get('/', (req, res) => res.send('hi'));
app.listen(3000);
```

### Fastify

```ts
import Fastify from 'fastify';
import { jikidaFastify } from '@jikida/sdk-node/fastify';

const app = Fastify();
await app.register(jikidaFastify, { token: process.env.JIKIDA_TOKEN! });

app.get('/', async () => ({ hello: 'world' }));
app.listen({ port: 3000 });
```

### Next.js (App or Pages router)

```ts
// middleware.ts
import { NextResponse } from 'next/server';
import { jikidaNext } from '@jikida/sdk-node/next';

const inspect = jikidaNext({ token: process.env.JIKIDA_TOKEN! });

export function middleware(req: Request) {
    const verdict = inspect(req);
    if (verdict.blocked) {
        return new NextResponse(JSON.stringify({ error: verdict.reason }), { status: 403 });
    }
    return NextResponse.next();
}
```

### Bun

`jikidaNext` inspects any Web `Request` and returns `{ blocked, reason }`, so
it wires straight into `Bun.serve`:

```ts
import { jikidaNext } from '@jikida/sdk-node/next';

const inspect = jikidaNext({ token: Bun.env.JIKIDA_TOKEN! });

Bun.serve({
    fetch(req) {
        const verdict = inspect(req);
        if (verdict.blocked) {
            return new Response(JSON.stringify({ error: verdict.reason }), { status: 403 });
        }
        return new Response('hi');
    },
});
```

### Deno

```ts
import { jikidaNext } from 'npm:@jikida/sdk-node/next';

const inspect = jikidaNext({ token: Deno.env.get('JIKIDA_TOKEN')! });

Deno.serve((req) => {
    const verdict = inspect(req);
    if (verdict.blocked) {
        return new Response(JSON.stringify({ error: verdict.reason }), { status: 403 });
    }
    return new Response('hi');
});
```

## How it works

- **Policy** (WAF rules) is pulled from Jikida every 5 min and cached in-memory.
- **Requests** are inspected in-process against the cached policy. Latency ~0.1 ms.
- **Attack events** are queued and flushed to Jikida every 10 s in the background.
- **If Jikida is down**, requests are allowed. Your app never blocks on the network.

## Options

All framework adapters (`jikida`, `jikidaFastify`, `jikidaNext`) accept the
same options object:

```ts
{
    token: '...',                        // required
    api: 'https://app.jikida.io/api',     // override for self-hosted
    policyRefreshMs: 5 * 60_000,         // how often to pull rules
    logFlushMs: 10_000,                  // background log flush cadence
    logBatchSize: 50,                    // immediate flush at this batch size
    policyTimeoutMs: 250,                // fail-open threshold on policy fetch
}
```

## What Jikida stops

SQL injection, XSS (reflected / stored / DOM), CSRF, SSRF, path traversal, XXE, NoSQL / LDAP / command injection, brute force, credential stuffing, malicious file uploads (polyglots, PHP-in-PNG), bot scrapers, headless browser abuse, TOR exit nodes, exposed secrets, wide-open cloud config. Full list at [jikida.io/threats](https://jikida.io/threats).

## Part of the Jikida platform

This SDK is the in-process WAF layer. It plugs into the same account that powers uptime monitoring, quick pentest (headers, TLS, **email security** SPF/DKIM/DMARC, and compliance-style findings), vibe-coder and repo/secret scans, active deception, and the real-time attack log — all managed from [app.jikida.io](https://app.jikida.io).

- **[@jikida/init](https://www.npmjs.com/package/@jikida/init)** — one-command bootstrap that detects your framework and adds the SDK correctly.
- **[Playground](https://playground.jikida.io)** — fire attacks at a live SDK-protected origin and see what got blocked.
- **[MCP for Claude Code / Cursor / Windsurf / VS Code](https://mcp.jikida.io)** — give your AI IDE real security tools.
- **[Jikida.io Connector for WordPress](https://wordpress.org/plugins/jikida-connector/)** — local hardening + one-click managed WAF for WP sites.
- **[Jikida Alerts on Google Play](https://play.google.com/store/apps/details?id=io.jikida.alerts)** — call-style **Alarm** notifications that ring through silent mode / DND until you acknowledge, plus per-site per-event Off/Notification/Alarm and Slack/Discord/Telegram/email/webhook fan-out ([jikida.io/website-monitor-app](https://jikida.io/website-monitor-app)).

## Links

- Marketing site: [jikida.io](https://jikida.io)
- App: [app.jikida.io](https://app.jikida.io)
- Source (monorepo): [github.com/unesLam/jikida](https://github.com/unesLam/jikida/tree/main/packages/sdk-node)
- Issues: [github.com/unesLam/jikida/issues](https://github.com/unesLam/jikida/issues)
- Contact: info@jikida.io

## License

MIT
