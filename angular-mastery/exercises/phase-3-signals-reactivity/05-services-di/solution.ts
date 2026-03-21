import { Component, Injectable, inject, signal, computed, InjectionToken } from '@angular/core';

// ============================================================
// Solution 3.5 — Services & Dependency Injection
// ============================================================

// SOLUTION 1: CounterService (singleton)
@Injectable({ providedIn: 'root' })
class CounterService {
  count     = signal(0);
  doubled   = computed(() => this.count() * 2);
  isNeg     = computed(() => this.count() < 0);
  increment() { this.count.update((n) => n + 1); }
  decrement() { this.count.update((n) => n - 1); }
  reset()     { this.count.set(0); }
}

@Component({
  selector: 'app-counter-a',
  standalone: true,
  template: `
    <div style="background: #e8f4ff; padding: 10px 14px; border-radius: 6px;">
      <strong>Consumer A</strong> — count: <em>{{ cs.count() }}</em>
      &nbsp; doubled: <em>{{ cs.doubled() }}</em>
      <button (click)="cs.increment()" style="margin-left: 8px; cursor: pointer;">+</button>
      <button (click)="cs.decrement()" style="margin-left: 4px; cursor: pointer;">−</button>
    </div>
  `,
})
class CounterAComponent { cs = inject(CounterService); }

@Component({
  selector: 'app-counter-b',
  standalone: true,
  template: `
    <div style="background: #fff0e8; padding: 10px 14px; border-radius: 6px;">
      <strong>Consumer B</strong> — count: <em>{{ cs.count() }}</em>
      &nbsp; isNegative: <em>{{ cs.isNeg() }}</em>
      <button (click)="cs.reset()" style="margin-left: 8px; cursor: pointer; color: #e74c3c;">Reset</button>
    </div>
  `,
})
class CounterBComponent { cs = inject(CounterService); }

// SOLUTION 2: ThemeService
@Injectable({ providedIn: 'root' })
class ThemeService {
  theme  = signal<'light' | 'dark'>('light');
  toggle() { this.theme.update((t) => t === 'light' ? 'dark' : 'light'); }
}

@Component({
  selector: 'app-theme-a',
  standalone: true,
  template: `
    <div [style.background]="ts.theme() === 'dark' ? '#222' : '#f5f5f5'"
         [style.color]="ts.theme() === 'dark' ? '#eee' : '#333'"
         style="padding: 10px 14px; border-radius: 6px;">
      Theme A: <strong>{{ ts.theme() }}</strong>
      <button (click)="ts.toggle()" style="margin-left: 10px; cursor: pointer;">Toggle</button>
    </div>
  `,
})
class ThemeAComponent { ts = inject(ThemeService); }

@Component({
  selector: 'app-theme-b',
  standalone: true,
  template: `
    <div [style.background]="ts.theme() === 'dark' ? '#2c2c2c' : '#ececec'"
         [style.color]="ts.theme() === 'dark' ? '#ddd' : '#444'"
         style="padding: 10px 14px; border-radius: 6px;">
      Theme B: <strong>{{ ts.theme() }}</strong>
      <button (click)="ts.toggle()" style="margin-left: 10px; cursor: pointer;">Toggle</button>
    </div>
  `,
})
class ThemeBComponent { ts = inject(ThemeService); }

// SOLUTION 3: LoggerService + InjectionToken
const LOG_PREFIX = new InjectionToken<string>('LOG_PREFIX');

@Injectable()
class LoggerService {
  private prefix = inject(LOG_PREFIX, { optional: true }) ?? '[App]';
  logs: string[] = [];
  log(msg: string) { this.logs.push(`${this.prefix} ${msg}`); }
}

@Component({
  selector: 'app-logger-a',
  standalone: true,
  providers: [
    LoggerService,
    { provide: LOG_PREFIX, useValue: '[ComponentA]' },
  ],
  template: `
    <div style="padding: 10px; background: #f9f9f9; border-radius: 6px;">
      <button (click)="logger.log('hello'); loggerA = [...logger.logs]" style="cursor: pointer;">
        Log (ComponentA prefix)
      </button>
      <ul style="margin: 6px 0 0; padding-left: 18px; font-family: monospace; font-size: 12px;">
        @for (l of loggerA; track l) { <li>{{ l }}</li> }
      </ul>
    </div>
  `,
})
class LoggerAComponent {
  logger  = inject(LoggerService);
  loggerA: string[] = [];
}

@Component({
  selector: 'app-logger-b',
  standalone: true,
  providers: [
    LoggerService,
    { provide: LOG_PREFIX, useValue: '[FeatureB]' },
  ],
  template: `
    <div style="padding: 10px; background: #f0f9ff; border-radius: 6px;">
      <button (click)="logger.log('world'); loggerB = [...logger.logs]" style="cursor: pointer;">
        Log (FeatureB prefix)
      </button>
      <ul style="margin: 6px 0 0; padding-left: 18px; font-family: monospace; font-size: 12px;">
        @for (l of loggerB; track l) { <li>{{ l }}</li> }
      </ul>
    </div>
  `,
})
class LoggerBComponent {
  logger  = inject(LoggerService);
  loggerB: string[] = [];
}

// SOLUTION 4: CartService (component-level scope)
@Injectable()
class CartService {
  items  = signal<string[]>([]);
  total  = computed(() => this.items().length);
  add(item: string) { this.items.update((l) => [...l, item]); }
  remove(item: string) { this.items.update((l) => l.filter((i) => i !== item)); }
}

@Component({
  selector: 'app-cart-child',
  standalone: true,
  template: `
    <div style="padding: 8px 12px; background: #fff8e1; border-radius: 4px; font-size: 13px;">
      Child sees: {{ cart.items().join(', ') || 'empty' }}
      <button (click)="cart.add('Item-' + (++n))" style="margin-left: 6px; cursor: pointer; font-size: 12px;">Add</button>
    </div>
  `,
})
class CartChildComponent {
  cart = inject(CartService);
  n    = 0;
}

@Component({
  selector: 'app-cart-parent',
  standalone: true,
  imports: [CartChildComponent],
  providers: [CartService],
  template: `
    <div style="border: 1px solid #ddd; border-radius: 6px; padding: 10px;">
      <strong>Cart Parent A</strong> — items: {{ cart.items().join(', ') || 'none' }} ({{ cart.total() }})
      <app-cart-child />
    </div>
  `,
})
class CartParentAComponent { cart = inject(CartService); }

@Component({
  selector: 'app-cart-parent-b',
  standalone: true,
  imports: [CartChildComponent],
  providers: [CartService],
  template: `
    <div style="border: 1px solid #cde; border-radius: 6px; padding: 10px;">
      <strong>Cart Parent B (isolated)</strong> — items: {{ cart.items().join(', ') || 'none' }}
      <app-cart-child />
    </div>
  `,
})
class CartParentBComponent { cart = inject(CartService); }

// SOLUTION 5: ConfigService (useValue)
const APP_CONFIG = new InjectionToken<{ apiUrl: string; debug: boolean }>('APP_CONFIG');

@Injectable()
class ConfigService {
  config = inject(APP_CONFIG);
}

@Component({
  selector: 'app-config-demo',
  standalone: true,
  providers: [
    ConfigService,
    { provide: APP_CONFIG, useValue: { apiUrl: 'https://api.myapp.com', debug: true } },
  ],
  template: `
    <div style="background: #f0f0f0; padding: 10px 14px; border-radius: 6px; font-family: monospace; font-size: 13px;">
      apiUrl: <strong>{{ cfg.config.apiUrl }}</strong> &nbsp;
      debug: <strong>{{ cfg.config.debug }}</strong>
    </div>
  `,
})
class ConfigDemoComponent { cfg = inject(ConfigService); }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CounterAComponent, CounterBComponent,
    ThemeAComponent, ThemeBComponent,
    LoggerAComponent, LoggerBComponent,
    CartParentAComponent, CartParentBComponent,
    ConfigDemoComponent,
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <h1>Solution 3.5 — Services &amp; DI</h1>

      <h2>1. Singleton Service (CounterService)</h2>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <app-counter-a /><app-counter-b />
      </div>
      <hr />

      <h2>2. ThemeService (two consumers)</h2>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <app-theme-a /><app-theme-b />
      </div>
      <hr />

      <h2>3. InjectionToken (LOG_PREFIX)</h2>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <app-logger-a /><app-logger-b />
      </div>
      <hr />

      <h2>4. Component-scoped CartService (isolated instances)</h2>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <app-cart-parent /><app-cart-parent-b />
      </div>
      <hr />

      <h2>5. APP_CONFIG (useValue token)</h2>
      <app-config-demo />
    </div>
  `,
})
export class AppComponent {}
