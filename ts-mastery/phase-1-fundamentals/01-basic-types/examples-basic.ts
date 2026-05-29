export {};

// ============================================================
// BASIC EXAMPLES — Basic Types (50 Examples)
// ============================================================

// 1. String type annotation
const greeting: string = "Hello, TypeScript!";

// 2. Number type annotation
const age: number = 25;

// 3. Boolean type annotation
const isLoggedIn: boolean = true;

// 4. Null type
const emptyValue: null = null;

// 5. Undefined type
const notAssigned: undefined = undefined;

// 6. Any type (escape hatch — avoid when possible)
let flexible: any = "could be anything";
flexible = 42;

// 7. Unknown type (safer than any)
let userInput: unknown = "some input";

// 8. Never type — function that never returns
function throwError(msg: string): never {
  throw new Error(msg);
}

// 9. Void return type
function logMessage(msg: string): void {
  console.log(msg);
}

// 10. String array (shorthand)
const fruits: string[] = ["apple", "banana", "cherry"];

// 11. Number array (shorthand)
const scores: number[] = [98, 87, 76];

// 12. Boolean array
const flags: boolean[] = [true, false, true];

// 13. Array<string> generic form
const colors: Array<string> = ["red", "green", "blue"];

// 14. Array<number> generic form
const temperatures: Array<number> = [36.6, 37.0, 38.2];

// 15. BigInt type
const bigNumber: bigint = 9007199254740993n;

// 16. Symbol type
const uniqueKey: symbol = Symbol("myKey");

// 17. Type inference for string (no annotation needed)
const inferredString = "TypeScript infers this as string";

// 18. Type inference for number
const inferredNumber = 3.14;

// 19. Type inference for boolean
const inferredBoolean = false;

// 20. Simple tuple [string, number]
const personTuple: [string, number] = ["Alice", 30];

// 21. Tuple [number, boolean]
const flaggedScore: [number, boolean] = [95, true];

// 22. Tuple [string, string, number]
const fullRecord: [string, string, number] = ["John", "Doe", 42];

// 23. Inline object type
const user: { name: string; age: number } = { name: "Bob", age: 28 };

// 24. Object with boolean property
const settings: { darkMode: boolean; fontSize: number } = {
  darkMode: true,
  fontSize: 14,
};

// 25. Function with typed parameters and return
function add(a: number, b: number): number {
  return a + b;
}

// 26. Function returning string
function greet(name: string): string {
  return `Hello, ${name}!`;
}

// 27. Function returning boolean
function isAdult(userAge: number): boolean {
  return userAge >= 18;
}

// 28. Optional parameter (? suffix)
function repeat(str: string, times?: number): string {
  return str.repeat(times ?? 1);
}

// 29. Default parameter value
function multiply(a: number, b: number = 2): number {
  return a * b;
}

// 30. Const prevents reassignment
const PI: number = 3.14159;

// 31. Let allows reassignment
let counter: number = 0;
counter = 1;

// 32. String concatenation
const firstName: string = "Jane";
const lastName: string = "Doe";
const fullName: string = firstName + " " + lastName;

// 33. Number arithmetic typed
const sumResult: number = 10 + 20;
const productResult: number = 5 * 4;

// 34. Boolean logic
const isValid: boolean = true && !false;

// 35. Ternary with types
const status: string = age >= 18 ? "adult" : "minor";

// 36. Null coalescing
const maybeNull: string | null = null;
const safeValue: string = maybeNull ?? "default";

// 37. Undefined coalescing
const maybeUndefined: string | undefined = undefined;
const definiteValue: string = maybeUndefined ?? "fallback";

// 38. typeof narrowing at call site
function processInput(input: string | number): string {
  if (typeof input === "string") return input.toUpperCase();
  return input.toFixed(2);
}

// 39. Type alias for string
type Username = string;
const myUsername: Username = "typescript_lover";

// 40. Type alias for number
type Pixels = number;
const width: Pixels = 1920;

// 41. Type alias for boolean
type IsActive = boolean;
const active: IsActive = true;

// 42. Tuple destructuring
const [tupleFirst, tupleSecond]: [string, number] = ["hello", 42];

// 43. Object destructuring with inline type
const { name: userName, age: userAgeVal }: { name: string; age: number } = {
  name: "Eve",
  age: 31,
};

// 44. Function expression with explicit type
const square: (n: number) => number = (n) => n * n;

// 45. Arrow function with inline return type
const double = (n: number): number => n * 2;

// 46. Explicit void arrow function
const printVal = (val: string): void => {
  console.log(val);
};

// 47. Object with undefined property
const config: { host: string; port: number; ssl: boolean | undefined } = {
  host: "localhost",
  port: 3000,
  ssl: undefined,
};

// 48. Array length is always number
const arr: number[] = [1, 2, 3, 4, 5];
const len: number = arr.length;

// 49. Explicit void return statement
function noop(): void {
  return;
}

// 50. String template literal typed result
const templateResult: string = `User ${myUsername} is ${active ? "active" : "inactive"}`;
