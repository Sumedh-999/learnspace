"""Access gate and per-IP rate limiting.

Deliberately dependency-free and in-memory. Render's free tier runs a single
worker (WEB_CONCURRENCY=1), so a process-local counter is accurate. If you
ever scale to multiple workers this needs to move to Redis — the counters
would otherwise be per-worker and the real limit would be N times higher.
"""
import os
import time
from collections import defaultdict, deque

from fastapi import Header, HTTPException, Request

ACCESS_CODE = os.getenv("ACCESS_CODE", "").strip()

# endpoint class -> (max calls, window seconds)
LIMITS = {
    "chat": (25, 3600),      # 25 messages an hour
    "upload": (5, 3600),     # 5 documents an hour
}

_hits: dict[tuple[str, str], deque] = defaultdict(deque)


def _client_ip(request: Request) -> str:
    """Render sits behind a proxy, so the socket IP is the proxy's."""
    fwd = request.headers.get("x-forwarded-for", "")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def check_code(x_access_code: str | None = Header(default=None)):
    """Dependency: reject requests without the shared code.

    If ACCESS_CODE is unset the gate is open — keeps local dev frictionless.
    """
    if not ACCESS_CODE:
        return
    if (x_access_code or "").strip() != ACCESS_CODE:
        raise HTTPException(401, "An access code is required to use LearnBot.")


def rate_limit(kind: str):
    """Dependency factory: per-IP sliding window for one endpoint class."""
    cap, window = LIMITS[kind]

    async def _check(request: Request):
        ip = _client_ip(request)
        now = time.time()
        log = _hits[(kind, ip)]

        while log and now - log[0] > window:
            log.popleft()

        if len(log) >= cap:
            wait = int(window - (now - log[0]))
            mins = max(1, wait // 60)
            raise HTTPException(
                429,
                f"That's {cap} requests in an hour — the demo limit. "
                f"Try again in about {mins} minute{'s' if mins != 1 else ''}.",
            )

        log.append(now)

        # opportunistic cleanup so idle IPs don't accumulate forever
        if len(_hits) > 500:
            stale = [k for k, v in _hits.items() if not v or now - v[-1] > window]
            for k in stale:
                _hits.pop(k, None)

    return _check
