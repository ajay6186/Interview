# ============================================================
# Solution 6.5 — AI/ML Interview Preparation
# ============================================================
import math
import random
from collections import Counter


# ---------------------------------------------------------------------------
# TODO 1 — Bias-Variance Tradeoff
# ---------------------------------------------------------------------------

def explain_bias_variance():
    print("""
[CONCEPT] Bias-Variance Tradeoff
==================================

DECOMPOSITION:
  Expected prediction error = Bias² + Variance + Irreducible Noise

  Bias²    : error from wrong assumptions in the learning algorithm
             (model is too simple → underfits → high training AND test error)
  Variance : sensitivity to fluctuations in training set
             (model is too complex → overfits → low train, high test error)
  Noise    : irreducible error from inherent randomness in the data

INTUITION:
  - High bias: decision tree depth=1 on non-linear data → always wrong
  - High variance: degree-10 polynomial on 10 noisy points → memorizes noise
  - Sweet spot: bias and variance balanced → best generalization

FORMULAS:
  bias(x) = E[f̂(x)] - f(x)          (expected prediction minus truth)
  variance(x) = E[(f̂(x) - E[f̂(x)])²]  (spread of predictions)
  MSE = bias² + variance + σ²

MODEL COMPLEXITY vs ERROR:
  Low complexity  → High bias,   Low variance  (underfitting)
  High complexity → Low bias,    High variance (overfitting)
  Optimal         → Balanced bias and variance

EXAMPLES:
  High bias: Linear regression on non-linear data
  High variance: k-NN with k=1 on small dataset
  Well-balanced: k-NN with k=sqrt(n), cross-validated

SOLUTIONS:
  Reduce bias:     larger model, more features, longer training
  Reduce variance: more data, regularization (L1/L2), dropout,
                   ensemble methods (bagging), early stopping

PRACTICAL NOTE (deep learning):
  - Modern large models (transformers) operate in the "modern double descent"
    regime: after the interpolation threshold, more capacity can REDUCE
    test error even while perfectly fitting training data
  - The classical tradeoff still applies in the under-parameterized regime
""")


# ---------------------------------------------------------------------------
# TODO 2 — Gradient Descent Variants
# ---------------------------------------------------------------------------

def explain_gradient_descent_variants():
    print("""
[CONCEPT] Gradient Descent Variants
=====================================

1. VANILLA SGD (Stochastic Gradient Descent)
   Update: θ ← θ - α * ∇L(θ; x_i, y_i)
   - One sample (or mini-batch) per update
   - Pros: simple, low memory
   - Cons: noisy updates, slow convergence, sensitive to learning rate
   - Use: when memory is very tight; some regularization from noise

2. SGD WITH MOMENTUM
   v ← β*v + ∇L(θ)
   θ ← θ - α*v
   - Accumulates gradient history; dampens oscillations
   - β=0.9 is standard; builds speed in consistent directions
   - Pros: faster convergence than vanilla SGD, escapes local minima better
   - Cons: one extra hyperparameter (β)

3. RMSprop (Root Mean Square Propagation)
   s ← β*s + (1-β)*∇L²
   θ ← θ - α * ∇L / (√s + ε)
   - Adaptive per-parameter learning rates; divides by RMS of recent gradients
   - Normalizes gradient magnitude → stable in non-stationary settings
   - Pros: good for RNNs; adaptive
   - Cons: no momentum by default; learning rate still needs tuning

4. ADAM (Adaptive Moment Estimation) — DEFAULT CHOICE
   m ← β₁*m + (1-β₁)*∇L          (1st moment: mean)
   v ← β₂*v + (1-β₂)*∇L²         (2nd moment: uncentered variance)
   m̂ = m / (1 - β₁ᵗ)              (bias correction)
   v̂ = v / (1 - β₂ᵗ)
   θ ← θ - α * m̂ / (√v̂ + ε)
   - Combines momentum + adaptive learning rates
   - β₁=0.9, β₂=0.999, ε=1e-8, α=1e-3 (defaults)
   - Pros: works out-of-the-box on most problems; fast convergence
   - Cons: may generalize worse than SGD+momentum on some vision tasks

5. AdamW (Adam with Decoupled Weight Decay)
   - Same as Adam but applies L2 weight decay separately from gradient update
   - Default optimizer for most modern transformers
   - Fixes a bug in Adam where weight decay behaves like L2 regularization

COMPARISON SUMMARY:
  Speed of convergence:  Adam ≈ AdamW > RMSprop > Momentum > SGD
  Final generalization:  SGD+Momentum sometimes beats Adam on vision tasks
  Recommendation:        Start with AdamW; switch to SGD+momentum if overfitting
""")


# ---------------------------------------------------------------------------
# TODO 3 — Transformer Architecture
# ---------------------------------------------------------------------------

def explain_transformer_architecture():
    print("""
[CONCEPT] Transformer Architecture (Attention is All You Need)
================================================================

OVERVIEW:
  Sequence-to-sequence model that replaces recurrence and convolution
  entirely with self-attention. Parallelizable; scales to massive datasets.

CORE COMPONENTS:

1. INPUT EMBEDDING + POSITIONAL ENCODING
   - Token IDs → dense vectors (dim d_model, typically 512–4096)
   - Add sinusoidal positional encoding: PE(pos, 2i) = sin(pos / 10000^(2i/d))
   - Encodes position since attention is order-agnostic

2. SCALED DOT-PRODUCT ATTENTION
   Attention(Q, K, V) = softmax(QK^T / √d_k) · V
   - Q (query), K (key), V (value) are linear projections of input
   - Score = how much each query attends to each key
   - Scale by 1/√d_k to prevent vanishing gradients in softmax
   - Complexity: O(n² · d) for sequence length n

3. MULTI-HEAD ATTENTION
   MultiHead(Q,K,V) = Concat(head_1,...,head_h) · W_O
   head_i = Attention(Q·W_Q_i, K·W_K_i, V·W_V_i)
   - h=8 or 16 heads; each attends to different subspaces
   - Captures diverse relationships (syntactic, semantic, long-range)
   - Richer representations than single-head

4. FEED-FORWARD NETWORK (FFN)
   FFN(x) = max(0, xW_1 + b_1)W_2 + b_2
   - Applied position-wise (same params across positions)
   - d_ff = 4 × d_model (inner dimension)
   - Stores factual knowledge in LLMs (interpretability research)

5. LAYER NORMALIZATION + RESIDUAL CONNECTIONS
   x = LayerNorm(x + SubLayer(x))
   - Residual: prevents vanishing gradient; enables deep networks
   - LayerNorm: stabilizes training; normalizes across feature dimension

6. ENCODER vs DECODER
   Encoder: bidirectional self-attention (sees all positions)
   Decoder: masked self-attention (can only attend to past) + cross-attention to encoder
   Decoder-only (GPT): masked self-attention only; autoregressive generation
   Encoder-only (BERT): bidirectional; used for classification/embeddings
   Encoder-decoder (T5, BART): full seq2seq; translation, summarization

7. MASKED SELF-ATTENTION (GPT-style)
   - Causal mask: upper triangle of attention matrix set to -∞ before softmax
   - Ensures position i can only attend to positions ≤ i
   - Enables autoregressive generation: predict next token one at a time

COMPLEXITY:
  - Attention: O(n² · d) time and space — bottleneck for long sequences
  - Approximations: Longformer (local), Linformer (low-rank), FlashAttention (IO-aware)

WHY TRANSFORMERS BEAT RNNS:
  - Parallel training (no sequential dependency)
  - Direct long-range dependencies (O(1) path length)
  - Better gradient flow through residuals + attention
""")


# ---------------------------------------------------------------------------
# Helpers for attention (pure Python)
# ---------------------------------------------------------------------------

def _mat_mul(A: list, B: list) -> list:
    """Matrix multiply A (m×k) × B (k×n) → m×n."""
    m, k = len(A), len(A[0])
    n = len(B[0])
    C = [[0.0] * n for _ in range(m)]
    for i in range(m):
        for j in range(n):
            for l in range(k):
                C[i][j] += A[i][l] * B[l][j]
    return C


def _transpose(A: list) -> list:
    """Transpose matrix A."""
    return [[A[j][i] for j in range(len(A))] for i in range(len(A[0]))]


def _softmax_row(row: list) -> list:
    """Stable softmax over a list."""
    m = max(row)
    exps = [math.exp(x - m) for x in row]
    s = sum(exps)
    return [e / s for e in exps]


# ---------------------------------------------------------------------------
# TODO 4 — Scaled Dot-Product Attention (pure Python)
# ---------------------------------------------------------------------------

def scaled_dot_product_attention(Q: list, K: list, V: list) -> list:
    """
    Scaled dot-product attention.
    Q: (seq_q × d_k), K: (seq_k × d_k), V: (seq_k × d_v)
    Returns: output (seq_q × d_v)
    """
    d_k = len(Q[0])
    scale = math.sqrt(d_k)

    # Scores = Q · K^T / sqrt(d_k)
    K_T = _transpose(K)
    scores = _mat_mul(Q, K_T)   # (seq_q × seq_k)

    # Scale and softmax row-wise
    attn_weights = []
    for row in scores:
        scaled = [x / scale for x in row]
        attn_weights.append(_softmax_row(scaled))

    # Output = attn_weights · V
    output = _mat_mul(attn_weights, V)
    return output


# ---------------------------------------------------------------------------
# TODO 5 — RLHF
# ---------------------------------------------------------------------------

def explain_rlhf():
    print("""
[CONCEPT] RLHF — Reinforcement Learning from Human Feedback
=============================================================

OVERVIEW:
  Technique to align LLM outputs with human preferences by training a
  reward model on human comparisons, then fine-tuning the LLM to maximize
  that reward using RL (PPO). Used in ChatGPT, Claude, Gemini.

PIPELINE (3 stages):

STAGE 1: SUPERVISED FINE-TUNING (SFT)
  - Start with a pretrained base LLM
  - Fine-tune on a curated dataset of (prompt, ideal_response) pairs
  - Teaches the model the desired output format and style
  - Result: SFT model — good at following instructions

STAGE 2: REWARD MODEL TRAINING
  - For each prompt, generate 4–9 responses from the SFT model
  - Human labelers rank responses from best to worst
  - Train a reward model (same architecture, linear head) to predict:
    R(prompt, response) = scalar score reflecting human preference
  - Training objective: Bradley-Terry model (ranking → pairwise classification)
    loss = -E[log(σ(R(preferred) - R(rejected)))]

STAGE 3: PPO FINE-TUNING
  - Use Proximal Policy Optimization (PPO) to fine-tune SFT model
  - Policy (LLM) generates responses; reward model scores them
  - PPO maximizes expected reward while staying close to SFT policy:
    Objective = E[R(response)] - β * KL(policy || SFT_policy)
  - KL penalty prevents reward hacking / excessive distribution shift

ALTERNATIVES:
  - DPO (Direct Preference Optimization): eliminates reward model;
    directly fine-tunes on preference pairs with a simplified loss
    Simpler, more stable, competitive with PPO
  - RLAIF: use AI (strong LLM) as the feedback source instead of humans

CHALLENGES:
  - Reward hacking: LLM finds ways to get high reward without being helpful
  - Human annotator noise and bias affect reward model quality
  - Expensive: human labeling at scale is costly
  - KL budget: too much fine-tuning → loses base model capabilities

IMPACT:
  - RLHF made ChatGPT significantly more helpful and less harmful than GPT-3
  - Reduces toxicity, improves instruction following, and increases honesty
""")


# ---------------------------------------------------------------------------
# TODO 6 — Backpropagation (pure Python, 2-layer network)
# ---------------------------------------------------------------------------

def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-max(-500, min(500, x))))


def _relu(x: float) -> float:
    return max(0.0, x)


def backprop_two_layer(X: list, y: list, W1: list, b1: list,
                       W2: list, b2: list) -> dict:
    """
    Forward + backward pass for a 2-layer network.
    Architecture:
      z1 = X·W1^T + b1   (linear)
      a1 = ReLU(z1)
      z2 = a1·W2^T + b2  (linear)
      a2 = sigmoid(z2)   (output)
    Loss: binary cross-entropy

    X:  (1 × 2)
    W1: (4 × 2), b1: (4,)
    W2: (1 × 4), b2: (1,)
    Returns dict with loss, dW1, db1, dW2, db2.
    """
    x = X[0]      # single sample: list of 2
    label = y[0]  # single label

    # -------- FORWARD --------
    # Layer 1: z1 = W1 · x + b1
    n_h = len(W1)
    z1 = [sum(W1[i][j] * x[j] for j in range(len(x))) + b1[i]
          for i in range(n_h)]
    a1 = [_relu(v) for v in z1]

    # Layer 2: z2 = W2 · a1 + b2
    z2 = [sum(W2[0][j] * a1[j] for j in range(n_h)) + b2[0]]
    a2 = _sigmoid(z2[0])

    # Loss: BCE = -[y*log(a2) + (1-y)*log(1-a2)]
    eps = 1e-10
    loss = -(label * math.log(a2 + eps) + (1 - label) * math.log(1 - a2 + eps))

    # -------- BACKWARD --------
    # dL/dz2 = a2 - y  (BCE + sigmoid combined derivative)
    dz2 = a2 - label

    # dL/dW2 (1 × n_h): dz2 * a1^T
    dW2 = [[dz2 * a1[j] for j in range(n_h)]]
    db2 = [dz2]

    # dL/da1 = W2^T · dz2  (n_h,)
    da1 = [W2[0][j] * dz2 for j in range(n_h)]

    # dL/dz1 = da1 * ReLU'(z1)
    dz1 = [da1[i] * (1.0 if z1[i] > 0 else 0.0) for i in range(n_h)]

    # dL/dW1 (n_h × 2)
    dW1 = [[dz1[i] * x[j] for j in range(len(x))] for i in range(n_h)]
    db1 = list(dz1)

    return {"loss": loss, "dW1": dW1, "db1": db1, "dW2": dW2, "db2": db2}


# ---------------------------------------------------------------------------
# TODO 7 — System Design: Search Ranking
# ---------------------------------------------------------------------------

def design_search_ranking():
    print("""
[DESIGN] Search Ranking System
================================
OVERVIEW:
  Rank 1B+ documents in < 200 ms to surface the most relevant results
  for a user query. Core to web search, e-commerce, enterprise search.

PHASES:

1. QUERY UNDERSTANDING
   - Spell correction, query expansion (synonyms, related terms)
   - Intent classification: navigational vs informational vs transactional
   - Entity recognition: detect product names, people, locations
   - Query embedding: dense vector for semantic retrieval

2. RETRIEVAL (Candidate Generation)
   - BM25 (sparse): inverted index; keyword matching; fast; ~100 ms for 1B docs
   - Dense retrieval: bi-encoder; ANN search (FAISS); semantic matching
   - Hybrid: RRF merge of BM25 + dense results → top-1000 candidates
   - Filtering: recency, language, content safety, user history

3. RANKING (Multi-Stage)
   L1 Ranker (fast):
     - LightGBM on hand-crafted features (BM25 score, CTR, doc freshness)
     - Re-ranks top-1000 → top-100; latency < 10 ms
   L2 Ranker (expensive):
     - Cross-encoder (BERT): full attention over (query, doc) pairs
     - Re-ranks top-100 → top-10; latency 50–150 ms
     - Features: semantic relevance, user intent match, personalization

4. FEATURES
   Query-doc: BM25, cosine similarity, query term coverage, entity match
   Document: PageRank, freshness, domain authority, click history
   User: query history, location, device, past CTR on domain
   Context: time of day, trending topics, A/B bucket

5. LEARNING TO RANK (LTR)
   - Training signal: click logs (impressions + clicks)
   - Label: position-discounted clicks (DCG proxy)
   - Algorithms: LambdaMART (pairwise), NDCG optimization (listwise)
   - Evaluation: NDCG@10, MRR

6. SERVING INFRASTRUCTURE
   - Query parsing service → retrieval cluster (FAISS sharded) → L1 ranker →
     L2 cross-encoder → post-processing → results API
   - SLA: p99 < 200 ms end-to-end

7. OFFLINE EVALUATION
   - Human relevance judgments (TREC-style): 0–3 graded relevance
   - NDCG@10, NDCG@5, MAP
   - A/B test on CTR, session satisfaction, long-click rate
""")


# ---------------------------------------------------------------------------
# TODO 8 — K-Means from Scratch
# ---------------------------------------------------------------------------

def kmeans(X: list, k: int, max_iter: int = 100) -> dict:
    """
    K-Means clustering (Lloyd's algorithm).
    X: list of d-dimensional points.
    Returns: {'centroids', 'labels', 'inertia'}.
    """
    random.seed(42)
    n = len(X)
    d = len(X[0])

    # Initialize centroids by random sampling (without replacement)
    indices = random.sample(range(n), k)
    centroids = [list(X[i]) for i in indices]

    labels = [0] * n

    def dist2(a, b):
        return sum((a[i] - b[i]) ** 2 for i in range(d))

    for _ in range(max_iter):
        # Assignment step
        new_labels = []
        for x in X:
            dists = [dist2(x, c) for c in centroids]
            new_labels.append(dists.index(min(dists)))

        # Check convergence
        if new_labels == labels:
            break
        labels = new_labels

        # Update step
        new_centroids = []
        for c in range(k):
            cluster_pts = [X[i] for i in range(n) if labels[i] == c]
            if cluster_pts:
                new_c = [sum(p[dim] for p in cluster_pts) / len(cluster_pts)
                         for dim in range(d)]
            else:
                new_c = list(centroids[c])   # keep old if empty
            new_centroids.append(new_c)
        centroids = new_centroids

    # Compute inertia (sum of squared distances to assigned centroid)
    inertia = sum(dist2(X[i], centroids[labels[i]]) for i in range(n))

    return {
        "centroids": [[round(v, 4) for v in c] for c in centroids],
        "labels": labels,
        "inertia": round(inertia, 4),
    }


# ---------------------------------------------------------------------------
# TODO 9 — Logistic Regression from Scratch
# ---------------------------------------------------------------------------

def logistic_regression(X: list, y: list,
                        lr: float = 0.1, epochs: int = 100) -> dict:
    """
    Logistic regression trained with mini-batch gradient descent.
    X: (n × d), y: (n,) binary labels
    """
    n = len(X)
    d = len(X[0])
    weights = [0.0] * d
    bias = 0.0
    losses = []
    eps = 1e-10

    for epoch in range(epochs):
        # Forward: compute predictions
        preds = []
        for x in X:
            z = sum(weights[j] * x[j] for j in range(d)) + bias
            preds.append(_sigmoid(z))

        # Loss: binary cross-entropy
        loss = -sum(
            y[i] * math.log(preds[i] + eps) + (1 - y[i]) * math.log(1 - preds[i] + eps)
            for i in range(n)
        ) / n
        losses.append(round(loss, 6))

        # Gradients
        errors = [preds[i] - y[i] for i in range(n)]
        dw = [sum(errors[i] * X[i][j] for i in range(n)) / n for j in range(d)]
        db = sum(errors) / n

        # Update
        weights = [weights[j] - lr * dw[j] for j in range(d)]
        bias -= lr * db

    return {"weights": [round(w, 6) for w in weights],
            "bias": round(bias, 6),
            "losses": losses}


# ---------------------------------------------------------------------------
# TODO 10 — Decision Tree / ID3
# ---------------------------------------------------------------------------

def decision_tree_id3_concept():
    print("""
[CONCEPT] Decision Tree — ID3 Algorithm
=========================================

GOAL:
  Learn a tree that splits data on the most informative features,
  recursively, until leaves are pure (or stopping criteria met).

KEY FORMULAS:

  Entropy(S) = -Σ p_c * log2(p_c)
    where p_c = fraction of class c in set S
    Range: 0 (pure) to log2(|classes|) (uniform)

  Information Gain(S, feature A):
    IG(S, A) = Entropy(S) - Σ_{v in values(A)} |S_v|/|S| * Entropy(S_v)
    Measures reduction in entropy after splitting on A.

ID3 ALGORITHM (recursive):
  1. If all examples same class → leaf node with that class
  2. If no features left → leaf node with majority class
  3. Select feature A* = argmax_A IG(S, A)
  4. Split S by A* values → child datasets S_1, ..., S_k
  5. Recurse on each child (exclude A* from feature set)

STOPPING CRITERIA:
  - Max depth reached
  - Min samples per node (< n → stop)
  - Information gain < threshold

LIMITATIONS:
  - Greedy: locally optimal splits; not globally optimal tree
  - Overfits with deep trees → prune or use max_depth, min_samples
  - Biased toward high-cardinality features → use Gain Ratio (C4.5) or Gini (CART)

GINI IMPURITY (CART alternative):
  Gini(S) = 1 - Σ p_c²
  Faster to compute; preferred in sklearn's DecisionTreeClassifier

PRACTICAL USAGE:
  sklearn.tree.DecisionTreeClassifier(max_depth=5, min_samples_leaf=10)
""")


def entropy(labels: list) -> float:
    """
    Shannon entropy of a label list.
    H = -Σ p_c * log2(p_c)
    """
    n = len(labels)
    if n == 0:
        return 0.0
    counts = Counter(labels)
    h = 0.0
    for count in counts.values():
        p = count / n
        if p > 0:
            h -= p * math.log2(p)
    return round(h, 6)


def information_gain(parent_labels: list, child_groups: list) -> float:
    """
    Information gain from splitting parent_labels into child_groups.
    IG = H(parent) - weighted_avg(H(child_i))
    child_groups: list of label lists (one per child node)
    """
    n = len(parent_labels)
    parent_h = entropy(parent_labels)
    weighted_child_h = sum(
        len(group) / n * entropy(group)
        for group in child_groups
        if len(group) > 0
    )
    return round(parent_h - weighted_child_h, 6)


# ---------------------------------------------------------------------------
# TODO 11 — Behavioral: Challenging ML Project
# ---------------------------------------------------------------------------

def behavioral_challenging_project():
    print("""
[BEHAVIORAL] Describe a Challenging ML Project (STAR Format)
==============================================================

SITUATION:
  I was tasked with building a real-time fraud detection model for a
  payments platform processing 20,000 transactions per minute.
  The existing rule-based system had a 40% false positive rate (blocking
  legitimate transactions) while still missing 15% of actual fraud.

TASK:
  Design and deploy an ML model that reduces false positives by 50%
  while maintaining fraud recall ≥ 90%, within a 50 ms latency budget.

ACTION:
  1. Data Analysis:
     - Audited 6 months of transaction logs; found severe class imbalance (0.1% fraud)
     - Identified data leakage: future refund features inadvertently included

  2. Feature Engineering:
     - Built velocity features in Flink: txn count per card in last 1/5/30 min
     - Graph features: device fingerprint clusters; shared IP risk scores
     - Avoided leaky features; implemented point-in-time correct joins

  3. Modeling:
     - Baseline: logistic regression (AUC 0.82)
     - Tried XGBoost → AUC 0.91
     - Added LSTM on transaction sequences → AUC 0.94
     - Ensemble (XGBoost + LSTM, weighted) → AUC 0.96

  4. Threshold Calibration:
     - Set per-merchant-category thresholds to meet the 90% recall constraint
     - Introduced step-up auth (OTP) for medium-risk zone → reduced hard declines

  5. Deployment:
     - Shadow deployed for 2 weeks; compared scores to rule-based system
     - Found 300 ms latency issue; optimized by ONNX export + TensorRT → 35 ms
     - Canary to 10% traffic; monitored for 72 h; then full rollout

RESULT:
  - False positive rate: 40% → 18% (55% reduction, exceeded 50% target)
  - Fraud recall: maintained at 92%
  - Estimated annual savings: ~$4M in prevented fraud
  - Latency: 35 ms p99 (within 50 ms budget)

KEY LEARNINGS:
  - Data leakage was the single most impactful issue to fix
  - Latency requirements must be established BEFORE model selection
  - Shadow deployment caught the latency issue before it affected users
  - Class imbalance: stratified sampling + cost-sensitive loss was critical
""")


# ---------------------------------------------------------------------------
# TODO 12 — RAG vs Fine-Tuning
# ---------------------------------------------------------------------------

def rag_vs_finetuning():
    print("""
[COMPARISON] RAG vs Fine-Tuning
=================================

RETRIEVAL-AUGMENTED GENERATION (RAG):
  Mechanism: Retrieve relevant documents at query time; inject into context.
  When to use:
    ✓ Knowledge changes frequently (news, product catalog, policies)
    ✓ Need to cite sources / attribute answers
    ✓ Limited labeled training data
    ✓ Need to handle queries about proprietary documents not in training data
    ✓ Quick to set up; no GPU training budget required
  Limitations:
    ✗ Retrieval quality bottleneck: garbage in, garbage out
    ✗ Context window limits: can't retrieve everything
    ✗ Higher latency per query (retrieval + generation)
    ✗ Model may ignore retrieved context (prompt engineering challenge)

FINE-TUNING:
  Mechanism: Update model weights on task-specific (input, output) pairs.
  When to use:
    ✓ Consistent style, tone, format required (e.g., always JSON)
    ✓ Task requires specialized reasoning patterns (code, math, medicine)
    ✓ Large labeled dataset available (>1K high-quality examples)
    ✓ Latency is critical (no retrieval step)
    ✓ Domain-specific vocabulary or task not well-covered by base model
  Limitations:
    ✗ Training cost (GPU hours + human labeling)
    ✗ Knowledge frozen at training time; can't update easily
    ✗ Catastrophic forgetting of base model capabilities
    ✗ Requires ML expertise to train correctly

COMBINING BOTH (Best Practice):
  - Fine-tune for style/format/reasoning → better instruction following
  - Add RAG for up-to-date factual knowledge
  - Example: Fine-tuned GPT + RAG over internal docs (GitHub Copilot model)

DECISION FRAMEWORK:
  "Do I need the model to KNOW something?" → RAG (external knowledge)
  "Do I need the model to BEHAVE differently?" → Fine-tuning (style/skill)
  "Do I need both?" → Fine-tune first, then add RAG

COST COMPARISON (rough):
  RAG:         $0.001/query (embedding) + LLM call
  Fine-tuning: $100–$10,000 (one-time) + ongoing inference cost
""")


# ---------------------------------------------------------------------------
# TODO 13 — LLM Scaling Laws
# ---------------------------------------------------------------------------

def llm_scaling_laws():
    print("""
[CONCEPT] LLM Scaling Laws (Chinchilla)
=========================================

NEURAL SCALING LAWS (Kaplan et al., 2020 — GPT-3 paper):
  Loss ∝ N^(-αN) + D^(-αD) + const
  - Loss scales as a power law with model size N (params) and data D (tokens)
  - Optimal strategy: scale N and D equally; compute budget C ≈ 6·N·D

CHINCHILLA (Hoffmann et al., 2022 — DeepMind):
  Key finding: GPT-3-era models were UNDERTRAINED (too large, too little data).
  Optimal training: for compute budget C,
    N_opt ≈ (C / 6)^0.5  (optimal model size)
    D_opt ≈ (C / 6)^0.5 × 20  (tokens = 20 × N)
  Rule of thumb: train on ~20 tokens per parameter

  Example: 70B model → train on 1.4T tokens (Llama-2-70B follows this)
  GPT-3 (175B params, 300B tokens) was underoptimal → should have used
  smaller model trained longer

CHINCHILLA OPTIMAL FRONTIER:
  Better to have a smaller, well-trained model than a larger, undertrained one:
  - Llama-1-7B (trained on 1T tokens) > GPT-3-13B on many benchmarks
  - Inference is cheaper with smaller model; train longer instead

EMERGENT ABILITIES:
  - Some capabilities appear suddenly at certain scales (not predicted by smooth laws)
  - Chain-of-thought reasoning: emerges ~100B params
  - Debate: may be measurement artifact vs true phase transition

INFERENCE SCALING (Test-Time Compute):
  Recent finding: instead of training larger models, sample more at inference
  - Generate K answers; use reward model or self-consistency to pick best
  - o1 / o3: extended "thinking" at inference time outperforms larger models
  - Future: scaling inference compute may be more efficient than scaling training

KEY TAKEAWAYS:
  - Use Chinchilla ratios: ~20 tokens/param for training
  - Inference efficiency matters: smaller + well-trained > larger + undertrained
  - Emergent abilities are real but unpredictable; test at each scale
""")


# ---------------------------------------------------------------------------
# TODO 14 — Production ML Gotchas
# ---------------------------------------------------------------------------

def production_ml_gotchas():
    print("""
[LESSONS] Top 10 Production ML System Gotchas
===============================================

1. TRAINING-SERVING SKEW
   Problem: Feature preprocessing in training ≠ serving → silent accuracy drop
   Fix: Single feature pipeline (feature store); identical preprocessing code;
   integration tests comparing train vs serve feature distributions

2. DATA LEAKAGE
   Problem: Future information used in training → unrealistically high offline metrics
   Fix: Point-in-time correct joins; strict temporal validation splits;
   feature review checklist before training

3. CLASS IMBALANCE IGNORED
   Problem: 99% accuracy on 99% negative-rate dataset → useless model
   Fix: Precision/recall/F1 metrics; stratified splits; class weights; oversampling

4. MODEL PERFORMANCE ≠ BUSINESS METRIC
   Problem: AUC improves but revenue/CTR/user satisfaction doesn't
   Fix: Define business KPI first; use it as primary metric; A/B test every change

5. CONCEPT DRIFT (Slow Death)
   Problem: World changes; model trained months ago silently degrades
   Fix: Monitor input distributions and model outputs; trigger retraining on drift;
   set up automated retraining pipelines

6. FEEDBACK LOOPS
   Problem: Model influences data it's trained on (e.g., recommendation → clicks)
   Fix: Hold-out groups; log counterfactuals; use causal inference methods

7. LATENCY NOT MEASURED UNTIL PRODUCTION
   Problem: Model works in notebook; fails SLA in production (batch vs online)
   Fix: Benchmark latency early (p50/p99 at production batch size, hardware);
   quantize / distill if needed BEFORE deployment commitment

8. SILENT FAILURES (Null Predictions, NaN Features)
   Problem: Model returns null / default value; users silently get bad experience
   Fix: Strict input validation; output distribution monitoring; non-null contracts;
   alert on sudden distribution shifts in model output

9. EXPERIMENT TRACKING NEGLECTED
   Problem: "Which model is in production?" "Why did we make this decision?"
   Fix: Log every experiment: data version, code commit, hyperparameters, metrics;
   use MLflow / W&B from day one

10. HUMAN OVERSIGHT REMOVED TOO SOON
    Problem: Automate model decisions before understanding failure modes
    Fix: Shadow mode → human review queue → gradual automation;
    always have a kill switch; monitor edge cases humans catch that model misses
""")


# ---------------------------------------------------------------------------
# TODO 15 — 30-Day Study Plan
# ---------------------------------------------------------------------------

def study_plan_30_days():
    print("""
[PLAN] 30-Day AI/ML Interview Study Plan
==========================================

WEEK 1: ML FUNDAMENTALS (Days 1–7)
  Day 1: Linear & Logistic Regression — derive gradient descent by hand
  Day 2: Decision Trees & Random Forests — entropy, Gini, bagging
  Day 3: SVMs — margin, kernel trick, dual formulation
  Day 4: Bias-Variance, regularization (L1/L2), cross-validation
  Day 5: Unsupervised — K-Means, PCA, autoencoders
  Day 6: Evaluation metrics — precision, recall, ROC-AUC, NDCG, calibration
  Day 7: Review + implement logistic regression and k-means from scratch

WEEK 2: DEEP LEARNING & NLP (Days 8–14)
  Day 8:  Neural networks — backpropagation, chain rule; implement 2-layer net
  Day 9:  Optimizers — SGD, Adam, AdamW; learning rate schedules
  Day 10: CNNs — convolutions, pooling, ResNet intuition
  Day 11: RNNs / LSTMs — vanishing gradient, gating mechanisms
  Day 12: Transformers — attention mechanism; implement attention from scratch
  Day 13: BERT vs GPT; pretraining objectives; fine-tuning
  Day 14: Embeddings — word2vec, sentence-BERT, retrieval with FAISS

WEEK 3: LLMs & MODERN AI (Days 15–21)
  Day 15: LLM pretraining — tokenization, next-token prediction, scaling laws
  Day 16: RLHF & alignment — reward model, PPO, DPO
  Day 17: RAG — retrieval pipeline, chunking, hybrid search, faithfulness
  Day 18: Fine-tuning — LoRA, QLoRA, prompt tuning; when to use each
  Day 19: LLM evaluation — BLEU, ROUGE, BERTScore, LLM-as-judge, benchmarks
  Day 20: AI safety — hallucination, bias, fairness, responsible AI
  Day 21: LLM inference optimization — KV cache, quantization, speculative decoding

WEEK 4: SYSTEM DESIGN & INTERVIEW PREP (Days 22–30)
  Day 22: ML system design framework — requirements, architecture, data flow, SLOs
  Day 23: Design: recommendation system (two-tower, ANN, ranker, feedback loop)
  Day 24: Design: fraud detection (feature store, streaming, ensemble, thresholds)
  Day 25: Design: LLM API service (multi-tenant, rate limiting, caching)
  Day 26: Design: training pipeline + feature store + A/B testing
  Day 27: Coding drills — implement attention, backprop, k-means, logistic reg
  Day 28: Behavioral prep — STAR stories for 5 challenging projects
  Day 29: Mock interview (friend/Pramp) — system design + coding + behavioral
  Day 30: Review weak areas; read recent papers (latest arxiv in your focus area)

DAILY ROUTINE (2–3 hours):
  30 min: Read concept (textbook / blog / paper)
  60 min: Implement from scratch (no sklearn for core algos)
  30 min: Practice explaining out loud (whiteboard / rubber duck)
  20 min: Flashcard review (Anki deck for ML formulas)

RESOURCES:
  Books:  "Pattern Recognition and ML" (Bishop), "Deep Learning" (Goodfellow)
  Courses: Fast.ai, Andrej Karpathy's Zero to Hero (YouTube)
  Papers:  Attention is All You Need, Chinchilla, RLHF (InstructGPT), LoRA
  Practice: Kaggle, LeetCode ML section, ML Design newsletter
""")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=== Solution 6.5: AI/ML Interview Preparation ===\n")

    explain_bias_variance()
    explain_gradient_descent_variants()
    explain_transformer_architecture()

    print("\n--- Scaled Dot-Product Attention ---")
    Q = [[1.0, 0.0], [0.0, 1.0]]
    K = [[1.0, 0.0], [0.0, 1.0]]
    V = [[1.0, 2.0], [3.0, 4.0]]
    output = scaled_dot_product_attention(Q, K, V)
    print("Q:", Q)
    print("K:", K)
    print("V:", V)
    print("Output:", [[round(x, 4) for x in row] for row in output])

    explain_rlhf()

    print("\n--- Backpropagation (2-layer network) ---")
    random.seed(42)
    X = [[0.5, 0.2]]
    y = [1]
    W1 = [[random.gauss(0, 0.1) for _ in range(2)] for _ in range(4)]
    b1 = [0.0] * 4
    W2 = [[random.gauss(0, 0.1) for _ in range(4)]]
    b2 = [0.0]
    result = backprop_two_layer(X, y, W1, b1, W2, b2)
    print(f"Loss: {result['loss']:.6f}")
    print(f"dW2: {[[round(v, 6) for v in row] for row in result['dW2']]}")

    design_search_ranking()

    print("\n--- K-Means Clustering ---")
    points = [[1.0, 1.0], [1.5, 1.5], [5.0, 5.0],
              [5.5, 5.5], [3.0, 1.0], [3.5, 1.5]]
    km = kmeans(points, k=2, max_iter=50)
    print(f"Centroids: {km['centroids']}")
    print(f"Labels:    {km['labels']}")
    print(f"Inertia:   {km['inertia']}")

    print("\n--- Logistic Regression ---")
    Xlr = [[1.0, 2.0], [2.0, 3.0], [0.5, 1.0], [3.0, 4.0],
           [-1.0, -2.0], [-2.0, -3.0], [-0.5, -1.0], [-3.0, -4.0]]
    ylr = [1, 1, 1, 1, 0, 0, 0, 0]
    lr_result = logistic_regression(Xlr, ylr, lr=0.1, epochs=200)
    print(f"Final weights: {lr_result['weights']}")
    print(f"Final bias:    {lr_result['bias']}")
    print(f"Initial loss:  {lr_result['losses'][0]:.6f}")
    print(f"Final loss:    {lr_result['losses'][-1]:.6f}")

    print("\n--- Decision Tree / ID3 ---")
    decision_tree_id3_concept()
    labels = [1, 1, 0, 0]
    print(f"Entropy({labels}): {entropy(labels)}")
    child_groups = [[1, 1], [0, 0]]
    print(f"Information gain (split into {child_groups}): "
          f"{information_gain(labels, child_groups)}")

    behavioral_challenging_project()
    rag_vs_finetuning()
    llm_scaling_laws()
    production_ml_gotchas()
    study_plan_30_days()


if __name__ == "__main__":
    main()
