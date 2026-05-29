export {};

// ============================================================
// INTERMEDIATE EXAMPLES — Discriminated Unions (50 Examples)
// ============================================================

// 1. Union with generic type parameter
type AsyncResult<T, E = string> =
  | { status: "pending" }
  | { status: "fulfilled"; value: T }
  | { status: "rejected"; reason: E };
function mapResult<T, U, E>(result: AsyncResult<T, E>, fn: (val: T) => U): AsyncResult<U, E> {
  if (result.status === "fulfilled") return { status: "fulfilled", value: fn(result.value) };
  return result as AsyncResult<U, E>;
}
const numResult: AsyncResult<number> = { status: "fulfilled", value: 42 };
const strResult = mapResult(numResult, n => `Value is ${n}`);

// 2. Union with shared base fields
type BaseEvent = { id: string; timestamp: Date; userId: string };
type UserCreated = BaseEvent & { kind: "user_created"; name: string; email: string };
type UserUpdated = BaseEvent & { kind: "user_updated"; changes: Partial<{ name: string; email: string }> };
type UserDeleted = BaseEvent & { kind: "user_deleted"; reason: string };
type UserEvent = UserCreated | UserUpdated | UserDeleted;
function applyUserEvent(state: { users: Map<string, { name: string; email: string }> }, event: UserEvent): void {
  switch (event.kind) {
    case "user_created": state.users.set(event.userId, { name: event.name, email: event.email }); break;
    case "user_updated": { const u = state.users.get(event.userId); if (u) Object.assign(u, event.changes); break; }
    case "user_deleted": state.users.delete(event.userId); break;
  }
}

// 3. Mapped union — transform each member
type ApiRequest<T> =
  | { method: "GET"; path: string; queryParams?: Record<string, string> }
  | { method: "POST"; path: string; body: T }
  | { method: "PUT"; path: string; body: T }
  | { method: "DELETE"; path: string };
type WithTimestamp<U> = U extends { method: string } ? U & { sentAt: Date } : never;
type TimestampedRequest<T> = WithTimestamp<ApiRequest<T>>;
function withTimestamp<T>(req: ApiRequest<T>): TimestampedRequest<T> {
  return { ...req, sentAt: new Date() } as TimestampedRequest<T>;
}

// 4. Union narrowing with custom type guards
type JsonValue4 = string | number | boolean | null | JsonValue4[] | { [key: string]: JsonValue4 };
function isJsonArray(v: JsonValue4): v is JsonValue4[] { return Array.isArray(v); }
function isJsonObject(v: JsonValue4): v is { [key: string]: JsonValue4 } {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function jsonDepth(v: JsonValue4): number {
  if (isJsonArray(v)) return 1 + Math.max(0, ...v.map(jsonDepth));
  if (isJsonObject(v)) return 1 + Math.max(0, ...Object.values(v).map(jsonDepth));
  return 0;
}

// 5. Event sourcing union with aggregate
type OrderEventType =
  | { type: "order_created"; customerId: string; items: { sku: string; qty: number; price: number }[] }
  | { type: "item_added"; sku: string; qty: number; price: number }
  | { type: "item_removed"; sku: string }
  | { type: "discount_applied"; code: string; percent: number }
  | { type: "order_confirmed"; confirmedAt: Date }
  | { type: "order_cancelled"; reason: string };
interface OrderState {
  customerId: string;
  items: { sku: string; qty: number; price: number }[];
  discount: number;
  status: "draft" | "confirmed" | "cancelled";
}
function applyOrderEvent(state: OrderState, event: OrderEventType): OrderState {
  switch (event.type) {
    case "order_created": return { ...state, customerId: event.customerId, items: event.items };
    case "item_added": return { ...state, items: [...state.items, { sku: event.sku, qty: event.qty, price: event.price }] };
    case "item_removed": return { ...state, items: state.items.filter(i => i.sku !== event.sku) };
    case "discount_applied": return { ...state, discount: event.percent };
    case "order_confirmed": return { ...state, status: "confirmed" };
    case "order_cancelled": return { ...state, status: "cancelled" };
  }
}

// 6. Union with nested discriminants
type Address6 = { type: "domestic"; state: string; zip: string } | { type: "international"; country: string; postalCode: string };
type ContactInfo =
  | { contact: "email"; address: string; verified: boolean }
  | { contact: "phone"; number: string; region: Address6 }
  | { contact: "postal"; address: Address6 };
function contactSummary(c: ContactInfo): string {
  if (c.contact === "email") return `Email: ${c.address}${c.verified ? " ✓" : " (unverified)"}`;
  if (c.contact === "phone") {
    const region = c.region.type === "domestic" ? c.region.state : c.region.country;
    return `Phone: ${c.number} (${region})`;
  }
  const loc = c.address.type === "domestic" ? `${c.address.state} ${c.address.zip}` : `${c.address.country}`;
  return `Postal: ${loc}`;
}

// 7. Option/Maybe monad as discriminated union
type Option<T> = { _tag: "Some"; value: T } | { _tag: "None" };
const Some = <T>(value: T): Option<T> => ({ _tag: "Some", value });
const None: Option<never> = { _tag: "None" };
function mapOption<T, U>(opt: Option<T>, fn: (val: T) => U): Option<U> {
  return opt._tag === "Some" ? Some(fn(opt.value)) : None;
}
function flatMapOption<T, U>(opt: Option<T>, fn: (val: T) => Option<U>): Option<U> {
  return opt._tag === "Some" ? fn(opt.value) : None;
}
function getOrElse<T>(opt: Option<T>, fallback: T): T {
  return opt._tag === "Some" ? opt.value : fallback;
}
const opt1 = Some(42);
const opt2 = mapOption(opt1, n => n * 2);
const opt3 = getOrElse(opt2, 0);

// 8. Tree node discriminated union (recursive)
type TreeNode<T> =
  | { kind: "leaf"; value: T }
  | { kind: "branch"; left: TreeNode<T>; right: TreeNode<T> };
function treeSize<T>(node: TreeNode<T>): number {
  if (node.kind === "leaf") return 1;
  return 1 + treeSize(node.left) + treeSize(node.right);
}
function treeDepth<T>(node: TreeNode<T>): number {
  if (node.kind === "leaf") return 0;
  return 1 + Math.max(treeDepth(node.left), treeDepth(node.right));
}
function treeMap<T, U>(node: TreeNode<T>, fn: (val: T) => U): TreeNode<U> {
  if (node.kind === "leaf") return { kind: "leaf", value: fn(node.value) };
  return { kind: "branch", left: treeMap(node.left, fn), right: treeMap(node.right, fn) };
}
const tree8: TreeNode<number> = { kind: "branch", left: { kind: "leaf", value: 1 }, right: { kind: "branch", left: { kind: "leaf", value: 2 }, right: { kind: "leaf", value: 3 } } };

// 9. Union with shared fields extracted via conditional types
type EventBase = { id: string; timestamp: number; version: number };
type ProductEvent =
  | (EventBase & { event: "created"; name: string; price: number })
  | (EventBase & { event: "price_changed"; oldPrice: number; newPrice: number })
  | (EventBase & { event: "discontinued"; reason: string });
type EventPayload<E extends ProductEvent["event"]> = Extract<ProductEvent, { event: E }>;
type CreatedPayload = EventPayload<"created">;
type PriceChangedPayload = EventPayload<"price_changed">;
function getEventDelta(event: ProductEvent): number | null {
  if (event.event === "price_changed") return event.newPrice - event.oldPrice;
  return null;
}

// 10. Union used as a state machine with type-safe transitions
type TrafficLight =
  | { color: "red"; nextAfterMs: number }
  | { color: "yellow"; nextAfterMs: number; direction: "to_red" | "to_green" }
  | { color: "green"; nextAfterMs: number };
function nextState(light: TrafficLight): TrafficLight {
  switch (light.color) {
    case "red": return { color: "green", nextAfterMs: 30000 };
    case "green": return { color: "yellow", nextAfterMs: 5000, direction: "to_red" };
    case "yellow": return light.direction === "to_red"
      ? { color: "red", nextAfterMs: 30000 }
      : { color: "green", nextAfterMs: 30000 };
  }
}
let light10: TrafficLight = { color: "red", nextAfterMs: 30000 };
light10 = nextState(light10);

// 11. Folding over a discriminated union
type Expr11 =
  | { tag: "num"; n: number }
  | { tag: "add"; left: Expr11; right: Expr11 }
  | { tag: "mul"; left: Expr11; right: Expr11 }
  | { tag: "neg"; expr: Expr11 };
function evalExpr(e: Expr11): number {
  switch (e.tag) {
    case "num": return e.n;
    case "add": return evalExpr(e.left) + evalExpr(e.right);
    case "mul": return evalExpr(e.left) * evalExpr(e.right);
    case "neg": return -evalExpr(e.expr);
  }
}
function exprToString(e: Expr11): string {
  switch (e.tag) {
    case "num": return String(e.n);
    case "add": return `(${exprToString(e.left)} + ${exprToString(e.right)})`;
    case "mul": return `(${exprToString(e.left)} * ${exprToString(e.right)})`;
    case "neg": return `(-${exprToString(e.expr)})`;
  }
}
const expr11: Expr11 = { tag: "add", left: { tag: "num", n: 1 }, right: { tag: "mul", left: { tag: "num", n: 2 }, right: { tag: "num", n: 3 } } };

// 12. Union with array of discriminated items and fold
type LineItem =
  | { itemType: "product"; name: string; unitPrice: number; qty: number }
  | { itemType: "discount"; code: string; amount: number }
  | { itemType: "shipping"; carrier: string; cost: number }
  | { itemType: "tax"; rate: number; taxableAmount: number };
function lineItemAmount(item: LineItem): number {
  switch (item.itemType) {
    case "product": return item.unitPrice * item.qty;
    case "discount": return -item.amount;
    case "shipping": return item.cost;
    case "tax": return item.taxableAmount * item.rate;
  }
}
function calculateTotal(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + lineItemAmount(item), 0);
}

// 13. Generic discriminated union with constraints
type Validated<T> =
  | { valid: true; data: T }
  | { valid: false; errors: string[]; partial: Partial<T> };
function validate13<T>(data: unknown, schema: Record<keyof T, (v: unknown) => boolean>): Validated<T> {
  const errors: string[] = [];
  for (const [key, check] of Object.entries(schema) as [keyof T, (v: unknown) => boolean][]) {
    if (!check((data as any)?.[key])) errors.push(`Invalid field: ${String(key)}`);
  }
  return errors.length
    ? { valid: false, errors, partial: data as Partial<T> }
    : { valid: true, data: data as T };
}

// 14. Union used in a visitor pattern
type AstNode14 =
  | { nodeType: "identifier"; name: string }
  | { nodeType: "literal"; value: number | string }
  | { nodeType: "binary"; op: string; left: AstNode14; right: AstNode14 }
  | { nodeType: "unary"; op: string; operand: AstNode14 }
  | { nodeType: "conditional"; cond: AstNode14; then: AstNode14; else: AstNode14 };
interface AstVisitor<T> {
  visitIdentifier(node: Extract<AstNode14, { nodeType: "identifier" }>): T;
  visitLiteral(node: Extract<AstNode14, { nodeType: "literal" }>): T;
  visitBinary(node: Extract<AstNode14, { nodeType: "binary" }>): T;
  visitUnary(node: Extract<AstNode14, { nodeType: "unary" }>): T;
  visitConditional(node: Extract<AstNode14, { nodeType: "conditional" }>): T;
}
function visit<T>(node: AstNode14, visitor: AstVisitor<T>): T {
  switch (node.nodeType) {
    case "identifier": return visitor.visitIdentifier(node);
    case "literal": return visitor.visitLiteral(node);
    case "binary": return visitor.visitBinary(node);
    case "unary": return visitor.visitUnary(node);
    case "conditional": return visitor.visitConditional(node);
  }
}

// 15. Union with type-level extraction utilities
type Webhook15 =
  | { trigger: "push"; branch: string; commits: number }
  | { trigger: "pull_request"; action: "opened" | "closed" | "merged"; prNumber: number }
  | { trigger: "release"; tag: string; prerelease: boolean }
  | { trigger: "issue"; action: "opened" | "closed"; issueNumber: number };
type ExtractTrigger<T extends Webhook15, K extends Webhook15["trigger"]> = T extends { trigger: K } ? T : never;
type PushWebhook = ExtractTrigger<Webhook15, "push">;
type PrWebhook = ExtractTrigger<Webhook15, "pull_request">;
function isMerged(w: Webhook15): w is PrWebhook & { action: "merged" } {
  return w.trigger === "pull_request" && w.action === "merged";
}

// 16. Union to handle protocol upgrades
type Connection16 =
  | { version: 1; data: { name: string } }
  | { version: 2; data: { firstName: string; lastName: string } }
  | { version: 3; data: { profile: { firstName: string; lastName: string; displayName: string } } };
function normalizeName(c: Connection16): string {
  switch (c.version) {
    case 1: return c.data.name;
    case 2: return `${c.data.firstName} ${c.data.lastName}`;
    case 3: return c.data.profile.displayName;
  }
}

// 17. Tagged union with mapped variants
type CrudAction = "create" | "read" | "update" | "delete";
type CrudEvent<T, A extends CrudAction> = {
  action: A;
  entityType: string;
  id: string;
} & (A extends "create" | "update" ? { payload: T } : {});
type UserCrudEvent = CrudEvent<{ name: string; email: string }, "create" | "read" | "update" | "delete">;

// 18. Sum type composition via union merging
type Pagination18 = { page: number; pageSize: number } | { cursor: string; limit: number };
type SortConfig18 = { sortBy: string; sortDir: "asc" | "desc" } | { sortBy?: undefined };
type ListQuery18 = { filter?: Record<string, unknown> } & Pagination18 & SortConfig18;
function buildListQuery(q: ListQuery18): string {
  const parts: string[] = [];
  if ("page" in q) parts.push(`page=${q.page}&pageSize=${q.pageSize}`);
  else parts.push(`cursor=${q.cursor}&limit=${q.limit}`);
  if (q.sortBy) parts.push(`sort=${q.sortBy}:${q.sortDir}`);
  return parts.join("&");
}

// 19. Union for heterogeneous list with typed accessor
type Widget19 =
  | { widgetId: string; widgetType: "clock"; timezone: string }
  | { widgetId: string; widgetType: "weather"; city: string; unit: "C" | "F" }
  | { widgetId: string; widgetType: "news"; feedUrl: string; maxItems: number }
  | { widgetId: string; widgetType: "calendar"; calendarId: string };
function widgetTitle(w: Widget19): string {
  switch (w.widgetType) {
    case "clock": return `Clock (${w.timezone})`;
    case "weather": return `Weather: ${w.city} (°${w.unit})`;
    case "news": return `News Feed (${w.maxItems} items)`;
    case "calendar": return `Calendar`;
  }
}
type ClockWidget = Extract<Widget19, { widgetType: "clock" }>;
const clocks19: ClockWidget[] = [{ widgetId: "w1", widgetType: "clock", timezone: "UTC" }];

// 20. Union with runtime tag checking and type narrowing function
type StoredValue20 =
  | { _type: "string"; v: string }
  | { _type: "number"; v: number }
  | { _type: "date"; v: string } // ISO string stored as string
  | { _type: "json"; v: string }; // JSON-serialized
function deserialize(stored: StoredValue20): string | number | Date | unknown {
  switch (stored._type) {
    case "string": return stored.v;
    case "number": return stored.v;
    case "date": return new Date(stored.v);
    case "json": return JSON.parse(stored.v);
  }
}
function serialize(value: string | number | Date | object): StoredValue20 {
  if (typeof value === "string") return { _type: "string", v: value };
  if (typeof value === "number") return { _type: "number", v: value };
  if (value instanceof Date) return { _type: "date", v: value.toISOString() };
  return { _type: "json", v: JSON.stringify(value) };
}

// 21. Union for finite-step wizard
type WizardStep =
  | { step: 1; data: {} }
  | { step: 2; data: { name: string; email: string } }
  | { step: 3; data: { name: string; email: string; plan: string } }
  | { step: 4; data: { name: string; email: string; plan: string; payment: string }; confirmed: boolean };
function canAdvance(step: WizardStep): boolean {
  switch (step.step) {
    case 1: return true;
    case 2: return !!(step.data.name && step.data.email);
    case 3: return !!(step.data.plan);
    case 4: return step.confirmed;
  }
}

// 22. Union with generic folding (catamorphism)
type List22<T> = { tag: "Nil" } | { tag: "Cons"; head: T; tail: List22<T> };
function foldList<T, B>(list: List22<T>, onNil: () => B, onCons: (head: T, tail: B) => B): B {
  if (list.tag === "Nil") return onNil();
  return onCons(list.head, foldList(list.tail, onNil, onCons));
}
function listToArray<T>(list: List22<T>): T[] {
  return foldList<T, T[]>(list, () => [], (h, t) => [h, ...t]);
}
const list22: List22<number> = { tag: "Cons", head: 1, tail: { tag: "Cons", head: 2, tail: { tag: "Nil" } } };
const arr22 = listToArray(list22);

// 23. Complex state machine union with context
type CheckoutContext = { cartId: string; userId: string; items: { sku: string; qty: number }[] };
type CheckoutState =
  | { phase: "cart"; context: CheckoutContext }
  | { phase: "address"; context: CheckoutContext; shippingAddress: string }
  | { phase: "payment"; context: CheckoutContext; shippingAddress: string; paymentIntent: string }
  | { phase: "review"; context: CheckoutContext; shippingAddress: string; paymentIntent: string; estimatedDelivery: Date }
  | { phase: "placed"; context: CheckoutContext; orderId: string; placedAt: Date }
  | { phase: "failed"; context: CheckoutContext; reason: string };
function checkoutProgress(state: CheckoutState): number {
  const phases: CheckoutState["phase"][] = ["cart", "address", "payment", "review", "placed", "failed"];
  return Math.round((phases.indexOf(state.phase) / (phases.length - 1)) * 100);
}

// 24. Union discriminated on multiple fields
type Permission24 =
  | { resource: "users"; action: "read" | "write" | "delete" }
  | { resource: "posts"; action: "read" | "write" | "publish" | "delete" }
  | { resource: "billing"; action: "read" | "write" }
  | { resource: "settings"; action: "read" | "write" };
function permissionKey(p: Permission24): string {
  return `${p.resource}:${p.action}`;
}
function hasPermission(permissions: Permission24[], required: Permission24): boolean {
  return permissions.some(p => p.resource === required.resource && p.action === required.action);
}

// 25. Chain of responsibility using union
type Handler25<T> =
  | { handles: (req: T) => boolean; handle: (req: T) => string; next?: undefined }
  | { handles: (req: T) => boolean; handle: (req: T) => string; next: Handler25<T> };
function process25<T>(handler: Handler25<T>, req: T): string {
  if (handler.handles(req)) return handler.handle(req);
  if (handler.next) return process25(handler.next, req);
  return "unhandled";
}

// 26. Strategy union — algorithm encapsulated in union member
type SortStrategy26<T> =
  | { strategy: "bubble"; compare: (a: T, b: T) => number }
  | { strategy: "quick"; pivot: "first" | "last" | "middle"; compare: (a: T, b: T) => number }
  | { strategy: "merge"; compare: (a: T, b: T) => number }
  | { strategy: "native"; compare?: (a: T, b: T) => number };
function sortWith<T>(arr: T[], strategy: SortStrategy26<T>): T[] {
  const copy = [...arr];
  if (strategy.strategy === "native") return copy.sort(strategy.compare);
  // For simplicity, all use native sort with comparator:
  return copy.sort(strategy.compare);
}

// 27. Union for type-safe environment variables with coercions
type EnvSchema27<T> = { [K in keyof T]: { _type: "string" | "number" | "boolean" | "list"; required: boolean; default?: T[K] } };
type ParsedEnv<S extends EnvSchema27<any>> = { [K in keyof S]: S[K]["_type"] extends "number" ? number : S[K]["_type"] extends "boolean" ? boolean : S[K]["_type"] extends "list" ? string[] : string };

// 28. Union for command pattern with typed results
type Command28 =
  | { cmd: "CREATE_USER"; params: { name: string; email: string }; _result: { id: string } }
  | { cmd: "DELETE_USER"; params: { id: string }; _result: { deleted: boolean } }
  | { cmd: "UPDATE_EMAIL"; params: { id: string; email: string }; _result: { updated: boolean } };
type CommandResult<C extends Command28> = C["_result"];
type CreateUserResult = CommandResult<Extract<Command28, { cmd: "CREATE_USER" }>>;
function executeCommand<C extends Command28>(command: Omit<C, "_result">): CommandResult<C> {
  return {} as CommandResult<C>; // implementation elided
}

// 29. Union narrowed via in-operator
type HasName = { name: string };
type HasEmail = { email: string };
type HasPhone = { phone: string };
type Contact29 = HasName | (HasName & HasEmail) | (HasName & HasPhone) | (HasName & HasEmail & HasPhone);
function contactChannels(c: Contact29): string[] {
  const channels: string[] = ["name"];
  if ("email" in c) channels.push("email");
  if ("phone" in c) channels.push("phone");
  return channels;
}

// 30. Union with type-safe pattern matching helper
type Pattern<T extends { tag: string }, R> = {
  [K in T["tag"]]: (val: Extract<T, { tag: K }>) => R
};
function match<T extends { tag: string }, R>(value: T, patterns: Pattern<T, R>): R {
  return (patterns as any)[value.tag](value);
}
type Shape30 =
  | { tag: "circle"; radius: number }
  | { tag: "rect"; w: number; h: number }
  | { tag: "triangle"; base: number; height: number };
const area30 = (shape: Shape30) => match(shape, {
  circle: ({ radius }) => Math.PI * radius ** 2,
  rect: ({ w, h }) => w * h,
  triangle: ({ base, height }) => 0.5 * base * height
});

// 31. Union for diff/patch operations
type DiffOp<T> =
  | { op: "add"; path: string; value: T }
  | { op: "remove"; path: string }
  | { op: "replace"; path: string; oldValue: T; newValue: T }
  | { op: "move"; from: string; to: string }
  | { op: "copy"; from: string; to: string };
function diffOpDescription<T>(op: DiffOp<T>): string {
  switch (op.op) {
    case "add": return `+ ${op.path}: ${JSON.stringify(op.value)}`;
    case "remove": return `- ${op.path}`;
    case "replace": return `~ ${op.path}: ${JSON.stringify(op.oldValue)} → ${JSON.stringify(op.newValue)}`;
    case "move": return `> ${op.from} → ${op.to}`;
    case "copy": return `@ ${op.from} → ${op.to}`;
  }
}

// 32. Union with conditional narrowing in generic function
type Container32<T> = { _tag: "empty" } | { _tag: "full"; value: T };
function transform32<T, U>(c: Container32<T>, fn: (val: T) => U): Container32<U> {
  return c._tag === "full" ? { _tag: "full", value: fn(c.value) } : { _tag: "empty" };
}
function zip32<A, B>(ca: Container32<A>, cb: Container32<B>): Container32<[A, B]> {
  if (ca._tag === "full" && cb._tag === "full") return { _tag: "full", value: [ca.value, cb.value] };
  return { _tag: "empty" };
}

// 33. Union for async operation statuses with progress
type UploadState =
  | { phase: "idle" }
  | { phase: "selecting"; fileCount: number }
  | { phase: "uploading"; loaded: number; total: number; speed: number }
  | { phase: "processing"; taskId: string; eta: number }
  | { phase: "complete"; urls: string[]; duration: number }
  | { phase: "error"; message: string; retryable: boolean };
function uploadProgress(state: UploadState): number {
  switch (state.phase) {
    case "idle": return 0;
    case "selecting": return 5;
    case "uploading": return 10 + Math.round((state.loaded / state.total) * 80);
    case "processing": return 90;
    case "complete": return 100;
    case "error": return 0;
  }
}

// 34. Union for HTTP middleware results
type MiddlewareResult34<Ctx> =
  | { action: "continue"; ctx: Ctx }
  | { action: "short_circuit"; statusCode: number; body: unknown }
  | { action: "redirect"; location: string; permanent: boolean }
  | { action: "error"; error: Error };
function runMiddleware34<Ctx>(
  ctx: Ctx,
  middleware: (ctx: Ctx) => MiddlewareResult34<Ctx>
): MiddlewareResult34<Ctx> {
  return middleware(ctx);
}

// 35. Union for type-safe message passing
type WorkerMessage =
  | { msg: "start"; config: { workers: number; timeout: number } }
  | { msg: "job"; jobId: string; payload: unknown }
  | { msg: "cancel"; jobId: string }
  | { msg: "status_request" }
  | { msg: "shutdown"; graceful: boolean };
type WorkerResponse =
  | { msg: "started"; workerId: string }
  | { msg: "job_complete"; jobId: string; result: unknown }
  | { msg: "job_failed"; jobId: string; error: string }
  | { msg: "status"; active: number; queued: number; completed: number }
  | { msg: "shutdown_ack" };
function workerResponseDescription(r: WorkerResponse): string {
  switch (r.msg) {
    case "started": return `Worker ${r.workerId} started`;
    case "job_complete": return `Job ${r.jobId} complete`;
    case "job_failed": return `Job ${r.jobId} failed: ${r.error}`;
    case "status": return `Active: ${r.active}, Queued: ${r.queued}, Done: ${r.completed}`;
    case "shutdown_ack": return "Shutdown acknowledged";
  }
}

// 36. Type-safe union reducer
type ReducerAction36<T> =
  | { type: "reset"; initialState: T }
  | { type: "set_field"; key: keyof T; value: T[keyof T] }
  | { type: "merge"; partial: Partial<T> }
  | { type: "transform"; fn: (state: T) => T };
function reduce36<T>(state: T, action: ReducerAction36<T>): T {
  switch (action.type) {
    case "reset": return action.initialState;
    case "set_field": return { ...state, [action.key]: action.value };
    case "merge": return { ...state, ...action.partial };
    case "transform": return action.fn(state);
  }
}

// 37. Union with error categorization and recovery strategies
type ErrorCategory =
  | { category: "transient"; retriable: true; maxRetries: number; backoff: "linear" | "exponential" }
  | { category: "auth"; retriable: true; requiresReauth: boolean }
  | { category: "validation"; retriable: false; fields: string[] }
  | { category: "fatal"; retriable: false; alertOncall: boolean };
function recoveryStrategy(cat: ErrorCategory): string {
  switch (cat.category) {
    case "transient": return `Retry up to ${cat.maxRetries}x with ${cat.backoff} backoff`;
    case "auth": return cat.requiresReauth ? "Force re-authentication" : "Refresh token";
    case "validation": return `Fix fields: ${cat.fields.join(", ")}`;
    case "fatal": return cat.alertOncall ? "Alert on-call engineer" : "Log and fail";
  }
}

// 38. Union to represent parsing results with partial success
type ParseResult38<T> =
  | { success: true; value: T; warnings: string[] }
  | { success: false; errors: string[]; partial: Partial<T> };
function mergeParseResults<T>(results: ParseResult38<T>[]): ParseResult38<T[]> {
  const successes: T[] = [], errors: string[] = [], warnings: string[] = [];
  for (const r of results) {
    if (r.success) { successes.push(r.value); warnings.push(...r.warnings); }
    else errors.push(...r.errors);
  }
  return errors.length
    ? { success: false, errors, partial: { length: successes.length } as any }
    : { success: true, value: successes, warnings };
}

// 39. Union used for feature flags with typed configurations
type FeatureFlag39 =
  | { flag: "off" }
  | { flag: "on" }
  | { flag: "percentage"; percent: number; seed?: number }
  | { flag: "whitelist"; allowedIds: string[] }
  | { flag: "schedule"; enableAt: Date; disableAt?: Date };
function evaluateFlag(flag: FeatureFlag39, userId: string): boolean {
  switch (flag.flag) {
    case "off": return false;
    case "on": return true;
    case "percentage": return (userId.charCodeAt(0) % 100) < flag.percent;
    case "whitelist": return flag.allowedIds.includes(userId);
    case "schedule": {
      const now = Date.now();
      const start = flag.enableAt.getTime();
      const end = flag.disableAt?.getTime() ?? Infinity;
      return now >= start && now < end;
    }
  }
}

// 40. Mapped union type — turn union into object keyed by discriminant
type EventA = { kind: "a"; aData: string };
type EventB = { kind: "b"; bData: number };
type EventC = { kind: "c"; cData: boolean };
type Events40 = EventA | EventB | EventC;
type EventHandlerMap<T extends { kind: string }> = { [K in T["kind"]]: (event: Extract<T, { kind: K }>) => void };
const handlers40: EventHandlerMap<Events40> = {
  a: e => console.log("A:", e.aData),
  b: e => console.log("B:", e.bData),
  c: e => console.log("C:", e.cData),
};
function dispatch40(event: Events40): void { (handlers40 as any)[event.kind](event); }

// 41. Union for type-safe pub/sub channels
type PubSubMessage41 =
  | { channel: "metrics"; data: { name: string; value: number; tags: string[] } }
  | { channel: "logs"; data: { level: "info" | "warn" | "error"; message: string } }
  | { channel: "traces"; data: { traceId: string; spanId: string; duration: number } };
type PubSubHandler41<M extends PubSubMessage41> = (data: M["data"]) => void;
type PubSubBus41 = { [K in PubSubMessage41["channel"]]: PubSubHandler41<Extract<PubSubMessage41, { channel: K }>>[] };

// 42. Union for CRDT operations
type CrdtOp42 =
  | { op: "g_counter_increment"; id: string; amount: number }
  | { op: "lww_register_set"; id: string; value: unknown; timestamp: number }
  | { op: "or_set_add"; id: string; element: unknown; uniqueTag: string }
  | { op: "or_set_remove"; id: string; element: unknown };
function crdtDescription(op: CrdtOp42): string {
  switch (op.op) {
    case "g_counter_increment": return `Counter ${op.id} += ${op.amount}`;
    case "lww_register_set": return `Register ${op.id} = ${JSON.stringify(op.value)} @ ${op.timestamp}`;
    case "or_set_add": return `Set ${op.id} add ${JSON.stringify(op.element)}`;
    case "or_set_remove": return `Set ${op.id} remove ${JSON.stringify(op.element)}`;
  }
}

// 43. Union for type-safe router parameters
type Route43 =
  | { name: "home" }
  | { name: "user"; params: { userId: string } }
  | { name: "post"; params: { postId: string }; query?: { comment?: string } }
  | { name: "settings"; params: { section: "profile" | "security" | "notifications" } };
function routeToPath(r: Route43): string {
  switch (r.name) {
    case "home": return "/";
    case "user": return `/users/${r.params.userId}`;
    case "post": return `/posts/${r.params.postId}${r.query?.comment ? `#comment-${r.query.comment}` : ""}`;
    case "settings": return `/settings/${r.params.section}`;
  }
}

// 44. Union for schema migration versions
type Migration44 =
  | { version: 1; up: () => void; down: () => void }
  | { version: 2; up: () => void; down: () => void; requiresDowntime: boolean }
  | { version: 3; up: () => void; down: null; irreversible: true; confirmationRequired: boolean };
function runMigration(m: Migration44, direction: "up" | "down"): void {
  if (direction === "down" && m.version === 3) throw new Error("Irreversible migration");
  if (direction === "down") { (m as { down: (() => void) | null }).down?.(); }
  else m.up();
}

// 45. Union for type-safe dependency injection tokens
type Token45<T> = { _tag: "token"; name: string; _type?: T };
type Binding45<T> =
  | { scope: "singleton"; factory: () => T }
  | { scope: "transient"; factory: () => T }
  | { scope: "request"; factory: (reqId: string) => T };
function createToken45<T>(name: string): Token45<T> { return { _tag: "token", name }; }
const DB_TOKEN = createToken45<{ query: (sql: string) => unknown[] }>("db");
const LOGGER_TOKEN = createToken45<{ log: (msg: string) => void }>("logger");

// 46. Union for transformation pipeline outputs
type TransformOutput46<In, Out> =
  | { transformed: true; input: In; output: Out; duration: number }
  | { transformed: false; input: In; error: Error; duration: number };
function runTransform46<In, Out>(input: In, fn: (v: In) => Out): TransformOutput46<In, Out> {
  const start = Date.now();
  try {
    const output = fn(input);
    return { transformed: true, input, output, duration: Date.now() - start };
  } catch (error) {
    return { transformed: false, input, error: error as Error, duration: Date.now() - start };
  }
}
const transformResult = runTransform46("  42  ", s => parseInt(s.trim(), 10));

// 47. Union for security policy decisions
type PolicyDecision47 =
  | { decision: "allow"; reason: string }
  | { decision: "deny"; reason: string; auditLog: boolean }
  | { decision: "challenge"; method: "mfa" | "captcha" | "email_verify" }
  | { decision: "defer"; to: string; ttl: number };
function policyActionRequired(d: PolicyDecision47): string {
  switch (d.decision) {
    case "allow": return "Proceed";
    case "deny": return `Blocked: ${d.reason}${d.auditLog ? " (logged)" : ""}`;
    case "challenge": return `Challenge: ${d.method}`;
    case "defer": return `Ask ${d.to} (timeout: ${d.ttl}s)`;
  }
}

// 48. Union for resource lifecycle states
type ResourceState48<T> =
  | { lifecycle: "provisioning"; requestId: string }
  | { lifecycle: "ready"; resource: T; createdAt: Date }
  | { lifecycle: "updating"; resource: T; updateId: string; rollbackAvailable: boolean }
  | { lifecycle: "deleting"; resource: T; deletedAt: Date }
  | { lifecycle: "failed"; error: string; retryCount: number };
function isOperational<T>(state: ResourceState48<T>): boolean {
  return state.lifecycle === "ready" || state.lifecycle === "updating";
}

// 49. Union for type-safe telemetry spans
type Span49 =
  | { spanKind: "server"; httpMethod: string; httpPath: string; statusCode: number }
  | { spanKind: "client"; peerAddress: string; dbStatement?: string }
  | { spanKind: "producer"; messagingSystem: string; destination: string }
  | { spanKind: "consumer"; messagingSystem: string; source: string; messageId: string }
  | { spanKind: "internal"; component: string; operation: string };
function spanName(span: Span49): string {
  switch (span.spanKind) {
    case "server": return `${span.httpMethod} ${span.httpPath}`;
    case "client": return `HTTP ${span.peerAddress}`;
    case "producer": return `${span.messagingSystem} send ${span.destination}`;
    case "consumer": return `${span.messagingSystem} receive ${span.source}`;
    case "internal": return `${span.component}.${span.operation}`;
  }
}

// 50. Combining multiple unions: request → processing → response pipeline
type IncomingRequest50 =
  | { reqType: "query"; entity: string; filter?: Record<string, unknown> }
  | { reqType: "mutation"; entity: string; operation: "create" | "update" | "delete"; data: unknown }
  | { reqType: "subscription"; entity: string; events: string[] };
type ProcessingResult50<T> =
  | { processed: true; data: T; meta: { duration: number; cached: boolean } }
  | { processed: false; error: { code: string; message: string }; retryable: boolean };
type OutgoingResponse50<T> =
  | { responseType: "data"; payload: T; totalCount?: number }
  | { responseType: "error"; code: string; message: string }
  | { responseType: "stream"; channel: string; subscriptionId: string };
function processRequest50<T>(req: IncomingRequest50, result: ProcessingResult50<T>): OutgoingResponse50<T> {
  if (!result.processed) return { responseType: "error", code: result.error.code, message: result.error.message };
  if (req.reqType === "subscription") return { responseType: "stream", channel: req.entity, subscriptionId: Math.random().toString(36).slice(2) };
  return { responseType: "data", payload: result.data };
}
