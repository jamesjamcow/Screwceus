"""add project part quantity

Revision ID: 0003_project_part_quantity
Revises: 0002_project_model_link
Create Date: 2026-05-11
"""

from alembic import op
import sqlalchemy as sa


revision = "0003_project_part_quantity"
down_revision = "0002_project_model_link"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "project_part",
        sa.Column("quantity_needed", sa.Integer(), nullable=False, server_default="1"),
    )


def downgrade() -> None:
    op.drop_column("project_part", "quantity_needed")
