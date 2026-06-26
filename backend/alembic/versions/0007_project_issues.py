"""add project issues

Revision ID: 0007_project_issues
Revises: 0006_project_details_cover
Create Date: 2026-06-23
"""

from alembic import op
import sqlalchemy as sa


revision = "0007_project_issues"
down_revision = "0006_project_details_cover"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "project_issue",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("project_file_id", sa.Integer(), nullable=False),
        sa.Column("owner_id", sa.String(length=255), nullable=False),
        sa.Column("organization_id", sa.String(length=255), nullable=False),
        sa.Column("issue", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=2000), nullable=False, server_default=""),
        sa.Column("author", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="not-started"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organization.clerk_id"]),
        sa.ForeignKeyConstraint(["project_file_id"], ["project_file.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_project_issue_project_file_id"), "project_issue", ["project_file_id"])
    op.create_index(op.f("ix_project_issue_owner_id"), "project_issue", ["owner_id"])
    op.create_index(op.f("ix_project_issue_organization_id"), "project_issue", ["organization_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_project_issue_organization_id"), table_name="project_issue")
    op.drop_index(op.f("ix_project_issue_owner_id"), table_name="project_issue")
    op.drop_index(op.f("ix_project_issue_project_file_id"), table_name="project_issue")
    op.drop_table("project_issue")
