import type { Context } from 'hono'
import { deleteCachedAnalysis } from '../db/cache.js'

export async function deleteCacheRoute(c: Context) {
  const body = await c.req.json<{ repoUrl?: unknown }>()

  if (typeof body.repoUrl !== 'string' || !body.repoUrl) {
    return c.json({ error: 'repoUrl is required' }, 400)
  }

  const deleted = await deleteCachedAnalysis(body.repoUrl)

  if (!deleted) {
    return c.json({ error: 'not found' }, 404)
  }

  return c.json({ deleted: true })
}
