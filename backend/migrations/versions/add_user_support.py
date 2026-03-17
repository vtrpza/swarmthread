"""add user table and user_id to runs

Revision ID: add_user_support
Revises: cc445e7c1519
Create Date: 2026-03-17

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "add_user_support"
down_revision: str | None = "cc445e7c1519"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.add_column("runs", sa.Column("user_id", sa.Uuid(), nullable=True))
    op.add_column("runs", sa.Column("encrypted_api_key", sa.Text(), nullable=True))
    op.create_index(op.f("ix_runs_user_id"), "runs", ["user_id"], unique=False)
    op.create_foreign_key("fk_runs_user_id", "runs", "users", ["user_id"], ["id"])


def downgrade() -> None:
    op.drop_constraint("fk_runs_user_id", "runs", type_="foreignkey")
    op.drop_index(op.f("ix_runs_user_id"), table_name="runs")
    op.drop_column("runs", "encrypted_api_key")
    op.drop_column("runs", "user_id")
    op.drop_table("users")
