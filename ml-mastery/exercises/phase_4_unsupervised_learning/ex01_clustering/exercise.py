# ============================================================
# Exercise 4.1 — Clustering Algorithms
# ============================================================
# Topics:
#   • K-Means from scratch (Lloyd's algorithm)
#   • sklearn KMeans, Elbow method, Silhouette
#   • DBSCAN (core/border/noise points)
#   • Agglomerative clustering, Dendrogram
#   • Gaussian Mixture Models (GMM), BIC
#   • Mini-batch K-Means, Spectral clustering
#   • Cluster evaluation: ARI, NMI
#   • Cluster profiling, optimal k
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
# TODO 1: K-Means from Scratch (Lloyd's Algorithm)
# ---------------------------------------------------------------------------
# Implement K-Means:
#   1. Initialize k centroids by randomly selecting k data points.
#   2. Repeat until centroids don't change (or max_iter reached):
#       a. Assign each point to the nearest centroid (Euclidean distance).
#       b. Update centroids as the mean of assigned points.
# Return (labels, centroids) — labels shape (n,), centroids shape (k, d).

def kmeans_scratch(X: np.ndarray, k: int = 4,
                   max_iter: int = 100) -> tuple:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 2: sklearn KMeans
# ---------------------------------------------------------------------------
# Fit KMeans(n_clusters=4, random_state=42) on X.
# Return (model, labels).

def sklearn_kmeans(X: np.ndarray):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 3: Elbow Method
# ---------------------------------------------------------------------------
# For k in range(1, 11), fit KMeans and record inertia_ (within-cluster sum of squares).
# Return a dict: {k: inertia}.

def elbow_method(X: np.ndarray) -> dict:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 4: Silhouette Score
# ---------------------------------------------------------------------------
# Fit KMeans(n_clusters=4) on X.
# Compute and return the silhouette score (sklearn silhouette_score).

def silhouette(X: np.ndarray) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 5: DBSCAN
# ---------------------------------------------------------------------------
# Fit DBSCAN(eps=0.5, min_samples=5) on X.
# Return (model, labels) where labels contains -1 for noise points.

def dbscan(X: np.ndarray):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 6: DBSCAN — Core, Border, Noise Points
# ---------------------------------------------------------------------------
# Given a fitted DBSCAN model and X:
#   - Core points: indices in model.core_sample_indices_
#   - Noise points: where labels == -1
#   - Border points: all other labeled (non-noise, non-core) points
# Return a dict: {'n_core': int, 'n_border': int, 'n_noise': int}

def dbscan_point_types(model, labels: np.ndarray, X: np.ndarray) -> dict:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 7: Agglomerative Hierarchical Clustering
# ---------------------------------------------------------------------------
# Fit AgglomerativeClustering(n_clusters=4, linkage='ward') on X.
# Return labels.

def agglomerative(X: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 8: Dendrogram Data (Linkage Matrix)
# ---------------------------------------------------------------------------
# Compute the linkage matrix using scipy.cluster.hierarchy.linkage(X, method='ward').
# Return the linkage matrix (shape: (n-1, 4)).

def dendrogram_data(X: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 9: Gaussian Mixture Model
# ---------------------------------------------------------------------------
# Fit GaussianMixture(n_components=4, random_state=42) on X.
# Return (model, labels from model.predict(X)).

def gmm_clustering(X: np.ndarray):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 10: GMM BIC for Model Selection
# ---------------------------------------------------------------------------
# For n_components in [2, 3, 4, 5, 6]:
#   Fit GaussianMixture and record BIC.
# Return a dict: {n_components: bic}.

def gmm_bic(X: np.ndarray) -> dict:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 11: Mini-Batch K-Means
# ---------------------------------------------------------------------------
# Fit MiniBatchKMeans(n_clusters=4, random_state=42) on X.
# Return (model, labels).

def minibatch_kmeans(X: np.ndarray):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 12: Spectral Clustering
# ---------------------------------------------------------------------------
# Fit SpectralClustering(n_clusters=4, random_state=42, affinity='rbf') on X.
# Return labels.

def spectral_clustering(X: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 13: Cluster Evaluation (ARI, NMI)
# ---------------------------------------------------------------------------
# Given true labels y_true and predicted labels y_pred:
# Compute Adjusted Rand Index and Normalized Mutual Information.
# Return a dict: {'ARI': float, 'NMI': float}.

def cluster_evaluation(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 14: Cluster Profiling
# ---------------------------------------------------------------------------
# Given X (features) and cluster labels:
# Compute the mean feature vector for each cluster.
# Return a dict: {cluster_id: mean_feature_vector}.

def cluster_profiling(X: np.ndarray, labels: np.ndarray) -> dict:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 15: Choosing Optimal k (Multiple Methods)
# ---------------------------------------------------------------------------
# For k in [2, 3, 4, 5, 6], compute:
#   - Inertia (elbow)
#   - Silhouette score
#   - (For ARI: compare to y_true if available)
# Return a dict: {k: {'inertia': ..., 'silhouette': ..., 'ari': ...}}

def optimal_k(X: np.ndarray, y_true: np.ndarray) -> dict:
    pass  # TODO: implement


def main():
    print("=== Exercise 4.1: Clustering Algorithms ===\n")

    labels_s, centroids = kmeans_scratch(X, k=4) if kmeans_scratch(X, k=4) else (None, None)
    print("TODO 1 — K-Means scratch centroids shape:", centroids.shape if centroids is not None else None)

    model2, labels2 = sklearn_kmeans(X) if sklearn_kmeans(X) else (None, None)
    print("TODO 2 — sklearn KMeans inertia:", round(model2.inertia_, 2) if model2 else None)

    elbow = elbow_method(X)
    print("TODO 3 — Elbow (k=1..5):", {k: round(v, 1) for k, v in list(elbow.items())[:5]} if elbow else None)

    sil = silhouette(X)
    print("TODO 4 — Silhouette score:", round(sil, 4) if sil is not None else None)

    db_model, db_labels = dbscan(X) if dbscan(X) else (None, None)
    print("TODO 5 — DBSCAN unique labels:", np.unique(db_labels) if db_labels is not None else None)

    pt = dbscan_point_types(db_model, db_labels, X) if db_model is not None else None
    print("TODO 6 — DBSCAN point types:", pt)

    agg_labels = agglomerative(X)
    print("TODO 7 — Agglomerative labels (first 5):", agg_labels[:5] if agg_labels is not None else None)

    Z = dendrogram_data(X)
    print("TODO 8 — Linkage matrix shape:", Z.shape if Z is not None else None)

    gmm_model, gmm_labels = gmm_clustering(X) if gmm_clustering(X) else (None, None)
    print("TODO 9 — GMM unique labels:", np.unique(gmm_labels) if gmm_labels is not None else None)

    bic_results = gmm_bic(X)
    print("TODO 10 — GMM BIC:", {k: round(v, 1) for k, v in bic_results.items()} if bic_results else None)

    mb_model, mb_labels = minibatch_kmeans(X) if minibatch_kmeans(X) else (None, None)
    print("TODO 11 — Mini-batch KMeans inertia:", round(mb_model.inertia_, 2) if mb_model else None)

    spec_labels = spectral_clustering(X)
    print("TODO 12 — Spectral labels (first 5):", spec_labels[:5] if spec_labels is not None else None)

    eval_res = cluster_evaluation(y_true, labels2) if labels2 is not None else None
    print("TODO 13 — Cluster evaluation:", eval_res)

    profile = cluster_profiling(X, labels2) if labels2 is not None else None
    print("TODO 14 — Cluster profiling keys:", list(profile.keys()) if profile else None)

    opt = optimal_k(X, y_true)
    print("TODO 15 — Optimal k results:", opt)


if __name__ == "__main__":
    main()
