// TODO: implement AI analysis using streamObject from Vercel AI SDK
// Strategy:
//   - Read selected model from DB via getSelectedModel()
//   - Instantiate the correct provider (openai / anthropic / google)
//   - Build a structured prompt from GitHubContext
//   - Call streamObject() with analysisSchema
//   - Return the stream for the route handler to pipe as SSE

import type { GitHubContext } from './github.js'

export async function analyzeRepo(
  _context: GitHubContext,
  _modelId: string,
  _env: {
    OPENAI_API_KEY: string
    ANTHROPIC_API_KEY: string
    GOOGLE_API_KEY: string
  },
): Promise<ReadableStream> {
  // TODO: implement streamObject call
  throw new Error('analyzeRepo: not implemented')
}
