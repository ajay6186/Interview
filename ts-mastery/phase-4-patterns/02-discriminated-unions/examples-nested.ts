export {};

// ============================================================
// NESTED EXAMPLES — Discriminated Unions (50 Examples)
// ============================================================

// 1. Union of unions — HTTP body with nested content type
type TextBody = { contentType: "text/plain"; text: string };
type HtmlBody = { contentType: "text/html"; html: string; sanitized: boolean };
type JsonBody = { contentType: "application/json"; json: unknown };
type MultipartBody = { contentType: "multipart/form-data"; fields: Record<string, string>; files: { name: string; size: number }[] };
type HttpBody = TextBody | HtmlBody | JsonBody | MultipartBody;
type HttpResponse1 =
  | { status: "2xx"; code: 200 | 201 | 204; body?: HttpBody }
  | { status: "4xx"; code: 400 | 401 | 403 | 404; body: TextBody | JsonBody }
  | { status: "5xx"; code: 500 | 502 | 503; body?: TextBody };
function describeResponse(res: HttpResponse1): string {
  const bodyInfo = res.body ? ` (${res.body.contentType})` : "";
  return `HTTP ${res.code}${bodyInfo}`;
}

// 2. Recursive JSON schema as discriminated union
type JsonSchema2 =
  | { schemaType: "string"; minLength?: number; maxLength?: number; pattern?: string }
  | { schemaType: "number"; minimum?: number; maximum?: number; integer?: boolean }
  | { schemaType: "boolean" }
  | { schemaType: "null" }
  | { schemaType: "array"; items: JsonSchema2; minItems?: number; maxItems?: number }
  | { schemaType: "object"; properties: Record<string, JsonSchema2>; required?: string[] }
  | { schemaType: "union"; oneOf: JsonSchema2[] }
  | { schemaType: "intersection"; allOf: JsonSchema2[] };
function schemaDescription(s: JsonSchema2, indent = 0): string {
  const pad = "  ".repeat(indent);
  switch (s.schemaType) {
    case "string": return `${pad}string${s.pattern ? ` (pattern: ${s.pattern})` : ""}`;
    case "number": return `${pad}number${s.integer ? " (int)" : ""}`;
    case "boolean": return `${pad}boolean`;
    case "null": return `${pad}null`;
    case "array": return `${pad}array of:\n${schemaDescription(s.items, indent + 1)}`;
    case "object": return `${pad}object {\n${Object.entries(s.properties).map(([k, v]) => `${pad}  ${k}: ${schemaDescription(v, indent + 1).trim()}`).join("\n")}\n${pad}}`;
    case "union": return `${pad}one of:\n${s.oneOf.map(o => schemaDescription(o, indent + 1)).join("\n")}`;
    case "intersection": return `${pad}all of:\n${s.allOf.map(o => schemaDescription(o, indent + 1)).join("\n")}`;
  }
}

// 3. Nested discriminated union for AST nodes
type Stmt3 =
  | { stmt: "let"; name: string; init: Expr3 }
  | { stmt: "if"; cond: Expr3; then: Stmt3[]; else?: Stmt3[] }
  | { stmt: "while"; cond: Expr3; body: Stmt3[] }
  | { stmt: "return"; value?: Expr3 }
  | { stmt: "expr"; expr: Expr3 };
type Expr3 =
  | { expr: "num"; value: number }
  | { expr: "var"; name: string }
  | { expr: "binop"; op: "+" | "-" | "*" | "/" | "=="; left: Expr3; right: Expr3 }
  | { expr: "call"; func: string; args: Expr3[] }
  | { expr: "index"; object: Expr3; key: Expr3 };
function stmtToCode(s: Stmt3): string {
  switch (s.stmt) {
    case "let": return `let ${s.name} = ${exprToCode(s.init)}`;
    case "if": return `if (${exprToCode(s.cond)}) { ... }${s.else ? " else { ... }" : ""}`;
    case "while": return `while (${exprToCode(s.cond)}) { ... }`;
    case "return": return `return${s.value ? ` ${exprToCode(s.value)}` : ""}`;
    case "expr": return exprToCode(s.expr);
  }
}
function exprToCode(e: Expr3): string {
  switch (e.expr) {
    case "num": return String(e.value);
    case "var": return e.name;
    case "binop": return `${exprToCode(e.left)} ${e.op} ${exprToCode(e.right)}`;
    case "call": return `${e.func}(${e.args.map(exprToCode).join(", ")})`;
    case "index": return `${exprToCode(e.object)}[${exprToCode(e.key)}]`;
  }
}

// 4. Nested event with nested payload unions
type BaseEvent4 = { eventId: string; timestamp: number; source: string };
type UserPayload4 = { userId: string } & ({ action: "created"; name: string } | { action: "deleted" } | { action: "updated"; changes: Partial<{ name: string; email: string }> });
type OrderPayload4 = { orderId: string } & ({ action: "placed"; amount: number } | { action: "shipped"; trackingNumber: string } | { action: "cancelled"; reason: string });
type DomainEvent4 = BaseEvent4 & ({ domain: "user"; payload: UserPayload4 } | { domain: "order"; payload: OrderPayload4 });
function eventSummary(e: DomainEvent4): string {
  if (e.domain === "user") {
    const p = e.payload;
    if (p.action === "created") return `User ${p.userId} created (${p.name})`;
    if (p.action === "deleted") return `User ${p.userId} deleted`;
    return `User ${p.userId} updated`;
  } else {
    const p = e.payload;
    if (p.action === "placed") return `Order ${p.orderId} placed ($${p.amount})`;
    if (p.action === "shipped") return `Order ${p.orderId} shipped (${p.trackingNumber})`;
    return `Order ${p.orderId} cancelled: ${p.reason}`;
  }
}

// 5. Nested state: outer loading wraps inner loaded data union
type ViewState<T> =
  | { loadState: "loading" }
  | { loadState: "error"; error: string }
  | { loadState: "loaded"; data: T };
type DashboardData5 =
  | { view: "summary"; metrics: { revenue: number; users: number; sessions: number } }
  | { view: "detail"; entityId: string; entityType: "user" | "product"; details: Record<string, unknown> }
  | { view: "empty"; reason: string };
type DashboardState5 = ViewState<DashboardData5>;
function renderDashboard(state: DashboardState5): string {
  if (state.loadState === "loading") return "Loading...";
  if (state.loadState === "error") return `Error: ${state.error}`;
  const d = state.data;
  if (d.view === "summary") return `Revenue: ${d.metrics.revenue}, Users: ${d.metrics.users}`;
  if (d.view === "detail") return `${d.entityType} ${d.entityId}`;
  return `Empty: ${d.reason}`;
}

// 6. Union within union — permissions for nested resource hierarchy
type ResourceType6 = "org" | "team" | "project" | "file";
type OrgPermission = { resource: "org"; orgId: string; action: "manage" | "view" | "billing" };
type TeamPermission = { resource: "team"; orgId: string; teamId: string; action: "manage" | "view" | "invite" };
type ProjectPermission = { resource: "project"; orgId: string; teamId: string; projectId: string; action: "manage" | "write" | "read" };
type FilePermission = { resource: "file"; projectId: string; fileId: string; action: "read" | "write" | "delete" };
type Permission6 = OrgPermission | TeamPermission | ProjectPermission | FilePermission;
function permissionScope(p: Permission6): string {
  switch (p.resource) {
    case "org": return `org:${p.orgId}:${p.action}`;
    case "team": return `team:${p.orgId}/${p.teamId}:${p.action}`;
    case "project": return `project:${p.orgId}/${p.teamId}/${p.projectId}:${p.action}`;
    case "file": return `file:${p.projectId}/${p.fileId}:${p.action}`;
  }
}

// 7. Configuration union with nested sub-configs
type DbConfig7 = { type: "postgres"; host: string; port: number; ssl: boolean } | { type: "sqlite"; filepath: string } | { type: "mongodb"; uri: string; dbName: string };
type CacheConfig7 = { type: "redis"; host: string; port: number } | { type: "memcached"; host: string; port: number } | { type: "in_memory"; maxItems: number };
type LogConfig7 = { type: "console"; colorize: boolean } | { type: "file"; path: string; rotate: boolean } | { type: "remote"; url: string; apiKey: string };
type AppConfig7 = { db: DbConfig7; cache?: CacheConfig7; log: LogConfig7; env: "dev" | "prod" };
function configSummary(c: AppConfig7): string {
  return `[${c.env}] DB:${c.db.type}, Log:${c.log.type}${c.cache ? `, Cache:${c.cache.type}` : ""}`;
}

// 8. Type-safe nested event bus message routing
type Topic8 = "auth" | "orders" | "inventory" | "notifications";
type AuthMessages = { topic: "auth" } & ({ event: "login"; userId: string; method: string } | { event: "logout"; userId: string } | { event: "token_expired"; userId: string });
type OrderMessages = { topic: "orders" } & ({ event: "created"; orderId: string; total: number } | { event: "paid"; orderId: string } | { event: "fulfilled"; orderId: string });
type InventoryMessages = { topic: "inventory" } & ({ event: "stock_updated"; sku: string; newStock: number } | { event: "out_of_stock"; sku: string });
type NotificationMessages = { topic: "notifications" } & ({ event: "sent"; notifId: string; channel: string } | { event: "delivered"; notifId: string });
type BusMessage8 = AuthMessages | OrderMessages | InventoryMessages | NotificationMessages;
function routeMessage(msg: BusMessage8): string {
  switch (msg.topic) {
    case "auth": return `Auth[${msg.event}]`;
    case "orders": return `Orders[${msg.event}]`;
    case "inventory": return `Inventory[${msg.event}]`;
    case "notifications": return `Notifications[${msg.event}]`;
  }
}

// 9. Nested discriminated union for editor document model
type Inline9 = { inline: "text"; text: string; bold?: boolean; italic?: boolean } | { inline: "link"; text: string; href: string } | { inline: "code"; code: string };
type Block9 =
  | { block: "paragraph"; inlines: Inline9[] }
  | { block: "heading"; level: 1 | 2 | 3; inlines: Inline9[] }
  | { block: "list"; ordered: boolean; items: Inline9[][] }
  | { block: "blockquote"; content: Block9[] }
  | { block: "code_block"; code: string; language: string };
type Document9 = { title: string; blocks: Block9[] };
function countWords(doc: Document9): number {
  let count = 0;
  for (const block of doc.blocks) {
    if (block.block === "paragraph" || block.block === "heading") {
      count += block.inlines.reduce((n, i) => n + (i.inline === "text" || i.inline === "link" ? i.text.split(/\s+/).length : 0), 0);
    }
  }
  return count;
}

// 10. Nested union for type-safe workflow with sub-steps
type PaymentStep10 = { step: "payment" } & ({ status: "pending" } | { status: "authorized"; authCode: string } | { status: "captured"; amount: number; transactionId: string } | { status: "failed"; reason: string });
type FulfillmentStep10 = { step: "fulfillment" } & ({ status: "pending" } | { status: "processing"; warehouseId: string } | { status: "shipped"; trackingNumber: string } | { status: "delivered"; deliveredAt: Date });
type WorkflowStep10 = PaymentStep10 | FulfillmentStep10;
function stepProgress(s: WorkflowStep10): number {
  const statusMap = { pending: 0, authorized: 33, captured: 100, failed: -1, processing: 50, shipped: 75, delivered: 100 };
  return (statusMap as any)[s.status] ?? 0;
}

// 11. Combining discriminated union with intersection for mixins
type Auditable11 = { createdBy: string; createdAt: Date; updatedBy?: string; updatedAt?: Date };
type Versioned11 = { version: number; changelog: string };
type BaseEntity11 =
  | ({ kind: "user"; name: string; email: string } & Auditable11)
  | ({ kind: "product"; sku: string; price: number } & Auditable11 & Versioned11)
  | ({ kind: "order"; orderId: string; total: number } & Auditable11);
function entityAuditInfo(e: BaseEntity11): string {
  return `Created by ${e.createdBy} at ${e.createdAt.toISOString()}`;
}
function entityVersion(e: BaseEntity11): number | null {
  return e.kind === "product" ? e.version : null;
}

// 12. Nested union for policy rules with conditions
type Condition12 =
  | { condType: "eq"; field: string; value: unknown }
  | { condType: "gt"; field: string; value: number }
  | { condType: "in"; field: string; values: unknown[] }
  | { condType: "and"; conditions: Condition12[] }
  | { condType: "or"; conditions: Condition12[] }
  | { condType: "not"; condition: Condition12 };
type PolicyRule12 =
  | { effect: "allow"; actions: string[]; condition?: Condition12 }
  | { effect: "deny"; actions: string[]; condition?: Condition12; override: boolean };
type Policy12 = { name: string; rules: PolicyRule12[]; priority: number };
function conditionToString(c: Condition12): string {
  switch (c.condType) {
    case "eq": return `${c.field} == ${JSON.stringify(c.value)}`;
    case "gt": return `${c.field} > ${c.value}`;
    case "in": return `${c.field} in [${c.values.map(v => JSON.stringify(v)).join(",")}]`;
    case "and": return `(${c.conditions.map(conditionToString).join(" AND ")})`;
    case "or": return `(${c.conditions.map(conditionToString).join(" OR ")})`;
    case "not": return `NOT (${conditionToString(c.condition)})`;
  }
}

// 13. Union for hierarchical tree of UI components
type UiLeaf13 =
  | { uiType: "button"; label: string; onClick: string; variant: "primary" | "secondary" | "danger" }
  | { uiType: "input"; name: string; inputType: "text" | "email" | "password"; placeholder?: string }
  | { uiType: "text"; content: string; tag: "p" | "span" | "label" };
type UiNode13 =
  | UiLeaf13
  | { uiType: "div"; className?: string; children: UiNode13[] }
  | { uiType: "form"; action: string; method: "get" | "post"; children: UiNode13[] }
  | { uiType: "section"; title?: string; children: UiNode13[] };
function collectInputs(node: UiNode13): string[] {
  if (node.uiType === "input") return [node.name];
  if ("children" in node) return node.children.flatMap(collectInputs);
  return [];
}

// 14. Nested union for monitoring alert rules
type Threshold14 = { type: "static"; value: number; operator: ">" | "<" | ">=" | "<=" } | { type: "dynamic"; baselineWindowMs: number; stdDeviations: number };
type AlertChannel14 = { channel: "email"; recipients: string[] } | { channel: "slack"; webhookUrl: string; channel: string } | { channel: "pagerduty"; serviceKey: string; severity: "critical" | "warning" };
type AlertRule14 = {
  name: string;
  metric: string;
  threshold: Threshold14;
  channels: AlertChannel14[];
  enabled: boolean;
  cooldownMs: number;
};
function alertRuleDescription(rule: AlertRule14): string {
  const t = rule.threshold.type === "static"
    ? `${rule.threshold.operator} ${rule.threshold.value}`
    : `> ${rule.threshold.stdDeviations}σ baseline`;
  return `Alert '${rule.name}': ${rule.metric} ${t} → ${rule.channels.map(c => c.channel).join(", ")}`;
}

// 15. Nested union for content delivery rules
type GeoRule15 = { type: "country"; countries: string[] } | { type: "region"; regions: string[] } | { type: "ip_range"; ranges: string[] };
type DeviceRule15 = { type: "platform"; platforms: ("ios" | "android" | "web")[] } | { type: "user_agent"; regex: string };
type AudienceRule15 =
  | { rule: "all" }
  | { rule: "geo"; geoRule: GeoRule15 }
  | { rule: "device"; deviceRule: DeviceRule15 }
  | { rule: "authenticated"; minAccountAgeDays?: number }
  | { rule: "segment"; segmentId: string }
  | { rule: "and"; rules: AudienceRule15[] }
  | { rule: "or"; rules: AudienceRule15[] };
function audienceDescription(a: AudienceRule15): string {
  switch (a.rule) {
    case "all": return "Everyone";
    case "geo": return `Geo: ${a.geoRule.type}`;
    case "device": return `Device: ${a.deviceRule.type}`;
    case "authenticated": return `Authenticated${a.minAccountAgeDays ? ` (${a.minAccountAgeDays}+ days)` : ""}`;
    case "segment": return `Segment: ${a.segmentId}`;
    case "and": return `(${a.rules.map(audienceDescription).join(" AND ")})`;
    case "or": return `(${a.rules.map(audienceDescription).join(" OR ")})`;
  }
}

// 16. Union for network packet types with nested payloads
type IpHeader16 = { version: 4; ipv4: { src: string; dst: string; ttl: number } } | { version: 6; ipv6: { src: string; dst: string; hopLimit: number } };
type TcpPayload16 = { protocol: "tcp"; srcPort: number; dstPort: number; flags: string[]; data: Uint8Array };
type UdpPayload16 = { protocol: "udp"; srcPort: number; dstPort: number; data: Uint8Array };
type IcmpPayload16 = { protocol: "icmp"; type: number; code: number };
type Packet16 = { header: IpHeader16; payload: TcpPayload16 | UdpPayload16 | IcmpPayload16 };
function packetDescription(p: Packet16): string {
  const src = p.header.version === 4 ? p.header.ipv4.src : p.header.ipv6.src;
  const dst = p.header.version === 4 ? p.header.ipv4.dst : p.header.ipv6.dst;
  const proto = p.payload.protocol.toUpperCase();
  return `${proto} ${src} → ${dst}`;
}

// 17. Union for data pipeline with nested transforms
type DataSource17 = { source: "csv"; path: string; delimiter: string } | { source: "json"; path: string } | { source: "db"; query: string; connection: string };
type Transform17 =
  | { transform: "filter"; condition: string }
  | { transform: "map"; expression: string }
  | { transform: "aggregate"; fn: "sum" | "count" | "avg"; field: string; groupBy?: string[] }
  | { transform: "join"; other: DataSource17; on: string; type: "inner" | "left" | "right" }
  | { transform: "sort"; field: string; desc: boolean };
type DataSink17 = { sink: "csv"; path: string } | { sink: "json"; path: string } | { sink: "db"; table: string; connection: string } | { sink: "console"; pretty: boolean };
type DataPipeline17 = { name: string; source: DataSource17; transforms: Transform17[]; sink: DataSink17 };
function pipelineDescription(p: DataPipeline17): string {
  return `Pipeline '${p.name}': ${p.source.source} → [${p.transforms.map(t => t.transform).join(",")}] → ${p.sink.sink}`;
}

// 18. Nested union for type-safe serialization formats
type SerializeTarget18 =
  | { format: "json"; pretty: boolean; nullStrategy: "include" | "exclude" | "null" }
  | { format: "yaml"; indentSize: number; quotingStyle: "single" | "double" | "minimal" }
  | { format: "xml"; rootElement: string; namespace?: string; prettyPrint: boolean }
  | { format: "csv"; headers: boolean; delimiter: string; quoteChar: string }
  | { format: "binary"; encoding: "big_endian" | "little_endian" };
function serializerLabel(t: SerializeTarget18): string {
  switch (t.format) {
    case "json": return `JSON${t.pretty ? " (pretty)" : ""}`;
    case "yaml": return `YAML (indent: ${t.indentSize})`;
    case "xml": return `XML <${t.rootElement}${t.namespace ? ` ns:${t.namespace}` : ""}>`;
    case "csv": return `CSV (${t.delimiter})`;
    case "binary": return `Binary (${t.encoding})`;
  }
}

// 19. Recursive type-safe command tree
type Command19 =
  | { kind: "exec"; name: string; args: string[] }
  | { kind: "sequence"; commands: Command19[] }
  | { kind: "parallel"; commands: Command19[] }
  | { kind: "conditional"; condition: string; then: Command19; else?: Command19 }
  | { kind: "retry"; command: Command19; maxAttempts: number; delayMs: number };
function commandDescription(cmd: Command19, depth = 0): string {
  const pad = "  ".repeat(depth);
  switch (cmd.kind) {
    case "exec": return `${pad}exec: ${cmd.name} ${cmd.args.join(" ")}`;
    case "sequence": return `${pad}sequence:\n${cmd.commands.map(c => commandDescription(c, depth + 1)).join("\n")}`;
    case "parallel": return `${pad}parallel:\n${cmd.commands.map(c => commandDescription(c, depth + 1)).join("\n")}`;
    case "conditional": return `${pad}if (${cmd.condition}):\n${commandDescription(cmd.then, depth + 1)}${cmd.else ? `\n${pad}else:\n${commandDescription(cmd.else, depth + 1)}` : ""}`;
    case "retry": return `${pad}retry (${cmd.maxAttempts}x):\n${commandDescription(cmd.command, depth + 1)}`;
  }
}
const deployCommand19: Command19 = {
  kind: "retry",
  maxAttempts: 3, delayMs: 5000,
  command: { kind: "sequence", commands: [
    { kind: "exec", name: "docker", args: ["build", "."] },
    { kind: "parallel", commands: [
      { kind: "exec", name: "test", args: ["--unit"] },
      { kind: "exec", name: "test", args: ["--integration"] }
    ]},
    { kind: "exec", name: "docker", args: ["push", "registry/app:latest"] }
  ]}
};

// 20. Union for type-safe localization keys
type I18nValue20 =
  | { valueType: "string"; text: string }
  | { valueType: "plural"; zero?: string; one: string; other: string }
  | { valueType: "template"; template: string; variables: string[] };
type I18nEntry20 = { key: string; locale: string } & I18nValue20;
function resolveI18n(entry: I18nEntry20, count?: number, vars?: Record<string, string>): string {
  if (entry.valueType === "string") return entry.text;
  if (entry.valueType === "plural") {
    const n = count ?? 0;
    return n === 0 ? (entry.zero ?? entry.other) : n === 1 ? entry.one : entry.other;
  }
  let text = entry.template;
  for (const [k, v] of Object.entries(vars ?? {})) text = text.replace(`{{${k}}}`, v);
  return text;
}

// 21. Multi-level permission union
type SystemRole = "superadmin" | "admin" | "moderator" | "user" | "guest";
type ContentPermission21 =
  | { contentScope: "own"; userId: string }
  | { contentScope: "team"; teamId: string }
  | { contentScope: "org"; orgId: string }
  | { contentScope: "global" };
type FeaturePermission21 =
  | { feature: "analytics"; level: "basic" | "advanced" }
  | { feature: "billing"; canWrite: boolean }
  | { feature: "api"; rateLimit: number; allowedEndpoints: string[] };
type UserPermissions21 = { role: SystemRole; content: ContentPermission21; features: FeaturePermission21[] };
function permissionSummary(p: UserPermissions21): string {
  const contentScope = p.content.contentScope;
  return `${p.role}: ${contentScope} scope, ${p.features.length} features`;
}

// 22. Union for type-safe notification routing
type NotifChannel22 =
  | { channel: "email"; templateId: string; recipients: string[]; cc?: string[] }
  | { channel: "sms"; phoneNumbers: string[]; sender?: string }
  | { channel: "push"; tokens: string[]; sound?: string; badge?: number }
  | { channel: "slack"; workspaceId: string; channelId: string; mentionUsers?: string[] }
  | { channel: "webhook"; url: string; headers: Record<string, string>; retries: number };
type NotifPriority22 = { priority: "low"; delay?: number } | { priority: "normal" } | { priority: "high"; bypassDnd: boolean } | { priority: "critical"; callIfNeeded: boolean };
type Notification22 = { id: string; templateId: string; channels: NotifChannel22[]; priority: NotifPriority22; scheduledFor?: Date };
function notifDescription(n: Notification22): string {
  const channels = n.channels.map(c => c.channel).join(", ");
  return `Notif ${n.id}: ${channels} (${n.priority.priority})`;
}

// 23. Complex nested union for data validation pipeline
type Coercion23 =
  | { coerce: "to_string" }
  | { coerce: "to_number"; base?: 10 | 16 | 2 }
  | { coerce: "to_date"; format: string }
  | { coerce: "to_boolean"; truthy?: string[]; falsy?: string[] };
type ValidationRule23 =
  | { rule: "required" }
  | { rule: "min_length"; min: number }
  | { rule: "max_length"; max: number }
  | { rule: "regex"; pattern: string; flags?: string }
  | { rule: "range"; min: number; max: number }
  | { rule: "custom"; fn: (v: unknown) => boolean; message: string };
type FieldSpec23 = { name: string; label: string; coercion?: Coercion23; validations: ValidationRule23[] };
function fieldDescription(f: FieldSpec23): string {
  const rules = f.validations.map(r => r.rule).join(", ");
  const coerce = f.coercion ? ` → ${f.coercion.coerce}` : "";
  return `${f.label} (${f.name}${coerce}): ${rules}`;
}

// 24. Recursive menu tree with nested discriminated union
type MenuAction24 = { actionType: "navigate"; path: string } | { actionType: "modal"; modalId: string } | { actionType: "external"; url: string; target?: "_blank" | "_self" } | { actionType: "command"; commandId: string };
type MenuItem24 =
  | { menuType: "item"; label: string; icon?: string; action: MenuAction24; disabled?: boolean; badge?: number }
  | { menuType: "separator" }
  | { menuType: "group"; label: string; collapsible: boolean; items: MenuItem24[] }
  | { menuType: "submenu"; label: string; icon?: string; items: MenuItem24[] };
function flattenMenuItems(items: MenuItem24[]): string[] {
  return items.flatMap(item => {
    if (item.menuType === "item") return [item.label];
    if (item.menuType === "separator") return [];
    return flattenMenuItems(item.items);
  });
}

// 25. Union for type-safe form validation with nested rules
type SimpleValidationRule25 = { vType: "required" } | { vType: "email" } | { vType: "url" } | { vType: "min"; value: number } | { vType: "max"; value: number };
type CompositeValidationRule25 =
  | { vType: "and"; rules: ValidationRule25[] }
  | { vType: "or"; rules: ValidationRule25[] }
  | { vType: "when"; field: string; is: unknown; then: ValidationRule25 };
type ValidationRule25 = SimpleValidationRule25 | CompositeValidationRule25;
function ruleDescription(r: ValidationRule25): string {
  switch (r.vType) {
    case "required": return "required";
    case "email": return "valid email";
    case "url": return "valid URL";
    case "min": return `>= ${r.value}`;
    case "max": return `<= ${r.value}`;
    case "and": return `(${r.rules.map(ruleDescription).join(" AND ")})`;
    case "or": return `(${r.rules.map(ruleDescription).join(" OR ")})`;
    case "when": return `when ${r.field} is ${JSON.stringify(r.is)}: ${ruleDescription(r.then)}`;
  }
}

// 26. Union for CMS content hierarchy
type PageSlot26 = { slotName: string } & (
  | { slotType: "text"; content: string; format: "plain" | "markdown" | "html" }
  | { slotType: "image"; url: string; alt: string; width?: number; height?: number }
  | { slotType: "video"; url: string; poster?: string; autoplay: boolean }
  | { slotType: "component"; componentId: string; props: Record<string, unknown> }
  | { slotType: "list"; items: PageSlot26[] }
);
type PageTemplate26 = "landing" | "article" | "product" | "category";
type Page26 = { pageId: string; slug: string; template: PageTemplate26; slots: PageSlot26[]; publishedAt?: Date };
function pageWordCount(page: Page26): number {
  return page.slots.reduce((sum, slot) => {
    if (slot.slotType === "text") return sum + slot.content.split(/\s+/).length;
    return sum;
  }, 0);
}

// 27. Nested union for compiled output descriptors
type TypeOutput27 =
  | { output: "primitive"; ts: "string" | "number" | "boolean" | "null" | "undefined" }
  | { output: "literal"; value: string | number | boolean }
  | { output: "array"; element: TypeOutput27 }
  | { output: "tuple"; elements: TypeOutput27[] }
  | { output: "object"; fields: Record<string, { type: TypeOutput27; optional: boolean }> }
  | { output: "union"; members: TypeOutput27[] }
  | { output: "reference"; name: string; typeArgs?: TypeOutput27[] };
function typeToString(t: TypeOutput27): string {
  switch (t.output) {
    case "primitive": return t.ts;
    case "literal": return JSON.stringify(t.value);
    case "array": return `${typeToString(t.element)}[]`;
    case "tuple": return `[${t.elements.map(typeToString).join(", ")}]`;
    case "object": return `{ ${Object.entries(t.fields).map(([k, v]) => `${k}${v.optional ? "?" : ""}: ${typeToString(v.type)}`).join("; ")} }`;
    case "union": return t.members.map(typeToString).join(" | ");
    case "reference": return `${t.name}${t.typeArgs ? `<${t.typeArgs.map(typeToString).join(", ")}>` : ""}`;
  }
}

// 28. Union for observability signal types
type TraceContext28 = { traceId: string; spanId: string; parentSpanId?: string; sampled: boolean };
type MetricValue28 = { metricType: "counter"; delta: number } | { metricType: "gauge"; value: number } | { metricType: "histogram"; value: number; buckets: number[] };
type LogLevel28 = "debug" | "info" | "warn" | "error" | "fatal";
type Signal28 =
  | { signalType: "trace"; context: TraceContext28; name: string; startMs: number; endMs: number; status: "ok" | "error" | "unset" }
  | { signalType: "metric"; name: string; value: MetricValue28; labels: Record<string, string> }
  | { signalType: "log"; level: LogLevel28; message: string; trace?: TraceContext28; fields: Record<string, unknown> };
function signalKey(s: Signal28): string {
  switch (s.signalType) {
    case "trace": return `trace:${s.context.traceId}/${s.context.spanId}`;
    case "metric": return `metric:${s.name}`;
    case "log": return `log:${s.level}`;
  }
}

// 29. Union for complex authorization context
type Principal29 =
  | { principalType: "user"; userId: string; roles: string[] }
  | { principalType: "service"; serviceId: string; scopes: string[] }
  | { principalType: "anonymous" };
type AuthContext29 = {
  principal: Principal29;
  request: { method: string; path: string; ip: string };
  token?: { iat: number; exp: number; iss: string };
};
type AuthzDecision29 =
  | { allowed: true; principal: Principal29 }
  | { allowed: false; reason: string; principal: Principal29; errorCode: 401 | 403 };
function authorize(ctx: AuthContext29, requiredRole: string): AuthzDecision29 {
  if (ctx.principal.principalType === "anonymous") return { allowed: false, reason: "Not authenticated", principal: ctx.principal, errorCode: 401 };
  if (ctx.principal.principalType === "user" && ctx.principal.roles.includes(requiredRole)) return { allowed: true, principal: ctx.principal };
  return { allowed: false, reason: "Insufficient permissions", principal: ctx.principal, errorCode: 403 };
}

// 30. Union for reactive store state with nested slices
type AuthSlice30 = { auth: { state: "unauthenticated" } | { state: "authenticating" } | { state: "authenticated"; user: { id: string; name: string }; token: string } };
type DataSlice30<T> = { data: { state: "empty" } | { state: "loading" } | { state: "loaded"; items: T[]; total: number } | { state: "error"; message: string } };
type UiSlice30 = { ui: { modal: { open: false } | { open: true; type: string; props: Record<string, unknown> }; sidebar: boolean; theme: "light" | "dark" } };
type AppState30 = AuthSlice30 & DataSlice30<{ id: string; name: string }> & UiSlice30;
function isUserAuthenticated(state: AppState30): boolean {
  return state.auth.state === "authenticated";
}
function getModalType(state: AppState30): string | null {
  return state.ui.modal.open ? state.ui.modal.type : null;
}

// 31. Protocol buffer style union with field numbers
type ProtoField31 =
  | { fieldNumber: number; fieldType: "string"; value: string }
  | { fieldNumber: number; fieldType: "int32"; value: number }
  | { fieldNumber: number; fieldType: "bool"; value: boolean }
  | { fieldNumber: number; fieldType: "bytes"; value: Uint8Array }
  | { fieldNumber: number; fieldType: "message"; value: ProtoField31[] };
function protoFieldSize(f: ProtoField31): number {
  switch (f.fieldType) {
    case "string": return f.value.length + 4;
    case "int32": return 4;
    case "bool": return 1;
    case "bytes": return f.value.byteLength + 4;
    case "message": return f.value.reduce((sum, child) => sum + protoFieldSize(child), 0) + 4;
  }
}

// 32. Nested union for event subscription management
type SubscriptionFilter32 =
  | { filterType: "all" }
  | { filterType: "topic"; topics: string[] }
  | { filterType: "tag"; tags: string[] }
  | { filterType: "composite"; operator: "and" | "or"; filters: SubscriptionFilter32[] };
type DeliveryConfig32 =
  | { delivery: "immediate" }
  | { delivery: "batched"; windowMs: number; maxSize: number }
  | { delivery: "scheduled"; cronExpression: string };
type Subscription32 = {
  id: string;
  subscriber: string;
  filter: SubscriptionFilter32;
  delivery: DeliveryConfig32;
  active: boolean;
};
function filterDescription(f: SubscriptionFilter32): string {
  switch (f.filterType) {
    case "all": return "all events";
    case "topic": return `topics: ${f.topics.join(", ")}`;
    case "tag": return `tags: ${f.tags.join(", ")}`;
    case "composite": return `(${f.filters.map(filterDescription).join(` ${f.operator} `)})`;
  }
}

// 33. Union for type-safe builder output descriptors
type BuildOutput33 =
  | { outputType: "library"; name: string; formats: ("cjs" | "esm" | "umd")[]; types: boolean }
  | { outputType: "application"; entryPoint: string; chunks: boolean; sourceMaps: boolean }
  | { outputType: "worker"; entryPoint: string; target: "browser" | "node" };
type BuildConfig33 = {
  input: { source: string; tsConfig?: string };
  outputs: BuildOutput33[];
  plugins: string[];
  minify: boolean;
};
function buildOutputDescription(o: BuildOutput33): string {
  switch (o.outputType) {
    case "library": return `lib: ${o.name} (${o.formats.join(",")})${o.types ? " +types" : ""}`;
    case "application": return `app: ${o.entryPoint}${o.chunks ? " +chunks" : ""}`;
    case "worker": return `worker: ${o.entryPoint} (${o.target})`;
  }
}

// 34. Deeply nested union for API gateway routing rules
type MatchRule34 =
  | { matchType: "path"; path: string; exact: boolean }
  | { matchType: "header"; name: string; value: string }
  | { matchType: "query"; param: string; value: string }
  | { matchType: "method"; methods: string[] }
  | { matchType: "and"; rules: MatchRule34[] }
  | { matchType: "or"; rules: MatchRule34[] };
type UpstreamTarget34 = { host: string; port: number; weight?: number } | { serviceId: string; weight?: number };
type RouteAction34 =
  | { action: "proxy"; targets: UpstreamTarget34[]; lb: "round_robin" | "least_conn" | "ip_hash" }
  | { action: "redirect"; location: string; statusCode: 301 | 302 }
  | { action: "response"; statusCode: number; body: string; headers?: Record<string, string> };
type GatewayRoute34 = { routeId: string; match: MatchRule34; action: RouteAction34; priority: number };
function matchRuleDescription(m: MatchRule34): string {
  switch (m.matchType) {
    case "path": return `path ${m.exact ? "=" : "~"} "${m.path}"`;
    case "header": return `header ${m.name}: ${m.value}`;
    case "query": return `?${m.param}=${m.value}`;
    case "method": return `method in [${m.methods.join(",")}]`;
    case "and": return `(${m.rules.map(matchRuleDescription).join(" AND ")})`;
    case "or": return `(${m.rules.map(matchRuleDescription).join(" OR ")})`;
  }
}

// 35. Union for state-machine event logging
type MachineTransition35<States extends string, Events extends string> = {
  from: States;
  to: States;
  event: Events;
  guard?: string;
  actions: string[];
};
type MachineHistory35<States extends string, Events extends string> =
  | { kind: "initial"; state: States; enteredAt: Date }
  | { kind: "transition"; transition: MachineTransition35<States, Events>; enteredAt: Date; duration: number }
  | { kind: "error"; state: States; error: string; at: Date };
type CheckoutMachine35 = MachineHistory35<"cart" | "payment" | "confirm" | "done" | "cancelled", "proceed" | "pay" | "confirm" | "cancel">;
function historyEntry(h: CheckoutMachine35): string {
  switch (h.kind) {
    case "initial": return `Initial: ${h.state}`;
    case "transition": return `${h.transition.from} → [${h.transition.event}] → ${h.transition.to} (${h.duration}ms)`;
    case "error": return `Error in ${h.state}: ${h.error}`;
  }
}

// 36. Union for multi-tenant resource resolution
type TenantContext36 = { tenantId: string; plan: "free" | "pro" | "enterprise" };
type ResourceRef36 =
  | { refType: "global"; resourceId: string }
  | { refType: "tenant_scoped"; tenant: TenantContext36; resourceId: string }
  | { refType: "user_scoped"; tenant: TenantContext36; userId: string; resourceId: string }
  | { refType: "inherited"; parent: ResourceRef36; resourceId: string };
function resolveResourcePath(ref: ResourceRef36): string {
  switch (ref.refType) {
    case "global": return `/global/${ref.resourceId}`;
    case "tenant_scoped": return `/tenants/${ref.tenant.tenantId}/${ref.resourceId}`;
    case "user_scoped": return `/tenants/${ref.tenant.tenantId}/users/${ref.userId}/${ref.resourceId}`;
    case "inherited": return `${resolveResourcePath(ref.parent)}/${ref.resourceId}`;
  }
}

// 37. Discriminated union for real-time collaboration events
type CollabUserEvent37 = { userEvent: "joined"; userId: string; name: string; color: string } | { userEvent: "left"; userId: string } | { userEvent: "cursor_moved"; userId: string; position: { line: number; col: number } };
type CollabDocEvent37 =
  | { docEvent: "insert"; position: number; text: string; authorId: string }
  | { docEvent: "delete"; position: number; length: number; authorId: string }
  | { docEvent: "format"; range: { start: number; end: number }; attrs: Record<string, unknown>; authorId: string };
type CollabEvent37 = { sessionId: string; timestamp: number } & ({ domain: "user" } & CollabUserEvent37 | { domain: "doc" } & CollabDocEvent37);
function collabDescription(e: CollabEvent37): string {
  if (e.domain === "user") {
    if (e.userEvent === "joined") return `${e.name} joined`;
    if (e.userEvent === "left") return `User ${e.userId} left`;
    return `User ${e.userId} moved cursor`;
  }
  return `Doc: ${e.docEvent} by ${e.authorId}`;
}

// 38. Union for game entity behaviors
type PhysicsBody38 = { physics: "static"; friction: number } | { physics: "dynamic"; mass: number; velocity: { x: number; y: number } } | { physics: "kinematic"; speed: number };
type RenderSpec38 = { render: "sprite"; spriteId: string; layer: number } | { render: "mesh"; meshId: string; material: string } | { render: "particles"; emitterId: string; rate: number };
type Collider38 = { collider: "circle"; radius: number } | { collider: "rect"; w: number; h: number } | { collider: "polygon"; points: { x: number; y: number }[] };
type GameEntity38 = { entityId: string; position: { x: number; y: number }; physics: PhysicsBody38; render: RenderSpec38; collider?: Collider38 };
function entityDescription(e: GameEntity38): string {
  return `Entity ${e.entityId}: ${e.render.render} @ (${e.position.x},${e.position.y}), physics: ${e.physics.physics}`;
}

// 39. Union for search query DSL
type FullTextQuery39 = { queryType: "match"; field: string; text: string; fuzziness?: number } | { queryType: "phrase"; field: string; phrase: string } | { queryType: "wildcard"; field: string; pattern: string };
type TermQuery39 = { queryType: "term"; field: string; value: unknown } | { queryType: "range"; field: string; gte?: unknown; lte?: unknown } | { queryType: "exists"; field: string };
type BoolQuery39 = { queryType: "bool"; must?: SearchQuery39[]; should?: SearchQuery39[]; mustNot?: SearchQuery39[]; filter?: SearchQuery39[] };
type SearchQuery39 = FullTextQuery39 | TermQuery39 | BoolQuery39;
function queryToString(q: SearchQuery39): string {
  switch (q.queryType) {
    case "match": return `${q.field} MATCH "${q.text}"`;
    case "phrase": return `${q.field} PHRASE "${q.phrase}"`;
    case "wildcard": return `${q.field} LIKE "${q.pattern}"`;
    case "term": return `${q.field} = ${JSON.stringify(q.value)}`;
    case "range": return `${q.field} BETWEEN ${q.gte} AND ${q.lte}`;
    case "exists": return `EXISTS(${q.field})`;
    case "bool": return `BOOL(must:${q.must?.length ?? 0},should:${q.should?.length ?? 0})`;
  }
}

// 40. Nested union for subscription lifecycle
type TrialState40 = { trialState: "active"; endsAt: Date; daysLeft: number } | { trialState: "expired"; expiredAt: Date } | { trialState: "converted"; convertedAt: Date };
type BillingState40 = { billingState: "current"; nextBillingDate: Date; amount: number } | { billingState: "past_due"; daysPastDue: number; amount: number } | { billingState: "cancelled"; cancelledAt: Date; accessUntil: Date };
type SubscriptionState40 =
  | { phase: "trial"; trial: TrialState40 }
  | { phase: "active"; billing: BillingState40 }
  | { phase: "paused"; billing: BillingState40; pausedAt: Date; resumeAt?: Date }
  | { phase: "terminated"; reason: string; terminatedAt: Date };
function subscriptionHealth(s: SubscriptionState40): "good" | "warning" | "critical" {
  if (s.phase === "terminated") return "critical";
  if (s.phase === "trial") return s.trial.trialState === "expired" ? "warning" : "good";
  if (s.phase === "active" || s.phase === "paused") {
    return s.billing.billingState === "past_due" ? "critical" : s.billing.billingState === "cancelled" ? "warning" : "good";
  }
  return "good";
}

// 41. Union for type-safe CDN cache configuration
type CacheControl41 = { cacheability: "no_store" } | { cacheability: "no_cache" } | { cacheability: "public" | "private"; maxAge: number; sMaxAge?: number; staleWhileRevalidate?: number };
type EdgeBehavior41 = { edge: "bypass" } | { edge: "cache"; cacheControl: CacheControl41; varyOn: string[] } | { edge: "shield"; shieldPop: string; cache: CacheControl41 };
function cacheHeader(c: CacheControl41): string {
  if (c.cacheability === "no_store") return "no-store";
  if (c.cacheability === "no_cache") return "no-cache";
  return `${c.cacheability}, max-age=${c.maxAge}${c.sMaxAge ? `, s-maxage=${c.sMaxAge}` : ""}${c.staleWhileRevalidate ? `, stale-while-revalidate=${c.staleWhileRevalidate}` : ""}`;
}

// 42. Nested union for SaaS customer journey stages
type TrialJourney = { journeyStage: "trial" } & TrialState40;
type OnboardingJourney = { journeyStage: "onboarding"; onboardingStep: "profile" | "integration" | "team" | "complete"; completedSteps: string[] };
type ActiveJourney = { journeyStage: "active"; healthScore: number; lastActiveAt: Date; usageRatio: number };
type AtRiskJourney = { journeyStage: "at_risk"; riskScore: number; reasons: string[]; interventionAt?: Date };
type ChurnedJourney = { journeyStage: "churned"; churnedAt: Date; reason: string; feedback?: string };
type CustomerJourney = TrialJourney | OnboardingJourney | ActiveJourney | AtRiskJourney | ChurnedJourney;
function journeyDescription(j: CustomerJourney): string {
  switch (j.journeyStage) {
    case "trial": return `Trial: ${j.trialState}`;
    case "onboarding": return `Onboarding: ${j.onboardingStep} (${j.completedSteps.length} done)`;
    case "active": return `Active: health ${j.healthScore}%, usage ${Math.round(j.usageRatio * 100)}%`;
    case "at_risk": return `At risk (score: ${j.riskScore}): ${j.reasons.join(", ")}`;
    case "churned": return `Churned: ${j.reason}`;
  }
}

// 43. Nested union for build system output descriptors
type OutputBundle43 =
  | { bundleType: "js"; minified: boolean; sourcemap: boolean; gzipSize: number }
  | { bundleType: "css"; scoped: boolean; autoprefixed: boolean }
  | { bundleType: "asset"; assetType: "image" | "font" | "other"; optimized: boolean };
type BuildResult43 =
  | { resultType: "success"; bundles: OutputBundle43[]; buildTime: number; warnings: string[] }
  | { resultType: "warning"; bundles: OutputBundle43[]; buildTime: number; warnings: string[] }
  | { resultType: "error"; errors: string[]; partialBundles?: OutputBundle43[] };
function buildSummary(r: BuildResult43): string {
  switch (r.resultType) {
    case "success": return `Build OK in ${r.buildTime}ms, ${r.bundles.length} bundles, ${r.warnings.length} warnings`;
    case "warning": return `Build with ${r.warnings.length} warnings in ${r.buildTime}ms`;
    case "error": return `Build FAILED: ${r.errors.length} errors`;
  }
}

// 44. Union for multi-layered caching strategy
type L1Cache44 = { layer: "l1_memory"; maxItems: number; ttlMs: number };
type L2Cache44 = { layer: "l2_redis"; host: string; ttlMs: number; compress: boolean };
type L3Cache44 = { layer: "l3_cdn"; cdnUrl: string; ttlMs: number; varyOn: string[] };
type CacheStrategy44 =
  | { strategy: "none" }
  | { strategy: "single"; cache: L1Cache44 | L2Cache44 | L3Cache44 }
  | { strategy: "cascade"; layers: (L1Cache44 | L2Cache44 | L3Cache44)[]; writeThrough: boolean }
  | { strategy: "bypass"; reason: string };
function strategyDescription(s: CacheStrategy44): string {
  switch (s.strategy) {
    case "none": return "No caching";
    case "single": return `Single: ${s.cache.layer}`;
    case "cascade": return `Cascade: ${s.layers.map(l => l.layer).join(" → ")}${s.writeThrough ? " (write-through)" : ""}`;
    case "bypass": return `Bypass: ${s.reason}`;
  }
}

// 45. Union for nested financial instrument types
type EquityInstrument = { assetClass: "equity" } & ({ instrumentType: "stock"; ticker: string; exchange: string } | { instrumentType: "etf"; ticker: string; underlying: string[] } | { instrumentType: "option"; underlying: string; strike: number; expiry: Date; kind: "call" | "put" });
type FixedIncomeInstrument = { assetClass: "fixed_income" } & ({ instrumentType: "bond"; issuer: string; coupon: number; maturity: Date } | { instrumentType: "bill"; term: number; yield: number });
type FinancialInstrument = EquityInstrument | FixedIncomeInstrument;
function instrumentSymbol(i: FinancialInstrument): string {
  if (i.assetClass === "equity") {
    if (i.instrumentType === "option") return `${i.underlying}-${i.kind.toUpperCase()}-${i.strike}`;
    return i.ticker;
  }
  if (i.instrumentType === "bond") return `${i.issuer}-${i.coupon}%-BOND`;
  return `T-BILL-${i.term}D`;
}

// 46. Union for type-safe webhook retry policies
type BackoffStrategy46 = { backoffType: "constant"; intervalMs: number } | { backoffType: "linear"; initialMs: number; incrementMs: number } | { backoffType: "exponential"; initialMs: number; multiplier: number; maxMs: number };
type RetryPolicy46 = { maxAttempts: number; backoff: BackoffStrategy46; retryOn: (500 | 502 | 503 | 429)[] };
type WebhookConfig46 = {
  url: string;
  secret?: string;
  events: string[];
  retryPolicy: RetryPolicy46;
  timeout: number;
};
function retryDelay(policy: RetryPolicy46, attempt: number): number {
  const b = policy.backoff;
  if (b.backoffType === "constant") return b.intervalMs;
  if (b.backoffType === "linear") return b.initialMs + b.incrementMs * attempt;
  return Math.min(b.initialMs * (b.multiplier ** attempt), b.maxMs);
}

// 47. Union for nested API pagination strategies
type OffsetPagination47 = { strategy: "offset"; page: number; pageSize: number };
type CursorPagination47 = { strategy: "cursor"; cursor?: string; limit: number; direction: "forward" | "backward" };
type KeysetPagination47 = { strategy: "keyset"; lastId?: string; lastValue?: unknown; limit: number; sortField: string };
type PaginationStrategy47 = OffsetPagination47 | CursorPagination47 | KeysetPagination47;
type PagedRequest47<T> = { filter?: T; pagination: PaginationStrategy47; sort?: { field: string; dir: "asc" | "desc" } };
function paginationDescription(p: PaginationStrategy47): string {
  switch (p.strategy) {
    case "offset": return `page ${p.page}/${p.pageSize}`;
    case "cursor": return `cursor ${p.cursor ?? "start"}, limit ${p.limit}`;
    case "keyset": return `keyset after ${p.lastId ?? "start"}, limit ${p.limit}`;
  }
}

// 48. Union for deployment environment manifests
type K8sTarget48 = { platform: "k8s"; namespace: string; cluster: string; replicas: number; resources: { cpu: string; memory: string } };
type LambdaTarget48 = { platform: "lambda"; region: string; memory: number; timeout: number; runtime: string };
type EcsTarget48 = { platform: "ecs"; cluster: string; service: string; cpu: number; memory: number };
type DeployTarget48 = K8sTarget48 | LambdaTarget48 | EcsTarget48;
type DeployManifest48 = {
  app: string;
  version: string;
  environments: Record<"dev" | "staging" | "prod", DeployTarget48>;
};
function targetCost(t: DeployTarget48): string {
  if (t.platform === "k8s") return `${t.replicas} pods`;
  if (t.platform === "lambda") return `${t.memory}MB serverless`;
  return `${t.cpu}vCPU/${t.memory}MB on ECS`;
}

// 49. Union for distributed transaction protocol
type XaVote49 = { vote: "commit" } | { vote: "abort"; reason: string };
type XaState49 =
  | { phase: "init"; coordinatorId: string; participants: string[] }
  | { phase: "prepare"; votes: Record<string, XaVote49>; timeout: Date }
  | { phase: "commit"; commitRecord: string; committed: string[] }
  | { phase: "abort"; reason: string; rolledBack: string[] }
  | { phase: "complete"; outcome: "committed" | "aborted"; completedAt: Date };
function xaProgress(state: XaState49): number {
  switch (state.phase) {
    case "init": return 0;
    case "prepare": return 33;
    case "commit": return 66;
    case "abort": return 66;
    case "complete": return 100;
  }
}

// 50. Deeply nested union for ML model registry
type ModelArchitecture50 =
  | { arch: "transformer"; layers: number; heads: number; hiddenSize: number }
  | { arch: "cnn"; layers: number; filters: number[]; pooling: "max" | "avg" }
  | { arch: "rnn"; cellType: "lstm" | "gru"; hiddenSize: number; bidirectional: boolean };
type TrainingStatus50 =
  | { status: "pending" }
  | { status: "training"; epoch: number; totalEpochs: number; loss: number; val_loss: number }
  | { status: "completed"; bestEpoch: number; finalLoss: number; metrics: Record<string, number> }
  | { status: "failed"; error: string };
type ModelDeployment50 = { deploymentType: "online"; endpoint: string; replicas: number } | { deploymentType: "batch"; schedule: string; maxInstances: number } | { deploymentType: "edge"; device: string; quantized: boolean };
type ModelEntry50 = { modelId: string; name: string; version: string; task: string; architecture: ModelArchitecture50; trainingStatus: TrainingStatus50; deployment?: ModelDeployment50 };
function modelSummary(m: ModelEntry50): string {
  const arch = m.architecture.arch;
  const trainStatus = m.trainingStatus.status;
  const deploy = m.deployment ? ` → ${m.deployment.deploymentType}` : "";
  return `${m.name} v${m.version} (${arch}): ${trainStatus}${deploy}`;
}
