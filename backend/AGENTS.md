# AGENTS.md

Coding agent instructions for the SwarmThread backend.

## Project Overview

SwarmThread is a batch simulation system for predictive analysis of marketing content impact. The backend is a FastAPI application with SQLModel ORM, Alembic migrations, Neon Postgres, and OpenRouter LLM integration. A background worker polls for queued runs and executes 20-agent / 150-round social simulations.

## Build/Lint/Test Commands

### Package management (uv)

```bash
uv sync                    # Install dependencies
uv sync --frozen           # Install from lockfile (CI/deploy)
uv add <package>           # Add dependency
uv add --dev <package>      # Add dev dependency
```

### Running the application

```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
uv run python -m app.worker.main    # Background worker
```

### Database migrations (Alembic)

```bash
uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head
uv run alembic downgrade -1
```

### Linting and formatting

```bash
uv run ruff check .                    # Lint
uv run ruff check . --fix              # Auto-fix
uv run ruff format .                    # Format
uv run mypy app                         # Type check
```

### Testing

```bash
uv run pytest                           # Run all tests
uv run pytest tests/test_api -v         # Run specific directory
uv run pytest tests/test_services/test_simulation.py -v  # Run single file
uv run pytest tests/test_api/test_runs.py::test_create_run -v  # Run single test
uv run pytest -k "create_run" -v        # Run tests matching pattern
uv run pytest --cov=app --cov-report=term-missing  # With coverage
```

### Pre-commit

```bash
uv run pre-commit run --all-files
```

## Code Style Guidelines

### Imports

Standard library first, then third-party, then local imports. Use absolute imports from `app`.

```python
import os
from typing import Optional

from fastapi import Depends, HTTPException
from sqlmodel import Session

from app.config import settings
from app.models.run import Run
```

### Formatting

- Use Ruff for formatting (Black-compatible).
- Line length: 88 characters.
- Use double quotes for strings.
- Trailing commas in multi-line collections.

### Types

- Use Python type hints on all function signatures.
- Use `Optional[T]` for optional values, not `T | None`.
- Use `list[T]`, `dict[str, T]` instead of `List[T]`, `Dict[str, T]`.
- SQLModel models inherit from `SQLModel, table=True`.
- Pydantic schemas for API requests/responses inherit from `BaseModel`.

### Naming conventions

- Modules: `snake_case.py`
- Classes: `PascalCase`
- Functions/methods: `snake_case`
- Constants: `UPPER_SNAKE_CASE`
- Private methods: `_leading_underscore`
- Database tables: `snake_case` (pluralized: `runs`, `agents`, `posts`)

### Error handling

- Raise `HTTPException(status_code=..., detail=...)` in API routes.
- Use custom exception classes in `app/exceptions.py` for domain errors.
- Log errors with `structlog` using `logger.error("message", key=value)`.
- Never expose internal errors or stack traces to clients.
- Validate all LLM responses against JSON schema before database writes.

### FastAPI patterns

```python
from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db import get_session
from app.schemas.run import RunCreate, RunRead

router = APIRouter(prefix="/runs", tags=["runs"])

@router.post("/", response_model=RunRead, status_code=201)
def create_run(
    run_create: RunCreate,
    session: Session = Depends(get_session),
) -> Run:
    ...
```

### SQLModel patterns

```python
from datetime import datetime
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel

class Run(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    status: str = Field(default="queued")
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

### Pydantic schemas

Separate schemas for creation, update, and read operations:

```python
from pydantic import BaseModel

class RunBase(BaseModel):
    title: str
    brand: str

class RunCreate(RunBase):
    agent_count: int = 20
    round_count: int = 150

class RunRead(RunBase):
    id: UUID
    status: str
    created_at: datetime
```

### Structured logging

Use `structlog` with JSON output for production:

```python
import structlog
logger = structlog.get_logger()
logger.info("run_started", run_id=str(run.id), agent_count=run.agent_count)
```

### Configuration

Use `pydantic-settings` for environment variables:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    openrouter_api_key: str
    langfuse_public_key: str | None = None
    class Config:
        env_file = ".env"

settings = Settings()
```

## Project Structure Conventions

- `app/api/`: FastAPI route handlers
- `app/models/`: SQLModel database models
- `app/schemas/`: Pydantic request/response schemas
- `app/services/`: Business logic (simulation runner, OpenRouter client, etc.)
- `app/worker/`: Background worker entry point
- `app/prompts/`: Prompt templates for LLM calls
- `tests/`: Mirror app structure (`tests/test_api/`, `tests/test_services/`)

## Testing Guidelines

- Use `pytest` with `pytest-asyncio` for async tests.
- Use `TestClient` from `fastapi.testclient` for API tests.
- Use in-memory SQLite for database tests.
- Mock external services (OpenRouter, Neon) in unit tests.
- Use fixtures in `tests/conftest.py` for shared test setup.
- Test validation of LLM JSON schema responses explicitly.

## Security

- Store secrets in environment variables only.
- Never commit `.env` files.
- Validate and sanitize all user inputs.
- Never expose `OPENROUTER_API_KEY` to frontend.
- All database writes go through API or worker only.