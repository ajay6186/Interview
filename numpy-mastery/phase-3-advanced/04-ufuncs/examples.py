# ============================================================================
# Examples 3.4 — Universal Functions (ufuncs)  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np

# --- BASIC ---

# 1. built-in ufunc: np.add
print("Ex01:", np.add(np.array([1,2,3]), np.array([4,5,6])))

# 2. ufunc.reduce: sum via np.add.reduce
arr = np.array([1., 2., 3., 4., 5.])
print("Ex02 add.reduce:", np.add.reduce(arr))  # 15

# 3. np.multiply.reduce (product)
print("Ex03 multiply.reduce:", np.multiply.reduce(arr))  # 120

# 4. np.add.accumulate (cumsum)
print("Ex04 add.accumulate:", np.add.accumulate(arr))

# 5. np.multiply.accumulate (cumprod)
print("Ex05 multiply.accumulate:", np.multiply.accumulate(arr))

# 6. np.maximum.reduce
print("Ex06 maximum.reduce:", np.maximum.reduce(arr))  # 5.0

# 7. np.minimum.accumulate (running min)
print("Ex07 minimum.accumulate:", np.minimum.accumulate(np.array([5., 3., 8., 1., 9.])))

# 8. np.add.outer — outer sum table
a = np.array([1., 2., 3.])
b = np.array([10., 20., 30.])
print("Ex08 add.outer:\n", np.add.outer(a, b))

# 9. np.multiply.outer — outer product
print("Ex09 multiply.outer:\n", np.multiply.outer(a, b))

# 10. np.logical_and.reduce (all elements True?)
bools = np.array([True, True, True])
print("Ex10 all True:", np.logical_and.reduce(bools))

# 11. np.logical_or.reduce (any element True?)
bools2 = np.array([False, True, False])
print("Ex11 any True:", np.logical_or.reduce(bools2))

# 12. np.add.reduce along axis
mat = np.array([[1., 2., 3.], [4., 5., 6.]])
print("Ex12 add.reduce axis=0:", np.add.reduce(mat, axis=0))
print("Ex12 add.reduce axis=1:", np.add.reduce(mat, axis=1))

# 13. np.maximum.reduce on 2D
print("Ex13 max per col:", np.maximum.reduce(mat, axis=0))

# 14. np.frompyfunc — custom ufunc
square_uf = np.frompyfunc(lambda x: x*x, 1, 1)
print("Ex14:", square_uf(np.arange(1, 6)))

# 15. ufunc with 2 inputs via frompyfunc
hyp_uf = np.frompyfunc(lambda a, b: (a**2 + b**2)**0.5, 2, 1)
print("Ex15:", hyp_uf(np.array([3., 5., 8.]), np.array([4., 12., 15.])).astype(float))

# --- INTERMEDIATE ---

# 16. np.add.reduceat — segmented sum
data = np.arange(1., 11.)
print("Ex16 reduceat sums:", np.add.reduceat(data, [0, 3, 7]))

# 17. np.maximum.reduceat — segmented max
print("Ex17 reduceat max:", np.maximum.reduceat(data, [0, 4, 8]))

# 18. np.add.at — unbuffered operation (scatter-add)
target = np.zeros(5)
indices = np.array([0, 1, 0, 2, 1])
np.add.at(target, indices, 1.)
print("Ex18 add.at:", target)

# 19. np.add.at for weighted scatter
weights = np.array([2., 3., 1., 4., 2.])
target2 = np.zeros(5)
np.add.at(target2, indices, weights)
print("Ex19 weighted scatter:", target2)

# 20. np.subtract.at (subtract from specific indices)
arr2 = np.ones(5)
np.subtract.at(arr2, [1, 3], 0.5)
print("Ex20 subtract.at:", arr2)

# 21. ufunc.nargs — number of arguments
print("Ex21 np.add.nargs:", np.add.nargs)
print("Ex21 np.sqrt.nargs:", np.sqrt.nargs)

# 22. ufunc.ntypes — supported type combinations
print("Ex22 np.add.ntypes:", np.add.ntypes)

# 23. ufunc.identity — neutral element
print("Ex23 np.add.identity:", np.add.identity)     # 0
print("Ex23 np.multiply.identity:", np.multiply.identity)  # 1

# 24. np.add.reduce with initial value
print("Ex24 reduce with initial:", np.add.reduce(arr, initial=100.))

# 25. np.multiply.outer for 3D
x2 = np.array([1., 2.])
y2 = np.array([3., 4.])
z2 = np.array([5., 6.])
outer3 = np.multiply.outer(np.multiply.outer(x2, y2), z2)
print("Ex25 3-way outer shape:", outer3.shape)

# 26. np.add.accumulate on 2D along axis
print("Ex26 cumsum axis=0:\n", np.add.accumulate(mat, axis=0))

# 27. custom ufunc for sigmoid
sig_uf = np.frompyfunc(lambda x: 1./(1.+np.exp(-x)), 1, 1)
print("Ex27 sigmoid:", sig_uf(np.array([-2., 0., 2.])).astype(float).round(4))

# 28. custom ufunc for 2-output (min and max of pair)
def min_max_pair(a2, b2):
    return (min(a2, b2), max(a2, b2))
mm_uf = np.frompyfunc(min_max_pair, 2, 2)
lo, hi = mm_uf(np.array([3., 1., 5.]), np.array([2., 4., 0.]))
print("Ex28 lo:", lo.astype(float), "hi:", hi.astype(float))

# 29. ufunc type resolution
print("Ex29 np.add(int32, float64) type:", np.add(np.int32(1), np.float64(2.)).dtype)

# 30. np.maximum.accumulate — running max
print("Ex30:", np.maximum.accumulate(np.array([3., 1., 4., 1., 5., 9., 2.])))

# --- ADVANCED ---

# 31. frompyfunc with object output — grade conversion
def to_grade(x):
    return 'A' if x>=90 else 'B' if x>=80 else 'C' if x>=70 else 'D' if x>=60 else 'F'
grade_uf = np.frompyfunc(to_grade, 1, 1)
print("Ex31:", grade_uf(np.array([95., 82., 71., 61., 45.])))

# 32. np.add.reduce with where mask
arr3 = np.array([1., 2., 3., 4., 5.])
mask = np.array([True, False, True, False, True])
# sum only masked elements
print("Ex32 masked sum:", np.sum(arr3[mask]))

# 33. segmented mean via reduceat + count
data2 = np.array([1., 2., 3., 4., 5., 6.])
seg_idx = np.array([0, 2, 4])
sums = np.add.reduceat(data2, seg_idx)
counts = np.diff(np.append(seg_idx, len(data2)))
print("Ex33 segment means:", sums / counts)

# 34. log-sum-exp via np.add.reduce after exp transform
x_vals = np.array([1., 2., 3.])
m_val = x_vals.max()
lse = m_val + np.log(np.add.reduce(np.exp(x_vals - m_val)))
print("Ex34 log-sum-exp:", lse.round(4))

# 35. power reduce: 2^1 * 2^2 * 2^3 ...
powers = 2. ** np.arange(1., 6.)
print("Ex35 product of powers:", np.multiply.reduce(powers))

# 36. np.bitwise_and.reduce
flags = np.array([0b1111, 0b1010, 0b1001], dtype=np.uint8)
print("Ex36 bitwise_and.reduce:", bin(np.bitwise_and.reduce(flags)))

# 37. np.bitwise_or.reduce
print("Ex37 bitwise_or.reduce:", bin(np.bitwise_or.reduce(flags)))

# 38. np.add.reduceat for histogram counts
values3 = np.array([1., 2., 2., 3., 3., 3., 4., 4., 4., 4.])
sorted_v = np.sort(values3)
# create indicator array of 1s then reduceat on value boundaries
boundaries = np.where(np.diff(sorted_v))[0] + 1
boundaries = np.concatenate([[0], boundaries])
counts3 = np.add.reduceat(np.ones_like(sorted_v), boundaries)
print("Ex38 histogram via reduceat:", counts3)

# 39. chain of ufunc.outer for 4D tensor
a4 = np.array([1., 2.])
b4 = np.array([3., 4.])
c4 = np.array([5., 6.])
d4 = np.array([7., 8.])
result4d = np.multiply.outer(a4, np.multiply.outer(b4, np.multiply.outer(c4, d4)))
print("Ex39 4D outer shape:", result4d.shape)

# 40. ufunc.reduceat on 2D array
mat3 = np.arange(12.).reshape(3, 4)
print("Ex40 reduceat on 2D (axis=1):\n", np.add.reduceat(mat3, [0, 2], axis=1))

# 41. np.logical_and.accumulate — logical running "all"
print("Ex41:", np.logical_and.accumulate(np.array([True, True, False, True])))

# 42. np.minimum.reduce — global min via ufunc
print("Ex42 min.reduce:", np.minimum.reduce(np.array([5., 3., 8., 1., 9.])))

# --- EXPERT ---

# 43. np.ufunc.at with repeated indices (unbuffered)
arr4 = np.zeros(4)
idx4 = np.array([0, 0, 1, 1])
np.add.at(arr4, idx4, np.array([1., 2., 3., 4.]))
print("Ex43 unbuffered add.at:", arr4)  # [3, 7, 0, 0]

# 44. compare buffered (+= ) vs unbuffered (add.at) for repeated idx
arr5 = np.zeros(3)
idx5 = np.array([0, 0, 1])
arr5[idx5] += np.array([1., 1., 1.])
print("Ex44 buffered (wrong for dups):", arr5)  # [1, 1, 0] — second add lost

arr6 = np.zeros(3)
np.add.at(arr6, idx5, np.array([1., 1., 1.]))
print("Ex44 unbuffered (correct):", arr6)  # [2, 1, 0]

# 45. generalized ufunc via signature (requires gufunc)
# Demonstrate concept with matmul which is a gufunc
print("Ex45 matmul is ufunc:", isinstance(np.matmul, np.ufunc))

# 46. np.frompyfunc return type handling
poly_uf = np.frompyfunc(lambda x: x**3 - 2*x + 1, 1, 1)
x_in = np.linspace(-2., 2., 5)
print("Ex46 poly vals:", poly_uf(x_in).astype(float).round(3))

# 47. ufunc vs vectorize: frompyfunc returns object arrays
f_uf = np.frompyfunc(lambda x: x + 1, 1, 1)
result_uf = f_uf(np.array([1., 2., 3.]))
print("Ex47 frompyfunc dtype:", result_uf.dtype)  # object
# Convert to float:
print("Ex47 as float:", result_uf.astype(float))

# 48. np.add.outer for polynomial multiplication
p1 = np.array([1., 2., 3.])    # 1 + 2x + 3x^2
p2 = np.array([1., -1.])       # 1 - x
# convolution = polynomial product
print("Ex48 poly product:", np.convolve(p1, p2))

# 49. custom ufunc for clipped absolute value
def clipped_abs(x):
    return min(abs(x), 10.)
cab = np.frompyfunc(clipped_abs, 1, 1)
print("Ex49:", cab(np.array([-20., -5., 0., 7., 15.])).astype(float))

# 50. reduce over custom comparison ufunc
def closer_to_5(a2, b2):
    return a2 if abs(a2 - 5) < abs(b2 - 5) else b2
closest_5 = np.frompyfunc(closer_to_5, 2, 1)
candidates = np.array([1., 3., 6., 4., 9., 5., 2.])
print("Ex50 value closest to 5:", closest_5.reduce(candidates))


def main():
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
