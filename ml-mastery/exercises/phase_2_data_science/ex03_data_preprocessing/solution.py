# ============================================================
# Solution 2.3 — Data Preprocessing
# ============================================================

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.linear_model import LogisticRegression
import joblib
import os
import tempfile
from typing import Tuple


def standard_scale(X_train: np.ndarray, X_test: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    return X_train_scaled, X_test_scaled


def minmax_scale(X_train: np.ndarray, X_test: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    scaler = MinMaxScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    return X_train_scaled, X_test_scaled


def robust_scale(X_train: np.ndarray, X_test: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    scaler = RobustScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    return X_train_scaled, X_test_scaled


def impute_mean(X_train: np.ndarray, X_test: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    imputer = SimpleImputer(strategy="mean")
    X_train_imp = imputer.fit_transform(X_train)
    X_test_imp = imputer.transform(X_test)
    return X_train_imp, X_test_imp


def impute_median(X_train: np.ndarray, X_test: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    imputer = SimpleImputer(strategy="median")
    X_train_imp = imputer.fit_transform(X_train)
    X_test_imp = imputer.transform(X_test)
    return X_train_imp, X_test_imp


def impute_most_frequent(X_train: np.ndarray, X_test: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    imputer = SimpleImputer(strategy="most_frequent")
    X_train_imp = imputer.fit_transform(X_train)
    X_test_imp = imputer.transform(X_test)
    return X_train_imp, X_test_imp


def clip_iqr_outliers(X: pd.DataFrame) -> pd.DataFrame:
    X = X.copy()
    for col in X.select_dtypes(include=[np.number]).columns:
        q1 = X[col].quantile(0.25)
        q3 = X[col].quantile(0.75)
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        X[col] = X[col].clip(lower=lower, upper=upper)
    return X


def remove_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    return df.drop_duplicates().reset_index(drop=True)


def split_data(X, y, test_size: float = 0.2, random_state: int = 42):
    return train_test_split(X, y, test_size=test_size, random_state=random_state)


def stratified_split(X, y, test_size: float = 0.2, random_state: int = 42):
    return train_test_split(X, y, test_size=test_size, random_state=random_state, stratify=y)


def build_column_transformer(X_train: pd.DataFrame, numeric_cols: list, cat_cols: list):
    from sklearn.preprocessing import OneHotEncoder
    ct = ColumnTransformer(transformers=[
        ("num", StandardScaler(), numeric_cols),
        ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
    ])
    ct.fit(X_train)
    return ct


def build_pipeline(X_train: np.ndarray, y_train: np.ndarray):
    pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="mean")),
        ("scaler",  StandardScaler()),
        ("clf",     LogisticRegression(max_iter=200, random_state=42)),
    ])
    pipe.fit(X_train, y_train)
    return pipe


class ClipTransformer(BaseEstimator, TransformerMixin):
    def __init__(self, lower: float = -3.0, upper: float = 3.0):
        self.lower = lower
        self.upper = upper

    def fit(self, X, y=None):
        return self

    def transform(self, X, y=None):
        return np.clip(X, self.lower, self.upper)


def validate_data(df: pd.DataFrame, schema: dict) -> list:
    errors = []
    for col, rules in schema.items():
        if col not in df.columns:
            errors.append(f"Column '{col}' missing from DataFrame")
            continue
        series = df[col]
        # Nullable check
        if not rules.get("nullable", True) and series.isnull().any():
            n = series.isnull().sum()
            errors.append(f"Column '{col}' has {n} NaN values (not nullable)")
        # Range checks (skip NaN rows)
        non_null = series.dropna()
        if "min" in rules and (non_null < rules["min"]).any():
            errors.append(f"Column '{col}' has values below min={rules['min']}")
        if "max" in rules and (non_null > rules["max"]).any():
            errors.append(f"Column '{col}' has values above max={rules['max']}")
    return errors


def save_load_pipeline(pipeline, filepath: str):
    joblib.dump(pipeline, filepath)
    loaded = joblib.load(filepath)
    return loaded


def main():
    print("=== Solution 2.3: Data Preprocessing ===\n")

    np.random.seed(42)
    X = np.random.randn(100, 4)
    y = (X[:, 0] > 0).astype(int)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    Xtr_std, Xte_std = standard_scale(X_train, X_test)
    print("Result 1 — StandardScaler train mean:", np.round(Xtr_std.mean(axis=0), 4))

    Xtr_mm, Xte_mm = minmax_scale(X_train, X_test)
    print("Result 2 — MinMaxScaler train min/max:", round(Xtr_mm.min(), 4), round(Xtr_mm.max(), 4))

    Xtr_rob, _ = robust_scale(X_train, X_test)
    print("Result 3 — RobustScaler shape:", Xtr_rob.shape)

    X_nan = X_train.copy()
    X_nan[0, 0] = np.nan
    X_nan[5, 2] = np.nan
    X_test_nan = X_test.copy()
    X_test_nan[1, 1] = np.nan

    Xtr_m, _ = impute_mean(X_nan, X_test_nan)
    print("Result 4 — Impute mean NaN count:", int(np.isnan(Xtr_m).sum()))

    Xtr_med, _ = impute_median(X_nan, X_test_nan)
    print("Result 5 — Impute median NaN count:", int(np.isnan(Xtr_med).sum()))

    Xtr_mf, _ = impute_most_frequent(X_nan, X_test_nan)
    print("Result 6 — Impute most_freq NaN count:", int(np.isnan(Xtr_mf).sum()))

    df_outliers = pd.DataFrame({"a": [1, 2, 3, 100, 4, 5], "b": [10, 20, 15, 18, -50, 12]}, dtype=float)
    print("Result 7 — Clip IQR:\n", clip_iqr_outliers(df_outliers).to_string())

    df_dup = pd.DataFrame({"x": [1,2,1,3], "y": [4,5,4,6]})
    print("Result 8 — Remove dupes:", remove_duplicates(df_dup).shape)

    Xtr, Xte, ytr, yte = split_data(X, y)
    print("Result 9 — Split shapes:", Xtr.shape, Xte.shape)

    Xtr_s, Xte_s, ytr_s, yte_s = stratified_split(X, y)
    print("Result 10 — Stratified class counts train/test:", np.bincount(ytr_s), np.bincount(yte_s))

    df_ct = pd.DataFrame({
        "num1": [1.0, 2.0, 3.0, 4.0],
        "num2": [5.0, 6.0, 7.0, 8.0],
        "cat1": ["a", "b", "a", "c"],
    })
    ct = build_column_transformer(df_ct, ["num1","num2"], ["cat1"])
    print("Result 11 — ColumnTransformer output shape:", ct.transform(df_ct).shape)

    pipe = build_pipeline(X_train, y_train)
    print("Result 12 — Pipeline accuracy:", round(pipe.score(X_test, y_test), 4))

    clip_t = ClipTransformer(-1, 1)
    clipped = clip_t.fit_transform(X_train)
    print("Result 13 — Clip transformer min/max:", round(clipped.min(), 4), round(clipped.max(), 4))

    df_val = pd.DataFrame({"age": [25, -5, 200], "score": [0.5, np.nan, 0.8]})
    schema = {
        "age":   {"dtype": "int64", "min": 0, "max": 120, "nullable": False},
        "score": {"dtype": "float64", "min": 0.0, "max": 1.0, "nullable": False},
    }
    errors = validate_data(df_val, schema)
    print("Result 14 — Validation errors:")
    for e in errors:
        print("  ", e)

    pipe2 = build_pipeline(X_train, y_train)
    tmp_pipe = os.path.join(tempfile.gettempdir(), "test_pipe.pkl")
    loaded = save_load_pipeline(pipe2, tmp_pipe)
    print("Result 15 — Loaded pipeline accuracy:", round(loaded.score(X_test, y_test), 4))


if __name__ == "__main__":
    main()
