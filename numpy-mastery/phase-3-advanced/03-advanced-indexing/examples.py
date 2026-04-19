# ============================================================================
# Examples 3.3 — Advanced Indexing  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np

# --- BASIC ---

# 1. np.ix_ for cross-product indexing
mat = np.arange(25).reshape(5, 5)
ri, ci = np.ix_(np.array([0, 2]), np.array([1, 3]))
print("Ex01 ix_ submatrix:\n", mat[ri, ci])

# 2. np.meshgrid — 2D grid from 1D arrays
x = np.array([1., 2., 3.])
y = np.array([10., 20.])
XX, YY = np.meshgrid(x, y)
print("Ex02 XX:\n", XX)
print("Ex02 YY:\n", YY)

# 3. meshgrid for function evaluation
Z = XX ** 2 + YY
print("Ex03 Z = x^2 + y:\n", Z)

# 4. np.diag — extract diagonal from 2D
m = np.arange(9).reshape(3, 3)
print("Ex04 diagonal:", np.diag(m))  # [0, 4, 8]

# 5. np.diag — create diagonal matrix from 1D
print("Ex05 diag matrix:\n", np.diag(np.array([1., 2., 3.])))

# 6. np.diag with k offset
print("Ex06 super-diag:", np.diag(m, k=1))  # [1, 5]
print("Ex06 sub-diag:", np.diag(m, k=-1))   # [3, 7]

# 7. np.triu — upper triangular
print("Ex07 triu:\n", np.triu(np.ones((4, 4))))

# 8. np.tril — lower triangular
print("Ex08 tril:\n", np.tril(np.ones((4, 4))))

# 9. np.triu with offset k
print("Ex09 triu k=1 (strictly upper):\n", np.triu(np.ones((3, 3)), k=1))

# 10. np.tril with offset
print("Ex10 tril k=-1 (strictly lower):\n", np.tril(np.ones((3, 3)), k=-1))

# 11. np.take — gather by flat index
arr = np.array([10., 20., 30., 40., 50.])
print("Ex11 take:", np.take(arr, [2, 0, 4]))

# 12. np.take along axis
mat2 = np.arange(12).reshape(3, 4)
print("Ex12 take rows:", np.take(mat2, [0, 2], axis=0))

# 13. np.put — scatter
target = np.zeros(8)
np.put(target, [1, 3, 5, 7], [100, 200, 300, 400])
print("Ex13:", target)

# 14. np.triu_indices — indices of upper triangle
r, c = np.triu_indices(4)
print("Ex14 upper tri elements:", mat2[:4, :4][r, c])

# 15. np.tril_indices
r2, c2 = np.tril_indices(3)
print("Ex15 lower tri elements:", np.arange(9).reshape(3, 3)[r2, c2])

# --- INTERMEDIATE ---

# 16. np.meshgrid with ij indexing (matrix indexing)
x2, y2 = np.linspace(0, 1, 3), np.linspace(0, 1, 4)
XX2, YY2 = np.meshgrid(x2, y2, indexing='ij')
print("Ex16 ij-indexed shape:", XX2.shape, YY2.shape)  # (3,4) not (4,3)

# 17. np.indices — grid of indices
rows_idx, cols_idx = np.indices((3, 4))
print("Ex17 row indices:\n", rows_idx)

# 18. using np.indices for formula evaluation
r_i, c_i = np.indices((4, 4))
print("Ex18 r+c grid:\n", r_i + c_i)

# 19. np.ogrid — open mesh
y_o, x_o = np.ogrid[:4, :4]
print("Ex19 circle mask:\n", ((x_o-1.5)**2 + (y_o-1.5)**2 <= 2.25).astype(int))

# 20. np.mgrid — dense mesh
x_mg, y_mg = np.mgrid[0:3, 0:3]
print("Ex20 mgrid x:\n", x_mg)

# 21. np.fill_diagonal — modify diagonal in place
mat3 = np.zeros((4, 4))
np.fill_diagonal(mat3, np.array([1., 2., 3., 4.]))
print("Ex21:\n", mat3)

# 22. np.fill_diagonal with wrap=True (for non-square)
mat4 = np.zeros((3, 6))
np.fill_diagonal(mat4, 1., wrap=True)
print("Ex22:\n", mat4)

# 23. np.diag_indices — get diagonal indices
di_r, di_c = np.diag_indices(4)
mat5 = np.zeros((4, 4))
mat5[di_r, di_c] = np.array([10., 20., 30., 40.])
print("Ex23:\n", mat5)

# 24. np.diag_indices_from
mat6 = np.eye(3)
di2_r, di2_c = np.diag_indices_from(mat6)
print("Ex24 diag indices:", di2_r, di2_c)

# 25. anti-diagonal extraction
mat7 = np.arange(1, 10).reshape(3, 3)
anti_diag = np.diag(np.fliplr(mat7))
print("Ex25 anti-diagonal:", anti_diag)

# 26. np.ix_ with boolean arrays
rows_b = np.array([True, False, True, False, True])
cols_b = np.array([False, True, False, True, False])
ri2, ci2 = np.ix_(np.where(rows_b)[0], np.where(cols_b)[0])
print("Ex26:\n", mat[ri2, ci2])

# 27. 3D ix_ selection
arr3d = np.arange(27).reshape(3, 3, 3)
ri3, ci3, di3 = np.ix_([0, 2], [1], [0, 2])
print("Ex27 3D ix_:", arr3d[ri3, ci3, di3])

# 28. np.take_along_axis
scores = np.array([[9, 3, 7], [5, 8, 2]])
top_idx = np.argsort(scores, axis=1)[:, -1:]  # index of max per row
print("Ex28 top score per row:", np.take_along_axis(scores, top_idx, axis=1))

# 29. np.put_along_axis — scatter along axis
target2 = np.zeros((2, 3))
vals = np.array([[99.], [88.]])
np.put_along_axis(target2, top_idx, vals, axis=1)
print("Ex29 put_along_axis:\n", target2)

# 30. np.choose — select from multiple arrays
selector = np.array([0, 1, 2, 0])
choices = [np.array([10, 20, 30, 40]),
           np.array([1, 2, 3, 4]),
           np.array([100, 200, 300, 400])]
print("Ex30 choose:", np.choose(selector, choices))

# --- ADVANCED ---

# 31. triu_indices for strictly upper
n3 = 5
r_u, c_u = np.triu_indices(n3, k=1)
m8 = np.arange(n3*n3).reshape(n3, n3)
print("Ex31 upper elements:", m8[r_u, c_u])

# 32. build correlation mask (upper triangle)
corr = np.corrcoef(np.random.rand(4, 10))
mask_corr = np.triu(np.ones((4, 4), dtype=bool), k=1)
print("Ex32 upper corr values:", corr[mask_corr].round(3))

# 33. np.unravel_index for N-D argmax
mat9 = np.random.rand(4, 5, 3)
flat_max_idx = np.argmax(mat9)
nd_idx = np.unravel_index(flat_max_idx, mat9.shape)
print("Ex33 ND argmax:", nd_idx)

# 34. np.ravel_multi_index — reverse of unravel
flat_back = np.ravel_multi_index(nd_idx, mat9.shape)
print("Ex34 flat index back:", flat_back == flat_max_idx)

# 35. gather operation (like tf.gather)
embedding = np.random.rand(100, 16)  # 100 tokens, 16-dim
token_ids = np.array([5, 12, 42, 7])
gathered = embedding[token_ids]
print("Ex35 gathered shape:", gathered.shape)

# 36. scatter operation (like np.add.at)
counts = np.zeros(10)
events = np.array([3, 3, 5, 7, 3, 5])
np.add.at(counts, events, 1)
print("Ex36 counts:", counts)

# 37. one-hot encode using indexing
n_classes = 5
labels = np.array([0, 2, 4, 1, 3])
one_hot = np.zeros((len(labels), n_classes))
one_hot[np.arange(len(labels)), labels] = 1.
print("Ex37 one-hot:\n", one_hot.astype(int))

# 38. batch gather from 3D tensor
batch_tensor = np.random.rand(4, 10, 8)  # (batch, seq, features)
seq_indices = np.array([2, 5, 1, 8])  # one index per batch element
gathered_3d = batch_tensor[np.arange(4), seq_indices, :]
print("Ex38 batch gather shape:", gathered_3d.shape)

# 39. np.ix_ to compute outer product
a_o = np.array([1., 2., 3.])
b_o = np.array([10., 20., 30., 40.])
ai, bi = np.ix_(a_o, b_o)
print("Ex39 outer product shape:", (ai * bi).shape)

# 40. np.tril_indices for packing lower triangular
n4 = 4
li_r, li_c = np.tril_indices(n4)
mat10 = np.arange(n4*n4).reshape(n4, n4)
lower_vals = mat10[li_r, li_c]
print("Ex40 lower tri values:", lower_vals)

# 41. reconstruct matrix from lower tri values
mat11 = np.zeros((n4, n4))
mat11[li_r, li_c] = lower_vals
mat11[li_c, li_r] = lower_vals  # mirror
print("Ex41 symmetric:\n", mat11)

# 42. advanced: selecting k-th diagonal
k_diag = 2
r_kd, c_kd = np.triu_indices(5, k=k_diag)
# filter to just the k-th diagonal
mask_k = (c_kd - r_kd) == k_diag
mat12 = np.arange(25).reshape(5, 5)
print("Ex42 k=2 diagonal:", mat12[r_kd[mask_k], c_kd[mask_k]])

# --- EXPERT ---

# 43. building sparse matrix pattern via indices
n5 = 5
rows_sp = np.array([0, 1, 2, 3, 4])
cols_sp = (rows_sp + 1) % n5
values_sp = np.ones(n5)
sparse_mat = np.zeros((n5, n5))
sparse_mat[rows_sp, cols_sp] = values_sp
print("Ex43 cyclic matrix:\n", sparse_mat.astype(int))

# 44. bilinear interpolation indices
def bilinear_interp(img, y, x):
    y0, x0 = int(y), int(x)
    y1, x1 = min(y0+1, img.shape[0]-1), min(x0+1, img.shape[1]-1)
    a, b = y - y0, x - x0
    return (1-a)*(1-b)*img[y0,x0] + (1-a)*b*img[y0,x1] + a*(1-b)*img[y1,x0] + a*b*img[y1,x1]
img_test = np.arange(25.).reshape(5, 5)
print("Ex44 bilinear at (1.5,2.5):", bilinear_interp(img_test, 1.5, 2.5))

# 45. gather-scatter pipeline
source_mat = np.arange(20.).reshape(4, 5)
gather_rows = np.array([0, 2, 1])
gathered_m = source_mat[gather_rows]
print("Ex45 gathered rows:\n", gathered_m)

# 46. permutation matrix via fancy indexing
perm = np.array([2, 0, 3, 1])
P = np.zeros((4, 4))
P[np.arange(4), perm] = 1.
print("Ex46 permutation matrix:\n", P.astype(int))

# 47. trace using diagonal indexing
large = np.random.rand(100, 100)
trace_manual = np.sum(large[np.arange(100), np.arange(100)])
print("Ex47 trace matches:", np.isclose(trace_manual, np.trace(large)))

# 48. band matrix construction
n6 = 6
band = np.zeros((n6, n6))
for k2 in [-1, 0, 1]:
    ki, kj = (np.arange(max(0,-k2), min(n6, n6-k2)),
              np.arange(max(0,k2), min(n6, n6+k2)))
    band[ki, kj] = 1.
print("Ex48 tridiagonal:\n", band.astype(int))

# 49. np.ix_ for 3D cross product selection
cube = np.arange(64).reshape(4, 4, 4)
sel = cube[np.ix_([0,2], [1,3], [0,3])]
print("Ex49 3D cross selection shape:", sel.shape)

# 50. block diagonal matrix via indexing
def block_diag(*arrays):
    sizes = [a.shape[0] for a in arrays]
    total = sum(sizes)
    result = np.zeros((total, total))
    offset = 0
    for a in arrays:
        n = a.shape[0]
        result[offset:offset+n, offset:offset+n] = a
        offset += n
    return result
bd = block_diag(np.eye(2), np.ones((3,3)))
print("Ex50 block diag shape:", bd.shape)


def main():
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
