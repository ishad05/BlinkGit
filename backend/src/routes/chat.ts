import type { Context } from 'hono'
import { streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { getSelectedModel } from '../db/models.js'

export async function chatRoute(c: Context): Promise<Response> {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const { messages, repoContext } = body as {
    messages: unknown
    repoContext?: string
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return c.json({ error: 'messages must be a non-empty array' }, 400)
  }

  const googleApiKey = process.env.GOOGLE_API_KEY
  if (!googleApiKey) return c.json({ error: 'GOOGLE_API_KEY not configured' }, 500)

  const modelId = await getSelectedModel()
  const google = createGoogleGenerativeAI({ apiKey: googleApiKey })
  const modelName = modelId.includes('/') ? modelId.split('/').slice(1).join('/') : modelId

  const systemPrompt = repoContext
    ? `You are an expert AI contribution assistant. You have full context of the repository being analyzed below. Answer questions specifically about this codebase — reference files, modules, architecture, and issues where relevant. Be concise and practical.

Repository analysis context:
${repoContext}`
    : `You are an expert AI contribution assistant helping developers understand and contribute to open-source repositories. Be concise and practical.`

  const result = streamText({
    model: google(modelName),
    system: systemPrompt,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: messages as any,
  })

  return result.toDataStreamResponse()
}
