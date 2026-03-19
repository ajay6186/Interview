# Python Interview Questions & Answers (6-7 Years Experience)
### Topics: OOP · Async / Await · Threading & Concurrency

---

## Table of Contents

1. [OOP — Core Concepts](#1-oop--core-concepts)
2. [OOP — Advanced Patterns](#2-oop--advanced-patterns)
3. [Async / Await](#3-async--await)
4. [Threading & the GIL](#4-threading--the-gil)
5. [Multiprocessing](#5-multiprocessing)
6. [Concurrency Patterns & Pitfalls](#6-concurrency-patterns--pitfalls)

---

## 1. OOP — Core Concepts

---

### Q1: What are the four pillars of OOP and how does Python implement each?

**Answer:**

| Pillar | Python mechanism |
|---|---|
| **Encapsulation** | `_protected` / `__private` name-mangling, `@property` |
| **Abstraction** | `abc.ABC`, `@abstractmethod` |
| **Inheritance** | `class Child(Parent)`, MRO via C3-linearisation |
| **Polymorphism** | Duck typing, method overriding, `__dunder__` protocols |

```python
from abc import ABC, abstractmethod

class Animal(ABC):
    def __init__(self, name: str) -> None:
        self._name = name          # protected

    @property
    def name(self) -> str:
        return self._name

    @abstractmethod
    def speak(self) -> str: ...    # abstraction

class Dog(Animal):
    def speak(self) -> str:        # polymorphism via override
        return "Woof"

class Cat(Animal):
    def speak(self) -> str:
        return "Meow"

animals: list[Animal] = [Dog("Rex"), Cat("Luna")]
for a in animals:
    print(a.name, a.speak())      # polymorphism via duck typing
```

---

### Q2: Explain Python's MRO (Method Resolution Order) and how `super()` works with multiple inheritance.

**Answer:**

Python uses the **C3 linearisation** algorithm to determine MRO. `super()` always delegates to the *next class in MRO*, not necessarily the direct parent.

```python
class A:
    def hello(self):
        print("A")

class B(A):
    def hello(self):
        print("B")
        super().hello()

class C(A):
    def hello(self):
        print("C")
        super().hello()

class D(B, C):   # MRO: D → B → C → A → object
    def hello(self):
        print("D")
        super().hello()

D().hello()
# Output: D  B  C  A
print(D.__mro__)
# (<class 'D'>, <class 'B'>, <class 'C'>, <class 'A'>, <class 'object'>)
```

**Key insight:** Every `super().hello()` in the chain delegates to the *next in MRO*, so C3 guarantees each class is called exactly once even in a diamond hierarchy.

---

### Q3: What is name mangling? When would you use `__private` vs `_protected`?

**Answer:**

- `_protected` — convention only; signals "internal use", still accessible.
- `__private` — Python rewrites the name to `_ClassName__attr`, preventing accidental override in subclasses (not true security).

```python
class BankAccount:
    def __init__(self, balance: float) -> None:
        self.__balance = balance      # mangled → _BankAccount__balance

    def deposit(self, amount: float) -> None:
        if amount > 0:
            self.__balance += amount

    @property
    def balance(self) -> float:
        return self.__balance

acc = BankAccount(100)
# acc.__balance         → AttributeError
# acc._BankAccount__balance  → 100 (still reachable, but clearly wrong to use)
```

Use `__private` when you need to prevent accidental attribute collision in subclasses. Use `_protected` for internal helpers that subclasses may legitimately access.

---

### Q4: Explain `@property`, `@setter`, and `@deleter`. Why prefer them over plain getter/setter methods?

**Answer:**

`@property` lets you expose an attribute with controlled access while keeping a clean dot-notation API. Computed values, validation, and lazy loading become transparent to callers.

```python
class Temperature:
    def __init__(self, celsius: float = 0) -> None:
        self._celsius = celsius

    @property
    def celsius(self) -> float:
        return self._celsius

    @celsius.setter
    def celsius(self, value: float) -> None:
        if value < -273.15:
            raise ValueError("Temperature below absolute zero")
        self._celsius = value

    @property
    def fahrenheit(self) -> float:           # computed, read-only
        return self._celsius * 9/5 + 32

    @celsius.deleter
    def celsius(self) -> None:
        del self._celsius

t = Temperature(25)
print(t.fahrenheit)   # 77.0
t.celsius = -300      # raises ValueError
```

---

### Q5: What are `__slots__` and when should you use them?

**Answer:**

By default, Python stores instance attributes in a per-instance `__dict__`. `__slots__` replaces this with a fixed, compact C-level array — reducing memory and speeding up attribute access.

```python
import sys

class WithDict:
    def __init__(self, x, y):
        self.x = x
        self.y = y

class WithSlots:
    __slots__ = ("x", "y")
    def __init__(self, x, y):
        self.x = x
        self.y = y

a = WithDict(1, 2)
b = WithSlots(1, 2)
print(sys.getsizeof(a.__dict__))   # ~232 bytes (CPython 3.11)
print(hasattr(b, "__dict__"))      # False — no dict at all
```

**When to use:** Value-object classes that are instantiated millions of times (e.g., data records, AST nodes). Avoid when you need dynamic attributes or `__weakref__` (add it to `__slots__` explicitly if needed).

---

### Q6: How do descriptors work? Write a non-data descriptor vs a data descriptor.

**Answer:**

A **descriptor** is any object that defines `__get__`, `__set__`, or `__delete__`.

- **Non-data descriptor** — only `__get__` (e.g., functions/methods).
- **Data descriptor** — `__get__` + `__set__` (or `__delete__`); takes priority over instance `__dict__`.

```python
class Validator:
    """Data descriptor: validates numeric range."""
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return obj.__dict__.get(self.name)

    def __set__(self, obj, value):
        if not isinstance(value, (int, float)):
            raise TypeError(f"{self.name} must be numeric")
        obj.__dict__[self.name] = value

class Circle:
    radius = Validator()

    def __init__(self, radius):
        self.radius = radius   # triggers __set__

c = Circle(5)
c.radius = -1   # works (no range check here, extendable)
c.radius = "x"  # TypeError
```

`@property` is itself a data descriptor implemented in C.

---

### Q7: Explain `__new__` vs `__init__`. Implement a Singleton using `__new__`.

**Answer:**

- `__new__(cls)` — allocates and returns the new instance (called first).
- `__init__(self)` — initialises the already-created instance.

```python
class Singleton:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, value: int) -> None:
        # Called every time — guard if needed
        self.value = value

a = Singleton(1)
b = Singleton(2)
print(a is b)       # True
print(a.value)      # 2  (second __init__ ran on same object)
```

**Thread-safe version:**

```python
import threading

class SafeSingleton:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:          # double-checked locking
                    cls._instance = super().__new__(cls)
        return cls._instance
```

---

### Q8: What are metaclasses? Write a metaclass that auto-registers subclasses.

**Answer:**

A **metaclass** is the class of a class. `type` is the default metaclass; every `class` statement calls it. Metaclasses let you intercept class creation (`__new__`, `__init__`, `__prepare__`).

```python
class PluginMeta(type):
    registry: dict[str, type] = {}

    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)
        if bases:                          # skip the base class itself
            mcs.registry[name] = cls
        return cls

class Plugin(metaclass=PluginMeta):
    pass

class AudioPlugin(Plugin):
    pass

class VideoPlugin(Plugin):
    pass

print(PluginMeta.registry)
# {'AudioPlugin': <class 'AudioPlugin'>, 'VideoPlugin': <class 'VideoPlugin'>}
```

**Modern alternative:** `__init_subclass__` (Python 3.6+) is simpler for most auto-registration use cases.

```python
class Plugin:
    _registry: dict[str, type] = {}

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        Plugin._registry[cls.__name__] = cls
```

---

## 2. OOP — Advanced Patterns

---

### Q9: Implement the Observer pattern using Python's dunder methods.

**Answer:**

```python
from __future__ import annotations
from collections import defaultdict
from typing import Callable

class EventEmitter:
    def __init__(self) -> None:
        self._listeners: dict[str, list[Callable]] = defaultdict(list)

    def on(self, event: str, callback: Callable) -> None:
        self._listeners[event].append(callback)

    def emit(self, event: str, *args, **kwargs) -> None:
        for cb in self._listeners[event]:
            cb(*args, **kwargs)

    def off(self, event: str, callback: Callable) -> None:
        self._listeners[event].remove(callback)

# Usage
emitter = EventEmitter()
emitter.on("data", lambda x: print(f"Received: {x}"))
emitter.emit("data", 42)   # Received: 42
```

---

### Q10: Explain the difference between composition and inheritance. When would you choose one over the other?

**Answer:**

| | Inheritance | Composition |
|---|---|---|
| Relationship | "is-a" | "has-a" |
| Coupling | Tight (subclass depends on parent internals) | Loose (via interface) |
| Reuse | Via override | Via delegation |
| Flexibility | Rigid hierarchy | Swap implementations at runtime |

**Prefer composition** when:
- You need to vary behaviour at runtime.
- The relationship isn't a true "is-a".
- You'd otherwise create deep, fragile hierarchies.

```python
# Bad: inheritance for code reuse only
class JSONFormatter:
    def to_json(self): ...

class XMLFormatter:
    def to_xml(self): ...

class Report(JSONFormatter, XMLFormatter): ...   # awkward diamond

# Good: composition
class Report:
    def __init__(self, formatter):
        self._formatter = formatter              # inject any formatter

    def render(self):
        return self._formatter.render(self)
```

---

## 3. Async / Await

---

### Q11: How does Python's event loop work? What is a coroutine at the bytecode level?

**Answer:**

`asyncio` runs a **single-threaded event loop** that:
1. Maintains a queue of ready callbacks and `Task` objects.
2. Calls `selector.select()` (or equivalent) to wait for I/O events.
3. Wakes up the associated `Future`/`Task` and resumes the coroutine.

A coroutine is a **generator-based state machine** under the hood. `async def f()` creates a coroutine object; each `await expr` is a `yield` point where control returns to the event loop.

```python
import asyncio, time

async def fetch(name: str, delay: float) -> str:
    print(f"[{name}] starting")
    await asyncio.sleep(delay)       # yields control to event loop
    print(f"[{name}] done")
    return name

async def main():
    # concurrent, not parallel — all run on one thread
    results = await asyncio.gather(
        fetch("A", 1.0),
        fetch("B", 0.5),
        fetch("C", 1.5),
    )
    print(results)   # ['A', 'B', 'C']

start = time.perf_counter()
asyncio.run(main())
print(f"Total: {time.perf_counter() - start:.2f}s")   # ~1.5s, not 3s
```

---

### Q12: What is the difference between `asyncio.gather`, `asyncio.wait`, and `asyncio.TaskGroup`?

**Answer:**

| | `gather` | `wait` | `TaskGroup` (3.11+) |
|---|---|---|---|
| Return order | Preserves input order | Set of done/pending | Implicit, in-order |
| On first failure | Cancels rest (default) | Depends on `return_when` | Cancels all, re-raises |
| Error handling | `return_exceptions=True` | Manual inspection | Exception group |
| Preferred for | Simple fan-out | Fine-grained control | Structured concurrency |

```python
import asyncio

async def risky(n):
    if n == 2:
        raise ValueError("bad")
    return n

# --- gather ---
results = await asyncio.gather(risky(1), risky(2), risky(3),
                                return_exceptions=True)
# [1, ValueError('bad'), 3]

# --- TaskGroup (Python 3.11+) ---
async def main():
    results = []
    async with asyncio.TaskGroup() as tg:
        t1 = tg.create_task(risky(1))
        t3 = tg.create_task(risky(3))
    results = [t1.result(), t3.result()]
```

---

### Q13: What is `asyncio.Queue` and how do you implement a producer-consumer pattern?

**Answer:**

`asyncio.Queue` is a coroutine-safe FIFO queue — no locks needed because everything runs on the same thread.

```python
import asyncio, random

async def producer(queue: asyncio.Queue, n: int) -> None:
    for i in range(n):
        item = random.randint(1, 100)
        await queue.put(item)
        print(f"Produced {item}")
        await asyncio.sleep(0.1)
    await queue.put(None)           # sentinel to stop consumer

async def consumer(queue: asyncio.Queue) -> None:
    while True:
        item = await queue.get()
        if item is None:
            break
        print(f"Consumed {item}")
        queue.task_done()

async def main():
    q: asyncio.Queue[int | None] = asyncio.Queue(maxsize=5)
    await asyncio.gather(producer(q, 10), consumer(q))

asyncio.run(main())
```

---

### Q14: How do you run blocking (CPU/IO) code inside an async application?

**Answer:**

Calling a blocking function directly inside a coroutine **blocks the entire event loop**. Solutions:

```python
import asyncio, time
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

def blocking_io():
    time.sleep(1)           # simulates slow DB/network call
    return "done"

def cpu_heavy(n):
    return sum(i * i for i in range(n))

async def main():
    loop = asyncio.get_event_loop()

    # I/O-bound blocking → ThreadPoolExecutor
    result = await loop.run_in_executor(None, blocking_io)
    print(result)

    # CPU-bound → ProcessPoolExecutor (bypasses GIL)
    with ProcessPoolExecutor() as pool:
        result = await loop.run_in_executor(pool, cpu_heavy, 10_000_000)
    print(result)

asyncio.run(main())
```

`asyncio.to_thread()` (3.9+) is a shorthand for `run_in_executor(None, ...)`.

---

### Q15: What is an async context manager and async iterator? Implement both.

**Answer:**

```python
import asyncio
from typing import AsyncIterator

# --- Async context manager ---
class AsyncDBConnection:
    async def __aenter__(self):
        print("Opening DB connection")
        await asyncio.sleep(0.1)    # simulate async connect
        return self

    async def __aexit__(self, exc_type, exc, tb):
        print("Closing DB connection")
        await asyncio.sleep(0.05)

    async def query(self, sql: str) -> list:
        await asyncio.sleep(0.1)
        return [{"id": 1}]

async def use_db():
    async with AsyncDBConnection() as db:
        rows = await db.query("SELECT 1")
        print(rows)

# --- Async generator / iterator ---
async def paginate(url: str, pages: int = 3) -> AsyncIterator[dict]:
    for page in range(1, pages + 1):
        await asyncio.sleep(0.1)    # simulate HTTP call
        yield {"page": page, "data": [page * 10]}

async def consume():
    async for page in paginate("https://api.example.com/items"):
        print(page)

asyncio.run(use_db())
asyncio.run(consume())
```

---

### Q16: How do you handle timeouts and cancellation in asyncio?

**Answer:**

```python
import asyncio

async def slow_task():
    try:
        await asyncio.sleep(10)
    except asyncio.CancelledError:
        print("Task was cancelled — cleaning up")
        raise                          # always re-raise CancelledError

async def main():
    # --- timeout ---
    try:
        async with asyncio.timeout(2.0):    # Python 3.11+
            await slow_task()
    except TimeoutError:
        print("Timed out")

    # --- manual cancellation ---
    task = asyncio.create_task(slow_task())
    await asyncio.sleep(1)
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        print("Caught cancellation at caller")

asyncio.run(main())
```

**Rule:** Never swallow `CancelledError` — always re-raise after cleanup so the event loop knows the task is done.

---

## 4. Threading & the GIL

---

### Q17: What is the GIL? How does it affect CPU-bound vs I/O-bound threads?

**Answer:**

The **Global Interpreter Lock (GIL)** is a mutex in CPython that allows only one thread to execute Python bytecode at a time.

- **I/O-bound threads** — GIL is *released* during I/O system calls (file, network, `time.sleep`). Multiple threads make real progress concurrently.
- **CPU-bound threads** — GIL is *held* during computation. True parallelism is impossible; threads take turns, adding overhead from lock contention.

```
CPU-bound with 4 threads: SLOWER than single-threaded (GIL thrashing)
I/O-bound with 4 threads: ~4× faster (GIL released during wait)
```

**Solutions for CPU-bound work:**
- `multiprocessing` — separate processes, each with own GIL.
- `concurrent.futures.ProcessPoolExecutor`.
- C extensions that release the GIL (NumPy, Cython with `nogil`).
- Python 3.13+ introduces **per-interpreter GIL** (opt-in free-threading, experimental).

---

### Q18: Explain `threading.Lock`, `RLock`, `Semaphore`, and `Event`. When would you use each?

**Answer:**

```python
import threading, time

# Lock — mutual exclusion
counter = 0
lock = threading.Lock()

def increment():
    global counter
    with lock:
        counter += 1

# RLock — reentrant (same thread can acquire multiple times)
rlock = threading.RLock()

def outer():
    with rlock:
        inner()          # safe — same thread re-acquires

def inner():
    with rlock:          # would deadlock with plain Lock
        pass

# Semaphore — limit concurrent access (e.g., connection pool)
sem = threading.Semaphore(3)   # max 3 threads at once

def limited_task():
    with sem:
        time.sleep(1)

# Event — signal between threads
ready = threading.Event()

def worker():
    ready.wait()           # block until event is set
    print("Worker running")

def controller():
    time.sleep(1)
    ready.set()            # unblock all waiting threads

t = threading.Thread(target=worker)
t.start()
controller()
t.join()
```

---

### Q19: What is a race condition? Demonstrate one and fix it.

**Answer:**

A race condition occurs when the outcome depends on the non-deterministic interleaving of threads.

```python
import threading

# BROKEN — race condition
balance = 1000

def withdraw(amount):
    global balance
    if balance >= amount:
        # Thread A reads balance=1000, Thread B reads balance=1000
        # Both pass the if-check → both withdraw → balance goes negative
        balance -= amount

threads = [threading.Thread(target=withdraw, args=(800,)) for _ in range(2)]
for t in threads: t.start()
for t in threads: t.join()
print(balance)   # -600 possible!

# FIXED
lock = threading.Lock()
balance = 1000

def safe_withdraw(amount):
    global balance
    with lock:                      # atomic check-and-modify
        if balance >= amount:
            balance -= amount

threads = [threading.Thread(target=safe_withdraw, args=(800,)) for _ in range(2)]
for t in threads: t.start()
for t in threads: t.join()
print(balance)   # 200 — correct
```

---

### Q20: Implement a thread-safe producer-consumer queue using `queue.Queue`.

**Answer:**

`queue.Queue` is already thread-safe (uses internal `threading.Lock`). Use `task_done()` + `join()` to wait for full completion.

```python
import threading
import queue
import time
import random

def producer(q: queue.Queue, n: int) -> None:
    for i in range(n):
        item = random.randint(1, 100)
        q.put(item)
        print(f"Produced {item}")
        time.sleep(0.05)
    q.put(None)                       # poison pill

def consumer(q: queue.Queue) -> None:
    while True:
        item = q.get()
        if item is None:
            q.task_done()
            break
        print(f"Consumed {item}")
        time.sleep(0.1)
        q.task_done()

q: queue.Queue[int | None] = queue.Queue(maxsize=10)
p = threading.Thread(target=producer, args=(q, 10))
c = threading.Thread(target=consumer, args=(q,))

p.start()
c.start()
q.join()                              # blocks until all task_done() called
p.join()
c.join()
```

---

### Q21: What is a deadlock? Show a minimal example and two ways to prevent it.

**Answer:**

A deadlock occurs when two or more threads hold a lock the other needs.

```python
import threading

lock_a = threading.Lock()
lock_b = threading.Lock()

def thread_1():
    with lock_a:
        with lock_b:    # waits for lock_b held by thread_2
            pass

def thread_2():
    with lock_b:
        with lock_a:    # waits for lock_a held by thread_1
            pass
```

**Prevention:**

1. **Lock ordering** — always acquire locks in a globally consistent order.

```python
def safe(first, second):
    # Sort by id() to establish a canonical order
    first, second = sorted([first, second], key=id)
    with first:
        with second:
            pass
```

2. **Timeout** — use `lock.acquire(timeout=1)` and back off on failure.

```python
def safe_acquire(lock_a, lock_b, timeout=1.0):
    while True:
        if lock_a.acquire(timeout=timeout):
            if lock_b.acquire(timeout=timeout):
                return True
            lock_a.release()
        time.sleep(random.uniform(0, 0.1))   # random back-off
```

---

### Q22: What is `threading.local` and when do you need it?

**Answer:**

`threading.local()` creates a storage object where each thread has its own independent copy of each attribute — useful for per-thread state like DB connections or user context without lock overhead.

```python
import threading

_local = threading.local()

def get_connection():
    if not hasattr(_local, "conn"):
        _local.conn = f"conn-{threading.current_thread().name}"
    return _local.conn

def worker():
    conn = get_connection()
    print(conn)            # each thread prints its own connection

threads = [threading.Thread(target=worker, name=f"T{i}") for i in range(3)]
for t in threads: t.start()
for t in threads: t.join()
# T0: conn-T0    T1: conn-T1    T2: conn-T2
```

---

## 5. Multiprocessing

---

### Q23: `multiprocessing.Pool` vs `ProcessPoolExecutor` — what are the differences?

**Answer:**

| | `multiprocessing.Pool` | `ProcessPoolExecutor` |
|---|---|---|
| API style | Lower-level, more options | `concurrent.futures` standard interface |
| Result handling | `map`, `imap`, `apply_async` | `submit` → `Future`, `map` |
| Exception | Raised on `.get()` | Raised on `.result()` |
| `asyncio` integration | Manual | `loop.run_in_executor(pool, fn)` |
| Cancellation | Limited | `future.cancel()` |

```python
from concurrent.futures import ProcessPoolExecutor
import os

def cpu_task(n: int) -> int:
    return sum(i * i for i in range(n))

if __name__ == "__main__":       # REQUIRED on Windows — guard spawn
    with ProcessPoolExecutor(max_workers=os.cpu_count()) as pool:
        futures = [pool.submit(cpu_task, 10_000_000) for _ in range(4)]
        results = [f.result() for f in futures]
    print(results)
```

---

### Q24: How does inter-process communication work? Compare `Pipe`, `Queue`, and shared memory.

**Answer:**

```python
from multiprocessing import Process, Pipe, Queue, Value, Array
import ctypes

# --- Pipe (bidirectional, two ends) ---
def pipe_worker(conn):
    conn.send("hello from child")
    conn.close()

parent_conn, child_conn = Pipe()
p = Process(target=pipe_worker, args=(child_conn,))
p.start()
print(parent_conn.recv())    # "hello from child"
p.join()

# --- Queue (multiple producers/consumers) ---
def queue_worker(q: Queue):
    q.put("item from child")

q = Queue()
p = Process(target=queue_worker, args=(q,))
p.start()
print(q.get())               # "item from child"
p.join()

# --- Shared Memory (fastest, no serialisation) ---
shared_val = Value(ctypes.c_int, 0)

def increment(val):
    with val.get_lock():
        val.value += 1

processes = [Process(target=increment, args=(shared_val,)) for _ in range(4)]
for proc in processes: proc.start()
for proc in processes: proc.join()
print(shared_val.value)      # 4
```

---

### Q25: Why must you use `if __name__ == "__main__"` with multiprocessing on Windows?

**Answer:**

On **Windows**, the `spawn` start method (default) creates new Python interpreter processes by importing the main module. Without the guard, each child process re-executes the top-level code, spawning more children recursively — a **fork bomb**.

On **Linux/macOS**, the default is `fork` (copies parent memory), so the guard is not strictly required but is still best practice for portability.

```python
# WRONG on Windows
from multiprocessing import Pool
pool = Pool(4)           # This line runs in every spawned child → infinite recursion

# CORRECT
from multiprocessing import Pool

def work(x): return x * x

if __name__ == "__main__":
    with Pool(4) as pool:
        print(pool.map(work, range(10)))
```

---

## 6. Concurrency Patterns & Pitfalls

---

### Q26: When would you choose threading, multiprocessing, or asyncio?

**Answer:**

| Scenario | Best choice | Reason |
|---|---|---|
| Many simultaneous network/file I/O | `asyncio` | Single thread, no context-switch overhead |
| Blocking third-party libraries (DB drivers, legacy code) | `threading` | GIL released during I/O |
| CPU-bound computation (image, ML, parsing) | `multiprocessing` | True parallelism, bypasses GIL |
| Mixed CPU + I/O | `ProcessPoolExecutor` inside `asyncio` | Best of both |
| Simple scripts, moderate I/O | `threading` or `asyncio` | Simpler than multiprocessing |

**Heuristic:**
```
async if possible → threading if blocking → multiprocessing if CPU-bound
```

---

### Q27: What is the difference between `concurrent.futures.as_completed` and `map`?

**Answer:**

```python
from concurrent.futures import ThreadPoolExecutor, as_completed
import time, random

def task(n):
    time.sleep(random.uniform(0.1, 1.0))
    return n * n

with ThreadPoolExecutor(max_workers=4) as ex:

    # map — results in submission ORDER (waits for each in order)
    for result in ex.map(task, range(5)):
        print("map:", result)

    # as_completed — results as they FINISH (fastest first)
    futures = {ex.submit(task, n): n for n in range(5)}
    for future in as_completed(futures):
        n = futures[future]
        print(f"as_completed: task({n}) = {future.result()}")
```

Use `as_completed` when you want to process results immediately as they arrive (e.g., streaming UI updates, early exit on first result).

---

### Q28: What are common async pitfalls? List and explain at least four.

**Answer:**

**1. Blocking the event loop**
```python
# BAD
async def bad():
    time.sleep(5)          # blocks entire event loop for 5s

# GOOD
async def good():
    await asyncio.sleep(5) # yields; other tasks run
```

**2. Forgetting to `await` a coroutine**
```python
async def fetch(): return 42

async def main():
    result = fetch()       # returns coroutine object, not 42!
    result = await fetch() # correct
```

**3. Swallowing `CancelledError`**
```python
async def bad():
    try:
        await asyncio.sleep(10)
    except Exception:      # catches CancelledError too!
        pass               # task never properly cancelled

async def good():
    try:
        await asyncio.sleep(10)
    except asyncio.CancelledError:
        # cleanup
        raise              # always re-raise
```

**4. Shared mutable state across coroutines without synchronisation**
```python
# Even on one thread, a context switch at await can cause inconsistency
count = 0

async def increment():
    global count
    tmp = count
    await asyncio.sleep(0)   # yield — another coroutine may run here
    count = tmp + 1

# Fix: use asyncio.Lock
lock = asyncio.Lock()
async def safe_increment():
    async with lock:
        count += 1
```

**5. Creating tasks without keeping a reference**
```python
# BAD — task may be garbage collected
asyncio.create_task(some_coro())

# GOOD
tasks = set()
t = asyncio.create_task(some_coro())
tasks.add(t)
t.add_done_callback(tasks.discard)
```

---

### Q29: Implement a rate limiter for async HTTP calls using a Semaphore.

**Answer:**

```python
import asyncio
import aiohttp

async def fetch(session: aiohttp.ClientSession, url: str, sem: asyncio.Semaphore) -> dict:
    async with sem:                        # at most N concurrent requests
        async with session.get(url) as resp:
            return await resp.json()

async def main():
    urls = [f"https://jsonplaceholder.typicode.com/todos/{i}" for i in range(1, 21)]
    sem = asyncio.Semaphore(5)             # max 5 concurrent requests

    async with aiohttp.ClientSession() as session:
        tasks = [fetch(session, url, sem) for url in urls]
        results = await asyncio.gather(*tasks)
    print(f"Fetched {len(results)} items")

asyncio.run(main())
```

---

### Q30: Explain `asyncio` structured concurrency with `TaskGroup` and why it's better than `gather`.

**Answer:**

`asyncio.gather` has subtle issues:
- Cancellation behaviour is inconsistent across Python versions.
- Exceptions from one task don't automatically cancel siblings.
- No clear ownership — tasks can outlive their creating scope.

`TaskGroup` (Python 3.11+, PEP 654) enforces **structured concurrency**:
- All tasks in the group are cancelled if any fails.
- The `async with` block doesn't exit until **all** tasks complete.
- Exceptions are collected into an `ExceptionGroup`.

```python
import asyncio

async def work(n: int) -> int:
    await asyncio.sleep(n * 0.1)
    if n == 3:
        raise ValueError(f"Task {n} failed")
    return n

async def main():
    try:
        async with asyncio.TaskGroup() as tg:
            t1 = tg.create_task(work(1))
            t2 = tg.create_task(work(2))
            t3 = tg.create_task(work(3))   # will raise
            t4 = tg.create_task(work(4))
        # t4 is automatically cancelled when t3 raises
    except* ValueError as eg:
        print(f"Errors: {eg.exceptions}")

    # Safe to check completed tasks
    # t1.result(), t2.result() accessible if they finished before cancellation

asyncio.run(main())
```

---

*End of Python OOP · Async · Threading Interview Guide*
