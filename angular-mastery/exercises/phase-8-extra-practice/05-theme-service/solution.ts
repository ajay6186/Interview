import { Component, Injectable, inject, signal, effect, OnDestroy,
         ChangeDetectionStrategy } from '@angular/core';

// ============================================================
// Solution 8.5 — Theme Service
// ============================================================

// SOLUTION 1: ThemeService
@Injectable({ providedIn: 'root' })
class ThemeService {
  private _theme = signal<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') ??
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );
  theme = this._theme.asReadonly();

  constructor() {
    effect(() => {
      const t = this._theme();
      localStorage.setItem('theme', t);
      document.documentElement.classList.toggle('dark', t === 'dark');
    });
  }

  toggle() { this._theme.update(t => t === 'light' ? 'dark' : 'light'); }
}

// SOLUTION 2: ThemeToggleComponent
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button (click)="themeService.toggle()"
            style="padding:8px 16px;border-radius:20px;border:1px solid #ccc;cursor:pointer;font-size:1rem;">
      {{ themeService.theme() === 'dark' ? '☀️ Light' : '🌙 Dark' }}
    </button>
  `,
})
class ThemeToggleComponent {
  themeService = inject(ThemeService);
}

// SOLUTION 3: ThemedCard
@Component({
  selector: 'app-themed-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [style.background]="bg()" [style.color]="fg()"
         style="padding:16px;border-radius:8px;margin:8px 0;transition:all 0.3s;border:1px solid #ccc;">
      <h4>Themed Card</h4>
      <p>This card reacts to theme changes. Currently: <strong>{{ themeService.theme() }}</strong></p>
    </div>
  `,
})
class ThemedCardComponent {
  themeService = inject(ThemeService);
  bg = () => this.themeService.theme() === 'dark' ? '#1a1a2e' : '#ffffff';
  fg = () => this.themeService.theme() === 'dark' ? '#e0e0e0' : '#333333';
}

// SOLUTION 4: ThemeProvider
@Component({
  selector: 'app-theme-provider',
  standalone: true,
  imports: [ThemedCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class.dark]="themeService.theme() === 'dark'"
         [style.background]="themeService.theme() === 'dark' ? '#121212' : '#f5f5f5'"
         style="padding:16px;border-radius:8px;">
      <p>Theme Provider wraps children:</p>
      <app-themed-card />
    </div>
  `,
})
class ThemeProviderComponent {
  themeService = inject(ThemeService);
}

// SOLUTION 5: PrefersDark OS detection
@Component({
  selector: 'app-prefers-dark',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>OS Dark Mode Preference</h3>
      <p>OS prefers dark: <strong>{{ prefersDark() }}</strong></p>
      <p><em>Changes dynamically when you change your OS theme.</em></p>
    </section>
  `,
})
class PrefersDarkComponent implements OnDestroy {
  prefersDark = signal(window.matchMedia('(prefers-color-scheme: dark)').matches);
  private mq  = window.matchMedia('(prefers-color-scheme: dark)');
  private handler = (e: MediaQueryListEvent) => this.prefersDark.set(e.matches);

  constructor() { this.mq.addEventListener('change', this.handler); }
  ngOnDestroy()  { this.mq.removeEventListener('change', this.handler); }
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ThemeToggleComponent, ThemedCardComponent, ThemeProviderComponent, PrefersDarkComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 8.5 — Theme Service</h1>
      <app-theme-toggle />
      <hr />
      <app-themed-card />
      <hr />
      <app-theme-provider />
      <hr />
      <app-prefers-dark />
    </div>
  `,
})
export class AppComponent {}
