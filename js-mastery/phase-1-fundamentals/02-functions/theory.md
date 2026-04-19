# Functions in JavaScript

## What is it?
Functions are first-class citizens in JavaScript — they can be assigned to variables, passed as arguments, and returned from other functions. JavaScript has multiple ways to define functions, each with different behavior around `this`, hoisting, and the `arguments` object. Mastering functions is essential for understanding closures, callbacks, and functional programming.

## Key Concepts
- **Function declaration** vs **function expression** vs **arrow function**
- **Hoisting**: declarations are hoisted completely; expressions are not
- **`this` binding**: differs between regular and arrow functions
- **`arguments` object**: only available in regular functions (not arrows)
- **Default parameters**: evaluated each call, not at definition time
- **Rest parameters** (`...args`): collects remaining arguments into a real array
- **IIFE**: Immediately Invoked Function Expression for scoping
- **First-class functions**: functions are values — can be stored, passed, returned

## Syntax / Patterns

```js
// 1. Function Declaration (hoisted fully)
function greet(name) {
  return `Hello, ${name}!`;
}

// 2. Function Expression (NOT hoisted)
const greet = function(name) {
  return `Hello, ${name}!`;
};

// 3. Arrow Function (no own `this` or `arguments`)
const greet = (name) => `Hello, ${name}!`;
const double = n => n * 2;           // single param: parens optional
const noop   = () => {};             // no params: parens required

// 4. Default Parameters
function connect(host = "localhost", port = 3000) {
  return `${host}:${port}`;
}
connect();           // "localhost:3000"
connect("prod", 80); // "prod:80"

// 5. Rest Parameters (always last)
function sum(...nums) {
  return nums.reduce((a, b) => a + b, 0);
}
sum(1, 2, 3, 4); // 10

// 6. IIFE
(function() {
  const private = "not accessible outside";
})();

// Arrow IIFE
(() => {
  console.log("arrow IIFE");
})();

// 7. Named function expression (useful for recursion + stack traces)
const factorial = function fact(n) {
  return n <= 1 ? 1 : n * fact(n - 1);
};
```

## How It Works Internally
When JavaScript encounters a **function declaration**, it is hoisted to the top of its scope with its full definition — you can call it before the line it appears on. **Function expressions** and **arrow functions** are only hoisted as variable declarations (`var` gets `undefined`, `let`/`const` stay in TDZ).

**Arrow functions** are syntactic sugar — they don't have their own `this`, `arguments`, `super`, or `new.target`. They inherit `this` from the surrounding lexical scope at definition time, making them ideal for callbacks.

**The call stack**: each function call adds a frame to the call stack with its local variables. When the function returns, the frame is popped off.

## Common Use Cases

```js
// Callback pattern
[1, 2, 3].map(n => n * 2); // [2, 4, 6]

// Function as return value (factory)
function multiplier(factor) {
  return (n) => n * factor;
}
const triple = multiplier(3);
triple(5); // 15

// Default parameter with complex expression
function makeDate(timestamp = Date.now()) {
  return new Date(timestamp);
}

// Arguments object (regular functions only)
function logAll() {
  console.log(Array.from(arguments));
}

// Prefer rest params (works in arrows too)
const logAllModern = (...args) => console.log(args);
```

## Gotchas & Traps

```js
// 1. Arrow functions have no 'this' — breaks as object methods
const obj = {
  name: "Alice",
  greet: () => console.log(this.name) // 'this' is outer scope, NOT obj!
};
obj.greet(); // undefined (or global)

// Fix: use regular function for methods
const obj2 = {
  name: "Alice",
  greet() { console.log(this.name); } // ✅
};

// 2. Default params are evaluated at call time, not definition time
function add(a, b = a * 2) { return a + b; }
add(3); // 9 (b = 3 * 2 = 6)

// 3. 'arguments' is NOT available in arrow functions
const fn = () => {
  console.log(arguments); // ReferenceError in strict mode
};

// 4. Hoisting: function declarations are fully hoisted
sayHi(); // ✅ works
function sayHi() { console.log("hi"); }

greet(); // ❌ TypeError — not a function yet
const greet = () => "hello";

// 5. Returning object from arrow function — wrap in parens
const makeObj = (x) => ({ value: x }); // ✅
const broken  = (x) => { value: x };   // ❌ {} is a block, not object
```

## Interview Questions

**Q1: What is the difference between a function declaration and a function expression?**
> A function declaration (`function foo() {}`) is hoisted completely — it's available throughout its scope before the line it appears. A function expression (`const foo = function() {}`) is only hoisted as a variable binding; you can't call it before the line.

**Q2: What are arrow functions and how do they differ from regular functions?**
> Arrow functions are a shorter syntax for functions. Key differences: (1) No own `this` — they inherit `this` lexically from surrounding scope. (2) No `arguments` object. (3) Cannot be used as constructors (`new` throws TypeError). (4) No `prototype` property. (5) Cannot use `yield` as generators. Use regular functions when you need dynamic `this` (methods, constructors); use arrows for callbacks.

**Q3: What is an IIFE and why would you use it?**
> IIFE (Immediately Invoked Function Expression) is a function that runs immediately after definition: `(function() { ... })()`. It creates a private scope — variables inside don't pollute the outer scope. Before ES6 modules, IIFEs were the standard way to encapsulate code. Today they're less common but still used to avoid polluting global scope or to initialize something immediately.

**Q4: What is the `arguments` object?**
> `arguments` is an array-like object (not a real Array) available inside regular functions containing all passed arguments. It doesn't exist in arrow functions. Modern code prefers rest parameters (`...args`) which give you a real Array with all Array methods available.

**Q5: How do default parameters work in JavaScript?**
> Default parameter values are evaluated each time the function is called (not at definition time). They are used when the argument is `undefined` (or omitted). Passing `null` does NOT trigger the default — only `undefined` does. Default params can reference earlier params: `function f(a, b = a * 2)`.

**Q6: What does "first-class function" mean?**
> A language has first-class functions when functions are treated like any other value: they can be assigned to variables, stored in arrays/objects, passed as arguments to other functions, and returned from functions. JavaScript fully supports this, enabling higher-order functions, callbacks, and functional programming patterns.

**Q7: What is the difference between `function foo(){}` and `const foo = function(){}`?**
> Besides hoisting, `function foo(){}` creates a named function that is accessible within its scope from the start. `const foo = function(){}` creates an anonymous function expression assigned to `const foo` — this is only available after that line executes, and the binding follows `const` rules (TDZ, block-scoped).
