# BlinkGit

![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=white)
![Railway](https://img.shields.io/badge/Backend-Railway%20%2B%20Node.js-0B0D0E?logo=railway&logoColor=white)
![AI SDK](https://img.shields.io/badge/Powered%20by-Vercel%20AI%20SDK-000000?logo=vercel&logoColor=white)

**Live demo: [https://blinkgit.pages.dev/](https://blinkgit.pages.dev/)**

BlinkGit is a GitHub repository intelligence tool. Paste any public GitHub repo URL and get an instant, AI-powered analysis — including an interactive architecture diagram, a ranked list of open issues by difficulty, and a high-level overview of the project.

---

## Features

- **Architecture Diagram** — Analyzes the repository file tree and generates an interactive node/edge diagram rendered with React Flow.
- **Issue Ranker** — Fetches all open GitHub issues and classifies them into Beginner, Moderate, and High difficulty.
- **Repo Overview** — Summarizes the project's purpose, tech stack, key files, and highlights.
- **Multi-model Support** — Swap between OpenAI, Anthropic, and Google LLM providers from the UI with zero backend code changes.
- **Result Caching** — Analyzed repos are cached in PostgreSQL; repeat lookups return instantly without re-invoking the LLM.

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

- **Node.js** v20 or higher
- **PostgreSQL** — local instance for development (Railway provides one in production)
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
│   │   │   └── ModelSwitcher.tsx    # LLM model selector
│   │   ├── stores/
│   │   │   └── modelStore.ts        # Zustand store for selected model
│   │   └── App.tsx
│   ├── .env.example
│   └── vite.config.ts
│
└── backend/                         # Railway (Hono + Node.js + AI SDK)
    ├── src/
    │   ├── index.ts                 # Hono app entry point
    │   ├── routes/
    │   │   ├── analyze.ts           # POST /analyze
    │   │   └── models.ts            # GET /models, POST /models
    │   ├── agent/
    │   │   ├── schema.ts            # Zod schemas for AI output
    │   │   ├── github.ts            # Octokit: file tree, issues fetching
    │   │   └── analyze.ts           # streamObject logic
    │   └── db/
    │       ├── cache.ts             # PostgreSQL cache read/write
    │       └── models.ts            # Model config read/write
    ├── .env.example
    └── tsconfig.json
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ishad05/BlinkGit.git
cd BlinkGit
```

### 2. Set up the backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in your values in .env
npm run dev
```

The backend starts at `http://localhost:3000`.

### 3. Set up the frontend

```bash
cd ../frontend
npm install
cp .env.example .env.local
# VITE_BACKEND_URL=http://localhost:3000 (already set in .env.example)
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Environment Variables

### Backend (`.env` / Railway dashboard)

| Variable | Required | Description |
|---|---|---|
| `GITHUB_TOKEN` | Yes | GitHub personal access token for Octokit API calls |
| `OPENAI_API_KEY` | Conditional | Required if using `openai/gpt-4o` |
| `ANTHROPIC_API_KEY` | Conditional | Required if using `anthropic/claude-*` |
| `GOOGLE_API_KEY` | Conditional | Required if using `google/gemini-*` |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | No | Server port (defaults to 3000; Railway sets this automatically) |

At least one LLM API key must be provided.

### Frontend (`.env.local`)

| Variable | Required | Description |
|---|---|---|
| `VITE_BACKEND_URL` | Yes | Base URL of the deployed backend |

---

## How It Works

```
User pastes GitHub URL
        │
        ▼
Frontend (React + Vite)
  POST /analyze { repoUrl }
        │
        ▼
Backend (Hono + Node.js on Railway)
  ├── Check PostgreSQL cache → return cached result if found
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
2. The frontend sends `POST /analyze` to the backend.
3. The backend checks the PostgreSQL cache — if a result exists, it returns it immediately.
4. On a cache miss, Octokit fetches the repo's file tree (top 2 levels), README, key files, and open issues.
5. The backend calls `streamObject()` from the Vercel AI SDK with a Zod schema and a constructed prompt.
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
  "repoUrl": "https://github.com/owner/repo"
}
```

**Response:** SSE stream of a structured JSON object matching the Zod schema in `backend/src/agent/schema.ts`.

---

### `GET /models`

Returns the currently selected LLM model.

**Response:**
```json
{
  "model": "openai/gpt-4o"
}
```

---

### `POST /models`

Updates the selected LLM model.

**Request body:**
```json
{
  "model": "anthropic/claude-sonnet-4-5"
}
```

---

## Model Switcher

BlinkGit supports swapping LLM providers at runtime from the UI. The selected model is persisted in PostgreSQL and read by the backend on each request.

**Supported models:**

| Provider | Model ID |
|---|---|
| OpenAI | `openai/gpt-4o` |
| Anthropic | `anthropic/claude-sonnet-4-5` |
| Google | `google/gemini-1.5-pro` |

Adding a new provider requires installing the corresponding `@ai-sdk/<provider>` package in the backend.

---

## Caching

Analyzed repositories are cached in **PostgreSQL** keyed by repo URL. On repeat lookups:

- The cached result is returned immediately, bypassing the LLM entirely.
- Cache reads and writes are handled in `backend/src/db/cache.ts`.

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

### Backend — Railway (Node.js)

| Library | Purpose |
|---|---|
| Hono + @hono/node-server | Lightweight HTTP router on Node.js |
| Vercel AI SDK (`ai`) | LLM orchestration (`streamObject`) |
| @ai-sdk/openai, @ai-sdk/anthropic, @ai-sdk/google | Swappable LLM provider adapters |
| @octokit/core | GitHub API client |
| Zod | Schema definition and validation for structured AI outputs |
| postgres | PostgreSQL client for cache and model config |

---

## Deployment

### Deploy the backend to Railway

1. Create a new Railway project and add a PostgreSQL service.
2. Connect your GitHub repo — Railway auto-detects Node.js and runs `npm run start`.
3. Set environment variables in the Railway dashboard (see [Environment Variables](#environment-variables)).
4. `DATABASE_URL` is injected automatically by Railway from the PostgreSQL service.

### Deploy the frontend to Cloudflare Pages

```bash
cd frontend
npm run build
npx wrangler pages deploy dist
```

Or connect the `frontend/` directory to a Cloudflare Pages project for automatic deployments on push. Set `VITE_BACKEND_URL` in the Pages project environment settings to your Railway backend URL.

---

## Contributing

Contributions are welcome. To get started:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes and commit: `git commit -m 'feat: add your feature'`
4. Push to your fork: `git push origin feat/your-feature`
5. Open a pull request against `main`.

Please keep PRs focused and scoped to a single concern.

---

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
