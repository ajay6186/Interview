# ============================================================
# Solution 4.5 — Recommendation Systems
# ============================================================

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

np.random.seed(42)

RATINGS = np.array([
    [4, 0, 0, 1, 0, 3, 0, 5],
    [5, 0, 4, 0, 0, 0, 2, 0],
    [0, 3, 0, 0, 4, 0, 0, 0],
    [3, 0, 0, 5, 0, 4, 0, 1],
    [0, 0, 5, 0, 3, 0, 4, 0],
], dtype=float)

N_USERS, N_ITEMS = RATINGS.shape

ITEM_DESCRIPTIONS = [
    "action thriller movie blockbuster",
    "romantic comedy love story",
    "action hero superhero blockbuster",
    "thriller mystery detective crime",
    "romance drama love relationship",
    "action adventure thriller movie",
    "comedy funny humor laugh",
    "thriller suspense mystery crime",
]


# ---------------------------------------------------------------------------
# Solution 1: User-Item Matrix Construction
# ---------------------------------------------------------------------------

def build_user_item_matrix(interactions: list, n_users: int,
                            n_items: int) -> np.ndarray:
    R = np.zeros((n_users, n_items))
    for user, item, rating in interactions:
        R[int(user), int(item)] = rating
    return R


# ---------------------------------------------------------------------------
# Solution 2: User-Based CF
# ---------------------------------------------------------------------------

def user_based_cf(R: np.ndarray, user_idx: int, k: int = 3) -> list:
    n_users, n_items = R.shape
    target = R[user_idx]

    # Cosine similarity with all other users
    similarities = cosine_similarity(R)[user_idx]  # (n_users,)
    similarities[user_idx] = 0  # exclude self

    # Predict for each unrated item
    scores = {}
    for item in range(n_items):
        if target[item] != 0:
            continue  # already rated
        # Users who rated this item
        raters = R[:, item] != 0
        if not np.any(raters):
            continue
        sim_scores = similarities[raters]
        ratings = R[raters, item]
        denom = np.sum(np.abs(sim_scores))
        if denom > 0:
            scores[item] = float(np.dot(sim_scores, ratings) / denom)

    return sorted(scores, key=scores.get, reverse=True)[:k]


# ---------------------------------------------------------------------------
# Solution 3: Item-Based CF
# ---------------------------------------------------------------------------

def item_based_cf(R: np.ndarray, user_idx: int, k: int = 3) -> list:
    n_users, n_items = R.shape
    # Item-item cosine similarity using transposed matrix
    item_sim = cosine_similarity(R.T)  # (n_items, n_items)

    target = R[user_idx]
    rated_items = np.where(target != 0)[0]

    scores = {}
    for item in range(n_items):
        if target[item] != 0:
            continue
        sim_sum = 0.0
        weighted_sum = 0.0
        for rated_i in rated_items:
            sim = item_sim[item, rated_i]
            weighted_sum += sim * target[rated_i]
            sim_sum += abs(sim)
        if sim_sum > 0:
            scores[item] = weighted_sum / sim_sum

    return sorted(scores, key=scores.get, reverse=True)[:k]


# ---------------------------------------------------------------------------
# Solution 4: SVD Matrix Factorization
# ---------------------------------------------------------------------------

def svd_matrix_factorization(R: np.ndarray, n_factors: int = 3) -> np.ndarray:
    # Fill zeros with item means
    R_filled = R.copy()
    for j in range(R.shape[1]):
        col = R[:, j]
        nonzero_mean = col[col != 0].mean() if np.any(col != 0) else 0.0
        R_filled[col == 0, j] = nonzero_mean

    U, S, Vt = np.linalg.svd(R_filled, full_matrices=False)
    # Keep top n_factors
    U_k = U[:, :n_factors]
    S_k = np.diag(S[:n_factors])
    Vt_k = Vt[:n_factors, :]
    R_reconstructed = U_k @ S_k @ Vt_k
    return R_reconstructed


# ---------------------------------------------------------------------------
# Solution 5: Implicit Feedback Concept
# ---------------------------------------------------------------------------

def implicit_feedback_concept() -> dict:
    concept = {
        'explicit': (
            'User directly rates items (1-5 stars, thumbs up/down). '
            'High quality signal, but sparse — most users rate very few items.'
        ),
        'implicit': (
            'Inferred from behavior: clicks, views, purchases, time spent, searches. '
            'Abundant but noisy — a view does not mean the user liked the item.'
        ),
        'handling': (
            'Treat observed interactions as positive (confidence=1). '
            'Unobserved = unknown (not necessarily negative). '
            'Algorithms: ALS with confidence weights (Hu et al. 2008), BPR (pairwise ranking). '
            'Confidence: c_ui = 1 + alpha * r_ui (linear) or log(1 + r_ui/eps).'
        ),
    }
    print("\nImplicit vs Explicit Feedback:")
    for k, v in concept.items():
        print(f"  {k}: {v}\n")
    return concept


# ---------------------------------------------------------------------------
# Solution 6: Content-Based Filtering
# ---------------------------------------------------------------------------

def content_based_filtering(descriptions: list, R: np.ndarray,
                              user_idx: int, k: int = 3) -> list:
    tfidf = TfidfVectorizer()
    item_vectors = tfidf.fit_transform(descriptions).toarray()  # (n_items, vocab)

    # Build user profile: weighted average of rated-item vectors
    user_ratings = R[user_idx]
    rated_mask = user_ratings != 0
    if not np.any(rated_mask):
        return list(range(k))

    weights = user_ratings[rated_mask]
    user_profile = (item_vectors[rated_mask].T @ weights) / weights.sum()
    user_profile = user_profile.reshape(1, -1)

    sims = cosine_similarity(user_profile, item_vectors)[0]

    # Exclude already rated items
    unrated = np.where(user_ratings == 0)[0]
    unrated_sims = [(i, sims[i]) for i in unrated]
    unrated_sims.sort(key=lambda x: x[1], reverse=True)
    return [i for i, _ in unrated_sims[:k]]


# ---------------------------------------------------------------------------
# Solution 7: Hybrid Recommender
# ---------------------------------------------------------------------------

def hybrid_recommender(descriptions: list, R: np.ndarray,
                        user_idx: int, k: int = 3,
                        alpha: float = 0.5) -> list:
    n_items = R.shape[1]
    user_ratings = R[user_idx]
    unrated = np.where(user_ratings == 0)[0]

    # Content-based scores
    tfidf = TfidfVectorizer()
    item_vectors = tfidf.fit_transform(descriptions).toarray()
    rated_mask = user_ratings != 0
    if np.any(rated_mask):
        weights = user_ratings[rated_mask]
        user_profile = (item_vectors[rated_mask].T @ weights) / weights.sum()
        cb_sims = cosine_similarity(user_profile.reshape(1, -1), item_vectors)[0]
    else:
        cb_sims = np.zeros(n_items)

    # CF scores (predicted ratings)
    cf_scores = np.zeros(n_items)
    item_sim = cosine_similarity(R.T)
    rated_items = np.where(rated_mask)[0]
    for item in unrated:
        sim_sum = 0.0
        weighted_sum = 0.0
        for ri in rated_items:
            sim_sum += abs(item_sim[item, ri])
            weighted_sum += item_sim[item, ri] * user_ratings[ri]
        cf_scores[item] = weighted_sum / sim_sum if sim_sum > 0 else 0.0

    # Normalize to [0, 1]
    def _norm(arr):
        mn, mx = arr.min(), arr.max()
        return (arr - mn) / (mx - mn + 1e-10)

    cb_norm = _norm(cb_sims)
    cf_norm = _norm(cf_scores)

    combined = alpha * cf_norm + (1 - alpha) * cb_norm
    unrated_combined = [(i, combined[i]) for i in unrated]
    unrated_combined.sort(key=lambda x: x[1], reverse=True)
    return [i for i, _ in unrated_combined[:k]]


# ---------------------------------------------------------------------------
# Solution 8: Cold Start (Popular Items)
# ---------------------------------------------------------------------------

def cold_start_popular(R: np.ndarray, k: int = 3) -> list:
    avg_ratings = []
    for j in range(R.shape[1]):
        col = R[:, j]
        nonzero = col[col != 0]
        avg = float(nonzero.mean()) if len(nonzero) > 0 else 0.0
        avg_ratings.append((j, avg))
    avg_ratings.sort(key=lambda x: x[1], reverse=True)
    return [i for i, _ in avg_ratings[:k]]


# ---------------------------------------------------------------------------
# Solution 9: RMSE
# ---------------------------------------------------------------------------

def rmse_rating(R_true: np.ndarray, R_pred: np.ndarray) -> float:
    mask = R_true != 0
    true_vals = R_true[mask]
    pred_vals = R_pred[mask]
    return float(np.sqrt(np.mean((true_vals - pred_vals) ** 2)))


# ---------------------------------------------------------------------------
# Solution 10: Precision@k and Recall@k
# ---------------------------------------------------------------------------

def precision_recall_at_k(recommended: list, relevant_items: set,
                           k: int = 3) -> tuple:
    top_k = recommended[:k]
    n_relevant_recommended = len(set(top_k) & relevant_items)
    precision = n_relevant_recommended / k
    recall = n_relevant_recommended / len(relevant_items) if relevant_items else 0.0
    return round(precision, 4), round(recall, 4)


# ---------------------------------------------------------------------------
# Solution 11: MRR
# ---------------------------------------------------------------------------

def mean_reciprocal_rank(recommended: list, relevant_items: set) -> float:
    for rank, item in enumerate(recommended, start=1):
        if item in relevant_items:
            return round(1.0 / rank, 6)
    return 0.0


# ---------------------------------------------------------------------------
# Solution 12: nDCG
# ---------------------------------------------------------------------------

def ndcg_at_k(recommended: list, true_ratings: dict, k: int = 3) -> float:
    def dcg(items):
        return sum(
            (2 ** true_ratings.get(item, 0) - 1) / np.log2(i + 2)
            for i, item in enumerate(items[:k])
        )

    actual_dcg = dcg(recommended)
    # Ideal: sort by true rating descending
    ideal_items = sorted(true_ratings.keys(), key=lambda x: true_ratings[x], reverse=True)
    ideal_dcg = dcg(ideal_items)
    return round(float(actual_dcg / ideal_dcg) if ideal_dcg > 0 else 0.0, 6)


# ---------------------------------------------------------------------------
# Solution 13: Matrix Factorization with SGD
# ---------------------------------------------------------------------------

def mf_sgd(R: np.ndarray, n_factors: int = 5, lr: float = 0.01,
            reg: float = 0.02, epochs: int = 100):
    n_users, n_items = R.shape
    rng = np.random.default_rng(42)
    P = rng.standard_normal((n_users, n_factors)) * 0.1   # user factors
    Q = rng.standard_normal((n_items, n_factors)) * 0.1   # item factors

    for _ in range(epochs):
        for u in range(n_users):
            for i in range(n_items):
                if R[u, i] == 0:
                    continue
                err = R[u, i] - P[u] @ Q[i]
                P_old = P[u].copy()
                P[u] += lr * (err * Q[i] - reg * P[u])
                Q[i] += lr * (err * P_old - reg * Q[i])
    return P, Q


# ---------------------------------------------------------------------------
# Solution 14: Negative Sampling
# ---------------------------------------------------------------------------

def negative_sampling(R: np.ndarray, n_neg: int = 5):
    n_users, n_items = R.shape
    positives = [(u, i) for u in range(n_users)
                  for i in range(n_items) if R[u, i] > 0]

    unobserved = [(u, i) for u in range(n_users)
                   for i in range(n_items) if R[u, i] == 0]
    rng = np.random.default_rng(42)
    n_sample = min(n_neg * len(positives), len(unobserved))
    idx = rng.choice(len(unobserved), size=n_sample, replace=False)
    negatives = [unobserved[i] for i in idx]
    return positives, negatives


# ---------------------------------------------------------------------------
# Solution 15: Production Architecture
# ---------------------------------------------------------------------------

def production_rec_architecture() -> dict:
    arch = {
        'retrieval': (
            'Candidate generation: narrow from millions of items to hundreds. '
            'Methods: approximate nearest neighbor (ANN) on embedding vectors, '
            'collaborative filtering pre-filtering, popularity-based fallback. '
            'Tools: FAISS, ScaNN, Annoy.'
        ),
        'ranking': (
            'Score and re-rank the candidate set (hundreds → top-k). '
            'Model: deep neural network with user + item features. '
            'Features: user history, item metadata, context (time, device). '
            'Objective: optimize CTR, purchase rate, or engagement time.'
        ),
        'serving': (
            'Low-latency inference (<50ms) via model serving (TF Serving, TorchServe). '
            'Pre-compute embeddings offline; retrieve + rank online. '
            'Caching: store top-k for frequent users. '
            'A/B testing: run multiple algorithms in parallel, measure KPIs.'
        ),
        'monitoring': (
            'Track CTR, conversion rate, diversity, serendipity. '
            'Detect popularity bias and filter bubbles. '
            'Monitor embedding drift and retrain triggers. '
            'Feedback loop: incorporate real-time user interactions.'
        ),
    }
    print("\nProduction Recommendation Architecture:")
    for stage, desc in arch.items():
        print(f"\n  [{stage.upper()}]\n  {desc}")
    return arch


def main():
    print("=== Solution 4.5: Recommendation Systems ===\n")

    interactions = [(u, i, RATINGS[u, i])
                    for u in range(N_USERS) for i in range(N_ITEMS)
                    if RATINGS[u, i] > 0]
    R_built = build_user_item_matrix(interactions, N_USERS, N_ITEMS)
    print("Result 1 — User-item matrix shape:", R_built.shape)
    print("          Matches original:", np.allclose(R_built, RATINGS))

    recs_ubcf = user_based_cf(RATINGS, user_idx=0, k=3)
    print("Result 2 — User-based CF recs for user 0:", recs_ubcf)

    recs_ibcf = item_based_cf(RATINGS, user_idx=0, k=3)
    print("Result 3 — Item-based CF recs for user 0:", recs_ibcf)

    R_pred = svd_matrix_factorization(RATINGS, n_factors=3)
    print("Result 4 — SVD reconstruction (user 0):", np.round(R_pred[0], 2))

    impl = implicit_feedback_concept()
    print("Result 5 — Keys:", list(impl.keys()))

    cb_recs = content_based_filtering(ITEM_DESCRIPTIONS, RATINGS, user_idx=2, k=3)
    print("Result 6 — Content-based recs for user 2:", cb_recs)

    hybrid_recs = hybrid_recommender(ITEM_DESCRIPTIONS, RATINGS, user_idx=2, k=3)
    print("Result 7 — Hybrid recs for user 2:", hybrid_recs)

    cold_recs = cold_start_popular(RATINGS, k=3)
    print("Result 8 — Cold start popular items:", cold_recs)

    rmse = rmse_rating(RATINGS, R_pred)
    print("Result 9 — RMSE:", round(rmse, 4))

    recs = user_based_cf(RATINGS, user_idx=0, k=3)
    relevant = {i for i in range(N_ITEMS) if RATINGS[0, i] >= 3.5}
    p_at_k, r_at_k = precision_recall_at_k(recs, relevant, k=3)
    print("Result 10 — Precision@3:", p_at_k, "| Recall@3:", r_at_k,
          "| Relevant items:", relevant)

    mrr = mean_reciprocal_rank(recs, relevant)
    print("Result 11 — MRR:", mrr)

    true_r = {i: RATINGS[0, i] for i in range(N_ITEMS) if RATINGS[0, i] > 0}
    top_recs = sorted(true_r.keys(), key=lambda x: true_r[x], reverse=True)[:3]
    ndcg = ndcg_at_k(top_recs, true_r, k=3)
    print("Result 12 — nDCG@3 (ideal order):", ndcg)

    P, Q = mf_sgd(RATINGS, n_factors=5, epochs=200)
    R_mf = P @ Q.T
    rmse_mf = rmse_rating(RATINGS, R_mf)
    print("Result 13 — SGD MF RMSE:", round(rmse_mf, 4),
          "| P shape:", P.shape)

    pos, neg = negative_sampling(RATINGS, n_neg=5)
    print("Result 14 — Positives:", len(pos), "| Negatives:", len(neg))

    arch = production_rec_architecture()
    print("Result 15 — Architecture stages:", list(arch.keys()))


if __name__ == "__main__":
    main()
