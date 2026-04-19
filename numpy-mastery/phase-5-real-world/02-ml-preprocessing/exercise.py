# ============================================================================
# Exercise 5.2 — ML Preprocessing
# ============================================================================
# Implement common ML preprocessing steps from scratch using NumPy:
# normalization, PCA, train/test split, imputation, and evaluation metrics.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python exercise.py
# ============================================================================

import numpy as np

np.random.seed(7)

# Dataset: 300 samples, 5 features
X = np.column_stack([
    np.random.normal(10, 3, 300),
    np.random.normal(0, 1, 300),
    np.random.uniform(0, 100, 300),
    np.random.exponential(2, 300),
    np.random.normal(5, 0.5, 300),
])
y = (X[:, 0] * 0.4 + X[:, 2] * 0.01 + np.random.normal(0, 0.5, 300) > 6).astype(int)

# ---------------------------------------------------------------------------
# 1. Min-Max normalization (scale each feature to [0, 1])
# ---------------------------------------------------------------------------

# TODO: compute min and max of each column
X_min = None  # replace None
X_max = None  # replace None

# TODO: apply min-max normalization: (X - X_min) / (X_max - X_min)
X_minmax = None  # replace None

# ---------------------------------------------------------------------------
# 2. Z-score standardization
# ---------------------------------------------------------------------------

# TODO: compute column-wise mean and std
X_mean = None  # replace None
X_std = None  # replace None

# TODO: standardize: (X - mean) / std
X_zscore = None  # replace None

# ---------------------------------------------------------------------------
# 3. Train/test split (80/20, shuffled)
# ---------------------------------------------------------------------------

# TODO: create a permuted index array of length len(X)
idx = None  # replace None

# TODO: compute split point at 80%
split = None  # replace None  (integer: int(0.8 * len(X)))

# TODO: create X_train, X_test, y_train, y_test using idx and split
X_train = None  # replace None
X_test  = None  # replace None
y_train = None  # replace None
y_test  = None  # replace None

# ---------------------------------------------------------------------------
# 4. Missing-value imputation (mean imputation)
# ---------------------------------------------------------------------------

X_missing = X.copy()
rng_mask = np.random.RandomState(99)
X_missing[rng_mask.random((300, 5)) < 0.05] = np.nan

# TODO: compute column means ignoring NaN (use np.nanmean)
col_means = None  # replace None

# TODO: fill NaN values with the corresponding column mean
X_imputed = X_missing.copy()
for j in range(X_missing.shape[1]):
    nan_j = np.isnan(X_imputed[:, j])
    X_imputed[nan_j, j] = col_means[j]

# ---------------------------------------------------------------------------
# 5. PCA — project X_zscore onto top 2 principal components
# ---------------------------------------------------------------------------

# TODO: compute covariance matrix of X_zscore (use np.cov, transpose correctly)
cov_matrix = None  # replace None

# TODO: compute eigenvalues and eigenvectors of cov_matrix (use np.linalg.eigh)
eigenvalues = None  # replace None
eigenvectors = None  # replace None

# TODO: sort by descending eigenvalue
order = np.argsort(eigenvalues)[::-1]
eigenvalues  = eigenvalues[order]
eigenvectors = eigenvectors[:, order]

# TODO: project X_zscore onto the top 2 eigenvectors
X_pca = None  # replace None  — shape (300, 2)

# ---------------------------------------------------------------------------
# 6. Explained variance ratio for the top 2 components
# ---------------------------------------------------------------------------

# TODO: explained variance ratio = each eigenvalue / sum of all eigenvalues
evr = None  # replace None  — shape (5,) for all 5 components

# ---------------------------------------------------------------------------
# 7. One-hot encoding for a categorical feature
# ---------------------------------------------------------------------------

categories = np.random.randint(0, 4, 300)  # 4 classes (0-3)

# TODO: create one-hot matrix of shape (300, 4) using integer indexing
ohe = None  # replace None

# ---------------------------------------------------------------------------
# 8. Confusion matrix
# ---------------------------------------------------------------------------

y_pred = (X_test[:, 0] > X_test[:, 0].mean()).astype(int)  # naive threshold predictor

# TODO: build 2x2 confusion matrix without sklearn:
#       cm[true_label, predicted_label] = count
cm = None  # replace None  — np.zeros((2,2), dtype=int) then fill

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert X_min is not None and X_max is not None, "X_min and X_max must be defined"
    assert X_min.shape == (5,), "X_min should have shape (5,)"

    assert X_minmax is not None, "X_minmax must be defined"
    assert X_minmax.shape == X.shape, "X_minmax should match X shape"
    assert np.allclose(X_minmax.min(axis=0), 0), "min-max normalization: min should be 0"
    assert np.allclose(X_minmax.max(axis=0), 1), "min-max normalization: max should be 1"

    assert X_mean is not None and X_std is not None
    assert X_zscore is not None, "X_zscore must be defined"
    assert X_zscore.shape == X.shape
    assert np.allclose(X_zscore.mean(axis=0), 0, atol=1e-10), "z-scored mean should be 0"
    assert np.allclose(X_zscore.std(axis=0), 1, atol=1e-10), "z-scored std should be 1"

    assert idx is not None, "idx must be defined"
    assert len(idx) == len(X), "idx length should equal len(X)"
    assert set(idx) == set(range(len(X))), "idx should be a permutation"

    assert split is not None, "split must be defined"
    assert split == int(0.8 * len(X)), f"split should be {int(0.8 * len(X))}"

    assert X_train is not None and X_test is not None
    assert len(X_train) == split, "X_train size mismatch"
    assert len(X_test) == len(X) - split, "X_test size mismatch"
    assert len(y_train) == split and len(y_test) == len(X) - split

    assert col_means is not None, "col_means must be defined"
    assert col_means.shape == (5,), "col_means should have shape (5,)"

    assert np.isnan(X_imputed).sum() == 0, "X_imputed should have no NaNs"

    assert cov_matrix is not None, "cov_matrix must be defined"
    assert cov_matrix.shape == (5, 5), "covariance matrix should be 5x5"
    assert np.allclose(cov_matrix, cov_matrix.T), "covariance matrix should be symmetric"

    assert eigenvalues is not None and eigenvectors is not None
    assert eigenvalues.shape == (5,), "should have 5 eigenvalues"
    assert np.all(eigenvalues[:-1] >= eigenvalues[1:]), "eigenvalues should be sorted descending"

    assert X_pca is not None, "X_pca must be defined"
    assert X_pca.shape == (300, 2), f"X_pca should be (300, 2), got {X_pca.shape}"

    assert evr is not None, "evr must be defined"
    assert evr.shape == (5,), "evr should have 5 values"
    assert np.isclose(evr.sum(), 1.0), "explained variance ratios should sum to 1"
    assert np.all(evr >= 0), "all EVR values should be non-negative"

    assert ohe is not None, "ohe must be defined"
    assert ohe.shape == (300, 4), "one-hot shape should be (300, 4)"
    assert np.all(ohe.sum(axis=1) == 1), "each row should have exactly one 1"
    assert np.all((ohe == 0) | (ohe == 1)), "ohe should be binary"

    assert cm is not None, "cm must be defined"
    assert cm.shape == (2, 2), "confusion matrix should be 2x2"
    assert cm.sum() == len(y_test), "confusion matrix sum should equal test set size"
    assert cm[0, 0] + cm[1, 0] + cm[0, 1] + cm[1, 1] == len(y_test)

    print("Exercise 5.2 — All assertions passed!")

if __name__ == "__main__":
    main()
