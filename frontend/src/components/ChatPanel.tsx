import { useEffect, useRef, useState } from "react";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/utils";
import type { AnalysisData } from "@/components/ResultsPage";

const BACKEND_URL =
  (import.meta.env.VITE_BACKEND_URL as string | undefined) ??
  "http://localhost:3000";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  repo: string;
  analysis: AnalysisData;
}

export function ChatPanel({ repo, analysis }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    const assistantId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          repoContext: JSON.stringify(analysis),
        }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => `HTTP ${res.status}`);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `Error: ${errText}` }
              : m,
          ),
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: m.content + chunk }
              : m,
          ),
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: `Error: ${msg}` } : m,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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

      {/* Messages */}
      <div
        className="flex-1 space-y-4 overflow-y-auto py-4"
        style={{ minHeight: 0 }}
      >
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
              {message.content ||
                (isLoading && message.role === "assistant" ? (
                  <span className="animate-pulse text-green-500/50">
                    thinking…
                  </span>
                ) : null)}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-border/40 pt-3">
        <div className="flex items-center gap-3 border border-border/50 bg-white/[0.02] px-4 py-3">
          <span className="select-none font-mono text-xs text-green-500">
            ❯
          </span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this repository…"
            rows={1}
            className="flex-1 resize-none bg-transparent font-mono text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 font-mono text-[11px] tracking-widest text-green-500 transition-colors hover:text-green-400 disabled:text-muted-foreground/25"
          >
            Send →
          </button>
        </div>
      </div>
    </div>
  );
}
