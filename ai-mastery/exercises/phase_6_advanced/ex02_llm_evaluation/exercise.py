# ============================================================
# Exercise 6.2 — LLM Evaluation Metrics
# ============================================================
# Topics:
#   • BLEU, ROUGE-N, ROUGE-L from scratch
#   • Perplexity calculation
#   • BERTScore concept
#   • Exact Match and F1 for QA
#   • Human evaluation rubric design
#   • LLM-as-judge pattern
#   • Benchmark suite design
#   • Hallucination and factuality metrics
#   • Coherence scoring
#   • Evaluation dataset construction
#   • A/B test significance for LLM outputs
# ============================================================
import math
from collections import Counter


# TODO 1: Calculate BLEU score from scratch
# Use n-gram precision (n=1..4) with brevity penalty.
# candidate: list of tokens, references: list of list of tokens
def bleu_score(candidate: list, references: list, max_n: int = 4) -> float:
    pass  # TODO: implement


# TODO 2: Calculate ROUGE-N score
# Recall-oriented: overlap of n-grams between candidate and reference.
# Return dict with 'precision', 'recall', 'f1'
def rouge_n(candidate: list, reference: list, n: int = 2) -> dict:
    pass  # TODO: implement


# TODO 3: Calculate ROUGE-L score
# Based on Longest Common Subsequence (LCS) between candidate and reference.
# Return dict with 'precision', 'recall', 'f1'
def rouge_l(candidate: list, reference: list) -> dict:
    pass  # TODO: implement


# TODO 4: Calculate perplexity
# Given a list of token log-probabilities, return perplexity.
# perplexity = exp(-1/N * sum(log_probs))
def perplexity(log_probs: list) -> float:
    pass  # TODO: implement


# TODO 5: Explain BERTScore concept
# Print a description of how BERTScore works (embedding cosine similarity).
def explain_bertscore():
    pass  # TODO: implement


# TODO 6: Exact Match for QA evaluation
# Return True if predicted answer exactly matches any reference answer
# after normalization (lowercase, strip punctuation, strip whitespace).
def exact_match(prediction: str, references: list) -> bool:
    pass  # TODO: implement


# TODO 7: F1 score for QA (token overlap)
# Token-level F1 between prediction and best-matching reference.
# Return F1 float in [0, 1].
def qa_f1_score(prediction: str, reference: str) -> float:
    pass  # TODO: implement


# TODO 8: Human evaluation rubric design
# Print a structured rubric for human evaluation of LLM outputs.
# Dimensions: Fluency, Coherence, Relevance, Faithfulness, Helpfulness.
def human_eval_rubric():
    pass  # TODO: implement


# TODO 9: LLM-as-judge pattern
# Print a description and example prompt for using an LLM to evaluate outputs.
def llm_as_judge():
    pass  # TODO: implement


# TODO 10: Benchmark suite design
# Print descriptions of: MMLU, HumanEval, TruthfulQA, GSM8K, HellaSwag.
def benchmark_suite():
    pass  # TODO: implement


# TODO 11: Hallucination detection metrics
# Print a structured description of metrics and heuristics for detecting
# hallucinations (faithfulness score, NLI entailment, entity overlap).
def hallucination_metrics():
    pass  # TODO: implement


# TODO 12: Factuality evaluation
# Print a description of factuality evaluation approaches.
def factuality_evaluation():
    pass  # TODO: implement


# TODO 13: Coherence scoring
# Print a description of discourse coherence metrics.
def coherence_scoring():
    pass  # TODO: implement


# TODO 14: Evaluation dataset construction
# Print a guide for building a high-quality LLM evaluation dataset.
def eval_dataset_construction():
    pass  # TODO: implement


# TODO 15: A/B test statistical significance for LLM outputs
# Given win counts for model A and B, compute p-value using
# binomial test approximation (normal approximation to binomial).
def ab_test_significance(wins_a: int, wins_b: int) -> dict:
    pass  # TODO: implement


def main():
    print("=== Exercise 6.2: LLM Evaluation Metrics ===\n")

    # BLEU
    candidate = ["the", "cat", "is", "on", "the", "mat"]
    reference = ["the", "cat", "sat", "on", "the", "mat"]
    print("BLEU score:", bleu_score(candidate, [reference]))

    # ROUGE-N
    print("ROUGE-2:", rouge_n(candidate, reference, n=2))

    # ROUGE-L
    print("ROUGE-L:", rouge_l(candidate, reference))

    # Perplexity
    log_probs = [-1.2, -0.8, -1.5, -0.9, -1.1]
    print("Perplexity:", perplexity(log_probs))

    # BERTScore
    explain_bertscore()

    # Exact Match
    print("Exact Match:", exact_match("Paris", ["paris", "London"]))

    # QA F1
    print("QA F1:", qa_f1_score("the cat sat on mat", "the cat sat on the mat"))

    # Rubric
    human_eval_rubric()

    # LLM-as-judge
    llm_as_judge()

    # Benchmarks
    benchmark_suite()

    # Hallucination
    hallucination_metrics()

    # Factuality
    factuality_evaluation()

    # Coherence
    coherence_scoring()

    # Dataset construction
    eval_dataset_construction()

    # A/B test
    print("A/B significance:", ab_test_significance(120, 100))


if __name__ == "__main__":
    main()
