/**
 * Fastify plugin:
 *
 *   import Fastify from 'fastify';
 *   import { jikidaFastify } from '@jikida/sdk-node/fastify';
 *
 *   const app = Fastify();
 *   await app.register(jikidaFastify, { token: process.env.JIKIDA_TOKEN! });
 */

import { JikidaClient, initJikida, type JikidaOptions } from './index.js';

interface FastifyRequest {
    method: string;
    url: string;
    headers: Record<string, string | string[] | undefined>;
    body?: unknown;
    ip?: string;
}

interface FastifyReply {
    header: (name: string, value: string) => FastifyReply;
    code: (status: number) => FastifyReply;
    send: (body: unknown) => void;
}

interface FastifyInstance {
    addHook: (name: string, handler: (req: FastifyRequest, reply: FastifyReply) => Promise<void>) => void;
}

export async function jikidaFastify(app: FastifyInstance, options: JikidaOptions | { client: JikidaClient }): Promise<void> {
    const client = 'client' in options ? options.client : initJikida(options);

    app.addHook('onRequest', async (req, reply) => {
        const verdict = client.inspect({
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: req.body,
            ip: req.ip,
        });

        if (verdict.action === 'allow') {
            return;
        }

        reply.header('X-Jikida-Verdict', verdict.action);
        if (verdict.rule) {
            reply.header('X-Jikida-Rule', verdict.rule.id);
        }

        if (verdict.action === 'block') {
            reply.code(403).send({ error: 'blocked_by_jikida', reason: verdict.reason ?? 'security_policy' });
        }
    });
}
