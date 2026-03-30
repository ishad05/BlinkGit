import { Octokit } from '@octokit/core'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GitHubContext {
  owner: string
  repo: string
  fileTree: string
  readme: string
  issues: Array<{ title: string; url: string; body: string }>
}

interface TreeItem {
  path: string
  type: string
  sha: string
  size?: number
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

const SKIP_DIRS = new Set([
  'node_modules', 'dist', 'build', '.git', '__pycache__',
  '.next', '.nuxt', 'vendor', 'coverage', '.cache', '.turbo',
  'target', 'venv', '.venv', 'env', 'out', '.gradle',
  'bower_components', 'jspm_packages', '.parcel-cache',
])

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.bmp', '.tiff', '.svg',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.pdf', '.zip', '.tar', '.gz', '.7z', '.rar',
  '.exe', '.dll', '.so', '.dylib', '.class', '.jar', '.bin',
  '.pyc', '.pyo', '.pyd',
  '.mp3', '.mp4', '.wav', '.avi', '.mov', '.mkv',
  '.sqlite', '.db', '.lock',
])

function isBinary(filePath: string): boolean {
  const dot = filePath.lastIndexOf('.')
  if (dot === -1) return false
  return BINARY_EXTENSIONS.has(filePath.slice(dot).toLowerCase())
}

// ---------------------------------------------------------------------------
// URL parser
// ---------------------------------------------------------------------------

export function parseGitHubUrl(url: string): { owner: string; repo: string } {
  const match = url
    .trim()
    .match(/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?(\/.*)?$/)
  if (!match) throw new Error(`Invalid GitHub URL: ${url}`)
  return { owner: match[1], repo: match[2] }
}

// ---------------------------------------------------------------------------
// File tree (top 2 levels)
// ---------------------------------------------------------------------------

async function fetchFileTree(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<string> {
  const rootRes = await octokit.request(
    'GET /repos/{owner}/{repo}/git/trees/{tree_sha}',
    { owner, repo, tree_sha: 'HEAD' },
  )

  const rootItems = rootRes.data.tree as TreeItem[]

  const rootFiles: string[] = []
  const dirsToFetch: TreeItem[] = []

  for (const item of rootItems) {
    if (item.type === 'tree') {
      if (!SKIP_DIRS.has(item.path)) dirsToFetch.push(item)
    } else {
      if (!isBinary(item.path)) rootFiles.push(item.path)
    }
  }

  // Fetch all subdirectories in parallel, capped at 20
  const subdirResults = await Promise.all(
    dirsToFetch.slice(0, 20).map(async (dir) => {
      try {
        const subRes = await octokit.request(
          'GET /repos/{owner}/{repo}/git/trees/{tree_sha}',
          { owner, repo, tree_sha: dir.sha },
        )
        const subItems = subRes.data.tree as TreeItem[]
        const subLines: string[] = []
        for (const sub of subItems) {
          if (sub.type === 'tree') {
            if (!SKIP_DIRS.has(sub.path)) subLines.push(`  ${sub.path}/`)
          } else {
            if (!isBinary(sub.path)) subLines.push(`  ${sub.path}`)
          }
        }
        return { dir: dir.path, lines: subLines }
      } catch {
        return { dir: dir.path, lines: [] }
      }
    }),
  )

  const lines: string[] = []
  for (const { dir, lines: subLines } of subdirResults) {
    lines.push(`${dir}/`)
    lines.push(...subLines)
  }
  lines.push(...rootFiles)

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// README
// ---------------------------------------------------------------------------

async function fetchReadme(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<string> {
  try {
    const res = await octokit.request('GET /repos/{owner}/{repo}/readme', {
      owner,
      repo,
    })
    const data = res.data as { content: string; encoding: string }
    return Buffer.from(data.content, 'base64').toString('utf-8')
  } catch {
    return ''
  }
}

// ---------------------------------------------------------------------------
// Single source file — exported so the agent can use it as a tool in Phase 4
// ---------------------------------------------------------------------------

export async function fetchSourceFile(
  owner: string,
  repo: string,
  filePath: string,
  githubToken: string,
): Promise<string> {
  const octokit = new Octokit({ auth: githubToken })
  const res = await octokit.request(
    'GET /repos/{owner}/{repo}/contents/{path}',
    { owner, repo, path: filePath },
  )
  const data = res.data as { content?: string; type?: string }
  if (data.type !== 'file' || !data.content) {
    throw new Error(`${filePath} is not a readable file`)
  }
  return Buffer.from(data.content, 'base64').toString('utf-8')
}

// ---------------------------------------------------------------------------
// Issues
// ---------------------------------------------------------------------------

async function fetchIssues(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<Array<{ title: string; url: string; body: string }>> {
  const res = await octokit.request('GET /repos/{owner}/{repo}/issues', {
    owner,
    repo,
    state: 'open',
    per_page: 50,
  })

  // GitHub's issues API returns pull requests too — filter them out
  const issues = (
    res.data as Array<{
      title: string
      html_url: string
      body: string | null
      pull_request?: unknown
    }>
  ).filter((item) => !item.pull_request)

  return issues.map((issue) => ({
    title: issue.title,
    url: issue.html_url,
    body: (issue.body ?? '').slice(0, 500),
  }))
}

// ---------------------------------------------------------------------------
// Main export — fetches everything needed for the initial agent context
// ---------------------------------------------------------------------------

export async function fetchRepoContext(
  repoUrl: string,
  githubToken: string,
): Promise<GitHubContext> {
  const { owner, repo } = parseGitHubUrl(repoUrl)
  const octokit = new Octokit({ auth: githubToken })

  const [fileTree, readme, issues] = await Promise.all([
    fetchFileTree(octokit, owner, repo),
    fetchReadme(octokit, owner, repo),
    fetchIssues(octokit, owner, repo),
  ])

  return { owner, repo, fileTree, readme, issues }
}
