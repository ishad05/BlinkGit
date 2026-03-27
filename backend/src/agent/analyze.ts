// TODO: implement in Phase 4 — Gemini agentic tool-use loop
// Strategy:
//   - Read selected model from DB via getSelectedModel()
//   - Give Gemini tools: get_repo_structure, read_source_file, search_code, get_issues
//   - Run agentic loop until model produces final structured output
//   - Validate output against analysisSchema
//   - Stream partial results back as SSE

import type { GitHubContext } from './github.js'
import type { Analysis } from './schema.js'

export async function analyzeRepo(
  _context: GitHubContext,
  _modelId: string,
  _googleApiKey: string,
): Promise<Analysis> {
  // TODO: implement Gemini tool-use agentic loop
  throw new Error('analyzeRepo: not implemented — Phase 4')
}
