# ============================================================
# Solution 2.4 — Data Visualization
# ============================================================

import numpy as np
import pandas as pd
from sklearn.metrics import roc_curve, roc_auc_score, confusion_matrix
from sklearn.model_selection import learning_curve
from sklearn.linear_model import LogisticRegression
from typing import Tuple, Dict, List


def histogram_data(data: np.ndarray, bins: int = 10) -> Tuple[np.ndarray, np.ndarray]:
    counts, bin_edges = np.histogram(data, bins=bins)
    bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2
    return bin_centers, counts


def scatter_data(X: np.ndarray, y: np.ndarray) -> Dict:
    result = {}
    for label in np.unique(y):
        mask = y == label
        result[int(label)] = {
            "x": X[mask, 0].tolist(),
            "y": X[mask, 1].tolist(),
        }
    return result


def box_plot_stats(data: np.ndarray) -> Dict:
    data = np.asarray(data, dtype=float)
    q1 = np.percentile(data, 25)
    median = np.percentile(data, 50)
    q3 = np.percentile(data, 75)
    iqr = q3 - q1
    whisker_low = q1 - 1.5 * iqr
    whisker_high = q3 + 1.5 * iqr
    outliers = data[(data < whisker_low) | (data > whisker_high)].tolist()
    return {
        "q1":           q1,
        "median":       median,
        "q3":           q3,
        "iqr":          iqr,
        "whisker_low":  whisker_low,
        "whisker_high": whisker_high,
        "outliers":     outliers,
    }


def bar_chart_data(series: pd.Series) -> Dict:
    sorted_series = series.sort_values(ascending=False)
    return {
        "categories": list(sorted_series.index),
        "values":     list(sorted_series.values),
    }


def heatmap_data(df: pd.DataFrame) -> Dict:
    numeric = df.select_dtypes(include=[np.number])
    corr = numeric.corr()
    return {
        "matrix": corr.values,
        "labels": list(corr.columns),
    }


def learning_curve_data(X: np.ndarray, y: np.ndarray) -> Dict:
    import warnings
    model = LogisticRegression(max_iter=200, random_state=42)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        train_sizes, train_scores, val_scores = learning_curve(
            model, X, y,
            train_sizes=np.linspace(0.2, 1.0, 5),
            cv=3,
            scoring="accuracy",
        )
    return {
        "train_sizes":   train_sizes,
        "train_scores":  train_scores.mean(axis=1),
        "val_scores":    val_scores.mean(axis=1),
    }


def roc_curve_data(y_true: np.ndarray, y_prob: np.ndarray) -> Tuple:
    fpr, tpr, thresholds = roc_curve(y_true, y_prob)
    auc = roc_auc_score(y_true, y_prob)
    return fpr, tpr, thresholds, auc


def confusion_matrix_data(y_true: np.ndarray, y_pred: np.ndarray) -> Dict:
    labels = np.unique(np.concatenate([y_true, y_pred]))
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    return {
        "matrix": cm,
        "labels": labels.tolist(),
    }


def distribution_comparison(group1: np.ndarray, group2: np.ndarray) -> pd.DataFrame:
    def stats(g):
        g = np.asarray(g, dtype=float)
        return {
            "mean":   g.mean(),
            "std":    g.std(ddof=1),
            "median": np.median(g),
            "q25":    np.percentile(g, 25),
            "q75":    np.percentile(g, 75),
        }
    s1 = stats(group1)
    s2 = stats(group2)
    return pd.DataFrame({"group1": s1, "group2": s2})


def feature_importance_data(feature_names: List[str], importances: np.ndarray) -> pd.DataFrame:
    df = pd.DataFrame({
        "feature":    feature_names,
        "importance": importances,
    })
    return df.sort_values("importance", ascending=False).reset_index(drop=True)


def residual_data(y_true: np.ndarray, y_pred: np.ndarray) -> Dict:
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    residuals = y_true - y_pred
    return {
        "fitted":    y_pred,
        "residuals": residuals,
    }


def pairplot_data(df: pd.DataFrame) -> Dict:
    numeric = df.select_dtypes(include=[np.number])
    cols = numeric.columns.tolist()
    result = {}
    for i in range(len(cols)):
        for j in range(i + 1, len(cols)):
            result[(cols[i], cols[j])] = {
                "x": numeric[cols[i]],
                "y": numeric[cols[j]],
            }
    return result


def decision_boundary_data(model, x_range: Tuple, y_range: Tuple, step: float = 0.5) -> Tuple:
    xx, yy = np.meshgrid(
        np.arange(x_range[0], x_range[1], step),
        np.arange(y_range[0], y_range[1], step),
    )
    grid = np.c_[xx.ravel(), yy.ravel()]
    Z = model.predict(grid).reshape(xx.shape)
    return xx, yy, Z


def matplotlib_histogram_code() -> str:
    return """\
import matplotlib.pyplot as plt
import numpy as np

fig, ax = plt.subplots(figsize=(8, 5))
ax.hist(data, bins=20, color='steelblue', edgecolor='black', alpha=0.7)
ax.set_title('Histogram')
ax.set_xlabel('Value')
ax.set_ylabel('Count')
plt.tight_layout()
plt.show()
"""


def seaborn_heatmap_code() -> str:
    return """\
import seaborn as sns
import matplotlib.pyplot as plt

corr = df.select_dtypes(include='number').corr()
fig, ax = plt.subplots(figsize=(10, 8))
sns.heatmap(
    corr,
    annot=True,
    fmt='.2f',
    cmap='coolwarm',
    center=0,
    square=True,
    linewidths=0.5,
    ax=ax,
)
ax.set_title('Correlation Heatmap')
plt.tight_layout()
plt.show()
"""


def main():
    print("=== Solution 2.4: Data Visualization ===\n")

    np.random.seed(42)
    data = np.random.randn(200)
    X = np.random.randn(100, 2)
    y = (X[:, 0] + X[:, 1] > 0).astype(int)
    df = pd.DataFrame(X, columns=["a", "b"])
    df["c"] = np.random.randn(100)

    centers, counts = histogram_data(data)
    print("Result 1 — Histogram centers (first 3):", np.round(centers[:3], 3))

    sdata = scatter_data(X, y)
    print("Result 2 — Scatter group sizes:", {k: len(v["x"]) for k, v in sdata.items()})

    bstats = box_plot_stats(np.array([1, 2, 3, 4, 5, 100]))
    print("Result 3 — Box stats:", {k: round(v, 2) if not isinstance(v, list) else v for k, v in bstats.items()})

    counts_series = pd.Series({"A": 30, "B": 50, "C": 20})
    print("Result 4 — Bar chart data:", bar_chart_data(counts_series))

    hdata = heatmap_data(df)
    print("Result 5 — Heatmap labels:", hdata["labels"])
    print("           Correlation matrix:\n", np.round(hdata["matrix"], 3))

    lc = learning_curve_data(X, y)
    print("Result 6 — Learning curve train sizes:", lc["train_sizes"])
    print("           Val scores:", np.round(lc["val_scores"], 3))

    model = LogisticRegression(random_state=42).fit(X, y)
    y_prob = model.predict_proba(X)[:, 1]
    fpr, tpr, _, auc = roc_curve_data(y, y_prob)
    print(f"Result 7 — AUC: {round(auc, 4)}, ROC curve has {len(fpr)} points")

    y_pred = model.predict(X)
    cm_data = confusion_matrix_data(y, y_pred)
    print("Result 8 — Confusion matrix:\n", cm_data["matrix"])

    g1 = np.random.randn(100)
    g2 = np.random.randn(100) + 1
    print("Result 9 — Distribution comparison:\n", distribution_comparison(g1, g2).round(3).to_string())

    names = ["feature_a", "feature_b", "feature_c"]
    scores = np.array([0.3, 0.5, 0.2])
    print("Result 10 — Feature importance:\n", feature_importance_data(names, scores).to_string())

    y_reg_true = np.random.randn(50)
    y_reg_pred = y_reg_true + 0.1 * np.random.randn(50)
    rdata = residual_data(y_reg_true, y_reg_pred)
    print(f"Result 11 — Residuals mean: {round(rdata['residuals'].mean(), 4)}, std: {round(rdata['residuals'].std(), 4)}")

    pp = pairplot_data(df)
    print("Result 12 — Pairplot pairs count:", len(pp))

    db_xx, db_yy, db_Z = decision_boundary_data(model, (-3, 3), (-3, 3), step=1.0)
    print("Result 13 — Decision boundary Z shape:", db_Z.shape)

    print("\nResult 14 — Matplotlib histogram code:")
    print(matplotlib_histogram_code())

    print("Result 15 — Seaborn heatmap code:")
    print(seaborn_heatmap_code())


if __name__ == "__main__":
    main()
