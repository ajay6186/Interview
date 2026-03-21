# ============================================================
# Solution 3.4 — LangChain Basics
# ============================================================
#
# Prerequisites:
#   pip install langchain langchain-openai langchain-community
#   pip install faiss-cpu tiktoken
#
# Set your API key:
#   export OPENAI_API_KEY="sk-..."
#
# Actual LLM calls are shown in comments so the file runs without an API key.
# ============================================================

# LangChain imports
from langchain_core.prompts import ChatPromptTemplate, PromptTemplate
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.documents import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.memory import ConversationBufferMemory

# ---------------------------------------------------------------------------
# How a real LCEL chain with an LLM would look:
#
#   from langchain_openai import ChatOpenAI
#   llm = ChatOpenAI(model="gpt-4o", temperature=0)
#
#   chain = prompt | llm | StrOutputParser()
#   result = chain.invoke({"topic": "black holes"})
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# SOLUTION 1: Build a basic LangChain PromptTemplate
# ---------------------------------------------------------------------------
def build_explain_prompt_template() -> PromptTemplate:
    """Return a PromptTemplate for explaining a topic to a child."""
    # PromptTemplate.from_template() auto-detects variables in curly braces.
    # input_variables are inferred — no need to list them manually.
    return PromptTemplate.from_template(
        "Explain {topic} in simple terms that a 10-year-old could understand. "
        "Use a real-world analogy and keep the explanation under 100 words."
    )


# ---------------------------------------------------------------------------
# SOLUTION 2: Build a ChatPromptTemplate with system + human messages
# ---------------------------------------------------------------------------
def build_expert_chat_template() -> ChatPromptTemplate:
    """Return a ChatPromptTemplate with system + human messages."""
    # from_messages() accepts (role, template_string) tuples or message objects.
    # "system" and "human" are role shorthand strings.
    return ChatPromptTemplate.from_messages([
        ("system", "You are a {role} with deep expertise in {domain}."),
        ("human", "{question}"),
    ])


# ---------------------------------------------------------------------------
# SOLUTION 3: Format a prompt template (no LLM call)
# ---------------------------------------------------------------------------
def format_expert_prompt(template: ChatPromptTemplate) -> list:
    """Format the expert chat template with sample values."""
    # format_messages() substitutes variables and returns a list of
    # typed message objects (SystemMessage, HumanMessage, etc.).
    messages = template.format_messages(
        role="data scientist",
        domain="machine learning",
        question="What is overfitting and how do you prevent it?",
    )
    return messages


# ---------------------------------------------------------------------------
# SOLUTION 4: String output parser
# ---------------------------------------------------------------------------
def demonstrate_str_output_parser() -> str:
    """Show how StrOutputParser extracts text from an AIMessage."""
    parser = StrOutputParser()
    mock_message = AIMessage(content="Hello, world!")
    # .parse() accepts a string or an AIMessage; both return the content string.
    # In an LCEL chain the LLM returns an AIMessage; the parser converts it.
    return parser.parse(mock_message.content)


# ---------------------------------------------------------------------------
# SOLUTION 5: JSON output parser
# ---------------------------------------------------------------------------
def demonstrate_json_output_parser() -> dict:
    """Show how JsonOutputParser converts a JSON string to a Python dict."""
    parser = JsonOutputParser()
    json_string = '{"name": "Alice", "age": 30, "skills": ["Python", "ML"]}'
    # parse() handles the JSON string → Python object conversion.
    # In a chain: llm returns a JSON string → JsonOutputParser yields a dict.
    return parser.parse(json_string)


# ---------------------------------------------------------------------------
# SOLUTION 6: LCEL pipe syntax (chain without LLM)
# ---------------------------------------------------------------------------
def demonstrate_lcel_chain() -> str:
    """Return a string describing an LCEL chain structure."""
    # LCEL key insight: every component implements __or__ (|), so you can
    # compose pipelines just like Unix pipes.
    # The chain is lazy — nothing runs until .invoke() is called.

    # We CAN build the prompt | parser portion without an LLM:
    template = PromptTemplate.from_template(
        "Give me a synonym for the word: {word}"
    )
    parser = StrOutputParser()

    # Demonstrating partial chain (template only; LLM would go in the middle):
    formatted = template.format(word="happy")

    chain_description = (
        "Full LCEL chain:\n"
        "  synonym_chain = prompt | llm | StrOutputParser()\n\n"
        "Where:\n"
        "  prompt  = PromptTemplate.from_template('Give me a synonym for: {word}')\n"
        "  llm     = ChatOpenAI(model='gpt-4o', temperature=0.5)\n"
        "  parser  = StrOutputParser()  # extracts .content from AIMessage\n\n"
        "Usage:\n"
        "  result = synonym_chain.invoke({'word': 'happy'})\n"
        "  # → 'joyful'\n\n"
        f"Formatted prompt (no LLM): {formatted}"
    )
    return chain_description


# ---------------------------------------------------------------------------
# SOLUTION 7: ConversationBufferMemory
# ---------------------------------------------------------------------------
def demonstrate_conversation_memory() -> list:
    """Return the messages list after saving 2 conversation exchanges."""
    # ConversationBufferMemory stores the FULL conversation history in RAM.
    # It integrates with LangChain chains via the memory= parameter.
    # Limitation: grows unboundedly — use ConversationSummaryMemory for
    # long conversations that would exceed the context window.
    memory = ConversationBufferMemory(return_messages=True)

    # save_context simulates one round-trip (user → assistant)
    memory.save_context(
        {"input": "What is LangChain?"},
        {"output": "LangChain is a framework for building LLM-powered applications."},
    )
    memory.save_context(
        {"input": "What can I build with it?"},
        {"output": "Chatbots, RAG pipelines, agents, and document Q&A systems."},
    )

    # chat_memory.messages contains HumanMessage / AIMessage objects
    return memory.chat_memory.messages


# ---------------------------------------------------------------------------
# SOLUTION 8: Document and Document loader concept
# ---------------------------------------------------------------------------
def build_sample_documents() -> list[Document]:
    """Return a list of 3 LangChain Document objects."""
    # LangChain Document = page_content (str) + metadata (dict).
    # Real loaders (PyPDFLoader, WebBaseLoader, etc.) produce these same objects,
    # so your downstream pipeline is loader-agnostic.
    return [
        Document(
            page_content=(
                "In Python, variables are created by assignment. "
                "Python is dynamically typed — you don't declare a type. "
                "Example: x = 42  or  name = 'Alice'"
            ),
            metadata={"source": "tutorial.txt", "page": 1, "topic": "variables"},
        ),
        Document(
            page_content=(
                "Functions in Python are defined using the 'def' keyword. "
                "They can accept arguments and return values. "
                "Example: def greet(name): return f'Hello, {name}!'"
            ),
            metadata={"source": "tutorial.txt", "page": 2, "topic": "functions"},
        ),
        Document(
            page_content=(
                "Classes are blueprints for objects. "
                "Use 'class MyClass:' to define one. "
                "The __init__ method is the constructor. "
                "Inheritance: class Dog(Animal): ..."
            ),
            metadata={"source": "tutorial.txt", "page": 3, "topic": "classes"},
        ),
    ]


# ---------------------------------------------------------------------------
# SOLUTION 9: RecursiveCharacterTextSplitter
# ---------------------------------------------------------------------------
def split_text_into_chunks(text: str) -> list[Document]:
    """Split `text` into overlapping chunks using RecursiveCharacterTextSplitter."""
    # RecursiveCharacterTextSplitter tries to split on natural boundaries:
    # "\n\n" → "\n" → " " → "" (character-level last resort).
    # This preserves semantic coherence better than naive character splitting.
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=100,       # max chars per chunk
        chunk_overlap=20,     # overlap to avoid losing context at boundaries
        length_function=len,  # measure length in characters (default)
        add_start_index=True, # metadata: where this chunk starts in original text
    )
    # create_documents wraps plain strings in Document objects automatically.
    return splitter.create_documents([text])


# ---------------------------------------------------------------------------
# SOLUTION 10: Build a retrieval chain description
# ---------------------------------------------------------------------------
def describe_retrieval_chain() -> dict[str, str]:
    """Return a dict describing each component of a LangChain retrieval chain."""
    return {
        "retriever": (
            "A retriever takes a query string and returns a list of relevant Documents. "
            "It wraps a vector store (FAISS, Chroma, Pinecone, etc.) and exposes a "
            "uniform .get_relevant_documents(query) interface."
        ),
        "prompt": (
            "A ChatPromptTemplate that injects retrieved context into a template slot. "
            "Typically: 'Answer the question based on this context: {context}\\n\\nQuestion: {question}'"
        ),
        "llm": (
            "A ChatOpenAI (or other) model that receives the formatted prompt and "
            "generates a grounded answer. Temperature is usually set to 0 for RAG."
        ),
        "parser": (
            "StrOutputParser() extracts the plain text content from the LLM's AIMessage response, "
            "making the chain's output a simple string."
        ),
        "how_they_connect": (
            "Using LCEL pipe syntax: "
            "chain = {'context': retriever, 'question': RunnablePassthrough()} | prompt | llm | StrOutputParser(). "
            "The retriever runs first; its Documents are formatted into the prompt; "
            "the LLM generates; the parser cleans the output."
        ),
    }


# ---------------------------------------------------------------------------
# SOLUTION 11: Agent concept
# ---------------------------------------------------------------------------
def describe_langchain_tools() -> dict[str, str]:
    """Return a dict describing 4 common LangChain agent tools."""
    # Agents use an LLM to DECIDE which tool to call and with what arguments.
    # The ReAct pattern (Reason + Act) is the most common agent architecture.
    return {
        "calculator": (
            "Evaluates mathematical expressions; used when the LLM needs precise "
            "arithmetic that it cannot reliably perform by itself."
        ),
        "web_search": (
            "Queries a search engine (e.g. SerpAPI, Tavily) and returns current "
            "web results, giving the agent access to information beyond its training cutoff."
        ),
        "python_repl": (
            "Executes arbitrary Python code in a sandboxed REPL; useful for data "
            "analysis, plotting, file I/O, and tasks requiring a deterministic computation."
        ),
        "vector_store_retriever": (
            "Performs semantic similarity search over a pre-built vector store, returning "
            "the top-k relevant document chunks to ground the LLM's answer in your data."
        ),
    }


# ---------------------------------------------------------------------------
# SOLUTION 12: Build a simple in-memory vector store (no real embeddings)
# ---------------------------------------------------------------------------
def mock_retriever(
    documents: list[Document],
    query: str,
    k: int = 2,
) -> list[Document]:
    """Return top-k documents by keyword overlap with the query."""
    # Simple keyword overlap score: count how many unique query words appear
    # in each document's page_content (case-insensitive).
    query_words = set(query.lower().split())

    def overlap_score(doc: Document) -> int:
        doc_words = set(doc.page_content.lower().split())
        return len(query_words & doc_words)

    scored = sorted(documents, key=overlap_score, reverse=True)
    return scored[:k]


# ---------------------------------------------------------------------------
# SOLUTION 13: Full RAG chain with LangChain components (described + partial demo)
# ---------------------------------------------------------------------------
def demonstrate_rag_chain(query: str) -> dict[str, str]:
    """Return a dict showing the RAG chain structure and a sample prompt."""
    # Retrieve documents using our mock retriever
    docs = build_sample_documents()
    retrieved = mock_retriever(docs, query, k=2)
    context = "\n\n".join(d.page_content for d in retrieved)

    # Build what the final prompt would look like
    rag_prompt_template = ChatPromptTemplate.from_messages([
        ("system",
         "You are a helpful assistant. Answer ONLY from the context below.\n\n"
         "Context:\n{context}"),
        ("human", "{question}"),
    ])
    formatted_msgs = rag_prompt_template.format_messages(
        context=context, question=query
    )
    sample_prompt = "\n".join(
        f"[{type(m).__name__}] {m.content}" for m in formatted_msgs
    )

    return {
        "chain_description": (
            "from langchain_openai import ChatOpenAI\n"
            "from langchain_core.runnables import RunnablePassthrough\n\n"
            "chain = (\n"
            "    {'context': retriever | format_docs, 'question': RunnablePassthrough()}\n"
            "    | rag_prompt\n"
            "    | ChatOpenAI(model='gpt-4o', temperature=0)\n"
            "    | StrOutputParser()\n"
            ")\n"
            "answer = chain.invoke('What is a Python function?')"
        ),
        "sample_prompt": sample_prompt,
    }


# ---------------------------------------------------------------------------
# SOLUTION 14: LangChain message types
# ---------------------------------------------------------------------------
def build_typed_conversation() -> list:
    """Return a list of typed LangChain message objects."""
    # Typed messages give LangChain (and the underlying LLM API) semantic
    # information about the role of each turn.
    return [
        SystemMessage(content="You are a helpful coding assistant."),
        HumanMessage(content="How do I read a file in Python?"),
        AIMessage(content=(
            "Use open() with a context manager:\n"
            "  with open('file.txt', 'r') as f:\n"
            "      content = f.read()\n"
            "The 'with' block ensures the file is closed automatically."
        )),
        HumanMessage(content="What if I want to write instead?"),
    ]


# ---------------------------------------------------------------------------
# SOLUTION 15: Summarise the LangChain ecosystem
# ---------------------------------------------------------------------------
def langchain_ecosystem_overview() -> dict[str, str]:
    """Return a dict summarising the main LangChain packages."""
    return {
        "langchain_core": (
            "The foundational package containing base abstractions (Runnable, BaseMessage, "
            "Document, etc.) and LCEL. No LLM provider dependencies."
        ),
        "langchain": (
            "The main package providing chains, agents, memory, text splitters, and "
            "high-level abstractions built on top of langchain_core."
        ),
        "langchain_community": (
            "Community-maintained integrations with 100+ third-party tools: vector stores "
            "(FAISS, Chroma), document loaders, LLM providers, and tools."
        ),
        "langchain_openai": (
            "Official OpenAI integration: ChatOpenAI and OpenAIEmbeddings classes that "
            "wrap the OpenAI Python SDK with LangChain's Runnable interface."
        ),
        "langgraph": (
            "A library for building stateful, multi-actor workflows (graphs) with LLMs. "
            "Ideal for complex agents that require cycles, branching, and human-in-the-loop."
        ),
        "langsmith": (
            "An observability and evaluation platform for LLM applications: traces every "
            "chain/agent call, enables dataset management and regression testing."
        ),
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("=== Solution 3.4 — LangChain Basics ===\n")

    # --- 1. PromptTemplate ---
    print("--- 1. PromptTemplate ---")
    tmpl = build_explain_prompt_template()
    print(f"  Template: {tmpl.template}")
    print(f"  Input vars: {tmpl.input_variables}")
    formatted = tmpl.format(topic="photosynthesis")
    print(f"  Formatted: {formatted}\n")

    # --- 2. ChatPromptTemplate ---
    print("--- 2. ChatPromptTemplate ---")
    chat_tmpl = build_expert_chat_template()
    print(f"  Input vars: {chat_tmpl.input_variables}\n")

    # --- 3. Format prompt ---
    print("--- 3. Formatted Messages ---")
    msgs = format_expert_prompt(chat_tmpl)
    for m in msgs:
        print(f"  [{type(m).__name__}] {m.content[:80]}")
    print()

    # --- 4. StrOutputParser ---
    print("--- 4. StrOutputParser ---")
    result = demonstrate_str_output_parser()
    print(f"  Parsed: '{result}'")
    print(f"  Type: {type(result).__name__}\n")

    # --- 5. JsonOutputParser ---
    print("--- 5. JsonOutputParser ---")
    parsed = demonstrate_json_output_parser()
    print(f"  Parsed dict: {parsed}")
    print(f"  Type: {type(parsed).__name__}\n")

    # --- 6. LCEL ---
    print("--- 6. LCEL Chain Description ---")
    print(demonstrate_lcel_chain())
    print()

    # --- 7. Memory ---
    print("--- 7. ConversationBufferMemory ---")
    messages = demonstrate_conversation_memory()
    print(f"  {len(messages)} messages stored:")
    for m in messages:
        role = type(m).__name__
        print(f"    [{role}] {m.content[:70]}...")
    print()

    # --- 8. Documents ---
    print("--- 8. Sample Documents ---")
    docs = build_sample_documents()
    for d in docs:
        print(f"  [page {d.metadata['page']}] {d.page_content[:60]}...")
    print()

    # --- 9. Text splitting ---
    print("--- 9. RecursiveCharacterTextSplitter ---")
    long_text = (
        "Python is a high-level programming language known for its readability. "
        "It supports multiple programming paradigms. "
    ) * 5
    chunks = split_text_into_chunks(long_text)
    print(f"  Input: {len(long_text)} chars → {len(chunks)} chunks")
    for i, chunk in enumerate(chunks[:3]):
        print(f"  Chunk {i}: '{chunk.page_content[:50]}...' (start={chunk.metadata.get('start_index', '?')})")
    print()

    # --- 10. Retrieval chain ---
    print("--- 10. Retrieval Chain Components ---")
    rc = describe_retrieval_chain()
    for k, v in rc.items():
        print(f"  {k}:\n    {v}\n")

    # --- 11. Agent tools ---
    print("--- 11. LangChain Agent Tools ---")
    tools = describe_langchain_tools()
    for k, v in tools.items():
        print(f"  {k}: {v}\n")

    # --- 12. Mock retriever ---
    print("--- 12. Mock Retriever ---")
    query = "Python functions and methods"
    results = mock_retriever(build_sample_documents(), query, k=2)
    print(f"  Query: '{query}'")
    for doc in results:
        print(f"  → [page {doc.metadata['page']}] {doc.page_content[:60]}...")
    print()

    # --- 13. RAG chain ---
    print("--- 13. RAG Chain Demo ---")
    rag = demonstrate_rag_chain("What is a Python function?")
    print("  Chain code:")
    for line in rag["chain_description"].split("\n"):
        print(f"    {line}")
    print("\n  Sample formatted prompt:")
    for line in rag["sample_prompt"].split("\n"):
        print(f"    {line[:90]}")
    print()

    # --- 14. Typed messages ---
    print("--- 14. Typed LangChain Messages ---")
    convo = build_typed_conversation()
    for msg in convo:
        print(f"  {type(msg).__name__}: {msg.content[:70]}...")
    print()

    # --- 15. Ecosystem ---
    print("--- 15. LangChain Ecosystem ---")
    eco = langchain_ecosystem_overview()
    for pkg, desc in eco.items():
        print(f"  {pkg}:\n    {desc}\n")


if __name__ == "__main__":
    main()
