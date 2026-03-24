# ============================================================
# Examples 2.2 — Feature Engineering (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import pandas as pd
from sklearn.datasets import load_iris, make_classification, make_regression
from sklearn.preprocessing import (LabelEncoder, OneHotEncoder, OrdinalEncoder,
                                   PolynomialFeatures, FunctionTransformer,
                                   StandardScaler)
from sklearn.feature_extraction.text import TfidfVectorizer, FeatureHasher
from sklearn.pipeline import Pipeline
from sklearn.model_selection import KFold
from sklearn.linear_model import LinearRegression
from scipy.special import boxcox1p
from scipy.stats import yeojohnson
import json, hashlib

# Shared dataset
def get_sample_df():
    np.random.seed(42)
    df = pd.DataFrame({
        'color': ['red', 'blue', 'green', 'red', 'blue', 'green', 'red'],
        'size': ['S', 'M', 'L', 'M', 'S', 'L', 'M'],
        'price': [10.0, 20.0, 15.0, 12.0, 22.0, 18.0, 11.0],
        'quantity': [100, 200, 150, 120, 220, 180, 110],
        'sales': [500, 1000, 750, 600, 1100, 900, 550],
    })
    return df

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Label encoding using a manual dict"""
    df = get_sample_df()
    color_map = {'red': 0, 'blue': 1, 'green': 2}
    df['color_encoded'] = df['color'].map(color_map)
    print("Ex01 — Manual label encoding:", df[['color', 'color_encoded']].to_dict('list'))

def ex02():
    """Sklearn LabelEncoder"""
    df = get_sample_df()
    le = LabelEncoder()
    df['color_le'] = le.fit_transform(df['color'])
    print("Ex02 — LabelEncoder classes:", le.classes_.tolist(),
          "| encoded:", df['color_le'].tolist())

def ex03():
    """OneHotEncoder"""
    df = get_sample_df()
    ohe = OneHotEncoder(sparse_output=False)
    encoded = ohe.fit_transform(df[['color']])
    cols = ohe.get_feature_names_out(['color']).tolist()
    encoded_df = pd.DataFrame(encoded.astype(int), columns=cols)
    print("Ex03 — OneHotEncoder columns:", cols)
    print("        First row:", encoded_df.iloc[0].to_dict())

def ex04():
    """pd.get_dummies"""
    df = get_sample_df()
    dummies = pd.get_dummies(df[['color', 'size']], dtype=int)
    print("Ex04 — get_dummies columns:", list(dummies.columns))
    print("        First row:", dummies.iloc[0].to_dict())

def ex05():
    """Ordinal encoding (manual)"""
    df = get_sample_df()
    size_order = {'S': 0, 'M': 1, 'L': 2}
    df['size_ordinal'] = df['size'].map(size_order)
    print("Ex05 — Manual ordinal encoding:", df[['size', 'size_ordinal']].to_dict('list'))

def ex06():
    """Target encoding: mean price per color"""
    df = get_sample_df()
    target_map = df.groupby('color')['sales'].mean().round(2).to_dict()
    df['color_target_enc'] = df['color'].map(target_map)
    print("Ex06 — Target encoding map:", target_map)
    print("        Encoded column:", df['color_target_enc'].tolist())

def ex07():
    """Binary encoding concept (hash-based single bit)"""
    df = get_sample_df()
    def binary_encode(series, n_bits=4):
        unique_vals = {v: i for i, v in enumerate(series.unique())}
        encoded = series.map(unique_vals)
        bits = pd.DataFrame(
            [(encoded >> i) & 1 for i in range(n_bits)],
            index=[f'bit_{i}' for i in range(n_bits)]
        ).T
        return bits.reset_index(drop=True)
    result = binary_encode(df['color'])
    print("Ex07 — Binary encoding (first 3 rows):\n", result.head(3).to_string())

def ex08():
    """Frequency encoding"""
    df = get_sample_df()
    freq_map = df['color'].value_counts(normalize=True).round(4).to_dict()
    df['color_freq'] = df['color'].map(freq_map)
    print("Ex08 — Frequency encoding map:", freq_map)
    print("        Encoded:", df['color_freq'].tolist())

def ex09():
    """Polynomial features (degree 2 on 1 feature)"""
    X = np.array([[1], [2], [3], [4], [5]], dtype=float)
    poly = PolynomialFeatures(degree=2, include_bias=False)
    X_poly = poly.fit_transform(X)
    print("Ex09 — Polynomial features (x, x^2):\n", X_poly.tolist())

def ex10():
    """Interaction term: price × quantity"""
    df = get_sample_df()
    df['price_x_qty'] = df['price'] * df['quantity']
    print("Ex10 — Interaction term price×qty:", df['price_x_qty'].tolist())

def ex11():
    """Log transform"""
    df = get_sample_df()
    df['log_sales'] = np.log1p(df['sales']).round(4)
    print("Ex11 — Log transform (log1p sales):", df['log_sales'].tolist())

def ex12():
    """Sqrt transform"""
    df = get_sample_df()
    df['sqrt_quantity'] = np.sqrt(df['quantity']).round(4)
    print("Ex12 — Sqrt transform (quantity):", df['sqrt_quantity'].tolist())

def ex13():
    """Reciprocal transform"""
    df = get_sample_df()
    df['recip_price'] = (1.0 / df['price']).round(5)
    print("Ex13 — Reciprocal transform (1/price):", df['recip_price'].tolist())

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Box-Cox transform using scipy"""
    np.random.seed(0)
    data = np.abs(np.random.exponential(2, 50)) + 1
    transformed = boxcox1p(data, 0.15)
    print("Ex14 — Box-Cox transform | original mean:", round(data.mean(), 3),
          "| transformed mean:", round(transformed.mean(), 3))
    print("        Original skew:", round(pd.Series(data).skew(), 3),
          "| transformed skew:", round(pd.Series(transformed).skew(), 3))

def ex15():
    """Yeo-Johnson transform"""
    np.random.seed(0)
    data = np.random.exponential(2, 50)
    transformed, lmbda = yeojohnson(data)
    print("Ex15 — Yeo-Johnson | lambda:", round(lmbda, 3))
    print("        Original skew:", round(pd.Series(data).skew(), 3),
          "| transformed skew:", round(pd.Series(transformed).skew(), 3))

def ex16():
    """pd.cut: equal-width binning"""
    df = get_sample_df()
    df['price_bin'] = pd.cut(df['price'], bins=3, labels=['low', 'medium', 'high'])
    print("Ex16 — pd.cut equal-width bins:", df[['price', 'price_bin']].to_dict('list'))

def ex17():
    """pd.qcut: quantile-based binning"""
    df = get_sample_df()
    df['sales_qbin'] = pd.qcut(df['sales'], q=3, labels=['q1', 'q2', 'q3'])
    print("Ex17 — pd.qcut quantile bins:", df[['sales', 'sales_qbin']].to_dict('list'))

def ex18():
    """Rolling mean feature (window=3)"""
    np.random.seed(42)
    ts = pd.Series(np.random.randn(10).cumsum())
    rolling_feat = ts.rolling(window=3, min_periods=1).mean().round(4)
    print("Ex18 — Rolling mean (window=3):", rolling_feat.tolist())

def ex19():
    """Lag feature (shift by 1)"""
    np.random.seed(42)
    ts = pd.Series([10, 20, 15, 25, 30, 18, 22])
    lag1 = ts.shift(1)
    diff = ts - lag1
    print("Ex19 — Original:", ts.tolist(), "| Lag-1:", lag1.tolist(),
          "| Diff:", diff.tolist())

def ex20():
    """Datetime feature extraction: year, month, day"""
    dates = pd.to_datetime(['2023-01-15', '2023-07-04', '2024-03-20',
                            '2022-12-31', '2023-06-15'])
    df = pd.DataFrame({'date': dates, 'value': [10, 20, 30, 40, 50]})
    df['year'] = df['date'].dt.year
    df['month'] = df['date'].dt.month
    df['day'] = df['date'].dt.day
    print("Ex20 — Datetime features:", df[['year', 'month', 'day']].to_dict('list'))

def ex21():
    """Day of week feature"""
    dates = pd.to_datetime(['2023-01-02', '2023-01-07', '2023-01-08',
                            '2023-01-14', '2023-01-21'])
    df = pd.DataFrame({'date': dates})
    df['day_of_week'] = df['date'].dt.dayofweek
    df['day_name'] = df['date'].dt.day_name()
    print("Ex21 — Day of week:", df[['day_name', 'day_of_week']].to_dict('list'))

def ex22():
    """is_weekend flag"""
    dates = pd.to_datetime(['2023-01-02', '2023-01-07', '2023-01-08',
                            '2023-01-14', '2023-01-21'])
    df = pd.DataFrame({'date': dates})
    df['is_weekend'] = df['date'].dt.dayofweek.isin([5, 6]).astype(int)
    print("Ex22 — is_weekend flag:", df[['date', 'is_weekend']].to_dict('list'))

def ex23():
    """Cyclical encoding: sin/cos for month"""
    months = np.arange(1, 13)
    sin_month = np.sin(2 * np.pi * months / 12).round(4)
    cos_month = np.cos(2 * np.pi * months / 12).round(4)
    print("Ex23 — Cyclical encoding for months 1-12:")
    print("        sin:", sin_month.tolist())
    print("        cos:", cos_month.tolist())

def ex24():
    """Text length feature"""
    texts = [
        "short text",
        "this is a medium length sentence for testing",
        "a very long piece of text that contains many words and lots of characters to process",
    ]
    df = pd.DataFrame({'text': texts})
    df['char_len'] = df['text'].str.len()
    df['word_count'] = df['text'].str.split().str.len()
    print("Ex24 — Text length features:", df[['char_len', 'word_count']].to_dict('list'))

def ex25():
    """Word count feature"""
    texts = ["machine learning model", "deep neural network training", "feature extraction"]
    df = pd.DataFrame({'text': texts})
    df['word_count'] = df['text'].str.split().str.len()
    df['avg_word_len'] = df['text'].apply(lambda t: np.mean([len(w) for w in t.split()])).round(2)
    df['unique_words'] = df['text'].apply(lambda t: len(set(t.split())))
    print("Ex25 — Word count features:", df[['word_count', 'avg_word_len', 'unique_words']].to_dict('list'))

def ex26():
    """TF-IDF as numeric features"""
    corpus = [
        "machine learning is great",
        "deep learning uses neural networks",
        "machine learning and deep learning overlap",
    ]
    tfidf = TfidfVectorizer(max_features=5)
    X = tfidf.fit_transform(corpus).toarray().round(4)
    features = tfidf.get_feature_names_out().tolist()
    print("Ex26 — TF-IDF features:", features)
    print("        Feature matrix (3 x 5):\n", X.tolist())

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """FeatureEngineer class: fit + transform + feature_names"""
    class FeatureEngineer:
        def __init__(self, log_cols=None, poly_cols=None):
            self.log_cols = log_cols or []
            self.poly_cols = poly_cols or []
            self.feature_names_ = []
        def fit(self, df):
            self.feature_names_ = list(df.columns)
            for col in self.log_cols:
                self.feature_names_.append(f'log_{col}')
            for col in self.poly_cols:
                self.feature_names_.append(f'{col}_sq')
            return self
        def transform(self, df):
            out = df.copy()
            for col in self.log_cols:
                out[f'log_{col}'] = np.log1p(out[col])
            for col in self.poly_cols:
                out[f'{col}_sq'] = out[col] ** 2
            return out
    df = get_sample_df()
    fe = FeatureEngineer(log_cols=['sales'], poly_cols=['price'])
    fe.fit(df)
    out = fe.transform(df)
    print("Ex27 — FeatureEngineer features:", fe.feature_names_)
    print("        log_sales sample:", out['log_sales'].round(3).tolist()[:3])

def ex28():
    """AutomaticFeatureGenerator: polynomial + interactions"""
    class AutomaticFeatureGenerator:
        def __init__(self, degree=2, interaction_only=False):
            self.degree = degree
            self.interaction_only = interaction_only
            self.poly = PolynomialFeatures(degree=degree,
                                           interaction_only=interaction_only,
                                           include_bias=False)
        def fit_transform(self, X, feature_names=None):
            out = self.poly.fit_transform(X)
            names = self.poly.get_feature_names_out(feature_names)
            return pd.DataFrame(out, columns=names)
    df = get_sample_df()[['price', 'quantity']].astype(float)
    afg = AutomaticFeatureGenerator(degree=2)
    result = afg.fit_transform(df.values, df.columns.tolist())
    print("Ex28 — AutomaticFeatureGenerator columns:", result.columns.tolist())
    print("        Shape:", result.shape)

def ex29():
    """TimeSeriesFeatureExtractor class"""
    class TimeSeriesFeatureExtractor:
        def __init__(self, windows=None, lags=None):
            self.windows = windows or [3, 7]
            self.lags = lags or [1, 2, 3]
        def fit_transform(self, series):
            df = pd.DataFrame({'value': series})
            for w in self.windows:
                df[f'rolling_mean_{w}'] = series.rolling(w, min_periods=1).mean().round(4)
                df[f'rolling_std_{w}'] = series.rolling(w, min_periods=1).std().fillna(0).round(4)
            for lag in self.lags:
                df[f'lag_{lag}'] = series.shift(lag)
            df['diff_1'] = series.diff(1)
            return df
    np.random.seed(42)
    ts = pd.Series(np.cumsum(np.random.randn(10)))
    tsfe = TimeSeriesFeatureExtractor(windows=[3], lags=[1, 2])
    result = tsfe.fit_transform(ts)
    print("Ex29 — TimeSeriesFeatureExtractor columns:", result.columns.tolist())
    print("        First 3 rows:\n", result.head(3).round(3).to_string())

def ex30():
    """TargetEncoder class with cross-validation safety"""
    class TargetEncoder:
        def __init__(self, smoothing=10):
            self.smoothing = smoothing
            self.global_mean_ = None
            self.encoding_map_ = {}
        def fit(self, X_col, y):
            self.global_mean_ = np.mean(y)
            stats = pd.DataFrame({'x': X_col, 'y': y}).groupby('x')['y']
            counts = stats.count()
            means = stats.mean()
            smooth = (counts * means + self.smoothing * self.global_mean_) / (counts + self.smoothing)
            self.encoding_map_ = smooth.to_dict()
            return self
        def transform(self, X_col):
            return X_col.map(self.encoding_map_).fillna(self.global_mean_)
    df = get_sample_df()
    te = TargetEncoder(smoothing=5)
    te.fit(df['color'], df['sales'])
    df['color_te'] = te.transform(df['color'])
    print("Ex30 — TargetEncoder map:", {k: round(v, 2) for k, v in te.encoding_map_.items()})
    print("        Encoded:", df['color_te'].round(2).tolist())

def ex31():
    """FeatureHasher concept"""
    hasher = FeatureHasher(n_features=8, input_type='string')
    raw_data = [{'color_red', 'size_M'}, {'color_blue', 'size_L'}, {'color_green', 'size_S'}]
    X_hashed = hasher.fit_transform([list(s) for s in raw_data]).toarray()
    print("Ex31 — FeatureHasher output shape:", X_hashed.shape)
    print("        Row 0 non-zero indices:", np.where(X_hashed[0] != 0)[0].tolist())

def ex32():
    """FeaturePipeline class"""
    class FeaturePipeline:
        def __init__(self, steps):
            self.steps = steps
        def fit_transform(self, df):
            out = df.copy()
            for name, func in self.steps:
                out = func(out)
                print(f"  Step '{name}' done, shape: {out.shape}")
            return out
    def add_log_sales(df):
        df = df.copy()
        df['log_sales'] = np.log1p(df['sales'])
        return df
    def add_interaction(df):
        df = df.copy()
        df['price_x_qty'] = df['price'] * df['quantity']
        return df
    def encode_color(df):
        df = df.copy()
        color_map = {'red': 0, 'blue': 1, 'green': 2}
        df['color_enc'] = df['color'].map(color_map)
        return df
    df = get_sample_df()
    pipeline = FeaturePipeline([
        ('log_transform', add_log_sales),
        ('interaction', add_interaction),
        ('encode_color', encode_color),
    ])
    print("Ex32 — FeaturePipeline:")
    result = pipeline.fit_transform(df)
    print("        Final columns:", list(result.columns))

def ex33():
    """FeatureSelector class: importance-based"""
    from sklearn.ensemble import RandomForestClassifier
    class FeatureSelector:
        def __init__(self, threshold=0.05):
            self.threshold = threshold
            self.selected_features_ = []
            self.importances_ = {}
        def fit(self, X, y):
            model = RandomForestClassifier(n_estimators=50, random_state=42)
            model.fit(X, y)
            self.importances_ = dict(zip(X.columns, model.feature_importances_.round(4)))
            self.selected_features_ = [f for f, imp in self.importances_.items()
                                        if imp >= self.threshold]
            return self
        def transform(self, X):
            return X[self.selected_features_]
    iris = load_iris()
    X = pd.DataFrame(iris.data, columns=iris.feature_names)
    y = iris.target
    fs = FeatureSelector(threshold=0.05)
    fs.fit(X, y)
    print("Ex33 — FeatureSelector importances:", fs.importances_)
    print("        Selected features:", fs.selected_features_)

def ex34():
    """Full feature engineering pipeline (sklearn)"""
    from sklearn.pipeline import Pipeline as SkPipeline
    from sklearn.preprocessing import StandardScaler
    from sklearn.impute import SimpleImputer
    iris = load_iris()
    X = pd.DataFrame(iris.data, columns=iris.feature_names)
    poly = PolynomialFeatures(degree=2, include_bias=False)
    pipe = SkPipeline([
        ('imputer', SimpleImputer(strategy='mean')),
        ('poly', poly),
        ('scaler', StandardScaler()),
    ])
    X_out = pipe.fit_transform(X)
    print("Ex34 — Full FE pipeline | input shape:", X.shape,
          "| output shape:", X_out.shape)
    print("        Feature names sample:", pipe.named_steps['poly'].get_feature_names_out(
        iris.feature_names).tolist()[:5])

def ex35():
    """Feature store class: save/load engineered features"""
    class FeatureStore:
        def __init__(self):
            self.store = {}
        def save(self, name, df, version='v1'):
            key = f"{name}:{version}"
            self.store[key] = {
                "data": df.copy(),
                "shape": df.shape,
                "columns": list(df.columns),
                "hash": hashlib.md5(pd.util.hash_pandas_object(df).values).hexdigest()[:8]
            }
            print(f"  Saved '{key}' | shape: {df.shape} | hash: {self.store[key]['hash']}")
        def load(self, name, version='v1'):
            key = f"{name}:{version}"
            return self.store[key]['data']
        def list_features(self):
            return list(self.store.keys())
    df = get_sample_df()
    df['log_sales'] = np.log1p(df['sales'])
    fs = FeatureStore()
    print("Ex35 — FeatureStore:")
    fs.save("engineered_features", df, version='v1')
    loaded = fs.load("engineered_features", 'v1')
    print("        Loaded shape:", loaded.shape, "| features:", fs.list_features())

def ex36():
    """Feature drift detector"""
    class FeatureDriftDetector:
        def __init__(self, threshold=0.1):
            self.threshold = threshold
            self.reference_stats = {}
        def fit(self, df):
            numeric = df.select_dtypes(include=np.number)
            for col in numeric.columns:
                self.reference_stats[col] = {'mean': numeric[col].mean(),
                                             'std': numeric[col].std()}
            return self
        def detect(self, df):
            drift_report = {}
            numeric = df.select_dtypes(include=np.number)
            for col in numeric.columns:
                if col not in self.reference_stats:
                    continue
                ref = self.reference_stats[col]
                mean_shift = abs(numeric[col].mean() - ref['mean']) / (ref['std'] + 1e-9)
                drifted = mean_shift > self.threshold
                drift_report[col] = {'mean_shift': round(mean_shift, 4), 'drifted': drifted}
            return drift_report
    np.random.seed(42)
    df_train = pd.DataFrame({'f1': np.random.normal(0, 1, 100),
                              'f2': np.random.normal(5, 2, 100)})
    df_new = pd.DataFrame({'f1': np.random.normal(0.5, 1, 100),
                            'f2': np.random.normal(5, 2, 100)})
    fdd = FeatureDriftDetector(threshold=0.3)
    fdd.fit(df_train)
    report = fdd.detect(df_new)
    print("Ex36 — FeatureDriftDetector:", report)

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex37():
    """Automated feature generation concept (tsfresh-style)"""
    class SimpleTSFresh:
        FEATURES = ['mean', 'std', 'min', 'max', 'skew', 'sum', 'range']
        def extract(self, series):
            arr = np.array(series)
            return {
                'mean': round(float(np.mean(arr)), 4),
                'std': round(float(np.std(arr)), 4),
                'min': round(float(np.min(arr)), 4),
                'max': round(float(np.max(arr)), 4),
                'skew': round(float(pd.Series(arr).skew()), 4),
                'sum': round(float(np.sum(arr)), 4),
                'range': round(float(np.max(arr) - np.min(arr)), 4),
                'autocorr_1': round(float(pd.Series(arr).autocorr(1)), 4)
                              if len(arr) > 2 else 0,
            }
        def extract_all(self, df_ts, value_col):
            return self.extract(df_ts[value_col])
    np.random.seed(42)
    ts = pd.Series(np.cumsum(np.random.randn(50)))
    tsf = SimpleTSFresh()
    features = tsf.extract(ts)
    print("Ex37 — tsfresh-style features:", features)

def ex38():
    """Genetic feature selection concept"""
    class GeneticFeatureSelector:
        def __init__(self, n_features_to_select=3, n_generations=5, population_size=10):
            self.n_select = n_features_to_select
            self.n_gen = n_generations
            self.pop_size = population_size
            self.best_features_ = None
            self.best_score_ = -np.inf
        def _evaluate(self, X, y, feature_mask):
            from sklearn.linear_model import LogisticRegression
            selected = X[:, feature_mask]
            if selected.shape[1] == 0:
                return 0.0
            scores = []
            kf = KFold(n_splits=3, shuffle=True, random_state=42)
            for tr, val in kf.split(selected):
                lr = LogisticRegression(max_iter=200, random_state=42)
                lr.fit(selected[tr], y[tr])
                scores.append(lr.score(selected[val], y[val]))
            return np.mean(scores)
        def fit(self, X, y):
            n_feats = X.shape[1]
            np.random.seed(42)
            for gen in range(self.n_gen):
                population = [
                    np.random.choice([True, False], n_feats)
                    for _ in range(self.pop_size)
                ]
                for mask in population:
                    if mask.sum() < 1:
                        mask[0] = True
                    score = self._evaluate(X, y, mask)
                    if score > self.best_score_:
                        self.best_score_ = score
                        self.best_features_ = np.where(mask)[0].tolist()
            return self
    iris = load_iris()
    gfs = GeneticFeatureSelector(n_features_to_select=3, n_generations=3, population_size=8)
    gfs.fit(iris.data, iris.target)
    print("Ex38 — Genetic feature selection best features (indices):", gfs.best_features_)
    print("        Best CV score:", round(gfs.best_score_, 4))

def ex39():
    """Feature importance aggregation across multiple models"""
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.linear_model import LogisticRegression
    iris = load_iris()
    X = pd.DataFrame(iris.data, columns=iris.feature_names)
    y = iris.target
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    models = {
        'rf': RandomForestClassifier(n_estimators=50, random_state=42),
        'gb': GradientBoostingClassifier(n_estimators=50, random_state=42),
    }
    all_importances = {}
    for name, model in models.items():
        model.fit(X, y)
        all_importances[name] = model.feature_importances_
    avg_imp = np.mean(list(all_importances.values()), axis=0)
    result = dict(zip(iris.feature_names, avg_imp.round(4)))
    print("Ex39 — Aggregated feature importances:", result)

def ex40():
    """Adversarial feature validation"""
    from sklearn.ensemble import RandomForestClassifier
    np.random.seed(42)
    n = 200
    X_train = pd.DataFrame(np.random.randn(n, 4), columns=['f1', 'f2', 'f3', 'f4'])
    X_test = pd.DataFrame(np.random.randn(n, 4), columns=['f1', 'f2', 'f3', 'f4'])
    X_test['f3'] = X_test['f3'] + 5  # introduce drift in f3
    X_adv = pd.concat([X_train.assign(is_test=0), X_test.assign(is_test=1)])
    y_adv = X_adv.pop('is_test').values
    rf = RandomForestClassifier(n_estimators=50, random_state=42)
    rf.fit(X_adv, y_adv)
    importances = dict(zip(X_adv.columns, rf.feature_importances_.round(4)))
    print("Ex40 — Adversarial validation importances:", importances)
    drifted = [f for f, imp in importances.items() if imp > 0.3]
    print("        Likely drifted features:", drifted)

def ex41():
    """Feature interaction detection using correlation gain"""
    iris = load_iris()
    X = pd.DataFrame(iris.data, columns=iris.feature_names)
    y = pd.Series(iris.target, name='target')
    interaction_gains = {}
    cols = list(X.columns)
    for i in range(len(cols)):
        for j in range(i + 1, len(cols)):
            a, b = cols[i], cols[j]
            interaction = X[a] * X[b]
            corr_a = abs(X[a].corr(y))
            corr_b = abs(X[b].corr(y))
            corr_int = abs(interaction.corr(y))
            gain = corr_int - max(corr_a, corr_b)
            interaction_gains[f"{a[:8]} x {b[:8]}"] = round(gain, 4)
    top3 = sorted(interaction_gains.items(), key=lambda x: -x[1])[:3]
    print("Ex41 — Top 3 interaction gains:", dict(top3))

def ex42():
    """Deep feature synthesis concept"""
    def dfs_simple(df, id_col, agg_col, target_df=None):
        agg_features = df.groupby(id_col)[agg_col].agg(
            ['mean', 'std', 'min', 'max', 'sum', 'count']
        ).round(3)
        agg_features.columns = [f"{agg_col}_{fn}" for fn in agg_features.columns]
        return agg_features.reset_index()
    np.random.seed(42)
    transactions = pd.DataFrame({
        'customer_id': np.random.choice([1, 2, 3, 4], 20),
        'amount': np.random.exponential(50, 20).round(2),
        'items': np.random.randint(1, 10, 20),
    })
    features = dfs_simple(transactions, 'customer_id', 'amount')
    print("Ex42 — DFS-style features:")
    print(features.to_string())

def ex43():
    """Domain-specific feature functions"""
    def compute_financial_features(df):
        df = df.copy()
        df['price_per_unit'] = (df['price'] / df['quantity']).round(4)
        df['revenue'] = df['price'] * df['quantity']
        df['profit_margin'] = ((df['sales'] - df['revenue']) / df['sales'].replace(0, 1)).round(4)
        df['sales_rank'] = df['sales'].rank(ascending=False).astype(int)
        return df
    df = get_sample_df()
    result = compute_financial_features(df)
    print("Ex43 — Domain-specific features:")
    print(result[['price_per_unit', 'revenue', 'profit_margin', 'sales_rank']].to_string())

def ex44():
    """Feature engineering for imbalanced data"""
    from sklearn.utils import resample
    np.random.seed(42)
    X_maj = pd.DataFrame(np.random.randn(100, 4), columns=['f1', 'f2', 'f3', 'f4'])
    X_min = pd.DataFrame(np.random.randn(10, 4) + 1, columns=['f1', 'f2', 'f3', 'f4'])
    X_maj['target'] = 0
    X_min['target'] = 1
    df = pd.concat([X_maj, X_min])
    X_min_up = resample(X_min, replace=True, n_samples=100, random_state=42)
    df_balanced = pd.concat([X_maj, X_min_up]).reset_index(drop=True)
    X_balanced = df_balanced.drop(columns=['target'])
    X_balanced['f1_f2_interaction'] = X_balanced['f1'] * X_balanced['f2']
    X_balanced['f3_sq'] = X_balanced['f3'] ** 2
    print("Ex44 — Feature engineering for imbalanced data:")
    print("        Original class dist:", df['target'].value_counts().to_dict())
    print("        Balanced class dist:", df_balanced['target'].value_counts().to_dict())
    print("        Added features shape:", X_balanced.shape)

def ex45():
    """Feature engineering for time series forecasting"""
    np.random.seed(42)
    n = 60
    dates = pd.date_range('2023-01-01', periods=n, freq='D')
    values = np.cumsum(np.random.randn(n)) + 100
    df = pd.DataFrame({'ds': dates, 'y': values})
    df['lag_1'] = df['y'].shift(1)
    df['lag_7'] = df['y'].shift(7)
    df['rolling_mean_7'] = df['y'].rolling(7, min_periods=1).mean().round(3)
    df['rolling_std_7'] = df['y'].rolling(7, min_periods=1).std().fillna(0).round(3)
    df['day_of_week'] = df['ds'].dt.dayofweek
    df['month'] = df['ds'].dt.month
    df['sin_dow'] = np.sin(2 * np.pi * df['day_of_week'] / 7).round(4)
    df['cos_dow'] = np.cos(2 * np.pi * df['day_of_week'] / 7).round(4)
    print("Ex45 — Time series features shape:", df.shape)
    print("        Feature columns:", list(df.columns))
    print("        Sample row 10:\n", df.iloc[10].to_dict())

def ex46():
    """Production feature engineering pipeline"""
    from sklearn.pipeline import Pipeline as SkPipeline
    from sklearn.compose import ColumnTransformer
    from sklearn.preprocessing import StandardScaler, OneHotEncoder
    from sklearn.impute import SimpleImputer
    np.random.seed(42)
    df = pd.DataFrame({
        'age': np.random.randint(20, 70, 100).astype(float),
        'salary': np.random.normal(50000, 10000, 100),
        'department': np.random.choice(['HR', 'Eng', 'Sales'], 100),
        'seniority': np.random.choice(['junior', 'mid', 'senior'], 100),
    })
    df.loc[::10, 'age'] = np.nan
    numeric_features = ['age', 'salary']
    categorical_features = ['department', 'seniority']
    numeric_transformer = SkPipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler()),
    ])
    categorical_transformer = SkPipeline([
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('ohe', OneHotEncoder(handle_unknown='ignore', sparse_output=False)),
    ])
    preprocessor = ColumnTransformer([
        ('num', numeric_transformer, numeric_features),
        ('cat', categorical_transformer, categorical_features),
    ])
    X_out = preprocessor.fit_transform(df)
    print("Ex46 — Production FE pipeline input:", df.shape, "| output:", X_out.shape)

def ex47():
    """Feature engineering best practices"""
    best_practices = [
        "1.  Understand the domain before creating features",
        "2.  Always apply transformations based on training data statistics only",
        "3.  Use cross-validation for target encoding to prevent leakage",
        "4.  Log-transform right-skewed features (e.g., income, counts)",
        "5.  Cyclical encode periodic features (hour, month, day of week)",
        "6.  Create lag and rolling features for time series problems",
        "7.  Handle missing values before encoding categorical features",
        "8.  Monitor feature distributions for drift in production",
        "9.  Version your feature engineering pipelines",
        "10. Use ColumnTransformer to apply different transforms per column type",
        "11. Remove near-zero variance features",
        "12. Detect and handle multicollinearity (VIF > 10)",
        "13. Feature importance pruning after initial model training",
        "14. Store feature metadata (name, source, version, creation date)",
        "15. Test your feature pipeline with before/after assertions",
    ]
    print("Ex47 — Feature Engineering Best Practices:")
    for p in best_practices:
        print("   ", p)

def ex48():
    """Neural feature embedding concept"""
    np.random.seed(42)
    vocab_size = 5
    embedding_dim = 3
    embedding_matrix = np.random.randn(vocab_size, embedding_dim).round(4)
    color_to_idx = {'red': 0, 'blue': 1, 'green': 2, 'yellow': 3, 'purple': 4}
    colors = ['red', 'blue', 'green', 'red', 'yellow']
    indices = [color_to_idx[c] for c in colors]
    embeddings = embedding_matrix[indices]
    print("Ex48 — Neural embedding concept:")
    print("        Embedding matrix shape:", embedding_matrix.shape)
    print("        Color embeddings (5 x 3):\n", embeddings.tolist())

def ex49():
    """Feature engineering for high-cardinality categoricals"""
    np.random.seed(42)
    n = 200
    n_cats = 50
    df = pd.DataFrame({
        'category': np.random.choice([f'cat_{i}' for i in range(n_cats)], n),
        'value': np.random.randn(n),
    })
    freq_map = df['category'].value_counts().to_dict()
    df['freq_enc'] = df['category'].map(freq_map)
    count_threshold = 5
    df['category_grouped'] = df['category'].apply(
        lambda x: x if freq_map.get(x, 0) >= count_threshold else 'other'
    )
    n_groups = df['category_grouped'].nunique()
    print("Ex49 — High-cardinality feature engineering:")
    print("        Original categories:", n_cats)
    print("        After grouping rare (<5):", n_groups)
    print("        Freq encoding sample:", dict(list(df[['category', 'freq_enc']].head(4).to_dict('list').items())))

def ex50():
    """WOE (Weight of Evidence) encoder concept"""
    def woe_encoder(df, col, target):
        total_events = df[target].sum()
        total_non_events = len(df) - total_events
        grouped = df.groupby(col)[target].agg(['sum', 'count'])
        grouped.columns = ['events', 'total']
        grouped['non_events'] = grouped['total'] - grouped['events']
        grouped['dist_events'] = grouped['events'] / total_events
        grouped['dist_non_events'] = grouped['non_events'] / total_non_events
        eps = 1e-9
        grouped['woe'] = np.log((grouped['dist_events'] + eps) /
                                 (grouped['dist_non_events'] + eps)).round(4)
        grouped['iv'] = ((grouped['dist_events'] - grouped['dist_non_events']) *
                          grouped['woe']).round(4)
        return grouped[['woe', 'iv']]
    np.random.seed(42)
    df = pd.DataFrame({
        'category': np.random.choice(['A', 'B', 'C'], 100),
        'target': np.random.choice([0, 1], 100, p=[0.7, 0.3]),
    })
    woe_table = woe_encoder(df, 'category', 'target')
    total_iv = woe_table['iv'].sum()
    print("Ex50 — WOE Encoder:")
    print(woe_table.to_string())
    print("        Total Information Value (IV):", round(total_iv, 4))


def main():
    print("=" * 60)
    print("Examples 2.2 — Feature Engineering")
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
