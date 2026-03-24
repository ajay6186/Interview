# ============================================================
# Solution 2.1 — Exploratory Data Analysis
# ============================================================

import numpy as np
import pandas as pd
from sklearn.datasets import load_breast_cancer
from typing import Tuple, List


def load_dataset() -> pd.DataFrame:
    data = load_breast_cancer()
    df = pd.DataFrame(data.data, columns=data.feature_names)
    df["target"] = data.target
    return df


def describe_df(df: pd.DataFrame) -> dict:
    return {
        "shape":    df.shape,
        "dtypes":   df.dtypes.to_dict(),
        "describe": df.describe(),
    }


def check_missing(df: pd.DataFrame) -> pd.DataFrame:
    missing_count = df.isnull().sum()
    missing_count = missing_count[missing_count > 0]
    missing_pct = (missing_count / len(df)) * 100
    result = pd.DataFrame({
        "missing_count": missing_count,
        "missing_pct":   missing_pct,
    })
    return result


def detect_outliers_iqr(df: pd.DataFrame) -> dict:
    numeric = df.select_dtypes(include=[np.number])
    outliers = {}
    for col in numeric.columns:
        q1 = numeric[col].quantile(0.25)
        q3 = numeric[col].quantile(0.75)
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        mask = (numeric[col] < lower) | (numeric[col] > upper)
        outliers[col] = list(numeric.index[mask])
    return outliers


def detect_outliers_zscore(df: pd.DataFrame, threshold: float = 3.0) -> dict:
    numeric = df.select_dtypes(include=[np.number])
    outliers = {}
    for col in numeric.columns:
        mu = numeric[col].mean()
        sigma = numeric[col].std(ddof=0)
        if sigma == 0:
            outliers[col] = []
            continue
        z = np.abs((numeric[col] - mu) / sigma)
        outliers[col] = list(numeric.index[z > threshold])
    return outliers


def histogram_data(series: pd.Series, bins: int = 10) -> Tuple[np.ndarray, np.ndarray]:
    counts, bin_edges = np.histogram(series.dropna(), bins=bins)
    return bin_edges, counts


def correlation_matrix(df: pd.DataFrame) -> pd.DataFrame:
    return df.select_dtypes(include=[np.number]).corr()


def top_correlated_pairs(corr_matrix: pd.DataFrame, n: int = 5) -> List[Tuple]:
    pairs = []
    cols = corr_matrix.columns.tolist()
    for i in range(len(cols)):
        for j in range(i + 1, len(cols)):
            pairs.append((cols[i], cols[j], corr_matrix.iloc[i, j]))
    pairs.sort(key=lambda x: abs(x[2]), reverse=True)
    return pairs[:n]


def class_distribution(df: pd.DataFrame, target_col: str) -> dict:
    counts = df[target_col].value_counts()
    total = len(df)
    return {
        cls: (int(cnt), round(cnt / total * 100, 2))
        for cls, cnt in counts.items()
    }


def value_counts(df: pd.DataFrame, col_name: str, n_bins: int = 5) -> pd.Series:
    col = df[col_name]
    if pd.api.types.is_numeric_dtype(col) and col.nunique() > n_bins:
        binned = pd.cut(col, bins=n_bins)
        return binned.value_counts().sort_index()
    return col.value_counts()


def detect_duplicates(df: pd.DataFrame) -> dict:
    dup_mask = df.duplicated()
    return {
        "n_duplicates":  int(dup_mask.sum()),
        "duplicate_rows": df[dup_mask],
    }


def skew_kurtosis(df: pd.DataFrame) -> pd.DataFrame:
    numeric = df.select_dtypes(include=[np.number])
    result = pd.DataFrame({
        "skewness": numeric.skew(),
        "kurtosis": numeric.kurtosis(),
    })
    return result.reindex(result["skewness"].abs().sort_values(ascending=False).index)


def coefficient_of_variation(df: pd.DataFrame) -> pd.Series:
    numeric = df.select_dtypes(include=[np.number])
    means = numeric.mean()
    stds = numeric.std(ddof=1)
    cv = (stds / means.replace(0, np.nan)) * 100
    return cv.dropna().sort_values(ascending=False)


def pairwise_correlations(df: pd.DataFrame) -> pd.DataFrame:
    numeric = df.select_dtypes(include=[np.number])
    corr = numeric.corr()
    cols = corr.columns.tolist()
    rows = []
    for i in range(len(cols)):
        for j in range(i + 1, len(cols)):
            rows.append({
                "feature1":    cols[i],
                "feature2":    cols[j],
                "correlation": corr.iloc[i, j],
            })
    return pd.DataFrame(rows)


def eda_summary(df: pd.DataFrame) -> dict:
    numeric_df = df.select_dtypes(include=[np.number])
    missing = check_missing(df)
    dup = detect_duplicates(df)
    outliers_iqr = detect_outliers_iqr(numeric_df)
    total_outliers = sum(len(v) for v in outliers_iqr.values())
    sk = skew_kurtosis(numeric_df)
    most_skewed = sk.index[0] if len(sk) > 0 else None
    corr = correlation_matrix(numeric_df)
    pairs = top_correlated_pairs(corr, n=1)
    highest_pair = (pairs[0][0], pairs[0][1], round(pairs[0][2], 4)) if pairs else None

    return {
        "n_rows":             df.shape[0],
        "n_cols":             df.shape[1],
        "n_missing":          int(missing["missing_count"].sum()) if not missing.empty else 0,
        "n_duplicates":       dup["n_duplicates"],
        "n_outliers_iqr":     total_outliers,
        "most_skewed_feature": most_skewed,
        "highest_corr_pair":  highest_pair,
    }


def main():
    print("=== Solution 2.1: Exploratory Data Analysis ===\n")

    df = load_dataset()
    print("Result 1 — Shape:", df.shape)

    info = describe_df(df)
    print("Result 2 — Columns:", list(df.columns[:5]), "...", f"(total {df.shape[1]})")

    missing = check_missing(df)
    print("Result 3 — Missing values:", "None" if missing.empty else missing)

    numeric_df = df.select_dtypes(include=[np.number])
    outliers_iqr = detect_outliers_iqr(numeric_df)
    first_col = list(outliers_iqr.keys())[0]
    print(f"Result 4 — IQR outliers in '{first_col}': {len(outliers_iqr[first_col])} rows")

    outliers_z = detect_outliers_zscore(numeric_df)
    print(f"Result 5 — Z-score outliers in '{first_col}': {len(outliers_z[first_col])} rows")

    edges, counts = histogram_data(df.iloc[:, 0])
    print("Result 6 — Histogram (first 3 bins):", list(zip(np.round(edges[:4], 2), counts[:3])))

    corr = correlation_matrix(numeric_df)
    print("Result 7 — Correlation matrix shape:", corr.shape)

    pairs = top_correlated_pairs(corr, n=3)
    print("Result 8 — Top 3 corr pairs:")
    for p in pairs:
        print(f"   {p[0]} vs {p[1]}: {round(p[2], 4)}")

    print("Result 9 — Class distribution:", class_distribution(df, "target"))
    print("Result 10 — Value counts:\n", value_counts(df, "target"))

    dup = detect_duplicates(df)
    print("Result 11 — Duplicates:", dup["n_duplicates"])

    sk = skew_kurtosis(numeric_df)
    print("Result 12 — Top 3 most skewed:\n", sk.head(3).to_string())

    cv = coefficient_of_variation(numeric_df)
    print("Result 13 — Top 3 CV:\n", cv.head(3).to_string())

    pw = pairwise_correlations(numeric_df)
    print("Result 14 — Pairwise corr rows:", len(pw))

    summary = eda_summary(df)
    print("Result 15 — EDA summary:")
    for k, v in summary.items():
        print(f"   {k}: {v}")


if __name__ == "__main__":
    main()
