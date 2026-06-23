"""add organization workspaces and teams

Revision ID: 0005_org_workspaces_teams
Revises: 0004_part_image_annotations
Create Date: 2026-06-23
"""

from alembic import op
import sqlalchemy as sa


revision = "0005_org_workspaces_teams"
down_revision = "0004_part_image_annotations"
branch_labels = None
depends_on = None


TENANT_TABLES = (
    "photo",
    "folder",
    "part",
    "custom_part_type",
    "project_file",
    "project_screenshot",
    "project_part",
)


def upgrade() -> None:
    op.create_table(
        "organization",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("clerk_id", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("image_url", sa.String(length=1024), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("clerk_id"),
    )
    op.create_index(op.f("ix_organization_clerk_id"), "organization", ["clerk_id"])

    # Existing personal data is retained in one isolated legacy workspace per user.
    # It can be reassigned explicitly after the desired Clerk Organization is known.
    op.execute(
        sa.text(
            """
            INSERT INTO organization (clerk_id, name, slug, image_url, created_at, updated_at)
            SELECT 'legacy:' || clerk_id,
                   CASE WHEN display_name <> '' THEN display_name ELSE clerk_id END,
                   '', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            FROM "user"
            """
        )
    )

    for table_name in TENANT_TABLES:
        op.add_column(
            table_name,
            sa.Column("organization_id", sa.String(length=255), nullable=True),
        )
        op.execute(
            sa.text(
                f"UPDATE {table_name} SET organization_id = 'legacy:' || owner_id "
                "WHERE organization_id IS NULL"
            )
        )
        with op.batch_alter_table(table_name) as batch_op:
            batch_op.alter_column(
                "organization_id",
                existing_type=sa.String(length=255),
                nullable=False,
            )
            batch_op.create_foreign_key(
                f"fk_{table_name}_organization_id",
                "organization",
                ["organization_id"],
                ["clerk_id"],
            )
            batch_op.create_index(
                op.f(f"ix_{table_name}_organization_id"),
                ["organization_id"],
            )

    with op.batch_alter_table("custom_part_type") as batch_op:
        batch_op.drop_constraint("uq_owner_value", type_="unique")
        batch_op.create_unique_constraint(
            "uq_organization_part_type_value",
            ["organization_id", "value"],
        )

    op.create_table(
        "team",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("key", sa.String(length=12), nullable=False),
        sa.Column("color", sa.String(length=20), nullable=False, server_default="#5E6AD2"),
        sa.Column("created_by", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["user.clerk_id"]),
        sa.ForeignKeyConstraint(["organization_id"], ["organization.clerk_id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("organization_id", "key", name="uq_team_organization_key"),
    )
    op.create_index(op.f("ix_team_created_by"), "team", ["created_by"])
    op.create_index(op.f("ix_team_organization_id"), "team", ["organization_id"])

    op.create_table(
        "team_membership",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("team_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False, server_default="member"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["team_id"], ["team.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["user.clerk_id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("team_id", "user_id", name="uq_team_membership_team_user"),
    )
    op.create_index(op.f("ix_team_membership_team_id"), "team_membership", ["team_id"])
    op.create_index(op.f("ix_team_membership_user_id"), "team_membership", ["user_id"])


def downgrade() -> None:
    op.drop_table("team_membership")
    op.drop_table("team")

    with op.batch_alter_table("custom_part_type") as batch_op:
        batch_op.drop_constraint("uq_organization_part_type_value", type_="unique")
        batch_op.create_unique_constraint("uq_owner_value", ["owner_id", "value"])

    for table_name in reversed(TENANT_TABLES):
        with op.batch_alter_table(table_name) as batch_op:
            batch_op.drop_index(op.f(f"ix_{table_name}_organization_id"))
            batch_op.drop_constraint(f"fk_{table_name}_organization_id", type_="foreignkey")
            batch_op.drop_column("organization_id")

    op.drop_index(op.f("ix_organization_clerk_id"), table_name="organization")
    op.drop_table("organization")
