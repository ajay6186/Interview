# ============================================================
# Exercise 6.5 — AI/ML Interview Preparation
# ============================================================
# Topics:
#   • Core ML concepts: bias-variance, gradient descent variants
#   • Transformer architecture and attention mechanism
#   • RLHF (Reinforcement Learning from Human Feedback)
#   • Coding: backpropagation, k-means, logistic regression from scratch
#   • Coding: attention from scratch (numpy)
#   • System design: search ranking system
#   • Decision trees (ID3 concept)
#   • Behavioral: describing a challenging ML project
#   • RAG vs fine-tuning trade-offs
#   • LLM scaling laws (Chinchilla)
#   • Production ML gotchas
#   • 30-day study plan
# ============================================================
import math


# TODO 1: Explain bias-variance tradeoff
# Print a structured explanation with intuition, formulas, and examples.
def explain_bias_variance():
    pass  # TODO: implement


# TODO 2: Explain gradient descent variants
# Print a comparison of SGD, Momentum, RMSprop, Adam.
def explain_gradient_descent_variants():
    pass  # TODO: implement


# TODO 3: Explain transformer architecture
# Print a structured explanation of the transformer (attention mechanism,
# multi-head, positional encoding, encoder/decoder).
def explain_transformer_architecture():
    pass  # TODO: implement


# TODO 4: Implement scaled dot-product attention from scratch (no numpy)
# Q, K, V are lists of lists (matrices).
# attention(Q, K, V) = softmax(Q·K^T / sqrt(d_k)) · V
# Return output matrix as list of lists.
def scaled_dot_product_attention(Q: list, K: list, V: list) -> list:
    pass  # TODO: implement


# TODO 5: Explain RLHF
# Print a structured explanation of Reinforcement Learning from Human Feedback.
def explain_rlhf():
    pass  # TODO: implement


# TODO 6: Backpropagation for a 2-layer network (numpy-free)
# Implement forward + backward pass for:
#   layer1: Linear(2→4) + ReLU
#   layer2: Linear(4→1) + Sigmoid
# Loss: binary cross-entropy
# Return dict with 'loss', 'dW1', 'db1', 'dW2', 'db2'
def backprop_two_layer(X: list, y: list, W1: list, b1: list,
                       W2: list, b2: list) -> dict:
    pass  # TODO: implement


# TODO 7: System design — search ranking system
# Print a structured design for a search ranking system.
def design_search_ranking():
    pass  # TODO: implement


# TODO 8: K-means clustering from scratch
# Implement Lloyd's algorithm.
# X: list of [x, y] points, k: number of clusters, max_iter: int
# Return dict: {'centroids': list, 'labels': list, 'inertia': float}
def kmeans(X: list, k: int, max_iter: int = 100) -> dict:
    pass  # TODO: implement


# TODO 9: Logistic regression from scratch (gradient descent)
# X: list of feature vectors, y: list of binary labels (0/1)
# lr: learning rate, epochs: number of passes
# Return dict: {'weights': list, 'bias': float, 'losses': list}
def logistic_regression(X: list, y: list,
                        lr: float = 0.1, epochs: int = 100) -> dict:
    pass  # TODO: implement


# TODO 10: Decision tree (ID3 concept)
# Print a description of the ID3 algorithm with entropy and information gain.
# Then implement entropy and information_gain functions.
def decision_tree_id3_concept():
    pass  # TODO: implement


def entropy(labels: list) -> float:
    pass  # TODO: implement


def information_gain(parent_labels: list, child_groups: list) -> float:
    pass  # TODO: implement


# TODO 11: Behavioral — describe a challenging ML project
# Print a structured STAR-format answer for a challenging ML project.
def behavioral_challenging_project():
    pass  # TODO: implement


# TODO 12: RAG vs fine-tuning trade-offs
# Print a structured comparison.
def rag_vs_finetuning():
    pass  # TODO: implement


# TODO 13: LLM scaling laws (Chinchilla)
# Print a description of neural scaling laws, Chinchilla optimal compute.
def llm_scaling_laws():
    pass  # TODO: implement


# TODO 14: Production ML system gotchas (top 10)
# Print 10 common lessons / pitfalls in production ML.
def production_ml_gotchas():
    pass  # TODO: implement


# TODO 15: 30-day AI/ML interview study plan
# Print a structured 30-day study plan.
def study_plan_30_days():
    pass  # TODO: implement


def main():
    print("=== Exercise 6.5: AI/ML Interview Preparation ===\n")

    explain_bias_variance()
    explain_gradient_descent_variants()
    explain_transformer_architecture()

    # Attention
    Q = [[1.0, 0.0], [0.0, 1.0]]
    K = [[1.0, 0.0], [0.0, 1.0]]
    V = [[1.0, 2.0], [3.0, 4.0]]
    print("Attention output:", scaled_dot_product_attention(Q, K, V))

    explain_rlhf()

    # Backprop
    import random
    random.seed(42)
    X = [[0.5, 0.2]]
    y = [1]
    W1 = [[random.gauss(0, 0.1) for _ in range(2)] for _ in range(4)]
    b1 = [0.0] * 4
    W2 = [[random.gauss(0, 0.1) for _ in range(4)]]
    b2 = [0.0]
    result = backprop_two_layer(X, y, W1, b1, W2, b2)
    if result:
        print(f"Backprop loss: {result.get('loss', 'N/A'):.4f}")

    design_search_ranking()

    # K-means
    points = [[1, 1], [1.5, 1.5], [5, 5], [5.5, 5.5], [3, 1], [3.5, 1.5]]
    km = kmeans(points, k=2, max_iter=50)
    if km:
        print(f"K-means labels: {km.get('labels')}")
        print(f"K-means inertia: {km.get('inertia', 0):.4f}")

    # Logistic regression
    Xlr = [[1.0, 2.0], [2.0, 3.0], [0.5, 1.0], [3.0, 4.0],
           [-1.0, -2.0], [-2.0, -3.0], [-0.5, -1.0], [-3.0, -4.0]]
    ylr = [1, 1, 1, 1, 0, 0, 0, 0]
    lr_result = logistic_regression(Xlr, ylr, lr=0.1, epochs=200)
    if lr_result:
        print(f"LR final loss: {lr_result['losses'][-1]:.4f}")

    decision_tree_id3_concept()
    print(f"Entropy([1,1,0,0]): {entropy([1,1,0,0]):.4f}")
    print(f"Information gain: {information_gain([1,1,0,0], [[1,1],[0,0]]):.4f}")

    behavioral_challenging_project()
    rag_vs_finetuning()
    llm_scaling_laws()
    production_ml_gotchas()
    study_plan_30_days()


if __name__ == "__main__":
    main()
