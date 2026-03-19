# Python asyncio — Expert Mastery Path
### Complete Learning Roadmap + Interview Q&A (Beginner → Expert)

---

## Learning Roadmap

```
Phase 1 — Foundations          (Week 1-2)
  └─ Sync vs async mental model, event loop basics, coroutines

Phase 2 — Core Primitives      (Week 2-3)
  └─ Tasks, gather, wait, timeouts, cancellation

Phase 3 — Synchronisation      (Week 3-4)
  └─ Lock, Event, Condition, Semaphore, Queue

Phase 4 — I/O & Protocols      (Week 4-5)
  └─ Streams, subprocesses, transports, protocols

Phase 5 — Patterns & Design    (Week 5-6)
  └─ Producer/consumer, rate limiting, circuit breaker, backpressure

Phase 6 — Advanced Internals   (Week 6-8)
  └─ Event loop implementations, uvloop, custom executors,
     integration with sync code, debugging, profiling
```

---

## Table of Contents

1. [Phase 1 — Foundations](#phase-1--foundations)
2. [Phase 2 — Core Task Primitives](#phase-2--core-task-primitives)
3. [Phase 3 — Synchronisation Primitives](#phase-3--synchronisation-primitives)
4. [Phase 4 — I/O Streams & Protocols](#phase-4--io-streams--protocols)
5. [Phase 5 — Real-World Patterns](#phase-5--real-world-patterns)
6. [Phase 6 — Internals, Performance & Debugging](#phase-6--internals-performance--debugging)
7. [Quick-Reference Cheat Sheet](#quick-reference-cheat-sheet)

---

## Phase 1 — Foundations

---

### Q1: What is the difference between concurrency and parallelism? Where does asyncio fit?

**Answer:**

| Concept | Meaning | Python mechanism |
|---|---|---|
| **Concurrency** | Multiple tasks *in progress* at the same time (interleaved) | asyncio, threading |
| **Parallelism** | Multiple tasks *running* at the same time (simultaneous CPUs) | multiprocessing, concurrent.futures |
| **asyncio** | Single-threaded concurrency via cooperative multitasking | event loop + coroutines |

asyncio achieves concurrency without threads. Tasks voluntarily yield control at `await` points, letting the event loop run other tasks. CPU-bound work blocks the loop because no yield happens.

```
Thread model:    T1 ---|------|------>
                 T2 ------|------|-->   (OS preempts, truly parallel w/ multicore)

asyncio model:   single thread
                 task A runs → hits await → pauses
                 task B runs → hits await → pauses
                 task A resumes ...       (cooperative, interleaved)
```

---

### Q2: What is a coroutine? How is it different from a regular function and a generator?

**Answer:**

| Kind | Defined with | Returns | Suspended by |
|---|---|---|---|
| Regular function | `def` | value directly | never |
| Generator | `def` + `yield` | generator object | `yield` |
| Coroutine | `async def` | coroutine object | `await` |

```python
import asyncio

# Regular function — executes immediately
def greet():
    return "hello"

# Coroutine — does NOT run until awaited or scheduled
async def greet_async():
    await asyncio.sleep(1)   # yield control here
    return "hello"

# calling it returns a coroutine object, doesn't run yet
coro = greet_async()          # <coroutine object greet_async at 0x...>

# must be driven by the event loop
result = asyncio.run(greet_async())   # "hello"
```

A coroutine is a **paused function** whose execution state (local variables, instruction pointer) is preserved between suspensions.

---

### Q3: What is the event loop and what does it actually do?

**Answer:**

The event loop is the engine that drives all async code. Its job:

1. Maintain a **ready queue** of callbacks/tasks that can run now
2. Maintain a **I/O poll set** (using `select`/`epoll`/`kqueue`)
3. Each iteration ("tick"):
   - Run all ready callbacks
   - Poll I/O with a timeout equal to the nearest scheduled callback
   - Move completed I/O callbacks to the ready queue
   - Run scheduled timers that have expired

```python
import asyncio

loop = asyncio.get_event_loop()   # get (or create) loop for current thread

# Low-level — run until a coroutine completes
loop.run_until_complete(my_coroutine())

# High-level (Python 3.7+) — preferred
asyncio.run(my_coroutine())       # creates a NEW loop, runs it, closes it
```

**Key rule:** Only ONE coroutine runs at a time inside the loop. The loop is single-threaded.

---

### Q4: Explain `async def`, `await`, `asyncio.run()`, and `asyncio.sleep()`.

**Answer:**

```python
import asyncio

async def fetch_data(url: str) -> str:
    """
    async def — marks a coroutine function.
    Calling it returns a coroutine object; nothing runs yet.
    """
    print(f"Fetching {url}")
    await asyncio.sleep(2)   # await — suspends THIS coroutine, loop runs others
    return f"data from {url}"

async def main():
    result = await fetch_data("https://example.com")
    # await here means: "run fetch_data to completion before continuing"
    print(result)

asyncio.run(main())   # creates event loop, runs main(), closes loop
```

- `async def` → defines a coroutine function
- `await expr` → suspends current coroutine until `expr` is done; `expr` must be *awaitable* (coroutine, Task, Future, or object with `__await__`)
- `asyncio.sleep(n)` → yields control back to the loop for `n` seconds (non-blocking unlike `time.sleep`)
- `asyncio.run(coro)` → top-level entry point; always use this instead of manually managing loops

---

### Q5: What is an awaitable? List all awaitable types.

**Answer:**

An **awaitable** is any object accepted by `await`. Three kinds:

| Awaitable | Description | Example |
|---|---|---|
| **Coroutine** | Result of calling `async def` function | `await fetch()` |
| **Task** | Wraps a coroutine and schedules it concurrently | `await asyncio.create_task(fetch())` |
| **Future** | Low-level promise of a result | `await loop.create_future()` |

Any object implementing `__await__` (returns an iterator) is also awaitable — this is how custom awaitables are built.

```python
import asyncio

class MyAwaitable:
    def __await__(self):
        # Must return an iterator
        # A future's __await__ suspends until the future is resolved
        future = asyncio.get_event_loop().create_future()
        future.set_result(42)
        return future.__await__()

async def main():
    result = await MyAwaitable()
    print(result)  # 42
```

---

### Q6: What happens if you call `time.sleep()` inside a coroutine?

**Answer:**

It **blocks the entire event loop**. Since asyncio is single-threaded, `time.sleep()` occupies the thread completely — no other coroutine can run during that time.

```python
import asyncio, time

async def bad():
    time.sleep(3)          # BLOCKS event loop for 3 seconds
    return "done"

async def good():
    await asyncio.sleep(3) # YIELDS control; other coroutines run
    return "done"
```

**Rule:** Never call blocking code (file I/O, `time.sleep`, CPU-heavy loops, sync DB drivers) directly in a coroutine. Use `asyncio.sleep`, async libraries, or `loop.run_in_executor()`.

---

## Phase 2 — Core Task Primitives

---

### Q7: What is a `Task`? How is it different from a coroutine?

**Answer:**

A **Task** wraps a coroutine and **schedules it to run concurrently** on the event loop. A bare coroutine only runs when you explicitly `await` it (sequentially).

```python
import asyncio

async def fetch(name: str, delay: float) -> str:
    await asyncio.sleep(delay)
    return f"{name} done"

# SEQUENTIAL — total time ~3s
async def sequential():
    r1 = await fetch("A", 1)
    r2 = await fetch("B", 2)
    return r1, r2

# CONCURRENT — total time ~2s (max of delays)
async def concurrent():
    task1 = asyncio.create_task(fetch("A", 1))
    task2 = asyncio.create_task(fetch("B", 2))
    r1 = await task1
    r2 = await task2
    return r1, r2
```

`create_task()` schedules the coroutine immediately on the loop. The task runs in the background while your coroutine continues to the next line.

---

### Q8: Explain `asyncio.gather()` vs `asyncio.wait()` vs `asyncio.wait_for()`.

**Answer:**

#### `asyncio.gather(*awaitables, return_exceptions=False)`
- Runs all awaitables **concurrently**
- Returns results **in the same order as inputs** (not completion order)
- If `return_exceptions=False`: first exception cancels remaining and re-raises
- If `return_exceptions=True`: exceptions are returned as results

```python
async def main():
    results = await asyncio.gather(
        fetch("A", 1),
        fetch("B", 2),
        fetch("C", 0.5),
        return_exceptions=True
    )
    # results[0] = "A done", results[1] = "B done", results[2] = "C done"
    # (order matches input, not completion)
```

#### `asyncio.wait(tasks, timeout=None, return_when=...)`
- Returns `(done_set, pending_set)` of **Task** objects
- Gives more control — inspect individual tasks, their exceptions, etc.
- `return_when`: `ALL_COMPLETED`, `FIRST_COMPLETED`, `FIRST_EXCEPTION`

```python
async def main():
    tasks = {asyncio.create_task(fetch(n, d)) for n, d in [("A",1),("B",2)]}
    done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
    for t in done:
        print(t.result())
    for t in pending:
        t.cancel()
```

#### `asyncio.wait_for(aw, timeout)`
- Runs a single awaitable with a **timeout**
- Raises `asyncio.TimeoutError` if it doesn't complete in time
- **Cancels** the wrapped task on timeout

```python
async def main():
    try:
        result = await asyncio.wait_for(fetch("A", 5), timeout=2.0)
    except asyncio.TimeoutError:
        print("took too long!")
```

**Summary:**

| Function | Use when |
|---|---|
| `gather` | Run N tasks, collect all results in order |
| `wait` | Run N tasks, need fine-grained control (first done, cancel others) |
| `wait_for` | Single task with a deadline |

---

### Q9: How does task cancellation work? What is `CancelledError`?

**Answer:**

Calling `task.cancel()` schedules a `CancelledError` to be raised at the task's next `await` point.

```python
import asyncio

async def worker():
    try:
        print("working...")
        await asyncio.sleep(10)
        print("done")              # never reached if cancelled
    except asyncio.CancelledError:
        print("I was cancelled — cleaning up")
        raise                      # IMPORTANT: always re-raise CancelledError

async def main():
    task = asyncio.create_task(worker())
    await asyncio.sleep(1)
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        print("task is cancelled")
```

**Critical rules:**
1. Always `raise` inside `except asyncio.CancelledError` — swallowing it prevents proper propagation
2. In Python 3.8+ `CancelledError` is a subclass of `BaseException` (not `Exception`) — bare `except Exception` won't catch it
3. Use `asyncio.shield(coro)` to protect a coroutine from cancellation

```python
# shield — protect inner work from outer cancellation
result = await asyncio.shield(important_db_write())
```

---

### Q10: What is `asyncio.TaskGroup` (Python 3.11+)? Why prefer it over `gather`?

**Answer:**

`TaskGroup` is a context manager that manages a group of tasks. If **any** task raises an exception, all others are cancelled and an `ExceptionGroup` is raised — no silent failures.

```python
import asyncio

async def main():
    async with asyncio.TaskGroup() as tg:
        task1 = tg.create_task(fetch("A", 1))
        task2 = tg.create_task(fetch("B", 2))
    # All tasks complete before this line
    print(task1.result(), task2.result())
```

**vs gather:**

| | `gather` | `TaskGroup` |
|---|---|---|
| Error propagation | depends on `return_exceptions` | always raises `ExceptionGroup` |
| Cancellation | partial/complex | automatic, consistent |
| Structured | no | yes (structured concurrency) |
| Python version | 3.4+ | 3.11+ |

`TaskGroup` enforces **structured concurrency** — tasks cannot outlive the scope that created them.

---

### Q11: What is `asyncio.as_completed()`?

**Answer:**

Returns an iterator of futures that yield results **in completion order** (not creation order).

```python
import asyncio

async def fetch(name, delay):
    await asyncio.sleep(delay)
    return f"{name} done"

async def main():
    coros = [fetch("slow", 3), fetch("fast", 1), fetch("medium", 2)]
    for future in asyncio.as_completed(coros):
        result = await future
        print(result)   # prints: fast done, medium done, slow done

asyncio.run(main())
```

Use `as_completed` when you want to process results as they arrive (e.g., display progress, fail fast).

---

## Phase 3 — Synchronisation Primitives

---

### Q12: When do you need synchronisation in asyncio? Isn't it single-threaded?

**Answer:**

asyncio is single-threaded so you **don't** have race conditions from true parallelism. But coroutines interleave at `await` points, so shared mutable state **can** be corrupted:

```python
# BUG: counter is wrong
counter = 0

async def increment():
    global counter
    val = counter          # read
    await asyncio.sleep(0) # yield — another coroutine can modify counter here!
    counter = val + 1      # write stale value

async def main():
    await asyncio.gather(*[increment() for _ in range(100)])
    print(counter)   # NOT 100
```

asyncio sync primitives: `Lock`, `Event`, `Condition`, `Semaphore`, `BoundedSemaphore`, `Queue`.

**Key difference from threading:** These primitives do **not** block the thread — they yield control while waiting.

---

### Q13: Explain `asyncio.Lock`. Provide a correct usage example.

**Answer:**

`Lock` ensures only one coroutine accesses a resource at a time.

```python
import asyncio

counter = 0
lock = asyncio.Lock()

async def safe_increment():
    global counter
    async with lock:          # acquire; others wait (yield) here
        val = counter
        await asyncio.sleep(0)
        counter = val + 1
    # lock auto-released on exit

async def main():
    await asyncio.gather(*[safe_increment() for _ in range(100)])
    print(counter)   # 100 — correct

asyncio.run(main())
```

**Pitfall:** Never use `threading.Lock` in async code — it blocks the event loop thread.

---

### Q14: Explain `asyncio.Event` with example.

**Answer:**

`Event` is a flag. Coroutines can wait until it's set.

```python
import asyncio

ready = asyncio.Event()

async def producer():
    print("producing...")
    await asyncio.sleep(2)
    ready.set()              # signal all waiters
    print("produced!")

async def consumer(name: str):
    print(f"{name} waiting for data...")
    await ready.wait()       # blocks until set() is called
    print(f"{name} got data!")

async def main():
    await asyncio.gather(
        producer(),
        consumer("C1"),
        consumer("C2"),
    )
```

`Event.clear()` resets it. `Event.is_set()` checks without waiting.

---

### Q15: Explain `asyncio.Semaphore`. When would you use it?

**Answer:**

`Semaphore` limits concurrent access to a resource to N coroutines at a time.

**Classic use case:** Rate-limiting HTTP requests.

```python
import asyncio
import aiohttp

sem = asyncio.Semaphore(10)   # max 10 concurrent requests

async def fetch(session, url):
    async with sem:            # acquire one slot
        async with session.get(url) as resp:
            return await resp.text()

async def main():
    urls = [f"https://example.com/{i}" for i in range(100)]
    async with aiohttp.ClientSession() as session:
        results = await asyncio.gather(*[fetch(session, url) for url in urls])
```

Without the semaphore, all 100 requests would be fired simultaneously — potentially overwhelming the server or hitting rate limits.

---

### Q16: Explain `asyncio.Queue`. Compare to `queue.Queue`.

**Answer:**

`asyncio.Queue` is the async-safe producer/consumer queue.

```python
import asyncio

async def producer(q: asyncio.Queue):
    for i in range(5):
        await asyncio.sleep(0.5)
        await q.put(i)          # put blocks if queue is full
        print(f"produced {i}")
    await q.put(None)           # sentinel to signal done

async def consumer(q: asyncio.Queue):
    while True:
        item = await q.get()    # get blocks if queue is empty
        if item is None:
            break
        print(f"consumed {item}")
        q.task_done()           # signal item processed

async def main():
    q = asyncio.Queue(maxsize=3)   # buffer of 3
    await asyncio.gather(producer(q), consumer(q))
```

| Feature | `asyncio.Queue` | `queue.Queue` |
|---|---|---|
| Thread-safe | No (single-threaded) | Yes |
| Blocks event loop? | No — yields | Yes — blocks thread |
| `await q.get()` | yes | no |

---

### Q17: What is `asyncio.Condition`? Give an example.

**Answer:**

`Condition` combines a `Lock` with the ability to wait for a specific state change. It's more flexible than `Event` (reusable, state-based).

```python
import asyncio

condition = asyncio.Condition()
data = []

async def producer():
    for i in range(3):
        async with condition:
            data.append(i)
            condition.notify_all()   # wake all waiting consumers
        await asyncio.sleep(1)

async def consumer(name):
    async with condition:
        await condition.wait_for(lambda: len(data) >= 3)  # wait until predicate
        print(f"{name} sees: {data}")

async def main():
    await asyncio.gather(producer(), consumer("C1"), consumer("C2"))
```

Use `Condition` when multiple coroutines need to react to a state change (not just a one-time signal).

---

## Phase 4 — I/O Streams & Protocols

---

### Q18: How do you do non-blocking file I/O in asyncio?

**Answer:**

The standard `open()` / file read/write **is blocking** and will stall the loop. Options:

**Option 1 — `aiofiles` library (recommended)**
```python
import asyncio
import aiofiles

async def read_file(path: str) -> str:
    async with aiofiles.open(path, "r") as f:
        return await f.read()

async def main():
    content = await read_file("data.txt")
    print(content)
```

**Option 2 — `run_in_executor` with threadpool**
```python
import asyncio

async def read_file_executor(path: str) -> str:
    loop = asyncio.get_running_loop()
    with open(path, "r") as f:
        # run sync I/O in thread pool, doesn't block the loop
        return await loop.run_in_executor(None, f.read)
```

---

### Q19: How do asyncio streams work? Write a simple TCP server/client.

**Answer:**

`asyncio.start_server` / `asyncio.open_connection` provide high-level TCP streams.

```python
import asyncio

# --- SERVER ---
async def handle_client(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
    addr = writer.get_extra_info("peername")
    print(f"Connected: {addr}")

    data = await reader.read(1024)
    message = data.decode()
    print(f"Received: {message}")

    writer.write(f"Echo: {message}".encode())
    await writer.drain()   # flush the write buffer
    writer.close()
    await writer.wait_closed()

async def run_server():
    server = await asyncio.start_server(handle_client, "127.0.0.1", 8888)
    async with server:
        await server.serve_forever()

# --- CLIENT ---
async def run_client():
    reader, writer = await asyncio.open_connection("127.0.0.1", 8888)
    writer.write(b"Hello server!")
    await writer.drain()

    response = await reader.read(1024)
    print(f"Got: {response.decode()}")
    writer.close()
    await writer.wait_closed()
```

`StreamReader.read(n)` / `readline()` are non-blocking awaits.
`StreamWriter.write()` buffers; **always `await writer.drain()`** to flush and apply backpressure.

---

### Q20: What is `loop.run_in_executor()`? When is it essential?

**Answer:**

It runs a **blocking (sync) function** in a thread pool (or process pool), returning a Future that the event loop can await without blocking.

```python
import asyncio
import concurrent.futures
import time

def blocking_cpu_task(n: int) -> int:
    time.sleep(2)           # simulate slow sync work
    return n * n

async def main():
    loop = asyncio.get_running_loop()

    # Default ThreadPoolExecutor (good for I/O-bound blocking code)
    result = await loop.run_in_executor(None, blocking_cpu_task, 10)
    print(result)  # 100

    # ProcessPoolExecutor (good for CPU-bound code — bypasses GIL)
    with concurrent.futures.ProcessPoolExecutor() as pool:
        result = await loop.run_in_executor(pool, blocking_cpu_task, 20)
        print(result)  # 400

asyncio.run(main())
```

**When to use:**
- Calling sync database drivers (psycopg2, pymysql)
- Using libraries with no async support
- CPU-heavy computation (use ProcessPoolExecutor)

---

### Q21: Explain the Transport/Protocol abstraction in asyncio.

**Answer:**

Low-level asyncio I/O model: two objects work together.

- **Transport** — handles the actual I/O (TCP socket, pipe, SSL). It knows *how* to send/receive bytes.
- **Protocol** — handles the *logic*. Callbacks are called by the transport.

```python
import asyncio

class EchoServerProtocol(asyncio.Protocol):
    def connection_made(self, transport: asyncio.Transport):
        self.transport = transport
        addr = transport.get_extra_info("peername")
        print(f"Connection from {addr}")

    def data_received(self, data: bytes):
        message = data.decode()
        print(f"Received: {message}")
        self.transport.write(data)   # echo back

    def connection_lost(self, exc):
        print("Connection closed")

async def main():
    loop = asyncio.get_running_loop()
    server = await loop.create_server(
        lambda: EchoServerProtocol(),
        "127.0.0.1", 8888
    )
    async with server:
        await server.serve_forever()
```

**Hierarchy:** Protocol/Transport → used internally by Streams (higher-level API). Use Streams for application code; use Protocol/Transport when building libraries or need performance control.

---

## Phase 5 — Real-World Patterns

---

### Q22: Implement a rate-limited async HTTP client (max N requests/second).

**Answer:**

```python
import asyncio
import time
import aiohttp

class RateLimiter:
    """Token bucket rate limiter."""
    def __init__(self, rate: int):
        self.rate = rate          # tokens per second
        self._tokens = rate
        self._last = time.monotonic()
        self._lock = asyncio.Lock()

    async def acquire(self):
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self._last
            self._tokens += elapsed * self.rate
            self._tokens = min(self._tokens, self.rate)
            self._last = now
            if self._tokens < 1:
                sleep_time = (1 - self._tokens) / self.rate
                await asyncio.sleep(sleep_time)
                self._tokens = 0
            else:
                self._tokens -= 1

limiter = RateLimiter(rate=5)   # 5 requests per second

async def fetch(session: aiohttp.ClientSession, url: str) -> str:
    await limiter.acquire()
    async with session.get(url) as resp:
        return await resp.text()

async def main():
    urls = [f"https://httpbin.org/get?i={i}" for i in range(20)]
    async with aiohttp.ClientSession() as session:
        results = await asyncio.gather(*[fetch(session, u) for u in urls])
    print(f"Fetched {len(results)} responses")
```

---

### Q23: Implement the Producer-Consumer pattern with asyncio.Queue.

**Answer:**

```python
import asyncio
import random

async def producer(queue: asyncio.Queue, n: int):
    for i in range(n):
        item = random.randint(1, 100)
        await queue.put(item)
        print(f"[Producer] put {item}")
        await asyncio.sleep(0.1)
    # Signal all consumers to stop
    for _ in range(3):             # number of consumers
        await queue.put(None)

async def consumer(name: str, queue: asyncio.Queue):
    while True:
        item = await queue.get()
        if item is None:
            print(f"[{name}] stopping")
            queue.task_done()
            break
        print(f"[{name}] processing {item}")
        await asyncio.sleep(0.2)   # simulate work
        queue.task_done()

async def main():
    queue = asyncio.Queue(maxsize=10)
    async with asyncio.TaskGroup() as tg:
        tg.create_task(producer(queue, 10))
        tg.create_task(consumer("C1", queue))
        tg.create_task(consumer("C2", queue))
        tg.create_task(consumer("C3", queue))

asyncio.run(main())
```

---

### Q24: How do you implement a circuit breaker in asyncio?

**Answer:**

```python
import asyncio
import time
from enum import Enum

class State(Enum):
    CLOSED = "closed"       # normal operation
    OPEN = "open"           # failing, reject requests
    HALF_OPEN = "half_open" # testing recovery

class CircuitBreaker:
    def __init__(self, failure_threshold=5, recovery_timeout=30):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = 0
        self.state = State.CLOSED

    async def call(self, coro_func, *args, **kwargs):
        if self.state == State.OPEN:
            if time.monotonic() - self.last_failure_time > self.recovery_timeout:
                self.state = State.HALF_OPEN
            else:
                raise RuntimeError("Circuit breaker OPEN — request rejected")

        try:
            result = await coro_func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise

    def _on_success(self):
        self.failure_count = 0
        self.state = State.CLOSED

    def _on_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.monotonic()
        if self.failure_count >= self.failure_threshold:
            self.state = State.OPEN

# Usage
cb = CircuitBreaker(failure_threshold=3, recovery_timeout=10)

async def unreliable_service():
    raise ConnectionError("service down")

async def main():
    for _ in range(5):
        try:
            await cb.call(unreliable_service)
        except Exception as e:
            print(f"Error: {e}, state={cb.state.value}")
```

---

### Q25: How do you handle backpressure in async pipelines?

**Answer:**

Backpressure prevents fast producers from overwhelming slow consumers.

```python
import asyncio

async def fast_producer(queue: asyncio.Queue):
    for i in range(100):
        await queue.put(i)   # blocks when queue is full — natural backpressure
        print(f"produced {i}")

async def slow_consumer(queue: asyncio.Queue):
    while True:
        item = await queue.get()
        await asyncio.sleep(0.5)   # slow processing
        print(f"consumed {item}")
        queue.task_done()

async def main():
    # maxsize=5 creates backpressure — producer blocks when buffer full
    queue = asyncio.Queue(maxsize=5)
    async with asyncio.TaskGroup() as tg:
        tg.create_task(fast_producer(queue))
        tg.create_task(slow_consumer(queue))
```

For **StreamWriter** backpressure: always use `await writer.drain()` after `writer.write()`. `drain()` yields until the write buffer is below the high-water mark.

---

### Q26: How do you integrate synchronous code safely with asyncio?

**Answer:**

Three scenarios:

**1. Calling sync code from async (run in executor)**
```python
import asyncio

async def main():
    loop = asyncio.get_running_loop()
    # Non-blocking: runs sync function in thread pool
    result = await loop.run_in_executor(None, sync_function, arg1, arg2)
```

**2. Calling async code from sync (run new event loop)**
```python
# In a sync context (e.g., Django view, script)
result = asyncio.run(async_function())   # creates+runs a new loop
```

**3. Running in an already-running loop (e.g., Jupyter)**
```python
import nest_asyncio
nest_asyncio.apply()    # patches asyncio to allow nested loops

import asyncio
asyncio.run(my_coro())  # now works in Jupyter
```

**Pitfall: calling `asyncio.run()` inside a running loop raises RuntimeError.**
```python
# RuntimeError: This event loop is already running
# Use asyncio.create_task() or await instead
```

---

## Phase 6 — Internals, Performance & Debugging

---

### Q27: How does the asyncio event loop work internally?

**Answer:**

Simplified event loop implementation concept:

```python
import selectors, collections, heapq, time

class SimpleEventLoop:
    def __init__(self):
        self._ready = collections.deque()     # callbacks ready to run now
        self._scheduled = []                  # (time, callback) heap
        self._selector = selectors.DefaultSelector()

    def call_soon(self, callback, *args):
        self._ready.append((callback, args))

    def call_later(self, delay, callback, *args):
        when = time.monotonic() + delay
        heapq.heappush(self._scheduled, (when, callback, args))

    def _run_once(self):
        # 1. Move due scheduled callbacks to ready
        now = time.monotonic()
        while self._scheduled and self._scheduled[0][0] <= now:
            when, cb, args = heapq.heappop(self._scheduled)
            self._ready.append((cb, args))

        # 2. Calculate I/O poll timeout
        timeout = 0 if self._ready else (
            self._scheduled[0][0] - now if self._scheduled else None
        )

        # 3. Poll I/O (epoll/kqueue/select)
        events = self._selector.select(timeout)
        for key, mask in events:
            callback, args = key.data
            self._ready.append((callback, args))

        # 4. Run all ready callbacks
        n = len(self._ready)
        for _ in range(n):
            callback, args = self._ready.popleft()
            callback(*args)

    def run_forever(self):
        while True:
            self._run_once()
```

Real asyncio uses `uvloop` (optional, libuv-based) or the built-in selector-based loop.

---

### Q28: What is `uvloop`? How much faster is it?

**Answer:**

`uvloop` is a drop-in replacement for the asyncio event loop, written in Cython and based on **libuv** (the same library used by Node.js).

**Performance:** 2–4x faster than the default asyncio loop for I/O-heavy workloads.

```python
import asyncio
import uvloop

# Method 1: replace globally
uvloop.install()   # must call before asyncio.run()
asyncio.run(main())

# Method 2: explicit policy
asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())

# Method 3: use uvloop.run() directly (preferred)
uvloop.run(main())
```

**When to use:** High-performance network servers (web APIs, WebSockets). Not needed for scripts or low-load services.

**Limitation:** Linux/macOS only. Windows is not supported.

---

### Q29: How do you debug asyncio applications? List tools and techniques.

**Answer:**

**1. Enable debug mode**
```python
# Catches: slow callbacks, unawaited coroutines, wrong thread calls
asyncio.run(main(), debug=True)
# or
import os; os.environ["PYTHONASYNCIODEBUG"] = "1"
```

**2. Logging**
```python
import logging
logging.basicConfig(level=logging.DEBUG)
# asyncio logs slow callbacks (> 100ms by default)
loop = asyncio.get_event_loop()
loop.slow_callback_duration = 0.05  # warn if callback > 50ms
```

**3. Inspect running tasks**
```python
import asyncio

async def main():
    # See all running tasks
    tasks = asyncio.all_tasks()
    for task in tasks:
        print(task.get_name(), task.get_coro())
        task.print_stack()   # prints coroutine stack trace
```

**4. `asyncio.current_task()` for task identity**
```python
async def worker():
    task = asyncio.current_task()
    print(f"Running as: {task.get_name()}")
```

**5. `aiomonitor` — live REPL for running async apps**
```bash
pip install aiomonitor
```
```python
import aiomonitor
async def main():
    with aiomonitor.start_monitor(loop=asyncio.get_running_loop()):
        await real_main()
```

**6. Detecting blocking calls**
Use `pytest-asyncio` + `asyncio` debug mode in tests.

**Common bugs to check:**
- Forgetting `await` (coroutine object created but never run — debug mode warns)
- `asyncio.sleep(0)` missing (starvation — one task monopolises loop)
- Using `threading.Lock` instead of `asyncio.Lock`
- Calling `asyncio.run()` inside a running loop

---

### Q30: What are common asyncio anti-patterns and how do you fix them?

**Answer:**

#### Anti-pattern 1: Forgetting `await`
```python
# BUG: returns coroutine object, doesn't execute
result = fetch_data()       # missing await

# FIX:
result = await fetch_data()
```
*Debug mode warns: "coroutine 'fetch_data' was never awaited"*

#### Anti-pattern 2: Swallowing `CancelledError`
```python
# BUG: prevents clean shutdown
async def bad():
    try:
        await asyncio.sleep(10)
    except Exception:          # catches CancelledError (BaseException in 3.8+)
        pass

# FIX:
async def good():
    try:
        await asyncio.sleep(10)
    except asyncio.CancelledError:
        # do cleanup
        raise   # ALWAYS re-raise
```

#### Anti-pattern 3: Blocking the event loop
```python
# BUG: blocks entire loop
async def bad():
    import time
    time.sleep(5)              # sync sleep!
    data = open("file.txt").read()  # sync file I/O!

# FIX:
async def good():
    await asyncio.sleep(5)
    async with aiofiles.open("file.txt") as f:
        data = await f.read()
```

#### Anti-pattern 4: Fire-and-forget without tracking
```python
# BUG: untracked task — exceptions silently discarded
async def bad():
    asyncio.create_task(risky_operation())   # fire and forget

# FIX: store reference, add error callback
async def good():
    task = asyncio.create_task(risky_operation())
    task.add_done_callback(lambda t: t.exception() and print(f"Error: {t.exception()}"))
    background_tasks.add(task)
    task.add_done_callback(background_tasks.discard)
```

#### Anti-pattern 5: Sequential awaits that should be concurrent
```python
# BUG: 10 seconds total (sequential)
async def bad():
    r1 = await fetch("A", 5)
    r2 = await fetch("B", 5)

# FIX: 5 seconds total (concurrent)
async def good():
    r1, r2 = await asyncio.gather(fetch("A", 5), fetch("B", 5))
```

#### Anti-pattern 6: Creating a new event loop in a thread
```python
# BUG: event loop policy is per-thread but mismanaged
def bad_thread():
    loop = asyncio.new_event_loop()
    loop.run_until_complete(my_coro())
    # forgetting loop.close()!

# FIX:
def good_thread():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(my_coro())
    finally:
        loop.close()
```

---

### Q31: What is `asyncio.shield()`? When would you use it?

**Answer:**

`shield()` protects a coroutine from being cancelled by its outer Task.

```python
import asyncio

async def important_write():
    print("writing to DB...")
    await asyncio.sleep(2)
    print("write complete!")

async def handler():
    # Even if handler is cancelled, important_write continues
    try:
        await asyncio.shield(important_write())
    except asyncio.CancelledError:
        print("handler cancelled, but write continues in background")

async def main():
    task = asyncio.create_task(handler())
    await asyncio.sleep(0.5)
    task.cancel()
    await asyncio.sleep(3)   # let the write finish
```

**Use cases:**
- Database writes that must complete even if the request is cancelled
- Cleanup operations
- Logging/audit trails

**Caveat:** The shielded coroutine becomes a free-floating task if the outer task is cancelled. Keep a reference to avoid garbage collection.

---

### Q32: How do `async for` and `async with` work? Implement custom versions.

**Answer:**

#### `async with` — Asynchronous Context Manager
Requires `__aenter__` and `__aexit__` methods.

```python
import asyncio

class AsyncDBConnection:
    async def __aenter__(self):
        print("connecting to DB...")
        await asyncio.sleep(0.1)   # simulate async connect
        self.conn = "connection"
        return self.conn

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        print("closing DB connection...")
        await asyncio.sleep(0.1)
        self.conn = None
        return False  # don't suppress exceptions

async def main():
    async with AsyncDBConnection() as conn:
        print(f"using {conn}")
```

Using `@asynccontextmanager` decorator:
```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def managed_resource():
    print("setup")
    try:
        yield "resource"
    finally:
        print("teardown")
        await asyncio.sleep(0)  # allow yielding during cleanup

async def main():
    async with managed_resource() as r:
        print(f"got {r}")
```

#### `async for` — Asynchronous Iterator
Requires `__aiter__` and `__anext__` methods.

```python
class AsyncCounter:
    def __init__(self, stop: int):
        self.current = 0
        self.stop = stop

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self.current >= self.stop:
            raise StopAsyncIteration
        await asyncio.sleep(0.1)   # simulate async fetch
        val = self.current
        self.current += 1
        return val

async def main():
    async for num in AsyncCounter(5):
        print(num)   # 0, 1, 2, 3, 4
```

Using `async def` with `yield` — Async Generator:
```python
async def async_range(stop: int):
    for i in range(stop):
        await asyncio.sleep(0.1)
        yield i

async def main():
    async for num in async_range(5):
        print(num)
```

---

### Q33: How do you test asyncio code with pytest?

**Answer:**

```bash
pip install pytest pytest-asyncio
```

```python
# conftest.py
import pytest

# Configure pytest-asyncio mode
# Option 1: per-test decorator
# Option 2: set asyncio_mode="auto" in pytest.ini

# pytest.ini or pyproject.toml:
# [pytest]
# asyncio_mode = auto
```

```python
# test_async.py
import asyncio
import pytest

# Method 1: decorator
@pytest.mark.asyncio
async def test_fetch():
    result = await fetch_data("https://example.com")
    assert result is not None

# Method 2: auto mode (no decorator needed if asyncio_mode=auto)
async def test_fetch_auto():
    result = await fetch_data("https://example.com")
    assert result is not None

# Fixtures can also be async
@pytest.fixture
async def db_connection():
    conn = await create_test_db()
    yield conn
    await conn.close()

@pytest.mark.asyncio
async def test_with_db(db_connection):
    result = await db_connection.query("SELECT 1")
    assert result == 1

# Testing timeouts
@pytest.mark.asyncio
async def test_timeout():
    with pytest.raises(asyncio.TimeoutError):
        await asyncio.wait_for(long_running_task(), timeout=0.1)

# Mocking async functions
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_mocked():
    with patch("mymodule.fetch", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = "mocked response"
        result = await my_function()
        assert result == "mocked response"
        mock_fetch.assert_called_once()
```

---

### Q34: How do you build a high-performance async web scraper?

**Answer:**

```python
import asyncio
import aiohttp
from typing import List
import logging

logging.basicConfig(level=logging.INFO)

class AsyncScraper:
    def __init__(self, max_concurrency: int = 20, timeout: float = 10.0):
        self.semaphore = asyncio.Semaphore(max_concurrency)
        self.timeout = aiohttp.ClientTimeout(total=timeout)
        self.results = []
        self.errors = []

    async def fetch(self, session: aiohttp.ClientSession, url: str) -> dict:
        async with self.semaphore:
            try:
                async with session.get(url, timeout=self.timeout) as response:
                    response.raise_for_status()
                    text = await response.text()
                    return {"url": url, "status": response.status, "length": len(text)}
            except aiohttp.ClientError as e:
                logging.error(f"Failed {url}: {e}")
                return {"url": url, "error": str(e)}

    async def scrape(self, urls: List[str]) -> List[dict]:
        connector = aiohttp.TCPConnector(
            limit=100,           # total connection pool size
            limit_per_host=10,   # max connections per host
        )
        async with aiohttp.ClientSession(connector=connector) as session:
            tasks = [self.fetch(session, url) for url in urls]
            results = await asyncio.gather(*tasks, return_exceptions=True)
        return results

async def main():
    urls = [f"https://httpbin.org/delay/{i%3}" for i in range(50)]
    scraper = AsyncScraper(max_concurrency=10)
    results = await scraper.scrape(urls)
    success = sum(1 for r in results if isinstance(r, dict) and "error" not in r)
    print(f"Success: {success}/{len(urls)}")

asyncio.run(main())
```

---

## Quick-Reference Cheat Sheet

```python
# ---- BASICS ----
import asyncio

async def coro(): ...            # define coroutine
await coro()                     # run coroutine, wait for result
asyncio.run(main())              # entry point (creates + closes loop)

# ---- TASKS ----
task = asyncio.create_task(coro())       # schedule concurrent execution
await task                               # wait for it
task.cancel()                            # request cancellation
task.result()                            # get result (raises if exception)
task.exception()                         # get exception (None if success)

# ---- GATHER / WAIT ----
results = await asyncio.gather(c1(), c2(), return_exceptions=True)
done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
result = await asyncio.wait_for(coro(), timeout=5.0)

for fut in asyncio.as_completed(coros):  # process in completion order
    result = await fut

# ---- TASK GROUP (3.11+) ----
async with asyncio.TaskGroup() as tg:
    t1 = tg.create_task(c1())
    t2 = tg.create_task(c2())

# ---- SYNC PRIMITIVES ----
lock = asyncio.Lock()
async with lock: ...

sem = asyncio.Semaphore(10)
async with sem: ...

event = asyncio.Event()
event.set() / event.clear() / await event.wait()

q = asyncio.Queue(maxsize=10)
await q.put(item) / item = await q.get() / q.task_done()

# ---- SLEEP / YIELD ----
await asyncio.sleep(1.0)     # sleep 1 second
await asyncio.sleep(0)       # yield control (no actual sleep)

# ---- BLOCKING CODE ----
loop = asyncio.get_running_loop()
result = await loop.run_in_executor(None, sync_func, arg)

# ---- ASYNC CONTEXT / ITERATOR ----
async with resource: ...
async for item in async_iter: ...

# ---- STREAMS ----
reader, writer = await asyncio.open_connection(host, port)
data = await reader.read(1024)
writer.write(data); await writer.drain()
writer.close(); await writer.wait_closed()

# ---- DEBUG ----
asyncio.run(main(), debug=True)
asyncio.all_tasks()
asyncio.current_task()

# ---- UVLOOP (performance) ----
import uvloop
uvloop.run(main())             # drop-in faster event loop
```

---

## Recommended Learning Resources

| Resource | Level | Focus |
|---|---|---|
| Python docs — asyncio | All | Official reference |
| "Python Concurrency with asyncio" (Matthew Fowler) | Beginner–Advanced | Comprehensive book |
| `aiohttp` docs | Intermediate | HTTP client/server |
| `trio` library | Advanced | Alternative async framework, structured concurrency concepts |
| PEP 492, PEP 525, PEP 530 | Expert | Language-level design |
| CPython source: `Lib/asyncio/` | Expert | Internals |

---

*File generated: 2026-02-24 — asyncio mastery path*
