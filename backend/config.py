import os
import re
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class BaseConfig:
    ENV_NAME = 'base'
    TESTING = False
    DEBUG = False

    # Security Signing Keys
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-bean-theory-change-in-production')

    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        f"sqlite:///{os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bean_theory.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
    }

    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dev-jwt-secret-bean-theory-change-in-production')
    JWT_TOKEN_LOCATION = ['headers', 'cookies']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    JWT_ACCESS_COOKIE_NAME = 'kc_access_token'
    JWT_ACCESS_CSRF_COOKIE_NAME = 'csrf_access_token'
    JWT_ACCESS_CSRF_HEADER_NAME = 'X-CSRF-TOKEN'
    JWT_COOKIE_SECURE = False  # Enabled in staging and production
    JWT_COOKIE_SAMESITE = 'Lax'
    JWT_COOKIE_PATH = '/'
    JWT_COOKIE_DOMAIN = os.environ.get('JWT_COOKIE_DOMAIN', None)
    JWT_COOKIE_CSRF_PROTECT = True
    JWT_CSRF_IN_COOKIES = True
    JWT_CSRF_CHECK_FORM = False

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 86400)))  # 24 hours
    JWT_REMEMBER_TOKEN_EXPIRES = timedelta(seconds=int(os.environ.get('JWT_REMEMBER_TOKEN_EXPIRES', 2592000)))  # 30 days

    # Frontend URL & CORS
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

    # Email Settings for Password Reset
    MAIL_SERVER = os.environ.get('MAIL_SERVER')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() == 'true'
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', 'no-reply@beantheory.com.np')

    # Security & Distributed Rate Limiting
    REDIS_URL = os.environ.get('REDIS_URL', None)
    AUTH_RATE_LIMIT_MAX_ATTEMPTS = int(os.environ.get('AUTH_RATE_LIMIT_MAX_ATTEMPTS', 10))
    AUTH_IP_RATE_LIMIT_MAX_ATTEMPTS = int(os.environ.get('AUTH_IP_RATE_LIMIT_MAX_ATTEMPTS', 30))
    REGISTRATION_RATE_LIMIT_MAX_ATTEMPTS = int(os.environ.get('REGISTRATION_RATE_LIMIT_MAX_ATTEMPTS', 15))
    AUTH_RATE_LIMIT_WINDOW_SECONDS = int(os.environ.get('AUTH_RATE_LIMIT_WINDOW_SECONDS', 900))  # 15 min
    PASSWORD_RESET_TOKEN_EXPIRATION_HOURS = int(os.environ.get('PASSWORD_RESET_TOKEN_EXPIRATION_HOURS', 1))

    # Proxy Configuration
    TRUST_PROXY = os.environ.get('TRUST_PROXY', 'false').lower() == 'true'
    PROXIES_COUNT = int(os.environ.get('PROXIES_COUNT', 1))

    # Request limits
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16 MB


class DevelopmentConfig(BaseConfig):
    ENV_NAME = 'development'
    DEBUG = True
    JWT_COOKIE_SECURE = False


class TestingConfig(BaseConfig):
    ENV_NAME = 'testing'
    TESTING = True
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('TEST_DATABASE_URL', 'sqlite:///:memory:')
    SQLALCHEMY_ENGINE_OPTIONS = {}  # In-memory SQLite uses default StaticPool
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=10)
    JWT_COOKIE_SECURE = False
    JWT_COOKIE_CSRF_PROTECT = True
    AUTH_RATE_LIMIT_MAX_ATTEMPTS = 5
    AUTH_IP_RATE_LIMIT_MAX_ATTEMPTS = 20
    REGISTRATION_RATE_LIMIT_MAX_ATTEMPTS = 50
    AUTH_RATE_LIMIT_WINDOW_SECONDS = 60


class StagingConfig(BaseConfig):
    ENV_NAME = 'staging'
    DEBUG = False
    JWT_COOKIE_SECURE = os.environ.get('JWT_COOKIE_SECURE', 'true').lower() == 'true'
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': int(os.environ.get('DB_POOL_RECYCLE', 1800)),
        'pool_size': int(os.environ.get('DB_POOL_SIZE', 5)),
        'max_overflow': int(os.environ.get('DB_MAX_OVERFLOW', 10)),
        'pool_timeout': int(os.environ.get('DB_POOL_TIMEOUT', 30)),
    }

    @classmethod
    def init_app(cls, app):
        secret = os.environ.get('SECRET_KEY')
        if not secret or len(secret) < 24 or 'dev-' in secret:
            raise RuntimeError("CRITICAL STAGING CONFIG ERROR: SECRET_KEY must be a valid non-development secret.")


class ProductionConfig(BaseConfig):
    ENV_NAME = 'production'
    DEBUG = False
    JWT_COOKIE_SECURE = True
    JWT_COOKIE_CSRF_PROTECT = True

    # Use a placeholder so SQLAlchemy does not error at class-load time when
    # DATABASE_URL is absent.  The real URL is validated and injected in
    # init_app() which runs before any DB call is made.
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'postgresql://placeholder:placeholder@localhost/placeholder'
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': int(os.environ.get('DB_POOL_RECYCLE', 1800)),
        'pool_size': int(os.environ.get('DB_POOL_SIZE', 10)),
        'max_overflow': int(os.environ.get('DB_MAX_OVERFLOW', 20)),
        'pool_timeout': int(os.environ.get('DB_POOL_TIMEOUT', 30)),
    }

    @classmethod
    def init_app(cls, app):
        secret = os.environ.get('SECRET_KEY', '')
        jwt_secret = os.environ.get('JWT_SECRET_KEY', '')
        db_url = os.environ.get('DATABASE_URL', '')
        frontend_url = os.environ.get('FRONTEND_URL', '')

        # 1. SECRET_KEY validation
        if not secret:
            raise RuntimeError("CRITICAL PRODUCTION CONFIG ERROR: SECRET_KEY is not set.")
        if len(secret) < 32:
            raise RuntimeError("CRITICAL PRODUCTION CONFIG ERROR: SECRET_KEY must be at least 32 characters long.")
        disallowed_keywords = ['dev-', 'secret', 'change-in-production', 'password', '123456', 'admin', 'default']
        if any(kw in secret.lower() for kw in disallowed_keywords):
            raise RuntimeError("CRITICAL PRODUCTION CONFIG ERROR: SECRET_KEY contains insecure keyword.")

        # 2. JWT_SECRET_KEY validation
        if not jwt_secret:
            raise RuntimeError("CRITICAL PRODUCTION CONFIG ERROR: JWT_SECRET_KEY is not set.")
        if len(jwt_secret) < 32:
            raise RuntimeError("CRITICAL PRODUCTION CONFIG ERROR: JWT_SECRET_KEY must be at least 32 characters long.")
        if any(kw in jwt_secret.lower() for kw in disallowed_keywords):
            raise RuntimeError("CRITICAL PRODUCTION CONFIG ERROR: JWT_SECRET_KEY contains insecure keyword.")
        if jwt_secret == secret:
            raise RuntimeError("CRITICAL PRODUCTION CONFIG ERROR: JWT_SECRET_KEY must be distinct from SECRET_KEY (cryptographic separation).")

        # 3. DATABASE_URL validation (No SQLite in production)
        if not db_url:
            raise RuntimeError("CRITICAL PRODUCTION CONFIG ERROR: DATABASE_URL is not set. A production database is required.")
        if db_url.startswith('sqlite:') or db_url.startswith('sqlite:///'):
            raise RuntimeError(
                "CRITICAL PRODUCTION CONFIG ERROR: SQLite is strictly prohibited in production. "
                "Configure a production-grade database such as PostgreSQL (postgresql://) or MySQL (mysql+pymysql://)."
            )
        valid_schemes = ('postgresql://', 'postgresql+psycopg2://', 'mysql://', 'mysql+pymysql://')
        if not any(db_url.startswith(scheme) for scheme in valid_schemes):
            raise RuntimeError(
                f"CRITICAL PRODUCTION CONFIG ERROR: Unsupported DATABASE_URL scheme. Expected one of {valid_schemes}."
            )

        # 4. FRONTEND_URL validation
        if not frontend_url:
            raise RuntimeError("CRITICAL PRODUCTION CONFIG ERROR: FRONTEND_URL is not set.")
        if any(local_host in frontend_url for local_host in ('localhost', '127.0.0.1', '0.0.0.0')):
            raise RuntimeError("CRITICAL PRODUCTION CONFIG ERROR: FRONTEND_URL must not point to localhost in production.")
        if not frontend_url.startswith('https://'):
            raise RuntimeError("CRITICAL PRODUCTION CONFIG ERROR: FRONTEND_URL must use HTTPS in production.")

        app.config['SQLALCHEMY_DATABASE_URI'] = db_url


config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'staging': StagingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
