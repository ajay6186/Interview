# ============================================================
# Solution 2.2 — Feature Engineering
# ============================================================

import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder, PolynomialFeatures
from sklearn.feature_selection import VarianceThreshold, mutual_info_classif
from typing import Tuple


def label_encode(series: pd.Series) -> pd.Series:
    le = LabelEncoder()
    encoded = le.fit_transform(series)
    return pd.Series(encoded, index=series.index, name=series.name)


def one_hot_encode(df: pd.DataFrame, cat_cols: list) -> pd.DataFrame:
    return pd.get_dummies(df, columns=cat_cols, drop_first=True)


def ordinal_encode(series: pd.Series, categories: list) -> pd.Series:
    mapping = {cat: i for i, cat in enumerate(categories)}
    return series.map(mapping)


def target_encode(series: pd.Series, target: pd.Series) -> pd.Series:
    means = target.groupby(series).mean()
    return series.map(means)


def poly_features(X: np.ndarray) -> np.ndarray:
    pf = PolynomialFeatures(degree=2, include_bias=True)
    return pf.fit_transform(X)


def add_interaction(df: pd.DataFrame, col1: str, col2: str, new_col: str) -> pd.DataFrame:
    df = df.copy()
    df[new_col] = df[col1] * df[col2]
    return df


def log_transform(series: pd.Series) -> pd.Series:
    return np.log1p(series)


def bin_feature(series: pd.Series, n_bins: int = 4) -> pd.Series:
    return pd.cut(series, bins=n_bins)


def date_features(series: pd.Series) -> pd.DataFrame:
    dt = pd.to_datetime(series)
    return pd.DataFrame({
        "year":    dt.dt.year,
        "month":   dt.dt.month,
        "day":     dt.dt.day,
        "weekday": dt.dt.dayofweek,
    })


def rolling_mean_feature(series: pd.Series, window: int = 3) -> pd.Series:
    return series.rolling(window=window).mean()


def lag_feature(series: pd.Series, n: int = 1) -> pd.Series:
    return series.shift(n)


def frequency_encode(series: pd.Series) -> pd.Series:
    freq_map = series.value_counts(normalize=True)
    return series.map(freq_map)


def feature_cross(col1: pd.Series, col2: pd.Series, sep: str = "_") -> pd.Series:
    return col1.astype(str) + sep + col2.astype(str)


def variance_threshold_select(df: pd.DataFrame, threshold: float = 0.1) -> pd.DataFrame:
    selector = VarianceThreshold(threshold=threshold)
    selector.fit(df)
    selected_cols = df.columns[selector.get_support()]
    return df[selected_cols]


def mutual_info_select(X: pd.DataFrame, y: pd.Series) -> pd.Series:
    mi_scores = mutual_info_classif(X, y, random_state=42)
    return pd.Series(mi_scores, index=X.columns).sort_values(ascending=False)


def main():
    print("=== Solution 2.2: Feature Engineering ===\n")

    cat_series = pd.Series(["cat", "dog", "cat", "bird", "dog"])
    num_series = pd.Series([1.0, 4.0, 9.0, 16.0, 25.0])
    df = pd.DataFrame({
        "color": ["red", "blue", "red", "green", "blue"],
        "size":  ["small", "large", "medium", "small", "large"],
        "a":     [1.0, 2.0, 3.0, 4.0, 5.0],
        "b":     [5.0, 4.0, 3.0, 2.0, 1.0],
    })
    target = pd.Series([10, 30, 20, 40, 50], name="target")

    print("Result 1 — Label encode:", label_encode(cat_series).tolist())
    print("Result 2 — One-hot encode shape:", one_hot_encode(df, ["color", "size"]).shape)
    print("Result 3 — Ordinal encode:", ordinal_encode(pd.Series(["low","high","med"]), ["low","med","high"]).tolist())
    print("Result 4 — Target encode:", target_encode(df["color"], target).tolist())
    print("Result 5 — Poly features shape:", poly_features(df[["a","b"]].values).shape)
    print("Result 6 — Interaction df:\n", add_interaction(df, "a", "b", "a_x_b")[["a","b","a_x_b"]])
    print("Result 7 — Log transform:", np.round(log_transform(num_series).values, 4))
    print("Result 8 — Binned:\n", bin_feature(num_series, n_bins=3))

    dates = pd.Series(["2024-01-15", "2024-06-20", "2024-12-31"])
    print("Result 9 — Date features:\n", date_features(dates))

    ts = pd.Series([1.0, 2.0, 3.0, 4.0, 5.0, 6.0])
    print("Result 10 — Rolling mean (w=3):", rolling_mean_feature(ts, 3).tolist())
    print("Result 11 — Lag (n=2):", lag_feature(ts, 2).tolist())
    print("Result 12 — Frequency encode:", frequency_encode(pd.Series(["a","b","a","a"])).tolist())
    print("Result 13 — Feature cross:", feature_cross(pd.Series(["a","b"]), pd.Series(["x","y"])).tolist())

    np.random.seed(42)
    X_df = pd.DataFrame(np.random.randn(50, 5), columns=[f"f{i}" for i in range(5)])
    X_df["const"] = 0.0
    print("Result 14 — After variance threshold:", list(variance_threshold_select(X_df).columns))

    X_mi = pd.DataFrame(np.random.randn(100, 4), columns=["a","b","c","d"])
    y_mi = (X_mi["a"] > 0).astype(int)
    mi = mutual_info_select(X_mi, y_mi)
    print("Result 15 — MI scores:")
    for feat, score in mi.items():
        print(f"   {feat}: {round(score, 4)}")


if __name__ == "__main__":
    main()
