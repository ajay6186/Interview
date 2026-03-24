# ============================================================
# Examples 4.4 — Generative Models (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import pandas as pd
from sklearn.mixture import GaussianMixture
from sklearn.neighbors import KernelDensity
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error
import warnings
warnings.filterwarnings('ignore')

np.random.seed(42)
X_real = np.vstack([
    np.random.randn(150, 2) * 0.5 + [1, 1],
    np.random.randn(150, 2) * 0.5 + [-1, -1]
])

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Sample from Gaussian distribution"""
    mu, sigma = 5.0, 2.0
    samples = np.random.normal(mu, sigma, 1000)
    print("Ex01 — Gaussian samples: mean={:.3f}, std={:.3f} (target: {}, {})".format(
        samples.mean(), samples.std(), mu, sigma))

def ex02():
    """Sample from GMM (sklearn)"""
    gmm = GaussianMixture(n_components=2, random_state=42).fit(X_real)
    X_gen, comp = gmm.sample(100)
    print("Ex02 — GMM sample shape:", X_gen.shape)
    print("       Generated mean:", np.round(X_gen.mean(axis=0), 3))

def ex03():
    """KDE fit + score + sample"""
    kde = KernelDensity(kernel='gaussian', bandwidth=0.5).fit(X_real)
    log_prob = kde.score_samples(X_real[:5])
    X_kde = kde.sample(50, random_state=42)
    print("Ex03 — KDE log-prob (first 5):", np.round(log_prob, 3))
    print("       KDE sample shape:", X_kde.shape)

def ex04():
    """GMM fit + sample with mean comparison"""
    gmm = GaussianMixture(n_components=2, random_state=42).fit(X_real)
    X_gen, _ = gmm.sample(300)
    print("Ex04 — Real mean:", np.round(X_real.mean(axis=0), 4))
    print("       Generated mean:", np.round(X_gen.mean(axis=0), 4))

def ex05():
    """Conditional sampling from GMM (select component)"""
    gmm = GaussianMixture(n_components=2, covariance_type='full', random_state=42).fit(X_real)
    for comp_idx in range(2):
        samples = np.random.multivariate_normal(
            gmm.means_[comp_idx], gmm.covariances_[comp_idx], 5)
        print(f"Ex05 — Component {comp_idx} conditional sample[0]:", np.round(samples[0], 3))

def ex06():
    """Fit Gaussian to data (MLE: mean and covariance)"""
    mu_mle = X_real.mean(axis=0)
    cov_mle = np.cov(X_real.T)
    print("Ex06 — MLE mean:", np.round(mu_mle, 4))
    print("       MLE covariance diagonal:", np.round(np.diag(cov_mle), 4))

def ex07():
    """Compare generated vs real (mean, std, covariance)"""
    gmm = GaussianMixture(n_components=2, random_state=42).fit(X_real)
    X_gen, _ = gmm.sample(len(X_real))
    for i, label in enumerate(['x', 'y']):
        print("Ex07 — {}: real_mean={:.3f} gen_mean={:.3f} | real_std={:.3f} gen_std={:.3f}".format(
            label, X_real[:, i].mean(), X_gen[:, i].mean(),
            X_real[:, i].std(), X_gen[:, i].std()))

def ex08():
    """Density estimation evaluation (log-likelihood)"""
    gmm = GaussianMixture(n_components=2, random_state=42).fit(X_real)
    log_lik_train = gmm.score(X_real)
    X_test = np.random.randn(50, 2)
    log_lik_test = gmm.score(X_test)
    print("Ex08 — GMM log-likelihood: train={:.4f}, random_test={:.4f}".format(
        log_lik_train, log_lik_test))

def ex09():
    """Gaussian noise augmentation"""
    noise_levels = [0.01, 0.05, 0.10]
    for sigma in noise_levels:
        X_aug = X_real + np.random.randn(*X_real.shape) * sigma
        diff = np.mean(np.abs(X_aug - X_real))
        print(f"Ex09 — Gaussian noise sigma={sigma}: mean abs diff={diff:.5f}")

def ex10():
    """Uniform noise augmentation"""
    epsilon = 0.1
    X_aug = X_real + np.random.uniform(-epsilon, epsilon, X_real.shape)
    print("Ex10 — Uniform noise aug: original std={:.4f}, augmented std={:.4f}".format(
        X_real.std(), X_aug.std()))

def ex11():
    """SMOTE concept"""
    print("Ex11 — SMOTE (Synthetic Minority Oversampling Technique) concept:")
    print("  - For minority class: find k nearest neighbors")
    print("  - Synthesize: x_new = x_i + lambda * (x_nn - x_i), lambda ~ Uniform(0,1)")
    print("  - Creates interpolated points, not exact duplicates")
    print("  # from imblearn.over_sampling import SMOTE")
    print("  # X_res, y_res = SMOTE(random_state=42).fit_resample(X, y)")
    idx = np.random.choice(len(X_real), 2, replace=False)
    lam = np.random.uniform(0, 1)
    x_new = X_real[idx[0]] + lam * (X_real[idx[1]] - X_real[idx[0]])
    print("  - Example synthetic point:", np.round(x_new, 3))

def ex12():
    """Mixup augmentation (lambda interpolation)"""
    alpha = 0.2
    lam = np.random.beta(alpha, alpha)
    idx = np.random.permutation(len(X_real))
    X_mix = lam * X_real + (1 - lam) * X_real[idx]
    print("Ex12 — Mixup: lambda={:.4f}, mixed sample[0]:".format(lam),
          np.round(X_mix[0], 4))
    print("       Real sample[0]:", np.round(X_real[0], 4))

def ex13():
    """Random erasing concept"""
    print("Ex13 — Random Erasing concept:")
    print("  - Randomly select a rectangular region in input (image or feature vector)")
    print("  - Replace with zeros, random values, or mean")
    print("  - Improves model robustness to occlusion")
    x = X_real[0].copy()
    mask = np.random.rand(len(x)) < 0.3
    x_erased = x.copy()
    x_erased[mask] = 0
    print("  - Original:", np.round(x, 3), "→ Erased:", np.round(x_erased, 3))

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """GMM with different covariance types"""
    for cov_type in ['full', 'diag', 'tied', 'spherical']:
        gmm = GaussianMixture(n_components=2, covariance_type=cov_type, random_state=42)
        gmm.fit(X_real)
        ll = gmm.score(X_real)
        print(f"Ex14 — GMM covariance={cov_type}: log-likelihood={ll:.4f}")

def ex15():
    """GMM BIC/AIC model selection"""
    bic_scores, aic_scores = {}, {}
    for k in range(1, 6):
        gmm = GaussianMixture(n_components=k, random_state=42).fit(X_real)
        bic_scores[k] = round(gmm.bic(X_real), 2)
        aic_scores[k] = round(gmm.aic(X_real), 2)
    best_bic = min(bic_scores, key=bic_scores.get)
    best_aic = min(aic_scores, key=aic_scores.get)
    print("Ex15 — GMM BIC:", bic_scores, "best k:", best_bic)
    print("       GMM AIC:", aic_scores, "best k:", best_aic)

def ex16():
    """EM algorithm steps for GMM (manual 2 iterations)"""
    np.random.seed(0)
    k, n, d = 2, len(X_real), 2
    mu = X_real[np.random.choice(n, k, replace=False)]
    pi = np.ones(k) / k
    for iteration in range(2):
        # E-step: responsibilities
        log_p = np.array([-0.5 * np.sum((X_real - mu[j]) ** 2, axis=1) for j in range(k)]).T
        log_p += np.log(pi)
        log_p -= log_p.max(axis=1, keepdims=True)
        r = np.exp(log_p)
        r /= r.sum(axis=1, keepdims=True)
        # M-step: update means
        Nk = r.sum(axis=0)
        mu = (r.T @ X_real) / Nk[:, None]
        pi = Nk / n
        print(f"Ex16 — EM iter {iteration+1}: mu={np.round(mu, 3)}, pi={np.round(pi, 3)}")

def ex17():
    """KDE bandwidth selection (cross-validation)"""
    from sklearn.model_selection import GridSearchCV
    params = {'bandwidth': np.linspace(0.1, 2.0, 10)}
    grid = GridSearchCV(KernelDensity(kernel='gaussian'), params, cv=5)
    grid.fit(X_real)
    print("Ex17 — Best KDE bandwidth:", round(grid.best_params_['bandwidth'], 3))
    print("       Best CV score:", round(grid.best_score_, 4))

def ex18():
    """KDE with different kernels"""
    for kernel in ['gaussian', 'epanechnikov', 'tophat']:
        kde = KernelDensity(kernel=kernel, bandwidth=0.5).fit(X_real)
        score = kde.score(X_real)
        print(f"Ex18 — KDE kernel={kernel}: log-likelihood={score:.4f}")

def ex19():
    """Normalizing flow concept"""
    print("Ex19 — Normalizing Flow concept:")
    print("  - Learn invertible transformation f: z = f(x), where z ~ N(0,I)")
    print("  - log p(x) = log p_z(f(x)) + log |det(df/dx)|")
    print("  - Forward (generation): sample z ~ N(0,I), x = f^-1(z)")
    print("  - Backward (density): compute z = f(x), evaluate log p(x)")
    print("  - Types: RealNVP, Glow, Neural Spline Flows")
    print("  - Exact likelihood + efficient sampling in one model")

def ex20():
    """VAE architecture (print code)"""
    print("Ex20 — VAE Architecture (PyTorch pseudocode):")
    print("  class VAE(nn.Module):")
    print("    def encode(x): h = relu(fc1(x)); return fc_mu(h), fc_logvar(h)")
    print("    def reparameterize(mu, logvar):")
    print("      eps = torch.randn_like(mu)")
    print("      return mu + eps * torch.exp(0.5 * logvar)")
    print("    def decode(z): return sigmoid(fc4(relu(fc3(z))))")
    print("    def forward(x):")
    print("      mu, logvar = encode(x); z = reparameterize(mu, logvar)")
    print("      return decode(z), mu, logvar")

def ex21():
    """VAE ELBO loss terms"""
    np.random.seed(0)
    batch = 32
    mu = np.random.randn(batch, 8)
    logvar = np.random.randn(batch, 8) * 0.5
    x = np.random.randn(batch, 20)
    x_rec = x + np.random.randn(*x.shape) * 0.1
    recon_loss = np.mean((x - x_rec) ** 2) * x.shape[1]
    kl_loss = -0.5 * np.mean(1 + logvar - mu ** 2 - np.exp(logvar))
    elbo = recon_loss + kl_loss
    print("Ex21 — VAE ELBO: recon_loss={:.4f}, kl_loss={:.4f}, total={:.4f}".format(
        recon_loss, kl_loss, elbo))

def ex22():
    """VAE reparameterization trick"""
    np.random.seed(0)
    mu = np.array([1.0, -0.5])
    logvar = np.array([0.2, -0.3])
    eps = np.random.randn(5, 2)
    z = mu + eps * np.exp(0.5 * logvar)
    print("Ex22 — VAE reparameterization:")
    print("       mu:", mu, "logvar:", logvar)
    print("       Sampled z (5 samples):\n      ", np.round(z, 3))

def ex23():
    """GAN generator architecture (print code)"""
    print("Ex23 — GAN Generator Architecture:")
    print("  class Generator(nn.Module):")
    print("    def __init__(self, latent_dim=100, output_dim=784):")
    print("      self.net = nn.Sequential(")
    print("        nn.Linear(latent_dim, 256), nn.LeakyReLU(0.2), nn.BatchNorm1d(256),")
    print("        nn.Linear(256, 512), nn.LeakyReLU(0.2), nn.BatchNorm1d(512),")
    print("        nn.Linear(512, output_dim), nn.Tanh())")
    print("    def forward(z): return self.net(z)")
    print("  # Input: z ~ N(0,I), Output: synthetic data in original space")

def ex24():
    """GAN discriminator architecture (print code)"""
    print("Ex24 — GAN Discriminator Architecture:")
    print("  class Discriminator(nn.Module):")
    print("    def __init__(self, input_dim=784):")
    print("      self.net = nn.Sequential(")
    print("        nn.Linear(input_dim, 512), nn.LeakyReLU(0.2), nn.Dropout(0.3),")
    print("        nn.Linear(512, 256), nn.LeakyReLU(0.2), nn.Dropout(0.3),")
    print("        nn.Linear(256, 1), nn.Sigmoid())")
    print("    def forward(x): return self.net(x)")
    print("  # Output: probability that input is real (1=real, 0=fake)")

def ex25():
    """GAN training loop (print code)"""
    print("Ex25 — GAN Training Loop:")
    print("  for epoch in range(epochs):")
    print("    # Train Discriminator")
    print("    z = torch.randn(batch_size, latent_dim)")
    print("    fake = G(z).detach()")
    print("    d_loss = -mean(log(D(real))) - mean(log(1 - D(fake)))")
    print("    d_loss.backward(); d_optimizer.step()")
    print("    # Train Generator")
    print("    z = torch.randn(batch_size, latent_dim)")
    print("    g_loss = -mean(log(D(G(z))))")
    print("    g_loss.backward(); g_optimizer.step()")

def ex26():
    """Wasserstein GAN concept"""
    print("Ex26 — Wasserstein GAN (WGAN) concept:")
    print("  - Standard GAN: min G max D E[log D(x)] + E[log(1-D(G(z)))]")
    print("  - WGAN: min G max_||D||_L≤1 E[D(x)] - E[D(G(z))]  (Wasserstein distance)")
    print("  - Critic (not discriminator): no sigmoid, outputs real number")
    print("  - Weight clipping OR gradient penalty (WGAN-GP) for Lipschitz constraint")
    print("  - GP loss: lambda * (||grad_D(x_hat)||_2 - 1)^2, x_hat = interpolated")
    print("  - Benefits: stable training, meaningful loss metric, no mode collapse")

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """GenerativeModel class: GMM-based fit, sample, score"""
    class GenerativeModel:
        def __init__(self, n_components=2):
            self.gmm = GaussianMixture(n_components=n_components, random_state=42)

        def fit(self, X):
            self.gmm.fit(X)
            self.train_ll_ = self.gmm.score(X)
            return self

        def sample(self, n):
            X_gen, labels = self.gmm.sample(n)
            return X_gen, labels

        def score(self, X):
            return self.gmm.score(X)

        def evaluate(self, X_real, X_gen):
            mean_diff = np.abs(X_real.mean(axis=0) - X_gen.mean(axis=0))
            std_diff = np.abs(X_real.std(axis=0) - X_gen.std(axis=0))
            return {'mean_diff': np.round(mean_diff, 4), 'std_diff': np.round(std_diff, 4)}

    gm = GenerativeModel(n_components=2).fit(X_real)
    X_gen, _ = gm.sample(300)
    print("Ex27 — GenerativeModel train_ll:", round(gm.train_ll_, 4))
    print("       Eval:", gm.evaluate(X_real, X_gen))

def ex28():
    """DataAugmenter class: multiple augmentation strategies"""
    class DataAugmenter:
        def __init__(self, strategy='gaussian', sigma=0.05, alpha=0.2):
            self.strategy = strategy
            self.sigma = sigma
            self.alpha = alpha

        def augment(self, X, n_aug=None):
            n_aug = n_aug or len(X)
            if self.strategy == 'gaussian':
                return X[:n_aug] + np.random.randn(n_aug, X.shape[1]) * self.sigma
            elif self.strategy == 'mixup':
                lam = np.random.beta(self.alpha, self.alpha)
                idx = np.random.permutation(len(X))[:n_aug]
                return lam * X[:n_aug] + (1 - lam) * X[idx]
            elif self.strategy == 'uniform':
                return X[:n_aug] + np.random.uniform(-self.sigma, self.sigma,
                                                      (n_aug, X.shape[1]))

    for strategy in ['gaussian', 'mixup', 'uniform']:
        aug = DataAugmenter(strategy=strategy, sigma=0.05)
        X_aug = aug.augment(X_real, n_aug=50)
        print(f"Ex28 — DataAugmenter {strategy}: shape={X_aug.shape}, mean={X_aug.mean():.4f}")

def ex29():
    """VAEEncoder class (numpy concept demo)"""
    class VAEEncoder:
        def __init__(self, input_dim, latent_dim, seed=42):
            rng = np.random.RandomState(seed)
            self.W_h = rng.randn(input_dim, 64) * 0.1
            self.W_mu = rng.randn(64, latent_dim) * 0.1
            self.W_lv = rng.randn(64, latent_dim) * 0.1

        def encode(self, x):
            h = np.tanh(x @ self.W_h)
            mu = h @ self.W_mu
            logvar = h @ self.W_lv
            return mu, logvar

        def reparameterize(self, mu, logvar):
            eps = np.random.randn(*mu.shape)
            return mu + eps * np.exp(0.5 * logvar)

    enc = VAEEncoder(input_dim=2, latent_dim=4)
    mu, logvar = enc.encode(X_real[:5])
    z = enc.reparameterize(mu, logvar)
    print("Ex29 — VAEEncoder: mu shape={}, z shape={}".format(mu.shape, z.shape))
    print("       mu[0]:", np.round(mu[0], 4))

def ex30():
    """VAEDecoder class (numpy concept demo)"""
    class VAEDecoder:
        def __init__(self, latent_dim, output_dim, seed=42):
            rng = np.random.RandomState(seed)
            self.W_h = rng.randn(latent_dim, 64) * 0.1
            self.W_out = rng.randn(64, output_dim) * 0.1

        def decode(self, z):
            h = np.tanh(z @ self.W_h)
            return h @ self.W_out

    dec = VAEDecoder(latent_dim=4, output_dim=2)
    z_sample = np.random.randn(5, 4)
    x_rec = dec.decode(z_sample)
    print("Ex30 — VAEDecoder: input z shape={}, output shape={}".format(
        z_sample.shape, x_rec.shape))
    print("       Reconstructed[0]:", np.round(x_rec[0], 4))

def ex31():
    """GANTrainer class concept"""
    class GANTrainer:
        def __init__(self, latent_dim=8, data_dim=2):
            self.latent_dim = latent_dim
            self.data_dim = data_dim
            rng = np.random.RandomState(42)
            self.G_W = rng.randn(latent_dim, data_dim) * 0.1
            self.D_W = rng.randn(data_dim, 1) * 0.1

        def generate(self, n):
            z = np.random.randn(n, self.latent_dim)
            return np.tanh(z @ self.G_W)

        def discriminate(self, x):
            return 1 / (1 + np.exp(-(x @ self.D_W)))

        def generator_loss(self, n):
            fake = self.generate(n)
            d_fake = self.discriminate(fake)
            return -np.mean(np.log(d_fake + 1e-8))

    trainer = GANTrainer()
    fake = trainer.generate(100)
    g_loss = trainer.generator_loss(100)
    print("Ex31 — GANTrainer: fake shape={}, gen_loss={:.4f}".format(
        fake.shape, g_loss))

def ex32():
    """DensityEstimator class: KDE + GMM comparison"""
    class DensityEstimator:
        def __init__(self, bandwidth=0.5, n_components=2):
            self.kde = KernelDensity(kernel='gaussian', bandwidth=bandwidth)
            self.gmm = GaussianMixture(n_components=n_components, random_state=42)

        def fit(self, X):
            self.kde.fit(X)
            self.gmm.fit(X)
            return self

        def compare(self, X):
            return {
                'kde_ll': round(self.kde.score(X), 4),
                'gmm_ll': round(self.gmm.score(X), 4)
            }

    de = DensityEstimator().fit(X_real)
    print("Ex32 — DensityEstimator comparison:", de.compare(X_real))

def ex33():
    """SyntheticDataGenerator class"""
    class SyntheticDataGenerator:
        def __init__(self, n_components=2):
            self.gmm = GaussianMixture(n_components=n_components, random_state=42)
            self.scaler = StandardScaler()

        def fit(self, X):
            X_s = self.scaler.fit_transform(X)
            self.gmm.fit(X_s)
            return self

        def generate(self, n):
            X_gen_s, labels = self.gmm.sample(n)
            return self.scaler.inverse_transform(X_gen_s), labels

        def fidelity(self, X_real, X_gen):
            return {
                'mean_diff': float(np.mean(np.abs(X_real.mean(0) - X_gen.mean(0)))),
                'std_diff': float(np.mean(np.abs(X_real.std(0) - X_gen.std(0))))
            }

    gen = SyntheticDataGenerator().fit(X_real)
    X_syn, _ = gen.generate(300)
    fidelity = gen.fidelity(X_real, X_syn)
    print("Ex33 — SyntheticDataGenerator fidelity:", {k: round(v, 4) for k, v in fidelity.items()})

def ex34():
    """DistributionMatcher class"""
    class DistributionMatcher:
        def __init__(self):
            self.gmm = None

        def fit(self, X_source):
            best_bic, best_k = np.inf, 1
            for k in range(1, 5):
                g = GaussianMixture(n_components=k, random_state=42).fit(X_source)
                if g.bic(X_source) < best_bic:
                    best_bic = g.bic(X_source)
                    best_k = k
            self.gmm = GaussianMixture(n_components=best_k, random_state=42).fit(X_source)
            self.best_k_ = best_k
            return self

        def match(self, n):
            X_gen, _ = self.gmm.sample(n)
            return X_gen

    dm = DistributionMatcher().fit(X_real)
    X_matched = dm.match(200)
    print("Ex34 — DistributionMatcher: best_k={}, matched shape={}".format(
        dm.best_k_, X_matched.shape))
    print("       Real mean:", np.round(X_real.mean(0), 3),
          "Matched mean:", np.round(X_matched.mean(0), 3))

def ex35():
    """GenerativeModelEvaluator: FID concept + basic stats"""
    class GenerativeModelEvaluator:
        def evaluate(self, X_real, X_gen):
            # Maximum Mean Discrepancy (simplified, linear kernel)
            mu_r, mu_g = X_real.mean(0), X_gen.mean(0)
            mmd = float(np.sum((mu_r - mu_g) ** 2))
            # Coverage: fraction of real points within threshold of a generated point
            from sklearn.neighbors import NearestNeighbors
            nn = NearestNeighbors(n_neighbors=1).fit(X_gen)
            dists, _ = nn.kneighbors(X_real)
            threshold = np.percentile(dists, 95)
            coverage = float(np.mean(dists <= threshold))
            return {'mmd': round(mmd, 6), 'coverage': round(coverage, 4)}

    gmm = GaussianMixture(n_components=2, random_state=42).fit(X_real)
    X_gen, _ = gmm.sample(len(X_real))
    ev = GenerativeModelEvaluator()
    print("Ex35 — GenerativeModelEvaluator:", ev.evaluate(X_real, X_gen))

def ex36():
    """Full generative pipeline: fit GMM + generate synthetic + evaluate"""
    # Step 1: Fit
    scaler = StandardScaler()
    X_s = scaler.fit_transform(X_real)
    gmm = GaussianMixture(n_components=2, random_state=42).fit(X_s)
    # Step 2: Generate
    X_gen_s, _ = gmm.sample(len(X_real))
    X_gen = scaler.inverse_transform(X_gen_s)
    # Step 3: Evaluate
    ll = gmm.score(X_s)
    mean_diff = np.mean(np.abs(X_real.mean(0) - X_gen.mean(0)))
    std_diff = np.mean(np.abs(X_real.std(0) - X_gen.std(0)))
    print("Ex36 — Full pipeline: ll={:.4f}, mean_diff={:.4f}, std_diff={:.4f}".format(
        ll, mean_diff, std_diff))

def ex37():
    """Conditional generation concept (class-conditional)"""
    labels = np.array([0] * 150 + [1] * 150)
    gmm0 = GaussianMixture(n_components=1, random_state=42).fit(X_real[labels == 0])
    gmm1 = GaussianMixture(n_components=1, random_state=42).fit(X_real[labels == 1])
    X_cond0, _ = gmm0.sample(50)
    X_cond1, _ = gmm1.sample(50)
    print("Ex37 — Conditional generation:")
    print("       Class 0 mean:", np.round(X_cond0.mean(0), 3))
    print("       Class 1 mean:", np.round(X_cond1.mean(0), 3))

def ex38():
    """Production synthetic data service"""
    class ProductionSyntheticDataService:
        def __init__(self):
            self.scaler = StandardScaler()
            self.gmm = None
            self.metadata_ = {}

        def fit(self, X):
            X_s = self.scaler.fit_transform(X)
            bics = {}
            for k in range(1, 5):
                g = GaussianMixture(n_components=k, random_state=42).fit(X_s)
                bics[k] = g.bic(X_s)
            best_k = min(bics, key=bics.get)
            self.gmm = GaussianMixture(n_components=best_k, random_state=42).fit(X_s)
            self.metadata_ = {'n_components': best_k, 'train_ll': round(self.gmm.score(X_s), 4)}
            return self

        def generate(self, n, add_noise=True):
            X_s, _ = self.gmm.sample(n)
            if add_noise:
                X_s += np.random.randn(*X_s.shape) * 0.01
            return self.scaler.inverse_transform(X_s)

    svc = ProductionSyntheticDataService().fit(X_real)
    X_out = svc.generate(100)
    print("Ex38 — ProductionSyntheticDataService metadata:", svc.metadata_)
    print("       Generated shape:", X_out.shape)

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Diffusion model concept (forward + reverse)"""
    print("Ex39 — Diffusion Model concept (DDPM):")
    print("  Forward process: q(x_t | x_{t-1}) = N(x_t; sqrt(1-beta_t)*x_{t-1}, beta_t*I)")
    print("  Gradually add Gaussian noise over T steps until x_T ~ N(0,I)")
    print("  Reparameterized: x_t = sqrt(alpha_bar_t)*x_0 + sqrt(1-alpha_bar_t)*eps")
    print("  Reverse process: p_theta(x_{t-1}|x_t) = N(mu_theta(x_t,t), sigma^2 I)")
    print("  Neural net predicts added noise eps_theta(x_t, t)")
    print("  Loss: ||eps - eps_theta(sqrt(a_bar)*x_0 + sqrt(1-a_bar)*eps, t)||^2")

def ex40():
    """Score-based generative model concept"""
    print("Ex40 — Score-Based Generative Models:")
    print("  - Score function: s_theta(x) = nabla_x log p(x)")
    print("  - Train: minimize E[||s_theta(x) - nabla_x log p(x)||^2] via denoising")
    print("  - Sampling: Langevin dynamics: x_{t+1} = x_t + eps*s_theta(x_t) + sqrt(2eps)*z")
    print("  - SMLD (Song 2019): multiple noise scales for better score estimation")
    print("  - Unified with diffusion: SDEs framework (Song 2021)")
    print("  - Exact log-likelihood via probability flow ODE")

def ex41():
    """Energy-based model concept"""
    print("Ex41 — Energy-Based Models (EBM) concept:")
    print("  - p_theta(x) = exp(-E_theta(x)) / Z  (Z = partition function)")
    print("  - E_theta: neural network mapping x -> scalar energy")
    print("  - Low energy = high probability regions (data manifold)")
    print("  - Training: contrastive divergence or score matching")
    print("  - Sampling: MCMC (Langevin dynamics, HMC)")
    print("  - Challenge: computing Z is intractable; requires approximations")

def ex42():
    """Flow matching concept"""
    print("Ex42 — Flow Matching concept (Lipman 2022):")
    print("  - Learn a vector field v_theta(x, t) that transports noise to data")
    print("  - ODE: dx/dt = v_theta(x, t)")
    print("  - Loss: E[||v_theta(x_t, t) - u_t(x_t | z)||^2]  (conditional flow matching)")
    print("  - x_t = (1-t)*x_0 + t*x_1 (linear interpolation: noise → data)")
    print("  - Target vector field: u_t = x_1 - x_0 (constant for straight paths)")
    print("  - Faster training + sampling than diffusion, no SDE needed")

def ex43():
    """Consistency model concept"""
    print("Ex43 — Consistency Models concept (Song 2023):")
    print("  - Learn f_theta: (x_t, t) -> x_0 directly (skip diffusion steps)")
    print("  - Consistency property: f(x_t, t) = f(x_t', t') for all t,t' on same ODE path")
    print("  - Training: consistency distillation (from pretrained diffusion) OR")
    print("             consistency training (self-supervised, no teacher)")
    print("  - Generation: single-step or few-step sampling")
    print("  - 10-50x faster than DDPM while maintaining sample quality")

def ex44():
    """GAN variants concepts"""
    print("Ex44 — GAN Variants:")
    print("  DCGAN: convolutional G and D; batch norm; eliminates fully connected layers")
    print("  StyleGAN: style-based G with AdaIN; controls coarse/fine details separately")
    print("  StyleGAN2: path length regularization; removes progressive growing; fixes artifacts")
    print("  BigGAN: large-scale class-conditional; class embeddings via shared embedding")
    print("  ProgressiveGAN: grow G and D progressively from low to high resolution")
    print("  CycleGAN: unpaired image-to-image; cycle consistency loss")

def ex45():
    """Conditional GAN (cGAN) concept"""
    print("Ex45 — Conditional GAN (cGAN) concept:")
    print("  - Condition both G and D on class label y (or any auxiliary info)")
    print("  - G: z, y -> fake sample of class y")
    print("  - D: x, y -> P(real | x is class y)")
    print("  - Implementation: concatenate one-hot(y) to z (for G) and x (for D)")
    print("  - Or: use embedding layer for y, project and add to feature maps")
    # Simple cGAN concept demo with random data
    np.random.seed(42)
    z = np.random.randn(10, 8)
    y_onehot = np.eye(2)[np.random.randint(0, 2, 10)]
    z_cond = np.hstack([z, y_onehot])
    print("  - Conditional z shape:", z_cond.shape, "(latent + one-hot label)")

def ex46():
    """Image-to-image translation concept (pix2pix)"""
    print("Ex46 — Image-to-Image Translation (pix2pix) concept:")
    print("  - Conditional GAN: G maps input image to target image")
    print("  - G: encoder-decoder (U-Net) with skip connections")
    print("  - D: PatchGAN — classifies each N×N patch as real/fake")
    print("  - Loss: adversarial_loss + lambda * L1_loss(G(x), y)")
    print("  - Applications: semantic maps → photos, edges → objects, day → night")
    print("  - Unpaired version: CycleGAN (no paired training data needed)")

def ex47():
    """Text-to-image concept (DALL-E / Stable Diffusion)"""
    print("Ex47 — Text-to-Image Generation concept:")
    print("  DALL-E 2: CLIP text embedding → diffusion model in CLIP image space")
    print("  Stable Diffusion: latent diffusion (operate in VAE latent space, not pixels)")
    print("    1. Encode image: x → VAE encoder → z_0 (4×H/8×W/8 latent)")
    print("    2. Add noise: z_0 → z_T via forward diffusion")
    print("    3. Denoise: z_T → z_0 with UNet conditioned on CLIP text embedding")
    print("    4. Decode: z_0 → VAE decoder → pixel image")
    print("  Key: cross-attention in UNet injects text conditioning at each resolution")

def ex48():
    """Music generation concept"""
    print("Ex48 — Music Generation concept:")
    print("  MuseNet (OpenAI): Transformer on MIDI tokens (note, velocity, time)")
    print("  MusicLM (Google): hierarchical seq-to-seq on AudioLM tokens")
    print("  MusicGen (Meta): single-stage Transformer with audio codec (EnCodec)")
    print("  AudioCraft: EnCodec compresses audio → discrete tokens → Transformer")
    print("  Key challenge: long-range structure (melody, harmony, rhythm over minutes)")
    print("  Conditioning: text prompt, melody, genre, instruments, BPM")

def ex49():
    """Molecule generation concept"""
    print("Ex49 — Molecule Generation concept:")
    print("  SMILES-based: RNN/Transformer generates SMILES strings character by character")
    print("  Graph-based: GraphVAE / JTVAE generates molecular graphs directly")
    print("  Diffusion-based: EDM / DiffSBDD generates 3D atom positions and types")
    print("  Property optimization: RL fine-tuning on drug-likeness (QED, SA score)")
    print("  REINVENT: SMILES RNN + RL for multi-objective drug design")
    print("  Validation: RDKit checks valency, aromaticity, synthesizability")

def ex50():
    """Production generative AI architecture"""
    print("Ex50 — Production Generative AI Architecture:")
    print("  1. Model hosting: GPU inference server (NVIDIA Triton / vLLM)")
    print("  2. Latency optimization: model quantization (FP16/INT8), compilation (TorchScript)")
    print("  3. Request batching: dynamic batching for throughput vs latency tradeoff")
    print("  4. Prompt management: template versioning, injection prevention")
    print("  5. Output filtering: safety classifiers, watermarking (C2PA)")
    print("  6. Caching: semantic cache for similar prompts (embedding search)")
    print("  7. Monitoring: generation quality metrics, user feedback, toxicity rates")
    print("  8. Cost control: tiered model routing (small model for simple requests)")


def main():
    print("=" * 60)
    print("Examples 4.4 — Generative Models")
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
