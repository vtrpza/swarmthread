"""drop controversy_level from run_seeds

Revision ID: cc445e7c1519
Revises: 9f1382a9c502
Create Date: 2026-03-17 11:03:33.268444

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'cc445e7c1519'
down_revision: Union[str, None] = '9f1382a9c502'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('run_seeds', 'controversy_level')


def downgrade() -> None:
    op.add_column(
        'run_seeds',
        sa.Column('controversy_level', sa.VARCHAR(), nullable=False, server_default='low'),
    )
