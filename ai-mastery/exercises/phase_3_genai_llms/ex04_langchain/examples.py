# ============================================================
# Examples 3.4 - LangChain Basics (50 examples)
# BASIC (1-13) | INTERMEDIATE (14-26) | NESTED (27-38) | ADVANCED (39-50)
# ============================================================
# All examples print code patterns as strings - no API keys required.

import sys
import io
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
else:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

# --- BASIC (1-13) -------------------------------------------

def ex01():
    """What is LangChain: print description"""
    print("Ex01 — What is LangChain:")
    desc = """
LangChain is an open-source framework for building LLM-powered applications.

Core abstractions:
  - Models: wrappers for LLMs (OpenAI, Anthropic, local)
  - Prompts: PromptTemplate, ChatPromptTemplate
  - Chains: sequences of LLM calls and other operations
  - Retrievers: fetch relevant documents for RAG
  - Agents: LLMs that decide which tools to call
  - Memory: persist state across conversation turns

LCEL (LangChain Expression Language):
  chain = prompt | model | output_parser
  result = chain.invoke({"input": "hello"})
    """
    print(desc)

def ex02():
    """PromptTemplate code pattern"""
    print("Ex02 — PromptTemplate Pattern:")
    code = """
from langchain.prompts import PromptTemplate

template = PromptTemplate(
    input_variables=["product", "tone"],
    template="Write a {tone} description for {product}."
)

# Format the prompt
prompt_str = template.format(product="wireless headphones", tone="enthusiastic")
print(prompt_str)
# → "Write an enthusiastic description for wireless headphones."

# With .invoke()
prompt_value = template.invoke({"product": "laptop", "tone": "professional"})
print(prompt_value.text)
    """
    print(code)

def ex03():
    """ChatPromptTemplate code pattern"""
    print("Ex03 — ChatPromptTemplate Pattern:")
    code = """
from langchain.prompts import ChatPromptTemplate

chat_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant specializing in {domain}."),
    ("human", "Explain {topic} in simple terms."),
])

messages = chat_prompt.format_messages(
    domain="machine learning",
    topic="gradient descent"
)
# Returns list of BaseMessage objects:
# [SystemMessage(content="You are a helpful..."),
#  HumanMessage(content="Explain gradient...")]

# Invoke returns ChatPromptValue
prompt_value = chat_prompt.invoke({"domain": "AI", "topic": "transformers"})
    """
    print(code)

def ex04():
    """LLMChain code pattern"""
    print("Ex04 — LLMChain Pattern:")
    code = """
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)

prompt = PromptTemplate(
    input_variables=["topic"],
    template="Give me 3 key facts about {topic}."
)

chain = LLMChain(llm=llm, prompt=prompt)

# Run the chain
result = chain.invoke({"topic": "quantum computing"})
print(result["text"])

# Shortcut
result = chain.run("quantum computing")
print(result)
    """
    print(code)

def ex05():
    """LCEL pipe syntax: prompt | model | parser"""
    print("Ex05 — LCEL Pipe Syntax:")
    code = """
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema.output_parser import StrOutputParser

# Each component implements Runnable interface
prompt = ChatPromptTemplate.from_template("Tell me a joke about {topic}.")
model = ChatOpenAI(model="gpt-4o-mini")
parser = StrOutputParser()

# Compose with | operator (LCEL)
chain = prompt | model | parser

# Invoke
result = chain.invoke({"topic": "Python programming"})
print(result)

# The | operator calls chain.invoke:
#   prompt.invoke(input) → model.invoke(prompt_value) → parser.invoke(ai_message)
    """
    print(code)

def ex06():
    """StringOutputParser code pattern"""
    print("Ex06 — StringOutputParser Pattern:")
    code = """
from langchain.schema.output_parser import StrOutputParser
from langchain_core.messages import AIMessage

parser = StrOutputParser()

# Parse AIMessage to plain string
msg = AIMessage(content="The answer is 42.")
text = parser.invoke(msg)
print(text)  # "The answer is 42."

# In a chain:
chain = prompt | model | StrOutputParser()
result = chain.invoke({"question": "What is 6 × 7?"})
print(type(result))   # <class 'str'>
print(result)         # "42"
    """
    print(code)

def ex07():
    """JsonOutputParser code pattern"""
    print("Ex07 — JsonOutputParser Pattern:")
    code = """
from langchain.output_parsers import JsonOutputParser
from langchain.prompts import PromptTemplate

parser = JsonOutputParser()

# Add format instructions to prompt
prompt = PromptTemplate(
    template="Return a JSON with 'name' and 'score' for {subject}.\\n{format_instructions}",
    input_variables=["subject"],
    partial_variables={"format_instructions": parser.get_format_instructions()}
)

chain = prompt | model | parser
result = chain.invoke({"subject": "Python"})
# result is a dict: {'name': 'Python', 'score': 9.5}
print(type(result))  # <class 'dict'>
print(result['name'])
    """
    print(code)

def ex08():
    """ChatOpenAI setup pattern"""
    print("Ex08 — ChatOpenAI Setup Pattern:")
    code = """
from langchain_openai import ChatOpenAI
import os

# Basic setup
llm = ChatOpenAI(
    model="gpt-4o-mini",        # model name
    temperature=0.7,             # creativity (0=deterministic, 2=creative)
    max_tokens=512,              # max response length
    api_key=os.getenv("OPENAI_API_KEY")  # or set OPENAI_API_KEY env var
)

# Use ChatAnthropic for Claude
from langchain_anthropic import ChatAnthropic
claude = ChatAnthropic(model="claude-3-5-sonnet-20241022")

# Use Ollama for local models
from langchain_ollama import ChatOllama
local = ChatOllama(model="llama3.2")

# Invoke
from langchain_core.messages import HumanMessage
response = llm.invoke([HumanMessage(content="Hello!")])
print(response.content)
    """
    print(code)

def ex09():
    """invoke vs stream vs batch pattern"""
    print("Ex09 — invoke vs stream vs batch:")
    code = """
chain = prompt | model | StrOutputParser()

# 1. invoke — single input, waits for full response
result = chain.invoke({"topic": "AI"})
print(result)  # Full string

# 2. stream — single input, yields tokens as generated
for token in chain.stream({"topic": "AI"}):
    print(token, end="", flush=True)
print()  # newline

# 3. batch — multiple inputs, processed in parallel
results = chain.batch([
    {"topic": "AI"},
    {"topic": "ML"},
    {"topic": "NLP"},
])
for r in results:
    print(r[:50])

# Async variants: ainvoke, astream, abatch
import asyncio
result = asyncio.run(chain.ainvoke({"topic": "AI"}))
    """
    print(code)

def ex10():
    """HumanMessage, AIMessage, SystemMessage pattern"""
    print("Ex10 — Message Types Pattern:")
    code = """
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

# Direct list of messages to ChatModel
messages = [
    SystemMessage(content="You are a concise assistant."),
    HumanMessage(content="What is 2+2?"),
    AIMessage(content="4"),
    HumanMessage(content="What about 3+3?"),
]

response = llm.invoke(messages)
print(response.content)  # "6"
print(type(response))    # AIMessage

# Accessing metadata
print(response.response_metadata["model_name"])
print(response.usage_metadata["total_tokens"])
    """
    print(code)

def ex11():
    """Input variables in PromptTemplate"""
    print("Ex11 — Input Variables in PromptTemplate:")
    code = """
from langchain.prompts import PromptTemplate

# Explicit declaration
prompt = PromptTemplate(
    input_variables=["name", "language", "topic"],
    template="Hello {name}! Explain {topic} in {language}."
)
print(prompt.input_variables)  # ['name', 'language', 'topic']

# Auto-detect from template string
prompt2 = PromptTemplate.from_template(
    "Translate '{text}' from {source_lang} to {target_lang}."
)
print(prompt2.input_variables)  # ['text', 'source_lang', 'target_lang']

# Format
print(prompt2.format(text="Hello", source_lang="English", target_lang="French"))
    """
    print(code)

def ex12():
    """Partial variables in PromptTemplate"""
    print("Ex12 — Partial Variables Pattern:")
    code = """
from langchain.prompts import PromptTemplate
from datetime import datetime

# Partial with static value
prompt = PromptTemplate(
    input_variables=["product", "tone"],
    template="Write a {tone} {style} ad for {product}."
)
formal_prompt = prompt.partial(tone="formal")
# Now only needs: product, style
result = formal_prompt.format(product="laptop", style="print")
print(result)  # "Write a formal print ad for laptop."

# Partial with callable (evaluated at call time)
def get_date():
    return datetime.now().strftime("%Y-%m-%d")

dated_prompt = PromptTemplate(
    template="As of {date}, summarize {topic}.",
    input_variables=["topic"],
    partial_variables={"date": get_date}
)
print(dated_prompt.format(topic="AI trends"))
    """
    print(code)

def ex13():
    """PromptTemplate.format() worked example"""
    print("Ex13 — PromptTemplate.format() Example:")
    code = """
from langchain.prompts import PromptTemplate

template = PromptTemplate(
    input_variables=["role", "task", "constraints"],
    template=(
        "You are a {role}.\\n"
        "Task: {task}\\n"
        "Constraints: {constraints}\\n"
        "Provide a concise response."
    )
)

formatted = template.format(
    role="senior software engineer",
    task="Review this Python function for bugs",
    constraints="Focus on edge cases and error handling"
)
print(formatted)
# Output:
# You are a senior software engineer.
# Task: Review this Python function for bugs
# Constraints: Focus on edge cases and error handling
# Provide a concise response.
    """
    print(code)

# --- INTERMEDIATE (14-26) ----------------------------------

def ex14():
    """Few-shot PromptTemplate pattern"""
    print("Ex14 — Few-Shot PromptTemplate Pattern:")
    code = """
from langchain.prompts import FewShotPromptTemplate, PromptTemplate

examples = [
    {"word": "happy", "antonym": "sad"},
    {"word": "tall", "antonym": "short"},
    {"word": "fast", "antonym": "slow"},
]

example_prompt = PromptTemplate(
    input_variables=["word", "antonym"],
    template="Word: {word}\\nAntonym: {antonym}"
)

few_shot_prompt = FewShotPromptTemplate(
    examples=examples,
    example_prompt=example_prompt,
    prefix="Give the antonym of each word.",
    suffix="Word: {input}\\nAntonym:",
    input_variables=["input"]
)

print(few_shot_prompt.format(input="strong"))
# Output:
# Give the antonym of each word.
# Word: happy / Antonym: sad
# Word: tall  / Antonym: short
# Word: fast  / Antonym: slow
# Word: strong
# Antonym:
    """
    print(code)

def ex15():
    """ChatMessagePromptTemplate pattern"""
    print("Ex15 — ChatMessagePromptTemplate Pattern:")
    code = """
from langchain.prompts import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
    AIMessagePromptTemplate,
)

system = SystemMessagePromptTemplate.from_template(
    "You are an expert in {domain}."
)
human = HumanMessagePromptTemplate.from_template(
    "Explain {concept} using an analogy."
)
ai_example = AIMessagePromptTemplate.from_template(
    "{example_response}"
)

chat_prompt = ChatPromptTemplate.from_messages([system, ai_example, human])

messages = chat_prompt.format_messages(
    domain="physics",
    example_response="Sure, I can use everyday analogies.",
    concept="quantum entanglement"
)
for msg in messages:
    print(f"{type(msg).__name__}: {msg.content[:50]}")
    """
    print(code)

def ex16():
    """MessagesPlaceholder pattern for dynamic message injection"""
    print("Ex16 — MessagesPlaceholder Pattern:")
    code = """
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant."),
    MessagesPlaceholder(variable_name="history"),  # inject past messages
    ("human", "{input}"),
])

# Inject conversation history dynamically
history = [
    HumanMessage(content="My name is Alice."),
    AIMessage(content="Nice to meet you, Alice!"),
]
messages = prompt.format_messages(
    history=history,
    input="What is my name?"
)
# model will see: system + 2 history messages + new human message
    """
    print(code)

def ex17():
    """ConversationBufferMemory pattern"""
    print("Ex17 — ConversationBufferMemory Pattern:")
    code = """
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain

memory = ConversationBufferMemory(
    memory_key="history",          # key injected into prompt
    return_messages=True           # return Message objects (not string)
)

conversation = ConversationChain(
    llm=llm,
    memory=memory,
    verbose=True
)

# Each call automatically saves to memory
r1 = conversation.predict(input="Hi, my name is Bob.")
r2 = conversation.predict(input="What is my name?")  # uses memory
print(r2)  # "Your name is Bob."

# Inspect memory
print(memory.chat_memory.messages)
print(memory.load_memory_variables({}))
    """
    print(code)

def ex18():
    """ConversationSummaryMemory pattern"""
    print("Ex18 — ConversationSummaryMemory Pattern:")
    code = """
from langchain.memory import ConversationSummaryMemory

# Summarizes old messages to stay within context window
memory = ConversationSummaryMemory(
    llm=llm,                      # needs LLM to write summaries
    max_token_limit=200,          # summarize when history exceeds this
    memory_key="history"
)

# Use with ConversationChain
from langchain.chains import ConversationChain
chain = ConversationChain(llm=llm, memory=memory)

# After many turns, old messages are summarized:
# "Human mentioned they work in finance and asked about Python..."
print(memory.predict_new_summary(messages=[], existing_summary="..."))
print(memory.moving_summary_buffer)
    """
    print(code)

def ex19():
    """RunnableWithMessageHistory pattern (LCEL + memory)"""
    print("Ex19 — RunnableWithMessageHistory Pattern:")
    code = """
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory

# In-memory store keyed by session_id
store = {}
def get_session_history(session_id: str) -> ChatMessageHistory:
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]

# Base chain (stateless)
chain = prompt | model | StrOutputParser()

# Wrap with history management
chain_with_history = RunnableWithMessageHistory(
    chain,
    get_session_history,
    input_messages_key="input",
    history_messages_key="history",
)

# Invoke with session_id config
config = {"configurable": {"session_id": "user_123"}}
r1 = chain_with_history.invoke({"input": "My name is Carol."}, config=config)
r2 = chain_with_history.invoke({"input": "What's my name?"}, config=config)
    """
    print(code)

def ex20():
    """TextLoader pattern"""
    print("Ex20 — TextLoader Pattern:")
    code = """
from langchain_community.document_loaders import (
    TextLoader, PyPDFLoader, WebBaseLoader, CSVLoader
)

# Load plain text file
loader = TextLoader("my_document.txt", encoding="utf-8")
docs = loader.load()
# docs[0].page_content → full text
# docs[0].metadata    → {'source': 'my_document.txt'}

# Load PDF
pdf_loader = PyPDFLoader("report.pdf")
pages = pdf_loader.load()  # one Document per page

# Load from web URL
web_loader = WebBaseLoader("https://example.com/article")
web_docs = web_loader.load()

# Load CSV
csv_loader = CSVLoader("data.csv", source_column="text")
csv_docs = csv_loader.load()

print(f"Loaded {len(docs)} documents")
print(f"Content preview: {docs[0].page_content[:100]}")
    """
    print(code)

def ex21():
    """RecursiveCharacterTextSplitter pattern"""
    print("Ex21 — RecursiveCharacterTextSplitter Pattern:")
    code = """
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,        # target chunk size in characters
    chunk_overlap=50,      # overlap between chunks
    separators=["\\n\\n", "\\n", ". ", " ", ""],  # try in order
    length_function=len,
)

# Split documents
from langchain_community.document_loaders import TextLoader
loader = TextLoader("my_doc.txt")
raw_docs = loader.load()
chunks = splitter.split_documents(raw_docs)

print(f"Original: 1 doc → {len(chunks)} chunks")
for i, chunk in enumerate(chunks[:3]):
    print(f"  Chunk {i}: {len(chunk.page_content)} chars")
    print(f"  Preview: {chunk.page_content[:60]}...")
    """
    print(code)

def ex22():
    """FAISS vector store with LangChain pattern"""
    print("Ex22 — FAISS VectorStore with LangChain Pattern:")
    code = """
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Prepare documents
docs = [...]  # list of Document objects (from loaders)

# Create embeddings + vector store in one step
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = FAISS.from_documents(docs, embeddings)

# Similarity search
results = vectorstore.similarity_search("machine learning", k=4)
for doc in results:
    print(doc.page_content[:80])

# With scores
results_with_scores = vectorstore.similarity_search_with_score("AI", k=3)

# Save and load
vectorstore.save_local("faiss_index")
loaded = FAISS.load_local("faiss_index", embeddings,
                          allow_dangerous_deserialization=True)
    """
    print(code)

def ex23():
    """Retriever pattern"""
    print("Ex23 — Retriever Pattern:")
    code = """
# Any VectorStore can be a Retriever
retriever = vectorstore.as_retriever(
    search_type="similarity",         # or "mmr" or "similarity_score_threshold"
    search_kwargs={"k": 5}
)

# MMR (Maximal Marginal Relevance) — balance relevance + diversity
mmr_retriever = vectorstore.as_retriever(
    search_type="mmr",
    search_kwargs={"k": 5, "fetch_k": 20, "lambda_mult": 0.5}
)

# Score threshold
threshold_retriever = vectorstore.as_retriever(
    search_type="similarity_score_threshold",
    search_kwargs={"score_threshold": 0.7}
)

# Invoke retriever
docs = retriever.invoke("What is gradient descent?")
for doc in docs:
    print(doc.page_content[:60])
    print(doc.metadata)
    """
    print(code)

def ex24():
    """RetrievalQA chain pattern"""
    print("Ex24 — RetrievalQA Chain Pattern:")
    code = """
from langchain.chains import RetrievalQA
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o-mini")

qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",           # "stuff" | "map_reduce" | "refine"
    retriever=retriever,
    return_source_documents=True,
    chain_type_kwargs={
        "prompt": custom_prompt,  # optional custom prompt
        "verbose": True
    }
)

result = qa_chain.invoke({"query": "What is the main topic?"})
print(result["result"])
for doc in result["source_documents"]:
    print(f"Source: {doc.metadata['source']}")
    """
    print(code)

def ex25():
    """ConversationalRetrievalChain pattern"""
    print("Ex25 — ConversationalRetrievalChain Pattern:")
    code = """
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory

memory = ConversationBufferMemory(
    memory_key="chat_history",
    output_key="answer",
    return_messages=True
)

conv_chain = ConversationalRetrievalChain.from_llm(
    llm=llm,
    retriever=retriever,
    memory=memory,
    return_source_documents=True
)

# Multi-turn conversation with context
q1 = conv_chain.invoke({"question": "What is machine learning?"})
print(q1["answer"])

q2 = conv_chain.invoke({"question": "Can you give an example?"})  # uses history
print(q2["answer"])

# History is automatically managed by memory
    """
    print(code)

def ex26():
    """Custom tool definition pattern"""
    print("Ex26 — Custom Tool Definition Pattern:")
    code = """
from langchain.tools import tool, BaseTool
from pydantic import BaseModel, Field

# Method 1: @tool decorator
@tool
def get_weather(city: str) -> str:
    \"\"\"Get the current weather for a city.\"\"\"
    return f"The weather in {city} is sunny, 22°C."

# Method 2: BaseTool class with schema
class CalculatorInput(BaseModel):
    expression: str = Field(description="Math expression to evaluate")

class CalculatorTool(BaseTool):
    name: str = "calculator"
    description: str = "Evaluates mathematical expressions"
    args_schema: type = CalculatorInput

    def _run(self, expression: str) -> str:
        try:
            return str(eval(expression))
        except Exception as e:
            return f"Error: {e}"

tools = [get_weather, CalculatorTool()]
print([t.name for t in tools])  # ['get_weather', 'calculator']
    """
    print(code)

# --- NESTED (27-38) ----------------------------------------

def ex27():
    """Full RAG pipeline with LangChain (complete code pattern)"""
    print("Ex27 — Full RAG Pipeline with LangChain:")
    code = """
# === COMPLETE RAG PIPELINE ===
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

# Step 1: Load
loader = TextLoader("knowledge_base.txt")
raw_docs = loader.load()

# Step 2: Chunk
splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
chunks = splitter.split_documents(raw_docs)
print(f"Created {len(chunks)} chunks")

# Step 3: Embed & index
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = FAISS.from_documents(chunks, embeddings)

# Step 4: Build chain with custom prompt
prompt = PromptTemplate(
    template=(
        "Use the context below to answer the question.\\n"
        "If you don't know, say 'I don't know'.\\n\\n"
        "Context:\\n{context}\\n\\n"
        "Question: {question}\\n"
        "Answer:"
    ),
    input_variables=["context", "question"]
)

qa = RetrievalQA.from_chain_type(
    llm=ChatOpenAI(model="gpt-4o-mini"),
    retriever=vectorstore.as_retriever(search_kwargs={"k": 4}),
    chain_type_kwargs={"prompt": prompt},
    return_source_documents=True
)

# Step 5: Query
result = qa.invoke({"query": "What are the main topics covered?"})
print(result["result"])
    """
    print(code)

def ex28():
    """Agent with tools pattern"""
    print("Ex28 — Agent with Tools Pattern:")
    code = """
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_openai import ChatOpenAI
from langchain.tools import tool
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder

@tool
def search_web(query: str) -> str:
    \"\"\"Search the web for information.\"\"\"
    return f"Search results for '{query}': [mock results here]"

@tool
def calculate(expression: str) -> str:
    \"\"\"Evaluate a mathematical expression.\"\"\"
    return str(eval(expression))

tools = [search_web, calculate]
llm = ChatOpenAI(model="gpt-4o-mini")

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant with tools."),
    ("human", "{input}"),
    MessagesPlaceholder("agent_scratchpad"),
])

agent = create_tool_calling_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

result = executor.invoke({"input": "What is 15% of 240?"})
print(result["output"])
    """
    print(code)

def ex29():
    """Zero-shot-react-description agent pattern"""
    print("Ex29 — Zero-Shot ReAct Agent Pattern:")
    code = """
from langchain.agents import initialize_agent, AgentType
from langchain_openai import ChatOpenAI

# Tools define what the agent can do
tools = [search_tool, calculator_tool, wikipedia_tool]
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# ZERO_SHOT_REACT_DESCRIPTION: uses tool descriptions + ReAct prompting
agent = initialize_agent(
    tools=tools,
    llm=llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True,
    max_iterations=5,
    handle_parsing_errors=True,
)

# Agent loop: Thought → Action → Observation → Thought → ...
result = agent.invoke({"input": "What is the capital of France and its population?"})
print(result["output"])

# The agent will:
# Thought: I need to find the capital of France
# Action: search_web("capital of France")
# Observation: Paris
# Thought: Now I need the population...
    """
    print(code)

def ex30():
    """ReAct agent pattern (manual prompt)"""
    print("Ex30 — ReAct Agent Pattern (Manual Prompt):")
    code = """
from langchain import hub
from langchain.agents import create_react_agent, AgentExecutor

# Pull the official ReAct prompt from LangChain Hub
react_prompt = hub.pull("hwchase17/react")

# Create ReAct agent
agent = create_react_agent(llm, tools, react_prompt)
executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    max_iterations=10,
    early_stopping_method="generate"
)

result = executor.invoke({"input": "Find the latest AI research papers."})
print(result["output"])

# ReAct prompt structure:
# Thought: [reasoning]
# Action: tool_name
# Action Input: tool_input
# Observation: tool_result
# ... (repeat)
# Thought: I now know the final answer
# Final Answer: [answer]
    """
    print(code)

def ex31():
    """SQL agent pattern"""
    print("Ex31 — SQL Agent Pattern:")
    code = """
from langchain_community.agent_toolkits import create_sql_agent
from langchain_community.utilities import SQLDatabase
from langchain_openai import ChatOpenAI

# Connect to database
db = SQLDatabase.from_uri("sqlite:///customers.db")

# Create SQL agent (auto-discovers schema)
agent = create_sql_agent(
    llm=ChatOpenAI(model="gpt-4o-mini", temperature=0),
    db=db,
    agent_type="tool-calling",
    verbose=True,
    max_iterations=10,
)

# Natural language → SQL → result
result = agent.invoke({
    "input": "How many customers signed up in 2024?"
})
print(result["output"])

# Agent will:
# 1. List tables: SELECT name FROM sqlite_master WHERE type='table'
# 2. Get schema: PRAGMA table_info(customers)
# 3. Write query: SELECT COUNT(*) FROM customers WHERE year(signup_date)=2024
    """
    print(code)

def ex32():
    """CSV agent pattern"""
    print("Ex32 — CSV Agent Pattern:")
    code = """
from langchain_experimental.agents import create_csv_agent
from langchain_openai import ChatOpenAI

agent = create_csv_agent(
    llm=ChatOpenAI(model="gpt-4o-mini", temperature=0),
    path="sales_data.csv",
    verbose=True,
    allow_dangerous_code=True,  # required flag — review security implications
    agent_type="tool-calling",
)

# Natural language data analysis
result = agent.invoke({"input": "What is the average sales by region?"})
print(result["output"])

# Multiple CSVs
agent_multi = create_csv_agent(
    llm=llm,
    path=["q1.csv", "q2.csv", "q3.csv"],
    verbose=True,
    allow_dangerous_code=True
)
result = agent_multi.invoke({"input": "Compare Q1 vs Q2 total sales."})
    """
    print(code)

def ex33():
    """Custom agent executor pattern"""
    print("Ex33 — Custom Agent Executor Pattern:")
    code = """
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.callbacks import BaseCallbackHandler

class LoggingHandler(BaseCallbackHandler):
    def on_tool_start(self, serialized, input_str, **kwargs):
        print(f"  [TOOL] {serialized['name']}({input_str[:50]})")
    def on_tool_end(self, output, **kwargs):
        print(f"  [RESULT] {str(output)[:80]}")
    def on_agent_action(self, action, **kwargs):
        print(f"  [ACTION] {action.tool}: {action.tool_input}")

agent = create_tool_calling_agent(llm, tools, prompt)
executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=False,
    max_iterations=5,
    max_execution_time=30,        # timeout in seconds
    return_intermediate_steps=True,
    callbacks=[LoggingHandler()],
)

result = executor.invoke({"input": "Summarize today's top AI news."})
print("Steps:", len(result["intermediate_steps"]))
print("Output:", result["output"])
    """
    print(code)

def ex34():
    """Sequential chain pattern"""
    print("Ex34 — Sequential Chain Pattern:")
    code = """
from langchain.chains import SequentialChain, LLMChain
from langchain.prompts import PromptTemplate

# Chain 1: Generate outline
outline_chain = LLMChain(
    llm=llm,
    prompt=PromptTemplate(
        input_variables=["topic"],
        template="Create a 3-point outline for an article on {topic}."
    ),
    output_key="outline"
)

# Chain 2: Write article from outline
article_chain = LLMChain(
    llm=llm,
    prompt=PromptTemplate(
        input_variables=["topic", "outline"],
        template="Write an article on {topic} following this outline:\\n{outline}"
    ),
    output_key="article"
)

# Chain 3: Summarize article
summary_chain = LLMChain(
    llm=llm,
    prompt=PromptTemplate(
        input_variables=["article"],
        template="Summarize this article in 2 sentences:\\n{article}"
    ),
    output_key="summary"
)

sequential = SequentialChain(
    chains=[outline_chain, article_chain, summary_chain],
    input_variables=["topic"],
    output_variables=["outline", "article", "summary"]
)
result = sequential.invoke({"topic": "transformer models"})
print(result["summary"])
    """
    print(code)

def ex35():
    """Router chain pattern"""
    print("Ex35 — Router Chain Pattern:")
    code = """
from langchain.chains.router import MultiPromptChain
from langchain.chains.router.llm_router import LLMRouterChain, RouterOutputParser
from langchain.prompts import PromptTemplate

# Define destination chains
physics_chain = LLMChain(llm=llm, prompt=PromptTemplate(
    template="You are a physics expert. {input}", input_variables=["input"]
))
math_chain = LLMChain(llm=llm, prompt=PromptTemplate(
    template="You are a math expert. {input}", input_variables=["input"]
))

# Router decides which chain to use
destinations = [
    {"name": "physics", "description": "Good for questions about physics"},
    {"name": "math", "description": "Good for math and calculations"},
]

router_template = "Given the input, which chain to use? \\n{destinations}\\nInput: {input}"
router_chain = LLMRouterChain.from_llm(
    llm,
    PromptTemplate(template=router_template, input_variables=["input", "destinations"])
)

chain = MultiPromptChain(
    router_chain=router_chain,
    destination_chains={"physics": physics_chain, "math": math_chain},
    default_chain=math_chain
)
result = chain.invoke({"input": "What is the speed of light?"})
    """
    print(code)

def ex36():
    """LangChain callbacks pattern"""
    print("Ex36 — LangChain Callbacks Pattern:")
    code = """
from langchain_core.callbacks import BaseCallbackHandler, StdOutCallbackHandler
from langchain_core.outputs import LLMResult
import time

class MetricsCallback(BaseCallbackHandler):
    def __init__(self):
        self.start_time = None
        self.total_tokens = 0
        self.call_count = 0

    def on_llm_start(self, serialized, prompts, **kwargs):
        self.start_time = time.time()
        self.call_count += 1
        print(f"  [LLM] Call #{self.call_count} started")

    def on_llm_end(self, response: LLMResult, **kwargs):
        elapsed = time.time() - self.start_time
        tokens = response.llm_output.get("token_usage", {}).get("total_tokens", 0)
        self.total_tokens += tokens
        print(f"  [LLM] Finished in {elapsed:.2f}s, tokens={tokens}")

    def on_chain_error(self, error, **kwargs):
        print(f"  [ERROR] {error}")

metrics = MetricsCallback()
chain = prompt | llm | StrOutputParser()
result = chain.invoke({"input": "hello"}, config={"callbacks": [metrics]})
print(f"Total tokens used: {metrics.total_tokens}")
    """
    print(code)

def ex37():
    """LangSmith tracing setup pattern"""
    print("Ex37 — LangSmith Tracing Setup:")
    code = """
import os

# Set environment variables to enable tracing
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_ENDPOINT"] = "https://api.smith.langchain.com"
os.environ["LANGCHAIN_API_KEY"] = "your-langsmith-api-key"
os.environ["LANGCHAIN_PROJECT"] = "my-rag-project"

# All LangChain calls are now automatically traced
chain = prompt | llm | StrOutputParser()
result = chain.invoke({"input": "Explain LangSmith."})
# → Trace appears at https://smith.langchain.com

# Add run metadata
from langchain_core.tracers.context import tracing_v2_enabled
with tracing_v2_enabled(project_name="experiment-v2"):
    result = chain.invoke({"input": "test"})

# Evaluate with LangSmith
from langsmith.evaluation import evaluate
dataset_name = "my-eval-dataset"
results = evaluate(
    lambda inputs: chain.invoke(inputs),
    data=dataset_name,
    evaluators=["correctness", "conciseness"],
)
    """
    print(code)

def ex38():
    """Custom retriever class pattern"""
    print("Ex38 — Custom Retriever Pattern:")
    code = """
from langchain_core.retrievers import BaseRetriever
from langchain_core.documents import Document
from langchain_core.callbacks import CallbackManagerForRetrieverRun
from typing import List

class KeywordRetriever(BaseRetriever):
    \"\"\"Simple keyword-matching retriever.\"\"\"
    documents: List[Document]
    top_k: int = 3

    def _get_relevant_documents(
        self,
        query: str,
        *,
        run_manager: CallbackManagerForRetrieverRun
    ) -> List[Document]:
        query_words = set(query.lower().split())
        scored = []
        for doc in self.documents:
            doc_words = set(doc.page_content.lower().split())
            score = len(query_words & doc_words)
            scored.append((score, doc))
        scored.sort(key=lambda x: -x[0])
        return [doc for _, doc in scored[:self.top_k]]

# Use like any other retriever
docs = [Document(page_content=t) for t in ["Python ML", "Java Spring", "Python web"]]
retriever = KeywordRetriever(documents=docs, top_k=2)
results = retriever.invoke("Python programming")
print([d.page_content for d in results])
    """
    print(code)

# --- ADVANCED (39-50) ---------------------------------------

def ex39():
    """Complex LCEL pipeline with branching and parallel execution"""
    print("Ex39 — Complex LCEL Pipeline (Branch + Parallel):")
    code = """
from langchain_core.runnables import RunnableParallel, RunnableBranch, RunnableLambda
from langchain.schema.output_parser import StrOutputParser

# Parallel: run multiple chains simultaneously
parallel_chain = RunnableParallel({
    "summary": prompt_summary | llm | StrOutputParser(),
    "keywords": prompt_keywords | llm | StrOutputParser(),
    "sentiment": prompt_sentiment | llm | StrOutputParser(),
})

result = parallel_chain.invoke({"text": "AI is transforming industries rapidly."})
print(result["summary"])
print(result["keywords"])
print(result["sentiment"])

# Sequential + Parallel combination
full_chain = (
    RunnableLambda(lambda x: {"text": x["input"]})
    | parallel_chain
    | RunnableLambda(lambda x: f"Summary: {x['summary']}\\nKeywords: {x['keywords']}")
)
    """
    print(code)

def ex40():
    """RunnableParallel pattern"""
    print("Ex40 — RunnableParallel Pattern:")
    code = """
from langchain_core.runnables import RunnableParallel, RunnablePassthrough

# Pass input through while running parallel computations
chain = RunnableParallel(
    original=RunnablePassthrough(),          # pass input unchanged
    upper=RunnableLambda(lambda x: x.upper()),
    length=RunnableLambda(lambda x: len(x)),
)
result = chain.invoke("hello world")
# {'original': 'hello world', 'upper': 'HELLO WORLD', 'length': 11}

# Common RAG pattern: retrieve + pass question
retrieval_chain = RunnableParallel({
    "context": retriever | format_docs,
    "question": RunnablePassthrough(),
})
rag = retrieval_chain | prompt | llm | StrOutputParser()
rag.invoke("What is RAG?")

# .assign() to add keys without losing existing ones
chain = RunnablePassthrough.assign(
    summary=lambda x: summarize(x["text"]),
    word_count=lambda x: len(x["text"].split())
)
    """
    print(code)

def ex41():
    """RunnableBranch pattern for conditional routing"""
    print("Ex41 — RunnableBranch Pattern:")
    code = """
from langchain_core.runnables import RunnableBranch

# Route to different chains based on input
branch = RunnableBranch(
    (lambda x: "code" in x["topic"].lower(), code_chain),
    (lambda x: "math" in x["topic"].lower(), math_chain),
    (lambda x: "history" in x["topic"].lower(), history_chain),
    default_chain,  # fallback
)

result = branch.invoke({"topic": "Python code examples"})
print(result)  # → code_chain handles this

# Equivalent with RunnableLambda
def route(input_dict):
    topic = input_dict["topic"].lower()
    if "code" in topic:
        return code_chain
    elif "math" in topic:
        return math_chain
    return default_chain

from langchain_core.runnables import RunnableLambda
dynamic_chain = RunnableLambda(route)
result = dynamic_chain.invoke({"topic": "math problems"})
    """
    print(code)

def ex42():
    """Fallback chain with .with_fallbacks()"""
    print("Ex42 — Fallback Chain Pattern:")
    code = """
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic

# Primary model
primary = ChatOpenAI(model="gpt-4o")

# Fallback models (tried in order on failure)
fallback1 = ChatOpenAI(model="gpt-4o-mini")
fallback2 = ChatAnthropic(model="claude-3-5-haiku-20241022")

# Chain with fallbacks
robust_llm = primary.with_fallbacks([fallback1, fallback2])

# Now if gpt-4o fails (rate limit, outage), gpt-4o-mini is tried, then Claude
chain = prompt | robust_llm | StrOutputParser()
result = chain.invoke({"input": "Explain attention mechanisms."})

# Fallback on specific exceptions only
from openai import RateLimitError
robust_llm2 = primary.with_fallbacks(
    [fallback1],
    exceptions_to_handle=(RateLimitError,)
)
    """
    print(code)

def ex43():
    """Streaming with callbacks pattern"""
    print("Ex43 — Streaming with Callbacks Pattern:")
    code = """
from langchain_core.callbacks import StreamingStdOutCallbackHandler
from langchain_openai import ChatOpenAI

# Method 1: Streaming callback handler
streaming_llm = ChatOpenAI(
    model="gpt-4o-mini",
    streaming=True,
    callbacks=[StreamingStdOutCallbackHandler()]
)

# Tokens are printed as they arrive
result = streaming_llm.invoke("Tell me about neural networks.")

# Method 2: chain.stream() with LCEL
chain = prompt | ChatOpenAI(model="gpt-4o-mini") | StrOutputParser()
print("Streaming response: ", end="")
for chunk in chain.stream({"topic": "transformers"}):
    print(chunk, end="", flush=True)
print()

# Method 3: Custom token handler
class TokenCounter(BaseCallbackHandler):
    def __init__(self):
        self.tokens = []
    def on_llm_new_token(self, token: str, **kwargs):
        self.tokens.append(token)
        print(token, end="", flush=True)

counter = TokenCounter()
chain.invoke({"topic": "AI"}, config={"callbacks": [counter]})
print(f"\\nTotal tokens streamed: {len(counter.tokens)}")
    """
    print(code)

def ex44():
    """Async LangChain (ainvoke, astream, abatch)"""
    print("Ex44 — Async LangChain Pattern:")
    code = """
import asyncio
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema.output_parser import StrOutputParser

chain = (
    ChatPromptTemplate.from_template("Tell me about {topic}.")
    | ChatOpenAI(model="gpt-4o-mini")
    | StrOutputParser()
)

# ainvoke — await single response
async def single():
    result = await chain.ainvoke({"topic": "quantum computing"})
    print(result[:100])

# astream — async generator
async def stream():
    async for chunk in chain.astream({"topic": "AI"}):
        print(chunk, end="", flush=True)
    print()

# abatch — concurrent batch processing (faster than sequential)
async def batch():
    topics = ["AI", "ML", "NLP", "CV", "RL"]
    results = await chain.abatch([{"topic": t} for t in topics])
    for topic, result in zip(topics, results):
        print(f"{topic}: {result[:50]}...")

# Run
asyncio.run(single())
asyncio.run(batch())
    """
    print(code)

def ex45():
    """LangChain evaluation with QAEvalChain"""
    print("Ex45 — LangChain Evaluation Pattern:")
    code = """
from langchain.evaluation import QAEvalChain, load_evaluator
from langchain_openai import ChatOpenAI

eval_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# QAEvalChain: judge if predicted answer matches ground truth
eval_chain = QAEvalChain.from_llm(eval_llm)

examples = [
    {"query": "What is 2+2?", "answer": "4"},
    {"query": "What is the capital of France?", "answer": "Paris"},
]
predictions = [
    {"result": "4"},
    {"result": "The capital is Paris."},
]

graded = eval_chain.evaluate(examples, predictions)
for ex, grade in zip(examples, graded):
    print(f"Q: {ex['query']} → {grade['results']}")

# Criteria evaluator
criteria_eval = load_evaluator("criteria", llm=eval_llm,
                               criteria="conciseness")
result = criteria_eval.evaluate_strings(
    prediction="Paris is the capital of France.",
    input="What is the capital of France?"
)
print(result["score"], result["reasoning"])
    """
    print(code)

def ex46():
    """Pydantic output parser pattern"""
    print("Ex46 — Pydantic Output Parser Pattern:")
    code = """
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List

class BookReview(BaseModel):
    title: str = Field(description="Book title")
    author: str = Field(description="Author name")
    rating: float = Field(description="Rating from 1.0 to 5.0", ge=1.0, le=5.0)
    pros: List[str] = Field(description="List of positive aspects")
    cons: List[str] = Field(description="List of negative aspects")

parser = PydanticOutputParser(pydantic_object=BookReview)

prompt = PromptTemplate(
    template=(
        "Review the book '{title}'.\\n"
        "{format_instructions}\\n"
        "Provide a thorough review."
    ),
    input_variables=["title"],
    partial_variables={"format_instructions": parser.get_format_instructions()}
)

chain = prompt | llm | parser
review: BookReview = chain.invoke({"title": "Deep Learning by Goodfellow"})

print(f"Title: {review.title}")
print(f"Rating: {review.rating}/5.0")
print(f"Pros: {review.pros}")
print(f"Type: {type(review)}")  # <class 'BookReview'>
    """
    print(code)

def ex47():
    """Function calling / tool calling chain pattern"""
    print("Ex47 — Function Calling Chain Pattern:")
    code = """
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage

@tool
def get_stock_price(ticker: str) -> str:
    \"\"\"Get the current stock price for a ticker symbol.\"\"\"
    prices = {"AAPL": 182.50, "GOOGL": 140.30, "MSFT": 378.00}
    return f"{ticker}: ${prices.get(ticker, 'N/A')}"

@tool
def get_company_info(ticker: str) -> str:
    \"\"\"Get company information for a stock ticker.\"\"\"
    info = {"AAPL": "Apple Inc.", "GOOGL": "Alphabet Inc."}
    return info.get(ticker, "Unknown company")

# Bind tools to model (OpenAI function calling)
llm_with_tools = ChatOpenAI(model="gpt-4o-mini").bind_tools(
    [get_stock_price, get_company_info]
)

# Model decides when to call tools
response = llm_with_tools.invoke([
    HumanMessage("What is the current AAPL stock price and company name?")
])
print(response.tool_calls)
# [{"name": "get_stock_price", "args": {"ticker": "AAPL"}, "id": "..."},
#  {"name": "get_company_info", "args": {"ticker": "AAPL"}, "id": "..."}]
    """
    print(code)

def ex48():
    """LangGraph StateGraph pattern"""
    print("Ex48 — LangGraph StateGraph Pattern:")
    code = """
from langgraph.graph import StateGraph, END
from typing import TypedDict, List

class AgentState(TypedDict):
    messages: List[str]
    current_step: str
    result: str

def call_llm(state: AgentState) -> AgentState:
    # Call the LLM with current messages
    response = llm.invoke(state["messages"])
    return {**state, "messages": state["messages"] + [response.content],
            "current_step": "tool_call" if response.tool_calls else "end"}

def call_tools(state: AgentState) -> AgentState:
    # Execute tool calls from last message
    tool_results = execute_tools(state["messages"][-1])
    return {**state, "messages": state["messages"] + tool_results,
            "current_step": "llm"}

def should_continue(state: AgentState) -> str:
    return state["current_step"]  # "tool_call" | "end"

# Build graph
builder = StateGraph(AgentState)
builder.add_node("llm", call_llm)
builder.add_node("tools", call_tools)
builder.set_entry_point("llm")
builder.add_conditional_edges("llm", should_continue,
                              {"tool_call": "tools", "end": END})
builder.add_edge("tools", "llm")  # loop back

graph = builder.compile()
result = graph.invoke({"messages": ["What is 15+27?"], "current_step": "llm"})
print(result["messages"][-1])
    """
    print(code)

def ex49():
    """LangChain + FastAPI deployment pattern"""
    print("Ex49 — LangChain + FastAPI Deployment Pattern:")
    code = """
from fastapi import FastAPI
from pydantic import BaseModel
from langserve import add_routes
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema.output_parser import StrOutputParser

app = FastAPI(title="LangChain API", version="1.0")

# Build chain
chain = (
    ChatPromptTemplate.from_template("Answer the question: {question}")
    | ChatOpenAI(model="gpt-4o-mini")
    | StrOutputParser()
)

# Add LangServe routes (auto-generates /invoke, /stream, /batch endpoints)
add_routes(app, chain, path="/qa")

# Manual route with Pydantic validation
class QuestionRequest(BaseModel):
    question: str
    max_tokens: int = 200

@app.post("/ask")
async def ask_question(request: QuestionRequest):
    result = await chain.ainvoke({"question": request.question})
    return {"answer": result, "question": request.question}

@app.get("/health")
def health():
    return {"status": "ok"}

# Run: uvicorn main:app --host 0.0.0.0 --port 8000
# Endpoints: POST /qa/invoke, POST /qa/stream, GET /qa/playground
    """
    print(code)

def ex50():
    """Production LangChain architecture design"""
    print("Ex50 — Production LangChain Architecture:")
    design = """
Production LangChain System Design:

┌─────────────────────────────────────────────────────────────┐
│                         API LAYER                            │
│  FastAPI + LangServe → /invoke /stream /batch endpoints      │
│  Auth: JWT, rate limiting, API keys                          │
└─────────────────────────────────────────────────────────────┘
           ▼
┌─────────────────────────────────────────────────────────────┐
│                      CHAIN LAYER (LCEL)                      │
│  Router → [RAG Chain | Agent Chain | Simple QA Chain]        │
│  Fallback: primary_llm.with_fallbacks([backup_llm])          │
└─────────────────────────────────────────────────────────────┘
           ▼
┌─────────────────────────────────────────────────────────────┐
│                    RETRIEVAL LAYER                           │
│  Query Expansion → Hybrid Search → Reranker → Top-k Chunks  │
│  VectorDB: FAISS / Chroma / Pinecone                         │
└─────────────────────────────────────────────────────────────┘
           ▼
┌─────────────────────────────────────────────────────────────┐
│                    GENERATION LAYER                          │
│  Context Builder → Prompt → LLM → Output Parser             │
│  Models: GPT-4o / Claude / local Llama                       │
└─────────────────────────────────────────────────────────────┘

Infrastructure:
  [ ] LangSmith for tracing, debugging, evaluation
  [ ] Redis cache for repeated queries (< 5ms latency)
  [ ] Async workers (asyncio + uvicorn) for throughput
  [ ] Streaming responses for UX (no long waits)
  [ ] Token budget management (prevent runaway costs)
  [ ] Prompt versioning in code (not hardcoded)
  [ ] Eval pipeline: automated testing on golden dataset
  [ ] Cost monitoring: tokens/request, $/day by endpoint
  [ ] Human feedback collection for continuous improvement
    """
    print(design)


def main():
    print("=" * 60)
    print("Examples 3.4 — LangChain Basics")
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
