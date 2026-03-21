import { Component, signal, computed, ViewContainerRef, ComponentRef, ViewChild, Input, Output, EventEmitter, Injector, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

// ============================================================
// Examples 6.3 — Dynamic Components (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. ViewContainerRef — inject and access
@Component({ selector: 'ex-01', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>ViewContainerRef — inject and access</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:12px">{{ code }}</pre>
  </div>
` })
class Ex01 {
  vcr = inject(ViewContainerRef);
  code = `// Inject ViewContainerRef into a component
@Component({...})
class MyComponent {
  vcr = inject(ViewContainerRef);
  // or via constructor:
  constructor(private vcr: ViewContainerRef) {}

  ngOnInit() {
    console.log(this.vcr.length); // number of views
    console.log(this.vcr.element); // host element ref
  }
}`;
}

// 2. createComponent() — basic dynamic creation
@Component({ selector: 'ex-02', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>createComponent() — basic dynamic creation</strong>
    <button (click)="create()" style="margin:8px;padding:6px 12px;background:#4f46e5;color:white;border:none;border-radius:4px;cursor:pointer">Create</button>
    <div #host></div>
    <p *ngIf="created()" style="color:green">Component created! (simulated)</p>
  </div>
` })
class Ex02 {
  vcr = inject(ViewContainerRef);
  created = signal(false);
  create() {
    this.created.set(true);
  }
  code = `vcr.createComponent(MyDynamicComponent);`;
}

// 3. ComponentRef — access created instance
@Component({ selector: 'ex-03', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>ComponentRef — access created instance</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:12px">{{ code }}</pre>
  </div>
` })
class Ex03 {
  code = `const ref: ComponentRef<MyComp> = vcr.createComponent(MyComp);

// Access instance
const instance = ref.instance;

// Access host element
const el = ref.location.nativeElement;

// Trigger change detection
ref.changeDetectorRef.detectChanges();`;
}

// 4. Set @Input on dynamic component (componentRef.setInput)
@Component({ selector: 'ex-04', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>Set @Input via componentRef.setInput()</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:12px">{{ code }}</pre>
  </div>
` })
class Ex04 {
  code = `const ref = vcr.createComponent(CardComponent);

// Angular 14+ recommended way:
ref.setInput('title', 'Dynamic Title');
ref.setInput('color', 'blue');

// Old way (still works):
ref.instance.title = 'Dynamic Title';
ref.changeDetectorRef.detectChanges();`;
}

// 5. Listen to @Output from dynamic component
@Component({ selector: 'ex-05', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>Listen to @Output from dynamic component</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:12px">{{ code }}</pre>
  </div>
` })
class Ex05 {
  code = `const ref = vcr.createComponent(ButtonComponent);

// Subscribe to @Output EventEmitter
ref.instance.clicked.subscribe((val) => {
  console.log('Dynamic component emitted:', val);
});

// For signal outputs (Angular 17.1+):
// ref.instance.clicked() — it's a Signal`;
}

// 6. Clear ViewContainerRef (.clear())
@Component({ selector: 'ex-06', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>Clear ViewContainerRef (.clear())</strong>
    <button (click)="add()" style="margin:4px;padding:6px 12px;background:#4f46e5;color:white;border:none;border-radius:4px;cursor:pointer">Add</button>
    <button (click)="clear()" style="margin:4px;padding:6px 12px;background:#ef4444;color:white;border:none;border-radius:4px;cursor:pointer">Clear All</button>
    <p>Items: {{ count() }}</p>
  </div>
` })
class Ex06 {
  count = signal(0);
  add() { this.count.update(c => c + 1); }
  clear() { this.count.set(0); }
  code = `// Removes all dynamically created views
vcr.clear();`;
}

// 7. Insert component at index
@Component({ selector: 'ex-07', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>Insert component at specific index</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:12px">{{ code }}</pre>
  </div>
` })
class Ex07 {
  code = `// Insert at beginning (index 0)
const ref = vcr.createComponent(ItemComponent, { index: 0 });

// Insert at end (default)
const ref2 = vcr.createComponent(ItemComponent);

// Insert at specific position
const ref3 = vcr.createComponent(ItemComponent, { index: 2 });`;
}

// 8. Move component in container
@Component({ selector: 'ex-08', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>Move component in container</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:12px">{{ code }}</pre>
  </div>
` })
class Ex08 {
  code = `// Get the view from the ComponentRef
const view = ref.hostView;

// Move view to new index
vcr.move(view, newIndex);

// Example: move first item to end
const firstView = vcr.get(0)!;
vcr.move(firstView, vcr.length - 1);`;
}

// 9. Destroy dynamic component
@Component({ selector: 'ex-09', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>Destroy dynamic component (componentRef.destroy)</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:12px">{{ code }}</pre>
  </div>
` })
class Ex09 {
  code = `const ref = vcr.createComponent(ToastComponent);

// Later — destroy it
ref.destroy();

// This calls ngOnDestroy and removes from DOM
// and removes it from the ViewContainerRef automatically`;
}

// 10. Dynamic component from button click
@Component({ selector: 'ex-10', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>Dynamic component from button click</strong>
    <button (click)="spawn()" style="padding:6px 14px;background:#4f46e5;color:white;border:none;border-radius:4px;cursor:pointer">Spawn Component</button>
    <div style="margin-top:8px">
      @for(item of items(); track item) {
        <div style="background:#e0e7ff;padding:4px 8px;margin:2px;border-radius:4px;display:inline-block">Widget #{{ item }}</div>
      }
    </div>
  </div>
` })
class Ex10 {
  items = signal<number[]>([]);
  private next = 1;
  spawn() { this.items.update(i => [...i, this.next++]); }
}

// 11. Dynamic component count (signal)
@Component({ selector: 'ex-11', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>Dynamic component count via signal</strong>
    <button (click)="add()" style="margin:4px;padding:6px 12px;background:#4f46e5;color:white;border:none;border-radius:4px;cursor:pointer">+ Add</button>
    <button (click)="remove()" style="margin:4px;padding:6px 12px;background:#ef4444;color:white;border:none;border-radius:4px;cursor:pointer">- Remove</button>
    <p>Active components: <strong>{{ count() }}</strong></p>
  </div>
` })
class Ex11 {
  count = signal(0);
  add() { this.count.update(c => c + 1); }
  remove() { this.count.update(c => Math.max(0, c - 1)); }
}

// 12. Dynamic component with initial data
@Component({ selector: 'ex-12', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>Dynamic component with initial data</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:12px">{{ code }}</pre>
  </div>
` })
class Ex12 {
  code = `function createCard(vcr: ViewContainerRef, data: CardData) {
  const ref = vcr.createComponent(CardComponent);
  ref.setInput('title', data.title);
  ref.setInput('body', data.body);
  ref.setInput('color', data.color);
  ref.changeDetectorRef.detectChanges();
  return ref;
}`;
}

// 13. Multiple dynamic components in container
@Component({ selector: 'ex-13', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>Multiple dynamic components in container</strong>
    <button (click)="addCard()" style="padding:6px 14px;background:#4f46e5;color:white;border:none;border-radius:4px;cursor:pointer">Add Card</button>
    <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px">
      @for(card of cards(); track card.id) {
        <div style="background:#e0e7ff;padding:8px 12px;border-radius:6px;min-width:80px;text-align:center">
          <div style="font-weight:bold">Card {{ card.id }}</div>
          <div style="font-size:11px;color:#6b7280">{{ card.type }}</div>
        </div>
      }
    </div>
    <p style="font-size:12px;color:#6b7280">Total: {{ cards().length }}</p>
  </div>
` })
class Ex13 {
  cards = signal<{id: number, type: string}[]>([]);
  private next = 1;
  private types = ['chart', 'table', 'stat', 'map'];
  addCard() {
    const id = this.next++;
    this.cards.update(c => [...c, { id, type: this.types[id % 4] }]);
  }
}

// ─── INTERMEDIATE (14–26) ───────────────────────────────────

// 14. Lazy dynamic component (dynamic import + createComponent)
@Component({ selector: 'ex-14', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>Lazy dynamic component (dynamic import)</strong>
    <button (click)="load()" style="margin-left:8px;padding:6px 12px;background:#854d0e;color:white;border:none;border-radius:4px;cursor:pointer">Lazy Load</button>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:12px">{{ code }}</pre>
    @if(loaded()) { <p style="color:green">Component lazy loaded!</p> }
  </div>
` })
class Ex14 {
  loaded = signal(false);
  load() { this.loaded.set(true); }
  code = `async function lazyCreate(vcr: ViewContainerRef) {
  // Dynamic import — code splits into separate chunk
  const { HeavyComponent } = await import('./heavy.component');
  const ref = vcr.createComponent(HeavyComponent);
  ref.changeDetectorRef.detectChanges();
  return ref;
}`;
}

// 15. Dynamic component with custom Injector
@Component({ selector: 'ex-15', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>Dynamic component with custom Injector</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:12px">{{ code }}</pre>
  </div>
` })
class Ex15 {
  code = `import { Injector, createEnvironmentInjector } from '@angular/core';

function createWithInjector(vcr: ViewContainerRef, parentInjector: Injector) {
  const customInjector = Injector.create({
    providers: [
      { provide: MY_TOKEN, useValue: 'custom-value' }
    ],
    parent: parentInjector
  });

  const ref = vcr.createComponent(MyComponent, {
    injector: customInjector
  });
  return ref;
}`;
}

// 16. Dynamic component with additional providers
@Component({ selector: 'ex-16', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>Dynamic component with additional providers</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:12px">{{ code }}</pre>
  </div>
` })
class Ex16 {
  code = `const ref = vcr.createComponent(DialogComponent, {
  environmentInjector: this.environmentInjector,
  injector: Injector.create({
    providers: [
      { provide: DIALOG_DATA, useValue: { title: 'Confirm', message: 'Are you sure?' } },
      { provide: DialogRef, useValue: dialogRef }
    ],
    parent: this.injector
  })
});`;
}

// 17. Dialog service pattern
@Component({ selector: 'ex-17', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>Dialog service pattern (create dialog dynamically)</strong>
    <button (click)="open()" style="padding:6px 14px;background:#854d0e;color:white;border:none;border-radius:4px;cursor:pointer">Open Dialog</button>
    @if(isOpen()) {
      <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:24px;border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.3);z-index:1000;min-width:280px">
        <h3 style="margin:0 0 12px">Dialog Title</h3>
        <p>This dialog was created dynamically!</p>
        <button (click)="close()" style="padding:6px 14px;background:#4f46e5;color:white;border:none;border-radius:4px;cursor:pointer">Close</button>
      </div>
      <div (click)="close()" style="position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:999"></div>
    }
  </div>
` })
class Ex17 {
  isOpen = signal(false);
  open() { this.isOpen.set(true); }
  close() { this.isOpen.set(false); }
}

// 18. Toast notification dynamic creation
@Component({ selector: 'ex-18', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>Toast notification dynamic creation</strong>
    <button (click)="toast('success')" style="margin:4px;padding:6px 12px;background:#16a34a;color:white;border:none;border-radius:4px;cursor:pointer">Success Toast</button>
    <button (click)="toast('error')" style="margin:4px;padding:6px 12px;background:#dc2626;color:white;border:none;border-radius:4px;cursor:pointer">Error Toast</button>
    <div style="position:fixed;bottom:20px;right:20px;z-index:1000">
      @for(t of toasts(); track t.id) {
        <div [style]="'background:' + (t.type==='success'?'#16a34a':'#dc2626') + ';color:white;padding:10px 16px;border-radius:6px;margin-top:6px;animation:fadeIn 0.3s'">
          {{ t.type === 'success' ? '✓' : '✗' }} {{ t.message }}
        </div>
      }
    </div>
  </div>
` })
class Ex18 {
  toasts = signal<{id: number, type: string, message: string}[]>([]);
  private next = 1;
  toast(type: string) {
    const id = this.next++;
    const message = type === 'success' ? 'Operation successful!' : 'Something went wrong!';
    this.toasts.update(t => [...t, { id, type, message }]);
    setTimeout(() => this.toasts.update(t => t.filter(x => x.id !== id)), 3000);
  }
}

// 19. Modal service (programmatic open/close)
@Component({ selector: 'ex-19', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>Modal service (programmatic open/close)</strong>
    <button (click)="openModal('Confirm Delete', 'Are you sure you want to delete this item?')" style="padding:6px 14px;background:#854d0e;color:white;border:none;border-radius:4px;cursor:pointer">Open Modal</button>
    @if(modal()) {
      <div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:999;display:flex;align-items:center;justify-content:center">
        <div style="background:white;padding:24px;border-radius:8px;min-width:320px;max-width:480px">
          <h3 style="margin:0 0 8px">{{ modal()!.title }}</h3>
          <p style="color:#6b7280">{{ modal()!.message }}</p>
          <div style="display:flex;gap:8px;margin-top:16px">
            <button (click)="confirm()" style="padding:8px 16px;background:#dc2626;color:white;border:none;border-radius:4px;cursor:pointer">Confirm</button>
            <button (click)="closeModal()" style="padding:8px 16px;background:#e5e7eb;border:none;border-radius:4px;cursor:pointer">Cancel</button>
          </div>
        </div>
      </div>
    }
    @if(result()) { <p style="color:green;margin-top:8px">{{ result() }}</p> }
  </div>
` })
class Ex19 {
  modal = signal<{title: string, message: string} | null>(null);
  result = signal('');
  openModal(title: string, message: string) { this.modal.set({ title, message }); }
  closeModal() { this.modal.set(null); }
  confirm() { this.result.set('Confirmed!'); this.closeModal(); }
}

// 20. Tooltip dynamic component
@Component({ selector: 'ex-20', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>Tooltip dynamic component</strong>
    <div style="position:relative;display:inline-block;margin:16px">
      <button
        (mouseenter)="show=true" (mouseleave)="show=false"
        style="padding:8px 16px;background:#4f46e5;color:white;border:none;border-radius:4px;cursor:pointer">
        Hover me
      </button>
      @if(show) {
        <div style="position:absolute;bottom:110%;left:50%;transform:translateX(-50%);background:#1e1e1e;color:white;padding:6px 10px;border-radius:4px;white-space:nowrap;font-size:12px;z-index:10">
          Dynamic Tooltip Content
        </div>
      }
    </div>
  </div>
` })
class Ex20 {
  show = false;
}

// 21. Dynamic form field component
@Component({ selector: 'ex-21', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>Dynamic form field component</strong>
    <button (click)="addField()" style="margin-bottom:8px;padding:6px 12px;background:#4f46e5;color:white;border:none;border-radius:4px;cursor:pointer">Add Field</button>
    @for(field of fields(); track field.id) {
      <div style="display:flex;gap:8px;margin-bottom:6px;align-items:center">
        <select [(ngModel)]="field.type" style="padding:4px 8px;border:1px solid #d1d5db;border-radius:4px">
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="email">Email</option>
        </select>
        <input [type]="field.type" [placeholder]="'Field ' + field.id" style="flex:1;padding:4px 8px;border:1px solid #d1d5db;border-radius:4px" />
        <button (click)="remove(field.id)" style="padding:4px 8px;background:#ef4444;color:white;border:none;border-radius:4px;cursor:pointer">✕</button>
      </div>
    }
  </div>
` })
class Ex21 {
  fields = signal<{id: number, type: string}[]>([]);
  private next = 1;
  addField() { this.fields.update(f => [...f, { id: this.next++, type: 'text' }]); }
  remove(id: number) { this.fields.update(f => f.filter(x => x.id !== id)); }
}

// 22. Dynamic widget system
@Component({ selector: 'ex-22', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>Dynamic widget system</strong>
    <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">
      @for(type of widgetTypes; track type) {
        <button (click)="addWidget(type)" style="padding:6px 10px;background:#7c3aed;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px">+ {{ type }}</button>
      }
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px">
      @for(w of widgets(); track w.id) {
        <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:12px;text-align:center">
          <div style="font-size:20px">{{ w.icon }}</div>
          <div style="font-weight:600;font-size:13px">{{ w.type }}</div>
          <button (click)="remove(w.id)" style="margin-top:6px;font-size:10px;padding:2px 6px;background:#fee2e2;color:#dc2626;border:none;border-radius:3px;cursor:pointer">remove</button>
        </div>
      }
    </div>
  </div>
` })
class Ex22 {
  widgetTypes = ['Chart', 'Table', 'Map', 'Stats'];
  icons: Record<string, string> = { Chart: '📊', Table: '📋', Map: '🗺️', Stats: '📈' };
  widgets = signal<{id: number, type: string, icon: string}[]>([]);
  private next = 1;
  addWidget(type: string) {
    this.widgets.update(w => [...w, { id: this.next++, type, icon: this.icons[type] }]);
  }
  remove(id: number) { this.widgets.update(w => w.filter(x => x.id !== id)); }
}

// 23. Dynamic ad banner / placeholder
@Component({ selector: 'ex-23', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>Dynamic ad banner / placeholder</strong>
    <button (click)="rotate()" style="margin-bottom:8px;padding:6px 12px;background:#854d0e;color:white;border:none;border-radius:4px;cursor:pointer">Rotate Banner</button>
    <div [style]="'background:' + current().bg + ';padding:16px;border-radius:6px;text-align:center;color:white'">
      <div style="font-size:18px;font-weight:bold">{{ current().title }}</div>
      <div style="font-size:12px;opacity:0.9">{{ current().subtitle }}</div>
    </div>
  </div>
` })
class Ex23 {
  banners = [
    { title: 'Summer Sale – 50% Off!', subtitle: 'Limited time offer', bg: '#f59e0b' },
    { title: 'New Product Launch', subtitle: 'Be the first to try', bg: '#4f46e5' },
    { title: 'Free Shipping Today', subtitle: 'On orders over $50', bg: '#16a34a' },
  ];
  idx = signal(0);
  current = computed(() => this.banners[this.idx()]);
  rotate() { this.idx.update(i => (i + 1) % this.banners.length); }
}

// 24. Dynamic component based on type string map
@Component({ selector: 'ex-24', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>Dynamic component based on type string map</strong>
    <select (change)="select($event)" style="padding:6px;border:1px solid #d1d5db;border-radius:4px;margin-right:8px">
      <option value="chart">Chart</option>
      <option value="table">Table</option>
      <option value="form">Form</option>
    </select>
    <div style="margin-top:10px;padding:12px;background:white;border:1px solid #e5e7eb;border-radius:6px">
      Rendering: <strong>{{ type() }}</strong> component
      <div style="font-size:12px;color:#6b7280;margin-top:4px">
        {{ descriptions[type()] }}
      </div>
    </div>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px;margin-top:8px">{{ code }}</pre>
  </div>
` })
class Ex24 {
  type = signal('chart');
  descriptions: Record<string, string> = {
    chart: 'Renders a bar/line chart component',
    table: 'Renders a data table component',
    form: 'Renders an input form component',
  };
  select(e: Event) { this.type.set((e.target as HTMLSelectElement).value); }
  code = `const componentMap: Record<string, Type<any>> = {
  chart: ChartComponent,
  table: TableComponent,
  form: FormComponent,
};

const comp = componentMap[type];
if (comp) vcr.createComponent(comp);`;
}

// 25. Dynamic component with projected content
@Component({ selector: 'ex-25', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>Dynamic component with projected content</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:12px">{{ code }}</pre>
  </div>
` })
class Ex25 {
  code = `// Project nodes into dynamic component
const projectedNodes = [
  [document.createTextNode('Projected content here')]
];

const ref = vcr.createComponent(CardComponent, {
  projectableNodes: projectedNodes
});

// Inside CardComponent template:
// <ng-content></ng-content> receives the projected nodes`;
}

// 26. Dynamic component with signal inputs
@Component({ selector: 'ex-26', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>Dynamic component with signal inputs (Angular 17.1+)</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:12px">{{ code }}</pre>
  </div>
` })
class Ex26 {
  code = `// Component with signal input
@Component({...})
class CardComponent {
  title = input<string>(''); // signal input
  color = input<string>('blue');
}

// Dynamic creation — setInput works with signal inputs too
const ref = vcr.createComponent(CardComponent);
ref.setInput('title', 'Dynamic Card');
ref.setInput('color', 'red');
// Angular automatically updates the signal value`;
}

// ─── NESTED (27–38) ─────────────────────────────────────────

// 27. Dynamic component inside a dynamic component
@Component({ selector: 'ex-27', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>Dynamic component inside a dynamic component</strong>
    <button (click)="toggle()" style="margin-left:8px;padding:6px 12px;background:#166534;color:white;border:none;border-radius:4px;cursor:pointer">Toggle</button>
    @if(show()) {
      <div style="background:white;border:2px solid #86efac;border-radius:6px;padding:12px;margin-top:8px">
        <div style="color:#16a34a;font-weight:600">Outer Dynamic Component</div>
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:4px;padding:8px;margin-top:8px">
          <div style="color:#15803d;font-size:13px">Inner Dynamic Component (nested)</div>
          <p style="font-size:12px;color:#6b7280;margin:4px 0 0">Created by outer's ViewContainerRef</p>
        </div>
      </div>
    }
  </div>
` })
class Ex27 {
  show = signal(false);
  toggle() { this.show.update(v => !v); }
}

// 28. Dynamic component list (add/remove/reorder)
@Component({ selector: 'ex-28', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>Dynamic component list (add/remove/reorder)</strong>
    <div style="display:flex;gap:6px;margin-bottom:8px">
      <button (click)="add()" style="padding:6px 12px;background:#166534;color:white;border:none;border-radius:4px;cursor:pointer">+ Add</button>
      <button (click)="moveUp()" style="padding:6px 12px;background:#4f46e5;color:white;border:none;border-radius:4px;cursor:pointer">↑ Move Up</button>
    </div>
    @for(item of items(); track item.id; let i = $index) {
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;background:white;padding:6px 10px;border-radius:4px;border:1px solid #bbf7d0">
        <span style="color:#6b7280;font-size:12px;min-width:20px">{{ i + 1 }}.</span>
        <span style="flex:1">{{ item.label }}</span>
        <button (click)="remove(item.id)" style="padding:2px 8px;background:#fee2e2;color:#dc2626;border:none;border-radius:3px;cursor:pointer;font-size:12px">✕</button>
      </div>
    }
  </div>
` })
class Ex28 {
  items = signal<{id: number, label: string}[]>([]);
  private next = 1;
  add() { this.items.update(i => [...i, { id: this.next, label: 'Component #' + this.next++ }]); }
  remove(id: number) { this.items.update(i => i.filter(x => x.id !== id)); }
  moveUp() {
    this.items.update(i => {
      if (i.length < 2) return i;
      const arr = [...i];
      const last = arr.pop()!;
      arr.unshift(last);
      return arr;
    });
  }
}

// 29. ViewContainerRef in service (portal pattern)
@Component({ selector: 'ex-29', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>ViewContainerRef in service (portal pattern)</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:12px">{{ code }}</pre>
  </div>
` })
class Ex29 {
  code = `@Injectable({ providedIn: 'root' })
class PortalService {
  private vcr!: ViewContainerRef;

  // Called once by app root component
  registerHost(vcr: ViewContainerRef) {
    this.vcr = vcr;
  }

  open<T>(component: Type<T>): ComponentRef<T> {
    this.vcr.clear();
    return this.vcr.createComponent(component);
  }

  close() {
    this.vcr.clear();
  }
}`;
}

// 30. Dynamic tab panels (create/destroy tabs)
@Component({ selector: 'ex-30', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>Dynamic tab panels (create/destroy tabs)</strong>
    <div style="display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap">
      @for(tab of tabs(); track tab.id) {
        <button (click)="active.set(tab.id)"
          [style]="'padding:6px 12px;border:none;border-radius:4px 4px 0 0;cursor:pointer;' + (active()===tab.id ? 'background:#16a34a;color:white' : 'background:#e5e7eb')">
          {{ tab.label }}
          <span (click)="$event.stopPropagation();removeTab(tab.id)" style="margin-left:6px;opacity:0.7">✕</span>
        </button>
      }
      <button (click)="addTab()" style="padding:6px 12px;background:#166534;color:white;border:none;border-radius:4px;cursor:pointer">+ Tab</button>
    </div>
    <div style="background:white;padding:12px;border:1px solid #bbf7d0;border-radius:0 4px 4px 4px;min-height:60px">
      @if(currentTab()) {
        Content for: <strong>{{ currentTab()!.label }}</strong>
      } @else {
        No tabs open
      }
    </div>
  </div>
` })
class Ex30 {
  tabs = signal<{id: number, label: string}[]>([{ id: 1, label: 'Tab 1' }]);
  active = signal(1);
  private next = 2;
  currentTab = computed(() => this.tabs().find(t => t.id === this.active()) || null);
  addTab() {
    const id = this.next++;
    this.tabs.update(t => [...t, { id, label: 'Tab ' + id }]);
    this.active.set(id);
  }
  removeTab(id: number) {
    this.tabs.update(t => t.filter(x => x.id !== id));
    if (this.active() === id) this.active.set(this.tabs()[0]?.id ?? 0);
  }
}

// 31. Dynamic wizard steps
@Component({ selector: 'ex-31', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>Dynamic wizard steps</strong>
    <div style="display:flex;gap:4px;margin-bottom:12px">
      @for(step of steps; track step.n; let i = $index) {
        <div [style]="'flex:1;text-align:center;padding:6px;border-radius:4px;font-size:12px;' + (current()===i ? 'background:#16a34a;color:white;font-weight:bold' : i < current() ? 'background:#bbf7d0;color:#166534' : 'background:#e5e7eb;color:#9ca3af')">
          {{ step.n }}. {{ step.label }}
        </div>
      }
    </div>
    <div style="background:white;padding:12px;border-radius:6px;min-height:60px">
      <strong>{{ steps[current()].label }}</strong>
      <p style="font-size:13px;color:#6b7280">{{ steps[current()].content }}</p>
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:8px">
      <button (click)="prev()" [disabled]="current()===0" style="padding:6px 14px;background:#4f46e5;color:white;border:none;border-radius:4px;cursor:pointer;opacity:{{current()===0?'0.4':'1'}}">Back</button>
      <button (click)="next()" [disabled]="current()===steps.length-1" style="padding:6px 14px;background:#16a34a;color:white;border:none;border-radius:4px;cursor:pointer">Next</button>
    </div>
  </div>
` })
class Ex31 {
  steps = [
    { n: 1, label: 'Account', content: 'Enter your account details' },
    { n: 2, label: 'Profile', content: 'Complete your profile' },
    { n: 3, label: 'Review', content: 'Review your information' },
    { n: 4, label: 'Done', content: 'All done! Account created.' },
  ];
  current = signal(0);
  next() { this.current.update(c => Math.min(c + 1, this.steps.length - 1)); }
  prev() { this.current.update(c => Math.max(c - 1, 0)); }
}

// 32. Dynamic dashboard widgets
@Component({ selector: 'ex-32', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>Dynamic dashboard widgets (add + remove)</strong>
    <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">
      @for(type of widgetTypes; track type) {
        <button (click)="add(type)" style="padding:5px 10px;background:#166534;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px">+ {{ type }}</button>
      }
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px">
      @for(w of widgets(); track w.id) {
        <div style="background:white;border:1px solid #bbf7d0;border-radius:8px;padding:12px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-weight:600;font-size:13px">{{ w.type }}</span>
            <button (click)="remove(w.id)" style="font-size:10px;padding:1px 5px;background:#fee2e2;color:#dc2626;border:none;border-radius:3px;cursor:pointer">✕</button>
          </div>
          <div style="height:40px;background:#f0fdf4;border-radius:4px;margin-top:8px;display:flex;align-items:center;justify-content:center;font-size:11px;color:#6b7280">{{ w.type }} content</div>
        </div>
      }
    </div>
  </div>
` })
class Ex32 {
  widgetTypes = ['KPI', 'Chart', 'Table', 'Alert'];
  widgets = signal<{id: number, type: string}[]>([]);
  private next = 1;
  add(type: string) { this.widgets.update(w => [...w, { id: this.next++, type }]); }
  remove(id: number) { this.widgets.update(w => w.filter(x => x.id !== id)); }
}

// 33. Dynamic form sections (show/hide fields)
@Component({ selector: 'ex-33', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>Dynamic form sections (show/hide fields)</strong>
    <div style="display:flex;gap:8px;margin-bottom:8px">
      @for(section of sections; track section.key) {
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:13px">
          <input type="checkbox" [checked]="visible()[section.key]" (change)="toggle(section.key)" />
          {{ section.label }}
        </label>
      }
    </div>
    <div style="background:white;padding:12px;border-radius:6px">
      @if(visible()['personal']) {
        <div style="margin-bottom:8px">
          <div style="font-weight:600;font-size:13px;margin-bottom:4px">Personal Info</div>
          <input placeholder="First Name" style="width:100%;padding:6px;border:1px solid #d1d5db;border-radius:4px;margin-bottom:4px;box-sizing:border-box" />
          <input placeholder="Last Name" style="width:100%;padding:6px;border:1px solid #d1d5db;border-radius:4px;box-sizing:border-box" />
        </div>
      }
      @if(visible()['contact']) {
        <div style="margin-bottom:8px">
          <div style="font-weight:600;font-size:13px;margin-bottom:4px">Contact Info</div>
          <input placeholder="Email" style="width:100%;padding:6px;border:1px solid #d1d5db;border-radius:4px;box-sizing:border-box" />
        </div>
      }
      @if(visible()['address']) {
        <div>
          <div style="font-weight:600;font-size:13px;margin-bottom:4px">Address</div>
          <input placeholder="Street" style="width:100%;padding:6px;border:1px solid #d1d5db;border-radius:4px;box-sizing:border-box" />
        </div>
      }
    </div>
  </div>
` })
class Ex33 {
  sections = [
    { key: 'personal', label: 'Personal' },
    { key: 'contact', label: 'Contact' },
    { key: 'address', label: 'Address' },
  ];
  visible = signal<Record<string, boolean>>({ personal: true, contact: false, address: false });
  toggle(key: string) { this.visible.update(v => ({ ...v, [key]: !v[key] })); }
}

// 34. Dynamic component manager (registry pattern)
@Component({ selector: 'ex-34', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>Dynamic component manager (registry pattern)</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex34 {
  code = `type ComponentType = 'chart' | 'table' | 'form';

@Injectable({ providedIn: 'root' })
class ComponentRegistry {
  private registry = new Map<string, Type<any>>();

  register(key: string, comp: Type<any>) {
    this.registry.set(key, comp);
  }

  get(key: string): Type<any> | undefined {
    return this.registry.get(key);
  }

  create(key: string, vcr: ViewContainerRef) {
    const comp = this.registry.get(key);
    if (!comp) throw new Error('Unknown: ' + key);
    return vcr.createComponent(comp);
  }
}`;
}

// 35. Dynamic component hierarchy
@Component({ selector: 'ex-35', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>Dynamic component hierarchy</strong>
    <div style="background:white;border:2px solid #86efac;border-radius:6px;padding:12px">
      <div style="font-weight:600;color:#15803d">Root (AppComponent)</div>
      <div style="margin-left:16px;border-left:2px solid #86efac;padding-left:12px;margin-top:8px">
        <div style="color:#16a34a">Layout (dynamic)</div>
        <div style="margin-left:16px;border-left:2px solid #bbf7d0;padding-left:12px;margin-top:4px">
          <div style="color:#4ade80;font-size:13px">Header (dynamic)</div>
          <div style="color:#4ade80;font-size:13px">Content (dynamic)</div>
          <div style="margin-left:16px;border-left:2px solid #d1fae5;padding-left:8px;margin-top:4px">
            <div style="color:#86efac;font-size:12px">Widget A (dynamic)</div>
            <div style="color:#86efac;font-size:12px">Widget B (dynamic)</div>
          </div>
          <div style="color:#4ade80;font-size:13px">Footer (dynamic)</div>
        </div>
      </div>
    </div>
  </div>
` })
class Ex35 {}

// 36. Dynamic route outlet simulation
@Component({ selector: 'ex-36', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>Dynamic route outlet simulation</strong>
    <div style="display:flex;gap:6px;margin-bottom:8px">
      @for(route of routes; track route.path) {
        <button (click)="navigate(route.path)"
          [style]="'padding:6px 12px;border:none;border-radius:4px;cursor:pointer;' + (current()===route.path ? 'background:#16a34a;color:white' : 'background:#e5e7eb')">
          {{ route.label }}
        </button>
      }
    </div>
    <div style="background:white;border:1px solid #bbf7d0;border-radius:6px;padding:12px;min-height:60px">
      <div style="font-size:12px;color:#6b7280;margin-bottom:4px">router-outlet renders:</div>
      <strong>{{ currentRoute().label }}</strong>
      <p style="font-size:13px;color:#6b7280;margin:4px 0 0">{{ currentRoute().content }}</p>
    </div>
  </div>
` })
class Ex36 {
  routes = [
    { path: 'home', label: 'Home', content: 'HomeComponent loaded' },
    { path: 'about', label: 'About', content: 'AboutComponent loaded' },
    { path: 'contact', label: 'Contact', content: 'ContactComponent loaded' },
  ];
  current = signal('home');
  currentRoute = computed(() => this.routes.find(r => r.path === this.current()) || this.routes[0]);
  navigate(path: string) { this.current.set(path); }
}

// 37. Dynamic component with animations
@Component({ selector: 'ex-37', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>Dynamic component with animations</strong>
    <button (click)="spawn()" style="padding:6px 14px;background:#166534;color:white;border:none;border-radius:4px;cursor:pointer">Spawn Animated</button>
    <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:8px">
      @for(item of items(); track item.id) {
        <div [style]="'background:#4f46e5;color:white;padding:10px 16px;border-radius:6px;animation:slideIn 0.4s ease;opacity:' + item.opacity">
          Component #{{ item.id }}
        </div>
      }
    </div>
    <style>
      @keyframes slideIn { from { transform: translateY(-10px); opacity:0; } to { transform: translateY(0); opacity:1; } }
    </style>
  </div>
` })
class Ex37 {
  items = signal<{id: number, opacity: number}[]>([]);
  private next = 1;
  spawn() {
    const id = this.next++;
    this.items.update(i => [...i, { id, opacity: 1 }]);
    setTimeout(() => {
      this.items.update(i => i.map(x => x.id === id ? { ...x, opacity: 0.4 } : x));
    }, 1000);
  }
}

// 38. Full dynamic component orchestration
@Component({ selector: 'ex-38', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>Full dynamic component orchestration</strong>
    <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">
      <button (click)="action('add')" style="padding:5px 10px;background:#166534;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px">Add</button>
      <button (click)="action('clear')" style="padding:5px 10px;background:#dc2626;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px">Clear</button>
      <button (click)="action('shuffle')" style="padding:5px 10px;background:#4f46e5;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px">Shuffle</button>
    </div>
    <p style="font-size:12px;color:#6b7280">Log: {{ log() }}</p>
    <div style="display:flex;flex-wrap:wrap;gap:6px">
      @for(c of components(); track c.id) {
        <div style="background:white;border:1px solid #bbf7d0;border-radius:6px;padding:8px 12px;font-size:13px">
          {{ c.name }}
        </div>
      }
    </div>
  </div>
` })
class Ex38 {
  components = signal<{id: number, name: string}[]>([]);
  log = signal('Ready');
  private next = 1;
  private names = ['Header', 'Footer', 'Sidebar', 'Card', 'Modal', 'Toast'];
  action(type: string) {
    if (type === 'add') {
      const id = this.next++;
      const name = this.names[id % this.names.length] + '#' + id;
      this.components.update(c => [...c, { id, name }]);
      this.log.set('Added ' + name);
    } else if (type === 'clear') {
      this.components.set([]);
      this.log.set('Cleared all');
    } else if (type === 'shuffle') {
      this.components.update(c => [...c].sort(() => Math.random() - 0.5));
      this.log.set('Shuffled');
    }
  }
}

// ─── ADVANCED (39–50) ────────────────────────────────────────

// 39. ComponentPortal concept (Angular CDK)
@Component({ selector: 'ex-39', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>ComponentPortal concept (Angular CDK)</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex39 {
  code = `import { ComponentPortal, PortalModule } from '@angular/cdk/portal';
import { PortalOutlet, DomPortalOutlet } from '@angular/cdk/portal';

// Create a portal wrapping a component
const portal = new ComponentPortal(TooltipComponent);

// Attach it to an outlet
const outletRef = this.portalOutlet.attachComponentPortal(portal);

// Access instance
outletRef.instance.message = 'Hello from portal!';

// Detach when done
this.portalOutlet.detach();

// Template usage:
// <ng-template [cdkPortalOutlet]="portal"></ng-template>`;
}

// 40. DomPortal concept
@Component({ selector: 'ex-40', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>DomPortal concept</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex40 {
  code = `import { DomPortal } from '@angular/cdk/portal';

// Wrap a native element
const domPortal = new DomPortal(this.elementRef);

// Or from a template ref:
// new DomPortal(templateRef.elementRef)

// Attach to an outlet (moves the actual DOM node)
this.portalOutlet.attach(domPortal);

// Useful for:
// - Moving tooltips to document body to escape overflow:hidden
// - Rendering modals outside component tree
// - Teleporting content to header/footer`;
}

// 41. TemplatePortal concept
@Component({ selector: 'ex-41', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>TemplatePortal concept</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex41 {
  code = `import { TemplatePortal } from '@angular/cdk/portal';

@Component({
  template: \`
    <ng-template #myTemplate let-name>
      <div>Hello, {{name}}!</div>
    </ng-template>
    <ng-template [cdkPortalOutlet]="portal"></ng-template>
  \`
})
class MyComponent {
  @ViewChild('myTemplate') tmpl!: TemplateRef<any>;
  vcr = inject(ViewContainerRef);
  portal!: TemplatePortal;

  ngAfterViewInit() {
    this.portal = new TemplatePortal(
      this.tmpl, this.vcr, { $implicit: 'World' }
    );
  }
}`;
}

// 42. Overlay service simulation
@Component({ selector: 'ex-42', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>Overlay service simulation</strong>
    <button (click)="openOverlay()" style="padding:6px 14px;background:#9d174d;color:white;border:none;border-radius:4px;cursor:pointer">Open Overlay</button>
    @if(open()) {
      <div style="position:fixed;inset:0;z-index:1000;pointer-events:none">
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:24px;border-radius:8px;box-shadow:0 16px 48px rgba(0,0,0,0.2);min-width:300px;pointer-events:all">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <strong>CDK Overlay Simulation</strong>
            <button (click)="open.set(false)" style="background:none;border:none;cursor:pointer;font-size:18px">✕</button>
          </div>
          <p style="color:#6b7280;font-size:13px">In real CDK: OverlayRef manages position, backdrop, scrolling strategy, and component portal attachment.</p>
        </div>
      </div>
    }
  </div>
` })
class Ex42 {
  open = signal(false);
  openOverlay() { this.open.set(true); }
}

// 43. Dynamic component type safety (typed factory)
@Component({ selector: 'ex-43', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>Dynamic component type safety (typed factory)</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex43 {
  code = `type ComponentInputs<T> = {
  [K in keyof T]: T[K];
};

function typedCreate<T>(
  vcr: ViewContainerRef,
  component: Type<T>,
  inputs: Partial<ComponentInputs<T>>
): ComponentRef<T> {
  const ref = vcr.createComponent(component);
  for (const [key, value] of Object.entries(inputs)) {
    ref.setInput(key, value);
  }
  return ref;
}

// Usage — TypeScript validates the inputs!
typedCreate(vcr, CardComponent, {
  title: 'Hello', // ✓ typed
  color: 'blue',  // ✓ typed
  // unknown: true // ✗ compile error
});`;
}

// 44. Generic dynamic component<T>
@Component({ selector: 'ex-44', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>Generic dynamic component&lt;T&gt;</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex44 {
  code = `// Generic host component that renders any T
@Component({
  selector: 'dynamic-host',
  standalone: true,
  template: '<ng-container #outlet></ng-container>'
})
class DynamicHostComponent<T> {
  @ViewChild('outlet', { read: ViewContainerRef }) vcr!: ViewContainerRef;

  component = input.required<Type<T>>();
  inputs = input<Partial<T>>({});

  ngAfterViewInit() {
    const ref = this.vcr.createComponent(this.component());
    for (const [k, v] of Object.entries(this.inputs() as object)) {
      ref.setInput(k, v);
    }
  }
}`;
}

// 45. Dynamic component with signal inputs (advanced)
@Component({ selector: 'ex-45', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>Dynamic component with reactive signal inputs</strong>
    <input [(ngModel)]="titleValue" placeholder="Type title..." style="padding:6px;border:1px solid #d1d5db;border-radius:4px;margin-right:8px" />
    <div style="margin-top:8px;padding:10px;background:white;border:1px solid #f9a8d4;border-radius:6px">
      Simulated dynamic component renders: <strong>{{ titleValue }}</strong>
    </div>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px;margin-top:8px">{{ code }}</pre>
  </div>
` })
class Ex45 {
  titleValue = 'Hello Signal';
  code = `// When parent signal changes, call setInput to sync
const titleSig = signal('Initial');

effect(() => {
  ref.setInput('title', titleSig()); // reactive update
});

// Or use toObservable + subscribe
toObservable(titleSig).subscribe(val => {
  ref.setInput('title', val);
});`;
}

// 46. Dynamic component SSR considerations
@Component({ selector: 'ex-46', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>Dynamic component SSR considerations</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex46 {
  code = `import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

@Component({...})
class MyComponent {
  platform = inject(PLATFORM_ID);
  vcr = inject(ViewContainerRef);

  ngOnInit() {
    // Only create certain dynamic components in browser
    if (isPlatformBrowser(this.platform)) {
      // e.g. chart, map, canvas-based widgets
      this.vcr.createComponent(ChartComponent);
    }
    // Server-safe components can always be created
    this.vcr.createComponent(TextComponent);
  }
}

// Also: use transferState for data pre-loaded in SSR`;
}

// 47. Dynamic component lazy + preload
@Component({ selector: 'ex-47', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>Dynamic component lazy + preload</strong>
    <button (click)="preload()" style="margin:4px;padding:6px 12px;background:#9d174d;color:white;border:none;border-radius:4px;cursor:pointer">Preload</button>
    <button (click)="create()" style="margin:4px;padding:6px 12px;background:#4f46e5;color:white;border:none;border-radius:4px;cursor:pointer" [disabled]="!preloaded()">Create</button>
    <p style="font-size:12px;color:#6b7280">Preloaded: {{ preloaded() }} | Created: {{ created() }}</p>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex47 {
  preloaded = signal(false);
  created = signal(false);
  preload() { setTimeout(() => this.preloaded.set(true), 500); }
  create() { if (this.preloaded()) this.created.set(true); }
  code = `// Preload on idle, create on demand
let preloadedComp: Type<any> | null = null;

requestIdleCallback(async () => {
  const { HeavyComponent } = await import('./heavy.component');
  preloadedComp = HeavyComponent; // cached, no extra network request
});

// Later — instant creation (already loaded)
function createNow(vcr: ViewContainerRef) {
  if (preloadedComp) vcr.createComponent(preloadedComp);
}`;
}

// 48. Dynamic component registry (token-based)
@Component({ selector: 'ex-48', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>Dynamic component registry (token-based)</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex48 {
  code = `// Define injection token for registry
const WIDGET_REGISTRY = new InjectionToken<Map<string, Type<any>>>(
  'WIDGET_REGISTRY',
  { factory: () => new Map() }
);

// Register widgets via providers
providers: [
  {
    provide: WIDGET_REGISTRY,
    useFactory: () => {
      const map = new Map<string, Type<any>>();
      map.set('chart', ChartWidget);
      map.set('table', TableWidget);
      return map;
    }
  }
]

// Usage in component
class DashboardComponent {
  registry = inject(WIDGET_REGISTRY);
  vcr = inject(ViewContainerRef);

  addWidget(type: string) {
    const comp = this.registry.get(type);
    if (comp) this.vcr.createComponent(comp);
  }
}`;
}

// 49. Component factory pattern (builder)
@Component({ selector: 'ex-49', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>Component factory pattern (builder)</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex49 {
  code = `class ComponentBuilder<T> {
  private _inputs: Partial<T> = {};
  private _outputs: Record<string, (v: any) => void> = {};
  private _vcr!: ViewContainerRef;
  private _comp!: Type<T>;

  for(comp: Type<T>) { this._comp = comp; return this; }
  in(vcr: ViewContainerRef) { this._vcr = vcr; return this; }
  input<K extends keyof T>(key: K, val: T[K]) { this._inputs[key] = val; return this; }
  on(event: string, handler: (v: any) => void) { this._outputs[event] = handler; return this; }

  build(): ComponentRef<T> {
    const ref = this._vcr.createComponent(this._comp);
    for (const [k, v] of Object.entries(this._inputs)) ref.setInput(k, v);
    for (const [e, h] of Object.entries(this._outputs)) {
      (ref.instance as any)[e]?.subscribe?.(h);
    }
    return ref;
  }
}

// Usage:
new ComponentBuilder()
  .for(CardComponent)
  .in(this.vcr)
  .input('title', 'My Card')
  .on('clicked', (v) => console.log(v))
  .build();`;
}

// 50. Full plugin architecture with dynamic components
@Component({ selector: 'ex-50', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>Full plugin architecture with dynamic components</strong>
    <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">
      @for(plugin of availablePlugins; track plugin.id) {
        <button (click)="loadPlugin(plugin.id)"
          [style]="'padding:6px 10px;border:none;border-radius:4px;cursor:pointer;font-size:12px;' + (loadedPlugins().includes(plugin.id) ? 'background:#9d174d;color:white' : 'background:#fce7f3;border:1px solid #f9a8d4')">
          {{ loadedPlugins().includes(plugin.id) ? '✓ ' : '+ ' }}{{ plugin.name }}
        </button>
      }
    </div>
    <div style="background:white;border:1px solid #f9a8d4;border-radius:6px;padding:12px;min-height:80px">
      <div style="font-size:12px;color:#6b7280;margin-bottom:8px">Plugin Slot (dynamic host)</div>
      @for(pid of loadedPlugins(); track pid) {
        @for(p of availablePlugins; track p.id) {
          @if(p.id === pid) {
            <div style="display:inline-flex;align-items:center;gap:6px;background:#fdf4ff;border:1px solid #e9d5ff;border-radius:6px;padding:6px 10px;margin:3px;font-size:13px">
              {{ p.icon }} <strong>{{ p.name }}</strong> plugin active
            </div>
          }
        }
      }
      @if(loadedPlugins().length === 0) {
        <p style="color:#9ca3af;font-size:13px">No plugins loaded. Click above to load.</p>
      }
    </div>
  </div>
` })
class Ex50 {
  availablePlugins = [
    { id: 'auth', name: 'Auth', icon: '🔐' },
    { id: 'analytics', name: 'Analytics', icon: '📊' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'payments', name: 'Payments', icon: '💳' },
  ];
  loadedPlugins = signal<string[]>([]);
  loadPlugin(id: string) {
    this.loadedPlugins.update(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
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
    Ex41, Ex42, Ex43, Ex44, Ex45, Ex46, Ex47, Ex48, Ex49, Ex50,
  ],
  template: `
    <div style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:20px">
      <h1>Examples 6.3 — Dynamic Components</h1>

      <h4>1. ViewContainerRef — inject and access</h4><ex-01 /><hr />
      <h4>2. createComponent() — basic dynamic creation</h4><ex-02 /><hr />
      <h4>3. ComponentRef — access created instance</h4><ex-03 /><hr />
      <h4>4. Set @Input on dynamic component (setInput)</h4><ex-04 /><hr />
      <h4>5. Listen to @Output from dynamic component</h4><ex-05 /><hr />
      <h4>6. Clear ViewContainerRef (.clear())</h4><ex-06 /><hr />
      <h4>7. Insert component at index</h4><ex-07 /><hr />
      <h4>8. Move component in container</h4><ex-08 /><hr />
      <h4>9. Destroy dynamic component</h4><ex-09 /><hr />
      <h4>10. Dynamic component from button click</h4><ex-10 /><hr />
      <h4>11. Dynamic component count (signal)</h4><ex-11 /><hr />
      <h4>12. Dynamic component with initial data</h4><ex-12 /><hr />
      <h4>13. Multiple dynamic components in container</h4><ex-13 /><hr />

      <h4>14. Lazy dynamic component (dynamic import)</h4><ex-14 /><hr />
      <h4>15. Dynamic component with custom Injector</h4><ex-15 /><hr />
      <h4>16. Dynamic component with additional providers</h4><ex-16 /><hr />
      <h4>17. Dialog service pattern</h4><ex-17 /><hr />
      <h4>18. Toast notification dynamic creation</h4><ex-18 /><hr />
      <h4>19. Modal service (programmatic open/close)</h4><ex-19 /><hr />
      <h4>20. Tooltip dynamic component</h4><ex-20 /><hr />
      <h4>21. Dynamic form field component</h4><ex-21 /><hr />
      <h4>22. Dynamic widget system</h4><ex-22 /><hr />
      <h4>23. Dynamic ad banner / placeholder</h4><ex-23 /><hr />
      <h4>24. Dynamic component based on type string map</h4><ex-24 /><hr />
      <h4>25. Dynamic component with projected content</h4><ex-25 /><hr />
      <h4>26. Dynamic component with signal inputs</h4><ex-26 /><hr />

      <h4>27. Dynamic component inside a dynamic component</h4><ex-27 /><hr />
      <h4>28. Dynamic component list (add/remove/reorder)</h4><ex-28 /><hr />
      <h4>29. ViewContainerRef in service (portal pattern)</h4><ex-29 /><hr />
      <h4>30. Dynamic tab panels (create/destroy tabs)</h4><ex-30 /><hr />
      <h4>31. Dynamic wizard steps</h4><ex-31 /><hr />
      <h4>32. Dynamic dashboard widgets</h4><ex-32 /><hr />
      <h4>33. Dynamic form sections (show/hide fields)</h4><ex-33 /><hr />
      <h4>34. Dynamic component manager (registry pattern)</h4><ex-34 /><hr />
      <h4>35. Dynamic component hierarchy</h4><ex-35 /><hr />
      <h4>36. Dynamic route outlet simulation</h4><ex-36 /><hr />
      <h4>37. Dynamic component with animations</h4><ex-37 /><hr />
      <h4>38. Full dynamic component orchestration</h4><ex-38 /><hr />

      <h4>39. ComponentPortal concept (Angular CDK)</h4><ex-39 /><hr />
      <h4>40. DomPortal concept</h4><ex-40 /><hr />
      <h4>41. TemplatePortal concept</h4><ex-41 /><hr />
      <h4>42. Overlay service simulation</h4><ex-42 /><hr />
      <h4>43. Dynamic component type safety (typed factory)</h4><ex-43 /><hr />
      <h4>44. Generic dynamic component&lt;T&gt;</h4><ex-44 /><hr />
      <h4>45. Dynamic component with signal inputs (advanced)</h4><ex-45 /><hr />
      <h4>46. Dynamic component SSR considerations</h4><ex-46 /><hr />
      <h4>47. Dynamic component lazy + preload</h4><ex-47 /><hr />
      <h4>48. Dynamic component registry (token-based)</h4><ex-48 /><hr />
      <h4>49. Component factory pattern (builder)</h4><ex-49 /><hr />
      <h4>50. Full plugin architecture with dynamic components</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
