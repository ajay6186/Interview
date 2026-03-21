# ============================================================
# Examples 3.3 - Embeddings & RAG (50 examples)
# BASIC (1-13) | INTERMEDIATE (14-26) | NESTED (27-38) | ADVANCED (39-50)
# ============================================================

import sys
import io
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
else:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.neighbors import NearestNeighbors
from sklearn.decomposition import PCA

# --- BASIC (1-13) -------------------------------------------

def ex01():
    """Random embedding vector (simulating a model output)"""
    np.random.seed(42)
    embedding = np.random.randn(768)
    embedding = embedding / np.linalg.norm(embedding)
    print(f"Ex01 — Random Embedding: shape={embedding.shape}, norm={np.linalg.norm(embedding):.4f}")

def ex02():
    """Cosine similarity between 2 vectors"""
    np.random.seed(0)
    a = np.random.randn(128)
    b = np.random.randn(128)
    cos_sim = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
    print(f"Ex02 — Cosine Similarity: {cos_sim:.4f}")

def ex03():
    """Euclidean distance between 2 embedding vectors"""
    np.random.seed(1)
    a = np.random.randn(128)
    b = np.random.randn(128)
    dist = np.linalg.norm(a - b)
    print(f"Ex03 — Euclidean Distance: {dist:.4f}")

def ex04():
    """Dot product similarity"""
    np.random.seed(2)
    a = np.random.randn(64)
    b = np.random.randn(64)
    dot = np.dot(a, b)
    print(f"Ex04 — Dot Product Similarity: {dot:.4f}")

def ex05():
    """Normalize vector to unit length"""
    v = np.array([3.0, 4.0, 0.0])
    v_norm = v / np.linalg.norm(v)
    print(f"Ex05 — Normalized Vector: {v} → {v_norm}, norm={np.linalg.norm(v_norm):.4f}")

def ex06():
    """Batch cosine similarity: matrix of vectors vs query vector"""
    np.random.seed(3)
    matrix = np.random.randn(10, 128)
    query = np.random.randn(128)
    norms_mat = np.linalg.norm(matrix, axis=1, keepdims=True)
    norm_q = np.linalg.norm(query)
    sims = (matrix @ query) / (norms_mat.squeeze() * norm_q)
    top3 = np.argsort(sims)[-3:][::-1]
    print(f"Ex06 — Batch Cosine Similarity: top-3 indices={top3.tolist()}, scores={np.round(sims[top3], 4).tolist()}")

def ex07():
    """TF-IDF vector for a single sentence (sklearn)"""
    corpus = ["the cat sat on the mat", "the dog ran in the park",
              "cats and dogs are great pets"]
    query = "my cat is great"
    tv = TfidfVectorizer()
    tv.fit(corpus)
    vec = tv.transform([query])
    print(f"Ex07 — TF-IDF Vector: shape={vec.shape}, nnz={vec.nnz}, "
          f"top feature='{tv.get_feature_names_out()[vec.indices[np.argmax(vec.data)]]}'"
          if vec.nnz > 0 else f"Ex07 — TF-IDF Vector: shape={vec.shape}, nnz=0")

def ex08():
    """Most similar document from 5 using TF-IDF + cosine similarity"""
    docs = [
        "I love machine learning algorithms",
        "Deep learning uses neural networks",
        "Python is great for data science",
        "Natural language processing is exciting",
        "Statistics and probability theory",
    ]
    query = "neural network deep learning models"
    tv = TfidfVectorizer()
    X = tv.fit_transform(docs)
    q_vec = tv.transform([query])
    sims = cosine_similarity(q_vec, X)[0]
    best = np.argmax(sims)
    print(f"Ex08 — Most Similar Doc: idx={best}, score={sims[best]:.4f}")
    print(f"  Query: '{query}'")
    print(f"  Match: '{docs[best]}'")

def ex09():
    """k-NN on embeddings (k=3)"""
    np.random.seed(42)
    embeddings = np.random.randn(20, 64)
    query = np.random.randn(1, 64)
    knn = NearestNeighbors(n_neighbors=3, metric="cosine")
    knn.fit(embeddings)
    dists, indices = knn.kneighbors(query)
    print(f"Ex09 — k-NN (k=3): indices={indices[0].tolist()}, distances={np.round(dists[0], 4).tolist()}")

def ex10():
    """Embedding dimensionality across common models (print table)"""
    print("Ex10 — Embedding Dimensions by Model:")
    table = [
        ("Word2Vec / GloVe", 100, 300),
        ("FastText", 100, 300),
        ("BERT-base", 768, 768),
        ("BERT-large", 1024, 1024),
        ("text-embedding-ada-002", 1536, 1536),
        ("text-embedding-3-small", 1536, 1536),
        ("text-embedding-3-large", 3072, 3072),
        ("all-MiniLM-L6-v2", 384, 384),
        ("all-mpnet-base-v2", 768, 768),
    ]
    print(f"  {'Model':<30} {'Min Dim':>8} {'Max Dim':>8}")
    print("  " + "-" * 48)
    for model, lo, hi in table:
        print(f"  {model:<30} {lo:>8} {hi:>8}")

def ex11():
    """Semantic search: query → top-1 document"""
    docs = [
        "Python programming language tutorial",
        "Machine learning model training",
        "How to cook pasta at home",
        "Best practices for software testing",
        "Introduction to neural networks",
    ]
    query = "guide to training ML models"
    tv = TfidfVectorizer()
    X = tv.fit_transform(docs)
    q_vec = tv.transform([query])
    sims = cosine_similarity(q_vec, X)[0]
    top1 = np.argmax(sims)
    print(f"Ex11 — Semantic Search:")
    print(f"  Query: '{query}'")
    print(f"  Top-1: '{docs[top1]}' (score={sims[top1]:.4f})")

def ex12():
    """Sentence similarity score (0 to 1)"""
    def tfidf_similarity(s1, s2):
        tv = TfidfVectorizer()
        vecs = tv.fit_transform([s1, s2])
        return cosine_similarity(vecs[0], vecs[1])[0, 0]
    pairs = [
        ("I love dogs", "I love cats"),
        ("The weather is sunny", "It is a nice day"),
        ("Machine learning", "Deep neural networks"),
    ]
    print("Ex12 — Sentence Similarity Scores:")
    for s1, s2 in pairs:
        sim = tfidf_similarity(s1, s2)
        print(f"  '{s1}' vs '{s2}': {sim:.4f}")

def ex13():
    """Embedding cache using a dictionary"""
    class EmbeddingCache:
        def __init__(self):
            self._cache = {}
            self._hits = 0
            self._misses = 0
        def get(self, key, compute_fn):
            if key in self._cache:
                self._hits += 1
                return self._cache[key]
            self._misses += 1
            val = compute_fn(key)
            self._cache[key] = val
            return val
    cache = EmbeddingCache()
    fake_embed = lambda text: np.random.randn(128)
    texts = ["hello world", "foo bar", "hello world", "baz", "foo bar"]
    for t in texts:
        cache.get(t, fake_embed)
    print(f"Ex13 — Embedding Cache: hits={cache._hits}, misses={cache._misses}, size={len(cache._cache)}")

# --- INTERMEDIATE (14-26) ----------------------------------

def ex14():
    """Build corpus embeddings using TF-IDF on 10 documents"""
    docs = [
        "Artificial intelligence transforms industries",
        "Machine learning models require training data",
        "Deep learning uses many layers of neurons",
        "Natural language processing handles text",
        "Computer vision analyzes images and video",
        "Reinforcement learning trains agents via rewards",
        "Transfer learning adapts pretrained models",
        "Data preprocessing improves model performance",
        "Hyperparameter tuning optimizes model results",
        "Model evaluation measures prediction quality",
    ]
    tv = TfidfVectorizer()
    embeddings = tv.fit_transform(docs)
    print(f"Ex14 — Corpus Embeddings: {len(docs)} docs × {embeddings.shape[1]} features")
    print(f"  Sparsity: {100*(1-embeddings.nnz/(embeddings.shape[0]*embeddings.shape[1])):.1f}%")

def ex15():
    """Top-k retrieval function"""
    docs = [
        "Python is a popular programming language",
        "Java is used for enterprise applications",
        "JavaScript runs in the browser",
        "Python libraries include numpy and pandas",
        "Machine learning in Python with sklearn",
    ]
    def topk_retrieve(query, docs, k=3):
        tv = TfidfVectorizer()
        X = tv.fit_transform(docs)
        q_vec = tv.transform([query])
        sims = cosine_similarity(q_vec, X)[0]
        top_k = np.argsort(sims)[-k:][::-1]
        return [(i, sims[i], docs[i]) for i in top_k]
    results = topk_retrieve("Python machine learning", docs, k=3)
    print("Ex15 — Top-k Retrieval:")
    for rank, (idx, score, doc) in enumerate(results, 1):
        print(f"  {rank}. [{idx}] {score:.4f} — '{doc}'")

def ex16():
    """Similarity threshold filtering (only return results above threshold)"""
    docs = [
        "The cat sat on the mat",
        "Deep neural networks learn features automatically",
        "I enjoy hiking in the mountains",
        "Transformer models use self-attention mechanisms",
        "The stock market fluctuates daily",
    ]
    query = "attention mechanism in transformers"
    threshold = 0.1
    tv = TfidfVectorizer()
    X = tv.fit_transform(docs)
    q_vec = tv.transform([query])
    sims = cosine_similarity(q_vec, X)[0]
    results = [(i, sims[i], docs[i]) for i in range(len(docs)) if sims[i] >= threshold]
    results.sort(key=lambda x: -x[1])
    print(f"Ex16 — Threshold Filtering (>={threshold}):")
    if results:
        for idx, score, doc in results:
            print(f"  [{idx}] {score:.4f} — '{doc}'")
    else:
        print("  No results above threshold")

def ex17():
    """Chunking text into fixed-size character chunks"""
    def chunk_fixed(text, chunk_size=100):
        return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
    text = ("Artificial intelligence is a broad field of computer science "
            "concerned with building smart machines capable of performing tasks "
            "that typically require human intelligence. Machine learning is a "
            "subset of AI that focuses on training models from data.")
    chunks = chunk_fixed(text, 80)
    print(f"Ex17 — Fixed Chunking (size=80): {len(chunks)} chunks")
    for i, c in enumerate(chunks):
        print(f"  Chunk {i}: '{c[:50]}...' (len={len(c)})")

def ex18():
    """Chunking with overlap (50-char overlap)"""
    def chunk_overlap(text, size=100, overlap=50):
        chunks = []
        start = 0
        while start < len(text):
            chunks.append(text[start:start+size])
            if start + size >= len(text):
                break
            start += size - overlap
        return chunks
    text = ("Machine learning models are trained on large datasets. "
            "The training process involves optimizing a loss function. "
            "Deep learning extends this with multiple hidden layers.")
    chunks = chunk_overlap(text, size=80, overlap=30)
    print(f"Ex18 — Overlap Chunking (size=80, overlap=30): {len(chunks)} chunks")
    for i, c in enumerate(chunks):
        print(f"  Chunk {i} (len={len(c)}): '{c[:40]}...'")

def ex19():
    """Sentence-boundary chunking"""
    import re
    def chunk_sentences(text, max_sentences=2):
        sentences = re.split(r"(?<=[.!?])\s+", text.strip())
        chunks = []
        for i in range(0, len(sentences), max_sentences):
            chunks.append(" ".join(sentences[i:i+max_sentences]))
        return chunks
    text = ("The sky is blue. Clouds float overhead. The sun shines brightly. "
            "Birds fly in the distance. A gentle breeze blows. The trees sway.")
    chunks = chunk_sentences(text, max_sentences=2)
    print(f"Ex19 — Sentence Chunking (2 sentences/chunk): {len(chunks)} chunks")
    for i, c in enumerate(chunks):
        print(f"  Chunk {i}: '{c}'")

def ex20():
    """Chunk metadata: id, source, position"""
    def create_chunks_with_metadata(text, source, chunk_size=80):
        raw = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
        return [{"id": f"{source}_{i}", "source": source,
                 "position": i, "text": chunk, "char_start": i*chunk_size}
                for i, chunk in enumerate(raw)]
    text = "This is a long document about AI and machine learning. " * 4
    chunks = create_chunks_with_metadata(text, source="doc_001")
    print(f"Ex20 — Chunk Metadata: {len(chunks)} chunks")
    for c in chunks[:3]:
        print(f"  {c['id']}: pos={c['position']}, text='{c['text'][:30]}...'")

def ex21():
    """Document embedding from chunks using mean pooling"""
    np.random.seed(42)
    def get_chunk_embedding(chunk_text, dim=64):
        np.random.seed(hash(chunk_text) % (2**32))
        return np.random.randn(dim)
    chunks = [
        "Introduction to machine learning concepts",
        "Supervised learning requires labeled data",
        "Unsupervised learning finds hidden patterns",
        "Model evaluation uses cross-validation",
    ]
    chunk_embeddings = np.array([get_chunk_embedding(c) for c in chunks])
    doc_embedding = chunk_embeddings.mean(axis=0)
    print(f"Ex21 — Mean Pooling: {len(chunks)} chunks → 1 doc embedding, shape={doc_embedding.shape}")
    print(f"  Per-chunk norms: {[round(np.linalg.norm(e), 3) for e in chunk_embeddings]}")
    print(f"  Doc embedding norm: {np.linalg.norm(doc_embedding):.3f}")

def ex22():
    """Update embedding store on new document addition"""
    class SimpleEmbeddingStore:
        def __init__(self):
            self.texts = []
            self.matrix = None
            self.tv = TfidfVectorizer()
        def add(self, text):
            self.texts.append(text)
            self.matrix = self.tv.fit_transform(self.texts)
        def size(self):
            return len(self.texts)
    store = SimpleEmbeddingStore()
    for doc in ["First document about AI", "Second document about ML",
                "Third document about NLP"]:
        store.add(doc)
        print(f"  Added doc: store size={store.size()}, matrix shape={store.matrix.shape}")
    print(f"Ex22 — Dynamic Embedding Store: final size={store.size()}")

def ex23():
    """Hybrid search: combine keyword + semantic scores"""
    docs = [
        "Python machine learning tutorial",
        "Deep learning neural network guide",
        "Python data analysis with pandas",
        "Natural language processing with Python",
        "Computer vision with OpenCV",
    ]
    query = "Python machine learning"
    tv = TfidfVectorizer()
    X = tv.fit_transform(docs)
    q_vec = tv.transform([query])
    semantic_scores = cosine_similarity(q_vec, X)[0]
    keyword_scores = np.array([1.0 if "python" in d.lower() else 0.0 for d in docs])
    alpha = 0.7
    hybrid_scores = alpha * semantic_scores + (1 - alpha) * keyword_scores
    ranked = np.argsort(hybrid_scores)[::-1]
    print("Ex23 — Hybrid Search (semantic 70% + keyword 30%):")
    for r in ranked[:3]:
        print(f"  [{r}] hybrid={hybrid_scores[r]:.3f}, sem={semantic_scores[r]:.3f}, kw={keyword_scores[r]:.1f} — '{docs[r]}'")

def ex24():
    """Embedding compression using PCA"""
    np.random.seed(42)
    embeddings = np.random.randn(50, 768)
    pca = PCA(n_components=64)
    compressed = pca.fit_transform(embeddings)
    variance_kept = pca.explained_variance_ratio_.sum()
    print(f"Ex24 — PCA Compression: 768 → 64 dims")
    print(f"  Variance retained: {variance_kept:.3f}")
    print(f"  Size reduction: {768*4/1024:.1f}KB → {64*4/1024:.2f}KB per vector")

def ex25():
    """Batch retrieval for multiple queries"""
    docs = [
        "Introduction to Python programming",
        "Machine learning fundamentals",
        "Deep learning with PyTorch",
        "Natural language processing basics",
        "Data visualization with matplotlib",
    ]
    queries = ["Python basics", "neural network frameworks", "visualizing data"]
    tv = TfidfVectorizer()
    X = tv.fit_transform(docs)
    Q = tv.transform(queries)
    sims = cosine_similarity(Q, X)
    print("Ex25 — Batch Retrieval:")
    for i, q in enumerate(queries):
        top1 = np.argmax(sims[i])
        print(f"  Query '{q}' → '{docs[top1]}' (score={sims[i, top1]:.4f})")

def ex26():
    """Re-ranking with TF-IDF exact match boost"""
    docs = [
        "Introduction to transformers in NLP",
        "Transformer architecture explained",
        "Using BERT transformers for text classification",
        "Attention mechanism in neural networks",
        "RNN vs Transformer comparison",
    ]
    query = "transformer architecture"
    tv = TfidfVectorizer()
    X = tv.fit_transform(docs)
    q_vec = tv.transform([query])
    semantic = cosine_similarity(q_vec, X)[0]
    exact_boost = np.array([0.2 if all(w in d.lower() for w in query.split()) else 0.0
                            for d in docs])
    reranked = semantic + exact_boost
    order = np.argsort(reranked)[::-1]
    print("Ex26 — Re-ranking with Exact Match Boost:")
    for r in order[:3]:
        print(f"  [{r}] sem={semantic[r]:.3f}, boost={exact_boost[r]:.1f}, final={reranked[r]:.3f} — '{docs[r]}'")

# --- NESTED (27-38) ----------------------------------------

def ex27():
    """SimpleVectorStore class with add, search, delete"""
    class SimpleVectorStore:
        def __init__(self):
            self._store = {}  # id → {"text": ..., "embedding": ...}
            self._next_id = 0
        def add(self, text, embedding):
            doc_id = self._next_id
            self._store[doc_id] = {"text": text, "embedding": embedding}
            self._next_id += 1
            return doc_id
        def search(self, query_emb, k=3):
            if not self._store:
                return []
            ids = list(self._store.keys())
            matrix = np.stack([self._store[i]["embedding"] for i in ids])
            sims = cosine_similarity(query_emb.reshape(1, -1), matrix)[0]
            top_k = np.argsort(sims)[-k:][::-1]
            return [(ids[i], sims[i], self._store[ids[i]]["text"]) for i in top_k]
        def delete(self, doc_id):
            return self._store.pop(doc_id, None) is not None
    np.random.seed(42)
    store = SimpleVectorStore()
    texts = ["AI research", "ML models", "NLP tasks", "CV applications", "RL agents"]
    for t in texts:
        emb = np.random.randn(64)
        store.add(t, emb)
    query_emb = np.random.randn(64)
    results = store.search(query_emb, k=3)
    store.delete(0)
    print(f"Ex27 — SimpleVectorStore: stored={store._next_id}, after delete={len(store._store)}")
    print(f"  Top-3 search: {[(r[0], round(r[1],4), r[2]) for r in results]}")

def ex28():
    """VectorStore with metadata filtering"""
    class MetadataVectorStore:
        def __init__(self):
            self._docs = []
        def add(self, text, embedding, metadata=None):
            self._docs.append({"text": text, "embedding": embedding,
                                "metadata": metadata or {}})
        def search(self, query_emb, k=3, filter_fn=None):
            candidates = [d for d in self._docs if filter_fn is None or filter_fn(d["metadata"])]
            if not candidates:
                return []
            matrix = np.stack([d["embedding"] for d in candidates])
            sims = cosine_similarity(query_emb.reshape(1, -1), matrix)[0]
            top_k = np.argsort(sims)[-k:][::-1]
            return [(sims[i], candidates[i]["text"], candidates[i]["metadata"]) for i in top_k]
    np.random.seed(0)
    store = MetadataVectorStore()
    data = [("Python basics", {"lang": "python", "level": "beginner"}),
            ("Advanced Python", {"lang": "python", "level": "advanced"}),
            ("Java intro", {"lang": "java", "level": "beginner"}),
            ("ML with Python", {"lang": "python", "level": "intermediate"}),
            ("Java OOP", {"lang": "java", "level": "advanced"})]
    for text, meta in data:
        store.add(text, np.random.randn(32), meta)
    query_emb = np.random.randn(32)
    python_only = store.search(query_emb, k=3, filter_fn=lambda m: m["lang"] == "python")
    print(f"Ex28 — Metadata Filtering (lang=python): {len(python_only)} results")
    for score, text, meta in python_only:
        print(f"  {score:.4f} | {text} | {meta}")

def ex29():
    """Chunker class with fixed, sentence, and overlap modes"""
    import re
    class Chunker:
        def __init__(self, mode="fixed", size=100, overlap=20):
            self.mode = mode
            self.size = size
            self.overlap = overlap
        def chunk(self, text):
            if self.mode == "fixed":
                return [text[i:i+self.size] for i in range(0, len(text), self.size)]
            elif self.mode == "overlap":
                chunks, start = [], 0
                while start < len(text):
                    chunks.append(text[start:start+self.size])
                    if start + self.size >= len(text): break
                    start += self.size - self.overlap
                return chunks
            elif self.mode == "sentence":
                sents = re.split(r"(?<=[.!?])\s+", text.strip())
                return [" ".join(sents[i:i+2]) for i in range(0, len(sents), 2)]
            return [text]
    text = ("Machine learning is transformative. Neural networks learn patterns. "
            "Data preprocessing matters. Feature engineering helps models. "
            "Cross-validation prevents overfitting. Hyperparameter tuning is key.")
    for mode in ["fixed", "overlap", "sentence"]:
        c = Chunker(mode=mode, size=60, overlap=20)
        chunks = c.chunk(text)
        print(f"Ex29 — Chunker mode={mode}: {len(chunks)} chunks")

def ex30():
    """RAGPipeline class: vectorstore + retriever + augmenter"""
    class RAGPipeline:
        def __init__(self, docs):
            self.docs = docs
            self.tv = TfidfVectorizer()
            self.X = self.tv.fit_transform(docs)
        def retrieve(self, query, k=3):
            q_vec = self.tv.transform([query])
            sims = cosine_similarity(q_vec, self.X)[0]
            top_k = np.argsort(sims)[-k:][::-1]
            return [(i, sims[i], self.docs[i]) for i in top_k]
        def augment(self, query, retrieved):
            context = "\n".join(f"[{i}] {doc}" for i, _, doc in retrieved)
            return f"Context:\n{context}\n\nQuestion: {query}\nAnswer: [LLM would answer here]"
        def query(self, q, k=3):
            retrieved = self.retrieve(q, k)
            return self.augment(q, retrieved)
    docs = ["Python is great for data science", "Machine learning uses algorithms",
            "Deep learning needs GPUs", "NLP processes text", "RAG retrieves context"]
    rag = RAGPipeline(docs)
    result = rag.query("what is machine learning?", k=2)
    print("Ex30 — RAGPipeline:")
    print(result[:200])

def ex31():
    """Full RAG demo: 10 docs, 5 queries, print answers"""
    docs = [
        "Python is a high-level programming language created by Guido van Rossum.",
        "Machine learning is a subset of artificial intelligence.",
        "Deep learning uses multi-layer neural networks to learn representations.",
        "Natural language processing enables computers to understand human text.",
        "Computer vision allows machines to interpret visual information from images.",
        "Reinforcement learning trains agents to make decisions via rewards.",
        "Transfer learning reuses pretrained model weights for new tasks.",
        "Data augmentation artificially increases training data size.",
        "Batch normalization stabilizes and accelerates deep network training.",
        "Attention mechanisms allow models to focus on relevant input parts.",
    ]
    queries = [
        "What is machine learning?",
        "How does deep learning work?",
        "What is natural language processing?",
        "Explain reinforcement learning.",
        "What is transfer learning?",
    ]
    tv = TfidfVectorizer()
    X = tv.fit_transform(docs)
    print("Ex31 — Full RAG Demo (10 docs, 5 queries):")
    for q in queries:
        q_vec = tv.transform([q])
        sims = cosine_similarity(q_vec, X)[0]
        top1 = np.argmax(sims)
        print(f"  Q: '{q}'")
        print(f"  A: '{docs[top1][:70]}...' (sim={sims[top1]:.3f})")

def ex32():
    """Multi-query retrieval: expand query to 3 variants"""
    def expand_query(query):
        expansions = [
            query,
            query.replace("what is", "define").replace("how does", "explain"),
            " ".join(query.split()[::-1]),
        ]
        return expansions
    docs = ["Transformers use self-attention to process sequences",
            "BERT is a transformer model pretrained on masked language modeling",
            "GPT uses autoregressive language modeling",
            "Attention is the core component of transformer architecture",
            "Positional encoding gives transformers sequence order information"]
    tv = TfidfVectorizer()
    X = tv.fit_transform(docs)
    query = "how does transformer attention work"
    expanded = expand_query(query)
    all_scores = np.zeros(len(docs))
    for eq in expanded:
        q_vec = tv.transform([eq])
        all_scores += cosine_similarity(q_vec, X)[0]
    all_scores /= len(expanded)
    top3 = np.argsort(all_scores)[-3:][::-1]
    print(f"Ex32 — Multi-Query Retrieval (3 expansions):")
    for i in top3:
        print(f"  [{i}] {all_scores[i]:.4f} — '{docs[i]}'")

def ex33():
    """RAG with conversation history (append history to query)"""
    docs = ["Python lists are ordered and mutable collections.",
            "Python dicts store key-value pairs.",
            "Python sets are unordered collections of unique elements.",
            "Python tuples are immutable ordered sequences.",
            "Python strings are immutable sequences of characters."]
    tv = TfidfVectorizer()
    X = tv.fit_transform(docs)
    history = ["What are lists?", "How are dicts different?"]
    current_query = "What about sets?"
    augmented_query = " ".join(history[-2:]) + " " + current_query
    q_vec = tv.transform([augmented_query])
    sims = cosine_similarity(q_vec, X)[0]
    top1 = np.argmax(sims)
    print(f"Ex33 — RAG with Conversation History:")
    print(f"  History: {history}")
    print(f"  Current: '{current_query}'")
    print(f"  Augmented query: '{augmented_query[:60]}...'")
    print(f"  Retrieved: '{docs[top1]}' (sim={sims[top1]:.4f})")

def ex34():
    """RAG evaluation: precision@k"""
    def precision_at_k(retrieved_ids, relevant_ids, k):
        top_k = retrieved_ids[:k]
        hits = sum(1 for r in top_k if r in relevant_ids)
        return hits / k
    test_cases = [
        {"query": "python list", "relevant": {0, 3}, "retrieved": [0, 2, 3, 1, 4]},
        {"query": "neural network", "relevant": {1, 2}, "retrieved": [1, 2, 0, 3, 4]},
        {"query": "deep learning", "relevant": {2}, "retrieved": [3, 0, 2, 1, 4]},
    ]
    print("Ex34 — RAG Evaluation: Precision@k")
    for tc in test_cases:
        p1 = precision_at_k(tc["retrieved"], tc["relevant"], 1)
        p3 = precision_at_k(tc["retrieved"], tc["relevant"], 3)
        print(f"  Query '{tc['query']}': P@1={p1:.2f}, P@3={p3:.2f}")

def ex35():
    """RAG evaluation: recall@k"""
    def recall_at_k(retrieved_ids, relevant_ids, k):
        top_k = set(retrieved_ids[:k])
        hits = len(top_k & relevant_ids)
        return hits / len(relevant_ids) if relevant_ids else 0
    test_cases = [
        {"query": "python data structures", "relevant": {0, 1, 3}, "retrieved": [0, 2, 3, 1, 4]},
        {"query": "machine learning methods", "relevant": {1, 2, 4}, "retrieved": [1, 2, 0, 4, 3]},
    ]
    print("Ex35 — RAG Evaluation: Recall@k")
    for tc in test_cases:
        for k in [1, 3, 5]:
            r = recall_at_k(tc["retrieved"], tc["relevant"], k)
            print(f"  Query '{tc['query']}': R@{k}={r:.2f}")

def ex36():
    """Chunk quality scorer (length, punctuation, completeness)"""
    def score_chunk(chunk):
        scores = {}
        scores["length_ok"] = 1.0 if 50 <= len(chunk) <= 500 else 0.5
        scores["has_sentence_end"] = 1.0 if chunk.rstrip()[-1] in ".!?" else 0.3
        scores["not_truncated"] = 1.0 if not chunk.endswith("- ") else 0.0
        scores["word_count_ok"] = 1.0 if 10 <= len(chunk.split()) <= 100 else 0.5
        return sum(scores.values()) / len(scores), scores
    chunks = [
        "Machine learning is the study of algorithms that improve automatically through experience.",
        "The cat sat",
        "This is an incomplete sentence that was cut off in the middle of a word and sente-",
    ]
    print("Ex36 — Chunk Quality Scorer:")
    for i, chunk in enumerate(chunks):
        score, details = score_chunk(chunk)
        print(f"  Chunk {i} (score={score:.2f}): '{chunk[:50]}...'")

def ex37():
    """Document ingestion pipeline: load → chunk → embed → store"""
    class IngestionPipeline:
        def __init__(self, chunk_size=100):
            self.chunk_size = chunk_size
            self.store = []
            self.tv = TfidfVectorizer()
            self._fitted = False
        def chunk(self, text, source):
            raw = [text[i:i+self.chunk_size] for i in range(0, len(text), self.chunk_size)]
            return [{"text": c, "source": source, "pos": i} for i, c in enumerate(raw)]
        def ingest(self, documents):
            all_chunks = []
            for doc_id, text in documents:
                all_chunks.extend(self.chunk(text, doc_id))
            texts = [c["text"] for c in all_chunks]
            embeddings = self.tv.fit_transform(texts)
            self._fitted = True
            for i, chunk in enumerate(all_chunks):
                chunk["embedding"] = embeddings[i]
            self.store = all_chunks
            return len(all_chunks)
    documents = [
        ("doc1", "Artificial intelligence is transforming every industry. " * 3),
        ("doc2", "Machine learning models are trained on large datasets. " * 3),
    ]
    pipe = IngestionPipeline(chunk_size=80)
    n = pipe.ingest(documents)
    print(f"Ex37 — Ingestion Pipeline: {len(documents)} docs → {n} chunks stored")
    print(f"  Sample chunk: '{pipe.store[0]['text'][:50]}...'")

def ex38():
    """Production RAG architecture design (print)"""
    print("Ex38 — Production RAG Architecture:")
    design = """
┌─────────────────────────────────────────────────────────┐
│                  INGESTION PIPELINE                      │
│  Documents → Chunker → Embedder → VectorDB + Metadata   │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  RETRIEVAL PIPELINE                      │
│  Query → Query Expansion → Hybrid Search (dense+sparse) │
│        → Re-ranker (cross-encoder) → Top-k Chunks       │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  GENERATION PIPELINE                     │
│  Chunks + Query → Prompt Builder → LLM → Answer         │
│                → Citation Extractor → Grounded Response  │
└─────────────────────────────────────────────────────────┘

Components:
  VectorDB: FAISS / Chroma / Pinecone / Weaviate
  Embedder: text-embedding-3-small / all-MiniLM-L6-v2
  Re-ranker: cross-encoder/ms-marco-MiniLM-L-6-v2
  LLM: GPT-4 / Claude / Llama 3
  Cache: Redis for repeated queries
  Monitoring: latency, retrieval accuracy, answer quality
    """
    print(design)

# --- ADVANCED (39-50) ---------------------------------------

def ex39():
    """FAISS Flat index pattern (print code)"""
    print("Ex39 — FAISS Flat Index Pattern:")
    code = """
import faiss
import numpy as np

d = 768  # embedding dimension
index = faiss.IndexFlatL2(d)   # exact L2 search

# Add embeddings
embeddings = np.random.randn(10000, d).astype(np.float32)
index.add(embeddings)
print(f"Index size: {index.ntotal}")

# Search
query = np.random.randn(1, d).astype(np.float32)
k = 5
distances, indices = index.search(query, k)
print(f"Top-{k} indices: {indices[0]}")
print(f"Top-{k} distances: {distances[0]}")
    """
    print(code)

def ex40():
    """FAISS IVF (Inverted File Index) pattern (print code)"""
    print("Ex40 — FAISS IVF Index Pattern:")
    code = """
import faiss
import numpy as np

d = 768       # embedding dimension
nlist = 100   # number of Voronoi cells

quantizer = faiss.IndexFlatL2(d)
index = faiss.IndexIVFFlat(quantizer, d, nlist)

# Must train before adding
train_data = np.random.randn(50000, d).astype(np.float32)
index.train(train_data)
index.add(train_data)

# Control speed/accuracy tradeoff
index.nprobe = 10  # search 10 cells (higher = more accurate, slower)

query = np.random.randn(1, d).astype(np.float32)
distances, indices = index.search(query, 5)
print(f"IVF Top-5: {indices[0]}")
    """
    print(code)

def ex41():
    """FAISS HNSW (Hierarchical NSW) pattern (print code)"""
    print("Ex41 — FAISS HNSW Index Pattern:")
    code = """
import faiss
import numpy as np

d = 768   # embedding dimension
M = 32    # number of connections per node

index = faiss.IndexHNSWFlat(d, M)
index.hnsw.efConstruction = 200  # build quality (higher = better)

embeddings = np.random.randn(100000, d).astype(np.float32)
index.add(embeddings)  # no training needed

index.hnsw.efSearch = 50  # search quality (higher = more accurate)
query = np.random.randn(1, d).astype(np.float32)
distances, indices = index.search(query, 5)
print(f"HNSW Top-5: {indices[0]}")
# HNSW: sub-linear search, no training, high memory usage
    """
    print(code)

def ex42():
    """Chroma DB vector store pattern (print code)"""
    print("Ex42 — Chroma DB Pattern:")
    code = """
import chromadb
from chromadb.utils import embedding_functions

client = chromadb.Client()
# For persistence: chromadb.PersistentClient(path="./chroma_db")

ef = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)
collection = client.create_collection("my_docs", embedding_function=ef)

# Add documents
collection.add(
    documents=["AI is transformative", "ML uses data", "NLP handles text"],
    metadatas=[{"source": "doc1"}, {"source": "doc2"}, {"source": "doc3"}],
    ids=["id1", "id2", "id3"]
)

# Query
results = collection.query(
    query_texts=["machine learning applications"],
    n_results=2,
    where={"source": "doc1"}   # optional metadata filter
)
print(results)
    """
    print(code)

def ex43():
    """Pinecone vector database pattern (print code)"""
    print("Ex43 — Pinecone Pattern:")
    code = """
from pinecone import Pinecone, ServerlessSpec
import numpy as np

pc = Pinecone(api_key="YOUR_API_KEY")

# Create index
pc.create_index(
    name="my-index",
    dimension=1536,
    metric="cosine",
    spec=ServerlessSpec(cloud="aws", region="us-east-1")
)
index = pc.Index("my-index")

# Upsert vectors
vectors = [(f"id{i}", np.random.randn(1536).tolist(), {"text": f"doc {i}"})
           for i in range(100)]
index.upsert(vectors=vectors)

# Query
query_vec = np.random.randn(1536).tolist()
results = index.query(vector=query_vec, top_k=5, include_metadata=True)
for match in results['matches']:
    print(f"id={match['id']}, score={match['score']:.4f}")
    """
    print(code)

def ex44():
    """sentence-transformers embedding pattern (print code)"""
    print("Ex44 — sentence-transformers Pattern:")
    code = """
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer("all-MiniLM-L6-v2")  # 384-dim, fast

sentences = [
    "The quick brown fox jumps over the lazy dog",
    "A fast auburn fox leaps above a sleepy canine",
    "Machine learning transforms industries",
]

# Encode (returns numpy array)
embeddings = model.encode(sentences, normalize_embeddings=True)
print(f"Embeddings shape: {embeddings.shape}")  # (3, 384)

# Semantic similarity
from sentence_transformers.util import cos_sim
scores = cos_sim(embeddings[0], embeddings[1:])
print(f"Similarity to sentence 0: {scores}")
    """
    print(code)

def ex45():
    """ColBERT multi-vector retrieval concept"""
    print("Ex45 — ColBERT Multi-Vector Retrieval Concept:")
    desc = """
ColBERT (Contextualized Late Interaction over BERT):
  - Standard dense retrieval: 1 vector per doc
  - ColBERT: 1 vector PER TOKEN in doc and query

Late Interaction scoring:
  score(q, d) = Σ_{qi in q} max_{dj in d} (qi · dj)
  i.e., for each query token, find the most similar doc token

Advantages:
  - More expressive than single-vector retrieval
  - More efficient than full cross-encoder (tokens precomputed)
  - Strong performance on BEIR benchmark

Trade-offs:
  - Storage: 128-dim × avg_doc_len vectors per doc (vs 1 vector)
  - Index size: ~10x larger than dense retrieval
  - Retrieval: MaxSim operation requires specialized indexing (PLAID)

Code (ragatouille):
  from ragatouille import RAGPretrainedModel
  rag = RAGPretrainedModel.from_pretrained("colbert-ir/colbertv2.0")
  rag.index(docs, index_name="my_index")
  results = rag.search("my query", k=5)
    """
    print(desc)

def ex46():
    """Embedding fine-tuning concept"""
    print("Ex46 — Embedding Fine-tuning Concept:")
    desc = """
Why fine-tune embeddings?
  - Off-the-shelf embeddings are general-purpose
  - Domain-specific vocabulary may be poorly represented
  - Fine-tuning aligns embeddings to your retrieval task

Methods:
  1. Contrastive learning (SimCSE, MNRL):
     - (anchor, positive, negative) triplets
     - Loss: push anchor closer to positive, away from negative
     - loss = -log[sim(a,p) / (sim(a,p) + Σ sim(a,ni))]

  2. SetFit (few-shot, no full fine-tuning):
     - Generate pairs from few labeled examples
     - Fine-tune with cosine similarity head

  3. BEIR-style domain adaptation:
     - Use BM25 to generate pseudo-labels on unlabeled corpus
     - Fine-tune with GPL (Generative Pseudo Labeling)

Code (sentence-transformers training):
  from sentence_transformers import SentenceTransformer, losses
  from torch.utils.data import DataLoader

  model = SentenceTransformer("all-MiniLM-L6-v2")
  train_loss = losses.MultipleNegativesRankingLoss(model)
  model.fit(train_objectives=[(dataloader, train_loss)], epochs=3)
    """
    print(desc)

def ex47():
    """Cross-encoder reranking pattern (print code)"""
    print("Ex47 — Cross-Encoder Reranking Pattern:")
    code = """
from sentence_transformers import CrossEncoder
import numpy as np

# Bi-encoder retrieval (fast, approximate)
bi_encoder = SentenceTransformer("all-MiniLM-L6-v2")
query_emb = bi_encoder.encode(query)
doc_embs = bi_encoder.encode(docs)
# ... retrieve top-50 candidates by cosine similarity

# Cross-encoder reranking (slower, more accurate)
cross_encoder = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

# Score query-doc pairs jointly (full attention across both)
pairs = [[query, doc] for doc in top_50_candidates]
scores = cross_encoder.predict(pairs)

# Re-rank by cross-encoder score
reranked = sorted(zip(scores, top_50_candidates), reverse=True)
top_5 = reranked[:5]
for score, doc in top_5:
    print(f"Score: {score:.4f} | {doc[:60]}")

# Typical pipeline: bi-encoder (top-100) → cross-encoder (top-5)
    """
    print(code)

def ex48():
    """RAG vs fine-tuning comparison table"""
    print("Ex48 — RAG vs Fine-tuning Comparison:")
    header = f"  {'Dimension':<30} {'RAG':<25} {'Fine-tuning':<25}"
    print(header)
    print("  " + "-" * 80)
    rows = [
        ("Knowledge update", "Real-time (update index)", "Requires retraining"),
        ("Training data needed", "None (or few-shot)", "Labeled data required"),
        ("Hallucination", "Grounded in retrieved docs", "Can still hallucinate"),
        ("Latency", "Higher (retrieval + gen)", "Lower (inference only)"),
        ("Cost", "Storage + retrieval costs", "GPU compute for training"),
        ("Interpretability", "Citable sources", "Black box"),
        ("Domain adaptation", "Add docs to index", "Full or LoRA fine-tune"),
        ("Best for", "Dynamic knowledge, Q&A", "Style/task adaptation"),
    ]
    for row in rows:
        print(f"  {row[0]:<30} {row[1]:<25} {row[2]:<25}")

def ex49():
    """Embedding model benchmark comparison table"""
    print("Ex49 — Embedding Model Benchmark (MTEB):")
    header = f"  {'Model':<35} {'Dim':>5} {'MTEB Avg':>9} {'Speed':>10}"
    print(header)
    print("  " + "-" * 65)
    models = [
        ("all-MiniLM-L6-v2", 384, 56.3, "14,200 sent/s"),
        ("all-mpnet-base-v2", 768, 57.8, "2,800 sent/s"),
        ("text-embedding-ada-002", 1536, 60.9, "API only"),
        ("text-embedding-3-small", 1536, 62.3, "API only"),
        ("text-embedding-3-large", 3072, 64.6, "API only"),
        ("BAAI/bge-large-en-v1.5", 1024, 64.2, "800 sent/s"),
        ("intfloat/e5-large-v2", 1024, 62.2, "800 sent/s"),
        ("GTE-large", 1024, 63.1, "900 sent/s"),
    ]
    for name, dim, score, speed in models:
        print(f"  {name:<35} {dim:>5} {score:>9.1f} {speed:>10}")

def ex50():
    """Production RAG system checklist"""
    print("Ex50 — Production RAG System Checklist:")
    checklist = """
Indexing:
  [ ] Optimal chunk size validated (e.g., 256-512 tokens with 20% overlap)
  [ ] Metadata schema defined (source, date, section, page)
  [ ] Embedding model benchmarked on domain data
  [ ] Incremental indexing supported (avoid full re-index)
  [ ] Deduplication of near-duplicate chunks

Retrieval:
  [ ] Hybrid search implemented (dense + BM25 sparse)
  [ ] Cross-encoder reranker for top-N candidates
  [ ] Query expansion / HyDE for difficult queries
  [ ] Metadata filters exposed to users
  [ ] Retrieval latency < 200ms p99

Generation:
  [ ] Context window management (token budget per source)
  [ ] Citation / source attribution in answers
  [ ] Hallucination detection (check answer vs retrieved context)
  [ ] Prompt versioning and A/B testing

Evaluation:
  [ ] Retrieval: Recall@k, NDCG on eval set
  [ ] Generation: faithfulness, answer relevance (RAGAS)
  [ ] End-to-end: user satisfaction / correctness
  [ ] Regular eval on held-out queries

Operations:
  [ ] Vector DB backups and disaster recovery
  [ ] Monitoring: retrieval quality drift, latency, cost
  [ ] Cache layer for repeated queries (Redis)
  [ ] Rate limiting and cost controls for LLM calls
  [ ] User feedback loop to improve retrieval
    """
    print(checklist)


def main():
    print("=" * 60)
    print("Examples 3.3 — Embeddings & RAG")
    print("=" * 60)

    print("\n--- BASIC (1-13) ---")
    ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07()
    ex08(); ex09(); ex10(); ex11(); ex12(); ex13()

    print("\n--- INTERMEDIATE (14-26) ---")
    ex14(); ex15(); ex16(); ex17(); ex18(); ex19(); ex20()
    ex21(); ex22(); ex23(); ex24(); ex25(); ex26()

    print("\n--- NESTED (27-38) ---")
    ex27(); ex28(); ex29(); ex30(); ex31(); ex32(); ex33()
    ex34(); ex35(); ex36(); ex37(); ex38()

    print("\n--- ADVANCED (39-50) ---")
    ex39(); ex40(); ex41(); ex42(); ex43(); ex44(); ex45()
    ex46(); ex47(); ex48(); ex49(); ex50()


if __name__ == "__main__":
    main()
