// Phase 7 - Exercise 04: Internationalization (i18n)
// Topics: @angular/localize, i18n attribute, $localize tag, ICU expressions, locale switching

import { Component } from '@angular/core';

// ─────────────────────────────────────────────
// TODO 1: I18nTextComponent — i18n="@@key" attribute usage
//
// Angular i18n extracts marked strings for translation.
// Run: ng extract-i18n → generates messages.xlf
// Translators fill in translations.
// Run: ng build --localize to build for each locale.
//
// Create I18nTextComponent:
// - Template showing i18n-marked strings:
//   <h1 i18n="@@home.title">Welcome to the App</h1>
//   <p i18n="@@home.description|Description of the home page">
//     This is a demo of Angular i18n.
//   </p>
// - Also show $localize for code-level translations:
//   const title = $localize`:@@page.title:Page Title`;
// - Explain the @@id format and description:
//   i18n="description|meaning@@id"
// ─────────────────────────────────────────────

// TODO 1: I18nTextComponent
// @Component({ ... })
// export class I18nTextComponent { }

// ─────────────────────────────────────────────
// TODO 2: PluralMessageComponent — ICU plural expressions
//
// ICU plural syntax:
//   {count, plural,
//     =0    {No messages}
//     =1    {1 new message}
//     other {{{ count }} new messages}
//   }
//
// Create PluralMessageComponent:
// - @Input() count: number
// - Template:
//   <p i18n>
//     {count, plural,
//       =0    {No items in your cart}
//       =1    {1 item in your cart}
//       other {{{ count }} items in your cart}
//     }
//   </p>
// - Add a +/- counter to change count dynamically
// ─────────────────────────────────────────────

// TODO 2: PluralMessageComponent
// @Component({ ... })
// export class PluralMessageComponent { }

// ─────────────────────────────────────────────
// TODO 3: SelectMessageComponent — ICU select for gender
//
// ICU select syntax:
//   {gender, select,
//     male   {He liked this}
//     female {She liked this}
//     other  {They liked this}
//   }
//
// Create GenderMessageComponent:
// - @Input() name: string
// - @Input() gender: 'male' | 'female' | 'other'
// - Template uses ICU select:
//   <p i18n>
//     {gender, select,
//       male   {{{ name }} liked this post}
//       female {{{ name }} liked this post}
//       other  {{{ name }} liked this post}
//     }
//   </p>
// ─────────────────────────────────────────────

// TODO 3: GenderMessageComponent
// @Component({ ... })
// export class GenderMessageComponent { }

// ─────────────────────────────────────────────
// TODO 4: DateLocaleComponent — DatePipe with locale
//
// Create DateLocaleComponent:
// - Show the same date formatted in multiple locales using DatePipe
// - {{ today | date:'fullDate':'':'en-US' }}
// - {{ today | date:'fullDate':'':'de-DE' }}
// - {{ today | date:'fullDate':'':'fr-FR' }}
// - {{ today | date:'fullDate':'':'ja-JP' }}
// - {{ price | currency:'EUR':'symbol':'1.2-2':'de-DE' }}
// - {{ price | number:'1.3-3':'ar-SA' }}  ← Arabic numerals
//
// Note: register the locale in main.ts:
//   import { registerLocaleData } from '@angular/common';
//   import localeDe from '@angular/common/locales/de';
//   registerLocaleData(localeDe);
// ─────────────────────────────────────────────

// TODO 4: DateLocaleComponent
// @Component({ ... })
// export class DateLocaleComponent { }

// ─────────────────────────────────────────────
// TODO 5: LocaleSwitcherComponent — LOCALE_ID token, runtime locale
//
// Note: Angular's built-in i18n compiles separate builds per locale.
// For runtime locale switching, use ngx-translate or a custom solution.
//
// Create LocaleSwitcherComponent that:
// - Reads the current LOCALE_ID token: inject(LOCALE_ID)
// - Shows current locale
// - Explains the difference between:
//   a) Build-time i18n (Angular native): separate bundles, fastest runtime
//   b) Runtime i18n (ngx-translate): single bundle, dynamic switching
// - Shows how to set LOCALE_ID in providers:
//   { provide: LOCALE_ID, useValue: 'de-DE' }
//   OR
//   { provide: LOCALE_ID, useFactory: () => navigator.language }
// ─────────────────────────────────────────────

// TODO 5: LocaleSwitcherComponent
// @Component({ ... })
// export class LocaleSwitcherComponent { }

// ─────────────────────────────────────────────
// TODO 6: Add all components to imports[] in AppComponent
// ─────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO 6: import components here
  ],
  template: `
    <h1>i18n Exercise</h1>
    <!-- TODO 6: render components here -->
  `,
})
export class AppComponent {}
