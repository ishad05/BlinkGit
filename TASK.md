# BlinkGit — Implementation Task Tracker

> Session-portable task list. When picking up in a new session, read this file first, then read `docs/features.md` and `docs/frontend-build-plan.md` for full context.
> Update status inline as tasks complete: ⬜ TODO → 🔄 IN PROGRESS → ✅ DONE

---

## Current State (as of session end)

### Done
- ✅ Step 0 — All reusable UI components (`Logo`, `StatusPill`, `DifficultyBadge`, `TerminalInput`, `TechTag`, shadcn primitives)
- ✅ Step 1 — All landing page sections (`Navbar`, `HeroSection`, `FeatureStrip`, `HowItWorks`, `Footer`) wired into `App.tsx`
- ✅ `src/lib/constants.ts` — GitHub URL centralised
- ✅ `docs/features.md` — Full feature spec (6 features)
- ✅ `docs/frontend-build-plan.md` — Full frontend roadmap
- ✅ Paper designs — Results page in 4 views: Overview, Architecture, Issues, Chat
- ✅ HeroSection paste handler — auto-extracts `owner/repo` from GitHub URLs, shows error for invalid URLs
- ✅ **B1–B4** — Backend schema extended (`setup`, `useCases`, `coreWorkflow`, `majorModules`), `streamObject` replaces broken `streamText+Output.object`, prompt updated, cache serialization unchanged
- ✅ **F1** — `ResultsPage` shell (top navbar with logo/repo/status/ModelSwitcher/New Analysis, `ResultsSidebar`, tabbed main area)
- ✅ **F2a–F2g** — `OverviewPanel` (purpose, tech tags, key files + use cases 2-col, major modules with type badges, collapsible core workflow, skeletons)
- ✅ **F3a–F3i** — `ArchDiagram` (ReactFlow, topological layer layout, custom nodes, edge style inference, toolbar with fit/zoom, dot-grid background, legend)
- ✅ **F4a–F4g** — `SetupPanel` (prerequisites, numbered steps, env vars table, run command, terminal blocks with copy-to-clipboard, skeletons)
- ✅ **F5a–F5f** — `IssueRanker` (filter pills, keyword search, grouped by difficulty with colored borders, skeletons)
- ✅ **F6a–F6h** — `ChatPanel` (custom fetch+ReadableStream, streaming assistant replies, auto-scroll, Enter to send) + `POST /chat` backend route
- ✅ **W1** — `ModelSwitcher` (GET /models syncs Zustand store, POST /models via TanStack mutation, styled native select)
- ✅ **W2** — `useAnalysis` hook (`experimental_useObject` from `@ai-sdk/react`, Zod schema mirrors backend, progressive partial typing)
- ✅ **W3** — `App.tsx` fully wired (idle → ResultsPage on submit, error banner, stop on new analysis)

### Not Started / Remaining
- ⬜ End-to-end testing with a real GitHub repo + real backend env vars
- ⬜ `embeddings.ts` pre-existing TS errors (unrelated to our work, needs `@google/generative-ai` types)
- ⬜ ChatPanel: markdown rendering for AI responses (inline code, links)
- ⬜ ArchDiagram: click-to-highlight node connections + right-side detail panel (Feature 3 stretch goal)
- ⬜ Deploy — frontend to Cloudflare Pages, backend to Railway

---

## Backend: Schema Extension

| # | Task | File | Status |
|---|---|---|---|
| B1 | Add `setup` object to schema | `backend/src/agent/schema.ts` | ✅ |
| B2 | Extend `overview` with `useCases`, `coreWorkflow`, `majorModules` | `backend/src/agent/schema.ts` | ✅ |
| B3 | Update AI prompt in `analyze.ts` to instruct model on new fields | `backend/src/agent/analyze.ts` | ✅ |
| B4 | Update DB cache to handle new fields (serialization) | `backend/src/db/cache.ts` | ✅ (no-op — JSON/jsonb handles it automatically) |

---

## Frontend: Results Page

### Shell & Navigation

| # | Task | File | Status |
|---|---|---|---|
| F1 | `<ResultsPage />` layout shell | `src/components/ResultsPage.tsx` | ✅ |

---

### Screen 1 — Overview (Features 1 + 2)

| # | Task | Status |
|---|---|---|
| F2a | Section header + `cached`/`live` StatusPill | ✅ |
| F2b | Repo title + `purpose` paragraph | ✅ |
| F2c | `techStack` rendered as `<TechTag />` chips | ✅ |
| F2d | Two-column row: `keyFiles` list (left) + `useCases` bullet list (right) | ✅ |
| F2e | `majorModules` list — each row has name, description, type badge | ✅ |
| F2f | `coreWorkflow` narrative paragraph (collapsible) | ✅ |
| F2g | Skeleton placeholders while `overview` is `undefined` | ✅ |

---

### Screen 2 — Architecture (Feature 3)

| # | Task | Status |
|---|---|---|
| F3a | Install/confirm `@xyflow/react` (already in package.json) | ✅ |
| F3b | Canvas toolbar: `ARCHITECTURE` label · node/edge count · `fit` / `−` / `+` controls | ✅ |
| F3c | Convert `DiagramNode[]` → ReactFlow `Node[]` with auto layout (topological layers) | ✅ |
| F3d | Convert `DiagramEdge[]` → ReactFlow `Edge[]` (`from/to` → `source/target`) | ✅ |
| F3e | Custom dark node component — type label, node label | ✅ |
| F3f | Edge styles: solid = dependency, dashed = data flow (inferred from label verb) | ✅ |
| F3g | Legend bar at bottom: dependency / data flow / entry point | ✅ |
| F3h | Dot-grid background (`BackgroundVariant.Dots`) | ✅ |
| F3i | Placeholder "waiting for analysis…" state when `architecture` is `undefined` | ✅ |

---

### Screen 3 — Setup (Feature 4)

| # | Task | Status |
|---|---|---|
| F4a | Section header | ✅ |
| F4b | `prerequisites` — bulleted list with `›` prefix | ✅ |
| F4c | `steps` — numbered list; each step has a label + terminal code block with copy button | ✅ |
| F4d | `envVars` — two-column table: `KEY` (green monospace) + description | ✅ |
| F4e | `runCommand` — single prominent terminal block at the bottom | ✅ |
| F4f | Copy-to-clipboard button on every code block | ✅ |
| F4g | Skeleton placeholders while `setup` is `undefined` | ✅ |

---

### Screen 4 — Issues (Feature 5)

| # | Task | Status |
|---|---|---|
| F5a | Toolbar: `ISSUES` label · open count · filter pills · search input | ✅ |
| F5b | Active filter pill highlights in its difficulty color | ✅ |
| F5c | Group issues under `BEGINNER` / `MODERATE` / `HIGH` section headers with count | ✅ |
| F5d | Issue row: colored left border + title (link) + reason text + comment count + days open | ✅ |
| F5e | Keyword search filters displayed list client-side | ✅ |
| F5f | Skeleton rows while `issues` is `undefined` | ✅ |

---

### Screen 5 — Chat (Feature 6)

| # | Task | Status |
|---|---|---|
| F6a | Chat header: `AI CONTRIBUTION ASSISTANT` label · context summary pill | ✅ |
| F6b | Message list: user messages right-aligned (glass bg), AI messages left-aligned (green-tinted) | ✅ |
| F6c | AI response supports plain text (markdown rendering is a stretch goal) | ✅ |
| F6d | Custom fetch+ReadableStream replaces `useChat` (v3 API incompatible) | ✅ |
| F6e | Input bar: `❯` prompt + placeholder + green `Send →` button | ✅ |
| F6f | Submit on Enter (not Shift+Enter) | ✅ |
| F6g | Auto-scroll to bottom on new message | ✅ |
| F6h | Backend: `POST /chat` route streams via `toTextStreamResponse()` | ✅ |

---

## Frontend: Wiring (Step 3)

| # | Task | File | Status |
|---|---|---|---|
| W1 | `<ModelSwitcher />` component | `src/components/ModelSwitcher.tsx` | ✅ |
| W2 | `useAnalysis` streaming hook | `src/hooks/useAnalysis.ts` | ✅ |
| W3 | Full `App.tsx` composition — idle / streaming / error states | `src/App.tsx` | ✅ |

---

## Key Notes for Next Session

### API version quirks
- `@ai-sdk/react` is v3.0.143 — `useObject` is exported as `experimental_useObject`
- `useChat` v3 changed API entirely (uses `Chat` class + transport); we bypass it with a raw fetch+stream reader in `ChatPanel`
- Backend `ai` package is v4.3.19 (installed) despite `^6.0.138` in package.json — `streamObject` works, `Output.object` from v5+ does not
- `zod` v4 is installed on the frontend; `@ai-sdk/react` handles both v3 and v4 via `isZod4Schema`

### Cache hit behavior
- `/analyze` returns `application/json` for cache hits, `text/plain` stream for live
- `useObject` handles both (reads stream; complete JSON in one chunk also works)

### Known pre-existing issues (not introduced by us)
- `backend/src/agent/embeddings.ts` has 2 TS errors: missing `@google/generative-ai` types + implicit `any`

---

## Key Files Reference

| File | Role |
|---|---|
| `backend/src/agent/schema.ts` | Zod schema — single source of truth for AI output shape |
| `backend/src/agent/analyze.ts` | `streamObject` call + prompt |
| `backend/src/db/cache.ts` | PostgreSQL cache read/write |
| `backend/src/routes/chat.ts` | `POST /chat` — streams AI response as plain text |
| `frontend/src/App.tsx` | Root composition + UI state machine |
| `frontend/src/hooks/useAnalysis.ts` | `experimental_useObject` streaming hook |
| `frontend/src/components/ResultsPage.tsx` | Shell layout + shared `AnalysisData` types |
| `frontend/src/components/ResultsSidebar.tsx` | 5-tab sidebar nav |
| `frontend/src/components/OverviewPanel.tsx` | Overview tab |
| `frontend/src/components/ArchDiagram.tsx` | Architecture tab (ReactFlow) |
| `frontend/src/components/SetupPanel.tsx` | Setup tab |
| `frontend/src/components/IssueRanker.tsx` | Issues tab |
| `frontend/src/components/ChatPanel.tsx` | Chat tab |
| `frontend/src/components/ModelSwitcher.tsx` | Model selector in ResultsPage navbar |
| `frontend/src/stores/modelStore.ts` | Zustand store for selected model string |
| `frontend/src/lib/constants.ts` | GitHub URL + any shared constants |
| `docs/features.md` | Full product feature spec |
| `docs/frontend-build-plan.md` | Frontend component roadmap (Steps 0–3) |

---

## Design Reference

All designs are in the Paper file **BlinkGit** (Page 1). Artboards:

| Artboard | ID | What it shows |
|---|---|---|
| BlinkGit — Results Page | EB-0 | Overview tab (default view) |
| BlinkGit — Results: Architecture | NJ-0 | Architecture tab |
| BlinkGit — Results: Issues | QA-0 | Issues tab |
| BlinkGit — Results: Chat | TI-0 | Chat tab |
| BlinkGit — Hero Page | 9X-0 | Landing page (already implemented) |
| BlinkGit — Design System | 4-0 | Color tokens, typography scale |

**Design tokens (match exactly):**
- Background: `#1C1C1C`
- Card/surface: `#292929`
- Foreground: `#F7F7F7`
- Muted: `#8F8F8F`
- Accent (terminal green): `#22C55E`
- Destructive: `#E5534B`
- Amber (moderate): `#F59E0B`
- Border radius: `0rem` — sharp corners everywhere
- Font: `Geist Mono` throughout
