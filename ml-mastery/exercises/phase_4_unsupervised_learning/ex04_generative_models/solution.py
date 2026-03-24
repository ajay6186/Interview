# ============================================================
# Solution 4.4 — Generative Models
# ============================================================

import numpy as np
from sklearn.mixture import GaussianMixture
from sklearn.neighbors import KernelDensity
from sklearn.naive_bayes import GaussianNB
from sklearn.datasets import make_blobs
from sklearn.preprocessing import StandardScaler

np.random.seed(42)

X_real, y_real = make_blobs(n_samples=200, centers=2, cluster_std=0.5,
                             random_state=42)
scaler = StandardScaler()
X_real_scaled = scaler.fit_transform(X_real)

data_1d = np.concatenate([
    np.random.normal(-2, 0.5, 100),
    np.random.normal(2, 0.5, 100),
])


# ---------------------------------------------------------------------------
# Solution 1: Gaussian Density Estimation
# ---------------------------------------------------------------------------

def gaussian_density_estimation(data: np.ndarray, n_samples: int = 50):
    mu = float(np.mean(data))
    sigma = float(np.std(data))
    samples = np.random.normal(mu, sigma, n_samples)
    return mu, sigma, samples


# ---------------------------------------------------------------------------
# Solution 2: KDE
# ---------------------------------------------------------------------------

def kde_estimation(data: np.ndarray, n_samples: int = 50):
    kde = KernelDensity(kernel='gaussian', bandwidth=0.5)
    kde.fit(data.reshape(-1, 1))
    samples = kde.sample(n_samples, random_state=42).ravel()
    return kde, samples


# ---------------------------------------------------------------------------
# Solution 3: GMM Generative
# ---------------------------------------------------------------------------

def gmm_generative(X: np.ndarray, n_samples: int = 50):
    gmm = GaussianMixture(n_components=2, random_state=42)
    gmm.fit(X)
    X_gen, y_gen = gmm.sample(n_samples)
    return gmm, X_gen, y_gen


# ---------------------------------------------------------------------------
# Solution 4: Naive Bayes Generative
# ---------------------------------------------------------------------------

def naive_bayes_generative(X: np.ndarray, y: np.ndarray, n_per_class: int = 25):
    model = GaussianNB()
    model.fit(X, y)
    classes = model.classes_
    synthetic_parts = []
    for i, c in enumerate(classes):
        means = model.theta_[i]    # (n_features,)
        variances = model.var_[i]  # (n_features,)
        samples = np.random.normal(
            loc=means,
            scale=np.sqrt(variances),
            size=(n_per_class, len(means))
        )
        synthetic_parts.append(samples)
    X_synthetic = np.vstack(synthetic_parts)
    return model, X_synthetic


# ---------------------------------------------------------------------------
# Solution 5: Bayesian Network Concept
# ---------------------------------------------------------------------------

def bayesian_network_concept() -> dict:
    concept = {
        'definition': (
            'A Bayesian Network is a directed acyclic graph (DAG) where nodes '
            'represent random variables and edges encode conditional dependencies. '
            'Each node has a conditional probability table (CPT) P(Xi | parents(Xi)).'
        ),
        'factorization': (
            'Joint distribution: P(X1, X2, ..., Xn) = ∏ P(Xi | parents(Xi)). '
            'This factorization exploits conditional independence to reduce the '
            'number of parameters from exponential to linear in the number of edges.'
        ),
        'example': (
            'Rain → Wet Grass ← Sprinkler. '
            'P(Rain, Sprinkler, Wet) = P(Rain) * P(Sprinkler) * P(Wet | Rain, Sprinkler). '
            'Libraries: pgmpy, pymc, bnlearn.'
        ),
    }
    print("\nBayesian Network Concept:")
    for k, v in concept.items():
        print(f"  {k}: {v}\n")
    return concept


# ---------------------------------------------------------------------------
# Solution 6: VAE Concept
# ---------------------------------------------------------------------------

def vae_concept() -> dict:
    concept = {
        'encoder': (
            'Encoder q(z|x): maps input x to latent distribution parameters (μ, σ). '
            'Network: Input → Dense(256, relu) → Dense(128, relu) → [μ_layer, logσ²_layer]'
        ),
        'reparameterization': (
            'z = μ + σ * ε,  where ε ~ N(0, I). '
            'Enables backprop through the sampling step (gradient flows through μ and σ).'
        ),
        'decoder': (
            'Decoder p(x|z): maps latent z back to data space. '
            'Network: Dense(128, relu) → Dense(256, relu) → Dense(input_dim, sigmoid)'
        ),
        'loss': (
            'ELBO = E[log p(x|z)] - KL(q(z|x) || p(z)). '
            'Reconstruction loss + KL divergence regularizer. '
            'KL = -0.5 * Σ(1 + logσ² - μ² - σ²)'
        ),
    }
    print("\nVAE Architecture:")
    for k, v in concept.items():
        print(f"  {k}: {v}\n")
    return concept


# ---------------------------------------------------------------------------
# Solution 7: VAE Loss
# ---------------------------------------------------------------------------

def vae_loss(reconstruction_loss: float, kl_loss: float,
              beta: float = 1.0) -> float:
    return reconstruction_loss + beta * kl_loss


# ---------------------------------------------------------------------------
# Solution 8: GAN Concept
# ---------------------------------------------------------------------------

def gan_concept() -> dict:
    concept = {
        'generator': (
            'G(z): maps noise z ~ p(z) to data space. '
            'Goal: produce samples indistinguishable from real data. '
            'Architecture: Dense → BN → ReLU → ... → output (tanh).'
        ),
        'discriminator': (
            'D(x): binary classifier — real (1) vs fake (0). '
            'Goal: distinguish real samples from generator output. '
            'Architecture: Dense → LeakyReLU → ... → sigmoid.'
        ),
        'objective': (
            'minimax: min_G max_D  E[log D(x)] + E[log(1 - D(G(z)))]. '
            'D maximizes probability of correct classification. '
            'G minimizes probability that D classifies its output as fake.'
        ),
        'training': (
            'Alternate: (1) Train D on real + fake. (2) Train G to fool D. '
            'Convergence: Nash equilibrium where G reproduces true distribution. '
            'Challenges: mode collapse, vanishing gradients, training instability.'
        ),
    }
    print("\nGAN Framework:")
    for k, v in concept.items():
        print(f"  {k}: {v}\n")
    return concept


# ---------------------------------------------------------------------------
# Solution 9: GAN Training Loop
# ---------------------------------------------------------------------------

def gan_training_loop() -> list:
    steps = [
        "1. Sample noise z ~ N(0, I) of shape (batch_size, latent_dim)",
        "2. Generate fake samples: x_fake = G(z)",
        "3. Sample real data: x_real ~ p_data",
        "4. Compute D loss: L_D = -[E[log D(x_real)] + E[log(1 - D(x_fake))]]",
        "5. Update D weights via gradient ascent (maximize D's classification)",
        "6. Sample new noise z ~ N(0, I)",
        "7. Compute G loss: L_G = -E[log D(G(z))]  (non-saturating: maximize D(G(z)))",
        "8. Update G weights via gradient descent",
        "9. Repeat for N epochs; monitor FID or IS for sample quality",
    ]
    print("\nGAN Training Loop:")
    for step in steps:
        print(f"  {step}")
    return steps


# ---------------------------------------------------------------------------
# Solution 10: Diffusion Concept
# ---------------------------------------------------------------------------

def diffusion_concept() -> dict:
    concept = {
        'forward_process': (
            'Gradually add Gaussian noise to data over T steps: '
            'q(x_t | x_{t-1}) = N(x_t; √(1-β_t) x_{t-1}, β_t I). '
            'At t=T, x_T ≈ N(0, I) (pure noise).'
        ),
        'reverse_process': (
            'Learn to denoise: p_θ(x_{t-1} | x_t) = N(x_{t-1}; μ_θ(x_t, t), Σ_θ). '
            'A neural network (U-Net) predicts the noise ε added at each step. '
            'Sampling: start from N(0,I) and iteratively denoise.'
        ),
        'score_function': (
            'Score: ∇_x log p(x). Neural network learns s_θ(x,t) ≈ ∇_x log p_t(x). '
            'Training objective (denoising score matching): '
            'E[ ||s_θ(x_t, t) - ∇_xt log q(x_t|x_0)||² ]. '
            'Langevin dynamics: x_{t-1} = x_t + η s_θ(x_t,t) + √(2η) ε.'
        ),
    }
    print("\nScore-Based Diffusion:")
    for k, v in concept.items():
        print(f"  {k}: {v}\n")
    return concept


# ---------------------------------------------------------------------------
# Solution 11: Sample from GMM
# ---------------------------------------------------------------------------

def sample_from_gmm(X: np.ndarray):
    gmm = GaussianMixture(n_components=2, random_state=42)
    gmm.fit(X)
    X_gen, y_gen = gmm.sample(100)
    print("GMM samples (first 3):\n", np.round(X_gen[:3], 4))
    return X_gen, y_gen


# ---------------------------------------------------------------------------
# Solution 12: Evaluate Generated Samples
# ---------------------------------------------------------------------------

def evaluate_generated(X_real: np.ndarray, X_gen: np.ndarray) -> dict:
    mean_diff = float(np.mean(np.abs(X_real.mean(axis=0) - X_gen.mean(axis=0))))
    std_diff = float(np.mean(np.abs(X_real.std(axis=0) - X_gen.std(axis=0))))
    return {
        'mean_diff': round(mean_diff, 6),
        'std_diff': round(std_diff, 6),
    }


# ---------------------------------------------------------------------------
# Solution 13: Normalizing Flows
# ---------------------------------------------------------------------------

def normalizing_flows_concept() -> dict:
    concept = {
        'idea': (
            'Transform a simple base distribution (e.g. N(0,I)) into a complex '
            'distribution via a sequence of invertible, differentiable mappings f. '
            'Both sampling (z → x) and density evaluation (x → z) are tractable.'
        ),
        'change_of_variables': (
            'log p(x) = log p(z) - log|det J_f(z)|  where z = f^{-1}(x). '
            'The Jacobian determinant accounts for the volume change under f. '
            'Training: maximize log p(x) over dataset.'
        ),
        'examples': (
            'RealNVP: coupling layers with masked affine transforms. '
            'Glow: generative flow with 1x1 invertible convolutions. '
            'MAF: masked autoregressive flow for density estimation. '
            'NSF: neural spline flows for flexible univariate transforms.'
        ),
    }
    print("\nNormalizing Flows:")
    for k, v in concept.items():
        print(f"  {k}: {v}\n")
    return concept


# ---------------------------------------------------------------------------
# Solution 14: Data Augmentation
# ---------------------------------------------------------------------------

def data_augmentation(X: np.ndarray, y: np.ndarray, n_synthetic: int = 50):
    X_minority = X[y == 0]
    gmm = GaussianMixture(n_components=2, random_state=42)
    gmm.fit(X_minority)
    X_syn, _ = gmm.sample(n_synthetic)
    y_syn = np.zeros(n_synthetic, dtype=y.dtype)

    X_aug = np.vstack([X, X_syn])
    y_aug = np.concatenate([y, y_syn])
    return X_aug, y_aug


# ---------------------------------------------------------------------------
# Solution 15: Generative Model Comparison
# ---------------------------------------------------------------------------

def generative_model_comparison() -> dict:
    comparison = {
        'GMM': {
            'type': 'Probabilistic / parametric',
            'scalable': 'Yes (EM algorithm)',
            'mode_coverage': 'Limited to k Gaussians',
            'sample_quality': 'Good for Gaussian-like data',
            'density_evaluation': 'Exact',
            'training': 'EM algorithm (fast)',
        },
        'KDE': {
            'type': 'Non-parametric',
            'scalable': 'No (O(n) per evaluation)',
            'mode_coverage': 'Full (kernel around each point)',
            'sample_quality': 'Good for low dimensions',
            'density_evaluation': 'Exact (but slow)',
            'training': 'Bandwidth selection only',
        },
        'VAE': {
            'type': 'Deep latent variable model',
            'scalable': 'Yes (amortized inference)',
            'mode_coverage': 'Good (continuous latent space)',
            'sample_quality': 'Moderate (blurry for images)',
            'density_evaluation': 'Approximate (ELBO lower bound)',
            'training': 'SGD, stable',
        },
        'GAN': {
            'type': 'Implicit generative model',
            'scalable': 'Yes (GPU training)',
            'mode_coverage': 'Risk of mode collapse',
            'sample_quality': 'Excellent (sharp images)',
            'density_evaluation': 'Not available',
            'training': 'Adversarial (unstable)',
        },
    }
    print("\nGenerative Model Comparison:")
    for model, props in comparison.items():
        print(f"\n  {model}:")
        for k, v in props.items():
            print(f"    {k}: {v}")
    return comparison


def main():
    print("=== Solution 4.4: Generative Models ===\n")

    mu, sigma, samples = gaussian_density_estimation(data_1d)
    print(f"Result 1 — Gaussian: mean={mu:.3f}, std={sigma:.3f}, samples shape: {samples.shape}")

    _, kde_samples = kde_estimation(data_1d)
    print("Result 2 — KDE samples shape:", kde_samples.shape,
          "| range: [{:.2f}, {:.2f}]".format(kde_samples.min(), kde_samples.max()))

    gmm_m, X_gen, y_gen = gmm_generative(X_real)
    print("Result 3 — GMM generated shape:", X_gen.shape)

    _, X_syn = naive_bayes_generative(X_real, y_real)
    print("Result 4 — NB synthetic shape:", X_syn.shape)

    bn = bayesian_network_concept()
    print("Result 5 — BN keys:", list(bn.keys()))

    vae = vae_concept()
    print("Result 6 — VAE keys:", list(vae.keys()))

    total_loss = vae_loss(0.5, 0.1)
    print("Result 7 — VAE total loss:", total_loss)

    gan = gan_concept()
    print("Result 8 — GAN keys:", list(gan.keys()))

    loop = gan_training_loop()
    print("Result 9 — GAN loop steps:", len(loop))

    diff = diffusion_concept()
    print("Result 10 — Diffusion keys:", list(diff.keys()))

    X_gmm_samples, _ = sample_from_gmm(X_real)
    print("Result 11 — GMM samples shape:", X_gmm_samples.shape)

    eval_r = evaluate_generated(X_real, X_gen)
    print("Result 12 — Distribution diff:", eval_r)

    nf = normalizing_flows_concept()
    print("Result 13 — NF keys:", list(nf.keys()))

    X_aug, y_aug = data_augmentation(X_real, y_real)
    print("Result 14 — Augmented shape:", X_aug.shape,
          "| original:", X_real.shape)

    comp = generative_model_comparison()
    print("Result 15 — Models compared:", list(comp.keys()))


if __name__ == "__main__":
    main()
