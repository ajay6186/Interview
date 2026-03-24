# ============================================================
# Exercise 2.3 — Data Preprocessing
# ============================================================
# Topics:
#   • Scalers: Standard, MinMax, Robust
#   • Imputation: mean, median, most_frequent
#   • Outlier handling (clip to IQR bounds)
#   • Deduplication
#   • Train/test split (random and stratified)
#   • ColumnTransformer, Pipeline
#   • Custom transformer
#   • Data validation
#   • Pipeline save/load with joblib
# ============================================================

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler
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

# ---------------------------------------------------------------------------
# TODO 1: StandardScaler
# ---------------------------------------------------------------------------
# Fit StandardScaler on X_train, transform both X_train and X_test.
# Return (X_train_scaled, X_test_scaled).
# Expected: X_train_scaled.mean(axis=0) ≈ 0, std ≈ 1

def standard_scale(X_train: np.ndarray, X_test: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 2: MinMaxScaler
# ---------------------------------------------------------------------------
# Scale features to [0, 1]. Fit on X_train, transform both.
# Return (X_train_scaled, X_test_scaled).
# Expected: X_train_scaled.min() ≈ 0, max() ≈ 1

def minmax_scale(X_train: np.ndarray, X_test: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 3: RobustScaler
# ---------------------------------------------------------------------------
# Scale using median and IQR (robust to outliers). Fit on X_train, transform both.
# Return (X_train_scaled, X_test_scaled).

def robust_scale(X_train: np.ndarray, X_test: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 4: Impute Missing with Mean
# ---------------------------------------------------------------------------
# Replace NaN values with the column mean.
# Fit on X_train, transform both. Return (X_train_imp, X_test_imp).
# Expected: no NaN values in output

def impute_mean(X_train: np.ndarray, X_test: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    pass  # TODO: implement using SimpleImputer(strategy="mean")


# ---------------------------------------------------------------------------
# TODO 5: Impute Missing with Median
# ---------------------------------------------------------------------------
# Replace NaN values with column median. Fit on X_train, transform both.

def impute_median(X_train: np.ndarray, X_test: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    pass  # TODO: implement using SimpleImputer(strategy="median")


# ---------------------------------------------------------------------------
# TODO 6: Impute Missing with Most Frequent
# ---------------------------------------------------------------------------
# Replace NaN values with the most frequent value per column.
# Fit on X_train, transform both.

def impute_most_frequent(X_train: np.ndarray, X_test: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    pass  # TODO: implement using SimpleImputer(strategy="most_frequent")


# ---------------------------------------------------------------------------
# TODO 7: Clip Outliers to IQR Bounds
# ---------------------------------------------------------------------------
# For each column in X (DataFrame or array), clip values to [Q1-1.5*IQR, Q3+1.5*IQR].
# Return clipped DataFrame/array of same shape.
# Expected: no extreme outliers after clipping

def clip_iqr_outliers(X: pd.DataFrame) -> pd.DataFrame:
    pass  # TODO: implement (compute bounds per column, use df.clip)


# ---------------------------------------------------------------------------
# TODO 8: Remove Duplicate Rows
# ---------------------------------------------------------------------------
# Remove duplicate rows from DataFrame df and return the clean DataFrame.
# Expected: result has fewer or equal rows than input

def remove_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    pass  # TODO: implement using df.drop_duplicates()


# ---------------------------------------------------------------------------
# TODO 9: Train/Test Split
# ---------------------------------------------------------------------------
# Split X and y into train and test sets with given test_size and random_state.
# Return (X_train, X_test, y_train, y_test).
# Expected: standard sklearn train_test_split behavior

def split_data(X, y, test_size: float = 0.2, random_state: int = 42):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 10: Stratified Train/Test Split
# ---------------------------------------------------------------------------
# Split data while preserving the class distribution of y.
# Return (X_train, X_test, y_train, y_test).
# Expected: class proportions similar in train and test

def stratified_split(X, y, test_size: float = 0.2, random_state: int = 42):
    pass  # TODO: implement using train_test_split(stratify=y)


# ---------------------------------------------------------------------------
# TODO 11: ColumnTransformer
# ---------------------------------------------------------------------------
# Build a ColumnTransformer that:
#   - Applies StandardScaler to numeric_cols
#   - Applies OneHotEncoder(handle_unknown="ignore") to cat_cols
# Return the fitted ColumnTransformer after fitting on X_train.
# Expected: transformer.transform(X_test) works

def build_column_transformer(X_train: pd.DataFrame, numeric_cols: list, cat_cols: list):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 12: Full Sklearn Pipeline
# ---------------------------------------------------------------------------
# Build a Pipeline:
#   Step 1: SimpleImputer(strategy="mean")
#   Step 2: StandardScaler()
#   Step 3: LogisticRegression(max_iter=200)
# Fit on (X_train, y_train) and return the fitted pipeline.
# Expected: pipe.predict(X_test) works

def build_pipeline(X_train: np.ndarray, y_train: np.ndarray):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 13: Custom Transformer
# ---------------------------------------------------------------------------
# Implement a custom sklearn transformer that clips values to [lower, upper].
# Must inherit from BaseEstimator and TransformerMixin.
# fit() does nothing, transform() clips the data.
# Expected: ClipTransformer(-1, 1).fit_transform(X) clips all values to [-1,1]

class ClipTransformer(BaseEstimator, TransformerMixin):
    def __init__(self, lower: float = -3.0, upper: float = 3.0):
        pass  # TODO: store lower and upper

    def fit(self, X, y=None):
        pass  # TODO: return self

    def transform(self, X, y=None):
        pass  # TODO: return np.clip(X, self.lower, self.upper)


# ---------------------------------------------------------------------------
# TODO 14: Data Validation
# ---------------------------------------------------------------------------
# Validate a DataFrame against a schema dict:
#   schema = {"col_name": {"dtype": "float64", "min": 0, "max": 100, "nullable": False}}
# Return a list of validation error strings (empty list if valid).
# Expected: validate_data(df, schema) → [] or ["col X has NaN", ...]

def validate_data(df: pd.DataFrame, schema: dict) -> list:
    pass  # TODO: implement — check dtype, range, and nullability


# ---------------------------------------------------------------------------
# TODO 15: Pipeline Save and Load
# ---------------------------------------------------------------------------
# Save a fitted sklearn pipeline to a file using joblib, then load it back.
# Return the loaded pipeline.
# Expected: loaded_pipeline.predict(X_test) matches original

def save_load_pipeline(pipeline, filepath: str):
    pass  # TODO: implement using joblib.dump and joblib.load


def main():
    print("=== Exercise 2.3: Data Preprocessing ===\n")

    np.random.seed(42)
    X = np.random.randn(100, 4)
    y = (X[:, 0] > 0).astype(int)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    result1 = standard_scale(X_train, X_test)
    print("TODO 1 — StandardScaler train mean:", np.round(result1[0].mean(axis=0), 4) if result1 else None)

    result2 = minmax_scale(X_train, X_test)
    print("TODO 2 — MinMaxScaler train min/max:", result2[0].min(), result2[0].max() if result2 else None)

    result3 = robust_scale(X_train, X_test)
    print("TODO 3 — RobustScaler shape:", result3[0].shape if result3 else None)

    # Add NaN for imputer tests
    X_nan = X_train.copy()
    X_nan[0, 0] = np.nan
    X_nan[5, 2] = np.nan
    X_test_nan = X_test.copy()
    X_test_nan[1, 1] = np.nan

    result4 = impute_mean(X_nan, X_test_nan)
    print("TODO 4 — Impute mean NaN count:", np.isnan(result4[0]).sum() if result4 else None)

    result5 = impute_median(X_nan, X_test_nan)
    print("TODO 5 — Impute median NaN count:", np.isnan(result5[0]).sum() if result5 else None)

    result6 = impute_most_frequent(X_nan, X_test_nan)
    print("TODO 6 — Impute most_freq NaN count:", np.isnan(result6[0]).sum() if result6 else None)

    df_outliers = pd.DataFrame({"a": [1, 2, 3, 100, 4, 5], "b": [10, 20, 15, 18, -50, 12]}, dtype=float)
    print("TODO 7 — Clip IQR:\n", clip_iqr_outliers(df_outliers))

    df_dup = pd.DataFrame({"x": [1,2,1,3], "y": [4,5,4,6]})
    print("TODO 8 — Remove dupes shape:", remove_duplicates(df_dup).shape)

    splits = split_data(X, y)
    print("TODO 9 — Split shapes:", splits[0].shape, splits[1].shape if splits else None)

    strat = stratified_split(X, y)
    print("TODO 10 — Stratified split test class dist:", np.bincount(strat[3]) if strat else None)

    df_ct = pd.DataFrame({
        "num1": [1.0, 2.0, 3.0, 4.0],
        "num2": [5.0, 6.0, 7.0, 8.0],
        "cat1": ["a", "b", "a", "c"],
    })
    ct = build_column_transformer(df_ct, ["num1","num2"], ["cat1"])
    print("TODO 11 — ColumnTransformer output shape:", ct.transform(df_ct).shape if ct else None)

    pipe = build_pipeline(X_train, y_train)
    print("TODO 12 — Pipeline accuracy:", pipe.score(X_test, y_test) if pipe else None)

    clip_t = ClipTransformer(-1, 1)
    if clip_t is not None and hasattr(clip_t, 'fit_transform'):
        clipped = clip_t.fit_transform(X_train)
        print("TODO 13 — Clip transformer min/max:", clipped.min(), clipped.max())

    df_val = pd.DataFrame({"age": [25, -5, 200], "score": [0.5, np.nan, 0.8]})
    schema = {
        "age":   {"dtype": "int64", "min": 0, "max": 120, "nullable": False},
        "score": {"dtype": "float64", "min": 0.0, "max": 1.0, "nullable": False},
    }
    print("TODO 14 — Validation errors:", validate_data(df_val, schema))

    pipe2 = build_pipeline(X_train, y_train)
    tmp_pipe = os.path.join(tempfile.gettempdir(), "test_pipe.pkl")
    loaded = save_load_pipeline(pipe2, tmp_pipe)
    print("TODO 15 — Loaded pipeline accuracy:", loaded.score(X_test, y_test) if loaded else None)


if __name__ == "__main__":
    main()
