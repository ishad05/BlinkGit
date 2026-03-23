# BlinkGit — Claude Code Guide

## Project Overview

**BlinkGit** is a GitHub repository intelligence tool. Users paste a GitHub repo URL and receive an AI-generated analysis: an architecture diagram, a ranked issue list (by difficulty), and a high-level repo overview. All output is streamed progressively to the frontend.

---

## Monorepo Structure

```
blinkgit/
├── frontend/    # React + Vite SPA → deployed to Cloudflare Pages
└── backend/     # Hono + Node.js + AI SDK agent → deployed to Railway
```

---

## Frontend (`frontend/`)

### Stack
- React + Vite, TypeScript
- TailwindCSS + shadcn/ui
- TanStack Query (server state), Zustand (client state)
- React Flow (architecture diagram rendering)
- `@ai-sdk/react` — `useObject` hook for SSE streaming

### Key Conventions
- Components go in `src/components/`; keep them small and single-responsibility
- Use Zustand only for global UI state (e.g. selected model)
- Use TanStack Query for all server/async state — never raw `fetch` in components
- Tailwind utility classes only — no custom CSS files unless absolutely necessary
- Use shadcn/ui primitives before writing custom UI components
- Backend API base URL must come from `VITE_BACKEND_URL` env variable

### Key Files
| File | Role |
|---|---|
| `src/App.tsx` | Root layout and routing |
| `src/components/RepoInput.tsx` | URL input and form submission |
| `src/components/OverviewPanel.tsx` | Repo overview display |
| `src/components/IssueRanker.tsx` | Ranked issues with difficulty badges |
| `src/components/ArchDiagram.tsx` | React Flow diagram (node/edge data from agent) |
| `src/components/ModelSwitcher.tsx` | LLM selection panel |
| `src/stores/modelStore.ts` | Zustand store for selected model string |

---

## Backend (`backend/`)

### Stack
- Hono + `@hono/node-server` (Node.js adapter)
- Vercel AI SDK (`ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`)
- Octokit REST (`@octokit/core`)
- Zod (schema validation for AI outputs)
- PostgreSQL (Railway-provided) — repo analysis cache and model config
- `postgres` npm package for DB access

### Runtime

**The backend runs on Node.js 20+ on Railway.**

Full Node.js APIs are available (`fs`, `path`, etc.), but avoid using them unnecessarily — keep the code portable and dependency-light.

### Key Files & Responsibilities
| File | Role |
|---|---|
| `src/index.ts` | Hono app entry point, route registration |
| `src/routes/` | All Hono route handlers |
| `src/agent/github.ts` | All GitHub data fetching logic |
| `src/agent/schema.ts` | Zod schema for AI output — never inline this elsewhere |
| `src/agent/analyze.ts` | `streamObject` / `generateObject` call |
| `src/db/cache.ts` | All PostgreSQL cache logic — never write raw SQL elsewhere |
| `src/db/models.ts` | Model config read/write (replaces Cloudflare KV) |

### API Routes
| Method | Path | Description |
|---|---|---|
| POST | `/analyze` | Accepts `{ repoUrl }`, streams AI analysis (SSE) |
| GET | `/models` | Returns currently selected model from DB |
| POST | `/models` | Updates selected model in DB |

### Environment Variables (`.env` / Railway dashboard)
| Variable | Purpose |
|---|---|
| `GITHUB_TOKEN` | GitHub personal access token |
| `OPENAI_API_KEY` | OpenAI key |
| `ANTHROPIC_API_KEY` | Anthropic key |
| `GOOGLE_API_KEY` | Google key |
| `DATABASE_URL` | PostgreSQL connection string (provided by Railway) |
| `PORT` | Server port (Railway sets this automatically) |

---

## AI Agent Design

### Zod Output Schema (`src/agent/schema.ts`)

```ts
z.object({
  overview: z.object({
    purpose: z.string(),
    techStack: z.array(z.string()),
    keyFiles: z.array(z.string()),
    highlights: z.array(z.string()),
  }),
  issues: z.array(z.object({
    title: z.string(),
    url: z.string(),
    difficulty: z.enum(['beginner', 'moderate', 'high']),
    reason: z.string(),
  })),
  architecture: z.object({
    nodes: z.array(z.object({ id: z.string(), label: z.string(), type: z.string() })),
    edges: z.array(z.object({ from: z.string(), to: z.string(), label: z.string().optional() })),
  }),
})
```

### Model Switching Pattern

```ts
import { getSelectedModel } from '../db/models.js'

const modelId = await getSelectedModel() ?? 'openai/gpt-4o'

const model =
  modelId.startsWith('anthropic') ? anthropic(modelId.split('/')[1]) :
  modelId.startsWith('google')    ? google(modelId.split('/')[1]) :
                                    openai(modelId.split('/')[1])
```

### GitHub Data Fetching Strategy
- File tree: top 2 levels only (avoid token bloat)
- README.md content
- Up to 5 key source files (entry points, config, main modules)
- Open issues capped at 50
- All passed as context in a single structured prompt to `streamObject`

---

## Shared Conventions

- **Language**: TypeScript everywhere, strict mode on
- **Formatting**: Prettier with default settings
- **Linting**: ESLint with recommended rules
- **Naming**: camelCase for variables/functions, PascalCase for components/types, kebab-case for file names
- **Imports**: Named imports preferred; avoid barrel `index.ts` files in deeply nested directories
- **Error Handling**: Always handle async errors explicitly; never swallow errors silently
- **No `any`**: Use `unknown` and narrow properly

---

## Commands

### Frontend
```bash
cd frontend
npm install
npm run dev        # local dev server
npm run build      # production build
npm run preview    # preview production build
```

### Backend
```bash
cd backend
npm install
npm run dev        # tsx watch src/index.ts (local dev)
npm run build      # tsc (compile to dist/)
npm run start      # node dist/index.js (production)
```

---

## Deployment

- **Frontend** → Cloudflare Pages via `wrangler pages deploy dist/`
- **Backend** → Railway via git push (auto-detected Node.js, uses `npm run start`)
- Secrets set via Railway dashboard environment variables
- PostgreSQL provisioned as a Railway service; `DATABASE_URL` injected automatically

---

## Never Do

- Never install or use LangChain, LlamaIndex, or any Python-based AI framework
- Never write raw SQL outside of `src/db/cache.ts` and `src/db/models.ts`
- Never put API keys or secrets in source code — always use environment variables
- Never fetch the entire repo file tree — always limit depth to avoid LLM context limits
- Never call `streamObject` without first checking the DB cache
- Never hardcode a model name in a route handler — always read from the DB
