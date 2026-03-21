# ============================================================
# Exercise 3.4 — LangChain Basics
# ============================================================
#
# Prerequisites:
#   pip install langchain langchain-openai langchain-community
#   pip install faiss-cpu tiktoken
#
# Set your API key:
#   export OPENAI_API_KEY="sk-..."
#
# Topics:
#   • LangChain LLM chains
#   • Prompt templates in LangChain
#   • Output parsers
#   • Memory (ConversationBufferMemory concept)
#   • Document loaders
#   • Text splitters
#   • Vector store integration
#   • Retrieval chain
#   • Agents and tools
#   • LCEL (LangChain Expression Language)
# ============================================================

# LangChain imports — install with: pip install langchain langchain-openai
from langchain_core.prompts import ChatPromptTemplate, PromptTemplate
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.documents import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.memory import ConversationBufferMemory


# ---------------------------------------------------------------------------
# TODO 1: Build a basic LangChain PromptTemplate
# ---------------------------------------------------------------------------
# Use PromptTemplate.from_template() to create a template that asks the model
# to explain a given `topic` in simple terms for a 10-year-old.
# Return the PromptTemplate object (do not call it yet).
def build_explain_prompt_template() -> PromptTemplate:
    """Return a PromptTemplate for explaining a topic to a child."""
    pass  # TODO 1


# ---------------------------------------------------------------------------
# TODO 2: Build a ChatPromptTemplate with system + human messages
# ---------------------------------------------------------------------------
# Use ChatPromptTemplate.from_messages() with:
#   - A system message: "You are a {role} with deep expertise in {domain}."
#   - A human message: "{question}"
# Return the ChatPromptTemplate object.
def build_expert_chat_template() -> ChatPromptTemplate:
    """Return a ChatPromptTemplate with system + human messages."""
    pass  # TODO 2


# ---------------------------------------------------------------------------
# TODO 3: Format a prompt template (no LLM call)
# ---------------------------------------------------------------------------
# Use the template from TODO 2 to format (not invoke) a prompt with:
#   role="data scientist", domain="machine learning", question="What is overfitting?"
# Return the formatted messages list (result of template.format_messages(...)).
def format_expert_prompt(template: ChatPromptTemplate) -> list:
    """Format the expert chat template with sample values."""
    pass  # TODO 3


# ---------------------------------------------------------------------------
# TODO 4: String output parser
# ---------------------------------------------------------------------------
# LangChain's StrOutputParser extracts the text content from an AIMessage.
# Create a StrOutputParser, then use its .parse() method to extract the
# content from this mock AIMessage: AIMessage(content="Hello, world!")
# Return the extracted string.
def demonstrate_str_output_parser() -> str:
    """Show how StrOutputParser extracts text from an AIMessage."""
    pass  # TODO 4


# ---------------------------------------------------------------------------
# TODO 5: JSON output parser
# ---------------------------------------------------------------------------
# Use JsonOutputParser to parse the following JSON string:
#   '{"name": "Alice", "age": 30, "skills": ["Python", "ML"]}'
# Return the parsed Python dict/list.
def demonstrate_json_output_parser() -> dict:
    """Show how JsonOutputParser converts a JSON string to a Python dict."""
    pass  # TODO 5


# ---------------------------------------------------------------------------
# TODO 6: LCEL pipe syntax (chain without LLM)
# ---------------------------------------------------------------------------
# LCEL (LangChain Expression Language) uses the | operator to chain
# components: prompt | llm | parser.
# Without a real LLM, demonstrate the concept by:
#   1. Building a PromptTemplate that takes a {word} variable and asks for
#      its synonym.
#   2. Using StrOutputParser.
#   3. Return a string that EXPLAINS what the full chain would look like
#      (e.g. "prompt | llm | StrOutputParser()") — since we have no LLM,
#      describe the chain as a string rather than executing it.
def demonstrate_lcel_chain() -> str:
    """Return a string describing an LCEL chain structure."""
    pass  # TODO 6


# ---------------------------------------------------------------------------
# TODO 7: ConversationBufferMemory
# ---------------------------------------------------------------------------
# Demonstrate conversation memory:
#   1. Create a ConversationBufferMemory instance.
#   2. Save 2 exchange pairs using memory.save_context().
#   3. Return the memory's chat_memory.messages list.
# Hint: save_context({"input": "..."}, {"output": "..."})
def demonstrate_conversation_memory() -> list:
    """Return the messages list after saving 2 conversation exchanges."""
    pass  # TODO 7


# ---------------------------------------------------------------------------
# TODO 8: Document and Document loader concept
# ---------------------------------------------------------------------------
# In LangChain a Document has .page_content (str) and .metadata (dict).
# Create a list of 3 Document objects representing pages of a Python tutorial:
#   Doc 1: content about variables, metadata source="tutorial.txt", page=1
#   Doc 2: content about functions, metadata source="tutorial.txt", page=2
#   Doc 3: content about classes, metadata source="tutorial.txt", page=3
# Return the list of Documents.
def build_sample_documents() -> list[Document]:
    """Return a list of 3 LangChain Document objects."""
    pass  # TODO 8


# ---------------------------------------------------------------------------
# TODO 9: RecursiveCharacterTextSplitter
# ---------------------------------------------------------------------------
# Use RecursiveCharacterTextSplitter to split a long string into chunks.
# Settings: chunk_size=100, chunk_overlap=20
# Split the provided `text` and return the resulting list of Document objects.
def split_text_into_chunks(text: str) -> list[Document]:
    """Split `text` into overlapping chunks using RecursiveCharacterTextSplitter."""
    pass  # TODO 9


# ---------------------------------------------------------------------------
# TODO 10: Build a retrieval chain description
# ---------------------------------------------------------------------------
# A retrieval chain in LangChain typically looks like:
#   retriever | prompt | llm | parser
# Without a real vector store, describe each component:
# Return a dict with keys: "retriever", "prompt", "llm", "parser", "how_they_connect"
# where each value is a 1-2 sentence explanation of that component's role.
def describe_retrieval_chain() -> dict[str, str]:
    """Return a dict describing each component of a LangChain retrieval chain."""
    pass  # TODO 10


# ---------------------------------------------------------------------------
# TODO 11: Agent concept
# ---------------------------------------------------------------------------
# Agents in LangChain choose which tools to call based on the user's request.
# Return a dict describing 4 common LangChain tools with keys:
#   "calculator", "web_search", "python_repl", "vector_store_retriever"
# Each value should be a 1-sentence description of what that tool does.
def describe_langchain_tools() -> dict[str, str]:
    """Return a dict describing 4 common LangChain agent tools."""
    pass  # TODO 11


# ---------------------------------------------------------------------------
# TODO 12: Build a simple in-memory vector store (no real embeddings)
# ---------------------------------------------------------------------------
# Use LangChain's InMemoryVectorStore or demonstrate a dict-based alternative.
# Since we avoid GPU calls, build a simple keyword-based "mock retriever":
# Given a list of Documents and a query, return the top-k documents whose
# page_content contains the most query words (simple overlap score).
def mock_retriever(
    documents: list[Document],
    query: str,
    k: int = 2,
) -> list[Document]:
    """Return top-k documents by keyword overlap with the query."""
    pass  # TODO 12


# ---------------------------------------------------------------------------
# TODO 13: Full RAG chain with LangChain components (described + partial demo)
# ---------------------------------------------------------------------------
# Demonstrate the structure of a RAG chain using LCEL syntax.
# Return a dict with:
#   "chain_description": the LCEL chain as a string
#     (e.g. "retriever | format_docs | prompt | llm | StrOutputParser()")
#   "sample_prompt": what the final prompt would look like for the query
#     "What is a Python function?" using the documents from TODO 8
def demonstrate_rag_chain(query: str) -> dict[str, str]:
    """Return a dict showing the RAG chain structure and a sample prompt."""
    pass  # TODO 13


# ---------------------------------------------------------------------------
# TODO 14: LangChain message types
# ---------------------------------------------------------------------------
# LangChain uses typed message objects: SystemMessage, HumanMessage, AIMessage.
# Build a 4-message conversation list:
#   1. SystemMessage: "You are a helpful coding assistant."
#   2. HumanMessage: "How do I read a file in Python?"
#   3. AIMessage: "Use open() with a context manager: with open('file.txt') as f: ..."
#   4. HumanMessage: "What if I want to write instead?"
# Return the list of message objects.
def build_typed_conversation() -> list:
    """Return a list of typed LangChain message objects."""
    pass  # TODO 14


# ---------------------------------------------------------------------------
# TODO 15: Summarise the LangChain ecosystem
# ---------------------------------------------------------------------------
# Return a dict with these keys, each containing a 1-2 sentence explanation:
#   "langchain_core", "langchain", "langchain_community",
#   "langchain_openai", "langgraph", "langsmith"
def langchain_ecosystem_overview() -> dict[str, str]:
    """Return a dict summarising the main LangChain packages."""
    pass  # TODO 15


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("=== Exercise 3.4 — LangChain Basics ===\n")

    print("TODO 1 — PromptTemplate:")
    tmpl = build_explain_prompt_template()
    print(tmpl)

    print("\nTODO 2 — ChatPromptTemplate:")
    chat_tmpl = build_expert_chat_template()
    print(chat_tmpl)

    print("\nTODO 3 — Format prompt:")
    msgs = format_expert_prompt(chat_tmpl) if chat_tmpl else None
    print(msgs)

    print("\nTODO 4 — StrOutputParser:")
    print(demonstrate_str_output_parser())

    print("\nTODO 5 — JsonOutputParser:")
    print(demonstrate_json_output_parser())

    print("\nTODO 6 — LCEL chain description:")
    print(demonstrate_lcel_chain())

    print("\nTODO 7 — ConversationBufferMemory:")
    msgs = demonstrate_conversation_memory()
    for m in (msgs or []):
        print(" ", m)

    print("\nTODO 8 — Sample documents:")
    docs = build_sample_documents()
    for d in (docs or []):
        print(f"  [{d.metadata}] {d.page_content[:60]}...")

    print("\nTODO 9 — Text splitting:")
    long_text = (
        "Python is a high-level programming language. " * 5
        + "Functions are defined with the def keyword. " * 5
        + "Classes use the class keyword and support inheritance. " * 5
    )
    chunks = split_text_into_chunks(long_text)
    print(f"  {len(chunks)} chunks from {len(long_text)}-char text")

    print("\nTODO 10 — Retrieval chain components:")
    rc = describe_retrieval_chain()
    if rc:
        for k, v in rc.items():
            print(f"  {k}: {v}")

    print("\nTODO 11 — Agent tools:")
    tools = describe_langchain_tools()
    if tools:
        for k, v in tools.items():
            print(f"  {k}: {v}")

    print("\nTODO 12 — Mock retriever:")
    docs = build_sample_documents()
    query = "Python functions and methods"
    results = mock_retriever(docs, query, k=2) if docs else []
    for doc in (results or []):
        print(f"  {doc.page_content[:60]}...")

    print("\nTODO 13 — RAG chain demo:")
    rag = demonstrate_rag_chain("What is a Python function?")
    if rag:
        for k, v in rag.items():
            print(f"  {k}:\n    {v}\n")

    print("\nTODO 14 — Typed messages:")
    convo = build_typed_conversation()
    for msg in (convo or []):
        print(f"  {type(msg).__name__}: {str(msg.content)[:60]}")

    print("\nTODO 15 — LangChain ecosystem:")
    eco = langchain_ecosystem_overview()
    if eco:
        for pkg, desc in eco.items():
            print(f"  {pkg}: {desc}")


if __name__ == "__main__":
    main()
