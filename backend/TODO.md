# BlinkGit — Backend TODO

This document tracks all remaining backend work. It is written for the backend team's
Claude Code agent. Read `CLAUDE.md` at the repo root before starting any task.

---

## Current State

All 6 core features are implemented and the app is functionally complete:
- `POST /analyze` — streams AI analysis (Gemini via `streamObject`)
- `GET /POST /models` — model selection persisted to PostgreSQL
- `POST /chat` — context-aware streaming chat

The DB layer (`src/db/`), agent layer (`src/agent/`), and all routes are wired up.
Caching, model switching, and GitHub data fetching all work.

The items below are **production-readiness gaps, enhancements, and Phase 3 features**.
Work top-down — the first section is the highest priority.

---

## 1. Production-Readiness (Do These First)

### 1a. Lock Down CORS for Production
**File**: `src/index.ts`

Currently CORS allows `*`. Before deployment, restrict to the actual frontend origin.

```ts
// Replace the current cors() call with:
app.use('*', cors({
  origin: process.env.FRONTEND_URL ?? '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}))
```

The `FRONTEND_URL` env var should be set to the Cloudflare Pages URL in Railway.

### 1b. Startup Environment Validation
**File**: `src/index.ts`

Add a validation block at the top of the file (before route registration) that throws
immediately if required env vars are missing, so Railway deploy failures are obvious:

```ts
const REQUIRED_ENV = ['GITHUB_TOKEN', 'GOOGLE_API_KEY', 'DATABASE_URL']
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`)
}
```

### 1c. Health Check Endpoint
**File**: `src/routes/health.ts` (new), register in `src/index.ts`

Railway uses HTTP health checks. Add:

```ts
// GET /health
// Returns 200 { status: 'ok', db: 'ok' | 'error' }
// Attempts a lightweight DB query (SELECT 1) to confirm connectivity
```

Register as `app.route('/health', healthRoute)` in `src/index.ts`.

### 1d. Fix TypeScript Errors in `embeddings.ts`
**File**: `src/agent/embeddings.ts`

There are 2 pre-existing TS errors:
1. Missing type for the `@google/generative-ai` import — install the package or switch to
   using the `@ai-sdk/google` embeddings API (preferred, since the project already uses
   the AI SDK for everything else).
2. Implicit `any` type — narrow it explicitly.

The embeddings feature is not yet exposed via any route, so this is a cleanup task but
it will block `npm run build` in strict mode. Fix before deploying.

**Preferred fix**: Replace the raw `@google/generative-ai` usage in `embeddings.ts` with
`embed()` from `ai` + `@ai-sdk/google`:

```ts
import { embed } from 'ai'
import { google } from '@ai-sdk/google'

export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: google.textEmbeddingModel('text-embedding-004'),
    value: text,
  })
  return embedding
}
```

Note: `text-embedding-004` outputs 768 dims; the DB schema has `vector(3072)`. Either
change the DB column size or use `gemini-embedding-exp-03-07` (3072 dims). Pick one and
update `migrate.ts` accordingly.

---

## 2. Missing Endpoints

### 2a. Cache Invalidation — `DELETE /cache`
**File**: `src/routes/cache.ts` (new)

Users need a way to force-refresh a stale analysis. The `deleteCachedAnalysis` function
already exists in `src/db/cache.ts` but is not exposed.

```ts
// DELETE /cache
// Body: { repoUrl: string }
// Deletes the cached analysis for that repo so the next /analyze call re-runs the AI
// Returns: 200 { deleted: true } | 404 { error: 'not found' }
```

**Frontend change needed**: Add a "Refresh analysis" button in `ResultsPage.tsx` that
calls `DELETE /cache` then re-submits the form. See the frontend skill
(`/frontend-integration`) for how to wire this up.

### 2b. List Available Models — extend `GET /models`
**File**: `src/routes/models.ts`

The route already returns `{ selected, available }` but `available` is hardcoded in the
route. Move the `VALID_MODELS` array to `src/db/models.ts` and export it so it can be
reused. No frontend change needed — the frontend already reads `available` from the
response.

---

## 3. Phase 3 — Semantic Code Search (Future Work)

> This is a stretch goal. Do not start until items 1 and 2 are complete and the app
> is deployed.

The infrastructure for this is already built (`chunker.ts`, `embeddings.ts`, the
`code_chunks` table in the DB). What's missing is the pipeline that runs it and a
route to query it.

### 3a. Embedding Pipeline — `POST /embed`
**File**: `src/routes/embed.ts` (new)

```ts
// POST /embed
// Body: { repoUrl: string }
// 1. Fetch all source files from GitHub (reuse fetchSourceFile from github.ts)
// 2. Chunk each file with chunkFile() from chunker.ts
// 3. Embed all chunks with embedChunks() from embeddings.ts
// 4. Store with storeChunks() from embeddings.ts
// 5. Return { chunksStored: number }
// This is a long-running operation — consider making it async (return 202 + poll)
```

Files to fetch for embedding: limit to source files only (`.ts`, `.js`, `.py`, `.go`,
`.rs`, `.java`). Cap at 30 files to stay within Gemini rate limits.

### 3b. Semantic Search — `POST /search`
**File**: `src/routes/search.ts` (new)

```ts
// POST /search
// Body: { repoUrl: string, query: string, limit?: number }
// Uses searchChunks() from embeddings.ts
// Returns: { results: Array<{ filePath, chunkName, content, similarity }> }
```

### 3c. Frontend Integration for Search
Once the `/search` endpoint exists, add a search input to `ChatPanel.tsx` or create a
new "Code Search" tab in the sidebar. See the frontend skill (`/frontend-integration`)
for how to add a new sidebar tab.

---

## 4. Deployment Checklist (Railway)

Before pushing to Railway:

- [ ] Set all env vars in Railway dashboard:
  - `GITHUB_TOKEN`
  - `GOOGLE_API_KEY`
  - `DATABASE_URL` (auto-injected by Railway Postgres plugin)
  - `FRONTEND_URL` (Cloudflare Pages URL)
  - `PORT` (Railway injects this automatically)
- [ ] Add Railway Postgres plugin to the project
- [ ] Run `npm run migrate` once after first deploy (or wire it into the start script)
- [ ] Confirm `GET /health` returns 200 after deploy
- [ ] Test `POST /analyze` with a real public repo end-to-end

To wire migration into the start script (optional):
```json
// package.json
"start": "node -e \"require('./dist/db/migrate.js').migrate()\" && node dist/index.js"
```

---

## 5. Known Constraints & Gotchas

- **AI SDK versions**: `ai` v6, `@ai-sdk/google` v3 — use `streamObject`/`streamText`
  from `ai`, not from provider packages directly.
- **Zod**: Backend uses Zod v3. Do not upgrade to v4 (frontend is on v4, they are
  separate packages). The schema in `src/agent/schema.ts` is source of truth — never
  duplicate it.
- **Streaming format**: `/analyze` returns SSE when cache misses, plain JSON when cache
  hits. The frontend `useAnalysis` hook handles both. Do not change the response format.
- **Model IDs**: The `VALID_MODELS` list in `src/db/models.ts` is the single source of
  truth. The frontend reads from `GET /models` — never hardcode model names in routes.
- **Raw SQL**: Only write SQL in `src/db/cache.ts` and `src/db/models.ts`. New DB
  files follow the same pattern (named exports, no classes, `sql` template tag).
- **pnpm**: This repo uses pnpm. Run `pnpm install`, not `npm install`.

---

## File Map (Backend)

```
backend/src/
├── index.ts              # Entry point — register new routes here
├── routes/
│   ├── analyze.ts        # POST /analyze (complete)
│   ├── chat.ts           # POST /chat (complete)
│   ├── models.ts         # GET/POST /models (complete)
│   ├── health.ts         # GET /health (TODO 1c)
│   └── cache.ts          # DELETE /cache (TODO 2a)
├── agent/
│   ├── schema.ts         # Zod schema — source of truth, never touch
│   ├── analyze.ts        # streamObject + prompt builder (complete)
│   ├── github.ts         # Octokit fetching (complete)
│   ├── chunker.ts        # Code splitter for Phase 3 (complete, unused)
│   └── embeddings.ts     # pgvector embeddings (TODO 1d, then Phase 3)
└── db/
    ├── client.ts         # Postgres connection (complete)
    ├── cache.ts          # Analysis cache CRUD (complete)
    ├── models.ts         # Model config CRUD (complete)
    └── migrate.ts        # Table creation (complete, run once)
```
