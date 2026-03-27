import { sql } from './client.js'

async function migrate() {
  console.log('Running migrations...')

  // Enable pgvector extension (needed in Phase 3 for embeddings)
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS vector`
    console.log('✓ pgvector extension ready')
  } catch {
    console.warn('⚠ pgvector not available — skipping (required for Phase 3 embeddings only)')
  }

  // Model config — stores selected LLM (e.g. "gemini/gemini-2.0-flash")
  await sql`
    CREATE TABLE IF NOT EXISTS model_config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `
  await sql`
    INSERT INTO model_config (key, value)
    VALUES ('selected_model', 'gemini/gemini-2.0-flash')
    ON CONFLICT (key) DO NOTHING
  `
  console.log('✓ model_config table ready')

  // Analysis cache — stores completed repo analyses to avoid re-running
  await sql`
    CREATE TABLE IF NOT EXISTS analysis_cache (
      repo_url  TEXT PRIMARY KEY,
      result    JSONB NOT NULL,
      cached_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  console.log('✓ analysis_cache table ready')

  // Code chunks + embeddings — used in Phase 3 for context-aware Q&A
  // vector(768) matches Gemini text-embedding-004 output dimensions
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS code_chunks (
        id         BIGSERIAL PRIMARY KEY,
        repo_url   TEXT NOT NULL,
        file_path  TEXT NOT NULL,
        chunk_name TEXT NOT NULL,
        chunk_type TEXT NOT NULL,
        content    TEXT NOT NULL,
        embedding  vector(768),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (repo_url, file_path, chunk_name)
      )
    `
    await sql`
      CREATE INDEX IF NOT EXISTS code_chunks_repo_idx
      ON code_chunks (repo_url)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS code_chunks_embedding_idx
      ON code_chunks USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100)
    `
    console.log('✓ code_chunks table ready')
  } catch {
    console.warn('⚠ code_chunks table skipped — requires pgvector (Phase 3)')
  }

  console.log('\nAll migrations complete.')
  await sql.end()
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
