# SwarmThread

Batch simulation system for predictive analysis of marketing content impact.

## Overview

SwarmThread simulates social network interactions topredict how marketing content will perform before deployment.

## Quick Start

```bash
# Install dependencies
uv sync

# Run database migrations
uv run alembic upgrade head

# Start the API server
uv run uvicorn app.main:app --reload

# Start the background worker (in another terminal)
uv run python -m app.worker.main
```

## License

MIT