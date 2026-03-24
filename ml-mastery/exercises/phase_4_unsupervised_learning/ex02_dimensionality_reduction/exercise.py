# ============================================================
# Exercise 4.2 — Dimensionality Reduction
# ============================================================
# Topics:
#   • PCA from scratch (covariance → eigen decomposition)
#   • sklearn PCA: explained variance, whitening, cumulative
#   • TruncatedSVD, t-SNE, UMAP (guarded), LDA
#   • Random Projections, Kernel PCA
#   • Autoencoder concept, feature selection vs extraction
#   • Manifold learning comparison, reconstruction error
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
X_iris = iris.data          # (150, 4)
y_iris = iris.target

X, y = make_classification(n_samples=300, n_features=20, n_informative=5,
                             random_state=42)
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
X_iris_scaled = scaler.fit_transform(X_iris)


# ---------------------------------------------------------------------------
# TODO 1: PCA from Scratch
# ---------------------------------------------------------------------------
# Steps:
#   1. Center X (subtract column means).
#   2. Compute covariance matrix: C = X_centered^T @ X_centered / (n-1).
#   3. Compute eigenvalues and eigenvectors (np.linalg.eigh).
#   4. Sort eigenvectors by eigenvalue descending.
#   5. Project X onto the top `n_components` eigenvectors.
# Return (X_projected, explained_variance_ratio).

def pca_scratch(X: np.ndarray, n_components: int = 2) -> tuple:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 2: sklearn PCA
# ---------------------------------------------------------------------------
# Fit PCA(n_components=2) on X_scaled.
# Return (pca_model, X_transformed).

def sklearn_pca(X: np.ndarray):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 3: Explained Variance Ratio
# ---------------------------------------------------------------------------
# Fit PCA (all components) on X_scaled.
# Return the explained_variance_ratio_ array.

def explained_variance_ratio(X: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 4: Cumulative Explained Variance — Find n for 95%
# ---------------------------------------------------------------------------
# Fit PCA (all components) on X_scaled.
# Find the minimum number of components needed to explain >= 95% variance.
# Return that number (int).

def components_for_95_variance(X: np.ndarray) -> int:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 5: PCA Whitening
# ---------------------------------------------------------------------------
# Fit PCA(n_components=2, whiten=True) on X_scaled.
# Return the transformed data. Verify that variance of each component ≈ 1.

def pca_whitening(X: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 6: TruncatedSVD (for sparse data)
# ---------------------------------------------------------------------------
# Fit TruncatedSVD(n_components=2, random_state=42) on X_scaled.
# Return (model, X_transformed).

def truncated_svd(X: np.ndarray):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 7: t-SNE
# ---------------------------------------------------------------------------
# Fit TSNE(n_components=2, random_state=42, perplexity=30) on X_iris_scaled.
# Print a note about t-SNE: it is non-parametric and cannot transform new data.
# Return X_embedded (shape: (n_samples, 2)).

def tsne_embedding(X: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 8: UMAP (guarded)
# ---------------------------------------------------------------------------
# Try to import umap and fit UMAP(n_components=2, random_state=42).
# If unavailable, print install instruction and return None.
# Return X_embedded or None.

def umap_embedding(X: np.ndarray):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 9: Linear Discriminant Analysis (LDA)
# ---------------------------------------------------------------------------
# Fit LinearDiscriminantAnalysis(n_components=2) on (X_iris_scaled, y_iris).
# Return (model, X_transformed).

def lda_reduction(X: np.ndarray, y: np.ndarray):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 10: Random Projections
# ---------------------------------------------------------------------------
# Fit SparseRandomProjection(n_components=5, random_state=42) on X_scaled.
# Return (model, X_projected).

def random_projection(X: np.ndarray):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 11: Autoencoder Concept
# ---------------------------------------------------------------------------
# Print the architecture of a simple autoencoder (encoder + decoder layers).
# Return a string description of the architecture.

def autoencoder_concept() -> str:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 12: Feature Selection vs Feature Extraction
# ---------------------------------------------------------------------------
# Print a comparison table.
# Return a dict: {'feature_selection': [...], 'feature_extraction': [...]}
# with at least 3 key differences each.

def selection_vs_extraction() -> dict:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 13: Kernel PCA
# ---------------------------------------------------------------------------
# Fit KernelPCA(n_components=2, kernel='rbf', gamma=0.1) on X_scaled.
# Return (model, X_transformed).

def kernel_pca(X: np.ndarray):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 14: Manifold Learning Comparison
# ---------------------------------------------------------------------------
# Print a comparison table of: PCA, t-SNE, UMAP, LLE, Isomap.
# Return a dict with method names as keys, each with 'linear', 'parametric', 'scalable'.

def manifold_comparison() -> dict:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 15: Reconstruction Error after PCA
# ---------------------------------------------------------------------------
# Fit PCA(n_components=n_comp) on X_scaled. Reconstruct X.
# Reconstruction: X_reconstructed = pca.inverse_transform(pca.transform(X))
# Return MSE between X_scaled and X_reconstructed.

def reconstruction_error(X: np.ndarray, n_comp: int = 5) -> float:
    pass  # TODO: implement


def main():
    print("=== Exercise 4.2: Dimensionality Reduction ===\n")

    result1 = pca_scratch(X_scaled, n_components=2)
    print("TODO 1 — PCA scratch shape:", result1[0].shape if result1 else None,
          "| EVR:", result1[1] if result1 else None)

    result2 = sklearn_pca(X_scaled)
    print("TODO 2 — sklearn PCA shape:", result2[1].shape if result2 else None)

    evr = explained_variance_ratio(X_scaled)
    print("TODO 3 — Explained variance ratio (first 5):", evr[:5] if evr is not None else None)

    n95 = components_for_95_variance(X_scaled)
    print("TODO 4 — Components for 95% variance:", n95)

    X_white = pca_whitening(X_scaled)
    print("TODO 5 — Whitened shape:", X_white.shape if X_white is not None else None,
          "| component variances:", np.var(X_white, axis=0) if X_white is not None else None)

    result6 = truncated_svd(X_scaled)
    print("TODO 6 — TruncatedSVD shape:", result6[1].shape if result6 else None)

    X_tsne = tsne_embedding(X_iris_scaled)
    print("TODO 7 — t-SNE shape:", X_tsne.shape if X_tsne is not None else None)

    X_umap = umap_embedding(X_scaled)
    print("TODO 8 — UMAP result:", X_umap.shape if X_umap is not None else "Not installed")

    result9 = lda_reduction(X_iris_scaled, y_iris)
    print("TODO 9 — LDA shape:", result9[1].shape if result9 else None)

    result10 = random_projection(X_scaled)
    print("TODO 10 — Random Projection shape:", result10[1].shape if result10 else None)

    arch = autoencoder_concept()
    print("TODO 11 — Autoencoder concept:", arch)

    sve = selection_vs_extraction()
    print("TODO 12 — Comparison keys:", list(sve.keys()) if sve else None)

    result13 = kernel_pca(X_scaled)
    print("TODO 13 — Kernel PCA shape:", result13[1].shape if result13 else None)

    mc = manifold_comparison()
    print("TODO 14 — Manifold methods:", list(mc.keys()) if mc else None)

    err = reconstruction_error(X_scaled, n_comp=5)
    print("TODO 15 — Reconstruction error (5 comp):", round(err, 4) if err is not None else None)


if __name__ == "__main__":
    main()
