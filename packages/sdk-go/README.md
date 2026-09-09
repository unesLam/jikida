# jikida (Go)

Fail-open Jikida middleware for Go web frameworks.

## Install

```bash
go get github.com/jikida/sdk-go
```

## Use — net/http (works with chi and any net/http router)

```go
import "github.com/jikida/sdk-go"

r := chi.NewRouter()
r.Use(jikida.Middleware(jikida.Config{
    Token: os.Getenv("JIKIDA_TOKEN"),
}))
```

## Status

Scaffold — this SDK currently passes every request through and does not yet inspect, block, cache policy, or forward attack logs. For working protection today use the CNAME edge (point your domain at guard.jikida.io — full WAF, no code) or the Node/PHP SDKs.

## Source

- Public repo: [github.com/unesLam/jikida](https://github.com/unesLam/jikida/tree/main/packages/sdk-go)
- Issues: [github.com/unesLam/jikida/issues](https://github.com/unesLam/jikida/issues)
- License: MIT
- Publisher: Next Lab LLC · info@jikida.io
