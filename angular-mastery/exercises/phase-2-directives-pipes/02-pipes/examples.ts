import {
  Component, signal, computed, Pipe, PipeTransform, inject, DestroyRef
} from '@angular/core';
import {
  DatePipe, UpperCasePipe, LowerCasePipe, TitleCasePipe,
  DecimalPipe, CurrencyPipe, PercentPipe, SlicePipe, JsonPipe, KeyValuePipe, AsyncPipe
} from '@angular/common';
import { Observable, interval, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

// ============================================================
// Examples 2.2 — Pipes (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. DatePipe — default format
@Component({
  selector: 'ex-01', standalone: true, imports: [DatePipe],
  template: `<p>Default date: {{ date | date }}</p>`
})
class Ex01 { date = new Date(); }

// 2. DatePipe — 'short' format
@Component({
  selector: 'ex-02', standalone: true, imports: [DatePipe],
  template: `<p>Short date: {{ date | date:'short' }}</p>`
})
class Ex02 { date = new Date(); }

// 3. DatePipe — 'longDate' format
@Component({
  selector: 'ex-03', standalone: true, imports: [DatePipe],
  template: `<p>Long date: {{ date | date:'longDate' }}</p>`
})
class Ex03 { date = new Date(); }

// 4. UpperCasePipe
@Component({
  selector: 'ex-04', standalone: true, imports: [UpperCasePipe],
  template: `<p>Uppercase: {{ name | uppercase }}</p>`
})
class Ex04 { name = 'angular pipes'; }

// 5. LowerCasePipe
@Component({
  selector: 'ex-05', standalone: true, imports: [LowerCasePipe],
  template: `<p>Lowercase: {{ name | lowercase }}</p>`
})
class Ex05 { name = 'HELLO WORLD'; }

// 6. TitleCasePipe
@Component({
  selector: 'ex-06', standalone: true, imports: [TitleCasePipe],
  template: `<p>Title case: {{ name | titlecase }}</p>`
})
class Ex06 { name = 'the quick brown fox'; }

// 7. DecimalPipe
@Component({
  selector: 'ex-07', standalone: true, imports: [DecimalPipe],
  template: `<p>Pi formatted: {{ pi | number:'1.2-2' }}</p>`
})
class Ex07 { pi = 3.14159265; }

// 8. CurrencyPipe — default USD
@Component({
  selector: 'ex-08', standalone: true, imports: [CurrencyPipe],
  template: `<p>Currency (USD): {{ price | currency }}</p>`
})
class Ex08 { price = 42.5; }

// 9. CurrencyPipe — EUR with symbol
@Component({
  selector: 'ex-09', standalone: true, imports: [CurrencyPipe],
  template: `<p>Currency (EUR): {{ price | currency:'EUR':'symbol' }}</p>`
})
class Ex09 { price = 42.5; }

// 10. PercentPipe
@Component({
  selector: 'ex-10', standalone: true, imports: [PercentPipe],
  template: `<p>Percent: {{ ratio | percent:'1.1-1' }}</p>`
})
class Ex10 { ratio = 0.874; }

// 11. SlicePipe on string
@Component({
  selector: 'ex-11', standalone: true, imports: [SlicePipe],
  template: `<p>Sliced text: "{{ text | slice:0:20 }}..."</p>`
})
class Ex11 { text = 'The quick brown fox jumps over the lazy dog'; }

// 12. SlicePipe on array
@Component({
  selector: 'ex-12', standalone: true, imports: [SlicePipe],
  template: `
    <p>First 3 items: {{ items | slice:0:3 | json }}</p>`
})
class Ex12 { items = ['alpha', 'beta', 'gamma', 'delta', 'epsilon']; }

// 13. JsonPipe for debug
@Component({
  selector: 'ex-13', standalone: true, imports: [JsonPipe],
  template: `<pre style="background:#f5f5f5;padding:8px;border-radius:4px;font-size:12px;">{{ obj | json }}</pre>`
})
class Ex13 {
  obj = { name: 'Angular', version: 17, features: ['signals', 'defer', '@for'] };
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────

// 14. KeyValuePipe — iterate object with @for
@Component({
  selector: 'ex-14', standalone: true, imports: [KeyValuePipe],
  template: `
    <dl style="display:grid;grid-template-columns:auto 1fr;gap:4px 16px;">
      @for (entry of config | keyvalue; track entry.key) {
        <dt style="font-weight:bold;color:#555;">{{ entry.key }}</dt>
        <dd style="margin:0;">{{ entry.value }}</dd>
      }
    </dl>`
})
class Ex14 {
  config: Record<string, string | number> = { host: 'localhost', port: 4200, env: 'development', version: '17.0.0' };
}

// 15. AsyncPipe with Observable
@Component({
  selector: 'ex-15', standalone: true, imports: [AsyncPipe],
  template: `<p>Ticker: {{ ticker$ | async }}</p>`
})
class Ex15 {
  ticker$ = interval(1000).pipe(map(n => `Tick #${n + 1}`));
}

// 16. AsyncPipe with signal via toObservable
@Component({
  selector: 'ex-16', standalone: true, imports: [AsyncPipe],
  template: `
    <p>Signal → Observable: {{ value$ | async }}</p>
    <button (click)="counter.update(v => v + 1)">Increment</button>`
})
class Ex16 {
  counter = signal(0);
  value$ = toObservable(this.counter).pipe(map(v => `Count: ${v}`));
}

// 17. DatePipe with custom format
@Component({
  selector: 'ex-17', standalone: true, imports: [DatePipe],
  template: `
    <p>ISO: {{ date | date:'yyyy-MM-dd' }}</p>
    <p>Full: {{ date | date:'EEEE, MMMM d, y' }}</p>
    <p>Time: {{ date | date:'HH:mm:ss' }}</p>`
})
class Ex17 { date = new Date(); }

// 18. CurrencyPipe with custom symbol
@Component({
  selector: 'ex-18', standalone: true, imports: [CurrencyPipe],
  template: `
    <p>BTC: {{ amount | currency:'BTC':'symbol':'1.4-8' }}</p>
    <p>Custom: {{ amount | currency:'USD':'symbol':'1.2-2' }}</p>`
})
class Ex18 { amount = 0.00042; }

// 19. Chained pipes — uppercase + slice
@Component({
  selector: 'ex-19', standalone: true, imports: [UpperCasePipe, SlicePipe],
  template: `<p>Chained: "{{ name | uppercase | slice:0:5 }}"</p>`
})
class Ex19 { name = 'angular'; }

// 20. Pipe in property binding
@Component({
  selector: 'ex-20', standalone: true, imports: [UpperCasePipe],
  template: `<button [title]="label | uppercase" style="padding:8px 16px;border-radius:4px;border:1px solid #ccc;">
    Hover for uppercase title ({{ label }})
  </button>`
})
class Ex20 { label = 'click me'; }

// 21. Custom pure pipe — TruncatePipe
@Pipe({ name: 'truncate', standalone: true, pure: true })
class TruncatePipe implements PipeTransform {
  transform(value: string, limit = 30, ellipsis = '...'): string {
    return value.length > limit ? value.slice(0, limit) + ellipsis : value;
  }
}
@Component({
  selector: 'ex-21', standalone: true, imports: [TruncatePipe],
  template: `
    <p>Truncated (30): "{{ text | truncate:30 }}"</p>
    <p>Original length: {{ text.length }}</p>`
})
class Ex21 { text = 'The quick brown fox jumps over the lazy dog near the riverbank'; }

// 22. Custom pure pipe — FileSizePipe
@Pipe({ name: 'fileSize', standalone: true, pure: true })
class FileSizePipe implements PipeTransform {
  transform(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  }
}
@Component({
  selector: 'ex-22', standalone: true, imports: [FileSizePipe],
  template: `
    <ul style="list-style:none;padding:0;">
      @for (f of files; track f.name) {
        <li style="padding:4px 0;">{{ f.name }}: <strong>{{ f.size | fileSize }}</strong></li>
      }
    </ul>`
})
class Ex22 {
  files = [
    { name: 'icon.png', size: 4096 },
    { name: 'bundle.js', size: 512000 },
    { name: 'video.mp4', size: 157286400 },
  ];
}

// 23. Custom pure pipe — RelativeTimePipe
@Pipe({ name: 'relativeTime', standalone: true, pure: false })
class RelativeTimePipe implements PipeTransform {
  transform(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }
}
@Component({
  selector: 'ex-23', standalone: true, imports: [RelativeTimePipe],
  template: `
    <ul style="list-style:none;padding:0;">
      @for (n of notifications; track n.text) {
        <li style="padding:4px 0;display:flex;justify-content:space-between;">
          <span>{{ n.text }}</span>
          <small style="color:#888;">{{ n.time | relativeTime }}</small>
        </li>
      }
    </ul>`
})
class Ex23 {
  notifications = [
    { text: 'Build succeeded', time: new Date(Date.now() - 30000) },
    { text: 'PR approved', time: new Date(Date.now() - 3600000) },
    { text: 'Deploy complete', time: new Date(Date.now() - 86400000) },
  ];
}

// 24. Custom pure pipe — SafeUrlPipe (conceptual, shows pattern)
@Pipe({ name: 'safeUrl', standalone: true, pure: true })
class SafeUrlPipe implements PipeTransform {
  transform(url: string): string {
    // In real usage: inject DomSanitizer and return sanitized URL
    // Here we demonstrate the pattern without the actual DOM dependency
    const allowed = ['https://', 'http://'];
    return allowed.some(p => url.startsWith(p)) ? url : '#';
  }
}
@Component({
  selector: 'ex-24', standalone: true, imports: [SafeUrlPipe],
  template: `
    <p>Safe URL: <a [href]="url | safeUrl">{{ url | safeUrl }}</a></p>
    <p>Unsafe URL: <a [href]="badUrl | safeUrl">{{ badUrl | safeUrl }}</a></p>`
})
class Ex24 { url = 'https://angular.dev'; badUrl = 'javascript:alert(1)'; }

// 25. Custom impure pipe — FilterPipe
@Pipe({ name: 'filter', standalone: true, pure: false })
class FilterPipe implements PipeTransform {
  transform<T extends Record<string, unknown>>(items: T[], key: keyof T, query: string): T[] {
    if (!query) return items;
    return items.filter(item => String(item[key]).toLowerCase().includes(query.toLowerCase()));
  }
}
@Component({
  selector: 'ex-25', standalone: true, imports: [FilterPipe],
  template: `
    <input #q (input)="query = q.value" placeholder="Filter fruits..." style="padding:6px;border-radius:4px;border:1px solid #ccc;width:100%;" />
    <ul style="list-style:none;padding:0;margin-top:8px;">
      @for (item of items | filter:'name':query; track item.name) {
        <li style="padding:4px 0;">{{ item.name }}</li>
      }
    </ul>`
})
class Ex25 {
  query = '';
  items = [
    { name: 'Apple' }, { name: 'Banana' }, { name: 'Cherry' },
    { name: 'Apricot' }, { name: 'Blueberry' }, { name: 'Avocado' },
  ];
}

// 26. Pipe with arguments — truncate with custom ellipsis
@Component({
  selector: 'ex-26', standalone: true, imports: [TruncatePipe],
  template: `
    <p>Default ellipsis: "{{ text | truncate:40 }}"</p>
    <p>Custom ellipsis: "{{ text | truncate:40:' [read more]' }}"</p>
    <p>No ellipsis: "{{ text | truncate:40:'' }}"</p>`
})
class Ex26 { text = 'Angular pipes transform data directly in templates without component logic'; }

// ─── NESTED (27–38) ─────────────────────────────────────────

// 27. Multiple pipes in @for list
@Component({
  selector: 'ex-27', standalone: true, imports: [DatePipe, CurrencyPipe, TitleCasePipe],
  template: `
    <ul style="list-style:none;padding:0;">
      @for (item of items; track item.name) {
        <li style="padding:6px 0;border-bottom:1px solid #eee;">
          <strong>{{ item.name | titlecase }}</strong> —
          {{ item.price | currency }} —
          <small style="color:#888;">{{ item.date | date:'mediumDate' }}</small>
        </li>
      }
    </ul>`
})
class Ex27 {
  items = [
    { name: 'laptop stand', price: 49.99, date: new Date('2024-01-15') },
    { name: 'mechanical keyboard', price: 129.0, date: new Date('2024-03-22') },
    { name: 'usb-c hub', price: 34.5, date: new Date('2024-06-08') },
  ];
}

// 28. DatePipe in table column
@Component({
  selector: 'ex-28', standalone: true, imports: [DatePipe, CurrencyPipe, TitleCasePipe],
  template: `
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead><tr style="background:#f1f5f9;">
        <th style="padding:8px;text-align:left;">Order</th>
        <th style="padding:8px;">Date</th>
        <th style="padding:8px;">Total</th>
      </tr></thead>
      <tbody>
        @for (order of orders; track order.id) {
          <tr style="border-top:1px solid #e2e8f0;">
            <td style="padding:8px;">{{ order.id | titlecase }}</td>
            <td style="padding:8px;text-align:center;">{{ order.date | date:'dd/MM/yyyy' }}</td>
            <td style="padding:8px;text-align:center;">{{ order.total | currency:'GBP':'symbol' }}</td>
          </tr>
        }
      </tbody>
    </table>`
})
class Ex28 {
  orders = [
    { id: 'ord-001', date: new Date('2024-11-01'), total: 89.99 },
    { id: 'ord-002', date: new Date('2024-11-14'), total: 234.5 },
    { id: 'ord-003', date: new Date('2024-12-03'), total: 17.0 },
  ];
}

// 29. CurrencyPipe in cart total
@Component({
  selector: 'ex-29', standalone: true, imports: [CurrencyPipe, DecimalPipe],
  template: `
    <div style="border:1px solid #ddd;border-radius:8px;overflow:hidden;max-width:320px;">
      @for (item of cart; track item.name) {
        <div style="display:flex;justify-content:space-between;padding:8px 12px;border-bottom:1px solid #eee;">
          <span>{{ item.name }} x{{ item.qty }}</span>
          <span>{{ item.price * item.qty | currency }}</span>
        </div>
      }
      <div style="display:flex;justify-content:space-between;padding:10px 12px;background:#f8fafc;font-weight:bold;">
        <span>Total</span>
        <span>{{ total | currency }}</span>
      </div>
    </div>`
})
class Ex29 {
  cart = [
    { name: 'Widget', qty: 2, price: 9.99 },
    { name: 'Gadget', qty: 1, price: 24.5 },
    { name: 'Doohickey', qty: 3, price: 4.75 },
  ];
  get total() { return this.cart.reduce((s, i) => s + i.price * i.qty, 0); }
}

// 30. TruncatePipe in card description
@Component({
  selector: 'ex-30', standalone: true, imports: [TruncatePipe, TitleCasePipe],
  template: `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      @for (article of articles; track article.title) {
        <div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;">
          <h5 style="margin:0 0 6px;">{{ article.title | titlecase }}</h5>
          <p style="margin:0;color:#555;font-size:13px;">{{ article.body | truncate:80 }}</p>
        </div>
      }
    </div>`
})
class Ex30 {
  articles = [
    { title: 'angular signals explained', body: 'Angular signals provide fine-grained reactivity for your applications, making them more efficient and easier to reason about.' },
    { title: 'new control flow syntax', body: 'The new @if, @for, and @switch control flow blocks are a major improvement over the old structural directives, offering better performance.' },
  ];
}

// 31. PercentPipe in progress bar label
@Component({
  selector: 'ex-31', standalone: true, imports: [PercentPipe],
  template: `
    <div style="display:flex;flex-direction:column;gap:10px;">
      @for (task of tasks; track task.name) {
        <div>
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
            <span>{{ task.name }}</span>
            <span>{{ task.progress | percent }}</span>
          </div>
          <div style="background:#e2e8f0;border-radius:4px;height:8px;">
            <div [style.width]="task.progress * 100 + '%'" style="background:#3b82f6;height:100%;border-radius:4px;transition:width 0.3s;"></div>
          </div>
        </div>
      }
    </div>`
})
class Ex31 {
  tasks = [
    { name: 'Design', progress: 1.0 },
    { name: 'Development', progress: 0.65 },
    { name: 'Testing', progress: 0.3 },
    { name: 'Deployment', progress: 0.05 },
  ];
}

// 32. KeyValuePipe with sorted object properties
@Component({
  selector: 'ex-32', standalone: true, imports: [KeyValuePipe],
  template: `
    <h5 style="margin:0 0 8px;">User Profile</h5>
    <dl style="display:grid;grid-template-columns:auto 1fr;gap:4px 16px;font-size:14px;">
      @for (entry of profile | keyvalue; track entry.key) {
        <dt style="font-weight:600;color:#64748b;">{{ entry.key }}</dt>
        <dd style="margin:0;">{{ entry.value }}</dd>
      }
    </dl>`
})
class Ex32 {
  profile: Record<string, string | number> = {
    username: 'ngdev42',
    email: 'dev@angular.io',
    role: 'admin',
    joined: '2023-01-15',
    posts: 142,
  };
}

// 33. Custom pipe in nested @for
@Component({
  selector: 'ex-33', standalone: true, imports: [TruncatePipe, FileSizePipe],
  template: `
    <div style="display:flex;flex-direction:column;gap:6px;">
      @for (folder of folders; track folder.name) {
        <div style="border:1px solid #e2e8f0;border-radius:6px;padding:8px;">
          <strong>{{ folder.name }}</strong>
          <ul style="list-style:none;padding:0;margin:4px 0 0;">
            @for (file of folder.files; track file.name) {
              <li style="font-size:13px;color:#555;padding:2px 0;">
                {{ file.name | truncate:25 }} — {{ file.size | fileSize }}
              </li>
            }
          </ul>
        </div>
      }
    </div>`
})
class Ex33 {
  folders = [
    { name: 'Documents', files: [{ name: 'Annual Report 2024.pdf', size: 2097152 }, { name: 'notes.txt', size: 1024 }] },
    { name: 'Images', files: [{ name: 'profile-photo-high-res.jpg', size: 4718592 }, { name: 'logo.svg', size: 8192 }] },
  ];
}

// 34. Chained pipes in @for item
@Component({
  selector: 'ex-34', standalone: true, imports: [UpperCasePipe, SlicePipe, TitleCasePipe, DatePipe],
  template: `
    <ul style="list-style:none;padding:0;">
      @for (tag of tags; track tag) {
        <li style="display:inline-block;margin:4px;padding:4px 10px;background:#e0e7ff;color:#3730a3;border-radius:12px;font-size:12px;font-weight:bold;">
          {{ tag | uppercase | slice:0:10 }}
        </li>
      }
    </ul>`
})
class Ex34 { tags = ['angular', 'typescript', 'rxjs', 'ngrx', 'signals', 'standalone']; }

// 35. AsyncPipe with loading state
@Component({
  selector: 'ex-35', standalone: true, imports: [AsyncPipe],
  template: `
    @if (data$ | async; as data) {
      <div style="background:#d1fae5;padding:12px;border-radius:6px;">
        Loaded: <strong>{{ data }}</strong>
      </div>
    } @else {
      <div style="display:flex;align-items:center;gap:8px;color:#888;">
        <span style="display:inline-block;width:16px;height:16px;border:2px solid #888;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;"></span>
        Loading...
      </div>
    }
    <button style="margin-top:8px;" (click)="reload()">Reload</button>
    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>`
})
class Ex35 {
  data$: Observable<string> = of('Data arrived!').pipe(
    // simulate delay via take + interval
  );
  reload() {
    this.data$ = new Observable(observer => {
      setTimeout(() => { observer.next('Fresh data at ' + new Date().toLocaleTimeString()); observer.complete(); }, 1500);
    });
  }
}

// 36. Custom FileSizePipe in file list
@Component({
  selector: 'ex-36', standalone: true, imports: [FileSizePipe, DatePipe],
  template: `
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead><tr style="background:#f8fafc;"><th style="padding:8px;text-align:left;">File</th><th>Size</th><th>Modified</th></tr></thead>
      <tbody>
        @for (file of files; track file.name) {
          <tr style="border-top:1px solid #eee;">
            <td style="padding:6px 8px;">{{ file.name }}</td>
            <td style="padding:6px 8px;text-align:center;">{{ file.size | fileSize }}</td>
            <td style="padding:6px 8px;text-align:center;">{{ file.modified | date:'dd MMM y' }}</td>
          </tr>
        }
      </tbody>
    </table>`
})
class Ex36 {
  files = [
    { name: 'app.component.ts', size: 2048, modified: new Date('2024-12-01') },
    { name: 'styles.css', size: 512, modified: new Date('2024-11-20') },
    { name: 'dist.tar.gz', size: 10485760, modified: new Date('2024-12-05') },
  ];
}

// 37. RelativeTimePipe in notification list
@Component({
  selector: 'ex-37', standalone: true, imports: [RelativeTimePipe],
  template: `
    <div style="display:flex;flex-direction:column;gap:6px;">
      @for (n of notifications; track n.id) {
        <div style="display:flex;align-items:center;gap:10px;padding:10px;background:#f8fafc;border-radius:8px;border-left:3px solid #3b82f6;">
          <span style="font-size:20px;">{{ n.icon }}</span>
          <div style="flex:1;">
            <div style="font-size:14px;">{{ n.message }}</div>
            <div style="font-size:12px;color:#94a3b8;">{{ n.time | relativeTime }}</div>
          </div>
        </div>
      }
    </div>`
})
class Ex37 {
  notifications = [
    { id: 1, icon: '✅', message: 'Pull request merged', time: new Date(Date.now() - 120000) },
    { id: 2, icon: '💬', message: 'New comment on issue #42', time: new Date(Date.now() - 7200000) },
    { id: 3, icon: '🚀', message: 'Deployment to production', time: new Date(Date.now() - 172800000) },
  ];
}

// 38. Multiple custom pipes in invoice table
@Component({
  selector: 'ex-38', standalone: true, imports: [CurrencyPipe, DatePipe, TitleCasePipe, PercentPipe],
  template: `
    <h5 style="margin:0 0 8px;">Invoice #INV-2024-001</h5>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead><tr style="background:#1e293b;color:#fff;">
        <th style="padding:8px;text-align:left;">Item</th>
        <th style="padding:8px;text-align:right;">Unit Price</th>
        <th style="padding:8px;text-align:center;">Qty</th>
        <th style="padding:8px;text-align:right;">Subtotal</th>
      </tr></thead>
      <tbody>
        @for (line of lines; track line.item) {
          <tr style="border-top:1px solid #e2e8f0;">
            <td style="padding:8px;">{{ line.item | titlecase }}</td>
            <td style="padding:8px;text-align:right;">{{ line.price | currency }}</td>
            <td style="padding:8px;text-align:center;">{{ line.qty }}</td>
            <td style="padding:8px;text-align:right;">{{ line.price * line.qty | currency }}</td>
          </tr>
        }
      </tbody>
      <tfoot>
        <tr style="background:#f8fafc;font-weight:bold;">
          <td colspan="3" style="padding:8px;text-align:right;">Total</td>
          <td style="padding:8px;text-align:right;">{{ total | currency }}</td>
        </tr>
      </tfoot>
    </table>
    <p style="font-size:12px;color:#888;">Generated: {{ now | date:'medium' }}</p>`
})
class Ex38 {
  now = new Date();
  lines = [
    { item: 'consulting hours', qty: 8, price: 150 },
    { item: 'server setup', qty: 1, price: 500 },
    { item: 'documentation', qty: 3, price: 75 },
  ];
  get total() { return this.lines.reduce((s, l) => s + l.price * l.qty, 0); }
}

// ─── ADVANCED (39–50) ────────────────────────────────────────

// 39. Custom standalone pipe with inject()
@Pipe({ name: 'envPrefix', standalone: true, pure: true })
class EnvPrefixPipe implements PipeTransform {
  // Demonstrates inject() pattern inside a pipe
  private env = 'PROD'; // In real apps: inject(ENVIRONMENT_TOKEN)
  transform(value: string): string {
    return `[${this.env}] ${value}`;
  }
}
@Component({
  selector: 'ex-39', standalone: true, imports: [EnvPrefixPipe],
  template: `<p>With env prefix: {{ message | envPrefix }}</p>`
})
class Ex39 { message = 'Application started'; }

// 40. Memoization pattern inside pipe
@Pipe({ name: 'heavyCalc', standalone: true, pure: true })
class HeavyCalcPipe implements PipeTransform {
  private cache = new Map<number, number>();
  transform(n: number): number {
    if (this.cache.has(n)) return this.cache.get(n)!;
    // Simulate expensive computation
    let result = 0;
    for (let i = 1; i <= n; i++) result += i;
    this.cache.set(n, result);
    return result;
  }
}
@Component({
  selector: 'ex-40', standalone: true, imports: [HeavyCalcPipe],
  template: `
    <p>Sum 1 to {{ n() }}: {{ n() | heavyCalc }}</p>
    <input type="range" min="1" max="100" [value]="n()"
      (input)="n.set(+$any($event.target).value)" style="width:100%;" />`
})
class Ex40 { n = signal(50); }

// 41. Pipe that returns Observable (used with async pipe)
@Pipe({ name: 'delayedUpper', standalone: true, pure: true })
class DelayedUpperPipe implements PipeTransform {
  transform(value: string): Observable<string> {
    return new Observable(obs => {
      setTimeout(() => { obs.next(value.toUpperCase()); obs.complete(); }, 800);
    });
  }
}
@Component({
  selector: 'ex-41', standalone: true, imports: [DelayedUpperPipe, AsyncPipe],
  template: `
    <p>Async transform: {{ text | delayedUpper | async }}</p>
    <p style="color:#888;font-size:12px;">(uppercased after 800ms delay)</p>`
})
class Ex41 { text = 'hello from an observable pipe'; }

// 42. Pipe with DI — inject a service inside pipe
class FormatterService {
  currency = 'USD';
  format(n: number) { return new Intl.NumberFormat('en', { style: 'currency', currency: this.currency }).format(n); }
}
@Pipe({ name: 'serviceFormat', standalone: true, pure: true })
class ServiceFormatPipe implements PipeTransform {
  // Pattern: inject service inside pipe
  private svc = new FormatterService();
  transform(value: number): string { return this.svc.format(value); }
}
@Component({
  selector: 'ex-42', standalone: true, imports: [ServiceFormatPipe],
  template: `<p>Service-formatted: {{ amount | serviceFormat }}</p>`
})
class Ex42 { amount = 1234.56; }

// 43. Stateful impure pipe (counter)
@Pipe({ name: 'callCount', standalone: true, pure: false })
class CallCountPipe implements PipeTransform {
  count = 0;
  transform(value: string): string {
    return `${value} (pipe called ${++this.count}x)`;
  }
}
@Component({
  selector: 'ex-43', standalone: true, imports: [CallCountPipe],
  template: `
    <p>{{ label | callCount }}</p>
    <button (click)="tick.update(v => v + 1)">Trigger change detection ({{ tick() }})</button>`
})
class Ex43 { label = 'Impure pipe'; tick = signal(0); }

// 44. Pipe with complex transform (currency + tax)
@Pipe({ name: 'withTax', standalone: true, pure: true })
class WithTaxPipe implements PipeTransform {
  transform(price: number, taxRate = 0.2, currency = 'USD'): string {
    const withTax = price * (1 + taxRate);
    return new Intl.NumberFormat('en', { style: 'currency', currency }).format(withTax);
  }
}
@Component({
  selector: 'ex-44', standalone: true, imports: [WithTaxPipe, CurrencyPipe],
  template: `
    <table style="font-size:14px;border-collapse:collapse;">
      <thead><tr style="background:#f1f5f9;"><th style="padding:6px 12px;">Item</th><th>Pre-tax</th><th>+20% VAT</th></tr></thead>
      <tbody>
        @for (item of items; track item.name) {
          <tr style="border-top:1px solid #eee;">
            <td style="padding:6px 12px;">{{ item.name }}</td>
            <td style="padding:6px 12px;">{{ item.price | currency }}</td>
            <td style="padding:6px 12px;font-weight:bold;">{{ item.price | withTax:0.2 }}</td>
          </tr>
        }
      </tbody>
    </table>`
})
class Ex44 {
  items = [{ name: 'Course', price: 99 }, { name: 'Book', price: 29 }, { name: 'Workshop', price: 199 }];
}

// 45. Pipe with generic type (typed filter pipe)
@Pipe({ name: 'typedFilter', standalone: true, pure: true })
class TypedFilterPipe implements PipeTransform {
  transform<T>(items: T[], predicate: (item: T) => boolean): T[] {
    return items.filter(predicate);
  }
}
@Component({
  selector: 'ex-45', standalone: true, imports: [TypedFilterPipe],
  template: `
    <div style="margin-bottom:8px;display:flex;gap:6px;">
      @for (f of filters; track f.label) {
        <button (click)="activeFilter = f.label"
          [style.background]="activeFilter === f.label ? '#3b82f6' : '#e2e8f0'"
          [style.color]="activeFilter === f.label ? '#fff' : '#333'"
          style="padding:4px 10px;border:none;border-radius:4px;cursor:pointer;">{{ f.label }}</button>
      }
    </div>
    <ul style="list-style:none;padding:0;">
      @for (p of products | typedFilter:currentFilter(); track p.name) {
        <li style="padding:6px 0;border-bottom:1px solid #eee;">
          {{ p.name }} — <span [style.color]="p.inStock ? 'green' : 'red'">{{ p.inStock ? 'In Stock' : 'Out' }}</span>
        </li>
      }
    </ul>`
})
class Ex45 {
  filters = [
    { label: 'All' },
    { label: 'In Stock' },
    { label: 'Out of Stock' },
  ];
  activeFilter = 'All';
  products = [
    { name: 'Widget A', inStock: true },
    { name: 'Widget B', inStock: false },
    { name: 'Gadget X', inStock: true },
    { name: 'Gadget Y', inStock: false },
  ];
  currentFilter() {
    if (this.activeFilter === 'In Stock') return (p: typeof this.products[0]) => p.inStock;
    if (this.activeFilter === 'Out of Stock') return (p: typeof this.products[0]) => !p.inStock;
    return () => true;
  }
}

// 46. Pure pipe vs impure pipe performance demo
let pureCalls = 0;
let impureCalls = 0;
@Pipe({ name: 'pureDemo', standalone: true, pure: true })
class PureDemoPipe implements PipeTransform {
  transform(v: string): string { return `${v} (pure: ${++pureCalls})`; }
}
@Pipe({ name: 'impureDemo', standalone: true, pure: false })
class ImpureDemoPipe implements PipeTransform {
  transform(v: string): string { return `${v} (impure: ${++impureCalls})`; }
}
@Component({
  selector: 'ex-46', standalone: true, imports: [PureDemoPipe, ImpureDemoPipe],
  template: `
    <p>{{ label | pureDemo }}</p>
    <p>{{ label | impureDemo }}</p>
    <button (click)="tick.update(v => v + 1)">Trigger CD ({{ tick() }})</button>
    <p style="font-size:12px;color:#888;">Pure pipe only re-runs when input changes. Impure runs on every CD cycle.</p>`
})
class Ex46 { label = 'Hello'; tick = signal(0); }

// 47. Pipe chaining with custom + built-in
@Component({
  selector: 'ex-47', standalone: true, imports: [TruncatePipe, TitleCasePipe, UpperCasePipe],
  template: `
    <p>Truncate → TitleCase: "{{ text | truncate:30 | titlecase }}"</p>
    <p>Truncate → Uppercase: "{{ text | truncate:20 | uppercase }}"</p>`
})
class Ex47 { text = 'the amazing story of angular signals and reactivity'; }

// 48. Pipe in template expression context (method vs pipe)
@Pipe({ name: 'double', standalone: true, pure: true })
class DoublePipe implements PipeTransform {
  transform(v: number): number { return v * 2; }
}
@Component({
  selector: 'ex-48', standalone: true, imports: [DoublePipe],
  template: `
    <p>Via pipe: {{ value() | double }}</p>
    <p>Via method: {{ doubleMethod() }}</p>
    <p style="font-size:12px;color:#888;">Pipe is memoized (pure); method re-runs every CD cycle.</p>
    <button (click)="value.update(v => v + 1)">Increment ({{ value() }})</button>`
})
class Ex48 {
  value = signal(5);
  doubleMethod() { return this.value() * 2; }
}

// 49. Pipe with signal (transform signal value)
@Pipe({ name: 'signalDisplay', standalone: true, pure: true })
class SignalDisplayPipe implements PipeTransform {
  transform(value: number, unit: string): string {
    return `${value.toLocaleString()} ${unit}`;
  }
}
@Component({
  selector: 'ex-49', standalone: true, imports: [SignalDisplayPipe],
  template: `
    <p>Downloads: {{ downloads() | signalDisplay:'times' }}</p>
    <p>Stars: {{ stars() | signalDisplay:'stars' }}</p>
    <button (click)="downloads.update(v => v + Math.floor(Math.random() * 100))">Simulate Download</button>`
})
class Ex49 {
  Math = Math;
  downloads = signal(142857);
  stars = signal(12345);
}

// 50. Locale-aware custom format pipe
@Pipe({ name: 'localFormat', standalone: true, pure: true })
class LocalFormatPipe implements PipeTransform {
  transform(value: number, locale: string, style: 'decimal' | 'currency' | 'percent' = 'decimal'): string {
    return new Intl.NumberFormat(locale, {
      style,
      ...(style === 'currency' ? { currency: 'USD' } : {}),
      maximumFractionDigits: 2,
    }).format(value);
  }
}
@Component({
  selector: 'ex-50', standalone: true, imports: [LocalFormatPipe],
  template: `
    <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
      @for (loc of locales; track loc.code) {
        <button (click)="locale.set(loc.code)"
          [style.background]="locale() === loc.code ? '#3b82f6' : '#e2e8f0'"
          [style.color]="locale() === loc.code ? '#fff' : '#333'"
          style="padding:4px 10px;border:none;border-radius:4px;cursor:pointer;">{{ loc.label }}</button>
      }
    </div>
    <p>Number: <strong>{{ value | localFormat:locale() }}</strong></p>
    <p>Currency: <strong>{{ value | localFormat:locale():'currency' }}</strong></p>
    <p>Percent: <strong>{{ ratio | localFormat:locale():'percent' }}</strong></p>`
})
class Ex50 {
  locales = [{ code: 'en-US', label: 'US' }, { code: 'de-DE', label: 'DE' }, { code: 'fr-FR', label: 'FR' }, { code: 'ja-JP', label: 'JP' }];
  locale = signal('en-US');
  value = 1234567.89;
  ratio = 0.734;
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
      <h1>Examples 2.2 — Pipes</h1>

      <h4>1. DatePipe — default format</h4><ex-01 /><hr />
      <h4>2. DatePipe — 'short' format</h4><ex-02 /><hr />
      <h4>3. DatePipe — 'longDate' format</h4><ex-03 /><hr />
      <h4>4. UpperCasePipe</h4><ex-04 /><hr />
      <h4>5. LowerCasePipe</h4><ex-05 /><hr />
      <h4>6. TitleCasePipe</h4><ex-06 /><hr />
      <h4>7. DecimalPipe</h4><ex-07 /><hr />
      <h4>8. CurrencyPipe — default USD</h4><ex-08 /><hr />
      <h4>9. CurrencyPipe — EUR with symbol</h4><ex-09 /><hr />
      <h4>10. PercentPipe</h4><ex-10 /><hr />
      <h4>11. SlicePipe on string</h4><ex-11 /><hr />
      <h4>12. SlicePipe on array</h4><ex-12 /><hr />
      <h4>13. JsonPipe for debug</h4><ex-13 /><hr />

      <h4>14. KeyValuePipe — iterate object</h4><ex-14 /><hr />
      <h4>15. AsyncPipe with Observable</h4><ex-15 /><hr />
      <h4>16. AsyncPipe with signal (toObservable)</h4><ex-16 /><hr />
      <h4>17. DatePipe with custom format</h4><ex-17 /><hr />
      <h4>18. CurrencyPipe with custom symbol</h4><ex-18 /><hr />
      <h4>19. Chained pipes — uppercase + slice</h4><ex-19 /><hr />
      <h4>20. Pipe in property binding</h4><ex-20 /><hr />
      <h4>21. Custom pure pipe — TruncatePipe</h4><ex-21 /><hr />
      <h4>22. Custom pure pipe — FileSizePipe</h4><ex-22 /><hr />
      <h4>23. Custom pure pipe — RelativeTimePipe</h4><ex-23 /><hr />
      <h4>24. Custom pure pipe — SafeUrlPipe</h4><ex-24 /><hr />
      <h4>25. Custom impure pipe — FilterPipe</h4><ex-25 /><hr />
      <h4>26. Pipe with arguments — custom ellipsis</h4><ex-26 /><hr />

      <h4>27. Multiple pipes in @for list</h4><ex-27 /><hr />
      <h4>28. DatePipe in table column</h4><ex-28 /><hr />
      <h4>29. CurrencyPipe in cart total</h4><ex-29 /><hr />
      <h4>30. TruncatePipe in card description</h4><ex-30 /><hr />
      <h4>31. PercentPipe in progress bar label</h4><ex-31 /><hr />
      <h4>32. KeyValuePipe with sorted object properties</h4><ex-32 /><hr />
      <h4>33. Custom pipe in nested @for</h4><ex-33 /><hr />
      <h4>34. Chained pipes in @for item</h4><ex-34 /><hr />
      <h4>35. AsyncPipe with loading state</h4><ex-35 /><hr />
      <h4>36. Custom FileSizePipe in file list</h4><ex-36 /><hr />
      <h4>37. RelativeTimePipe in notification list</h4><ex-37 /><hr />
      <h4>38. Multiple custom pipes in invoice table</h4><ex-38 /><hr />

      <h4>39. Custom standalone pipe with inject() pattern</h4><ex-39 /><hr />
      <h4>40. Memoization pattern inside pipe</h4><ex-40 /><hr />
      <h4>41. Pipe that returns Observable (async pipe chain)</h4><ex-41 /><hr />
      <h4>42. Pipe with DI — inject a service inside pipe</h4><ex-42 /><hr />
      <h4>43. Stateful impure pipe (counter)</h4><ex-43 /><hr />
      <h4>44. Pipe with complex transform (currency + tax)</h4><ex-44 /><hr />
      <h4>45. Pipe with generic type (typed filter pipe)</h4><ex-45 /><hr />
      <h4>46. Pure pipe vs impure pipe performance demo</h4><ex-46 /><hr />
      <h4>47. Pipe chaining with custom + built-in</h4><ex-47 /><hr />
      <h4>48. Pipe in template expression context (method vs pipe)</h4><ex-48 /><hr />
      <h4>49. Pipe with signal (transform signal value)</h4><ex-49 /><hr />
      <h4>50. Locale-aware custom format pipe</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
