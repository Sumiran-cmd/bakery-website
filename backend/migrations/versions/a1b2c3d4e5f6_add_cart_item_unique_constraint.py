"""add cart_item unique constraint on cart_id and variant_id

Revision ID: a1b2c3d4e5f6
Revises: f7b8c9d0e1f2
Create Date: 2026-10-29 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'f7b8c9d0e1f2'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('cart_items', schema=None) as batch_op:
        batch_op.create_unique_constraint('uq_cart_items_cart_variant', ['cart_id', 'variant_id'])


def downgrade():
    with op.batch_alter_table('cart_items', schema=None) as batch_op:
        batch_op.drop_constraint('uq_cart_items_cart_variant', type_='unique')
