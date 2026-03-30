import { useState } from "react";
import { Search } from "lucide-react";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import { cn } from "@/lib/utils";
import type { Issue } from "@/components/ResultsPage";

type Difficulty = "beginner" | "moderate" | "high";

const DIFFICULTY_ORDER: Difficulty[] = ["beginner", "moderate", "high"];

const BORDER_COLORS: Record<Difficulty, string> = {
  beginner: "border-l-green-500",
  moderate: "border-l-amber-500",
  high:     "border-l-[#E5534B]",
};

const FILTER_ACTIVE: Record<Difficulty, string> = {
  beginner: "border-green-500 text-green-500 bg-green-500/10",
  moderate: "border-amber-500 text-amber-500 bg-amber-500/10",
  high:     "border-[#E5534B] text-[#E5534B] bg-[#E5534B]/10",
};

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-white/5", className)} />;
}

interface IssueRankerProps {
  issues: Issue[] | undefined;
}

export function IssueRanker({ issues }: IssueRankerProps) {
  const [activeFilter, setActiveFilter] = useState<Difficulty | null>(null);
  const [query, setQuery] = useState("");

  const filtered = (issues ?? []).filter((issue) => {
    if (activeFilter && issue.difficulty !== activeFilter) return false;
    if (query && !issue.title.toLowerCase().includes(query.toLowerCase()))
      return false;
    return true;
  });

  const grouped = DIFFICULTY_ORDER.reduce<Record<Difficulty, Issue[]>>(
    (acc, d) => {
      acc[d] = filtered.filter((i) => i.difficulty === d);
      return acc;
    },
    { beginner: [], moderate: [], high: [] },
  );

  return (
    <div className="max-w-4xl space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground">
          ISSUES
        </span>
        <span className="font-mono text-[11px] text-foreground/40">
          {issues?.length ?? "—"} open
        </span>

        <div className="ml-2 flex gap-2">
          {DIFFICULTY_ORDER.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setActiveFilter(activeFilter === d ? null : d)}
              className={cn(
                "border px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors",
                activeFilter === d
                  ? FILTER_ACTIVE[d]
                  : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 border border-border/50 px-3 py-1">
          <Search className="h-3 w-3 text-muted-foreground/50" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search issues…"
            className="w-40 bg-transparent font-mono text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none"
          />
        </div>
      </div>

      {/* Skeleton while loading */}
      {!issues && (
        <div className="space-y-px">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {/* Grouped rows */}
      {issues &&
        DIFFICULTY_ORDER.map((difficulty) => {
          const group = grouped[difficulty];
          if (group.length === 0) return null;
          return (
            <div key={difficulty} className="space-y-px">
              <div className="mb-2 flex items-center gap-2">
                <DifficultyBadge difficulty={difficulty} />
                <span className="font-mono text-[10px] text-muted-foreground/40">
                  {group.length}
                </span>
              </div>

              {group.map((issue) => (
                <a
                  key={issue.url}
                  href={issue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-start gap-4 border border-border/40 border-l-2 bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.04]",
                    BORDER_COLORS[issue.difficulty],
                  )}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate font-mono text-xs font-medium text-foreground">
                      {issue.title}
                    </p>
                    <p className="font-mono text-xs leading-relaxed text-muted-foreground">
                      {issue.reason}
                    </p>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-4 font-mono text-[10px] text-muted-foreground/40">
                    {issue.comments !== undefined && (
                      <span>{issue.comments} comments</span>
                    )}
                    {issue.daysOpen !== undefined && (
                      <span>{issue.daysOpen}d open</span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          );
        })}
    </div>
  );
}
