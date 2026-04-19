# ============================================================================
# Examples 6.5 — Production Patterns  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np
import warnings
import logging

np.random.seed(42)
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# --- BASIC ---

# 1. input validation: check dtype
def validate_float_array(arr_v, name='arr'):
    if not np.issubdtype(arr_v.dtype, np.floating):
        raise TypeError(f"{name} must be a floating-point array, got {arr_v.dtype}")
    return arr_v
arr_ok = np.array([1., 2., 3.])
validate_float_array(arr_ok)
print("Ex01 dtype validation passed")

# 2. input validation: check shape
def validate_shape(arr_s, expected, name='arr'):
    if arr_s.shape != expected:
        raise ValueError(f"{name} shape {arr_s.shape} != expected {expected}")
    return arr_s
validate_shape(np.zeros((3, 4)), (3, 4))
print("Ex02 shape validation passed")

# 3. input validation: check no NaN
def validate_no_nan(arr_n, name='arr'):
    if np.any(np.isnan(arr_n)):
        raise ValueError(f"{name} contains NaN values")
    return arr_n
validate_no_nan(np.array([1., 2., 3.]))
print("Ex03 NaN check passed")

# 4. input validation: check no Inf
def validate_finite(arr_f, name='arr'):
    if not np.all(np.isfinite(arr_f)):
        raise ValueError(f"{name} contains non-finite values")
    return arr_f
validate_finite(np.array([1., 2., 3.]))
print("Ex04 finite check passed")

# 5. safe division with epsilon
def safe_divide(a_sd, b_sd, eps=1e-8):
    return a_sd / (b_sd + eps * np.sign(b_sd + eps))
a_div = np.array([1., 2., 3.])
b_div = np.array([0., 2., 0.])
result_sd = safe_divide(a_div, b_div)
print("Ex05 safe divide:", result_sd.round(4))

# 6. safe log (clip negative values)
def safe_log(x_sl, min_val=1e-10):
    return np.log(np.maximum(x_sl, min_val))
x_log = np.array([0., -1., 1., np.e])
print("Ex06 safe log:", safe_log(x_log).round(4))

# 7. safe sqrt (clip negative values)
def safe_sqrt(x_ss):
    return np.sqrt(np.maximum(x_ss, 0.))
print("Ex07 safe sqrt:", safe_sqrt(np.array([-1., 0., 4., 9.])))

# 8. normalize with fallback for zero-std features
def safe_normalize(X_sn, eps=1e-8):
    mean_sn = X_sn.mean(axis=0)
    std_sn = X_sn.std(axis=0)
    return (X_sn - mean_sn) / np.where(std_sn > eps, std_sn, 1.)
X_const = np.column_stack([np.ones(10), np.random.rand(10)])
print("Ex08 safe normalize shape:", safe_normalize(X_const).shape)

# 9. warnings for suspicious inputs
def compute_mean_with_warnings(arr_w):
    if arr_w.size == 0:
        warnings.warn("Empty array — returning nan", RuntimeWarning, stacklevel=2)
        return np.nan
    if np.any(np.isnan(arr_w)):
        warnings.warn("Array contains NaN — using nanmean", UserWarning, stacklevel=2)
        return np.nanmean(arr_w)
    return arr_w.mean()
with warnings.catch_warnings(record=True) as w_list:
    warnings.simplefilter("always")
    result_warn = compute_mean_with_warnings(np.array([1., np.nan, 3.]))
    print("Ex09 warned:", len(w_list) > 0, "result:", result_warn)

# 10. type coercion with logging
def coerce_to_float64(arr_c, logger=None):
    if arr_c.dtype != np.float64:
        if logger:
            logger.info(f"Coercing {arr_c.dtype} to float64")
        return arr_c.astype(np.float64)
    return arr_c
arr_int = np.array([1, 2, 3], dtype=np.int32)
logger_ex = logging.getLogger('ex10')
coerced = coerce_to_float64(arr_int, logger_ex)
print("Ex10 coerced dtype:", coerced.dtype)

# 11. dimension handling (1D/2D compatible)
def ensure_2d(arr_2d):
    if arr_2d.ndim == 1:
        return arr_2d.reshape(-1, 1)
    if arr_2d.ndim > 2:
        raise ValueError(f"Expected 1D or 2D array, got {arr_2d.ndim}D")
    return arr_2d
print("Ex11 1D to 2D:", ensure_2d(np.array([1., 2., 3.])).shape)
print("Ex11 2D unchanged:", ensure_2d(np.zeros((3, 4))).shape)

# 12. batch size validation
def validate_batch(X_b, y_b):
    if len(X_b) != len(y_b):
        raise ValueError(f"X has {len(X_b)} samples but y has {len(y_b)}")
    return X_b, y_b
validate_batch(np.zeros((10, 5)), np.zeros(10))
print("Ex12 batch validation passed")

# 13. reproducible random state context
class FixedSeed:
    def __init__(self, seed):
        self.seed = seed
        self.state = None
    def __enter__(self):
        self.state = np.random.get_state()
        np.random.seed(self.seed)
        return self
    def __exit__(self, *args):
        np.random.set_state(self.state)
with FixedSeed(42):
    sample = np.random.rand(3)
print("Ex13 fixed seed sample:", sample.round(4))

# 14. array hash for cache invalidation
def array_hash(arr_h):
    return hash(arr_h.tobytes())
arr_hash1 = np.array([1., 2., 3.])
arr_hash2 = arr_hash1.copy()
arr_hash3 = np.array([1., 2., 4.])
print("Ex14 same hash:", array_hash(arr_hash1) == array_hash(arr_hash2))
print("Ex14 diff hash:", array_hash(arr_hash1) != array_hash(arr_hash3))

# 15. make array read-only
arr_ro = np.array([1., 2., 3.])
arr_ro.flags.writeable = False
try:
    arr_ro[0] = 99.
    print("Ex15 write succeeded (unexpected)")
except ValueError as e:
    print("Ex15 write blocked:", str(e)[:40])

# --- INTERMEDIATE ---

# 16. memoized function with numpy arrays
from functools import wraps
_memo_cache = {}
def memoize_array(func):
    @wraps(func)
    def wrapper(*args):
        key = tuple(a.tobytes() if isinstance(a, np.ndarray) else a for a in args)
        if key not in _memo_cache:
            _memo_cache[key] = func(*args)
        return _memo_cache[key]
    return wrapper

@memoize_array
def expensive_svd(M_memo):
    return np.linalg.svd(M_memo, full_matrices=False)
M_memo = np.random.rand(20, 15)
_ = expensive_svd(M_memo)
_ = expensive_svd(M_memo)  # cache hit
print("Ex16 memo cache size:", len(_memo_cache))

# 17. type-safe batch processor
class BatchProcessor:
    def __init__(self, batch_size=32, dtype=np.float32):
        self.batch_size = batch_size
        self.dtype = dtype

    def validate(self, X_bp):
        if not isinstance(X_bp, np.ndarray):
            X_bp = np.asarray(X_bp, dtype=self.dtype)
        if X_bp.dtype != self.dtype:
            X_bp = X_bp.astype(self.dtype)
        return X_bp

    def process(self, X_bp, func):
        X_bp = self.validate(X_bp)
        results = []
        for i in range(0, len(X_bp), self.batch_size):
            results.append(func(X_bp[i:i+self.batch_size]))
        return np.concatenate(results, axis=0)

proc = BatchProcessor(batch_size=16)
X_proc = np.random.rand(100, 5)
result_proc = proc.process(X_proc, lambda b: b * 2)
print("Ex17 batch processed shape:", result_proc.shape)

# 18. schema validation class
class ArraySchema:
    def __init__(self, shape=None, dtype=None, min_val=None, max_val=None):
        self.shape = shape
        self.dtype = dtype
        self.min_val = min_val
        self.max_val = max_val

    def validate(self, arr_sch):
        if self.shape and arr_sch.shape != self.shape:
            raise ValueError(f"Shape mismatch: {arr_sch.shape} != {self.shape}")
        if self.dtype and not np.issubdtype(arr_sch.dtype, self.dtype):
            raise TypeError(f"Dtype mismatch: {arr_sch.dtype}")
        if self.min_val is not None and arr_sch.min() < self.min_val:
            raise ValueError(f"Values below min: {arr_sch.min()} < {self.min_val}")
        if self.max_val is not None and arr_sch.max() > self.max_val:
            raise ValueError(f"Values above max: {arr_sch.max()} > {self.max_val}")
        return arr_sch

schema = ArraySchema(dtype=np.floating, min_val=0., max_val=1.)
schema.validate(np.random.rand(10))
print("Ex18 schema validated")

# 19. decorator for output validation
def output_finite(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        if isinstance(result, np.ndarray) and not np.all(np.isfinite(result)):
            raise RuntimeError(f"{func.__name__} produced non-finite values")
        return result
    return wrapper

@output_finite
def safe_log_transform(x_olt):
    return np.log(x_olt + 1e-8)

try:
    bad_result = safe_log_transform(np.array([-np.inf, 1., 2.]))
except RuntimeError as e:
    print("Ex19 caught non-finite output:", str(e)[:50])
safe_result = safe_log_transform(np.array([0.1, 1., 10.]))
print("Ex19 safe result:", safe_result.round(4))

# 20. retry logic for stochastic operations
def with_retry(func, max_attempts=3, fallback=None):
    for attempt in range(max_attempts):
        try:
            return func()
        except (np.linalg.LinAlgError, ValueError) as e:
            if attempt == max_attempts - 1:
                return fallback
    return fallback

M_singular = np.zeros((3, 3))
result_retry = with_retry(
    lambda: np.linalg.inv(M_singular),
    fallback=np.eye(3)
)
print("Ex20 retry fallback:", np.allclose(result_retry, np.eye(3)))

# 21. chunk processing with progress tracking
class ChunkProcessor:
    def __init__(self, data_cp, chunk_size):
        self.data = data_cp
        self.chunk_size = chunk_size
        self.n_chunks = (len(data_cp) + chunk_size - 1) // chunk_size
        self.current = 0

    def __iter__(self):
        for i in range(0, len(self.data), self.chunk_size):
            self.current += 1
            yield i, self.data[i:i+self.chunk_size]

    @property
    def progress(self):
        return self.current / self.n_chunks

data_cp = np.random.rand(500)
processor = ChunkProcessor(data_cp, 50)
chunk_sums = [chunk.sum() for _, chunk in processor]
print("Ex21 chunk sums count:", len(chunk_sums))
print("Ex21 progress:", processor.progress)

# 22. serialize and deserialize arrays
import io
def serialize(arr_ser):
    buf = io.BytesIO()
    np.save(buf, arr_ser)
    return buf.getvalue()

def deserialize(data_deser):
    buf = io.BytesIO(data_deser)
    return np.load(buf)

original = np.random.rand(5, 3)
serialized = serialize(original)
recovered = deserialize(serialized)
print("Ex22 serialize/deserialize roundtrip:", np.allclose(original, recovered))

# 23. compressed serialization
def serialize_compressed(arr_sc):
    buf = io.BytesIO()
    np.savez_compressed(buf, data=arr_sc)
    return buf.getvalue()

def deserialize_compressed(bytes_dc):
    buf = io.BytesIO(bytes_dc)
    return np.load(buf)['data']

original_big = np.random.rand(100, 100)
compressed = serialize_compressed(original_big)
recovered_big = deserialize_compressed(compressed)
print("Ex23 compressed roundtrip:", np.allclose(original_big, recovered_big))

# 24. feature drift monitoring
class FeatureMonitor:
    def __init__(self, reference_data):
        self.ref_mean = reference_data.mean(axis=0)
        self.ref_std = reference_data.std(axis=0)

    def check_drift(self, new_data, threshold=3.):
        new_mean = new_data.mean(axis=0)
        z = np.abs((new_mean - self.ref_mean) / (self.ref_std + 1e-8))
        drifted = z > threshold
        return drifted, z

ref = np.random.rand(100, 5)
monitor = FeatureMonitor(ref)
new_clean = np.random.rand(20, 5)
new_drifted = np.random.rand(20, 5) + 10
drifted_mask, zscores = monitor.check_drift(new_drifted)
print("Ex24 drift detected:", drifted_mask)

# 25. assertion-based postconditions
def normalize_probabilities(probs):
    probs = np.asarray(probs, dtype=float)
    assert probs.ndim == 1, "probs must be 1D"
    assert np.all(probs >= 0), "probs must be non-negative"
    total = probs.sum()
    if total < 1e-10:
        raise ValueError("Sum of probabilities is zero")
    result_norm = probs / total
    assert np.isclose(result_norm.sum(), 1.0), "Normalized probs must sum to 1"
    return result_norm
print("Ex25 normalized:", normalize_probabilities([1., 2., 3., 4.]).round(4))

# --- ADVANCED ---

# 26. production pipeline with full error handling
class ProductionTransformer:
    def __init__(self, name):
        self.name = name
        self._fitted = False
        self.mean_ = None
        self.std_ = None
        self.logger = logging.getLogger(name)

    def fit(self, X_fit):
        X_fit = self._validate_input(X_fit)
        self.mean_ = X_fit.mean(axis=0)
        self.std_ = X_fit.std(axis=0)
        self._fitted = True
        self.logger.info(f"Fitted on shape {X_fit.shape}")
        return self

    def transform(self, X_tr):
        if not self._fitted:
            raise RuntimeError(f"{self.name} must be fitted before transform")
        X_tr = self._validate_input(X_tr)
        return (X_tr - self.mean_) / np.where(self.std_ > 1e-8, self.std_, 1.)

    def fit_transform(self, X_ft):
        return self.fit(X_ft).transform(X_ft)

    def _validate_input(self, X_v):
        if not isinstance(X_v, np.ndarray):
            X_v = np.asarray(X_v, dtype=np.float64)
        if X_v.ndim != 2:
            raise ValueError(f"Expected 2D array, got {X_v.ndim}D")
        if not np.all(np.isfinite(X_v)):
            raise ValueError("Input contains non-finite values")
        return X_v.astype(np.float64)

transformer = ProductionTransformer("StandardScaler")
X_train_pt = np.random.randn(100, 5)
X_test_pt = np.random.randn(20, 5)
X_scaled = transformer.fit_transform(X_train_pt)
print("Ex26 transform mean:", X_scaled.mean(axis=0).round(6))

# 27. rolling buffer (circular buffer)
class CircularBuffer:
    def __init__(self, capacity, n_features):
        self._buf = np.empty((capacity, n_features))
        self._capacity = capacity
        self._size = 0
        self._head = 0

    def push(self, row):
        self._buf[self._head] = row
        self._head = (self._head + 1) % self._capacity
        self._size = min(self._size + 1, self._capacity)

    def get(self):
        if self._size < self._capacity:
            return self._buf[:self._size]
        return np.roll(self._buf, -self._head, axis=0)

cb = CircularBuffer(capacity=10, n_features=3)
for i in range(15):
    cb.push(np.ones(3) * i)
buf_data = cb.get()
print("Ex27 circular buffer shape:", buf_data.shape, "last row:", buf_data[-1])

# 28. online statistics tracker (Welford)
class OnlineStats:
    def __init__(self, n_features):
        self.n = 0
        self.mean = np.zeros(n_features)
        self._M2 = np.zeros(n_features)

    def update(self, x_os):
        self.n += 1
        delta = x_os - self.mean
        self.mean += delta / self.n
        self._M2 += delta * (x_os - self.mean)

    @property
    def variance(self):
        return self._M2 / (self.n - 1) if self.n > 1 else np.zeros_like(self.mean)

    @property
    def std(self):
        return np.sqrt(self.variance)

stats_online = OnlineStats(4)
data_stream = np.random.randn(500, 4)
for row_os in data_stream:
    stats_online.update(row_os)
print("Ex28 online mean vs batch:", np.allclose(stats_online.mean, data_stream.mean(axis=0), atol=1e-10))

# 29. typed function dispatch
class TypedCompute:
    _registry = {}

    @classmethod
    def register(cls, dtype):
        def decorator(func):
            cls._registry[dtype] = func
            return func
        return decorator

    @classmethod
    def compute(cls, arr_tc):
        for dtype_key, func in cls._registry.items():
            if np.issubdtype(arr_tc.dtype, dtype_key):
                return func(arr_tc)
        raise TypeError(f"No handler for {arr_tc.dtype}")

@TypedCompute.register(np.integer)
def sum_int(arr_i):
    return int(arr_i.sum())

@TypedCompute.register(np.floating)
def mean_float(arr_f):
    return float(arr_f.mean())

print("Ex29 int dispatch:", TypedCompute.compute(np.array([1, 2, 3])))
print("Ex29 float dispatch:", round(TypedCompute.compute(np.array([1., 2., 3.])), 4))

# 30. lazy array wrapper
class LazyArray:
    def __init__(self, shape, dtype=np.float64):
        self._shape = shape
        self._dtype = dtype
        self._data = None

    def _materialize(self):
        if self._data is None:
            self._data = np.zeros(self._shape, dtype=self._dtype)
        return self._data

    def __getitem__(self, idx):
        return self._materialize()[idx]

    def __setitem__(self, idx, val):
        self._materialize()[idx] = val

    @property
    def shape(self):
        return self._shape

la = LazyArray((100, 5))
la[0, :] = np.ones(5)
print("Ex30 lazy array first row:", la[0, :])
print("Ex30 not yet materialized before first access: N/A (already materialized)")

# --- EXPERT ---

# 31. full ML pipeline with validation at every step
class MLPipeline:
    def __init__(self, steps_ml):
        self.steps = steps_ml
        self._fitted_steps = {}

    def fit(self, X_ml, y_ml=None):
        X_curr = X_ml
        for name, step in self.steps:
            if hasattr(step, 'fit_transform'):
                X_curr = step.fit_transform(X_curr)
            elif hasattr(step, 'fit'):
                step.fit(X_curr, y_ml)
                X_curr = step.transform(X_curr) if hasattr(step, 'transform') else X_curr
            self._fitted_steps[name] = step
        return self

    def transform(self, X_ml):
        X_curr = X_ml
        for name, step in self.steps:
            if hasattr(step, 'transform'):
                X_curr = step.transform(X_curr)
        return X_curr

from copy import deepcopy
scaler1 = ProductionTransformer("scaler1")
scaler2 = ProductionTransformer("scaler2")
pipeline_ml = MLPipeline([("scale1", scaler1)])
X_ml_data = np.random.randn(200, 8)
pipeline_ml.fit(X_ml_data)
print("Ex31 ML pipeline transform shape:", pipeline_ml.transform(X_ml_data).shape)

# 32. exception hierarchy for numpy operations
class NumpyValidationError(Exception):
    pass
class ShapeError(NumpyValidationError):
    pass
class DtypeError(NumpyValidationError):
    pass
class ValueRangeError(NumpyValidationError):
    pass

def strict_validate(arr_sv, shape=None, dtype=None, min_v=None, max_v=None):
    if shape and arr_sv.shape != shape:
        raise ShapeError(f"{arr_sv.shape} != {shape}")
    if dtype and arr_sv.dtype != np.dtype(dtype):
        raise DtypeError(f"{arr_sv.dtype} != {dtype}")
    if min_v is not None and arr_sv.min() < min_v:
        raise ValueRangeError(f"min {arr_sv.min()} < {min_v}")
    if max_v is not None and arr_sv.max() > max_v:
        raise ValueRangeError(f"max {arr_sv.max()} > {max_v}")
    return arr_sv

try:
    strict_validate(np.random.rand(3), shape=(5,))
except ShapeError as e:
    print("Ex32 ShapeError caught:", str(e))

# 33. automatic dtype promotion policy
def promote_safe(arr1, arr2):
    result_dtype = np.result_type(arr1.dtype, arr2.dtype)
    return arr1.astype(result_dtype), arr2.astype(result_dtype)
a_promo = np.array([1, 2], dtype=np.int16)
b_promo = np.array([1., 2.], dtype=np.float32)
a_p, b_p = promote_safe(a_promo, b_promo)
print("Ex33 promoted dtypes:", a_p.dtype, b_p.dtype)

# 34. array version control (checksum)
class VersionedArray:
    def __init__(self, data_va):
        self.data = data_va
        self.version = 0
        self._checksum = self._compute_checksum()

    def _compute_checksum(self):
        return hash(self.data.tobytes())

    def update(self, new_data):
        self.data = new_data
        old_cs = self._checksum
        self._checksum = self._compute_checksum()
        if old_cs != self._checksum:
            self.version += 1
        return self

va = VersionedArray(np.array([1., 2., 3.]))
va.update(np.array([1., 2., 4.]))
print("Ex34 version after update:", va.version)
va.update(np.array([1., 2., 4.]))  # same data
print("Ex34 version same data:", va.version)

# 35. distributed-style array partitioning
def partition_array(arr_pa, n_workers):
    chunk_size_pa = (len(arr_pa) + n_workers - 1) // n_workers
    return [arr_pa[i*chunk_size_pa:(i+1)*chunk_size_pa] for i in range(n_workers)]

def reduce_partitions(partitions, func=np.sum):
    return func([func(p) for p in partitions])

data_dist = np.random.rand(1000, 10)
parts = partition_array(data_dist, 4)
print("Ex35 partition sizes:", [len(p) for p in parts])
total = reduce_partitions(parts, np.sum)
print("Ex35 distributed sum close:", np.isclose(total, data_dist.sum()))

# 36. feature store with lazy computation
class FeatureStore:
    def __init__(self, raw_data):
        self._raw = raw_data
        self._cache = {}

    def _compute(self, name):
        if name == 'mean':
            return self._raw.mean(axis=0)
        elif name == 'std':
            return self._raw.std(axis=0)
        elif name == 'log1p':
            return np.log1p(np.abs(self._raw))
        elif name == 'zscore':
            m = self['mean']
            s = self['std']
            return (self._raw - m) / (s + 1e-8)
        raise KeyError(f"Unknown feature: {name}")

    def __getitem__(self, name):
        if name not in self._cache:
            self._cache[name] = self._compute(name)
        return self._cache[name]

fs = FeatureStore(np.random.randn(200, 6))
print("Ex36 zscore shape:", fs['zscore'].shape)
print("Ex36 cache keys:", list(fs._cache.keys()))

# 37. array pool for memory reuse
class ArrayPool:
    def __init__(self):
        self._pool = {}

    def get(self, shape, dtype=np.float64):
        key = (shape, np.dtype(dtype))
        if key in self._pool and len(self._pool[key]) > 0:
            return self._pool[key].pop()
        return np.empty(shape, dtype=dtype)

    def release(self, arr_ap):
        key = (arr_ap.shape, arr_ap.dtype)
        if key not in self._pool:
            self._pool[key] = []
        self._pool[key].append(arr_ap)

pool = ArrayPool()
arr_p = pool.get((100, 10))
arr_p[:] = 0.
pool.release(arr_p)
arr_p2 = pool.get((100, 10))  # reuse
print("Ex37 pool reuse shape:", arr_p2.shape)

# 38. typed result container
class ComputeResult:
    def __init__(self, value, metadata=None):
        self.value = value
        self.metadata = metadata or {}
        self.dtype = value.dtype
        self.shape = value.shape

    def validate(self):
        if not np.all(np.isfinite(self.value)):
            raise RuntimeError("Result contains non-finite values")
        return self

    def __repr__(self):
        return f"ComputeResult(shape={self.shape}, dtype={self.dtype})"

res = ComputeResult(np.random.rand(5, 3), metadata={'source': 'test'})
res.validate()
print("Ex38 result:", repr(res))

# 39. production logging for array operations
class ArrayLogger:
    def __init__(self, name):
        self.logger = logging.getLogger(name)

    def log_array(self, arr_al, label=""):
        self.logger.debug(
            f"{label} shape={arr_al.shape} dtype={arr_al.dtype} "
            f"range=[{arr_al.min():.4f}, {arr_al.max():.4f}] "
            f"nan_count={np.isnan(arr_al).sum()}"
        )
        return arr_al

al = ArrayLogger("production")
X_log = np.random.randn(50, 4)
al.log_array(X_log, "input")
print("Ex39 array logger active")

# 40. configuration-driven pipeline
PIPELINE_CONFIG = {
    'normalize': True,
    'clip': {'min': -3., 'max': 3.},
    'add_intercept': True,
    'dtype': np.float32,
}

def apply_config(X_cfg, config):
    X_cfg = X_cfg.astype(config.get('dtype', np.float64))
    if config.get('normalize'):
        X_cfg = (X_cfg - X_cfg.mean(axis=0)) / (X_cfg.std(axis=0) + 1e-8)
    if 'clip' in config:
        X_cfg = np.clip(X_cfg, config['clip']['min'], config['clip']['max'])
    if config.get('add_intercept'):
        X_cfg = np.hstack([X_cfg, np.ones((len(X_cfg), 1), dtype=X_cfg.dtype)])
    return X_cfg

X_raw_cfg = np.random.randn(100, 5)
X_processed = apply_config(X_raw_cfg, PIPELINE_CONFIG)
print("Ex40 config pipeline output shape:", X_processed.shape)

# 41. monitoring hooks
class MonitoredTransform:
    def __init__(self):
        self.hooks = {'pre': [], 'post': []}

    def add_hook(self, stage, func):
        self.hooks[stage].append(func)

    def __call__(self, X_mt):
        for fn in self.hooks['pre']:
            fn(X_mt)
        result_mt = (X_mt - X_mt.mean(axis=0)) / (X_mt.std(axis=0) + 1e-8)
        for fn in self.hooks['post']:
            fn(result_mt)
        return result_mt

mt = MonitoredTransform()
_shape_log = []
mt.add_hook('pre', lambda x: _shape_log.append(('pre', x.shape)))
mt.add_hook('post', lambda x: _shape_log.append(('post', x.shape)))
_ = mt(np.random.rand(20, 3))
print("Ex41 hooks fired:", _shape_log)

# 42. graceful degradation on low-memory
def safe_svd(M_ssvd, n_components=None, fallback_to_eig=True):
    try:
        U_s, S_s, Vt_s = np.linalg.svd(M_ssvd, full_matrices=False)
        if n_components:
            return U_s[:, :n_components], S_s[:n_components], Vt_s[:n_components]
        return U_s, S_s, Vt_s
    except np.linalg.LinAlgError:
        if fallback_to_eig:
            evals, evecs = np.linalg.eigh(M_ssvd.T @ M_ssvd)
            return evecs, np.sqrt(np.abs(evals)), evecs.T
        raise

U, S, Vt = safe_svd(np.random.rand(50, 30), n_components=5)
print("Ex42 safe SVD shape U:", U.shape, "S:", S.shape)

# --- EXPERT ---

# 43. end-to-end typed inference pipeline
class InferencePipeline:
    def __init__(self, preprocessor, predict_fn, postprocessor=None):
        self.preprocessor = preprocessor
        self.predict_fn = predict_fn
        self.postprocessor = postprocessor or (lambda x: x)

    def __call__(self, X_ip):
        try:
            X_ip = np.asarray(X_ip, dtype=np.float32)
            X_proc_ip = self.preprocessor(X_ip)
            preds_ip = self.predict_fn(X_proc_ip)
            return self.postprocessor(preds_ip)
        except Exception as e:
            raise RuntimeError(f"Inference failed: {e}") from e

pipeline_inf = InferencePipeline(
    preprocessor=lambda x: (x - x.mean(axis=0)) / (x.std(axis=0) + 1e-8),
    predict_fn=lambda x: x @ np.random.randn(x.shape[1]),
    postprocessor=lambda x: np.clip(x, -10, 10),
)
X_inf = np.random.randn(50, 10)
preds_inf = pipeline_inf(X_inf)
print("Ex43 inference pipeline output shape:", preds_inf.shape)

# 44. A/B testing infrastructure
class ABTester:
    def __init__(self, model_a, model_b, traffic_split=0.5):
        self.model_a = model_a
        self.model_b = model_b
        self.split = traffic_split
        self.results = {'a': [], 'b': []}

    def route_and_predict(self, X_ab):
        is_b = np.random.rand(len(X_ab)) < self.split
        preds_ab = np.empty(len(X_ab))
        if is_b.any():
            preds_ab[is_b] = self.model_b(X_ab[is_b])
        if (~is_b).any():
            preds_ab[~is_b] = self.model_a(X_ab[~is_b])
        self.results['a'].extend(preds_ab[~is_b].tolist())
        self.results['b'].extend(preds_ab[is_b].tolist())
        return preds_ab

model_a = lambda X: X.mean(axis=1)
model_b = lambda X: X.max(axis=1)
ab = ABTester(model_a, model_b, 0.3)
X_ab = np.random.rand(200, 5)
preds_ab = ab.route_and_predict(X_ab)
print("Ex44 A traffic:", len(ab.results['a']), "B traffic:", len(ab.results['b']))

# 45. production metrics tracker
class MetricsTracker:
    def __init__(self):
        self.metrics = {}
        self._history = {}

    def log(self, name_mt, value_mt):
        if name_mt not in self._history:
            self._history[name_mt] = []
        self._history[name_mt].append(float(value_mt))
        self.metrics[name_mt] = float(value_mt)

    def summary(self):
        result_mt = {}
        for k, vals in self._history.items():
            arr_mt = np.array(vals)
            result_mt[k] = {'mean': arr_mt.mean(), 'std': arr_mt.std(), 'n': len(vals)}
        return result_mt

mt_tracker = MetricsTracker()
for i in range(20):
    X_i = np.random.randn(50, 5)
    mt_tracker.log('loss', np.mean(X_i**2))
    mt_tracker.log('accuracy', np.mean(np.abs(X_i) < 1))
summary = mt_tracker.summary()
print("Ex45 metrics summary keys:", list(summary.keys()))

# 46. data contract enforcement
class DataContract:
    def __init__(self, **constraints):
        self.constraints = constraints

    def enforce(self, data_dc, name='data'):
        errors_dc = []
        for key, value in self.constraints.items():
            if key == 'shape' and data_dc.shape != value:
                errors_dc.append(f"shape {data_dc.shape} != {value}")
            elif key == 'dtype' and not np.issubdtype(data_dc.dtype, value):
                errors_dc.append(f"dtype {data_dc.dtype} not subtype of {value}")
            elif key == 'max_nan_frac':
                nan_frac = np.isnan(data_dc).mean()
                if nan_frac > value:
                    errors_dc.append(f"NaN fraction {nan_frac:.3f} > {value}")
        if errors_dc:
            raise ValueError(f"Contract violation for '{name}': " + "; ".join(errors_dc))
        return data_dc

contract = DataContract(dtype=np.floating, max_nan_frac=0.1)
X_good = np.random.rand(100, 5)
contract.enforce(X_good, 'X_train')
print("Ex46 contract enforced")

# 47. checkpoint manager
class CheckpointManager:
    def __init__(self):
        self._checkpoints = {}

    def save(self, name_cm, arr_cm):
        self._checkpoints[name_cm] = arr_cm.copy()
        return self

    def restore(self, name_cm):
        if name_cm not in self._checkpoints:
            raise KeyError(f"No checkpoint '{name_cm}'")
        return self._checkpoints[name_cm].copy()

    def list(self):
        return list(self._checkpoints.keys())

ckpt = CheckpointManager()
data_ck = np.random.rand(10)
ckpt.save('step_0', data_ck)
data_ck[:5] = 99.
ckpt.save('step_1', data_ck)
restored = ckpt.restore('step_0')
print("Ex47 restored step_0 max:", restored.max().round(4))
print("Ex47 checkpoints:", ckpt.list())

# 48. circuit breaker for failing operations
class CircuitBreaker:
    def __init__(self, threshold=3, reset_after=5):
        self.threshold = threshold
        self.reset_after = reset_after
        self.failures = 0
        self.success_count = 0
        self.open = False

    def call(self, func_cb, *args, fallback=None):
        if self.open:
            self.success_count += 1
            if self.success_count >= self.reset_after:
                self.open = False
                self.failures = 0
                self.success_count = 0
            return fallback
        try:
            result_cb = func_cb(*args)
            self.failures = 0
            return result_cb
        except Exception:
            self.failures += 1
            if self.failures >= self.threshold:
                self.open = True
            return fallback

cb_breaker = CircuitBreaker(threshold=2)
def bad_op(x_b):
    raise ValueError("Simulated failure")
for _ in range(5):
    result_cb = cb_breaker.call(bad_op, np.ones(3), fallback=np.zeros(3))
print("Ex48 circuit open:", cb_breaker.open)
print("Ex48 fallback result:", result_cb)

# 49. production-ready normalization with full error handling
class RobustNormalizer:
    def __init__(self, strategy='zscore', clip_sigma=5.):
        self.strategy = strategy
        self.clip_sigma = clip_sigma
        self._params = {}
        self._fitted = False

    def fit(self, X_rn):
        X_rn = self._preprocess(X_rn)
        if self.strategy == 'zscore':
            self._params['mean'] = X_rn.mean(axis=0)
            self._params['scale'] = X_rn.std(axis=0)
        elif self.strategy == 'minmax':
            self._params['min'] = X_rn.min(axis=0)
            self._params['scale'] = X_rn.max(axis=0) - X_rn.min(axis=0)
        else:
            raise ValueError(f"Unknown strategy: {self.strategy}")
        self._fitted = True
        return self

    def transform(self, X_rn):
        if not self._fitted:
            raise RuntimeError("Not fitted")
        X_rn = self._preprocess(X_rn)
        if self.strategy == 'zscore':
            result_rn = (X_rn - self._params['mean']) / np.where(
                self._params['scale'] > 1e-8, self._params['scale'], 1.)
            if self.clip_sigma:
                result_rn = np.clip(result_rn, -self.clip_sigma, self.clip_sigma)
        elif self.strategy == 'minmax':
            result_rn = (X_rn - self._params['min']) / np.where(
                self._params['scale'] > 1e-8, self._params['scale'], 1.)
        return result_rn

    def _preprocess(self, X_rn):
        X_rn = np.asarray(X_rn, dtype=np.float64)
        if X_rn.ndim != 2:
            raise ValueError("Expected 2D input")
        return X_rn

rn = RobustNormalizer(strategy='zscore', clip_sigma=3.)
X_rn_data = np.random.randn(200, 6) * 10 + 5
rn.fit(X_rn_data)
X_rn_result = rn.transform(X_rn_data)
print("Ex49 robust norm mean:", X_rn_result.mean(axis=0).round(4))
print("Ex49 clipped range:", [X_rn_result.min().round(2), X_rn_result.max().round(2)])

# 50. complete production-grade inference service
class NumpyInferenceService:
    def __init__(self, model_weights, feature_schema, output_schema=None):
        self.weights = model_weights
        self.feature_schema = feature_schema
        self.output_schema = output_schema
        self.normalizer = RobustNormalizer()
        self.normalizer.fit(np.random.randn(100, len(model_weights)))
        self.metrics = MetricsTracker()
        self.breaker = CircuitBreaker(threshold=5)

    def predict(self, X_svc):
        def _predict_inner(X_i):
            self.feature_schema.enforce(X_i, 'input')
            X_norm = self.normalizer.transform(X_i)
            preds_i = X_norm @ self.weights
            preds_i = np.clip(preds_i, -10, 10)
            return preds_i

        result_svc = self.breaker.call(_predict_inner, X_svc,
                                       fallback=np.zeros(len(X_svc)))
        if result_svc is not None:
            self.metrics.log('mean_pred', np.mean(result_svc))
        return result_svc

n_features_svc = 8
weights_svc = np.random.randn(n_features_svc)
schema_svc = DataContract(dtype=np.floating)
service = NumpyInferenceService(weights_svc, schema_svc)
X_svc = np.random.randn(50, n_features_svc)
predictions_svc = service.predict(X_svc)
print("Ex50 service predictions shape:", predictions_svc.shape)
print("Ex50 service metrics:", {k: round(v['mean'], 4) for k, v in service.metrics.summary().items()})


def main():
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
