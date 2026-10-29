from datetime import datetime, timezone
from app.extensions import db


def _now_utc():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Order(db.Model):
    __tablename__ = 'orders'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    order_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    status = db.Column(db.String(50), default='pending')
    # pending, confirmed, processing, shipped, delivered, cancelled

    payment_status = db.Column(db.String(50), default='pending')
    payment_method = db.Column(db.String(50))
    shipping_method = db.Column(db.String(50), default='standard')

    subtotal = db.Column(db.Numeric(10, 2), nullable=False)
    shipping_cost = db.Column(db.Numeric(10, 2), default=0)
    discount_amount = db.Column(db.Numeric(10, 2), default=0)
    coupon_code = db.Column(db.String(50), nullable=True)
    total = db.Column(db.Numeric(10, 2), nullable=False)
    notes = db.Column(db.Text)

    # Shipping address snapshot at order time
    shipping_full_name = db.Column(db.String(200))
    shipping_phone = db.Column(db.String(20))
    shipping_street = db.Column(db.String(255))
    shipping_city = db.Column(db.String(100))
    shipping_district = db.Column(db.String(100))
    shipping_province = db.Column(db.String(100))

    # High-entropy token for guest order tracking (stored securely as hash)
    guest_token = db.Column(db.String(64), nullable=True, index=True)
    guest_token_hash = db.Column(db.String(64), nullable=True, index=True)

    # Server-side idempotency key to prevent duplicate orders from retries
    idempotency_key = db.Column(db.String(255), nullable=True, unique=True, index=True)
    idempotency_payload_hash = db.Column(db.String(64), nullable=True)

    created_at = db.Column(db.DateTime, default=_now_utc)
    updated_at = db.Column(db.DateTime, default=_now_utc, onupdate=_now_utc)

    items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'order_number': self.order_number,
            'status': self.status,
            'payment_status': self.payment_status,
            'payment_method': self.payment_method,
            'shipping_method': self.shipping_method,
            'subtotal': float(self.subtotal),
            'shipping_cost': float(self.shipping_cost),
            'discount_amount': float(self.discount_amount),
            'coupon_code': self.coupon_code,
            'total': float(self.total),
            'notes': self.notes,
            'shipping_address': {
                'full_name': self.shipping_full_name,
                'phone': self.shipping_phone,
                'street': self.shipping_street,
                'city': self.shipping_city,
                'district': self.shipping_district,
                'province': self.shipping_province,
            },
            'items': [item.to_dict() for item in self.items],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class OrderItem(db.Model):
    __tablename__ = 'order_items'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    variant_id = db.Column(db.Integer, db.ForeignKey('product_variants.id'), nullable=False)
    product_name = db.Column(db.String(255), nullable=False)   # purchase-time snapshot
    variant_name = db.Column(db.String(100), nullable=False)   # purchase-time snapshot
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)  # purchase-time snapshot
    quantity = db.Column(db.Integer, nullable=False)
    line_total = db.Column(db.Numeric(10, 2), nullable=False)

    product = db.relationship('Product', lazy=True)
    variant = db.relationship('ProductVariant', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'variant_id': self.variant_id,
            'product_name': self.product_name,
            'variant_name': self.variant_name,
            'unit_price': float(self.unit_price),
            'quantity': self.quantity,
            'line_total': float(self.line_total),
            'product_image': self.product.primary_image if self.product else None
        }
