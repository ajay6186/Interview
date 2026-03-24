# ============================================================
# Solution 1.1 — Linear Algebra for ML
# ============================================================

import numpy as np


def dot_product(a: np.ndarray, b: np.ndarray) -> float:
    return np.dot(a, b)


def matrix_multiply(A: np.ndarray, B: np.ndarray) -> np.ndarray:
    return A @ B


def matrix_transpose(A: np.ndarray) -> np.ndarray:
    return A.T


def determinant(A: np.ndarray) -> float:
    return np.linalg.det(A)


def matrix_inverse(A: np.ndarray):
    try:
        return np.linalg.inv(A)
    except np.linalg.LinAlgError:
        return None


def solve_linear_system(A: np.ndarray, b: np.ndarray) -> np.ndarray:
    return np.linalg.solve(A, b)


def eigen_decomposition(A: np.ndarray):
    eigenvalues, eigenvectors = np.linalg.eig(A)
    return eigenvalues, eigenvectors


def matrix_rank(A: np.ndarray) -> int:
    return np.linalg.matrix_rank(A)


def frobenius_norm(A: np.ndarray) -> float:
    return np.linalg.norm(A, 'fro')


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


def outer_product(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    return np.outer(a, b)


def svd_decomposition(A: np.ndarray):
    U, S, Vt = np.linalg.svd(A, full_matrices=False)
    return U, S, Vt


def low_rank_approx(A: np.ndarray, k: int) -> np.ndarray:
    U, S, Vt = np.linalg.svd(A, full_matrices=False)
    return U[:, :k] @ np.diag(S[:k]) @ Vt[:k, :]


def gram_schmidt(A: np.ndarray) -> np.ndarray:
    """Gram-Schmidt orthonormalization of the rows of A."""
    vectors = A.copy().astype(float)
    n, m = vectors.shape
    Q = np.zeros_like(vectors)
    for i in range(n):
        v = vectors[i].copy()
        for j in range(i):
            v -= np.dot(Q[j], vectors[i]) * Q[j]
        norm = np.linalg.norm(v)
        Q[i] = v / norm if norm > 1e-10 else v
    return Q


def pca_components(X: np.ndarray, k: int) -> np.ndarray:
    # Center the data
    X_centered = X - X.mean(axis=0)
    # Covariance matrix (n_features x n_features)
    cov = np.cov(X_centered, rowvar=False)
    # Eigen-decomposition
    eigenvalues, eigenvectors = np.linalg.eigh(cov)
    # Sort by descending eigenvalue
    idx = np.argsort(eigenvalues)[::-1]
    eigenvectors = eigenvectors[:, idx]
    # Return top k components (n_features x k)
    return eigenvectors[:, :k]


def main():
    print("=== Solution 1.1: Linear Algebra for ML ===\n")

    a = np.array([1, 2, 3])
    b = np.array([4, 5, 6])
    A2 = np.array([[1, 2], [3, 4]], dtype=float)
    B2 = np.array([[5, 6], [7, 8]], dtype=float)
    A23 = np.array([[1, 2, 3], [4, 5, 6]], dtype=float)
    B32 = np.array([[7, 8], [9, 10], [11, 12]], dtype=float)

    print("Result 1 — Dot product:", dot_product(a, b))
    print("Result 2 — Matrix multiply:\n", matrix_multiply(A23, B32))
    print("Result 3 — Transpose:\n", matrix_transpose(A23))
    print("Result 4 — Determinant:", determinant(A2))
    print("Result 5 — Inverse:\n", matrix_inverse(A2))
    print("Result 6 — Solve Ax=b:", solve_linear_system(np.array([[2,1],[1,3]], dtype=float), np.array([5,10], dtype=float)))

    eigenvalues, eigenvectors = eigen_decomposition(A2)
    print("Result 7 — Eigenvalues:", eigenvalues)
    print("Result 7 — Eigenvectors:\n", eigenvectors)

    print("Result 8 — Rank:", matrix_rank(A23))
    print("Result 9 — Frobenius norm:", frobenius_norm(A2))
    print("Result 10 — Cosine similarity:", cosine_similarity(a, b))
    print("Result 11 — Outer product:\n", outer_product(np.array([1,2]), np.array([3,4])))

    A_rect = np.array([[1,2,3],[4,5,6],[7,8,9],[10,11,12]], dtype=float)
    U, S, Vt = svd_decomposition(A_rect)
    print("Result 12 — SVD shapes: U", U.shape, "S", S.shape, "Vt", Vt.shape)
    print("Result 13 — Low-rank (k=1) approx:\n", np.round(low_rank_approx(A_rect, k=1), 4))

    A_gs = np.array([[1, 1, 0], [1, 0, 1], [0, 1, 1]], dtype=float)
    Q = gram_schmidt(A_gs)
    print("Result 14 — Gram-Schmidt Q:\n", np.round(Q, 4))
    print("           Q @ Q.T ≈ I:\n", np.round(Q @ Q.T, 4))

    np.random.seed(42)
    X = np.random.randn(50, 4)
    comps = pca_components(X, k=2)
    print("Result 15 — PCA components shape:", comps.shape)
    print("           Top 2 principal components:\n", np.round(comps, 4))


if __name__ == "__main__":
    main()
