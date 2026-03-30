import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/utils";
import type { Setup } from "@/components/ResultsPage";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-white/5", className)} />;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy to clipboard"
      className="flex flex-shrink-0 items-center gap-1 font-mono text-[10px] text-muted-foreground/40 transition-colors hover:text-muted-foreground"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-green-500" />
          <span className="text-green-500">copied</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          copy
        </>
      )}
    </button>
  );
}

function TerminalBlock({ command }: { command: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border border-border/50 bg-black/30 px-4 py-3">
      <pre className="overflow-x-auto font-mono text-xs text-green-400">
        <span className="mr-2 select-none text-muted-foreground/40">$</span>
        {command}
      </pre>
      <CopyButton text={command} />
    </div>
  );
}

interface SetupPanelProps {
  setup: Setup | undefined;
}

export function SetupPanel({ setup }: SetupPanelProps) {
  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground">
          SETUP
        </span>
        <StatusPill
          label={setup ? "READY" : "LOADING"}
          variant={setup ? "live" : "default"}
        />
      </div>

      {/* Prerequisites */}
      <div className="space-y-3">
        <span className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
          PREREQUISITES
        </span>
        {setup ? (
          <ul className="space-y-1.5">
            {setup.prerequisites.map((p) => (
              <li
                key={p}
                className="flex items-start gap-2 font-mono text-xs text-foreground/70"
              >
                <span className="mt-0.5 text-green-500">›</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-4 w-64" />
            ))}
          </div>
        )}
      </div>

      {/* Installation steps */}
      <div className="space-y-4">
        <span className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
          INSTALLATION STEPS
        </span>
        {setup ? (
          <ol className="space-y-4">
            {setup.steps.map((step, i) => (
              <li key={i} className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center border border-border/50 font-mono text-[10px] text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="font-mono text-xs text-foreground">
                    {step.label}
                  </span>
                </div>
                <TerminalBlock command={step.command} />
              </li>
            ))}
          </ol>
        ) : (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Environment variables */}
      <div className="space-y-3">
        <span className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
          ENVIRONMENT VARIABLES
        </span>
        {setup ? (
          <div className="border border-border/40">
            {setup.envVars.map((ev, i) => (
              <div
                key={ev.key}
                className={cn(
                  "flex items-start gap-6 px-4 py-2.5",
                  i > 0 && "border-t border-border/30",
                )}
              >
                <span className="w-48 flex-shrink-0 font-mono text-xs font-medium text-green-400">
                  {ev.key}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {ev.description}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-px">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}
      </div>

      {/* Run command */}
      <div className="space-y-3">
        <span className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
          RUN LOCALLY
        </span>
        {setup ? (
          <TerminalBlock command={setup.runCommand} />
        ) : (
          <Skeleton className="h-12 w-full" />
        )}
      </div>
    </div>
  );
}
