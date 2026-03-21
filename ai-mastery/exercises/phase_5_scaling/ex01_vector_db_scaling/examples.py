# ============================================================
# Examples 5.1 — Vector Database Scaling (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import time
import json
import math
from collections import defaultdict

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Create random embedding vectors"""
    dim = 128
    vec_a = np.random.randn(dim).astype(np.float32)
    vec_b = np.random.randn(dim).astype(np.float32)
    print(f"Ex01 — Embedding vectors: shape={vec_a.shape}, dtype={vec_a.dtype}, sample={vec_a[:3].round(3)}")

def ex02():
    """Cosine similarity between two vectors"""
    a = np.random.randn(128).astype(np.float32)
    b = np.random.randn(128).astype(np.float32)
    cos_sim = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
    print(f"Ex02 — Cosine similarity: {cos_sim:.4f}")

def ex03():
    """Euclidean distance between two vectors"""
    a = np.random.randn(128).astype(np.float32)
    b = np.random.randn(128).astype(np.float32)
    dist = np.linalg.norm(a - b)
    print(f"Ex03 — Euclidean distance: {dist:.4f}")

def ex04():
    """Dot product similarity"""
    a = np.random.randn(128).astype(np.float32)
    b = np.random.randn(128).astype(np.float32)
    dot = np.dot(a, b)
    print(f"Ex04 — Dot product similarity: {dot:.4f}")

def ex05():
    """Normalize vectors to unit length"""
    vecs = np.random.randn(5, 128).astype(np.float32)
    norms = np.linalg.norm(vecs, axis=1, keepdims=True)
    normalized = vecs / norms
    lengths = np.linalg.norm(normalized, axis=1)
    print(f"Ex05 — Normalized vector norms: {lengths.round(4)} (all ~1.0)")

def ex06():
    """Brute force k-NN search (numpy)"""
    np.random.seed(42)
    store = np.random.randn(1000, 64).astype(np.float32)
    query = np.random.randn(64).astype(np.float32)
    dists = np.linalg.norm(store - query, axis=1)
    top_k = np.argsort(dists)[:5]
    print(f"Ex06 — Brute-force k-NN top-5 indices: {top_k}, distances: {dists[top_k].round(3)}")

def ex07():
    """Build simple in-memory vector store (dict)"""
    store = {}
    for i in range(5):
        store[f"doc_{i}"] = np.random.randn(64).astype(np.float32)
    print(f"Ex07 — Vector store keys: {list(store.keys())}, vector dim: {next(iter(store.values())).shape[0]}")

def ex08():
    """Add vectors to store"""
    store = {}
    new_vectors = {f"id_{i}": np.random.randn(64).astype(np.float32) for i in range(3)}
    store.update(new_vectors)
    print(f"Ex08 — Added {len(new_vectors)} vectors; store size: {len(store)}")

def ex09():
    """Search store (top-k cosine similarity)"""
    np.random.seed(0)
    store = {f"v{i}": np.random.randn(64).astype(np.float32) for i in range(100)}
    query = np.random.randn(64).astype(np.float32)
    scores = {k: float(np.dot(query, v) / (np.linalg.norm(query) * np.linalg.norm(v))) for k, v in store.items()}
    top_k = sorted(scores, key=scores.get, reverse=True)[:3]
    print(f"Ex09 — Top-3 search results: {[(k, round(scores[k], 4)) for k in top_k]}")

def ex10():
    """Delete from store"""
    store = {f"v{i}": np.random.randn(64).astype(np.float32) for i in range(5)}
    del store["v2"]
    print(f"Ex10 — After delete: store keys: {list(store.keys())}, size: {len(store)}")

def ex11():
    """Update vector in store"""
    store = {"doc_1": np.zeros(64, dtype=np.float32)}
    store["doc_1"] = np.random.randn(64).astype(np.float32)
    print(f"Ex11 — Updated vector norm: {np.linalg.norm(store['doc_1']):.4f}")

def ex12():
    """Vector count in store"""
    store = {f"id_{i}": np.random.randn(64).astype(np.float32) for i in range(42)}
    count = len(store)
    print(f"Ex12 — Vector count: {count}")

def ex13():
    """Memory usage estimate for vector store"""
    n_vectors = 1_000_000
    dim = 1536
    bytes_per_float = 4
    total_bytes = n_vectors * dim * bytes_per_float
    total_gb = total_bytes / (1024 ** 3)
    print(f"Ex13 — Memory estimate: {n_vectors:,} vectors × {dim}d × float32 = {total_gb:.2f} GB")

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Batch add vectors"""
    store = {}
    batch = {f"batch_{i}": np.random.randn(64).astype(np.float32) for i in range(500)}
    store.update(batch)
    print(f"Ex14 — Batch add: inserted {len(batch)} vectors; store size: {len(store)}")

def ex15():
    """Batch search (multiple queries at once)"""
    np.random.seed(1)
    store_mat = np.random.randn(1000, 64).astype(np.float32)
    queries = np.random.randn(5, 64).astype(np.float32)
    # cosine: normalize both
    store_norm = store_mat / np.linalg.norm(store_mat, axis=1, keepdims=True)
    q_norm = queries / np.linalg.norm(queries, axis=1, keepdims=True)
    scores = q_norm @ store_norm.T  # (5, 1000)
    top1 = np.argmax(scores, axis=1)
    print(f"Ex15 — Batch search top-1 indices for 5 queries: {top1}")

def ex16():
    """Inverted File Index (IVF) concept"""
    concept = """
IVF (Inverted File Index):
  1. Cluster all vectors into K centroids (K-means)
  2. Assign each vector to its nearest centroid → inverted lists
  3. At query time: find top nprobe centroids, search only those lists
  Benefit: skip (K - nprobe)/K fraction of vectors
  Trade-off: approximate (may miss true NN if it's in un-probed cluster)
"""
    print(f"Ex16 — IVF Concept:{concept}")

def ex17():
    """Product Quantization (PQ) concept"""
    concept = """
Product Quantization:
  1. Split d-dim vector into M sub-vectors of d/M dims each
  2. Train K codebook entries per sub-space (K=256 common)
  3. Each vector encoded as M bytes (M × log2(K) bits)
  Compression: 128-dim float32 (512B) → PQ(M=8, K=256) = 8B (64× smaller)
  Distance: asymmetric distance computation (ADC) using lookup tables
"""
    print(f"Ex17 — Product Quantization:{concept}")

def ex18():
    """HNSW (Hierarchical Navigable Small World) concept"""
    concept = """
HNSW:
  - Graph-based approximate nearest neighbor index
  - Multi-layer graph: top layers sparse (long-range links), bottom dense
  - Insert: greedily find neighbors at each layer, add bidirectional edges
  - Search: enter at top layer, greedily descend to layer 0
  - Params: M (max connections), efConstruction (build quality), ef (query quality)
  - Complexity: O(log N) search, O(N log N) build
"""
    print(f"Ex18 — HNSW:{concept}")

def ex19():
    """IVF index concept with numpy simulation"""
    np.random.seed(42)
    n, d, k = 500, 32, 10
    data = np.random.randn(n, d).astype(np.float32)
    # simple k-means one step
    centroids = data[np.random.choice(n, k, replace=False)]
    dists = np.linalg.norm(data[:, None] - centroids[None, :], axis=2)
    assignments = np.argmin(dists, axis=1)
    cluster_sizes = np.bincount(assignments, minlength=k)
    print(f"Ex19 — IVF simulation: {k} clusters, sizes: {cluster_sizes}")

def ex20():
    """FAISS Flat index pattern (show API)"""
    pattern = """
import faiss
d = 128
index = faiss.IndexFlatL2(d)          # exact L2
vectors = np.random.randn(10000, d).astype('float32')
index.add(vectors)                     # add 10K vectors
D, I = index.search(query, k=10)       # search top-10
print(f"Index size: {index.ntotal}")   # 10000
"""
    print(f"Ex20 — FAISS Flat API:\n{pattern}")

def ex21():
    """FAISS IVF pattern"""
    pattern = """
import faiss
d, nlist = 128, 100
quantizer = faiss.IndexFlatL2(d)
index = faiss.IndexIVFFlat(quantizer, d, nlist)
index.train(train_vectors)             # required: train on representative data
index.add(vectors)
index.nprobe = 10                      # probe 10/100 clusters
D, I = index.search(query, k=10)
"""
    print(f"Ex21 — FAISS IVF pattern:\n{pattern}")

def ex22():
    """FAISS HNSW pattern"""
    pattern = """
import faiss
d, M = 128, 32
index = faiss.IndexHNSWFlat(d, M)
index.hnsw.efConstruction = 200        # build quality
index.add(vectors)
index.hnsw.efSearch = 64               # query quality
D, I = index.search(query, k=10)
# No training needed; supports only add (no delete without rebuild)
"""
    print(f"Ex22 — FAISS HNSW pattern:\n{pattern}")

def ex23():
    """Chroma DB pattern"""
    pattern = """
import chromadb
client = chromadb.Client()
collection = client.create_collection("docs")
collection.add(
    embeddings=[[0.1, 0.2, ...], [0.3, 0.4, ...]],
    documents=["text1", "text2"],
    ids=["id1", "id2"]
)
results = collection.query(query_embeddings=[[0.1, 0.2, ...]], n_results=5)
"""
    print(f"Ex23 — Chroma DB pattern:\n{pattern}")

def ex24():
    """Pinecone pattern"""
    pattern = """
import pinecone
pinecone.init(api_key="...", environment="us-west1-gcp")
index = pinecone.Index("my-index")
index.upsert(vectors=[("id1", [0.1, 0.2, ...], {"source": "web"})])
results = index.query(vector=[0.1, 0.2, ...], top_k=10, include_metadata=True)
# Fully managed, serverless, handles replication/sharding automatically
"""
    print(f"Ex24 — Pinecone pattern:\n{pattern}")

def ex25():
    """Weaviate pattern"""
    pattern = """
import weaviate
client = weaviate.Client("http://localhost:8080")
client.schema.create_class({"class": "Document", "vectorizer": "none"})
client.data_object.create({"text": "hello"}, "Document", vector=[0.1, 0.2, ...])
results = client.query.get("Document").with_near_vector({"vector": [0.1, ...]}).with_limit(5).do()
# Supports GraphQL queries, hybrid search (BM25 + vector)
"""
    print(f"Ex25 — Weaviate pattern:\n{pattern}")

def ex26():
    """Qdrant pattern"""
    pattern = """
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct
client = QdrantClient(host="localhost", port=6333)
client.create_collection("docs", vectors_config=VectorParams(size=128, distance=Distance.COSINE))
client.upsert("docs", points=[PointStruct(id=1, vector=[0.1, ...], payload={"text": "hello"})])
hits = client.search("docs", query_vector=[0.1, ...], limit=10)
# Supports payload filtering, named vectors, on-disk storage
"""
    print(f"Ex26 — Qdrant pattern:\n{pattern}")

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """SimpleVectorStore class with add/search/delete/update"""
    class SimpleVectorStore:
        def __init__(self, dim):
            self.dim = dim
            self._store = {}
        def add(self, id_, vec):
            self._store[id_] = np.array(vec, dtype=np.float32)
        def delete(self, id_):
            self._store.pop(id_, None)
        def update(self, id_, vec):
            self._store[id_] = np.array(vec, dtype=np.float32)
        def search(self, query, k=3):
            q = np.array(query, dtype=np.float32)
            scores = {k_: float(np.dot(q, v) / (np.linalg.norm(q) * np.linalg.norm(v) + 1e-9))
                      for k_, v in self._store.items()}
            return sorted(scores, key=scores.get, reverse=True)[:k]

    np.random.seed(7)
    vs = SimpleVectorStore(dim=32)
    for i in range(20):
        vs.add(f"doc_{i}", np.random.randn(32))
    vs.delete("doc_0")
    vs.update("doc_1", np.random.randn(32))
    results = vs.search(np.random.randn(32), k=3)
    print(f"Ex27 — SimpleVectorStore: size={len(vs._store)}, top-3 search: {results}")

def ex28():
    """VectorStore with metadata filtering"""
    class MetaVectorStore:
        def __init__(self):
            self._vecs = {}
            self._meta = {}
        def add(self, id_, vec, meta=None):
            self._vecs[id_] = np.array(vec, dtype=np.float32)
            self._meta[id_] = meta or {}
        def search(self, query, k=3, filter_=None):
            q = np.array(query, dtype=np.float32)
            candidates = {id_ for id_, m in self._meta.items()
                          if filter_ is None or all(m.get(fk) == fv for fk, fv in filter_.items())}
            scores = {id_: float(np.dot(q, self._vecs[id_]) /
                                 (np.linalg.norm(q) * np.linalg.norm(self._vecs[id_]) + 1e-9))
                      for id_ in candidates}
            return sorted(scores, key=scores.get, reverse=True)[:k]

    np.random.seed(3)
    mvs = MetaVectorStore()
    for i in range(30):
        mvs.add(f"doc_{i}", np.random.randn(32), meta={"category": "A" if i % 2 == 0 else "B"})
    results = mvs.search(np.random.randn(32), k=3, filter_={"category": "A"})
    print(f"Ex28 — MetaVectorStore filtered search (cat=A): {results}")

def ex29():
    """VectorStore with namespaces"""
    class NamespacedStore:
        def __init__(self):
            self._ns = defaultdict(dict)
        def add(self, ns, id_, vec):
            self._ns[ns][id_] = np.array(vec, dtype=np.float32)
        def search(self, ns, query, k=3):
            q = np.array(query, dtype=np.float32)
            store = self._ns[ns]
            if not store:
                return []
            scores = {id_: float(np.dot(q, v) / (np.linalg.norm(q) * np.linalg.norm(v) + 1e-9))
                      for id_, v in store.items()}
            return sorted(scores, key=scores.get, reverse=True)[:k]
        def ns_size(self, ns):
            return len(self._ns[ns])

    np.random.seed(5)
    ns_store = NamespacedStore()
    for i in range(20):
        ns_store.add("users", f"u{i}", np.random.randn(32))
        ns_store.add("products", f"p{i}", np.random.randn(32))
    r = ns_store.search("users", np.random.randn(32), k=2)
    print(f"Ex29 — Namespaced store: users={ns_store.ns_size('users')}, products={ns_store.ns_size('products')}, top-2 users: {r}")

def ex30():
    """Sharded vector store (2 shards)"""
    class ShardedStore:
        def __init__(self, n_shards=2):
            self.n_shards = n_shards
            self.shards = [dict() for _ in range(n_shards)]
        def _shard(self, id_):
            return hash(id_) % self.n_shards
        def add(self, id_, vec):
            self.shards[self._shard(id_)][id_] = np.array(vec, dtype=np.float32)
        def shard_sizes(self):
            return [len(s) for s in self.shards]

    np.random.seed(9)
    ss = ShardedStore(n_shards=2)
    for i in range(100):
        ss.add(f"doc_{i}", np.random.randn(32))
    print(f"Ex30 — Sharded store: shard sizes={ss.shard_sizes()} (total={sum(ss.shard_sizes())})")

def ex31():
    """Distributed search: merge results from 2 shards"""
    np.random.seed(11)
    shard1 = {f"s1_{i}": np.random.randn(32).astype(np.float32) for i in range(50)}
    shard2 = {f"s2_{i}": np.random.randn(32).astype(np.float32) for i in range(50)}
    query = np.random.randn(32).astype(np.float32)

    def search_shard(shard, q, k=5):
        scores = {id_: float(np.dot(q, v) / (np.linalg.norm(q) * np.linalg.norm(v) + 1e-9))
                  for id_, v in shard.items()}
        return sorted(scores.items(), key=lambda x: x[1], reverse=True)[:k]

    r1 = search_shard(shard1, query, k=5)
    r2 = search_shard(shard2, query, k=5)
    merged = sorted(r1 + r2, key=lambda x: x[1], reverse=True)[:5]
    print(f"Ex31 — Distributed search merged top-5: {[(id_, round(s, 3)) for id_, s in merged]}")

def ex32():
    """Vector store with TTL (time-to-live)"""
    class TTLVectorStore:
        def __init__(self):
            self._vecs = {}
            self._expiry = {}
        def add(self, id_, vec, ttl_s=60):
            self._vecs[id_] = np.array(vec, dtype=np.float32)
            self._expiry[id_] = time.time() + ttl_s
        def get(self, id_):
            if id_ in self._expiry and time.time() > self._expiry[id_]:
                del self._vecs[id_]; del self._expiry[id_]
                return None
            return self._vecs.get(id_)
        def live_count(self):
            now = time.time()
            return sum(1 for exp in self._expiry.values() if now < exp)

    tvs = TTLVectorStore()
    tvs.add("fresh", np.random.randn(32), ttl_s=3600)
    tvs.add("expired", np.random.randn(32), ttl_s=-1)  # already expired
    print(f"Ex32 — TTL store: 'fresh' found={tvs.get('fresh') is not None}, 'expired' found={tvs.get('expired') is not None}, live={tvs.live_count()}")

def ex33():
    """Vector store with backup/restore (JSON-serializable)"""
    def backup_store(store, path=None):
        serialized = {k: v.tolist() for k, v in store.items()}
        return json.dumps(serialized)

    def restore_store(blob):
        data = json.loads(blob)
        return {k: np.array(v, dtype=np.float32) for k, v in data.items()}

    np.random.seed(13)
    original = {f"doc_{i}": np.random.randn(8).astype(np.float32) for i in range(5)}
    blob = backup_store(original)
    restored = restore_store(blob)
    match = all(np.allclose(original[k], restored[k]) for k in original)
    print(f"Ex33 — Backup/restore: blob_len={len(blob)}, restored_size={len(restored)}, exact_match={match}")

def ex34():
    """Index rebuild procedure"""
    np.random.seed(15)
    raw_data = {f"doc_{i}": np.random.randn(32).astype(np.float32) for i in range(200)}

    def build_index(data):
        ids = list(data.keys())
        matrix = np.stack([data[id_] for id_ in ids])  # (N, d)
        norms = np.linalg.norm(matrix, axis=1, keepdims=True)
        return ids, matrix / norms

    t0 = time.time()
    ids, index_matrix = build_index(raw_data)
    elapsed = (time.time() - t0) * 1000
    print(f"Ex34 — Index rebuild: {len(ids)} vectors, matrix shape={index_matrix.shape}, time={elapsed:.2f}ms")

def ex35():
    """Vector store with batched upsert"""
    store = {}
    def batch_upsert(store, batch):
        inserted, updated = 0, 0
        for id_, vec in batch.items():
            if id_ in store:
                updated += 1
            else:
                inserted += 1
            store[id_] = np.array(vec, dtype=np.float32)
        return inserted, updated

    np.random.seed(17)
    initial = {f"doc_{i}": np.random.randn(32) for i in range(50)}
    store.update({k: np.array(v, dtype=np.float32) for k, v in initial.items()})
    new_batch = {f"doc_{i}": np.random.randn(32) for i in range(40, 80)}  # 10 updates, 30 inserts
    ins, upd = batch_upsert(store, new_batch)
    print(f"Ex35 — Batched upsert: inserted={ins}, updated={upd}, store size={len(store)}")

def ex36():
    """Approximate vs exact recall benchmark (numpy)"""
    np.random.seed(19)
    n, d, k = 2000, 64, 10
    data = np.random.randn(n, d).astype(np.float32)
    queries = np.random.randn(20, d).astype(np.float32)
    data_norm = data / np.linalg.norm(data, axis=1, keepdims=True)
    q_norm = queries / np.linalg.norm(queries, axis=1, keepdims=True)

    exact_scores = q_norm @ data_norm.T
    exact_top_k = np.argsort(-exact_scores, axis=1)[:, :k]

    # Approx: search only first 20% of data
    approx_scores = q_norm @ data_norm[:400].T
    approx_top_k = np.argsort(-approx_scores, axis=1)[:, :k]

    recalls = []
    for i in range(len(queries)):
        overlap = len(set(exact_top_k[i]) & set(approx_top_k[i]))
        recalls.append(overlap / k)
    print(f"Ex36 — Recall@{k} (approx 20% of data): mean={np.mean(recalls):.3f}, min={np.min(recalls):.3f}")

def ex37():
    """Vector compression using PCA"""
    from sklearn.decomposition import PCA
    np.random.seed(21)
    data = np.random.randn(500, 256).astype(np.float32)
    pca = PCA(n_components=64)
    compressed = pca.fit_transform(data)
    ratio = data.nbytes / compressed.nbytes
    var_explained = pca.explained_variance_ratio_.sum()
    print(f"Ex37 — PCA compression: {data.shape} → {compressed.shape}, ratio={ratio:.1f}×, variance_explained={var_explained:.3f}")

def ex38():
    """Production vector store architecture"""
    arch = """
Production Vector Store Architecture:
  ┌─────────────┐    ┌──────────────────────────────────────────┐
  │  Client API  │───▶│  Load Balancer (round-robin)             │
  └─────────────┘    └──────────┬───────────────────────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                  ▼
       ┌────────────┐   ┌────────────┐    ┌────────────┐
       │  Shard 0   │   │  Shard 1   │    │  Shard 2   │
       │(HNSW index)│   │(HNSW index)│    │(HNSW index)│
       │  Replica×2 │   │  Replica×2 │    │  Replica×2 │
       └────────────┘   └────────────┘    └────────────┘
              │
       ┌──────▼──────┐
       │  Object     │  ← Raw vectors (S3/GCS) for backup
       │  Storage    │
       └─────────────┘
  Routing: consistent hashing on vector ID
  Replication: leader-follower, async replication
  Index: HNSW per shard, rebuild triggered on compaction
"""
    print(f"Ex38 — Architecture:\n{arch}")

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """FAISS scaling benchmarks (show table)"""
    table = """
FAISS Index Benchmarks (128-dim, 1M vectors, top-10 search):
╔══════════════╦═══════════╦════════════╦══════════╦════════════╗
║ Index Type   ║ Build (s) ║ Search(ms) ║ Recall@10║ Memory(GB) ║
╠══════════════╬═══════════╬════════════╬══════════╬════════════╣
║ Flat (exact) ║    2.1    ║   120.0    ║  1.000   ║    0.51    ║
║ IVF100,Flat  ║    8.4    ║     3.2    ║  0.921   ║    0.51    ║
║ IVF100,PQ64  ║   15.6    ║     1.1    ║  0.874   ║    0.07    ║
║ HNSW32       ║   42.3    ║     0.4    ║  0.985   ║    0.67    ║
║ HNSW64       ║   78.1    ║     0.5    ║  0.994   ║    0.82    ║
╚══════════════╩═══════════╩════════════╩══════════╩════════════╝
"""
    print(f"Ex39 — FAISS benchmarks:\n{table}")

def ex40():
    """1M vector capacity planning"""
    configs = [
        ("OpenAI ada-002", 1536, 4, 1_000_000),
        ("sentence-bert",  768,  4, 1_000_000),
        ("CLIP",           512,  4, 1_000_000),
        ("Custom small",   128,  4, 1_000_000),
    ]
    print("Ex40 — 1M Vector Capacity Planning:")
    print(f"  {'Model':<20} {'Dim':>5} {'Raw GB':>8} {'HNSW OH':>9} {'Total GB':>9}")
    for name, dim, bpf, n in configs:
        raw_gb = n * dim * bpf / 1e9
        hnsw_oh = raw_gb * 0.3  # ~30% overhead for graph links
        print(f"  {name:<20} {dim:>5} {raw_gb:>8.2f} {hnsw_oh:>9.2f} {raw_gb+hnsw_oh:>9.2f}")

def ex41():
    """GPU vs CPU vector search comparison"""
    comparison = """
GPU vs CPU Vector Search (1M vectors, 128-dim, batch=1000 queries):
┌─────────────────┬──────────────┬──────────────┬─────────────────┐
│ Hardware        │ QPS (exact)  │ QPS (approx) │ Cost/hr (cloud) │
├─────────────────┼──────────────┼──────────────┼─────────────────┤
│ CPU (32-core)   │    2,500     │   45,000     │     $2.50       │
│ GPU (A100 40GB) │   85,000     │  380,000     │    $12.00       │
│ GPU (V100 16GB) │   42,000     │  195,000     │     $6.50       │
│ GPU (T4 16GB)   │   18,000     │   88,000     │     $2.10       │
├─────────────────┼──────────────┼──────────────┼─────────────────┤
│ Break-even QPS for GPU: ~8,000 QPS (cost per query basis)       │
└─────────────────┴──────────────┴──────────────┴─────────────────┘
"""
    print(f"Ex41 — GPU vs CPU:{comparison}")

def ex42():
    """Multi-tenant vector isolation"""
    isolation = """
Multi-tenant Vector Isolation Strategies:
  1. Namespace per tenant (same index, filtered search):
       - Pros: low resource overhead, easy to add tenants
       - Cons: noisy neighbor, metadata filtering adds latency
  2. Index per tenant (dedicated HNSW/IVF per tenant):
       - Pros: full isolation, optimal per-tenant tuning
       - Cons: high resource cost, limits tenant count
  3. Shard per tenant group (cluster small tenants together):
       - Pros: balance isolation vs cost
       - Cons: complex routing logic
  Recommendation: namespace for <10K vectors/tenant; dedicated index for >1M vectors/tenant
"""
    print(f"Ex42 — Multi-tenant isolation:{isolation}")

def ex43():
    """Vector store replication concept"""
    replication = """
Vector Store Replication:
  Leader-Follower:
    - Leader handles all writes (add/delete/update)
    - Followers replicate asynchronously (eventual consistency)
    - Reads served from followers (scale reads horizontally)
    - Failover: promote follower to leader in ~30s
  Sync replication (strong consistency):
    - Write acknowledged only after N replicas confirm
    - Latency penalty: +5-15ms per hop
  Use case mapping:
    - High-availability search (reads): async replication sufficient
    - Financial/audit logs: sync replication required
"""
    print(f"Ex43 — Replication:{replication}")

def ex44():
    """Hot/cold tier vector storage"""
    tiers = """
Hot/Cold Tier Vector Storage:
  HOT tier  (in-memory HNSW):  last 30 days, <1ms latency,  $12/GB/month
  WARM tier (SSD-backed index): 30-180 days, ~5ms latency,  $0.50/GB/month
  COLD tier (object storage):   >180 days,   ~500ms latency, $0.023/GB/month

  Migration policy:
    - Cron job runs nightly: move vectors with last_access > threshold to next tier
    - On access: promote cold→hot asynchronously, serve cold result immediately
  Savings example (1M vectors, 1536-dim):
    Raw size = 6 GB
    All-hot cost:  $72/month
    Tiered (80% cold, 15% warm, 5% hot): ~$4.40/month  (94% saving)
"""
    print(f"Ex44 — Hot/cold tiers:{tiers}")

def ex45():
    """Vector quantization: PQ encoding steps (numpy simulation)"""
    np.random.seed(23)
    n, d, M = 200, 32, 4  # M subspaces
    sub_d = d // M
    K = 8  # codebook size per subspace (small for demo)
    data = np.random.randn(n, d).astype(np.float32)
    codebooks = []
    codes = np.zeros((n, M), dtype=np.uint8)
    for m in range(M):
        sub = data[:, m*sub_d:(m+1)*sub_d]
        centers = sub[np.random.choice(n, K, replace=False)]
        dists = np.linalg.norm(sub[:, None] - centers[None, :], axis=2)
        codes[:, m] = np.argmin(dists, axis=1).astype(np.uint8)
        codebooks.append(centers)
    orig_bytes = data.nbytes
    pq_bytes = codes.nbytes
    print(f"Ex45 — PQ encoding: original={orig_bytes}B, encoded={pq_bytes}B, ratio={orig_bytes/pq_bytes:.0f}×")

def ex46():
    """Learned index concept"""
    concept = """
Learned Index for Vector Search:
  Traditional: B-tree or hash index → assumes fixed data distribution
  Learned index: train a small ML model to predict position of a key

  For vectors (approximate):
    1. Train a regression model: f(vec) → bucket_id (0..K)
    2. At insert: compute bucket = f(vec), store in that bucket
    3. At query:  compute bucket = f(query), search only nearby buckets

  Examples:
    - SPANN: uses learned partitioning (k-means hierarchy)
    - DiskANN: learned graph construction for billion-scale on SSD
    - ScaNN (Google): learned quantization + reordering

  Benefit: can achieve 10× better recall/QPS tradeoff vs hand-tuned IVF
"""
    print(f"Ex46 — Learned index:{concept}")

def ex47():
    """Streaming vector ingestion"""
    concept = """
Streaming Vector Ingestion Pipeline:
  Source → Kafka topic (raw documents)
       ↓
  Embedding service (Kafka consumer, batch=32, 50ms window)
       ↓
  Vector store writer (upsert to HNSW shard, buffered commit every 1000 ops)
       ↓
  Index compaction (background: merge small segments, rebuild HNSW links)

  Throughput targets:
    - 10K docs/sec ingestion
    - Embedding: 32 docs/batch × 300 batches/sec = ~10K docs/sec
    - Write amplification: 1 upsert ≈ 3 HNSW link updates
    - Commit lag: <5s from ingest to searchable

  Key knob: efConstruction (lower = faster insert, lower recall)
"""
    print(f"Ex47 — Streaming ingestion:{concept}")

def ex48():
    """Vector store monitoring metrics"""
    np.random.seed(25)
    metrics = {
        "index_size_vectors": 1_024_000,
        "qps_p50_ms": round(float(np.random.normal(1.2, 0.1)), 3),
        "qps_p95_ms": round(float(np.random.normal(4.8, 0.5)), 3),
        "qps_p99_ms": round(float(np.random.normal(12.1, 1.0)), 3),
        "recall_at_10": round(float(np.random.normal(0.967, 0.005)), 4),
        "index_build_lag_s": round(float(np.random.normal(2.3, 0.3)), 2),
        "cache_hit_rate": round(float(np.random.uniform(0.65, 0.85)), 3),
        "shard_imbalance_pct": round(float(np.random.uniform(0.5, 5.0)), 2),
    }
    print("Ex48 — Vector Store Monitoring Metrics:")
    for k, v in metrics.items():
        print(f"  {k:<30}: {v}")

def ex49():
    """Vector store cost calculator"""
    def calc_cost(n_vectors, dim, qps, hours_per_day=24):
        bytes_per_vec = dim * 4
        raw_gb = n_vectors * bytes_per_vec / 1e9
        hnsw_gb = raw_gb * 1.3
        mem_cost_month = hnsw_gb * 6.0   # ~$6/GB/month for in-memory
        instance_cores = max(4, int(qps / 2000) * 4)
        compute_cost_month = instance_cores * 0.05 * hours_per_day * 30  # $0.05/core/hr
        total = mem_cost_month + compute_cost_month
        return {"vectors": n_vectors, "dim": dim, "mem_gb": round(hnsw_gb, 2),
                "mem_$/mo": round(mem_cost_month, 2), "compute_$/mo": round(compute_cost_month, 2),
                "total_$/mo": round(total, 2)}

    print("Ex49 — Vector Store Cost Calculator:")
    for cfg in [(100_000, 768, 500), (1_000_000, 1536, 2000), (10_000_000, 256, 10000)]:
        r = calc_cost(*cfg)
        print(f"  {r['vectors']:>10,} vecs, {r['dim']}d, {cfg[2]} QPS → mem={r['mem_gb']}GB, ${r['total_$/mo']}/mo")

def ex50():
    """Production vector DB decision matrix"""
    matrix = """
Production Vector DB Decision Matrix:
╔══════════════╦════════╦═════════╦══════════╦═══════════╦══════════════╗
║ Criteria     ║ FAISS  ║ Chroma  ║ Pinecone ║  Weaviate ║   Qdrant     ║
╠══════════════╬════════╬═════════╬══════════╬═══════════╬══════════════╣
║ Scale (vecs) ║  100M+ ║   <10M  ║    100M+ ║   50M+    ║    100M+     ║
║ Managed      ║   No   ║  Local  ║   Yes    ║  Yes/Self ║   Yes/Self   ║
║ Metadata     ║   No   ║   Yes   ║   Yes    ║    Yes    ║    Yes       ║
║ Hybrid search║   No   ║   No    ║   No     ║    Yes    ║    Yes       ║
║ Multi-tenant ║  DIY   ║   No    ║   Yes    ║    Yes    ║    Yes       ║
║ Cost ($/mo)  ║  Low   ║  Free   ║  $$-$$$  ║   $$      ║   $-$$       ║
║ GPU support  ║  Yes   ║   No    ║   N/A    ║    No     ║    No        ║
╚══════════════╩════════╩═════════╩══════════╩═══════════╩══════════════╝
  Recommendation:
    - Prototype / local:  Chroma
    - Production managed: Pinecone (simplest) or Qdrant (most features)
    - On-prem billion-scale: FAISS + custom serving layer
    - Hybrid search needed: Weaviate or Qdrant
"""
    print(f"Ex50 — Decision Matrix:\n{matrix}")

# ─── MAIN ───────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("Examples 5.1 — Vector Database Scaling")
    print("=" * 60)
    print("\n─── BASIC (1–13) ───")
    ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07()
    ex08(); ex09(); ex10(); ex11(); ex12(); ex13()
    print("\n─── INTERMEDIATE (14–26) ───")
    ex14(); ex15(); ex16(); ex17(); ex18(); ex19(); ex20()
    ex21(); ex22(); ex23(); ex24(); ex25(); ex26()
    print("\n─── NESTED (27–38) ───")
    ex27(); ex28(); ex29(); ex30(); ex31(); ex32(); ex33()
    ex34(); ex35(); ex36(); ex37(); ex38()
    print("\n─── ADVANCED (39–50) ───")
    ex39(); ex40(); ex41(); ex42(); ex43(); ex44(); ex45()
    ex46(); ex47(); ex48(); ex49(); ex50()

if __name__ == "__main__":
    main()
