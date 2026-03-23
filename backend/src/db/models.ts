// TODO: implement model config storage in PostgreSQL (replaces Cloudflare KV)
// All SQL for model config lives here — never write raw SQL elsewhere.
//
// Schema (run once on Railway):
//   CREATE TABLE IF NOT EXISTS model_config (
//     key   TEXT PRIMARY KEY,
//     value TEXT NOT NULL
//   );
//   INSERT INTO model_config (key, value) VALUES ('selected_model', 'openai/gpt-4o')
//   ON CONFLICT DO NOTHING;

export async function getSelectedModel(): Promise<string> {
  // TODO: SELECT value FROM model_config WHERE key = 'selected_model'
  return 'openai/gpt-4o'
}

export async function setSelectedModel(_modelId: string): Promise<void> {
  // TODO: UPDATE model_config SET value = $1 WHERE key = 'selected_model'
}
