# ============================================================
# Exercise 2.2 — Feature Engineering
# ============================================================
# Topics:
#   • Encoding: label, one-hot, ordinal, target, frequency
#   • Numeric transforms: polynomial, interaction, log, binning
#   • Time-series features: date extraction, rolling mean, lag
#   • Feature selection: variance threshold, mutual information
#   • Feature crossing
# ============================================================

import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder, OneHotEncoder, OrdinalEncoder, PolynomialFeatures
from sklearn.feature_selection import VarianceThreshold, mutual_info_classif
from typing import Tuple

# ---------------------------------------------------------------------------
# TODO 1: Label Encoding
# ---------------------------------------------------------------------------
# Given a pandas Series of categorical values, return a Series of
# integer-encoded labels (0, 1, 2, ...) using sklearn's LabelEncoder.
# Expected: label_encode(pd.Series(["cat","dog","cat"])) → [0, 1, 0]

def label_encode(series: pd.Series) -> pd.Series:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 2: One-Hot Encoding
# ---------------------------------------------------------------------------
# Given a DataFrame and a list of categorical column names, return a new
# DataFrame with those columns one-hot encoded (drop first to avoid dummy
# variable trap). Use pd.get_dummies.
# Expected: shape has more columns, original cat columns replaced

def one_hot_encode(df: pd.DataFrame, cat_cols: list) -> pd.DataFrame:
    pass  # TODO: implement using pd.get_dummies(drop_first=True)


# ---------------------------------------------------------------------------
# TODO 3: Ordinal Encoding
# ---------------------------------------------------------------------------
# Given a Series and an ordered list of categories, encode them as integers
# according to their position in the order list.
# Expected: ordinal_encode(pd.Series(["low","high","med"]), ["low","med","high"]) → [0, 2, 1]

def ordinal_encode(series: pd.Series, categories: list) -> pd.Series:
    pass  # TODO: implement (use a dict mapping or sklearn OrdinalEncoder)


# ---------------------------------------------------------------------------
# TODO 4: Target Encoding
# ---------------------------------------------------------------------------
# Replace each category value with the mean of the target for that category.
# Return a Series with the same index as the input series.
# Expected: target_encode(pd.Series(["a","b","a"]), pd.Series([1,3,5])) → [3.0, 3.0, 3.0]

def target_encode(series: pd.Series, target: pd.Series) -> pd.Series:
    pass  # TODO: implement (groupby category, compute mean, map back)


# ---------------------------------------------------------------------------
# TODO 5: Polynomial Features (Degree 2)
# ---------------------------------------------------------------------------
# Given a 2D numpy array X (n_samples x n_features), return polynomial
# features of degree 2 (including interaction terms) using sklearn.
# Expected: poly_features(X with 2 cols).shape[1] == 6 (1, x1, x2, x1^2, x1*x2, x2^2)

def poly_features(X: np.ndarray) -> np.ndarray:
    pass  # TODO: implement using PolynomialFeatures(degree=2, include_bias=True)


# ---------------------------------------------------------------------------
# TODO 6: Interaction Term
# ---------------------------------------------------------------------------
# Create an interaction feature = feature1 * feature2.
# Accept a DataFrame, two column names, and a new column name.
# Return a new DataFrame with the interaction column added.
# Expected: add_interaction(df, "a", "b", "a_x_b") adds df["a"] * df["b"]

def add_interaction(df: pd.DataFrame, col1: str, col2: str, new_col: str) -> pd.DataFrame:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 7: Log Transform
# ---------------------------------------------------------------------------
# Apply log1p transform (log(1 + x)) to a Series to handle skewed features.
# Return the transformed Series.
# Expected: log_transform(pd.Series([0,1,10,100])) → [0, 0.693, 2.398, 4.615]

def log_transform(series: pd.Series) -> pd.Series:
    pass  # TODO: implement using np.log1p


# ---------------------------------------------------------------------------
# TODO 8: Bin Continuous Feature
# ---------------------------------------------------------------------------
# Bin a continuous numeric Series into n equal-width bins using pd.cut.
# Return a Series of bin labels as strings.
# Expected: bin_feature(series, n_bins=4) → categorical Series

def bin_feature(series: pd.Series, n_bins: int = 4) -> pd.Series:
    pass  # TODO: implement using pd.cut


# ---------------------------------------------------------------------------
# TODO 9: Date Feature Extraction
# ---------------------------------------------------------------------------
# Given a Series of datetime values (or strings to parse), extract and return
# a DataFrame with columns: year, month, day, weekday (0=Mon, 6=Sun).
# Expected: date_features(pd.Series(["2024-01-15"])) → DataFrame with 4 cols

def date_features(series: pd.Series) -> pd.DataFrame:
    pass  # TODO: implement (parse with pd.to_datetime if needed)


# ---------------------------------------------------------------------------
# TODO 10: Rolling Mean Feature
# ---------------------------------------------------------------------------
# Given a numeric Series, compute a rolling mean with the given window size.
# Return the rolling mean Series (first window-1 values will be NaN).
# Expected: rolling_mean_feature(series, window=3)

def rolling_mean_feature(series: pd.Series, window: int = 3) -> pd.Series:
    pass  # TODO: implement using series.rolling(window).mean()


# ---------------------------------------------------------------------------
# TODO 11: Lag Feature
# ---------------------------------------------------------------------------
# Create a lag feature by shifting a Series by n periods.
# Return the shifted Series (first n values will be NaN).
# Expected: lag_feature(series, n=1) shifts all values by 1 period

def lag_feature(series: pd.Series, n: int = 1) -> pd.Series:
    pass  # TODO: implement using series.shift(n)


# ---------------------------------------------------------------------------
# TODO 12: Frequency Encoding
# ---------------------------------------------------------------------------
# Replace each category with its frequency (count / total) in the dataset.
# Return a Series of frequencies.
# Expected: frequency_encode(pd.Series(["a","b","a","a"])) → [0.75,0.25,0.75,0.75]

def frequency_encode(series: pd.Series) -> pd.Series:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 13: Feature Crossing
# ---------------------------------------------------------------------------
# Create a new categorical feature by combining two categorical columns:
#   new_feature = col1 + "_" + col2
# Return a Series with the combined strings.
# Expected: feature_cross(pd.Series(["a","b"]), pd.Series(["x","y"])) → ["a_x","b_y"]

def feature_cross(col1: pd.Series, col2: pd.Series, sep: str = "_") -> pd.Series:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 14: Feature Selection by Variance Threshold
# ---------------------------------------------------------------------------
# Remove features with variance below threshold using sklearn's VarianceThreshold.
# Return a DataFrame with only the high-variance columns retained.
# Expected: variance_threshold_select(X_df, threshold=0.1)

def variance_threshold_select(df: pd.DataFrame, threshold: float = 0.1) -> pd.DataFrame:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 15: Feature Selection by Mutual Information with Target
# ---------------------------------------------------------------------------
# Compute mutual information between each feature and the binary target.
# Return a Series of MI scores indexed by feature name, sorted descending.
# Expected: mutual_info_select(X, y) → Series sorted by importance

def mutual_info_select(X: pd.DataFrame, y: pd.Series) -> pd.Series:
    pass  # TODO: implement using mutual_info_classif


def main():
    print("=== Exercise 2.2: Feature Engineering ===\n")

    # Shared sample data
    cat_series = pd.Series(["cat", "dog", "cat", "bird", "dog"])
    num_series = pd.Series([1.0, 4.0, 9.0, 16.0, 25.0])
    df = pd.DataFrame({
        "color": ["red", "blue", "red", "green", "blue"],
        "size":  ["small", "large", "medium", "small", "large"],
        "a":     [1.0, 2.0, 3.0, 4.0, 5.0],
        "b":     [5.0, 4.0, 3.0, 2.0, 1.0],
    })
    target = pd.Series([10, 30, 20, 40, 50], name="target")

    print("TODO 1 — Label encode:", label_encode(cat_series).tolist())
    print("TODO 2 — One-hot encode shape:", one_hot_encode(df, ["color", "size"]).shape)
    print("TODO 3 — Ordinal encode:", ordinal_encode(pd.Series(["low","high","med"]), ["low","med","high"]).tolist())
    print("TODO 4 — Target encode:", target_encode(df["color"], target).tolist())
    print("TODO 5 — Poly features shape:", poly_features(df[["a","b"]].values).shape)
    print("TODO 6 — Interaction df:", add_interaction(df, "a", "b", "a_x_b")[["a","b","a_x_b"]].head())
    print("TODO 7 — Log transform:", np.round(log_transform(num_series).values, 4))
    print("TODO 8 — Binned feature:", bin_feature(num_series, n_bins=3).tolist())

    dates = pd.Series(["2024-01-15", "2024-06-20", "2024-12-31"])
    print("TODO 9 — Date features:\n", date_features(dates))

    ts = pd.Series([1.0, 2.0, 3.0, 4.0, 5.0, 6.0])
    print("TODO 10 — Rolling mean (w=3):", rolling_mean_feature(ts, 3).tolist())
    print("TODO 11 — Lag (n=2):", lag_feature(ts, 2).tolist())
    print("TODO 12 — Frequency encode:", frequency_encode(pd.Series(["a","b","a","a"])).tolist())
    print("TODO 13 — Feature cross:", feature_cross(pd.Series(["a","b"]), pd.Series(["x","y"])).tolist())

    X_df = pd.DataFrame(np.random.randn(50, 5), columns=[f"f{i}" for i in range(5)])
    X_df["const"] = 0.0  # zero variance column
    print("TODO 14 — Variance threshold cols:", list(variance_threshold_select(X_df).columns))

    np.random.seed(42)
    X_mi = pd.DataFrame(np.random.randn(100, 4), columns=["a","b","c","d"])
    y_mi = (X_mi["a"] > 0).astype(int)
    print("TODO 15 — Mutual info scores:", mutual_info_select(X_mi, y_mi).to_dict())


if __name__ == "__main__":
    main()
