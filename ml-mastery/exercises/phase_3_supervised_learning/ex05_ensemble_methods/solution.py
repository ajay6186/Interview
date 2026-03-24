# ============================================================
# Solution 3.5 — Ensemble Methods
# ============================================================

import numpy as np
from sklearn.datasets import make_classification
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.ensemble import (BaggingClassifier, AdaBoostClassifier,
                               GradientBoostingClassifier,
                               VotingClassifier, StackingClassifier,
                               RandomForestClassifier)
from sklearn.model_selection import train_test_split, cross_val_predict
from sklearn.metrics import accuracy_score

np.random.seed(42)
X, y = make_classification(n_samples=400, n_features=10,
                            n_informative=5, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42)


# ---------------------------------------------------------------------------
# Solution 1: Bagging from Scratch
# ---------------------------------------------------------------------------

def bagging_scratch(X_train: np.ndarray, y_train: np.ndarray,
                    X_test: np.ndarray, n_estimators: int = 20) -> np.ndarray:
    rng = np.random.default_rng(42)
    all_preds = []
    n = len(X_train)
    for _ in range(n_estimators):
        idx = rng.integers(0, n, size=n)
        X_b, y_b = X_train[idx], y_train[idx]
        tree = DecisionTreeClassifier(max_depth=5, random_state=0)
        tree.fit(X_b, y_b)
        all_preds.append(tree.predict(X_test))
    preds = np.array(all_preds)  # (n_estimators, n_test)
    majority = np.apply_along_axis(
        lambda x: np.bincount(x.astype(int)).argmax(), axis=0, arr=preds
    )
    return majority


# ---------------------------------------------------------------------------
# Solution 2: sklearn BaggingClassifier
# ---------------------------------------------------------------------------

def sklearn_bagging(X_train, y_train, X_test, y_test):
    model = BaggingClassifier(n_estimators=20, random_state=42)
    model.fit(X_train, y_train)
    return model, model.score(X_test, y_test)


# ---------------------------------------------------------------------------
# Solution 3: Boosting Weight Update
# ---------------------------------------------------------------------------

def boosting_weight_update(y_true: np.ndarray, y_pred: np.ndarray,
                            weights: np.ndarray):
    error = np.sum(weights[y_pred != y_true])
    alpha = 0.5 * np.log((1 - error) / (error + 1e-10))
    y_signed = 2 * y_true - 1
    p_signed = 2 * y_pred - 1
    new_w = weights * np.exp(-alpha * y_signed * p_signed)
    new_w /= new_w.sum()
    return float(alpha), new_w


# ---------------------------------------------------------------------------
# Solution 4: AdaBoost
# ---------------------------------------------------------------------------

def sklearn_adaboost(X_train, y_train, X_test, y_test):
    model = AdaBoostClassifier(n_estimators=50, random_state=42)
    model.fit(X_train, y_train)
    return model, model.score(X_test, y_test)


# ---------------------------------------------------------------------------
# Solution 5: Gradient Boosting from Scratch
# ---------------------------------------------------------------------------

def gradient_boosting_scratch(X_train: np.ndarray, y_train: np.ndarray,
                               X_test: np.ndarray, n_rounds: int = 50,
                               lr: float = 0.1) -> np.ndarray:
    train_preds = np.full(len(X_train), 0.5)
    test_preds = np.full(len(X_test), 0.5)
    trees = []

    for _ in range(n_rounds):
        residuals = y_train - train_preds
        tree = DecisionTreeRegressor(max_depth=2)
        tree.fit(X_train, residuals)
        train_preds += lr * tree.predict(X_train)
        test_preds += lr * tree.predict(X_test)
        trees.append(tree)

    return (test_preds >= 0.5).astype(int)


# ---------------------------------------------------------------------------
# Solution 6: sklearn GradientBoostingClassifier
# ---------------------------------------------------------------------------

def sklearn_gradient_boosting(X_train, y_train, X_test, y_test):
    model = GradientBoostingClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    return model, model.score(X_test, y_test)


# ---------------------------------------------------------------------------
# Solution 7: Hard Voting
# ---------------------------------------------------------------------------

def hard_voting(classifiers: list, X_test: np.ndarray) -> np.ndarray:
    preds = np.array([clf.predict(X_test) for clf in classifiers])
    return np.apply_along_axis(
        lambda x: np.bincount(x.astype(int)).argmax(), axis=0, arr=preds
    )


# ---------------------------------------------------------------------------
# Solution 8: Soft Voting
# ---------------------------------------------------------------------------

def soft_voting(classifiers: list, X_test: np.ndarray) -> np.ndarray:
    probas = np.array([clf.predict_proba(X_test) for clf in classifiers])
    avg_proba = probas.mean(axis=0)
    return np.argmax(avg_proba, axis=1)


# ---------------------------------------------------------------------------
# Solution 9: sklearn VotingClassifier
# ---------------------------------------------------------------------------

def sklearn_voting(X_train, y_train, X_test, y_test):
    vc = VotingClassifier(estimators=[
        ('lr', LogisticRegression(max_iter=1000)),
        ('dt', DecisionTreeClassifier(max_depth=5, random_state=42)),
        ('nb', GaussianNB()),
    ], voting='soft')
    vc.fit(X_train, y_train)
    return vc, vc.score(X_test, y_test)


# ---------------------------------------------------------------------------
# Solution 10: Stacking from Scratch
# ---------------------------------------------------------------------------

def stacking_scratch(X_train, y_train, X_test, y_test):
    base_models = [
        LogisticRegression(max_iter=1000),
        KNeighborsClassifier(n_neighbors=5),
    ]

    # OOB meta-features for training
    meta_train_cols = []
    for model in base_models:
        oof = cross_val_predict(model, X_train, y_train,
                                cv=5, method='predict_proba')[:, 1]
        meta_train_cols.append(oof)
    meta_X_train = np.column_stack(meta_train_cols)

    # Fit base models on full training data
    for model in base_models:
        model.fit(X_train, y_train)

    # Meta-features for test
    meta_test_cols = [m.predict_proba(X_test)[:, 1] for m in base_models]
    meta_X_test = np.column_stack(meta_test_cols)

    meta_model = LogisticRegression(max_iter=1000)
    meta_model.fit(meta_X_train, y_train)
    acc = meta_model.score(meta_X_test, y_test)
    return meta_model, acc


# ---------------------------------------------------------------------------
# Solution 11: sklearn StackingClassifier
# ---------------------------------------------------------------------------

def sklearn_stacking(X_train, y_train, X_test, y_test):
    model = StackingClassifier(
        estimators=[
            ('lr', LogisticRegression(max_iter=1000)),
            ('dt', DecisionTreeClassifier(max_depth=5, random_state=42)),
        ],
        final_estimator=LogisticRegression(max_iter=1000),
    )
    model.fit(X_train, y_train)
    return model, model.score(X_test, y_test)


# ---------------------------------------------------------------------------
# Solution 12: Blending
# ---------------------------------------------------------------------------

def blending(X_train, y_train, X_test, y_test):
    n = len(X_train)
    split = int(0.8 * n)
    X_blend, X_hold = X_train[:split], X_train[split:]
    y_blend, y_hold = y_train[:split], y_train[split:]

    base_models = [
        LogisticRegression(max_iter=1000),
        KNeighborsClassifier(n_neighbors=5),
    ]
    for m in base_models:
        m.fit(X_blend, y_blend)

    # Meta-features from holdout set
    hold_meta = np.column_stack([m.predict_proba(X_hold)[:, 1] for m in base_models])
    test_meta = np.column_stack([m.predict_proba(X_test)[:, 1] for m in base_models])

    meta_model = LogisticRegression(max_iter=1000)
    meta_model.fit(hold_meta, y_hold)
    acc = meta_model.score(test_meta, y_test)
    return meta_model, acc


# ---------------------------------------------------------------------------
# Solution 13: Diversity
# ---------------------------------------------------------------------------

def ensemble_diversity(X_train, y_train, X_test) -> dict:
    lr = LogisticRegression(max_iter=1000).fit(X_train, y_train)
    dt = DecisionTreeClassifier(max_depth=5, random_state=42).fit(X_train, y_train)
    nb = GaussianNB().fit(X_train, y_train)

    p_lr = lr.predict(X_test)
    p_dt = dt.predict(X_test)
    p_nb = nb.predict(X_test)

    def agreement(a, b):
        return round(float(np.mean(a == b)), 4)

    return {
        'LR_DT': agreement(p_lr, p_dt),
        'LR_NB': agreement(p_lr, p_nb),
        'DT_NB': agreement(p_dt, p_nb),
    }


# ---------------------------------------------------------------------------
# Solution 14: Bias-Variance Decomposition
# ---------------------------------------------------------------------------

def bias_variance_decomposition(X_train, y_train, X_test, y_test) -> dict:
    rng = np.random.default_rng(42)
    n = len(X_train)
    n_bootstrap = 30
    results = {}

    for name, ModelClass, kwargs in [
        ('dt', DecisionTreeClassifier, {'max_depth': 5, 'random_state': 42}),
        ('rf', RandomForestClassifier, {'n_estimators': 20, 'random_state': 42}),
    ]:
        all_preds = []
        for _ in range(n_bootstrap):
            idx = rng.integers(0, n, size=n)
            model = ModelClass(**kwargs)
            model.fit(X_train[idx], y_train[idx])
            all_preds.append(model.predict(X_test))

        all_preds = np.array(all_preds, dtype=float)  # (30, n_test)
        mean_pred = all_preds.mean(axis=0)
        bias2 = float(np.mean((mean_pred - y_test) ** 2))
        variance = float(np.mean(np.var(all_preds, axis=0)))
        results[name] = {'bias2': round(bias2, 6), 'variance': round(variance, 6)}

    return results


# ---------------------------------------------------------------------------
# Solution 15: Ensemble Pruning
# ---------------------------------------------------------------------------

def ensemble_pruning(models: list, X_test, y_test, k: int = 5):
    accs = [(i, accuracy_score(y_test, m.predict(X_test)))
            for i, m in enumerate(models)]
    accs_sorted = sorted(accs, key=lambda t: t[1], reverse=True)
    top_k_idx = [i for i, _ in accs_sorted[:k]]
    top_k_models = [models[i] for i in top_k_idx]

    ensemble_preds = hard_voting(top_k_models, X_test)
    ens_acc = float(accuracy_score(y_test, ensemble_preds))
    return top_k_idx, round(ens_acc, 4)


def main():
    print("=== Solution 3.5: Ensemble Methods ===\n")

    bag_preds = bagging_scratch(X_train, y_train, X_test)
    print("Result 1 — Bagging scratch accuracy:",
          round(accuracy_score(y_test, bag_preds), 4))

    _, acc2 = sklearn_bagging(X_train, y_train, X_test, y_test)
    print("Result 2 — sklearn Bagging accuracy:", round(acc2, 4))

    w = np.ones(len(y_train)) / len(y_train)
    dt = DecisionTreeClassifier(max_depth=1).fit(X_train, y_train)
    yp = dt.predict(X_train)
    alpha, new_w = boosting_weight_update(y_train, yp, w)
    print("Result 3 — AdaBoost alpha:", round(alpha, 4),
          "| weight sum:", round(new_w.sum(), 4))

    _, acc4 = sklearn_adaboost(X_train, y_train, X_test, y_test)
    print("Result 4 — AdaBoost accuracy:", round(acc4, 4))

    gb_preds = gradient_boosting_scratch(X_train, y_train, X_test)
    print("Result 5 — GB scratch accuracy:",
          round(accuracy_score(y_test, gb_preds), 4))

    _, acc6 = sklearn_gradient_boosting(X_train, y_train, X_test, y_test)
    print("Result 6 — sklearn GB accuracy:", round(acc6, 4))

    clfs = [
        LogisticRegression(max_iter=1000).fit(X_train, y_train),
        DecisionTreeClassifier(max_depth=5).fit(X_train, y_train),
        GaussianNB().fit(X_train, y_train),
    ]
    hard_preds = hard_voting(clfs, X_test)
    print("Result 7 — Hard voting accuracy:",
          round(accuracy_score(y_test, hard_preds), 4))

    soft_preds = soft_voting(clfs, X_test)
    print("Result 8 — Soft voting accuracy:",
          round(accuracy_score(y_test, soft_preds), 4))

    _, acc9 = sklearn_voting(X_train, y_train, X_test, y_test)
    print("Result 9 — sklearn VotingClassifier accuracy:", round(acc9, 4))

    _, acc10 = stacking_scratch(X_train, y_train, X_test, y_test)
    print("Result 10 — Stacking scratch accuracy:", round(acc10, 4))

    _, acc11 = sklearn_stacking(X_train, y_train, X_test, y_test)
    print("Result 11 — sklearn Stacking accuracy:", round(acc11, 4))

    _, acc12 = blending(X_train, y_train, X_test, y_test)
    print("Result 12 — Blending accuracy:", round(acc12, 4))

    div = ensemble_diversity(X_train, y_train, X_test)
    print("Result 13 — Diversity:", div)

    bv = bias_variance_decomposition(X_train, y_train, X_test, y_test)
    print("Result 14 — Bias-Variance:")
    for name, v in bv.items():
        print(f"   {name}: {v}")

    models_list = [DecisionTreeClassifier(max_depth=i+1, random_state=i).fit(X_train, y_train)
                   for i in range(10)]
    top_idx, ens_acc = ensemble_pruning(models_list, X_test, y_test, k=5)
    print("Result 15 — Pruned ensemble top indices:", top_idx,
          "| accuracy:", ens_acc)


if __name__ == "__main__":
    main()
