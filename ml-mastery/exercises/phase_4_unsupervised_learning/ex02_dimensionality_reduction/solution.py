# ============================================================
# Solution 4.2 — Dimensionality Reduction
# ============================================================

import numpy as np
from sklearn.datasets import load_iris, make_classification
from sklearn.decomposition import (PCA, TruncatedSVD, KernelPCA)
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.manifold import TSNE
from sklearn.random_projection import SparseRandomProjection
from sklearn.preprocessing import StandardScaler

np.random.seed(42)
iris = load_iris()
X_iris = iris.data
y_iris = iris.target

X, y = make_classification(n_samples=300, n_features=20, n_informative=5,
                             random_state=42)
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
X_iris_scaled = scaler.fit_transform(X_iris)


# ---------------------------------------------------------------------------
# Solution 1: PCA from Scratch
# ---------------------------------------------------------------------------

def pca_scratch(X: np.ndarray, n_components: int = 2) -> tuple:
    X_centered = X - X.mean(axis=0)
    C = (X_centered.T @ X_centered) / (len(X) - 1)
    eigenvalues, eigenvectors = np.linalg.eigh(C)

    # Sort descending
    order = np.argsort(eigenvalues)[::-1]
    eigenvalues = eigenvalues[order]
    eigenvectors = eigenvectors[:, order]

    W = eigenvectors[:, :n_components]
    X_proj = X_centered @ W
    evr = eigenvalues[:n_components] / eigenvalues.sum()
    return X_proj, evr


# ---------------------------------------------------------------------------
# Solution 2: sklearn PCA
# ---------------------------------------------------------------------------

def sklearn_pca(X: np.ndarray):
    pca = PCA(n_components=2)
    X_transformed = pca.fit_transform(X)
    return pca, X_transformed


# ---------------------------------------------------------------------------
# Solution 3: Explained Variance Ratio
# ---------------------------------------------------------------------------

def explained_variance_ratio(X: np.ndarray) -> np.ndarray:
    pca = PCA()
    pca.fit(X)
    return pca.explained_variance_ratio_


# ---------------------------------------------------------------------------
# Solution 4: Components for 95% Variance
# ---------------------------------------------------------------------------

def components_for_95_variance(X: np.ndarray) -> int:
    pca = PCA()
    pca.fit(X)
    cumulative = np.cumsum(pca.explained_variance_ratio_)
    n = int(np.searchsorted(cumulative, 0.95) + 1)
    return n


# ---------------------------------------------------------------------------
# Solution 5: PCA Whitening
# ---------------------------------------------------------------------------

def pca_whitening(X: np.ndarray) -> np.ndarray:
    pca = PCA(n_components=2, whiten=True)
    X_white = pca.fit_transform(X)
    return X_white


# ---------------------------------------------------------------------------
# Solution 6: TruncatedSVD
# ---------------------------------------------------------------------------

def truncated_svd(X: np.ndarray):
    svd = TruncatedSVD(n_components=2, random_state=42)
    X_transformed = svd.fit_transform(X)
    return svd, X_transformed


# ---------------------------------------------------------------------------
# Solution 7: t-SNE
# ---------------------------------------------------------------------------

def tsne_embedding(X: np.ndarray) -> np.ndarray:
    print("  Note: t-SNE is non-parametric and cannot transform new data "
          "(no .transform() method). Only used for visualization.")
    tsne = TSNE(n_components=2, random_state=42, perplexity=30)
    return tsne.fit_transform(X)


# ---------------------------------------------------------------------------
# Solution 8: UMAP
# ---------------------------------------------------------------------------

def umap_embedding(X: np.ndarray):
    try:
        import umap
        reducer = umap.UMAP(n_components=2, random_state=42)
        return reducer.fit_transform(X)
    except ImportError:
        print("  UMAP not installed. Run: pip install umap-learn")
        return None


# ---------------------------------------------------------------------------
# Solution 9: LDA
# ---------------------------------------------------------------------------

def lda_reduction(X: np.ndarray, y: np.ndarray):
    lda = LinearDiscriminantAnalysis(n_components=2)
    X_transformed = lda.fit_transform(X, y)
    return lda, X_transformed


# ---------------------------------------------------------------------------
# Solution 10: Random Projections
# ---------------------------------------------------------------------------

def random_projection(X: np.ndarray):
    rp = SparseRandomProjection(n_components=5, random_state=42)
    X_projected = rp.fit_transform(X)
    return rp, X_projected


# ---------------------------------------------------------------------------
# Solution 11: Autoencoder Concept
# ---------------------------------------------------------------------------

def autoencoder_concept() -> str:
    arch = (
        "Autoencoder Architecture:\n"
        "  Input layer:   n_features\n"
        "  Encoder:       Dense(128, relu) → Dense(64, relu) → Dense(latent_dim, relu)\n"
        "  Bottleneck:    latent_dim (e.g. 2)\n"
        "  Decoder:       Dense(64, relu) → Dense(128, relu) → Dense(n_features, linear)\n"
        "  Loss:          MSE (reconstruction error)\n"
        "  Key idea:      Learn a compressed representation by minimizing reconstruction loss."
    )
    print(arch)
    return arch


# ---------------------------------------------------------------------------
# Solution 12: Feature Selection vs Feature Extraction
# ---------------------------------------------------------------------------

def selection_vs_extraction() -> dict:
    comparison = {
        'feature_selection': [
            'Selects a subset of original features (keeps raw features)',
            'Interpretable: retained features have original meaning',
            'Methods: filter (correlation), wrapper (RFE), embedded (Lasso)',
            'Does not combine features — no information mixing',
            'Good when features are already meaningful or sparse',
        ],
        'feature_extraction': [
            'Creates new features as combinations of original ones',
            'Less interpretable: new axes may have no direct meaning',
            'Methods: PCA, LDA, autoencoders, t-SNE',
            'Can capture non-linear structure (kernel PCA, autoencoders)',
            'Good for dense high-dimensional data (images, text embeddings)',
        ],
    }
    print("Feature Selection vs Feature Extraction:")
    for method, points in comparison.items():
        print(f"\n  {method}:")
        for p in points:
            print(f"    • {p}")
    return comparison


# ---------------------------------------------------------------------------
# Solution 13: Kernel PCA
# ---------------------------------------------------------------------------

def kernel_pca(X: np.ndarray):
    kpca = KernelPCA(n_components=2, kernel='rbf', gamma=0.1)
    X_transformed = kpca.fit_transform(X)
    return kpca, X_transformed


# ---------------------------------------------------------------------------
# Solution 14: Manifold Learning Comparison
# ---------------------------------------------------------------------------

def manifold_comparison() -> dict:
    methods = {
        'PCA':      {'linear': True,  'parametric': True,  'scalable': True,  'preserves': 'global variance'},
        't-SNE':    {'linear': False, 'parametric': False, 'scalable': False, 'preserves': 'local neighborhoods'},
        'UMAP':     {'linear': False, 'parametric': False, 'scalable': True,  'preserves': 'local + some global'},
        'LLE':      {'linear': False, 'parametric': False, 'scalable': False, 'preserves': 'local geometry'},
        'Isomap':   {'linear': False, 'parametric': False, 'scalable': False, 'preserves': 'geodesic distances'},
    }
    print("\nManifold Learning Comparison:")
    print(f"  {'Method':<10} {'Linear':<10} {'Parametric':<12} {'Scalable':<10} {'Preserves'}")
    print("  " + "-" * 65)
    for name, props in methods.items():
        print(f"  {name:<10} {str(props['linear']):<10} {str(props['parametric']):<12} "
              f"{str(props['scalable']):<10} {props['preserves']}")
    return methods


# ---------------------------------------------------------------------------
# Solution 15: Reconstruction Error
# ---------------------------------------------------------------------------

def reconstruction_error(X: np.ndarray, n_comp: int = 5) -> float:
    pca = PCA(n_components=n_comp)
    X_transformed = pca.fit_transform(X)
    X_reconstructed = pca.inverse_transform(X_transformed)
    mse = float(np.mean((X - X_reconstructed) ** 2))
    return mse


def main():
    print("=== Solution 4.2: Dimensionality Reduction ===\n")

    X_proj, evr = pca_scratch(X_scaled, n_components=2)
    print("Result 1 — PCA scratch shape:", X_proj.shape, "| EVR:", np.round(evr, 4))

    pca_model, X_pca = sklearn_pca(X_scaled)
    print("Result 2 — sklearn PCA shape:", X_pca.shape,
          "| EVR:", np.round(pca_model.explained_variance_ratio_, 4))

    evr_all = explained_variance_ratio(X_scaled)
    print("Result 3 — Explained variance ratio (first 5):", np.round(evr_all[:5], 4))

    n95 = components_for_95_variance(X_scaled)
    print("Result 4 — Components for 95% variance:", n95)

    X_white = pca_whitening(X_scaled)
    print("Result 5 — Whitened shape:", X_white.shape,
          "| component variances:", np.round(np.var(X_white, axis=0), 4))

    _, X_svd = truncated_svd(X_scaled)
    print("Result 6 — TruncatedSVD shape:", X_svd.shape)

    X_tsne = tsne_embedding(X_iris_scaled)
    print("Result 7 — t-SNE shape:", X_tsne.shape)

    X_umap = umap_embedding(X_scaled)
    print("Result 8 — UMAP:", X_umap.shape if X_umap is not None else "Not installed")

    _, X_lda = lda_reduction(X_iris_scaled, y_iris)
    print("Result 9 — LDA shape:", X_lda.shape)

    _, X_rp = random_projection(X_scaled)
    print("Result 10 — Random Projection shape:", X_rp.shape)

    arch = autoencoder_concept()
    print("Result 11 — Autoencoder: printed above")

    sve = selection_vs_extraction()
    print("Result 12 — Comparison: printed above")

    _, X_kpca = kernel_pca(X_scaled)
    print("Result 13 — Kernel PCA shape:", X_kpca.shape)

    mc = manifold_comparison()
    print("Result 14 — Manifold methods:", list(mc.keys()))

    for n_comp in [2, 5, 10]:
        err = reconstruction_error(X_scaled, n_comp=n_comp)
        print(f"Result 15 — Reconstruction error ({n_comp} comp): {round(err, 6)}")


if __name__ == "__main__":
    main()
