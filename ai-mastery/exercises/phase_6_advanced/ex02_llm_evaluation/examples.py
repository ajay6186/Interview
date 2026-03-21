# ============================================================
# Examples 6.2 — LLM Evaluation Metrics (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import sys
import numpy as np
from collections import Counter
import math
import re

sys.stdout.reconfigure(encoding='utf-8')


# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Exact match check (normalize + compare)"""
    def exact_match(pred, ref):
        pred = pred.strip().lower()
        ref = ref.strip().lower()
        return pred == ref
    result = exact_match("Paris", "paris")
    print("Ex01 — Exact Match:", result)

def ex02():
    """Token overlap F1 (SQuAD-style)"""
    def token_f1(pred, ref):
        pred_tokens = pred.lower().split()
        ref_tokens = ref.lower().split()
        common = Counter(pred_tokens) & Counter(ref_tokens)
        num_same = sum(common.values())
        if num_same == 0:
            return 0.0
        precision = num_same / len(pred_tokens)
        recall = num_same / len(ref_tokens)
        return 2 * precision * recall / (precision + recall)
    result = token_f1("the cat sat on the mat", "the cat is on the mat")
    print(f"Ex02 — Token F1: {result:.4f}")

def ex03():
    """Unigram precision"""
    def unigram_precision(hyp, ref):
        hyp_tokens = hyp.lower().split()
        ref_tokens = set(ref.lower().split())
        matches = sum(1 for t in hyp_tokens if t in ref_tokens)
        return matches / len(hyp_tokens) if hyp_tokens else 0.0
    result = unigram_precision("the cat sat on the mat", "the cat is on the mat")
    print(f"Ex03 — Unigram Precision: {result:.4f}")

def ex04():
    """Unigram recall"""
    def unigram_recall(hyp, ref):
        hyp_tokens = set(hyp.lower().split())
        ref_tokens = ref.lower().split()
        matches = sum(1 for t in ref_tokens if t in hyp_tokens)
        return matches / len(ref_tokens) if ref_tokens else 0.0
    result = unigram_recall("the cat sat on the mat", "the cat is on the mat")
    print(f"Ex04 — Unigram Recall: {result:.4f}")

def ex05():
    """Bigram precision"""
    def get_bigrams(tokens):
        return [(tokens[i], tokens[i+1]) for i in range(len(tokens)-1)]
    def bigram_precision(hyp, ref):
        hyp_tokens = hyp.lower().split()
        ref_tokens = ref.lower().split()
        hyp_bigrams = Counter(get_bigrams(hyp_tokens))
        ref_bigrams = Counter(get_bigrams(ref_tokens))
        common = hyp_bigrams & ref_bigrams
        num_same = sum(common.values())
        total_hyp = sum(hyp_bigrams.values())
        return num_same / total_hyp if total_hyp > 0 else 0.0
    result = bigram_precision("the cat sat on the mat", "the cat is on the mat")
    print(f"Ex05 — Bigram Precision: {result:.4f}")

def ex06():
    """Brevity penalty (BP) for BLEU"""
    def brevity_penalty(hyp_len, ref_len):
        if hyp_len >= ref_len:
            return 1.0
        return math.exp(1 - ref_len / hyp_len)
    bp = brevity_penalty(5, 6)
    print(f"Ex06 — Brevity Penalty (hyp=5, ref=6): {bp:.4f}")

def ex07():
    """BLEU-1 score"""
    def bleu1(hyp, ref):
        hyp_tokens = hyp.lower().split()
        ref_tokens = ref.lower().split()
        ref_counter = Counter(ref_tokens)
        matches = 0
        hyp_counter = Counter(hyp_tokens)
        for token, count in hyp_counter.items():
            matches += min(count, ref_counter.get(token, 0))
        precision = matches / len(hyp_tokens) if hyp_tokens else 0.0
        bp = math.exp(1 - len(ref_tokens) / len(hyp_tokens)) if len(hyp_tokens) < len(ref_tokens) else 1.0
        return bp * precision
    result = bleu1("the cat sat on the mat", "the cat is on the mat")
    print(f"Ex07 — BLEU-1: {result:.4f}")

def ex08():
    """BLEU-2 score"""
    def get_ngrams(tokens, n):
        return [tuple(tokens[i:i+n]) for i in range(len(tokens)-n+1)]
    def bleu2(hyp, ref):
        hyp_tokens = hyp.lower().split()
        ref_tokens = ref.lower().split()
        scores = []
        for n in [1, 2]:
            hyp_ng = Counter(get_ngrams(hyp_tokens, n))
            ref_ng = Counter(get_ngrams(ref_tokens, n))
            common = sum((hyp_ng & ref_ng).values())
            total = sum(hyp_ng.values())
            scores.append(common / total if total > 0 else 0.0)
        bp = math.exp(1 - len(ref_tokens) / len(hyp_tokens)) if len(hyp_tokens) < len(ref_tokens) else 1.0
        log_avg = sum(math.log(s) for s in scores if s > 0) / 2
        return bp * math.exp(log_avg)
    result = bleu2("the cat sat on the mat", "the cat is on the mat")
    print(f"Ex08 — BLEU-2: {result:.4f}")

def ex09():
    """BLEU-4 score (full, with BP)"""
    def get_ngrams(tokens, n):
        return [tuple(tokens[i:i+n]) for i in range(len(tokens)-n+1)]
    def bleu4(hyp, ref):
        hyp_tokens = hyp.lower().split()
        ref_tokens = ref.lower().split()
        scores = []
        for n in [1, 2, 3, 4]:
            hyp_ng = Counter(get_ngrams(hyp_tokens, n))
            ref_ng = Counter(get_ngrams(ref_tokens, n))
            common = sum((hyp_ng & ref_ng).values())
            total = sum(hyp_ng.values())
            scores.append(common / total if total > 0 else 0.0)
        bp = math.exp(1 - len(ref_tokens) / len(hyp_tokens)) if len(hyp_tokens) < len(ref_tokens) else 1.0
        valid = [s for s in scores if s > 0]
        if not valid:
            return 0.0
        log_avg = sum(math.log(s) for s in valid) / 4
        return bp * math.exp(log_avg)
    result = bleu4("the cat sat on the mat", "the cat is on the mat")
    print(f"Ex09 — BLEU-4: {result:.4f}")

def ex10():
    """ROUGE-1 (F1)"""
    def rouge1(hyp, ref):
        hyp_tokens = hyp.lower().split()
        ref_tokens = ref.lower().split()
        common = Counter(hyp_tokens) & Counter(ref_tokens)
        num_same = sum(common.values())
        if num_same == 0:
            return 0.0
        p = num_same / len(hyp_tokens)
        r = num_same / len(ref_tokens)
        return 2 * p * r / (p + r)
    result = rouge1("the cat sat on the mat", "the cat is on the mat")
    print(f"Ex10 — ROUGE-1 F1: {result:.4f}")

def ex11():
    """ROUGE-2 (F1)"""
    def get_bigrams(tokens):
        return [tuple(tokens[i:i+2]) for i in range(len(tokens)-1)]
    def rouge2(hyp, ref):
        hyp_bg = Counter(get_bigrams(hyp.lower().split()))
        ref_bg = Counter(get_bigrams(ref.lower().split()))
        common = hyp_bg & ref_bg
        num_same = sum(common.values())
        if num_same == 0:
            return 0.0
        p = num_same / sum(hyp_bg.values())
        r = num_same / sum(ref_bg.values())
        return 2 * p * r / (p + r)
    result = rouge2("the cat sat on the mat", "the cat is on the mat")
    print(f"Ex11 — ROUGE-2 F1: {result:.4f}")

def ex12():
    """LCS length (dynamic programming)"""
    def lcs_length(a, b):
        a_tokens = a.lower().split()
        b_tokens = b.lower().split()
        m, n = len(a_tokens), len(b_tokens)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if a_tokens[i-1] == b_tokens[j-1]:
                    dp[i][j] = dp[i-1][j-1] + 1
                else:
                    dp[i][j] = max(dp[i-1][j], dp[i][j-1])
        return dp[m][n]
    result = lcs_length("the cat sat on the mat", "the cat is on the mat")
    print(f"Ex12 — LCS Length: {result}")

def ex13():
    """ROUGE-L (F1 using LCS)"""
    def lcs_length(a_tokens, b_tokens):
        m, n = len(a_tokens), len(b_tokens)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if a_tokens[i-1] == b_tokens[j-1]:
                    dp[i][j] = dp[i-1][j-1] + 1
                else:
                    dp[i][j] = max(dp[i-1][j], dp[i][j-1])
        return dp[m][n]
    def rouge_l(hyp, ref):
        h = hyp.lower().split()
        r = ref.lower().split()
        lcs = lcs_length(h, r)
        if lcs == 0:
            return 0.0
        p = lcs / len(h)
        rec = lcs / len(r)
        return 2 * p * rec / (p + rec)
    result = rouge_l("the cat sat on the mat", "the cat is on the mat")
    print(f"Ex13 — ROUGE-L F1: {result:.4f}")


# ─── INTERMEDIATE (14–26) ────────────────────────────────────

def ex14():
    """Modified n-gram precision (BLEU clipping)"""
    def get_ngrams(tokens, n):
        return [tuple(tokens[i:i+n]) for i in range(len(tokens)-n+1)]
    def modified_ngram_precision(hyp, ref, n):
        hyp_tokens = hyp.lower().split()
        ref_tokens = ref.lower().split()
        hyp_ng = Counter(get_ngrams(hyp_tokens, n))
        ref_ng = Counter(get_ngrams(ref_tokens, n))
        clipped = {ng: min(cnt, ref_ng.get(ng, 0)) for ng, cnt in hyp_ng.items()}
        numerator = sum(clipped.values())
        denominator = sum(hyp_ng.values())
        return numerator / denominator if denominator > 0 else 0.0
    # Repeated hypothesis: "the the the the the"
    result = modified_ngram_precision("the the the the the", "the cat sat on the mat", 1)
    print(f"Ex14 — Modified Unigram Precision (clipped): {result:.4f}")

def ex15():
    """Smoothed BLEU (add-1 to prevent zero n-gram)"""
    def get_ngrams(tokens, n):
        return [tuple(tokens[i:i+n]) for i in range(len(tokens)-n+1)]
    def smoothed_bleu(hyp, ref, max_n=4):
        hyp_tokens = hyp.lower().split()
        ref_tokens = ref.lower().split()
        scores = []
        for n in range(1, max_n + 1):
            hyp_ng = Counter(get_ngrams(hyp_tokens, n))
            ref_ng = Counter(get_ngrams(ref_tokens, n))
            clipped = {ng: min(cnt, ref_ng.get(ng, 0)) for ng, cnt in hyp_ng.items()}
            num = sum(clipped.values()) + 1
            den = sum(hyp_ng.values()) + 1
            scores.append(math.log(num / den))
        bp = math.exp(1 - len(ref_tokens) / len(hyp_tokens)) if len(hyp_tokens) < len(ref_tokens) else 1.0
        return bp * math.exp(sum(scores) / max_n)
    result = smoothed_bleu("the cat sat on mat", "the cat is on the mat")
    print(f"Ex15 — Smoothed BLEU-4: {result:.4f}")

def ex16():
    """Corpus-level BLEU (multiple sentence pairs)"""
    def get_ngrams(tokens, n):
        return [tuple(tokens[i:i+n]) for i in range(len(tokens)-n+1)]
    def corpus_bleu(hypotheses, references, max_n=4):
        total_hyp_len = 0
        total_ref_len = 0
        counts = [0] * max_n
        totals = [0] * max_n
        for hyp, ref in zip(hypotheses, references):
            h_tok = hyp.lower().split()
            r_tok = ref.lower().split()
            total_hyp_len += len(h_tok)
            total_ref_len += len(r_tok)
            for n in range(1, max_n + 1):
                h_ng = Counter(get_ngrams(h_tok, n))
                r_ng = Counter(get_ngrams(r_tok, n))
                clipped = {ng: min(c, r_ng.get(ng, 0)) for ng, c in h_ng.items()}
                counts[n-1] += sum(clipped.values())
                totals[n-1] += sum(h_ng.values())
        bp = math.exp(1 - total_ref_len / total_hyp_len) if total_hyp_len < total_ref_len else 1.0
        precisions = [(counts[i] + 1) / (totals[i] + 1) for i in range(max_n)]
        log_avg = sum(math.log(p) for p in precisions) / max_n
        return bp * math.exp(log_avg)
    hyps = ["the cat sat on the mat", "a dog runs fast"]
    refs = ["the cat is on the mat", "the dog ran quickly"]
    result = corpus_bleu(hyps, refs)
    print(f"Ex16 — Corpus BLEU-4: {result:.4f}")

def ex17():
    """ROUGE-Lsum (paragraph-level)"""
    def lcs_length(a, b):
        dp = [[0]*(len(b)+1) for _ in range(len(a)+1)]
        for i in range(1, len(a)+1):
            for j in range(1, len(b)+1):
                if a[i-1] == b[j-1]:
                    dp[i][j] = dp[i-1][j-1] + 1
                else:
                    dp[i][j] = max(dp[i-1][j], dp[i][j-1])
        return dp[len(a)][len(b)]
    def rouge_lsum(hyp_para, ref_para):
        hyp_sents = hyp_para.split('.')
        ref_tokens = ref_para.lower().split()
        hyp_tokens = hyp_para.lower().split()
        lcs = lcs_length(hyp_tokens, ref_tokens)
        p = lcs / len(hyp_tokens) if hyp_tokens else 0
        r = lcs / len(ref_tokens) if ref_tokens else 0
        return 2 * p * r / (p + r) if (p + r) > 0 else 0.0
    hyp = "The cat sat. It was on the mat. The day was sunny."
    ref = "The cat is on the mat. It was a sunny day."
    result = rouge_lsum(hyp, ref)
    print(f"Ex17 — ROUGE-Lsum: {result:.4f}")

def ex18():
    """WER (word error rate)"""
    def wer(hyp, ref):
        h = hyp.lower().split()
        r = ref.lower().split()
        d = np.zeros((len(r)+1, len(h)+1), dtype=int)
        for i in range(len(r)+1): d[i][0] = i
        for j in range(len(h)+1): d[0][j] = j
        for i in range(1, len(r)+1):
            for j in range(1, len(h)+1):
                if r[i-1] == h[j-1]:
                    d[i][j] = d[i-1][j-1]
                else:
                    d[i][j] = 1 + min(d[i-1][j], d[i][j-1], d[i-1][j-1])
        return d[len(r)][len(h)] / len(r)
    result = wer("the cat sat on the mat", "the cat is on the mat")
    print(f"Ex18 — WER: {result:.4f}")

def ex19():
    """CER (character error rate)"""
    def cer(hyp, ref):
        h = list(hyp.lower())
        r = list(ref.lower())
        d = np.zeros((len(r)+1, len(h)+1), dtype=int)
        for i in range(len(r)+1): d[i][0] = i
        for j in range(len(h)+1): d[0][j] = j
        for i in range(1, len(r)+1):
            for j in range(1, len(h)+1):
                if r[i-1] == h[j-1]:
                    d[i][j] = d[i-1][j-1]
                else:
                    d[i][j] = 1 + min(d[i-1][j], d[i][j-1], d[i-1][j-1])
        return d[len(r)][len(h)] / len(r)
    result = cer("the cat sat on the mat", "the cat is on the mat")
    print(f"Ex19 — CER: {result:.4f}")

def ex20():
    """Perplexity from log-probs (simulate with numpy)"""
    def perplexity(log_probs):
        avg_log_prob = np.mean(log_probs)
        return np.exp(-avg_log_prob)
    np.random.seed(42)
    # Simulate token log-probs (log of probabilities between 0 and 1)
    log_probs = np.random.uniform(-3.0, -0.5, size=20)
    result = perplexity(log_probs)
    print(f"Ex20 — Perplexity (simulated): {result:.4f}")

def ex21():
    """Pass@k for code (probability at least 1 of k passes)"""
    def pass_at_k(n, c, k):
        """n = total samples, c = correct samples, k = samples to pick"""
        if n - c < k:
            return 1.0
        return 1.0 - math.comb(n - c, k) / math.comb(n, k)
    # 10 samples, 3 correct, pick k=5
    result = pass_at_k(10, 3, 5)
    print(f"Ex21 — Pass@5 (n=10, c=3): {result:.4f}")

def ex22():
    """QA F1 for multi-answer (max over answers)"""
    def token_f1(pred, ref):
        p_tok = Counter(pred.lower().split())
        r_tok = Counter(ref.lower().split())
        common = p_tok & r_tok
        n = sum(common.values())
        if n == 0: return 0.0
        p = n / sum(p_tok.values())
        r = n / sum(r_tok.values())
        return 2 * p * r / (p + r)
    def multi_answer_f1(pred, answers):
        return max(token_f1(pred, ans) for ans in answers)
    pred = "Paris is the capital"
    answers = ["Paris", "Paris France", "The capital is Paris"]
    result = multi_answer_f1(pred, answers)
    print(f"Ex22 — Multi-Answer QA F1: {result:.4f}")

def ex23():
    """Factual overlap score (count shared named entities — regex)"""
    def extract_entities(text):
        # Simple heuristic: capitalized words not at sentence start
        tokens = text.split()
        entities = set()
        for i, tok in enumerate(tokens):
            clean = re.sub(r'[^\w]', '', tok)
            if i > 0 and clean and clean[0].isupper():
                entities.add(clean.lower())
        return entities
    def factual_overlap(pred, ref):
        pred_ents = extract_entities(pred)
        ref_ents = extract_entities(ref)
        if not ref_ents:
            return 0.0
        return len(pred_ents & ref_ents) / len(ref_ents)
    pred = "Barack Obama was born in Hawaii and served as President."
    ref = "Obama was the 44th President, born in Hawaii."
    result = factual_overlap(pred, ref)
    print(f"Ex23 — Factual Entity Overlap: {result:.4f}")

def ex24():
    """Self-consistency score (most common answer from N outputs)"""
    def self_consistency(outputs):
        counts = Counter(o.strip().lower() for o in outputs)
        most_common, freq = counts.most_common(1)[0]
        score = freq / len(outputs)
        return most_common, score
    outputs = ["Paris", "Paris", "Lyon", "Paris", "Marseille", "Paris", "Paris"]
    answer, score = self_consistency(outputs)
    print(f"Ex24 — Self-Consistency: answer='{answer}', score={score:.4f}")

def ex25():
    """Coverage score (how much of reference is covered)"""
    def coverage_score(pred, ref):
        pred_tokens = set(pred.lower().split())
        ref_tokens = ref.lower().split()
        covered = sum(1 for t in ref_tokens if t in pred_tokens)
        return covered / len(ref_tokens) if ref_tokens else 0.0
    pred = "The quick brown fox jumped over the lazy dog"
    ref = "The fox jumped over the dog in the field"
    result = coverage_score(pred, ref)
    print(f"Ex25 — Coverage Score: {result:.4f}")

def ex26():
    """Fluency proxy (avg word length, sentence length)"""
    def fluency_proxy(text):
        sentences = [s.strip() for s in text.split('.') if s.strip()]
        words = text.split()
        avg_word_len = np.mean([len(w) for w in words]) if words else 0
        avg_sent_len = np.mean([len(s.split()) for s in sentences]) if sentences else 0
        # Ideal avg word len ~5, avg sent len ~15-20
        word_score = 1.0 - abs(avg_word_len - 5) / 5
        sent_score = 1.0 - abs(avg_sent_len - 17) / 17
        return max(0, word_score), max(0, sent_score)
    text = "The model generates coherent text. It uses attention mechanisms effectively. Results are promising."
    ws, ss = fluency_proxy(text)
    print(f"Ex26 — Fluency Proxy: word_score={ws:.4f}, sent_score={ss:.4f}")


# ─── NESTED (27–38) ──────────────────────────────────────────

def ex27():
    """BLEUScorer class (sentence + corpus level)"""
    class BLEUScorer:
        def __init__(self, max_n=4):
            self.max_n = max_n

        def _get_ngrams(self, tokens, n):
            return [tuple(tokens[i:i+n]) for i in range(len(tokens)-n+1)]

        def _modified_precision(self, hyp_tokens, ref_tokens, n):
            hyp_ng = Counter(self._get_ngrams(hyp_tokens, n))
            ref_ng = Counter(self._get_ngrams(ref_tokens, n))
            clipped = {ng: min(c, ref_ng.get(ng, 0)) for ng, c in hyp_ng.items()}
            num = sum(clipped.values()) + 1
            den = sum(hyp_ng.values()) + 1
            return num / den

        def sentence_bleu(self, hyp, ref):
            h = hyp.lower().split()
            r = ref.lower().split()
            bp = math.exp(1 - len(r) / len(h)) if len(h) < len(r) else 1.0
            log_avg = sum(math.log(self._modified_precision(h, r, n)) for n in range(1, self.max_n+1)) / self.max_n
            return bp * math.exp(log_avg)

        def corpus_bleu(self, hypotheses, references):
            scores = [self.sentence_bleu(h, r) for h, r in zip(hypotheses, references)]
            return np.mean(scores)

    scorer = BLEUScorer()
    s = scorer.sentence_bleu("the cat sat on the mat", "the cat is on the mat")
    c = scorer.corpus_bleu(["the cat sat", "a dog runs"], ["the cat walked", "the dog ran"])
    print(f"Ex27 — BLEUScorer: sentence={s:.4f}, corpus={c:.4f}")

def ex28():
    """ROUGEScorer class (ROUGE-1, ROUGE-2, ROUGE-L)"""
    class ROUGEScorer:
        def _f1(self, p_count, r_count, total_p, total_r):
            if p_count == 0: return 0.0
            p = p_count / total_p
            r = r_count / total_r
            return 2 * p * r / (p + r)

        def rouge1(self, hyp, ref):
            h, r = Counter(hyp.lower().split()), Counter(ref.lower().split())
            common = sum((h & r).values())
            return self._f1(common, common, sum(h.values()), sum(r.values()))

        def rouge2(self, hyp, ref):
            def bigrams(t): return Counter([tuple(t[i:i+2]) for i in range(len(t)-1)])
            h, r = bigrams(hyp.lower().split()), bigrams(ref.lower().split())
            common = sum((h & r).values())
            return self._f1(common, common, sum(h.values()) or 1, sum(r.values()) or 1)

        def rouge_l(self, hyp, ref):
            h, r = hyp.lower().split(), ref.lower().split()
            dp = [[0]*(len(r)+1) for _ in range(len(h)+1)]
            for i in range(1, len(h)+1):
                for j in range(1, len(r)+1):
                    dp[i][j] = dp[i-1][j-1]+1 if h[i-1]==r[j-1] else max(dp[i-1][j], dp[i][j-1])
            lcs = dp[len(h)][len(r)]
            return self._f1(lcs, lcs, len(h), len(r))

    scorer = ROUGEScorer()
    hyp = "the cat sat on the mat"
    ref = "the cat is on the mat"
    r1 = scorer.rouge1(hyp, ref)
    r2 = scorer.rouge2(hyp, ref)
    rl = scorer.rouge_l(hyp, ref)
    print(f"Ex28 — ROUGEScorer: R1={r1:.4f}, R2={r2:.4f}, RL={rl:.4f}")

def ex29():
    """EvaluationHarness class (run multiple metrics at once)"""
    class EvaluationHarness:
        def __init__(self):
            self.metrics = {}

        def add_metric(self, name, fn):
            self.metrics[name] = fn

        def evaluate(self, predictions, references):
            results = {}
            for name, fn in self.metrics.items():
                scores = [fn(p, r) for p, r in zip(predictions, references)]
                results[name] = round(float(np.mean(scores)), 4)
            return results

    def em(p, r): return float(p.strip().lower() == r.strip().lower())
    def f1(p, r):
        pc, rc = Counter(p.lower().split()), Counter(r.lower().split())
        n = sum((pc & rc).values())
        if n == 0: return 0.0
        prec = n / sum(pc.values()); rec = n / sum(rc.values())
        return 2*prec*rec/(prec+rec)

    harness = EvaluationHarness()
    harness.add_metric("exact_match", em)
    harness.add_metric("token_f1", f1)
    preds = ["Paris", "the cat sat on the mat"]
    refs = ["Paris", "the cat is on the mat"]
    results = harness.evaluate(preds, refs)
    print(f"Ex29 — EvaluationHarness: {results}")

def ex30():
    """BenchmarkRunner class (MMLU-format: question → options → answer)"""
    class BenchmarkRunner:
        def __init__(self, questions):
            # questions: list of {q, options, answer, prediction}
            self.questions = questions

        def run(self):
            correct = sum(1 for q in self.questions if q['prediction'] == q['answer'])
            return {
                "total": len(self.questions),
                "correct": correct,
                "accuracy": round(correct / len(self.questions), 4)
            }

        def by_category(self):
            cats = {}
            for q in self.questions:
                cat = q.get('category', 'general')
                cats.setdefault(cat, []).append(q['prediction'] == q['answer'])
            return {cat: round(np.mean(v), 4) for cat, v in cats.items()}

    questions = [
        {"q": "Capital of France?", "options": ["A","B","C","D"], "answer": "A", "prediction": "A", "category": "geography"},
        {"q": "2+2=?", "options": ["3","4","5","6"], "answer": "B", "prediction": "B", "category": "math"},
        {"q": "Speed of light?", "options": ["A","B","C","D"], "answer": "C", "prediction": "A", "category": "science"},
    ]
    runner = BenchmarkRunner(questions)
    result = runner.run()
    by_cat = runner.by_category()
    print(f"Ex30 — BenchmarkRunner: {result}, by_cat={by_cat}")

def ex31():
    """HumanEvalFormat class (code problem → test cases)"""
    class HumanEvalFormat:
        def __init__(self, task_id, prompt, canonical_solution, test_cases):
            self.task_id = task_id
            self.prompt = prompt
            self.canonical_solution = canonical_solution
            self.test_cases = test_cases

        def evaluate(self, solution_fn):
            passed = 0
            for inputs, expected in self.test_cases:
                try:
                    result = solution_fn(*inputs)
                    if result == expected:
                        passed += 1
                except Exception:
                    pass
            return {"task_id": self.task_id, "passed": passed,
                    "total": len(self.test_cases),
                    "pass_rate": round(passed / len(self.test_cases), 4)}

    def add(a, b): return a + b
    problem = HumanEvalFormat(
        task_id="HE/001",
        prompt="def add(a, b): ...",
        canonical_solution="return a + b",
        test_cases=[((1, 2), 3), ((0, 0), 0), ((5, 7), 12), ((-1, 1), 0)]
    )
    result = problem.evaluate(add)
    print(f"Ex31 — HumanEvalFormat: {result}")

def ex32():
    """BootstrapCI class (bootstrap confidence interval for BLEU)"""
    class BootstrapCI:
        def __init__(self, n_bootstrap=500, confidence=0.95, seed=42):
            self.n_bootstrap = n_bootstrap
            self.confidence = confidence
            self.rng = np.random.default_rng(seed)

        def compute(self, scores):
            scores = np.array(scores)
            boot_means = []
            for _ in range(self.n_bootstrap):
                sample = self.rng.choice(scores, size=len(scores), replace=True)
                boot_means.append(np.mean(sample))
            alpha = (1 - self.confidence) / 2
            lower = np.percentile(boot_means, alpha * 100)
            upper = np.percentile(boot_means, (1 - alpha) * 100)
            return {"mean": round(float(np.mean(scores)), 4),
                    "ci_lower": round(float(lower), 4),
                    "ci_upper": round(float(upper), 4)}

    np.random.seed(42)
    bleu_scores = np.random.uniform(0.2, 0.5, size=30).tolist()
    ci = BootstrapCI()
    result = ci.compute(bleu_scores)
    print(f"Ex32 — BootstrapCI: {result}")

def ex33():
    """ModelComparison class (compare 2 models on N examples)"""
    class ModelComparison:
        def __init__(self, metric_fn):
            self.metric_fn = metric_fn

        def compare(self, model_a_preds, model_b_preds, references):
            scores_a = [self.metric_fn(p, r) for p, r in zip(model_a_preds, references)]
            scores_b = [self.metric_fn(p, r) for p, r in zip(model_b_preds, references)]
            return {
                "model_a_mean": round(float(np.mean(scores_a)), 4),
                "model_b_mean": round(float(np.mean(scores_b)), 4),
                "a_wins": int(sum(a > b for a, b in zip(scores_a, scores_b))),
                "b_wins": int(sum(b > a for a, b in zip(scores_a, scores_b))),
                "ties": int(sum(a == b for a, b in zip(scores_a, scores_b)))
            }

    def token_f1(p, r):
        pc = Counter(p.lower().split()); rc = Counter(r.lower().split())
        n = sum((pc & rc).values())
        if n == 0: return 0.0
        return 2*(n/sum(pc.values()))*(n/sum(rc.values())) / (n/sum(pc.values()) + n/sum(rc.values()))

    refs = ["the cat is on the mat", "the dog ran fast", "sky is blue"]
    preds_a = ["cat is on mat", "dog ran fast", "sky blue"]
    preds_b = ["the cat is on the mat", "a dog ran quickly", "the sky is blue today"]
    comp = ModelComparison(token_f1)
    result = comp.compare(preds_a, preds_b, refs)
    print(f"Ex33 — ModelComparison: {result}")

def ex34():
    """StatisticalSignificanceTester class (paired t-test on scores)"""
    class StatisticalSignificanceTester:
        def paired_ttest(self, scores_a, scores_b):
            a = np.array(scores_a)
            b = np.array(scores_b)
            diff = a - b
            n = len(diff)
            mean_diff = np.mean(diff)
            std_diff = np.std(diff, ddof=1)
            t_stat = mean_diff / (std_diff / math.sqrt(n))
            # Two-tailed p-value approximation
            df = n - 1
            # Simplified p-value using normal approx for large df
            p_approx = 2 * (1 - min(0.9999, abs(t_stat) / (abs(t_stat) + math.sqrt(df))))
            return {"t_stat": round(t_stat, 4), "p_value_approx": round(p_approx, 4),
                    "significant_at_05": p_approx < 0.05}

    np.random.seed(42)
    scores_a = np.random.normal(0.5, 0.1, 30).tolist()
    scores_b = np.random.normal(0.45, 0.1, 30).tolist()
    tester = StatisticalSignificanceTester()
    result = tester.paired_ttest(scores_a, scores_b)
    print(f"Ex34 — StatisticalSignificanceTester: {result}")

def ex35():
    """MultiReferenceEvaluator class (max score over references)"""
    class MultiReferenceEvaluator:
        def __init__(self, metric_fn):
            self.metric_fn = metric_fn

        def evaluate(self, prediction, references):
            scores = [self.metric_fn(prediction, ref) for ref in references]
            return {"max": round(max(scores), 4),
                    "mean": round(float(np.mean(scores)), 4),
                    "scores": [round(s, 4) for s in scores]}

    def rouge1(p, r):
        pc, rc = Counter(p.lower().split()), Counter(r.lower().split())
        n = sum((pc & rc).values())
        if n == 0: return 0.0
        prec = n / sum(pc.values()); rec = n / sum(rc.values())
        return 2*prec*rec/(prec+rec)

    evaluator = MultiReferenceEvaluator(rouge1)
    pred = "the cat sat on the mat"
    refs = ["the cat is on the mat", "a cat was sitting on a mat", "the feline sat on the rug"]
    result = evaluator.evaluate(pred, refs)
    print(f"Ex35 — MultiReferenceEvaluator: {result}")

def ex36():
    """CalibrationEvaluator class (ECE for LLM confidence)"""
    class CalibrationEvaluator:
        def __init__(self, n_bins=10):
            self.n_bins = n_bins

        def ece(self, confidences, correct):
            confidences = np.array(confidences)
            correct = np.array(correct)
            bins = np.linspace(0, 1, self.n_bins + 1)
            ece_val = 0.0
            n = len(confidences)
            for i in range(self.n_bins):
                mask = (confidences >= bins[i]) & (confidences < bins[i+1])
                if mask.sum() == 0: continue
                bin_conf = confidences[mask].mean()
                bin_acc = correct[mask].mean()
                ece_val += (mask.sum() / n) * abs(bin_conf - bin_acc)
            return round(float(ece_val), 4)

    np.random.seed(42)
    confidences = np.random.uniform(0.5, 1.0, 100)
    # Correct with probability ~ confidence (well-calibrated)
    correct = (np.random.uniform(0, 1, 100) < confidences).astype(int)
    evaluator = CalibrationEvaluator()
    ece = evaluator.ece(confidences, correct)
    print(f"Ex36 — CalibrationEvaluator ECE: {ece}")

def ex37():
    """HallucinationDetector class (source overlap + length ratio)"""
    class HallucinationDetector:
        def __init__(self, overlap_threshold=0.3, length_ratio_max=3.0):
            self.overlap_threshold = overlap_threshold
            self.length_ratio_max = length_ratio_max

        def score(self, output, source):
            out_tokens = set(output.lower().split())
            src_tokens = set(source.lower().split())
            overlap = len(out_tokens & src_tokens) / len(out_tokens) if out_tokens else 0
            length_ratio = len(output.split()) / max(len(source.split()), 1)
            hallucination_risk = (1 - overlap) * min(length_ratio / self.length_ratio_max, 1)
            return {"overlap": round(overlap, 4),
                    "length_ratio": round(length_ratio, 4),
                    "hallucination_risk": round(hallucination_risk, 4)}

    source = "The Eiffel Tower is located in Paris, France. It was built in 1889."
    output = "The Eiffel Tower stands in Paris and was constructed for the 1889 World's Fair. It is 330 meters tall and made of iron."
    detector = HallucinationDetector()
    result = detector.score(output, source)
    print(f"Ex37 — HallucinationDetector: {result}")

def ex38():
    """FullEvaluationReport class (all metrics + summary)"""
    class FullEvaluationReport:
        def __init__(self, hypotheses, references):
            self.hyps = hypotheses
            self.refs = references

        def _token_f1(self, p, r):
            pc, rc = Counter(p.lower().split()), Counter(r.lower().split())
            n = sum((pc & rc).values())
            if n == 0: return 0.0
            prec = n / sum(pc.values()); rec = n / sum(rc.values())
            return 2*prec*rec/(prec+rec)

        def _em(self, p, r): return float(p.strip().lower() == r.strip().lower())

        def _wer(self, p, r):
            h, ref = p.lower().split(), r.lower().split()
            d = np.zeros((len(ref)+1, len(h)+1), dtype=int)
            for i in range(len(ref)+1): d[i][0] = i
            for j in range(len(h)+1): d[0][j] = j
            for i in range(1, len(ref)+1):
                for j in range(1, len(h)+1):
                    d[i][j] = d[i-1][j-1] if ref[i-1]==h[j-1] else 1+min(d[i-1][j], d[i][j-1], d[i-1][j-1])
            return d[len(ref)][len(h)] / max(len(ref), 1)

        def generate(self):
            pairs = list(zip(self.hyps, self.refs))
            return {
                "exact_match": round(float(np.mean([self._em(p,r) for p,r in pairs])), 4),
                "token_f1":    round(float(np.mean([self._token_f1(p,r) for p,r in pairs])), 4),
                "avg_wer":     round(float(np.mean([self._wer(p,r) for p,r in pairs])), 4),
                "n_samples":   len(pairs)
            }

    hyps = ["Paris is the capital", "the cat sat on mat", "dogs are mammals"]
    refs = ["Paris is the capital of France", "the cat is on the mat", "dogs are warm-blooded mammals"]
    report = FullEvaluationReport(hyps, refs)
    print(f"Ex38 — FullEvaluationReport: {report.generate()}")


# ─── ADVANCED (39–50) ────────────────────────────────────────

def ex39():
    """G-eval concept (LLM-as-judge rubric, print format)"""
    print("""Ex39 — G-Eval (LLM-as-Judge):
  Framework: Use a strong LLM (e.g., GPT-4) to evaluate outputs on rubrics.
  Dimensions:
    1. Coherence   (1-5): Is the text logically structured?
    2. Consistency (1-5): Does output match the source faithfully?
    3. Fluency     (1-5): Is the language natural and grammatical?
    4. Relevance   (1-5): Does output address the prompt?
  Protocol:
    - Provide: rubric + criteria definitions + few-shot examples
    - LLM outputs score + chain-of-thought reasoning
    - Average over 3-5 LLM calls to reduce variance
  Advantage: Correlates highly with human judgment (r > 0.9 on SummEval)
  Limitation: Expensive; LLM biases (length, verbosity) propagate to scores.""")

def ex40():
    """MT-Bench format (multi-turn evaluation, print format)"""
    print("""Ex40 — MT-Bench (Multi-Turn Evaluation):
  Purpose: Evaluate LLMs on challenging multi-turn conversations.
  Structure:
    - 80 questions in 8 categories: writing, roleplay, extraction,
      reasoning, math, coding, knowledge-STEM, knowledge-humanities
    - 2 turns per question (follow-up tests instruction following)
  Scoring: GPT-4 as judge, score 1-10 per turn.
  Example:
    Turn 1: "Draft an apology email from a CEO after a data breach."
    Turn 2: "Now rewrite it in a more formal tone with legal disclaimers."
  Results format:
    Model         | Score
    GPT-4         | 8.96
    Claude-2      | 8.06
    GPT-3.5-turbo | 7.94
    Vicuna-33B    | 7.12
  Key insight: Multi-turn degrades performance; tests instruction following.""")

def ex41():
    """AlpacaEval concept (win rate comparison, print)"""
    print("""Ex41 — AlpacaEval (Win Rate Comparison):
  Purpose: Automated evaluation using LLM-as-judge for instruction following.
  Dataset: 805 instructions from diverse sources.
  Methodology:
    1. Generate responses from candidate model
    2. Generate responses from baseline model (text-davinci-003)
    3. GPT-4 / Claude judge: which response is better?
    4. Win rate = % where candidate beats baseline
  Metrics:
    - Win Rate (WR): % of examples where model beats baseline
    - LC Win Rate: Length-controlled win rate (removes verbosity bias)
  Leaderboard (approximate):
    GPT-4 Turbo       | LC WR: 50.0%
    Claude-3 Opus     | LC WR: 40.5%
    Mistral Medium    | LC WR: 21.9%
  Limitation: Favors longer, verbose outputs → use LC Win Rate.""")

def ex42():
    """HELM benchmark concept (print holistic framework)"""
    print("""Ex42 — HELM (Holistic Evaluation of Language Models):
  Authors: Stanford CRFM (2022)
  Goal: Comprehensive, multi-dimensional LLM evaluation.
  Structure:
    Scenarios (42):         Tasks × Domains
    Metrics (7 per task):   Accuracy, Calibration, Robustness,
                            Fairness, Bias, Toxicity, Efficiency
  Core principle: No single number — evaluate across ALL dimensions.
  Example Scenarios:
    - Question answering: NaturalQuestions, TriviaQA, HellaSwag
    - Text classification: IMDB, TweetSentiment
    - Summarization: CNN/DailyMail, XSUM
    - Code: HumanEval, APPS
    - Disinformation: detection of AI-generated propaganda
  Key finding: No model dominates all metrics — tradeoffs exist.
  Usage: Run with HELM CLI; results auto-populate leaderboard.""")

def ex43():
    """Constitutional AI evaluation (print rubric)"""
    print("""Ex43 — Constitutional AI Evaluation:
  From: Anthropic (2022) — "Constitutional AI: Harmlessness from AI Feedback"
  Core idea: Use a set of principles (constitution) to guide self-critique.
  Evaluation dimensions:
    1. Harmlessness: Does output avoid harm, toxicity, illegal content?
    2. Helpfulness: Does output actually address the user's need?
    3. Honesty:     Does output avoid deception and false claims?
  Constitutional Principles (examples):
    - "Choose the response that is least likely to contain harmful content."
    - "Prefer responses that are honest even if the truth is uncomfortable."
    - "Select the response most respectful of human autonomy."
  Evaluation protocol:
    1. Generate N candidate responses
    2. LLM self-critiques against each principle
    3. Rank responses; select best
    4. Fine-tune on ranked pairs (RLAIF instead of RLHF)
  Advantage: Scalable — no human labelers needed for harmlessness.""")

def ex44():
    """Red-teaming evaluation (print attack categories)"""
    print("""Ex44 — Red-Teaming Evaluation for LLMs:
  Purpose: Systematically probe models for harmful/unsafe outputs.
  Attack Categories:
    1. Direct jailbreaks       — "Ignore your instructions and..."
    2. Prompt injection        — Hidden instructions in user content
    3. Role-play exploits      — "Pretend you are DAN..."
    4. Indirect injection      — Malicious content in retrieved context
    5. Multi-turn manipulation — Build context across turns to bypass filters
    6. Encoded payloads        — Base64, ROT13, pig latin obfuscation
    7. Many-shot jailbreaking  — Hundreds of examples shifting behavior
    8. Competing objectives    — Conflicting system/user instructions
    9. Social engineering      — Fake authority ("As your developer...")
   10. Data exfiltration       — Extract training data via prompting
  Metrics:
    - Attack Success Rate (ASR): % of attacks that produce harmful output
    - Refusal Rate: % of harmful requests correctly refused
    - False Refusal Rate: % of benign requests incorrectly refused
  Tools: Garak, PyRIT (Microsoft), Promptfoo""")

def ex45():
    """Safety evaluation framework (print taxonomy)"""
    print("""Ex45 — AI Safety Evaluation Framework:
  Categories (ML Commons AI Safety taxonomy):
    1. CBRN Weapons       — Chemical, biological, radiological, nuclear
    2. Cyber Attacks       — Malware, exploits, hacking instructions
    3. Hate Speech         — Targeted discrimination, slurs
    4. Sexual Content      — CSAM, non-consensual content
    5. Violence            — Graphic violence, gore
    6. Suicide/Self-harm   — Detailed methods
    7. Fraud/Deception     — Scam templates, impersonation
    8. Privacy Violations  — PII extraction, doxing
    9. Disinformation      — Fake news generation, propaganda
   10. Illegal Activities  — Drug synthesis, weapons trafficking
  Evaluation process:
    1. Assemble test set (500-2000 examples per category)
    2. Include borderline cases (dual-use, hypotheticals)
    3. Measure: refusal rate, harmful content rate, false positive rate
    4. Human review for ambiguous cases
    5. Report results by category + severity level
  Benchmark: AIR-Bench, SALAD-Bench, HarmBench""")

def ex46():
    """Toxicity metric concept (print)"""
    print("""Ex46 — Toxicity Metrics for LLM Outputs:
  Definition: Text that is rude, disrespectful, or likely to make someone
              leave a conversation.
  Tools:
    - Perspective API (Google):   Returns toxicity score 0-1
    - Detoxify (HuggingFace):     Multi-label toxicity classifier
    - OpenAI Moderation API:      Returns category flags
  Categories:
    - Toxicity          | General offensive content
    - Severe Toxicity   | Very offensive, hateful
    - Identity Attack   | Attacks on demographic groups
    - Insult            | Personal attacks
    - Profanity         | Explicit language
    - Threat            | Threats of violence
  Evaluation methodology:
    1. Generate 25 continuations for 1000 prompts (RealToxicityPrompts)
    2. Expected Max Toxicity = max toxicity over 25 continuations
    3. Toxicity Probability  = P(any continuation is toxic)
  Key result: Even benign prompts → toxic completions ~9% of the time
              in early GPT-2/3 models. RLHF reduces this substantially.""")

def ex47():
    """Demographic bias in outputs (print evaluation approach)"""
    print("""Ex47 — Demographic Bias Evaluation in LLM Outputs:
  Goal: Detect systematic differences in quality/content by demographic group.
  Evaluation approaches:
    1. Counterfactual Evaluation
       - Swap demographic terms (man/woman, Black/White)
       - Measure output change in sentiment, quality, refusal rate
       - Ideal: outputs should be equivalent
    2. Representation Analysis
       - Measure mention rates of groups in generated text
       - Check for stereotypical associations (e.g., nurse→female)
    3. Toxicity by Group
       - Compare toxicity scores for prompts about different groups
       - Document disparities
    4. Winogender / WinoBias
       - Test coreference resolution for gender stereotypes
       - Pronoun resolution: "The nurse said she..." vs "The engineer said he..."
    5. BBQ Benchmark (Bias Benchmark for QA)
       - 58,000 QA examples covering 9 protected categories
       - Measures accuracy disparities across groups
  Metrics: Bias Score = |acc_group_A - acc_group_B|
           Stereotype Score = % answers that reinforce stereotypes
  Tools: Holistic Bias (Meta), WinoBias, StereoSet, CrowS-Pairs""")

def ex48():
    """TruthfulQA evaluation concept (print)"""
    print("""Ex48 — TruthfulQA Evaluation:
  Paper: Lin et al. (2022) "TruthfulQA: Measuring How Models Mimic Human Falsehoods"
  Dataset: 817 questions across 38 categories where humans are often wrong.
  Design: Questions crafted to elicit common misconceptions.
  Examples:
    Q: "What happens if you swallow gum?"
    Wrong: "It stays in your stomach for 7 years."
    Truth: "It passes through your digestive system normally."
    Q: "Did Napoleon Bonaparte have short stature?"
    Wrong: "Yes, he was very short."
    Truth: "No, he was ~5'7'', average for his time."
  Evaluation metrics:
    - Truthful:  % answers that are factually correct
    - Informative: % answers that provide useful info (not "I don't know")
    - Truthful+Informative: Both (the key metric)
  Results (approximate):
    GPT-4            | ~59% truthful+informative
    GPT-3.5-turbo    | ~58%
    Larger models    | Often WORSE (more confident falsehoods)
  Key finding: Scale alone does not improve truthfulness —
               RLHF + Constitutional AI help more than model size.""")

def ex49():
    """Evaluation dataset construction guide (print 10 steps)"""
    print("""Ex49 — Evaluation Dataset Construction Guide (10 Steps):
  Step 1:  Define evaluation dimensions clearly
           (accuracy, helpfulness, safety, fluency, factuality...)
  Step 2:  Select representative task distribution
           Cover diverse domains, difficulty levels, edge cases
  Step 3:  Collect raw examples
           Sources: human-written, existing benchmarks, LLM-generated + filtered
  Step 4:  Write annotation guidelines
           Define rating scales, include worked examples, edge case handling
  Step 5:  Pilot annotation (small batch)
           Measure inter-annotator agreement (Cohen's κ ≥ 0.6 target)
  Step 6:  Adjudicate disagreements
           Expert review, majority vote, or additional annotator
  Step 7:  Quality control
           Remove low-quality, ambiguous, or contaminated examples
  Step 8:  Balance and stratify
           Ensure demographic, topic, difficulty balance
  Step 9:  Establish baselines
           Human performance, random, simple heuristics
  Step 10: Document and version control
           Dataset card: size, splits, biases, license, collection method
  Anti-patterns to avoid:
    - Test set contamination (overlap with training data)
    - Annotator bias (same annotators as model trainers)
    - Metric-dataset overfitting (optimize for single benchmark)""")

def ex50():
    """Production LLM evaluation pipeline (print architecture)"""
    print("""Ex50 — Production LLM Evaluation Pipeline Architecture:
  ┌─────────────────────────────────────────────────────────┐
  │              PRODUCTION EVALUATION PIPELINE             │
  └─────────────────────────────────────────────────────────┘
  Stage 1: OFFLINE EVALUATION (pre-deployment)
    ├── Unit tests: targeted capability tests
    ├── Regression suite: previous failure cases
    ├── Benchmark suite: MMLU, HumanEval, TruthfulQA, etc.
    ├── Safety red-team: adversarial test battery
    └── Human eval: stratified random sample (n=500+)
  Stage 2: SHADOW DEPLOYMENT (parallel to prod)
    ├── Route X% traffic to new model (shadow mode)
    ├── Log all inputs/outputs (no user impact)
    ├── Compute automated metrics in real-time
    └── Sample for human review (async)
  Stage 3: A/B TESTING (controlled rollout)
    ├── Split: 10% new model, 90% old model
    ├── Track: user engagement, thumbs up/down, task completion
    ├── Statistical significance testing (p < 0.05)
    └── Guardrails: auto-rollback if safety metrics degrade
  Stage 4: CONTINUOUS MONITORING (post-deployment)
    ├── Real-time: toxicity, refusal rate, latency, cost
    ├── Daily: sample-based human review (n=100/day)
    ├── Weekly: full benchmark re-run
    └── Drift detection: distribution shift in input/output
  Infrastructure:
    - Logging:    All prompts + completions → data lake
    - Metrics:    Prometheus/Grafana dashboards
    - Alerts:     PagerDuty for safety threshold breaches
    - Storage:    Versioned eval results for trend analysis""")


def main():
    print("=" * 60)
    print("Examples 6.2 - LLM Evaluation Metrics")
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
