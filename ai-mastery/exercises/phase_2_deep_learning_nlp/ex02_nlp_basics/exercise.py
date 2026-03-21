# ============================================================
# Exercise 2.2 — NLP Fundamentals: Tokenization, Embeddings, Text Processing
# ============================================================
# Topics: Tokenization, stopwords, BoW, TF-IDF, cosine similarity,
#         n-grams, one-hot encoding, word2index, positional encoding,
#         word embeddings, sentence embeddings
# ============================================================
# NOTE: Requires: pip install scikit-learn numpy

import re
import math
import numpy as np
from collections import Counter
from typing import List, Dict, Tuple

# NOTE: Requires: pip install scikit-learn
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# ─────────────────────────────────────────────────────────
# TODO 1: Tokenize text by whitespace
# ─────────────────────────────────────────────────────────
# Split the input string on whitespace and return a list of tokens
def tokenize_whitespace(text: str) -> List[str]:
    pass  # TODO 1


# ─────────────────────────────────────────────────────────────────
# TODO 2: Tokenize with punctuation handling
# ─────────────────────────────────────────────────────────────────
# Lowercase the text, then use re.findall(r'\b\w+\b', text) to extract
# only word characters (strips punctuation automatically)
def tokenize_with_punct_handling(text: str) -> List[str]:
    pass  # TODO 2


# ─────────────────────────────────────────────────────────────────────
# TODO 3: Remove stopwords manually
# ─────────────────────────────────────────────────────────────────────
# Given a list of tokens and a set of stopwords,
# return tokens that are NOT in the stopwords set
STOPWORDS = {"the", "a", "an", "is", "it", "in", "on", "at", "to", "and",
             "or", "of", "for", "with", "this", "that", "are", "was", "be"}

def remove_stopwords(tokens: List[str], stopwords: set = STOPWORDS) -> List[str]:
    pass  # TODO 3


# ─────────────────────────────────────────────────────────────────────────────
# TODO 4: Implement bag-of-words using CountVectorizer
# ─────────────────────────────────────────────────────────────────────────────
# Fit a CountVectorizer on the corpus and transform it
# Return (feature_matrix, feature_names)
def bag_of_words(corpus: List[str]) -> Tuple[np.ndarray, List[str]]:
    pass  # TODO 4


# ─────────────────────────────────────────────────────────────────────────────
# TODO 5: Implement TF-IDF vectorization
# ─────────────────────────────────────────────────────────────────────────────
# Fit a TfidfVectorizer on the corpus and transform it
# Return (tfidf_matrix, feature_names)
def tfidf_vectorize(corpus: List[str]) -> Tuple[np.ndarray, List[str]]:
    pass  # TODO 5


# ─────────────────────────────────────────────────────────────────────────────
# TODO 6: Compute cosine similarity between two TF-IDF vectors
# ─────────────────────────────────────────────────────────────────────────────
# Given two 1D numpy arrays (TF-IDF vectors), compute their cosine similarity
# Formula: dot(a, b) / (norm(a) * norm(b))
# Handle zero-vector case (return 0.0 if either norm is 0)
def cosine_sim(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
    pass  # TODO 6


# ─────────────────────────────────────────────────────────────────────────────
# TODO 7: Implement simple word frequency counter
# ─────────────────────────────────────────────────────────────────────────────
# Given a list of tokens, return a dict mapping word → count
# Use collections.Counter
def word_frequency(tokens: List[str]) -> Dict[str, int]:
    pass  # TODO 7


# ─────────────────────────────────────────────────────────────────────────────
# TODO 8: N-gram extraction (bigrams and trigrams)
# ─────────────────────────────────────────────────────────────────────────────
# Given a list of tokens and n, return all n-grams as a list of tuples
# Example: tokens=["a","b","c"], n=2 → [("a","b"), ("b","c")]
def extract_ngrams(tokens: List[str], n: int) -> List[Tuple]:
    pass  # TODO 8


# ─────────────────────────────────────────────────────────────────────────────
# TODO 9: One-hot encode words (manual)
# ─────────────────────────────────────────────────────────────────────────────
# Given a vocabulary (list of unique words) and a word,
# return a one-hot vector (numpy array of zeros with a 1 at the word's index)
def one_hot_encode(word: str, vocabulary: List[str]) -> np.ndarray:
    pass  # TODO 9


# ─────────────────────────────────────────────────────────────────────────────
# TODO 10: Create word2index mapping
# ─────────────────────────────────────────────────────────────────────────────
# Given a corpus (list of strings), build a word2index dictionary
# that maps each unique word to a unique integer index
# Tokenize each sentence with tokenize_with_punct_handling
def build_word2index(corpus: List[str]) -> Dict[str, int]:
    pass  # TODO 10


# ─────────────────────────────────────────────────────────────────────────────
# TODO 11: Implement simple positional encoding concept
# ─────────────────────────────────────────────────────────────────────────────
# Positional encoding adds position info to token embeddings in Transformers.
# For position pos and dimension i (0-indexed):
#   PE[pos, 2i]   = sin(pos / 10000^(2i / d_model))
#   PE[pos, 2i+1] = cos(pos / 10000^(2i / d_model))
# Return a (seq_len, d_model) numpy array
def positional_encoding(seq_len: int, d_model: int) -> np.ndarray:
    pass  # TODO 11


# ─────────────────────────────────────────────────────────────────────────────
# TODO 12: Load and use pre-trained word embeddings (GloVe concept)
# ─────────────────────────────────────────────────────────────────────────────
# NOTE: Real GloVe embeddings require downloading glove.6B.zip from:
#   https://nlp.stanford.edu/projects/glove/
# Here, simulate a small embedding dict with random vectors for demo.
# Return a dict mapping word → numpy vector of size embedding_dim
def load_mock_embeddings(vocabulary: List[str], embedding_dim: int = 50) -> Dict[str, np.ndarray]:
    pass  # TODO 12: create random embeddings for each word in vocabulary


# ─────────────────────────────────────────────────────────────────────────────
# TODO 13: Compute sentence embedding as mean of word embeddings
# ─────────────────────────────────────────────────────────────────────────────
# Tokenize the sentence, look up each token's embedding, return the mean vector
# Skip tokens not in the embeddings dict
def sentence_embedding(sentence: str, embeddings: Dict[str, np.ndarray],
                       embedding_dim: int = 50) -> np.ndarray:
    pass  # TODO 13


# ─────────────────────────────────────────────────────────────────────────────
# TODO 14: Find most similar words by cosine similarity
# ─────────────────────────────────────────────────────────────────────────────
# Given a query word, a list of candidate words, and an embeddings dict,
# compute cosine similarity between the query and each candidate,
# return top_k candidates sorted by similarity (highest first)
# Return list of (word, similarity) tuples
def most_similar_words(query: str, candidates: List[str],
                       embeddings: Dict[str, np.ndarray],
                       top_k: int = 3) -> List[Tuple[str, float]]:
    pass  # TODO 14


# ─────────────────────────────────────────────────────────────────────────────
# TODO 15: Preprocess a text corpus
# ─────────────────────────────────────────────────────────────────────────────
# Apply the full preprocessing pipeline to each document:
#   1. Lowercase
#   2. Remove HTML tags using re.sub(r'<[^>]+>', '', text)
#   3. Remove punctuation/special chars using re.sub(r'[^a-z0-9\s]', '', text)
#   4. Tokenize by whitespace
#   5. Remove stopwords
# Return a list of token lists
def preprocess_corpus(corpus: List[str]) -> List[List[str]]:
    pass  # TODO 15


def main():
    print("=== Exercise 2.2 — NLP Fundamentals ===\n")

    sample_text = "The quick brown fox jumps over the lazy dog!"

    # Tokenization
    print("1. Whitespace tokenization:", tokenize_whitespace(sample_text))
    print("2. Punct-aware tokenization:", tokenize_with_punct_handling(sample_text))

    tokens = tokenize_with_punct_handling(sample_text)
    print("3. After stopword removal:", remove_stopwords(tokens))

    # BoW and TF-IDF
    corpus = [
        "The cat sat on the mat",
        "The dog sat on the log",
        "Cats and dogs are great pets",
        "Machine learning is a subset of artificial intelligence",
    ]

    bow_matrix, bow_features = bag_of_words(corpus)
    print(f"\n4. BoW matrix shape: {bow_matrix.shape if bow_matrix is not None else None}")

    tfidf_matrix, tfidf_features = tfidf_vectorize(corpus)
    print(f"5. TF-IDF matrix shape: {tfidf_matrix.shape if tfidf_matrix is not None else None}")

    if tfidf_matrix is not None:
        sim = cosine_sim(tfidf_matrix[0], tfidf_matrix[1])
        print(f"6. Cosine sim (doc0, doc1): {sim:.4f}")

    # Word frequency
    all_tokens = tokenize_with_punct_handling(" ".join(corpus))
    freq = word_frequency(all_tokens)
    print(f"\n7. Top 5 words: {sorted(freq.items(), key=lambda x: -x[1])[:5]}")

    # N-grams
    toks = tokenize_whitespace("I love natural language processing")
    print(f"8. Bigrams: {extract_ngrams(toks, 2)}")
    print(f"   Trigrams: {extract_ngrams(toks, 3)}")

    # One-hot
    vocab = ["cat", "dog", "fox", "bird"]
    vec = one_hot_encode("fox", vocab)
    print(f"\n9. One-hot 'fox' in {vocab}: {vec}")

    # word2index
    w2i = build_word2index(corpus)
    print(f"10. Vocab size: {len(w2i) if w2i else None}, sample: {dict(list(w2i.items())[:5]) if w2i else None}")

    # Positional encoding
    pe = positional_encoding(5, 8)
    print(f"\n11. Positional encoding shape (5, 8): {pe.shape if pe is not None else None}")

    # Mock embeddings
    vocabulary = ["king", "queen", "man", "woman", "cat", "dog"]
    np.random.seed(42)
    embeddings = load_mock_embeddings(vocabulary, embedding_dim=50)
    print(f"\n12. Mock embeddings loaded for: {list(embeddings.keys()) if embeddings else None}")

    # Sentence embedding
    sent_emb = sentence_embedding("king and queen", embeddings)
    print(f"13. Sentence embedding shape: {sent_emb.shape if sent_emb is not None else None}")

    # Most similar
    similar = most_similar_words("king", ["queen", "man", "woman", "cat"], embeddings, top_k=3)
    print(f"14. Most similar to 'king': {similar}")

    # Preprocess corpus
    raw_corpus = [
        "<p>The quick, brown fox!</p>",
        "<b>Machine Learning</b> is amazing.",
        "NLP: Natural Language Processing.",
    ]
    processed = preprocess_corpus(raw_corpus)
    print(f"\n15. Preprocessed corpus: {processed}")


if __name__ == "__main__":
    main()
