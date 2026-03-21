# ============================================================
# Exercise 1.2 — Data Preprocessing & Feature Engineering
# ============================================================
# Topics:
#   • Scaling (StandardScaler, MinMaxScaler)
#   • Encoding (LabelEncoder, OneHotEncoder, ordinal)
#   • Imputation and outlier removal
#   • Feature selection and polynomial features
#   • Preprocessing Pipeline
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

# Sample data used across multiple TODOs
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
# TODO 1: Scale features using StandardScaler (zero mean, unit variance)
# ---------------------------------------------------------------------------
# Fit and transform X_raw. Return the scaled array.

def standard_scale(X):
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 2: Scale features using MinMaxScaler (range [0, 1])
# ---------------------------------------------------------------------------

def minmax_scale(X):
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 3: Encode categorical labels using LabelEncoder
# ---------------------------------------------------------------------------
# labels = ['cat', 'dog', 'bird', 'dog', 'cat', 'bird']
# Return the encoded integer array.

def label_encode():
    labels = ['cat', 'dog', 'bird', 'dog', 'cat', 'bird']
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 4: One-hot encode a categorical column
# ---------------------------------------------------------------------------
# Given the DataFrame below, one-hot encode the 'color' column
# using pd.get_dummies. Return the resulting DataFrame.

def one_hot_encode():
    df = pd.DataFrame({
        'color': ['red', 'blue', 'green', 'blue', 'red'],
        'value': [10, 20, 30, 40, 50]
    })
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 5: Handle missing values with SimpleImputer (mean strategy)
# ---------------------------------------------------------------------------
# X_missing has NaN values. Impute them using the mean of each column.
# Return the imputed array.

def impute_missing():
    X_missing = np.array([
        [1.0, 2.0],
        [np.nan, 3.0],
        [7.0, np.nan],
        [4.0, 6.0],
    ])
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 6: Detect and remove outliers using the IQR method
# ---------------------------------------------------------------------------
# Given a 1D array, remove values that fall below Q1 - 1.5*IQR
# or above Q3 + 1.5*IQR. Return the cleaned array.

def remove_outliers_iqr(arr):
    # arr = np.array([10, 12, 11, 9, 13, 100, 10, 11, 12, -50])
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 7: Split data into train/test sets (80/20, random_state=42)
# ---------------------------------------------------------------------------
# Return (X_train, X_test, y_train, y_test) from X_raw, y_raw

def split_data():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 8: Create polynomial features (degree=2) for X_raw
# ---------------------------------------------------------------------------
# Return the transformed feature matrix and print its shape.

def create_polynomial_features(X):
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 9: Select top-2 features using SelectKBest with f_classif
# ---------------------------------------------------------------------------
# Use X_raw as features and y_raw as target. Return the selected feature array.

def select_top_features(X, y, k=2):
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 10: Apply log transformation to a skewed column
# ---------------------------------------------------------------------------
# Apply np.log1p to the second column of X_raw (the 'large value' column).
# Return only the transformed column as a 1D array.

def log_transform(X):
    pass  # TODO: implement (use np.log1p on column index 1)

# ---------------------------------------------------------------------------
# TODO 11: Bin continuous values into categories using pd.cut
# ---------------------------------------------------------------------------
# Given ages = [5, 12, 20, 35, 55, 70, 80], bin them into:
#   labels = ['child', 'teen', 'adult', 'middle_age', 'senior']
#   bins   = [0, 12, 18, 35, 60, 100]
# Return the resulting Categorical Series.

def bin_ages():
    ages = [5, 12, 20, 35, 55, 70, 80]
    bins = [0, 12, 18, 35, 60, 100]
    labels = ['child', 'teen', 'adult', 'middle_age', 'senior']
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 12: Create interaction features (multiply two columns)
# ---------------------------------------------------------------------------
# Multiply column 0 and column 1 of X_raw element-wise.
# Return the interaction as a 1D array.

def interaction_feature(X):
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 13: Normalize a text column (lowercase and strip whitespace)
# ---------------------------------------------------------------------------
# Given the Series below, return it normalized.

def normalize_text():
    text_col = pd.Series(['  Hello ', 'WORLD', ' Python ', 'Data Science  '])
    pass  # TODO: implement (use .str.lower().str.strip())

# ---------------------------------------------------------------------------
# TODO 14: Encode ordinal features using a custom mapping
# ---------------------------------------------------------------------------
# Map 'education' column: {'High School': 1, 'Bachelor': 2, 'Master': 3, 'PhD': 4}
# Return the DataFrame with a new 'education_encoded' column.

def encode_ordinal():
    df = pd.DataFrame({
        'name': ['Alice', 'Bob', 'Charlie', 'Diana'],
        'education': ['Master', 'High School', 'PhD', 'Bachelor']
    })
    mapping = {'High School': 1, 'Bachelor': 2, 'Master': 3, 'PhD': 4}
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 15: Build a preprocessing pipeline using sklearn Pipeline
# ---------------------------------------------------------------------------
# Build a Pipeline with:
#   Step 1: SimpleImputer(strategy='mean')
#   Step 2: StandardScaler()
#   Step 3: LogisticRegression(random_state=42)
# Fit it on X_train, y_train and evaluate on X_test, y_test.
# Return the test accuracy score.

def build_pipeline():
    X_train, X_test, y_train, y_test = split_data()
    pass  # TODO: implement

# ---------------------------------------------------------------------------

def main():
    print("=== Exercise 1.2: Data Preprocessing & Feature Engineering ===\n")

    print("TODO 1  — StandardScaler:\n", standard_scale(X_raw))
    print("\nTODO 2  — MinMaxScaler:\n", minmax_scale(X_raw))
    print("\nTODO 3  — LabelEncoder:", label_encode())
    print("\nTODO 4  — OneHot encoded:\n", one_hot_encode())
    print("\nTODO 5  — Imputed array:\n", impute_missing())

    arr = np.array([10, 12, 11, 9, 13, 100, 10, 11, 12, -50])
    print("\nTODO 6  — IQR cleaned:", remove_outliers_iqr(arr))

    X_tr, X_te, y_tr, y_te = split_data()
    print("\nTODO 7  — Train size:", X_tr.shape, "Test size:", X_te.shape)

    poly_X = create_polynomial_features(X_raw)
    print("\nTODO 8  — Polynomial features shape:", poly_X.shape if poly_X is not None else None)

    sel = select_top_features(X_raw, y_raw, k=2)
    print("\nTODO 9  — Selected features shape:", sel.shape if sel is not None else None)

    print("\nTODO 10 — Log-transformed column:", log_transform(X_raw))
    print("\nTODO 11 — Binned ages:", bin_ages())
    print("\nTODO 12 — Interaction feature:", interaction_feature(X_raw))
    print("\nTODO 13 — Normalized text:", normalize_text())
    print("\nTODO 14 — Ordinal encoded:\n", encode_ordinal())
    print("\nTODO 15 — Pipeline test accuracy:", build_pipeline())

if __name__ == "__main__":
    main()
