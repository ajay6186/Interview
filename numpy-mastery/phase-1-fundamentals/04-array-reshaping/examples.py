# ============================================================================
# Examples 1.4 — Array Reshaping  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np

# --- BASIC ---

# 1. reshape 1D to 2D
arr = np.arange(12)
m = arr.reshape(3, 4)
print("Ex01 shape:", m.shape)

# 2. reshape using -1 (auto-compute one dimension)
m2 = arr.reshape(-1, 4)  # NumPy infers 3
print("Ex02 shape:", m2.shape)

# 3. reshape to 3D
m3 = arr.reshape(2, 2, 3)
print("Ex03 shape:", m3.shape)

# 4. ravel — flatten to 1D (view)
flat = m.ravel()
print("Ex04:", flat)

# 5. flatten — flatten to 1D (copy)
flat2 = m.flatten()
print("Ex05:", flat2)

# 6. transpose 2D matrix
mat = np.arange(6).reshape(2, 3)
print("Ex06 T shape:", mat.T.shape)  # (3, 2)

# 7. transpose with .T attribute
print("Ex07 mat.T:\n", mat.T)

# 8. np.newaxis to add dim at axis 0
v = np.array([1, 2, 3])
print("Ex08 row shape:", v[np.newaxis, :].shape)  # (1, 3)

# 9. np.newaxis to add dim at axis 1
print("Ex09 col shape:", v[:, np.newaxis].shape)  # (3, 1)

# 10. np.expand_dims
print("Ex10:", np.expand_dims(v, axis=0).shape)

# 11. np.squeeze removes size-1 dimensions
a = np.zeros((1, 3, 1, 4))
print("Ex11:", np.squeeze(a).shape)  # (3, 4)

# 12. np.concatenate along axis=0
a1 = np.array([[1, 2], [3, 4]])
b1 = np.array([[5, 6]])
print("Ex12:\n", np.concatenate([a1, b1], axis=0))

# 13. np.concatenate along axis=1
a2 = np.array([[1, 2], [3, 4]])
b2 = np.array([[5], [6]])
print("Ex13:\n", np.concatenate([a2, b2], axis=1))

# 14. np.vstack (vertical stack — axis 0)
print("Ex14:\n", np.vstack([a1, b1]))

# 15. np.hstack (horizontal stack — axis 1)
print("Ex15:\n", np.hstack([a2, b2]))

# --- INTERMEDIATE ---

# 16. np.stack creates new axis
x = np.array([1, 2, 3])
y = np.array([4, 5, 6])
print("Ex16 stack axis=0:", np.stack([x, y], axis=0).shape)  # (2,3)
print("Ex16 stack axis=1:", np.stack([x, y], axis=1).shape)  # (3,2)

# 17. np.dstack — depth stack (axis=2)
print("Ex17:\n", np.dstack([x, y]).shape)  # (1,3,2)

# 18. np.split — split array into equal parts
parts = np.split(np.arange(12), 3)
print("Ex18:", [p.tolist() for p in parts])

# 19. np.array_split — unequal split allowed
parts2 = np.array_split(np.arange(10), 3)
print("Ex19:", [p.tolist() for p in parts2])

# 20. np.hsplit — horizontal split (columns)
m4 = np.arange(12).reshape(3, 4)
left, right = np.hsplit(m4, 2)
print("Ex20 left:", left, "right:", right)

# 21. np.vsplit — vertical split (rows)
top, bot = np.vsplit(m4, [2])  # split after row 2
print("Ex21 top shape:", top.shape, "bot shape:", bot.shape)

# 22. reshape with -1 on multiple dims
print("Ex22:", np.arange(24).reshape(2, -1, 3).shape)  # (2,4,3)

# 23. C vs Fortran order in ravel
mat_c = np.arange(6).reshape(2, 3)
print("Ex23 C order:", mat_c.ravel(order='C'))
print("Ex23 F order:", mat_c.ravel(order='F'))

# 24. flatten always returns copy — modification doesn't affect original
orig = np.array([[1, 2], [3, 4]])
fl = orig.flatten()
fl[0] = 999
print("Ex24 orig unchanged:", orig[0, 0])  # 1

# 25. ravel returns view when possible
rv = orig.ravel()
rv[0] = 888
print("Ex25 orig changed:", orig[0, 0])  # 888

# 26. reshape returns view when possible
r = np.arange(6).reshape(2, 3)
r2 = r.reshape(3, 2)
r2[0, 0] = 999
print("Ex26 r changed:", r[0, 0])  # 999 (shares memory)

# 27. np.resize — can increase size (repeats data)
small = np.array([1, 2, 3])
big = np.resize(small, (2, 4))
print("Ex27:\n", big)

# 28. ndarray.resize in-place
a3 = np.array([1, 2, 3, 4, 5, 6])
a3.resize((2, 3))
print("Ex28:\n", a3)

# 29. np.tile — repeat array
t = np.tile(np.array([1, 2]), 3)
print("Ex29:", t)  # [1 2 1 2 1 2]

# 30. np.repeat — repeat each element
r2 = np.repeat(np.array([1, 2, 3]), 2)
print("Ex30:", r2)  # [1 1 2 2 3 3]

# --- ADVANCED ---

# 31. transpose 3D array with np.transpose
arr3d = np.arange(24).reshape(2, 3, 4)
print("Ex31:", np.transpose(arr3d, (2, 0, 1)).shape)  # (4,2,3)

# 32. np.moveaxis
print("Ex32:", np.moveaxis(arr3d, 0, -1).shape)  # (3,4,2)

# 33. np.swapaxes
print("Ex33:", np.swapaxes(arr3d, 0, 2).shape)  # (4,3,2)

# 34. np.rollaxis (older API)
print("Ex34:", np.rollaxis(arr3d, 2).shape)  # (4,2,3)

# 35. block matrix construction
A = np.eye(2)
B = np.zeros((2, 2))
C = np.ones((2, 2))
block = np.block([[A, B], [C, A]])
print("Ex35 block shape:", block.shape)

# 36. np.pad — pad array with values
p = np.array([1, 2, 3])
padded = np.pad(p, (2, 3), constant_values=0)
print("Ex36:", padded)

# 37. 2D padding
m5 = np.ones((2, 2))
padded_2d = np.pad(m5, 1, constant_values=0)
print("Ex37:\n", padded_2d)

# 38. np.broadcast_to — create view with broadcast shape
bcast = np.broadcast_to(np.array([1, 2, 3]), (4, 3))
print("Ex38 shape:", bcast.shape)

# 39. np.broadcast_arrays — broadcast multiple arrays
a4, b4 = np.broadcast_arrays(np.array([[1], [2]]), np.array([10, 20, 30]))
print("Ex39:", a4.shape, b4.shape)

# 40. concatenate list of 1D arrays
arrays = [np.arange(i) for i in range(1, 5)]
result = np.concatenate(arrays)
print("Ex40:", result)

# 41. np.atleast_1d, np.atleast_2d, np.atleast_3d
scalar = 5
print("Ex41 atleast_1d:", np.atleast_1d(scalar))
print("Ex41 atleast_2d:", np.atleast_2d(scalar))

# 42. reshape chain: 1D → 2D → transpose → flatten
chain = np.arange(6).reshape(2, 3).T.ravel()
print("Ex42:", chain)

# --- EXPERT ---

# 43. C-contiguous check
c_arr = np.zeros((3, 4), order='C')
print("Ex43 C_CONTIGUOUS:", c_arr.flags['C_CONTIGUOUS'])
print("Ex43 F_CONTIGUOUS:", c_arr.flags['F_CONTIGUOUS'])

# 44. Fortran-contiguous
f_arr = np.zeros((3, 4), order='F')
print("Ex44 C_CONTIGUOUS:", f_arr.flags['C_CONTIGUOUS'])
print("Ex44 F_CONTIGUOUS:", f_arr.flags['F_CONTIGUOUS'])

# 45. make contiguous with np.ascontiguousarray
f_contig = np.ascontiguousarray(f_arr)
print("Ex45 C_CONTIGUOUS after:", f_contig.flags['C_CONTIGUOUS'])

# 46. reshape of non-contiguous may copy
transposed = c_arr.T  # not C-contiguous
print("Ex46 shares_memory with reshape:", np.shares_memory(transposed, transposed.reshape(-1)))

# 47. use np.lib.stride_tricks.as_strided (basic example)
from numpy.lib.stride_tricks import as_strided
base_arr = np.array([1, 2, 3, 4, 5, 6], dtype=np.float64)
strided = as_strided(base_arr, shape=(4, 3), strides=(8, 8))
print("Ex47:\n", strided)

# 48. np.nditer for multi-array iteration
a5 = np.array([1, 2, 3])
b5 = np.array([10, 20, 30])
for x, y in np.nditer([a5, b5]):
    pass  # just demonstrate iteration
print("Ex48: nditer ok")

# 49. np.ndenumerate for index + value iteration
m6 = np.arange(6).reshape(2, 3)
for idx, val in np.ndenumerate(m6):
    pass
print("Ex49: ndenumerate ok")

# 50. np.unravel_index — flat index to N-D index
flat_idx = 7
shape = (3, 4)
print("Ex50:", np.unravel_index(flat_idx, shape))  # (1, 3)


def main():
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
