import { Component } from '@angular/core';

// ============================================================
// Exercise 2.2 — Pipes
// ============================================================
// Topics:
//   • Built-in pipes: DatePipe, CurrencyPipe, UpperCasePipe,
//     LowerCasePipe, TitleCasePipe, DecimalPipe, PercentPipe,
//     JsonPipe, AsyncPipe, SlicePipe, KeyValuePipe
//   • Pipe chaining: {{ value | date | uppercase }}
//   • Custom pipes: @Pipe({ name: 'x', standalone: true })
//     implements PipeTransform { transform(value, ...args) }
//   • Pure vs impure pipes (pure: false)
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: Built-in Pipes Demo Component
// ---------------------------------------------------------------------------
// selector='app-builtin-pipes'
// Import: DatePipe, CurrencyPipe, UpperCasePipe, LowerCasePipe,
//         TitleCasePipe, DecimalPipe, PercentPipe, JsonPipe, SlicePipe
// Local state:
//   today = new Date()
//   price = 1234567.89
//   rate  = 0.8765
//   name  = 'john doe smith'
//   count = 42567.3
//   tags  = ['Angular','TypeScript','RxJS','NgRx','Signals']
//   config = { version: 17, standalone: true, ssr: false }
// Template: a table with two columns (Pipe | Result) showing each pipe.

// ---------------------------------------------------------------------------
// TODO 2: PipeChainingComponent
// ---------------------------------------------------------------------------
// selector='app-pipe-chaining'
// Import: DatePipe, UpperCasePipe, CurrencyPipe, DecimalPipe
// Show examples of chained pipes:
//   date + uppercase, currency with locale, decimal formatted differently.

// ---------------------------------------------------------------------------
// TODO 3: TruncatePipe (custom standalone pipe)
// ---------------------------------------------------------------------------
// @Pipe({ name: 'truncate', standalone: true })
// transform(value: string, limit = 50, trail = '…'): string
//   Returns value if value.length <= limit,
//   otherwise value.slice(0, limit) + trail.

// ---------------------------------------------------------------------------
// TODO 4: FilterByPipe (custom standalone pipe — impure)
// ---------------------------------------------------------------------------
// @Pipe({ name: 'filterBy', standalone: true, pure: false })
// transform(items: string[], query: string): string[]
//   Returns items that include query (case-insensitive).
//   Use this in a component that has a text input and a list.

// ---------------------------------------------------------------------------
// TODO 5: TimeAgoPipe (custom standalone pipe)
// ---------------------------------------------------------------------------
// @Pipe({ name: 'timeAgo', standalone: true })
// transform(value: Date | string | number): string
//   Returns human-readable relative time:
//   < 60s → "just now"
//   < 60m → "X minutes ago"
//   < 24h → "X hours ago"
//   else  → "X days ago"

// ---------------------------------------------------------------------------
// ROOT COMPONENT
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  template: `
    <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 2.2 — Pipes</h1>
      <!-- TODO 6: add all pipe-demo components and pipes to imports[], render them -->
    </div>
  `,
})
export class AppComponent {}
