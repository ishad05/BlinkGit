# BlinkGit

![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=white)
![Cloudflare Workers](https://img.shields.io/badge/Backend-Cloudflare%20Workers-F38020?logo=cloudflare&logoColor=white)
![AI SDK](https://img.shields.io/badge/Powered%20by-Vercel%20AI%20SDK-000000?logo=vercel&logoColor=white)

BlinkGit is a GitHub repository intelligence tool. Paste any public GitHub repo URL and get an instant, AI-powered analysis — including an interactive architecture diagram, a ranked list of open issues by difficulty, and a high-level overview of the project.

---

## Features

- **Architecture Diagram** — Analyzes the repository file tree and generates an interactive node/edge diagram rendered with React Flow.
- **Issue Ranker** — Fetches all open GitHub issues and classifies them into Beginner, Moderate, and High difficulty.
- **Repo Overview** — Summarizes the project's purpose, tech stack, key files, notable contributors, and general health.
- **Multi-model Support** — Swap between OpenAI, Anthropic, and Google LLM providers from the UI with zero backend changes.
- **Result Caching** — Analyzed repos are cached in Cloudflare D1; repeat lookups return instantly without re-invoking the LLM.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [How It Works](#how-it-works)
- [API Reference](#api-reference)
- [Model Switcher](#model-switcher)
- [Caching](#caching)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Prerequisites

Before getting started, make sure you have the following:

- **Node.js** v18 or higher
- **Wrangler CLI** — `npm install -g wrangler`
- **Cloudflare account** with Workers and Pages enabled
- **GitHub personal access token** — for Octokit API calls (avoids rate limiting)
- **LLM API keys** — at least one of:
  - OpenAI API key
  - Anthropic API key
  - Google AI API key

---

## Project Structure

```
blinkgit/
├── frontend/                        # Cloudflare Pages (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── RepoInput.tsx        # URL input and submit
│   │   │   ├── OverviewPanel.tsx    # Repo overview display
│   │   │   ├── IssueRanker.tsx      # Ranked issues list
│   │   │   ├── ArchDiagram.tsx      # React Flow diagram
│   │   │   └── ModelSwitcher.tsx    # LLM model selector dashboard
│   │   ├── stores/
│   │   │   └── modelStore.ts        # Zustand store for selected model
│   │   └── App.tsx
│   ├── index.html
│   └── vite.config.ts
│
└── worker/                          # Cloudflare Workers (Hono + AI SDK)
    ├── src/
    │   ├── index.ts                 # Hono app entry point
    │   ├── routes/
    │   │   ├── analyze.ts           # POST /analyze
    │   │   └── models.ts            # GET /models, POST /models
    │   ├── agent/
    │   │   ├── schema.ts            # Zod schemas for AI output
    │   │   ├── github.ts            # Octokit: file tree, issues fetching
    │   │   └── analyze.ts           # streamObject / generateObject logic
    │   └── db/
    │       └── cache.ts             # D1 cache read/write
    └── wrangler.toml
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/blinkgit.git
cd blinkgit
```

### 2. Set up the Worker

```bash
cd worker
npm install
```

Create a `wrangler.toml` (or update the existing one) with your Cloudflare account details, D1 database binding, and KV namespace binding. Then add your secrets:

```bash
wrangler secret put GITHUB_TOKEN
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put GOOGLE_API_KEY
```

Run the worker locally:

```bash
wrangler dev
```

### 3. Set up the Frontend

```bash
cd ../frontend
npm install
```

Create a `.env.local` file:

```
VITE_WORKER_URL=http://localhost:8787
```

Start the dev server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Environment Variables

### Worker (Cloudflare Workers Secrets)

| Variable | Required | Description |
|---|---|---|
| `GITHUB_TOKEN` | Yes | GitHub personal access token for Octokit API calls |
| `OPENAI_API_KEY` | Conditional | Required if using `openai/gpt-4o` |
| `ANTHROPIC_API_KEY` | Conditional | Required if using `anthropic/claude-sonnet-4-5` |
| `GOOGLE_API_KEY` | Conditional | Required if using `google/gemini-1.5-pro` |

At least one LLM API key must be provided. Secrets are set via `wrangler secret put <KEY>` and are never stored in `wrangler.toml`.

### Frontend (`.env.local`)

| Variable | Required | Description |
|---|---|---|
| `VITE_WORKER_URL` | Yes | Base URL of the deployed Cloudflare Worker |

---

## How It Works

```
User pastes GitHub URL
        │
        ▼
Frontend (React + Vite)
  POST /analyze { repoUrl, model }
        │
        ▼
Cloudflare Worker (Hono)
  ├── Check D1 cache → return cached result if found
  ├── Octokit: fetch file tree, README, top-level files, open issues
  ├── Build structured prompt with Zod schema
  └── streamObject() via Vercel AI SDK → SSE stream
        │
        ▼
Frontend receives SSE stream (useObject hook)
  ├── Renders OverviewPanel progressively
  ├── Renders IssueRanker with difficulty badges
  └── Renders ArchDiagram from node/edge data via React Flow
```

1. The user pastes a GitHub repo URL into the frontend.
2. The frontend sends `POST /analyze` to the Cloudflare Worker with `{ repoUrl, model }`.
3. The worker first checks the D1 cache — if a result exists, it streams the cached response immediately.
4. On a cache miss, Octokit fetches the repo's file tree, README, key files, and all open issues.
5. The worker calls `streamObject()` from the Vercel AI SDK with a Zod schema and a constructed prompt.
6. The selected LLM returns a structured JSON object streamed back as Server-Sent Events (SSE).
7. The React frontend uses the `useObject()` hook to progressively render each section as data arrives.

### Issue Difficulty Classification

Each open issue is classified into one of three tiers:

| Difficulty | Examples |
|---|---|
| **Beginner** | Good first issues, documentation fixes, simple UI tweaks |
| **Moderate** | Feature additions, non-trivial bug fixes, test coverage |
| **High** | Architectural changes, complex features, deep debugging |

---

## API Reference

### `POST /analyze`

Accepts a GitHub repo URL and streams back a structured analysis.

**Request body:**
```json
{
  "repoUrl": "https://github.com/owner/repo",
  "model": "openai/gpt-4o"
}
```

**Response:** SSE stream of a structured JSON object matching the Zod schema defined in `worker/src/agent/schema.ts`.

---

### `GET /models`

Returns the currently selected LLM model from Cloudflare KV.

**Response:**
```json
{
  "model": "openai/gpt-4o"
}
```

---

### `POST /models`

Updates the selected LLM model in Cloudflare KV.

**Request body:**
```json
{
  "model": "anthropic/claude-sonnet-4-5"
}
```

---

## Model Switcher

BlinkGit supports swapping LLM providers at runtime via a settings dashboard in the UI. The selected model is persisted in Cloudflare KV and read by the worker on each request.

**Supported models:**

| Provider | Model ID |
|---|---|
| OpenAI | `openai/gpt-4o` |
| Anthropic | `anthropic/claude-sonnet-4-5` |
| Google | `google/gemini-1.5-pro` |

Switching models requires no backend code changes. The Vercel AI SDK handles provider abstraction via a model string, making it straightforward to add new providers by installing the corresponding `@ai-sdk/<provider>` adapter.

---

## Caching

Analyzed repositories are cached in **Cloudflare D1** (SQLite at the edge) keyed by repo URL. On repeat lookups:

- The cached result is returned immediately, bypassing the LLM entirely.
- Cache reads and writes are handled in `worker/src/db/cache.ts`.
- The cache can be manually invalidated from the UI to force a fresh analysis.

This keeps response times fast for popular or frequently-visited repositories while avoiding redundant LLM calls.

---

## Tech Stack

### Frontend — Cloudflare Pages

| Library | Purpose |
|---|---|
| React + Vite | SPA framework and build tooling |
| TailwindCSS + shadcn/ui | Styling and UI components |
| TanStack Query | Async data fetching and caching |
| Zustand | Global state management (model switcher) |
| React Flow | Interactive architecture diagram rendering |
| @ai-sdk/react | `useObject` hook for streaming structured AI responses |

### Backend — Cloudflare Workers

| Library | Purpose |
|---|---|
| Hono | Lightweight edge-native HTTP router |
| Vercel AI SDK (`ai`) | Edge-compatible LLM orchestration (`streamObject`, `generateObject`) |
| @ai-sdk/openai, @ai-sdk/anthropic, @ai-sdk/google | Swappable LLM provider adapters |
| @octokit/core | GitHub API client (fetch-based, Worker compatible) |
| Zod | Schema definition and validation for structured AI outputs |
| Cloudflare D1 | SQLite-based cache for repo analysis results |
| Cloudflare KV | Key-value store for model preferences and user config |

---

## Deployment

### Deploy the Worker

```bash
cd worker
wrangler deploy
```

Make sure your `wrangler.toml` has the correct D1 database and KV namespace bindings configured before deploying.

### Deploy the Frontend

```bash
cd frontend
npm run build
wrangler pages deploy dist
```

Or connect the `frontend/` directory to a Cloudflare Pages project via the Cloudflare dashboard for automatic deployments on push.

After deploying the worker, update the `VITE_WORKER_URL` environment variable in your Cloudflare Pages project settings to point to the live worker URL, then redeploy.

---

## Contributing

Contributions are welcome. To get started:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes and commit: `git commit -m 'feat: add your feature'`
4. Push to your fork: `git push origin feat/your-feature`
5. Open a pull request against `main`.

Please keep PRs focused and scoped to a single concern. If you're adding a new LLM provider, install the relevant `@ai-sdk/<provider>` package in the worker and add the model string to the switcher options in `ModelSwitcher.tsx`.

For bug reports and feature requests, open a GitHub issue with as much context as possible.

---

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
