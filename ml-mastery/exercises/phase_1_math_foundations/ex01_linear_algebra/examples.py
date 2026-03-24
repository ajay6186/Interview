# ============================================================
# Examples 1.1 — Linear Algebra for ML (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
from numpy.linalg import (norm, det, inv, solve, eig, matrix_rank,
                           svd, cholesky, qr, cond, pinv)
import scipy.linalg as sla
import scipy.sparse as sp

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Create a vector"""
    v = np.array([1.0, 2.0, 3.0, 4.0])
    print("Ex01 —", v)

def ex02():
    """Vector addition"""
    a = np.array([1.0, 2.0, 3.0])
    b = np.array([4.0, 5.0, 6.0])
    result = a + b
    print("Ex02 —", result)

def ex03():
    """Scalar multiplication"""
    v = np.array([1.0, 2.0, 3.0])
    result = 3.5 * v
    print("Ex03 —", result)

def ex04():
    """Dot product"""
    a = np.array([1.0, 2.0, 3.0])
    b = np.array([4.0, 5.0, 6.0])
    result = np.dot(a, b)
    print("Ex04 —", result)

def ex05():
    """Vector L2 norm"""
    v = np.array([3.0, 4.0])
    result = norm(v)
    print("Ex05 —", result)

def ex06():
    """Vector L1 norm"""
    v = np.array([-1.0, 2.0, -3.0])
    result = norm(v, ord=1)
    print("Ex06 —", result)

def ex07():
    """Matrix creation (2x3)"""
    M = np.array([[1, 2, 3], [4, 5, 6]], dtype=float)
    print("Ex07 —\n", M)

def ex08():
    """Matrix addition"""
    A = np.array([[1, 2], [3, 4]], dtype=float)
    B = np.array([[5, 6], [7, 8]], dtype=float)
    result = A + B
    print("Ex08 —\n", result)

def ex09():
    """Matrix-vector multiply"""
    A = np.array([[1, 2], [3, 4]], dtype=float)
    v = np.array([1.0, 2.0])
    result = A @ v
    print("Ex09 —", result)

def ex10():
    """Matrix-matrix multiply"""
    A = np.array([[1, 2], [3, 4]], dtype=float)
    B = np.array([[5, 6], [7, 8]], dtype=float)
    result = A @ B
    print("Ex10 —\n", result)

def ex11():
    """Matrix transpose"""
    A = np.array([[1, 2, 3], [4, 5, 6]], dtype=float)
    result = A.T
    print("Ex11 —\n", result)

def ex12():
    """Identity matrix"""
    I = np.eye(4)
    print("Ex12 —\n", I)

def ex13():
    """Zeros and ones matrices"""
    Z = np.zeros((2, 3))
    O = np.ones((2, 3))
    print("Ex13 — zeros:\n", Z, "\nones:\n", O)

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Matrix determinant"""
    A = np.array([[3, 8], [4, 6]], dtype=float)
    result = det(A)
    print("Ex14 —", result)

def ex15():
    """Matrix inverse"""
    A = np.array([[1, 2], [3, 4]], dtype=float)
    result = inv(A)
    print("Ex15 —\n", result)

def ex16():
    """Solve linear system Ax = b"""
    A = np.array([[2, 1], [5, 7]], dtype=float)
    b = np.array([11.0, 13.0])
    x = solve(A, b)
    print("Ex16 —", x)

def ex17():
    """Eigenvalues of a matrix"""
    A = np.array([[4, -2], [1, 1]], dtype=float)
    eigenvalues, _ = eig(A)
    print("Ex17 —", eigenvalues)

def ex18():
    """Eigenvectors of a matrix"""
    A = np.array([[4, -2], [1, 1]], dtype=float)
    _, eigenvectors = eig(A)
    print("Ex18 —\n", eigenvectors)

def ex19():
    """Matrix rank"""
    A = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]], dtype=float)
    result = matrix_rank(A)
    print("Ex19 —", result)

def ex20():
    """Frobenius norm"""
    A = np.array([[1, 2], [3, 4]], dtype=float)
    result = norm(A, 'fro')
    print("Ex20 —", result)

def ex21():
    """Matrix trace"""
    A = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]], dtype=float)
    result = np.trace(A)
    print("Ex21 —", result)

def ex22():
    """Outer product of two vectors"""
    a = np.array([1.0, 2.0, 3.0])
    b = np.array([4.0, 5.0])
    result = np.outer(a, b)
    print("Ex22 —\n", result)

def ex23():
    """Cosine similarity between two vectors"""
    a = np.array([1.0, 2.0, 3.0])
    b = np.array([4.0, 5.0, 6.0])
    cos_sim = np.dot(a, b) / (norm(a) * norm(b))
    print("Ex23 —", cos_sim)

def ex24():
    """Projection of vector a onto vector b"""
    a = np.array([3.0, 4.0])
    b = np.array([1.0, 0.0])
    proj = (np.dot(a, b) / np.dot(b, b)) * b
    print("Ex24 —", proj)

def ex25():
    """Gram-Schmidt orthogonalization (2 vectors)"""
    v1 = np.array([1.0, 1.0, 0.0])
    v2 = np.array([1.0, 0.0, 1.0])
    u1 = v1 / norm(v1)
    u2 = v2 - np.dot(v2, u1) * u1
    u2 = u2 / norm(u2)
    print("Ex25 — u1:", np.round(u1, 4), "u2:", np.round(u2, 4))

def ex26():
    """Orthonormal basis check (dot products should be 0 and 1)"""
    u1 = np.array([1.0, 0.0])
    u2 = np.array([0.0, 1.0])
    dot_cross = np.dot(u1, u2)
    dot_self1 = np.dot(u1, u1)
    dot_self2 = np.dot(u2, u2)
    print(f"Ex26 — u1·u2={dot_cross}, u1·u1={dot_self1}, u2·u2={dot_self2}")

# ─── NESTED (27–38) ────────────────────────────────────────

def ex27():
    """SVD decomposition"""
    A = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]], dtype=float)
    U, s, Vt = svd(A)
    print("Ex27 — singular values:", np.round(s, 4))

def ex28():
    """Low-rank approximation via SVD (rank-1)"""
    A = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]], dtype=float)
    U, s, Vt = svd(A, full_matrices=False)
    A_approx = s[0] * np.outer(U[:, 0], Vt[0, :])
    error = norm(A - A_approx, 'fro')
    print("Ex28 — rank-1 approx Frobenius error:", round(error, 4))

def ex29():
    """PCA via covariance matrix and eigendecomposition"""
    np.random.seed(0)
    X = np.random.randn(50, 3)
    X -= X.mean(axis=0)
    cov = np.cov(X.T)
    eigvals, eigvecs = np.linalg.eigh(cov)
    order = np.argsort(eigvals)[::-1]
    explained = eigvals[order] / eigvals.sum()
    print("Ex29 — explained variance ratios:", np.round(explained, 4))

def ex30():
    """Matrix factorization UV decomposition (random init, one step)"""
    np.random.seed(1)
    R = np.array([[5, 3, 0], [4, 0, 4], [1, 1, 0]], dtype=float)
    k = 2
    U = np.random.rand(3, k)
    V = np.random.rand(k, 3)
    approx = U @ V
    error = norm(R - approx, 'fro')
    print("Ex30 — UV decomp init error:", round(error, 4))

def ex31():
    """LinearAlgebra class wrapping common operations"""
    class LinearAlgebra:
        def __init__(self, A):
            self.A = np.array(A, dtype=float)
        def trace(self):
            return np.trace(self.A)
        def frobenius(self):
            return norm(self.A, 'fro')
        def rank(self):
            return matrix_rank(self.A)
    la = LinearAlgebra([[1, 2], [3, 4]])
    print(f"Ex31 — trace={la.trace()}, frobenius={la.frobenius():.4f}, rank={la.rank()}")

def ex32():
    """Cholesky decomposition"""
    A = np.array([[4, 2], [2, 3]], dtype=float)
    L = cholesky(A)
    print("Ex32 — L:\n", np.round(L, 4))

def ex33():
    """QR decomposition"""
    A = np.array([[1, 2], [3, 4], [5, 6]], dtype=float)
    Q, R = qr(A)
    print("Ex33 — R:\n", np.round(R, 4))

def ex34():
    """LU decomposition"""
    A = np.array([[2, 1, 1], [4, 3, 3], [8, 7, 9]], dtype=float)
    P, L, U = sla.lu(A)
    print("Ex34 — U:\n", np.round(U, 4))

def ex35():
    """Condition number"""
    A = np.array([[1, 2], [3, 4]], dtype=float)
    c = cond(A)
    print("Ex35 — condition number:", round(c, 4))

def ex36():
    """Pseudo-inverse (Moore-Penrose)"""
    A = np.array([[1, 2], [3, 4], [5, 6]], dtype=float)
    A_pinv = pinv(A)
    print("Ex36 — pseudo-inverse:\n", np.round(A_pinv, 4))

def ex37():
    """Schur decomposition"""
    A = np.array([[1, 2], [3, 4]], dtype=float)
    T, Z = sla.schur(A)
    print("Ex37 — Schur T diagonal:", np.round(np.diag(T), 4))

def ex38():
    """Spectral norm (largest singular value)"""
    A = np.array([[1, 2, 3], [4, 5, 6]], dtype=float)
    spectral = norm(A, ord=2)
    print("Ex38 — spectral norm:", round(spectral, 4))

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Power iteration for dominant eigenvector"""
    np.random.seed(0)
    A = np.array([[4, 1], [2, 3]], dtype=float)
    v = np.random.rand(2)
    for _ in range(100):
        v = A @ v
        v = v / norm(v)
    eigenvalue = float(v @ A @ v)
    print(f"Ex39 — dominant eigenvector: {np.round(v, 4)}, eigenvalue≈{eigenvalue:.4f}")

def ex40():
    """Randomized (truncated) SVD concept via random projection"""
    np.random.seed(0)
    A = np.random.randn(20, 10)
    k = 3
    Omega = np.random.randn(10, k)
    Y = A @ Omega
    Q, _ = qr(Y)
    B = Q.T @ A
    _, s, _ = svd(B, full_matrices=False)
    print("Ex40 — randomized SVD top singular values:", np.round(s[:k], 4))

def ex41():
    """Sparse matrix operations (scipy.sparse)"""
    data = np.array([1.0, 2.0, 3.0])
    row = np.array([0, 1, 2])
    col = np.array([0, 1, 2])
    S = sp.csr_matrix((data, (row, col)), shape=(3, 3))
    dense = S.toarray()
    print("Ex41 — sparse diagonal matrix:\n", dense)

def ex42():
    """Kronecker product"""
    A = np.array([[1, 2], [3, 4]], dtype=float)
    B = np.eye(2)
    result = np.kron(A, B)
    print("Ex42 — Kronecker product shape:", result.shape, "\n", result)

def ex43():
    """Vectorized batch matrix-vector operations"""
    np.random.seed(0)
    batch_A = np.random.randn(5, 3, 3)
    batch_v = np.random.randn(5, 3)
    result = np.einsum('bij,bj->bi', batch_A, batch_v)
    print("Ex43 — batch Mv shape:", result.shape, "first result:", np.round(result[0], 4))

def ex44():
    """Hadamard (element-wise) product"""
    A = np.array([[1, 2], [3, 4]], dtype=float)
    B = np.array([[5, 6], [7, 8]], dtype=float)
    H = A * B
    print("Ex44 — Hadamard product:\n", H)

def ex45():
    """Matrix exponential"""
    A = np.array([[0, 1], [-1, 0]], dtype=float)
    expA = sla.expm(A)
    print("Ex45 — matrix exponential:\n", np.round(expA, 4))

def ex46():
    """Circulant matrix"""
    c = np.array([1.0, 2.0, 3.0, 4.0])
    C = sla.circulant(c)
    print("Ex46 — circulant matrix:\n", C)

def ex47():
    """Toeplitz matrix"""
    c = np.array([1.0, 2.0, 3.0])
    r = np.array([1.0, 4.0, 5.0])
    T = sla.toeplitz(c, r)
    print("Ex47 — Toeplitz matrix:\n", T)

def ex48():
    """Linear system solve: numpy vs scipy comparison"""
    np.random.seed(0)
    n = 50
    A = np.random.randn(n, n)
    A = A @ A.T + np.eye(n) * 0.1
    b = np.random.randn(n)
    x_np = np.linalg.solve(A, b)
    x_sp = sla.solve(A, b)
    diff = norm(x_np - x_sp)
    print(f"Ex48 — numpy vs scipy solve diff: {diff:.2e}")

def ex49():
    """Ill-conditioned system detection"""
    epsilon = 1e-12
    A_ill = np.array([[1, 1], [1, 1 + epsilon]], dtype=float)
    c = cond(A_ill)
    is_ill = c > 1e10
    print(f"Ex49 — condition number: {c:.4e}, ill-conditioned: {is_ill}")

def ex50():
    """Numerical stability analysis: catastrophic cancellation example"""
    x = 1e8
    a = x + 1.0
    b = x
    direct = a - b
    expected = 1.0
    error = abs(direct - expected)
    print(f"Ex50 — catastrophic cancellation: computed={direct}, expected={expected}, error={error:.2e}")

def main():
    print("=" * 60)
    print("Examples 1.1 — Linear Algebra for ML")
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
