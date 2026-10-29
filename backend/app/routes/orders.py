import hashlib
import json
import secrets
import uuid
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

from flask import Blueprint, request, jsonify, current_app
from sqlalchemy.exc import IntegrityError
from app.extensions import db
from app.models import Order, OrderItem, Cart, CartItem, Product, ProductVariant, User, Address
from flask_jwt_extended import jwt_required, get_jwt_identity

orders_bp = Blueprint('orders', __name__, url_prefix='/api/orders')

# ---------------------------------------------------------------------------
# Supported options (authoritative — single source of truth)
# ---------------------------------------------------------------------------
SUPPORTED_PAYMENT_METHODS = {'cash_on_delivery'}
UNSUPPORTED_PAYMENT_METHODS = {'esewa', 'khalti', 'card'}
SUPPORTED_SHIPPING_METHODS = {'standard', 'express'}

FREE_SHIPPING_THRESHOLD = Decimal('2000.00')
SHIPPING_STANDARD_COST  = Decimal('100.00')
SHIPPING_EXPRESS_COST   = Decimal('250.00')

# Supported coupon registry (backend authoritative)
_COUPONS = {
    'BEAN10': {'type': 'percent', 'value': Decimal('10')},
    'FRESH150': {'type': 'fixed', 'value': Decimal('150.00')},
}

MAX_ITEM_QUANTITY = 100


def _now_utc():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def generate_order_number():
    return f"KC-{_now_utc().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"


def _calculate_shipping(subtotal: Decimal, method: str) -> Decimal:
    """Server-authoritative shipping cost calculation."""
    if method not in SUPPORTED_SHIPPING_METHODS:
        raise ValueError(f"Unsupported shipping method: {method}")
    if method == 'express':
        return SHIPPING_EXPRESS_COST
    # Standard: free over threshold
    return Decimal('0.00') if subtotal >= FREE_SHIPPING_THRESHOLD else SHIPPING_STANDARD_COST


def _apply_coupon(code: str, subtotal: Decimal):
    """Validate and calculate coupon discount.  Returns (discount_amount, error_msg)."""
    if not code:
        return Decimal('0.00'), None
    coupon = _COUPONS.get(code.strip().upper())
    if not coupon:
        return Decimal('0.00'), f"Coupon code '{code}' is not valid."
    if coupon['type'] == 'percent':
        discount = (subtotal * coupon['value'] / Decimal('100')).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    else:
        discount = coupon['value']
    # Discount cannot exceed subtotal
    discount = min(discount, subtotal)
    return discount, None


def _matches_order_request(order, data):
    """Verifies that an existing order matches the submitted checkout payload."""
    shipping = data.get('shipping_address') or {}
    if not isinstance(shipping, dict):
        return False
    fields = [
        (order.shipping_full_name, str(shipping.get('full_name', '')).strip()),
        (order.shipping_phone, str(shipping.get('phone', '')).strip()),
        (order.shipping_street, str(shipping.get('street', '')).strip()),
        (order.shipping_city, str(shipping.get('city', '')).strip()),
        (order.shipping_district, str(shipping.get('district', '')).strip()),
        (order.shipping_province, str(shipping.get('province', '')).strip()),
        (order.shipping_method, str(data.get('shipping_method', 'standard')).strip()),
        (order.payment_method, str(data.get('payment_method', 'cash_on_delivery')).strip()),
        (order.coupon_code or '', str(data.get('coupon_code', '') or '').strip().upper()),
        (order.notes or '', str(data.get('notes', '') or '')[:1000].strip()),
    ]
    return all(db_val == req_val for db_val, req_val in fields)


def _compute_payload_hash(shipping, shipping_method, payment_method, coupon_code, notes, cart_items):
    canonical = {
        'shipping': {
            k: str(shipping.get(k, '')).strip()
            for k in ['full_name', 'phone', 'street', 'city', 'district', 'province']
        },
        'shipping_method': shipping_method,
        'payment_method': payment_method,
        'coupon_code': (coupon_code or '').strip().upper(),
        'notes': (notes or '').strip(),
        'items': sorted([
            {
                'product_id': item['product'].id,
                'variant_id': item['variant'].id,
                'quantity': item['quantity']
            }
            for item in cart_items
        ], key=lambda x: (x['product_id'], x['variant_id']))
    }
    raw = json.dumps(canonical, sort_keys=True)
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()


# ---------------------------------------------------------------------------
# GET /api/orders  — authenticated user's order history
# ---------------------------------------------------------------------------
@orders_bp.route('', methods=['GET'])
@jwt_required()
def get_orders():
    user_id = int(get_jwt_identity())
    orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
    return jsonify({'orders': [o.to_dict() for o in orders]}), 200


# ---------------------------------------------------------------------------
# GET /api/orders/<id>  — authenticated, ownership-enforced
# ---------------------------------------------------------------------------
@orders_bp.route('/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    user_id = int(get_jwt_identity())
    order = Order.query.filter_by(id=order_id, user_id=user_id).first_or_404()
    return jsonify({'order': order.to_dict()}), 200


# ---------------------------------------------------------------------------
# GET /api/orders/lookup/<order_number>  — requires guest_token OR auth owner
# An unauthenticated caller must supply the per-order guest_token issued at
# creation time. Authenticated callers must own the order.
# ---------------------------------------------------------------------------
@orders_bp.route('/lookup/<string:order_number>', methods=['GET'])
def get_order_by_number(order_number):
    order = Order.query.filter_by(order_number=order_number).first_or_404()

    from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
    authenticated_user_id = None
    try:
        verify_jwt_in_request(optional=True)
        uid_raw = get_jwt_identity()
        if uid_raw:
            authenticated_user_id = int(uid_raw)
    except Exception:
        authenticated_user_id = None

    # Check for authenticated owner of an authenticated customer order
    if authenticated_user_id is not None:
        if order.user_id is not None:
            if order.user_id != authenticated_user_id:
                return jsonify({'error': 'Access denied to this order.'}), 403
            return jsonify({'order': order.to_dict()}), 200
        # If order.user_id is None (guest order), an authenticated user
        # DOES NOT automatically gain access! They must provide the valid guest token below.

    # Guest access or guest order verification
    guest_token = (request.args.get('token') or request.headers.get('X-Guest-Token') or '').strip()
    if not guest_token:
        return jsonify({
            'error': 'A valid guest token is required to access this order.',
            'code': 'guest_token_required'
        }), 401

    # If the order belongs to an authenticated user, an unauthenticated token lookup fails
    if order.user_id is not None:
        return jsonify({'error': 'Invalid or expired guest token.'}), 403

    token_hash = hashlib.sha256(guest_token.encode('utf-8')).hexdigest()
    matched = False
    if order.guest_token_hash and secrets.compare_digest(order.guest_token_hash, token_hash):
        matched = True
    elif order.guest_token and secrets.compare_digest(order.guest_token, guest_token):
        matched = True

    if not matched:
        return jsonify({'error': 'Invalid or expired guest token.'}), 403

    return jsonify({'order': order.to_dict()}), 200


# ---------------------------------------------------------------------------
# POST /api/orders  — create order (authenticated or guest)
# ---------------------------------------------------------------------------
@orders_bp.route('', methods=['POST'])
@jwt_required(optional=True)
def create_order():
    user_id_raw = get_jwt_identity()
    user_id = int(user_id_raw) if user_id_raw else None
    data = request.get_json(silent=True) or {}
    session_id = (request.headers.get('X-Session-ID') or '').strip()

    # ---- Idempotency key check ----
    raw_idempotency_key = (request.headers.get('X-Idempotency-Key') or '').strip()[:200]
    scoped_idempotency_key = None

    if raw_idempotency_key:
        if user_id:
            scoped_idempotency_key = f"usr_{user_id}:{raw_idempotency_key}"
        elif session_id:
            scoped_idempotency_key = f"ses_{session_id}:{raw_idempotency_key}"
        else:
            scoped_idempotency_key = f"gst_{raw_idempotency_key}"

        # Match scoped key or raw key (for backwards compatibility)
        existing = Order.query.filter(
            db.or_(
                Order.idempotency_key == scoped_idempotency_key,
                Order.idempotency_key == raw_idempotency_key
            )
        ).first()

        if existing:
            # Check ownership / isolation
            if user_id and existing.user_id != user_id:
                return jsonify({
                    'error': 'Idempotency key conflict: key belongs to another user.',
                    'code': 'idempotency_conflict'
                }), 409
            if not user_id and existing.user_id is not None:
                return jsonify({
                    'error': 'Idempotency key conflict: cannot reuse authenticated key for guest order.',
                    'code': 'idempotency_conflict'
                }), 409

            # Check if payload matches the original order
            if not _matches_order_request(existing, data):
                return jsonify({
                    'error': 'Idempotency key reused with a different checkout request payload.',
                    'code': 'idempotency_payload_mismatch'
                }), 409

            # Safe retry of identical request: return original order
            return jsonify({
                'order': existing.to_dict(),
                'message': 'Order already created',
                'idempotent_replay': True
            }), 200

    # ---- Validate shipping address ----
    required_shipping = ['full_name', 'phone', 'street', 'city', 'district', 'province']
    shipping = data.get('shipping_address', {})
    if not isinstance(shipping, dict):
        return jsonify({'error': 'Invalid shipping_address format'}), 400
    for field in required_shipping:
        val = shipping.get(field, '')
        if not isinstance(val, str) or not val.strip():
            return jsonify({'error': f'Shipping {field.replace("_"," ")} is required'}), 400

    # ---- Validate payment method ----
    payment_method = str(data.get('payment_method', 'cash_on_delivery')).strip()
    if payment_method in UNSUPPORTED_PAYMENT_METHODS:
        return jsonify({
            'error': f'Payment via {payment_method.capitalize()} is currently unavailable. Please select Cash on Delivery.',
            'code': 'payment_method_unavailable'
        }), 400
    if payment_method not in SUPPORTED_PAYMENT_METHODS:
        return jsonify({'error': f'Payment method not supported. Allowed: {", ".join(sorted(SUPPORTED_PAYMENT_METHODS))}'}), 400

    # ---- Validate shipping method ----
    shipping_method = str(data.get('shipping_method', 'standard')).strip()
    if shipping_method not in SUPPORTED_SHIPPING_METHODS:
        return jsonify({'error': f'Shipping method not supported. Allowed: {", ".join(sorted(SUPPORTED_SHIPPING_METHODS))}'}), 400

    # ---- Fetch authoritative cart ----
    if user_id:
        cart = Cart.query.filter_by(user_id=user_id).first()
    else:
        cart = Cart.query.filter_by(session_id=session_id).first() if session_id else None

    if not cart or not cart.items:
        return jsonify({'error': 'Cart is empty'}), 400

    # ---- Validate items & calculate subtotal using Decimal arithmetic ----
    subtotal = Decimal('0.00')
    order_items_data = []

    for cart_item in cart.items:
        # Validate quantity
        qty = cart_item.quantity
        if not isinstance(qty, int) or qty < 1 or qty > MAX_ITEM_QUANTITY:
            return jsonify({'error': f'Invalid quantity for item {cart_item.id}'}), 400

        # Reload variant to prevent overselling
        variant = db.session.get(ProductVariant, cart_item.variant_id)
        if not variant or not variant.is_active:
            return jsonify({'error': f'Product variant is no longer available'}), 400

        product = db.session.get(Product, cart_item.product_id)
        if not product or not product.is_active:
            return jsonify({'error': f'Product "{product.name if product else cart_item.product_id}" is no longer available'}), 400

        if variant.product_id != product.id:
            return jsonify({'error': 'Variant does not belong to the specified product'}), 400

        if variant.stock_quantity < qty:
            return jsonify({
                'error': f'Insufficient stock for "{product.name}" ({variant.name}). '
                         f'Only {variant.stock_quantity} available.'
            }), 400

        # Use server-authoritative price (Decimal)
        unit_price = Decimal(str(variant.price))
        line_total = (unit_price * qty).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        subtotal += line_total

        order_items_data.append({
            'product': product,
            'variant': variant,
            'quantity': qty,
            'unit_price': unit_price,
            'line_total': line_total
        })

    # ---- Server-side coupon validation ----
    coupon_code = str(data.get('coupon_code', '') or '').strip().upper()
    discount_amount, coupon_error = _apply_coupon(coupon_code, subtotal)
    if coupon_error:
        return jsonify({'error': coupon_error}), 400

    # ---- Server-side shipping calculation ----
    shipping_cost = _calculate_shipping(subtotal, shipping_method)

    # ---- Final authoritative total ----
    total = (subtotal - discount_amount + shipping_cost).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    if total < Decimal('0.00'):
        total = Decimal('0.00')

    # ---- Notes validation ----
    notes = str(data.get('notes', '') or '')[:1000]

    payload_hash = _compute_payload_hash(
        shipping, shipping_method, payment_method, coupon_code, notes, order_items_data
    )

    try:
        # Issue a guest token for unauthenticated order tracking
        new_guest_token = secrets.token_urlsafe(32) if not user_id else None
        guest_token_hash = hashlib.sha256(new_guest_token.encode('utf-8')).hexdigest() if new_guest_token else None

        order = Order(
            user_id=user_id,
            order_number=generate_order_number(),
            status='pending',
            payment_status='pending',
            payment_method=payment_method,
            shipping_method=shipping_method,
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            discount_amount=discount_amount,
            coupon_code=coupon_code or None,
            total=total,
            notes=notes,
            guest_token=None,  # Cryptographic safety: store only SHA-256 hash in DB, plaintext returned to client
            guest_token_hash=guest_token_hash,
            idempotency_key=scoped_idempotency_key,
            idempotency_payload_hash=payload_hash,
            shipping_full_name=shipping['full_name'].strip(),
            shipping_phone=shipping['phone'].strip(),
            shipping_street=shipping['street'].strip(),
            shipping_city=shipping['city'].strip(),
            shipping_district=shipping['district'].strip(),
            shipping_province=shipping['province'].strip(),
        )
        db.session.add(order)
        db.session.flush()  # Get order.id before creating items

        for item_data in order_items_data:
            order_item = OrderItem(
                order_id=order.id,
                product_id=item_data['product'].id,
                variant_id=item_data['variant'].id,
                product_name=item_data['product'].name,
                variant_name=item_data['variant'].name,
                unit_price=item_data['unit_price'],
                quantity=item_data['quantity'],
                line_total=item_data['line_total']
            )
            db.session.add(order_item)

            # Atomic inventory decrement — concurrency safe
            updated = db.session.execute(
                db.update(ProductVariant)
                .where(
                    ProductVariant.id == item_data['variant'].id,
                    ProductVariant.stock_quantity >= item_data['quantity']
                )
                .values(stock_quantity=ProductVariant.stock_quantity - item_data['quantity'])
            )
            if updated.rowcount == 0:
                # Concurrent order depleted stock between read and write
                db.session.rollback()
                return jsonify({
                    'error': f'Insufficient stock for "{item_data["product"].name}" ({item_data["variant"].name}). '
                             f'Please update your cart and try again.'
                }), 409

        # Clear cart after successful inventory reservation
        CartItem.query.filter_by(cart_id=cart.id).delete()

        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            # Handle concurrent order with the same idempotency key
            if scoped_idempotency_key:
                existing = Order.query.filter_by(idempotency_key=scoped_idempotency_key).first()
                if existing:
                    if not _matches_order_request(existing, data):
                        return jsonify({
                            'error': 'Idempotency key reused with a different checkout request payload.',
                            'code': 'idempotency_payload_mismatch'
                        }), 409
                    return jsonify({'order': existing.to_dict(), 'message': 'Order already created'}), 200
            return jsonify({'error': 'A concurrent order request conflict occurred. Please retry.'}), 409

        response_data = {'order': order.to_dict(), 'message': 'Order placed successfully'}
        if new_guest_token:
            response_data['guest_token'] = new_guest_token

        return jsonify(response_data), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error("Order creation error: %s", str(e))
        return jsonify({'error': 'Failed to create order. Please try again.'}), 500


# ---------------------------------------------------------------------------
# GET /api/orders/quote  — preview server-calculated totals before checkout
# ---------------------------------------------------------------------------
@orders_bp.route('/quote', methods=['POST'])
@jwt_required(optional=True)
def get_checkout_quote():
    """Returns server-calculated subtotal, shipping, discount, and total
    for the current cart and supplied checkout options. The frontend must
    display these values rather than computing its own totals."""
    user_id_raw = get_jwt_identity()
    user_id = int(user_id_raw) if user_id_raw else None
    data = request.get_json() or {}

    if user_id:
        cart = Cart.query.filter_by(user_id=user_id).first()
    else:
        session_id = request.headers.get('X-Session-ID', '').strip()
        cart = Cart.query.filter_by(session_id=session_id).first() if session_id else None

    if not cart or not cart.items:
        return jsonify({
            'subtotal': 0, 'shipping_cost': 0,
            'discount_amount': 0, 'total': 0,
            'coupon_valid': None
        }), 200

    subtotal = Decimal('0.00')
    for cart_item in cart.items:
        variant = db.session.get(ProductVariant, cart_item.variant_id)
        if variant and variant.is_active:
            subtotal += Decimal(str(variant.price)) * cart_item.quantity

    shipping_method = str(data.get('shipping_method', 'standard')).strip()
    if shipping_method not in SUPPORTED_SHIPPING_METHODS:
        shipping_method = 'standard'

    shipping_cost = _calculate_shipping(subtotal, shipping_method)

    coupon_code = str(data.get('coupon_code', '') or '').strip().upper()
    discount_amount, coupon_error = _apply_coupon(coupon_code, subtotal)

    total = max(Decimal('0.00'), subtotal - discount_amount + shipping_cost)

    return jsonify({
        'subtotal': float(subtotal),
        'shipping_cost': float(shipping_cost),
        'discount_amount': float(discount_amount),
        'total': float(total),
        'coupon_valid': coupon_code and not coupon_error,
        'coupon_error': coupon_error
    }), 200
