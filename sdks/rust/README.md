# jikida (Rust)

Tower layer for axum, warp, actix. Fail-open Jikida middleware.

## Install

```toml
[dependencies]
jikida = "0.2"
```

## Use — axum

```rust
use axum::Router;
use jikida::JikidaLayer;

let app = Router::new()
    .layer(JikidaLayer::new(env::var("JIKIDA_TOKEN")?));
```

## Status

Scaffold — this SDK currently passes every request through and does not yet inspect, block, cache policy, or forward attack logs. For working protection today use the CNAME edge (point your domain at guard.jikida.io — full WAF, no code) or the Node/PHP SDKs.

## Source

- Public repo: [github.com/unesLam/jikida](https://github.com/unesLam/jikida/tree/main/packages/sdk-rust)
- Issues: [github.com/unesLam/jikida/issues](https://github.com/unesLam/jikida/issues)
- License: MIT
- Publisher: Next Lab LLC · info@jikida.io
