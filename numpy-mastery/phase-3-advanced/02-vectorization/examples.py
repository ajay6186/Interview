# ============================================================================
# Examples 3.2 — Vectorization  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np

# --- BASIC ---

# 1. simplest vectorization: apply math op to whole array
arr = np.array([1., 2., 3., 4., 5.])
print("Ex01:", arr ** 2)

# 2. vectorized conditional with np.where
print("Ex02:", np.where(arr > 3, arr, 0.))

# 3. np.vectorize with a simple function
def double_if_pos(x):
    return x * 2 if x > 0 else x
vdip = np.vectorize(double_if_pos)
print("Ex03:", vdip(np.array([-1., 0., 2., 3.])))

# 4. np.vectorize with multiple arguments
def safe_div(a, b):
    return a / b if b != 0 else 0.
vsafe_div = np.vectorize(safe_div)
print("Ex04:", vsafe_div(np.array([1., 2., 3.]), np.array([1., 0., 3.])))

# 5. np.vectorize otypes parameter (output type)
def is_even(n):
    return n % 2 == 0
vis_even = np.vectorize(is_even, otypes=[bool])
print("Ex05:", vis_even(np.arange(6)))

# 6. np.frompyfunc — creates ufunc
f_ufunc = np.frompyfunc(lambda x: x * x, 1, 1)
print("Ex06:", f_ufunc(np.array([1, 2, 3, 4])))

# 7. np.frompyfunc with 2 inputs
add_ufunc = np.frompyfunc(lambda a, b: a + b, 2, 1)
print("Ex07:", add_ufunc(np.array([1, 2, 3]), np.array([10, 20, 30])))

# 8. np.apply_along_axis — apply to rows
mat = np.array([[1., 2., 3.], [4., 5., 6.]])
print("Ex08 row sums:", np.apply_along_axis(np.sum, axis=1, arr=mat))

# 9. np.apply_along_axis — apply to columns
print("Ex09 col means:", np.apply_along_axis(np.mean, axis=0, arr=mat))

# 10. replace loop with broadcasting
x_loop = np.array([1., 2., 3., 4.])
y_loop = np.array([10., 20., 30.])
# Instead of nested loops:
result = x_loop[:, None] + y_loop[None, :]
print("Ex10 outer add:\n", result)

# 11. vectorized abs (vs list comprehension)
arr2 = np.array([-3., -1., 0., 2., 4.])
print("Ex11:", np.abs(arr2))

# 12. vectorized clamp with np.clip
print("Ex12:", np.clip(arr2, -2., 2.))

# 13. vectorized string operation via frompyfunc
upper_uf = np.frompyfunc(str.upper, 1, 1)
words = np.array(['hello', 'world', 'numpy'])
print("Ex13:", upper_uf(words))

# 14. apply_along_axis for custom normalization
def z_score(v):
    return (v - v.mean()) / v.std() if v.std() > 0 else v * 0
mat2 = np.array([[10., 20., 30.], [1., 5., 9.]])
print("Ex14 z-norm rows:\n", np.apply_along_axis(z_score, 1, mat2).round(3))

# 15. np.vectorize with excluded arguments
def power_of(x, exponent):
    return x ** exponent
vec_power = np.vectorize(power_of, excluded=['exponent'])
print("Ex15:", vec_power(np.array([1., 2., 3., 4.]), exponent=3))

# --- INTERMEDIATE ---

# 16. replace loop to check prime (vectorize)
def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return False
    return True
vec_prime = np.vectorize(is_prime, otypes=[bool])
print("Ex16 primes up to 20:", np.arange(2, 21)[vec_prime(np.arange(2, 21))])

# 17. np.piecewise — piecewise function
x = np.linspace(-3., 3., 13)
result2 = np.piecewise(x, [x < -1, (x >= -1) & (x <= 1), x > 1],
                       [-1., lambda t: t, 1.])
print("Ex17 piecewise:", result2)

# 18. np.select — multiple conditions with multiple choices
conditions = [x < -1, x > 1]
choices = [-1., 1.]
print("Ex18 select:", np.select(conditions, choices, default=x).round(2))

# 19. vectorize with string output
def fizzbuzz(n):
    if n % 15 == 0: return 'FizzBuzz'
    if n % 3 == 0: return 'Fizz'
    if n % 5 == 0: return 'Buzz'
    return str(n)
vfb = np.vectorize(fizzbuzz)
print("Ex19 fizzbuzz:", vfb(np.arange(1, 16)))

# 20. apply_along_axis for polynomial evaluation per row
def eval_poly(row, x):
    return np.polyval(row, x)
coeffs_mat = np.array([[1., 0., -1.], [2., 3., 1.]])
print("Ex20 poly at x=2:", np.apply_along_axis(eval_poly, 1, coeffs_mat, x=2.))

# 21. batch dot products without loop
A = np.random.rand(5, 4)
B = np.random.rand(5, 4)
# dot products row by row
dots = np.einsum('ij,ij->i', A, B)
print("Ex21 batch dots:", dots.round(3))

# 22. compare loop vs vectorized performance (time)
import time
N = 100000
arr_big = np.random.rand(N)
# Loop
t0 = time.perf_counter()
loop_res = np.array([x**0.5 for x in arr_big])
t1 = time.perf_counter()
# Vectorized
t2 = time.perf_counter()
vec_res = np.sqrt(arr_big)
t3 = time.perf_counter()
print(f"Ex22 loop: {(t1-t0)*1000:.1f}ms, vectorized: {(t3-t2)*1000:.2f}ms")

# 23. np.vectorize with complex output type
def complex_from_parts(r, theta):
    return r * np.exp(1j * theta)
vc = np.vectorize(complex_from_parts, otypes=[np.complex128])
print("Ex23:", vc(np.array([1., 2.]), np.array([0., np.pi])))

# 24. apply_along_axis for Euclidean norms of rows
pts = np.random.rand(4, 3)
norms = np.apply_along_axis(np.linalg.norm, 1, pts)
print("Ex24 norms:", norms.round(4))

# 25. vectorized lookup table
lut = np.array([0, 10, 20, 30, 40, 50])
indices = np.array([2, 0, 4, 3, 1])
print("Ex25 lut lookup:", lut[indices])

# 26. np.frompyfunc for running accumulation (non-standard)
max_so_far = np.frompyfunc(max, 2, 1)
print("Ex26 running max:", max_so_far.accumulate(np.array([3, 1, 4, 1, 5, 9, 2, 6])))

# 27. apply_along_axis for rank within each row
def rank_array(v):
    return np.argsort(np.argsort(v))
mat3 = np.array([[3., 1., 4.], [9., 2., 6.]])
print("Ex27 ranks per row:\n", np.apply_along_axis(rank_array, 1, mat3))

# 28. vectorized sign function
print("Ex28:", np.sign(np.array([-5., -1., 0., 2., 7.])))

# 29. np.vectorize caching with cache=True
vf = np.vectorize(is_prime, cache=True, otypes=[bool])
print("Ex29 primes:", vf(np.array([2, 3, 4, 5, 6, 7])))

# 30. apply_over_axes (apply reduction over multiple axes)
arr3d = np.arange(24).reshape(2, 3, 4).astype(float)
print("Ex30 sum over axes (0,2):", np.apply_over_axes(np.sum, arr3d, [0, 2]))

# --- ADVANCED ---

# 31. replace nested loop: pairwise operation
a_pw = np.array([1., 2., 3., 4.])
b_pw = np.array([10., 20., 30.])
# All pairwise max
print("Ex31:\n", np.maximum(a_pw[:, None], b_pw[None, :]))

# 32. batch processing with reshape
big2 = np.arange(1000.)
batches = big2.reshape(10, 100)
print("Ex32 batch means:", batches.mean(axis=1))

# 33. vectorized string matching
def starts_with_a(s):
    return s.startswith('a')
va = np.vectorize(starts_with_a, otypes=[bool])
words2 = np.array(['apple', 'banana', 'avocado', 'cherry'])
print("Ex33:", words2[va(words2)])

# 34. conditional update in-place (no loop)
arr4 = np.random.randn(10)
arr4[arr4 < 0] *= -1  # in-place abs
print("Ex34 all positive:", np.all(arr4 >= 0))

# 35. np.apply_along_axis with additional args
def weighted_mean(v, weights):
    return np.dot(v, weights) / np.sum(weights)
data = np.array([[1., 2., 3.], [4., 5., 6.]])
w = np.array([1., 2., 3.])
print("Ex35 weighted means:", np.apply_along_axis(weighted_mean, 1, data, weights=w))

# 36. efficient cumsum replacement for centered rolling mean
def centered_rolling(arr5, w):
    cs = np.cumsum(np.concatenate([[0.], arr5]))
    return (cs[w:] - cs[:-w]) / w
sig = np.arange(1., 11.)
print("Ex36 rolling mean(3):", centered_rolling(sig, 3))

# 37. apply_along_axis for custom distance
def l1_from_origin(v):
    return np.sum(np.abs(v))
pts2 = np.random.randn(5, 3)
print("Ex37 L1 distances:", np.apply_along_axis(l1_from_origin, 1, pts2).round(3))

# 38. frompyfunc for multi-output
def min_max(x):
    return x.min() if hasattr(x, 'min') else x, x.max() if hasattr(x, 'max') else x
# 2-output frompyfunc applied element-wise
mm_uf = np.frompyfunc(lambda x: (x, x**2), 1, 2)
out_a, out_b = mm_uf(np.array([1., 2., 3.]))
print("Ex38 frompyfunc 2-out:", out_a, out_b)

# 39. vectorized map equivalent
numbers = np.arange(1., 6.)
print("Ex39 map square:", numbers ** 2)  # no list(map(...)) needed

# 40. vectorized filter equivalent
print("Ex40 filter >3:", numbers[numbers > 3])

# 41. vectorized reduce (np.ufunc.reduce)
print("Ex41 reduce sum:", np.add.reduce(numbers))
print("Ex41 reduce prod:", np.multiply.reduce(numbers))

# 42. np.ufunc.outer for all-pairs operation
print("Ex42 add.outer:\n", np.add.outer(np.array([1, 2, 3]), np.array([10, 20])))

# --- EXPERT ---

# 43. custom ufunc via frompyfunc — soft thresholding
def soft_threshold(x, lam):
    sign = 1. if x > 0 else -1.
    return sign * max(abs(x) - lam, 0.)
vst = np.vectorize(soft_threshold)
print("Ex43:", vst(np.array([-3., -1., 0., 1., 3.]), 1.5))

# 44. cython-like strategy: pre-sort then vectorize
arr44 = np.random.rand(10)
sorted44 = np.sort(arr44)
print("Ex44 median (vectorized):", np.median(sorted44))

# 45. np.vectorize for symbolic differentiation (finite diff)
def finite_diff(f, x, h=1e-5):
    return (f(x + h) - f(x - h)) / (2 * h)
vfd = np.vectorize(finite_diff, excluded=['f', 'h'])
x_pts = np.linspace(0., np.pi, 5)
print("Ex45 d/dx sin(x):", vfd(np.sin, x_pts).round(4))

# 46. simd-friendly loop: operate on contiguous chunks
chunk_size = 8
arr46 = np.random.rand(64)
chunks = arr46.reshape(-1, chunk_size)
chunk_means = chunks.mean(axis=1)
print("Ex46 chunk means:", chunk_means.round(3))

# 47. mixed python/numpy: partial vectorization
def process_row(row):
    mean = row.mean()
    std = row.std()
    return (row - mean) / std if std > 0 else row * 0
rows = np.random.rand(5, 10)
processed = np.array([process_row(row) for row in rows])
print("Ex47 processed shape:", processed.shape)

# 48. numba-style concept: show that ufuncs are C-level
print("Ex48 np.sqrt is ufunc:", isinstance(np.sqrt, np.ufunc))
print("Ex48 np.add is ufunc:", isinstance(np.add, np.ufunc))
print("Ex48 np.vectorize is ufunc:", isinstance(np.vectorize(lambda x: x), np.ufunc))

# 49. generalized ufunc concept
# np.matmul has gufunc signature (n?,k),(k,m?)->(n?,m?)
print("Ex49 np.matmul signature:", np.matmul.signature if hasattr(np.matmul, 'signature') else "N/A")

# 50. combining vectorize + cache for memoized function
memo_cache = {}
def fib(n):
    if n in memo_cache: return memo_cache[n]
    if n <= 1: return n
    memo_cache[n] = fib(n-1) + fib(n-2)
    return memo_cache[n]
vfib = np.vectorize(fib, otypes=[np.int64])
print("Ex50 fib(0..10):", vfib(np.arange(11)))


def main():
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
