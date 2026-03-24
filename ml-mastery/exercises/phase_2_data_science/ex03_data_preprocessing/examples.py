# ============================================================
# Examples 2.3 — Data Preprocessing (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import pandas as pd
from sklearn.datasets import load_iris, make_classification
from sklearn.preprocessing import (StandardScaler, MinMaxScaler, RobustScaler,
                                   Normalizer, Binarizer, QuantileTransformer,
                                   PowerTransformer, FunctionTransformer)
from sklearn.impute import SimpleImputer, KNNImputer, IterativeImputer
from sklearn.model_selection import train_test_split, StratifiedShuffleSplit, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.base import BaseEstimator, TransformerMixin
import joblib, io, hashlib

# Shared helper
def get_iris_with_nulls():
    iris = load_iris()
    df = pd.DataFrame(iris.data, columns=iris.feature_names)
    df['target'] = iris.target
    np.random.seed(42)
    for col in iris.feature_names[:2]:
        null_idx = np.random.choice(df.index, 10, replace=False)
        df.loc[null_idx, col] = np.nan
    return df

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """StandardScaler fit + transform"""
    X = np.array([[1., 2.], [3., 4.], [5., 6.], [7., 8.]])
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    print("Ex01 — StandardScaler | mean:", scaler.mean_.tolist(),
          "| std:", scaler.scale_.round(3).tolist())
    print("        Scaled (first 2):", X_scaled[:2].round(3).tolist())

def ex02():
    """MinMaxScaler"""
    X = np.array([[1., 10.], [2., 20.], [3., 30.], [4., 40.]])
    scaler = MinMaxScaler(feature_range=(0, 1))
    X_scaled = scaler.fit_transform(X)
    print("Ex02 — MinMaxScaler | data_min:", scaler.data_min_.tolist(),
          "| data_max:", scaler.data_max_.tolist())
    print("        Scaled:", X_scaled.round(4).tolist())

def ex03():
    """RobustScaler"""
    X = np.array([[1.], [2.], [3.], [4.], [100.]])  # 100 is outlier
    scaler = RobustScaler()
    X_scaled = scaler.fit_transform(X)
    print("Ex03 — RobustScaler | center:", scaler.center_.tolist(),
          "| scale:", scaler.scale_.tolist())
    print("        Scaled:", X_scaled.round(4).flatten().tolist())

def ex04():
    """Normalizer (L2 row-wise)"""
    X = np.array([[3., 4.], [1., 0.], [6., 8.]])
    norm = Normalizer(norm='l2')
    X_norm = norm.fit_transform(X)
    row_norms = np.linalg.norm(X_norm, axis=1).round(6)
    print("Ex04 — Normalizer (L2) | each row norm:", row_norms.tolist())
    print("        Normalized:", X_norm.round(4).tolist())

def ex05():
    """Fill NaN with mean (fillna)"""
    df = get_iris_with_nulls()
    col = 'sepal length (cm)'
    n_before = df[col].isnull().sum()
    df[col] = df[col].fillna(df[col].mean())
    n_after = df[col].isnull().sum()
    print("Ex05 — fillna(mean) | nulls before:", n_before, "| after:", n_after,
          "| fill value:", round(load_iris().data[:, 0].mean(), 4))

def ex06():
    """Fill NaN with median"""
    df = get_iris_with_nulls()
    col = 'sepal width (cm)'
    median_val = df[col].median()
    df[col] = df[col].fillna(median_val)
    print("Ex06 — fillna(median) | median:", round(median_val, 4),
          "| remaining nulls:", df[col].isnull().sum())

def ex07():
    """Fill NaN with mode"""
    np.random.seed(0)
    df = pd.DataFrame({'color': ['red', 'blue', np.nan, 'red', np.nan, 'green', 'red']})
    mode_val = df['color'].mode()[0]
    df['color'] = df['color'].fillna(mode_val)
    print("Ex07 — fillna(mode) | mode:", mode_val, "| result:", df['color'].tolist())

def ex08():
    """KNN Imputer"""
    X = np.array([[1., 2.], [np.nan, 3.], [7., 6.], [np.nan, 5.], [5., 4.]])
    imputer = KNNImputer(n_neighbors=2)
    X_imp = imputer.fit_transform(X)
    print("Ex08 — KNNImputer | input (with NaN):", X.tolist())
    print("        Imputed:", X_imp.round(3).tolist())

def ex09():
    """Iterative imputer concept"""
    from sklearn.experimental import enable_iterative_imputer
    from sklearn.impute import IterativeImputer
    np.random.seed(42)
    X = np.array([[1., 2., 3.], [4., np.nan, 6.], [7., 8., np.nan], [10., 11., 12.]])
    imp = IterativeImputer(max_iter=5, random_state=42)
    X_imp = imp.fit_transform(X)
    print("Ex09 — IterativeImputer | original:\n", X.tolist())
    print("        Imputed:\n", X_imp.round(3).tolist())

def ex10():
    """Drop NaN rows"""
    df = get_iris_with_nulls()
    before = len(df)
    df_clean = df.dropna()
    after = len(df_clean)
    print("Ex10 — dropna rows | before:", before, "| after:", after,
          "| dropped:", before - after)

def ex11():
    """Drop NaN columns (threshold)"""
    np.random.seed(42)
    df = pd.DataFrame(np.random.randn(10, 5), columns=[f'col_{i}' for i in range(5)])
    df.loc[:, 'col_0'] = np.nan
    df.loc[:5, 'col_1'] = np.nan
    thresh = int(len(df) * 0.7)
    df_clean = df.dropna(axis=1, thresh=thresh)
    print("Ex11 — dropna columns (thresh=70%) | before:", len(df.columns),
          "| after:", len(df_clean.columns), "| kept:", list(df_clean.columns))

def ex12():
    """Remove duplicate rows"""
    df = get_iris_with_nulls().fillna(0)
    df = pd.concat([df, df.iloc[:5]], ignore_index=True)
    before = len(df)
    df_clean = df.drop_duplicates()
    after = len(df_clean)
    print("Ex12 — drop_duplicates | before:", before, "| after:", after,
          "| removed:", before - after)

def ex13():
    """Clip outliers using IQR"""
    iris = load_iris()
    df = pd.DataFrame(iris.data, columns=iris.feature_names)
    col = 'sepal length (cm)'
    Q1, Q3 = df[col].quantile(0.25), df[col].quantile(0.75)
    IQR = Q3 - Q1
    lower, upper = Q1 - 1.5 * IQR, Q3 + 1.5 * IQR
    df[f'{col}_clipped'] = df[col].clip(lower=lower, upper=upper)
    n_clipped = (df[col] != df[f'{col}_clipped']).sum()
    print("Ex13 — Clip outliers (IQR) | bounds:", (round(lower, 3), round(upper, 3)),
          "| values clipped:", n_clipped)

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Train/test split (random)"""
    iris = load_iris()
    X, y = iris.data, iris.target
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print("Ex14 — train/test split | train:", X_train.shape, "| test:", X_test.shape)

def ex15():
    """Stratified split"""
    iris = load_iris()
    X, y = iris.data, iris.target
    sss = StratifiedShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    for train_idx, test_idx in sss.split(X, y):
        X_train, X_test = X[train_idx], X[test_idx]
        y_train, y_test = y[train_idx], y[test_idx]
    print("Ex15 — Stratified split | train:", X_train.shape, "| test:", X_test.shape)
    print("        Train class dist:", np.bincount(y_train).tolist(),
          "| test class dist:", np.bincount(y_test).tolist())

def ex16():
    """Time-aware split (no shuffling)"""
    np.random.seed(0)
    n = 100
    X = pd.DataFrame({'feature': np.random.randn(n), 'time_idx': np.arange(n)})
    y = np.random.randint(0, 2, n)
    split_idx = int(n * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    print("Ex16 — Time-aware split | train:", X_train.shape, "| test:", X_test.shape)
    print("        Train time range:", X_train['time_idx'].min(), "to", X_train['time_idx'].max())

def ex17():
    """ColumnTransformer: numeric StandardScaler + categorical OneHotEncoder"""
    from sklearn.preprocessing import OneHotEncoder
    np.random.seed(42)
    df = pd.DataFrame({
        'age': [25., 35., 45., 55., np.nan],
        'salary': [40000., 60000., 80000., 100000., 50000.],
        'dept': ['HR', 'Eng', 'Sales', 'HR', 'Eng'],
    })
    num_features = ['age', 'salary']
    cat_features = ['dept']
    num_transformer = Pipeline([
        ('imputer', SimpleImputer(strategy='mean')),
        ('scaler', StandardScaler()),
    ])
    cat_transformer = Pipeline([
        ('ohe', OneHotEncoder(sparse_output=False)),
    ])
    ct = ColumnTransformer([
        ('num', num_transformer, num_features),
        ('cat', cat_transformer, cat_features),
    ])
    X_out = ct.fit_transform(df)
    print("Ex17 — ColumnTransformer | input:", df.shape, "| output:", X_out.shape)
    print("        First row:", X_out[0].round(3).tolist())

def ex18():
    """Sklearn Pipeline: imputer + scaler"""
    iris = load_iris()
    X = iris.data.copy()
    X[::10, 0] = np.nan
    pipe = Pipeline([
        ('imputer', SimpleImputer(strategy='mean')),
        ('scaler', StandardScaler()),
    ])
    X_out = pipe.fit_transform(X)
    print("Ex18 — Pipeline (imputer+scaler) | shape:", X_out.shape)
    print("        Mean after scaling (should ≈0):", X_out.mean(axis=0).round(4).tolist())

def ex19():
    """Sklearn Pipeline: imputer + encoder + scaler + model"""
    from sklearn.preprocessing import OneHotEncoder
    np.random.seed(42)
    n = 100
    X = pd.DataFrame({
        'num1': np.random.randn(n),
        'num2': np.random.randn(n),
        'cat': np.random.choice(['A', 'B', 'C'], n),
    })
    X.loc[::10, 'num1'] = np.nan
    y = np.random.randint(0, 2, n)
    num_pipe = Pipeline([('imp', SimpleImputer()), ('scl', StandardScaler())])
    cat_pipe = Pipeline([('ohe', OneHotEncoder(sparse_output=False))])
    ct = ColumnTransformer([('num', num_pipe, ['num1', 'num2']),
                             ('cat', cat_pipe, ['cat'])])
    full_pipe = Pipeline([('preprocessor', ct),
                          ('model', LogisticRegression(max_iter=200, random_state=42))])
    scores = cross_val_score(full_pipe, X, y, cv=3, scoring='accuracy')
    print("Ex19 — Full pipeline (imp+enc+scl+model) | CV accuracy:", scores.round(3).tolist(),
          "| mean:", round(scores.mean(), 3))

def ex20():
    """SimpleImputer with strategy='constant'"""
    df = pd.DataFrame({
        'num': [1., 2., np.nan, 4., np.nan],
        'cat': ['a', np.nan, 'b', 'a', np.nan],
    })
    imp_num = SimpleImputer(strategy='constant', fill_value=-999)
    imp_cat = SimpleImputer(strategy='constant', fill_value='MISSING')
    df['num_imp'] = imp_num.fit_transform(df[['num']]).flatten()
    df['cat_imp'] = imp_cat.fit_transform(df[['cat']]).flatten()
    print("Ex20 — Constant imputer | num:", df['num_imp'].tolist(),
          "| cat:", df['cat_imp'].tolist())

def ex21():
    """SMOTE concept (simulate class balancing via oversampling)"""
    np.random.seed(42)
    X_maj = np.random.randn(100, 2)
    X_min = np.random.randn(10, 2) + 2
    y_maj = np.zeros(100)
    y_min = np.ones(10)
    # Synthetic minority oversampling: linear interpolation between neighbors
    def simple_smote(X_minor, n_synthetic):
        synthetic = []
        for _ in range(n_synthetic):
            i, j = np.random.choice(len(X_minor), 2, replace=False)
            t = np.random.rand()
            synthetic.append(X_minor[i] + t * (X_minor[j] - X_minor[i]))
        return np.array(synthetic)
    X_synthetic = simple_smote(X_min, 90)
    X_balanced = np.vstack([X_maj, X_min, X_synthetic])
    y_balanced = np.hstack([y_maj, y_min, np.ones(90)])
    print("Ex21 — SMOTE concept | original class dist:", {0: 100, 1: 10})
    print("        After SMOTE:", {0: int((y_balanced == 0).sum()),
                                    1: int((y_balanced == 1).sum())})

def ex22():
    """Custom transformer (fit/transform)"""
    class LogTransformer(BaseEstimator, TransformerMixin):
        def __init__(self, epsilon=1e-9):
            self.epsilon = epsilon
        def fit(self, X, y=None):
            return self
        def transform(self, X):
            return np.log1p(np.abs(X) + self.epsilon)
        def inverse_transform(self, X):
            return np.expm1(X) - self.epsilon
    X = np.array([[1., 100., 10000.], [2., 200., 20000.]])
    lt = LogTransformer()
    X_log = lt.fit_transform(X)
    X_inv = lt.inverse_transform(X_log)
    print("Ex22 — Custom LogTransformer | input:", X.tolist())
    print("        Log transformed:", X_log.round(4).tolist())
    print("        Inverse (should match input):", X_inv.round(2).tolist())

def ex23():
    """PowerTransformer (Box-Cox)"""
    np.random.seed(0)
    X = np.abs(np.random.exponential(2, (50, 2))) + 0.01
    pt = PowerTransformer(method='box-cox', standardize=True)
    X_out = pt.fit_transform(X)
    print("Ex23 — PowerTransformer (box-cox) | lambdas:", pt.lambdas_.round(3).tolist())
    print("        Input skew:", pd.DataFrame(X).skew().round(3).tolist())
    print("        Output skew:", pd.DataFrame(X_out).skew().round(3).tolist())

def ex24():
    """QuantileTransformer"""
    np.random.seed(0)
    X = np.abs(np.random.exponential(3, (100, 2)))
    qt = QuantileTransformer(output_distribution='normal', random_state=42)
    X_out = qt.fit_transform(X)
    print("Ex24 — QuantileTransformer | input mean:", X.mean(axis=0).round(3).tolist())
    print("        Output mean (≈0):", X_out.mean(axis=0).round(3).tolist())
    print("        Output std (≈1):", X_out.std(axis=0).round(3).tolist())

def ex25():
    """Binarizer"""
    X = np.array([[1.5, 2.5, 0.3], [0.0, 4.0, 1.2], [3.0, 0.0, 0.0]])
    bn = Binarizer(threshold=1.0)
    X_bin = bn.fit_transform(X)
    print("Ex25 — Binarizer (threshold=1.0) | input:", X.tolist())
    print("        Binary output:", X_bin.tolist())

def ex26():
    """FunctionTransformer"""
    X = np.array([[1., 4., 9.], [16., 25., 36.]])
    ft = FunctionTransformer(func=np.sqrt, inverse_func=np.square, validate=True)
    X_sqrt = ft.fit_transform(X)
    X_inv = ft.inverse_transform(X_sqrt)
    print("Ex26 — FunctionTransformer (sqrt) | input:", X.tolist())
    print("        Sqrt:", X_sqrt.round(4).tolist())
    print("        Inverse (sq, ≈input):", X_inv.round(2).tolist())

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """PreprocessingPipeline class: full workflow"""
    class PreprocessingPipeline:
        def __init__(self):
            self.imputer = SimpleImputer(strategy='mean')
            self.scaler = StandardScaler()
            self.is_fitted = False
        def fit(self, X):
            X_imp = self.imputer.fit_transform(X)
            self.scaler.fit(X_imp)
            self.is_fitted = True
            return self
        def transform(self, X):
            if not self.is_fitted:
                raise RuntimeError("Call fit() first")
            X_imp = self.imputer.transform(X)
            return self.scaler.transform(X_imp)
        def fit_transform(self, X):
            return self.fit(X).transform(X)
    iris = load_iris()
    X = iris.data.copy()
    X[::10, 0] = np.nan
    pp = PreprocessingPipeline()
    X_out = pp.fit_transform(X)
    print("Ex27 — PreprocessingPipeline | input shape:", X.shape, "| output shape:", X_out.shape)
    print("        Output mean (≈0):", X_out.mean(axis=0).round(4).tolist())

def ex28():
    """DataCleaner class: nulls + dupes + outliers"""
    class DataCleaner:
        def __init__(self, fill_strategy='mean', iqr_multiplier=1.5):
            self.fill_strategy = fill_strategy
            self.iqr_multiplier = iqr_multiplier
            self.stats = {}
        def fit(self, df):
            numeric = df.select_dtypes(include=np.number)
            for col in numeric.columns:
                Q1, Q3 = numeric[col].quantile(0.25), numeric[col].quantile(0.75)
                self.stats[col] = {
                    'mean': numeric[col].mean(),
                    'median': numeric[col].median(),
                    'lower': Q1 - self.iqr_multiplier * (Q3 - Q1),
                    'upper': Q3 + self.iqr_multiplier * (Q3 - Q1),
                }
            return self
        def transform(self, df):
            out = df.copy()
            out = out.drop_duplicates()
            for col, s in self.stats.items():
                fill_val = s['mean'] if self.fill_strategy == 'mean' else s['median']
                out[col] = out[col].fillna(fill_val)
                out[col] = out[col].clip(lower=s['lower'], upper=s['upper'])
            return out
    df = get_iris_with_nulls()
    dc = DataCleaner()
    dc.fit(df)
    cleaned = dc.transform(df)
    print("Ex28 — DataCleaner | before nulls:", int(df.isnull().sum().sum()),
          "| after nulls:", int(cleaned.isnull().sum().sum()))
    print("        Before rows:", len(df), "| after rows:", len(cleaned))

def ex29():
    """SchemaValidator class: check dtypes + ranges + nulls"""
    class SchemaValidator:
        def __init__(self, schema):
            self.schema = schema
            self.violations = []
        def validate(self, df):
            self.violations = []
            for col, rules in self.schema.items():
                if col not in df.columns:
                    self.violations.append(f"Column '{col}' missing")
                    continue
                if 'dtype' in rules:
                    if not pd.api.types.is_numeric_dtype(df[col]) and rules['dtype'] == 'numeric':
                        self.violations.append(f"'{col}' should be numeric")
                if 'min' in rules:
                    bad = (df[col] < rules['min']).sum()
                    if bad > 0:
                        self.violations.append(f"'{col}' has {bad} values below min {rules['min']}")
                if 'max' in rules:
                    bad = (df[col] > rules['max']).sum()
                    if bad > 0:
                        self.violations.append(f"'{col}' has {bad} values above max {rules['max']}")
                if rules.get('no_nulls', False):
                    n = df[col].isnull().sum()
                    if n > 0:
                        self.violations.append(f"'{col}' has {n} null values")
            return len(self.violations) == 0
    iris = load_iris()
    df = pd.DataFrame(iris.data, columns=iris.feature_names)
    schema = {
        'sepal length (cm)': {'dtype': 'numeric', 'min': 0, 'max': 20, 'no_nulls': True},
        'petal length (cm)': {'dtype': 'numeric', 'min': 0, 'no_nulls': True},
    }
    sv = SchemaValidator(schema)
    valid = sv.validate(df)
    print("Ex29 — SchemaValidator | valid:", valid, "| violations:", sv.violations)

def ex30():
    """TrainTestPreprocessor class: fit on train, transform both"""
    class TrainTestPreprocessor:
        def __init__(self):
            self.scaler = StandardScaler()
            self.imputer = SimpleImputer(strategy='mean')
        def fit_transform_train(self, X_train):
            X_imp = self.imputer.fit_transform(X_train)
            return self.scaler.fit_transform(X_imp)
        def transform_test(self, X_test):
            X_imp = self.imputer.transform(X_test)
            return self.scaler.transform(X_imp)
    iris = load_iris()
    X, y = iris.data, iris.target
    X[::10, 0] = np.nan
    X_train, X_test, _, _ = train_test_split(X, y, test_size=0.2, random_state=42)
    ttp = TrainTestPreprocessor()
    X_train_t = ttp.fit_transform_train(X_train)
    X_test_t = ttp.transform_test(X_test)
    print("Ex30 — TrainTestPreprocessor | train shape:", X_train_t.shape,
          "| test shape:", X_test_t.shape)
    print("        Train mean (≈0):", X_train_t.mean(axis=0).round(4).tolist())
    print("        Test mean (may differ):", X_test_t.mean(axis=0).round(4).tolist())

def ex31():
    """PreprocessingAudit class: before/after stats"""
    class PreprocessingAudit:
        def snapshot(self, df, label=""):
            numeric = df.select_dtypes(include=np.number)
            snap = {
                "label": label,
                "shape": df.shape,
                "nulls": int(df.isnull().sum().sum()),
                "duplicates": int(df.duplicated().sum()),
                "means": numeric.mean().round(3).to_dict(),
                "stds": numeric.std().round(3).to_dict(),
            }
            return snap
        def compare(self, snap_before, snap_after):
            return {
                "shape_change": (snap_before['shape'], snap_after['shape']),
                "nulls_removed": snap_before['nulls'] - snap_after['nulls'],
                "dupes_removed": snap_before['duplicates'] - snap_after['duplicates'],
            }
    df = get_iris_with_nulls()
    audit = PreprocessingAudit()
    before = audit.snapshot(df, "before")
    df_clean = df.fillna(df.mean(numeric_only=True)).drop_duplicates()
    after = audit.snapshot(df_clean, "after")
    comparison = audit.compare(before, after)
    print("Ex31 — PreprocessingAudit comparison:", comparison)

def ex32():
    """Full ColumnTransformer pipeline (mixed types)"""
    from sklearn.preprocessing import OneHotEncoder
    np.random.seed(42)
    n = 200
    df = pd.DataFrame({
        'age': np.random.randint(20, 70, n).astype(float),
        'income': np.random.exponential(50000, n),
        'city': np.random.choice(['NY', 'LA', 'CHI'], n),
        'edu': np.random.choice(['HS', 'BS', 'MS', 'PhD'], n),
    })
    df.loc[::15, 'age'] = np.nan
    y = (df['income'] > 50000).astype(int).values
    num_features = ['age', 'income']
    cat_features = ['city', 'edu']
    num_transformer = Pipeline([
        ('imp', SimpleImputer(strategy='median')),
        ('scl', StandardScaler()),
    ])
    cat_transformer = Pipeline([
        ('imp', SimpleImputer(strategy='most_frequent')),
        ('ohe', OneHotEncoder(sparse_output=False, handle_unknown='ignore')),
    ])
    ct = ColumnTransformer([
        ('num', num_transformer, num_features),
        ('cat', cat_transformer, cat_features),
    ])
    X_out = ct.fit_transform(df)
    print("Ex32 — Full ColumnTransformer | input:", df.shape, "| output:", X_out.shape)

def ex33():
    """Preprocessing + model pipeline + cross-validation"""
    iris = load_iris()
    X = pd.DataFrame(iris.data, columns=iris.feature_names)
    X.loc[::10, 'sepal length (cm)'] = np.nan
    y = iris.target
    pipe = Pipeline([
        ('imputer', SimpleImputer(strategy='mean')),
        ('scaler', StandardScaler()),
        ('model', LogisticRegression(max_iter=300, random_state=42)),
    ])
    scores = cross_val_score(pipe, X, y, cv=5, scoring='accuracy')
    print("Ex33 — Preprocessing + model pipeline | CV scores:", scores.round(3).tolist())
    print("        Mean accuracy:", round(scores.mean(), 4),
          "| Std:", round(scores.std(), 4))

def ex34():
    """Save/load preprocessing pipeline with joblib"""
    iris = load_iris()
    X = iris.data
    pipe = Pipeline([
        ('imputer', SimpleImputer(strategy='mean')),
        ('scaler', StandardScaler()),
    ])
    pipe.fit(X)
    # Save to bytes buffer (in-memory, no disk file)
    buffer = io.BytesIO()
    joblib.dump(pipe, buffer)
    buffer.seek(0)
    loaded_pipe = joblib.load(buffer)
    X_orig = pipe.transform(X[:3])
    X_loaded = loaded_pipe.transform(X[:3])
    match = np.allclose(X_orig, X_loaded)
    print("Ex34 — joblib save/load pipeline | transform matches:", match)
    print("        Pipeline steps:", [name for name, _ in loaded_pipe.steps])

def ex35():
    """Preprocessing for time series"""
    np.random.seed(42)
    n = 100
    ts = pd.DataFrame({
        'ds': pd.date_range('2022-01-01', periods=n, freq='D'),
        'value': np.cumsum(np.random.randn(n)) + 50,
    })
    ts['value_diff'] = ts['value'].diff()
    ts['value_log'] = np.log1p(np.abs(ts['value']))
    ts['rolling_mean'] = ts['value'].rolling(7, min_periods=1).mean()
    ts['rolling_std'] = ts['value'].rolling(7, min_periods=1).std().fillna(0)
    ts['lag_1'] = ts['value'].shift(1)
    ts = ts.dropna().reset_index(drop=True)
    print("Ex35 — Time series preprocessing | shape:", ts.shape,
          "| columns:", list(ts.columns))
    print("        Sample row:\n", ts.iloc[5].to_dict())

def ex36():
    """Preprocessing for mixed text + numeric"""
    from sklearn.feature_extraction.text import TfidfVectorizer
    from scipy.sparse import hstack, csr_matrix
    np.random.seed(42)
    data = {
        'text': ["good product", "terrible quality", "average item",
                 "excellent service", "bad experience"],
        'price': [10.0, 5.0, 15.0, 25.0, 8.0],
        'rating': [5, 1, 3, 5, 2],
    }
    df = pd.DataFrame(data)
    tfidf = TfidfVectorizer(max_features=10)
    X_text = tfidf.fit_transform(df['text'])
    scaler = StandardScaler()
    X_num = scaler.fit_transform(df[['price', 'rating']])
    X_combined = hstack([X_text, csr_matrix(X_num)])
    print("Ex36 — Mixed text+numeric preprocessing | text shape:", X_text.shape)
    print("        Numeric shape:", X_num.shape)
    print("        Combined shape:", X_combined.shape)

def ex37():
    """Preprocessing versioning"""
    class PreprocessingVersioner:
        def __init__(self):
            self.versions = {}
        def register(self, name, pipeline, metadata=None):
            version_id = hashlib.md5(name.encode()).hexdigest()[:6]
            self.versions[version_id] = {
                "name": name,
                "pipeline_steps": [s for s, _ in pipeline.steps],
                "metadata": metadata or {},
            }
            return version_id
        def get(self, version_id):
            return self.versions.get(version_id, None)
        def list_versions(self):
            return {vid: v['name'] for vid, v in self.versions.items()}
    pipe_v1 = Pipeline([('imp', SimpleImputer()), ('scl', StandardScaler())])
    pipe_v2 = Pipeline([('imp', SimpleImputer()), ('scl', MinMaxScaler())])
    pv = PreprocessingVersioner()
    v1 = pv.register("baseline_preprocessing", pipe_v1, {"date": "2025-01-01"})
    v2 = pv.register("minmax_preprocessing", pipe_v2, {"date": "2025-06-01"})
    print("Ex37 — PreprocessingVersioner | versions:", pv.list_versions())
    print("        v1 steps:", pv.get(v1)['pipeline_steps'])
    print("        v2 steps:", pv.get(v2)['pipeline_steps'])

def ex38():
    """Production preprocessing service"""
    class ProductionPreprocessingService:
        def __init__(self):
            self.pipeline = None
            self.feature_names = None
            self.n_transforms = 0
        def build(self, numeric_features, categorical_features):
            from sklearn.preprocessing import OneHotEncoder
            num_tr = Pipeline([('imp', SimpleImputer(strategy='median')),
                               ('scl', StandardScaler())])
            cat_tr = Pipeline([('imp', SimpleImputer(strategy='most_frequent')),
                               ('ohe', OneHotEncoder(sparse_output=False, handle_unknown='ignore'))])
            self.pipeline = ColumnTransformer([('num', num_tr, numeric_features),
                                               ('cat', cat_tr, categorical_features)])
            return self
        def fit(self, df, y=None):
            self.pipeline.fit(df)
            return self
        def transform(self, df):
            self.n_transforms += 1
            return self.pipeline.transform(df)
        def stats(self):
            return {"n_transforms": self.n_transforms,
                    "pipeline_built": self.pipeline is not None}
    np.random.seed(42)
    df = pd.DataFrame({
        'age': np.random.randint(20, 60, 50).astype(float),
        'income': np.random.normal(50000, 10000, 50),
        'city': np.random.choice(['NY', 'LA'], 50),
    })
    svc = ProductionPreprocessingService()
    svc.build(['age', 'income'], ['city'])
    svc.fit(df)
    out = svc.transform(df)
    print("Ex38 — ProductionPreprocessingService | output shape:", out.shape)
    print("        Service stats:", svc.stats())

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Data leakage prevention in preprocessing"""
    def leakage_safe_preprocessing(X_train, X_test, y_train):
        scaler = StandardScaler()
        imputer = SimpleImputer(strategy='mean')
        X_train_imp = imputer.fit_transform(X_train)
        X_test_imp = imputer.transform(X_test)
        X_train_scaled = scaler.fit_transform(X_train_imp)
        X_test_scaled = scaler.transform(X_test_imp)
        return X_train_scaled, X_test_scaled
    iris = load_iris()
    X, y = iris.data, iris.target
    X[::10, 0] = np.nan
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    X_tr, X_te = leakage_safe_preprocessing(X_train, X_test, y_train)
    print("Ex39 — Leakage-safe preprocessing:")
    print("        Train mean (≈0):", X_tr.mean(axis=0).round(4).tolist())
    print("        Test mean (not forced to 0):", X_te.mean(axis=0).round(4).tolist())

def ex40():
    """Target encoding with cross-validation (leak-safe)"""
    class CrossValTargetEncoder:
        def __init__(self, n_splits=5, smoothing=10):
            self.n_splits = n_splits
            self.smoothing = smoothing
            self.global_mean_ = None
            self.encoding_map_ = {}
        def fit_transform(self, X_col, y):
            self.global_mean_ = np.mean(y)
            out = pd.Series(np.nan, index=X_col.index)
            kf = KFold(n_splits=self.n_splits, shuffle=True, random_state=42)
            from sklearn.model_selection import KFold as KF
            kf2 = KF(n_splits=self.n_splits, shuffle=True, random_state=42)
            for tr_idx, val_idx in kf2.split(X_col):
                tr_x, tr_y = X_col.iloc[tr_idx], np.array(y)[tr_idx]
                stats = pd.DataFrame({'x': tr_x, 'y': tr_y}).groupby('x')['y']
                counts = stats.count()
                means = stats.mean()
                smooth = (counts * means + self.smoothing * self.global_mean_) / (counts + self.smoothing)
                out.iloc[val_idx] = X_col.iloc[val_idx].map(smooth).fillna(self.global_mean_)
            stats_all = pd.DataFrame({'x': X_col, 'y': y}).groupby('x')['y']
            counts_all, means_all = stats_all.count(), stats_all.mean()
            self.encoding_map_ = (
                (counts_all * means_all + self.smoothing * self.global_mean_) /
                (counts_all + self.smoothing)
            ).to_dict()
            return out
        def transform(self, X_col):
            return X_col.map(self.encoding_map_).fillna(self.global_mean_)
    np.random.seed(42)
    df = pd.DataFrame({
        'cat': np.random.choice(['A', 'B', 'C'], 100),
        'target': np.random.randn(100),
    })
    enc = CrossValTargetEncoder(n_splits=5)
    df['cat_te'] = enc.fit_transform(df['cat'], df['target'])
    print("Ex40 — CrossVal TargetEncoder | encoding map:", {k: round(v, 4) for k, v in enc.encoding_map_.items()})
    print("        Encoded sample:", df['cat_te'].round(4).head(5).tolist())

def ex41():
    """Preprocessing for missing at random (MAR) vs MCAR vs MNAR"""
    np.random.seed(42)
    n = 100
    df = pd.DataFrame({
        'income': np.random.normal(50000, 10000, n),
        'age': np.random.randint(20, 65, n).astype(float),
        'satisfaction': np.random.randint(1, 6, n).astype(float),
    })
    mcar_idx = np.random.choice(n, 10, replace=False)
    df.loc[mcar_idx, 'age'] = np.nan
    mar_idx = np.where(df['income'] > 60000)[0][:10]
    df.loc[mar_idx, 'satisfaction'] = np.nan
    mnar_idx = np.where(df['income'] < 40000)[0][:10]
    df.loc[mnar_idx, 'income'] = np.nan
    missing_summary = df.isnull().sum().to_dict()
    print("Ex41 — Missing data types simulation:")
    print("        MCAR (age):", missing_summary['age'], "missing")
    print("        MAR (satisfaction):", missing_summary['satisfaction'], "missing")
    print("        MNAR (income):", missing_summary['income'], "missing")
    df_imp = df.fillna(df.median(numeric_only=True))
    print("        After median imputation nulls:", df_imp.isnull().sum().sum())

def ex42():
    """Multiple imputation using IterativeImputer"""
    from sklearn.experimental import enable_iterative_imputer
    from sklearn.impute import IterativeImputer
    np.random.seed(42)
    X = np.random.randn(50, 4)
    X[::5, 0] = np.nan
    X[::7, 2] = np.nan
    imputed_versions = []
    for seed in range(3):
        imp = IterativeImputer(max_iter=10, random_state=seed)
        imputed_versions.append(imp.fit_transform(X))
    means = np.mean([v[:, 0] for v in imputed_versions], axis=0)
    stds = np.std([v[:, 0] for v in imputed_versions], axis=0)
    print("Ex42 — Multiple imputation (3 versions) | shape:", X.shape)
    print("        Imputation uncertainty (std across 3) for col0 (first 5):",
          stds[:5].round(4).tolist())
    print("        Mean imputed col0 (first 5):", means[:5].round(4).tolist())

def ex43():
    """Preprocessing for high-cardinality categoricals"""
    np.random.seed(42)
    n = 500
    n_cats = 100
    df = pd.DataFrame({
        'category': np.random.choice([f'cat_{i}' for i in range(n_cats)], n),
        'value': np.random.randn(n),
    })
    freq_map = df['category'].value_counts().to_dict()
    min_freq = 5
    df['cat_grouped'] = df['category'].apply(
        lambda x: x if freq_map[x] >= min_freq else '__rare__'
    )
    df['cat_freq_enc'] = df['category'].map(freq_map) / n
    n_before = df['category'].nunique()
    n_after = df['cat_grouped'].nunique()
    print("Ex43 — High-cardinality preprocessing:")
    print("        Categories before:", n_before, "| after grouping rare:", n_after)
    print("        Freq encoding range:", round(df['cat_freq_enc'].min(), 4),
          "to", round(df['cat_freq_enc'].max(), 4))

def ex44():
    """Preprocessing for high-dimensional data"""
    from sklearn.decomposition import PCA
    from sklearn.feature_selection import VarianceThreshold
    np.random.seed(42)
    n, d = 100, 200
    X = np.random.randn(n, d)
    X[:, 150:] = 0.001
    vt = VarianceThreshold(threshold=0.01)
    X_vt = vt.fit_transform(X)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_vt)
    pca = PCA(n_components=0.95, svd_solver='full')
    X_pca = pca.fit_transform(X_scaled)
    print("Ex44 — High-dimensional preprocessing:")
    print("        Original:", X.shape, "| after VarianceThreshold:", X_vt.shape)
    print("        After PCA (95% var):", X_pca.shape,
          "| components used:", pca.n_components_)

def ex45():
    """Preprocessing benchmark: compare scalers on model accuracy"""
    from sklearn.neighbors import KNeighborsClassifier
    iris = load_iris()
    X, y = iris.data, iris.target
    X[::10, 0] = np.nan
    scalers = {
        'StandardScaler': StandardScaler(),
        'MinMaxScaler': MinMaxScaler(),
        'RobustScaler': RobustScaler(),
        'None': None,
    }
    results = {}
    for name, scaler in scalers.items():
        steps = [('imp', SimpleImputer(strategy='mean'))]
        if scaler:
            steps.append(('scl', scaler))
        steps.append(('clf', KNeighborsClassifier(n_neighbors=5)))
        pipe = Pipeline(steps)
        scores = cross_val_score(pipe, X, y, cv=5, scoring='accuracy')
        results[name] = round(scores.mean(), 4)
    print("Ex45 — Preprocessing benchmark (KNN accuracy):")
    for name, score in sorted(results.items(), key=lambda x: -x[1]):
        print(f"        {name}: {score}")

def ex46():
    """Adversarial validation for preprocessing"""
    from sklearn.ensemble import RandomForestClassifier
    np.random.seed(42)
    n = 200
    X_train = pd.DataFrame(np.random.randn(n, 5), columns=[f'f{i}' for i in range(5)])
    X_test = pd.DataFrame(np.random.randn(n, 5), columns=[f'f{i}' for i in range(5)])
    X_test['f2'] += 3.0
    X_all = pd.concat([X_train.assign(is_test=0), X_test.assign(is_test=1)])
    y_all = X_all.pop('is_test').values
    scaler = StandardScaler()
    X_all_scaled = scaler.fit_transform(X_all)
    rf = RandomForestClassifier(n_estimators=50, random_state=42)
    scores = cross_val_score(rf, X_all_scaled, y_all, cv=5, scoring='roc_auc')
    print("Ex46 — Adversarial validation AUC:", scores.round(3).tolist())
    print("        Mean AUC:", round(scores.mean(), 4),
          "('high AUC means train/test differ significantly')")

def ex47():
    """Preprocessing drift detection"""
    class PreprocessingDriftDetector:
        def __init__(self, threshold=0.5):
            self.threshold = threshold
            self.ref_stats = {}
        def fit(self, X):
            df = pd.DataFrame(X) if not isinstance(X, pd.DataFrame) else X
            numeric = df.select_dtypes(include=np.number)
            for col in numeric.columns:
                self.ref_stats[col] = {'mean': numeric[col].mean(), 'std': numeric[col].std()}
            return self
        def detect_drift(self, X_new):
            df_new = pd.DataFrame(X_new) if not isinstance(X_new, pd.DataFrame) else X_new
            numeric = df_new.select_dtypes(include=np.number)
            drift_report = {}
            for col in numeric.columns:
                if col not in self.ref_stats:
                    continue
                ref = self.ref_stats[col]
                shift = abs(numeric[col].mean() - ref['mean']) / (ref['std'] + 1e-9)
                drift_report[col] = {'normalized_shift': round(shift, 4),
                                      'drifted': bool(shift > self.threshold)}
            return drift_report
    np.random.seed(42)
    X_ref = np.random.randn(100, 3)
    X_new = np.random.randn(100, 3)
    X_new[:, 1] += 2.0
    pdd = PreprocessingDriftDetector(threshold=0.5)
    pdd.fit(X_ref)
    report = pdd.detect_drift(X_new)
    print("Ex47 — Preprocessing drift detection:")
    for col, info in report.items():
        print(f"        Feature {col}: shift={info['normalized_shift']}, drifted={info['drifted']}")

def ex48():
    """Online/streaming preprocessing"""
    class OnlineScaler:
        def __init__(self):
            self.n = 0
            self.mean = None
            self.M2 = None
        def partial_fit(self, x):
            x = np.asarray(x, dtype=float)
            if self.mean is None:
                self.mean = np.zeros_like(x)
                self.M2 = np.zeros_like(x)
            self.n += 1
            delta = x - self.mean
            self.mean += delta / self.n
            delta2 = x - self.mean
            self.M2 += delta * delta2
        def transform(self, x):
            std = np.sqrt(self.M2 / max(self.n - 1, 1)) + 1e-9
            return (np.asarray(x) - self.mean) / std
        @property
        def std(self):
            return np.sqrt(self.M2 / max(self.n - 1, 1))
    np.random.seed(42)
    stream = np.random.randn(50, 3) * 5 + 10
    scaler = OnlineScaler()
    for row in stream:
        scaler.partial_fit(row)
    sample = stream[-1]
    scaled = scaler.transform(sample)
    print("Ex48 — OnlineScaler | n_seen:", scaler.n)
    print("        Running mean:", scaler.mean.round(3).tolist())
    print("        Running std:", scaler.std.round(3).tolist())
    print("        Last row scaled:", scaled.round(4).tolist())

def ex49():
    """Preprocessing best practices checklist"""
    checklist = [
        "1.  Always fit preprocessing on training data ONLY — never on the full dataset",
        "2.  Apply the same fitted transformers to validation/test sets (transform only)",
        "3.  Handle missing values BEFORE encoding categoricals",
        "4.  Use pipelines to bundle imputation + scaling + encoding as one object",
        "5.  Use StratifiedSplit for classification to maintain class distribution",
        "6.  For time series, always split chronologically — no shuffling",
        "7.  Log-transform heavy-tailed numeric features before scaling",
        "8.  Use RobustScaler when outliers are present and cannot be removed",
        "9.  Group rare categories (< threshold) into an 'other' bucket",
        "10. Apply target encoding with K-fold cross-validation to prevent leakage",
        "11. Clip outliers using IQR bounds from training set statistics",
        "12. Validate schema (dtypes, ranges, nulls) before entering the pipeline",
        "13. Save and version your preprocessing pipeline using joblib or pickle",
        "14. Monitor feature distributions for drift in production",
        "15. Document every preprocessing step and its rationale",
    ]
    print("Ex49 — Preprocessing Best Practices:")
    for item in checklist:
        print("   ", item)

def ex50():
    """Production preprocessing architecture"""
    architecture = {
        "components": [
            "1. Data Ingestion Layer: read from DB/file/API",
            "2. Schema Validation: check dtypes, ranges, required fields",
            "3. Data Cleaning: remove duplicates, fix encoding issues",
            "4. Missing Value Imputation: strategy per column type",
            "5. Outlier Handling: clip or flag extreme values",
            "6. Feature Encoding: OHE / ordinal / target encoding",
            "7. Feature Scaling: standard / min-max / robust",
            "8. Feature Engineering: interactions, logs, cyclical",
            "9. Feature Selection: variance threshold + importance pruning",
            "10. Pipeline Serialization: joblib / ONNX export",
        ],
        "monitoring": [
            "Track distribution shift (PSI per feature)",
            "Alert on null rate increase above threshold",
            "Version all preprocessing artifacts",
            "A/B test preprocessing changes before promotion",
        ],
        "best_practices": [
            "Use ColumnTransformer for type-specific transformations",
            "Never transform test data before building the pipeline",
            "Log before/after stats for audit trail",
        ]
    }
    print("Ex50 — Production Preprocessing Architecture:")
    for section, items in architecture.items():
        print(f"\n  [{section.upper()}]")
        for item in items:
            print(f"    - {item}")


def main():
    print("=" * 60)
    print("Examples 2.3 — Data Preprocessing")
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
