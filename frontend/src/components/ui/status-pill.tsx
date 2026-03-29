import { cn } from "@/lib/utils";

type StatusVariant = "live" | "streaming" | "cached" | "default";

const variantStyles: Record<
  StatusVariant,
  { wrapper: string; dot: string; label: string }
> = {
  live: {
    wrapper: "border-green-500/30 bg-green-500/5",
    dot: "bg-green-500",
    label: "text-green-500",
  },
  streaming: {
    wrapper: "border-amber-500/30 bg-amber-500/5",
    dot: "bg-amber-500",
    label: "text-amber-500",
  },
  cached: {
    wrapper: "border-border bg-muted/30",
    dot: "bg-muted-foreground",
    label: "text-muted-foreground",
  },
  default: {
    wrapper: "border-border bg-muted/10",
    dot: "bg-muted-foreground",
    label: "text-muted-foreground",
  },
};

interface StatusPillProps {
  label: string;
  variant?: StatusVariant;
  className?: string;
}

export function StatusPill({
  label,
  variant = "default",
  className,
}: StatusPillProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 border px-3 py-1",
        styles.wrapper,
        className,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", styles.dot)}
        aria-hidden="true"
      />
      <span
        className={cn(
          "font-mono text-[11px] font-medium tracking-widest",
          styles.label,
        )}
      >
        {label}
      </span>
    </div>
  );
}
