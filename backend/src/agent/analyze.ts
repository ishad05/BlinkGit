import { streamObject } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { analysisSchema } from './schema.js'
import type { GitHubContext } from './github.js'

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

const README_LIMIT = 8_000   // chars — avoids blowing the context on huge READMEs
const ISSUE_BODY_LIMIT = 300 // chars per issue body in the prompt

function buildPrompt(ctx: GitHubContext): string {
  const readme = ctx.readme.length > README_LIMIT
    ? ctx.readme.slice(0, README_LIMIT) + '\n... (truncated)'
    : ctx.readme

  const issuesList = ctx.issues.length === 0
    ? 'No open issues.'
    : ctx.issues.map((issue, i) =>
        `${i + 1}. [${issue.title}](${issue.url})\n   ${issue.body.slice(0, ISSUE_BODY_LIMIT)}`
      ).join('\n\n')

  return `You are a senior software engineer performing a deep analysis of a GitHub repository.

## Repository: ${ctx.owner}/${ctx.repo}

### File Structure
\`\`\`
${ctx.fileTree}
\`\`\`

### README
${readme || '(no README found)'}

### Open Issues (${ctx.issues.length})
${issuesList}

---

Produce a structured analysis with five parts:

1. **Overview** — What this repo does, its tech stack, the most important files, and 2-4 highlights worth knowing. Also include:
   - \`useCases\`: 3-5 bullet points describing who uses this and what problems it solves
   - \`coreWorkflow\`: a 2-4 sentence narrative of how data or requests flow through the system end-to-end
   - \`majorModules\`: 4-8 significant components/services/layers, each with a name, one-line description, and a type from: \`service\`, \`ui\`, \`api\`, \`config\`, \`database\`, \`middleware\`, \`util\`

2. **Setup guide** — Extract from the README, package.json, Makefile, Dockerfile, or any config files:
   - \`prerequisites\`: list of required runtimes, tools, or accounts (e.g. "Node.js 20+", "Docker", "PostgreSQL")
   - \`steps\`: numbered installation steps, each with a short \`label\` and the exact terminal \`command\`
   - \`envVars\`: required environment variables with their \`key\` and a \`description\` (never include real values)
   - \`runCommand\`: the single command to start the project locally (e.g. \`npm run dev\`)

3. **Issue difficulty** — For every issue listed above, classify it as:
   - \`beginner\`: small scope, well-defined, good for first-time contributors
   - \`moderate\`: requires understanding of the codebase, some domain knowledge
   - \`high\`: architectural changes, deep domain expertise, or unclear scope
   Include a one-sentence reason for each rating.

4. **Architecture diagram** — Identify the key components (services, modules, layers, data stores, external APIs) as nodes, and their relationships as directed edges. Use short, descriptive labels. Aim for 5–12 nodes.
   - Node types: use one of: \`service\`, \`module\`, \`database\`, \`external\`, \`frontend\`, \`backend\`, \`config\`
   - Edge labels: use verbs like \`calls\`, \`reads\`, \`writes\`, \`extends\`, \`imports\``
}

// ---------------------------------------------------------------------------
// Main export
// The route calls analyzeRepo(), then pipes the stream to the client via SSE.
// ---------------------------------------------------------------------------

export function analyzeRepo(
  context: GitHubContext,
  modelId: string,
  googleApiKey: string,
) {
  const google = createGoogleGenerativeAI({ apiKey: googleApiKey })
  // modelId is stored as "gemini/gemini-2.0-flash" — strip the provider prefix
  const modelName = modelId.includes('/') ? modelId.split('/').slice(1).join('/') : modelId

  return streamObject({
    model: google(modelName),
    schema: analysisSchema,
    prompt: buildPrompt(context),
  })
}
