# ============================================================
# Solution 5.5 — ML Pipelines
# ============================================================

import numpy as np
import pandas as pd
from sklearn.datasets import make_classification
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import cross_val_score, GridSearchCV, train_test_split
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.feature_extraction.text import TfidfVectorizer
import joblib
import os


def simple_pipeline(X_train, X_test, y_train, y_test) -> float:
    pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(max_iter=1000)),
    ])
    pipe.fit(X_train, y_train)
    return round(float(pipe.score(X_test, y_test)), 4)


def pipeline_with_imputer(X_train, X_test, y_train, y_test) -> float:
    pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="mean")),
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(max_iter=1000)),
    ])
    pipe.fit(X_train, y_train)
    return round(float(pipe.score(X_test, y_test)), 4)


def pipeline_with_feature_selection(X_train, X_test, y_train, y_test) -> tuple:
    pipe = Pipeline([
        ("selector", SelectKBest(f_classif, k=5)),
        ("clf", LogisticRegression(max_iter=1000)),
    ])
    pipe.fit(X_train, y_train)
    accuracy = round(float(pipe.score(X_test, y_test)), 4)
    selected = pipe.named_steps["selector"].get_support(indices=True).tolist()
    return (accuracy, selected)


def column_transformer(X_df: pd.DataFrame, num_cols: list, cat_cols: list):
    ct = ColumnTransformer([
        ("num", StandardScaler(), num_cols),
        ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_cols),
    ])
    ct.fit(X_df)
    return ct


def full_pipeline(X_train_df: pd.DataFrame, y_train, num_cols: list, cat_cols: list):
    numeric_transformer = Pipeline([
        ("imputer", SimpleImputer(strategy="mean")),
        ("scaler", StandardScaler()),
    ])
    categorical_transformer = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])
    preprocessor = ColumnTransformer([
        ("num", numeric_transformer, num_cols),
        ("cat", categorical_transformer, cat_cols),
    ])
    pipe = Pipeline([
        ("preprocessor", preprocessor),
        ("clf", LogisticRegression(max_iter=1000)),
    ])
    pipe.fit(X_train_df, y_train)
    return pipe


def pipeline_grid_search(X, y) -> tuple:
    pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(max_iter=1000)),
    ])
    gs = GridSearchCV(pipe, {"clf__C": [0.1, 1, 10]}, cv=5, scoring="accuracy")
    gs.fit(X, y)
    return (gs.best_params_, round(gs.best_score_, 4))


class ClipTransformer(BaseEstimator, TransformerMixin):
    def __init__(self, lower=-3.0, upper=3.0):
        self.lower = lower
        self.upper = upper

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        return np.clip(X, self.lower, self.upper)


def feature_union_pipeline(X, y) -> tuple:
    union = FeatureUnion([
        ("scaler", StandardScaler()),
        ("selector", SelectKBest(f_classif, k=5)),
    ])
    X_transformed = union.fit_transform(X, y)
    return X_transformed.shape


def inspect_pipeline(pipeline: Pipeline):
    return pipeline.named_steps["clf"]


def serialize_pipeline(pipeline: Pipeline, X_test, path: str) -> np.ndarray:
    joblib.dump(pipeline, path)
    loaded = joblib.load(path)
    return loaded.predict(X_test)


def pipeline_cross_val(X, y) -> tuple:
    pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(max_iter=1000)),
    ])
    scores = cross_val_score(pipe, X, y, cv=5, scoring="accuracy")
    return (round(float(scores.mean()), 4), round(float(scores.std()), 4))


def text_numeric_pipeline(texts: list, numeric: np.ndarray) -> tuple:
    from sklearn.compose import ColumnTransformer
    import scipy.sparse as sp

    tfidf = TfidfVectorizer()
    text_features = tfidf.fit_transform(texts).toarray()
    numeric_scaled = StandardScaler().fit_transform(numeric)
    combined = np.hstack([text_features, numeric_scaled])
    return combined.shape


def visualize_pipeline(pipeline: Pipeline) -> list:
    steps = [(name, type(step).__name__) for name, step in pipeline.steps]
    for i, (name, cls) in enumerate(steps):
        print(f"  Step {i}: {name} ({cls})")
    return steps


def validate_pipeline_input(X: np.ndarray, expected_features: int) -> tuple:
    errors = []
    if X.shape[1] != expected_features:
        errors.append(f"Expected {expected_features} features, got {X.shape[1]}.")
    all_nan_cols = np.where(np.all(np.isnan(X.astype(float)), axis=0))[0].tolist()
    if all_nan_cols:
        errors.append(f"All-NaN columns: {all_nan_cols}.")
    return (len(errors) == 0, errors)


def pipeline_versioning_strategy() -> list:
    return [
        "1. Tag pipeline versions with semantic versioning (v1.2.3) and commit hash.",
        "2. Serialize with joblib + record sklearn version and Python version in metadata.",
        "3. Store pipeline artifacts in a model registry (MLflow, SageMaker, Vertex AI).",
        "4. Maintain backward-compatible transformers; version new preprocessing separately.",
        "5. Automate regression tests: run old and new pipeline on held-out data, compare outputs.",
    ]


def main():
    print("=== Solution 5.5: ML Pipelines ===\n")

    np.random.seed(42)
    X, y = make_classification(n_samples=300, n_features=10, random_state=42)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Result 1  - Simple pipeline accuracy:", simple_pipeline(X_train, X_test, y_train, y_test))

    X_nan = X.copy().astype(float)
    rng = np.random.default_rng(42)
    row_idx = rng.integers(0, len(X), 20)
    col_idx = rng.integers(0, 10, 20)
    X_nan[row_idx, col_idx] = np.nan
    Xn_tr, Xn_te, yn_tr, yn_te = train_test_split(X_nan, y, test_size=0.2, random_state=42)
    print("Result 2  - Imputer pipeline accuracy:", pipeline_with_imputer(Xn_tr, Xn_te, yn_tr, yn_te))
    print("Result 3  - Feature selection pipeline:", pipeline_with_feature_selection(X_train, X_test, y_train, y_test))

    df = pd.DataFrame(X[:, :3], columns=["n1", "n2", "n3"])
    df["cat"] = np.where(y == 0, "A", "B")
    ct = column_transformer(df, ["n1", "n2", "n3"], ["cat"])
    print("Result 4  - ColumnTransformer output shape:", ct.transform(df).shape)

    df_train = pd.DataFrame(X_train[:, :3], columns=["n1", "n2", "n3"])
    df_train["cat"] = np.where(y_train == 0, "A", "B")
    fp = full_pipeline(df_train, y_train, ["n1", "n2", "n3"], ["cat"])
    df_test = pd.DataFrame(X_test[:, :3], columns=["n1", "n2", "n3"])
    df_test["cat"] = np.where(y_test == 0, "A", "B")
    print("Result 5  - Full pipeline accuracy:", round(float(fp.score(df_test, y_test)), 4))

    print("Result 6  - Pipeline GridSearch:", pipeline_grid_search(X, y))

    clip = ClipTransformer(lower=-2.0, upper=2.0)
    clip.fit(X)
    clipped = clip.transform(X)
    print("Result 7  - ClipTransformer: max={:.4f}, min={:.4f}".format(clipped.max(), clipped.min()))

    print("Result 8  - FeatureUnion shape:", feature_union_pipeline(X, y))

    pipe = Pipeline([("scaler", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    pipe.fit(X_train, y_train)
    print("Result 9  - Inspected clf:", inspect_pipeline(pipe))

    preds = serialize_pipeline(pipe, X_test, "/tmp/pipeline_sol55.joblib")
    print("Result 10 - Serialized predictions:", preds.shape, "| accuracy:", round((preds == y_test).mean(), 4))
    print("Result 11 - Pipeline CV:", pipeline_cross_val(X, y))

    texts = ["good product", "bad quality", "excellent", "terrible", "average"]
    numeric = np.array([[1.0], [2.0], [3.0], [4.0], [5.0]])
    print("Result 12 - Text+numeric pipeline shape:", text_numeric_pipeline(texts, numeric))

    print("Result 13 - Pipeline visualization:")
    visualize_pipeline(pipe)

    print("Result 14 - Validate input (correct):", validate_pipeline_input(X_test, 10))
    print("Result 14 - Validate input (wrong features):", validate_pipeline_input(X_test[:, :5], 10))
    print("Result 15 - Versioning strategy:")
    for item in pipeline_versioning_strategy():
        print(" ", item)


if __name__ == "__main__":
    main()
