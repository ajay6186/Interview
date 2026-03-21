# ============================================================
# Exercise 3.3 — Embeddings & RAG (Retrieval-Augmented Generation)
# ============================================================
#
# Prerequisites:
#   pip install numpy scikit-learn
#   (Optional) pip install sentence-transformers faiss-cpu
#
# Topics:
#   • What are embeddings (concept)
#   • Creating embeddings with TF-IDF (sklearn, no GPU required)
#   • Cosine similarity between embeddings
#   • FAISS-like vector search (k-nearest neighbour with numpy)
#   • Building a knowledge base (list of documents)
#   • Retrieval step: find top-k relevant documents
#   • Augmentation: combine retrieved docs with query
#   • Generation: format context + query as a prompt
#   • Chunking documents for RAG
#   • Evaluating RAG retrieval quality
# ============================================================

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer


# ---------------------------------------------------------------------------
# TODO 1: Explain embeddings (conceptual)
# ---------------------------------------------------------------------------
# Return a dict with keys "definition", "why_useful", "example" that
# explains what an embedding is in plain language.
def explain_embeddings() -> dict[str, str]:
    """Return a plain-language explanation of what embeddings are."""
    pass  # TODO 1


# ---------------------------------------------------------------------------
# TODO 2: Build a TF-IDF embedding model
# ---------------------------------------------------------------------------
# Fit a TfidfVectorizer on `documents` and return (vectorizer, matrix) where:
#   - vectorizer: the fitted TfidfVectorizer
#   - matrix: a numpy array of shape (n_docs, vocab_size)
def build_tfidf_embeddings(documents: list[str]) -> tuple:
    """Fit TF-IDF on documents and return (vectorizer, embedding_matrix)."""
    pass  # TODO 2


# ---------------------------------------------------------------------------
# TODO 3: Embed a single query
# ---------------------------------------------------------------------------
# Use an already-fitted `vectorizer` to transform a single `query` string
# into a 1-D numpy array (the embedding vector).
def embed_query(vectorizer: TfidfVectorizer, query: str) -> np.ndarray:
    """Return the TF-IDF embedding of `query` as a 1-D numpy array."""
    pass  # TODO 3


# ---------------------------------------------------------------------------
# TODO 4: Cosine similarity
# ---------------------------------------------------------------------------
# Compute the cosine similarity between two 1-D numpy vectors a and b.
# Formula: cos(θ) = (a · b) / (‖a‖ · ‖b‖)
# Return a float in [-1, 1]. Return 0.0 if either vector has zero norm.
def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Return the cosine similarity between vectors a and b."""
    pass  # TODO 4


# ---------------------------------------------------------------------------
# TODO 5: Pairwise similarity matrix
# ---------------------------------------------------------------------------
# Given an embedding matrix of shape (n, d), return an (n, n) numpy array
# where entry [i, j] is the cosine similarity between row i and row j.
def similarity_matrix(embeddings: np.ndarray) -> np.ndarray:
    """Return the n×n pairwise cosine similarity matrix for `embeddings`."""
    pass  # TODO 5


# ---------------------------------------------------------------------------
# TODO 6: k-Nearest Neighbour search (FAISS-like)
# ---------------------------------------------------------------------------
# Given:
#   - query_vec   : 1-D numpy array (the query embedding)
#   - doc_matrix  : 2-D numpy array (n_docs × embedding_dim)
#   - k           : int — number of top results to return
# Return a list of (index, similarity_score) tuples sorted by similarity
# descending. Implement this with numpy (no FAISS library needed).
def knn_search(
    query_vec: np.ndarray,
    doc_matrix: np.ndarray,
    k: int = 3,
) -> list[tuple[int, float]]:
    """Return the top-k (doc_index, score) pairs for the query vector."""
    pass  # TODO 6


# ---------------------------------------------------------------------------
# TODO 7: Build a knowledge base
# ---------------------------------------------------------------------------
# A knowledge base is just a list of document strings.
# Return a list of at least 8 short factual sentences covering different
# topics (science, history, technology, etc.) — these will be used as the
# retrieval corpus in the rest of the exercise.
def build_knowledge_base() -> list[str]:
    """Return a list of at least 8 factual documents for the knowledge base."""
    pass  # TODO 7


# ---------------------------------------------------------------------------
# TODO 8: Retrieval step — find top-k relevant documents
# ---------------------------------------------------------------------------
# Given a `query` string and a pre-built knowledge base + vectorizer,
# return the top-k most relevant (document_string, score) pairs.
def retrieve(
    query: str,
    documents: list[str],
    vectorizer: TfidfVectorizer,
    doc_matrix: np.ndarray,
    k: int = 3,
) -> list[tuple[str, float]]:
    """Return the top-k (document, score) pairs most relevant to `query`."""
    pass  # TODO 8


# ---------------------------------------------------------------------------
# TODO 9: Augmentation — build the RAG context string
# ---------------------------------------------------------------------------
# Combine the retrieved documents and the original query into a single
# context string that can be prepended to a generation prompt.
# Format the output clearly so an LLM can use it as grounding context.
def build_rag_context(
    query: str,
    retrieved_docs: list[tuple[str, float]],
) -> str:
    """Return a formatted context string combining retrieved docs + query."""
    pass  # TODO 9


# ---------------------------------------------------------------------------
# TODO 10: Generation — format the final RAG prompt
# ---------------------------------------------------------------------------
# Take the `context` string produced by build_rag_context and wrap it in
# a full prompt that instructs the LLM to answer ONLY from the context.
# Return the complete prompt string (no actual API call needed).
def build_rag_prompt(context: str) -> str:
    """Return a full RAG prompt ready to send to an LLM."""
    pass  # TODO 10


# ---------------------------------------------------------------------------
# TODO 11: Document chunking
# ---------------------------------------------------------------------------
# Large documents must be split into smaller overlapping chunks before
# embedding, otherwise the embedding loses detail.
# Split `document` into chunks of `chunk_size` words with `overlap` words
# of overlap between consecutive chunks.
# Return a list of chunk strings.
def chunk_document(document: str, chunk_size: int = 50, overlap: int = 10) -> list[str]:
    """Split `document` into overlapping word-based chunks."""
    pass  # TODO 11


# ---------------------------------------------------------------------------
# TODO 12: End-to-end RAG pipeline
# ---------------------------------------------------------------------------
# Wire everything together:
#   1. Build knowledge base
#   2. Embed all documents with TF-IDF
#   3. Retrieve top-k docs for the query
#   4. Build context string
#   5. Build and return the final RAG prompt
def rag_pipeline(query: str, k: int = 3) -> str:
    """Run the full RAG pipeline and return the final LLM-ready prompt."""
    pass  # TODO 12


# ---------------------------------------------------------------------------
# TODO 13: Evaluate retrieval — precision@k
# ---------------------------------------------------------------------------
# Given:
#   - retrieved_indices  : list[int] — indices of retrieved documents
#   - relevant_indices   : list[int] — ground-truth relevant document indices
# Compute Precision@k = (# relevant docs in top-k) / k.
# Return a float in [0, 1].
def precision_at_k(retrieved_indices: list[int], relevant_indices: list[int]) -> float:
    """Return Precision@k for the retrieved results."""
    pass  # TODO 13


# ---------------------------------------------------------------------------
# TODO 14: Evaluate retrieval — recall@k
# ---------------------------------------------------------------------------
# Recall@k = (# relevant docs in top-k) / (total # relevant docs)
# Return a float in [0, 1]. Return 0.0 if relevant_indices is empty.
def recall_at_k(retrieved_indices: list[int], relevant_indices: list[int]) -> float:
    """Return Recall@k for the retrieved results."""
    pass  # TODO 14


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("=== Exercise 3.3 — Embeddings & RAG ===\n")

    # TODO 1 — concept
    print("TODO 1 — Embeddings concept:")
    info = explain_embeddings()
    print(info)

    # TODO 7 — knowledge base
    print("\nTODO 7 — Knowledge base:")
    kb = build_knowledge_base()
    print(f"  {len(kb)} documents loaded.")
    for i, doc in enumerate(kb[:3]):
        print(f"  [{i}] {doc}")

    # TODOs 2 & 3 — build and query embeddings
    print("\nTODOs 2 & 3 — TF-IDF embeddings:")
    vectorizer, doc_matrix = build_tfidf_embeddings(kb) if kb else (None, None)
    if vectorizer is not None:
        print(f"  Matrix shape: {doc_matrix.shape}")
        query_vec = embed_query(vectorizer, "space exploration and planets")
        print(f"  Query vector shape: {query_vec.shape}")

    # TODO 4 — cosine similarity
    print("\nTODO 4 — Cosine similarity:")
    a = np.array([1, 0, 1], dtype=float)
    b = np.array([1, 1, 0], dtype=float)
    print(f"  cos([1,0,1], [1,1,0]) = {cosine_similarity(a, b):.4f}  (expected ≈ 0.5)")

    # TODO 5 — pairwise matrix
    print("\nTODO 5 — Similarity matrix (first 3 docs):")
    if doc_matrix is not None:
        sim = similarity_matrix(doc_matrix[:3])
        print(f"  Shape: {sim.shape}")
        print(f"  Matrix:\n{np.round(sim, 3) if sim is not None else 'None'}")

    # TODO 6 — kNN search
    print("\nTODO 6 — kNN search:")
    if doc_matrix is not None and query_vec is not None:
        results = knn_search(query_vec, doc_matrix, k=3)
        print(f"  Top-3 indices and scores: {results}")

    # TODO 8 — retrieve
    print("\nTODO 8 — Retrieve:")
    query = "What do we know about space and planets?"
    if vectorizer is not None:
        top_docs = retrieve(query, kb, vectorizer, doc_matrix, k=3)
        for doc, score in (top_docs or []):
            print(f"  [{score:.4f}] {doc}")

    # TODO 9 — context
    print("\nTODO 9 — RAG context:")
    if top_docs:
        ctx = build_rag_context(query, top_docs)
        print(ctx)

    # TODO 10 — prompt
    print("\nTODO 10 — RAG prompt:")
    if top_docs:
        prompt = build_rag_prompt(ctx)
        print(prompt)

    # TODO 11 — chunking
    print("\nTODO 11 — Document chunking:")
    long_doc = " ".join([f"word{i}" for i in range(120)])
    chunks = chunk_document(long_doc, chunk_size=50, overlap=10)
    print(f"  {len(chunks)} chunks from 120-word doc (size=50, overlap=10)")
    if chunks:
        print(f"  Chunk 0 (first 5 words): {' '.join(chunks[0].split()[:5])}...")

    # TODO 12 — full pipeline
    print("\nTODO 12 — End-to-end RAG pipeline:")
    final_prompt = rag_pipeline("How does machine learning work?")
    print(final_prompt)

    # TODOs 13 & 14 — evaluation
    print("\nTODOs 13 & 14 — Retrieval evaluation:")
    retrieved = [0, 2, 5]
    relevant = [2, 5, 7]
    p = precision_at_k(retrieved, relevant)
    r = recall_at_k(retrieved, relevant)
    print(f"  retrieved={retrieved}, relevant={relevant}")
    print(f"  Precision@3 = {p}  (expected 0.667)")
    print(f"  Recall@3    = {r}  (expected 0.667)")


if __name__ == "__main__":
    main()
