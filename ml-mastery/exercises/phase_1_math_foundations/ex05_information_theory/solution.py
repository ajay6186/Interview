# ============================================================
# Solution 1.5 — Information Theory for ML
# ============================================================

import numpy as np
import math
from typing import List


def shannon_entropy(p: np.ndarray) -> float:
    p = np.asarray(p, dtype=float)
    p = p[p > 0]  # ignore zero entries
    return float(-np.sum(p * np.log2(p)))


def joint_entropy(joint: np.ndarray) -> float:
    joint = np.asarray(joint, dtype=float)
    flat = joint.flatten()
    flat = flat[flat > 0]
    return float(-np.sum(flat * np.log2(flat)))


def conditional_entropy(joint: np.ndarray) -> float:
    joint = np.asarray(joint, dtype=float)
    # H(X|Y) = H(X,Y) - H(Y)
    p_y = joint.sum(axis=0)  # marginal of Y (columns)
    h_joint = joint_entropy(joint)
    h_y = shannon_entropy(p_y)
    return h_joint - h_y


def mutual_information(joint: np.ndarray) -> float:
    joint = np.asarray(joint, dtype=float)
    p_x = joint.sum(axis=1)  # row marginals
    p_y = joint.sum(axis=0)  # column marginals
    h_x = shannon_entropy(p_x)
    h_y = shannon_entropy(p_y)
    h_xy = joint_entropy(joint)
    return h_x + h_y - h_xy


def kl_divergence(p: np.ndarray, q: np.ndarray) -> float:
    p = np.asarray(p, dtype=float)
    q = np.asarray(q, dtype=float)
    kl = 0.0
    for pi, qi in zip(p, q):
        if pi > 0:
            kl += pi * np.log2(pi / qi)
    return kl


def js_divergence(p: np.ndarray, q: np.ndarray) -> float:
    p = np.asarray(p, dtype=float)
    q = np.asarray(q, dtype=float)
    m = 0.5 * (p + q)
    return 0.5 * kl_divergence(p, m) + 0.5 * kl_divergence(q, m)


def cross_entropy(y_true: np.ndarray, y_pred: np.ndarray, eps: float = 1e-12) -> float:
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.clip(np.asarray(y_pred, dtype=float), eps, 1.0)
    return float(-np.sum(y_true * np.log(y_pred)))


def binary_cross_entropy(y: float, p: float, eps: float = 1e-12) -> float:
    p = np.clip(p, eps, 1 - eps)
    return -(y * np.log(p) + (1 - y) * np.log(1 - p))


def information_gain(parent_labels: np.ndarray,
                     left_labels: np.ndarray,
                     right_labels: np.ndarray) -> float:
    def node_entropy(labels):
        labels = np.asarray(labels)
        n = len(labels)
        if n == 0:
            return 0.0
        classes, counts = np.unique(labels, return_counts=True)
        probs = counts / n
        return shannon_entropy(probs)

    n_total = len(parent_labels)
    n_left = len(left_labels)
    n_right = len(right_labels)

    h_parent = node_entropy(parent_labels)
    weighted_child_h = (n_left / n_total) * node_entropy(left_labels) + \
                       (n_right / n_total) * node_entropy(right_labels)
    return h_parent - weighted_child_h


def gini_impurity(labels: np.ndarray) -> float:
    labels = np.asarray(labels)
    n = len(labels)
    if n == 0:
        return 0.0
    _, counts = np.unique(labels, return_counts=True)
    probs = counts / n
    return float(1 - np.sum(probs ** 2))


def entropy_comparison(n: int = 8) -> dict:
    uniform = np.ones(n) / n
    peaked = np.concatenate([[0.97], np.full(n - 1, 0.03 / (n - 1))])
    return {
        "uniform_entropy":  round(shannon_entropy(uniform), 6),
        "peaked_entropy":   round(shannon_entropy(peaked), 6),
        "uniform_is_higher": shannon_entropy(uniform) > shannon_entropy(peaked),
    }


def perplexity(p: np.ndarray) -> float:
    h = shannon_entropy(p)
    return 2 ** h


def bits_to_encode(n: int) -> int:
    return math.ceil(math.log2(n))


def channel_capacity(B: float, snr: float) -> float:
    return B * math.log2(1 + snr)


def main():
    print("=== Solution 1.5: Information Theory for ML ===\n")

    p_fair_coin = np.array([0.5, 0.5])
    p_biased = np.array([0.9, 0.1])

    print("Result 1 — H([0.5,0.5]) (expect 1.0):", shannon_entropy(p_fair_coin))
    print("           H([0.9,0.1]):", round(shannon_entropy(p_biased), 6))

    joint_indep = np.array([[0.25, 0.25], [0.25, 0.25]])
    print("Result 2 — Joint entropy (expect 2.0):", joint_entropy(joint_indep))
    print("Result 3 — Conditional entropy (expect 1.0):", conditional_entropy(joint_indep))
    print("Result 4 — Mutual info (expect 0.0 for independent):", round(mutual_information(joint_indep), 10))

    print("Result 5 — KL([0.9,0.1]||[0.5,0.5]):", round(kl_divergence(p_biased, p_fair_coin), 6))
    print("Result 6 — JSD([1,0]||[0,1]) (expect 1.0):", js_divergence(np.array([1.0, 0.0]), np.array([0.0, 1.0])))

    y_true = np.array([0, 1, 0])
    y_pred = np.array([0.1, 0.8, 0.1])
    print("Result 7 — Cross-entropy (expect ~= 0.2231):", round(cross_entropy(y_true, y_pred), 6))
    print("Result 8 — BCE(y=1, p=0.9) (expect ~= 0.1054):", round(binary_cross_entropy(1, 0.9), 6))

    print("Result 9 — Info gain (expect 1.0):", information_gain(np.array([0,0,1,1]), np.array([0,0]), np.array([1,1])))
    print("Result 10 — Gini [0,0,1,1] (expect 0.5):", gini_impurity(np.array([0,0,1,1])))
    print("            Gini [1,1,1,1] (expect 0.0):", gini_impurity(np.array([1,1,1,1])))

    print("Result 11 — Entropy comparison:", entropy_comparison())
    print("Result 12 — Perplexity [0.5,0.5] (expect 2.0):", perplexity(p_fair_coin))
    print("Result 13 — Bits for 8 (expect 3):", bits_to_encode(8))
    print("            Bits for 10 (expect 4):", bits_to_encode(10))
    print("Result 14 — Channel capacity (1MHz, SNR=7):", channel_capacity(1e6, 7), "bits/s")


if __name__ == "__main__":
    main()
