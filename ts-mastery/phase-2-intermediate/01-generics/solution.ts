// ============================================================================
// Solution 2.1 — Generics
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Generic identity function
// ---------------------------------------------------------------------------

function identity<T>(value: T): T {
  return value;
}

const str = identity("hello");
const num = identity(42);

// ---------------------------------------------------------------------------
// 2. Generic interface
// ---------------------------------------------------------------------------

interface Box<T> {
  value: T;
}

const stringBox: Box<string> = { value: "hello" };
const numberBox: Box<number> = { value: 42 };

// ---------------------------------------------------------------------------
// 3. Generic constraints
// ---------------------------------------------------------------------------

function getLength<T extends { length: number }>(value: T): number {
  return value.length;
}

// ---------------------------------------------------------------------------
// 4. Generic function: first element
// ---------------------------------------------------------------------------

function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

// ---------------------------------------------------------------------------
// 5. Generic Map/Transform
// ---------------------------------------------------------------------------

function genericMap<T, U>(arr: T[], fn: (item: T) => U): U[] {
  const result: U[] = [];
  for (const item of arr) {
    result.push(fn(item));
  }
  return result;
}

// ---------------------------------------------------------------------------
// 6. Multiple type parameters
// ---------------------------------------------------------------------------

function pair<A, B>(a: A, b: B): [A, B] {
  return [a, b];
}

// ---------------------------------------------------------------------------
// 7. Generic class
// ---------------------------------------------------------------------------

class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  get size(): number {
    return this.items.length;
  }
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------
console.assert(identity("hello") === "hello", "identity string");
console.assert(identity(42) === 42, "identity number");
console.assert(getLength("hello") === 5, "getLength string");
console.assert(getLength([1, 2, 3]) === 3, "getLength array");
console.assert(first([10, 20, 30]) === 10, "first");
console.assert(first([]) === undefined, "first empty");
console.assert(JSON.stringify(genericMap([1, 2, 3], (n) => n * 2)) === "[2,4,6]", "genericMap");
console.assert(JSON.stringify(genericMap(["a", "b"], (s) => s.toUpperCase())) === '["A","B"]', "genericMap strings");

const stack = new Stack<number>();
stack.push(1);
stack.push(2);
console.assert(stack.peek() === 2, "stack peek");
console.assert(stack.size === 2, "stack size");
console.assert(stack.pop() === 2, "stack pop");
console.assert(stack.size === 1, "stack size after pop");

console.log("Solution 2.1 — All assertions passed!");

export {};
