"""
Jikida Python SDK — fail-open security middleware.

Wire it into your framework of choice. Talks to https://app.jikida.io/api/policy
for rule sync and https://app.jikida.io/api/attacks/ingest for attack telemetry.
Never blocks a request when Jikida is unreachable.
"""

__version__ = "0.1.0"

from .middleware import Jikida  # re-export for FastAPI: app.add_middleware(Jikida, ...)

__all__ = ["Jikida", "__version__"]
