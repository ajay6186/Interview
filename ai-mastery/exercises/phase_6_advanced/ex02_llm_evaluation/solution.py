# ============================================================
# Solution 6.2 — LLM Evaluation Metrics
# ============================================================
import math
import string
from collections import Counter


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def _ngrams(tokens: list, n: int) -> list:
    """Return all n-grams from a token list."""
    return [tuple(tokens[i:i + n]) for i in range(len(tokens) - n + 1)]


def _normalize(text: str) -> list:
    """Lowercase, strip punctuation, split into tokens."""
    text = text.lower()
    text = text.translate(str.maketrans("", "", string.punctuation))
    return text.split()


# ---------------------------------------------------------------------------
# TODO 1 — BLEU Score (from scratch)
# ---------------------------------------------------------------------------

def bleu_score(candidate: list, references: list, max_n: int = 4) -> float:
    """
    Compute corpus BLEU score.
    candidate  : list of tokens
    references : list of reference token lists
    Returns BLEU ∈ [0, 1].
    """
    # Brevity penalty
    c_len = len(candidate)
    r_len = min((abs(len(r) - c_len), len(r)) for r in references)[1]
    bp = 1.0 if c_len >= r_len else math.exp(1 - r_len / c_len)

    log_avg = 0.0
    for n in range(1, max_n + 1):
        cand_ngrams = Counter(_ngrams(candidate, n))
        if not cand_ngrams:
            return 0.0

        # Clipped count: min(count_in_candidate, max_count_in_any_reference)
        clipped = 0
        for gram, count in cand_ngrams.items():
            max_ref_count = max(Counter(_ngrams(r, n)).get(gram, 0) for r in references)
            clipped += min(count, max_ref_count)

        total = sum(cand_ngrams.values())
        precision = clipped / total if total > 0 else 0.0

        if precision == 0:
            return 0.0
        log_avg += math.log(precision)

    return bp * math.exp(log_avg / max_n)


# ---------------------------------------------------------------------------
# TODO 2 — ROUGE-N
# ---------------------------------------------------------------------------

def rouge_n(candidate: list, reference: list, n: int = 2) -> dict:
    """
    Compute ROUGE-N between candidate and reference token lists.
    Returns {'precision': float, 'recall': float, 'f1': float}.
    """
    cand_ngrams = Counter(_ngrams(candidate, n))
    ref_ngrams = Counter(_ngrams(reference, n))

    overlap = sum((cand_ngrams & ref_ngrams).values())
    precision = overlap / sum(cand_ngrams.values()) if cand_ngrams else 0.0
    recall = overlap / sum(ref_ngrams.values()) if ref_ngrams else 0.0
    f1 = (2 * precision * recall / (precision + recall)
          if (precision + recall) > 0 else 0.0)
    return {"precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1": round(f1, 4)}


# ---------------------------------------------------------------------------
# TODO 3 — ROUGE-L (LCS-based)
# ---------------------------------------------------------------------------

def rouge_l(candidate: list, reference: list) -> dict:
    """
    Compute ROUGE-L using Longest Common Subsequence.
    Returns {'precision': float, 'recall': float, 'f1': float}.
    """
    m, n = len(reference), len(candidate)
    # DP table for LCS length
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if reference[i - 1] == candidate[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])

    lcs_len = dp[m][n]
    precision = lcs_len / n if n > 0 else 0.0
    recall = lcs_len / m if m > 0 else 0.0
    f1 = (2 * precision * recall / (precision + recall)
          if (precision + recall) > 0 else 0.0)
    return {"precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1": round(f1, 4)}


# ---------------------------------------------------------------------------
# TODO 4 — Perplexity
# ---------------------------------------------------------------------------

def perplexity(log_probs: list) -> float:
    """
    Compute perplexity from a list of token log-probabilities (natural log).
    perplexity = exp(-1/N * sum(log_probs))
    Lower is better; a perfect model has PP = 1.
    """
    n = len(log_probs)
    avg_neg_log_prob = -sum(log_probs) / n
    return round(math.exp(avg_neg_log_prob), 4)


# ---------------------------------------------------------------------------
# TODO 5 — BERTScore explanation
# ---------------------------------------------------------------------------

def explain_bertscore():
    print("""
[CONCEPT] BERTScore
====================
BERTScore measures the similarity between a generated text and a reference
text by comparing their contextual token embeddings from a pretrained BERT
(or RoBERTa) model.

HOW IT WORKS:
  1. Tokenize candidate and reference; pass both through BERT.
  2. Each token → contextualized embedding (dim ≈ 768).
  3. For each candidate token, find the reference token with the highest
     cosine similarity (greedy matching).
  4. Precision: average of max similarities for each candidate token.
  5. Recall: average of max similarities for each reference token.
  6. F1: harmonic mean of BERTScore Precision and Recall.

WHY IT'S BETTER THAN BLEU:
  - Captures semantic similarity, not just exact token overlap.
  - "automobile" ≈ "car" in embedding space → BERTScore rewards this.
  - Correlates better with human judgments on translation + summarization.

FORMULA:
  P_BERT = (1/|c|) Σ max_{r∈R} cos(c_i, r_j)
  R_BERT = (1/|r|) Σ max_{c∈C} cos(r_j, c_i)
  F_BERT = 2 * P_BERT * R_BERT / (P_BERT + R_BERT)

PACKAGES: pip install bert-score
  from bert_score import score
  P, R, F1 = score(["the cat sat"], ["the cat is sitting"], lang="en")
""")


# ---------------------------------------------------------------------------
# TODO 6 — Exact Match for QA
# ---------------------------------------------------------------------------

def exact_match(prediction: str, references: list) -> bool:
    """
    Return True if normalized prediction matches any normalized reference.
    Normalization: lowercase + strip punctuation + strip whitespace.
    Standard metric for QA datasets like SQuAD.
    """
    pred_norm = " ".join(_normalize(prediction))
    for ref in references:
        if pred_norm == " ".join(_normalize(ref)):
            return True
    return False


# ---------------------------------------------------------------------------
# TODO 7 — QA F1 Score (token overlap)
# ---------------------------------------------------------------------------

def qa_f1_score(prediction: str, reference: str) -> float:
    """
    Token-level F1 between prediction and reference (after normalization).
    This is the standard SQuAD F1 metric.
    """
    pred_tokens = _normalize(prediction)
    ref_tokens = _normalize(reference)

    pred_counter = Counter(pred_tokens)
    ref_counter = Counter(ref_tokens)

    common = sum((pred_counter & ref_counter).values())
    if common == 0:
        return 0.0

    precision = common / len(pred_tokens)
    recall = common / len(ref_tokens)
    f1 = 2 * precision * recall / (precision + recall)
    return round(f1, 4)


# ---------------------------------------------------------------------------
# TODO 8 — Human Evaluation Rubric
# ---------------------------------------------------------------------------

def human_eval_rubric():
    print("""
[RUBRIC] Human Evaluation of LLM Outputs
==========================================
Rate each dimension on a 1–5 scale:

1. FLUENCY (Is the text grammatically correct and natural-sounding?)
   1 = Many grammatical errors, unreadable
   3 = Mostly fluent with minor awkward phrasing
   5 = Perfectly fluent, native-quality prose

2. COHERENCE (Is the text logically organized and consistent?)
   1 = Contradictory, random order, no logical flow
   3 = Generally logical but some inconsistencies
   5 = Perfectly coherent, ideas flow naturally

3. RELEVANCE (Does the output address the user's request?)
   1 = Completely off-topic
   3 = Partially addresses the request
   5 = Fully addresses all aspects of the request

4. FAITHFULNESS (Are all stated facts grounded in the source / context?)
   1 = Multiple fabricated facts
   3 = Mostly faithful with 1–2 unsupported claims
   5 = Every claim is supported by the provided context

5. HELPFULNESS (Would a user find this response useful?)
   1 = Not useful at all
   3 = Somewhat useful; leaves key questions unanswered
   5 = Highly useful; complete, actionable answer

ANNOTATION GUIDELINES:
  - Read the full context before rating
  - Rate each dimension independently
  - Inter-annotator agreement (Kappa > 0.7) required before use
  - Flag edge cases; do not guess on ambiguous items

AGGREGATION:
  - Average ratings across 3+ annotators per item
  - Overall quality = weighted average (weights per task)
""")


# ---------------------------------------------------------------------------
# TODO 9 — LLM-as-Judge
# ---------------------------------------------------------------------------

def llm_as_judge():
    print("""
[PATTERN] LLM-as-Judge
=======================
Use a powerful LLM (e.g., GPT-4) to evaluate outputs from a weaker or
target model. Scales annotation without costly human labelers.

PROMPT TEMPLATE (Pairwise Comparison):
---
System: You are an expert evaluator. Given a user question and two model
responses (A and B), decide which response is better. Output ONLY one of:
"A", "B", or "TIE". Then provide a one-sentence rationale.

User Question: {question}

Response A:
{response_a}

Response B:
{response_b}

Which response is better?
---

PROMPT TEMPLATE (Single Response Scoring):
---
Rate the following response on a scale of 1–10 for helpfulness.
Respond with only the number.

Question: {question}
Response: {response}

Score:
---

BEST PRACTICES:
  - Use GPT-4 / Claude-3-Opus as judge (highest correlation with humans)
  - Randomize A/B order to detect position bias; average both orderings
  - Calibrate: validate judge vs human labels on 100 samples first
  - Prompt judge to reason before scoring (chain-of-thought improves reliability)
  - Avoid self-evaluation (do not use the same model as judge and judged)

KNOWN BIASES:
  - Verbosity bias: LLMs favor longer responses
  - Self-enhancement bias: model prefers outputs from same family
  - Position bias: first response often preferred (randomize order)

CORRELATION WITH HUMANS: ~0.7–0.85 Spearman for GPT-4 as judge on LFQA
""")


# ---------------------------------------------------------------------------
# TODO 10 — Benchmark Suite
# ---------------------------------------------------------------------------

def benchmark_suite():
    print("""
[BENCHMARKS] LLM Evaluation Benchmarks
=======================================

1. MMLU (Massive Multitask Language Understanding)
   - 57 subjects: STEM, humanities, social sciences, law, medicine
   - 15,908 multiple-choice questions (4 options)
   - Metric: accuracy; human expert baseline ≈ 89.8%
   - Tests: knowledge breadth and reasoning

2. HumanEval
   - 164 Python programming problems
   - Metric: pass@k (fraction of problems solved with k attempts)
   - Tests: code generation correctness
   - GPT-4 pass@1 ≈ 67%; Claude-3-Opus ≈ 74%

3. TruthfulQA
   - 817 questions designed to elicit common misconceptions
   - Metric: % truthful AND % informative (both must be high)
   - Tests: factuality and resistance to hallucination

4. GSM8K (Grade School Math)
   - 8,500 grade-school math word problems requiring multi-step reasoning
   - Metric: exact match on final numerical answer
   - Tests: arithmetic reasoning and chain-of-thought capability

5. HellaSwag
   - Commonsense NLI: pick the most plausible sentence completion
   - 70,000 examples; adversarially filtered
   - Metric: accuracy; tests physical and social commonsense

6. MBPP (Mostly Basic Python Problems)
   - 374 crowd-sourced Python programming tasks
   - Metric: pass@1, pass@3

7. BIG-Bench Hard
   - 23 challenging tasks from BIG-Bench that GPT-4-class models don't saturate
   - Tests: logical reasoning, multi-step planning, formal fallacies

EVALUATION PIPELINE:
  1. Run model on each benchmark with temperature=0
  2. Parse outputs with task-specific extractors
  3. Compute metric; compare to published baselines
  4. Aggregate into radar chart across capability dimensions
""")


# ---------------------------------------------------------------------------
# TODO 11 — Hallucination Detection Metrics
# ---------------------------------------------------------------------------

def hallucination_metrics():
    print("""
[METRICS] Hallucination Detection
===================================

1. FAITHFULNESS SCORE (NLI-based)
   - Decompose generated text into atomic claims
   - For each claim, run NLI model: does source document ENTAIL it?
   - Faithfulness = % claims entailed by source
   - Tool: FACTCC, TRUE, or LLM-based decomposition

2. ENTITY OVERLAP
   - Extract named entities from generation and reference/source
   - Hallucination indicator: entities in generation NOT in source
   - Fast heuristic; misses implicit hallucinations

3. QUESTION-ANSWER CONSISTENCY (QAG)
   - Generate questions from the summary
   - Answer each question using the source document and the summary
   - Compare answers; divergence = hallucination signal
   - Tools: QAFactEval, FEQA

4. LLM SELF-CONSISTENCY
   - Sample the same prompt N times (temperature > 0)
   - Cluster responses; outlier responses likely hallucinated
   - Consistent claim across 9/10 samples → higher confidence

5. HALLUCINATION BENCHMARKS
   - TruthfulQA: factual accuracy on known misconceptions
   - HaluEval: 35K hallucinated examples for model training/eval
   - FActScoring: fine-grained fact scoring against Wikipedia

6. RAG FAITHFULNESS METRIC (RAGAS)
   - Faithfulness: % statements in answer that can be inferred from context
   - Answer Relevancy: cosine similarity of answer embedding to question
   - Context Recall: % of ground-truth facts found in retrieved context

MITIGATION STRATEGIES:
  - RAG: ground answers in retrieved facts
  - Chain-of-thought: forces explicit reasoning steps
  - Self-consistency decoding: majority vote across samples
  - Refusal training: teach model to say "I don't know"
""")


# ---------------------------------------------------------------------------
# TODO 12 — Factuality Evaluation
# ---------------------------------------------------------------------------

def factuality_evaluation():
    print("""
[CONCEPT] Factuality Evaluation
=================================

APPROACHES:

1. Knowledge Base Lookup
   - Extract claims → query Wikidata / Google KG → verify each claim
   - Precision: % claims verified as true
   - Limitation: KB coverage gaps; temporal knowledge cutoffs

2. Search-Augmented Verification
   - For each claim, retrieve top web search results
   - NLI model: does retrieved text support or contradict the claim?
   - RARR system (Google): retrieves and revises for factuality

3. Human Fact-Checking
   - Gold standard but slow; used to calibrate automated systems
   - Annotators rate each sentence: Supported / Contradicted / Not checkable
   - Standard for FEVER (Fact Extraction and VERification) dataset

4. Temporal Factuality
   - Facts change over time; test if model's knowledge is current
   - Use questions with answers that changed post-training-cutoff
   - Measure how confidently model asserts outdated facts

5. Calibration vs Factuality
   - Well-calibrated model: high confidence → high factual accuracy
   - Measure Expected Calibration Error (ECE) on factual QA tasks
   - Ideal: model expresses uncertainty when likely wrong

TOOLS:
  FActScore: fine-grained atomic fact evaluation vs Wikipedia
  FactKB: KB-augmented factuality scoring
  LLM-Check: GPT-4 prompted to verify factual claims with search
""")


# ---------------------------------------------------------------------------
# TODO 13 — Coherence Scoring
# ---------------------------------------------------------------------------

def coherence_scoring():
    print("""
[CONCEPT] Coherence Scoring
=============================

COHERENCE DIMENSIONS:
  1. Local coherence: adjacent sentences relate logically
  2. Global coherence: document has clear structure and theme
  3. Referential coherence: pronouns/references resolved correctly
  4. Causal coherence: causal relationships are accurate

AUTOMATED METRICS:

1. Discourse Coherence Models
   - BERT-based classifier trained on coherent vs shuffled sentence permutations
   - Entity Grid model: tracks entity transitions across sentences
   - Score: probability that text is coherent (0–1)

2. Perplexity-based
   - Lower perplexity of sentence given prior sentences → more coherent
   - GPT-2 perplexity as proxy for local coherence

3. Embedding Similarity
   - Sentence-BERT embeddings for consecutive sentences
   - Average cosine similarity: high → topically coherent
   - Sudden drops → topic change / incoherence

4. ROUGE-Based (for summarization)
   - Compare summary sentences to source; jumpy reference → incoherent

5. Human Annotation
   - Trained annotators rate on 1–5 scale (see rubric)
   - Used to train/calibrate automated coherence models

BENCHMARK: ROCStories (commonsense story coherence), DailyMail coherence
""")


# ---------------------------------------------------------------------------
# TODO 14 — Evaluation Dataset Construction
# ---------------------------------------------------------------------------

def eval_dataset_construction():
    print("""
[GUIDE] Building a High-Quality LLM Evaluation Dataset
========================================================

STEP 1: DEFINE SCOPE
  - Task type: QA, summarization, code gen, dialogue, reasoning
  - Capability dimensions to test: factuality, reasoning, safety, tone
  - Target domain: general, medical, legal, finance (domain specificity matters)

STEP 2: DATA SOURCES
  - Human-written: crowdsourcing (Mechanical Turk, Prolific), expert annotation
  - Real usage logs: sample production queries (PII-scrubbed)
  - Adversarial: red-team prompts, edge cases, ambiguous inputs
  - Existing datasets: SQuAD, TriviaQA, MMLU as starting point

STEP 3: ANNOTATION PROCESS
  - Write detailed annotation guidelines with examples
  - Pilot with 50 items; measure inter-annotator agreement (IAA)
  - Target IAA: Cohen's Kappa > 0.7 (substantial agreement)
  - 3 annotators per item; majority vote for labels

STEP 4: QUALITY CONTROL
  - Gold items: known-answer items seeded throughout for QC
  - Filter annotators below 80% accuracy on gold items
  - Review items with low agreement; adjudicate or discard

STEP 5: COVERAGE & DIVERSITY
  - Balance across difficulty levels (easy / medium / hard)
  - Diverse topics, writing styles, question types
  - Include adversarial examples (negation, ambiguity, multi-hop)

STEP 6: SPLITS
  - Validation: used during development (risk of overfitting)
  - Test: locked; only used for final evaluation
  - Never tune on test set; report single test set number

STEP 7: MAINTENANCE
  - Version-control the dataset (DVC / HuggingFace datasets)
  - Update when model knowledge cutoff changes
  - Retire saturated benchmarks (accuracy > 95%)

BEST PRACTICES:
  - Avoid contamination: check if eval items appear in training data
  - Dynamic benchmarks: generate new eval items periodically (e.g., BIG-Bench)
  - Publish dataset card: collection methodology, biases, limitations
""")


# ---------------------------------------------------------------------------
# TODO 15 — A/B Test Statistical Significance for LLM Outputs
# ---------------------------------------------------------------------------

def ab_test_significance(wins_a: int, wins_b: int) -> dict:
    """
    Given pairwise comparison counts (wins for A vs wins for B),
    compute two-sided p-value using normal approximation to binomial.

    Null hypothesis: P(A wins) = 0.5
    Returns dict with observed_p, z_score, p_value, significant (α=0.05)
    """
    n = wins_a + wins_b
    if n == 0:
        return {"error": "no comparisons provided"}

    # Observed proportion for A
    p_obs = wins_a / n
    # Standard error under H0 (p=0.5)
    se = math.sqrt(0.5 * 0.5 / n)
    z = (p_obs - 0.5) / se

    # Two-sided p-value: p ≈ 2 * Φ(-|z|) using erfc
    p_value = math.erfc(abs(z) / math.sqrt(2))

    return {
        "wins_a": wins_a,
        "wins_b": wins_b,
        "total": n,
        "p_a_wins": round(p_obs, 4),
        "z_score": round(z, 4),
        "p_value": round(p_value, 4),
        "significant_at_0.05": p_value < 0.05,
        "winner": ("A" if (p_value < 0.05 and wins_a > wins_b)
                   else "B" if (p_value < 0.05 and wins_b > wins_a)
                   else "No significant winner"),
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=== Solution 6.2: LLM Evaluation Metrics ===\n")

    # BLEU
    candidate = ["the", "cat", "is", "on", "the", "mat"]
    reference = ["the", "cat", "sat", "on", "the", "mat"]
    print(f"BLEU score: {bleu_score(candidate, [reference]):.4f}")

    # ROUGE-N
    print(f"ROUGE-2: {rouge_n(candidate, reference, n=2)}")

    # ROUGE-L
    print(f"ROUGE-L: {rouge_l(candidate, reference)}")

    # Perplexity
    log_probs = [-1.2, -0.8, -1.5, -0.9, -1.1]
    print(f"Perplexity: {perplexity(log_probs)}")

    # BERTScore
    explain_bertscore()

    # Exact Match
    print(f"Exact Match ('Paris' vs ['paris','London']): {exact_match('Paris', ['paris', 'London'])}")

    # QA F1
    print(f"QA F1: {qa_f1_score('the cat sat on mat', 'the cat sat on the mat')}")

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
    result = ab_test_significance(120, 100)
    print(f"\nA/B Test Significance (120 vs 100 wins): {result}")


if __name__ == "__main__":
    main()
