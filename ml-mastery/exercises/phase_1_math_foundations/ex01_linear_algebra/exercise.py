# ============================================================
# Exercise 1.1 — Linear Algebra for ML
# ============================================================
# Topics:
#   • Vectors and matrices (dot product, multiplication, transpose)
#   • Determinant, inverse, rank, norms
#   • Eigenvalues and eigenvectors
#   • SVD and low-rank approximation
#   • Cosine similarity, outer product
#   • Gram-Schmidt orthogonalization
#   • PCA via covariance matrix
# ============================================================

import numpy as np

# ---------------------------------------------------------------------------
# TODO 1: Vector Dot Product
# ---------------------------------------------------------------------------
# Given two 1-D numpy arrays a and b, return their dot product.
# Expected: dot_product(np.array([1,2,3]), np.array([4,5,6])) == 32

def dot_product(a: np.ndarray, b: np.ndarray) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 2: Matrix Multiplication
# ---------------------------------------------------------------------------
# Given two 2-D numpy arrays A and B, return their matrix product A @ B.
# Expected: result shape (2,2) for A(2,3) @ B(3,2)

def matrix_multiply(A: np.ndarray, B: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 3: Matrix Transpose
# ---------------------------------------------------------------------------
# Return the transpose of matrix A.
# Expected: transpose([[1,2,3],[4,5,6]]).shape == (3, 2)

def matrix_transpose(A: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 4: Matrix Determinant
# ---------------------------------------------------------------------------
# Return the determinant of square matrix A using numpy.
# Expected: determinant(np.array([[1,2],[3,4]])) == -2.0

def determinant(A: np.ndarray) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 5: Matrix Inverse
# ---------------------------------------------------------------------------
# Return the inverse of square matrix A. Return None if singular.
# Expected: matrix_inverse(np.eye(3)) == np.eye(3)

def matrix_inverse(A: np.ndarray):
    pass  # TODO: implement (use try/except for singular case)


# ---------------------------------------------------------------------------
# TODO 6: Solve Linear System Ax = b
# ---------------------------------------------------------------------------
# Given matrix A and vector b, solve for x in Ax = b using numpy.
# Expected: solve_linear_system(np.array([[2,1],[1,3]]), np.array([5,10])) approx [1, 3]

def solve_linear_system(A: np.ndarray, b: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 7: Eigenvalues and Eigenvectors
# ---------------------------------------------------------------------------
# Return (eigenvalues, eigenvectors) of square matrix A.
# Each column of eigenvectors matrix is an eigenvector.
# Expected: returns tuple of (array of eigenvalues, 2D array of eigenvectors)

def eigen_decomposition(A: np.ndarray):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 8: Matrix Rank
# ---------------------------------------------------------------------------
# Return the rank of matrix A.
# Expected: matrix_rank(np.eye(3)) == 3

def matrix_rank(A: np.ndarray) -> int:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 9: Frobenius Norm
# ---------------------------------------------------------------------------
# Return the Frobenius norm of matrix A (sqrt of sum of squared elements).
# Expected: frobenius_norm(np.array([[1,2],[3,4]])) == sqrt(30)

def frobenius_norm(A: np.ndarray) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 10: Cosine Similarity
# ---------------------------------------------------------------------------
# Return the cosine similarity between vectors a and b.
# cos(theta) = (a . b) / (||a|| * ||b||)
# Expected: cosine_similarity(np.array([1,0]), np.array([1,0])) == 1.0

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 11: Outer Product
# ---------------------------------------------------------------------------
# Return the outer product of vectors a and b.
# outer[i,j] = a[i] * b[j]
# Expected: outer_product(np.array([1,2]), np.array([3,4])).shape == (2,2)

def outer_product(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 12: SVD Decomposition
# ---------------------------------------------------------------------------
# Return (U, S, Vt) from Singular Value Decomposition of matrix A.
# A = U @ diag(S) @ Vt
# Expected: U.shape, S.shape, Vt.shape for a (4,3) input matrix

def svd_decomposition(A: np.ndarray):
    pass  # TODO: implement (full_matrices=False for economy SVD)


# ---------------------------------------------------------------------------
# TODO 13: Low-Rank Approximation using SVD
# ---------------------------------------------------------------------------
# Reconstruct matrix A using only the top k singular values/vectors.
# A_k = U[:, :k] @ diag(S[:k]) @ Vt[:k, :]
# Expected: low_rank_approx(A, k=1).shape == A.shape

def low_rank_approx(A: np.ndarray, k: int) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 14: Gram-Schmidt Orthogonalization
# ---------------------------------------------------------------------------
# Given a list of linearly independent vectors (rows of A), return an
# orthonormal basis using the Gram-Schmidt process (implement manually).
# Expected: columns of result are orthonormal (Q.T @ Q ≈ I)

def gram_schmidt(A: np.ndarray) -> np.ndarray:
    pass  # TODO: implement without using np.linalg.qr


# ---------------------------------------------------------------------------
# TODO 15: PCA via Covariance Matrix
# ---------------------------------------------------------------------------
# Given data matrix X (n_samples x n_features), return the top k principal
# component directions (eigenvectors of the covariance matrix, sorted by
# descending eigenvalue).
# Steps: center X, compute cov matrix, eigen-decompose, sort, return top k.
# Expected: pca_components(X, k=2).shape == (n_features, 2)

def pca_components(X: np.ndarray, k: int) -> np.ndarray:
    pass  # TODO: implement


def main():
    print("=== Exercise 1.1: Linear Algebra for ML ===\n")

    a = np.array([1, 2, 3])
    b = np.array([4, 5, 6])
    A2 = np.array([[1, 2], [3, 4]], dtype=float)
    B2 = np.array([[5, 6], [7, 8]], dtype=float)
    A23 = np.array([[1, 2, 3], [4, 5, 6]], dtype=float)
    B32 = np.array([[7, 8], [9, 10], [11, 12]], dtype=float)

    print("TODO 1 — Dot product:", dot_product(a, b))
    print("TODO 2 — Matrix multiply:\n", matrix_multiply(A23, B32))
    print("TODO 3 — Transpose:\n", matrix_transpose(A23))
    print("TODO 4 — Determinant:", determinant(A2))
    print("TODO 5 — Inverse:\n", matrix_inverse(A2))
    print("TODO 6 — Solve Ax=b:", solve_linear_system(np.array([[2,1],[1,3]], dtype=float), np.array([5,10], dtype=float)))

    eigenvalues, eigenvectors = eigen_decomposition(A2) if eigen_decomposition(A2) is not None else (None, None)
    print("TODO 7 — Eigenvalues:", eigenvalues)
    print("TODO 7 — Eigenvectors:\n", eigenvectors)

    print("TODO 8 — Rank:", matrix_rank(A23))
    print("TODO 9 — Frobenius norm:", frobenius_norm(A2))
    print("TODO 10 — Cosine similarity:", cosine_similarity(a, b))
    print("TODO 11 — Outer product:\n", outer_product(np.array([1,2]), np.array([3,4])))

    A_rect = np.array([[1,2,3],[4,5,6],[7,8,9],[10,11,12]], dtype=float)
    svd_result = svd_decomposition(A_rect)
    if svd_result is not None:
        U, S, Vt = svd_result
        print("TODO 12 — SVD shapes: U", U.shape, "S", S.shape, "Vt", Vt.shape)
        print("TODO 13 — Low-rank (k=1) approx:\n", low_rank_approx(A_rect, k=1))

    A_gs = np.array([[1, 1, 0], [1, 0, 1], [0, 1, 1]], dtype=float)
    Q = gram_schmidt(A_gs)
    print("TODO 14 — Gram-Schmidt Q:\n", Q)

    np.random.seed(42)
    X = np.random.randn(50, 4)
    comps = pca_components(X, k=2)
    print("TODO 15 — PCA components shape:", comps.shape if comps is not None else None)


if __name__ == "__main__":
    main()
