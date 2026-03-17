# AGENTS.md

Coding agent instructions for SwarmThread repository.

## Project Overview

SwarmThread is a batch simulation system for predictive analysis of marketing content impact.

- **Backend**: FastAPI + SQLModel + Alembic + Neon Postgres + OpenRouter LLM
- **Frontend**: React 19 + TypeScript + Vite

## Common Commands

### Frontend (from `frontend/`)

```bash
npm install                # Install dependencies
npm run dev               # Start dev server (http://localhost:5173)
npm run build             # Build for production (tsc -b && vite build)
npm run lint              # Run ESLint
npm run preview           # Preview production build

npx tsc -b                # Type check only (without build)
npx eslint src/ --fix     # Lint and auto-fix specific directory
```

### Backend (from `backend/`)

```bash
uv sync                    # Install dependencies
uv sync --frozen           # Install from lockfile (CI/deploy)

uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
uv run python -m app.worker.main    # Background worker

uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head
uv run alembic downgrade -1

uv run ruff check .        # Lint
uv run ruff check . --fix  # Auto-fix
uv run ruff format .       # Format
uv run mypy app            # Type check

uv run pytest              # Run all tests
uv run pytest tests/test_api -v  # Run specific directory
uv run pytest tests/test_api/test_runs.py -v  # Run single file
uv run pytest tests/test_api/test_runs.py::test_create_run -v  # Run single test
uv run pytest -k "create_run" -v  # Run tests matching pattern
uv run pytest --cov=app --cov-report=term-missing  # With coverage
```

See `backend/AGENTS.md` for comprehensive Python conventions.

## Code Style Guidelines

### Frontend (React/TypeScript)

#### Imports

Ordered: React first, then third-party, then local (relative paths). CSS imports last.

```tsx
import { useState } from 'react'
import { BrowserRouter, Routes } from 'react-router-dom'
import SomeComponent from './SomeComponent'
import './App.css'
```

#### Formatting

- ESLint with TypeScript and React hooks plugins
- **No semicolons** (Vite template default)
- **Double quotes** for JSX attributes
- **Single quotes** for JS strings
- **2-space indentation**
- Trailing commas in multi-line structures

#### Types

- Strict TypeScript enabled (`strict: true`)
- No `any` - use proper types
- `noUnusedLocals: true`, `noUnusedParameters: true`
- `verbatimModuleSyntax: true` - use explicit type imports

```tsx
import { useState } from 'react'
import type { ReactNode } from 'react'  // type keyword for types only
```

#### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Components | `PascalCase.tsx` | `UserCard.tsx` |
| CSS files | Same as component | `UserCard.css` |
| CSS classes | `kebab-case` | `.user-card`, `.hero-section` |
| Props interfaces | `ComponentNameProps` | `UserCardProps` |
| Custom hooks | `usePascalCase` | `useAuth`, `useRunStatus` |
| Event handlers | `handleNounVerb` | `handleSubmit`, `handleInputChange` |

#### React Patterns

```tsx
interface AppProps {
  title: string
  onSubmit?: () => void
}

function App({ title, onSubmit }: AppProps) {
  const [count, setCount] = useState(0)

  const handleClick = () => {
    setCount((c) => c + 1)  // Use callback form for state updates
  }

  return (
    <button onClick={handleClick}>
      {title}: {count}
    </button>
  )
}

export default App
```

- Use function components (not arrow functionconst)
- Prefer controlled components
- Use `StrictMode` in entry point (`main.tsx`)
- Destructure props in function signature
- Use `<>...</>` fragments instead of `<div>` wrappers

#### CSS Guidelines

```css
:root {
  --bg: #fff;
  --text: #1a1a1a;
  --accent: #6366f1;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #16171d;
    --text: #e5e7eb;
  }
}

.component-class {
  &:hover { /* nested selectors */ }
  &:focus-visible { outline: 2px solid var(--accent); }
}

@media (max-width: 1024px) { /* mobile responsive */ }
```

- Use CSS custom properties in `:root` for theming
- Support light/dark modes via `prefers-color-scheme`
- Nest selectors inside parent blocks (native CSS nesting)
- Responsive breakpoint at `max-width: 1024px`

#### Error Handling

```tsx
// Prefer explicit error states over try/catch in components
const [error, setError] = useState<string | null>(null)

// In async handlers
try {
  await fetchData()
} catch (err) {
  setError(err instanceof Error ? err.message : 'An error occurred')
}

// Display errors gracefully
{error && <div role="alert">{error}</div>}
```

#### Accessibility

- Use semantic HTML (`<main>`, `<nav>`, `<section>`, `<article>`)
- Add `aria-label` to interactive elements without visible text
- Use `role="presentation"` for decorative images
- Ensure focus states with `:focus-visible`

### Backend (Python/FastAPI)

See `backend/AGENTS.md` for detailed guidelines including:
- Import organization (stdlib→third-party→local)
- Ruff formatting (88 char, double quotes)
- Type hints (`list[T]`, `T | None`)
- Naming conventions (`snake_case`, `PascalCase`)
- Error handling with `HTTPException`
- FastAPI/SQLModel/Pydantic patterns
- Database model patterns
- Testing with pytest

## Project Structure

```
swarmthread/
├── frontend/
│   ├── src/
│   │   ├── App.tsx         # Main component
│   │   ├── App.css         # Component styles
│   │   ├── index.css       # Global styles
│   │   └── main.tsx        # Entry point
│   ├── public/             # Static assets
│   ├── package.json
│   └── tsconfig.app.json   # TypeScript config
├── backend/
│   ├── app/
│   │   ├── api/            # FastAPI routes
│   │   ├── models/         # SQLModel models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── worker/         # Background worker
│   ├── tests/
│   └── pyproject.toml
└── AGENTS.md
```

## Testing

### Frontend

No test framework configured yet. Use Vitest when adding tests.

### Backend

- pytest with `pytest-asyncio` (asyncio_mode = "auto")
- `TestClient` from `fastapi.testclient` for API tests
- In-memory SQLite: `create_engine("sqlite:///:memory:")`
- Mock external services (OpenRouter, Neon) in unit tests
- Fixtures in `tests/conftest.py`

## Security

- Never commit `.env` files
- Store secrets in environment variables
- Never expose `OPENROUTER_API_KEY` to frontend
- Validate all user inputs
- All database writes through API or worker only