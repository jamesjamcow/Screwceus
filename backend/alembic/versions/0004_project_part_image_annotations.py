"""add project part image annotations

Revision ID: 0004_part_image_annotations
Revises: 0003_project_part_quantity
Create Date: 2026-05-11
"""

from alembic import op
import sqlalchemy as sa


revision = "0004_part_image_annotations"
down_revision = "0003_project_part_quantity"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "project_part",
        sa.Column("source_image_url", sa.String(length=1024), nullable=False, server_default=""),
    )
    op.add_column(
        "project_part",
        sa.Column("annotation_json", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("project_part", "annotation_json")
    op.drop_column("project_part", "source_image_url")
