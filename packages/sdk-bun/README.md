# @jikida/sdk-bun

Same as `@jikida/sdk-node` but built for Bun.serve.

## Install

```bash
bun add @jikida/sdk-node
```

## Use

`jikidaNext` inspects any Web `Request` and returns `{ blocked, reason }`, which
wires straight into `Bun.serve`:

```ts
import { jikidaNext } from '@jikida/sdk-node/next'

const inspect = jikidaNext({ token: Bun.env.JIKIDA_TOKEN! })

Bun.serve({
  fetch(req) {
    const verdict = inspect(req)
    if (verdict.blocked) {
      return new Response(JSON.stringify({ error: verdict.reason }), { status: 403 })
    }
    return new Response('hi')
  },
})
```

The Node SDK's `@jikida/sdk-node` already works under Bun. This package is a re-export
to make the discover-and-install story symmetric with other runtimes.

## Status

Alpha alias — use `@jikida/sdk-node` directly for now.

## Source

- Public repo: [github.com/unesLam/jikida](https://github.com/unesLam/jikida/tree/main/packages/sdk-bun)
- Issues: [github.com/unesLam/jikida/issues](https://github.com/unesLam/jikida/issues)
- License: MIT
- Publisher: Next Lab LLC · info@jikida.io
