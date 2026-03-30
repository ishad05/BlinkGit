# BlinkGit — Feature Specification

> Source of truth for what the product does and how each feature should behave.
> Used to inform UI design, backend schema, and AI prompt engineering.

---

## 1. Instant Repository Overview

**Trigger:** User pastes a GitHub repo URL and hits Analyze.

**Output sections:**
- **What it does** — 2–3 sentence plain-English summary of the project's purpose
- **Key modules/components** — list of the most important directories or files with one-line descriptions
- **Technologies** — detected stack (languages, frameworks, databases, infra)
- **Purpose & use cases** — who it's for and what problems it solves

**UI:** First thing shown after analysis completes. Card-based layout. Should feel like a README replacement.

---

## 2. AI-Powered Project Explanation

**Trigger:** Generated alongside the overview; presented as a structured narrative.

**Output sections:**
- **Core functionality** — what the system actually does at runtime, not just what it is
- **Major services / modules** — breakdown of each significant piece (e.g. auth service, API layer, worker)
- **Project workflow** — how data or requests flow through the system, end to end

**UI:** Collapsible sections or a flowing document. Emphasis on readability — this is for someone who has never seen the codebase.

---

## 3. Architecture Visualization

**Trigger:** Generated from the AI's understanding of module relationships.

**Output:**
- **Node-edge diagram** — each node is a module/service/file, edges show dependencies or data flow
- **Node types:** Entry, Router, API, Service, UI, Config, Middleware, Database
- **Edge types:** Dependency (solid line), Data flow (dashed), Critical path (green highlight)

**UI:**
- Infinite scrollable canvas with dot-grid background
- Zoom in/out + fit-to-screen controls
- Click a node → highlights its connections, shows detail panel on the right
- Legend for node types and edge types

---

## 4. Installation & Usage Guide

**Trigger:** Extracted from README, package.json, Makefile, Dockerfile etc.

**Output sections:**
- **Prerequisites** — required runtimes, tools, accounts (e.g. Node 20+, Docker, Postgres)
- **Installation steps** — numbered, copy-pasteable commands
- **Environment setup** — required env vars with descriptions (values redacted/placeholder)
- **Run locally** — commands to start dev server / services

**UI:** Terminal-style code blocks for every command. Copy button on each block. Numbered steps. Should feel like a runbook.

---

## 5. Open Issues Explorer

**Trigger:** Fetched live from GitHub API when analysis runs (up to 50 issues).

**Output:**
- Issues grouped by AI-assigned difficulty: **Beginner** → **Moderate** → **High**
- Each issue shows: title, reason for difficulty rating, comment count, days open
- Filters: by difficulty, by label, search by keyword

**Difficulty logic (AI-assigned):**
- **Beginner** — self-contained, well-scoped, clear acceptance criteria, touches few files
- **Moderate** — requires understanding of 2–3 modules, some context needed
- **High** — requires deep codebase knowledge, touches core systems, high risk

**UI:** Filterable list. Each issue row has a left-border color (green/amber/red). Click → opens GitHub issue in new tab. "View on GitHub ↗" link per issue.

---

## 6. AI Contribution Assistant (Chat)

**Trigger:** Always available on the results page after analysis.

**Capabilities:**
- Answers questions about the specific repo (not generic AI)
- Has full context of the repo: file tree, key files, README, architecture graph, issues
- Can reference specific files, line ranges, and module names in answers

**Example queries the AI should handle well:**
- "How can I contribute to this project?"
- "Find issues suitable for someone who knows React but not TypeScript"
- "Where is authentication implemented?"
- "Which files should I read first to understand the data layer?"
- "Explain how a request flows from the frontend to the database"
- "What's the fastest way to run this locally?"

**UI:**
- Chat panel — message bubbles, monospace font for code snippets
- Input bar at bottom with send button
- AI responses can include: plain text, inline code, file references (clickable), issue links
- Persistent within the session (chat history kept while on results page)

---

## Data Flow Summary

```
User pastes URL
    ↓
Backend fetches: file tree (depth 2) + README + 5 key files + open issues (max 50)
    ↓
AI model streams structured output:
    ├── overview      → feeds Features 1 & 2
    ├── architecture  → feeds Feature 3
    ├── setup         → feeds Feature 4
    └── issues        → feeds Feature 5
    ↓
Results page renders progressively as stream arrives
    ↓
Chat (Feature 6) uses the full repo context as its system prompt
```

---

## Navigation Structure (Results Page)

The results page has 6 sections accessible via a left sidebar:

| # | Icon | Label | Feature |
|---|---|---|---|
| 1 | ⊙ | Overview | Features 1 + 2 |
| 2 | ⬡ | Architecture | Feature 3 |
| 3 | $ | Setup | Feature 4 |
| 4 | # | Issues | Feature 5 |
| 5 | ~ | Chat | Feature 6 |

---

## Backend Schema Changes Needed

Current schema covers: `overview`, `issues`, `architecture`.
New fields to add:

```ts
setup: z.object({
  prerequisites: z.array(z.string()),
  steps: z.array(z.object({ label: z.string(), command: z.string() })),
  envVars: z.array(z.object({ key: z.string(), description: z.string() })),
  runCommand: z.string(),
})

// overview extended:
overview: z.object({
  purpose: z.string(),
  techStack: z.array(z.string()),
  keyFiles: z.array(z.string()),
  highlights: z.array(z.string()),
  useCases: z.array(z.string()),        // NEW
  coreWorkflow: z.string(),              // NEW — narrative explanation
  majorModules: z.array(z.object({       // NEW
    name: z.string(),
    description: z.string(),
    type: z.enum(['service','ui','api','config','database','middleware','util']),
  })),
})
```
