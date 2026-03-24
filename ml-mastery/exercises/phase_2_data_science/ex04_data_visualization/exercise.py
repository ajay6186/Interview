# ============================================================
# Exercise 2.4 — Data Visualization
# ============================================================
# Topics:
#   • Histogram, scatter, box plot, bar chart, heatmap
#   • Line chart for learning curve
#   • ROC curve data, confusion matrix
#   • Distribution comparison, feature importance
#   • Residual plot, pairplot structure
#   • Decision boundary concept
#   • Matplotlib/seaborn code strings
#
# NOTE: Since plots cannot render in a terminal, each function
# computes and returns the underlying data (or a code string).
# ============================================================

import numpy as np
import pandas as pd
from sklearn.metrics import roc_curve, confusion_matrix
from sklearn.datasets import load_iris
from typing import Tuple, Dict, List

# ---------------------------------------------------------------------------
# TODO 1: Histogram Data
# ---------------------------------------------------------------------------
# Given a 1-D array of values, compute histogram with the given number of bins.
# Return (bin_centers, counts) — NOT edges, but centers of each bin.
# Expected: histogram_data(data, bins=5) → (array of 5 centers, array of 5 counts)

def histogram_data(data: np.ndarray, bins: int = 10) -> Tuple[np.ndarray, np.ndarray]:
    pass  # TODO: implement using np.histogram, compute centers from edges


# ---------------------------------------------------------------------------
# TODO 2: Scatter Plot Data
# ---------------------------------------------------------------------------
# Given a 2D dataset X (n x 2) and labels y, return a dict grouping x/y
# coordinates by class label.
# Expected: scatter_data(X, y) → {0: {"x": [...], "y": [...]}, 1: {...}}

def scatter_data(X: np.ndarray, y: np.ndarray) -> Dict:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 3: Box Plot Statistics
# ---------------------------------------------------------------------------
# Compute the 5-number summary for a 1-D array:
#   Q1 (25th), median (50th), Q3 (75th), whisker_low, whisker_high, outliers
# Whiskers: [Q1 - 1.5*IQR, Q3 + 1.5*IQR]
# Expected: box_plot_stats([1,2,3,4,5,100]) → dict with those keys

def box_plot_stats(data: np.ndarray) -> Dict:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 4: Bar Chart Data
# ---------------------------------------------------------------------------
# Given a pandas Series (index=categories, values=counts), return a dict
# with sorted categories and their values ready for plotting.
# Expected: bar_chart_data(series) → {"categories": [...], "values": [...]}

def bar_chart_data(series: pd.Series) -> Dict:
    pass  # TODO: implement (sort by value descending)


# ---------------------------------------------------------------------------
# TODO 5: Heatmap Data (Correlation Matrix)
# ---------------------------------------------------------------------------
# Given a DataFrame, compute the Pearson correlation matrix and return it
# as a dict with "matrix" (2D array), "labels" (column names).
# Expected: heatmap_data(df) → {"matrix": ..., "labels": [...]}

def heatmap_data(df: pd.DataFrame) -> Dict:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 6: Learning Curve Data
# ---------------------------------------------------------------------------
# Simulate a learning curve: given arrays train_sizes, train_scores, val_scores,
# return a dict with those three arrays formatted for plotting.
# Compute from sklearn's learning_curve or simulate with logistic regression.
# Expected: learning_curve_data(X, y) → {"train_sizes":..., "train_scores":..., "val_scores":...}

def learning_curve_data(X: np.ndarray, y: np.ndarray) -> Dict:
    pass  # TODO: implement using sklearn.model_selection.learning_curve
          # Use train_sizes=np.linspace(0.2, 1.0, 5), cv=3


# ---------------------------------------------------------------------------
# TODO 7: ROC Curve Data
# ---------------------------------------------------------------------------
# Given true binary labels y_true and predicted probabilities y_prob,
# return (fpr, tpr, thresholds, auc_score).
# Expected: roc_curve_data(y_true, y_prob) → (fpr, tpr, thresholds, auc)

def roc_curve_data(y_true: np.ndarray, y_prob: np.ndarray) -> Tuple:
    pass  # TODO: implement using sklearn.metrics roc_curve and roc_auc_score


# ---------------------------------------------------------------------------
# TODO 8: Confusion Matrix Data
# ---------------------------------------------------------------------------
# Given y_true and y_pred (class labels), return a dict with:
#   "matrix" (2D np.ndarray), "labels" (unique classes)
# Expected: confusion_matrix_data(y_true, y_pred) → dict

def confusion_matrix_data(y_true: np.ndarray, y_pred: np.ndarray) -> Dict:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 9: Distribution Comparison
# ---------------------------------------------------------------------------
# Compare distributions of two groups using their summary statistics.
# Return a DataFrame with rows=["mean","std","median","q25","q75"] and
# columns=["group1","group2"].
# Expected: distribution_comparison(g1, g2) → DataFrame (5 rows x 2 cols)

def distribution_comparison(group1: np.ndarray, group2: np.ndarray) -> pd.DataFrame:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 10: Feature Importance Bar Data
# ---------------------------------------------------------------------------
# Given feature names and importance scores (e.g., from a tree model),
# return a DataFrame sorted by importance descending with columns
# ["feature", "importance"].
# Expected: feature_importance_data(names, scores) → DataFrame

def feature_importance_data(feature_names: List[str], importances: np.ndarray) -> pd.DataFrame:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 11: Residual Plot Data
# ---------------------------------------------------------------------------
# Given y_true and y_pred from a regression model, return:
#   y_pred (fitted values) and residuals (y_true - y_pred)
# Expected: residual_data(y_true, y_pred) → {"fitted": ..., "residuals": ...}

def residual_data(y_true: np.ndarray, y_pred: np.ndarray) -> Dict:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 12: Pairplot Data Structure
# ---------------------------------------------------------------------------
# Given a DataFrame, compute pairwise correlations between all numeric columns.
# Return a dict: {(col_i, col_j): {"x": series, "y": series}} for all pairs.
# Expected: pairplot_data(df) → dict with n*(n-1)//2 entries

def pairplot_data(df: pd.DataFrame) -> Dict:
    pass  # TODO: implement (only unique pairs, no self-pairs)


# ---------------------------------------------------------------------------
# TODO 13: Decision Boundary Concept
# ---------------------------------------------------------------------------
# Create a meshgrid over the 2D feature space and return model predictions
# for each grid point. Useful for visualizing decision boundaries.
# Return (xx, yy, Z) where Z is the predicted class for each grid point.
# Expected: decision_boundary_data(model, x_range, y_range) → (xx, yy, Z)

def decision_boundary_data(model, x_range: Tuple, y_range: Tuple, step: float = 0.5) -> Tuple:
    pass  # TODO: implement using np.meshgrid and model.predict


# ---------------------------------------------------------------------------
# TODO 14: Matplotlib Code String for Histogram
# ---------------------------------------------------------------------------
# Return a string of valid matplotlib code that would plot a histogram
# of the variable named `data`, with 20 bins, title "Histogram", xlabel "Value".
# Expected: returns a multi-line Python string

def matplotlib_histogram_code() -> str:
    pass  # TODO: return a Python code string as a multi-line string


# ---------------------------------------------------------------------------
# TODO 15: Seaborn Heatmap Code String
# ---------------------------------------------------------------------------
# Return a string of valid seaborn code that would plot a heatmap of the
# correlation matrix of `df`, with annotations and a coolwarm colormap.
# Expected: returns a multi-line Python string

def seaborn_heatmap_code() -> str:
    pass  # TODO: return a Python code string as a multi-line string


def main():
    print("=== Exercise 2.4: Data Visualization ===\n")

    np.random.seed(42)
    data = np.random.randn(200)
    X = np.random.randn(100, 2)
    y = (X[:, 0] + X[:, 1] > 0).astype(int)
    df = pd.DataFrame(X, columns=["a","b"])
    df["c"] = np.random.randn(100)

    centers, counts = histogram_data(data) if histogram_data(data) is not None else (None, None)
    print("TODO 1 — Histogram centers:", np.round(centers[:3], 2) if centers is not None else None)

    sdata = scatter_data(X, y)
    print("TODO 2 — Scatter group 0 size:", len(sdata[0]["x"]) if sdata else None)

    bstats = box_plot_stats(np.array([1, 2, 3, 4, 5, 100]))
    print("TODO 3 — Box stats:", bstats)

    counts_series = pd.Series({"A": 30, "B": 50, "C": 20})
    print("TODO 4 — Bar chart data:", bar_chart_data(counts_series))

    hdata = heatmap_data(df)
    print("TODO 5 — Heatmap labels:", hdata["labels"] if hdata else None)

    lc = learning_curve_data(X, y)
    print("TODO 6 — Learning curve train sizes:", lc["train_sizes"] if lc else None)

    from sklearn.linear_model import LogisticRegression
    model = LogisticRegression(random_state=42).fit(X, y)
    y_prob = model.predict_proba(X)[:, 1]
    fpr, tpr, _, auc = roc_curve_data(y, y_prob) if roc_curve_data(y, y_prob) is not None else (None, None, None, None)
    print("TODO 7 — AUC:", auc)

    y_pred = model.predict(X)
    cm_data = confusion_matrix_data(y, y_pred)
    print("TODO 8 — Confusion matrix:\n", cm_data["matrix"] if cm_data else None)

    g1 = np.random.randn(100)
    g2 = np.random.randn(100) + 1
    print("TODO 9 — Distribution comparison:\n", distribution_comparison(g1, g2))

    names = ["feature_a", "feature_b", "feature_c"]
    scores = np.array([0.3, 0.5, 0.2])
    print("TODO 10 — Feature importance:\n", feature_importance_data(names, scores))

    y_reg_true = np.random.randn(50)
    y_reg_pred = y_reg_true + 0.1 * np.random.randn(50)
    rdata = residual_data(y_reg_true, y_reg_pred)
    print("TODO 11 — Residuals mean:", round(rdata["residuals"].mean(), 4) if rdata else None)

    pp = pairplot_data(df)
    print("TODO 12 — Pairplot pairs count:", len(pp) if pp else None)

    db = decision_boundary_data(model, (-3, 3), (-3, 3), step=1.0)
    print("TODO 13 — Decision boundary Z shape:", db[2].shape if db else None)

    print("TODO 14 — Matplotlib code:\n", matplotlib_histogram_code())
    print("TODO 15 — Seaborn code:\n", seaborn_heatmap_code())


if __name__ == "__main__":
    main()
