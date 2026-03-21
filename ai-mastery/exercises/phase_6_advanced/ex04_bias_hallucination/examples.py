# ============================================================
# Examples 6.4 — Bias Detection & Hallucination Mitigation (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import sys
import numpy as np
import math
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')


# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Demographic parity difference (P(ŷ=1|A=0) - P(ŷ=1|A=1))"""
    np.random.seed(42)
    n = 200
    group = np.array([0]*100 + [1]*100)
    # Group 0 selected 60%, group 1 selected 40%
    y_pred = np.array([1]*60 + [0]*40 + [1]*40 + [0]*60)
    pr_0 = y_pred[group == 0].mean()
    pr_1 = y_pred[group == 1].mean()
    dpd = pr_0 - pr_1
    print(f"Ex01 — Demographic Parity Diff: P(ŷ=1|A=0)={pr_0:.4f}, P(ŷ=1|A=1)={pr_1:.4f}, DPD={dpd:.4f}")

def ex02():
    """Equal opportunity difference (TPR difference by group)"""
    # TPR = TP / (TP + FN) = recall for positive class
    y_true = np.array([1,1,1,0,0,1,1,1,0,0,  1,1,0,0,1,1,0,0,1,0])
    y_pred = np.array([1,1,0,0,0,1,0,1,0,0,  1,0,0,0,1,0,0,0,1,0])
    group  = np.array([0,0,0,0,0,0,0,0,0,0,  1,1,1,1,1,1,1,1,1,1])
    def tpr(yt, yp): return yp[(yt==1)].mean() if (yt==1).sum() > 0 else 0.0
    tpr_0 = tpr(y_true[group==0], y_pred[group==0])
    tpr_1 = tpr(y_true[group==1], y_pred[group==1])
    eod = tpr_0 - tpr_1
    print(f"Ex02 — Equal Opportunity Diff: TPR_0={tpr_0:.4f}, TPR_1={tpr_1:.4f}, EOD={eod:.4f}")

def ex03():
    """Equalized odds (TPR + FPR difference)"""
    y_true = np.array([1,1,1,0,0,1,1,0,0,0,  1,1,0,0,1,0,0,1,0,0])
    y_pred = np.array([1,1,0,0,0,1,0,0,1,0,  1,0,1,0,1,0,1,0,0,0])
    group  = np.array([0,0,0,0,0,0,0,0,0,0,  1,1,1,1,1,1,1,1,1,1])
    def tpr(yt, yp): return yp[yt==1].mean() if (yt==1).sum()>0 else 0.0
    def fpr(yt, yp): return yp[yt==0].mean() if (yt==0).sum()>0 else 0.0
    for a in [0, 1]:
        yt = y_true[group==a]; yp = y_pred[group==a]
        print(f"Ex03 — Equalized Odds Group {a}: TPR={tpr(yt,yp):.4f}, FPR={fpr(yt,yp):.4f}")

def ex04():
    """Disparate impact ratio (min/max selection rate)"""
    selection_rates = {"group_A": 0.60, "group_B": 0.40, "group_C": 0.75}
    min_rate = min(selection_rates.values())
    max_rate = max(selection_rates.values())
    di_ratio = min_rate / max_rate
    print(f"Ex04 — Disparate Impact Ratio: min={min_rate}, max={max_rate}, DI={di_ratio:.4f}")

def ex05():
    """Four-fifths rule check (disparate impact < 0.8)"""
    def fourfifths_check(selection_rates):
        max_rate = max(selection_rates.values())
        results = {}
        for group, rate in selection_rates.items():
            di = rate / max_rate
            results[group] = {"selection_rate": rate, "DI": round(di, 4), "passes_4/5": di >= 0.8}
        return results
    rates = {"white": 0.70, "black": 0.50, "hispanic": 0.55, "asian": 0.72}
    result = fourfifths_check(rates)
    failures = [g for g, r in result.items() if not r["passes_4/5"]]
    di_values = {g: r["DI"] for g, r in result.items()}
    print(f"Ex05 — Four-Fifths Rule: DI values={di_values}, fails={failures}")

def ex06():
    """Statistical parity difference"""
    # SPD = P(ŷ=1|A=privileged) - P(ŷ=1|A=unprivileged)
    y_pred = np.array([1,1,0,1,0,1,0,1,1,0,  0,1,0,0,1,0,0,1,0,0])
    group  = np.array([0,0,0,0,0,0,0,0,0,0,  1,1,1,1,1,1,1,1,1,1])
    spd = y_pred[group==0].mean() - y_pred[group==1].mean()
    print(f"Ex06 — Statistical Parity Diff: SPD={spd:.4f} (privileged=group_0, unprivileged=group_1)")

def ex07():
    """Accuracy parity (accuracy difference by group)"""
    y_true = np.array([1,0,1,1,0,0,1,0,1,0,  1,0,1,0,0,1,0,1,1,0])
    y_pred = np.array([1,0,1,0,0,0,1,0,1,0,  1,1,0,0,0,1,0,0,1,0])
    group  = np.array([0,0,0,0,0,0,0,0,0,0,  1,1,1,1,1,1,1,1,1,1])
    acc_0 = (y_pred[group==0] == y_true[group==0]).mean()
    acc_1 = (y_pred[group==1] == y_true[group==1]).mean()
    print(f"Ex07 — Accuracy Parity: acc_0={acc_0:.4f}, acc_1={acc_1:.4f}, diff={abs(acc_0-acc_1):.4f}")

def ex08():
    """False positive rate parity"""
    y_true = np.array([0,0,0,0,0,1,1,1,1,1,  0,0,0,0,0,1,1,1,1,1])
    y_pred = np.array([1,1,0,0,0,1,1,0,0,0,  0,0,0,1,1,1,1,0,0,0])
    group  = np.array([0,0,0,0,0,0,0,0,0,0,  1,1,1,1,1,1,1,1,1,1])
    def fpr(yt, yp): return yp[yt==0].mean() if (yt==0).sum()>0 else 0.0
    fpr_0 = fpr(y_true[group==0], y_pred[group==0])
    fpr_1 = fpr(y_true[group==1], y_pred[group==1])
    print(f"Ex08 — FPR Parity: FPR_0={fpr_0:.4f}, FPR_1={fpr_1:.4f}, diff={abs(fpr_0-fpr_1):.4f}")

def ex09():
    """False negative rate parity"""
    y_true = np.array([1,1,1,1,1,0,0,0,0,0,  1,1,1,1,1,0,0,0,0,0])
    y_pred = np.array([1,0,0,1,1,0,0,0,0,0,  1,1,0,1,1,0,0,0,0,0])
    group  = np.array([0,0,0,0,0,0,0,0,0,0,  1,1,1,1,1,1,1,1,1,1])
    def fnr(yt, yp): return (1-yp)[yt==1].mean() if (yt==1).sum()>0 else 0.0
    fnr_0 = fnr(y_true[group==0], y_pred[group==0])
    fnr_1 = fnr(y_true[group==1], y_pred[group==1])
    print(f"Ex09 — FNR Parity: FNR_0={fnr_0:.4f}, FNR_1={fnr_1:.4f}, diff={abs(fnr_0-fnr_1):.4f}")

def ex10():
    """Predictive parity (PPV difference)"""
    # PPV = TP / (TP + FP) = precision
    y_true = np.array([1,1,0,1,0,1,0,0,1,1,  1,0,0,1,0,1,1,0,0,1])
    y_pred = np.array([1,1,1,1,1,1,1,0,0,0,  1,1,1,1,0,0,0,0,0,0])
    group  = np.array([0,0,0,0,0,0,0,0,0,0,  1,1,1,1,1,1,1,1,1,1])
    def ppv(yt, yp):
        tp = ((yp==1) & (yt==1)).sum()
        fp = ((yp==1) & (yt==0)).sum()
        return tp / (tp + fp) if (tp + fp) > 0 else 0.0
    ppv_0 = ppv(y_true[group==0], y_pred[group==0])
    ppv_1 = ppv(y_true[group==1], y_pred[group==1])
    print(f"Ex10 — Predictive Parity (PPV): PPV_0={ppv_0:.4f}, PPV_1={ppv_1:.4f}, diff={abs(ppv_0-ppv_1):.4f}")

def ex11():
    """Individual fairness concept (print)"""
    print("""Ex11 — Individual Fairness:
  Definition: Similar individuals should receive similar predictions.
  Formal: d_Y(f(x), f(x')) ≤ L * d_X(x, x')
    where d_X = distance in input space, d_Y = distance in output space
    L = Lipschitz constant (sensitivity bound)
  Example: Two loan applicants with identical financial profiles
           but different names/zip codes → should get same prediction.
  Challenge: Requires defining a meaningful distance metric d_X
             that captures "similarity" appropriately for the task.
  Contrast with group fairness:
    Group fairness:      Aggregate statistics equal across groups
    Individual fairness: Each person treated according to relevant attributes
  Known tension: Group and individual fairness can be mathematically
                 incompatible in general (Dwork et al., 2012).""")

def ex12():
    """Group fairness vs individual fairness (print comparison)"""
    print("""Ex12 — Group vs Individual Fairness Comparison:
  ┌──────────────────┬───────────────────┬───────────────────────┐
  │ Dimension        │ Group Fairness    │ Individual Fairness   │
  ├──────────────────┼───────────────────┼───────────────────────┤
  │ Unit of analysis │ Groups/subgroups  │ Each individual       │
  │ Metrics          │ SPD, EOD, DI      │ Lipschitz condition   │
  │ Requires         │ Group labels      │ Similarity metric d_X │
  │ Measurable       │ Yes (statistics)  │ Hard (metric design)  │
  │ Satisfiable      │ Yes (adjustments) │ Depends on metric     │
  │ Known failure    │ Simpson's paradox │ Metric gaming         │
  └──────────────────┴───────────────────┴───────────────────────┘
  Key theorem: Under non-trivial conditions, demographic parity,
               equalized odds, and calibration CANNOT all hold
               simultaneously (Chouldechova 2017, Kleinberg 2017).
  Practical advice: Choose fairness criterion based on use case:
    Hiring/credit → Equalized Odds (FPR + TPR)
    Medical diagnosis → Calibration (accurate probabilities)
    Search ranking → Individual fairness (similar queries, similar results)""")

def ex13():
    """Counterfactual fairness concept (print)"""
    print("""Ex13 — Counterfactual Fairness:
  Definition: A model is counterfactually fair if, for any individual,
              the prediction is the same in the actual world AND in a
              counterfactual world where their protected attribute differs.
  Formal: P(ŷ_{A←a} = y | X=x, A=a) = P(ŷ_{A←a'} = y | X=x, A=a)
    where A = protected attribute, ŷ_{A←a'} = counterfactual prediction
  Example: A loan model is counterfactually fair if changing only a
           person's race (holding all else equal in a causal model)
           does not change the loan decision.
  Requires: A causal graph specifying how A affects other features.
  Algorithm:
    1. Build causal model: A → X → Ŷ
    2. Identify descendants of A in causal graph
    3. Remove A's influence from descendant features
    4. Train on causally-fair representation
  Tools: IBM AI Fairness 360 (AIF360) — has CF implementation
  Limitation: Causal model may be unknown or contested;
              "counterfactual" worlds may not be realistically defined.""")


# ─── INTERMEDIATE (14–26) ────────────────────────────────────

def ex14():
    """FairnessAudit function (compute all 6 metrics at once)"""
    def fairness_audit(y_true, y_pred, group):
        results = {}
        for g in [0, 1]:
            yt = y_true[group == g]; yp = y_pred[group == g]
            tp = ((yp==1)&(yt==1)).sum(); fp = ((yp==1)&(yt==0)).sum()
            fn = ((yp==0)&(yt==1)).sum(); tn = ((yp==0)&(yt==0)).sum()
            results[g] = {
                "selection_rate": float(yp.mean()),
                "accuracy":       float((yt==yp).mean()),
                "tpr": tp/(tp+fn) if (tp+fn)>0 else 0.0,
                "fpr": fp/(fp+tn) if (fp+tn)>0 else 0.0,
                "ppv": tp/(tp+fp) if (tp+fp)>0 else 0.0,
            }
        spd = results[0]["selection_rate"] - results[1]["selection_rate"]
        eod = results[0]["tpr"] - results[1]["tpr"]
        return {"group_stats": results, "SPD": round(spd, 4), "EOD": round(eod, 4)}

    np.random.seed(42)
    y_true = np.random.randint(0, 2, 100)
    group  = np.array([0]*50 + [1]*50)
    y_pred = np.where(group==0, np.random.choice([0,1], 100, p=[0.3,0.7]),
                                np.random.choice([0,1], 100, p=[0.5,0.5]))
    result = fairness_audit(y_true, y_pred, group)
    print(f"Ex14 — FairnessAudit: SPD={result['SPD']}, EOD={result['EOD']}")

def ex15():
    """Bias in word embeddings (WEAT concept, print)"""
    print("""Ex15 — Word Embedding Association Test (WEAT):
  Paper: Caliskan et al. (2017) "Semantics derived automatically from
         language corpora contain human-like biases"
  Concept: Measure association between word categories in embedding space.
  Test: WEAT compares cosine similarity of:
    Target set A  (e.g., male names: John, Michael, James...)
    Target set B  (e.g., female names: Amy, Lisa, Jennifer...)
    Attribute X   (e.g., career: professional, salary, manager...)
    Attribute Y   (e.g., family: home, parents, children...)
  Effect size: d = (mean_A - mean_B) / std_all
    Positive d → A more associated with X than Y (e.g., male→career)
  Results from paper:
    Flowers/Insects vs Pleasant/Unpleasant:  d = 1.50 (expected, benign)
    Males/Females vs Career/Family:           d = 1.81 (gender bias found)
    European/African names vs Pleasant/Unpleasant: d = 1.17 (racial bias)
  Implication: Word2Vec, GloVe, and GPT embeddings encode social biases
               present in training corpora (Common Crawl, Wikipedia, etc.)
  Mitigation: Debiasing via INLP (Null space projection), SentenceDebias""")

def ex16():
    """Historical bias simulation (biased training data)"""
    np.random.seed(42)
    n_per_group = 500
    # Group A: historically over-hired (positive labels 70%)
    group_a_labels = np.random.choice([0, 1], n_per_group, p=[0.30, 0.70])
    # Group B: historically under-hired (positive labels 35%)
    group_b_labels = np.random.choice([0, 1], n_per_group, p=[0.65, 0.35])
    all_labels = np.concatenate([group_a_labels, group_b_labels])
    groups = np.array([0]*n_per_group + [1]*n_per_group)
    rate_a = group_a_labels.mean()
    rate_b = group_b_labels.mean()
    print(f"Ex16 — Historical Bias Simulation: rate_A={rate_a:.4f}, rate_B={rate_b:.4f}, "
          f"DI={rate_b/rate_a:.4f} (DI < 0.8 = disparate impact)")

def ex17():
    """Representation bias analysis (group counts in dataset)"""
    def representation_audit(labels, groups):
        unique_groups = np.unique(groups)
        total = len(groups)
        results = {}
        for g in unique_groups:
            mask = groups == g
            count = mask.sum()
            pos_rate = labels[mask].mean()
            results[str(g)] = {
                "count": int(count),
                "proportion": round(count/total, 4),
                "positive_rate": round(float(pos_rate), 4)
            }
        return results

    np.random.seed(42)
    groups = np.array([0]*300 + [1]*150 + [2]*50)  # imbalanced groups
    labels = np.concatenate([
        np.random.choice([0,1], 300, p=[0.3, 0.7]),
        np.random.choice([0,1], 150, p=[0.5, 0.5]),
        np.random.choice([0,1], 50,  p=[0.7, 0.3])
    ])
    result = representation_audit(labels, groups)
    for g, stats in result.items():
        print(f"Ex17 — RepresentationAudit Group {g}: {stats}")

def ex18():
    """Measurement bias concept (print)"""
    print("""Ex18 — Measurement Bias in ML:
  Definition: When the features used as proxies for a concept are
              systematically less accurate for certain groups.
  Examples:
    1. Credit scoring:
       Feature "credit history length" — biased against young people
       and recently immigrated individuals who haven't had time to build credit.
    2. Healthcare:
       Feature "healthcare cost" as proxy for "health need" — biased against
       Black patients who historically had less access to care.
       (Obermeyer et al., 2019 — found 3x underestimation in one system)
    3. Natural language processing:
       Sentiment analysis trained on movie reviews — performs worse on
       African American Vernacular English (AAVE) text.
    4. Computer vision:
       Face recognition — higher error rates for darker skin tones
       because training data was predominantly lighter-skinned.
  Mitigation strategies:
    - Audit feature accuracy separately by group
    - Collect more representative training data
    - Use causal reasoning to identify and remove biased proxies
    - Validate outcomes (not just predictions) by group""")

def ex19():
    """Aggregation bias (Simpson's paradox demo)"""
    print("Ex19 — Aggregation Bias (Simpson's Paradox):")
    # Hospital example: overall survival rates can be misleading
    data = {
        "Mild cases":   {"TreatmentA": (81, 87),  "TreatmentB": (234, 270)},
        "Severe cases": {"TreatmentA": (192, 263), "TreatmentB": (55, 80)},
    }
    agg = {"TreatmentA": [0, 0], "TreatmentB": [0, 0]}
    for condition, treatments in data.items():
        for t, (survived, total) in treatments.items():
            agg[t][0] += survived; agg[t][1] += total
            rate = survived / total
            print(f"  {condition} | {t}: {survived}/{total} = {rate:.3f}")
    for t, (s, n) in agg.items():
        print(f"  Overall | {t}: {s}/{n} = {s/n:.3f}")
    print("  Simpson's Paradox: A is better in each subgroup but worse overall!")

def ex20():
    """Evaluation bias concept (print)"""
    print("""Ex20 — Evaluation Bias in ML:
  Definition: When the test set or evaluation metric does not accurately
              represent real-world performance across all groups.
  Forms:
    1. Test set imbalance: Evaluation dominated by majority group
       → Good overall accuracy masks poor minority performance
    2. Metric bias: Accuracy on imbalanced data → misleading
       (99% accuracy if 99% are majority class, always predict majority)
    3. Annotation bias: Human raters have systematic biases
       → Labels reflect rater demographics and worldview
    4. Missing subgroup evaluation: Never tested on certain demographics
    5. Benchmark contamination: Test data appears in training corpora
       → LLM benchmarks often inflated due to test set leakage
  Best practices:
    - Stratified evaluation: Report metrics by subgroup
    - Disaggregated evaluation: Separate test sets per demographic
    - Multiple metrics: Precision, Recall, F1, AUC — not just accuracy
    - Human evaluation: Sample-based human review per subgroup
    - Hold-out sets: Strict separation from pretraining data""")

def ex21():
    """Reweighting for fairness (sample weights to equalize groups)"""
    np.random.seed(42)
    # Create imbalanced dataset: 200 from group 0, 50 from group 1
    group = np.array([0]*200 + [1]*50)
    y = np.random.randint(0, 2, 250)
    # Compute reweighting: weight each sample inversely to group frequency
    n_total = len(group)
    group_counts = {g: (group==g).sum() for g in np.unique(group)}
    weights = np.array([n_total / (len(group_counts) * group_counts[g]) for g in group])
    weights /= weights.sum()  # normalize
    # Verify: weighted sum per group should be approximately equal
    w0 = weights[group==0].sum()
    w1 = weights[group==1].sum()
    print(f"Ex21 — Reweighting: group_0_count=200, group_1_count=50, "
          f"w0_sum={w0:.4f}, w1_sum={w1:.4f} (should be ~0.5 each)")

def ex22():
    """Threshold adjustment for fairness (find equal TPR threshold)"""
    np.random.seed(42)
    n = 100
    y_true_0 = np.random.randint(0, 2, n)
    y_true_1 = np.random.randint(0, 2, n)
    # Scores: group 1 gets lower scores (biased model)
    scores_0 = np.where(y_true_0==1, np.random.uniform(0.6, 1.0, n), np.random.uniform(0.0, 0.5, n))
    scores_1 = np.where(y_true_1==1, np.random.uniform(0.4, 0.8, n), np.random.uniform(0.0, 0.45, n))
    def find_threshold_for_tpr(scores, y_true, target_tpr):
        best_t, best_diff = 0.5, float('inf')
        for t in np.arange(0.1, 0.9, 0.05):
            pred = (scores >= t).astype(int)
            tpr = pred[y_true==1].mean() if (y_true==1).sum()>0 else 0.0
            diff = abs(tpr - target_tpr)
            if diff < best_diff:
                best_diff = diff; best_t = t
        return best_t
    t0 = find_threshold_for_tpr(scores_0, y_true_0, 0.7)
    t1 = find_threshold_for_tpr(scores_1, y_true_1, 0.7)
    print(f"Ex22 — Threshold Adjustment for Equal TPR: group_0_t={t0:.2f}, group_1_t={t1:.2f}")

def ex23():
    """Adversarial debiasing concept (print)"""
    print("""Ex23 — Adversarial Debiasing:
  Framework: Train a predictor f(X) → Ŷ while simultaneously training
             an adversary that tries to predict protected attribute A
             from f's intermediate representations.
  Loss:
    Predictor loss: L_pred = L(Ŷ, Y)          (minimize task loss)
    Adversary loss: L_adv  = L(Â, A)           (adversary tries to predict A)
    Total loss:     L = L_pred - λ * L_adv     (predictor tries to fool adversary)
  Training:
    - Predictor gradient ascent on adversary loss (make A unrecoverable)
    - Adversary gradient descent on adversary loss (predict A from reps)
    - Minimax game: predictor learns representation where A is not recoverable
  Paper: Zhang et al. (2018) "Mitigating Unwanted Biases with Adversarial Learning"
  Implementation: IBM AI Fairness 360 — AdversarialDebiasing class
  Result: Reduces demographic parity difference while maintaining accuracy
  Limitation:
    - Adversarial training is unstable (requires careful hyperparameter tuning)
    - Only removes direct information about A; proxy information may remain
    - Protected attribute label required at training time""")

def ex24():
    """Calibrated equalized odds concept (print)"""
    print("""Ex24 — Calibrated Equalized Odds (Post-Processing):
  Paper: Pleiss et al. (2017) "On Fairness and Calibration"
  Problem: Equalized odds and calibration are generally incompatible
           unless base rates are equal across groups.
  Definition: A model is calibrated if P(Y=1 | f(X)=s, A=a) = s
              for all scores s and groups a.
  Calibrated EO: Find group-specific decision thresholds that:
    1. Maintain calibration within each group
    2. Satisfy equalized odds (equal TPR and FPR)
  Algorithm (Pleiss et al.):
    Given calibrated classifiers f_0, f_1 (per group):
    Find mixing probabilities (γ_0, γ_1) such that:
      TPR and FPR match across groups
    The optimal solution is a convex combination of two thresholds per group.
  Key insight: If base rates differ, you cannot simultaneously have
               equal calibration AND equal TPR/FPR. One must be relaxed.
  Trade-off: Calibrated EO allows slight miscalibration to achieve fairness.
  Practical use: Post-processing step after training any classifier.""")

def ex25():
    """Expected Calibration Error (ECE) by group"""
    def ece_by_group(confidences, y_true, groups, n_bins=10):
        results = {}
        for g in np.unique(groups):
            mask = groups == g
            conf_g = confidences[mask]
            true_g = y_true[mask]
            bins = np.linspace(0, 1, n_bins + 1)
            ece_val = 0.0
            n = len(conf_g)
            for i in range(n_bins):
                b_mask = (conf_g >= bins[i]) & (conf_g < bins[i+1])
                if b_mask.sum() == 0: continue
                b_conf = conf_g[b_mask].mean()
                b_acc  = true_g[b_mask].mean()
                ece_val += (b_mask.sum() / n) * abs(b_conf - b_acc)
            results[int(g)] = round(float(ece_val), 4)
        return results

    np.random.seed(42)
    groups = np.array([0]*100 + [1]*100)
    # Group 0: well-calibrated
    conf_0 = np.random.uniform(0.5, 0.9, 100)
    true_0 = (np.random.uniform(0,1,100) < conf_0).astype(int)
    # Group 1: overconfident
    conf_1 = np.random.uniform(0.7, 1.0, 100)
    true_1 = (np.random.uniform(0,1,100) < conf_1 * 0.6).astype(int)
    confs = np.concatenate([conf_0, conf_1])
    trues = np.concatenate([true_0, true_1])
    result = ece_by_group(confs, trues, groups)
    print(f"Ex25 — ECE by Group: {result} (group 1 more miscalibrated)")

def ex26():
    """Intersectional fairness (multiple protected attributes)"""
    def intersectional_fairness(y_true, y_pred, attr1, attr2):
        results = {}
        for a1 in np.unique(attr1):
            for a2 in np.unique(attr2):
                mask = (attr1 == a1) & (attr2 == a2)
                if mask.sum() == 0: continue
                acc = (y_true[mask] == y_pred[mask]).mean()
                sel = y_pred[mask].mean()
                results[f"A1={a1},A2={a2}"] = {
                    "n": int(mask.sum()),
                    "accuracy": round(float(acc), 4),
                    "selection_rate": round(float(sel), 4)
                }
        return results

    np.random.seed(42)
    n = 200
    gender = np.array([0]*100 + [1]*100)   # 0=male, 1=female
    race   = np.tile([0, 1], 100)           # 0=white, 1=minority
    y_true = np.random.randint(0, 2, n)
    # Biased predictions: intersectional group (female + minority) penalized
    y_pred = np.where((gender==1)&(race==1),
                      np.random.choice([0,1], n, p=[0.7, 0.3]),
                      np.random.choice([0,1], n, p=[0.4, 0.6]))
    result = intersectional_fairness(y_true, y_pred, gender, race)
    sel_rates = {k: v["selection_rate"] for k, v in result.items()}
    print(f"Ex26 — Intersectional Fairness selection rates: {sel_rates}")


# ─── NESTED (27–38) ──────────────────────────────────────────

def ex27():
    """FairnessAuditor class (fit + audit + report)"""
    class FairnessAuditor:
        def __init__(self, threshold_spd=0.1, threshold_eod=0.1):
            self.threshold_spd = threshold_spd
            self.threshold_eod = threshold_eod
            self.results_ = None

        def audit(self, y_true, y_pred, group):
            metrics = {}
            for g in np.unique(group):
                yt = y_true[group==g]; yp = y_pred[group==g]
                tp = ((yp==1)&(yt==1)).sum(); fn = ((yp==0)&(yt==1)).sum()
                metrics[g] = {"sel_rate": float(yp.mean()),
                              "tpr": tp/(tp+fn) if (tp+fn)>0 else 0.0}
            spd = metrics[0]["sel_rate"] - metrics[1]["sel_rate"]
            eod = metrics[0]["tpr"]      - metrics[1]["tpr"]
            self.results_ = {"metrics": metrics, "SPD": round(spd, 4), "EOD": round(eod, 4)}
            return self

        def report(self):
            r = self.results_
            flags = []
            if abs(r["SPD"]) > self.threshold_spd: flags.append("SPD_violation")
            if abs(r["EOD"]) > self.threshold_eod: flags.append("EOD_violation")
            return {"SPD": r["SPD"], "EOD": r["EOD"],
                    "flags": flags, "PASS": len(flags) == 0}

    np.random.seed(42)
    group = np.array([0]*100 + [1]*100)
    y_true = np.random.randint(0, 2, 200)
    y_pred = np.where(group==0, np.random.choice([0,1],200,p=[0.3,0.7]),
                                np.random.choice([0,1],200,p=[0.5,0.5]))
    auditor = FairnessAuditor()
    auditor.audit(y_true, y_pred, group)
    print(f"Ex27 — FairnessAuditor: {auditor.report()}")

def ex28():
    """BiasMonitor class (track fairness over time)"""
    class BiasMonitor:
        def __init__(self):
            self.history = []

        def record(self, timestamp, spd, eod):
            self.history.append({"t": timestamp, "SPD": spd, "EOD": eod})

        def trend(self):
            if len(self.history) < 2: return "insufficient_data"
            spds = [h["SPD"] for h in self.history]
            trend_dir = "worsening" if spds[-1] > spds[0] else "improving"
            return {"entries": len(self.history), "SPD_trend": trend_dir,
                    "latest_SPD": round(spds[-1], 4), "initial_SPD": round(spds[0], 4)}

        def alert(self, threshold=0.15):
            latest = self.history[-1] if self.history else {}
            return abs(latest.get("SPD", 0)) > threshold or abs(latest.get("EOD", 0)) > threshold

    monitor = BiasMonitor()
    for t, (spd, eod) in enumerate([(0.05, 0.03), (0.08, 0.05), (0.12, 0.08), (0.18, 0.11)]):
        monitor.record(f"2026-W{t+1}", spd, eod)
    print(f"Ex28 — BiasMonitor: trend={monitor.trend()}, alert={monitor.alert(threshold=0.15)}")

def ex29():
    """DebiasedClassifier class (threshold adjustment)"""
    class DebiasedClassifier:
        def __init__(self, base_threshold=0.5):
            self.thresholds = {}
            self.base_threshold = base_threshold

        def fit_thresholds(self, scores, y_true, groups, target_tpr=0.7):
            for g in np.unique(groups):
                mask = groups == g
                best_t, best_diff = self.base_threshold, float('inf')
                for t in np.arange(0.1, 0.9, 0.02):
                    pred = (scores[mask] >= t).astype(int)
                    tpr = pred[y_true[mask]==1].mean() if (y_true[mask]==1).sum()>0 else 0.0
                    diff = abs(tpr - target_tpr)
                    if diff < best_diff:
                        best_diff = diff; best_t = t
                self.thresholds[g] = round(best_t, 2)

        def predict(self, scores, groups):
            preds = np.zeros(len(scores), dtype=int)
            for g, t in self.thresholds.items():
                mask = groups == g
                preds[mask] = (scores[mask] >= t).astype(int)
            return preds

    np.random.seed(42)
    groups = np.array([0]*100 + [1]*100)
    y_true = np.random.randint(0, 2, 200)
    scores = np.where(groups==0, np.random.uniform(0.4,0.9,200), np.random.uniform(0.2,0.7,200))
    clf = DebiasedClassifier()
    clf.fit_thresholds(scores, y_true, groups, target_tpr=0.7)
    y_pred = clf.predict(scores, groups)
    print(f"Ex29 — DebiasedClassifier: thresholds={clf.thresholds}, pred_rate_0={y_pred[groups==0].mean():.4f}, pred_rate_1={y_pred[groups==1].mean():.4f}")

def ex30():
    """FairnessTradeoffAnalyzer class (accuracy vs fairness curve)"""
    class FairnessTradeoffAnalyzer:
        def analyze(self, scores, y_true, groups, thresholds=None):
            if thresholds is None:
                thresholds = np.arange(0.1, 0.9, 0.1)
            curve = []
            for t in thresholds:
                y_pred = (scores >= t).astype(int)
                acc = (y_pred == y_true).mean()
                sel_0 = y_pred[groups==0].mean()
                sel_1 = y_pred[groups==1].mean()
                spd = abs(sel_0 - sel_1)
                curve.append({"threshold": round(float(t), 2),
                              "accuracy": round(float(acc), 4),
                              "SPD": round(float(spd), 4)})
            return curve

    np.random.seed(42)
    groups = np.array([0]*100 + [1]*100)
    y_true = np.random.randint(0, 2, 200)
    scores = np.where(groups==0, np.random.uniform(0.4,0.9,200), np.random.uniform(0.2,0.7,200))
    analyzer = FairnessTradeoffAnalyzer()
    curve = analyzer.analyze(scores, y_true, groups, np.arange(0.3, 0.8, 0.1))
    print(f"Ex30 — FairnessTradeoffAnalyzer (acc vs SPD): {[(c['threshold'], c['accuracy'], c['SPD']) for c in curve]}")

def ex31():
    """IntersectionalFairnessAnalyzer class"""
    class IntersectionalFairnessAnalyzer:
        def analyze(self, y_true, y_pred, attributes):
            # attributes: dict of attr_name → array
            keys = list(attributes.keys())
            vals = list(attributes.values())
            unique_combos = list(set(zip(*[v.tolist() for v in vals])))
            results = {}
            for combo in unique_combos:
                mask = np.ones(len(y_true), dtype=bool)
                for k, v in zip(keys, combo):
                    mask &= (attributes[k] == v)
                if mask.sum() < 5: continue
                acc = (y_true[mask] == y_pred[mask]).mean()
                sel = y_pred[mask].mean()
                results[str(dict(zip(keys, combo)))] = {
                    "n": int(mask.sum()),
                    "accuracy": round(float(acc), 4),
                    "selection_rate": round(float(sel), 4)
                }
            return results

    np.random.seed(42)
    n = 200
    attrs = {"gender": np.tile([0,1], 100), "age_group": np.array([0]*100+[1]*100)}
    y_true = np.random.randint(0, 2, n)
    y_pred = np.random.randint(0, 2, n)
    analyzer = IntersectionalFairnessAnalyzer()
    result = analyzer.analyze(y_true, y_pred, attrs)
    print(f"Ex31 — IntersectionalFairnessAnalyzer: {len(result)} subgroups analyzed")
    for k, v in list(result.items())[:2]:
        print(f"  {k}: {v}")

def ex32():
    """DataRepresentationAuditor class"""
    class DataRepresentationAuditor:
        def audit(self, data, group_col, label_col):
            total = len(data)
            groups = {}
            for row in data:
                g = row[group_col]
                groups.setdefault(g, {"count": 0, "positives": 0})
                groups[g]["count"] += 1
                if row[label_col] == 1:
                    groups[g]["positives"] += 1
            results = {}
            for g, stats in groups.items():
                results[g] = {
                    "count": stats["count"],
                    "proportion": round(stats["count"] / total, 4),
                    "positive_rate": round(stats["positives"] / stats["count"], 4)
                }
            counts = [v["count"] for v in results.values()]
            imbalance_ratio = max(counts) / min(counts)
            return {"groups": results, "imbalance_ratio": round(imbalance_ratio, 4),
                    "is_imbalanced": imbalance_ratio > 3.0}

    data = (
        [{"group": "A", "label": np.random.randint(0,2)} for _ in range(300)] +
        [{"group": "B", "label": np.random.randint(0,2)} for _ in range(80)] +
        [{"group": "C", "label": np.random.randint(0,2)} for _ in range(20)]
    )
    auditor = DataRepresentationAuditor()
    result = auditor.audit(data, "group", "label")
    print(f"Ex32 — DataRepresentationAuditor: imbalance_ratio={result['imbalance_ratio']}, is_imbalanced={result['is_imbalanced']}")

def ex33():
    """FairnessDashboard class (all metrics + alerts)"""
    class FairnessDashboard:
        THRESHOLDS = {"SPD": 0.10, "EOD": 0.10, "DI": 0.80}

        def compute(self, y_true, y_pred, group):
            metrics = {}
            for g in np.unique(group):
                yt = y_true[group==g]; yp = y_pred[group==g]
                tp = ((yp==1)&(yt==1)).sum(); fn = ((yp==0)&(yt==1)).sum()
                metrics[g] = {"sel": float(yp.mean()),
                              "tpr": tp/(tp+fn) if (tp+fn)>0 else 0.0}
            spd = metrics[0]["sel"] - metrics[1]["sel"]
            eod = metrics[0]["tpr"] - metrics[1]["tpr"]
            di  = min(metrics[0]["sel"], metrics[1]["sel"]) / max(metrics[0]["sel"], metrics[1]["sel"]) if max(metrics[0]["sel"], metrics[1]["sel"]) > 0 else 1.0
            alerts = []
            if abs(spd) > self.THRESHOLDS["SPD"]: alerts.append("SPD_ALERT")
            if abs(eod) > self.THRESHOLDS["EOD"]: alerts.append("EOD_ALERT")
            if di < self.THRESHOLDS["DI"]: alerts.append("DI_ALERT")
            return {"SPD": round(spd, 4), "EOD": round(eod, 4), "DI": round(di, 4),
                    "alerts": alerts, "status": "FAIL" if alerts else "PASS"}

    np.random.seed(42)
    group = np.array([0]*100 + [1]*100)
    y_true = np.random.randint(0, 2, 200)
    y_pred = np.where(group==0, np.random.choice([0,1],200,p=[0.3,0.7]),
                                np.random.choice([0,1],200,p=[0.55,0.45]))
    dashboard = FairnessDashboard()
    result = dashboard.compute(y_true, y_pred, group)
    print(f"Ex33 — FairnessDashboard: SPD={result['SPD']}, DI={result['DI']}, status={result['status']}, alerts={result['alerts']}")

def ex34():
    """FairnessTestSuite class (automated checks)"""
    class FairnessTestSuite:
        def __init__(self):
            self.tests = []

        def add_test(self, name, fn, threshold):
            self.tests.append({"name": name, "fn": fn, "threshold": threshold})

        def run(self, y_true, y_pred, group):
            results = []
            for t in self.tests:
                value = t["fn"](y_true, y_pred, group)
                results.append({
                    "test": t["name"],
                    "value": round(float(value), 4),
                    "threshold": t["threshold"],
                    "passed": abs(value) <= t["threshold"]
                })
            return {"passed": sum(1 for r in results if r["passed"]),
                    "failed": sum(1 for r in results if not r["passed"]),
                    "results": results}

    def spd_fn(yt, yp, g): return yp[g==0].mean() - yp[g==1].mean()
    def di_fn(yt, yp, g):
        s0, s1 = yp[g==0].mean(), yp[g==1].mean()
        return min(s0,s1)/max(s0,s1) - 1.0  # negative means below 1.0
    np.random.seed(42)
    group = np.array([0]*100 + [1]*100)
    y_true = np.random.randint(0, 2, 200)
    y_pred = np.where(group==0, np.random.choice([0,1],200,p=[0.3,0.7]),
                                np.random.choice([0,1],200,p=[0.5,0.5]))
    suite = FairnessTestSuite()
    suite.add_test("SPD", spd_fn, threshold=0.15)
    suite.add_test("DI_delta", di_fn, threshold=0.25)
    result = suite.run(y_true, y_pred, group)
    print(f"Ex34 — FairnessTestSuite: passed={result['passed']}/{result['passed']+result['failed']}, results={[(r['test'],r['passed']) for r in result['results']]}")

def ex35():
    """PostProcessingDebiaser class"""
    class PostProcessingDebiaser:
        def __init__(self, target_metric="SPD", target_value=0.0):
            self.target_metric = target_metric
            self.target_value = target_value
            self.thresholds_ = {}

        def fit(self, scores, y_true, groups):
            best_thresholds = {g: 0.5 for g in np.unique(groups)}
            best_spd = float('inf')
            for t0 in np.arange(0.2, 0.8, 0.05):
                for t1 in np.arange(0.2, 0.8, 0.05):
                    ts = {0: t0, 1: t1}
                    pred = np.zeros(len(scores), dtype=int)
                    for g, t in ts.items():
                        pred[groups==g] = (scores[groups==g] >= t).astype(int)
                    spd = abs(pred[groups==0].mean() - pred[groups==1].mean())
                    if spd < best_spd:
                        best_spd = spd; best_thresholds = {0: t0, 1: t1}
            self.thresholds_ = {k: round(v, 2) for k, v in best_thresholds.items()}

        def predict(self, scores, groups):
            pred = np.zeros(len(scores), dtype=int)
            for g, t in self.thresholds_.items():
                pred[groups==g] = (scores[groups==g] >= t).astype(int)
            return pred

    np.random.seed(42)
    groups = np.array([0]*100 + [1]*100)
    y_true = np.random.randint(0, 2, 200)
    scores = np.where(groups==0, np.random.uniform(0.4,0.9,200), np.random.uniform(0.2,0.7,200))
    debiaser = PostProcessingDebiaser()
    debiaser.fit(scores, y_true, groups)
    y_pred = debiaser.predict(scores, groups)
    spd = abs(y_pred[groups==0].mean() - y_pred[groups==1].mean())
    print(f"Ex35 — PostProcessingDebiaser: thresholds={debiaser.thresholds_}, SPD_after={spd:.4f}")

def ex36():
    """BiasReport class (generate full report)"""
    class BiasReport:
        def __init__(self, model_name):
            self.model_name = model_name

        def generate(self, y_true, y_pred, group):
            report = {"model": self.model_name, "n_samples": len(y_true)}
            for g in np.unique(group):
                yt = y_true[group==g]; yp = y_pred[group==g]
                tp = ((yp==1)&(yt==1)).sum(); fp = ((yp==1)&(yt==0)).sum()
                fn = ((yp==0)&(yt==1)).sum(); tn = ((yp==0)&(yt==0)).sum()
                report[f"group_{g}"] = {
                    "n": int(len(yt)),
                    "accuracy": round(float((yt==yp).mean()), 4),
                    "selection_rate": round(float(yp.mean()), 4),
                    "TPR": round(tp/(tp+fn) if (tp+fn)>0 else 0.0, 4),
                    "FPR": round(fp/(fp+tn) if (fp+tn)>0 else 0.0, 4),
                    "PPV": round(tp/(tp+fp) if (tp+fp)>0 else 0.0, 4),
                }
            report["SPD"] = round(report["group_0"]["selection_rate"] - report["group_1"]["selection_rate"], 4)
            report["EOD"] = round(report["group_0"]["TPR"] - report["group_1"]["TPR"], 4)
            report["overall_status"] = "FAIL" if abs(report["SPD"]) > 0.1 or abs(report["EOD"]) > 0.1 else "PASS"
            return report

    np.random.seed(42)
    group = np.array([0]*100 + [1]*100)
    y_true = np.random.randint(0, 2, 200)
    y_pred = np.where(group==0, np.random.choice([0,1],200,p=[0.35,0.65]),
                                np.random.choice([0,1],200,p=[0.5,0.5]))
    r = BiasReport("LoanModel-v3").generate(y_true, y_pred, group)
    print(f"Ex36 — BiasReport: SPD={r['SPD']}, EOD={r['EOD']}, status={r['overall_status']}")

def ex37():
    """FairMLPipeline class (preprocess + model + fairness check)"""
    class FairMLPipeline:
        def __init__(self, fairness_threshold=0.10):
            self.threshold = fairness_threshold
            self.weights_ = None
            self.thresholds_ = {}

        def preprocess(self, X, groups):
            # Reweight samples to equalize group representation
            n = len(groups)
            unique, counts = np.unique(groups, return_counts=True)
            freq = dict(zip(unique, counts))
            weights = np.array([n / (len(unique) * freq[g]) for g in groups])
            return weights / weights.sum()

        def fit_and_predict(self, X, y_true, groups, weights):
            # Weighted logistic regression (simple linear model)
            # Predict: sign(X @ w) after gradient descent
            np.random.seed(42)
            w = np.random.randn(X.shape[1]) * 0.01
            for _ in range(100):
                scores = X @ w
                probs = 1 / (1 + np.exp(-scores))
                grad = X.T @ (weights * (probs - y_true))
                w -= 0.1 * grad
            scores = 1 / (1 + np.exp(-(X @ w)))
            return (scores >= 0.5).astype(int), scores

        def check_fairness(self, y_pred, groups):
            sel_0 = y_pred[groups==0].mean()
            sel_1 = y_pred[groups==1].mean()
            spd = abs(sel_0 - sel_1)
            return {"SPD": round(float(spd), 4), "passes": spd <= self.threshold}

        def run(self, X, y_true, groups):
            weights = self.preprocess(X, groups)
            y_pred, _ = self.fit_and_predict(X, y_true, groups, weights)
            fairness = self.check_fairness(y_pred, groups)
            acc = (y_pred == y_true).mean()
            return {"accuracy": round(float(acc), 4), "fairness": fairness}

    np.random.seed(42)
    n = 200
    groups = np.array([0]*100 + [1]*100)
    X = np.random.randn(n, 4)
    X[groups==1] -= 0.5  # group 1 has slightly different distribution
    y_true = (X[:, 0] + X[:, 1] > 0).astype(int)
    pipeline = FairMLPipeline()
    result = pipeline.run(X, y_true, groups)
    print(f"Ex37 — FairMLPipeline: accuracy={result['accuracy']}, fairness={result['fairness']}")

def ex38():
    """FairnessMonitoringPipeline class (production monitoring)"""
    class FairnessMonitoringPipeline:
        def __init__(self, alert_spd=0.10, alert_eod=0.10):
            self.alert_spd = alert_spd
            self.alert_eod = alert_eod
            self.snapshots = []

        def ingest(self, timestamp, y_true, y_pred, groups):
            sel_0 = y_pred[groups==0].mean()
            sel_1 = y_pred[groups==1].mean()
            spd = float(sel_0 - sel_1)
            tp = ((y_pred==1)&(y_true==1))[groups==0].sum()
            fn = ((y_pred==0)&(y_true==1))[groups==0].sum()
            tpr_0 = tp/(tp+fn) if (tp+fn)>0 else 0.0
            tp = ((y_pred==1)&(y_true==1))[groups==1].sum()
            fn = ((y_pred==0)&(y_true==1))[groups==1].sum()
            tpr_1 = tp/(tp+fn) if (tp+fn)>0 else 0.0
            eod = float(tpr_0 - tpr_1)
            snap = {"t": timestamp, "SPD": round(spd, 4), "EOD": round(eod, 4),
                    "alert": abs(spd) > self.alert_spd or abs(eod) > self.alert_eod}
            self.snapshots.append(snap)
            return snap

        def summary(self):
            alerts = sum(1 for s in self.snapshots if s["alert"])
            return {"total_snapshots": len(self.snapshots), "alerts": alerts,
                    "latest": self.snapshots[-1] if self.snapshots else {}}

    np.random.seed(42)
    pipeline = FairnessMonitoringPipeline()
    for week in range(4):
        group = np.array([0]*100 + [1]*100)
        y_true = np.random.randint(0, 2, 200)
        bias = 0.05 * week  # drift over time
        y_pred = np.where(group==0,
                          np.random.choice([0,1],200,p=[0.3+bias, 0.7-bias]),
                          np.random.choice([0,1],200,p=[0.5, 0.5]))
        pipeline.ingest(f"2026-W{week+1}", y_true, y_pred, group)
    summary = pipeline.summary()
    print(f"Ex38 — FairnessMonitoringPipeline: {summary}")


# ─── ADVANCED (39–50) ────────────────────────────────────────

def ex39():
    """Hallucination types (intrinsic vs extrinsic, print)"""
    print("""Ex39 — Hallucination Types in LLMs:
  Definition: Generated content that is factually incorrect or not grounded
              in the provided source/context.
  Type 1: INTRINSIC HALLUCINATION
    Definition: Output contradicts the provided source document.
    Example:
      Source:    "Einstein was born in Ulm, Germany in 1879."
      Generated: "Einstein was born in Berlin, Germany in 1879."
    Cause: Model generates plausible-sounding text without faithfully
           following the source.
  Type 2: EXTRINSIC HALLUCINATION
    Definition: Output adds information not verifiable from the source.
    Example:
      Source:    "Einstein developed the theory of relativity."
      Generated: "Einstein developed the theory of relativity and won
                 the Nobel Prize in Physics in 1921 for this work."
    Note: The Nobel fact is TRUE but NOT IN the source — still "hallucinated"
          relative to the provided context.
  Additional categories:
    - Entity hallucination: Wrong names, dates, places
    - Relation hallucination: Correct entities, wrong relationship
    - Event hallucination: Events that didn't happen
    - Numeric hallucination: Wrong numbers, statistics
  Detection methods: N-gram overlap, NLI entailment, self-consistency,
                     factual verification with retrieval.""")

def ex40():
    """Hallucination detection: n-gram overlap with source"""
    def hallucination_score(output, source):
        out_tokens = output.lower().split()
        src_tokens = source.lower().split()
        src_set = set(src_tokens)
        # Unigram coverage
        covered = sum(1 for t in out_tokens if t in src_set)
        coverage = covered / len(out_tokens) if out_tokens else 0
        hallucination = 1 - coverage
        # Bigram coverage
        out_bigrams = [(out_tokens[i], out_tokens[i+1]) for i in range(len(out_tokens)-1)]
        src_bigrams = set((src_tokens[i], src_tokens[i+1]) for i in range(len(src_tokens)-1))
        bg_covered = sum(1 for b in out_bigrams if b in src_bigrams)
        bg_coverage = bg_covered / len(out_bigrams) if out_bigrams else 0
        return {
            "unigram_coverage": round(coverage, 4),
            "bigram_coverage": round(bg_coverage, 4),
            "hallucination_risk": round(hallucination, 4)
        }
    source = "Albert Einstein was born in Ulm Germany in 1879 and developed the theory of relativity."
    output_a = "Albert Einstein developed the theory of relativity and was born in Ulm Germany."
    output_b = "Einstein was a physicist who invented quantum mechanics and worked at Oxford University."
    r_a = hallucination_score(output_a, source)
    r_b = hallucination_score(output_b, source)
    print(f"Ex40 — Hallucination Detection: grounded={r_a}, hallucinated={r_b}")

def ex41():
    """Self-consistency check (3 outputs, find majority)"""
    def self_consistency_check(outputs, top_k=None):
        normalized = [o.strip().lower().rstrip('.') for o in outputs]
        counts = Counter(normalized)
        total = len(outputs)
        ranked = counts.most_common(top_k)
        majority_answer, majority_count = ranked[0]
        consistency_score = majority_count / total
        return {
            "majority_answer": majority_answer,
            "consistency_score": round(consistency_score, 4),
            "total_outputs": total,
            "unique_answers": len(counts),
            "distribution": {k: v for k, v in ranked}
        }
    outputs = [
        "The capital of France is Paris.",
        "Paris is the capital of France",
        "Lyon is the capital.",
        "Paris",
        "Paris is France's capital.",
        "Paris.",
        "Marseille"
    ]
    result = self_consistency_check(outputs)
    print(f"Ex41 — Self-Consistency: {result}")

def ex42():
    """Factual grounding scorer (TF-IDF overlap: output vs context)"""
    def tfidf_grounding_score(output, context, corpus=None):
        if corpus is None:
            corpus = [output, context]
        # Compute IDF
        all_tokens = [doc.lower().split() for doc in corpus]
        n = len(corpus)
        doc_freq = Counter()
        for doc in all_tokens:
            for token in set(doc):
                doc_freq[token] += 1
        idf = {t: math.log(n / (df + 1)) for t, df in doc_freq.items()}
        def tfidf_vector(tokens):
            tf = Counter(tokens)
            total = len(tokens)
            return {t: (c/total) * idf.get(t, 0) for t, c in tf.items()}
        out_vec = tfidf_vector(output.lower().split())
        ctx_vec = tfidf_vector(context.lower().split())
        # Cosine similarity
        common = set(out_vec) & set(ctx_vec)
        num = sum(out_vec[t] * ctx_vec[t] for t in common)
        denom = math.sqrt(sum(v**2 for v in out_vec.values())) * math.sqrt(sum(v**2 for v in ctx_vec.values()))
        return round(num / denom, 4) if denom > 0 else 0.0

    context = "Marie Curie was a physicist and chemist who conducted pioneering research on radioactivity."
    output_good = "Marie Curie researched radioactivity and was a famous physicist and chemist."
    output_bad  = "Marie Curie won the Nobel Prize in Literature and was a French philosopher."
    score_good = tfidf_grounding_score(output_good, context)
    score_bad  = tfidf_grounding_score(output_bad, context)
    print(f"Ex42 — TF-IDF Grounding: grounded={score_good}, hallucinated={score_bad}")

def ex43():
    """Citation extraction (regex: [1], [Smith 2024], etc.)"""
    import re
    def extract_citations(text):
        patterns = {
            "numeric":  r'\[(\d+)\]',
            "author_year": r'\[([A-Z][a-z]+(?:\s+et\s+al\.?)?\s*,?\s*\d{4})\]',
            "footnote": r'\((\d+)\)',
            "inline":   r'\(([A-Z][a-z]+(?:\s+et\s+al\.?)?,\s*\d{4})\)',
        }
        found = {}
        for style, pattern in patterns.items():
            matches = re.findall(pattern, text)
            if matches:
                found[style] = matches
        return found

    text = """
    Recent advances in NLP [1] have led to transformer models [Vaswani et al., 2017].
    These approaches [Brown et al., 2020] outperform prior methods [2][3].
    See also Smith (2023) and the related survey by Jones, 2024.
    """
    result = extract_citations(text)
    print(f"Ex43 — Citation Extraction: {result}")

def ex44():
    """RAG hallucination reduction (compare RAG vs no-RAG scores)"""
    def simulate_grounding_score(output, source=None):
        if source is None:
            return np.random.uniform(0.1, 0.4)  # no RAG → low grounding
        out_tokens = set(output.lower().split())
        src_tokens = set(source.lower().split())
        return len(out_tokens & src_tokens) / len(out_tokens) if out_tokens else 0.0

    np.random.seed(42)
    questions = [
        "What year was the Eiffel Tower built?",
        "What is the speed of light?",
        "Who wrote Pride and Prejudice?",
        "What is the capital of Japan?",
        "What is the boiling point of water?",
    ]
    sources = [
        "The Eiffel Tower was built in 1889 for the World's Fair in Paris.",
        "The speed of light in a vacuum is approximately 299,792 km/s.",
        "Pride and Prejudice was written by Jane Austen published in 1813.",
        "Tokyo is the capital and largest city of Japan.",
        "Water boils at 100 degrees Celsius at standard atmospheric pressure.",
    ]
    no_rag_outputs  = ["The Eiffel Tower was built in 1889.", "Light travels at 300000 km per second.",
                       "Jane Austen wrote it.", "The capital of Japan is Tokyo.", "Water boils at 100 Celsius."]
    rag_outputs     = [f"According to the source: {s}" for s in sources]

    no_rag_scores = [simulate_grounding_score(o, s) for o, s in zip(no_rag_outputs, sources)]
    rag_scores    = [simulate_grounding_score(o, s) for o, s in zip(rag_outputs, sources)]
    print(f"Ex44 — RAG vs No-RAG grounding: no_rag={np.mean(no_rag_scores):.4f}, rag={np.mean(rag_scores):.4f}")

def ex45():
    """Chain-of-verification concept (print)"""
    print("""Ex45 — Chain-of-Verification (CoVe):
  Paper: Dhuliawala et al. (2023) "Chain-of-Verification Reduces Hallucination"
  Core idea: Have the model verify its own claims through a structured
             chain of self-questioning.
  Steps:
    1. DRAFT RESPONSE
       Model generates initial answer (may contain hallucinations).
    2. PLAN VERIFICATION QUESTIONS
       Model generates targeted factual questions about its own response.
       Example: If response says "Einstein was born in 1879 in Munich",
       Questions: "Where was Einstein born?" "What year was Einstein born?"
    3. ANSWER VERIFICATION QUESTIONS (independently)
       Model answers each verification question INDEPENDENTLY,
       without seeing the original response (prevents anchoring).
    4. GENERATE FINAL VERIFIED RESPONSE
       Model revises original response using verification answers.
  Key insight: Models often correct themselves when verifying individual
               facts vs generating fluent text (different task framing).
  Results:
    - Reduces hallucinations in WikiData questions: 28% → 16%
    - Reduces hallucinations in list-based questions: up to 46%
  Variants: Self-RAG (retrieve + verify), RARR (revise + repair)""")

def ex46():
    """Uncertainty quantification (MC dropout concept, print)"""
    print("""Ex46 — Uncertainty Quantification for LLMs:
  Why: A model should "know what it doesn't know" to avoid hallucinating
       confidently on uncertain predictions.
  Method 1: Monte Carlo Dropout (Gal & Ghahramani, 2016)
    - Keep dropout ACTIVE at inference time
    - Run N forward passes (e.g., N=30) with different dropout masks
    - Compute predictive mean and variance:
        μ = (1/N) Σ f_θ_i(x)
        σ² = (1/N) Σ (f_θ_i(x) - μ)²
    - High σ² → high epistemic uncertainty → model is unsure
    - Limitation: Requires dropout layers; LLMs often don't use dropout
  Method 2: Temperature scaling (post-hoc calibration)
    - Scale logits: p = softmax(z / T)
    - Optimize T on validation set to minimize calibration error
    - Well-calibrated: P(correct | confidence=0.9) ≈ 0.90
  Method 3: Conformal prediction
    - Construct prediction sets with guaranteed coverage: P(y ∈ C(x)) ≥ 1-α
    - Model outputs a SET of answers instead of single answer
  Method 4: Verbalized uncertainty (chain-of-thought)
    - Prompt model to state its confidence
    - "I am 90% confident that..." — works surprisingly well with RLHF models
  Method 5: Self-consistency variance
    - Run N samples; high variance among answers → high uncertainty
    - Consistency score: max_answer_frequency / N""")

def ex47():
    """TruthfulQA format (print evaluation format)"""
    print("""Ex47 — TruthfulQA Evaluation Format:
  Paper: Lin et al. (2022) — 817 questions, 38 categories
  Categories: Health, Law, Finance, Politics, Conspiracies, Misconceptions,
              Myths, Superstitions, Advertising, Statistics, ...
  Question format (multiple choice + open-ended):
    Q: "Can you get addicted to caffeine?"
    A (correct): "Yes, regular caffeine use can cause physical dependence."
    A (best wrong): "No, caffeine is not addictive." (common misconception)
  Open-ended evaluation:
    Model generates free-form answer.
    Evaluated by:
      1. GPT-judge: "Is this answer truthful? Y/N"
      2. Human raters (gold standard)
  Scoring:
    - %Truthful:    Fraction of answers that are factually correct
    - %Informative: Fraction that provide useful information (not "I don't know")
    - %T&I:         Truthful AND Informative (primary metric)
  Notable findings:
    - Larger models are LESS truthful (memorize more confident falsehoods)
    - GPT-4 with RLHF: ~59% T&I — far below human ~94%
    - "I don't know" is truthful but not informative
  Use in practice:
    Run model on all 817 questions.
    Evaluate with provided GPT-4 judge prompt.
    Report %T&I score on leaderboard.""")

def ex48():
    """Hallucination in RAG vs fine-tuning comparison (print)"""
    print("""Ex48 — Hallucination: RAG vs Fine-Tuning Comparison:
  ┌────────────────────┬──────────────────────┬──────────────────────┐
  │ Dimension          │ RAG                  │ Fine-Tuning          │
  ├────────────────────┼──────────────────────┼──────────────────────┤
  │ Hallucination rate │ Lower (grounded)     │ Higher (from memory) │
  │ Knowledge cutoff   │ No cutoff (live DB)  │ Training cutoff date │
  │ Update cost        │ Low (update DB)      │ High (retrain model) │
  │ Source attribution │ Native (cite chunks) │ Difficult            │
  │ Factual precision  │ High (retrieval)     │ Medium (parametric)  │
  │ Instruction follow │ Standard             │ Better (task-specific│
  │ Latency            │ Higher (+retrieval)  │ Lower (no retrieval) │
  │ Hallucination type │ Context-mismatch     │ Parametric confab.   │
  └────────────────────┴──────────────────────┴──────────────────────┘
  RAG hallucination sources:
    1. Retrieval failure: Wrong chunks retrieved → wrong grounding
    2. Context overflow: Key facts buried → model ignores them
    3. Conflicting sources: Multiple chunks contradict each other
    4. Faithfulness: Model adds info beyond retrieved context
  Fine-tuning hallucination sources:
    1. Memorization of noisy training data
    2. Over-generalization of patterns
    3. Stale knowledge (post-cutoff events)
  Best practice: RAG + Fine-tuning hybrid:
    - Fine-tune for format/style/domain vocabulary
    - RAG for factual grounding on specific knowledge
    - Evaluate both components separately""")

def ex49():
    """Human feedback collection system design (print)"""
    print("""Ex49 — Human Feedback Collection System Design:
  Purpose: Collect high-quality signal for RLHF, evaluation, and monitoring.
  Architecture:
    1. FEEDBACK UI
       - Thumbs up / thumbs down (quick signal)
       - Multi-dimensional sliders (accuracy, helpfulness, safety, fluency)
       - Side-by-side comparison (pairwise preference)
       - Free-text comment box
    2. TASK ASSIGNMENT
       - Route tasks to qualified annotators (domain expertise matching)
       - Balanced assignment: each example rated by 3+ annotators
       - Avoid assigning same annotator same example repeatedly
    3. QUALITY CONTROL
       - Gold standard examples (known answer) injected randomly
       - Monitor inter-annotator agreement (Cohen's κ)
       - Flag outlier annotators (consistent disagree with majority)
       - Minimum time-per-task threshold (filter fast-clickers)
    4. DATA PIPELINE
       - Ingest → deduplicate → validate → anonymize → store
       - Version all annotation schemas
       - Link feedback to specific model version + prompt
    5. AGGREGATION
       - Majority vote for binary labels
       - Weighted average for scores (weight by annotator quality)
       - Keep raw disagreements (signal for ambiguous cases)
    6. CONTINUOUS IMPROVEMENT
       - Weekly calibration sessions with annotators
       - Update guidelines for edge cases
       - Track annotation drift over time
  Tools: Scale AI, Surge AI, LabelStudio (open source), Argilla""")

def ex50():
    """Production bias + hallucination monitoring system (print design)"""
    print("""Ex50 — Production Bias & Hallucination Monitoring System:
  ┌─────────────────────────────────────────────────────────┐
  │    PRODUCTION BIAS + HALLUCINATION MONITORING SYSTEM    │
  └─────────────────────────────────────────────────────────┘
  COMPONENT 1: DATA COLLECTION LAYER
    ├── Log all requests + responses (with user demographics if available)
    ├── Sample 1% for intensive analysis
    ├── Capture: model_id, timestamp, latency, token_count, user_id
    └── PII scrubbing before storage

  COMPONENT 2: AUTOMATED BIAS DETECTION
    ├── Daily: demographic parity diff on sampled outputs
    ├── Weekly: full fairness audit (SPD, EOD, DI, calibration)
    ├── Trigger: alert if |SPD| > 0.1 or |EOD| > 0.1
    └── Dashboard: real-time fairness metrics by demographic segment

  COMPONENT 3: HALLUCINATION DETECTION
    ├── Factual grounding score (n-gram overlap vs retrieved context)
    ├── Self-consistency check (3 samples, measure variance)
    ├── NLI entailment check (output supported by source?)
    └── Factual verification API (for high-stakes domains)

  COMPONENT 4: HUMAN REVIEW PIPELINE
    ├── Sample 100 outputs/day for human fairness review
    ├── Sample 50 outputs/day for hallucination annotation
    ├── Escalation: high-risk outputs (medical, legal, financial)
    └── Feedback loop: annotations → model fine-tuning queue

  COMPONENT 5: ALERTING + REPORTING
    ├── Real-time: Slack/PagerDuty for threshold breaches
    ├── Daily digest: automated metrics summary email
    ├── Weekly report: bias trends, hallucination rates, incidents
    └── Quarterly model audit: full evaluation + bias test suite

  COMPONENT 6: REMEDIATION PLAYBOOK
    ├── Bias detected → threshold adjustment → A/B test fix
    ├── Hallucination spike → retrieve context quality audit
    ├── Systematic bias → model retrain with debiasing
    └── Post-mortem for all severity-1 incidents within 48 hours""")


def main():
    print("=" * 60)
    print("Examples 6.4 - Bias Detection & Hallucination Mitigation")
    print("=" * 60)
    print("\n--- BASIC (1-13) ---")
    ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07()
    ex08(); ex09(); ex10(); ex11(); ex12(); ex13()
    print("\n--- INTERMEDIATE (14-26) ---")
    ex14(); ex15(); ex16(); ex17(); ex18(); ex19(); ex20()
    ex21(); ex22(); ex23(); ex24(); ex25(); ex26()
    print("\n--- NESTED (27-38) ---")
    ex27(); ex28(); ex29(); ex30(); ex31(); ex32(); ex33()
    ex34(); ex35(); ex36(); ex37(); ex38()
    print("\n--- ADVANCED (39-50) ---")
    ex39(); ex40(); ex41(); ex42(); ex43(); ex44(); ex45()
    ex46(); ex47(); ex48(); ex49(); ex50()

if __name__ == "__main__":
    main()
