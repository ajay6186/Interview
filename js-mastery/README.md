# JavaScript Mastery — 6-Phase Exercise Project

A structured, hands-on JavaScript learning path from beginner to expert.
Each phase contains 5 exercises with progressive difficulty.

## Setup

```bash
npm install
```

## How to Use

1. **Open an exercise file** — e.g. `phase-1-fundamentals/01-variables-and-types/exercise.js`
2. **Read the instructions** and fill in every `// TODO:` section
3. **Run your solution**:
   ```bash
   node phase-1-fundamentals/01-variables-and-types/exercise.js
   ```
4. **Check the solution** if stuck — open `solution.js`
5. **Study patterns** — open `examples.js` for 50 worked examples per topic

## Phases

| Phase | Topic | Exercises |
|-------|-------|-----------|
| 1 | Fundamentals | variables/types, functions, arrays, objects, control flow |
| 2 | Scope & Closures | closures, this/binding, prototypes/classes, ES6+, destructuring |
| 3 | Async JavaScript | callbacks, promises, async/await, event loop, fetch |
| 4 | Functional Programming | HOFs, pure functions, composition, currying, immutability |
| 5 | Patterns & Design | factory/module, observer, iterator, error handling, proxy |
| 6 | Expert | generators, symbols, performance, regexp, meta-programming |

## Running Files

```bash
node phase-1-fundamentals/01-variables-and-types/exercise.js
node phase-1-fundamentals/01-variables-and-types/solution.js
node phase-1-fundamentals/01-variables-and-types/examples.js
```

## Structure

```
js-mastery/
├── package.json
├── jsconfig.json
├── README.md
├── phase-1-fundamentals/
│   ├── 01-variables-and-types/
│   │   ├── exercise.js   ← fill in the TODOs
│   │   ├── solution.js   ← complete reference
│   │   └── examples.js   ← 50 worked examples
│   ├── 02-functions/
│   ├── 03-arrays/
│   ├── 04-objects/
│   └── 05-control-flow/
├── phase-2-scope-and-closures/
├── phase-3-async-javascript/
├── phase-4-functional-programming/
├── phase-5-patterns-and-design/
└── phase-6-expert/
```

## Assertions

All exercises use `console.assert(condition, message)`.
A passing run prints: `✓ Exercise X.Y — All assertions passed!`
