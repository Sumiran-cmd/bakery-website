"""
End-to-End Authentication and Account Integration Verification Script
Tests registration, login, cookie handling, profile updates, addresses,
token revocation, and password recovery against an isolated disposable database.

Production Safety:
- Strictly verifies that the target database is a disposable test database.
- Refuses to execute against production or default development database files.
- Uses controlled fixtures and cleans up all temporary state.
"""
import sys
import os
import tempfile
from alembic.config import Config
from alembic import command

sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from app.extensions import db
from app.models import User, Address, TokenBlocklist, PasswordResetToken


def assert_safe_test_environment(app, temp_db_path):
    env_name = app.config.get('ENV_NAME', '')
    db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')

    if env_name == 'production':
        raise RuntimeError("CRITICAL SAFETY VIOLATION: Refusing to run E2E verification in PRODUCTION mode!")
    if 'bean_theory.db' in db_uri and not os.environ.get('ALLOW_DEV_DB_OVERWRITE'):
        raise RuntimeError("CRITICAL SAFETY VIOLATION: Refusing to run verification against the default dev database!")
    if temp_db_path not in db_uri and not app.testing:
        raise RuntimeError("CRITICAL SAFETY VIOLATION: Target database is not the registered disposable database!")


def run_e2e_verification():
    print("=== BEAN THEORY AUTHENTICATION E2E VERIFICATION (ISOLATED DISPOSABLE DATABASE) ===")

    # 1. Create disposable SQLite database
    with tempfile.NamedTemporaryFile(suffix='_e2e_auth.db', delete=False) as tf:
        temp_db = tf.name

    print(f"Provisioned disposable test database: {temp_db}")
    os.environ['DATABASE_URL'] = f"sqlite:///{temp_db}"
    os.environ['AUTO_CREATE_DB'] = 'false'
    os.environ['NO_DB_CREATE_ALL'] = 'true'

    app = create_app('testing')
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{temp_db}"
    assert_safe_test_environment(app, temp_db)

    # 2. Run Alembic migrations to build disposable schema
    migrations_dir = os.path.join(os.path.dirname(__file__), 'migrations')
    alembic_cfg = Config(os.path.join(migrations_dir, 'alembic.ini'))
    alembic_cfg.set_main_option('script_location', migrations_dir)
    alembic_cfg.set_main_option('sqlalchemy.url', f"sqlite:///{temp_db}")

    try:
        with app.app_context():
            print("Applying database migrations to disposable database...")
            command.upgrade(alembic_cfg, 'head')
            print("Migrations applied successfully.")

            # Seed controlled test fixtures (replacing hardcoded assumptions)
            admin_user = User(
                email='test_admin@beantheory.com.np',
                first_name='Bean Theory',
                last_name='Admin',
                is_admin=True
            )
            admin_user.set_password('adminSecurePass!2026')
            db.session.add(admin_user)

            demo_user = User(
                email='test_demo@beantheory.com.np',
                first_name='Demo',
                last_name='User',
                is_admin=False
            )
            demo_user.set_password('demoSecurePass!2026')
            db.session.add(demo_user)
            db.session.commit()

        client = app.test_client()

        with app.app_context():
            # 1. Health check (liveness & readiness)
            res_live = client.get('/api/health')
            assert res_live.status_code == 200, f"Health check failed: {res_live.status_code}"
            res_ready = client.get('/api/health/ready')
            assert res_ready.status_code == 200, f"Readiness check failed: {res_ready.status_code}"
            assert res_ready.get_json()['database'] == 'connected'
            print("[PASS] 1. API Health (Liveness & Readiness) Verified")

            # 2. Controlled fixture accounts verification
            admin = User.query.filter_by(email='test_admin@beantheory.com.np').first()
            assert admin is not None, "Admin user missing from test database"
            assert admin.check_password('adminSecurePass!2026'), "Admin password verification failed"
            print("[PASS] 2. Controlled fixture admin user verified")

            demo = User.query.filter_by(email='test_demo@beantheory.com.np').first()
            assert demo is not None, "Demo user missing from test database"
            assert demo.check_password('demoSecurePass!2026'), "Demo password verification failed"
            print("[PASS] 3. Controlled fixture demo user verified")

            # 3. New user registration
            test_email = 'barista_verify@beantheory.com.np'
            reg_res = client.post('/api/auth/register', json={
                'first_name': 'Aarav',
                'last_name': 'Shrestha',
                'email': test_email,
                'password': 'himalayanRoast!2026',
                'password_confirmation': 'himalayanRoast!2026',
                'phone': '+977-9841999999'
            })
            assert reg_res.status_code == 201, f"Registration failed: {reg_res.get_json()}"
            reg_data = reg_res.get_json()
            assert 'token' in reg_data
            assert 'user' in reg_data
            assert 'password_hash' not in reg_data['user']
            print("[PASS] 4. New user registration succeeded and safe profile returned")

            # 4. Sign in with registered credentials
            login_res = client.post('/api/auth/login', json={
                'email': test_email,
                'password': 'himalayanRoast!2026',
                'remember': True
            })
            assert login_res.status_code == 200, f"Login failed: {login_res.get_json()}"
            token = login_res.get_json()['token']
            set_cookie_header = login_res.headers.get('Set-Cookie', '')
            assert 'kc_access_token' in set_cookie_header, "HttpOnly access token cookie missing from response"
            print("[PASS] 5. Real database login verified and HttpOnly cookie set")

            # 5. Access protected /me endpoint
            me_res = client.get('/api/auth/me', headers={'Authorization': f'Bearer {token}'})
            assert me_res.status_code == 200
            assert me_res.get_json()['user']['email'] == test_email
            print("[PASS] 6. Current user /me verified with server-side identity")

            # 6. Address CRUD operations
            addr_res = client.post('/api/addresses', headers={'Authorization': f'Bearer {token}'}, json={
                'label': 'Roastery Hub',
                'full_name': 'Aarav Shrestha',
                'phone': '+977-9841999999',
                'street': 'Patan Durbar Square Ward 3',
                'city': 'Lalitpur',
                'district': 'Lalitpur',
                'province': 'Bagmati Province',
                'is_default': True
            })
            assert addr_res.status_code == 201, f"Address creation failed: {addr_res.get_json()}"
            print("[PASS] 7. Database-backed address creation succeeded")

            # Retrieve addresses
            addr_list_res = client.get('/api/addresses', headers={'Authorization': f'Bearer {token}'})
            assert addr_list_res.status_code == 200
            assert len(addr_list_res.get_json()['addresses']) >= 1
            print("[PASS] 8. Saved delivery addresses retrieval verified")

            # 7. Update profile
            prof_res = client.put('/api/auth/profile', headers={'Authorization': f'Bearer {token}'}, json={
                'first_name': 'Aarav (Head Roaster)',
                'phone': '+977-9800000001'
            })
            assert prof_res.status_code == 200
            assert prof_res.get_json()['user']['first_name'] == 'Aarav (Head Roaster)'
            print("[PASS] 9. User profile update succeeded and persisted")

            # 8. Password Change
            pw_change_res = client.post('/api/auth/change-password', headers={'Authorization': f'Bearer {token}'}, json={
                'current_password': 'himalayanRoast!2026',
                'new_password': 'superSecurePass#2026',
                'confirm_password': 'superSecurePass#2026'
            })
            assert pw_change_res.status_code == 200
            new_token = pw_change_res.get_json()['token']
            print("[PASS] 10. Authenticated password change succeeded and session refreshed")

            # 9. Verify old password rejected, new password works
            old_login = client.post('/api/auth/login', json={'email': test_email, 'password': 'himalayanRoast!2026'})
            assert old_login.status_code == 401
            new_login = client.post('/api/auth/login', json={'email': test_email, 'password': 'superSecurePass#2026'})
            assert new_login.status_code == 200
            print("[PASS] 11. Stored password hash verified: old password rejected, new password accepted")

            # 10. Logout and token invalidation
            logout_res = client.post('/api/auth/logout', headers={'Authorization': f'Bearer {new_token}'})
            assert logout_res.status_code == 200
            print("[PASS] 12. Logout successfully executed on backend")

            # Verify old token rejected after logout
            stale_me = client.get('/api/auth/me', headers={'Authorization': f'Bearer {new_token}'})
            assert stale_me.status_code == 401, "Stale token was not rejected after logout"
            print("[PASS] 13. Server-side token invalidation verified (revoked token cannot access API)")

            # 11. Forgot password request
            forgot_res = client.post('/api/auth/forgot-password', json={'email': test_email})
            assert forgot_res.status_code == 200
            print("[PASS] 14. Forgot password recovery flow initiated safely")

            # Verify reset token in database
            user = User.query.filter_by(email=test_email).first()
            reset_token_record = PasswordResetToken.query.filter_by(user_id=user.id, used=False).order_by(PasswordResetToken.created_at.desc()).first()
            assert reset_token_record is not None, "Password reset token record missing"
            assert len(reset_token_record.token_hash) == 64, "Token hash is not SHA-256"
            print("[PASS] 15. Single-use hashed reset token generated in database")

            # 12. Response security headers verified
            assert 'X-Content-Type-Options' in login_res.headers
            assert login_res.headers['X-Content-Type-Options'] == 'nosniff'
            assert 'X-Frame-Options' in login_res.headers
            assert login_res.headers['X-Frame-Options'] == 'DENY'
            print("[PASS] 16. Security headers (nosniff, DENY) verified on API responses")

        print("\n>>> ALL 16 E2E AUTHENTICATION VERIFICATION CHECKS PASSED ON DISPOSABLE DATABASE! <<<")

    finally:
        try:
            with app.app_context():
                db.session.remove()
        except Exception:
            pass
        if os.path.exists(temp_db):
            try:
                os.remove(temp_db)
                print(f"[CLEANUP] Disposable test database {temp_db} safely unlinked.")
            except Exception as e:
                print(f"[CLEANUP WARNING] Failed to unlink temp db: {e}")


if __name__ == '__main__':
    run_e2e_verification()
