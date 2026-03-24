# ============================================================
# Examples 4.1 — Clustering Algorithms (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import pandas as pd
from sklearn.datasets import make_blobs
from sklearn.cluster import (KMeans, DBSCAN, AgglomerativeClustering,
                              MeanShift, MiniBatchKMeans, SpectralClustering,
                              OPTICS, Birch)
from sklearn.mixture import GaussianMixture
from sklearn.metrics import (silhouette_score, davies_bouldin_score,
                              calinski_harabasz_score, adjusted_rand_score,
                              normalized_mutual_info_score, v_measure_score,
                              fowlkes_mallows_score)
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from scipy.cluster.hierarchy import linkage, fcluster

np.random.seed(42)
X, y_true = make_blobs(n_samples=300, centers=4, cluster_std=0.8, random_state=42)

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """KMeans fit on make_blobs"""
    km = KMeans(n_clusters=4, random_state=42, n_init=10)
    km.fit(X)
    print("Ex01 — KMeans labels (first 10):", km.labels_[:10])

def ex02():
    """Cluster labels and unique counts"""
    km = KMeans(n_clusters=4, random_state=42, n_init=10).fit(X)
    unique, counts = np.unique(km.labels_, return_counts=True)
    print("Ex02 — Cluster sizes:", dict(zip(unique, counts)))

def ex03():
    """Cluster centers"""
    km = KMeans(n_clusters=4, random_state=42, n_init=10).fit(X)
    print("Ex03 — Cluster centers shape:", km.cluster_centers_.shape)
    print("       First center:", np.round(km.cluster_centers_[0], 2))

def ex04():
    """Inertia (within-cluster sum of squares)"""
    km = KMeans(n_clusters=4, random_state=42, n_init=10).fit(X)
    print("Ex04 — Inertia:", round(km.inertia_, 2))

def ex05():
    """Silhouette score"""
    km = KMeans(n_clusters=4, random_state=42, n_init=10).fit(X)
    score = silhouette_score(X, km.labels_)
    print("Ex05 — Silhouette score:", round(score, 4))

def ex06():
    """DBSCAN fit"""
    db = DBSCAN(eps=1.0, min_samples=5).fit(X)
    n_clusters = len(set(db.labels_)) - (1 if -1 in db.labels_ else 0)
    print("Ex06 — DBSCAN clusters found:", n_clusters)

def ex07():
    """DBSCAN core, border, and noise points"""
    db = DBSCAN(eps=1.0, min_samples=5).fit(X)
    core = len(db.core_sample_indices_)
    noise = np.sum(db.labels_ == -1)
    border = len(X) - core - noise
    print(f"Ex07 — Core: {core}, Border: {border}, Noise: {noise}")

def ex08():
    """AgglomerativeClustering"""
    agg = AgglomerativeClustering(n_clusters=4).fit(X)
    unique, counts = np.unique(agg.labels_, return_counts=True)
    print("Ex08 — Agglomerative cluster sizes:", dict(zip(unique, counts)))

def ex09():
    """Linkage methods: ward, complete, average"""
    for linkage_method in ['ward', 'complete', 'average']:
        agg = AgglomerativeClustering(n_clusters=4, linkage=linkage_method).fit(X)
        sil = silhouette_score(X, agg.labels_)
        print(f"Ex09 — {linkage_method} linkage silhouette: {round(sil, 4)}")

def ex10():
    """MeanShift clustering"""
    ms = MeanShift(bandwidth=2.0).fit(X)
    n_clusters = len(np.unique(ms.labels_))
    print("Ex10 — MeanShift clusters:", n_clusters)

def ex11():
    """MiniBatchKMeans"""
    mbkm = MiniBatchKMeans(n_clusters=4, random_state=42, n_init=10).fit(X)
    print("Ex11 — MiniBatchKMeans inertia:", round(mbkm.inertia_, 2))

def ex12():
    """SpectralClustering"""
    sc = SpectralClustering(n_clusters=4, random_state=42, n_init=10).fit(X)
    sil = silhouette_score(X, sc.labels_)
    print("Ex12 — SpectralClustering silhouette:", round(sil, 4))

def ex13():
    """OPTICS clustering"""
    opt = OPTICS(min_samples=5, xi=0.05).fit(X)
    n_clusters = len(set(opt.labels_)) - (1 if -1 in opt.labels_ else 0)
    print("Ex13 — OPTICS clusters found:", n_clusters)

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Elbow method: inertia vs k=2..10"""
    inertias = []
    ks = range(2, 11)
    for k in ks:
        km = KMeans(n_clusters=k, random_state=42, n_init=10).fit(X)
        inertias.append(round(km.inertia_, 1))
    print("Ex14 — Elbow inertias:", dict(zip(ks, inertias)))

def ex15():
    """Silhouette analysis: score vs k"""
    scores = {}
    for k in range(2, 8):
        km = KMeans(n_clusters=k, random_state=42, n_init=10).fit(X)
        scores[k] = round(silhouette_score(X, km.labels_), 4)
    best_k = max(scores, key=scores.get)
    print("Ex15 — Silhouette scores:", scores)
    print("       Best k:", best_k)

def ex16():
    """Davies-Bouldin index (lower is better)"""
    km = KMeans(n_clusters=4, random_state=42, n_init=10).fit(X)
    db_score = davies_bouldin_score(X, km.labels_)
    print("Ex16 — Davies-Bouldin index:", round(db_score, 4))

def ex17():
    """Calinski-Harabasz index (higher is better)"""
    km = KMeans(n_clusters=4, random_state=42, n_init=10).fit(X)
    ch_score = calinski_harabasz_score(X, km.labels_)
    print("Ex17 — Calinski-Harabasz index:", round(ch_score, 2))

def ex18():
    """Adjusted Rand Index with true labels"""
    km = KMeans(n_clusters=4, random_state=42, n_init=10).fit(X)
    ari = adjusted_rand_score(y_true, km.labels_)
    print("Ex18 — Adjusted Rand Index:", round(ari, 4))

def ex19():
    """Normalized Mutual Information"""
    km = KMeans(n_clusters=4, random_state=42, n_init=10).fit(X)
    nmi = normalized_mutual_info_score(y_true, km.labels_)
    print("Ex19 — NMI:", round(nmi, 4))

def ex20():
    """V-measure score"""
    km = KMeans(n_clusters=4, random_state=42, n_init=10).fit(X)
    vm = v_measure_score(y_true, km.labels_)
    print("Ex20 — V-measure:", round(vm, 4))

def ex21():
    """Fowlkes-Mallows score"""
    km = KMeans(n_clusters=4, random_state=42, n_init=10).fit(X)
    fm = fowlkes_mallows_score(y_true, km.labels_)
    print("Ex21 — Fowlkes-Mallows:", round(fm, 4))

def ex22():
    """Cluster stability via bootstrap (5 runs, ARI consistency)"""
    base = KMeans(n_clusters=4, random_state=0, n_init=10).fit(X).labels_
    aris = []
    for seed in range(1, 6):
        labels = KMeans(n_clusters=4, random_state=seed, n_init=10).fit(X).labels_
        aris.append(round(adjusted_rand_score(base, labels), 4))
    print("Ex22 — Bootstrap ARI stability:", aris, "mean:", round(np.mean(aris), 4))

def ex23():
    """GMM clustering"""
    gmm = GaussianMixture(n_components=4, random_state=42).fit(X)
    labels = gmm.predict(X)
    sil = silhouette_score(X, labels)
    print("Ex23 — GMM silhouette:", round(sil, 4))

def ex24():
    """GMM BIC for k selection"""
    bics = {}
    for k in range(2, 7):
        gmm = GaussianMixture(n_components=k, random_state=42).fit(X)
        bics[k] = round(gmm.bic(X), 1)
    best_k = min(bics, key=bics.get)
    print("Ex24 — GMM BIC:", bics, "Best k:", best_k)

def ex25():
    """Hierarchical dendrogram linkage data"""
    Z = linkage(X[:50], method='ward')
    print("Ex25 — Linkage matrix shape:", Z.shape)
    print("       Last merge distance:", round(Z[-1, 2], 2))

def ex26():
    """Cluster profiling: mean per feature per cluster"""
    km = KMeans(n_clusters=4, random_state=42, n_init=10).fit(X)
    df = pd.DataFrame(X, columns=['feat_0', 'feat_1'])
    df['cluster'] = km.labels_
    profile = df.groupby('cluster').mean().round(2)
    print("Ex26 — Cluster profiles:\n", profile.to_string())

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """KMeansFromScratch class using Lloyd's algorithm (10 iters)"""
    class KMeansFromScratch:
        def __init__(self, k=4, n_iter=10, seed=42):
            self.k = k
            self.n_iter = n_iter
            self.seed = seed

        def fit(self, X):
            rng = np.random.RandomState(self.seed)
            idx = rng.choice(len(X), self.k, replace=False)
            self.centers = X[idx].copy()
            for _ in range(self.n_iter):
                dists = np.linalg.norm(X[:, None] - self.centers[None], axis=2)
                self.labels_ = np.argmin(dists, axis=1)
                for c in range(self.k):
                    mask = self.labels_ == c
                    if mask.sum() > 0:
                        self.centers[c] = X[mask].mean(axis=0)
            return self

    km = KMeansFromScratch(k=4).fit(X)
    ari = adjusted_rand_score(y_true, km.labels_)
    print("Ex27 — KMeansFromScratch ARI:", round(ari, 4))

def ex28():
    """ClusterEvaluator class: internal + external metrics"""
    class ClusterEvaluator:
        def __init__(self, X, labels, true_labels=None):
            self.X = X
            self.labels = labels
            self.true_labels = true_labels

        def internal_metrics(self):
            return {
                'silhouette': round(silhouette_score(self.X, self.labels), 4),
                'davies_bouldin': round(davies_bouldin_score(self.X, self.labels), 4),
                'calinski_harabasz': round(calinski_harabasz_score(self.X, self.labels), 2)
            }

        def external_metrics(self):
            if self.true_labels is None:
                return {}
            return {
                'ari': round(adjusted_rand_score(self.true_labels, self.labels), 4),
                'nmi': round(normalized_mutual_info_score(self.true_labels, self.labels), 4)
            }

    km = KMeans(n_clusters=4, random_state=42, n_init=10).fit(X)
    ev = ClusterEvaluator(X, km.labels_, y_true)
    print("Ex28 — Internal:", ev.internal_metrics())
    print("       External:", ev.external_metrics())

def ex29():
    """ClusterOptimizer class: find optimal k via silhouette"""
    class ClusterOptimizer:
        def __init__(self, k_range=range(2, 9)):
            self.k_range = k_range
            self.scores_ = {}

        def fit(self, X):
            for k in self.k_range:
                labels = KMeans(n_clusters=k, random_state=42, n_init=10).fit_predict(X)
                self.scores_[k] = round(silhouette_score(X, labels), 4)
            self.best_k_ = max(self.scores_, key=self.scores_.get)
            return self

    opt = ClusterOptimizer().fit(X)
    print("Ex29 — Optimal k:", opt.best_k_, "scores:", opt.scores_)

def ex30():
    """DBSCANTuner class: eps + min_samples grid search"""
    class DBSCANTuner:
        def __init__(self, eps_vals, min_samples_vals):
            self.eps_vals = eps_vals
            self.min_samples_vals = min_samples_vals
            self.results_ = []

        def fit(self, X):
            for eps in self.eps_vals:
                for ms in self.min_samples_vals:
                    labels = DBSCAN(eps=eps, min_samples=ms).fit_predict(X)
                    n = len(set(labels)) - (1 if -1 in labels else 0)
                    noise = np.sum(labels == -1)
                    self.results_.append({'eps': eps, 'min_s': ms, 'clusters': n, 'noise': noise})
            return self

    tuner = DBSCANTuner([0.5, 1.0, 1.5], [3, 5]).fit(X)
    for r in tuner.results_[:3]:
        print("Ex30 —", r)

def ex31():
    """HierarchicalClusterer class with multiple linkages"""
    class HierarchicalClusterer:
        def __init__(self, n_clusters=4):
            self.n_clusters = n_clusters
            self.results_ = {}

        def fit(self, X):
            for method in ['ward', 'complete', 'average', 'single']:
                labels = AgglomerativeClustering(
                    n_clusters=self.n_clusters, linkage=method).fit_predict(X)
                self.results_[method] = round(silhouette_score(X, labels), 4)
            return self

    hc = HierarchicalClusterer().fit(X)
    print("Ex31 — Hierarchical silhouettes:", hc.results_)

def ex32():
    """ClusterProfiler class: stats per cluster"""
    class ClusterProfiler:
        def __init__(self, feature_names=None):
            self.feature_names = feature_names

        def fit(self, X, labels):
            df = pd.DataFrame(X, columns=self.feature_names or [f'f{i}' for i in range(X.shape[1])])
            df['cluster'] = labels
            self.profile_ = df.groupby('cluster').agg(['mean', 'std']).round(2)
            self.sizes_ = df['cluster'].value_counts().sort_index()
            return self

    km = KMeans(n_clusters=4, random_state=42, n_init=10).fit(X)
    cp = ClusterProfiler(feature_names=['x', 'y']).fit(X, km.labels_)
    print("Ex32 — Cluster sizes:\n", cp.sizes_.to_string())

def ex33():
    """Full clustering pipeline: preprocess + cluster + evaluate"""
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    km = KMeans(n_clusters=4, random_state=42, n_init=10).fit(X_scaled)
    sil = silhouette_score(X_scaled, km.labels_)
    ari = adjusted_rand_score(y_true, km.labels_)
    print("Ex33 — Pipeline: silhouette={:.4f}, ARI={:.4f}".format(sil, ari))

def ex34():
    """Clustering comparison: KMeans vs DBSCAN vs GMM"""
    results = {}
    km = KMeans(n_clusters=4, random_state=42, n_init=10).fit(X)
    results['KMeans'] = round(silhouette_score(X, km.labels_), 4)
    db = DBSCAN(eps=1.0, min_samples=5).fit(X)
    if len(set(db.labels_)) > 1:
        results['DBSCAN'] = round(silhouette_score(X, db.labels_), 4)
    gmm_labels = GaussianMixture(n_components=4, random_state=42).fit(X).predict(X)
    results['GMM'] = round(silhouette_score(X, gmm_labels), 4)
    print("Ex34 — Silhouette comparison:", results)

def ex35():
    """Temporal cluster stability: train on half, predict second half"""
    half = len(X) // 2
    km = KMeans(n_clusters=4, random_state=42, n_init=10).fit(X[:half])
    labels_1 = km.labels_
    labels_2 = km.predict(X[half:])
    sil1 = silhouette_score(X[:half], labels_1)
    sil2 = silhouette_score(X[half:], labels_2)
    print("Ex35 — Temporal stability: sil_train={:.4f}, sil_test={:.4f}".format(sil1, sil2))

def ex36():
    """Cluster visualization data: 2D PCA projection"""
    pca = PCA(n_components=2)
    X_2d = pca.fit_transform(X)
    km = KMeans(n_clusters=4, random_state=42, n_init=10).fit(X)
    df = pd.DataFrame(X_2d, columns=['pc1', 'pc2'])
    df['cluster'] = km.labels_
    print("Ex36 — PCA 2D shape:", X_2d.shape)
    print("       Variance explained:", np.round(pca.explained_variance_ratio_, 3))

def ex37():
    """Cluster size distribution statistics"""
    km = KMeans(n_clusters=4, random_state=42, n_init=10).fit(X)
    sizes = np.bincount(km.labels_)
    print("Ex37 — Cluster sizes:", sizes)
    print("       Min:", sizes.min(), "Max:", sizes.max(), "Std:", round(sizes.std(), 2))

def ex38():
    """Production clustering pipeline: fit/transform/score/save-metadata"""
    class ProductionClusterPipeline:
        def __init__(self, n_clusters=4):
            self.scaler = StandardScaler()
            self.model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
            self.metadata_ = {}

        def fit(self, X):
            X_s = self.scaler.fit_transform(X)
            self.model.fit(X_s)
            labels = self.model.labels_
            self.metadata_ = {
                'n_clusters': len(np.unique(labels)),
                'inertia': round(self.model.inertia_, 2),
                'silhouette': round(silhouette_score(X_s, labels), 4)
            }
            return self

        def predict(self, X):
            return self.model.predict(self.scaler.transform(X))

    pipe = ProductionClusterPipeline(n_clusters=4).fit(X)
    preds = pipe.predict(X[:5])
    print("Ex38 — Production pipeline metadata:", pipe.metadata_)
    print("       Sample predictions:", preds)

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Fuzzy c-means concept"""
    print("Ex39 — Fuzzy C-Means concept:")
    print("  - Each point has membership degree u_ij in [0,1] for each cluster j")
    print("  - Minimize: sum_i sum_j (u_ij^m) * ||x_i - c_j||^2  (m=fuzziness, usually 2)")
    print("  - Update: c_j = sum_i(u_ij^m * x_i) / sum_i(u_ij^m)")
    print("  - Unlike hard KMeans, points partially belong to multiple clusters")
    print("  - Use skfuzzy.cluster.cmeans() from scikit-fuzzy library")

def ex40():
    """Subspace clustering concept"""
    print("Ex40 — Subspace Clustering concept:")
    print("  - Clusters exist in different subspaces (subsets of dimensions)")
    print("  - Useful when clusters are buried in high-dim data")
    print("  - Algorithms: CLIQUE, PROCLUS, ORCLUS, sparse subspace clustering (SSC)")
    print("  - SSC: represent each point as sparse linear combination of others")
    print("  - Affinity matrix -> spectral clustering on learned connections")

def ex41():
    """Co-clustering concept"""
    print("Ex41 — Co-Clustering (Biclustering) concept:")
    print("  - Simultaneously cluster rows AND columns of a matrix")
    print("  - sklearn: SpectralBiclustering, SpectralCoclustering")
    print("  - Applications: gene expression (genes + conditions), text (docs + words)")
    print("  - Finds submatrices with coherent patterns")
    from sklearn.cluster import SpectralCoclustering
    rng = np.random.RandomState(0)
    mat = rng.random((20, 10))
    model = SpectralCoclustering(n_clusters=3, random_state=0).fit(mat)
    print("  - SpectralCoclustering row labels:", model.row_labels_[:5])

def ex42():
    """Projected clustering concept"""
    print("Ex42 — Projected Clustering concept:")
    print("  - Assign each cluster its own relevant subspace (projection)")
    print("  - Algorithm PROCLUS: iteratively select medioids + local dimensions")
    print("  - Different from subspace: each cluster has different feature subset")
    print("  - Advantage: handles clusters of different intrinsic dimensionality")
    print("  - Related: ORCLUS uses PCA per cluster to find oriented subspaces")

def ex43():
    """Density peaks algorithm concept"""
    print("Ex43 — Density Peaks Algorithm (Rodriguez & Laio, 2014):")
    print("  - Cluster centers: high local density + large distance from denser points")
    print("  - rho_i = number of points within cutoff distance d_c of point i")
    print("  - delta_i = min distance to any point with higher density")
    print("  - Decision graph: plot delta vs rho; cluster centers in top-right corner")
    print("  - Assign non-center points to cluster of nearest higher-density neighbor")

def ex44():
    """Affinity Propagation clustering"""
    from sklearn.cluster import AffinityPropagation
    ap = AffinityPropagation(random_state=42, max_iter=200).fit(X[:100])
    n_clusters = len(ap.cluster_centers_indices_)
    sil = silhouette_score(X[:100], ap.labels_)
    print("Ex44 — Affinity Propagation clusters:", n_clusters,
          "silhouette:", round(sil, 4))

def ex45():
    """BIRCH algorithm"""
    birch = Birch(n_clusters=4).fit(X)
    sil = silhouette_score(X, birch.labels_)
    ari = adjusted_rand_score(y_true, birch.labels_)
    print("Ex45 — BIRCH silhouette:", round(sil, 4), "ARI:", round(ari, 4))

def ex46():
    """Constrained clustering: must-link / cannot-link concept"""
    print("Ex46 — Constrained Clustering concept:")
    print("  - Must-link: two points must be in the same cluster")
    print("  - Cannot-link: two points must be in different clusters")
    print("  - COP-KMeans: penalize constraint violations during assignment")
    print("  - PCKMeans: semi-supervised with pairwise constraints")
    print("  - Propagate transitive must-links before running KMeans")
    km = KMeans(n_clusters=4, random_state=42, n_init=10).fit(X)
    must_link = [(0, 1), (2, 3)]
    violations = sum(1 for a, b in must_link if km.labels_[a] != km.labels_[b])
    print("  - Must-link constraint violations in unconstrained KMeans:", violations)

def ex47():
    """Semi-supervised clustering"""
    print("Ex47 — Semi-Supervised Clustering:")
    print("  - Use partial labels to guide cluster assignment")
    labeled_idx = np.where(np.arange(len(X)) % 10 == 0)[0]
    km = KMeans(n_clusters=4, random_state=42, n_init=10).fit(X)
    labeled_labels = km.labels_[labeled_idx]
    agreement = adjusted_rand_score(y_true[labeled_idx], labeled_labels)
    print("  - Labeled subset ARI (proxy for semi-supervised quality):", round(agreement, 4))
    print("  - Strategy: initialize centroids from labeled examples, then EM")

def ex48():
    """Clustering for anomaly detection"""
    km = KMeans(n_clusters=4, random_state=42, n_init=10).fit(X)
    centers = km.cluster_centers_
    assigned = centers[km.labels_]
    dists = np.linalg.norm(X - assigned, axis=1)
    threshold = np.percentile(dists, 95)
    anomalies = np.where(dists > threshold)[0]
    print("Ex48 — Clustering anomaly detection: threshold={:.2f}, anomalies={}".format(
        threshold, len(anomalies)))

def ex49():
    """Clustering for recommendation (item grouping)"""
    np.random.seed(0)
    items = np.random.randn(100, 5)
    km = KMeans(n_clusters=8, random_state=42, n_init=10).fit(items)
    target_item = 0
    target_cluster = km.labels_[target_item]
    similar_items = np.where(km.labels_ == target_cluster)[0]
    similar_items = similar_items[similar_items != target_item][:5]
    print("Ex49 — Item clustering for recs: item 0 cluster={}, similar={}".format(
        target_cluster, similar_items.tolist()))

def ex50():
    """Production clustering architecture"""
    print("Ex50 — Production Clustering Architecture:")
    print("  1. Data ingestion: streaming + batch via Kafka/S3")
    print("  2. Feature store: precomputed embeddings (Redis/Feast)")
    print("  3. Offline training: KMeans/GMM on full data (Spark MLlib or sklearn)")
    print("  4. Model registry: versioned cluster models (MLflow)")
    print("  5. Online serving: nearest-centroid lookup (FAISS index)")
    print("  6. Monitoring: track cluster drift (PSI/KL-divergence), silhouette decay")
    print("  7. Retraining: triggered when drift score > threshold")
    print("  8. A/B testing: compare cluster assignments between versions")


def main():
    print("=" * 60)
    print("Examples 4.1 — Clustering Algorithms")
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
