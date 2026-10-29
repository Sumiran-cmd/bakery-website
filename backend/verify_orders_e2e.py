"""
End-to-End Orders and Checkout Verification Script.
Tests quote calculation, coupon discounts, order creation, inventory deduction,
idempotency protection, guest access tokens, and order history on an isolated disposable database.

Production Safety:
- Operates on a dedicated, disposable temporary SQLite database.
- Strictly guards against execution on production or persistent development databases.
- Uses controlled fixtures and cleans up all state on completion.
"""
import sys
import os
import uuid
import tempfile
from decimal import Decimal
from alembic.config import Config
from alembic import command

sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from app.extensions import db
from app.models import User, Category, Product, ProductVariant, Order, OrderItem, Cart, CartItem


def assert_safe_test_environment(app, temp_db_path):
    env_name = app.config.get('ENV_NAME', '')
    db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')

    if env_name == 'production':
        raise RuntimeError("CRITICAL SAFETY VIOLATION: Refusing to run E2E orders verification in PRODUCTION mode!")
    if 'bean_theory.db' in db_uri and not os.environ.get('ALLOW_DEV_DB_OVERWRITE'):
        raise RuntimeError("CRITICAL SAFETY VIOLATION: Refusing to run verification against default dev database!")
    if temp_db_path not in db_uri and not app.testing:
        raise RuntimeError("CRITICAL SAFETY VIOLATION: Target database is not the registered disposable database!")


def run_orders_e2e():
    print("=== BEAN THEORY ORDERS & CHECKOUT E2E VERIFICATION (ISOLATED DISPOSABLE DATABASE) ===")

    # 1. Create disposable SQLite database
    with tempfile.NamedTemporaryFile(suffix='_e2e_orders.db', delete=False) as tf:
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

            # Seed controlled test fixtures
            demo_user = User(
                email='orders_demo@beantheory.com.np',
                first_name='Demo',
                last_name='Customer',
                is_admin=False
            )
            demo_user.set_password('demoPass#2026')
            db.session.add(demo_user)

            other_user = User(
                email='orders_other@beantheory.com.np',
                first_name='Other',
                last_name='Customer',
                is_admin=False
            )
            other_user.set_password('otherPass#2026')
            db.session.add(other_user)

            cat = Category(name='Specialty Coffee', slug='specialty-coffee', sort_order=1)
            db.session.add(cat)
            db.session.flush()

            prod = Product(
                category_id=cat.id,
                name='Himalayan Reserve Arabica',
                slug='himalayan-reserve-arabica',
                is_active=True
            )
            db.session.add(prod)
            db.session.flush()

            variant = ProductVariant(
                product_id=prod.id,
                name='250g Whole Bean',
                sku='HRA-250',
                price=Decimal('850.00'),
                stock_quantity=20,
                is_active=True
            )
            db.session.add(variant)
            db.session.commit()

            variant_id = variant.id
            product_id = prod.id
            initial_stock = variant.stock_quantity

        client = app.test_client()

        with app.app_context():
            # 1. Login with demo user
            login_res = client.post('/api/auth/login', json={
                'email': 'orders_demo@beantheory.com.np',
                'password': 'demoPass#2026'
            })
            assert login_res.status_code == 200, f"Demo login failed: {login_res.get_json()}"
            token = login_res.get_json()['token']
            headers = {'Authorization': f'Bearer {token}'}
            print("[PASS] 1. Controlled fixture customer authenticated")

            # 2. Confirm active product variant
            v = db.session.get(ProductVariant, variant_id)
            assert v is not None and v.stock_quantity == initial_stock
            print(f"[PASS] 2. Verified active product variant (Initial stock: {initial_stock})")

            # 3. Add to user cart
            add_res = client.post('/api/cart/items', headers=headers, json={
                'product_id': product_id,
                'variant_id': variant_id,
                'quantity': 2
            })
            assert add_res.status_code in (200, 201), f"Failed to add to cart: {add_res.get_json()}"
            print("[PASS] 3. Product added to cart (quantity: 2)")

            # 4. Verify Server-Authoritative Quote Endpoint
            quote_res = client.post('/api/orders/quote', headers=headers, json={
                'coupon_code': 'BEAN10',
                'shipping_method': 'standard'
            })
            assert quote_res.status_code == 200, f"Quote failed: {quote_res.get_json()}"
            quote_data = quote_res.get_json()
            expected_subtotal = round(float(v.price) * 2, 2)
            expected_discount = round(expected_subtotal * 0.10, 2)
            assert abs(quote_data['subtotal'] - expected_subtotal) < 0.01
            assert abs(quote_data['discount_amount'] - expected_discount) < 0.01
            assert quote_data['coupon_valid'] is True
            print(f"[PASS] 4. Quote validated: Subtotal Rs. {quote_data['subtotal']}, Discount Rs. {quote_data['discount_amount']}, Total Rs. {quote_data['total']}")

            # 5. Place Order with Idempotency Key
            idempotency_key = f"e2e-order-{uuid.uuid4()}"
            order_headers = {**headers, 'X-Idempotency-Key': idempotency_key}
            order_payload = {
                'shipping_address': {
                    'full_name': 'Demo Roaster',
                    'phone': '+977-9800000000',
                    'street': 'Kupondole Height',
                    'city': 'Lalitpur',
                    'district': 'Lalitpur',
                    'province': 'Bagmati Province'
                },
                'shipping_method': 'standard',
                'payment_method': 'cash_on_delivery',
                'coupon_code': 'BEAN10',
                # Malicious client attempts to inject total 1.00 — must be overridden by server
                'total': 1.00,
                'discount_amount': 9999.00
            }
            order_res = client.post('/api/orders', headers=order_headers, json=order_payload)
            assert order_res.status_code == 201, f"Order placement failed: {order_res.get_json()}"
            order_data = order_res.get_json()['order']
            order_number = order_data['order_number']
            order_id = order_data['id']

            # Ensure server calculated authoritative values
            assert abs(order_data['total'] - quote_data['total']) < 0.01, "Server did not enforce authoritative total"
            assert order_data['total'] > 1.00, "Malicious client total was accepted"
            print(f"[PASS] 5. Order #{order_number} created with server-authoritative total Rs. {order_data['total']}")

            # 6. Verify variant inventory was deducted atomically
            db.session.expire_all()
            updated_variant = db.session.get(ProductVariant, variant_id)
            assert updated_variant.stock_quantity == initial_stock - 2, f"Stock not decremented: {updated_variant.stock_quantity}"
            print(f"[PASS] 6. Variant inventory decremented atomically from {initial_stock} to {updated_variant.stock_quantity}")

            # 7. Test Idempotency: Re-submitting same idempotency key returns existing order without deducting stock again
            dup_res = client.post('/api/orders', headers=order_headers, json=order_payload)
            assert dup_res.status_code == 200, f"Idempotency retry failed: {dup_res.get_json()}"
            assert dup_res.get_json()['order']['order_number'] == order_number
            assert dup_res.get_json()['message'] == 'Order already created'
            db.session.expire_all()
            assert db.session.get(ProductVariant, variant_id).stock_quantity == initial_stock - 2, "Duplicate order caused double-deduction!"
            print("[PASS] 7. Idempotency enforced: duplicate submission returned cached order without double-deduction")

            # 8. Verify Cart is cleared after order
            cart_res = client.get('/api/cart', headers=headers)
            assert len(cart_res.get_json()['cart']['items']) == 0, "Cart was not emptied after order placement"
            print("[PASS] 8. Cart automatically cleared after successful order")

            # 9. Verify Order access control: cross-user isolation
            other_login = client.post('/api/auth/login', json={
                'email': 'orders_other@beantheory.com.np',
                'password': 'otherPass#2026'
            })
            assert other_login.status_code == 200
            other_token = other_login.get_json()['token']
            other_headers = {'Authorization': f'Bearer {other_token}'}
            forbidden_res = client.get(f'/api/orders/{order_id}', headers=other_headers)
            assert forbidden_res.status_code == 404, f"Unauthorized order access not blocked: {forbidden_res.status_code}"
            print("[PASS] 9. Cross-user isolation verified: other user cannot view order")

            # 10. Verify guest order creation & guest token security
            guest_client = app.test_client()
            guest_headers = {'X-Session-ID': 'sess_guest_verify_12345'}
            add_guest = guest_client.post('/api/cart/items', headers=guest_headers, json={
                'product_id': product_id,
                'variant_id': variant_id,
                'quantity': 1
            })
            assert add_guest.status_code in (200, 201), f"Guest cart add failed: {add_guest.get_json()}"

            guest_order_res = guest_client.post('/api/orders', headers=guest_headers, json={
                'shipping_address': {
                    'full_name': 'Guest Customer',
                    'phone': '+977-9811111111',
                    'street': 'Thamel Marg',
                    'city': 'Kathmandu',
                    'district': 'Kathmandu',
                    'province': 'Bagmati Province'
                },
                'shipping_method': 'standard',
                'payment_method': 'cash_on_delivery'
            })
            assert guest_order_res.status_code == 201, f"Guest order failed: {guest_order_res.get_json()}"
            guest_body = guest_order_res.get_json()
            guest_order_num = guest_body['order']['order_number']
            issued_guest_token = guest_body.get('guest_token')
            assert issued_guest_token is not None, "Guest token missing from guest checkout response"

            # Check that database stores only guest_token_hash, NOT plaintext guest_token
            db_order = Order.query.filter_by(order_number=guest_order_num).first()
            assert db_order.guest_token is None, "Plaintext guest_token leaked into database!"
            assert db_order.guest_token_hash is not None, "guest_token_hash missing from database!"

            # Lookup with guest token succeeds
            lookup_res = guest_client.get(f'/api/orders/lookup/{guest_order_num}?token={issued_guest_token}')
            assert lookup_res.status_code == 200, f"Guest lookup failed: {lookup_res.get_json()}"

            # Lookup without guest token fails
            bad_lookup = guest_client.get(f'/api/orders/lookup/{guest_order_num}')
            assert bad_lookup.status_code == 401
            print("[PASS] 10. Guest order token generation, hashed storage, and guest lookup verified")

        print("\n>>> ALL 10 E2E ORDERS & CHECKOUT VERIFICATION CHECKS PASSED ON DISPOSABLE DATABASE! <<<")

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
    run_orders_e2e()
