"""
Seed script: Initialize the database with categories and products.
Run: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from app.extensions import db
from app.models import (
    Category, Product, ProductVariant, ProductImage,
    User
)

app = create_app()

CATEGORIES = [
    {'name': 'Whole Bean', 'slug': 'whole-bean', 'description': 'Premium whole bean coffees sourced from Nepal\'s finest farms', 'sort_order': 1},
    {'name': 'Ground Coffee', 'slug': 'ground-coffee', 'description': 'Pre-ground for your convenience, freshly roasted', 'sort_order': 2},
    {'name': 'Espresso', 'slug': 'espresso', 'description': 'Specially crafted blends for espresso brewing', 'sort_order': 3},
    {'name': 'Filter Coffee', 'slug': 'filter-coffee', 'description': 'Perfect for pour-over, drip and French press', 'sort_order': 4},
    {'name': 'Single Origin', 'slug': 'single-origin', 'description': 'Traceable coffee from single farms and cooperatives', 'sort_order': 5},
    {'name': 'Accessories', 'slug': 'accessories', 'description': 'Premium coffee brewing equipment and accessories', 'sort_order': 6},
]

PRODUCTS = [
    # Whole Bean
    {
        'category_slug': 'whole-bean',
        'name': 'Ilam Gold Whole Bean',
        'slug': 'ilam-gold-whole-bean',
        'short_description': 'Bright, floral Arabica from the hills of Ilam, Eastern Nepal',
        'description': 'Our signature Ilam Gold is sourced from small family farms at 1,800m altitude in Ilam district. The beans carry a bright acidity with jasmine florals and stone fruit sweetness—a distinctly Nepali cup.',
        'origin': 'Ilam, Eastern Nepal',
        'roast_level': 'Medium',
        'process': 'Washed',
        'flavor_notes': 'Jasmine, Peach, Bright Citrus',
        'is_featured': True, 'is_best_seller': True, 'is_new': False, 'sort_order': 1,
        'variants': [
            {'name': '250g', 'sku': 'ILG-WB-250', 'price': 850, 'compare_at_price': 950, 'stock': 50},
            {'name': '500g', 'sku': 'ILG-WB-500', 'price': 1600, 'compare_at_price': None, 'stock': 30},
            {'name': '1kg', 'sku': 'ILG-WB-1KG', 'price': 2999, 'compare_at_price': None, 'stock': 20},
        ]
    },
    {
        'category_slug': 'whole-bean',
        'name': 'Kavre Dark Roast Whole Bean',
        'slug': 'kavre-dark-roast-whole-bean',
        'short_description': 'Bold, chocolatey dark roast from Kavre district farms',
        'description': 'Sourced from Kavre district\'s cooperative farms, this dark roast delivers a rich chocolatey body with smoky undertones—perfect for espresso or a robust morning cup.',
        'origin': 'Kavre, Bagmati Province',
        'roast_level': 'Dark',
        'process': 'Natural',
        'flavor_notes': 'Dark Chocolate, Smoky, Walnut',
        'is_featured': True, 'is_best_seller': False, 'is_new': False, 'sort_order': 2,
        'variants': [
            {'name': '250g', 'sku': 'KVR-DB-250', 'price': 799, 'compare_at_price': None, 'stock': 40},
            {'name': '500g', 'sku': 'KVR-DB-500', 'price': 1499, 'compare_at_price': None, 'stock': 25},
        ]
    },
    # Ground Coffee
    {
        'category_slug': 'ground-coffee',
        'name': 'Bean Theory House Blend Ground',
        'slug': 'bean-theory-house-blend-ground',
        'short_description': 'Our beloved house blend, perfectly ground for drip brewing',
        'description': 'A careful blend of Ilam and Kavre Arabica beans, ground to a universal medium coarseness. Smooth, balanced, and approachable—the perfect everyday cup.',
        'origin': 'Nepal Blend',
        'roast_level': 'Medium',
        'process': 'Washed & Natural blend',
        'flavor_notes': 'Caramel, Hazelnut, Mild Citrus',
        'is_featured': True, 'is_best_seller': True, 'is_new': False, 'sort_order': 3,
        'variants': [
            {'name': '250g', 'sku': 'KHB-GR-250', 'price': 699, 'compare_at_price': None, 'stock': 60},
            {'name': '500g', 'sku': 'KHB-GR-500', 'price': 1299, 'compare_at_price': 1499, 'stock': 35},
        ]
    },
    {
        'category_slug': 'ground-coffee',
        'name': 'Mountain Mist Medium Grind',
        'slug': 'mountain-mist-medium-grind',
        'short_description': 'Light-medium roast, ideal for pour-over and Aeropress',
        'description': 'Delicately roasted and medium-ground, Mountain Mist highlights the terroir of Nepal\'s high-altitude farms with a clean, tea-like clarity.',
        'origin': 'Solukhumbu, Nepal',
        'roast_level': 'Light-Medium',
        'process': 'Washed',
        'flavor_notes': 'Green Apple, Elderflower, Honey',
        'is_featured': False, 'is_best_seller': False, 'is_new': True, 'sort_order': 4,
        'variants': [
            {'name': '250g', 'sku': 'MMG-GR-250', 'price': 899, 'compare_at_price': None, 'stock': 30},
            {'name': '500g', 'sku': 'MMG-GR-500', 'price': 1699, 'compare_at_price': None, 'stock': 15},
        ]
    },
    # Espresso
    {
        'category_slug': 'espresso',
        'name': 'Bean Theory Espresso Roast',
        'slug': 'bean-theory-espresso-roast',
        'short_description': 'Crafted for the perfect shot — rich crema guaranteed',
        'description': 'Our espresso roast is a mediumdark blend engineered for espresso machines and moka pots. Expect a thick, caramel-sweet crema and a lingering finish of dark cocoa.',
        'origin': 'Nepal Blend',
        'roast_level': 'Medium-Dark',
        'process': 'Natural',
        'flavor_notes': 'Dark Caramel, Cocoa, Dried Fruit',
        'is_featured': True, 'is_best_seller': False, 'is_new': False, 'sort_order': 5,
        'variants': [
            {'name': '250g', 'sku': 'KER-ES-250', 'price': 849, 'compare_at_price': None, 'stock': 45},
            {'name': '500g', 'sku': 'KER-ES-500', 'price': 1599, 'compare_at_price': None, 'stock': 28},
            {'name': '1kg', 'sku': 'KER-ES-1KG', 'price': 2899, 'compare_at_price': None, 'stock': 12},
        ]
    },
    {
        'category_slug': 'espresso',
        'name': 'Double Shot Dark Espresso',
        'slug': 'double-shot-dark-espresso',
        'short_description': 'Intensely bold — for those who drink their coffee seriously',
        'description': 'The darkest roast in our lineup. An unapologetically bold espresso blend that cuts through milk beautifully—ideal for cappuccinos and flat whites.',
        'origin': 'Kavre, Nepal',
        'roast_level': 'Dark',
        'process': 'Natural',
        'flavor_notes': 'Bittersweet Chocolate, Tobacco, Brown Sugar',
        'is_featured': False, 'is_best_seller': True, 'is_new': False, 'sort_order': 6,
        'variants': [
            {'name': '250g', 'sku': 'DSD-ES-250', 'price': 799, 'compare_at_price': None, 'stock': 35},
            {'name': '500g', 'sku': 'DSD-ES-500', 'price': 1499, 'compare_at_price': 1699, 'stock': 20},
        ]
    },
    # Filter Coffee
    {
        'category_slug': 'filter-coffee',
        'name': 'Ilam Light Roast Filter',
        'slug': 'ilam-light-roast-filter',
        'short_description': 'Delicate and complex — pour-over perfection',
        'description': 'Ground specifically for drip and pour-over brewing, this light roast preserves the delicate florals and fruit-forward character of Ilam Arabica.',
        'origin': 'Ilam, Nepal',
        'roast_level': 'Light',
        'process': 'Washed',
        'flavor_notes': 'Rose, Lychee, Tropical Fruit',
        'is_featured': False, 'is_best_seller': False, 'is_new': True, 'sort_order': 7,
        'variants': [
            {'name': '200g', 'sku': 'ILF-FC-200', 'price': 750, 'compare_at_price': None, 'stock': 25},
            {'name': '400g', 'sku': 'ILF-FC-400', 'price': 1400, 'compare_at_price': None, 'stock': 15},
        ]
    },
    # Single Origin
    {
        'category_slug': 'single-origin',
        'name': 'Solukhumbu Honey Process',
        'slug': 'solukhumbu-honey-process',
        'short_description': 'Himalayan altitude honey-processed single origin',
        'description': 'Sourced from a single cooperative at 2,100m in Solukhumbu. Honey-processed for a syrupy body with notes of tropical fruit and floral sweetness.',
        'origin': 'Solukhumbu, Nepal',
        'roast_level': 'Medium',
        'process': 'Honey',
        'flavor_notes': 'Mango, Papaya, Hibiscus',
        'is_featured': True, 'is_best_seller': False, 'is_new': True, 'sort_order': 8,
        'variants': [
            {'name': '200g', 'sku': 'SKH-SO-200', 'price': 1199, 'compare_at_price': None, 'stock': 20},
            {'name': '400g', 'sku': 'SKH-SO-400', 'price': 2199, 'compare_at_price': None, 'stock': 10},
        ]
    },
    {
        'category_slug': 'single-origin',
        'name': 'Kavre Natural Process',
        'slug': 'kavre-natural-process',
        'short_description': 'Sun-dried Kavre Arabica with jammy berry complexity',
        'description': 'Dried on raised beds under Kavre\'s clear mountain sun, this natural-process coffee develops an intense berry sweetness with a thick, syrupy mouthfeel.',
        'origin': 'Kavre, Bagmati Province',
        'roast_level': 'Medium',
        'process': 'Natural',
        'flavor_notes': 'Blueberry, Cherry, Milk Chocolate',
        'is_featured': False, 'is_best_seller': True, 'is_new': False, 'sort_order': 9,
        'variants': [
            {'name': '200g', 'sku': 'KVN-SO-200', 'price': 1099, 'compare_at_price': None, 'stock': 18},
            {'name': '400g', 'sku': 'KVN-SO-400', 'price': 1999, 'compare_at_price': None, 'stock': 8},
        ]
    },
    # Accessories
    {
        'category_slug': 'accessories',
        'name': 'Pour-Over Dripper Kit',
        'slug': 'pour-over-dripper-kit',
        'short_description': 'V60-style dripper with 40 filters and measuring spoon',
        'description': 'A complete pour-over setup for the home brewer. Includes a ceramic dripper, 40 paper filters, and a precision measuring spoon. Compatible with any server or mug.',
        'origin': 'Nepal / Japan',
        'roast_level': None, 'process': None,
        'flavor_notes': None,
        'is_featured': False, 'is_best_seller': False, 'is_new': False, 'sort_order': 10,
        'variants': [
            {'name': 'Standard', 'sku': 'POK-ACC-STD', 'price': 1499, 'compare_at_price': 1799, 'stock': 15},
        ]
    },
    {
        'category_slug': 'accessories',
        'name': 'Bean Theory Ceramic Mug',
        'slug': 'bean-theory-ceramic-mug',
        'short_description': 'Handcrafted 340ml ceramic mug — made in Bhaktapur',
        'description': 'Locally handcrafted in Bhaktapur by artisan potters, each mug features a unique glaze finish. Food-safe, microwave and dishwasher friendly.',
        'origin': 'Bhaktapur, Nepal',
        'roast_level': None, 'process': None,
        'flavor_notes': None,
        'is_featured': False, 'is_best_seller': False, 'is_new': True, 'sort_order': 11,
        'variants': [
            {'name': 'Terracotta', 'sku': 'MUG-TC-STD', 'price': 599, 'compare_at_price': None, 'stock': 30},
            {'name': 'Matte Black', 'sku': 'MUG-MB-STD', 'price': 599, 'compare_at_price': None, 'stock': 25},
            {'name': 'Cream White', 'sku': 'MUG-CW-STD', 'price': 599, 'compare_at_price': None, 'stock': 20},
        ]
    },
    {
        'category_slug': 'accessories',
        'name': 'French Press 600ml',
        'slug': 'french-press-600ml',
        'short_description': 'Stainless and borosilicate glass French press',
        'description': 'A classic 600ml French press with stainless steel frame and borosilicate glass carafe. Brews 2-4 cups with a full-bodied, rich extraction.',
        'origin': None,
        'roast_level': None, 'process': None,
        'flavor_notes': None,
        'is_featured': False, 'is_best_seller': False, 'is_new': False, 'sort_order': 12,
        'variants': [
            {'name': '600ml', 'sku': 'FP-600-STD', 'price': 1299, 'compare_at_price': 1499, 'stock': 12},
        ]
    },
]


def seed():
    with app.app_context():
        print('Creating tables...')
        db.create_all()

        # Clear existing data
        print('Clearing existing data...')
        from app.models import OrderItem, Order, CartItem, Cart, WishlistItem
        from app.models import ProductImage, ProductVariant, Product, Category, User, Address
        OrderItem.query.delete()
        Order.query.delete()
        CartItem.query.delete()
        Cart.query.delete()
        WishlistItem.query.delete()
        ProductImage.query.delete()
        ProductVariant.query.delete()
        Product.query.delete()
        Category.query.delete()
        User.query.delete()
        db.session.commit()

        # Seed categories
        print('Seeding categories...')
        cat_map = {}
        for cat_data in CATEGORIES:
            cat = Category(**cat_data)
            db.session.add(cat)
            db.session.flush()
            cat_map[cat_data['slug']] = cat

        # Seed products
        print('Seeding products...')
        for prod_data in PRODUCTS:
            variants_data = prod_data.pop('variants')
            cat_slug = prod_data.pop('category_slug')

            product = Product(
                category_id=cat_map[cat_slug].id,
                **prod_data
            )
            db.session.add(product)
            db.session.flush()

            for i, v in enumerate(variants_data):
                variant = ProductVariant(
                    product_id=product.id,
                    name=v['name'],
                    sku=v['sku'],
                    price=v['price'],
                    compare_at_price=v.get('compare_at_price'),
                    stock_quantity=v['stock']
                )
                db.session.add(variant)

            # Add placeholder image reference
            img = ProductImage(
                product_id=product.id,
                url=f'/images/products/{product.slug}.jpg',
                alt_text=product.name,
                sort_order=0
            )
            db.session.add(img)

        # Seed admin and demo accounts (Development/Staging ONLY)
        env_name = app.config.get('ENV_NAME', 'development')
        is_production = env_name == 'production' or os.environ.get('FLASK_ENV') == 'production'

        if is_production:
            if os.environ.get('ALLOW_PRODUCTION_SEED', '').lower() != 'true':
                raise RuntimeError("CRITICAL ERROR: seed.py cannot run in production without ALLOW_PRODUCTION_SEED=true.")
            prod_admin_pass = os.environ.get('ADMIN_PASSWORD')
            if not prod_admin_pass or len(prod_admin_pass) < 16:
                raise RuntimeError("CRITICAL ERROR: In production, ADMIN_PASSWORD must be set and >= 16 characters.")
            prod_admin_email = os.environ.get('ADMIN_EMAIL', 'admin@beantheory.com.np')
            if not User.query.filter_by(email=prod_admin_email).first():
                admin = User(
                    email=prod_admin_email,
                    first_name='Bean Theory',
                    last_name='Admin',
                    is_admin=True
                )
                admin.set_password(prod_admin_pass)
                db.session.add(admin)
                print(f"[PROD] Initialized production administrator: {prod_admin_email}")
            print("[PROD] Production catalog seeded. Demo accounts skipped.")
        else:
            # Development Mode
            print('Seeding development test accounts...')
            if not User.query.filter_by(email='admin@beantheory.com.np').first():
                admin = User(
                    email='admin@beantheory.com.np',
                    first_name='Bean Theory',
                    last_name='Admin',
                    is_admin=True
                )
                admin.set_password('admin1234')
                db.session.add(admin)

            if not User.query.filter_by(email='demo@beantheory.com.np').first():
                demo = User(
                    email='demo@beantheory.com.np',
                    first_name='Demo',
                    last_name='User',
                    is_admin=False
                )
                demo.set_password('demo1234')
                db.session.add(demo)

            print('[DEV WARNING] Seeded development accounts with known passwords for local testing.')
            print('  Admin: admin@beantheory.com.np / admin1234')
            print('  Demo:  demo@beantheory.com.np / demo1234')


if __name__ == '__main__':
    seed()
