# AGENTS.md

Coding agent instructions for the SwarmThread backend.

## Project Overview

SwarmThread is a batch simulation system for predictive analysis of marketing content impact. The backend is a FastAPI application with SQLModel ORM, Alembic migrations, Neon Postgres, and OpenRouter LLM integration. A background worker polls for queued runs and executes 20-agent / 150-round social simulations.

## Build/Lint/Test Commands

```bash
uv sync                    # Install dependencies
uv sync --frozen           # Install from lockfile (CI/deploy)

uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload  # Run API server
uv run python -m app.worker.main    # Background worker

uv run alembic revision --autogenerate -m "description"  # Create migration
uv run alembic upgrade head  # Apply migrations
uv run alembic downgrade -1   # Rollback one migration

uv run ruff check .    # Lint
uv run ruff check . --fix  # Auto-fix lint errors
uv run ruff format .   # Format
uv run mypy app        # Type check

uv run pytest          # Run all tests
uv run pytest tests/test_api -v  # Run specific directory
uv run pytest tests/test_api/test_runs.py -v  # Run single file
uv run pytest tests/test_api/test_runs.py::test_create_run -v  # Run single test
uv run pytest -k "create_run" -v  # Run tests matching pattern
uv run pytest --cov=app --cov-report=term-missing  # With coverage
uv run pre-commit run --all-files  # Run all pre-commit hooks
```

## Code Style Guidelines

### Imports

Standard library first, then third-party, then local imports. Use absolute imports from `app`.

```python
import enum
from datetime import datetime
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Field, Session, SQLModel
from sqlalchemy import Column, JSON

from app.config import settings
from app.db import SessionDep
from app.models import Run, RunStatus
```

### Formatting

- Use Ruff for formatting (Black-compatible).
- Line length: 88 characters.
- Use double quotes for strings.
- Trailing commas in multi-line collections.

### Types

- Use Python type hints on all function signatures.
- Use `T | None` for optional values (not `Optional[T]`).
- Use `list[T]`, `dict[str, T]` instead of `List[T]`, `Dict[str, T]`.
- SQLModel models inherit from `SQLModel, table=True`.
- Pydantic schemas inherit from `BaseModel`.

### Naming conventions

- Modules: `snake_case.py`
- Classes: `PascalCase`
- Functions/methods: `snake_case`
- Constants: `UPPER_SNAKE_CASE`
- Private methods: `_leading_underscore`
- Database tables: `snake_case` (pluralized: `runs`, `agents`, `posts`)

### Enums

Use `enum.StrEnum` for enumeration types:

```python
import enum

class RunStatus(enum.StrEnum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"
```

### Error handling

- Raise `HTTPException(status_code=..., detail=...)` in API routes.
- Log errors with structlog using `logger.error("message", key=value)`.
- Never expose internal errors or stack traces to clients.
- Validate all LLM responses against JSON schema before database writes.

### FastAPI patterns

```python
from fastapi import APIRouter
from app.db import SessionDep
from app.schemas.run import RunCreate, RunRead

router = APIRouter(prefix="/runs", tags=["runs"])

@router.post("/", response_model=RunRead, status_code=201)
def create_run(run_create: RunCreate, session: SessionDep) -> Run:
    ...

# SessionDep is defined in app/db.py as:
# SessionDep = Annotated[Session, Depends(get_session)]
```

### SQLModel patterns

```python
from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import Column, JSON
from sqlmodel import Field, SQLModel

class Run(SQLModel, table=True):
    __tablename__ = "runs"  # Explicit table name

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    status: RunStatus = Field(default=RunStatus.queued)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    json_field: list[str] = Field(default_factory=list, sa_column=Column(JSON))
```

### Pydantic schemas

Separate schemas for creation, update, and read operations:

```python
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel

class RunBase(BaseModel):
    title: str
    brand: str

class RunCreate(RunBase):
    agent_count: int = 20
    round_count: int = 150

class RunRead(BaseModel):
    id: UUID
    status: RunStatus
    created_at: datetime
    completed_at: datetime | None = None
```

### Structured logging

```python
from app.logging import get_logger
logger = get_logger(__name__)
logger.info("run_started", run_id=str(run.id), agent_count=run.agent_count)
```

### Configuration

```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )
    database_url: str
    openrouter_api_key: str
    langfuse_public_key: str | None = None

settings = Settings()
```

## Project Structure

- `app/api/`: FastAPI route handlers
- `app/models/`: SQLModel database models
- `app/schemas/`: Pydantic request/response schemas
- `app/services/`: Business logic (simulation runner, OpenRouter client, etc.)
- `app/worker/`: Background worker entry point
- `app/prompts/`: Prompt templates for LLM calls
- `tests/`: Mirror app structure (`tests/test_api/`, `tests/test_services/`)

## Testing

- Use `pytest` with `pytest-asyncio` (asyncio_mode = "auto").
- Use `TestClient` from `fastapi.testclient` for API tests.
- Use in-memory SQLite: `create_engine("sqlite:///:memory:")`.
- Mock external services (OpenRouter, Neon) in unit tests.
- Use fixtures in `tests/conftest.py` for shared test setup.

## Security

- Store secrets in environment variables only.
- Never commit `.env` files.
- Validate and sanitize all user inputs.
- Never expose `OPENROUTER_API_KEY` to frontend.
- All database writes go through API or worker only.