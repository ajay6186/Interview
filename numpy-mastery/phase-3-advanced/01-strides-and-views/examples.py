# ============================================================================
# Examples 3.1 — Strides and Views  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np
from numpy.lib.stride_tricks import as_strided

# --- BASIC ---

# 1. strides of a 1D array
arr1d = np.array([1, 2, 3, 4], dtype=np.int32)
print("Ex01 strides 1D:", arr1d.strides)  # (4,) — 4 bytes per int32

# 2. strides of a 2D C-order array
arr2d_c = np.zeros((3, 4), dtype=np.float64)
print("Ex02 strides 2D C:", arr2d_c.strides)  # (32, 8) — 4 cols * 8 bytes, 8 bytes

# 3. strides of a Fortran-order array
arr2d_f = np.asfortranarray(arr2d_c)
print("Ex03 strides 2D F:", arr2d_f.strides)  # (8, 24)

# 4. C-contiguous check
print("Ex04 C:", arr2d_c.flags['C_CONTIGUOUS'], "F:", arr2d_c.flags['F_CONTIGUOUS'])

# 5. F-contiguous check
print("Ex05 C:", arr2d_f.flags['C_CONTIGUOUS'], "F:", arr2d_f.flags['F_CONTIGUOUS'])

# 6. slice creates a view (shared memory)
base = np.arange(10, dtype=np.float64)
view = base[2:8]
print("Ex06 shares_memory:", np.shares_memory(view, base))

# 7. copy breaks memory link
copy = base[2:8].copy()
print("Ex07 copy shares:", np.shares_memory(copy, base))

# 8. reshape creates view when possible
reshaped = base.reshape(2, 5)
print("Ex08 reshape shares:", np.shares_memory(reshaped, base))

# 9. modifying view changes original
view[0] = 999
print("Ex09 base[2] changed:", base[2])

# 10. modifying copy does NOT change original
copy[0] = -1
print("Ex10 base[2] unchanged after copy mod:", base[2])

# 11. transpose creates a view
mat = np.arange(12, dtype=np.float64).reshape(3, 4)
mat_T = mat.T
print("Ex11 T shares:", np.shares_memory(mat_T, mat))

# 12. transposed strides (reversed)
print("Ex12 mat strides:", mat.strides, "mat.T strides:", mat_T.strides)

# 13. np.ascontiguousarray makes C-contiguous copy if needed
mat_T_c = np.ascontiguousarray(mat_T)
print("Ex13 is C-contiguous:", mat_T_c.flags['C_CONTIGUOUS'])

# 14. np.asfortranarray makes Fortran-contiguous
mat_f = np.asfortranarray(mat)
print("Ex14 is F-contiguous:", mat_f.flags['F_CONTIGUOUS'])

# 15. strides of a sliced array (non-contiguous)
every_other = base[::2]
print("Ex15 every_other strides:", every_other.strides)  # (16,) — skips 2 float64s

# --- INTERMEDIATE ---

# 16. sliding window with as_strided
sig = np.arange(10, dtype=np.float64)
window = 4
n = len(sig) - window + 1
wins = as_strided(sig, shape=(n, window), strides=(sig.strides[0], sig.strides[0]))
print("Ex16 windows:\n", wins)

# 17. sliding window mean
print("Ex17 rolling mean:", wins.mean(axis=1))

# 18. non-overlapping blocks with as_strided
block_size = 3
n_blocks = len(sig) // block_size  # 3 blocks from 9 elements
blocks = as_strided(sig[:9], shape=(n_blocks, block_size),
                    strides=(sig.strides[0] * block_size, sig.strides[0]))
print("Ex18 non-overlapping blocks:\n", blocks)

# 19. 2D sliding window (image patch extraction concept)
img = np.arange(16, dtype=np.float64).reshape(4, 4)
patch_h, patch_w = 2, 2
out_h = img.shape[0] - patch_h + 1
out_w = img.shape[1] - patch_w + 1
patches = as_strided(
    img,
    shape=(out_h, out_w, patch_h, patch_w),
    strides=(img.strides[0], img.strides[1], img.strides[0], img.strides[1])
)
print("Ex19 patches shape:", patches.shape)  # (3, 3, 2, 2)

# 20. itemsize and element count
a = np.zeros((5, 6), dtype=np.float32)
print("Ex20 itemsize:", a.itemsize, "nbytes:", a.nbytes, "size:", a.size)

# 21. manual stride calculation: row stride = n_cols * itemsize
rows, cols = 5, 4
a2 = np.zeros((rows, cols), dtype=np.float64)
expected_strides = (cols * a2.itemsize, a2.itemsize)
print("Ex21 strides match:", a2.strides == expected_strides)

# 22. stride tricks for matrix diagonal
n = 4
mat2 = np.arange(n*n, dtype=np.float64).reshape(n, n)
diag_view = as_strided(mat2, shape=(n,), strides=(mat2.strides[0] + mat2.strides[1],))
print("Ex22 diagonal:", diag_view)

# 23. np.lib.stride_tricks.sliding_window_view (NumPy 1.20+)
try:
    from numpy.lib.stride_tricks import sliding_window_view
    sw = sliding_window_view(np.arange(8), window_shape=3)
    print("Ex23 sliding_window_view:", sw)
except ImportError:
    print("Ex23 sliding_window_view not available (NumPy < 1.20)")

# 24. view with different dtype (reinterpretation)
a_i32 = np.array([1, 2, 3, 4], dtype=np.int32)
a_u8 = a_i32.view(np.uint8)
print("Ex24 uint8 view:", a_u8)

# 25. writeable flag
bcast_view = np.broadcast_to(np.array([1, 2, 3]), (4, 3))
print("Ex25 broadcast writeable:", bcast_view.flags.writeable)

# 26. copy makes writeable
bcast_copy = bcast_view.copy()
bcast_copy[0, 0] = 99
print("Ex26 after copy modification:", bcast_copy[0, 0])

# 27. OWNDATA flag
a3 = np.array([1, 2, 3])
v3 = a3[:]
print("Ex27 a3 OWNDATA:", a3.flags.owndata, "v3 OWNDATA:", v3.flags.owndata)

# 28. strides for 3D array
a4 = np.zeros((2, 3, 4), dtype=np.float64)
print("Ex28 3D strides:", a4.strides)  # (96, 32, 8)

# 29. view through fancy indexing creates copy
a5 = np.arange(10)
fancy = a5[np.array([0, 2, 4])]
fancy[0] = 99
print("Ex29 base unchanged:", a5[0])  # 0

# 30. understanding why non-contiguous views can't always reshape
nc = np.arange(12).reshape(3, 4)[:, ::2]  # shape (3, 2), non-contiguous
try:
    nc.reshape(6)
    print("Ex30 reshape succeeded (made copy)")
except AttributeError:
    pass
print("Ex30 shape:", nc.shape)

# --- ADVANCED ---

# 31. stride tricks for Hankel matrix
x = np.array([1., 2., 3., 4., 5., 6.])
r, c = 4, 3
hankel = as_strided(x, shape=(r, c), strides=(x.strides[0], x.strides[0]))
print("Ex31 Hankel:\n", hankel)

# 32. efficient rolling std using windows
np.random.seed(42)
prices = np.random.randn(20)
w = 5
win = as_strided(prices[:len(prices) - w + 1 + w - 1],
                 shape=(len(prices) - w + 1, w),
                 strides=(prices.strides[0], prices.strides[0]))
win_safe = win.copy()  # copy to avoid potential out-of-bounds
print("Ex32 rolling std:", win_safe.std(axis=1).round(3))

# 33. memory layout effect on matrix multiply (conceptual timing)
A_c = np.random.rand(50, 50)
A_f = np.asfortranarray(A_c)
# Both give same result
print("Ex33 same result:", np.allclose(A_c @ A_c.T, A_f @ A_f.T))

# 34. stride manipulation to skip elements
a6 = np.arange(20, dtype=np.float64)
every3 = as_strided(a6, shape=(7,), strides=(a6.strides[0] * 3,))
print("Ex34 every 3rd:", every3)

# 35. 2D to 1D diagonal with as_strided
mat3 = np.arange(9).reshape(3, 3).astype(np.float64)
stride_sum = mat3.strides[0] + mat3.strides[1]
diag3 = as_strided(mat3, shape=(3,), strides=(stride_sum,))
print("Ex35 diagonal:", diag3)

# 36. nbytes and memory usage
big = np.zeros((1000, 1000), dtype=np.float64)
print("Ex36 8 MB array:", big.nbytes // 1024 // 1024, "MB")

# 37. shared memory check with view on structured array
sa = np.zeros(5, dtype=[('x', 'f4'), ('y', 'f4')])
x_view = sa['x']
print("Ex37 field view shares:", np.shares_memory(x_view, sa))

# 38. flatten of F-order array
f_arr = np.asfortranarray(np.arange(6).reshape(2, 3))
print("Ex38 ravel C:", f_arr.ravel(order='C'))
print("Ex38 ravel F:", f_arr.ravel(order='F'))

# 39. view of 2D slice
mat4 = np.arange(20).reshape(4, 5)
sub = mat4[1:3, 2:4]
print("Ex39 sub shares:", np.shares_memory(sub, mat4))
print("Ex39 sub strides:", sub.strides)  # same as mat4 strides

# 40. buffer protocol with ctypes
import ctypes
a7 = np.array([1, 2, 3, 4], dtype=np.int32)
ptr = a7.ctypes.data_as(ctypes.POINTER(ctypes.c_int32))
print("Ex40 ctypes ptr[0]:", ptr[0])

# 41. __array_interface__ for introspection
a8 = np.array([1., 2., 3.])
iface = a8.__array_interface__
print("Ex41 typestr:", iface['typestr'], "shape:", iface['shape'])

# 42. stride tricks: upper triangular matrix view
n2 = 4
full = np.arange(n2*n2, dtype=np.float64).reshape(n2, n2)
print("Ex42 upper tri:\n", np.triu(full))

# --- EXPERT ---

# 43. np.lib.stride_tricks.sliding_window_view for 2D
try:
    from numpy.lib.stride_tricks import sliding_window_view
    img2 = np.arange(25).reshape(5, 5)
    patches2 = sliding_window_view(img2, window_shape=(3, 3))
    print("Ex43 2D patches shape:", patches2.shape)  # (3, 3, 3, 3)
except ImportError:
    print("Ex43 sliding_window_view requires NumPy >= 1.20")

# 44. fancy indexing via np.lib.index_tricks.r_ and c_
print("Ex44:", np.r_[1:5, 0, 6:10])

# 45. np.ravel_multi_index and np.unravel_index round-trip
idx_2d = (2, 3)
flat = np.ravel_multi_index(idx_2d, (5, 6))
back = np.unravel_index(flat, (5, 6))
print("Ex45 round-trip:", back == idx_2d)

# 46. memory offsets in structured dtype
dt46 = np.dtype([('a', 'i4'), ('b', 'f8'), ('c', 'u2')])
for name in dt46.names:
    print(f"Ex46 '{name}' offset:", dt46.fields[name][1])

# 47. stride-based repeat (broadcast_to as view)
x47 = np.array([1., 2., 3.], dtype=np.float64)
rep = np.broadcast_to(x47, (4, 3))
print("Ex47 stride rep strides:", rep.strides)  # (0, 8)

# 48. strided column vector broadcast
col47 = np.array([10., 20., 30., 40.], dtype=np.float64)[:, None]
rep_col = np.broadcast_to(col47, (4, 5))
print("Ex48 col broadcast strides:", rep_col.strides)

# 49. memory-safe sliding window using np.lib.stride_tricks.sliding_window_view
try:
    from numpy.lib.stride_tricks import sliding_window_view
    arr49 = np.random.rand(100)
    sw49 = sliding_window_view(arr49, 10)
    print("Ex49 sliding window shape:", sw49.shape)
except ImportError:
    print("Ex49 requires NumPy >= 1.20")

# 50. performance note: contiguous matmul
A50 = np.random.rand(100, 100)
B50 = np.random.rand(100, 100)
B50_T = np.ascontiguousarray(B50.T)
C_direct = A50 @ B50
C_contig = A50 @ B50_T.T
print("Ex50 same result:", np.allclose(C_direct, C_contig))


def main():
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
