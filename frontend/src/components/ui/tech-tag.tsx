import { cn } from "@/lib/utils";

interface TechTagProps {
  label: string;
  className?: string;
}

export function TechTag({ label, className }: TechTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center border border-border bg-muted/20 px-2.5 py-1 font-mono text-[11px] text-muted-foreground",
        className,
      )}
    >
      {label}
    </span>
  );
}
