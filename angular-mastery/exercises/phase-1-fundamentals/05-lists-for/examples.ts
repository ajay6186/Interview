import { Component, signal, computed } from '@angular/core';

// ============================================================
// Examples 1.5 — Lists & @for (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ────────────────────────────────────────────

// 1. Basic @for loop
@Component({ selector: 'ex-01', standalone: true, template: `<ul>@for (item of items; track item) { <li>{{ item }}</li> }</ul>` })
class Ex01 { items = ['Alpha', 'Beta', 'Gamma']; }

// 2. @for with track by id
@Component({ selector: 'ex-02', standalone: true, template: `<ul>@for (item of items; track item.id) { <li>{{ item.id }}: {{ item.name }}</li> }</ul>` })
class Ex02 { items = [{ id: 1, name: 'Widget' }, { id: 2, name: 'Gadget' }, { id: 3, name: 'Doohickey' }]; }

// 3. @for rendering strings
@Component({ selector: 'ex-03', standalone: true, template: `<p>@for (lang of langs; track lang) { <span style="margin-right:8px">{{ lang }}</span> }</p>` })
class Ex03 { langs = ['TypeScript', 'Rust', 'Go', 'Python']; }

// 4. @for rendering numbers
@Component({ selector: 'ex-04', standalone: true, template: `<div>@for (n of nums; track n) { <span style="margin:2px;display:inline-block;background:#eee;padding:2px 6px;border-radius:3px">{{ n }}</span> }</div>` })
class Ex04 { nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; }

// 5. @for with index
@Component({ selector: 'ex-05', standalone: true, template: `<ul>@for (item of items; track item; let i = $index) { <li>{{ i + 1 }}. {{ item }}</li> }</ul>` })
class Ex05 { items = ['First', 'Second', 'Third', 'Fourth']; }

// 6. @for with $first and $last
@Component({ selector: 'ex-06', standalone: true, template: `<ul>@for (item of items; track item; let first = $first; let last = $last) { <li [style.fontWeight]="first || last ? 'bold' : 'normal'" [style.color]="first ? 'green' : last ? 'red' : 'black'">{{ item }}{{ first ? ' (first)' : last ? ' (last)' : '' }}</li> }</ul>` })
class Ex06 { items = ['Apple', 'Banana', 'Cherry', 'Date']; }

// 7. @for with $even and $odd
@Component({ selector: 'ex-07', standalone: true, template: `<ul style="padding:0;list-style:none">@for (item of items; track item; let even = $even) { <li [style.background]="even ? '#f0f0f0' : 'white'" style="padding:4px 8px">{{ item }}</li> }</ul>` })
class Ex07 { items = ['Row 1', 'Row 2', 'Row 3', 'Row 4', 'Row 5']; }

// 8. @for with $count
@Component({ selector: 'ex-08', standalone: true, template: `<p>Total items: <strong>{{ count }}</strong></p><ul>@for (item of items; track item; let c = $count) { <li>{{ item }}</li> }</ul>` })
class Ex08 {
  items = ['X', 'Y', 'Z'];
  get count() { return this.items.length; }
}

// 9. @for with @empty block
@Component({ selector: 'ex-09', standalone: true, template: `<ul>@for (item of items; track item) { <li>{{ item }}</li> } @empty { <li style="color:gray;font-style:italic">No items available</li> }</ul><button (click)="toggle()">{{ items.length ? 'Clear' : 'Add' }}</button>` })
class Ex09 { items = ['Item A', 'Item B']; toggle() { this.items = this.items.length ? [] : ['Item A', 'Item B']; } }

// 10. @for over Object.entries
@Component({ selector: 'ex-10', standalone: true, template: `<dl>@for (entry of entries; track entry[0]) { <dt><strong>{{ entry[0] }}</strong></dt><dd>{{ entry[1] }}</dd> }</dl>` })
class Ex10 { obj = { name: 'Angular', version: '17', type: 'Framework' }; get entries() { return Object.entries(this.obj); } }

// 11. @for rendering a table
@Component({
  selector: 'ex-11', standalone: true,
  template: `
    <table border="1" cellpadding="6" cellspacing="0">
      <tr style="background:#f0f0f0"><th>ID</th><th>Name</th><th>Role</th></tr>
      @for (row of rows; track row.id) {
        <tr><td>{{ row.id }}</td><td>{{ row.name }}</td><td>{{ row.role }}</td></tr>
      }
    </table>
  `
})
class Ex11 { rows = [{ id: 1, name: 'Alice', role: 'Admin' }, { id: 2, name: 'Bob', role: 'Editor' }, { id: 3, name: 'Carol', role: 'Viewer' }]; }

// 12. @for rendering list items with styling
@Component({
  selector: 'ex-12', standalone: true,
  template: `
    <ul style="padding:0;list-style:none">
      @for (item of items; track item.id) {
        <li style="display:flex;align-items:center;gap:8px;padding:6px;border-bottom:1px solid #eee">
          <span [style.background]="item.color" style="width:12px;height:12px;border-radius:50%;display:inline-block"></span>
          {{ item.label }}
        </li>
      }
    </ul>
  `
})
class Ex12 { items = [{ id: 1, label: 'Danger', color: 'crimson' }, { id: 2, label: 'Warning', color: 'orange' }, { id: 3, label: 'Success', color: 'green' }]; }

// 13. @for rendering cards
@Component({
  selector: 'ex-13', standalone: true,
  template: `
    <div style="display:flex;flex-wrap:wrap;gap:8px">
      @for (card of cards; track card.id) {
        <div style="border:1px solid #ddd;border-radius:6px;padding:12px;min-width:120px">
          <div style="font-size:24px;text-align:center">{{ card.icon }}</div>
          <p style="margin:4px 0;font-weight:bold;text-align:center">{{ card.title }}</p>
          <p style="margin:0;font-size:12px;color:#666;text-align:center">{{ card.value }}</p>
        </div>
      }
    </div>
  `
})
class Ex13 { cards = [{ id: 1, icon: '👥', title: 'Users', value: '1,240' }, { id: 2, icon: '💰', title: 'Revenue', value: '$8,320' }, { id: 3, icon: '📈', title: 'Growth', value: '+12%' }]; }

// ─── INTERMEDIATE (14–26) ─────────────────────────────────────

// 14. @for with click handler on each item
@Component({ selector: 'ex-14', standalone: true, template: `<ul>@for (item of items; track item) { <li (click)="selected = item" [style.cursor]="'pointer'" [style.fontWeight]="selected === item ? 'bold' : 'normal'">{{ item }}</li> }</ul><p>Selected: {{ selected || 'none' }}</p>` })
class Ex14 { items = ['Option 1', 'Option 2', 'Option 3']; selected = ''; }

// 15. @for with delete item
@Component({ selector: 'ex-15', standalone: true, template: `<ul>@for (item of items; track item) { <li>{{ item }} <button (click)="remove(item)" style="font-size:11px;color:red">✕</button></li> }</ul>` })
class Ex15 { items = ['Task A', 'Task B', 'Task C', 'Task D']; remove(i: string) { this.items = this.items.filter(x => x !== i); } }

// 16. @for with toggle selection
@Component({
  selector: 'ex-16', standalone: true,
  template: `
    <ul style="padding:0;list-style:none">
      @for (item of items; track item.id) {
        <li (click)="toggle(item)" [style.background]="item.selected ? '#d4f0d4' : 'white'" style="padding:6px;cursor:pointer;border-bottom:1px solid #eee">
          {{ item.selected ? '✓' : '○' }} {{ item.name }}
        </li>
      }
    </ul>
    <p>Selected: {{ selectedCount }} of {{ items.length }}</p>
  `
})
class Ex16 {
  items = [{ id: 1, name: 'Angular', selected: false }, { id: 2, name: 'React', selected: false }, { id: 3, name: 'Vue', selected: false }];
  toggle(item: typeof this.items[0]) { item.selected = !item.selected; }
  get selectedCount() { return this.items.filter(i => i.selected).length; }
}

// 17. @for with sorted array
@Component({ selector: 'ex-17', standalone: true, template: `<ul>@for (n of sorted; track n) { <li>{{ n }}</li> }</ul><button (click)="asc = !asc">Sort {{ asc ? 'Desc' : 'Asc' }}</button>` })
class Ex17 {
  nums = [5, 2, 8, 1, 9, 3];
  asc = true;
  get sorted() { return [...this.nums].sort((a, b) => this.asc ? a - b : b - a); }
}

// 18. @for with filtered array (computed signal)
@Component({ selector: 'ex-18', standalone: true, template: `<input [value]="query()" (input)="query.set($any($event).target.value)" placeholder="Filter..." /><ul>@for (item of filtered(); track item) { <li>{{ item }}</li> } @empty { <li style="color:gray">No matches</li> }</ul>` })
class Ex18 {
  query = signal('');
  all = ['Angular', 'React', 'Vue', 'Svelte', 'Solid', 'Ember'];
  filtered = computed(() => this.all.filter(i => i.toLowerCase().includes(this.query().toLowerCase())));
}

// 19. @for rendering child components
@Component({ selector: 'ex-19-chip', standalone: true, template: `<span style="background:#e0e0e0;border-radius:12px;padding:2px 10px;font-size:13px;margin:2px;display:inline-block">{{ label }}</span>` })
class Ex19Chip { label = ''; }
@Component({ selector: 'ex-19', standalone: true, imports: [Ex19Chip], template: `<div>@for (tag of tags; track tag) { <ex-19-chip [label]="tag" /> }</div>` })
class Ex19 { tags = ['TypeScript', 'Angular', 'RxJS', 'Signals', 'Standalone']; }

// 20. @for with conditional styling ($even/$odd)
@Component({ selector: 'ex-20', standalone: true, template: `<table border="1" cellpadding="6" style="border-collapse:collapse">@for (row of rows; track row; let even = $even) { <tr [style.background]="even ? '#fafafa' : 'white'"><td>{{ row }}</td></tr> }</table>` })
class Ex20 { rows = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve']; }

// 21. @for with index-based styling
@Component({
  selector: 'ex-21', standalone: true,
  template: `
    <div style="display:flex;gap:4px;align-items:flex-end">
      @for (val of bars; track $index; let i = $index) {
        <div [style.height.px]="val" [style.width.px]="24" [style.background]="'hsl(' + (i * 40) + ',70%,55%)'"></div>
      }
    </div>
  `
})
class Ex21 { bars = [30, 60, 45, 80, 55, 70, 35]; }

// 22. @for with $first/$last border removal trick
@Component({
  selector: 'ex-22', standalone: true,
  template: `
    <ul style="padding:0;list-style:none;border:1px solid #ddd;border-radius:4px;overflow:hidden">
      @for (item of items; track item; let last = $last) {
        <li style="padding:8px" [style.borderBottom]="last ? 'none' : '1px solid #ddd'">{{ item }}</li>
      }
    </ul>
  `
})
class Ex22 { items = ['Settings', 'Profile', 'Billing', 'Sign out']; }

// 23. @for over a signal array
@Component({ selector: 'ex-23', standalone: true, template: `<ul>@for (item of items(); track item) { <li>{{ item }}</li> }</ul><button (click)="add()">Add</button>` })
class Ex23 { items = signal(['A', 'B', 'C']); n = 3; add() { this.items.update(list => [...list, String.fromCharCode(65 + this.n++)]); } }

// 24. @for with computed filtered list
@Component({
  selector: 'ex-24', standalone: true,
  template: `
    <div style="display:flex;gap:4px;margin-bottom:8px">
      @for (cat of categories; track cat) {
        <button (click)="active.set(cat)" [style.fontWeight]="active() === cat ? 'bold' : 'normal'">{{ cat }}</button>
      }
    </div>
    <ul>@for (item of filtered(); track item.id) { <li>{{ item.name }}</li> }</ul>
  `
})
class Ex24 {
  active = signal('All');
  categories = ['All', 'Fruit', 'Veggie'];
  all = [{ id: 1, name: 'Apple', cat: 'Fruit' }, { id: 2, name: 'Broccoli', cat: 'Veggie' }, { id: 3, name: 'Banana', cat: 'Fruit' }, { id: 4, name: 'Carrot', cat: 'Veggie' }];
  filtered = computed(() => this.active() === 'All' ? this.all : this.all.filter(i => i.cat === this.active()));
}

// 25. @for with search filter
@Component({
  selector: 'ex-25', standalone: true,
  template: `
    <input [value]="q()" (input)="q.set($any($event).target.value)" placeholder="Search countries..." style="margin-bottom:8px;display:block;width:100%;box-sizing:border-box;padding:4px" />
    <ul style="max-height:120px;overflow-y:auto;margin:0;padding-left:16px">
      @for (c of results(); track c) { <li>{{ c }}</li> }
      @empty { <li style="color:gray">No results</li> }
    </ul>
    <small>{{ results().length }} of {{ countries.length }}</small>
  `
})
class Ex25 {
  q = signal('');
  countries = ['Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan'];
  results = computed(() => this.countries.filter(c => c.toLowerCase().includes(this.q().toLowerCase())));
}

// 26. @for with pagination slice
@Component({
  selector: 'ex-26', standalone: true,
  template: `
    <ul>@for (item of page(); track item) { <li>{{ item }}</li> }</ul>
    <div style="display:flex;align-items:center;gap:8px">
      <button [disabled]="currentPage() <= 1" (click)="currentPage.set(currentPage() - 1)">◀</button>
      <span>Page {{ currentPage() }} / {{ totalPages() }}</span>
      <button [disabled]="currentPage() >= totalPages()" (click)="currentPage.set(currentPage() + 1)">▶</button>
    </div>
  `
})
class Ex26 {
  all = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`);
  pageSize = 5;
  currentPage = signal(1);
  totalPages = computed(() => Math.ceil(this.all.length / this.pageSize));
  page = computed(() => this.all.slice((this.currentPage() - 1) * this.pageSize, this.currentPage() * this.pageSize));
}

// ─── NESTED (27–38) ───────────────────────────────────────────

// 27. Nested @for — categories with items
@Component({
  selector: 'ex-27', standalone: true,
  template: `
    @for (cat of catalog; track cat.name) {
      <div style="margin-bottom:12px">
        <strong>{{ cat.name }}</strong>
        <ul>
          @for (item of cat.items; track item) { <li>{{ item }}</li> }
        </ul>
      </div>
    }
  `
})
class Ex27 { catalog = [{ name: 'Fruits', items: ['Apple', 'Banana', 'Mango'] }, { name: 'Veggies', items: ['Carrot', 'Broccoli'] }, { name: 'Grains', items: ['Rice', 'Wheat', 'Oats'] }]; }

// 28. @for inside @for (matrix/grid)
@Component({
  selector: 'ex-28', standalone: true,
  template: `
    <div style="display:inline-block">
      @for (row of matrix; track $index) {
        <div style="display:flex">
          @for (cell of row; track $index) {
            <div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:1px solid #ddd">{{ cell }}</div>
          }
        </div>
      }
    </div>
  `
})
class Ex28 { matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]; }

// 29. @for with @if inside (conditional items)
@Component({
  selector: 'ex-29', standalone: true,
  template: `
    <p>Showing: <select (change)="filter = $any($event).target.value"><option value="all">All</option><option value="active">Active</option><option value="inactive">Inactive</option></select></p>
    <ul>
      @for (u of users; track u.id) {
        @if (filter === 'all' || (filter === 'active' && u.active) || (filter === 'inactive' && !u.active)) {
          <li [style.color]="u.active ? 'green' : 'gray'">{{ u.name }} — {{ u.active ? 'Active' : 'Inactive' }}</li>
        }
      }
    </ul>
  `
})
class Ex29 {
  filter = 'all';
  users = [{ id: 1, name: 'Alice', active: true }, { id: 2, name: 'Bob', active: false }, { id: 3, name: 'Carol', active: true }, { id: 4, name: 'Dave', active: false }];
}

// 30. Tree structure — @for recursion pattern
@Component({ selector: 'ex-30-node', standalone: true, template: `<div style="padding-left:12px"><span>{{ node.label }}</span>@if (node.children?.length) { @for (child of node.children; track child.label) { <ex-30-node [node]="child" /> } }</div>` })
class Ex30Node { node: { label: string; children?: typeof this.node[] } = { label: '' }; }
(Ex30Node as any).ɵcmp.dependencies = [Ex30Node];
@Component({ selector: 'ex-30', standalone: true, imports: [Ex30Node], template: `<ex-30-node [node]="tree" />` })
class Ex30 { tree = { label: 'Root', children: [{ label: 'Branch A', children: [{ label: 'Leaf 1' }, { label: 'Leaf 2' }] }, { label: 'Branch B', children: [{ label: 'Leaf 3' }] }] }; }

// 31. @for with grouped data (Map iteration)
@Component({
  selector: 'ex-31', standalone: true,
  template: `
    @for (group of groups; track group.key) {
      <div style="margin-bottom:8px">
        <strong style="text-transform:uppercase;font-size:11px;color:#888">{{ group.key }}</strong>
        <ul style="margin:4px 0">
          @for (item of group.values; track item) { <li>{{ item }}</li> }
        </ul>
      </div>
    }
  `
})
class Ex31 {
  get groups() {
    const map = new Map<string, string[]>([['A', ['Apple', 'Avocado']], ['B', ['Banana', 'Blueberry']], ['C', ['Cherry', 'Coconut']]]);
    return [...map.entries()].map(([key, values]) => ({ key, values }));
  }
}

// 32. @for rendering accordion with @if inside
@Component({
  selector: 'ex-32', standalone: true,
  template: `
    @for (item of items; track item.id) {
      <div style="border:1px solid #ddd;margin-bottom:4px;border-radius:4px;overflow:hidden">
        <div (click)="item.open = !item.open" style="padding:8px;cursor:pointer;background:#f5f5f5;display:flex;justify-content:space-between">
          <span>{{ item.title }}</span><span>{{ item.open ? '−' : '+' }}</span>
        </div>
        @if (item.open) { <p style="margin:0;padding:8px">{{ item.body }}</p> }
      </div>
    }
  `
})
class Ex32 { items = [{ id: 1, title: 'FAQ 1', body: 'Answer to FAQ 1', open: false }, { id: 2, title: 'FAQ 2', body: 'Answer to FAQ 2', open: true }, { id: 3, title: 'FAQ 3', body: 'Answer to FAQ 3', open: false }]; }

// 33. @for of parent items, each with @for of children
@Component({
  selector: 'ex-33', standalone: true,
  template: `
    @for (dept of org; track dept.name) {
      <div style="margin-bottom:12px;border:1px solid #ddd;border-radius:4px;overflow:hidden">
        <div style="background:#333;color:white;padding:6px 10px;font-weight:bold">{{ dept.name }}</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;padding:8px">
          @for (emp of dept.employees; track emp) {
            <span style="background:#e0e0e0;padding:2px 8px;border-radius:10px;font-size:12px">{{ emp }}</span>
          }
        </div>
      </div>
    }
  `
})
class Ex33 { org = [{ name: 'Engineering', employees: ['Alice', 'Bob', 'Carol'] }, { name: 'Design', employees: ['Dave', 'Eve'] }, { name: 'Marketing', employees: ['Frank', 'Grace', 'Henry', 'Iris'] }]; }

// 34. Nested @for for a table with rows and cells
@Component({
  selector: 'ex-34', standalone: true,
  template: `
    <table border="1" cellpadding="6" style="border-collapse:collapse">
      <tr style="background:#f0f0f0">
        @for (h of headers; track h) { <th>{{ h }}</th> }
      </tr>
      @for (row of rows; track $index) {
        <tr>
          @for (cell of row; track $index) { <td>{{ cell }}</td> }
        </tr>
      }
    </table>
  `
})
class Ex34 {
  headers = ['Name', 'Age', 'City'];
  rows = [['Alice', 30, 'New York'], ['Bob', 25, 'London'], ['Carol', 35, 'Tokyo']];
}

// 35. @for of tabs, @switch for content
@Component({
  selector: 'ex-35', standalone: true,
  template: `
    <div style="display:flex;border-bottom:2px solid #ddd">
      @for (t of tabs; track t.id) {
        <button (click)="active = t.id" [style.fontWeight]="active === t.id ? 'bold' : 'normal'" [style.borderBottom]="active === t.id ? '2px solid steelblue' : 'none'" style="padding:6px 12px;background:none;border:none;cursor:pointer;margin-bottom:-2px">{{ t.label }}</button>
      }
    </div>
    @switch (active) {
      @case (1) { <p>Content for Tab 1: Overview</p> }
      @case (2) { <p>Content for Tab 2: Analytics</p> }
      @case (3) { <p>Content for Tab 3: Settings</p> }
    }
  `
})
class Ex35 { tabs = [{ id: 1, label: 'Overview' }, { id: 2, label: 'Analytics' }, { id: 3, label: 'Settings' }]; active = 1; }

// 36. @for of form fields dynamically
@Component({
  selector: 'ex-36', standalone: true,
  template: `
    <form>
      @for (field of fields; track field.name) {
        <div style="margin-bottom:8px">
          <label style="display:block;font-size:12px;font-weight:bold;margin-bottom:2px">{{ field.label }}</label>
          <input [type]="field.type" [placeholder]="field.placeholder" style="border:1px solid #ccc;padding:6px;width:100%;box-sizing:border-box" />
        </div>
      }
    </form>
  `
})
class Ex36 { fields = [{ name: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe' }, { name: 'email', label: 'Email', type: 'email', placeholder: 'john@example.com' }, { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+1 555 0100' }]; }

// 37. @for of nav items with active @if
@Component({
  selector: 'ex-37', standalone: true,
  template: `
    <nav style="display:flex;gap:0;border-bottom:1px solid #ddd">
      @for (link of links; track link.id) {
        <a (click)="active = link.id; $event.preventDefault()" href="#" style="padding:8px 16px;text-decoration:none" [style.color]="active === link.id ? 'steelblue' : '#333'" [style.borderBottom]="active === link.id ? '2px solid steelblue' : '2px solid transparent'">
          {{ link.label }}
          @if (link.badge) { <span style="background:crimson;color:white;border-radius:8px;padding:0 5px;font-size:11px;margin-left:4px">{{ link.badge }}</span> }
        </a>
      }
    </nav>
  `
})
class Ex37 { links = [{ id: 1, label: 'Home', badge: 0 }, { id: 2, label: 'Messages', badge: 3 }, { id: 3, label: 'Profile', badge: 0 }]; active = 1; }

// 38. @for of steps with @switch status
@Component({
  selector: 'ex-38', standalone: true,
  template: `
    <ol style="padding-left:16px">
      @for (step of steps; track step.id) {
        <li style="margin-bottom:8px;display:flex;align-items:center;gap:8px">
          @switch (step.status) {
            @case ('done') { <span style="color:green;font-size:18px">✓</span> }
            @case ('active') { <span style="color:steelblue;font-size:18px">⟳</span> }
            @case ('pending') { <span style="color:#ccc;font-size:18px">○</span> }
          }
          <span [style.color]="step.status === 'pending' ? '#aaa' : 'black'" [style.fontWeight]="step.status === 'active' ? 'bold' : 'normal'">{{ step.label }}</span>
        </li>
      }
    </ol>
  `
})
class Ex38 { steps = [{ id: 1, label: 'Order placed', status: 'done' }, { id: 2, label: 'Processing', status: 'done' }, { id: 3, label: 'Shipped', status: 'active' }, { id: 4, label: 'Delivered', status: 'pending' }]; }

// ─── ADVANCED (39–50) ─────────────────────────────────────────

// 39. @for with signal array — add/remove
@Component({
  selector: 'ex-39', standalone: true,
  template: `
    <ul>
      @for (item of items(); track item.id) {
        <li>{{ item.text }} <button (click)="remove(item.id)" style="font-size:11px;color:red">✕</button></li>
      }
      @empty { <li style="color:gray">Empty list</li> }
    </ul>
    <button (click)="add()">+ Add</button>
  `
})
class Ex39 {
  items = signal<{ id: number; text: string }[]>([{ id: 1, text: 'Item 1' }, { id: 2, text: 'Item 2' }]);
  nextId = 3;
  add() { this.items.update(list => [...list, { id: this.nextId++, text: `Item ${this.nextId - 1}` }]); }
  remove(id: number) { this.items.update(list => list.filter(i => i.id !== id)); }
}

// 40. @for with computed sorted signal
@Component({
  selector: 'ex-40', standalone: true,
  template: `
    <button (click)="dir.set(dir() === 'asc' ? 'desc' : 'asc')">Sort {{ dir() === 'asc' ? '↑' : '↓' }}</button>
    <ul>@for (item of sorted(); track item.id) { <li>{{ item.name }} ({{ item.score }})</li> }</ul>
  `
})
class Ex40 {
  dir = signal<'asc' | 'desc'>('asc');
  data = signal([{ id: 1, name: 'Alice', score: 88 }, { id: 2, name: 'Bob', score: 72 }, { id: 3, name: 'Carol', score: 95 }, { id: 4, name: 'Dave', score: 61 }]);
  sorted = computed(() => [...this.data()].sort((a, b) => this.dir() === 'asc' ? a.score - b.score : b.score - a.score));
}

// 41. @for with virtual scrolling hint pattern
@Component({
  selector: 'ex-41', standalone: true,
  template: `
    <p style="font-size:12px;color:#888">Showing {{ visible().length }} of {{ all.length }} (scroll simulation)</p>
    <div style="height:120px;overflow-y:auto;border:1px solid #ddd" (scroll)="onScroll($event)">
      <div [style.height.px]="all.length * 28">
        <ul style="padding:0;list-style:none;margin:0">
          @for (item of visible(); track item) { <li style="height:28px;padding:4px 8px;border-bottom:1px solid #eee">{{ item }}</li> }
        </ul>
      </div>
    </div>
  `
})
class Ex41 {
  all = Array.from({ length: 100 }, (_, i) => `Row ${i + 1}`);
  start = 0;
  visible = signal(this.all.slice(0, 15));
  onScroll(e: Event) {
    const top = (e.target as HTMLElement).scrollTop;
    this.start = Math.floor(top / 28);
    this.visible.set(this.all.slice(this.start, this.start + 15));
  }
}

// 42. @for with trackBy function for optimal updates
@Component({
  selector: 'ex-42', standalone: true,
  template: `
    <ul>@for (item of items; track trackById(item)) { <li>{{ item.id }}: {{ item.name }}</li> }</ul>
    <button (click)="shuffle()">Shuffle</button>
  `
})
class Ex42 {
  items = [{ id: 1, name: 'Alpha' }, { id: 2, name: 'Beta' }, { id: 3, name: 'Gamma' }, { id: 4, name: 'Delta' }];
  trackById(item: { id: number }) { return item.id; }
  shuffle() { this.items = [...this.items].sort(() => Math.random() - 0.5); }
}

// 43. @for animating items (class-based)
@Component({
  selector: 'ex-43', standalone: true,
  styles: [`.item { transition: opacity .3s, transform .3s; opacity: 1; transform: translateX(0); } .item.new { opacity: 0; transform: translateX(-20px); }`],
  template: `
    <ul style="padding:0;list-style:none">
      @for (item of items; track item.id) {
        <li class="item" style="padding:4px;border-bottom:1px solid #eee">{{ item.text }}</li>
      }
    </ul>
    <button (click)="prepend()">Prepend item</button>
  `
})
class Ex43 {
  items = [{ id: 10, text: 'Existing 1' }, { id: 11, text: 'Existing 2' }];
  n = 0;
  prepend() { this.items = [{ id: this.n++, text: `New item ${this.n}` }, ...this.items]; }
}

// 44. @for with drag reorder signal array
@Component({
  selector: 'ex-44', standalone: true,
  template: `
    <p style="font-size:12px;color:#888">Use up/down buttons to reorder</p>
    <ul style="padding:0;list-style:none">
      @for (item of items(); track item; let i = $index; let first = $first; let last = $last) {
        <li style="display:flex;align-items:center;gap:8px;padding:4px;border:1px solid #ddd;margin-bottom:2px;border-radius:3px">
          <span style="flex:1">{{ item }}</span>
          <button [disabled]="first" (click)="moveUp(i)" style="font-size:11px">↑</button>
          <button [disabled]="last" (click)="moveDown(i)" style="font-size:11px">↓</button>
        </li>
      }
    </ul>
  `
})
class Ex44 {
  items = signal(['Item A', 'Item B', 'Item C', 'Item D']);
  moveUp(i: number) { this.items.update(arr => { const a = [...arr]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a; }); }
  moveDown(i: number) { this.items.update(arr => { const a = [...arr]; [a[i], a[i + 1]] = [a[i + 1], a[i]]; return a; }); }
}

// 45. @for with optimistic UI update pattern
@Component({
  selector: 'ex-45', standalone: true,
  template: `
    <ul>
      @for (item of items(); track item.id) {
        <li [style.opacity]="item.saving ? '0.5' : '1'">
          {{ item.text }} {{ item.saving ? '(saving...)' : '' }}
          <button (click)="save(item.id)" [disabled]="item.saving" style="font-size:11px">Save</button>
        </li>
      }
    </ul>
  `
})
class Ex45 {
  items = signal([{ id: 1, text: 'Task Alpha', saving: false }, { id: 2, text: 'Task Beta', saving: false }, { id: 3, text: 'Task Gamma', saving: false }]);
  save(id: number) {
    this.items.update(list => list.map(i => i.id === id ? { ...i, saving: true } : i));
    setTimeout(() => this.items.update(list => list.map(i => i.id === id ? { ...i, saving: false } : i)), 1000);
  }
}

// 46. @for with IntersectionObserver lazy load pattern
@Component({
  selector: 'ex-46', standalone: true,
  template: `
    <div style="height:80px;overflow-y:auto;border:1px solid #ddd">
      @for (item of loaded(); track item) {
        <div style="padding:4px;border-bottom:1px solid #eee;height:20px">{{ item }}</div>
      }
      @if (loaded().length < total) {
        <div style="padding:4px;color:gray;text-align:center">Loading more... <button (click)="loadMore()">Load</button></div>
      }
    </div>
    <small>{{ loaded().length }} / {{ total }} loaded</small>
  `
})
class Ex46 {
  total = 50;
  loaded = signal(Array.from({ length: 5 }, (_, i) => `Lazy item ${i + 1}`));
  loadMore() { const n = this.loaded().length; this.loaded.update(l => [...l, ...Array.from({ length: 5 }, (_, i) => `Lazy item ${n + i + 1}`)]); }
}

// 47. @for over async/signal data stream
import { toSignal } from '@angular/core/rxjs-interop';
import { scan, interval, map } from 'rxjs';
@Component({
  selector: 'ex-47', standalone: true,
  template: `
    <p style="font-size:12px;color:#888">Items arriving every second:</p>
    <ul style="max-height:80px;overflow-y:auto;margin:0">
      @for (msg of messages(); track msg) { <li>{{ msg }}</li> }
    </ul>
  `
})
class Ex47 {
  messages = toSignal(
    interval(1000).pipe(
      scan((acc: string[], n: number) => [...acc, `Message ${n + 1}`].slice(-5), []),
    ),
    { initialValue: [] as string[] },
  );
}

// 48. @for with batch selection (checkboxes)
@Component({
  selector: 'ex-48', standalone: true,
  template: `
    <div style="display:flex;gap:8px;margin-bottom:8px">
      <button (click)="selectAll()">Select All</button>
      <button (click)="clearAll()">Clear</button>
      <span style="font-size:12px;color:#888">{{ selected().size }} selected</span>
    </div>
    <ul style="padding:0;list-style:none">
      @for (item of items; track item.id) {
        <li style="padding:4px">
          <label>
            <input type="checkbox" [checked]="selected().has(item.id)" (change)="toggle(item.id, $any($event).target.checked)" />
            {{ item.name }}
          </label>
        </li>
      }
    </ul>
  `
})
class Ex48 {
  items = [{ id: 1, name: 'Item A' }, { id: 2, name: 'Item B' }, { id: 3, name: 'Item C' }, { id: 4, name: 'Item D' }];
  selected = signal<Set<number>>(new Set());
  toggle(id: number, checked: boolean) { this.selected.update(s => { const n = new Set(s); checked ? n.add(id) : n.delete(id); return n; }); }
  selectAll() { this.selected.set(new Set(this.items.map(i => i.id))); }
  clearAll() { this.selected.set(new Set()); }
}

// 49. @for generating a calendar grid
@Component({
  selector: 'ex-49', standalone: true,
  template: `
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <button (click)="prevMonth()">◀</button>
        <strong>{{ monthLabel() }}</strong>
        <button (click)="nextMonth()">▶</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center">
        @for (d of dayNames; track d) { <div style="font-size:11px;font-weight:bold;color:#888">{{ d }}</div> }
        @for (cell of cells(); track $index) {
          <div [style.color]="cell === 0 ? 'transparent' : 'black'" [style.background]="cell === today() ? 'steelblue' : 'transparent'" [style.color]="cell === today() ? 'white' : 'inherit'" style="padding:4px;border-radius:3px;font-size:13px">{{ cell || '' }}</div>
        }
      </div>
    </div>
  `
})
class Ex49 {
  dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  now = signal(new Date());
  today = computed(() => new Date().getMonth() === this.now().getMonth() ? new Date().getDate() : -1);
  monthLabel = computed(() => this.now().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
  cells = computed(() => {
    const d = this.now(); const y = d.getFullYear(); const m = d.getMonth();
    const first = new Date(y, m, 1).getDay(); const days = new Date(y, m + 1, 0).getDate();
    return [...Array(first).fill(0), ...Array.from({ length: days }, (_, i) => i + 1)];
  });
  prevMonth() { this.now.update(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)); }
  nextMonth() { this.now.update(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)); }
}

// 50. @for with infinite scroll signal pattern
@Component({
  selector: 'ex-50', standalone: true,
  template: `
    <div style="height:120px;overflow-y:auto;border:1px solid #ddd" (scroll)="onScroll($event)">
      <ul style="padding:0;list-style:none;margin:0">
        @for (item of items(); track item.id) {
          <li style="padding:6px 8px;border-bottom:1px solid #eee">{{ item.text }}</li>
        }
      </ul>
      @if (loading()) {
        <p style="text-align:center;color:#888;padding:8px">Loading more...</p>
      }
    </div>
    <small>{{ items().length }} items loaded</small>
  `
})
class Ex50 {
  items = signal(this.makeItems(1, 10));
  loading = signal(false);
  nextPage = 2;
  makeItems(from: number, count: number) { return Array.from({ length: count }, (_, i) => ({ id: from + i, text: `Item ${from + i}` })); }
  onScroll(e: Event) {
    const el = e.target as HTMLElement;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 5 && !this.loading()) {
      this.loading.set(true);
      setTimeout(() => { this.items.update(list => [...list, ...this.makeItems(list.length + 1, 10)]); this.loading.set(false); }, 600);
    }
  }
}

// ─── App Root ─────────────────────────────────────────────────

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
      <h1>Examples 1.5 — Lists &amp; @for</h1>
      <h4>1. Basic @for loop</h4><ex-01 /><hr />
      <h4>2. @for with track by id</h4><ex-02 /><hr />
      <h4>3. @for rendering strings</h4><ex-03 /><hr />
      <h4>4. @for rendering numbers</h4><ex-04 /><hr />
      <h4>5. @for with index</h4><ex-05 /><hr />
      <h4>6. @for with $first and $last</h4><ex-06 /><hr />
      <h4>7. @for with $even and $odd</h4><ex-07 /><hr />
      <h4>8. @for with $count</h4><ex-08 /><hr />
      <h4>9. @for with @empty block</h4><ex-09 /><hr />
      <h4>10. @for over Object.entries</h4><ex-10 /><hr />
      <h4>11. @for rendering a table</h4><ex-11 /><hr />
      <h4>12. @for rendering list items with styling</h4><ex-12 /><hr />
      <h4>13. @for rendering cards</h4><ex-13 /><hr />
      <h4>14. @for with click handler on each item</h4><ex-14 /><hr />
      <h4>15. @for with delete item</h4><ex-15 /><hr />
      <h4>16. @for with toggle selection</h4><ex-16 /><hr />
      <h4>17. @for with sorted array</h4><ex-17 /><hr />
      <h4>18. @for with filtered array (computed signal)</h4><ex-18 /><hr />
      <h4>19. @for rendering child components</h4><ex-19 /><hr />
      <h4>20. @for with conditional styling ($even/$odd)</h4><ex-20 /><hr />
      <h4>21. @for with index-based styling (bar chart)</h4><ex-21 /><hr />
      <h4>22. @for with $first/$last border removal trick</h4><ex-22 /><hr />
      <h4>23. @for over a signal array</h4><ex-23 /><hr />
      <h4>24. @for with computed filtered list</h4><ex-24 /><hr />
      <h4>25. @for with search filter</h4><ex-25 /><hr />
      <h4>26. @for with pagination slice</h4><ex-26 /><hr />
      <h4>27. Nested @for — categories with items</h4><ex-27 /><hr />
      <h4>28. @for inside @for (matrix/grid)</h4><ex-28 /><hr />
      <h4>29. @for with @if inside (conditional items)</h4><ex-29 /><hr />
      <h4>30. Tree structure — @for recursion pattern</h4><ex-30 /><hr />
      <h4>31. @for with grouped data (Map iteration)</h4><ex-31 /><hr />
      <h4>32. @for rendering accordion with @if inside</h4><ex-32 /><hr />
      <h4>33. @for of parent items, each with @for of children</h4><ex-33 /><hr />
      <h4>34. Nested @for for a table with rows and cells</h4><ex-34 /><hr />
      <h4>35. @for of tabs, @switch for content</h4><ex-35 /><hr />
      <h4>36. @for of form fields dynamically</h4><ex-36 /><hr />
      <h4>37. @for of nav items with active @if</h4><ex-37 /><hr />
      <h4>38. @for of steps with @switch status</h4><ex-38 /><hr />
      <h4>39. @for with signal array — add/remove</h4><ex-39 /><hr />
      <h4>40. @for with computed sorted signal</h4><ex-40 /><hr />
      <h4>41. @for with virtual scrolling hint pattern</h4><ex-41 /><hr />
      <h4>42. @for with trackBy function for optimal updates</h4><ex-42 /><hr />
      <h4>43. @for animating items (class-based)</h4><ex-43 /><hr />
      <h4>44. @for with drag reorder signal array</h4><ex-44 /><hr />
      <h4>45. @for with optimistic UI update pattern</h4><ex-45 /><hr />
      <h4>46. @for with IntersectionObserver lazy load pattern</h4><ex-46 /><hr />
      <h4>47. @for over async/signal data stream</h4><ex-47 /><hr />
      <h4>48. @for with batch selection (checkboxes)</h4><ex-48 /><hr />
      <h4>49. @for generating a calendar grid</h4><ex-49 /><hr />
      <h4>50. @for with infinite scroll signal pattern</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
