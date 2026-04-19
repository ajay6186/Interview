# ============================================================================
# Exercise 6.5 — Production Patterns
# ============================================================================
# Build production-grade NumPy utilities: input validation, safe operations,
# serialization, online statistics, and typed pipeline components.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python exercise.py
# ============================================================================

import numpy as np
import io
import warnings

np.random.seed(11)

# ---------------------------------------------------------------------------
# 1. Input validation — check array is 2D float
# ---------------------------------------------------------------------------

def validate_2d_float(arr_v, name='arr'):
    """Raise TypeError if not floating, ValueError if not 2D."""
    # TODO: raise TypeError if arr_v.dtype is not floating-point
    # TODO: raise ValueError if arr_v.ndim != 2
    # Hint: np.issubdtype(arr_v.dtype, np.floating)
    pass  # replace pass with implementation

# ---------------------------------------------------------------------------
# 2. Safe log (avoid log of non-positive values)
# ---------------------------------------------------------------------------

def safe_log(x_sl, min_val=1e-10):
    """Compute log, clipping x to min_val before taking log."""
    # TODO: return np.log(np.maximum(x_sl, min_val))
    return None  # replace None

# ---------------------------------------------------------------------------
# 3. Safe normalization (handle zero-std features)
# ---------------------------------------------------------------------------

def safe_normalize(X_sn, eps=1e-8):
    """Z-score normalize X column-wise. For zero-std columns, divide by 1."""
    # TODO: compute mean_ and std_ along axis=0
    # TODO: return (X_sn - mean_) / np.where(std_ > eps, std_, 1.)
    return None  # replace None

# ---------------------------------------------------------------------------
# 4. Make an array read-only
# ---------------------------------------------------------------------------

arr_rw = np.array([1., 2., 3., 4., 5.])

# TODO: set arr_rw.flags.writeable = False
arr_ro = arr_rw  # just use arr_rw and make it read-only

# ---------------------------------------------------------------------------
# 5. Serialize and deserialize a NumPy array (using io.BytesIO + np.save/load)
# ---------------------------------------------------------------------------

original = np.random.rand(4, 3)

# TODO: save `original` to a BytesIO buffer using np.save, get bytes
def serialize(arr_ser):
    # TODO: create io.BytesIO(), call np.save(buf, arr_ser), return buf.getvalue()
    return None  # replace None

# TODO: load from bytes using io.BytesIO + np.load
def deserialize(data_bytes):
    # TODO: wrap data_bytes in io.BytesIO(), call np.load(buf), return the array
    return None  # replace None

serialized_bytes = serialize(original)
recovered = deserialize(serialized_bytes)

# ---------------------------------------------------------------------------
# 6. Online mean using Welford's algorithm
# ---------------------------------------------------------------------------

class WelfordMean:
    def __init__(self, n_features):
        self.n = 0
        self.mean = np.zeros(n_features)

    def update(self, x_wm):
        """Update mean with new sample x_wm (shape: (n_features,))."""
        # TODO: increment self.n by 1
        # TODO: compute delta = x_wm - self.mean
        # TODO: update self.mean += delta / self.n
        pass  # replace pass with implementation

data_stream = np.random.randn(200, 4)
wm = WelfordMean(4)
for row in data_stream:
    wm.update(row)
online_mean = wm.mean  # final online mean

# ---------------------------------------------------------------------------
# 7. Chunked column-wise sum (memory-efficient)
# ---------------------------------------------------------------------------

big_data = np.random.rand(500, 8)
chunk_sz = 50

# TODO: compute total_col_sum of shape (8,) by iterating in chunks of chunk_sz
#       and accumulating. Do NOT call big_data.sum(axis=0) directly.
total_col_sum = None  # replace None

# ---------------------------------------------------------------------------
# 8. Detect and report data drift using z-score
# ---------------------------------------------------------------------------

reference = np.random.randn(100, 5)
new_data   = np.random.randn(20, 5) + np.array([0., 0., 5., 0., 0.])  # col 2 drifted

ref_mean = reference.mean(axis=0)
ref_std  = reference.std(axis=0)

# TODO: compute z = abs((new_data.mean(axis=0) - ref_mean) / (ref_std + 1e-8))
z_drift = None  # replace None   — shape (5,)

# TODO: create boolean mask: True where z_drift > 3.0
drift_mask = None  # replace None

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    # Test 1 — validate_2d_float
    good_arr = np.random.rand(3, 4)
    validate_2d_float(good_arr)  # should not raise

    try:
        validate_2d_float(np.array([1., 2., 3.]))  # 1D — should raise ValueError
        assert False, "Should have raised ValueError for 1D array"
    except ValueError:
        pass

    try:
        validate_2d_float(np.array([[1, 2], [3, 4]]))  # int dtype — should raise TypeError
        assert False, "Should have raised TypeError for int array"
    except TypeError:
        pass
    print("Test 1 passed: validate_2d_float")

    # Test 2 — safe_log
    assert safe_log is not None
    x_test = np.array([0., -1., 1., np.e])
    log_result = safe_log(x_test)
    assert log_result is not None, "safe_log should return an array"
    assert np.isfinite(log_result).all(), "safe_log should return finite values"
    assert np.isclose(log_result[-1], 1.0), "safe_log(e) should be 1.0"
    assert log_result[0] < 0 and log_result[1] < 0, "safe_log of 0 and -1 should be very negative"
    print("Test 2 passed: safe_log")

    # Test 3 — safe_normalize
    X_test = np.random.randn(50, 4)
    X_norm = safe_normalize(X_test)
    assert X_norm is not None, "safe_normalize should return an array"
    assert X_norm.shape == X_test.shape, "safe_normalize shape mismatch"
    assert np.allclose(X_norm.mean(axis=0), 0, atol=1e-10), "normalized mean should be 0"
    assert np.allclose(X_norm.std(axis=0), 1, atol=1e-10), "normalized std should be 1"
    # constant column
    X_const = np.column_stack([np.ones(20), np.random.randn(20)])
    X_const_norm = safe_normalize(X_const)
    assert X_const_norm is not None
    assert np.all(np.isfinite(X_const_norm)), "constant column should not produce inf/nan"
    print("Test 3 passed: safe_normalize")

    # Test 4 — read-only array
    assert arr_ro.flags.writeable == False, "arr_ro should not be writeable"
    try:
        arr_ro[0] = 99.
        assert False, "Should have raised ValueError for read-only array"
    except ValueError:
        pass
    print("Test 4 passed: read-only array")

    # Test 5 — serialize/deserialize
    assert serialized_bytes is not None, "serialize() should return bytes"
    assert isinstance(serialized_bytes, bytes), "serialized should be bytes"
    assert recovered is not None, "deserialize() should return an array"
    assert isinstance(recovered, np.ndarray), "recovered should be ndarray"
    assert np.allclose(original, recovered), "serialization roundtrip failed"
    print("Test 5 passed: serialize/deserialize")

    # Test 6 — Welford mean
    assert online_mean is not None, "online_mean must be defined"
    assert online_mean.shape == (4,), "online_mean should have shape (4,)"
    batch_mean = data_stream.mean(axis=0)
    assert np.allclose(online_mean, batch_mean, atol=1e-10), \
        f"Welford mean {online_mean} != batch mean {batch_mean}"
    print("Test 6 passed: WelfordMean")

    # Test 7 — chunked column sum
    assert total_col_sum is not None, "total_col_sum must be defined"
    assert total_col_sum.shape == (8,), f"total_col_sum shape should be (8,), got {total_col_sum.shape}"
    assert np.allclose(total_col_sum, big_data.sum(axis=0)), \
        "chunked sum should equal direct sum"
    print("Test 7 passed: chunked column sum")

    # Test 8 — drift detection
    assert z_drift is not None, "z_drift must be defined"
    assert z_drift.shape == (5,), "z_drift should have shape (5,)"
    assert np.all(z_drift >= 0), "z_drift should be non-negative (absolute values)"

    assert drift_mask is not None, "drift_mask must be defined"
    assert drift_mask.dtype == bool, "drift_mask should be boolean"
    assert drift_mask.shape == (5,), "drift_mask should have shape (5,)"
    assert drift_mask[2] == True, "column 2 should be flagged as drifted"
    assert drift_mask[0] == False, "column 0 should not be flagged as drifted"
    print("Test 8 passed: drift detection")

    print("\nExercise 6.5 — All assertions passed!")

if __name__ == "__main__":
    main()
