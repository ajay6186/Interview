# ============================================================================
# Examples 6.3 — Advanced Ufuncs  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np

np.random.seed(42)

# --- BASIC ---

# 1. built-in ufuncs: add, multiply, sqrt
a = np.array([1., 4., 9., 16.])
print("Ex01 np.sqrt:", np.sqrt(a))
print("Ex01 np.add:", np.add(a, 1))
print("Ex01 np.multiply:", np.multiply(a, 2))

# 2. ufunc on 2D array (element-wise)
M = np.array([[1., 2.], [3., 4.]])
print("Ex02 exp:", np.exp(M))

# 3. ufunc broadcasting
x = np.array([1., 2., 3.])
y = np.array([[0.], [1.], [2.]])
print("Ex03 broadcast add shape:", np.add(x, y).shape)

# 4. ufunc reduce: product along axis
print("Ex04 product:", np.multiply.reduce(a))

# 5. ufunc accumulate: running sum
print("Ex05 cumsum via accumulate:", np.add.accumulate(np.arange(1, 6)))

# 6. ufunc outer: outer product
print("Ex06 outer:\n", np.multiply.outer(np.array([1, 2, 3]), np.array([10, 20])))

# 7. ufunc at: unbuffered in-place
b = np.ones(5)
np.add.at(b, [0, 0, 2], 1.)
print("Ex07 add.at:", b)

# 8. np.frompyfunc: create ufunc from Python function
my_square = np.frompyfunc(lambda x_s: x_s**2, 1, 1)
result_sq = my_square(np.arange(5))
print("Ex08 frompyfunc square:", result_sq)

# 9. np.vectorize: vectorize a Python function
def clip_custom(x_c, lo=0., hi=1.):
    return min(max(x_c, lo), hi)
vclip = np.vectorize(clip_custom)
print("Ex09 vectorized clip:", vclip(np.linspace(-1, 2, 7)))

# 10. ufunc with out parameter
out = np.empty(4)
np.sqrt(a, out=out)
print("Ex10 sqrt with out:", out)

# 11. ufunc where parameter (masked)
result_where = np.sqrt(a, where=a > 4, out=np.ones_like(a))
print("Ex11 sqrt where > 4:", result_where)

# 12. np.vectorize with excluded arguments
def power(base, exp):
    return base**exp
vpow = np.vectorize(power, excluded=['exp'])
print("Ex12 vectorize excluded:", vpow(np.array([1., 2., 3.]), exp=3))

# 13. np.vectorize otypes
vabs = np.vectorize(abs, otypes=[np.float64])
print("Ex13 vectorize otypes:", vabs(np.array([-1, -2, 3])).dtype)

# 14. np.frompyfunc output dtype (object)
my_log = np.frompyfunc(np.log, 1, 1)
out_obj = my_log(np.array([1., np.e, np.e**2]))
print("Ex14 frompyfunc out dtype:", out_obj.dtype)

# 15. np.frompyfunc with multiple outputs
def min_max_pyfunc(x_mm):
    return x_mm - 1, x_mm + 1
mm_ufunc = np.frompyfunc(min_max_pyfunc, 1, 2)
lo_out, hi_out = mm_ufunc(np.array([2., 5., 8.]))
print("Ex15 min:", lo_out, "max:", hi_out)

# --- INTERMEDIATE ---

# 16. ufunc reduceat: grouped reduction
arr_red = np.arange(10, dtype=float)
idx_red = np.array([0, 3, 7])  # groups: [0:3], [3:7], [7:]
result_ra = np.add.reduceat(arr_red, idx_red)
print("Ex16 reduceat:", result_ra)  # [3+...], [3:7], [7+...]

# 17. np.vectorize caching (cache=True)
call_count = [0]
def counted_fn(x_v):
    call_count[0] += 1
    return x_v * 2
vc = np.vectorize(counted_fn, cache=True)
_ = vc(np.ones(5))
print("Ex17 call count:", call_count[0])

# 18. apply_along_axis
M2 = np.random.rand(4, 6)
row_ranges = np.apply_along_axis(lambda r: r.max() - r.min(), axis=1, arr=M2)
print("Ex18 row ranges:", row_ranges.round(4))

# 19. apply_over_axes
M3 = np.random.rand(3, 4, 5)
result_aoa = np.apply_over_axes(np.sum, M3, axes=[0, 2])
print("Ex19 apply_over_axes shape:", result_aoa.shape)

# 20. custom ufunc: clamped sigmoid
def clamped_sigmoid(x_cs):
    z = 1 / (1 + np.exp(-x_cs))
    return np.clip(z, 1e-7, 1 - 1e-7)
v_sigmoid = np.vectorize(clamped_sigmoid)
print("Ex20 clamped sigmoid:", v_sigmoid(np.array([-5., 0., 5.])).round(6))

# 21. ufunc with complex numbers
c = np.array([1+2j, 3-4j, -1+0j])
print("Ex21 absolute (complex):", np.absolute(c))
print("Ex21 angle:", np.angle(c).round(4))

# 22. np.piecewise as vectorized conditional
x_pw = np.linspace(-3, 3, 7)
result_pw = np.piecewise(x_pw,
                          [x_pw < -1, (x_pw >= -1) & (x_pw <= 1), x_pw > 1],
                          [-1., lambda t: t, 1.])
print("Ex22 piecewise:", result_pw.round(4))

# 23. ufunc type resolution
arr_i = np.array([1, 2, 3], dtype=np.int32)
arr_f = np.array([1., 2., 3.], dtype=np.float64)
result_type = np.add(arr_i, arr_f)
print("Ex23 int+float dtype:", result_type.dtype)

# 24. logaddexp: numerically stable log(exp(a) + exp(b))
a_lae = np.array([1000., 1001.])
b_lae = np.array([1001., 1000.])
print("Ex24 logaddexp:", np.logaddexp(a_lae, b_lae).round(4))

# 25. heaviside function
x_hv = np.linspace(-2, 2, 9)
print("Ex25 heaviside:", np.heaviside(x_hv, 0.5))

# 26. np.frexp and np.ldexp (mantissa-exponent decomposition)
arr_mant = np.array([1., 2., 4., 0.5])
mantissa, exponent = np.frexp(arr_mant)
print("Ex26 mantissa:", mantissa, "exponent:", exponent)
print("Ex26 reconstruct:", np.ldexp(mantissa, exponent))

# 27. ufunc at with repeated indices (histogramming concept)
hist_out = np.zeros(5, dtype=int)
indices_hist = np.array([0, 1, 1, 2, 3, 3, 3, 4])
np.add.at(hist_out, indices_hist, 1)
print("Ex27 histogram via add.at:", hist_out)

# 28. outer product for kernel matrix
x_kern = np.linspace(0, 1, 5)
K_rbf = np.exp(-np.subtract.outer(x_kern, x_kern)**2 / 0.2)
print("Ex28 RBF kernel shape:", K_rbf.shape)

# 29. np.vectorize with signature
def row_dot(a_rd, b_rd):
    return np.dot(a_rd, b_rd)
v_dot = np.vectorize(row_dot, signature='(n),(n)->()')
A3 = np.random.rand(4, 3)
B3 = np.random.rand(4, 3)
print("Ex29 vectorized row dot:", v_dot(A3, B3).round(4))

# 30. np.frompyfunc for string operations
def to_upper(s_tu):
    return str(s_tu).upper()
v_upper = np.frompyfunc(to_upper, 1, 1)
arr_str = np.array(['hello', 'world', 'numpy'])
print("Ex30 upper:", v_upper(arr_str))

# --- ADVANCED ---

# 31. generalized ufunc (gufunc) via np.vectorize signature — matrix-vector product
def mat_vec(M_mv, v_mv):
    return M_mv @ v_mv
gufunc_matvec = np.vectorize(mat_vec, signature='(m,n),(n)->(m)')
batch_M = np.random.rand(5, 3, 4)
batch_v = np.random.rand(5, 4)
batch_result = gufunc_matvec(batch_M, batch_v)
print("Ex31 batched mat-vec shape:", batch_result.shape)

# 32. custom softmax ufunc
def softmax_row(x_sm):
    e = np.exp(x_sm - x_sm.max())
    return e / e.sum()
v_softmax = np.vectorize(softmax_row, signature='(n)->(n)')
X_sm = np.random.rand(4, 5)
sm_out = v_softmax(X_sm)
print("Ex32 softmax row sums:", sm_out.sum(axis=1).round(6))

# 33. ufunc for pairwise L2 distance
def pairwise_l2(X_l2):
    diff = X_l2[:, None, :] - X_l2[None, :, :]
    return np.sqrt(np.sum(diff**2, axis=2))
X_pts = np.random.rand(6, 3)
D = pairwise_l2(X_pts)
print("Ex33 pairwise distance shape:", D.shape)

# 34. custom ufunc: log-sum-exp (numerically stable)
def log_sum_exp(x_lse):
    max_x = x_lse.max()
    return max_x + np.log(np.sum(np.exp(x_lse - max_x)))
v_lse = np.vectorize(log_sum_exp, signature='(n)->()')
rows = np.random.rand(5, 4)
print("Ex34 log-sum-exp:", v_lse(rows).round(4))

# 35. ufunc composition
def relu(x_r):
    return np.maximum(x_r, 0)
def leaky_relu(x_lr, alpha=0.01):
    return np.where(x_lr >= 0, x_lr, alpha * x_lr)
x_activations = np.linspace(-3, 3, 7)
print("Ex35 ReLU:", relu(x_activations))
print("Ex35 LeakyReLU:", leaky_relu(x_activations).round(4))

# 36. parallel ufunc with where mask
base = np.random.rand(8)
mask_uf = base > 0.5
result_masked = np.where(mask_uf, np.log(base), -np.log(1 - base + 1e-8))
print("Ex36 masked log-odds:", result_masked.round(4))

# 37. batch normalization as ufunc
def batch_norm_row(x_bn, mean_bn, std_bn):
    return (x_bn - mean_bn) / (std_bn + 1e-8)
v_bn = np.vectorize(batch_norm_row, excluded=['mean_bn', 'std_bn'])
X_bn = np.random.rand(5)
print("Ex37 batch norm:", v_bn(X_bn, mean_bn=X_bn.mean(), std_bn=X_bn.std()).round(4))

# 38. custom ufunc: truncated normal sampling
def truncnorm_sample(mean_tn, std_tn, lo=-3., hi=3.):
    x_tn = np.random.normal(mean_tn, std_tn)
    return np.clip(x_tn, mean_tn + lo*std_tn, mean_tn + hi*std_tn)
v_tn = np.vectorize(truncnorm_sample)
print("Ex38 truncated samples:", v_tn(np.zeros(5), np.ones(5)).round(4))

# 39. ufunc for Fibonacci using accumulate concept
# np.frompyfunc can be used with binary functions
def fib_add(a_f, b_f):
    return b_f
fib_ufunc = np.frompyfunc(fib_add, 2, 1)
# Fibonacci: use Python list
fib_seq = [0, 1]
for _ in range(8):
    fib_seq.append(fib_seq[-1] + fib_seq[-2])
print("Ex39 Fibonacci:", fib_seq)

# 40. ufunc reduce for logical operations
arr_bool = np.array([True, True, False, True])
print("Ex40 logical_and reduce:", np.logical_and.reduce(arr_bool))
print("Ex40 logical_or reduce:", np.logical_or.reduce(arr_bool))

# 41. custom ufunc: running max (vs np.maximum.accumulate)
arr_run = np.array([3., 1., 4., 1., 5., 9., 2., 6.])
print("Ex41 running max:", np.maximum.accumulate(arr_run))

# 42. apply a bank of filters using ufuncs
filters = np.array([
    lambda x_f: x_f**2,
    lambda x_f: np.sqrt(np.abs(x_f)),
    lambda x_f: np.tanh(x_f),
])
x_input = np.linspace(-2, 2, 5)
bank_out = np.array([f(x_input) for f in filters])
print("Ex42 filter bank shape:", bank_out.shape)

# --- EXPERT ---

# 43. Cython-style inner loop simulation with frompyfunc
# Simulate what a compiled ufunc kernel would compute
def poly_eval_scalar(x_pe, *coeffs_pe):
    # Horner's method, coeffs from highest to lowest power
    result_pe = 0.
    for c in coeffs_pe:
        result_pe = result_pe * x_pe + c
    return result_pe
coeffs_poly = [1., -2., 1.]  # x^2 - 2x + 1
poly_ufunc = np.frompyfunc(lambda x_p: poly_eval_scalar(x_p, *coeffs_poly), 1, 1)
x_poly_test = np.linspace(0, 3, 7)
print("Ex43 poly eval:", np.array(poly_ufunc(x_poly_test), dtype=float).round(4))

# 44. matrix chain rule (batched Jacobian-vector products)
def jvp(J_mat, v_jvp):
    return J_mat @ v_jvp
v_jvp = np.vectorize(jvp, signature='(m,n),(n)->(m)')
Js = np.random.rand(10, 3, 4)  # batch of 10 Jacobians
vs = np.random.rand(10, 4)     # batch of 10 vectors
products = v_jvp(Js, vs)
print("Ex44 batched JVP shape:", products.shape)

# 45. ufunc for numerical gradient (central difference)
def grad_central(f_gc, x_gc, eps=1e-7):
    return (f_gc(x_gc + eps) - f_gc(x_gc - eps)) / (2 * eps)
# gradient of f(x) = sin(x) at multiple points
x_grad_pts = np.linspace(0, 2*np.pi, 7)
f_grad = np.vectorize(lambda x_g: grad_central(np.sin, x_g))
print("Ex45 numerical grad:", f_grad(x_grad_pts).round(4))

# 46. custom ufunc: inverse CDF (percent-point function) for N(0,1)
from scipy.special import erfinv  # would be used in real code
# Here we approximate using the rational approx
def normal_ppf(p_ppf):
    if p_ppf <= 0 or p_ppf >= 1:
        return np.nan
    # Beasley-Springer-Moro approximation
    r = p_ppf if p_ppf < 0.5 else 1 - p_ppf
    t = np.sqrt(-2 * np.log(r))
    c = np.array([2.515517, 0.802853, 0.010328])
    d = np.array([1.432788, 0.189269, 0.001308])
    result_ppf = t - (c[0] + c[1]*t + c[2]*t**2) / (1 + d[0]*t + d[1]*t**2 + d[2]*t**3)
    return -result_ppf if p_ppf < 0.5 else result_ppf
v_ppf = np.vectorize(normal_ppf)
ps = np.array([0.025, 0.5, 0.975])
print("Ex46 normal PPF:", v_ppf(ps).round(4))

# 47. ufunc for time-series feature extraction (mean, std, skew)
def ts_features(arr_ts):
    m = arr_ts.mean()
    s = arr_ts.std()
    skew = ((arr_ts - m)**3).mean() / (s**3 + 1e-8)
    return m, s, skew
v_ts = np.vectorize(ts_features, signature='(n)->(),(),()')
ts_batch = np.random.randn(8, 50)
means_ts, stds_ts, skews_ts = v_ts(ts_batch)
print("Ex47 TS feature means shape:", means_ts.shape)

# 48. ufunc with structured output
def summarize(row_s):
    return row_s.mean(), row_s.std(), row_s.max()
X_48 = np.random.rand(5, 10)
results_48 = np.array([summarize(X_48[i]) for i in range(5)],
                       dtype=[('mean', 'f8'), ('std', 'f8'), ('max', 'f8')])
print("Ex48 structured ufunc output:", results_48['mean'].round(4))

# 49. compose ufuncs into a pipeline
ufunc_pipeline = [
    np.negative,        # negate
    np.exp,             # exp of negated
    lambda x_pl: np.add(x_pl, 1),  # +1
    np.log,             # log
]
x_pipe = np.array([0.5, 1., 2.])
y_pipe = x_pipe.copy()
for fn in ufunc_pipeline:
    y_pipe = fn(y_pipe)
print("Ex49 ufunc pipeline:", y_pipe.round(4))

# 50. register a custom ufunc loop concept (frompyfunc + astype)
def safe_divide(a_sd, b_sd):
    return a_sd / b_sd if b_sd != 0 else 0.
safe_div_ufunc = np.frompyfunc(safe_divide, 2, 1)
a_50 = np.array([1., 2., 3., 4.])
b_50 = np.array([0., 2., 0., 4.])
result_50 = safe_div_ufunc(a_50, b_50).astype(float)
print("Ex50 safe divide:", result_50)


def main():
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
