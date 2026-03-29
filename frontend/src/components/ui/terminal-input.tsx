import * as React from "react";
import { cn } from "@/lib/utils";

interface TerminalInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  containerClassName?: string;
}

export const TerminalInput = React.forwardRef<
  HTMLInputElement,
  TerminalInputProps
>(({ className, containerClassName, disabled, ...props }, ref) => {
  return (
    <div
      className={cn(
        "flex h-[52px] flex-1 items-center gap-2.5 border border-border bg-[#111111] px-4",
        "focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/10",
        disabled && "cursor-not-allowed opacity-50",
        containerClassName,
      )}
    >
      {/* Prompt symbol */}
      <span
        className="select-none font-mono text-sm text-green-500"
        aria-hidden="true"
      >
        ❯
      </span>

      {/* Prefix hint */}
      <span
        className="hidden select-none font-mono text-sm text-muted-foreground/40 sm:block"
        aria-hidden="true"
      >
        https://github.com/
      </span>

      {/* Actual input */}
      <input
        ref={ref}
        disabled={disabled}
        className={cn(
          "flex-1 bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/40",
          className,
        )}
        {...props}
      />

      {/* Blinking cursor shown when empty / placeholder visible */}
      {!props.value && (
        <span
          className="h-[18px] w-0.5 animate-[blink_1s_step-end_infinite] bg-green-500"
          aria-hidden="true"
        />
      )}
    </div>
  );
});

TerminalInput.displayName = "TerminalInput";
