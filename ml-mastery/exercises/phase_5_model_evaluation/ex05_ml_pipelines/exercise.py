# ============================================================
# Exercise 5.5 — ML Pipelines
# ============================================================
# Topics:
#   • Simple Pipeline: scaler + model
#   • Pipeline with imputer + scaler + model
#   • Pipeline with feature selection + model
#   • ColumnTransformer (numeric + categorical branches)
#   • Full pipeline: imputer + encoder + scaler + model
#   • Pipeline + GridSearchCV
#   • Custom transformer (BaseEstimator + TransformerMixin)
#   • FeatureUnion (concatenate two transformers)
#   • Pipeline inspection (get step by name)
#   • Pipeline serialization (joblib)
#   • Pipeline with cross-validation
#   • Pipeline for text + numeric features
#   • Pipeline visualization (step names)
#   • Production pipeline validation (schema check + predict)
#   • Pipeline versioning strategy
# ============================================================

import numpy as np
import pandas as pd
from sklearn.datasets import make_classification
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import cross_val_score, GridSearchCV
from sklearn.base import BaseEstimator, TransformerMixin
import joblib
import os


# --- TODO 1: Simple Pipeline (scaler + model) ---
# Build Pipeline([("scaler", StandardScaler()), ("clf", LogisticRegression())]).
# Fit on X_train, return accuracy on X_test.
def simple_pipeline(X_train, X_test, y_train, y_test) -> float:
    pass  # TODO: implement


# --- TODO 2: Pipeline with imputer + scaler + model ---
# SimpleImputer(strategy="mean") → StandardScaler → LogisticRegression.
# Data may contain NaN. Return accuracy.
def pipeline_with_imputer(X_train, X_test, y_train, y_test) -> float:
    pass  # TODO: implement


# --- TODO 3: Pipeline with feature selection + model ---
# SelectKBest(f_classif, k=5) → LogisticRegression.
# Return (accuracy, selected_feature_indices).
def pipeline_with_feature_selection(X_train, X_test, y_train, y_test) -> tuple:
    pass  # TODO: implement


# --- TODO 4: ColumnTransformer (numeric + categorical) ---
# num_features: scale with StandardScaler.
# cat_features: encode with OneHotEncoder(handle_unknown="ignore").
# Return the transformer object (fitted).
def column_transformer(X_df: pd.DataFrame, num_cols: list, cat_cols: list):
    pass  # TODO: implement


# --- TODO 5: Full pipeline ---
# Numeric: SimpleImputer(mean) → StandardScaler.
# Categorical: SimpleImputer(most_frequent) → OneHotEncoder.
# Final estimator: LogisticRegression.
# Return fitted pipeline.
def full_pipeline(X_train_df: pd.DataFrame, y_train, num_cols: list, cat_cols: list):
    pass  # TODO: implement


# --- TODO 6: Pipeline + GridSearchCV ---
# Search clf__C in [0.1, 1, 10], cv=5.
# Return (best_params, best_score).
def pipeline_grid_search(X, y) -> tuple:
    pass  # TODO: implement


# --- TODO 7: Custom transformer ---
# ClipTransformer: clips feature values to [lower, upper].
# Must implement fit() and transform().
class ClipTransformer(BaseEstimator, TransformerMixin):
    def __init__(self, lower=-3.0, upper=3.0):
        pass  # TODO: implement

    def fit(self, X, y=None):
        pass  # TODO: implement

    def transform(self, X):
        pass  # TODO: implement


# --- TODO 8: FeatureUnion ---
# Combine StandardScaler output and SelectKBest(k=5) output.
# Return shape of the transformed features.
def feature_union_pipeline(X, y) -> tuple:
    pass  # TODO: implement


# --- TODO 9: Pipeline inspection ---
# Given a fitted pipeline, retrieve the "clf" step by name.
# Return the estimator object.
def inspect_pipeline(pipeline: Pipeline):
    pass  # TODO: implement


# --- TODO 10: Pipeline serialization ---
# Save pipeline to path with joblib.dump, load and predict.
# Return predictions array.
def serialize_pipeline(pipeline: Pipeline, X_test, path: str) -> np.ndarray:
    pass  # TODO: implement


# --- TODO 11: Pipeline with cross-validation ---
# Use cross_val_score(pipeline, X, y, cv=5).
# Return (mean_score, std_score).
def pipeline_cross_val(X, y) -> tuple:
    pass  # TODO: implement


# --- TODO 12: Pipeline for text + numeric features ---
# text_feature: TF-IDF vectorizer column.
# numeric_feature: StandardScaler column.
# Combine with ColumnTransformer. Return transformer shape.
def text_numeric_pipeline(texts: list, numeric: np.ndarray) -> tuple:
    pass  # TODO: implement


# --- TODO 13: Pipeline visualization ---
# Print ordered list of (step_name, step_type) for all steps.
# Return list of (name, class_name) tuples.
def visualize_pipeline(pipeline: Pipeline) -> list:
    pass  # TODO: implement


# --- TODO 14: Production pipeline validation ---
# Check: 1) input has correct number of features,
#         2) no all-NaN columns.
# Return (is_valid: bool, errors: list).
def validate_pipeline_input(X: np.ndarray, expected_features: int) -> tuple:
    pass  # TODO: implement


# --- TODO 15: Pipeline versioning strategy ---
# Return list of 5 best practices for pipeline versioning.
def pipeline_versioning_strategy() -> list:
    pass  # TODO: implement


def main():
    print("=== Exercise 5.5: ML Pipelines ===\n")

    from sklearn.model_selection import train_test_split
    np.random.seed(42)
    X, y = make_classification(n_samples=300, n_features=10, random_state=42)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("TODO 1  - Simple pipeline accuracy:", simple_pipeline(X_train, X_test, y_train, y_test))

    # Inject NaNs
    X_nan = X.copy().astype(float)
    X_nan[np.random.choice(len(X), 20), np.random.choice(10, 20)] = np.nan
    Xn_tr, Xn_te, yn_tr, yn_te = train_test_split(X_nan, y, test_size=0.2, random_state=42)
    print("TODO 2  - Imputer pipeline accuracy:", pipeline_with_imputer(Xn_tr, Xn_te, yn_tr, yn_te))
    print("TODO 3  - Feature selection pipeline:", pipeline_with_feature_selection(X_train, X_test, y_train, y_test))

    # DataFrame for ColumnTransformer
    df = pd.DataFrame(X[:, :3], columns=["n1", "n2", "n3"])
    df["cat"] = np.where(y == 0, "A", "B")
    print("TODO 4  - ColumnTransformer fitted:", column_transformer(df, ["n1", "n2", "n3"], ["cat"]))

    df_train = pd.DataFrame(X_train[:, :3], columns=["n1", "n2", "n3"])
    df_train["cat"] = np.where(y_train == 0, "A", "B")
    print("TODO 5  - Full pipeline fitted:", full_pipeline(df_train, y_train, ["n1", "n2", "n3"], ["cat"]))

    print("TODO 6  - Pipeline GridSearch:", pipeline_grid_search(X, y))

    clip = ClipTransformer(lower=-2.0, upper=2.0)
    clip.fit(X)
    print("TODO 7  - ClipTransformer max:", clip.transform(X).max())

    print("TODO 8  - FeatureUnion shape:", feature_union_pipeline(X, y))

    pipe = Pipeline([("scaler", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    pipe.fit(X_train, y_train)
    print("TODO 9  - Inspect pipeline clf:", inspect_pipeline(pipe))

    preds = serialize_pipeline(pipe, X_test, "/tmp/pipeline_ex55.joblib")
    print("TODO 10 - Serialized predictions shape:", preds.shape if preds is not None else None)
    print("TODO 11 - Pipeline CV:", pipeline_cross_val(X, y))

    texts = ["good product", "bad quality", "excellent", "terrible", "average"]
    numeric = np.array([[1.0], [2.0], [3.0], [4.0], [5.0]])
    print("TODO 12 - Text+numeric pipeline shape:", text_numeric_pipeline(texts, numeric))
    print("TODO 13 - Pipeline visualization:", visualize_pipeline(pipe))
    print("TODO 14 - Validate input:", validate_pipeline_input(X_test, 10))
    print("TODO 15 - Versioning strategy:", pipeline_versioning_strategy())


if __name__ == "__main__":
    main()
