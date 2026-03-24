# ============================================================
# Exercise 2.1 — Exploratory Data Analysis
# ============================================================
# Topics:
#   • Dataset loading and basic description
#   • Missing values, duplicates
#   • Outlier detection: IQR and Z-score methods
#   • Distribution analysis: skewness, kurtosis
#   • Correlation matrix and top correlated pairs
#   • Class distribution, value counts
#   • Feature variance (coefficient of variation)
#   • EDA summary report
# ============================================================

import numpy as np
import pandas as pd
from sklearn.datasets import load_breast_cancer
from typing import Tuple, List

# ---------------------------------------------------------------------------
# TODO 1: Load Dataset
# ---------------------------------------------------------------------------
# Load the breast cancer dataset from sklearn.datasets into a DataFrame.
# Add the target column named "target".
# Return the DataFrame.
# Expected: df.shape == (569, 31)

def load_dataset() -> pd.DataFrame:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 2: Describe DataFrame
# ---------------------------------------------------------------------------
# Given a DataFrame, return a dict with:
#   shape, dtypes (as dict), describe (as DataFrame from df.describe())
# Expected: describe_df(df) returns dict with those 3 keys

def describe_df(df: pd.DataFrame) -> dict:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 3: Check Missing Values
# ---------------------------------------------------------------------------
# Return a DataFrame with columns ["missing_count", "missing_pct"]
# for each column that has at least one missing value.
# Expected: check_missing(df) — empty DataFrame if no nulls

def check_missing(df: pd.DataFrame) -> pd.DataFrame:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 4: Detect Outliers — IQR Method
# ---------------------------------------------------------------------------
# For each numeric column, find rows where value is outside
# [Q1 - 1.5*IQR, Q3 + 1.5*IQR]. Return a dict {col: [row_indices]}.
# Expected: detect_outliers_iqr(df) → dict of column → list of outlier indices

def detect_outliers_iqr(df: pd.DataFrame) -> dict:
    pass  # TODO: implement (only numeric columns)


# ---------------------------------------------------------------------------
# TODO 5: Detect Outliers — Z-Score Method
# ---------------------------------------------------------------------------
# For each numeric column, find rows where |z-score| > threshold.
# Return a dict {col: [row_indices]}.
# Expected: detect_outliers_zscore(df, threshold=3.0)

def detect_outliers_zscore(df: pd.DataFrame, threshold: float = 3.0) -> dict:
    pass  # TODO: implement (only numeric columns)


# ---------------------------------------------------------------------------
# TODO 6: Distribution Analysis
# ---------------------------------------------------------------------------
# For one numeric column, compute histogram data using numpy.
# Return (bin_edges, counts) as numpy arrays.
# Expected: histogram_data(df["mean radius"], bins=10) → (edges, counts)

def histogram_data(series: pd.Series, bins: int = 10) -> Tuple[np.ndarray, np.ndarray]:
    pass  # TODO: implement using np.histogram


# ---------------------------------------------------------------------------
# TODO 7: Correlation Matrix
# ---------------------------------------------------------------------------
# Return the Pearson correlation matrix of all numeric columns as a DataFrame.
# Expected: correlation_matrix(df).shape == (n_numeric, n_numeric)

def correlation_matrix(df: pd.DataFrame) -> pd.DataFrame:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 8: Top Correlated Feature Pairs
# ---------------------------------------------------------------------------
# Given the correlation matrix, return the top n pairs (excluding self-
# correlations and duplicates) sorted by absolute correlation descending.
# Return list of (feature1, feature2, correlation) tuples.
# Expected: top_correlated_pairs(corr_matrix, n=5) → list of 5 tuples

def top_correlated_pairs(corr_matrix: pd.DataFrame, n: int = 5) -> List[Tuple]:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 9: Class Distribution
# ---------------------------------------------------------------------------
# Return a dict with class counts and percentages for the target column.
# Expected: class_distribution(df, "target") → {0: (212, 37.3%), 1: (357, 62.7%)}

def class_distribution(df: pd.DataFrame, target_col: str) -> dict:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 10: Value Counts for Categorical Column
# ---------------------------------------------------------------------------
# Return a Series with value counts for column col_name.
# If column is numeric, bin it into n_bins equal-width bins first.
# Expected: value_counts(df, "target") → Series with counts

def value_counts(df: pd.DataFrame, col_name: str, n_bins: int = 5) -> pd.Series:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 11: Detect Duplicate Rows
# ---------------------------------------------------------------------------
# Return a dict with:
#   n_duplicates (int): number of duplicate rows
#   duplicate_rows (DataFrame): the duplicate rows themselves
# Expected: detect_duplicates(df) → dict

def detect_duplicates(df: pd.DataFrame) -> dict:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 12: Skewness and Kurtosis
# ---------------------------------------------------------------------------
# Return a DataFrame with columns ["skewness", "kurtosis"] for all numeric
# columns, sorted by absolute skewness descending.
# Expected: skew_kurtosis(df).columns == ["skewness", "kurtosis"]

def skew_kurtosis(df: pd.DataFrame) -> pd.DataFrame:
    pass  # TODO: implement using df.skew() and df.kurtosis()


# ---------------------------------------------------------------------------
# TODO 13: Feature Variance (Coefficient of Variation)
# ---------------------------------------------------------------------------
# Coefficient of Variation = std / mean * 100 (%)
# Return a Series of CV values for all numeric columns, sorted descending.
# Expected: cv_series with high-variance features at top

def coefficient_of_variation(df: pd.DataFrame) -> pd.Series:
    pass  # TODO: implement (numeric columns only, exclude zero-mean)


# ---------------------------------------------------------------------------
# TODO 14: Pairwise Correlation for All Numeric Pairs
# ---------------------------------------------------------------------------
# Return a DataFrame with columns ["feature1", "feature2", "correlation"]
# for all unique pairs of numeric columns (no duplicates, no self-pairs).
# Expected: pairwise_correlations(df).shape[0] == n*(n-1)//2

def pairwise_correlations(df: pd.DataFrame) -> pd.DataFrame:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 15: EDA Summary Report
# ---------------------------------------------------------------------------
# Return a dict summarizing the key EDA findings:
#   n_rows, n_cols, n_missing, n_duplicates, n_outliers_iqr (total),
#   most_skewed_feature (name), highest_corr_pair (tuple)
# Expected: eda_summary(df) → dict with those keys

def eda_summary(df: pd.DataFrame) -> dict:
    pass  # TODO: combine previous functions to build the summary


def main():
    print("=== Exercise 2.1: Exploratory Data Analysis ===\n")

    df = load_dataset()
    print("TODO 1 — Shape:", df.shape if df is not None else None)

    info = describe_df(df)
    print("TODO 2 — Columns:", list(df.columns[:5]), "...", f"(total {df.shape[1]})")

    missing = check_missing(df)
    print("TODO 3 — Missing values shape:", missing.shape if missing is not None else None)

    outliers_iqr = detect_outliers_iqr(df.select_dtypes(include=[np.number]))
    print("TODO 4 — IQR outliers in first col:", list(outliers_iqr.values())[0][:5] if outliers_iqr else None)

    outliers_z = detect_outliers_zscore(df.select_dtypes(include=[np.number]))
    print("TODO 5 — Z-score outliers in first col:", list(outliers_z.values())[0][:5] if outliers_z else None)

    edges, counts = histogram_data(df.iloc[:, 0]) if histogram_data(df.iloc[:, 0]) is not None else (None, None)
    print("TODO 6 — Histogram bins/counts:", edges[:3] if edges is not None else None)

    corr = correlation_matrix(df.select_dtypes(include=[np.number]))
    print("TODO 7 — Correlation matrix shape:", corr.shape if corr is not None else None)

    pairs = top_correlated_pairs(corr)
    print("TODO 8 — Top 3 corr pairs:", pairs[:3] if pairs else None)

    print("TODO 9 — Class distribution:", class_distribution(df, "target"))
    print("TODO 10 — Value counts:\n", value_counts(df, "target"))

    dup = detect_duplicates(df)
    print("TODO 11 — Duplicates:", dup)

    sk = skew_kurtosis(df.select_dtypes(include=[np.number]))
    print("TODO 12 — Top 3 skewed:\n", sk.head(3) if sk is not None else None)

    cv = coefficient_of_variation(df.select_dtypes(include=[np.number]))
    print("TODO 13 — Top 3 CV:\n", cv.head(3) if cv is not None else None)

    pairs_all = pairwise_correlations(df.select_dtypes(include=[np.number]))
    print("TODO 14 — Pairwise corr rows:", len(pairs_all) if pairs_all is not None else None)

    summary = eda_summary(df)
    print("TODO 15 — EDA summary:", summary)


if __name__ == "__main__":
    main()
