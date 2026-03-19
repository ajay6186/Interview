// ============================================================================
// Exercise 4.5 — Module Augmentation & Declaration Merging
// ============================================================================
// Learn to extend existing types, merge interfaces, and augment modules.
//
// Instructions: Fill in every TODO so the file compiles and all assertions pass.
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Interface merging (declaration merging)
// ---------------------------------------------------------------------------

// This interface is defined in two places — TypeScript merges them
interface Window {
  title: string;
}

interface Window {
  // TODO: Add a `darkMode` boolean property via declaration merging
}

// TODO: After merging, this should compile:
// const win: Window = { title: "My App", darkMode: true };

// ---------------------------------------------------------------------------
// 2. Extending built-in types with interface merging
// ---------------------------------------------------------------------------

// TODO: Augment the Array interface to add a `last` property
// Hint: declare global { interface Array<T> { ... } }
// Since we're in a script file (not module), we can merge directly:

interface Array<T> {
  // TODO: Add a readonly `last` getter that returns T | undefined
}

// ---------------------------------------------------------------------------
// 3. Namespace merging with functions
// ---------------------------------------------------------------------------

function greet(name: string): string {
  return `Hello, ${name}!`;
}

// TODO: Merge a namespace with the function to add a `defaultName` property
// namespace greet { export const defaultName = "World"; }

// ---------------------------------------------------------------------------
// 4. Enum merging
// ---------------------------------------------------------------------------

enum StatusCode {
  OK = 200,
  NotFound = 404,
}

// TODO: Extend StatusCode with additional values via enum merging
// Add: InternalError = 500, BadGateway = 502

// ---------------------------------------------------------------------------
// 5. Type-safe plugin system using declaration merging
// ---------------------------------------------------------------------------

interface PluginRegistry {
  // Base — empty, plugins add their types here
}

// TODO: "Register" plugins by merging into PluginRegistry
// Plugin "auth": { currentUser: string }
// Plugin "theme": { isDark: boolean }

// This function should work after merging:
function getPluginValue<K extends keyof PluginRegistry>(
  registry: PluginRegistry,
  key: K
): PluginRegistry[K] {
  return registry[key];
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------

// Uncomment as you implement:
/*
const win: Window = { title: "My App", darkMode: true };
console.assert(win.darkMode === true, "window darkMode");

console.assert(greet("Alice") === "Hello, Alice!", "greet");
// console.assert(greet.defaultName === "World", "greet default");

console.assert(StatusCode.OK === 200, "OK");
console.assert(StatusCode.NotFound === 404, "NotFound");
// console.assert(StatusCode.InternalError === 500, "InternalError");
*/

console.log("Exercise 4.5 — All assertions passed!");

export {};
