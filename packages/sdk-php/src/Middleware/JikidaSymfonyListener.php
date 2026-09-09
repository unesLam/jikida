<?php

declare(strict_types=1);

namespace Jikida\Middleware;

use Jikida\Client;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Symfony HttpKernel listener. Register in services.yaml:
 *
 *   Jikida\Middleware\JikidaSymfonyListener:
 *       arguments: ['@Jikida\Client']
 *       tags:
 *           - { name: kernel.event_subscriber }
 */
final class JikidaSymfonyListener implements EventSubscriberInterface
{
    public function __construct(private readonly Client $jikida) {}

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onRequest', 32],
        ];
    }

    public function onRequest(RequestEvent $event): void
    {
        if (! $event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();

        $verdict = $this->jikida->inspect([
            'method' => $request->getMethod(),
            'url' => $request->getUri(),
            'headers' => $request->headers->all(),
            'body' => $request->getContent(),
            'ip' => $request->getClientIp(),
        ]);

        if ($verdict['action'] === 'block') {
            $event->setResponse(new JsonResponse(
                [
                    'error' => 'blocked_by_jikida',
                    'reason' => $verdict['reason'] ?? 'security_policy',
                    'rule' => $verdict['rule'] ?? null,
                ],
                403,
                [
                    'X-Jikida-Verdict' => 'block',
                    'X-Jikida-Rule' => $verdict['rule'] ?? '',
                ]
            ));
        }
    }
}
