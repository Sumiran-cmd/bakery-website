from app.routes.auth import auth_bp
from app.routes.products import products_bp
from app.routes.cart import cart_bp
from app.routes.orders import orders_bp

__all__ = ['auth_bp', 'products_bp', 'cart_bp', 'orders_bp']
