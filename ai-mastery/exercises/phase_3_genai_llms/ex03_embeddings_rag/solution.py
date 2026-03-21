# ============================================================
# Solution 3.3 — Embeddings & RAG (Retrieval-Augmented Generation)
# ============================================================
#
# Prerequisites:
#   pip install numpy scikit-learn
#   (Optional) pip install sentence-transformers faiss-cpu
#
# This solution uses TF-IDF + cosine similarity as a fully runnable
# stand-in for neural embeddings (no GPU / API key required).
# The same architectural patterns apply when swapping in
# sentence-transformers or the OpenAI embeddings API.
# ============================================================

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer


# ---------------------------------------------------------------------------
# SOLUTION 1: Explain embeddings (conceptual)
# ---------------------------------------------------------------------------
def explain_embeddings() -> dict[str, str]:
    """Return a plain-language explanation of what embeddings are."""
    return {
        "definition": (
            "An embedding is a dense, fixed-size vector of numbers that represents "
            "the meaning of a piece of text (word, sentence, or document). "
            "Semantically similar texts have vectors that are close together in "
            "the high-dimensional vector space."
        ),
        "why_useful": (
            "Vectors enable mathematical operations on meaning: "
            "similarity search (find related documents), clustering (group topics), "
            "classification, and retrieval-augmented generation (RAG). "
            "Unlike keywords, embeddings capture synonyms and context."
        ),
        "example": (
            "'king' - 'man' + 'woman' ≈ 'queen'  — the famous Word2Vec example. "
            "Sentence: 'The cat sat on the mat' and 'A feline rested on the rug' "
            "will have very similar embeddings despite sharing no words."
        ),
    }


# ---------------------------------------------------------------------------
# SOLUTION 2: Build a TF-IDF embedding model
# ---------------------------------------------------------------------------
def build_tfidf_embeddings(documents: list[str]) -> tuple:
    """Fit TF-IDF on documents and return (vectorizer, embedding_matrix)."""
    # TF-IDF: Term Frequency × Inverse Document Frequency.
    # Each dimension corresponds to a vocabulary word; the value reflects
    # how important that word is in this document vs the corpus.
    vectorizer = TfidfVectorizer(
        lowercase=True,
        stop_words="english",   # remove common words like "the", "is"
        max_features=5000,       # cap vocabulary size
        ngram_range=(1, 2),      # include bigrams for better context
    )
    # fit_transform returns a sparse matrix; convert to dense numpy array.
    sparse_matrix = vectorizer.fit_transform(documents)
    dense_matrix = sparse_matrix.toarray()  # shape: (n_docs, vocab_size)
    return vectorizer, dense_matrix


# ---------------------------------------------------------------------------
# SOLUTION 3: Embed a single query
# ---------------------------------------------------------------------------
def embed_query(vectorizer: TfidfVectorizer, query: str) -> np.ndarray:
    """Return the TF-IDF embedding of `query` as a 1-D numpy array."""
    # transform (not fit_transform) — use the vocabulary learnt at fit time.
    sparse = vectorizer.transform([query])
    return sparse.toarray()[0]  # squeeze the (1, vocab_size) to (vocab_size,)


# ---------------------------------------------------------------------------
# SOLUTION 4: Cosine similarity
# ---------------------------------------------------------------------------
def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Return the cosine similarity between vectors a and b."""
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0  # zero vector has no direction — similarity undefined
    # dot product divided by product of norms
    return float(np.dot(a, b) / (norm_a * norm_b))


# ---------------------------------------------------------------------------
# SOLUTION 5: Pairwise similarity matrix
# ---------------------------------------------------------------------------
def similarity_matrix(embeddings: np.ndarray) -> np.ndarray:
    """Return the n×n pairwise cosine similarity matrix for `embeddings`."""
    # Normalise each row to unit length, then the dot product IS cosine sim.
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    # Avoid divide-by-zero for zero-norm rows
    norms = np.where(norms == 0, 1e-10, norms)
    normalised = embeddings / norms
    # Matrix multiply gives all pairwise dot products at once — O(n² d)
    return normalised @ normalised.T


# ---------------------------------------------------------------------------
# SOLUTION 6: k-Nearest Neighbour search (FAISS-like)
# ---------------------------------------------------------------------------
def knn_search(
    query_vec: np.ndarray,
    doc_matrix: np.ndarray,
    k: int = 3,
) -> list[tuple[int, float]]:
    """Return the top-k (doc_index, score) pairs for the query vector."""
    # Compute cosine similarity between query and every document in one pass.
    # This is the "brute-force" approach — FAISS uses approximate methods for
    # massive corpora, but the API and conceptual interface are identical.
    query_norm = np.linalg.norm(query_vec)
    if query_norm == 0:
        return []

    doc_norms = np.linalg.norm(doc_matrix, axis=1)
    # Avoid division by zero for empty documents
    doc_norms = np.where(doc_norms == 0, 1e-10, doc_norms)

    # Vectorised dot products: (n_docs,) array of similarities
    scores = doc_matrix @ query_vec / (doc_norms * query_norm)

    # argsort ascending; take last k indices reversed for descending order
    top_k_indices = np.argsort(scores)[-k:][::-1]
    return [(int(idx), float(scores[idx])) for idx in top_k_indices]


# ---------------------------------------------------------------------------
# SOLUTION 7: Build a knowledge base
# ---------------------------------------------------------------------------
def build_knowledge_base() -> list[str]:
    """Return a list of at least 8 factual documents for the knowledge base."""
    return [
        "The Python programming language was created by Guido van Rossum and first released in 1991.",
        "Machine learning is a subset of AI where models learn patterns from data without explicit programming.",
        "The Large Hadron Collider at CERN is the world's largest and most powerful particle accelerator.",
        "Mars is the fourth planet from the Sun and has two small moons named Phobos and Deimos.",
        "Transformer neural networks, introduced in 2017, power most modern large language models like GPT.",
        "DNA carries genetic instructions for the development and functioning of all living organisms.",
        "The Great Wall of China was built over many centuries, with the most well-known sections from the Ming dynasty.",
        "Photosynthesis is the process by which plants convert sunlight and CO2 into glucose and oxygen.",
        "The Internet was developed from ARPANET, a US Department of Defense research network from the 1960s.",
        "Quantum computing uses qubits that can exist in superposition, enabling certain computations much faster than classical computers.",
        "Black holes are regions of spacetime where gravity is so strong that nothing, not even light, can escape.",
        "The Turing Test, proposed by Alan Turing in 1950, evaluates whether a machine can exhibit intelligent behaviour.",
    ]


# ---------------------------------------------------------------------------
# SOLUTION 8: Retrieval step — find top-k relevant documents
# ---------------------------------------------------------------------------
def retrieve(
    query: str,
    documents: list[str],
    vectorizer: TfidfVectorizer,
    doc_matrix: np.ndarray,
    k: int = 3,
) -> list[tuple[str, float]]:
    """Return the top-k (document, score) pairs most relevant to `query`."""
    query_vec = embed_query(vectorizer, query)
    top_k = knn_search(query_vec, doc_matrix, k=k)
    # Map indices back to the original document strings
    return [(documents[idx], score) for idx, score in top_k]


# ---------------------------------------------------------------------------
# SOLUTION 9: Augmentation — build the RAG context string
# ---------------------------------------------------------------------------
def build_rag_context(
    query: str,
    retrieved_docs: list[tuple[str, float]],
) -> str:
    """Return a formatted context string combining retrieved docs + query."""
    # Good formatting: numbered passages + clear separation from the question.
    # The LLM sees exactly which passages it should draw from.
    lines = ["CONTEXT (retrieved passages):"]
    for i, (doc, score) in enumerate(retrieved_docs, 1):
        lines.append(f"  [{i}] (relevance: {score:.3f}) {doc}")
    lines.append("")
    lines.append(f"QUESTION: {query}")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# SOLUTION 10: Generation — format the final RAG prompt
# ---------------------------------------------------------------------------
def build_rag_prompt(context: str) -> str:
    """Return a full RAG prompt ready to send to an LLM."""
    # Key instruction: answer ONLY from context to reduce hallucination.
    # Also instruct the model to cite passage numbers for transparency.
    return (
        "You are a helpful assistant. Answer the question using ONLY the information "
        "provided in the context passages below. "
        "If the answer is not contained in the context, say "
        "'I don't have enough information to answer this question.'\n"
        "Cite the passage number(s) you used, e.g. [1] or [2, 3].\n\n"
        f"{context}\n\n"
        "Answer:"
    )


# ---------------------------------------------------------------------------
# SOLUTION 11: Document chunking
# ---------------------------------------------------------------------------
def chunk_document(document: str, chunk_size: int = 50, overlap: int = 10) -> list[str]:
    """Split `document` into overlapping word-based chunks."""
    # Word-based sliding window: step = chunk_size - overlap
    # Overlap ensures that sentences spanning chunk boundaries are captured
    # by at least one chunk.
    words = document.split()
    if not words:
        return []

    step = max(1, chunk_size - overlap)
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        if end >= len(words):
            break
        start += step
    return chunks


# ---------------------------------------------------------------------------
# SOLUTION 12: End-to-end RAG pipeline
# ---------------------------------------------------------------------------
def rag_pipeline(query: str, k: int = 3) -> str:
    """Run the full RAG pipeline and return the final LLM-ready prompt."""
    # Step 1: Build knowledge base
    documents = build_knowledge_base()

    # Step 2: Embed all documents
    vectorizer, doc_matrix = build_tfidf_embeddings(documents)

    # Step 3: Retrieve top-k relevant docs
    top_docs = retrieve(query, documents, vectorizer, doc_matrix, k=k)

    # Step 4: Build augmented context
    context = build_rag_context(query, top_docs)

    # Step 5: Wrap in generation prompt
    prompt = build_rag_prompt(context)

    # In production, you would now call:
    #   from openai import OpenAI
    #   client = OpenAI()
    #   response = client.chat.completions.create(
    #       model="gpt-4o",
    #       messages=[{"role": "user", "content": prompt}],
    #       temperature=0,   # low temp for factual grounded answers
    #   )
    #   return response.choices[0].message.content

    return prompt


# ---------------------------------------------------------------------------
# SOLUTION 13: Evaluate retrieval — precision@k
# ---------------------------------------------------------------------------
def precision_at_k(retrieved_indices: list[int], relevant_indices: list[int]) -> float:
    """Return Precision@k for the retrieved results."""
    if not retrieved_indices:
        return 0.0
    relevant_set = set(relevant_indices)
    hits = sum(1 for idx in retrieved_indices if idx in relevant_set)
    return hits / len(retrieved_indices)


# ---------------------------------------------------------------------------
# SOLUTION 14: Evaluate retrieval — recall@k
# ---------------------------------------------------------------------------
def recall_at_k(retrieved_indices: list[int], relevant_indices: list[int]) -> float:
    """Return Recall@k for the retrieved results."""
    if not relevant_indices:
        return 0.0
    relevant_set = set(relevant_indices)
    hits = sum(1 for idx in retrieved_indices if idx in relevant_set)
    return hits / len(relevant_set)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("=== Solution 3.3 — Embeddings & RAG ===\n")

    # --- 1. Embeddings concept ---
    print("--- 1. What are Embeddings? ---")
    info = explain_embeddings()
    for k, v in info.items():
        print(f"  {k}: {v}\n")

    # --- 7. Knowledge base ---
    print("--- 7. Knowledge Base ---")
    kb = build_knowledge_base()
    print(f"  Loaded {len(kb)} documents.")
    for i, doc in enumerate(kb[:3]):
        print(f"  [{i}] {doc}")
    print()

    # --- 2 & 3. TF-IDF embeddings ---
    print("--- 2 & 3. TF-IDF Embeddings ---")
    vectorizer, doc_matrix = build_tfidf_embeddings(kb)
    print(f"  Embedding matrix shape: {doc_matrix.shape}  (n_docs × vocab_features)")
    query_vec = embed_query(vectorizer, "space exploration and planets")
    print(f"  Query vector shape: {query_vec.shape}")
    print(f"  Non-zero dimensions: {np.count_nonzero(query_vec)}")
    print()

    # --- 4. Cosine similarity ---
    print("--- 4. Cosine Similarity ---")
    a = np.array([1, 0, 1], dtype=float)
    b = np.array([1, 1, 0], dtype=float)
    c = np.array([0, 0, 0], dtype=float)
    print(f"  cos([1,0,1], [1,1,0]) = {cosine_similarity(a, b):.4f}  (expected ≈ 0.5)")
    print(f"  cos([1,0,1], [1,0,1]) = {cosine_similarity(a, a):.4f}  (identical → 1.0)")
    print(f"  cos(zero vector)       = {cosine_similarity(a, c):.4f}  (zero norm → 0.0)")
    print()

    # --- 5. Pairwise similarity ---
    print("--- 5. Similarity Matrix (first 4 docs) ---")
    sim = similarity_matrix(doc_matrix[:4])
    print(f"  Shape: {sim.shape}")
    print("  Matrix (rounded to 3 dp):")
    print(np.round(sim, 3))
    print()

    # --- 6. kNN search ---
    print("--- 6. kNN Search ---")
    results = knn_search(query_vec, doc_matrix, k=3)
    print("  Top-3 for 'space exploration and planets':")
    for idx, score in results:
        print(f"    [{idx}] score={score:.4f}  →  {kb[idx]}")
    print()

    # --- 8. Retrieve ---
    print("--- 8. Retrieval ---")
    query = "How does machine learning work?"
    top_docs = retrieve(query, kb, vectorizer, doc_matrix, k=3)
    print(f"  Query: '{query}'")
    for doc, score in top_docs:
        print(f"  [{score:.4f}] {doc}")
    print()

    # --- 9. Context ---
    print("--- 9. RAG Context ---")
    ctx = build_rag_context(query, top_docs)
    print(ctx)
    print()

    # --- 10. Full RAG prompt ---
    print("--- 10. RAG Prompt ---")
    prompt = build_rag_prompt(ctx)
    print(prompt)
    print()

    # --- 11. Chunking ---
    print("--- 11. Document Chunking ---")
    long_doc = " ".join([f"word{i}" for i in range(120)])
    chunks = chunk_document(long_doc, chunk_size=50, overlap=10)
    print(f"  120-word doc → {len(chunks)} chunks (chunk_size=50, overlap=10)")
    print(f"  Chunk 0: {' '.join(chunks[0].split()[:6])}...")
    print(f"  Chunk 1: {' '.join(chunks[1].split()[:6])}...")
    # Verify overlap: chunk1 should start 40 words after chunk0
    chunk0_words = chunks[0].split()
    chunk1_words = chunks[1].split()
    overlap_words = set(chunk0_words[-10:]) & set(chunk1_words[:10])
    print(f"  Overlap words between chunk 0 tail and chunk 1 head: {len(overlap_words)}")
    print()

    # --- 12. End-to-end pipeline ---
    print("--- 12. End-to-End RAG Pipeline ---")
    final_prompt = rag_pipeline("What is a transformer neural network?")
    # Show only the context portion (the prompt is long)
    lines = final_prompt.split("\n")
    for line in lines[:10]:
        print(" ", line)
    print("  ... [truncated — full prompt ready for LLM]")
    print()

    # --- 13 & 14. Evaluation ---
    print("--- 13 & 14. Retrieval Evaluation ---")
    test_cases = [
        ([0, 2, 5], [2, 5, 7], "standard case"),
        ([0, 1, 2], [0, 1, 2], "perfect retrieval"),
        ([0, 1, 2], [3, 4, 5], "zero overlap"),
        ([0], [0, 1, 2], "low recall"),
    ]
    for retrieved, relevant, label in test_cases:
        p = precision_at_k(retrieved, relevant)
        r = recall_at_k(retrieved, relevant)
        print(
            f"  [{label}] retrieved={retrieved}, relevant={relevant} "
            f"→ P@k={p:.3f}, R@k={r:.3f}"
        )


if __name__ == "__main__":
    main()
