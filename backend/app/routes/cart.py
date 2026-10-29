from flask import Blueprint, request, jsonify, current_app
from app.extensions import db
from app.models import Cart, CartItem, Product, ProductVariant
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

cart_bp = Blueprint('cart', __name__, url_prefix='/api/cart')

MAX_ITEM_QUANTITY = 100


def _get_or_create_cart():
    """Get cart for authenticated user, or guest cart via session_id header. Merges guest items upon login."""
    session_id = (request.headers.get('X-Session-ID') or '').strip()
    try:
        verify_jwt_in_request(optional=True)
        user_id_raw = get_jwt_identity()
        if user_id_raw:
            user_id = int(user_id_raw)
            cart = Cart.query.filter_by(user_id=user_id).first()
            if not cart:
                cart = Cart(user_id=user_id)
                db.session.add(cart)
                db.session.flush()

            # Merge guest cart if one existed for this session
            if session_id:
                guest_cart = Cart.query.filter_by(session_id=session_id).first()
                if guest_cart and guest_cart.id != cart.id:
                    for g_item in guest_cart.items:
                        variant = db.session.get(ProductVariant, g_item.variant_id)
                        product = db.session.get(Product, g_item.product_id)
                        if not variant or not product or not variant.is_active or not product.is_active:
                            continue  # Skip inactive or missing products

                        available_stock = variant.stock_quantity
                        if available_stock <= 0:
                            continue

                        existing = CartItem.query.filter_by(
                            cart_id=cart.id, product_id=g_item.product_id, variant_id=g_item.variant_id
                        ).first()

                        if existing:
                            new_qty = min(existing.quantity + g_item.quantity, min(available_stock, MAX_ITEM_QUANTITY))
                            existing.quantity = new_qty
                        else:
                            qty = min(g_item.quantity, min(available_stock, MAX_ITEM_QUANTITY))
                            new_item = CartItem(
                                cart_id=cart.id,
                                product_id=g_item.product_id,
                                variant_id=g_item.variant_id,
                                quantity=qty
                            )
                            db.session.add(new_item)

                    db.session.delete(guest_cart)
            db.session.commit()
            return cart
    except Exception as e:
        db.session.rollback()
        current_app.logger.warning("Error resolving user cart: %s", str(e))

    if not session_id:
        return None
    cart = Cart.query.filter_by(session_id=session_id).first()
    if not cart:
        cart = Cart(session_id=session_id)
        db.session.add(cart)
        db.session.commit()
    return cart


@cart_bp.route('', methods=['GET'])
def get_cart():
    cart = _get_or_create_cart()
    if not cart:
        return jsonify({'cart': {'items': [], 'subtotal': 0, 'item_count': 0}}), 200
    return jsonify({'cart': cart.to_dict()}), 200


@cart_bp.route('/items', methods=['POST'])
def add_to_cart():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({'error': 'Invalid request body; JSON object expected'}), 400

    product_id = data.get('product_id')
    variant_id = data.get('variant_id')
    quantity = data.get('quantity', 1)

    # Validate IDs — explicitly disallow booleans and negative numbers
    if isinstance(product_id, bool) or not isinstance(product_id, int) or product_id <= 0:
        return jsonify({'error': 'Valid product_id is required'}), 400

    if isinstance(variant_id, bool) or not isinstance(variant_id, int) or variant_id <= 0:
        return jsonify({'error': 'Valid variant_id is required'}), 400

    # Validate quantity
    if isinstance(quantity, bool) or not isinstance(quantity, int) or quantity < 1 or quantity > MAX_ITEM_QUANTITY:
        return jsonify({'error': f'Quantity must be an integer between 1 and {MAX_ITEM_QUANTITY}'}), 400

    product = db.session.get(Product, product_id)
    if not product or not product.is_active:
        return jsonify({'error': 'Product not found'}), 404

    variant = db.session.get(ProductVariant, variant_id)
    if not variant or variant.product_id != product_id or not variant.is_active:
        return jsonify({'error': 'Variant not found'}), 404

    if variant.stock_quantity < quantity:
        return jsonify({'error': f'Insufficient stock. Only {variant.stock_quantity} available.'}), 400

    cart = _get_or_create_cart()
    if not cart:
        return jsonify({'error': 'Session ID required for guest cart'}), 400

    # Check if item already in cart
    existing = CartItem.query.filter_by(
        cart_id=cart.id, product_id=product_id, variant_id=variant_id
    ).first()

    if existing:
        new_qty = existing.quantity + quantity
        if new_qty > MAX_ITEM_QUANTITY:
            return jsonify({'error': f'Cannot add more than {MAX_ITEM_QUANTITY} units of an item to cart'}), 400
        if variant.stock_quantity < new_qty:
            return jsonify({'error': f'Insufficient stock. Only {variant.stock_quantity} available.'}), 400
        existing.quantity = new_qty
    else:
        item = CartItem(
            cart_id=cart.id,
            product_id=product_id,
            variant_id=variant_id,
            quantity=quantity
        )
        db.session.add(item)

    db.session.commit()
    return jsonify({'cart': cart.to_dict(), 'message': 'Added to cart'}), 200


@cart_bp.route('/items/<int:item_id>', methods=['PATCH'])
def update_cart_item(item_id):
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({'error': 'Invalid request body; JSON object expected'}), 400

    quantity = data.get('quantity')
    if quantity is None or isinstance(quantity, bool) or not isinstance(quantity, int) or quantity < 0 or quantity > MAX_ITEM_QUANTITY:
        return jsonify({'error': f'Valid quantity between 0 and {MAX_ITEM_QUANTITY} required'}), 400

    cart = _get_or_create_cart()
    if not cart:
        return jsonify({'error': 'Cart not found'}), 404

    item = CartItem.query.filter_by(id=item_id, cart_id=cart.id).first()
    if not item:
        return jsonify({'error': 'Cart item not found'}), 404

    if quantity == 0:
        db.session.delete(item)
    else:
        if not item.variant or not item.variant.is_active:
            return jsonify({'error': 'Product variant is no longer available'}), 400
        if item.variant.stock_quantity < quantity:
            return jsonify({'error': f'Insufficient stock. Only {item.variant.stock_quantity} available.'}), 400
        item.quantity = quantity

    db.session.commit()
    return jsonify({'cart': cart.to_dict()}), 200


@cart_bp.route('/items/<int:item_id>', methods=['DELETE'])
def remove_cart_item(item_id):
    cart = _get_or_create_cart()
    if not cart:
        return jsonify({'error': 'Cart not found'}), 404

    item = CartItem.query.filter_by(id=item_id, cart_id=cart.id).first()
    if not item:
        return jsonify({'error': 'Cart item not found'}), 404

    db.session.delete(item)
    db.session.commit()
    return jsonify({'cart': cart.to_dict(), 'message': 'Item removed'}), 200


@cart_bp.route('/clear', methods=['DELETE'])
def clear_cart():
    cart = _get_or_create_cart()
    if cart:
        CartItem.query.filter_by(cart_id=cart.id).delete()
        db.session.commit()
    return jsonify({'message': 'Cart cleared'}), 200
