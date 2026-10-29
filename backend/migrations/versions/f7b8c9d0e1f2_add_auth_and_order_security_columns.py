"""add password_changed_at to users, guest_token_hash and idempotency_payload_hash to orders

Revision ID: f7b8c9d0e1f2
Revises: cd371fc311fa
Create Date: 2026-10-27 12:45:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f7b8c9d0e1f2'
down_revision = 'cd371fc311fa'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('password_changed_at', sa.DateTime(), nullable=True))

    with op.batch_alter_table('orders', schema=None) as batch_op:
        batch_op.add_column(sa.Column('guest_token_hash', sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column('idempotency_payload_hash', sa.String(length=64), nullable=True))
        batch_op.create_index(batch_op.f('ix_orders_guest_token_hash'), ['guest_token_hash'], unique=False)


def downgrade():
    with op.batch_alter_table('orders', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_orders_guest_token_hash'))
        batch_op.drop_column('idempotency_payload_hash')
        batch_op.drop_column('guest_token_hash')

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('password_changed_at')
