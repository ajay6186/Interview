# ============================================================================
# Examples 2.1 — Broadcasting  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np

# --- BASIC ---

# 1. scalar broadcast to 1D
arr = np.array([1, 2, 3])
print("Ex01:", arr + 10)  # [11 12 13]

# 2. scalar broadcast to 2D
mat = np.arange(6).reshape(2, 3)
print("Ex02:\n", mat * 2)

# 3. 1D array added to 2D (broadcast along rows)
row = np.array([1, 2, 3])
print("Ex03:\n", mat + row)

# 4. column vector broadcast
col = np.array([[10], [20]])
print("Ex04:\n", mat + col)

# 5. shapes (3,) and (1,3) are equivalent
print("Ex05:", np.ones((3,)).shape, np.ones((1, 3)).shape)

# 6. (3,1) + (3,) → (3,3)
a = np.array([[1], [2], [3]])
b = np.array([10, 20, 30])
print("Ex06:\n", a + b)

# 7. outer product via broadcasting
x = np.array([1, 2, 3, 4])
y = np.array([1, 2, 3])
print("Ex07 outer:\n", x[:, None] * y)

# 8. broadcast comparison
print("Ex08:", (np.arange(5) > 2))  # [F F F T T]

# 9. broadcast subtract mean (column-wise centering)
mat2 = np.array([[1., 4.], [2., 6.], [3., 8.]])
print("Ex09 centered:\n", mat2 - mat2.mean(axis=0))

# 10. broadcast subtract mean (row-wise centering)
print("Ex10 row-centered:\n", mat2 - mat2.mean(axis=1, keepdims=True))

# 11. np.broadcast_to — no copy
bcast = np.broadcast_to(np.array([1, 2, 3]), (4, 3))
print("Ex11 shape:", bcast.shape)

# 12. broadcasting with 3D array
a3 = np.ones((2, 3, 4))
b3 = np.ones((3, 4))
print("Ex12:", (a3 + b3).shape)  # (2,3,4)

# 13. broadcasting with (2,1,4) + (1,3,1) → (2,3,4)
a4 = np.ones((2, 1, 4))
b4 = np.ones((1, 3, 1))
print("Ex13:", (a4 + b4).shape)  # (2,3,4)

# 14. np.broadcast_shapes (NumPy 1.20+)
print("Ex14:", np.broadcast_shapes((3, 1), (1, 4)))  # (3, 4)

# 15. arithmetic between scalar and 2D
print("Ex15:\n", 100 - np.arange(6).reshape(2, 3))

# --- INTERMEDIATE ---

# 16. normalize columns (feature scaling)
X = np.array([[1., 2.], [3., 4.], [5., 6.]])
X_norm = (X - X.min(axis=0)) / (X.max(axis=0) - X.min(axis=0))
print("Ex16 normalized:\n", X_norm)

# 17. normalize rows
X_row_norm = (X - X.min(axis=1, keepdims=True)) / (X.max(axis=1, keepdims=True) - X.min(axis=1, keepdims=True))
print("Ex17:\n", X_row_norm)

# 18. add bias term (column of ones)
bias = np.ones((3, 1))
X_bias = np.hstack([X, bias])
print("Ex18:\n", X_bias)

# 19. pairwise difference (1D)
pts = np.array([1., 3., 6., 10.])
diff_mat = pts[:, None] - pts[None, :]
print("Ex19:\n", diff_mat)

# 20. pairwise distance squared (1D)
print("Ex20:", diff_mat ** 2)

# 21. broadcasting for indicator matrix
labels = np.array([0, 1, 2, 1, 0])
n_classes = 3
one_hot = (labels[:, None] == np.arange(n_classes))
print("Ex21 one-hot:\n", one_hot.astype(int))

# 22. tile vs broadcast_to
tiled = np.tile(np.array([1, 2, 3]), (4, 1))
bcast2 = np.broadcast_to(np.array([1, 2, 3]), (4, 3))
print("Ex22 tile writeable:", tiled.flags.writeable)
print("Ex22 broadcast writeable:", bcast2.flags.writeable)

# 23. sum over broadcast result
a_bcast = np.arange(3)[:, None]
b_bcast = np.arange(4)[None, :]
result = a_bcast + b_bcast
print("Ex23:\n", result)

# 24. distance matrix 2D points
pts2d = np.array([[0., 0.], [3., 4.], [6., 0.]])
diff2d = pts2d[:, None, :] - pts2d[None, :, :]
dist = np.sqrt(np.sum(diff2d**2, axis=-1))
print("Ex24 distances:\n", dist.round(2))

# 25. matrix times vector (each row scaled)
weights = np.array([2., 0.5, 1.])
mat3 = np.ones((4, 3))
print("Ex25:\n", mat3 * weights)

# 26. broadcasting with boolean mask
m = np.arange(12).reshape(3, 4)
threshold = np.array([2, 5, 8])
print("Ex26:\n", (m > threshold[:, None]).astype(int))

# 27. column-wise division (normalize by column max)
col_max = m.max(axis=0)
print("Ex27:\n", m / col_max)

# 28. row-wise division (normalize by row sum)
row_sum = m.sum(axis=1, keepdims=True)
print("Ex28:\n", m / row_sum.astype(float))

# 29. outer sum (addition table)
print("Ex29:\n", np.arange(1, 5)[:, None] + np.arange(1, 5)[None, :])

# 30. outer product (multiplication table)
print("Ex30:\n", np.arange(1, 6)[:, None] * np.arange(1, 6)[None, :])

# --- ADVANCED ---

# 31. softmax using broadcasting
def softmax(x):
    e = np.exp(x - x.max(axis=-1, keepdims=True))
    return e / e.sum(axis=-1, keepdims=True)
logits = np.array([[1., 2., 3.], [1., 1., 1.]])
print("Ex31 softmax:\n", softmax(logits).round(4))

# 32. cosine similarity matrix
def cosine_sim(A):
    norms = np.linalg.norm(A, axis=1, keepdims=True)
    return A @ A.T / (norms * norms.T)
A_vecs = np.array([[1., 0.], [0., 1.], [1., 1.]])
print("Ex32 cosine sim:\n", cosine_sim(A_vecs).round(4))

# 33. log-sum-exp trick
x_lse = np.array([[1., 2., 3.], [4., 5., 6.]])
max_x = x_lse.max(axis=1, keepdims=True)
lse = max_x.ravel() + np.log(np.exp(x_lse - max_x).sum(axis=1))
print("Ex33 log-sum-exp:", lse.round(4))

# 34. centered kernel alignment placeholder
K = np.random.rand(5, 5)
K = K + K.T  # symmetric
n = K.shape[0]
H = np.eye(n) - np.ones((n, n)) / n
K_centered = H @ K @ H
print("Ex34 K_centered shape:", K_centered.shape)

# 35. rolling z-score via cumulative stats (concept)
data2 = np.array([2., 4., 4., 4., 5., 5., 7., 9.])
z = (data2 - data2.mean()) / data2.std()
print("Ex35 z-scores:", z.round(3))

# 36. image channel normalization (H, W, C) pattern
image = np.random.rand(4, 4, 3).astype(np.float32)
mean_c = image.mean(axis=(0, 1))
std_c = image.std(axis=(0, 1))
img_norm = (image - mean_c) / std_c
print("Ex36 img_norm mean:", img_norm.mean(axis=(0, 1)).round(6))

# 37. batch matrix-vector multiply: (B, M, N) @ (B, N) → (B, M)
B, M, N = 3, 4, 5
mats = np.random.rand(B, M, N)
vecs = np.random.rand(B, N)
# use einsum
result2 = np.einsum('bmn,bn->bm', mats, vecs)
print("Ex37 batch matvec shape:", result2.shape)

# 38. broadcasting in fancy indexing context
idx_rows = np.array([0, 1, 2])
idx_cols = np.array([0, 1, 2])
m2 = np.arange(9).reshape(3, 3)
print("Ex38 diagonal:", m2[idx_rows, idx_cols])

# 39. rank-1 update: A + u * v^T
A_rank = np.zeros((3, 3))
u = np.array([1., 2., 3.])
v = np.array([4., 5., 6.])
A_updated = A_rank + u[:, None] * v[None, :]
print("Ex39:\n", A_updated)

# 40. modular arithmetic table
n2 = 6
print("Ex40 mod table:\n", np.arange(n2)[:, None] % np.arange(1, n2 + 1)[None, :])

# 41. pairwise L1 distance
pts1d = np.array([1., 3., 6., 10., 15.])
l1 = np.abs(pts1d[:, None] - pts1d[None, :])
print("Ex41 L1 dist:\n", l1)

# 42. clamp columns independently
mat_raw = np.arange(12, dtype=float).reshape(3, 4)
col_min = np.array([0., 2., 4., 6.])
col_max = np.array([5., 7., 9., 11.])
clamped = np.clip(mat_raw, col_min, col_max)
print("Ex42:\n", clamped)

# --- EXPERT ---

# 43. np.broadcast object
b1 = np.empty((2, 1))
b2 = np.empty((1, 3))
bcast_obj = np.broadcast(b1, b2)
print("Ex43 broadcast shape:", bcast_obj.shape)

# 44. broadcasting error — mismatched shapes
try:
    bad = np.ones((3, 4)) + np.ones((2, 4))
except ValueError as e:
    print("Ex44 expected error:", e)

# 45. np.broadcast_to raises on incorrect shape
try:
    bad2 = np.broadcast_to(np.array([1, 2, 3]), (2, 4))
except ValueError as e:
    print("Ex45 expected error:", e)

# 46. stacked broadcast for polynomial evaluation
coeffs = np.array([1., -3., 2.])  # 1 - 3x + 2x^2
x_pts = np.linspace(0, 2, 5)
powers = x_pts[:, None] ** np.arange(len(coeffs))[None, :]
poly_vals = powers @ coeffs
print("Ex46 poly values:", poly_vals.round(3))

# 47. vectorized sigmoid
def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-x))
print("Ex47 sigmoid:", sigmoid(np.array([-2., 0., 2.])).round(4))

# 48. vectorized ReLU
def relu(x):
    return np.maximum(0, x)
print("Ex48 relu:", relu(np.array([-3., -1., 0., 1., 3.])))

# 49. broadcasting in gradient computation (MSE gradient)
y_pred = np.array([1., 2., 3., 4.])
y_true = np.array([1.5, 2.5, 2.5, 3.5])
grad = 2 * (y_pred - y_true) / len(y_true)
print("Ex49 MSE gradient:", grad)

# 50. generalized outer product for 3 vectors
a_g = np.array([1., 2.])
b_g = np.array([3., 4., 5.])
c_g = np.array([6., 7., 8., 9.])
result3 = a_g[:, None, None] * b_g[None, :, None] * c_g[None, None, :]
print("Ex50 3-way outer shape:", result3.shape)  # (2, 3, 4)


def main():
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
