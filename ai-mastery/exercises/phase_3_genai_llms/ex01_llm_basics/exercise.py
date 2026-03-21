# ============================================================
# Exercise 3.1 — LLM Basics: OpenAI API, Models, Tokens
# ============================================================
#
# Prerequisites:
#   pip install openai tiktoken
#
# Set your API key:
#   export OPENAI_API_KEY="sk-..."
#
# ============================================================

import os
import time
import random
from openai import OpenAI, RateLimitError, APIError

# ---------------------------------------------------------------------------
# TODO 1: Set up OpenAI client with API key from env
# ---------------------------------------------------------------------------
# Hint: use os.getenv("OPENAI_API_KEY") and pass it to OpenAI(api_key=...)
def create_client() -> OpenAI:
    """Return an OpenAI client using the API key from the environment."""
    pass  # TODO 1


# ---------------------------------------------------------------------------
# TODO 2: Make a basic chat completion call
# ---------------------------------------------------------------------------
# Hint: client.chat.completions.create(model=..., messages=[...])
def basic_completion(client: OpenAI, user_message: str) -> object:
    """Send a single user message and return the full completion object."""
    pass  # TODO 2


# ---------------------------------------------------------------------------
# TODO 3: Print response text from choices[0].message.content
# ---------------------------------------------------------------------------
def print_response(completion) -> str:
    """Extract and return the assistant's text from a completion object."""
    pass  # TODO 3


# ---------------------------------------------------------------------------
# TODO 4: Count tokens using tiktoken
# ---------------------------------------------------------------------------
# Hint: import tiktoken; enc = tiktoken.encoding_for_model("gpt-3.5-turbo")
def count_tokens(text: str, model: str = "gpt-3.5-turbo") -> int:
    """Return the number of tokens in `text` for the given model."""
    pass  # TODO 4


# ---------------------------------------------------------------------------
# TODO 5: Make a completion with temperature=0 (deterministic)
# ---------------------------------------------------------------------------
def deterministic_completion(client: OpenAI, prompt: str) -> str:
    """Return a completion text generated with temperature=0."""
    pass  # TODO 5


# ---------------------------------------------------------------------------
# TODO 6: Make a completion with temperature=1 (creative)
# ---------------------------------------------------------------------------
def creative_completion(client: OpenAI, prompt: str) -> str:
    """Return a completion text generated with temperature=1."""
    pass  # TODO 6


# ---------------------------------------------------------------------------
# TODO 7: Use system message to set persona
# ---------------------------------------------------------------------------
def persona_completion(client: OpenAI, system_prompt: str, user_message: str) -> str:
    """Send a system message that defines a persona, then a user message."""
    pass  # TODO 7


# ---------------------------------------------------------------------------
# TODO 8: Implement multi-turn conversation (messages list)
# ---------------------------------------------------------------------------
def multi_turn_conversation(client: OpenAI, turns: list[dict]) -> str:
    """
    Accept a list of role/content dicts (the conversation so far) and
    return the assistant's next reply text.

    Example turns:
        [
            {"role": "user", "content": "Hi, what is 2+2?"},
            {"role": "assistant", "content": "4"},
            {"role": "user", "content": "And 4+4?"},
        ]
    """
    pass  # TODO 8


# ---------------------------------------------------------------------------
# TODO 9: Use max_tokens to limit response length
# ---------------------------------------------------------------------------
def limited_completion(client: OpenAI, prompt: str, max_tokens: int = 50) -> str:
    """Return a completion capped at `max_tokens` output tokens."""
    pass  # TODO 9


# ---------------------------------------------------------------------------
# TODO 10: Implement streaming response
# ---------------------------------------------------------------------------
def streaming_completion(client: OpenAI, prompt: str) -> str:
    """
    Stream the response token by token, printing each chunk as it arrives,
    and return the full assembled text at the end.
    Hint: pass stream=True; iterate over chunks and check
          chunk.choices[0].delta.content
    """
    pass  # TODO 10


# ---------------------------------------------------------------------------
# TODO 11: Handle API errors (RateLimitError, APIError)
# ---------------------------------------------------------------------------
def safe_completion(client: OpenAI, prompt: str) -> str | None:
    """
    Call basic_completion and handle RateLimitError and APIError gracefully.
    Return the response text on success, or None on error (print a message).
    """
    pass  # TODO 11


# ---------------------------------------------------------------------------
# TODO 12: Call with different models (gpt-3.5-turbo vs gpt-4)
# ---------------------------------------------------------------------------
def compare_models(client: OpenAI, prompt: str) -> dict[str, str]:
    """
    Call both 'gpt-3.5-turbo' and 'gpt-4' with the same prompt.
    Return a dict {"gpt-3.5-turbo": <text>, "gpt-4": <text>}.
    """
    pass  # TODO 12


# ---------------------------------------------------------------------------
# TODO 13: Compute and log cost per request (tokens * price)
# ---------------------------------------------------------------------------
# Approximate prices (USD per 1 000 tokens) — adjust as needed:
PRICES = {
    "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
    "gpt-4":         {"input": 0.03,   "output": 0.06},
}

def compute_cost(completion, model: str = "gpt-3.5-turbo") -> float:
    """
    Use completion.usage.prompt_tokens and completion.usage.completion_tokens
    together with PRICES to return the estimated cost in USD.
    """
    pass  # TODO 13


# ---------------------------------------------------------------------------
# TODO 14: Implement retry logic with exponential backoff
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
    Return the text on success, or None if all retries are exhausted.
    """
    pass  # TODO 14


# ---------------------------------------------------------------------------
# TODO 15: Build a simple chat history manager class
# ---------------------------------------------------------------------------
class ChatHistoryManager:
    """
    Manages a list of messages for a multi-turn conversation.

    Methods to implement:
        add_message(role, content)  — append to history
        get_history()               — return full messages list
        clear()                     — reset history
        get_last_n(n)               — return last n messages
        to_string()                 — pretty-print history
    """

    def __init__(self, system_prompt: str = ""):
        pass  # TODO 15

    def add_message(self, role: str, content: str) -> None:
        pass  # TODO 15

    def get_history(self) -> list[dict]:
        pass  # TODO 15

    def clear(self) -> None:
        pass  # TODO 15

    def get_last_n(self, n: int) -> list[dict]:
        pass  # TODO 15

    def to_string(self) -> str:
        pass  # TODO 15


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("=== Exercise 3.1 — LLM Basics ===\n")

    # TODO 1 — create client
    client = create_client()
    print("Client created:", client)

    # TODO 2 & 3 — basic completion
    completion = basic_completion(client, "What is the capital of France?")
    text = print_response(completion)
    print("Response:", text)

    # TODO 4 — token counting
    sample = "The quick brown fox jumps over the lazy dog."
    tokens = count_tokens(sample)
    print(f"Token count for sample text: {tokens}")

    # TODO 5 & 6 — temperature
    prompt = "Give me a creative name for a coffee shop."
    print("Deterministic:", deterministic_completion(client, prompt))
    print("Creative:     ", creative_completion(client, prompt))

    # TODO 7 — persona
    reply = persona_completion(
        client,
        system_prompt="You are a pirate who answers every question in pirate speak.",
        user_message="What is the weather like today?",
    )
    print("Persona reply:", reply)

    # TODO 8 — multi-turn
    turns = [
        {"role": "user", "content": "My name is Alice."},
        {"role": "assistant", "content": "Nice to meet you, Alice!"},
        {"role": "user", "content": "What is my name?"},
    ]
    print("Multi-turn reply:", multi_turn_conversation(client, turns))

    # TODO 9 — max_tokens
    print("Limited reply:", limited_completion(client, "Tell me a long story.", max_tokens=30))

    # TODO 10 — streaming
    print("Streaming reply:")
    full = streaming_completion(client, "Count from 1 to 5.")
    print("\nFull streamed text:", full)

    # TODO 11 — error handling
    result = safe_completion(client, "Hello!")
    print("Safe completion:", result)

    # TODO 12 — model comparison
    responses = compare_models(client, "Explain recursion in one sentence.")
    for model, resp in responses.items():
        print(f"[{model}] {resp}")

    # TODO 13 — cost
    comp = basic_completion(client, "Hello!")
    cost = compute_cost(comp, model="gpt-3.5-turbo")
    print(f"Estimated cost: ${cost:.6f}")

    # TODO 14 — retry
    text = completion_with_retry(client, "Say hi.")
    print("With retry:", text)

    # TODO 15 — history manager
    manager = ChatHistoryManager(system_prompt="You are a helpful assistant.")
    manager.add_message("user", "Hello!")
    manager.add_message("assistant", "Hi there!")
    manager.add_message("user", "How are you?")
    print("History:\n", manager.to_string())
    print("Last 2 messages:", manager.get_last_n(2))


if __name__ == "__main__":
    main()
