# ============================================================================
# Examples 1.5 — Array Math  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np

# --- BASIC ---

# 1. np.sum of all elements
arr = np.array([1, 2, 3, 4, 5])
print("Ex01 sum:", np.sum(arr))  # 15

# 2. np.mean
print("Ex02 mean:", np.mean(arr))  # 3.0

# 3. np.max and np.min
print("Ex03 max:", np.max(arr), "min:", np.min(arr))

# 4. np.std (standard deviation)
print("Ex04 std:", np.std(arr))

# 5. np.var (variance)
print("Ex05 var:", np.var(arr))

# 6. np.cumsum — running total
print("Ex06 cumsum:", np.cumsum(arr))  # [1 3 6 10 15]

# 7. np.cumprod — running product
print("Ex07 cumprod:", np.cumprod(arr))  # [1 2 6 24 120]

# 8. np.sqrt — square root
print("Ex08:", np.sqrt(np.array([1., 4., 9., 16.])))

# 9. np.exp
print("Ex09:", np.exp(np.array([0., 1., 2.])).round(4))

# 10. np.log (natural log)
print("Ex10:", np.log(np.array([1., np.e, np.e**2])).round(4))

# 11. np.log2
print("Ex11:", np.log2(np.array([1., 2., 4., 8.])))

# 12. np.log10
print("Ex12:", np.log10(np.array([1., 10., 100., 1000.])))

# 13. axis=0 (column-wise)
mat = np.array([[1, 2, 3], [4, 5, 6]])
print("Ex13 sum axis=0:", np.sum(mat, axis=0))  # [5 7 9]

# 14. axis=1 (row-wise)
print("Ex14 sum axis=1:", np.sum(mat, axis=1))  # [6 15]

# 15. np.prod — product of all elements
print("Ex15 prod:", np.prod(arr))  # 120

# --- INTERMEDIATE ---

# 16. np.mean along axis
print("Ex16 mean axis=0:", np.mean(mat, axis=0))
print("Ex16 mean axis=1:", np.mean(mat, axis=1))

# 17. np.std with ddof=1 (sample std)
data = np.array([2., 4., 4., 4., 5., 5., 7., 9.])
print("Ex17 sample std:", np.std(data, ddof=1).round(4))

# 18. np.var with ddof=1 (sample variance)
print("Ex18 sample var:", np.var(data, ddof=1).round(4))

# 19. np.median
print("Ex19 median:", np.median(data))

# 20. np.percentile
print("Ex20 25th pct:", np.percentile(data, 25))
print("Ex20 75th pct:", np.percentile(data, 75))

# 21. np.argmax and np.argmin (index of max/min)
arr2 = np.array([3, 1, 4, 1, 5, 9, 2, 6])
print("Ex21 argmax:", np.argmax(arr2), "argmin:", np.argmin(arr2))

# 22. np.argmax along axis
mat2 = np.array([[1, 5, 3], [7, 2, 8]])
print("Ex22 argmax axis=0:", np.argmax(mat2, axis=0))
print("Ex22 argmax axis=1:", np.argmax(mat2, axis=1))

# 23. np.any and np.all
bools = np.array([True, False, True])
print("Ex23 any:", np.any(bools), "all:", np.all(bools))

# 24. np.any along axis
mat3 = np.array([[True, False], [True, True]])
print("Ex24 any axis=0:", np.any(mat3, axis=0))

# 25. np.count_nonzero
arr3 = np.array([0, 1, 2, 0, 3, 0])
print("Ex25 nonzero count:", np.count_nonzero(arr3))  # 3

# 26. np.ptp — peak-to-peak (max - min)
print("Ex26 ptp:", np.ptp(data))

# 27. np.trapz — trapezoidal integration
y = np.sin(np.linspace(0, np.pi, 100))
area = np.trapz(y, dx=np.pi/99)
print("Ex27 approx integral of sin(0,pi):", round(area, 4))  # ~2.0

# 28. np.gradient — numerical derivative
f = np.array([1., 4., 9., 16., 25.])  # x^2
x = np.array([1., 2., 3., 4., 5.])
print("Ex28 gradient (approx deriv):", np.gradient(f, x))

# 29. np.diff — differences between consecutive elements
arr4 = np.array([1, 3, 6, 10, 15])
print("Ex29 diff:", np.diff(arr4))  # [2 3 4 5]

# 30. np.ediff1d — like diff but with optional prepend/append
print("Ex30:", np.ediff1d(arr4, to_begin=0))

# --- ADVANCED ---

# 31. np.cumsum along axis
mat4 = np.array([[1, 2, 3], [4, 5, 6]])
print("Ex31 cumsum axis=1:\n", np.cumsum(mat4, axis=1))

# 32. np.nanmean — mean ignoring NaN
arr_nan = np.array([1., 2., np.nan, 4., 5.])
print("Ex32 nanmean:", np.nanmean(arr_nan))

# 33. np.nansum, np.nanmax, np.nanmin
print("Ex33 nansum:", np.nansum(arr_nan))
print("Ex33 nanmax:", np.nanmax(arr_nan))

# 34. np.nanstd, np.nanvar
print("Ex34 nanstd:", np.nanstd(arr_nan).round(4))

# 35. weighted mean manually
weights = np.array([1., 2., 3., 4., 5.])
values = np.array([10., 20., 30., 40., 50.])
weighted_mean = np.average(values, weights=weights)
print("Ex35 weighted mean:", weighted_mean)

# 36. np.average with weights along axis
mat5 = np.array([[1., 2.], [3., 4.]])
print("Ex36:", np.average(mat5, axis=0, weights=[1., 2.]))

# 37. np.einsum for sum
print("Ex37 einsum sum:", np.einsum('i->', arr))

# 38. np.einsum for dot product
a5 = np.array([1., 2., 3.])
b5 = np.array([4., 5., 6.])
print("Ex38 einsum dot:", np.einsum('i,i->', a5, b5))

# 39. np.einsum for matrix multiply
A = np.arange(4).reshape(2, 2).astype(float)
B = np.eye(2)
print("Ex39 einsum matmul:\n", np.einsum('ij,jk->ik', A, B))

# 40. np.cross product
v1 = np.array([1., 0., 0.])
v2 = np.array([0., 1., 0.])
print("Ex40 cross:", np.cross(v1, v2))  # [0, 0, 1]

# 41. np.inner (inner product / dot for 1D)
print("Ex41 inner:", np.inner(a5, b5))

# 42. np.outer (outer product)
print("Ex42 outer:\n", np.outer(np.array([1, 2]), np.array([3, 4, 5])))

# --- EXPERT ---

# 43. np.linalg.norm — vector norm
v = np.array([3., 4.])
print("Ex43 L2 norm:", np.linalg.norm(v))  # 5.0

# 44. L1 norm
print("Ex44 L1 norm:", np.linalg.norm(v, ord=1))  # 7.0

# 45. np.linalg.norm of matrix (Frobenius)
m = np.array([[1., 2.], [3., 4.]])
print("Ex45 Frobenius norm:", np.linalg.norm(m))

# 46. np.correlate — cross-correlation
sig1 = np.array([1., 2., 3., 4., 5.])
sig2 = np.array([1., 0., 1.])
print("Ex46 correlate:", np.correlate(sig1, sig2, mode='valid'))

# 47. np.convolve
print("Ex47 convolve:", np.convolve(sig1, sig2, mode='valid'))

# 48. running mean via cumsum trick
def running_mean(x, N):
    cs = np.cumsum(x)
    cs[N:] = cs[N:] - cs[:-N]
    return cs[N - 1:] / N
print("Ex48 running mean:", running_mean(np.arange(1., 8.), 3))

# 49. np.histogram
counts, edges = np.histogram(np.random.randn(1000), bins=10)
print("Ex49 histogram counts shape:", counts.shape)

# 50. np.bincount — count occurrences of non-negative ints
arr5 = np.array([0, 1, 1, 2, 2, 2, 3])
print("Ex50 bincount:", np.bincount(arr5))  # [1 2 3 1]


def main():
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
