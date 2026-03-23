// TODO: implement GET /models and POST /models
// GET  → return { model: string } from getSelectedModel()
// POST → accept { model: string }, call setSelectedModel(), return 200

import type { Context } from 'hono'

export async function getModelsRoute(c: Context): Promise<Response> {
  return c.json({ model: 'openai/gpt-4o' })
}

export async function postModelsRoute(c: Context): Promise<Response> {
  return c.json({ message: 'POST /models — not yet implemented' }, 501)
}
