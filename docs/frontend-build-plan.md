# BlinkGit — Frontend Build Plan

> Reference doc for the full frontend implementation roadmap.
> Updated as steps are completed.

---

## Step 0 — Foundation: Reusable Components ✅

Build small, composable pieces first. Every page section uses these.

| Sub-step | Component | File | Status |
|---|---|---|---|
| 0a | Install shadcn primitives | `button`, `input`, `badge`, `card`, `separator`, `tooltip` | ✅ Done |
| 0b | `<Logo />` | `src/components/ui/logo.tsx` | ✅ Done |
| 0c | `<StatusPill />` | `src/components/ui/status-pill.tsx` | ✅ Done |
| 0d | `<DifficultyBadge />` | `src/components/ui/difficulty-badge.tsx` | ✅ Done |
| 0e | `<TerminalInput />` | `src/components/ui/terminal-input.tsx` | ✅ Done |
| 0f | `<TechTag />` | `src/components/ui/tech-tag.tsx` | ✅ Done |

### Component notes

- **Logo** — SVG wordmark with `sm / md / lg` size prop. Uses `fill-foreground` / `fill-muted-foreground` so it adapts to any background.
- **StatusPill** — Dot + label badge. Variants: `live` (green), `streaming` (amber), `cached` (muted), `default`.
- **DifficultyBadge** — Outlined, uppercase badge. `beginner` = green, `moderate` = amber, `high` = red. Maps directly to the Zod schema `difficulty` enum.
- **TerminalInput** — Wraps `<input>` with a `❯` prompt prefix, `https://github.com/` hint text, green `caret-green-500`. Exposes `containerClassName` for border composition.
- **TechTag** — Muted monospace chip for tech stack labels.

---

## Step 1 — Page Sections (top → bottom) ✅

| Sub-step | Component | File | Status |
|---|---|---|---|
| 1a | `<Navbar />` | `src/components/Navbar.tsx` | ✅ Done |
| 1b | `<HeroSection />` | `src/components/HeroSection.tsx` | ✅ Done |
| 1c | `<FeatureStrip />` | `src/components/FeatureStrip.tsx` | ✅ Done |
| 1d | `<HowItWorks />` | `src/components/HowItWorks.tsx` | ✅ Done |
| 1e | `<Footer />` | `src/components/Footer.tsx` | ✅ Done |
| 1f | Wire into `App.tsx` | `src/App.tsx` | ✅ Done |

### Section notes

- **Navbar** — Sticky, backdrop-blur. Logo left, `How it works` + `Docs` links + `View Source ↗` button right. All GitHub links sourced from `src/lib/constants.ts`.
- **HeroSection** — Status badges row → 56px bold headline with green cursor `_` → sub-copy → `TerminalInput` + `Analyze →` CTA → try-pills (example repos). Accepts `onSubmit` and `isLoading` props; bare `owner/repo` input is auto-prefixed to full URL.
- **FeatureStrip** — 3-column grid: Architecture Diagram / Ranked Issues / Codebase Overview. Collapses to stacked on mobile.
- **HowItWorks** — Numbered steps `01 / 02 / 03` with green connector lines. Each step has an inline visual (terminal prompt, model tags, status pill).
- **Footer** — Logo + description + FOSS Hack 2025 badge left. `PROJECT` links + `STACK` links columns right. Copyright bar at the bottom.

### Shared conventions established
- All GitHub links in one place: `src/lib/constants.ts`
- `dark` class on root `<div>` — dark mode is default
- `TooltipProvider` wraps the whole app in `App.tsx`
- `max-w-[800px]` content column throughout (tablet + desktop)

---

## Step 2 — Results Area ⬜

Shown below the hero after the user submits a repo URL. All three panels receive partial data while streaming — they should render progressively, not wait for the full response.

| Sub-step | Component | File | Status |
|---|---|---|---|
| 2a | `<OverviewPanel />` | `src/components/OverviewPanel.tsx` | ⬜ TODO |
| 2b | `<IssueRanker />` | `src/components/IssueRanker.tsx` | ⬜ TODO |
| 2c | `<ArchDiagram />` | `src/components/ArchDiagram.tsx` | ⬜ TODO |

### Data shape (from `src/agent/schema.ts` on the backend)

```ts
overview: {
  purpose: string
  techStack: string[]
  keyFiles: string[]
  highlights: string[]
}

issues: Array<{
  title: string
  url: string
  difficulty: "beginner" | "moderate" | "high"
  reason: string
}>

architecture: {
  nodes: Array<{ id: string; label: string; type: string }>
  edges: Array<{ from: string; to: string; label?: string }>
}
```

### Implementation notes

**OverviewPanel**
- Card with section header + `StatusPill` showing cached/live state
- `purpose` as body text
- `techStack` rendered as `<TechTag />` chips
- `keyFiles` as a monospace list with file-path styling
- `highlights` as a bullet list
- Skeleton placeholders while `overview` is `undefined`

**IssueRanker**
- Scrollable list; each row: `<DifficultyBadge />` + title (external link) + reason text
- Group or sort by difficulty: beginner → moderate → high
- Skeleton rows while `issues` is `undefined`

**ArchDiagram**
- Uses `@xyflow/react` (already installed)
- Convert `DiagramNode[]` → ReactFlow `Node[]` with auto x/y positioning (dagre or simple grid)
- Convert `DiagramEdge[]` → ReactFlow `Edge[]` (map `from/to` → `source/target`)
- Custom dark-themed node component matching the design system
- Placeholder "waiting for analysis…" state when `architecture` is `undefined`

---

## Step 3 — Wiring & State ⬜

| Sub-step | Task | File | Status |
|---|---|---|---|
| 3a | `<ModelSwitcher />` | `src/components/ModelSwitcher.tsx` | ⬜ TODO |
| 3b | `useAnalysis` streaming hook | `src/hooks/useAnalysis.ts` | ⬜ TODO |
| 3c | Full `App.tsx` composition | `src/App.tsx` | ⬜ TODO |

### Implementation notes

**ModelSwitcher (3a)**
- Install shadcn `select` component
- Available models hardcoded to match backend: `openai/gpt-4o`, `anthropic/claude-sonnet-4-5`, `google/gemini-1.5-pro`
- `GET /models` on mount via React Query → sets initial selection
- `POST /models` on change via React Query mutation → updates DB + Zustand store
- Compact dropdown that lives in the Navbar (right of the View Source button) or above the results area

**useAnalysis hook (3b)**
- Uses `useObject` from `@ai-sdk/react`
- Points to `POST /analyze` via `VITE_BACKEND_URL` env var
- Frontend Zod schema mirrors the backend schema (or import shared types)
- Returns `{ object, submit, isLoading, error, stop }`
- `object` is the partial streamed result — panels read from it progressively

**App.tsx full wiring (3c)**
- Four UI states: `idle` | `loading` | `streaming` | `error`
- `idle` → only hero + feature strip + how-it-works + footer visible
- `loading/streaming` → results section slides in below hero; OverviewPanel, IssueRanker, ArchDiagram rendered with whatever partial data exists
- `error` → inline error message with retry option
- `isLoading` passed down to `HeroSection` to disable the input + show "Analyzing…" on the button
- ModelSwitcher rendered in Navbar

---

## Design System Reference

The design was created in Paper (desktop design tool). Key tokens:

| Token | Value |
|---|---|
| Background | `oklch(0.145 0 0)` · `#1C1C1C` |
| Foreground | `oklch(0.985 0 0)` · `#F7F7F7` |
| Card | `oklch(0.205 0 0)` · `#292929` |
| Muted foreground | `oklch(0.708 0 0)` · `#8F8F8F` |
| Terminal accent | `#22C55E` (custom, not in shadcn tokens) |
| Destructive | `oklch(0.704 0.191 22.2)` · `#E5534B` |
| Border radius | `0rem` — sharp corners everywhere |
| Font | Geist Mono (monospace-first) |

---

## File Map

```
frontend/src/
├── App.tsx                          # Root composition
├── index.css                        # Tailwind v4 + theme tokens + @keyframes blink
├── lib/
│   ├── constants.ts                 # GITHUB_URL and derived URLs
│   └── utils.ts                     # cn() utility
├── stores/
│   └── modelStore.ts                # Zustand — selected model string
├── hooks/
│   └── useAnalysis.ts               # (Step 3b) streaming hook
├── components/
│   ├── Navbar.tsx
│   ├── HeroSection.tsx
│   ├── FeatureStrip.tsx
│   ├── HowItWorks.tsx
│   ├── Footer.tsx
│   ├── OverviewPanel.tsx            # (Step 2a)
│   ├── IssueRanker.tsx              # (Step 2b)
│   ├── ArchDiagram.tsx              # (Step 2c)
│   ├── ModelSwitcher.tsx            # (Step 3a)
│   └── ui/
│       ├── logo.tsx
│       ├── status-pill.tsx
│       ├── difficulty-badge.tsx
│       ├── terminal-input.tsx
│       ├── tech-tag.tsx
│       ├── button.tsx               # shadcn
│       ├── input.tsx                # shadcn
│       ├── badge.tsx                # shadcn
│       ├── card.tsx                 # shadcn
│       ├── separator.tsx            # shadcn
│       └── tooltip.tsx              # shadcn
└── ...
```
