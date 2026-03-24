# ============================================================
# Exercise 4.5 — Recommendation Systems
# ============================================================
# Topics:
#   • User-item matrix construction
#   • User-based and item-based collaborative filtering
#   • Matrix factorization (SVD via numpy)
#   • Implicit feedback concept
#   • Content-based filtering (TF-IDF + cosine)
#   • Hybrid recommender
#   • Cold start handling
#   • Evaluation: RMSE, precision@k, recall@k, MRR, nDCG
#   • Matrix factorization with SGD
#   • Negative sampling
#   • Production architecture
# ============================================================

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

np.random.seed(42)

# Synthetic user-item ratings matrix (5 users, 8 items)
# 0 = not rated
RATINGS = np.array([
    [4, 0, 0, 1, 0, 3, 0, 5],
    [5, 0, 4, 0, 0, 0, 2, 0],
    [0, 3, 0, 0, 4, 0, 0, 0],
    [3, 0, 0, 5, 0, 4, 0, 1],
    [0, 0, 5, 0, 3, 0, 4, 0],
], dtype=float)

N_USERS, N_ITEMS = RATINGS.shape

# Item content descriptions (for content-based filtering)
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
# TODO 1: User-Item Matrix Construction
# ---------------------------------------------------------------------------
# Given a list of (user_id, item_id, rating) tuples,
# construct and return a dense user-item matrix of shape (n_users, n_items).
# Unrated entries should be 0.

def build_user_item_matrix(interactions: list, n_users: int,
                            n_items: int) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 2: User-Based Collaborative Filtering
# ---------------------------------------------------------------------------
# Given a ratings matrix R and a target user index:
#   1. Compute cosine similarity between the target user and all other users
#      (use only rows where both users have rated at least one common item).
#   2. Predict rating for each unrated item as:
#      pred = Σ(sim_u * R[u, item]) / Σ|sim_u|  (over users who rated that item)
#   3. Return top-k item indices (sorted by predicted rating descending).

def user_based_cf(R: np.ndarray, user_idx: int, k: int = 3) -> list:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 3: Item-Based Collaborative Filtering
# ---------------------------------------------------------------------------
# Given a ratings matrix R and a target user index:
#   1. Compute cosine similarity between all pairs of items (columns).
#   2. For each unrated item j:
#      pred_j = Σ(sim(j, i) * R[user, i]) / Σ|sim(j, i)|  (over rated items i)
#   3. Return top-k item indices sorted by predicted rating.

def item_based_cf(R: np.ndarray, user_idx: int, k: int = 3) -> list:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 4: Matrix Factorization (SVD via numpy)
# ---------------------------------------------------------------------------
# Fill in missing ratings using SVD:
#   1. Fill missing (0) values with the item mean (from non-zero entries).
#   2. Apply numpy SVD: U, S, Vt = np.linalg.svd(R_filled, full_matrices=False).
#   3. Reconstruct using top `n_factors` singular values.
#   4. Return the reconstructed ratings matrix (full, shape: (n_users, n_items)).

def svd_matrix_factorization(R: np.ndarray, n_factors: int = 3) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 5: Implicit Feedback Concept
# ---------------------------------------------------------------------------
# Print the difference between explicit and implicit feedback.
# Return a dict with keys: 'explicit', 'implicit', 'handling'.

def implicit_feedback_concept() -> dict:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 6: Content-Based Filtering
# ---------------------------------------------------------------------------
# Given item descriptions (list of strings) and a query user profile
# (weighted average of item TF-IDF vectors for items they rated):
#   1. Fit TfidfVectorizer on all item descriptions.
#   2. Transform all items to TF-IDF vectors.
#   3. Build user profile = weighted mean of TF-IDF vectors for rated items
#      (use RATINGS[user_idx] as weights; skip 0-rated items).
#   4. Compute cosine similarity between user profile and all items.
#   5. Return top-k item indices (excluding already rated items).

def content_based_filtering(descriptions: list, R: np.ndarray,
                              user_idx: int, k: int = 3) -> list:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 7: Hybrid Recommender
# ---------------------------------------------------------------------------
# Combine content-based and user-based CF scores:
#   - Get content scores (cosine sim) for all items for user_idx.
#   - Get CF predicted ratings (user-based, all items).
#   - Normalize both to [0, 1].
#   - Combined score = alpha * CF_score + (1 - alpha) * content_score.
# Return top-k item indices by combined score (excluding already rated).

def hybrid_recommender(descriptions: list, R: np.ndarray,
                        user_idx: int, k: int = 3,
                        alpha: float = 0.5) -> list:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 8: Cold Start Handling
# ---------------------------------------------------------------------------
# For a new user with no history:
#   - Fall back to recommending the most popular items
#     (highest average rating across all users who rated them).
# Return top-k item indices by average rating.

def cold_start_popular(R: np.ndarray, k: int = 3) -> list:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 9: RMSE for Rating Prediction
# ---------------------------------------------------------------------------
# Given true ratings (non-zero entries of R) and predicted ratings matrix R_pred:
#   - Extract only the non-zero entries in R as ground truth.
#   - Compare with corresponding predictions from R_pred.
#   - Return RMSE.

def rmse_rating(R_true: np.ndarray, R_pred: np.ndarray) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 10: Precision@k and Recall@k
# ---------------------------------------------------------------------------
# For a single user:
#   - relevant_items: set of items with true rating >= threshold (default 3.5).
#   - recommended: top-k items from the recommender (list of item indices).
#   - precision@k = |relevant ∩ recommended| / k
#   - recall@k = |relevant ∩ recommended| / |relevant|
# Return (precision_at_k, recall_at_k).

def precision_recall_at_k(recommended: list, relevant_items: set,
                           k: int = 3) -> tuple:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 11: Mean Reciprocal Rank (MRR)
# ---------------------------------------------------------------------------
# Given a list of recommended item indices and the set of relevant items,
# find the rank of the first relevant item (1-indexed).
# MRR = 1 / rank_of_first_relevant (or 0 if none in list).
# Return MRR as a float.

def mean_reciprocal_rank(recommended: list, relevant_items: set) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 12: Normalized DCG (nDCG)
# ---------------------------------------------------------------------------
# Given ranked list of recommended items and true rating dict {item: rating}:
#   DCG = Σ (2^rel_i - 1) / log2(i+2)   for i=0,1,...,k-1
#   Ideal DCG = DCG for the optimal ordering.
#   nDCG = DCG / IDCG.
# Return nDCG as a float (0 to 1).

def ndcg_at_k(recommended: list, true_ratings: dict, k: int = 3) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 13: Matrix Factorization with SGD
# ---------------------------------------------------------------------------
# Learn user (P) and item (Q) factor matrices from ratings matrix R using SGD:
#   - Initialize P (n_users, n_factors) and Q (n_items, n_factors) randomly.
#   - For each observed rating R[u, i] != 0:
#       err = R[u, i] - P[u] @ Q[i]
#       P[u] += lr * (err * Q[i] - reg * P[u])
#       Q[i] += lr * (err * P[u] - reg * Q[i])
#   - Run for `epochs` passes. Return (P, Q).

def mf_sgd(R: np.ndarray, n_factors: int = 5, lr: float = 0.01,
            reg: float = 0.02, epochs: int = 100):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 14: Negative Sampling
# ---------------------------------------------------------------------------
# For implicit feedback (treat any observed interaction as positive):
#   - Positive samples: (user, item) pairs where R[u, i] > 0.
#   - Negative samples: randomly sample `n_neg` (user, item) pairs
#     where R[u, i] == 0 (unobserved).
# Return (positives, negatives) as lists of (user, item) tuples.

def negative_sampling(R: np.ndarray, n_neg: int = 5):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 15: Production Recommendation Architecture
# ---------------------------------------------------------------------------
# Print a description of a production recommendation system.
# Return a dict with keys: 'retrieval', 'ranking', 'serving', 'monitoring'.

def production_rec_architecture() -> dict:
    pass  # TODO: implement


def main():
    print("=== Exercise 4.5: Recommendation Systems ===\n")

    interactions = [(u, i, RATINGS[u, i])
                    for u in range(N_USERS) for i in range(N_ITEMS)
                    if RATINGS[u, i] > 0]
    R_built = build_user_item_matrix(interactions, N_USERS, N_ITEMS)
    print("TODO 1 — User-item matrix shape:", R_built.shape if R_built is not None else None)

    recs_ubcf = user_based_cf(RATINGS, user_idx=0, k=3)
    print("TODO 2 — User-based CF recs for user 0:", recs_ubcf)

    recs_ibcf = item_based_cf(RATINGS, user_idx=0, k=3)
    print("TODO 3 — Item-based CF recs for user 0:", recs_ibcf)

    R_pred = svd_matrix_factorization(RATINGS, n_factors=3)
    print("TODO 4 — SVD reconstruction shape:", R_pred.shape if R_pred is not None else None)

    impl = implicit_feedback_concept()
    print("TODO 5 — Implicit feedback keys:", list(impl.keys()) if impl else None)

    cb_recs = content_based_filtering(ITEM_DESCRIPTIONS, RATINGS, user_idx=2, k=3)
    print("TODO 6 — Content-based recs for user 2:", cb_recs)

    hybrid_recs = hybrid_recommender(ITEM_DESCRIPTIONS, RATINGS, user_idx=2, k=3)
    print("TODO 7 — Hybrid recs for user 2:", hybrid_recs)

    cold_recs = cold_start_popular(RATINGS, k=3)
    print("TODO 8 — Cold start popular items:", cold_recs)

    rmse = rmse_rating(RATINGS, R_pred) if R_pred is not None else None
    print("TODO 9 — RMSE:", round(rmse, 4) if rmse is not None else None)

    recs = user_based_cf(RATINGS, user_idx=0, k=3) if user_based_cf(RATINGS, 0, 3) else []
    relevant = {i for i in range(N_ITEMS) if RATINGS[0, i] >= 3.5}
    p_at_k, r_at_k = precision_recall_at_k(recs, relevant) if recs else (None, None)
    print("TODO 10 — Precision@3:", p_at_k, "| Recall@3:", r_at_k)

    mrr = mean_reciprocal_rank(recs, relevant) if recs else None
    print("TODO 11 — MRR:", mrr)

    true_r = {i: RATINGS[0, i] for i in range(N_ITEMS) if RATINGS[0, i] > 0}
    ndcg = ndcg_at_k(list(true_r.keys())[:3], true_r, k=3) if true_r else None
    print("TODO 12 — nDCG@3:", ndcg)

    P, Q = mf_sgd(RATINGS) if mf_sgd(RATINGS) else (None, None)
    print("TODO 13 — SGD MF P shape:", P.shape if P is not None else None)

    pos, neg = negative_sampling(RATINGS) if negative_sampling(RATINGS) else (None, None)
    print("TODO 14 — Positives:", len(pos) if pos else None,
          "| Negatives:", len(neg) if neg else None)

    arch = production_rec_architecture()
    print("TODO 15 — Architecture keys:", list(arch.keys()) if arch else None)


if __name__ == "__main__":
    main()
