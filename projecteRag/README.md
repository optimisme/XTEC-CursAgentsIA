# ProjecteRag

A local RAG (Retrieval-Augmented Generation) workflow that uses an OpenCode-style agent to answer questions from a folder of mixed documents.

## What is RAG?

RAG stands for **Retrieval-Augmented Generation**. It is a pattern where an LLM answers a question by first retrieving relevant information from a knowledge base, then generating a response grounded in that retrieved evidence. This avoids the model relying on its own training data and makes answers verifiable against specific sources.

The flow is:

```
User question
       |
       v
  Search chunks  <── knowledge base (built from docs/)
       |
       v
  Retrieved evidence
       |
       v
  LLM generates answer citing sources
```

## What the MCP server does

The `document-rag` MCP server at `.opencode/mcp/document-rag/` manages the knowledge base and provides tools for the agent:

| Tool | Purpose |
|------|---------|
| `index_documents` | Scan `docs/`, extract text, chunk it, store in `knowledge/` |
| `list_documents` | List all indexed documents with metadata |
| `search_chunks` | Keyword search across all chunks |
| `read_chunk` | Retrieve a single chunk's full text by ID |
| `get_document_info` | Get metadata and all chunks for a specific file |

The agent uses these tools to retrieve evidence before answering.

## Why keyword search instead of embeddings?

This project starts with **keyword-based search** (term frequency scoring with substring matching) so students can understand the full RAG flow without needing:

- An embedding model (requires network or local ML setup)
- A vector database (adds deployment complexity)
- GPU or specialised hardware

Keyword search is transparent: you can see exactly why a chunk matched (which terms, how often) and experiment with scoring parameters. Once this flow is understood, swapping in embeddings is a natural next step (see "Future improvements" below).

## Project structure

```
.opencode/
  agents/
    rag-assistant.md      # Agent that answers using only document evidence
    rag-reviewer.md       # Agent that verifies answers against evidence
  commands/
    ingest-docs.md        # Command: index documents
    ask-docs.md           # Command: ask a question
    debug-rag.md          # Command: debug retrieved chunks
    verify-answer.md      # Command: verify an answer's claims
  skills/
    rag-search/           # How to search effectively
    source-grounding/     # How to cite sources
    file-format-handling/ # Format limitations
  mcp/document-rag/
    server.js             # MCP server entry point
    src/
      ingest.js           # Document ingestion pipeline
      search.js           # Search and retrieval logic
      readers/
        markdown.js       # .md and .txt reader
        pdf.js            # .pdf reader
        docx.js           # .docx reader
        xlsx.js           # .xlsx reader
docs/                     # Place source documents here
knowledge/
  chunks.json             # All text chunks with metadata
  index.json              # Document index with file info
```

## How to install dependencies

```bash
npm install
```

This installs the MCP SDK, plus parsers for PDF (`pdf-parse`), Word (`mammoth`), and Excel (`xlsx`).

## How to index documents

1. Place your source files in the `docs/` folder (supported: `.md`, `.txt`, `.pdf`, `.docx`, `.xlsx`).
2. Run the ingestion via the MCP server:

```bash
npm run ingest
```

Or through the agent by using the `ingest-docs` command.

The ingestion process reads each file, extracts text, splits it into chunks (~1000 characters each), and writes the result to `knowledge/chunks.json` and `knowledge/index.json`.

## How to run the MCP server

```bash
npm run start:mcp
```

This starts the server on stdio, ready to receive JSON-RPC messages from the OpenCode agent.

## How to ask questions through the agent

Use the `ask-docs` command with your question. The agent will:

1. Search for relevant chunks via `search_chunks`
2. Read the most promising chunks via `read_chunk`
3. Generate an answer citing file names and chunk IDs
4. Refuse to answer if no supporting evidence is found

## How to debug retrieved chunks

Use the `debug-rag` command with your query. It shows:

- The top-ranked chunks with their scores
- Which terms matched in each chunk
- Why the score is high or low
- Results from alternative search terms

This is useful for tuning chunk sizes or understanding why a query did not return useful results.

## Format limitations

| Format | Limitation |
|--------|-----------|
| **PDF** | Tables, columns, headers, and footers lose layout. Images and charts are not extracted. Multi-column text may be jumbled. |
| **DOCX** | Table cell boundaries are lost — cells are concatenated into a single text flow. Headers, footers, images, and complex formatting are not preserved. |
| **XLSX** | Each row is flattened to tab-separated text. Cell relationships are not inferred. Sheet name and row number are preserved as metadata. |

Markdown and plain text files extract cleanly with no structural loss.

## Future improvements

- **Embeddings** — replace keyword scoring with vector similarity using a local embedding model (e.g. `@xenova/transformers` or `ollama`).
- **Vector database** — store embeddings in `sqlite-vec`, `chromadb`, or similar for efficient similarity search.
- **Hybrid search** — combine keyword and vector scores for better retrieval quality.
- **OCR** — add Tesseract or similar for PDFs that contain scanned images instead of text.
- **Better spreadsheet tools** — infer table structure, allow cell-level references, and support formulas.
- **Document watching** — automatically re-index when files in `docs/` change.
- **Chunking strategies** — experiment with semantic chunking, sentence-window overlap, or recursive splitting.
