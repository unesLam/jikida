# @jikida/sdk-deno

Deno-native alias for `@jikida/sdk-node`.

## Install

```bash
deno add npm:@jikida/sdk-node
```

## Use

`jikidaNext` inspects any Web `Request` and returns `{ blocked, reason }`, which
wires straight into `Deno.serve`:

```ts
import { jikidaNext } from 'npm:@jikida/sdk-node/next'

const inspect = jikidaNext({ token: Deno.env.get('JIKIDA_TOKEN')! })

Deno.serve((req) => {
  const verdict = inspect(req)
  if (verdict.blocked) {
    return new Response(JSON.stringify({ error: verdict.reason }), { status: 403 })
  }
  return new Response('hi')
})
```

## Status

Alpha alias — use `npm:@jikida/sdk-node` directly.

## Source

- Public repo: [github.com/unesLam/jikida](https://github.com/unesLam/jikida/tree/main/packages/sdk-deno)
- Issues: [github.com/unesLam/jikida/issues](https://github.com/unesLam/jikida/issues)
- License: MIT
- Publisher: Next Lab LLC · info@jikida.io
