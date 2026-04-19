# ============================================================================
# Examples 2.3 — Linear Algebra  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np

# --- BASIC ---

# 1. matrix multiplication with @
A = np.array([[1., 2.], [3., 4.]])
B = np.array([[5., 6.], [7., 8.]])
print("Ex01 A@B:\n", A @ B)

# 2. np.matmul
print("Ex02 matmul:\n", np.matmul(A, B))

# 3. np.dot for 1D (dot product)
v1 = np.array([1., 2., 3.])
v2 = np.array([4., 5., 6.])
print("Ex03 dot:", np.dot(v1, v2))  # 32.0

# 4. np.dot for 2D (matrix multiply)
print("Ex04:\n", np.dot(A, B))

# 5. determinant
print("Ex05 det(A):", np.linalg.det(A))  # -2.0

# 6. inverse
Ainv = np.linalg.inv(A)
print("Ex06 inv(A):\n", Ainv)
print("Ex06 A@Ainv:\n", (A @ Ainv).round(10))

# 7. identity check after inverse
print("Ex07 is identity:", np.allclose(A @ Ainv, np.eye(2)))

# 8. solving linear system Ax = b
b = np.array([1., 2.])
x = np.linalg.solve(A, b)
print("Ex08 x:", x)
print("Ex08 verify:", np.allclose(A @ x, b))

# 9. trace
print("Ex09 trace:", np.trace(A))  # 5.0

# 10. L2 norm of vector
v = np.array([3., 4.])
print("Ex10 L2 norm:", np.linalg.norm(v))  # 5.0

# 11. L1 norm of vector
print("Ex11 L1 norm:", np.linalg.norm(v, ord=1))  # 7.0

# 12. L-inf norm
print("Ex12 L-inf norm:", np.linalg.norm(v, ord=np.inf))  # 4.0

# 13. Frobenius norm of matrix
C = np.array([[1., 2.], [3., 4.]])
print("Ex13 Frobenius:", np.linalg.norm(C, 'fro'))

# 14. matrix rank
singular = np.array([[1., 2.], [2., 4.]])
print("Ex14 rank:", np.linalg.matrix_rank(singular))  # 1

# 15. outer product
print("Ex15 outer:\n", np.outer(v1, v2))

# --- INTERMEDIATE ---

# 16. eigenvalues and eigenvectors
vals, vecs = np.linalg.eig(A)
print("Ex16 eigenvalues:", vals)
print("Ex16 eigenvectors:\n", vecs)

# 17. verify eigenvector: A @ v = lambda * v
for i in range(len(vals)):
    assert np.allclose(A @ vecs[:, i], vals[i] * vecs[:, i])
print("Ex17 eigenvector verification: OK")

# 18. SVD decomposition
U, s, Vt = np.linalg.svd(A)
print("Ex18 singular values:", s)

# 19. SVD reconstruction
A_recon = U @ np.diag(s) @ Vt
print("Ex19 SVD reconstruction:", np.allclose(A_recon, A))

# 20. least squares solution
X = np.array([[1., 1.], [1., 2.], [1., 3.]])
y = np.array([1., 2., 2.])
coeffs, residuals, rank, sv = np.linalg.lstsq(X, y, rcond=None)
print("Ex20 lstsq coeffs:", coeffs.round(4))

# 21. pseudoinverse (Moore-Penrose)
print("Ex21 pinv:\n", np.linalg.pinv(X).round(4))

# 22. Cholesky decomposition (positive definite matrix)
PD = np.array([[4., 2.], [2., 3.]])
L = np.linalg.cholesky(PD)
print("Ex22 Cholesky L:\n", L)
print("Ex22 L@L.T == PD:", np.allclose(L @ L.T, PD))

# 23. QR decomposition
Q, R = np.linalg.qr(A)
print("Ex23 Q:\n", Q.round(4))
print("Ex23 R:\n", R.round(4))
print("Ex23 Q@R == A:", np.allclose(Q @ R, A))

# 24. matrix power (integer power)
print("Ex24 A^3:\n", np.linalg.matrix_power(A, 3))

# 25. matrix power (inverse = power -1)
print("Ex25 A^-1:\n", np.linalg.matrix_power(A, -1).round(4))

# 26. condition number
print("Ex26 cond(A):", np.linalg.cond(A).round(4))

# 27. solve multiple RHS at once
B_rhs = np.array([[1., 0.], [0., 1.]])
X_sols = np.linalg.solve(A, B_rhs)
print("Ex27 solve multiple RHS:\n", X_sols)

# 28. cross product (3D vectors)
u = np.array([1., 0., 0.])
v3 = np.array([0., 1., 0.])
print("Ex28 cross:", np.cross(u, v3))  # [0, 0, 1]

# 29. Gram-Schmidt orthogonalization (manual)
def gram_schmidt(X_gs):
    Q_gs = np.zeros_like(X_gs)
    for i in range(X_gs.shape[1]):
        v_gs = X_gs[:, i].copy()
        for j in range(i):
            v_gs -= np.dot(Q_gs[:, j], X_gs[:, i]) * Q_gs[:, j]
        Q_gs[:, i] = v_gs / np.linalg.norm(v_gs)
    return Q_gs
M_gs = np.array([[1., 2.], [0., 1.]], dtype=float)
print("Ex29 Gram-Schmidt:\n", gram_schmidt(M_gs).round(4))

# 30. projection of vector onto another
def project(u_p, v_p):
    return (np.dot(u_p, v_p) / np.dot(v_p, v_p)) * v_p
print("Ex30 projection:", project(np.array([3., 4.]), np.array([1., 0.])))

# --- ADVANCED ---

# 31. symmetric positive definite matrix and its properties
SPD = np.array([[4., 1.], [1., 3.]])
print("Ex31 eigenvalues of SPD (all >0):", np.linalg.eigvalsh(SPD))

# 32. eigvalsh (symmetric — more stable)
print("Ex32 eigvalsh:", np.linalg.eigvalsh(SPD))

# 33. matrix exponential via diagonalization
D, V = np.linalg.eig(A)
# e^A = V @ diag(e^D) @ V^-1 (approximate for illustration)
print("Ex33 matrix exp diagonalization check:", np.allclose(V @ np.diag(D) @ np.linalg.inv(V), A))

# 34. null space concept (via SVD)
M_ns = np.array([[1., 2., 3.], [4., 5., 6.]])
U_ns, s_ns, Vt_ns = np.linalg.svd(M_ns)
print("Ex34 singular values:", s_ns)  # last is near-zero → rank deficient

# 35. Tikhonov regularization (ridge regression)
lam = 0.1
X_r = np.array([[1., 1.], [1., 2.], [1., 3.]])
y_r = np.array([1., 2., 2.])
# w = (X^T X + lam I)^-1 X^T y
XtX = X_r.T @ X_r
Xty = X_r.T @ y_r
w_ridge = np.linalg.solve(XtX + lam * np.eye(2), Xty)
print("Ex35 ridge coefficients:", w_ridge.round(4))

# 36. low-rank approximation via SVD
np.random.seed(42)
M_lr = np.random.rand(5, 5)
U_lr, s_lr, Vt_lr = np.linalg.svd(M_lr)
k = 2
M_approx = U_lr[:, :k] @ np.diag(s_lr[:k]) @ Vt_lr[:k, :]
print("Ex36 approx error:", np.linalg.norm(M_lr - M_approx).round(4))

# 37. angle between two vectors
a_ang = np.array([1., 0.])
b_ang = np.array([1., 1.]) / np.sqrt(2)
cos_theta = np.dot(a_ang, b_ang) / (np.linalg.norm(a_ang) * np.linalg.norm(b_ang))
print("Ex37 angle (degrees):", np.degrees(np.arccos(cos_theta)).round(2))

# 38. rotation matrix
theta = np.pi / 4
R = np.array([[np.cos(theta), -np.sin(theta)],
              [np.sin(theta),  np.cos(theta)]])
print("Ex38 rotation matrix:\n", R.round(4))
print("Ex38 det(R):", np.linalg.det(R).round(4))  # should be 1

# 39. Hadamard product (element-wise, not matmul)
print("Ex39 Hadamard:", A * B)

# 40. Kronecker product
print("Ex40 kron:\n", np.kron(np.eye(2, dtype=int), np.array([[1, 2], [3, 4]])))

# 41. tensor contraction with einsum
T = np.random.rand(3, 3, 3)
print("Ex41 trace over last two dims:", np.einsum('iii', T))

# 42. batched matrix multiply
batch_A = np.random.rand(4, 3, 3)
batch_B = np.random.rand(4, 3, 3)
batch_C = np.einsum('bij,bjk->bik', batch_A, batch_B)
print("Ex42 batched matmul shape:", batch_C.shape)

# --- EXPERT ---

# 43. LU decomposition via scipy (shown conceptually with linalg)
A_lu = np.array([[2., 1., -1.], [-3., -1., 2.], [-2., 1., 2.]])
print("Ex43 rank:", np.linalg.matrix_rank(A_lu))

# 44. generalized inverse (Moore-Penrose)
A_rect = np.array([[1., 2., 3.], [4., 5., 6.]])
A_pinv = np.linalg.pinv(A_rect)
print("Ex44 pinv shape:", A_pinv.shape)  # (3, 2)

# 45. verify pseudoinverse: A @ pinv(A) @ A == A
print("Ex45 A @ pinv @ A == A:", np.allclose(A_rect @ A_pinv @ A_rect, A_rect))

# 46. solve overdetermined system with lstsq
X_od = np.column_stack([np.ones(5), np.arange(5.)])
y_od = np.array([2., 3., 3.5, 4., 5.])
w, _, _, _ = np.linalg.lstsq(X_od, y_od, rcond=None)
print("Ex46 lstsq weights:", w.round(4))

# 47. power iteration for dominant eigenvector
def power_iteration(M_pi, n_iter=50):
    b = np.random.rand(M_pi.shape[0])
    for _ in range(n_iter):
        b_new = M_pi @ b
        b = b_new / np.linalg.norm(b_new)
    return b
eig_vec = power_iteration(A)
print("Ex47 power iter eigenvector:", eig_vec.round(4))

# 48. Householder reflector
v_h = np.array([1., 2., 3.])
v_h = v_h / np.linalg.norm(v_h)
H = np.eye(3) - 2 * np.outer(v_h, v_h)
print("Ex48 Householder det:", np.linalg.det(H).round(4))  # -1

# 49. matrix condition and numerical stability demo
ill_cond = np.array([[1., 1.], [1., 1. + 1e-10]])
print("Ex49 condition number:", np.linalg.cond(ill_cond))

# 50. multi-RHS solve and verify
A_mr = np.random.rand(4, 4)
A_mr = A_mr + 4 * np.eye(4)  # ensure well-conditioned
B_mr = np.random.rand(4, 3)
X_mr = np.linalg.solve(A_mr, B_mr)
print("Ex50 multi-RHS verify:", np.allclose(A_mr @ X_mr, B_mr))


def main():
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
