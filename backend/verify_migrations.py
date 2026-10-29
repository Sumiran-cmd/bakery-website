"""
Validates Alembic migrations against a fresh disposable SQLite database from scratch to head.
"""
import os
import sys
import tempfile
from alembic.config import Config
from alembic import command
from app import create_app
from app.extensions import db

def test_migrations():
    with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tf:
        temp_db = tf.name

    print(f"Disposable test database: {temp_db}")
    os.environ['DATABASE_URL'] = f"sqlite:///{temp_db}"
    os.environ['AUTO_CREATE_DB'] = 'false'
    
    app = create_app('development')
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{temp_db}"

    alembic_cfg = Config(os.path.join(os.path.dirname(__file__), 'migrations', 'alembic.ini'))
    alembic_cfg.set_main_option('script_location', os.path.join(os.path.dirname(__file__), 'migrations'))
    alembic_cfg.set_main_option('sqlalchemy.url', f"sqlite:///{temp_db}")

    try:
        with app.app_context():
            print("Applying migrations from <base> to head...")
            command.upgrade(alembic_cfg, 'head')
            print("Migrations applied successfully!")

            # Verify that tables and new security columns exist
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            print(f"Migrated tables: {sorted(tables)}")
            assert 'users' in tables
            assert 'orders' in tables
            assert 'token_blocklist' in tables
            assert 'password_reset_tokens' in tables

            user_cols = [c['name'] for c in inspector.get_columns('users')]
            assert 'password_changed_at' in user_cols
            print("[PASS] users.password_changed_at column verified")

            order_cols = [c['name'] for c in inspector.get_columns('orders')]
            assert 'guest_token_hash' in order_cols
            assert 'idempotency_payload_hash' in order_cols
            print("[PASS] orders.guest_token_hash and orders.idempotency_payload_hash verified")

            cart_item_uqs = inspector.get_unique_constraints('cart_items')
            uq_col_sets = [sorted(c['column_names']) for c in cart_item_uqs]
            assert ['cart_id', 'variant_id'] in uq_col_sets
            print("[PASS] cart_items unique constraint (cart_id, variant_id) verified")

            print("\n>>> DISPOSABLE DATABASE MIGRATION VERIFICATION COMPLETE: ALL CHECKS PASSED <<<")
    finally:
        if os.path.exists(temp_db):
            os.remove(temp_db)

if __name__ == '__main__':
    test_migrations()
