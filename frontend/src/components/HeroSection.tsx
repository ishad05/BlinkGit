import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { TerminalInput } from "@/components/ui/terminal-input";

const EXAMPLE_REPOS = [
  "vercel/next.js",
  "facebook/react",
  "denoland/deno",
  "trpc/trpc",
];

interface HeroSectionProps {
  onSubmit: (repoUrl: string) => void;
  isLoading: boolean;
}

export function HeroSection({ onSubmit, isLoading }: HeroSectionProps) {
  const [value, setValue] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    const url = trimmed.startsWith("http")
      ? trimmed
      : `https://github.com/${trimmed}`;
    onSubmit(url);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").trim();
    if (!pasted.startsWith("http")) return; // not a URL — let normal paste happen

    e.preventDefault();
    const match = pasted.match(/^https?:\/\/github\.com\/([^/?#]+)\/([^/?#]+)/);
    if (match) {
      setValue(`${match[1]}/${match[2]}`);
      setPasteError(null);
    } else {
      setPasteError("Invalid GitHub URL — expected https://github.com/owner/repo");
    }
  }

  function fillExample(repo: string) {
    setValue(repo);
    setPasteError(null);
  }

  return (
    <section className="mx-auto flex w-full max-w-[800px] flex-col items-center px-4 pb-16 pt-20 text-center sm:px-0">
      {/* Badge row */}
      <div className="mb-9 flex flex-wrap items-center justify-center gap-2.5">
        <StatusPill label="AI-POWERED GITHUB INTELLIGENCE" variant="live" />
        <div className="inline-flex items-center gap-2 border border-border bg-muted/10 px-3 py-1">
          <span className="text-sm" aria-hidden="true">🏆</span>
          <span className="font-mono text-[11px] font-medium tracking-widest text-muted-foreground">
            FOSS HACK 2025
          </span>
        </div>
      </div>

      {/* Headline */}
      <h1 className="mb-6 font-mono text-5xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-[56px]">
        Understand any
        <br />
        GitHub repo
        <span className="text-green-500" aria-hidden="true">_</span>
      </h1>

      {/* Sub-copy */}
      <p className="mb-2 max-w-[560px] font-mono text-base leading-[1.75] text-muted-foreground">
        Paste a repository URL. Get a live architecture diagram,
        <br className="hidden sm:block" />
        issues ranked by difficulty, and a full codebase overview.
      </p>
      <p className="mb-12 font-mono text-sm tracking-wide text-muted-foreground/50">
        No setup. No cloning. Just insight.
      </p>

      {/* Input + CTA */}
      <form onSubmit={handleSubmit} className="flex w-full" noValidate>
        <TerminalInput
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setPasteError(null);
          }}
          onPaste={handlePaste}
          placeholder="owner/repo"
          disabled={isLoading}
          aria-label="GitHub repository URL"
          containerClassName={pasteError ? "border-r-0 border-red-500/60" : "border-r-0"}
        />
        <Button
          type="submit"
          disabled={isLoading || !value.trim()}
          className="h-[52px] gap-2 rounded-none px-7 font-mono text-sm font-semibold tracking-wide"
        >
          {isLoading ? "Analyzing…" : "Analyze"}
          {!isLoading && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

      {/* Paste error */}
      {pasteError && (
        <p className="mt-2 w-full font-mono text-[11px] text-red-400/80">
          ✕ {pasteError}
        </p>
      )}

      {/* Example repos */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <span className="font-mono text-[11px] tracking-wide text-muted-foreground/40">
          try:
        </span>
        {EXAMPLE_REPOS.map((repo) => (
          <button
            key={repo}
            type="button"
            onClick={() => fillExample(repo)}
            className="border border-border bg-muted/10 px-3 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-border/80 hover:text-foreground"
          >
            {repo}
          </button>
        ))}
      </div>
    </section>
  );
}
