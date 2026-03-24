# ============================================================
# Examples 2.4 — Data Visualization (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import pandas as pd
from sklearn.datasets import load_iris
from sklearn.metrics import confusion_matrix, roc_curve, precision_recall_curve
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import learning_curve, validation_curve
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from scipy import stats
from scipy.stats import gaussian_kde

# Note: All functions compute and print the DATA for the visualization,
# plus print the matplotlib/seaborn CODE as a string.

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Histogram data using np.histogram"""
    np.random.seed(42)
    data = np.random.normal(5, 1.5, 200)
    counts, bin_edges = np.histogram(data, bins=10)
    bin_centers = ((bin_edges[:-1] + bin_edges[1:]) / 2).round(3)
    print("Ex01 — Histogram data:")
    print("        bin_centers:", bin_centers.tolist())
    print("        counts:", counts.tolist())
    print("        code: plt.hist(data, bins=10); plt.xlabel('Value'); plt.show()")

def ex02():
    """Scatter plot data (x, y arrays)"""
    np.random.seed(42)
    x = np.random.randn(50)
    y = 2 * x + np.random.randn(50) * 0.5
    corr = round(np.corrcoef(x, y)[0, 1], 4)
    print("Ex02 — Scatter data:")
    print("        x (first 5):", x[:5].round(3).tolist())
    print("        y (first 5):", y[:5].round(3).tolist())
    print("        Pearson r:", corr)
    print("        code: plt.scatter(x, y, alpha=0.6); plt.show()")

def ex03():
    """Box plot stats: Q1, Q2, Q3, whiskers, outliers"""
    np.random.seed(42)
    data = np.concatenate([np.random.normal(10, 2, 100), [25, 26]])
    Q1, Q2, Q3 = np.percentile(data, [25, 50, 75])
    IQR = Q3 - Q1
    lower_fence = Q1 - 1.5 * IQR
    upper_fence = Q3 + 1.5 * IQR
    outliers = data[data > upper_fence].tolist() + data[data < lower_fence].tolist()
    print("Ex03 — Box plot stats:")
    print(f"        Q1={Q1:.3f}, Q2={Q2:.3f}, Q3={Q3:.3f}, IQR={IQR:.3f}")
    print(f"        Whiskers: [{lower_fence:.3f}, {upper_fence:.3f}]")
    print(f"        Outliers: {[round(o, 2) for o in outliers]}")
    print("        code: plt.boxplot(data); plt.show()")

def ex04():
    """Bar chart data"""
    categories = ['Model A', 'Model B', 'Model C', 'Model D']
    values = [0.85, 0.92, 0.78, 0.96]
    sorted_pairs = sorted(zip(categories, values), key=lambda x: -x[1])
    print("Ex04 — Bar chart data:")
    print("        categories:", [p[0] for p in sorted_pairs])
    print("        values:", [p[1] for p in sorted_pairs])
    print("        code: plt.bar(categories, values); plt.ylabel('Accuracy'); plt.show()")

def ex05():
    """Line chart data"""
    np.random.seed(42)
    epochs = np.arange(1, 21)
    train_loss = 1.0 * np.exp(-0.15 * epochs) + np.random.randn(20) * 0.02
    val_loss = 1.0 * np.exp(-0.12 * epochs) + 0.05 + np.random.randn(20) * 0.03
    train_loss = np.maximum(train_loss, 0.05)
    val_loss = np.maximum(val_loss, 0.08)
    print("Ex05 — Line chart data (training curves):")
    print("        epochs:", epochs.tolist())
    print("        train_loss (first 5):", train_loss[:5].round(4).tolist())
    print("        val_loss (first 5):", val_loss[:5].round(4).tolist())
    print("        code: plt.plot(epochs, train_loss, label='train'); plt.plot(epochs, val_loss, label='val'); plt.legend(); plt.show()")

def ex06():
    """Pie chart data"""
    labels = ['Class 0', 'Class 1', 'Class 2']
    sizes = [45, 35, 20]
    percentages = [round(s / sum(sizes) * 100, 1) for s in sizes]
    print("Ex06 — Pie chart data:")
    print("        labels:", labels)
    print("        sizes:", sizes)
    print("        percentages:", percentages)
    print("        code: plt.pie(sizes, labels=labels, autopct='%1.1f%%'); plt.show()")

def ex07():
    """Area chart data"""
    np.random.seed(42)
    x = np.linspace(0, 10, 50)
    y1 = np.sin(x) + 1.5
    y2 = np.cos(x) + 1.5
    print("Ex07 — Area chart data:")
    print("        x (first 5):", x[:5].round(3).tolist())
    print("        y1 (first 5):", y1[:5].round(3).tolist())
    print("        y2 (first 5):", y2[:5].round(3).tolist())
    print("        code: plt.fill_between(x, y1, alpha=0.5); plt.fill_between(x, y2, alpha=0.5); plt.show()")

def ex08():
    """Step chart data"""
    x = [0, 1, 2, 3, 4, 5]
    y = [0, 0.2, 0.4, 0.7, 0.9, 1.0]
    diffs = [round(y[i] - y[i-1], 3) for i in range(1, len(y))]
    print("Ex08 — Step chart data:")
    print("        x:", x)
    print("        y:", y)
    print("        step diffs:", diffs)
    print("        code: plt.step(x, y, where='post'); plt.show()")

def ex09():
    """Stem-and-leaf plot (manual)"""
    data = [12, 14, 15, 21, 23, 28, 31, 35, 39, 42, 43, 47, 51, 55]
    stems = {}
    for val in data:
        stem = val // 10
        leaf = val % 10
        stems.setdefault(stem, []).append(leaf)
    print("Ex09 — Stem-and-leaf plot:")
    for stem, leaves in sorted(stems.items()):
        print(f"        {stem} | {' '.join(map(str, sorted(leaves)))}")

def ex10():
    """Frequency table"""
    np.random.seed(42)
    data = np.random.choice(['A', 'B', 'C', 'D'], 100, p=[0.4, 0.3, 0.2, 0.1])
    freq = pd.Series(data).value_counts().sort_index()
    rel_freq = (freq / len(data)).round(4)
    cum_freq = rel_freq.cumsum().round(4)
    print("Ex10 — Frequency table:")
    for cat in freq.index:
        print(f"        {cat}: count={freq[cat]}, rel={rel_freq[cat]}, cum={cum_freq[cat]}")

def ex11():
    """Cumulative frequency"""
    np.random.seed(0)
    data = np.sort(np.random.exponential(2, 50))
    cumulative = np.arange(1, len(data) + 1) / len(data)
    print("Ex11 — Cumulative frequency (first 5 points):")
    for i in range(5):
        print(f"        x={data[i]:.3f}, CDF={cumulative[i]:.3f}")
    print("        code: plt.plot(data, cumulative); plt.xlabel('Value'); plt.ylabel('CDF'); plt.show()")

def ex12():
    """KDE density estimate points"""
    np.random.seed(42)
    data = np.random.normal(0, 1, 200)
    kde = gaussian_kde(data)
    x_range = np.linspace(data.min(), data.max(), 50)
    density = kde(x_range)
    peak_idx = np.argmax(density)
    print("Ex12 — KDE density estimate:")
    print("        x range:", [round(x_range[0], 3), round(x_range[-1], 3)])
    print("        density at peak x:", round(x_range[peak_idx], 3),
          "| peak density:", round(density[peak_idx], 4))
    print("        5 sample points:", list(zip(x_range[:5].round(3), density[:5].round(4))))
    print("        code: plt.plot(x_range, density); plt.fill_between(x_range, density, alpha=0.3); plt.show()")

def ex13():
    """Rug plot data points"""
    np.random.seed(42)
    data = np.random.normal(5, 1, 30)
    print("Ex13 — Rug plot data (30 points on x-axis):")
    print("        values:", data.round(3).tolist())
    print("        min:", round(data.min(), 3), "| max:", round(data.max(), 3))
    print("        code: plt.plot(data, np.zeros_like(data), '|', ms=20); plt.show()")

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Correlation heatmap data"""
    iris = load_iris()
    df = pd.DataFrame(iris.data, columns=iris.feature_names)
    corr = df.corr().round(3)
    print("Ex14 — Correlation heatmap data:")
    print(corr.to_string())
    print("        code: sns.heatmap(corr, annot=True, cmap='coolwarm'); plt.show()")

def ex15():
    """Violin plot data: quartiles per group"""
    iris = load_iris()
    df = pd.DataFrame(iris.data, columns=iris.feature_names)
    df['species'] = iris.target_names[iris.target]
    col = 'petal length (cm)'
    violin_stats = df.groupby('species')[col].describe()[['25%', '50%', '75%', 'min', 'max']].round(3)
    print("Ex15 — Violin plot stats by species:")
    print(violin_stats.to_string())
    print("        code: sns.violinplot(x='species', y='petal length (cm)', data=df); plt.show()")

def ex16():
    """Swarm/strip plot concept (jitter)"""
    np.random.seed(42)
    groups = {'A': np.random.normal(5, 1, 30), 'B': np.random.normal(7, 1.5, 30)}
    jitter = 0.1
    jittered = {g: (v + np.random.uniform(-jitter, jitter, len(v))).round(3)
                for g, v in groups.items()}
    print("Ex16 — Strip/jitter plot data:")
    for g, vals in jittered.items():
        print(f"        Group {g} (first 5): {vals[:5].tolist()}")
    print("        code: sns.stripplot(x='group', y='value', data=df, jitter=True); plt.show()")

def ex17():
    """Facet grid concept"""
    iris = load_iris()
    df = pd.DataFrame(iris.data, columns=iris.feature_names)
    df['species'] = iris.target_names[iris.target]
    features = ['sepal length (cm)', 'petal length (cm)']
    species_list = df['species'].unique().tolist()
    print("Ex17 — Facet grid data (means per species × feature):")
    for feat in features:
        row = {sp: round(df[df['species'] == sp][feat].mean(), 3) for sp in species_list}
        print(f"        {feat}: {row}")
    print("        code: g = sns.FacetGrid(df, col='species'); g.map(plt.hist, 'sepal length (cm)'); plt.show()")

def ex18():
    """Pair plot data: all pairwise correlations"""
    iris = load_iris()
    df = pd.DataFrame(iris.data, columns=iris.feature_names)
    corr_matrix = df.corr().round(3)
    print("Ex18 — Pair plot correlation matrix:")
    print(corr_matrix.to_string())
    print("        code: sns.pairplot(df, hue='species'); plt.show()")

def ex19():
    """Bubble chart data (x, y, size, color)"""
    np.random.seed(42)
    n = 20
    x = np.random.randn(n).round(3)
    y = np.random.randn(n).round(3)
    size = np.abs(np.random.randn(n) * 200 + 300).round(1)
    color = np.random.choice(['blue', 'red', 'green'], n).tolist()
    print("Ex19 — Bubble chart data (first 5):")
    for i in range(5):
        print(f"        x={x[i]}, y={y[i]}, size={size[i]}, color={color[i]}")
    print("        code: plt.scatter(x, y, s=size, c=color_ids, alpha=0.6, cmap='viridis'); plt.show()")

def ex20():
    """Treemap data (hierarchical dict)"""
    tree = {
        "Supervised": {
            "Classification": 40,
            "Regression": 30,
        },
        "Unsupervised": {
            "Clustering": 20,
            "Dimensionality Reduction": 10,
        },
    }
    flat = []
    for parent, children in tree.items():
        for child, val in children.items():
            flat.append({"path": f"{parent}/{child}", "value": val})
    total = sum(d["value"] for d in flat)
    for d in flat:
        d["pct"] = round(d["value"] / total * 100, 1)
    print("Ex20 — Treemap data:")
    for d in flat:
        print(f"        {d['path']}: value={d['value']}, pct={d['pct']}%")
    print("        code: import squarify; squarify.plot(sizes=[d['value'] for d in flat], label=[d['path'] for d in flat]); plt.show()")

def ex21():
    """Sankey diagram data"""
    flows = [
        ("Raw Data", "Preprocessing", 100),
        ("Preprocessing", "Feature Engineering", 95),
        ("Preprocessing", "Dropped", 5),
        ("Feature Engineering", "Training", 80),
        ("Feature Engineering", "Validation", 15),
    ]
    print("Ex21 — Sankey diagram data:")
    for src, tgt, val in flows:
        print(f"        {src} -> {tgt}: {val}")
    print("        code: import plotly.graph_objects as go; go.Figure(go.Sankey(...))")

def ex22():
    """Parallel coordinates data"""
    iris = load_iris()
    df = pd.DataFrame(iris.data, columns=['SL', 'SW', 'PL', 'PW'])
    df['target'] = iris.target
    sample = df.head(5)
    print("Ex22 — Parallel coordinates data (first 5 rows):")
    print(sample.to_string())
    print("        code: pd.plotting.parallel_coordinates(df, 'target', colormap='tab10'); plt.show()")

def ex23():
    """Radar chart data (polygon values)"""
    categories = ['Accuracy', 'Precision', 'Recall', 'F1', 'AUC']
    model_a = [0.92, 0.89, 0.94, 0.91, 0.95]
    model_b = [0.88, 0.93, 0.82, 0.87, 0.91]
    N = len(categories)
    angles = [2 * np.pi * i / N for i in range(N)]
    angles_closed = angles + [angles[0]]
    vals_a_closed = model_a + [model_a[0]]
    vals_b_closed = model_b + [model_b[0]]
    print("Ex23 — Radar chart data:")
    print("        categories:", categories)
    print("        model_a:", model_a)
    print("        model_b:", model_b)
    print("        angles (rad):", [round(a, 3) for a in angles])
    print("        code: ax = plt.subplot(111, polar=True); ax.plot(angles_closed, vals_a_closed); ax.fill(angles_closed, vals_a_closed, alpha=0.25); plt.show()")

def ex24():
    """Waterfall chart data"""
    items = ['Start', 'Q1 Revenue', 'Q2 Revenue', 'Q1 Cost', 'Q2 Cost', 'End']
    changes = [100, 40, 55, -25, -30, 0]
    running = []
    total = 0
    for c in changes:
        total += c
        running.append(round(total, 2))
    bottoms = [r - c for r, c in zip(running, changes)]
    print("Ex24 — Waterfall chart data:")
    for i, item in enumerate(items):
        print(f"        {item}: change={changes[i]}, running={running[i]}, bottom={bottoms[i]}")
    print("        code: plt.bar(items, changes, bottom=bottoms, color=['g' if c>=0 else 'r' for c in changes]); plt.show()")

def ex25():
    """Gantt chart data"""
    tasks = [
        {"task": "Data Collection", "start": 0, "duration": 5},
        {"task": "EDA", "start": 3, "duration": 4},
        {"task": "Preprocessing", "start": 5, "duration": 6},
        {"task": "Modeling", "start": 9, "duration": 8},
        {"task": "Evaluation", "start": 15, "duration": 3},
        {"task": "Deployment", "start": 17, "duration": 4},
    ]
    print("Ex25 — Gantt chart data:")
    for t in tasks:
        bar = ' ' * t['start'] + '=' * t['duration']
        print(f"        {t['task']:<20} day {t['start']:>2}-{t['start']+t['duration']:>2} |{bar}|")
    print("        code: plt.barh(tasks, durations, left=starts); plt.show()")

def ex26():
    """Stream graph data"""
    np.random.seed(42)
    x = np.arange(20)
    categories = ['A', 'B', 'C', 'D']
    data = {cat: np.abs(np.random.randn(20).cumsum()) + 1 for cat in categories}
    baselines = np.zeros(20)
    for cat, vals in data.items():
        baselines += vals
    stacked = {}
    cum = np.zeros(20)
    for cat, vals in data.items():
        stacked[cat] = (cum.copy(), cum + vals)
        cum += vals
    print("Ex26 — Stream graph data (totals per time step, first 5):")
    print("        x:", x[:5].tolist())
    for cat in categories:
        bottom, top = stacked[cat]
        print(f"        {cat} bottom (5): {bottom[:5].round(2).tolist()}, top: {top[:5].round(2).tolist()}")
    print("        code: ax.stackplot(x, [data[c] for c in categories], labels=categories, alpha=0.6); plt.show()")

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """VisualizationData class: compute all plot data"""
    class VisualizationData:
        def __init__(self, df):
            self.df = df
        def histogram_data(self, col, bins=10):
            counts, edges = np.histogram(self.df[col].dropna(), bins=bins)
            return {"counts": counts.tolist(), "bin_edges": edges.round(3).tolist()}
        def scatter_data(self, col_x, col_y):
            return {"x": self.df[col_x].round(3).tolist(),
                    "y": self.df[col_y].round(3).tolist(),
                    "corr": round(self.df[col_x].corr(self.df[col_y]), 4)}
        def boxplot_data(self, col):
            s = self.df[col].dropna()
            Q1, Q2, Q3 = np.percentile(s, [25, 50, 75])
            return {"Q1": round(Q1, 3), "Q2": round(Q2, 3), "Q3": round(Q3, 3),
                    "IQR": round(Q3 - Q1, 3)}
    iris = load_iris()
    df = pd.DataFrame(iris.data, columns=iris.feature_names)
    vd = VisualizationData(df)
    col = 'sepal length (cm)'
    print("Ex27 — VisualizationData class:")
    print("        histogram:", vd.histogram_data(col, bins=5))
    print("        scatter corr:", vd.scatter_data('sepal length (cm)', 'petal length (cm)')['corr'])
    print("        boxplot:", vd.boxplot_data(col))

def ex28():
    """ROC curve data + optimal threshold"""
    from sklearn.datasets import load_breast_cancer
    bc = load_breast_cancer()
    X_train, X_test = bc.data[:400], bc.data[400:]
    y_train, y_test = bc.target[:400], bc.target[400:]
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)
    lr = LogisticRegression(max_iter=1000, random_state=42)
    lr.fit(X_train_s, y_train)
    y_prob = lr.predict_proba(X_test_s)[:, 1]
    fpr, tpr, thresholds = roc_curve(y_test, y_prob)
    auc = np.trapz(tpr, fpr)
    j_scores = tpr - fpr
    best_idx = np.argmax(j_scores)
    best_threshold = thresholds[best_idx]
    print("Ex28 — ROC curve data:")
    print("        AUC:", round(auc, 4))
    print("        Optimal threshold:", round(best_threshold, 4))
    print("        At optimal — FPR:", round(fpr[best_idx], 4), "TPR:", round(tpr[best_idx], 4))
    print("        FPR (first 5):", fpr[:5].round(4).tolist())
    print("        code: plt.plot(fpr, tpr); plt.xlabel('FPR'); plt.ylabel('TPR'); plt.title(f'AUC={auc:.3f}'); plt.show()")

def ex29():
    """Precision-Recall curve data"""
    from sklearn.datasets import load_breast_cancer
    bc = load_breast_cancer()
    X_train, X_test = bc.data[:400], bc.data[400:]
    y_train, y_test = bc.target[:400], bc.target[400:]
    scaler = StandardScaler()
    lr = LogisticRegression(max_iter=1000, random_state=42)
    lr.fit(scaler.fit_transform(X_train), y_train)
    y_prob = lr.predict_proba(scaler.transform(X_test))[:, 1]
    precision, recall, thresholds = precision_recall_curve(y_test, y_prob)
    avg_prec = np.mean(precision)
    f1_scores = 2 * precision * recall / (precision + recall + 1e-9)
    best_f1_idx = np.argmax(f1_scores)
    print("Ex29 — Precision-Recall curve data:")
    print("        Average precision:", round(avg_prec, 4))
    print("        Best F1:", round(f1_scores[best_f1_idx], 4))
    print("        At best F1 — P:", round(precision[best_f1_idx], 4),
          "R:", round(recall[best_f1_idx], 4))
    print("        code: plt.plot(recall, precision); plt.xlabel('Recall'); plt.ylabel('Precision'); plt.show()")

def ex30():
    """Learning curve data (train/val vs training size)"""
    iris = load_iris()
    X, y = iris.data, iris.target
    pipe = LogisticRegression(max_iter=300, random_state=42)
    train_sizes, train_scores, val_scores = learning_curve(
        pipe, X, y, cv=5, train_sizes=np.linspace(0.2, 1.0, 5), scoring='accuracy')
    train_mean = train_scores.mean(axis=1).round(4)
    val_mean = val_scores.mean(axis=1).round(4)
    print("Ex30 — Learning curve data:")
    print("        train_sizes:", train_sizes.tolist())
    print("        train_mean:", train_mean.tolist())
    print("        val_mean:", val_mean.tolist())
    print("        code: plt.plot(train_sizes, train_mean, label='train'); plt.plot(train_sizes, val_mean, label='val'); plt.legend(); plt.show()")

def ex31():
    """Validation curve data (param vs score)"""
    iris = load_iris()
    X, y = iris.data, iris.target
    from sklearn.neighbors import KNeighborsClassifier
    param_range = [1, 3, 5, 7, 9, 11, 15]
    train_scores, val_scores = validation_curve(
        KNeighborsClassifier(), X, y, param_name='n_neighbors',
        param_range=param_range, cv=5, scoring='accuracy')
    train_mean = train_scores.mean(axis=1).round(4)
    val_mean = val_scores.mean(axis=1).round(4)
    best_k = param_range[np.argmax(val_mean)]
    print("Ex31 — Validation curve data (KNN k vs accuracy):")
    print("        param_range:", param_range)
    print("        train_mean:", train_mean.tolist())
    print("        val_mean:", val_mean.tolist())
    print("        best k:", best_k)
    print("        code: plt.plot(param_range, train_mean, label='train'); plt.plot(param_range, val_mean, label='val'); plt.show()")

def ex32():
    """Calibration curve data"""
    from sklearn.datasets import load_breast_cancer
    from sklearn.calibration import calibration_curve
    bc = load_breast_cancer()
    X_train, X_test = bc.data[:400], bc.data[400:]
    y_train, y_test = bc.target[:400], bc.target[400:]
    scaler = StandardScaler()
    lr = LogisticRegression(max_iter=1000, random_state=42)
    lr.fit(scaler.fit_transform(X_train), y_train)
    y_prob = lr.predict_proba(scaler.transform(X_test))[:, 1]
    fraction_pos, mean_pred_val = calibration_curve(y_test, y_prob, n_bins=5)
    print("Ex32 — Calibration curve data:")
    print("        mean_pred_values:", mean_pred_val.round(4).tolist())
    print("        fraction_positive:", fraction_pos.round(4).tolist())
    brier = np.mean((y_prob - y_test) ** 2)
    print("        Brier score:", round(brier, 4))
    print("        code: plt.plot(mean_pred_val, fraction_pos); plt.plot([0,1],[0,1],'--'); plt.show()")

def ex33():
    """Decision boundary grid data"""
    from sklearn.datasets import make_classification
    X, y = make_classification(n_samples=200, n_features=2, n_informative=2,
                                n_redundant=0, random_state=42)
    lr = LogisticRegression(max_iter=200, random_state=42)
    lr.fit(X, y)
    x_min, x_max = X[:, 0].min() - 0.5, X[:, 0].max() + 0.5
    y_min, y_max = X[:, 1].min() - 0.5, X[:, 1].max() + 0.5
    xx, yy = np.meshgrid(np.linspace(x_min, x_max, 30), np.linspace(y_min, y_max, 30))
    Z = lr.predict(np.c_[xx.ravel(), yy.ravel()]).reshape(xx.shape)
    boundary_count = int((Z[:-1, :] != Z[1:, :]).sum() + (Z[:, :-1] != Z[:, 1:]).sum())
    print("Ex33 — Decision boundary grid:")
    print("        Grid shape:", xx.shape)
    print("        Boundary transitions:", boundary_count)
    print("        Class 0 cells:", int((Z == 0).sum()), "| Class 1 cells:", int((Z == 1).sum()))
    print("        code: plt.contourf(xx, yy, Z, alpha=0.4); plt.scatter(X[:,0], X[:,1], c=y); plt.show()")

def ex34():
    """Feature importance sorted data"""
    from sklearn.ensemble import RandomForestClassifier
    iris = load_iris()
    X = pd.DataFrame(iris.data, columns=iris.feature_names)
    y = iris.target
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf.fit(X, y)
    importances = pd.Series(rf.feature_importances_, index=iris.feature_names)
    sorted_imp = importances.sort_values(ascending=False).round(4)
    print("Ex34 — Feature importance sorted:")
    for feat, imp in sorted_imp.items():
        bar = '#' * int(imp * 50)
        print(f"        {feat:<30}: {imp:.4f} |{bar}")
    print("        code: sorted_imp.plot(kind='barh'); plt.title('Feature Importances'); plt.show()")

def ex35():
    """SHAP-style feature impact data"""
    iris = load_iris()
    X = pd.DataFrame(iris.data, columns=iris.feature_names)
    y = iris.target
    lr = LogisticRegression(max_iter=300, random_state=42)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    lr.fit(X_scaled, y)
    mean_coef = np.abs(lr.coef_).mean(axis=0)
    feature_impact = dict(zip(iris.feature_names, mean_coef.round(4)))
    sorted_impact = sorted(feature_impact.items(), key=lambda x: -x[1])
    print("Ex35 — SHAP-style feature impact (|coef| proxy):")
    for feat, impact in sorted_impact:
        bar = '+' * int(impact * 10)
        print(f"        {feat:<30}: {impact:.4f} |{bar}")
    print("        code: sns.barplot(x=impacts, y=features); plt.title('Mean |SHAP|'); plt.show()")

def ex36():
    """Confusion matrix with percentages"""
    from sklearn.datasets import load_breast_cancer
    from sklearn.neighbors import KNeighborsClassifier
    bc = load_breast_cancer()
    X_train, X_test = bc.data[:400], bc.data[400:]
    y_train, y_test = bc.target[:400], bc.target[400:]
    scaler = StandardScaler()
    knn = KNeighborsClassifier(n_neighbors=5)
    knn.fit(scaler.fit_transform(X_train), y_train)
    y_pred = knn.predict(scaler.transform(X_test))
    cm = confusion_matrix(y_test, y_pred)
    cm_pct = (cm / cm.sum() * 100).round(2)
    print("Ex36 — Confusion matrix (counts):")
    print(cm)
    print("        Confusion matrix (%):")
    print(cm_pct)
    print("        code: sns.heatmap(cm_pct, annot=True, fmt='.1f', cmap='Blues'); plt.show()")

def ex37():
    """Full visualization report data"""
    iris = load_iris()
    df = pd.DataFrame(iris.data, columns=iris.feature_names)
    df['target'] = iris.target
    numeric = df.select_dtypes(include=np.number)
    report = {
        "shape": df.shape,
        "describe": numeric.describe().round(3).to_dict(),
        "correlation": numeric.corr().round(3).to_dict(),
        "class_dist": df['target'].value_counts().to_dict(),
        "skewness": numeric.skew().round(3).to_dict(),
    }
    print("Ex37 — Full visualization report:")
    print("        Shape:", report['shape'])
    print("        Class distribution:", report['class_dist'])
    print("        Skewness:", report['skewness'])
    print("        Correlation (sl vs pl):",
          report['correlation']['sepal length (cm)']['petal length (cm)'])

def ex38():
    """Interactive plot concept (print Plotly code)"""
    plotly_code = """
import plotly.express as px
import plotly.graph_objects as go
from sklearn.datasets import load_iris
import pandas as pd

iris = load_iris()
df = pd.DataFrame(iris.data, columns=iris.feature_names)
df['species'] = iris.target_names[iris.target]

# Interactive scatter plot
fig = px.scatter(
    df, x='sepal length (cm)', y='petal length (cm)',
    color='species', size='petal width (cm)',
    hover_data=iris.feature_names,
    title='Iris Dataset — Interactive Scatter'
)
fig.update_layout(width=700, height=500)
fig.show()  # opens in browser

# Interactive parallel coordinates
fig2 = px.parallel_coordinates(
    df, color=iris.target,
    dimensions=iris.feature_names,
    color_continuous_scale=px.colors.diverging.Tealrose
)
fig2.show()
"""
    print("Ex38 — Interactive Plotly code:")
    print(plotly_code)

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Matplotlib figure code: histogram"""
    code = """
import matplotlib.pyplot as plt
import numpy as np
from sklearn.datasets import load_iris

iris = load_iris()
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
for i, (ax, name) in enumerate(zip(axes.flat, iris.feature_names)):
    ax.hist(iris.data[:, i], bins=20, edgecolor='black', color='steelblue', alpha=0.8)
    ax.set_title(name, fontsize=11)
    ax.set_xlabel('Value')
    ax.set_ylabel('Frequency')
    mean_val = iris.data[:, i].mean()
    ax.axvline(mean_val, color='red', linestyle='--', label=f'mean={mean_val:.2f}')
    ax.legend(fontsize=8)
plt.suptitle('Iris Feature Distributions', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig('iris_histograms.png', dpi=150, bbox_inches='tight')
plt.show()
"""
    print("Ex39 — Matplotlib histogram figure code:")
    print(code)
    np.random.seed(42)
    data = np.random.normal(5, 1.5, 100)
    counts, edges = np.histogram(data, bins=10)
    print("        (Demo data) counts:", counts.tolist())

def ex40():
    """Seaborn heatmap code"""
    code = """
import seaborn as sns
import matplotlib.pyplot as plt
import pandas as pd
from sklearn.datasets import load_iris

iris = load_iris()
df = pd.DataFrame(iris.data, columns=iris.feature_names)
corr = df.corr()

fig, ax = plt.subplots(figsize=(7, 6))
mask = np.triu(np.ones_like(corr, dtype=bool))
sns.heatmap(
    corr, mask=mask, annot=True, fmt='.2f',
    cmap='coolwarm', center=0, vmin=-1, vmax=1,
    square=True, linewidths=0.5, ax=ax
)
ax.set_title('Iris Feature Correlation Heatmap', fontsize=14, pad=15)
plt.tight_layout()
plt.savefig('correlation_heatmap.png', dpi=150, bbox_inches='tight')
plt.show()
"""
    print("Ex40 — Seaborn heatmap code:")
    print(code)
    iris = load_iris()
    df = pd.DataFrame(iris.data, columns=iris.feature_names)
    corr = df.corr().round(2)
    print("        (Actual correlation matrix):")
    print(corr.to_string())

def ex41():
    """Plotly scatter code"""
    code = """
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd, numpy as np
from sklearn.datasets import load_iris

iris = load_iris()
df = pd.DataFrame(iris.data, columns=iris.feature_names)
df['species'] = iris.target_names[iris.target]

fig = px.scatter_matrix(
    df, dimensions=iris.feature_names, color='species',
    title='Iris Pair Plot (Plotly)',
    labels={col: col.replace(' (cm)', '') for col in iris.feature_names}
)
fig.update_traces(diagonal_visible=False, showupperhalf=False)
fig.update_layout(width=900, height=900)
fig.write_html('iris_scatter_matrix.html')
fig.show()
"""
    print("Ex41 — Plotly scatter matrix code:")
    print(code)
    iris = load_iris()
    df = pd.DataFrame(iris.data, columns=iris.feature_names)
    print("        (Actual data shape):", df.shape)

def ex42():
    """Altair chart code"""
    code = """
import altair as alt
import pandas as pd
from sklearn.datasets import load_iris

iris = load_iris()
df = pd.DataFrame(iris.data, columns=iris.feature_names)
df['species'] = iris.target_names[iris.target]
df.columns = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width', 'species']

brush = alt.selection_interval()

points = alt.Chart(df).mark_point().encode(
    x='sepal_length:Q',
    y='petal_length:Q',
    color=alt.condition(brush, 'species:N', alt.value('lightgray')),
    tooltip=['sepal_length', 'petal_length', 'species']
).add_params(brush).properties(width=300, height=300, title='Sepal vs Petal Length')

bars = alt.Chart(df).mark_bar().encode(
    x='count()',
    y='species:N',
    color='species:N'
).transform_filter(brush).properties(width=300, title='Count by Species (filtered)')

chart = (points | bars).properties(title='Iris Interactive Dashboard')
chart.save('iris_altair.html')
"""
    print("Ex42 — Altair interactive chart code:")
    print(code)

def ex43():
    """Bokeh concept"""
    code = """
from bokeh.plotting import figure, show, output_file
from bokeh.models import ColumnDataSource, HoverTool, ColorBar
from bokeh.transform import linear_cmap
from bokeh.palettes import Viridis256
import numpy as np, pandas as pd
from sklearn.datasets import load_iris

iris = load_iris()
df = pd.DataFrame(iris.data, columns=['sepal_length','sepal_width','petal_length','petal_width'])
df['species'] = iris.target

source = ColumnDataSource(df)
p = figure(
    title='Iris Scatter (Bokeh)',
    x_axis_label='Sepal Length', y_axis_label='Petal Length',
    width=600, height=400, tools='pan,wheel_zoom,box_select,reset,save'
)
mapper = linear_cmap('species', Viridis256, low=0, high=2)
p.circle('sepal_length', 'petal_length', source=source,
         size=8, color=mapper, alpha=0.7)
p.add_tools(HoverTool(tooltips=[('Species','@species'),('SL','@sepal_length'),('PL','@petal_length')]))
output_file('iris_bokeh.html')
show(p)
"""
    print("Ex43 — Bokeh interactive plot code:")
    print(code)

def ex44():
    """Matplotlib animation concept"""
    code = """
import matplotlib.pyplot as plt
import matplotlib.animation as animation
import numpy as np

fig, ax = plt.subplots(figsize=(8, 5))
x = np.linspace(0, 2 * np.pi, 200)
line, = ax.plot(x, np.sin(x), lw=2)
ax.set_xlim(0, 2 * np.pi)
ax.set_ylim(-1.5, 1.5)
ax.set_title('Animated Sine Wave')
ax.grid(True, alpha=0.3)

def animate(frame):
    line.set_ydata(np.sin(x + frame * np.pi / 30))
    ax.set_title(f'Animated Sine Wave — frame {frame}')
    return line,

ani = animation.FuncAnimation(
    fig, animate, frames=60, interval=50, blit=True
)
ani.save('sine_wave.gif', writer='pillow', fps=20)
plt.show()
"""
    print("Ex44 — Matplotlib animation code:")
    print(code)

def ex45():
    """3D scatter plot code (mpl3d)"""
    code = """
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import numpy as np
from sklearn.datasets import load_iris
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

iris = load_iris()
X = StandardScaler().fit_transform(iris.data)
pca = PCA(n_components=3)
X_3d = pca.fit_transform(X)
colors = ['#e41a1c', '#377eb8', '#4daf4a']
labels = iris.target_names

fig = plt.figure(figsize=(9, 7))
ax = fig.add_subplot(111, projection='3d')
for i, (color, label) in enumerate(zip(colors, labels)):
    mask = iris.target == i
    ax.scatter(X_3d[mask, 0], X_3d[mask, 1], X_3d[mask, 2],
               c=color, label=label, s=40, alpha=0.8)
ax.set_xlabel(f'PC1 ({pca.explained_variance_ratio_[0]:.1%})')
ax.set_ylabel(f'PC2 ({pca.explained_variance_ratio_[1]:.1%})')
ax.set_zlabel(f'PC3 ({pca.explained_variance_ratio_[2]:.1%})')
ax.set_title('Iris 3D PCA Plot')
ax.legend()
plt.tight_layout()
plt.savefig('iris_3d_pca.png', dpi=150)
plt.show()
"""
    print("Ex45 — 3D scatter plot code:")
    print(code)
    iris = load_iris()
    X = StandardScaler().fit_transform(iris.data)
    pca = PCA(n_components=3)
    X_3d = pca.fit_transform(X)
    print("        (Actual 3D PCA shape):", X_3d.shape,
          "| explained variance:", pca.explained_variance_ratio_.round(3).tolist())

def ex46():
    """Geographic plot concept"""
    code = """
import plotly.express as px
import pandas as pd

# Sample city data
cities = pd.DataFrame({
    'city': ['New York', 'London', 'Tokyo', 'Sydney', 'Paris', 'Berlin', 'Toronto'],
    'lat':  [40.71, 51.51, 35.69, -33.87, 48.85, 52.52, 43.65],
    'lon':  [-74.01, -0.13, 139.69, 151.21, 2.35, 13.40, -79.38],
    'ml_jobs': [15000, 8000, 12000, 4000, 6000, 5000, 7000],
    'avg_salary': [130000, 90000, 75000, 85000, 80000, 85000, 100000],
})

fig = px.scatter_geo(
    cities, lat='lat', lon='lon',
    size='ml_jobs', color='avg_salary',
    hover_name='city',
    title='ML Job Market by City',
    size_max=30,
    color_continuous_scale='Viridis',
    projection='natural earth'
)
fig.update_layout(width=800, height=500)
fig.show()
"""
    print("Ex46 — Geographic plot concept code:")
    print(code)

def ex47():
    """Custom color palette"""
    def create_palette(name, n):
        palettes = {
            "ml_blues": ["#cce5ff", "#99ccff", "#66b2ff", "#3399ff", "#0080ff",
                         "#0066cc", "#004d99", "#003366"],
            "traffic_light": ["#ff4444", "#ff8800", "#ffcc00", "#44bb44"],
            "diverging": ["#d73027", "#f46d43", "#fdae61", "#fee090", "#e0f3f8",
                          "#abd9e9", "#74add1", "#4575b4"],
        }
        palette = palettes.get(name, ["#333333"])
        return palette[:n] if n <= len(palette) else palette
    for name in ["ml_blues", "traffic_light", "diverging"]:
        colors = create_palette(name, 5)
        print(f"Ex47 — Custom palette '{name}' (5 colors): {colors}")
    print("        code: plt.rcParams['axes.prop_cycle'] = plt.cycler(color=palette)")

def ex48():
    """Publication-quality figure settings"""
    settings = {
        "figure.dpi": 300,
        "figure.figsize": [7, 5],
        "font.family": "serif",
        "font.size": 12,
        "axes.labelsize": 13,
        "axes.titlesize": 14,
        "axes.titleweight": "bold",
        "axes.linewidth": 1.2,
        "axes.grid": True,
        "grid.alpha": 0.3,
        "xtick.labelsize": 11,
        "ytick.labelsize": 11,
        "legend.fontsize": 10,
        "legend.framealpha": 0.9,
        "lines.linewidth": 2.0,
        "savefig.bbox": "tight",
        "savefig.format": "pdf",
    }
    print("Ex48 — Publication-quality figure settings:")
    for k, v in settings.items():
        print(f"        plt.rcParams['{k}'] = {v!r}")
    print("        Usage: plt.rcParams.update(settings)")

def ex49():
    """Dashboard layout concept"""
    layout_code = """
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from sklearn.datasets import load_iris
import numpy as np, pandas as pd

iris = load_iris()
df = pd.DataFrame(iris.data, columns=iris.feature_names)
df['target'] = iris.target

fig = plt.figure(figsize=(14, 10))
fig.suptitle('Iris EDA Dashboard', fontsize=16, fontweight='bold')
gs = gridspec.GridSpec(3, 3, figure=fig, hspace=0.4, wspace=0.35)

# Top-left: class distribution bar chart
ax1 = fig.add_subplot(gs[0, 0])
df['target'].value_counts().sort_index().plot(kind='bar', ax=ax1, color='steelblue', edgecolor='black')
ax1.set_title('Class Distribution'); ax1.set_xlabel('Class'); ax1.set_ylabel('Count')

# Top-middle + right: petal scatter
ax2 = fig.add_subplot(gs[0, 1:])
colors = ['#e41a1c', '#377eb8', '#4daf4a']
for i in range(3):
    mask = df['target'] == i
    ax2.scatter(df.loc[mask,'sepal length (cm)'], df.loc[mask,'petal length (cm)'],
                color=colors[i], label=iris.target_names[i], alpha=0.7, s=30)
ax2.set_xlabel('Sepal Length'); ax2.set_ylabel('Petal Length')
ax2.set_title('Sepal vs Petal Length'); ax2.legend()

# Middle row: histograms for all 4 features
for i in range(4):
    ax = fig.add_subplot(gs[1, i % 3] if i < 3 else gs[2, 0])
    ax.hist(iris.data[:, i], bins=20, color='teal', alpha=0.7, edgecolor='black')
    ax.set_title(iris.feature_names[i], fontsize=9)

# Bottom: correlation heatmap
import seaborn as sns
ax_heatmap = fig.add_subplot(gs[2, 1:])
sns.heatmap(df.select_dtypes(include='number').corr(), annot=True, fmt='.2f',
            cmap='coolwarm', ax=ax_heatmap, cbar=False)
ax_heatmap.set_title('Correlation Heatmap')

plt.savefig('iris_dashboard.png', dpi=150, bbox_inches='tight')
plt.show()
"""
    print("Ex49 — Dashboard layout code:")
    print(layout_code)

def ex50():
    """Visualization best practices (15 tips)"""
    tips = [
        "1.  Choose the right chart type for your data type and goal",
        "2.  Always label axes with units — 'Salary (USD)' not just 'Salary'",
        "3.  Use colorblind-friendly palettes (e.g., viridis, cividis, okabe-ito)",
        "4.  Minimize chart junk — remove unnecessary gridlines and borders",
        "5.  Start bar charts at zero to avoid misleading comparisons",
        "6.  Use log scale for data spanning many orders of magnitude",
        "7.  Add uncertainty bands (CI, std) to line/scatter plots when applicable",
        "8.  Use consistent colors across all charts in a report/dashboard",
        "9.  Show data distribution (violin/box) alongside point estimates",
        "10. Annotate key insights directly on the chart — avoid long captions",
        "11. For large datasets, use hexbin or density plots instead of scatter",
        "12. Order bar charts by value (descending) unless category order matters",
        "13. Use small multiples (facets) for subgroup comparisons",
        "14. Set DPI ≥ 150 for figures destined for print or presentations",
        "15. Always add a descriptive title that conveys the main takeaway",
    ]
    print("Ex50 — Data Visualization Best Practices (15 tips):")
    for tip in tips:
        print("   ", tip)


def main():
    print("=" * 60)
    print("Examples 2.4 — Data Visualization")
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
