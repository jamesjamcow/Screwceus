"""add team issues

Revision ID: 0010_team_issues
Revises: 0009_team_storage_scoping
Create Date: 2026-06-24
"""

from alembic import op
import sqlalchemy as sa


revision = "0010_team_issues"
down_revision = "0009_team_storage_scoping"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "team_issue",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("team_id", sa.Integer(), nullable=False),
        sa.Column("owner_id", sa.String(length=255), nullable=False),
        sa.Column("organization_id", sa.String(length=255), nullable=False),
        sa.Column("issue", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=2000), nullable=False),
        sa.Column("author", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="not-started"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organization.clerk_id"]),
        sa.ForeignKeyConstraint(["owner_id"], ["user.clerk_id"]),
        sa.ForeignKeyConstraint(["team_id"], ["team.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_team_issue_team_id"), "team_issue", ["team_id"])
    op.create_index(op.f("ix_team_issue_owner_id"), "team_issue", ["owner_id"])
    op.create_index(op.f("ix_team_issue_organization_id"), "team_issue", ["organization_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_team_issue_organization_id"), table_name="team_issue")
    op.drop_index(op.f("ix_team_issue_owner_id"), table_name="team_issue")
    op.drop_index(op.f("ix_team_issue_team_id"), table_name="team_issue")
    op.drop_table("team_issue")
