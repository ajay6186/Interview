# ============================================================
# Solution 6.4 — Bias Detection & Hallucination Mitigation
# ============================================================
import math
import string
from collections import Counter


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _tokenize(text: str) -> list:
    text = text.lower().translate(str.maketrans("", "", string.punctuation))
    return text.split()


# ---------------------------------------------------------------------------
# TODO 1 — Demographic Parity
# ---------------------------------------------------------------------------

def demographic_parity(y_pred: list, protected: list) -> dict:
    """
    Measure demographic parity: equal positive prediction rates across groups.
    A 'fair' model has parity_gap ≈ 0.
    """
    groups = {0: {"pos": 0, "total": 0}, 1: {"pos": 0, "total": 0}}
    for pred, prot in zip(y_pred, protected):
        groups[prot]["total"] += 1
        if pred == 1:
            groups[prot]["pos"] += 1

    rate_0 = groups[0]["pos"] / groups[0]["total"] if groups[0]["total"] > 0 else 0.0
    rate_1 = groups[1]["pos"] / groups[1]["total"] if groups[1]["total"] > 0 else 0.0
    return {
        "rate_group_0": round(rate_0, 4),
        "rate_group_1": round(rate_1, 4),
        "parity_gap": round(abs(rate_0 - rate_1), 4),
        "interpretation": ("fair (gap < 0.1)" if abs(rate_0 - rate_1) < 0.1
                           else "potentially biased (gap >= 0.1)"),
    }


# ---------------------------------------------------------------------------
# TODO 2 — Equal Opportunity
# ---------------------------------------------------------------------------

def equal_opportunity(y_pred: list, y_true: list, protected: list) -> dict:
    """
    Equal opportunity: true positive rates (recall) should be equal across groups.
    Measures whether the model misses positive cases equally across groups.
    """
    groups = {0: {"tp": 0, "fn": 0}, 1: {"tp": 0, "fn": 0}}
    for pred, true, prot in zip(y_pred, y_true, protected):
        if true == 1:
            if pred == 1:
                groups[prot]["tp"] += 1
            else:
                groups[prot]["fn"] += 1

    def tpr(g):
        denom = g["tp"] + g["fn"]
        return g["tp"] / denom if denom > 0 else 0.0

    tpr_0 = tpr(groups[0])
    tpr_1 = tpr(groups[1])
    return {
        "tpr_group_0": round(tpr_0, 4),
        "tpr_group_1": round(tpr_1, 4),
        "gap": round(abs(tpr_0 - tpr_1), 4),
        "interpretation": ("fair (gap < 0.1)" if abs(tpr_0 - tpr_1) < 0.1
                           else "unequal opportunity (gap >= 0.1)"),
    }


# ---------------------------------------------------------------------------
# TODO 3 — Disparate Impact Ratio
# ---------------------------------------------------------------------------

def disparate_impact(y_pred: list, protected: list) -> float:
    """
    Disparate impact ratio = min_rate / max_rate.
    < 0.8 violates the "four-fifths rule" (EEOC guideline for discrimination).
    """
    groups = {0: {"pos": 0, "total": 0}, 1: {"pos": 0, "total": 0}}
    for pred, prot in zip(y_pred, protected):
        groups[prot]["total"] += 1
        if pred == 1:
            groups[prot]["pos"] += 1

    rate_0 = groups[0]["pos"] / groups[0]["total"] if groups[0]["total"] > 0 else 0.0
    rate_1 = groups[1]["pos"] / groups[1]["total"] if groups[1]["total"] > 0 else 0.0

    if max(rate_0, rate_1) == 0:
        return 1.0
    ratio = min(rate_0, rate_1) / max(rate_0, rate_1)
    return round(ratio, 4)


# ---------------------------------------------------------------------------
# TODO 4 — Fairness through Awareness
# ---------------------------------------------------------------------------

def fairness_through_awareness():
    print("""
[CONCEPT] Fairness Through Awareness & Individual Fairness
============================================================

INDIVIDUAL FAIRNESS (Dwork et al., 2012):
  "Similar individuals should be treated similarly."
  - Define a task-specific similarity metric D(x_i, x_j) on individuals
  - Model f must satisfy: |f(x_i) - f(x_j)| ≤ L · D(x_i, x_j)
  - This is a Lipschitz condition in output space w.r.t. input similarity

FAIRNESS THROUGH AWARENESS:
  - Explicitly use protected attributes to enforce fairness (not "fairness
    through unawareness" which ignores protected attributes — often backfires)
  - Reason: correlated proxies (zip code → race) cause indirect discrimination
  - Better: include the attribute and constrain predictions to be fair

GROUP FAIRNESS vs INDIVIDUAL FAIRNESS:
  - Group: statistical parity across demographic groups (demographic parity,
    equal opportunity, equalized odds)
  - Individual: similar people get similar outcomes regardless of group
  - CONFLICT: it is mathematically impossible to satisfy all group fairness
    criteria simultaneously when base rates differ (Chouldechova, 2017)

TRADE-OFF:
  - Enforcing demographic parity reduces accuracy for the majority group
  - Choose the fairness criterion that matches the legal / ethical context
  - Consult stakeholders: domain expertise on what "fair" means

TOOLS: Fairlearn, AIF360 (IBM), What-If Tool (Google), Aequitas
""")


# ---------------------------------------------------------------------------
# TODO 5 — Calibration Measurement (ECE)
# ---------------------------------------------------------------------------

def calibration_measurement(y_prob: list, y_true: list, n_bins: int = 10) -> dict:
    """
    Compute Expected Calibration Error (ECE) and per-bin statistics.
    A perfectly calibrated model has ECE = 0.
    """
    bin_edges = [i / n_bins for i in range(n_bins + 1)]
    bins = []
    total_ece = 0.0

    for i in range(n_bins):
        lo, hi = bin_edges[i], bin_edges[i + 1]
        indices = [j for j, p in enumerate(y_prob) if lo <= p < hi] if i < n_bins - 1 \
            else [j for j, p in enumerate(y_prob) if lo <= p <= hi]

        if not indices:
            continue

        avg_conf = sum(y_prob[j] for j in indices) / len(indices)
        avg_acc = sum(y_true[j] for j in indices) / len(indices)
        fraction = len(indices) / len(y_prob)
        bin_ece = fraction * abs(avg_conf - avg_acc)
        total_ece += bin_ece

        bins.append({
            "range": f"[{lo:.1f}, {hi:.1f})",
            "n": len(indices),
            "avg_confidence": round(avg_conf, 4),
            "avg_accuracy": round(avg_acc, 4),
            "calibration_error": round(abs(avg_conf - avg_acc), 4),
        })

    return {"ece": round(total_ece, 4), "bins": bins}


# ---------------------------------------------------------------------------
# TODO 6 — Hallucination Heuristics
# ---------------------------------------------------------------------------

def hallucination_heuristics(answer: str, source: str) -> dict:
    """
    Fast heuristic hallucination detector using token overlap.
    - entity_overlap: fraction of answer words found in source
    - token_overlap: token precision of answer given source tokens
    """
    ans_tokens = set(_tokenize(answer))
    src_tokens = set(_tokenize(source))

    if not ans_tokens:
        return {"entity_overlap": 0.0, "token_overlap": 0.0, "likely_hallucination": True}

    overlap = ans_tokens & src_tokens
    entity_overlap = len(overlap) / len(ans_tokens)

    # Token-level precision (unigram)
    ans_list = _tokenize(answer)
    src_set = set(_tokenize(source))
    matched = sum(1 for t in ans_list if t in src_set)
    token_overlap = matched / len(ans_list) if ans_list else 0.0

    likely_hallucination = token_overlap < 0.5

    return {
        "entity_overlap": round(entity_overlap, 4),
        "token_overlap": round(token_overlap, 4),
        "likely_hallucination": likely_hallucination,
    }


# ---------------------------------------------------------------------------
# TODO 7 — Grounding Technique
# ---------------------------------------------------------------------------

def grounding_technique():
    print("""
[TECHNIQUE] Grounding as Hallucination Mitigation
===================================================
OVERVIEW:
  Ground LLM responses in verifiable source documents.
  The model is constrained to cite and draw from provided context
  rather than relying on parametric (possibly outdated/false) knowledge.

HOW TO IMPLEMENT:

1. RETRIEVAL-AUGMENTED GENERATION (RAG)
   - Retrieve top-K relevant passages from a trusted knowledge base
   - Include passages in the prompt as context
   - Instruct model: "Answer ONLY using the provided context.
     If the context doesn't contain the answer, say 'I don't know'."

2. CITATION ENFORCEMENT
   - Require model to cite source [1], [2] after each factual claim
   - Post-processing: verify that cited passage supports the claim
   - Tools: LlamaIndex citation engine, LangChain with citations

3. FACT VERIFICATION LAYER
   - Run output through NLI model: source → claim (entailment or contradiction)
   - If contradiction detected: regenerate or flag for human review

4. CONSTRAINED GENERATION
   - Structured prompting: "Fill in facts ONLY from the following document: ..."
   - JSON-mode output with source references for each field

5. MULTI-STEP REASONING WITH QUOTES
   - Chain-of-thought: force model to quote exact source text before concluding
   - Reduces paraphrase-induced fact distortion

WHEN GROUNDING FAILS:
  - Source documents themselves contain errors → garbage in, garbage out
  - Model ignores context and uses parametric knowledge (prompt engineering fix)
  - Retrieval returns irrelevant documents → improve retrieval recall first

METRICS: RAGAS Faithfulness score, FactCC, NLI entailment rate
""")


# ---------------------------------------------------------------------------
# TODO 8 — Self-Consistency Checking
# ---------------------------------------------------------------------------

def self_consistency(outputs: list) -> dict:
    """
    Majority vote across multiple model samples for the same prompt.
    Returns the most common output and the fraction of outputs that match it.
    Introduced by Wang et al. (2023) for reasoning tasks.
    """
    if not outputs:
        return {"consensus": None, "consistency_score": 0.0}

    counts = Counter(outputs)
    consensus, top_count = counts.most_common(1)[0]
    consistency_score = top_count / len(outputs)

    return {
        "consensus": consensus,
        "consistency_score": round(consistency_score, 4),
        "vote_distribution": dict(counts),
        "n_samples": len(outputs),
        "interpretation": ("high confidence" if consistency_score >= 0.8
                           else "uncertain — consider abstaining or escalating"),
    }


# ---------------------------------------------------------------------------
# TODO 9 — RAG as Hallucination Mitigation
# ---------------------------------------------------------------------------

def rag_hallucination_mitigation():
    print("""
[TECHNIQUE] RAG as Hallucination Mitigation
============================================
HOW RAG REDUCES HALLUCINATION:

1. PARAMETRIC vs NON-PARAMETRIC KNOWLEDGE
   - Parametric: facts baked into model weights during training
     (may be outdated, incomplete, or false)
   - Non-parametric: facts retrieved at query time from an external store
   - RAG replaces parametric with non-parametric → current, verifiable facts

2. MECHANISM
   - Query → Retrieve top-K relevant chunks from vector DB
   - Chunks injected into prompt: model reads before generating
   - Model can copy/paraphrase from context → reduces fabrication

3. FAITHFULNESS vs HALLUCINATION RATE
   - Pure LLM (GPT-4 on open-domain QA): ~20-30% hallucination rate
   - RAG-augmented: ~5-15% depending on retrieval quality
   - Key dependency: retrieval recall must be high or answer quality drops

4. REMAINING FAILURE MODES
   - Retrieved context is irrelevant → model hallucinates without grounding
   - Model ignores context and uses parametric knowledge (prompt engineering)
   - Retrieved context contains errors (e.g., from web crawl)
   - Long contexts: model ignores middle of context (lost-in-the-middle)

5. BEST PRACTICES
   - Verify retrieval recall on eval set before relying on RAG
   - Explicit instruction: "If you cannot find the answer in the provided
     context, respond with 'I don't have information on that'."
   - Use faithfulness metric (RAGAS) to monitor production
   - Add a post-generation NLI check: does answer follow from retrieved chunks?

RAGAS METRICS: Faithfulness, Answer Relevancy, Context Recall, Context Precision
""")


# ---------------------------------------------------------------------------
# TODO 10 — Uncertainty Quantification
# ---------------------------------------------------------------------------

def uncertainty_quantification(probs: list) -> dict:
    """
    Quantify prediction uncertainty from a set of probability estimates
    (e.g., from MC Dropout, ensembles, or temperature sampling).
    """
    n = len(probs)
    if n == 0:
        return {}

    mean_p = sum(probs) / n
    variance = sum((p - mean_p) ** 2 for p in probs) / n

    # Shannon entropy of the mean prediction (binary)
    p = mean_p
    eps = 1e-10
    entropy = -(p * math.log(p + eps) + (1 - p) * math.log(1 - p + eps))

    # Epistemic uncertainty ≈ variance across samples
    # Aleatoric uncertainty ≈ entropy of mean prediction
    return {
        "mean": round(mean_p, 4),
        "variance": round(variance, 6),
        "std_dev": round(math.sqrt(variance), 4),
        "entropy": round(entropy, 4),
        "confidence": "high" if variance < 0.01 and (mean_p > 0.8 or mean_p < 0.2)
                      else "low — model is uncertain",
    }


# ---------------------------------------------------------------------------
# TODO 11 — Human Feedback System Design
# ---------------------------------------------------------------------------

def human_feedback_system():
    print("""
[DESIGN] Human Feedback Collection System
==========================================

PURPOSE:
  Collect signal from users to improve model quality, safety, and alignment.
  Used for RLHF reward model training, error detection, and evaluation.

FEEDBACK TYPES:

1. BINARY THUMBS UP / DOWN
   - Simplest; high response rate
   - Limited signal: doesn't say WHY the response was bad

2. PAIRWISE PREFERENCE
   - Show two model outputs; user picks the better one
   - Used for reward model training (RLHF)
   - Strong signal; handles subjective quality

3. RUBRIC RATINGS (1–5)
   - Rate multiple dimensions: helpfulness, safety, accuracy
   - Richer signal; higher annotator burden

4. FREE-TEXT FEEDBACK
   - User can explain what was wrong
   - Highest quality; lowest volume; requires NLP processing

COLLECTION INTERFACE:
  - In-product: thumbs up/down below each AI response
  - Annotation platform: professional labelers with detailed guidelines
  - Red-teaming sessions: expert adversarial probing

QUALITY CONTROL:
  - Anti-spam: IP rate limiting, CAPTCHA for high-value feedback
  - Consistency checks: re-show same examples; flag inconsistent raters
  - Gold items: known-correct items seeded to measure rater quality
  - IAA threshold: Kappa > 0.7 for professional annotators

DATA PIPELINE:
  User feedback → Kafka → labeling queue → quality filter →
  reward model training data → RLHF loop

PRIVACY:
  - PII scrub before storing feedback
  - Explicit consent for using feedback to train models
  - Users can delete their feedback (GDPR right to erasure)

BIAS IN FEEDBACK:
  - Sycophancy: users prefer longer, more confident answers even if wrong
  - Demographic bias: annotators from one culture may rate differently
  - Mitigation: diverse annotator pool; calibration training; debiasing
""")


# ---------------------------------------------------------------------------
# TODO 12 — Training Data Bias Analysis
# ---------------------------------------------------------------------------

def training_data_bias_analysis():
    print("""
[GUIDE] Analyzing Bias in Training Datasets
============================================

STEP 1: REPRESENTATION AUDIT
  - Count examples per demographic group (gender, race, age, geography)
  - Compare to real-world population distributions
  - Flag underrepresented groups: model may perform poorly on them
  - Tool: Facets (Google), DataDrift, Pandas profiling

STEP 2: LABEL BIAS
  - Are labels assigned consistently across groups?
  - Test: same input with different protected attribute → same label?
  - Compute label rates by group; large differences = potential annotator bias
  - Review labeling guidelines for culturally specific assumptions

STEP 3: FEATURE CORRELATION WITH PROTECTED ATTRIBUTES
  - Compute correlation between features and protected attributes
  - High correlation (e.g., zip_code ↔ race) = proxy discrimination risk
  - Remove or downsample highly correlated proxy features

STEP 4: HISTORICAL BIAS
  - Training data reflects historical decisions that may be discriminatory
  - Example: historical hiring data encodes gender bias in job recommendations
  - Cannot be fixed by debiasing alone; requires new data collection

STEP 5: LANGUAGE / CULTURAL BIAS
  - NLP models trained on English web data underperform on other languages
  - AAVE, dialects, code-switching often flagged as "low quality"
  - Test model performance across diverse linguistic groups

STEP 6: BENCHMARK COVERAGE
  - Evaluate model on held-out data stratified by group
  - Report per-group metrics: accuracy, F1, false positive rate
  - Target: performance gap < 5% across groups

TOOLS:
  - FairLearn: fairness metrics and visualizations
  - IBM AIF360: 70+ fairness metrics and mitigation algorithms
  - Google Model Cards: standardized bias reporting format
""")


# ---------------------------------------------------------------------------
# TODO 13 — Debiasing Techniques
# ---------------------------------------------------------------------------

def debiasing_techniques():
    print("""
[TECHNIQUES] Debiasing ML Models
==================================

PRE-PROCESSING (Fix the data before training):
  1. Resampling: oversample underrepresented groups; undersample dominant
  2. Reweighting: assign higher loss weight to minority group examples
  3. Data augmentation: generate synthetic examples for underrepresented groups
  4. Label correction: relabel using a fairer labeling process
  5. Feature removal: drop protected attributes and correlated proxies
     CAUTION: often insufficient due to redundant encodings

IN-PROCESSING (Modify the training objective):
  1. Fairness constraints: add equality constraints to the optimization problem
     (e.g., Lagrangian relaxation: minimize loss + λ * |TPR_0 - TPR_1|)
  2. Adversarial debiasing: train a discriminator to predict protected attribute
     from model representations; penalize the main model for being predictable
  3. Fair representation learning: learn embeddings invariant to protected attribute
  4. Multi-task learning: explicitly predict fairness metrics as auxiliary tasks

POST-PROCESSING (Adjust model outputs):
  1. Threshold calibration: set different decision thresholds per group
     to achieve equal TPR / FPR (equalized odds post-processing)
  2. Calibration: Platt scaling or isotonic regression per group
  3. Reject option classification: abstain on uncertain predictions near boundary
  4. Reranking: rerank top-K outputs to satisfy fairness constraints (search/recs)

TRADE-OFFS:
  - Fairness ↔ Accuracy: usually some accuracy cost to enforce fairness
  - Group fairness ↔ Individual fairness: may conflict
  - Which fairness definition is legally / ethically appropriate?
    Consult domain experts and affected communities

EVALUATION AFTER DEBIASING:
  - Re-measure all fairness metrics; ensure no new biases introduced
  - Check accuracy didn't drop unacceptably
  - Document debiasing choices in model card
""")


# ---------------------------------------------------------------------------
# TODO 14 — Responsible AI Checklist
# ---------------------------------------------------------------------------

def responsible_ai_checklist():
    print("""
[CHECKLIST] Responsible AI Development
========================================

FAIRNESS & BIAS
  [ ] Audit training data for representation gaps and label bias
  [ ] Measure and report per-group performance metrics
  [ ] Apply debiasing if performance gap > 5% across groups
  [ ] Define which fairness criterion is appropriate for this application
  [ ] Conduct red-team testing with diverse testers

TRANSPARENCY & EXPLAINABILITY
  [ ] Document model architecture, training data, and intended use in Model Card
  [ ] Provide feature importance / explanations for decisions (SHAP, LIME)
  [ ] Surface model confidence; do not present uncertain outputs as facts
  [ ] Disclose when users are interacting with an AI system (EU AI Act)

PRIVACY & SECURITY
  [ ] Apply PII scrubbing to training data and inference inputs/outputs
  [ ] Privacy impact assessment completed
  [ ] Differential privacy or federated learning considered for sensitive data
  [ ] Security threat model completed; adversarial inputs tested

SAFETY & HARM PREVENTION
  [ ] Safety classifier on outputs before serving to users
  [ ] Content policy and refusal training for harmful requests
  [ ] Red-team adversarial testing before launch
  [ ] Human review queue for high-risk / low-confidence outputs
  [ ] Incident response plan for model misbehavior

ACCOUNTABILITY
  [ ] Clear ownership: who is responsible for model decisions?
  [ ] Audit log of all model deployments, rollbacks, and incidents
  [ ] Regular model performance and fairness reviews (quarterly)
  [ ] Appeals process for users affected by automated decisions

SUSTAINABILITY
  [ ] Compute carbon footprint estimated and reported
  [ ] Model distillation / quantization to reduce inference energy
  [ ] Reuse existing models before training new large ones

ONGOING MONITORING
  [ ] Data and model drift detection in production
  [ ] Bias metrics monitored in real-time (not just at launch)
  [ ] User feedback channels for reporting harmful outputs
  [ ] Sunset plan: when will this model be retired / replaced?
""")


# ---------------------------------------------------------------------------
# TODO 15 — Hallucination Benchmark
# ---------------------------------------------------------------------------

def hallucination_benchmark():
    print("""
[BENCHMARK] Hallucination Evaluation Benchmark
================================================

PURPOSE:
  Systematically measure how often a model generates false, fabricated, or
  unsupported claims across diverse task types.

BENCHMARK CATEGORIES:

1. CLOSED-DOMAIN QA (RAG faithfulness)
   - Provide source passage + question
   - Evaluate: does the answer contain only facts from the passage?
   - Metric: NLI-based faithfulness score (% claims entailed by source)
   - Dataset: NarrativeQA, QuALITY, QASPER

2. OPEN-DOMAIN FACTUAL QA
   - Questions about real-world facts (entities, dates, statistics)
   - Evaluate against ground truth from Wikipedia / Wikidata
   - Metric: Exact Match, F1, FActScore
   - Dataset: TriviaQA, Natural Questions, TruthfulQA

3. SUMMARIZATION FAITHFULNESS
   - Summarize a document; check if summary is consistent with source
   - Metric: FactCC, QAG (question-answer consistency), FRANK score
   - Dataset: CNN/DailyMail, XSum (high hallucination rate in abstractive models)

4. BIOGRAPHY GENERATION
   - Ask model to describe a real person → check claims vs Wikipedia
   - Especially tests name, date, and attribution hallucinations
   - FActScore: split bio into atomic facts; verify each against Wikipedia

5. KNOWLEDGE-INTENSIVE TASKS
   - Multi-hop reasoning, science questions, medical/legal claims
   - Dataset: HotpotQA, MedQA, LegalBench

CONSTRUCTION GUIDELINES:
  - Include questions where the model is likely to hallucinate
    (obscure entities, recent events, numerical claims, named attributes)
  - Include "I don't know" cases: model should abstain, not hallucinate
  - Balance easy / hard cases; avoid contamination with training data
  - Human annotators verify all ground-truth answers

REPORTING:
  - Hallucination rate: % responses with ≥1 factual error
  - Severity: minor (paraphrase) vs major (wrong fact) vs critical (dangerous misinformation)
  - Per-category breakdown
""")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=== Solution 6.4: Bias Detection & Hallucination Mitigation ===\n")

    y_pred =     [1, 0, 1, 1, 0, 1, 0, 0, 1, 0]
    y_true =     [1, 0, 1, 0, 0, 1, 0, 1, 1, 0]
    protected =  [0, 0, 0, 0, 0, 1, 1, 1, 1, 1]

    print("Demographic Parity:")
    for k, v in demographic_parity(y_pred, protected).items():
        print(f"  {k}: {v}")

    print("\nEqual Opportunity:")
    for k, v in equal_opportunity(y_pred, y_true, protected).items():
        print(f"  {k}: {v}")

    print(f"\nDisparate Impact Ratio: {disparate_impact(y_pred, protected)}")
    print("  (< 0.8 violates the four-fifths rule)")

    fairness_through_awareness()

    y_prob = [0.9, 0.8, 0.7, 0.6, 0.55, 0.45, 0.4, 0.3, 0.2, 0.1]
    y_true2 = [1,   1,   1,   1,   0,    0,    0,   0,   0,   0]
    cal = calibration_measurement(y_prob, y_true2)
    print(f"\nCalibration ECE: {cal['ece']}")
    for b in cal["bins"]:
        print(f"  {b}")

    answer = "Paris is the capital of Germany and has 2 million people."
    source = "Paris is the capital of France. It has over 2 million inhabitants."
    print(f"\nHallucination heuristics:")
    print(f"  Answer: '{answer}'")
    print(f"  Source: '{source}'")
    print(f"  Result: {hallucination_heuristics(answer, source)}")

    grounding_technique()

    outputs = ["Paris", "Paris", "Berlin", "Paris", "Paris"]
    print(f"\nSelf-consistency ({outputs}): {self_consistency(outputs)}")

    rag_hallucination_mitigation()

    probs = [0.6, 0.7, 0.55, 0.65, 0.6]
    print(f"\nUncertainty quantification {probs}: {uncertainty_quantification(probs)}")

    human_feedback_system()
    training_data_bias_analysis()
    debiasing_techniques()
    responsible_ai_checklist()
    hallucination_benchmark()


if __name__ == "__main__":
    main()
