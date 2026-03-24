# ============================================================
# Examples 2.1 — Exploratory Data Analysis (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import pandas as pd
from sklearn.datasets import load_iris, load_wine, load_breast_cancer, make_classification
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from scipy import stats

# Shared dataset
def get_iris_df():
    iris = load_iris()
    df = pd.DataFrame(iris.data, columns=iris.feature_names)
    df['target'] = iris.target
    return df

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Load iris dataset as DataFrame"""
    iris = load_iris()
    df = pd.DataFrame(iris.data, columns=iris.feature_names)
    df['target'] = iris.target
    print("Ex01 —", "Iris DataFrame loaded:", df.shape, "| columns:", list(df.columns))

def ex02():
    """Shape and dtypes"""
    df = get_iris_df()
    print("Ex02 — Shape:", df.shape, "| dtypes:", df.dtypes.to_dict())

def ex03():
    """describe() summary statistics"""
    df = get_iris_df()
    desc = df.describe().round(2)
    print("Ex03 — describe() mean row:", desc.loc['mean'].to_dict())

def ex04():
    """head and tail"""
    df = get_iris_df()
    print("Ex04 — head(2):\n", df.head(2).to_string(), "\ntail(2):\n", df.tail(2).to_string())

def ex05():
    """Missing values count"""
    df = get_iris_df()
    df.loc[0, 'sepal length (cm)'] = np.nan
    missing = df.isnull().sum()
    print("Ex05 — Missing values:\n", missing[missing > 0].to_dict())

def ex06():
    """Unique values per column"""
    df = get_iris_df()
    uniques = {col: df[col].nunique() for col in df.columns}
    print("Ex06 — Unique counts:", uniques)

def ex07():
    """Value counts for target (categorical)"""
    df = get_iris_df()
    vc = df['target'].value_counts().to_dict()
    print("Ex07 — Target value counts:", vc)

def ex08():
    """Min / max / mean per column"""
    df = get_iris_df()
    stats_dict = {col: {"min": round(df[col].min(), 2),
                        "max": round(df[col].max(), 2),
                        "mean": round(df[col].mean(), 2)}
                  for col in df.select_dtypes(include=np.number).columns}
    print("Ex08 — Stats per column:", stats_dict)

def ex09():
    """nunique per column"""
    df = get_iris_df()
    print("Ex09 — nunique:", df.nunique().to_dict())

def ex10():
    """select_dtypes for numeric columns"""
    df = get_iris_df()
    numeric_df = df.select_dtypes(include=np.number)
    print("Ex10 — Numeric columns:", list(numeric_df.columns))

def ex11():
    """Boolean indexing: rows where sepal length > 6"""
    df = get_iris_df()
    filtered = df[df['sepal length (cm)'] > 6.0]
    print("Ex11 — Rows with sepal length > 6:", len(filtered), "out of", len(df))

def ex12():
    """sort_values by petal length descending"""
    df = get_iris_df()
    sorted_df = df.sort_values('petal length (cm)', ascending=False)
    print("Ex12 — Top 3 petal length:", sorted_df['petal length (cm)'].head(3).tolist())

def ex13():
    """reset_index after filtering"""
    df = get_iris_df()
    filtered = df[df['target'] == 0].reset_index(drop=True)
    print("Ex13 — Filtered & reset index, new index start:", filtered.index[0], "| shape:", filtered.shape)

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Correlation matrix for numeric columns"""
    df = get_iris_df()
    corr = df.select_dtypes(include=np.number).corr().round(2)
    print("Ex14 — Correlation matrix (petal len vs petal wid):",
          corr.loc['petal length (cm)', 'petal width (cm)'])

def ex15():
    """Top 5 correlated pairs"""
    df = get_iris_df()
    corr = df.select_dtypes(include=np.number).corr().abs()
    pairs = (corr.where(np.triu(np.ones(corr.shape), k=1).astype(bool))
             .stack().sort_values(ascending=False))
    print("Ex15 — Top 5 correlated pairs:\n", pairs.head(5).to_dict())

def ex16():
    """Class distribution (target counts and proportions)"""
    df = get_iris_df()
    dist = df['target'].value_counts()
    props = (dist / len(df)).round(3)
    print("Ex16 — Class distribution counts:", dist.to_dict(), "| proportions:", props.to_dict())

def ex17():
    """Outlier detection using IQR per column"""
    df = get_iris_df()
    outlier_counts = {}
    for col in df.select_dtypes(include=np.number).columns:
        Q1, Q3 = df[col].quantile(0.25), df[col].quantile(0.75)
        IQR = Q3 - Q1
        outliers = df[(df[col] < Q1 - 1.5 * IQR) | (df[col] > Q3 + 1.5 * IQR)]
        outlier_counts[col] = len(outliers)
    print("Ex17 — IQR outlier counts:", outlier_counts)

def ex18():
    """Outlier detection using Z-score per column"""
    df = get_iris_df()
    numeric = df.select_dtypes(include=np.number)
    z_scores = np.abs(stats.zscore(numeric))
    outlier_counts = {col: int((z_scores[:, i] > 3).sum())
                      for i, col in enumerate(numeric.columns)}
    print("Ex18 — Z-score outlier counts (|z|>3):", outlier_counts)

def ex19():
    """Distribution stats: skewness and kurtosis"""
    df = get_iris_df()
    skew = df.select_dtypes(include=np.number).skew().round(3).to_dict()
    kurt = df.select_dtypes(include=np.number).kurt().round(3).to_dict()
    print("Ex19 — Skewness:", skew)
    print("        Kurtosis:", kurt)

def ex20():
    """Feature ranges: min-max normalized"""
    df = get_iris_df()
    numeric = df.select_dtypes(include=np.number)
    normed = (numeric - numeric.min()) / (numeric.max() - numeric.min())
    print("Ex20 — Min-max normalized ranges (min, max):",
          {col: (round(normed[col].min(), 2), round(normed[col].max(), 2))
           for col in normed.columns})

def ex21():
    """Variance per feature"""
    df = get_iris_df()
    var = df.select_dtypes(include=np.number).var().round(4).to_dict()
    print("Ex21 — Variance per feature:", var)

def ex22():
    """Coefficient of variation (std/mean) per feature"""
    df = get_iris_df()
    numeric = df.select_dtypes(include=np.number)
    cv = (numeric.std() / numeric.mean()).round(4).to_dict()
    print("Ex22 — Coefficient of variation:", cv)

def ex23():
    """Pairwise correlations heatmap data (flattened)"""
    df = get_iris_df()
    corr = df.select_dtypes(include=np.number).corr().round(2)
    flat = {f"{r}-{c}": corr.loc[r, c]
            for r in corr.index for c in corr.columns if r < c}
    print("Ex23 — Pairwise correlations (sample 3):",
          dict(list(flat.items())[:3]))

def ex24():
    """Duplicate row detection"""
    df = get_iris_df()
    df = pd.concat([df, df.iloc[:5]], ignore_index=True)
    n_dupes = df.duplicated().sum()
    print("Ex24 — Duplicate rows:", n_dupes, "| total rows:", len(df))

def ex25():
    """Missing value patterns"""
    df = get_iris_df()
    df.loc[0:4, 'sepal length (cm)'] = np.nan
    df.loc[10:14, 'petal length (cm)'] = np.nan
    miss_pattern = df.isnull().sum()
    miss_pct = (miss_pattern / len(df) * 100).round(2)
    print("Ex25 — Missing value patterns (count):", miss_pattern[miss_pattern > 0].to_dict())
    print("        Missing percentage:", miss_pct[miss_pct > 0].to_dict())

def ex26():
    """Data quality report"""
    df = get_iris_df()
    report = {
        "rows": len(df),
        "cols": len(df.columns),
        "missing_total": int(df.isnull().sum().sum()),
        "duplicates": int(df.duplicated().sum()),
        "numeric_cols": len(df.select_dtypes(include=np.number).columns),
    }
    print("Ex26 — Data quality report:", report)

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """EDAReport class: run all checks, generate dict"""
    class EDAReport:
        def __init__(self, df):
            self.df = df
        def run(self):
            numeric = self.df.select_dtypes(include=np.number)
            return {
                "shape": self.df.shape,
                "missing": self.df.isnull().sum().to_dict(),
                "duplicates": int(self.df.duplicated().sum()),
                "dtypes": self.df.dtypes.astype(str).to_dict(),
                "means": numeric.mean().round(3).to_dict(),
                "stds": numeric.std().round(3).to_dict(),
            }
    df = get_iris_df()
    report = EDAReport(df).run()
    print("Ex27 — EDAReport shape:", report['shape'], "| means sample:",
          dict(list(report['means'].items())[:2]))

def ex28():
    """OutlierDetector class: fit + detect"""
    class OutlierDetector:
        def __init__(self, method='iqr'):
            self.method = method
            self.bounds = {}
        def fit(self, df):
            for col in df.select_dtypes(include=np.number).columns:
                Q1, Q3 = df[col].quantile(0.25), df[col].quantile(0.75)
                IQR = Q3 - Q1
                self.bounds[col] = (Q1 - 1.5 * IQR, Q3 + 1.5 * IQR)
            return self
        def detect(self, df):
            mask = pd.Series([False] * len(df), index=df.index)
            for col, (lo, hi) in self.bounds.items():
                mask |= (df[col] < lo) | (df[col] > hi)
            return df[mask]
    df = get_iris_df()
    od = OutlierDetector().fit(df)
    outliers = od.detect(df)
    print("Ex28 — OutlierDetector found", len(outliers), "outlier rows")

def ex29():
    """DistributionAnalyzer class"""
    class DistributionAnalyzer:
        def __init__(self, df):
            self.df = df.select_dtypes(include=np.number)
        def analyze(self):
            return {col: {
                "skew": round(self.df[col].skew(), 3),
                "kurt": round(self.df[col].kurt(), 3),
                "normal_pval": round(stats.shapiro(self.df[col][:50])[1], 4)
            } for col in self.df.columns}
    df = get_iris_df()
    result = DistributionAnalyzer(df).analyze()
    first_col = list(result.keys())[0]
    print("Ex29 — DistributionAnalyzer for", first_col, ":", result[first_col])

def ex30():
    """CorrelationAnalyzer class"""
    class CorrelationAnalyzer:
        def __init__(self, df):
            self.df = df.select_dtypes(include=np.number)
        def top_pairs(self, n=5):
            corr = self.df.corr().abs()
            pairs = (corr.where(np.triu(np.ones(corr.shape), k=1).astype(bool))
                     .stack().sort_values(ascending=False))
            return pairs.head(n)
        def highly_correlated(self, threshold=0.9):
            corr = self.df.corr().abs()
            pairs = corr.where(np.triu(np.ones(corr.shape), k=1).astype(bool)).stack()
            return pairs[pairs > threshold]
    df = get_iris_df()
    ca = CorrelationAnalyzer(df)
    print("Ex30 — Top pair:", ca.top_pairs(1).to_dict())
    print("        High corr (>0.9):", len(ca.highly_correlated(0.9)), "pairs")

def ex31():
    """DataQualityChecker class: nulls + types + ranges + duplicates"""
    class DataQualityChecker:
        def __init__(self, df):
            self.df = df
        def check_nulls(self):
            return self.df.isnull().sum()[self.df.isnull().sum() > 0].to_dict()
        def check_types(self):
            return self.df.dtypes.astype(str).to_dict()
        def check_ranges(self):
            numeric = self.df.select_dtypes(include=np.number)
            return {col: (round(numeric[col].min(), 2), round(numeric[col].max(), 2))
                    for col in numeric.columns}
        def check_duplicates(self):
            return int(self.df.duplicated().sum())
        def full_report(self):
            return {"nulls": self.check_nulls(), "duplicates": self.check_duplicates(),
                    "ranges_sample": dict(list(self.check_ranges().items())[:2])}
    df = get_iris_df()
    report = DataQualityChecker(df).full_report()
    print("Ex31 — DataQualityChecker:", report)

def ex32():
    """FeatureProfiler class"""
    class FeatureProfiler:
        def __init__(self, df):
            self.df = df
        def profile(self, col):
            s = self.df[col]
            return {
                "dtype": str(s.dtype),
                "missing": int(s.isnull().sum()),
                "unique": int(s.nunique()),
                "mean": round(float(s.mean()), 3) if s.dtype != object else None,
                "std": round(float(s.std()), 3) if s.dtype != object else None,
            }
        def profile_all(self):
            return {col: self.profile(col) for col in self.df.columns}
    df = get_iris_df()
    fp = FeatureProfiler(df)
    col = 'sepal length (cm)'
    print("Ex32 — FeatureProfiler for", col, ":", fp.profile(col))

def ex33():
    """TargetAnalyzer class: distribution by target"""
    class TargetAnalyzer:
        def __init__(self, df, target_col):
            self.df = df
            self.target = target_col
        def mean_by_target(self):
            return self.df.groupby(self.target).mean().round(3).to_dict()
        def std_by_target(self):
            return self.df.groupby(self.target).std().round(3).to_dict()
        def count_by_target(self):
            return self.df[self.target].value_counts().to_dict()
    df = get_iris_df()
    ta = TargetAnalyzer(df, 'target')
    print("Ex33 — TargetAnalyzer counts:", ta.count_by_target())
    mean_dict = ta.mean_by_target()
    print("        Mean sepal length by target:",
          {k: v['sepal length (cm)'] for k, v in mean_dict.items()})

def ex34():
    """MultivariateSummary class"""
    class MultivariateSummary:
        def __init__(self, df):
            self.df = df.select_dtypes(include=np.number)
        def covariance_matrix(self):
            return self.df.cov().round(3)
        def correlation_matrix(self):
            return self.df.corr().round(3)
        def pca_variance(self, n_components=2):
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(self.df.dropna())
            pca = PCA(n_components=n_components)
            pca.fit(X_scaled)
            return pca.explained_variance_ratio_.round(3).tolist()
    df = get_iris_df()
    ms = MultivariateSummary(df)
    print("Ex34 — MultivariateSummary PCA variance (2 components):", ms.pca_variance())

def ex35():
    """Full EDA pipeline function"""
    def full_eda_pipeline(df, target_col=None):
        results = {}
        results['shape'] = df.shape
        results['missing_pct'] = (df.isnull().sum() / len(df) * 100).round(2).to_dict()
        results['duplicates'] = int(df.duplicated().sum())
        numeric = df.select_dtypes(include=np.number)
        results['numeric_summary'] = numeric.describe().round(3).loc[['mean', 'std']].to_dict()
        results['skewness'] = numeric.skew().round(3).to_dict()
        if target_col and target_col in df.columns:
            results['target_dist'] = df[target_col].value_counts().to_dict()
        return results
    df = get_iris_df()
    pipeline_result = full_eda_pipeline(df, 'target')
    print("Ex35 — Full EDA pipeline shape:", pipeline_result['shape'],
          "| skewness sample:", dict(list(pipeline_result['skewness'].items())[:2]))

def ex36():
    """EDA comparison: two datasets"""
    def compare_eda(df1, df2, name1="df1", name2="df2"):
        numeric1 = df1.select_dtypes(include=np.number)
        numeric2 = df2.select_dtypes(include=np.number)
        return {
            "shapes": {name1: df1.shape, name2: df2.shape},
            "missing": {name1: int(df1.isnull().sum().sum()),
                        name2: int(df2.isnull().sum().sum())},
            "numeric_cols": {name1: len(numeric1.columns),
                             name2: len(numeric2.columns)},
        }
    iris_df = get_iris_df()
    wine = load_wine()
    wine_df = pd.DataFrame(wine.data, columns=wine.feature_names)
    wine_df['target'] = wine.target
    comparison = compare_eda(iris_df, wine_df, "iris", "wine")
    print("Ex36 — EDA comparison:", comparison)

def ex37():
    """Automated feature flagging"""
    def flag_features(df):
        flags = {}
        numeric = df.select_dtypes(include=np.number)
        for col in numeric.columns:
            col_flags = []
            if numeric[col].isnull().sum() > 0:
                col_flags.append("has_missing")
            if abs(numeric[col].skew()) > 1:
                col_flags.append("high_skew")
            Q1, Q3 = numeric[col].quantile(0.25), numeric[col].quantile(0.75)
            IQR = Q3 - Q1
            n_outliers = ((numeric[col] < Q1 - 1.5*IQR) | (numeric[col] > Q3 + 1.5*IQR)).sum()
            if n_outliers > 0:
                col_flags.append(f"{n_outliers}_outliers")
            if numeric[col].std() < 0.01:
                col_flags.append("near_zero_variance")
            flags[col] = col_flags if col_flags else ["ok"]
        return flags
    df = get_iris_df()
    flags = flag_features(df)
    print("Ex37 — Feature flags:", flags)

def ex38():
    """Statistical anomaly detection in EDA"""
    def detect_statistical_anomalies(df):
        anomalies = []
        numeric = df.select_dtypes(include=np.number)
        for col in numeric.columns:
            z = np.abs(stats.zscore(numeric[col].dropna()))
            extreme = numeric[col][z > 3]
            if len(extreme) > 0:
                anomalies.append({
                    "column": col,
                    "n_anomalies": len(extreme),
                    "anomaly_values": extreme.round(3).tolist()[:3]
                })
        return anomalies
    df = get_iris_df()
    anomalies = detect_statistical_anomalies(df)
    print("Ex38 — Statistical anomalies:", anomalies)

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Dimensionality assessment using PCA explained variance"""
    df = get_iris_df()
    X = df.select_dtypes(include=np.number).drop(columns=['target'], errors='ignore')
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    pca = PCA()
    pca.fit(X_scaled)
    cumulative_var = np.cumsum(pca.explained_variance_ratio_).round(3)
    n_95 = int(np.argmax(cumulative_var >= 0.95)) + 1
    print("Ex39 — PCA explained variance:", pca.explained_variance_ratio_.round(3).tolist())
    print("        Cumulative:", cumulative_var.tolist())
    print("        Components needed for 95% variance:", n_95)

def ex40():
    """Multicollinearity detection using VIF"""
    from sklearn.linear_model import LinearRegression
    df = get_iris_df()
    numeric = df.select_dtypes(include=np.number).drop(columns=['target'], errors='ignore')
    vif_scores = {}
    for i, col in enumerate(numeric.columns):
        y = numeric[col].values
        X = numeric.drop(columns=[col]).values
        lr = LinearRegression().fit(X, y)
        ss_res = np.sum((y - lr.predict(X)) ** 2)
        ss_tot = np.sum((y - y.mean()) ** 2)
        r2 = 1 - ss_res / ss_tot if ss_tot > 0 else 0
        vif = 1 / (1 - r2) if r2 < 1 else float('inf')
        vif_scores[col] = round(vif, 2)
    print("Ex40 — VIF scores (multicollinearity):", vif_scores)
    high_vif = {k: v for k, v in vif_scores.items() if v > 10}
    print("        High VIF features (>10):", high_vif)

def ex41():
    """Feature clustering: group correlated features"""
    df = get_iris_df()
    numeric = df.select_dtypes(include=np.number).drop(columns=['target'], errors='ignore')
    corr = numeric.corr().abs()
    threshold = 0.8
    clusters = []
    assigned = set()
    for col in corr.columns:
        if col in assigned:
            continue
        cluster = [col]
        assigned.add(col)
        for other in corr.columns:
            if other != col and other not in assigned and corr.loc[col, other] > threshold:
                cluster.append(other)
                assigned.add(other)
        clusters.append(cluster)
    print("Ex41 — Feature clusters (corr > 0.8):", clusters)

def ex42():
    """Target leakage detection concept"""
    def detect_leakage(df, target_col, threshold=0.95):
        if target_col not in df.columns:
            return []
        corr = df.corr().abs()
        target_corr = corr[target_col].drop(target_col)
        leaky = target_corr[target_corr > threshold]
        return {"leaky_features": leaky.to_dict(), "threshold": threshold}
    df = get_iris_df()
    df['leaked'] = df['target'] * 2 + np.random.normal(0, 0.001, len(df))
    result = detect_leakage(df, 'target', threshold=0.95)
    print("Ex42 — Target leakage detection:", result)

def ex43():
    """Temporal pattern detection (simulated time series data)"""
    np.random.seed(42)
    dates = pd.date_range('2023-01-01', periods=100, freq='D')
    values = np.sin(np.linspace(0, 4 * np.pi, 100)) + np.random.normal(0, 0.1, 100)
    ts = pd.Series(values, index=dates)
    monthly_mean = ts.resample('ME').mean().round(3)
    rolling_std = ts.rolling(7).std().dropna().round(3)
    trend = np.polyfit(np.arange(len(ts)), ts.values, 1)
    print("Ex43 — Temporal patterns | monthly means:", monthly_mean.tolist()[:3])
    print("        Rolling std (first 3):", rolling_std.values[:3].tolist())
    print("        Linear trend slope:", round(trend[0], 5))

def ex44():
    """Interaction effect detection"""
    df = get_iris_df()
    numeric = df.select_dtypes(include=np.number)
    target = df['target']
    interaction_scores = {}
    cols = [c for c in numeric.columns if c != 'target']
    for i in range(min(3, len(cols))):
        for j in range(i + 1, min(4, len(cols))):
            col_a, col_b = cols[i], cols[j]
            interaction = numeric[col_a] * numeric[col_b]
            corr_main_a = abs(numeric[col_a].corr(target))
            corr_main_b = abs(numeric[col_b].corr(target))
            corr_interaction = abs(interaction.corr(target))
            gain = corr_interaction - max(corr_main_a, corr_main_b)
            interaction_scores[f"{col_a} x {col_b}"] = round(gain, 4)
    print("Ex44 — Interaction effect scores:", interaction_scores)

def ex45():
    """EDA for imbalanced datasets"""
    X, y = make_classification(n_samples=1000, n_features=5, weights=[0.9, 0.1],
                               random_state=42)
    df = pd.DataFrame(X, columns=[f'f{i}' for i in range(5)])
    df['target'] = y
    class_counts = df['target'].value_counts()
    imbalance_ratio = class_counts.max() / class_counts.min()
    minority_stats = df[df['target'] == 1].describe().round(3).loc['mean'].to_dict()
    majority_stats = df[df['target'] == 0].describe().round(3).loc['mean'].to_dict()
    print("Ex45 — Imbalanced EDA | class counts:", class_counts.to_dict())
    print("        Imbalance ratio:", round(imbalance_ratio, 2))
    print("        Minority mean f0:", round(minority_stats['f0'], 3))

def ex46():
    """EDA for time series data"""
    np.random.seed(0)
    n = 120
    trend = np.linspace(0, 5, n)
    seasonal = 2 * np.sin(2 * np.pi * np.arange(n) / 12)
    noise = np.random.normal(0, 0.5, n)
    ts_values = trend + seasonal + noise
    ts = pd.Series(ts_values, index=pd.date_range('2014-01', periods=n, freq='ME'))
    autocorr_lag1 = round(ts.autocorr(lag=1), 3)
    autocorr_lag12 = round(ts.autocorr(lag=12), 3)
    rolling_mean = ts.rolling(12).mean().dropna().round(3)
    print("Ex46 — Time series EDA | autocorr lag-1:", autocorr_lag1,
          "| lag-12:", autocorr_lag12)
    print("        Rolling 12-month mean range:", round(rolling_mean.min(), 2),
          "to", round(rolling_mean.max(), 2))

def ex47():
    """EDA for text data: length and vocab stats"""
    texts = [
        "machine learning is a subset of artificial intelligence",
        "deep learning uses neural networks with many layers",
        "data science involves statistics programming and domain knowledge",
        "feature engineering transforms raw data into useful features",
        "model evaluation measures how well a model generalizes",
    ]
    lengths = [len(t) for t in texts]
    word_counts = [len(t.split()) for t in texts]
    all_words = [w for t in texts for w in t.split()]
    vocab = set(all_words)
    word_freq = pd.Series(all_words).value_counts().head(5).to_dict()
    print("Ex47 — Text EDA | char lengths:", lengths)
    print("        Word counts:", word_counts)
    print("        Vocab size:", len(vocab), "| top words:", word_freq)

def ex48():
    """EDA for mixed types (numeric + categorical)"""
    np.random.seed(42)
    df = pd.DataFrame({
        'age': np.random.randint(20, 70, 100),
        'salary': np.random.normal(50000, 15000, 100),
        'department': np.random.choice(['HR', 'Eng', 'Sales'], 100),
        'seniority': np.random.choice(['junior', 'mid', 'senior'], 100),
    })
    numeric_summary = df.select_dtypes(include=np.number).describe().round(1).loc['mean'].to_dict()
    cat_summary = {col: df[col].value_counts().to_dict()
                   for col in df.select_dtypes(include=object).columns}
    cross_tab = df.groupby('department')['salary'].mean().round(0).to_dict()
    print("Ex48 — Mixed EDA | numeric means:", numeric_summary)
    print("        Categorical counts:", {k: len(v) for k, v in cat_summary.items()}, "categories")
    print("        Salary by department:", cross_tab)

def ex49():
    """Production EDA pipeline"""
    class ProductionEDAPipeline:
        def __init__(self, config=None):
            self.config = config or {}
            self.results = {}
        def fit(self, df):
            self._basic_stats(df)
            self._quality_checks(df)
            self._distribution_analysis(df)
            return self
        def _basic_stats(self, df):
            self.results['shape'] = df.shape
            self.results['dtypes'] = df.dtypes.astype(str).to_dict()
        def _quality_checks(self, df):
            self.results['missing'] = df.isnull().sum().to_dict()
            self.results['duplicates'] = int(df.duplicated().sum())
        def _distribution_analysis(self, df):
            numeric = df.select_dtypes(include=np.number)
            self.results['skewness'] = numeric.skew().round(3).to_dict()
            self.results['outlier_flags'] = {}
            for col in numeric.columns:
                Q1, Q3 = numeric[col].quantile(0.25), numeric[col].quantile(0.75)
                IQR = Q3 - Q1
                n = int(((numeric[col] < Q1 - 1.5*IQR) | (numeric[col] > Q3 + 1.5*IQR)).sum())
                self.results['outlier_flags'][col] = n
        def report(self):
            return self.results
    df = get_iris_df()
    pipeline = ProductionEDAPipeline()
    pipeline.fit(df)
    report = pipeline.report()
    print("Ex49 — Production EDA pipeline shape:", report['shape'])
    print("        Outlier flags:", report['outlier_flags'])

def ex50():
    """EDA checklist: print 20 items"""
    checklist = [
        "1.  Understand the business context and goal",
        "2.  Check dataset shape (rows, columns)",
        "3.  Inspect data types for each column",
        "4.  Identify and count missing values",
        "5.  Check for duplicate rows",
        "6.  Examine descriptive statistics (mean, std, min, max, percentiles)",
        "7.  Analyze target variable distribution",
        "8.  Check class balance for classification tasks",
        "9.  Detect outliers using IQR and Z-score methods",
        "10. Analyze feature distributions (skewness, kurtosis)",
        "11. Compute correlation matrix for numeric features",
        "12. Identify multicollinear features (VIF > 10)",
        "13. Explore feature vs target relationships",
        "14. Detect categorical cardinality and rare categories",
        "15. Check for data leakage (features with near-perfect target correlation)",
        "16. Validate date/time columns for gaps or ordering issues",
        "17. Profile text columns for length, vocabulary size",
        "18. Generate pairwise scatter plots for top correlated features",
        "19. Document all anomalies and data quality issues found",
        "20. Summarize findings and decide preprocessing actions",
    ]
    print("Ex50 — EDA Checklist (20 items):")
    for item in checklist:
        print("   ", item)


def main():
    print("=" * 60)
    print("Examples 2.1 — Exploratory Data Analysis")
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
