# ============================================================
# Examples 3.1 — LLM Basics (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import json
import time
import math
from collections import defaultdict

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """What is a language model"""
    description = """A Language Model (LM) predicts the probability of a sequence of tokens.
  A Large Language Model (LLM) is trained on vast text corpora with billions of parameters.
  Given text: "The cat sat on the" → predicts: "mat" (high prob), "floor" (med), "sky" (low)
  LLMs: GPT-4, Claude, Gemini, LLaMA — all autoregressive transformers."""
    print("Ex01 — LLM Basics:", description)

def ex02():
    """Tokenization concept"""
    text = "Hello, world! How are you?"
    # GPT-style BPE tokenization (simulated)
    tokens_approx = text.split()  # simplified — real BPE is subword
    bpe_example = ["Hello", ",", " world", "!", " How", " are", " you", "?"]
    print("Ex02 — Tokenization:")
    print(f"  Text:           '{text}'")
    print(f"  Word-split:     {tokens_approx}  ({len(tokens_approx)} tokens)")
    print(f"  BPE (approx):   {bpe_example}  ({len(bpe_example)} tokens)")
    print(f"  Rule: ~1 token ≈ 0.75 words ≈ 4 characters (English)")

def ex03():
    """Vocabulary size concept"""
    vocab_sizes = {
        "GPT-2":       50_257,
        "GPT-3/4":     100_277,
        "LLaMA-2":      32_000,
        "Claude":       ~100_000,
        "T5":           32_128,
    }
    print("Ex03 — Vocabulary Sizes:")
    for model, size in vocab_sizes.items():
        print(f"  {model:<12}: {size:>10,} tokens in vocabulary")
    print("  Larger vocab → fewer tokens per sentence, but larger embedding table")

def ex04():
    """Token probability"""
    np.random.seed(42)
    vocab = ["the", "cat", "sat", "mat", "floor", "ran", "dog", "on"]
    # Simulate a softmax distribution over next tokens
    logits = np.array([2.5, 1.2, 0.8, 3.1, 1.5, 0.3, 0.9, 2.0])
    probs = np.exp(logits) / np.exp(logits).sum()
    print("Ex04 — Token Probabilities (next token after 'The cat sat on the'):")
    for token, prob in sorted(zip(vocab, probs), key=lambda x: -x[1]):
        bar = "█" * int(prob * 30)
        print(f"  '{token:<6}': {prob:.4f}  {bar}")

def ex05():
    """Next token prediction (autoregressive generation)"""
    np.random.seed(7)
    prompt = "The sky is"
    vocab = ["blue", "clear", "dark", "falling", "beautiful", "green"]
    # Simulate 3 steps of greedy decoding
    generated = []
    context = prompt
    for step in range(4):
        probs = np.random.dirichlet(np.ones(len(vocab)) * 0.5)
        chosen = vocab[np.argmax(probs)]
        generated.append(chosen)
        context += " " + chosen
    print("Ex05 — Autoregressive Generation:")
    print(f"  Prompt:    '{prompt}'")
    print(f"  Generated: '{context}'")
    print(f"  Each token is predicted from ALL previous tokens (causal attention)")

def ex06():
    """Temperature concept"""
    np.random.seed(0)
    logits = np.array([3.0, 1.5, 0.5, 0.1])
    tokens = ["Paris", "London", "Berlin", "Rome"]
    print("Ex06 — Temperature Scaling:")
    for temp in [0.1, 0.5, 1.0, 2.0]:
        scaled = logits / temp
        probs = np.exp(scaled) / np.exp(scaled).sum()
        dist = " | ".join(f"{t}:{p:.3f}" for t, p in zip(tokens, probs))
        label = "← deterministic" if temp == 0.1 else ("← creative" if temp == 2.0 else "")
        print(f"  T={temp}: [{dist}] {label}")

def ex07():
    """Top-p (nucleus) sampling"""
    np.random.seed(1)
    tokens = ["the", "a", "an", "some", "this", "that", "my", "our"]
    probs = np.array([0.35, 0.22, 0.18, 0.10, 0.07, 0.04, 0.02, 0.02])
    p = 0.8
    cumulative = np.cumsum(probs)
    nucleus = [t for t, c in zip(tokens, cumulative) if c <= p]
    nucleus.append(tokens[len(nucleus)])  # add the token that crosses threshold
    print("Ex07 — Top-p (Nucleus) Sampling (p=0.8):")
    for t, prob, cum in zip(tokens, probs, cumulative):
        marker = " ← in nucleus" if t in nucleus else ""
        print(f"  '{t:<6}' p={prob:.2f}  cumulative={cum:.2f}{marker}")
    print(f"  Sample only from nucleus: {nucleus}")

def ex08():
    """Top-k sampling"""
    tokens = ["Paris", "London", "Berlin", "Rome", "Tokyo", "Oslo", "Lima", "Cairo"]
    probs  = [0.30,   0.20,    0.15,    0.12,  0.10,  0.07,  0.04,  0.02]
    k = 4
    top_k_tokens = tokens[:k]
    top_k_probs  = np.array(probs[:k])
    top_k_probs  /= top_k_probs.sum()
    print(f"Ex08 — Top-k Sampling (k={k}):")
    print(f"  Original vocab: {list(zip(tokens, probs))}")
    print(f"  Top-{k} tokens: {list(zip(top_k_tokens, top_k_probs.round(3)))}")
    print(f"  Remaining tokens are masked (prob=0)")

def ex09():
    """Greedy decoding"""
    np.random.seed(3)
    prompt_tokens = [101, 2023, 2003]  # token ids for "This is"
    # Simulate 5 greedy steps
    vocab_sample = ["a", "great", "wonderful", "day", "for", "learning", "AI"]
    print("Ex09 — Greedy Decoding:")
    print(f"  Prompt token IDs: {prompt_tokens}")
    sequence = []
    for step in range(5):
        probs = np.random.dirichlet([1.0] * len(vocab_sample))
        best = vocab_sample[np.argmax(probs)]
        sequence.append(best)
    print(f"  Greedy output: 'This is {' '.join(sequence)}'")
    print(f"  Always picks argmax(probs) — deterministic but can be repetitive")

def ex10():
    """Beam search concept"""
    print("Ex10 — Beam Search (beam_width=3):")
    # Simulate beam search tree
    beams = [("The cat", 0.6), ("A cat", 0.3), ("One cat", 0.1)]
    print(f"  Step 0 — Initial beams:")
    for beam, score in beams:
        print(f"    '{beam}' score={score:.2f}")
    # Expand each beam
    expansions = {
        "The cat":  [("The cat sat", 0.6*0.7), ("The cat ran", 0.6*0.2)],
        "A cat":    [("A cat sat",   0.3*0.6), ("A cat jumped", 0.3*0.3)],
        "One cat":  [("One cat sat", 0.1*0.5), ("One cat ran",  0.1*0.4)],
    }
    all_cands = [cand for cands in expansions.values() for cand in cands]
    all_cands.sort(key=lambda x: -x[1])
    print(f"  Step 1 — Top 3 beams after expansion:")
    for beam, score in all_cands[:3]:
        print(f"    '{beam}' score={score:.3f}")

def ex11():
    """Context window concept"""
    models = {
        "GPT-3":            4_096,
        "GPT-3.5-turbo":   16_384,
        "GPT-4":            8_192,
        "GPT-4-turbo":    128_000,
        "Claude-3-Opus":  200_000,
        "Gemini-1.5-Pro": 1_000_000,
        "LLaMA-3-8B":       8_192,
    }
    print("Ex11 — Context Window Sizes:")
    for model, ctx in models.items():
        pages = ctx // 500  # ~500 tokens per page
        print(f"  {model:<22}: {ctx:>10,} tokens (~{pages:>4} pages of text)")
    print("  Larger context = more expensive + slower but handles longer docs")

def ex12():
    """Prompt vs completion"""
    prompt = "Translate to French: 'Hello, how are you?'"
    completion = "Bonjour, comment allez-vous?"
    system = "You are a professional translator."
    print("Ex12 — Prompt vs Completion:")
    print(f"  System:     '{system}'")
    print(f"  Prompt:     '{prompt}'")
    print(f"  Completion: '{completion}'")
    prompt_tokens = len(prompt.split()) * 1.3
    comp_tokens   = len(completion.split()) * 1.3
    print(f"  ~Prompt tokens: {prompt_tokens:.0f}  |  ~Completion tokens: {comp_tokens:.0f}")
    print(f"  Cost = (prompt_tokens × input_price) + (comp_tokens × output_price)")

def ex13():
    """Tokens vs words"""
    examples = [
        ("Hello world",          2,  2),
        ("ChatGPT is amazing",   4,  4),
        ("Unbelievably difficult",3, 2),
        ("supercalifragilistic", 6,  1),
        ("2+2=4",                4,  1),
        ("I love 🍕",            4,  3),
    ]
    print("Ex13 — Tokens vs Words:")
    print(f"  {'Text':<25} {'Approx Tokens':>14} {'Words':>7} {'Ratio':>7}")
    print(f"  {'-'*55}")
    for text, toks, words in examples:
        ratio = toks / words if words else 0
        print(f"  {text:<25} {toks:>14} {words:>7} {ratio:>7.2f}")
    print(f"  Rule of thumb: 1 token ≈ ¾ of a word (English)")

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Token counting with tiktoken concept"""
    # tiktoken pattern (show without importing)
    code = '''import tiktoken
enc = tiktoken.encoding_for_model("gpt-4")
text = "Hello, how are you doing today?"
tokens = enc.encode(text)
print(f"Token count: {len(tokens)}")   # → 8
print(f"Token IDs:   {tokens}")        # → [9906, 11, 1268, 527, 499, 3815, 3432, 30]'''
    text = "Hello, how are you doing today?"
    approx_tokens = math.ceil(len(text) / 4)
    print("Ex14 — Token Counting (tiktoken pattern):")
    print(f"  Text: '{text}'")
    print(f"  Approx token count (len/4): {approx_tokens}")
    print(f"  Code pattern:\n{code}")

def ex15():
    """Cost estimation"""
    models_pricing = {
        "gpt-4":            {"input": 0.03,   "output": 0.06},
        "gpt-4-turbo":      {"input": 0.01,   "output": 0.03},
        "gpt-3.5-turbo":    {"input": 0.0005, "output": 0.0015},
        "claude-3-opus":    {"input": 0.015,  "output": 0.075},
        "claude-3-sonnet":  {"input": 0.003,  "output": 0.015},
    }
    prompt_tokens = 500
    completion_tokens = 200
    print(f"Ex15 — Cost Estimation ({prompt_tokens} prompt + {completion_tokens} completion tokens):")
    print(f"  {'Model':<20} {'Input $':>9} {'Output $':>10} {'Total $':>9}")
    print(f"  {'-'*50}")
    for model, prices in models_pricing.items():
        input_cost  = (prompt_tokens / 1000) * prices["input"]
        output_cost = (completion_tokens / 1000) * prices["output"]
        total = input_cost + output_cost
        print(f"  {model:<20} ${input_cost:>8.5f} ${output_cost:>9.5f} ${total:>8.5f}")

def ex16():
    """Context management"""
    max_context = 4096
    system_tokens = 150
    available = max_context - system_tokens
    messages = [
        ("user",      "Tell me about transformers", 50),
        ("assistant", "Transformers are neural networks...", 120),
        ("user",      "How does attention work?", 40),
        ("assistant", "Attention computes Q, K, V matrices...", 200),
        ("user",      "What is self-attention?", 35),
    ]
    print("Ex16 — Context Management:")
    print(f"  Max context: {max_context} | System: {system_tokens} | Available: {available}")
    running = 0
    for role, msg, tokens in messages:
        running += tokens
        fits = "✓" if running <= available else "✗ TRUNCATE"
        print(f"  [{role:<10}] ~{tokens:>3} tok | cumulative={running:>4} | {fits}")
    print(f"  Strategy: sliding window or summarize old messages")

def ex17():
    """System/user/assistant roles"""
    conversation = [
        {"role": "system",    "content": "You are a helpful Python tutor. Be concise."},
        {"role": "user",      "content": "What is a list comprehension?"},
        {"role": "assistant", "content": "[expr for item in iterable if condition]"},
        {"role": "user",      "content": "Give me an example."},
        {"role": "assistant", "content": "[x**2 for x in range(10) if x % 2 == 0]"},
    ]
    print("Ex17 — System/User/Assistant Roles:")
    for msg in conversation:
        role_pad = f"[{msg['role'].upper():<10}]"
        print(f"  {role_pad} {msg['content']}")
    print(f"  System sets behavior | User sends input | Assistant responds")

def ex18():
    """Message history format"""
    history = []
    def add_message(role, content):
        history.append({"role": role, "content": content, "timestamp": "2026-01-01"})
    add_message("system", "You are a math assistant.")
    add_message("user", "What is 7 * 8?")
    add_message("assistant", "7 × 8 = 56")
    add_message("user", "And 9 * 9?")
    add_message("assistant", "9 × 9 = 81")
    print("Ex18 — Message History Format (JSON):")
    print(json.dumps(history, indent=2))

def ex19():
    """JSON mode concept"""
    prompt = "Extract name and age from: 'Alice is 30 years old'"
    expected_output = {"name": "Alice", "age": 30}
    print("Ex19 — JSON Mode:")
    print(f"  Prompt:  '{prompt}'")
    print(f"  API call: response_format={{'type': 'json_object'}}")
    print(f"  Output:  {json.dumps(expected_output)}")
    print(f"  Note: JSON mode guarantees valid JSON but NOT a specific schema")
    print(f"  For schema: use function calling or Pydantic output parsers")

def ex20():
    """Function calling format"""
    function_def = {
        "name": "get_weather",
        "description": "Get current weather for a city",
        "parameters": {
            "type": "object",
            "properties": {
                "city":  {"type": "string", "description": "City name"},
                "units": {"type": "string", "enum": ["celsius", "fahrenheit"]}
            },
            "required": ["city"]
        }
    }
    llm_response = {
        "function_call": {
            "name": "get_weather",
            "arguments": json.dumps({"city": "Paris", "units": "celsius"})
        }
    }
    print("Ex20 — Function Calling Format:")
    print(f"  Function definition:\n{json.dumps(function_def, indent=4)}")
    print(f"  LLM response:\n{json.dumps(llm_response, indent=4)}")

def ex21():
    """Streaming concept"""
    full_response = "The capital of France is Paris, which is known as the City of Light."
    tokens = full_response.split()
    print("Ex21 — Streaming (simulated token-by-token output):")
    print("  Streaming: ", end="", flush=True)
    output = ""
    for token in tokens:
        output += token + " "
    print(output.strip())
    print(f"  API: stream=True → yields chunks instead of waiting for full response")
    print(f"  Total tokens streamed: {len(tokens)}")

def ex22():
    """Retry with exponential backoff"""
    def simulate_retry(max_retries=4):
        results = []
        for attempt in range(max_retries):
            wait = (2 ** attempt) + (0.1 * attempt)  # exponential backoff
            results.append((attempt + 1, wait))
        return results
    print("Ex22 — Retry with Exponential Backoff:")
    print(f"  {'Attempt':>8} {'Wait (s)':>10} {'Action'}")
    for attempt, wait in simulate_retry():
        action = "→ success" if attempt == 3 else "→ RateLimitError, wait..."
        print(f"  {attempt:>8} {wait:>10.1f}s {action}")
    print(f"  Code: time.sleep(2**retry + random.uniform(0, 1))")

def ex23():
    """Rate limiting concept"""
    print("Ex23 — Rate Limiting:")
    rate_limits = {
        "gpt-3.5-turbo": {"RPM": 3_500,  "TPM": 90_000,   "RPD": 10_000},
        "gpt-4":         {"RPM": 500,    "TPM": 40_000,   "RPD": 200},
        "gpt-4-turbo":   {"RPM": 5_000,  "TPM": 800_000,  "RPD": None},
        "claude-3-opus": {"RPM": 2_000,  "TPM": 100_000,  "RPD": None},
    }
    print(f"  {'Model':<18} {'RPM':>7} {'TPM':>10} {'RPD':>8}")
    print(f"  {'-'*47}")
    for model, limits in rate_limits.items():
        rpd = str(limits["RPD"]) if limits["RPD"] else "unlimited"
        print(f"  {model:<18} {limits['RPM']:>7,} {limits['TPM']:>10,} {rpd:>8}")
    print(f"  RPM=Requests/min  TPM=Tokens/min  RPD=Requests/day")

def ex24():
    """Model comparison"""
    models = {
        "GPT-3.5-turbo": {"params": "175B",  "ctx": "16K",   "cost": "$",   "speed": "Fast",   "quality": "Good"},
        "GPT-4":         {"params": "~1T",   "ctx": "8K",    "cost": "$$$$","speed": "Slow",   "quality": "Excellent"},
        "GPT-4-turbo":   {"params": "~1T",   "ctx": "128K",  "cost": "$$$", "speed": "Medium", "quality": "Excellent"},
        "Claude-3-Sonnet":{"params":"~70B",  "ctx": "200K",  "cost": "$$",  "speed": "Fast",   "quality": "Very Good"},
        "LLaMA-3-70B":   {"params": "70B",   "ctx": "8K",    "cost": "Free","speed": "Medium", "quality": "Very Good"},
    }
    print("Ex24 — Model Comparison:")
    print(f"  {'Model':<20} {'Params':>7} {'Ctx':>6} {'Cost':>6} {'Speed':>8} {'Quality'}")
    print(f"  {'-'*65}")
    for model, info in models.items():
        print(f"  {model:<20} {info['params']:>7} {info['ctx']:>6} {info['cost']:>6} {info['speed']:>8}  {info['quality']}")

def ex25():
    """Latency vs quality tradeoff"""
    scenarios = [
        ("Chatbot response",     "gpt-3.5-turbo", 0.8,  "Good",      "Low latency important"),
        ("Code generation",      "gpt-4-turbo",   2.5,  "Excellent", "Quality critical"),
        ("Document summary",     "gpt-4",         4.0,  "Excellent", "Batch OK, higher quality"),
        ("Simple classification","gpt-3.5-turbo", 0.5,  "Good",      "Fast + cheap"),
        ("Complex reasoning",    "gpt-4",         6.0,  "Best",      "Accuracy over speed"),
    ]
    print("Ex25 — Latency vs Quality Tradeoff:")
    print(f"  {'Use Case':<25} {'Model':<18} {'Latency':>8} {'Quality':>10} {'Rationale'}")
    print(f"  {'-'*85}")
    for case, model, lat, qual, note in scenarios:
        print(f"  {case:<25} {model:<18} {lat:>6.1f}s {qual:>10}  {note}")

def ex26():
    """Batching requests"""
    single_times = [0.8, 0.9, 0.7, 1.0, 0.8]
    batch_time   = 1.5  # batch of 5 processed together
    print("Ex26 — Batching Requests:")
    print(f"  5 requests sent individually:")
    total_serial = 0
    for i, t in enumerate(single_times, 1):
        total_serial += t
        print(f"    Request {i}: {t:.1f}s")
    print(f"  Total serial time: {total_serial:.1f}s")
    print(f"  Batch API (OpenAI Batch): ~{batch_time:.1f}s total (async, up to 24h)")
    print(f"  Batch discount: 50% cost reduction vs real-time API")
    print(f"  Batch API pattern: upload JSONL → poll for completion → download results")

# ─── NESTED (27–38) ────────────────────────────────────────

def ex27():
    """Chat completion format builder"""
    class ChatCompletionBuilder:
        def __init__(self, model="gpt-4", temperature=1.0, max_tokens=512):
            self.model = model
            self.temperature = temperature
            self.max_tokens = max_tokens
            self.messages = []

        def system(self, content):
            self.messages.insert(0, {"role": "system", "content": content})
            return self

        def user(self, content):
            self.messages.append({"role": "user", "content": content})
            return self

        def assistant(self, content):
            self.messages.append({"role": "assistant", "content": content})
            return self

        def build(self):
            return {
                "model": self.model,
                "temperature": self.temperature,
                "max_tokens": self.max_tokens,
                "messages": self.messages
            }

    payload = (ChatCompletionBuilder(model="gpt-4", temperature=0.7)
               .system("You are a Python expert.")
               .user("Explain list comprehensions.")
               .build())
    print("Ex27 — Chat Completion Builder:")
    print(json.dumps(payload, indent=2))

def ex28():
    """Message history manager class"""
    class MessageHistory:
        def __init__(self, max_messages=20):
            self.messages = []
            self.max_messages = max_messages

        def add(self, role, content):
            self.messages.append({"role": role, "content": content})
            if len(self.messages) > self.max_messages:
                # Keep system message + trim oldest
                system = [m for m in self.messages if m["role"] == "system"]
                others = [m for m in self.messages if m["role"] != "system"]
                self.messages = system + others[-(self.max_messages - len(system)):]

        def get_messages(self):
            return self.messages

        def token_estimate(self):
            return sum(len(m["content"].split()) * 1.3 for m in self.messages)

    hist = MessageHistory(max_messages=5)
    hist.add("system", "You are helpful.")
    for i in range(1, 6):
        hist.add("user", f"Question {i}")
        hist.add("assistant", f"Answer {i}")
    print("Ex28 — Message History Manager:")
    print(f"  Messages kept (max=5): {len(hist.get_messages())}")
    for m in hist.get_messages():
        print(f"  [{m['role']:<10}] {m['content']}")
    print(f"  Estimated tokens: {hist.token_estimate():.0f}")

def ex29():
    """Token budget manager"""
    class TokenBudget:
        def __init__(self, model="gpt-4", max_tokens=8192):
            self.max_tokens = max_tokens
            self.system_reserve = 200
            self.completion_reserve = 1024
            self.used = 0

        def estimate(self, text):
            return int(len(text.split()) * 1.3)

        def can_add(self, text):
            est = self.estimate(text)
            available = self.max_tokens - self.system_reserve - self.completion_reserve
            return self.used + est <= available

        def add(self, text):
            if self.can_add(text):
                self.used += self.estimate(text)
                return True
            return False

        def remaining(self):
            return self.max_tokens - self.system_reserve - self.completion_reserve - self.used

    budget = TokenBudget(max_tokens=8192)
    docs = ["Short doc." * 10, "Medium document. " * 50, "Long document text. " * 300]
    print("Ex29 — Token Budget Manager:")
    print(f"  Max context: {budget.max_tokens} | System: {budget.system_reserve} | Completion: {budget.completion_reserve}")
    for i, doc in enumerate(docs, 1):
        added = budget.add(doc)
        print(f"  Doc {i} ({budget.estimate(doc):>4} toks): {'added ✓' if added else 'SKIPPED — budget exceeded'} | remaining={budget.remaining()}")

def ex30():
    """Conversation summarizer concept"""
    class ConversationSummarizer:
        def __init__(self, summary_threshold=10):
            self.messages = []
            self.summary = ""
            self.threshold = summary_threshold

        def add(self, role, content):
            self.messages.append((role, content))
            if len(self.messages) >= self.threshold:
                self._summarize()

        def _summarize(self):
            # In production: call LLM to summarize; here simulate
            topics = set()
            for role, content in self.messages:
                topics.update(content.lower().split()[:3])
            self.summary = f"[Summary of {len(self.messages)} messages covering: {', '.join(list(topics)[:5])}]"
            self.messages = []  # clear after summarizing

        def context(self):
            ctx = []
            if self.summary:
                ctx.append(("system", f"Previous conversation: {self.summary}"))
            ctx.extend(self.messages)
            return ctx

    summ = ConversationSummarizer(threshold=4)
    for i in range(6):
        summ.add("user", f"message about topic {i}")
        summ.add("assistant", f"response covering topic {i}")
    print("Ex30 — Conversation Summarizer:")
    print(f"  Summary generated: '{summ.summary}'")
    print(f"  Active messages: {len(summ.messages)}")
    for role, content in summ.context():
        print(f"  [{role:<10}] {content}")

def ex31():
    """Context window packer"""
    def pack_messages(messages, max_tokens, token_fn=lambda m: len(m["content"].split())):
        packed = []
        used = 0
        for msg in reversed(messages):
            t = token_fn(msg)
            if used + t <= max_tokens:
                packed.insert(0, msg)
                used += t
            else:
                break  # stop once we can't fit more (FIFO drop oldest)
        return packed, used

    messages = [{"role": "user" if i % 2 == 0 else "assistant",
                 "content": f"{'Question' if i%2==0 else 'Answer'} number {i} with some context text"}
                for i in range(10)]
    packed, tokens_used = pack_messages(messages, max_tokens=40)
    print("Ex31 — Context Window Packer (max_tokens=40):")
    print(f"  Total messages: {len(messages)} | Packed: {len(packed)} | Tokens used: {tokens_used}")
    for m in packed:
        print(f"  [{m['role']:<10}] {m['content']}")

def ex32():
    """Few-shot prompt builder"""
    class FewShotPromptBuilder:
        def __init__(self, task_description):
            self.task = task_description
            self.examples = []
            self.query = ""

        def add_example(self, input_text, output_text):
            self.examples.append((input_text, output_text))
            return self

        def set_query(self, query):
            self.query = query
            return self

        def build(self):
            prompt = f"{self.task}\n\n"
            for i, (inp, out) in enumerate(self.examples, 1):
                prompt += f"Example {i}:\nInput: {inp}\nOutput: {out}\n\n"
            prompt += f"Now answer:\nInput: {self.query}\nOutput:"
            return prompt

    prompt = (FewShotPromptBuilder("Classify sentiment as positive or negative.")
              .add_example("I love this product!", "positive")
              .add_example("This is terrible quality.", "negative")
              .add_example("Absolutely fantastic experience!", "positive")
              .set_query("The service was disappointing.")
              .build())
    print("Ex32 — Few-Shot Prompt Builder:")
    print(prompt)

def ex33():
    """Structured output parser"""
    class StructuredOutputParser:
        def __init__(self, schema):
            self.schema = schema

        def parse(self, llm_output):
            try:
                data = json.loads(llm_output)
                return self._validate(data)
            except json.JSONDecodeError:
                return self._extract_from_text(llm_output)

        def _validate(self, data):
            result = {}
            for key, typ in self.schema.items():
                if key in data:
                    result[key] = typ(data[key])
                else:
                    result[key] = None
            return result

        def _extract_from_text(self, text):
            # Fallback: try to find key:value pairs
            return {"raw": text, "parse_error": True}

    parser = StructuredOutputParser({"name": str, "age": int, "score": float})
    outputs = [
        '{"name": "Alice", "age": 30, "score": 9.5}',
        '{"name": "Bob", "age": "25", "score": "8.2"}',
        'name: Charlie, age: 22',
    ]
    print("Ex33 — Structured Output Parser:")
    for out in outputs:
        result = parser.parse(out)
        print(f"  Input:  {out}")
        print(f"  Parsed: {result}\n")

def ex34():
    """LLM pipeline class"""
    class LLMPipeline:
        def __init__(self, system_prompt, model="gpt-4"):
            self.system = system_prompt
            self.model = model
            self.preprocessors = []
            self.postprocessors = []

        def add_preprocessor(self, fn):
            self.preprocessors.append(fn)
            return self

        def add_postprocessor(self, fn):
            self.postprocessors.append(fn)
            return self

        def run(self, user_input):
            # Pre-process input
            text = user_input
            for fn in self.preprocessors:
                text = fn(text)
            # Simulate LLM call
            prompt_payload = {"model": self.model,
                              "messages": [{"role": "system", "content": self.system},
                                           {"role": "user",   "content": text}]}
            simulated_response = f"[LLM response to: '{text[:40]}...']"
            # Post-process
            for fn in self.postprocessors:
                simulated_response = fn(simulated_response)
            return prompt_payload, simulated_response

    pipeline = (LLMPipeline("You are a helpful assistant.", model="gpt-4")
                .add_preprocessor(str.strip)
                .add_preprocessor(str.lower)
                .add_postprocessor(str.strip))
    payload, response = pipeline.run("  What is Python?  ")
    print("Ex34 — LLM Pipeline:")
    print(f"  Input:    '  What is Python?  '")
    print(f"  After preprocessors → '{payload['messages'][1]['content']}'")
    print(f"  Simulated response:   {response}")

def ex35():
    """Chain of thought extractor"""
    llm_output_cot = """Let me think step by step.
First, I need to find the total cost: 3 items × $5 = $15.
Then, apply the 20% discount: $15 × 0.20 = $3.
Finally, subtract: $15 - $3 = $12.
Therefore, the answer is $12."""

    def extract_cot(text):
        lines = text.strip().split('\n')
        steps = [l for l in lines if any(w in l.lower() for w in
                 ['first', 'then', 'next', 'finally', 'therefore', 'step'])]
        answer_line = [l for l in lines if 'therefore' in l.lower() or 'answer' in l.lower()]
        return {"steps": steps, "answer": answer_line[0] if answer_line else lines[-1]}

    result = extract_cot(llm_output_cot)
    print("Ex35 — Chain-of-Thought Extractor:")
    print(f"  Raw LLM output:\n{llm_output_cot}")
    print(f"  Extracted steps:")
    for s in result["steps"]:
        print(f"    → {s}")
    print(f"  Final answer: {result['answer']}")

def ex36():
    """Multi-step reasoning pipeline"""
    def step_decompose(question):
        return [f"Sub-question 1: What are the key terms in '{question[:30]}'?",
                "Sub-question 2: What relevant facts do we know?",
                "Sub-question 3: How do these facts connect?",
                "Sub-question 4: What is the final conclusion?"]

    def step_answer(sub_q, step):
        answers = ["Key terms: cost, discount, total",
                   "Facts: 3 items at $5 each, 20% discount",
                   "Connection: multiply then subtract discount",
                   "Conclusion: $12"]
        return answers[step] if step < len(answers) else "Unknown"

    question = "If 3 items cost $5 each and there's a 20% discount, what's the total?"
    sub_questions = step_decompose(question)
    print("Ex36 — Multi-Step Reasoning Pipeline:")
    print(f"  Question: {question}")
    for i, sq in enumerate(sub_questions):
        ans = step_answer(sq, i)
        print(f"  {sq}")
        print(f"    → {ans}")

def ex37():
    """LLM router — choose model by task"""
    def route_model(task_description, budget="medium"):
        task = task_description.lower()
        routing_rules = [
            (["code", "function", "debug", "program"], "gpt-4",           "Code tasks need precision"),
            (["summarize", "summary", "tldr"],          "gpt-3.5-turbo",  "Summarization is cost-effective"),
            (["translate"],                              "gpt-3.5-turbo",  "Translation well-supported cheaply"),
            (["analyze", "reason", "complex", "logic"], "gpt-4",          "Complex reasoning needs GPT-4"),
            (["classify", "label", "categorize"],       "gpt-3.5-turbo",  "Classification is simple"),
        ]
        for keywords, model, reason in routing_rules:
            if any(kw in task for kw in keywords):
                return model, reason
        return "gpt-3.5-turbo", "Default: use cheaper model"

    tasks = ["Write a Python function to sort a list",
             "Summarize this 10-page document",
             "Analyze the logical consistency of this argument",
             "Classify this email as spam or not spam"]
    print("Ex37 — LLM Router:")
    for task in tasks:
        model, reason = route_model(task)
        print(f"  Task:   '{task[:45]}'")
        print(f"  → Model: {model} ({reason})\n")

def ex38():
    """LLM cache (in-memory)"""
    import hashlib

    class LLMCache:
        def __init__(self, max_size=100):
            self.cache = {}
            self.max_size = max_size
            self.hits = 0
            self.misses = 0

        def _key(self, messages, model, temperature):
            content = json.dumps({"messages": messages, "model": model, "temp": temperature}, sort_keys=True)
            return hashlib.md5(content.encode()).hexdigest()

        def get(self, messages, model="gpt-4", temperature=0.0):
            key = self._key(messages, model, temperature)
            if key in self.cache:
                self.hits += 1
                return self.cache[key]
            self.misses += 1
            return None

        def set(self, messages, response, model="gpt-4", temperature=0.0):
            if len(self.cache) >= self.max_size:
                oldest = next(iter(self.cache))
                del self.cache[oldest]
            key = self._key(messages, model, temperature)
            self.cache[key] = response

        def stats(self):
            total = self.hits + self.misses
            return {"hits": self.hits, "misses": self.misses,
                    "hit_rate": f"{self.hits/total*100:.1f}%" if total else "0%"}

    cache = LLMCache()
    msgs = [{"role": "user", "content": "What is 2+2?"}]
    # Miss
    r1 = cache.get(msgs, temperature=0.0)
    cache.set(msgs, "4", temperature=0.0)
    # Hit
    r2 = cache.get(msgs, temperature=0.0)
    # Different temperature → no cache
    r3 = cache.get(msgs, temperature=0.7)
    print("Ex38 — LLM In-Memory Cache:")
    print(f"  First call (miss): {r1}")
    print(f"  Second call (hit): '{r2}'")
    print(f"  Different temp (miss): {r3}")
    print(f"  Cache stats: {cache.stats()}")

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """LLM evaluation harness"""
    class LLMEvalHarness:
        def __init__(self, name):
            self.name = name
            self.results = []

        def evaluate(self, test_cases):
            for case in test_cases:
                prompt, expected, actual = case["prompt"], case["expected"], case["actual"]
                exact = actual.strip().lower() == expected.strip().lower()
                contains = expected.lower() in actual.lower()
                self.results.append({"prompt": prompt, "exact": exact, "contains": contains})
            return self

        def report(self):
            n = len(self.results)
            exact_acc = sum(r["exact"] for r in self.results) / n
            contains_acc = sum(r["contains"] for r in self.results) / n
            return {"total": n, "exact_match": f"{exact_acc:.2%}", "contains_match": f"{contains_acc:.2%}"}

    test_cases = [
        {"prompt": "Capital of France?",  "expected": "Paris",   "actual": "Paris"},
        {"prompt": "Capital of Germany?", "expected": "Berlin",  "actual": "The capital is Berlin."},
        {"prompt": "2+2=?",               "expected": "4",       "actual": "4"},
        {"prompt": "Capital of Japan?",   "expected": "Tokyo",   "actual": "Osaka"},
    ]
    harness = LLMEvalHarness("gpt-4-test")
    harness.evaluate(test_cases)
    report = harness.report()
    print("Ex39 — LLM Evaluation Harness:")
    for r in harness.results:
        print(f"  '{r['prompt'][:30]}' exact={r['exact']} contains={r['contains']}")
    print(f"  Report: {report}")

def ex40():
    """MMLU benchmark format"""
    mmlu_samples = [
        {
            "question": "Which of the following is NOT a layer in the OSI model?",
            "choices": ["A. Physical", "B. Data Link", "C. Session", "D. Encryption"],
            "answer": "D",
            "subject": "computer_science"
        },
        {
            "question": "The Central Limit Theorem states that:",
            "choices": ["A. All distributions are normal",
                        "B. Sample means are normally distributed for large n",
                        "C. Population must be normal",
                        "D. Variance is always 1"],
            "answer": "B",
            "subject": "statistics"
        }
    ]
    print("Ex40 — MMLU Benchmark Format:")
    for sample in mmlu_samples:
        print(f"\n  Subject: {sample['subject']}")
        print(f"  Q: {sample['question']}")
        for choice in sample["choices"]:
            marker = " ← CORRECT" if choice.startswith(sample["answer"]) else ""
            print(f"     {choice}{marker}")
    print("\n  MMLU: 57 subjects, 14K questions, tests world knowledge & reasoning")

def ex41():
    """HumanEval format"""
    humaneval_sample = {
        "task_id": "HumanEval/0",
        "prompt": '''def has_close_elements(numbers: list, threshold: float) -> bool:
    """Check if any two numbers are closer than threshold.
    >>> has_close_elements([1.0, 2.0, 3.0], 0.5)
    False
    >>> has_close_elements([1.0, 2.8, 3.0], 0.3)
    True
    """
''',
        "canonical_solution": '''    for i in range(len(numbers)):
        for j in range(i+1, len(numbers)):
            if abs(numbers[i] - numbers[j]) < threshold:
                return True
    return False''',
        "test": "assert has_close_elements([1.0, 2.0, 3.0], 0.5) == False"
    }
    print("Ex41 — HumanEval Benchmark Format:")
    print(f"  Task ID: {humaneval_sample['task_id']}")
    print(f"  Prompt:\n{humaneval_sample['prompt']}")
    print(f"  Canonical solution:\n{humaneval_sample['canonical_solution']}")
    print(f"  Test: {humaneval_sample['test']}")
    print(f"  HumanEval: 164 Python problems, measures pass@k metric")

def ex42():
    """Token probability analysis (logprobs)"""
    np.random.seed(42)
    tokens = ["Paris", "Lyon", "Marseille", "Toulouse", "Nice"]
    logprobs = np.array([-0.05, -2.3, -3.1, -4.0, -5.2])
    probs = np.exp(logprobs)
    print("Ex42 — Token Probability via Logprobs:")
    print(f"  {'Token':<12} {'Logprob':>9} {'Prob':>8} {'Bar'}")
    print(f"  {'-'*50}")
    for token, lp, p in zip(tokens, logprobs, probs):
        bar = "█" * int(p * 40)
        print(f"  {token:<12} {lp:>9.3f} {p:>8.4f} {bar}")
    perplexity = np.exp(-np.mean(logprobs))
    print(f"\n  Perplexity of sequence: {perplexity:.2f}")
    print(f"  Lower perplexity = model is more confident")

def ex43():
    """Logprobs analysis — top-5 alternatives"""
    np.random.seed(7)
    context = "The best programming language for data science is"
    alternatives = {
        "Python": -0.1,  "R": -2.5, "Julia": -3.3, "MATLAB": -4.1, "Scala": -5.0
    }
    print("Ex43 — Logprobs: Top Alternative Tokens:")
    print(f"  Context: '{context}'")
    print(f"\n  {'Token':<10} {'Logprob':>9} {'Prob%':>8} {'Confidence'}")
    print(f"  {'-'*45}")
    for token, lp in sorted(alternatives.items(), key=lambda x: -x[1]):
        prob = np.exp(lp) * 100
        conf = "High" if prob > 50 else ("Med" if prob > 10 else "Low")
        print(f"  {token:<10} {lp:>9.2f} {prob:>7.2f}% {conf}")
    print(f"\n  Use logprobs for: confidence scoring, calibration, uncertainty")

def ex44():
    """LLM fine-tuning data format (JSONL)"""
    finetune_data = [
        {"messages": [
            {"role": "system", "content": "You are a SQL expert."},
            {"role": "user",   "content": "Get all users older than 30"},
            {"role": "assistant", "content": "SELECT * FROM users WHERE age > 30;"}
        ]},
        {"messages": [
            {"role": "system", "content": "You are a SQL expert."},
            {"role": "user",   "content": "Count orders per customer"},
            {"role": "assistant", "content": "SELECT customer_id, COUNT(*) as order_count FROM orders GROUP BY customer_id;"}
        ]},
    ]
    print("Ex44 — Fine-Tuning Data Format (OpenAI JSONL):")
    for i, record in enumerate(finetune_data, 1):
        print(f"  Record {i}: {json.dumps(record)}")
    print(f"\n  Format: JSONL where each line is a complete conversation")
    print(f"  Min recommended: 50-100 examples for fine-tuning")
    print(f"  Upload: openai.files.create(file=open('data.jsonl'), purpose='fine-tune')")

def ex45():
    """Instruction tuning dataset format"""
    instruction_data = [
        {"instruction": "Summarize the following text in one sentence.",
         "input": "The quick brown fox jumps over the lazy dog repeatedly in the field.",
         "output": "A fox repeatedly jumps over a lazy dog in a field."},
        {"instruction": "Convert to uppercase.",
         "input": "hello world",
         "output": "HELLO WORLD"},
        {"instruction": "Write a haiku about autumn.",
         "input": "",
         "output": "Leaves gently falling\nCrisp air whispers of winter\nNature says goodbye"},
    ]
    print("Ex45 — Instruction Tuning Dataset (Alpaca format):")
    for i, item in enumerate(instruction_data, 1):
        print(f"\n  Example {i}:")
        print(f"    Instruction: {item['instruction']}")
        if item["input"]:
            print(f"    Input:       {item['input']}")
        print(f"    Output:      {item['output']}")
    print(f"\n  Used by: Alpaca, Vicuna, Dolly — instruction-following models")

def ex46():
    """RLHF reward model concept"""
    print("Ex46 — RLHF (Reinforcement Learning from Human Feedback):")
    stages = [
        ("Stage 1: Supervised Fine-Tuning (SFT)",
         "Train base LLM on high-quality demonstrations\n    Data: (prompt, ideal_response) pairs"),
        ("Stage 2: Reward Model Training",
         "Humans rank multiple responses: response_A > response_B\n    Train classifier: reward_model(prompt, response) → scalar score"),
        ("Stage 3: RL Optimization (PPO)",
         "Optimize LLM using reward_model as reward signal\n    KL penalty prevents drifting too far from SFT model"),
    ]
    for stage, desc in stages:
        print(f"\n  {stage}")
        print(f"    {desc}")

    # Simulate reward scores
    responses = [
        ("Safe, helpful response",       0.92),
        ("Somewhat helpful response",    0.65),
        ("Unhelpful response",           0.21),
        ("Harmful response",            -0.85),
    ]
    print(f"\n  Reward Model Scores:")
    for resp, score in responses:
        bar = "█" * int((score + 1) * 15)
        print(f"    {resp:<35}: {score:+.2f}  {bar}")

def ex47():
    """DPO preference format"""
    dpo_data = [
        {
            "prompt": "Explain recursion",
            "chosen": "Recursion is a function calling itself with a simpler input until a base case. Example: factorial(n) = n * factorial(n-1), with factorial(0) = 1.",
            "rejected": "Recursion means calling a function again and again."
        },
        {
            "prompt": "How to center a div in CSS?",
            "chosen": "Use flexbox: display:flex; justify-content:center; align-items:center; on the parent container.",
            "rejected": "Just use margin:auto but it doesn't always work."
        }
    ]
    print("Ex47 — DPO (Direct Preference Optimization) Format:")
    for i, item in enumerate(dpo_data, 1):
        print(f"\n  Example {i}:")
        print(f"    Prompt:   '{item['prompt']}'")
        print(f"    Chosen:   '{item['chosen'][:70]}...'")
        print(f"    Rejected: '{item['rejected'][:70]}'")
    print(f"\n  DPO vs RLHF: DPO skips reward model, trains directly on preferences")
    print(f"  Loss: maximize P(chosen) / (P(chosen) + P(rejected))")

def ex48():
    """Constitutional AI concept"""
    principles = [
        "Be helpful, harmless, and honest",
        "Do not assist with illegal activities",
        "Avoid generating misleading information",
        "Respect privacy and personal data",
        "Do not produce discriminatory content",
    ]
    cai_pipeline = [
        ("Generate", "LLM generates initial response to user request"),
        ("Critique", "LLM critiques its own response against each principle"),
        ("Revise",   "LLM revises response to fix violations"),
        ("Repeat",   "Repeat critique-revise cycle N times"),
        ("Train",    "Use revised responses as SFT data for final model"),
    ]
    print("Ex48 — Constitutional AI (Anthropic):")
    print(f"  Principles:")
    for p in principles:
        print(f"    - {p}")
    print(f"\n  Pipeline:")
    for step, desc in cai_pipeline:
        print(f"    [{step:<8}] {desc}")
    print(f"\n  Goal: Self-supervised alignment without human labelers for every output")

def ex49():
    """Model distillation concept"""
    print("Ex49 — Model Distillation:")
    setup = {
        "Teacher Model":  "GPT-4 (large, expensive, accurate)",
        "Student Model":  "GPT-2 (small, fast, cheap)",
        "Training Data":  "Teacher's soft probability outputs (not just hard labels)",
        "Loss Function":  "KL divergence between teacher and student distributions",
        "Temperature":    "T=4 to soften teacher probabilities (more information)",
    }
    for k, v in setup.items():
        print(f"  {k:<16}: {v}")

    # Simulate soft labels from teacher
    np.random.seed(0)
    hard_label = [0, 0, 1, 0]  # one-hot: class 2 is correct
    teacher_soft = [0.05, 0.1, 0.75, 0.10]  # teacher's probabilities (informative)
    print(f"\n  Hard label  (cross-entropy): {hard_label}")
    print(f"  Soft label  (distillation):  {teacher_soft}")
    print(f"  Soft labels reveal: class 0 ≈ class 1, but class 2 is most likely")
    print(f"  This relational info trains a better student than hard labels alone")

def ex50():
    """LLM system architecture"""
    print("Ex50 — LLM System Architecture (Production):")
    components = [
        ("Load Balancer",       "Routes requests across model replicas"),
        ("API Gateway",         "Auth, rate limiting, request validation"),
        ("Prompt Router",       "Select model/version based on task type"),
        ("LLM Cache",           "Redis cache for identical/similar prompts"),
        ("Model Server",        "vLLM/TGI/TensorRT serving, GPU inference"),
        ("Tokenizer Service",   "Fast tokenization (Rust-based)"),
        ("Safety Filter",       "Input/output moderation (rule + ML based)"),
        ("Streaming Handler",   "SSE/WebSocket for token streaming"),
        ("Observability",       "Prometheus metrics, distributed tracing"),
        ("Async Job Queue",     "Celery/Redis for batch inference"),
        ("Vector Store",        "FAISS/Pinecone for RAG retrieval"),
        ("Fine-tune Pipeline",  "S3 → training → eval → deploy"),
    ]
    print(f"\n  {'Component':<22} {'Responsibility'}")
    print(f"  {'-'*65}")
    for comp, desc in components:
        print(f"  {comp:<22} {desc}")
    print(f"\n  Typical p50 latency: 200ms (gpt-3.5) | 800ms (gpt-4)")
    print(f"  Throughput: vLLM achieves 10-30x vs HuggingFace naive serving")

# ─── MAIN ───────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("Examples 3.1 — LLM Basics")
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
