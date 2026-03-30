---
name: frontend-integration
description: Guidelines for making changes to the BlinkGit frontend from the backend team. Use this before touching any frontend file — covers design system, component patterns, state management, adding new API calls, and adding new sidebar tabs.
---

# BlinkGit Frontend Integration Guide

Use this skill before making any change to the `frontend/` directory.

## How to use

- `/frontend-integration`
  Load these rules before writing or editing any frontend code.

- `/frontend-integration <task>`
  Apply these rules to the specific task described.

---

## Package Manager

**Always use `pnpm`**, never `npm` or `yarn`.

```bash
cd frontend
pnpm install          # install deps
pnpm add <pkg>        # add a new dependency
pnpm run dev          # dev server
pnpm run build        # production build
```

---

## Design System — Non-Negotiable

All UI must follow these tokens exactly. They are defined in `src/index.css`.

### Colors
| Token | Value | Use for |
|-------|-------|---------|
| `bg-background` | `#1C1C1C` | Page background |
| `bg-card` | `#292929` | Panel / card backgrounds |
| `text-foreground` | `#F7F7F7` | Primary text |
| `text-muted-foreground` | `#8F8F8F` | Secondary / label text |
| `text-green-400` / `#22C55E` | Terminal green | Accents, active states, icons |
| `text-destructive` | `#E5534B` | Errors, high difficulty |
| `text-amber-400` | `#F59E0B` | Moderate difficulty, warnings |

### Typography
- **Font**: Geist Mono everywhere — this is a monospace-first UI, not a prose UI.
- Use `text-xs` for labels and metadata, `text-sm` for body, `text-base` for headings.
- Use `font-mono` class if Geist Mono is not inheriting.
- No italic text. No serif fonts.

### Borders & Radius
- **Border radius is `0rem`** — all corners are sharp. Never use `rounded-*` utilities.
- Use `border border-white/10` for subtle card borders.
- Use `border-l-2 border-green-400` for active/highlighted left-border accents.

### Spacing
- Prefer `p-4`, `p-6`, `gap-4` — multiples of 4.
- Panel headers use `px-4 py-3 border-b border-white/10`.

---

## Component Conventions

### Use shadcn/ui primitives first
Before writing any UI from scratch, check `src/components/ui/` for existing primitives:
- `Button`, `Input`, `Badge`, `Card`, `Separator`, `Tooltip` are already installed.
- Import from `@/components/ui/<name>`.

### Reusable UI atoms
These live in `src/components/ui/` — use them, do not re-implement:
- `<Logo />` — BlinkGit wordmark (sizes: `sm` | `md` | `lg`)
- `<StatusPill />` — status badge (`live` | `streaming` | `cached`)
- `<DifficultyBadge />` — difficulty label (`beginner` | `moderate` | `high`)
- `<TerminalInput />` — URL input with `❯` prompt
- `<TechTag />` — monospace chip for tech stack items

### Skeleton loading states
Every panel that receives streamed data **must** render skeleton placeholders while
`isStreaming` is true. Use `bg-white/5 animate-pulse` for skeleton blocks. See
`OverviewPanel.tsx` for the established pattern.

### Icons
Use `lucide-react` for all icons. Keep icon sizes at `h-3.5 w-3.5` for inline and
`h-4 w-4` for standalone.

---

## State Management

### TanStack Query — for all server/async state
```ts
import { useQuery, useMutation } from '@tanstack/react-query'
const backendUrl = import.meta.env.VITE_BACKEND_URL
```

- Never use raw `fetch` directly in components for GET requests — wrap in `useQuery`.
- For mutations (POST, DELETE), use `useMutation`.
- Do not call `useQueryClient().invalidateQueries` without a reason — prefer optimistic
  updates for fast UI.

### Zustand — only for global UI state
The only Zustand store is `src/stores/modelStore.ts` (`selectedModel`). Do not add new
Zustand stores unless you have global, cross-component UI state that cannot live in a
query. Prefer `useState` / `useReducer` for local component state.

### Streaming data
The `useAnalysis` hook (`src/hooks/useAnalysis.ts`) uses `experimental_useObject` from
`@ai-sdk/react`. It returns partial data as the stream arrives. All panels receive
`isStreaming: boolean` and `data: Partial<AnalysisData>` — always handle the case where
`data` or any nested field is `undefined`.

---

## Adding a New API Call

1. Add the fetch logic as a named function in a `src/hooks/use<Feature>.ts` file.
2. Use `VITE_BACKEND_URL` for the base URL — never hardcode localhost.
3. Wrap the call in `useQuery` or `useMutation`.

Example pattern for a `DELETE /cache` call:

```ts
// src/hooks/useInvalidateCache.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useInvalidateCache() {
  const backendUrl = import.meta.env.VITE_BACKEND_URL
  return useMutation({
    mutationFn: (repoUrl: string) =>
      fetch(`${backendUrl}/cache`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl }),
      }).then(r => { if (!r.ok) throw new Error('Failed') }),
  })
}
```

---

## Adding a New Sidebar Tab

The sidebar is defined in `src/components/ResultsSidebar.tsx` and the tab content is
rendered in `src/components/ResultsPage.tsx`. The `AnalysisData` type lives at the top
of `ResultsPage.tsx`.

Steps to add a new tab (e.g., "Code Search"):

1. **Add the tab to `ResultsSidebar.tsx`**
   - Add a new entry to the `tabs` array: `{ id: 'search', label: 'SEARCH', icon: Search }`.
   - Import the icon from `lucide-react`.

2. **Update the `Tab` type in `ResultsPage.tsx`**
   - Add the new id to the union: `type Tab = 'overview' | 'arch' | ... | 'search'`

3. **Create the panel component** `src/components/SearchPanel.tsx`
   - Accept `{ data, isStreaming }` props (same pattern as all other panels).
   - Follow the panel layout convention: outer `div` with `overflow-y-auto`, inner
     `div` with `p-6 space-y-6`.

4. **Render it in `ResultsPage.tsx`**
   - Add a branch in the tab content renderer: `activeTab === 'search' && <SearchPanel ... />`

---

## File Locations

```
frontend/src/
├── App.tsx                   # Root — state machine (idle ↔ results)
├── index.css                 # Design tokens (CSS variables)
├── components/
│   ├── ResultsPage.tsx       # Shell + tab router + AnalysisData type
│   ├── ResultsSidebar.tsx    # Tab nav
│   ├── [Panel].tsx           # One file per tab panel
│   ├── ModelSwitcher.tsx     # Model selector
│   └── ui/                   # Reusable atoms (never edit unless fixing bugs)
├── hooks/
│   └── useAnalysis.ts        # Streaming hook (do not modify the schema mirror)
├── stores/
│   └── modelStore.ts         # Zustand: selectedModel only
└── lib/
    ├── constants.ts          # GITHUB_URL
    └── utils.ts              # cn() — Tailwind class merging
```

---

## What NOT to Do

- Never add custom CSS files. Use Tailwind utilities only.
- Never use `rounded-*` — border radius is `0rem` everywhere.
- Never hardcode `http://localhost:3000` — always use `VITE_BACKEND_URL`.
- Never add `console.log` to production code.
- Never import from `@ai-sdk/react` outside of `useAnalysis.ts` — all streaming
  logic is encapsulated there.
- Never modify `src/agent/schema.ts` on the backend without updating the schema
  mirror in `useAnalysis.ts` on the frontend — they must stay in sync.
- Never use `npm` or `yarn` — this repo uses `pnpm`.
