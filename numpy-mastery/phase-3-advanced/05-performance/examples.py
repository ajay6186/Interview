# ============================================================================
# Examples 3.5 — Performance  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np
import time

# --- BASIC ---

# 1. in-place addition +=
arr = np.array([1., 2., 3., 4., 5.])
id_before = id(arr)
arr += 10
print("Ex01 same object:", id(arr) == id_before)

# 2. in-place multiplication *=
arr *= 2
print("Ex02:", arr)

# 3. in-place subtraction -=
arr -= 5
print("Ex03:", arr)

# 4. in-place division /=
arr /= 3
print("Ex04:", arr.round(3))

# 5. out-of-place creates new object
arr2 = np.array([1., 2., 3.])
id2 = id(arr2)
arr2 = arr2 + 1  # new object!
print("Ex05 same object:", id(arr2) == id2)  # False

# 6. C-contiguous array
c_arr = np.zeros((4, 5), order='C')
print("Ex06 C-contig:", c_arr.flags['C_CONTIGUOUS'])

# 7. F-contiguous array
f_arr = np.zeros((4, 5), order='F')
print("Ex07 F-contig:", f_arr.flags['F_CONTIGUOUS'])

# 8. ascontiguousarray
f_to_c = np.ascontiguousarray(f_arr)
print("Ex08 now C-contig:", f_to_c.flags['C_CONTIGUOUS'])

# 9. asfortranarray
c_to_f = np.asfortranarray(c_arr)
print("Ex09 now F-contig:", c_to_f.flags['F_CONTIGUOUS'])

# 10. np.einsum for matrix multiply
A = np.array([[1., 2.], [3., 4.]])
B = np.eye(2)
print("Ex10 einsum matmul:\n", np.einsum('ij,jk->ik', A, B))

# 11. np.einsum for trace
print("Ex11 einsum trace:", np.einsum('ii->', A))

# 12. np.einsum for sum
arr3 = np.arange(1., 6.)
print("Ex12 einsum sum:", np.einsum('i->', arr3))

# 13. np.einsum for inner product
v1 = np.array([1., 2., 3.])
v2 = np.array([4., 5., 6.])
print("Ex13 einsum dot:", np.einsum('i,i->', v1, v2))  # 32

# 14. np.einsum for outer product
print("Ex14 einsum outer:\n", np.einsum('i,j->ij', v1, v2))

# 15. np.einsum for element-wise multiply then sum
print("Ex15 einsum hadamard sum:", np.einsum('i,i->i', v1, v2))

# --- INTERMEDIATE ---

# 16. einsum for batch matrix multiply
batch = np.random.rand(3, 4, 5)
other = np.random.rand(3, 5, 6)
batch_mm = np.einsum('bij,bjk->bik', batch, other)
print("Ex16 batch matmul shape:", batch_mm.shape)

# 17. einsum for column-wise sum
mat = np.arange(12.).reshape(3, 4)
print("Ex17 col sums:", np.einsum('ij->j', mat))

# 18. einsum for row-wise sum
print("Ex18 row sums:", np.einsum('ij->i', mat))

# 19. einsum for diagonal
print("Ex19 diagonal:", np.einsum('ii->i', np.arange(9.).reshape(3, 3)))

# 20. einsum for bilinear form x^T A x
x = np.array([1., 2.])
A2 = np.array([[1., 0.], [0., 2.]])
print("Ex20 bilinear x^TAx:", np.einsum('i,ij,j->', x, A2, x))

# 21. timing: loop vs einsum for dot products
N = 10000
a_big = np.random.rand(N, 100)
b_big = np.random.rand(N, 100)
t0 = time.perf_counter()
loop_dots = np.array([np.dot(a_big[i], b_big[i]) for i in range(N)])
t1 = time.perf_counter()
einsum_dots = np.einsum('ij,ij->i', a_big, b_big)
t2 = time.perf_counter()
print(f"Ex21 loop: {(t1-t0)*1000:.1f}ms, einsum: {(t2-t1)*1000:.1f}ms")
print("Ex21 same result:", np.allclose(loop_dots, einsum_dots))

# 22. view avoids copy — prefer over index selection
large = np.arange(1000000.)
view_skip = large[::2]  # view
print("Ex22 view shares:", np.shares_memory(view_skip, large))

# 23. pre-allocating output array
out = np.empty(1000)
np.add(np.arange(1000.), np.arange(1000.), out=out)
print("Ex23 output reuse:", out[:3])

# 24. np.dot with out parameter
A3 = np.random.rand(100, 100)
B3 = np.random.rand(100, 100)
out2 = np.empty((100, 100))
np.dot(A3, B3, out=out2)
print("Ex24 dot with out shape:", out2.shape)

# 25. memory order and matmul performance
A_c = np.random.rand(200, 200)
A_f = np.asfortranarray(A_c)
t0 = time.perf_counter()
_ = A_c @ A_c.T
t1 = time.perf_counter()
t2 = time.perf_counter()
_ = A_f @ A_f.T
t3 = time.perf_counter()
print(f"Ex25 C-order: {(t1-t0)*1000:.2f}ms, F-order: {(t3-t2)*1000:.2f}ms")

# 26. np.einsum for 3D trace (sum of batch traces)
batch3d = np.arange(18.).reshape(2, 3, 3)
print("Ex26 batch traces:", np.einsum('bii->b', batch3d))

# 27. np.einsum path optimization
operands = [np.random.rand(10, 20), np.random.rand(20, 30), np.random.rand(30, 5)]
path, info = np.einsum_path('ij,jk,kl->il', *operands, optimize='optimal')
print("Ex27 einsum path:", path)

# 28. np.einsum with optimize flag
result_opt = np.einsum('ij,jk,kl->il', *operands, optimize=True)
print("Ex28 optimized shape:", result_opt.shape)

# 29. avoiding temporary arrays with out=
a_ip = np.random.rand(100000)
b_ip = np.random.rand(100000)
out3 = np.empty(100000)
np.multiply(a_ip, b_ip, out=out3)
print("Ex29 multiply with out:", np.shares_memory(out3, out3))

# 30. chunked processing to avoid memory spike
def chunked_square_sum(arr4, chunk_size):
    total = 0.
    for i in range(0, len(arr4), chunk_size):
        chunk = arr4[i:i+chunk_size]
        total += np.sum(chunk ** 2)
    return total
big_arr = np.random.rand(1000000)
print("Ex30 chunked sum:", chunked_square_sum(big_arr, 10000))

# --- ADVANCED ---

# 31. np.einsum for attention score (Q @ K^T / sqrt(d))
d = 4
Q = np.random.rand(3, d)
K = np.random.rand(5, d)
attn = np.einsum('qd,kd->qk', Q, K) / np.sqrt(d)
print("Ex31 attention shape:", attn.shape)

# 32. np.einsum for 4D convolution (simplified)
x_c = np.random.rand(2, 3, 4, 4)  # (N, C, H, W)
w_c = np.random.rand(5, 3, 1, 1)  # (out_ch, in_ch, 1, 1)
# pointwise conv:
out_c = np.einsum('nchw,ochw->no', x_c, w_c.reshape(5, 3))
print("Ex32 1x1 conv shape:", out_c.shape)

# 33. in-place clip
arr5 = np.array([-5., -1., 0., 3., 8., 12.])
np.clip(arr5, 0., 5., out=arr5)
print("Ex33 in-place clip:", arr5)

# 34. in-place power
arr6 = np.array([2., 3., 4., 5.])
np.power(arr6, 2, out=arr6)
print("Ex34 in-place power:", arr6)

# 35. view vs copy benchmark
large2 = np.random.rand(1000000)
t0 = time.perf_counter()
for _ in range(100):
    _ = large2[::2]  # view, no copy
t1 = time.perf_counter()
t2 = time.perf_counter()
for _ in range(100):
    _ = large2[::2].copy()
t3 = time.perf_counter()
print(f"Ex35 view: {(t1-t0)*1000:.2f}ms, copy: {(t3-t2)*1000:.2f}ms")

# 36. np.einsum for Gram matrix (X @ X^T)
X = np.random.rand(50, 20)
gram = np.einsum('ik,jk->ij', X, X)
print("Ex36 Gram matrix shape:", gram.shape)

# 37. memory-efficient column normalization
mat2 = np.random.rand(1000, 100)
col_norms = np.linalg.norm(mat2, axis=0, keepdims=True)
mat2 /= col_norms  # in-place
print("Ex37 col norms after:", np.linalg.norm(mat2, axis=0)[:3].round(4))

# 38. np.einsum for covariance matrix
X2 = np.random.rand(100, 5)
X2_c = X2 - X2.mean(axis=0)
cov = np.einsum('ni,nj->ij', X2_c, X2_c) / (len(X2) - 1)
print("Ex38 cov shape:", cov.shape)
print("Ex38 matches np.cov:", np.allclose(cov, np.cov(X2.T)))

# 39. reducing intermediate memory with einsum path
big_a = np.random.rand(100, 1000)
big_b = np.random.rand(1000, 50)
big_c = np.random.rand(50, 200)
# naive would create (100, 1000) @ (1000, 50) → (100, 50) @ (50, 200) → (100, 200)
result = np.einsum('ij,jk,kl->il', big_a, big_b, big_c, optimize='optimal')
print("Ex39 result shape:", result.shape)

# 40. np.einsum for quadratic form per row
X3 = np.random.rand(10, 3)
M = np.array([[2.,1.,0.],[1.,3.,1.],[0.,1.,2.]])
# quadratic form x^T M x for each row
forms = np.einsum('ni,ij,nj->n', X3, M, X3)
print("Ex40 quadratic forms:", forms[:3].round(3))

# 41. reusing buffer to avoid allocation in loop
output_buf = np.empty((3, 3))
for i in range(5):
    A_loop = np.random.rand(3, 4)
    B_loop = np.random.rand(4, 3)
    np.dot(A_loop, B_loop, out=output_buf)
print("Ex41 reused buffer shape:", output_buf.shape)

# 42. np.einsum for kronecker delta times a tensor (identity select)
T = np.random.rand(3, 3, 3)
delta = np.eye(3)
# contract first two indices with delta → trace-like
contracted = np.einsum('ijk,ij->k', T, delta)
print("Ex42 contracted shape:", contracted.shape)

# --- EXPERT ---

# 43. einsum for 3D -> 2D marginal sum
arr3d = np.random.rand(4, 5, 6)
marginal_01 = np.einsum('ijk->ij', arr3d)  # sum over last axis
print("Ex43 marginal shape:", marginal_01.shape)

# 44. np.einsum vs np.tensordot equivalence
A4 = np.random.rand(3, 4)
B4 = np.random.rand(4, 5)
print("Ex44 einsum == tensordot:",
      np.allclose(np.einsum('ij,jk->ik', A4, B4), np.tensordot(A4, B4, axes=1)))

# 45. np.tensordot for multi-axis contraction
A5 = np.random.rand(3, 4, 5)
B5 = np.random.rand(4, 5, 6)
result45 = np.tensordot(A5, B5, axes=([1,2],[0,1]))
print("Ex45 tensordot shape:", result45.shape)

# 46. continuous memory — C vs F for reduction axis
mat_c = np.random.rand(1000, 1000)
mat_f = np.asfortranarray(mat_c)
t0 = time.perf_counter()
_ = mat_c.sum(axis=0)
t1 = time.perf_counter()
t2 = time.perf_counter()
_ = mat_f.sum(axis=0)
t3 = time.perf_counter()
print(f"Ex46 C sum(axis=0): {(t1-t0)*1000:.2f}ms, F: {(t3-t2)*1000:.2f}ms")

# 47. numpy vectorize vs broadcasting for speed
N2 = 10000
x_n = np.random.rand(N2)
y_n = np.random.rand(N2)
t0 = time.perf_counter()
res_v = np.vectorize(lambda a, b: a**2 + b**2)(x_n, y_n)
t1 = time.perf_counter()
res_b = x_n**2 + y_n**2
t2 = time.perf_counter()
print(f"Ex47 vectorize: {(t1-t0)*1000:.1f}ms, broadcast: {(t2-t1)*1000:.2f}ms")
print("Ex47 same:", np.allclose(res_v, res_b))

# 48. in-place sort
arr8 = np.array([5., 3., 8., 1., 9., 2.])
arr8.sort()  # in-place
print("Ex48 in-place sort:", arr8)

# 49. contiguous vs non-contiguous write speed
cont = np.zeros(100000)
non_cont = cont[::2]
t0 = time.perf_counter()
cont[:] = 1.
t1 = time.perf_counter()
t2 = time.perf_counter()
non_cont[:] = 1.
t3 = time.perf_counter()
print(f"Ex49 cont write: {(t1-t0)*1000:.3f}ms, non-cont: {(t3-t2)*1000:.3f}ms")

# 50. np.einsum for softmax numerically stable
def softmax_einsum(X_in):
    m = X_in.max(axis=-1, keepdims=True)
    e = np.exp(X_in - m)
    return e / np.einsum('...i->...', e)[..., None]
logits = np.random.rand(4, 5)
sm = softmax_einsum(logits)
print("Ex50 softmax rows sum to 1:", np.allclose(sm.sum(axis=1), 1.))


def main():
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
