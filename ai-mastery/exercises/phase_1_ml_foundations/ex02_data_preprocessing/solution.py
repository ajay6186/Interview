# ============================================================
# Solution 1.2 — Data Preprocessing & Feature Engineering
# ============================================================

import numpy as np
import pandas as pd
from sklearn.preprocessing import (
    StandardScaler, MinMaxScaler, LabelEncoder, OneHotEncoder, PolynomialFeatures
)
from sklearn.impute import SimpleImputer
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression

np.random.seed(42)
X_raw = np.array([
    [1.0, 200.0],
    [2.0, 150.0],
    [3.0, 300.0],
    [4.0, 250.0],
    [5.0, 100.0],
    [6.0, 400.0],
])
y_raw = np.array([0, 0, 1, 1, 0, 1])

# ---------------------------------------------------------------------------
# TODO 1: StandardScaler
# ---------------------------------------------------------------------------

def standard_scale(X):
    scaler = StandardScaler()
    return scaler.fit_transform(X)

# ---------------------------------------------------------------------------
# TODO 2: MinMaxScaler
# ---------------------------------------------------------------------------

def minmax_scale(X):
    scaler = MinMaxScaler()
    return scaler.fit_transform(X)

# ---------------------------------------------------------------------------
# TODO 3: LabelEncoder
# ---------------------------------------------------------------------------

def label_encode():
    labels = ['cat', 'dog', 'bird', 'dog', 'cat', 'bird']
    le = LabelEncoder()
    return le.fit_transform(labels)

# ---------------------------------------------------------------------------
# TODO 4: One-hot encode with pd.get_dummies
# ---------------------------------------------------------------------------

def one_hot_encode():
    df = pd.DataFrame({
        'color': ['red', 'blue', 'green', 'blue', 'red'],
        'value': [10, 20, 30, 40, 50]
    })
    return pd.get_dummies(df, columns=['color'])

# ---------------------------------------------------------------------------
# TODO 5: SimpleImputer (mean strategy)
# ---------------------------------------------------------------------------

def impute_missing():
    X_missing = np.array([
        [1.0, 2.0],
        [np.nan, 3.0],
        [7.0, np.nan],
        [4.0, 6.0],
    ])
    imputer = SimpleImputer(strategy='mean')
    return imputer.fit_transform(X_missing)

# ---------------------------------------------------------------------------
# TODO 6: IQR outlier removal
# ---------------------------------------------------------------------------

def remove_outliers_iqr(arr):
    q1 = np.percentile(arr, 25)
    q3 = np.percentile(arr, 75)
    iqr = q3 - q1
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr
    return arr[(arr >= lower) & (arr <= upper)]

# ---------------------------------------------------------------------------
# TODO 7: Train/test split 80/20
# ---------------------------------------------------------------------------

def split_data():
    return train_test_split(X_raw, y_raw, test_size=0.2, random_state=42)

# ---------------------------------------------------------------------------
# TODO 8: Polynomial features (degree=2)
# ---------------------------------------------------------------------------

def create_polynomial_features(X):
    poly = PolynomialFeatures(degree=2, include_bias=False)
    X_poly = poly.fit_transform(X)
    print(f"  Polynomial feature names: {poly.get_feature_names_out()}")
    return X_poly

# ---------------------------------------------------------------------------
# TODO 9: SelectKBest with f_classif
# ---------------------------------------------------------------------------

def select_top_features(X, y, k=2):
    selector = SelectKBest(score_func=f_classif, k=k)
    X_selected = selector.fit_transform(X, y)
    print(f"  Selected feature indices: {selector.get_support(indices=True)}")
    return X_selected

# ---------------------------------------------------------------------------
# TODO 10: Log transformation
# ---------------------------------------------------------------------------

def log_transform(X):
    return np.log1p(X[:, 1])

# ---------------------------------------------------------------------------
# TODO 11: Bin ages with pd.cut
# ---------------------------------------------------------------------------

def bin_ages():
    ages = [5, 12, 20, 35, 55, 70, 80]
    bins = [0, 12, 18, 35, 60, 100]
    labels = ['child', 'teen', 'adult', 'middle_age', 'senior']
    return pd.cut(ages, bins=bins, labels=labels)

# ---------------------------------------------------------------------------
# TODO 12: Interaction feature
# ---------------------------------------------------------------------------

def interaction_feature(X):
    return X[:, 0] * X[:, 1]

# ---------------------------------------------------------------------------
# TODO 13: Normalize text column
# ---------------------------------------------------------------------------

def normalize_text():
    text_col = pd.Series(['  Hello ', 'WORLD', ' Python ', 'Data Science  '])
    return text_col.str.lower().str.strip()

# ---------------------------------------------------------------------------
# TODO 14: Ordinal encoding via custom mapping
# ---------------------------------------------------------------------------

def encode_ordinal():
    df = pd.DataFrame({
        'name': ['Alice', 'Bob', 'Charlie', 'Diana'],
        'education': ['Master', 'High School', 'PhD', 'Bachelor']
    })
    mapping = {'High School': 1, 'Bachelor': 2, 'Master': 3, 'PhD': 4}
    df = df.copy()
    df['education_encoded'] = df['education'].map(mapping)
    return df

# ---------------------------------------------------------------------------
# TODO 15: Preprocessing Pipeline
# ---------------------------------------------------------------------------

def build_pipeline():
    X_train, X_test, y_train, y_test = split_data()
    pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='mean')),
        ('scaler',  StandardScaler()),
        ('clf',     LogisticRegression(random_state=42)),
    ])
    pipeline.fit(X_train, y_train)
    return pipeline.score(X_test, y_test)

# ---------------------------------------------------------------------------

def main():
    print("=== Solution 1.2: Data Preprocessing & Feature Engineering ===\n")

    print("Result 1  — StandardScaler:\n", standard_scale(X_raw))
    print("\nResult 2  — MinMaxScaler:\n", minmax_scale(X_raw))
    print("\nResult 3  — LabelEncoder:", label_encode())
    print("\nResult 4  — OneHot encoded:\n", one_hot_encode())
    print("\nResult 5  — Imputed array:\n", impute_missing())

    arr = np.array([10, 12, 11, 9, 13, 100, 10, 11, 12, -50])
    print("\nResult 6  — IQR cleaned:", remove_outliers_iqr(arr))

    X_tr, X_te, y_tr, y_te = split_data()
    print("\nResult 7  — Train size:", X_tr.shape, "| Test size:", X_te.shape)

    poly_X = create_polynomial_features(X_raw)
    print("Result 8  — Polynomial features shape:", poly_X.shape)

    sel = select_top_features(X_raw, y_raw, k=2)
    print("Result 9  — Selected features shape:", sel.shape)

    print("\nResult 10 — Log-transformed column:", log_transform(X_raw))
    print("\nResult 11 — Binned ages:", bin_ages().tolist())
    print("\nResult 12 — Interaction feature:", interaction_feature(X_raw))
    print("\nResult 13 — Normalized text:\n", normalize_text())
    print("\nResult 14 — Ordinal encoded:\n", encode_ordinal())
    print("\nResult 15 — Pipeline test accuracy:", build_pipeline())

if __name__ == "__main__":
    main()
