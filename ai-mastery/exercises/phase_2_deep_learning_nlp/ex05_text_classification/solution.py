# ============================================================
# Solution 2.5 — Text Classification
# ============================================================

import numpy as np
import pandas as pd
import re
import string
from collections import Counter

from sklearn.datasets import fetch_20newsgroups
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.feature_extraction.text import (
    CountVectorizer, TfidfVectorizer
)
from sklearn.naive_bayes import MultinomialNB, ComplementNB
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix
)

# ---------------------------------------------------------------------------
# Shared datasets
# ---------------------------------------------------------------------------
BINARY_CATEGORIES = ['rec.sport.baseball', 'sci.space']
newsgroups_train_bin = fetch_20newsgroups(
    subset='train', categories=BINARY_CATEGORIES,
    remove=('headers', 'footers', 'quotes'), random_state=42
)
newsgroups_test_bin = fetch_20newsgroups(
    subset='test', categories=BINARY_CATEGORIES,
    remove=('headers', 'footers', 'quotes'), random_state=42
)
texts_train_bin = newsgroups_train_bin.data
labels_train_bin = newsgroups_train_bin.target
texts_test_bin = newsgroups_test_bin.data
labels_test_bin = newsgroups_test_bin.target

MULTI_CATEGORIES = ['rec.sport.baseball', 'sci.space', 'talk.politics.guns', 'comp.graphics']
newsgroups_train_mc = fetch_20newsgroups(
    subset='train', categories=MULTI_CATEGORIES,
    remove=('headers', 'footers', 'quotes'), random_state=42
)
newsgroups_test_mc = fetch_20newsgroups(
    subset='test', categories=MULTI_CATEGORIES,
    remove=('headers', 'footers', 'quotes'), random_state=42
)

SAMPLE_SENTENCES = [
    "The quick brown fox jumps over the lazy dog.",
    "Machine learning is a subset of artificial intelligence.",
    "Natural language processing enables computers to understand text.",
    "Deep learning models have achieved remarkable results in NLP tasks.",
    "Text classification assigns predefined categories to documents.",
]

# ---------------------------------------------------------------------------
# TODO 1: Text preprocessing
# ---------------------------------------------------------------------------

def preprocess_text(text):
    text = text.lower()
    text = re.sub(r'[0-9]+', ' ', text)
    text = text.translate(str.maketrans('', '', string.punctuation))
    tokens = text.split()
    tokens = [t for t in tokens if len(t) >= 2]
    return tokens

# ---------------------------------------------------------------------------
# TODO 2: Remove stop words
# ---------------------------------------------------------------------------

STOP_WORDS = {
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
    'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up',
    'about', 'into', 'through', 'and', 'but', 'or', 'nor', 'so', 'yet',
    'i', 'me', 'my', 'myself', 'we', 'our', 'you', 'your', 'he', 'she',
    'it', 'its', 'they', 'them', 'that', 'this', 'these', 'those',
}

def remove_stopwords(tokens):
    return [t for t in tokens if t not in STOP_WORDS]

# ---------------------------------------------------------------------------
# TODO 3: Simple stemmer
# ---------------------------------------------------------------------------

def stem_token(token):
    if token.endswith('ing') and len(token) > 5:
        return token[:-3]
    if token.endswith('tion') and len(token) > 6:
        return token[:-4]
    if token.endswith('ly') and len(token) > 4:
        return token[:-2]
    if token.endswith('s') and not token.endswith('ss') and len(token) > 3:
        return token[:-1]
    return token

# ---------------------------------------------------------------------------
# TODO 4: Full preprocessing pipeline
# ---------------------------------------------------------------------------

def full_preprocess(text):
    tokens = preprocess_text(text)
    tokens = remove_stopwords(tokens)
    tokens = [stem_token(t) for t in tokens]
    return tokens

# ---------------------------------------------------------------------------
# TODO 5: Bag of Words
# ---------------------------------------------------------------------------

def bag_of_words():
    cv = CountVectorizer()
    X_train = cv.fit_transform(texts_train_bin)
    X_test  = cv.transform(texts_test_bin)
    return {
        'vocab_size':          len(cv.vocabulary_),
        'train_matrix_shape':  X_train.shape,
        'test_matrix_shape':   X_test.shape,
    }

# ---------------------------------------------------------------------------
# TODO 6: TF-IDF vectorization
# ---------------------------------------------------------------------------

def tfidf_vectorization():
    tfidf = TfidfVectorizer(max_features=10000, stop_words='english')
    X_train = tfidf.fit_transform(texts_train_bin)
    X_test  = tfidf.transform(texts_test_bin)

    # Top 5 features by mean TF-IDF across training documents
    mean_tfidf  = np.asarray(X_train.mean(axis=0)).ravel()
    feature_names = np.array(tfidf.get_feature_names_out())
    top5_idx    = np.argsort(mean_tfidf)[::-1][:5]
    top5_features = feature_names[top5_idx].tolist()

    return {
        'vocab_size':          len(tfidf.vocabulary_),
        'top5_features':       top5_features,
        'train_matrix_shape':  X_train.shape,
    }

# ---------------------------------------------------------------------------
# TODO 7: Multinomial Naive Bayes
# ---------------------------------------------------------------------------

def train_naive_bayes_text():
    tfidf = TfidfVectorizer(max_features=10000, stop_words='english')
    X_train = tfidf.fit_transform(texts_train_bin)
    X_test  = tfidf.transform(texts_test_bin)

    model = MultinomialNB()
    model.fit(X_train, labels_train_bin)
    y_pred = model.predict(X_test)

    return {
        'accuracy':              round(accuracy_score(labels_test_bin, y_pred), 4),
        'classification_report': classification_report(labels_test_bin, y_pred,
                                                       target_names=BINARY_CATEGORIES),
    }

# ---------------------------------------------------------------------------
# TODO 8: Linear SVM
# ---------------------------------------------------------------------------

def train_svm_text():
    tfidf = TfidfVectorizer(max_features=10000, stop_words='english')
    X_train = tfidf.fit_transform(texts_train_bin)
    X_test  = tfidf.transform(texts_test_bin)

    model = LinearSVC(C=1.0, max_iter=2000)
    model.fit(X_train, labels_train_bin)
    acc = accuracy_score(labels_test_bin, model.predict(X_test))
    return {'accuracy': round(acc, 4)}

# ---------------------------------------------------------------------------
# TODO 9: Logistic Regression Pipeline
# ---------------------------------------------------------------------------

def train_logistic_pipeline():
    pipe = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=10000, stop_words='english')),
        ('clf',   LogisticRegression(max_iter=1000, random_state=42)),
    ])
    pipe.fit(texts_train_bin, labels_train_bin)
    acc = accuracy_score(labels_test_bin, pipe.predict(texts_test_bin))
    return {'accuracy': round(acc, 4), 'pipeline': pipe}

# ---------------------------------------------------------------------------
# TODO 10: N-gram comparison
# ---------------------------------------------------------------------------

def ngram_comparison():
    configs = {
        'unigram (1,1)':         (1, 1),
        'bigram (2,2)':          (2, 2),
        'unigram+bigram (1,2)':  (1, 2),
    }
    results = {}
    for label, ngram_range in configs.items():
        pipe = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=15000, stop_words='english',
                                     ngram_range=ngram_range)),
            ('clf',   MultinomialNB()),
        ])
        pipe.fit(texts_train_bin, labels_train_bin)
        acc = accuracy_score(labels_test_bin, pipe.predict(texts_test_bin))
        results[label] = round(acc, 4)
    return results

# ---------------------------------------------------------------------------
# TODO 11: Top predictive features per class
# ---------------------------------------------------------------------------

def top_features_per_class():
    tfidf = TfidfVectorizer(max_features=10000, stop_words='english')
    X_train = tfidf.fit_transform(texts_train_bin)

    model = MultinomialNB()
    model.fit(X_train, labels_train_bin)

    feature_names = np.array(tfidf.get_feature_names_out())
    result = {}
    for i, class_name in enumerate(BINARY_CATEGORIES):
        top10_idx = np.argsort(model.feature_log_prob_[i])[::-1][:10]
        result[class_name] = feature_names[top10_idx].tolist()
    return result

# ---------------------------------------------------------------------------
# TODO 12: Multi-class classification
# ---------------------------------------------------------------------------

def multiclass_classification():
    pipe = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=10000, stop_words='english')),
        ('clf',   LogisticRegression(max_iter=1000, random_state=42)),
    ])
    pipe.fit(newsgroups_train_mc.data, newsgroups_train_mc.target)
    acc = accuracy_score(newsgroups_test_mc.target, pipe.predict(newsgroups_test_mc.data))
    return {
        'accuracy':    round(acc, 4),
        'n_classes':   len(MULTI_CATEGORIES),
        'class_names': MULTI_CATEGORIES,
    }

# ---------------------------------------------------------------------------
# TODO 13: Cross-validation for text pipeline
# ---------------------------------------------------------------------------

def text_pipeline_cv():
    # Combine train + test for CV
    all_texts  = texts_train_bin + texts_test_bin
    all_labels = np.concatenate([labels_train_bin, labels_test_bin])

    pipe = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=10000, stop_words='english')),
        ('clf',   MultinomialNB()),
    ])
    scores = cross_val_score(pipe, all_texts, all_labels, cv=5, scoring='accuracy')
    return {'mean_acc': round(scores.mean(), 4), 'std_acc': round(scores.std(), 4)}

# ---------------------------------------------------------------------------
# TODO 14: Compare all classifiers on multi-class data
# ---------------------------------------------------------------------------

def compare_text_classifiers():
    models = {
        'MultinomialNB':      MultinomialNB(),
        'LinearSVC':          LinearSVC(C=1.0, max_iter=2000),
        'LogisticRegression': LogisticRegression(max_iter=1000, random_state=42),
    }
    results = {}
    for name, clf in models.items():
        pipe = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=10000, stop_words='english')),
            ('clf',   clf),
        ])
        pipe.fit(newsgroups_train_mc.data, newsgroups_train_mc.target)
        acc = accuracy_score(newsgroups_test_mc.target, pipe.predict(newsgroups_test_mc.data))
        results[name] = round(acc, 4)
    return results

# ---------------------------------------------------------------------------

def main():
    print("=== Solution 2.5: Text Classification ===\n")

    result = preprocess_text("Hello, World! 123 NLP is amazing.")
    print("Result 1  — Preprocess:", result)

    tokens = ['the', 'cat', 'sat', 'on', 'the', 'mat']
    print("Result 2  — Remove stopwords:", remove_stopwords(tokens))
    print("Result 3  — Stemming: running →", stem_token('running'),
          " | classification →", stem_token('classification'),
          " | dogs →", stem_token('dogs'))

    preprocessed = [full_preprocess(s) for s in SAMPLE_SENTENCES]
    print("Result 4  — Full preprocess (first):", preprocessed[0])

    print("Result 5  — Bag of words:", bag_of_words())
    tfidf_result = tfidf_vectorization()
    print("Result 6  — TF-IDF top features:", tfidf_result['top5_features'],
          "| shape:", tfidf_result['train_matrix_shape'])

    nb_result = train_naive_bayes_text()
    print("Result 7  — Naive Bayes accuracy:", nb_result['accuracy'])
    print(nb_result['classification_report'])

    print("Result 8  — SVM:", train_svm_text())
    lr_result = train_logistic_pipeline()
    print("Result 9  — Logistic Pipeline accuracy:", lr_result['accuracy'])
    print("Result 10 — N-gram comparison:", ngram_comparison())
    print("Result 11 — Top features per class:", top_features_per_class())
    print("Result 12 — Multi-class:", multiclass_classification())
    print("Result 13 — CV:", text_pipeline_cv())
    print("Result 14 — Compare classifiers:", compare_text_classifiers())

if __name__ == "__main__":
    main()
