import { sql } from './client.js'
import type { Analysis } from '../agent/schema.js'

export async function getCachedAnalysis(repoUrl: string): Promise<Analysis | null> {
  const rows = await sql<{ result: Analysis }[]>`
    SELECT result
    FROM analysis_cache
    WHERE repo_url = ${repoUrl}
  `
  return rows[0]?.result ?? null
}

export async function setCachedAnalysis(repoUrl: string, analysis: Analysis): Promise<void> {
  await sql`
    INSERT INTO analysis_cache (repo_url, result, cached_at)
    VALUES (${repoUrl}, ${JSON.stringify(analysis)}::jsonb, now())
    ON CONFLICT (repo_url)
    DO UPDATE SET
      result    = ${JSON.stringify(analysis)}::jsonb,
      cached_at = now()
  `
}

export async function deleteCachedAnalysis(repoUrl: string): Promise<boolean> {
  const rows = await sql<{ repo_url: string }[]>`
    DELETE FROM analysis_cache WHERE repo_url = ${repoUrl} RETURNING repo_url
  `
  return rows.length > 0
}
