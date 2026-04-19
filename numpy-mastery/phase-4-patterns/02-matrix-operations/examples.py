# ============================================================================
# Examples 4.2 — Matrix Operations  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np

# --- BASIC ---

# 1. eigenvalues and eigenvectors
A = np.array([[4., 1.], [2., 3.]])
vals, vecs = np.linalg.eig(A)
print("Ex01 eigenvalues:", vals)
print("Ex01 eigenvectors:\n", vecs)

# 2. verify Av = lambda*v
for i in range(len(vals)):
    print(f"Ex02 Av=lambda*v {i}:", np.allclose(A @ vecs[:,i], vals[i] * vecs[:,i]))

# 3. eigvalsh for symmetric (real eigenvalues, sorted)
S = np.array([[3., 1.], [1., 3.]])
print("Ex03 eigvalsh:", np.linalg.eigvalsh(S))

# 4. SVD of rectangular matrix
M = np.array([[1., 2., 3.], [4., 5., 6.]])
U, s, Vt = np.linalg.svd(M)
print("Ex04 singular values:", s)

# 5. SVD with full_matrices=False (economy SVD)
U2, s2, Vt2 = np.linalg.svd(M, full_matrices=False)
print("Ex05 economy U shape:", U2.shape, "Vt shape:", Vt2.shape)

# 6. reconstruct from SVD
M_r = U2 @ np.diag(s2) @ Vt2
print("Ex06 SVD reconstruction:", np.allclose(M_r, M))

# 7. rank-1 approximation via truncated SVD
M_rank1 = s2[0] * np.outer(U2[:,0], Vt2[0,:])
print("Ex07 rank-1 approx error:", np.linalg.norm(M - M_rank1).round(4))

# 8. Cholesky decomposition
PD = np.array([[4., 2.], [2., 3.]])
L = np.linalg.cholesky(PD)
print("Ex08 L:\n", L)
print("Ex08 L@L.T == PD:", np.allclose(L @ L.T, PD))

# 9. least squares
x = np.linspace(0., 5., 20)
y = 3. * x + 2. + np.random.RandomState(0).randn(20)
X = np.column_stack([np.ones_like(x), x])
w, res, rank, sv = np.linalg.lstsq(X, y, rcond=None)
print("Ex09 coeffs:", w.round(3))

# 10. matrix rank
M2 = np.array([[1., 2., 3.], [2., 4., 6.]])
print("Ex10 rank:", np.linalg.matrix_rank(M2))

# 11. pseudoinverse
pinv = np.linalg.pinv(M2)
print("Ex11 pinv shape:", pinv.shape)

# 12. pseudoinverse property: A @ pinv(A) @ A == A
print("Ex12 pinv property:", np.allclose(M2 @ pinv @ M2, M2))

# 13. matrix_rank of random matrix
R = np.random.rand(4, 4)
print("Ex13 rank of random 4x4:", np.linalg.matrix_rank(R))

# 14. QR decomposition
Q, Rmat = np.linalg.qr(A)
print("Ex14 Q:\n", Q.round(4))
print("Ex14 Q@R == A:", np.allclose(Q @ Rmat, A))

# 15. trace and its relation to eigenvalues
print("Ex15 trace:", np.trace(A), "sum of eigenvalues:", vals.sum().real)

# --- INTERMEDIATE ---

# 16. determinant and product of eigenvalues
print("Ex16 det:", np.linalg.det(A).round(4), "prod eigenvalues:", np.prod(vals).real.round(4))

# 17. characteristic polynomial (manually)
# For 2x2: lambda^2 - trace*lambda + det = 0
import numpy as np
tr = np.trace(A)
det = np.linalg.det(A)
print("Ex17 char poly roots:", np.roots([1., -tr, det]))

# 18. SVD-based matrix norm
print("Ex18 spectral norm (sigma_max):", np.linalg.norm(M, ord=2).round(4))

# 19. nuclear norm (sum of singular values)
print("Ex19 nuclear norm:", np.sum(s2).round(4))

# 20. condition number = sigma_max / sigma_min
print("Ex20 condition number:", (s2.max() / s2.min()).round(4))

# 21. thin SVD and least squares connection
X2 = np.column_stack([np.ones(10), np.linspace(0,1,10)])
y2 = np.array([1.,1.2,1.4,1.6,1.8,2.,2.2,2.4,2.6,2.8])
Uq, sq, Vtq = np.linalg.svd(X2, full_matrices=False)
w2 = Vtq.T @ (np.diag(1./sq) @ (Uq.T @ y2))
print("Ex21 SVD lstsq:", w2.round(4))

# 22. PCA via SVD
np.random.seed(42)
X3 = np.random.randn(50, 4)
X3_c = X3 - X3.mean(axis=0)
U3, s3, Vt3 = np.linalg.svd(X3_c, full_matrices=False)
# components = rows of Vt3
print("Ex22 PCA components shape:", Vt3.shape)
# project to 2D
X3_proj = X3_c @ Vt3[:2].T
print("Ex22 projected shape:", X3_proj.shape)

# 23. explained variance ratio
explained = s3**2 / np.sum(s3**2)
print("Ex23 explained variance:", explained.round(3))

# 24. low-rank matrix approximation quality
rank_k = 1
M3 = np.random.rand(6, 6)
U4, s4, Vt4 = np.linalg.svd(M3, full_matrices=False)
M3_approx = (s4[:rank_k] * U4[:,:rank_k]) @ Vt4[:rank_k,:]
err = np.linalg.norm(M3 - M3_approx, 'fro')
print("Ex24 rank-1 approximation error:", err.round(4))

# 25. null space via SVD (rows of Vt corresponding to zero singular values)
A_null = np.array([[1., 2., 3.], [4., 5., 6.], [7., 8., 9.]])
U5, s5, Vt5 = np.linalg.svd(A_null)
null_vecs = Vt5[s5 < 1e-10]
print("Ex25 null space vectors:", null_vecs.shape)

# 26. column space via SVD
col_space = U5[:, :np.sum(s5 > 1e-10)]
print("Ex26 column space basis:", col_space.shape)

# 27. solving overdetermined system with lstsq
A_over = np.array([[1.,1.],[1.,2.],[1.,3.],[1.,4.]])
b_over = np.array([2., 3., 3.5, 4.])
sol, _, _, _ = np.linalg.lstsq(A_over, b_over, rcond=None)
print("Ex27 overdetermined solution:", sol.round(4))

# 28. Tikhonov regularization (ridge) via augmented system
lam = 0.1
A_aug = np.vstack([A_over, np.sqrt(lam) * np.eye(A_over.shape[1])])
b_aug = np.concatenate([b_over, np.zeros(A_over.shape[1])])
sol_ridge, _, _, _ = np.linalg.lstsq(A_aug, b_aug, rcond=None)
print("Ex28 ridge solution:", sol_ridge.round(4))

# 29. matrix exponential approximation (first 5 terms of Taylor series)
def matrix_exp_approx(M_in, terms=10):
    result = np.eye(M_in.shape[0])
    term = np.eye(M_in.shape[0])
    for k in range(1, terms):
        term = term @ M_in / k
        result += term
    return result
A_small = np.array([[0., 1.], [-1., 0.]]) * 0.1
print("Ex29 matrix exp approx:\n", matrix_exp_approx(A_small).round(4))

# 30. power method for dominant eigenvalue
def power_method(M_pm, n_iter=100):
    b = np.random.rand(M_pm.shape[0])
    for _ in range(n_iter):
        b_new = M_pm @ b
        b = b_new / np.linalg.norm(b_new)
    eigval = (b @ M_pm @ b) / (b @ b)
    return eigval, b
eigval, eigvec = power_method(A)
print("Ex30 dominant eigenvalue:", eigval.real.round(4))

# --- ADVANCED ---

# 31. generalized eigenvalue problem Av = lambda Bv (manual via Cholesky)
A31 = np.array([[2., 1.], [1., 3.]])
B31 = np.array([[1., 0.], [0., 2.]])
L31 = np.linalg.cholesky(B31)
L31_inv = np.linalg.inv(L31)
C31 = L31_inv @ A31 @ L31_inv.T
vals31, _ = np.linalg.eigh(C31)
print("Ex31 gen eigenvalues:", vals31)

# 32. matrix square root via eigendecomposition
S32 = np.array([[4., 2.], [2., 3.]])
vals32, vecs32 = np.linalg.eigh(S32)
sqrt_S = vecs32 @ np.diag(np.sqrt(vals32)) @ vecs32.T
print("Ex32 sqrt_S @ sqrt_S == S:", np.allclose(sqrt_S @ sqrt_S, S32))

# 33. Schur decomposition concept (triangularize via QR iteration)
# Numpy doesn't have schur, but we can check via eig
print("Ex33 eig values:", np.linalg.eigvals(A).round(4))

# 34. Cayley-Hamilton theorem: p(A) = 0 for characteristic polynomial
tr34 = np.trace(A)
det34 = np.linalg.det(A)
# p(A) = A^2 - tr*A + det*I
pA = A @ A - tr34 * A + det34 * np.eye(2)
print("Ex34 Cayley-Hamilton p(A) ~0:", np.allclose(pA, 0., atol=1e-10))

# 35. sparse linear system via dense inv (small example)
A35 = np.array([[4., -1., 0.], [-1., 4., -1.], [0., -1., 4.]])
b35 = np.array([1., 2., 3.])
x35 = np.linalg.solve(A35, b35)
print("Ex35 solution:", x35.round(4))
print("Ex35 verify:", np.allclose(A35 @ x35, b35))

# 36. incomplete Cholesky concept (modified for stability)
A36 = np.array([[6., 2., 1.], [2., 5., 1.], [1., 1., 4.]])
L36 = np.linalg.cholesky(A36)
print("Ex36 Cholesky L:\n", L36.round(4))

# 37. condition number and numerical stability
A_ill = np.array([[1., 1.+1e-8], [1., 1.]])
print("Ex37 condition number:", np.linalg.cond(A_ill))

# 38. SVD for image compression concept
np.random.seed(42)
img = np.random.rand(20, 20)
U_img, s_img, Vt_img = np.linalg.svd(img)
k = 5
img_approx = U_img[:,:k] @ np.diag(s_img[:k]) @ Vt_img[:k,:]
compression_ratio = (k*(20+20+1)) / (20*20)
print("Ex38 compression ratio:", compression_ratio.round(3))

# 39. matrix factorization for collaborative filtering (concept)
# Ratings matrix R = U @ Vt
np.random.seed(42)
R = np.random.rand(5, 4)
k39 = 2
U39, s39, Vt39 = np.linalg.svd(R, full_matrices=False)
R_approx = U39[:,:k39] @ np.diag(s39[:k39]) @ Vt39[:k39,:]
print("Ex39 factorization error:", np.linalg.norm(R - R_approx).round(4))

# 40. Fisher's linear discriminant analysis (LDA) concept
np.random.seed(42)
class1 = np.random.randn(20, 2) + np.array([2., 2.])
class2 = np.random.randn(20, 2) + np.array([-2., -2.])
m1, m2 = class1.mean(axis=0), class2.mean(axis=0)
Sw = class1.T @ class1 + class2.T @ class2  # within-class scatter
w_lda = np.linalg.solve(Sw, m1 - m2)
print("Ex40 LDA direction:", (w_lda / np.linalg.norm(w_lda)).round(3))

# 41. kernel matrix (RBF)
X_k = np.array([[1., 0.], [0., 1.], [1., 1.]])
gamma = 1.
diff_k = X_k[:, None, :] - X_k[None, :, :]
K = np.exp(-gamma * np.sum(diff_k**2, axis=-1))
print("Ex41 RBF kernel:\n", K.round(4))

# 42. Nystrom approximation concept
K_sub = K[:2, :2]
K_sub_inv = np.linalg.inv(K_sub)
K_approx = K[:, :2] @ K_sub_inv @ K[:2, :]
print("Ex42 Nystrom approx:\n", K_approx.round(4))

# --- EXPERT ---

# 43. gradient of log determinant: d/dA log|det(A)| = A^{-T}
A43 = np.array([[3., 1.], [1., 2.]])
A43_inv = np.linalg.inv(A43)
print("Ex43 grad log det:", A43_inv.T.round(4))

# 44. Kronecker product and its SVD
A44 = np.array([[1., 2.], [3., 4.]])
B44 = np.eye(2)
kron_AB = np.kron(A44, B44)
print("Ex44 kron shape:", kron_AB.shape)

# 45. matrix pencil method concept
# For generalized eigenvalue A v = lambda B v
A45 = np.array([[2., 0.], [0., 3.]])
B45 = np.array([[1., 0.], [0., 1.]])
print("Ex45 gen eig (diagonal):", np.linalg.eigvals(A45))

# 46. Sylvester equation AX + XB = C (manual small)
# For diagonal A, B this simplifies
A46 = np.diag([1., 2.])
B46 = np.diag([3., 4.])
C46 = np.ones((2,2))
# X_ij = C_ij / (A_ii + B_jj)
X46 = C46 / (A46[:, None] + B46[None, :])
# Actually A_ii not correct — use row broadcasting
A46_diag = np.diag(A46)[:, None]  # (2,1)
B46_diag = np.diag(B46)[None, :]  # (1,2)
X46 = C46 / (A46_diag + B46_diag)
print("Ex46 Sylvester solution:\n", X46.round(4))

# 47. block matrix operations
A_b = np.eye(2)
B_b = np.ones((2,2))
C_b = np.zeros((2,2))
D_b = np.eye(2) * 2
block = np.block([[A_b, B_b], [C_b, D_b]])
print("Ex47 block matrix:\n", block)

# 48. apply SVD to compute matrix pseudoinverse manually
def manual_pinv(M_in, tol=1e-10):
    U_m, s_m, Vt_m = np.linalg.svd(M_in, full_matrices=False)
    s_inv = np.where(s_m > tol, 1./s_m, 0.)
    return Vt_m.T @ np.diag(s_inv) @ U_m.T
M_test = np.array([[1., 2., 3.], [4., 5., 6.]])
print("Ex48 manual pinv matches:", np.allclose(manual_pinv(M_test), np.linalg.pinv(M_test)))

# 49. Frobenius inner product <A, B>_F = trace(A^T B)
A49 = np.random.rand(3, 3)
B49 = np.random.rand(3, 3)
frob_ip = np.trace(A49.T @ B49)
frob_ip2 = np.sum(A49 * B49)  # equivalent
print("Ex49 Frobenius inner products equal:", np.isclose(frob_ip, frob_ip2))

# 50. deflation: remove dominant eigenvector to find next eigenvalue
A50 = np.array([[5., 2.], [2., 5.]])
vals50, vecs50 = np.linalg.eigh(A50)
# dominant eigenvector
v0 = vecs50[:, -1:]
A50_deflated = A50 - vals50[-1] * v0 @ v0.T
print("Ex50 deflated eigenvalues:", np.linalg.eigvalsh(A50_deflated).round(4))


def main():
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
