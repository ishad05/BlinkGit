import { useState, useEffect } from "react";
import { Plus, Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";
import { Logo } from "@/components/ui/logo";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { ResultsSidebar, type ResultsTab } from "@/components/ResultsSidebar";
import { OverviewPanel } from "@/components/OverviewPanel";
import { ArchDiagram } from "@/components/ArchDiagram";
import { SetupPanel } from "@/components/SetupPanel";
import { IssueRanker } from "@/components/IssueRanker";
import { ModelSwitcher } from "@/components/ModelSwitcher";
import { ChatPanel } from "@/components/ChatPanel";

// ---------------------------------------------------------------------------
// Error panel — shown when the analysis request fails with no data
// ---------------------------------------------------------------------------

function ErrorPanel({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="w-full max-w-sm space-y-4 border border-red-500/40 bg-red-500/5 p-6">
        <p className="font-mono text-[10px] tracking-[0.12em] text-red-400/70">
          ANALYSIS FAILED
        </p>
        <p className="font-mono text-sm text-red-300 break-words">
          {error.message}
        </p>
        <p className="font-mono text-[11px] text-muted-foreground">
          Check that the repository is public and the URL is correct.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="font-mono text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          ← new analysis
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Analysis progress indicator — shown while waiting for the first stream chunk
// ---------------------------------------------------------------------------

const STAGES = [
  "Connecting to GitHub...",
  "Fetching repository structure...",
  "Reading README and issues...",
  "Generating AI analysis...",
  "Streaming results...",
];

// Approximate durations (ms) before advancing to the next stage
const STAGE_DELAYS = [1200, 2500, 3500, 5000];

function AnalysisProgress() {
  const [stageIndex, setStageIndex] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (stageIndex >= STAGE_DELAYS.length) return;
    const t = setTimeout(
      () => setStageIndex((i) => i + 1),
      STAGE_DELAYS[stageIndex],
    );
    return () => clearTimeout(t);
  }, [stageIndex]);

  useEffect(() => {
    const t = setInterval(
      () => setDots((d) => (d.length >= 3 ? "" : d + ".")),
      400,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="w-full max-w-sm space-y-1 border border-border/40 bg-white/[0.02] p-6">
        <p className="mb-4 font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
          ANALYSIS IN PROGRESS
        </p>
        {STAGES.map((label, i) => {
          const done = i < stageIndex;
          const active = i === stageIndex;
          return (
            <div
              key={label}
              className="flex items-center gap-3 font-mono text-xs"
            >
              <span
                className={
                  done
                    ? "text-green-500"
                    : active
                      ? "text-green-400"
                      : "text-border"
                }
              >
                {done ? "✓" : active ? "›" : "·"}
              </span>
              <span
                className={
                  done
                    ? "text-muted-foreground line-through"
                    : active
                      ? "text-foreground"
                      : "text-border"
                }
              >
                {active ? `${label.replace(/\.\.\.$/, "")}${dots}` : label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared types (mirror backend schema — used by all panels)
// ---------------------------------------------------------------------------

export interface MajorModule {
  name: string;
  description: string;
  type: "service" | "ui" | "api" | "config" | "database" | "middleware" | "util";
}

export interface Overview {
  purpose: string;
  techStack: string[];
  keyFiles: string[];
  highlights: string[];
  useCases: string[];
  coreWorkflow: string;
  majorModules: MajorModule[];
}

export interface Setup {
  prerequisites: string[];
  steps: Array<{ label: string; command: string }>;
  envVars: Array<{ key: string; description: string }>;
  runCommand: string;
}

export interface Issue {
  title: string;
  url: string;
  difficulty: "beginner" | "moderate" | "high";
  reason: string;
  comments?: number;
  daysOpen?: number;
}

export interface Architecture {
  nodes: Array<{ id: string; label: string; type: string; description: string }>;
  edges: Array<{ from: string; to: string; label?: string }>;
}

export interface AnalysisData {
  overview?: Overview;
  setup?: Setup;
  issues?: Issue[];
  architecture?: Architecture;
}

// ---------------------------------------------------------------------------

interface ResultsPageProps {
  repo: string; // "owner/repo"
  analysis: AnalysisData;
  isStreaming: boolean;
  error: Error | null;
  onNewAnalysis: () => void;
}

export function ResultsPage({
  repo,
  analysis,
  isStreaming,
  error,
  onNewAnalysis,
}: ResultsPageProps) {
  const [activeTab, setActiveTab] = useState<ResultsTab>("overview");
  const { theme, toggle: toggleTheme } = useThemeStore();

  const hasData = !!(
    analysis.overview ||
    analysis.issues ||
    analysis.architecture ||
    analysis.setup
  );

  // Show the progress indicator while streaming with no data yet,
  // OR before the auto-submit has fired (isStreaming=false, no data, no error).
  const showProgress = !hasData && !error;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Top navbar */}
      <header className="flex h-12 flex-shrink-0 items-center gap-0 border-b border-border/50 px-4">
        <button
          type="button"
          onClick={onNewAnalysis}
          aria-label="Home"
          className="mr-4"
        >
          <Logo size="sm" />
        </button>
        <span className="font-mono text-xs text-muted-foreground">/</span>
        <span className="ml-2 font-mono text-xs text-foreground">{repo}</span>
        <span className="ml-3">
          <StatusPill
            label={isStreaming ? "STREAMING" : "LIVE"}
            variant={isStreaming ? "streaming" : "live"}
          />
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-7 w-7 items-center justify-center border border-border/50 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
          >
            {theme === "dark" ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </button>
          <ModelSwitcher />
          <Button
            size="sm"
            variant="outline"
            onClick={onNewAnalysis}
            className="h-7 gap-1.5 font-mono text-[11px] tracking-widest"
          >
            <Plus className="h-3 w-3" />
            NEW ANALYSIS
          </Button>
        </div>
      </header>

      {/* Sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        <ResultsSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="flex-1 overflow-y-auto p-6">
          {showProgress && <AnalysisProgress />}
          {error && hasData && (
            <div className="mb-4 flex items-start gap-3 border border-red-500/40 bg-red-500/5 px-4 py-3">
              <span className="flex-1 font-mono text-xs text-red-400">
                Analysis interrupted: {error.message}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                partial results shown below
              </span>
            </div>
          )}
          {error && !hasData && (
            <ErrorPanel error={error} onRetry={onNewAnalysis} />
          )}
          {!showProgress && !error && activeTab === "overview" && (
            <OverviewPanel overview={analysis.overview} />
          )}
          {!showProgress && activeTab === "architecture" && (
            <ArchDiagram architecture={analysis.architecture} />
          )}
          {!showProgress && activeTab === "setup" && (
            <SetupPanel setup={analysis.setup} />
          )}
          {!showProgress && activeTab === "issues" && (
            <IssueRanker issues={analysis.issues} />
          )}
          {!showProgress && activeTab === "chat" && (
            <ChatPanel repo={repo} analysis={analysis} />
          )}
        </main>
      </div>
    </div>
  );
}
