# ============================================================
# Examples 4.5 — Recommendation Systems (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
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

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Build a user-item ratings matrix"""
    interactions = [(u, i, RATINGS[u, i])
                    for u in range(N_USERS) for i in range(N_ITEMS)
                    if RATINGS[u, i] > 0]
    R = np.zeros((N_USERS, N_ITEMS))
    for user, item, rating in interactions:
        R[int(user), int(item)] = rating
    print("Ex01 — matrix shape:", R.shape, "| matches original:", np.allclose(R, RATINGS))

def ex02():
    """Compute cosine similarity between two users"""
    u1 = RATINGS[0]
    u2 = RATINGS[1]
    sim = np.dot(u1, u2) / (np.linalg.norm(u1) * np.linalg.norm(u2) + 1e-10)
    print("Ex02 — cosine sim user0 vs user1:", round(float(sim), 4))

def ex03():
    """User-user similarity matrix"""
    sim_matrix = cosine_similarity(RATINGS)
    print("Ex03 — user-user sim matrix shape:", sim_matrix.shape)
    print("       sim[0]:", np.round(sim_matrix[0], 4))

def ex04():
    """Item-item similarity matrix"""
    sim_matrix = cosine_similarity(RATINGS.T)
    print("Ex04 — item-item sim matrix shape:", sim_matrix.shape)
    print("       sim[0] (most similar to item 0):",
          np.argsort(sim_matrix[0])[::-1][:3].tolist())

def ex05():
    """Find items rated by a user"""
    user_idx = 0
    rated = np.where(RATINGS[user_idx] > 0)[0].tolist()
    unrated = np.where(RATINGS[user_idx] == 0)[0].tolist()
    print("Ex05 — user 0 rated:", rated, "| unrated:", unrated)

def ex06():
    """Popular items: average rating across users"""
    avg_ratings = []
    for j in range(N_ITEMS):
        col = RATINGS[:, j]
        nonzero = col[col != 0]
        avg = float(nonzero.mean()) if len(nonzero) > 0 else 0.0
        avg_ratings.append((j, round(avg, 4)))
    print("Ex06 — item avg ratings:", sorted(avg_ratings, key=lambda x: -x[1])[:3])

def ex07():
    """Cold start: recommend top popular items to new user"""
    avg_ratings = [(j, float(RATINGS[:, j][RATINGS[:, j] != 0].mean())
                    if np.any(RATINGS[:, j] != 0) else 0.0)
                   for j in range(N_ITEMS)]
    top3 = [i for i, _ in sorted(avg_ratings, key=lambda x: -x[1])[:3]]
    print("Ex07 — cold start top-3 items:", top3)

def ex08():
    """Content-based: TF-IDF item vectors"""
    tfidf = TfidfVectorizer()
    item_vecs = tfidf.fit_transform(ITEM_DESCRIPTIONS).toarray()
    print("Ex08 — TF-IDF shape:", item_vecs.shape)
    print("       vocab size:", len(tfidf.vocabulary_))

def ex09():
    """Content-based similarity between items"""
    tfidf = TfidfVectorizer()
    vecs = tfidf.fit_transform(ITEM_DESCRIPTIONS).toarray()
    sim = cosine_similarity(vecs)
    most_similar_to_0 = np.argsort(sim[0])[::-1][1:4].tolist()
    print("Ex09 — items most similar to item 0:", most_similar_to_0)

def ex10():
    """RMSE between true and predicted ratings"""
    R_pred = RATINGS + np.random.RandomState(0).normal(0, 0.5, RATINGS.shape)
    mask = RATINGS != 0
    rmse = float(np.sqrt(np.mean((RATINGS[mask] - R_pred[mask]) ** 2)))
    print("Ex10 — RMSE:", round(rmse, 4))

def ex11():
    """Precision@k: fraction of recommendations that are relevant"""
    recommended = [5, 0, 3, 7, 2]
    relevant = {0, 3, 5}
    k = 3
    top_k = recommended[:k]
    precision = len(set(top_k) & relevant) / k
    print("Ex11 — Precision@3:", round(precision, 4))

def ex12():
    """Recall@k: fraction of relevant items that are recommended"""
    recommended = [5, 0, 3, 7, 2]
    relevant = {0, 3, 5, 7}
    k = 3
    top_k = recommended[:k]
    recall = len(set(top_k) & relevant) / len(relevant)
    print("Ex12 — Recall@3:", round(recall, 4))

def ex13():
    """Mean Reciprocal Rank (MRR)"""
    recommended = [7, 2, 0, 3, 5]
    relevant = {0, 5}
    for rank, item in enumerate(recommended, start=1):
        if item in relevant:
            print("Ex13 — MRR:", round(1.0 / rank, 4), "(first relevant at rank", rank, ")")
            break

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """User-based CF: predict rating for unrated items"""
    user_idx = 0
    sims = cosine_similarity(RATINGS)[user_idx]
    sims[user_idx] = 0
    scores = {}
    for item in range(N_ITEMS):
        if RATINGS[user_idx, item] != 0:
            continue
        raters = RATINGS[:, item] != 0
        if not np.any(raters):
            continue
        denom = np.sum(np.abs(sims[raters]))
        if denom > 0:
            scores[item] = float(np.dot(sims[raters], RATINGS[raters, item]) / denom)
    recs = sorted(scores, key=scores.get, reverse=True)[:3]
    print("Ex14 — user-based CF recs for user 0:", recs)

def ex15():
    """Item-based CF: use item-item similarity"""
    user_idx = 0
    item_sim = cosine_similarity(RATINGS.T)
    target = RATINGS[user_idx]
    rated_items = np.where(target != 0)[0]
    scores = {}
    for item in range(N_ITEMS):
        if target[item] != 0:
            continue
        w_sum = sum(item_sim[item, ri] * target[ri] for ri in rated_items)
        s_sum = sum(abs(item_sim[item, ri]) for ri in rated_items)
        if s_sum > 0:
            scores[item] = w_sum / s_sum
    recs = sorted(scores, key=scores.get, reverse=True)[:3]
    print("Ex15 — item-based CF recs for user 0:", recs)

def ex16():
    """SVD matrix factorization for rating prediction"""
    R_filled = RATINGS.copy()
    for j in range(N_ITEMS):
        col = R_filled[:, j]
        nz = col[col != 0]
        R_filled[col == 0, j] = nz.mean() if len(nz) > 0 else 0.0
    U, S, Vt = np.linalg.svd(R_filled, full_matrices=False)
    k = 3
    R_pred = U[:, :k] @ np.diag(S[:k]) @ Vt[:k, :]
    print("Ex16 — SVD reconstruction user 0:", np.round(R_pred[0], 2))

def ex17():
    """Matrix Factorization with SGD"""
    rng = np.random.default_rng(42)
    k, lr, reg = 3, 0.01, 0.02
    P = rng.standard_normal((N_USERS, k)) * 0.1
    Q = rng.standard_normal((N_ITEMS, k)) * 0.1
    for _ in range(100):
        for u in range(N_USERS):
            for i in range(N_ITEMS):
                if RATINGS[u, i] == 0:
                    continue
                err = RATINGS[u, i] - P[u] @ Q[i]
                P_u = P[u].copy()
                P[u] += lr * (err * Q[i] - reg * P[u])
                Q[i] += lr * (err * P_u - reg * Q[i])
    R_mf = P @ Q.T
    mask = RATINGS != 0
    rmse = float(np.sqrt(np.mean((RATINGS[mask] - R_mf[mask]) ** 2)))
    print("Ex17 — SGD MF RMSE:", round(rmse, 4))

def ex18():
    """Content-based user profile from rated items"""
    user_idx = 2
    tfidf = TfidfVectorizer()
    item_vecs = tfidf.fit_transform(ITEM_DESCRIPTIONS).toarray()
    user_ratings = RATINGS[user_idx]
    rated_mask = user_ratings != 0
    weights = user_ratings[rated_mask]
    profile = (item_vecs[rated_mask].T @ weights) / weights.sum()
    sims = cosine_similarity(profile.reshape(1, -1), item_vecs)[0]
    unrated = np.where(user_ratings == 0)[0]
    recs = sorted(unrated, key=lambda i: sims[i], reverse=True)[:3]
    print("Ex18 — content-based recs for user 2:", recs)

def ex19():
    """Hybrid recommender: blend CF + content-based scores"""
    user_idx = 2
    alpha = 0.5
    user_ratings = RATINGS[user_idx]
    unrated = np.where(user_ratings == 0)[0]
    # CF scores
    item_sim = cosine_similarity(RATINGS.T)
    rated_items = np.where(user_ratings != 0)[0]
    cf_scores = np.zeros(N_ITEMS)
    for item in unrated:
        w = sum(abs(item_sim[item, ri]) for ri in rated_items)
        cf_scores[item] = sum(item_sim[item, ri] * user_ratings[ri] for ri in rated_items) / (w + 1e-10)
    # CB scores
    tfidf = TfidfVectorizer()
    vecs = tfidf.fit_transform(ITEM_DESCRIPTIONS).toarray()
    weights = user_ratings[rated_items]
    profile = (vecs[rated_items].T @ weights) / weights.sum()
    cb_scores = cosine_similarity(profile.reshape(1, -1), vecs)[0]
    def norm(arr):
        mn, mx = arr.min(), arr.max()
        return (arr - mn) / (mx - mn + 1e-10)
    combined = alpha * norm(cf_scores) + (1 - alpha) * norm(cb_scores)
    recs = sorted(unrated, key=lambda i: combined[i], reverse=True)[:3]
    print("Ex19 — hybrid recs for user 2:", recs)

def ex20():
    """nDCG@k: normalised Discounted Cumulative Gain"""
    true_ratings = {0: 4, 3: 1, 5: 3, 7: 5}
    recommended  = [7, 5, 0, 3, 2]
    k = 3
    def dcg(items):
        return sum((2**true_ratings.get(i, 0) - 1) / np.log2(r + 2)
                   for r, i in enumerate(items[:k]))
    ideal = sorted(true_ratings, key=lambda x: true_ratings[x], reverse=True)
    ndcg = dcg(recommended) / (dcg(ideal) + 1e-10)
    print("Ex20 — nDCG@3:", round(float(ndcg), 4))

def ex21():
    """Negative sampling: generate positive and negative pairs"""
    positives = [(u, i) for u in range(N_USERS) for i in range(N_ITEMS) if RATINGS[u, i] > 0]
    unobserved = [(u, i) for u in range(N_USERS) for i in range(N_ITEMS) if RATINGS[u, i] == 0]
    rng = np.random.default_rng(42)
    n_neg = min(5 * len(positives), len(unobserved))
    idx = rng.choice(len(unobserved), size=n_neg, replace=False)
    negatives = [unobserved[i] for i in idx]
    print("Ex21 — positives:", len(positives), "| negatives:", len(negatives))

def ex22():
    """Sparsity of user-item matrix"""
    n_obs = np.count_nonzero(RATINGS)
    n_total = RATINGS.size
    sparsity = 1 - n_obs / n_total
    print("Ex22 — sparsity:", round(sparsity, 4),
          "| observed entries:", n_obs, "/", n_total)

def ex23():
    """User mean-centered ratings"""
    R_centered = RATINGS.copy()
    for u in range(N_USERS):
        row = R_centered[u]
        nz = row[row != 0]
        if len(nz) > 0:
            R_centered[u, row != 0] -= nz.mean()
    print("Ex23 — centered row 0 (non-zero):",
          np.round(R_centered[0][RATINGS[0] != 0], 4).tolist())

def ex24():
    """Coverage: fraction of items that can be recommended"""
    recs_per_user = []
    for u in range(N_USERS):
        sims = cosine_similarity(RATINGS)[u]
        sims[u] = 0
        unrated = np.where(RATINGS[u] == 0)[0]
        recs_per_user.extend(unrated[:3])
    coverage = len(set(recs_per_user)) / N_ITEMS
    print("Ex24 — catalog coverage:", round(coverage, 4))

def ex25():
    """Serendipity proxy: recommend less-popular items"""
    item_popularity = np.count_nonzero(RATINGS, axis=0)
    user_idx = 0
    unrated = np.where(RATINGS[user_idx] == 0)[0]
    # Recommend least popular unrated items
    serendipitous = sorted(unrated, key=lambda i: item_popularity[i])[:3]
    print("Ex25 — serendipitous items:", serendipitous,
          "| popularities:", item_popularity[serendipitous].tolist())

def ex26():
    """Rating prediction bias: global mean + user bias + item bias"""
    global_mean = RATINGS[RATINGS != 0].mean()
    user_bias = np.zeros(N_USERS)
    item_bias = np.zeros(N_ITEMS)
    for u in range(N_USERS):
        nz = RATINGS[u][RATINGS[u] != 0]
        if len(nz) > 0:
            user_bias[u] = nz.mean() - global_mean
    for i in range(N_ITEMS):
        nz = RATINGS[:, i][RATINGS[:, i] != 0]
        if len(nz) > 0:
            item_bias[i] = nz.mean() - global_mean
    # Predict rating for user 0, item 2
    pred = global_mean + user_bias[0] + item_bias[2]
    print("Ex26 — baseline pred (u=0, i=2):", round(pred, 4),
          "| global mean:", round(global_mean, 4))

# ─── NESTED (27–38) ────────────────────────────────────────

def ex27():
    """RecommenderSystem class wrapping CF methods"""
    class RecommenderSystem:
        def __init__(self, R):
            self.R = R
            self.user_sim = cosine_similarity(R)
            self.item_sim = cosine_similarity(R.T)
        def user_cf(self, user_idx, k=3):
            sims = self.user_sim[user_idx].copy()
            sims[user_idx] = 0
            scores = {}
            for item in range(self.R.shape[1]):
                if self.R[user_idx, item] != 0:
                    continue
                raters = self.R[:, item] != 0
                if raters.any():
                    d = np.sum(np.abs(sims[raters]))
                    scores[item] = float(np.dot(sims[raters], self.R[raters, item]) / (d + 1e-10))
            return sorted(scores, key=scores.get, reverse=True)[:k]
        def item_cf(self, user_idx, k=3):
            target = self.R[user_idx]
            rated  = np.where(target != 0)[0]
            scores = {}
            for item in range(self.R.shape[1]):
                if target[item] != 0:
                    continue
                w = sum(abs(self.item_sim[item, ri]) for ri in rated)
                scores[item] = sum(self.item_sim[item, ri] * target[ri] for ri in rated) / (w + 1e-10)
            return sorted(scores, key=scores.get, reverse=True)[:k]
    rs = RecommenderSystem(RATINGS)
    print("Ex27 — user CF for user 0:", rs.user_cf(0))
    print("       item CF for user 0:", rs.item_cf(0))

def ex28():
    """ALS-like alternating update (1 iteration)"""
    rng = np.random.default_rng(42)
    k, reg = 3, 0.1
    P = rng.standard_normal((N_USERS, k))
    Q = rng.standard_normal((N_ITEMS, k))
    # One ALS sweep: fix Q, update P
    for u in range(N_USERS):
        rated = np.where(RATINGS[u] != 0)[0]
        if len(rated) == 0:
            continue
        Q_r = Q[rated]
        r_u = RATINGS[u, rated]
        P[u] = np.linalg.solve(Q_r.T @ Q_r + reg * np.eye(k), Q_r.T @ r_u)
    R_pred = P @ Q.T
    mask = RATINGS != 0
    rmse = float(np.sqrt(np.mean((RATINGS[mask] - R_pred[mask]) ** 2)))
    print("Ex28 — ALS 1-iter RMSE:", round(rmse, 4))

def ex29():
    """Multi-user batch recommendation"""
    def recommend_user(R, u, k=3):
        sims = cosine_similarity(R)[u].copy()
        sims[u] = 0
        scores = {}
        for item in range(R.shape[1]):
            if R[u, item] != 0:
                continue
            raters = R[:, item] != 0
            if raters.any():
                d = np.sum(np.abs(sims[raters]))
                scores[item] = float(np.dot(sims[raters], R[raters, item]) / (d + 1e-10))
        return sorted(scores, key=scores.get, reverse=True)[:k]
    all_recs = {u: recommend_user(RATINGS, u) for u in range(N_USERS)}
    for u, recs in all_recs.items():
        print(f"Ex29 — user {u} recs: {recs}")

def ex30():
    """Evaluation framework: RMSE, Precision@k, Recall@k"""
    R_pred = RATINGS + np.random.RandomState(0).normal(0, 0.5, RATINGS.shape)
    mask = RATINGS != 0
    rmse = float(np.sqrt(np.mean((RATINGS[mask] - R_pred[mask]) ** 2)))
    # Precision@3 for user 0
    user_true = {i: RATINGS[0, i] for i in range(N_ITEMS) if RATINGS[0, i] >= 3}
    predicted_top3 = np.argsort(R_pred[0])[::-1][:3].tolist()
    p_at_3 = len(set(predicted_top3) & set(user_true.keys())) / 3
    print("Ex30 — RMSE:", round(rmse, 4), "| Precision@3:", round(p_at_3, 4))

def ex31():
    """Popularity-penalized recommendations (long tail)"""
    item_pop = np.count_nonzero(RATINGS, axis=0).astype(float)
    item_pop_norm = item_pop / item_pop.max()
    user_idx = 0
    sims = cosine_similarity(RATINGS)[user_idx].copy()
    sims[user_idx] = 0
    cf_scores = np.zeros(N_ITEMS)
    for item in range(N_ITEMS):
        if RATINGS[user_idx, item] != 0:
            continue
        raters = RATINGS[:, item] != 0
        if raters.any():
            d = np.sum(np.abs(sims[raters]))
            cf_scores[item] = float(np.dot(sims[raters], RATINGS[raters, item]) / (d + 1e-10))
    # Penalise popular items
    unrated = np.where(RATINGS[user_idx] == 0)[0]
    penalized = {i: cf_scores[i] * (1 - 0.3 * item_pop_norm[i]) for i in unrated}
    top3 = sorted(penalized, key=penalized.get, reverse=True)[:3]
    print("Ex31 — popularity-penalized recs:", top3)

def ex32():
    """User clustering for group recommendations"""
    from sklearn.cluster import KMeans
    # Fill zeros with mean
    R_filled = RATINGS.copy()
    for u in range(N_USERS):
        nz = R_filled[u][R_filled[u] != 0]
        R_filled[u][R_filled[u] == 0] = nz.mean() if len(nz) > 0 else 0.0
    km = KMeans(n_clusters=2, random_state=42, n_init="auto")
    labels = km.fit_predict(R_filled)
    print("Ex32 — user cluster labels:", labels.tolist())
    for c in range(2):
        members = np.where(labels == c)[0].tolist()
        print(f"       cluster {c}: users {members}")

def ex33():
    """Session-based recommendation: last-k items"""
    session = [0, 5, 3]  # user recently interacted with items 0, 5, 3
    item_sim = cosine_similarity(RATINGS.T)
    # Recommend based on the most recent item
    last_item = session[-1]
    sims = item_sim[last_item].copy()
    already_seen = set(session)
    candidates = [(i, sims[i]) for i in range(N_ITEMS) if i not in already_seen]
    top3 = sorted(candidates, key=lambda x: x[1], reverse=True)[:3]
    print("Ex33 — session-based recs (last item:", last_item, "):", [i for i, _ in top3])

def ex34():
    """Re-ranking for diversity: MMR (Maximal Marginal Relevance)"""
    user_idx = 0
    sims = cosine_similarity(RATINGS)[user_idx].copy()
    sims[user_idx] = 0
    cf_scores = np.zeros(N_ITEMS)
    for item in range(N_ITEMS):
        if RATINGS[user_idx, item] != 0:
            continue
        raters = RATINGS[:, item] != 0
        if raters.any():
            d = np.sum(np.abs(sims[raters]))
            cf_scores[item] = float(np.dot(sims[raters], RATINGS[raters, item]) / (d + 1e-10))
    item_sim = cosine_similarity(RATINGS.T)
    unrated = np.where(RATINGS[user_idx] == 0)[0].tolist()
    # MMR: balance relevance and diversity
    lambda_mmr = 0.5
    selected = []
    candidates = unrated.copy()
    for _ in range(3):
        if not candidates:
            break
        scores = []
        for c in candidates:
            rel = cf_scores[c]
            red = max([item_sim[c, s] for s in selected], default=0)
            scores.append((c, lambda_mmr * rel - (1 - lambda_mmr) * red))
        best = max(scores, key=lambda x: x[1])[0]
        selected.append(best)
        candidates.remove(best)
    print("Ex34 — MMR diverse recs:", selected)

def ex35():
    """Bayesian personalised ranking (BPR) loss concept"""
    rng = np.random.default_rng(42)
    k = 3
    P = rng.standard_normal((N_USERS, k)) * 0.1
    Q = rng.standard_normal((N_ITEMS, k)) * 0.1
    lr, reg = 0.05, 0.01
    positives = [(u, i) for u in range(N_USERS) for i in range(N_ITEMS) if RATINGS[u, i] > 0]
    total_loss = 0.0
    for u, i in positives[:20]:
        # Sample a negative item
        j = rng.integers(0, N_ITEMS)
        while RATINGS[u, j] > 0:
            j = rng.integers(0, N_ITEMS)
        x_uij = P[u] @ Q[i] - P[u] @ Q[j]
        loss = -np.log(1 / (1 + np.exp(-x_uij)))
        total_loss += loss
        sigma = np.exp(-x_uij) / (1 + np.exp(-x_uij))
        P[u] += lr * (sigma * (Q[i] - Q[j]) - reg * P[u])
        Q[i] += lr * (sigma * P[u] - reg * Q[i])
        Q[j] -= lr * (sigma * P[u] + reg * Q[j])
    print("Ex35 — BPR mean loss:", round(float(total_loss / 20), 4))

def ex36():
    """Temporal decay: recent ratings weighted higher"""
    timestamps = np.array([5, 4, 3, 2, 1], dtype=float)  # user 0 interactions (arbitrary)
    user_idx = 0
    rated_items = np.where(RATINGS[user_idx] != 0)[0]
    decay = np.exp(-0.1 * (timestamps.max() - timestamps[:len(rated_items)]))
    weighted = RATINGS[user_idx, rated_items] * decay
    print("Ex36 — original ratings:", RATINGS[user_idx, rated_items].tolist())
    print("       time-decayed:    ", np.round(weighted, 4).tolist())

def ex37():
    """Feature-enriched item similarity (metadata + CF)"""
    tfidf = TfidfVectorizer()
    cb_vecs = tfidf.fit_transform(ITEM_DESCRIPTIONS).toarray()
    cf_vecs = RATINGS.T  # item-as-user-interaction vectors
    # Normalise and concatenate
    def l2_norm(X):
        norms = np.linalg.norm(X, axis=1, keepdims=True)
        return X / (norms + 1e-10)
    combined = np.hstack([l2_norm(cb_vecs), l2_norm(cf_vecs)])
    hybrid_sim = cosine_similarity(combined)
    top_for_item0 = np.argsort(hybrid_sim[0])[::-1][1:4].tolist()
    print("Ex37 — hybrid item-item top-3 for item 0:", top_for_item0)

def ex38():
    """A/B test simulation for two recommenders"""
    rng = np.random.default_rng(42)
    n_users = 200
    # Algorithm A: random recs (baseline)
    clicks_a = rng.binomial(1, 0.05, n_users).sum()
    # Algorithm B: CF recs (slightly better)
    clicks_b = rng.binomial(1, 0.08, n_users).sum()
    ctr_a = clicks_a / n_users
    ctr_b = clicks_b / n_users
    lift = (ctr_b - ctr_a) / ctr_a * 100
    print("Ex38 — CTR A:", round(ctr_a, 4), "| CTR B:", round(ctr_b, 4),
          "| lift:", round(lift, 2), "%")

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Full collaborative filtering pipeline with evaluation"""
    def user_cf_predict(R, user_idx, k_neighbors=3):
        sims = cosine_similarity(R)[user_idx].copy()
        sims[user_idx] = 0
        scores = {}
        for item in range(R.shape[1]):
            if R[user_idx, item] != 0:
                continue
            raters = R[:, item] != 0
            if raters.any():
                top_k = np.argsort(sims)[::-1][:k_neighbors]
                top_k_rated = top_k[R[top_k, item] != 0]
                if len(top_k_rated) > 0:
                    d = np.sum(np.abs(sims[top_k_rated]))
                    scores[item] = float(np.dot(sims[top_k_rated], R[top_k_rated, item]) / (d + 1e-10))
        return sorted(scores, key=scores.get, reverse=True)
    for u in range(N_USERS):
        recs = user_cf_predict(RATINGS, u)[:3]
        print(f"Ex39 — user {u} CF recs: {recs}")

def ex40():
    """Matrix factorization with bias terms"""
    rng = np.random.default_rng(42)
    k, lr, reg, epochs = 3, 0.01, 0.02, 200
    P = rng.standard_normal((N_USERS, k)) * 0.1
    Q = rng.standard_normal((N_ITEMS, k)) * 0.1
    bu = np.zeros(N_USERS)  # user biases
    bi = np.zeros(N_ITEMS)  # item biases
    mu = RATINGS[RATINGS != 0].mean()
    for _ in range(epochs):
        for u in range(N_USERS):
            for i in range(N_ITEMS):
                if RATINGS[u, i] == 0:
                    continue
                pred = mu + bu[u] + bi[i] + P[u] @ Q[i]
                err  = RATINGS[u, i] - pred
                bu[u] += lr * (err - reg * bu[u])
                bi[i] += lr * (err - reg * bi[i])
                P_u = P[u].copy()
                P[u] += lr * (err * Q[i] - reg * P[u])
                Q[i] += lr * (err * P_u - reg * Q[i])
    R_pred = mu + bu.reshape(-1,1) + bi.reshape(1,-1) + P @ Q.T
    mask = RATINGS != 0
    rmse = float(np.sqrt(np.mean((RATINGS[mask] - R_pred[mask]) ** 2)))
    print("Ex40 — MF with bias RMSE:", round(rmse, 4))

def ex41():
    """Approximate Nearest Neighbor (ANN) concept via random projection"""
    rng = np.random.default_rng(42)
    n_proj = 8
    # Project item vectors to lower-dimensional space
    R_proj = np.random.RandomState(42).randn(N_ITEMS, n_proj)
    projected = RATINGS.T @ R_proj  # (N_ITEMS, n_proj) — proxy embedding
    # Find approximate nearest neighbors for item 0
    query = projected[0]
    dists = np.linalg.norm(projected - query, axis=1)
    dists[0] = np.inf  # exclude self
    nn_approx = np.argsort(dists)[:3].tolist()
    exact_sim  = cosine_similarity(RATINGS.T)
    nn_exact   = np.argsort(exact_sim[0])[::-1][1:4].tolist()
    print("Ex41 — ANN approx:", nn_approx, "| exact:", nn_exact)

def ex42():
    """Cross-dataset generalisation: leave-one-user-out evaluation"""
    from sklearn.metrics import mean_squared_error
    errors = []
    for held_out_user in range(N_USERS):
        train_R = RATINGS.copy()
        test_ratings = RATINGS[held_out_user].copy()
        train_R[held_out_user] = 0
        # Simple: predict with item means from training
        item_means = np.zeros(N_ITEMS)
        for i in range(N_ITEMS):
            col = train_R[:, i]
            nz = col[col != 0]
            item_means[i] = nz.mean() if len(nz) > 0 else RATINGS[RATINGS != 0].mean()
        rated = np.where(test_ratings != 0)[0]
        if len(rated) > 0:
            preds = item_means[rated]
            true  = test_ratings[rated]
            errors.append(float(np.sqrt(mean_squared_error(true, preds))))
    print("Ex42 — leave-one-user-out RMSE (each user):", [round(e, 4) for e in errors])

def ex43():
    """Online learning: incremental update on new interaction"""
    # Start with initial factorisation
    rng = np.random.default_rng(42)
    k, lr, reg = 3, 0.05, 0.02
    P = rng.standard_normal((N_USERS, k)) * 0.1
    Q = rng.standard_normal((N_ITEMS, k)) * 0.1
    # Simulate online update: new rating (user 2, item 0, rating 4)
    new_u, new_i, new_r = 2, 0, 4.0
    for _ in range(20):
        err = new_r - P[new_u] @ Q[new_i]
        P_u = P[new_u].copy()
        P[new_u] += lr * (err * Q[new_i] - reg * P[new_u])
        Q[new_i] += lr * (err * P_u - reg * Q[new_i])
    pred = P[new_u] @ Q[new_i]
    print("Ex43 — online update pred (u=2, i=0, true=4):", round(float(pred), 4))

def ex44():
    """Serendipity-aware recommendation pipeline"""
    user_idx = 0
    tfidf = TfidfVectorizer()
    cb_vecs = tfidf.fit_transform(ITEM_DESCRIPTIONS).toarray()
    item_sim_cb = cosine_similarity(cb_vecs)
    rated_items = np.where(RATINGS[user_idx] != 0)[0]
    unrated     = np.where(RATINGS[user_idx] == 0)[0]
    # Serendipity: items that are useful (high CF score) but unexpected (low CB sim to profile)
    user_sims = cosine_similarity(RATINGS)[user_idx].copy()
    user_sims[user_idx] = 0
    cf_scores = {}
    for item in unrated:
        raters = RATINGS[:, item] != 0
        if raters.any():
            d = np.sum(np.abs(user_sims[raters]))
            cf_scores[item] = float(np.dot(user_sims[raters], RATINGS[raters, item]) / (d + 1e-10))
    cb_sims_to_profile = {item: float(np.max(item_sim_cb[item, rated_items]))
                           for item in unrated}
    # Score = CF score - CB similarity to known items (unexpected but relevant)
    serendipity_scores = {item: cf_scores.get(item, 0) - 0.5 * cb_sims_to_profile[item]
                           for item in unrated}
    top3 = sorted(serendipity_scores, key=serendipity_scores.get, reverse=True)[:3]
    print("Ex44 — serendipity recs for user 0:", top3)

def ex45():
    """Production recommendation architecture summary"""
    arch = {
        "retrieval": "ANN on embeddings (FAISS/ScaNN) → top-500 candidates",
        "ranking":   "Deep NN with user+item features → score top-500 → top-50",
        "reranking":  "Apply business rules + diversity (MMR) → final top-10",
        "serving":   "Pre-compute embeddings offline; retrieve+rank online <50ms",
        "monitoring": "Track CTR, diversity, embedding drift, retrain triggers",
    }
    for stage, desc in arch.items():
        print(f"Ex45 — [{stage}] {desc}")

def ex46():
    """Implicit feedback: confidence-weighted ALS concept"""
    # alpha = confidence scaling: c_ui = 1 + alpha * r_ui
    alpha = 40
    C = 1 + alpha * RATINGS  # confidence matrix
    P_impl = np.zeros((N_USERS, 3))
    Q_impl = np.zeros((N_ITEMS, 3))
    rng = np.random.default_rng(42)
    P_impl = rng.standard_normal((N_USERS, 3)) * 0.1
    Q_impl = rng.standard_normal((N_ITEMS, 3)) * 0.1
    reg = 0.1
    # One ALS step (user update)
    for u in range(N_USERS):
        CuQ = C[u].reshape(-1, 1) * Q_impl  # (N_ITEMS, k)
        A = Q_impl.T @ CuQ + reg * np.eye(3)
        b = (C[u] * (RATINGS[u] > 0).astype(float)) @ Q_impl
        P_impl[u] = np.linalg.solve(A, b)
    print("Ex46 — implicit ALS P shape:", P_impl.shape,
          "| P[0] norm:", round(float(np.linalg.norm(P_impl[0])), 4))

def ex47():
    """Knowledge graph embedding concept for recommendations"""
    # Simulate: entity embeddings for users and items
    rng = np.random.default_rng(42)
    k = 4
    user_emb = rng.standard_normal((N_USERS, k))
    item_emb = rng.standard_normal((N_ITEMS, k))
    rel_emb  = rng.standard_normal(k)  # "likes" relation
    # TransE score: ||h + r - t||
    def transe_score(u, i):
        return -float(np.linalg.norm(user_emb[u] + rel_emb - item_emb[i]))
    scores = {i: transe_score(0, i) for i in range(N_ITEMS) if RATINGS[0, i] == 0}
    top3 = sorted(scores, key=scores.get, reverse=True)[:3]
    print("Ex47 — TransE recs for user 0:", top3)

def ex48():
    """Two-tower model concept: separate user and item encoders"""
    rng = np.random.default_rng(42)
    k = 4
    # Simple linear "towers"
    W_user = rng.standard_normal((N_ITEMS, k))  # user tower (input: ratings row)
    W_item = rng.standard_normal((N_ITEMS, k))  # item tower (input: ratings col)
    user_emb = RATINGS @ W_user  # (N_USERS, k)
    item_emb = RATINGS.T @ W_item  # (N_ITEMS, k) — items encoded by who rates them
    # Dot product scoring
    scores_u0 = user_emb[0] @ item_emb.T  # score for user 0 over all items
    unrated = np.where(RATINGS[0] == 0)[0]
    top3 = sorted(unrated, key=lambda i: scores_u0[i], reverse=True)[:3]
    print("Ex48 — two-tower recs for user 0:", top3)

def ex49():
    """Fairness: detect popularity bias in recommendations"""
    rng = np.random.default_rng(0)
    item_pop = np.count_nonzero(RATINGS, axis=0)
    all_recs = []
    for u in range(N_USERS):
        sims = cosine_similarity(RATINGS)[u].copy()
        sims[u] = 0
        scores = {}
        for item in range(N_ITEMS):
            if RATINGS[u, item] != 0:
                continue
            raters = RATINGS[:, item] != 0
            if raters.any():
                d = np.sum(np.abs(sims[raters]))
                scores[item] = float(np.dot(sims[raters], RATINGS[raters, item]) / (d + 1e-10))
        top3 = sorted(scores, key=scores.get, reverse=True)[:3]
        all_recs.extend(top3)
    rec_counts = np.zeros(N_ITEMS)
    for i in all_recs:
        rec_counts[i] += 1
    corr = np.corrcoef(item_pop, rec_counts)[0, 1]
    print("Ex49 — pop-rec correlation (1=full bias):", round(float(corr), 4))

def ex50():
    """End-to-end recommender pipeline: CF + CB + hybrid + evaluation"""
    # Build CF scores
    user_sims_all = cosine_similarity(RATINGS)
    # Build CB scores
    tfidf = TfidfVectorizer()
    cb_vecs = tfidf.fit_transform(ITEM_DESCRIPTIONS).toarray()
    metrics = {}
    for user_idx in range(N_USERS):
        unrated = np.where(RATINGS[user_idx] == 0)[0]
        # CF
        sims = user_sims_all[user_idx].copy(); sims[user_idx] = 0
        cf_s = np.zeros(N_ITEMS)
        for item in unrated:
            raters = RATINGS[:, item] != 0
            if raters.any():
                d = np.sum(np.abs(sims[raters]))
                cf_s[item] = float(np.dot(sims[raters], RATINGS[raters, item]) / (d + 1e-10))
        # CB
        rated_mask = RATINGS[user_idx] != 0
        if rated_mask.any():
            w = RATINGS[user_idx][rated_mask]
            profile = (cb_vecs[rated_mask].T @ w) / w.sum()
            cb_s = cosine_similarity(profile.reshape(1,-1), cb_vecs)[0]
        else:
            cb_s = np.zeros(N_ITEMS)
        # Hybrid
        def norm(a):
            mn, mx = a.min(), a.max()
            return (a - mn) / (mx - mn + 1e-10)
        hybrid = 0.6 * norm(cf_s) + 0.4 * norm(cb_s)
        top3 = sorted(unrated, key=lambda i: hybrid[i], reverse=True)[:3]
        relevant = set(i for i in range(N_ITEMS) if RATINGS[user_idx, i] >= 3.5)
        p_at_3 = len(set(top3) & relevant) / 3 if len(top3) > 0 else 0
        metrics[user_idx] = round(p_at_3, 4)
    print("Ex50 — hybrid P@3 per user:", metrics)
    print("       mean P@3:", round(float(np.mean(list(metrics.values()))), 4))


def main():
    print("=" * 60)
    print("Examples 4.5 — Recommendation Systems")
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
