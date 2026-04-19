# ============================================================================
# Solution 5.2 — ML Preprocessing
# ============================================================================

import numpy as np

np.random.seed(7)

X = np.column_stack([
    np.random.normal(10, 3, 300),
    np.random.normal(0, 1, 300),
    np.random.uniform(0, 100, 300),
    np.random.exponential(2, 300),
    np.random.normal(5, 0.5, 300),
])
y = (X[:, 0] * 0.4 + X[:, 2] * 0.01 + np.random.normal(0, 0.5, 300) > 6).astype(int)

# 1. Min-Max normalization
X_min = X.min(axis=0)
X_max = X.max(axis=0)
X_minmax = (X - X_min) / (X_max - X_min)

# 2. Z-score standardization
X_mean = X.mean(axis=0)
X_std = X.std(axis=0)
X_zscore = (X - X_mean) / X_std

# 3. Train/test split
idx = np.random.permutation(len(X))
split = int(0.8 * len(X))
X_train = X[idx[:split]]
X_test  = X[idx[split:]]
y_train = y[idx[:split]]
y_test  = y[idx[split:]]

# 4. Missing-value imputation
X_missing = X.copy()
rng_mask = np.random.RandomState(99)
X_missing[rng_mask.random((300, 5)) < 0.05] = np.nan
col_means = np.nanmean(X_missing, axis=0)
X_imputed = X_missing.copy()
for j in range(X_missing.shape[1]):
    nan_j = np.isnan(X_imputed[:, j])
    X_imputed[nan_j, j] = col_means[j]

# 5. PCA — top 2 principal components
cov_matrix = np.cov(X_zscore.T)
eigenvalues, eigenvectors = np.linalg.eigh(cov_matrix)
order = np.argsort(eigenvalues)[::-1]
eigenvalues  = eigenvalues[order]
eigenvectors = eigenvectors[:, order]
X_pca = X_zscore @ eigenvectors[:, :2]

# 6. Explained variance ratio
evr = eigenvalues / eigenvalues.sum()

# 7. One-hot encoding
categories = np.random.randint(0, 4, 300)
ohe = np.zeros((300, 4), dtype=int)
ohe[np.arange(300), categories] = 1

# 8. Confusion matrix
y_pred = (X_test[:, 0] > X_test[:, 0].mean()).astype(int)
cm = np.zeros((2, 2), dtype=int)
for t, p in zip(y_test, y_pred):
    cm[t, p] += 1

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert X_min is not None and X_max is not None
    assert X_min.shape == (5,)

    assert X_minmax is not None
    assert X_minmax.shape == X.shape
    assert np.allclose(X_minmax.min(axis=0), 0)
    assert np.allclose(X_minmax.max(axis=0), 1)

    assert X_mean is not None and X_std is not None
    assert X_zscore is not None
    assert X_zscore.shape == X.shape
    assert np.allclose(X_zscore.mean(axis=0), 0, atol=1e-10)
    assert np.allclose(X_zscore.std(axis=0), 1, atol=1e-10)

    assert idx is not None
    assert len(idx) == len(X)
    assert set(idx) == set(range(len(X)))

    assert split is not None
    assert split == int(0.8 * len(X))

    assert X_train is not None and X_test is not None
    assert len(X_train) == split
    assert len(X_test) == len(X) - split
    assert len(y_train) == split and len(y_test) == len(X) - split

    assert col_means is not None
    assert col_means.shape == (5,)

    assert np.isnan(X_imputed).sum() == 0

    assert cov_matrix is not None
    assert cov_matrix.shape == (5, 5)
    assert np.allclose(cov_matrix, cov_matrix.T)

    assert eigenvalues is not None and eigenvectors is not None
    assert eigenvalues.shape == (5,)
    assert np.all(eigenvalues[:-1] >= eigenvalues[1:])

    assert X_pca is not None
    assert X_pca.shape == (300, 2)

    assert evr is not None
    assert evr.shape == (5,)
    assert np.isclose(evr.sum(), 1.0)
    assert np.all(evr >= 0)

    assert ohe is not None
    assert ohe.shape == (300, 4)
    assert np.all(ohe.sum(axis=1) == 1)
    assert np.all((ohe == 0) | (ohe == 1))

    assert cm is not None
    assert cm.shape == (2, 2)
    assert cm.sum() == len(y_test)

    print("Solution 5.2 — All assertions passed!")

if __name__ == "__main__":
    main()
