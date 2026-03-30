import type { Context } from 'hono'
import { getCachedAnalysis, setCachedAnalysis } from '../db/cache.js'
import { fetchRepoContext } from '../agent/github.js'
import { getSelectedModel } from '../db/models.js'
import { analyzeRepo } from '../agent/analyze.js'
import type { Analysis } from '../agent/schema.js'

const enc = new TextEncoder()

function sseEvent(data: object): Uint8Array {
  return enc.encode(`data: ${JSON.stringify(data)}\n\n`)
}

function sseDone(): Uint8Array {
  return enc.encode('data: [DONE]\n\n')
}

function sseResponse(
  build: (controller: ReadableStreamDefaultController) => Promise<void>,
): Response {
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await build(controller)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}

// Send a cached full analysis as SSE events (same format as live analysis)
function streamCached(cached: Analysis): Response {
  return sseResponse(async (controller) => {
    controller.enqueue(sseEvent({ section: 'overview', payload: cached.overview }))
    controller.enqueue(sseEvent({ section: 'architecture', payload: cached.architecture }))
    controller.enqueue(sseEvent({ section: 'setup', payload: cached.setup }))
    controller.enqueue(sseEvent({ section: 'issues', payload: cached.issues }))
    controller.enqueue(sseDone())
  })
}

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

  // 2. Check required env vars
  const githubToken = process.env.GITHUB_TOKEN
  const googleApiKey = process.env.GOOGLE_API_KEY
  if (!githubToken) return c.json({ error: 'GITHUB_TOKEN not configured' }, 500)
  if (!googleApiKey) return c.json({ error: 'GOOGLE_API_KEY not configured' }, 500)

  // 3. Cache hit — stream sections from cache
  try {
    const cached = await getCachedAnalysis(repoUrl)
    if (cached) return streamCached(cached)
  } catch (err) {
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

  // 5. Get selected model (non-fatal)
  let modelId = 'gemini/gemini-2.5-flash'
  try {
    modelId = await getSelectedModel()
  } catch (err) {
    console.warn('Could not read model from DB, using default:', err)
  }

  // 6. Stream sections to client as they complete, cache the full result at the end
  return sseResponse(async (controller) => {
    const result = await analyzeRepo(context, modelId, googleApiKey, (event) => {
      controller.enqueue(sseEvent({ section: event.section, payload: event.payload }))
    })

    controller.enqueue(sseDone())

    // Cache in background
    setCachedAnalysis(repoUrl, result).catch((err: unknown) =>
      console.error('Cache write failed:', err),
    )
  })
}
