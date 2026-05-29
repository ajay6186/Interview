export {};

// ============================================================
// ADVANCED EXAMPLES — Functions (50 Examples)
// ============================================================

// 1. Variadic tuple type — typed spread args
function call<T extends unknown[], R>(
  fn: (...args: T) => R,
  ...args: T
): R {
  return fn(...args);
}
const r1 = call((a: number, b: string) => `${a}${b}`, 42, "px"); // "42px"

// 2. Variadic tuple — prepend arg to function
type Prepend<T, Fn extends (...args: any[]) => any> =
  (first: T, ...rest: Parameters<Fn>) => ReturnType<Fn>;
function prependArg<T, Fn extends (...args: any[]) => any>(
  fn: Fn,
  _: T
): Prepend<T, Fn> {
  return ((_first: T, ...rest: Parameters<Fn>) => fn(...rest)) as Prepend<T, Fn>;
}

// 3. Conditional return type based on input literal
function create<T extends "array" | "object">(
  kind: T
): T extends "array" ? unknown[] : Record<string, unknown> {
  return (kind === "array" ? [] : {}) as any;
}
const arr2 = create("array");    // unknown[]
const obj2 = create("object");   // Record<string, unknown>

// 4. Infer parameter types from function
type Head<T extends unknown[]> = T extends [infer H, ...unknown[]] ? H : never;
type Tail<T extends unknown[]> = T extends [unknown, ...infer R] ? R : never;
type FirstParam<F extends (...args: any[]) => any> = Head<Parameters<F>>;
type RestParams<F extends (...args: any[]) => any> = Tail<Parameters<F>>;
function connect2(host: string, port: number, ssl: boolean): void {}
type HostArg = FirstParam<typeof connect2>; // string

// 5. Function type transformation — make all params optional
type PartialParams<F extends (...args: any[]) => any> =
  (...args: Partial<Parameters<F>>) => ReturnType<F>;

// 6. Overloaded function with conditional types
function wrap<T>(val: T): T extends null | undefined ? never : { value: T };
function wrap<T>(val: T): { value: T } | never {
  if (val == null) throw new TypeError("Cannot wrap null/undefined");
  return { value: val };
}

// 7. Function composition with types preserved
function pipe2<A>(a: A): A;
function pipe2<A, B>(a: A, ab: (a: A) => B): B;
function pipe2<A, B, C>(a: A, ab: (a: A) => B, bc: (b: B) => C): C;
function pipe2<A, B, C, D>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D): D;
function pipe2(a: unknown, ...fns: Function[]): unknown {
  return fns.reduce((v, fn) => fn(v), a);
}
const res = pipe2(
  "  hello  ",
  (s: string) => s.trim(),
  (s: string) => s.toUpperCase(),
  (s: string) => s.length
); // number (5)

// 8. Generic curried function with full type inference
function curry<A, B, C>(fn: (a: A, b: B) => C): (a: A) => (b: B) => C {
  return (a) => (b) => fn(a, b);
}
const curriedAdd = curry((a: number, b: number) => a + b);
const add10 = curriedAdd(10);
const twenty = add10(10);

// 9. N-ary curry via recursive type
type Curry<F extends (...args: any[]) => any> =
  Parameters<F> extends [infer A, ...infer Rest]
    ? Rest extends []
      ? F
      : (a: A) => Curry<(...rest: Rest) => ReturnType<F>>
    : never;

// 10. Overloaded generic based on tuple shape
function unzip<A, B>(pairs: [A, B][]): [A[], B[]];
function unzip<A, B, C>(triples: [A, B, C][]): [A[], B[], C[]];
function unzip(arr: any[][]): any[] {
  if (arr.length === 0) return [];
  return arr[0].map((_, i) => arr.map((row) => row[i]));
}

// 11. Generic function with mapped return
function mapRecord<T extends Record<string, unknown>, U>(
  record: T,
  fn: <K extends keyof T>(key: K, value: T[K]) => U
): Record<keyof T, U> {
  return Object.fromEntries(
    Object.entries(record).map(([k, v]) => [k, fn(k as keyof T, v as T[keyof T])])
  ) as Record<keyof T, U>;
}

// 12. Higher-kinded type simulation
interface Functor<F> {
  map<A, B>(fn: (a: A) => B): Functor<F>;
}

// 13. Typed middleware with context accumulation
type Ctx<State> = { state: State; next: () => Promise<void> };
function useMiddleware<S1, S2>(
  mw1: (ctx: Ctx<S1>) => Promise<S2>,
  mw2: (ctx: Ctx<S2>) => Promise<void>
): (initial: S1) => Promise<void> {
  return async (initial) => {
    const s2 = await mw1({ state: initial, next: async () => {} });
    await mw2({ state: s2, next: async () => {} });
  };
}

// 14. Infer from function using mapped conditional
type MethodsOf<T> = {
  [K in keyof T as T[K] extends Function ? K : never]: T[K];
};

// 15. Assertion function with generic context
function assertInRecord<K extends string, T>(
  record: Record<K, T>,
  key: string
): asserts key is K {
  if (!(key in record)) throw new RangeError(`Key not in record: ${key}`);
}

// 16. Typed recursive memoize
type Rec<T extends (...args: any[]) => any> = T & { cache: Map<string, ReturnType<T>> };
function memoizeRec<T extends (...args: any[]) => any>(fn: T): Rec<T> {
  const cache = new Map<string, ReturnType<T>>();
  const memoized = ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (!cache.has(key)) cache.set(key, fn(...args));
    return cache.get(key)!;
  }) as Rec<T>;
  memoized.cache = cache;
  return memoized;
}

// 17. Typed event handler with once
function createOnceListener<T>(
  fn: (event: T) => void
): { listener: (event: T) => void; off: () => void } {
  let active = true;
  const listener = (event: T): void => {
    if (!active) return;
    active = false;
    fn(event);
  };
  return { listener, off: () => { active = false; } };
}

// 18. Function that infers tuple from overloads
function tuple<T extends unknown[]>(...items: T): T {
  return items;
}
const t1 = tuple(1, "two", true); // [number, string, boolean]

// 19. Typed partial application with remaining params
function partial2<F extends (...args: any[]) => any, FirstArgs extends Partial<Parameters<F>>>(
  fn: F,
  ...first: FirstArgs
): (...rest: FirstArgs extends Parameters<F> ? [] : Parameters<F> extends [...FirstArgs, ...infer Rest] ? Rest : never) => ReturnType<F> {
  return (...rest: any[]) => fn(...first, ...rest);
}

// 20. Conditional narrowing in generic
function narrowOrThrow<T, S extends T>(
  val: T,
  guard: (v: T) => v is S,
  msg: string
): S {
  if (!guard(val)) throw new TypeError(msg);
  return val;
}

// 21. Typed pipeline with error handling
type PipeResult<T> = { ok: true; value: T } | { ok: false; error: Error };
function safePipe<A, B>(
  val: A,
  ...fns: Array<(v: any) => any>
): PipeResult<B> {
  try {
    const result = fns.reduce((acc, fn) => fn(acc), val);
    return { ok: true, value: result as B };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e : new Error(String(e)) };
  }
}

// 22. Typed function tracer
function trace<T extends (...args: any[]) => any>(
  fn: T,
  options: { name?: string; logArgs?: boolean; logResult?: boolean } = {}
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const label = options.name ?? fn.name;
    if (options.logArgs) console.log(`[${label}] args:`, args);
    const result = fn(...args);
    if (options.logResult) console.log(`[${label}] result:`, result);
    return result;
  }) as T;
}

// 23. Monad-like chain via function
class Task<T> {
  constructor(private readonly run_: () => Promise<T>) {}
  static of<T>(val: T): Task<T> { return new Task(() => Promise.resolve(val)); }
  map<U>(fn: (v: T) => U): Task<U> { return new Task(() => this.run_().then(fn)); }
  chain<U>(fn: (v: T) => Task<U>): Task<U> { return new Task(() => this.run_().then((v) => fn(v).run())); }
  run(): Promise<T> { return this.run_(); }
}

// 24. Generic reducer with typed actions
type Action2<Type extends string, Payload = undefined> =
  Payload extends undefined ? { type: Type } : { type: Type; payload: Payload };
type ActionMap = {
  [type: string]: unknown;
};
function createReducer<State, AM extends ActionMap>(
  initial: State,
  handlers: { [K in keyof AM]: (state: State, payload: AM[K]) => State }
) {
  type Actions = { [K in keyof AM]: Action2<K & string, AM[K]> }[keyof AM];
  return (state: State = initial, action: Actions): State => {
    const handler = handlers[(action as any).type];
    if (!handler) return state;
    return handler(state, (action as any).payload);
  };
}

// 25. Typed function registry
function createRegistry<Methods extends Record<string, (...args: any[]) => any>>() {
  const registry = {} as Methods;
  return {
    register<K extends keyof Methods>(name: K, fn: Methods[K]): void {
      registry[name] = fn;
    },
    call<K extends keyof Methods>(name: K, ...args: Parameters<Methods[K]>): ReturnType<Methods[K]> {
      return registry[name](...args);
    },
  };
}

// 26. Phantom type via generic function
declare const _phantom: unique symbol;
type PhantomType<T, P> = T & { [_phantom]: P };
function tag2<P>() {
  return function<T>(val: T): PhantomType<T, P> {
    return val as PhantomType<T, P>;
  };
}
type UserID = { _type: "UserID" };
const tagUserId = tag2<UserID>();
const uid = tagUserId(42); // PhantomType<number, UserID>

// 27. Function with overload that switches between sync and async
function load(url: string, async: true): Promise<string>;
function load(url: string, async: false): string;
function load(url: string, async: boolean): string | Promise<string> {
  if (async) return fetch(url).then((r) => r.text());
  return `cached:${url}`;
}
const syncResult = load("/api", false);   // string
const asyncResult = load("/api", true);   // Promise<string>

// 28. Typed fixed-point combinator (Y combinator)
type LazyFn<T> = (f: LazyFn<T>) => T;
function Y<T>(fn: (self: (...args: any[]) => T) => (...args: any[]) => T): (...args: any[]) => T {
  const self = (...args: any[]): T => fn(self)(...args);
  return self;
}
const factorial = Y<number>((self) => (n: number) => n <= 1 ? 1 : n * self(n - 1));
const fact5 = factorial(5); // 120

// 29. Type-level function composition check
type ComposeCheck<F extends (...args: any[]) => any, G extends (...args: any[]) => any> =
  ReturnType<G> extends Parameters<F>[0] ? true : false;
type CanCompose = ComposeCheck<(n: number) => string, (s: string) => number>; // true

// 30. Auto-curried function via Proxy (type-level)
type AutoCurry<F extends (...args: any[]) => any> =
  Parameters<F> extends [infer A]
    ? F
    : Parameters<F> extends [infer A, ...infer Rest]
    ? (a: A) => AutoCurry<(...args: Rest) => ReturnType<F>>
    : never;

// 31. Typed event queue
class TypedQueue<T> {
  private queue: T[] = [];
  private handlers: Array<(item: T) => void> = [];
  push(item: T): void {
    const handler = this.handlers.shift();
    if (handler) handler(item);
    else this.queue.push(item);
  }
  pop(): Promise<T> {
    return new Promise((resolve) => {
      const item = this.queue.shift();
      if (item !== undefined) resolve(item);
      else this.handlers.push(resolve);
    });
  }
}

// 32. Generic lens (functional getter/setter)
type Lens<S, A> = {
  get(s: S): A;
  set(a: A, s: S): S;
};
function lens<S, A>(get: (s: S) => A, set: (a: A, s: S) => S): Lens<S, A> {
  return { get, set };
}
const nameLens = lens<{ name: string; age: number }, string>(
  (s) => s.name,
  (a, s) => ({ ...s, name: a })
);

// 33. Typed decorator factory
function readonly2<T extends object, K extends keyof T>(
  _target: T,
  key: K,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  descriptor.writable = false;
  return descriptor;
}

// 34. Typed interceptor pattern
type Interceptor<T> = {
  request?: (req: T) => T | Promise<T>;
  response?: (res: T) => T | Promise<T>;
  error?: (err: Error) => never | Promise<never>;
};
function createInterceptorChain<T>(interceptors: Interceptor<T>[]) {
  return {
    async processRequest(req: T): Promise<T> {
      let current = req;
      for (const ic of interceptors) {
        if (ic.request) current = await ic.request(current);
      }
      return current;
    },
  };
}

// 35. Pattern match via overloads
function match<T>(val: T): {
  when<V extends T>(pred: (v: T) => v is V, handler: (v: V) => unknown): ReturnType<typeof match>;
  otherwise(handler: (v: T) => unknown): unknown;
} {
  let matched = false;
  let result: unknown;
  return {
    when(pred, handler) {
      if (!matched && pred(val)) { matched = true; result = handler(val as any); }
      return this;
    },
    otherwise(handler) {
      return matched ? result : handler(val);
    },
  };
}

// 36. Typed trampoline for TCO
type Thunk<T> = { _type: "thunk"; fn: () => Bounced<T> };
type Done<T> = { _type: "done"; value: T };
type Bounced<T> = Thunk<T> | Done<T>;
function thunk<T>(fn: () => Bounced<T>): Thunk<T> { return { _type: "thunk", fn }; }
function done<T>(value: T): Done<T> { return { _type: "done", value }; }
function trampoline<T>(bounced: Bounced<T>): T {
  let current = bounced;
  while (current._type === "thunk") current = current.fn();
  return current.value;
}

// 37. Typed function recorder (spy)
function createSpy<T extends (...args: any[]) => any>(fn: T): T & {
  calls: Parameters<T>[];
  results: ReturnType<T>[];
} {
  const calls: Parameters<T>[] = [];
  const results: ReturnType<T>[] = [];
  const spy = ((...args: Parameters<T>): ReturnType<T> => {
    calls.push(args);
    const r = fn(...args);
    results.push(r);
    return r;
  }) as T & { calls: Parameters<T>[]; results: ReturnType<T>[] };
  spy.calls = calls;
  spy.results = results;
  return spy;
}

// 38. Generic state transition
type StateTransition<S extends string, E extends string> = {
  from: S | S[];
  event: E;
  to: S;
  guard?: (state: S) => boolean;
};
function createStateMachine<S extends string, E extends string>(
  initial: S,
  transitions: StateTransition<S, E>[]
) {
  let current: S = initial;
  return {
    get state(): S { return current; },
    send(event: E): boolean {
      const t = transitions.find((t) => {
        const froms = Array.isArray(t.from) ? t.from : [t.from];
        return froms.includes(current) && t.event === event && (!t.guard || t.guard(current));
      });
      if (!t) return false;
      current = t.to;
      return true;
    },
  };
}

// 39. Typed function pipeline with error propagation
type Result2<T> = { ok: true; value: T } | { ok: false; error: string };
function andThen<T, U>(
  result: Result2<T>,
  fn: (v: T) => Result2<U>
): Result2<U> {
  return result.ok ? fn(result.value) : result;
}

// 40. Deep function serialization via JSON replacer/reviver
type Serialized<T> = string;
function serialize2<T>(val: T, replacer?: (key: string, v: unknown) => unknown): Serialized<T> {
  return JSON.stringify(val, replacer as any);
}
function deserialize2<T>(s: Serialized<T>, reviver?: (key: string, v: unknown) => unknown): T {
  return JSON.parse(s, reviver as any) as T;
}

// 41. Generic type-safe fetch with schema
async function fetchJson<T>(
  url: string,
  schema: (raw: unknown) => T
): Promise<T> {
  const res = await fetch(url);
  const json = await res.json();
  return schema(json);
}

// 42. Infer type of last argument
type LastArg<F extends (...args: any[]) => any> =
  Parameters<F> extends [...any[], infer Last] ? Last : never;
type LastP = LastArg<(a: string, b: number, c: boolean) => void>; // boolean

// 43. Flipped function (swap first two args)
function flip<A, B, C>(fn: (a: A, b: B) => C): (b: B, a: A) => C {
  return (b, a) => fn(a, b);
}
const flippedAdd = flip((a: number, b: string) => `${a}+${b}`);
flippedAdd("x", 1); // "1+x"

// 44. Typed async retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  { maxAttempts = 3, baseDelay = 100 }: { maxAttempts?: number; baseDelay?: number } = {}
): Promise<T> {
  let attempt = 0;
  while (attempt < maxAttempts) {
    try { return await fn(); }
    catch (e) {
      attempt++;
      if (attempt >= maxAttempts) throw e;
      await new Promise((r) => setTimeout(r, baseDelay * 2 ** (attempt - 1)));
    }
  }
  throw new Error("Max attempts exceeded");
}

// 45. Generic lazy value
function lazy<T>(factory: () => T): () => T {
  let computed = false;
  let value: T;
  return () => {
    if (!computed) { value = factory(); computed = true; }
    return value!;
  };
}

// 46. Typed event system with wildcard
type WildcardHandler<T extends Record<string, unknown>> = (
  event: keyof T,
  data: T[keyof T]
) => void;
function onAny<T extends Record<string, unknown>>(
  emitter: { on<K extends keyof T>(e: K, fn: (d: T[K]) => void): void },
  events: (keyof T)[],
  handler: WildcardHandler<T>
): void {
  for (const e of events) emitter.on(e, (d) => handler(e, d as T[keyof T]));
}

// 47. Function that extracts typed fields from schema
function extract<T, Keys extends keyof T>(obj: T, ...keys: Keys[]): Pick<T, Keys> {
  return Object.fromEntries(keys.map((k) => [k, obj[k]])) as Pick<T, Keys>;
}
const full = { id: 1, name: "Alice", email: "a@b.com", role: "admin" };
const pub = extract(full, "id", "name"); // { id: number; name: string }

// 48. Typed function profiler
function profile<T extends (...args: any[]) => any>(fn: T): T & { lastDuration: number } {
  let lastDuration = 0;
  const wrapped = ((...args: Parameters<T>): ReturnType<T> => {
    const start = performance.now();
    const result = fn(...args);
    lastDuration = performance.now() - start;
    return result;
  }) as T & { lastDuration: number };
  Object.defineProperty(wrapped, "lastDuration", { get: () => lastDuration });
  return wrapped;
}

// 49. Type-safe key path getter
type PathValue<T, P extends string> =
  P extends `${infer K}.${infer Rest}`
    ? K extends keyof T ? PathValue<T[K], Rest> : never
    : P extends keyof T ? T[P] : never;
function getPath<T extends object, P extends string>(obj: T, path: P): PathValue<T, P> {
  return path.split(".").reduce<any>((o, k) => o?.[k], obj);
}
const o = { a: { b: { c: 42 } } };
const val = getPath(o, "a.b.c"); // number (at runtime: 42)

// 50. Typed function scheduler
interface Schedule<T> {
  run(): Promise<T>;
  after(ms: number): Schedule<T>;
  retry(times: number): Schedule<T>;
}
function schedule<T>(fn: () => Promise<T>): Schedule<T> {
  let delay = 0;
  let retries = 0;
  const sched: Schedule<T> = {
    after(ms) { delay = ms; return sched; },
    retry(times) { retries = times; return sched; },
    async run() {
      await new Promise((r) => setTimeout(r, delay));
      let attempt = 0;
      while (true) {
        try { return await fn(); }
        catch (e) {
          if (++attempt > retries) throw e;
        }
      }
    },
  };
  return sched;
}
