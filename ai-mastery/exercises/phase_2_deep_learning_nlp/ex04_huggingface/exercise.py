# ============================================================
# Exercise 2.4 — HuggingFace Transformers
# ============================================================
# Topics:
#   • Loading a tokenizer
#   • Tokenizing text (encode/decode)
#   • Loading a pre-trained model
#   • Running inference (pipeline API)
#   • Sentiment analysis pipeline
#   • Text generation pipeline
#   • Question answering pipeline
#   • Named entity recognition
#   • Zero-shot classification
#   • Summarization
# ============================================================

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
# Sample texts used throughout the exercise
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
# Load the tokenizer for 'distilbert-base-uncased'.
# Return the tokenizer object.
# NOTE: This requires an internet connection the first time (downloads ~250 MB).
# Expected: AutoTokenizer object with vocab_size > 30000

def load_tokenizer():
    if not HF_AVAILABLE:
        return None
    pass  # TODO: use AutoTokenizer.from_pretrained('distilbert-base-uncased')

# ---------------------------------------------------------------------------
# TODO 2: Tokenize text and inspect the output
# ---------------------------------------------------------------------------
# Using the tokenizer from TODO 1, tokenize SAMPLE_TEXT.
# Return a dict {'input_ids_length': ..., 'tokens': ..., 'attention_mask_sum': ...}
# tokens = tokenizer.convert_ids_to_tokens(input_ids)
# Expected: input_ids_length ~20, tokens is a list of strings, attention_mask_sum == input_ids_length

def tokenize_text():
    if not HF_AVAILABLE:
        return None
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 3: Encode and decode a sentence (round-trip)
# ---------------------------------------------------------------------------
# Encode SAMPLE_TEXT to token IDs, then decode back to a string.
# Return a dict {'original': SAMPLE_TEXT, 'decoded': ..., 'n_tokens': ...}
# Expected: decoded string should approximate the original (lowercased)

def encode_decode_roundtrip():
    if not HF_AVAILABLE:
        return None
    pass  # TODO: implement tokenizer.encode / tokenizer.decode

# ---------------------------------------------------------------------------
# TODO 4: Sentiment analysis with pipeline
# ---------------------------------------------------------------------------
# Create a pipeline('sentiment-analysis') using 'distilbert-base-uncased-finetuned-sst-2-english'.
# Run it on MOVIE_REVIEW_POS and MOVIE_REVIEW_NEG.
# Return a list of result dicts [{'label': ..., 'score': ...}, ...]
# Expected: first result POSITIVE, second NEGATIVE, scores > 0.95

def sentiment_analysis():
    if not HF_AVAILABLE:
        return None
    pass  # TODO: implement pipeline('sentiment-analysis', model='distilbert-base-uncased-finetuned-sst-2-english')

# ---------------------------------------------------------------------------
# TODO 5: Text generation with pipeline
# ---------------------------------------------------------------------------
# Create a pipeline('text-generation', model='gpt2').
# Generate a continuation for the prompt "Artificial intelligence will".
# Use max_new_tokens=50, num_return_sequences=1.
# Return a dict {'prompt': ..., 'generated_text': ..., 'n_tokens_generated': ...}
# Expected: generated_text starts with the prompt

def text_generation():
    if not HF_AVAILABLE:
        return None
    pass  # TODO: implement pipeline('text-generation', model='gpt2')

# ---------------------------------------------------------------------------
# TODO 6: Question answering pipeline
# ---------------------------------------------------------------------------
# Create a pipeline('question-answering', model='distilbert-base-cased-distilled-squad').
# Answer: "Who created Python?" and "When was Python first released?"
# using QA_CONTEXT as context.
# Return a list of dicts [{'question': ..., 'answer': ..., 'score': ...}, ...]
# Expected: answers 'Guido van Rossum' and '1991'

def question_answering():
    if not HF_AVAILABLE:
        return None
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 7: Named Entity Recognition (NER)
# ---------------------------------------------------------------------------
# Create a pipeline('ner', model='dbmdz/bert-large-cased-finetuned-conll03-english',
#                   aggregation_strategy='simple').
# Run it on NER_TEXT.
# Return a list of dicts [{'entity_group': ..., 'word': ..., 'score': ...}, ...]
# Expected: entities include Elon Musk (PER), Tesla (ORG), SpaceX (ORG), Washington D.C. (LOC)

def named_entity_recognition():
    if not HF_AVAILABLE:
        return None
    pass  # TODO: implement pipeline('ner', ...)

# ---------------------------------------------------------------------------
# TODO 8: Zero-shot classification
# ---------------------------------------------------------------------------
# Create a pipeline('zero-shot-classification', model='facebook/bart-large-mnli').
# Classify SAMPLE_TEXT into candidate_labels=['technology', 'sports', 'politics', 'science'].
# Return a dict {'labels': [...], 'scores': [...]} (top label first).
# Expected: 'technology' or 'science' should rank highest

def zero_shot_classification():
    if not HF_AVAILABLE:
        return None
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 9: Summarization pipeline
# ---------------------------------------------------------------------------
# Create a pipeline('summarization', model='sshleifer/distilbart-cnn-12-6').
# Summarize LONG_TEXT with max_length=60, min_length=20.
# Return a dict {'original_length': ..., 'summary': ..., 'summary_length': ...}
# Expected: summary is shorter than original and captures key ideas

def summarization():
    if not HF_AVAILABLE:
        return None
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 10: Batch tokenization with padding and truncation
# ---------------------------------------------------------------------------
# Tokenize a list of sentences with padding=True, truncation=True, max_length=64,
# return_tensors='pt'.
# Sentences: [MOVIE_REVIEW_POS, MOVIE_REVIEW_NEG, SAMPLE_TEXT]
# Return a dict {'input_ids_shape': ..., 'attention_mask_shape': ...}
# Expected: both shapes (3, <=64) — all sequences padded to the same length

def batch_tokenization():
    if not HF_AVAILABLE:
        return None
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 11: Describe transformer tokenizer concepts
# ---------------------------------------------------------------------------
# Without running model inference, demonstrate:
#   a) Special tokens: [CLS], [SEP], [PAD]
#   b) Subword tokenisation: show how 'unbelievably' is split
#   c) Vocabulary size of distilbert-base-uncased
# Return a dict {'special_tokens': ..., 'subword_example': ..., 'vocab_size': ...}
# Expected: special tokens list, subword list with '##' pieces, vocab_size ~30522

def tokenizer_concepts():
    if not HF_AVAILABLE:
        return None
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 12: Feature extraction — get sentence embeddings
# ---------------------------------------------------------------------------
# Load 'distilbert-base-uncased' with AutoModel.
# Pass tokenized SAMPLE_TEXT through the model (no grad).
# Extract the [CLS] token embedding (first token, last hidden state).
# Return a dict {'embedding_shape': ..., 'embedding_norm': ...}
# Expected: embedding_shape (1, 768), embedding_norm ~10-30

def feature_extraction():
    if not HF_AVAILABLE:
        return None
    pass  # TODO: implement using AutoModel and torch.no_grad()

# ---------------------------------------------------------------------------

def main():
    print("=== Exercise 2.4: HuggingFace Transformers ===\n")
    if not HF_AVAILABLE:
        print("HuggingFace Transformers not installed. Install with: pip install transformers")
        return
    print("NOTE: First run will download model weights from the HuggingFace Hub.")
    print("      Subsequent runs use the cached versions.\n")

    print("TODO 1  — Load tokenizer:", load_tokenizer())
    print("TODO 2  — Tokenize text:", tokenize_text())
    print("TODO 3  — Encode/decode roundtrip:", encode_decode_roundtrip())
    print("TODO 4  — Sentiment analysis:", sentiment_analysis())
    print("TODO 5  — Text generation:", text_generation())
    print("TODO 6  — Question answering:", question_answering())
    print("TODO 7  — NER:", named_entity_recognition())
    print("TODO 8  — Zero-shot classification:", zero_shot_classification())
    print("TODO 9  — Summarization:", summarization())
    print("TODO 10 — Batch tokenization:", batch_tokenization())
    print("TODO 11 — Tokenizer concepts:", tokenizer_concepts())
    print("TODO 12 — Feature extraction:", feature_extraction())

if __name__ == "__main__":
    main()
