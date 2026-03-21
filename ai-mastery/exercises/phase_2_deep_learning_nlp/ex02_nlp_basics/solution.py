# ============================================================
# Solution 2.2 — NLP Fundamentals: Tokenization, Embeddings, Text Processing
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
# SOLUTION 1: Tokenize text by whitespace
# ─────────────────────────────────────────────────────────
def tokenize_whitespace(text: str) -> List[str]:
    return text.split()


# ─────────────────────────────────────────────────────────────────
# SOLUTION 2: Tokenize with punctuation handling
# ─────────────────────────────────────────────────────────────────
def tokenize_with_punct_handling(text: str) -> List[str]:
    text = text.lower()
    return re.findall(r'\b\w+\b', text)  # Extract only word characters


# ─────────────────────────────────────────────────────────────────────
# SOLUTION 3: Remove stopwords manually
# ─────────────────────────────────────────────────────────────────────
STOPWORDS = {"the", "a", "an", "is", "it", "in", "on", "at", "to", "and",
             "or", "of", "for", "with", "this", "that", "are", "was", "be"}

def remove_stopwords(tokens: List[str], stopwords: set = STOPWORDS) -> List[str]:
    return [t for t in tokens if t not in stopwords]


# ─────────────────────────────────────────────────────────────────────────────
# SOLUTION 4: Implement bag-of-words using CountVectorizer
# ─────────────────────────────────────────────────────────────────────────────
def bag_of_words(corpus: List[str]) -> Tuple[np.ndarray, List[str]]:
    vectorizer = CountVectorizer()
    matrix = vectorizer.fit_transform(corpus).toarray()
    feature_names = vectorizer.get_feature_names_out().tolist()
    return matrix, feature_names


# ─────────────────────────────────────────────────────────────────────────────
# SOLUTION 5: Implement TF-IDF vectorization
# ─────────────────────────────────────────────────────────────────────────────
def tfidf_vectorize(corpus: List[str]) -> Tuple[np.ndarray, List[str]]:
    vectorizer = TfidfVectorizer()
    matrix = vectorizer.fit_transform(corpus).toarray()
    feature_names = vectorizer.get_feature_names_out().tolist()
    return matrix, feature_names


# ─────────────────────────────────────────────────────────────────────────────
# SOLUTION 6: Compute cosine similarity between two TF-IDF vectors
# ─────────────────────────────────────────────────────────────────────────────
def cosine_sim(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
    norm_a = np.linalg.norm(vec_a)
    norm_b = np.linalg.norm(vec_b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(vec_a, vec_b) / (norm_a * norm_b))


# ─────────────────────────────────────────────────────────────────────────────
# SOLUTION 7: Implement simple word frequency counter
# ─────────────────────────────────────────────────────────────────────────────
def word_frequency(tokens: List[str]) -> Dict[str, int]:
    return dict(Counter(tokens))


# ─────────────────────────────────────────────────────────────────────────────
# SOLUTION 8: N-gram extraction
# ─────────────────────────────────────────────────────────────────────────────
def extract_ngrams(tokens: List[str], n: int) -> List[Tuple]:
    return [tuple(tokens[i:i + n]) for i in range(len(tokens) - n + 1)]


# ─────────────────────────────────────────────────────────────────────────────
# SOLUTION 9: One-hot encode words (manual)
# ─────────────────────────────────────────────────────────────────────────────
def one_hot_encode(word: str, vocabulary: List[str]) -> np.ndarray:
    vector = np.zeros(len(vocabulary), dtype=int)
    if word in vocabulary:
        vector[vocabulary.index(word)] = 1
    return vector


# ─────────────────────────────────────────────────────────────────────────────
# SOLUTION 10: Create word2index mapping
# ─────────────────────────────────────────────────────────────────────────────
def build_word2index(corpus: List[str]) -> Dict[str, int]:
    all_tokens = []
    for doc in corpus:
        all_tokens.extend(tokenize_with_punct_handling(doc))
    unique_words = sorted(set(all_tokens))  # Sort for determinism
    return {word: idx for idx, word in enumerate(unique_words)}


# ─────────────────────────────────────────────────────────────────────────────
# SOLUTION 11: Implement simple positional encoding concept
# ─────────────────────────────────────────────────────────────────────────────
def positional_encoding(seq_len: int, d_model: int) -> np.ndarray:
    PE = np.zeros((seq_len, d_model))
    for pos in range(seq_len):
        for i in range(0, d_model, 2):
            denom = 10000 ** (2 * i / d_model)
            PE[pos, i] = math.sin(pos / denom)         # Even dimensions: sin
            if i + 1 < d_model:
                PE[pos, i + 1] = math.cos(pos / denom) # Odd dimensions: cos
    return PE


# ─────────────────────────────────────────────────────────────────────────────
# SOLUTION 12: Load mock word embeddings (simulating GloVe)
# ─────────────────────────────────────────────────────────────────────────────
# NOTE: Real GloVe: download glove.6B.zip from https://nlp.stanford.edu/projects/glove/
# Parse with: {line.split()[0]: np.array(line.split()[1:], dtype=float) for line in open(f)}
def load_mock_embeddings(vocabulary: List[str], embedding_dim: int = 50) -> Dict[str, np.ndarray]:
    # Simulate pre-trained embeddings with random vectors (seeded for reproducibility)
    return {word: np.random.randn(embedding_dim) for word in vocabulary}


# ─────────────────────────────────────────────────────────────────────────────
# SOLUTION 13: Compute sentence embedding as mean of word embeddings
# ─────────────────────────────────────────────────────────────────────────────
def sentence_embedding(sentence: str, embeddings: Dict[str, np.ndarray],
                       embedding_dim: int = 50) -> np.ndarray:
    tokens = tokenize_with_punct_handling(sentence)
    vectors = [embeddings[t] for t in tokens if t in embeddings]
    if not vectors:
        return np.zeros(embedding_dim)
    return np.mean(vectors, axis=0)  # Mean pooling


# ─────────────────────────────────────────────────────────────────────────────
# SOLUTION 14: Find most similar words by cosine similarity
# ─────────────────────────────────────────────────────────────────────────────
def most_similar_words(query: str, candidates: List[str],
                       embeddings: Dict[str, np.ndarray],
                       top_k: int = 3) -> List[Tuple[str, float]]:
    if query not in embeddings:
        return []
    query_vec = embeddings[query]
    similarities = []
    for word in candidates:
        if word in embeddings:
            sim = cosine_sim(query_vec, embeddings[word])
            similarities.append((word, sim))
    # Sort by similarity descending
    similarities.sort(key=lambda x: x[1], reverse=True)
    return similarities[:top_k]


# ─────────────────────────────────────────────────────────────────────────────
# SOLUTION 15: Preprocess a text corpus
# ─────────────────────────────────────────────────────────────────────────────
def preprocess_corpus(corpus: List[str]) -> List[List[str]]:
    processed = []
    for doc in corpus:
        # Step 1: Lowercase
        doc = doc.lower()
        # Step 2: Remove HTML tags
        doc = re.sub(r'<[^>]+>', '', doc)
        # Step 3: Remove punctuation/special characters
        doc = re.sub(r'[^a-z0-9\s]', '', doc)
        # Step 4: Tokenize by whitespace
        tokens = doc.split()
        # Step 5: Remove stopwords
        tokens = remove_stopwords(tokens)
        processed.append(tokens)
    return processed


def main():
    print("=== Solution 2.2 — NLP Fundamentals ===\n")

    sample_text = "The quick brown fox jumps over the lazy dog!"

    # 1 & 2: Tokenization
    ws_tokens = tokenize_whitespace(sample_text)
    print(f"1. Whitespace tokenization ({len(ws_tokens)} tokens):", ws_tokens)

    punct_tokens = tokenize_with_punct_handling(sample_text)
    print(f"2. Punct-aware tokenization ({len(punct_tokens)} tokens):", punct_tokens)
    # Difference: "dog!" → "dog" (punctuation stripped)

    # 3: Stopword removal
    clean = remove_stopwords(punct_tokens)
    print(f"3. After stopword removal ({len(clean)} tokens):", clean)

    # 4 & 5: BoW and TF-IDF
    corpus = [
        "The cat sat on the mat",
        "The dog sat on the log",
        "Cats and dogs are great pets",
        "Machine learning is a subset of artificial intelligence",
    ]

    bow_matrix, bow_features = bag_of_words(corpus)
    print(f"\n4. BoW matrix shape: {bow_matrix.shape}  (docs × vocab)")
    print(f"   Features sample: {bow_features[:8]}")

    tfidf_matrix, tfidf_features = tfidf_vectorize(corpus)
    print(f"\n5. TF-IDF matrix shape: {tfidf_matrix.shape}")

    # 6: Cosine similarity
    sim_01 = cosine_sim(tfidf_matrix[0], tfidf_matrix[1])
    sim_02 = cosine_sim(tfidf_matrix[0], tfidf_matrix[2])
    print(f"\n6. Cosine sim (doc0, doc1): {sim_01:.4f}  (similar — both about animals on furniture)")
    print(f"   Cosine sim (doc0, doc2): {sim_02:.4f}  (less similar)")

    # 7: Word frequency
    all_tokens = tokenize_with_punct_handling(" ".join(corpus))
    freq = word_frequency(all_tokens)
    top5 = sorted(freq.items(), key=lambda x: -x[1])[:5]
    print(f"\n7. Top 5 words: {top5}")

    # 8: N-grams
    toks = tokenize_whitespace("I love natural language processing")
    print(f"\n8. Bigrams:  {extract_ngrams(toks, 2)}")
    print(f"   Trigrams: {extract_ngrams(toks, 3)}")

    # 9: One-hot
    vocab = ["cat", "dog", "fox", "bird"]
    vec = one_hot_encode("fox", vocab)
    print(f"\n9. One-hot 'fox' in {vocab}: {vec}  (1 at index 2)")

    # 10: word2index
    w2i = build_word2index(corpus)
    print(f"\n10. Vocab size: {len(w2i)}, sample entries: {dict(list(w2i.items())[:6])}")

    # 11: Positional encoding
    pe = positional_encoding(5, 8)
    print(f"\n11. Positional encoding (5, 8):\n{pe.round(3)}")
    # Each row = position, alternating sin/cos values across dimensions

    # 12: Mock embeddings
    vocabulary = ["king", "queen", "man", "woman", "cat", "dog"]
    np.random.seed(42)
    embeddings = load_mock_embeddings(vocabulary, embedding_dim=50)
    print(f"\n12. Mock embeddings for: {list(embeddings.keys())}")
    print(f"    'king' vector norm: {np.linalg.norm(embeddings['king']):.4f}")

    # 13: Sentence embedding
    sent_emb = sentence_embedding("king and queen", embeddings)
    print(f"\n13. Sentence embedding of 'king and queen': shape={sent_emb.shape}, norm={np.linalg.norm(sent_emb):.4f}")
    # NOTE: 'and' is not in our mock vocab, so it's skipped — mean of king + queen

    # 14: Most similar
    similar = most_similar_words("king", ["queen", "man", "woman", "cat"], embeddings, top_k=3)
    print(f"\n14. Most similar to 'king': {[(w, round(s, 4)) for w, s in similar]}")
    # NOTE: Mock embeddings are random, so similarity values are arbitrary

    # 15: Preprocess
    raw_corpus = [
        "<p>The quick, brown fox!</p>",
        "<b>Machine Learning</b> is amazing.",
        "NLP: Natural Language Processing.",
    ]
    processed = preprocess_corpus(raw_corpus)
    print(f"\n15. Preprocessed corpus:")
    for i, doc in enumerate(processed):
        print(f"    Doc {i}: {doc}")


if __name__ == "__main__":
    main()
