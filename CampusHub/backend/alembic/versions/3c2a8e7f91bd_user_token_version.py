"""Add per-user JWT revocation version."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "3c2a8e7f91bd"
down_revision: Union[str, None] = "8fa2f4d1c92b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("token_version", sa.Integer(), server_default="0", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("users", "token_version")
