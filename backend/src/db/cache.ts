import { sql } from './client.js'
import type { Analysis } from '../agent/schema.js'

export async function getCachedAnalysis(repoUrl: string): Promise<Analysis | null> {
  const rows = await sql<{ result: Analysis | string }[]>`
    SELECT result
    FROM analysis_cache
    WHERE repo_url = ${repoUrl}
  `
  const raw = rows[0]?.result
  if (raw == null) return null
  // Handle legacy rows stored as a JSON string instead of a JSONB object
  return (typeof raw === 'string' ? JSON.parse(raw) : raw) as Analysis
}

export async function setCachedAnalysis(repoUrl: string, analysis: Analysis): Promise<void> {
  // Use sql.json() so postgres.js stores the object as a proper JSONB object
  // (not a double-encoded JSON string).
  const value = sql.json(analysis)
  await sql`
    INSERT INTO analysis_cache (repo_url, result, cached_at)
    VALUES (${repoUrl}, ${value}, now())
    ON CONFLICT (repo_url)
    DO UPDATE SET
      result    = ${value},
      cached_at = now()
  `
}

export async function deleteCachedAnalysis(repoUrl: string): Promise<boolean> {
  const rows = await sql<{ repo_url: string }[]>`
    DELETE FROM analysis_cache WHERE repo_url = ${repoUrl} RETURNING repo_url
  `
  return rows.length > 0
}
