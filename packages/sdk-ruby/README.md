# jikida (Ruby)

Rack + Rails middleware for Jikida.

## Install

```bash
bundle add jikida
```

## Use — Rails

```ruby
# config/application.rb
config.middleware.use Jikida::Middleware, token: ENV.fetch("JIKIDA_TOKEN")
```

## Use — Sinatra / Rack

```ruby
use Jikida::Middleware, token: ENV.fetch("JIKIDA_TOKEN")
```

## Status

Scaffold — this SDK currently passes every request through and does not yet inspect, block, cache policy, or forward attack logs. For working protection today use the CNAME edge (point your domain at guard.jikida.io — full WAF, no code) or the Node/PHP SDKs.

## Source

- Public repo: [github.com/unesLam/jikida](https://github.com/unesLam/jikida/tree/main/packages/sdk-ruby)
- Issues: [github.com/unesLam/jikida/issues](https://github.com/unesLam/jikida/issues)
- License: MIT
- Publisher: Next Lab LLC · info@jikida.io
