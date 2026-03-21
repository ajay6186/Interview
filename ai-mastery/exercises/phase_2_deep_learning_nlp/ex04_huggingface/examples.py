# ============================================================
# Examples 2.4 — HuggingFace Transformers (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

# NOTE: All examples show code patterns as strings — no model downloads required.
# To run actual inference, install: pip install transformers torch datasets

try:
    from transformers import (AutoTokenizer, AutoModel, AutoModelForSequenceClassification,
                               AutoModelForCausalLM, pipeline, Trainer, TrainingArguments)
    HF_AVAILABLE = True
except ImportError:
    HF_AVAILABLE = False

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """What is a tokenizer"""
    print("Ex01 — What is a tokenizer:")
    print("  A tokenizer converts raw text into token IDs a model can process.")
    print("  It handles: splitting, subword encoding, special tokens, padding.")
    print("  Code pattern:")
    print("    from transformers import AutoTokenizer")
    print("    tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')")
    print("    # tokenizer maps 'Hello world' → [101, 7592, 2088, 102]")

def ex02():
    """Load tokenizer concept"""
    print("Ex02 — Load tokenizer concept:")
    code = """
from transformers import AutoTokenizer

# Load from HuggingFace Hub (downloads + caches model)
tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')

# Or load from local path
tokenizer = AutoTokenizer.from_pretrained('./my_tokenizer/')

# Common model tokenizers:
# 'bert-base-uncased'     → WordPiece, 30522 vocab
# 'gpt2'                  → BPE, 50257 vocab
# 'roberta-base'          → BPE with byte-level encoding
# 'google/t5-small'       → SentencePiece, 32100 vocab
"""
    print(code)

def ex03():
    """Encode text with tokenizer"""
    print("Ex03 — Encode text:")
    code = """
tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')
text = "Hello, how are you?"

# Basic encoding → returns dict with input_ids, attention_mask
encoding = tokenizer(text, return_tensors='pt')
# encoding['input_ids']      → tensor([[101, 7592, 1010, 2129, 2024, 2017, 1029, 102]])
# encoding['attention_mask'] → tensor([[1, 1, 1, 1, 1, 1, 1, 1]])

# Token IDs (no tensors)
ids = tokenizer.encode(text)  # [101, 7592, 1010, 2129, 2024, 2017, 1029, 102]
print("Token IDs:", ids)       # [CLS]=101, [SEP]=102
"""
    print(code)

def ex04():
    """Decode tokens back to text"""
    print("Ex04 — Decode tokens:")
    code = """
tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')
ids = [101, 7592, 2088, 102]

# Decode IDs back to string
text = tokenizer.decode(ids)
# → '[CLS] hello world [SEP]'

text_clean = tokenizer.decode(ids, skip_special_tokens=True)
# → 'hello world'

# Batch decode
batch_ids = [[101, 7592, 102], [101, 2088, 102]]
texts = tokenizer.batch_decode(batch_ids, skip_special_tokens=True)
# → ['hello', 'world']
"""
    print(code)

def ex05():
    """Attention mask explained"""
    print("Ex05 — Attention mask:")
    code = """
tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')
texts = ["Hello world", "Hi"]  # Different lengths

encoding = tokenizer(texts, padding=True, return_tensors='pt')
# input_ids:      [[101, 7592, 2088, 102], [101,  7632,  102,   0]]
# attention_mask: [[  1,    1,    1,   1], [  1,     1,    1,   0]]
#                                                               ↑ padded position → 0

# attention_mask = 1 → real token, attend to it
# attention_mask = 0 → padding token, do NOT attend
print(encoding['attention_mask'])
"""
    print(code)

def ex06():
    """Special tokens: [CLS], [SEP], [PAD]"""
    print("Ex06 — Special tokens:")
    code = """
tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')

# BERT special tokens:
# [CLS] (101) → start of sequence, used for classification
# [SEP] (102) → separator between sentences / end of sequence
# [PAD] (0)   → padding to equal length in batch
# [MASK](103) → masked token for MLM pretraining

print(tokenizer.cls_token,  tokenizer.cls_token_id)   # [CLS], 101
print(tokenizer.sep_token,  tokenizer.sep_token_id)   # [SEP], 102
print(tokenizer.pad_token,  tokenizer.pad_token_id)   # [PAD], 0
print(tokenizer.mask_token, tokenizer.mask_token_id)  # [MASK], 103

# For sentence pairs (NLI, QA):
# [CLS] sentence_A [SEP] sentence_B [SEP]
"""
    print(code)

def ex07():
    """Padding and truncation"""
    print("Ex07 — Padding and truncation:")
    code = """
tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')
texts = ["Short text", "This is a much longer piece of text with many words"]

# Pad to longest in batch
enc = tokenizer(texts, padding=True, truncation=True, max_length=16, return_tensors='pt')
print(enc['input_ids'].shape)   # torch.Size([2, 16])

# Padding strategies:
# padding=True           → pad to longest in batch
# padding='max_length'   → pad to max_length
# truncation=True        → truncate to max_length (default from right)
# truncation='only_first' → truncate only first sequence (for QA)
"""
    print(code)

def ex08():
    """Token IDs and vocabulary"""
    print("Ex08 — Token IDs and vocab:")
    code = """
tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')

# Vocab size
print("Vocab size:", tokenizer.vocab_size)  # 30522

# Word to ID
word_id = tokenizer.convert_tokens_to_ids('hello')  # 7592
print("'hello' ID:", word_id)

# ID to word
word = tokenizer.convert_ids_to_tokens(7592)  # 'hello'
print("ID 7592:", word)

# Full tokenization with subwords
tokens = tokenizer.tokenize("unbelievable")
# → ['un', '##believe', '##able']  (WordPiece splits unknown words)
"""
    print(code)

def ex09():
    """WordPiece subword tokens"""
    print("Ex09 — WordPiece subword tokenization:")
    code = """
tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')

examples = ["playing", "unbelievable", "ChatGPT", "tokenization"]
for word in examples:
    tokens = tokenizer.tokenize(word)
    print(f"'{word}' → {tokens}")

# Output:
# 'playing'        → ['playing']
# 'unbelievable'   → ['un', '##believe', '##able']
# 'ChatGPT'        → ['chat', '##gp', '##t']
# 'tokenization'   → ['token', '##ization']

# '##' prefix = continuation of previous token (not a word start)
"""
    print(code)

def ex10():
    """Batch encoding"""
    print("Ex10 — Batch encoding:")
    code = """
tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')
texts = ["Hello world", "NLP is great", "Transformers are powerful"]

# Batch encode — recommended over encoding one-by-one
batch = tokenizer(
    texts,
    padding=True,           # pad to longest
    truncation=True,
    max_length=32,
    return_tensors='pt'     # 'pt'=PyTorch, 'tf'=TensorFlow, 'np'=NumPy
)
print(batch['input_ids'].shape)      # torch.Size([3, N])
print(batch['attention_mask'].shape) # torch.Size([3, N])

# Access individual items
print(batch['input_ids'][0])   # tokens for "Hello world"
"""
    print(code)

def ex11():
    """What is a pre-trained model"""
    print("Ex11 — What is a pre-trained model:")
    print("  A neural network trained on massive text corpora with self-supervised objectives.")
    print()
    print("  Key pre-training objectives:")
    print("    MLM (Masked Language Modeling) — BERT: predict masked tokens")
    print("      Input:  'The [MASK] sat on the mat'")
    print("      Target: 'The  cat  sat on the mat'")
    print()
    print("    CLM (Causal Language Modeling) — GPT: predict next token")
    print("      Input:  'The cat sat'")
    print("      Target: 'cat sat on'  (shifted by 1)")
    print()
    print("    Benefits: rich contextual representations reusable via fine-tuning")

def ex12():
    """Pipeline API concept"""
    print("Ex12 — Pipeline API concept:")
    code = """
from transformers import pipeline

# pipeline() = simplest way to run inference
# Automatically: downloads model, tokenizes, runs forward, post-processes

# General pattern:
pipe = pipeline(task, model=model_name, device=device_id)
result = pipe(input_text)

# Available tasks:
# 'text-classification'    → sentiment, topic
# 'token-classification'   → NER, POS tagging
# 'question-answering'     → extractive QA
# 'text-generation'        → GPT-style generation
# 'fill-mask'              → BERT-style MLM
# 'summarization'          → abstractive summary
# 'translation_en_to_fr'   → translation
# 'zero-shot-classification' → classify without training
"""
    print(code)

def ex13():
    """Sentiment analysis pipeline concept"""
    print("Ex13 — Sentiment analysis pipeline:")
    code = """
from transformers import pipeline

# Load sentiment pipeline (uses distilbert-base-uncased-finetuned-sst-2-english by default)
sentiment = pipeline('text-classification', model='distilbert-base-uncased-finetuned-sst-2-english')

texts = ["I love this movie!", "This film was terrible.", "It was okay."]
results = sentiment(texts)

# Returns:
# [{'label': 'POSITIVE', 'score': 0.9998},
#  {'label': 'NEGATIVE', 'score': 0.9997},
#  {'label': 'POSITIVE', 'score': 0.5423}]

for text, result in zip(texts, results):
    print(f"{result['label']} ({result['score']:.4f}): {text}")
"""
    print(code)

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Load model for sequence classification"""
    print("Ex14 — Load model for classification:")
    code = """
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

model_name = 'distilbert-base-uncased-finetuned-sst-2-english'
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)

text = "This is an amazing product!"
inputs = tokenizer(text, return_tensors='pt')

with torch.no_grad():
    outputs = model(**inputs)
    logits = outputs.logits          # raw scores per class
    probs = torch.softmax(logits, dim=1)
    pred = probs.argmax(dim=1).item()

print("Logits:", logits)
print("Probs:", probs)
print("Predicted class:", model.config.id2label[pred])  # 'POSITIVE'
"""
    print(code)

def ex15():
    """Feature extraction (embeddings)"""
    print("Ex15 — Feature extraction / embeddings:")
    code = """
from transformers import AutoTokenizer, AutoModel
import torch

tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')
model = AutoModel.from_pretrained('bert-base-uncased')

texts = ["Machine learning is great", "Deep learning uses neural networks"]
inputs = tokenizer(texts, padding=True, truncation=True, return_tensors='pt')

with torch.no_grad():
    outputs = model(**inputs)

# outputs.last_hidden_state: (batch, seq_len, hidden_size=768)
# Mean pooling for sentence embedding:
mask = inputs['attention_mask'].unsqueeze(-1).float()
embeddings = (outputs.last_hidden_state * mask).sum(1) / mask.sum(1)
print("Sentence embedding shape:", embeddings.shape)  # (2, 768)

# Use CLS token embedding instead:
cls_emb = outputs.last_hidden_state[:, 0, :]  # (2, 768)
"""
    print(code)

def ex16():
    """Text generation pipeline"""
    print("Ex16 — Text generation pipeline:")
    code = """
from transformers import pipeline

generator = pipeline('text-generation', model='gpt2')

result = generator(
    "The future of artificial intelligence is",
    max_new_tokens=50,
    num_return_sequences=2,
    temperature=0.8,      # higher = more random
    top_p=0.9,            # nucleus sampling
    do_sample=True
)

# Returns list of dicts:
for seq in result:
    print(seq['generated_text'])
    print("---")

# Key generation parameters:
# max_new_tokens   → how many new tokens to generate
# temperature      → softmax temperature (1.0 = neutral)
# top_p            → nucleus sampling threshold
# top_k            → only sample from top-k tokens
# repetition_penalty → penalize repeated tokens
"""
    print(code)

def ex17():
    """Question answering pipeline"""
    print("Ex17 — Question answering pipeline:")
    code = """
from transformers import pipeline

qa = pipeline('question-answering', model='deepset/roberta-base-squad2')

context = '''
HuggingFace was founded in 2016 by Clement Delangue and Julien Chaumond.
The company is headquartered in New York City and Paris.
It develops open-source NLP tools and hosts the Model Hub.
'''

result = qa(question="Where is HuggingFace headquartered?", context=context)
# Returns: {'score': 0.95, 'start': 95, 'end': 121,
#           'answer': 'New York City and Paris'}

print(f"Answer: {result['answer']} (confidence: {result['score']:.4f})")
"""
    print(code)

def ex18():
    """NER pipeline"""
    print("Ex18 — Named Entity Recognition pipeline:")
    code = """
from transformers import pipeline

ner = pipeline('token-classification', model='dbmdz/bert-large-cased-finetuned-conll03-english',
               aggregation_strategy='simple')

text = "Apple was founded by Steve Jobs in Cupertino, California in 1976."
entities = ner(text)

# Returns list of entities:
for ent in entities:
    print(f"{ent['entity_group']:5s} | {ent['word']:20s} | score: {ent['score']:.4f}")

# Output:
# ORG   | Apple                | score: 0.9991
# PER   | Steve Jobs           | score: 0.9987
# LOC   | Cupertino, California | score: 0.9954
"""
    print(code)

def ex19():
    """Zero-shot classification"""
    print("Ex19 — Zero-shot classification:")
    code = """
from transformers import pipeline

classifier = pipeline('zero-shot-classification',
                      model='facebook/bart-large-mnli')

text = "The latest iPhone features a 48MP camera and USB-C connector."
labels = ["technology", "sports", "politics", "entertainment", "science"]

result = classifier(text, candidate_labels=labels)
# Returns: {'labels': ['technology', 'science', ...],
#           'scores': [0.92, 0.05, ...]}

for label, score in zip(result['labels'], result['scores']):
    print(f"  {label:15s}: {score:.4f}")

# Zero-shot works via NLI: "This text is about {label}"
# No fine-tuning needed — works on any label set!
"""
    print(code)

def ex20():
    """Summarization pipeline"""
    print("Ex20 — Summarization pipeline:")
    code = """
from transformers import pipeline

summarizer = pipeline('summarization', model='facebook/bart-large-cnn')

article = '''
    Scientists have discovered a new species of deep-sea fish in the Pacific Ocean.
    The fish, found at depths of over 8,000 meters, can withstand extreme pressure.
    It has unique bioluminescent properties never seen before in marine biology.
    The discovery was made by a joint team from MIT and Woods Hole Oceanographic Institution.
'''

summary = summarizer(article, max_length=60, min_length=20, do_sample=False)
print("Summary:", summary[0]['summary_text'])

# Key params:
# max_length    → max tokens in summary
# min_length    → min tokens in summary
# num_beams     → beam search width (higher = better quality, slower)
# length_penalty → <1 shorter summaries, >1 longer
"""
    print(code)

def ex21():
    """Translation pipeline"""
    print("Ex21 — Translation pipeline:")
    code = """
from transformers import pipeline

# Helsinki-NLP models for translation (no API key needed)
translator = pipeline('translation_en_to_fr', model='Helsinki-NLP/opus-mt-en-fr')

texts = [
    "Hello, how are you today?",
    "Machine learning transforms industries.",
    "The weather is beautiful."
]

results = translator(texts)
for src, res in zip(texts, results):
    print(f"EN: {src}")
    print(f"FR: {res['translation_text']}")
    print()

# 200+ language pairs available:
# opus-mt-en-de (English→German)
# opus-mt-fr-en (French→English)
# opus-mt-zh-en (Chinese→English)
"""
    print(code)

def ex22():
    """Fill-mask pipeline"""
    print("Ex22 — Fill-mask (MLM) pipeline:")
    code = """
from transformers import pipeline

fill = pipeline('fill-mask', model='bert-base-uncased')

results = fill("The capital of France is [MASK].")
# Returns top-5 predictions:
for r in results:
    print(f"  '{r['token_str']}' (score: {r['score']:.4f}): {r['sequence']}")

# Output:
#   'paris'  (score: 0.9978): the capital of france is paris.
#   'lyon'   (score: 0.0003): ...
#   'nice'   (score: 0.0002): ...

# Also works with:
fill("The [MASK] sat on the mat.")
fill("Scientists have [MASK] a new planet.")
"""
    print(code)

def ex23():
    """Image-text pipeline concept"""
    print("Ex23 — Image-text pipeline (vision-language):")
    code = """
from transformers import pipeline

# Image captioning
captioner = pipeline('image-to-text', model='Salesforce/blip-image-captioning-base')
caption = captioner('path/to/image.jpg')
print(caption[0]['generated_text'])  # 'a dog playing in a park'

# Visual question answering
vqa = pipeline('visual-question-answering', model='dandelin/vilt-b32-finetuned-vqa')
result = vqa(image='path/to/image.jpg', question="What color is the sky?")
print(result)  # [{'score': 0.97, 'answer': 'blue'}]

# Zero-shot image classification
img_clf = pipeline('zero-shot-image-classification', model='openai/clip-vit-base-patch32')
result = img_clf('image.jpg', candidate_labels=['cat', 'dog', 'car'])
"""
    print(code)

def ex24():
    """Model hub search"""
    print("Ex24 — HuggingFace Model Hub:")
    code = """
# Search at huggingface.co/models or via CLI:
# pip install huggingface_hub

from huggingface_hub import list_models

# List models for a task
models = list(list_models(filter='text-classification', sort='downloads', direction=-1, limit=5))
for m in models:
    print(m.id, m.downloads)

# Direct API search:
# huggingface.co/models?pipeline_tag=text-classification&sort=downloads

# Key model families:
# BERT family: bert, roberta, distilbert, albert, deberta
# GPT family:  gpt2, gpt-j, gpt-neo, opt, llama, mistral
# T5 family:   t5, flan-t5, mt5 (encoder-decoder)
# Specialized: whisper (speech), clip (vision-language)
"""
    print(code)

def ex25():
    """Model card metadata"""
    print("Ex25 — Model card metadata:")
    code = """
from huggingface_hub import ModelCard

card = ModelCard.load('distilbert-base-uncased-finetuned-sst-2-english')
print(card.data)  # YAML metadata

# Model card contains:
# - language: ['en']
# - license: apache-2.0
# - datasets: ['sst2', 'glue']
# - metrics: [{'type': 'accuracy', 'value': 0.9127}]
# - pipeline_tag: text-classification
# - tags: ['text-classification', 'pytorch', 'distilbert']

# Access config directly:
from transformers import AutoConfig
config = AutoConfig.from_pretrained('bert-base-uncased')
print(config.hidden_size)        # 768
print(config.num_hidden_layers)  # 12
print(config.num_attention_heads) # 12
"""
    print(code)

def ex26():
    """Tokenizer fast vs slow"""
    print("Ex26 — Fast vs slow tokenizers:")
    code = """
from transformers import AutoTokenizer, BertTokenizer, BertTokenizerFast

# Slow tokenizer (Python, educational)
slow = BertTokenizer.from_pretrained('bert-base-uncased')

# Fast tokenizer (Rust-backed via HuggingFace tokenizers library)
fast = BertTokenizerFast.from_pretrained('bert-base-uncased')
# AutoTokenizer loads fast by default when available

# Fast tokenizers provide extra features:
encoding = fast("Hello world, how are you?", return_offsets_mapping=True)
print(encoding.offset_mapping)   # [(0,5), (5,6), (6,11), ...]
# offset_mapping → char positions in original string for each token

# Also available:
print(encoding.word_ids())  # which word each token belongs to
# [None, 0, 1, 1, 2, 3, 4, None]  (None = special tokens)

# Speed: Fast is ~10-100x faster for large batches
"""
    print(code)

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """Custom inference function"""
    print("Ex27 — Custom inference function pattern:")
    code = """
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

def classify_text(texts, model_name='distilbert-base-uncased-finetuned-sst-2-english',
                  batch_size=16, device='cpu'):
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(model_name).to(device)
    model.eval()

    all_preds, all_probs = [], []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        inputs = tokenizer(batch, padding=True, truncation=True,
                           max_length=512, return_tensors='pt').to(device)
        with torch.no_grad():
            outputs = model(**inputs)
            probs = torch.softmax(outputs.logits, dim=1)
            preds = probs.argmax(dim=1)
        all_preds.extend(preds.cpu().numpy())
        all_probs.extend(probs.cpu().numpy())

    label_map = model.config.id2label
    return [{'label': label_map[p], 'score': float(pr.max())}
            for p, pr in zip(all_preds, all_probs)]

# Usage:
# results = classify_text(["Great product!", "Terrible service"], batch_size=8)
# → [{'label': 'POSITIVE', 'score': 0.999}, {'label': 'NEGATIVE', 'score': 0.997}]
"""
    print(code)

def ex28():
    """Batch inference"""
    print("Ex28 — Efficient batch inference:")
    code = """
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
from torch.utils.data import DataLoader, Dataset

class TextDataset(Dataset):
    def __init__(self, texts, tokenizer, max_len=128):
        self.encodings = tokenizer(texts, padding=True, truncation=True,
                                   max_length=max_len, return_tensors='pt')
    def __len__(self): return self.encodings['input_ids'].shape[0]
    def __getitem__(self, idx):
        return {k: v[idx] for k, v in self.encodings.items()}

tokenizer = AutoTokenizer.from_pretrained('distilbert-base-uncased-finetuned-sst-2-english')
model = AutoModelForSequenceClassification.from_pretrained('...')
model.eval()

texts = [f"Sample text number {i}" for i in range(1000)]
dataset = TextDataset(texts, tokenizer)
loader = DataLoader(dataset, batch_size=32)

all_logits = []
with torch.no_grad():
    for batch in loader:
        outputs = model(**{k: v.to('cpu') for k, v in batch.items()})
        all_logits.append(outputs.logits)

logits = torch.cat(all_logits, dim=0)
print("Batch inference complete:", logits.shape)  # (1000, 2)
"""
    print(code)

def ex29():
    """Fine-tuning loop concept"""
    print("Ex29 — Fine-tuning loop (manual):")
    code = """
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch, torch.optim as optim

model_name = 'bert-base-uncased'
num_labels = 2
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=num_labels)

optimizer = optim.AdamW(model.parameters(), lr=2e-5, weight_decay=0.01)

# Fine-tuning loop:
model.train()
for epoch in range(3):
    for batch in train_dataloader:
        input_ids = batch['input_ids'].to(device)
        attention_mask = batch['attention_mask'].to(device)
        labels = batch['labels'].to(device)

        outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
        loss = outputs.loss           # CrossEntropy computed internally

        optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()

    print(f"Epoch {epoch+1} loss: {loss.item():.4f}")
"""
    print(code)

def ex30():
    """Trainer API concept"""
    print("Ex30 — HuggingFace Trainer API:")
    code = """
from transformers import Trainer, TrainingArguments, AutoModelForSequenceClassification

model = AutoModelForSequenceClassification.from_pretrained('bert-base-uncased', num_labels=2)

training_args = TrainingArguments(
    output_dir='./results',
    num_train_epochs=3,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=64,
    warmup_steps=500,
    weight_decay=0.01,
    logging_dir='./logs',
    logging_steps=10,
    evaluation_strategy='epoch',
    save_strategy='epoch',
    load_best_model_at_end=True,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,   # tokenized HF Dataset
    eval_dataset=eval_dataset,
    compute_metrics=compute_metrics,
)

trainer.train()   # handles: batching, gradient accumulation, LR scheduling, eval
trainer.evaluate()
trainer.save_model('./my_model')
"""
    print(code)

def ex31():
    """TrainingArguments explained"""
    print("Ex31 — Key TrainingArguments:")
    code = """
from transformers import TrainingArguments

args = TrainingArguments(
    output_dir='./output',

    # Training schedule
    num_train_epochs=3,
    max_steps=-1,                    # -1 = use num_train_epochs
    per_device_train_batch_size=16,
    gradient_accumulation_steps=4,   # effective batch = 16 * 4 = 64

    # Optimizer
    learning_rate=2e-5,
    weight_decay=0.01,
    adam_beta1=0.9, adam_beta2=0.999,
    lr_scheduler_type='linear',
    warmup_ratio=0.1,               # 10% of steps for warmup

    # Evaluation & saving
    evaluation_strategy='steps',
    eval_steps=500,
    save_steps=500,
    load_best_model_at_end=True,
    metric_for_best_model='f1',

    # Efficiency
    fp16=True,                       # mixed precision
    dataloader_num_workers=4,
    group_by_length=True,            # batch similar lengths together
)
"""
    print(code)

def ex32():
    """compute_metrics function"""
    print("Ex32 — compute_metrics for Trainer:")
    code = """
import numpy as np
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score

def compute_metrics(eval_pred):
    # eval_pred is an EvalPrediction object
    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=-1)

    return {
        'accuracy':  accuracy_score(labels, predictions),
        'f1':        f1_score(labels, predictions, average='weighted'),
        'precision': precision_score(labels, predictions, average='weighted', zero_division=0),
        'recall':    recall_score(labels, predictions, average='weighted', zero_division=0),
    }

# For multi-label classification:
def compute_metrics_multilabel(eval_pred):
    logits, labels = eval_pred
    probs = 1 / (1 + np.exp(-logits))   # sigmoid
    preds = (probs > 0.5).astype(int)
    return {'f1': f1_score(labels, preds, average='micro')}

# Pass to Trainer:
# trainer = Trainer(..., compute_metrics=compute_metrics)
"""
    print(code)

def ex33():
    """Data collator"""
    print("Ex33 — Data collators:")
    code = """
from transformers import DataCollatorWithPadding, DataCollatorForLanguageModeling

# Dynamic padding (pad to longest in batch, not globally)
tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')
collator = DataCollatorWithPadding(tokenizer=tokenizer)

# Usage with Trainer:
# trainer = Trainer(..., data_collator=collator)

# For masked language modeling (MLM pre-training):
mlm_collator = DataCollatorForLanguageModeling(
    tokenizer=tokenizer,
    mlm=True,
    mlm_probability=0.15,   # mask 15% of tokens
)

# For causal language modeling (GPT-style):
clm_collator = DataCollatorForLanguageModeling(
    tokenizer=tokenizer,
    mlm=False   # no masking, just shift labels
)

# DataCollatorWithPadding is recommended over fixed padding:
# → reduces compute by ~20-30% on variable-length text
"""
    print(code)

def ex34():
    """Tokenize dataset with map"""
    print("Ex34 — Tokenize HF Dataset with .map():")
    code = """
from datasets import load_dataset
from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')

# Load dataset
dataset = load_dataset('glue', 'sst2')

def tokenize_function(examples):
    return tokenizer(
        examples['sentence'],
        padding=False,          # dynamic padding via DataCollator
        truncation=True,
        max_length=128
    )

# Apply tokenization to all splits at once (parallelized)
tokenized = dataset.map(
    tokenize_function,
    batched=True,               # process in batches (fast)
    num_proc=4,                 # parallel workers
    remove_columns=['sentence', 'idx']  # keep only needed columns
)

tokenized.set_format(type='torch', columns=['input_ids', 'attention_mask', 'label'])
print(tokenized['train'][0])
"""
    print(code)

def ex35():
    """Custom model head concept"""
    print("Ex35 — Custom model head:")
    code = """
import torch.nn as nn
from transformers import AutoModel

class CustomClassifier(nn.Module):
    def __init__(self, model_name, num_classes, dropout=0.3):
        super().__init__()
        self.encoder = AutoModel.from_pretrained(model_name)
        hidden_size = self.encoder.config.hidden_size  # 768 for BERT-base
        self.dropout = nn.Dropout(dropout)
        self.classifier = nn.Sequential(
            nn.Linear(hidden_size, 256),
            nn.GELU(),
            nn.Dropout(0.1),
            nn.Linear(256, num_classes)
        )

    def forward(self, input_ids, attention_mask):
        outputs = self.encoder(input_ids=input_ids, attention_mask=attention_mask)
        cls_output = outputs.last_hidden_state[:, 0, :]  # [CLS] token
        return self.classifier(self.dropout(cls_output))

model = CustomClassifier('bert-base-uncased', num_classes=5)
print("Custom head params:", sum(p.numel() for p in model.classifier.parameters()))
"""
    print(code)

def ex36():
    """Save and load fine-tuned model"""
    print("Ex36 — Save/load fine-tuned model:")
    code = """
# Save after fine-tuning:
model.save_pretrained('./my_finetuned_model/')
tokenizer.save_pretrained('./my_finetuned_model/')

# Files created:
# my_finetuned_model/
#   config.json           → model architecture config
#   pytorch_model.bin     → weights (or model.safetensors)
#   tokenizer_config.json
#   vocab.txt

# Load back:
from transformers import AutoTokenizer, AutoModelForSequenceClassification
tokenizer = AutoTokenizer.from_pretrained('./my_finetuned_model/')
model = AutoModelForSequenceClassification.from_pretrained('./my_finetuned_model/')

# Or via Trainer:
trainer.save_model('./checkpoint')
model = AutoModelForSequenceClassification.from_pretrained('./checkpoint')
"""
    print(code)

def ex37():
    """Push to hub concept"""
    print("Ex37 — Push model to HuggingFace Hub:")
    code = """
from huggingface_hub import HfApi, login

# Login (run once):
login(token='hf_YOUR_TOKEN_HERE')

# Option 1: via Trainer
training_args = TrainingArguments(
    output_dir='username/my-model-name',  # hub repo name
    push_to_hub=True,
    hub_strategy='every_save',
)
# trainer.push_to_hub()  # at end of training

# Option 2: save_pretrained + push_to_hub
model.push_to_hub('username/my-bert-sentiment')
tokenizer.push_to_hub('username/my-bert-sentiment')

# Option 3: huggingface_hub API
api = HfApi()
api.upload_folder(
    folder_path='./my_model/',
    repo_id='username/my-model',
    repo_type='model'
)
"""
    print(code)

def ex38():
    """Evaluate library concept"""
    print("Ex38 — HuggingFace Evaluate library:")
    code = """
import evaluate

# Load metrics from HuggingFace
accuracy = evaluate.load('accuracy')
f1 = evaluate.load('f1')
bleu = evaluate.load('bleu')
rouge = evaluate.load('rouge')

# For classification:
predictions = [1, 0, 1, 1, 0]
references  = [1, 1, 1, 0, 0]
result = accuracy.compute(predictions=predictions, references=references)
print(result)  # {'accuracy': 0.6}

f1_result = f1.compute(predictions=predictions, references=references, average='macro')
print(f1_result)  # {'f1': 0.5833}

# For text generation:
predictions = [["the cat sat on the mat"]]
references  = [[["the cat sat on the mat", "the cat is on the mat"]]]
print(bleu.compute(predictions=predictions, references=references))

# Available: accuracy, f1, precision, recall, bleu, rouge, bertscore, perplexity, ...
"""
    print(code)

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """LoRA fine-tuning concept"""
    print("Ex39 — LoRA (Low-Rank Adaptation) fine-tuning:")
    code = """
# LoRA: Instead of fine-tuning all parameters W (frozen),
# add low-rank adapters: W' = W + BA  where B ∈ R^(d×r), A ∈ R^(r×k), r << d

from peft import LoraConfig, get_peft_model, TaskType

config = LoraConfig(
    task_type=TaskType.SEQ_CLS,
    r=16,              # rank of decomposition (4, 8, 16, 32 common)
    lora_alpha=32,     # scaling factor (alpha/r = scaling)
    target_modules=['query', 'value'],  # which layers to adapt
    lora_dropout=0.1,
    bias='none'
)

model = AutoModelForSequenceClassification.from_pretrained('bert-base-uncased', num_labels=2)
peft_model = get_peft_model(model, config)
peft_model.print_trainable_parameters()
# trainable params: 294,912 || all params: 109,778,946 || trainable: 0.27%

# Merge adapters back for inference:
merged = peft_model.merge_and_unload()
"""
    print(code)

def ex40():
    """QLoRA concept"""
    print("Ex40 — QLoRA (Quantized LoRA):")
    code = """
# QLoRA = LoRA + 4-bit quantized base model
# Allows fine-tuning 7B+ models on a single GPU (e.g., 24GB VRAM)

from transformers import AutoModelForCausalLM, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model

# 4-bit quantization config
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_use_double_quant=True,   # nested quantization
    bnb_4bit_quant_type='nf4',        # NormalFloat4 (better than int4)
    bnb_4bit_compute_dtype='bfloat16' # computation dtype
)

# Load 7B model in 4-bit (~3.5GB instead of ~28GB)
model = AutoModelForCausalLM.from_pretrained(
    'meta-llama/Llama-2-7b-hf',
    quantization_config=bnb_config,
    device_map='auto'
)

# Apply LoRA adapters (train only ~0.1% of params)
lora_config = LoraConfig(r=64, lora_alpha=16, target_modules=['q_proj','v_proj'])
peft_model = get_peft_model(model, lora_config)
# peft_model.print_trainable_parameters()
# trainable params: ~4M || all params: ~7B || trainable: ~0.06%
"""
    print(code)

def ex41():
    """PEFT library overview"""
    print("Ex41 — PEFT (Parameter-Efficient Fine-Tuning) library:")
    code = """
# PEFT methods comparison:
# ─────────────────────────────────────────────────────────────
# Method    | Trainable % | Notes
# ─────────────────────────────────────────────────────────────
# Full FT   | 100%        | Best quality, most memory
# LoRA      | 0.1–1%      | Low-rank weight updates
# QLoRA     | 0.1%        | LoRA + 4-bit quantization
# Prefix    | <0.1%       | Prepend trainable prefix tokens
# Prompt    | <0.01%      | Soft prompt tuning
# Adapter   | 1–5%        | Bottleneck adapter layers
# ─────────────────────────────────────────────────────────────

from peft import (
    LoraConfig, PromptTuningConfig, PrefixTuningConfig,
    get_peft_model, TaskType, PeftModel
)

# Load previously trained PEFT model:
base_model = AutoModelForCausalLM.from_pretrained('gpt2')
peft_model = PeftModel.from_pretrained(base_model, './peft_checkpoint/')
# Only adapter weights are loaded (~MBs vs GBs for full model)
"""
    print(code)

def ex42():
    """Model quantization (4-bit/8-bit)"""
    print("Ex42 — Model quantization (4-bit / 8-bit):")
    code = """
from transformers import AutoModelForCausalLM, BitsAndBytesConfig

# 8-bit quantization (LLM.int8())
model_8bit = AutoModelForCausalLM.from_pretrained(
    'gpt2',
    load_in_8bit=True,      # uses bitsandbytes
    device_map='auto'
)
# Reduces memory ~2x; minimal quality loss

# 4-bit quantization (NF4 / FP4)
bnb_4bit = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type='nf4',        # nf4 > fp4 for LLMs
    bnb_4bit_use_double_quant=True,   # additional 0.4 bpw savings
    bnb_4bit_compute_dtype='bfloat16'
)
model_4bit = AutoModelForCausalLM.from_pretrained('gpt2', quantization_config=bnb_4bit)
# Reduces memory ~4x vs float32; slight quality loss

# Memory comparison for 7B model:
# float32:  28 GB
# float16:  14 GB
# int8:      7 GB
# nf4:       3.5 GB
"""
    print(code)

def ex43():
    """Flash Attention concept"""
    print("Ex43 — Flash Attention:")
    code = """
# Standard attention: O(N²) memory (stores full N×N attention matrix)
# Flash Attention: O(N) memory via tiled computation

from transformers import AutoModelForCausalLM

# Enable Flash Attention 2 (requires flash-attn package + Ampere GPU)
model = AutoModelForCausalLM.from_pretrained(
    'meta-llama/Llama-2-7b-hf',
    attn_implementation='flash_attention_2',  # or 'eager' (default)
    torch_dtype='bfloat16',
    device_map='auto'
)

# Flash Attention benefits:
# - 2-4x faster than standard attention
# - O(N) vs O(N²) memory → enables much longer contexts
# - Numerically identical to standard attention

# Also available: SDPA (Scaled Dot Product Attention) - built into PyTorch 2.0
model = AutoModelForCausalLM.from_pretrained(
    'gpt2', attn_implementation='sdpa'
)
"""
    print(code)

def ex44():
    """Model parallelism concept"""
    print("Ex44 — Model parallelism:")
    code = """
# Problem: 70B parameter model = 140GB float16 → won't fit on single GPU

# Strategy 1: Tensor Parallelism (split layers across GPUs)
# Each GPU holds part of each weight matrix
# Requires synchronization at each layer

# Strategy 2: Pipeline Parallelism (split layers sequentially)
# GPU0: layers 0-15 | GPU1: layers 16-31 | ...

# Strategy 3: device_map='auto' (naive model parallelism)
from transformers import AutoModelForCausalLM
model = AutoModelForCausalLM.from_pretrained(
    'meta-llama/Llama-2-70b-hf',
    device_map='auto',       # automatically maps layers to available GPUs/CPU
    torch_dtype='bfloat16'
)
print(model.hf_device_map)  # shows which layer is on which device

# For production: use vLLM, TensorRT-LLM, or DeepSpeed Inference
"""
    print(code)

def ex45():
    """Pipeline parallelism"""
    print("Ex45 — Pipeline parallelism with Accelerate:")
    code = """
from accelerate import Accelerator, dispatch_model, infer_auto_device_map
from transformers import AutoModelForCausalLM

# Step 1: Infer device map based on available memory
model = AutoModelForCausalLM.from_pretrained('meta-llama/Llama-2-70b-hf', low_cpu_mem_usage=True)
max_memory = {0: '20GiB', 1: '20GiB', 2: '20GiB', 3: '20GiB', 'cpu': '60GiB'}
device_map = infer_auto_device_map(model, max_memory=max_memory)

# Step 2: Dispatch model across devices
model = dispatch_model(model, device_map=device_map)

# Step 3: Run inference (tensors route automatically)
inputs = tokenizer("Hello world", return_tensors='pt').to('cuda:0')
with torch.no_grad():
    outputs = model.generate(**inputs, max_new_tokens=50)
print(tokenizer.decode(outputs[0]))
"""
    print(code)

def ex46():
    """Gradient checkpointing"""
    print("Ex46 — Gradient checkpointing:")
    code = """
# Problem: training large models requires storing all activations for backprop
# Standard: O(N) memory for N layers
# Gradient checkpointing: recompute activations on backward pass → O(sqrt(N)) memory
# Tradeoff: ~30% slower training, ~60% less memory

from transformers import AutoModelForSequenceClassification

model = AutoModelForSequenceClassification.from_pretrained('bert-large-uncased')

# Enable gradient checkpointing
model.gradient_checkpointing_enable()
# model.gradient_checkpointing_disable()  # turn off

# In TrainingArguments:
from transformers import TrainingArguments
args = TrainingArguments(
    output_dir='./output',
    gradient_checkpointing=True,    # enables automatically
    per_device_train_batch_size=8,  # can now use larger batches
)

# Also for custom PyTorch models:
from torch.utils.checkpoint import checkpoint
output = checkpoint(my_layer, inputs)  # recomputes on backward
"""
    print(code)

def ex47():
    """DeepSpeed integration concept"""
    print("Ex47 — DeepSpeed integration:")
    code = """
# DeepSpeed ZeRO stages:
# ZeRO-1: Partition optimizer states across GPUs
# ZeRO-2: + Partition gradients
# ZeRO-3: + Partition model parameters (full model parallelism)

# deepspeed_config.json:
ds_config = {
    "zero_optimization": {
        "stage": 2,
        "offload_optimizer": {"device": "cpu"},
        "allgather_partitions": True,
        "reduce_scatter": True,
    },
    "fp16": {"enabled": True},
    "train_batch_size": 32,
    "train_micro_batch_size_per_gpu": 4,
    "gradient_accumulation_steps": 8
}

# In TrainingArguments:
from transformers import TrainingArguments
args = TrainingArguments(
    output_dir='./ds_output',
    deepspeed='./deepspeed_config.json',
    per_device_train_batch_size=4,
    fp16=True
)
# Run: deepspeed --num_gpus=8 train.py
"""
    print(code)

def ex48():
    """RLHF with TRL concept"""
    print("Ex48 — RLHF (Reinforcement Learning from Human Feedback) with TRL:")
    code = """
from trl import PPOTrainer, PPOConfig, AutoModelForCausalLMWithValueHead

# Step 1: Supervised Fine-Tuning (SFT) on demonstrations
from trl import SFTTrainer
sft_trainer = SFTTrainer(
    model=base_model,
    train_dataset=sft_dataset,
    dataset_text_field='text',
    max_seq_length=512,
)
sft_trainer.train()

# Step 2: Train reward model on preference data
from trl import RewardTrainer, RewardConfig
reward_trainer = RewardTrainer(model=reward_model, args=RewardConfig(...), train_dataset=pref_dataset)
reward_trainer.train()

# Step 3: PPO fine-tuning with reward signal
ppo_config = PPOConfig(learning_rate=1.41e-5, batch_size=16)
ppo_trainer = PPOTrainer(config=ppo_config, model=sft_model, ref_model=ref_model, tokenizer=tokenizer)

for batch in ppo_dataloader:
    query_tensors = [tokenizer.encode(q) for q in batch['query']]
    response_tensors = ppo_trainer.generate(query_tensors, max_new_tokens=64)
    rewards = [reward_model_score(q, r) for q, r in zip(batch['query'], responses)]
    stats = ppo_trainer.step(query_tensors, response_tensors, rewards)
"""
    print(code)

def ex49():
    """DPO training concept"""
    print("Ex49 — DPO (Direct Preference Optimization):")
    code = """
# DPO eliminates the need for a separate reward model
# Directly optimizes policy from preference data (chosen vs rejected)
# DPO loss: -log σ(β * log(π_θ(y_w|x)/π_ref(y_w|x)) - β * log(π_θ(y_l|x)/π_ref(y_l|x)))

from trl import DPOTrainer, DPOConfig
from datasets import Dataset

# Preference dataset format:
pref_data = Dataset.from_dict({
    'prompt':   ['Tell me about AI', 'What is ML?'],
    'chosen':   ['AI is a field of CS...', 'ML is a subset of AI...'],
    'rejected': ['AI will destroy us', 'ML is magic'],
})

dpo_config = DPOConfig(
    beta=0.1,              # KL divergence penalty
    learning_rate=1e-6,
    num_train_epochs=1,
    per_device_train_batch_size=2,
    remove_unused_columns=False,
)

dpo_trainer = DPOTrainer(
    model=sft_model,           # fine-tuned reference model
    ref_model=ref_model,       # frozen reference policy
    args=dpo_config,
    train_dataset=pref_data,
    tokenizer=tokenizer,
)
dpo_trainer.train()
# DPO is simpler than RLHF/PPO: no reward model, no rollouts needed
"""
    print(code)

def ex50():
    """Production HF deployment"""
    print("Ex50 — Production HuggingFace deployment options:")
    code = """
# Option 1: HuggingFace Inference Endpoints (managed)
# → Deploy any HF model via UI/API, pay per request
# → Auto-scaling, GPU selection, private endpoints

# Option 2: Text Generation Inference (TGI) — open source
# docker run ghcr.io/huggingface/text-generation-inference \\
#   --model-id meta-llama/Llama-2-7b-chat-hf --num-shard 1

import requests
response = requests.post('http://localhost:8080/generate',
    json={'inputs': 'Hello!', 'parameters': {'max_new_tokens': 50}})
print(response.json()['generated_text'])

# Option 3: vLLM (high throughput serving)
from vllm import LLM, SamplingParams
llm = LLM(model='meta-llama/Llama-2-7b-chat-hf')
params = SamplingParams(temperature=0.7, max_tokens=256)
outputs = llm.generate(['Tell me a joke'], params)

# Option 4: FastAPI + Transformers pipeline
from fastapi import FastAPI
from transformers import pipeline as hf_pipeline

app = FastAPI()
pipe = hf_pipeline('text-classification', model='distilbert-base-uncased-finetuned-sst-2-english')

@app.post('/predict')
def predict(text: str):
    return pipe(text)[0]
# uvicorn app:app --host 0.0.0.0 --port 8000
"""
    print(code)


def main():
    print("=" * 60)
    print("Examples 2.4 — HuggingFace Transformers")
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
