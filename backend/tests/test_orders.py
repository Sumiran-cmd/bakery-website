"""
Order creation, pricing, coupon, inventory, authorization and idempotency tests.

Key scenarios covered:
  - Server-authoritative pricing (client cannot manipulate totals)
  - Coupon validation (server-side)
  - Shipping cost (standard / express / free threshold)
  - Inventory deduction and insufficient-stock rejection
  - Order ownership enforcement (cross-user access blocked)
  - Guest order lookup requires guest_token
  - Idempotency key prevents duplicate orders
  - Order lookup by authenticated owner succeeds
  - Unauthenticated order lookup without token is rejected
"""

import unittest
from decimal import Decimal
from app import create_app
from app.extensions import db
from app.models import (
    User, Category, Product, ProductVariant, Cart, CartItem, Order
)
from app.services.rate_limiter import rate_limiter


class OrderTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app('testing')
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        rate_limiter.clear()
        db.create_all()
        self._seed()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    # -------------------------------------------------------------------------
    # Seed helpers
    # -------------------------------------------------------------------------
    def _seed(self):
        cat = Category(name='Coffee', slug='coffee', sort_order=0)
        db.session.add(cat)
        db.session.flush()

        product = Product(
            category_id=cat.id,
            name='Himalayan Single Origin',
            slug='himalayan-single-origin',
            is_active=True
        )
        db.session.add(product)
        db.session.flush()

        self.variant = ProductVariant(
            product_id=product.id,
            name='250g',
            sku='HSO-250',
            price=Decimal('800.00'),
            stock_quantity=10,
            is_active=True
        )
        db.session.add(self.variant)
        db.session.commit()

        self.product = product
        self.category = cat

    def _register(self, email='buyer@bean.com', password='password123'):
        res = self.client.post('/api/auth/register', json={
            'email': email, 'password': password,
            'password_confirmation': password, 'first_name': 'Test'
        })
        return res.get_json()['token']

    def _login(self, email='buyer@bean.com', password='password123'):
        res = self.client.post('/api/auth/login', json={
            'email': email, 'password': password
        })
        return res.get_json()['token']

    def _auth_header(self, token):
        return {'Authorization': f'Bearer {token}'}

    def _add_to_user_cart(self, token, variant_id=None, quantity=1):
        variant_id = variant_id or self.variant.id
        return self.client.post('/api/cart/items',
            headers=self._auth_header(token),
            json={'product_id': self.product.id, 'variant_id': variant_id, 'quantity': quantity}
        )

    def _valid_shipping(self):
        return {
            'full_name': 'Test Buyer',
            'phone': '9841000000',
            'street': 'Jhamsikhel Marg 12',
            'city': 'Lalitpur',
            'district': 'Lalitpur',
            'province': 'Bagmati Province'
        }

    def _place_order(self, token=None, extra=None, session_id=None, idempotency_key=None):
        payload = {
            'shipping_address': self._valid_shipping(),
            'payment_method': 'cash_on_delivery',
            'shipping_method': 'standard'
        }
        if extra:
            payload.update(extra)
        headers = {}
        if token:
            headers['Authorization'] = f'Bearer {token}'
        if session_id:
            headers['X-Session-ID'] = session_id
        if idempotency_key:
            headers['X-Idempotency-Key'] = idempotency_key
        return self.client.post('/api/orders', headers=headers, json=payload)

    # =========================================================================
    # 1. Basic order creation
    # =========================================================================
    def test_create_order_authenticated(self):
        token = self._register()
        self._add_to_user_cart(token, quantity=2)

        res = self._place_order(token=token)
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertIn('order', data)
        order = data['order']

        # Server-computed subtotal: 2 * 800 = 1600
        self.assertAlmostEqual(order['subtotal'], 1600.0)
        # Standard shipping (1600 < 2000 threshold): Rs. 100
        self.assertAlmostEqual(order['shipping_cost'], 100.0)
        self.assertAlmostEqual(order['discount_amount'], 0.0)
        self.assertAlmostEqual(order['total'], 1700.0)
        self.assertEqual(order['payment_method'], 'cash_on_delivery')
        # No client-supplied guest_token leaked for auth users
        self.assertNotIn('guest_token', data)

    def test_create_order_empty_cart_rejected(self):
        token = self._register()
        res = self._place_order(token=token)
        self.assertEqual(res.status_code, 400)
        self.assertIn('empty', res.get_json()['error'].lower())

    # =========================================================================
    # 2. Server-authoritative pricing — client cannot manipulate totals
    # =========================================================================
    def test_client_submitted_discount_is_ignored(self):
        """Backend must recalculate totals; submitting discount_amount has no effect."""
        token = self._register()
        self._add_to_user_cart(token, quantity=1)

        res = self._place_order(token=token, extra={'discount_amount': 999999})
        self.assertEqual(res.status_code, 201)
        order = res.get_json()['order']
        # discount_amount from client is ignored; only server-validated coupon is applied
        self.assertAlmostEqual(order['discount_amount'], 0.0)
        self.assertAlmostEqual(order['total'], 900.0)   # 800 + 100 shipping

    def test_client_submitted_total_is_ignored(self):
        """Even if the client submits a fake 'total' key, the backend recalculates."""
        token = self._register()
        self._add_to_user_cart(token, quantity=1)
        res = self._place_order(token=token, extra={'total': 1})
        self.assertEqual(res.status_code, 201)
        order = res.get_json()['order']
        self.assertAlmostEqual(order['total'], 900.0)

    # =========================================================================
    # 3. Shipping calculation
    # =========================================================================
    def test_standard_shipping_below_threshold(self):
        token = self._register()
        self._add_to_user_cart(token, quantity=1)  # 800 < 2000
        res = self._place_order(token=token, extra={'shipping_method': 'standard'})
        self.assertEqual(res.status_code, 201)
        self.assertAlmostEqual(res.get_json()['order']['shipping_cost'], 100.0)

    def test_standard_shipping_free_above_threshold(self):
        # Add 3 units → subtotal = 2400 ≥ 2000
        token = self._register()
        self._add_to_user_cart(token, quantity=3)
        res = self._place_order(token=token, extra={'shipping_method': 'standard'})
        self.assertEqual(res.status_code, 201)
        order = res.get_json()['order']
        self.assertAlmostEqual(order['shipping_cost'], 0.0)
        self.assertAlmostEqual(order['total'], 2400.0)

    def test_express_shipping_always_charged(self):
        token = self._register()
        self._add_to_user_cart(token, quantity=3)  # subtotal 2400 (above free threshold)
        res = self._place_order(token=token, extra={'shipping_method': 'express'})
        self.assertEqual(res.status_code, 201)
        order = res.get_json()['order']
        # Express is always charged regardless of subtotal
        self.assertAlmostEqual(order['shipping_cost'], 250.0)
        self.assertAlmostEqual(order['total'], 2650.0)

    def test_invalid_shipping_method_rejected(self):
        token = self._register()
        self._add_to_user_cart(token, quantity=1)
        res = self._place_order(token=token, extra={'shipping_method': 'teleport'})
        self.assertEqual(res.status_code, 400)

    # =========================================================================
    # 4. Coupon validation (server-side)
    # =========================================================================
    def test_valid_percent_coupon_bean10(self):
        token = self._register()
        self._add_to_user_cart(token, quantity=1)  # 800
        res = self._place_order(token=token, extra={'coupon_code': 'BEAN10'})
        self.assertEqual(res.status_code, 201)
        order = res.get_json()['order']
        # 10% of 800 = 80 discount; shipping 100; total = 820
        self.assertAlmostEqual(order['discount_amount'], 80.0)
        self.assertAlmostEqual(order['total'], 820.0)
        self.assertEqual(order['coupon_code'], 'BEAN10')

    def test_valid_fixed_coupon_fresh150(self):
        token = self._register()
        self._add_to_user_cart(token, quantity=1)  # 800
        res = self._place_order(token=token, extra={'coupon_code': 'FRESH150'})
        self.assertEqual(res.status_code, 201)
        order = res.get_json()['order']
        # Rs. 150 discount; shipping 100; total = 750
        self.assertAlmostEqual(order['discount_amount'], 150.0)
        self.assertAlmostEqual(order['total'], 750.0)

    def test_invalid_coupon_rejected(self):
        token = self._register()
        self._add_to_user_cart(token, quantity=1)
        res = self._place_order(token=token, extra={'coupon_code': 'FAKECODE'})
        self.assertEqual(res.status_code, 400)
        self.assertIn('not valid', res.get_json()['error'])

    def test_coupon_case_insensitive(self):
        token = self._register()
        self._add_to_user_cart(token, quantity=1)
        res = self._place_order(token=token, extra={'coupon_code': 'bean10'})
        self.assertEqual(res.status_code, 201)
        self.assertAlmostEqual(res.get_json()['order']['discount_amount'], 80.0)

    # =========================================================================
    # 5. Quote endpoint
    # =========================================================================
    def test_quote_endpoint(self):
        token = self._register()
        self._add_to_user_cart(token, quantity=2)  # 1600

        res = self.client.post('/api/orders/quote',
            headers=self._auth_header(token),
            json={'shipping_method': 'express', 'coupon_code': 'BEAN10'}
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertAlmostEqual(data['subtotal'], 1600.0)
        self.assertAlmostEqual(data['shipping_cost'], 250.0)   # express
        self.assertAlmostEqual(data['discount_amount'], 160.0)  # 10% of 1600
        self.assertAlmostEqual(data['total'], 1690.0)
        self.assertTrue(data['coupon_valid'])
        self.assertIsNone(data['coupon_error'])

    def test_quote_invalid_coupon(self):
        token = self._register()
        self._add_to_user_cart(token, quantity=1)
        res = self.client.post('/api/orders/quote',
            headers=self._auth_header(token),
            json={'coupon_code': 'BADCOUPON'}
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertFalse(data['coupon_valid'])
        self.assertIsNotNone(data['coupon_error'])

    # =========================================================================
    # 6. Inventory deduction and oversell prevention
    # =========================================================================
    def test_inventory_deducted_on_order(self):
        token = self._register()
        self._add_to_user_cart(token, quantity=3)
        initial_stock = self.variant.stock_quantity

        res = self._place_order(token=token)
        self.assertEqual(res.status_code, 201)

        db.session.refresh(self.variant)
        self.assertEqual(self.variant.stock_quantity, initial_stock - 3)

    def test_insufficient_stock_rejected(self):
        token = self._register()
        # Try to order more than in stock (stock = 10)
        self._add_to_user_cart(token, quantity=10)
        # Now manually set stock to 5 to simulate concurrent depletion
        self.variant.stock_quantity = 5
        db.session.commit()

        res = self._place_order(token=token)
        self.assertEqual(res.status_code, 400)
        self.assertIn('stock', res.get_json()['error'].lower())

    def test_inactive_variant_rejected(self):
        token = self._register()
        self._add_to_user_cart(token, quantity=1)
        # Deactivate variant after adding to cart
        self.variant.is_active = False
        db.session.commit()

        res = self._place_order(token=token)
        self.assertEqual(res.status_code, 400)

    def test_inactive_product_rejected(self):
        token = self._register()
        self._add_to_user_cart(token, quantity=1)
        self.product.is_active = False
        db.session.commit()

        res = self._place_order(token=token)
        self.assertEqual(res.status_code, 400)

    # =========================================================================
    # 7. Order authorization — cross-user access blocked
    # =========================================================================
    def test_authenticated_owner_can_access_own_order(self):
        token = self._register()
        self._add_to_user_cart(token, quantity=1)
        create_res = self._place_order(token=token)
        order_id = create_res.get_json()['order']['id']

        res = self.client.get(f'/api/orders/{order_id}', headers=self._auth_header(token))
        self.assertEqual(res.status_code, 200)

    def test_other_user_cannot_access_order(self):
        # User A places order
        token_a = self._register(email='usera@bean.com')
        self._add_to_user_cart(token_a, quantity=1)
        create_res = self._place_order(token=token_a)
        order_id = create_res.get_json()['order']['id']

        # User B cannot access User A's order
        token_b = self._register(email='userb@bean.com')
        res = self.client.get(f'/api/orders/{order_id}', headers=self._auth_header(token_b))
        self.assertEqual(res.status_code, 404)

    def test_unauthenticated_order_id_access_rejected(self):
        token = self._register()
        self._add_to_user_cart(token, quantity=1)
        create_res = self._place_order(token=token)
        order_id = create_res.get_json()['order']['id']

        # Use a fresh client that does not carry the auth cookie
        fresh_client = self.app.test_client()
        res = fresh_client.get(f'/api/orders/{order_id}')
        self.assertEqual(res.status_code, 401)

    # =========================================================================
    # 8. Order lookup by number — requires guest_token for guests
    # =========================================================================
    def test_authenticated_owner_lookup_by_number(self):
        token = self._register()
        self._add_to_user_cart(token, quantity=1)
        create_res = self._place_order(token=token)
        order_number = create_res.get_json()['order']['order_number']

        res = self.client.get(f'/api/orders/lookup/{order_number}',
            headers=self._auth_header(token))
        self.assertEqual(res.status_code, 200)

    def test_order_lookup_without_token_rejected(self):
        """Unauthenticated request without guest_token must be refused (P0 fix)."""
        token = self._register()
        self._add_to_user_cart(token, quantity=1)
        create_res = self._place_order(token=token)
        order_number = create_res.get_json()['order']['order_number']

        # Use a fresh client that has no auth cookie
        fresh_client = self.app.test_client()
        res = fresh_client.get(f'/api/orders/lookup/{order_number}')
        self.assertEqual(res.status_code, 401)

    def test_guest_order_lookup_with_valid_token(self):
        """Guest can look up their own order using the issued guest_token."""
        # Create guest cart
        session_id = 'test-secure-session-abc123'
        cart = Cart(session_id=session_id)
        db.session.add(cart)
        db.session.flush()
        db.session.add(CartItem(cart_id=cart.id, product_id=self.product.id,
                                variant_id=self.variant.id, quantity=1))
        db.session.commit()

        create_res = self._place_order(session_id=session_id)
        self.assertEqual(create_res.status_code, 201)
        resp_data = create_res.get_json()
        order_number = resp_data['order']['order_number']
        guest_token = resp_data.get('guest_token')
        self.assertIsNotNone(guest_token, "Guest token must be issued for guest orders")

        # Lookup with valid guest token succeeds
        res = self.client.get(f'/api/orders/lookup/{order_number}?token={guest_token}')
        self.assertEqual(res.status_code, 200)

    def test_guest_order_lookup_with_wrong_token_rejected(self):
        session_id = 'test-secure-session-xyz999'
        cart = Cart(session_id=session_id)
        db.session.add(cart)
        db.session.flush()
        db.session.add(CartItem(cart_id=cart.id, product_id=self.product.id,
                                variant_id=self.variant.id, quantity=1))
        db.session.commit()

        create_res = self._place_order(session_id=session_id)
        order_number = create_res.get_json()['order']['order_number']

        res = self.client.get(f'/api/orders/lookup/{order_number}?token=wrongtoken')
        self.assertEqual(res.status_code, 403)

    def test_other_user_cannot_lookup_order_by_number(self):
        """Another authenticated user must not access someone else's order by number."""
        token_a = self._register(email='ownerA@bean.com')
        self._add_to_user_cart(token_a, quantity=1)
        create_res = self._place_order(token=token_a)
        order_number = create_res.get_json()['order']['order_number']

        token_b = self._register(email='attackerB@bean.com')
        res = self.client.get(f'/api/orders/lookup/{order_number}',
            headers=self._auth_header(token_b))
        self.assertEqual(res.status_code, 403)

    # =========================================================================
    # 9. Idempotency key — prevent duplicate orders on retry
    # =========================================================================
    def test_idempotency_prevents_duplicate_order(self):
        token = self._register()
        self._add_to_user_cart(token, quantity=1)

        key = 'idem-key-abc-123'
        res1 = self._place_order(token=token, idempotency_key=key)
        self.assertEqual(res1.status_code, 201)
        order_number_1 = res1.get_json()['order']['order_number']

        # Second request with same key: must return the original order
        res2 = self._place_order(token=token, idempotency_key=key)
        self.assertEqual(res2.status_code, 200)
        order_number_2 = res2.get_json()['order']['order_number']
        self.assertEqual(order_number_1, order_number_2)

        # Only one order should exist in the database
        orders = Order.query.all()
        self.assertEqual(len(orders), 1)

    # =========================================================================
    # 10. Invalid payment method rejected
    # =========================================================================
    def test_invalid_payment_method_rejected(self):
        token = self._register()
        self._add_to_user_cart(token, quantity=1)
        res = self._place_order(token=token, extra={'payment_method': 'bitcoin'})
        self.assertEqual(res.status_code, 400)

    # =========================================================================
    # 11. Missing required shipping fields rejected
    # =========================================================================
    def test_missing_shipping_field_rejected(self):
        token = self._register()
        self._add_to_user_cart(token, quantity=1)
        res = self.client.post('/api/orders',
            headers=self._auth_header(token),
            json={
                'shipping_address': {'full_name': 'Test'},  # missing phone, street, etc.
                'payment_method': 'cash_on_delivery',
                'shipping_method': 'standard'
            }
        )
        self.assertEqual(res.status_code, 400)

    # =========================================================================
    # 12. Cart cleared after successful order
    # =========================================================================
    def test_cart_cleared_after_order(self):
        token = self._register()
        self._add_to_user_cart(token, quantity=2)

        # Confirm cart has items
        cart_res = self.client.get('/api/cart', headers=self._auth_header(token))
        self.assertEqual(cart_res.get_json()['cart']['item_count'], 2)

        res = self._place_order(token=token)
        self.assertEqual(res.status_code, 201)

        # Cart should be empty now
        cart_res_after = self.client.get('/api/cart', headers=self._auth_header(token))
        self.assertEqual(cart_res_after.get_json()['cart']['item_count'], 0)

    # =========================================================================
    # 13. Order history — only own orders visible
    # =========================================================================
    def test_order_history_scoped_to_user(self):
        token_a = self._register(email='histA@bean.com')
        self._add_to_user_cart(token_a, quantity=1)
        self._place_order(token=token_a)

        token_b = self._register(email='histB@bean.com')
        # B places no orders

        res_b = self.client.get('/api/orders', headers=self._auth_header(token_b))
        self.assertEqual(res_b.status_code, 200)
        self.assertEqual(len(res_b.get_json()['orders']), 0)

        res_a = self.client.get('/api/orders', headers=self._auth_header(token_a))
        self.assertEqual(res_a.status_code, 200)
        self.assertEqual(len(res_a.get_json()['orders']), 1)


if __name__ == '__main__':
    unittest.main()
