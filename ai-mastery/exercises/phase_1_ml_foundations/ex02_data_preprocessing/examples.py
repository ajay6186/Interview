# ============================================================
# Examples 1.2 — Data Preprocessing (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import pandas as pd
from sklearn.preprocessing import (
    StandardScaler, MinMaxScaler, LabelEncoder, OneHotEncoder,
    OrdinalEncoder, RobustScaler, PolynomialFeatures
)
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedShuffleSplit
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.compose import ColumnTransformer
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.feature_selection import VarianceThreshold, SelectFromModel
from sklearn.decomposition import PCA
from sklearn.linear_model import LogisticRegression
import warnings
warnings.filterwarnings("ignore")

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Fill NaN with mean"""
    s = pd.Series([1.0, np.nan, 3.0, np.nan, 5.0])
    filled = s.fillna(s.mean())
    print("Ex01 — fill NaN with mean:", filled.values)

def ex02():
    """Fill NaN with median"""
    s = pd.Series([1.0, np.nan, 3.0, 100.0, np.nan])
    filled = s.fillna(s.median())
    print("Ex02 — fill NaN with median:", filled.values)

def ex03():
    """Drop NaN rows"""
    df = pd.DataFrame({"a": [1, np.nan, 3], "b": [4, 5, np.nan]})
    cleaned = df.dropna()
    print("Ex03 — drop NaN rows:\n", cleaned)

def ex04():
    """StandardScaler"""
    X = np.array([[1.0], [2.0], [3.0], [4.0], [5.0]])
    scaler = StandardScaler()
    Xs = scaler.fit_transform(X)
    print("Ex04 — StandardScaler:", Xs.ravel().round(3), "| mean≈0:", Xs.mean().round(6))

def ex05():
    """MinMaxScaler"""
    X = np.array([[10.0], [20.0], [30.0], [40.0]])
    scaler = MinMaxScaler()
    Xs = scaler.fit_transform(X)
    print("Ex05 — MinMaxScaler:", Xs.ravel())

def ex06():
    """LabelEncoder"""
    le = LabelEncoder()
    labels = ["cat", "dog", "bird", "cat", "dog"]
    encoded = le.fit_transform(labels)
    print("Ex06 — LabelEncoder:", encoded, "| classes:", le.classes_)

def ex07():
    """OneHotEncoder"""
    enc = OneHotEncoder(sparse_output=False)
    cats = np.array([["red"], ["blue"], ["green"], ["red"]])
    ohe = enc.fit_transform(cats)
    print("Ex07 — OneHotEncoder categories:", enc.categories_[0])
    print("       encoded:\n", ohe)

def ex08():
    """Train/test split"""
    X = np.arange(20).reshape(10, 2)
    y = np.arange(10)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)
    print(f"Ex08 — train/test split: train={len(X_train)}, test={len(X_test)}")

def ex09():
    """Detect duplicates"""
    df = pd.DataFrame({"a": [1, 2, 2, 3], "b": [4, 5, 5, 6]})
    print("Ex09 — duplicates:", df.duplicated().sum(), "| rows:", df[df.duplicated()])

def ex10():
    """Drop duplicates"""
    df = pd.DataFrame({"a": [1, 2, 2, 3], "b": [4, 5, 5, 6]})
    df_clean = df.drop_duplicates()
    print("Ex10 — after drop_duplicates:\n", df_clean)

def ex11():
    """Clip outliers"""
    s = pd.Series([1, 2, 200, 3, 4, -50, 5])
    clipped = s.clip(lower=0, upper=10)
    print("Ex11 — clip [0,10]:", clipped.values)

def ex12():
    """Log transform"""
    arr = np.array([1, 10, 100, 1000, 10000])
    log_arr = np.log1p(arr)
    print("Ex12 — log1p transform:", log_arr.round(3))

def ex13():
    """Sqrt transform"""
    arr = np.array([0, 1, 4, 9, 16, 25, 100])
    sqrt_arr = np.sqrt(arr)
    print("Ex13 — sqrt transform:", sqrt_arr)

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Impute with strategy"""
    imp = SimpleImputer(strategy="most_frequent")
    X = np.array([[1, np.nan], [2, 3], [np.nan, 3], [1, np.nan]])
    print("Ex14 — most_frequent impute:\n", imp.fit_transform(X))

def ex15():
    """RobustScaler (resistant to outliers)"""
    X = np.array([[1.0], [2.0], [3.0], [100.0]])
    scaler = RobustScaler()
    Xs = scaler.fit_transform(X)
    print("Ex15 — RobustScaler:", Xs.ravel().round(3))

def ex16():
    """OrdinalEncoder"""
    enc = OrdinalEncoder(categories=[["low","medium","high"]])
    X = np.array([["low"], ["high"], ["medium"], ["low"]])
    print("Ex16 — OrdinalEncoder:", enc.fit_transform(X).ravel())

def ex17():
    """Target encoding concept (manual)"""
    df = pd.DataFrame({"city": ["NY","LA","NY","LA","NY"], "price": [300,200,350,210,320]})
    target_mean = df.groupby("city")["price"].mean()
    df["city_encoded"] = df["city"].map(target_mean)
    print("Ex17 — target encoded city:\n", df)

def ex18():
    """Multiple imputation concept (iterative / mean per column)"""
    df = pd.DataFrame({"x": [1.0, np.nan, 3.0, 4.0], "y": [np.nan, 2.0, 3.0, 4.0]})
    for col in df.columns:
        df[col] = df[col].fillna(df[col].mean())
    print("Ex18 — column-wise imputation:\n", df)

def ex19():
    """Binning with pd.cut"""
    s = pd.Series([15, 25, 35, 45, 55, 65])
    bins = pd.cut(s, bins=[0, 30, 50, 100], labels=["young","mid","senior"])
    print("Ex19 — pd.cut bins:", bins.values)

def ex20():
    """Binning with pd.qcut (quantile)"""
    s = pd.Series([1, 5, 10, 20, 50, 100, 200])
    q_bins = pd.qcut(s, q=3, labels=["low","mid","high"])
    print("Ex20 — pd.qcut quantile bins:", q_bins.values)

def ex21():
    """Polynomial features"""
    pf = PolynomialFeatures(degree=2, include_bias=False)
    X = np.array([[2, 3], [4, 5]])
    Xp = pf.fit_transform(X)
    print("Ex21 — poly features (deg 2):", pf.get_feature_names_out())
    print("       transformed:\n", Xp)

def ex22():
    """Interaction features (manual)"""
    df = pd.DataFrame({"a": [1, 2, 3], "b": [4, 5, 6]})
    df["a_x_b"] = df["a"] * df["b"]
    df["a_plus_b"] = df["a"] + df["b"]
    print("Ex22 — interaction features:\n", df)

def ex23():
    """Date feature extraction"""
    df = pd.DataFrame({"date": pd.date_range("2024-01-15", periods=4, freq="ME")})
    df["year"] = df["date"].dt.year
    df["month"] = df["date"].dt.month
    df["quarter"] = df["date"].dt.quarter
    df["dayofweek"] = df["date"].dt.dayofweek
    print("Ex23 — date features:\n", df)

def ex24():
    """Text length feature"""
    df = pd.DataFrame({"text": ["hello world", "a", "machine learning is great", "AI"]})
    df["length"] = df["text"].str.len()
    df["word_count"] = df["text"].str.split().str.len()
    print("Ex24 — text length features:\n", df)

def ex25():
    """Feature crossing"""
    df = pd.DataFrame({"color": ["red","blue","red"], "size": ["S","M","L"]})
    df["color_size"] = df["color"] + "_" + df["size"]
    le = LabelEncoder()
    df["color_size_enc"] = le.fit_transform(df["color_size"])
    print("Ex25 — feature cross:\n", df)

def ex26():
    """Stratified split"""
    X = np.arange(100).reshape(50, 2)
    y = np.array([0]*40 + [1]*10)
    sss = StratifiedShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    for tr, te in sss.split(X, y):
        y_train, y_test = y[tr], y[te]
    print(f"Ex26 — stratified split: train class dist {np.bincount(y_train)}, "
          f"test class dist {np.bincount(y_test)}")

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """Full preprocessing pipeline (sklearn Pipeline)"""
    from sklearn.datasets import make_classification
    X, y = make_classification(n_samples=100, n_features=5, random_state=0)
    pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="mean")),
        ("scaler",  StandardScaler()),
    ])
    Xt = pipe.fit_transform(X)
    print(f"Ex27 — pipeline output shape: {Xt.shape}, mean≈{Xt.mean():.4f}, std≈{Xt.std():.4f}")

def ex28():
    """ColumnTransformer for mixed types"""
    df = pd.DataFrame({
        "age":    [25, 30, np.nan, 40],
        "salary": [50000, 80000, 60000, np.nan],
        "dept":   ["A", "B", "A", "C"],
    })
    num_pipe = Pipeline([("imp", SimpleImputer()), ("sc", StandardScaler())])
    cat_pipe = Pipeline([("ohe", OneHotEncoder(handle_unknown="ignore", sparse_output=False))])
    ct = ColumnTransformer([
        ("num", num_pipe, ["age","salary"]),
        ("cat", cat_pipe, ["dept"]),
    ])
    Xt = ct.fit_transform(df)
    print(f"Ex28 — ColumnTransformer output shape: {Xt.shape}")
    print("       first row:", Xt[0].round(3))

def ex29():
    """Custom transformer (BaseEstimator + TransformerMixin)"""
    class LogTransformer(BaseEstimator, TransformerMixin):
        def fit(self, X, y=None):
            return self
        def transform(self, X):
            return np.log1p(np.abs(X))
    X = np.array([[1, 10], [100, 1000]])
    lt = LogTransformer()
    print("Ex29 — custom LogTransformer:\n", lt.fit_transform(X).round(3))

def ex30():
    """Pipeline: imputer + scaler"""
    X = np.array([[1.0, np.nan], [2.0, 3.0], [np.nan, 4.0], [4.0, 5.0]])
    pipe = Pipeline([("imp", SimpleImputer(strategy="mean")), ("sc", MinMaxScaler())])
    Xt = pipe.fit_transform(X)
    print("Ex30 — imputer+scaler pipeline:\n", Xt.round(3))

def ex31():
    """Feature union (parallel transforms)"""
    from sklearn.pipeline import FeatureUnion
    from sklearn.datasets import make_regression
    X, _ = make_regression(n_samples=20, n_features=4, random_state=0)
    fu = FeatureUnion([
        ("std", StandardScaler()),
        ("pca", PCA(n_components=2)),
    ])
    Xt = fu.fit_transform(X)
    print(f"Ex31 — FeatureUnion output shape: {Xt.shape} (4 std + 2 pca)")

def ex32():
    """Nested pipeline (poly + scale inside outer)"""
    from sklearn.datasets import make_regression
    X, y = make_regression(n_samples=50, n_features=2, random_state=1)
    inner = Pipeline([("poly", PolynomialFeatures(degree=2, include_bias=False)),
                      ("sc",   StandardScaler())])
    outer = Pipeline([("features", inner),
                      ("model",    LogisticRegression(max_iter=200))])
    # Fit on regression data converted to binary classification
    y_bin = (y > y.median()).astype(int)
    outer.fit(X, y_bin)
    print(f"Ex32 — nested pipeline score: {outer.score(X, y_bin):.3f}")

def ex33():
    """Handling imbalanced data (oversample minority concept)"""
    rng = np.random.default_rng(5)
    X_maj = rng.random((90, 2))
    X_min = rng.random((10, 2))
    y_maj = np.zeros(90)
    y_min = np.ones(10)
    # naive random oversample
    idx = rng.integers(0, 10, 90)
    X_min_over = X_min[idx]
    y_min_over = y_min[idx]
    X_bal = np.vstack([X_maj, X_min_over])
    y_bal = np.concatenate([y_maj, y_min_over])
    print(f"Ex33 — oversampled: class counts {np.bincount(y_bal.astype(int))}")

def ex34():
    """Feature selection in pipeline (VarianceThreshold)"""
    from sklearn.datasets import make_classification
    X, y = make_classification(n_samples=100, n_features=10, random_state=2)
    X[:, 0] = 0   # zero-variance feature
    pipe = Pipeline([("vt", VarianceThreshold(threshold=0.0)), ("sc", StandardScaler())])
    Xt = pipe.fit_transform(X)
    print(f"Ex34 — feature selection in pipeline: {X.shape[1]} → {Xt.shape[1]} features")

def ex35():
    """Preprocessing for text + numeric mixed"""
    df = pd.DataFrame({"text": ["great product","bad quality","amazing"], "rating": [5, 1, 4]})
    df["text_len"] = df["text"].str.len()
    df["word_count"] = df["text"].str.split().str.len()
    num_cols = ["rating","text_len","word_count"]
    scaler = StandardScaler()
    Xt = scaler.fit_transform(df[num_cols])
    print("Ex35 — text+numeric preprocessing:\n", Xt.round(3))

def ex36():
    """Save / load pipeline with joblib"""
    import tempfile, os
    try:
        import joblib
    except ImportError:
        print("Ex36 — joblib not available"); return
    pipe = Pipeline([("imp", SimpleImputer()), ("sc", StandardScaler())])
    X = np.array([[1.0, 2.0], [3.0, np.nan], [np.nan, 4.0]])
    pipe.fit(X)
    with tempfile.NamedTemporaryFile(suffix=".pkl", delete=False) as f:
        path = f.name
    try:
        joblib.dump(pipe, path)
        pipe2 = joblib.load(path)
        print("Ex36 — saved/loaded pipeline, transform matches:",
              np.allclose(pipe.transform(X), pipe2.transform(X)))
    finally:
        os.unlink(path)

def ex37():
    """Pipeline with cross-validation"""
    from sklearn.datasets import make_classification
    from sklearn.linear_model import LogisticRegression
    X, y = make_classification(n_samples=200, n_features=8, random_state=3)
    pipe = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=200))])
    scores = cross_val_score(pipe, X, y, cv=5, scoring="accuracy")
    print(f"Ex37 — pipeline CV scores: {scores.round(3)} | mean: {scores.mean():.3f}")

def ex38():
    """Preprocessing audit report"""
    df = pd.DataFrame({
        "a": [1, np.nan, 3, np.nan, 5],
        "b": [10, 20, 20, 30, 10],
        "c": ["x", "y", "x", None, "z"],
    })
    report = {
        "shape": df.shape,
        "missing_pct": (df.isna().sum() / len(df) * 100).to_dict(),
        "duplicates": int(df.duplicated().sum()),
        "dtypes": df.dtypes.astype(str).to_dict(),
    }
    print("Ex38 — preprocessing audit:")
    for k, v in report.items():
        print(f"       {k}: {v}")

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Automated outlier detection (IQR + z-score)"""
    rng = np.random.default_rng(0)
    data = np.concatenate([rng.normal(0, 1, 100), [10, -10, 15]])
    # IQR
    Q1, Q3 = np.percentile(data, [25, 75])
    iqr_mask = (data < Q1 - 1.5*(Q3-Q1)) | (data > Q3 + 1.5*(Q3-Q1))
    # Z-score
    z = np.abs((data - data.mean()) / data.std())
    z_mask = z > 3
    print(f"Ex39 — IQR outliers: {iqr_mask.sum()} | z-score outliers: {z_mask.sum()}")

def ex40():
    """Feature importance-based selection"""
    from sklearn.datasets import make_classification
    from sklearn.ensemble import RandomForestClassifier
    X, y = make_classification(n_samples=200, n_features=10, n_informative=4, random_state=0)
    rf = RandomForestClassifier(n_estimators=50, random_state=0).fit(X, y)
    sel = SelectFromModel(rf, prefit=True, threshold="mean")
    Xs = sel.transform(X)
    print(f"Ex40 — feature importance selection: {X.shape[1]} → {Xs.shape[1]} features")

def ex41():
    """Recursive feature elimination"""
    from sklearn.feature_selection import RFE
    from sklearn.linear_model import LogisticRegression
    from sklearn.datasets import make_classification
    X, y = make_classification(n_samples=150, n_features=8, n_informative=4, random_state=1)
    rfe = RFE(LogisticRegression(max_iter=300), n_features_to_select=4)
    rfe.fit(X, y)
    print(f"Ex41 — RFE selected features: {rfe.support_} | ranking: {rfe.ranking_}")

def ex42():
    """Variance threshold"""
    X = np.array([[0,1,2],[0,3,4],[0,5,6],[0,2,1]], dtype=float)
    vt = VarianceThreshold(threshold=0.5)
    Xt = vt.fit_transform(X)
    print(f"Ex42 — VarianceThreshold: {X.shape[1]} → {Xt.shape[1]} features (removed col 0 with var=0)")

def ex43():
    """Correlation-based feature removal"""
    rng = np.random.default_rng(2)
    df = pd.DataFrame(rng.random((100, 5)), columns=[f"f{i}" for i in range(5)])
    df["f5"] = df["f0"] * 2 + rng.random(100) * 0.01   # highly correlated with f0
    corr = df.corr().abs()
    upper = corr.where(np.triu(np.ones(corr.shape), k=1).astype(bool))
    to_drop = [col for col in upper.columns if any(upper[col] > 0.95)]
    df_reduced = df.drop(columns=to_drop)
    print(f"Ex43 — correlation removal: dropped {to_drop}, shape {df.shape} → {df_reduced.shape}")

def ex44():
    """PCA in preprocessing"""
    from sklearn.datasets import make_classification
    X, y = make_classification(n_samples=200, n_features=10, random_state=0)
    pipe = Pipeline([("sc", StandardScaler()), ("pca", PCA(n_components=5))])
    Xt = pipe.fit_transform(X)
    explained = pipe["pca"].explained_variance_ratio_
    print(f"Ex44 — PCA in pipeline: {X.shape[1]} → {Xt.shape[1]} dims | "
          f"explained var: {explained.round(3)} | total: {explained.sum():.3f}")

def ex45():
    """Missing value pattern analysis"""
    rng = np.random.default_rng(4)
    df = pd.DataFrame(rng.random((8, 4)), columns=["A","B","C","D"])
    df.iloc[0, 0] = np.nan; df.iloc[2, 1] = np.nan
    df.iloc[4, 0] = np.nan; df.iloc[4, 1] = np.nan
    missing_pattern = df.isna().astype(int)
    print("Ex45 — missing value pattern matrix:\n", missing_pattern.to_string())
    print("       co-missing A+B:", int((df["A"].isna() & df["B"].isna()).sum()))

def ex46():
    """Data leakage detection (target stats before split)"""
    rng = np.random.default_rng(7)
    df = pd.DataFrame({"x": rng.random(100), "y": rng.integers(0, 2, 100)})
    # LEAKY: compute target mean on full dataset before split
    df["leaky_feature"] = df.groupby("y")["x"].transform("mean")
    X_train, X_test, y_train, y_test = train_test_split(
        df[["x","leaky_feature"]], df["y"], test_size=0.2, random_state=0)
    # SAFE: compute only on train, map to test
    train_df = X_train.copy(); train_df["y"] = y_train.values
    mean_map = train_df.groupby("y")["x"].mean()
    X_test_safe = X_test[["x"]].copy()
    X_test_safe["safe_target_enc"] = y_test.map(mean_map)
    print(f"Ex46 — leakage demo: leaky feature in train/test has identical means = "
          f"{X_train['leaky_feature'].mean():.3f} vs {X_test['leaky_feature'].mean():.3f}")

def ex47():
    """Production-safe transformer with validation"""
    class SafeScaler(BaseEstimator, TransformerMixin):
        def fit(self, X, y=None):
            self.mean_ = np.nanmean(X, axis=0)
            self.std_  = np.nanstd(X, axis=0)
            self.std_[self.std_ == 0] = 1.0   # avoid div by zero
            return self
        def transform(self, X):
            return (X - self.mean_) / self.std_
    X_train = np.array([[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]])
    X_test  = np.array([[2.0, 3.0], [4.0, 5.0]])
    sc = SafeScaler().fit(X_train)
    print("Ex47 — SafeScaler train:\n", sc.transform(X_train).round(3))
    print("       SafeScaler test:\n",  sc.transform(X_test).round(3))

def ex48():
    """Memory-efficient preprocessing (dtypes optimization)"""
    df = pd.DataFrame({
        "id":    np.arange(1000, dtype=np.int64),
        "score": np.random.default_rng(0).random(1000).astype(np.float64),
        "label": np.random.default_rng(0).integers(0, 3, 1000).astype(np.int64),
    })
    mem_before = df.memory_usage(deep=True).sum()
    df["id"]    = df["id"].astype(np.int32)
    df["score"] = df["score"].astype(np.float32)
    df["label"] = df["label"].astype(np.int8)
    mem_after = df.memory_usage(deep=True).sum()
    print(f"Ex48 — memory: {mem_before} B → {mem_after} B | reduction: {1-mem_after/mem_before:.1%}")

def ex49():
    """Preprocessing benchmark (time comparison)"""
    import time
    from sklearn.datasets import make_classification
    X, _ = make_classification(n_samples=10000, n_features=20, random_state=0)
    X_with_nan = X.copy(); X_with_nan[::10, :3] = np.nan

    t0 = time.perf_counter()
    pipe = Pipeline([("imp", SimpleImputer()), ("sc", StandardScaler()), ("pca", PCA(n_components=10))])
    pipe.fit_transform(X_with_nan)
    t1 = time.perf_counter()
    print(f"Ex49 — preprocessing pipeline on (10000,20): {(t1-t0)*1000:.1f}ms")

def ex50():
    """Full preprocessing best-practices checklist"""
    steps = [
        ("1. Check for duplicates",             True),
        ("2. Analyze missing value patterns",   True),
        ("3. Detect and handle outliers",        True),
        ("4. Split BEFORE fitting any scaler",  True),
        ("5. Use pipelines to prevent leakage", True),
        ("6. Encode categoricals appropriately",True),
        ("7. Scale features for distance models",True),
        ("8. Validate transformed distributions",True),
        ("9. Persist fitted transformers",       True),
        ("10. Monitor drift in production",      True),
    ]
    print("Ex50 — Preprocessing best-practices checklist:")
    for step, done in steps:
        print(f"       [{'x' if done else ' '}] {step}")


def main():
    print("=" * 60)
    print("Examples 1.2 — Data Preprocessing")
    print("=" * 60)

    print("\n─── BASIC (1–13) ───")
    ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07()
    ex08(); ex09(); ex10(); ex11(); ex12(); ex13()

    print("\n─── INTERMEDIATE (14–26) ───")
    ex14(); ex15(); ex16(); ex17(); ex18(); ex19(); ex20()
    ex21(); ex22(); ex23(); ex24(); ex25(); ex26()

    print("\n─── NESTED (27–38) ───")
    ex27(); ex28(); ex29(); ex30(); ex31(); ex32(); ex33()
    ex34(); ex35(); ex36(); ex37(); ex38()

    print("\n─── ADVANCED (39–50) ───")
    ex39(); ex40(); ex41(); ex42(); ex43(); ex44(); ex45()
    ex46(); ex47(); ex48(); ex49(); ex50()

if __name__ == "__main__":
    main()
