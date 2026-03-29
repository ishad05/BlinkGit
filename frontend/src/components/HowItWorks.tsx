import { TechTag } from "@/components/ui/tech-tag";
import { StatusPill } from "@/components/ui/status-pill";

const STEPS = [
  {
    number: "01",
    title: "Paste a GitHub URL",
    description:
      "Drop any public GitHub repository URL into the input. BlinkGit fetches the file tree, README, and up to 5 key source files — without cloning.",
    visual: (
      <div className="flex items-center gap-2 border border-border bg-[#111111] px-3.5 py-2.5">
        <span className="font-mono text-sm text-green-500">❯</span>
        <span className="font-mono text-xs text-muted-foreground/40">
          https://github.com/
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          vercel/next.js
        </span>
      </div>
    ),
  },
  {
    number: "02",
    title: "AI reads the codebase",
    description:
      "Your selected model — GPT-4o, Claude Sonnet, or Gemini — receives the context and begins streaming a structured analysis back to you live.",
    visual: (
      <div className="flex flex-wrap gap-2">
        <TechTag label="gpt-4o" />
        <TechTag label="claude-sonnet-4-5" />
        <TechTag label="gemini-1.5-pro" />
      </div>
    ),
  },
  {
    number: "03",
    title: "Results stream in live",
    description:
      "Three panels populate simultaneously: an interactive architecture diagram, issues sorted by difficulty, and a full plain-English overview — all streamed as the model thinks.",
    visual: (
      <div className="flex items-center gap-3">
        <StatusPill label="STREAMING" variant="streaming" />
        <span className="font-mono text-xs text-muted-foreground/40">
          results cached for 24h
        </span>
      </div>
    ),
  },
] as const;

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="mx-auto w-full max-w-[800px] px-4 py-24 sm:px-0"
    >
      <p className="mb-2 font-mono text-[11px] tracking-[0.12em] text-green-500">
        // HOW IT WORKS
      </p>
      <h2 className="mb-14 font-mono text-[28px] font-bold leading-[1.1] text-foreground">
        From URL to insight
        <br />
        in three steps.
      </h2>

      <div className="flex flex-col">
        {STEPS.map(({ number, title, description, visual }, index) => (
          <div key={number} className="flex gap-8 border-t border-border/50">
            {/* Step number + connector */}
            <div className="flex w-10 flex-shrink-0 flex-col items-center pt-9">
              <span className="font-mono text-[11px] tracking-[0.1em] text-green-500">
                {number}
              </span>
              {index < STEPS.length - 1 && (
                <div className="mt-3 w-px flex-1 bg-green-500/10" />
              )}
            </div>

            {/* Content */}
            <div className="flex flex-col gap-3 pb-10 pt-8">
              <p className="font-mono text-base font-semibold text-foreground">
                {title}
              </p>
              <p className="max-w-lg font-mono text-[13px] leading-[1.7] text-muted-foreground">
                {description}
              </p>
              <div className="mt-2">{visual}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
