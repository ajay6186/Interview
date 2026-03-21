# ============================================================
# Exercise 2.5 — Text Classification
# ============================================================
# Topics:
#   • Text preprocessing (tokenization, stopwords, stemming)
#   • TF-IDF vectorization
#   • Bag of words
#   • Train a classifier on text (Naive Bayes, SVM, Logistic Regression)
#   • Evaluate text classifier (accuracy, classification report)
#   • Feature importance for text
#   • N-grams
#   • Train/test split for text data
#   • Pipeline with TfidfVectorizer + classifier
#   • Multi-class text classification
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
# Binary: 20 Newsgroups — 2 categories for easy binary classification
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

# Multi-class: 4 categories
MULTI_CATEGORIES = ['rec.sport.baseball', 'sci.space', 'talk.politics.guns', 'comp.graphics']
newsgroups_train_mc = fetch_20newsgroups(
    subset='train', categories=MULTI_CATEGORIES,
    remove=('headers', 'footers', 'quotes'), random_state=42
)
newsgroups_test_mc = fetch_20newsgroups(
    subset='test', categories=MULTI_CATEGORIES,
    remove=('headers', 'footers', 'quotes'), random_state=42
)

# Small custom dataset for preprocessing demos
SAMPLE_SENTENCES = [
    "The quick brown fox jumps over the lazy dog.",
    "Machine learning is a subset of artificial intelligence.",
    "Natural language processing enables computers to understand text.",
    "Deep learning models have achieved remarkable results in NLP tasks.",
    "Text classification assigns predefined categories to documents.",
]

# ---------------------------------------------------------------------------
# TODO 1: Text preprocessing — clean and tokenize
# ---------------------------------------------------------------------------
# Write preprocess_text(text) that:
#   1. Lowercases the text
#   2. Removes punctuation and numbers
#   3. Splits into tokens (words)
#   4. Removes tokens shorter than 2 characters
# Return a list of cleaned tokens.
# Expected: preprocess_text("Hello, World! 123") → ['hello', 'world']

def preprocess_text(text):
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 2: Remove stop words manually
# ---------------------------------------------------------------------------
# Write remove_stopwords(tokens) using the provided STOP_WORDS set.
# Return a list of tokens with stop words removed.
# Expected: remove_stopwords(['the', 'cat', 'sat', 'on', 'the', 'mat']) → ['cat', 'sat', 'mat']

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
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 3: Implement a simple Porter-style stemmer rule
# ---------------------------------------------------------------------------
# Write stem_token(token) that applies basic suffixes removal rules:
#   - Remove 'ing' if word length > 5 (e.g., 'running' → 'runn')
#   - Remove 'tion' if word length > 6 (e.g., 'classification' → 'classifi')
#   - Remove 'ly' if word length > 4 (e.g., 'quickly' → 'quick')
#   - Remove trailing 's' if word length > 3 and doesn't end in 'ss'
# Return the stemmed token.
# Expected: stem_token('running') → 'runn', stem_token('dogs') → 'dog'

def stem_token(token):
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 4: Full preprocessing pipeline
# ---------------------------------------------------------------------------
# Write full_preprocess(text) that chains:
#   preprocess_text → remove_stopwords → stem each token
# Apply to all 5 SAMPLE_SENTENCES. Return a list of 5 token lists.
# Expected: list of lists, each shorter than the original sentence

def full_preprocess(text):
    pass  # TODO: implement using preprocess_text, remove_stopwords, stem_token

# ---------------------------------------------------------------------------
# TODO 5: Bag of Words (CountVectorizer)
# ---------------------------------------------------------------------------
# Fit a CountVectorizer on texts_train_bin, transform train and test.
# Return a dict {'vocab_size': ..., 'train_matrix_shape': ..., 'test_matrix_shape': ...}
# Expected: vocab_size ~20000-40000, matrix shapes (n_train, vocab_size)

def bag_of_words():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 6: TF-IDF vectorization
# ---------------------------------------------------------------------------
# Fit TfidfVectorizer(max_features=10000, stop_words='english') on binary train data.
# Transform train and test. Return a dict:
# {'vocab_size': ..., 'top5_features': [...], 'train_matrix_shape': ...}
# top5_features: feature names with highest mean TF-IDF score across training docs.
# Expected: top5 features are domain-relevant words (baseball, space, etc.)

def tfidf_vectorization():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 7: Train Multinomial Naive Bayes on TF-IDF features
# ---------------------------------------------------------------------------
# Use TfidfVectorizer + MultinomialNB. Fit on binary train data.
# Return a dict {'accuracy': ..., 'classification_report': ...}
# Expected: accuracy > 0.90

def train_naive_bayes_text():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 8: Train Linear SVM for text classification
# ---------------------------------------------------------------------------
# Use TfidfVectorizer(max_features=10000) + LinearSVC(C=1.0, max_iter=2000).
# Fit on binary train data. Return {'accuracy': ...}
# Expected: accuracy > 0.93

def train_svm_text():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 9: Train Logistic Regression with sklearn Pipeline
# ---------------------------------------------------------------------------
# Build Pipeline([('tfidf', TfidfVectorizer(...)), ('clf', LogisticRegression(...))])
# Use max_features=10000, stop_words='english', max_iter=1000.
# Return {'accuracy': ..., 'pipeline': ...}
# Expected: accuracy > 0.93

def train_logistic_pipeline():
    pass  # TODO: implement using sklearn Pipeline

# ---------------------------------------------------------------------------
# TODO 10: N-gram features (bigrams and trigrams)
# ---------------------------------------------------------------------------
# Compare unigrams vs bigrams vs unigram+bigram TF-IDF for Naive Bayes.
# Use ngram_range=(1,1), (2,2), (1,2) with max_features=15000.
# Return a dict {ngram_label: accuracy}.
# Expected: unigram+bigram often best, pure bigram often worst

def ngram_comparison():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 11: Top predictive features per class
# ---------------------------------------------------------------------------
# Train TfidfVectorizer + MultinomialNB on binary data.
# For each class, find the top 10 features with highest log probability.
# Return a dict {class_name: [top_10_feature_words]}.
# Expected: class 0 → baseball terms, class 1 → space/nasa terms

def top_features_per_class():
    pass  # TODO: implement using model.feature_log_prob_

# ---------------------------------------------------------------------------
# TODO 12: Multi-class text classification
# ---------------------------------------------------------------------------
# Use all 4 MULTI_CATEGORIES. Build TfidfVectorizer + LogisticRegression pipeline.
# Return {'accuracy': ..., 'n_classes': ..., 'class_names': [...]}
# Expected: accuracy > 0.85 on 4 classes

def multiclass_classification():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 13: Cross-validation for text pipeline
# ---------------------------------------------------------------------------
# Build a TfidfVectorizer + MultinomialNB pipeline.
# Run 5-fold CV on the combined binary dataset.
# Return {'mean_acc': ..., 'std_acc': ...}
# Expected: mean_acc > 0.90

def text_pipeline_cv():
    pass  # TODO: implement using cross_val_score

# ---------------------------------------------------------------------------
# TODO 14: Compare all classifiers on multi-class data
# ---------------------------------------------------------------------------
# Build three pipelines (TF-IDF + NaiveBayes, TF-IDF + LinearSVC,
# TF-IDF + LogisticRegression) on the 4-class dataset.
# Return a dict {model_name: accuracy}.
# Expected: all > 0.85

def compare_text_classifiers():
    pass  # TODO: implement

# ---------------------------------------------------------------------------

def main():
    print("=== Exercise 2.5: Text Classification ===\n")

    # TODO 1
    result = preprocess_text("Hello, World! 123 NLP is amazing.")
    print("TODO 1  — Preprocess:", result)

    # TODO 2
    tokens = ['the', 'cat', 'sat', 'on', 'the', 'mat']
    print("TODO 2  — Remove stopwords:", remove_stopwords(tokens))

    # TODO 3
    print("TODO 3  — Stemming:", stem_token('running'), stem_token('classification'), stem_token('dogs'))

    # TODO 4
    preprocessed = [full_preprocess(s) for s in SAMPLE_SENTENCES] if full_preprocess(SAMPLE_SENTENCES[0]) is not None else None
    print("TODO 4  — Full preprocess (first sentence):", preprocessed[0] if preprocessed else None)

    print("TODO 5  — Bag of words:", bag_of_words())
    print("TODO 6  — TF-IDF:", tfidf_vectorization())
    print("TODO 7  — Naive Bayes:", train_naive_bayes_text())
    print("TODO 8  — SVM:", train_svm_text())
    print("TODO 9  — Logistic Pipeline:", train_logistic_pipeline())
    print("TODO 10 — N-gram comparison:", ngram_comparison())
    print("TODO 11 — Top features per class:", top_features_per_class())
    print("TODO 12 — Multi-class:", multiclass_classification())
    print("TODO 13 — CV:", text_pipeline_cv())
    print("TODO 14 — Compare classifiers:", compare_text_classifiers())

if __name__ == "__main__":
    main()
