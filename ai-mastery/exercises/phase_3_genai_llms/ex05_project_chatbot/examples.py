# ============================================================
# Examples 3.5 - Chatbot Project (50 examples)
# BASIC (1-13) | INTERMEDIATE (14-26) | NESTED (27-38) | ADVANCED (39-50)
# ============================================================

import sys
import io
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
else:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

import json
import re
import difflib

# --- BASIC (1-13) -------------------------------------------

def ex01():
    """Echo chatbot: return the same message"""
    def echo_bot(message):
        return message
    tests = ["Hello!", "What is 2+2?", "Tell me a joke."]
    print("Ex01 — Echo Chatbot:")
    for msg in tests:
        print(f"  User: {msg!r} → Bot: {echo_bot(msg)!r}")

def ex02():
    """Keyword-based response using if/elif"""
    def keyword_bot(message):
        msg = message.lower()
        if "hello" in msg or "hi" in msg:
            return "Hello there! How can I help you?"
        elif "bye" in msg or "goodbye" in msg:
            return "Goodbye! Have a great day!"
        elif "help" in msg:
            return "I can answer questions about AI, ML, and Python."
        elif "name" in msg:
            return "I'm ChatBot v1.0."
        else:
            return "I'm not sure I understand. Can you rephrase?"
    tests = ["Hello there!", "What is your name?", "I need help.", "Random text."]
    print("Ex02 — Keyword Bot:")
    for msg in tests:
        print(f"  '{msg}' → '{keyword_bot(msg)}'")

def ex03():
    """Greeting detector"""
    GREETINGS = {"hello", "hi", "hey", "howdy", "greetings", "good morning",
                 "good afternoon", "good evening", "what's up", "yo"}
    def is_greeting(text):
        text_lower = text.lower().strip().rstrip("!.,?")
        return any(g in text_lower for g in GREETINGS)
    tests = ["Hello!", "Good morning!", "What time is it?", "Hey there", "How are you?"]
    print("Ex03 — Greeting Detector:")
    for t in tests:
        print(f"  '{t}' → greeting={is_greeting(t)}")

def ex04():
    """Farewell detector"""
    FAREWELLS = {"bye", "goodbye", "farewell", "see you", "later", "take care",
                 "good night", "ttyl", "ciao", "adios", "catch you later"}
    def is_farewell(text):
        text_lower = text.lower()
        return any(f in text_lower for f in FAREWELLS)
    tests = ["Goodbye!", "See you later!", "Hello again.", "Take care!", "Thanks bye."]
    print("Ex04 — Farewell Detector:")
    for t in tests:
        print(f"  '{t}' → farewell={is_farewell(t)}")

def ex05():
    """Message history as a list of dicts"""
    history = [
        {"role": "user", "content": "Hi, what can you do?"},
        {"role": "assistant", "content": "I can help with AI questions!"},
        {"role": "user", "content": "Tell me about machine learning."},
    ]
    print("Ex05 — Message History (list of dicts):")
    for msg in history:
        print(f"  [{msg['role'].upper():9}] {msg['content']}")
    print(f"  Total messages: {len(history)}")

def ex06():
    """Add message to conversation history"""
    def add_message(history, role, content):
        history.append({"role": role, "content": content, "id": len(history)})
        return history
    history = []
    history = add_message(history, "user", "What is deep learning?")
    history = add_message(history, "assistant", "Deep learning uses neural networks.")
    history = add_message(history, "user", "Give me an example.")
    print("Ex06 — Add Message to History:")
    for msg in history:
        print(f"  [{msg['id']}] {msg['role']}: {msg['content']}")

def ex07():
    """Format conversation history for display"""
    def format_conversation(history):
        lines = []
        emoji_map = {"user": "You", "assistant": "Bot", "system": "Sys"}
        for msg in history:
            label = emoji_map.get(msg["role"], msg["role"].upper())
            lines.append(f"{label}: {msg['content']}")
        return "\n".join(lines)
    history = [
        {"role": "user", "content": "What is AI?"},
        {"role": "assistant", "content": "AI is artificial intelligence."},
        {"role": "user", "content": "And ML?"},
        {"role": "assistant", "content": "ML is machine learning, a subset of AI."},
    ]
    print("Ex07 — Formatted Conversation:")
    print(format_conversation(history))

def ex08():
    """Clear conversation history"""
    def clear_history(history):
        history.clear()
        return history
    history = [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi!"},
    ]
    print(f"Ex08 — Clear History: before={len(history)} messages")
    history = clear_history(history)
    print(f"  After clear: {len(history)} messages, is_empty={len(history)==0}")

def ex09():
    """Save conversation history to JSON string"""
    def save_history(history):
        return json.dumps(history, indent=2)
    history = [
        {"role": "user", "content": "Hello!"},
        {"role": "assistant", "content": "Hi, how can I help?"},
    ]
    json_str = save_history(history)
    print("Ex09 — Save History to JSON:")
    print(json_str[:120] + "...")
    print(f"  JSON length: {len(json_str)} chars")

def ex10():
    """Load conversation history from JSON string"""
    def load_history(json_str):
        data = json.loads(json_str)
        if not isinstance(data, list):
            raise ValueError("History must be a JSON array")
        return data
    json_str = '[{"role": "user", "content": "Hi!"}, {"role": "assistant", "content": "Hello!"}]'
    history = load_history(json_str)
    print(f"Ex10 — Load History from JSON: {len(history)} messages loaded")
    for msg in history:
        print(f"  {msg['role']}: {msg['content']}")

def ex11():
    """Chatbot state dict"""
    def create_chatbot_state(user_id):
        return {
            "user_id": user_id,
            "history": [],
            "session_turns": 0,
            "current_intent": None,
            "context": {},
            "is_active": True,
        }
    state = create_chatbot_state("user_42")
    state["history"].append({"role": "user", "content": "Hello"})
    state["session_turns"] += 1
    state["current_intent"] = "greeting"
    print("Ex11 — Chatbot State Dict:")
    for k, v in state.items():
        print(f"  {k}: {v}")

def ex12():
    """Help command handler"""
    HELP_TEXT = """
Available commands:
  /help       - Show this help message
  /clear      - Clear conversation history
  /history    - Show conversation history
  /quit       - Exit the chatbot
  /status     - Show chatbot status

Or just type any message to chat!
    """.strip()
    def handle_help(command):
        if command.strip() == "/help":
            return HELP_TEXT
        return None
    print("Ex12 — Help Command Handler:")
    result = handle_help("/help")
    print(result)
    print(f"  Non-command returns: {handle_help('hello')!r}")

def ex13():
    """Unknown intent handler with suggestions"""
    def handle_unknown(user_input, known_topics=None):
        known_topics = known_topics or ["AI", "machine learning", "Python", "data science"]
        matches = difflib.get_close_matches(
            user_input.lower(), [t.lower() for t in known_topics], n=2, cutoff=0.4
        )
        if matches:
            return f"I'm not sure about that. Did you mean: {', '.join(matches)}?"
        return ("I didn't understand that. Type /help for available topics, "
                "or try asking about AI, Python, or machine learning.")
    tests = ["machne learning", "pytohn", "quantum physics"]
    print("Ex13 — Unknown Intent Handler:")
    for t in tests:
        print(f"  '{t}' → '{handle_unknown(t)}'")

# --- INTERMEDIATE (14-26) ----------------------------------

def ex14():
    """Intent classifier using keyword-to-intent mapping"""
    INTENT_MAP = {
        "greeting":    ["hello", "hi", "hey", "good morning", "howdy"],
        "farewell":    ["bye", "goodbye", "see you", "later", "take care"],
        "question_ai": ["what is ai", "explain ai", "artificial intelligence", "machine learning"],
        "question_py": ["python", "code", "programming", "syntax", "function"],
        "help":        ["help", "assist", "support", "how do i", "can you"],
        "thanks":      ["thank", "thanks", "appreciate", "great", "awesome"],
    }
    def classify_intent(text):
        text_lower = text.lower()
        scores = {intent: sum(1 for kw in kws if kw in text_lower)
                  for intent, kws in INTENT_MAP.items()}
        best = max(scores, key=scores.get)
        return best if scores[best] > 0 else "unknown"
    tests = ["Hello there!", "What is machine learning?",
             "Can you help me with Python?", "Goodbye!", "Random text 123"]
    print("Ex14 — Intent Classifier:")
    for t in tests:
        print(f"  '{t}' → intent='{classify_intent(t)}'")

def ex15():
    """Slot filling: extract name, date, and number from text"""
    def extract_slots(text):
        slots = {}
        name_match = re.search(r"\b(?:my name is|i am|i'm|call me)\s+([A-Z][a-z]+)", text, re.I)
        if name_match:
            slots["name"] = name_match.group(1)
        date_match = re.search(r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\w+ \d{1,2},?\s*\d{4})\b", text)
        if date_match:
            slots["date"] = date_match.group(1)
        num_match = re.findall(r"\b\d+\b", text)
        if num_match:
            slots["numbers"] = [int(n) for n in num_match]
        return slots
    tests = [
        "My name is Alice and I need help on 12/25/2024.",
        "I'm Bob. Remind me on March 15, 2025 about the meeting at 3.",
        "Can I book a table for 4 people?",
    ]
    print("Ex15 — Slot Filling:")
    for t in tests:
        slots = extract_slots(t)
        print(f"  '{t[:50]}...' → {slots}")

def ex16():
    """Context-aware response using last assistant message"""
    def context_aware_response(user_input, history):
        if not history:
            return "Hello! What would you like to know?"
        last_bot = next(
            (m["content"] for m in reversed(history) if m["role"] == "assistant"),
            None
        )
        if last_bot and "machine learning" in last_bot.lower():
            if "example" in user_input.lower() or "more" in user_input.lower():
                return "Sure! An example of ML: spam detection uses labeled email data."
        if "yes" in user_input.lower() or "correct" in user_input.lower():
            return "Great! What else would you like to know?"
        return "Interesting! Tell me more."
    history = [
        {"role": "user", "content": "What is ML?"},
        {"role": "assistant", "content": "Machine learning is a subset of AI."},
    ]
    tests = ["Can you give an example?", "Yes, that's right!", "Something else entirely."]
    print("Ex16 — Context-Aware Response:")
    for t in tests:
        print(f"  '{t}' → '{context_aware_response(t, history)}'")

def ex17():
    """Conversation summarizer: truncate to last N turns"""
    def summarize_history(history, max_turns=3):
        turns = []
        i = len(history) - 1
        count = 0
        while i >= 0 and count < max_turns:
            if history[i]["role"] == "assistant":
                if i > 0 and history[i-1]["role"] == "user":
                    turns.insert(0, history[i])
                    turns.insert(0, history[i-1])
                    count += 1
                    i -= 2
                else:
                    i -= 1
            else:
                i -= 1
        return turns
    history = [
        {"role": "user", "content": "Turn 1 user"},
        {"role": "assistant", "content": "Turn 1 bot"},
        {"role": "user", "content": "Turn 2 user"},
        {"role": "assistant", "content": "Turn 2 bot"},
        {"role": "user", "content": "Turn 3 user"},
        {"role": "assistant", "content": "Turn 3 bot"},
        {"role": "user", "content": "Turn 4 user (latest)"},
        {"role": "assistant", "content": "Turn 4 bot (latest)"},
    ]
    trimmed = summarize_history(history, max_turns=2)
    print(f"Ex17 — Summarize History: {len(history)} → {len(trimmed)} messages (last 2 turns)")
    for m in trimmed:
        print(f"  {m['role']}: {m['content']}")

def ex18():
    """Topic tracker: detect topic from keywords"""
    TOPICS = {
        "machine_learning": ["machine learning", "ml", "model", "training", "dataset"],
        "deep_learning":    ["deep learning", "neural network", "backprop", "layer", "cnn", "rnn"],
        "nlp":              ["nlp", "text", "language", "tokenize", "embedding", "bert"],
        "python":           ["python", "code", "function", "class", "import", "pip"],
        "general_ai":       ["ai", "artificial intelligence", "agent", "intelligence"],
    }
    def track_topic(text):
        text_lower = text.lower()
        scores = {topic: sum(1 for kw in kws if kw in text_lower)
                  for topic, kws in TOPICS.items()}
        best = max(scores, key=scores.get)
        return best if scores[best] > 0 else "unknown"
    tests = ["How does backpropagation work in neural networks?",
             "What Python library is best for NLP?",
             "Explain the transformer architecture."]
    print("Ex18 — Topic Tracker:")
    for t in tests:
        print(f"  '{t[:50]}' → topic='{track_topic(t)}'")

def ex19():
    """Sentiment-aware response (positive/negative/neutral detection)"""
    POS_WORDS = {"great", "awesome", "good", "excellent", "love", "like", "fantastic",
                 "amazing", "helpful", "thanks", "perfect", "nice", "wonderful"}
    NEG_WORDS = {"bad", "terrible", "awful", "hate", "worst", "useless", "broken",
                 "wrong", "frustrated", "annoying", "disappointed", "horrible"}
    def detect_sentiment(text):
        words = set(text.lower().split())
        pos = len(words & POS_WORDS)
        neg = len(words & NEG_WORDS)
        if pos > neg: return "positive"
        if neg > pos: return "negative"
        return "neutral"
    def sentiment_response(text):
        sentiment = detect_sentiment(text)
        responses = {
            "positive": "I'm glad you're happy! Anything else I can help with?",
            "negative": "I'm sorry to hear that. Let me know how I can improve.",
            "neutral":  "Got it! How can I assist you further?",
        }
        return sentiment, responses[sentiment]
    tests = ["This is awesome, thanks!", "This is terrible and broken.", "Okay, I see."]
    print("Ex19 — Sentiment-Aware Response:")
    for t in tests:
        sentiment, response = sentiment_response(t)
        print(f"  '{t}' → [{sentiment}] '{response}'")

def ex20():
    """Multi-turn context window: keep only last 5 messages"""
    def get_context_window(history, window_size=5):
        return history[-window_size:]
    history = [{"role": "user" if i % 2 == 0 else "assistant",
                "content": f"Message {i+1}"}
               for i in range(10)]
    window = get_context_window(history, window_size=5)
    print(f"Ex20 — Context Window (size=5): {len(history)} total → {len(window)} in window")
    for m in window:
        print(f"  {m['role']}: {m['content']}")

def ex21():
    """Chatbot with knowledge base (dict lookup)"""
    KB = {
        "what is ai":          "AI is the simulation of human intelligence by machines.",
        "what is ml":          "ML is a subset of AI where models learn from data.",
        "what is deep learning":"Deep learning uses multi-layer neural networks.",
        "what is nlp":         "NLP enables computers to understand human language.",
        "what is python":      "Python is a versatile high-level programming language.",
        "what is a transformer":"A transformer is a neural network using self-attention.",
    }
    def kb_lookup(question):
        key = question.lower().strip().rstrip("?.")
        return KB.get(key, "I don't have information about that.")
    tests = ["What is AI?", "What is ML?", "What is blockchain?"]
    print("Ex21 — Knowledge Base Lookup:")
    for t in tests:
        print(f"  Q: '{t}' → A: '{kb_lookup(t)}'")

def ex22():
    """Fuzzy matching intent using difflib"""
    INTENTS = ["greeting", "farewell", "help", "question about ai",
               "question about python", "question about machine learning",
               "complaint", "feedback", "schedule meeting"]
    def fuzzy_classify(user_input, cutoff=0.4):
        matches = difflib.get_close_matches(
            user_input.lower(), INTENTS, n=3, cutoff=cutoff
        )
        return matches[0] if matches else "unknown"
    tests = ["greetin", "bye bye", "helpp", "machne lerning", "shedule a meetting"]
    print("Ex22 — Fuzzy Intent Matching:")
    for t in tests:
        print(f"  '{t}' → '{fuzzy_classify(t)}'")

def ex23():
    """Confidence-based fallback"""
    import random
    def classify_with_confidence(text):
        random.seed(hash(text) % (2**16))
        conf = random.uniform(0.2, 1.0)
        intent = "question_ai" if "ai" in text.lower() else "unknown"
        return intent, round(conf, 3)
    def confident_response(text, threshold=0.6):
        intent, confidence = classify_with_confidence(text)
        if confidence >= threshold:
            return f"[conf={confidence}] Responding to intent: {intent}"
        else:
            return f"[conf={confidence}] Low confidence — could you rephrase?"
    tests = ["What is AI?", "Tell me about xyz", "How does deep learning work?"]
    print("Ex23 — Confidence-Based Fallback (threshold=0.6):")
    for t in tests:
        print(f"  '{t}' → '{confident_response(t)}'")

def ex24():
    """Confirmation dialog flow"""
    class ConfirmationFlow:
        def __init__(self):
            self.pending_action = None
        def request_confirm(self, action):
            self.pending_action = action
            return f"Are you sure you want to {action}? (yes/no)"
        def handle_response(self, user_input):
            if self.pending_action is None:
                return "No pending action."
            if user_input.lower() in ["yes", "y", "sure", "confirm"]:
                action = self.pending_action
                self.pending_action = None
                return f"Done! {action} completed."
            else:
                self.pending_action = None
                return "Action cancelled."
    flow = ConfirmationFlow()
    print("Ex24 — Confirmation Dialog Flow:")
    print(f"  Bot: {flow.request_confirm('delete all data')}")
    print(f"  User: 'yes'")
    print(f"  Bot: {flow.handle_response('yes')}")
    flow2 = ConfirmationFlow()
    print(f"  Bot: {flow2.request_confirm('reset settings')}")
    print(f"  User: 'no'")
    print(f"  Bot: {flow2.handle_response('no')}")

def ex25():
    """Retry handler: ask again if response is unclear"""
    def retry_handler(user_input, attempt=1, max_attempts=3):
        UNCLEAR = {"maybe", "i don't know", "not sure", "idk", "perhaps", ""}
        if user_input.lower().strip() in UNCLEAR:
            if attempt < max_attempts:
                return False, f"I didn't catch that (attempt {attempt}/{max_attempts}). Could you be more specific?"
            else:
                return True, "I'll move on. Feel free to ask again later."
        return True, f"Got it: '{user_input}'"
    exchanges = [("maybe", 1), ("", 2), ("Yes, I want to book a meeting.", 3)]
    print("Ex25 — Retry Handler:")
    for user_input, attempt in exchanges:
        done, response = retry_handler(user_input, attempt)
        print(f"  [attempt {attempt}] '{user_input}' → done={done}: '{response}'")

def ex26():
    """Chatbot response templating with f-strings"""
    TEMPLATES = {
        "greeting":    "Hello, {name}! Welcome to the AI assistant. How can I help you today?",
        "farewell":    "Goodbye, {name}! It was great chatting. Come back anytime!",
        "clarify":     "Just to confirm — you're asking about {topic}, right?",
        "error":       "Sorry, I encountered an error: {error}. Please try again.",
        "result":      "Here are {count} results for '{query}':",
        "no_result":   "I couldn't find any information about '{query}'.",
    }
    def render(template_key, **kwargs):
        template = TEMPLATES.get(template_key, "Unknown template: {template_key}")
        try:
            return template.format(**kwargs)
        except KeyError as e:
            return f"Template error: missing key {e}"
    print("Ex26 — Response Templating:")
    print(f"  {render('greeting', name='Alice')}")
    print(f"  {render('clarify', topic='machine learning')}")
    print(f"  {render('result', count=5, query='neural networks')}")
    print(f"  {render('no_result', query='blockchain AI fusion')}")

# --- NESTED (27-38) ----------------------------------------

def ex27():
    """Full RuleBasedChatbot class"""
    class RuleBasedChatbot:
        RULES = [
            (r"hello|hi|hey",                     "Hello! How can I help you?"),
            (r"bye|goodbye|exit",                  "Goodbye! Have a great day!"),
            (r"what is (ai|artificial intelligence)","AI is the simulation of human intelligence."),
            (r"what is (ml|machine learning)",     "ML is learning patterns from data."),
            (r"what is (nlp|natural language)",    "NLP helps computers understand human language."),
            (r"help|what can you do",              "I can answer AI/ML questions. Just ask!"),
            (r"thank",                             "You're welcome!"),
        ]
        def __init__(self):
            self.compiled = [(re.compile(p, re.I), r) for p, r in self.RULES]
            self.history = []
        def respond(self, user_input):
            for pattern, response in self.compiled:
                if pattern.search(user_input):
                    self.history.append({"role": "user", "content": user_input})
                    self.history.append({"role": "assistant", "content": response})
                    return response
            fallback = "I'm not sure about that. Could you rephrase?"
            self.history.append({"role": "user", "content": user_input})
            self.history.append({"role": "assistant", "content": fallback})
            return fallback
    bot = RuleBasedChatbot()
    print("Ex27 — RuleBasedChatbot:")
    for msg in ["Hello!", "What is AI?", "What is NLP?", "Thanks!", "Random question."]:
        print(f"  User: {msg!r}")
        print(f"  Bot:  {bot.respond(msg)!r}")

def ex28():
    """Chatbot with memory: stores facts about the user"""
    class MemoryBot:
        def __init__(self):
            self.user_facts = {}
            self.history = []
        def _extract_facts(self, text):
            name = re.search(r"\b(?:my name is|i am|i'm|call me)\s+([A-Z][a-z]+)", text, re.I)
            if name: self.user_facts["name"] = name.group(1)
            age = re.search(r"\bi(?:'m| am)?\s*(\d{1,3})\s*years?\s*old\b", text, re.I)
            if age: self.user_facts["age"] = int(age.group(1))
            loc = re.search(r"\bi(?:'m| am)?\s*from\s+([A-Z][a-zA-Z\s]+)", text, re.I)
            if loc: self.user_facts["location"] = loc.group(1).strip()
        def respond(self, user_input):
            self._extract_facts(user_input)
            self.history.append({"role": "user", "content": user_input})
            if "what is my name" in user_input.lower():
                name = self.user_facts.get("name", "unknown (you haven't told me yet)")
                reply = f"Your name is {name}."
            elif "how old am i" in user_input.lower():
                age = self.user_facts.get("age", "unknown")
                reply = f"You told me you are {age} years old."
            elif "where am i from" in user_input.lower():
                loc = self.user_facts.get("location", "unknown")
                reply = f"You said you are from {loc}."
            else:
                reply = f"Got it! I know: {self.user_facts}" if self.user_facts else "Tell me about yourself!"
            self.history.append({"role": "assistant", "content": reply})
            return reply
    bot = MemoryBot()
    print("Ex28 — Memory Bot (stores user facts):")
    for msg in ["My name is Alice and I'm from London.",
                "I'm 30 years old.", "What is my name?", "Where am I from?"]:
        print(f"  User: {msg!r}")
        print(f"  Bot:  {bot.respond(msg)!r}")

def ex29():
    """Chatbot with knowledge base search using TF-IDF"""
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np
    KB = {
        "Python is a high-level interpreted programming language.":          "python",
        "Machine learning models learn patterns from labeled data.":          "ml",
        "Deep learning uses stacked neural network layers.":                  "dl",
        "Transformers use self-attention to process sequences.":              "transformers",
        "RAG retrieves relevant documents before generating an answer.":      "rag",
        "Embeddings represent text as dense numerical vectors.":              "embeddings",
    }
    class KBChatbot:
        def __init__(self, kb):
            self.answers = list(kb.keys())
            self.tv = TfidfVectorizer()
            self.X = self.tv.fit_transform(self.answers)
        def ask(self, question, threshold=0.1):
            q_vec = self.tv.transform([question])
            sims = cosine_similarity(q_vec, self.X)[0]
            best = np.argmax(sims)
            if sims[best] >= threshold:
                return self.answers[best], sims[best]
            return "I don't have information about that.", 0.0
    bot = KBChatbot(KB)
    print("Ex29 — TF-IDF Knowledge Base Chatbot:")
    for q in ["Tell me about neural network layers.", "What are embeddings?",
              "How does blockchain work?"]:
        answer, score = bot.ask(q)
        print(f"  Q: '{q}'")
        print(f"  A: '{answer}' (sim={score:.3f})")

def ex30():
    """Chatbot evaluation: run test cases and report results"""
    class SimpleBotForEval:
        RULES = [(re.compile(p, re.I), r) for p, r in [
            (r"hello|hi", "Hello! How can I help?"),
            (r"bye",      "Goodbye!"),
            (r"python",   "Python is a great language!"),
            (r"ai",       "AI stands for Artificial Intelligence."),
        ]]
        def respond(self, text):
            for pat, resp in self.RULES:
                if pat.search(text): return resp
            return "I don't know."
    TEST_CASES = [
        {"input": "Hello there!", "expected_contains": "Hello"},
        {"input": "Bye!", "expected_contains": "Goodbye"},
        {"input": "Tell me about Python.", "expected_contains": "Python"},
        {"input": "What is AI?", "expected_contains": "Artificial Intelligence"},
        {"input": "What is quantum computing?", "expected_contains": "don't know"},
    ]
    bot = SimpleBotForEval()
    passed = 0
    print("Ex30 — Chatbot Evaluation (test cases):")
    for tc in TEST_CASES:
        response = bot.respond(tc["input"])
        ok = tc["expected_contains"].lower() in response.lower()
        passed += ok
        status = "PASS" if ok else "FAIL"
        print(f"  [{status}] '{tc['input'][:35]}' → contains '{tc['expected_contains']}'")
    print(f"  Result: {passed}/{len(TEST_CASES)} passed")

def ex31():
    """Conversation flow engine using a state machine"""
    class ConversationFlow:
        TRANSITIONS = {
            "start":       {"greeting": "greet_state", "help": "help_state", "*": "start"},
            "greet_state": {"ask_name": "collect_name", "help": "help_state", "*": "greet_state"},
            "collect_name":{"confirm": "confirm_state", "*": "collect_name"},
            "confirm_state":{"yes": "done", "no": "start", "*": "confirm_state"},
            "help_state":  {"*": "start"},
            "done":        {"*": "done"},
        }
        def __init__(self):
            self.state = "start"
        def _detect_signal(self, text):
            t = text.lower()
            if any(w in t for w in ["hello", "hi"]): return "greeting"
            if "help" in t: return "help"
            if "name" in t: return "ask_name"
            if any(w in t for w in ["yes", "correct"]): return "yes"
            if "no" in t: return "no"
            if re.search(r"[A-Z][a-z]+", text): return "confirm"
            return "*"
        def process(self, user_input):
            signal = self._detect_signal(user_input)
            state_transitions = self.TRANSITIONS.get(self.state, {})
            next_state = state_transitions.get(signal, state_transitions.get("*", self.state))
            prev = self.state
            self.state = next_state
            return f"{prev} --[{signal}]--> {self.state}"
    flow = ConversationFlow()
    print("Ex31 — Conversation Flow Engine:")
    for msg in ["Hello!", "Can you help?", "What is my name?", "Alice", "yes"]:
        transition = flow.process(msg)
        print(f"  '{msg}' → {transition}")

def ex32():
    """Dialog state machine class"""
    class DialogStateMachine:
        STATES = {
            "idle": {
                "on_enter": "Hello! I'm ready to help. What do you need?",
                "transitions": {"booking": "booking_start", "faq": "faq", "default": "idle"}
            },
            "booking_start": {
                "on_enter": "Great! What date would you like to book?",
                "transitions": {"date_given": "booking_confirm", "cancel": "idle"}
            },
            "booking_confirm": {
                "on_enter": "Please confirm your booking (yes/no):",
                "transitions": {"yes": "booking_done", "no": "idle"}
            },
            "booking_done": {
                "on_enter": "Your booking is confirmed! Anything else?",
                "transitions": {"default": "idle"}
            },
            "faq": {
                "on_enter": "Sure! Ask your question.",
                "transitions": {"default": "idle"}
            },
        }
        def __init__(self):
            self.state = "idle"
            self.data = {}
        def transition(self, intent):
            transitions = self.STATES[self.state]["transitions"]
            next_state = transitions.get(intent, transitions.get("default", self.state))
            self.state = next_state
            return self.STATES[self.state]["on_enter"]
    dsm = DialogStateMachine()
    print("Ex32 — Dialog State Machine:")
    steps = [("booking", ""), ("date_given", "2025-03-15"), ("yes", "")]
    print(f"  Initial: {dsm.state} → '{dsm.STATES[dsm.state]['on_enter']}'")
    for intent, data in steps:
        response = dsm.transition(intent)
        print(f"  Intent='{intent}' → state='{dsm.state}': '{response}'")

def ex33():
    """Multi-intent handler (handle multiple intents in one message)"""
    INTENT_PATTERNS = {
        "greeting":    re.compile(r"\b(hello|hi|hey)\b", re.I),
        "question":    re.compile(r"\b(what|how|why|when|where|who)\b", re.I),
        "booking":     re.compile(r"\b(book|reserve|schedule|appointment)\b", re.I),
        "farewell":    re.compile(r"\b(bye|goodbye|later)\b", re.I),
        "thanks":      re.compile(r"\b(thank|thanks|appreciate)\b", re.I),
    }
    RESPONSES = {
        "greeting":  "Hello!",
        "question":  "Let me answer your question.",
        "booking":   "I'll help you book that.",
        "farewell":  "Goodbye!",
        "thanks":    "You're welcome!",
    }
    def multi_intent_respond(text):
        detected = [intent for intent, pat in INTENT_PATTERNS.items() if pat.search(text)]
        if not detected:
            return ["I'm not sure how to respond."]
        return [RESPONSES[intent] for intent in detected]
    tests = ["Hi! I'd like to book a meeting. Thanks!", "Hello, goodbye!", "What time is it?"]
    print("Ex33 — Multi-Intent Handler:")
    for t in tests:
        responses = multi_intent_respond(t)
        print(f"  '{t}' → intents={len(responses)}: {responses}")

def ex34():
    """Session manager for multiple concurrent users"""
    import time
    class SessionManager:
        def __init__(self, timeout_seconds=300):
            self._sessions = {}
            self.timeout = timeout_seconds
        def get_or_create(self, user_id):
            now = time.time()
            if user_id not in self._sessions:
                self._sessions[user_id] = {
                    "user_id": user_id, "history": [],
                    "created_at": now, "last_active": now, "turn_count": 0
                }
            else:
                self._sessions[user_id]["last_active"] = now
            return self._sessions[user_id]
        def add_turn(self, user_id, user_msg, bot_msg):
            session = self.get_or_create(user_id)
            session["history"].extend([
                {"role": "user", "content": user_msg},
                {"role": "assistant", "content": bot_msg},
            ])
            session["turn_count"] += 1
        def expire_old(self):
            now = time.time()
            expired = [uid for uid, s in self._sessions.items()
                       if now - s["last_active"] > self.timeout]
            for uid in expired:
                del self._sessions[uid]
            return expired
        def stats(self):
            return {uid: {"turns": s["turn_count"]} for uid, s in self._sessions.items()}
    sm = SessionManager(timeout_seconds=3600)
    sm.add_turn("alice", "Hello", "Hi Alice!")
    sm.add_turn("alice", "What is ML?", "ML is learning from data.")
    sm.add_turn("bob", "Hi", "Hello Bob!")
    print("Ex34 — Session Manager:")
    print(f"  Active sessions: {list(sm._sessions.keys())}")
    print(f"  Stats: {sm.stats()}")

def ex35():
    """Chatbot analytics: message count, avg length, intent distribution"""
    def compute_analytics(history):
        user_msgs = [m for m in history if m["role"] == "user"]
        bot_msgs = [m for m in history if m["role"] == "assistant"]
        user_lengths = [len(m["content"].split()) for m in user_msgs]
        bot_lengths = [len(m["content"].split()) for m in bot_msgs]
        intent_counts = {}
        for m in user_msgs:
            for word in ["question", "booking", "complaint", "thanks", "greeting"]:
                if word[:4] in m["content"].lower():
                    intent_counts[word] = intent_counts.get(word, 0) + 1
        return {
            "total_turns": len(user_msgs),
            "avg_user_length": round(sum(user_lengths)/len(user_lengths), 1) if user_lengths else 0,
            "avg_bot_length": round(sum(bot_lengths)/len(bot_lengths), 1) if bot_lengths else 0,
            "intent_distribution": intent_counts,
        }
    history = [
        {"role": "user", "content": "Hello, I have a question about booking."},
        {"role": "assistant", "content": "Sure, I can help you with your booking."},
        {"role": "user", "content": "I want to book a meeting for tomorrow."},
        {"role": "assistant", "content": "Great! What time works for you?"},
        {"role": "user", "content": "3pm. Also, thanks for the help!"},
        {"role": "assistant", "content": "You're welcome! Booking confirmed for 3pm."},
    ]
    analytics = compute_analytics(history)
    print("Ex35 — Chatbot Analytics:")
    for k, v in analytics.items():
        print(f"  {k}: {v}")

def ex36():
    """Streaming response simulation using generator (yield words)"""
    import time
    def stream_response(text, delay=0.0):
        words = text.split()
        for i, word in enumerate(words):
            yield word + (" " if i < len(words)-1 else "")
    response_text = "Deep learning is a subset of machine learning that uses neural networks."
    print("Ex36 — Streaming Response Simulation:")
    print("  Bot: ", end="")
    for chunk in stream_response(response_text):
        print(chunk, end="", flush=True)
    print()
    token_count = len(list(stream_response(response_text)))
    print(f"  Streamed {token_count} tokens")

def ex37():
    """Tool-calling chatbot: parse JSON tool calls from bot response"""
    def parse_tool_call(response_text):
        match = re.search(r"```json\s*(\{.*?\})\s*```", response_text, re.DOTALL)
        if not match:
            return None, response_text
        try:
            tool_call = json.loads(match.group(1))
            return tool_call, response_text[:match.start()].strip()
        except json.JSONDecodeError:
            return None, response_text
    def execute_tool(tool_call):
        name = tool_call.get("tool")
        args = tool_call.get("args", {})
        if name == "search":
            return f"Search results for '{args.get('query', '')}': [mock results]"
        if name == "calculator":
            try: return str(eval(args.get("expression", "0")))
            except: return "Error"
        return f"Unknown tool: {name}"
    bot_responses = [
        'Let me search for that.\n```json\n{"tool": "search", "args": {"query": "latest AI news"}}\n```',
        '```json\n{"tool": "calculator", "args": {"expression": "15 * 7 + 3"}}\n```',
        "I can answer that directly. The answer is 42.",
    ]
    print("Ex37 — Tool-Calling Chatbot:")
    for resp in bot_responses:
        tool_call, text = parse_tool_call(resp)
        if tool_call:
            result = execute_tool(tool_call)
            print(f"  Tool: {tool_call['tool']} → Result: '{result}'")
        else:
            print(f"  Direct: '{text[:60]}'")

def ex38():
    """Full chatbot demo: 5-turn scripted conversation"""
    class DemoBot:
        def __init__(self):
            self.history = []
            self.user_name = None
            self.rules = [
                (re.compile(r"hello|hi|hey", re.I),        self._greet),
                (re.compile(r"my name is\s+(\w+)", re.I),  self._learn_name),
                (re.compile(r"what is (ai|ml|nlp)", re.I), self._explain),
                (re.compile(r"bye|goodbye", re.I),          self._farewell),
            ]
        def _greet(self, match, text):
            name = f", {self.user_name}" if self.user_name else ""
            return f"Hello{name}! I'm DemoBot. Ask me about AI, ML, or NLP!"
        def _learn_name(self, match, text):
            self.user_name = match.group(1) if match.lastindex else "friend"
            return f"Nice to meet you, {self.user_name}!"
        def _explain(self, match, text):
            topic = match.group(1).upper() if match.lastindex else "AI"
            explanations = {"AI": "Artificial Intelligence simulates human intelligence.",
                            "ML": "Machine Learning learns patterns from data.",
                            "NLP": "Natural Language Processing handles human text."}
            return explanations.get(topic, f"{topic} is a fascinating field!")
        def _farewell(self, match, text):
            name = f", {self.user_name}" if self.user_name else ""
            return f"Goodbye{name}! Come back anytime!"
        def respond(self, user_input):
            for pattern, handler in self.rules:
                m = pattern.search(user_input)
                if m:
                    reply = handler(m, user_input)
                    self.history.append({"role": "user", "content": user_input})
                    self.history.append({"role": "assistant", "content": reply})
                    return reply
            return "Interesting! Tell me more."
    script = ["Hello!", "My name is Alice.",
              "What is AI?", "What is ML?", "Goodbye!"]
    bot = DemoBot()
    print("Ex38 — Full 5-Turn Chatbot Demo:")
    for line in script:
        print(f"  User: {line!r}")
        print(f"  Bot:  {bot.respond(line)!r}")
    print(f"  History: {len(bot.history)} messages total")

# --- ADVANCED (39-50) ---------------------------------------

def ex39():
    """LLM-backed chatbot pattern (print code)"""
    print("Ex39 — LLM-Backed Chatbot Pattern:")
    code = """
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)

class LLMChatbot:
    def __init__(self, system_prompt):
        self.messages = [SystemMessage(content=system_prompt)]
        self.llm = ChatOpenAI(model="gpt-4o-mini")

    def chat(self, user_input: str) -> str:
        self.messages.append(HumanMessage(content=user_input))
        response = self.llm.invoke(self.messages)
        self.messages.append(response)
        return response.content

    def clear(self):
        system = self.messages[0]
        self.messages = [system]

bot = LLMChatbot("You are a helpful AI assistant specializing in machine learning.")
print(bot.chat("What is gradient descent?"))
print(bot.chat("Can you give a concrete example?"))
    """
    print(code)

def ex40():
    """Function-calling chatbot pattern (print code)"""
    print("Ex40 — Function Calling Chatbot Pattern:")
    code = """
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder

@tool
def book_appointment(date: str, time: str, description: str) -> str:
    \"\"\"Book an appointment on a given date and time.\"\"\"
    return f"Appointment booked: {description} on {date} at {time}"

@tool
def check_calendar(date: str) -> str:
    \"\"\"Check available slots on a date.\"\"\"
    return f"Available slots on {date}: 9am, 11am, 2pm, 4pm"

@tool
def get_faq(topic: str) -> str:
    \"\"\"Answer FAQ questions about the service.\"\"\"
    faqs = {"hours": "Open 9am-5pm Mon-Fri", "pricing": "$100/hour"}
    return faqs.get(topic.lower(), "Please contact support.")

tools = [book_appointment, check_calendar, get_faq]
llm = ChatOpenAI(model="gpt-4o-mini")
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a scheduling assistant. Use tools when needed."),
    ("human", "{input}"),
    MessagesPlaceholder("agent_scratchpad"),
])

agent = create_tool_calling_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
result = executor.invoke({"input": "Book me a meeting tomorrow at 2pm for a code review."})
print(result["output"])
    """
    print(code)

def ex41():
    """Safety filter: keyword blocklist"""
    BLOCKLIST = {
        "violence": ["kill", "murder", "attack", "shoot", "bomb", "weapon"],
        "hate":     ["slur1", "slur2", "racist", "bigot"],  # placeholder terms
        "pii":      ["ssn", "social security", "credit card", "cvv"],
    }
    def safety_filter(text):
        text_lower = text.lower()
        violations = []
        for category, terms in BLOCKLIST.items():
            for term in terms:
                if term in text_lower:
                    violations.append((category, term))
        is_safe = len(violations) == 0
        return is_safe, violations
    tests = [
        "What is machine learning?",
        "How do I build a bomb?",
        "My SSN is 123-45-6789",
    ]
    print("Ex41 — Safety Filter (Keyword Blocklist):")
    for text in tests:
        safe, violations = safety_filter(text)
        status = "SAFE" if safe else f"BLOCKED ({violations})"
        print(f"  '{text[:40]}' → {status}")

def ex42():
    """Content moderation concept (print code pattern)"""
    print("Ex42 — Content Moderation Pattern:")
    code = """
# OpenAI Moderation API
from openai import OpenAI
client = OpenAI()

def moderate(text: str) -> dict:
    response = client.moderations.create(input=text)
    result = response.results[0]
    return {
        "flagged": result.flagged,
        "categories": {k: v for k, v in result.categories.__dict__.items() if v},
        "scores": {k: round(v, 4) for k, v in result.category_scores.__dict__.items()
                   if v > 0.01}
    }

# Multi-layer approach:
# Layer 1: Fast keyword blocklist (< 1ms)
# Layer 2: OpenAI moderation API (< 100ms)
# Layer 3: Custom classifier for domain-specific rules
# Layer 4: Human review queue for edge cases

def moderate_message(text: str, threshold: float = 0.8) -> str:
    if keyword_blocklist(text): return "blocked_keyword"
    result = moderate(text)
    if result["flagged"]: return "blocked_moderation"
    if any(v > threshold for v in result["scores"].values()):
        return "flagged_review"
    return "safe"
    """
    print(code)

def ex43():
    """Chatbot A/B testing framework"""
    import random
    class ABTestFramework:
        def __init__(self, variants):
            self.variants = variants
            self.metrics = {v: {"impressions": 0, "positive_feedback": 0, "turns": []}
                            for v in variants}
        def assign_variant(self, user_id):
            random.seed(hash(user_id) % (2**16))
            return random.choice(self.variants)
        def record_impression(self, variant):
            self.metrics[variant]["impressions"] += 1
        def record_feedback(self, variant, is_positive, turns):
            if is_positive:
                self.metrics[variant]["positive_feedback"] += 1
            self.metrics[variant]["turns"].append(turns)
        def get_results(self):
            results = {}
            for v, m in self.metrics.items():
                imp = m["impressions"]
                fb = m["positive_feedback"]
                avg_turns = sum(m["turns"])/len(m["turns"]) if m["turns"] else 0
                results[v] = {
                    "impressions": imp,
                    "satisfaction": round(fb/imp, 3) if imp > 0 else 0,
                    "avg_turns": round(avg_turns, 1),
                }
            return results
    ab = ABTestFramework(variants=["control", "treatment_a", "treatment_b"])
    for user_id in range(30):
        variant = ab.assign_variant(f"user_{user_id}")
        ab.record_impression(variant)
        is_positive = random.random() > (0.4 if variant == "control" else 0.3)
        ab.record_feedback(variant, is_positive, random.randint(2, 8))
    print("Ex43 — A/B Testing Framework:")
    for variant, stats in ab.get_results().items():
        print(f"  {variant}: {stats}")

def ex44():
    """Chatbot analytics dashboard data"""
    import random
    random.seed(42)
    def generate_analytics_report(n_sessions=20):
        intent_counts = {}
        sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0}
        response_times = []
        session_lengths = []
        for _ in range(n_sessions):
            intents = random.choices(
                ["greeting", "question_ai", "question_py", "booking", "thanks", "unknown"],
                weights=[20, 30, 25, 10, 10, 5], k=random.randint(3, 10)
            )
            for intent in intents:
                intent_counts[intent] = intent_counts.get(intent, 0) + 1
            sentiment = random.choices(["positive", "neutral", "negative"],
                                       weights=[50, 35, 15])[0]
            sentiment_counts[sentiment] += 1
            response_times.append(round(random.uniform(0.05, 0.5), 3))
            session_lengths.append(len(intents))
        return {
            "total_sessions": n_sessions,
            "total_turns": sum(session_lengths),
            "avg_session_length": round(sum(session_lengths)/n_sessions, 1),
            "avg_response_time_s": round(sum(response_times)/len(response_times), 3),
            "top_intents": sorted(intent_counts.items(), key=lambda x: -x[1])[:3],
            "sentiment": sentiment_counts,
        }
    report = generate_analytics_report(30)
    print("Ex44 — Chatbot Analytics Dashboard:")
    for k, v in report.items():
        print(f"  {k}: {v}")

def ex45():
    """Sentiment tracking over conversation turns"""
    POS = {"great", "good", "nice", "thanks", "love", "perfect", "helpful", "excellent"}
    NEG = {"bad", "wrong", "terrible", "hate", "awful", "frustrated", "broken", "useless"}
    def score_sentiment(text):
        words = set(text.lower().split())
        pos = len(words & POS)
        neg = len(words & NEG)
        if pos > neg: return 1
        if neg > pos: return -1
        return 0
    conversation = [
        "Hello, I need some help.",
        "What is machine learning?",
        "Great explanation, thanks!",
        "But I'm still confused about backpropagation.",
        "That example was terrible.",
        "Oh wait, now I understand! Perfect!",
    ]
    scores = [score_sentiment(msg) for msg in conversation]
    labels = {1: "positive", 0: "neutral", -1: "negative"}
    print("Ex45 — Sentiment Tracking Over Conversation:")
    for i, (msg, score) in enumerate(zip(conversation, scores)):
        print(f"  Turn {i+1} [{labels[score]:8}]: '{msg[:50]}'")
    avg = sum(scores) / len(scores)
    print(f"  Overall sentiment: {avg:+.2f} ({'positive' if avg>0 else 'negative' if avg<0 else 'neutral'})")

def ex46():
    """Topic drift detection using cosine similarity between turns"""
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np
    turns = [
        "What is machine learning and how does it work?",
        "Can you explain supervised learning with examples?",
        "How do neural networks differ from traditional ML?",
        "Speaking of food, what's a good pasta recipe?",
        "How do I make carbonara sauce at home?",
        "Back to AI — what is transfer learning?",
    ]
    tv = TfidfVectorizer()
    X = tv.fit_transform(turns)
    DRIFT_THRESHOLD = 0.15
    print("Ex46 — Topic Drift Detection:")
    for i in range(1, len(turns)):
        sim = cosine_similarity(X[i-1], X[i])[0, 0]
        drift = sim < DRIFT_THRESHOLD
        status = "DRIFT" if drift else "on-topic"
        print(f"  Turn {i}→{i+1}: sim={sim:.3f} [{status}] '{turns[i][:45]}'")

def ex47():
    """Chatbot handoff: bot-to-human escalation logic"""
    ESCALATION_TRIGGERS = {
        "explicit_request": re.compile(r"speak|talk|transfer|human|agent|person|representative", re.I),
        "anger":            re.compile(r"furious|outraged|unacceptable|useless bot|terrible service", re.I),
        "sensitive_topic":  re.compile(r"legal|lawsuit|lawyer|complaint|refund|fraud|billing issue", re.I),
    }
    class HandoffManager:
        def __init__(self):
            self.escalated = False
            self.reason = None
        def check_escalation(self, text, consecutive_unknowns=0):
            for trigger_name, pattern in ESCALATION_TRIGGERS.items():
                if pattern.search(text):
                    self.escalated = True
                    self.reason = trigger_name
                    return True, f"Transferring to human agent ({trigger_name})..."
            if consecutive_unknowns >= 3:
                self.escalated = True
                self.reason = "repeated_confusion"
                return True, "Connecting you to a human agent (repeated confusion)..."
            return False, None
    hm = HandoffManager()
    tests = [
        ("I need to speak to a human agent.", 0),
        ("This service is outrageous!", 0),
        ("Something unclear", 3),
        ("What is machine learning?", 0),
    ]
    print("Ex47 — Chatbot Handoff Logic:")
    for text, unknowns in tests:
        should_escalate, msg = hm.check_escalation(text, unknowns)
        if should_escalate:
            print(f"  '{text[:45]}' → ESCALATE: {msg}")
            hm.escalated = False
        else:
            print(f"  '{text[:45]}' → Bot continues")

def ex48():
    """Long-term memory concept (print code pattern)"""
    print("Ex48 — Long-Term Memory Concept:")
    code = """
# Long-term memory stores facts across sessions (not just current conversation)

# Architecture:
# 1. Extract facts from each conversation turn
# 2. Store in persistent database (SQLite, Redis, Postgres)
# 3. Retrieve relevant facts at start of each new session
# 4. Inject into system prompt

import json
import sqlite3
from datetime import datetime

class LongTermMemory:
    def __init__(self, db_path="memory.db"):
        self.conn = sqlite3.connect(db_path)
        self.conn.execute('''CREATE TABLE IF NOT EXISTS memories
                             (user_id TEXT, key TEXT, value TEXT, updated_at TEXT)''')
    def store(self, user_id: str, key: str, value: str):
        self.conn.execute(
            "INSERT OR REPLACE INTO memories VALUES (?, ?, ?, ?)",
            (user_id, key, value, datetime.now().isoformat())
        )
        self.conn.commit()
    def retrieve(self, user_id: str) -> dict:
        rows = self.conn.execute(
            "SELECT key, value FROM memories WHERE user_id=?", (user_id,)
        ).fetchall()
        return {k: v for k, v in rows}
    def get_system_prompt_injection(self, user_id: str) -> str:
        facts = self.retrieve(user_id)
        if not facts: return ""
        return "Known facts about user: " + "; ".join(f"{k}={v}" for k, v in facts.items())

memory = LongTermMemory()
memory.store("alice", "name", "Alice")
memory.store("alice", "job", "ML Engineer")
print(memory.get_system_prompt_injection("alice"))
# "Known facts about user: name=Alice; job=ML Engineer"
    """
    print(code)

def ex49():
    """Multi-modal chatbot concept (print code pattern)"""
    print("Ex49 — Multi-Modal Chatbot Concept:")
    code = """
# Multi-modal chatbot: handles text + images + (optionally) audio/video

from openai import OpenAI
import base64

client = OpenAI()

def encode_image(image_path: str) -> str:
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

def multimodal_chat(text: str, image_path: str = None) -> str:
    content = [{"type": "text", "text": text}]
    if image_path:
        image_data = encode_image(image_path)
        content.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:image/jpeg;base64,{image_data}",
                "detail": "high"
            }
        })
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": content}],
        max_tokens=500
    )
    return response.choices[0].message.content

# Usage examples:
# text_only = multimodal_chat("What is gradient descent?")
# with_image = multimodal_chat("Explain this chart.", "loss_curve.png")
# with_diagram = multimodal_chat("Debug this architecture diagram.", "arch.png")

# Extensions:
# - Audio: Whisper API for speech-to-text → text chatbot
# - TTS: Convert response to speech with OpenAI TTS
# - Video: Extract frames, describe each, summarize
    """
    print(code)

def ex50():
    """Production chatbot architecture (print design)"""
    print("Ex50 — Production Chatbot Architecture:")
    design = """
Production Chatbot System Design:

┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│  Web / Mobile / Slack / WhatsApp / API clients               │
│  WebSocket for streaming, REST for single-turn              │
└─────────────────────────────────────────────────────────────┘
           ▼
┌─────────────────────────────────────────────────────────────┐
│                    GATEWAY LAYER                             │
│  Auth (JWT/OAuth) → Rate Limiter → Safety Filter            │
│  Session Router → Load Balancer                              │
└─────────────────────────────────────────────────────────────┘
           ▼
┌─────────────────────────────────────────────────────────────┐
│                     BRAIN LAYER                              │
│  Intent Classifier → Slot Filler → Dialog Manager           │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐  │
│  │Rule-Based│  │  RAG KB  │  │   LLM (GPT-4o/Claude)    │  │
│  │ (fast)   │  │ (factual)│  │ (complex reasoning/gen)  │  │
│  └──────────┘  └──────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
           ▼
┌─────────────────────────────────────────────────────────────┐
│                    MEMORY LAYER                              │
│  Short-term: Redis (conversation window, 5-turn buffer)     │
│  Long-term: Postgres (user facts, preferences, history)     │
│  Semantic: Vector DB (FAISS/Chroma for KB search)           │
└─────────────────────────────────────────────────────────────┘
           ▼
┌─────────────────────────────────────────────────────────────┐
│                  OBSERVABILITY LAYER                         │
│  Logging: every turn (user_id, intent, latency, tokens)     │
│  Metrics: satisfaction, escalation rate, resolution rate    │
│  Tracing: LangSmith / Datadog for LLM call traces          │
│  Alerts: error rate > 1%, latency > 2s p99                  │
└─────────────────────────────────────────────────────────────┘

Reliability Checklist:
  [ ] Fallback chain: rule-based → RAG → LLM → human handoff
  [ ] Circuit breaker for LLM API outages
  [ ] Response caching for repeated FAQ questions (< 5ms)
  [ ] Content moderation on all inputs and outputs
  [ ] PII detection and masking before logging
  [ ] A/B testing framework for prompt/model improvements
  [ ] GDPR compliance: user data deletion endpoint
    """
    print(design)


def main():
    print("=" * 60)
    print("Examples 3.5 — Chatbot Project")
    print("=" * 60)

    print("\n--- BASIC (1-13) ---")
    ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07()
    ex08(); ex09(); ex10(); ex11(); ex12(); ex13()

    print("\n--- INTERMEDIATE (14-26) ---")
    ex14(); ex15(); ex16(); ex17(); ex18(); ex19(); ex20()
    ex21(); ex22(); ex23(); ex24(); ex25(); ex26()

    print("\n--- NESTED (27-38) ---")
    ex27(); ex28(); ex29(); ex30(); ex31(); ex32(); ex33()
    ex34(); ex35(); ex36(); ex37(); ex38()

    print("\n--- ADVANCED (39-50) ---")
    ex39(); ex40(); ex41(); ex42(); ex43(); ex44(); ex45()
    ex46(); ex47(); ex48(); ex49(); ex50()


if __name__ == "__main__":
    main()
