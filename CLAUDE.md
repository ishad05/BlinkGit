# BlinkGit — Claude Code Guide

## Project Overview

**BlinkGit** is a GitHub repository intelligence tool. Users paste a GitHub repo URL and receive an AI-generated analysis: an architecture diagram, a ranked issue list (by difficulty), and a high-level repo overview. All output is streamed progressively to the frontend.

---

## Monorepo Structure

```
blinkgit/
├── frontend/    # React + Vite SPA → deployed to Cloudflare Pages
└── worker/      # Hono + AI SDK agent → deployed to Cloudflare Workers
```

Always be aware of which workspace you are in. Never mix Node.js-only APIs into `worker/` — it runs on the V8 edge runtime, not Node.js.

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
- Worker API base URL must come from `VITE_WORKER_URL` env variable

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

## Worker (`worker/`)

### Stack
- Hono (edge-native router)
- Vercel AI SDK (`ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`)
- Octokit REST (`@octokit/core`) — fetch-based version only
- Zod (schema validation for AI outputs)
- Cloudflare D1 (SQLite cache for repo analyses)
- Cloudflare KV (model preference storage)

### Critical Runtime Constraint

**The worker runs on Cloudflare Workers (V8 isolate), NOT Node.js.**

- No `fs`, `path`, `os`, `child_process`, or any Node built-ins
- No LangChain, LlamaIndex, or any Node.js-dependent AI frameworks
- No `require()` — ESM only
- `fetch`, `Request`, `Response`, `URL`, `crypto` are all available globally
- AI SDK, Hono, and `@octokit/core` are all edge-compatible and safe to use

### Key Files & Responsibilities
| File | Role |
|---|---|
| `src/index.ts` | Route registration |
| `src/routes/` | All Hono route handlers |
| `src/agent/github.ts` | All GitHub data fetching logic |
| `src/agent/schema.ts` | Zod schema for AI output — never inline this elsewhere |
| `src/agent/analyze.ts` | `streamObject` / `generateObject` call |
| `src/db/cache.ts` | All D1 cache logic — never write raw SQL elsewhere |

### API Routes
| Method | Path | Description |
|---|---|---|
| POST | `/analyze` | Accepts `{ repoUrl }`, streams AI analysis (SSE) |
| GET | `/models` | Returns currently selected model from KV |
| POST | `/models` | Updates selected model in KV |

### Environment Bindings (`wrangler.toml`)
| Binding | Type | Purpose |
|---|---|---|
| `GITHUB_TOKEN` | Secret | GitHub personal access token |
| `OPENAI_API_KEY` | Secret | OpenAI key |
| `ANTHROPIC_API_KEY` | Secret | Anthropic key |
| `GOOGLE_API_KEY` | Secret | Google key |
| `ANALYSIS_CACHE` | D1 database | Repo analysis cache |
| `MODEL_CONFIG` | KV namespace | Selected model storage |

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
const modelId = await c.env.MODEL_CONFIG.get('selected_model') ?? 'openai/gpt-4o'

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

### Worker
```bash
cd worker
npm install
npm run dev        # wrangler dev (local worker emulation)
npm run deploy     # wrangler deploy (production)
npm run cf-typegen # regenerate Cloudflare binding types
```

---

## Deployment

- **Frontend** → Cloudflare Pages via `wrangler pages deploy dist/`
- **Worker** → Cloudflare Workers via `wrangler deploy`
- Secrets set via `wrangler secret put <SECRET_NAME>`
- D1 and KV bindings must be created in the Cloudflare dashboard and referenced in `wrangler.toml`

---

## Never Do

- Never install or use LangChain, LlamaIndex, or any Python-based AI framework
- Never use `next`, `express`, or any Node.js server framework in the worker
- Never write raw SQL outside of `src/db/cache.ts`
- Never put API keys or secrets in source code — always use Worker bindings
- Never fetch the entire repo file tree — always limit depth to avoid LLM context limits
- Never call `streamObject` without first checking the D1 cache
- Never hardcode a model name in a route handler — always read from KV
