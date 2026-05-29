export {};

// ============================================================
// NESTED EXAMPLES — Builder Pattern (50 Examples)
// ============================================================

// 1. Builder that returns a nested builder — address inside a user builder
class NestedAddressBuilder {
  private street = ""; private city = ""; private zip = ""; private country = "US";
  withStreet(s: string): this { this.street = s; return this; }
  withCity(c: string): this { this.city = c; return this; }
  withZip(z: string): this { this.zip = z; return this; }
  withCountry(c: string): this { this.country = c; return this; }
  build() { return { street: this.street, city: this.city, zip: this.zip, country: this.country }; }
}
class NestedUserBuilder {
  private name = ""; private email = "";
  private address?: ReturnType<NestedAddressBuilder["build"]>;
  withName(n: string): this { this.name = n; return this; }
  withEmail(e: string): this { this.email = e; return this; }
  withAddress(fn: (b: NestedAddressBuilder) => NestedAddressBuilder): this {
    this.address = fn(new NestedAddressBuilder()).build(); return this;
  }
  build() { return { name: this.name, email: this.email, address: this.address }; }
}
const nestedUser = new NestedUserBuilder()
  .withName("Alice").withEmail("alice@example.com")
  .withAddress(a => a.withStreet("123 Main St").withCity("Springfield").withZip("62701")).build();

// 2. Step builder — typed state machine: Name → Email → Role → build()
type WithNameState = { _name: true };
type WithEmailState = { _email: true };
type WithRoleState = { _role: true };
type FullUserState = WithNameState & WithEmailState & WithRoleState;
class UserStateMachineBuilder<State = {}> {
  private data: Record<string, unknown> = {};
  withName(n: string): UserStateMachineBuilder<State & WithNameState> {
    this.data["name"] = n; return this as any;
  }
  withEmail(e: string): UserStateMachineBuilder<State & WithEmailState> {
    this.data["email"] = e; return this as any;
  }
  withRole(r: string): UserStateMachineBuilder<State & WithRoleState> {
    this.data["role"] = r; return this as any;
  }
  build(this: UserStateMachineBuilder<FullUserState>): { name: string; email: string; role: string } {
    return this.data as any;
  }
}
const stateMachineUser = new UserStateMachineBuilder()
  .withName("Bob").withEmail("bob@example.com").withRole("admin").build();

// 3. Builder that produces another builder — factory of builders
class FilterBuilder {
  private conditions: string[] = [];
  where(field: string, op: string, val: unknown): this {
    this.conditions.push(`${field} ${op} ${JSON.stringify(val)}`); return this;
  }
  build() { return { conditions: this.conditions, toSQL: () => this.conditions.join(" AND ") }; }
}
class QueryBuilderFactory {
  static forTable(table: string) {
    return new class {
      private filterBuilder = new FilterBuilder();
      private orderField = "";
      private limitVal?: number;
      filter(fn: (f: FilterBuilder) => FilterBuilder): this { fn(this.filterBuilder); return this; }
      orderBy(field: string): this { this.orderField = field; return this; }
      limit(n: number): this { this.limitVal = n; return this; }
      build() {
        const filter = this.filterBuilder.build();
        return { table, filter: filter.conditions, order: this.orderField, limit: this.limitVal };
      }
    };
  }
}
const query = QueryBuilderFactory.forTable("users")
  .filter(f => f.where("active", "=", true).where("age", ">", 18))
  .orderBy("name").limit(10).build();

// 4. Nested configuration with sub-builders for database, cache, and logging
class DatabaseConfigBuilder {
  private host = "localhost"; private port = 5432; private name = "app";
  withHost(h: string): this { this.host = h; return this; }
  withPort(p: number): this { this.port = p; return this; }
  withName(n: string): this { this.name = n; return this; }
  build() { return { host: this.host, port: this.port, name: this.name }; }
}
class CacheConfigBuilder {
  private host = "localhost"; private port = 6379; private ttl = 300;
  withHost(h: string): this { this.host = h; return this; }
  withPort(p: number): this { this.port = p; return this; }
  withTtl(s: number): this { this.ttl = s; return this; }
  build() { return { host: this.host, port: this.port, ttl: this.ttl }; }
}
class AppConfigBuilder2 {
  private db?: ReturnType<DatabaseConfigBuilder["build"]>;
  private cache?: ReturnType<CacheConfigBuilder["build"]>;
  private env: "dev" | "prod" = "dev";
  database(fn: (b: DatabaseConfigBuilder) => DatabaseConfigBuilder): this {
    this.db = fn(new DatabaseConfigBuilder()).build(); return this;
  }
  cacheLayer(fn: (b: CacheConfigBuilder) => CacheConfigBuilder): this {
    this.cache = fn(new CacheConfigBuilder()).build(); return this;
  }
  environment(e: "dev" | "prod"): this { this.env = e; return this; }
  build() { return { db: this.db, cache: this.cache, env: this.env }; }
}
const appConfig = new AppConfigBuilder2()
  .environment("prod")
  .database(db => db.withHost("db.prod.example.com").withName("myapp_prod"))
  .cacheLayer(c => c.withHost("redis.prod.example.com").withTtl(600))
  .build();

// 5. Nested form group builder — sections containing fields
interface FormField { name: string; type: string; required: boolean; defaultValue?: string }
interface FormSection { title: string; fields: FormField[] }
class FormFieldBuilder {
  private field: FormField = { name: "", type: "text", required: false };
  withName(n: string): this { this.field.name = n; return this; }
  ofType(t: string): this { this.field.type = t; return this; }
  required(): this { this.field.required = true; return this; }
  withDefault(v: string): this { this.field.defaultValue = v; return this; }
  build(): FormField { return { ...this.field }; }
}
class FormSectionBuilder {
  private section: FormSection = { title: "", fields: [] };
  withTitle(t: string): this { this.section.title = t; return this; }
  addField(fn: (b: FormFieldBuilder) => FormFieldBuilder): this {
    this.section.fields.push(fn(new FormFieldBuilder()).build()); return this;
  }
  build(): FormSection { return { ...this.section, fields: [...this.section.fields] }; }
}
class FormBuilder2 {
  private sections: FormSection[] = [];
  addSection(fn: (b: FormSectionBuilder) => FormSectionBuilder): this {
    this.sections.push(fn(new FormSectionBuilder()).build()); return this;
  }
  build() { return { sections: this.sections }; }
}
const registrationForm = new FormBuilder2()
  .addSection(s => s.withTitle("Personal Info")
    .addField(f => f.withName("firstName").required())
    .addField(f => f.withName("lastName").required()))
  .addSection(s => s.withTitle("Account")
    .addField(f => f.withName("email").ofType("email").required())
    .addField(f => f.withName("password").ofType("password").required())).build();

// 6. Nested menu builder with sub-menus
interface MenuItem { label: string; href?: string; children: MenuItem[] }
class MenuItemBuilder {
  private item: MenuItem = { label: "", children: [] };
  withLabel(l: string): this { this.item.label = l; return this; }
  withHref(h: string): this { this.item.href = h; return this; }
  addChild(fn: (b: MenuItemBuilder) => MenuItemBuilder): this {
    this.item.children.push(fn(new MenuItemBuilder()).build()); return this;
  }
  build(): MenuItem { return { ...this.item, children: [...this.item.children] }; }
}
class MenuBuilder {
  private items: MenuItem[] = [];
  addItem(fn: (b: MenuItemBuilder) => MenuItemBuilder): this {
    this.items.push(fn(new MenuItemBuilder()).build()); return this;
  }
  build() { return { items: this.items }; }
}
const navMenu = new MenuBuilder()
  .addItem(i => i.withLabel("Products").withHref("/products")
    .addChild(c => c.withLabel("Software").withHref("/products/software"))
    .addChild(c => c.withLabel("Hardware").withHref("/products/hardware")))
  .addItem(i => i.withLabel("About").withHref("/about")).build();

// 7. HTTP pipeline builder — middleware wraps another middleware
type HttpMiddleware<Ctx> = (ctx: Ctx, next: () => Promise<void>) => Promise<void>;
class HttpPipelineBuilder<Ctx> {
  private stack: HttpMiddleware<Ctx>[] = [];
  use(mw: HttpMiddleware<Ctx>): this { this.stack.push(mw); return this; }
  useLogger(): this {
    return this.use(async (ctx, next) => { console.log("start", ctx); await next(); console.log("end", ctx); });
  }
  useErrorHandler(): this {
    return this.use(async (ctx, next) => { try { await next(); } catch (e) { console.error("Error", e, ctx); } });
  }
  build(): (ctx: Ctx) => Promise<void> {
    const stack = this.stack;
    return (ctx: Ctx) => {
      let i = 0;
      const dispatch = (): Promise<void> => {
        const mw = stack[i++];
        if (!mw) return Promise.resolve();
        return mw(ctx, dispatch);
      };
      return dispatch();
    };
  }
}
const httpPipeline = new HttpPipelineBuilder<{ path: string; userId?: string }>()
  .useErrorHandler()
  .useLogger()
  .use(async (ctx, next) => { ctx.userId = "user_123"; await next(); })
  .build();

// 8. Rule builder that nests other rule builders
type Rule<T> = (val: T) => string | null;
class StringRuleBuilder {
  private rules: Rule<string>[] = [];
  minLength(n: number): this { this.rules.push(s => s.length < n ? `Min ${n} chars` : null); return this; }
  maxLength(n: number): this { this.rules.push(s => s.length > n ? `Max ${n} chars` : null); return this; }
  matches(re: RegExp, msg: string): this { this.rules.push(s => re.test(s) ? null : msg); return this; }
  build(): Rule<string> { return s => { for (const r of this.rules) { const e = r(s); if (e) return e; } return null; }; }
}
class NumberRuleBuilder {
  private rules: Rule<number>[] = [];
  min(n: number): this { this.rules.push(v => v < n ? `Min ${n}` : null); return this; }
  max(n: number): this { this.rules.push(v => v > n ? `Max ${n}` : null); return this; }
  integer(): this { this.rules.push(v => Number.isInteger(v) ? null : "Must be integer"); return this; }
  build(): Rule<number> { return v => { for (const r of this.rules) { const e = r(v); if (e) return e; } return null; }; }
}
class FormValidatorBuilder<T extends Record<string, unknown>> {
  private fieldRules: { [K in keyof T]?: Rule<T[K]> } = {};
  field<K extends keyof T>(k: K, rule: Rule<T[K]>): this { this.fieldRules[k] = rule; return this; }
  build(): (val: T) => Partial<Record<keyof T, string>> {
    const rules = this.fieldRules;
    return (val: T) => {
      const errors: Partial<Record<keyof T, string>> = {};
      for (const [k, rule] of Object.entries(rules)) {
        const err = (rule as Rule<any>)(val[k as keyof T]);
        if (err) errors[k as keyof T] = err;
      }
      return errors;
    };
  }
}
const validate = new FormValidatorBuilder<{ username: string; age: number }>()
  .field("username", new StringRuleBuilder().minLength(3).maxLength(20).build())
  .field("age", new NumberRuleBuilder().min(0).max(120).integer().build())
  .build();
const errors = validate({ username: "al", age: 25 });

// 9. Nested builder with parent back-reference (parent/child relationship)
class OrderItemBuilder {
  private item = { product: "", qty: 1, price: 0 };
  private parent: OrderNestedBuilder;
  constructor(parent: OrderNestedBuilder) { this.parent = parent; }
  product(p: string): this { this.item.product = p; return this; }
  qty(q: number): this { this.item.qty = q; return this; }
  price(p: number): this { this.item.price = p; return this; }
  done(): OrderNestedBuilder { this.parent._addItem(this.item); return this.parent; }
}
class OrderNestedBuilder {
  private items: { product: string; qty: number; price: number }[] = [];
  private customerId = "";
  forCustomer(id: string): this { this.customerId = id; return this; }
  addItem(): OrderItemBuilder { return new OrderItemBuilder(this); }
  _addItem(item: { product: string; qty: number; price: number }): void { this.items.push(item); }
  build() {
    const total = this.items.reduce((s, i) => s + i.qty * i.price, 0);
    return { customerId: this.customerId, items: this.items, total };
  }
}
const nestedOrder = new OrderNestedBuilder()
  .forCustomer("cust_001")
  .addItem().product("Widget").qty(2).price(9.99).done()
  .addItem().product("Gadget").qty(1).price(49.99).done()
  .build();

// 10. Report builder with nested section and chart builders
interface ChartSpec { type: "bar" | "line" | "pie"; title: string; data: number[] }
interface ReportSection { heading: string; content: string; chart?: ChartSpec }
class ChartBuilder {
  private spec: ChartSpec = { type: "bar", title: "", data: [] };
  ofType(t: ChartSpec["type"]): this { this.spec.type = t; return this; }
  withTitle(t: string): this { this.spec.title = t; return this; }
  withData(d: number[]): this { this.spec.data = d; return this; }
  build(): ChartSpec { return { ...this.spec }; }
}
class ReportSectionBuilder {
  private section: ReportSection = { heading: "", content: "" };
  withHeading(h: string): this { this.section.heading = h; return this; }
  withContent(c: string): this { this.section.content = c; return this; }
  withChart(fn: (b: ChartBuilder) => ChartBuilder): this {
    this.section.chart = fn(new ChartBuilder()).build(); return this;
  }
  build(): ReportSection { return { ...this.section }; }
}
class ReportBuilder2 {
  private title = ""; private sections: ReportSection[] = [];
  withTitle(t: string): this { this.title = t; return this; }
  addSection(fn: (b: ReportSectionBuilder) => ReportSectionBuilder): this {
    this.sections.push(fn(new ReportSectionBuilder()).build()); return this;
  }
  build() { return { title: this.title, sections: this.sections }; }
}
const report = new ReportBuilder2()
  .withTitle("Q4 Analytics")
  .addSection(s => s.withHeading("Revenue")
    .withContent("Revenue grew 15% YoY")
    .withChart(c => c.ofType("line").withTitle("Monthly Revenue").withData([10, 15, 12, 18, 22])))
  .addSection(s => s.withHeading("Users").withContent("MAU reached 50k")).build();

// 11. Multi-level tree builder with depth tracking
type TreeNodeNested<T> = { value: T; depth: number; children: TreeNodeNested<T>[] };
class TreeBuilderNested<T> {
  private node: TreeNodeNested<T>;
  constructor(value: T, private depth = 0) { this.node = { value, depth, children: [] }; }
  addChild(value: T, fn?: (b: TreeBuilderNested<T>) => TreeBuilderNested<T>): this {
    const child = new TreeBuilderNested<T>(value, this.depth + 1);
    if (fn) fn(child);
    this.node.children.push(child.build()); return this;
  }
  build(): TreeNodeNested<T> { return { ...this.node, children: [...this.node.children] }; }
}
const orgChart = new TreeBuilderNested("CEO")
  .addChild("CTO", b => b.addChild("Engineering Lead", b2 => b2.addChild("Dev 1").addChild("Dev 2")))
  .addChild("CFO", b => b.addChild("Finance Lead")).build();

// 12. Workflow builder — steps that contain sub-steps
interface WorkflowStep { name: string; parallel: boolean; tasks: string[] }
class WorkflowStepBuilder {
  private step: WorkflowStep = { name: "", parallel: false, tasks: [] };
  withName(n: string): this { this.step.name = n; return this; }
  parallel(): this { this.step.parallel = true; return this; }
  addTask(t: string): this { this.step.tasks.push(t); return this; }
  build(): WorkflowStep { return { ...this.step, tasks: [...this.step.tasks] }; }
}
class WorkflowBuilder {
  private steps: WorkflowStep[] = [];
  addStep(fn: (b: WorkflowStepBuilder) => WorkflowStepBuilder): this {
    this.steps.push(fn(new WorkflowStepBuilder()).build()); return this;
  }
  build() { return { steps: this.steps, stepCount: this.steps.length }; }
}
const ciPipeline = new WorkflowBuilder()
  .addStep(s => s.withName("Install").addTask("npm install").addTask("download deps"))
  .addStep(s => s.withName("Test").parallel().addTask("unit tests").addTask("lint").addTask("type-check"))
  .addStep(s => s.withName("Deploy").addTask("build").addTask("push to registry")).build();

// 13. Permission policy builder with nested resource/action pairs
type Action = "read" | "write" | "delete" | "admin";
interface PolicyRule { resource: string; actions: Action[]; conditions: string[] }
class PolicyRuleBuilder {
  private rule: PolicyRule = { resource: "", actions: [], conditions: [] };
  onResource(r: string): this { this.rule.resource = r; return this; }
  allow(...actions: Action[]): this { this.rule.actions.push(...actions); return this; }
  when(condition: string): this { this.rule.conditions.push(condition); return this; }
  build(): PolicyRule { return { ...this.rule }; }
}
class PolicyBuilder {
  private rules: PolicyRule[] = [];
  private name = "";
  withName(n: string): this { this.name = n; return this; }
  addRule(fn: (b: PolicyRuleBuilder) => PolicyRuleBuilder): this {
    this.rules.push(fn(new PolicyRuleBuilder()).build()); return this;
  }
  build() { return { name: this.name, rules: this.rules }; }
}
const adminPolicy = new PolicyBuilder()
  .withName("AdminPolicy")
  .addRule(r => r.onResource("users").allow("read", "write", "delete").when("user.role === 'admin'"))
  .addRule(r => r.onResource("billing").allow("read").when("user.role === 'admin'")).build();

// 14. Docker compose builder with nested service builders
interface ServiceSpec { image: string; ports: string[]; env: Record<string, string>; volumes: string[] }
class ServiceBuilder {
  private spec: ServiceSpec = { image: "", ports: [], env: {}, volumes: [] };
  withImage(img: string): this { this.spec.image = img; return this; }
  exposePort(host: number, container: number): this { this.spec.ports.push(`${host}:${container}`); return this; }
  withEnv(key: string, val: string): this { this.spec.env[key] = val; return this; }
  withVolume(v: string): this { this.spec.volumes.push(v); return this; }
  build(): ServiceSpec { return { ...this.spec, ports: [...this.spec.ports], volumes: [...this.spec.volumes], env: { ...this.spec.env } }; }
}
class ComposeBuilder {
  private services: Record<string, ServiceSpec> = {};
  addService(name: string, fn: (b: ServiceBuilder) => ServiceBuilder): this {
    this.services[name] = fn(new ServiceBuilder()).build(); return this;
  }
  build() { return { version: "3.8", services: this.services }; }
}
const compose = new ComposeBuilder()
  .addService("web", s => s.withImage("node:20").exposePort(3000, 3000).withEnv("NODE_ENV", "production"))
  .addService("db", s => s.withImage("postgres:15").exposePort(5432, 5432).withEnv("POSTGRES_DB", "app").withVolume("pgdata:/var/lib/postgresql/data"))
  .build();

// 15. Test scenario builder — scenario contains test cases that contain assertions
interface Assertion { description: string; expected: unknown; actual: unknown }
interface TestCase { name: string; assertions: Assertion[] }
interface TestScenario { scenario: string; cases: TestCase[] }
class AssertionBuilder {
  private a: Assertion = { description: "", expected: null, actual: null };
  checks(d: string): this { this.a.description = d; return this; }
  expects(e: unknown): this { this.a.expected = e; return this; }
  against(actual: unknown): this { this.a.actual = actual; return this; }
  build(): Assertion { return { ...this.a }; }
}
class TestCaseBuilder {
  private tc: TestCase = { name: "", assertions: [] };
  withName(n: string): this { this.tc.name = n; return this; }
  addAssertion(fn: (b: AssertionBuilder) => AssertionBuilder): this {
    this.tc.assertions.push(fn(new AssertionBuilder()).build()); return this;
  }
  build(): TestCase { return { ...this.tc, assertions: [...this.tc.assertions] }; }
}
class TestScenarioBuilder {
  private ts: TestScenario = { scenario: "", cases: [] };
  describing(s: string): this { this.ts.scenario = s; return this; }
  addCase(fn: (b: TestCaseBuilder) => TestCaseBuilder): this {
    this.ts.cases.push(fn(new TestCaseBuilder()).build()); return this;
  }
  build(): TestScenario { return { ...this.ts, cases: [...this.ts.cases] }; }
}
const loginScenario = new TestScenarioBuilder()
  .describing("User login")
  .addCase(c => c.withName("valid credentials")
    .addAssertion(a => a.checks("status code").expects(200).against(200))
    .addAssertion(a => a.checks("has token").expects(true).against(true)))
  .addCase(c => c.withName("invalid password")
    .addAssertion(a => a.checks("status code").expects(401).against(401))).build();

// 16. Email template builder with nested section and attachment builders
interface EmailAttachment { filename: string; contentType: string; size: number }
interface EmailSection { role: "header" | "body" | "footer"; content: string }
class AttachmentBuilder {
  private att: EmailAttachment = { filename: "", contentType: "application/octet-stream", size: 0 };
  withFilename(f: string): this { this.att.filename = f; return this; }
  withContentType(ct: string): this { this.att.contentType = ct; return this; }
  withSize(s: number): this { this.att.size = s; return this; }
  build(): EmailAttachment { return { ...this.att }; }
}
class EmailSectionBuilder {
  private sec: EmailSection = { role: "body", content: "" };
  asRole(r: EmailSection["role"]): this { this.sec.role = r; return this; }
  withContent(c: string): this { this.sec.content = c; return this; }
  build(): EmailSection { return { ...this.sec }; }
}
class EmailTemplateBuilder {
  private to = ""; private subject = "";
  private sections: EmailSection[] = [];
  private attachments: EmailAttachment[] = [];
  to2(addr: string): this { this.to = addr; return this; }
  withSubject(s: string): this { this.subject = s; return this; }
  addSection(fn: (b: EmailSectionBuilder) => EmailSectionBuilder): this {
    this.sections.push(fn(new EmailSectionBuilder()).build()); return this;
  }
  attach(fn: (b: AttachmentBuilder) => AttachmentBuilder): this {
    this.attachments.push(fn(new AttachmentBuilder()).build()); return this;
  }
  build() { return { to: this.to, subject: this.subject, sections: this.sections, attachments: this.attachments }; }
}
const emailTemplate = new EmailTemplateBuilder()
  .to2("user@example.com").withSubject("Your Invoice")
  .addSection(s => s.asRole("header").withContent("Invoice #1234"))
  .addSection(s => s.asRole("body").withContent("Thank you for your purchase."))
  .attach(a => a.withFilename("invoice.pdf").withContentType("application/pdf").withSize(102400)).build();

// 17. GraphQL query builder with nested field selection
interface GqlField { name: string; args: Record<string, unknown>; subFields: GqlField[] }
class GqlFieldBuilder {
  private field: GqlField = { name: "", args: {}, subFields: [] };
  named(n: string): this { this.field.name = n; return this; }
  arg(k: string, v: unknown): this { this.field.args[k] = v; return this; }
  select(fn: (b: GqlFieldBuilder) => GqlFieldBuilder): this {
    this.field.subFields.push(fn(new GqlFieldBuilder()).build()); return this;
  }
  build(): GqlField { return { ...this.field, subFields: [...this.field.subFields] }; }
}
class GqlQueryBuilder {
  private operation = "query"; private operationName = "";
  private fields: GqlField[] = [];
  asQuery(): this { this.operation = "query"; return this; }
  asMutation(): this { this.operation = "mutation"; return this; }
  named(n: string): this { this.operationName = n; return this; }
  select(fn: (b: GqlFieldBuilder) => GqlFieldBuilder): this {
    this.fields.push(fn(new GqlFieldBuilder()).build()); return this;
  }
  build() { return { operation: this.operation, operationName: this.operationName, fields: this.fields }; }
}
const gqlQuery = new GqlQueryBuilder()
  .asQuery().named("GetUser")
  .select(f => f.named("user").arg("id", "123")
    .select(sf => sf.named("id"))
    .select(sf => sf.named("name"))
    .select(sf => sf.named("posts").arg("limit", 5)
      .select(pf => pf.named("title"))
      .select(pf => pf.named("createdAt")))).build();

// 18. Nested state machine builder
type State18 = "idle" | "loading" | "success" | "error";
type Transition18 = { from: State18; to: State18; on: string; guard?: () => boolean };
class TransitionBuilder18 {
  private t: Partial<Transition18> = {};
  from(s: State18): this { this.t.from = s; return this; }
  to(s: State18): this { this.t.to = s; return this; }
  on(event: string): this { this.t.on = event; return this; }
  guard(fn: () => boolean): this { this.t.guard = fn; return this; }
  build(): Transition18 { return this.t as Transition18; }
}
class StateMachineBuilder18 {
  private initial: State18 = "idle";
  private transitions: Transition18[] = [];
  withInitial(s: State18): this { this.initial = s; return this; }
  addTransition(fn: (b: TransitionBuilder18) => TransitionBuilder18): this {
    this.transitions.push(fn(new TransitionBuilder18()).build()); return this;
  }
  build() {
    const tmap = this.transitions;
    return {
      initial: this.initial,
      transitions: tmap,
      can: (from: State18, event: string) => tmap.some(t => t.from === from && t.on === event && (t.guard?.() ?? true))
    };
  }
}
const fsm = new StateMachineBuilder18()
  .withInitial("idle")
  .addTransition(t => t.from("idle").to("loading").on("FETCH"))
  .addTransition(t => t.from("loading").to("success").on("RESOLVE"))
  .addTransition(t => t.from("loading").to("error").on("REJECT"))
  .addTransition(t => t.from("error").to("idle").on("RESET")).build();

// 19. Nested UI layout builder — layouts containing rows containing columns
interface ColumnSpec { width: number; content: string }
interface RowSpec { columns: ColumnSpec[] }
interface LayoutSpec { rows: RowSpec[]; gutter: number }
class ColumnBuilder {
  private col: ColumnSpec = { width: 12, content: "" };
  span(w: number): this { this.col.width = w; return this; }
  content(c: string): this { this.col.content = c; return this; }
  build(): ColumnSpec { return { ...this.col }; }
}
class RowBuilder {
  private row: RowSpec = { columns: [] };
  addColumn(fn: (b: ColumnBuilder) => ColumnBuilder): this {
    this.row.columns.push(fn(new ColumnBuilder()).build()); return this;
  }
  build(): RowSpec { return { columns: [...this.row.columns] }; }
}
class LayoutBuilder {
  private layout: LayoutSpec = { rows: [], gutter: 16 };
  withGutter(g: number): this { this.layout.gutter = g; return this; }
  addRow(fn: (b: RowBuilder) => RowBuilder): this {
    this.layout.rows.push(fn(new RowBuilder()).build()); return this;
  }
  build(): LayoutSpec { return { ...this.layout, rows: [...this.layout.rows] }; }
}
const pageLayout = new LayoutBuilder()
  .withGutter(24)
  .addRow(r => r.addColumn(c => c.span(8).content("Sidebar")).addColumn(c => c.span(16).content("Main")))
  .addRow(r => r.addColumn(c => c.span(12).content("Left")).addColumn(c => c.span(12).content("Right"))).build();

// 20. Chained specification builder — building a reusable spec object
type Spec<T> = (val: T) => boolean;
class SpecBuilder<T> {
  constructor(private spec: Spec<T>) {}
  and(other: Spec<T>): SpecBuilder<T> { return new SpecBuilder<T>(v => this.spec(v) && other(v)); }
  or(other: Spec<T>): SpecBuilder<T> { return new SpecBuilder<T>(v => this.spec(v) || other(v)); }
  not(): SpecBuilder<T> { return new SpecBuilder<T>(v => !this.spec(v)); }
  build(): Spec<T> { return this.spec; }
}
const isAdult = new SpecBuilder<number>(age => age >= 18);
const isSenior = new SpecBuilder<number>(age => age >= 65);
const isWorkingAge = isAdult.and(isSenior.not().build()).build();

// 21. Builder that nests transformers
type Transformer<T, U> = (input: T) => U;
class TransformerChainBuilder<In, Out = In> {
  private chain: Transformer<any, any>[] = [];
  map<Next>(fn: Transformer<Out, Next>): TransformerChainBuilder<In, Next> {
    const next = new TransformerChainBuilder<In, Next>();
    (next as any).chain = [...this.chain, fn];
    return next;
  }
  build(): Transformer<In, Out> {
    const chain = this.chain;
    return (input: In) => chain.reduce((acc: any, fn) => fn(acc), input) as Out;
  }
}
const processString = new TransformerChainBuilder<string>()
  .map(s => s.trim())
  .map(s => s.toLowerCase())
  .map(s => s.split(" "))
  .map(words => words.filter(w => w.length > 3))
  .build();
const result21 = processString("  The quick brown fox  ");

// 22. Nested event handler builder — events with sub-handlers
type EventPhase = "capture" | "bubble";
interface HandlerSpec { event: string; phase: EventPhase; handler: (e: Event) => void; once: boolean }
class HandlerBuilder {
  private spec: Partial<HandlerSpec> = { phase: "bubble", once: false };
  forEvent(e: string): this { this.spec.event = e; return this; }
  inPhase(p: EventPhase): this { this.spec.phase = p; return this; }
  runOnce(): this { this.spec.once = true; return this; }
  withHandler(fn: (e: Event) => void): this { this.spec.handler = fn; return this; }
  build(): HandlerSpec { return this.spec as HandlerSpec; }
}
class EventBudgetBuilder {
  private handlers: HandlerSpec[] = [];
  addHandler(fn: (b: HandlerBuilder) => HandlerBuilder): this {
    this.handlers.push(fn(new HandlerBuilder()).build()); return this;
  }
  build() { return { handlers: this.handlers, count: this.handlers.length }; }
}
const eventBudget = new EventBudgetBuilder()
  .addHandler(h => h.forEvent("click").inPhase("bubble").withHandler(() => console.log("click")))
  .addHandler(h => h.forEvent("resize").runOnce().withHandler(() => console.log("resize"))).build();

// 23. Nested aggregation builder — analytics query with nested groupings
interface GroupBy { field: string; having?: string }
interface AggregateSpec { metric: string; fn: "sum" | "avg" | "count" | "max" | "min"; alias: string }
class AggregateBuilder {
  private spec: AggregateSpec = { metric: "", fn: "sum", alias: "" };
  on(field: string): this { this.spec.metric = field; return this; }
  using(fn: AggregateSpec["fn"]): this { this.spec.fn = fn; return this; }
  as(alias: string): this { this.spec.alias = alias; return this; }
  build(): AggregateSpec { return { ...this.spec }; }
}
class AnalyticsQueryBuilder {
  private from = ""; private groupBys: GroupBy[] = [];
  private aggregates: AggregateSpec[] = [];
  fromTable(t: string): this { this.from = t; return this; }
  groupBy(field: string, having?: string): this { this.groupBys.push({ field, having }); return this; }
  aggregate(fn: (b: AggregateBuilder) => AggregateBuilder): this {
    this.aggregates.push(fn(new AggregateBuilder()).build()); return this;
  }
  build() { return { from: this.from, groupBys: this.groupBys, aggregates: this.aggregates }; }
}
const analyticsQuery = new AnalyticsQueryBuilder()
  .fromTable("orders")
  .groupBy("customer_id").groupBy("product_category", "count > 10")
  .aggregate(a => a.on("amount").using("sum").as("totalRevenue"))
  .aggregate(a => a.on("order_id").using("count").as("orderCount")).build();

// 24. Component builder that accepts child component builders
interface ComponentSpec { tag: string; props: Record<string, unknown>; children: ComponentSpec[] }
class ComponentBuilder24 {
  private spec: ComponentSpec = { tag: "div", props: {}, children: [] };
  tag(t: string): this { this.spec.tag = t; return this; }
  prop(k: string, v: unknown): this { this.spec.props[k] = v; return this; }
  addChild(fn: (b: ComponentBuilder24) => ComponentBuilder24): this {
    this.spec.children.push(fn(new ComponentBuilder24()).build()); return this;
  }
  build(): ComponentSpec { return { ...this.spec, children: [...this.spec.children] }; }
}
const uiTree = new ComponentBuilder24()
  .tag("div").prop("className", "container")
  .addChild(c => c.tag("header").prop("className", "navbar")
    .addChild(cc => cc.tag("span").prop("textContent", "Logo")))
  .addChild(c => c.tag("main")
    .addChild(cc => cc.tag("p").prop("textContent", "Content"))).build();

// 25. Pipeline stage builder — stages that wrap each other
interface PipelineStage<T, U> { name: string; transform: (input: T) => U }
class StageBuilder<T, U> {
  private name = ""; private fn: (input: T) => U = (i: T) => i as unknown as U;
  withName(n: string): this { this.name = n; return this; }
  withTransform(fn: (input: T) => U): this { this.fn = fn; return this; }
  build(): PipelineStage<T, U> { return { name: this.name, transform: this.fn }; }
}
class StagedPipelineBuilder {
  private stages: PipelineStage<any, any>[] = [];
  addStage<T, U>(fn: (b: StageBuilder<T, U>) => StageBuilder<T, U>): this {
    this.stages.push(fn(new StageBuilder<T, U>()).build()); return this;
  }
  build() {
    return {
      stages: this.stages,
      run: (input: unknown) => this.stages.reduce((acc, s) => s.transform(acc), input)
    };
  }
}
const dataPipeline = new StagedPipelineBuilder()
  .addStage<string, string[]>(s => s.withName("parse").withTransform(csv => csv.split(",")))
  .addStage<string[], string[]>(s => s.withName("trim").withTransform(arr => arr.map(x => x.trim())))
  .addStage<string[], number>(s => s.withName("count").withTransform(arr => arr.length))
  .build();

// 26. REST resource builder with nested sub-resource builders
interface Endpoint26 { method: string; path: string; auth: boolean }
class SubResourceBuilder {
  private base: string;
  private endpoints: Endpoint26[] = [];
  constructor(base: string) { this.base = base; }
  get(path = "", auth = false): this { this.endpoints.push({ method: "GET", path: `${this.base}${path}`, auth }); return this; }
  post(path = "", auth = true): this { this.endpoints.push({ method: "POST", path: `${this.base}${path}`, auth }); return this; }
  delete(path = "/:id", auth = true): this { this.endpoints.push({ method: "DELETE", path: `${this.base}${path}`, auth }); return this; }
  build(): Endpoint26[] { return [...this.endpoints]; }
}
class RestApiBuilder {
  private allEndpoints: Endpoint26[] = [];
  resource(name: string, fn: (b: SubResourceBuilder) => SubResourceBuilder): this {
    const sub = fn(new SubResourceBuilder(`/${name}`));
    this.allEndpoints.push(...sub.build()); return this;
  }
  build() { return { endpoints: this.allEndpoints }; }
}
const restApi = new RestApiBuilder()
  .resource("users", r => r.get().get("/:id").post().delete())
  .resource("posts", r => r.get().get("/:id", true).post()).build();

// 27. Nested configuration with overrides per environment
interface DbCfg { host: string; port: number; ssl: boolean }
interface ServiceCfg { db: DbCfg; apiKey: string; rateLimit: number }
class DbBuilder27 {
  private cfg: DbCfg = { host: "localhost", port: 5432, ssl: false };
  host(h: string): this { this.cfg.host = h; return this; }
  port(p: number): this { this.cfg.port = p; return this; }
  ssl(v = true): this { this.cfg.ssl = v; return this; }
  build(): DbCfg { return { ...this.cfg }; }
}
class ServiceConfigBuilder27 {
  private cfg: Partial<ServiceCfg> = { rateLimit: 100 };
  database(fn: (b: DbBuilder27) => DbBuilder27): this { this.cfg.db = fn(new DbBuilder27()).build(); return this; }
  withApiKey(k: string): this { this.cfg.apiKey = k; return this; }
  withRateLimit(n: number): this { this.cfg.rateLimit = n; return this; }
  build(): ServiceCfg { return this.cfg as ServiceCfg; }
}
const serviceCfg = new ServiceConfigBuilder27()
  .database(db => db.host("db.prod.example.com").ssl())
  .withApiKey("sk-prod-xxx").withRateLimit(1000).build();

// 28. Multi-tenancy builder — tenant with nested features and limits
interface FeatureCfg28 { name: string; enabled: boolean; config: Record<string, unknown> }
interface LimitCfg28 { maxUsers: number; maxStorage: number; maxRequests: number }
class FeatureBuilder28 {
  private f: FeatureCfg28 = { name: "", enabled: true, config: {} };
  withName(n: string): this { this.f.name = n; return this; }
  enabled(v: boolean): this { this.f.enabled = v; return this; }
  withConfig(k: string, v: unknown): this { this.f.config[k] = v; return this; }
  build(): FeatureCfg28 { return { ...this.f, config: { ...this.f.config } }; }
}
class TenantBuilder28 {
  private name = ""; private features: FeatureCfg28[] = [];
  private limits: LimitCfg28 = { maxUsers: 10, maxStorage: 1024, maxRequests: 1000 };
  withName(n: string): this { this.name = n; return this; }
  addFeature(fn: (b: FeatureBuilder28) => FeatureBuilder28): this {
    this.features.push(fn(new FeatureBuilder28()).build()); return this;
  }
  withLimits(limits: Partial<LimitCfg28>): this { Object.assign(this.limits, limits); return this; }
  build() { return { name: this.name, features: this.features, limits: { ...this.limits } }; }
}
const enterpriseTenant = new TenantBuilder28()
  .withName("Acme Corp")
  .addFeature(f => f.withName("SSO").enabled(true).withConfig("provider", "okta"))
  .addFeature(f => f.withName("AdvancedAnalytics").enabled(true))
  .withLimits({ maxUsers: 500, maxStorage: 102400, maxRequests: 100000 }).build();

// 29. Nested test fixture builder — users with nested order history
interface OrderHistoryItem { orderId: string; amount: number; date: Date }
class OrderHistoryBuilder {
  private orders: OrderHistoryItem[] = [];
  addOrder(orderId: string, amount: number, date = new Date()): this {
    this.orders.push({ orderId, amount, date }); return this;
  }
  build(): OrderHistoryItem[] { return [...this.orders]; }
}
class CustomerFixtureBuilder {
  private id = ""; private name = ""; private email = "";
  private orderHistory: OrderHistoryItem[] = [];
  withId(id: string): this { this.id = id; return this; }
  withName(n: string): this { this.name = n; return this; }
  withEmail(e: string): this { this.email = e; return this; }
  withOrderHistory(fn: (b: OrderHistoryBuilder) => OrderHistoryBuilder): this {
    this.orderHistory = fn(new OrderHistoryBuilder()).build(); return this;
  }
  build() { return { id: this.id, name: this.name, email: this.email, orderHistory: this.orderHistory }; }
}
const customerFixture = new CustomerFixtureBuilder()
  .withId("c001").withName("Alice").withEmail("alice@example.com")
  .withOrderHistory(h => h.addOrder("o001", 49.99).addOrder("o002", 99.99)).build();

// 30. Theme builder with nested typography and spacing sub-builders
interface TypographySpec { fontFamily: string; fontSize: Record<string, string>; fontWeight: Record<string, number> }
interface SpacingSpec { unit: number; scale: number[] }
class TypographyBuilder {
  private spec: TypographySpec = { fontFamily: "sans-serif", fontSize: {}, fontWeight: {} };
  withFontFamily(f: string): this { this.spec.fontFamily = f; return this; }
  addSize(name: string, val: string): this { this.spec.fontSize[name] = val; return this; }
  addWeight(name: string, val: number): this { this.spec.fontWeight[name] = val; return this; }
  build(): TypographySpec { return { ...this.spec }; }
}
class SpacingBuilder {
  private spec: SpacingSpec = { unit: 4, scale: [0, 1, 2, 4, 8, 16, 32] };
  withUnit(u: number): this { this.spec.unit = u; return this; }
  withScale(...values: number[]): this { this.spec.scale = values; return this; }
  build(): SpacingSpec { return { ...this.spec }; }
}
class ThemeBuilder30 {
  private colors: Record<string, string> = {};
  private typography?: TypographySpec;
  private spacing?: SpacingSpec;
  addColor(name: string, val: string): this { this.colors[name] = val; return this; }
  withTypography(fn: (b: TypographyBuilder) => TypographyBuilder): this {
    this.typography = fn(new TypographyBuilder()).build(); return this;
  }
  withSpacing(fn: (b: SpacingBuilder) => SpacingBuilder): this {
    this.spacing = fn(new SpacingBuilder()).build(); return this;
  }
  build() { return { colors: this.colors, typography: this.typography, spacing: this.spacing }; }
}
const designSystem = new ThemeBuilder30()
  .addColor("primary", "#007bff").addColor("secondary", "#6c757d")
  .withTypography(t => t.withFontFamily("Inter, sans-serif").addSize("sm", "0.875rem").addSize("base", "1rem").addSize("lg", "1.25rem").addWeight("normal", 400).addWeight("bold", 700))
  .withSpacing(s => s.withUnit(4).withScale(0, 1, 2, 3, 4, 6, 8, 12, 16)).build();

// 31. Nested builder with generic type accumulation
type Merged<A, B> = { [K in keyof A | keyof B]: K extends keyof B ? B[K] : K extends keyof A ? A[K] : never };
class AccumulatingBuilder<T = {}> {
  private data: T = {} as T;
  with<K extends string, V>(key: K, val: V): AccumulatingBuilder<Merged<T, Record<K, V>>> {
    const next = new AccumulatingBuilder<Merged<T, Record<K, V>>>();
    (next as any).data = { ...(this.data as any), [key]: val };
    return next;
  }
  build(): T { return { ...this.data }; }
}
const accumulated = new AccumulatingBuilder()
  .with("name", "Alice")
  .with("age", 30)
  .with("role", "admin")
  .build();

// 32. Selector builder — nested CSS-like selector construction
class SelectorBuilder {
  private parts: string[] = [];
  element(tag: string): this { this.parts.push(tag); return this; }
  id(id: string): this { this.parts[this.parts.length - 1] += `#${id}`; return this; }
  class(cls: string): this { this.parts[this.parts.length - 1] += `.${cls}`; return this; }
  child(): this { this.parts.push(">"); return this; }
  descendant(): this { this.parts.push(" "); return this; }
  sibling(): this { this.parts.push("+"); return this; }
  pseudoClass(p: string): this { this.parts[this.parts.length - 1] += `:${p}`; return this; }
  attr(a: string, v?: string): this { this.parts[this.parts.length - 1] += v ? `[${a}="${v}"]` : `[${a}]`; return this; }
  build(): string { return this.parts.join(""); }
}
const selector32 = new SelectorBuilder()
  .element("nav").class("main-nav")
  .child().element("ul")
  .descendant().element("li").pseudoClass("first-child")
  .child().element("a").attr("href").build();

// 33. Pagination cursor builder with nested sorting
interface SortCriterion { field: string; direction: "asc" | "desc" }
class SortBuilder33 {
  private criteria: SortCriterion[] = [];
  by(field: string, direction: "asc" | "desc" = "asc"): this { this.criteria.push({ field, direction }); return this; }
  build(): SortCriterion[] { return [...this.criteria]; }
}
class CursorPaginationBuilder {
  private limit = 20; private cursor?: string;
  private sort?: SortCriterion[];
  withLimit(n: number): this { this.limit = n; return this; }
  withCursor(c: string): this { this.cursor = c; return this; }
  withSort(fn: (b: SortBuilder33) => SortBuilder33): this { this.sort = fn(new SortBuilder33()).build(); return this; }
  build() { return { limit: this.limit, cursor: this.cursor, sort: this.sort }; }
}
const pagination = new CursorPaginationBuilder()
  .withLimit(50).withCursor("eyJpZCI6IjEwMCJ9")
  .withSort(s => s.by("createdAt", "desc").by("id", "asc")).build();

// 34. Service locator builder — registers factories for nested services
class ServiceLocatorBuilder {
  private factories = new Map<string, (locator: { get: <T>(k: string) => T }) => unknown>();
  register<T>(key: string, factory: (locator: { get: <U>(k: string) => U }) => T): this {
    this.factories.set(key, factory as any); return this;
  }
  build() {
    const cache = new Map<string, unknown>();
    const locator = {
      get: <T>(key: string): T => {
        if (!cache.has(key)) cache.set(key, this.factories.get(key)!(locator));
        return cache.get(key) as T;
      }
    };
    return locator;
  }
}
const locator = new ServiceLocatorBuilder()
  .register("config", () => ({ env: "prod", port: 8080 }))
  .register("logger", loc => ({ log: (m: string) => console.log(`[${loc.get<{ env: string }>("config").env}]`, m) }))
  .build();

// 35. Nested builder with merge strategies
type MergeStrategy = "replace" | "merge" | "append";
class MergeableBuilder<T extends Record<string, unknown>> {
  private data: Partial<T> = {};
  private strategies: Partial<Record<keyof T, MergeStrategy>> = {};
  set<K extends keyof T>(k: K, v: T[K], strategy: MergeStrategy = "replace"): this {
    this.strategies[k] = strategy;
    if (strategy === "append" && Array.isArray(this.data[k])) {
      (this.data[k] as unknown[]).push(...(v as unknown[]));
    } else if (strategy === "merge" && typeof this.data[k] === "object") {
      this.data[k] = { ...(this.data[k] as object), ...(v as object) } as T[K];
    } else {
      this.data[k] = v;
    }
    return this;
  }
  build(): T { return this.data as T; }
}
const mergeable = new MergeableBuilder<{ name: string; tags: string[]; meta: Record<string, string> }>()
  .set("name", "App")
  .set("tags", ["alpha"] as string[], "replace")
  .set("tags", ["beta"] as string[], "append")
  .set("meta", { version: "1.0" } as Record<string, string>, "merge")
  .set("meta", { author: "Alice" } as Record<string, string>, "merge")
  .build();

// 36. Nested build with post-processors
class PostProcessingBuilder<T> {
  private data: Partial<T> = {};
  private postProcessors: ((result: T) => T)[] = [];
  set<K extends keyof T>(k: K, v: T[K]): this { this.data[k] = v; return this; }
  addPostProcessor(fn: (result: T) => T): this { this.postProcessors.push(fn); return this; }
  build(): T {
    return this.postProcessors.reduce((acc, fn) => fn(acc), this.data as T);
  }
}
const postProcessed = new PostProcessingBuilder<{ name: string; email: string; slug: string }>()
  .set("name", "Alice Smith")
  .set("email", "alice@example.com")
  .addPostProcessor(u => ({ ...u, name: u.name.trim() }))
  .addPostProcessor(u => ({ ...u, slug: u.name.toLowerCase().replace(/\s+/g, "-") }))
  .build();

// 37. Nested builder with type-safe event hooks on each field
type FieldEvent<T, K extends keyof T> = { field: K; oldValue: T[K] | undefined; newValue: T[K] };
class TrackedBuilder<T extends Record<string, unknown>> {
  private data: Partial<T> = {};
  private listeners: ((e: FieldEvent<T, keyof T>) => void)[] = [];
  onChange(fn: (e: FieldEvent<T, keyof T>) => void): this { this.listeners.push(fn); return this; }
  set<K extends keyof T>(k: K, v: T[K]): this {
    const oldValue = this.data[k];
    this.data[k] = v;
    this.listeners.forEach(l => l({ field: k, oldValue, newValue: v }));
    return this;
  }
  build(): T { return this.data as T; }
}
const changeLog: FieldEvent<{ name: string; role: string }, keyof { name: string; role: string }>[] = [];
const tracked = new TrackedBuilder<{ name: string; role: string }>()
  .onChange(e => changeLog.push(e))
  .set("name", "Alice").set("role", "admin").build();

// 38. Nested scoped builder — child builders access parent scope
class ScopedBuilder<Parent, Child> {
  private parentData: Parent;
  private childBuilders: ((parent: Parent) => Child)[] = [];
  constructor(parent: Parent) { this.parentData = parent; }
  addChild(fn: (parent: Parent) => Child): this { this.childBuilders.push(fn); return this; }
  build(): { parent: Parent; children: Child[] } {
    return { parent: this.parentData, children: this.childBuilders.map(fn => fn(this.parentData)) };
  }
}
const scopedResult = new ScopedBuilder({ orgId: "org_001", name: "Acme" })
  .addChild(parent => ({ userId: "u1", orgId: parent.orgId, role: "admin" }))
  .addChild(parent => ({ userId: "u2", orgId: parent.orgId, role: "member" }))
  .build();

// 39. Builder with nested lazy evaluation
class LazyFieldBuilder<T> {
  private eager: Partial<T> = {};
  private lazy: Partial<{ [K in keyof T]: () => T[K] }> = {};
  set<K extends keyof T>(k: K, v: T[K]): this { this.eager[k] = v; return this; }
  setLazy<K extends keyof T>(k: K, factory: () => T[K]): this { this.lazy[k] = factory; return this; }
  build(): T {
    const result = { ...this.eager } as T;
    for (const [k, factory] of Object.entries(this.lazy)) {
      Object.defineProperty(result, k, { get: factory as () => unknown, enumerable: true, configurable: true });
    }
    return result;
  }
}
const lazyBuilt = new LazyFieldBuilder<{ name: string; computedHash: string }>()
  .set("name", "Alice")
  .setLazy("computedHash", () => `hash_${Math.random().toString(36).slice(2)}`).build();

// 40. Nested step builder with rollback capability
interface Step40 { name: string; execute: () => void; rollback: () => void }
class StepBuilder40 {
  private s: Partial<Step40> = {};
  withName(n: string): this { this.s.name = n; return this; }
  withExecute(fn: () => void): this { this.s.execute = fn; return this; }
  withRollback(fn: () => void): this { this.s.rollback = fn; return this; }
  build(): Step40 { return this.s as Step40; }
}
class TransactionBuilder {
  private steps: Step40[] = [];
  addStep(fn: (b: StepBuilder40) => StepBuilder40): this {
    this.steps.push(fn(new StepBuilder40()).build()); return this;
  }
  build() {
    const steps = this.steps;
    return {
      run: () => {
        const executed: Step40[] = [];
        for (const step of steps) {
          try { step.execute(); executed.push(step); }
          catch { executed.reverse().forEach(s => s.rollback()); break; }
        }
      }
    };
  }
}
const dbTransaction = new TransactionBuilder()
  .addStep(s => s.withName("insert user").withExecute(() => console.log("insert")).withRollback(() => console.log("delete")))
  .addStep(s => s.withName("send email").withExecute(() => console.log("send")).withRollback(() => {}))
  .build();

// 41. Deeply nested object builder with path-based setting
class PathBuilder<T extends Record<string, unknown>> {
  private data: Record<string, unknown> = {};
  setPath(path: string, value: unknown): this {
    const keys = path.split(".");
    let obj = this.data;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]] as Record<string, unknown>;
    }
    obj[keys[keys.length - 1]] = value;
    return this;
  }
  build(): T { return this.data as T; }
}
type DeepConfig = { db: { host: string; port: number }; app: { name: string; version: string } };
const deepCfg = new PathBuilder<DeepConfig>()
  .setPath("db.host", "localhost")
  .setPath("db.port", 5432)
  .setPath("app.name", "MyApp")
  .setPath("app.version", "1.0.0")
  .build();

// 42. Nested builder with lifecycle hooks per-step
type LifecycleHook = () => void;
class LifecycleStepBuilder {
  private step = { name: "", before: [] as LifecycleHook[], after: [] as LifecycleHook[], fn: () => {} };
  withName(n: string): this { this.step.name = n; return this; }
  before(fn: LifecycleHook): this { this.step.before.push(fn); return this; }
  execute(fn: () => void): this { this.step.fn = fn; return this; }
  after(fn: LifecycleHook): this { this.step.after.push(fn); return this; }
  build() { return { ...this.step }; }
}
class LifecyclePipelineBuilder {
  private steps: ReturnType<LifecycleStepBuilder["build"]>[] = [];
  addStep(fn: (b: LifecycleStepBuilder) => LifecycleStepBuilder): this {
    this.steps.push(fn(new LifecycleStepBuilder()).build()); return this;
  }
  build() {
    return {
      run: () => {
        for (const step of this.steps) {
          step.before.forEach(h => h());
          step.fn();
          step.after.forEach(h => h());
        }
      }
    };
  }
}
const lifecyclePipeline = new LifecyclePipelineBuilder()
  .addStep(s => s.withName("step1")
    .before(() => console.log("before step1"))
    .execute(() => console.log("executing step1"))
    .after(() => console.log("after step1")))
  .build();

// 43. Nested typed option groups
interface OptionGroup { groupName: string; options: { label: string; value: string }[] }
class OptionGroupBuilder {
  private group: OptionGroup = { groupName: "", options: [] };
  withGroupName(n: string): this { this.group.groupName = n; return this; }
  addOption(label: string, value: string): this { this.group.options.push({ label, value }); return this; }
  build(): OptionGroup { return { ...this.group, options: [...this.group.options] }; }
}
class SelectBuilder43 {
  private groups: OptionGroup[] = [];
  private placeholder = "Select...";
  withPlaceholder(p: string): this { this.placeholder = p; return this; }
  addGroup(fn: (b: OptionGroupBuilder) => OptionGroupBuilder): this {
    this.groups.push(fn(new OptionGroupBuilder()).build()); return this;
  }
  build() { return { placeholder: this.placeholder, groups: this.groups }; }
}
const countrySelect = new SelectBuilder43()
  .withPlaceholder("Choose country...")
  .addGroup(g => g.withGroupName("North America").addOption("USA", "us").addOption("Canada", "ca"))
  .addGroup(g => g.withGroupName("Europe").addOption("Germany", "de").addOption("France", "fr")).build();

// 44. Nested security config builder
interface CORSConfig { origins: string[]; methods: string[]; headers: string[] }
interface RateLimitConfig { windowMs: number; max: number }
interface SecurityConfig { cors: CORSConfig; rateLimit: RateLimitConfig; helmet: boolean }
class CORSBuilder {
  private cfg: CORSConfig = { origins: [], methods: ["GET"], headers: ["Content-Type"] };
  allowOrigin(o: string): this { this.cfg.origins.push(o); return this; }
  allowMethod(m: string): this { this.cfg.methods.push(m); return this; }
  allowHeader(h: string): this { this.cfg.headers.push(h); return this; }
  build(): CORSConfig { return { origins: [...this.cfg.origins], methods: [...this.cfg.methods], headers: [...this.cfg.headers] }; }
}
class SecurityConfigBuilder {
  private cfg: Partial<SecurityConfig> = { helmet: true };
  withCORS(fn: (b: CORSBuilder) => CORSBuilder): this { this.cfg.cors = fn(new CORSBuilder()).build(); return this; }
  withRateLimit(windowMs: number, max: number): this { this.cfg.rateLimit = { windowMs, max }; return this; }
  withHelmet(v: boolean): this { this.cfg.helmet = v; return this; }
  build(): SecurityConfig { return this.cfg as SecurityConfig; }
}
const secConfig = new SecurityConfigBuilder()
  .withCORS(c => c.allowOrigin("https://app.example.com").allowMethod("POST").allowMethod("PUT").allowHeader("Authorization"))
  .withRateLimit(60000, 100).withHelmet(true).build();

// 45. Builder combining multiple domain sub-builders — e-commerce product
interface PricingSpec { basePrice: number; currency: string; taxRate: number; discounts: { code: string; pct: number }[] }
interface InventorySpec { stock: number; warehouse: string; trackInventory: boolean }
class PricingBuilder45 {
  private spec: PricingSpec = { basePrice: 0, currency: "USD", taxRate: 0, discounts: [] };
  withBasePrice(p: number): this { this.spec.basePrice = p; return this; }
  withCurrency(c: string): this { this.spec.currency = c; return this; }
  withTaxRate(r: number): this { this.spec.taxRate = r; return this; }
  addDiscount(code: string, pct: number): this { this.spec.discounts.push({ code, pct }); return this; }
  build(): PricingSpec { return { ...this.spec, discounts: [...this.spec.discounts] }; }
}
class InventoryBuilder45 {
  private spec: InventorySpec = { stock: 0, warehouse: "default", trackInventory: true };
  withStock(n: number): this { this.spec.stock = n; return this; }
  inWarehouse(w: string): this { this.spec.warehouse = w; return this; }
  doNotTrack(): this { this.spec.trackInventory = false; return this; }
  build(): InventorySpec { return { ...this.spec }; }
}
class ProductBuilder45 {
  private name = ""; private sku = "";
  private pricing?: PricingSpec; private inventory?: InventorySpec;
  withName(n: string): this { this.name = n; return this; }
  withSku(s: string): this { this.sku = s; return this; }
  pricing(fn: (b: PricingBuilder45) => PricingBuilder45): this { this.pricing = fn(new PricingBuilder45()).build(); return this; }
  inventory(fn: (b: InventoryBuilder45) => InventoryBuilder45): this { this.inventory = fn(new InventoryBuilder45()).build(); return this; }
  build() { return { name: this.name, sku: this.sku, pricing: this.pricing, inventory: this.inventory }; }
}
const product45 = new ProductBuilder45()
  .withName("TypeScript Handbook").withSku("BOOK-TS-001")
  .pricing(p => p.withBasePrice(39.99).withCurrency("USD").withTaxRate(0.08).addDiscount("SALE10", 10))
  .inventory(i => i.withStock(500).inWarehouse("US-EAST")).build();

// 46. Nested builder with typed assertion DSL
class AssertionDsl<T> {
  constructor(private value: T, private label: string) {}
  isEqualTo(expected: T): this {
    if (JSON.stringify(this.value) !== JSON.stringify(expected))
      throw new Error(`${this.label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(this.value)}`);
    return this;
  }
  satisfies(predicate: (v: T) => boolean, msg: string): this {
    if (!predicate(this.value)) throw new Error(`${this.label}: ${msg}`);
    return this;
  }
  build(): T { return this.value; }
}
class AssertionChainBuilder<T> {
  private value: T;
  constructor(v: T) { this.value = v; }
  assert(label: string): AssertionDsl<T> { return new AssertionDsl(this.value, label); }
}
function assertThat<T>(v: T) { return new AssertionChainBuilder(v); }
const checkedValue = assertThat(42)
  .assert("must be positive").satisfies(v => v > 0, "not positive")
  .assert("must equal 42").isEqualTo(42).build();

// 47. Recursive nested builder — JSON schema builder
interface JsonSchema { type: string; properties?: Record<string, JsonSchema>; items?: JsonSchema; required?: string[] }
class JsonSchemaBuilder {
  private schema: JsonSchema = { type: "object" };
  ofType(t: string): this { this.schema.type = t; return this; }
  property(name: string, fn: (b: JsonSchemaBuilder) => JsonSchemaBuilder): this {
    if (!this.schema.properties) this.schema.properties = {};
    this.schema.properties[name] = fn(new JsonSchemaBuilder()).build(); return this;
  }
  items(fn: (b: JsonSchemaBuilder) => JsonSchemaBuilder): this {
    this.schema.items = fn(new JsonSchemaBuilder()).build(); return this;
  }
  required(...fields: string[]): this { this.schema.required = fields; return this; }
  build(): JsonSchema { return { ...this.schema }; }
}
const userSchema = new JsonSchemaBuilder()
  .ofType("object").required("name", "email")
  .property("name", p => p.ofType("string"))
  .property("email", p => p.ofType("string"))
  .property("address", p => p.ofType("object")
    .property("street", pp => pp.ofType("string"))
    .property("city", pp => pp.ofType("string")))
  .property("tags", p => p.ofType("array").items(i => i.ofType("string"))).build();

// 48. Nested builder with middleware injection into steps
type StepMiddleware<T> = (ctx: T, step: () => T) => T;
class MiddlewareStepBuilder<T> {
  private middlewares: StepMiddleware<T>[] = [];
  private stepFn: (ctx: T) => T = ctx => ctx;
  withMiddleware(mw: StepMiddleware<T>): this { this.middlewares.push(mw); return this; }
  withStep(fn: (ctx: T) => T): this { this.stepFn = fn; return this; }
  build(): (ctx: T) => T {
    const step = this.stepFn;
    return this.middlewares.reduceRight(
      (next, mw) => (ctx: T) => mw(ctx, () => next(ctx)),
      step
    );
  }
}
const augmentingStep = new MiddlewareStepBuilder<{ name: string; timestamp?: number; logged?: boolean }>()
  .withMiddleware((ctx, next) => { const result = next(); return { ...result, logged: true }; })
  .withMiddleware((ctx, next) => { const result = next(); return { ...result, timestamp: Date.now() }; })
  .withStep(ctx => ({ ...ctx, name: ctx.name.toUpperCase() }))
  .build();
const stepResult = augmentingStep({ name: "event" });

// 49. Nested command queue builder
interface QueuedCommand { id: string; priority: number; execute: () => void }
class QueuedCommandBuilder {
  private cmd: Partial<QueuedCommand> = { priority: 0 };
  withId(id: string): this { this.cmd.id = id; return this; }
  withPriority(p: number): this { this.cmd.priority = p; return this; }
  withAction(fn: () => void): this { this.cmd.execute = fn; return this; }
  build(): QueuedCommand { return this.cmd as QueuedCommand; }
}
class CommandQueueBuilder {
  private commands: QueuedCommand[] = [];
  addCommand(fn: (b: QueuedCommandBuilder) => QueuedCommandBuilder): this {
    this.commands.push(fn(new QueuedCommandBuilder()).build()); return this;
  }
  build() {
    const sorted = [...this.commands].sort((a, b) => b.priority - a.priority);
    return { commands: sorted, drain: () => sorted.forEach(c => c.execute()) };
  }
}
const commandQueue = new CommandQueueBuilder()
  .addCommand(c => c.withId("cmd1").withPriority(1).withAction(() => console.log("low priority")))
  .addCommand(c => c.withId("cmd2").withPriority(10).withAction(() => console.log("high priority")))
  .addCommand(c => c.withId("cmd3").withPriority(5).withAction(() => console.log("medium priority")))
  .build();

// 50. Master nested builder — API gateway config with nested route, auth, and throttle builders
interface ThrottleConfig { rps: number; burst: number }
interface AuthConfig50 { type: "jwt" | "apiKey" | "none"; headerName: string }
interface RouteConfig50 { path: string; upstream: string; auth: AuthConfig50; throttle: ThrottleConfig }
class ThrottleBuilder50 {
  private cfg: ThrottleConfig = { rps: 100, burst: 200 };
  rps(n: number): this { this.cfg.rps = n; return this; }
  burst(n: number): this { this.cfg.burst = n; return this; }
  build(): ThrottleConfig { return { ...this.cfg }; }
}
class AuthBuilder50 {
  private cfg: AuthConfig50 = { type: "none", headerName: "Authorization" };
  jwt(): this { this.cfg.type = "jwt"; return this; }
  apiKey(header = "X-API-Key"): this { this.cfg.type = "apiKey"; this.cfg.headerName = header; return this; }
  build(): AuthConfig50 { return { ...this.cfg }; }
}
class RouteBuilder50 {
  private route: Partial<RouteConfig50> = {};
  at(path: string): this { this.route.path = path; return this; }
  upstream(url: string): this { this.route.upstream = url; return this; }
  auth(fn: (b: AuthBuilder50) => AuthBuilder50): this { this.route.auth = fn(new AuthBuilder50()).build(); return this; }
  throttle(fn: (b: ThrottleBuilder50) => ThrottleBuilder50): this { this.route.throttle = fn(new ThrottleBuilder50()).build(); return this; }
  build(): RouteConfig50 { return this.route as RouteConfig50; }
}
class ApiGatewayBuilder {
  private routes: RouteConfig50[] = [];
  private globalThrottle?: ThrottleConfig;
  addRoute(fn: (b: RouteBuilder50) => RouteBuilder50): this { this.routes.push(fn(new RouteBuilder50()).build()); return this; }
  globalThrottleConfig(fn: (b: ThrottleBuilder50) => ThrottleBuilder50): this { this.globalThrottle = fn(new ThrottleBuilder50()).build(); return this; }
  build() { return { routes: this.routes, globalThrottle: this.globalThrottle }; }
}
const gateway = new ApiGatewayBuilder()
  .globalThrottleConfig(t => t.rps(1000).burst(2000))
  .addRoute(r => r.at("/api/users").upstream("http://user-service:3000")
    .auth(a => a.jwt()).throttle(t => t.rps(500).burst(1000)))
  .addRoute(r => r.at("/api/public").upstream("http://public-service:3001")
    .auth(a => a.apiKey("X-API-Key")).throttle(t => t.rps(50).burst(100)))
  .build();
