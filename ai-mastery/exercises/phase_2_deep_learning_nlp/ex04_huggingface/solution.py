# ============================================================
# Solution 2.4 — HuggingFace Transformers
# ============================================================
# NOTE: All implementations below show the correct code.
#       Actual inference calls (TODO 4–9, 12) require downloading
#       model weights from the HuggingFace Hub (~250 MB – 1.5 GB each).
#       They will work once models are cached locally.
#       TODO 1–3, 10–11 work with a single ~250 MB tokenizer download.
# ============================================================

try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

try:
    from transformers import (
        AutoTokenizer, AutoModel, AutoModelForSequenceClassification,
        pipeline,
    )
    HF_AVAILABLE = True
except ImportError:
    HF_AVAILABLE = False
    print("HuggingFace Transformers not installed.")
    print("Install with: pip install transformers")

# ---------------------------------------------------------------------------
# Sample texts
# ---------------------------------------------------------------------------
SAMPLE_TEXT = (
    "HuggingFace has revolutionised NLP by making state-of-the-art "
    "transformer models accessible to everyone through an easy-to-use API."
)

LONG_TEXT = (
    "The transformer architecture, introduced in the paper 'Attention is All You Need' "
    "in 2017, has become the dominant paradigm in natural language processing. "
    "Unlike recurrent neural networks, transformers process all tokens in parallel "
    "using a mechanism called self-attention. This allows them to capture long-range "
    "dependencies in text more effectively and to be trained much faster on modern "
    "hardware. Models like BERT, GPT, and T5 are all based on this architecture."
)

MOVIE_REVIEW_POS = "This film was absolutely brilliant! The acting was superb and the story kept me engaged throughout."
MOVIE_REVIEW_NEG = "What a waste of time. The plot made no sense and the acting was wooden and unconvincing."

QA_CONTEXT = (
    "The Python programming language was created by Guido van Rossum and first "
    "released in 1991. It emphasises code readability and uses significant indentation. "
    "Python is widely used for web development, data science, artificial intelligence, "
    "and automation."
)

NER_TEXT = (
    "Elon Musk, the CEO of Tesla and SpaceX, announced a new partnership with "
    "NASA in Washington D.C. last Tuesday."
)

# ---------------------------------------------------------------------------
# TODO 1: Load a tokenizer
# ---------------------------------------------------------------------------

def load_tokenizer():
    if not HF_AVAILABLE:
        return None
    # Downloads ~250 MB on first call; cached afterward.
    tokenizer = AutoTokenizer.from_pretrained('distilbert-base-uncased')
    return tokenizer

# ---------------------------------------------------------------------------
# TODO 2: Tokenize text and inspect the output
# ---------------------------------------------------------------------------

def tokenize_text():
    if not HF_AVAILABLE:
        return None
    tokenizer = load_tokenizer()
    encoding  = tokenizer(SAMPLE_TEXT, return_tensors=None)
    input_ids = encoding['input_ids']
    tokens    = tokenizer.convert_ids_to_tokens(input_ids)
    return {
        'input_ids_length':    len(input_ids),
        'tokens':              tokens,
        'attention_mask_sum':  sum(encoding['attention_mask']),
    }

# ---------------------------------------------------------------------------
# TODO 3: Encode and decode roundtrip
# ---------------------------------------------------------------------------

def encode_decode_roundtrip():
    if not HF_AVAILABLE:
        return None
    tokenizer = load_tokenizer()
    input_ids = tokenizer.encode(SAMPLE_TEXT)
    decoded   = tokenizer.decode(input_ids, skip_special_tokens=True)
    return {
        'original': SAMPLE_TEXT,
        'decoded':  decoded,
        'n_tokens': len(input_ids),
    }

# ---------------------------------------------------------------------------
# TODO 4: Sentiment analysis
# ---------------------------------------------------------------------------

def sentiment_analysis():
    if not HF_AVAILABLE:
        return None
    # Model: ~260 MB download
    clf = pipeline(
        'sentiment-analysis',
        model='distilbert-base-uncased-finetuned-sst-2-english',
    )
    results = clf([MOVIE_REVIEW_POS, MOVIE_REVIEW_NEG])
    return [{'label': r['label'], 'score': round(r['score'], 4)} for r in results]

# ---------------------------------------------------------------------------
# TODO 5: Text generation
# ---------------------------------------------------------------------------

def text_generation():
    if not HF_AVAILABLE:
        return None
    # GPT-2: ~500 MB download
    generator = pipeline('text-generation', model='gpt2')
    prompt = "Artificial intelligence will"
    outputs = generator(prompt, max_new_tokens=50, num_return_sequences=1)
    generated = outputs[0]['generated_text']
    return {
        'prompt':             prompt,
        'generated_text':     generated,
        'n_tokens_generated': len(generated.split()) - len(prompt.split()),
    }

# ---------------------------------------------------------------------------
# TODO 6: Question answering
# ---------------------------------------------------------------------------

def question_answering():
    if not HF_AVAILABLE:
        return None
    # DistilBERT SQuAD: ~260 MB download
    qa = pipeline(
        'question-answering',
        model='distilbert-base-cased-distilled-squad',
    )
    questions = [
        "Who created Python?",
        "When was Python first released?",
    ]
    results = []
    for q in questions:
        r = qa(question=q, context=QA_CONTEXT)
        results.append({
            'question': q,
            'answer':   r['answer'],
            'score':    round(r['score'], 4),
        })
    return results

# ---------------------------------------------------------------------------
# TODO 7: Named Entity Recognition
# ---------------------------------------------------------------------------

def named_entity_recognition():
    if not HF_AVAILABLE:
        return None
    # BERT NER: ~1.3 GB download
    ner = pipeline(
        'ner',
        model='dbmdz/bert-large-cased-finetuned-conll03-english',
        aggregation_strategy='simple',
    )
    entities = ner(NER_TEXT)
    return [
        {
            'entity_group': e['entity_group'],
            'word':         e['word'],
            'score':        round(e['score'], 4),
        }
        for e in entities
    ]

# ---------------------------------------------------------------------------
# TODO 8: Zero-shot classification
# ---------------------------------------------------------------------------

def zero_shot_classification():
    if not HF_AVAILABLE:
        return None
    # BART MNLI: ~1.6 GB download
    classifier = pipeline('zero-shot-classification', model='facebook/bart-large-mnli')
    candidate_labels = ['technology', 'sports', 'politics', 'science']
    result = classifier(SAMPLE_TEXT, candidate_labels=candidate_labels)
    return {
        'labels': result['labels'],
        'scores': [round(s, 4) for s in result['scores']],
    }

# ---------------------------------------------------------------------------
# TODO 9: Summarization
# ---------------------------------------------------------------------------

def summarization():
    if not HF_AVAILABLE:
        return None
    # DistilBART: ~1.2 GB download
    summarizer = pipeline('summarization', model='sshleifer/distilbart-cnn-12-6')
    result = summarizer(LONG_TEXT, max_length=60, min_length=20, do_sample=False)
    summary = result[0]['summary_text']
    return {
        'original_length': len(LONG_TEXT.split()),
        'summary':         summary,
        'summary_length':  len(summary.split()),
    }

# ---------------------------------------------------------------------------
# TODO 10: Batch tokenization
# ---------------------------------------------------------------------------

def batch_tokenization():
    if not HF_AVAILABLE:
        return None
    tokenizer = load_tokenizer()
    sentences = [MOVIE_REVIEW_POS, MOVIE_REVIEW_NEG, SAMPLE_TEXT]
    encoding  = tokenizer(
        sentences,
        padding=True,
        truncation=True,
        max_length=64,
        return_tensors='pt' if TORCH_AVAILABLE else 'np',
    )
    return {
        'input_ids_shape':      tuple(encoding['input_ids'].shape),
        'attention_mask_shape': tuple(encoding['attention_mask'].shape),
    }

# ---------------------------------------------------------------------------
# TODO 11: Tokenizer concepts
# ---------------------------------------------------------------------------

def tokenizer_concepts():
    if not HF_AVAILABLE:
        return None
    tokenizer = load_tokenizer()

    # a) Special tokens
    special_tokens = list(tokenizer.special_tokens_map.values())

    # b) Subword tokenisation — 'unbelievably' → ['un', '##bel', '##iev', '##ably']
    subword_example = tokenizer.tokenize('unbelievably')

    # c) Vocabulary size
    vocab_size = tokenizer.vocab_size

    return {
        'special_tokens':  special_tokens,
        'subword_example': subword_example,
        'vocab_size':      vocab_size,
    }

# ---------------------------------------------------------------------------
# TODO 12: Feature extraction — sentence embeddings
# ---------------------------------------------------------------------------

def feature_extraction():
    if not HF_AVAILABLE or not TORCH_AVAILABLE:
        return None
    tokenizer = load_tokenizer()
    model = AutoModel.from_pretrained('distilbert-base-uncased')
    model.eval()

    encoding = tokenizer(SAMPLE_TEXT, return_tensors='pt')
    with torch.no_grad():
        outputs = model(**encoding)

    # Last hidden state: (batch=1, seq_len, hidden=768)
    last_hidden = outputs.last_hidden_state
    # [CLS] token embedding: first token
    cls_embedding = last_hidden[:, 0, :]  # shape (1, 768)
    norm = cls_embedding.norm().item()

    return {
        'embedding_shape': tuple(cls_embedding.shape),
        'embedding_norm':  round(norm, 2),
    }

# ---------------------------------------------------------------------------

def main():
    print("=== Solution 2.4: HuggingFace Transformers ===\n")
    if not HF_AVAILABLE:
        print("HuggingFace Transformers not installed. Install with: pip install transformers")
        return
    print("NOTE: First run downloads model weights. Subsequent runs use cached files.\n")
    print("      TODO 4–9 each download a separate model (250 MB – 1.6 GB).\n")

    print("Result 1  — Tokenizer:", load_tokenizer())
    print("Result 2  — Tokenize:", tokenize_text())
    print("Result 3  — Roundtrip:", encode_decode_roundtrip())
    print("Result 4  — Sentiment:", sentiment_analysis())
    print("Result 5  — Generation:", text_generation())
    print("Result 6  — QA:", question_answering())
    print("Result 7  — NER:", named_entity_recognition())
    print("Result 8  — Zero-shot:", zero_shot_classification())
    print("Result 9  — Summary:", summarization())
    print("Result 10 — Batch tokenization:", batch_tokenization())
    print("Result 11 — Tokenizer concepts:", tokenizer_concepts())
    print("Result 12 — Feature extraction:", feature_extraction())

if __name__ == "__main__":
    main()
