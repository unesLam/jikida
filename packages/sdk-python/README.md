# jikida (Python)

Fail-open Jikida middleware for Python web apps.

## Install

```bash
pip install jikida
```

## Use — FastAPI

```python
from fastapi import FastAPI
from jikida import Jikida

app = FastAPI()
app.add_middleware(Jikida, token=os.environ["JIKIDA_TOKEN"])
```

Only the ASGI middleware (FastAPI / Starlette) ships today. Django and Flask
adapters are coming soon — there is no `jikida.django` or `jikida.flask`
module yet, so don't import them.

## Status

Scaffold — this SDK currently passes every request through and does not yet
inspect, block, cache policy, or forward attack logs. For working protection
today use the CNAME edge (point your domain at guard.jikida.io — full WAF, no
code) or the Node/PHP SDKs.

## Source

- Public repo: [github.com/unesLam/jikida](https://github.com/unesLam/jikida/tree/main/packages/sdk-python)
- Issues: [github.com/unesLam/jikida/issues](https://github.com/unesLam/jikida/issues)
- License: MIT
- Publisher: Next Lab LLC · info@jikida.io
