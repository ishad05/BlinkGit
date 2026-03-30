import { z } from 'zod'

export const analysisSchema = z.object({
  overview: z.object({
    purpose: z.string(),
    techStack: z.array(z.string()),
    keyFiles: z.array(z.string()),
    highlights: z.array(z.string()),
    useCases: z.array(z.string()),
    coreWorkflow: z.string(),
    majorModules: z.array(z.object({
      name: z.string(),
      description: z.string(),
      type: z.enum(['service', 'ui', 'api', 'config', 'database', 'middleware', 'util']),
    })),
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
      difficulty: z.enum(['beginner', 'moderate', 'high']),
      reason: z.string(),
    }),
  ),
  architecture: z.object({
    nodes: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        type: z.string(),
      }),
    ),
    edges: z.array(
      z.object({
        from: z.string(),
        to: z.string(),
        label: z.string().optional(),
      }),
    ),
  }),
})

export type Analysis = z.infer<typeof analysisSchema>
