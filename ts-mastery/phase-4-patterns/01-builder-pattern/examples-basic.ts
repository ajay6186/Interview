export {};

// ── Basic Builder Pattern Examples ────────────────────────────────────────────

// 1. Simple query builder
class QueryBuilder {
  private table = "";
  private conditions: string[] = [];
  from(t: string): this { this.table = t; return this; }
  where(c: string): this { this.conditions.push(c); return this; }
  build(): string { return `SELECT * FROM ${this.table}${this.conditions.length ? " WHERE " + this.conditions.join(" AND ") : ""}`; }
}
const q1 = new QueryBuilder().from("users").where("age > 18").where("active = true").build();

// 2. Pizza builder
class Pizza {
  size = "medium"; crust = "thin"; toppings: string[] = [];
}
class PizzaBuilder {
  private pizza = new Pizza();
  size(s: string): this { this.pizza.size = s; return this; }
  crust(c: string): this { this.pizza.crust = c; return this; }
  topping(t: string): this { this.pizza.toppings.push(t); return this; }
  build(): Pizza { return this.pizza; }
}
const pizza = new PizzaBuilder().size("large").crust("thick").topping("cheese").topping("olives").build();

// 3. HTTP request builder
class RequestBuilder {
  private method = "GET";
  private url = "";
  private headers: Record<string, string> = {};
  private body?: string;
  setMethod(m: string): this { this.method = m; return this; }
  setUrl(u: string): this { this.url = u; return this; }
  setHeader(k: string, v: string): this { this.headers[k] = v; return this; }
  setBody(b: string): this { this.body = b; return this; }
  build() { return { method: this.method, url: this.url, headers: this.headers, body: this.body }; }
}
const req = new RequestBuilder()
  .setMethod("POST").setUrl("/api/users")
  .setHeader("Content-Type", "application/json")
  .setBody(JSON.stringify({ name: "Alice" })).build();

// 4. User builder
class User { constructor(public name: string, public email: string, public role: string = "user", public age?: number) {} }
class UserBuilder {
  private name = ""; private email = ""; private role = "user"; private age?: number;
  withName(n: string): this { this.name = n; return this; }
  withEmail(e: string): this { this.email = e; return this; }
  withRole(r: string): this { this.role = r; return this; }
  withAge(a: number): this { this.age = a; return this; }
  build(): User { return new User(this.name, this.email, this.role, this.age); }
}
const user = new UserBuilder().withName("Bob").withEmail("bob@example.com").withRole("admin").build();

// 5. Form builder
class FormBuilder {
  private fields: { name: string; type: string; required: boolean }[] = [];
  addField(name: string, type: string, required = false): this {
    this.fields.push({ name, type, required }); return this;
  }
  build() { return { fields: this.fields }; }
}
const form = new FormBuilder()
  .addField("name", "text", true)
  .addField("email", "email", true)
  .addField("bio", "textarea").build();

// 6. Email builder
class Email {
  to = ""; subject = ""; body = ""; cc: string[] = [];
}
class EmailBuilder {
  private email = new Email();
  to(addr: string): this { this.email.to = addr; return this; }
  subject(s: string): this { this.email.subject = s; return this; }
  body(b: string): this { this.email.body = b; return this; }
  cc(addr: string): this { this.email.cc.push(addr); return this; }
  build(): Email { return this.email; }
}
const email = new EmailBuilder().to("alice@example.com").subject("Hello").body("Hi there!").build();

// 7. Configuration builder
class AppConfig { host = "localhost"; port = 3000; debug = false; maxConnections = 10; }
class ConfigBuilder {
  private config = new AppConfig();
  host(h: string): this { this.config.host = h; return this; }
  port(p: number): this { this.config.port = p; return this; }
  debug(d: boolean): this { this.config.debug = d; return this; }
  maxConnections(m: number): this { this.config.maxConnections = m; return this; }
  build(): AppConfig { return this.config; }
}
const config = new ConfigBuilder().host("prod.example.com").port(8080).debug(false).build();

// 8. CSS class builder
class ClassBuilder {
  private classes: string[] = [];
  add(cls: string): this { this.classes.push(cls); return this; }
  addIf(cls: string, cond: boolean): this { if (cond) this.classes.push(cls); return this; }
  build(): string { return this.classes.join(" "); }
}
const cls = new ClassBuilder().add("btn").add("btn-primary").addIf("disabled", false).build();

// 9. URL builder
class URLBuilder {
  private protocol = "https";
  private host = "";
  private path = "";
  private params: Record<string, string> = {};
  withProtocol(p: string): this { this.protocol = p; return this; }
  withHost(h: string): this { this.host = h; return this; }
  withPath(p: string): this { this.path = p; return this; }
  withParam(k: string, v: string): this { this.params[k] = v; return this; }
  build(): string {
    const qs = Object.entries(this.params).map(([k, v]) => `${k}=${v}`).join("&");
    return `${this.protocol}://${this.host}${this.path}${qs ? "?" + qs : ""}`;
  }
}
const url = new URLBuilder().withHost("api.example.com").withPath("/users").withParam("page", "1").build();

// 10. Notification builder
class Notification { title = ""; message = ""; type: "info" | "warn" | "error" = "info"; }
class NotificationBuilder {
  private n = new Notification();
  title(t: string): this { this.n.title = t; return this; }
  message(m: string): this { this.n.message = m; return this; }
  type(t: "info" | "warn" | "error"): this { this.n.type = t; return this; }
  build(): Notification { return this.n; }
}
const notif = new NotificationBuilder().title("Success").message("User created").type("info").build();

// 11. DOM element builder
class ElementBuilder {
  private tag: string;
  private attrs: Record<string, string> = {};
  private children: string[] = [];
  private text = "";
  constructor(tag: string) { this.tag = tag; }
  attr(k: string, v: string): this { this.attrs[k] = v; return this; }
  child(c: string): this { this.children.push(c); return this; }
  content(t: string): this { this.text = t; return this; }
  build(): string {
    const attrStr = Object.entries(this.attrs).map(([k, v]) => ` ${k}="${v}"`).join("");
    const inner = this.text || this.children.join("");
    return `<${this.tag}${attrStr}>${inner}</${this.tag}>`;
  }
}
const div = new ElementBuilder("div").attr("class", "container").content("Hello").build();

// 12. Test fixture builder
class UserFixture { id = ""; name = ""; email = ""; createdAt = new Date(); }
class UserFixtureBuilder {
  private fixture = new UserFixture();
  id(id: string): this { this.fixture.id = id; return this; }
  name(n: string): this { this.fixture.name = n; return this; }
  email(e: string): this { this.fixture.email = e; return this; }
  createdAt(d: Date): this { this.fixture.createdAt = d; return this; }
  build(): UserFixture { return this.fixture; }
}
const fixture = new UserFixtureBuilder().id("1").name("Alice").email("alice@test.com").build();

// 13. Pipeline step builder
class PipelineBuilder<T> {
  private steps: ((val: T) => T)[] = [];
  addStep(fn: (val: T) => T): this { this.steps.push(fn); return this; }
  build(): (input: T) => T {
    return (input: T) => this.steps.reduce((acc, fn) => fn(acc), input);
  }
}
const pipeline = new PipelineBuilder<number>()
  .addStep(x => x * 2).addStep(x => x + 10).addStep(x => Math.round(x)).build();

// 14. Report builder
class ReportBuilder {
  private title = "";
  private sections: { heading: string; content: string }[] = [];
  withTitle(t: string): this { this.title = t; return this; }
  addSection(heading: string, content: string): this { this.sections.push({ heading, content }); return this; }
  build() { return { title: this.title, sections: this.sections }; }
}
const report = new ReportBuilder().withTitle("Q4 Report").addSection("Revenue", "...").build();

// 15. Graph builder
class GraphBuilder<T> {
  private nodes: T[] = [];
  private edges: [T, T][] = [];
  addNode(n: T): this { this.nodes.push(n); return this; }
  addEdge(from: T, to: T): this { this.edges.push([from, to]); return this; }
  build() { return { nodes: this.nodes, edges: this.edges }; }
}
const graph = new GraphBuilder<string>().addNode("A").addNode("B").addEdge("A", "B").build();

// 16. Validation builder
class ValidationBuilder<T> {
  private rules: ((val: T) => string | null)[] = [];
  addRule(rule: (val: T) => string | null): this { this.rules.push(rule); return this; }
  build() {
    return (val: T): string[] => this.rules.map(r => r(val)).filter((e): e is string => e !== null);
  }
}
const validateAge = new ValidationBuilder<number>()
  .addRule(n => n < 0 ? "Must be positive" : null)
  .addRule(n => n > 150 ? "Too high" : null).build();

// 17. Logger builder
class Logger { private prefix = ""; private level = "info"; }
class LoggerBuilder {
  private logger = new Logger();
  private prefix = "";
  private level = "info";
  withPrefix(p: string): this { this.prefix = p; return this; }
  withLevel(l: string): this { this.level = l; return this; }
  build() {
    const p = this.prefix; const l = this.level;
    return { log: (msg: string) => console.log(`[${l}] ${p}: ${msg}`) };
  }
}
const logger = new LoggerBuilder().withPrefix("App").withLevel("debug").build();

// 18. Table builder
class TableBuilder {
  private headers: string[] = [];
  private rows: string[][] = [];
  addHeader(h: string): this { this.headers.push(h); return this; }
  addRow(row: string[]): this { this.rows.push(row); return this; }
  build() { return { headers: this.headers, rows: this.rows }; }
}
const table = new TableBuilder().addHeader("Name").addHeader("Age").addRow(["Alice", "30"]).build();

// 19. Date range builder
class DateRangeBuilder {
  private start = new Date();
  private end = new Date();
  from(d: Date): this { this.start = d; return this; }
  to(d: Date): this { this.end = d; return this; }
  build() { return { start: this.start, end: this.end, days: Math.round((this.end.getTime() - this.start.getTime()) / 86400000) }; }
}
const range = new DateRangeBuilder().from(new Date("2024-01-01")).to(new Date("2024-12-31")).build();

// 20. Permission set builder
class PermissionBuilder {
  private perms: Set<string> = new Set();
  allow(perm: string): this { this.perms.add(perm); return this; }
  deny(perm: string): this { this.perms.delete(perm); return this; }
  build() { return { permissions: [...this.perms], has: (p: string) => this.perms.has(p) }; }
}
const perms = new PermissionBuilder().allow("read").allow("write").deny("delete").build();

// 21. API client builder
class ApiClientBuilder {
  private baseUrl = "";
  private timeout = 5000;
  private authToken?: string;
  withBaseUrl(url: string): this { this.baseUrl = url; return this; }
  withTimeout(ms: number): this { this.timeout = ms; return this; }
  withAuth(token: string): this { this.authToken = token; return this; }
  build() {
    const { baseUrl, timeout, authToken } = this;
    return {
      get: (path: string) => fetch(`${baseUrl}${path}`, { signal: AbortSignal.timeout(timeout), headers: authToken ? { Authorization: `Bearer ${authToken}` } : {} })
    };
  }
}
const client = new ApiClientBuilder().withBaseUrl("https://api.example.com").withTimeout(3000).build();

// 22. Animation builder
class AnimationBuilder {
  private duration = 300;
  private easing = "ease-in-out";
  private properties: Record<string, string> = {};
  withDuration(ms: number): this { this.duration = ms; return this; }
  withEasing(e: string): this { this.easing = e; return this; }
  animate(prop: string, val: string): this { this.properties[prop] = val; return this; }
  build() { return { duration: this.duration, easing: this.easing, properties: this.properties }; }
}
const anim = new AnimationBuilder().withDuration(500).animate("opacity", "1").animate("transform", "translateY(0)").build();

// 23. Cron job builder
class CronBuilder {
  private minute = "*"; private hour = "*"; private day = "*"; private month = "*"; private weekday = "*";
  atMinute(m: number): this { this.minute = String(m); return this; }
  atHour(h: number): this { this.hour = String(h); return this; }
  onDay(d: number): this { this.day = String(d); return this; }
  build(): string { return `${this.minute} ${this.hour} ${this.day} ${this.month} ${this.weekday}`; }
}
const cron = new CronBuilder().atMinute(0).atHour(12).build(); // "0 12 * * *"

// 24. Test suite builder
class TestSuiteBuilder {
  private name = "";
  private tests: { name: string; fn: () => void }[] = [];
  suite(name: string): this { this.name = name; return this; }
  test(name: string, fn: () => void): this { this.tests.push({ name, fn }); return this; }
  build() { return { name: this.name, run: () => this.tests.forEach(t => { try { t.fn(); console.log(`✓ ${t.name}`); } catch (e) { console.error(`✗ ${t.name}`); } }) }; }
}
const suite = new TestSuiteBuilder().suite("Math").test("adds", () => { if (1 + 1 !== 2) throw new Error(); }).build();

// 25. Regex builder
class RegexBuilder {
  private pattern = "";
  private flags = "";
  literal(s: string): this { this.pattern += s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); return this; }
  digit(): this { this.pattern += "\\d"; return this; }
  word(): this { this.pattern += "\\w"; return this; }
  oneOrMore(): this { this.pattern += "+"; return this; }
  zeroOrMore(): this { this.pattern += "*"; return this; }
  optional(): this { this.pattern += "?"; return this; }
  global(): this { this.flags += "g"; return this; }
  build(): RegExp { return new RegExp(this.pattern, this.flags); }
}
const re = new RegexBuilder().word().oneOrMore().literal("@").word().oneOrMore().build();

// 26. Pagination builder
class PaginationBuilder {
  private page = 1; private pageSize = 10; private total = 0;
  currentPage(p: number): this { this.page = p; return this; }
  withPageSize(s: number): this { this.pageSize = s; return this; }
  withTotal(t: number): this { this.total = t; return this; }
  build() {
    const totalPages = Math.ceil(this.total / this.pageSize);
    return { page: this.page, pageSize: this.pageSize, total: this.total, totalPages, offset: (this.page - 1) * this.pageSize };
  }
}
const page = new PaginationBuilder().currentPage(2).withPageSize(20).withTotal(100).build();

// 27. Middleware chain builder
class MiddlewareBuilder<Ctx> {
  private fns: ((ctx: Ctx, next: () => void) => void)[] = [];
  use(fn: (ctx: Ctx, next: () => void) => void): this { this.fns.push(fn); return this; }
  build() {
    return (ctx: Ctx) => {
      let i = 0;
      const next = () => { const fn = this.fns[i++]; if (fn) fn(ctx, next); };
      next();
    };
  }
}
const chain = new MiddlewareBuilder<{ user?: string }>()
  .use((ctx, next) => { console.log("before"); next(); console.log("after"); })
  .build();

// 28. Schema builder
class SchemaBuilder {
  private schema: Record<string, { type: string; required: boolean }> = {};
  field(name: string, type: string, required = false): this { this.schema[name] = { type, required }; return this; }
  build() { return this.schema; }
}
const schema = new SchemaBuilder().field("name", "string", true).field("age", "number").build();

// 29. Feature flag builder
class FeatureFlagBuilder {
  private flags: Record<string, boolean> = {};
  enable(feature: string): this { this.flags[feature] = true; return this; }
  disable(feature: string): this { this.flags[feature] = false; return this; }
  build() { return { isEnabled: (f: string) => this.flags[f] ?? false }; }
}
const flags = new FeatureFlagBuilder().enable("darkMode").disable("newUI").build();

// 30. Cart builder
class CartBuilder {
  private items: { id: string; name: string; price: number; qty: number }[] = [];
  addItem(id: string, name: string, price: number, qty = 1): this {
    this.items.push({ id, name, price, qty }); return this;
  }
  build() {
    const total = this.items.reduce((sum, i) => sum + i.price * i.qty, 0);
    return { items: this.items, total, itemCount: this.items.reduce((sum, i) => sum + i.qty, 0) };
  }
}
const cart = new CartBuilder().addItem("p1", "Widget", 9.99, 2).addItem("p2", "Gadget", 29.99).build();

// 31. Connection string builder
class ConnectionStringBuilder {
  private driver = "postgresql";
  private host = "localhost";
  private port = 5432;
  private database = "";
  private user = "";
  private password = "";
  withDriver(d: string): this { this.driver = d; return this; }
  withHost(h: string): this { this.host = h; return this; }
  withDatabase(db: string): this { this.database = db; return this; }
  withCredentials(user: string, password: string): this { this.user = user; this.password = password; return this; }
  build(): string { return `${this.driver}://${this.user}:${this.password}@${this.host}:${this.port}/${this.database}`; }
}
const connStr = new ConnectionStringBuilder().withHost("db.example.com").withDatabase("myapp").withCredentials("admin", "secret").build();

// 32. Theme builder
class ThemeBuilder {
  private colors: Record<string, string> = {};
  private fonts: Record<string, string> = {};
  color(name: string, value: string): this { this.colors[name] = value; return this; }
  font(name: string, value: string): this { this.fonts[name] = value; return this; }
  build() { return { colors: this.colors, fonts: this.fonts }; }
}
const theme = new ThemeBuilder().color("primary", "#007bff").color("danger", "#dc3545").font("body", "sans-serif").build();

// 33. Mock server builder
class MockServerBuilder {
  private routes: { method: string; path: string; response: any }[] = [];
  get(path: string, response: any): this { this.routes.push({ method: "GET", path, response }); return this; }
  post(path: string, response: any): this { this.routes.push({ method: "POST", path, response }); return this; }
  build() {
    return { handle: (method: string, path: string) => this.routes.find(r => r.method === method && r.path === path)?.response };
  }
}
const mock = new MockServerBuilder().get("/users", []).post("/users", { id: "1" }).build();

// 34. Event emitter builder
class EventEmitterBuilder<Events extends string> {
  private handlers: Partial<Record<Events, ((data: any) => void)[]>> = {};
  on(event: Events, fn: (data: any) => void): this { (this.handlers[event] ??= []).push(fn); return this; }
  build() {
    return { emit: (event: Events, data: any) => this.handlers[event]?.forEach(fn => fn(data)) };
  }
}
const emitter = new EventEmitterBuilder<"login" | "logout">()
  .on("login", d => console.log("login", d)).build();

// 35. Address builder
class AddressBuilder {
  private street = ""; private city = ""; private state = ""; private zip = ""; private country = "US";
  withStreet(s: string): this { this.street = s; return this; }
  withCity(c: string): this { this.city = c; return this; }
  withState(s: string): this { this.state = s; return this; }
  withZip(z: string): this { this.zip = z; return this; }
  withCountry(c: string): this { this.country = c; return this; }
  build() { return { street: this.street, city: this.city, state: this.state, zip: this.zip, country: this.country }; }
}
const addr = new AddressBuilder().withStreet("123 Main St").withCity("Springfield").withState("IL").withZip("62701").build();

// 36. CSV builder
class CSVBuilder {
  private headers: string[] = [];
  private rows: (string | number)[][] = [];
  addHeader(...headers: string[]): this { this.headers.push(...headers); return this; }
  addRow(...values: (string | number)[]): this { this.rows.push(values); return this; }
  build(): string {
    return [this.headers.join(","), ...this.rows.map(r => r.join(","))].join("\n");
  }
}
const csv = new CSVBuilder().addHeader("Name", "Age", "Email").addRow("Alice", 30, "alice@example.com").build();

// 37. Role builder
class RoleBuilder {
  private name = "";
  private permissions: string[] = [];
  withName(n: string): this { this.name = n; return this; }
  withPermission(p: string): this { this.permissions.push(p); return this; }
  build() { return { name: this.name, permissions: this.permissions, can: (p: string) => this.permissions.includes(p) }; }
}
const adminRole = new RoleBuilder().withName("admin").withPermission("read").withPermission("write").withPermission("delete").build();

// 38. Server builder
class ServerBuilder {
  private port = 3000; private hostname = "localhost"; private cors = false;
  withPort(p: number): this { this.port = p; return this; }
  withHostname(h: string): this { this.hostname = h; return this; }
  withCors(): this { this.cors = true; return this; }
  build() { return { port: this.port, hostname: this.hostname, cors: this.cors, start: () => console.log(`Server at ${this.hostname}:${this.port}`) }; }
}
const server = new ServerBuilder().withPort(8080).withCors().build();

// 39. Retry policy builder
class RetryBuilder {
  private maxAttempts = 3; private delayMs = 1000; private backoff = false;
  attempts(n: number): this { this.maxAttempts = n; return this; }
  delay(ms: number): this { this.delayMs = ms; return this; }
  withExponentialBackoff(): this { this.backoff = true; return this; }
  build() {
    return async <T>(fn: () => Promise<T>): Promise<T> => {
      for (let i = 0; i < this.maxAttempts; i++) {
        try { return await fn(); } catch (e) {
          if (i === this.maxAttempts - 1) throw e;
          await new Promise(r => setTimeout(r, this.backoff ? this.delayMs * 2 ** i : this.delayMs));
        }
      }
      throw new Error("unreachable");
    };
  }
}
const retry = new RetryBuilder().attempts(5).delay(500).withExponentialBackoff().build();

// 40. Prompt builder
class PromptBuilder {
  private context = "";
  private instructions: string[] = [];
  private examples: { input: string; output: string }[] = [];
  withContext(c: string): this { this.context = c; return this; }
  addInstruction(i: string): this { this.instructions.push(i); return this; }
  addExample(input: string, output: string): this { this.examples.push({ input, output }); return this; }
  build(): string {
    return [
      this.context,
      ...this.instructions.map(i => `- ${i}`),
      ...this.examples.map(e => `Input: ${e.input}\nOutput: ${e.output}`)
    ].filter(Boolean).join("\n");
  }
}
const prompt = new PromptBuilder().withContext("You are an assistant.").addInstruction("Be concise.").build();

// 41. Test data factory builder
class DataFactoryBuilder<T extends Record<string, any>> {
  private defaults: Partial<T> = {};
  withDefault<K extends keyof T>(key: K, val: T[K]): this { this.defaults[key] = val; return this; }
  build(): (overrides?: Partial<T>) => T {
    return (overrides = {}) => ({ ...this.defaults, ...overrides } as T);
  }
}
const makeUser2 = new DataFactoryBuilder<{ name: string; role: string }>()
  .withDefault("role", "user").build();

// 42. Card builder (UI component)
class CardBuilder {
  private title = "";
  private body = "";
  private footer = "";
  private imageUrl?: string;
  withTitle(t: string): this { this.title = t; return this; }
  withBody(b: string): this { this.body = b; return this; }
  withFooter(f: string): this { this.footer = f; return this; }
  withImage(url: string): this { this.imageUrl = url; return this; }
  build() { return { title: this.title, body: this.body, footer: this.footer, imageUrl: this.imageUrl }; }
}
const card = new CardBuilder().withTitle("Welcome").withBody("Hello, world!").build();

// 43. Batch operation builder
class BatchBuilder<T> {
  private items: T[] = [];
  private batchSize = 10;
  add(item: T): this { this.items.push(item); return this; }
  withBatchSize(n: number): this { this.batchSize = n; return this; }
  build(): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < this.items.length; i += this.batchSize)
      batches.push(this.items.slice(i, i + this.batchSize));
    return batches;
  }
}
const batches = new BatchBuilder<number>().withBatchSize(3).add(1).add(2).add(3).add(4).add(5).build();

// 44. Webhook builder
class WebhookBuilder {
  private url = "";
  private events: string[] = [];
  private secret?: string;
  withUrl(u: string): this { this.url = u; return this; }
  onEvent(e: string): this { this.events.push(e); return this; }
  withSecret(s: string): this { this.secret = s; return this; }
  build() { return { url: this.url, events: this.events, secret: this.secret }; }
}
const webhook = new WebhookBuilder().withUrl("https://example.com/hook").onEvent("user.created").onEvent("user.deleted").build();

// 45. Transform pipeline builder
class TransformBuilder<T, U = T> {
  private transforms: ((val: any) => any)[] = [];
  pipe<V>(fn: (val: U) => V): TransformBuilder<T, V> {
    const next = new TransformBuilder<T, V>();
    (next as any).transforms = [...this.transforms, fn];
    return next;
  }
  run(input: T): U {
    return this.transforms.reduce((acc, fn) => fn(acc), input) as U;
  }
}
const transform = new TransformBuilder<string>()
  .pipe(s => s.trim()).pipe(s => s.toUpperCase()).pipe(s => s.split("").reverse().join(""));

// 46. Dependency injection container builder
class ContainerBuilder {
  private services: Map<string, () => any> = new Map();
  register<T>(name: string, factory: () => T): this { this.services.set(name, factory); return this; }
  build() {
    return { get: <T>(name: string): T => this.services.get(name)?.() as T };
  }
}
const container = new ContainerBuilder()
  .register("logger", () => ({ log: console.log }))
  .register("config", () => ({ env: "development" })).build();

// 47. Subscription plan builder
class PlanBuilder {
  private name = "";
  private price = 0;
  private features: string[] = [];
  private billingCycle: "monthly" | "annual" = "monthly";
  withName(n: string): this { this.name = n; return this; }
  withPrice(p: number): this { this.price = p; return this; }
  withFeature(f: string): this { this.features.push(f); return this; }
  annual(): this { this.billingCycle = "annual"; return this; }
  build() { return { name: this.name, price: this.price, features: this.features, billingCycle: this.billingCycle }; }
}
const plan = new PlanBuilder().withName("Pro").withPrice(29.99).withFeature("Unlimited access").annual().build();

// 48. Snapshot builder
class SnapshotBuilder<T> {
  private state: T;
  private version = 0;
  constructor(initial: T) { this.state = initial; }
  update(fn: (s: T) => T): this { this.state = fn(this.state); this.version++; return this; }
  build() { return { state: this.state, version: this.version, timestamp: new Date() }; }
}
const snapshot = new SnapshotBuilder({ count: 0 }).update(s => ({ count: s.count + 1 })).build();

// 49. Order builder
class OrderBuilder {
  private items: { product: string; qty: number; price: number }[] = [];
  private discount = 0;
  private shippingAddress = "";
  addItem(product: string, qty: number, price: number): this { this.items.push({ product, qty, price }); return this; }
  withDiscount(pct: number): this { this.discount = pct; return this; }
  shipTo(address: string): this { this.shippingAddress = address; return this; }
  build() {
    const subtotal = this.items.reduce((s, i) => s + i.qty * i.price, 0);
    const total = subtotal * (1 - this.discount / 100);
    return { items: this.items, subtotal, total, shippingAddress: this.shippingAddress };
  }
}
const order = new OrderBuilder().addItem("Widget", 2, 9.99).addItem("Gadget", 1, 49.99).withDiscount(10).shipTo("123 Main St").build();

// 50. Complete typed fluent interface
interface SearchOptions { query: string; page: number; pageSize: number; sort: string; filters: Record<string, string[]> }
class SearchBuilder {
  private opts: SearchOptions = { query: "", page: 1, pageSize: 10, sort: "", filters: {} };
  query(q: string): this { this.opts.query = q; return this; }
  page(p: number): this { this.opts.page = p; return this; }
  pageSize(ps: number): this { this.opts.pageSize = ps; return this; }
  sort(field: string, dir: "asc" | "desc" = "asc"): this { this.opts.sort = `${field}:${dir}`; return this; }
  filter(key: string, values: string[]): this { this.opts.filters[key] = values; return this; }
  build(): SearchOptions { return { ...this.opts, filters: { ...this.opts.filters } }; }
}
const search = new SearchBuilder().query("TypeScript").page(2).pageSize(20).sort("relevance", "desc").filter("tag", ["ts", "types"]).build();
