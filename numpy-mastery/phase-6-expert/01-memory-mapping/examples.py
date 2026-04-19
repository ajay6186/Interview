# ============================================================================
# Examples 6.1 — Memory Mapping  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np
import tempfile
import os

np.random.seed(42)

# Use a temporary directory for all memmap files
tmpdir = tempfile.mkdtemp()

def tmpfile(name):
    return os.path.join(tmpdir, name)

# --- BASIC ---

# 1. create a writable memmap
mm1 = np.memmap(tmpfile('ex01.dat'), dtype='float64', mode='w+', shape=(100,))
print("Ex01 created memmap shape:", mm1.shape, "dtype:", mm1.dtype)

# 2. write data to memmap
mm1[:] = np.arange(100, dtype=np.float64)
mm1.flush()
print("Ex02 first 5 values:", mm1[:5])

# 3. read-only memmap
mm1_ro = np.memmap(tmpfile('ex01.dat'), dtype='float64', mode='r', shape=(100,))
print("Ex03 read-only sum:", mm1_ro.sum())

# 4. 2D memmap
mm2d = np.memmap(tmpfile('ex04.dat'), dtype='float32', mode='w+', shape=(50, 40))
mm2d[:] = np.random.rand(50, 40).astype(np.float32)
print("Ex04 2D memmap shape:", mm2d.shape)

# 5. slice a memmap — returns view
slice_mm = mm2d[10:20, :]
print("Ex05 slice shape:", slice_mm.shape)

# 6. arithmetic on memmap (in-place)
mm2d[:] *= 2
print("Ex06 after scale max:", mm2d.max().round(4))

# 7. copy memmap to regular array
arr_copy = np.array(mm2d)
print("Ex07 copy type:", type(arr_copy).__name__, "is memmap:", isinstance(arr_copy, np.memmap))

# 8. check if array is a memmap
print("Ex08 mm2d is memmap:", isinstance(mm2d, np.memmap))
print("Ex08 arr_copy is memmap:", isinstance(arr_copy, np.memmap))

# 9. memmap with int32 dtype
mm_int = np.memmap(tmpfile('ex09.dat'), dtype='int32', mode='w+', shape=(200,))
mm_int[:] = np.arange(200, dtype=np.int32)
print("Ex09 int memmap dtype:", mm_int.dtype)

# 10. total bytes used
print("Ex10 mm2d nbytes:", mm2d.nbytes)

# 11. flush changes to disk
mm2d[0, 0] = 999.
mm2d.flush()
# Re-open and verify
mm2d_check = np.memmap(tmpfile('ex04.dat'), dtype='float32', mode='r', shape=(50, 40))
print("Ex11 flushed value:", mm2d_check[0, 0])

# 12. delete memmap and re-read (data persists)
del mm1
mm1_reread = np.memmap(tmpfile('ex01.dat'), dtype='float64', mode='r', shape=(100,))
print("Ex12 re-read first 5:", mm1_reread[:5])

# 13. memmap with offset
mm_offset = np.memmap(tmpfile('ex01.dat'), dtype='float64', mode='r',
                      shape=(50,), offset=50*8)  # skip first 50 float64s
print("Ex13 offset read [0]:", mm_offset[0])  # should be 50.0

# 14. append to existing memmap (extend shape)
mm_ext = np.memmap(tmpfile('ex14.dat'), dtype='float64', mode='w+', shape=(100,))
mm_ext[:] = np.linspace(0, 1, 100)
mm_ext.flush()
print("Ex14 extended memmap last value:", mm_ext[-1])

# 15. structured memmap
dt_struct = np.dtype([('x', np.float32), ('y', np.float32), ('label', np.int32)])
mm_struct = np.memmap(tmpfile('ex15.dat'), dtype=dt_struct, mode='w+', shape=(50,))
mm_struct['x'] = np.random.rand(50).astype(np.float32)
mm_struct['y'] = np.random.rand(50).astype(np.float32)
mm_struct['label'] = np.random.randint(0, 5, 50).astype(np.int32)
print("Ex15 structured memmap fields:", mm_struct.dtype.names)

# --- INTERMEDIATE ---

# 16. process large memmap in chunks
big = np.memmap(tmpfile('ex16.dat'), dtype='float64', mode='w+', shape=(1000, 100))
big[:] = np.random.rand(1000, 100)
chunk_means = []
for i in range(0, 1000, 100):
    chunk_means.append(big[i:i+100].mean())
print("Ex16 chunk means (first 3):", [round(m, 4) for m in chunk_means[:3]])

# 17. compute column means without loading all data
col_means_mm = np.array([big[:, j].mean() for j in range(100)])
print("Ex17 column means std:", round(col_means_mm.std(), 6))

# 18. max value without full load (chunked)
running_max = -np.inf
for i in range(0, 1000, 200):
    running_max = max(running_max, big[i:i+200].max())
print("Ex18 running max ≈ full max:", np.isclose(running_max, big.max()))

# 19. matrix multiply via chunked rows
A_mm = np.memmap(tmpfile('ex19a.dat'), dtype='float64', mode='w+', shape=(200, 50))
B_mm = np.memmap(tmpfile('ex19b.dat'), dtype='float64', mode='w+', shape=(50, 30))
A_mm[:] = np.random.rand(200, 50)
B_mm[:] = np.random.rand(50, 30)
C_mm = np.memmap(tmpfile('ex19c.dat'), dtype='float64', mode='w+', shape=(200, 30))
chunk_size_mm = 40
for i in range(0, 200, chunk_size_mm):
    C_mm[i:i+chunk_size_mm] = A_mm[i:i+chunk_size_mm] @ B_mm[:]
print("Ex19 chunked matmul shape:", C_mm.shape)

# 20. sort a memmap column and write sorted indices
col_sort = big[:, 0].copy()
sorted_idx = np.argsort(col_sort)
print("Ex20 sorted_idx first 3:", sorted_idx[:3])

# 21. histogram of a memmap array (chunked)
hist_counts = np.zeros(20, dtype=int)
bin_edges = np.linspace(0, 1, 21)
for i in range(0, 1000, 100):
    chunk_hist, _ = np.histogram(big[i:i+100].ravel(), bins=bin_edges)
    hist_counts += chunk_hist
print("Ex21 histogram total:", hist_counts.sum())

# 22. covariance of memmap columns (chunked)
n_rows = big.shape[0]
sum_x = np.zeros(100)
sum_xx = np.zeros((100, 100))
for i in range(0, n_rows, 100):
    chunk_cv = big[i:i+100]
    sum_x += chunk_cv.sum(axis=0)
    sum_xx += chunk_cv.T @ chunk_cv
mean_v = sum_x / n_rows
cov_approx = sum_xx / n_rows - np.outer(mean_v, mean_v)
print("Ex22 approx cov diagonal std:", round(np.diag(cov_approx).std(), 6))

# 23. write new features to memmap alongside source
features_mm = np.memmap(tmpfile('ex23.dat'), dtype='float64', mode='w+', shape=(1000, 3))
features_mm[:, 0] = big[:, 0]
features_mm[:, 1] = np.log1p(np.abs(big[:, 1]))
features_mm[:, 2] = big[:, 2]**2
features_mm.flush()
print("Ex23 features shape:", features_mm.shape)

# 24. boolean index from memmap
bool_mask_mm = big[:, 0] > 0.5
n_above = bool_mask_mm.sum()
print("Ex24 rows above 0.5 in col 0:", n_above)

# 25. delete specific rows concept (write filtered to new memmap)
n_keep = n_above
filtered_mm = np.memmap(tmpfile('ex25.dat'), dtype='float64', mode='w+', shape=(n_keep, 100))
filtered_mm[:] = big[bool_mask_mm, :]
print("Ex25 filtered rows:", len(filtered_mm))

# 26. memmap-backed streaming normalization
mm_norm_src = np.memmap(tmpfile('ex26.dat'), dtype='float64', mode='w+', shape=(500, 10))
mm_norm_src[:] = np.random.randn(500, 10) * 5 + 10
src_mean = mm_norm_src.mean(axis=0)
src_std = mm_norm_src.std(axis=0)
mm_normed = np.memmap(tmpfile('ex26n.dat'), dtype='float64', mode='w+', shape=(500, 10))
mm_normed[:] = (mm_norm_src - src_mean) / src_std
print("Ex26 normed mean:", mm_normed.mean(axis=0).round(6))

# 27. save model predictions to memmap
predictions = np.memmap(tmpfile('ex27.dat'), dtype='float32', mode='w+', shape=(1000,))
# Simulate predictions
predictions[:] = np.random.rand(1000).astype(np.float32)
print("Ex27 predictions range:", round(float(predictions.min()), 4), round(float(predictions.max()), 4))

# 28. time series with memmap: rolling window sum
ts_mm = np.memmap(tmpfile('ex28.dat'), dtype='float64', mode='w+', shape=(2000,))
ts_mm[:] = np.random.randn(2000)
window_w = 50
rolling_sum_mm = np.convolve(ts_mm, np.ones(window_w), 'valid')
print("Ex28 rolling sum shape:", rolling_sum_mm.shape)

# 29. concat two memmaps into a third
mm_a = np.memmap(tmpfile('ex29a.dat'), dtype='float32', mode='w+', shape=(300, 5))
mm_b = np.memmap(tmpfile('ex29b.dat'), dtype='float32', mode='w+', shape=(200, 5))
mm_a[:] = np.random.rand(300, 5).astype(np.float32)
mm_b[:] = np.random.rand(200, 5).astype(np.float32)
mm_concat = np.memmap(tmpfile('ex29c.dat'), dtype='float32', mode='w+', shape=(500, 5))
mm_concat[:300] = mm_a[:]
mm_concat[300:] = mm_b[:]
print("Ex29 concatenated shape:", mm_concat.shape)

# 30. compare memory usage: regular vs memmap
import sys
reg_arr = np.zeros((1000, 100))
# memmap doesn't load all into RAM (simplified comparison)
mm_size = big.nbytes
print("Ex30 memmap nbytes:", mm_size, "in-memory array bytes:", reg_arr.nbytes)

# --- ADVANCED ---

# 31. simulate large dataset too big for RAM (conceptually)
# Use memmap to process in chunks and compute descriptive stats
stats_mm = {}
n_chunks_stat = 10
data_stat = big
stats_mm['count'] = len(data_stat)
running_sum_s = 0.
running_sum_sq_s = 0.
for i in range(0, len(data_stat), len(data_stat)//n_chunks_stat):
    c = data_stat[i:i+len(data_stat)//n_chunks_stat]
    running_sum_s += c.sum()
    running_sum_sq_s += (c**2).sum()
n_total = data_stat.size
stats_mm['mean'] = running_sum_s / n_total
stats_mm['std'] = np.sqrt(running_sum_sq_s / n_total - stats_mm['mean']**2)
print("Ex31 chunked stats mean:", round(stats_mm['mean'], 4))

# 32. write predictions with confidence scores
pred_struct = np.dtype([('pred', np.float32), ('confidence', np.float32)])
mm_pred = np.memmap(tmpfile('ex32.dat'), dtype=pred_struct, mode='w+', shape=(1000,))
mm_pred['pred'] = np.random.rand(1000).astype(np.float32)
mm_pred['confidence'] = np.random.uniform(0.5, 1., 1000).astype(np.float32)
print("Ex32 high confidence count:", (mm_pred['confidence'] > 0.9).sum())

# 33. memory-mapped image batch (NCHW format)
img_batch = np.memmap(tmpfile('ex33.dat'), dtype='uint8', mode='w+', shape=(100, 3, 64, 64))
img_batch[:] = np.random.randint(0, 256, (100, 3, 64, 64), dtype=np.uint8)
print("Ex33 image batch shape:", img_batch.shape, "dtype:", img_batch.dtype)

# 34. efficient row shuffle using index array
shuffle_idx = np.random.permutation(1000)
mm_shuffled = np.memmap(tmpfile('ex34.dat'), dtype='float64', mode='w+', shape=(1000, 100))
# Write in chunks to avoid loading all
chunk_s = 100
for i in range(0, 1000, chunk_s):
    mm_shuffled[i:i+chunk_s] = big[shuffle_idx[i:i+chunk_s]]
print("Ex34 shuffled memmap shape:", mm_shuffled.shape)

# 35. memmap-backed K-means iteration (one step)
n_clusters = 3
X_kmeans = big[:100, :2].copy()  # use first 100 rows, 2 cols
centroids = X_kmeans[np.random.choice(100, n_clusters, replace=False)]
dists = np.linalg.norm(X_kmeans[:, None, :] - centroids[None, :, :], axis=2)
assignments = np.argmin(dists, axis=1)
new_centroids = np.array([X_kmeans[assignments == k].mean(axis=0) for k in range(n_clusters)])
print("Ex35 K-means centroids shape:", new_centroids.shape)

# 36. memmap + stride tricks for sliding windows
mm_ts = np.memmap(tmpfile('ex36.dat'), dtype='float64', mode='w+', shape=(500,))
mm_ts[:] = np.random.randn(500)
windows_view = np.lib.stride_tricks.sliding_window_view(np.array(mm_ts), 20)
print("Ex36 sliding windows shape:", windows_view.shape)

# 37. out-of-core matrix transpose
A_trans = np.memmap(tmpfile('ex37a.dat'), dtype='float64', mode='w+', shape=(200, 150))
A_trans[:] = np.random.rand(200, 150)
A_T = np.memmap(tmpfile('ex37b.dat'), dtype='float64', mode='w+', shape=(150, 200))
chunk_t = 50
for i in range(0, 200, chunk_t):
    A_T[:, i:i+chunk_t] = A_trans[i:i+chunk_t, :].T
print("Ex37 transposed shape:", A_T.shape)

# 38. incremental dot product (chunked)
x_vec = np.random.rand(200)
y_dot = np.memmap(tmpfile('ex38.dat'), dtype='float64', mode='w+', shape=(200, 50))
y_dot[:] = np.random.rand(200, 50)
result_dot = np.zeros(50)
chunk_d = 40
for i in range(0, 200, chunk_d):
    result_dot += x_vec[i:i+chunk_d] @ y_dot[i:i+chunk_d, :]
print("Ex38 dot product shape:", result_dot.shape)

# 39. sparse pattern detection in memmap
mm_sparse = np.memmap(tmpfile('ex39.dat'), dtype='float32', mode='w+', shape=(1000, 100))
mm_sparse[:] = np.where(np.random.rand(1000, 100) < 0.1,
                         np.random.rand(1000, 100).astype(np.float32), 0.)
sparsity = (mm_sparse == 0).sum() / mm_sparse.size
print("Ex39 sparsity:", round(sparsity, 4))

# 40. multi-file memmap ensemble (average predictions)
preds_list = []
for k in range(3):
    mm_k = np.memmap(tmpfile(f'ex40_{k}.dat'), dtype='float32', mode='w+', shape=(500,))
    mm_k[:] = np.random.rand(500).astype(np.float32)
    preds_list.append(mm_k)
ensemble_avg = np.mean([np.array(p) for p in preds_list], axis=0)
print("Ex40 ensemble shape:", ensemble_avg.shape)

# 41. online update of memmap (new data rows arriving)
mm_online = np.memmap(tmpfile('ex41.dat'), dtype='float64', mode='w+', shape=(1000, 5))
mm_online[:500] = np.random.rand(500, 5)
# "New data arrives" — write to remaining slots
mm_online[500:] = np.random.rand(500, 5)
mm_online.flush()
print("Ex41 online updated shape:", mm_online.shape)

# 42. memory-mapped label array + indexing by label
mm_labels = np.memmap(tmpfile('ex42.dat'), dtype='int32', mode='w+', shape=(1000,))
mm_labels[:] = np.random.randint(0, 5, 1000)
label_counts = np.bincount(mm_labels, minlength=5)
print("Ex42 label distribution:", label_counts)

# --- EXPERT ---

# 43. custom mmap-backed dataset iterator
class MemmapDataset:
    def __init__(self, data_path, label_path, dtype_d='float32', dtype_l='int32',
                 n_samples=500, n_features=10):
        self.X = np.memmap(data_path, dtype=dtype_d, mode='r+', shape=(n_samples, n_features))
        self.y = np.memmap(label_path, dtype=dtype_l, mode='r+', shape=(n_samples,))

    def __len__(self):
        return len(self.X)

    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]

    def batch_iter(self, batch_size):
        for i in range(0, len(self), batch_size):
            yield self.X[i:i+batch_size], self.y[i:i+batch_size]

mm_X = np.memmap(tmpfile('ex43x.dat'), dtype='float32', mode='w+', shape=(500, 10))
mm_y_d = np.memmap(tmpfile('ex43y.dat'), dtype='int32', mode='w+', shape=(500,))
mm_X[:] = np.random.rand(500, 10).astype(np.float32)
mm_y_d[:] = np.random.randint(0, 3, 500).astype(np.int32)
ds = MemmapDataset(tmpfile('ex43x.dat'), tmpfile('ex43y.dat'))
batch_count = sum(1 for _ in ds.batch_iter(32))
print("Ex43 dataset batches:", batch_count)

# 44. quantile computation on large memmap (approximate, chunked)
def approx_quantile_chunked(mm_q, q_val, n_bins=1000):
    lo_q, hi_q = float(mm_q.min()), float(mm_q.max())
    counts_q = np.zeros(n_bins, dtype=np.int64)
    edges_q = np.linspace(lo_q, hi_q, n_bins + 1)
    chunk_q = 100
    for i in range(0, len(mm_q), chunk_q):
        hist_c, _ = np.histogram(mm_q[i:i+chunk_q].ravel(), bins=edges_q)
        counts_q += hist_c
    cdf_q = counts_q.cumsum() / counts_q.sum()
    bin_idx_q = np.searchsorted(cdf_q, q_val)
    return edges_q[bin_idx_q]
q50 = approx_quantile_chunked(big, 0.5)
print("Ex44 approx median:", round(q50, 4), "vs exact:", round(float(np.median(big)), 4))

# 45. memory-mapped rolling correlation (two channels)
mm_ch1 = np.memmap(tmpfile('ex45a.dat'), dtype='float64', mode='w+', shape=(1000,))
mm_ch2 = np.memmap(tmpfile('ex45b.dat'), dtype='float64', mode='w+', shape=(1000,))
mm_ch1[:] = np.random.randn(1000)
mm_ch2[:] = 0.7 * mm_ch1 + 0.3 * np.random.randn(1000)  # correlated
win_corr = 100
rolling_corr_mm = np.array([
    np.corrcoef(mm_ch1[i:i+win_corr], mm_ch2[i:i+win_corr])[0, 1]
    for i in range(0, len(mm_ch1) - win_corr + 1, 10)
])
print("Ex45 rolling corr mean:", round(rolling_corr_mm.mean(), 4))

# 46. checkpoint/resume pattern with memmap
mm_checkpoint = np.memmap(tmpfile('ex46.dat'), dtype='float64', mode='w+', shape=(500,))
mm_checkpoint[:] = -1.  # sentinel: -1 means not yet processed
for i in range(500):
    if mm_checkpoint[i] < 0:
        mm_checkpoint[i] = np.sqrt(i)
mm_checkpoint.flush()
resume_count = (mm_checkpoint >= 0).sum()
print("Ex46 processed items:", resume_count)

# 47. memory-mapped covariance matrix (streaming)
n_feat_cov = 20
X_cov_mm = np.memmap(tmpfile('ex47.dat'), dtype='float64', mode='w+', shape=(2000, n_feat_cov))
X_cov_mm[:] = np.random.randn(2000, n_feat_cov)
cov_result = np.zeros((n_feat_cov, n_feat_cov))
n_cov = len(X_cov_mm)
mean_cov = np.zeros(n_feat_cov)
for i in range(0, n_cov, 200):
    mean_cov += X_cov_mm[i:i+200].sum(axis=0)
mean_cov /= n_cov
for i in range(0, n_cov, 200):
    centered = X_cov_mm[i:i+200] - mean_cov
    cov_result += centered.T @ centered
cov_result /= (n_cov - 1)
print("Ex47 streaming cov shape:", cov_result.shape)

# 48. memory-mapped binary classification with threshold
mm_scores = np.memmap(tmpfile('ex48.dat'), dtype='float32', mode='w+', shape=(10000,))
mm_scores[:] = np.random.rand(10000).astype(np.float32)
threshold = 0.6
n_positive = (mm_scores > threshold).sum()
print("Ex48 positives above threshold:", n_positive)

# 49. stacked memmap views (multi-level access)
# Layer 1: raw features
mm_l1 = np.memmap(tmpfile('ex49a.dat'), dtype='float32', mode='w+', shape=(1000, 10))
# Layer 2: derived features
mm_l2 = np.memmap(tmpfile('ex49b.dat'), dtype='float32', mode='w+', shape=(1000, 5))
mm_l1[:] = np.random.rand(1000, 10).astype(np.float32)
# PCA-like projection (first 5 components)
proj = np.random.randn(10, 5).astype(np.float32)
for i in range(0, 1000, 100):
    mm_l2[i:i+100] = mm_l1[i:i+100] @ proj
print("Ex49 derived features shape:", mm_l2.shape)

# 50. production-grade memmap pipeline
class MemmapPipeline:
    def __init__(self, input_path, output_path, shape, dtype='float64'):
        self.src = np.memmap(input_path, dtype=dtype, mode='r', shape=shape)
        self.dst = np.memmap(output_path, dtype=dtype, mode='w+', shape=shape)
        self.stats = {}

    def fit_transform(self, chunk_size=100):
        # Pass 1: compute stats
        n = len(self.src)
        total_sum = np.zeros(self.src.shape[1])
        total_sq = np.zeros(self.src.shape[1])
        n_total = n
        for i in range(0, n, chunk_size):
            c = self.src[i:i+chunk_size]
            total_sum += c.sum(axis=0)
            total_sq += (c**2).sum(axis=0)
        self.stats['mean'] = total_sum / n_total
        self.stats['std'] = np.sqrt(total_sq / n_total - self.stats['mean']**2)
        # Pass 2: transform
        for i in range(0, n, chunk_size):
            self.dst[i:i+chunk_size] = (
                (self.src[i:i+chunk_size] - self.stats['mean']) /
                (self.stats['std'] + 1e-8)
            )
        self.dst.flush()
        return self

src_mm = np.memmap(tmpfile('ex50_src.dat'), dtype='float64', mode='w+', shape=(800, 15))
src_mm[:] = np.random.randn(800, 15) * 5 + 10
src_mm.flush()
pipe_mm = MemmapPipeline(tmpfile('ex50_src.dat'), tmpfile('ex50_dst.dat'), (800, 15))
pipe_mm.fit_transform(chunk_size=80)
print("Ex50 pipeline output mean:", pipe_mm.dst.mean(axis=0).round(4))

# Cleanup
del mm1_ro, mm2d, mm_int, mm2d_check, mm_offset, mm_ext, mm_struct
del big, A_mm, B_mm, C_mm, features_mm, filtered_mm, mm_norm_src, mm_normed
del predictions, ts_mm, mm_a, mm_b, mm_concat, data_stat, mm_pred
del img_batch, mm_shuffled, mm_ts, A_trans, A_T, y_dot
del mm_sparse, mm_online, mm_labels
del mm_X, mm_y_d
del mm_ch1, mm_ch2, mm_checkpoint, X_cov_mm, mm_scores, mm_l1, mm_l2, src_mm, mm1_reread
import shutil
shutil.rmtree(tmpdir)


def main():
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
