# ============================================================================
# Examples 5.2 — ML Preprocessing  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np

np.random.seed(42)

# Synthetic dataset: 200 samples, 6 features
X = np.column_stack([
    np.random.normal(5, 2, 200),      # feature 0 — age-like
    np.random.normal(50000, 15000, 200),  # feature 1 — salary-like
    np.random.randint(0, 5, 200).astype(float),  # feature 2 — categorical
    np.random.uniform(0, 1, 200),     # feature 3 — rate
    np.random.exponential(2, 200),    # feature 4 — skewed
    np.random.normal(0, 1, 200),      # feature 5 — standard normal
])
y = (X[:, 0] * 0.3 + X[:, 3] * 2 + np.random.normal(0, 0.5, 200) > 3).astype(int)

# --- BASIC ---

# 1. dataset shape
print("Ex01 shape:", X.shape)

# 2. feature means
print("Ex02 means:", X.mean(axis=0).round(2))

# 3. feature stds
print("Ex03 stds:", X.std(axis=0).round(2))

# 4. min-max normalization (manual)
X_min = X.min(axis=0)
X_max = X.max(axis=0)
X_minmax = (X - X_min) / (X_max - X_min)
print("Ex04 minmax range:", X_minmax.min(axis=0).round(3), X_minmax.max(axis=0).round(3))

# 5. z-score standardization
X_mean = X.mean(axis=0)
X_std = X.std(axis=0)
X_zscore = (X - X_mean) / X_std
print("Ex05 zscore mean:", X_zscore.mean(axis=0).round(6))

# 6. class distribution
classes, counts = np.unique(y, return_counts=True)
print("Ex06 class distribution:", dict(zip(classes, counts)))

# 7. class imbalance ratio
imbalance = counts.max() / counts.min()
print("Ex07 imbalance ratio:", round(imbalance, 4))

# 8. check for NaN values
print("Ex08 NaNs in X:", np.isnan(X).sum())

# 9. check for Inf values
print("Ex09 Infs in X:", np.isinf(X).sum())

# 10. feature value range
print("Ex10 feature ranges:", (X_max - X_min).round(2))

# 11. median of each feature
print("Ex11 medians:", np.median(X, axis=0).round(2))

# 12. IQR (inter-quartile range) per feature
q75, q25 = np.percentile(X, [75, 25], axis=0)
iqr = q75 - q25
print("Ex12 IQR:", iqr.round(2))

# 13. covariance matrix of X
cov_X = np.cov(X.T)
print("Ex13 covariance matrix shape:", cov_X.shape)

# 14. correlation matrix
corr_X = np.corrcoef(X.T)
print("Ex14 correlation matrix shape:", corr_X.shape)

# 15. train/test split (80/20)
n_train = int(0.8 * len(X))
idx = np.random.permutation(len(X))
X_train, X_test = X[idx[:n_train]], X[idx[n_train:]]
y_train, y_test = y[idx[:n_train]], y[idx[n_train:]]
print("Ex15 train size:", len(X_train), "test size:", len(X_test))

# --- INTERMEDIATE ---

# 16. stratified split (preserve class ratios)
def stratified_split(X_s, y_s, test_size=0.2, seed=0):
    rng = np.random.RandomState(seed)
    train_idx, test_idx = [], []
    for cls in np.unique(y_s):
        cls_idx = np.where(y_s == cls)[0]
        rng.shuffle(cls_idx)
        n_test = max(1, int(len(cls_idx) * test_size))
        test_idx.extend(cls_idx[:n_test])
        train_idx.extend(cls_idx[n_test:])
    return X_s[train_idx], X_s[test_idx], y_s[train_idx], y_s[test_idx]
Xtr_s, Xte_s, ytr_s, yte_s = stratified_split(X, y)
print("Ex16 stratified train class dist:", np.bincount(ytr_s))

# 17. k-fold split indices
def kfold_indices(n, k):
    fold_size = n // k
    return [np.arange(i*fold_size, (i+1)*fold_size) for i in range(k)]
folds = kfold_indices(200, 5)
print("Ex17 fold sizes:", [len(f) for f in folds])

# 18. one-hot encoding
def one_hot(labels, n_classes):
    ohe = np.zeros((len(labels), n_classes), dtype=int)
    ohe[np.arange(len(labels)), labels] = 1
    return ohe
X_cat = X[:, 2].astype(int)
ohe = one_hot(X_cat, 5)
print("Ex18 one-hot shape:", ohe.shape, "row sum:", ohe.sum(axis=1)[:5])

# 19. label encoding (already integers here, concept demo)
unique_cats = np.unique(X_cat)
label_map = {v: i for i, v in enumerate(unique_cats)}
encoded = np.array([label_map[v] for v in X_cat])
print("Ex19 label encoded unique:", np.unique(encoded))

# 20. polynomial features (degree 2, two features)
a, b = X[:, 3], X[:, 5]
poly_feats = np.column_stack([a, b, a**2, b**2, a*b])
print("Ex20 poly features shape:", poly_feats.shape)

# 21. PCA from scratch (2 components)
X_c = X_zscore  # use standardized features
cov_pca = np.cov(X_c.T)
eigenvalues, eigenvectors = np.linalg.eigh(cov_pca)
order = np.argsort(eigenvalues)[::-1]
eigenvalues = eigenvalues[order]
eigenvectors = eigenvectors[:, order]
X_pca = X_c @ eigenvectors[:, :2]
print("Ex21 PCA shape:", X_pca.shape)

# 22. explained variance ratio
total_var = eigenvalues.sum()
evr = eigenvalues / total_var
print("Ex22 explained variance ratio:", evr.round(4))

# 23. cumulative explained variance
cum_evr = np.cumsum(evr)
print("Ex23 cumulative EVR:", cum_evr.round(4))

# 24. number of components for 95% variance
n_components_95 = np.searchsorted(cum_evr, 0.95) + 1
print("Ex24 components for 95% variance:", n_components_95)

# 25. missing value imputation (mean)
X_missing = X.copy()
mask = np.random.random(X.shape) < 0.05
X_missing[mask] = np.nan
col_means = np.nanmean(X_missing, axis=0)
nan_mask = np.isnan(X_missing)
X_imputed = X_missing.copy()
for j in range(X_missing.shape[1]):
    X_imputed[nan_mask[:, j], j] = col_means[j]
print("Ex25 remaining NaNs:", np.isnan(X_imputed).sum())

# 26. missing value imputation (median)
col_medians = np.nanmedian(X_missing, axis=0)
X_imp_med = X_missing.copy()
for j in range(X_missing.shape[1]):
    X_imp_med[nan_mask[:, j], j] = col_medians[j]
print("Ex26 median-imputed NaNs:", np.isnan(X_imp_med).sum())

# 27. outlier detection using IQR
def detect_outliers_iqr(arr):
    q1, q3 = np.percentile(arr, [25, 75])
    iqr_v = q3 - q1
    return (arr < q1 - 1.5 * iqr_v) | (arr > q3 + 1.5 * iqr_v)
outlier_mask = detect_outliers_iqr(X[:, 1])
print("Ex27 outliers in feature 1:", outlier_mask.sum())

# 28. outlier detection using Z-score (threshold=3)
z = np.abs((X[:, 4] - X[:, 4].mean()) / X[:, 4].std())
outliers_z = z > 3
print("Ex28 z-score outliers feature 4:", outliers_z.sum())

# 29. robust scaling (median + IQR)
med = np.median(X, axis=0)
iqr_r = np.percentile(X, 75, axis=0) - np.percentile(X, 25, axis=0)
X_robust = (X - med) / iqr_r
print("Ex29 robust scaled median:", np.median(X_robust, axis=0).round(4))

# 30. feature selection by variance threshold
variances = X.var(axis=0)
high_var = variances > 1.0
print("Ex30 high variance features:", np.where(high_var)[0])

# --- ADVANCED ---

# 31. LDA projection concept (Fisher's criterion, binary)
X0 = X_train[y_train == 0]
X1 = X_train[y_train == 1]
m0, m1 = X0.mean(axis=0), X1.mean(axis=0)
S_w = X0.T @ X0 + X1.T @ X1
try:
    w_lda = np.linalg.solve(S_w, m1 - m0)
    w_lda /= np.linalg.norm(w_lda)
    print("Ex31 LDA direction (first 3):", w_lda[:3].round(4))
except np.linalg.LinAlgError:
    print("Ex31 LDA: singular matrix, skipped")

# 32. whitening transform (ZCA)
cov_w = np.cov(X_zscore.T)
evals_w, evecs_w = np.linalg.eigh(cov_w)
W_zca = evecs_w @ np.diag(1.0 / np.sqrt(evals_w + 1e-8)) @ evecs_w.T
X_white = X_zscore @ W_zca.T
print("Ex32 whitened cov diagonal:", np.diag(np.cov(X_white.T)).round(2))

# 33. feature importance proxy (variance after standardization)
std_importance = X_zscore.std(axis=0)
ranked = np.argsort(std_importance)[::-1]
print("Ex33 feature ranking by variance:", ranked)

# 34. stratified k-fold cross-validation indices
def stratified_kfold(y_sf, k):
    folds_sf = [[] for _ in range(k)]
    for cls in np.unique(y_sf):
        cls_idx = np.where(y_sf == cls)[0]
        np.random.shuffle(cls_idx)
        for i, idx_val in enumerate(cls_idx):
            folds_sf[i % k].append(idx_val)
    return [np.array(f) for f in folds_sf]
skf = stratified_kfold(y, 5)
print("Ex34 stratified fold sizes:", [len(f) for f in skf])

# 35. SMOTE concept (synthetic minority oversampling)
minority_X = X[y == 1]
# simple: interpolate between two random minority samples
idx1, idx2 = np.random.choice(len(minority_X), 2, replace=False)
synthetic = minority_X[idx1] + np.random.rand() * (minority_X[idx2] - minority_X[idx1])
print("Ex35 synthetic sample:", synthetic[:3].round(4))

# 36. feature interaction matrix
n_feat = X.shape[1]
interactions = np.zeros((n_feat, n_feat))
for i in range(n_feat):
    for j in range(i, n_feat):
        interactions[i, j] = np.abs(np.corrcoef(X[:, i], X[:, j])[0, 1])
        interactions[j, i] = interactions[i, j]
print("Ex36 max interaction (off-diag):", round(interactions[interactions < 1].max(), 4))

# 37. batch normalization statistics per feature
batch = X_train[:32]
batch_mean = batch.mean(axis=0)
batch_var = batch.var(axis=0)
batch_norm = (batch - batch_mean) / np.sqrt(batch_var + 1e-8)
print("Ex37 batch-normed mean:", batch_norm.mean(axis=0).round(6))

# 38. windowed features (lag features for time series)
signal = np.random.normal(0, 1, 100)
def lag_features(arr, lags):
    return np.column_stack([arr[max(0, i-l) if i >= l else 0]
                            if False else arr[l:] for l in lags])
lf = np.column_stack([signal[i:-(3-i) if 3-i > 0 else len(signal)] for i in range(3)])
print("Ex38 lag features shape:", lf.shape)

# 39. target encoding (mean of y per category)
def target_encode(X_col, y_te):
    classes_te = np.unique(X_col)
    mapping = {c: y_te[X_col == c].mean() for c in classes_te}
    return np.array([mapping[v] for v in X_col])
te = target_encode(X_cat, y)
print("Ex39 target encoded unique vals:", np.unique(te.round(4)))

# 40. feature hashing (bucket trick)
n_buckets = 16
hashed = X_cat % n_buckets
print("Ex40 hashed feature unique:", np.unique(hashed))

# 41. numerical gradient check for feature scaling gradient
eps = 1e-5
feat = X[:, 0].copy()
loss = lambda f: ((f - f.mean())**2).mean()
grad_analytic = 2 * (feat - feat.mean()) / len(feat)
grad_numeric = (loss(feat + eps) - loss(feat - eps)) / (2 * eps)
print("Ex41 gradient check (scalar):", abs(grad_analytic.mean() - grad_numeric) < 1e-6)

# 42. confusion matrix from scratch
def confusion_matrix(y_true, y_pred, n_classes=2):
    cm = np.zeros((n_classes, n_classes), dtype=int)
    for t, p in zip(y_true, y_pred):
        cm[t, p] += 1
    return cm
# random predictions
y_pred = np.random.randint(0, 2, len(y_test))
cm = confusion_matrix(y_test, y_pred)
print("Ex42 confusion matrix:\n", cm)

# --- EXPERT ---

# 43. F1 score from confusion matrix
TP, FP, FN = cm[1,1], cm[0,1], cm[1,0]
precision = TP / (TP + FP) if TP + FP > 0 else 0
recall = TP / (TP + FN) if TP + FN > 0 else 0
f1 = 2 * precision * recall / (precision + recall) if precision + recall > 0 else 0
print("Ex43 F1 score:", round(f1, 4))

# 44. ROC curve points
def roc_curve_np(y_true_r, scores_r):
    thresholds = np.sort(np.unique(scores_r))[::-1]
    tprs, fprs = [], []
    P = y_true_r.sum()
    N = len(y_true_r) - P
    for t in thresholds:
        pred = (scores_r >= t).astype(int)
        tp = ((pred == 1) & (y_true_r == 1)).sum()
        fp = ((pred == 1) & (y_true_r == 0)).sum()
        tprs.append(tp / P)
        fprs.append(fp / N)
    return np.array(fprs), np.array(tprs)
scores = np.random.rand(len(y_test))
fprs, tprs = roc_curve_np(y_test, scores)
print("Ex44 ROC points:", len(fprs))

# 45. AUC via trapezoidal rule
auc = np.trapz(tprs, fprs)
print("Ex45 AUC:", round(abs(auc), 4))

# 46. class weights for imbalanced learning
class_counts_cw = np.bincount(y)
total = len(y)
class_weights = total / (len(class_counts_cw) * class_counts_cw)
print("Ex46 class weights:", class_weights.round(4))

# 47. calibration (Platt scaling concept)
# logistic function applied to raw scores
def sigmoid(z):
    return 1 / (1 + np.exp(-z))
raw_scores = np.random.randn(100)
calibrated = sigmoid(raw_scores)
print("Ex47 calibrated range:", round(calibrated.min(), 4), "to", round(calibrated.max(), 4))

# 48. feature importance from mutual information (concept)
def mutual_info_discrete(x_mi, y_mi, bins=10):
    x_bins = np.digitize(x_mi, np.linspace(x_mi.min(), x_mi.max(), bins))
    joint_counts = np.zeros((bins, 2))
    for xi, yi in zip(x_bins - 1, y_mi):
        joint_counts[min(xi, bins-1), yi] += 1
    joint_p = joint_counts / len(y_mi)
    px = joint_p.sum(axis=1, keepdims=True)
    py = joint_p.sum(axis=0, keepdims=True)
    with np.errstate(divide='ignore', invalid='ignore'):
        mi = np.where(joint_p > 0, joint_p * np.log(joint_p / (px * py + 1e-10)), 0)
    return mi.sum()
mi_feat0 = mutual_info_discrete(X[:, 0], y)
print("Ex48 MI feature 0:", round(mi_feat0, 4))

# 49. dimensionality reduction quality (reconstruction error of PCA)
X_reconstructed = X_pca @ eigenvectors[:, :2].T * X_std + X_mean
recon_error = np.mean((X - X_reconstructed)**2)
print("Ex49 PCA reconstruction error:", round(recon_error, 4))

# 50. nested cross-validation concept
outer_scores = []
for outer_fold in range(3):
    test_idx_oc = folds[outer_fold]
    train_idx_oc = np.concatenate([folds[i] for i in range(5) if i != outer_fold])
    # inner loop (simplified: just evaluate with mean predictor)
    X_train_oc = X[train_idx_oc]
    y_train_oc = y[train_idx_oc]
    y_test_oc = y[test_idx_oc]
    y_pred_oc = np.full(len(y_test_oc), int(y_train_oc.mean() > 0.5))
    acc = (y_pred_oc == y_test_oc).mean()
    outer_scores.append(acc)
print("Ex50 nested CV scores:", [round(s, 4) for s in outer_scores])


def main():
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
