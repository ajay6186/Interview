# Closures in JavaScript

## What is it?
A closure is a function that **remembers the variables from its outer lexical scope** even after that outer function has finished executing. In JavaScript, every function creates a closure — it "closes over" the variables in the scope where it was defined. Closures are the mechanism behind data privacy, factory functions, memoization, and most design patterns in JavaScript.

## Key Concepts
- **Lexical scoping**: a function's scope is determined by where it is **defined**, not where it is called
- **Closure**: a function + the environment (variable bindings) it captured at creation time
- **Private state**: closures enable variables that are inaccessible from outside the function
- **Factory functions**: functions that create and return other functions with shared private state
- **The loop closure gotcha**: classic interview problem — `var` in loops + callbacks
- **Memory**: closures keep referenced variables alive (preventing garbage collection)

## Syntax / Patterns

```js
// Basic closure
function outer() {
  const message = "Hello from outer";
  
  function inner() {
    console.log(message); // inner accesses outer's variable
  }
  
  return inner;
}

const fn = outer(); // outer() has finished executing...
fn();               // ...but 'message' is still accessible! → "Hello from outer"

// Counter factory — private state
function makeCounter(initial = 0) {
  let count = initial; // private variable
  
  return {
    increment() { return ++count; },
    decrement() { return --count; },
    getCount()  { return count; },
    reset()     { count = initial; }
  };
}

const counter = makeCounter(10);
counter.increment(); // 11
counter.increment(); // 12
counter.getCount();  // 12
counter.count;       // undefined — count is private!

// Memoization using closure
function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const expensiveFn = memoize((n) => {
  console.log("Computing...");
  return n * n;
});
expensiveFn(4); // Computing... → 16
expensiveFn(4); //               → 16 (from cache)

// Partial application via closure
function multiply(a) {
  return (b) => a * b; // closes over 'a'
}
const double = multiply(2);
const triple = multiply(3);
double(5); // 10
triple(5); // 15
```

## How It Works Internally
When a function is created, JavaScript attaches a reference to its **lexical environment** — the scope chain at the point of definition. The lexical environment contains all the variable bindings visible at that point.

When the outer function returns, normally its local variables would be garbage collected. But if an inner function (closure) still holds a reference to those variables, the garbage collector keeps them alive in memory.

Each closure has its own "copy" of the reference — but multiple closures from the same scope **share the same variables**:

```js
function makeShared() {
  let x = 0;
  const inc = () => ++x;
  const dec = () => --x;
  return { inc, dec, get: () => x };
}
const s = makeShared();
s.inc(); s.inc(); // x = 2
s.dec();          // x = 1
s.get();          // 1 — both share the same x
```

## Common Use Cases

```js
// 1. Module pattern (data hiding)
const bankAccount = (() => {
  let balance = 0;
  
  return {
    deposit(amount) { balance += amount; },
    withdraw(amount) {
      if (amount > balance) throw new Error("Insufficient funds");
      balance -= amount;
    },
    getBalance() { return balance; }
  };
})();

// 2. Event handler with captured data
function attachHandler(element, data) {
  element.addEventListener("click", () => {
    console.log("Clicked with data:", data); // closes over 'data'
  });
}

// 3. Once function (only runs once)
function once(fn) {
  let called = false;
  let result;
  return function(...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}
const initOnce = once(heavyInit);

// 4. Debounce (via closure to store timer)
function debounce(fn, delay) {
  let timerId;
  return function(...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn.apply(this, args), delay);
  };
}
```

## Gotchas & Traps

```js
// THE CLASSIC LOOP CLOSURE BUG
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 3, 3, 3  ← NOT 0, 1, 2!
// Why? var is function-scoped — all closures share the SAME i
// By the time setTimeout fires, the loop is done and i = 3

// Fix 1: Use let (block-scoped — new binding each iteration)
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // 0, 1, 2 ✅
}

// Fix 2: IIFE to capture i
for (var i = 0; i < 3; i++) {
  ((j) => setTimeout(() => console.log(j), 100))(i); // 0, 1, 2 ✅
}

// Fix 3: bind
for (var i = 0; i < 3; i++) {
  setTimeout(console.log.bind(null, i), 100); // 0, 1, 2 ✅
}

// Memory leak — closure keeping large object alive
function createHandler() {
  const largeData = new Array(1000000).fill("x"); // 1MB+
  return function() {
    // uses largeData...
    return largeData[0];
  };
}
// largeData stays in memory as long as the returned function exists

// Stale closure in React (covered in React hooks section)
const [count, setCount] = useState(0);
useEffect(() => {
  const id = setInterval(() => {
    console.log(count); // Always 0! Closes over initial count
  }, 1000);
  return () => clearInterval(id);
}, []); // Missing count in dependency array
```

## Interview Questions

**Q1: What is a closure?**
> A closure is a function that retains access to variables from its outer lexical scope even after the outer function has returned. Every function in JavaScript is a closure — it closes over the variables in the scope where it was defined. The outer function's variables are kept alive by the garbage collector as long as the closure holds a reference to them.

**Q2: What is lexical scoping?**
> Lexical (or static) scoping means a function's scope is determined by where it is **written** in the source code, not where it is called from. JavaScript uses lexical scoping, so nested functions always have access to variables in all their outer scopes at definition time.

**Q3: What is the classic loop closure problem with `var`?**
> When you use `var` inside a `for` loop and reference the loop variable inside an asynchronous callback (like `setTimeout`), all callbacks share the same `var` binding — by the time they execute, the loop has finished and the variable holds the final value. Fix with `let` (creates a new binding per iteration) or an IIFE to capture the current value.

**Q4: How do closures enable data privacy?**
> By returning an object of functions from an outer function, you can expose only what you want while keeping the outer variables inaccessible from the outside. The returned functions "close over" the private variables, but callers can't access those variables directly — only through the exposed API.

**Q5: Can closures cause memory leaks?**
> Yes. If a closure captures a large object and the closure itself is long-lived (stored in a global variable or attached as an event listener that's never removed), the captured variable stays in memory indefinitely. Solutions: nullify the variable when done, remove event listeners, or avoid capturing large objects in closures.

**Q6: What is the difference between a closure and a regular function?**
> Technically, every JavaScript function is a closure — but in practice, "closure" usually refers to an inner function that accesses outer function variables after the outer function has returned. A regular (top-level) function closes over global variables. An inner function closes over both its own scope and all outer function scopes.

**Q7: What are practical use cases for closures?**
> (1) **Data privacy / encapsulation** — module pattern, factory functions. (2) **Memoization** — caching computed results. (3) **Partial application and currying** — pre-filling arguments. (4) **Event handlers** — capturing data at attachment time. (5) **Debounce/throttle** — storing timer IDs. (6) **Once/before/after decorators** — tracking call state.
