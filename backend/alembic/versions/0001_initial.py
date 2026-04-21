"""initial

Revision ID: 0001_initial
Revises:
Create Date: 2026-04-20
"""

from alembic import op
import sqlalchemy as sa


revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "photo",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("owner_id", sa.String(length=255), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("image_key", sa.String(length=512), nullable=False),
        sa.Column("annotation_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_photo_owner_id"), "photo", ["owner_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_photo_owner_id"), table_name="photo")
    op.drop_table("photo")
