"""add project details and cover

Revision ID: 0006_project_details_cover
Revises: 0005_org_workspaces_teams
Create Date: 2026-06-23
"""

from alembic import op
import sqlalchemy as sa


revision = "0006_project_details_cover"
down_revision = "0005_org_workspaces_teams"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "project_file",
        sa.Column("status", sa.String(length=50), nullable=False, server_default="planned"),
    )
    op.add_column("project_file", sa.Column("due_date", sa.Date(), nullable=True))
    op.add_column(
        "project_file",
        sa.Column("cover_image_url", sa.String(length=1024), nullable=False, server_default=""),
    )
    op.add_column(
        "project_file",
        sa.Column("cover_image_filename", sa.String(length=255), nullable=False, server_default=""),
    )
    op.add_column(
        "project_file",
        sa.Column("cover_image_file_key", sa.String(length=255), nullable=False, server_default=""),
    )


def downgrade() -> None:
    op.drop_column("project_file", "cover_image_file_key")
    op.drop_column("project_file", "cover_image_filename")
    op.drop_column("project_file", "cover_image_url")
    op.drop_column("project_file", "due_date")
    op.drop_column("project_file", "status")
