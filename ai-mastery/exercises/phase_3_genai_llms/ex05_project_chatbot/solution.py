# ============================================================
# Solution 3.5 — Project: Build a Chatbot
# ============================================================
#
# Prerequisites:
#   pip install openai
#   (Optional) export OPENAI_API_KEY="sk-..."
#
# When no API key is present the chatbot falls back to a rule-based mock
# engine so every function is fully demonstrable without any API calls.
# ============================================================

import os
import time
import json
from typing import Optional


# ---------------------------------------------------------------------------
# SOLUTION 1: Message data structure
# ---------------------------------------------------------------------------
class Message:
    """Represents a single conversation message."""

    def __init__(self, role: str, content: str):
        # Validate role to catch mistakes early
        if role not in ("system", "user", "assistant", "tool"):
            raise ValueError(f"Invalid role '{role}'. Must be system/user/assistant/tool.")
        self.role = role
        self.content = content

    def to_dict(self) -> dict:
        """Return {"role": ..., "content": ...} dict (OpenAI API format)."""
        return {"role": self.role, "content": self.content}

    def __repr__(self) -> str:
        short = self.content[:50] + ("..." if len(self.content) > 50 else "")
        return f"Message(role={self.role!r}, content={short!r})"


# ---------------------------------------------------------------------------
# SOLUTION 2: ConversationHistory class
# ---------------------------------------------------------------------------
class ConversationHistory:
    """Manages the ordered list of messages in a conversation."""

    def __init__(self, system_prompt: str):
        # Always store the system prompt as the first message
        self._messages: list[Message] = []
        if system_prompt:
            self._messages.append(Message("system", system_prompt))
        self._system_prompt = system_prompt

    def add(self, role: str, content: str) -> None:
        """Append a new Message to the history."""
        self._messages.append(Message(role, content))

    def get_messages(self) -> list[dict]:
        """Return all messages as a list of dicts (OpenAI API format)."""
        return [m.to_dict() for m in self._messages]

    def clear(self) -> None:
        """Reset history to the system message only."""
        self._messages = []
        if self._system_prompt:
            self._messages.append(Message("system", self._system_prompt))

    def length(self) -> int:
        """Return the number of non-system messages."""
        return sum(1 for m in self._messages if m.role != "system")

    def token_estimate(self) -> int:
        """Return a rough token estimate: total chars / 4."""
        total_chars = sum(len(m.content) for m in self._messages)
        return max(1, total_chars // 4)


# ---------------------------------------------------------------------------
# SOLUTION 3: Context window manager (truncation)
# ---------------------------------------------------------------------------
def truncate_history(
    history: ConversationHistory,
    max_tokens: int = 3000,
) -> list[dict]:
    """Return a token-safe list of messages, dropping oldest turns first."""
    messages = history.get_messages()

    # Always keep the system message (index 0 if present)
    system_msgs = [m for m in messages if m["role"] == "system"]
    non_system = [m for m in messages if m["role"] != "system"]

    # Trim from the front (oldest non-system messages) until within budget
    while non_system:
        current_chars = sum(len(m["content"]) for m in system_msgs + non_system)
        current_tokens = current_chars // 4
        if current_tokens <= max_tokens:
            break
        # Drop the oldest non-system message (index 0)
        non_system.pop(0)

    return system_msgs + non_system


# ---------------------------------------------------------------------------
# SOLUTION 4: System prompt designer
# ---------------------------------------------------------------------------
def coding_assistant_system_prompt() -> str:
    """Return a system prompt for a coding assistant chatbot."""
    return (
        "You are an expert coding assistant with deep knowledge of Python, "
        "JavaScript, and software engineering best practices.\n\n"
        "Your capabilities:\n"
        "  - Explain programming concepts clearly with code examples\n"
        "  - Debug code and identify the root cause of errors\n"
        "  - Suggest best practices, design patterns, and optimisations\n"
        "  - Write clean, well-commented code on request\n\n"
        "Response style:\n"
        "  - Be concise: prefer 2–5 sentences for simple questions\n"
        "  - Use code blocks (``` ... ```) for all code snippets\n"
        "  - If you are not certain, say so clearly rather than guessing\n"
        "  - Prefer practical examples over abstract theory\n\n"
        "If a question is outside programming, politely redirect: "
        "'That's outside my expertise as a coding assistant — I'm best with code questions!'"
    )


# ---------------------------------------------------------------------------
# SOLUTION 5: Mock LLM response
# ---------------------------------------------------------------------------
def mock_llm_response(user_message: str) -> str:
    """Return a rule-based mock response for offline testing."""
    msg = user_message.lower()

    if any(word in msg for word in ("hello", "hi", "hey", "greetings")):
        return (
            "Hello! I'm your coding assistant. I can help with Python, debugging, "
            "code reviews, and software engineering questions. What are you working on?"
        )
    if "python" in msg and ("what is" in msg or "explain" in msg):
        return (
            "Python is a high-level, interpreted programming language known for its "
            "clean syntax and readability. It's widely used for web development, data "
            "science, automation, and AI. Example: `print('Hello, World!')`"
        )
    if any(word in msg for word in ("error", "bug", "exception", "traceback", "crash")):
        return (
            "Debugging tip: read the full traceback from the bottom up — the last line "
            "tells you the exception type and message, and the lines above show the call "
            "stack. Add `print()` statements or use `pdb.set_trace()` to inspect state "
            "at the point of failure."
        )
    if "help" in msg or "what can you" in msg or "capabilities" in msg:
        return (
            "I can help you with:\n"
            "  - Explaining Python, JavaScript, and other languages\n"
            "  - Debugging errors and tracebacks\n"
            "  - Writing and reviewing code\n"
            "  - Explaining algorithms and data structures\n"
            "  - Best practices and design patterns\n"
            "Just ask me anything code-related!"
        )
    if any(word in msg for word in ("file", "read", "write", "open")):
        return (
            "To read a file in Python:\n"
            "```python\n"
            "with open('filename.txt', 'r') as f:\n"
            "    content = f.read()\n"
            "```\n"
            "The `with` block ensures the file is closed automatically, even if an "
            "exception occurs."
        )
    if any(word in msg for word in ("list", "dict", "tuple", "set")):
        return (
            "Python has four main built-in collection types:\n"
            "  - `list` — ordered, mutable, allows duplicates: [1, 2, 3]\n"
            "  - `dict` — key-value pairs, ordered (Python 3.7+): {'a': 1}\n"
            "  - `tuple` — ordered, immutable: (1, 2, 3)\n"
            "  - `set` — unordered, unique values: {1, 2, 3}"
        )
    # Generic fallback
    return (
        "That's an interesting question! While I'm running in offline mock mode "
        "(no API key set), I can still discuss Python, debugging, and coding concepts. "
        f"You asked about: '{user_message[:60]}'. Try asking about Python basics, "
        "file I/O, or debugging tips!"
    )


# ---------------------------------------------------------------------------
# SOLUTION 6: Get LLM response (real or mock)
# ---------------------------------------------------------------------------
def get_response(messages: list[dict], user_message: str = "") -> str:
    """Call the LLM (or mock) and return the assistant's reply string."""
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        # Fall back to mock mode — no API key available
        return mock_llm_response(user_message)

    try:
        from openai import OpenAI, RateLimitError, APIError
        client = OpenAI(api_key=api_key)
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.7,
            max_tokens=500,
        )
        return completion.choices[0].message.content
    except Exception as exc:
        # Specific handling shown; re-raise after logging so robust_get_response
        # can decide whether to retry.
        print(f"[get_response error] {type(exc).__name__}: {exc}")
        raise


# ---------------------------------------------------------------------------
# SOLUTION 7: Streaming response simulation
# ---------------------------------------------------------------------------
def stream_response(text: str, delay: float = 0.02) -> None:
    """Print `text` character-by-character to simulate streaming."""
    # Real streaming: set stream=True in the API call and iterate over chunks:
    #   for chunk in client.chat.completions.create(..., stream=True):
    #       delta = chunk.choices[0].delta.content
    #       if delta: print(delta, end="", flush=True)
    import sys
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(delay)
    print()  # final newline


# ---------------------------------------------------------------------------
# SOLUTION 8: Tool / function calling concept
# ---------------------------------------------------------------------------
def define_weather_tool() -> dict:
    """Return the OpenAI function-calling schema for a get_weather tool."""
    # OpenAI function calling JSON schema: the model uses this to decide
    # WHEN and HOW to call your function.
    return {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": (
                "Get the current weather for a specific location. "
                "Use this when the user asks about weather conditions."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and country, e.g. 'Paris, France' or 'New York, USA'.",
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "Temperature unit. Defaults to celsius.",
                    },
                },
                "required": ["location"],
            },
        },
    }


# ---------------------------------------------------------------------------
# SOLUTION 9: Parse a simulated tool call
# ---------------------------------------------------------------------------
def parse_tool_call(tool_call: dict) -> tuple[str, dict]:
    """Parse a tool call dict and return (name, arguments_dict)."""
    # In the real OpenAI API, tool_call is a ChoiceDeltaToolCall object.
    # Here we handle the simulated dict format.
    name = tool_call["name"]
    # arguments is a JSON string in the API; parse it to a dict
    args_raw = tool_call.get("arguments", "{}")
    args = json.loads(args_raw) if isinstance(args_raw, str) else args_raw
    return name, args


# ---------------------------------------------------------------------------
# SOLUTION 10: Execute a mock tool
# ---------------------------------------------------------------------------
def execute_mock_tool(tool_name: str, tool_args: dict) -> str:
    """Simulate executing a tool and return the result string."""
    if tool_name == "get_weather":
        location = tool_args.get("location", "Unknown")
        unit = tool_args.get("unit", "celsius")
        temp = 22 if unit == "celsius" else 72
        symbol = "°C" if unit == "celsius" else "°F"
        return (
            f"Current weather in {location}: Partly cloudy, {temp}{symbol}. "
            f"Humidity: 65%. Wind: 15 km/h from the west."
        )
    if tool_name == "search":
        query = tool_args.get("query", "")
        return f"[MOCK search result for '{query}'] Top result: Wikipedia article about {query}."
    return f"[Error] Unknown tool: '{tool_name}'. Available tools: get_weather, search."


# ---------------------------------------------------------------------------
# SOLUTION 11: Chatbot class
# ---------------------------------------------------------------------------
class Chatbot:
    """A simple multi-turn chatbot with conversation memory."""

    def __init__(
        self,
        system_prompt: str,
        max_tokens: int = 3000,
        streaming: bool = False,
    ):
        self.system_prompt = system_prompt
        self.max_tokens = max_tokens
        self.streaming = streaming
        self.history = ConversationHistory(system_prompt)
        self._turn_count = 0

    def chat(self, user_message: str) -> str:
        """Send a user message and return the assistant's reply."""
        # 1. Add user message to history
        self.history.add("user", user_message)
        self._turn_count += 1

        # 2. Truncate history if approaching context limit
        safe_messages = truncate_history(self.history, self.max_tokens)

        # 3. Get response from LLM (or mock)
        reply = get_response(safe_messages, user_message)

        # 4. Add assistant reply to history
        self.history.add("assistant", reply)

        # 5. Optionally stream the output
        if self.streaming:
            stream_response(reply, delay=0.01)
        return reply

    def reset(self) -> None:
        """Clear conversation history, preserving the system prompt."""
        self.history.clear()
        self._turn_count = 0

    def get_history(self) -> list[dict]:
        """Return all messages as a list of dicts."""
        return self.history.get_messages()

    def summarize_history(self) -> str:
        """Return a readable summary of the conversation so far."""
        messages = self.history.get_messages()
        if not messages:
            return "(No conversation yet)"
        lines = [f"Conversation ({self._turn_count} turns, "
                 f"~{self.history.token_estimate()} tokens estimated):"]
        for msg in messages:
            role = msg["role"].upper().ljust(10)
            content_preview = msg["content"][:80].replace("\n", " ")
            suffix = "..." if len(msg["content"]) > 80 else ""
            lines.append(f"  {role}: {content_preview}{suffix}")
        return "\n".join(lines)


# ---------------------------------------------------------------------------
# SOLUTION 12: Chatbot evaluation metrics
# ---------------------------------------------------------------------------
def response_length_score(response: str) -> float:
    """Score a response based on its length (ideal: 50–500 chars)."""
    n = len(response)
    if n == 0:
        return 0.0
    if 50 <= n <= 500:
        return 1.0
    if n < 50:
        # Too short: linearly scale 0.0 (empty) → 1.0 (50 chars)
        return n / 50
    # Too long: linearly decay 1.0 (500 chars) → 0.0 (2000+ chars)
    return max(0.0, 1.0 - (n - 500) / 1500)


def keyword_coverage_score(response: str, expected_keywords: list[str]) -> float:
    """Return fraction of expected_keywords found in response."""
    if not expected_keywords:
        return 1.0  # vacuously true
    response_lower = response.lower()
    hits = sum(1 for kw in expected_keywords if kw.lower() in response_lower)
    return hits / len(expected_keywords)


def evaluate_response(response: str, expected_keywords: list[str]) -> dict:
    """Return {'length_score': float, 'keyword_score': float, 'overall': float}."""
    length_score = response_length_score(response)
    keyword_score = keyword_coverage_score(response, expected_keywords)
    # Overall: equal weighted average of both dimensions
    overall = (length_score + keyword_score) / 2
    return {
        "length_score": round(length_score, 3),
        "keyword_score": round(keyword_score, 3),
        "overall": round(overall, 3),
    }


# ---------------------------------------------------------------------------
# SOLUTION 13: Error handling and fallbacks
# ---------------------------------------------------------------------------
def robust_get_response(
    messages: list[dict],
    user_message: str = "",
    max_retries: int = 3,
    fallback_message: str = "I'm having trouble responding right now. Please try again.",
) -> str:
    """Retry get_response up to max_retries times; return fallback on failure."""
    for attempt in range(1, max_retries + 1):
        try:
            return get_response(messages, user_message)
        except Exception as exc:
            print(f"  [Attempt {attempt}/{max_retries}] Error: {type(exc).__name__}: {exc}")
            if attempt < max_retries:
                time.sleep(1.0)  # brief pause before retry
    print(f"  [robust_get_response] All {max_retries} attempts failed. Returning fallback.")
    return fallback_message


# ---------------------------------------------------------------------------
# SOLUTION 14: CLI chatbot interface
# ---------------------------------------------------------------------------
def run_cli_chatbot(
    chatbot: Chatbot,
    test_inputs: Optional[list[str]] = None,
) -> None:
    """Run an interactive (or test-driven) CLI chat loop."""
    COMMANDS = {
        "/quit":    "Exit the chatbot",
        "/reset":   "Clear conversation history",
        "/history": "Show conversation history",
        "/help":    "Show this help message",
    }

    def show_help():
        print("\n  Available commands:")
        for cmd, desc in COMMANDS.items():
            print(f"    {cmd:<12} — {desc}")
        print()

    print("\n" + "=" * 60)
    print("  Coding Assistant Chatbot")
    print("  (Running in MOCK mode — set OPENAI_API_KEY for real AI)")
    print("=" * 60)
    show_help()

    input_source = iter(test_inputs) if test_inputs is not None else None

    while True:
        try:
            if input_source is not None:
                try:
                    user_input = next(input_source)
                    print(f"You: {user_input}")
                except StopIteration:
                    break
            else:
                user_input = input("You: ").strip()  # pragma: no cover

            if not user_input:
                continue

            # Handle commands
            if user_input == "/quit":
                print("Goodbye! Happy coding!")
                break
            elif user_input == "/reset":
                chatbot.reset()
                print("  [Conversation history cleared]\n")
                continue
            elif user_input == "/history":
                print(chatbot.summarize_history())
                print()
                continue
            elif user_input == "/help":
                show_help()
                continue

            # Regular message
            reply = chatbot.chat(user_input)
            print(f"\nAssistant: {reply}\n")

        except KeyboardInterrupt:
            print("\n\n  [Interrupted] Goodbye!")
            break
        except Exception as exc:
            print(f"  [Error] {exc}. Type /quit to exit.\n")


# ---------------------------------------------------------------------------
# SOLUTION 15: Production architecture notes
# ---------------------------------------------------------------------------
def production_architecture_notes() -> dict[str, str]:
    """Return a dict of production chatbot architecture considerations."""
    return {
        "rate_limiting": (
            "Enforce per-user and per-IP request quotas to prevent abuse and "
            "control API costs; use a token bucket or leaky bucket algorithm, "
            "or a managed service like AWS API Gateway."
        ),
        "caching": (
            "Cache responses for identical or semantically similar queries using "
            "a semantic cache (e.g. GPTCache) to dramatically reduce latency and "
            "API spend for frequently asked questions."
        ),
        "logging": (
            "Log every request/response pair with timestamps, user IDs, token counts, "
            "and latency to enable debugging, cost auditing, and model evaluation; "
            "use structured JSON logs shipped to a centralised store (e.g. Datadog)."
        ),
        "safety_filters": (
            "Apply input and output moderation layers — either OpenAI's Moderation API "
            "or a custom classifier — to detect harmful content, prompt injection attempts, "
            "and PII before displaying responses to users."
        ),
        "multi_user": (
            "Store conversation histories in a database (e.g. Redis for speed, Postgres "
            "for persistence) keyed by session ID so that each user maintains independent "
            "context and server restarts don't lose history."
        ),
        "persistence": (
            "Persist conversations to a durable store (database or object storage) so "
            "users can resume sessions across devices; consider data retention policies "
            "and GDPR/CCPA deletion requirements."
        ),
        "latency_optimisation": (
            "Stream responses token-by-token to reduce perceived latency; run retrieval "
            "steps asynchronously; use smaller/faster models for intent classification "
            "and reserve large models only for generation."
        ),
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("=== Solution 3.5 — Project: Build a Chatbot ===\n")

    # --- 1. Message class ---
    print("--- 1. Message Class ---")
    msg = Message(role="user", content="Hello, chatbot!")
    print(f"  repr: {msg}")
    print(f"  dict: {msg.to_dict()}")
    print()

    # --- 2. ConversationHistory ---
    print("--- 2. ConversationHistory ---")
    history = ConversationHistory(system_prompt="You are a helpful assistant.")
    history.add("user", "What is Python?")
    history.add("assistant", "Python is a high-level programming language.")
    history.add("user", "Show me a Hello World example.")
    print(f"  Length (non-system): {history.length()}")
    print(f"  Token estimate: ~{history.token_estimate()}")
    for m in history.get_messages():
        print(f"  [{m['role'].upper()}] {m['content'][:60]}")
    print()

    # --- 3. Truncation ---
    print("--- 3. Context Window Truncation ---")
    long_history = ConversationHistory("You are a helpful assistant.")
    for i in range(20):
        long_history.add("user" if i % 2 == 0 else "assistant", f"Message {i}: " + "x" * 100)
    before = len(long_history.get_messages())
    truncated = truncate_history(long_history, max_tokens=500)
    print(f"  Before: {before} messages -> After truncation: {len(truncated)} messages")
    print()

    # --- 4. System prompt ---
    print("--- 4. System Prompt ---")
    sp = coding_assistant_system_prompt()
    print(f"  Length: {len(sp)} chars")
    print(f"  Preview: {sp[:120]}...")
    print()

    # --- 5. Mock responses ---
    print("--- 5. Mock Responses ---")
    test_messages = [
        "Hello there!",
        "What is Python?",
        "I found a bug in my code.",
        "Help me with Python lists.",
        "How do I read a file?",
        "Something unrelated.",
    ]
    for m in test_messages:
        r = mock_llm_response(m)
        print(f"  User: '{m[:40]}'")
        print(f"  Bot:  {r[:80]}...")
        print()

    # --- 6. Get response ---
    print("--- 6. Get Response (mock mode) ---")
    api_mode = "REAL API" if os.getenv("OPENAI_API_KEY") else "MOCK"
    print(f"  Mode: {api_mode}")
    r = get_response([{"role": "user", "content": "Hello!"}], "Hello!")
    print(f"  Response: {r[:100]}...")
    print()

    # --- 7. Streaming ---
    print("--- 7. Streaming Response ---")
    print("  Streaming: ", end="")
    stream_response("Hello! I am your coding assistant.", delay=0.005)
    print()

    # --- 8. Tool definition ---
    print("--- 8. Tool Definition ---")
    tool = define_weather_tool()
    print(f"  Tool name: {tool['function']['name']}")
    print(f"  Description: {tool['function']['description'][:70]}...")
    params = tool["function"]["parameters"]["properties"]
    print(f"  Parameters: {list(params.keys())}")
    print()

    # --- 9 & 10. Tool call ---
    print("--- 9 & 10. Tool Parsing & Execution ---")
    fake_call = {"name": "get_weather", "arguments": '{"location": "Tokyo, Japan", "unit": "celsius"}'}
    name, args = parse_tool_call(fake_call)
    result = execute_mock_tool(name, args)
    print(f"  Tool: {name}")
    print(f"  Args: {args}")
    print(f"  Result: {result}")
    print()

    # --- 11. Chatbot class ---
    print("--- 11. Chatbot Class ---")
    bot = Chatbot(
        system_prompt=coding_assistant_system_prompt(),
        max_tokens=3000,
        streaming=False,
    )
    exchanges = [
        "Hello! What can you help me with?",
        "How do I read a CSV file in Python?",
        "What about writing to a file?",
    ]
    for user_msg in exchanges:
        reply = bot.chat(user_msg)
        print(f"  You: {user_msg}")
        print(f"  Bot: {reply[:120]}...")
        print()

    print("  Summary:")
    print(bot.summarize_history())
    print()

    # --- 12. Evaluation ---
    print("--- 12. Chatbot Evaluation ---")
    test_cases = [
        ("Hi", [], "too short"),
        ("You can read a file in Python using open() with a context manager.", ["file", "python", "open"], "good"),
        ("x" * 600, ["python"], "too long"),
        ("", ["python"], "empty"),
    ]
    for response, keywords, label in test_cases:
        ev = evaluate_response(response, keywords)
        print(f"  [{label}] len={len(response):4d} chars -> {ev}")
    print()

    # --- 13. Robust response ---
    print("--- 13. Robust get_response ---")
    r = robust_get_response(
        [{"role": "user", "content": "Hello!"}],
        user_message="Hello!",
        max_retries=2,
    )
    print(f"  Result: {r[:100]}...")
    print()

    # --- 14. CLI (test mode) ---
    print("--- 14. CLI Chatbot (test mode) ---")
    cli_bot = Chatbot(system_prompt=coding_assistant_system_prompt())
    run_cli_chatbot(
        cli_bot,
        test_inputs=[
            "Hello, what can you do?",
            "I have a Python bug to fix.",
            "/history",
            "/reset",
            "/quit",
        ],
    )
    print()

    # --- 15. Production notes ---
    print("--- 15. Production Architecture ---")
    notes = production_architecture_notes()
    for key, note in notes.items():
        print(f"  {key}:\n    {note}\n")


if __name__ == "__main__":
    main()
