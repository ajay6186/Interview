# ============================================================
# Solution 3.1 — LLM Basics: OpenAI API, Models, Tokens
# ============================================================
#
# Prerequisites:
#   pip install openai tiktoken
#
# Set your API key:
#   export OPENAI_API_KEY="sk-..."
#
# When no real API key is present this module falls back to a lightweight
# mock layer so that the code structure is still fully demonstrable.
# ============================================================

import os
import time
import random
from unittest.mock import MagicMock
from openai import OpenAI, RateLimitError, APIError

# ---------------------------------------------------------------------------
# Mock helpers — used automatically when OPENAI_API_KEY is not set
# ---------------------------------------------------------------------------

def _mock_completion(user_message: str = "Hello", model: str = "gpt-3.5-turbo") -> object:
    """Return a MagicMock that mimics a real completion object."""
    # MOCK: In real usage, replace with actual API call
    choice = MagicMock()
    choice.message.content = f"[MOCK response to: '{user_message[:40]}']"
    completion = MagicMock()
    completion.choices = [choice]
    completion.model = model
    completion.usage.prompt_tokens = len(user_message.split()) + 5
    completion.usage.completion_tokens = 12
    completion.usage.total_tokens = completion.usage.prompt_tokens + completion.usage.completion_tokens
    return completion


def _is_mock_mode() -> bool:
    return not os.getenv("OPENAI_API_KEY")


# ---------------------------------------------------------------------------
# SOLUTION 1: Set up OpenAI client with API key from env
# ---------------------------------------------------------------------------
def create_client() -> OpenAI:
    """Return an OpenAI client using the API key from the environment."""
    api_key = os.getenv("OPENAI_API_KEY", "mock-key-not-set")
    # Pass the key explicitly so the client works even if the env var name
    # differs from what the library auto-discovers.
    client = OpenAI(api_key=api_key)
    return client


# ---------------------------------------------------------------------------
# SOLUTION 2: Make a basic chat completion call
# ---------------------------------------------------------------------------
def basic_completion(client: OpenAI, user_message: str) -> object:
    """Send a single user message and return the full completion object."""
    if _is_mock_mode():
        # MOCK: In real usage, replace with actual API call
        return _mock_completion(user_message)

    # Real call — straightforward chat completions request
    return client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": user_message}],
    )


# ---------------------------------------------------------------------------
# SOLUTION 3: Print response text from choices[0].message.content
# ---------------------------------------------------------------------------
def print_response(completion) -> str:
    """Extract and return the assistant's text from a completion object."""
    # The SDK wraps the JSON response; choices is a list of Choice objects.
    text = completion.choices[0].message.content
    print(text)
    return text


# ---------------------------------------------------------------------------
# SOLUTION 4: Count tokens using tiktoken
# ---------------------------------------------------------------------------
def count_tokens(text: str, model: str = "gpt-3.5-turbo") -> int:
    """Return the number of tokens in `text` for the given model."""
    try:
        import tiktoken
        # encoding_for_model picks the correct BPE vocabulary for the model.
        enc = tiktoken.encoding_for_model(model)
        return len(enc.encode(text))
    except ImportError:
        # Rough heuristic if tiktoken is not installed (~0.75 words per token)
        return max(1, len(text.split()) * 4 // 3)


# ---------------------------------------------------------------------------
# SOLUTION 5: Make a completion with temperature=0 (deterministic)
# ---------------------------------------------------------------------------
def deterministic_completion(client: OpenAI, prompt: str) -> str:
    """Return a completion text generated with temperature=0."""
    if _is_mock_mode():
        # MOCK: In real usage, replace with actual API call
        return f"[MOCK deterministic] {prompt[:30]}..."

    completion = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0,  # greedy decoding — same output every run
    )
    return completion.choices[0].message.content


# ---------------------------------------------------------------------------
# SOLUTION 6: Make a completion with temperature=1 (creative)
# ---------------------------------------------------------------------------
def creative_completion(client: OpenAI, prompt: str) -> str:
    """Return a completion text generated with temperature=1."""
    if _is_mock_mode():
        # MOCK: In real usage, replace with actual API call
        return f"[MOCK creative #{random.randint(1, 99)}] {prompt[:30]}..."

    completion = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=1,  # more random / creative sampling
    )
    return completion.choices[0].message.content


# ---------------------------------------------------------------------------
# SOLUTION 7: Use system message to set persona
# ---------------------------------------------------------------------------
def persona_completion(client: OpenAI, system_prompt: str, user_message: str) -> str:
    """Send a system message that defines a persona, then a user message."""
    if _is_mock_mode():
        # MOCK: In real usage, replace with actual API call
        return f"[MOCK persona — system='{system_prompt[:30]}...'] {user_message}"

    # The system role shapes the model's overall behaviour for the session.
    completion = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_message},
        ],
    )
    return completion.choices[0].message.content


# ---------------------------------------------------------------------------
# SOLUTION 8: Implement multi-turn conversation (messages list)
# ---------------------------------------------------------------------------
def multi_turn_conversation(client: OpenAI, turns: list[dict]) -> str:
    """
    Accept a list of role/content dicts (the conversation so far) and
    return the assistant's next reply text.
    """
    if _is_mock_mode():
        last_user = next(
            (t["content"] for t in reversed(turns) if t["role"] == "user"), ""
        )
        # MOCK: In real usage, replace with actual API call
        return f"[MOCK multi-turn reply to: '{last_user[:40]}']"

    # Pass the full history so the model has context for every prior turn.
    completion = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=turns,
    )
    return completion.choices[0].message.content


# ---------------------------------------------------------------------------
# SOLUTION 9: Use max_tokens to limit response length
# ---------------------------------------------------------------------------
def limited_completion(client: OpenAI, prompt: str, max_tokens: int = 50) -> str:
    """Return a completion capped at `max_tokens` output tokens."""
    if _is_mock_mode():
        # MOCK: In real usage, replace with actual API call
        return f"[MOCK — max_tokens={max_tokens}] Short reply..."

    completion = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,  # hard cap on generated tokens
    )
    return completion.choices[0].message.content


# ---------------------------------------------------------------------------
# SOLUTION 10: Implement streaming response
# ---------------------------------------------------------------------------
def streaming_completion(client: OpenAI, prompt: str) -> str:
    """
    Stream the response token by token, printing each chunk as it arrives,
    and return the full assembled text at the end.
    """
    if _is_mock_mode():
        # MOCK: In real usage, replace with actual API call
        words = ["1", " ", "2", " ", "3", " ", "4", " ", "5"]
        for w in words:
            print(w, end="", flush=True)
            time.sleep(0.05)
        print()
        return "".join(words)

    full_text = ""
    # stream=True returns a generator of ChatCompletionChunk objects.
    stream = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        stream=True,
    )
    for chunk in stream:
        delta_content = chunk.choices[0].delta.content
        if delta_content:
            print(delta_content, end="", flush=True)
            full_text += delta_content
    print()  # newline after streaming finishes
    return full_text


# ---------------------------------------------------------------------------
# SOLUTION 11: Handle API errors (RateLimitError, APIError)
# ---------------------------------------------------------------------------
def safe_completion(client: OpenAI, prompt: str) -> str | None:
    """
    Call basic_completion and handle RateLimitError and APIError gracefully.
    Return the response text on success, or None on error.
    """
    try:
        completion = basic_completion(client, prompt)
        return completion.choices[0].message.content
    except RateLimitError as e:
        # 429 — slow down and notify the caller
        print(f"[RateLimitError] Too many requests: {e}")
        return None
    except APIError as e:
        # Covers server errors (5xx), auth errors (401), etc.
        print(f"[APIError] {e.status_code}: {e.message}")
        return None
    except Exception as e:
        print(f"[UnexpectedError] {e}")
        return None


# ---------------------------------------------------------------------------
# SOLUTION 12: Call with different models (gpt-3.5-turbo vs gpt-4)
# ---------------------------------------------------------------------------
def compare_models(client: OpenAI, prompt: str) -> dict[str, str]:
    """
    Call both 'gpt-3.5-turbo' and 'gpt-4' with the same prompt.
    Return a dict {"gpt-3.5-turbo": <text>, "gpt-4": <text>}.
    """
    results: dict[str, str] = {}
    for model in ("gpt-3.5-turbo", "gpt-4"):
        if _is_mock_mode():
            # MOCK: In real usage, replace with actual API call
            results[model] = f"[MOCK {model}] reply to: '{prompt[:30]}'"
        else:
            completion = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
            )
            results[model] = completion.choices[0].message.content
    return results


# ---------------------------------------------------------------------------
# SOLUTION 13: Compute and log cost per request (tokens * price)
# ---------------------------------------------------------------------------
PRICES = {
    "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
    "gpt-4":         {"input": 0.03,   "output": 0.06},
}

def compute_cost(completion, model: str = "gpt-3.5-turbo") -> float:
    """
    Use completion.usage.prompt_tokens and completion.usage.completion_tokens
    together with PRICES to return the estimated cost in USD.
    """
    # Prices are listed per 1 000 tokens, so divide by 1 000.
    price = PRICES.get(model, {"input": 0.0, "output": 0.0})
    input_cost  = (completion.usage.prompt_tokens     / 1000) * price["input"]
    output_cost = (completion.usage.completion_tokens / 1000) * price["output"]
    total = input_cost + output_cost
    print(
        f"  [{model}] prompt={completion.usage.prompt_tokens} tok, "
        f"completion={completion.usage.completion_tokens} tok  → "
        f"cost=${total:.6f}"
    )
    return total


# ---------------------------------------------------------------------------
# SOLUTION 14: Implement retry logic with exponential backoff
# ---------------------------------------------------------------------------
def completion_with_retry(
    client: OpenAI,
    prompt: str,
    max_retries: int = 3,
    base_delay: float = 1.0,
) -> str | None:
    """
    Retry on RateLimitError up to `max_retries` times, doubling the wait
    each attempt (base_delay * 2^attempt + small jitter).
    """
    for attempt in range(max_retries):
        try:
            completion = basic_completion(client, prompt)
            return completion.choices[0].message.content
        except RateLimitError:
            if attempt == max_retries - 1:
                print("Max retries reached. Giving up.")
                return None
            # Exponential backoff: 1s, 2s, 4s … with ±0–1 s jitter
            delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
            print(f"Rate limited. Retrying in {delay:.1f}s… (attempt {attempt + 1}/{max_retries})")
            time.sleep(delay)
        except APIError as e:
            print(f"API error on attempt {attempt + 1}: {e}")
            return None
    return None


# ---------------------------------------------------------------------------
# SOLUTION 15: Build a simple chat history manager class
# ---------------------------------------------------------------------------
class ChatHistoryManager:
    """
    Manages a list of messages for a multi-turn conversation.
    """

    def __init__(self, system_prompt: str = ""):
        # Always prepend the system message if one is provided.
        self._messages: list[dict] = []
        if system_prompt:
            self._messages.append({"role": "system", "content": system_prompt})

    def add_message(self, role: str, content: str) -> None:
        """Append a new message to the conversation history."""
        self._messages.append({"role": role, "content": content})

    def get_history(self) -> list[dict]:
        """Return the full conversation history as a list of dicts."""
        return list(self._messages)  # return a copy to avoid external mutation

    def clear(self) -> None:
        """Reset history (keeps system prompt if it was set at init)."""
        system = [m for m in self._messages if m["role"] == "system"]
        self._messages = system  # preserve system prompt across clears

    def get_last_n(self, n: int) -> list[dict]:
        """Return the last `n` messages (excluding system prompt)."""
        non_system = [m for m in self._messages if m["role"] != "system"]
        return non_system[-n:]

    def to_string(self) -> str:
        """Pretty-print the full conversation history."""
        lines = []
        for msg in self._messages:
            role = msg["role"].upper().ljust(10)
            lines.append(f"{role}: {msg['content']}")
        return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("=== Solution 3.1 — LLM Basics ===\n")

    # SOLUTION 1 — create client
    client = create_client()
    mode = "MOCK" if _is_mock_mode() else "REAL API"
    print(f"Client created ({mode})\n")

    # SOLUTION 2 & 3 — basic completion
    print("--- Basic completion ---")
    completion = basic_completion(client, "What is the capital of France?")
    text = print_response(completion)
    print()

    # SOLUTION 4 — token counting
    print("--- Token counting ---")
    sample = "The quick brown fox jumps over the lazy dog."
    tokens = count_tokens(sample)
    print(f"'{sample}'\n→ {tokens} tokens\n")

    # SOLUTION 5 & 6 — temperature
    print("--- Temperature comparison ---")
    prompt = "Give me a creative name for a coffee shop."
    print("Deterministic:", deterministic_completion(client, prompt))
    print("Creative:     ", creative_completion(client, prompt))
    print()

    # SOLUTION 7 — persona
    print("--- Persona (system message) ---")
    reply = persona_completion(
        client,
        system_prompt="You are a pirate who answers every question in pirate speak.",
        user_message="What is the weather like today?",
    )
    print("Pirate reply:", reply, "\n")

    # SOLUTION 8 — multi-turn
    print("--- Multi-turn conversation ---")
    turns = [
        {"role": "user",      "content": "My name is Alice."},
        {"role": "assistant", "content": "Nice to meet you, Alice!"},
        {"role": "user",      "content": "What is my name?"},
    ]
    print("Reply:", multi_turn_conversation(client, turns), "\n")

    # SOLUTION 9 — max_tokens
    print("--- max_tokens limit ---")
    print("Limited reply:", limited_completion(client, "Tell me a long story.", max_tokens=30), "\n")

    # SOLUTION 10 — streaming
    print("--- Streaming ---")
    full = streaming_completion(client, "Count from 1 to 5.")
    print("Full streamed text:", full, "\n")

    # SOLUTION 11 — error handling
    print("--- Error handling ---")
    result = safe_completion(client, "Hello!")
    print("Safe completion:", result, "\n")

    # SOLUTION 12 — model comparison
    print("--- Model comparison ---")
    responses = compare_models(client, "Explain recursion in one sentence.")
    for model, resp in responses.items():
        print(f"  [{model}] {resp}")
    print()

    # SOLUTION 13 — cost
    print("--- Cost estimation ---")
    comp = basic_completion(client, "Hello, how are you?")
    compute_cost(comp, model="gpt-3.5-turbo")
    print()

    # SOLUTION 14 — retry
    print("--- Retry with backoff ---")
    text = completion_with_retry(client, "Say hi.")
    print("With retry:", text, "\n")

    # SOLUTION 15 — history manager
    print("--- Chat history manager ---")
    manager = ChatHistoryManager(system_prompt="You are a helpful assistant.")
    manager.add_message("user", "Hello!")
    manager.add_message("assistant", "Hi there! How can I help you?")
    manager.add_message("user", "Tell me about Python.")
    print(manager.to_string())
    print("\nLast 2:", manager.get_last_n(2))
    manager.clear()
    print("After clear:", manager.get_history())


if __name__ == "__main__":
    main()
