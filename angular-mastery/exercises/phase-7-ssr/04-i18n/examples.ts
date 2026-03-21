import { Component, signal, computed } from '@angular/core';
import {
  DatePipe, CurrencyPipe, DecimalPipe, PercentPipe,
  UpperCasePipe, LowerCasePipe, TitleCasePipe,
  SlicePipe, JsonPipe, KeyValuePipe, AsyncPipe,
} from '@angular/common';

// ============================================================
// Examples 7.4 — Angular i18n & Localization (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. i18n concept overview
@Component({
  selector: 'ex-01',
  standalone: true,
  template: `
    <div style="background:#e8f4f8;padding:12px;border-radius:6px">
      <strong>Angular i18n Concept</strong>
      <ul style="margin:4px 0;font-size:0.9rem">
        <li><code>i18n</code> attribute marks text for extraction</li>
        <li><code>ng extract-i18n</code> generates XLIFF/XMB/JSON files</li>
        <li>Translators fill in translations per locale</li>
        <li><code>ng build --localize</code> builds per-locale bundles</li>
        <li>Pipes: DatePipe, CurrencyPipe, DecimalPipe use LOCALE_ID</li>
      </ul>
    </div>
  `,
})
class Ex01 {}

// 2. DatePipe with locale
@Component({
  selector: 'ex-02',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div style="background:#f0f4e8;padding:12px;border-radius:6px">
      <strong>DatePipe — locale formatting</strong>
      <p>Short: {{ today | date:'short':'':'en-US' }}</p>
      <p>Medium: {{ today | date:'medium':'':'en-US' }}</p>
      <p>Long: {{ today | date:'longDate':'':'en-US' }}</p>
      <p>Custom: {{ today | date:"EEEE, MMMM d, y" }}</p>
    </div>
  `,
})
class Ex02 {
  today = new Date();
}

// 3. CurrencyPipe
@Component({
  selector: 'ex-03',
  standalone: true,
  imports: [CurrencyPipe],
  template: `
    <div style="background:#f8f0e8;padding:12px;border-radius:6px">
      <strong>CurrencyPipe</strong>
      <p>USD: {{ amount | currency:'USD':'symbol':'1.2-2':'en-US' }}</p>
      <p>EUR: {{ amount | currency:'EUR':'symbol':'1.2-2':'fr' }}</p>
      <p>GBP: {{ amount | currency:'GBP':'code':'1.2-2':'en-GB' }}</p>
      <p>JPY: {{ amount | currency:'JPY':'symbol':'1.0-0':'ja' }}</p>
    </div>
  `,
})
class Ex03 {
  amount = 1234.56;
}

// 4. DecimalPipe
@Component({
  selector: 'ex-04',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div style="background:#e8e8f8;padding:12px;border-radius:6px">
      <strong>DecimalPipe</strong>
      <p>Default: {{ num | number }}</p>
      <p>2 decimals: {{ num | number:'1.2-2' }}</p>
      <p>0 decimals: {{ num | number:'1.0-0' }}</p>
      <p>Min 5 digits: {{ num | number:'5.1-1' }}</p>
    </div>
  `,
})
class Ex04 {
  num = 12345.6789;
}

// 5. PercentPipe
@Component({
  selector: 'ex-05',
  standalone: true,
  imports: [PercentPipe],
  template: `
    <div style="background:#f8e8f0;padding:12px;border-radius:6px">
      <strong>PercentPipe</strong>
      <p>0.25 → {{ 0.25 | percent }}</p>
      <p>0.25 (1 decimal) → {{ 0.25 | percent:'1.1-1' }}</p>
      <p>0.1234 (2 decimals) → {{ 0.1234 | percent:'1.2-2' }}</p>
    </div>
  `,
})
class Ex05 {}

// 6. UpperCasePipe / LowerCasePipe
@Component({
  selector: 'ex-06',
  standalone: true,
  imports: [UpperCasePipe, LowerCasePipe],
  template: `
    <div style="background:#e8f8e8;padding:12px;border-radius:6px">
      <strong>Case Pipes</strong>
      <p>Original: {{ text }}</p>
      <p>Upper: {{ text | uppercase }}</p>
      <p>Lower: {{ text | lowercase }}</p>
    </div>
  `,
})
class Ex06 {
  text = 'Hello World i18n';
}

// 7. TitleCasePipe
@Component({
  selector: 'ex-07',
  standalone: true,
  imports: [TitleCasePipe],
  template: `
    <div style="background:#f8f8e8;padding:12px;border-radius:6px">
      <strong>TitleCasePipe</strong>
      <p>Input: "{{ sentence }}"</p>
      <p>TitleCase: "{{ sentence | titlecase }}"</p>
    </div>
  `,
})
class Ex07 {
  sentence = 'welcome to the angular i18n guide';
}

// 8. SlicePipe
@Component({
  selector: 'ex-08',
  standalone: true,
  imports: [SlicePipe],
  template: `
    <div style="background:#f0e8f8;padding:12px;border-radius:6px">
      <strong>SlicePipe</strong>
      <p>Full: {{ items | json }}</p>
      <p>slice:0:3 → {{ items | slice:0:3 | json }}</p>
      <p>slice:2 → {{ items | slice:2 | json }}</p>
      <p>slice:-2 → {{ items | slice:-2 | json }}</p>
    </div>
  `,
})
class Ex08 {
  items = ['en', 'fr', 'de', 'ja', 'ar', 'zh'];
}

// 9. JsonPipe
@Component({
  selector: 'ex-09',
  standalone: true,
  imports: [JsonPipe],
  template: `
    <div style="background:#e8f4f8;padding:12px;border-radius:6px">
      <strong>JsonPipe — debug locale config</strong>
      <pre style="background:#f0f0f0;padding:8px;font-size:0.8rem;border-radius:4px">{{ localeConfig | json }}</pre>
    </div>
  `,
})
class Ex09 {
  localeConfig = {
    locale: 'en-US',
    currency: 'USD',
    dateFormat: 'M/d/yy, h:mm a',
    numberFormat: { decimal: '.', thousands: ',' },
  };
}

// 10. KeyValuePipe
@Component({
  selector: 'ex-10',
  standalone: true,
  imports: [KeyValuePipe],
  template: `
    <div style="background:#f8f0e8;padding:12px;border-radius:6px">
      <strong>KeyValuePipe — iterate translations map</strong>
      @for (entry of labels | keyvalue; track entry.key) {
        <div style="display:flex;gap:12px">
          <code style="color:#888">{{ entry.key }}</code>
          <span>{{ entry.value }}</span>
        </div>
      }
    </div>
  `,
})
class Ex10 {
  labels: Record<string, string> = {
    greeting: 'Hello',
    farewell: 'Goodbye',
    thanks: 'Thank you',
    welcome: 'Welcome',
  };
}

// 11. AsyncPipe intro
@Component({
  selector: 'ex-11',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <div style="background:#e8f8f0;padding:12px;border-radius:6px">
      <strong>AsyncPipe with locale stream</strong>
      <p>AsyncPipe unwraps Observables/Promises in templates.</p>
      <p>Use with locale$ observable for reactive locale switching:</p>
      <pre style="background:#f0f0f0;padding:8px;font-size:0.8rem;border-radius:4px">{{ asyncExample }}</pre>
    </div>
  `,
})
class Ex11 {
  asyncExample = `// In component:
locale$ = localeService.locale$;

// In template:
{{ date | date:'medium':'':(locale$ | async) }}`;
}

// 12. i18nSelect directive concept
@Component({
  selector: 'ex-12',
  standalone: true,
  template: `
    <div style="background:#fff8e8;padding:12px;border-radius:6px">
      <strong>i18nSelect concept</strong>
      <p>Gender: <strong>{{ gender() }}</strong></p>
      <p>Message: <strong>{{ genderMap[gender()] ?? genderMap['other'] }}</strong></p>
      <button (click)="gender.set('male')">Male</button>
      <button (click)="gender.set('female')" style="margin-left:8px">Female</button>
      <button (click)="gender.set('other')" style="margin-left:8px">Other</button>
      <p style="font-size:0.8rem;color:#888">i18nSelect uses an expression + mapping object</p>
    </div>
  `,
})
class Ex12 {
  gender = signal('male');
  genderMap: Record<string, string> = {
    male: 'He liked this.',
    female: 'She liked this.',
    other: 'They liked this.',
  };
}

// 13. i18nPlural concept
@Component({
  selector: 'ex-13',
  standalone: true,
  template: `
    <div style="background:#e8f4f8;padding:12px;border-radius:6px">
      <strong>i18nPlural concept</strong>
      <p>Count: <strong>{{ count() }}</strong></p>
      <p>Message: <strong>{{ pluralMessage() }}</strong></p>
      <button (click)="count.update(c=>c-1)" [disabled]="count()===0">-</button>
      <button (click)="count.update(c=>c+1)" style="margin-left:8px">+</button>
      <p style="font-size:0.8rem;color:#888">Maps count to plural category: =0, =1, few, many, other</p>
    </div>
  `,
})
class Ex13 {
  count = signal(1);
  pluralMessage = computed(() => {
    const n = this.count();
    if (n === 0) return 'No messages';
    if (n === 1) return '1 message';
    if (n < 5) return `${n} messages (few)`;
    return `${n} messages`;
  });
}

// ─── INTERMEDIATE (14–26) ───────────────────────────────────

// 14. Locale formatting comparison
@Component({
  selector: 'ex-14',
  standalone: true,
  imports: [DatePipe, CurrencyPipe],
  template: `
    <div style="background:#f0f4e8;padding:12px;border-radius:6px">
      <strong>Locale Formatting Comparison</strong>
      <table style="border-collapse:collapse;font-size:0.85rem;width:100%">
        <tr style="background:#ddd"><th style="padding:3px 8px">Locale</th><th>Date</th><th>Amount</th></tr>
        <tr><td style="padding:2px 8px">en-US</td><td>{{ now | date:'short':'':'en-US' }}</td><td>{{ amt | currency:'USD':'symbol':'1.2-2':'en-US' }}</td></tr>
        <tr><td style="padding:2px 8px">de-DE</td><td>{{ now | date:'short':'':'de' }}</td><td>{{ amt | currency:'EUR':'symbol':'1.2-2':'de' }}</td></tr>
        <tr><td style="padding:2px 8px">ja-JP</td><td>{{ now | date:'short':'':'ja' }}</td><td>{{ amt | currency:'JPY':'symbol':'1.0-0':'ja' }}</td></tr>
      </table>
    </div>
  `,
})
class Ex14 {
  now = new Date();
  amt = 1234.56;
}

// 15. Currency formatting options
@Component({
  selector: 'ex-15',
  standalone: true,
  imports: [CurrencyPipe],
  template: `
    <div style="background:#f8f0e8;padding:12px;border-radius:6px">
      <strong>Currency Formatting Options</strong>
      <p>symbol: {{ val | currency:'USD':'symbol' }}</p>
      <p>symbol-narrow: {{ val | currency:'USD':'symbol-narrow' }}</p>
      <p>code: {{ val | currency:'USD':'code' }}</p>
      <p>name: {{ val | currency:'USD':'name' }}</p>
      <p>no symbol: {{ val | currency:'USD':'' }}</p>
    </div>
  `,
})
class Ex15 {
  val = 4200;
}

// 16. Date format tokens
@Component({
  selector: 'ex-16',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div style="background:#e8e8f8;padding:12px;border-radius:6px">
      <strong>Date Format Tokens</strong>
      <p>y: {{ d | date:'y' }} | yy: {{ d | date:'yy' }} | yyyy: {{ d | date:'yyyy' }}</p>
      <p>M: {{ d | date:'M' }} | MM: {{ d | date:'MM' }} | MMM: {{ d | date:'MMM' }} | MMMM: {{ d | date:'MMMM' }}</p>
      <p>d: {{ d | date:'d' }} | dd: {{ d | date:'dd' }}</p>
      <p>E: {{ d | date:'E' }} | EEEE: {{ d | date:'EEEE' }}</p>
      <p>h: {{ d | date:'h' }} | H: {{ d | date:'H' }} | mm: {{ d | date:'mm' }} | ss: {{ d | date:'ss' }}</p>
    </div>
  `,
})
class Ex16 {
  d = new Date(2026, 2, 21, 14, 35, 42);
}

// 17. Custom date format
@Component({
  selector: 'ex-17',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div style="background:#f8e8f0;padding:12px;border-radius:6px">
      <strong>Custom Date Formats</strong>
      <p>ISO-like: {{ d | date:"yyyy-MM-dd" }}</p>
      <p>EU: {{ d | date:"dd/MM/yyyy" }}</p>
      <p>With time: {{ d | date:"MMM d, y 'at' h:mm a" }}</p>
      <p>Week+day: {{ d | date:"'Week' w, EEEE" }}</p>
    </div>
  `,
})
class Ex17 {
  d = new Date(2026, 2, 21, 9, 5, 0);
}

// 18. Number formatting
@Component({
  selector: 'ex-18',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div style="background:#fff8e8;padding:12px;border-radius:6px">
      <strong>Number Formatting (DecimalPipe)</strong>
      <p>Format: <code>minIntegerDigits.minFractionDigits-maxFractionDigits</code></p>
      <p>1.0-0: {{ n | number:'1.0-0' }}</p>
      <p>1.2-2: {{ n | number:'1.2-2' }}</p>
      <p>3.1-4: {{ n | number:'3.1-4' }}</p>
      <p>1.0-0 (large): {{ big | number:'1.0-0' }}</p>
    </div>
  `,
})
class Ex18 {
  n = 3.14159;
  big = 1234567;
}

// 19. Plural rules
@Component({
  selector: 'ex-19',
  standalone: true,
  template: `
    <div style="background:#e8f8e8;padding:12px;border-radius:6px">
      <strong>Plural Rules</strong>
      <p>n = {{ n() }}</p>
      <p>Result: <strong>{{ pluralize() }}</strong></p>
      <input type="range" [value]="n()" (input)="n.set(+$any($event.target).value)" min="0" max="20" style="width:100%"/>
    </div>
  `,
})
class Ex19 {
  n = signal(1);
  pluralize = computed(() => {
    const v = this.n();
    const plural = new Intl.PluralRules('en-US').select(v);
    const map: Record<string, string> = { zero: 'zero items', one: 'one item', other: `${v} items` };
    return map[plural] ?? `${v} items`;
  });
}

// 20. Gender selection
@Component({
  selector: 'ex-20',
  standalone: true,
  template: `
    <div style="background:#f8e8e8;padding:12px;border-radius:6px">
      <strong>Gender Selection (i18nSelect pattern)</strong>
      <select (change)="gender.set($any($event.target).value)">
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="non-binary">Non-binary</option>
      </select>
      <p>EN: <strong>{{ getMessage('en') }}</strong></p>
      <p>FR: <strong>{{ getMessage('fr') }}</strong></p>
    </div>
  `,
})
class Ex20 {
  gender = signal('male');
  messages: Record<string, Record<string, string>> = {
    en: { male: 'He joined the team.', female: 'She joined the team.', 'non-binary': 'They joined the team.' },
    fr: { male: 'Il a rejoint l\'équipe.', female: 'Elle a rejoint l\'équipe.', 'non-binary': 'Iel a rejoint l\'équipe.' },
  };
  getMessage(lang: string) { return this.messages[lang]?.[this.gender()] ?? ''; }
}

// 21. Runtime locale switching simulation
@Component({
  selector: 'ex-21',
  standalone: true,
  imports: [DatePipe, CurrencyPipe, DecimalPipe],
  template: `
    <div style="background:#e8f4f8;padding:12px;border-radius:6px">
      <strong>Runtime Locale Switching Simulation</strong>
      <div style="margin-bottom:8px">
        @for (loc of locales; track loc) {
          <button (click)="locale.set(loc)" [style.fontWeight]="locale()===loc?'bold':'normal'" style="margin-right:6px">{{ loc }}</button>
        }
      </div>
      <p>Date: {{ now | date:'medium':'':locale() }}</p>
      <p>Currency: {{ amount | currency:'USD':'symbol':'1.2-2':locale() }}</p>
      <p>Number: {{ num | number:'1.2-2' }}</p>
    </div>
  `,
})
class Ex21 {
  locales = ['en-US', 'fr', 'de', 'ja'];
  locale = signal('en-US');
  now = new Date();
  amount = 8421.5;
  num = 12345.67;
}

// 22. Right-to-left simulation
@Component({
  selector: 'ex-22',
  standalone: true,
  template: `
    <div [dir]="dir()" style="padding:12px;border-radius:6px;background:#f0f4e8;transition:all 0.3s">
      <strong>RTL / LTR Layout Simulation</strong>
      <p>Direction: <strong>{{ dir() }}</strong></p>
      <p>{{ texts[dir()] }}</p>
      <ul>
        <li>Item One</li>
        <li>Item Two</li>
        <li>Item Three</li>
      </ul>
      <button (click)="toggle()">Toggle RTL/LTR</button>
    </div>
  `,
})
class Ex22 {
  dir = signal<'ltr' | 'rtl'>('ltr');
  texts: Record<string, string> = {
    ltr: 'Left-to-right text flow (English, French, German...)',
    rtl: 'تدفق النص من اليمين إلى اليسار (العربية، العبرية...)',
  };
  toggle() { this.dir.update(d => d === 'ltr' ? 'rtl' : 'ltr'); }
}

// 23. Translated labels map
@Component({
  selector: 'ex-23',
  standalone: true,
  template: `
    <div style="background:#f8f0e8;padding:12px;border-radius:6px">
      <strong>Translated Labels Map</strong>
      <div style="margin-bottom:8px">
        @for (lang of langs; track lang) {
          <button (click)="active.set(lang)" [style.fontWeight]="active()===lang?'bold':'normal'" style="margin-right:4px">{{ lang }}</button>
        }
      </div>
      <p>{{ t('greeting') }}, {{ t('world') }}!</p>
      <p>{{ t('welcome') }}</p>
    </div>
  `,
})
class Ex23 {
  langs = ['en', 'es', 'fr', 'de'];
  active = signal('en');
  translations: Record<string, Record<string, string>> = {
    en: { greeting: 'Hello', world: 'World', welcome: 'Welcome to Angular i18n' },
    es: { greeting: 'Hola', world: 'Mundo', welcome: 'Bienvenido a Angular i18n' },
    fr: { greeting: 'Bonjour', world: 'Monde', welcome: 'Bienvenue dans Angular i18n' },
    de: { greeting: 'Hallo', world: 'Welt', welcome: 'Willkommen bei Angular i18n' },
  };
  t(key: string) { return this.translations[this.active()]?.[key] ?? key; }
}

// 24. Multi-language labels signal
@Component({
  selector: 'ex-24',
  standalone: true,
  template: `
    <div style="background:#e8e8f8;padding:12px;border-radius:6px">
      <strong>Multi-language Labels (signal-based)</strong>
      <select (change)="lang.set($any($event.target).value)">
        <option value="en">English</option>
        <option value="ja">日本語</option>
        <option value="ar">العربية</option>
      </select>
      <p>{{ labels().save }}</p>
      <p>{{ labels().cancel }}</p>
      <p>{{ labels().delete }}</p>
    </div>
  `,
})
class Ex24 {
  lang = signal('en');
  allLabels: Record<string, Record<string, string>> = {
    en: { save: 'Save', cancel: 'Cancel', delete: 'Delete' },
    ja: { save: '保存', cancel: 'キャンセル', delete: '削除' },
    ar: { save: 'حفظ', cancel: 'إلغاء', delete: 'حذف' },
  };
  labels = computed(() => this.allLabels[this.lang()] ?? this.allLabels['en']);
}

// 25. Locale-aware sorting
@Component({
  selector: 'ex-25',
  standalone: true,
  template: `
    <div style="background:#f8e8f0;padding:12px;border-radius:6px">
      <strong>Locale-aware Sorting</strong>
      <div style="margin-bottom:6px">
        @for (loc of locales; track loc) {
          <button (click)="locale.set(loc)" style="margin-right:4px" [style.fontWeight]="locale()===loc?'bold':'normal'">{{ loc }}</button>
        }
      </div>
      <p>Sorted ({{ locale() }}): {{ sorted().join(', ') }}</p>
    </div>
  `,
})
class Ex25 {
  locales = ['en', 'sv', 'de'];
  locale = signal('en');
  items = signal(['Österreich', 'Åland', 'Angola', 'Australia', 'Ängland']);
  sorted = computed(() =>
    [...this.items()].sort((a, b) => a.localeCompare(b, this.locale()))
  );
}

// 26. Locale-aware number comparison
@Component({
  selector: 'ex-26',
  standalone: true,
  template: `
    <div style="background:#e8f8f0;padding:12px;border-radius:6px">
      <strong>Locale-aware Number Formatting</strong>
      <p>Value: {{ value() }}</p>
      <p>en-US: {{ formatNum('en-US') }}</p>
      <p>de-DE: {{ formatNum('de-DE') }} (comma as decimal)</p>
      <p>hi-IN: {{ formatNum('hi-IN') }} (Indian grouping)</p>
      <input type="range" [value]="value()" (input)="value.set(+$any($event.target).value)" min="1000" max="9999999" step="1000" style="width:100%"/>
    </div>
  `,
})
class Ex26 {
  value = signal(1234567.89);
  formatNum(locale: string) {
    return new Intl.NumberFormat(locale, { minimumFractionDigits: 2 }).format(this.value());
  }
}

// ─── NESTED (27–38) ─────────────────────────────────────────

// 27. Full locale service simulation
@Component({
  selector: 'ex-27',
  standalone: true,
  imports: [DatePipe, CurrencyPipe],
  template: `
    <div style="background:#e8f4f8;padding:12px;border-radius:6px">
      <strong>LocaleService Simulation</strong>
      <p>locale: <strong>{{ localeService.locale() }}</strong> | currency: <strong>{{ localeService.currency() }}</strong></p>
      <p>Date: {{ now | date:'longDate':'':localeService.locale() }}</p>
      <p>Price: {{ 99.99 | currency:localeService.currency():'symbol':'1.2-2':localeService.locale() }}</p>
      <button (click)="localeService.setLocale('en-US')">EN</button>
      <button (click)="localeService.setLocale('fr')" style="margin-left:6px">FR</button>
      <button (click)="localeService.setLocale('de')" style="margin-left:6px">DE</button>
    </div>
  `,
})
class Ex27 {
  now = new Date();
  localeService = (() => {
    const locale = signal('en-US');
    const currencyMap: Record<string, string> = { 'en-US': 'USD', 'fr': 'EUR', 'de': 'EUR' };
    const currency = computed(() => currencyMap[locale()] ?? 'USD');
    return { locale, currency, setLocale: (l: string) => locale.set(l) };
  })();
}

// 28. Translated component
@Component({
  selector: 'ex-28',
  standalone: true,
  template: `
    <div style="background:#f0f4e8;padding:12px;border-radius:6px">
      <strong>Translated Component Pattern</strong>
      <div style="background:white;padding:8px;border-radius:4px;margin:4px 0">
        <h3 style="margin:0 0 6px">{{ t('title') }}</h3>
        <p>{{ t('description') }}</p>
        <button>{{ t('action') }}</button>
      </div>
      <div style="margin-top:6px">
        <button (click)="lang.set('en')">EN</button>
        <button (click)="lang.set('es')" style="margin-left:6px">ES</button>
        <button (click)="lang.set('zh')" style="margin-left:6px">ZH</button>
      </div>
    </div>
  `,
})
class Ex28 {
  lang = signal('en');
  msgs: Record<string, Record<string, string>> = {
    en: { title: 'User Settings', description: 'Manage your account preferences.', action: 'Save Changes' },
    es: { title: 'Configuración', description: 'Administra tus preferencias.', action: 'Guardar Cambios' },
    zh: { title: '用户设置', description: '管理您的帐户偏好。', action: '保存更改' },
  };
  t(key: string) { return this.msgs[this.lang()]?.[key] ?? key; }
}

// 29. Locale-aware form validation
@Component({
  selector: 'ex-29',
  standalone: true,
  template: `
    <div style="background:#f8f0e8;padding:12px;border-radius:6px">
      <strong>Locale-aware Form Validation</strong>
      <select (change)="locale.set($any($event.target).value)" style="margin-bottom:8px">
        <option value="en-US">en-US (MM/DD/YYYY)</option>
        <option value="de">de (DD.MM.YYYY)</option>
      </select>
      <input [placeholder]="placeholder()" (input)="validate($any($event.target).value)" style="display:block;width:180px"/>
      <p [style.color]="valid() ? 'green' : 'red'">{{ msg() }}</p>
    </div>
  `,
})
class Ex29 {
  locale = signal('en-US');
  valid = signal(false);
  msg = signal('Enter a date');
  placeholder = computed(() => this.locale() === 'en-US' ? 'MM/DD/YYYY' : 'DD.MM.YYYY');
  validate(v: string) {
    const usPattern = /^\d{2}\/\d{2}\/\d{4}$/;
    const dePattern = /^\d{2}\.\d{2}\.\d{4}$/;
    const ok = this.locale() === 'en-US' ? usPattern.test(v) : dePattern.test(v);
    this.valid.set(ok);
    this.msg.set(ok ? 'Valid date format' : `Use ${this.placeholder()}`);
  }
}

// 30. Locale-specific error messages
@Component({
  selector: 'ex-30',
  standalone: true,
  template: `
    <div style="background:#e8e8f8;padding:12px;border-radius:6px">
      <strong>Locale-specific Error Messages</strong>
      <select (change)="lang.set($any($event.target).value)" style="margin-bottom:8px">
        <option value="en">English</option>
        <option value="fr">Français</option>
        <option value="pt">Português</option>
      </select>
      @for (err of errors; track err) {
        <p style="color:red;margin:2px 0">{{ getError(err) }}</p>
      }
    </div>
  `,
})
class Ex30 {
  lang = signal('en');
  errors = ['required', 'minLength', 'email'];
  errMsgs: Record<string, Record<string, string>> = {
    en: { required: 'This field is required.', minLength: 'Too short (min 8 chars).', email: 'Invalid email address.' },
    fr: { required: 'Ce champ est requis.', minLength: 'Trop court (min 8 chars).', email: 'Adresse e-mail invalide.' },
    pt: { required: 'Este campo é obrigatório.', minLength: 'Muito curto (mín. 8 chars).', email: 'Endereço de e-mail inválido.' },
  };
  getError(key: string) { return this.errMsgs[this.lang()]?.[key] ?? key; }
}

// 31. Locale-aware template patterns
@Component({
  selector: 'ex-31',
  standalone: true,
  imports: [DatePipe, DecimalPipe, PercentPipe],
  template: `
    <div style="background:#f8e8f0;padding:12px;border-radius:6px">
      <strong>Locale-aware Template Patterns</strong>
      <p>Greeting: {{ greeting() }}</p>
      <p>Date: {{ today | date:'fullDate':'':locale() }}</p>
      <p>Score: {{ score | number:'1.1-1' }} / {{ max | number }}</p>
      <p>Progress: {{ score / max | percent:'1.1-1' }}</p>
      <button (click)="locale.set('en-US')">EN</button>
      <button (click)="locale.set('fr')" style="margin-left:6px">FR</button>
    </div>
  `,
})
class Ex31 {
  locale = signal('en-US');
  today = new Date();
  score = 87.5;
  max = 100;
  greeting = computed(() => this.locale() === 'en-US' ? 'Good morning!' : 'Bonjour !');
}

// 32. Dynamic locale formatting
@Component({
  selector: 'ex-32',
  standalone: true,
  template: `
    <div style="background:#fff8e8;padding:12px;border-radius:6px">
      <strong>Dynamic Locale Formatting (Intl API)</strong>
      <p>Value: {{ value() }}</p>
      @for (loc of locales; track loc) {
        <div style="display:flex;justify-content:space-between;padding:1px 0">
          <span style="color:#888;width:70px">{{ loc }}</span>
          <span>{{ format(loc) }}</span>
        </div>
      }
      <input type="range" [value]="value()" (input)="value.set(+$any($event.target).value)" min="0" max="1000000" step="1000" style="width:100%;margin-top:6px"/>
    </div>
  `,
})
class Ex32 {
  locales = ['en-US', 'de-DE', 'fr-FR', 'ja-JP', 'ar-SA'];
  value = signal(123456.78);
  format(locale: string) {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(this.value());
  }
}

// 33. Number grouping separators
@Component({
  selector: 'ex-33',
  standalone: true,
  template: `
    <div style="background:#e8f8e8;padding:12px;border-radius:6px">
      <strong>Number Grouping Separators</strong>
      <table style="font-size:0.85rem;width:100%;border-collapse:collapse">
        <tr style="background:#ddd"><th style="padding:3px 6px;text-align:left">Locale</th><th style="text-align:right">1234567.89</th></tr>
        @for (row of rows; track row.locale) {
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:2px 6px">{{ row.locale }}</td>
            <td style="padding:2px 6px;text-align:right">{{ row.formatted }}</td>
          </tr>
        }
      </table>
    </div>
  `,
})
class Ex33 {
  rows = ['en-US', 'de-DE', 'fr-FR', 'hi-IN', 'ar-EG'].map(locale => ({
    locale,
    formatted: new Intl.NumberFormat(locale, { minimumFractionDigits: 2 }).format(1234567.89),
  }));
}

// 34. Locale date ranges
@Component({
  selector: 'ex-34',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div style="background:#f8e8e8;padding:12px;border-radius:6px">
      <strong>Locale Date Ranges</strong>
      <p>Start: {{ start | date:'mediumDate':'':'en-US' }}</p>
      <p>End: {{ end | date:'mediumDate':'':'en-US' }}</p>
      <p>Duration: {{ durationDays() }} days</p>
      <p>Range: {{ start | date:"MMM d" }} – {{ end | date:"MMM d, y" }}</p>
    </div>
  `,
})
class Ex34 {
  start = new Date(2026, 2, 1);
  end = new Date(2026, 2, 21);
  durationDays = computed(() =>
    Math.round((this.end.getTime() - this.start.getTime()) / (1000 * 60 * 60 * 24))
  );
}

// 35. Nested translated content
@Component({
  selector: 'ex-35',
  standalone: true,
  template: `
    <div style="background:#e8f4f8;padding:12px;border-radius:6px">
      <strong>Nested Translated Content</strong>
      <div [dir]="isRtl() ? 'rtl' : 'ltr'" style="background:white;padding:8px;border-radius:4px">
        <h4 style="margin:0 0 4px">{{ nav().title }}</h4>
        <ul style="margin:0">
          @for (item of nav().items; track item) { <li>{{ item }}</li> }
        </ul>
      </div>
      <button (click)="lang.set('en')" style="margin-top:6px">EN</button>
      <button (click)="lang.set('ar')" style="margin-left:6px">AR</button>
    </div>
  `,
})
class Ex35 {
  lang = signal('en');
  isRtl = computed(() => this.lang() === 'ar');
  navData: Record<string, { title: string; items: string[] }> = {
    en: { title: 'Navigation', items: ['Home', 'Products', 'About', 'Contact'] },
    ar: { title: 'التنقل', items: ['الرئيسية', 'المنتجات', 'حول', 'اتصل بنا'] },
  };
  nav = computed(() => this.navData[this.lang()]);
}

// 36. Locale-aware routing simulation
@Component({
  selector: 'ex-36',
  standalone: true,
  template: `
    <div style="background:#f0f4e8;padding:12px;border-radius:6px">
      <strong>Locale-aware Routing</strong>
      <p>Current URL: <code>{{ url() }}</code></p>
      <p>Locale from URL: <strong>{{ localeFromUrl() }}</strong></p>
      <button (click)="navigate('en')">EN</button>
      <button (click)="navigate('fr')" style="margin-left:6px">FR</button>
      <button (click)="navigate('de')" style="margin-left:6px">DE</button>
      <p style="font-size:0.8rem;color:#888">Pattern: /:locale/route (e.g. /fr/products)</p>
    </div>
  `,
})
class Ex36 {
  url = signal('/en/home');
  localeFromUrl = computed(() => this.url().split('/')[1] ?? 'en');
  navigate(locale: string) { this.url.update(u => u.replace(/^\/[^/]+/, `/${locale}`)); }
}

// 37. Locale store with signals
@Component({
  selector: 'ex-37',
  standalone: true,
  imports: [DatePipe, CurrencyPipe],
  template: `
    <div style="background:#f8f0e8;padding:12px;border-radius:6px">
      <strong>Locale Store with Signals</strong>
      <p>Locale: {{ store.locale() }} | Dir: {{ store.dir() }} | TimeZone: {{ store.tz() }}</p>
      <p>Date: {{ now | date:'medium':'':store.locale() }}</p>
      <select (change)="store.setLocale($any($event.target).value)">
        <option value="en-US">English (US)</option>
        <option value="ar">Arabic</option>
        <option value="ja">Japanese</option>
      </select>
    </div>
  `,
})
class Ex37 {
  now = new Date();
  store = (() => {
    const locale = signal('en-US');
    const dir = computed(() => locale() === 'ar' ? 'rtl' : 'ltr');
    const tz = computed(() => ({ 'en-US': 'America/New_York', 'ar': 'Asia/Riyadh', 'ja': 'Asia/Tokyo' }[locale()] ?? 'UTC'));
    return { locale, dir, tz, setLocale: (l: string) => locale.set(l) };
  })();
}

// 38. Locale persistence to localStorage
@Component({
  selector: 'ex-38',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div style="background:#e8e8f8;padding:12px;border-radius:6px">
      <strong>Locale Persistence (localStorage)</strong>
      <p>Saved locale: <strong>{{ locale() }}</strong></p>
      <p>Date: {{ now | date:'fullDate':'':locale() }}</p>
      <button (click)="setLocale('en-US')">EN-US</button>
      <button (click)="setLocale('fr')" style="margin-left:6px">FR</button>
      <button (click)="setLocale('de')" style="margin-left:6px">DE</button>
      <p style="font-size:0.8rem;color:#888">Reloading would restore saved locale</p>
    </div>
  `,
})
class Ex38 {
  locale = signal(localStorage.getItem('app_locale') ?? 'en-US');
  now = new Date();
  setLocale(l: string) {
    this.locale.set(l);
    localStorage.setItem('app_locale', l);
  }
}

// ─── ADVANCED (39–50) ────────────────────────────────────────

// 39. Full i18n service
@Component({
  selector: 'ex-39',
  standalone: true,
  imports: [DatePipe, CurrencyPipe, PercentPipe],
  template: `
    <div style="background:#e8f4f8;padding:12px;border-radius:6px">
      <strong>Full i18n Service</strong>
      <p>{{ i18n.t('greeting', { name: 'Alice' }) }}</p>
      <p>Date: {{ now | date:'longDate':'':i18n.locale() }}</p>
      <p>Price: {{ 49.99 | currency:i18n.currencyCode():'symbol':'1.2-2':i18n.locale() }}</p>
      <div style="margin-top:6px">
        @for (lang of i18n.availableLocales; track lang) {
          <button (click)="i18n.setLocale(lang)" style="margin-right:4px" [style.fontWeight]="i18n.locale()===lang?'bold':'normal'">{{ lang }}</button>
        }
      </div>
    </div>
  `,
})
class Ex39 {
  now = new Date();
  i18n = (() => {
    const locale = signal('en-US');
    const availableLocales = ['en-US', 'fr', 'de', 'ja'];
    const currencyCode = computed(() => ({ 'en-US': 'USD', 'fr': 'EUR', 'de': 'EUR', 'ja': 'JPY' }[locale()] ?? 'USD'));
    const msgs: Record<string, Record<string, string>> = {
      'en-US': { greeting: 'Hello, {name}!' },
      'fr': { greeting: 'Bonjour, {name} !' },
      'de': { greeting: 'Hallo, {name}!' },
      'ja': { greeting: 'こんにちは、{name}さん！' },
    };
    const t = (key: string, params?: Record<string, string>) => {
      let msg = msgs[locale()]?.[key] ?? key;
      if (params) Object.entries(params).forEach(([k, v]) => msg = msg.replace(`{${k}}`, v));
      return msg;
    };
    return { locale, currencyCode, availableLocales, setLocale: (l: string) => locale.set(l), t };
  })();
}

// 40. Interpolation in translations
@Component({
  selector: 'ex-40',
  standalone: true,
  template: `
    <div style="background:#f0f4e8;padding:12px;border-radius:6px">
      <strong>Interpolation in Translations</strong>
      <p>{{ interpolate('welcome', { name: name(), count: unread() }) }}</p>
      <p>{{ interpolate('items_left', { count: itemsLeft() }) }}</p>
      <button (click)="name.set('Bob')">Switch to Bob</button>
      <button (click)="unread.update(n=>n+1)" style="margin-left:6px">+ unread</button>
    </div>
  `,
})
class Ex40 {
  name = signal('Alice');
  unread = signal(3);
  itemsLeft = signal(7);
  templates: Record<string, string> = {
    welcome: 'Welcome back, {name}! You have {count} unread messages.',
    items_left: '{count} items remaining in your cart.',
  };
  interpolate(key: string, params: Record<string, string | number>) {
    return Object.entries(params).reduce(
      (s, [k, v]) => s.replace(`{${k}}`, String(v)),
      this.templates[key] ?? key
    );
  }
}

// 41. ICU message simulation
@Component({
  selector: 'ex-41',
  standalone: true,
  template: `
    <div style="background:#f8f0e8;padding:12px;border-radius:6px">
      <strong>ICU Message Format Simulation</strong>
      <p>Guests: {{ guests() }} | Gender: {{ gender() }}</p>
      <p><em>{{ icuMessage() }}</em></p>
      <input type="range" [value]="guests()" (input)="guests.set(+$any($event.target).value)" min="0" max="5" style="width:100%"/>
      <select (change)="gender.set($any($event.target).value)">
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>
    </div>
  `,
})
class Ex41 {
  guests = signal(1);
  gender = signal('male');
  icuMessage = computed(() => {
    const g = this.guests();
    const genderPronoun: Record<string, string> = { male: 'He', female: 'She', other: 'They' };
    const pronoun = genderPronoun[this.gender()] ?? 'They';
    if (g === 0) return `${pronoun} is attending alone.`;
    if (g === 1) return `${pronoun} is bringing 1 guest.`;
    return `${pronoun} is bringing ${g} guests.`;
  });
}

// 42. Plural + gender combined
@Component({
  selector: 'ex-42',
  standalone: true,
  template: `
    <div style="background:#e8e8f8;padding:12px;border-radius:6px">
      <strong>Plural + Gender Combined</strong>
      <p>{{ message() }}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
        <button (click)="count.update(c=>Math.max(0,c-1))">- count</button>
        <button (click)="count.update(c=>c+1)">+ count</button>
        <button (click)="gender.set(gender()==='male'?'female':'male')">Toggle gender</button>
      </div>
      <p style="font-size:0.85rem">count={{ count() }}, gender={{ gender() }}</p>
    </div>
  `,
})
class Ex42 {
  count = signal(1);
  gender = signal('male');
  message = computed(() => {
    const c = this.count();
    const g = this.gender();
    const subject = g === 'male' ? 'He' : 'She';
    if (c === 0) return `${subject} has no followers.`;
    if (c === 1) return `${subject} has 1 follower.`;
    return `${subject} has ${c} followers.`;
  });
}

// 43. Date locale with timezone
@Component({
  selector: 'ex-43',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div style="background:#f8e8f0;padding:12px;border-radius:6px">
      <strong>Date with Timezone</strong>
      <p>UTC: {{ now | date:'medium':'UTC' }}</p>
      <p>NY: {{ now | date:'medium':'America/New_York' }}</p>
      <p>London: {{ now | date:'medium':'Europe/London' }}</p>
      <p>Tokyo: {{ now | date:'medium':'Asia/Tokyo' }}</p>
      <p>Dubai: {{ now | date:'medium':'+0400' }}</p>
    </div>
  `,
})
class Ex43 {
  now = new Date();
}

// 44. Bidirectional text
@Component({
  selector: 'ex-44',
  standalone: true,
  template: `
    <div style="background:#fff8e8;padding:12px;border-radius:6px">
      <strong>Bidirectional Text (Unicode bidi)</strong>
      <p dir="ltr">LTR: The price is <bdi>{{ arabicPrice }}</bdi> riyals.</p>
      <p dir="rtl">RTL: السعر هو <bdi>{{ englishText }}</bdi> فقط.</p>
      <p>Mixed: <span dir="ltr">Angular</span> + <span dir="rtl" style="display:inline-block">زاوية</span></p>
      <p style="font-size:0.8rem;color:#888">Use &lt;bdi&gt; for user-generated bidirectional content</p>
    </div>
  `,
})
class Ex44 {
  arabicPrice = '٥٠٠';
  englishText = 'Angular i18n';
}

// 45. RTL layout detection
@Component({
  selector: 'ex-45',
  standalone: true,
  template: `
    <div style="background:#e8f8f0;padding:12px;border-radius:6px">
      <strong>RTL Layout Detection & Adaptation</strong>
      <select (change)="locale.set($any($event.target).value)">
        <option value="en">English (LTR)</option>
        <option value="ar">Arabic (RTL)</option>
        <option value="he">Hebrew (RTL)</option>
        <option value="fa">Persian (RTL)</option>
      </select>
      <div [dir]="isRtl() ? 'rtl' : 'ltr'" style="background:white;padding:8px;border-radius:4px;margin-top:8px">
        <p>Direction: <strong>{{ isRtl() ? 'RTL' : 'LTR' }}</strong></p>
        <div style="display:flex;gap:8px">
          <div style="background:#e0e0e0;padding:4px 8px;border-radius:4px">Main</div>
          <div style="background:#c0d0ff;padding:4px 8px;border-radius:4px">Sidebar</div>
        </div>
      </div>
    </div>
  `,
})
class Ex45 {
  locale = signal('en');
  rtlLocales = ['ar', 'he', 'fa', 'ur'];
  isRtl = computed(() => this.rtlLocales.includes(this.locale()));
}

// 46. Locale-aware currency conversion
@Component({
  selector: 'ex-46',
  standalone: true,
  template: `
    <div style="background:#f8e8e8;padding:12px;border-radius:6px">
      <strong>Locale-aware Currency Conversion</strong>
      <p>Base (USD): ${{ base() }}</p>
      @for (cur of currencies; track cur.code) {
        <div style="display:flex;justify-content:space-between">
          <span>{{ cur.code }}</span>
          <span>{{ convert(cur.rate) }}</span>
        </div>
      }
      <input type="range" [value]="base()" (input)="base.set(+$any($event.target).value)" min="1" max="1000" style="width:100%;margin-top:6px"/>
    </div>
  `,
})
class Ex46 {
  base = signal(100);
  currencies = [
    { code: 'EUR', rate: 0.92, locale: 'de-DE' },
    { code: 'GBP', rate: 0.79, locale: 'en-GB' },
    { code: 'JPY', rate: 149.5, locale: 'ja-JP' },
  ];
  convert(rate: number) {
    return new Intl.NumberFormat('en', { minimumFractionDigits: 2 }).format(+(this.base() * rate).toFixed(2));
  }
}

// 47. Locale-aware relative dates
@Component({
  selector: 'ex-47',
  standalone: true,
  template: `
    <div style="background:#e8f4f8;padding:12px;border-radius:6px">
      <strong>Locale-aware Relative Dates (Intl.RelativeTimeFormat)</strong>
      <select (change)="locale.set($any($event.target).value)">
        <option value="en">English</option>
        <option value="fr">French</option>
        <option value="de">German</option>
        <option value="ja">Japanese</option>
      </select>
      @for (item of relItems; track item.value) {
        <p>{{ formatRelative(item.value, item.unit) }}</p>
      }
    </div>
  `,
})
class Ex47 {
  locale = signal('en');
  relItems = [
    { value: -5, unit: 'minute' as const },
    { value: -2, unit: 'hour' as const },
    { value: -1, unit: 'day' as const },
    { value: 3, unit: 'day' as const },
    { value: 1, unit: 'week' as const },
  ];
  formatRelative(value: number, unit: Intl.RelativeTimeFormatUnit) {
    return new Intl.RelativeTimeFormat(this.locale(), { numeric: 'auto' }).format(value, unit);
  }
}

// 48. i18n with Angular CDK
@Component({
  selector: 'ex-48',
  standalone: true,
  template: `
    <div style="background:#f0f4e8;padding:12px;border-radius:6px">
      <strong>i18n with Angular CDK Patterns</strong>
      <ul style="font-size:0.85rem;margin:4px 0">
        <li>CDK BidiModule: provides Directionality service</li>
        <li>inject(Directionality).value gives 'ltr' or 'rtl'</li>
        <li>dir.change observable emits on direction change</li>
        <li>CDK a11y: AriaDescriber uses locale-aware IDs</li>
      </ul>
      <pre style="background:#f0f0f0;padding:8px;font-size:0.75rem;border-radius:4px">{{ cdkCode }}</pre>
    </div>
  `,
})
class Ex48 {
  cdkCode = `@Component({
  template: \`<div [dir]="dir.value">\`
})
class MyComp {
  dir = inject(Directionality);
}`;
}

// 49. i18n testing patterns
@Component({
  selector: 'ex-49',
  standalone: true,
  template: `
    <div style="background:#f8f0e8;padding:12px;border-radius:6px">
      <strong>i18n Testing Patterns</strong>
      <pre style="background:#f0f0f0;padding:8px;font-size:0.75rem;border-radius:4px;overflow:auto">{{ testCode }}</pre>
    </div>
  `,
})
class Ex49 {
  testCode = `// Testing locale-aware components:
TestBed.configureTestingModule({
  providers: [
    { provide: LOCALE_ID, useValue: 'fr' },
    { provide: APP_BASE_HREF, useValue: '/fr/' },
  ],
});

// Verify translated text:
expect(fixture.nativeElement.textContent).toContain('Bonjour');

// Test pipe output:
const pipe = new DatePipe('de');
expect(pipe.transform(date, 'short', '', 'de')).toBeTruthy();`;
}

// 50. Production i18n architecture
@Component({
  selector: 'ex-50',
  standalone: true,
  template: `
    <div style="background:#e8e8f8;padding:12px;border-radius:6px">
      <strong>Production i18n Architecture</strong>
      <ul style="font-size:0.85rem;margin:4px 0">
        @for (point of points; track point) { <li>{{ point }}</li> }
      </ul>
    </div>
  `,
})
class Ex50 {
  points = [
    'Use LOCALE_ID token; register locales with registerLocaleData()',
    'ng extract-i18n → XLIFF 2.0 for professional translation tools',
    'ng build --localize generates separate bundles per locale',
    'Serve locale bundles via nginx/CDN based on Accept-Language',
    'Use @angular/localize for $localize tagged templates in TS',
    'ICU messages handle plural/gender in xliff files',
    'Third-party: @ngx-translate for runtime switching (no rebuild)',
    'Signals enable reactive locale service without BehaviorSubject',
    'Lazy-load translation data per locale to minimize bundle size',
    'Test with LOCALE_ID provider; snapshot-test rendered output',
  ];
}

// ─── AppComponent ────────────────────────────────────────────

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
      <h1>Examples 7.4 — Angular i18n &amp; Localization</h1>

      <h4>1. i18n concept overview</h4><ex-01 /><hr />
      <h4>2. DatePipe with locale</h4><ex-02 /><hr />
      <h4>3. CurrencyPipe</h4><ex-03 /><hr />
      <h4>4. DecimalPipe</h4><ex-04 /><hr />
      <h4>5. PercentPipe</h4><ex-05 /><hr />
      <h4>6. UpperCasePipe / LowerCasePipe</h4><ex-06 /><hr />
      <h4>7. TitleCasePipe</h4><ex-07 /><hr />
      <h4>8. SlicePipe</h4><ex-08 /><hr />
      <h4>9. JsonPipe</h4><ex-09 /><hr />
      <h4>10. KeyValuePipe</h4><ex-10 /><hr />
      <h4>11. AsyncPipe intro</h4><ex-11 /><hr />
      <h4>12. i18nSelect concept</h4><ex-12 /><hr />
      <h4>13. i18nPlural concept</h4><ex-13 /><hr />

      <h4>14. Locale formatting comparison</h4><ex-14 /><hr />
      <h4>15. Currency formatting options</h4><ex-15 /><hr />
      <h4>16. Date format tokens</h4><ex-16 /><hr />
      <h4>17. Custom date format</h4><ex-17 /><hr />
      <h4>18. Number formatting</h4><ex-18 /><hr />
      <h4>19. Plural rules</h4><ex-19 /><hr />
      <h4>20. Gender selection</h4><ex-20 /><hr />
      <h4>21. Runtime locale switching simulation</h4><ex-21 /><hr />
      <h4>22. Right-to-left simulation</h4><ex-22 /><hr />
      <h4>23. Translated labels map</h4><ex-23 /><hr />
      <h4>24. Multi-language labels signal</h4><ex-24 /><hr />
      <h4>25. Locale-aware sorting</h4><ex-25 /><hr />
      <h4>26. Locale-aware number comparison</h4><ex-26 /><hr />

      <h4>27. Full locale service simulation</h4><ex-27 /><hr />
      <h4>28. Translated component</h4><ex-28 /><hr />
      <h4>29. Locale-aware form validation</h4><ex-29 /><hr />
      <h4>30. Locale-specific error messages</h4><ex-30 /><hr />
      <h4>31. Locale-aware template patterns</h4><ex-31 /><hr />
      <h4>32. Dynamic locale formatting</h4><ex-32 /><hr />
      <h4>33. Number grouping separators</h4><ex-33 /><hr />
      <h4>34. Locale date ranges</h4><ex-34 /><hr />
      <h4>35. Nested translated content</h4><ex-35 /><hr />
      <h4>36. Locale-aware routing simulation</h4><ex-36 /><hr />
      <h4>37. Locale store with signals</h4><ex-37 /><hr />
      <h4>38. Locale persistence to localStorage</h4><ex-38 /><hr />

      <h4>39. Full i18n service</h4><ex-39 /><hr />
      <h4>40. Interpolation in translations</h4><ex-40 /><hr />
      <h4>41. ICU message simulation</h4><ex-41 /><hr />
      <h4>42. Plural + gender combined</h4><ex-42 /><hr />
      <h4>43. Date locale with timezone</h4><ex-43 /><hr />
      <h4>44. Bidirectional text</h4><ex-44 /><hr />
      <h4>45. RTL layout detection</h4><ex-45 /><hr />
      <h4>46. Locale-aware currency conversion</h4><ex-46 /><hr />
      <h4>47. Locale-aware relative dates</h4><ex-47 /><hr />
      <h4>48. i18n with Angular CDK</h4><ex-48 /><hr />
      <h4>49. i18n testing patterns</h4><ex-49 /><hr />
      <h4>50. Production i18n architecture</h4><ex-50 />
    </div>
  `,
})
export class AppComponent {}
