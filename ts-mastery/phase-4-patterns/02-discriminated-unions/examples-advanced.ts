export {};

// ============================================================
// ADVANCED EXAMPLES — Discriminated Unions (50 Examples)
// ============================================================

// 1. Type-level exhaustive pattern matching with never-escape
type Shape1 = { kind: "circle"; r: number } | { kind: "rect"; w: number; h: number } | { kind: "tri"; b: number; h: number };
function assertNever(x: never): never { throw new Error(`Unhandled: ${JSON.stringify(x)}`); }
function shapeArea(s: Shape1): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.r ** 2;
    case "rect": return s.w * s.h;
    case "tri": return 0.5 * s.b * s.h;
    default: return assertNever(s);
  }
}

// 2. Union to mapped type transform — build a handler object from a union
type Events2 = { type: "click"; x: number; y: number } | { type: "keydown"; key: string } | { type: "resize"; width: number; height: number };
type EventHandlerMap2 = { [K in Events2["type"]]: (event: Extract<Events2, { type: K }>) => void };
const handlers2: EventHandlerMap2 = {
  click: e => console.log(`click at ${e.x},${e.y}`),
  keydown: e => console.log(`key: ${e.key}`),
  resize: e => console.log(`resize: ${e.width}x${e.height}`),
};
function dispatch2(event: Events2): void { (handlers2 as any)[event.type](event); }

// 3. Recursive discriminated union with generic fold
type Expr3 =
  | { tag: "lit"; val: number }
  | { tag: "var"; name: string }
  | { tag: "binop"; op: "+" | "-" | "*" | "/"; left: Expr3; right: Expr3 }
  | { tag: "let"; name: string; rhs: Expr3; body: Expr3 }
  | { tag: "if"; cond: Expr3; then: Expr3; else: Expr3 };
type ExprAlgebra<T> = {
  lit: (val: number) => T;
  var: (name: string) => T;
  binop: (op: string, left: T, right: T) => T;
  let: (name: string, rhs: T, body: T) => T;
  if: (cond: T, then: T, else_: T) => T;
};
function foldExpr<T>(expr: Expr3, alg: ExprAlgebra<T>): T {
  switch (expr.tag) {
    case "lit": return alg.lit(expr.val);
    case "var": return alg.var(expr.name);
    case "binop": return alg.binop(expr.op, foldExpr(expr.left, alg), foldExpr(expr.right, alg));
    case "let": return alg.let(expr.name, foldExpr(expr.rhs, alg), foldExpr(expr.body, alg));
    case "if": return alg.if(foldExpr(expr.cond, alg), foldExpr(expr.then, alg), foldExpr(expr.else, alg));
  }
}
const evaluator: ExprAlgebra<(env: Record<string, number>) => number> = {
  lit: val => _ => val,
  var: name => env => env[name] ?? 0,
  binop: (op, l, r) => env => { const lv = l(env), rv = r(env); return op === "+" ? lv + rv : op === "-" ? lv - rv : op === "*" ? lv * rv : lv / rv; },
  let: (name, rhs, body) => env => { const val = rhs(env); return body({ ...env, [name]: val }); },
  if: (cond, then, else_) => env => cond(env) !== 0 ? then(env) : else_(env),
};
const printer: ExprAlgebra<string> = {
  lit: val => String(val),
  var: name => name,
  binop: (op, l, r) => `(${l} ${op} ${r})`,
  let: (name, rhs, body) => `let ${name} = ${rhs} in ${body}`,
  if: (cond, then, else_) => `if ${cond} then ${then} else ${else_}`,
};

// 4. Discriminated union as GADT-style phantom type
type PhantomTag<T> = { readonly _tag: T };
type Serialized<T> = string & PhantomTag<{ _serialized: T }>;
type Validated<T> = T & PhantomTag<{ _validated: true }>;
type SafeQuery = string & PhantomTag<{ _safe: true }>;
function serialize<T>(val: T): Serialized<T> { return JSON.stringify(val) as Serialized<T>; }
function deserialize<T>(s: Serialized<T>): T { return JSON.parse(s) as T; }
function sanitize(input: string): SafeQuery { return input.replace(/['"\\;]/g, "") as SafeQuery; }

// 5. Type-level state machine enforced by discriminated union types
type Locked = { _tag: "Locked" };
type Unlocked = { _tag: "Unlocked" };
type StatefulDoor<State> = { state: State; id: string };
function unlock(door: StatefulDoor<Locked>, code: string): StatefulDoor<Unlocked> {
  if (code !== "1234") throw new Error("Wrong code");
  return { state: { _tag: "Unlocked" }, id: door.id };
}
function lock(door: StatefulDoor<Unlocked>): StatefulDoor<Locked> {
  return { state: { _tag: "Locked" }, id: door.id };
}
function openDoor(door: StatefulDoor<Unlocked>): void { console.log(`Door ${door.id} opened`); }
// Compile-time: cannot openDoor a Locked door
const lockedDoor: StatefulDoor<Locked> = { state: { _tag: "Locked" }, id: "main" };
const unlockedDoor = unlock(lockedDoor, "1234");
openDoor(unlockedDoor);

// 6. Discriminated union with type-level distributive conditional
type DiscriminatedPayload<T extends { type: string }> = {
  [K in T["type"]]: Extract<T, { type: K }> extends { payload: infer P } ? P : never
};
type AppEvent6 =
  | { type: "USER_LOGIN"; payload: { userId: string; method: string } }
  | { type: "USER_LOGOUT"; payload: { userId: string } }
  | { type: "ORDER_PLACED"; payload: { orderId: string; amount: number } };
type Payloads6 = DiscriminatedPayload<AppEvent6>;
type LoginPayload = Payloads6["USER_LOGIN"]; // { userId: string; method: string }

// 7. Union type for type-safe event sourcing with version tracking
type Version7<N extends number> = { _version: N };
type EventV1 = { schema: "v1"; name: string; email: string } & Version7<1>;
type EventV2 = { schema: "v2"; profile: { firstName: string; lastName: string }; email: string } & Version7<2>;
type EventV3 = { schema: "v3"; profile: { firstName: string; lastName: string; displayName: string }; contact: { email: string; phone?: string } } & Version7<3>;
type VersionedEvent = EventV1 | EventV2 | EventV3;
function migrateToV3(event: VersionedEvent): EventV3 {
  switch (event.schema) {
    case "v1": return { schema: "v3", _version: 3, profile: { firstName: event.name.split(" ")[0], lastName: event.name.split(" ")[1] ?? "", displayName: event.name }, contact: { email: event.email } };
    case "v2": return { schema: "v3", _version: 3, profile: { ...event.profile, displayName: `${event.profile.firstName} ${event.profile.lastName}` }, contact: { email: event.email } };
    case "v3": return event;
  }
}

// 8. Converting discriminated union to intersection via conditional types
type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
type Events8 = { click: { x: number } } | { keydown: { key: string } } | { scroll: { delta: number } };
type EventIntersection = UnionToIntersection<Events8>; // { click: ... } & { keydown: ... } & { scroll: ... }

// 9. Union to produce type-safe builder pattern
type BuilderStep<Remaining extends string, Done extends string> = {
  done: Done;
  remaining: Remaining;
};
type UserStep9 = BuilderStep<"name" | "email" | "role", never>;
// This technique represents a fluent builder that tracks remaining required fields in its type parameters.
type RequiredDone<Required extends string, Provided extends string> = [Exclude<Required, Provided>] extends [never] ? true : false;
class TypeSafeBuilderDemo<Provided extends string = never> {
  private data: Record<string, unknown> = {};
  set<K extends string>(k: K, v: unknown): TypeSafeBuilderDemo<Provided | K> { this.data[k] = v; return this as any; }
  build(this: TypeSafeBuilderDemo<"name" | "email" | Provided>): Record<string, unknown> { return { ...this.data }; }
}
const builtDemo = new TypeSafeBuilderDemo().set("name", "Alice").set("email", "a@b.com").build();

// 10. Dual discriminant union — narrowed by two discriminants
type NetworkEvent10 =
  | { protocol: "tcp"; direction: "inbound"; bytes: number; src: string }
  | { protocol: "tcp"; direction: "outbound"; bytes: number; dst: string }
  | { protocol: "udp"; direction: "inbound"; bytes: number; src: string; dropped: boolean }
  | { protocol: "udp"; direction: "outbound"; bytes: number; dst: string };
function networkEventKey(e: NetworkEvent10): string {
  if (e.protocol === "tcp" && e.direction === "inbound") return `tcp-in:${e.src}`;
  if (e.protocol === "tcp" && e.direction === "outbound") return `tcp-out:${e.dst}`;
  if (e.protocol === "udp" && e.direction === "inbound") return `udp-in:${e.src}${e.dropped ? "(dropped)" : ""}`;
  return `udp-out:${e.dst}`;
}

// 11. Union as type-safe configuration with inference
type PluginConfig<Name extends string, Opts extends object> = { plugin: Name; options: Opts };
type KnownPlugin =
  | PluginConfig<"auth", { secret: string; expiresIn: string }>
  | PluginConfig<"cors", { origins: string[]; credentials: boolean }>
  | PluginConfig<"rateLimit", { windowMs: number; max: number }>;
type PluginOptions<P extends KnownPlugin["plugin"]> = Extract<KnownPlugin, { plugin: P }>["options"];
function configurePlugin<P extends KnownPlugin["plugin"]>(plugin: P, options: PluginOptions<P>): KnownPlugin {
  return { plugin, options } as KnownPlugin;
}
const authConfig = configurePlugin("auth", { secret: "abc123", expiresIn: "1h" });

// 12. Type-safe discriminated union for observable values
type ObservableState12<T> =
  | { kind: "initial"; defaultValue?: T }
  | { kind: "pending" }
  | { kind: "value"; current: T; previous?: T; updatedAt: Date }
  | { kind: "error"; error: Error; lastValue?: T };
function combineObservables<A, B, C>(
  a: ObservableState12<A>,
  b: ObservableState12<B>,
  combine: (a: A, b: B) => C
): ObservableState12<C> {
  if (a.kind === "error") return a;
  if (b.kind === "error") return b;
  if (a.kind === "pending" || b.kind === "pending") return { kind: "pending" };
  if (a.kind === "value" && b.kind === "value") return { kind: "value", current: combine(a.current, b.current), updatedAt: new Date() };
  return { kind: "initial" };
}

// 13. Union for dependent type simulation
type NonEmpty<T extends string> = T extends "" ? never : T;
type PositiveInt<N extends number> = number extends N ? never : `${N}` extends `-${string}` | "0" ? never : N;
type Tagged13<Tag extends string, T> = T & { readonly __tag: Tag };
type EmailAddress = Tagged13<"Email", string>;
type UserId = Tagged13<"UserId", string>;
function createEmail(s: string): EmailAddress | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s as EmailAddress : null;
}
function createUserId(s: string): UserId | null {
  return s.length > 0 ? s as UserId : null;
}

// 14. Discriminated union with type-level computation
type UnionKeys14<T> = T extends { [K in keyof T]: unknown } ? keyof T : never;
type SharedKeys14<T extends { kind: string }> = Omit<T, "kind">;
type DiscriminantValues14<T extends { kind: string }> = T["kind"];
type BaseEvent14 = { id: string; timestamp: number };
type DomainEvent14 =
  | (BaseEvent14 & { kind: "created"; name: string })
  | (BaseEvent14 & { kind: "updated"; changes: Record<string, unknown> })
  | (BaseEvent14 & { kind: "deleted" });
type EventTypes14 = DiscriminantValues14<DomainEvent14>; // "created" | "updated" | "deleted"
type SharedEventData14 = BaseEvent14; // id, timestamp are always present

// 15. Union with type inference from match
type Variants15 = { tag: "A"; a: string } | { tag: "B"; b: number } | { tag: "C"; c: boolean };
type MatchReturn15<T extends Variants15, Cases extends { [K in T["tag"]]: unknown }> = Cases[T["tag"]];
function match15<T extends Variants15, Cases extends { [K in T["tag"]]: (val: Extract<T, { tag: K }>) => any }>(
  value: T,
  cases: Cases
): ReturnType<Cases[T["tag"]]> {
  return (cases as any)[value.tag](value);
}
const result15 = match15({ tag: "A", a: "hello" }, {
  A: v => v.a.length,
  B: v => v.b * 2,
  C: v => !v.c,
});

// 16. Union for type-safe state transitions with invariant checking
type Transition16<From extends string, To extends string, Event extends string, Data = void> = { from: From; to: To; event: Event; data: Data };
type CheckoutTransitions =
  | Transition16<"cart", "address", "next">
  | Transition16<"address", "payment", "next", { address: string }>
  | Transition16<"payment", "review", "next", { paymentToken: string }>
  | Transition16<"review", "confirmed", "confirm">
  | Transition16<"cart" | "address" | "payment" | "review", "cart", "back">
  | Transition16<"cart" | "address" | "payment" | "review", "cancelled", "cancel">;
type ValidFromStates = CheckoutTransitions["from"];
type ValidToStates = CheckoutTransitions["to"];

// 17. ADT-style recursive expression type
type BoolExpr17 =
  | { kind: "true" }
  | { kind: "false" }
  | { kind: "not"; expr: BoolExpr17 }
  | { kind: "and"; left: BoolExpr17; right: BoolExpr17 }
  | { kind: "or"; left: BoolExpr17; right: BoolExpr17 }
  | { kind: "xor"; left: BoolExpr17; right: BoolExpr17 }
  | { kind: "var"; name: string };
function evalBool(expr: BoolExpr17, vars: Record<string, boolean>): boolean {
  switch (expr.kind) {
    case "true": return true;
    case "false": return false;
    case "not": return !evalBool(expr.expr, vars);
    case "and": return evalBool(expr.left, vars) && evalBool(expr.right, vars);
    case "or": return evalBool(expr.left, vars) || evalBool(expr.right, vars);
    case "xor": return evalBool(expr.left, vars) !== evalBool(expr.right, vars);
    case "var": return vars[expr.name] ?? false;
  }
}
const boolExpr: BoolExpr17 = { kind: "and", left: { kind: "var", name: "x" }, right: { kind: "not", expr: { kind: "var", name: "y" } } };
const boolResult = evalBool(boolExpr, { x: true, y: false });

// 18. Union as type-safe command bus
type CommandBusMessage18 =
  | { command: "CreateUser"; id: string; name: string; email: string }
  | { command: "DeleteUser"; id: string; reason: string }
  | { command: "UpdateRole"; id: string; role: "admin" | "user" | "moderator" };
type CommandResult18<C extends CommandBusMessage18["command"]> = C extends "CreateUser" ? { userId: string } : C extends "DeleteUser" ? { deleted: boolean } : { updated: boolean };
type Handler18<C extends CommandBusMessage18["command"]> = (cmd: Extract<CommandBusMessage18, { command: C }>) => CommandResult18<C>;
type CommandBus18 = { [C in CommandBusMessage18["command"]]: Handler18<C> };
const commandBus18: CommandBus18 = {
  CreateUser: cmd => ({ userId: `${cmd.name.toLowerCase()}_${Date.now()}` }),
  DeleteUser: cmd => ({ deleted: true }),
  UpdateRole: cmd => ({ updated: true }),
};

// 19. Refined union types via type predicates and asserts
type RawData19 = { type: "raw"; data: unknown };
type ParsedUser19 = { type: "user"; id: string; name: string; email: string };
type ParsedOrder19 = { type: "order"; orderId: string; total: number };
type ParsedData19 = ParsedUser19 | ParsedOrder19;
function parseData(raw: RawData19): ParsedData19 {
  const d = raw.data as any;
  if (d?.type === "user") return { type: "user", id: d.id, name: d.name, email: d.email };
  return { type: "order", orderId: d.orderId, total: d.total };
}
function assertIsUser(d: ParsedData19): asserts d is ParsedUser19 {
  if (d.type !== "user") throw new Error("Not a user");
}

// 20. Type-safe union for parser combinators
type ParseSuccess20<T> = { success: true; value: T; rest: string };
type ParseFailure20 = { success: false; error: string; position: number };
type ParseResult20<T> = ParseSuccess20<T> | ParseFailure20;
type Parser20<T> = (input: string) => ParseResult20<T>;
function map20<T, U>(parser: Parser20<T>, fn: (val: T) => U): Parser20<U> {
  return input => {
    const r = parser(input);
    return r.success ? { success: true, value: fn(r.value), rest: r.rest } : r;
  };
}
function seq20<A, B>(pa: Parser20<A>, pb: Parser20<B>): Parser20<[A, B]> {
  return input => {
    const ra = pa(input);
    if (!ra.success) return ra;
    const rb = pb(ra.rest);
    if (!rb.success) return rb;
    return { success: true, value: [ra.value, rb.value], rest: rb.rest };
  };
}

// 21. Union producing different constraint sets via conditional types
type Constraint21<T> =
  T extends string ? { minLength?: number; maxLength?: number; pattern?: RegExp } :
  T extends number ? { min?: number; max?: number; integer?: boolean } :
  T extends boolean ? { default?: boolean } :
  T extends (infer E)[] ? { minItems?: number; maxItems?: number; uniqueItems?: boolean; itemConstraint?: Constraint21<E> } :
  never;
function createConstraint<T>(val: Constraint21<T>): Constraint21<T> { return val; }
const strConstraint = createConstraint<string>({ minLength: 1, maxLength: 100, pattern: /^[a-z]+$/ });
const numConstraint = createConstraint<number>({ min: 0, max: 1000, integer: true });

// 22. Discriminated union for type-level proof terms
type Proof22<Claim> = { readonly _claim: Claim };
type IsAdmin22 = Proof22<"isAdmin">;
type IsAuthenticated22 = Proof22<"isAuthenticated">;
function proveAdmin(userId: string): IsAdmin22 | null {
  return userId.startsWith("admin_") ? { _claim: "isAdmin" } : null;
}
function proveAuthenticated(token: string): IsAuthenticated22 | null {
  return token.length > 10 ? { _claim: "isAuthenticated" } : null;
}
function sensitiveOperation(proof: IsAdmin22 & IsAuthenticated22): void {
  console.log("Performing sensitive operation");
}

// 23. Union with type-safe tagged template literal types
type EventName23 = `${string}:${string}`;
type UserEvent23 = `user:${"login" | "logout" | "created" | "deleted"}`;
type OrderEvent23 = `order:${"placed" | "paid" | "shipped" | "delivered"}`;
type AppEventName23 = UserEvent23 | OrderEvent23;
type EventPayload23<T extends AppEventName23> =
  T extends "user:login" ? { userId: string; method: string } :
  T extends "user:logout" ? { userId: string } :
  T extends "user:created" ? { userId: string; name: string; email: string } :
  T extends "order:placed" ? { orderId: string; total: number } :
  T extends "order:shipped" ? { orderId: string; trackingNumber: string } :
  Record<string, unknown>;
function emit23<E extends AppEventName23>(event: E, payload: EventPayload23<E>): void {
  console.log(event, payload);
}
emit23("user:login", { userId: "u1", method: "oauth" });
emit23("order:placed", { orderId: "o1", total: 99.99 });

// 24. Union for type-safe access control matrix
type Permission24 = "read" | "write" | "delete" | "admin";
type Role24 = "guest" | "user" | "moderator" | "admin";
type ACLEntry24<R extends Role24, P extends Permission24> = { role: R; permission: P; granted: boolean };
type ACLMatrix24 = ACLEntry24<Role24, Permission24>[];
const defaultACL: ACLMatrix24 = [
  { role: "guest", permission: "read", granted: true },
  { role: "user", permission: "read", granted: true },
  { role: "user", permission: "write", granted: true },
  { role: "moderator", permission: "delete", granted: true },
  { role: "admin", permission: "admin", granted: true },
];
function checkPermission(acl: ACLMatrix24, role: Role24, permission: Permission24): boolean {
  return acl.some(e => e.role === role && e.permission === permission && e.granted);
}

// 25. Union for free monad / effect system
type IO25<T> =
  | { kind: "pure"; value: T }
  | { kind: "effect"; tag: "log"; message: string; next: IO25<T> }
  | { kind: "effect"; tag: "read"; key: string; next: (val: string) => IO25<T> }
  | { kind: "effect"; tag: "write"; key: string; value: string; next: IO25<T> };
function mapIO25<T, U>(io: IO25<T>, fn: (val: T) => U): IO25<U> {
  switch (io.kind) {
    case "pure": return { kind: "pure", value: fn(io.value) };
    case "effect":
      if (io.tag === "read") return { kind: "effect", tag: "read", key: io.key, next: v => mapIO25(io.next(v), fn) };
      if (io.tag === "log") return { kind: "effect", tag: "log", message: io.message, next: mapIO25(io.next, fn) };
      return { kind: "effect", tag: "write", key: io.key, value: io.value, next: mapIO25(io.next, fn) };
  }
}

// 26. Type-safe discriminated union reducer with middleware
type ReducerMiddleware26<S, A extends { type: string }> = (state: S, action: A, next: (state: S, action: A) => S) => S;
function applyMiddleware26<S, A extends { type: string }>(
  reducer: (state: S, action: A) => S,
  ...middlewares: ReducerMiddleware26<S, A>[]
): (state: S, action: A) => S {
  return middlewares.reduceRight(
    (nextReducer, mw) => (state: S, action: A) => mw(state, action, nextReducer),
    reducer
  );
}
type CounterAction26 = { type: "INC"; amount: number } | { type: "DEC"; amount: number } | { type: "RESET" };
const counterReducer26 = (state: number, action: CounterAction26): number => {
  switch (action.type) {
    case "INC": return state + action.amount;
    case "DEC": return state - action.amount;
    case "RESET": return 0;
  }
};
const logMiddleware26: ReducerMiddleware26<number, CounterAction26> = (state, action, next) => {
  console.log("before:", state, action.type);
  const result = next(state, action);
  console.log("after:", result);
  return result;
};

// 27. Union for higher-order type manipulation
type DeepReadonly27<T> =
  T extends (infer E)[] ? ReadonlyArray<DeepReadonly27<E>> :
  T extends Map<infer K, infer V> ? ReadonlyMap<DeepReadonly27<K>, DeepReadonly27<V>> :
  T extends Set<infer E> ? ReadonlySet<DeepReadonly27<E>> :
  T extends object ? { readonly [K in keyof T]: DeepReadonly27<T[K]> } :
  T;
type MutableState27 = { user: { name: string; roles: string[] }; config: Map<string, number> };
type ImmutableState27 = DeepReadonly27<MutableState27>;

// 28. Union for type-safe cursor-based pagination with result wrapping
type CursorPage28<T, Cursor> =
  | { hasMore: true; items: T[]; nextCursor: Cursor; prevCursor?: Cursor; total?: number }
  | { hasMore: false; items: T[]; prevCursor?: Cursor; total: number };
function mapPage28<T, U, C>(page: CursorPage28<T, C>, fn: (item: T) => U): CursorPage28<U, C> {
  const items = page.items.map(fn);
  return page.hasMore
    ? { hasMore: true, items, nextCursor: page.nextCursor, prevCursor: page.prevCursor, total: page.total }
    : { hasMore: false, items, prevCursor: page.prevCursor, total: page.total };
}

// 29. Union with compile-time validation via conditional never
type RequireField29<T, K extends keyof T> = T & { [P in K]-?: NonNullable<T[P]> };
type UserCreate29 = { name: string; email?: string; role?: string };
type RequiredUserCreate29 = RequireField29<UserCreate29, "email">;
// RequiredUserCreate29 has email as required — TypeScript enforces this.

// 30. Union for composable type validators
type Validator30<T> = (val: unknown) => val is T;
function unionValidator30<A, B>(va: Validator30<A>, vb: Validator30<B>): Validator30<A | B> {
  return (val: unknown): val is A | B => va(val) || vb(val);
}
function intersectionValidator30<A, B>(va: Validator30<A>, vb: Validator30<B>): Validator30<A & B> {
  return (val: unknown): val is A & B => va(val) && vb(val);
}
function isString30(val: unknown): val is string { return typeof val === "string"; }
function isNumber30(val: unknown): val is number { return typeof val === "number"; }
const isStringOrNumber = unionValidator30(isString30, isNumber30);

// 31. Discriminated union for type-safe monadic composition
type Either31<L, R> = { _tag: "Left"; left: L } | { _tag: "Right"; right: R };
const Left = <L>(l: L): Either31<L, never> => ({ _tag: "Left", left: l });
const Right = <R>(r: R): Either31<never, R> => ({ _tag: "Right", right: r });
function mapRight31<L, A, B>(e: Either31<L, A>, fn: (val: A) => B): Either31<L, B> {
  return e._tag === "Right" ? Right(fn(e.right)) : e;
}
function flatMapRight31<L, A, B>(e: Either31<L, A>, fn: (val: A) => Either31<L, B>): Either31<L, B> {
  return e._tag === "Right" ? fn(e.right) : e;
}
function bimap31<L, R, L2, R2>(e: Either31<L, R>, mapLeft: (l: L) => L2, mapRight: (r: R) => R2): Either31<L2, R2> {
  return e._tag === "Right" ? Right(mapRight(e.right)) : Left(mapLeft(e.left));
}

// 32. Union for type-safe graph operations
type NodeId32 = string & { readonly _brand: "NodeId" };
type EdgeId32 = string & { readonly _brand: "EdgeId" };
type GraphOp32<T> =
  | { op: "addNode"; id: NodeId32; data: T }
  | { op: "removeNode"; id: NodeId32 }
  | { op: "addEdge"; id: EdgeId32; from: NodeId32; to: NodeId32; weight?: number }
  | { op: "removeEdge"; id: EdgeId32 }
  | { op: "updateNode"; id: NodeId32; data: Partial<T> };
function applyGraphOp<T>(graph: { nodes: Map<string, T>; edges: Map<string, { from: string; to: string }> }, op: GraphOp32<T>): void {
  switch (op.op) {
    case "addNode": graph.nodes.set(op.id, op.data); break;
    case "removeNode": graph.nodes.delete(op.id); break;
    case "addEdge": graph.edges.set(op.id, { from: op.from, to: op.to }); break;
    case "removeEdge": graph.edges.delete(op.id); break;
    case "updateNode": { const node = graph.nodes.get(op.id); if (node) graph.nodes.set(op.id, { ...node, ...op.data }); break; }
  }
}

// 33. Union for type-safe publish/subscribe with typed channels
type Channel33<Name extends string, Data> = { name: Name; data: Data };
type AppChannels33 =
  | Channel33<"user.events", { userId: string; event: "login" | "logout" }>
  | Channel33<"order.events", { orderId: string; event: "placed" | "paid" | "shipped" }>
  | Channel33<"system.alerts", { level: "warn" | "error" | "critical"; message: string }>;
type ChannelName33 = AppChannels33["name"];
type ChannelData33<N extends ChannelName33> = Extract<AppChannels33, { name: N }>["data"];
type Subscription33<N extends ChannelName33> = { channel: N; handler: (data: ChannelData33<N>) => void };
function subscribe33<N extends ChannelName33>(channel: N, handler: (data: ChannelData33<N>) => void): Subscription33<N> {
  return { channel, handler };
}
const userSub = subscribe33("user.events", data => console.log(`User ${data.userId}: ${data.event}`));

// 34. Union for type-safe A/B testing framework
type Variant34 = { variant: "control" } | { variant: "treatment_a"; config: { color: string; size: "sm" | "lg" } } | { variant: "treatment_b"; config: { layout: "grid" | "list" } };
type ExperimentResult34<T extends Variant34> = { variant: T; conversionRate?: number; impressions: number };
type ABTestResults34 = { [V in Variant34["variant"]]: ExperimentResult34<Extract<Variant34, { variant: V }>> };
function getWinningVariant(results: ABTestResults34): Variant34["variant"] {
  return Object.entries(results).reduce((best, [variant, result]) => {
    const bestResult = results[best as Variant34["variant"]];
    return (result.conversionRate ?? 0) > (bestResult.conversionRate ?? 0) ? variant as Variant34["variant"] : best;
  }, "control" as Variant34["variant"]);
}

// 35. Union for type-safe feature flag evaluation
type FlagContext35 = { userId: string; attributes: Record<string, string | number | boolean> };
type FlagValue35 = boolean | string | number | Record<string, unknown>;
type EvalResult35<T extends FlagValue35> =
  | { evaluated: true; value: T; reason: "default" | "rule" | "override"; ruleId?: string }
  | { evaluated: false; error: string };
type FlagDefinition35<T extends FlagValue35> = {
  key: string;
  defaultValue: T;
  evaluate: (ctx: FlagContext35) => EvalResult35<T>;
};

// 36. Union for type-safe query planning
type QueryPlan36 =
  | { planType: "seq_scan"; table: string; rows: number; cost: number }
  | { planType: "index_scan"; index: string; rows: number; cost: number; selectivity: number }
  | { planType: "nested_loop"; outer: QueryPlan36; inner: QueryPlan36; cost: number }
  | { planType: "hash_join"; left: QueryPlan36; right: QueryPlan36; joinType: "inner" | "left"; cost: number }
  | { planType: "sort"; input: QueryPlan36; fields: string[]; cost: number }
  | { planType: "limit"; input: QueryPlan36; n: number; cost: number };
function totalCost(plan: QueryPlan36): number {
  switch (plan.planType) {
    case "seq_scan":
    case "index_scan": return plan.cost;
    case "nested_loop": return plan.cost + totalCost(plan.outer) + totalCost(plan.inner);
    case "hash_join": return plan.cost + totalCost(plan.left) + totalCost(plan.right);
    case "sort":
    case "limit": return plan.cost + totalCost(plan.input);
  }
}

// 37. Union for type-safe message schemas with version negotiation
type SchemaVersion37 = 1 | 2 | 3;
type Message37<V extends SchemaVersion37, T> = { schemaVersion: V; payload: T };
type KnownMessages37 =
  | Message37<1, { name: string }>
  | Message37<2, { firstName: string; lastName: string }>
  | Message37<3, { profile: { firstName: string; lastName: string; bio?: string } }>;
function upgradeMessage(msg: KnownMessages37): Message37<3, { profile: { firstName: string; lastName: string; bio?: string } }> {
  switch (msg.schemaVersion) {
    case 1: return { schemaVersion: 3, payload: { profile: { firstName: msg.payload.name, lastName: "", bio: undefined } } };
    case 2: return { schemaVersion: 3, payload: { profile: { firstName: msg.payload.firstName, lastName: msg.payload.lastName } } };
    case 3: return msg;
  }
}

// 38. Discriminated union with exhaustive conditional type checking
type AllShapes38 = { kind: "circle"; r: number } | { kind: "square"; s: number } | { kind: "rect"; w: number; h: number };
type ExhaustiveHandler38<T extends { kind: string }, R> = { [K in T["kind"]]: (shape: Extract<T, { kind: K }>) => R };
function matchShape38<R>(shape: AllShapes38, handlers: ExhaustiveHandler38<AllShapes38, R>): R {
  return (handlers as any)[shape.kind](shape);
}
const perimeter = (s: AllShapes38) => matchShape38(s, {
  circle: ({ r }) => 2 * Math.PI * r,
  square: ({ s }) => 4 * s,
  rect: ({ w, h }) => 2 * (w + h),
});

// 39. Union for type-safe dependency declaration
type ModuleKind39 = "core" | "feature" | "utility" | "experimental";
type ModuleDecl39 =
  | { kind: "core"; name: string; version: string }
  | { kind: "feature"; name: string; version: string; requiresModules: string[]; featureFlags?: string[] }
  | { kind: "utility"; name: string; version: string; peerDeps: string[] }
  | { kind: "experimental"; name: string; version: string; stabilityDate?: Date };
function moduleWarnings(m: ModuleDecl39): string[] {
  const warnings: string[] = [];
  if (m.kind === "experimental") warnings.push(`Module '${m.name}' is experimental`);
  if (m.kind === "feature" && (m.featureFlags?.length ?? 0) > 0) warnings.push(`Requires feature flags: ${m.featureFlags!.join(", ")}`);
  return warnings;
}

// 40. Union for type-safe protocol buffer message definitions
type Proto40Field<T> = { fieldNumber: number; fieldName: string; optional: boolean; default?: T };
type ProtoMessage40 =
  | { msgType: "scalar"; field: Proto40Field<string | number | boolean>; protoType: "string" | "int32" | "bool" | "bytes" }
  | { msgType: "message"; field: Proto40Field<Record<string, unknown>>; messageType: string }
  | { msgType: "repeated"; field: Proto40Field<unknown[]>; elementType: string }
  | { msgType: "map"; field: Proto40Field<Record<string, unknown>>; keyType: "string" | "int32"; valueType: string }
  | { msgType: "oneof"; groupName: string; fields: ProtoMessage40[] };
function protoWireSize(msg: ProtoMessage40): number {
  switch (msg.msgType) {
    case "scalar": return msg.protoType === "bool" ? 1 : msg.protoType === "int32" ? 4 : msg.protoType === "bytes" ? 0 : 0;
    case "message": return 0; // variable
    case "repeated": return 0; // variable
    case "map": return 0; // variable
    case "oneof": return Math.max(0, ...msg.fields.map(protoWireSize));
  }
}

// 41. Union for type-safe event replay
type EventStore41<E extends { type: string; id: string }> = {
  events: E[];
  append: (event: E) => void;
  replay: <S>(initial: S, reducer: (state: S, event: E) => S) => S;
  filter: <K extends E["type"]>(type: K) => Extract<E, { type: K }>[];
};
type UserDomainEvent41 =
  | { type: "REGISTERED"; id: string; name: string; email: string; at: Date }
  | { type: "EMAIL_CHANGED"; id: string; newEmail: string; at: Date }
  | { type: "DEACTIVATED"; id: string; reason: string; at: Date };
function createEventStore41<E extends { type: string; id: string }>(): EventStore41<E> {
  const events: E[] = [];
  return {
    events,
    append: e => { events.push(e); },
    replay: (initial, reducer) => events.reduce(reducer, initial),
    filter: <K extends E["type"]>(type: K) => events.filter(e => e.type === type) as Extract<E, { type: K }>[],
  };
}

// 42. Union for progressive disclosure type narrowing
type InitialInput42 = { kind: "raw"; data: string };
type ParsedInput42 = { kind: "parsed"; data: { name: string; email: string } };
type ValidatedInput42 = { kind: "validated"; data: { name: string; email: string }; sanitized: boolean };
type EnrichedInput42 = { kind: "enriched"; data: { name: string; email: string }; metadata: { createdAt: Date; userId: string } };
type ProcessedInput42 = InitialInput42 | ParsedInput42 | ValidatedInput42 | EnrichedInput42;
function parse42(input: InitialInput42): ParsedInput42 {
  const [name, email] = input.data.split(",");
  return { kind: "parsed", data: { name: name.trim(), email: email.trim() } };
}
function validate42(input: ParsedInput42): ValidatedInput42 {
  return { kind: "validated", data: input.data, sanitized: true };
}

// 43. Union for type-safe config merging with override tracking
type ConfigEntry43<T> =
  | { source: "default"; value: T }
  | { source: "file"; value: T; filePath: string }
  | { source: "env"; value: T; envKey: string }
  | { source: "runtime"; value: T };
function resolveEntry43<T>(entries: ConfigEntry43<T>[]): T {
  const priority: ConfigEntry43<T>["source"][] = ["runtime", "env", "file", "default"];
  const sorted = [...entries].sort((a, b) => priority.indexOf(a.source) - priority.indexOf(b.source));
  return sorted[0].value;
}
function entrySource43<T>(e: ConfigEntry43<T>): string {
  switch (e.source) {
    case "default": return "built-in default";
    case "file": return `config file: ${e.filePath}`;
    case "env": return `env var: ${e.envKey}`;
    case "runtime": return "runtime override";
  }
}

// 44. Union for type-safe request context enrichment
type ContextPhase44 = "incoming" | "authenticated" | "authorized" | "processed";
type IncomingCtx44 = { phase: "incoming"; ip: string; method: string; path: string; headers: Record<string, string> };
type AuthenticatedCtx44 = IncomingCtx44 & { phase: "authenticated"; userId: string; sessionId: string };
type AuthorizedCtx44 = AuthenticatedCtx44 & { phase: "authorized"; permissions: string[] };
type ProcessedCtx44 = AuthorizedCtx44 & { phase: "processed"; response: { status: number; body: unknown } };
type RequestCtx44 = IncomingCtx44 | AuthenticatedCtx44 | AuthorizedCtx44 | ProcessedCtx44;
function ctxPhaseNumber(ctx: RequestCtx44): number {
  const phases: ContextPhase44[] = ["incoming", "authenticated", "authorized", "processed"];
  return phases.indexOf(ctx.phase);
}

// 45. Union for type-safe monoid composition
type Monoid45<T> = { empty: T; combine: (a: T, b: T) => T };
type BuiltinMonoids45 =
  | { monoidType: "sum"; monoid: Monoid45<number> }
  | { monoidType: "product"; monoid: Monoid45<number> }
  | { monoidType: "string"; monoid: Monoid45<string> }
  | { monoidType: "array"; monoid: Monoid45<unknown[]> }
  | { monoidType: "and"; monoid: Monoid45<boolean> }
  | { monoidType: "or"; monoid: Monoid45<boolean> };
const monoids45: BuiltinMonoids45[] = [
  { monoidType: "sum", monoid: { empty: 0, combine: (a, b) => a + b } },
  { monoidType: "product", monoid: { empty: 1, combine: (a, b) => a * b } },
  { monoidType: "string", monoid: { empty: "", combine: (a, b) => a + b } },
  { monoidType: "and", monoid: { empty: true, combine: (a, b) => a && b } },
];

// 46. Union for type-safe distributed locking
type LockResult46 =
  | { acquired: true; lockId: string; expiresAt: Date; ownerId: string }
  | { acquired: false; reason: "already_locked" | "timeout" | "error"; retryAfter?: number };
type LockOperation46 =
  | { op: "acquire"; resource: string; ownerId: string; ttl: number }
  | { op: "release"; lockId: string; ownerId: string }
  | { op: "extend"; lockId: string; additionalMs: number }
  | { op: "check"; lockId: string };
function lockOpDescription(op: LockOperation46): string {
  switch (op.op) {
    case "acquire": return `Acquire lock on '${op.resource}' for ${op.ttl}ms`;
    case "release": return `Release lock ${op.lockId}`;
    case "extend": return `Extend lock ${op.lockId} by ${op.additionalMs}ms`;
    case "check": return `Check lock ${op.lockId}`;
  }
}

// 47. Union for type-safe stream processing
type StreamEvent47<T> =
  | { streamEvent: "data"; item: T; sequenceNumber: number }
  | { streamEvent: "checkpoint"; sequenceNumber: number; timestamp: Date }
  | { streamEvent: "error"; error: Error; recoverable: boolean }
  | { streamEvent: "end"; totalItems: number; duration: number };
function processStream47<T>(events: StreamEvent47<T>[], handler: (item: T) => void): { processed: number; errors: number } {
  let processed = 0, errors = 0;
  for (const event of events) {
    if (event.streamEvent === "data") { handler(event.item); processed++; }
    else if (event.streamEvent === "error" && !event.recoverable) errors++;
  }
  return { processed, errors };
}

// 48. Union for type-safe schema evolution
type SchemaChange48 =
  | { changeType: "add_field"; field: string; fieldType: string; nullable: boolean; defaultValue?: unknown }
  | { changeType: "remove_field"; field: string; migrationScript?: string }
  | { changeType: "rename_field"; from: string; to: string }
  | { changeType: "change_type"; field: string; fromType: string; toType: string; migrationScript: string }
  | { changeType: "add_index"; fields: string[]; unique: boolean; indexName: string }
  | { changeType: "remove_index"; indexName: string };
function migrationSQL(change: SchemaChange48, table: string): string {
  switch (change.changeType) {
    case "add_field": return `ALTER TABLE ${table} ADD COLUMN ${change.field} ${change.fieldType}${change.nullable ? "" : " NOT NULL"}`;
    case "remove_field": return `ALTER TABLE ${table} DROP COLUMN ${change.field}`;
    case "rename_field": return `ALTER TABLE ${table} RENAME COLUMN ${change.from} TO ${change.to}`;
    case "change_type": return change.migrationScript;
    case "add_index": return `CREATE ${change.unique ? "UNIQUE " : ""}INDEX ${change.indexName} ON ${table}(${change.fields.join(", ")})`;
    case "remove_index": return `DROP INDEX ${change.indexName}`;
  }
}

// 49. Union for type-safe CI/CD manifest generation
type CiStep49 =
  | { stepType: "run"; name: string; command: string; env?: Record<string, string>; continueOnError?: boolean }
  | { stepType: "cache"; name: string; key: string; paths: string[]; restoreKeys?: string[] }
  | { stepType: "upload_artifact"; name: string; artifactName: string; path: string; retention?: number }
  | { stepType: "download_artifact"; name: string; artifactName: string }
  | { stepType: "checkout"; name: string; ref?: string; depth?: number };
type CiJob49 = { jobId: string; name: string; runsOn: string; needs?: string[]; steps: CiStep49[]; env?: Record<string, string> };
type CiWorkflow49 = { name: string; on: string[]; jobs: Record<string, CiJob49> };
function stepDescription(s: CiStep49): string {
  switch (s.stepType) {
    case "run": return `Run: ${s.command}`;
    case "cache": return `Cache: ${s.key}`;
    case "upload_artifact": return `Upload: ${s.artifactName}`;
    case "download_artifact": return `Download: ${s.artifactName}`;
    case "checkout": return `Checkout${s.ref ? ` @${s.ref}` : ""}`;
  }
}

// 50. Ultimate advanced union — type-safe declarative pipeline DSL
type PipelineNode50<In, Out> =
  | { nodeType: "source"; id: string; read: () => AsyncIterable<In> }
  | { nodeType: "transform"; id: string; fn: (item: In) => Out }
  | { nodeType: "filter"; id: string; predicate: (item: In) => boolean }
  | { nodeType: "flatMap"; id: string; fn: (item: In) => Out[] }
  | { nodeType: "aggregate"; id: string; fn: (acc: Out, item: In) => Out; init: Out }
  | { nodeType: "sink"; id: string; write: (item: In) => Promise<void> }
  | { nodeType: "branch"; id: string; selector: (item: In) => string; branches: Record<string, PipelineNode50<In, Out>> }
  | { nodeType: "merge"; id: string; sources: PipelineNode50<In, Out>[] };
type PipelineDefinition50<T, U> = { name: string; version: string; nodes: PipelineNode50<T, U>[]; errorHandler: (err: Error, item: T) => "skip" | "retry" | "halt" };
function nodeDescription50<In, Out>(node: PipelineNode50<In, Out>): string {
  switch (node.nodeType) {
    case "source": return `[source:${node.id}]`;
    case "transform": return `[transform:${node.id}]`;
    case "filter": return `[filter:${node.id}]`;
    case "flatMap": return `[flatMap:${node.id}]`;
    case "aggregate": return `[aggregate:${node.id}]`;
    case "sink": return `[sink:${node.id}]`;
    case "branch": return `[branch:${node.id} → ${Object.keys(node.branches).join("|")}]`;
    case "merge": return `[merge:${node.id} from ${node.sources.length} sources]`;
  }
}
