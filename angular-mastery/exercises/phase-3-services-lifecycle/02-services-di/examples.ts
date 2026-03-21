import {
  Component, Injectable, InjectionToken, Inject, inject,
  signal, computed, effect, OnInit, OnDestroy, EnvironmentInjector,
  forwardRef, DestroyRef, APP_INITIALIZER, ENVIRONMENT_INITIALIZER,
  makeEnvironmentProviders,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { interval, of } from 'rxjs';
import { map } from 'rxjs/operators';

// ============================================================
// Examples 3.2 — Services & Dependency Injection (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ────────────────────────────────────────────

// 1. @Injectable() with providedIn:'root'
@Injectable({ providedIn: 'root' })
class GreetService { greet(name: string) { return `Hello, ${name}!`; } }

@Component({ selector: 'ex-01', standalone: true, template: `<p>{{ msg }}</p>` })
class Ex01 { msg = inject(GreetService).greet('Angular'); }

// 2. inject() basics — injecting a service with inject()
@Injectable({ providedIn: 'root' })
class TimeService { now() { return new Date().toLocaleTimeString(); } }

@Component({ selector: 'ex-02', standalone: true, template: `<p>Time: {{ time }}</p>` })
class Ex02 { private ts = inject(TimeService); time = this.ts.now(); }

// 3. Simple service with methods
@Injectable({ providedIn: 'root' })
class MathService {
  add(a: number, b: number) { return a + b; }
  multiply(a: number, b: number) { return a * b; }
}

@Component({ selector: 'ex-03', standalone: true, template: `<p>3 + 4 = {{ sum }} | 3 × 4 = {{ product }}</p>` })
class Ex03 {
  private ms = inject(MathService);
  sum = this.ms.add(3, 4);
  product = this.ms.multiply(3, 4);
}

// 4. Service with a property
@Injectable({ providedIn: 'root' })
class AppConfigService { appName = 'Angular Mastery'; version = '1.0.0'; }

@Component({ selector: 'ex-04', standalone: true, template: `<p>{{ name }} v{{ ver }}</p>` })
class Ex04 { private cfg = inject(AppConfigService); name = this.cfg.appName; ver = this.cfg.version; }

// 5. Injecting Router
@Component({ selector: 'ex-05', standalone: true, template: `<p>Current URL: {{ url }}</p>` })
class Ex05 { private router = inject(Router, { optional: true }); url = this.router?.url ?? '(no router)'; }

// 6. Service with signal
@Injectable({ providedIn: 'root' })
class CounterService { count = signal(0); increment() { this.count.update(n => n + 1); } }

@Component({
  selector: 'ex-06', standalone: true,
  template: `<p>Count: {{ cs.count() }}</p><button (click)="cs.increment()">+1</button>`
})
class Ex06 { cs = inject(CounterService); }

// 7. Service with computed
@Injectable({ providedIn: 'root' })
class PriceService {
  basePrice = signal(100);
  tax = signal(0.2);
  total = computed(() => this.basePrice() * (1 + this.tax()));
}

@Component({ selector: 'ex-07', standalone: true, template: `<p>Total: ${{ ps.total().toFixed(2) }}</p>` })
class Ex07 { ps = inject(PriceService); }

// 8. Service with array data
@Injectable({ providedIn: 'root' })
class TodoService {
  items = signal<string[]>(['Buy milk', 'Write tests']);
  add(item: string) { this.items.update(arr => [...arr, item]); }
}

@Component({
  selector: 'ex-08', standalone: true,
  template: `
    <ul>@for (t of svc.items(); track t) { <li>{{ t }}</li> }</ul>
    <button (click)="svc.add('New task')">Add</button>
  `
})
class Ex08 { svc = inject(TodoService); }

// 9. Injecting HttpClient (read-only display)
@Component({ selector: 'ex-09', standalone: true, template: `<p>HttpClient injected: {{ hasHttp }}</p>` })
class Ex09 { private http = inject(HttpClient, { optional: true }); hasHttp = !!this.http; }

// 10. Service as utility — string helper
@Injectable({ providedIn: 'root' })
class StringService {
  slugify(text: string) { return text.toLowerCase().replace(/\s+/g, '-'); }
  truncate(text: string, max: number) { return text.length > max ? text.slice(0, max) + '…' : text; }
}

@Component({ selector: 'ex-10', standalone: true, template: `<p>{{ slug }} | {{ short }}</p>` })
class Ex10 {
  private ss = inject(StringService);
  slug = this.ss.slugify('Hello World');
  short = this.ss.truncate('A very long string for testing', 15);
}

// 11. Service with state and reset
@Injectable({ providedIn: 'root' })
class ScoreService {
  score = signal(0);
  add(pts: number) { this.score.update(n => n + pts); }
  reset() { this.score.set(0); }
}

@Component({
  selector: 'ex-11', standalone: true,
  template: `<p>Score: {{ svc.score() }}</p><button (click)="svc.add(10)">+10</button><button (click)="svc.reset()">Reset</button>`
})
class Ex11 { svc = inject(ScoreService); }

// 12. Service with boolean flag
@Injectable({ providedIn: 'root' })
class ModalService { isOpen = signal(false); open() { this.isOpen.set(true); } close() { this.isOpen.set(false); } }

@Component({
  selector: 'ex-12', standalone: true,
  template: `
    @if (ms.isOpen()) { <div style="background:#eee;padding:8px">Modal open <button (click)="ms.close()">Close</button></div> }
    @else { <button (click)="ms.open()">Open Modal</button> }
  `
})
class Ex12 { ms = inject(ModalService); }

// 13. Service with localStorage persistence
@Injectable({ providedIn: 'root' })
class ThemeService {
  theme = signal(localStorage.getItem('theme') ?? 'light');
  toggle() {
    const next = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(next);
    localStorage.setItem('theme', next);
  }
}

@Component({
  selector: 'ex-13', standalone: true,
  template: `<p>Theme: {{ ts.theme() }}</p><button (click)="ts.toggle()">Toggle</button>`
})
class Ex13 { ts = inject(ThemeService); }

// ─── INTERMEDIATE (14–26) ─────────────────────────────────────

// 14. InjectionToken with useValue
const API_URL = new InjectionToken<string>('API_URL');

@Component({
  selector: 'ex-14', standalone: true,
  providers: [{ provide: API_URL, useValue: 'https://api.example.com' }],
  template: `<p>API URL: {{ url }}</p>`
})
class Ex14 { url = inject(API_URL); }

// 15. useClass — swap implementation
abstract class LoggerBase { abstract log(msg: string): void; }

@Injectable()
class ConsoleLogger extends LoggerBase { log(msg: string) { console.log('[Console]', msg); } }

@Injectable()
class SilentLogger extends LoggerBase { log(_msg: string) { /* silent */ } }

@Component({
  selector: 'ex-15', standalone: true,
  providers: [{ provide: LoggerBase, useClass: ConsoleLogger }],
  template: `<button (click)="doLog()">Log to console</button>`
})
class Ex15 {
  private logger = inject(LoggerBase);
  doLog() { this.logger.log('Ex15: useClass demo'); }
}

// 16. useFactory — factory provider
const RANDOM_ID = new InjectionToken<string>('RANDOM_ID');

@Component({
  selector: 'ex-16', standalone: true,
  providers: [{ provide: RANDOM_ID, useFactory: () => Math.random().toString(36).slice(2) }],
  template: `<p>Random ID: {{ id }}</p>`
})
class Ex16 { id = inject(RANDOM_ID); }

// 17. useExisting — alias token
const PRIMARY_LOGGER = new InjectionToken<LoggerBase>('PRIMARY_LOGGER');

@Component({
  selector: 'ex-17', standalone: true,
  providers: [
    ConsoleLogger,
    { provide: PRIMARY_LOGGER, useExisting: ConsoleLogger },
  ],
  template: `<button (click)="log()">Log via alias</button>`
})
class Ex17 {
  private logger = inject(PRIMARY_LOGGER);
  log() { this.logger.log('Ex17: useExisting alias'); }
}

// 18. multi providers
const VALIDATORS_TOKEN = new InjectionToken<((v: string) => boolean)[]>('VALIDATORS', { factory: () => [] });

@Component({
  selector: 'ex-18', standalone: true,
  providers: [
    { provide: VALIDATORS_TOKEN, useValue: (v: string) => v.length > 0, multi: true },
    { provide: VALIDATORS_TOKEN, useValue: (v: string) => v.includes('@'), multi: true },
  ],
  template: `<p>Email valid: {{ valid }}</p>`
})
class Ex18 {
  private validators = inject(VALIDATORS_TOKEN);
  valid = this.validators.every(fn => fn('user@example.com'));
}

// 19. Hierarchical injection — component-level providers
@Injectable()
class LocalCounterService { count = signal(0); inc() { this.count.update(n => n + 1); } }

@Component({
  selector: 'ex-19', standalone: true,
  providers: [LocalCounterService],
  template: `<p>Local count: {{ lcs.count() }}</p><button (click)="lcs.inc()">+</button>`
})
class Ex19 { lcs = inject(LocalCounterService); }

// 20. Service with effect
@Injectable({ providedIn: 'root' })
class LoggingService {
  private messages = signal<string[]>([]);
  constructor() { effect(() => { if (this.messages().length) console.log('LoggingService messages:', this.messages()); }); }
  push(msg: string) { this.messages.update(arr => [...arr, msg]); }
  all() { return this.messages(); }
}

@Component({
  selector: 'ex-20', standalone: true,
  template: `
    <ul>@for (m of svc.all(); track m) { <li>{{ m }}</li> }</ul>
    <button (click)="svc.push('Message ' + (svc.all().length + 1))">Add Log</button>
  `
})
class Ex20 { svc = inject(LoggingService); }

// 21. Service lazy creation — optional injection
@Injectable({ providedIn: 'root' })
class HeavyService { data = Array.from({ length: 1000 }, (_, i) => i); sum = this.data.reduce((a, b) => a + b, 0); }

@Component({
  selector: 'ex-21', standalone: true,
  template: `<p>Sum: {{ sum }}</p><button (click)="load()">Load Heavy Service</button>`
})
class Ex21 implements OnInit {
  sum: number | null = null;
  private hs: HeavyService | null = null;
  ngOnInit() { /* don't inject until needed */ }
  load() {
    if (!this.hs) { this.hs = inject(EnvironmentInjector).get(HeavyService); }
    this.sum = this.hs.sum;
  }
}

// 22. InjectionToken with factory default
const MAX_ITEMS = new InjectionToken<number>('MAX_ITEMS', { providedIn: 'root', factory: () => 10 });

@Component({ selector: 'ex-22', standalone: true, template: `<p>Max items: {{ max }}</p>` })
class Ex22 { max = inject(MAX_ITEMS); }

// 23. Service with computed chain
@Injectable({ providedIn: 'root' })
class CartService {
  items = signal<{ name: string; price: number }[]>([]);
  subtotal = computed(() => this.items().reduce((s, i) => s + i.price, 0));
  tax = computed(() => this.subtotal() * 0.1);
  total = computed(() => this.subtotal() + this.tax());
  addItem(name: string, price: number) { this.items.update(arr => [...arr, { name, price }]); }
}

@Component({
  selector: 'ex-23', standalone: true,
  template: `
    <ul>@for (item of cs.items(); track item.name) { <li>{{ item.name }} ${{ item.price }}</li> }</ul>
    <p>Subtotal: ${{ cs.subtotal().toFixed(2) }} | Tax: ${{ cs.tax().toFixed(2) }} | Total: ${{ cs.total().toFixed(2) }}</p>
    <button (click)="cs.addItem('Widget', 29.99)">Add Widget</button>
  `
})
class Ex23 { cs = inject(CartService); }

// 24. Service with environment config injection
const ENV_CONFIG = new InjectionToken<{ production: boolean; apiBase: string }>('ENV_CONFIG');

@Component({
  selector: 'ex-24', standalone: true,
  providers: [{ provide: ENV_CONFIG, useValue: { production: false, apiBase: 'https://dev.api.com' } }],
  template: `<p>Prod: {{ cfg.production }} | API: {{ cfg.apiBase }}</p>`
})
class Ex24 { cfg = inject(ENV_CONFIG); }

// 25. Service with RxJS interval via takeUntilDestroyed
@Injectable({ providedIn: 'root' })
class TickService { tick = signal(0); }

@Component({
  selector: 'ex-25', standalone: true,
  template: `<p>Tick: {{ ts.tick() }}</p>`
})
class Ex25 implements OnInit {
  ts = inject(TickService);
  private dr = inject(DestroyRef);
  ngOnInit() { interval(1000).pipe(takeUntilDestroyed(this.dr)).subscribe(() => this.ts.tick.update(n => n + 1)); }
}

// 26. Service with optional dependency
@Injectable({ providedIn: 'root' })
class AnalyticsService { track(event: string) { console.log('[Analytics]', event); } }

@Component({
  selector: 'ex-26', standalone: true,
  template: `<button (click)="click()">Track Event</button><p>Analytics: {{ hasAnalytics ? 'enabled' : 'disabled' }}</p>`
})
class Ex26 {
  private analytics = inject(AnalyticsService, { optional: true });
  hasAnalytics = !!this.analytics;
  click() { this.analytics?.track('button_click'); }
}

// ─── NESTED (27–38) ───────────────────────────────────────────

// 27. Services injecting other services
@Injectable({ providedIn: 'root' })
class UserService { currentUser = signal({ name: 'Alice', role: 'admin' }); }

@Injectable({ providedIn: 'root' })
class PermissionService {
  private us = inject(UserService);
  canEdit = computed(() => this.us.currentUser().role === 'admin');
}

@Component({
  selector: 'ex-27', standalone: true,
  template: `<p>Can edit: {{ ps.canEdit() }}</p>`
})
class Ex27 { ps = inject(PermissionService); }

// 28. Service with circular dependency avoidance via forwardRef
@Injectable({ providedIn: 'root' })
class ServiceA { name = 'ServiceA'; getB() { return inject(forwardRef(() => ServiceB) as any); } }

@Injectable({ providedIn: 'root' })
class ServiceB { name = 'ServiceB'; }

@Component({ selector: 'ex-28', standalone: true, template: `<p>A: {{ a.name }} | B: {{ a.getB().name }}</p>` })
class Ex28 { a = inject(ServiceA); }

// 29. Service provided in component tree — isolated instance
@Injectable()
class IsolatedStore { items = signal<string[]>([]); add(s: string) { this.items.update(a => [...a, s]); } }

@Component({
  selector: 'ex-29-child', standalone: true,
  template: `<ul>@for (i of store.items(); track i) { <li>{{ i }}</li> }</ul><button (click)="store.add('item')">Add</button>`
})
class Ex29Child { store = inject(IsolatedStore); }

@Component({
  selector: 'ex-29', standalone: true, imports: [Ex29Child],
  providers: [IsolatedStore],
  template: `<ex-29-child /><p>Isolated store per component tree</p>`
})
class Ex29 {}

// 30. Child component overriding parent service
@Injectable()
class ColorService { color = signal('blue'); }

@Component({
  selector: 'ex-30-child', standalone: true,
  providers: [{ provide: ColorService, useValue: { color: signal('red') } }],
  template: `<p style="color:red">Child color: {{ cs.color() }}</p>`
})
class Ex30Child { cs = inject(ColorService); }

@Component({
  selector: 'ex-30', standalone: true, imports: [Ex30Child],
  providers: [ColorService],
  template: `<p>Parent color: {{ cs.color() }}</p><ex-30-child />`
})
class Ex30 { cs = inject(ColorService); }

// 31. Token-based strategy pattern
interface SortStrategy { sort<T>(items: T[]): T[]; }
const SORT_STRATEGY = new InjectionToken<SortStrategy>('SORT_STRATEGY');

@Injectable()
class AscSort implements SortStrategy { sort<T>(items: T[]) { return [...items].sort((a: any, b: any) => a > b ? 1 : -1); } }

@Injectable()
class DescSort implements SortStrategy { sort<T>(items: T[]) { return [...items].sort((a: any, b: any) => a > b ? -1 : 1); } }

@Component({
  selector: 'ex-31', standalone: true,
  providers: [{ provide: SORT_STRATEGY, useClass: AscSort }],
  template: `<p>{{ sorted.join(', ') }}</p>`
})
class Ex31 {
  private strategy = inject(SORT_STRATEGY);
  sorted = this.strategy.sort([3, 1, 4, 1, 5, 9, 2]);
}

// 32. Service provided at feature level
@Injectable()
class FeatureStateService { active = signal(false); toggle() { this.active.update(b => !b); } }

@Component({
  selector: 'ex-32', standalone: true,
  providers: [FeatureStateService],
  template: `<p>Feature: {{ fs.active() ? 'ON' : 'OFF' }}</p><button (click)="fs.toggle()">Toggle</button>`
})
class Ex32 { fs = inject(FeatureStateService); }

// 33. Service depending on InjectionToken
const BASE_URL = new InjectionToken<string>('BASE_URL');

@Injectable()
class ApiService {
  private base = inject(BASE_URL);
  getUrl(path: string) { return `${this.base}${path}`; }
}

@Component({
  selector: 'ex-33', standalone: true,
  providers: [
    { provide: BASE_URL, useValue: 'https://api.example.com' },
    ApiService,
  ],
  template: `<p>{{ url }}</p>`
})
class Ex33 { url = inject(ApiService).getUrl('/users'); }

// 34. Service with multiple computed properties from different sources
@Injectable({ providedIn: 'root' })
class DashboardService {
  private user = inject(UserService);
  private perms = inject(PermissionService);
  summary = computed(() => `${this.user.currentUser().name} | canEdit: ${this.perms.canEdit()}`);
}

@Component({ selector: 'ex-34', standalone: true, template: `<p>{{ ds.summary() }}</p>` })
class Ex34 { ds = inject(DashboardService); }

// 35. Service with HTTP (simulated with of())
@Injectable({ providedIn: 'root' })
class MockApiService {
  getUsers() { return of([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]); }
}

@Component({
  selector: 'ex-35', standalone: true,
  template: `<ul>@for (u of users; track u.id) { <li>{{ u.name }}</li> }</ul>`
})
class Ex35 implements OnInit {
  users: { id: number; name: string }[] = [];
  private api = inject(MockApiService);
  ngOnInit() { this.api.getUsers().subscribe(u => this.users = u); }
}

// 36. Service with action history
@Injectable({ providedIn: 'root' })
class HistoryService {
  private history = signal<string[]>([]);
  record(action: string) { this.history.update(h => [...h, action]); }
  log = computed(() => this.history());
}

@Component({
  selector: 'ex-36', standalone: true,
  template: `
    <button (click)="hs.record('click')">Do Action</button>
    <ul>@for (a of hs.log(); track $index) { <li>{{ $index + 1 }}. {{ a }}</li> }</ul>
  `
})
class Ex36 { hs = inject(HistoryService); }

// 37. Multiple services in one component
@Component({
  selector: 'ex-37', standalone: true,
  template: `<p>{{ greeting }} | theme: {{ theme }} | score: {{ score }}</p>`
})
class Ex37 {
  greeting = inject(GreetService).greet('DI');
  theme = inject(ThemeService).theme();
  score = inject(ScoreService).score();
}

// 38. Service with DestroyRef for automatic cleanup
@Injectable()
class TimerService {
  ticks = signal(0);
  constructor() {
    const dr = inject(DestroyRef);
    const id = setInterval(() => this.ticks.update(n => n + 1), 1000);
    dr.onDestroy(() => clearInterval(id));
  }
}

@Component({
  selector: 'ex-38', standalone: true,
  providers: [TimerService],
  template: `<p>Service ticks: {{ ts.ticks() }}</p>`
})
class Ex38 { ts = inject(TimerService); }

// ─── ADVANCED (39–50) ─────────────────────────────────────────

// 39. Generic typed service
@Injectable({ providedIn: 'root' })
class StoreService<T> {
  private items = signal<T[]>([]);
  getAll = computed(() => this.items());
  add(item: T) { this.items.update(arr => [...arr, item]); }
  remove(index: number) { this.items.update(arr => arr.filter((_, i) => i !== index)); }
}

@Injectable({ providedIn: 'root' })
class StringStoreService extends StoreService<string> {}

@Component({
  selector: 'ex-39', standalone: true,
  template: `
    <ul>@for (s of store.getAll(); track $index) { <li>{{ s }} <button (click)="store.remove($index)">x</button></li> }</ul>
    <button (click)="store.add('Item ' + (store.getAll().length + 1))">Add</button>
  `
})
class Ex39 { store = inject(StringStoreService); }

// 40. Factory provider with deps
const FULL_URL = new InjectionToken<string>('FULL_URL');
const PATH_TOKEN = new InjectionToken<string>('PATH_TOKEN');

@Component({
  selector: 'ex-40', standalone: true,
  providers: [
    { provide: BASE_URL, useValue: 'https://app.example.com' },
    { provide: PATH_TOKEN, useValue: '/dashboard' },
    { provide: FULL_URL, useFactory: (base: string, path: string) => base + path, deps: [BASE_URL, PATH_TOKEN] },
  ],
  template: `<p>Full URL: {{ url }}</p>`
})
class Ex40 { url = inject(FULL_URL); }

// 41. forwardRef — resolving circular service reference
@Injectable({ providedIn: 'root' })
class NodeService {
  private parentRef = inject(forwardRef(() => RootNodeService) as any, { optional: true });
  getParentName(): string { return this.parentRef?.name ?? 'no parent'; }
}

@Injectable({ providedIn: 'root' })
class RootNodeService { name = 'RootNode'; }

@Component({ selector: 'ex-41', standalone: true, template: `<p>Parent: {{ ns.getParentName() }}</p>` })
class Ex41 { ns = inject(NodeService); }

// 42. inject() outside constructor — in a function
function createLabel(prefix: string): string {
  const cfg = inject(AppConfigService);
  return `${prefix} - ${cfg.appName}`;
}

@Component({ selector: 'ex-42', standalone: true, template: `<p>{{ label }}</p>` })
class Ex42 { label = createLabel('App'); }

// 43. APP_INITIALIZER concept demo
function initFactory(): () => Promise<void> {
  return () => new Promise(resolve => setTimeout(() => { console.log('APP_INITIALIZER done'); resolve(); }, 10));
}

@Component({
  selector: 'ex-43', standalone: true,
  providers: [{ provide: APP_INITIALIZER, useFactory: initFactory, multi: true }],
  template: `<p>APP_INITIALIZER runs before bootstrap (check console)</p>`
})
class Ex43 {}

// 44. Tree-shakable token with factory
const FEATURE_FLAGS = new InjectionToken<{ darkMode: boolean; betaFeature: boolean }>('FEATURE_FLAGS', {
  providedIn: 'root',
  factory: () => ({ darkMode: false, betaFeature: true }),
});

@Component({ selector: 'ex-44', standalone: true, template: `<p>Beta: {{ flags.betaFeature }} | Dark: {{ flags.darkMode }}</p>` })
class Ex44 { flags = inject(FEATURE_FLAGS); }

// 45. Service with DestroyRef.onDestroy in constructor
@Injectable()
class WatchdogService {
  alive = signal(true);
  constructor() {
    inject(DestroyRef).onDestroy(() => { this.alive.set(false); console.log('WatchdogService destroyed'); });
  }
}

@Component({
  selector: 'ex-45', standalone: true,
  providers: [WatchdogService],
  template: `<p>Watchdog alive: {{ ws.alive() }}</p>`
})
class Ex45 { ws = inject(WatchdogService); }

// 46. inject() in standalone component providers array
@Injectable()
class LocalIdService { id = Math.random().toString(36).slice(2, 8); }

@Component({
  selector: 'ex-46', standalone: true,
  providers: [LocalIdService],
  template: `<p>Component instance ID: {{ svc.id }}</p>`
})
class Ex46 { svc = inject(LocalIdService); }

// 47. Service with signal + effect logging to service
@Injectable({ providedIn: 'root' })
class AuditService {
  log = signal<{ action: string; at: string }[]>([]);
  record(action: string) { this.log.update(l => [...l, { action, at: new Date().toISOString() }]); }
}

@Injectable({ providedIn: 'root' })
class AuthService {
  isLoggedIn = signal(false);
  private audit = inject(AuditService);
  login() { this.isLoggedIn.set(true); this.audit.record('login'); }
  logout() { this.isLoggedIn.set(false); this.audit.record('logout'); }
}

@Component({
  selector: 'ex-47', standalone: true,
  template: `
    <p>Logged in: {{ auth.isLoggedIn() }}</p>
    <button (click)="auth.login()">Login</button>
    <button (click)="auth.logout()">Logout</button>
    <ul>@for (e of audit.log(); track $index) { <li>{{ e.action }} @ {{ e.at | slice:11:19 }}</li> }</ul>
  `
})
class Ex47 { auth = inject(AuthService); audit = inject(AuditService); }

// 48. Platform-level service pattern (environment-scoped)
const PLATFORM_ID_TOKEN = new InjectionToken<string>('PLATFORM_ID_TOKEN', { factory: () => 'browser' });

@Component({ selector: 'ex-48', standalone: true, template: `<p>Platform: {{ platform }}</p>` })
class Ex48 { platform = inject(PLATFORM_ID_TOKEN); }

// 49. Service with signal + RxJS interop via toObservable
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
class SearchService {
  query = signal('');
  results = signal<string[]>([]);
  private items = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];
  search(q: string) {
    this.query.set(q);
    this.results.set(this.items.filter(i => i.toLowerCase().includes(q.toLowerCase())));
  }
}

@Component({
  selector: 'ex-49', standalone: true,
  template: `
    <input [value]="ss.query()" (input)="ss.search($any($event).target.value)" placeholder="Search..." />
    <ul>@for (r of ss.results(); track r) { <li>{{ r }}</li> }</ul>
  `
})
class Ex49 { ss = inject(SearchService); }

// 50. Full DI pattern — service composing multiple services + signals + effect
@Injectable({ providedIn: 'root' })
class AppStateService {
  private auth = inject(AuthService);
  private cart = inject(CartService);
  private perms = inject(PermissionService);
  summary = computed(() => ({
    user: inject(UserService).currentUser().name,
    loggedIn: this.auth.isLoggedIn(),
    cartItems: this.cart.items().length,
    canEdit: this.perms.canEdit(),
  }));
}

@Component({
  selector: 'ex-50', standalone: true,
  template: `
    <p>User: {{ state.summary().user }}</p>
    <p>LoggedIn: {{ state.summary().loggedIn }}</p>
    <p>Cart: {{ state.summary().cartItems }} items</p>
    <p>CanEdit: {{ state.summary().canEdit }}</p>
  `
})
class Ex50 { state = inject(AppStateService); }

// ─── App Root ─────────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    Ex01, Ex02, Ex03, Ex04, Ex05, Ex06, Ex07, Ex08, Ex09, Ex10,
    Ex11, Ex12, Ex13, Ex14, Ex15, Ex16, Ex17, Ex18, Ex19, Ex20,
    Ex21, Ex22, Ex23, Ex24, Ex25, Ex26, Ex27, Ex28, Ex29, Ex30,
    Ex31, Ex32, Ex33, Ex34, Ex35, Ex36, Ex37, Ex38, Ex39, Ex40,
    Ex41, Ex42, Ex43, Ex44, Ex45, Ex46, Ex47, Ex48, Ex49, Ex50,
  ],
  template: `
    <div style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:20px">
      <h1>Examples 3.2 — Services &amp; Dependency Injection</h1>
      <h4>1. @Injectable() with providedIn:'root'</h4><ex-01 /><hr />
      <h4>2. inject() basics</h4><ex-02 /><hr />
      <h4>3. Simple service with methods</h4><ex-03 /><hr />
      <h4>4. Service with a property</h4><ex-04 /><hr />
      <h4>5. Injecting Router</h4><ex-05 /><hr />
      <h4>6. Service with signal</h4><ex-06 /><hr />
      <h4>7. Service with computed</h4><ex-07 /><hr />
      <h4>8. Service with array data</h4><ex-08 /><hr />
      <h4>9. Injecting HttpClient</h4><ex-09 /><hr />
      <h4>10. Service as utility — string helper</h4><ex-10 /><hr />
      <h4>11. Service with state and reset</h4><ex-11 /><hr />
      <h4>12. Service with boolean flag (modal)</h4><ex-12 /><hr />
      <h4>13. Service with localStorage persistence</h4><ex-13 /><hr />
      <h4>14. InjectionToken with useValue</h4><ex-14 /><hr />
      <h4>15. useClass — swap implementation</h4><ex-15 /><hr />
      <h4>16. useFactory — factory provider</h4><ex-16 /><hr />
      <h4>17. useExisting — alias token</h4><ex-17 /><hr />
      <h4>18. multi providers</h4><ex-18 /><hr />
      <h4>19. Hierarchical injection — component-level</h4><ex-19 /><hr />
      <h4>20. Service with effect logging</h4><ex-20 /><hr />
      <h4>21. Service lazy creation pattern</h4><ex-21 /><hr />
      <h4>22. InjectionToken with factory default</h4><ex-22 /><hr />
      <h4>23. Service with computed chain (cart)</h4><ex-23 /><hr />
      <h4>24. Service with environment config injection</h4><ex-24 /><hr />
      <h4>25. Service with RxJS + takeUntilDestroyed</h4><ex-25 /><hr />
      <h4>26. Service with optional dependency</h4><ex-26 /><hr />
      <h4>27. Services injecting other services</h4><ex-27 /><hr />
      <h4>28. Circular dependency avoidance via forwardRef</h4><ex-28 /><hr />
      <h4>29. Service provided in component tree</h4><ex-29 /><hr />
      <h4>30. Child component overriding parent service</h4><ex-30 /><hr />
      <h4>31. Token-based strategy pattern</h4><ex-31 /><hr />
      <h4>32. Service provided at feature level</h4><ex-32 /><hr />
      <h4>33. Service depending on InjectionToken</h4><ex-33 /><hr />
      <h4>34. Dashboard service composing two services</h4><ex-34 /><hr />
      <h4>35. Service with simulated HTTP (of())</h4><ex-35 /><hr />
      <h4>36. Service with action history</h4><ex-36 /><hr />
      <h4>37. Multiple services in one component</h4><ex-37 /><hr />
      <h4>38. Service with DestroyRef auto-cleanup</h4><ex-38 /><hr />
      <h4>39. Generic typed service</h4><ex-39 /><hr />
      <h4>40. Factory provider with deps</h4><ex-40 /><hr />
      <h4>41. forwardRef — circular service reference</h4><ex-41 /><hr />
      <h4>42. inject() in a utility function</h4><ex-42 /><hr />
      <h4>43. APP_INITIALIZER concept demo</h4><ex-43 /><hr />
      <h4>44. Tree-shakable token with factory</h4><ex-44 /><hr />
      <h4>45. Service with DestroyRef in constructor</h4><ex-45 /><hr />
      <h4>46. inject() in standalone providers array</h4><ex-46 /><hr />
      <h4>47. Auth + Audit service composition</h4><ex-47 /><hr />
      <h4>48. Platform-level service pattern</h4><ex-48 /><hr />
      <h4>49. Service with signal + search</h4><ex-49 /><hr />
      <h4>50. Full DI — AppState composing many services</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
