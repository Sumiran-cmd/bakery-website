"""create initial base tables

Revision ID: 0001_initial_base_tables
Revises: 
Create Date: 2026-10-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0001_initial_base_tables'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    insp = sa.inspect(bind)

    if not insp.has_table('users'):
        op.create_table('users',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('email', sa.String(length=255), nullable=False),
            sa.Column('password_hash', sa.String(length=255), nullable=False),
            sa.Column('first_name', sa.String(length=100), nullable=False),
            sa.Column('last_name', sa.String(length=100), nullable=False),
            sa.Column('phone', sa.String(length=20), nullable=True),
            sa.Column('is_admin', sa.Boolean(), nullable=True, default=False),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('email')
        )
        op.create_index('ix_users_email', 'users', ['email'], unique=True)

    if not insp.has_table('categories'):
        op.create_table('categories',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=100), nullable=False),
            sa.Column('slug', sa.String(length=120), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('image_url', sa.String(length=500), nullable=True),
            sa.Column('sort_order', sa.Integer(), nullable=True, default=0),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('slug')
        )
        op.create_index('ix_categories_slug', 'categories', ['slug'], unique=True)

    if not insp.has_table('products'):
        op.create_table('products',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('category_id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('slug', sa.String(length=300), nullable=False),
            sa.Column('short_description', sa.String(length=500), nullable=True),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('origin', sa.String(length=100), nullable=True),
            sa.Column('roast_level', sa.String(length=50), nullable=True),
            sa.Column('process', sa.String(length=100), nullable=True),
            sa.Column('flavor_notes', sa.String(length=255), nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
            sa.Column('is_featured', sa.Boolean(), nullable=True, default=False),
            sa.Column('is_new', sa.Boolean(), nullable=True, default=False),
            sa.Column('is_best_seller', sa.Boolean(), nullable=True, default=False),
            sa.Column('sort_order', sa.Integer(), nullable=True, default=0),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('slug')
        )
        op.create_index('ix_products_slug', 'products', ['slug'], unique=True)

    if not insp.has_table('product_variants'):
        op.create_table('product_variants',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('product_id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=100), nullable=False),
            sa.Column('sku', sa.String(length=100), nullable=True),
            sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=False),
            sa.Column('compare_at_price', sa.Numeric(precision=10, scale=2), nullable=True),
            sa.Column('stock_quantity', sa.Integer(), nullable=True, default=0),
            sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
            sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('sku')
        )

    if not insp.has_table('product_images'):
        op.create_table('product_images',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('product_id', sa.Integer(), nullable=False),
            sa.Column('url', sa.String(length=500), nullable=False),
            sa.Column('alt_text', sa.String(length=255), nullable=True),
            sa.Column('sort_order', sa.Integer(), nullable=True, default=0),
            sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
            sa.PrimaryKeyConstraint('id')
        )

    if not insp.has_table('addresses'):
        op.create_table('addresses',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('label', sa.String(length=50), nullable=True),
            sa.Column('full_name', sa.String(length=200), nullable=False),
            sa.Column('phone', sa.String(length=20), nullable=False),
            sa.Column('street', sa.String(length=255), nullable=False),
            sa.Column('city', sa.String(length=100), nullable=False),
            sa.Column('district', sa.String(length=100), nullable=False),
            sa.Column('province', sa.String(length=100), nullable=False),
            sa.Column('is_default', sa.Boolean(), nullable=True, default=False),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )

    if not insp.has_table('carts'):
        op.create_table('carts',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('session_id', sa.String(length=255), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )

    if not insp.has_table('cart_items'):
        op.create_table('cart_items',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('cart_id', sa.Integer(), nullable=False),
            sa.Column('product_id', sa.Integer(), nullable=False),
            sa.Column('variant_id', sa.Integer(), nullable=False),
            sa.Column('quantity', sa.Integer(), nullable=False),
            sa.Column('added_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['cart_id'], ['carts.id'], ),
            sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
            sa.ForeignKeyConstraint(['variant_id'], ['product_variants.id'], ),
            sa.PrimaryKeyConstraint('id')
        )

    if not insp.has_table('wishlist_items'):
        op.create_table('wishlist_items',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('product_id', sa.Integer(), nullable=False),
            sa.Column('added_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('user_id', 'product_id')
        )

    if not insp.has_table('orders'):
        op.create_table('orders',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('order_number', sa.String(length=50), nullable=False),
            sa.Column('status', sa.String(length=50), nullable=True),
            sa.Column('payment_status', sa.String(length=50), nullable=True),
            sa.Column('payment_method', sa.String(length=50), nullable=True),
            sa.Column('subtotal', sa.Numeric(precision=10, scale=2), nullable=False),
            sa.Column('shipping_cost', sa.Numeric(precision=10, scale=2), nullable=True),
            sa.Column('discount_amount', sa.Numeric(precision=10, scale=2), nullable=True),
            sa.Column('total', sa.Numeric(precision=10, scale=2), nullable=False),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('shipping_full_name', sa.String(length=200), nullable=True),
            sa.Column('shipping_phone', sa.String(length=20), nullable=True),
            sa.Column('shipping_street', sa.String(length=255), nullable=True),
            sa.Column('shipping_city', sa.String(length=100), nullable=True),
            sa.Column('shipping_district', sa.String(length=100), nullable=True),
            sa.Column('shipping_province', sa.String(length=100), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('order_number')
        )

    if not insp.has_table('order_items'):
        op.create_table('order_items',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('order_id', sa.Integer(), nullable=False),
            sa.Column('product_id', sa.Integer(), nullable=False),
            sa.Column('variant_id', sa.Integer(), nullable=False),
            sa.Column('product_name', sa.String(length=255), nullable=False),
            sa.Column('variant_name', sa.String(length=100), nullable=False),
            sa.Column('unit_price', sa.Numeric(precision=10, scale=2), nullable=False),
            sa.Column('quantity', sa.Integer(), nullable=False),
            sa.Column('line_total', sa.Numeric(precision=10, scale=2), nullable=False),
            sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
            sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
            sa.ForeignKeyConstraint(['variant_id'], ['product_variants.id'], ),
            sa.PrimaryKeyConstraint('id')
        )

    if not insp.has_table('token_blocklist'):
        op.create_table('token_blocklist',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('jti', sa.String(length=36), nullable=False),
            sa.Column('token_type', sa.String(length=10), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('expires_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('jti')
        )
        op.create_index('ix_token_blocklist_jti', 'token_blocklist', ['jti'], unique=True)

    if not insp.has_table('password_reset_tokens'):
        op.create_table('password_reset_tokens',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('token_hash', sa.String(length=64), nullable=False),
            sa.Column('expires_at', sa.DateTime(), nullable=False),
            sa.Column('used', sa.Boolean(), nullable=False, default=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('token_hash')
        )
        op.create_index('ix_password_reset_tokens_token_hash', 'password_reset_tokens', ['token_hash'], unique=True)
        op.create_index('ix_password_reset_tokens_user_id', 'password_reset_tokens', ['user_id'], unique=False)


def downgrade():
    bind = op.get_bind()
    insp = sa.inspect(bind)
    for table_name in [
        'password_reset_tokens', 'token_blocklist', 'order_items', 'orders',
        'wishlist_items', 'cart_items', 'carts', 'addresses',
        'product_images', 'product_variants', 'products', 'categories', 'users'
    ]:
        if insp.has_table(table_name):
            op.drop_table(table_name)
