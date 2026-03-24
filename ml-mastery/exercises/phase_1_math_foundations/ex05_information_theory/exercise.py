# ============================================================
# Exercise 1.5 — Information Theory for ML
# ============================================================
# Topics:
#   • Shannon entropy, joint entropy, conditional entropy
#   • Mutual information
#   • KL divergence, JS divergence
#   • Cross-entropy and binary cross-entropy loss
#   • Information gain (decision tree)
#   • Gini impurity
#   • Perplexity, encoding bits, channel capacity
# ============================================================

import numpy as np
from typing import List

# ---------------------------------------------------------------------------
# TODO 1: Shannon Entropy (bits)
# ---------------------------------------------------------------------------
# Compute H(p) = -sum(p_i * log2(p_i)) for a probability distribution p.
# Ignore zero entries (0 * log(0) = 0 by convention).
# Expected: shannon_entropy([0.5, 0.5]) == 1.0 (1 bit)
#           shannon_entropy([1.0]) == 0.0

def shannon_entropy(p: np.ndarray) -> float:
    pass  # TODO: implement in bits (log base 2)


# ---------------------------------------------------------------------------
# TODO 2: Joint Entropy
# ---------------------------------------------------------------------------
# Compute joint entropy H(X,Y) from a joint probability matrix P[i,j].
# H(X,Y) = -sum_{i,j} P[i,j] * log2(P[i,j])
# Expected: joint_entropy([[0.25,0.25],[0.25,0.25]]) == 2.0

def joint_entropy(joint: np.ndarray) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 3: Conditional Entropy
# ---------------------------------------------------------------------------
# Compute H(X|Y) = H(X,Y) - H(Y)
# Expected: conditional_entropy(joint_matrix) returns H(X|Y)

def conditional_entropy(joint: np.ndarray) -> float:
    pass  # TODO: implement using joint_entropy and marginal entropy of Y


# ---------------------------------------------------------------------------
# TODO 4: Mutual Information
# ---------------------------------------------------------------------------
# Compute I(X;Y) = H(X) + H(Y) - H(X,Y)
# Expected: mutual_information(joint) = 0 when X and Y are independent

def mutual_information(joint: np.ndarray) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 5: KL Divergence
# ---------------------------------------------------------------------------
# Compute KL(P || Q) = sum(P_i * log2(P_i / Q_i))
# Note: returns infinity if Q_i = 0 where P_i > 0.
# Expected: kl_divergence([0.9, 0.1], [0.5, 0.5]) ≈ 0.531

def kl_divergence(p: np.ndarray, q: np.ndarray) -> float:
    pass  # TODO: implement (use log base 2, skip where p_i == 0)


# ---------------------------------------------------------------------------
# TODO 6: JS Divergence
# ---------------------------------------------------------------------------
# Jensen-Shannon divergence (symmetric version of KL):
#   M = 0.5 * (P + Q)
#   JSD(P || Q) = 0.5 * KL(P||M) + 0.5 * KL(Q||M)
# JSD is always in [0, 1] when using log base 2.
# Expected: js_divergence([1,0], [0,1]) == 1.0

def js_divergence(p: np.ndarray, q: np.ndarray) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 7: Cross-Entropy Loss
# ---------------------------------------------------------------------------
# Compute cross-entropy H(y_true, y_pred) = -sum(y_true * log(y_pred))
# Used in multi-class classification. y_true is one-hot, y_pred are probs.
# Expected: cross_entropy([0,1,0], [0.1,0.8,0.1]) ≈ 0.2231

def cross_entropy(y_true: np.ndarray, y_pred: np.ndarray, eps: float = 1e-12) -> float:
    pass  # TODO: implement (clip y_pred to avoid log(0))


# ---------------------------------------------------------------------------
# TODO 8: Binary Cross-Entropy
# ---------------------------------------------------------------------------
# BCE(y, p) = -(y * log(p) + (1-y) * log(1-p))
# y is the true label (0 or 1), p is predicted probability.
# Expected: binary_cross_entropy(1, 0.9) ≈ 0.1054

def binary_cross_entropy(y: float, p: float, eps: float = 1e-12) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 9: Information Gain for Decision Tree Split
# ---------------------------------------------------------------------------
# Information gain = H(parent) - weighted_avg_H(children)
# parent_labels: labels before split (1-D array)
# left_labels, right_labels: labels in each child node
# Expected: information_gain([0,0,1,1], [0,0], [1,1]) == 1.0

def information_gain(parent_labels: np.ndarray,
                     left_labels: np.ndarray,
                     right_labels: np.ndarray) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 10: Gini Impurity
# ---------------------------------------------------------------------------
# Gini(p) = 1 - sum(p_i^2) where p_i = fraction of class i in node.
# Expected: gini_impurity([1,1,0,0]) == 0.5  (50/50 split)
#           gini_impurity([1,1,1,1]) == 0.0  (pure node)

def gini_impurity(labels: np.ndarray) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 11: Entropy of Uniform vs Peaked Distribution
# ---------------------------------------------------------------------------
# Return a dict comparing entropy of:
#   - Uniform distribution over n=8 symbols
#   - Peaked distribution: one symbol has prob 0.97, rest share 0.03
# Expected: uniform has higher entropy (3.0 bits for n=8)

def entropy_comparison(n: int = 8) -> dict:
    pass  # TODO: implement using shannon_entropy


# ---------------------------------------------------------------------------
# TODO 12: Perplexity from Entropy
# ---------------------------------------------------------------------------
# Perplexity = 2^H where H is entropy in bits.
# Used in language models to measure how well a model predicts text.
# Expected: perplexity([0.5, 0.5]) == 2.0 (H=1 bit → 2^1=2)

def perplexity(p: np.ndarray) -> float:
    pass  # TODO: implement using shannon_entropy


# ---------------------------------------------------------------------------
# TODO 13: Bits Needed to Encode N Symbols
# ---------------------------------------------------------------------------
# Minimum bits needed = ceil(log2(n)) for n equally likely symbols.
# Expected: bits_to_encode(8) == 3, bits_to_encode(10) == 4

def bits_to_encode(n: int) -> int:
    pass  # TODO: implement (use math.ceil and math.log2)


# ---------------------------------------------------------------------------
# TODO 14: Channel Capacity Concept
# ---------------------------------------------------------------------------
# Shannon channel capacity: C = B * log2(1 + S/N) bits/sec
# B = bandwidth (Hz), S/N = signal-to-noise ratio (linear, not dB)
# Expected: channel_capacity(B=1e6, snr=7) ≈ 3e6 bits/sec (3 Mbps)

def channel_capacity(B: float, snr: float) -> float:
    pass  # TODO: implement


def main():
    print("=== Exercise 1.5: Information Theory for ML ===\n")

    p_uniform = np.array([0.25, 0.25, 0.25, 0.25])
    p_fair_coin = np.array([0.5, 0.5])
    p_biased = np.array([0.9, 0.1])

    print("TODO 1 — H([0.5,0.5]):", shannon_entropy(p_fair_coin))
    print("         H([0.9,0.1]):", shannon_entropy(p_biased))

    joint = np.array([[0.25, 0.25], [0.25, 0.25]])
    print("TODO 2 — Joint entropy:", joint_entropy(joint))
    print("TODO 3 — Conditional entropy:", conditional_entropy(joint))
    print("TODO 4 — Mutual information:", mutual_information(joint))

    print("TODO 5 — KL([0.9,0.1]||[0.5,0.5]):", kl_divergence(p_biased, p_fair_coin))
    print("TODO 6 — JSD([1,0]||[0,1]):", js_divergence(np.array([1,0]), np.array([0,1])))

    y_true = np.array([0, 1, 0])
    y_pred = np.array([0.1, 0.8, 0.1])
    print("TODO 7 — Cross-entropy:", cross_entropy(y_true, y_pred))
    print("TODO 8 — Binary CE(y=1, p=0.9):", binary_cross_entropy(1, 0.9))
    print("TODO 9 — Info gain:", information_gain(np.array([0,0,1,1]), np.array([0,0]), np.array([1,1])))
    print("TODO 10 — Gini [0,0,1,1]:", gini_impurity(np.array([0,0,1,1])))
    print("TODO 11 — Entropy comparison:", entropy_comparison())
    print("TODO 12 — Perplexity [0.5,0.5]:", perplexity(p_fair_coin))
    print("TODO 13 — Bits for 8 symbols:", bits_to_encode(8))
    print("TODO 14 — Channel capacity:", channel_capacity(1e6, 7))


if __name__ == "__main__":
    main()
