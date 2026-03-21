import {
  Component,
  Injectable,
  inject,
  signal,
  computed,
  effect,
  InjectionToken,
  Injector,
  runInInjectionContext,
  DestroyRef,
  APP_INITIALIZER,
  ENVIRONMENT_INITIALIZER,
  PLATFORM_ID,
  makeEnvironmentProviders,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, Subject, of } from 'rxjs';
import { map, take, delay, shareReplay, catchError } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

// ============================================================
// Examples 3.5 (signals) — Services & Dependency Injection with Signals (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. @Injectable({ providedIn: 'root' }) basic service
@Injectable({ providedIn: 'root' })
class GreetingService {
  greet(name: string) { return `Hello, ${name}!`; }
}

@Component({
  selector: 'ex-01',
  standalone: true,
  template: `<p style="background:#e3f2fd;padding:6px;border-radius:4px">{{ msg }}</p>`,
})
class Ex01 {
  private svc = inject(GreetingService);
  msg = this.svc.greet('Angular');
}

// 2. Service with a simple method
@Injectable({ providedIn: 'root' })
class MathService {
  square(n: number) { return n * n; }
  cube(n: number) { return n * n * n; }
}

@Component({
  selector: 'ex-02',
  standalone: true,
  template: `
    <div style="background:#e8f5e9;padding:6px;border-radius:4px">
      <div>square(7) = {{ sq }}</div>
      <div>cube(4) = {{ cu }}</div>
    </div>
  `,
})
class Ex02 {
  private math = inject(MathService);
  sq = this.math.square(7);
  cu = this.math.cube(4);
}

// 3. Service with a signal property
@Injectable({ providedIn: 'root' })
class VisitorService {
  count = signal(0);
  increment() { this.count.update(c => c + 1); }
}

@Component({
  selector: 'ex-03',
  standalone: true,
  template: `
    <div style="background:#fff9c4;padding:6px;border-radius:4px">
      Visitors: {{ svc.count() }}
      <button (click)="svc.increment()" style="margin-left:8px;padding:2px 8px">+1</button>
    </div>
  `,
})
class Ex03 {
  svc = inject(VisitorService);
}

// 4. Service with computed signal
@Injectable({ providedIn: 'root' })
class PriceService {
  basePrice = signal(100);
  taxRate = signal(0.2);
  totalPrice = computed(() => this.basePrice() * (1 + this.taxRate()));
}

@Component({
  selector: 'ex-04',
  standalone: true,
  template: `
    <div style="background:#f3e5f5;padding:6px;border-radius:4px">
      Base: ${{ svc.basePrice() }} | Tax: {{ svc.taxRate() * 100 }}% | Total: ${{ svc.totalPrice().toFixed(2) }}
      <button (click)="svc.basePrice.set(200)" style="margin-left:8px;padding:2px 8px">Set $200</button>
    </div>
  `,
})
class Ex04 {
  svc = inject(PriceService);
}

// 5. inject() in component constructor alternative
@Injectable({ providedIn: 'root' })
class ConfigService5 {
  appName = 'Angular DI Demo';
}

@Component({
  selector: 'ex-05',
  standalone: true,
  template: `<p style="background:#e0f2f1;padding:6px;border-radius:4px">App: {{ appName }}</p>`,
})
class Ex05 {
  private config: ConfigService5;
  appName: string;
  constructor() {
    this.config = inject(ConfigService5);
    this.appName = this.config.appName;
  }
}

// 6. inject() in field initializer
@Injectable({ providedIn: 'root' })
class TaglineService {
  tagline = signal('Build. Learn. Ship.');
}

@Component({
  selector: 'ex-06',
  standalone: true,
  template: `<p style="background:#fce4ec;padding:6px;border-radius:4px;font-style:italic">{{ svc.tagline() }}</p>`,
})
class Ex06 {
  svc = inject(TaglineService); // inject() in field initializer
}

// 7. Service with effect() for side effects
@Injectable({ providedIn: 'root' })
class DarkModeService {
  isDark = signal(false);
}

@Component({
  selector: 'ex-07',
  standalone: true,
  template: `
    <div [style.background]="svc.isDark() ? '#1a1a2e' : '#fff'"
         [style.color]="svc.isDark() ? '#fff' : '#333'"
         style="padding:8px;border-radius:4px;border:1px solid #ccc;transition:all .3s">
      Dark mode: {{ svc.isDark() }}
      <button (click)="svc.isDark.update(v => !v)" style="margin-left:8px;padding:2px 8px">Toggle</button>
    </div>
  `,
})
class Ex07 {
  svc = inject(DarkModeService);
  constructor() {
    effect(() => {
      document.body.style.background = this.svc.isDark() ? '#1a1a2e' : '';
    });
  }
}

// 8. CounterService: count signal + increment/decrement/reset
@Injectable({ providedIn: 'root' })
class CounterService {
  count = signal(0);
  increment() { this.count.update(c => c + 1); }
  decrement() { this.count.update(c => c - 1); }
  reset() { this.count.set(0); }
}

@Component({
  selector: 'ex-08',
  standalone: true,
  template: `
    <div style="background:#e3f2fd;padding:8px;border-radius:4px">
      <span style="font-size:20px;font-weight:bold;margin:0 8px">{{ svc.count() }}</span>
      <button (click)="svc.decrement()" style="padding:2px 8px">−</button>
      <button (click)="svc.increment()" style="padding:2px 8px;margin:0 4px">+</button>
      <button (click)="svc.reset()" style="padding:2px 8px">Reset</button>
    </div>
  `,
})
class Ex08 {
  svc = inject(CounterService);
}

// 9. ThemeService: theme signal + toggle()
@Injectable({ providedIn: 'root' })
class ThemeService {
  theme = signal<'light' | 'dark'>('light');
  toggle() { this.theme.update(t => t === 'light' ? 'dark' : 'light'); }
  isDark = computed(() => this.theme() === 'dark');
}

@Component({
  selector: 'ex-09',
  standalone: true,
  template: `
    <div [style.background]="svc.isDark() ? '#263238' : '#ECEFF1'"
         [style.color]="svc.isDark() ? '#ECEFF1' : '#263238'"
         style="padding:8px;border-radius:4px;transition:all .3s">
      Theme: {{ svc.theme() }}
      <button (click)="svc.toggle()" style="margin-left:8px;padding:2px 8px">Toggle Theme</button>
    </div>
  `,
})
class Ex09 {
  svc = inject(ThemeService);
}

// 10. LoggerService: logs signal array + log()
@Injectable({ providedIn: 'root' })
class LoggerService {
  logs = signal<string[]>([]);
  log(msg: string) {
    this.logs.update(l => [...l, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }
  clear() { this.logs.set([]); }
}

@Component({
  selector: 'ex-10',
  standalone: true,
  template: `
    <div style="background:#fff8e1;padding:8px;border-radius:4px">
      <div style="display:flex;gap:6px;margin-bottom:6px">
        <button (click)="svc.log('Event A')" style="padding:2px 8px">Log A</button>
        <button (click)="svc.log('Event B')" style="padding:2px 8px">Log B</button>
        <button (click)="svc.clear()" style="padding:2px 8px">Clear</button>
      </div>
      <div style="font-family:monospace;font-size:11px;max-height:80px;overflow:auto">
        @for (line of svc.logs(); track line) {
          <div>{{ line }}</div>
        }
        @if (svc.logs().length === 0) { <em style="color:#aaa">No logs yet.</em> }
      </div>
    </div>
  `,
})
class Ex10 {
  svc = inject(LoggerService);
}

// 11. NotificationService: notifications signal + add/dismiss
@Injectable({ providedIn: 'root' })
class NotificationService {
  notifications = signal<{ id: number; msg: string }[]>([]);
  private nextId = 0;
  add(msg: string) {
    this.notifications.update(n => [...n, { id: ++this.nextId, msg }]);
  }
  dismiss(id: number) {
    this.notifications.update(n => n.filter(x => x.id !== id));
  }
}

@Component({
  selector: 'ex-11',
  standalone: true,
  template: `
    <div style="background:#e8f5e9;padding:8px;border-radius:4px">
      <button (click)="svc.add('New notification!')" style="padding:2px 8px;margin-bottom:6px">Add Notification</button>
      @for (n of svc.notifications(); track n.id) {
        <div style="display:flex;justify-content:space-between;align-items:center;background:#c8e6c9;padding:4px 8px;border-radius:3px;margin-bottom:2px">
          <span style="font-size:13px">{{ n.msg }}</span>
          <button (click)="svc.dismiss(n.id)" style="font-size:11px;padding:1px 6px">✕</button>
        </div>
      }
      @if (svc.notifications().length === 0) { <em style="color:#aaa;font-size:12px">No notifications.</em> }
    </div>
  `,
})
class Ex11 {
  svc = inject(NotificationService);
}

// 12. UserService: currentUser signal + login/logout
@Injectable({ providedIn: 'root' })
class UserService12 {
  currentUser = signal<{ name: string; email: string } | null>(null);
  isLoggedIn = computed(() => !!this.currentUser());
  login(name: string, email: string) { this.currentUser.set({ name, email }); }
  logout() { this.currentUser.set(null); }
}

@Component({
  selector: 'ex-12',
  standalone: true,
  template: `
    <div style="background:#e3f2fd;padding:8px;border-radius:4px">
      @if (svc.isLoggedIn()) {
        <div>Welcome, <strong>{{ svc.currentUser()?.name }}</strong> ({{ svc.currentUser()?.email }})</div>
        <button (click)="svc.logout()" style="padding:2px 8px;margin-top:4px">Logout</button>
      } @else {
        <div style="color:#aaa;font-size:13px;margin-bottom:4px">Not logged in</div>
        <button (click)="svc.login('Alice','alice@example.com')" style="padding:2px 8px">Login as Alice</button>
      }
    </div>
  `,
})
class Ex12 {
  svc = inject(UserService12);
}

// 13. CartService: items signal + computed total
@Injectable({ providedIn: 'root' })
class CartService {
  items = signal<{ name: string; price: number }[]>([]);
  total = computed(() => this.items().reduce((s, i) => s + i.price, 0));
  add(item: { name: string; price: number }) { this.items.update(l => [...l, item]); }
  clear() { this.items.set([]); }
}

@Component({
  selector: 'ex-13',
  standalone: true,
  template: `
    <div style="background:#fff9c4;padding:8px;border-radius:4px">
      <div style="display:flex;gap:4px;margin-bottom:6px">
        <button (click)="svc.add({name:'Apple',price:1.5})" style="padding:2px 8px">+ Apple $1.50</button>
        <button (click)="svc.add({name:'Bread',price:2.99})" style="padding:2px 8px">+ Bread $2.99</button>
        <button (click)="svc.clear()" style="padding:2px 8px">Clear</button>
      </div>
      @for (item of svc.items(); track item.name) {
        <div style="font-size:13px">{{ item.name }} — ${{ item.price }}</div>
      }
      <div style="font-weight:bold;margin-top:4px;border-top:1px solid #ccc;padding-top:4px">
        Total: ${{ svc.total().toFixed(2) }}
      </div>
    </div>
  `,
})
class Ex13 {
  svc = inject(CartService);
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────

// 14. InjectionToken for config value
const APP_CONFIG = new InjectionToken<{ apiUrl: string; debug: boolean }>('APP_CONFIG', {
  providedIn: 'root',
  factory: () => ({ apiUrl: 'https://api.example.com', debug: false }),
});

@Component({
  selector: 'ex-14',
  standalone: true,
  template: `
    <div style="background:#e0f2f1;padding:8px;border-radius:4px;font-size:13px">
      <strong>InjectionToken APP_CONFIG</strong>
      <div>apiUrl: <code>{{ config.apiUrl }}</code></div>
      <div>debug: <code>{{ config.debug }}</code></div>
    </div>
  `,
})
class Ex14 {
  config = inject(APP_CONFIG);
}

// 15. useValue provider
const SITE_TITLE = new InjectionToken<string>('SITE_TITLE');

@Component({
  selector: 'ex-15',
  standalone: true,
  providers: [{ provide: SITE_TITLE, useValue: 'My Angular App' }],
  template: `
    <div style="background:#e8eaf6;padding:8px;border-radius:4px;font-size:13px">
      <strong>useValue provider</strong>
      <div>SITE_TITLE: <code>{{ title }}</code></div>
    </div>
  `,
})
class Ex15 {
  title = inject(SITE_TITLE);
}

// 16. useClass provider (swap implementation)
abstract class LogService16 { abstract log(msg: string): void; }

@Injectable()
class ConsoleLogService16 extends LogService16 {
  log(msg: string) { console.log('[ConsoleLog]', msg); }
}

@Injectable()
class SilentLogService16 extends LogService16 {
  log(_msg: string) { /* silent */ }
}

@Component({
  selector: 'ex-16',
  standalone: true,
  providers: [{ provide: LogService16, useClass: ConsoleLogService16 }],
  template: `
    <div style="background:#fce4ec;padding:8px;border-radius:4px;font-size:13px">
      <strong>useClass provider</strong>
      <pre style="margin:4px 0;font-size:11px">{{ '{' }} provide: LogService, useClass: ConsoleLogService {{ '}' }}</pre>
      <button (click)="log.log('Hello!')" style="padding:2px 8px;font-size:12px">Log (check console)</button>
    </div>
  `,
})
class Ex16 {
  log = inject(LogService16);
}

// 17. useFactory provider with deps
@Injectable({ providedIn: 'root' })
class EnvService17 {
  env = signal<'prod' | 'dev'>('dev');
}

const API_URL_TOKEN = new InjectionToken<string>('API_URL');

@Component({
  selector: 'ex-17',
  standalone: true,
  providers: [
    {
      provide: API_URL_TOKEN,
      useFactory: (env: EnvService17) => env.env() === 'prod' ? 'https://api.prod.com' : 'https://api.dev.com',
      deps: [EnvService17],
    },
  ],
  template: `
    <div style="background:#e8f5e9;padding:8px;border-radius:4px;font-size:13px">
      <strong>useFactory provider with deps</strong>
      <div>env: <code>{{ env.env() }}</code></div>
      <div>API_URL: <code>{{ url }}</code></div>
    </div>
  `,
})
class Ex17 {
  env = inject(EnvService17);
  url = inject(API_URL_TOKEN);
}

// 18. useExisting provider (alias)
@Injectable({ providedIn: 'root' })
class PrimaryCache {
  get(key: string) { return `value_for_${key}`; }
}

const CACHE_TOKEN = new InjectionToken<PrimaryCache>('CACHE_TOKEN');

@Component({
  selector: 'ex-18',
  standalone: true,
  providers: [{ provide: CACHE_TOKEN, useExisting: PrimaryCache }],
  template: `
    <div style="background:#fff9c4;padding:8px;border-radius:4px;font-size:13px">
      <strong>useExisting provider (alias)</strong>
      <div>CACHE_TOKEN.get('user'): <code>{{ cache.get('user') }}</code></div>
      <div style="font-size:11px;color:#555">Both tokens resolve to same PrimaryCache instance</div>
    </div>
  `,
})
class Ex18 {
  cache = inject(CACHE_TOKEN);
}

// 19. multi: true provider
const VALIDATORS_TOKEN = new InjectionToken<((v: string) => string | null)[]>('VALIDATORS');

@Component({
  selector: 'ex-19',
  standalone: true,
  providers: [
    { provide: VALIDATORS_TOKEN, useValue: (v: string) => v.length < 3 ? 'Too short' : null, multi: true },
    { provide: VALIDATORS_TOKEN, useValue: (v: string) => !v.includes('@') ? 'Missing @' : null, multi: true },
  ],
  template: `
    <div style="background:#f3e5f5;padding:8px;border-radius:4px;font-size:13px">
      <strong>multi: true provider — validator collection</strong>
      <input [(ngModel)]="val" placeholder="Type value" style="padding:3px;border:1px solid #ccc;width:200px;margin:4px 0;display:block" />
      @for (err of errors(); track err) {
        <div style="color:red;font-size:11px">• {{ err }}</div>
      }
      @if (errors().length === 0 && val) { <div style="color:green;font-size:11px">Valid!</div> }
    </div>
  `,
})
class Ex19 {
  validators = inject(VALIDATORS_TOKEN);
  val = '';
  errors = computed(() => this.validators.map(v => v(this.val)).filter(Boolean) as string[]);
}

// 20. Component-level provider (providers: [] in @Component)
@Injectable()
class LocalCounterService {
  count = signal(0);
  inc() { this.count.update(c => c + 1); }
}

@Component({
  selector: 'ex-20',
  standalone: true,
  providers: [LocalCounterService],
  template: `
    <div style="background:#e3f2fd;padding:8px;border-radius:4px;font-size:13px">
      <strong>Component-level provider (own instance)</strong>
      <div>Count: {{ svc.count() }}</div>
      <button (click)="svc.inc()" style="padding:2px 8px;margin-top:4px">+1 (local)</button>
    </div>
  `,
})
class Ex20 {
  svc = inject(LocalCounterService);
}

// 21. Service injecting another service
@Injectable({ providedIn: 'root' })
class FormatService {
  currency(n: number) { return `$${n.toFixed(2)}`; }
}

@Injectable({ providedIn: 'root' })
class InvoiceService {
  private fmt = inject(FormatService);
  formatTotal(n: number) { return this.fmt.currency(n); }
}

@Component({
  selector: 'ex-21',
  standalone: true,
  template: `
    <div style="background:#e8f5e9;padding:8px;border-radius:4px;font-size:13px">
      <strong>Service injecting another service</strong>
      <div>Invoice total: {{ svc.formatTotal(1234.5) }}</div>
    </div>
  `,
})
class Ex21 {
  svc = inject(InvoiceService);
}

// 22. Hierarchical DI — child overrides parent service
@Injectable()
class ColorService {
  primary = signal('#2196F3');
}

@Injectable()
class RedColorService extends ColorService {
  constructor() { super(); this.primary.set('#F44336'); }
}

@Component({
  selector: 'ex-22-child',
  standalone: true,
  providers: [{ provide: ColorService, useClass: RedColorService }],
  template: `<span [style.color]="svc.primary()">Child uses RedColorService: {{ svc.primary() }}</span>`,
})
class Ex22Child {
  svc = inject(ColorService);
}

@Component({
  selector: 'ex-22',
  standalone: true,
  imports: [Ex22Child],
  providers: [ColorService],
  template: `
    <div style="background:#fff9c4;padding:8px;border-radius:4px;font-size:13px">
      <strong>Hierarchical DI</strong>
      <div [style.color]="parentSvc.primary()">Parent uses ColorService: {{ parentSvc.primary() }}</div>
      <ex-22-child />
    </div>
  `,
})
class Ex22 {
  parentSvc = inject(ColorService);
}

// 23. APP_INITIALIZER for startup logic
const appInitDone = signal(false);

@Component({
  selector: 'ex-23',
  standalone: true,
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {
        appInitDone.set(true);
        return Promise.resolve();
      },
      multi: true,
    },
  ],
  template: `
    <div style="background:#e0f2f1;padding:8px;border-radius:4px;font-size:13px">
      <strong>APP_INITIALIZER</strong>
      <pre style="margin:4px 0;font-size:11px">{{ '{' }} provide: APP_INITIALIZER, useFactory: () => () => Promise.resolve(), multi: true {{ '}' }}</pre>
      <div>Init done: <code>{{ done() }}</code></div>
    </div>
  `,
})
class Ex23 {
  done = appInitDone;
}

// 24. ENVIRONMENT_INITIALIZER
const envInitRan = signal(false);

@Component({
  selector: 'ex-24',
  standalone: true,
  providers: [
    {
      provide: ENVIRONMENT_INITIALIZER,
      useValue: () => { envInitRan.set(true); },
      multi: true,
    },
  ],
  template: `
    <div style="background:#fce4ec;padding:8px;border-radius:4px;font-size:13px">
      <strong>ENVIRONMENT_INITIALIZER</strong>
      <pre style="margin:4px 0;font-size:11px">{{ '{' }} provide: ENVIRONMENT_INITIALIZER, useValue: () => init(), multi: true {{ '}' }}</pre>
      <div>Ran: <code>{{ ran() }}</code></div>
    </div>
  `,
})
class Ex24 {
  ran = envInitRan;
}

// 25. Service with localStorage persistence (effect → localStorage)
@Injectable({ providedIn: 'root' })
class PersistedSettingsService {
  fontSize = signal<number>(
    parseInt(typeof localStorage !== 'undefined' ? localStorage.getItem('fontSize') ?? '14' : '14', 10)
  );

  constructor() {
    effect(() => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('fontSize', String(this.fontSize()));
      }
    });
  }
}

@Component({
  selector: 'ex-25',
  standalone: true,
  template: `
    <div style="background:#e8eaf6;padding:8px;border-radius:4px;font-size:13px">
      <strong>Service with localStorage persistence via effect()</strong>
      <div [style.fontSize.px]="svc.fontSize()" style="margin:4px 0">Font size: {{ svc.fontSize() }}px</div>
      <div style="display:flex;gap:4px">
        <button (click)="svc.fontSize.update(n => n - 1)" style="padding:2px 8px">A-</button>
        <button (click)="svc.fontSize.update(n => n + 1)" style="padding:2px 8px">A+</button>
      </div>
    </div>
  `,
})
class Ex25 {
  svc = inject(PersistedSettingsService);
}

// 26. Service with BehaviorSubject + toSignal bridge
@Injectable({ providedIn: 'root' })
class BehaviorSubjectService {
  private subject$ = new BehaviorSubject<number>(0);
  value$ = this.subject$.asObservable();
  increment() { this.subject$.next(this.subject$.value + 1); }
}

@Component({
  selector: 'ex-26',
  standalone: true,
  template: `
    <div style="background:#e3f2fd;padding:8px;border-radius:4px;font-size:13px">
      <strong>BehaviorSubject + toSignal bridge</strong>
      <div>Value (signal): {{ valueSignal() }}</div>
      <button (click)="svc.increment()" style="padding:2px 8px;margin-top:4px">Increment</button>
    </div>
  `,
})
class Ex26 {
  svc = inject(BehaviorSubjectService);
  valueSignal = toSignal(this.svc.value$, { initialValue: 0 });
}

// ─── NESTED (27–38) ──────────────────────────────────────────

// 27. Two services sharing a third (base) service
@Injectable({ providedIn: 'root' })
class BaseDataService {
  data = signal(['item-1', 'item-2', 'item-3']);
}

@Injectable({ providedIn: 'root' })
class FilterService27 {
  private base = inject(BaseDataService);
  filtered = computed(() => this.base.data().filter(i => i.includes('1')));
}

@Injectable({ providedIn: 'root' })
class SortService27 {
  private base = inject(BaseDataService);
  sorted = computed(() => [...this.base.data()].sort().reverse());
}

@Component({
  selector: 'ex-27',
  standalone: true,
  template: `
    <div style="background:#e8f5e9;padding:8px;border-radius:4px;font-size:13px">
      <strong>Two services sharing BaseDataService</strong>
      <div>Filtered: {{ filter.filtered().join(', ') }}</div>
      <div>Sorted (desc): {{ sort.sorted().join(', ') }}</div>
    </div>
  `,
})
class Ex27 {
  filter = inject(FilterService27);
  sort = inject(SortService27);
}

// 28. Component tree using service at different levels
@Injectable()
class LevelService {
  name = 'Root Service';
}

@Component({
  selector: 'ex-28-leaf',
  standalone: true,
  template: `<span style="font-size:12px;color:#555">Leaf sees: {{ svc.name }}</span>`,
})
class Ex28Leaf {
  svc = inject(LevelService);
}

@Component({
  selector: 'ex-28',
  standalone: true,
  imports: [Ex28Leaf],
  providers: [LevelService],
  template: `
    <div style="background:#fff9c4;padding:8px;border-radius:4px;font-size:13px">
      <strong>Service at different tree levels</strong>
      <div>Parent: {{ svc.name }}</div>
      <ex-28-leaf />
    </div>
  `,
})
class Ex28 {
  svc = inject(LevelService);
}

// 29. Service with signal store pattern (full CRUD)
interface Todo29 { id: number; text: string; done: boolean; }

@Injectable({ providedIn: 'root' })
class TodoStore {
  private items = signal<Todo29[]>([]);
  readonly todos = this.items.asReadonly();
  remaining = computed(() => this.items().filter(t => !t.done).length);
  private nextId = 0;
  add(text: string) { this.items.update(l => [...l, { id: ++this.nextId, text, done: false }]); }
  toggle(id: number) { this.items.update(l => l.map(t => t.id === id ? { ...t, done: !t.done } : t)); }
  remove(id: number) { this.items.update(l => l.filter(t => t.id !== id)); }
}

@Component({
  selector: 'ex-29',
  standalone: true,
  template: `
    <div style="background:#e3f2fd;padding:8px;border-radius:4px;font-size:13px">
      <strong>Signal store CRUD (TodoStore)</strong>
      <div style="display:flex;gap:4px;margin-bottom:6px">
        <input #t placeholder="New todo" style="padding:3px;border:1px solid #ccc;flex:1" (keyup.enter)="store.add(t.value); t.value=''" />
        <button (click)="store.add(t.value); t.value=''" style="padding:2px 8px">Add</button>
      </div>
      @for (todo of store.todos(); track todo.id) {
        <div style="display:flex;align-items:center;gap:4px;margin-bottom:2px">
          <input type="checkbox" [checked]="todo.done" (change)="store.toggle(todo.id)" />
          <span [style.textDecoration]="todo.done ? 'line-through' : 'none'" style="flex:1">{{ todo.text }}</span>
          <button (click)="store.remove(todo.id)" style="font-size:10px;padding:1px 5px">✕</button>
        </div>
      }
      <div style="color:#555;margin-top:4px">Remaining: {{ store.remaining() }}</div>
    </div>
  `,
})
class Ex29 {
  store = inject(TodoStore);
}

// 30. Service with HTTP + toSignal
@Injectable({ providedIn: 'root' })
class PostsService30 {
  private http = inject(HttpClient);
  posts$ = this.http.get<{ id: number; title: string }[]>('https://jsonplaceholder.typicode.com/posts?_limit=3').pipe(
    catchError(() => of([{ id: 0, title: 'Mocked post (no HTTP)' }])),
    shareReplay(1)
  );
}

@Component({
  selector: 'ex-30',
  standalone: true,
  template: `
    <div style="background:#e8f5e9;padding:8px;border-radius:4px;font-size:13px">
      <strong>Service with HTTP + toSignal</strong>
      @if (posts()) {
        @for (p of posts()!; track p.id) {
          <div style="font-size:12px">{{ p.id }}. {{ p.title }}</div>
        }
      } @else {
        <em style="color:#aaa">Loading...</em>
      }
    </div>
  `,
})
class Ex30 {
  private svc = inject(PostsService30);
  posts = toSignal(this.svc.posts$);
}

// 31. Service with error + loading signals
@Injectable({ providedIn: 'root' })
class AsyncDataService {
  loading = signal(false);
  error = signal<string | null>(null);
  data = signal<string | null>(null);

  fetch() {
    this.loading.set(true);
    this.error.set(null);
    of('Fetched data successfully!').pipe(delay(600)).subscribe({
      next: d => { this.data.set(d); this.loading.set(false); },
      error: e => { this.error.set(e.message); this.loading.set(false); },
    });
  }
}

@Component({
  selector: 'ex-31',
  standalone: true,
  template: `
    <div style="background:#fff9c4;padding:8px;border-radius:4px;font-size:13px">
      <strong>Service with error + loading signals</strong>
      <button (click)="svc.fetch()" style="padding:2px 8px;margin-bottom:6px">Fetch Data</button>
      @if (svc.loading()) { <div style="color:#FF9800">Loading...</div> }
      @if (svc.error()) { <div style="color:red">Error: {{ svc.error() }}</div> }
      @if (svc.data() && !svc.loading()) { <div style="color:green">{{ svc.data() }}</div> }
    </div>
  `,
})
class Ex31 {
  svc = inject(AsyncDataService);
}

// 32. Service orchestrating multiple child services
@Injectable({ providedIn: 'root' })
class OrchestratorService {
  private counter = inject(CounterService);
  private cart = inject(CartService);
  private logger = inject(LoggerService);

  summary = computed(() =>
    `Counter: ${this.counter.count()} | Cart items: ${this.cart.items().length} | Logs: ${this.logger.logs().length}`
  );

  doAll() {
    this.counter.increment();
    this.cart.add({ name: 'Widget', price: 9.99 });
    this.logger.log('OrchestratorService.doAll() called');
  }
}

@Component({
  selector: 'ex-32',
  standalone: true,
  template: `
    <div style="background:#e0f7fa;padding:8px;border-radius:4px;font-size:13px">
      <strong>OrchestratorService — delegates to Counter + Cart + Logger</strong>
      <div style="margin:4px 0;font-size:12px">{{ svc.summary() }}</div>
      <button (click)="svc.doAll()" style="padding:2px 8px">Run All</button>
    </div>
  `,
})
class Ex32 {
  svc = inject(OrchestratorService);
}

// 33. Feature service with root service dependency
@Injectable({ providedIn: 'root' })
class RootConfigService {
  apiBase = signal('https://api.example.com');
}

@Injectable({ providedIn: 'root' })
class FeatureProductsService {
  private config = inject(RootConfigService);
  productsUrl = computed(() => `${this.config.apiBase()}/products`);
}

@Component({
  selector: 'ex-33',
  standalone: true,
  template: `
    <div style="background:#fce4ec;padding:8px;border-radius:4px;font-size:13px">
      <strong>Feature service depending on root service</strong>
      <div>Products URL: <code>{{ feature.productsUrl() }}</code></div>
    </div>
  `,
})
class Ex33 {
  feature = inject(FeatureProductsService);
}

// 34. Service with timer (polling)
@Injectable({ providedIn: 'root' })
class PollingService {
  tick = signal(0);
  private sub = interval(2000).pipe(take(10)).subscribe(() => this.tick.update(t => t + 1));
}

@Component({
  selector: 'ex-34',
  standalone: true,
  template: `
    <div style="background:#e3f2fd;padding:8px;border-radius:4px;font-size:13px">
      <strong>Service with interval timer (polling every 2s)</strong>
      <div>Poll tick: {{ svc.tick() }} <span style="font-size:11px;color:#999">(updates every 2s, max 10)</span></div>
    </div>
  `,
})
class Ex34 {
  svc = inject(PollingService);
}

// 35. Service with WebSocket simulation
@Injectable({ providedIn: 'root' })
class MockWebSocketService {
  messages = signal<string[]>([]);
  connected = signal(false);

  connect() {
    this.connected.set(true);
    of('msg-1', 'msg-2', 'msg-3').pipe(
      delay(500),
    ).subscribe(msg => {
      setTimeout(() => this.messages.update(m => [...m, msg]), Math.random() * 1000);
    });
  }

  disconnect() {
    this.connected.set(false);
    this.messages.set([]);
  }
}

@Component({
  selector: 'ex-35',
  standalone: true,
  template: `
    <div style="background:#e8f5e9;padding:8px;border-radius:4px;font-size:13px">
      <strong>Service with WebSocket simulation</strong>
      <div>Status: <span [style.color]="svc.connected() ? 'green' : 'red'">{{ svc.connected() ? 'Connected' : 'Disconnected' }}</span></div>
      <div style="display:flex;gap:4px;margin:4px 0">
        <button (click)="svc.connect()" style="padding:2px 8px">Connect</button>
        <button (click)="svc.disconnect()" style="padding:2px 8px">Disconnect</button>
      </div>
      @for (msg of svc.messages(); track msg) {
        <div style="font-family:monospace;font-size:11px;color:#2e7d32">▶ {{ msg }}</div>
      }
    </div>
  `,
})
class Ex35 {
  svc = inject(MockWebSocketService);
}

// 36. Service with undo/redo signal stack
@Injectable({ providedIn: 'root' })
class UndoRedoService {
  private history = signal<number[]>([0]);
  private pointer = signal(0);
  current = computed(() => this.history()[this.pointer()]);
  canUndo = computed(() => this.pointer() > 0);
  canRedo = computed(() => this.pointer() < this.history().length - 1);

  push(value: number) {
    const p = this.pointer();
    this.history.update(h => [...h.slice(0, p + 1), value]);
    this.pointer.update(x => x + 1);
  }
  undo() { if (this.canUndo()) this.pointer.update(p => p - 1); }
  redo() { if (this.canRedo()) this.pointer.update(p => p + 1); }
}

@Component({
  selector: 'ex-36',
  standalone: true,
  template: `
    <div style="background:#e8eaf6;padding:8px;border-radius:4px;font-size:13px">
      <strong>Service with undo/redo signal stack</strong>
      <div style="font-size:20px;font-weight:bold;margin:4px 0">{{ svc.current() }}</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">
        <button (click)="svc.push(svc.current() + 1)" style="padding:2px 8px">+1</button>
        <button (click)="svc.push(svc.current() * 2)" style="padding:2px 8px">×2</button>
        <button (click)="svc.undo()" [disabled]="!svc.canUndo()" style="padding:2px 8px">Undo</button>
        <button (click)="svc.redo()" [disabled]="!svc.canRedo()" style="padding:2px 8px">Redo</button>
      </div>
    </div>
  `,
})
class Ex36 {
  svc = inject(UndoRedoService);
}

// 37. Service provided in lazy-loaded feature (concept)
@Component({
  selector: 'ex-37',
  standalone: true,
  template: `
    <div style="background:#fff3e0;padding:8px;border-radius:4px;font-size:13px">
      <strong>Service provided in lazy-loaded feature module (concept)</strong>
      <pre style="margin:4px 0;font-size:11px">// feature.routes.ts
export const routes: Routes = [{{ '{' }}
  path: '',
  providers: [FeatureSpecificService],
  component: FeatureComponent
{{ '}' }}];

// FeatureSpecificService is only instantiated when
// the lazy route is loaded — not available globally.</pre>
    </div>
  `,
})
class Ex37 {}

// 38. Full authentication service (login/logout/token/user)
interface AuthUser { id: number; name: string; role: 'admin' | 'user'; }

@Injectable({ providedIn: 'root' })
class FullAuthService {
  private _token = signal<string | null>(null);
  private _user = signal<AuthUser | null>(null);

  token = this._token.asReadonly();
  user = this._user.asReadonly();
  isAuthenticated = computed(() => !!this._token());
  isAdmin = computed(() => this._user()?.role === 'admin');

  login(username: string, password: string): boolean {
    if (username === 'admin' && password === 'pass') {
      this._token.set('jwt-admin-token-abc');
      this._user.set({ id: 1, name: 'Admin User', role: 'admin' });
      return true;
    }
    return false;
  }

  logout() {
    this._token.set(null);
    this._user.set(null);
  }
}

@Component({
  selector: 'ex-38',
  standalone: true,
  template: `
    <div style="background:#e8f5e9;padding:8px;border-radius:4px;font-size:13px">
      <strong>Full AuthService (login/logout/token/user signals)</strong>
      @if (auth.isAuthenticated()) {
        <div>User: <strong>{{ auth.user()?.name }}</strong> | Role: {{ auth.user()?.role }} | Admin: {{ auth.isAdmin() }}</div>
        <button (click)="auth.logout()" style="padding:2px 8px;margin-top:4px">Logout</button>
      } @else {
        <div style="color:#aaa;margin-bottom:4px">Not authenticated</div>
        <div>
          <button (click)="tryLogin()" style="padding:2px 8px">Login (admin/pass)</button>
          <span style="margin-left:6px;font-size:11px;color:red">{{ errMsg }}</span>
        </div>
      }
    </div>
  `,
})
class Ex38 {
  auth = inject(FullAuthService);
  errMsg = '';
  tryLogin() {
    const ok = this.auth.login('admin', 'pass');
    this.errMsg = ok ? '' : 'Login failed';
  }
}

// ─── ADVANCED (39–50) ────────────────────────────────────────

// 39. Generic typed service (DataService<T>)
@Injectable()
class DataService<T> {
  items = signal<T[]>([]);
  add(item: T) { this.items.update(l => [...l, item]); }
  remove(predicate: (item: T) => boolean) { this.items.update(l => l.filter(i => !predicate(i))); }
  count = computed(() => this.items().length);
}

@Component({
  selector: 'ex-39',
  standalone: true,
  providers: [DataService],
  template: `
    <div style="background:#e3f2fd;padding:8px;border-radius:4px;font-size:13px">
      <strong>Generic DataService&lt;T&gt;</strong>
      <button (click)="svc.add('Item '+svc.count())" style="padding:2px 8px;margin-bottom:4px">Add Item</button>
      <div>Count: {{ svc.count() }}</div>
      @for (item of svc.items(); track item) {
        <div style="font-size:12px">• {{ item }}</div>
      }
    </div>
  `,
})
class Ex39 {
  svc = inject<DataService<string>>(DataService);
}

// 40. Service factory function
function createApiService(baseUrl: string) {
  @Injectable()
  class ApiService {
    readonly base = baseUrl;
    buildUrl(path: string) { return `${this.base}${path}`; }
  }
  return ApiService;
}

const UserApiService = createApiService('https://users.api.com');

@Component({
  selector: 'ex-40',
  standalone: true,
  providers: [UserApiService],
  template: `
    <div style="background:#e8f5e9;padding:8px;border-radius:4px;font-size:13px">
      <strong>Service factory function</strong>
      <div>Base: <code>{{ svc.base }}</code></div>
      <div>URL: <code>{{ svc.buildUrl('/users') }}</code></div>
    </div>
  `,
})
class Ex40 {
  svc = inject(UserApiService);
}

// 41. Tree-shakable token (InjectionToken with factory)
const ANALYTICS_SERVICE = new InjectionToken<{ track: (event: string) => void }>('ANALYTICS_SERVICE', {
  providedIn: 'root',
  factory: () => ({
    track: (event: string) => console.log('[Analytics]', event),
  }),
});

@Component({
  selector: 'ex-41',
  standalone: true,
  template: `
    <div style="background:#fff9c4;padding:8px;border-radius:4px;font-size:13px">
      <strong>Tree-shakable InjectionToken with factory</strong>
      <pre style="margin:4px 0;font-size:11px">const ANALYTICS_SERVICE = new InjectionToken('...', {{ '{' }}
  providedIn: 'root',
  factory: () => ({{ '{' }} track: (e) => console.log(e) {{ '}' }})
{{ '}' }});</pre>
      <button (click)="analytics.track('button_click')" style="padding:2px 8px;font-size:12px">Track Event</button>
    </div>
  `,
})
class Ex41 {
  analytics = inject(ANALYTICS_SERVICE);
}

// 42. Service with DestroyRef cleanup
@Injectable()
class CleanupService {
  data = signal('Active');
  private interval?: ReturnType<typeof setInterval>;

  constructor() {
    const destroyRef = inject(DestroyRef);
    this.interval = setInterval(() => {
      this.data.update(d => d === 'Active' ? 'Ping' : 'Active');
    }, 1500);
    destroyRef.onDestroy(() => {
      clearInterval(this.interval);
      console.log('[CleanupService] Destroyed, interval cleared.');
    });
  }
}

@Component({
  selector: 'ex-42',
  standalone: true,
  providers: [CleanupService],
  template: `
    <div style="background:#e0f7fa;padding:8px;border-radius:4px;font-size:13px">
      <strong>Service with DestroyRef cleanup (clears interval on destroy)</strong>
      <div>Status: <code>{{ svc.data() }}</code></div>
    </div>
  `,
})
class Ex42 {
  svc = inject(CleanupService);
}

// 43. inject() outside constructor (in function)
function getAppTitle(): string {
  // inject() can be called in injection context (e.g., field initializer, constructor, factory)
  try {
    const config = inject(APP_CONFIG);
    return config.apiUrl;
  } catch {
    return 'Injection context required';
  }
}

@Component({
  selector: 'ex-43',
  standalone: true,
  template: `
    <div style="background:#fce4ec;padding:8px;border-radius:4px;font-size:13px">
      <strong>inject() in field initializer (outside constructor body)</strong>
      <pre style="margin:4px 0;font-size:11px">class MyComponent {{ '{' }}
  // inject() works here — field initializer runs in injection context
  private svc = inject(MyService);
  private config = inject(APP_CONFIG);
{{ '}' }}</pre>
      <div>API URL (from inject in field): <code>{{ apiUrl }}</code></div>
    </div>
  `,
})
class Ex43 {
  private _config = inject(APP_CONFIG); // inject() in field initializer
  apiUrl = this._config.apiUrl;
}

// 44. runInInjectionContext usage
@Component({
  selector: 'ex-44',
  standalone: true,
  template: `
    <div style="background:#e8eaf6;padding:8px;border-radius:4px;font-size:13px">
      <strong>runInInjectionContext — call inject() outside normal context</strong>
      <pre style="margin:4px 0;font-size:11px">const injector = inject(Injector);

setTimeout(() => {{ '{' }}
  runInInjectionContext(injector, () => {{ '{' }}
    const svc = inject(MyService); // works!
  {{ '}' }});
{{ '}' }}, 0);</pre>
      <div>Result from runInInjectionContext: <code>{{ result }}</code></div>
    </div>
  `,
})
class Ex44 {
  private injector = inject(Injector);
  result = '';
  constructor() {
    runInInjectionContext(this.injector, () => {
      const config = inject(APP_CONFIG);
      this.result = config.apiUrl;
    });
  }
}

// 45. PLATFORM_ID in service (SSR-safe)
@Injectable({ providedIn: 'root' })
class SsrSafeService {
  private platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId);

  getScreenWidth(): number {
    return this.isBrowser ? window.innerWidth : 0;
  }
}

@Component({
  selector: 'ex-45',
  standalone: true,
  template: `
    <div style="background:#e3f2fd;padding:8px;border-radius:4px;font-size:13px">
      <strong>PLATFORM_ID — SSR-safe service</strong>
      <div>isBrowser: <code>{{ svc.isBrowser }}</code></div>
      <div>screenWidth: <code>{{ svc.getScreenWidth() }}px</code></div>
    </div>
  `,
})
class Ex45 {
  svc = inject(SsrSafeService);
}

// 46. Service with environment config token
const ENVIRONMENT_CONFIG = new InjectionToken<{ production: boolean; apiUrl: string }>('ENVIRONMENT_CONFIG');

@Component({
  selector: 'ex-46',
  standalone: true,
  providers: [
    {
      provide: ENVIRONMENT_CONFIG,
      useValue: { production: false, apiUrl: 'https://dev.api.example.com' },
    },
  ],
  template: `
    <div style="background:#e8f5e9;padding:8px;border-radius:4px;font-size:13px">
      <strong>Service with environment config InjectionToken</strong>
      <div>production: <code>{{ config.production }}</code></div>
      <div>apiUrl: <code>{{ config.apiUrl }}</code></div>
    </div>
  `,
})
class Ex46 {
  config = inject(ENVIRONMENT_CONFIG);
}

// 47. Service using inject(HttpClient) directly
@Injectable({ providedIn: 'root' })
class DirectHttpService {
  private http = inject(HttpClient);
  fetchPost(id: number): Observable<{ id: number; title: string }> {
    return this.http.get<{ id: number; title: string }>(`https://jsonplaceholder.typicode.com/posts/${id}`).pipe(
      catchError(() => of({ id, title: 'Mocked (no HTTP)' }))
    );
  }
}

@Component({
  selector: 'ex-47',
  standalone: true,
  template: `
    <div style="background:#fff9c4;padding:8px;border-radius:4px;font-size:13px">
      <strong>Service using inject(HttpClient) in field initializer</strong>
      <button (click)="load()" style="padding:2px 8px;margin-bottom:4px">Fetch Post #1</button>
      @if (post()) {
        <div>ID: {{ post()!.id }} — {{ post()!.title }}</div>
      }
    </div>
  `,
})
class Ex47 {
  private svc = inject(DirectHttpService);
  post = signal<{ id: number; title: string } | null>(null);
  load() {
    this.svc.fetchPost(1).subscribe(p => this.post.set(p));
  }
}

// 48. Service with signal + RxJS hybrid
@Injectable({ providedIn: 'root' })
class HybridService {
  private query$ = new BehaviorSubject<string>('');
  results$ = this.query$.pipe(
    map(q => q ? [`Result for "${q}"`, `Match: ${q.toUpperCase()}`] : []),
    shareReplay(1)
  );
  setQuery(q: string) { this.query$.next(q); }
}

@Component({
  selector: 'ex-48',
  standalone: true,
  template: `
    <div style="background:#e0f2f1;padding:8px;border-radius:4px;font-size:13px">
      <strong>Service with signal + RxJS hybrid (BehaviorSubject + toSignal)</strong>
      <input (input)="svc.setQuery(input.value)" #input placeholder="Type to search" style="padding:3px;border:1px solid #ccc;width:200px;display:block;margin:4px 0" />
      @for (r of results(); track r) {
        <div style="font-size:12px">• {{ r }}</div>
      }
    </div>
  `,
})
class Ex48 {
  svc = inject(HybridService);
  results = toSignal(this.svc.results$, { initialValue: [] });
}

// 49. Testing-friendly service (interface + token)
interface INotifier { notify(msg: string): void; }
const NOTIFIER_TOKEN = new InjectionToken<INotifier>('NOTIFIER_TOKEN');

@Injectable()
class ToastNotifier implements INotifier {
  lastMsg = signal('');
  notify(msg: string) { this.lastMsg.set(msg); }
}

@Component({
  selector: 'ex-49',
  standalone: true,
  providers: [ToastNotifier, { provide: NOTIFIER_TOKEN, useExisting: ToastNotifier }],
  template: `
    <div style="background:#fce4ec;padding:8px;border-radius:4px;font-size:13px">
      <strong>Testing-friendly service (interface + InjectionToken)</strong>
      <pre style="margin:4px 0;font-size:11px">// In tests, swap with:
{{ '{' }} provide: NOTIFIER_TOKEN, useValue: mockNotifier {{ '}' }}</pre>
      <button (click)="notifier.notify('Hello!')" style="padding:2px 8px">Notify</button>
      <div>Last: <code>{{ toast.lastMsg() }}</code></div>
    </div>
  `,
})
class Ex49 {
  notifier = inject(NOTIFIER_TOKEN);
  toast = inject(ToastNotifier);
}

// 50. Full service layer: API service + cache service + state service
@Injectable({ providedIn: 'root' })
class ApiLayer50 {
  private http = inject(HttpClient);
  getUsers(): Observable<{ id: number; name: string }[]> {
    return this.http.get<{ id: number; name: string }[]>('https://jsonplaceholder.typicode.com/users?_limit=3').pipe(
      catchError(() => of([{ id: 1, name: 'Alice (mocked)' }, { id: 2, name: 'Bob (mocked)' }]))
    );
  }
}

@Injectable({ providedIn: 'root' })
class CacheLayer50 {
  private cache = new Map<string, unknown>();
  get<T>(key: string): T | null { return (this.cache.get(key) as T) ?? null; }
  set(key: string, value: unknown) { this.cache.set(key, value); }
  has(key: string) { return this.cache.has(key); }
}

@Injectable({ providedIn: 'root' })
class StateLayer50 {
  private api = inject(ApiLayer50);
  private cache = inject(CacheLayer50);

  users = signal<{ id: number; name: string }[]>([]);
  loading = signal(false);

  loadUsers() {
    if (this.cache.has('users')) {
      this.users.set(this.cache.get<{ id: number; name: string }[]>('users')!);
      return;
    }
    this.loading.set(true);
    this.api.getUsers().subscribe(data => {
      this.users.set(data);
      this.cache.set('users', data);
      this.loading.set(false);
    });
  }
}

@Component({
  selector: 'ex-50',
  standalone: true,
  template: `
    <div style="border:2px solid #1565C0;border-radius:6px;padding:10px">
      <h4 style="margin:0 0 8px;color:#1565C0">Full Service Layer (API + Cache + State)</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:12px;margin-bottom:8px">
        <div style="background:#e3f2fd;padding:6px;border-radius:4px">
          <strong>ApiLayer50</strong><br/>inject(HttpClient)<br/>getUsers(): Observable
        </div>
        <div style="background:#e8f5e9;padding:6px;border-radius:4px">
          <strong>CacheLayer50</strong><br/>Map-based cache<br/>get / set / has
        </div>
        <div style="background:#fff9c4;padding:6px;border-radius:4px">
          <strong>StateLayer50</strong><br/>users signal<br/>loading signal
        </div>
      </div>
      <button (click)="state.loadUsers()" style="padding:4px 12px;margin-bottom:6px">Load Users</button>
      @if (state.loading()) { <div style="color:#FF9800;font-size:12px">Loading...</div> }
      @for (u of state.users(); track u.id) {
        <div style="font-size:13px;padding:2px 0">{{ u.id }}. {{ u.name }}</div>
      }
    </div>
  `,
})
class Ex50 {
  state = inject(StateLayer50);
}

// ─── App Root ────────────────────────────────────────────────

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
      <h1>Examples 3.5 (signals) — Services &amp; Dependency Injection with Signals</h1>

      <h4>1. @Injectable({ providedIn: 'root' }) basic service</h4><ex-01 /><hr />
      <h4>2. Service with a simple method</h4><ex-02 /><hr />
      <h4>3. Service with a signal property</h4><ex-03 /><hr />
      <h4>4. Service with computed signal</h4><ex-04 /><hr />
      <h4>5. inject() in component constructor alternative</h4><ex-05 /><hr />
      <h4>6. inject() in field initializer</h4><ex-06 /><hr />
      <h4>7. Service with effect() for side effects</h4><ex-07 /><hr />
      <h4>8. CounterService: count signal + increment/decrement/reset</h4><ex-08 /><hr />
      <h4>9. ThemeService: theme signal + toggle()</h4><ex-09 /><hr />
      <h4>10. LoggerService: logs signal array + log()</h4><ex-10 /><hr />
      <h4>11. NotificationService: notifications signal + add/dismiss</h4><ex-11 /><hr />
      <h4>12. UserService: currentUser signal + login/logout</h4><ex-12 /><hr />
      <h4>13. CartService: items signal + computed total</h4><ex-13 /><hr />
      <h4>14. InjectionToken for config value</h4><ex-14 /><hr />
      <h4>15. useValue provider</h4><ex-15 /><hr />
      <h4>16. useClass provider (swap implementation)</h4><ex-16 /><hr />
      <h4>17. useFactory provider with deps</h4><ex-17 /><hr />
      <h4>18. useExisting provider (alias)</h4><ex-18 /><hr />
      <h4>19. multi: true provider</h4><ex-19 /><hr />
      <h4>20. Component-level provider (providers: [] in @Component)</h4><ex-20 /><hr />
      <h4>21. Service injecting another service</h4><ex-21 /><hr />
      <h4>22. Hierarchical DI — child overrides parent service</h4><ex-22 /><hr />
      <h4>23. APP_INITIALIZER for startup logic</h4><ex-23 /><hr />
      <h4>24. ENVIRONMENT_INITIALIZER</h4><ex-24 /><hr />
      <h4>25. Service with localStorage persistence (effect → localStorage)</h4><ex-25 /><hr />
      <h4>26. Service with BehaviorSubject + toSignal bridge</h4><ex-26 /><hr />
      <h4>27. Two services sharing a third (base) service</h4><ex-27 /><hr />
      <h4>28. Component tree using service at different levels</h4><ex-28 /><hr />
      <h4>29. Service with signal store pattern (full CRUD)</h4><ex-29 /><hr />
      <h4>30. Service with HTTP + toSignal</h4><ex-30 /><hr />
      <h4>31. Service with error + loading signals</h4><ex-31 /><hr />
      <h4>32. Service orchestrating multiple child services</h4><ex-32 /><hr />
      <h4>33. Feature service with root service dependency</h4><ex-33 /><hr />
      <h4>34. Service with timer (polling)</h4><ex-34 /><hr />
      <h4>35. Service with WebSocket simulation</h4><ex-35 /><hr />
      <h4>36. Service with undo/redo signal stack</h4><ex-36 /><hr />
      <h4>37. Service provided in lazy-loaded feature (concept)</h4><ex-37 /><hr />
      <h4>38. Full authentication service (login/logout/token/user)</h4><ex-38 /><hr />
      <h4>39. Generic typed service (DataService&lt;T&gt;)</h4><ex-39 /><hr />
      <h4>40. Service factory function</h4><ex-40 /><hr />
      <h4>41. Tree-shakable token (InjectionToken with factory)</h4><ex-41 /><hr />
      <h4>42. Service with DestroyRef cleanup</h4><ex-42 /><hr />
      <h4>43. inject() outside constructor (in function)</h4><ex-43 /><hr />
      <h4>44. runInInjectionContext usage</h4><ex-44 /><hr />
      <h4>45. PLATFORM_ID in service (SSR-safe)</h4><ex-45 /><hr />
      <h4>46. Service with environment config token</h4><ex-46 /><hr />
      <h4>47. Service using inject(HttpClient) directly</h4><ex-47 /><hr />
      <h4>48. Service with signal + RxJS hybrid</h4><ex-48 /><hr />
      <h4>49. Testing-friendly service (interface + token)</h4><ex-49 /><hr />
      <h4>50. Full service layer: API service + cache service + state service</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
