import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";
import { TechTag } from "@/components/ui/tech-tag";
import { cn } from "@/lib/utils";
import type { Overview } from "@/components/ResultsPage";

const MODULE_TYPE_COLORS: Record<string, string> = {
  service:    "border-blue-500/40 text-blue-400",
  ui:         "border-purple-500/40 text-purple-400",
  api:        "border-green-500/40 text-green-400",
  config:     "border-border/50 text-muted-foreground",
  database:   "border-amber-500/40 text-amber-400",
  middleware: "border-cyan-500/40 text-cyan-400",
  util:       "border-border/50 text-muted-foreground",
};

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-white/5", className)} />;
}

interface OverviewPanelProps {
  overview: Overview | undefined;
}

export function OverviewPanel({ overview }: OverviewPanelProps) {
  const [workflowExpanded, setWorkflowExpanded] = useState(false);

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground">
          OVERVIEW
        </span>
        <StatusPill
          label={overview ? "LIVE" : "LOADING"}
          variant={overview ? "live" : "default"}
        />
      </div>

      {/* Purpose */}
      <div>
        {overview ? (
          <p className="font-mono text-sm leading-relaxed text-foreground/80">
            {overview.purpose}
          </p>
        ) : (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}
      </div>

      {/* Tech stack */}
      <div className="space-y-3">
        <span className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
          TECH STACK
        </span>
        {overview ? (
          <div className="flex flex-wrap gap-2">
            {overview.techStack.map((tech) => (
              <TechTag key={tech} label={tech} />
            ))}
          </div>
        ) : (
          <div className="flex gap-2">
            {[80, 100, 64, 96, 72].map((w) => (
              <div
                key={w}
                className="h-7 animate-pulse bg-white/5"
                style={{ width: w }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Key files + Use cases */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <span className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
            KEY FILES
          </span>
          {overview ? (
            <ul className="space-y-1.5">
              {overview.keyFiles.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 font-mono text-xs text-foreground/70"
                >
                  <span className="mt-0.5 text-green-500">›</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <span className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
            USE CASES
          </span>
          {overview ? (
            <ul className="space-y-1.5">
              {overview.useCases.map((uc) => (
                <li
                  key={uc}
                  className="flex items-start gap-2 font-mono text-xs text-foreground/70"
                >
                  <span className="mt-0.5 text-green-500">›</span>
                  <span>{uc}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Major modules */}
      <div className="space-y-3">
        <span className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
          MAJOR MODULES
        </span>
        {overview ? (
          <div className="space-y-px">
            {overview.majorModules.map((mod) => (
              <div
                key={mod.name}
                className="flex items-start gap-4 border border-border/40 bg-white/[0.02] px-4 py-3"
              >
                <span className="w-36 flex-shrink-0 font-mono text-xs font-medium text-foreground">
                  {mod.name}
                </span>
                <span className="flex-1 font-mono text-xs text-muted-foreground">
                  {mod.description}
                </span>
                <span
                  className={cn(
                    "flex-shrink-0 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest",
                    MODULE_TYPE_COLORS[mod.type] ?? "border-border/50 text-muted-foreground",
                  )}
                >
                  {mod.type}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-px">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}
      </div>

      {/* Core workflow (collapsible) */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setWorkflowExpanded((v) => !v)}
          className="flex items-center gap-2 font-mono text-[10px] tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
        >
          {workflowExpanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
          CORE WORKFLOW
        </button>

        {workflowExpanded &&
          (overview ? (
            <p className="border-l-2 border-green-500/30 pl-4 font-mono text-xs leading-relaxed text-foreground/70">
              {overview.coreWorkflow}
            </p>
          ) : (
            <div className="space-y-2 border-l-2 border-green-500/30 pl-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          ))}
      </div>
    </div>
  );
}
