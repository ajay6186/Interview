import { Component, signal, computed } from '@angular/core';
import { Subject, of, interval } from 'rxjs';
import { delay, switchMap, tap } from 'rxjs/operators';

// ============================================================
// Examples 7.4 — NgRx Entity (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── Shared types ────────────────────────────────────────────
interface User { id: string; name: string; email: string; age?: number; }
interface Post { id: string; title: string; authorId: string; body?: string; categoryId?: string; }
interface Comment { id: string; postId: string; text: string; }
interface Product { id: string; name: string; price: number; categoryId: string; }
interface Category { id: string; label: string; }

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. EntityState shape { ids, entities }
@Component({
  selector: 'ex-01', standalone: true,
  template: `<pre>{{ code }}</pre>`
})
class Ex01 {
  code = `// NgRx EntityState shape
interface UserState extends EntityState<User> {
  // ids: string[]           — ordered id list
  // entities: { [id]: User } — id → entity map
  loading: boolean;
  error: string | null;
}

// Created via EntityAdapter:
const adapter = createEntityAdapter<User>();
const initialState: UserState = adapter.getInitialState({
  loading: false, error: null
});

// initialState:
// { ids: [], entities: {}, loading: false, error: null }

// Add one:
adapter.addOne({ id: '1', name: 'Alice' }, initialState)
// → { ids: ['1'], entities: { '1': { id: '1', name: 'Alice' } }, ... }`;
}

// 2. addOne — signal simulation
@Component({
  selector: 'ex-02', standalone: true,
  template: `
    <button (click)="addOne()">addOne</button>
    <p>IDs: {{ ids() }}</p>
    <p>Entities: {{ entityCount() }} items</p>
  `
})
class Ex02 {
  private store = signal<{ ids: string[]; entities: Record<string, User> }>({ ids: [], entities: {} });
  counter = 1;
  ids = computed(() => this.store().ids.join(', ') || '(empty)');
  entityCount = computed(() => this.store().ids.length);

  addOne() {
    const user: User = { id: `u${this.counter}`, name: `User ${this.counter}`, email: `u${this.counter}@test.com` };
    this.counter++;
    this.store.update(s => ({
      ids: s.ids.includes(user.id) ? s.ids : [...s.ids, user.id],
      entities: { ...s.entities, [user.id]: user }
    }));
  }
}

// 3. addMany — signal simulation
@Component({
  selector: 'ex-03', standalone: true,
  template: `
    <button (click)="addMany()">addMany (3 users)</button>
    <p>Total: {{ total() }}</p>
    <ul>@for (u of users(); track u.id) { <li>{{ u.name }}</li> }</ul>
  `
})
class Ex03 {
  private store = signal<{ ids: string[]; entities: Record<string, User> }>({ ids: [], entities: {} });
  batch = 0;
  total = computed(() => this.store().ids.length);
  users = computed(() => this.store().ids.map(id => this.store().entities[id]));

  addMany() {
    this.batch++;
    const newUsers: User[] = [1, 2, 3].map(n => ({
      id: `b${this.batch}_u${n}`, name: `Batch${this.batch} User${n}`, email: `b${this.batch}_u${n}@test.com`
    }));
    this.store.update(s => {
      const newIds = newUsers.filter(u => !s.ids.includes(u.id)).map(u => u.id);
      const newEntities = newUsers.reduce((acc, u) => ({ ...acc, [u.id]: u }), {} as Record<string, User>);
      return { ids: [...s.ids, ...newIds], entities: { ...s.entities, ...newEntities } };
    });
  }
}

// 4. setOne — replace single entity
@Component({
  selector: 'ex-04', standalone: true,
  template: `
    <button (click)="init()">Init with Alice</button>
    <button (click)="setOne()">setOne (replace Alice)</button>
    <p>{{ user() }}</p>
  `
})
class Ex04 {
  private store = signal<Record<string, User>>({});
  user = computed(() => {
    const u = this.store()['u1'];
    return u ? `${u.name} — ${u.email}` : '(no user)';
  });

  init() { this.store.set({ u1: { id: 'u1', name: 'Alice', email: 'alice@old.com' } }); }
  setOne() {
    // setOne replaces the full entity (not partial merge)
    this.store.update(s => ({ ...s, u1: { id: 'u1', name: 'Alice Smith', email: 'alice@new.com', age: 30 } }));
  }
}

// 5. setAll — replace all entities
@Component({
  selector: 'ex-05', standalone: true,
  template: `
    <button (click)="loadPage(1)">Page 1</button>
    <button (click)="loadPage(2)">Page 2</button>
    <ul>@for (u of users(); track u.id) { <li>{{ u.name }}</li> }</ul>
    <small>setAll replaces the entire collection</small>
  `
})
class Ex05 {
  private store = signal<{ ids: string[]; entities: Record<string, User> }>({ ids: [], entities: {} });
  users = computed(() => this.store().ids.map(id => this.store().entities[id]));

  loadPage(page: number) {
    const data: User[] = [1, 2, 3].map(n => ({
      id: `p${page}_u${n}`, name: `Page${page} User${n}`, email: ''
    }));
    this.store.set({
      ids: data.map(u => u.id),
      entities: data.reduce((acc, u) => ({ ...acc, [u.id]: u }), {})
    });
  }
}

// 6. removeOne — remove by id
@Component({
  selector: 'ex-06', standalone: true,
  template: `
    <button (click)="init()">Init</button>
    @for (u of users(); track u.id) {
      <p>{{ u.name }} <button (click)="remove(u.id)">Remove</button></p>
    }
  `
})
class Ex06 {
  private store = signal<{ ids: string[]; entities: Record<string, User> }>({ ids: [], entities: {} });
  users = computed(() => this.store().ids.map(id => this.store().entities[id]));

  init() {
    const data: User[] = ['Alice', 'Bob', 'Carol'].map((n, i) => ({ id: `u${i + 1}`, name: n, email: '' }));
    this.store.set({ ids: data.map(u => u.id), entities: data.reduce((a, u) => ({ ...a, [u.id]: u }), {}) });
  }

  remove(id: string) {
    this.store.update(s => {
      const { [id]: _, ...rest } = s.entities;
      return { ids: s.ids.filter(i => i !== id), entities: rest };
    });
  }
}

// 7. removeMany — remove by ids array
@Component({
  selector: 'ex-07', standalone: true,
  template: `
    <button (click)="init()">Init (5 users)</button>
    <button (click)="removeMany(['u1','u3','u5'])">Remove u1, u3, u5</button>
    <p>Remaining: {{ ids() }}</p>
  `
})
class Ex07 {
  private store = signal<{ ids: string[]; entities: Record<string, User> }>({ ids: [], entities: {} });
  ids = computed(() => this.store().ids.join(', ') || '(empty)');

  init() {
    const data: User[] = [1, 2, 3, 4, 5].map(n => ({ id: `u${n}`, name: `User${n}`, email: '' }));
    this.store.set({ ids: data.map(u => u.id), entities: data.reduce((a, u) => ({ ...a, [u.id]: u }), {}) });
  }

  removeMany(ids: string[]) {
    this.store.update(s => {
      const entities = { ...s.entities };
      ids.forEach(id => delete entities[id]);
      return { ids: s.ids.filter(id => !ids.includes(id)), entities };
    });
  }
}

// 8. updateOne({ id, changes }) — partial update
@Component({
  selector: 'ex-08', standalone: true,
  template: `
    <button (click)="init()">Init Alice</button>
    <button (click)="update()">updateOne (partial patch)</button>
    <p>{{ display() }}</p>
  `
})
class Ex08 {
  private store = signal<Record<string, User>>({});
  display = computed(() => {
    const u = this.store()['u1'];
    return u ? JSON.stringify(u) : '(empty)';
  });

  init() { this.store.set({ u1: { id: 'u1', name: 'Alice', email: 'alice@old.com' } }); }
  update() {
    // updateOne merges partial changes
    this.store.update(s => ({
      ...s,
      u1: { ...s['u1'], email: 'alice@new.com', age: 28 }
    }));
  }
}

// 9. updateMany — multiple partial updates
@Component({
  selector: 'ex-09', standalone: true,
  template: `
    <button (click)="init()">Init</button>
    <button (click)="bulkActivate()">updateMany: activate all</button>
    <ul>@for (id of ids(); track id) {
      <li>{{ entities()[id]?.name }} — active: {{ entities()[id]?.['active'] }}</li>
    }</ul>
  `
})
class Ex09 {
  private store = signal<{ ids: string[]; entities: Record<string, any> }>({ ids: [], entities: {} });
  ids = computed(() => this.store().ids);
  entities = computed(() => this.store().entities);

  init() {
    const data = ['Alice', 'Bob', 'Carol'].map((n, i) => ({ id: `u${i + 1}`, name: n, active: false }));
    this.store.set({ ids: data.map(u => u.id), entities: data.reduce((a, u) => ({ ...a, [u.id]: u }), {}) });
  }

  bulkActivate() {
    this.store.update(s => ({
      ...s,
      entities: Object.fromEntries(
        Object.entries(s.entities).map(([id, u]) => [id, { ...u, active: true }])
      )
    }));
  }
}

// 10. upsertOne — add or update
@Component({
  selector: 'ex-10', standalone: true,
  template: `
    <button (click)="upsert('u1', 'Alice (created)')">Upsert u1 (create)</button>
    <button (click)="upsert('u1', 'Alice (updated)')">Upsert u1 (update)</button>
    <button (click)="upsert('u2', 'Bob (created)')">Upsert u2 (create)</button>
    <ul>@for (id of ids(); track id) { <li>{{ entities()[id].name }}</li> }</ul>
  `
})
class Ex10 {
  private store = signal<{ ids: string[]; entities: Record<string, User> }>({ ids: [], entities: {} });
  ids = computed(() => this.store().ids);
  entities = computed(() => this.store().entities);

  upsert(id: string, name: string) {
    this.store.update(s => ({
      ids: s.ids.includes(id) ? s.ids : [...s.ids, id],
      entities: { ...s.entities, [id]: { id, name, email: '' } }
    }));
  }
}

// 11. upsertMany — multiple upsert
@Component({
  selector: 'ex-11', standalone: true,
  template: `
    <button (click)="load1()">Load batch 1</button>
    <button (click)="load2()">Load batch 2 (overlap)</button>
    <p>Total: {{ total() }}</p>
    <ul>@for (id of ids(); track id) { <li>{{ entities()[id].name }}</li> }</ul>
    <small>upsertMany: adds new, updates existing</small>
  `
})
class Ex11 {
  private store = signal<{ ids: string[]; entities: Record<string, User> }>({ ids: [], entities: {} });
  ids = computed(() => this.store().ids);
  entities = computed(() => this.store().entities);
  total = computed(() => this.store().ids.length);

  upsertMany(items: User[]) {
    this.store.update(s => {
      const newIds = items.filter(u => !s.ids.includes(u.id)).map(u => u.id);
      return {
        ids: [...s.ids, ...newIds],
        entities: items.reduce((acc, u) => ({ ...acc, [u.id]: u }), { ...s.entities })
      };
    });
  }

  load1() { this.upsertMany([{ id: 'u1', name: 'Alice', email: '' }, { id: 'u2', name: 'Bob', email: '' }]); }
  load2() { this.upsertMany([{ id: 'u2', name: 'Bob Updated', email: '' }, { id: 'u3', name: 'Carol', email: '' }]); }
}

// 12. mapOne — transform single entity
@Component({
  selector: 'ex-12', standalone: true,
  template: `
    <button (click)="init()">Init</button>
    <button (click)="mapOne('u1')">mapOne u1 (append *)</button>
    <ul>@for (id of ids(); track id) { <li>{{ entities()[id].name }}</li> }</ul>
    <small>mapOne applies a transform function to one entity</small>
  `
})
class Ex12 {
  private store = signal<{ ids: string[]; entities: Record<string, User> }>({ ids: [], entities: {} });
  ids = computed(() => this.store().ids);
  entities = computed(() => this.store().entities);

  init() {
    const data: User[] = ['Alice', 'Bob'].map((n, i) => ({ id: `u${i + 1}`, name: n, email: '' }));
    this.store.set({ ids: data.map(u => u.id), entities: data.reduce((a, u) => ({ ...a, [u.id]: u }), {}) });
  }

  mapOne(id: string) {
    this.store.update(s => ({
      ...s,
      entities: { ...s.entities, [id]: { ...s.entities[id], name: s.entities[id].name + ' *' } }
    }));
  }
}

// 13. mapMany — transform multiple entities
@Component({
  selector: 'ex-13', standalone: true,
  template: `
    <button (click)="init()">Init</button>
    <button (click)="mapMany()">mapMany: uppercase all names</button>
    <ul>@for (id of ids(); track id) { <li>{{ entities()[id].name }}</li> }</ul>
  `
})
class Ex13 {
  private store = signal<{ ids: string[]; entities: Record<string, User> }>({ ids: [], entities: {} });
  ids = computed(() => this.store().ids);
  entities = computed(() => this.store().entities);

  init() {
    const data: User[] = ['alice', 'bob', 'carol'].map((n, i) => ({ id: `u${i + 1}`, name: n, email: '' }));
    this.store.set({ ids: data.map(u => u.id), entities: data.reduce((a, u) => ({ ...a, [u.id]: u }), {}) });
  }

  mapMany() {
    this.store.update(s => ({
      ...s,
      entities: Object.fromEntries(
        Object.entries(s.entities).map(([id, u]) => [id, { ...u, name: u.name.toUpperCase() }])
      )
    }));
  }
}

// ─── INTERMEDIATE (14–26) ───────────────────────────────────

// 14. selectAll — computed signal array of all entities
@Component({
  selector: 'ex-14', standalone: true,
  template: `
    <button (click)="add()">Add User</button>
    <p>selectAll returns {{ all().length }} entities</p>
    <ul>@for (u of all(); track u.id) { <li>{{ u.name }}</li> }</ul>
  `
})
class Ex14 {
  private store = signal<{ ids: string[]; entities: Record<string, User> }>({ ids: [], entities: {} });
  all = computed(() => this.store().ids.map(id => this.store().entities[id]));
  counter = 1;

  add() {
    const u: User = { id: `u${this.counter}`, name: `User ${this.counter++}`, email: '' };
    this.store.update(s => ({ ids: [...s.ids, u.id], entities: { ...s.entities, [u.id]: u } }));
  }
}

// 15. selectEntities — computed id→entity map
@Component({
  selector: 'ex-15', standalone: true,
  template: `
    <button (click)="init()">Init</button>
    <input [(ngModel)]="lookupId" placeholder="Lookup ID (e.g. u2)" />
    <p>{{ found() }}</p>
    <small>selectEntities: O(1) lookup by id</small>
  `,
  imports: []
})
class Ex15 {
  private store = signal<{ ids: string[]; entities: Record<string, User> }>({ ids: [], entities: {} });
  entities = computed(() => this.store().entities);
  lookupId = 'u2';
  found = computed(() => {
    const u = this.entities()[this.lookupId];
    return u ? `Found: ${u.name}` : 'Not found';
  });

  init() {
    const data: User[] = ['Alice', 'Bob', 'Carol'].map((n, i) => ({ id: `u${i + 1}`, name: n, email: '' }));
    this.store.set({ ids: data.map(u => u.id), entities: data.reduce((a, u) => ({ ...a, [u.id]: u }), {}) });
  }
}

// 16. selectIds — computed ids array
@Component({
  selector: 'ex-16', standalone: true,
  template: `
    <button (click)="add()">Add</button>
    <button (click)="remove()">Remove first</button>
    <p>selectIds: [{{ ids() }}]</p>
    <small>selectIds for iterating keys or checking membership</small>
  `
})
class Ex16 {
  private store = signal<{ ids: string[]; entities: Record<string, User> }>({ ids: [], entities: {} });
  ids = computed(() => this.store().ids.join(', '));
  counter = 1;

  add() {
    const id = `u${this.counter++}`;
    this.store.update(s => ({
      ids: [...s.ids, id],
      entities: { ...s.entities, [id]: { id, name: `User${id}`, email: '' } }
    }));
  }

  remove() {
    this.store.update(s => {
      if (!s.ids.length) return s;
      const [first, ...rest] = s.ids;
      const { [first]: _, ...entities } = s.entities;
      return { ids: rest, entities };
    });
  }
}

// 17. selectTotal — computed count
@Component({
  selector: 'ex-17', standalone: true,
  template: `
    <button (click)="add()">Add</button>
    <button (click)="removeAll()">Remove All</button>
    <p>selectTotal: {{ total() }}</p>
    <small>selectTotal = ids.length</small>
  `
})
class Ex17 {
  private store = signal<{ ids: string[] }>({ ids: [] });
  total = computed(() => this.store().ids.length);
  counter = 1;

  add() { this.store.update(s => ({ ids: [...s.ids, `u${this.counter++}`] })); }
  removeAll() { this.store.set({ ids: [] }); }
}

// 18. selectById — computed lookup by id
@Component({
  selector: 'ex-18', standalone: true,
  template: `
    <button (click)="init()">Init</button>
    <p>User u2: {{ userById('u2') }}</p>
    <p>User u99: {{ userById('u99') }}</p>
    <small>selectById creates a targeted selector</small>
  `
})
class Ex18 {
  private store = signal<{ entities: Record<string, User> }>({ entities: {} });

  init() {
    const data: User[] = ['Alice', 'Bob', 'Carol'].map((n, i) => ({ id: `u${i + 1}`, name: n, email: '' }));
    this.store.set({ entities: data.reduce((a, u) => ({ ...a, [u.id]: u }), {}) });
  }

  userById(id: string): string {
    const u = this.store().entities[id];
    return u ? u.name : '(not found)';
  }
}

// 19. Sorted entities (alphabetically by name)
@Component({
  selector: 'ex-19', standalone: true,
  template: `
    <button (click)="init()">Load (unsorted)</button>
    <p>Sorted: {{ sorted().map(u => u.name).join(', ') }}</p>
    <small>Computed sort — original ids order preserved</small>
  `
})
class Ex19 {
  private store = signal<{ ids: string[]; entities: Record<string, User> }>({ ids: [], entities: {} });
  all = computed(() => this.store().ids.map(id => this.store().entities[id]));
  sorted = computed(() => [...this.all()].sort((a, b) => a.name.localeCompare(b.name)));

  init() {
    const data: User[] = ['Zara', 'Alice', 'Mike', 'Bob'].map((n, i) => ({ id: `u${i + 1}`, name: n, email: '' }));
    this.store.set({ ids: data.map(u => u.id), entities: data.reduce((a, u) => ({ ...a, [u.id]: u }), {}) });
  }
}

// 20. Custom selectId (string id field: slug)
@Component({
  selector: 'ex-20', standalone: true,
  template: `
    <button (click)="init()">Init posts (slug as id)</button>
    <button (click)="lookup()">Find by slug</button>
    <p>{{ found() }}</p>
    <small>Custom selectId maps non-id field as entity key</small>
  `
})
class Ex20 {
  private store = signal<{ entities: Record<string, { slug: string; title: string }> }>({ entities: {} });
  foundPost = signal('');
  found = computed(() => this.foundPost());

  init() {
    const posts = [
      { slug: 'hello-world', title: 'Hello World' },
      { slug: 'ngrx-guide', title: 'NgRx Guide' }
    ];
    this.store.set({ entities: posts.reduce((a, p) => ({ ...a, [p.slug]: p }), {}) });
  }

  lookup() {
    const p = this.store().entities['ngrx-guide'];
    this.foundPost.set(p ? p.title : '(not found)');
  }
}

// 21. Entity + loading/error extra state
@Component({
  selector: 'ex-21', standalone: true,
  template: `
    <button (click)="load(false)">Load (success)</button>
    <button (click)="load(true)">Load (error)</button>
    @if (loading()) { <p>Loading...</p> }
    @if (error()) { <p style="color:red">{{ error() }}</p> }
    @if (!loading() && !error()) {
      <ul>@for (u of users(); track u.id) { <li>{{ u.name }}</li> }</ul>
    }
  `
})
class Ex21 {
  private ids = signal<string[]>([]);
  private entities = signal<Record<string, User>>({});
  loading = signal(false);
  error = signal('');
  users = computed(() => this.ids().map(id => this.entities()[id]));

  load(fail: boolean) {
    this.loading.set(true);
    this.error.set('');
    of(null).pipe(delay(600)).subscribe(() => {
      this.loading.set(false);
      if (fail) {
        this.error.set('Failed to load users');
      } else {
        const data: User[] = ['Alice', 'Bob'].map((n, i) => ({ id: `u${i + 1}`, name: n, email: '' }));
        this.ids.set(data.map(u => u.id));
        this.entities.set(data.reduce((a, u) => ({ ...a, [u.id]: u }), {}));
      }
    });
  }
}

// 22. Entity CRUD signal reducer (full add/update/remove)
@Component({
  selector: 'ex-22', standalone: true,
  template: `
    <button (click)="add()">Add</button>
    <ul>@for (u of all(); track u.id) {
      <li>{{ u.name }}
        <button (click)="update(u.id)">Rename</button>
        <button (click)="remove(u.id)">Delete</button>
      </li>
    }</ul>
  `
})
class Ex22 {
  private store = signal<{ ids: string[]; entities: Record<string, User> }>({ ids: [], entities: {} });
  all = computed(() => this.store().ids.map(id => this.store().entities[id]));
  counter = 1;

  add() {
    const u: User = { id: `u${this.counter}`, name: `User ${this.counter++}`, email: '' };
    this.store.update(s => ({ ids: [...s.ids, u.id], entities: { ...s.entities, [u.id]: u } }));
  }

  update(id: string) {
    this.store.update(s => ({ ...s, entities: { ...s.entities, [id]: { ...s.entities[id], name: s.entities[id].name + '!' } } }));
  }

  remove(id: string) {
    this.store.update(s => {
      const { [id]: _, ...rest } = s.entities;
      return { ids: s.ids.filter(i => i !== id), entities: rest };
    });
  }
}

// 23. Entity pagination (page + pageSize computed slice)
@Component({
  selector: 'ex-23', standalone: true,
  template: `
    <button (click)="prev()">Prev</button>
    Page {{ page() + 1 }} / {{ totalPages() }}
    <button (click)="next()">Next</button>
    <ul>@for (u of paginated(); track u.id) { <li>{{ u.name }}</li> }</ul>
  `
})
class Ex23 {
  pageSize = 3;
  private store = signal<User[]>(
    Array.from({ length: 10 }, (_, i) => ({ id: `u${i + 1}`, name: `User ${i + 1}`, email: '' }))
  );
  page = signal(0);
  total = computed(() => this.store().length);
  totalPages = computed(() => Math.ceil(this.total() / this.pageSize));
  paginated = computed(() => this.store().slice(this.page() * this.pageSize, (this.page() + 1) * this.pageSize));

  prev() { if (this.page() > 0) this.page.update(p => p - 1); }
  next() { if (this.page() < this.totalPages() - 1) this.page.update(p => p + 1); }
}

// 24. Entity HTTP load simulation (with loading state)
@Component({
  selector: 'ex-24', standalone: true,
  template: `
    <button (click)="load()">HTTP Load</button>
    @if (loading()) { <p>Loading from server...</p> }
    <p>Loaded {{ users().length }} users</p>
    <ul>@for (u of users(); track u.id) { <li>{{ u.name }}</li> }</ul>
  `
})
class Ex24 {
  loading = signal(false);
  private store = signal<{ ids: string[]; entities: Record<string, User> }>({ ids: [], entities: {} });
  users = computed(() => this.store().ids.map(id => this.store().entities[id]));

  load() {
    this.loading.set(true);
    of(['Dave', 'Eve', 'Frank', 'Grace'].map((n, i) => ({ id: `u${i + 1}`, name: n, email: `${n.toLowerCase()}@test.com` })))
      .pipe(delay(700))
      .subscribe((data: User[]) => {
        this.store.set({ ids: data.map(u => u.id), entities: data.reduce((a, u) => ({ ...a, [u.id]: u }), {}) });
        this.loading.set(false);
      });
  }
}

// 25. Entity error per operation (Map of id→error)
@Component({
  selector: 'ex-25', standalone: true,
  template: `
    <button (click)="init()">Init</button>
    @for (u of users(); track u.id) {
      <p>
        {{ u.name }}
        <button (click)="tryDelete(u.id)">Delete</button>
        @if (errors()[u.id]) { <span style="color:red">{{ errors()[u.id] }}</span> }
      </p>
    }
  `
})
class Ex25 {
  private store = signal<{ ids: string[]; entities: Record<string, User> }>({ ids: [], entities: {} });
  private errorMap = signal<Record<string, string>>({});
  users = computed(() => this.store().ids.map(id => this.store().entities[id]));
  errors = computed(() => this.errorMap());

  init() {
    const data: User[] = ['Alice', 'Bob', 'Carol'].map((n, i) => ({ id: `u${i + 1}`, name: n, email: '' }));
    this.store.set({ ids: data.map(u => u.id), entities: data.reduce((a, u) => ({ ...a, [u.id]: u }), {}) });
  }

  tryDelete(id: string) {
    if (Math.random() > 0.5) {
      this.errorMap.update(e => ({ ...e, [id]: 'Delete failed (403)' }));
    } else {
      this.errorMap.update(e => { const { [id]: _, ...rest } = e; return rest; });
      this.store.update(s => {
        const { [id]: _, ...entities } = s.entities;
        return { ids: s.ids.filter(i => i !== id), entities };
      });
    }
  }
}

// 26. Multiple entity collections (users + posts signals)
@Component({
  selector: 'ex-26', standalone: true,
  template: `
    <button (click)="init()">Load All</button>
    <p>Users: {{ userCount() }} | Posts: {{ postCount() }}</p>
    <ul>@for (u of users(); track u.id) { <li>{{ u.name }}</li> }</ul>
    <ul>@for (p of posts(); track p.id) { <li>{{ p.title }}</li> }</ul>
  `
})
class Ex26 {
  private userStore = signal<{ ids: string[]; entities: Record<string, User> }>({ ids: [], entities: {} });
  private postStore = signal<{ ids: string[]; entities: Record<string, Post> }>({ ids: [], entities: {} });
  users = computed(() => this.userStore().ids.map(id => this.userStore().entities[id]));
  posts = computed(() => this.postStore().ids.map(id => this.postStore().entities[id]));
  userCount = computed(() => this.userStore().ids.length);
  postCount = computed(() => this.postStore().ids.length);

  init() {
    const us: User[] = ['Alice', 'Bob'].map((n, i) => ({ id: `u${i + 1}`, name: n, email: '' }));
    const ps: Post[] = ['Post A', 'Post B', 'Post C'].map((t, i) => ({ id: `p${i + 1}`, title: t, authorId: `u${(i % 2) + 1}` }));
    this.userStore.set({ ids: us.map(u => u.id), entities: us.reduce((a, u) => ({ ...a, [u.id]: u }), {}) });
    this.postStore.set({ ids: ps.map(p => p.id), entities: ps.reduce((a, p) => ({ ...a, [p.id]: p }), {}) });
  }
}

// ─── NESTED (27–38) ─────────────────────────────────────────

// 27. Posts with Users lookup (join by authorId)
@Component({
  selector: 'ex-27', standalone: true,
  template: `
    <button (click)="init()">Load</button>
    <ul>@for (p of enriched(); track p.postId) {
      <li>{{ p.title }} — by {{ p.authorName }}</li>
    }</ul>
  `
})
class Ex27 {
  private users = signal<Record<string, User>>({});
  private posts = signal<Post[]>([]);
  enriched = computed(() =>
    this.posts().map(p => ({ postId: p.id, title: p.title, authorName: this.users()[p.authorId]?.name ?? 'Unknown' }))
  );

  init() {
    this.users.set({ u1: { id: 'u1', name: 'Alice', email: '' }, u2: { id: 'u2', name: 'Bob', email: '' } });
    this.posts.set([
      { id: 'p1', title: 'Hello', authorId: 'u1' },
      { id: 'p2', title: 'World', authorId: 'u2' },
      { id: 'p3', title: 'NgRx', authorId: 'u1' }
    ]);
  }
}

// 28. Entity denormalization — computed joined objects
@Component({
  selector: 'ex-28', standalone: true,
  template: `
    <button (click)="init()">Init</button>
    <ul>@for (item of denormalized(); track item.id) {
      <li>{{ item.name }} &lt;{{ item.email }}&gt; — {{ item.postCount }} posts</li>
    }</ul>
    <small>Denormalize: join user + computed postCount</small>
  `
})
class Ex28 {
  private users = signal<User[]>([]);
  private posts = signal<Post[]>([]);
  denormalized = computed(() =>
    this.users().map(u => ({
      ...u,
      postCount: this.posts().filter(p => p.authorId === u.id).length
    }))
  );

  init() {
    this.users.set([{ id: 'u1', name: 'Alice', email: 'alice@test.com' }, { id: 'u2', name: 'Bob', email: 'bob@test.com' }]);
    this.posts.set([
      { id: 'p1', title: 'A1', authorId: 'u1' },
      { id: 'p2', title: 'A2', authorId: 'u1' },
      { id: 'p3', title: 'B1', authorId: 'u2' }
    ]);
  }
}

// 29. Cross-entity selector (posts filtered by userId)
@Component({
  selector: 'ex-29', standalone: true,
  template: `
    <button (click)="init()">Init</button>
    @for (u of users(); track u.id) {
      <p>
        <button (click)="select(u.id)">{{ u.name }}</button>
      </p>
    }
    @if (selectedUser()) {
      <strong>Posts by {{ selectedUser()!.name }}:</strong>
      <ul>@for (p of postsByUser(); track p.id) { <li>{{ p.title }}</li> }</ul>
    }
  `
})
class Ex29 {
  private usersData = signal<User[]>([]);
  private postsData = signal<Post[]>([]);
  selectedId = signal('');
  users = computed(() => this.usersData());
  selectedUser = computed(() => this.usersData().find(u => u.id === this.selectedId()) ?? null);
  postsByUser = computed(() => this.postsData().filter(p => p.authorId === this.selectedId()));

  init() {
    this.usersData.set([{ id: 'u1', name: 'Alice', email: '' }, { id: 'u2', name: 'Bob', email: '' }]);
    this.postsData.set([
      { id: 'p1', title: 'Alice Post 1', authorId: 'u1' },
      { id: 'p2', title: 'Alice Post 2', authorId: 'u1' },
      { id: 'p3', title: 'Bob Post 1', authorId: 'u2' }
    ]);
  }

  select(id: string) { this.selectedId.set(id); }
}

// 30. Filtered entity view (completed todos only)
@Component({
  selector: 'ex-30', standalone: true,
  template: `
    <button (click)="init()">Init</button>
    <label><input type="checkbox" (change)="showAll.set(!showAll())" /> Show all</label>
    <ul>@for (t of visible(); track t.id) {
      <li (click)="toggle(t.id)" [style.text-decoration]="t.done ? 'line-through' : 'none'" style="cursor:pointer">
        {{ t.text }}
      </li>
    }</ul>
    <small>Showing {{ visible().length }} / {{ total() }} todos</small>
  `
})
class Ex30 {
  private todos = signal<{ id: string; text: string; done: boolean }[]>([]);
  showAll = signal(false);
  total = computed(() => this.todos().length);
  visible = computed(() => this.showAll() ? this.todos() : this.todos().filter(t => !t.done));

  init() {
    this.todos.set([
      { id: 't1', text: 'Buy groceries', done: false },
      { id: 't2', text: 'Write tests', done: true },
      { id: 't3', text: 'Deploy app', done: false },
      { id: 't4', text: 'Review PR', done: true }
    ]);
  }

  toggle(id: string) {
    this.todos.update(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }
}

// 31. Sorted entity view (by priority)
@Component({
  selector: 'ex-31', standalone: true,
  template: `
    <button (click)="init()">Init</button>
    <p>Sort: <button (click)="dir.set(dir() === 'asc' ? 'desc' : 'asc')">{{ dir() }}</button></p>
    <ul>@for (t of sorted(); track t.id) {
      <li>P{{ t.priority }}: {{ t.title }}</li>
    }</ul>
  `
})
class Ex31 {
  private tasks = signal<{ id: string; title: string; priority: number }[]>([]);
  dir = signal<'asc' | 'desc'>('asc');
  sorted = computed(() => {
    const d = this.dir() === 'asc' ? 1 : -1;
    return [...this.tasks()].sort((a, b) => (a.priority - b.priority) * d);
  });

  init() {
    this.tasks.set([
      { id: 't1', title: 'Critical bug', priority: 1 },
      { id: 't2', title: 'Nice to have', priority: 5 },
      { id: 't3', title: 'Minor refactor', priority: 3 },
      { id: 't4', title: 'Feature request', priority: 2 }
    ]);
  }
}

// 32. Optimistic update + rollback on error
@Component({
  selector: 'ex-32', standalone: true,
  template: `
    <button (click)="init()">Init</button>
    <button (click)="toggleFail()">Fail next: {{ willFail() }}</button>
    @for (u of users(); track u.id) {
      <p>{{ u.name }} <button (click)="rename(u.id)">Rename (optimistic)</button></p>
    }
    @if (msg()) { <p [style.color]="msgColor()">{{ msg() }}</p> }
  `
})
class Ex32 {
  private store = signal<Record<string, User>>({});
  private ids = signal<string[]>([]);
  users = computed(() => this.ids().map(id => this.store()[id]));
  willFail = signal(false);
  msg = signal('');
  msgColor = computed(() => this.msg().startsWith('Error') ? 'red' : 'green');

  init() {
    const data: User[] = ['Alice', 'Bob'].map((n, i) => ({ id: `u${i + 1}`, name: n, email: '' }));
    this.ids.set(data.map(u => u.id));
    this.store.set(data.reduce((a, u) => ({ ...a, [u.id]: u }), {}));
  }

  rename(id: string) {
    const prev = { ...this.store()[id] };
    const newName = prev.name + ' (renamed)';
    this.store.update(s => ({ ...s, [id]: { ...s[id], name: newName } }));

    of(null).pipe(delay(500)).subscribe(() => {
      if (this.willFail()) {
        this.store.update(s => ({ ...s, [id]: prev }));
        this.msg.set('Error: rename failed, rolled back');
      } else {
        this.msg.set('Rename confirmed');
      }
      setTimeout(() => this.msg.set(''), 2000);
    });
  }

  toggleFail() { this.willFail.update(v => !v); }
}

// 33. Batch operations (select all + bulk delete)
@Component({
  selector: 'ex-33', standalone: true,
  template: `
    <button (click)="init()">Init</button>
    <label><input type="checkbox" (change)="toggleSelectAll()" [checked]="allSelected()" /> Select All</label>
    @for (u of users(); track u.id) {
      <p><label><input type="checkbox" [checked]="selected().has(u.id)" (change)="toggle(u.id)" /> {{ u.name }}</label></p>
    }
    <button (click)="deleteSelected()" [disabled]="selected().size === 0">Delete Selected ({{ selected().size }})</button>
  `
})
class Ex33 {
  private store = signal<{ ids: string[]; entities: Record<string, User> }>({ ids: [], entities: {} });
  selected = signal(new Set<string>());
  users = computed(() => this.store().ids.map(id => this.store().entities[id]));
  allSelected = computed(() => this.store().ids.length > 0 && this.store().ids.every(id => this.selected().has(id)));

  init() {
    const data: User[] = ['Alice', 'Bob', 'Carol', 'Dave'].map((n, i) => ({ id: `u${i + 1}`, name: n, email: '' }));
    this.store.set({ ids: data.map(u => u.id), entities: data.reduce((a, u) => ({ ...a, [u.id]: u }), {}) });
    this.selected.set(new Set());
  }

  toggle(id: string) {
    this.selected.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  toggleSelectAll() {
    if (this.allSelected()) {
      this.selected.set(new Set());
    } else {
      this.selected.set(new Set(this.store().ids));
    }
  }

  deleteSelected() {
    const ids = [...this.selected()];
    this.store.update(s => {
      const entities = { ...s.entities };
      ids.forEach(id => delete entities[id]);
      return { ids: s.ids.filter(id => !ids.includes(id)), entities };
    });
    this.selected.set(new Set());
  }
}

// 34. Draft/editing entity state (editingId signal)
@Component({
  selector: 'ex-34', standalone: true,
  template: `
    <button (click)="init()">Init</button>
    @for (u of users(); track u.id) {
      @if (editingId() === u.id) {
        <p><input [value]="draft()" (input)="draft.set($any($event.target).value)" />
        <button (click)="save(u.id)">Save</button>
        <button (click)="cancel()">Cancel</button></p>
      } @else {
        <p>{{ u.name }} <button (click)="startEdit(u.id, u.name)">Edit</button></p>
      }
    }
  `
})
class Ex34 {
  private store = signal<{ ids: string[]; entities: Record<string, User> }>({ ids: [], entities: {} });
  users = computed(() => this.store().ids.map(id => this.store().entities[id]));
  editingId = signal('');
  draft = signal('');

  init() {
    const data: User[] = ['Alice', 'Bob'].map((n, i) => ({ id: `u${i + 1}`, name: n, email: '' }));
    this.store.set({ ids: data.map(u => u.id), entities: data.reduce((a, u) => ({ ...a, [u.id]: u }), {}) });
  }

  startEdit(id: string, name: string) { this.editingId.set(id); this.draft.set(name); }
  cancel() { this.editingId.set(''); }
  save(id: string) {
    this.store.update(s => ({ ...s, entities: { ...s.entities, [id]: { ...s.entities[id], name: this.draft() } } }));
    this.editingId.set('');
  }
}

// 35. Soft delete (isDeleted flag filter)
@Component({
  selector: 'ex-35', standalone: true,
  template: `
    <button (click)="init()">Init</button>
    @for (u of active(); track u.id) {
      <p>{{ u.name }} <button (click)="softDelete(u.id)">Soft Delete</button></p>
    }
    <p>Deleted: {{ deleted().map(u => u.name).join(', ') || '(none)' }}</p>
  `
})
class Ex35 {
  private users = signal<(User & { isDeleted: boolean })[]>([]);
  active = computed(() => this.users().filter(u => !u.isDeleted));
  deleted = computed(() => this.users().filter(u => u.isDeleted));

  init() {
    this.users.set(['Alice', 'Bob', 'Carol'].map((n, i) => ({ id: `u${i + 1}`, name: n, email: '', isDeleted: false })));
  }

  softDelete(id: string) {
    this.users.update(us => us.map(u => u.id === id ? { ...u, isDeleted: true } : u));
  }
}

// 36. Change tracking (modifiedIds Set signal)
@Component({
  selector: 'ex-36', standalone: true,
  template: `
    <button (click)="init()">Init</button>
    @for (u of users(); track u.id) {
      <p [style.background]="modified().has(u.id) ? '#fff3cd' : 'transparent'">
        {{ u.name }} {{ modified().has(u.id) ? '(modified)' : '' }}
        <button (click)="rename(u.id)">Rename</button>
      </p>
    }
    <button (click)="saveAll()" [disabled]="modified().size === 0">Save {{ modified().size }} changes</button>
  `
})
class Ex36 {
  private store = signal<{ ids: string[]; entities: Record<string, User> }>({ ids: [], entities: {} });
  modified = signal(new Set<string>());
  users = computed(() => this.store().ids.map(id => this.store().entities[id]));

  init() {
    const data: User[] = ['Alice', 'Bob', 'Carol'].map((n, i) => ({ id: `u${i + 1}`, name: n, email: '' }));
    this.store.set({ ids: data.map(u => u.id), entities: data.reduce((a, u) => ({ ...a, [u.id]: u }), {}) });
    this.modified.set(new Set());
  }

  rename(id: string) {
    this.store.update(s => ({ ...s, entities: { ...s.entities, [id]: { ...s.entities[id], name: s.entities[id].name + '*' } } }));
    this.modified.update(s => new Set([...s, id]));
  }

  saveAll() { this.modified.set(new Set()); }
}

// 37. Entity snapshot for undo (previous state)
@Component({
  selector: 'ex-37', standalone: true,
  template: `
    <button (click)="init()">Init</button>
    <button (click)="undo()" [disabled]="!canUndo()">Undo</button>
    @for (u of users(); track u.id) {
      <p>{{ u.name }} <button (click)="rename(u.id)">Rename</button></p>
    }
  `
})
class Ex37 {
  private store = signal<{ ids: string[]; entities: Record<string, User> }>({ ids: [], entities: {} });
  private snapshot = signal<{ ids: string[]; entities: Record<string, User> } | null>(null);
  users = computed(() => this.store().ids.map(id => this.store().entities[id]));
  canUndo = computed(() => this.snapshot() !== null);

  init() {
    const data: User[] = ['Alice', 'Bob'].map((n, i) => ({ id: `u${i + 1}`, name: n, email: '' }));
    this.store.set({ ids: data.map(u => u.id), entities: data.reduce((a, u) => ({ ...a, [u.id]: u }), {}) });
    this.snapshot.set(null);
  }

  rename(id: string) {
    this.snapshot.set({ ...this.store() });
    this.store.update(s => ({ ...s, entities: { ...s.entities, [id]: { ...s.entities[id], name: s.entities[id].name + '!' } } }));
  }

  undo() {
    const snap = this.snapshot();
    if (snap) { this.store.set(snap); this.snapshot.set(null); }
  }
}

// 38. Full entity CRUD signal store with all operations
@Component({
  selector: 'ex-38', standalone: true,
  template: `
    <input #nameInput placeholder="Name" />
    <button (click)="add(nameInput.value); nameInput.value=''">Add</button>
    @for (u of users(); track u.id) {
      <p>{{ u.name }}
        <button (click)="update(u.id)">Edit</button>
        <button (click)="remove(u.id)">Del</button>
      </p>
    }
    <p>Total: {{ total() }}</p>
  `
})
class Ex38 {
  private store = signal<{ ids: string[]; entities: Record<string, User> }>({ ids: [], entities: {} });
  users = computed(() => this.store().ids.map(id => this.store().entities[id]));
  total = computed(() => this.store().ids.length);
  counter = 1;

  add(name: string) {
    if (!name) return;
    const u: User = { id: `u${this.counter++}`, name, email: '' };
    this.store.update(s => ({ ids: [...s.ids, u.id], entities: { ...s.entities, [u.id]: u } }));
  }

  update(id: string) {
    const n = prompt('New name:', this.store().entities[id]?.name);
    if (n) this.store.update(s => ({ ...s, entities: { ...s.entities, [id]: { ...s.entities[id], name: n } } }));
  }

  remove(id: string) {
    this.store.update(s => {
      const { [id]: _, ...entities } = s.entities;
      return { ids: s.ids.filter(i => i !== id), entities };
    });
  }
}

// ─── ADVANCED (39–50) ───────────────────────────────────────

// 39. Typed entity with generics: EntityStore<T>
@Component({
  selector: 'ex-39', standalone: true,
  template: `
    <button (click)="userStore.addOne({ id: 'u1', name: 'Alice', email: '' })">Add User</button>
    <button (click)="postStore.addOne({ id: 'p1', title: 'Hello', authorId: 'u1' })">Add Post</button>
    <p>Users: {{ userStore.total() }} | Posts: {{ postStore.total() }}</p>
    <ul>@for (u of userStore.all(); track u.id) { <li>{{ u.name }}</li> }</ul>
    <ul>@for (p of postStore.all(); track p.id) { <li>{{ p.title }}</li> }</ul>
    <small>Generic EntityStore&lt;T&gt; reused for any entity type</small>
  `
})
class Ex39 {
  userStore = new EntityStore<User>();
  postStore = new EntityStore<Post>();
}

class EntityStore<T extends { id: string }> {
  private _ids = signal<string[]>([]);
  private _entities = signal<Record<string, T>>({});
  all = computed(() => this._ids().map(id => this._entities()[id]));
  total = computed(() => this._ids().length);
  entities = computed(() => this._entities());

  addOne(item: T) {
    this._ids.update(ids => ids.includes(item.id) ? ids : [...ids, item.id]);
    this._entities.update(e => ({ ...e, [item.id]: item }));
  }
  removeOne(id: string) {
    this._ids.update(ids => ids.filter(i => i !== id));
    this._entities.update(e => { const { [id]: _, ...rest } = e; return rest as Record<string, T>; });
  }
  updateOne(id: string, changes: Partial<T>) {
    this._entities.update(e => ({ ...e, [id]: { ...e[id], ...changes } }));
  }
  selectById(id: string) { return computed(() => this._entities()[id]); }
}

// 40. Entity adapter factory (reusable for any model)
@Component({
  selector: 'ex-40', standalone: true,
  template: `
    <pre>{{ code }}</pre>
  `
})
class Ex40 {
  code = `// Entity adapter factory: generates all CRUD operations for any type
function createEntityAdapter<T extends { id: string }>() {
  return {
    getInitialState: (): EntityState<T> => ({ ids: [], entities: {} }),
    addOne: (state: EntityState<T>, entity: T): EntityState<T> => ({
      ids: state.ids.includes(entity.id) ? state.ids : [...state.ids, entity.id],
      entities: { ...state.entities, [entity.id]: entity }
    }),
    removeOne: (state: EntityState<T>, id: string): EntityState<T> => {
      const { [id]: _, ...entities } = state.entities;
      return { ids: state.ids.filter(i => i !== id), entities };
    },
    updateOne: (state: EntityState<T>, id: string, changes: Partial<T>): EntityState<T> => ({
      ...state,
      entities: { ...state.entities, [id]: { ...state.entities[id], ...changes } }
    }),
    selectAll: (state: EntityState<T>): T[] => state.ids.map(id => state.entities[id]),
    selectTotal: (state: EntityState<T>): number => state.ids.length,
  };
}

// Usage for User and Post with same adapter:
const userAdapter = createEntityAdapter<User>();
const postAdapter = createEntityAdapter<Post>();`;
}

// 41. Entity with versioning (version number)
@Component({
  selector: 'ex-41', standalone: true,
  template: `
    <button (click)="init()">Init</button>
    @for (u of users(); track u.id) {
      <p>{{ u.name }} (v{{ u.version }}) <button (click)="update(u.id)">Update</button></p>
    }
  `
})
class Ex41 {
  private store = signal<(User & { version: number })[]>([]);
  users = computed(() => this.store());

  init() {
    this.store.set(['Alice', 'Bob'].map((n, i) => ({ id: `u${i + 1}`, name: n, email: '', version: 1 })));
  }

  update(id: string) {
    this.store.update(us => us.map(u =>
      u.id === id ? { ...u, name: u.name + '*', version: u.version + 1 } : u
    ));
  }
}

// 42. Entity with audit trail (createdAt, updatedAt)
@Component({
  selector: 'ex-42', standalone: true,
  template: `
    <button (click)="add()">Add</button>
    @for (u of users(); track u.id) {
      <p>{{ u.name }}
        <small>created: {{ u['createdAt'] | date:'HH:mm:ss' ?? '' }}
          | updated: {{ u['updatedAt'] | date:'HH:mm:ss' ?? '—' }}</small>
        <button (click)="rename(u.id)">Rename</button>
      </p>
    }
  `,
  imports: []
})
class Ex42 {
  private store = signal<(User & { createdAt: Date; updatedAt: Date | null })[]>([]);
  users = computed(() => this.store());
  counter = 1;

  add() {
    this.store.update(us => [...us, { id: `u${this.counter}`, name: `User ${this.counter++}`, email: '', createdAt: new Date(), updatedAt: null }]);
  }

  rename(id: string) {
    this.store.update(us => us.map(u => u.id === id ? { ...u, name: u.name + '!', updatedAt: new Date() } : u));
  }
}

// 43. Entity normalization from nested API response
@Component({
  selector: 'ex-43', standalone: true,
  template: `
    <button (click)="normalize()">Normalize API response</button>
    <p>Users: {{ userStore.total() }} | Posts: {{ postStore.total() }}</p>
    <ul>@for (u of userStore.all(); track u.id) { <li>{{ u.name }}</li> }</ul>
    <ul>@for (p of postStore.all(); track p.id) { <li>{{ p.title }} (by {{ p.authorId }})</li> }</ul>
    <small>Nested → flat EntityState normalization</small>
  `
})
class Ex43 {
  userStore = new EntityStore<User>();
  postStore = new EntityStore<Post>();

  normalize() {
    const apiResponse = {
      users: [
        { id: 'u1', name: 'Alice', email: 'a@test.com', posts: [{ id: 'p1', title: 'Alice Post 1' }, { id: 'p2', title: 'Alice Post 2' }] },
        { id: 'u2', name: 'Bob', email: 'b@test.com', posts: [{ id: 'p3', title: 'Bob Post 1' }] }
      ]
    };

    apiResponse.users.forEach(u => {
      const { posts, ...user } = u;
      this.userStore.addOne(user);
      posts.forEach(p => this.postStore.addOne({ ...p, authorId: u.id }));
    });
  }
}

// 44. Entity real-time sync (WebSocket Subject)
@Component({
  selector: 'ex-44', standalone: true,
  template: `
    <button (click)="connect()">Connect</button>
    <button (click)="disconnect()">Disconnect</button>
    <p>Status: {{ status() }}</p>
    <ul>@for (u of users(); track u.id) { <li>{{ u.name }}</li> }</ul>
    <small>Simulates real-time entity updates via WebSocket</small>
  `
})
class Ex44 implements OnDestroy {
  private store = new EntityStore<User>();
  users = computed(() => this.store.all());
  status = signal('disconnected');
  private ws$ = new Subject<void>();
  private sub: any;

  connect() {
    this.status.set('connected');
    let tick = 0;
    this.sub = interval(1200).pipe(
      takeUntil(this.ws$),
      map(() => {
        tick++;
        const names = ['Alice', 'Bob', 'Carol', 'Dave'];
        return { id: `u${(tick % 4) + 1}`, name: `${names[tick % 4]} (t${tick})`, email: '' };
      })
    ).subscribe(u => this.store.updateOne(u.id, { name: u.name }) || this.store.addOne(u));
  }

  disconnect() { this.ws$.next(); this.status.set('disconnected'); }
  ngOnDestroy() { this.ws$.next(); }
}

// 45. Paginated entity with server-side total count
@Component({
  selector: 'ex-45', standalone: true,
  template: `
    <button (click)="loadPage(0)">Page 1</button>
    <button (click)="loadPage(1)">Page 2</button>
    <button (click)="loadPage(2)">Page 3</button>
    @if (loading()) { <p>Loading page {{ page() + 1 }}...</p> }
    <ul>@for (u of users(); track u.id) { <li>{{ u.name }}</li> }</ul>
    <p>Page {{ page() + 1 }} of {{ totalPages() }} ({{ serverTotal() }} total)</p>
  `
})
class Ex45 {
  private store = new EntityStore<User>();
  users = computed(() => this.store.all());
  loading = signal(false);
  page = signal(0);
  serverTotal = signal(0);
  pageSize = 3;
  totalPages = computed(() => Math.ceil(this.serverTotal() / this.pageSize));

  loadPage(p: number) {
    this.loading.set(true);
    this.page.set(p);
    const allUsers: User[] = Array.from({ length: 9 }, (_, i) => ({ id: `u${i + 1}`, name: `User ${i + 1}`, email: '' }));
    of({ data: allUsers.slice(p * this.pageSize, (p + 1) * this.pageSize), total: 9 })
      .pipe(delay(400))
      .subscribe(({ data, total }) => {
        this.serverTotal.set(total);
        this.store['_ids'].set(data.map(u => u.id));
        this.store['_entities'].set(data.reduce((a: Record<string, User>, u: User) => ({ ...a, [u.id]: u }), {}));
        this.loading.set(false);
      });
  }
}

// 46. Complex selector: posts + authors + comments joined
@Component({
  selector: 'ex-46', standalone: true,
  template: `
    <button (click)="init()">Load All</button>
    @for (item of enrichedPosts(); track item.postId) {
      <div style="border:1px solid #ccc;padding:8px;margin:4px">
        <strong>{{ item.title }}</strong> by {{ item.authorName }}
        <ul>@for (c of item.comments; track c.id) { <li>{{ c.text }}</li> }</ul>
      </div>
    }
  `
})
class Ex46 {
  private users = signal<User[]>([]);
  private posts = signal<Post[]>([]);
  private comments = signal<Comment[]>([]);

  enrichedPosts = computed(() =>
    this.posts().map(p => ({
      postId: p.id,
      title: p.title,
      authorName: this.users().find(u => u.id === p.authorId)?.name ?? 'Unknown',
      comments: this.comments().filter(c => c.postId === p.id)
    }))
  );

  init() {
    this.users.set([{ id: 'u1', name: 'Alice', email: '' }, { id: 'u2', name: 'Bob', email: '' }]);
    this.posts.set([{ id: 'p1', title: 'NgRx Guide', authorId: 'u1' }, { id: 'p2', title: 'Signals', authorId: 'u2' }]);
    this.comments.set([
      { id: 'c1', postId: 'p1', text: 'Great post!' },
      { id: 'c2', postId: 'p1', text: 'Very helpful' },
      { id: 'c3', postId: 'p2', text: 'Awesome' }
    ]);
  }
}

// 47. One-to-many relations (category → products)
@Component({
  selector: 'ex-47', standalone: true,
  template: `
    <button (click)="init()">Init</button>
    @for (cat of categories(); track cat.id) {
      <div>
        <strong>{{ cat.label }}</strong> ({{ productsByCategory()[cat.id]?.length ?? 0 }} items)
        <ul>@for (p of productsByCategory()[cat.id] ?? []; track p.id) { <li>{{ p.name }} ${{ p.price }}</li> }</ul>
      </div>
    }
  `
})
class Ex47 {
  categories = signal<Category[]>([]);
  products = signal<Product[]>([]);
  productsByCategory = computed(() => {
    const map: Record<string, Product[]> = {};
    this.products().forEach(p => {
      if (!map[p.categoryId]) map[p.categoryId] = [];
      map[p.categoryId].push(p);
    });
    return map;
  });

  init() {
    this.categories.set([{ id: 'c1', label: 'Electronics' }, { id: 'c2', label: 'Books' }]);
    this.products.set([
      { id: 'p1', name: 'Laptop', price: 999, categoryId: 'c1' },
      { id: 'p2', name: 'Phone', price: 699, categoryId: 'c1' },
      { id: 'p3', name: 'JS Book', price: 39, categoryId: 'c2' }
    ]);
  }
}

// 48. Entity undo/redo stack (history array signal)
@Component({
  selector: 'ex-48', standalone: true,
  template: `
    <button (click)="init()">Init</button>
    <button (click)="undo()" [disabled]="historyIndex() <= 0">Undo</button>
    <button (click)="redo()" [disabled]="historyIndex() >= history().length - 1">Redo</button>
    @for (u of users(); track u.id) {
      <p>{{ u.name }} <button (click)="rename(u.id)">Rename</button></p>
    }
    <small>History: {{ historyIndex() + 1 }} / {{ history().length }}</small>
  `
})
class Ex48 {
  history = signal<User[][]>([]);
  historyIndex = signal(-1);
  users = computed(() => this.history()[this.historyIndex()] ?? []);

  init() {
    const data = ['Alice', 'Bob'].map((n, i) => ({ id: `u${i + 1}`, name: n, email: '' }));
    this.history.set([data]);
    this.historyIndex.set(0);
  }

  rename(id: string) {
    const current = this.users();
    const next = current.map(u => u.id === id ? { ...u, name: u.name + '!' } : u);
    const hist = this.history().slice(0, this.historyIndex() + 1);
    this.history.set([...hist, next]);
    this.historyIndex.update(i => i + 1);
  }

  undo() { if (this.historyIndex() > 0) this.historyIndex.update(i => i - 1); }
  redo() { if (this.historyIndex() < this.history().length - 1) this.historyIndex.update(i => i + 1); }
}

// 49. Entity migration (v1 → v2 data transform)
@Component({
  selector: 'ex-49', standalone: true,
  template: `
    <button (click)="loadV1()">Load V1 Data</button>
    <button (click)="migrate()">Migrate V1 → V2</button>
    <p>Format: {{ format() }}</p>
    <ul>@for (u of users(); track u.id) { <li>{{ u | json }}</li> }</ul>
  `,
  imports: []
})
class Ex49 {
  format = signal('none');
  users = signal<any[]>([]);

  loadV1() {
    this.format.set('v1');
    this.users.set([
      { id: 'u1', fullName: 'Alice Smith', emailAddress: 'alice@test.com' },
      { id: 'u2', fullName: 'Bob Jones', emailAddress: 'bob@test.com' }
    ]);
  }

  migrate() {
    if (this.format() !== 'v1') return;
    this.users.update(us => us.map((u: any) => ({
      id: u.id,
      name: u.fullName,
      email: u.emailAddress
    })));
    this.format.set('v2');
  }
}

// 50. Full normalized store: users + posts + comments (all linked)
@Component({
  selector: 'ex-50', standalone: true,
  template: `
    <button (click)="init()">Load Normalized Store</button>
    <button (click)="addComment('p1', 'New comment!')">Add Comment to Post 1</button>
    @for (p of enriched(); track p.id) {
      <div style="border:1px solid #ddd;padding:6px;margin:4px">
        <strong>{{ p.title }}</strong> <em>by {{ p.authorName }}</em>
        <ul>@for (c of p.comments; track c.id) { <li>{{ c.text }}</li> }</ul>
      </div>
    }
    <p>Totals — Users: {{ users.total() }} | Posts: {{ posts.total() }} | Comments: {{ comments.total() }}</p>
  `
})
class Ex50 {
  users = new EntityStore<User>();
  posts = new EntityStore<Post>();
  comments = new EntityStore<Comment>();
  commentCounter = 1;

  enriched = computed(() =>
    this.posts.all().map(p => ({
      ...p,
      authorName: this.users.entities()[p.authorId]?.name ?? 'Unknown',
      comments: this.comments.all().filter(c => c.postId === p.id)
    }))
  );

  init() {
    ['u1', 'u2'].forEach((id, i) => this.users.addOne({ id, name: ['Alice', 'Bob'][i], email: '' }));
    [{ id: 'p1', title: 'Post One', authorId: 'u1' }, { id: 'p2', title: 'Post Two', authorId: 'u2' }]
      .forEach(p => this.posts.addOne(p));
    [{ id: 'c1', postId: 'p1', text: 'First comment' }, { id: 'c2', postId: 'p2', text: 'Nice post' }]
      .forEach(c => this.comments.addOne(c));
    this.commentCounter = 3;
  }

  addComment(postId: string, text: string) {
    this.comments.addOne({ id: `c${this.commentCounter++}`, postId, text });
  }
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
    Ex41, Ex42, Ex43, Ex44, Ex45, Ex46, Ex47, Ex48, Ex49, Ex50
  ],
  template: `
    <div style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:20px">
      <h1>Examples 7.4 — NgRx Entity (50 examples)</h1>

      <h4>1. EntityState shape { ids, entities }</h4><ex-01 /><hr />
      <h4>2. addOne</h4><ex-02 /><hr />
      <h4>3. addMany</h4><ex-03 /><hr />
      <h4>4. setOne — replace single entity</h4><ex-04 /><hr />
      <h4>5. setAll — replace all entities</h4><ex-05 /><hr />
      <h4>6. removeOne — remove by id</h4><ex-06 /><hr />
      <h4>7. removeMany — remove by ids array</h4><ex-07 /><hr />
      <h4>8. updateOne({ id, changes })</h4><ex-08 /><hr />
      <h4>9. updateMany — multiple partial updates</h4><ex-09 /><hr />
      <h4>10. upsertOne — add or update</h4><ex-10 /><hr />
      <h4>11. upsertMany — multiple upsert</h4><ex-11 /><hr />
      <h4>12. mapOne — transform single entity</h4><ex-12 /><hr />
      <h4>13. mapMany — transform multiple entities</h4><ex-13 /><hr />

      <h4>14. selectAll — computed signal array</h4><ex-14 /><hr />
      <h4>15. selectEntities — computed id→entity map</h4><ex-15 /><hr />
      <h4>16. selectIds — computed ids array</h4><ex-16 /><hr />
      <h4>17. selectTotal — computed count</h4><ex-17 /><hr />
      <h4>18. selectById — computed lookup</h4><ex-18 /><hr />
      <h4>19. Sorted entities (alphabetically)</h4><ex-19 /><hr />
      <h4>20. Custom selectId (slug)</h4><ex-20 /><hr />
      <h4>21. Entity + loading/error extra state</h4><ex-21 /><hr />
      <h4>22. Entity CRUD signal reducer (full)</h4><ex-22 /><hr />
      <h4>23. Entity pagination (page + pageSize)</h4><ex-23 /><hr />
      <h4>24. Entity HTTP load simulation</h4><ex-24 /><hr />
      <h4>25. Entity error per operation</h4><ex-25 /><hr />
      <h4>26. Multiple entity collections</h4><ex-26 /><hr />

      <h4>27. Posts with Users lookup (join by authorId)</h4><ex-27 /><hr />
      <h4>28. Entity denormalization — computed joined objects</h4><ex-28 /><hr />
      <h4>29. Cross-entity selector (posts by userId)</h4><ex-29 /><hr />
      <h4>30. Filtered entity view (completed todos)</h4><ex-30 /><hr />
      <h4>31. Sorted entity view (by priority)</h4><ex-31 /><hr />
      <h4>32. Optimistic update + rollback on error</h4><ex-32 /><hr />
      <h4>33. Batch operations (select all + bulk delete)</h4><ex-33 /><hr />
      <h4>34. Draft/editing entity state</h4><ex-34 /><hr />
      <h4>35. Soft delete (isDeleted flag filter)</h4><ex-35 /><hr />
      <h4>36. Change tracking (modifiedIds Set)</h4><ex-36 /><hr />
      <h4>37. Entity snapshot for undo</h4><ex-37 /><hr />
      <h4>38. Full entity CRUD signal store</h4><ex-38 /><hr />

      <h4>39. Typed entity with generics: EntityStore&lt;T&gt;</h4><ex-39 /><hr />
      <h4>40. Entity adapter factory</h4><ex-40 /><hr />
      <h4>41. Entity with versioning</h4><ex-41 /><hr />
      <h4>42. Entity with audit trail</h4><ex-42 /><hr />
      <h4>43. Entity normalization from nested API</h4><ex-43 /><hr />
      <h4>44. Entity real-time sync (WebSocket)</h4><ex-44 /><hr />
      <h4>45. Paginated entity with server-side total</h4><ex-45 /><hr />
      <h4>46. Complex selector: posts + authors + comments</h4><ex-46 /><hr />
      <h4>47. One-to-many relations (category → products)</h4><ex-47 /><hr />
      <h4>48. Entity undo/redo stack</h4><ex-48 /><hr />
      <h4>49. Entity migration (v1 → v2)</h4><ex-49 /><hr />
      <h4>50. Full normalized store: users + posts + comments</h4><ex-50 /><hr />
    </div>
  `
})
export class AppComponent {}
