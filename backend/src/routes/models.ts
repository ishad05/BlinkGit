import type { Context } from 'hono'
import { getSelectedModel, setSelectedModel, isValidModel, VALID_MODELS } from '../db/models.js'

export async function getModelsRoute(c: Context): Promise<Response> {
  const model = await getSelectedModel()
  return c.json({ model, available: [...VALID_MODELS] })
}

export async function postModelsRoute(c: Context): Promise<Response> {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const model = (body as Record<string, unknown>)?.model
  if (typeof model !== 'string' || !model) {
    return c.json({ error: 'model field is required and must be a string' }, 400)
  }

  if (!isValidModel(model)) {
    return c.json({
      error: `Invalid model. Must be one of: ${VALID_MODELS.join(', ')}`,
    }, 400)
  }

  await setSelectedModel(model)
  return c.json({ model })
}
