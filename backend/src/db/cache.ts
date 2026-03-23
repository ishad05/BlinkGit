// TODO: implement PostgreSQL cache for repo analyses
// All SQL for the analysis cache lives here — never write raw SQL elsewhere.
//
// Schema (run once on Railway):
//   CREATE TABLE IF NOT EXISTS analysis_cache (
//     repo_url  TEXT PRIMARY KEY,
//     result    JSONB NOT NULL,
//     cached_at TIMESTAMPTZ NOT NULL DEFAULT now()
//   );

import type { Analysis } from '../agent/schema.js'

export async function getCachedAnalysis(
  _repoUrl: string,
): Promise<Analysis | null> {
  // TODO: query analysis_cache by repo_url
  return null
}

export async function setCachedAnalysis(
  _repoUrl: string,
  _analysis: Analysis,
): Promise<void> {
  // TODO: upsert into analysis_cache
}
