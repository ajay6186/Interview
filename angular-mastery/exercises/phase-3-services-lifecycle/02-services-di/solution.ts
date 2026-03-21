import { Component, Injectable, inject, signal, computed,
         ChangeDetectionStrategy } from '@angular/core';

// ============================================================
// Solution 3.2 — Services & Dependency Injection
// ============================================================

// SOLUTION 1: LoggerService
@Injectable({ providedIn: 'root' })
class LoggerService {
  private _logs = signal<string[]>([]);
  logs = this._logs.asReadonly();

  log(msg: string) {
    const time = new Date().toLocaleTimeString();
    this._logs.update(l => [...l, `[${time}] ${msg}`]);
  }

  clear() { this._logs.set([]); }
}

// SOLUTION 2: CounterService
@Injectable({ providedIn: 'root' })
class CounterService {
  count  = signal(0);
  doubled = computed(() => this.count() * 2);

  increment() { this.count.update(n => n + 1); }
  decrement() { this.count.update(n => n - 1); }
  reset()     { this.count.set(0); }
}

// SOLUTION 3: ThemeService
@Injectable({ providedIn: 'root' })
class ThemeService {
  private _theme = signal<'light' | 'dark'>('light');
  theme = this._theme.asReadonly();

  toggle() {
    this._theme.update(t => t === 'light' ? 'dark' : 'light');
  }
}

// SOLUTION 4: CounterComponent
@Component({
  selector: 'app-counter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>CounterService</h3>
      <p>Count: <strong>{{ counter.count() }}</strong></p>
      <p>Doubled: <strong>{{ counter.doubled() }}</strong></p>
      <button (click)="counter.increment()">+</button>
      <button (click)="counter.decrement()" style="margin: 0 8px;">−</button>
      <button (click)="counter.reset()">Reset</button>
    </section>
  `,
})
class CounterComponent {
  counter = inject(CounterService);
}

// SOLUTION 5: ThemeToggleComponent
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [style.background]="themeService.theme() === 'dark' ? '#333' : '#fff'"
             [style.color]="themeService.theme() === 'dark' ? '#fff' : '#333'"
             style="padding: 16px; border-radius: 8px; transition: all 0.3s;">
      <h3>ThemeService</h3>
      <p>Current theme: <strong>{{ themeService.theme() }}</strong></p>
      <button (click)="themeService.toggle()">Toggle Theme</button>
    </section>
  `,
})
class ThemeToggleComponent {
  themeService = inject(ThemeService);
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CounterComponent, ThemeToggleComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 3.2 — Services &amp; Dependency Injection</h1>
      <app-counter />
      <hr />
      <app-theme-toggle />
    </div>
  `,
})
export class AppComponent {}
