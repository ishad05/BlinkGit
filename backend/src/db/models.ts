import { sql } from './client.js'

const VALID_MODELS = [
  'gemini/gemini-2.0-flash',
  'gemini/gemini-1.5-flash',
  'gemini/gemini-1.5-pro',
] as const

export type ModelId = (typeof VALID_MODELS)[number]

export function isValidModel(value: string): value is ModelId {
  return (VALID_MODELS as readonly string[]).includes(value)
}

export async function getSelectedModel(): Promise<string> {
  const rows = await sql<{ value: string }[]>`
    SELECT value FROM model_config WHERE key = 'selected_model'
  `
  return rows[0]?.value ?? 'gemini/gemini-2.0-flash'
}

export async function setSelectedModel(modelId: string): Promise<void> {
  await sql`
    INSERT INTO model_config (key, value)
    VALUES ('selected_model', ${modelId})
    ON CONFLICT (key)
    DO UPDATE SET value = EXCLUDED.value
  `
}

export { VALID_MODELS }
