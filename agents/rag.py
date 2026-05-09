"""RAG over the runbooks knowledge base.

Why BM25 instead of embeddings:
  - Zero API calls -> no extra cost, no extra credentials, works offline.
  - No torch / sentence-transformers dependency (~2 GB install) -- great for a
    hackathon environment.
  - For a curated KB of ~10 documents, BM25 keyword retrieval is genuinely
    competitive with semantic search.

When to upgrade to semantic embeddings:
  - When the runbook KB grows past ~50 docs and queries miss relevant ones
    that use different wording.
  - When you want cross-language retrieval.
  - Drop-in replacement: swap _build_index() for any LangChain VectorStore
    (Chroma, FAISS, InMemoryVectorStore) and update retrieve() accordingly.

How it works:
  1. At import time we load every .md file under runbooks/.
  2. We chunk each file into sections (split on "## " headers) so retrieval
    can return a focused snippet, not a whole document.
  3. We tokenize each chunk and build a BM25 index.
  4. retrieve(query, k) returns the top-k matching chunks as plain text.
"""
import re
from pathlib import Path
from rank_bm25 import BM25Okapi


# Directory holding the runbook markdown files. Sits at the repo root.
RUNBOOKS_DIR = Path(__file__).resolve().parent.parent / "runbooks"


def _tokenize(text: str) -> list[str]:
    """Lower-case word tokenization. Good enough for keyword matching."""
    # Strip punctuation, lowercase, split on whitespace.
    return re.findall(r"[a-z0-9]+", text.lower())


def _chunk_markdown(text: str, source: str) -> list[dict]:
    """Split a markdown doc into section-sized chunks keyed by ## headers.

    Each chunk gets the source filename prepended so the LLM knows which
    runbook the snippet came from.
    """
    chunks: list[dict] = []
    # Split on "## " headers but keep them attached to the following content.
    sections = re.split(r"\n(?=## )", text)
    for sec in sections:
        sec = sec.strip()
        if not sec:
            continue
        # Skip very short fragments (likely just a title with no body).
        if len(sec) < 50:
            continue
        chunks.append({
            "source": source,
            "text": f"[from {source}]\n{sec}",
        })
    return chunks


def _build_index() -> tuple[BM25Okapi, list[dict]]:
    """Load all runbooks, chunk them, and build the BM25 index once at startup."""
    chunks: list[dict] = []
    if RUNBOOKS_DIR.exists():
        for md_file in sorted(RUNBOOKS_DIR.glob("*.md")):
            text = md_file.read_text(encoding="utf-8")
            chunks.extend(_chunk_markdown(text, md_file.stem))

    if not chunks:
        # No runbooks loaded -- index is empty but won't crash on retrieve().
        return BM25Okapi([["placeholder"]]), []

    tokenized_corpus = [_tokenize(c["text"]) for c in chunks]
    return BM25Okapi(tokenized_corpus), chunks


# Build the index ONCE at import time. Subsequent retrieve() calls are fast.
_INDEX, _CHUNKS = _build_index()


def retrieve(query: str, k: int = 3) -> list[str]:
    """Return the top-k most relevant runbook snippets for the query.

    Args:
        query: incident summary, error message, or any natural language search.
        k: number of snippets to return.

    Returns:
        List of plain-text snippets (already formatted with source attribution).
        Empty list if no runbooks are indexed.
    """
    if not _CHUNKS:
        return []

    tokenized_query = _tokenize(query)
    if not tokenized_query:
        return []

    # BM25 returns a score per chunk; we sort and take the top-k.
    scores = _INDEX.get_scores(tokenized_query)
    ranked = sorted(zip(scores, _CHUNKS), key=lambda x: x[0], reverse=True)
    # Filter out zero-score matches (no keyword overlap at all).
    return [chunk["text"] for score, chunk in ranked[:k] if score > 0]


def kb_size() -> int:
    """How many runbook chunks are currently indexed (useful for the UI)."""
    return len(_CHUNKS)
