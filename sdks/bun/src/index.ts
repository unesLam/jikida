/**
 * Jikida SDK for Bun.
 *
 * Bun runs the Node SDK natively — this package re-exports @jikida/sdk-node
 * so `import { jikida } from '@jikida/sdk-bun'` works with Bun.serve, Elysia,
 * and Hono. Same fail-open guarantee, same options, same policy contract.
 *
 *   import { jikida } from '@jikida/sdk-bun';
 *   Bun.serve({
 *     fetch(req) {
 *       const v = jikida({ token: Bun.env.JIKIDA_TOKEN }).inspect(req);
 *       if (v.blocked) return new Response(JSON.stringify({ error: v.reason }), { status: 403 });
 *       return new Response('ok');
 *     },
 *   });
 */
export * from '@jikida/sdk-node';
export { jikida } from '@jikida/sdk-node';
