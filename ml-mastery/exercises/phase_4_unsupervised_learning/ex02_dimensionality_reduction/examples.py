# ============================================================
# Examples 4.2 — Dimensionality Reduction (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import pandas as pd
from sklearn.datasets import make_classification, load_iris
from sklearn.decomposition import (PCA, TruncatedSVD, FactorAnalysis, NMF,
                                    KernelPCA, IncrementalPCA, SparsePCA,
                                    FastICA, DictionaryLearning)
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.manifold import TSNE, Isomap, LocallyLinearEmbedding, SpectralEmbedding, MDS
from sklearn.random_projection import GaussianRandomProjection
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

np.random.seed(42)
X_raw, y = make_classification(n_samples=300, n_features=20, n_informative=8,
                                n_redundant=4, random_state=42)
scaler = StandardScaler()
X = scaler.fit_transform(X_raw)

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """PCA fit_transform to 2 components"""
    pca = PCA(n_components=2)
    X_2d = pca.fit_transform(X)
    print("Ex01 — PCA 2D shape:", X_2d.shape, "first row:", np.round(X_2d[0], 3))

def ex02():
    """Explained variance ratio"""
    pca = PCA(n_components=5).fit(X)
    print("Ex02 — Explained variance ratio (5 PCs):", np.round(pca.explained_variance_ratio_, 4))

def ex03():
    """Cumulative explained variance"""
    pca = PCA().fit(X)
    cum_var = np.cumsum(pca.explained_variance_ratio_)
    print("Ex03 — Cumulative variance (first 5):", np.round(cum_var[:5], 4))

def ex04():
    """PCA components (loadings)"""
    pca = PCA(n_components=3).fit(X)
    print("Ex04 — PCA components shape:", pca.components_.shape)
    print("       PC1 loadings:", np.round(pca.components_[0][:5], 3), "...")

def ex05():
    """Reconstruct data from PCA (inverse_transform)"""
    pca = PCA(n_components=5)
    X_reduced = pca.fit_transform(X)
    X_reconstructed = pca.inverse_transform(X_reduced)
    print("Ex05 — Original shape:", X.shape, "Reconstructed shape:", X_reconstructed.shape)

def ex06():
    """PCA reconstruction error"""
    pca = PCA(n_components=5)
    X_rec = pca.inverse_transform(pca.fit_transform(X))
    error = np.mean((X - X_rec) ** 2)
    print("Ex06 — PCA reconstruction MSE (5 PCs):", round(error, 6))

def ex07():
    """TruncatedSVD (sparse-safe PCA)"""
    from scipy.sparse import csr_matrix
    X_sparse = csr_matrix(X_raw - X_raw.min())
    svd = TruncatedSVD(n_components=5, random_state=42)
    X_svd = svd.fit_transform(X_sparse)
    print("Ex07 — TruncatedSVD output shape:", X_svd.shape)
    print("       Explained variance ratio:", np.round(svd.explained_variance_ratio_, 4))

def ex08():
    """Linear Discriminant Analysis (supervised)"""
    lda = LinearDiscriminantAnalysis(n_components=1)
    X_lda = lda.fit_transform(X, y)
    print("Ex08 — LDA output shape:", X_lda.shape)
    print("       Explained variance ratio:", np.round(lda.explained_variance_ratio_, 4))

def ex09():
    """Factor Analysis"""
    fa = FactorAnalysis(n_components=5, random_state=42)
    X_fa = fa.fit_transform(X)
    print("Ex09 — Factor Analysis output shape:", X_fa.shape)
    print("       Noise variance (first 5 feats):", np.round(fa.noise_variance_[:5], 4))

def ex10():
    """NMF: Non-negative Matrix Factorization"""
    X_nn = X_raw - X_raw.min()
    nmf = NMF(n_components=5, random_state=42, max_iter=500)
    X_nmf = nmf.fit_transform(X_nn)
    print("Ex10 — NMF output shape:", X_nmf.shape)
    print("       Reconstruction error:", round(nmf.reconstruction_err_, 4))

def ex11():
    """Kernel PCA with RBF kernel"""
    kpca = KernelPCA(n_components=5, kernel='rbf', gamma=0.1, random_state=42)
    X_kpca = kpca.fit_transform(X)
    print("Ex11 — Kernel PCA (RBF) output shape:", X_kpca.shape)

def ex12():
    """Incremental PCA (mini-batch)"""
    ipca = IncrementalPCA(n_components=5, batch_size=50)
    X_ipca = ipca.fit_transform(X)
    print("Ex12 — Incremental PCA output shape:", X_ipca.shape)
    print("       Explained variance ratio:", np.round(ipca.explained_variance_ratio_, 4))

def ex13():
    """Sparse PCA"""
    spca = SparsePCA(n_components=5, random_state=42, max_iter=50, n_jobs=1)
    X_spca = spca.fit_transform(X[:50])
    print("Ex13 — Sparse PCA output shape:", X_spca.shape)
    print("       Non-zero component elements:", np.sum(spca.components_ != 0))

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Find n_components for 95% variance"""
    pca = PCA().fit(X)
    cum_var = np.cumsum(pca.explained_variance_ratio_)
    n95 = np.searchsorted(cum_var, 0.95) + 1
    print("Ex14 — Components for 95% variance:", n95,
          "(out of {})".format(X.shape[1]))

def ex15():
    """PCA whitening"""
    pca = PCA(n_components=5, whiten=True)
    X_white = pca.fit_transform(X)
    cov = np.cov(X_white.T)
    print("Ex15 — Whitened PCA diagonal (should be ~1):", np.round(np.diag(cov), 3))

def ex16():
    """PCA for noise reduction"""
    noise = np.random.randn(*X.shape) * 0.5
    X_noisy = X + noise
    pca = PCA(n_components=8)
    X_denoised = pca.inverse_transform(pca.fit_transform(X_noisy))
    orig_err = np.mean((X_noisy - X) ** 2)
    denoised_err = np.mean((X_denoised - X) ** 2)
    print("Ex16 — Noisy MSE: {:.4f}, Denoised MSE: {:.4f}".format(orig_err, denoised_err))

def ex17():
    """Scree plot data: eigenvalues vs component number"""
    pca = PCA().fit(X)
    eigenvalues = pca.explained_variance_[:8]
    print("Ex17 — Scree plot eigenvalues (first 8):", np.round(eigenvalues, 3))

def ex18():
    """Biplot data: component loadings vs feature indices"""
    pca = PCA(n_components=2).fit(X)
    loadings = pca.components_.T
    top3 = np.argsort(np.abs(loadings[:, 0]))[-3:]
    print("Ex18 — Top 3 features on PC1:", top3,
          "loadings:", np.round(loadings[top3, 0], 3))

def ex19():
    """t-SNE 2D embedding"""
    tsne = TSNE(n_components=2, random_state=42, perplexity=30, n_iter=500)
    X_tsne = tsne.fit_transform(X[:100])
    print("Ex19 — t-SNE output shape:", X_tsne.shape)
    print("       KL divergence:", round(tsne.kl_divergence_, 4))

def ex20():
    """t-SNE perplexity effect"""
    for perp in [5, 30, 50]:
        tsne = TSNE(n_components=2, perplexity=perp, random_state=42, n_iter=500)
        X_t = tsne.fit_transform(X[:100])
        spread = np.std(X_t)
        print(f"Ex20 — t-SNE perplexity={perp}: spread={round(spread, 3)}")

def ex21():
    """UMAP concept (print code — requires umap-learn)"""
    print("Ex21 — UMAP concept:")
    print("  # pip install umap-learn")
    print("  import umap")
    print("  reducer = umap.UMAP(n_components=2, n_neighbors=15, min_dist=0.1)")
    print("  X_umap = reducer.fit_transform(X)")
    print("  # Preserves both local AND global structure better than t-SNE")
    print("  # Much faster than t-SNE on large datasets")

def ex22():
    """Isomap: geodesic distances"""
    iso = Isomap(n_components=5, n_neighbors=10)
    X_iso = iso.fit_transform(X)
    print("Ex22 — Isomap output shape:", X_iso.shape)
    print("       Reconstruction error:", round(iso.reconstruction_error(), 4))

def ex23():
    """LocallyLinearEmbedding"""
    lle = LocallyLinearEmbedding(n_components=5, n_neighbors=10, random_state=42)
    X_lle = lle.fit_transform(X)
    print("Ex23 — LLE output shape:", X_lle.shape)
    print("       Reconstruction error:", round(lle.reconstruction_error_, 6))

def ex24():
    """SpectralEmbedding"""
    se = SpectralEmbedding(n_components=5, random_state=42)
    X_se = se.fit_transform(X[:100])
    print("Ex24 — Spectral Embedding output shape:", X_se.shape)

def ex25():
    """MDS: multidimensional scaling"""
    mds = MDS(n_components=2, random_state=42, n_init=2, max_iter=300)
    X_mds = mds.fit_transform(X[:100])
    print("Ex25 — MDS output shape:", X_mds.shape)
    print("       Stress:", round(mds.stress_, 4))

def ex26():
    """Random Projections (Johnson-Lindenstrauss)"""
    rp = GaussianRandomProjection(n_components=10, random_state=42)
    X_rp = rp.fit_transform(X)
    print("Ex26 — Random Projection output shape:", X_rp.shape)
    orig_dist = np.linalg.norm(X[0] - X[1])
    proj_dist = np.linalg.norm(X_rp[0] - X_rp[1])
    print("       Dist ratio (projected/original):", round(proj_dist / orig_dist, 3))

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """PCAAnalyzer class: fit, variance summary, reconstruct"""
    class PCAAnalyzer:
        def __init__(self):
            self.pca_ = None

        def fit(self, X, n_components=None):
            self.pca_ = PCA(n_components=n_components)
            self.X_reduced_ = self.pca_.fit_transform(X)
            return self

        def variance_summary(self):
            cum = np.cumsum(self.pca_.explained_variance_ratio_)
            return {f'PC{i+1}': round(float(c), 4) for i, c in enumerate(cum[:5])}

        def reconstruct(self, X):
            return self.pca_.inverse_transform(self.pca_.transform(X))

        def reconstruction_mse(self, X):
            return round(float(np.mean((X - self.reconstruct(X)) ** 2)), 6)

    analyzer = PCAAnalyzer().fit(X, n_components=10)
    print("Ex27 — PCAAnalyzer variance:", analyzer.variance_summary())
    print("       Reconstruction MSE:", analyzer.reconstruction_mse(X))

def ex28():
    """DimensionalityReducer class: multiple methods"""
    class DimensionalityReducer:
        def __init__(self, n_components=5):
            self.n = n_components
            self.methods = {
                'pca': PCA(n_components=n_components),
                'svd': TruncatedSVD(n_components=n_components, random_state=42),
                'fa': FactorAnalysis(n_components=n_components, random_state=42),
            }

        def fit_transform_all(self, X):
            results = {}
            for name, model in self.methods.items():
                results[name] = model.fit_transform(X).shape
            return results

    dr = DimensionalityReducer(n_components=5)
    print("Ex28 — DimensionalityReducer output shapes:", dr.fit_transform_all(X))

def ex29():
    """AutoPCASelector: select n_components for variance threshold"""
    class AutoPCASelector:
        def __init__(self, variance_threshold=0.90):
            self.threshold = variance_threshold
            self.n_components_ = None

        def fit(self, X):
            pca = PCA().fit(X)
            cum_var = np.cumsum(pca.explained_variance_ratio_)
            self.n_components_ = int(np.searchsorted(cum_var, self.threshold) + 1)
            self.pca_ = PCA(n_components=self.n_components_).fit(X)
            return self

        def transform(self, X):
            return self.pca_.transform(X)

    sel = AutoPCASelector(variance_threshold=0.90).fit(X)
    X_sel = sel.transform(X)
    print("Ex29 — AutoPCASelector: n_components={}, output shape={}".format(
        sel.n_components_, X_sel.shape))

def ex30():
    """FeatureExtractionPipeline class"""
    class FeatureExtractionPipeline:
        def __init__(self, n_components=8):
            self.steps = [
                ('scaler', StandardScaler()),
                ('pca', PCA(n_components=n_components))
            ]

        def fit(self, X):
            out = X.copy()
            for name, step in self.steps:
                out = step.fit_transform(out)
            return self

        def transform(self, X):
            out = X.copy()
            for name, step in self.steps:
                out = step.transform(out)
            return out

        def fit_transform(self, X):
            return self.fit(X).transform(X)

    pipe = FeatureExtractionPipeline(n_components=8)
    X_out = pipe.fit_transform(X)
    print("Ex30 — FeatureExtractionPipeline output shape:", X_out.shape)

def ex31():
    """ManifoldComparison class: compare Isomap, LLE, MDS on small data"""
    class ManifoldComparison:
        def __init__(self, n_components=2):
            self.n = n_components
            self.methods = {
                'isomap': Isomap(n_components=n_components, n_neighbors=10),
                'lle': LocallyLinearEmbedding(n_components=n_components,
                                              n_neighbors=10, random_state=42),
            }

        def compare(self, X):
            results = {}
            for name, model in self.methods.items():
                X_out = model.fit_transform(X)
                results[name] = {'shape': X_out.shape, 'std': round(float(X_out.std()), 4)}
            return results

    mc = ManifoldComparison().compare(X[:80])
    print("Ex31 — ManifoldComparison:", mc)

def ex32():
    """PCA + clustering pipeline"""
    from sklearn.cluster import KMeans
    from sklearn.metrics import silhouette_score
    pca = PCA(n_components=5)
    X_pca = pca.fit_transform(X)
    km = KMeans(n_clusters=4, random_state=42, n_init=10).fit(X_pca)
    sil_orig = silhouette_score(X, km.labels_)
    sil_pca = silhouette_score(X_pca, km.labels_)
    print("Ex32 — PCA+KMeans: sil_original={:.4f}, sil_pca_space={:.4f}".format(
        sil_orig, sil_pca))

def ex33():
    """PCA for visualization: project to 2D and show cluster separation"""
    from sklearn.cluster import KMeans
    km = KMeans(n_clusters=4, random_state=42, n_init=10).fit(X)
    pca = PCA(n_components=2)
    X_2d = pca.fit_transform(X)
    df = pd.DataFrame(X_2d, columns=['pc1', 'pc2'])
    df['cluster'] = km.labels_
    print("Ex33 — 2D projection cluster centroids:")
    print(df.groupby('cluster')[['pc1', 'pc2']].mean().round(3).to_string())

def ex34():
    """PCA for compression: reconstruction error vs n_components"""
    errors = {}
    for n in [1, 3, 5, 8, 10, 15, 20]:
        n = min(n, X.shape[1])
        pca = PCA(n_components=n)
        X_rec = pca.inverse_transform(pca.fit_transform(X))
        errors[n] = round(float(np.mean((X - X_rec) ** 2)), 6)
    print("Ex34 — Reconstruction MSE vs n_components:", errors)

def ex35():
    """Dimensionality reduction benchmark"""
    methods = {
        'PCA-5': PCA(n_components=5),
        'PCA-10': PCA(n_components=10),
        'FA-5': FactorAnalysis(n_components=5, random_state=42),
    }
    for name, model in methods.items():
        X_out = model.fit_transform(X)
        var = round(float(X_out.var()), 4)
        print(f"Ex35 — {name}: output shape {X_out.shape}, variance {var}")

def ex36():
    """Production PCA pipeline: fit on train, transform test"""
    X_train, X_test = train_test_split(X, test_size=0.2, random_state=42)
    pca = PCA(n_components=8).fit(X_train)
    X_train_pca = pca.transform(X_train)
    X_test_pca = pca.transform(X_test)
    train_err = float(np.mean((X_train - pca.inverse_transform(X_train_pca)) ** 2))
    test_err = float(np.mean((X_test - pca.inverse_transform(X_test_pca)) ** 2))
    print("Ex36 — Production PCA: train_MSE={:.6f}, test_MSE={:.6f}".format(
        train_err, test_err))

def ex37():
    """Pipeline: StandardScaler + PCA + LogisticRegression"""
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42)
    pipe = Pipeline([
        ('scaler', StandardScaler()),
        ('pca', PCA(n_components=8)),
        ('clf', LogisticRegression(max_iter=500, random_state=42))
    ])
    pipe.fit(X_train, y_train)
    score = pipe.score(X_test, y_test)
    print("Ex37 — Scaler+PCA+LR accuracy:", round(score, 4))

def ex38():
    """Feature extraction comparison: PCA vs FA vs ICA"""
    extractors = {
        'PCA': PCA(n_components=5),
        'FactorAnalysis': FactorAnalysis(n_components=5, random_state=42),
        'FastICA': FastICA(n_components=5, random_state=42, max_iter=500),
    }
    for name, model in extractors.items():
        X_out = model.fit_transform(X)
        kurtosis_mean = float(np.mean(np.abs(
            np.mean(X_out ** 4, axis=0) / (np.var(X_out, axis=0) ** 2) - 3)))
        print(f"Ex38 — {name}: shape {X_out.shape}, mean excess kurtosis {round(kurtosis_mean, 4)}")

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Autoencoder concept"""
    print("Ex39 — Autoencoder concept (PyTorch/Keras code):")
    print("  class Autoencoder(nn.Module):")
    print("      def __init__(self, input_dim, latent_dim):")
    print("          self.encoder = nn.Sequential(")
    print("              nn.Linear(input_dim, 64), nn.ReLU(),")
    print("              nn.Linear(64, latent_dim))")
    print("          self.decoder = nn.Sequential(")
    print("              nn.Linear(latent_dim, 64), nn.ReLU(),")
    print("              nn.Linear(64, input_dim))")
    print("      def forward(self, x):")
    print("          return self.decoder(self.encoder(x))")
    print("  Loss = MSE(x_reconstructed, x_original)")

def ex40():
    """Variational autoencoder concept"""
    print("Ex40 — Variational Autoencoder (VAE) concept:")
    print("  - Encoder outputs mu and log_var (not deterministic z)")
    print("  - Reparameterization: z = mu + eps * exp(0.5 * log_var), eps~N(0,1)")
    print("  - ELBO loss = reconstruction_loss + KL_divergence")
    print("  - KL = -0.5 * sum(1 + log_var - mu^2 - exp(log_var))")
    print("  - Latent space is smooth/continuous → can sample new data points")
    print("  - Use case: image generation, molecule generation, anomaly detection")

def ex41():
    """Contrastive learning embeddings concept"""
    print("Ex41 — Contrastive Learning concept:")
    print("  - Learn embeddings where similar items are close, dissimilar are far")
    print("  - Positive pairs: augmentations of same sample")
    print("  - Negative pairs: different samples in batch")
    print("  - NT-Xent loss (SimCLR): -log[exp(sim(z_i,z_j)/tau) / sum_k exp(sim)]")
    print("  - No labels needed → self-supervised representation learning")
    print("  - Learned embeddings transfer well to downstream tasks")

def ex42():
    """SimCLR concept"""
    print("Ex42 — SimCLR concept (Chen et al., 2020):")
    print("  1. Take two random augmentations of each image (crop, flip, color jitter)")
    print("  2. Encode both with shared ResNet backbone f(x)")
    print("  3. Project to embedding space with MLP head g(h)")
    print("  4. Maximize agreement between z_i and z_j via NT-Xent loss")
    print("  5. Discard projection head at fine-tuning time")
    print("  6. Large batch sizes (4096+) provide more negatives → better representations")

def ex43():
    """BYOL concept"""
    print("Ex43 — BYOL (Bootstrap Your Own Latent) concept:")
    print("  - No negative pairs needed (unlike SimCLR)")
    print("  - Online network: trained with gradient")
    print("  - Target network: exponential moving average of online network")
    print("  - Online predicts target representation of different augmentation")
    print("  - Loss: MSE between normalized online prediction and target projection")
    print("  - Avoids collapse via asymmetry (predictor head + stop-gradient on target)")

def ex44():
    """CLIP embeddings concept"""
    print("Ex44 — CLIP (Contrastive Language-Image Pretraining) concept:")
    print("  - Joint embedding space for images and text")
    print("  - Image encoder (ViT/ResNet) + text encoder (Transformer)")
    print("  - Contrastive loss on N image-text pairs in batch (N^2 - N negatives)")
    print("  - Zero-shot classification: embed class names, find closest image")
    print("  - Embeddings useful for search, retrieval, downstream tasks")
    print("  # from transformers import CLIPModel, CLIPProcessor")
    print("  # model = CLIPModel.from_pretrained('openai/clip-vit-base-patch32')")

def ex45():
    """Sparse autoencoder concept"""
    print("Ex45 — Sparse Autoencoder concept:")
    print("  - Standard autoencoder + sparsity penalty on activations")
    print("  - Loss = MSE(x_rec, x) + beta * KL(rho || rho_hat)")
    print("  - rho = desired avg activation (e.g. 0.05), rho_hat = actual avg")
    print("  - Forces each hidden unit to specialize (interpretable features)")
    print("  - Alternative: L1 regularization on hidden layer: ||h||_1")
    print("  - Used in LLM interpretability research (Anthropic sparse autoencoders)")

def ex46():
    """Dictionary Learning"""
    dl = DictionaryLearning(n_components=10, random_state=42, max_iter=50, n_jobs=1)
    X_dl = dl.fit_transform(X[:100])
    print("Ex46 — Dictionary Learning output shape:", X_dl.shape)
    print("       Dictionary (atoms) shape:", dl.components_.shape)
    print("       Sparsity of codes:", round(float(np.mean(X_dl == 0)), 4))

def ex47():
    """Independent Component Analysis (FastICA)"""
    ica = FastICA(n_components=5, random_state=42, max_iter=500)
    X_ica = ica.fit_transform(X)
    kurtosis = np.mean(X_ica ** 4, axis=0) / (np.var(X_ica, axis=0) ** 2)
    print("Ex47 — FastICA output shape:", X_ica.shape)
    print("       Component kurtosis:", np.round(kurtosis, 3))

def ex48():
    """Topographic map: Self-Organizing Map (SOM) concept"""
    print("Ex48 — Self-Organizing Map (SOM) concept:")
    print("  - 2D grid of neurons, each with weight vector matching input dimension")
    print("  - Training: find BMU (best matching unit) for each input")
    print("  - Update BMU and neighbors: w += lr * h(d) * (x - w)")
    print("  - h(d) = exp(-d^2 / (2*sigma^2)): neighborhood function")
    print("  - After training: topographic map preserves data manifold structure")
    print("  # Use minisom library: from minisom import MiniSom")

def ex49():
    """Word2Vec as dimensionality reduction concept"""
    print("Ex49 — Word2Vec as Dimensionality Reduction:")
    print("  - One-hot vocabulary is |V|-dimensional (e.g. 50,000+)")
    print("  - Word2Vec learns dense d-dimensional embeddings (d=100-300)")
    print("  - Skip-gram: predict context words given center word")
    print("  - CBOW: predict center word given context words")
    print("  - Training objective acts as implicit matrix factorization (Levy & Goldberg)")
    print("  # from gensim.models import Word2Vec")
    print("  # model = Word2Vec(sentences, vector_size=100, window=5, min_count=1)")

def ex50():
    """Production dimensionality reduction architecture"""
    print("Ex50 — Production Dimensionality Reduction Architecture:")
    print("  1. Offline: fit PCA/UMAP on full training corpus (weekly batch job)")
    print("  2. Model registry: store fitted reducer + scaler (MLflow/S3)")
    print("  3. Feature store: precompute reduced embeddings for all entities")
    print("  4. Online serving: load reducer, transform new data in <1ms")
    print("  5. Monitoring: track explained variance drift, reconstruction error")
    print("  6. Dimensionality audit: verify n_components still explains 95% variance")
    print("  7. Incremental update: IncrementalPCA for streaming data")
    print("  8. Fallback: if reducer fails, use StandardScaler only")


def main():
    print("=" * 60)
    print("Examples 4.2 — Dimensionality Reduction")
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
