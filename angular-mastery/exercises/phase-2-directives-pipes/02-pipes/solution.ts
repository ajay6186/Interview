import { Component, Pipe, PipeTransform } from '@angular/core';
import {
  DatePipe, CurrencyPipe, UpperCasePipe, LowerCasePipe,
  TitleCasePipe, DecimalPipe, PercentPipe, JsonPipe, SlicePipe, KeyValuePipe,
} from '@angular/common';
import { FormsModule } from '@angular/forms';

// ============================================================
// Solution 2.2 — Pipes
// ============================================================

// SOLUTION 3: TruncatePipe
@Pipe({ name: 'truncate', standalone: true })
class TruncatePipe implements PipeTransform {
  transform(value: string, limit = 50, trail = '…'): string {
    return value.length <= limit ? value : value.slice(0, limit) + trail;
  }
}

// SOLUTION 4: FilterByPipe (impure)
@Pipe({ name: 'filterBy', standalone: true, pure: false })
class FilterByPipe implements PipeTransform {
  transform(items: string[], query: string): string[] {
    if (!query.trim()) return items;
    return items.filter((item) => item.toLowerCase().includes(query.toLowerCase()));
  }
}

// SOLUTION 5: TimeAgoPipe
@Pipe({ name: 'timeAgo', standalone: true })
class TimeAgoPipe implements PipeTransform {
  transform(value: Date | string | number): string {
    const date  = value instanceof Date ? value : new Date(value);
    const secs  = Math.floor((Date.now() - date.getTime()) / 1000);
    if (secs < 60)  return 'just now';
    const mins  = Math.floor(secs / 60);
    if (mins < 60)  return `${mins} minute${mins === 1 ? '' : 's'} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days  = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
}

// SOLUTION 1: Built-in Pipes Demo
@Component({
  selector: 'app-builtin-pipes',
  standalone: true,
  imports: [DatePipe, CurrencyPipe, UpperCasePipe, LowerCasePipe,
            TitleCasePipe, DecimalPipe, PercentPipe, JsonPipe, SlicePipe, KeyValuePipe],
  template: `
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <thead>
        <tr style="background: #3498db; color: white;">
          <th style="padding: 8px 12px; text-align: left;">Pipe</th>
          <th style="padding: 8px 12px; text-align: left;">Result</th>
        </tr>
      </thead>
      <tbody>
        <tr style="background: #f8f9fa;"><td style="padding: 6px 12px;">date</td><td>{{ today | date }}</td></tr>
        <tr><td style="padding: 6px 12px;">date:'fullDate'</td><td>{{ today | date:'fullDate' }}</td></tr>
        <tr style="background: #f8f9fa;"><td style="padding: 6px 12px;">date:'HH:mm:ss'</td><td>{{ today | date:'HH:mm:ss' }}</td></tr>
        <tr><td style="padding: 6px 12px;">currency</td><td>{{ price | currency }}</td></tr>
        <tr style="background: #f8f9fa;"><td style="padding: 6px 12px;">currency:'EUR'</td><td>{{ price | currency:'EUR' }}</td></tr>
        <tr><td style="padding: 6px 12px;">uppercase</td><td>{{ name | uppercase }}</td></tr>
        <tr style="background: #f8f9fa;"><td style="padding: 6px 12px;">titlecase</td><td>{{ name | titlecase }}</td></tr>
        <tr><td style="padding: 6px 12px;">lowercase</td><td>{{ name | lowercase }}</td></tr>
        <tr style="background: #f8f9fa;"><td style="padding: 6px 12px;">number:'1.2-2'</td><td>{{ count | number:'1.2-2' }}</td></tr>
        <tr><td style="padding: 6px 12px;">percent:'1.1-2'</td><td>{{ rate | percent:'1.1-2' }}</td></tr>
        <tr style="background: #f8f9fa;"><td style="padding: 6px 12px;">slice:0:3</td><td>{{ tags | slice:0:3 }}</td></tr>
        <tr><td style="padding: 6px 12px;">json</td><td><code>{{ config | json }}</code></td></tr>
        <tr style="background: #f8f9fa;"><td style="padding: 6px 12px;">keyvalue</td>
          <td>
            @for (kv of config | keyvalue; track kv.key) {
              <span>{{ kv.key }}: {{ kv.value }} &nbsp;</span>
            }
          </td>
        </tr>
      </tbody>
    </table>
  `,
})
class BuiltinPipesComponent {
  today  = new Date();
  price  = 1234567.89;
  rate   = 0.8765;
  name   = 'john doe smith';
  count  = 42567.3;
  tags   = ['Angular', 'TypeScript', 'RxJS', 'NgRx', 'Signals'];
  config = { version: 17, standalone: true, ssr: false };
}

// SOLUTION 2: PipeChainingComponent
@Component({
  selector: 'app-pipe-chaining',
  standalone: true,
  imports: [DatePipe, UpperCasePipe, CurrencyPipe, DecimalPipe],
  template: `
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <thead>
        <tr style="background: #9b59b6; color: white;">
          <th style="padding: 8px 12px; text-align: left;">Expression</th>
          <th style="padding: 8px 12px; text-align: left;">Output</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 6px 12px; font-family: monospace;">today | date:'mediumDate' | uppercase</td>
          <td>{{ today | date:'mediumDate' | uppercase }}</td>
        </tr>
        <tr style="background: #f8f9fa;">
          <td style="padding: 6px 12px; font-family: monospace;">price | currency:'GBP':'symbol':'1.0-0'</td>
          <td>{{ price | currency:'GBP':'symbol':'1.0-0' }}</td>
        </tr>
        <tr>
          <td style="padding: 6px 12px; font-family: monospace;">count | number:'3.1-3'</td>
          <td>{{ count | number:'3.1-3' }}</td>
        </tr>
      </tbody>
    </table>
  `,
})
class PipeChainingComponent {
  today = new Date();
  price = 1234567.89;
  count = 42567.3;
}

// Demo wrapper for custom pipes
@Component({
  selector: 'app-custom-pipes-demo',
  standalone: true,
  imports: [TruncatePipe, FilterByPipe, TimeAgoPipe, FormsModule],
  template: `
    <h3 style="margin-top: 0;">truncate</h3>
    <p>{{ long | truncate }}</p>
    <p>{{ long | truncate:20 }}</p>
    <p>{{ long | truncate:20:'...' }}</p>

    <h3>filterBy (impure)</h3>
    <input [(ngModel)]="query" placeholder="Filter frameworks…"
           style="padding: 6px 10px; border-radius: 4px; border: 1px solid #ccc; margin-bottom: 8px; width: 200px;" />
    <ul style="padding-left: 20px;">
      @for (f of items | filterBy:query; track f) {
        <li>{{ f }}</li>
      } @empty {
        <li style="color: gray;">No matches.</li>
      }
    </ul>

    <h3>timeAgo</h3>
    <ul style="padding-left: 20px;">
      @for (d of dates; track d.label) {
        <li>{{ d.label }}: <strong>{{ d.date | timeAgo }}</strong></li>
      }
    </ul>
  `,
})
class CustomPipesDemoComponent {
  long  = 'Angular is a platform and framework for building single-page client applications using HTML and TypeScript.';
  query = '';
  items = ['Angular', 'React', 'Vue', 'Svelte', 'Solid', 'Qwik'];
  dates = [
    { label: '30 sec ago',  date: new Date(Date.now() - 30_000)       },
    { label: '5 min ago',   date: new Date(Date.now() - 300_000)      },
    { label: '2 hours ago', date: new Date(Date.now() - 7_200_000)    },
    { label: '3 days ago',  date: new Date(Date.now() - 259_200_000)  },
  ];
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [BuiltinPipesComponent, PipeChainingComponent, CustomPipesDemoComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 720px; margin: 0 auto; padding: 20px;">
      <h1>Solution 2.2 — Pipes</h1>

      <h2>1. Built-in Pipes</h2>
      <app-builtin-pipes />
      <hr />

      <h2>2. Pipe Chaining</h2>
      <app-pipe-chaining />
      <hr />

      <h2>3–5. Custom Pipes (truncate · filterBy · timeAgo)</h2>
      <app-custom-pipes-demo />
    </div>
  `,
})
export class AppComponent {}
