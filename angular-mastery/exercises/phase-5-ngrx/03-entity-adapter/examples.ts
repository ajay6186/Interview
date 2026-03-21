import { Component, signal, computed, inject, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Subject, BehaviorSubject, of } from 'rxjs';
import { delay, map, scan } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';

// ============================================================
// Examples 5.6 — NgRx Entity (simulated with signals) (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── Shared Entity Utilities ────────────────────────────────
interface EntityState<T> { ids: (string | number)[]; entities: Record<string | number, T>; }
function createEntityState<T>(): EntityState<T> { return { ids: [], entities: {} }; }
function addOne<T extends { id: string | number }>(state: EntityState<T>, entity: T): EntityState<T> {
  if (state.ids.includes(entity.id)) return state;
  return { ids: [...state.ids, entity.id], entities: { ...state.entities, [entity.id]: entity } };
}
function addMany<T extends { id: string | number }>(state: EntityState<T>, entities: T[]): EntityState<T> {
  return entities.reduce((s, e) => addOne(s, e), state);
}
function setOne<T extends { id: string | number }>(state: EntityState<T>, entity: T): EntityState<T> {
  const ids = state.ids.includes(entity.id) ? state.ids : [...state.ids, entity.id];
  return { ids, entities: { ...state.entities, [entity.id]: entity } };
}
function setAll<T extends { id: string | number }>(entities: T[]): EntityState<T> {
  return entities.reduce((s, e) => setOne(s, e), createEntityState<T>());
}
function removeOne<T>(state: EntityState<T>, id: string | number): EntityState<T> {
  const { [id]: _, ...rest } = state.entities as any;
  return { ids: state.ids.filter(i => i !== id), entities: rest };
}
function removeMany<T>(state: EntityState<T>, ids: (string | number)[]): EntityState<T> {
  return ids.reduce((s, id) => removeOne(s, id), state);
}
function updateOne<T extends { id: string | number }>(state: EntityState<T>, update: { id: string | number; changes: Partial<T> }): EntityState<T> {
  if (!state.ids.includes(update.id)) return state;
  return { ...state, entities: { ...state.entities, [update.id]: { ...state.entities[update.id], ...update.changes } } };
}
function updateMany<T extends { id: string | number }>(state: EntityState<T>, updates: { id: string | number; changes: Partial<T> }[]): EntityState<T> {
  return updates.reduce((s, u) => updateOne(s, u), state);
}
function upsertOne<T extends { id: string | number }>(state: EntityState<T>, entity: T): EntityState<T> {
  return setOne(state, entity);
}
function upsertMany<T extends { id: string | number }>(state: EntityState<T>, entities: T[]): EntityState<T> {
  return entities.reduce((s, e) => upsertOne(s, e), state);
}
function selectAll<T>(state: EntityState<T>): T[] { return state.ids.map(id => state.entities[id]); }
function selectEntities<T>(state: EntityState<T>): Record<string | number, T> { return state.entities; }
function selectIds<T>(state: EntityState<T>): (string | number)[] { return state.ids; }
function selectTotal<T>(state: EntityState<T>): number { return state.ids.length; }

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. EntityState shape: { ids: [], entities: {} }
@Component({
  selector: 'ex-01', standalone: true, imports: [CommonModule],
  template: `<p>EntityState shape:</p><pre>{{ shape() }}</pre>`
})
class Ex01 {
  shape = signal(JSON.stringify(createEntityState(), null, 2));
}

// 2. createEntityAdapter concept (code display + signal simulation)
@Component({
  selector: 'ex-02', standalone: true,
  template: `
    <p>Adapter API methods:</p>
    <ul>
      <li>addOne, addMany, setOne, setAll</li>
      <li>removeOne, removeMany</li>
      <li>updateOne, updateMany</li>
      <li>upsertOne, upsertMany</li>
      <li>getInitialState, getSelectors</li>
    </ul>
    <p>Initial state: {{ init() }}</p>`
})
class Ex02 {
  init = signal(JSON.stringify(createEntityState()));
}

// 3. getInitialState() equivalent
@Component({
  selector: 'ex-03', standalone: true,
  template: `<p>getInitialState: ids={{ ids() | json }}, total={{ total() }}</p>`
})
class Ex03 {
  private state = signal(createEntityState<{ id: number; name: string }>());
  ids = computed(() => this.state().ids);
  total = computed(() => this.state().ids.length);
}

// 4. addOne() — add single entity to signal store
@Component({
  selector: 'ex-04', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="add()">Add One</button>
    <p>Items: {{ items() | json }}</p>`
})
class Ex04 {
  private state = signal(createEntityState<{ id: number; name: string }>());
  items = computed(() => selectAll(this.state()));
  private count = 1;
  add() { this.state.update(s => addOne(s, { id: this.count, name: `Item ${this.count++}` })); }
}

// 5. addMany() — add multiple entities
@Component({
  selector: 'ex-05', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="addMany()">Add Many</button>
    <p>Items: {{ items() | json }}</p>`
})
class Ex05 {
  private state = signal(createEntityState<{ id: number; name: string }>());
  items = computed(() => selectAll(this.state()));
  addMany() {
    const batch = [{ id: 1, name: 'Alpha' }, { id: 2, name: 'Beta' }, { id: 3, name: 'Gamma' }];
    this.state.update(s => addMany(s, batch));
  }
}

// 6. setOne() — replace single entity
@Component({
  selector: 'ex-06', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="init()">Init</button>
    <button (click)="setOne()">Set One</button>
    <p>{{ items() | json }}</p>`
})
class Ex06 {
  private state = signal(createEntityState<{ id: number; name: string; role?: string }>());
  items = computed(() => selectAll(this.state()));
  init() { this.state.update(s => addMany(s, [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }])); }
  setOne() { this.state.update(s => setOne(s, { id: 1, name: 'Alice Updated', role: 'admin' })); }
}

// 7. setAll() — replace all entities
@Component({
  selector: 'ex-07', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="load()">Load</button>
    <button (click)="replace()">Replace All</button>
    <p>{{ items() | json }}</p>`
})
class Ex07 {
  private state = signal(createEntityState<{ id: number; name: string }>());
  items = computed(() => selectAll(this.state()));
  load() { this.state.update(s => addMany(s, [{ id: 1, name: 'Old A' }, { id: 2, name: 'Old B' }])); }
  replace() { this.state.set(setAll([{ id: 10, name: 'New X' }, { id: 11, name: 'New Y' }])); }
}

// 8. removeOne() — remove by id
@Component({
  selector: 'ex-08', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="init()">Init</button>
    <button (click)="remove(1)">Remove id:1</button>
    <p>{{ items() | json }}</p>`
})
class Ex08 {
  private state = signal(createEntityState<{ id: number; name: string }>());
  items = computed(() => selectAll(this.state()));
  init() { this.state.update(s => addMany(s, [{ id: 1, name: 'A' }, { id: 2, name: 'B' }, { id: 3, name: 'C' }])); }
  remove(id: number) { this.state.update(s => removeOne(s, id)); }
}

// 9. removeMany() — remove by ids array
@Component({
  selector: 'ex-09', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="init()">Init</button>
    <button (click)="removeMany()">Remove [1,3]</button>
    <p>{{ items() | json }}</p>`
})
class Ex09 {
  private state = signal(createEntityState<{ id: number; name: string }>());
  items = computed(() => selectAll(this.state()));
  init() { this.state.update(s => addMany(s, [1, 2, 3, 4].map(id => ({ id, name: `Item ${id}` })))); }
  removeMany() { this.state.update(s => removeMany(s, [1, 3])); }
}

// 10. updateOne() — partial update { id, changes }
@Component({
  selector: 'ex-10', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="init()">Init</button>
    <button (click)="update()">Update id:1</button>
    <p>{{ items() | json }}</p>`
})
class Ex10 {
  private state = signal(createEntityState<{ id: number; name: string; score: number }>());
  items = computed(() => selectAll(this.state()));
  init() { this.state.update(s => addMany(s, [{ id: 1, name: 'Alice', score: 80 }, { id: 2, name: 'Bob', score: 75 }])); }
  update() { this.state.update(s => updateOne(s, { id: 1, changes: { score: 95 } })); }
}

// 11. updateMany() — partial update multiple
@Component({
  selector: 'ex-11', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="init()">Init</button>
    <button (click)="updateAll()">Promote All</button>
    <p>{{ items() | json }}</p>`
})
class Ex11 {
  private state = signal(createEntityState<{ id: number; name: string; level: number }>());
  items = computed(() => selectAll(this.state()));
  init() { this.state.update(s => addMany(s, [1, 2, 3].map(id => ({ id, name: `User ${id}`, level: 1 })))); }
  updateAll() {
    const updates = selectAll(this.state()).map(e => ({ id: e.id, changes: { level: e.level + 1 } }));
    this.state.update(s => updateMany(s, updates));
  }
}

// 12. upsertOne() — add or update
@Component({
  selector: 'ex-12', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="upsert({id:1,name:'Alice',active:true})">Upsert Alice</button>
    <button (click)="upsert({id:1,name:'Alice V2',active:false})">Upsert Alice V2</button>
    <button (click)="upsert({id:2,name:'Bob',active:true})">Upsert Bob (new)</button>
    <p>{{ items() | json }}</p>`
})
class Ex12 {
  private state = signal(createEntityState<{ id: number; name: string; active: boolean }>());
  items = computed(() => selectAll(this.state()));
  upsert(entity: { id: number; name: string; active: boolean }) {
    this.state.update(s => upsertOne(s, entity));
  }
}

// 13. upsertMany() — add or update multiple
@Component({
  selector: 'ex-13', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="first()">First Batch</button>
    <button (click)="second()">Second Batch (overlaps)</button>
    <p>{{ items() | json }}</p>`
})
class Ex13 {
  private state = signal(createEntityState<{ id: number; name: string }>());
  items = computed(() => selectAll(this.state()));
  first() { this.state.update(s => upsertMany(s, [{ id: 1, name: 'A' }, { id: 2, name: 'B' }])); }
  second() { this.state.update(s => upsertMany(s, [{ id: 2, name: 'B Updated' }, { id: 3, name: 'C New' }])); }
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────

// 14. getSelectors() — selectAll equivalent
@Component({
  selector: 'ex-14', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="load()">Load</button>
    <p>All ({{ total() }}): @for (u of all(); track u.id) { {{ u.name }} } </p>`
})
class Ex14 {
  private state = signal(createEntityState<{ id: number; name: string }>());
  all = computed(() => selectAll(this.state()));
  total = computed(() => selectTotal(this.state()));
  load() { this.state.update(s => addMany(s, ['Alice', 'Bob', 'Carol'].map((n, i) => ({ id: i + 1, name: n })))); }
}

// 15. selectEntities equivalent (id→entity map)
@Component({
  selector: 'ex-15', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="load()">Load</button>
    <p>Lookup by id:2: {{ lookup() | json }}</p>`
})
class Ex15 {
  private state = signal(createEntityState<{ id: number; name: string }>());
  lookup = computed(() => selectEntities(this.state())[2] ?? null);
  load() { this.state.update(s => addMany(s, [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }])); }
}

// 16. selectIds equivalent
@Component({
  selector: 'ex-16', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="load()">Load</button>
    <p>IDs: {{ ids() | json }}</p>`
})
class Ex16 {
  private state = signal(createEntityState<{ id: number; name: string }>());
  ids = computed(() => selectIds(this.state()));
  load() { this.state.update(s => addMany(s, [10, 20, 30].map(id => ({ id, name: `User ${id}` })))); }
}

// 17. selectTotal equivalent
@Component({
  selector: 'ex-17', standalone: true,
  template: `<button (click)="add()">Add</button><button (click)="rm()">Remove</button><p>Total: {{ total() }}</p>`
})
class Ex17 {
  private state = signal(createEntityState<{ id: number; name: string }>());
  total = computed(() => selectTotal(this.state()));
  private count = 1;
  add() { this.state.update(s => addOne(s, { id: this.count, name: `Item ${this.count++}` })); }
  rm() { const ids = this.state().ids; if (ids.length) this.state.update(s => removeOne(s, ids[0])); }
}

// 18. selectById pattern (lookup by id)
@Component({
  selector: 'ex-18', standalone: true, imports: [CommonModule, FormsModule],
  template: `
    <button (click)="load()">Load</button>
    <input type="number" [(ngModel)]="searchId" placeholder="ID" />
    <p>Found: {{ found() | json }}</p>`
})
class Ex18 {
  searchId = 1;
  private state = signal(createEntityState<{ id: number; name: string; email: string }>());
  found = computed(() => selectEntities(this.state())[this.searchId] ?? null);
  load() {
    this.state.update(s => addMany(s, [
      { id: 1, name: 'Alice', email: 'alice@ex.com' },
      { id: 2, name: 'Bob', email: 'bob@ex.com' },
      { id: 3, name: 'Carol', email: 'carol@ex.com' }
    ]));
  }
}

// 19. Sorted entity adapter (sortComparer)
@Component({
  selector: 'ex-19', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="load()">Load Unsorted</button>
    <p>Sorted by name: @for (u of sorted(); track u.id) { {{ u.name }} } </p>`
})
class Ex19 {
  private state = signal(createEntityState<{ id: number; name: string }>());
  sorted = computed(() => [...selectAll(this.state())].sort((a, b) => a.name.localeCompare(b.name)));
  load() {
    this.state.update(s => addMany(s, [
      { id: 3, name: 'Charlie' }, { id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }
    ]));
  }
}

// 20. Custom selectId (string id field)
interface Product20 { sku: string; name: string; price: number; }
function addProduct(state: EntityState<Product20>, p: Product20): EntityState<Product20> {
  if (state.ids.includes(p.sku)) return state;
  return { ids: [...state.ids, p.sku], entities: { ...state.entities, [p.sku]: p } };
}
@Component({
  selector: 'ex-20', standalone: true, imports: [CommonModule],
  template: `<button (click)="load()">Load Products</button><p>{{ products() | json }}</p>`
})
class Ex20 {
  private state = signal(createEntityState<Product20>());
  products = computed(() => selectAll(this.state()));
  load() {
    this.state.set(createEntityState<Product20>());
    [{ sku: 'ABC-1', name: 'Widget', price: 9.99 }, { sku: 'DEF-2', name: 'Gadget', price: 24.99 }]
      .forEach(p => this.state.update(s => addProduct(s, p)));
  }
}

// 21. Entity + loading/error extra state
interface EntityPlusExtra<T> extends EntityState<T> { loading: boolean; error: string | null; }
@Component({
  selector: 'ex-21', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="load()">Load with Extra State</button>
    @if (store().loading) { <p>Loading...</p> }
    @if (store().error) { <p style="color:red">{{ store().error }}</p> }
    @if (!store().loading) { <ul>@for (u of items(); track u.id) { <li>{{ u.name }}</li> }</ul> }`
})
class Ex21 implements OnInit {
  private store = signal<EntityPlusExtra<{ id: number; name: string }>>({ ...createEntityState(), loading: false, error: null });
  items = computed(() => selectAll(this.store()));
  private destroyRef = inject(DestroyRef);
  ngOnInit() {}
  load() {
    this.store.update(s => ({ ...s, loading: true, error: null }));
    of([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]).pipe(
      delay(500), takeUntilDestroyed(this.destroyRef)
    ).subscribe(users => {
      this.store.update(s => ({ ...addMany(s, users), loading: false, error: null }));
    });
  }
}

// 22. Entity CRUD signal reducer pattern
type CrudAction<T extends { id: string | number }> =
  | { type: 'ADD'; payload: T }
  | { type: 'UPDATE'; id: string | number; changes: Partial<T> }
  | { type: 'REMOVE'; id: string | number }
  | { type: 'CLEAR' };
@Component({
  selector: 'ex-22', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="dispatch({type:'ADD',payload:{id:count,name:'User '+count++}})">Add</button>
    <button (click)="dispatch({type:'REMOVE',id:1})">Remove id:1</button>
    <button (click)="dispatch({type:'CLEAR'})">Clear</button>
    <p>{{ items() | json }}</p>`
})
class Ex22 {
  count = 1;
  private action$ = new Subject<CrudAction<{ id: number; name: string }>>();
  private entityState = toSignal(
    this.action$.pipe(
      scan((state: EntityState<{ id: number; name: string }>, action) => {
        if (action.type === 'ADD') return addOne(state, action.payload);
        if (action.type === 'UPDATE') return updateOne(state, { id: action.id, changes: action.changes });
        if (action.type === 'REMOVE') return removeOne(state, action.id);
        if (action.type === 'CLEAR') return createEntityState();
        return state;
      }, createEntityState<{ id: number; name: string }>())
    ), { initialValue: createEntityState<{ id: number; name: string }>() }
  );
  items = computed(() => selectAll(this.entityState()));
  dispatch(a: CrudAction<{ id: number; name: string }>) { this.action$.next(a); }
}

// 23. Entity pagination signal store
@Component({
  selector: 'ex-23', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="load()">Load 20 items</button>
    <button (click)="prev()">Prev</button>
    <button (click)="next()">Next</button>
    <p>Page {{ page() }} of {{ totalPages() }}</p>
    <ul>@for (item of pageItems(); track item.id) { <li>{{ item.name }}</li> }</ul>`
})
class Ex23 {
  private state = signal(createEntityState<{ id: number; name: string }>());
  page = signal(1);
  pageSize = 5;
  all = computed(() => selectAll(this.state()));
  totalPages = computed(() => Math.ceil(this.all().length / this.pageSize));
  pageItems = computed(() => this.all().slice((this.page() - 1) * this.pageSize, this.page() * this.pageSize));
  load() { this.state.set(setAll(Array.from({ length: 20 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` })))); }
  prev() { this.page.update(p => Math.max(1, p - 1)); }
  next() { this.page.update(p => Math.min(this.totalPages(), p + 1)); }
}

// 24. Entity with HTTP load pattern
@Component({
  selector: 'ex-24', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="load()">HTTP Load</button>
    @if (loading()) { <p>Loading...</p> }
    <ul>@for (u of users(); track u.id) { <li>{{ u.name }} — {{ u.email }}</li> }</ul>`
})
class Ex24 implements OnInit {
  private state = signal(createEntityState<{ id: number; name: string; email: string }>());
  loading = signal(false);
  users = computed(() => selectAll(this.state()));
  private destroyRef = inject(DestroyRef);
  ngOnInit() {}
  load() {
    this.loading.set(true);
    of([
      { id: 1, name: 'Alice', email: 'a@ex.com' },
      { id: 2, name: 'Bob', email: 'b@ex.com' }
    ]).pipe(delay(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(data => { this.state.set(setAll(data)); this.loading.set(false); });
  }
}

// 25. Entity error state per operation
@Component({
  selector: 'ex-25', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="tryAdd()">Try Add (may fail)</button>
    @if (opError()) { <p style="color:red">{{ opError() }}</p> }
    <p>{{ items() | json }}</p>`
})
class Ex25 {
  private state = signal(createEntityState<{ id: number; name: string }>());
  opError = signal('');
  items = computed(() => selectAll(this.state()));
  private count = 1;
  tryAdd() {
    this.opError.set('');
    if (this.count > 3) { this.opError.set('Max 3 items allowed'); return; }
    this.state.update(s => addOne(s, { id: this.count, name: `Item ${this.count++}` }));
  }
}

// 26. Multiple entity types in same store
interface MultiStore { users: EntityState<{ id: number; name: string }>; products: EntityState<{ id: number; title: string }>; }
@Component({
  selector: 'ex-26', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="addUser()">Add User</button>
    <button (click)="addProduct()">Add Product</button>
    <p>Users: {{ users() | json }}</p>
    <p>Products: {{ products() | json }}</p>`
})
class Ex26 {
  private store = signal<MultiStore>({
    users: createEntityState(),
    products: createEntityState()
  });
  users = computed(() => selectAll(this.store().users));
  products = computed(() => selectAll(this.store().products));
  private uc = 1; private pc = 1;
  addUser() { this.store.update(s => ({ ...s, users: addOne(s.users, { id: this.uc, name: `User ${this.uc++}` }) })); }
  addProduct() { this.store.update(s => ({ ...s, products: addOne(s.products, { id: this.pc, title: `Product ${this.pc++}` }) })); }
}

// ─── NESTED (27–38) ──────────────────────────────────────────

// 27. Entity with relationships (posts + users lookup)
@Component({
  selector: 'ex-27', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="load()">Load</button>
    <ul>@for (p of postsWithAuthor(); track p.id) { <li>{{ p.title }} by {{ p.authorName }}</li> }</ul>`
})
class Ex27 {
  private users = signal(createEntityState<{ id: number; name: string }>());
  private posts = signal(createEntityState<{ id: number; title: string; authorId: number }>());
  postsWithAuthor = computed(() =>
    selectAll(this.posts()).map(p => ({
      ...p,
      authorName: selectEntities(this.users())[p.authorId]?.name ?? 'Unknown'
    }))
  );
  load() {
    this.users.set(setAll([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]));
    this.posts.set(setAll([{ id: 1, title: 'Hello World', authorId: 1 }, { id: 2, title: 'RxJS Tips', authorId: 2 }]));
  }
}

// 28. Entity denormalization (join users into posts)
interface DenormalizedPost { id: number; title: string; author: { id: number; name: string } | null; }
@Component({
  selector: 'ex-28', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="load()">Load & Denormalize</button>
    <ul>@for (p of denorm(); track p.id) { <li>{{ p.title }} — {{ p.author?.name }}</li> }</ul>`
})
class Ex28 {
  private users = signal(createEntityState<{ id: number; name: string }>());
  private posts = signal(createEntityState<{ id: number; title: string; authorId: number }>());
  denorm = computed<DenormalizedPost[]>(() =>
    selectAll(this.posts()).map(p => ({
      id: p.id, title: p.title,
      author: selectEntities(this.users())[p.authorId] ?? null
    }))
  );
  load() {
    this.users.set(setAll([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]));
    this.posts.set(setAll([{ id: 1, title: 'Angular Signals', authorId: 1 }, { id: 2, title: 'NgRx Guide', authorId: 2 }]));
  }
}

// 29. Cross-entity computed selector
@Component({
  selector: 'ex-29', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="load()">Load</button>
    <p>Stats: {{ stats() | json }}</p>`
})
class Ex29 {
  private users = signal(createEntityState<{ id: number; active: boolean }>());
  private posts = signal(createEntityState<{ id: number; authorId: number }>());
  stats = computed(() => ({
    totalUsers: selectTotal(this.users()),
    activeUsers: selectAll(this.users()).filter(u => u.active).length,
    totalPosts: selectTotal(this.posts()),
    avgPostsPerUser: selectTotal(this.users()) ? selectTotal(this.posts()) / selectTotal(this.users()) : 0
  }));
  load() {
    this.users.set(setAll([{ id: 1, active: true }, { id: 2, active: false }, { id: 3, active: true }]));
    this.posts.set(setAll([{ id: 1, authorId: 1 }, { id: 2, authorId: 1 }, { id: 3, authorId: 3 }]));
  }
}

// 30. Entity with filtered view (computed)
@Component({
  selector: 'ex-30', standalone: true, imports: [CommonModule, FormsModule],
  template: `
    <button (click)="load()">Load</button>
    <input [(ngModel)]="filterText" placeholder="Filter by name..." />
    <p>Filtered ({{ filtered().length }}): @for (u of filtered(); track u.id) { {{ u.name }} } </p>`
})
class Ex30 {
  private state = signal(createEntityState<{ id: number; name: string; role: string }>());
  filterText = '';
  filtered = computed(() =>
    selectAll(this.state()).filter(u => u.name.toLowerCase().includes(this.filterText.toLowerCase()))
  );
  load() {
    this.state.set(setAll([
      { id: 1, name: 'Alice', role: 'admin' },
      { id: 2, name: 'Bob', role: 'user' },
      { id: 3, name: 'Carol', role: 'admin' },
      { id: 4, name: 'Dave', role: 'user' }
    ]));
  }
}

// 31. Entity with sorted view (computed)
@Component({
  selector: 'ex-31', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="load()">Load</button>
    <button (click)="toggleSort()">Sort: {{ sortDir() }}</button>
    <ul>@for (u of sorted(); track u.id) { <li>{{ u.name }}: {{ u.score }}</li> }</ul>`
})
class Ex31 {
  private state = signal(createEntityState<{ id: number; name: string; score: number }>());
  sortDir = signal<'asc' | 'desc'>('asc');
  sorted = computed(() => {
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    return [...selectAll(this.state())].sort((a, b) => dir * (a.score - b.score));
  });
  load() {
    this.state.set(setAll([
      { id: 1, name: 'Alice', score: 88 },
      { id: 2, name: 'Bob', score: 72 },
      { id: 3, name: 'Carol', score: 95 }
    ]));
  }
  toggleSort() { this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc'); }
}

// 32. Entity optimistic update + rollback
@Component({
  selector: 'ex-32', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="load()">Load</button>
    <button (click)="optimisticUpdate()">Optimistic Update id:1</button>
    <p>{{ items() | json }}</p>`
})
class Ex32 implements OnInit {
  private state = signal(createEntityState<{ id: number; name: string; score: number }>());
  items = computed(() => selectAll(this.state()));
  private destroyRef = inject(DestroyRef);
  ngOnInit() {}
  load() { this.state.set(setAll([{ id: 1, name: 'Alice', score: 80 }, { id: 2, name: 'Bob', score: 75 }])); }
  optimisticUpdate() {
    const snapshot = this.state();
    this.state.update(s => updateOne(s, { id: 1, changes: { score: 99 } }));
    of(null).pipe(delay(300), map(() => { throw new Error('save failed'); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => { this.state.set(snapshot); } });
  }
}

// 33. Entity batch operations
@Component({
  selector: 'ex-33', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="load()">Load</button>
    <button (click)="batch()">Batch: Add + Update + Remove</button>
    <p>{{ items() | json }}</p>`
})
class Ex33 {
  private state = signal(createEntityState<{ id: number; name: string; active: boolean }>());
  items = computed(() => selectAll(this.state()));
  load() { this.state.set(setAll([{ id: 1, name: 'A', active: true }, { id: 2, name: 'B', active: true }])); }
  batch() {
    this.state.update(s => {
      let ns = addOne(s, { id: 3, name: 'C', active: true });
      ns = updateOne(ns, { id: 1, changes: { name: 'A Updated', active: false } });
      ns = removeOne(ns, 2);
      return ns;
    });
  }
}

// 34. Entity with draft/editing state
@Component({
  selector: 'ex-34', standalone: true, imports: [CommonModule, FormsModule],
  template: `
    <button (click)="load()">Load</button>
    <ul>@for (u of items(); track u.id) {
      <li>{{ u.name }}
        @if (editingId() === u.id) {
          <input [(ngModel)]="editName" /><button (click)="save(u.id)">Save</button>
        } @else {
          <button (click)="edit(u.id, u.name)">Edit</button>
        }
      </li>
    }</ul>`
})
class Ex34 {
  private state = signal(createEntityState<{ id: number; name: string }>());
  items = computed(() => selectAll(this.state()));
  editingId = signal<number | null>(null);
  editName = '';
  load() { this.state.set(setAll([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }])); }
  edit(id: number, name: string) { this.editingId.set(id); this.editName = name; }
  save(id: number) { this.state.update(s => updateOne(s, { id, changes: { name: this.editName } })); this.editingId.set(null); }
}

// 35. Entity with soft delete (isDeleted flag)
@Component({
  selector: 'ex-35', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="load()">Load</button>
    <button (click)="softDelete(1)">Soft Delete id:1</button>
    <button (click)="showAll.set(!showAll())">Toggle Show Deleted</button>
    <ul>@for (u of visible(); track u.id) { <li [style.opacity]="u.deleted ? '0.4' : '1'">{{ u.name }}{{ u.deleted ? ' (deleted)' : '' }}</li> }</ul>`
})
class Ex35 {
  private state = signal(createEntityState<{ id: number; name: string; deleted: boolean }>());
  showAll = signal(false);
  visible = computed(() => {
    const all = selectAll(this.state());
    return this.showAll() ? all : all.filter(u => !u.deleted);
  });
  load() { this.state.set(setAll([{ id: 1, name: 'Alice', deleted: false }, { id: 2, name: 'Bob', deleted: false }])); }
  softDelete(id: number) { this.state.update(s => updateOne(s, { id, changes: { deleted: true } })); }
}

// 36. Entity change tracking (modified set)
@Component({
  selector: 'ex-36', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="load()">Load</button>
    <button (click)="modify(1)">Modify id:1</button>
    <button (click)="modify(2)">Modify id:2</button>
    <p>Modified: {{ modified() | json }}</p>
    <p>Items: {{ items() | json }}</p>`
})
class Ex36 {
  private state = signal(createEntityState<{ id: number; name: string; version: number }>());
  modified = signal<number[]>([]);
  items = computed(() => selectAll(this.state()));
  load() { this.state.set(setAll([{ id: 1, name: 'A', version: 1 }, { id: 2, name: 'B', version: 1 }])); }
  modify(id: number) {
    const entity = selectEntities(this.state())[id];
    if (entity) {
      this.state.update(s => updateOne(s, { id, changes: { version: entity.version + 1 } }));
      this.modified.update(ids => ids.includes(id) ? ids : [...ids, id]);
    }
  }
}

// 37. Entity snapshot for undo
@Component({
  selector: 'ex-37', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="load()">Load</button>
    <button (click)="modify()">Modify</button>
    <button (click)="undo()">Undo</button>
    <p>{{ items() | json }}</p>`
})
class Ex37 {
  private state = signal(createEntityState<{ id: number; name: string }>());
  private snapshots: EntityState<{ id: number; name: string }>[] = [];
  items = computed(() => selectAll(this.state()));
  load() { this.state.set(setAll([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }])); }
  modify() {
    this.snapshots.push(this.state());
    this.state.update(s => updateMany(s, [{ id: 1, changes: { name: 'Alice Modified' } }, { id: 2, changes: { name: 'Bob Modified' } }]));
  }
  undo() { const snap = this.snapshots.pop(); if (snap) this.state.set(snap); }
}

// 38. Full entity CRUD signal store with all operations
@Component({
  selector: 'ex-38', standalone: true, imports: [CommonModule, FormsModule],
  template: `
    <input [(ngModel)]="newName" placeholder="Name" />
    <button (click)="add()">Add</button>
    <button (click)="loadAll()">Load Sample</button>
    <button (click)="clearAll()">Clear All</button>
    <ul>@for (u of items(); track u.id) {
      <li>{{ u.name }}
        <button (click)="promote(u.id)">+Level</button>
        <button (click)="remove(u.id)">X</button>
      </li>
    }</ul>
    <p>Total: {{ total() }}</p>`
})
class Ex38 {
  private state = signal(createEntityState<{ id: number; name: string; level: number }>());
  newName = '';
  private nextId = 1;
  items = computed(() => selectAll(this.state()));
  total = computed(() => selectTotal(this.state()));
  add() {
    if (this.newName.trim()) {
      this.state.update(s => addOne(s, { id: this.nextId++, name: this.newName.trim(), level: 1 }));
      this.newName = '';
    }
  }
  loadAll() { this.state.set(setAll(['Alice', 'Bob', 'Carol'].map((n, i) => ({ id: i + 1, name: n, level: 1 })))); this.nextId = 4; }
  remove(id: number) { this.state.update(s => removeOne(s, id)); }
  promote(id: number) { const e = selectEntities(this.state())[id]; if (e) this.state.update(s => updateOne(s, { id, changes: { level: e.level + 1 } })); }
  clearAll() { this.state.set(createEntityState()); }
}

// ─── ADVANCED (39–50) ────────────────────────────────────────

// 39. Typed entity state with generics
function createTypedStore<T extends { id: string | number }>() {
  const state = signal(createEntityState<T>());
  return {
    state,
    all: computed(() => selectAll(state())),
    total: computed(() => selectTotal(state())),
    add: (entity: T) => state.update(s => addOne(s, entity)),
    remove: (id: string | number) => state.update(s => removeOne(s, id)),
    update: (id: string | number, changes: Partial<T>) => state.update(s => updateOne(s, { id, changes })),
    clear: () => state.set(createEntityState<T>())
  };
}
@Component({
  selector: 'ex-39', standalone: true, imports: [CommonModule],
  template: `<button (click)="load()">Load</button><p>{{ store.all() | json }}</p>`
})
class Ex39 {
  store = createTypedStore<{ id: number; name: string; role: string }>();
  load() { ['Alice', 'Bob', 'Carol'].forEach((n, i) => this.store.add({ id: i + 1, name: n, role: i === 0 ? 'admin' : 'user' })); }
}

// 40. Entity adapter factory (reusable for any type)
function entityAdapterFactory<T extends { id: string | number }>() {
  return {
    getInitialState: (): EntityState<T> => createEntityState<T>(),
    addOne: (s: EntityState<T>, e: T) => addOne(s, e),
    addMany: (s: EntityState<T>, es: T[]) => addMany(s, es),
    removeOne: (s: EntityState<T>, id: string | number) => removeOne(s, id),
    updateOne: (s: EntityState<T>, u: { id: string | number; changes: Partial<T> }) => updateOne(s, u),
    selectAll: (s: EntityState<T>) => selectAll(s),
    selectTotal: (s: EntityState<T>) => selectTotal(s)
  };
}
@Component({
  selector: 'ex-40', standalone: true, imports: [CommonModule],
  template: `<button (click)="run()">Run Factory</button><p>{{ items() | json }}</p>`
})
class Ex40 {
  private adapter = entityAdapterFactory<{ id: number; label: string }>();
  private state = signal(this.adapter.getInitialState());
  items = computed(() => this.adapter.selectAll(this.state()));
  run() {
    this.state.update(s => this.adapter.addMany(s, [{ id: 1, label: 'First' }, { id: 2, label: 'Second' }]));
  }
}

// 41. Entity with versioning (version counter)
@Component({
  selector: 'ex-41', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="load()">Load</button>
    <button (click)="update(1, 'Alice V2')">Update Alice</button>
    <p>{{ items() | json }}</p>`
})
class Ex41 {
  private state = signal(createEntityState<{ id: number; name: string; version: number; updatedAt: string }>());
  items = computed(() => selectAll(this.state()));
  load() { this.state.set(setAll([{ id: 1, name: 'Alice', version: 1, updatedAt: new Date().toISOString() }])); }
  update(id: number, name: string) {
    const e = selectEntities(this.state())[id];
    if (e) this.state.update(s => updateOne(s, { id, changes: { name, version: e.version + 1, updatedAt: new Date().toISOString() } }));
  }
}

// 42. Entity with audit trail (createdAt, updatedAt)
interface AuditEntity { id: number; name: string; createdAt: string; updatedAt: string; }
@Component({
  selector: 'ex-42', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="add('Item')">Add</button>
    <button (click)="update(1)">Update id:1</button>
    <ul>@for (e of items(); track e.id) { <li>{{ e.name }} created:{{ e.createdAt.slice(11,19) }} updated:{{ e.updatedAt.slice(11,19) }}</li> }</ul>`
})
class Ex42 {
  private state = signal(createEntityState<AuditEntity>());
  private count = 1;
  items = computed(() => selectAll(this.state()));
  add(name: string) {
    const now = new Date().toISOString();
    this.state.update(s => addOne(s, { id: this.count++, name: `${name} ${this.count}`, createdAt: now, updatedAt: now }));
  }
  update(id: number) {
    const e = selectEntities(this.state())[id];
    if (e) this.state.update(s => updateOne(s, { id, changes: { name: e.name + ' (edited)', updatedAt: new Date().toISOString() } }));
  }
}

// 43. Entity normalization from API response
interface ApiResponse43 { users: { id: number; name: string }[]; meta: { total: number } }
@Component({
  selector: 'ex-43', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="fetch()">Fetch & Normalize</button>
    @if (loading()) { <p>Loading...</p> }
    <p>Total from API: {{ meta().total }} | Normalized: {{ total() }}</p>
    <p>{{ items() | json }}</p>`
})
class Ex43 implements OnInit {
  private state = signal(createEntityState<{ id: number; name: string }>());
  loading = signal(false);
  meta = signal({ total: 0 });
  items = computed(() => selectAll(this.state()));
  total = computed(() => selectTotal(this.state()));
  private destroyRef = inject(DestroyRef);
  ngOnInit() {}
  fetch() {
    this.loading.set(true);
    of<ApiResponse43>({ users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }], meta: { total: 2 } })
      .pipe(delay(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(res => { this.state.set(setAll(res.users)); this.meta.set(res.meta); this.loading.set(false); });
  }
}

// 44. Entity with real-time WebSocket sync
@Component({
  selector: 'ex-44', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="connect()">Connect WS</button>
    <button (click)="simulate()">Simulate Update</button>
    <p>Status: {{ status() }}</p>
    <ul>@for (e of items(); track e.id) { <li>{{ e.name }}: {{ e.value }}</li> }</ul>`
})
class Ex44 {
  private ws$ = new Subject<{ type: string; payload: any }>();
  private state = signal(createEntityState<{ id: number; name: string; value: number }>());
  status = signal('disconnected');
  items = computed(() => selectAll(this.state()));
  private destroyRef = inject(DestroyRef);
  connect() {
    this.status.set('connected');
    this.state.set(setAll([{ id: 1, name: 'Sensor A', value: 0 }, { id: 2, name: 'Sensor B', value: 0 }]));
    this.ws$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(msg => {
      if (msg.type === 'UPDATE') this.state.update(s => updateOne(s, { id: msg.payload.id, changes: { value: msg.payload.value } }));
    });
  }
  simulate() { this.ws$.next({ type: 'UPDATE', payload: { id: Math.ceil(Math.random() * 2), value: Math.floor(Math.random() * 100) } }); }
}

// 45. Entity pagination with total count
@Component({
  selector: 'ex-45', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="load()">Load 50 items</button>
    <button (click)="prev()">Prev</button> Page {{ page() }}/{{ totalPages() }} <button (click)="next()">Next</button>
    <ul>@for (item of pageItems(); track item.id) { <li>{{ item.id }}: {{ item.name }}</li> }</ul>`
})
class Ex45 {
  private state = signal(createEntityState<{ id: number; name: string }>());
  page = signal(1);
  pageSize = 10;
  all = computed(() => selectAll(this.state()));
  totalPages = computed(() => Math.max(1, Math.ceil(this.all().length / this.pageSize)));
  pageItems = computed(() => this.all().slice((this.page() - 1) * this.pageSize, this.page() * this.pageSize));
  load() { this.state.set(setAll(Array.from({ length: 50 }, (_, i) => ({ id: i + 1, name: `Record ${i + 1}` })))); this.page.set(1); }
  prev() { this.page.update(p => Math.max(1, p - 1)); }
  next() { this.page.update(p => Math.min(this.totalPages(), p + 1)); }
}

// 46. Entity with complex selector graph
@Component({
  selector: 'ex-46', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="load()">Load</button>
    <p>Active admins: {{ activeAdmins() | json }}</p>
    <p>Top scorers (>80): {{ topScorers() | json }}</p>`
})
class Ex46 {
  private state = signal(createEntityState<{ id: number; name: string; role: string; score: number; active: boolean }>());
  activeAdmins = computed(() => selectAll(this.state()).filter(u => u.active && u.role === 'admin').map(u => u.name));
  topScorers = computed(() => selectAll(this.state()).filter(u => u.score > 80).sort((a, b) => b.score - a.score).map(u => ({ name: u.name, score: u.score })));
  load() {
    this.state.set(setAll([
      { id: 1, name: 'Alice', role: 'admin', score: 95, active: true },
      { id: 2, name: 'Bob', role: 'user', score: 72, active: true },
      { id: 3, name: 'Carol', role: 'admin', score: 88, active: false },
      { id: 4, name: 'Dave', role: 'user', score: 91, active: true }
    ]));
  }
}

// 47. Entity relations (one-to-many)
@Component({
  selector: 'ex-47', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="load()">Load</button>
    <ul>@for (u of usersWithPosts(); track u.id) {
      <li>{{ u.name }}: @for (p of u.posts; track p.id) { [{{ p.title }}] }</li>
    }</ul>`
})
class Ex47 {
  private users = signal(createEntityState<{ id: number; name: string }>());
  private posts = signal(createEntityState<{ id: number; title: string; userId: number }>());
  usersWithPosts = computed(() =>
    selectAll(this.users()).map(u => ({
      ...u,
      posts: selectAll(this.posts()).filter(p => p.userId === u.id)
    }))
  );
  load() {
    this.users.set(setAll([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]));
    this.posts.set(setAll([
      { id: 1, title: 'Post A1', userId: 1 }, { id: 2, title: 'Post A2', userId: 1 },
      { id: 3, title: 'Post B1', userId: 2 }
    ]));
  }
}

// 48. Entity with undo/redo stack
@Component({
  selector: 'ex-48', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="load()">Load</button>
    <button (click)="modify()">Modify</button>
    <button (click)="undo()" [disabled]="past().length === 0">Undo ({{ past().length }})</button>
    <button (click)="redo()" [disabled]="future().length === 0">Redo ({{ future().length }})</button>
    <p>{{ items() | json }}</p>`
})
class Ex48 {
  private state = signal(createEntityState<{ id: number; name: string }>());
  past = signal<EntityState<{ id: number; name: string }>[]>([]);
  future = signal<EntityState<{ id: number; name: string }>[]>([]);
  items = computed(() => selectAll(this.state()));
  load() { this.state.set(setAll([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }])); }
  modify() {
    this.past.update(p => [...p, this.state()]); this.future.set([]);
    this.state.update(s => updateOne(s, { id: 1, changes: { name: `Alice v${this.past().length + 1}` } }));
  }
  undo() {
    const prev = this.past(); if (!prev.length) return;
    this.future.update(f => [this.state(), ...f]);
    this.state.set(prev[prev.length - 1]);
    this.past.update(p => p.slice(0, -1));
  }
  redo() {
    const fut = this.future(); if (!fut.length) return;
    this.past.update(p => [...p, this.state()]);
    this.state.set(fut[0]);
    this.future.update(f => f.slice(1));
  }
}

// 49. Entity migration pattern
@Component({
  selector: 'ex-49', standalone: true, imports: [CommonModule],
  template: `<button (click)="migrate()">Migrate v1 → v2</button><p>{{ items() | json }}</p>`
})
class Ex49 {
  private state = signal(createEntityState<{ id: number; name: string; fullName?: string; version: number }>());
  items = computed(() => selectAll(this.state()));
  migrate() {
    // v1 entities have 'name', v2 has 'fullName' as well
    const v1Data = [{ id: 1, name: 'alice smith', version: 1 }, { id: 2, name: 'bob jones', version: 1 }];
    const migrated = v1Data.map(e => ({
      ...e,
      fullName: e.name.replace(/\b\w/g, c => c.toUpperCase()),
      version: 2
    }));
    this.state.set(setAll(migrated));
  }
}

// 50. Full normalized entity store: users + posts + comments (all linked)
@Component({
  selector: 'ex-50', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="load()">Load All</button>
    @if (loading()) { <p>Loading normalized store...</p> }
    @if (!loading() && users().length) {
      @for (u of users(); track u.id) {
        <div style="border:1px solid #ccc;margin:4px;padding:4px">
          <strong>{{ u.name }}</strong>
          @for (p of postsForUser(u.id); track p.id) {
            <div style="margin-left:12px">
              — {{ p.title }}
              @for (c of commentsForPost(p.id); track c.id) {
                <div style="margin-left:12px;color:#666">• {{ c.text }}</div>
              }
            </div>
          }
        </div>
      }
    }`
})
class Ex50 implements OnInit {
  private userState = signal(createEntityState<{ id: number; name: string }>());
  private postState = signal(createEntityState<{ id: number; title: string; userId: number }>());
  private commentState = signal(createEntityState<{ id: number; text: string; postId: number }>());
  loading = signal(false);
  users = computed(() => selectAll(this.userState()));
  private destroyRef = inject(DestroyRef);
  ngOnInit() {}
  postsForUser(uid: number) { return selectAll(this.postState()).filter(p => p.userId === uid); }
  commentsForPost(pid: number) { return selectAll(this.commentState()).filter(c => c.postId === pid); }
  load() {
    this.loading.set(true);
    forkJoin({
      users: of([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]).pipe(delay(100)),
      posts: of([{ id: 1, title: 'Alice Post', userId: 1 }, { id: 2, title: 'Bob Post', userId: 2 }]).pipe(delay(150)),
      comments: of([{ id: 1, text: 'Great!', postId: 1 }, { id: 2, text: 'Thanks', postId: 1 }, { id: 3, text: 'Nice post', postId: 2 }]).pipe(delay(80))
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ users, posts, comments }) => {
      this.userState.set(setAll(users));
      this.postState.set(setAll(posts));
      this.commentState.set(setAll(comments));
      this.loading.set(false);
    });
  }
}

import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-root', standalone: true,
  imports: [
    CommonModule,
    Ex01, Ex02, Ex03, Ex04, Ex05, Ex06, Ex07, Ex08, Ex09, Ex10,
    Ex11, Ex12, Ex13, Ex14, Ex15, Ex16, Ex17, Ex18, Ex19, Ex20,
    Ex21, Ex22, Ex23, Ex24, Ex25, Ex26, Ex27, Ex28, Ex29, Ex30,
    Ex31, Ex32, Ex33, Ex34, Ex35, Ex36, Ex37, Ex38, Ex39, Ex40,
    Ex41, Ex42, Ex43, Ex44, Ex45, Ex46, Ex47, Ex48, Ex49, Ex50
  ],
  template: `
    <div style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:20px">
      <h1>Examples 5.6 — NgRx Entity (simulated with signals)</h1>
      <h4>1. EntityState shape</h4><ex-01 /><hr />
      <h4>2. createEntityAdapter concept</h4><ex-02 /><hr />
      <h4>3. getInitialState() equivalent</h4><ex-03 /><hr />
      <h4>4. addOne()</h4><ex-04 /><hr />
      <h4>5. addMany()</h4><ex-05 /><hr />
      <h4>6. setOne()</h4><ex-06 /><hr />
      <h4>7. setAll()</h4><ex-07 /><hr />
      <h4>8. removeOne()</h4><ex-08 /><hr />
      <h4>9. removeMany()</h4><ex-09 /><hr />
      <h4>10. updateOne()</h4><ex-10 /><hr />
      <h4>11. updateMany()</h4><ex-11 /><hr />
      <h4>12. upsertOne()</h4><ex-12 /><hr />
      <h4>13. upsertMany()</h4><ex-13 /><hr />
      <h4>14. getSelectors() — selectAll equivalent</h4><ex-14 /><hr />
      <h4>15. selectEntities equivalent</h4><ex-15 /><hr />
      <h4>16. selectIds equivalent</h4><ex-16 /><hr />
      <h4>17. selectTotal equivalent</h4><ex-17 /><hr />
      <h4>18. selectById pattern</h4><ex-18 /><hr />
      <h4>19. Sorted entity adapter (sortComparer)</h4><ex-19 /><hr />
      <h4>20. Custom selectId (string id field)</h4><ex-20 /><hr />
      <h4>21. Entity + loading/error extra state</h4><ex-21 /><hr />
      <h4>22. Entity CRUD signal reducer pattern</h4><ex-22 /><hr />
      <h4>23. Entity pagination signal store</h4><ex-23 /><hr />
      <h4>24. Entity with HTTP load pattern</h4><ex-24 /><hr />
      <h4>25. Entity error state per operation</h4><ex-25 /><hr />
      <h4>26. Multiple entity types in same store</h4><ex-26 /><hr />
      <h4>27. Entity with relationships (posts + users lookup)</h4><ex-27 /><hr />
      <h4>28. Entity denormalization</h4><ex-28 /><hr />
      <h4>29. Cross-entity computed selector</h4><ex-29 /><hr />
      <h4>30. Entity with filtered view (computed)</h4><ex-30 /><hr />
      <h4>31. Entity with sorted view (computed)</h4><ex-31 /><hr />
      <h4>32. Entity optimistic update + rollback</h4><ex-32 /><hr />
      <h4>33. Entity batch operations</h4><ex-33 /><hr />
      <h4>34. Entity with draft/editing state</h4><ex-34 /><hr />
      <h4>35. Entity with soft delete</h4><ex-35 /><hr />
      <h4>36. Entity change tracking (modified set)</h4><ex-36 /><hr />
      <h4>37. Entity snapshot for undo</h4><ex-37 /><hr />
      <h4>38. Full entity CRUD signal store with all operations</h4><ex-38 /><hr />
      <h4>39. Typed entity state with generics</h4><ex-39 /><hr />
      <h4>40. Entity adapter factory (reusable for any type)</h4><ex-40 /><hr />
      <h4>41. Entity with versioning</h4><ex-41 /><hr />
      <h4>42. Entity with audit trail (createdAt, updatedAt)</h4><ex-42 /><hr />
      <h4>43. Entity normalization from API response</h4><ex-43 /><hr />
      <h4>44. Entity with real-time WebSocket sync</h4><ex-44 /><hr />
      <h4>45. Entity pagination with total count</h4><ex-45 /><hr />
      <h4>46. Entity with complex selector graph</h4><ex-46 /><hr />
      <h4>47. Entity relations (one-to-many)</h4><ex-47 /><hr />
      <h4>48. Entity with undo/redo stack</h4><ex-48 /><hr />
      <h4>49. Entity migration pattern</h4><ex-49 /><hr />
      <h4>50. Full normalized entity store: users + posts + comments</h4><ex-50 /><hr />
    </div>`
})
export class AppComponent {}
