// ---------------------------------------------------------------------------
// Embeddings — Gemini gemini-embedding-001 + pgvector storage + semantic search
//
// Requires pgvector to be installed on your PostgreSQL instance.
// Railway provides this out of the box. Local: brew install pgvector
// ---------------------------------------------------------------------------

import { GoogleGenerativeAI } from '@google/generative-ai'
import { sql } from '../db/client.js'
import type { CodeChunk } from './chunker.js'

// gemini-embedding-001 produces 3072-dimensional vectors by default
const EMBEDDING_MODEL = 'gemini-embedding-001'

// ---------------------------------------------------------------------------
// Embed a single text string
// ---------------------------------------------------------------------------

export async function embedText(text: string, apiKey: string): Promise<number[]> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL })
  const result = await model.embedContent(text)
  return result.embedding.values
}

// ---------------------------------------------------------------------------
// Embed a batch of chunks
// Gemini supports batch embedding — more efficient than one call per chunk
// ---------------------------------------------------------------------------

// Gemini batch embedding API limit
const BATCH_SIZE = 50

export async function embedChunks(
  chunks: CodeChunk[],
  apiKey: string,
): Promise<number[][]> {
  if (chunks.length === 0) return []

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL })
  const allEmbeddings: number[][] = []

  // Process in batches to stay within Gemini API limits
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE)
    const result = await model.batchEmbedContents({
      requests: batch.map((chunk) => ({
        content: {
          role: 'user',
          parts: [{ text: `${chunk.type} ${chunk.name}:\n${chunk.code}` }],
        },
      })),
    })
    allEmbeddings.push(...result.embeddings.map((e) => e.values))
  }

  return allEmbeddings
}

// ---------------------------------------------------------------------------
// Store chunks + embeddings in pgvector
// ---------------------------------------------------------------------------

export async function storeChunks(
  repoUrl: string,
  filePath: string,
  chunks: CodeChunk[],
  embeddings: number[][],
): Promise<void> {
  // Wrap in a transaction — if any insert fails, none are committed
  // Cast needed: postgres types lose Sql's call signature via Omit<Sql, ...>
  await sql.begin(async (txSql) => {
    const tx = txSql as unknown as typeof sql
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const embedding = embeddings[i]
      // pgvector expects the format [0.1,0.2,...] as a string literal
      const vectorLiteral = `[${embedding.join(',')}]`

      await tx`
        INSERT INTO code_chunks (repo_url, file_path, chunk_name, chunk_type, content, embedding)
        VALUES (
          ${repoUrl},
          ${filePath},
          ${chunk.name},
          ${chunk.type},
          ${chunk.code},
          ${sql.unsafe(`'${vectorLiteral}'::vector`)}
        )
        ON CONFLICT (repo_url, file_path, chunk_name)
        DO UPDATE SET
          content   = EXCLUDED.content,
          embedding = EXCLUDED.embedding
      `
    }
  })
}

// ---------------------------------------------------------------------------
// Semantic search — find the most relevant chunks for a query
// ---------------------------------------------------------------------------

export interface SearchResult {
  filePath: string
  chunkName: string
  chunkType: string
  content: string
  similarity: number
}

export async function searchChunks(
  repoUrl: string,
  query: string,
  apiKey: string,
  limit = 5,
): Promise<SearchResult[]> {
  const queryEmbedding = await embedText(query, apiKey)
  const vectorLiteral = `[${queryEmbedding.join(',')}]`

  const rows = await sql<SearchResult[]>`
    SELECT
      file_path   AS "filePath",
      chunk_name  AS "chunkName",
      chunk_type  AS "chunkType",
      content,
      1 - (embedding <=> ${sql.unsafe(`'${vectorLiteral}'::vector`)}) AS similarity
    FROM code_chunks
    WHERE repo_url = ${repoUrl}
    ORDER BY embedding <=> ${sql.unsafe(`'${vectorLiteral}'::vector`)}
    LIMIT ${limit}
  `

  return rows
}

// ---------------------------------------------------------------------------
// Delete all chunks for a repo (used when re-indexing)
// ---------------------------------------------------------------------------

export async function deleteChunks(repoUrl: string): Promise<void> {
  await sql`DELETE FROM code_chunks WHERE repo_url = ${repoUrl}`
}
