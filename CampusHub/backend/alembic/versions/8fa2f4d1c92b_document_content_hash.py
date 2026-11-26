"""Add content hashes for duplicate document detection."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "8fa2f4d1c92b"
down_revision: Union[str, None] = "9bec87cbb1a4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("uploaded_documents", sa.Column("content_sha256", sa.String(length=64), nullable=True))
    op.create_index(
        "uq_uploaded_documents_content_sha256",
        "uploaded_documents",
        ["content_sha256"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("uq_uploaded_documents_content_sha256", table_name="uploaded_documents")
    op.drop_column("uploaded_documents", "content_sha256")
