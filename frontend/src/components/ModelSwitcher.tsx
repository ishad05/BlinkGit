import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useModelStore } from "@/stores/modelStore";

const BACKEND_URL =
  (import.meta.env.VITE_BACKEND_URL as string | undefined) ??
  "http://localhost:3000";

const MODEL_LABELS: Record<string, string> = {
  "gemini/gemini-2.5-flash": "Gemini 2.5 Flash",
  "gemini/gemini-2.0-flash": "Gemini 2.0 Flash",
  "gemini/gemini-1.5-flash": "Gemini 1.5 Flash",
  "gemini/gemini-1.5-pro": "Gemini 1.5 Pro",
};

export function ModelSwitcher() {
  const { selectedModel, setSelectedModel } = useModelStore();

  const { data } = useQuery({
    queryKey: ["models"],
    queryFn: async () => {
      const res = await fetch(`${BACKEND_URL}/models`);
      return res.json() as Promise<{ model: string; available: string[] }>;
    },
  });

  // Sync store with DB value when it loads
  useEffect(() => {
    if (data?.model) setSelectedModel(data.model);
  }, [data?.model, setSelectedModel]);

  const mutation = useMutation({
    mutationFn: async (model: string) => {
      await fetch(`${BACKEND_URL}/models`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model }),
      });
    },
    onSuccess: (_, model) => setSelectedModel(model),
  });

  const available = data?.available ?? [selectedModel];

  return (
    <select
      value={selectedModel}
      onChange={(e) => mutation.mutate(e.target.value)}
      disabled={mutation.isPending}
      className="cursor-pointer border border-border/50 bg-background px-2 py-1 font-mono text-[10px] tracking-widest text-muted-foreground transition-colors hover:border-border focus:outline-none disabled:opacity-50"
      style={{ appearance: "none" }}
    >
      {available.map((m) => (
        <option key={m} value={m}>
          {MODEL_LABELS[m] ?? m}
        </option>
      ))}
    </select>
  );
}
