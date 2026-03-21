# ============================================================
# Examples 2.5 - Text Classification (50 examples)
# BASIC (1-13) | INTERMEDIATE (14-26) | NESTED (27-38) | ADVANCED (39-50)
# ============================================================

import sys
import io
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
else:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

import numpy as np
from sklearn.datasets import fetch_20newsgroups
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB, ComplementNB
from sklearn.linear_model import LogisticRegression, SGDClassifier
from sklearn.svm import LinearSVC
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
from sklearn.preprocessing import LabelEncoder
from sklearn.feature_selection import SelectKBest, chi2
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import VotingClassifier

# --- BASIC (1-13) -------------------------------------------

def ex01():
    """Simple keyword classifier using if/else on words"""
    def keyword_classify(text):
        text = text.lower()
        pos_words = {"good", "great", "excellent", "love", "amazing"}
        neg_words = {"bad", "terrible", "awful", "hate", "horrible"}
        words = set(text.split())
        if words & pos_words:
            return "positive"
        elif words & neg_words:
            return "negative"
        return "neutral"
    samples = ["This is great!", "I hate this.", "It was okay."]
    for s in samples:
        print(f"  '{s}' -> {keyword_classify(s)}")
    print("Ex01 — Keyword Classifier: done")

def ex02():
    """CountVectorizer on 5 sentences"""
    docs = [
        "the cat sat on the mat",
        "the dog ran in the park",
        "cats and dogs are pets",
        "running in the park is fun",
        "the mat is on the floor",
    ]
    cv = CountVectorizer()
    X = cv.fit_transform(docs)
    print(f"Ex02 — CountVectorizer: shape={X.shape}, vocab size={len(cv.vocabulary_)}")

def ex03():
    """TfidfVectorizer on 5 sentences"""
    docs = [
        "machine learning is fun",
        "deep learning uses neural networks",
        "neural networks learn features",
        "fun with machine learning models",
        "learning deep features from data",
    ]
    tv = TfidfVectorizer()
    X = tv.fit_transform(docs)
    print(f"Ex03 — TfidfVectorizer: shape={X.shape}, max tfidf={X.max():.4f}")

def ex04():
    """Naive Bayes on tiny dataset (3 pos, 3 neg)"""
    texts = ["I love this", "great product", "excellent work",
             "I hate this", "terrible product", "awful work"]
    labels = [1, 1, 1, 0, 0, 0]
    cv = CountVectorizer()
    X = cv.fit_transform(texts)
    nb = MultinomialNB()
    nb.fit(X, labels)
    preds = nb.predict(X)
    print(f"Ex04 — Naive Bayes: train acc={accuracy_score(labels, preds):.2f}")

def ex05():
    """Logistic Regression on tiny text dataset"""
    texts = ["good movie", "bad movie", "great film", "terrible film",
             "loved it", "hated it"]
    labels = [1, 0, 1, 0, 1, 0]
    cv = TfidfVectorizer()
    X = cv.fit_transform(texts)
    lr = LogisticRegression(max_iter=200)
    lr.fit(X, labels)
    preds = lr.predict(X)
    print(f"Ex05 — Logistic Regression: train acc={accuracy_score(labels, preds):.2f}")

def ex06():
    """LinearSVC on tiny text dataset"""
    texts = ["spam buy now", "free offer click", "hello friend",
             "win prize now", "meet tomorrow", "discount deal"]
    labels = [1, 1, 0, 1, 0, 1]
    cv = TfidfVectorizer()
    X = cv.fit_transform(texts)
    svm = LinearSVC(max_iter=1000)
    svm.fit(X, labels)
    preds = svm.predict(X)
    print(f"Ex06 — LinearSVC: train acc={accuracy_score(labels, preds):.2f}")

def ex07():
    """Accuracy on train set"""
    texts = ["positive review", "negative review", "good experience",
             "bad experience", "loved it", "hated it"]
    labels = [1, 0, 1, 0, 1, 0]
    cv = CountVectorizer()
    X = cv.fit_transform(texts)
    nb = MultinomialNB().fit(X, labels)
    acc = accuracy_score(labels, nb.predict(X))
    print(f"Ex07 — Train Accuracy: {acc:.2f} ({int(acc*len(labels))}/{len(labels)} correct)")

def ex08():
    """Confusion matrix for binary text classification"""
    texts = ["great", "terrible", "awesome", "horrible", "nice", "bad"]
    labels = [1, 0, 1, 0, 1, 0]
    cv = CountVectorizer()
    X = cv.fit_transform(texts)
    nb = MultinomialNB().fit(X, labels)
    preds = nb.predict(X)
    cm = confusion_matrix(labels, preds)
    print(f"Ex08 — Confusion Matrix:\n  TN={cm[0,0]}, FP={cm[0,1]}\n  FN={cm[1,0]}, TP={cm[1,1]}")

def ex09():
    """Classification report for 2 classes"""
    texts = ["I love this product", "This is terrible",
             "Amazing quality", "Worst purchase ever",
             "Highly recommend", "Complete waste of money"]
    labels = [1, 0, 1, 0, 1, 0]
    cv = TfidfVectorizer()
    X = cv.fit_transform(texts)
    nb = MultinomialNB().fit(X, labels)
    preds = nb.predict(X)
    report = classification_report(labels, preds, target_names=["negative", "positive"])
    print(f"Ex09 — Classification Report:\n{report}")

def ex10():
    """Label encoding for text categories"""
    categories = ["sports", "tech", "politics", "sports", "tech", "politics"]
    le = LabelEncoder()
    encoded = le.fit_transform(categories)
    print(f"Ex10 — Label Encoding: {list(zip(categories, encoded.tolist()))}")
    print(f"  Classes: {list(le.classes_)}")

def ex11():
    """Load 20newsgroups (2 categories, subset)"""
    cats = ["rec.sport.hockey", "sci.space"]
    data = fetch_20newsgroups(subset="train", categories=cats, remove=("headers",))
    print(f"Ex11 — 20newsgroups: {len(data.data)} docs, categories={data.target_names}")

def ex12():
    """Train/test split for text data"""
    cats = ["rec.sport.hockey", "sci.space"]
    data = fetch_20newsgroups(subset="train", categories=cats, remove=("headers",))
    X_tr, X_te, y_tr, y_te = train_test_split(
        data.data, data.target, test_size=0.2, random_state=42
    )
    print(f"Ex12 — Train/Test Split: train={len(X_tr)}, test={len(X_te)}")

def ex13():
    """Predict a single document with trained model"""
    cats = ["rec.sport.hockey", "sci.space"]
    data = fetch_20newsgroups(subset="train", categories=cats, remove=("headers",))
    pipe = Pipeline([("tfidf", TfidfVectorizer(max_features=5000)),
                     ("nb", MultinomialNB())])
    pipe.fit(data.data, data.target)
    doc = ["The shuttle launch was delayed due to weather conditions."]
    pred = pipe.predict(doc)[0]
    print(f"Ex13 — Single Doc Prediction: '{doc[0][:40]}...' -> {data.target_names[pred]}")

# --- INTERMEDIATE (14-26) ----------------------------------

def ex14():
    """Text preprocessing: lowercase and strip punctuation"""
    import re
    def preprocess(text):
        text = text.lower()
        text = re.sub(r"[^a-z0-9\s]", "", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text
    samples = ["Hello, World!!!", "Text-Preprocessing is FUN.", "Remove @all# symbols..."]
    for s in samples:
        print(f"  '{s}' -> '{preprocess(s)}'")
    print("Ex14 — Preprocessing: done")

def ex15():
    """Remove stopwords manually"""
    STOPWORDS = {"the", "a", "an", "is", "it", "in", "on", "at", "to", "and", "of"}
    def remove_stopwords(text):
        return " ".join(w for w in text.lower().split() if w not in STOPWORDS)
    texts = ["the cat is on the mat", "it is a beautiful day in the park"]
    for t in texts:
        print(f"  '{t}' -> '{remove_stopwords(t)}'")
    print("Ex15 — Stopword Removal: done")

def ex16():
    """TF-IDF with sublinear_tf=True"""
    cats = ["rec.sport.hockey", "sci.space"]
    data = fetch_20newsgroups(subset="train", categories=cats, remove=("headers",))
    tv = TfidfVectorizer(max_features=10000, sublinear_tf=True)
    X = tv.fit_transform(data.data)
    print(f"Ex16 — TF-IDF sublinear_tf: shape={X.shape}, nnz={X.nnz}")

def ex17():
    """N-gram features (1,2) with CountVectorizer"""
    docs = ["natural language processing", "text classification task",
            "language model training", "processing text data"]
    cv = CountVectorizer(ngram_range=(1, 2))
    X = cv.fit_transform(docs)
    print(f"Ex17 — N-gram (1,2): vocab size={len(cv.vocabulary_)}, shape={X.shape}")
    bigrams = [f for f in cv.vocabulary_ if " " in f]
    print(f"  Sample bigrams: {bigrams[:5]}")

def ex18():
    """Character n-grams with analyzer='char_wb'"""
    docs = ["hello world", "help me", "world peace", "peaceful day"]
    cv = CountVectorizer(analyzer="char_wb", ngram_range=(3, 4))
    X = cv.fit_transform(docs)
    print(f"Ex18 — Char n-grams: vocab size={len(cv.vocabulary_)}, shape={X.shape}")

def ex19():
    """Cross-validation on 20newsgroups (2 cats)"""
    cats = ["rec.sport.hockey", "sci.space"]
    data = fetch_20newsgroups(subset="train", categories=cats, remove=("headers",))
    pipe = Pipeline([("tfidf", TfidfVectorizer(max_features=5000)),
                     ("nb", MultinomialNB())])
    scores = cross_val_score(pipe, data.data, data.target, cv=3, scoring="accuracy")
    print(f"Ex19 — Cross-Validation: scores={np.round(scores, 3)}, mean={scores.mean():.3f}")

def ex20():
    """GridSearchCV for TF-IDF + NB"""
    cats = ["rec.sport.hockey", "sci.space"]
    data = fetch_20newsgroups(subset="train", categories=cats, remove=("headers",))
    pipe = Pipeline([("tfidf", TfidfVectorizer()),
                     ("nb", MultinomialNB())])
    params = {"tfidf__max_features": [3000, 5000], "nb__alpha": [0.1, 1.0]}
    gs = GridSearchCV(pipe, params, cv=3, n_jobs=-1)
    gs.fit(data.data, data.target)
    print(f"Ex20 — GridSearch best params: {gs.best_params_}, best score: {gs.best_score_:.3f}")

def ex21():
    """Feature selection with SelectKBest chi2"""
    cats = ["rec.sport.hockey", "sci.space"]
    data = fetch_20newsgroups(subset="train", categories=cats, remove=("headers",))
    cv = CountVectorizer(max_features=10000)
    X = cv.fit_transform(data.data)
    selector = SelectKBest(chi2, k=500)
    X_sel = selector.fit_transform(X, data.target)
    print(f"Ex21 — SelectKBest chi2: {X.shape[1]} -> {X_sel.shape[1]} features")

def ex22():
    """Top 10 features per class using NB log probabilities"""
    cats = ["rec.sport.hockey", "sci.space"]
    data = fetch_20newsgroups(subset="train", categories=cats, remove=("headers",))
    cv = CountVectorizer(max_features=5000)
    X = cv.fit_transform(data.data)
    nb = MultinomialNB().fit(X, data.target)
    vocab = np.array(cv.get_feature_names_out())
    for i, cls in enumerate(data.target_names):
        top10 = vocab[np.argsort(nb.feature_log_prob_[i])[-10:]]
        print(f"  {cls}: {list(top10)}")
    print("Ex22 — Top Features per Class: done")

def ex23():
    """Class weight handling for imbalanced text"""
    cats = ["rec.sport.hockey", "sci.space"]
    data = fetch_20newsgroups(subset="train", categories=cats, remove=("headers",))
    cv = TfidfVectorizer(max_features=5000)
    X = cv.fit_transform(data.data)
    lr = LogisticRegression(class_weight="balanced", max_iter=300)
    lr.fit(X, data.target)
    preds = lr.predict(X)
    print(f"Ex23 — Class Weight balanced: train acc={accuracy_score(data.target, preds):.3f}")

def ex24():
    """Multi-class on 4 newsgroups categories"""
    cats = ["rec.sport.hockey", "sci.space", "talk.politics.guns", "comp.graphics"]
    data = fetch_20newsgroups(subset="train", categories=cats, remove=("headers",))
    pipe = Pipeline([("tfidf", TfidfVectorizer(max_features=8000)),
                     ("lr", LogisticRegression(max_iter=500, multi_class="auto"))])
    pipe.fit(data.data, data.target)
    preds = pipe.predict(data.data)
    print(f"Ex24 — Multi-class (4 cats): train acc={accuracy_score(data.target, preds):.3f}")

def ex25():
    """SGDClassifier for online/incremental learning"""
    cats = ["rec.sport.hockey", "sci.space"]
    data = fetch_20newsgroups(subset="train", categories=cats, remove=("headers",))
    cv = HashingVectorizer = TfidfVectorizer(max_features=5000)
    X = cv.fit_transform(data.data)
    sgd = SGDClassifier(loss="hinge", random_state=42, max_iter=50)
    sgd.fit(X, data.target)
    preds = sgd.predict(X)
    print(f"Ex25 — SGDClassifier: train acc={accuracy_score(data.target, preds):.3f}")

def ex26():
    """Calibrated classifier for probability outputs"""
    cats = ["rec.sport.hockey", "sci.space"]
    data = fetch_20newsgroups(subset="train", categories=cats, remove=("headers",))
    X_tr, X_te, y_tr, y_te = train_test_split(
        data.data, data.target, test_size=0.2, random_state=42
    )
    cv = TfidfVectorizer(max_features=5000)
    X_tr_v = cv.fit_transform(X_tr)
    X_te_v = cv.transform(X_te)
    svm = LinearSVC(max_iter=1000)
    cal = CalibratedClassifierCV(svm, cv=3)
    cal.fit(X_tr_v, y_tr)
    probs = cal.predict_proba(X_te_v[:3])
    print(f"Ex26 — Calibrated SVM probabilities (first 3):\n  {np.round(probs, 3)}")

# --- NESTED (27-38) ----------------------------------------

def ex27():
    """Full text pipeline class: preprocess + vectorize + classify"""
    import re
    class TextClassifierPipeline:
        def __init__(self):
            self.vectorizer = TfidfVectorizer(max_features=5000)
            self.model = MultinomialNB()
        def _preprocess(self, texts):
            return [re.sub(r"[^a-z0-9\s]", "", t.lower()) for t in texts]
        def fit(self, texts, labels):
            cleaned = self._preprocess(texts)
            X = self.vectorizer.fit_transform(cleaned)
            self.model.fit(X, labels)
            return self
        def predict(self, texts):
            cleaned = self._preprocess(texts)
            X = self.vectorizer.transform(cleaned)
            return self.model.predict(X)
    cats = ["rec.sport.hockey", "sci.space"]
    data = fetch_20newsgroups(subset="train", categories=cats, remove=("headers",))
    pipe = TextClassifierPipeline().fit(data.data[:200], data.target[:200])
    preds = pipe.predict(data.data[200:210])
    acc = accuracy_score(data.target[200:210], preds)
    print(f"Ex27 — TextClassifierPipeline: acc on 10 samples={acc:.2f}")

def ex28():
    """TextPipeline with CountVectorizer + NB"""
    cats = ["rec.sport.hockey", "sci.space"]
    data = fetch_20newsgroups(subset="train", categories=cats, remove=("headers",))
    X_tr, X_te, y_tr, y_te = train_test_split(
        data.data, data.target, test_size=0.2, random_state=42
    )
    pipe = Pipeline([("cv", CountVectorizer(max_features=5000)),
                     ("nb", MultinomialNB())])
    pipe.fit(X_tr, y_tr)
    acc = accuracy_score(y_te, pipe.predict(X_te))
    print(f"Ex28 — CountVec + NB pipeline: test acc={acc:.3f}")

def ex29():
    """TextPipeline with TF-IDF + LinearSVC"""
    cats = ["rec.sport.hockey", "sci.space"]
    data = fetch_20newsgroups(subset="train", categories=cats, remove=("headers",))
    X_tr, X_te, y_tr, y_te = train_test_split(
        data.data, data.target, test_size=0.2, random_state=42
    )
    pipe = Pipeline([("tfidf", TfidfVectorizer(max_features=10000, sublinear_tf=True)),
                     ("svm", LinearSVC(C=1.0, max_iter=1000))])
    pipe.fit(X_tr, y_tr)
    acc = accuracy_score(y_te, pipe.predict(X_te))
    print(f"Ex29 — TF-IDF + LinearSVC pipeline: test acc={acc:.3f}")

def ex30():
    """Pipeline comparison: NB vs SVM vs LR"""
    cats = ["rec.sport.hockey", "sci.space"]
    data = fetch_20newsgroups(subset="train", categories=cats, remove=("headers",))
    X_tr, X_te, y_tr, y_te = train_test_split(
        data.data, data.target, test_size=0.2, random_state=42
    )
    tv = TfidfVectorizer(max_features=5000)
    X_tr_v = tv.fit_transform(X_tr)
    X_te_v = tv.transform(X_te)
    models = {
        "NaiveBayes": MultinomialNB(),
        "LinearSVC": LinearSVC(max_iter=1000),
        "LogReg": LogisticRegression(max_iter=300),
    }
    print("Ex30 — Pipeline Comparison:")
    for name, m in models.items():
        m.fit(X_tr_v, y_tr)
        acc = accuracy_score(y_te, m.predict(X_te_v))
        print(f"  {name}: {acc:.3f}")

def ex31():
    """Custom preprocessor + TF-IDF + classifier pipeline"""
    import re
    from sklearn.base import BaseEstimator, TransformerMixin
    class TextPreprocessor(BaseEstimator, TransformerMixin):
        def fit(self, X, y=None): return self
        def transform(self, X):
            return [re.sub(r"[^a-z0-9\s]", "", t.lower()) for t in X]
    cats = ["rec.sport.hockey", "sci.space"]
    data = fetch_20newsgroups(subset="train", categories=cats, remove=("headers",))
    X_tr, X_te, y_tr, y_te = train_test_split(
        data.data, data.target, test_size=0.2, random_state=42
    )
    pipe = Pipeline([("prep", TextPreprocessor()),
                     ("tfidf", TfidfVectorizer(max_features=5000)),
                     ("lr", LogisticRegression(max_iter=300))])
    pipe.fit(X_tr, y_tr)
    acc = accuracy_score(y_te, pipe.predict(X_te))
    print(f"Ex31 — Custom Preprocessor Pipeline: test acc={acc:.3f}")

def ex32():
    """Pipeline with feature selection + classifier"""
    cats = ["rec.sport.hockey", "sci.space"]
    data = fetch_20newsgroups(subset="train", categories=cats, remove=("headers",))
    X_tr, X_te, y_tr, y_te = train_test_split(
        data.data, data.target, test_size=0.2, random_state=42
    )
    pipe = Pipeline([("cv", CountVectorizer(max_features=10000)),
                     ("sel", SelectKBest(chi2, k=1000)),
                     ("nb", MultinomialNB())])
    pipe.fit(X_tr, y_tr)
    acc = accuracy_score(y_te, pipe.predict(X_te))
    print(f"Ex32 — Feature Selection Pipeline: test acc={acc:.3f}")

def ex33():
    """N-gram comparison: unigram vs bigram vs both"""
    cats = ["rec.sport.hockey", "sci.space"]
    data = fetch_20newsgroups(subset="train", categories=cats, remove=("headers",))
    X_tr, X_te, y_tr, y_te = train_test_split(
        data.data, data.target, test_size=0.2, random_state=42
    )
    print("Ex33 — N-gram Comparison:")
    for ng, label in [((1,1), "unigram"), ((2,2), "bigram"), ((1,2), "uni+bi")]:
        pipe = Pipeline([("tfidf", TfidfVectorizer(ngram_range=ng, max_features=10000)),
                         ("nb", MultinomialNB())])
        pipe.fit(X_tr, y_tr)
        acc = accuracy_score(y_te, pipe.predict(X_te))
        print(f"  {label}: {acc:.3f}")

def ex34():
    """Cross-val comparison across 3 classifiers"""
    cats = ["rec.sport.hockey", "sci.space"]
    data = fetch_20newsgroups(subset="train", categories=cats, remove=("headers",))
    pipes = {
        "NB":  Pipeline([("t", TfidfVectorizer(max_features=5000)), ("m", MultinomialNB())]),
        "SVM": Pipeline([("t", TfidfVectorizer(max_features=5000)), ("m", LinearSVC(max_iter=500))]),
        "LR":  Pipeline([("t", TfidfVectorizer(max_features=5000)), ("m", LogisticRegression(max_iter=300))]),
    }
    print("Ex34 — Cross-val Comparison (cv=3):")
    for name, pipe in pipes.items():
        scores = cross_val_score(pipe, data.data, data.target, cv=3)
        print(f"  {name}: mean={scores.mean():.3f}, std={scores.std():.3f}")

def ex35():
    """TextClassifier class with fit/predict/evaluate"""
    class TextClassifier:
        def __init__(self, model_name="nb"):
            models = {"nb": MultinomialNB(), "lr": LogisticRegression(max_iter=300),
                      "svm": LinearSVC(max_iter=1000)}
            self.pipe = Pipeline([("tfidf", TfidfVectorizer(max_features=5000)),
                                  ("clf", models[model_name])])
        def fit(self, X, y):
            self.pipe.fit(X, y); return self
        def predict(self, X):
            return self.pipe.predict(X)
        def evaluate(self, X, y):
            return accuracy_score(y, self.predict(X))
    cats = ["rec.sport.hockey", "sci.space"]
    data = fetch_20newsgroups(subset="train", categories=cats, remove=("headers",))
    X_tr, X_te, y_tr, y_te = train_test_split(
        data.data, data.target, test_size=0.2, random_state=42
    )
    print("Ex35 — TextClassifier class:")
    for name in ["nb", "lr", "svm"]:
        clf = TextClassifier(name).fit(X_tr, y_tr)
        print(f"  {name}: test acc={clf.evaluate(X_te, y_te):.3f}")

def ex36():
    """Multi-label classification concept (print code pattern)"""
    print("Ex36 — Multi-label Classification Pattern:")
    code = """
from sklearn.multiclass import OneVsRestClassifier
from sklearn.preprocessing import MultiLabelBinarizer

mlb = MultiLabelBinarizer()
y_multi = mlb.fit_transform([['sports', 'hockey'], ['science', 'space'], ['sports']])

clf = OneVsRestClassifier(LinearSVC())
clf.fit(X_tfidf, y_multi)
preds = clf.predict(X_test)
labels = mlb.inverse_transform(preds)
    """
    print(code)

def ex37():
    """Text pipeline with topic modeling via LDA (print pattern)"""
    print("Ex37 — LDA Topic Modeling Pattern:")
    code = """
from sklearn.decomposition import LatentDirichletAllocation

cv = CountVectorizer(max_features=5000, stop_words='english')
X = cv.fit_transform(docs)

lda = LatentDirichletAllocation(n_components=10, random_state=42)
X_topics = lda.fit_transform(X)

vocab = cv.get_feature_names_out()
for i, topic in enumerate(lda.components_):
    top_words = [vocab[j] for j in topic.argsort()[-10:]]
    print(f"Topic {i}: {top_words}")
    """
    print(code)

def ex38():
    """Ensemble for text classification (VotingClassifier)"""
    cats = ["rec.sport.hockey", "sci.space"]
    data = fetch_20newsgroups(subset="train", categories=cats, remove=("headers",))
    X_tr, X_te, y_tr, y_te = train_test_split(
        data.data, data.target, test_size=0.2, random_state=42
    )
    tv = TfidfVectorizer(max_features=5000)
    X_tr_v = tv.fit_transform(X_tr)
    X_te_v = tv.transform(X_te)
    cal_svm = CalibratedClassifierCV(LinearSVC(max_iter=1000), cv=3)
    ensemble = VotingClassifier(
        estimators=[("nb", MultinomialNB()),
                    ("lr", LogisticRegression(max_iter=300)),
                    ("svm", cal_svm)],
        voting="soft"
    )
    ensemble.fit(X_tr_v, y_tr)
    acc = accuracy_score(y_te, ensemble.predict(X_te_v))
    print(f"Ex38 — VotingClassifier Ensemble: test acc={acc:.3f}")

# --- ADVANCED (39-50) ---------------------------------------

def ex39():
    """BERT-based text classification (print code pattern)"""
    print("Ex39 — BERT Text Classification Pattern:")
    code = """
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")
model = AutoModelForSequenceClassification.from_pretrained(
    "bert-base-uncased", num_labels=2
)

inputs = tokenizer("I love this movie!", return_tensors="pt", truncation=True)
outputs = model(**inputs)
logits = outputs.logits
pred = torch.argmax(logits, dim=-1).item()
print(f"Predicted class: {pred}")
    """
    print(code)

def ex40():
    """Few-shot text classification concept"""
    print("Ex40 — Few-Shot Text Classification Concept:")
    desc = """
Few-shot classification: train on only K examples per class (K=5, 10, 20).
Approaches:
  1. Prototype networks: embed examples, classify by nearest centroid
  2. Fine-tune BERT on K examples with careful LR tuning
  3. In-context learning: provide K labeled examples in LLM prompt
  4. SetFit: fine-tune sentence-transformers with contrastive loss on few pairs

Key challenge: avoiding overfitting with limited data.
Use strong pretrained embeddings + careful regularization.
    """
    print(desc)

def ex41():
    """Zero-shot classification with NLI (print code pattern)"""
    print("Ex41 — Zero-Shot NLI Classification Pattern:")
    code = """
from transformers import pipeline

classifier = pipeline("zero-shot-classification",
                      model="facebook/bart-large-mnli")

text = "The team scored in the final minute to win the championship."
candidate_labels = ["sports", "politics", "technology", "science"]

result = classifier(text, candidate_labels)
print(f"Label: {result['labels'][0]}, Score: {result['scores'][0]:.3f}")
    """
    print(code)

def ex42():
    """Text classification calibration: reliability diagram data"""
    cats = ["rec.sport.hockey", "sci.space"]
    data = fetch_20newsgroups(subset="train", categories=cats, remove=("headers",))
    X_tr, X_te, y_tr, y_te = train_test_split(
        data.data, data.target, test_size=0.3, random_state=42
    )
    tv = TfidfVectorizer(max_features=5000)
    X_tr_v = tv.fit_transform(X_tr)
    X_te_v = tv.transform(X_te)
    lr = LogisticRegression(max_iter=300).fit(X_tr_v, y_tr)
    probs = lr.predict_proba(X_te_v)[:, 1]
    bins = np.linspace(0, 1, 6)
    print("Ex42 — Reliability Diagram Data (bin center -> mean acc):")
    for i in range(len(bins) - 1):
        mask = (probs >= bins[i]) & (probs < bins[i+1])
        if mask.sum() > 0:
            mean_conf = probs[mask].mean()
            mean_acc = (y_te[mask] == 1).mean()
            print(f"  [{bins[i]:.1f}-{bins[i+1]:.1f}]: conf={mean_conf:.3f}, acc={mean_acc:.3f}, n={mask.sum()}")

def ex43():
    """LIME for text explanation (print code pattern)"""
    print("Ex43 — LIME Text Explanation Pattern:")
    code = """
from lime.lime_text import LimeTextExplainer

explainer = LimeTextExplainer(class_names=["negative", "positive"])

def predict_proba(texts):
    X = vectorizer.transform(texts)
    return model.predict_proba(X)

exp = explainer.explain_instance(
    test_text, predict_proba, num_features=10
)
exp.show_in_notebook()
# Top contributing words and their weights:
for word, weight in exp.as_list():
    print(f"  '{word}': {weight:+.4f}")
    """
    print(code)

def ex44():
    """Adversarial text example: character swap attack"""
    def char_swap_attack(text, n=2):
        import random
        words = text.split()
        attacked = []
        for word in words:
            if len(word) > 3 and random.random() > 0.5:
                i = random.randint(1, len(word) - 2)
                word = word[:i] + word[i+1] + word[i] + word[i+2:]
            attacked.append(word)
        return " ".join(attacked)
    samples = ["The movie was absolutely terrible", "I really loved the performance"]
    print("Ex44 — Adversarial Character Swap:")
    for s in samples:
        attacked = char_swap_attack(s)
        print(f"  Original:  '{s}'")
        print(f"  Attacked:  '{attacked}'")

def ex45():
    """Noisy label handling concept"""
    print("Ex45 — Noisy Label Handling Concept:")
    desc = """
Approaches for learning with noisy labels:
  1. Label smoothing: replace hard 0/1 with (ε/K, 1-ε+ε/K)
     loss = (1-ε)*CE(y_hard) + ε*CE(uniform)
  2. Confident Learning (cleanlab): identify likely mislabeled samples
     - Estimate noise transition matrix
     - Prune low-confidence cross-class examples
  3. Co-training / Cross-validation noise detection:
     - Train on fold A, find high-loss samples in fold B
  4. Loss reweighting: down-weight high-loss samples
  5. MixUp augmentation can regularize against label noise

Implementation (cleanlab):
  from cleanlab.classification import CleanLearning
  cl = CleanLearning(LogisticRegression())
  cl.fit(X, noisy_labels)
    """
    print(desc)

def ex46():
    """Semi-supervised text classification concept"""
    print("Ex46 — Semi-Supervised Text Classification Concept:")
    desc = """
Semi-supervised learning: few labeled + many unlabeled examples.

Methods:
  1. Self-training:
     - Train on labeled data
     - Predict unlabeled with confidence threshold (e.g., >0.95)
     - Add high-confidence predictions to training set
     - Repeat

  2. Label propagation (sklearn):
     from sklearn.semi_supervised import LabelPropagation
     lp = LabelPropagation()
     # y = -1 for unlabeled
     lp.fit(X_all, y_with_minus1)

  3. Pseudo-labeling with BERT:
     - Fine-tune on labeled, generate pseudo-labels for unlabeled
     - Re-fine-tune on labeled + pseudo-labeled (with lower weight)

  4. UDA (Unsupervised Data Augmentation):
     - Consistency loss: model(x) ≈ model(augment(x)) on unlabeled
    """
    print(desc)

def ex47():
    """Multilingual classification concept"""
    print("Ex47 — Multilingual Classification Concept:")
    code = """
Approaches:
  1. mBERT / XLM-RoBERTa (zero-shot cross-lingual transfer):
     - Fine-tune on English labeled data
     - Evaluate on French/Spanish/etc. directly

  2. LaBSE (Language-agnostic BERT Sentence Embeddings):
     - Aligns embeddings across 109 languages
     - Use as feature extractor + train classifier on English

  3. Machine translation + English classifier:
     - Translate all text to English first
     - Apply existing English classifier

Code pattern (XLM-R):
  from transformers import XLMRobertaForSequenceClassification
  model = XLMRobertaForSequenceClassification.from_pretrained(
      "xlm-roberta-base", num_labels=num_classes
  )
  # Fine-tune on multilingual data or zero-shot on English
    """
    print(code)

def ex48():
    """Online/incremental text classifier using partial_fit"""
    cats = ["rec.sport.hockey", "sci.space"]
    data = fetch_20newsgroups(subset="train", categories=cats, remove=("headers",))
    tv = TfidfVectorizer(max_features=5000)
    X_all = tv.fit_transform(data.data)
    y_all = data.target
    sgd = SGDClassifier(loss="log_loss", random_state=42)
    batch_size = 100
    accs = []
    for start in range(0, 400, batch_size):
        X_batch = X_all[start:start+batch_size]
        y_batch = y_all[start:start+batch_size]
        sgd.partial_fit(X_batch, y_batch, classes=np.unique(y_all))
        preds = sgd.predict(X_all[400:450])
        accs.append(accuracy_score(y_all[400:450], preds))
    print(f"Ex48 — Incremental partial_fit: acc after each batch={[round(a,3) for a in accs]}")

def ex49():
    """Text classifier with confidence threshold (abstain if unsure)"""
    cats = ["rec.sport.hockey", "sci.space"]
    data = fetch_20newsgroups(subset="train", categories=cats, remove=("headers",))
    X_tr, X_te, y_tr, y_te = train_test_split(
        data.data, data.target, test_size=0.2, random_state=42
    )
    pipe = Pipeline([("tfidf", TfidfVectorizer(max_features=5000)),
                     ("lr", LogisticRegression(max_iter=300))])
    pipe.fit(X_tr, y_tr)
    probs = pipe.predict_proba(X_te)
    threshold = 0.85
    conf = probs.max(axis=1) >= threshold
    accepted = conf.sum()
    acc_high_conf = accuracy_score(y_te[conf], pipe.predict(X_te)[conf]) if accepted > 0 else 0
    print(f"Ex49 — Confidence Threshold (>={threshold}):")
    print(f"  Accepted: {accepted}/{len(y_te)}, Accuracy on accepted: {acc_high_conf:.3f}")

def ex50():
    """Production text classification system design checklist"""
    print("Ex50 — Production Text Classification Checklist:")
    checklist = """
Data:
  [ ] Collect balanced, representative training data
  [ ] Define clear label taxonomy with annotation guidelines
  [ ] Measure inter-annotator agreement (Cohen's kappa > 0.7)
  [ ] Set aside held-out test set (never touched during dev)

Preprocessing:
  [ ] Language detection and filtering
  [ ] Encoding normalization (UTF-8)
  [ ] Domain-specific tokenization

Modeling:
  [ ] Baseline: TF-IDF + LogReg (fast, interpretable)
  [ ] Advanced: fine-tuned BERT/RoBERTa
  [ ] Calibrate probabilities (Platt scaling / Isotonic)
  [ ] Handle out-of-distribution inputs (confidence threshold)

Evaluation:
  [ ] Per-class precision, recall, F1
  [ ] Confusion matrix analysis
  [ ] Error analysis on failures
  [ ] Test on adversarial / edge cases

Deployment:
  [ ] Model versioning and registry
  [ ] A/B testing framework
  [ ] Monitoring: accuracy drift, label distribution shift
  [ ] Latency SLA (< 100ms p99)
  [ ] Fallback to simpler model if confidence low
  [ ] Human-in-the-loop for low-confidence predictions
    """
    print(checklist)


def main():
    print("=" * 60)
    print("Examples 2.5 — Text Classification")
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
