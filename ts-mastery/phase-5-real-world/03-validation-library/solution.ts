// ============================================================================
// Solution 5.3 — Type-Safe Validation Library
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// Schema types and validators
// ---------------------------------------------------------------------------

interface Schema<T> {
  _output: T;
  parse(value: unknown): T;
}

function string(): Schema<string> {
  return {
    _output: "" as any,
    parse(value: unknown): string {
      if (typeof value !== "string") {
        throw new TypeError(`Expected string, got ${typeof value}`);
      }
      return value;
    },
  };
}

function number(): Schema<number> {
  return {
    _output: 0 as any,
    parse(value: unknown): number {
      if (typeof value !== "number") {
        throw new TypeError(`Expected number, got ${typeof value}`);
      }
      return value;
    },
  };
}

function boolean(): Schema<boolean> {
  return {
    _output: false as any,
    parse(value: unknown): boolean {
      if (typeof value !== "boolean") {
        throw new TypeError(`Expected boolean, got ${typeof value}`);
      }
      return value;
    },
  };
}

type ObjectShape = Record<string, Schema<any>>;
type InferShape<S extends ObjectShape> = {
  [K in keyof S]: S[K]["_output"];
};

function object<S extends ObjectShape>(shape: S): Schema<InferShape<S>> {
  return {
    _output: {} as any,
    parse(value: unknown): InferShape<S> {
      if (typeof value !== "object" || value === null) {
        throw new TypeError(`Expected object, got ${typeof value}`);
      }
      const result: any = {};
      for (const key of Object.keys(shape)) {
        result[key] = shape[key].parse((value as any)[key]);
      }
      return result;
    },
  };
}

function array<T>(itemSchema: Schema<T>): Schema<T[]> {
  return {
    _output: [] as any,
    parse(value: unknown): T[] {
      if (!Array.isArray(value)) {
        throw new TypeError(`Expected array, got ${typeof value}`);
      }
      return value.map((item) => itemSchema.parse(item));
    },
  };
}

function optional<T>(schema: Schema<T>): Schema<T | undefined> {
  return {
    _output: undefined as any,
    parse(value: unknown): T | undefined {
      if (value === undefined) return undefined;
      return schema.parse(value);
    },
  };
}

type Infer<S extends Schema<any>> = S["_output"];

// ---------------------------------------------------------------------------
// Type-level tests
// ---------------------------------------------------------------------------

const userSchema = object({
  name: string(),
  age: number(),
  active: boolean(),
});

type UserType = Infer<typeof userSchema>;
type TestUser = Expect<Equal<UserType, { name: string; age: number; active: boolean }>>;

const nestedSchema = object({
  user: object({
    name: string(),
    tags: array(string()),
  }),
  count: number(),
});

type NestedType = Infer<typeof nestedSchema>;
type TestNested = Expect<Equal<NestedType, {
  user: { name: string; tags: string[] };
  count: number;
}>>;

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------

const str = string().parse("hello");
console.assert(str === "hello", "parse string");

let threw = false;
try { string().parse(42); } catch { threw = true; }
console.assert(threw, "string rejects number");

const num = number().parse(42);
console.assert(num === 42, "parse number");

const user = userSchema.parse({ name: "Alice", age: 30, active: true });
console.assert(user.name === "Alice", "parse object name");
console.assert(user.age === 30, "parse object age");
console.assert(user.active === true, "parse object active");

const nums = array(number()).parse([1, 2, 3]);
console.assert(nums.length === 3, "parse array");
console.assert(nums[0] === 1, "array element");

const optVal = optional(string()).parse(undefined);
console.assert(optVal === undefined, "optional undefined");
const optStr = optional(string()).parse("hi");
console.assert(optStr === "hi", "optional present");

threw = false;
try { userSchema.parse({ name: 123, age: 30, active: true }); } catch { threw = true; }
console.assert(threw, "object rejects invalid field");

console.log("Solution 5.3 — All assertions passed!");

export {};
