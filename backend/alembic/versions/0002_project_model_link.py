"""add project model link

Revision ID: 0002_project_model_link
Revises: 0001_initial
Create Date: 2026-05-11
"""

from alembic import op
import sqlalchemy as sa


revision = "0002_project_model_link"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "project_file",
        sa.Column("model_url", sa.String(length=1024), nullable=False, server_default=""),
    )
    op.add_column(
        "project_file",
        sa.Column("model_filename", sa.String(length=255), nullable=False, server_default=""),
    )
    op.add_column(
        "project_file",
        sa.Column("model_file_key", sa.String(length=255), nullable=False, server_default=""),
    )


def downgrade() -> None:
    op.drop_column("project_file", "model_file_key")
    op.drop_column("project_file", "model_filename")
    op.drop_column("project_file", "model_url")
