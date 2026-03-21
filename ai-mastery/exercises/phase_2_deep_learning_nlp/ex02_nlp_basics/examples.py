# ============================================================
# Examples 2.2 — NLP Basics (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import re
import math
from collections import Counter, defaultdict
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Tokenize sentence by splitting on whitespace"""
    sentence = "The quick brown fox jumps over the lazy dog"
    tokens = sentence.split()
    print("Ex01 — Tokens:", tokens[:5], "... |", len(tokens), "total")

def ex02():
    """Word count in a sentence"""
    text = "to be or not to be that is the question"
    count = Counter(text.split())
    print("Ex02 — Word count:", dict(count))

def ex03():
    """Character count per word"""
    words = ["hello", "world", "NLP", "is", "fun"]
    char_counts = {w: len(w) for w in words}
    print("Ex03 — Char counts:", char_counts)

def ex04():
    """Remove punctuation from text"""
    text = "Hello, world! This is NLP... isn't it great?"
    cleaned = re.sub(r'[^\w\s]', '', text)
    print("Ex04 — Cleaned:", cleaned)

def ex05():
    """Lowercase normalization"""
    text = "The Quick Brown Fox JUMPS Over The Lazy Dog"
    lowered = text.lower()
    print("Ex05 — Lowercase:", lowered)

def ex06():
    """Remove stopwords using a manual list"""
    stopwords = {'the', 'is', 'in', 'it', 'and', 'to', 'a', 'of', 'for', 'on', 'are', 'was', 'be'}
    text = "the cat is in the hat and it is fun to be there"
    tokens = [w for w in text.split() if w not in stopwords]
    print("Ex06 — After stopword removal:", tokens)

def ex07():
    """Stem word with manual suffix-stripping rules"""
    def simple_stem(word):
        for suffix in ['ing', 'tion', 'ed', 'ly', 'er', 'ness']:
            if word.endswith(suffix) and len(word) > len(suffix) + 2:
                return word[:-len(suffix)]
        return word
    words = ["running", "faster", "kindness", "walked", "quickly", "nation"]
    stemmed = [simple_stem(w) for w in words]
    print("Ex07 — Stemmed:", list(zip(words, stemmed)))

def ex08():
    """Bag of words (manual)"""
    corpus = ["cat sat on mat", "cat ate rat", "rat sat on mat"]
    vocab = sorted(set(w for doc in corpus for w in doc.split()))
    bow = [[doc.split().count(w) for w in vocab] for doc in corpus]
    print("Ex08 — Vocab:", vocab)
    print("       BoW[0]:", bow[0])

def ex09():
    """Build vocabulary from corpus"""
    corpus = ["I love NLP", "NLP is amazing", "I love machine learning", "learning is fun"]
    vocab = sorted(set(w.lower() for doc in corpus for w in doc.split()))
    word2idx = {w: i for i, w in enumerate(vocab)}
    print("Ex09 — Vocab size:", len(vocab), "| First 5:", vocab[:5])

def ex10():
    """Word frequency counter"""
    text = "the cat sat on the mat the cat ate the rat the rat ran"
    freq = Counter(text.split())
    print("Ex10 — Top 5 words:", freq.most_common(5))

def ex11():
    """Sentence length distribution"""
    sentences = ["Hello", "How are you", "The quick brown fox", "Hi", "NLP is great fun today"]
    lengths = [len(s.split()) for s in sentences]
    print("Ex11 — Lengths:", lengths, "| Mean:", round(np.mean(lengths), 2))

def ex12():
    """Bigrams (2-grams)"""
    def bigrams(tokens):
        return [(tokens[i], tokens[i+1]) for i in range(len(tokens)-1)]
    tokens = "the cat sat on the mat".split()
    result = bigrams(tokens)
    print("Ex12 — Bigrams:", result)

def ex13():
    """Trigrams (3-grams)"""
    def ngrams(tokens, n):
        return [tuple(tokens[i:i+n]) for i in range(len(tokens)-n+1)]
    tokens = "the quick brown fox jumps".split()
    result = ngrams(tokens, 3)
    print("Ex13 — Trigrams:", result)

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """TF-IDF manual calculation"""
    corpus = ["cat sat on mat", "cat ate rat", "dog sat on mat"]
    word = "cat"
    tf = sum(doc.split().count(word) for doc in corpus) / sum(len(doc.split()) for doc in corpus)
    df = sum(1 for doc in corpus if word in doc.split())
    idf = math.log((len(corpus) + 1) / (df + 1)) + 1
    tfidf = tf * idf
    print("Ex14 — Manual TF-IDF for '{}': TF={:.4f}, IDF={:.4f}, TF-IDF={:.4f}".format(word, tf, idf, tfidf))

def ex15():
    """CountVectorizer from sklearn"""
    corpus = ["the cat sat on the mat", "the cat ate the rat", "the rat sat on the mat"]
    vec = CountVectorizer()
    X = vec.fit_transform(corpus)
    print("Ex15 — CountVectorizer shape:", X.shape, "| Features:", vec.get_feature_names_out())

def ex16():
    """TfidfVectorizer from sklearn"""
    corpus = ["the cat sat on the mat", "the cat ate the rat", "the rat sat on the mat"]
    vec = TfidfVectorizer()
    X = vec.fit_transform(corpus)
    print("Ex16 — TF-IDF shape:", X.shape, "| Top feature:", vec.get_feature_names_out()[X.toarray()[0].argmax()])

def ex17():
    """Cosine similarity between TF-IDF vectors"""
    corpus = ["I love machine learning", "I love deep learning", "The weather is nice today"]
    vec = TfidfVectorizer()
    X = vec.fit_transform(corpus)
    sim = cosine_similarity(X[0], X[1])[0][0]
    sim2 = cosine_similarity(X[0], X[2])[0][0]
    print("Ex17 — Sim(doc0,doc1):", round(sim, 4), "| Sim(doc0,doc2):", round(sim2, 4))

def ex18():
    """Edit distance (Levenshtein)"""
    def levenshtein(s1, s2):
        m, n = len(s1), len(s2)
        dp = [[0]*(n+1) for _ in range(m+1)]
        for i in range(m+1): dp[i][0] = i
        for j in range(n+1): dp[0][j] = j
        for i in range(1, m+1):
            for j in range(1, n+1):
                if s1[i-1] == s2[j-1]: dp[i][j] = dp[i-1][j-1]
                else: dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
        return dp[m][n]
    print("Ex18 — Levenshtein('kitten','sitting'):", levenshtein("kitten", "sitting"))

def ex19():
    """Jaccard similarity"""
    def jaccard(s1, s2):
        set1, set2 = set(s1.split()), set(s2.split())
        return len(set1 & set2) / len(set1 | set2) if set1 | set2 else 0.0
    a = "I love natural language processing"
    b = "I love machine learning and processing"
    print("Ex19 — Jaccard similarity:", round(jaccard(a, b), 4))

def ex20():
    """Word co-occurrence matrix"""
    corpus = [["cat", "sat", "mat"], ["cat", "ate", "rat"], ["dog", "sat", "mat"]]
    vocab = sorted(set(w for doc in corpus for w in doc))
    w2i = {w: i for i, w in enumerate(vocab)}
    co = np.zeros((len(vocab), len(vocab)), dtype=int)
    for doc in corpus:
        for i, w1 in enumerate(doc):
            for w2 in doc[max(0, i-1):i] + doc[i+1:min(len(doc), i+2)]:
                co[w2i[w1], w2i[w2]] += 1
    print("Ex20 — Co-occurrence matrix shape:", co.shape, "| Vocab:", vocab)

def ex21():
    """PPMI (Positive Pointwise Mutual Information) matrix"""
    co = np.array([[3, 1, 0], [1, 2, 1], [0, 1, 3]], dtype=float)
    total = co.sum()
    row_sum = co.sum(axis=1, keepdims=True)
    col_sum = co.sum(axis=0, keepdims=True)
    expected = row_sum @ col_sum / total
    with np.errstate(divide='ignore', invalid='ignore'):
        pmi = np.where(co > 0, np.log2(co / expected + 1e-9), 0)
    ppmi = np.maximum(pmi, 0)
    print("Ex21 — PPMI matrix:\n", np.round(ppmi, 2))

def ex22():
    """Word2Vec concept (skip-gram objective)"""
    # Demonstrate skip-gram pair generation
    sentence = "the quick brown fox jumps".split()
    window = 2
    pairs = []
    for i, center in enumerate(sentence):
        for j in range(max(0, i-window), min(len(sentence), i+window+1)):
            if j != i:
                pairs.append((center, sentence[j]))
    print("Ex22 — Word2Vec skip-gram pairs (center, context):", pairs[:6])

def ex23():
    """GloVe concept (co-occurrence + log ratio)"""
    # X_ij = co-occurrence count; GloVe minimizes (w_i . w_j + b_i + b_j - log X_ij)^2
    co_counts = {"the_cat": 5, "the_dog": 3, "the_rat": 1}
    log_co = {k: round(math.log(v), 4) for k, v in co_counts.items()}
    print("Ex23 — GloVe log co-occurrence targets:", log_co)

def ex24():
    """Sentence similarity using TF-IDF + cosine"""
    sentences = [
        "The cat sat on the mat",
        "A cat was sitting on the mat",
        "Dogs are great pets",
        "The quick brown fox"
    ]
    vec = TfidfVectorizer()
    X = vec.fit_transform(sentences)
    query = vec.transform(["cat sitting on mat"])
    sims = cosine_similarity(query, X)[0]
    best = sims.argmax()
    print("Ex24 — Most similar sentence:", sentences[best], "| Score:", round(sims[best], 4))

def ex25():
    """Document clustering with KMeans on TF-IDF"""
    docs = ["I love cats", "Cats are great pets", "Dogs are loyal friends",
            "I prefer dogs over cats", "Machine learning is fascinating",
            "Deep learning uses neural networks"]
    vec = TfidfVectorizer()
    X = vec.fit_transform(docs)
    km = KMeans(n_clusters=2, random_state=0, n_init=10)
    labels = km.fit_predict(X)
    print("Ex25 — KMeans cluster labels:", labels)

def ex26():
    """Regex text extraction"""
    text = "Call us at 555-1234 or 800-555-9876. Email: info@example.com or support@nlp.org"
    phones = re.findall(r'\d{3}-\d{4}', text)
    emails = re.findall(r'[\w.]+@[\w.]+\.\w+', text)
    print("Ex26 — Phones:", phones, "| Emails:", emails)

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """Text preprocessing pipeline (class)"""
    class TextPreprocessor:
        def __init__(self, lower=True, remove_punct=True, remove_stops=True):
            self.lower = lower
            self.remove_punct = remove_punct
            self.stopwords = {'the', 'is', 'in', 'and', 'a', 'to', 'of', 'for', 'on', 'are', 'was'}

        def transform(self, text):
            if self.lower: text = text.lower()
            if self.remove_punct: text = re.sub(r'[^\w\s]', '', text)
            tokens = text.split()
            tokens = [t for t in tokens if t not in self.stopwords]
            return tokens

    pp = TextPreprocessor()
    result = pp.transform("The quick, brown fox jumps over the lazy dog!")
    print("Ex27 — Preprocessed tokens:", result)

def ex28():
    """Sentiment lexicon scorer"""
    pos_words = {'good', 'great', 'excellent', 'amazing', 'wonderful', 'love', 'best', 'fantastic'}
    neg_words = {'bad', 'terrible', 'horrible', 'worst', 'awful', 'hate', 'disappointing', 'poor'}

    def score_sentiment(text):
        tokens = set(text.lower().split())
        pos = len(tokens & pos_words)
        neg = len(tokens & neg_words)
        if pos > neg: return "positive"
        elif neg > pos: return "negative"
        return "neutral"

    texts = ["This movie is great and amazing!", "Terrible and awful experience", "The weather is okay"]
    for t in texts:
        print("Ex28 — Sentiment:", score_sentiment(t), "| Text:", t[:40])

def ex29():
    """Text classification pipeline (TF-IDF + LogReg)"""
    texts = ["I love this product", "This is terrible", "Amazing quality", "Worst purchase ever",
             "Great value", "Horrible experience", "Really good", "Very bad"]
    labels = [1, 0, 1, 0, 1, 0, 1, 0]
    vec = TfidfVectorizer()
    X = vec.fit_transform(texts)
    clf = LogisticRegression(random_state=0)
    clf.fit(X, labels)
    test = vec.transform(["This is fantastic"])
    pred = clf.predict(test)[0]
    print("Ex29 — TF-IDF + LogReg prediction:", "positive" if pred == 1 else "negative")

def ex30():
    """Named entity recognition (regex-based)"""
    def simple_ner(text):
        entities = {}
        dates = re.findall(r'\b\d{1,2}/\d{1,2}/\d{2,4}\b|\b\d{4}\b', text)
        emails = re.findall(r'[\w.]+@[\w.]+\.\w+', text)
        caps = re.findall(r'\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b', text)
        if dates: entities['DATE'] = dates
        if emails: entities['EMAIL'] = emails
        if caps: entities['PROPER'] = caps
        return entities
    text = "John Smith emailed boss@company.com on 12/25/2023 about the New York office."
    print("Ex30 — NER entities:", simple_ner(text))

def ex31():
    """POS tagging with simple rules"""
    def simple_pos(word):
        if word.lower() in {'is', 'are', 'was', 'were', 'run', 'jump', 'eat', 'love'}: return 'VB'
        if word.endswith('ing'): return 'VBG'
        if word.endswith('ed'): return 'VBD'
        if word.endswith('ly'): return 'RB'
        if word[0].isupper(): return 'NNP'
        if word.lower() in {'the', 'a', 'an'}: return 'DT'
        return 'NN'
    sentence = "The quick fox quickly jumped over dogs".split()
    tagged = [(w, simple_pos(w)) for w in sentence]
    print("Ex31 — POS tags:", tagged)

def ex32():
    """Dependency parsing concept (simplified)"""
    # Demonstrate basic subject-verb-object extraction
    def extract_svo(sentence):
        tokens = sentence.lower().split()
        verbs = {'ate', 'loves', 'hates', 'sees', 'runs'}
        for i, tok in enumerate(tokens):
            if tok in verbs:
                subj = tokens[i-1] if i > 0 else None
                obj = tokens[i+1] if i < len(tokens)-1 else None
                return subj, tok, obj
        return None, None, None
    s, v, o = extract_svo("The cat ate the rat")
    print("Ex32 — Dependency SVO: Subject='{}', Verb='{}', Object='{}'".format(s, v, o))

def ex33():
    """Extractive text summarization (TF-IDF sentence scoring)"""
    text = ("Machine learning is a subset of AI. "
            "Deep learning uses neural networks with many layers. "
            "Neural networks are inspired by the human brain. "
            "AI is transforming many industries today.")
    sentences = text.split('. ')
    vec = TfidfVectorizer()
    X = vec.fit_transform(sentences)
    scores = X.toarray().sum(axis=1)
    top_idx = scores.argmax()
    print("Ex33 — Top summary sentence:", sentences[top_idx])

def ex34():
    """Keyword extraction using TF-IDF top-k"""
    docs = ["machine learning algorithms optimize models automatically",
            "deep neural networks learn complex representations",
            "natural language processing handles text data"]
    vec = TfidfVectorizer()
    X = vec.fit_transform(docs)
    features = vec.get_feature_names_out()
    scores = X.toarray().sum(axis=0)
    top_k = 5
    top_idx = scores.argsort()[-top_k:][::-1]
    print("Ex34 — Top keywords:", [features[i] for i in top_idx])

def ex35():
    """Duplicate detection using Jaccard similarity"""
    def jaccard(a, b):
        s1, s2 = set(a.lower().split()), set(b.lower().split())
        return len(s1 & s2) / len(s1 | s2) if s1 | s2 else 0.0

    pairs = [
        ("I love NLP", "I love natural language processing"),
        ("The cat sat on the mat", "The cat sat on the mat"),
        ("Deep learning is powerful", "Machine learning is useful"),
    ]
    for a, b in pairs:
        print("Ex35 — Jaccard({:.0f} chars vs {:.0f} chars): {:.4f}".format(len(a), len(b), jaccard(a, b)))

def ex36():
    """Text augmentation (synonym replacement concept)"""
    synonym_map = {
        "good": "great", "fast": "quick", "bad": "terrible",
        "big": "large", "small": "tiny", "happy": "joyful"
    }
    def augment(text):
        tokens = text.split()
        return ' '.join(synonym_map.get(t.lower(), t) for t in tokens)
    text = "The good and fast algorithm solves big problems in small time"
    augmented = augment(text)
    print("Ex36 — Original:", text)
    print("       Augmented:", augmented)

def ex37():
    """Language detection via character n-gram profiles"""
    def char_ngrams(text, n=2):
        text = text.lower().replace(' ', '_')
        return Counter(text[i:i+n] for i in range(len(text)-n+1))

    profiles = {
        'en': char_ngrams("the and for that this with have from they know"),
        'es': char_ngrams("que los una para como también pero ella sus están"),
        'fr': char_ngrams("les des une pour dans avec est sur qui pas"),
    }

    def detect_lang(text):
        tprof = char_ngrams(text)
        scores = {}
        for lang, prof in profiles.items():
            common = sum((min(tprof[k], prof[k]) for k in tprof), 0)
            scores[lang] = common
        return max(scores, key=scores.get)

    tests = ["this is a great day", "esto es muy bueno", "c'est tres bien"]
    for t in tests:
        print("Ex37 — '{}' → {}".format(t, detect_lang(t)))

def ex38():
    """Full text analytics pipeline"""
    class TextAnalyticsPipeline:
        def __init__(self):
            self.vectorizer = TfidfVectorizer(max_features=50, stop_words='english')
            self.classifier = LogisticRegression(max_iter=200, random_state=0)
            self.is_fitted = False

        def fit(self, texts, labels):
            X = self.vectorizer.fit_transform(texts)
            self.classifier.fit(X, labels)
            self.is_fitted = True
            return self

        def predict(self, texts):
            X = self.vectorizer.transform(texts)
            return self.classifier.predict(X)

        def evaluate(self, texts, labels):
            preds = self.predict(texts)
            return round((preds == np.array(labels)).mean(), 4)

    train_texts = ["great product", "terrible quality", "excellent service", "bad experience",
                   "wonderful item", "worst ever", "highly recommend", "do not buy"]
    train_labels = [1, 0, 1, 0, 1, 0, 1, 0]
    pipeline = TextAnalyticsPipeline().fit(train_texts, train_labels)
    preds = pipeline.predict(["this is amazing", "really bad"])
    print("Ex38 — Pipeline preds:", ["pos" if p else "neg" for p in preds])

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Subword tokenization — BPE concept"""
    # Demonstrate vocabulary merging step
    vocab = {"l o w </w>": 5, "l o w e r </w>": 2, "n e w e s t </w>": 6, "w i d e s t </w>": 3}
    def get_pairs(vocab):
        pairs = Counter()
        for word, freq in vocab.items():
            symbols = word.split()
            for i in range(len(symbols)-1):
                pairs[(symbols[i], symbols[i+1])] += freq
        return pairs
    pairs = get_pairs(vocab)
    best = pairs.most_common(1)[0]
    print("Ex39 — BPE: Most frequent pair:", best[0], "| Frequency:", best[1])

def ex40():
    """Byte pair encoding step"""
    def bpe_step(vocab, pair):
        bigram = ' '.join(pair)
        replacement = ''.join(pair)
        new_vocab = {}
        for word, freq in vocab.items():
            new_word = word.replace(bigram, replacement)
            new_vocab[new_word] = freq
        return new_vocab
    vocab = {"l o w </w>": 5, "l o w e r </w>": 2, "n e w e s t </w>": 6}
    new_vocab = bpe_step(vocab, ('e', 's'))
    print("Ex40 — After BPE merge ('e','s'):", new_vocab)

def ex41():
    """WordPiece tokenization concept"""
    # WordPiece: split word into known subwords
    known_vocab = {'un', 'want', '##ed', '##ing', 'want', 'wanted', 'un', '##want', '##ed'}
    word = "unwanted"
    # Greedy longest-match tokenization
    result = []
    i = 0
    while i < len(word):
        found = False
        for j in range(len(word), i, -1):
            prefix = ("##" if i > 0 else "") + word[i:j]
            if prefix in known_vocab or word[i:j] in known_vocab:
                result.append(word[i:j] if i == 0 else "##" + word[i:j])
                i = j; found = True; break
        if not found: result.append(word[i]); i += 1
    print("Ex41 — WordPiece tokens for 'unwanted':", result)

def ex42():
    """SentencePiece concept (unigram model demo)"""
    # Demonstrate unigram score: log P(subword sequence)
    subword_probs = {'▁the': 0.1, '▁cat': 0.05, 'sat': 0.03, '▁on': 0.08, '▁mat': 0.04}
    sequence = ['▁the', '▁cat', 'sat', '▁on', '▁mat']
    score = sum(math.log(subword_probs.get(t, 1e-6)) for t in sequence)
    print("Ex42 — SentencePiece unigram score:", round(score, 4), "| Tokens:", sequence)

def ex43():
    """Positional encoding (sinusoidal)"""
    def positional_encoding(max_seq_len, d_model):
        PE = np.zeros((max_seq_len, d_model))
        for pos in range(max_seq_len):
            for i in range(0, d_model, 2):
                PE[pos, i] = math.sin(pos / (10000 ** (i / d_model)))
                if i+1 < d_model:
                    PE[pos, i+1] = math.cos(pos / (10000 ** (i / d_model)))
        return PE
    pe = positional_encoding(5, 8)
    print("Ex43 — Positional encoding shape:", pe.shape, "| PE[0,:]:", np.round(pe[0], 4))

def ex44():
    """Multi-head attention concept (numpy)"""
    np.random.seed(0)
    d_model, num_heads, seq_len = 8, 2, 4
    d_k = d_model // num_heads
    X = np.random.randn(seq_len, d_model)
    heads = []
    for h in range(num_heads):
        Wq = np.random.randn(d_model, d_k); Wk = np.random.randn(d_model, d_k); Wv = np.random.randn(d_model, d_k)
        Q, K, V = X @ Wq, X @ Wk, X @ Wv
        scores = Q @ K.T / math.sqrt(d_k)
        e = np.exp(scores - scores.max(axis=-1, keepdims=True))
        attn = (e / e.sum(axis=-1, keepdims=True)) @ V
        heads.append(attn)
    multi_head = np.concatenate(heads, axis=-1)
    print("Ex44 — Multi-head attention output shape:", multi_head.shape)

def ex45():
    """Transformer encoder block (numpy concept)"""
    np.random.seed(42)
    seq_len, d_model = 3, 8
    X = np.random.randn(seq_len, d_model)
    # Self-attention
    Wq = Wk = Wv = np.eye(d_model)
    Q, K, V = X @ Wq, X @ Wk, X @ Wv
    scores = Q @ K.T / math.sqrt(d_model)
    e = np.exp(scores - scores.max(axis=-1, keepdims=True))
    attn = (e / e.sum(axis=-1, keepdims=True)) @ V
    # Add & Norm
    attn_out = X + attn
    norm1 = (attn_out - attn_out.mean(axis=-1, keepdims=True)) / (attn_out.std(axis=-1, keepdims=True) + 1e-8)
    # FFN
    W1 = np.random.randn(d_model, 16); W2 = np.random.randn(16, d_model)
    ffn = np.maximum(0, norm1 @ W1) @ W2
    out = norm1 + ffn
    print("Ex45 — Transformer encoder block output shape:", out.shape)

def ex46():
    """Token embedding + positional encoding"""
    np.random.seed(0)
    vocab_size, d_model, seq_len = 100, 8, 5
    embedding_matrix = np.random.randn(vocab_size, d_model) * 0.1
    token_ids = np.array([3, 15, 7, 42, 1])
    token_embeds = embedding_matrix[token_ids]
    # Add positional encoding
    PE = np.zeros((seq_len, d_model))
    for pos in range(seq_len):
        for i in range(0, d_model, 2):
            PE[pos, i] = math.sin(pos / 10000 ** (i / d_model))
            if i+1 < d_model: PE[pos, i+1] = math.cos(pos / 10000 ** (i / d_model))
    final = token_embeds + PE
    print("Ex46 — Token + positional embedding shape:", final.shape)

def ex47():
    """Attention mask (causal/padding)"""
    def causal_mask(seq_len):
        mask = np.tril(np.ones((seq_len, seq_len)))
        return mask
    def padding_mask(lengths, max_len):
        mask = np.array([[1]*l + [0]*(max_len-l) for l in lengths])
        return mask
    cm = causal_mask(4)
    pm = padding_mask([4, 3, 2], 4)
    print("Ex47 — Causal mask:\n", cm)
    print("       Padding mask:\n", pm)

def ex48():
    """Padding and masking in practice"""
    sequences = [[1, 2, 3, 4], [5, 6], [7, 8, 9]]
    max_len = max(len(s) for s in sequences)
    pad_id = 0
    padded = [s + [pad_id] * (max_len - len(s)) for s in sequences]
    mask = [[1]*len(s) + [0]*(max_len - len(s)) for s in sequences]
    print("Ex48 — Padded sequences:", padded)
    print("       Attention masks:", mask)

def ex49():
    """Beam search decoding concept"""
    def beam_search(init_scores, transitions, beam_width=2, steps=3):
        beams = [(0.0, [0])]
        for step in range(steps):
            candidates = []
            for score, seq in beams:
                for next_tok, trans_score in enumerate(transitions[seq[-1]]):
                    candidates.append((score + trans_score, seq + [next_tok]))
            candidates.sort(key=lambda x: x[0], reverse=True)
            beams = candidates[:beam_width]
        return beams
    transitions = {0: [0.5, 0.3, 0.2], 1: [0.2, 0.5, 0.3], 2: [0.3, 0.2, 0.5]}
    results = beam_search(0.0, transitions, beam_width=2)
    print("Ex49 — Beam search top sequences:", [(round(s, 3), seq) for s, seq in results])

def ex50():
    """BLEU score from scratch"""
    def bleu_score(reference, hypothesis, max_n=2):
        ref_tokens = reference.split()
        hyp_tokens = hypothesis.split()
        bp = 1.0 if len(hyp_tokens) >= len(ref_tokens) else math.exp(1 - len(ref_tokens)/len(hyp_tokens))
        precisions = []
        for n in range(1, max_n+1):
            ref_ngrams = Counter(tuple(ref_tokens[i:i+n]) for i in range(len(ref_tokens)-n+1))
            hyp_ngrams = Counter(tuple(hyp_tokens[i:i+n]) for i in range(len(hyp_tokens)-n+1))
            clipped = sum(min(c, ref_ngrams[ng]) for ng, c in hyp_ngrams.items())
            total = max(sum(hyp_ngrams.values()), 1)
            precisions.append(clipped / total)
        bleu = bp * math.exp(sum(math.log(max(p, 1e-9)) for p in precisions) / max_n)
        return round(bleu, 4)
    ref = "the cat sat on the mat"
    hyp = "the cat sat on the mat"
    hyp2 = "a dog jumped on floor"
    print("Ex50 — BLEU (perfect match):", bleu_score(ref, hyp))
    print("       BLEU (poor match):", bleu_score(ref, hyp2))


def main():
    print("=" * 60)
    print("Examples 2.2 — NLP Basics")
    print("=" * 60)
    print("\n─── BASIC (1–13) ───")
    ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07()
    ex08(); ex09(); ex10(); ex11(); ex12(); ex13()
    print("\n─── INTERMEDIATE (14–26) ───")
    ex14(); ex15(); ex16(); ex17(); ex18(); ex19(); ex20()
    ex21(); ex22(); ex23(); ex24(); ex25(); ex26()
    print("\n─── NESTED (27–38) ───")
    ex27(); ex28(); ex29(); ex30(); ex31(); ex32(); ex33()
    ex34(); ex35(); ex36(); ex37(); ex38()
    print("\n─── ADVANCED (39–50) ───")
    ex39(); ex40(); ex41(); ex42(); ex43(); ex44(); ex45()
    ex46(); ex47(); ex48(); ex49(); ex50()

if __name__ == "__main__":
    main()
