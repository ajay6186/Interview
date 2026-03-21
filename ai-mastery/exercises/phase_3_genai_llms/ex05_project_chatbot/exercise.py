# ============================================================
# Exercise 3.5 — Project: Build a Chatbot
# ============================================================
#
# Prerequisites:
#   pip install openai
#   (Optional) export OPENAI_API_KEY="sk-..."
#
# Topics:
#   • Conversation history management
#   • System prompt design
#   • Multi-turn conversation loop
#   • Context window management (truncation)
#   • Streaming responses concept
#   • Tool calling / function calling
#   • Chatbot evaluation
#   • Error handling and fallbacks
#   • Chatbot CLI interface
#   • Production chatbot architecture
# ============================================================

import time
import json
from typing import Optional


# ---------------------------------------------------------------------------
# TODO 1: Define the Message data structure
# ---------------------------------------------------------------------------
# A message in a conversation has a `role` ("system", "user", "assistant")
# and `content` (str). Create a simple class or TypedDict called `Message`.
# It should support dict-like access so it can be passed directly to the
# OpenAI messages list: {"role": ..., "content": ...}
class Message:
    """Represents a single conversation message."""

    def __init__(self, role: str, content: str):
        pass  # TODO 1

    def to_dict(self) -> dict:
        """Return {"role": ..., "content": ...} dict."""
        pass  # TODO 1

    def __repr__(self) -> str:
        pass  # TODO 1


# ---------------------------------------------------------------------------
# TODO 2: ConversationHistory class
# ---------------------------------------------------------------------------
# Manages the list of messages for a chat session.
# Methods to implement:
#   add(role, content)     — append a new Message
#   get_messages()         — return list of dicts (for the API)
#   clear()                — reset to system message only
#   length()               — return number of non-system messages
#   token_estimate()       — rough token count (4 chars ≈ 1 token)
class ConversationHistory:
    """Manages the ordered list of messages in a conversation."""

    def __init__(self, system_prompt: str):
        pass  # TODO 2

    def add(self, role: str, content: str) -> None:
        pass  # TODO 2

    def get_messages(self) -> list[dict]:
        pass  # TODO 2

    def clear(self) -> None:
        pass  # TODO 2

    def length(self) -> int:
        """Return the number of non-system messages."""
        pass  # TODO 2

    def token_estimate(self) -> int:
        """Return a rough token estimate: total chars / 4."""
        pass  # TODO 2


# ---------------------------------------------------------------------------
# TODO 3: Context window manager (truncation)
# ---------------------------------------------------------------------------
# When conversations grow long they exceed the model's context window.
# Implement a function that truncates `history` to stay within
# `max_tokens` (rough estimate). Strategy:
#   1. Always keep the system message.
#   2. Remove the oldest non-system messages until within limit.
# Return the (possibly truncated) list of message dicts.
def truncate_history(
    history: ConversationHistory,
    max_tokens: int = 3000,
) -> list[dict]:
    """Return a token-safe list of messages, dropping oldest turns first."""
    pass  # TODO 3


# ---------------------------------------------------------------------------
# TODO 4: System prompt designer
# ---------------------------------------------------------------------------
# Return a well-crafted system prompt string for a coding assistant chatbot.
# The prompt should define: persona, capabilities, response style,
# length preference, and what to do when it doesn't know something.
def coding_assistant_system_prompt() -> str:
    """Return a system prompt for a coding assistant chatbot."""
    pass  # TODO 4


# ---------------------------------------------------------------------------
# TODO 5: Mock LLM response (for running without API key)
# ---------------------------------------------------------------------------
# When no API key is set, generate a simulated response based on keywords
# in the user's message. Implement basic pattern matching:
#   - If message contains "hello" / "hi" → friendly greeting
#   - If message contains "python" → Python tip
#   - If message contains "error" / "bug" → debugging advice
#   - If message contains "help" → list capabilities
#   - Otherwise → generic "I'm not sure" response
# Return the mock response string.
def mock_llm_response(user_message: str) -> str:
    """Return a rule-based mock response for offline testing."""
    pass  # TODO 5


# ---------------------------------------------------------------------------
# TODO 6: Get LLM response (real or mock)
# ---------------------------------------------------------------------------
# Try to call the OpenAI API with the messages list.
# If OPENAI_API_KEY is not set, fall back to mock_llm_response().
# Handle APIError and RateLimitError gracefully.
# Return the assistant's reply string.
def get_response(messages: list[dict], user_message: str = "") -> str:
    """Call the LLM (or mock) and return the assistant's reply string."""
    pass  # TODO 6


# ---------------------------------------------------------------------------
# TODO 7: Streaming response simulation
# ---------------------------------------------------------------------------
# Simulate a streaming response by printing characters with a small delay.
# `text`: the full response string to stream.
# `delay`: seconds between each character (default 0.02).
# Print without newlines until done, then print a final newline.
def stream_response(text: str, delay: float = 0.02) -> None:
    """Print `text` character-by-character to simulate streaming."""
    pass  # TODO 7


# ---------------------------------------------------------------------------
# TODO 8: Tool / function calling concept
# ---------------------------------------------------------------------------
# Return a dict describing the "get_weather" tool in OpenAI's function
# calling JSON schema format. Fields:
#   name: "get_weather"
#   description: what the function does
#   parameters: JSON schema with "location" (string, required) and
#               "unit" (string, enum ["celsius", "fahrenheit"], optional)
def define_weather_tool() -> dict:
    """Return the OpenAI function-calling schema for a get_weather tool."""
    pass  # TODO 8


# ---------------------------------------------------------------------------
# TODO 9: Parse a simulated tool call
# ---------------------------------------------------------------------------
# Given a simulated tool call response dict like:
#   {"name": "get_weather", "arguments": '{"location": "Paris", "unit": "celsius"}'}
# Return a tuple (tool_name: str, tool_args: dict).
def parse_tool_call(tool_call: dict) -> tuple[str, dict]:
    """Parse a tool call dict and return (name, arguments_dict)."""
    pass  # TODO 9


# ---------------------------------------------------------------------------
# TODO 10: Execute a mock tool
# ---------------------------------------------------------------------------
# Given `tool_name` and `tool_args`, simulate executing the tool:
#   - "get_weather": return a fake weather string for the location
#   - "search": return a fake search result string
#   - Unknown tool: return an error string
def execute_mock_tool(tool_name: str, tool_args: dict) -> str:
    """Simulate executing a tool and return the result string."""
    pass  # TODO 10


# ---------------------------------------------------------------------------
# TODO 11: Chatbot class
# ---------------------------------------------------------------------------
# Bring it all together: a fully functional chatbot class.
# Methods:
#   chat(user_message)   — send a message, get a reply, update history
#   reset()              — clear history (keep system prompt)
#   get_history()        — return the conversation history
#   summarize_history()  — return a string summary of the conversation
class Chatbot:
    """A simple multi-turn chatbot with conversation memory."""

    def __init__(
        self,
        system_prompt: str,
        max_tokens: int = 3000,
        streaming: bool = False,
    ):
        pass  # TODO 11

    def chat(self, user_message: str) -> str:
        """Send a user message and return the assistant's reply."""
        pass  # TODO 11

    def reset(self) -> None:
        """Clear conversation history, preserving the system prompt."""
        pass  # TODO 11

    def get_history(self) -> list[dict]:
        """Return all messages as a list of dicts."""
        pass  # TODO 11

    def summarize_history(self) -> str:
        """Return a readable summary of the conversation so far."""
        pass  # TODO 11


# ---------------------------------------------------------------------------
# TODO 12: Chatbot evaluation metrics
# ---------------------------------------------------------------------------
# Implement basic chatbot evaluation:
#   response_length_score(response) → float: penalise very short or very long
#       responses; ideal range 50–500 chars returns 1.0, else proportionally less
#   keyword_coverage_score(response, expected_keywords) → float: fraction of
#       expected_keywords present in response (case-insensitive)
#   evaluate_response(response, expected_keywords) → dict with both scores
def response_length_score(response: str) -> float:
    """Score a response based on its length (ideal: 50–500 chars)."""
    pass  # TODO 12


def keyword_coverage_score(response: str, expected_keywords: list[str]) -> float:
    """Return fraction of expected_keywords found in response."""
    pass  # TODO 12


def evaluate_response(response: str, expected_keywords: list[str]) -> dict:
    """Return {'length_score': float, 'keyword_score': float, 'overall': float}."""
    pass  # TODO 12


# ---------------------------------------------------------------------------
# TODO 13: Error handling and fallbacks
# ---------------------------------------------------------------------------
# Implement a robust wrapper around get_response that:
#   1. Retries up to `max_retries` times on failure (with 1s delay between).
#   2. Returns a user-friendly fallback message if all retries fail.
#   3. Logs each failure attempt (print to console).
def robust_get_response(
    messages: list[dict],
    user_message: str = "",
    max_retries: int = 3,
    fallback_message: str = "I'm having trouble responding right now. Please try again.",
) -> str:
    """Retry get_response up to max_retries times; return fallback on failure."""
    pass  # TODO 13


# ---------------------------------------------------------------------------
# TODO 14: CLI chatbot interface
# ---------------------------------------------------------------------------
# Build a terminal-based chat loop:
#   - Print a welcome message with available commands
#   - Loop: read user input → call chatbot.chat() → print response
#   - Commands: "/quit" exits, "/reset" clears history, "/history" shows history
#   - Handle KeyboardInterrupt gracefully (Ctrl+C exits cleanly)
# The function should NOT call input() if `test_inputs` is provided (for testing).
def run_cli_chatbot(
    chatbot: Chatbot,
    test_inputs: Optional[list[str]] = None,
) -> None:
    """Run an interactive (or test-driven) CLI chat loop."""
    pass  # TODO 14


# ---------------------------------------------------------------------------
# TODO 15: Production architecture notes
# ---------------------------------------------------------------------------
# Return a dict describing production chatbot considerations with these keys:
#   "rate_limiting", "caching", "logging", "safety_filters",
#   "multi_user", "persistence", "latency_optimisation"
# Each value: 1-2 sentences.
def production_architecture_notes() -> dict[str, str]:
    """Return a dict of production chatbot architecture considerations."""
    pass  # TODO 15


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("=== Exercise 3.5 — Project: Build a Chatbot ===\n")

    # TODO 1 — Message class
    print("TODO 1 — Message class:")
    msg = Message(role="user", content="Hello, chatbot!")
    print(" ", msg)
    print(" ", msg.to_dict())

    # TODO 2 — ConversationHistory
    print("\nTODO 2 — ConversationHistory:")
    history = ConversationHistory(system_prompt="You are a helpful assistant.")
    if history:
        history.add("user", "What is Python?")
        history.add("assistant", "Python is a high-level programming language.")
        print(f"  Length: {history.length()}")
        print(f"  Token estimate: ~{history.token_estimate()}")

    # TODO 4 — System prompt
    print("\nTODO 4 — System prompt:")
    prompt = coding_assistant_system_prompt()
    print(f"  {prompt[:120]}..." if prompt else "  (not implemented)")

    # TODO 5 — Mock responses
    print("\nTODO 5 — Mock responses:")
    test_msgs = ["Hello!", "I have a Python question.", "I found a bug.", "Help me."]
    for m in test_msgs:
        r = mock_llm_response(m)
        print(f"  User: '{m}' → {r[:60]}..." if r else f"  User: '{m}' → (not implemented)")

    # TODO 6 — Get response (mock)
    print("\nTODO 6 — Get response:")
    r = get_response([{"role": "user", "content": "Hello!"}], "Hello!")
    print(f"  Response: {r[:80]}..." if r else "  (not implemented)")

    # TODO 7 — Streaming
    print("\nTODO 7 — Streaming:")
    stream_response("Hello! I am your coding assistant.", delay=0.005)

    # TODO 8 — Tool definition
    print("\nTODO 8 — Tool definition:")
    tool = define_weather_tool()
    print(f"  {json.dumps(tool, indent=2)[:200]}..." if tool else "  (not implemented)")

    # TODO 9 & 10 — Tool call
    print("\nTODO 9 & 10 — Tool parsing & execution:")
    fake_call = {"name": "get_weather", "arguments": '{"location": "Paris", "unit": "celsius"}'}
    parsed = parse_tool_call(fake_call)
    if parsed:
        name, args = parsed
        result = execute_mock_tool(name, args)
        print(f"  Tool: {name}, args: {args}")
        print(f"  Result: {result}")

    # TODO 11 — Chatbot class
    print("\nTODO 11 — Chatbot:")
    bot = Chatbot(system_prompt=coding_assistant_system_prompt() or "You are helpful.")
    if hasattr(bot, 'chat'):
        r1 = bot.chat("Hello! What can you help me with?")
        print(f"  Bot: {r1[:100]}")
        r2 = bot.chat("How do I read a file in Python?")
        print(f"  Bot: {r2[:100]}")

    # TODO 12 — Evaluation
    print("\nTODO 12 — Evaluation:")
    test_response = "You can read a file in Python using open() with a context manager."
    ev = evaluate_response(test_response, ["file", "python", "open"])
    print(f"  Evaluation: {ev}")

    # TODO 13 — Robust response
    print("\nTODO 13 — Robust get_response:")
    r = robust_get_response([{"role": "user", "content": "test"}], "test", max_retries=2)
    print(f"  Response: {r[:80]}..." if r else "  (not implemented)")

    # TODO 14 — CLI (with test inputs)
    print("\nTODO 14 — CLI chat loop (test mode):")
    test_bot = Chatbot(system_prompt="You are a helpful assistant.")
    if hasattr(test_bot, 'chat'):
        run_cli_chatbot(test_bot, test_inputs=["Hello!", "/history", "/quit"])

    # TODO 15 — Production notes
    print("\nTODO 15 — Production architecture:")
    notes = production_architecture_notes()
    if notes:
        for k, v in notes.items():
            print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
