# AGENTS.md

Coding agent instructions for the SwarmThread frontend.

## Project Overview

React 19 + TypeScript + Vite frontend for SwarmThread batch simulation system.

## Build/Lint/Test Commands

```bash
npm install                # Install dependencies
npm run dev               # Start dev server (http://localhost:5173)
npm run build             # Build for production (tsc -b && vite build)
npm run lint              # Run ESLint
npm run preview           # Preview production build

npx tsc -b                # Type check only (without build)
npx eslint src/ --fix     # Lint and auto-fix specific directory
```

No test framework configured yet. Use Vitest when adding tests.

## Code Style Guidelines

### Imports

Ordered: React first, then third-party, then local (relative paths). CSS imports last.

```tsx
import { useState } from 'react'
import { BrowserRouter, Routes } from 'react-router-dom'
import SomeComponent from './SomeComponent'
import './App.css'
```

### Formatting

- ESLint with TypeScript and React hooks plugins
- **No semicolons** (Vite template default)
- **Double quotes** for JSX attributes
- **Single quotes** for JS strings
- **2-space indentation**
- Trailing commas in multi-line structures

### Types

- Strict TypeScript enabled (`strict: true`)
- No `any` - use proper types
- `noUnusedLocals: true`, `noUnusedParameters: true`
- `verbatimModuleSyntax: true` - use explicit type imports

```tsx
import { useState } from 'react'
import type { ReactNode } from 'react'  // type keyword for types only
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Components | `PascalCase.tsx` | `UserCard.tsx` |
| CSS files | Same as component | `UserCard.css` |
| CSSclasses | `kebab-case` | `.user-card`, `.hero-section` |
| Props interfaces | `ComponentNameProps` | `UserCardProps` |
| Custom hooks | `usePascalCase` | `useAuth`, `useRunStatus` |
| Event handlers | `handleNounVerb` | `handleSubmit`, `handleInputChange` |
| Boolean props | `isX`, `hasX` | `isLoading`, `hasError` |

### React Patterns

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

- Use function components (not arrow function const)
- Prefer controlled components
- Use `StrictMode` in entry point (`main.tsx`)
- Destructure props in function signature
- Use `<>...</>` fragments instead of `<div>` wrappers

### CSS Guidelines

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

### Error Handling

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

### Accessibility

- Use semantic HTML (`<main>`, `<nav>`, `<section>`, `<article>`)
- Add `aria-label` to interactive elements without visible text
- Use `role="presentation"` for decorative images
- Ensure focus states with `:focus-visible`

## Project Structure

```
frontend/
├── src/
│   ├── App.tsx         # Main component
│   ├── App.css         # Component styles
│   ├── index.css       # Global styles (CSS variables, theme)
│   ├── main.tsx        # Entry point with StrictMode
│   └── assets/         # Static assets (images, icons)
├── public/             # Static files served directly
├── package.json
├── tsconfig.app.json   # TypeScript config
├── vite.config.ts      # Vite configuration
└── eslint.config.js    # ESLint flat config
```

## Security

- Never commit `.env` files
- Never expose API keys in frontend code
- Validate all user inputs before sending to backend
- Use environment variables for configuration (`VITE_` prefix)