import { useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/utils";
import type { AnalysisData } from "@/components/ResultsPage";

const BACKEND_URL =
  (import.meta.env.VITE_BACKEND_URL as string | undefined) ??
  "http://localhost:3000";

interface ChatPanelProps {
  repo: string;
  analysis: AnalysisData;
}

export function ChatPanel({ repo, analysis }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: `${BACKEND_URL}/chat`,
      body: { repoContext: JSON.stringify(analysis) },
    });

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div
      className="mx-auto flex max-w-3xl flex-col"
      style={{ height: "calc(100vh - 8rem)" }}
    >
      {/* Header */}
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-border/40 pb-3">
        <span className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground">
          AI CONTRIBUTION ASSISTANT
        </span>
        <StatusPill label={repo} variant="default" />
      </div>

      {/* Message list */}
      <div className="flex-1 space-y-4 overflow-y-auto py-4" style={{ minHeight: 0 }}>
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-center font-mono text-xs leading-relaxed text-muted-foreground/30">
              Ask anything about this repository.
              <br />
              Files, architecture, how to contribute, where to start.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[82%] px-4 py-3 font-mono text-xs leading-relaxed",
                message.role === "user"
                  ? "border border-white/10 bg-white/[0.06] text-foreground"
                  : "border border-green-500/15 bg-green-500/[0.04] text-foreground/85",
              )}
            >
              {message.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="border border-green-500/15 bg-green-500/[0.04] px-4 py-3">
              <span className="animate-pulse font-mono text-xs text-green-500/50">
                thinking…
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 border-t border-border/40 pt-3">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-3 border border-border/50 bg-white/[0.02] px-4 py-3">
            <span className="select-none font-mono text-xs text-green-500">
              ❯
            </span>
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about this repository…"
              rows={1}
              className="flex-1 resize-none bg-transparent font-mono text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex-shrink-0 font-mono text-[11px] tracking-widest text-green-500 transition-colors hover:text-green-400 disabled:text-muted-foreground/25"
            >
              Send →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
