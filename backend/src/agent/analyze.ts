import { generateObject } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import {
  overviewSchema,
  architectureSchema,
  setupSchema,
  issuesSchema,
} from './schema.js'
import type { GitHubContext } from './github.js'
import type { Analysis } from './schema.js'

const README_LIMIT = 4_000   // chars
const ISSUE_BODY_LIMIT = 300 // chars per issue body

// ---------------------------------------------------------------------------
// Focused prompts — each only receives the data it actually needs
// ---------------------------------------------------------------------------

function buildOverviewPrompt(ctx: GitHubContext): string {
  const readme = ctx.readme.length > README_LIMIT
    ? ctx.readme.slice(0, README_LIMIT) + '\n... (truncated)'
    : ctx.readme

  return `You are a senior software engineer analysing the GitHub repository ${ctx.owner}/${ctx.repo}.

### File Structure
\`\`\`
${ctx.fileTree}
\`\`\`

### README
${readme || '(no README found)'}

Produce an overview of this repository:
- \`purpose\`: one sentence describing what it does
- \`techStack\`: list of key technologies/frameworks
- \`keyFiles\`: the 3-5 most important files to understand the codebase
- \`highlights\`: 2-4 notable things about the project
- \`useCases\`: 3-5 bullet points on who uses this and what problems it solves
- \`coreWorkflow\`: 2-4 sentence narrative of how data/requests flow end-to-end
- \`majorModules\`: up to 5 significant components, each with name, one-line description, and type (service/ui/api/config/database/middleware/util)`
}

function buildArchitecturePrompt(ctx: GitHubContext): string {
  const readme = ctx.readme.length > README_LIMIT
    ? ctx.readme.slice(0, README_LIMIT) + '\n... (truncated)'
    : ctx.readme

  return `You are a senior software engineer analysing the GitHub repository ${ctx.owner}/${ctx.repo}.

### File Structure
\`\`\`
${ctx.fileTree}
\`\`\`

### README
${readme || '(no README found)'}

Produce an architecture diagram as nodes and directed edges.
- Identify 5–12 key components: services, modules, layers, data stores, external APIs
- Node types: service | module | database | external | frontend | backend | config | api | middleware | util
- For each node provide: a short label, its type, and a one-sentence description of what it does
- Edge labels: verbs like calls, reads, writes, extends, imports, streams
- Use short, descriptive labels`
}

function buildSetupPrompt(ctx: GitHubContext): string {
  const readme = ctx.readme.length > README_LIMIT
    ? ctx.readme.slice(0, README_LIMIT) + '\n... (truncated)'
    : ctx.readme

  return `You are a senior software engineer analysing the GitHub repository ${ctx.owner}/${ctx.repo}.

### README
${readme || '(no README found)'}

Extract the setup guide:
- \`prerequisites\`: required runtimes, tools, or accounts (e.g. "Node.js 20+", "Docker")
- \`steps\`: numbered install steps, each with a short \`label\` and the exact terminal \`command\`
- \`envVars\`: required environment variables with \`key\` and \`description\` — never include real values
- \`runCommand\`: the single command to start the project locally`
}

function buildIssuesPrompt(ctx: GitHubContext): string {
  const issuesList = ctx.issues.length === 0
    ? 'No open issues.'
    : ctx.issues.map((issue, i) =>
        `${i + 1}. [${issue.title}](${issue.url})\n   ${issue.body.slice(0, ISSUE_BODY_LIMIT)}`
      ).join('\n\n')

  return `You are a senior software engineer analysing the GitHub repository ${ctx.owner}/${ctx.repo}.

### Open Issues (${ctx.issues.length})
${issuesList}

Classify each issue by difficulty:
- \`beginner\`: small scope, well-defined, good for first-time contributors
- \`moderate\`: requires understanding of the codebase, some domain knowledge
- \`high\`: architectural changes, deep domain expertise, or unclear scope

Return all issues with their original title and URL, difficulty, and a one-sentence reason.`
}

// ---------------------------------------------------------------------------
// Section event — what gets sent over SSE for each completed section
// ---------------------------------------------------------------------------

export type SectionEvent =
  | { section: 'overview'; payload: Analysis['overview'] }
  | { section: 'architecture'; payload: Analysis['architecture'] }
  | { section: 'setup'; payload: Analysis['setup'] }
  | { section: 'issues'; payload: Analysis['issues'] }

// ---------------------------------------------------------------------------
// Main export
// Runs 4 generateObject calls in order: overview → architecture → setup → issues
// Calls onSection as each one completes so the route can flush it to the client
// ---------------------------------------------------------------------------

export async function analyzeRepo(
  context: GitHubContext,
  modelId: string,
  googleApiKey: string,
  onSection: (event: SectionEvent) => void,
): Promise<Analysis> {
  const google = createGoogleGenerativeAI({ apiKey: googleApiKey })
  const modelName = modelId.includes('/') ? modelId.split('/').slice(1).join('/') : modelId
  const model = google(modelName)

  const overviewResult = await generateObject({
    model,
    schema: overviewSchema,
    prompt: buildOverviewPrompt(context),
  })
  onSection({ section: 'overview', payload: overviewResult.object })

  const archResult = await generateObject({
    model,
    schema: architectureSchema,
    prompt: buildArchitecturePrompt(context),
  })
  onSection({ section: 'architecture', payload: archResult.object })

  const setupResult = await generateObject({
    model,
    schema: setupSchema,
    prompt: buildSetupPrompt(context),
  })
  onSection({ section: 'setup', payload: setupResult.object })

  const issuesResult = await generateObject({
    model,
    schema: issuesSchema,
    prompt: buildIssuesPrompt(context),
  })
  onSection({ section: 'issues', payload: issuesResult.object.items })

  return {
    overview: overviewResult.object,
    architecture: archResult.object,
    setup: setupResult.object,
    issues: issuesResult.object.items,
  }
}
