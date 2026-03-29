import { GitFork, ListOrdered, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const FEATURES = [
  {
    icon: GitFork,
    title: "Architecture Diagram",
    description:
      "Auto-generated node-edge graph of every key module and how they connect.",
  },
  {
    icon: ListOrdered,
    title: "Ranked Issues",
    description:
      "Open issues sorted by difficulty — beginner, moderate, high — so you know where to start.",
  },
  {
    icon: FileText,
    title: "Codebase Overview",
    description:
      "Purpose, tech stack, key files, and highlights — streamed live as the AI reads the repo.",
  },
] as const;

export function FeatureStrip() {
  return (
    <div className="w-full border-t border-border/50">
      <div className="mx-auto max-w-[800px] px-4 sm:px-0">
        <div className="grid grid-cols-1 divide-y divide-border/50 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col gap-3 px-0 py-8 sm:px-8 first:sm:pl-0 last:sm:pr-0">
              <div className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 text-green-500" strokeWidth={1.5} />
                <p className="font-mono text-[13px] font-semibold text-foreground">
                  {title}
                </p>
              </div>
              <p className="font-mono text-xs leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
      <Separator className="opacity-50" />
    </div>
  );
}
