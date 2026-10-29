from datetime import datetime, timezone
from app.extensions import db

class Cart(db.Model):
    __tablename__ = 'carts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    session_id = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    items = db.relationship('CartItem', backref='cart', lazy=True, cascade='all, delete-orphan')

    @property
    def subtotal(self):
        return sum(item.line_total for item in self.items)

    @property
    def item_count(self):
        return sum(item.quantity for item in self.items)

    def to_dict(self):
        return {
            'id': self.id,
            'items': [item.to_dict() for item in self.items],
            'subtotal': float(self.subtotal),
            'item_count': self.item_count
        }


class CartItem(db.Model):
    __tablename__ = 'cart_items'
    __table_args__ = (db.UniqueConstraint('cart_id', 'variant_id', name='uq_cart_items_cart_variant'),)

    id = db.Column(db.Integer, primary_key=True)
    cart_id = db.Column(db.Integer, db.ForeignKey('carts.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    variant_id = db.Column(db.Integer, db.ForeignKey('product_variants.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    added_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    product = db.relationship('Product', lazy=True)
    variant = db.relationship('ProductVariant', lazy=True)

    @property
    def line_total(self):
        return self.quantity * self.variant.price

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'variant_id': self.variant_id,
            'quantity': self.quantity,
            'product': {
                'id': self.product.id,
                'name': self.product.name,
                'slug': self.product.slug,
                'primary_image': self.product.primary_image
            },
            'variant': self.variant.to_dict(),
            'line_total': float(self.line_total)
        }


class WishlistItem(db.Model):
    __tablename__ = 'wishlist_items'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    added_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    __table_args__ = (db.UniqueConstraint('user_id', 'product_id'),)
