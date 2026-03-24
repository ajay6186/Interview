# ============================================================
# Exercise 3.5 — Ensemble Methods
# ============================================================
# Topics:
#   • Bagging: bootstrap sampling + aggregation
#   • sklearn BaggingClassifier
#   • Boosting concept (reweighting)
#   • AdaBoost, Gradient Boosting (scratch + sklearn)
#   • Hard and soft voting, sklearn VotingClassifier
#   • Stacking and sklearn StackingClassifier
#   • Blending (holdout stacking)
#   • Diversity, bias-variance, ensemble pruning
# ============================================================

import numpy as np
from sklearn.datasets import make_classification
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.ensemble import (BaggingClassifier, AdaBoostClassifier,
                               GradientBoostingClassifier,
                               VotingClassifier, StackingClassifier)
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

np.random.seed(42)
X, y = make_classification(n_samples=400, n_features=10,
                            n_informative=5, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42)


# ---------------------------------------------------------------------------
# TODO 1: Bagging from Scratch
# ---------------------------------------------------------------------------
# Bootstrap aggregating:
#   1. Draw `n_estimators` bootstrap samples (sample n points WITH replacement).
#   2. Fit a DecisionTreeClassifier(max_depth=5) on each bootstrap sample.
#   3. Aggregate predictions: majority vote across all trees.
# Return predicted class labels for X_test.

def bagging_scratch(X_train: np.ndarray, y_train: np.ndarray,
                    X_test: np.ndarray, n_estimators: int = 20) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 2: sklearn BaggingClassifier
# ---------------------------------------------------------------------------
# Fit BaggingClassifier(n_estimators=20, random_state=42)
# on (X_train, y_train). Return (model, test accuracy).

def sklearn_bagging(X_train, y_train, X_test, y_test):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 3: Boosting — Weight Update Concept
# ---------------------------------------------------------------------------
# Given binary predictions y_pred (0/1) and true labels y_true (0/1):
#   1. Compute error = fraction of misclassified samples.
#   2. Compute alpha = 0.5 * log((1 - error) / (error + 1e-10)).
#   3. Update sample weights: w_i *= exp(-alpha * y_signed_i * pred_signed_i)
#      where signed = 2*label - 1 (converts 0/1 to -1/+1).
#   4. Normalize weights so they sum to 1.
# Return (alpha, updated_weights).

def boosting_weight_update(y_true: np.ndarray, y_pred: np.ndarray,
                            weights: np.ndarray):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 4: AdaBoost (sklearn)
# ---------------------------------------------------------------------------
# Fit AdaBoostClassifier(n_estimators=50, random_state=42)
# on (X_train, y_train). Return (model, test accuracy).

def sklearn_adaboost(X_train, y_train, X_test, y_test):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 5: Gradient Boosting from Scratch (residual fitting)
# ---------------------------------------------------------------------------
# Simplified gradient boosting for binary classification:
#   - Start with predictions = 0.5 for all samples.
#   - For each round:
#       1. Compute residuals = y_train - current_predictions.
#       2. Fit a DecisionTreeRegressor(max_depth=2) on (X_train, residuals).
#       3. Update predictions: current += lr * tree.predict(X_train).
#   - Final prediction: classify as 1 if prediction >= 0.5.
# Return predicted class labels for X_test.

def gradient_boosting_scratch(X_train: np.ndarray, y_train: np.ndarray,
                               X_test: np.ndarray, n_rounds: int = 50,
                               lr: float = 0.1) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 6: sklearn GradientBoostingClassifier
# ---------------------------------------------------------------------------
# Fit GradientBoostingClassifier(n_estimators=100, random_state=42)
# on (X_train, y_train). Return (model, test accuracy).

def sklearn_gradient_boosting(X_train, y_train, X_test, y_test):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 7: Hard Voting from Scratch
# ---------------------------------------------------------------------------
# Given a list of fitted classifiers and X_test:
#   - Collect each classifier's predictions.
#   - Final prediction = majority vote (use np.bincount).
# Return predicted labels.

def hard_voting(classifiers: list, X_test: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 8: Soft Voting from Scratch
# ---------------------------------------------------------------------------
# Given a list of fitted classifiers (each must have predict_proba) and X_test:
#   - Average the predicted probability matrices across classifiers.
#   - Final prediction = argmax of averaged probabilities.
# Return predicted labels.

def soft_voting(classifiers: list, X_test: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 9: sklearn VotingClassifier
# ---------------------------------------------------------------------------
# Create a VotingClassifier with:
#   - LogisticRegression(max_iter=1000)
#   - DecisionTreeClassifier(max_depth=5, random_state=42)
#   - GaussianNB()
# Use voting='soft'. Fit on (X_train, y_train). Return (model, test accuracy).

def sklearn_voting(X_train, y_train, X_test, y_test):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 10: Stacking from Scratch
# ---------------------------------------------------------------------------
# Level-0 (base models): LogisticRegression, KNeighborsClassifier(k=5)
# Level-1 (meta model): LogisticRegression
# Steps:
#   1. Fit each base model on X_train.
#   2. Generate out-of-bag meta-features: use cross_val_predict on X_train
#      (cv=5, method='predict_proba'), take class-1 column.
#   3. Stack meta-features horizontally → meta_X_train.
#   4. Fit meta-model on (meta_X_train, y_train).
#   5. For test: predict_proba from each base model on X_test → stack → meta-model.
# Return (meta_model, test accuracy).

def stacking_scratch(X_train, y_train, X_test, y_test):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 11: sklearn StackingClassifier
# ---------------------------------------------------------------------------
# Estimators: [('lr', LogisticRegression(max_iter=1000)),
#              ('dt', DecisionTreeClassifier(max_depth=5, random_state=42))]
# Final estimator: LogisticRegression(max_iter=1000)
# Fit on (X_train, y_train). Return (model, test accuracy).

def sklearn_stacking(X_train, y_train, X_test, y_test):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 12: Blending (holdout-based stacking)
# ---------------------------------------------------------------------------
# Steps:
#   1. Split X_train into X_blend_train (80%) and X_holdout (20%).
#   2. Fit each base model (LR, KNN) on X_blend_train.
#   3. Generate meta-features from X_holdout predictions (class-1 proba).
#   4. Fit meta-model (LR) on (holdout meta-features, y_holdout).
#   5. For test: predict from base models → meta-model.
# Return (meta_model, test accuracy).

def blending(X_train, y_train, X_test, y_test):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 13: Diversity in Ensembles
# ---------------------------------------------------------------------------
# Fit three diverse models on X_train: LR, DecisionTree(depth=5), GaussianNB.
# Compute pairwise agreement (fraction of identical predictions on X_test).
# Return a dict: {'LR_DT': agreement, 'LR_NB': agreement, 'DT_NB': agreement}.

def ensemble_diversity(X_train, y_train, X_test) -> dict:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 14: Bias-Variance Decomposition for Ensembles
# ---------------------------------------------------------------------------
# Empirically estimate bias² and variance for a single DT vs. a Random Forest:
#   - Use 30 bootstrap datasets from (X_train, y_train).
#   - For each bootstrap: fit the model, predict X_test.
#   - Bias² = mean over test points of (mean_prediction - y_true)²
#   - Variance = mean over test points of variance_of_predictions
# Return a dict: {'dt': {'bias2': ..., 'variance': ...},
#                  'rf': {'bias2': ..., 'variance': ...}}

def bias_variance_decomposition(X_train, y_train, X_test, y_test) -> dict:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 15: Ensemble Pruning Concept
# ---------------------------------------------------------------------------
# Given a list of 10 fitted models, prune to the best k by individual accuracy
# on X_test, then form a hard-voting ensemble with those k models.
# Return (selected_k_indices, ensemble_accuracy).

def ensemble_pruning(models: list, X_test, y_test, k: int = 5):
    pass  # TODO: implement


def main():
    print("=== Exercise 3.5: Ensemble Methods ===\n")

    bag_preds = bagging_scratch(X_train, y_train, X_test)
    print("TODO 1 — Bagging scratch accuracy:",
          round(accuracy_score(y_test, bag_preds), 4) if bag_preds is not None else None)

    result2 = sklearn_bagging(X_train, y_train, X_test, y_test)
    print("TODO 2 — sklearn Bagging accuracy:", result2[1] if result2 else None)

    w = np.ones(len(y_train)) / len(y_train)
    dt = DecisionTreeClassifier(max_depth=1).fit(X_train, y_train)
    yp = dt.predict(X_train)
    alpha, new_w = boosting_weight_update(y_train, yp, w) if boosting_weight_update(y_train, yp, w) else (None, None)
    print("TODO 3 — AdaBoost alpha:", round(alpha, 4) if alpha is not None else None)

    result4 = sklearn_adaboost(X_train, y_train, X_test, y_test)
    print("TODO 4 — AdaBoost accuracy:", result4[1] if result4 else None)

    gb_preds = gradient_boosting_scratch(X_train, y_train, X_test)
    print("TODO 5 — GB scratch accuracy:",
          round(accuracy_score(y_test, gb_preds), 4) if gb_preds is not None else None)

    result6 = sklearn_gradient_boosting(X_train, y_train, X_test, y_test)
    print("TODO 6 — sklearn GB accuracy:", result6[1] if result6 else None)

    clfs = [
        LogisticRegression(max_iter=1000).fit(X_train, y_train),
        DecisionTreeClassifier(max_depth=5).fit(X_train, y_train),
        GaussianNB().fit(X_train, y_train),
    ]
    hard_preds = hard_voting(clfs, X_test)
    print("TODO 7 — Hard voting accuracy:",
          round(accuracy_score(y_test, hard_preds), 4) if hard_preds is not None else None)

    soft_preds = soft_voting(clfs, X_test)
    print("TODO 8 — Soft voting accuracy:",
          round(accuracy_score(y_test, soft_preds), 4) if soft_preds is not None else None)

    result9 = sklearn_voting(X_train, y_train, X_test, y_test)
    print("TODO 9 — sklearn VotingClassifier accuracy:", result9[1] if result9 else None)

    result10 = stacking_scratch(X_train, y_train, X_test, y_test)
    print("TODO 10 — Stacking scratch accuracy:", result10[1] if result10 else None)

    result11 = sklearn_stacking(X_train, y_train, X_test, y_test)
    print("TODO 11 — sklearn Stacking accuracy:", result11[1] if result11 else None)

    result12 = blending(X_train, y_train, X_test, y_test)
    print("TODO 12 — Blending accuracy:", result12[1] if result12 else None)

    div = ensemble_diversity(X_train, y_train, X_test)
    print("TODO 13 — Diversity:", div)

    bv = bias_variance_decomposition(X_train, y_train, X_test, y_test)
    print("TODO 14 — Bias-Variance:", bv)

    from sklearn.ensemble import RandomForestClassifier
    models_list = [DecisionTreeClassifier(max_depth=i+1, random_state=i).fit(X_train, y_train)
                   for i in range(10)]
    result15 = ensemble_pruning(models_list, X_test, y_test, k=5)
    print("TODO 15 — Pruned ensemble:", result15)


if __name__ == "__main__":
    main()
