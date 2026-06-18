"""initial

Revision ID: 0001_initial
Revises:
Create Date: 2026-05-07
"""

from alembic import op
import sqlalchemy as sa


revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # -- user --
    op.create_table(
        "user",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("clerk_id", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False, server_default=""),
        sa.Column("display_name", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("avatar_url", sa.String(length=1024), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("clerk_id"),
    )
    op.create_index(op.f("ix_user_clerk_id"), "user", ["clerk_id"])

    # -- photo --
    op.create_table(
        "photo",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("owner_id", sa.String(length=255), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("image_url", sa.String(length=1024), nullable=False),
        sa.Column("annotation_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["user.clerk_id"], name="fk_photo_owner_id_user"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_photo_owner_id"), "photo", ["owner_id"])

    # -- folder --
    op.create_table(
        "folder",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("owner_id", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("parent_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["user.clerk_id"], name="fk_folder_owner_id_user"),
        sa.ForeignKeyConstraint(["parent_id"], ["folder.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_folder_owner_id"), "folder", ["owner_id"])
    op.create_index(op.f("ix_folder_parent_id"), "folder", ["parent_id"])

    # -- part --
    op.create_table(
        "part",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("owner_id", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("type", sa.String(length=100), nullable=False),
        sa.Column("dimensions", sa.JSON(), nullable=False),
        sa.Column("notes", sa.String(length=2000), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["user.clerk_id"], name="fk_part_owner_id_user"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_part_owner_id"), "part", ["owner_id"])

    # -- custom_part_type --
    op.create_table(
        "custom_part_type",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("owner_id", sa.String(length=255), nullable=False),
        sa.Column("value", sa.String(length=100), nullable=False),
        sa.Column("label", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["user.clerk_id"], name="fk_custom_part_type_owner_id_user"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("owner_id", "value", name="uq_owner_value"),
    )
    op.create_index(op.f("ix_custom_part_type_owner_id"), "custom_part_type", ["owner_id"])

    # -- project_file --
    op.create_table(
        "project_file",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("owner_id", sa.String(length=255), nullable=False),
        sa.Column("folder_id", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=2000), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["user.clerk_id"], name="fk_project_file_owner_id_user"),
        sa.ForeignKeyConstraint(["folder_id"], ["folder.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_project_file_owner_id"), "project_file", ["owner_id"])
    op.create_index(op.f("ix_project_file_folder_id"), "project_file", ["folder_id"])

    # -- project_screenshot --
    op.create_table(
        "project_screenshot",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("project_file_id", sa.Integer(), nullable=False),
        sa.Column("photo_id", sa.Integer(), nullable=False),
        sa.Column("owner_id", sa.String(length=255), nullable=False),
        sa.Column("caption", sa.String(length=500), nullable=False, server_default=""),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["user.clerk_id"], name="fk_project_screenshot_owner_id_user"),
        sa.ForeignKeyConstraint(["project_file_id"], ["project_file.id"]),
        sa.ForeignKeyConstraint(["photo_id"], ["photo.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_project_screenshot_project_file_id"), "project_screenshot", ["project_file_id"])
    op.create_index(op.f("ix_project_screenshot_photo_id"), "project_screenshot", ["photo_id"])
    op.create_index(op.f("ix_project_screenshot_owner_id"), "project_screenshot", ["owner_id"])

    # -- project_part --
    op.create_table(
        "project_part",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("project_file_id", sa.Integer(), nullable=False),
        sa.Column("part_id", sa.Integer(), nullable=False),
        sa.Column("owner_id", sa.String(length=255), nullable=False),
        sa.Column("quantity_needed", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("point", sa.JSON(), nullable=True),
        sa.Column("notes", sa.String(length=2000), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["user.clerk_id"], name="fk_project_part_owner_id_user"),
        sa.ForeignKeyConstraint(["project_file_id"], ["project_file.id"]),
        sa.ForeignKeyConstraint(["part_id"], ["part.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("project_file_id", "part_id", name="uq_project_part"),
    )
    op.create_index(op.f("ix_project_part_project_file_id"), "project_part", ["project_file_id"])
    op.create_index(op.f("ix_project_part_part_id"), "project_part", ["part_id"])
    op.create_index(op.f("ix_project_part_owner_id"), "project_part", ["owner_id"])


def downgrade() -> None:
    op.drop_table("project_part")
    op.drop_table("project_screenshot")
    op.drop_table("project_file")
    op.drop_table("custom_part_type")
    op.drop_table("part")
    op.drop_table("folder")
    op.drop_table("photo")
    op.drop_table("user")
