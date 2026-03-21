# ============================================================
# Examples 6.5 — AI/ML Interview Preparation (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import sys
import numpy as np
import math
from collections import Counter, OrderedDict, deque
import heapq

sys.stdout.reconfigure(encoding='utf-8')


# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Bias-variance tradeoff (print structured explanation with formula)"""
    print("""Ex01 — Bias-Variance Tradeoff:
  Formula: Expected MSE = Bias² + Variance + Irreducible Noise
    Bias²   = error from wrong assumptions (underfit)
    Variance = error from sensitivity to training data (overfit)
    Noise   = irreducible error from inherent data randomness
  Examples:
    High Bias / Low Variance:  Linear regression on non-linear data
    Low Bias / High Variance:  Deep decision tree, 1-NN classifier
    Sweet spot:                Regularized models, gradient boosting
  Key insight: As model complexity ↑, bias ↓ but variance ↑.
  Mitigation:
    High bias  → more features, deeper model, remove regularization
    High variance → more data, regularization (L1/L2), dropout, ensembles""")

def ex02():
    """Overfitting vs underfitting (print with examples)"""
    print("""Ex02 — Overfitting vs Underfitting:
  UNDERFITTING (High Bias):
    - Training loss: high | Validation loss: high
    - Model is too simple to capture the patterns
    - Examples: Linear regression on non-linear data; too-shallow neural net
    - Fix: Increase model capacity; add features; reduce regularization
  OVERFITTING (High Variance):
    - Training loss: low | Validation loss: high
    - Model memorizes training data, fails on new data
    - Examples: 100-layer network on 100 samples; decision tree depth=∞
    - Fix: More data; dropout; L2 regularization; early stopping; ensembles
  GOOD FIT:
    - Training loss ≈ Validation loss (both low)
    - Generalizes well to unseen data
  Diagnostic: Learning curves
    - Plot train loss + val loss vs training set size
    - Underfit: both high, close together
    - Overfit:  train low, val high, large gap""")

def ex03():
    """Gradient descent (print 3 variants: SGD, mini-batch, batch)"""
    print("""Ex03 — Gradient Descent Variants:
  Update rule:  θ = θ - α * ∇_θ L(θ)
  1. BATCH GRADIENT DESCENT
     - Uses ALL training examples to compute gradient
     - Pro: Stable, converges to global minimum (convex)
     - Con: Very slow for large datasets; needs all data in memory
     - Gradient: ∇L = (1/N) Σ ∇L_i(θ)
  2. STOCHASTIC GRADIENT DESCENT (SGD)
     - Uses ONE random training example per update
     - Pro: Fast updates; can escape local minima (noisy)
     - Con: High variance; oscillates around minimum
     - Gradient: ∇L ≈ ∇L_i(θ)  for random i
  3. MINI-BATCH GRADIENT DESCENT (most common)
     - Uses B examples (batch size B = 32, 64, 128, 256)
     - Pro: Balanced — efficient GPU computation + stability
     - Con: Batch size is hyperparameter to tune
     - Gradient: ∇L ≈ (1/B) Σ_{i in batch} ∇L_i(θ)
  Optimizers built on top:
    Momentum: adds velocity term to reduce oscillation
    RMSProp:  adaptive per-parameter learning rate
    Adam:     momentum + RMSProp (default in most LLM training)""")

def ex04():
    """Backpropagation (print chain rule step by step)"""
    print("""Ex04 — Backpropagation: Chain Rule Step by Step
  Goal: Compute ∂L/∂θ for every parameter θ in the network.
  Chain rule: ∂L/∂θ = ∂L/∂z_n * ∂z_n/∂z_{n-1} * ... * ∂z_1/∂θ
  Example: 2-layer MLP, L = MSE(ŷ, y)
    FORWARD PASS:
      z₁ = W₁x + b₁      (linear layer 1)
      a₁ = ReLU(z₁)       (activation)
      z₂ = W₂a₁ + b₂     (linear layer 2)
      ŷ  = σ(z₂)          (sigmoid output)
      L  = -[y log ŷ + (1-y) log(1-ŷ)]   (binary cross-entropy)
    BACKWARD PASS:
      δ₂ = ∂L/∂z₂ = ŷ - y                (output layer delta)
      ∂L/∂W₂ = δ₂ * a₁ᵀ
      ∂L/∂b₂ = δ₂
      δ₁ = ∂L/∂z₁ = (W₂ᵀ δ₂) ⊙ ReLU'(z₁)   (hidden layer delta)
      ∂L/∂W₁ = δ₁ * xᵀ
      ∂L/∂b₁ = δ₁
  Key: Gradients flow BACKWARD through the network;
       each layer receives gradient from layer above.""")

def ex05():
    """Attention mechanism (print formula: softmax(QK^T/√d)V)"""
    print("""Ex05 — Attention Mechanism:
  Formula: Attention(Q, K, V) = softmax(QKᵀ / √d_k) V
  Definitions:
    Q = Query matrix  [seq_len × d_k]  — "what I'm looking for"
    K = Key matrix    [seq_len × d_k]  — "what I contain"
    V = Value matrix  [seq_len × d_v]  — "what I will output"
    d_k = key dimension (scaling factor to prevent vanishing gradients)
  Step-by-step:
    1. Compute attention scores:  S = QKᵀ              [seq × seq]
    2. Scale:                     S̃ = S / √d_k         (prevent saturation)
    3. Mask (optional):           S̃[masked] = -∞       (causal masking)
    4. Softmax:                   A = softmax(S̃, dim=-1)  (attention weights)
    5. Weighted sum:              Output = A @ V
  Intuition: Each token attends to ALL other tokens;
             attention weight = how relevant token_j is to token_i.
  Self-attention: Q, K, V all derived from same sequence.
  Cross-attention: Q from decoder, K and V from encoder.
  Multi-head: Run h parallel attention heads, concatenate outputs:
    MultiHead = Concat(head_1,...,head_h) W^O""")

def ex06():
    """Transformer architecture (print encoder + decoder description)"""
    print("""Ex06 — Transformer Architecture:
  Paper: "Attention Is All You Need" (Vaswani et al., 2017)
  ENCODER (used in BERT, encoder-only models):
    Input → [Token Embedding + Positional Encoding]
    × N encoder layers, each containing:
      1. Multi-Head Self-Attention (attends to all input tokens)
      2. Add & Norm (residual connection + LayerNorm)
      3. Feed-Forward Network (2-layer MLP, d_ff = 4*d_model)
      4. Add & Norm
    Output: Contextual representations for each token
  DECODER (used in GPT, decoder-only models):
    Input → [Token Embedding + Positional Encoding]
    × N decoder layers, each containing:
      1. Masked Multi-Head Self-Attention (causal: can't see future)
      2. Add & Norm
      3. Multi-Head Cross-Attention (Q=decoder, K=V=encoder output)
      4. Add & Norm
      5. Feed-Forward Network
      6. Add & Norm
    Output: Logits over vocabulary → softmax → token probabilities
  GPT (decoder-only): No cross-attention; everything autoregressive.
  BERT (encoder-only): Bidirectional self-attention; masked LM pretraining.
  T5 (encoder-decoder): Full architecture; seq2seq tasks.""")

def ex07():
    """BERT vs GPT (print comparison table)"""
    print("""Ex07 — BERT vs GPT Comparison:
  ┌─────────────────────┬──────────────────────┬───────────────────────┐
  │ Dimension           │ BERT                 │ GPT                   │
  ├─────────────────────┼──────────────────────┼───────────────────────┤
  │ Architecture        │ Encoder-only         │ Decoder-only          │
  │ Attention           │ Bidirectional        │ Unidirectional (causal│
  │ Training objective  │ Masked LM + NSP      │ Causal LM (next token)│
  │ Generation          │ Cannot generate      │ Designed for generation│
  │ Classification      │ Excellent            │ Good (with prompting) │
  │ Embeddings          │ Contextual (rich)    │ Contextual            │
  │ Typical fine-tuning │ Add [CLS] head       │ Prompt-based or SFT   │
  │ Example tasks       │ NER, QA, sentiment   │ Text gen, chat, code  │
  │ Popular models      │ BERT-base/large, RoBERTa│ GPT-2/3/4, LLaMA  │
  └─────────────────────┴──────────────────────┴───────────────────────┘
  Interview tip: "BERT reads the whole sentence; GPT writes the next word."
  Modern convergence: Most large models are decoder-only (GPT-style)
  because generation + instruction following dominates use cases.""")

def ex08():
    """Fine-tuning vs few-shot vs zero-shot (print comparison)"""
    print("""Ex08 — Fine-Tuning vs Few-Shot vs Zero-Shot:
  ZERO-SHOT:
    - No task-specific examples provided
    - Relies entirely on pretrained knowledge
    - Example: "Translate to French: 'Hello'"
    - Pro: No data needed | Con: Lower accuracy on specialized tasks
  FEW-SHOT (in-context learning):
    - 1-32 examples provided in the prompt
    - Model extrapolates from demonstrated pattern
    - Example: "Positive: great movie → pos\nNegative: waste of time → neg\n
                It was fantastic → ?"
    - Pro: No weight updates needed | Con: Prompt length limit
  FULL FINE-TUNING:
    - Update ALL model weights on task-specific data
    - Requires labeled dataset (hundreds to millions of examples)
    - Pro: Best accuracy | Con: Expensive; one model per task
  PARAMETER-EFFICIENT FINE-TUNING (PEFT):
    - LoRA: Train low-rank adapters only (0.1-1% of parameters)
    - Prefix tuning: Train soft prompt tokens only
    - QLoRA: LoRA + 4-bit quantization for memory efficiency
    - Pro: Near fine-tune performance at fraction of cost
  Modern best practice: LoRA/QLoRA for domain adaptation,
  few-shot prompting for general tasks.""")

def ex09():
    """RAG explained (print retrieve + augment + generate)"""
    print("""Ex09 — Retrieval-Augmented Generation (RAG):
  Paper: Lewis et al. (2020) "RAG: Retrieval-Augmented Generation for NLP"
  Core idea: Combine retrieval from external knowledge base with LLM generation.
  Pipeline:
    1. RETRIEVE:
       - User query → embedding model → query vector
       - Nearest neighbor search in vector database
       - Return top-k relevant document chunks
    2. AUGMENT:
       - Construct prompt: [retrieved chunks] + [user query]
       - Chunks provide grounding context for generation
    3. GENERATE:
       - LLM generates answer conditioned on retrieved context
       - Can cite sources from retrieved chunks
  Architecture:
    Offline: Documents → chunking → embeddings → vector store (FAISS/Pinecone)
    Online:  Query → embed → search → prompt → LLM → response
  Benefits vs pure LLM:
    + Up-to-date knowledge (no training cutoff)
    + Verifiable sources (citations)
    + Reduced hallucination (grounded in real documents)
    + Domain adaptation without fine-tuning
  Challenges:
    - Retrieval quality determines answer quality
    - Context window limits (can't retrieve too many chunks)
    - Faithfulness: model must stay grounded in context
  Tools: LangChain, LlamaIndex, Haystack""")

def ex10():
    """RLHF explained (print 3 steps: SFT + reward + PPO)"""
    print("""Ex10 — RLHF: Reinforcement Learning from Human Feedback:
  Paper: Christiano et al. (2017); InstructGPT (2022)
  Goal: Align LLM behavior with human preferences.
  Step 1: SUPERVISED FINE-TUNING (SFT)
    - Collect human-written demonstrations of desired behavior
    - Fine-tune pretrained LLM on these examples
    - Result: SFT model follows instructions reasonably well
  Step 2: REWARD MODEL TRAINING
    - For each prompt, generate multiple LLM responses
    - Human labelers rank responses (A > B > C)
    - Train reward model RM(x, y) → scalar score
    - RM learns to predict human preference score
  Step 3: PPO FINE-TUNING
    - Use PPO (Proximal Policy Optimization) to maximize reward
    - Objective: maximize E[RM(x, y)] subject to:
        KL(π_θ || π_SFT) ≤ ε   (don't drift too far from SFT)
    - Combined loss: L = -RM(x, y) + β * KL(π_θ || π_SFT)
    - Result: Model produces outputs humans prefer
  Modern alternatives:
    DPO (Direct Preference Optimization): Skip RM; optimize directly on pairs
    RLAIF (AI Feedback): Replace human raters with Claude/GPT-4
    GRPO: Group Relative Policy Optimization (DeepSeek-R1)""")

def ex11():
    """Embeddings explained (print with use cases)"""
    print("""Ex11 — Embeddings Explained:
  Definition: Dense vector representation of text (or any data) in a
              continuous vector space where semantic similarity ≈ geometric proximity.
  How they work:
    - Text → Transformer → [CLS] token or mean-pool → vector (e.g., 1536-dim)
    - Similar meanings → nearby vectors (high cosine similarity)
    - "king" - "man" + "woman" ≈ "queen" (word2vec analogy)
  Types:
    Word embeddings:     Word2Vec, GloVe, FastText (context-independent)
    Sentence embeddings: SBERT, OpenAI text-embedding-3 (context-aware)
    Multimodal:          CLIP (image + text in same space)
  Similarity measures:
    Cosine similarity:   sim = (A·B) / (||A|| ||B||)  — direction, not magnitude
    Dot product:         fast, used in FAISS/ANN search
    Euclidean distance:  L2; less common for text
  Use cases:
    1. Semantic search (RAG retrieval)
    2. Recommendation systems (item→user similarity)
    3. Clustering (k-means on embeddings)
    4. Classification (embedding + linear classifier)
    5. Anomaly detection (distance from cluster centroid)
    6. Deduplication (near-duplicate detection)
  Dimension: 384 (MiniLM), 768 (BERT-base), 1536 (OpenAI ada-002)""")

def ex12():
    """Vector databases explained (print with examples)"""
    print("""Ex12 — Vector Databases:
  Purpose: Store and efficiently search millions of high-dimensional vectors.
  Key operation: Approximate Nearest Neighbor (ANN) search
    Given query vector q, find k vectors with highest cosine/dot similarity.
  Why ANN (not exact): Exact search is O(N*d) — too slow at billion scale.
  Core algorithms:
    HNSW (Hierarchical Navigable Small World):
      - Multi-layer graph; navigate from coarse to fine
      - Very fast; high recall; dominant in practice
    IVF (Inverted File Index):
      - Cluster vectors; search only relevant clusters
      - FAISS IVF-PQ: billion-scale with quantization
    ANNOY (Spotify):
      - Random projection trees; read-heavy workloads
  Vector DB comparison:
    Pinecone:    Managed cloud; easy setup; $
    Weaviate:    Open source; hybrid BM25 + vector; self-host or cloud
    Qdrant:      Open source; Rust; excellent performance; filter-aware
    Milvus:      Open source; horizontal scaling; Kubernetes-native
    ChromaDB:    Lightweight; great for development/prototyping
    pgvector:    PostgreSQL extension; simple; SQL joins work
  Use case: RAG pipeline stores embeddings of 100K documents;
            at query time retrieves top-5 relevant chunks in <20ms.""")

def ex13():
    """MLOps explained (print lifecycle)"""
    print("""Ex13 — MLOps: ML Operations Lifecycle:
  Definition: Practices for reliable, scalable deployment of ML models.
  LIFECYCLE:
    1. DATA MANAGEMENT
       Data versioning (DVC, Delta Lake)
       Feature store (Feast, Tecton) — share features across teams
       Data quality monitoring (Great Expectations)
    2. EXPERIMENT TRACKING
       Track: parameters, metrics, artifacts, code version
       Tools: MLflow, Weights & Biases, Neptune
    3. MODEL TRAINING
       Distributed training (PyTorch DDP, DeepSpeed, Ray)
       Hyperparameter optimization (Optuna, Ray Tune)
       Reproducibility: fixed seeds, pinned dependencies
    4. MODEL EVALUATION
       Offline eval: held-out test set metrics
       Online eval: A/B testing, shadow deployment
       Fairness/bias audit before deployment
    5. MODEL SERVING
       REST API (FastAPI + Triton), gRPC, batch inference
       Model formats: ONNX, TorchScript, TensorRT
       Caching: KV cache, semantic cache
    6. MONITORING
       Data drift (input distribution change)
       Model drift (prediction distribution change)
       Performance monitoring (latency, throughput, cost)
       Retraining triggers: scheduled or threshold-based
    7. GOVERNANCE
       Model registry (MLflow Model Registry)
       Lineage tracking (which data trained which model)
       Audit logs for regulated industries""")


# ─── INTERMEDIATE (14–26) ────────────────────────────────────

def ex14():
    """Attention from scratch (numpy: Q, K, V matrices)"""
    def attention(Q, K, V, mask=None):
        d_k = Q.shape[-1]
        scores = Q @ K.T / math.sqrt(d_k)
        if mask is not None:
            scores[mask == 0] = -1e9
        weights = np.exp(scores - scores.max(axis=-1, keepdims=True))
        weights /= weights.sum(axis=-1, keepdims=True)
        return weights @ V, weights

    np.random.seed(42)
    seq_len, d_k, d_v = 4, 8, 8
    Q = np.random.randn(seq_len, d_k)
    K = np.random.randn(seq_len, d_k)
    V = np.random.randn(seq_len, d_v)
    output, weights = attention(Q, K, V)
    print(f"Ex14 — Attention from scratch: output_shape={output.shape}, "
          f"weights_sum={weights.sum(axis=-1).round(4)} (each row sums to 1)")

def ex15():
    """Backpropagation 2-layer MLP (numpy: forward + backward)"""
    def sigmoid(x): return 1 / (1 + np.exp(-x))
    def sigmoid_grad(x): s = sigmoid(x); return s * (1 - s)

    np.random.seed(42)
    X = np.array([[0,0],[0,1],[1,0],[1,1]], dtype=float)
    y = np.array([[0],[1],[1],[0]], dtype=float)  # XOR
    W1 = np.random.randn(2, 4) * 0.5
    b1 = np.zeros((1, 4))
    W2 = np.random.randn(4, 1) * 0.5
    b2 = np.zeros((1, 1))
    lr = 0.5
    for _ in range(1000):
        # Forward
        z1 = X @ W1 + b1; a1 = sigmoid(z1)
        z2 = a1 @ W2 + b2; a2 = sigmoid(z2)
        loss = ((a2 - y)**2).mean()
        # Backward
        dL_da2 = 2 * (a2 - y) / len(y)
        dL_dz2 = dL_da2 * sigmoid_grad(z2)
        dW2 = a1.T @ dL_dz2; db2 = dL_dz2.sum(axis=0, keepdims=True)
        dL_da1 = dL_dz2 @ W2.T
        dL_dz1 = dL_da1 * sigmoid_grad(z1)
        dW1 = X.T @ dL_dz1; db1 = dL_dz1.sum(axis=0, keepdims=True)
        W1 -= lr*dW1; b1 -= lr*db1; W2 -= lr*dW2; b2 -= lr*db2
    preds = (sigmoid(sigmoid(X@W1+b1)@W2+b2) > 0.5).astype(int).flatten()
    print(f"Ex15 — Backprop 2-layer MLP (XOR): loss={loss:.4f}, preds={preds}, correct={(preds==y.flatten().astype(int)).all()}")

def ex16():
    """K-means from scratch (numpy: Lloyd's algorithm, 10 iterations)"""
    def kmeans(X, k=3, n_iter=10, seed=42):
        np.random.seed(seed)
        centers = X[np.random.choice(len(X), k, replace=False)]
        labels = np.zeros(len(X), dtype=int)
        for _ in range(n_iter):
            # Assign
            dists = np.array([[np.sum((x - c)**2) for c in centers] for x in X])
            labels = np.argmin(dists, axis=1)
            # Update
            for j in range(k):
                if (labels == j).any():
                    centers[j] = X[labels == j].mean(axis=0)
        inertia = sum(np.sum((X[labels==j] - centers[j])**2) for j in range(k))
        return labels, centers, inertia

    np.random.seed(42)
    X = np.vstack([np.random.randn(50, 2) + c for c in [(0,0),(4,0),(2,3)]])
    labels, centers, inertia = kmeans(X, k=3)
    counts = Counter(labels.tolist())
    print(f"Ex16 — K-means from scratch: cluster_sizes={dict(counts)}, inertia={inertia:.2f}")

def ex17():
    """Logistic regression from scratch (numpy: gradient descent)"""
    def sigmoid(x): return 1 / (1 + np.exp(-np.clip(x, -500, 500)))
    def logistic_regression(X, y, lr=0.1, n_iter=200):
        np.random.seed(42)
        w = np.zeros(X.shape[1])
        b = 0.0
        for _ in range(n_iter):
            z = X @ w + b
            p = sigmoid(z)
            dw = X.T @ (p - y) / len(y)
            db = (p - y).mean()
            w -= lr * dw; b -= lr * db
        return w, b

    np.random.seed(42)
    X = np.vstack([np.random.randn(100, 2) + [1,1], np.random.randn(100, 2) + [-1,-1]])
    y = np.array([1]*100 + [0]*100, dtype=float)
    w, b = logistic_regression(X, y)
    preds = (sigmoid(X @ w + b) > 0.5).astype(int)
    acc = (preds == y.astype(int)).mean()
    print(f"Ex17 — Logistic Regression from scratch: accuracy={acc:.4f}, w_norm={np.linalg.norm(w):.4f}")

def ex18():
    """Decision tree split criterion (numpy: information gain)"""
    def entropy(labels):
        counts = Counter(labels)
        total = len(labels)
        return -sum((c/total) * math.log2(c/total) for c in counts.values() if c > 0)

    def information_gain(parent, left, right):
        n = len(parent)
        ig = entropy(parent) - (len(left)/n)*entropy(left) - (len(right)/n)*entropy(right)
        return ig

    def best_split(X_col, y):
        best_ig, best_threshold = -1, None
        thresholds = np.unique(X_col)
        for t in thresholds:
            left_mask = X_col <= t
            if left_mask.sum() == 0 or (~left_mask).sum() == 0: continue
            ig = information_gain(y, y[left_mask], y[~left_mask])
            if ig > best_ig:
                best_ig = ig; best_threshold = t
        return best_threshold, best_ig

    np.random.seed(42)
    X = np.random.randn(100, 2)
    y = (X[:, 0] + X[:, 1] > 0).astype(int)
    t0, ig0 = best_split(X[:, 0], y)
    t1, ig1 = best_split(X[:, 1], y)
    print(f"Ex18 — Decision Tree Split: feat0: threshold={t0:.4f}, IG={ig0:.4f} | feat1: threshold={t1:.4f}, IG={ig1:.4f}")

def ex19():
    """Cross-validation from scratch (k-fold, no sklearn)"""
    def kfold_cv(X, y, k=5, model_fn=None):
        n = len(X)
        fold_size = n // k
        indices = np.arange(n)
        scores = []
        for fold in range(k):
            val_idx = indices[fold*fold_size:(fold+1)*fold_size]
            train_idx = np.concatenate([indices[:fold*fold_size], indices[(fold+1)*fold_size:]])
            X_train, y_train = X[train_idx], y[train_idx]
            X_val, y_val = X[val_idx], y[val_idx]
            score = model_fn(X_train, y_train, X_val, y_val)
            scores.append(score)
        return {"mean": round(float(np.mean(scores)), 4),
                "std":  round(float(np.std(scores)), 4),
                "scores": [round(s, 4) for s in scores]}

    def simple_model(X_tr, y_tr, X_val, y_val):
        # Predict majority class
        majority = 1 if y_tr.mean() > 0.5 else 0
        preds = np.full(len(y_val), majority)
        return (preds == y_val).mean()

    np.random.seed(42)
    X = np.random.randn(100, 4)
    y = (X[:, 0] > 0).astype(int)
    result = kfold_cv(X, y, k=5, model_fn=simple_model)
    print(f"Ex19 — K-Fold CV from scratch (k=5): {result}")

def ex20():
    """BLEU score from scratch (n-gram precision)"""
    def get_ngrams(tokens, n):
        return [tuple(tokens[i:i+n]) for i in range(len(tokens)-n+1)]

    def bleu_score(hypothesis, reference, max_n=4):
        h = hypothesis.lower().split()
        r = reference.lower().split()
        bp = math.exp(1 - len(r)/len(h)) if len(h) < len(r) else 1.0
        scores = []
        for n in range(1, max_n + 1):
            h_ng = Counter(get_ngrams(h, n))
            r_ng = Counter(get_ngrams(r, n))
            clipped = {ng: min(c, r_ng.get(ng, 0)) for ng, c in h_ng.items()}
            num = sum(clipped.values()) + 1
            den = sum(h_ng.values()) + 1
            scores.append(math.log(num / den))
        return bp * math.exp(sum(scores) / max_n)

    hyp = "the cat sat on the mat"
    ref = "the cat is on the mat"
    score = bleu_score(hyp, ref)
    print(f"Ex20 — BLEU from scratch: {score:.4f}")

def ex21():
    """SQL for ML: feature table query (print complex SQL)"""
    print("""Ex21 — SQL for ML: Feature Table Query:
  -- Feature engineering query for a churn prediction model
  SELECT
      u.user_id,
      u.signup_date,
      u.plan_type,
      -- Recency features
      DATEDIFF(CURRENT_DATE, MAX(e.event_date)) AS days_since_last_event,
      -- Frequency features
      COUNT(DISTINCT e.event_date) AS active_days_last_30,
      COUNT(e.event_id) AS total_events_last_30,
      -- Monetary features
      SUM(t.amount) AS total_spend_last_90,
      AVG(t.amount) AS avg_order_value,
      COUNT(t.transaction_id) AS num_transactions,
      -- Engagement features
      SUM(CASE WHEN e.event_type = 'page_view' THEN 1 ELSE 0 END) AS page_views,
      SUM(CASE WHEN e.event_type = 'click' THEN 1 ELSE 0 END) AS clicks,
      -- Label
      CASE WHEN u.churned_date IS NOT NULL THEN 1 ELSE 0 END AS label
  FROM users u
  LEFT JOIN events e
      ON u.user_id = e.user_id
      AND e.event_date >= CURRENT_DATE - INTERVAL '30 days'
  LEFT JOIN transactions t
      ON u.user_id = t.user_id
      AND t.transaction_date >= CURRENT_DATE - INTERVAL '90 days'
  WHERE u.signup_date < CURRENT_DATE - INTERVAL '14 days'  -- active users
  GROUP BY u.user_id, u.signup_date, u.plan_type, u.churned_date
  ORDER BY days_since_last_event DESC;""")

def ex22():
    """System design: recommendation system (print answer)"""
    print("""Ex22 — System Design: Recommendation System:
  Context: Design Netflix-scale recommendation (200M+ users, 10K+ items)
  COMPONENTS:
    1. CANDIDATE GENERATION (recall)
       Two-Tower Model:
         User tower: embed user history, demographics, context
         Item tower: embed item features, metadata
         ANN search for top-1000 candidates (FAISS)
       Collaborative Filtering fallback: user-item matrix factorization
    2. RANKING (precision)
       Features: user-item interaction score, recency, popularity,
                 contextual features (time of day, device)
       Model: Gradient Boosted Trees or Wide & Deep NN
       Objective: P(click) * P(watch>30min | click)
    3. POST-FILTERING
       Apply business rules: remove watched, enforce diversity,
       boost new content, freshness constraints
    4. SERVING
       Pre-compute top-100 recs per user (offline, nightly)
       Real-time re-ranking for session context
       Cache recommendations in Redis (TTL = 1 hour)
  TRAINING:
    Implicit feedback: watch history, ratings, skips
    Negative sampling: random + popularity-weighted negatives
    Retrain: daily incremental training
  EVALUATION:
    Offline: Recall@K, NDCG, MRR on held-out interactions
    Online:  CTR, watch time, session length (A/B test)
  SCALE: 50ms SLA; 100K QPS; handle cold-start for new users/items""")

def ex23():
    """System design: fraud detection (print answer)"""
    print("""Ex23 — System Design: Fraud Detection:
  Context: Real-time fraud detection for payment transactions (<100ms)
  REQUIREMENTS:
    - Latency: <100ms per transaction
    - Throughput: 10K transactions/second
    - Precision: high (minimize false positives → don't block legit users)
    - Recall: moderate (some fraud acceptable vs blocking customers)
  ARCHITECTURE:
    1. REAL-TIME SCORING (synchronous, inline)
       Features: amount, merchant, location, time, device fingerprint,
                 velocity (txns in last 1/5/60 minutes), IP reputation
       Model: Gradient Boosted Trees (LightGBM) — fast inference
       Latency: <10ms; served via ONNX runtime
    2. FEATURE STORE
       Online: Redis — real-time velocity features (window aggregations)
       Offline: S3/DWH — historical features for training
    3. STREAMING PIPELINE
       Kafka → Flink → Feature computation → Model serving → Kafka
    4. RULES ENGINE
       Hard block: known stolen cards, blacklisted IPs
       Soft flag: unusual amount, new device + foreign country
    5. REVIEW QUEUE
       High-risk flagged transactions → human review
       Semi-automated: require additional authentication (2FA)
    6. FEEDBACK LOOP
       Chargebacks → confirmed fraud labels → retrain weekly
  MODELS: Ensemble (GBM + Neural Net) → calibrated probability output
  THRESHOLDS: Adaptive per merchant category, user risk profile
  METRICS: FPR < 0.5%, Recall > 90%, AUC > 0.98""")

def ex24():
    """Coding: LRU cache (Python OrderedDict)"""
    class LRUCache:
        def __init__(self, capacity):
            self.capacity = capacity
            self.cache = OrderedDict()

        def get(self, key):
            if key not in self.cache:
                return -1
            self.cache.move_to_end(key)
            return self.cache[key]

        def put(self, key, value):
            if key in self.cache:
                self.cache.move_to_end(key)
            self.cache[key] = value
            if len(self.cache) > self.capacity:
                self.cache.popitem(last=False)

    cache = LRUCache(3)
    cache.put(1, "a"); cache.put(2, "b"); cache.put(3, "c")
    v1 = cache.get(1)
    cache.put(4, "d")  # evicts key 2 (LRU)
    v2 = cache.get(2)  # -1 (evicted)
    v3 = cache.get(3)
    print(f"Ex24 — LRU Cache: get(1)={v1}, get(2)={v2} (evicted), get(3)={v3}, keys={list(cache.cache.keys())}")

def ex25():
    """Coding: sliding window maximum (deque)"""
    def sliding_window_max(nums, k):
        result = []
        dq = deque()  # stores indices; front is always max
        for i, num in enumerate(nums):
            # Remove indices outside window
            while dq and dq[0] < i - k + 1:
                dq.popleft()
            # Remove smaller elements from back
            while dq and nums[dq[-1]] < num:
                dq.pop()
            dq.append(i)
            if i >= k - 1:
                result.append(nums[dq[0]])
        return result

    nums = [1, 3, -1, -3, 5, 3, 6, 7]
    result = sliding_window_max(nums, k=3)
    print(f"Ex25 — Sliding Window Max (k=3): input={nums}, result={result}")

def ex26():
    """Coding: implement top-k elements (heapq)"""
    def top_k_frequent(nums, k):
        counts = Counter(nums)
        # Min-heap of size k: keep top-k frequent elements
        heap = []
        for num, count in counts.items():
            heapq.heappush(heap, (count, num))
            if len(heap) > k:
                heapq.heappop(heap)
        return [num for count, num in sorted(heap, reverse=True)]

    def top_k_largest(nums, k):
        # O(n log k) using min-heap of size k
        heap = []
        for num in nums:
            heapq.heappush(heap, num)
            if len(heap) > k:
                heapq.heappop(heap)
        return sorted(heap, reverse=True)

    nums = [1,1,1,2,2,3,3,3,3,4,5,5]
    freq = top_k_frequent(nums, k=3)
    nums2 = [3,1,4,1,5,9,2,6,5,3,5]
    largest = top_k_largest(nums2, k=4)
    print(f"Ex26 — Top-K: frequent={freq}, top_4_largest={largest}")


# ─── NESTED (27–38) ──────────────────────────────────────────

def ex27():
    """Full attention implementation (Q, K, V, multi-head concept, numpy)"""
    def scaled_dot_product_attention(Q, K, V, mask=None):
        d_k = Q.shape[-1]
        scores = Q @ K.transpose(0, 2, 1) / math.sqrt(d_k)
        if mask is not None:
            scores = np.where(mask, scores, -1e9)
        weights = np.exp(scores - scores.max(axis=-1, keepdims=True))
        weights /= weights.sum(axis=-1, keepdims=True)
        return weights @ V

    def multi_head_attention(X, W_Q, W_K, W_V, W_O, n_heads):
        batch, seq_len, d_model = X.shape
        d_head = d_model // n_heads
        Q = X @ W_Q; K = X @ W_K; V = X @ W_V
        # Reshape to (batch, n_heads, seq_len, d_head)
        Q = Q.reshape(batch, seq_len, n_heads, d_head).transpose(0, 2, 1, 3)
        K = K.reshape(batch, seq_len, n_heads, d_head).transpose(0, 2, 1, 3)
        V = V.reshape(batch, seq_len, n_heads, d_head).transpose(0, 2, 1, 3)
        # Attention per head
        heads = []
        for h in range(n_heads):
            head_out = scaled_dot_product_attention(Q[:, h], K[:, h], V[:, h])
            heads.append(head_out)
        concat = np.concatenate(heads, axis=-1)
        return concat @ W_O

    np.random.seed(42)
    batch, seq_len, d_model, n_heads = 2, 5, 16, 4
    X = np.random.randn(batch, seq_len, d_model)
    W_Q = np.random.randn(d_model, d_model) * 0.1
    W_K = np.random.randn(d_model, d_model) * 0.1
    W_V = np.random.randn(d_model, d_model) * 0.1
    W_O = np.random.randn(d_model, d_model) * 0.1
    output = multi_head_attention(X, W_Q, W_K, W_V, W_O, n_heads)
    print(f"Ex27 — Multi-Head Attention: input={X.shape}, output={output.shape}, mean={output.mean():.4f}")

def ex28():
    """Full backprop MLP class (numpy, 2 layers, train XOR)"""
    class MLP:
        def __init__(self, layer_sizes, lr=1.0, seed=42):
            np.random.seed(seed)
            self.lr = lr
            self.W = [np.random.randn(layer_sizes[i], layer_sizes[i+1]) * 0.5
                      for i in range(len(layer_sizes)-1)]
            self.b = [np.zeros((1, layer_sizes[i+1])) for i in range(len(layer_sizes)-1)]

        def _sigmoid(self, x): return 1 / (1 + np.exp(-np.clip(x, -100, 100)))
        def _sigmoid_grad(self, s): return s * (1 - s)

        def forward(self, X):
            self._cache = [X]
            a = X
            for i, (W, b) in enumerate(zip(self.W, self.b)):
                z = a @ W + b
                a = self._sigmoid(z)
                self._cache.append(a)
            return a

        def backward(self, y):
            m = len(y)
            delta = 2 * (self._cache[-1] - y) / m * self._sigmoid_grad(self._cache[-1])
            for i in range(len(self.W)-1, -1, -1):
                dW = self._cache[i].T @ delta
                db = delta.sum(axis=0, keepdims=True)
                if i > 0:
                    delta = (delta @ self.W[i].T) * self._sigmoid_grad(self._cache[i])
                self.W[i] -= self.lr * dW
                self.b[i] -= self.lr * db

        def fit(self, X, y, n_iter=2000):
            for _ in range(n_iter):
                self.forward(X)
                self.backward(y)

        def predict(self, X):
            return (self.forward(X) > 0.5).astype(int)

    X = np.array([[0,0],[0,1],[1,0],[1,1]], dtype=float)
    y = np.array([[0],[1],[1],[0]], dtype=float)
    mlp = MLP([2, 4, 1], lr=1.0)
    mlp.fit(X, y, n_iter=2000)
    preds = mlp.predict(X).flatten()
    y_int = y.flatten().astype(int)
    print(f"Ex28 — Full Backprop MLP (XOR): preds={preds}, correct={np.array_equal(preds, y_int)}")

def ex29():
    """Full k-means class (numpy, fit + predict + inertia)"""
    class KMeans:
        def __init__(self, k=3, n_iter=100, seed=42):
            self.k = k; self.n_iter = n_iter; self.seed = seed
            self.centers_ = None; self.labels_ = None; self.inertia_ = None

        def fit(self, X):
            np.random.seed(self.seed)
            idx = np.random.choice(len(X), self.k, replace=False)
            self.centers_ = X[idx].copy()
            for _ in range(self.n_iter):
                dists = np.array([[np.sum((x - c)**2) for c in self.centers_] for x in X])
                self.labels_ = np.argmin(dists, axis=1)
                new_centers = np.array([X[self.labels_==j].mean(axis=0)
                                        if (self.labels_==j).any() else self.centers_[j]
                                        for j in range(self.k)])
                if np.allclose(self.centers_, new_centers): break
                self.centers_ = new_centers
            self.inertia_ = sum(np.sum((X[self.labels_==j] - self.centers_[j])**2)
                                for j in range(self.k))
            return self

        def predict(self, X):
            dists = np.array([[np.sum((x - c)**2) for c in self.centers_] for x in X])
            return np.argmin(dists, axis=1)

    np.random.seed(42)
    X = np.vstack([np.random.randn(50, 2) + c for c in [(0,0),(5,0),(2.5,4)]])
    km = KMeans(k=3)
    km.fit(X)
    counts = Counter(km.labels_.tolist())
    print(f"Ex29 — Full KMeans: inertia={km.inertia_:.2f}, cluster_sizes={dict(sorted(counts.items()))}")

def ex30():
    """Full logistic regression class (numpy, fit + predict + accuracy)"""
    class LogisticRegression:
        def __init__(self, lr=0.1, n_iter=500, lambda_=0.01, seed=42):
            self.lr = lr; self.n_iter = n_iter; self.lambda_ = lambda_
            np.random.seed(seed)

        def _sigmoid(self, z): return 1 / (1 + np.exp(-np.clip(z, -500, 500)))

        def fit(self, X, y):
            n, d = X.shape
            self.w_ = np.zeros(d); self.b_ = 0.0
            for _ in range(self.n_iter):
                z = X @ self.w_ + self.b_
                p = self._sigmoid(z)
                self.w_ -= self.lr * (X.T @ (p - y) / n + self.lambda_ * self.w_)
                self.b_ -= self.lr * (p - y).mean()
            return self

        def predict_proba(self, X): return self._sigmoid(X @ self.w_ + self.b_)
        def predict(self, X): return (self.predict_proba(X) >= 0.5).astype(int)
        def accuracy(self, X, y): return (self.predict(X) == y).mean()

    np.random.seed(42)
    X = np.vstack([np.random.randn(150, 2) + [2,2], np.random.randn(150, 2) + [-2,-2]])
    y = np.array([1]*150 + [0]*150)
    split = 240
    lr = LogisticRegression()
    lr.fit(X[:split], y[:split])
    acc = lr.accuracy(X[split:], y[split:])
    print(f"Ex30 — Full Logistic Regression: test_accuracy={acc:.4f}")

def ex31():
    """Full evaluation pipeline (accuracy + precision + recall + F1 + AUC)"""
    def evaluate(y_true, y_pred, y_score=None):
        tp = ((y_pred==1)&(y_true==1)).sum()
        fp = ((y_pred==1)&(y_true==0)).sum()
        fn = ((y_pred==0)&(y_true==1)).sum()
        tn = ((y_pred==0)&(y_true==0)).sum()
        acc = (tp+tn)/(tp+tn+fp+fn)
        prec = tp/(tp+fp) if (tp+fp)>0 else 0.0
        rec  = tp/(tp+fn) if (tp+fn)>0 else 0.0
        f1   = 2*prec*rec/(prec+rec) if (prec+rec)>0 else 0.0
        # AUC via trapezoidal rule
        auc = 0.0
        if y_score is not None:
            thresholds = np.sort(np.unique(y_score))[::-1]
            tprs, fprs = [0.0], [0.0]
            pos = (y_true==1).sum(); neg = (y_true==0).sum()
            for t in thresholds:
                pred_t = (y_score >= t).astype(int)
                tp_t = ((pred_t==1)&(y_true==1)).sum()
                fp_t = ((pred_t==1)&(y_true==0)).sum()
                tprs.append(tp_t/pos if pos>0 else 0)
                fprs.append(fp_t/neg if neg>0 else 0)
            tprs.append(1.0); fprs.append(1.0)
            auc = float(np.trapz(tprs, fprs))
        return {"accuracy": round(float(acc),4), "precision": round(float(prec),4),
                "recall": round(float(rec),4), "f1": round(float(f1),4),
                "auc": round(abs(auc),4)}

    np.random.seed(42)
    y_true  = np.random.randint(0, 2, 200)
    y_score = np.where(y_true==1, np.random.uniform(0.5,1.0,200), np.random.uniform(0.0,0.6,200))
    y_pred  = (y_score > 0.5).astype(int)
    result  = evaluate(y_true, y_pred, y_score)
    print(f"Ex31 — Full Evaluation Pipeline: {result}")

def ex32():
    """ML system design framework (print structured template)"""
    print("""Ex32 — ML System Design Framework (Interview Template):
  1. CLARIFY REQUIREMENTS (2-3 min)
     - What is the business metric? (revenue, engagement, safety)
     - What are the constraints? (latency, scale, cost, interpretability)
     - Online (real-time) or offline (batch) inference?
     - Cold start problem? (new users/items)
  2. DEFINE THE ML PROBLEM (2 min)
     - What is the label? How is it collected?
     - Binary classification / multi-class / regression / ranking?
     - Proxy metric for ML → business metric mapping?
  3. DATA (5 min)
     - Data sources: logs, databases, third-party
     - Feature engineering: user features, item features, context features
     - Training data size, quality, class balance
  4. MODELING (5 min)
     - Feature engineering → candidate models → final choice
     - Simple baseline first (logistic regression, heuristic)
     - More complex model (GBM, 2-tower, transformer)
     - Loss function, training objective
  5. SERVING (3 min)
     - Batch pre-compute vs real-time inference
     - Feature store: offline (DWH) + online (Redis)
     - Latency requirements → model format (ONNX/TorchScript)
  6. MONITORING (2 min)
     - Data drift, prediction drift, business metric drift
     - Retraining schedule: daily/weekly/trigger-based
  7. TRADEOFFS (1 min)
     - What would you do differently with more time/data/compute?""")

def ex33():
    """SQL for ML analytics (print multi-join aggregation query)"""
    print("""Ex33 — SQL for ML Analytics (Multi-Join Aggregation):
  -- Training data pipeline: join feature tables + compute label
  WITH user_features AS (
      SELECT
          u.user_id,
          u.age,
          u.country,
          u.account_age_days,
          COALESCE(p.total_spend_90d, 0) AS total_spend_90d,
          COALESCE(p.num_purchases_90d, 0) AS num_purchases_90d
      FROM users u
      LEFT JOIN (
          SELECT user_id,
                 SUM(amount) AS total_spend_90d,
                 COUNT(*) AS num_purchases_90d
          FROM purchases
          WHERE purchase_date >= CURRENT_DATE - INTERVAL '90 days'
          GROUP BY user_id
      ) p USING (user_id)
  ),
  engagement_features AS (
      SELECT user_id,
             COUNT(DISTINCT DATE(event_time)) AS active_days_30,
             SUM(CASE WHEN event_type='session_start' THEN 1 ELSE 0 END) AS sessions_30,
             AVG(session_duration_secs) AS avg_session_secs
      FROM events
      WHERE event_time >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY user_id
  ),
  labels AS (
      SELECT user_id,
             CASE WHEN churned_date IS NOT NULL
                   AND churned_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
                  THEN 1 ELSE 0 END AS will_churn_30d
      FROM users
  )
  SELECT uf.*, ef.active_days_30, ef.sessions_30, ef.avg_session_secs,
         l.will_churn_30d
  FROM user_features uf
  LEFT JOIN engagement_features ef USING (user_id)
  JOIN labels l USING (user_id)
  WHERE uf.account_age_days >= 14;""")

def ex34():
    """Coding interview patterns for ML engineers (print top 10)"""
    print("""Ex34 — Top 10 Coding Interview Patterns for ML Engineers:
  1. SLIDING WINDOW
     Use: Max/min/sum in window; substring problems
     Example: Max sum subarray of size k → O(n) with deque
  2. TWO POINTERS
     Use: Sorted array problems; palindrome; merge sorted lists
     Example: Find pairs that sum to target → O(n)
  3. HASH MAP / COUNTER
     Use: Frequency counting, lookup, cache
     Example: Two-sum, most frequent element, LRU cache
  4. HEAP (PRIORITY QUEUE)
     Use: Top-K, running median, merge K sorted lists
     Example: heapq.nlargest(k, nums) → O(n log k)
  5. BFS / GRAPH TRAVERSAL
     Use: Shortest path, connected components, tree levels
     Example: Word ladder, number of islands
  6. BINARY SEARCH
     Use: Sorted array; search space problems
     Example: Find rotation point; kth smallest; search range
  7. DYNAMIC PROGRAMMING
     Use: Optimal substructure; LCS, edit distance, knapsack
     Example: Levenshtein distance (used in WER metric)
  8. MATRIX / 2D ARRAYS
     Use: Image processing, grid problems, DP tables
     Example: Edit distance DP table, k-anonymity check
  9. RECURSION + MEMOIZATION
     Use: Tree problems, divide-and-conquer
     Example: Quick-select for median; tree DFS
 10. RESERVOIR SAMPLING / RANDOMIZED ALGORITHMS
     Use: Sample from stream, shuffle in-place
     Example: Sample k from stream of unknown size → O(n) time""")

def ex35():
    """Common ML interview mistakes (print top 10 + fixes)"""
    print("""Ex35 — Top 10 ML Interview Mistakes + Fixes:
   1. MISTAKE: Jumping to deep learning for every problem.
      FIX: Always establish a simple baseline first (logistic regression, rules).
   2. MISTAKE: Not asking clarifying questions.
      FIX: Spend 2-3 minutes clarifying: scale, latency, label availability.
   3. MISTAKE: Ignoring the data — going straight to model selection.
      FIX: Discuss data sources, quality, imbalance, feature engineering first.
   4. MISTAKE: Forgetting about train/test leakage.
      FIX: Always split data BEFORE any preprocessing/feature computation.
   5. MISTAKE: Using accuracy on imbalanced data.
      FIX: Use F1, AUC-ROC, precision@k depending on business requirement.
   6. MISTAKE: Not discussing monitoring and retraining.
      FIX: Every ML system needs drift detection and a retraining strategy.
   7. MISTAKE: Coding with brute force when O(n log k) or O(n) exists.
      FIX: Know heap for Top-K, deque for sliding window, Counter for frequency.
   8. MISTAKE: Confusing parameters with hyperparameters.
      FIX: Parameters = learned from data (W, b); Hyperparameters = set by you (lr, k).
   9. MISTAKE: Not connecting model to business metric.
      FIX: Clarify: how does improved F1 → ↑revenue or ↓cost?
  10. MISTAKE: Overcomplicating the architecture.
      FIX: Start simple, add complexity only when you've justified the need.""")

def ex36():
    """ML math review: linear algebra key concepts (print)"""
    print("""Ex36 — Linear Algebra Key Concepts for ML:
  VECTORS & MATRICES
    Dot product:    a·b = Σ aᵢbᵢ = ||a|| ||b|| cos(θ)
    Matrix multiply: (AB)ᵢⱼ = Σₖ Aᵢₖ Bₖⱼ  → O(n²p) for n×p, p×m
  EIGENVALUES / EIGENVECTORS
    Av = λv  (v is eigenvector; λ is eigenvalue)
    Used in: PCA (covariance matrix eigenvectors = principal components)
  SVD (Singular Value Decomposition)
    A = U Σ Vᵀ  (U: left singular vectors, Σ: singular values, V: right)
    Used in: PCA, collaborative filtering, pseudoinverse
  NORMS
    L1 norm:  ||x||₁ = Σ|xᵢ|            (sparsity, Lasso)
    L2 norm:  ||x||₂ = √(Σxᵢ²)         (Ridge regression)
    Frobenius: ||A||_F = √(Σᵢⱼ Aᵢⱼ²)   (matrix regularization)
  KEY FOR ML
    Attention: QKᵀ is dot product similarity (inner product)
    PCA: X = U Σ Vᵀ; keep top-k columns of V = principal directions
    Cosine similarity: sim(a,b) = a·b / (||a|| ||b||)
    Gradient: ∂(Ax)/∂x = Aᵀ; ∂(xᵀAx)/∂x = (A+Aᵀ)x""")

def ex37():
    """ML math review: probability key concepts (print)"""
    print("""Ex37 — Probability Key Concepts for ML:
  RULES
    Chain rule:     P(A,B) = P(A|B)P(B)
    Bayes' theorem: P(A|B) = P(B|A)P(A) / P(B)
    Total prob:     P(B) = Σ P(B|Aᵢ)P(Aᵢ)
  DISTRIBUTIONS
    Bernoulli:  P(X=1) = p           (coin flip)
    Binomial:   P(X=k) = C(n,k) pᵏ(1-p)ⁿ⁻ᵏ
    Gaussian:   f(x) = exp(-(x-μ)²/(2σ²)) / (σ√(2π))
    Categorical: softmax over classes
  KEY EXPECTATIONS
    E[X] = Σ x P(X=x)
    Var[X] = E[X²] - (E[X])²
    Cov[X,Y] = E[(X-μX)(Y-μY)]
  USED IN ML
    Cross-entropy loss: L = -Σ yᵢ log(pᵢ)  ← MLE under Bernoulli/Categorical
    KL divergence:      KL(P||Q) = Σ P(x) log(P(x)/Q(x))
    Maximum Likelihood: find θ that maximizes P(data | θ)
    MAP (Bayesian):     find θ that maximizes P(θ|data) ∝ P(data|θ)P(θ)
  INFORMATION THEORY
    Entropy:      H(X) = -Σ P(x) log P(x)
    Mutual info:  I(X;Y) = H(X) - H(X|Y)
    Cross-entropy ≥ Entropy (equality when P = Q)""")

def ex38():
    """ML math review: statistics key concepts (print)"""
    print("""Ex38 — Statistics Key Concepts for ML:
  HYPOTHESIS TESTING
    Null hypothesis H₀: no effect (e.g., model A = model B)
    p-value: P(observing data this extreme | H₀ true)
    Reject H₀ if p < α (typically α=0.05)
    Type I error (false positive): reject H₀ when true  → FPR
    Type II error (false negative): fail to reject when false → FNR
  CONFIDENCE INTERVALS
    95% CI: μ ± 1.96 * (σ/√n)
    Interpretation: 95% of such intervals contain true mean
  A/B TESTING
    Two-sample t-test for means; z-test for proportions
    Sample size: n = (z_{α/2} + z_β)² * 2σ² / δ²
    where δ = minimum detectable effect, β = power (1-β = 0.8 typical)
  CORRELATION
    Pearson:  r = Cov(X,Y) / (σX σY) → linear relationship
    Spearman: rank correlation → monotonic relationship
    Note: correlation ≠ causation
  BIAS IN ML STATISTICS
    Selection bias:   training/test distribution ≠ deployment distribution
    Survivorship bias: only see successful examples (e.g., only sold houses)
    Berkson's paradox: conditioning on collider creates spurious correlation
  CALIBRATION
    Reliability diagram: plot mean confidence vs actual accuracy per bin
    ECE = Σ |acc_bin - conf_bin| * (n_bin / n_total)""")


# ─── ADVANCED (39–50) ────────────────────────────────────────

def ex39():
    """LLM architecture deep dive (print: tokenizer → embedding → layers → head)"""
    print("""Ex39 — LLM Architecture Deep Dive:
  1. TOKENIZER
     BPE (Byte-Pair Encoding): Merge frequent byte pairs iteratively.
     Vocabulary: 32K-100K subword tokens.
     "ChatGPT" → ["Chat", "G", "PT"] (GPT-4 tokenizer)
     Special tokens: [BOS], [EOS], [PAD], [SEP], [UNK]
  2. EMBEDDING LAYER
     Token embedding:     E_token ∈ R^{V × d}   (lookup table)
     Positional encoding: E_pos   ∈ R^{L × d}   (learned or RoPE)
     Input:               X = E_token[token_ids] + E_pos
  3. TRANSFORMER LAYERS × N
     Each layer:
       a. Pre-LayerNorm (RMSNorm in modern LLMs)
       b. Multi-Head Self-Attention (GQA in LLaMA-3/GPT-4)
       c. Residual connection: X = X + Attention(LN(X))
       d. Pre-LayerNorm
       e. Feed-Forward (SwiGLU in LLaMA, GELU in GPT)
          FFN(x) = W₂ * SiLU(W₁x) ⊙ (W₃x)  [SwiGLU]
       f. Residual connection: X = X + FFN(LN(X))
  4. OUTPUT HEAD
     LM head: Linear(d_model → V) + Softmax → token probabilities
     Tied to input embedding (weight sharing) in most models
  Key hyperparameters (LLaMA-3-70B):
    d_model = 8192,  n_heads = 64,  n_layers = 80
    d_ff = 28672, n_kv_heads = 8 (GQA), context = 128K tokens""")

def ex40():
    """Chinchilla scaling laws (print: N_opt, D_opt formulas + table)"""
    print("""Ex40 — Chinchilla Scaling Laws:
  Paper: Hoffmann et al. (2022) "Training Compute-Optimal Language Models"
  Finding: Given a compute budget C = 6ND (FLOPs),
           optimal model size N and data size D are:
    N_opt ∝ C^0.5   (model parameters)
    D_opt ∝ C^0.5   (training tokens)
    Rule of thumb: D_opt ≈ 20 × N_opt tokens
  Loss function:  L(N, D) = E + A/N^α + B/D^β
    E = irreducible loss (data entropy), α≈0.34, β≈0.28
  Practical compute-optimal configurations:
    Compute Budget    | N_opt    | D_opt         | Model Example
    1e21 FLOPs        |  1B      |  20B tokens   | SmolLM-1B
    1e22 FLOPs        |  3B      |  60B tokens   | Phi-3-mini
    1e23 FLOPs        | 10B      | 200B tokens   | LLaMA-3-8B
    1e24 FLOPs        | 30B      | 600B tokens   | LLaMA-3-70B
    1e25 FLOPs        | 100B     | 2T tokens     | GPT-4 class
  Key insight: GPT-3 (175B, 300B tokens) was severely undertrained
               by Chinchilla standards. Chinchilla-70B matched GPT-3
               quality at 4x fewer parameters (but 4x more data).
  Modern practice: Train LONGER than Chinchilla optimal
                   for better inference efficiency (LLaMA-3, Mistral)""")

def ex41():
    """RLHF technical deep dive (print: SFT → reward model → PPO)"""
    print("""Ex41 — RLHF Technical Deep Dive:
  STEP 1: SUPERVISED FINE-TUNING (SFT)
    Data: ~10K-100K human-written prompt-response pairs
    Training: Cross-entropy on human responses
    Model: π_SFT (instruction-following but not preference-aligned)
    Duration: 1-5 epochs; learning rate 1e-5 to 1e-4
  STEP 2: REWARD MODEL (RM)
    Data: ~50K-500K human preference pairs (A vs B)
    Label: human judges which response is better (pairwise comparison)
    Architecture: SFT model + linear head → scalar reward
    Loss: L_RM = -E[log σ(RM(x, y_w) - RM(x, y_l))]
           where y_w = preferred response, y_l = less preferred
    Training: Optimize Bradley-Terry model of human preferences
  STEP 3: PPO FINE-TUNING (RL)
    Environment: LLM = policy π_θ; each token = action; response = trajectory
    Reward: r = RM(x, y) - β * KL(π_θ(y|x) || π_SFT(y|x))
    PPO clip objective:
      L_CLIP = E[min(r_t(θ)Â_t, clip(r_t(θ), 1-ε, 1+ε)Â_t)]
      where r_t(θ) = π_θ/π_old, ε=0.2
    Value function: separate critic head estimates baseline V(s)
    Batch: 64-512 rollouts; 4-8 gradient steps per batch
  IMPLEMENTATION NOTES:
    - PPO is notoriously sensitive to hyperparameters
    - Common issues: reward hacking, mode collapse, forgetting
    - DPO (Direct Preference Optimization) avoids RL entirely:
      L_DPO = -E[log σ(β log π_θ(y_w|x)/π_ref(y_w|x) - β log π_θ(y_l|x)/π_ref(y_l|x))]""")

def ex42():
    """LoRA vs QLoRA vs full fine-tuning comparison (print table)"""
    print("""Ex42 — LoRA vs QLoRA vs Full Fine-Tuning:
  ┌──────────────────┬──────────────────┬──────────────────┬──────────────────┐
  │ Dimension        │ Full Fine-Tuning │ LoRA             │ QLoRA            │
  ├──────────────────┼──────────────────┼──────────────────┼──────────────────┤
  │ Trainable params │ 100% (~100B)     │ ~0.1-1% (~100M)  │ ~0.1-1% (~100M)  │
  │ GPU memory       │ 8× model size    │ 2-3× model size  │ ~1× model size   │
  │ GPU for 7B model │ 8×A100 (80GB)    │ 2×A100           │ 1×A100 or 4×V100 │
  │ Model quality    │ Best             │ Near-best        │ Near-LoRA        │
  │ Training speed   │ Slowest          │ Fast             │ Slower (quant)   │
  │ Inference        │ Full model       │ Merge adapters   │ Dequant + merge  │
  │ Storage          │ Full checkpoint  │ Small adapter    │ Small adapter    │
  │ Quantization     │ None             │ None (bf16)      │ 4-bit NF4        │
  └──────────────────┴──────────────────┴──────────────────┴──────────────────┘
  LoRA mechanism:
    W = W_0 + ΔW = W_0 + BA   (B: d×r, A: r×k, rank r << k)
    r = 8 or 16 is typical; reduces params by 100-1000x
  QLoRA additions:
    1. 4-bit NormalFloat quantization of base model weights
    2. Double quantization (quantize the quantization constants)
    3. Paged optimizers (avoid GPU OOM with CPU offload)
  When to use:
    Full FT:  Unlimited compute; dramatically different task
    LoRA:     Limited GPU; multiple tasks (swap adapters)
    QLoRA:    Consumer GPU (24GB); good results at low cost""")

def ex43():
    """Distributed training: data vs model vs pipeline parallelism (print)"""
    print("""Ex43 — Distributed Training Parallelism Strategies:
  1. DATA PARALLELISM (DDP)
     How: Replicate entire model on each GPU; split data across GPUs.
     Gradient sync: AllReduce (gradient averaging) after each batch.
     PyTorch: torch.nn.parallel.DistributedDataParallel
     When: Model fits on single GPU; more data/compute needed.
     Overhead: N-1 AllReduce communications per step.
  2. TENSOR PARALLELISM (Model Parallelism)
     How: Split individual weight matrices across GPUs.
     Example: W ∈ R^{d×4d} → 4 GPUs each hold W ∈ R^{d×d}
     NVIDIA Megatron-LM: split attention heads and FFN layers
     When: Single layer doesn't fit on one GPU.
     Overhead: 2 AllReduce per transformer layer.
  3. PIPELINE PARALLELISM
     How: Different GPUs hold different LAYERS of the model.
     GPipe: micro-batching to fill pipeline and reduce bubble time
     PipeDream: 1F1B (1 forward, 1 backward) scheduling
     When: Extremely large models (>100B params).
     Overhead: Pipeline bubble = (p-1)/p of total time (p = pipeline stages).
  4. COMBINATIONS (3D Parallelism)
     ZeRO (DeepSpeed): Shard optimizer state + gradients + parameters
       ZeRO-1: Shard optimizer state only (4x memory savings)
       ZeRO-2: + Shard gradients     (8x memory savings)
       ZeRO-3: + Shard parameters    (64x memory savings)
     Production: ZeRO-3 + Tensor Parallel + Pipeline Parallel (GPT-4 scale)
  Tools: DeepSpeed, Megatron-LM, FSDP (PyTorch), JAX pjit""")

def ex44():
    """Production ML failure modes + mitigations (print top 10)"""
    print("""Ex44 — Top 10 Production ML Failure Modes + Mitigations:
   1. DATA DRIFT
      Model performance degrades as input distribution changes.
      Detect: KS test / PSI on feature distributions daily.
      Mitigate: Automatic retraining trigger when PSI > 0.2.
   2. LABEL DRIFT
      Relationship between features and labels changes over time.
      Example: Fraud patterns change; model doesn't see new attack types.
      Mitigate: Continuous label collection; online learning pipeline.
   3. TRAIN-SERVE SKEW
      Features computed differently in training vs serving.
      Classic: Training uses future data by accident (leakage).
      Mitigate: Feature store ensures same code for offline + online.
   4. FEEDBACK LOOP
      Model predictions influence future data used to retrain.
      Example: Recommender system: only shows items it predicts as relevant.
      Mitigate: Exploration policy (epsilon-greedy); hold-out control group.
   5. SILENT FAILURES
      Model returns a prediction but it's wrong; no error raised.
      Detect: Prediction distribution monitoring; model-specific health checks.
   6. CASCADE FAILURES
      Upstream model failure propagates downstream.
      Mitigate: Fallback rules; circuit breakers; graceful degradation.
   7. HARDWARE / SOFTWARE VERSION CHANGES
      CUDA update, library version → different floating-point results.
      Mitigate: Pin all dependencies; canary deployments; regression tests.
   8. COLD START
      New users/items have no history → poor recommendations.
      Mitigate: Content-based fallback; popular items default.
   9. IMBALANCED PRODUCTION DATA
      Real-world class distribution ≠ training distribution.
      Mitigate: Calibrate model probabilities; adjust decision threshold.
  10. PRIVACY INCIDENTS
      Model memorizes training data → exposes PII in outputs.
      Mitigate: Differential privacy training; output filtering; red-teaming.""")

def ex45():
    """Full system design: production ML platform (print architecture)"""
    print("""Ex45 — Production ML Platform: Full Architecture:
  ┌─────────────────────────────────────────────────────────┐
  │              PRODUCTION ML PLATFORM                     │
  └─────────────────────────────────────────────────────────┘
  DATA LAYER
    Raw data:      S3 / GCS / ADLS (data lake)
    DWH:           Snowflake / BigQuery (SQL analytics)
    Streaming:     Kafka → Flink → feature computation
    Feature store: Feast / Tecton (offline+online features)
  DEVELOPMENT LAYER
    Notebooks:     JupyterHub / VS Code + cloud compute
    Versioning:    DVC (data) + Git (code) + MLflow (experiments)
    HPO:           Optuna / Ray Tune
    Compute:       Kubernetes GPU cluster (A100/H100)
  TRAINING LAYER
    Orchestration: Kubeflow Pipelines / Airflow / Metaflow
    Distributed:   PyTorch DDP + DeepSpeed (large models)
    Tracking:      MLflow / Weights & Biases
    Model registry: MLflow Model Registry (stage: staging→production)
  SERVING LAYER
    Online:        Triton Inference Server / TorchServe / vLLM
    Batch:         Spark ML / Ray Batch
    API gateway:   FastAPI + Kubernetes (HPA autoscaling)
    Caching:       Redis (semantic cache + feature cache)
    CDN:           CloudFront (for static model artifacts)
  MONITORING LAYER
    Metrics:       Prometheus + Grafana (latency, throughput)
    Drift:         Evidently AI / WhyLabs (feature + prediction drift)
    Logging:       ELK stack / Datadog (request logs)
    Alerting:      PagerDuty (SLA breaches, safety violations)
  GOVERNANCE LAYER
    Lineage:       OpenLineage / DataHub
    Audit:         Immutable logs, model cards, datasheets
    CI/CD:         GitHub Actions → automated eval → deploy""")

def ex46():
    """ML career roadmap: Junior → Senior → Staff → Principal (print)"""
    print("""Ex46 — ML Engineer Career Roadmap:
  JUNIOR ML ENGINEER (0-3 years) | L3-L4
    Focus: Execute well-defined tasks; learn the stack.
    Skills: Python, SQL, PyTorch/TF, sklearn, Jupyter, Git.
    Deliverable: Implement and deploy one model end-to-end.
    Typical scope: Feature; component; small improvement.
  SENIOR ML ENGINEER (3-7 years) | L5
    Focus: Independently lead projects; mentor juniors.
    Skills: Full ML platform knowledge; system design; statistics.
    Deliverable: Lead new ML product feature from idea to production.
    Typical scope: Full project; team-level technical decisions.
  STAFF ML ENGINEER (7-12 years) | L6
    Focus: Cross-team impact; set technical direction.
    Skills: Architecture design; influence without authority; roadmapping.
    Deliverable: Define ML platform strategy; improve org-wide practices.
    Typical scope: Multiple teams; multi-quarter initiatives.
  PRINCIPAL ML ENGINEER (12+ years) | L7+
    Focus: Company-level technical strategy; external influence.
    Skills: Deep expertise; systems thinking; executive communication.
    Deliverable: Define company ML direction; represent org in industry.
    Typical scope: Entire org; multi-year bets.
  Salary ranges (USA, 2025):
    Junior:    $150K-$200K total comp
    Senior:    $250K-$400K total comp
    Staff:     $400K-$700K total comp
    Principal: $600K-$1M+ total comp""")

def ex47():
    """Salary negotiation guide for ML roles (print framework)"""
    print("""Ex47 — Salary Negotiation Guide for ML Roles:
  BEFORE THE OFFER
    1. Research: Levels.fyi, Glassdoor, Blind, LinkedIn Salary
       Know market rate for your level, company, and location.
    2. Never name a number first: "I'm flexible — what's the range?"
    3. Build competing offers: even one competing offer = +20-30% leverage
  EVALUATING THE OFFER
    Total compensation = base + bonus + equity (4-year vest) + benefits
    Don't compare base salaries — compare total comp (TC).
    Example: $200K base + 15% bonus + $400K equity over 4Y = $310K TC/year
  NEGOTIATING
    1. Express enthusiasm FIRST: "I'm very excited about this role..."
    2. Counter: Always counter (leaves money on table if you don't)
    3. Counter format: "Based on my research and competing offers,
       I was expecting [$X]. Is there flexibility?"
    4. Levers to negotiate: base, equity, signing bonus, start date, title
    5. Use competing offers explicitly: "I have an offer at $X from Company Y"
  TACTICS
    - "I need to discuss with my family" — buys time without saying no
    - Ask for equity cliff reduction or accelerated vesting
    - Negotiate signing bonus when equity is low (new hire)
    - Remote work / PTO / annual hardware budget = real value
  RED FLAGS
    - "No flexibility whatsoever" (usually not true)
    - Pressure to decide immediately without time to review
  FINAL STEP: Get it in writing before resigning from current role.""")

def ex48():
    """Top 15 ML interview questions + model answers (print)"""
    print("""Ex48 — Top 15 ML Interview Questions + Model Answers:
   1. "Explain overfitting and how you handle it."
      → Overfitting = model too complex for data. Fix: regularization,
        dropout, more data, early stopping, cross-validation.
   2. "What is the difference between L1 and L2 regularization?"
      → L1 (Lasso): adds |w|; promotes sparsity; feature selection.
        L2 (Ridge): adds w²; penalizes large weights; stable solution.
   3. "How does gradient descent work?"
      → Iteratively move weights in direction of -gradient to minimize loss.
        θ = θ - α∇L. Variants: SGD, mini-batch, Adam.
   4. "Explain the attention mechanism."
      → Score = softmax(QKᵀ/√d)V. Token learns to weight all others
        by relevance. Enables parallelism over sequences.
   5. "What is RLHF and why is it important?"
      → SFT → reward model (human prefs) → PPO fine-tuning.
        Aligns model behavior with human values and preferences.
   6. "How would you handle class imbalance?"
      → Oversample minority (SMOTE), undersample majority, class weights,
        focal loss, threshold adjustment, F1/AUC over accuracy.
   7. "Explain bias-variance tradeoff."
      → MSE = Bias² + Variance + Noise. Simple model → high bias.
        Complex model → high variance. Balance with regularization.
   8. "How do you evaluate a ranking system?"
      → NDCG (position-weighted relevance), MRR, Precision@K, Recall@K.
   9. "What is a transformer and why did it replace RNNs?"
      → Fully attention-based; no recurrence → parallelizable;
        better at long-range dependencies; scales with compute.
  10. "Explain RAG."
      → Retrieve relevant chunks from knowledge base, augment prompt,
        generate grounded answer. Reduces hallucinations.
  11. "How do you monitor a deployed ML model?"
      → Data drift (PSI/KS test), prediction drift, business metrics,
        latency, error rate. Trigger retraining on drift.
  12. "What is the curse of dimensionality?"
      → In high dimensions, all points become equidistant; sparse;
        volume of space grows exponentially. Mitigation: PCA, feature selection.
  13. "Explain precision vs recall trade-off."
      → Precision = TP/(TP+FP); Recall = TP/(TP+FN). Raising threshold
        improves precision, hurts recall. Choose based on cost of each error.
  14. "What is LoRA?"
      → Low-Rank Adaptation: ΔW = BA (rank r). Fine-tune only 0.1% of params.
        Huge memory savings; near-full fine-tune quality.
  15. "How do you prevent data leakage?"
      → Split before preprocessing; no future features; feature store
        enforces same computation offline and online.""")

def ex49():
    """30-day AI/ML interview study plan (print week-by-week)"""
    print("""Ex49 — 30-Day AI/ML Interview Study Plan:
  WEEK 1: FOUNDATIONS (Days 1-7)
    Day 1: Linear algebra review (matrix multiply, SVD, eigenvalues)
    Day 2: Probability + statistics (Bayes, distributions, p-values)
    Day 3: Classic ML (regression, classification, trees, SVMs)
    Day 4: Evaluation metrics (precision, recall, F1, AUC, calibration)
    Day 5: Coding — LeetCode: arrays, strings, hash maps (10 problems)
    Day 6: Deep learning fundamentals (backprop, SGD, batch norm)
    Day 7: Practice: solve 1 ML system design problem end-to-end
  WEEK 2: DEEP LEARNING + NLP (Days 8-14)
    Day 8:  Neural networks — CNNs, RNNs, LSTMs
    Day 9:  Transformers — attention, BERT, GPT, positional encoding
    Day 10: LLM fundamentals — tokenization, scaling laws, pretraining
    Day 11: Fine-tuning — SFT, RLHF, DPO, LoRA, QLoRA
    Day 12: Coding — LeetCode: trees, graphs, BFS/DFS (10 problems)
    Day 13: RAG pipeline — end-to-end implementation
    Day 14: Mock interview — ML theory questions (60 min)
  WEEK 3: MLOps + SYSTEMS (Days 15-21)
    Day 15: Feature engineering + feature stores
    Day 16: MLOps — experiment tracking, model registry, CI/CD for ML
    Day 17: Model serving — Triton, latency optimization, batching
    Day 18: Monitoring — drift detection, alerting, retraining pipelines
    Day 19: Coding — LeetCode: heaps, sorting, sliding window (10 problems)
    Day 20: System design: recommendation system
    Day 21: System design: real-time fraud detection
  WEEK 4: ADVANCED TOPICS + MOCK INTERVIEWS (Days 22-30)
    Day 22: LLM evaluation — BLEU, ROUGE, G-eval, MT-Bench
    Day 23: AI safety + alignment — RLHF, Constitutional AI, red-teaming
    Day 24: Fairness + bias — demographic parity, equalized odds, debiasing
    Day 25: Coding — LeetCode medium-hard (dynamic programming, 10 problems)
    Day 26: Mock interview 1 — coding (90 min with peer/interviewer)
    Day 27: Mock interview 2 — ML system design (60 min)
    Day 28: Mock interview 3 — ML theory + behavioral (60 min)
    Day 29: Review weakest areas from mock interviews
    Day 30: Light review + rest — no new material the night before!""")

def ex50():
    """Final review: everything you need to know (print summary)"""
    print("""Ex50 — Final Review: Everything You Need to Know for ML Interviews:
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ML THEORY
    Bias-variance:   MSE = Bias² + Variance + Noise
    Regularization:  L1=sparsity, L2=smooth weights, Dropout=ensemble
    Backprop:        Chain rule; δ = ∂L/∂z = upstream_grad × local_grad
    Attention:       softmax(QKᵀ/√d)V; scales to long sequences
    Transformers:    BERT=encoder, GPT=decoder, T5=both
  LLMs
    Scaling laws:    Chinchilla: N_opt ∝ C^0.5, D_opt = 20×N
    RLHF:            SFT → RM (human pairs) → PPO (KL-constrained)
    DPO:             Skip RM; optimize π directly on preference pairs
    LoRA:            ΔW = BA (rank r); 0.1% trainable params
    RAG:             embed → search → augment → generate
    Hallucination:   n-gram overlap, self-consistency, CoVe, RAG
  SYSTEMS
    Feature store:   Feast (offline=DWH, online=Redis)
    Serving:         Triton/vLLM; ONNX; <100ms SLA typical
    Monitoring:      PSI>0.2=retrain; drift dashboard; daily sampling
    Distributed:     DDP, ZeRO, Tensor Parallel, Pipeline Parallel
  CODING
    Top-K:           heapq (min-heap of size k) → O(n log k)
    LRU Cache:       OrderedDict.move_to_end() + popitem(last=False)
    Sliding window:  deque (indices) → O(n)
    K-fold CV:       Slice indices; no sklearn dependency
    BLEU:            Modified n-gram precision × brevity penalty
  FAIRNESS
    Metrics:         SPD, EOD, DI (4/5 rule), FPR parity, PPV parity
    Mitigations:     Reweighting, threshold adjustment, adversarial debiasing
    Post-processing: Find per-group thresholds for target TPR
  INTERVIEWING
    Framework:       Clarify → data → baseline → model → serving → monitoring
    Always:          Ask clarifying questions, think aloud, trade-offs
    Never:           Jump to DL without baseline; forget monitoring
  STUDY RESOURCES:
    Courses:   Fast.ai, CS229, Andrej Karpathy's LLM from scratch
    Books:     Hands-On ML (Geron), Deep Learning (Goodfellow)
    Practice:  LeetCode, ML System Design (Chip Huyen), Papers With Code""")


def main():
    print("=" * 60)
    print("Examples 6.5 - AI/ML Interview Preparation")
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
