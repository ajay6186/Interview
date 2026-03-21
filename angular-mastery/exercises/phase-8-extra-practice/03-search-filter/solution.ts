import { Component, Pipe, PipeTransform, signal, computed,
         ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

// ============================================================
// Solution 8.3 — Search & Filter
// ============================================================

// SOLUTION 1: Basic signal search
@Component({
  selector: 'app-basic-search',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Basic Search (Signals)</h3>
      <input [(ngModel)]="queryVal" (ngModelChange)="query.set($event)" placeholder="Search countries..." />
      <p>{{ filtered().length }} results</p>
      @for (c of filtered(); track c) { <p>{{ c }}</p> }
    </section>
  `,
})
class BasicSearchComponent {
  countries = ['France', 'Germany', 'Japan', 'Brazil', 'Canada', 'Australia', 'Mexico', 'Italy', 'Spain', 'India'];
  query     = signal('');
  queryVal  = '';
  filtered  = computed(() => {
    const q = this.query().toLowerCase();
    return q ? this.countries.filter(c => c.toLowerCase().includes(q)) : this.countries;
  });
}

// SOLUTION 2: Debounce search with RxJS
@Component({
  selector: 'app-debounce-search',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Debounce Search (300ms)</h3>
      <input (input)="onInput($event)" placeholder="Search languages..." />
      <p>{{ filtered().length }} results</p>
      @for (lang of filtered(); track lang) { <p>{{ lang }}</p> }
    </section>
  `,
})
class DebounceSearchComponent {
  langs   = ['TypeScript', 'JavaScript', 'Python', 'Rust', 'Go', 'Java', 'C++', 'Swift', 'Kotlin', 'Dart'];
  input$  = new Subject<string>();
  debounced = toSignal(this.input$.pipe(debounceTime(300), distinctUntilChanged()), { initialValue: '' });
  filtered  = computed(() => {
    const q = this.debounced()?.toLowerCase() ?? '';
    return q ? this.langs.filter(l => l.toLowerCase().includes(q)) : this.langs;
  });

  onInput(e: Event) { this.input$.next((e.target as HTMLInputElement).value); }
}

// SOLUTION 3: Multi-filter
type Status = 'active' | 'inactive';
interface Item { name: string; category: string; status: Status; }

@Component({
  selector: 'app-multi-filter',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Multi-Filter</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
        <input [(ngModel)]="nameVal" (ngModelChange)="nameFilter.set($event)" placeholder="Filter by name" />
        <select [(ngModel)]="catVal" (ngModelChange)="catFilter.set($event)">
          <option value="">All Categories</option>
          <option>Frontend</option><option>Backend</option><option>DevOps</option>
        </select>
        <select [(ngModel)]="statVal" (ngModelChange)="statFilter.set($event)">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <p>{{ filtered().length }} results</p>
      @for (item of filtered(); track item.name) {
        <p>{{ item.name }} — {{ item.category }} — {{ item.status }}</p>
      }
    </section>
  `,
})
class MultiFilterComponent {
  items: Item[] = [
    { name: 'Angular',  category: 'Frontend', status: 'active' },
    { name: 'React',    category: 'Frontend', status: 'active' },
    { name: 'Node.js',  category: 'Backend',  status: 'active' },
    { name: 'Docker',   category: 'DevOps',   status: 'inactive' },
    { name: 'Vue',      category: 'Frontend', status: 'inactive' },
  ];
  nameFilter = signal('');
  catFilter  = signal('');
  statFilter = signal('');
  nameVal = ''; catVal = ''; statVal = '';

  filtered = computed(() =>
    this.items.filter(i =>
      (!this.nameFilter() || i.name.toLowerCase().includes(this.nameFilter().toLowerCase())) &&
      (!this.catFilter()  || i.category === this.catFilter()) &&
      (!this.statFilter() || i.status === this.statFilter())
    )
  );
}

// SOLUTION 4: Sortable list
interface Row { name: string; date: string; price: number; }
type SortField = 'name' | 'date' | 'price';

@Component({
  selector: 'app-sortable-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Sortable List</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          @for (col of cols; track col.field) {
            <th (click)="sort(col.field)" style="cursor:pointer;padding:4px 8px;border-bottom:2px solid #333;text-align:left;">
              {{ col.label }} {{ sortField() === col.field ? (sortDir() === 'asc' ? '↑' : '↓') : '' }}
            </th>
          }
        </tr>
        @for (row of sorted(); track row.name) {
          <tr>
            <td style="padding:4px 8px;">{{ row.name }}</td>
            <td style="padding:4px 8px;">{{ row.date }}</td>
            <td style="padding:4px 8px;">${{ row.price }}</td>
          </tr>
        }
      </table>
    </section>
  `,
})
class SortableListComponent {
  rows: Row[] = [
    { name: 'Widget A', date: '2024-01-15', price: 29 },
    { name: 'Widget C', date: '2024-03-01', price: 99 },
    { name: 'Widget B', date: '2024-02-10', price: 49 },
    { name: 'Widget D', date: '2023-12-05', price: 19 },
  ];
  cols = [{ field: 'name' as SortField, label: 'Name' }, { field: 'date' as SortField, label: 'Date' }, { field: 'price' as SortField, label: 'Price' }];
  sortField = signal<SortField>('name');
  sortDir   = signal<'asc' | 'desc'>('asc');
  sorted    = computed(() => [...this.rows].sort((a, b) => {
    const f = this.sortField();
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    return a[f] < b[f] ? -dir : a[f] > b[f] ? dir : 0;
  }));

  sort(field: SortField) {
    if (this.sortField() === field) this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    else { this.sortField.set(field); this.sortDir.set('asc'); }
  }
}

// SOLUTION 5: Highlight pipe + search
@Pipe({ name: 'highlight', standalone: true, pure: true })
class HighlightPipe implements PipeTransform {
  transform(text: string, query: string): string {
    if (!query.trim()) return text;
    const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(re, '<mark>$1</mark>');
  }
}

@Component({
  selector: 'app-search-highlight',
  standalone: true,
  imports: [HighlightPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Search Highlight</h3>
      <input (input)="onInput($event)" placeholder="Search..." />
      @for (item of items; track item) {
        <p [innerHTML]="item | highlight:query()"></p>
      }
    </section>
  `,
})
class SearchHighlightComponent {
  items = ['Angular Framework', 'React Library', 'Angular Material', 'Vue.js', 'Svelte'];
  query = signal('');
  onInput(e: Event) { this.query.set((e.target as HTMLInputElement).value); }
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [BasicSearchComponent, DebounceSearchComponent, MultiFilterComponent,
            SortableListComponent, SearchHighlightComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 8.3 — Search &amp; Filter</h1>
      <app-basic-search /><hr />
      <app-debounce-search /><hr />
      <app-multi-filter /><hr />
      <app-sortable-list /><hr />
      <app-search-highlight />
    </div>
  `,
})
export class AppComponent {}
