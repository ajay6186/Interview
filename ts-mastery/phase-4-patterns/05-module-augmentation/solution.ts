// ============================================================================
// Solution 4.5 — Module Augmentation & Declaration Merging
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Interface merging
// ---------------------------------------------------------------------------

interface Window {
  title: string;
}

interface Window {
  darkMode: boolean;
}

const win: Window = { title: "My App", darkMode: true };

// ---------------------------------------------------------------------------
// 2. Extending built-in Array
// ---------------------------------------------------------------------------

declare global {
  interface Array<T> {
    readonly last: T | undefined;
  }
}

Object.defineProperty(Array.prototype, "last", {
  get() {
    return this[this.length - 1];
  },
});

// ---------------------------------------------------------------------------
// 3. Namespace merging
// ---------------------------------------------------------------------------

function greet(name: string): string {
  return `Hello, ${name}!`;
}

namespace greet {
  export const defaultName = "World";
}

// ---------------------------------------------------------------------------
// 4. Enum merging
// ---------------------------------------------------------------------------

enum StatusCode {
  OK = 200,
  NotFound = 404,
}

enum StatusCode {
  InternalError = 500,
  BadGateway = 502,
}

// ---------------------------------------------------------------------------
// 5. Plugin system via declaration merging
// ---------------------------------------------------------------------------

interface PluginRegistry {
  // Base
}

interface PluginRegistry {
  auth: { currentUser: string };
}

interface PluginRegistry {
  theme: { isDark: boolean };
}

function getPluginValue<K extends keyof PluginRegistry>(
  registry: PluginRegistry,
  key: K
): PluginRegistry[K] {
  return registry[key];
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------
console.assert(win.darkMode === true, "window darkMode");
console.assert(greet("Alice") === "Hello, Alice!", "greet");
console.assert(greet.defaultName === "World", "greet default");
console.assert(StatusCode.OK === 200, "OK");
console.assert(StatusCode.NotFound === 404, "NotFound");
console.assert(StatusCode.InternalError === 500, "InternalError");
console.assert(StatusCode.BadGateway === 502, "BadGateway");

const registry: PluginRegistry = {
  auth: { currentUser: "alice" },
  theme: { isDark: true },
};
console.assert(getPluginValue(registry, "auth").currentUser === "alice", "plugin auth");
console.assert(getPluginValue(registry, "theme").isDark === true, "plugin theme");

console.assert([1, 2, 3].last === 3, "array last");
console.assert(([] as number[]).last === undefined, "empty array last");

console.log("Solution 4.5 — All assertions passed!");

export {};
