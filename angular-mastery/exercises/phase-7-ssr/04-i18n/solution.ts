// Phase 7 - Solution 04: Internationalization (i18n)
// Topics: @angular/localize, i18n attribute, $localize tag, ICU expressions, locale switching

import { Component, Input, signal, computed, inject, LOCALE_ID, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ─────────────────────────────────────────────────────────────────────────────
// 1. i18n attribute + $localize tag
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-i18n-text',
  standalone: true,
  template: `
    <div style="padding:1.5rem; background:#e3f2fd; border-radius:8px; margin-bottom:1rem">
      <h3>i18n Attribute & &#36;localize Tag</h3>

      <div style="background:white; padding:0.75rem; border-radius:4px; margin-bottom:0.75rem; font-size:0.9rem">
        <!--
          In a real i18n-enabled build, these strings are extracted to messages.xlf.
          Translators provide translations, then ng build --localize creates locale-specific bundles.
        -->
        <h4 style="margin:0 0 0.5rem">
          <!-- Real: <h4 i18n="@@home.title">Welcome to the App</h4> -->
          Welcome to the App
        </h4>
        <p style="margin:0">
          <!-- Real: <p i18n="Home page description@@home.description"> -->
          This is a demo of Angular i18n features.
        </p>
      </div>

      <div style="display:grid; gap:0.75rem; font-size:0.85rem">
        @for (pattern of patterns; track pattern.label) {
          <div style="background:#e8f4fd; padding:0.75rem; border-radius:4px">
            <strong>{{ pattern.label }}</strong>
            <pre style="margin:0.4rem 0 0; font-size:0.8rem; background:#1e1e1e; color:#d4d4d4;
                        padding:0.5rem; border-radius:3px; overflow:auto">{{ pattern.code }}</pre>
            <p style="margin:0.4rem 0 0; color:#555">{{ pattern.note }}</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class I18nTextComponent {
  patterns = [
    {
      label: 'Basic i18n attribute',
      code: `<h1 i18n>Hello World</h1>
<!-- Extracted with auto-generated ID -->`,
      note: 'Simplest form — Angular extracts and generates an ID',
    },
    {
      label: 'i18n with custom ID (@@)',
      code: `<h1 i18n="@@home.title">Welcome</h1>
<p i18n="Home page description@@home.desc">Subtitle here</p>
<!-- Format: i18n="meaning|description@@id" -->`,
      note: 'Custom IDs survive refactoring — translations are not lost when text changes',
    },
    {
      label: '$localize tag (TypeScript code)',
      code: `import '@angular/localize/init';

const title = $localize\`:@@page.title:Page Title\`;
const greeting = $localize\`:@@greet:Hello, \${name}:name:!\`;

// Format: $localize\`:meaning|description@@id:text \${expr}:placeholder:\``,
      note: 'Use $localize when you need translated strings in TypeScript (not templates)',
    },
    {
      label: 'Setup & workflow',
      code: `# 1. Install
ng add @angular/localize

# 2. Extract strings
ng extract-i18n --output-path src/locale
# Creates src/locale/messages.xlf

# 3. Translate (copy to messages.de.xlf, messages.fr.xlf, etc.)
# Translators fill in <target> elements in the XLF file

# 4. Build for each locale
ng build --localize
# Outputs: dist/en/, dist/de/, dist/fr/`,
      note: 'Each locale gets its own build with strings inlined — best performance',
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PluralMessageComponent — ICU plural
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-plural-message',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div style="padding:1.5rem; background:#fff3e0; border-radius:8px; margin-bottom:1rem">
      <h3>ICU Plural Expressions</h3>

      <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:0.75rem">
        <button (click)="count > 0 && count--" style="width:32px; height:32px; background:#c62828; color:white; border:none; border-radius:4px; cursor:pointer; font-size:1.2rem">−</button>
        <strong style="font-size:1.5rem; min-width:40px; text-align:center">{{ count }}</strong>
        <button (click)="count++" style="width:32px; height:32px; background:#2e7d32; color:white; border:none; border-radius:4px; cursor:pointer; font-size:1.2rem">+</button>
      </div>

      <div style="background:white; padding:0.75rem; border-radius:4px; font-size:1.1rem; margin-bottom:0.75rem">
        <!-- Real: use ICU expression inside i18n attribute -->
        {{ pluralMessage }}
      </div>

      <pre style="background:#1e1e1e; color:#d4d4d4; padding:0.75rem; border-radius:4px; font-size:0.8rem">{{ icuCode }}</pre>
    </div>
  `,
})
export class PluralMessageComponent {
  count = 0;

  get pluralMessage(): string {
    // In real app: this is in the template as ICU expression
    if (this.count === 0) return 'No items in your cart';
    if (this.count === 1) return '1 item in your cart';
    return `${this.count} items in your cart`;
  }

  icuCode = `<!-- Template ICU plural syntax -->
<p i18n>
  {count, plural,
    =0    {No items in your cart}
    =1    {1 item in your cart}
    other {{{count}} items in your cart}
  }
</p>

<!-- With variable binding -->
<p i18n>
  {messages.length, plural,
    =0    {No new messages}
    one   {One new message}
    other {{{messages.length}} new messages}
  }
</p>

<!-- Plurals vary by language! 'few', 'many' categories exist in Slavic languages -->`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. GenderMessageComponent — ICU select
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-gender-message',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div style="padding:1.5rem; background:#f3e5f5; border-radius:8px; margin-bottom:1rem">
      <h3>ICU Select Expressions</h3>

      <div style="display:flex; gap:0.75rem; margin-bottom:0.75rem; flex-wrap:wrap">
        <div>
          <label style="font-size:0.85rem">Name: </label>
          <input [(ngModel)]="name" style="padding:0.3rem; border:1px solid #ccc; border-radius:4px" />
        </div>
        <div>
          <label style="font-size:0.85rem">Gender: </label>
          <select [(ngModel)]="gender" style="padding:0.3rem; border:1px solid #ccc; border-radius:4px">
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div style="background:white; padding:0.75rem; border-radius:4px; font-size:1.1rem; margin-bottom:0.75rem">
        {{ selectMessage }}
      </div>

      <pre style="background:#1e1e1e; color:#d4d4d4; padding:0.75rem; border-radius:4px; font-size:0.8rem">{{ icuCode }}</pre>
    </div>
  `,
})
export class GenderMessageComponent {
  name   = 'Alex';
  gender: 'male' | 'female' | 'other' = 'other';

  get selectMessage(): string {
    // Real: use ICU select in template
    if (this.gender === 'male')   return `${this.name} liked this post`;
    if (this.gender === 'female') return `${this.name} liked this post`;
    return `${this.name} liked this post`;
    // Note: In translated builds, pronouns differ per language
  }

  icuCode = `<!-- Template ICU select syntax -->
<p i18n>
  {gender, select,
    male   {{{name}} updated his profile}
    female {{{name}} updated her profile}
    other  {{{name}} updated their profile}
  }
</p>

<!-- Can be nested: plural inside select -->
<p i18n>
  {gender, select,
    male   {{count, plural, =1 {He liked 1 post} other {He liked {{count}} posts}}}
    female {{count, plural, =1 {She liked 1 post} other {She liked {{count}} posts}}}
    other  {{count, plural, =1 {They liked 1 post} other {They liked {{count}} posts}}}
  }
</p>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. DateLocaleComponent — DatePipe with locale
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-date-locale',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding:1.5rem; background:#e8f5e9; border-radius:8px; margin-bottom:1rem">
      <h3>DatePipe, CurrencyPipe, DecimalPipe with Locales</h3>

      <table style="width:100%; border-collapse:collapse; font-size:0.9rem; margin-bottom:0.75rem">
        <thead>
          <tr style="background:#2e7d32; color:white">
            <th style="padding:0.4rem">Locale</th>
            <th style="padding:0.4rem">Date</th>
            <th style="padding:0.4rem">Currency (1234.56)</th>
            <th style="padding:0.4rem">Number</th>
          </tr>
        </thead>
        <tbody>
          @for (row of localeRows; track row.locale) {
            <tr style="border-bottom:1px solid #ddd">
              <td style="padding:0.4rem"><strong>{{ row.locale }}</strong></td>
              <td style="padding:0.4rem">{{ row.date }}</td>
              <td style="padding:0.4rem">{{ row.currency }}</td>
              <td style="padding:0.4rem">{{ row.number }}</td>
            </tr>
          }
        </tbody>
      </table>

      <pre style="background:#1e1e1e; color:#d4d4d4; padding:0.75rem; border-radius:4px; font-size:0.8rem">{{ setupCode }}</pre>
    </div>
  `,
})
export class DateLocaleComponent implements OnInit {
  localeRows: { locale: string; date: string; currency: string; number: string; }[] = [];

  private datePipe      = inject(DatePipe, { optional: true });
  private currencyPipe  = inject(CurrencyPipe, { optional: true });
  private decimalPipe   = inject(DecimalPipe, { optional: true });

  ngOnInit() {
    const today = new Date();
    const value = 1234.56;
    const locales = ['en-US', 'de-DE', 'fr-FR', 'ja-JP', 'ar-SA'];

    this.localeRows = locales.map(locale => ({
      locale,
      date:     today.toLocaleDateString(locale, { dateStyle: 'full' } as Intl.DateTimeFormatOptions),
      currency: value.toLocaleString(locale, { style: 'currency', currency: locale === 'de-DE' ? 'EUR' : 'USD' }),
      number:   value.toLocaleString(locale, { minimumFractionDigits: 3 }),
    }));
  }

  setupCode = `
// main.ts — register locale data for pipes to work:
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import localeFr from '@angular/common/locales/fr';
import localeJa from '@angular/common/locales/ja';

registerLocaleData(localeDe, 'de-DE');
registerLocaleData(localeFr, 'fr-FR');
registerLocaleData(localeJa, 'ja-JP');

// Template:
{{ today | date:'fullDate':'':'de-DE' }}
{{ price | currency:'EUR':'symbol':'1.2-2':'de-DE' }}
{{ count | number:'1.0-0':'ja-JP' }}`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. LocaleSwitcherComponent
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-locale-switcher',
  standalone: true,
  template: `
    <div style="padding:1.5rem; background:#e8eaf6; border-radius:8px; margin-bottom:1rem">
      <h3>LOCALE_ID Token & Runtime Switching</h3>

      <div style="background:white; padding:0.75rem; border-radius:4px; margin-bottom:0.75rem; font-size:0.9rem">
        Current <code>LOCALE_ID</code>: <strong>{{ localeId }}</strong>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; font-size:0.85rem">
        <div style="background:#e8eaf6; padding:0.75rem; border-radius:4px">
          <strong>Build-time i18n (Angular native)</strong>
          <ul style="margin:0.4rem 0 0; padding-left:1.25rem">
            <li>Separate bundle per locale</li>
            <li>Best runtime performance</li>
            <li>No dynamic switching</li>
            <li>Setup: <code>ng build --localize</code></li>
            <li>Server routes per locale: /en/, /de/, /fr/</li>
          </ul>
        </div>
        <div style="background:#e8f5e9; padding:0.75rem; border-radius:4px">
          <strong>Runtime i18n (ngx-translate)</strong>
          <ul style="margin:0.4rem 0 0; padding-left:1.25rem">
            <li>Single bundle</li>
            <li>Dynamic locale switching</li>
            <li>JSON translation files loaded at runtime</li>
            <li>Setup: <code>npm install @ngx-translate/core</code></li>
            <li>Template: <code>&#123;&#123; 'key' | translate &#125;&#125;</code></li>
          </ul>
        </div>
      </div>

      <pre style="margin-top:0.75rem; background:#1e1e1e; color:#d4d4d4; padding:0.75rem; border-radius:4px; font-size:0.8rem">{{ providerCode }}</pre>
    </div>
  `,
})
export class LocaleSwitcherComponent {
  localeId = inject(LOCALE_ID);

  providerCode = `
// Option 1: Static LOCALE_ID
providers: [
  { provide: LOCALE_ID, useValue: 'de-DE' }
]

// Option 2: Dynamic from browser
providers: [
  { provide: LOCALE_ID, useFactory: () => navigator.language }
]

// Option 3: From user preference stored in localStorage
providers: [
  { provide: LOCALE_ID, useFactory: () => localStorage.getItem('locale') ?? 'en-US' }
]

// angular.json for multi-locale build:
"i18n": {
  "sourceLocale": "en-US",
  "locales": {
    "de-DE": "src/locale/messages.de.xlf",
    "fr-FR": "src/locale/messages.fr.xlf"
  }
}`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    I18nTextComponent,
    PluralMessageComponent,
    GenderMessageComponent,
    DateLocaleComponent,
    LocaleSwitcherComponent,
  ],
  providers: [DatePipe, CurrencyPipe, DecimalPipe],
  template: `
    <div style="font-family:sans-serif; max-width:900px; margin:2rem auto; padding:0 1rem">
      <h1>Phase 7 – i18n</h1>
      <app-i18n-text />
      <app-plural-message />
      <app-gender-message />
      <app-date-locale />
      <app-locale-switcher />
    </div>
  `,
})
export class AppComponent {}
