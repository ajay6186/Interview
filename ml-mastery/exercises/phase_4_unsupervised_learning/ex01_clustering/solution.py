# ============================================================
# Solution 4.1 — Clustering Algorithms
# ============================================================

import numpy as np
from sklearn.datasets import make_blobs
from sklearn.cluster import (KMeans, DBSCAN, AgglomerativeClustering,
                              MiniBatchKMeans, SpectralClustering)
from sklearn.mixture import GaussianMixture
from sklearn.metrics import (silhouette_score, adjusted_rand_score,
                              normalized_mutual_info_score)
from scipy.cluster.hierarchy import linkage

np.random.seed(42)
X, y_true = make_blobs(n_samples=300, centers=4, cluster_std=0.8,
                        random_state=42)


# ---------------------------------------------------------------------------
# Solution 1: K-Means from Scratch
# ---------------------------------------------------------------------------

def kmeans_scratch(X: np.ndarray, k: int = 4,
                   max_iter: int = 100) -> tuple:
    rng = np.random.default_rng(42)
    idx = rng.choice(len(X), size=k, replace=False)
    centroids = X[idx].copy()

    for _ in range(max_iter):
        # Assign step
        dists = np.linalg.norm(X[:, None, :] - centroids[None, :, :], axis=2)
        labels = np.argmin(dists, axis=1)

        # Update step
        new_centroids = np.array([X[labels == j].mean(axis=0) if np.any(labels == j)
                                   else centroids[j] for j in range(k)])
        if np.allclose(new_centroids, centroids):
            break
        centroids = new_centroids

    return labels, centroids


# ---------------------------------------------------------------------------
# Solution 2: sklearn KMeans
# ---------------------------------------------------------------------------

def sklearn_kmeans(X: np.ndarray):
    model = KMeans(n_clusters=4, random_state=42, n_init=10)
    model.fit(X)
    return model, model.labels_


# ---------------------------------------------------------------------------
# Solution 3: Elbow Method
# ---------------------------------------------------------------------------

def elbow_method(X: np.ndarray) -> dict:
    results = {}
    for k in range(1, 11):
        model = KMeans(n_clusters=k, random_state=42, n_init=10)
        model.fit(X)
        results[k] = float(model.inertia_)
    return results


# ---------------------------------------------------------------------------
# Solution 4: Silhouette Score
# ---------------------------------------------------------------------------

def silhouette(X: np.ndarray) -> float:
    model = KMeans(n_clusters=4, random_state=42, n_init=10)
    labels = model.fit_predict(X)
    return float(silhouette_score(X, labels))


# ---------------------------------------------------------------------------
# Solution 5: DBSCAN
# ---------------------------------------------------------------------------

def dbscan(X: np.ndarray):
    model = DBSCAN(eps=0.5, min_samples=5)
    labels = model.fit_predict(X)
    return model, labels


# ---------------------------------------------------------------------------
# Solution 6: DBSCAN Point Types
# ---------------------------------------------------------------------------

def dbscan_point_types(model, labels: np.ndarray, X: np.ndarray) -> dict:
    n_total = len(X)
    core_set = set(model.core_sample_indices_)
    noise_mask = labels == -1
    n_noise = int(np.sum(noise_mask))
    n_core = len(core_set)
    n_border = n_total - n_core - n_noise
    return {'n_core': n_core, 'n_border': n_border, 'n_noise': n_noise}


# ---------------------------------------------------------------------------
# Solution 7: Agglomerative Clustering
# ---------------------------------------------------------------------------

def agglomerative(X: np.ndarray) -> np.ndarray:
    model = AgglomerativeClustering(n_clusters=4, linkage='ward')
    return model.fit_predict(X)


# ---------------------------------------------------------------------------
# Solution 8: Dendrogram Data
# ---------------------------------------------------------------------------

def dendrogram_data(X: np.ndarray) -> np.ndarray:
    Z = linkage(X, method='ward')
    return Z


# ---------------------------------------------------------------------------
# Solution 9: GMM Clustering
# ---------------------------------------------------------------------------

def gmm_clustering(X: np.ndarray):
    model = GaussianMixture(n_components=4, random_state=42)
    model.fit(X)
    labels = model.predict(X)
    return model, labels


# ---------------------------------------------------------------------------
# Solution 10: GMM BIC
# ---------------------------------------------------------------------------

def gmm_bic(X: np.ndarray) -> dict:
    results = {}
    for n in [2, 3, 4, 5, 6]:
        model = GaussianMixture(n_components=n, random_state=42)
        model.fit(X)
        results[n] = float(model.bic(X))
    return results


# ---------------------------------------------------------------------------
# Solution 11: Mini-Batch K-Means
# ---------------------------------------------------------------------------

def minibatch_kmeans(X: np.ndarray):
    model = MiniBatchKMeans(n_clusters=4, random_state=42)
    labels = model.fit_predict(X)
    return model, labels


# ---------------------------------------------------------------------------
# Solution 12: Spectral Clustering
# ---------------------------------------------------------------------------

def spectral_clustering(X: np.ndarray) -> np.ndarray:
    model = SpectralClustering(n_clusters=4, random_state=42, affinity='rbf')
    return model.fit_predict(X)


# ---------------------------------------------------------------------------
# Solution 13: Cluster Evaluation
# ---------------------------------------------------------------------------

def cluster_evaluation(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    ari = float(adjusted_rand_score(y_true, y_pred))
    nmi = float(normalized_mutual_info_score(y_true, y_pred))
    return {'ARI': round(ari, 4), 'NMI': round(nmi, 4)}


# ---------------------------------------------------------------------------
# Solution 14: Cluster Profiling
# ---------------------------------------------------------------------------

def cluster_profiling(X: np.ndarray, labels: np.ndarray) -> dict:
    profile = {}
    for cluster_id in np.unique(labels):
        if cluster_id == -1:
            continue  # skip noise
        profile[int(cluster_id)] = X[labels == cluster_id].mean(axis=0)
    return profile


# ---------------------------------------------------------------------------
# Solution 15: Optimal k
# ---------------------------------------------------------------------------

def optimal_k(X: np.ndarray, y_true: np.ndarray) -> dict:
    results = {}
    for k in [2, 3, 4, 5, 6]:
        model = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = model.fit_predict(X)
        inertia = float(model.inertia_)
        sil = float(silhouette_score(X, labels)) if k > 1 else float('nan')
        ari = float(adjusted_rand_score(y_true, labels))
        results[k] = {
            'inertia': round(inertia, 2),
            'silhouette': round(sil, 4),
            'ari': round(ari, 4),
        }
    return results


def main():
    print("=== Solution 4.1: Clustering Algorithms ===\n")

    labels_s, centroids = kmeans_scratch(X, k=4)
    print("Result 1 — K-Means scratch centroids shape:", centroids.shape)

    model2, labels2 = sklearn_kmeans(X)
    print("Result 2 — sklearn KMeans inertia:", round(model2.inertia_, 2))

    elbow = elbow_method(X)
    print("Result 3 — Elbow (k=1..5):", {k: round(v, 1) for k, v in list(elbow.items())[:5]})

    sil = silhouette(X)
    print("Result 4 — Silhouette score:", round(sil, 4))

    db_model, db_labels = dbscan(X)
    print("Result 5 — DBSCAN unique labels:", np.unique(db_labels))

    pt = dbscan_point_types(db_model, db_labels, X)
    print("Result 6 — DBSCAN point types:", pt)

    agg_labels = agglomerative(X)
    print("Result 7 — Agglomerative labels (first 5):", agg_labels[:5])
    print("          ARI with true:", round(adjusted_rand_score(y_true, agg_labels), 4))

    Z = dendrogram_data(X)
    print("Result 8 — Linkage matrix shape:", Z.shape)

    gmm_model, gmm_labels = gmm_clustering(X)
    print("Result 9 — GMM ARI:", round(adjusted_rand_score(y_true, gmm_labels), 4))

    bic_results = gmm_bic(X)
    best_n = min(bic_results, key=bic_results.get)
    print("Result 10 — Best BIC n_components:", best_n,
          "| BIC:", {k: round(v, 1) for k, v in bic_results.items()})

    mb_model, mb_labels = minibatch_kmeans(X)
    print("Result 11 — Mini-batch KMeans inertia:", round(mb_model.inertia_, 2))

    spec_labels = spectral_clustering(X)
    print("Result 12 — Spectral ARI:", round(adjusted_rand_score(y_true, spec_labels), 4))

    eval_res = cluster_evaluation(y_true, labels2)
    print("Result 13 — Cluster evaluation:", eval_res)

    profile = cluster_profiling(X, labels2)
    print("Result 14 — Cluster profile keys:", sorted(profile.keys()))
    for cid, mean in sorted(profile.items()):
        print(f"   Cluster {cid}: mean = {np.round(mean, 3)}")

    opt = optimal_k(X, y_true)
    print("Result 15 — Optimal k analysis:")
    for k, v in opt.items():
        print(f"   k={k}: {v}")


if __name__ == "__main__":
    main()
