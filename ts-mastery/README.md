# TypeScript Mastery — 6-Phase Exercise Project

A structured, hands-on TypeScript learning path from beginner to expert. Each phase contains 5 exercises with progressive difficulty.

## Setup

```bash
npm install
```

## How to Use

1. **Open an exercise file** — e.g. `phase-1-fundamentals/01-basic-types/exercise.ts`
2. **Read the instructions** in the comments and fill in the `// TODO:` sections
3. **Run your solution** to check it compiles and passes assertions:
   ```bash
   npx ts-node phase-1-fundamentals/01-basic-types/exercise.ts
   ```
4. **Check the solution** if you get stuck — open the corresponding `solution.ts`

## Verify All Solutions

```bash
npx tsc --noEmit            # Type-checks all solution files
```

## Phases

### Phase 1 — Fundamentals
Basic types, interfaces, unions/intersections, type narrowing, functions.
*Goal: Comfortable reading and writing everyday TypeScript.*

### Phase 2 — Intermediate
Generics, classes, enums/literals, utility types, type assertions.
*Goal: Use generics and built-in utilities fluently.*

### Phase 3 — Advanced Types
Conditional types, mapped types, template literal types, `infer`, recursive types.
*Goal: Build custom type-level logic.*

### Phase 4 — Design Patterns
Builder pattern, discriminated unions, type-safe events, branded types, module augmentation.
*Goal: Apply TypeScript patterns used in production codebases.*

### Phase 5 — Real-World Projects
API client, state machine, validation library, ORM types, middleware pipeline.
*Goal: Architect type-safe systems from scratch.*

### Phase 6 — Expert Challenges
Type arithmetic, JSON parser types, SQL query builder, variadic tuples, type-safe router.
*Goal: Push the type system to its limits.*

## Type Testing Helpers

Every file uses these helpers for compile-time assertions:

```ts
type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
```

- `Expect<Equal<A, B>>` — compile-time check that types A and B are identical
- `console.assert(condition, msg)` — runtime check for value-level exercises
