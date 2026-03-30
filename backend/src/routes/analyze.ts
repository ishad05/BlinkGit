import type { Context } from 'hono'
import { getCachedAnalysis, setCachedAnalysis } from '../db/cache.js'
import { fetchRepoContext } from '../agent/github.js'
import { getSelectedModel } from '../db/models.js'
import { analyzeRepo } from '../agent/analyze.js'

export async function analyzeRoute(c: Context): Promise<Response> {
  // 1. Parse + validate body
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const repoUrl = (body as Record<string, unknown>)?.repoUrl
  if (typeof repoUrl !== 'string' || !repoUrl.trim()) {
    return c.json({ error: 'repoUrl is required and must be a string' }, 400)
  }

  // 2. Check required env vars early — fail fast before any async work
  const githubToken = process.env.GITHUB_TOKEN
  const googleApiKey = process.env.GOOGLE_API_KEY
  if (!githubToken) return c.json({ error: 'GITHUB_TOKEN not configured' }, 500)
  if (!googleApiKey) return c.json({ error: 'GOOGLE_API_KEY not configured' }, 500)

  // 3. Cache hit — return immediately as JSON
  try {
    const cached = await getCachedAnalysis(repoUrl)
    if (cached) return c.json(cached)
  } catch (err) {
    // Cache read failure is non-fatal — proceed to live analysis
    console.error('Cache read failed:', err)
  }

  // 4. Fetch GitHub context
  let context
  try {
    context = await fetchRepoContext(repoUrl, githubToken)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return c.json({ error: `Failed to fetch repository: ${message}` }, 502)
  }

  // 5. Get selected model from DB
  const modelId = await getSelectedModel()

  // 6. Run AI analysis — returns a streamText result
  const result = analyzeRepo(context, modelId, googleApiKey)

  // 7. Cache the final object in the background (don't await — let the stream flow)
  result.object
    .then((obj) => setCachedAnalysis(repoUrl, obj))
    .catch((err: unknown) => console.error('Cache write failed:', err))

  // 8. Stream response to client
  return result.toTextStreamResponse()
}
