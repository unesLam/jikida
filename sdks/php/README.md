# jikida/sdk-php

**One-line WAF, bot detection, and attack logging for PHP — Laravel, Symfony, and plain PHP apps.** Part of [Jikida](https://jikida.io) — the security layer for indie devs, vibe coders, and shipping teams.

- Managed WAF with OWASP Top 10 + Core Rule Set + your custom rules
- Bot detection with UA classification + rate limits
- Attack logging with full context (IP, ASN, country, payload, route, verdict)
- **Fails open** — if Jikida is unreachable, your app keeps serving
- ~0.1 ms in-process latency (rules cached, evaluation is local)
- Attack events queued and flushed asynchronously
- Free to start — get a token at [app.jikida.io](https://app.jikida.io/developer)
- Requires PHP 8.2+ (works great on 8.4)

## Install

```bash
composer require jikida/sdk-php
```

Get a token at https://app.jikida.io/developer, then set `JIKIDA_TOKEN` in `.env`.

## Laravel

Register the client as a singleton in a service provider:

```php
use Jikida\Client;

$this->app->singleton(Client::class, fn () => new Client(config('services.jikida.token')));
```

Append the middleware in `bootstrap/app.php`:

```php
->withMiddleware(function ($middleware) {
    $middleware->append(\Jikida\Middleware\JikidaLaravelMiddleware::class);
})
```

Add to `config/services.php`:

```php
'jikida' => [
    'token' => env('JIKIDA_TOKEN'),
],
```

## Symfony

Register the client and listener in `config/services.yaml`:

```yaml
services:
    Jikida\Client:
        arguments:
            $token: '%env(JIKIDA_TOKEN)%'

    Jikida\Middleware\JikidaSymfonyListener:
        arguments: ['@Jikida\Client']
        tags:
            - { name: kernel.event_subscriber }
```

## Plain PHP

```php
require __DIR__ . '/vendor/autoload.php';

$client = new \Jikida\Client(getenv('JIKIDA_TOKEN'));
$verdict = $client->inspect([
    'method' => $_SERVER['REQUEST_METHOD'],
    'url' => 'https://'.$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'],
    'headers' => getallheaders() ?: [],
    'body' => file_get_contents('php://input') ?: '',
    'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
]);

if ($verdict['action'] === 'block') {
    http_response_code(403);
    echo json_encode(['blocked' => true, 'reason' => $verdict['reason'] ?? null]);
    exit;
}
```

## Options

```php
new Jikida\Client(
    token: 'df_live_...',
    api: 'https://app.jikida.io/api',    // override for self-hosted
    policyRefreshSeconds: 300,           // pull rules every 5 min
    logBatchSize: 50,                    // flush at this many events
    policyTimeoutSeconds: 1.0,           // fail-open threshold on policy fetch
);
```

## How it works

- **Policy** (WAF rules) pulled from Jikida every 5 min, cached in memory.
- **Requests** inspected in-process. Latency ~0.1 ms.
- **Attack events** queued in-memory, flushed at batch size or client destruction.
- **If Jikida is down**, requests are allowed. Your app never blocks.

## What Jikida stops

SQL injection, XSS (reflected / stored / DOM), CSRF, SSRF, path traversal, XXE, NoSQL / LDAP / command injection, brute force, credential stuffing, malicious file uploads (polyglots, PHP-in-PNG), bot scrapers, headless browser abuse, TOR exit nodes, exposed secrets, wide-open cloud config. Full list at [jikida.io/threats](https://jikida.io/threats).

## Part of the Jikida platform

This SDK is the in-process WAF layer. It plugs into the same account that powers uptime monitoring, quick pentest (headers, TLS, **email security** SPF/DKIM/DMARC, and compliance-style findings), vibe-coder and repo/secret scans, active deception, and the real-time attack log — all managed from [app.jikida.io](https://app.jikida.io).

- **[@jikida/init](https://www.npmjs.com/package/@jikida/init)** — one-command bootstrap that detects your framework and adds the SDK correctly.
- **[Playground](https://playground.jikida.io)** — fire attacks at a live PHP-SDK-protected origin and see what got blocked.
- **[MCP for Claude Code / Cursor / Windsurf / VS Code](https://mcp.jikida.io)** — give your AI IDE real security tools.
- **[Jikida.io Connector for WordPress](https://wordpress.org/plugins/jikida-connector/)** — local hardening + one-click managed WAF, live on WordPress.org.
- **[Jikida Alerts on Google Play](https://play.google.com/store/apps/details?id=io.jikida.alerts)** — call-style **Alarm** notifications that ring through silent mode / DND until you acknowledge ([jikida.io/website-monitor-app](https://jikida.io/website-monitor-app)).

## Links

- Marketing site: [jikida.io](https://jikida.io)
- App: [app.jikida.io](https://app.jikida.io)
- Source (monorepo): [github.com/unesLam/jikida](https://github.com/unesLam/jikida/tree/main/packages/sdk-php)
- Issues: [github.com/unesLam/jikida/issues](https://github.com/unesLam/jikida/issues)
- Packagist: [packagist.org/packages/jikida/sdk-php](https://packagist.org/packages/jikida/sdk-php)
- Contact: info@jikida.io

## License

MIT
