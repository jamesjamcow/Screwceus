"""scope project storage to teams

Revision ID: 0009_team_storage_scoping
Revises: 0008_team_overview_content
Create Date: 2026-06-24
"""

from alembic import op
import sqlalchemy as sa


revision = "0009_team_storage_scoping"
down_revision = "0008_team_overview_content"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("folder", sa.Column("team_id", sa.Integer(), nullable=True))
    op.add_column("project_file", sa.Column("team_id", sa.Integer(), nullable=True))
    op.add_column("photo", sa.Column("team_id", sa.Integer(), nullable=True))

    # Retain existing workspace files by placing them in the organization's
    # General team. Organizations without files remain lazily initialized.
    op.execute(
        sa.text(
            """
            INSERT INTO team (
                organization_id, name, key, color, description,
                created_by, created_at, updated_at
            )
            SELECT workspace.organization_id,
                   'General', 'GENERAL', '#5E6AD2', '',
                   MIN(workspace.owner_id), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            FROM (
                SELECT organization_id, owner_id FROM folder
                UNION ALL
                SELECT organization_id, owner_id FROM project_file
                UNION ALL
                SELECT organization_id, owner_id FROM photo
            ) AS workspace
            LEFT JOIN team existing
              ON existing.organization_id = workspace.organization_id
             AND existing.key = 'GENERAL'
            WHERE existing.id IS NULL
            GROUP BY workspace.organization_id
            """
        )
    )

    op.execute(
        sa.text(
            """
            INSERT INTO team_membership (team_id, user_id, role, created_at)
            SELECT general.id, workspace.owner_id,
                   CASE WHEN general.created_by = workspace.owner_id THEN 'admin' ELSE 'member' END,
                   CURRENT_TIMESTAMP
            FROM (
                SELECT organization_id, owner_id FROM folder
                UNION
                SELECT organization_id, owner_id FROM project_file
                UNION
                SELECT organization_id, owner_id FROM photo
            ) AS workspace
            JOIN team general
              ON general.organization_id = workspace.organization_id
             AND general.key = 'GENERAL'
            LEFT JOIN team_membership membership
              ON membership.team_id = general.id
             AND membership.user_id = workspace.owner_id
            WHERE membership.id IS NULL
            """
        )
    )

    op.execute(
        sa.text(
            """
            UPDATE folder
            SET team_id = (
                SELECT team.id FROM team
                WHERE team.organization_id = folder.organization_id
                  AND team.key = 'GENERAL'
            )
            WHERE team_id IS NULL
            """
        )
    )
    op.execute(
        sa.text(
            """
            UPDATE project_file
            SET team_id = (
                SELECT team.id FROM team
                WHERE team.organization_id = project_file.organization_id
                  AND team.key = 'GENERAL'
            )
            WHERE team_id IS NULL
            """
        )
    )

    op.execute(
        sa.text(
            """
            UPDATE photo
            SET team_id = (
                SELECT team.id FROM team
                WHERE team.organization_id = photo.organization_id
                  AND team.key = 'GENERAL'
            )
            WHERE team_id IS NULL
            """
        )
    )

    for table_name in ("folder", "project_file", "photo"):
        with op.batch_alter_table(table_name) as batch_op:
            batch_op.alter_column("team_id", existing_type=sa.Integer(), nullable=False)
            batch_op.create_foreign_key(
                f"fk_{table_name}_team_id",
                "team",
                ["team_id"],
                ["id"],
            )
            batch_op.create_index(op.f(f"ix_{table_name}_team_id"), ["team_id"])


def downgrade() -> None:
    for table_name in ("photo", "project_file", "folder"):
        with op.batch_alter_table(table_name) as batch_op:
            batch_op.drop_index(op.f(f"ix_{table_name}_team_id"))
            batch_op.drop_constraint(f"fk_{table_name}_team_id", type_="foreignkey")
            batch_op.drop_column("team_id")
