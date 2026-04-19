# NumPy Mastery — Complete Reference Guide

## Overview

  30 topics across 6 phases (fundamentals → expert)
  Each topic folder contains:
    • examples.py  — 50 worked examples (BASIC 1–15 | INTERMEDIATE 16–30 | ADVANCED 31–42 | EXPERT 43–50)
    • exercise.py  — TODO stubs to complete
    • solution.py  — reference answers
    • test.py      — automated tests (phase 1 only)

  Total: 6 phases × 5 topics = 30 topics | 30 × 50 = 1 500 worked examples

---

## Phase 1: Fundamentals  (5 topics × 3 files)

  ┌──────────────────────┬─────────────────────────────────────────────────────────────────────────────┐
  │        Topic         │                                  Content                                   │
  ├──────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
  │ 01-arrays-and-dtypes │ np.array, zeros/ones/full/eye/arange/linspace, dtype specification          │
  │                      │ (int8–int64, float32/64, complex128, bool_, U/S/object), astype,            │
  │                      │ itemsize/nbytes/ndim/size, zeros_like/ones_like, overflow, result_type,     │
  │                      │ can_cast, frombuffer, byteorder, endianness, fromfunction, frompyfunc       │
  ├──────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
  │ 02-array-indexing    │ 1D/2D/3D element access, slicing with step, negative indices, views vs      │
  │                      │ copies (shares_memory), np.newaxis, ellipsis (…), np.take, np.where,        │
  │                      │ np.diag, np.ix_, boolean masks, strides, C- vs F-order, np.unravel_index   │
  ├──────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
  │ 03-array-operations  │ Element-wise +, -, *, /, **, //, %; ufuncs (np.add/subtract/multiply/      │
  │                      │ divide/power); math funcs (sqrt, exp, log/log2/log10, clip, sign,           │
  │                      │ floor/ceil/round); trig (sin/arcsin/deg2rad); logical/bitwise ops;          │
  │                      │ np.isclose, complex ops (conj/angle/real/imag), np.copysign               │
  ├──────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
  │ 04-array-reshaping   │ reshape (with -1), ravel vs flatten (view/copy), transpose (.T/moveaxis/   │
  │                      │ swapaxes/rollaxis), np.concatenate/vstack/hstack/dstack/stack, split/       │
  │                      │ hsplit/vsplit, np.pad, np.tile/repeat, np.block, np.resize,                 │
  │                      │ C/F contiguous flags, as_strided, np.nditer/ndenumerate                    │
  ├──────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
  │ 05-array-math        │ sum/mean/max/min/std/var/median/percentile/prod, axis argument, cumsum/     │
  │                      │ cumprod, argmax/argmin, any/all, count_nonzero, np.ptp, np.trapz,           │
  │                      │ np.gradient, np.diff/ediff1d, nanmean/nansum/nanmax/nanstd, np.average      │
  │                      │ (weighted), einsum (sum/dot/matmul), cross/inner/outer, linalg.norm,        │
  │                      │ np.correlate/convolve, running mean via cumsum, histogram, bincount         │
  └──────────────────────┴─────────────────────────────────────────────────────────────────────────────┘

---

## Phase 2: Intermediate  (5 topics × 3 files)

  ┌─────────────────────────┬──────────────────────────────────────────────────────────────────────────┐
  │          Topic          │                                  Content                                 │
  ├─────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
  │ 01-broadcasting         │ Broadcasting rules (align from right, stretch size-1 dims), scalar →     │
  │                         │ 1D/2D, row/column vector broadcast, (3,1)+(3,) → (3,3), outer product    │
  │                         │ via newaxis, np.broadcast_to/broadcast_arrays, normalize rows/cols,      │
  │                         │ pairwise distance, Z-score, softmax, np.meshgrid, np.ogrid              │
  ├─────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
  │ 02-fancy-indexing       │ Boolean masks (condition-based selection/assignment), integer array       │
  │                         │ indexing (copy vs view), repeated indices, np.where (2-arg/3-arg),       │
  │                         │ np.nonzero, np.argwhere, np.searchsorted, np.argsort/lexsort,            │
  │                         │ np.put/np.add.at (scatter ops), np.ix_ submatrix selection              │
  ├─────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
  │ 03-linear-algebra       │ matmul (@), np.dot, determinant, inverse, solve (Ax=b), eigenvalues/     │
  │                         │ eigenvectors, SVD, QR decomposition, Cholesky, rank, trace, norm,        │
  │                         │ lstsq (least squares), matrix power, np.linalg.cond, pinv, cross product │
  ├─────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
  │ 04-random-and-stats     │ rand/randn/randint, seed for reproducibility, np.random.choice,          │
  │                         │ Generator API (default_rng), distributions (normal/uniform/binomial/     │
  │                         │ poisson/exponential/beta/gamma), shuffle/permutation, bootstrap CI,      │
  │                         │ correlation matrix, covariance, percentile/quantile, hypothesis testing  │
  ├─────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
  │ 05-structured-arrays    │ np.dtype with named fields, create/access/filter/sort structured arrays, │
  │                         │ string/nested dtype fields, np.zeros/empty with structured dtype,        │
  │                         │ field arithmetic, recarray, np.lib.recfunctions, CSV round-trip          │
  └─────────────────────────┴──────────────────────────────────────────────────────────────────────────┘

---

## Phase 3: Advanced  (5 topics × 3 files)

  ┌──────────────────────┬─────────────────────────────────────────────────────────────────────────────┐
  │        Topic         │                                  Content                                   │
  ├──────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
  │ 01-strides-and-views │ Array strides (bytes/step), C- vs F-order strides, as_strided for sliding  │
  │                      │ windows/rolling ops, view vs copy rules, np.lib.stride_tricks,              │
  │                      │ contiguous flags, memoryview interop, stride-based transpose understanding  │
  ├──────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
  │ 02-vectorization     │ Replace Python loops with array ops, np.where for branching, vectorized     │
  │                      │ conditionals, np.vectorize/np.frompyfunc, avoid explicit iteration,         │
  │                      │ batch matrix ops, numexpr-style patterns, Numba-friendly patterns           │
  ├──────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
  │ 03-advanced-indexing │ np.ix_ (cross-product indexing), np.meshgrid, np.ogrid, np.mgrid,          │
  │                      │ multi-dim boolean masks, np.indices, np.ravel_multi_index,                  │
  │                      │ np.unravel_index, advanced scatter/gather with np.add.at/np.put             │
  ├──────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
  │ 04-ufuncs            │ Built-in ufuncs (np.add/multiply/…), ufunc.reduce/accumulate/outer/         │
  │                      │ reduceat/at, np.frompyfunc (custom ufunc), np.vectorize, ufunc methods      │
  │                      │ (identity/nargs/nin/nout), generalized ufuncs (gufunc signatures)          │
  ├──────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
  │ 05-performance       │ In-place ops (+=, *=) to avoid copies, contiguous memory for speed,         │
  │                      │ np.einsum for fused ops, cache-friendly access patterns, avoiding           │
  │                      │ temporary arrays, np.copyto/out= parameter in ufuncs, profiling patterns   │
  └──────────────────────┴─────────────────────────────────────────────────────────────────────────────┘

---

## Phase 4: Patterns  (5 topics × 3 files)

  ┌────────────────────────┬───────────────────────────────────────────────────────────────────────────┐
  │         Topic          │                                  Content                                  │
  ├────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ 01-data-preprocessing  │ Min-max normalization, z-score standardization, robust scaling (IQR),     │
  │                        │ NaN imputation (mean/median/forward-fill), one-hot encoding, label        │
  │                        │ encoding, train-test split, feature clipping, whitening, binning          │
  ├────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ 02-matrix-operations   │ Eigendecomposition, SVD for dimensionality reduction (PCA), Cholesky      │
  │                        │ solve, LU decomposition, matrix exponential, Gram-Schmidt, Householder,   │
  │                        │ condition number, rank, pseudo-inverse, projection matrices               │
  ├────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ 03-signal-processing   │ Sine wave generation, FFT/IFFT, power spectral density, windowing         │
  │                        │ (Hanning/Hamming), convolution/correlation, FIR filter design,            │
  │                        │ spectrogram (STFT), peak finding, noise addition/SNR, resampling          │
  ├────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ 04-statistical-analysis│ Distribution sampling (normal/uniform/binomial/Poisson), descriptive      │
  │                        │ stats, correlation/covariance, bootstrap confidence intervals,            │
  │                        │ hypothesis testing (t-test patterns), Kolmogorov-Smirnov, outlier        │
  │                        │ detection (IQR/z-score), rolling stats, kernel density estimation         │
  ├────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ 05-image-processing    │ Synthetic RGB/grayscale images (uint8), channel separation, grayscale     │
  │                        │ conversion, cropping/flipping/rotation, brightness/contrast adjustment,   │
  │                        │ convolution kernels (blur/sharpen/edge detect), histogram equalization,   │
  │                        │ thresholding, morphological ops, padding for CNNs                         │
  └────────────────────────┴───────────────────────────────────────────────────────────────────────────┘

---

## Phase 5: Real-World  (5 topics × 3 files)

  ┌─────────────────────────┬──────────────────────────────────────────────────────────────────────────┐
  │          Topic          │                                   Content                                │
  ├─────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
  │ 01-financial-analysis   │ Returns, Sharpe ratio, max drawdown, VaR, Black-Scholes option pricing   │
  ├─────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
  │ 02-ml-preprocessing     │ MinMax/z-score normalization, PCA, train-test split, imputation,         │
  │                         │ confusion matrix                                                         │
  ├─────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
  │ 03-scientific-computing │ FFT, numerical integration (trapz/Simpson), ODE Euler method, linear     │
  │                         │ solvers, SVD                                                             │
  ├─────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
  │ 04-data-pipeline        │ NaN handling (ffill/interp/mean), rolling stats, chunked processing,     │
  │                         │ outlier removal                                                          │
  ├─────────────────────────┼──────────────────────────────────────────────────────────────────────────┤
  │ 05-monte-carlo          │ Pi estimation, GBM stock simulation, European call option pricing,        │
  │                         │ bootstrap CI, VaR                                                        │
  └─────────────────────────┴──────────────────────────────────────────────────────────────────────────┘

---

## Phase 6: Expert  (5 topics × 3 files)

  ┌────────────────────────┬───────────────────────────────────────────────────────────────────────────┐
  │         Topic          │                                    Content                                │
  ├────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ 01-memory-mapping      │ np.memmap create/read/write, chunked column means, chunked max,           │
  │                        │ structured memmap, offset reads                                           │
  ├────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ 02-custom-dtypes       │ Structured dtypes, field access/filter/sort, nested dtypes, one-hot       │
  │                        │ encoding, inner join                                                      │
  ├────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ 03-advanced-ufuncs     │ frompyfunc, vectorize, reduce, accumulate, outer, reduceat, ufunc.at,     │
  │                        │ gufunc signatures                                                         │
  ├────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ 04-optimization        │ In-place ops, einsum (matmul/trace/dot), stride tricks, rolling sum via   │
  │                        │ cumsum, pairwise distances                                                │
  ├────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ 05-production-patterns │ Input validation, safe_log/normalize, read-only arrays, serialization,   │
  │                        │ Welford online mean, drift detection                                      │
  └────────────────────────┴───────────────────────────────────────────────────────────────────────────┘

---

## Key NumPy APIs by Category

### Array Creation
```
np.array()          np.zeros()          np.ones()           np.full()
np.eye()            np.arange()         np.linspace()       np.empty()
np.zeros_like()     np.ones_like()      np.full_like()      np.fromfunction()
np.frombuffer()     np.frompyfunc()     np.tile()           np.repeat()
np.meshgrid()       np.ogrid            np.mgrid
```

### Dtypes
```
np.int8/16/32/64    np.uint8/16/32/64   np.float32/64
np.complex64/128    np.bool_            np.str_ / 'U<N>'
np.bytes_ / 'S<N>'  np.object_          structured dtype: np.dtype([('field', type), ...])
```

### Indexing & Slicing
```
arr[i]              arr[i:j:k]          arr[::-1]           arr[bool_mask]
arr[int_array]      arr[np.newaxis, :]  arr[..., 0]         np.ix_(rows, cols)
np.take()           np.where()          np.nonzero()        np.argwhere()
np.searchsorted()   np.unravel_index()  np.ravel_multi_index()
```

### Reshaping & Joining
```
arr.reshape()       arr.ravel()         arr.flatten()       arr.T
np.expand_dims()    np.squeeze()        np.transpose()      np.moveaxis()
np.swapaxes()       np.concatenate()    np.stack()          np.vstack()
np.hstack()         np.dstack()         np.split()          np.hsplit()
np.vsplit()         np.pad()            np.block()          np.resize()
```

### Math & Reduction
```
np.sum()    np.mean()   np.std()    np.var()    np.median()  np.percentile()
np.min()    np.max()    np.prod()   np.cumsum() np.cumprod() np.diff()
np.argmin() np.argmax() np.any()    np.all()    np.count_nonzero()
np.average()           np.gradient()            np.trapz()
np.einsum()            np.cross()               np.inner()   np.outer()
np.histogram()         np.bincount()            np.correlate() np.convolve()
```

### Math Functions
```
np.sqrt()   np.exp()    np.log()    np.log2()   np.log10()   np.abs()
np.sign()   np.clip()   np.floor()  np.ceil()   np.round()   np.modf()
np.sin/cos/tan()        np.arcsin/cos/tan()      np.deg2rad() np.rad2deg()
np.maximum()            np.minimum()             np.hypot()   np.cbrt()
```

### Linear Algebra (np.linalg)
```
np.linalg.dot()   np.linalg.norm()    np.linalg.inv()    np.linalg.det()
np.linalg.solve() np.linalg.eig()     np.linalg.eigh()   np.linalg.svd()
np.linalg.qr()    np.linalg.cholesky() np.linalg.lstsq() np.linalg.matrix_power()
np.linalg.cond()  np.linalg.matrix_rank()                np.linalg.pinv()
```

### Random (np.random / np.random.default_rng)
```
np.random.seed()         np.random.rand()         np.random.randn()
np.random.randint()      np.random.choice()       np.random.shuffle()
np.random.permutation()  np.random.normal()       np.random.uniform()
np.random.binomial()     np.random.poisson()      np.random.exponential()
np.random.default_rng()  rng.standard_normal()    rng.integers()
```

### Advanced / Expert
```
np.memmap()              np.lib.stride_tricks.as_strided()
np.frompyfunc()          np.vectorize()
ufunc.reduce()           ufunc.accumulate()       ufunc.outer()
ufunc.reduceat()         ufunc.at()
np.shares_memory()       arr.flags                arr.strides
arr.byteswap()           arr.newbyteorder()       np.result_type()
np.can_cast()            np.min_scalar_type()
```

---

## Common Patterns

### Broadcasting rule (align shapes from the right):
```
(3, 1) + (1, 4)  →  (3, 4)   ✓
(3,)   + (4, 3)  →  (4, 3)   ✓ (prepend 1: (1,3))
(2, 3) + (4, 3)  →  ERROR    ✗ (2 ≠ 4, neither is 1)
```

### View vs Copy:
```
Slicing  → view  (shares memory, mutations affect original)
Fancy    → copy  (integer array / boolean mask indexing)
flatten  → copy  |  ravel → view when possible
reshape  → view when possible (contiguous arrays)
```

### NaN-safe alternatives:
```
np.nanmean  np.nansum  np.nanmax  np.nanmin  np.nanstd  np.nanvar
np.nanpercentile  np.nanmedian  np.nanargmax  np.nanargmin
```

### Performance tips:
- Prefer in-place ops (`+=`, `*=`) to avoid allocation
- Use `np.einsum` for fused multi-dimensional contractions
- Ensure C-contiguous arrays for row-wise access (`np.ascontiguousarray`)
- Use `out=` parameter in ufuncs to write into pre-allocated buffer
- Use `np.memmap` for datasets larger than RAM

---

## Directory Structure

```
numpy-mastery/
├── read.md                          ← this file
├── phase-1-fundamentals/
│   ├── 01-arrays-and-dtypes/        examples.py | exercise.py | solution.py | test.py
│   ├── 02-array-indexing/           examples.py | exercise.py | solution.py
│   ├── 03-array-operations/         examples.py | exercise.py | solution.py
│   ├── 04-array-reshaping/          examples.py | exercise.py | solution.py
│   └── 05-array-math/               examples.py | exercise.py | solution.py
├── phase-2-intermediate/
│   ├── 01-broadcasting/             examples.py | exercise.py | solution.py
│   ├── 02-fancy-indexing/           examples.py | exercise.py | solution.py
│   ├── 03-linear-algebra/           examples.py | exercise.py | solution.py
│   ├── 04-random-and-stats/         examples.py | exercise.py | solution.py
│   └── 05-structured-arrays/        examples.py | exercise.py | solution.py
├── phase-3-advanced/
│   ├── 01-strides-and-views/        examples.py | exercise.py | solution.py
│   ├── 02-vectorization/            examples.py | exercise.py | solution.py
│   ├── 03-advanced-indexing/        examples.py | exercise.py | solution.py
│   ├── 04-ufuncs/                   examples.py | exercise.py | solution.py
│   └── 05-performance/              examples.py | exercise.py | solution.py
├── phase-4-patterns/
│   ├── 01-data-preprocessing/       examples.py | exercise.py | solution.py
│   ├── 02-matrix-operations/        examples.py | exercise.py | solution.py
│   ├── 03-signal-processing/        examples.py | exercise.py | solution.py
│   ├── 04-statistical-analysis/     examples.py | exercise.py | solution.py
│   └── 05-image-processing/         examples.py | exercise.py | solution.py
├── phase-5-real-world/
│   ├── 01-financial-analysis/       examples.py | exercise.py | solution.py
│   ├── 02-ml-preprocessing/         examples.py | exercise.py | solution.py
│   ├── 03-scientific-computing/     examples.py | exercise.py | solution.py
│   ├── 04-data-pipeline/            examples.py | exercise.py | solution.py
│   └── 05-monte-carlo/              examples.py | exercise.py | solution.py
└── phase-6-expert/
    ├── 01-memory-mapping/            examples.py | exercise.py | solution.py
    ├── 02-custom-dtypes/             examples.py | exercise.py | solution.py
    ├── 03-advanced-ufuncs/           examples.py | exercise.py | solution.py
    ├── 04-optimization/              examples.py | exercise.py | solution.py
    └── 05-production-patterns/       examples.py | exercise.py | solution.py
```
