# ============================================================
# Examples 1.5 — Information Theory for ML (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import scipy.stats as stats
import math

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Shannon entropy in bits"""
    p = np.array([0.5, 0.25, 0.125, 0.125])
    H = -np.sum(p * np.log2(p))
    print(f"Ex01 — H = {H:.4f} bits")

def ex02():
    """Entropy of uniform distribution (maximum entropy)"""
    n_symbols = 8
    p = np.ones(n_symbols) / n_symbols
    H = -np.sum(p * np.log2(p))
    print(f"Ex02 — H(uniform, n={n_symbols}) = {H:.4f} bits (= log2({n_symbols}) = {math.log2(n_symbols):.4f})")

def ex03():
    """Entropy of a peaked distribution (low entropy)"""
    p = np.array([0.97, 0.01, 0.01, 0.01])
    H = -np.sum(p * np.log2(p + 1e-15))
    print(f"Ex03 — H(peaked) = {H:.4f} bits (near 0 = low uncertainty)")

def ex04():
    """Binary entropy H(p)"""
    def binary_entropy(p):
        if p <= 0 or p >= 1:
            return 0.0
        return -(p * math.log2(p) + (1 - p) * math.log2(1 - p))
    for p_val in [0.1, 0.5, 0.9]:
        print(f"Ex04 — H({p_val}) = {binary_entropy(p_val):.4f} bits")

def ex05():
    """Joint entropy H(X,Y)"""
    joint = np.array([[0.1, 0.2], [0.3, 0.4]])
    H_XY = -np.sum(joint * np.log2(joint + 1e-15))
    print(f"Ex05 — H(X,Y) = {H_XY:.4f} bits")

def ex06():
    """Marginal entropy from joint distribution"""
    joint = np.array([[0.1, 0.2], [0.3, 0.4]])
    p_x = joint.sum(axis=1)
    p_y = joint.sum(axis=0)
    H_X = -np.sum(p_x * np.log2(p_x + 1e-15))
    H_Y = -np.sum(p_y * np.log2(p_y + 1e-15))
    print(f"Ex06 — H(X) = {H_X:.4f} bits, H(Y) = {H_Y:.4f} bits")

def ex07():
    """Conditional entropy H(Y|X)"""
    joint = np.array([[0.1, 0.2], [0.3, 0.4]])
    p_x = joint.sum(axis=1)
    H_XY = -np.sum(joint * np.log2(joint + 1e-15))
    H_X  = -np.sum(p_x * np.log2(p_x + 1e-15))
    H_Y_given_X = H_XY - H_X
    print(f"Ex07 — H(Y|X) = {H_Y_given_X:.4f} bits")

def ex08():
    """Mutual information I(X;Y)"""
    joint = np.array([[0.1, 0.2], [0.3, 0.4]])
    p_x = joint.sum(axis=1, keepdims=True)
    p_y = joint.sum(axis=0, keepdims=True)
    outer = p_x * p_y
    MI = np.sum(joint * np.log2(joint / (outer + 1e-15) + 1e-15))
    print(f"Ex08 — I(X;Y) = {MI:.4f} bits")

def ex09():
    """KL divergence D_KL(P||Q)"""
    P = np.array([0.4, 0.3, 0.2, 0.1])
    Q = np.array([0.25, 0.25, 0.25, 0.25])
    kl_PQ = np.sum(P * np.log2(P / Q))
    print(f"Ex09 — KL(P||Q) = {kl_PQ:.4f} bits")

def ex10():
    """KL divergence D_KL(Q||P) — asymmetry demonstration"""
    P = np.array([0.4, 0.3, 0.2, 0.1])
    Q = np.array([0.25, 0.25, 0.25, 0.25])
    kl_QP = np.sum(Q * np.log2(Q / P))
    kl_PQ = np.sum(P * np.log2(P / Q))
    print(f"Ex10 — KL(P||Q)={kl_PQ:.4f} vs KL(Q||P)={kl_QP:.4f} (asymmetric: {not math.isclose(kl_PQ, kl_QP, rel_tol=1e-9)})")

def ex11():
    """Jensen-Shannon divergence (symmetric, bounded)"""
    P = np.array([0.4, 0.3, 0.2, 0.1])
    Q = np.array([0.25, 0.25, 0.25, 0.25])
    M = 0.5 * (P + Q)
    JSD = 0.5 * np.sum(P * np.log2(P / M)) + 0.5 * np.sum(Q * np.log2(Q / M))
    print(f"Ex11 — JSD(P||Q) = {JSD:.4f} bits (in [0,1])")

def ex12():
    """Cross-entropy loss H(y_true, y_pred)"""
    y_true = np.array([0.0, 1.0, 0.0, 0.0])   # one-hot
    y_pred = np.array([0.1, 0.7, 0.1, 0.1])    # softmax output
    cross_ent = -np.sum(y_true * np.log(y_pred + 1e-15))
    print(f"Ex12 — cross-entropy loss = {cross_ent:.4f} nats")

def ex13():
    """Binary cross-entropy"""
    y = np.array([1, 0, 1, 1, 0])
    y_pred = np.array([0.9, 0.1, 0.8, 0.7, 0.2])
    bce = -np.mean(y * np.log(y_pred + 1e-15) + (1 - y) * np.log(1 - y_pred + 1e-15))
    print(f"Ex13 — binary cross-entropy = {bce:.4f}")

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Rényi entropy of order alpha"""
    def renyi_entropy(p, alpha):
        if alpha == 1:
            return -np.sum(p * np.log2(p + 1e-15))
        return (1.0 / (1 - alpha)) * math.log2(np.sum(p**alpha))
    p = np.array([0.4, 0.3, 0.2, 0.1])
    for alpha in [0.5, 1.0, 2.0]:
        print(f"Ex14 — Renyi H(alpha={alpha}) = {renyi_entropy(p, alpha):.4f} bits")

def ex15():
    """Min-entropy (alpha → ∞ limit of Rényi)"""
    p = np.array([0.5, 0.3, 0.15, 0.05])
    H_min = -math.log2(p.max())
    print(f"Ex15 — min-entropy = {H_min:.4f} bits (log2(1/p_max))")

def ex16():
    """Max-entropy (alpha → 0 limit): log2(support size)"""
    p = np.array([0.5, 0.3, 0.15, 0.05])
    support = np.sum(p > 0)
    H_max = math.log2(support)
    print(f"Ex16 — max-entropy = {H_max:.4f} bits (log2 of support size {support})")

def ex17():
    """Information gain for a decision tree split"""
    def entropy(p):
        p = p[p > 0]
        return -np.sum(p * np.log2(p))
    parent_counts = np.array([50, 50])
    left_counts   = np.array([40, 10])
    right_counts  = np.array([10, 40])
    total = parent_counts.sum()
    H_parent = entropy(parent_counts / total)
    H_left   = entropy(left_counts / left_counts.sum())
    H_right  = entropy(right_counts / right_counts.sum())
    IG = H_parent - (left_counts.sum()/total * H_left + right_counts.sum()/total * H_right)
    print(f"Ex17 — information gain = {IG:.4f} bits")

def ex18():
    """Gini impurity"""
    def gini(counts):
        p = counts / counts.sum()
        return 1 - np.sum(p**2)
    parent = np.array([50, 50])
    left   = np.array([40, 10])
    right  = np.array([10, 40])
    total  = parent.sum()
    weighted_gini = (left.sum()/total * gini(left) + right.sum()/total * gini(right))
    print(f"Ex18 — weighted Gini after split = {weighted_gini:.4f} (parent Gini={gini(parent):.4f})")

def ex19():
    """Gini vs Entropy comparison for splits"""
    def entropy(p_arr):
        p = p_arr[p_arr > 0] / p_arr.sum()
        return -np.sum(p * np.log2(p))
    def gini(p_arr):
        p = p_arr / p_arr.sum()
        return 1 - np.sum(p**2)
    splits = [np.array([30, 70]), np.array([50, 50]), np.array([10, 90])]
    for s in splits:
        print(f"Ex19 — {s}: entropy={entropy(s):.4f}, gini={gini(s):.4f}")

def ex20():
    """Perplexity from entropy"""
    text_probs = np.array([0.25, 0.20, 0.15, 0.15, 0.10, 0.08, 0.05, 0.02])
    H = -np.sum(text_probs * np.log2(text_probs))
    perplexity = 2**H
    print(f"Ex20 — H={H:.4f} bits, perplexity=2^H={perplexity:.4f}")

def ex21():
    """Channel capacity (Shannon): C = max_p I(X;Y)"""
    # Binary symmetric channel with flip probability p
    def bsc_capacity(p_flip):
        return 1 + p_flip * math.log2(p_flip + 1e-15) + (1-p_flip) * math.log2(1-p_flip + 1e-15)
    for p_flip in [0.0, 0.1, 0.5]:
        C = bsc_capacity(p_flip)
        print(f"Ex21 — BSC capacity (p_flip={p_flip}) = {C:.4f} bits/use")

def ex22():
    """Bits needed to encode N symbols (prefix-free code lower bound)"""
    probs = np.array([0.5, 0.25, 0.125, 0.125])
    H = -np.sum(probs * np.log2(probs))
    codeword_lengths = np.ceil(-np.log2(probs)).astype(int)
    avg_length = np.sum(probs * codeword_lengths)
    print(f"Ex22 — H={H:.4f}, avg codeword length={avg_length:.4f} bits")

def ex23():
    """Huffman coding concept: assign codes by frequency"""
    symbols = ['A', 'B', 'C', 'D']
    probs   = [0.5, 0.25, 0.125, 0.125]
    lengths = [1, 2, 3, 3]   # optimal Huffman lengths for these probabilities
    avg_len = sum(p * l for p, l in zip(probs, lengths))
    entropy = -sum(p * math.log2(p) for p in probs)
    print(f"Ex23 — Huffman avg length={avg_len:.4f}, entropy={entropy:.4f}, efficiency={entropy/avg_len:.4f}")

def ex24():
    """Minimum description length (MDL) principle"""
    n, k = 100, 3
    log_likelihood = -45.0   # log-likelihood of fitted model
    # MDL = -log L + (k/2)*log(n)
    mdl = -log_likelihood + (k / 2) * math.log(n)
    print(f"Ex24 — MDL = {mdl:.4f} (k={k} params, n={n} samples)")

def ex25():
    """Data compression ratio"""
    original_bits = 1000 * 8    # 1000 bytes
    entropy_bits  = 1000 * 3.2  # avg 3.2 bits/symbol
    compression_ratio = entropy_bits / original_bits
    print(f"Ex25 — compression ratio = {compression_ratio:.4f} "
          f"(can compress to {compression_ratio*100:.1f}% of original)")

def ex26():
    """Entropy rate of a Markov chain"""
    P = np.array([[0.9, 0.1],
                  [0.4, 0.6]])
    # Stationary distribution
    eigvals, eigvecs = np.linalg.eig(P.T)
    stat = np.real(eigvecs[:, np.argmin(np.abs(eigvals - 1))])
    stat = np.abs(stat) / np.abs(stat).sum()
    # H(X_n | X_{n-1}) = sum_i pi_i * H(P[i,:])
    H_rows = -np.sum(P * np.log2(P + 1e-15), axis=1)
    H_rate = np.dot(stat, H_rows)
    print(f"Ex26 — Markov chain entropy rate = {H_rate:.4f} bits/step")

# ─── NESTED (27–38) ────────────────────────────────────────

def ex27():
    """InformationTheory class with all core metrics"""
    class InformationTheory:
        @staticmethod
        def entropy(p):
            p = np.asarray(p, float)
            return -np.sum(p * np.log2(p + 1e-15))
        @staticmethod
        def kl_divergence(P, Q):
            P, Q = np.asarray(P, float), np.asarray(Q, float)
            return np.sum(P * np.log2(P / (Q + 1e-15) + 1e-15))
        @staticmethod
        def mutual_info(joint):
            joint = np.asarray(joint, float)
            px = joint.sum(axis=1, keepdims=True)
            py = joint.sum(axis=0, keepdims=True)
            return np.sum(joint * np.log2(joint / (px * py + 1e-15) + 1e-15))
        @staticmethod
        def cross_entropy(y_true, y_pred):
            return -np.sum(np.asarray(y_true, float) * np.log(np.asarray(y_pred, float) + 1e-15))
    it = InformationTheory()
    p = np.array([0.5, 0.3, 0.2])
    q = np.array([0.33, 0.33, 0.34])
    print(f"Ex27 — H(p)={it.entropy(p):.4f}, KL={it.kl_divergence(p,q):.4f}")

def ex28():
    """DecisionTreeSplitter class using information gain"""
    class DecisionTreeSplitter:
        @staticmethod
        def _entropy(counts):
            counts = np.asarray(counts, float)
            p = counts / counts.sum()
            p = p[p > 0]
            return -np.sum(p * np.log2(p))
        def best_split(self, data, labels):
            best_gain, best_thresh = -1, None
            for thresh in np.unique(data)[:-1]:
                left  = labels[data <= thresh]
                right = labels[data > thresh]
                if len(left) == 0 or len(right) == 0:
                    continue
                counts_all   = np.bincount(labels)
                counts_left  = np.bincount(left,  minlength=len(counts_all))
                counts_right = np.bincount(right, minlength=len(counts_all))
                H_parent = self._entropy(counts_all)
                n = len(labels)
                H_children = (len(left)/n  * self._entropy(counts_left) +
                              len(right)/n * self._entropy(counts_right))
                gain = H_parent - H_children
                if gain > best_gain:
                    best_gain, best_thresh = gain, thresh
            return best_thresh, best_gain
    np.random.seed(0)
    X = np.array([1, 2, 3, 4, 5, 6, 7, 8])
    y = np.array([0, 0, 0, 1, 1, 1, 1, 0])
    spl = DecisionTreeSplitter()
    thresh, gain = spl.best_split(X, y)
    print(f"Ex28 — best split at X={thresh}, IG={gain:.4f}")

def ex29():
    """MutualInfoFeatureSelector class"""
    class MutualInfoFeatureSelector:
        def __init__(self, n_bins=5):
            self.n_bins = n_bins
        def _mi(self, x, y):
            x_disc = np.digitize(x, np.histogram_bin_edges(x, self.n_bins)[1:-1])
            y_disc = np.digitize(y, np.histogram_bin_edges(y, self.n_bins)[1:-1])
            joint, _, _ = np.histogram2d(x_disc, y_disc,
                                         bins=[self.n_bins, self.n_bins])
            joint = joint / joint.sum()
            px = joint.sum(axis=1, keepdims=True)
            py = joint.sum(axis=0, keepdims=True)
            return np.sum(joint * np.log(joint / (px * py + 1e-15) + 1e-15))
        def select(self, X, y, k=2):
            mis = [self._mi(X[:, i], y) for i in range(X.shape[1])]
            top_k = np.argsort(mis)[::-1][:k]
            return top_k, [round(mis[i], 4) for i in top_k]
    np.random.seed(0)
    n = 300
    x1 = np.random.randn(n)
    x2 = x1 + np.random.randn(n) * 0.1   # high MI with x1
    x3 = np.random.randn(n)               # low MI
    y  = x1 + np.random.randn(n) * 0.5
    X = np.column_stack([x1, x2, x3])
    sel = MutualInfoFeatureSelector()
    top_k, scores = sel.select(X, y, k=2)
    print(f"Ex29 — top-2 features by MI: {top_k}, scores={scores}")

def ex30():
    """EntropyMinimization: find distribution with min entropy under constraint"""
    # Under mean constraint E[X]=mu, uniform weights maximise entropy;
    # here we demonstrate minimum-entropy: put all mass on one symbol
    def entropy(p):
        return -np.sum(p[p > 0] * np.log2(p[p > 0]))
    n = 6
    # Min entropy: all mass on first symbol
    p_min = np.zeros(n); p_min[0] = 1.0
    # Max entropy: uniform
    p_max = np.ones(n) / n
    print(f"Ex30 — min entropy={entropy(p_min):.4f} bits, max entropy={entropy(p_max):.4f} bits")

def ex31():
    """Information bottleneck concept (tradeoff between compression and prediction)"""
    np.random.seed(0)
    n = 500
    X = np.random.randn(n)
    Y = np.sign(X) + np.random.randn(n) * 0.2
    # Compress X into T with varying resolution
    for n_bins in [2, 4, 8]:
        T = np.digitize(X, np.linspace(X.min(), X.max(), n_bins + 1)[:-1])
        # Estimate I(T;Y) via histogram MI
        joint, _, _ = np.histogram2d(T, (Y > 0).astype(int), bins=[n_bins, 2])
        joint = joint / joint.sum()
        px = joint.sum(axis=1, keepdims=True)
        py = joint.sum(axis=0, keepdims=True)
        mi = np.sum(joint * np.log2(joint / (px * py + 1e-15) + 1e-15))
        print(f"Ex31 — IB n_bins={n_bins}: I(T;Y)≈{mi:.4f} bits")

def ex32():
    """Rate-distortion theory: distortion vs compression tradeoff"""
    # For Gaussian source N(0,1) with squared error:
    # D(R) = 2^(-2R) for rate R bits
    print("Ex32 — rate-distortion D(R) = 2^(-2R) for Gaussian source:")
    for R in [0.5, 1.0, 2.0, 3.0]:
        D = 2**(-2 * R)
        print(f"  R={R} bits: D={D:.4f}")

def ex33():
    """Variational information bottleneck concept (compute ELBO terms)"""
    np.random.seed(0)
    # Simulate encoder: q(T|X) = N(mu_T(X), sigma^2)
    X = np.random.randn(100)
    beta = 0.5
    mu_T = 0.8 * X   # encoder
    sigma_T = 0.5
    # KL(q(T|X) || p(T)) where p(T) = N(0,1)
    # KL = 0.5*(mu_T^2 + sigma_T^2 - 1 - log(sigma_T^2)) per sample
    kl = 0.5 * (mu_T**2 + sigma_T**2 - 1 - math.log(sigma_T**2))
    # Reconstruction term (simulated)
    Y = X + np.random.randn(100) * 0.3
    recon = -np.mean((Y - mu_T)**2)
    vib_objective = recon - beta * kl.mean()
    print(f"Ex33 — VIB: recon={recon:.4f}, KL={kl.mean():.4f}, objective={vib_objective:.4f}")

def ex34():
    """Channel coding theorem: capacity and achievable rates"""
    # AWGN channel: C = 0.5*log2(1 + SNR)
    print("Ex34 — AWGN Shannon capacity C = 0.5*log2(1+SNR):")
    for snr_db in [0, 10, 20, 30]:
        snr = 10**(snr_db / 10)
        C = 0.5 * math.log2(1 + snr)
        print(f"  SNR={snr_db:2d}dB: C={C:.4f} bits/use")

def ex35():
    """Source coding theorem: expected code length >= entropy"""
    probs = np.array([0.5, 0.25, 0.125, 0.0625, 0.0625])
    H = -np.sum(probs * np.log2(probs))
    # Optimal (arithmetic coding achieves H); Huffman lengths
    lengths = np.ceil(-np.log2(probs)).astype(int)
    avg_len = np.dot(probs, lengths)
    print(f"Ex35 — source coding: H={H:.4f} bits, avg code length={avg_len:.4f} bits "
          f"(H <= avg_len: {H <= avg_len})")

def ex36():
    """Error correction concept: Hamming(7,4) code parameters"""
    n_code, k_data = 7, 4
    redundancy = n_code - k_data
    code_rate = k_data / n_code
    # Singleton bound
    min_dist = redundancy + 1
    t_correct = (min_dist - 1) // 2
    print(f"Ex36 — Hamming(7,4): rate={code_rate:.4f}, redundancy={redundancy}, "
          f"min_dist={min_dist}, t_correct={t_correct}")

def ex37():
    """Feature selection via mutual information (sklearn-style)"""
    np.random.seed(0)
    n = 500
    X1 = np.random.randn(n)
    X2 = X1 * 0.9 + np.random.randn(n) * 0.1   # highly correlated
    X3 = np.random.randn(n)                       # independent
    y  = (X1 > 0).astype(float)
    def discrete_mi(x, y_bin, n_bins=5):
        x_d = np.digitize(x, np.linspace(x.min(), x.max(), n_bins+1)[:-1])
        joint, _, _ = np.histogram2d(x_d, y_bin, bins=[n_bins, 2])
        joint /= joint.sum()
        px = joint.sum(axis=1, keepdims=True)
        py = joint.sum(axis=0, keepdims=True)
        return float(np.sum(joint * np.log2(joint / (px * py + 1e-15) + 1e-15)))
    mi_scores = [discrete_mi(xi, y) for xi in [X1, X2, X3]]
    print(f"Ex37 — MI scores: X1={mi_scores[0]:.4f}, X2={mi_scores[1]:.4f}, X3={mi_scores[2]:.4f}")

def ex38():
    """KL divergence regularization in VAE (compute beta-VAE objective)"""
    np.random.seed(0)
    n = 100
    # Latent means and log-variances from encoder
    mu_z    = np.random.randn(n, 2) * 0.5
    logvar_z = np.random.randn(n, 2) * 0.1 - 0.5
    # KL(N(mu,exp(logvar)) || N(0,I)) per sample
    kl = -0.5 * np.sum(1 + logvar_z - mu_z**2 - np.exp(logvar_z), axis=1)
    # Simulated reconstruction loss
    recon_loss = np.random.uniform(0.5, 1.5, n)
    beta = 1.0
    vae_loss = recon_loss.mean() + beta * kl.mean()
    print(f"Ex38 — beta-VAE: recon={recon_loss.mean():.4f}, KL={kl.mean():.4f}, loss={vae_loss:.4f}")

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Fisher information matrix for Gaussian distribution"""
    # For N(mu, sigma^2): FIM = diag(1/sigma^2, 1/(2*sigma^4))
    mu, sigma2 = 0.0, 4.0
    FIM = np.diag([1.0 / sigma2, 1.0 / (2 * sigma2**2)])
    print(f"Ex39 — Fisher info matrix for N(mu,sigma^2):\n{FIM}")

def ex40():
    """Natural gradient via Fisher information"""
    np.random.seed(0)
    # For Bernoulli p: FIM = 1/(p*(1-p)), natural grad = grad / FIM
    data = np.array([1, 1, 0, 1, 0, 1, 1, 0, 1, 1])
    p = data.mean()   # MLE
    # At p + 0.1, compute gradient of NLL
    p_theta = 0.6
    grad_nll = -(data.mean() - p_theta) / (p_theta * (1 - p_theta)) * p_theta*(1-p_theta)
    FIM = 1.0 / (p_theta * (1 - p_theta))
    natural_grad = grad_nll / FIM
    p_new = p_theta - 0.1 * natural_grad
    print(f"Ex40 — natural gradient step: p {p_theta:.4f} → {p_new:.4f} (MLE={p:.4f})")

def ex41():
    """Jeffreys prior from Fisher information"""
    # Bernoulli: Jeffreys prior ∝ p^(-1/2) * (1-p)^(-1/2) = Beta(0.5, 0.5)
    p_vals = np.linspace(0.05, 0.95, 5)
    jeffreys = [1.0 / math.sqrt(p * (1 - p)) for p in p_vals]
    jeffreys_normalized = np.array(jeffreys)
    jeffreys_normalized /= np.trapz(jeffreys_normalized, p_vals)
    print(f"Ex41 — Jeffreys prior (unnorm) at p={np.round(p_vals,2)}: {np.round(jeffreys,4)}")

def ex42():
    """Information geometry: KL and Fisher metric relationship"""
    # For small epsilon: KL(p||p+epsilon) ≈ (1/2)*epsilon^T * FIM * epsilon
    p = 0.6
    eps = 0.01
    q = p + eps
    kl_exact = p * math.log(p / q) + (1-p) * math.log((1-p) / (1-q))
    FIM = 1 / (p * (1 - p))
    kl_approx = 0.5 * FIM * eps**2
    print(f"Ex42 — KL exact={kl_exact:.8f}, Fisher approx={kl_approx:.8f}, "
          f"ratio={kl_exact/kl_approx:.6f} (→1 as eps→0)")

def ex43():
    """f-divergences family"""
    P = np.array([0.4, 0.3, 0.2, 0.1])
    Q = np.array([0.25, 0.25, 0.25, 0.25])
    # KL: f(t) = t*log(t)
    kl = np.sum(P * np.log(P / Q))
    # Reverse KL: f(t) = -log(t)
    rkl = np.sum(Q * np.log(Q / P))
    # Total variation: f(t) = |t-1|/2
    tv = 0.5 * np.sum(np.abs(P - Q))
    # Chi-squared: f(t) = (t-1)^2
    chi2 = np.sum((P - Q)**2 / Q)
    print(f"Ex43 — f-divergences: KL={kl:.4f}, rKL={rkl:.4f}, TV={tv:.4f}, chi2={chi2:.4f}")

def ex44():
    """Bregman divergences (squared Euclidean and KL as Bregman)"""
    P = np.array([0.4, 0.3, 0.2, 0.1])
    Q = np.array([0.25, 0.25, 0.25, 0.25])
    # Squared Euclidean (F=||x||^2): B_F(P,Q) = ||P-Q||^2
    bregman_sq = np.sum((P - Q)**2)
    # KL divergence is Bregman for F(p) = sum p*log(p): B_F(P,Q) = KL(P||Q)
    bregman_kl = np.sum(P * np.log(P / Q))
    print(f"Ex44 — Bregman (sq Euclidean)={bregman_sq:.4f}, Bregman (KL)={bregman_kl:.4f}")

def ex45():
    """Optimal transport: Wasserstein-1 vs KL comparison"""
    P = np.array([0.3, 0.4, 0.2, 0.1])
    Q = np.array([0.1, 0.2, 0.4, 0.3])
    # W1 for 1D: integral of |F_P(x) - F_Q(x)| = sum |CDF_P - CDF_Q|
    cdf_P = np.cumsum(P)
    cdf_Q = np.cumsum(Q)
    w1 = np.sum(np.abs(cdf_P - cdf_Q))
    kl  = np.sum(P * np.log(P / Q))
    print(f"Ex45 — W1={w1:.4f}, KL(P||Q)={kl:.4f} (W1 metrizes weak convergence, KL does not)")

def ex46():
    """Contrastive learning and mutual information (InfoNCE lower bound)"""
    np.random.seed(0)
    n, d = 64, 32
    Z = np.random.randn(n, d)
    Z_pos = Z + np.random.randn(n, d) * 0.1    # positive pairs (close)
    Z_neg = np.random.randn(n, d)               # negative samples
    # InfoNCE: lower bound on MI
    def info_nce(z, z_pos, z_neg):
        tau = 0.1
        pos_sim = np.sum(z * z_pos, axis=1) / tau
        neg_sim = np.sum(z @ z_neg.T, axis=1) / tau
        log_denom = np.log(np.exp(pos_sim) + np.exp(neg_sim).sum(axis=0))
        return np.mean(pos_sim - log_denom)
    bound = info_nce(Z, Z_pos, Z_neg)
    print(f"Ex46 — InfoNCE MI lower bound = {bound:.4f} (higher → better alignment)")

def ex47():
    """MINE concept: neural MI estimator (DV bound)"""
    np.random.seed(0)
    n = 1000
    rho = 0.9
    cov = np.array([[1, rho], [rho, 1]])
    samples = np.random.multivariate_normal([0, 0], cov, n)
    X, Y = samples[:, 0], samples[:, 1]
    # Donsker-Varadhan bound: I(X;Y) >= E[T(X,Y)] - log E[e^T(X,Y')]
    # Use linear T(x,y) = x*y as a simple critic
    joint_scores   = X * Y
    shuffle_idx    = np.random.permutation(n)
    marginal_scores = X * Y[shuffle_idx]
    mine_bound = joint_scores.mean() - math.log(np.exp(marginal_scores).mean())
    true_mi = -0.5 * math.log(1 - rho**2)
    print(f"Ex47 — MINE bound={mine_bound:.4f}, true MI={true_mi:.4f} (rho={rho})")

def ex48():
    """Total correlation (multi-information) for 3 variables"""
    np.random.seed(0)
    n = 1000
    X = np.random.randn(n)
    Y = 0.8 * X + np.random.randn(n) * 0.6
    Z = 0.5 * X + 0.5 * Y + np.random.randn(n) * 0.5
    # TC = sum H(Xi) - H(X,Y,Z)
    def marginal_entropy(x, n_bins=20):
        hist, _ = np.histogram(x, bins=n_bins, density=False)
        hist = hist / hist.sum()
        hist = hist[hist > 0]
        return -np.sum(hist * np.log2(hist))
    H_X = marginal_entropy(X)
    H_Y = marginal_entropy(Y)
    H_Z = marginal_entropy(Z)
    # Joint entropy via 3D histogram (simplified via covariance)
    cov = np.cov(np.stack([X, Y, Z]))
    H_joint = 0.5 * math.log2((2 * math.pi * math.e)**3 * np.linalg.det(cov))
    TC = H_X + H_Y + H_Z - H_joint
    print(f"Ex48 — total correlation TC ≈ {TC:.4f} bits")

def ex49():
    """Information-theoretic generalization bounds (PAC-Bayes)"""
    # PAC-Bayes: E[L(w)] <= E_S[L_S(w)] + sqrt(KL(Q||P) + ln(n/delta)) / (2n)
    n = 1000
    delta = 0.05
    empirical_risk = 0.05
    # KL between posterior Q and prior P (e.g., both Gaussian, KL = 0.5)
    kl_QP = 0.5
    gen_bound = empirical_risk + math.sqrt((kl_QP + math.log(n / delta)) / (2 * n))
    print(f"Ex49 — PAC-Bayes bound: empirical={empirical_risk:.4f}, "
          f"KL={kl_QP:.4f}, generalization bound={gen_bound:.4f}")

def ex50():
    """Production information theory applications guide"""
    applications = [
        ("Feature selection",   "Mutual information: pick features with high I(X_i;Y)"),
        ("Decision trees",      "Information gain / Gini to choose optimal splits"),
        ("VAE/beta-VAE",        "KL regularization controls latent space structure"),
        ("Language models",     "Perplexity = 2^H as evaluation metric"),
        ("Anomaly detection",   "Entropy of prediction distribution signals uncertainty"),
        ("Model compression",   "MDL: shorter descriptions = better generalization"),
        ("Data augmentation",   "Maximize I(augmented; original) to preserve label info"),
        ("Contrastive learning","InfoNCE maximizes lower bound on mutual information"),
    ]
    print("Ex50 — Information Theory in production ML:")
    for app, desc in applications:
        print(f"  {app:22s}: {desc}")

def main():
    print("=" * 60)
    print("Examples 1.5 — Information Theory for ML")
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
