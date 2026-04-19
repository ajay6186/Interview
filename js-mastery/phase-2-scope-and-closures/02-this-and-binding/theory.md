# `this` and Binding in JavaScript

## What is it?
`this` is a special keyword in JavaScript that refers to the **execution context** of a function — the object that "owns" the current function call. Unlike most languages, `this` in JavaScript is determined **at call time** (not at definition time), making it one of the most confusing aspects of the language. Understanding `this` requires knowing the 4 binding rules and how arrow functions change the game.

## Key Concepts
- **4 binding rules**: Default, Implicit, Explicit (call/apply/bind), and `new`
- **Priority**: `new` > Explicit > Implicit > Default
- **Arrow functions**: no own `this` — inherit from lexical scope at definition
- **Strict mode**: changes default binding from `global` to `undefined`
- **Method extraction problem**: losing `this` when storing a method in a variable
- **`bind`**: creates a new function with permanently bound `this`

## Syntax / Patterns

```js
// ─── 1. DEFAULT BINDING ───────────────────────────────────────────────────────
// When called without a receiver, 'this' = global object (or undefined in strict mode)
function whoAmI() {
  console.log(this); // window in browser, global in Node, undefined in strict mode
}
whoAmI();

// ─── 2. IMPLICIT BINDING ──────────────────────────────────────────────────────
// When called as a method on an object, 'this' = that object
const user = {
  name: "Alice",
  greet() { console.log(this.name); } // 'this' → user
};
user.greet(); // "Alice"

// ─── 3. EXPLICIT BINDING ──────────────────────────────────────────────────────
// Using call, apply, or bind to set 'this' explicitly

function greet(greeting, punctuation) {
  return `${greeting}, ${this.name}${punctuation}`;
}

const alice = { name: "Alice" };
const bob   = { name: "Bob" };

greet.call(alice, "Hello", "!");    // "Hello, Alice!" — args as list
greet.apply(alice, ["Hi", "."]);    // "Hi, Alice."   — args as array
const boundGreet = greet.bind(alice); // returns new function with 'this' = alice
boundGreet("Hey", "?");             // "Hey, Alice?"

// ─── 4. NEW BINDING ───────────────────────────────────────────────────────────
// When used with 'new', 'this' = freshly created object
function Person(name) {
  this.name = name;
  this.greet = function() { return `Hi, I'm ${this.name}`; };
}
const p = new Person("Bob");
p.greet(); // "Hi, I'm Bob"

// ─── ARROW FUNCTIONS — no own 'this' ─────────────────────────────────────────
const timer = {
  count: 0,
  start() {
    // Arrow inherits 'this' from start()'s scope = timer
    setInterval(() => {
      this.count++; // ✅ 'this' is timer
      console.log(this.count);
    }, 1000);
  },
  startBroken() {
    setInterval(function() {
      this.count++; // ❌ 'this' is global/undefined — function has own 'this'
    }, 1000);
  }
};

// ─── call vs apply vs bind ───────────────────────────────────────────────────
const nums = [1, 5, 3, 9, 2];
Math.max.apply(null, nums); // 9  — apply with array of args (pre-spread)
Math.max(...nums);          // 9  — modern spread (prefer this)
```

## How It Works Internally
JavaScript determines `this` at **call time** using this priority ladder:

1. **`new`** → `this` = new empty object (set up by `new` operator)
2. **`call` / `apply` / `bind`** → `this` = explicitly provided object
3. **Method call** (`obj.method()`) → `this` = `obj`
4. **Plain call** (`fn()`) → `this` = global object (or `undefined` in strict mode)

Arrow functions **don't participate in this system** — they capture `this` from the lexical environment at the time they're defined, and it cannot be changed even with `call`/`apply`/`bind`.

```js
const arrow = () => console.log(this);
arrow.call({ name: "Alice" }); // Still global/undefined — can't override arrow's this!
```

## Common Use Cases

```js
// Fixing 'this' in event handlers (class methods)
class Button {
  constructor(label) {
    this.label = label;
    // Method 1: bind in constructor
    this.handleClick = this.handleClick.bind(this);
    // Method 2: arrow function property (no bind needed)
    this.handleClickArrow = () => console.log(this.label);
  }
  
  handleClick() {
    console.log(this.label); // 'this' fixed by bind
  }
}

// Method extraction problem
const user = { name: "Alice", greet() { return this.name; } };
const fn = user.greet;
fn();          // undefined — 'this' lost! (default binding)
fn.call(user); // "Alice"   — restored with call
const bound = user.greet.bind(user);
bound();       // "Alice"   — permanently bound

// Borrowing methods
const arr = [1, 2, 3];
const arrayLike = { 0: "a", 1: "b", length: 2 };
Array.prototype.slice.call(arrayLike); // ["a", "b"]

// Dynamic 'this' in regular functions
function formatName() {
  return `${this.firstName} ${this.lastName}`;
}
formatName.call({ firstName: "Jane", lastName: "Doe" }); // "Jane Doe"
```

## Gotchas & Traps

```js
// 1. Method extraction loses 'this'
const obj = { x: 42, getX() { return this.x; } };
const getX = obj.getX;
getX(); // undefined (or error in strict mode)

// 2. Nested regular function loses 'this'
const timer = {
  value: 10,
  start() {
    setTimeout(function() {
      console.log(this.value); // undefined — 'this' is global, not timer
    }, 100);
    // Fix: use arrow function, or capture: const self = this;
  }
};

// 3. Arrow functions as object methods — 'this' is outer (wrong) context
const obj2 = {
  name: "test",
  greet: () => console.log(this.name) // 'this' = module scope, NOT obj2
};
obj2.greet(); // undefined

// 4. bind returns a NEW function — original is unchanged
function fn() { return this.x; }
fn.bind({ x: 1 }); // returns new function
fn({ x: 2 });      // fn itself is unchanged

// 5. bind can only be used once — rebinding doesn't work
const bound = fn.bind({ x: 1 });
const rebound = bound.bind({ x: 2 });
rebound(); // still x = 1 — first bind wins

// 6. class methods need binding in React
class MyComponent extends React.Component {
  handleClick() { this.setState(/*...*/); }
  render() {
    // Without bind: 'this' is undefined when the handler is called
    return <button onClick={this.handleClick.bind(this)}>Click</button>;
    // Or: onClick={() => this.handleClick()} — arrow captures correct this
  }
}
```

## Interview Questions

**Q1: What are the 4 rules for determining `this`?**
> In order of priority: (1) **`new` binding** — when using `new`, `this` = newly created object. (2) **Explicit binding** — `call(obj)`, `apply(obj)`, or `bind(obj)` sets `this` to `obj`. (3) **Implicit binding** — when called as a method (`obj.fn()`), `this` = `obj`. (4) **Default binding** — plain function call (`fn()`), `this` = global object in non-strict mode, `undefined` in strict mode.

**Q2: How do arrow functions handle `this` differently?**
> Arrow functions have no own `this`. They inherit `this` from the lexical (enclosing) scope at the time they are **defined** — not at call time. This `this` cannot be overridden with `call`, `apply`, or `bind`. This makes arrow functions ideal for callbacks and methods where you want to preserve the outer `this`.

**Q3: What is the method extraction problem?**
> When you store an object method in a variable (`const fn = obj.method`), you lose the implicit binding. Calling `fn()` uses default binding — `this` is global or `undefined`. Solutions: use `fn.call(obj)`, pre-bind with `obj.method.bind(obj)`, or use an arrow function wrapper `() => obj.method()`.

**Q4: What is the difference between `call`, `apply`, and `bind`?**
> All three set `this` explicitly. `call(thisArg, arg1, arg2...)` invokes immediately with args as a list. `apply(thisArg, [arg1, arg2...])` invokes immediately with args as an array. `bind(thisArg, arg1...)` returns a **new function** with `this` permanently set (and optionally pre-filled args). `call` and `apply` execute the function; `bind` does not.

**Q5: Why does `this` change inside a callback?**
> A callback is typically called as a plain function (default binding), not as a method. So `this` inside a callback reverts to the global object or `undefined`. To preserve `this`, use an arrow function for the callback (inherits outer `this`), or use `.bind(this)` when passing the callback.

**Q6: When should you use `bind` vs an arrow function?**
> Use `bind` when: working with legacy class-based code, you need the function to be reusable with specific `this`, or pre-filling arguments (partial application). Use arrow functions when: writing callbacks inside methods, creating functions that should always use the surrounding `this`, or in functional code. In modern React, arrow class properties are common.

**Q7: Does `bind` work on arrow functions?**
> No. Arrow functions' `this` is fixed at definition time and cannot be changed by `call`, `apply`, or `bind`. If you call `arrowFn.bind({x: 1})`, it returns a new function that wraps the arrow, but the arrow's `this` remains unchanged when called.
