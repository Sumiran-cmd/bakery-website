"""
Production Configuration, Security Headers, Health Probes, and Rate Limiter Test Suite.
Verifies production safeguards, rejection of insecure defaults, health probe responses,
and sliding-window rate limiting behavior.
"""
import unittest
import os
from unittest.mock import patch, MagicMock
from app import create_app
from app.extensions import db
from app.services.rate_limiter import HybridRateLimiter, InMemoryRateLimiter
from config import ProductionConfig, DevelopmentConfig, TestingConfig


class ProductionConfigTestCase(unittest.TestCase):
    def test_production_rejects_missing_secret_key(self):
        with patch.dict(os.environ, {'SECRET_KEY': '', 'JWT_SECRET_KEY': 'strong-jwt-secret-key-32-chars-minimum!', 'DATABASE_URL': 'postgresql://u:p@db:5432/d', 'FRONTEND_URL': 'https://beantheory.com.np'}):
            with self.assertRaises(RuntimeError) as ctx:
                app = create_app('production')
            self.assertIn("SECRET_KEY", str(ctx.exception))

    def test_production_rejects_short_secret_key(self):
        with patch.dict(os.environ, {'SECRET_KEY': 'short', 'JWT_SECRET_KEY': 'strong-jwt-secret-key-32-chars-minimum!', 'DATABASE_URL': 'postgresql://u:p@db:5432/d', 'FRONTEND_URL': 'https://beantheory.com.np'}):
            with self.assertRaises(RuntimeError) as ctx:
                app = create_app('production')
            self.assertIn("at least 32 characters", str(ctx.exception))

    def test_production_rejects_dev_secret_key(self):
        with patch.dict(os.environ, {'SECRET_KEY': 'dev-secret-key-bean-theory-change-in-production', 'JWT_SECRET_KEY': 'strong-jwt-secret-key-32-chars-minimum!', 'DATABASE_URL': 'postgresql://u:p@db:5432/d', 'FRONTEND_URL': 'https://beantheory.com.np'}):
            with self.assertRaises(RuntimeError) as ctx:
                app = create_app('production')
            self.assertIn("insecure keyword", str(ctx.exception))

    def test_production_rejects_sqlite(self):
        with patch.dict(os.environ, {
            'SECRET_KEY': 'a-very-strong-prod-key-with-high-entropy-xyz!',
            'JWT_SECRET_KEY': 'different-strong-prod-jwt-key-entropy-xyz!',
            'DATABASE_URL': 'sqlite:///bean_theory.db',
            'FRONTEND_URL': 'https://beantheory.com.np'
        }):
            with self.assertRaises(RuntimeError) as ctx:
                app = create_app('production')
            self.assertIn("SQLite is strictly prohibited in production", str(ctx.exception))

    def test_production_rejects_localhost_frontend_url(self):
        with patch.dict(os.environ, {
            'SECRET_KEY': 'a-very-strong-prod-key-with-high-entropy-xyz!',
            'JWT_SECRET_KEY': 'different-strong-prod-jwt-key-entropy-xyz!',
            'DATABASE_URL': 'postgresql://user:pass@dbhost:5432/production_db',
            'FRONTEND_URL': 'http://localhost:5173'
        }):
            with self.assertRaises(RuntimeError) as ctx:
                app = create_app('production')
            self.assertIn("FRONTEND_URL must not point to localhost in production", str(ctx.exception))

    def test_production_rejects_identical_keys(self):
        identical = 'a-very-strong-prod-key-with-high-entropy-xyz-abc!'
        with patch.dict(os.environ, {
            'SECRET_KEY': identical,
            'JWT_SECRET_KEY': identical,
            'DATABASE_URL': 'postgresql://user:pass@dbhost:5432/production_db',
            'FRONTEND_URL': 'https://beantheory.com.np'
        }):
            with self.assertRaises(RuntimeError) as ctx:
                app = create_app('production')
            self.assertIn("JWT_SECRET_KEY must be distinct from SECRET_KEY", str(ctx.exception))


class HealthAndSecurityHeadersTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app('testing')
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_health_liveness(self):
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get('status'), 'ok')
        self.assertTrue(data.get('live'))

    def test_health_readiness_connected(self):
        res = self.client.get('/api/health/ready')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get('status'), 'ready')
        self.assertEqual(data.get('database'), 'connected')

    def test_security_headers_present(self):
        res = self.client.get('/api/health')
        self.assertEqual(res.headers.get('X-Content-Type-Options'), 'nosniff')
        self.assertEqual(res.headers.get('X-Frame-Options'), 'DENY')
        self.assertEqual(res.headers.get('Referrer-Policy'), 'strict-origin-when-cross-origin')
        self.assertIn('geolocation=()', res.headers.get('Permissions-Policy', ''))


class RateLimiterTestCase(unittest.TestCase):
    def test_in_memory_rate_limiting(self):
        limiter = InMemoryRateLimiter(max_keys=100)
        key = "test_user_key"

        # Record 3 attempts within 60-second window
        for _ in range(3):
            self.assertFalse(limiter.is_rate_limited(key, max_attempts=3, window_seconds=60))
            limiter.record_attempt(key, window_seconds=60)

        # 4th check should be rate limited
        self.assertTrue(limiter.is_rate_limited(key, max_attempts=3, window_seconds=60))
        self.assertGreater(limiter.get_retry_after(key, window_seconds=60), 0)

        # Resetting should unblock
        limiter.reset(key)
        self.assertFalse(limiter.is_rate_limited(key, max_attempts=3, window_seconds=60))

    def test_hybrid_rate_limiter_fallback(self):
        limiter = HybridRateLimiter()
        key = "hybrid_test_key"

        for _ in range(2):
            self.assertFalse(limiter.is_rate_limited(key, max_attempts=2, window_seconds=10))
            limiter.record_attempt(key, window_seconds=10)

        self.assertTrue(limiter.is_rate_limited(key, max_attempts=2, window_seconds=10))
        limiter.clear()
        self.assertFalse(limiter.is_rate_limited(key, max_attempts=2, window_seconds=10))


if __name__ == '__main__':
    unittest.main()

