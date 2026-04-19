# ============================================================================
# Examples 1.2 — Array Indexing  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np

# --- BASIC ---

# 1. index first element of 1D array
arr = np.array([10, 20, 30, 40, 50])
print("Ex01:", arr[0])  # 10

# 2. index last element with negative index
print("Ex02:", arr[-1])  # 50

# 3. slice a range of elements
print("Ex03:", arr[1:4])  # [20 30 40]

# 4. slice with step
print("Ex04:", arr[::2])  # [10 30 50]

# 5. reverse array with slicing
print("Ex05:", arr[::-1])  # [50 40 30 20 10]

# 6. 2D array row access
mat = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
print("Ex06 row 0:", mat[0])  # [1 2 3]

# 7. 2D array column access
print("Ex07 col 1:", mat[:, 1])  # [2 5 8]

# 8. single element in 2D array
print("Ex08 mat[1,2]:", mat[1, 2])  # 6

# 9. slice rows in 2D
print("Ex09 rows 0-1:", mat[:2])

# 10. slice columns in 2D
print("Ex10 cols 1-2:", mat[:, 1:3])

# 11. sub-matrix extraction
print("Ex11 submatrix:", mat[1:, 1:])

# 12. negative row index in 2D
print("Ex12 last row:", mat[-1])  # [7 8 9]

# 13. negative column index
print("Ex13 last col:", mat[:, -1])  # [3 6 9]

# 14. 3D array creation
arr3d = np.arange(27).reshape(3, 3, 3)
print("Ex14 arr3d[0]:\n", arr3d[0])

# 15. element in 3D array
print("Ex15 arr3d[2,1,0]:", arr3d[2, 1, 0])  # 21

# --- INTERMEDIATE ---

# 16. step slicing on rows
mat2 = np.arange(25).reshape(5, 5)
print("Ex16 every other row:\n", mat2[::2])

# 17. step slicing on columns
print("Ex17 every other col:\n", mat2[:, ::2])

# 18. reverse rows order
print("Ex18 rows reversed:\n", mat2[::-1])

# 19. reverse columns order
print("Ex19 cols reversed:\n", mat2[:, ::-1])

# 20. combined row and column step
print("Ex20:", mat2[::2, ::2])

# 21. view shares memory
original = np.arange(10)
v = original[2:7]
print("Ex21 shares_memory:", np.shares_memory(v, original))  # True

# 22. copy does not share memory
c = original[2:7].copy()
print("Ex22 copy shares_memory:", np.shares_memory(c, original))  # False

# 23. modifying view changes original
v[0] = 999
print("Ex23 original[2] after view mod:", original[2])  # 999

# 24. modifying copy doesn't change original
c[0] = -1
print("Ex24 original[2] unchanged:", original[2])  # 999 (unchanged)

# 25. ellipsis indexing for N-D arrays
arr4d = np.arange(2*3*4*5).reshape(2, 3, 4, 5)
print("Ex25 shape with ellipsis:", arr4d[0, ..., 2].shape)

# 26. np.newaxis to add dimension
arr1 = np.array([1, 2, 3])
col_vec = arr1[:, np.newaxis]
print("Ex26 col_vec shape:", col_vec.shape)  # (3,1)

# 27. row vector with newaxis
row_vec = arr1[np.newaxis, :]
print("Ex27 row_vec shape:", row_vec.shape)  # (1,3)

# 28. integer indexing (selects individual elements)
idx = np.array([0, 2, 4])
print("Ex28:", original[idx])

# 29. boolean mask indexing
mask = original > 5
print("Ex29:", original[mask])

# 30. combining slice with step and negative
a = np.arange(20)
print("Ex30:", a[18:2:-3])  # [18, 15, 12, 9, 6, 3]

# --- ADVANCED ---

# 31. fancy indexing with 2D index array
mat3 = np.array([[10, 20, 30], [40, 50, 60], [70, 80, 90]])
rows = np.array([0, 2])
cols = np.array([1, 2])
print("Ex31:", mat3[rows, cols])  # [20, 90]

# 32. integer indexing returns copy
base = np.arange(5)
idx_arr = np.array([1, 3])
fancy = base[idx_arr]
fancy[0] = 100
print("Ex32 base unchanged:", base[1])  # 1

# 33. 3D fancy indexing
cube = np.arange(8).reshape(2, 2, 2)
print("Ex33:", cube[1, 0, :])  # [4 5]

# 34. slice object for reuse
s = slice(1, 4)
print("Ex34:", arr[s])

# 35. np.take — gather elements by index
taken = np.take(np.arange(10), [0, 3, 7, 9])
print("Ex35:", taken)

# 36. np.take along axis
m = np.arange(12).reshape(3, 4)
print("Ex36:", np.take(m, [0, 2], axis=1))

# 37. conditional slice replacement
b = np.arange(10, dtype=float)
b[b > 5] = 0
print("Ex37:", b)

# 38. np.diag extracts diagonal
d = np.arange(9).reshape(3, 3)
print("Ex38 diagonal:", np.diag(d))  # [0, 4, 8]

# 39. np.diag on vector creates diagonal matrix
print("Ex39:\n", np.diag([1, 2, 3]))

# 40. slicing 3D: all rows in middle slice
arr3d2 = np.arange(24).reshape(2, 3, 4)
print("Ex40:", arr3d2[:, 1, :].shape)  # (2, 4)

# 41. out-of-bounds slicing is safe (returns empty or partial)
a2 = np.array([1, 2, 3])
print("Ex41:", a2[5:10])  # []

# 42. np.ix_ to create open mesh for broadcasting indexing
rows_ix = np.array([0, 2])
cols_ix = np.array([1, 3])
rix, cix = np.ix_(rows_ix, cols_ix)
m2 = np.arange(16).reshape(4, 4)
print("Ex42:", m2[rix, cix])

# --- EXPERT ---

# 43. strides-based understanding
a_c = np.array([[1, 2, 3], [4, 5, 6]], dtype=np.float64)
print("Ex43 strides:", a_c.strides)  # (24, 8) for C-order

# 44. Fortran order strides
a_f = np.asfortranarray(a_c)
print("Ex44 F-order strides:", a_f.strides)  # (8, 16)

# 45. multi-dim slice then fancy index
m3 = np.arange(30).reshape(5, 6)
sub = m3[1:4, ::2]  # shape (3,3)
print("Ex45 sub shape:", sub.shape)

# 46. boolean index with 2D mask
m4 = np.arange(9).reshape(3, 3)
mask2d = m4 % 2 == 0
print("Ex46:", m4[mask2d])  # even elements

# 47. np.where for conditional element selection
x = np.array([-2, -1, 0, 1, 2])
result = np.where(x >= 0, x, 0)  # replace negatives with 0
print("Ex47:", result)

# 48. advanced column selection preserving shape
m5 = np.arange(20).reshape(4, 5)
col_ids = np.array([0, 2, 4])
print("Ex48:", m5[:, col_ids])

# 49. multiple index arrays for N-D arrays
a3d = np.arange(27).reshape(3, 3, 3)
r, c, d = np.array([0, 2]), np.array([1, 0]), np.array([2, 1])
print("Ex49:", a3d[r, c, d])  # a3d[0,1,2] and a3d[2,0,1]

# 50. views of transposed arrays
m6 = np.arange(6).reshape(2, 3)
t = m6.T
print("Ex50 T strides:", t.strides)  # reversed strides


def main():
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
