export {};

// ============================================================
// BASIC EXAMPLES — Discriminated Unions (50 Examples)
// ============================================================

// 1. Simple shape union with "kind" discriminant
type Circle1 = { kind: "circle"; radius: number };
type Square1 = { kind: "square"; side: number };
type Shape1 = Circle1 | Square1;
function area1(s: Shape1): number {
  if (s.kind === "circle") return Math.PI * s.radius ** 2;
  return s.side ** 2;
}
const circle1: Shape1 = { kind: "circle", radius: 5 };
const area1Result = area1(circle1);

// 2. Switch-based exhaustive check
type Color2 = { type: "rgb"; r: number; g: number; b: number } | { type: "hsl"; h: number; s: number; l: number } | { type: "hex"; value: string };
function colorToString(c: Color2): string {
  switch (c.type) {
    case "rgb": return `rgb(${c.r},${c.g},${c.b})`;
    case "hsl": return `hsl(${c.h},${c.s}%,${c.l}%)`;
    case "hex": return c.value;
  }
}
const rgb2: Color2 = { type: "rgb", r: 255, g: 128, b: 0 };

// 3. Result type union — Ok | Err
type Ok<T> = { ok: true; value: T };
type Err<E = string> = { ok: false; error: E };
type Result3<T, E = string> = Ok<T> | Err<E>;
function getUser3(id: string): Result3<{ id: string; name: string }> {
  if (id === "") return { ok: false, error: "ID cannot be empty" };
  return { ok: true, value: { id, name: "Alice" } };
}
const result3 = getUser3("u1");
if (result3.ok) console.log(result3.value.name);
else console.error(result3.error);

// 4. Loading state union
type LoadingState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; message: string };
function renderState<T>(state: LoadingState<T>): string {
  switch (state.status) {
    case "idle": return "Not started";
    case "loading": return "Loading...";
    case "success": return `Data: ${JSON.stringify(state.data)}`;
    case "error": return `Error: ${state.message}`;
  }
}
const loading4: LoadingState<string[]> = { status: "loading" };
const success4: LoadingState<string[]> = { status: "success", data: ["a", "b"] };

// 5. Action union (Redux-style)
type Action5 =
  | { type: "INCREMENT" }
  | { type: "DECREMENT" }
  | { type: "RESET" }
  | { type: "SET"; payload: number };
function counter5(state: number, action: Action5): number {
  switch (action.type) {
    case "INCREMENT": return state + 1;
    case "DECREMENT": return state - 1;
    case "RESET": return 0;
    case "SET": return action.payload;
  }
}
const newState5 = counter5(5, { type: "SET", payload: 10 });

// 6. Payment method union
type PaymentMethod =
  | { method: "credit_card"; cardNumber: string; cvv: string; expiry: string }
  | { method: "paypal"; email: string }
  | { method: "bank_transfer"; accountNumber: string; routingNumber: string }
  | { method: "crypto"; wallet: string; currency: string };
function processPayment(pm: PaymentMethod): string {
  switch (pm.method) {
    case "credit_card": return `Charging card ending in ${pm.cardNumber.slice(-4)}`;
    case "paypal": return `PayPal: ${pm.email}`;
    case "bank_transfer": return `ACH transfer to ${pm.accountNumber}`;
    case "crypto": return `${pm.currency} to ${pm.wallet}`;
  }
}
const ccPayment: PaymentMethod = { method: "credit_card", cardNumber: "4111111111111111", cvv: "123", expiry: "12/26" };

// 7. Notification type union
type Notification7 =
  | { kind: "email"; to: string; subject: string; body: string }
  | { kind: "sms"; phone: string; message: string }
  | { kind: "push"; deviceToken: string; title: string; body: string };
function sendNotification(n: Notification7): void {
  switch (n.kind) {
    case "email": console.log(`Email to ${n.to}: ${n.subject}`); break;
    case "sms": console.log(`SMS to ${n.phone}: ${n.message}`); break;
    case "push": console.log(`Push to ${n.deviceToken}: ${n.title}`); break;
  }
}

// 8. User role union
type UserRole =
  | { role: "guest"; canView: boolean }
  | { role: "user"; userId: string; canView: boolean; canComment: boolean }
  | { role: "admin"; userId: string; adminLevel: 1 | 2 | 3 };
function getPermissions(r: UserRole): string[] {
  const perms: string[] = [];
  if (r.role !== "guest") perms.push("authenticated");
  if (r.role === "admin") perms.push("admin", `level_${r.adminLevel}`);
  if (r.role === "user" && r.canComment) perms.push("comment");
  return perms;
}
const adminRole8: UserRole = { role: "admin", userId: "u1", adminLevel: 1 };

// 9. Log level union
type LogEntry =
  | { level: "debug"; message: string; context?: object }
  | { level: "info"; message: string }
  | { level: "warn"; message: string; code?: number }
  | { level: "error"; message: string; stack: string; code: number };
function formatLog(entry: LogEntry): string {
  const prefix = `[${entry.level.toUpperCase()}]`;
  if (entry.level === "error") return `${prefix} (${entry.code}) ${entry.message}\n${entry.stack}`;
  if (entry.level === "warn") return `${prefix} ${entry.message}${entry.code ? ` (${entry.code})` : ""}`;
  return `${prefix} ${entry.message}`;
}

// 10. File type union
type FileNode =
  | { type: "file"; name: string; size: number; mimeType: string }
  | { type: "directory"; name: string; childCount: number }
  | { type: "symlink"; name: string; target: string };
function describeNode(node: FileNode): string {
  switch (node.type) {
    case "file": return `File: ${node.name} (${node.size} bytes, ${node.mimeType})`;
    case "directory": return `Dir: ${node.name} (${node.childCount} items)`;
    case "symlink": return `Link: ${node.name} → ${node.target}`;
  }
}

// 11. Event types union
type DomEvent =
  | { event: "click"; x: number; y: number; button: 0 | 1 | 2 }
  | { event: "keydown"; key: string; code: string; ctrlKey: boolean }
  | { event: "resize"; width: number; height: number }
  | { event: "scroll"; scrollX: number; scrollY: number };
function handleEvent(e: DomEvent): void {
  if (e.event === "click") console.log(`Clicked at (${e.x},${e.y})`);
  else if (e.event === "keydown") console.log(`Key: ${e.key}`);
  else if (e.event === "resize") console.log(`Resized to ${e.width}x${e.height}`);
  else console.log(`Scrolled to ${e.scrollX},${e.scrollY}`);
}

// 12. Transport protocol union
type Protocol =
  | { protocol: "http"; method: "GET" | "POST" | "PUT" | "DELETE"; url: string }
  | { protocol: "websocket"; url: string; reconnect: boolean }
  | { protocol: "grpc"; service: string; method: string };
function describeProtocol(p: Protocol): string {
  switch (p.protocol) {
    case "http": return `${p.method} ${p.url}`;
    case "websocket": return `WS ${p.url} (reconnect: ${p.reconnect})`;
    case "grpc": return `gRPC ${p.service}/${p.method}`;
  }
}

// 13. Message status union
type MessageStatus =
  | { status: "sent"; sentAt: Date }
  | { status: "delivered"; sentAt: Date; deliveredAt: Date }
  | { status: "read"; sentAt: Date; deliveredAt: Date; readAt: Date }
  | { status: "failed"; sentAt: Date; reason: string };
function getStatusLabel(s: MessageStatus): string {
  switch (s.status) {
    case "sent": return "Sent";
    case "delivered": return `Delivered at ${s.deliveredAt.toLocaleTimeString()}`;
    case "read": return `Read at ${s.readAt.toLocaleTimeString()}`;
    case "failed": return `Failed: ${s.reason}`;
  }
}

// 14. HTTP response union
type HttpResponse14<T> =
  | { statusCode: 200; body: T }
  | { statusCode: 201; body: T; location: string }
  | { statusCode: 400; error: string }
  | { statusCode: 401; error: "Unauthorized" }
  | { statusCode: 404; error: "Not Found" }
  | { statusCode: 500; error: string };
function handleResponse<T>(res: HttpResponse14<T>): T | null {
  if (res.statusCode === 200 || res.statusCode === 201) return res.body;
  console.error(`Error ${res.statusCode}:`, res.error);
  return null;
}

// 15. Database query result union
type QueryResult<T> =
  | { type: "rows"; rows: T[]; count: number }
  | { type: "affected"; affectedRows: number }
  | { type: "error"; message: string; code: string };
function processQueryResult<T>(r: QueryResult<T>): string {
  switch (r.type) {
    case "rows": return `Found ${r.count} rows`;
    case "affected": return `${r.affectedRows} rows affected`;
    case "error": return `DB Error [${r.code}]: ${r.message}`;
  }
}

// 16. Form field type union
type FormField16 =
  | { fieldType: "text"; placeholder: string; maxLength?: number }
  | { fieldType: "number"; min?: number; max?: number; step?: number }
  | { fieldType: "select"; options: { label: string; value: string }[] }
  | { fieldType: "checkbox"; label: string; defaultChecked: boolean }
  | { fieldType: "date"; minDate?: string; maxDate?: string };
function renderFieldPlaceholder(f: FormField16): string {
  switch (f.fieldType) {
    case "text": return f.placeholder;
    case "number": return `${f.min ?? ""} - ${f.max ?? ""}`;
    case "select": return `${f.options.length} options`;
    case "checkbox": return f.label;
    case "date": return "Pick a date";
  }
}

// 17. Alert severity union
type Alert17 =
  | { severity: "info"; message: string; dismissable: boolean }
  | { severity: "warning"; message: string; code: number }
  | { severity: "error"; message: string; code: number; stack?: string }
  | { severity: "critical"; message: string; code: number; escalateTo: string };
function alertPriority(a: Alert17): number {
  switch (a.severity) {
    case "info": return 0;
    case "warning": return 1;
    case "error": return 2;
    case "critical": return 3;
  }
}

// 18. Subscription tier union
type Subscription =
  | { tier: "free"; maxProjects: 1; maxMembers: 1 }
  | { tier: "basic"; maxProjects: 5; maxMembers: 3; supportEmail: string }
  | { tier: "pro"; maxProjects: 20; maxMembers: 10; supportEmail: string; apiAccess: boolean }
  | { tier: "enterprise"; maxProjects: -1; maxMembers: -1; supportEmail: string; apiAccess: boolean; sla: string };
function getMaxProjects(s: Subscription): string {
  return s.maxProjects === -1 ? "Unlimited" : String(s.maxProjects);
}
const freeSub: Subscription = { tier: "free", maxProjects: 1, maxMembers: 1 };

// 19. Media content union
type MediaContent =
  | { contentType: "image"; url: string; width: number; height: number; alt: string }
  | { contentType: "video"; url: string; duration: number; thumbnail: string }
  | { contentType: "audio"; url: string; duration: number; waveform?: number[] }
  | { contentType: "document"; url: string; mimeType: string; pageCount: number };
function getMediaDimensions(m: MediaContent): string {
  if (m.contentType === "image") return `${m.width}x${m.height}`;
  if (m.contentType === "video" || m.contentType === "audio") return `${m.duration}s`;
  return `${m.pageCount} pages`;
}

// 20. Task status union
type TaskStatus =
  | { status: "todo"; createdAt: Date }
  | { status: "in_progress"; createdAt: Date; startedAt: Date; assignee: string }
  | { status: "blocked"; createdAt: Date; startedAt: Date; blockedReason: string }
  | { status: "done"; createdAt: Date; startedAt: Date; completedAt: Date }
  | { status: "cancelled"; createdAt: Date; cancelledAt: Date; reason: string };
function taskDuration(t: TaskStatus): number | null {
  if (t.status === "done") return t.completedAt.getTime() - t.startedAt.getTime();
  if (t.status === "in_progress") return Date.now() - t.startedAt.getTime();
  return null;
}

// 21. Vehicle type union
type Vehicle21 =
  | { vehicle: "car"; seats: number; transmission: "manual" | "automatic" }
  | { vehicle: "motorcycle"; engineCC: number; hasSidecar: boolean }
  | { vehicle: "truck"; payloadKg: number; axles: number }
  | { vehicle: "bicycle"; gears: number; electric: boolean };
function vehicleDescription(v: Vehicle21): string {
  switch (v.vehicle) {
    case "car": return `Car with ${v.seats} seats (${v.transmission})`;
    case "motorcycle": return `Motorcycle ${v.engineCC}cc`;
    case "truck": return `Truck, payload: ${v.payloadKg}kg`;
    case "bicycle": return `Bike, ${v.gears} gears${v.electric ? " (electric)" : ""}`;
  }
}

// 22. Error type union
type AppError =
  | { tag: "not_found"; resource: string; id: string }
  | { tag: "unauthorized"; action: string }
  | { tag: "validation"; field: string; constraint: string }
  | { tag: "rate_limited"; retryAfter: number }
  | { tag: "internal"; message: string };
function errorMessage(e: AppError): string {
  switch (e.tag) {
    case "not_found": return `${e.resource} '${e.id}' not found`;
    case "unauthorized": return `Not authorized to ${e.action}`;
    case "validation": return `${e.field} violated constraint: ${e.constraint}`;
    case "rate_limited": return `Rate limited. Retry after ${e.retryAfter}s`;
    case "internal": return `Internal error: ${e.message}`;
  }
}

// 23. Authentication event union
type AuthEvent =
  | { event: "login"; userId: string; method: "password" | "oauth" | "magic_link" }
  | { event: "logout"; userId: string; reason: "user_action" | "timeout" | "force" }
  | { event: "token_refresh"; userId: string; newExpiry: Date }
  | { event: "mfa_challenge"; userId: string; method: "totp" | "sms" }
  | { event: "password_reset"; email: string };
function logAuthEvent(e: AuthEvent): void {
  if (e.event === "login") console.log(`Login: ${e.userId} via ${e.method}`);
  else if (e.event === "logout") console.log(`Logout: ${e.userId} (${e.reason})`);
  else if (e.event === "token_refresh") console.log(`Token refreshed for ${e.userId}`);
  else if (e.event === "mfa_challenge") console.log(`MFA ${e.method} challenge for ${e.userId}`);
  else console.log(`Password reset for ${e.email}`);
}

// 24. Shipping status union
type ShippingStatus =
  | { stage: "order_placed"; orderId: string; placedAt: Date }
  | { stage: "processing"; orderId: string; warehouseId: string }
  | { stage: "shipped"; orderId: string; trackingNumber: string; carrier: string }
  | { stage: "out_for_delivery"; orderId: string; estimatedDelivery: Date }
  | { stage: "delivered"; orderId: string; deliveredAt: Date; signedBy?: string }
  | { stage: "returned"; orderId: string; returnedAt: Date; reason: string };
function shippingLabel(s: ShippingStatus): string {
  switch (s.stage) {
    case "order_placed": return "Order Placed";
    case "processing": return "Processing";
    case "shipped": return `Shipped via ${s.carrier} (${s.trackingNumber})`;
    case "out_for_delivery": return `Out for delivery (est. ${s.estimatedDelivery.toDateString()})`;
    case "delivered": return `Delivered${s.signedBy ? ` (signed by ${s.signedBy})` : ""}`;
    case "returned": return `Returned: ${s.reason}`;
  }
}

// 25. Build pipeline stage union
type PipelineStage25 =
  | { stage: "checkout"; branch: string; commitHash: string }
  | { stage: "install"; packages: number; duration: number }
  | { stage: "lint"; warnings: number; errors: number }
  | { stage: "test"; passed: number; failed: number; skipped: number }
  | { stage: "build"; artifacts: string[]; size: number }
  | { stage: "deploy"; environment: string; url: string };
function stageSummary(s: PipelineStage25): string {
  switch (s.stage) {
    case "checkout": return `Checked out ${s.branch}@${s.commitHash.slice(0, 7)}`;
    case "install": return `Installed ${s.packages} packages in ${s.duration}ms`;
    case "lint": return `Lint: ${s.warnings} warnings, ${s.errors} errors`;
    case "test": return `Tests: ${s.passed} passed, ${s.failed} failed, ${s.skipped} skipped`;
    case "build": return `Built ${s.artifacts.length} artifacts (${s.size} bytes)`;
    case "deploy": return `Deployed to ${s.environment}: ${s.url}`;
  }
}

// 26. Media player state union
type PlayerState =
  | { state: "stopped" }
  | { state: "buffering"; percent: number }
  | { state: "playing"; currentTime: number; duration: number; speed: number }
  | { state: "paused"; currentTime: number; duration: number }
  | { state: "ended"; duration: number };
function playerUI(s: PlayerState): string {
  switch (s.state) {
    case "stopped": return "⏹";
    case "buffering": return `⏳ ${s.percent}%`;
    case "playing": return `▶ ${s.currentTime.toFixed(0)}/${s.duration.toFixed(0)}s (${s.speed}x)`;
    case "paused": return `⏸ ${s.currentTime.toFixed(0)}/${s.duration.toFixed(0)}s`;
    case "ended": return "⏭ Ended";
  }
}

// 27. Cache operation union
type CacheOp =
  | { op: "get"; key: string }
  | { op: "set"; key: string; value: unknown; ttl?: number }
  | { op: "delete"; key: string }
  | { op: "clear" }
  | { op: "exists"; key: string };
function cacheOpDescription(c: CacheOp): string {
  switch (c.op) {
    case "get": return `GET ${c.key}`;
    case "set": return `SET ${c.key} = ${JSON.stringify(c.value)}${c.ttl ? ` (ttl: ${c.ttl}s)` : ""}`;
    case "delete": return `DEL ${c.key}`;
    case "clear": return "CLEAR ALL";
    case "exists": return `EXISTS ${c.key}`;
  }
}

// 28. Pricing model union
type PricingModel =
  | { model: "flat"; price: number }
  | { model: "per_unit"; pricePerUnit: number; units: number }
  | { model: "tiered"; tiers: { limit: number; price: number }[]; usage: number }
  | { model: "subscription"; monthlyPrice: number; annualPrice: number };
function calculatePrice(pm: PricingModel): number {
  switch (pm.model) {
    case "flat": return pm.price;
    case "per_unit": return pm.pricePerUnit * pm.units;
    case "tiered": {
      let cost = 0, remaining = pm.usage;
      for (const tier of pm.tiers) {
        const units = Math.min(remaining, tier.limit);
        cost += units * tier.price;
        remaining -= units;
        if (remaining <= 0) break;
      }
      return cost;
    }
    case "subscription": return pm.monthlyPrice;
  }
}

// 29. Sort direction union
type SortConfig =
  | { direction: "none" }
  | { direction: "asc"; field: string; nulls: "first" | "last" }
  | { direction: "desc"; field: string; nulls: "first" | "last" };
function sortLabel(s: SortConfig): string {
  if (s.direction === "none") return "Unsorted";
  return `${s.field} ${s.direction.toUpperCase()} (nulls ${s.nulls})`;
}

// 30. Network connection state union
type ConnectionState =
  | { state: "disconnected" }
  | { state: "connecting"; attempt: number; maxAttempts: number }
  | { state: "connected"; latencyMs: number; since: Date }
  | { state: "reconnecting"; reason: string; attempt: number }
  | { state: "error"; message: string };
function connectionSummary(c: ConnectionState): string {
  switch (c.state) {
    case "disconnected": return "Not connected";
    case "connecting": return `Connecting (attempt ${c.attempt}/${c.maxAttempts})`;
    case "connected": return `Connected (${c.latencyMs}ms)`;
    case "reconnecting": return `Reconnecting: ${c.reason} (attempt ${c.attempt})`;
    case "error": return `Connection error: ${c.message}`;
  }
}

// 31. Exhaustive check with never type
type Direction = "north" | "south" | "east" | "west";
function move(dir: Direction): [number, number] {
  switch (dir) {
    case "north": return [0, 1];
    case "south": return [0, -1];
    case "east": return [1, 0];
    case "west": return [-1, 0];
    default: const _exhaustive: never = dir; return _exhaustive;
  }
}
const position = move("north");

// 32. Configuration source union
type ConfigSource =
  | { source: "file"; path: string; format: "json" | "yaml" | "toml" }
  | { source: "env" }
  | { source: "remote"; url: string; pollIntervalMs?: number }
  | { source: "defaults" };
function configDescription(c: ConfigSource): string {
  switch (c.source) {
    case "file": return `File: ${c.path} (${c.format})`;
    case "env": return "Environment variables";
    case "remote": return `Remote: ${c.url}`;
    case "defaults": return "Built-in defaults";
  }
}

// 33. Job queue item union
type QueuedJob =
  | { jobType: "email"; to: string; templateId: string; data: Record<string, string> }
  | { jobType: "webhook"; url: string; payload: unknown; retries: number }
  | { jobType: "report"; reportId: string; format: "pdf" | "csv" | "xlsx" }
  | { jobType: "cleanup"; olderThanDays: number; tables: string[] };
function jobPriority(j: QueuedJob): "high" | "normal" | "low" {
  if (j.jobType === "email") return "high";
  if (j.jobType === "webhook") return "high";
  if (j.jobType === "report") return "normal";
  return "low";
}

// 34. Chart data series union
type DataSeries =
  | { seriesType: "line"; points: { x: number; y: number }[]; smooth: boolean }
  | { seriesType: "bar"; values: number[]; labels: string[] }
  | { seriesType: "pie"; segments: { label: string; value: number; color: string }[] }
  | { seriesType: "scatter"; points: { x: number; y: number; size: number }[] };
function seriesCount(s: DataSeries): number {
  switch (s.seriesType) {
    case "line": return s.points.length;
    case "bar": return s.values.length;
    case "pie": return s.segments.length;
    case "scatter": return s.points.length;
  }
}

// 35. Content block union (CMS-style)
type ContentBlock =
  | { block: "paragraph"; text: string; alignment: "left" | "center" | "right" }
  | { block: "heading"; text: string; level: 1 | 2 | 3 | 4 | 5 | 6 }
  | { block: "image"; url: string; alt: string; caption?: string }
  | { block: "code"; code: string; language: string; filename?: string }
  | { block: "quote"; text: string; author?: string };
function renderBlockText(b: ContentBlock): string {
  switch (b.block) {
    case "paragraph": return b.text;
    case "heading": return `${"#".repeat(b.level)} ${b.text}`;
    case "image": return `![${b.alt}](${b.url})${b.caption ? ` — ${b.caption}` : ""}`;
    case "code": return `\`\`\`${b.language}\n${b.code}\n\`\`\``;
    case "quote": return `> ${b.text}${b.author ? ` — ${b.author}` : ""}`;
  }
}

// 36. API rate limit response union
type RateLimitResult =
  | { allowed: true; remaining: number; resetAt: Date }
  | { allowed: false; retryAfter: number; reason: "quota_exceeded" | "burst_limit" };
function handleRateLimit(r: RateLimitResult): string {
  if (r.allowed) return `OK, ${r.remaining} requests remaining`;
  return `Blocked (${r.reason}), retry in ${r.retryAfter}s`;
}

// 37. Filter operator union
type FilterOp<T> =
  | { op: "eq"; value: T }
  | { op: "ne"; value: T }
  | { op: "gt"; value: T }
  | { op: "lt"; value: T }
  | { op: "in"; values: T[] }
  | { op: "not_in"; values: T[] }
  | { op: "between"; min: T; max: T };
function applyFilter<T>(val: T, filter: FilterOp<T>): boolean {
  switch (filter.op) {
    case "eq": return val === filter.value;
    case "ne": return val !== filter.value;
    case "gt": return val > filter.value;
    case "lt": return val < filter.value;
    case "in": return filter.values.includes(val);
    case "not_in": return !filter.values.includes(val);
    case "between": return val >= filter.min && val <= filter.max;
  }
}
const isInRange = applyFilter(15, { op: "between", min: 10, max: 20 });

// 38. Locale format union
type NumberFormat =
  | { format: "integer" }
  | { format: "decimal"; decimals: number }
  | { format: "currency"; currency: string; locale: string }
  | { format: "percent"; decimals: number }
  | { format: "compact" };
function formatNumber(n: number, fmt: NumberFormat): string {
  switch (fmt.format) {
    case "integer": return Math.round(n).toString();
    case "decimal": return n.toFixed(fmt.decimals);
    case "currency": return new Intl.NumberFormat(fmt.locale, { style: "currency", currency: fmt.currency }).format(n);
    case "percent": return `${(n * 100).toFixed(fmt.decimals)}%`;
    case "compact": return new Intl.NumberFormat(undefined, { notation: "compact" }).format(n);
  }
}

// 39. Storage backend union
type StorageBackend =
  | { backend: "memory" }
  | { backend: "localStorage"; prefix?: string }
  | { backend: "sessionStorage"; prefix?: string }
  | { backend: "indexedDB"; dbName: string; storeName: string }
  | { backend: "s3"; bucket: string; region: string; prefix?: string };
function backendDescription(b: StorageBackend): string {
  switch (b.backend) {
    case "memory": return "In-memory storage";
    case "localStorage": return `localStorage${b.prefix ? ` (prefix: ${b.prefix})` : ""}`;
    case "sessionStorage": return `sessionStorage${b.prefix ? ` (prefix: ${b.prefix})` : ""}`;
    case "indexedDB": return `IndexedDB: ${b.dbName}/${b.storeName}`;
    case "s3": return `S3: s3://${b.bucket}${b.prefix ?? ""}`;
  }
}

// 40. Component variant union
type ButtonVariant =
  | { variant: "primary"; label: string; onClick: () => void }
  | { variant: "secondary"; label: string; onClick: () => void; outline: boolean }
  | { variant: "danger"; label: string; onClick: () => void; confirmText: string }
  | { variant: "icon"; icon: string; ariaLabel: string; onClick: () => void }
  | { variant: "link"; label: string; href: string; target?: "_blank" | "_self" };
function buttonAriaLabel(b: ButtonVariant): string {
  if (b.variant === "icon") return b.ariaLabel;
  if (b.variant === "link") return b.label;
  return b.label;
}

// 41. Search result union
type SearchResult =
  | { resultType: "user"; userId: string; name: string; avatar?: string }
  | { resultType: "post"; postId: string; title: string; excerpt: string }
  | { resultType: "tag"; tag: string; postCount: number }
  | { resultType: "page"; pageId: string; title: string; url: string };
function resultTitle(r: SearchResult): string {
  switch (r.resultType) {
    case "user": return r.name;
    case "post": return r.title;
    case "tag": return `#${r.tag} (${r.postCount})`;
    case "page": return r.title;
  }
}

// 42. Keyboard shortcut union
type KeyboardShortcut =
  | { type: "single"; key: string }
  | { type: "chord"; keys: string[] }
  | { type: "sequence"; sequence: string[] };
function shortcutDisplay(s: KeyboardShortcut): string {
  switch (s.type) {
    case "single": return s.key;
    case "chord": return s.keys.join("+");
    case "sequence": return s.sequence.join(" → ");
  }
}

// 43. Transaction type union
type Transaction =
  | { txType: "debit"; amount: number; account: string; description: string }
  | { txType: "credit"; amount: number; account: string; description: string }
  | { txType: "transfer"; amount: number; fromAccount: string; toAccount: string }
  | { txType: "fee"; amount: number; feeType: string };
function txSign(t: Transaction): 1 | -1 {
  if (t.txType === "credit") return 1;
  return -1;
}
function txDescription(t: Transaction): string {
  switch (t.txType) {
    case "debit": return `Debit: ${t.description}`;
    case "credit": return `Credit: ${t.description}`;
    case "transfer": return `Transfer from ${t.fromAccount} to ${t.toAccount}`;
    case "fee": return `Fee: ${t.feeType}`;
  }
}

// 44. Encoding format union
type EncodingFormat =
  | { encoding: "utf8" }
  | { encoding: "base64"; padding: boolean }
  | { encoding: "hex"; uppercase: boolean }
  | { encoding: "binary" };
function encodingLabel(e: EncodingFormat): string {
  switch (e.encoding) {
    case "utf8": return "UTF-8";
    case "base64": return `Base64${e.padding ? "" : " (no padding)"}`;
    case "hex": return `Hex${e.uppercase ? " (uppercase)" : ""}`;
    case "binary": return "Binary";
  }
}

// 45. Deployment target union
type DeployTarget =
  | { target: "static"; cdn: string; bucket: string }
  | { target: "serverless"; provider: "aws" | "gcp" | "azure"; region: string }
  | { target: "container"; registry: string; image: string; tag: string }
  | { target: "vm"; host: string; port: number; user: string };
function deployCommand(d: DeployTarget): string {
  switch (d.target) {
    case "static": return `aws s3 sync . s3://${d.bucket}`;
    case "serverless": return `deploy --provider ${d.provider} --region ${d.region}`;
    case "container": return `docker push ${d.registry}/${d.image}:${d.tag}`;
    case "vm": return `ssh ${d.user}@${d.host}:${d.port}`;
  }
}

// 46. License type union
type License =
  | { type: "mit"; author: string; year: number }
  | { type: "apache2"; organization: string }
  | { type: "gpl"; version: 2 | 3; allowLinking: boolean }
  | { type: "commercial"; company: string; seats: number | "unlimited" }
  | { type: "proprietary"; company: string };
function licenseDescription(l: License): string {
  switch (l.type) {
    case "mit": return `MIT License (${l.author}, ${l.year})`;
    case "apache2": return `Apache 2.0 (${l.organization})`;
    case "gpl": return `GPL v${l.version}${l.allowLinking ? " with linking exception" : ""}`;
    case "commercial": return `Commercial (${l.company}, ${l.seats} seats)`;
    case "proprietary": return `Proprietary (${l.company})`;
  }
}

// 47. Compression algorithm union
type Compression =
  | { algorithm: "none" }
  | { algorithm: "gzip"; level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 }
  | { algorithm: "brotli"; quality: number }
  | { algorithm: "lz4"; acceleration: number };
function compressionMimeType(c: Compression): string {
  switch (c.algorithm) {
    case "none": return "identity";
    case "gzip": return "gzip";
    case "brotli": return "br";
    case "lz4": return "x-lz4";
  }
}

// 48. Webhook delivery status union
type WebhookDelivery =
  | { status: "pending"; queuedAt: Date }
  | { status: "delivering"; attempts: number; nextRetry?: Date }
  | { status: "delivered"; deliveredAt: Date; responseCode: number }
  | { status: "failed"; attempts: number; lastError: string; gaveUpAt: Date };
function webhookStatusBadge(w: WebhookDelivery): string {
  switch (w.status) {
    case "pending": return "🟡 Pending";
    case "delivering": return `🔄 Attempt ${w.attempts}`;
    case "delivered": return `✅ ${w.responseCode}`;
    case "failed": return `❌ Failed after ${w.attempts} attempts`;
  }
}

// 49. Grid cell content union
type CellContent =
  | { cellType: "text"; value: string; truncate?: number }
  | { cellType: "number"; value: number; format?: NumberFormat }
  | { cellType: "boolean"; value: boolean; trueLabel?: string; falseLabel?: string }
  | { cellType: "date"; value: Date; dateFormat: string }
  | { cellType: "actions"; items: { label: string; onClick: () => void }[] };
function cellDisplayValue(c: CellContent): string {
  switch (c.cellType) {
    case "text": return c.truncate && c.value.length > c.truncate ? c.value.slice(0, c.truncate) + "…" : c.value;
    case "number": return c.value.toString();
    case "boolean": return c.value ? (c.trueLabel ?? "Yes") : (c.falseLabel ?? "No");
    case "date": return c.value.toLocaleDateString();
    case "actions": return `${c.items.length} actions`;
  }
}

// 50. Environment variable type union
type EnvVar =
  | { varType: "string"; value: string }
  | { varType: "number"; value: number }
  | { varType: "boolean"; value: boolean }
  | { varType: "json"; value: Record<string, unknown> }
  | { varType: "list"; value: string[]; separator: string };
function envVarToString(v: EnvVar): string {
  switch (v.varType) {
    case "string": return v.value;
    case "number": return String(v.value);
    case "boolean": return v.value ? "true" : "false";
    case "json": return JSON.stringify(v.value);
    case "list": return v.value.join(v.separator);
  }
}
