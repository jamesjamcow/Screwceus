"""add team overview content

Revision ID: 0008_team_overview_content
Revises: 0007_project_issues
Create Date: 2026-06-23
"""

from alembic import op
import sqlalchemy as sa


revision = "0008_team_overview_content"
down_revision = "0007_project_issues"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "team",
        sa.Column("description", sa.String(length=2000), nullable=False, server_default=""),
    )
    op.create_table(
        "team_resource",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("team_id", sa.Integer(), nullable=False),
        sa.Column("created_by", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=1000), nullable=False),
        sa.Column("url", sa.String(length=2048), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["user.clerk_id"]),
        sa.ForeignKeyConstraint(["team_id"], ["team.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_team_resource_created_by"), "team_resource", ["created_by"])
    op.create_index(op.f("ix_team_resource_team_id"), "team_resource", ["team_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_team_resource_team_id"), table_name="team_resource")
    op.drop_index(op.f("ix_team_resource_created_by"), table_name="team_resource")
    op.drop_table("team_resource")
    op.drop_column("team", "description")
