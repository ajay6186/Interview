# ============================================================================
# Examples 6.4 — Optimization  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np
import time

np.random.seed(42)

# --- BASIC ---

# 1. C-order vs Fortran-order: row-wise access
arr_c = np.random.rand(1000, 1000)
arr_f = np.asfortranarray(arr_c)
t0 = time.perf_counter()
_ = arr_c.sum(axis=1)  # row sums — C-order friendly
t_c = time.perf_counter() - t0
t0 = time.perf_counter()
_ = arr_f.sum(axis=1)
t_f = time.perf_counter() - t0
print("Ex01 C-order row sum time:", round(t_c*1000, 3), "ms")
print("Ex01 F-order row sum time:", round(t_f*1000, 3), "ms")

# 2. in-place operations to avoid copies
a = np.random.rand(10_000)
b = np.random.rand(10_000)
# out-of-place creates a new array
c_new = a + b
# in-place: reuse memory
a += b  # equivalent but no new allocation
print("Ex02 in-place result matches:", np.allclose(a, c_new))

# 3. pre-allocate output arrays
n = 100_000
result = np.empty(n)
for i in range(0, n, 1000):
    result[i:i+1000] = np.sin(np.arange(i, i+1000) * 0.001)
print("Ex03 pre-allocated result shape:", result.shape)

# 4. use views instead of copies for slicing
big = np.random.rand(1000, 1000)
view_slice = big[100:200, 100:200]  # view — no copy
copy_slice = big[100:200, 100:200].copy()  # copy
print("Ex04 view shares memory:", np.shares_memory(view_slice, big))
print("Ex04 copy shares memory:", np.shares_memory(copy_slice, big))

# 5. vectorize instead of Python loop
x = np.linspace(0, 1, 100_000)
# Loop (slow)
t0 = time.perf_counter()
loop_result = np.empty_like(x)
for i in range(len(x)):
    loop_result[i] = np.sin(x[i])**2 + np.cos(x[i])**2
t_loop = time.perf_counter() - t0
# Vectorized (fast)
t0 = time.perf_counter()
vec_result = np.sin(x)**2 + np.cos(x)**2
t_vec = time.perf_counter() - t0
print("Ex05 loop time:", round(t_loop*1000, 2), "ms | vectorized:", round(t_vec*1000, 2), "ms")
print("Ex05 speedup:", round(t_loop / max(t_vec, 1e-9), 1), "x")

# 6. use built-in ufuncs instead of math module
import math
t0 = time.perf_counter()
_ = [math.sqrt(v) for v in x]
t_math = time.perf_counter() - t0
t0 = time.perf_counter()
_ = np.sqrt(x)
t_np = time.perf_counter() - t0
print("Ex06 math.sqrt:", round(t_math*1000, 2), "ms | np.sqrt:", round(t_np*1000, 2), "ms")

# 7. avoid unnecessary type promotion
arr_i16 = np.random.randint(0, 100, 100_000, dtype=np.int16)
arr_i32 = arr_i16.astype(np.int32)
print("Ex07 int16 nbytes:", arr_i16.nbytes, "int32 nbytes:", arr_i32.nbytes)
print("Ex07 int16 sum:", arr_i16.sum(dtype=np.int64))  # safe sum

# 8. contiguous arrays for speed
non_contig = big[::2, ::2]
print("Ex08 non-contiguous:", non_contig.flags['C_CONTIGUOUS'])
contig = np.ascontiguousarray(non_contig)
print("Ex08 contiguous:", contig.flags['C_CONTIGUOUS'])

# 9. reduce memory allocation in matrix multiply chain
A, B, C = np.random.rand(100, 50), np.random.rand(50, 80), np.random.rand(80, 30)
# (A@B)@C — choose optimal order
left_first = (A @ B) @ C
right_first = A @ (B @ C)
print("Ex09 matmul results close:", np.allclose(left_first, right_first))

# 10. use np.einsum for complex contractions
A_ein = np.random.rand(50, 60)
B_ein = np.random.rand(60, 40)
result_ein = np.einsum('ij,jk->ik', A_ein, B_ein)
result_mm = A_ein @ B_ein
print("Ex10 einsum vs matmul:", np.allclose(result_ein, result_mm))

# 11. trace via einsum
M_trace = np.random.rand(100, 100)
print("Ex11 trace:", round(np.einsum('ii->', M_trace), 4))
print("Ex11 np.trace:", round(np.trace(M_trace), 4))

# 12. batch dot product with einsum
X_bd = np.random.rand(200, 5)
W_bd = np.random.rand(5, 3)
Y_bd = np.einsum('ij,jk->ik', X_bd, W_bd)
print("Ex12 batch dot shape:", Y_bd.shape)

# 13. avoid temporary arrays with einsum optimize
A_opt = np.random.rand(100, 50)
B_opt = np.random.rand(50, 80)
C_opt = np.random.rand(80, 30)
result_no_opt = np.einsum('ij,jk,kl->il', A_opt, B_opt, C_opt)
result_optimized = np.einsum('ij,jk,kl->il', A_opt, B_opt, C_opt, optimize=True)
print("Ex13 optimized einsum close:", np.allclose(result_no_opt, result_optimized))

# 14. use structured operations for rolling sums
data_roll = np.random.rand(10_000)
window = 100
# Efficient: cumsum trick
cumsum = np.cumsum(np.concatenate([[0.], data_roll]))
rolling_sum = cumsum[window:] - cumsum[:-window]
print("Ex14 rolling sum shape:", rolling_sum.shape)

# 15. avoid Python object arrays
arr_obj = np.array([1, 2, 3], dtype=object)  # slow
arr_float = np.array([1., 2., 3.], dtype=float)  # fast
t0 = time.perf_counter()
_ = np.sum(arr_obj * 2)
t_obj = time.perf_counter() - t0
t0 = time.perf_counter()
_ = np.sum(arr_float * 2)
t_float = time.perf_counter() - t0
print("Ex15 object array time:", round(t_obj*1e6, 2), "µs | float:", round(t_float*1e6, 2), "µs")

# --- INTERMEDIATE ---

# 16. BLAS level-3: use matmul for large matrices
n_blas = 500
A_blas = np.random.rand(n_blas, n_blas)
B_blas = np.random.rand(n_blas, n_blas)
t0 = time.perf_counter()
C_blas = A_blas @ B_blas
t_blas = time.perf_counter() - t0
print("Ex16 BLAS matmul time:", round(t_blas*1000, 2), "ms")

# 17. cache-friendly access pattern
arr_2d = np.random.rand(1000, 1000)
t0 = time.perf_counter()
row_sum = arr_2d.sum(axis=1)  # cache-friendly
t_row = time.perf_counter() - t0
t0 = time.perf_counter()
col_sum = arr_2d.sum(axis=0)  # column sum still ok in NumPy (uses BLAS)
t_col = time.perf_counter() - t0
print("Ex17 row sum:", round(t_row*1000, 3), "ms | col sum:", round(t_col*1000, 3), "ms")

# 18. stride tricks for rolling window (view, no copy)
data_st = np.arange(20, dtype=float)
window_st = 5
shape_st = data_st.shape[:-1] + (data_st.shape[-1] - window_st + 1, window_st)
strides_st = data_st.strides + (data_st.strides[-1],)
rolling_view = np.lib.stride_tricks.as_strided(data_st, shape=shape_st, strides=strides_st)
print("Ex18 stride trick shape:", rolling_view.shape)

# 19. use np.searchsorted instead of linear scan
sorted_arr = np.sort(np.random.rand(100_000))
query = 0.5
t0 = time.perf_counter()
idx_linear = np.where(sorted_arr >= query)[0][0]
t_linear = time.perf_counter() - t0
t0 = time.perf_counter()
idx_bs = np.searchsorted(sorted_arr, query)
t_bs = time.perf_counter() - t0
print("Ex19 linear:", round(t_linear*1e6, 2), "µs | searchsorted:", round(t_bs*1e6, 2), "µs")
print("Ex19 results match:", idx_linear == idx_bs)

# 20. use np.where instead of boolean indexing for assignment
arr_where = np.random.randn(100_000)
t0 = time.perf_counter()
result_fancy = arr_where.copy(); result_fancy[result_fancy < 0] = 0
t_fancy = time.perf_counter() - t0
t0 = time.perf_counter()
result_where = np.where(arr_where >= 0, arr_where, 0)
t_where = time.perf_counter() - t0
print("Ex20 fancy indexing:", round(t_fancy*1000, 3), "ms | np.where:", round(t_where*1000, 3), "ms")

# 21. use np.bincount instead of np.unique + loop
labels_bc = np.random.randint(0, 10, 100_000)
t0 = time.perf_counter()
counts_bincount = np.bincount(labels_bc)
t_bc = time.perf_counter() - t0
t0 = time.perf_counter()
vals_u, counts_u = np.unique(labels_bc, return_counts=True)
t_u = time.perf_counter() - t0
print("Ex21 bincount:", round(t_bc*1e6, 2), "µs | unique:", round(t_u*1e6, 2), "µs")

# 22. avoid advanced indexing when basic suffices
arr_adv = np.random.rand(1000, 1000)
t0 = time.perf_counter()
_ = arr_adv[[0, 1, 2], :]  # advanced indexing (copy)
t_adv = time.perf_counter() - t0
t0 = time.perf_counter()
_ = arr_adv[:3, :]  # basic slicing (view)
t_basic = time.perf_counter() - t0
print("Ex22 advanced:", round(t_adv*1e6, 2), "µs | basic:", round(t_basic*1e6, 2), "µs")

# 23. use np.clip instead of np.where for bounds
arr_clip = np.random.randn(100_000)
t0 = time.perf_counter()
_ = np.where(arr_clip < -1, -1., np.where(arr_clip > 1, 1., arr_clip))
t_w = time.perf_counter() - t0
t0 = time.perf_counter()
_ = np.clip(arr_clip, -1, 1)
t_clip = time.perf_counter() - t0
print("Ex23 where:", round(t_w*1000, 3), "ms | clip:", round(t_clip*1000, 3), "ms")

# 24. memory pool pattern: reuse scratch arrays
scratch = np.empty(100_000)
for i in range(10):
    np.sin(np.linspace(0, 1, 100_000), out=scratch)  # reuse output buffer
print("Ex24 scratch buffer last value:", round(float(scratch[-1]), 4))

# 25. avoid redundant computation with caching
cache_dict = {}
def cached_expensive(x_c):
    key = x_c.tobytes()
    if key not in cache_dict:
        cache_dict[key] = np.linalg.eigvalsh(x_c)
    return cache_dict[key]
M_cache = np.eye(5)
_ = cached_expensive(M_cache)
_ = cached_expensive(M_cache)  # cache hit
print("Ex25 cache hits:", len(cache_dict))

# 26. use np.add.reduceat for group sums
values_ra = np.random.rand(100)
group_starts = np.array([0, 20, 50, 80])
group_sums = np.add.reduceat(values_ra, group_starts)
print("Ex26 group sums:", group_sums.round(4))

# 27. avoid .T for large transposes (use np.einsum or adjust layout)
mat_t = np.random.rand(500, 300)
# einsum for A.T @ A (Gram matrix)
gram_ein = np.einsum('ij,ik->jk', mat_t, mat_t)
gram_mm = mat_t.T @ mat_t
print("Ex27 Gram matrix close:", np.allclose(gram_ein, gram_mm))

# 28. block matrix operations
A_blk = np.random.rand(100, 100)
B_blk = np.random.rand(100, 100)
C_blk = np.random.rand(100, 100)
D_blk = np.random.rand(100, 100)
block_M = np.block([[A_blk, B_blk], [C_blk, D_blk]])
print("Ex28 block matrix shape:", block_M.shape)

# 29. use np.dot for 1D vectors (avoids overhead of matmul)
u = np.random.rand(10_000)
v = np.random.rand(10_000)
t0 = time.perf_counter()
_ = np.dot(u, v)
t_dot = time.perf_counter() - t0
t0 = time.perf_counter()
_ = (u * v).sum()
t_sum = time.perf_counter() - t0
print("Ex29 np.dot:", round(t_dot*1e6, 2), "µs | element-wise sum:", round(t_sum*1e6, 2), "µs")

# 30. float32 vs float64: memory and speed
arr32 = np.random.rand(1_000_000).astype(np.float32)
arr64 = np.random.rand(1_000_000).astype(np.float64)
t0 = time.perf_counter(); _ = np.sum(arr32); t32 = time.perf_counter() - t0
t0 = time.perf_counter(); _ = np.sum(arr64); t64 = time.perf_counter() - t0
print("Ex30 float32 sum:", round(t32*1000, 3), "ms | float64:", round(t64*1000, 3), "ms")
print("Ex30 float32 bytes:", arr32.nbytes, "float64 bytes:", arr64.nbytes)

# --- ADVANCED ---

# 31. Numba-like optimization with np.vectorize (type hinting)
# Pure NumPy loop-free alternative to numba.jit
def compute_kernel(X_ck, Y_ck, sigma=1.0):
    """RBF kernel matrix — fully vectorized"""
    diff = X_ck[:, None, :] - Y_ck[None, :, :]
    return np.exp(-np.sum(diff**2, axis=2) / (2 * sigma**2))
X_kern = np.random.rand(200, 10)
Y_kern = np.random.rand(150, 10)
K = compute_kernel(X_kern, Y_kern)
print("Ex31 RBF kernel shape:", K.shape)

# 32. FFT-based convolution vs direct convolution
n_conv = 1024
sig = np.random.rand(n_conv)
ker = np.random.rand(64)
t0 = time.perf_counter()
direct = np.convolve(sig, ker, mode='full')
t_direct = time.perf_counter() - t0
t0 = time.perf_counter()
n_fft = n_conv + len(ker) - 1
fft_conv = np.fft.irfft(np.fft.rfft(sig, n_fft) * np.fft.rfft(ker, n_fft), n_fft)
t_fft = time.perf_counter() - t0
print("Ex32 direct:", round(t_direct*1e6, 2), "µs | FFT:", round(t_fft*1e6, 2), "µs")
print("Ex32 results close:", np.allclose(direct[:n_conv+len(ker)-1], fft_conv))

# 33. data layout: SoA vs AoS
n_particles = 100_000
# Array of Structures
aos = np.zeros(n_particles, dtype=[('x', 'f4'), ('y', 'f4'), ('z', 'f4'), ('mass', 'f4')])
# Structure of Arrays
soa_x = np.random.rand(n_particles).astype('f4')
soa_y = np.random.rand(n_particles).astype('f4')
soa_z = np.random.rand(n_particles).astype('f4')
soa_mass = np.random.rand(n_particles).astype('f4')
# SoA: compute total kinetic energy (SoA is faster for this)
t0 = time.perf_counter()
ke_soa = 0.5 * soa_mass * (soa_x**2 + soa_y**2 + soa_z**2)
t_soa = time.perf_counter() - t0
aos['x'] = soa_x; aos['y'] = soa_y; aos['z'] = soa_z; aos['mass'] = soa_mass
t0 = time.perf_counter()
ke_aos = 0.5 * aos['mass'] * (aos['x']**2 + aos['y']**2 + aos['z']**2)
t_aos = time.perf_counter() - t0
print("Ex33 SoA time:", round(t_soa*1000, 3), "ms | AoS time:", round(t_aos*1000, 3), "ms")

# 34. avoid broadcasting copies with einsum
n_34, d_34 = 1000, 100
X_34 = np.random.rand(n_34, d_34)
# Subtract mean: X - X.mean(axis=0) — broadcasting allocates (n,d)
mean_34 = X_34.mean(axis=0)
# Both approaches are equivalent but einsum can be more explicit
X_centered = X_34 - mean_34  # broadcasting (necessary allocation)
print("Ex34 centered mean:", X_centered.mean(axis=0).max().round(10))

# 35. Gram-Schmidt orthogonalization
def gram_schmidt(A_gs):
    Q = np.empty_like(A_gs, dtype=float)
    for j in range(A_gs.shape[1]):
        q = A_gs[:, j].astype(float)
        for k in range(j):
            q -= np.dot(Q[:, k], A_gs[:, j]) * Q[:, k]
        norm_q = np.linalg.norm(q)
        Q[:, j] = q / norm_q if norm_q > 1e-10 else q
    return Q
A_gs = np.random.rand(10, 5)
Q_gs = gram_schmidt(A_gs)
print("Ex35 Q orthogonal:", np.allclose(Q_gs.T @ Q_gs, np.eye(5), atol=1e-10))

# 36. lazy evaluation pattern (generator of slices)
def lazy_column_norms(M_lz):
    for j in range(M_lz.shape[1]):
        yield np.linalg.norm(M_lz[:, j])
norms_lazy = list(lazy_column_norms(np.random.rand(100, 10)))
print("Ex36 column norms (first 3):", [round(n_v, 4) for n_v in norms_lazy[:3]])

# 37. efficient outer product via broadcasting
u_outer = np.random.rand(500)
v_outer = np.random.rand(400)
t0 = time.perf_counter()
_ = np.outer(u_outer, v_outer)
t_outer = time.perf_counter() - t0
t0 = time.perf_counter()
_ = u_outer[:, None] * v_outer[None, :]
t_bc = time.perf_counter() - t0
print("Ex37 np.outer:", round(t_outer*1000, 3), "ms | broadcasting:", round(t_bc*1000, 3), "ms")

# 38. specialized matrix operations (diagonal avoidance)
M_diag = np.random.rand(500, 500)
# Avoid building full Gram matrix when only diagonal is needed
diag_gram = np.einsum('ij,ij->i', M_diag, M_diag)  # row norms squared
full_gram_diag = np.diag(M_diag @ M_diag.T)
print("Ex38 diag via einsum close:", np.allclose(diag_gram, full_gram_diag))

# 39. tile vs broadcast for repeated patterns
n_rep = 10
pattern = np.random.rand(100)
t0 = time.perf_counter(); _ = np.tile(pattern, n_rep); t_tile = time.perf_counter() - t0
t0 = time.perf_counter()
_ = np.broadcast_to(pattern, (n_rep, 100))  # view!
t_bc2 = time.perf_counter() - t0
print("Ex39 tile:", round(t_tile*1e6, 2), "µs | broadcast_to:", round(t_bc2*1e6, 2), "µs (view)")

# 40. reduced precision accumulation
def kahan_sum_np(arr_k):
    total, c = 0., 0.
    for xi in arr_k:
        y = xi - c
        t = total + y
        c = (t - total) - y
        total = t
    return total
arr_kahan_op = np.full(100_000, 0.1)
naive = float(arr_kahan_op.sum())
kahan = kahan_sum_np(arr_kahan_op)
print("Ex40 naive sum:", naive, "Kahan sum:", kahan, "error diff:", abs(naive - kahan))

# 41. parallel computation concept (chunk-based pseudo-parallel)
def parallel_map(func_pm, data_pm, n_chunks=4):
    chunk_s = len(data_pm) // n_chunks
    results_pm = []
    for i in range(0, len(data_pm), chunk_s):
        results_pm.append(func_pm(data_pm[i:i+chunk_s]))
    return np.concatenate(results_pm)
result_pm = parallel_map(np.sin, np.linspace(0, 2*np.pi, 1000))
print("Ex41 pseudo-parallel map shape:", result_pm.shape)

# 42. avoid redundant matrix factorizations
A_fact = np.random.rand(200, 200)
A_fact_sym = A_fact.T @ A_fact + np.eye(200) * 10  # PSD
# Compute cholesky once, use for multiple solves
L_chol = np.linalg.cholesky(A_fact_sym)
b_vectors = np.random.rand(200, 5)
# Solve via forward and back substitution
X_multi = np.linalg.solve(A_fact_sym, b_vectors)
X_verify = np.linalg.lstsq(A_fact_sym, b_vectors, rcond=None)[0]
print("Ex42 multi-RHS solve close:", np.allclose(X_multi, X_verify))

# --- EXPERT ---

# 43. memory bandwidth optimization: element-wise + reduction fusion
n_43 = 1_000_000
a_43 = np.random.rand(n_43)
b_43 = np.random.rand(n_43)
# Non-fused: two passes
t0 = time.perf_counter()
temp_43 = a_43 * b_43
result_43 = temp_43.sum()
t_nofuse = time.perf_counter() - t0
# "Fused" via einsum
t0 = time.perf_counter()
result_ein_43 = np.einsum('i,i->', a_43, b_43)
t_fuse = time.perf_counter() - t0
print("Ex43 non-fused:", round(t_nofuse*1000, 3), "ms | einsum dot:", round(t_fuse*1000, 3), "ms")
print("Ex43 results close:", np.isclose(result_43, result_ein_43))

# 44. BLAS dgemm equivalent with numpy
def fast_matmul(A_fm, B_fm):
    return np.dot(A_fm, B_fm)  # uses BLAS DGEMM
n_44 = 300
A_44 = np.random.rand(n_44, n_44)
B_44 = np.random.rand(n_44, n_44)
t0 = time.perf_counter()
_ = fast_matmul(A_44, B_44)
t_dot = time.perf_counter() - t0
print("Ex44 BLAS DGEMM time:", round(t_dot*1000, 3), "ms")

# 45. numpy config / BLAS info
try:
    info = np.__config__.blas_opt_info
    print("Ex45 BLAS info keys:", list(info.keys())[:3])
except AttributeError:
    print("Ex45 BLAS info: not available (numpy>=2.0)")

# 46. profile memory usage of operations
def mem_usage_bytes(arr_mem):
    return arr_mem.nbytes
n_46 = 1000
ops = {
    'zeros float64': np.zeros((n_46, n_46), dtype=np.float64),
    'zeros float32': np.zeros((n_46, n_46), dtype=np.float32),
    'zeros int8':    np.zeros((n_46, n_46), dtype=np.int8),
}
for name_mem, arr_m in ops.items():
    print(f"Ex46 {name_mem}: {mem_usage_bytes(arr_m)/1e6:.2f} MB")

# 47. blocked matrix operations (improve cache behavior)
def blocked_matmul(A_bm, B_bm, block=64):
    n_bm = A_bm.shape[0]
    C_bm = np.zeros((n_bm, B_bm.shape[1]))
    for i in range(0, n_bm, block):
        for k in range(0, A_bm.shape[1], block):
            for j in range(0, B_bm.shape[1], block):
                C_bm[i:i+block, j:j+block] += (
                    A_bm[i:i+block, k:k+block] @
                    B_bm[k:k+block, j:j+block]
                )
    return C_bm
A_blk47 = np.random.rand(128, 128)
B_blk47 = np.random.rand(128, 128)
C_blocked = blocked_matmul(A_blk47, B_blk47)
print("Ex47 blocked matmul close:", np.allclose(C_blocked, A_blk47 @ B_blk47))

# 48. efficient softmax with numerical stability and vectorization
def fast_softmax(X_fs):
    X_shifted = X_fs - X_fs.max(axis=1, keepdims=True)
    exp_X = np.exp(X_shifted)
    return exp_X / exp_X.sum(axis=1, keepdims=True)
X_sm48 = np.random.randn(10000, 100)
t0 = time.perf_counter()
sm48 = fast_softmax(X_sm48)
t_sm = time.perf_counter() - t0
print("Ex48 softmax time:", round(t_sm*1000, 3), "ms, row sums:", sm48.sum(axis=1)[:3].round(8))

# 49. memory-mapped large matrix multiply
import tempfile, os
tmpf_a = tempfile.mktemp(suffix='.npy')
tmpf_b = tempfile.mktemp(suffix='.npy')
tmpf_c = tempfile.mktemp(suffix='.npy')
A49 = np.memmap(tmpf_a, dtype='float32', mode='w+', shape=(500, 200))
B49 = np.memmap(tmpf_b, dtype='float32', mode='w+', shape=(200, 300))
A49[:] = np.random.rand(500, 200).astype('f4')
B49[:] = np.random.rand(200, 300).astype('f4')
C49 = np.memmap(tmpf_c, dtype='float32', mode='w+', shape=(500, 300))
chunk_s49 = 50
for i in range(0, 500, chunk_s49):
    C49[i:i+chunk_s49] = np.array(A49[i:i+chunk_s49]) @ np.array(B49)
print("Ex49 mmap matmul shape:", C49.shape)
del A49, B49, C49
for f in [tmpf_a, tmpf_b, tmpf_c]:
    try: os.remove(f)
    except: pass

# 50. profiling utility
class NumpyProfiler:
    def __init__(self):
        self.times = {}

    def time_it(self, name, func, *args, repeat=3):
        times_r = []
        for _ in range(repeat):
            t0 = time.perf_counter()
            result = func(*args)
            times_r.append(time.perf_counter() - t0)
        self.times[name] = min(times_r)
        return result

    def report(self):
        for name_p, t_r in sorted(self.times.items(), key=lambda kv: kv[1]):
            print(f"  {name_p}: {t_r*1000:.3f} ms")

profiler = NumpyProfiler()
M_prof = np.random.rand(500, 500)
profiler.time_it('eig', np.linalg.eigh, M_prof.T @ M_prof)
profiler.time_it('svd', np.linalg.svd, M_prof, False)
profiler.time_it('matmul', np.dot, M_prof, M_prof)
print("Ex50 profiling results:")
profiler.report()


def main():
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
