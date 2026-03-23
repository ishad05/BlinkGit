// TODO: implement GitHub data fetching
// Strategy:
//   - Parse owner/repo from GitHub URL
//   - Fetch file tree (top 2 levels only — never full tree)
//   - Fetch README.md content
//   - Fetch up to 5 key source files (entry points, config, main modules)
//   - Fetch open issues capped at 50
//   - Return structured context object for the prompt

export interface GitHubContext {
  owner: string
  repo: string
  fileTree: string
  readme: string
  sourceFiles: Array<{ path: string; content: string }>
  issues: Array<{ title: string; url: string; body: string }>
}

export async function fetchRepoContext(
  _repoUrl: string,
  _githubToken: string,
): Promise<GitHubContext> {
  // TODO: use @octokit/core to fetch repo data
  throw new Error('fetchRepoContext: not implemented')
}
