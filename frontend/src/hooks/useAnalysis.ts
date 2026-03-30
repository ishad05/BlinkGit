import { experimental_useObject as useObject } from "@ai-sdk/react";
import { useCallback } from "react";
import { z } from "zod";
import type { AnalysisData } from "@/components/ResultsPage";

const BACKEND_URL =
  (import.meta.env.VITE_BACKEND_URL as string | undefined) ??
  "http://localhost:3000";

// Mirror of backend schema — used by useObject for progressive partial typing
const analysisSchema = z.object({
  overview: z.object({
    purpose: z.string(),
    techStack: z.array(z.string()),
    keyFiles: z.array(z.string()),
    highlights: z.array(z.string()),
    useCases: z.array(z.string()),
    coreWorkflow: z.string(),
    majorModules: z.array(
      z.object({
        name: z.string(),
        description: z.string(),
        type: z.enum([
          "service",
          "ui",
          "api",
          "config",
          "database",
          "middleware",
          "util",
        ]),
      }),
    ),
  }),
  setup: z.object({
    prerequisites: z.array(z.string()),
    steps: z.array(z.object({ label: z.string(), command: z.string() })),
    envVars: z.array(z.object({ key: z.string(), description: z.string() })),
    runCommand: z.string(),
  }),
  issues: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      difficulty: z.enum(["beginner", "moderate", "high"]),
      reason: z.string(),
      comments: z.number().optional(),
      daysOpen: z.number().optional(),
    }),
  ),
  architecture: z.object({
    nodes: z.array(
      z.object({ id: z.string(), label: z.string(), type: z.string() }),
    ),
    edges: z.array(
      z.object({
        from: z.string(),
        to: z.string(),
        label: z.string().optional(),
      }),
    ),
  }),
});

export function useAnalysis() {
  const { object, submit, isLoading, error, stop } = useObject({
    api: `${BACKEND_URL}/analyze`,
    schema: analysisSchema,
  });

  const stableSubmit = useCallback(
    (repoUrl: string) => submit({ repoUrl }),
    [submit],
  );

  return {
    data: (object ?? {}) as AnalysisData,
    submit: stableSubmit,
    isLoading,
    error,
    stop,
  };
}
