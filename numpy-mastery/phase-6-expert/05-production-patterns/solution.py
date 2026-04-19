# ============================================================================
# Solution 6.5 — Production Patterns
# ============================================================================

import numpy as np
import io
import warnings

np.random.seed(11)

# 1. Input validation
def validate_2d_float(arr_v, name='arr'):
    if not np.issubdtype(arr_v.dtype, np.floating):
        raise TypeError(f"{name} must be floating-point, got {arr_v.dtype}")
    if arr_v.ndim != 2:
        raise ValueError(f"{name} must be 2D, got {arr_v.ndim}D")

# 2. Safe log
def safe_log(x_sl, min_val=1e-10):
    return np.log(np.maximum(x_sl, min_val))

# 3. Safe normalization
def safe_normalize(X_sn, eps=1e-8):
    mean_ = X_sn.mean(axis=0)
    std_ = X_sn.std(axis=0)
    return (X_sn - mean_) / np.where(std_ > eps, std_, 1.)

# 4. Read-only array
arr_rw = np.array([1., 2., 3., 4., 5.])
arr_ro = arr_rw
arr_ro.flags.writeable = False

# 5. Serialize / deserialize
original = np.random.rand(4, 3)

def serialize(arr_ser):
    buf = io.BytesIO()
    np.save(buf, arr_ser)
    return buf.getvalue()

def deserialize(data_bytes):
    buf = io.BytesIO(data_bytes)
    return np.load(buf)

serialized_bytes = serialize(original)
recovered = deserialize(serialized_bytes)

# 6. Welford mean
class WelfordMean:
    def __init__(self, n_features):
        self.n = 0
        self.mean = np.zeros(n_features)

    def update(self, x_wm):
        self.n += 1
        delta = x_wm - self.mean
        self.mean += delta / self.n

data_stream = np.random.randn(200, 4)
wm = WelfordMean(4)
for row in data_stream:
    wm.update(row)
online_mean = wm.mean

# 7. Chunked column sum
big_data = np.random.rand(500, 8)
chunk_sz = 50
total_col_sum = np.zeros(8)
for i in range(0, len(big_data), chunk_sz):
    total_col_sum += big_data[i:i+chunk_sz].sum(axis=0)

# 8. Drift detection
reference = np.random.randn(100, 5)
new_data   = np.random.randn(20, 5) + np.array([0., 0., 5., 0., 0.])
ref_mean = reference.mean(axis=0)
ref_std  = reference.std(axis=0)
z_drift = np.abs((new_data.mean(axis=0) - ref_mean) / (ref_std + 1e-8))
drift_mask = z_drift > 3.0

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    # Test 1
    good_arr = np.random.rand(3, 4)
    validate_2d_float(good_arr)
    try:
        validate_2d_float(np.array([1., 2., 3.]))
        assert False
    except ValueError:
        pass
    try:
        validate_2d_float(np.array([[1, 2], [3, 4]]))
        assert False
    except TypeError:
        pass
    print("Test 1 passed: validate_2d_float")

    # Test 2
    x_test = np.array([0., -1., 1., np.e])
    log_result = safe_log(x_test)
    assert np.isfinite(log_result).all()
    assert np.isclose(log_result[-1], 1.0)
    print("Test 2 passed: safe_log")

    # Test 3
    X_test = np.random.randn(50, 4)
    X_norm = safe_normalize(X_test)
    assert X_norm.shape == X_test.shape
    assert np.allclose(X_norm.mean(axis=0), 0, atol=1e-10)
    assert np.allclose(X_norm.std(axis=0), 1, atol=1e-10)
    X_const = np.column_stack([np.ones(20), np.random.randn(20)])
    X_const_norm = safe_normalize(X_const)
    assert np.all(np.isfinite(X_const_norm))
    print("Test 3 passed: safe_normalize")

    # Test 4
    assert arr_ro.flags.writeable == False
    try:
        arr_ro[0] = 99.
        assert False
    except ValueError:
        pass
    print("Test 4 passed: read-only")

    # Test 5
    assert isinstance(serialized_bytes, bytes)
    assert isinstance(recovered, np.ndarray)
    assert np.allclose(original, recovered)
    print("Test 5 passed: serialize/deserialize")

    # Test 6
    assert online_mean.shape == (4,)
    assert np.allclose(online_mean, data_stream.mean(axis=0), atol=1e-10)
    print("Test 6 passed: WelfordMean")

    # Test 7
    assert total_col_sum.shape == (8,)
    assert np.allclose(total_col_sum, big_data.sum(axis=0))
    print("Test 7 passed: chunked sum")

    # Test 8
    assert z_drift.shape == (5,)
    assert np.all(z_drift >= 0)
    assert drift_mask.dtype == bool
    assert drift_mask[2] == True
    assert drift_mask[0] == False
    print("Test 8 passed: drift detection")

    print("\nSolution 6.5 — All assertions passed!")

if __name__ == "__main__":
    main()
