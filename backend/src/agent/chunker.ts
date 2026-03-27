// ---------------------------------------------------------------------------
// Code Chunker
//
// Splits source files into meaningful units (functions, classes) rather than
// arbitrary character/token counts. This is the core difference from naive RAG.
//
// Supported languages (declaration-aware):
//   - JavaScript / TypeScript / TSX
//   - Python
//
// Fallback: fixed line-window chunking for everything else
// ---------------------------------------------------------------------------

export interface CodeChunk {
  name: string
  type: 'function' | 'class' | 'method' | 'module'
  code: string
  startLine: number  // 1-indexed
  endLine: number    // 1-indexed
}

// ---------------------------------------------------------------------------
// Language detection
// ---------------------------------------------------------------------------

const JS_TS_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.mts', '.cts',
])

const PYTHON_EXTENSIONS = new Set(['.py', '.pyw'])

function getExtension(filePath: string): string {
  const dot = filePath.lastIndexOf('.')
  return dot === -1 ? '' : filePath.slice(dot).toLowerCase()
}

// ---------------------------------------------------------------------------
// JS / TS chunker
//
// Detects:
//   function foo(          — named function declaration
//   async function foo(    — async function declaration
//   export function foo(   — exported function
//   const foo = (          — arrow function
//   const foo = async (    — async arrow function
//   class Foo {            — class declaration
// ---------------------------------------------------------------------------

const JS_DECL = /^[ \t]*(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:(function)\s+(\w+)|(class)\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function\b|\())/

function extractJsTsChunks(content: string): CodeChunk[] {
  const lines = content.split('\n')
  const chunks: CodeChunk[] = []
  let i = 0

  while (i < lines.length) {
    const match = lines[i].match(JS_DECL)

    if (match) {
      // match[2] = function name, match[4] = class name, match[5] = const name
      const name = match[2] ?? match[4] ?? match[5] ?? `chunk_${i + 1}`
      const type: CodeChunk['type'] = match[3] ? 'class' : 'function'
      const startLine = i

      // Walk forward counting braces to find the closing brace
      let depth = 0
      let opened = false
      let j = i

      while (j < lines.length) {
        for (const ch of lines[j]) {
          if (ch === '{') { depth++; opened = true }
          if (ch === '}') depth--
        }
        if (opened && depth === 0) break
        j++
      }

      // If we never found an opening brace (e.g. single-line arrow with no body)
      // treat the single line as the chunk
      const endLine = opened ? j : i

      chunks.push({
        name,
        type,
        code: lines.slice(startLine, endLine + 1).join('\n'),
        startLine: startLine + 1,
        endLine: endLine + 1,
      })

      i = endLine + 1
    } else {
      i++
    }
  }

  return chunks
}

// ---------------------------------------------------------------------------
// Python chunker
//
// Detects:
//   def foo(       — function
//   async def foo( — async function
//   class Foo:     — class
//
// End of a block = first non-empty line at same or lower indentation
// ---------------------------------------------------------------------------

const PY_DECL = /^([ \t]*)(?:async\s+)?(?:(def)\s+(\w+)|(class)\s+(\w+))/

function extractPythonChunks(content: string): CodeChunk[] {
  const lines = content.split('\n')
  const chunks: CodeChunk[] = []
  let i = 0

  while (i < lines.length) {
    const match = lines[i].match(PY_DECL)

    if (match) {
      const baseIndent = match[1].length
      const name = match[3] ?? match[5] ?? `chunk_${i + 1}`
      const type: CodeChunk['type'] = match[4] ? 'class' : 'function'
      const startLine = i

      let j = i + 1
      while (j < lines.length) {
        const line = lines[j]
        if (line.trim() === '') { j++; continue }           // skip blank lines
        const indent = line.match(/^([ \t]*)/)?.[1].length ?? 0
        if (indent <= baseIndent) break                     // back to outer scope
        j++
      }

      const endLine = j - 1

      chunks.push({
        name,
        type,
        code: lines.slice(startLine, endLine + 1).join('\n'),
        startLine: startLine + 1,
        endLine: endLine + 1,
      })

      i = endLine + 1
    } else {
      i++
    }
  }

  return chunks
}

// ---------------------------------------------------------------------------
// Fallback: fixed-size line windows for unsupported languages
// ---------------------------------------------------------------------------

const FALLBACK_WINDOW = 60

function extractGenericChunks(content: string): CodeChunk[] {
  const lines = content.split('\n')
  const chunks: CodeChunk[] = []

  for (let i = 0; i < lines.length; i += FALLBACK_WINDOW) {
    const end = Math.min(i + FALLBACK_WINDOW, lines.length)
    chunks.push({
      name: `lines_${i + 1}_${end}`,
      type: 'module',
      code: lines.slice(i, end).join('\n'),
      startLine: i + 1,
      endLine: end,
    })
  }

  return chunks
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Chunks a source file into meaningful units.
 * Falls back to fixed-size line windows for unsupported languages.
 *
 * Returns an empty array for empty files.
 */
export function chunkFile(filePath: string, content: string): CodeChunk[] {
  if (!content.trim()) return []

  const ext = getExtension(filePath)

  let chunks: CodeChunk[]

  if (JS_TS_EXTENSIONS.has(ext)) {
    chunks = extractJsTsChunks(content)
  } else if (PYTHON_EXTENSIONS.has(ext)) {
    chunks = extractPythonChunks(content)
  } else {
    chunks = extractGenericChunks(content)
  }

  // If declaration-aware parsing found nothing (e.g. a file of only imports),
  // fall back to the generic windowed approach
  if (chunks.length === 0) {
    chunks = extractGenericChunks(content)
  }

  return chunks
}
