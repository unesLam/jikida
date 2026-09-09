<?php

declare(strict_types=1);

namespace Jikida\Middleware;

use Closure;
use Jikida\Client;

/**
 * Laravel middleware. Wire it in bootstrap/app.php:
 *
 *   ->withMiddleware(function ($middleware) {
 *       $middleware->append(\Jikida\Middleware\JikidaLaravelMiddleware::class);
 *   })
 *
 * Bind Jikida\Client as a singleton in a service provider so the policy
 * cache and log queue survive across requests within the same process.
 */
final class JikidaLaravelMiddleware
{
    public function __construct(private readonly Client $jikida) {}

    public function handle(mixed $request, Closure $next): mixed
    {
        $verdict = $this->jikida->inspect([
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'headers' => $request->headers->all(),
            'body' => $request->getContent(),
            'ip' => $request->ip(),
        ]);

        if ($verdict['action'] === 'allow') {
            return $next($request);
        }

        if ($verdict['action'] === 'block') {
            return response()->json([
                'error' => 'blocked_by_jikida',
                'reason' => $verdict['reason'] ?? 'security_policy',
                'rule' => $verdict['rule'] ?? null,
            ], 403, [
                'X-Jikida-Verdict' => 'block',
                'X-Jikida-Rule' => $verdict['rule'] ?? '',
            ]);
        }

        return $next($request)->withHeaders([
            'X-Jikida-Verdict' => 'challenge',
            'X-Jikida-Rule' => $verdict['rule'] ?? '',
        ]);
    }
}
