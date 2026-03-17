# SwarmThread POC — Final Engineering Spec

## 1. Scope

SwarmThread is a batch simulation system for predictive analysis of marketing content impact. A user submits a campaign seed, the backend runs a 20-agent / 150-round X-like social simulation, and the product returns two artifacts: a read-only social snapshot and a predictive analysis report. The only hard provider requirement is OpenRouter, which supports an OpenAI-compatible API, structured outputs, and direct use through the OpenAI Python SDK.

## 2. Final stack

Use this stack for V1:

| Component | Technology |
|-----------|-------------|
| API | FastAPI |
| Language/runtime | Python 3.11+ |
| ORM/models | SQLModel |
| Migrations | Alembic |
| Primary database | Neon Postgres |
| Hosting | Render |
| LLM gateway | OpenRouter |
| Default model | qwen/qwen-plus |
| Tracing/observability | Langfuse |
| Package manager | uv |

This is the lowest-complexity modern Python stack that fits the product and current hosted tooling. FastAPI supports post-response background work, SQLModel is designed for SQL databases in Python with FastAPI-friendly ergonomics, Alembic is the standard SQLAlchemy migration layer, Neon provides serverless Postgres with autoscaling and connection pooling, and Render supports FastAPI deployment plus dedicated background workers.

## 3. Deployment topology

Deploy two Render services and one Neon database:

### Render Web Service

- Runs the FastAPI API
- Exposes public endpoints for run creation, status, feed reads, thread reads, and report reads

### Render Background Worker

- Runs the simulation loop
- Polls for queued runs and executes them
- Does not receive public HTTP traffic

### Neon Postgres

- Stores canonical state for runs, agents, posts, interactions, and reports

Render documents background workers as continuously running services for asynchronous work, distinct from web services. Neon documents autoscaling, built-in connection pooling, and serverless Postgres capabilities on its pricing page.

## 4. Architecture decision

This POC uses a batch architecture, not a real-time social network.

**Flow:**

1. User submits a campaign seed.
2. API creates a run in Postgres with status queued.
3. Worker picks up the run and simulates 150 rounds.
4. Worker writes every action to Postgres.
5. Worker runs a final analysis pass.
6. API serves the completed snapshot and report.

This avoids Redis, Celery, Kafka, websockets, and multi-service event streaming. That is the correct tradeoff for a fixed-size simulation snapshot. Render background workers are specifically intended for long-running asynchronous work.

## 5. OpenRouter integration

### Client strategy

Use the OpenAI Python SDK with OpenRouter's base URL:

- **Base URL:** `https://openrouter.ai/api/v1`
- **Auth:** `Authorization: Bearer <OPENROUTER_API_KEY>`

OpenRouter documents OpenAI SDK compatibility directly, and that should be preferred over the beta OpenRouter SDK for this POC.

### Required OpenRouter features

The backend depends on:

- OpenAI-compatible chat/completions
- Structured outputs with JSON Schema
- Usage metadata for cost tracing
- Model routing through OpenRouter

OpenRouter's structured outputs guide documents `response_format.type = "json_schema"` with strict schema validation.

### Default model

Use `qwen/qwen-plus` as the default decision model. OpenRouter currently lists it at $0.40/M input tokens and $1.20/M output tokens.

## 6. Non-goals for V1

Do not include these in the first build:

- OASIS as a required runtime
- Redis
- Celery
- Kafka
- vector DB
- live notifications
- tool-calling agents
- multi-tenant permissions
- real-time feed recomputation

The POC only needs deterministic-ish batch generation and read-only serving afterward.

## 7. Project structure

```
swarmthread/
  pyproject.toml
  uv.lock
  app/
    main.py
    config.py
    db.py
    logging.py
    api/
      runs.py
      feed.py
      threads.py
      agents.py
      analysis.py
      health.py
    models/
      run.py
      seed.py
      agent.py
      post.py
      interaction.py
      report.py
      llm_call.py
    schemas/
      run.py
      seed.py
      action.py
      feed.py
      thread.py
      report.py
    services/
      openrouter_client.py
      simulation_runner.py
      prompt_builder.py
      action_validator.py
      timeline_builder.py
      analysis_builder.py
      cost_guard.py
    worker/
      main.py
      polling.py
    prompts/
      agent_decide_action.md
      final_report.md
  migrations/
  tests/
  render.yaml
  Dockerfile
```

This structure cleanly separates API, persistence, simulation, and prompt logic.

## 8. Data model

### Core tables

#### runs

| Column | Type |
|--------|------|
| id | UUID |
| status | enum: queued \| running \| completed \| failed \| cancelled |
| agent_count | integer |
| round_count | integer |
| started_at | timestamp |
| completed_at | timestamp |
| error_message | text |
| model_name | text |
| max_total_cost_usd | decimal |

#### run_seeds

| Column | Type |
|--------|------|
| id | UUID |
| run_id | UUID FK |
| title | text |
| brand | text |
| goal | text |
| content_type | text |
| message | text |
| cta | text |
| tone | text |
| audience_segments | JSONB |
| controversy_level | text |

#### agents

| Column | Type |
|--------|------|
| id | UUID |
| run_id | UUID FK |
| handle | text |
| display_name | text |
| persona_name | text |
| persona_description | text |
| stance_bias | text |
| verbosity_bias | text |
| skepticism_bias | text |
| created_at | timestamp |

#### posts

| Column | Type |
|--------|------|
| id | UUID |
| run_id | UUID FK |
| author_agent_id | UUID FK |
| parent_post_id | UUID FK (nullable) |
| root_post_id | UUID |
| round_number | integer |
| content | text |
| stance | text |
| like_count | integer |
| reply_count | integer |
| created_at | timestamp |

#### interactions

| Column | Type |
|--------|------|
| id | UUID |
| run_id | UUID FK |
| agent_id | UUID FK |
| interaction_type | enum: like \| follow |
| target_post_id | UUID FK (nullable) |
| target_agent_id | UUID FK (nullable) |
| round_number | integer |
| created_at | timestamp |

#### follows

| Column | Type |
|--------|------|
| id | UUID |
| run_id | UUID FK |
| follower_agent_id | UUID FK |
| followed_agent_id | UUID FK |
| created_at | timestamp |

#### analysis_reports

| Column | Type |
|--------|------|
| id | UUID |
| run_id | UUID FK |
| predicted_engagement | decimal |
| predicted_shareability | decimal |
| predicted_conversion_signal | decimal |
| predicted_trust | decimal |
| top_positive_themes | JSONB |
| top_negative_themes | JSONB |
| top_objections | JSONB |
| recommended_rewrite | text |
| raw_json | JSONB |

#### llm_calls

| Column | Type |
|--------|------|
| id | UUID |
| run_id | UUID FK |
| agent_id | UUID FK (nullable) |
| stage | enum: agent_action \| final_analysis |
| model_name | text |
| prompt_tokens | integer |
| completion_tokens | integer |
| estimated_cost_usd | decimal |
| latency_ms | integer |
| success | boolean |
| error_message | text |
| created_at | timestamp |

### Indexes

Create indexes on:

- `runs(status, created_at desc)`
- `posts(run_id, root_post_id)`
- `posts(run_id, round_number)`
- `posts(run_id, author_agent_id)`
- `interactions(run_id, round_number)`
- `follows(run_id, follower_agent_id)`
- `llm_calls(run_id, created_at)`

### Migration strategy

Use Alembic for all schema changes. Alembic documents autogeneration against SQLAlchemy metadata, which fits SQLModel-based schemas well.

## 9. API contract

### Write endpoints

#### POST /runs

Creates a run.

**Request:**

```json
{
  "title": "Predictive Analysis of Marketing Content Impact",
  "brand": "Acme Analytics",
  "goal": "Drive demo signups",
  "content_type": "thought_leadership",
  "message": "Marketing teams can estimate campaign impact before launch using simulated audience response.",
  "cta": "Book a demo",
  "tone": "confident, analytical",
  "audience_segments": ["performance marketer", "brand strategist", "skeptical founder"],
  "controversy_level": "low",
  "agent_count": 20,
  "round_count": 150,
  "model_name": "qwen/qwen-plus",
  "max_total_cost_usd": 5.0
}
```

**Response:**

```json
{
  "run_id": "uuid",
  "status": "queued"
}
```

#### POST /runs/{run_id}/start

Optional manual start. In production, the worker can start queued jobs automatically.

#### POST /runs/{run_id}/cancel

Cancels queued or running runs.

### Read endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /runs/{run_id}` | Returns run metadata and status. |
| `GET /runs/{run_id}/feed` | Returns the final timeline snapshot. |
| `GET /runs/{run_id}/threads/{post_id}` | Returns a thread tree rooted at post_id. |
| `GET /runs/{run_id}/agents/{agent_id}` | Returns agent profile and authored content. |
| `GET /runs/{run_id}/analysis` | Returns the predictive analysis report. |
| `GET /healthz` | Health check for Render. |

## 10. Agent model

### Persona system

Each run creates 20 synthetic agents from preset persona archetypes tied to marketing-relevant behaviors:

- performance marketer
- brand strategist
- skeptical founder
- agency lead
- data scientist
- cynical operator
- enthusiastic early adopter
- competitor-adjacent voice
- creator/influencer type
- casual observer

Each agent record contains stable biases so behavior remains consistent across 150 rounds.

### Allowed actions

V1 supports exactly five actions:

- post
- reply
- like
- follow
- idle

No repost/quote-post in V1.

## 11. Structured action schema

All agent decisions must come back as strict JSON Schema via OpenRouter structured outputs. That removes fragile parsing and prevents direct free-form state mutation. OpenRouter explicitly documents strict JSON-schema response enforcement.

**Action schema:**

```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": ["post", "reply", "like", "follow", "idle"]
    },
    "target_post_id": {
      "type": ["string", "null"]
    },
    "target_agent_id": {
      "type": ["string", "null"]
    },
    "content": {
      "type": ["string", "null"]
    },
    "stance": {
      "type": "string",
      "enum": ["supportive", "skeptical", "neutral", "critical", "curious"]
    },
    "confidence": {
      "type": "number",
      "minimum": 0,
      "maximum": 1
    }
  },
  "required": ["action", "target_post_id", "target_agent_id", "content", "stance", "confidence"],
  "additionalProperties": false
}
```

Unused optional fields must be `null` for the chosen action.

**Validation rules:**

- `post` requires content
- `reply` requires target_post_id and content
- `like` requires target_post_id
- `follow` requires target_agent_id
- `idle` requires neither target nor content

## 12. Simulation loop

For each run:

1. Create 20 agents.
2. Insert a seed post from a designated source agent or brand voice.
3. For rounds 1..150:
   - determine agent order
   - build each agent's local context
   - request one action from OpenRouter
   - validate action
   - persist results
   - update counts and follow graph
4. Build final timelines.
5. Run final predictive analysis.
6. Mark run completed.

### Agent context window

Each action prompt should include:

- campaign seed
- agent persona
- recent authored actions, last 10
- recent feed slice, max 20 items
- current follow list
- platform summary for the round

Keep the prompt compact to control cost.

## 13. Final analysis schema

Run one final OpenRouter pass over the generated run to produce a structured report.

**Report schema:**

```json
{
  "type": "object",
  "properties": {
    "predicted_engagement": { "type": "number", "minimum": 0, "maximum": 1 },
    "predicted_shareability": { "type": "number", "minimum": 0, "maximum": 1 },
    "predicted_conversion_signal": { "type": "number", "minimum": 0, "maximum": 1 },
    "predicted_trust": { "type": "number", "minimum": 0, "maximum": 1 },
    "top_positive_themes": {
      "type": "array",
      "items": { "type": "string" }
    },
    "top_negative_themes": {
      "type": "array",
      "items": { "type": "string" }
    },
    "top_objections": {
      "type": "array",
      "items": { "type": "string" }
    },
    "recommended_rewrite": { "type": "string" }
  },
  "required": [
    "predicted_engagement",
    "predicted_shareability",
    "predicted_conversion_signal",
    "predicted_trust",
    "top_positive_themes",
    "top_negative_themes",
    "top_objections",
    "recommended_rewrite"
  ],
  "additionalProperties": false
}
```

## 14. Worker design on Render

Use a dedicated Render Background Worker for the simulation engine. Render documents background workers as continuously running services intended for asynchronous or resource-intensive tasks, and that is a better fit than relying on FastAPI BackgroundTasks for long simulations. FastAPI's docs describe background tasks as work triggered after returning a response, but not as a full job-processing system.

### Worker polling loop

Every few seconds:

- query Neon for the oldest queued run
- atomically claim it
- mark running
- execute simulation
- mark completed or failed

This avoids adding Redis in V1.

## 15. Render setup

### Web service

- **Type:** Render Web Service
- **Runtime:** Python
- **Build command:** `uv sync --frozen`
- **Start command:** `uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Worker service

- **Type:** Render Background Worker
- **Runtime:** Python
- **Build command:** `uv sync --frozen`
- **Start command:** `uv run python -m app.worker.main`

Render has explicit docs for deploying FastAPI apps and background workers.

### render.yaml

Use Render Blueprint configuration to define both services and shared environment variables in one file.

## 16. Neon setup

Use one Neon project with:

- one primary database
- one application role
- pooled connection string for app traffic
- direct connection string for migrations if needed

Neon documents connection pooling and autoscaling, both useful for Render-hosted apps.

**Recommended env vars:**

- `DATABASE_URL` for pooled runtime traffic
- `DATABASE_URL_MIGRATIONS` for Alembic

## 17. Observability

Use Langfuse for:

- trace-per-run
- trace-per-agent-turn
- prompt versioning
- latency inspection
- cost monitoring

OpenRouter documents Langfuse integration, and Langfuse separately documents OpenRouter support.

Also persist in Postgres:

- model_name
- prompt_tokens
- completion_tokens
- latency_ms
- estimated_cost_usd
- success/error

## 18. Cost controls

Default model is `qwen/qwen-plus`, with pricing currently listed on OpenRouter at $0.40/M input and $1.20/M output.

Enforce these guards:

- `max_completion_tokens` per call
- `max_total_run_cost_usd`
- `max_retries = 3`
- concurrency cap of 2
- run cancellation on cap breach

A 20-agent × 150-round sim can stay inexpensive if prompts are short and outputs are tightly schema-constrained.

## 19. Security

Store secrets only in Render environment variables:

- `OPENROUTER_API_KEY`
- `DATABASE_URL`
- `DATABASE_URL_MIGRATIONS`
- `LANGFUSE_PUBLIC_KEY`
- `LANGFUSE_SECRET_KEY`

**Rules:**

- never expose the OpenRouter key to the frontend
- all writes go through API/worker only
- sanitize content before frontend rendering
- validate every model response against schema before DB writes

## 20. Recommended dependencies

`pyproject.toml` core dependencies:

```toml
[project]
requires-python = ">=3.11"
dependencies = [
  "fastapi",
  "uvicorn[standard]",
  "sqlmodel",
  "sqlalchemy",
  "alembic",
  "psycopg[binary]",
  "openai",
  "httpx",
  "pydantic",
  "python-dotenv",
  "langfuse",
  "structlog",
]
```

uv is a good fit for managing this Python project and lockfile.

## 21. Implementation phases

### Phase 1

- FastAPI skeleton
- Neon connection
- Alembic migrations
- Render deployment
- run creation + status endpoints

### Phase 2

- simulation worker
- OpenRouter action generation
- action validation
- feed/thread APIs

### Phase 3

- final analysis pass
- Langfuse traces
- cost guards
- export endpoint

## 22. Final recommendation

Build SwarmThread V1 as:

**FastAPI API on Render + Render background worker + Neon Postgres + OpenRouter (qwen/qwen-plus) + Langfuse + strict JSON-schema outputs**
