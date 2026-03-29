import { cn } from "@/lib/utils";

type Difficulty = "beginner" | "moderate" | "high";

const difficultyStyles: Record<
  Difficulty,
  { border: string; text: string }
> = {
  beginner: {
    border: "border-green-500/60",
    text: "text-green-500",
  },
  moderate: {
    border: "border-amber-500/60",
    text: "text-amber-500",
  },
  high: {
    border: "border-red-500/60",
    text: "text-red-500",
  },
};

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  className?: string;
}

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  const styles = difficultyStyles[difficulty];

  return (
    <span
      className={cn(
        "inline-flex items-center border px-2.5 py-0.5 font-mono text-[10px] font-medium tracking-widest uppercase",
        styles.border,
        styles.text,
        className,
      )}
    >
      {difficulty}
    </span>
  );
}
