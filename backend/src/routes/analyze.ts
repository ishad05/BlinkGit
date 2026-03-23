// TODO: implement POST /analyze
// Flow:
//   1. Parse { repoUrl } from request body
//   2. Check DB cache via getCachedAnalysis() — return cached result if hit
//   3. Fetch GitHub context via fetchRepoContext()
//   4. Read selected model via getSelectedModel()
//   5. Call analyzeRepo() → get SSE stream
//   6. Cache result in background via setCachedAnalysis()
//   7. Stream SSE response to client

import type { Context } from 'hono'

export async function analyzeRoute(c: Context): Promise<Response> {
  return c.json({ message: 'POST /analyze — not yet implemented' }, 501)
}
