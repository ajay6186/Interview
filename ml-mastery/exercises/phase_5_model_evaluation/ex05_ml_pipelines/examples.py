# ============================================================
# Examples 5.5 — ML Pipelines (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import pandas as pd
from sklearn.datasets import make_classification
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, OneHotEncoder, MinMaxScaler
from sklearn.impute import SimpleImputer
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import (cross_val_score, GridSearchCV,
                                      train_test_split, cross_val_predict)
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib
import os
import tempfile

np.random.seed(42)
X_raw, y_raw = make_classification(n_samples=300, n_features=10, random_state=42)
X_tr, X_te, y_tr, y_te = train_test_split(X_raw, y_raw, test_size=0.2, random_state=42)

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Simple two-step pipeline: scaler → classifier"""
    pipe = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    pipe.fit(X_tr, y_tr)
    print("Ex01 — accuracy:", round(float(pipe.score(X_te, y_te)), 4))

def ex02():
    """Three-step pipeline: imputer → scaler → classifier"""
    X_nan = X_tr.copy().astype(float)
    X_nan[0, 0] = np.nan; X_nan[5, 2] = np.nan
    pipe = Pipeline([
        ("imp", SimpleImputer(strategy="mean")),
        ("sc",  StandardScaler()),
        ("clf", LogisticRegression(max_iter=1000)),
    ])
    pipe.fit(X_nan, y_tr)
    print("Ex02 — imputer+scaler accuracy:", round(float(pipe.score(X_te, y_te)), 4))

def ex03():
    """Pipeline with feature selection"""
    pipe = Pipeline([
        ("sel", SelectKBest(f_classif, k=5)),
        ("clf", LogisticRegression(max_iter=1000)),
    ])
    pipe.fit(X_tr, y_tr)
    selected = pipe.named_steps["sel"].get_support(indices=True).tolist()
    print("Ex03 — selected features:", selected,
          "| accuracy:", round(float(pipe.score(X_te, y_te)), 4))

def ex04():
    """Access pipeline steps by name"""
    pipe = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    pipe.fit(X_tr, y_tr)
    clf = pipe.named_steps["clf"]
    print("Ex04 — classifier:", type(clf).__name__,
          "| coef shape:", clf.coef_.shape)

def ex05():
    """Pipeline predict and predict_proba"""
    pipe = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    pipe.fit(X_tr, y_tr)
    preds = pipe.predict(X_te)
    probas = pipe.predict_proba(X_te)[:, 1]
    print("Ex05 — preds[:5]:", preds[:5].tolist(),
          "| proba[:5]:", np.round(probas[:5], 4).tolist())

def ex06():
    """Pipeline cross-validation"""
    pipe = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    sc = cross_val_score(pipe, X_raw, y_raw, cv=5, scoring="accuracy")
    print("Ex06 — CV mean:", round(sc.mean(), 4), "| std:", round(sc.std(), 4))

def ex07():
    """MinMaxScaler pipeline"""
    pipe = Pipeline([("sc", MinMaxScaler()), ("clf", LogisticRegression(max_iter=1000))])
    pipe.fit(X_tr, y_tr)
    X_trans = pipe.named_steps["sc"].transform(X_tr)
    print("Ex07 — MinMax range: [{:.4f}, {:.4f}]".format(X_trans.min(), X_trans.max()),
          "| accuracy:", round(float(pipe.score(X_te, y_te)), 4))

def ex08():
    """Pipeline with RandomForest (no scaling needed)"""
    pipe = Pipeline([("clf", RandomForestClassifier(n_estimators=50, random_state=42))])
    pipe.fit(X_tr, y_tr)
    print("Ex08 — RF pipeline accuracy:", round(float(pipe.score(X_te, y_te)), 4))

def ex09():
    """Serialize and reload a pipeline"""
    pipe = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    pipe.fit(X_tr, y_tr)
    path = os.path.join(tempfile.gettempdir(), "ex09_pipe.joblib")
    joblib.dump(pipe, path)
    loaded = joblib.load(path)
    preds = loaded.predict(X_te)
    print("Ex09 — loaded accuracy:", round(float(accuracy_score(y_te, preds)), 4),
          "| serialized to:", os.path.basename(path))

def ex10():
    """ColumnTransformer: scale numeric, encode categorical"""
    df = pd.DataFrame(X_raw[:, :3], columns=["n1", "n2", "n3"])
    df["cat"] = np.where(y_raw == 0, "A", "B")
    ct = ColumnTransformer([
        ("num", StandardScaler(), ["n1", "n2", "n3"]),
        ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), ["cat"]),
    ])
    ct.fit(df)
    out = ct.transform(df)
    print("Ex10 — ColumnTransformer output shape:", out.shape)

def ex11():
    """Pipeline visualisation: list steps"""
    pipe = Pipeline([
        ("imp", SimpleImputer(strategy="mean")),
        ("sc",  StandardScaler()),
        ("sel", SelectKBest(f_classif, k=5)),
        ("clf", LogisticRegression(max_iter=1000)),
    ])
    steps = [(name, type(step).__name__) for name, step in pipe.steps]
    for i, (name, cls) in enumerate(steps):
        print(f"Ex11 — Step {i}: {name} ({cls})")

def ex12():
    """Pipeline GridSearchCV: tune C"""
    pipe = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    gs = GridSearchCV(pipe, {"clf__C": [0.01, 0.1, 1, 10]}, cv=5, scoring="accuracy")
    gs.fit(X_raw, y_raw)
    print("Ex12 — best C:", gs.best_params_["clf__C"],
          "| best CV score:", round(gs.best_score_, 4))

def ex13():
    """FeatureUnion: concatenate scaled + selected features"""
    union = FeatureUnion([
        ("sc",  StandardScaler()),
        ("sel", SelectKBest(f_classif, k=4)),
    ])
    X_union = union.fit_transform(X_raw, y_raw)
    print("Ex13 — FeatureUnion shape:", X_union.shape)

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Full pipeline with mixed types: numeric + categorical"""
    from sklearn.pipeline import Pipeline
    num_pipe = Pipeline([
        ("imp", SimpleImputer(strategy="mean")),
        ("sc",  StandardScaler()),
    ])
    cat_pipe = Pipeline([
        ("imp", SimpleImputer(strategy="most_frequent")),
        ("enc", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])
    df = pd.DataFrame(X_raw[:, :3], columns=["n1", "n2", "n3"])
    df["cat"] = np.where(y_raw == 0, "A", "B")
    preprocessor = ColumnTransformer([("num", num_pipe, ["n1","n2","n3"]),
                                        ("cat", cat_pipe, ["cat"])])
    pipe = Pipeline([("pre", preprocessor), ("clf", LogisticRegression(max_iter=1000))])
    df_tr = df.iloc[:240]; df_te = df.iloc[240:]
    y_tr2 = y_raw[:240]; y_te2 = y_raw[240:]
    pipe.fit(df_tr, y_tr2)
    print("Ex14 — full mixed pipeline accuracy:", round(float(pipe.score(df_te, y_te2)), 4))

def ex15():
    """Custom transformer: ClipTransformer"""
    class ClipTransformer(BaseEstimator, TransformerMixin):
        def __init__(self, lower=-3.0, upper=3.0):
            self.lower = lower
            self.upper = upper
        def fit(self, X, y=None):
            return self
        def transform(self, X):
            return np.clip(X, self.lower, self.upper)
    pipe = Pipeline([
        ("clip", ClipTransformer(lower=-2.0, upper=2.0)),
        ("sc",   StandardScaler()),
        ("clf",  LogisticRegression(max_iter=1000)),
    ])
    pipe.fit(X_tr, y_tr)
    print("Ex15 — clip pipeline accuracy:", round(float(pipe.score(X_te, y_te)), 4))

def ex16():
    """Custom transformer: LogTransformer (for skewed features)"""
    class LogTransformer(BaseEstimator, TransformerMixin):
        def fit(self, X, y=None):
            return self
        def transform(self, X):
            return np.log1p(np.abs(X)) * np.sign(X)
    pipe = Pipeline([
        ("log", LogTransformer()),
        ("sc",  StandardScaler()),
        ("clf", LogisticRegression(max_iter=1000)),
    ])
    pipe.fit(X_tr, y_tr)
    print("Ex16 — log-transform pipeline accuracy:", round(float(pipe.score(X_te, y_te)), 4))

def ex17():
    """Pipeline with interaction features (PolynomialFeatures)"""
    from sklearn.preprocessing import PolynomialFeatures
    pipe = Pipeline([
        ("sc",   StandardScaler()),
        ("poly", PolynomialFeatures(degree=2, include_bias=False, interaction_only=True)),
        ("sel",  SelectKBest(f_classif, k=10)),
        ("clf",  LogisticRegression(max_iter=1000, C=0.1)),
    ])
    pipe.fit(X_tr, y_tr)
    print("Ex17 — poly interaction pipeline accuracy:", round(float(pipe.score(X_te, y_te)), 4))

def ex18():
    """Text + numeric pipeline"""
    texts   = ["good quality product", "bad item", "excellent service",
                "terrible experience", "average product"]
    numeric = np.array([[1.0], [5.0], [2.0], [4.0], [3.0]])
    tfidf   = TfidfVectorizer()
    text_features  = tfidf.fit_transform(texts).toarray()
    numeric_scaled = StandardScaler().fit_transform(numeric)
    combined = np.hstack([text_features, numeric_scaled])
    print("Ex18 — text+numeric combined shape:", combined.shape)

def ex19():
    """Input validation step in pipeline"""
    class ValidatorTransformer(BaseEstimator, TransformerMixin):
        def __init__(self, expected_features):
            self.expected_features = expected_features
        def fit(self, X, y=None):
            return self
        def transform(self, X):
            if X.shape[1] != self.expected_features:
                raise ValueError(f"Expected {self.expected_features} features, got {X.shape[1]}")
            return X
    pipe = Pipeline([
        ("val", ValidatorTransformer(expected_features=10)),
        ("sc",  StandardScaler()),
        ("clf", LogisticRegression(max_iter=1000)),
    ])
    pipe.fit(X_tr, y_tr)
    print("Ex19 — validated pipeline accuracy:", round(float(pipe.score(X_te, y_te)), 4))
    try:
        pipe.predict(X_te[:, :5])
    except ValueError as e:
        print("       caught validation error:", str(e))

def ex20():
    """Nested pipeline GridSearch: tune both scaler and classifier"""
    pipe = Pipeline([
        ("sc",  StandardScaler()),
        ("sel", SelectKBest(f_classif, k=5)),
        ("clf", LogisticRegression(max_iter=1000)),
    ])
    params = {
        "sel__k":   [3, 5, 8],
        "clf__C":   [0.1, 1, 10],
    }
    gs = GridSearchCV(pipe, params, cv=5, scoring="accuracy")
    gs.fit(X_raw, y_raw)
    print("Ex20 — best params:", gs.best_params_,
          "| best CV:", round(gs.best_score_, 4))

def ex21():
    """Pipeline set_params: change hyperparameter without rebuilding"""
    pipe = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    pipe.fit(X_tr, y_tr)
    acc_before = pipe.score(X_te, y_te)
    pipe.set_params(clf__C=0.1)
    pipe.fit(X_tr, y_tr)
    acc_after = pipe.score(X_te, y_te)
    print("Ex21 — acc before (C=1):", round(float(acc_before), 4),
          "| acc after (C=0.1):", round(float(acc_after), 4))

def ex22():
    """Pipeline cross_val_predict for out-of-fold predictions"""
    pipe = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    oof_preds = cross_val_predict(pipe, X_raw, y_raw, cv=5)
    oof_acc   = accuracy_score(y_raw, oof_preds)
    print("Ex22 — OOF accuracy:", round(oof_acc, 4))

def ex23():
    """Pipeline cloning for safety"""
    from sklearn.base import clone
    pipe = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    pipe.fit(X_tr, y_tr)
    cloned = clone(pipe)
    print("Ex23 — original fitted:", hasattr(pipe.named_steps["sc"], "mean_"),
          "| clone fitted:", hasattr(cloned.named_steps["sc"], "mean_"))

def ex24():
    """Multi-output pipeline with multiple scorers"""
    from sklearn.model_selection import cross_validate
    pipe = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    cv_res = cross_validate(pipe, X_raw, y_raw, cv=5,
                             scoring=["accuracy", "f1", "roc_auc"],
                             return_train_score=True)
    for metric in ["test_accuracy", "test_f1", "test_roc_auc"]:
        print(f"Ex24 — {metric}: {cv_res[metric].mean():.4f}")

def ex25():
    """Pipeline memory: cache expensive transformations"""
    from sklearn.pipeline import Pipeline
    tmpdir = tempfile.mkdtemp()
    pipe = Pipeline([
        ("imp", SimpleImputer(strategy="mean")),
        ("sc",  StandardScaler()),
        ("clf", LogisticRegression(max_iter=1000)),
    ], memory=tmpdir)
    pipe.fit(X_tr, y_tr)
    print("Ex25 — cached pipeline accuracy:", round(float(pipe.score(X_te, y_te)), 4),
          "| cache dir:", tmpdir)

def ex26():
    """Pipeline step replacement: swap classifier"""
    pipe = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    pipe.fit(X_tr, y_tr)
    lr_acc = pipe.score(X_te, y_te)
    # Swap to RF
    pipe.steps[-1] = ("clf", RandomForestClassifier(n_estimators=50, random_state=42))
    pipe.fit(X_tr, y_tr)
    rf_acc = pipe.score(X_te, y_te)
    print("Ex26 — LR acc:", round(float(lr_acc), 4), "| RF acc:", round(float(rf_acc), 4))

# ─── NESTED (27–38) ────────────────────────────────────────

def ex27():
    """PipelineBuilder class for dynamic pipeline construction"""
    class PipelineBuilder:
        def __init__(self):
            self._steps = []
        def add_imputer(self, strategy="mean"):
            self._steps.append(("imp", SimpleImputer(strategy=strategy)))
            return self
        def add_scaler(self, method="standard"):
            sc = StandardScaler() if method == "standard" else MinMaxScaler()
            self._steps.append(("sc", sc))
            return self
        def add_selector(self, k=5):
            self._steps.append(("sel", SelectKBest(f_classif, k=k)))
            return self
        def add_classifier(self, clf=None):
            self._steps.append(("clf", clf or LogisticRegression(max_iter=1000)))
            return self
        def build(self):
            return Pipeline(self._steps)
    pipe = (PipelineBuilder()
            .add_imputer()
            .add_scaler()
            .add_selector(k=6)
            .add_classifier()
            .build())
    pipe.fit(X_tr, y_tr)
    print("Ex27 — builder pipeline accuracy:", round(float(pipe.score(X_te, y_te)), 4))
    print("       steps:", [name for name, _ in pipe.steps])

def ex28():
    """Nested ColumnTransformer with sub-pipelines"""
    n, k = 200, 3
    X_df = pd.DataFrame(np.random.randn(n, 3), columns=["f1","f2","f3"])
    X_df["cat1"] = np.random.choice(["A","B","C"], n)
    X_df["cat2"] = np.random.choice(["X","Y"], n)
    y2  = np.random.randint(0, 2, n)
    num_cols = ["f1","f2","f3"]
    cat_cols = ["cat1","cat2"]
    num_pipe = Pipeline([("imp", SimpleImputer(strategy="mean")), ("sc", StandardScaler())])
    cat_pipe = Pipeline([("imp", SimpleImputer(strategy="most_frequent")),
                          ("enc", OneHotEncoder(handle_unknown="ignore", sparse_output=False))])
    pre = ColumnTransformer([("num", num_pipe, num_cols), ("cat", cat_pipe, cat_cols)])
    pipe = Pipeline([("pre", pre), ("clf", LogisticRegression(max_iter=1000))])
    pipe.fit(X_df, y2)
    print("Ex28 — nested CT pipeline accuracy:", round(float(pipe.score(X_df, y2)), 4))

def ex29():
    """Stacking via pipeline: base + meta"""
    base_pipe1 = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    base_pipe2 = Pipeline([("clf", RandomForestClassifier(n_estimators=30, random_state=42))])
    # OOF predictions
    oof1 = cross_val_predict(base_pipe1, X_tr, y_tr, cv=5, method="predict_proba")[:, 1]
    oof2 = cross_val_predict(base_pipe2, X_tr, y_tr, cv=5, method="predict_proba")[:, 1]
    meta_X_tr = np.column_stack([oof1, oof2])
    base_pipe1.fit(X_tr, y_tr); base_pipe2.fit(X_tr, y_tr)
    meta_X_te = np.column_stack([
        base_pipe1.predict_proba(X_te)[:, 1],
        base_pipe2.predict_proba(X_te)[:, 1],
    ])
    meta = LogisticRegression(max_iter=1000).fit(meta_X_tr, y_tr)
    print("Ex29 — stacking pipeline accuracy:", round(meta.score(meta_X_te, y_te), 4))

def ex30():
    """Pipeline with stateful transformer tracking fit statistics"""
    class StatsTransformer(BaseEstimator, TransformerMixin):
        def fit(self, X, y=None):
            self.mean_ = X.mean(axis=0)
            self.std_  = X.std(axis=0)
            return self
        def transform(self, X):
            return (X - self.mean_) / (self.std_ + 1e-8)
        def get_stats(self):
            return {"mean": np.round(self.mean_[:3], 4).tolist(),
                    "std":  np.round(self.std_[:3], 4).tolist()}
    pipe = Pipeline([("stats_sc", StatsTransformer()),
                      ("clf", LogisticRegression(max_iter=1000))])
    pipe.fit(X_tr, y_tr)
    print("Ex30 — custom stats:", pipe.named_steps["stats_sc"].get_stats())
    print("       accuracy:", round(float(pipe.score(X_te, y_te)), 4))

def ex31():
    """Pipeline for time series features"""
    class LagFeatureTransformer(BaseEstimator, TransformerMixin):
        def __init__(self, lags=3):
            self.lags = lags
        def fit(self, X, y=None):
            return self
        def transform(self, X):
            lag_features = [X]
            for lag in range(1, self.lags + 1):
                shifted = np.roll(X, lag, axis=0)
                shifted[:lag] = 0
                lag_features.append(shifted)
            return np.hstack(lag_features)
    n_samples = len(X_tr)
    X_1d = X_tr[:, :1]  # single feature for demo
    pipe = Pipeline([
        ("lags", LagFeatureTransformer(lags=2)),
        ("sc",   StandardScaler()),
        ("clf",  LogisticRegression(max_iter=1000)),
    ])
    pipe.fit(X_1d, y_tr)
    print("Ex31 — lag-feature pipeline output shape:",
          pipe.named_steps["lags"].transform(X_1d).shape)
    print("       accuracy:", round(float(pipe.score(X_te[:, :1], y_te)), 4))

def ex32():
    """Pipeline comparison with cross-validation DataFrame"""
    pipelines = {
        "sc+LR":    Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))]),
        "sc+sel+LR":Pipeline([("sc", StandardScaler()), ("sel", SelectKBest(f_classif, k=6)),
                               ("clf", LogisticRegression(max_iter=1000))]),
        "sc+RF":    Pipeline([("sc", StandardScaler()), ("clf", RandomForestClassifier(n_estimators=50, random_state=42))]),
    }
    rows = []
    for name, pipe in pipelines.items():
        sc = cross_val_score(pipe, X_raw, y_raw, cv=5)
        rows.append({"pipeline": name, "mean": round(sc.mean(), 4), "std": round(sc.std(), 4)})
    df = pd.DataFrame(rows).sort_values("mean", ascending=False)
    print("Ex32 —\n", df.to_string(index=False))

def ex33():
    """Incremental pipeline (partial_fit concept)"""
    from sklearn.linear_model import SGDClassifier
    pipe = Pipeline([("sc", StandardScaler()), ("clf", SGDClassifier(random_state=42, max_iter=1))])
    # Simulate mini-batch updates
    batch_size = 60
    for i in range(0, len(X_tr), batch_size):
        X_batch = X_tr[i:i+batch_size]
        y_batch = y_tr[i:i+batch_size]
        if i == 0:
            pipe.named_steps["sc"].fit(X_batch)
        X_scaled = pipe.named_steps["sc"].transform(X_batch)
        pipe.named_steps["clf"].partial_fit(X_scaled, y_batch, classes=[0, 1])
    X_te_sc = pipe.named_steps["sc"].transform(X_te)
    preds = pipe.named_steps["clf"].predict(X_te_sc)
    print("Ex33 — incremental pipeline accuracy:", round(accuracy_score(y_te, preds), 4))

def ex34():
    """Pipeline with SMOTE-like oversampling (manual)"""
    class BalanceSampler(BaseEstimator, TransformerMixin):
        def __init__(self, seed=42):
            self.seed = seed
        def fit(self, X, y=None):
            self.y_ = y
            return self
        def transform(self, X):
            return X
        def fit_resample(self, X, y):
            rng = np.random.default_rng(self.seed)
            classes, counts = np.unique(y, return_counts=True)
            max_count = counts.max()
            X_list, y_list = [X], [y]
            for cls, count in zip(classes, counts):
                if count < max_count:
                    n_over = max_count - count
                    idx = rng.choice(np.where(y == cls)[0], size=n_over, replace=True)
                    X_list.append(X[idx])
                    y_list.append(np.full(n_over, cls))
            return np.vstack(X_list), np.concatenate(y_list)
    sampler = BalanceSampler(seed=42)
    X_bal, y_bal = sampler.fit_resample(X_tr, y_tr)
    pipe = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    pipe.fit(X_bal, y_bal)
    print("Ex34 — balanced pipeline accuracy:", round(float(pipe.score(X_te, y_te)), 4),
          "| balanced train size:", len(y_bal))

def ex35():
    """FeatureUnion with multiple transformers and shape tracking"""
    from sklearn.decomposition import PCA
    union = FeatureUnion([
        ("sc",  StandardScaler()),
        ("pca", PCA(n_components=3)),
        ("sel", SelectKBest(f_classif, k=4)),
    ])
    X_union = union.fit_transform(X_raw, y_raw)
    print("Ex35 — FeatureUnion shape:", X_union.shape)
    # Build pipeline with union
    pipe = Pipeline([("union", union), ("clf", LogisticRegression(max_iter=1000))])
    sc = cross_val_score(pipe, X_raw, y_raw, cv=5).mean()
    print("       pipeline CV accuracy:", round(sc, 4))

def ex36():
    """Pipeline for multi-label prediction"""
    from sklearn.multioutput import MultiOutputClassifier
    y_multi = np.column_stack([y_raw, (y_raw + np.random.RandomState(0).randint(0,2,len(y_raw))) % 2])
    pipe = Pipeline([
        ("sc",   StandardScaler()),
        ("clf",  MultiOutputClassifier(LogisticRegression(max_iter=1000))),
    ])
    Xt, Xs, yt, ys = train_test_split(X_raw, y_multi, test_size=0.2, random_state=42)
    pipe.fit(Xt, yt)
    preds = pipe.predict(Xs)
    acc = np.mean(preds == ys)
    print("Ex36 — multi-label exact match:", round(float(np.mean(np.all(preds==ys, axis=1))), 4),
          "| element-wise acc:", round(float(acc), 4))

def ex37():
    """Pipeline metadata routing: pass sample_weight"""
    class WeightedScaler(BaseEstimator, TransformerMixin):
        def fit(self, X, y=None, sample_weight=None):
            self.mean_ = X.mean(axis=0)
            self.std_  = X.std(axis=0)
            return self
        def transform(self, X):
            return (X - self.mean_) / (self.std_ + 1e-8)
    pipe = Pipeline([
        ("sc",  WeightedScaler()),
        ("clf", LogisticRegression(max_iter=1000)),
    ])
    # Sample weights: upweight minority class
    weights = np.where(y_tr == 1, 2.0, 1.0)
    pipe.fit(X_tr, y_tr)  # WeightedScaler ignores weight here (for demo)
    print("Ex37 — weighted pipeline accuracy:", round(float(pipe.score(X_te, y_te)), 4))

def ex38():
    """Pipeline versioning and metadata"""
    import json
    pipe = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000, C=1.0))])
    pipe.fit(X_tr, y_tr)
    metadata = {
        "version":   "1.0.0",
        "steps":     [name for name, _ in pipe.steps],
        "params":    {name: step.get_params() for name, step in pipe.steps},
        "train_acc": round(float(pipe.score(X_tr, y_tr)), 4),
        "test_acc":  round(float(pipe.score(X_te, y_te)), 4),
    }
    path = os.path.join(tempfile.gettempdir(), "ex38_pipeline_metadata.json")
    with open(path, "w") as f:
        json.dump(metadata, f, indent=2, default=str)
    print("Ex38 — metadata version:", metadata["version"],
          "| test acc:", metadata["test_acc"])

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """AutoPipeline: auto-select scaler and classifier"""
    from sklearn.model_selection import train_test_split
    candidates = {
        "std+LR":   Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))]),
        "mm+LR":    Pipeline([("sc", MinMaxScaler()),   ("clf", LogisticRegression(max_iter=1000))]),
        "std+RF":   Pipeline([("sc", StandardScaler()), ("clf", RandomForestClassifier(n_estimators=50, random_state=42))]),
        "none+RF":  Pipeline([("clf", RandomForestClassifier(n_estimators=50, random_state=42))]),
    }
    best_name, best_sc = "", 0
    for name, pipe in candidates.items():
        sc = cross_val_score(pipe, X_raw, y_raw, cv=5).mean()
        if sc > best_sc:
            best_sc, best_name = sc, name
    winner = candidates[best_name]
    winner.fit(X_tr, y_tr)
    print("Ex39 — auto-selected:", best_name, "| CV:", round(float(best_sc), 4),
          "| test:", round(float(winner.score(X_te, y_te)), 4))

def ex40():
    """Pipeline monitoring: log transform shapes at each step"""
    class DebugTransformer(BaseEstimator, TransformerMixin):
        def __init__(self, name, log):
            self.name = name
            self.log  = log
        def fit(self, X, y=None):
            self.log.append({"step": self.name, "phase": "fit", "shape": X.shape})
            return self
        def transform(self, X):
            self.log.append({"step": self.name, "phase": "transform", "shape": X.shape})
            return X
    debug_log = []
    pipe = Pipeline([
        ("d1",  DebugTransformer("impute_check", debug_log)),
        ("imp", SimpleImputer(strategy="mean")),
        ("d2",  DebugTransformer("after_impute", debug_log)),
        ("sc",  StandardScaler()),
        ("d3",  DebugTransformer("after_scale",  debug_log)),
        ("clf", LogisticRegression(max_iter=1000)),
    ])
    pipe.fit(X_tr, y_tr)
    for entry in debug_log:
        print(f"Ex40 — [{entry['phase']}] {entry['step']}: shape={entry['shape']}")

def ex41():
    """Feature drift detection inside pipeline"""
    class DriftDetector(BaseEstimator, TransformerMixin):
        def fit(self, X, y=None):
            self.train_mean_ = X.mean(axis=0)
            self.train_std_  = X.std(axis=0)
            return self
        def transform(self, X, threshold=0.5):
            drift = np.abs(X.mean(axis=0) - self.train_mean_) / (self.train_std_ + 1e-8)
            drifted_features = np.where(drift > threshold)[0].tolist()
            if drifted_features:
                print(f"  Drift detected in features: {drifted_features}")
            return X
    pipe = Pipeline([
        ("drift", DriftDetector()),
        ("sc",    StandardScaler()),
        ("clf",   LogisticRegression(max_iter=1000)),
    ])
    pipe.fit(X_tr, y_tr)
    # Simulate drift by adding noise to test data
    X_drifted = X_te.copy()
    X_drifted[:, 0] += 5.0  # large shift in feature 0
    print("Ex41 — drift detection on shifted data:")
    pipe.named_steps["drift"].transform(X_drifted)
    print("       accuracy on drifted data:", round(float(pipe.score(X_drifted, y_te)), 4))

def ex42():
    """Pipeline A/B testing framework"""
    from sklearn.model_selection import train_test_split
    X_tr2, X_te2, y_tr2, y_te2 = train_test_split(X_raw, y_raw, test_size=0.3, random_state=0)
    pipe_a = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    pipe_b = Pipeline([("sc", StandardScaler()), ("sel", SelectKBest(f_classif, k=6)),
                        ("clf", LogisticRegression(max_iter=1000))])
    pipe_a.fit(X_tr2, y_tr2)
    pipe_b.fit(X_tr2, y_tr2)
    acc_a = pipe_a.score(X_te2, y_te2)
    acc_b = pipe_b.score(X_te2, y_te2)
    # McNemar-style: count disagreements
    pred_a = pipe_a.predict(X_te2)
    pred_b = pipe_b.predict(X_te2)
    agree = np.mean(pred_a == pred_b)
    print("Ex42 — A/B: pipeline_A acc:", round(float(acc_a), 4),
          "| pipeline_B acc:", round(float(acc_b), 4),
          "| agreement:", round(float(agree), 4))

def ex43():
    """Explainable pipeline: feature contributions via coefficients"""
    pipe = Pipeline([
        ("sc",  StandardScaler()),
        ("sel", SelectKBest(f_classif, k=5)),
        ("clf", LogisticRegression(max_iter=1000)),
    ])
    pipe.fit(X_tr, y_tr)
    selected_idx = pipe.named_steps["sel"].get_support(indices=True)
    coefs        = pipe.named_steps["clf"].coef_[0]
    feature_importance = sorted(zip(selected_idx.tolist(), np.abs(coefs).tolist()),
                                  key=lambda x: -x[1])
    print("Ex43 — feature importances (feature, |coef|):", feature_importance)

def ex44():
    """Pipeline for production: predict with latency measurement"""
    pipe = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    pipe.fit(X_tr, y_tr)
    import time
    times = []
    for x in X_te[:20]:
        t0 = time.perf_counter()
        pipe.predict(x.reshape(1, -1))
        times.append((time.perf_counter() - t0) * 1000)
    print("Ex44 — single-sample latency: mean={:.3f}ms max={:.3f}ms".format(
        float(np.mean(times)), float(np.max(times))))

def ex45():
    """Ensemble pipeline: combine multiple pipelines"""
    pipes = [
        Pipeline([("sc", StandardScaler()),   ("clf", LogisticRegression(max_iter=1000))]),
        Pipeline([("sc", MinMaxScaler()),      ("clf", LogisticRegression(max_iter=1000, C=0.1))]),
        Pipeline([("clf", RandomForestClassifier(n_estimators=50, random_state=42))]),
    ]
    for p in pipes:
        p.fit(X_tr, y_tr)
    probas = np.array([p.predict_proba(X_te)[:, 1] for p in pipes])
    avg_p  = probas.mean(axis=0)
    preds  = (avg_p >= 0.5).astype(int)
    print("Ex45 — ensemble of pipelines accuracy:", round(accuracy_score(y_te, preds), 4))

def ex46():
    """Dynamic feature engineering pipeline"""
    class AutoInteractionTransformer(BaseEstimator, TransformerMixin):
        def __init__(self, top_k=3):
            self.top_k = top_k
        def fit(self, X, y=None):
            # Select top-k correlated feature pairs
            n = X.shape[1]
            corr = np.corrcoef(X.T)
            pairs = []
            for i in range(n):
                for j in range(i+1, n):
                    pairs.append((i, j, abs(corr[i, j])))
            self.top_pairs_ = sorted(pairs, key=lambda x: -x[2])[:self.top_k]
            return self
        def transform(self, X):
            interactions = [X[:, i] * X[:, j] for i, j, _ in self.top_pairs_]
            return np.hstack([X] + [v.reshape(-1,1) for v in interactions])
    pipe = Pipeline([
        ("inter", AutoInteractionTransformer(top_k=3)),
        ("sc",    StandardScaler()),
        ("clf",   LogisticRegression(max_iter=1000, C=0.5)),
    ])
    pipe.fit(X_tr, y_tr)
    print("Ex46 — interaction pipeline shape:", pipe.named_steps["inter"].transform(X_tr).shape,
          "| accuracy:", round(float(pipe.score(X_te, y_te)), 4))

def ex47():
    """Uncertainty quantification via pipeline ensemble predictions"""
    rng = np.random.default_rng(42)
    pipes = [Pipeline([("sc", StandardScaler()),
                        ("clf", LogisticRegression(max_iter=1000, C=rng.uniform(0.5, 2.0)))])
             for _ in range(10)]
    for p in pipes:
        p.fit(X_tr, y_tr)
    proba_mat = np.array([p.predict_proba(X_te)[:, 1] for p in pipes])
    mean_p = proba_mat.mean(axis=0)
    std_p  = proba_mat.std(axis=0)
    preds  = (mean_p >= 0.5).astype(int)
    uncertain = (std_p > 0.1).sum()
    print("Ex47 — ensemble accuracy:", round(accuracy_score(y_te, preds), 4),
          "| uncertain samples (std>0.1):", uncertain)

def ex48():
    """Pipeline with custom scoring via predict_proba"""
    from sklearn.metrics import roc_auc_score
    pipe = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    sc_acc = cross_val_score(pipe, X_raw, y_raw, cv=5, scoring="accuracy")
    sc_auc = cross_val_score(pipe, X_raw, y_raw, cv=5, scoring="roc_auc")
    sc_f1  = cross_val_score(pipe, X_raw, y_raw, cv=5, scoring="f1")
    print("Ex48 — accuracy:", round(sc_acc.mean(), 4),
          "| AUC:", round(sc_auc.mean(), 4),
          "| F1:", round(sc_f1.mean(), 4))

def ex49():
    """Production pipeline checklist"""
    checklist = [
        "1. All transformers are stateless or fit only on train data (no data leakage).",
        "2. Pipeline serialised with joblib; version and sklearn version logged.",
        "3. Input schema validation: feature count, dtype, NaN policy defined.",
        "4. Drift monitoring: compare train distribution vs live data periodically.",
        "5. Retrain trigger: schedule or metric-based (accuracy drop > threshold).",
    ]
    for item in checklist:
        print("Ex49 —", item)

def ex50():
    """End-to-end production ML pipeline"""
    from sklearn.model_selection import GridSearchCV, train_test_split
    from sklearn.metrics import classification_report
    import json
    # 1. Data
    X_tr2, X_te2, y_tr2, y_te2 = train_test_split(X_raw, y_raw, test_size=0.2, random_state=42)
    # 2. Pipeline definition
    pipe = Pipeline([
        ("imp",  SimpleImputer(strategy="mean")),
        ("sc",   StandardScaler()),
        ("sel",  SelectKBest(f_classif, k=7)),
        ("clf",  LogisticRegression(max_iter=1000)),
    ])
    # 3. Hyperparameter search
    gs = GridSearchCV(pipe, {"clf__C": [0.1, 1, 10], "sel__k": [5, 7, 9]},
                       cv=5, scoring="accuracy", refit=True)
    gs.fit(X_tr2, y_tr2)
    # 4. Evaluate on test set
    best = gs.best_estimator_
    preds = best.predict(X_te2)
    test_acc = accuracy_score(y_te2, preds)
    # 5. Save + metadata
    path = os.path.join(tempfile.gettempdir(), "production_pipeline_v1.joblib")
    joblib.dump(best, path)
    metadata = {"best_params": gs.best_params_, "cv_score": round(gs.best_score_, 4),
                 "test_acc": round(test_acc, 4), "model_path": path}
    print("Ex50 — production pipeline metadata:", json.dumps(metadata, indent=2))


def main():
    print("=" * 60)
    print("Examples 5.5 — ML Pipelines")
    print("=" * 60)
    print("\n--- BASIC (1-13) ---")
    ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07()
    ex08(); ex09(); ex10(); ex11(); ex12(); ex13()
    print("\n--- INTERMEDIATE (14-26) ---")
    ex14(); ex15(); ex16(); ex17(); ex18(); ex19(); ex20()
    ex21(); ex22(); ex23(); ex24(); ex25(); ex26()
    print("\n--- NESTED (27-38) ---")
    ex27(); ex28(); ex29(); ex30(); ex31(); ex32(); ex33()
    ex34(); ex35(); ex36(); ex37(); ex38()
    print("\n--- ADVANCED (39-50) ---")
    ex39(); ex40(); ex41(); ex42(); ex43(); ex44(); ex45()
    ex46(); ex47(); ex48(); ex49(); ex50()

if __name__ == "__main__":
    main()
