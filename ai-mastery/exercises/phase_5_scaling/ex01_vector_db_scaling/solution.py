# ============================================================
# Solution 5.1 — Vector Database Scaling
# ============================================================
#
# pip install faiss-cpu numpy scikit-learn
# faiss-cpu fallback: pip install scikit-learn

import os
import time
import numpy as np

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    from sklearn.neighbors import NearestNeighbors
    import joblib

print(f"FAISS available: {FAISS_AVAILABLE}")


# ---------------------------------------------------------------------------
# SOLUTION 1: Flat (exact) index
# ---------------------------------------------------------------------------
def build_flat_index(vectors: np.ndarray, dimension: int):
    """
    IndexFlatL2: exhaustive L2 distance search. 100% recall, O(n) query time.
    Used as ground truth for recall benchmarks.
    """
    vectors = vectors.astype(np.float32)
    if FAISS_AVAILABLE:
        index = faiss.IndexFlatL2(dimension)
        index.add(vectors)
    else:
        index = NearestNeighbors(metric="euclidean", algorithm="brute", n_jobs=-1)
        index.fit(vectors)
    return index


# ---------------------------------------------------------------------------
# SOLUTION 2: IVF index (Inverted File Index)
# ---------------------------------------------------------------------------
def build_ivf_index(vectors: np.ndarray, dimension: int, n_lists: int = 100, n_probe: int = 10):
    """
    IVFFlat: partitions the space into n_lists Voronoi cells.
    At query time, only searches n_probe cells (faster but approximate).
    Requires training on a representative sample.
    """
    vectors = vectors.astype(np.float32)
    if not FAISS_AVAILABLE:
        # sklearn fallback: KD-tree ANN
        index = NearestNeighbors(metric="euclidean", algorithm="kd_tree", n_jobs=-1)
        index.fit(vectors)
        return index

    quantizer = faiss.IndexFlatL2(dimension)
    index     = faiss.IndexIVFFlat(quantizer, dimension, n_lists,
                                    faiss.METRIC_L2)
    # Must train before adding vectors
    assert not index.is_trained
    index.train(vectors)
    assert index.is_trained
    index.add(vectors)
    index.nprobe = n_probe  # how many cells to visit at search time
    return index


# ---------------------------------------------------------------------------
# SOLUTION 3: HNSW index (Hierarchical Navigable Small World)
# ---------------------------------------------------------------------------
def build_hnsw_index(vectors: np.ndarray, dimension: int,
                     m: int = 16, ef_construction: int = 200):
    """
    HNSW: graph-based ANN. Very fast queries (~1ms at 1M vectors).
    Higher M → better recall, more memory. Typical: M=16 or 32.
    ef_construction: controls build quality (higher = better recall, slower build).
    """
    vectors = vectors.astype(np.float32)
    if not FAISS_AVAILABLE:
        index = NearestNeighbors(metric="euclidean", algorithm="ball_tree", n_jobs=-1)
        index.fit(vectors)
        return index

    index = faiss.IndexHNSWFlat(dimension, m, faiss.METRIC_L2)
    index.hnsw.efConstruction = ef_construction
    index.add(vectors)
    return index


# ---------------------------------------------------------------------------
# SOLUTION 4: Search an index
# ---------------------------------------------------------------------------
def search_index(index, query_vectors: np.ndarray, k: int = 10) -> tuple:
    query_vectors = query_vectors.astype(np.float32)
    if FAISS_AVAILABLE:
        distances, indices = index.search(query_vectors, k)
        return distances, indices
    else:
        distances, indices = index.kneighbors(query_vectors, n_neighbors=k)
        return distances, indices


# ---------------------------------------------------------------------------
# SOLUTION 5: Recall@k
# ---------------------------------------------------------------------------
def calculate_recall(true_indices: np.ndarray, approx_indices: np.ndarray, k: int) -> float:
    """
    For each query, compute what fraction of its true top-k neighbors
    appear in the approximate top-k results.
    """
    n_queries = true_indices.shape[0]
    recalls   = []
    for i in range(n_queries):
        true_set   = set(true_indices[i][:k].tolist())
        approx_set = set(approx_indices[i][:k].tolist())
        intersection = len(true_set & approx_set)
        recalls.append(intersection / k)
    return float(np.mean(recalls))


# ---------------------------------------------------------------------------
# SOLUTION 6: Save and load index
# ---------------------------------------------------------------------------
def save_index(index, filepath: str) -> None:
    if FAISS_AVAILABLE:
        faiss.write_index(index, filepath)
    else:
        joblib.dump(index, filepath)
    print(f"  Index saved to {filepath}  ({os.path.getsize(filepath) // 1024} KB)")


def load_index(filepath: str):
    if FAISS_AVAILABLE:
        index = faiss.read_index(filepath)
    else:
        index = joblib.load(filepath)
    print(f"  Index loaded from {filepath}")
    return index


# ---------------------------------------------------------------------------
# SOLUTION 7: Batched insertion
# ---------------------------------------------------------------------------
def batched_insert(index, vectors: np.ndarray, batch_size: int = 10_000):
    """
    Inserting millions of vectors in one call can cause OOM.
    Batching keeps peak memory bounded.
    """
    vectors = vectors.astype(np.float32)
    total   = len(vectors)
    for start in range(0, total, batch_size):
        end   = min(start + batch_size, total)
        batch = vectors[start:end]
        if FAISS_AVAILABLE:
            index.add(batch)
        else:
            # sklearn NearestNeighbors cannot be updated incrementally
            pass
        print(f"  Inserted {end}/{total} vectors", end="\r")
    print()
    return index


# ---------------------------------------------------------------------------
# SOLUTION 8: IVFPQ index
# ---------------------------------------------------------------------------
def build_ivfpq_index(
    vectors: np.ndarray,
    dimension: int,
    n_lists: int = 100,
    m_subvectors: int = 8,
    n_bits: int = 8,
):
    """
    IndexIVFPQ: combines IVF (clustering) with Product Quantization (compression).
    Memory: n_vectors * m_subvectors * (n_bits/8) bytes  (vs n_vectors*dim*4 for Flat)
    Example: 1M × 768-dim vectors
      Flat:   1M * 768 * 4 = 3 GB
      IVFPQ:  1M * 8   * 1 = 8 MB  (375× compression, ~90% recall)
    """
    vectors = vectors.astype(np.float32)
    if not FAISS_AVAILABLE:
        print("  faiss not available — IVFPQ requires faiss. Using sklearn fallback.")
        return build_flat_index(vectors, dimension)

    assert dimension % m_subvectors == 0, \
        f"dimension ({dimension}) must be divisible by m_subvectors ({m_subvectors})"

    quantizer = faiss.IndexFlatL2(dimension)
    index     = faiss.IndexIVFPQ(quantizer, dimension, n_lists,
                                  m_subvectors, n_bits)
    index.train(vectors)
    index.add(vectors)
    index.nprobe = max(1, n_lists // 10)
    return index


# ---------------------------------------------------------------------------
# SOLUTION 9: Benchmark Flat vs IVF
# ---------------------------------------------------------------------------
def benchmark_search_speed(flat_index, ivf_index, query_vectors: np.ndarray, k: int = 10) -> dict:
    query_vectors = query_vectors.astype(np.float32)
    N_RUNS = 5

    # Flat
    t0 = time.perf_counter()
    for _ in range(N_RUNS):
        search_index(flat_index, query_vectors, k)
    flat_ms = (time.perf_counter() - t0) / N_RUNS * 1000

    # IVF
    t0 = time.perf_counter()
    for _ in range(N_RUNS):
        search_index(ivf_index, query_vectors, k)
    ivf_ms = (time.perf_counter() - t0) / N_RUNS * 1000

    speedup = flat_ms / ivf_ms if ivf_ms > 0 else float("inf")
    return {
        "flat_ms": round(flat_ms, 3),
        "ivf_ms":  round(ivf_ms, 3),
        "speedup": round(speedup, 2),
    }


# ---------------------------------------------------------------------------
# SOLUTION 10: Sharding strategy for 1B vectors
# ---------------------------------------------------------------------------
def sharding_strategy_1B(dimension: int = 768) -> dict:
    bytes_per_vector    = dimension * 4        # float32
    total_bytes         = 1_000_000_000 * bytes_per_vector
    total_gb            = total_bytes / 1e9
    shard_target_gb     = 50                   # fit in one machine's RAM
    n_shards            = max(1, int(np.ceil(total_gb / shard_target_gb)))
    vectors_per_shard   = 1_000_000_000 // n_shards

    return {
        "approach":            "Horizontal sharding — distribute vectors across N index servers",
        "n_shards":            n_shards,
        "vectors_per_shard":   f"{vectors_per_shard:,} vectors (~{shard_target_gb} GB each)",
        "total_raw_size_gb":   round(total_gb, 1),
        "routing": (
            "Hash-based or range-based routing. "
            "Each shard holds a non-overlapping subset of vector IDs. "
            "For global search, broadcast the query to ALL shards (scatter-gather)."
        ),
        "aggregation": (
            "Each shard returns its local top-k results with distances. "
            "A coordinator merges all partial results, re-ranks by distance, "
            "and returns the global top-k. "
            "This requires only k results per shard, not all vectors."
        ),
        "index_type_per_shard": "IVF or HNSW — both support partial search",
        "replication": (
            "Replicate each shard 2-3× for fault tolerance. "
            "Use consistent hashing so adding a shard only re-assigns ~1/N fraction."
        ),
        "practical_alternatives": (
            "Use a managed service: Pinecone, Weaviate, or Qdrant — "
            "they handle sharding, replication, and routing automatically."
        ),
    }


# ---------------------------------------------------------------------------
# SOLUTION 11: FAISS vs Chroma vs Pinecone comparison
# ---------------------------------------------------------------------------
def vector_db_comparison() -> list:
    return [
        {
            "name":       "FAISS",
            "type":       "Library (in-process)",
            "deployment": "Embedded in your Python process",
            "max_scale":  "~100M vectors on a single machine; billions with sharding",
            "strengths":  [
                "Extremely fast (GPU support)",
                "Many index types (Flat, IVF, HNSW, PQ)",
                "No network overhead",
                "Free and open-source (Meta)",
            ],
            "weaknesses": [
                "No built-in persistence (must manage save/load)",
                "No metadata filtering or hybrid search",
                "Manual sharding for billion-scale",
                "No built-in server/API",
            ],
            "best_for": "Research, prototyping, embedding into custom ML pipelines",
        },
        {
            "name":       "Chroma",
            "type":       "Embedded or client-server",
            "deployment": "Local (embedded) or self-hosted server",
            "max_scale":  "~10M vectors self-hosted; limited vs managed services",
            "strengths":  [
                "Simple Python API (great for LLM apps)",
                "Metadata filtering out of the box",
                "Persistent storage included",
                "Open-source; built for LangChain/LlamaIndex",
            ],
            "weaknesses": [
                "Not designed for billion-scale",
                "Slower than FAISS at large scale",
                "Limited index type control",
            ],
            "best_for": "RAG pipelines, LLM apps, fast local prototyping",
        },
        {
            "name":       "Pinecone",
            "type":       "Managed cloud service",
            "deployment": "Fully managed SaaS (AWS/GCP/Azure)",
            "max_scale":  "Billions of vectors (auto-scaled)",
            "strengths":  [
                "Serverless — no infrastructure management",
                "Automatic sharding, replication, scaling",
                "Metadata filtering and hybrid search",
                "SLA-backed availability",
            ],
            "weaknesses": [
                "Cost ($70+/month for production workloads)",
                "Vendor lock-in",
                "Network latency (10-50ms vs sub-ms for FAISS)",
                "Less index type control",
            ],
            "best_for": "Production RAG, enterprise semantic search, teams without MLOps expertise",
        },
    ]


def main():
    print("=== Solution 5.1: Vector Database Scaling ===\n")

    rng       = np.random.default_rng(42)
    DIM       = 64         # keep small for fast demo
    N_VECTORS = 50_000
    N_QUERIES = 100
    K         = 10

    print(f"Generating {N_VECTORS:,} vectors of dimension {DIM}...")
    vectors       = rng.random((N_VECTORS, DIM)).astype(np.float32)
    query_vectors = rng.random((N_QUERIES, DIM)).astype(np.float32)

    # 1. Flat index
    print("\n1. Building Flat (exact) index...")
    t0         = time.perf_counter()
    flat_index = build_flat_index(vectors, DIM)
    print(f"   Build time: {(time.perf_counter()-t0)*1000:.1f} ms")

    flat_dist, flat_idx = search_index(flat_index, query_vectors, K)
    print(f"   Search done. Top-1 distance for query 0: {flat_dist[0][0]:.4f}")

    # 2. IVF index
    print("\n2. Building IVF index (n_lists=100, nprobe=10)...")
    n_lists   = max(10, int(np.sqrt(N_VECTORS)))
    t0        = time.perf_counter()
    ivf_index = build_ivf_index(vectors, DIM, n_lists=n_lists, n_probe=10)
    print(f"   Build time: {(time.perf_counter()-t0)*1000:.1f} ms")

    _, ivf_idx = search_index(ivf_index, query_vectors, K)
    recall_ivf = calculate_recall(flat_idx, ivf_idx, K)
    print(f"   Recall@{K}: {recall_ivf:.3f}")

    # 3. HNSW index
    if FAISS_AVAILABLE:
        print("\n3. Building HNSW index (M=16)...")
        t0         = time.perf_counter()
        hnsw_index = build_hnsw_index(vectors, DIM, m=16, ef_construction=64)
        print(f"   Build time: {(time.perf_counter()-t0)*1000:.1f} ms")
        hnsw_index.hnsw.efSearch = 64
        _, hnsw_idx = search_index(hnsw_index, query_vectors, K)
        recall_hnsw = calculate_recall(flat_idx, hnsw_idx, K)
        print(f"   Recall@{K}: {recall_hnsw:.3f}")

    # 5. Benchmark
    print("\n4. Speed benchmark (Flat vs IVF)...")
    bench = benchmark_search_speed(flat_index, ivf_index, query_vectors, K)
    print(f"   Flat : {bench['flat_ms']:.2f} ms")
    print(f"   IVF  : {bench['ivf_ms']:.2f} ms")
    print(f"   IVF speedup: {bench['speedup']}×")

    # 6. Save/load
    if FAISS_AVAILABLE:
        print("\n5. Index persistence...")
        save_index(flat_index, "/tmp/flat.index")
        loaded = load_index("/tmp/flat.index")
        _, loaded_idx = search_index(loaded, query_vectors[:5], K)
        print(f"   Loaded index search OK (first query top-1: {loaded_idx[0][0]})")

    # 7. Batched insert
    print("\n6. Batched insertion (50k vectors, batch_size=10k)...")
    new_index = build_flat_index(np.empty((0, DIM), dtype=np.float32), DIM) \
                if FAISS_AVAILABLE else build_flat_index(vectors, DIM)
    if FAISS_AVAILABLE:
        batched_insert(new_index, vectors, batch_size=10_000)
        print(f"   Total vectors in index: {new_index.ntotal:,}")

    # 8. IVFPQ
    if FAISS_AVAILABLE and DIM % 8 == 0:
        print("\n7. IVFPQ index (IVF + Product Quantization)...")
        pq_index = build_ivfpq_index(vectors, DIM, n_lists=100, m_subvectors=8)
        _, pq_idx = search_index(pq_index, query_vectors, K)
        recall_pq = calculate_recall(flat_idx, pq_idx, K)
        print(f"   Recall@{K}: {recall_pq:.3f}")

    # 10. Sharding strategy
    print("\n8. Sharding strategy for 1 billion 768-dim vectors:")
    strategy = sharding_strategy_1B(dimension=768)
    for k, v in strategy.items():
        print(f"   {k}: {v}")

    # 11. Comparison
    print("\n9. Vector DB comparison:")
    for db in vector_db_comparison():
        print(f"   {db['name']:10s} | scale: {db['max_scale'][:40]}")
        print(f"             | best for: {db['best_for'][:60]}")


if __name__ == "__main__":
    main()
