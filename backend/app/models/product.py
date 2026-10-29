from datetime import datetime, timezone
from app.extensions import db

class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(120), unique=True, nullable=False, index=True)
    description = db.Column(db.Text)
    image_url = db.Column(db.String(500))
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    products = db.relationship('Product', backref='category', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description,
            'image_url': self.image_url,
            'product_count': len(self.products)
        }


class Product(db.Model):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(300), unique=True, nullable=False, index=True)
    short_description = db.Column(db.String(500))
    description = db.Column(db.Text)
    origin = db.Column(db.String(100))
    roast_level = db.Column(db.String(50))  # Light, Medium, Dark
    process = db.Column(db.String(100))
    flavor_notes = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)
    is_featured = db.Column(db.Boolean, default=False)
    is_new = db.Column(db.Boolean, default=False)
    is_best_seller = db.Column(db.Boolean, default=False)
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    # Relationships
    variants = db.relationship('ProductVariant', backref='product', lazy=True, cascade='all, delete-orphan')
    images = db.relationship('ProductImage', backref='product', lazy=True, cascade='all, delete-orphan')
    wishlist_items = db.relationship('WishlistItem', backref='product', lazy=True)

    @property
    def base_price(self):
        active_variants = [v for v in self.variants if v.is_active]
        sorted_vars = sorted(active_variants, key=lambda v: v.price)
        return sorted_vars[0].price if sorted_vars else 0

    @property
    def compare_price(self):
        active_variants = [v for v in self.variants if v.is_active]
        sorted_vars = sorted(active_variants, key=lambda v: v.price)
        return sorted_vars[0].compare_at_price if sorted_vars else None

    @property
    def primary_image(self):
        images = sorted(self.images, key=lambda i: i.sort_order)
        return images[0].url if images else None

    def to_dict(self, include_variants=True):
        active_variants = [v for v in self.variants if v.is_active]
        data = {
            'id': self.id,
            'category_id': self.category_id,
            'category': self.category.name if self.category else None,
            'category_slug': self.category.slug if self.category else None,
            'name': self.name,
            'slug': self.slug,
            'short_description': self.short_description,
            'description': self.description,
            'origin': self.origin,
            'roast_level': self.roast_level,
            'process': self.process,
            'flavor_notes': self.flavor_notes,
            'is_active': self.is_active,
            'is_featured': self.is_featured,
            'is_new': self.is_new,
            'is_best_seller': self.is_best_seller,
            'base_price': float(self.base_price),
            'compare_price': float(self.compare_price) if self.compare_price else None,
            'primary_image': self.primary_image,
            'images': [img.to_dict() for img in sorted(self.images, key=lambda i: i.sort_order)],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_variants:
            data['variants'] = [v.to_dict() for v in active_variants]
        return data


class ProductVariant(db.Model):
    __tablename__ = 'product_variants'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)  # e.g., "250g", "500g", "1kg"
    sku = db.Column(db.String(100), unique=True)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    compare_at_price = db.Column(db.Numeric(10, 2))
    stock_quantity = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'sku': self.sku,
            'price': float(self.price),
            'compare_at_price': float(self.compare_at_price) if self.compare_at_price else None,
            'stock_quantity': self.stock_quantity,
            'in_stock': self.stock_quantity > 0,
            'is_active': self.is_active
        }


class ProductImage(db.Model):
    __tablename__ = 'product_images'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    alt_text = db.Column(db.String(255))
    sort_order = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'url': self.url,
            'alt_text': self.alt_text,
            'sort_order': self.sort_order
        }
