import time
import uuid
import logging
from threading import Lock
from typing import Optional

logger = logging.getLogger('bean_theory.rate_limiter')

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    redis = None
    REDIS_AVAILABLE = False


class InMemoryRateLimiter:
    """Thread-safe, bounded sliding-window rate limiter in process memory."""
    def __init__(self, max_keys: int = 10000):
        self._lock = Lock()
        self._attempts = {}
        self.max_keys = max_keys

    def _prune_expired(self, now: float, window_seconds: int):
        cutoff = now - window_seconds
        keys_to_delete = [
            k for k, timestamps in self._attempts.items()
            if not timestamps or timestamps[-1] <= cutoff
        ]
        for k in keys_to_delete:
            del self._attempts[k]

    def is_rate_limited(self, key: str, max_attempts: int, window_seconds: int) -> bool:
        now = time.time()
        cutoff = now - window_seconds
        with self._lock:
            timestamps = self._attempts.get(key, [])
            valid_timestamps = [t for t in timestamps if t > cutoff]
            if valid_timestamps:
                self._attempts[key] = valid_timestamps
            elif key in self._attempts:
                del self._attempts[key]
            return len(valid_timestamps) >= max_attempts

    def get_retry_after(self, key: str, window_seconds: int) -> int:
        now = time.time()
        cutoff = now - window_seconds
        with self._lock:
            timestamps = [t for t in self._attempts.get(key, []) if t > cutoff]
            if not timestamps:
                return 0
            oldest = min(timestamps)
            return max(1, int(oldest + window_seconds - now))

    def record_attempt(self, key: str, window_seconds: int = 900):
        now = time.time()
        with self._lock:
            if len(self._attempts) >= self.max_keys and key not in self._attempts:
                self._prune_expired(now, window_seconds)
                if len(self._attempts) >= self.max_keys:
                    oldest_key = min(
                        self._attempts.keys(),
                        key=lambda k: self._attempts[k][-1] if self._attempts[k] else 0
                    )
                    del self._attempts[oldest_key]

            if key not in self._attempts:
                self._attempts[key] = []
            self._attempts[key].append(now)

    def reset(self, key: str):
        with self._lock:
            if key in self._attempts:
                del self._attempts[key]

    def clear(self):
        with self._lock:
            self._attempts.clear()


class RedisRateLimiter:
    """Distributed sliding-window rate limiter backed by Redis sorted sets."""
    def __init__(self, redis_client):
        self.client = redis_client

    def _format_key(self, key: str) -> str:
        return f"bt:rl:{key}"

    def is_rate_limited(self, key: str, max_attempts: int, window_seconds: int) -> bool:
        r_key = self._format_key(key)
        now = time.time()
        cutoff = now - window_seconds
        try:
            pipe = self.client.pipeline()
            pipe.zremrangebyscore(r_key, 0, cutoff)
            pipe.zcard(r_key)
            results = pipe.execute()
            count = results[1]
            return count >= max_attempts
        except Exception as e:
            logger.warning("Redis rate limiter check failed; falling back: %s", str(e))
            raise e

    def get_retry_after(self, key: str, window_seconds: int) -> int:
        r_key = self._format_key(key)
        now = time.time()
        cutoff = now - window_seconds
        try:
            oldest = self.client.zrange(r_key, 0, 0, withscores=True)
            if not oldest:
                return 0
            oldest_ts = oldest[0][1]
            return max(1, int(oldest_ts + window_seconds - now))
        except Exception as e:
            logger.warning("Redis get_retry_after failed: %s", str(e))
            raise e

    def record_attempt(self, key: str, window_seconds: int = 900):
        r_key = self._format_key(key)
        now = time.time()
        cutoff = now - window_seconds
        member = f"{now}:{uuid.uuid4().hex[:8]}"
        try:
            pipe = self.client.pipeline()
            pipe.zremrangebyscore(r_key, 0, cutoff)
            pipe.zadd(r_key, {member: now})
            pipe.expire(r_key, window_seconds + 60)
            pipe.execute()
        except Exception as e:
            logger.warning("Redis record_attempt failed: %s", str(e))
            raise e

    def reset(self, key: str):
        r_key = self._format_key(key)
        try:
            self.client.delete(r_key)
        except Exception as e:
            logger.warning("Redis reset failed: %s", str(e))
            raise e

    def clear(self):
        try:
            keys = self.client.keys("bt:rl:*")
            if keys:
                self.client.delete(*keys)
        except Exception as e:
            logger.warning("Redis clear failed: %s", str(e))
            raise e


class HybridRateLimiter:
    """
    Unified Rate Limiter with distributed Redis support and resilient in-memory fallback.
    Consistent across multiple WSGI workers / cluster nodes.
    """
    def __init__(self, redis_url: Optional[str] = None):
        self._memory = InMemoryRateLimiter()
        self._redis: Optional[RedisRateLimiter] = None
        self._redis_client = None
        self._redis_available = False
        if redis_url and REDIS_AVAILABLE:
            self.configure_redis(redis_url)

    def configure_redis(self, redis_url: str):
        if not REDIS_AVAILABLE:
            logger.warning("redis-py is not installed; continuing with in-memory rate limiter.")
            return
        try:
            client = redis.from_url(redis_url, socket_timeout=2.0, socket_connect_timeout=2.0)
            client.ping()
            self._redis_client = client
            self._redis = RedisRateLimiter(client)
            self._redis_available = True
            logger.info("Distributed Redis rate limiter configured successfully.")
        except Exception as e:
            logger.warning("Failed to connect to Redis at %s: %s. Using memory fallback.", redis_url, str(e))
            self._redis_available = False
            self._redis = None

    def _resolve_backend(self):
        # Lazy check from Flask current_app if not explicitly configured
        if not self._redis_available:
            try:
                from flask import current_app
                app_redis_url = current_app.config.get('REDIS_URL')
                if app_redis_url and REDIS_AVAILABLE and self._redis is None:
                    self.configure_redis(app_redis_url)
            except Exception:
                pass
        return self._redis if self._redis_available else self._memory

    def is_rate_limited(self, key: str, max_attempts: int, window_seconds: int) -> bool:
        backend = self._resolve_backend()
        if backend == self._redis:
            try:
                return backend.is_rate_limited(key, max_attempts, window_seconds)
            except Exception:
                # Resilient fallback on Redis failure
                return self._memory.is_rate_limited(key, max_attempts, window_seconds)
        return self._memory.is_rate_limited(key, max_attempts, window_seconds)

    def get_retry_after(self, key: str, window_seconds: int) -> int:
        backend = self._resolve_backend()
        if backend == self._redis:
            try:
                return backend.get_retry_after(key, window_seconds)
            except Exception:
                return self._memory.get_retry_after(key, window_seconds)
        return self._memory.get_retry_after(key, window_seconds)

    def record_attempt(self, key: str, window_seconds: int = 900):
        backend = self._resolve_backend()
        if backend == self._redis:
            try:
                backend.record_attempt(key, window_seconds)
                return
            except Exception:
                self._memory.record_attempt(key, window_seconds)
                return
        self._memory.record_attempt(key, window_seconds)

    def reset(self, key: str):
        if self._redis_available and self._redis:
            try:
                self._redis.reset(key)
            except Exception:
                pass
        self._memory.reset(key)

    def clear(self):
        if self._redis_available and self._redis:
            try:
                self._redis.clear()
            except Exception:
                pass
        self._memory.clear()


# Global rate limiter singleton
rate_limiter = HybridRateLimiter()
