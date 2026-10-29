"""
Comprehensive Regression Test Suite for Bakery / Bean Theory E-Commerce Application.
Validates all implemented audit repairs across security, data integrity, idempotency,
payment methods, authorization, password reset session revocation, and input validation.
"""

import unittest
import json
import hashlib
import time
from datetime import datetime, timezone, timedelta
from app import create_app
from app.extensions import db
from app.models import (
    User, Category, Product, ProductVariant, Cart, CartItem, Order,
    PasswordResetToken, TokenBlocklist
)
from app.services.rate_limiter import rate_limiter


class RepairRegressionsTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app('testing')
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        rate_limiter.clear()
        db.create_all()
        self._seed_data()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def _seed_data(self):
        # Users
        self.user_a = User(
            email='alice@beantheory.com.np',
            first_name='Alice',
            last_name='Sharma'
        )
        self.user_a.set_password('Password123!')
        
        self.user_b = User(
            email='bob@beantheory.com.np',
            first_name='Bob',
            last_name='Thapa'
        )
        self.user_b.set_password('Password123!')
        db.session.add_all([self.user_a, self.user_b])
        db.session.commit()

        # Category and Products
        self.cat = Category(name='Specialty Coffee', slug='specialty-coffee')
        db.session.add(self.cat)
        db.session.commit()

        self.prod = Product(
            category_id=self.cat.id,
            name='Everest Single Origin',
            slug='everest-single-origin',
            description='Grown at high altitude',
            is_active=True
        )
        db.session.add(self.prod)
        db.session.commit()

        # Variants: One inactive cheap variant, one active standard variant, one active premium variant
        self.var_inactive = ProductVariant(
            product_id=self.prod.id,
            name='Sample 50g (Discontinued)',
            sku='EV-50G-DISC',
            price=150.00,
            stock_quantity=10,
            is_active=False
        )
        self.var_active_standard = ProductVariant(
            product_id=self.prod.id,
            name='Whole Bean 250g',
            sku='EV-250G',
            price=650.00,
            compare_at_price=750.00,
            stock_quantity=50,
            is_active=True
        )
        self.var_active_large = ProductVariant(
            product_id=self.prod.id,
            name='Whole Bean 1kg',
            sku='EV-1KG',
            price=2200.00,
            stock_quantity=20,
            is_active=True
        )
        db.session.add_all([self.var_inactive, self.var_active_standard, self.var_active_large])
        db.session.commit()

    def _get_auth_headers(self, email='alice@beantheory.com.np', password='Password123!'):
        res = self.client.post('/api/auth/login', json={'email': email, 'password': password})
        token = res.get_json()['token']
        return {'Authorization': f'Bearer {token}'}

    # =========================================================================
    # 1. Product Variant Pricing & Inactive Variant Exclusion
    # =========================================================================

    def test_inactive_variant_excluded_from_base_price_and_listings(self):
        """Inactive variants must not set the base price or appear in public product lists."""
        # Database model level
        self.assertEqual(float(self.prod.base_price), 650.00, "Base price should be lowest ACTIVE variant (650), not inactive (150)")

        # API listing level
        res = self.client.get('/api/products')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        item = [p for p in data['products'] if p['id'] == self.prod.id][0]
        self.assertEqual(item['base_price'], 650.00)
        # Verify inactive variant is not in serialized variants
        variant_names = [v['name'] for v in item['variants']]
        self.assertNotIn('Sample 50g (Discontinued)', variant_names)
        self.assertIn('Whole Bean 250g', variant_names)

        # Detail endpoint level
        res_detail = self.client.get(f'/api/products/{self.prod.slug}')
        self.assertEqual(res_detail.status_code, 200)
        detail_data = res_detail.get_json()['product']
        self.assertEqual(detail_data['base_price'], 650.00)
        detail_variants = [v['name'] for v in detail_data['variants']]
        self.assertNotIn('Sample 50g (Discontinued)', detail_variants)

    def test_cart_rejects_inactive_variant(self):
        """Adding an inactive variant to the cart must be rejected."""
        headers = self._get_auth_headers()
        res = self.client.post('/api/cart/items', json={
            'product_id': self.prod.id,
            'variant_id': self.var_inactive.id,
            'quantity': 1
        }, headers=headers)
        self.assertEqual(res.status_code, 404)
        self.assertIn('not found', res.get_json().get('error', '').lower())

    # =========================================================================
    # 2. Cart Input Validation & Boolean/String Rejection
    # =========================================================================

    def test_cart_rejects_non_object_json(self):
        """Cart endpoint must reject non-object JSON payloads."""
        headers = self._get_auth_headers()
        res = self.client.post('/api/cart/items', data='[1, 2, 3]', content_type='application/json', headers=headers)
        self.assertEqual(res.status_code, 400)

    def test_cart_rejects_boolean_as_quantity(self):
        """Python booleans are integer subclasses; True must not be accepted as quantity 1."""
        headers = self._get_auth_headers()
        res = self.client.post('/api/cart/items', json={
            'product_id': self.prod.id,
            'variant_id': self.var_active_standard.id,
            'quantity': True
        }, headers=headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn('integer', res.get_json().get('error', '').lower())

    def test_cart_rejects_string_quantity(self):
        """String quantity must be rejected."""
        headers = self._get_auth_headers()
        res = self.client.post('/api/cart/items', json={
            'product_id': self.prod.id,
            'variant_id': self.var_active_standard.id,
            'quantity': '2'
        }, headers=headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn('integer', res.get_json().get('error', '').lower())

    def test_cart_rejects_negative_and_zero_quantity(self):
        """Zero and negative quantities must be rejected."""
        headers = self._get_auth_headers()
        for q in [0, -1, -5]:
            res = self.client.post('/api/cart/items', json={
                'product_id': self.prod.id,
                'variant_id': self.var_active_standard.id,
                'quantity': q
            }, headers=headers)
            self.assertEqual(res.status_code, 400)

    def test_cart_rejects_excessive_quantity(self):
        """Quantities above maximum (100) must be rejected."""
        headers = self._get_auth_headers()
        res = self.client.post('/api/cart/items', json={
            'product_id': self.prod.id,
            'variant_id': self.var_active_standard.id,
            'quantity': 101
        }, headers=headers)
        self.assertEqual(res.status_code, 400)

    # =========================================================================
    # 3. Order Authorization & Guest Token Hashing
    # =========================================================================

    def test_cross_user_order_access_forbidden(self):
        """User A cannot access User B's order by ID or order number."""
        headers_a = self._get_auth_headers('alice@beantheory.com.np')
        headers_b = self._get_auth_headers('bob@beantheory.com.np')

        # Add item and create order for Alice
        self.client.post('/api/cart/items', json={
            'product_id': self.prod.id,
            'variant_id': self.var_active_standard.id,
            'quantity': 1
        }, headers=headers_a)

        order_res = self.client.post('/api/orders', json={
            'shipping_address': {
                'full_name': 'Alice Sharma',
                'phone': '9841000000',
                'street': 'Patan',
                'city': 'Lalitpur',
                'district': 'Lalitpur',
                'province': 'Bagmati Province'
            },
            'payment_method': 'cash_on_delivery'
        }, headers=headers_a)
        self.assertEqual(order_res.status_code, 201)
        order_data = order_res.get_json()['order']
        order_id = order_data['id']
        order_number = order_data['order_number']

        # Alice can access her own order
        res_self = self.client.get(f'/api/orders/{order_id}', headers=headers_a)
        self.assertEqual(res_self.status_code, 200)

        # Bob attempts to access Alice's order by ID
        res_bob_id = self.client.get(f'/api/orders/{order_id}', headers=headers_b)
        self.assertIn(res_bob_id.status_code, [403, 404])

        # Bob attempts to access Alice's order by order number
        res_bob_num = self.client.get(f'/api/orders/lookup/{order_number}', headers=headers_b)
        self.assertEqual(res_bob_num.status_code, 403)

    def test_authenticated_user_cannot_access_guest_order_without_token(self):
        """An authenticated user cannot access an unrelated guest order merely because user_id is null."""
        # Create guest order
        guest_session = {'X-Session-ID': 'sess_guest_repair_test'}
        self.client.post('/api/cart/items', json={
            'product_id': self.prod.id,
            'variant_id': self.var_active_standard.id,
            'quantity': 1
        }, headers=guest_session)

        guest_order_res = self.client.post('/api/orders', json={
            'shipping_address': {
                'full_name': 'Guest Customer',
                'phone': '9841111111',
                'street': 'Thamel',
                'city': 'Kathmandu',
                'district': 'Kathmandu',
                'province': 'Bagmati Province'
            },
            'payment_method': 'cash_on_delivery'
        }, headers=guest_session)
        self.assertEqual(guest_order_res.status_code, 201)
        order_data = guest_order_res.get_json()
        guest_order_number = order_data['order']['order_number']
        raw_guest_token = order_data.get('guest_token')
        self.assertTrue(bool(raw_guest_token))

        # Check that guest_token_hash is stored in DB
        db_order = Order.query.filter_by(order_number=guest_order_number).first()
        expected_hash = hashlib.sha256(raw_guest_token.encode('utf-8')).hexdigest()
        self.assertEqual(db_order.guest_token_hash, expected_hash)

        # Bob logs in and tries to view the guest order without the token
        headers_b = self._get_auth_headers('bob@beantheory.com.np')
        res_lookup = self.client.get(f'/api/orders/lookup/{guest_order_number}', headers=headers_b)
        self.assertIn(res_lookup.status_code, [401, 403])

        # With the correct token, guest lookup succeeds
        res_with_token = self.client.get(f'/api/orders/lookup/{guest_order_number}?token={raw_guest_token}')
        self.assertEqual(res_with_token.status_code, 200)

        # With invalid token, rejected
        res_bad_token = self.client.get(f'/api/orders/lookup/{guest_order_number}?token=wrong_token')
        self.assertEqual(res_bad_token.status_code, 403)

    # =========================================================================
    # 4. Idempotency Key Validation & Conflict Handling
    # =========================================================================

    def test_idempotency_key_payload_mismatch_returns_409(self):
        """Reusing the same idempotency key with a different payload returns HTTP 409 conflict."""
        headers = self._get_auth_headers('alice@beantheory.com.np')
        self.client.post('/api/cart/items', json={
            'product_id': self.prod.id,
            'variant_id': self.var_active_standard.id,
            'quantity': 1
        }, headers=headers)

        idempotency_key = 'test-idem-key-12345'
        headers['X-Idempotency-Key'] = idempotency_key

        payload_1 = {
            'shipping_address': {
                'full_name': 'Alice Sharma',
                'phone': '9841000000',
                'street': 'Patan Gate 1',
                'city': 'Lalitpur',
                'district': 'Lalitpur',
                'province': 'Bagmati Province'
            },
            'payment_method': 'cash_on_delivery',
            'notes': 'Call first'
        }
        res1 = self.client.post('/api/orders', json=payload_1, headers=headers)
        self.assertEqual(res1.status_code, 201)

        # Submit again with same key and DIFFERENT payload
        payload_2 = {
            'shipping_address': {
                'full_name': 'Alice Sharma',
                'phone': '9841000000',
                'street': 'Jhamsikhel 5',
                'city': 'Lalitpur',
                'district': 'Lalitpur',
                'province': 'Bagmati Province'
            },
            'payment_method': 'cash_on_delivery',
            'notes': 'Leave at door'
        }
        res2 = self.client.post('/api/orders', json=payload_2, headers=headers)
        self.assertEqual(res2.status_code, 409)
        self.assertEqual(res2.get_json().get('code'), 'idempotency_payload_mismatch')

    def test_idempotency_key_identical_retry_returns_same_order(self):
        """Reusing the same key with identical payload returns the already-created order."""
        headers = self._get_auth_headers('alice@beantheory.com.np')
        self.client.post('/api/cart/items', json={
            'product_id': self.prod.id,
            'variant_id': self.var_active_standard.id,
            'quantity': 1
        }, headers=headers)

        idempotency_key = 'test-idem-retry-54321'
        headers['X-Idempotency-Key'] = idempotency_key

        payload = {
            'shipping_address': {
                'full_name': 'Alice Sharma',
                'phone': '9841000000',
                'street': 'Patan Gate 1',
                'city': 'Lalitpur',
                'district': 'Lalitpur',
                'province': 'Bagmati Province'
            },
            'payment_method': 'cash_on_delivery'
        }
        res1 = self.client.post('/api/orders', json=payload, headers=headers)
        self.assertEqual(res1.status_code, 201)
        order_num1 = res1.get_json()['order']['order_number']

        # Retry with identical payload and key
        res2 = self.client.post('/api/orders', json=payload, headers=headers)
        self.assertEqual(res2.status_code, 200)
        self.assertTrue(res2.get_json().get('idempotent_replay'))
        order_num2 = res2.get_json()['order']['order_number']
        self.assertEqual(order_num1, order_num2)

    # =========================================================================
    # 5. Unsupported Payment Methods Rejection
    # =========================================================================

    def test_unsupported_payment_methods_rejected(self):
        """eSewa, Khalti, and card must be rejected since gateways are not integrated."""
        headers = self._get_auth_headers('alice@beantheory.com.np')
        self.client.post('/api/cart/items', json={
            'product_id': self.prod.id,
            'variant_id': self.var_active_standard.id,
            'quantity': 1
        }, headers=headers)

        for method in ['esewa', 'khalti', 'card']:
            res = self.client.post('/api/orders', json={
                'shipping_address': {
                    'full_name': 'Alice',
                    'phone': '9841000000',
                    'street': 'Patan',
                    'city': 'Lalitpur',
                    'district': 'Lalitpur',
                    'province': 'Bagmati Province'
                },
                'payment_method': method
            }, headers=headers)
            self.assertEqual(res.status_code, 400)
            err_msg = res.get_json().get('error', '').lower()
            self.assertTrue('unavailable' in err_msg or 'not supported' in err_msg)

    # =========================================================================
    # 6. Password Reset Security & Session Revocation
    # =========================================================================

    def test_password_reset_revokes_prior_jwt_sessions(self):
        """Resetting password immediately revokes all prior JWT access tokens."""
        # 1. Login to obtain an active token
        login_res = self.client.post('/api/auth/login', json={
            'email': 'alice@beantheory.com.np',
            'password': 'Password123!'
        })
        old_token = login_res.get_json()['token']
        headers = {'Authorization': f'Bearer {old_token}'}

        # Verify old token works before reset
        res_me = self.client.get('/api/auth/me', headers=headers)
        self.assertEqual(res_me.status_code, 200)

        # 2. Seed a reset token (hashed in db)
        time.sleep(1) # Ensure timestamp strictly advances
        raw_token = 'alice-test-raw-reset-token-123'
        token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
        reset_record = PasswordResetToken(
            user_id=self.user_a.id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=1),
            used=False
        )
        db.session.add(reset_record)
        db.session.commit()

        # 3. Complete password reset
        reset_res = self.client.post('/api/auth/reset-password', json={
            'token': raw_token,
            'password': 'NewPassword456!',
            'password_confirmation': 'NewPassword456!'
        })
        self.assertEqual(reset_res.status_code, 200)

        # 4. Old JWT token must now be rejected because password_changed_at > token iat
        res_me_after = self.client.get('/api/auth/me', headers=headers)
        self.assertEqual(res_me_after.status_code, 401)

    def test_password_reset_token_single_use_atomic(self):
        """Password reset token cannot be used twice."""
        raw_token = 'single-use-reset-token-456'
        token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
        reset_record = PasswordResetToken(
            user_id=self.user_a.id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=1),
            used=False
        )
        db.session.add(reset_record)
        db.session.commit()

        # First use succeeds
        res1 = self.client.post('/api/auth/reset-password', json={
            'token': raw_token,
            'password': 'NewPass1!',
            'password_confirmation': 'NewPass1!'
        })
        self.assertEqual(res1.status_code, 200)

        # Second use fails
        res2 = self.client.post('/api/auth/reset-password', json={
            'token': raw_token,
            'password': 'NewPass2!',
            'password_confirmation': 'NewPass2!'
        })
        self.assertEqual(res2.status_code, 400)
        err_msg = res2.get_json().get('error', '').lower()
        self.assertTrue('invalid' in err_msg or 'already been used' in err_msg)


if __name__ == '__main__':
    unittest.main()
