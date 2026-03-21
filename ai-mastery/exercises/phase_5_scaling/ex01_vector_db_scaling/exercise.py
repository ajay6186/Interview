# ============================================================
# Exercise 5.1 — Vector Database Scaling
# ============================================================
# Topics:
#   • FAISS index types: Flat (brute-force), IVF, HNSW
#   • Building and searching a vector index
#   • Approximate Nearest Neighbor (ANN) search
#   • Product quantization (PQ) for compression
#   • Index persistence (save/load)
#   • Batched insertion
#   • Recall vs speed tradeoff
#   • Sharding strategy for billion-scale vectors
#   • FAISS vs Chroma vs Pinecone comparison
#   • Scaling to 1B vectors
# ============================================================

import numpy as np

# Use faiss if available, else fall back to sklearn NearestNeighbors
try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    from sklearn.neighbors import NearestNeighbors


# ---------------------------------------------------------------------------
# TODO 1: Build a FAISS Flat (exact) index
# - dimension: vector dimensionality
# - vectors: np.ndarray of shape (n, dimension), dtype float32
# If FAISS not available, use sklearn NearestNeighbors as fallback
# Return the built index (faiss.IndexFlatL2 or NearestNeighbors)
# ---------------------------------------------------------------------------
def build_flat_index(vectors: np.ndarray, dimension: int):
    pass  # TODO: implement with faiss.IndexFlatL2 or sklearn fallback


# ---------------------------------------------------------------------------
# TODO 2: Build a FAISS IVF index (approximate, with clustering)
# - n_lists: number of Voronoi cells (clusters)
# - n_probe: how many cells to search at query time
# IVF requires training on representative data before adding vectors
# Return the built and populated index
# ---------------------------------------------------------------------------
def build_ivf_index(vectors: np.ndarray, dimension: int, n_lists: int = 100, n_probe: int = 10):
    pass  # TODO: faiss.IndexIVFFlat, train, add, set nprobe


# ---------------------------------------------------------------------------
# TODO 3: Build a FAISS HNSW index (graph-based ANN)
# - m: number of connections per node in the graph (typically 16-64)
# - ef_construction: size of dynamic candidate list during build
# - ef_search: size of candidate list during search
# Return the populated index
# ---------------------------------------------------------------------------
def build_hnsw_index(vectors: np.ndarray, dimension: int, m: int = 16, ef_construction: int = 200):
    pass  # TODO: faiss.IndexHNSWFlat, set efConstruction, add


# ---------------------------------------------------------------------------
# TODO 4: Search an index for the k nearest neighbors of a query vector
# Return (distances, indices) — both np.ndarray of shape (n_queries, k)
# Work with both faiss and sklearn NearestNeighbors
# ---------------------------------------------------------------------------
def search_index(index, query_vectors: np.ndarray, k: int = 10) -> tuple:
    pass  # TODO: index.search(query_vectors, k) or index.kneighbors


# ---------------------------------------------------------------------------
# TODO 5: Calculate recall@k
# Given true neighbors (from exact search) and approximate neighbors,
# recall@k = |approximate ∩ true| / k
# Return average recall across all queries (float 0-1)
# ---------------------------------------------------------------------------
def calculate_recall(true_indices: np.ndarray, approx_indices: np.ndarray, k: int) -> float:
    pass  # TODO: compute recall for each query, return mean


# ---------------------------------------------------------------------------
# TODO 6: Save and load a FAISS index to/from disk
# Save: faiss.write_index(index, filepath)
# Load: faiss.read_index(filepath)
# Return the loaded index
# For sklearn fallback, use joblib.dump / joblib.load
# ---------------------------------------------------------------------------
def save_index(index, filepath: str) -> None:
    pass  # TODO: save the index


def load_index(filepath: str):
    pass  # TODO: load and return the index


# ---------------------------------------------------------------------------
# TODO 7: Insert vectors in batches to avoid memory spikes
# Insert vectors in chunks of batch_size
# For faiss indexes, just call index.add(chunk)
# Return the final index with all vectors added
# ---------------------------------------------------------------------------
def batched_insert(index, vectors: np.ndarray, batch_size: int = 10000):
    pass  # TODO: split vectors into batches, add each batch


# ---------------------------------------------------------------------------
# TODO 8: Build an IVF index with Product Quantization (IVFPQ)
# PQ compresses vectors into compact codes (much lower memory)
# - n_lists: IVF clusters
# - m_subvectors: number of sub-vector groups (dimension must be divisible by m)
# - n_bits: bits per sub-vector code (usually 8)
# Return the trained and populated index
# ---------------------------------------------------------------------------
def build_ivfpq_index(
    vectors: np.ndarray,
    dimension: int,
    n_lists: int = 100,
    m_subvectors: int = 8,
    n_bits: int = 8,
):
    pass  # TODO: faiss.IndexIVFPQ


# ---------------------------------------------------------------------------
# TODO 9: Benchmark search speed — compare Flat vs IVF
# Return a dict: {"flat_ms": float, "ivf_ms": float, "speedup": float}
# Use time.perf_counter for timing
# ---------------------------------------------------------------------------
def benchmark_search_speed(
    flat_index,
    ivf_index,
    query_vectors: np.ndarray,
    k: int = 10,
) -> dict:
    pass  # TODO: time both searches, compute speedup


# ---------------------------------------------------------------------------
# TODO 10: Describe a sharding strategy for 1 billion vectors
# Return a dict with keys:
#   "approach": str
#   "n_shards": int (suggested)
#   "vectors_per_shard": str
#   "routing": str (how to route a query to the right shard)
#   "aggregation": str (how to merge results from multiple shards)
# ---------------------------------------------------------------------------
def sharding_strategy_1B(dimension: int = 768) -> dict:
    pass  # TODO: describe sharding approach


# ---------------------------------------------------------------------------
# TODO 11: Compare FAISS, Chroma, and Pinecone
# Return a list of dicts with keys: name, type, deployment, max_scale,
#   strengths, weaknesses, best_for
# ---------------------------------------------------------------------------
def vector_db_comparison() -> list:
    pass  # TODO: return comparison list


def main():
    print("=== Exercise 5.1: Vector Database Scaling ===\n")
    print("TODOs to implement:\n")
    todos = [
        ("TODO 1",  "build_flat_index()      — Exact brute-force index (IndexFlatL2)"),
        ("TODO 2",  "build_ivf_index()       — Approximate IVF index with clustering"),
        ("TODO 3",  "build_hnsw_index()      — Graph-based HNSW index"),
        ("TODO 4",  "search_index()          — k-NN search on any index"),
        ("TODO 5",  "calculate_recall()      — Recall@k between exact and ANN"),
        ("TODO 6",  "save_index/load_index() — Index persistence to disk"),
        ("TODO 7",  "batched_insert()        — Insert vectors in batches"),
        ("TODO 8",  "build_ivfpq_index()     — IVF + Product Quantization"),
        ("TODO 9",  "benchmark_search_speed()— Flat vs IVF timing comparison"),
        ("TODO 10", "sharding_strategy_1B()  — Strategy for 1 billion vectors"),
        ("TODO 11", "vector_db_comparison()  — FAISS vs Chroma vs Pinecone"),
    ]
    for label, desc in todos:
        print(f"  {label}: {desc}")
    print()
    print("FAISS index type guide:")
    print("  IndexFlatL2  : exact, slow at scale, good as ground truth")
    print("  IndexIVFFlat : ANN via clustering; fast, needs training")
    print("  IndexHNSWFlat: ANN via graph; very fast queries, more memory")
    print("  IndexIVFPQ   : ANN + compression; lowest memory, some accuracy loss")
    print()
    print("Rule of thumb for n_lists: sqrt(n_vectors)")
    print("Rule of thumb for n_probe: n_lists / 10 (balance speed/recall)")


if __name__ == "__main__":
    main()
