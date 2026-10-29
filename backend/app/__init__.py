from flask import Flask, jsonify, request, current_app
from app.extensions import db, migrate, cors, jwt
from config import config
import os
import re


def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    app = Flask(__name__)
    config_obj = config.get(config_name, config['default'])
    app.config.from_object(config_obj)

    # Run config-level validation BEFORE initializing extensions so that
    # ProductionConfig.init_app() can reject bad/missing DATABASE_URL and
    # override the class-level placeholder with the real URL.
    if hasattr(config_obj, 'init_app'):
        config_obj.init_app(app)

    # Initialize extensions
    db.init_app(app)
    migrations_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'migrations')
    migrate.init_app(app, db, directory=migrations_dir)

    # Configure Trusted Proxy handling (Werkzeug ProxyFix)
    if app.config.get('TRUST_PROXY', False):
        from werkzeug.middleware.proxy_fix import ProxyFix
        proxies = app.config.get('PROXIES_COUNT', 1)
        app.wsgi_app = ProxyFix(
            app.wsgi_app,
            x_for=proxies,
            x_proto=proxies,
            x_host=proxies,
            x_prefix=proxies
        )

    # Credentialed CORS configuration
    cors.init_app(app, resources={
        r"/api/*": {
            "origins": [
                re.compile(r"^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$"),
                app.config.get('FRONTEND_URL', 'http://localhost:5173')
            ],
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            "allow_headers": [
                "Content-Type", "Authorization", "X-Session-ID",
                "X-Requested-With", "X-Idempotency-Key", "X-Guest-Token",
                "X-CSRF-TOKEN"
            ],
            "supports_credentials": True
        }
    })

    # Initialize JWT
    jwt.init_app(app)

    # Initialize distributed rate limiter if Redis configured
    redis_url = app.config.get('REDIS_URL')
    if redis_url:
        from app.services.rate_limiter import rate_limiter
        rate_limiter.configure_redis(redis_url)

    # Import models
    with app.app_context():
        from app.models import (
            User, Address, TokenBlocklist, PasswordResetToken,
            Category, Product, ProductVariant, ProductImage,
            Cart, CartItem, WishlistItem, Order, OrderItem
        )
        # In test mode or when explicitly requested, initialize tables;
        # production and migration verification schemas are managed via Alembic migrations.
        if (app.config.get('TESTING') and os.environ.get('NO_DB_CREATE_ALL', '').lower() != 'true') or os.environ.get('AUTO_CREATE_DB', '').lower() == 'true':
            db.create_all()

    # JWT Blocklist & Callback loaders
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        jti = jwt_payload.get('jti')
        if jti and TokenBlocklist.query.filter_by(jti=jti).first() is not None:
            return True

        # Invalidate tokens issued prior to a password change/reset
        user_id_raw = jwt_payload.get('sub')
        iat = jwt_payload.get('iat')
        if user_id_raw and iat:
            try:
                user = db.session.get(User, int(user_id_raw))
                if user and user.password_changed_at:
                    import datetime
                    pwd_ts = user.password_changed_at.replace(tzinfo=datetime.timezone.utc).timestamp()
                    if iat < pwd_ts - 1:
                        return True
            except Exception:
                pass
        return False

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'error': 'Session has been invalidated. Please sign in again.',
            'code': 'token_revoked'
        }), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'error': 'Session expired. Please sign in again.',
            'code': 'token_expired'
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(reason):
        return jsonify({
            'error': 'Invalid session credentials. Please sign in again.',
            'code': 'token_invalid'
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(reason):
        return jsonify({
            'error': 'Authentication required to access this resource.',
            'code': 'authorization_required'
        }), 401

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.products import products_bp
    from app.routes.cart import cart_bp
    from app.routes.orders import orders_bp
    from app.routes.addresses import addresses_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(cart_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(addresses_bp)

    # Security Headers Hook
    @app.after_request
    def apply_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response.headers['Permissions-Policy'] = 'geolocation=(), camera=(), microphone=()'
        if app.config.get('ENV_NAME') == 'production':
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        return response

    # Error handlers
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({'error': 'Bad request', 'code': 'bad_request'}), 400

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Resource not found', 'code': 'not_found'}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({'error': 'Method not allowed', 'code': 'method_not_allowed'}), 405

    @app.errorhandler(413)
    def request_entity_too_large(e):
        return jsonify({'error': 'Payload exceeds maximum permitted size (16MB)', 'code': 'payload_too_large'}), 413

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'error': 'Internal server error', 'code': 'server_error'}), 500

    # Liveness check (shallow probe)
    @app.route('/api/health')
    @app.route('/api/health/live')
    def health_live():
        return jsonify({'status': 'ok', 'app': 'Bean Theory API', 'live': True}), 200

    # Readiness check (deep probe: verifies database & cache connectivity)
    @app.route('/api/health/ready')
    def health_ready():
        from sqlalchemy import text
        try:
            db.session.execute(text('SELECT 1'))
            db_status = 'connected'
        except Exception as e:
            app.logger.error("Readiness check failed - DB unavailable: %s", str(e))
            return jsonify({'status': 'unhealthy', 'database': 'unavailable'}), 503

        cache_status = 'memory'
        if app.config.get('REDIS_URL'):
            try:
                from app.services.rate_limiter import rate_limiter
                if rate_limiter._redis_available:
                    cache_status = 'redis_connected'
                else:
                    cache_status = 'redis_fallback_to_memory'
            except Exception:
                cache_status = 'cache_check_failed'

        return jsonify({
            'status': 'ready',
            'database': db_status,
            'cache': cache_status
        }), 200

    return app
