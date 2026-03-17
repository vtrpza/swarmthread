import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlmodel import SQLModel

sys.path.insert(0, str(Path(__file__).resolve().parents[1].parent))

from app.models import (
    Agent,
    AnalysisReport,
    Follow,
    Interaction,
    LLMCall,
    Post,
    Run,
    RunSeed,
)

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = SQLModel.metadata


def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    from app.config import settings

    connectable = config.attributes.get("connection", None)

    if connectable is None:
        from sqlalchemy import engine_from_config, pool

        connectable = engine_from_config(
            {"sqlalchemy.url": settings.effective_database_url},
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
        )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
