import {
  Component, Input, Output, EventEmitter, OnChanges, SimpleChanges,
  signal, computed, effect,
  input, output, model,
  ViewChild, ElementRef,
} from '@angular/core';

// ============================================================
// Examples 1.3 — Input & Output (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ────────────────────────────────────────────

// 1. Simple @Input() string property
@Component({ selector: 'ex-01-child', standalone: true, template: `<p>Hello, {{ name }}</p>` })
class Ex01Child { @Input() name = ''; }
@Component({ selector: 'ex-01', standalone: true, imports: [Ex01Child], template: `<ex-01-child name="Angular" />` })
class Ex01 {}

// 2. @Input() with default value
@Component({ selector: 'ex-02-child', standalone: true, template: `<p>Color: {{ color }}</p>` })
class Ex02Child { @Input() color = 'blue'; }
@Component({ selector: 'ex-02', standalone: true, imports: [Ex02Child], template: `<ex-02-child /><ex-02-child color="red" />` })
class Ex02 {}

// 3. @Input() with required: true
@Component({ selector: 'ex-03-child', standalone: true, template: `<p>ID: {{ id }}</p>` })
class Ex03Child { @Input({ required: true }) id!: number; }
@Component({ selector: 'ex-03', standalone: true, imports: [Ex03Child], template: `<ex-03-child [id]="42" />` })
class Ex03 {}

// 4. @Input() number property
@Component({ selector: 'ex-04-child', standalone: true, template: `<p>Count: {{ count }}</p>` })
class Ex04Child { @Input() count = 0; }
@Component({ selector: 'ex-04', standalone: true, imports: [Ex04Child], template: `<ex-04-child [count]="100" />` })
class Ex04 {}

// 5. @Input() boolean (toggle)
@Component({ selector: 'ex-05-child', standalone: true, template: `<p [style.color]="active ? 'green' : 'gray'">{{ active ? 'Active' : 'Inactive' }}</p>` })
class Ex05Child { @Input() active = false; }
@Component({ selector: 'ex-05', standalone: true, imports: [Ex05Child], template: `<ex-05-child [active]="true" /><ex-05-child [active]="false" />` })
class Ex05 {}

// 6. @Input() object
@Component({ selector: 'ex-06-child', standalone: true, template: `<p>{{ user.name }} ({{ user.email }})</p>` })
class Ex06Child { @Input() user: { name: string; email: string } = { name: '', email: '' }; }
@Component({ selector: 'ex-06', standalone: true, imports: [Ex06Child], template: `<ex-06-child [user]="userData" />` })
class Ex06 { userData = { name: 'Alice', email: 'alice@example.com' }; }

// 7. @Input() array
@Component({ selector: 'ex-07-child', standalone: true, template: `<ul>@for (t of tags; track t) { <li>{{ t }}</li> }</ul>` })
class Ex07Child { @Input() tags: string[] = []; }
@Component({ selector: 'ex-07', standalone: true, imports: [Ex07Child], template: `<ex-07-child [tags]="['Angular', 'TypeScript', 'RxJS']" />` })
class Ex07 {}

// 8. @Output() EventEmitter<void>
@Component({ selector: 'ex-08-child', standalone: true, template: `<button (click)="clicked.emit()">Click me</button>` })
class Ex08Child { @Output() clicked = new EventEmitter<void>(); }
@Component({ selector: 'ex-08', standalone: true, imports: [Ex08Child], template: `<ex-08-child (clicked)="onClicked()" /><p>{{ msg }}</p>` })
class Ex08 { msg = 'not clicked'; onClicked() { this.msg = 'Clicked!'; } }

// 9. @Output() EventEmitter<string>
@Component({ selector: 'ex-09-child', standalone: true, template: `<button (click)="selected.emit('Option A')">Select A</button><button (click)="selected.emit('Option B')">Select B</button>` })
class Ex09Child { @Output() selected = new EventEmitter<string>(); }
@Component({ selector: 'ex-09', standalone: true, imports: [Ex09Child], template: `<ex-09-child (selected)="onSelect($event)" /><p>Selected: {{ choice }}</p>` })
class Ex09 { choice = 'none'; onSelect(c: string) { this.choice = c; } }

// 10. @Output() EventEmitter<number>
@Component({ selector: 'ex-10-child', standalone: true, template: `<button (click)="score.emit(10)">+10pts</button>` })
class Ex10Child { @Output() score = new EventEmitter<number>(); }
@Component({ selector: 'ex-10', standalone: true, imports: [Ex10Child], template: `<ex-10-child (score)="total = total + $event" /><p>Total: {{ total }}</p>` })
class Ex10 { total = 0; }

// 11. @Output() EventEmitter<object>
@Component({ selector: 'ex-11-child', standalone: true, template: `<button (click)="submit.emit({ id: 1, action: 'save' })">Submit</button>` })
class Ex11Child { @Output() submit = new EventEmitter<{ id: number; action: string }>(); }
@Component({ selector: 'ex-11', standalone: true, imports: [Ex11Child], template: `<ex-11-child (submit)="onSubmit($event)" /><p>{{ result }}</p>` })
class Ex11 { result = ''; onSubmit(e: { id: number; action: string }) { this.result = JSON.stringify(e); } }

// 12. Parent listening to child @Output
@Component({ selector: 'ex-12-child', standalone: true, template: `<button (click)="notify.emit('Hello from child!')">Notify Parent</button>` })
class Ex12Child { @Output() notify = new EventEmitter<string>(); }
@Component({ selector: 'ex-12', standalone: true, imports: [Ex12Child], template: `<ex-12-child (notify)="message = $event" /><p>Parent received: {{ message || '—' }}</p>` })
class Ex12 { message = ''; }

// 13. Two-way pattern with @Input + @Output (valueChange)
@Component({ selector: 'ex-13-child', standalone: true, template: `<input [value]="value" (input)="valueChange.emit($any($event).target.value)" />` })
class Ex13Child { @Input() value = ''; @Output() valueChange = new EventEmitter<string>(); }
@Component({ selector: 'ex-13', standalone: true, imports: [Ex13Child], template: `<ex-13-child [(value)]="text" /><p>Two-way: {{ text }}</p>` })
class Ex13 { text = 'editable'; }

// ─── INTERMEDIATE (14–26) ─────────────────────────────────────

// 14. input() signal — new API
@Component({ selector: 'ex-14-child', standalone: true, template: `<p>Signal input: {{ label() }}</p>` })
class Ex14Child { label = input('default'); }
@Component({ selector: 'ex-14', standalone: true, imports: [Ex14Child], template: `<ex-14-child label="From parent" />` })
class Ex14 {}

// 15. input.required<string>()
@Component({ selector: 'ex-15-child', standalone: true, template: `<p>Required: {{ title() }}</p>` })
class Ex15Child { title = input.required<string>(); }
@Component({ selector: 'ex-15', standalone: true, imports: [Ex15Child], template: `<ex-15-child title="Hello Required" />` })
class Ex15 {}

// 16. input() with transform
@Component({ selector: 'ex-16-child', standalone: true, template: `<p>Parsed number: {{ value() }}</p>` })
class Ex16Child { value = input(0, { transform: (v: string | number) => Number(v) }); }
@Component({ selector: 'ex-16', standalone: true, imports: [Ex16Child], template: `<ex-16-child value="42" />` })
class Ex16 {}

// 17. input() with alias
@Component({ selector: 'ex-17-child', standalone: true, template: `<p>Aliased: {{ myProp() }}</p>` })
class Ex17Child { myProp = input('', { alias: 'data-value' }); }
@Component({ selector: 'ex-17', standalone: true, imports: [Ex17Child], template: `<ex-17-child data-value="aliased input" />` })
class Ex17 {}

// 18. output() — new API
@Component({ selector: 'ex-18-child', standalone: true, template: `<button (click)="ping.emit()">Ping</button>` })
class Ex18Child { ping = output<void>(); }
@Component({ selector: 'ex-18', standalone: true, imports: [Ex18Child], template: `<ex-18-child (ping)="pings = pings + 1" /><p>Pings: {{ pings }}</p>` })
class Ex18 { pings = 0; }

// 19. output() with alias
@Component({ selector: 'ex-19-child', standalone: true, template: `<button (click)="internalEvt.emit('data')">Emit</button>` })
class Ex19Child { internalEvt = output<string>({ alias: 'myEvent' }); }
@Component({ selector: 'ex-19', standalone: true, imports: [Ex19Child], template: `<ex-19-child (myEvent)="last = $event" /><p>Last: {{ last }}</p>` })
class Ex19 { last = ''; }

// 20. model() for two-way binding
@Component({ selector: 'ex-20-child', standalone: true, template: `<input [value]="checked() ? 'on' : 'off'" readonly /><button (click)="checked.set(!checked())">Toggle</button>` })
class Ex20Child { checked = model(false); }
@Component({ selector: 'ex-20', standalone: true, imports: [Ex20Child], template: `<ex-20-child [(checked)]="isOn" /><p>Parent: {{ isOn }}</p>` })
class Ex20 { isOn = false; }

// 21. Parent → child → grandchild prop drilling
@Component({ selector: 'ex-21-gc', standalone: true, template: `<em>GC: {{ val }}</em>` })
class Ex21GC { @Input() val = ''; }
@Component({ selector: 'ex-21-c', standalone: true, imports: [Ex21GC], template: `<span>Child(<ex-21-gc [val]="val" />)</span>` })
class Ex21C { @Input() val = ''; }
@Component({ selector: 'ex-21', standalone: true, imports: [Ex21C], template: `<ex-21-c val="drilled" />` })
class Ex21 {}

// 22. @Input() with ngOnChanges detection
@Component({ selector: 'ex-22-child', standalone: true, template: `<p>Value: {{ value }} | Changes: {{ changes }}</p>` })
class Ex22Child implements OnChanges {
  @Input() value = 0; changes = 0;
  ngOnChanges(_: SimpleChanges) { this.changes++; }
}
@Component({ selector: 'ex-22', standalone: true, imports: [Ex22Child], template: `<ex-22-child [value]="n" /><button (click)="n = n + 1">Change</button>` })
class Ex22 { n = 0; }

// 23. @Output() with $event data
@Component({ selector: 'ex-23-child', standalone: true, template: `<input (input)="typed.emit($any($event).target.value)" placeholder="Type here" />` })
class Ex23Child { @Output() typed = new EventEmitter<string>(); }
@Component({ selector: 'ex-23', standalone: true, imports: [Ex23Child], template: `<ex-23-child (typed)="last = $event" /><p>Last typed: {{ last }}</p>` })
class Ex23 { last = ''; }

// 24. Conditional @Input() rendering
@Component({ selector: 'ex-24-child', standalone: true, template: `@if (showExtra) { <span style="color:green"> (EXTRA)</span> }<p>{{ label }}</p>` })
class Ex24Child { @Input() label = ''; @Input() showExtra = false; }
@Component({ selector: 'ex-24', standalone: true, imports: [Ex24Child], template: `<ex-24-child label="Basic" /><ex-24-child label="With Extra" [showExtra]="true" />` })
class Ex24 {}

// 25. Multiple @Output() events from one component
@Component({ selector: 'ex-25-child', standalone: true, template: `<button (click)="save.emit()">Save</button><button (click)="cancel.emit()">Cancel</button>` })
class Ex25Child { @Output() save = new EventEmitter<void>(); @Output() cancel = new EventEmitter<void>(); }
@Component({ selector: 'ex-25', standalone: true, imports: [Ex25Child], template: `<ex-25-child (save)="action = 'saved'" (cancel)="action = 'cancelled'" /><p>Action: {{ action }}</p>` })
class Ex25 { action = 'none'; }

// 26. @Input() alias usage
@Component({ selector: 'ex-26-child', standalone: true, template: `<p>Aliased input: {{ internalName }}</p>` })
class Ex26Child { @Input('publicName') internalName = ''; }
@Component({ selector: 'ex-26', standalone: true, imports: [Ex26Child], template: `<ex-26-child publicName="Uses alias" />` })
class Ex26 {}

// ─── NESTED (27–38) ───────────────────────────────────────────

// 27. Deep prop drilling — 3 levels
@Component({ selector: 'ex-27-l3', standalone: true, template: `<code>{{ data }}</code>` })
class Ex27L3 { @Input() data = ''; }
@Component({ selector: 'ex-27-l2', standalone: true, imports: [Ex27L3], template: `<ex-27-l3 [data]="data" />` })
class Ex27L2 { @Input() data = ''; }
@Component({ selector: 'ex-27', standalone: true, imports: [Ex27L2], template: `<ex-27-l2 data="3-level drill" />` })
class Ex27 {}

// 28. Parent broadcasts to multiple children
@Component({ selector: 'ex-28-c', standalone: true, template: `<p style="background:#eef;padding:4px">Theme: {{ theme }}</p>` })
class Ex28C { @Input() theme = ''; }
@Component({ selector: 'ex-28', standalone: true, imports: [Ex28C], template: `<ex-28-c [theme]="theme" /><ex-28-c [theme]="theme" /><button (click)="theme = theme === 'dark' ? 'light' : 'dark'">Toggle</button>` })
class Ex28 { theme = 'light'; }

// 29. Multiple children emit to parent
@Component({ selector: 'ex-29-c', standalone: true, template: `<button (click)="action.emit(label)">{{ label }}</button>` })
class Ex29C { @Input() label = ''; @Output() action = new EventEmitter<string>(); }
@Component({ selector: 'ex-29', standalone: true, imports: [Ex29C], template: `<ex-29-c label="A" (action)="log($event)" /><ex-29-c label="B" (action)="log($event)" /><p>{{ history }}</p>` })
class Ex29 { history = ''; log(a: string) { this.history += a + ' '; } }

// 30. Sibling communication via parent state
@Component({ selector: 'ex-30-a', standalone: true, template: `<button (click)="send.emit('from A')">Send from A</button>` })
class Ex30A { @Output() send = new EventEmitter<string>(); }
@Component({ selector: 'ex-30-b', standalone: true, template: `<p>Received: {{ msg }}</p>` })
class Ex30B { @Input() msg = ''; }
@Component({ selector: 'ex-30', standalone: true, imports: [Ex30A, Ex30B], template: `<ex-30-a (send)="shared = $event" /><ex-30-b [msg]="shared" />` })
class Ex30 { shared = ''; }

// 31. Reusable button component with (click) output
@Component({ selector: 'ex-31-btn', standalone: true, template: `<button (click)="clicked.emit()" [style.background]="color" style="color:white;padding:6px 12px;border:none;border-radius:4px;cursor:pointer">{{ label }}</button>` })
class Ex31Btn { @Input() label = 'Button'; @Input() color = 'steelblue'; @Output() clicked = new EventEmitter<void>(); }
@Component({ selector: 'ex-31', standalone: true, imports: [Ex31Btn], template: `<ex-31-btn label="Save" color="green" (clicked)="msg = 'Saved!'" />&nbsp;<ex-31-btn label="Delete" color="crimson" (clicked)="msg = 'Deleted!'" /><p>{{ msg }}</p>` })
class Ex31 { msg = ''; }

// 32. Reusable input component with (valueChange) output
@Component({ selector: 'ex-32-input', standalone: true, template: `<label style="font-size:12px;font-weight:bold">{{ label }}</label><br/><input [value]="value" (input)="valueChange.emit($any($event).target.value)" style="border:1px solid #ccc;padding:4px" />` })
class Ex32Input { @Input() label = ''; @Input() value = ''; @Output() valueChange = new EventEmitter<string>(); }
@Component({ selector: 'ex-32', standalone: true, imports: [Ex32Input], template: `<ex-32-input label="Name" [(value)]="name" /><p>Hello, {{ name }}!</p>` })
class Ex32 { name = 'World'; }

// 33. List with item that emits select/delete
@Component({ selector: 'ex-33-item', standalone: true, template: `<div style="display:flex;align-items:center;gap:8px;padding:4px"><span>{{ text }}</span><button (click)="select.emit(text)" style="font-size:11px">Select</button><button (click)="delete.emit(text)" style="font-size:11px;color:red">Delete</button></div>` })
class Ex33Item { @Input() text = ''; @Output() select = new EventEmitter<string>(); @Output() delete = new EventEmitter<string>(); }
@Component({ selector: 'ex-33', standalone: true, imports: [Ex33Item], template: `@for (i of items; track i) { <ex-33-item [text]="i" (select)="selected = $event" (delete)="remove($event)" /> }<p>Selected: {{ selected }}</p>` })
class Ex33 { items = ['Apple', 'Banana', 'Cherry']; selected = ''; remove(t: string) { this.items = this.items.filter(i => i !== t); } }

// 34. Form field wrapping with input/output
@Component({ selector: 'ex-34-field', standalone: true, template: `<div style="margin-bottom:8px"><label style="display:block;font-size:12px;color:#555">{{ label }}</label><input [value]="value" (input)="valueChange.emit($any($event).target.value)" [placeholder]="placeholder" style="border:1px solid #ccc;padding:6px;width:100%;box-sizing:border-box" /></div>` })
class Ex34Field { @Input() label = ''; @Input() value = ''; @Input() placeholder = ''; @Output() valueChange = new EventEmitter<string>(); }
@Component({ selector: 'ex-34', standalone: true, imports: [Ex34Field], template: `<ex-34-field label="Username" [(value)]="username" placeholder="Enter username" /><ex-34-field label="Password" [(value)]="password" placeholder="Enter password" /><p>{{ username }} / {{ password }}</p>` })
class Ex34 { username = ''; password = ''; }

// 35. Card with title @Input + close @Output
@Component({ selector: 'ex-35-card', standalone: true, template: `<div style="border:1px solid #ddd;border-radius:4px;padding:12px;position:relative"><strong>{{ title }}</strong><button (click)="close.emit()" style="position:absolute;top:8px;right:8px;background:none;border:none;cursor:pointer;font-size:16px">✕</button><ng-content /></div>` })
class Ex35Card { @Input() title = ''; @Output() close = new EventEmitter<void>(); }
@Component({ selector: 'ex-35', standalone: true, imports: [Ex35Card], template: `@if (visible) { <ex-35-card title="My Card" (close)="visible = false"><p>Card content here</p></ex-35-card> } @else { <button (click)="visible = true">Show Card</button> }` })
class Ex35 { visible = true; }

// 36. Badge with count @Input + dismiss @Output
@Component({ selector: 'ex-36-badge', standalone: true, template: `<span style="background:crimson;color:white;border-radius:10px;padding:2px 8px;font-size:12px">{{ count }} <button (click)="dismiss.emit()" style="background:none;border:none;color:white;cursor:pointer;font-size:11px">✕</button></span>` })
class Ex36Badge { @Input() count = 0; @Output() dismiss = new EventEmitter<void>(); }
@Component({ selector: 'ex-36', standalone: true, imports: [Ex36Badge], template: `@if (show) { <ex-36-badge [count]="notifications" (dismiss)="show = false" /> } @else { <button (click)="show = true">Restore badge</button> }` })
class Ex36 { notifications = 7; show = true; }

// 37. Pagination component — page @Input, pageChange @Output
@Component({ selector: 'ex-37-pager', standalone: true, template: `<button [disabled]="page <= 1" (click)="pageChange.emit(page - 1)">◀</button><span style="margin:0 8px">Page {{ page }} of {{ total }}</span><button [disabled]="page >= total" (click)="pageChange.emit(page + 1)">▶</button>` })
class Ex37Pager { @Input() page = 1; @Input() total = 5; @Output() pageChange = new EventEmitter<number>(); }
@Component({ selector: 'ex-37', standalone: true, imports: [Ex37Pager], template: `<ex-37-pager [page]="currentPage" [total]="5" (pageChange)="currentPage = $event" />` })
class Ex37 { currentPage = 1; }

// 38. Search box — query @Input, search @Output
@Component({ selector: 'ex-38-search', standalone: true, template: `<div style="display:flex;gap:4px"><input [value]="query" (input)="query = $any($event).target.value" placeholder="Search..." (keydown.enter)="search.emit(query)" style="border:1px solid #ccc;padding:4px" /><button (click)="search.emit(query)">Search</button></div>` })
class Ex38Search { @Input() query = ''; @Output() search = new EventEmitter<string>(); }
@Component({ selector: 'ex-38', standalone: true, imports: [Ex38Search], template: `<ex-38-search (search)="onSearch($event)" /><p>Searching for: {{ term }}</p>` })
class Ex38 { term = ''; onSearch(t: string) { this.term = t; } }

// ─── ADVANCED (39–50) ─────────────────────────────────────────

// 39. model() with computed display
@Component({ selector: 'ex-39-slider', standalone: true, template: `<input type="range" min="0" max="100" [value]="value()" (input)="value.set(+$any($event).target.value)" />` })
class Ex39Slider { value = model(50); }
@Component({ selector: 'ex-39', standalone: true, imports: [Ex39Slider], template: `<ex-39-slider [(value)]="brightness" /><p>Brightness: {{ brightness }}% — {{ label() }}</p>` })
class Ex39 { brightness = 50; label = computed(() => this.brightness < 33 ? 'Dark' : this.brightness < 66 ? 'Medium' : 'Bright'); }

// 40. input() with transform (string to number)
@Component({ selector: 'ex-40-child', standalone: true, template: `<p>Doubled: {{ doubled() }}</p>` })
class Ex40Child {
  value = input(0, { transform: (v: string | number) => Number(v) });
  doubled = computed(() => this.value() * 2);
}
@Component({ selector: 'ex-40', standalone: true, imports: [Ex40Child], template: `<ex-40-child value="21" />` })
class Ex40 {}

// 41. input() with transform (coerceBoolean)
@Component({ selector: 'ex-41-child', standalone: true, template: `<p>Disabled: {{ disabled() }}</p>` })
class Ex41Child { disabled = input(false, { transform: (v: string | boolean) => v === '' || v === true || v === 'true' }); }
@Component({ selector: 'ex-41', standalone: true, imports: [Ex41Child], template: `<ex-41-child disabled /><ex-41-child />` })
class Ex41 {}

// 42. output() replacing EventEmitter
@Component({ selector: 'ex-42-child', standalone: true, template: `<button (click)="valueChanged.emit(Math.random())">Random</button>` })
class Ex42Child { valueChanged = output<number>(); Math = Math; }
@Component({ selector: 'ex-42', standalone: true, imports: [Ex42Child], template: `<ex-42-child (valueChanged)="latest = $event.toFixed(4)" /><p>Latest: {{ latest }}</p>` })
class Ex42 { latest = '—'; }

// 43. Input + output + computed + effect composition
@Component({ selector: 'ex-43-child', standalone: true, template: `<p>{{ display() }}</p><button (click)="increment()">+1</button>` })
class Ex43Child {
  start = input(0);
  count = signal(0);
  display = computed(() => `Start: ${this.start()} + ${this.count()} = ${this.start() + this.count()}`);
  changed = output<number>();
  constructor() { effect(() => this.changed.emit(this.start() + this.count())); }
  increment() { this.count.set(this.count() + 1); }
}
@Component({ selector: 'ex-43', standalone: true, imports: [Ex43Child], template: `<ex-43-child [start]="5" (changed)="total = $event" /><p>Parent total: {{ total }}</p>` })
class Ex43 { total = 5; }

// 44. Parent uses child via @ViewChild to call methods
@Component({ selector: 'ex-44-child', standalone: true, template: `<p [style.color]="flashing ? 'red' : 'black'">{{ message }}</p>` })
class Ex44Child { message = 'Ready'; flashing = false; flash() { this.flashing = true; this.message = 'Flashed!'; setTimeout(() => this.flashing = false, 500); } }
@Component({ selector: 'ex-44', standalone: true, imports: [Ex44Child], template: `<ex-44-child #child /><button (click)="child.flash()">Flash Child</button>` })
class Ex44 { @ViewChild('child') child!: Ex44Child; }

// 45. Child queries parent via inject() pattern
import { InjectionToken } from '@angular/core';
const PARENT_TOKEN = new InjectionToken<{ theme: string }>('ParentContext');
@Component({ selector: 'ex-45-child', standalone: true, template: `<p>Theme from parent: {{ theme }}</p>` })
class Ex45Child { theme = inject(PARENT_TOKEN, { optional: true })?.theme ?? 'default'; }
@Component({ selector: 'ex-45', standalone: true, imports: [Ex45Child], providers: [{ provide: PARENT_TOKEN, useValue: { theme: 'dark' } }], template: `<ex-45-child />` })
class Ex45 {}

// 46. input() with signal chaining
@Component({ selector: 'ex-46-child', standalone: true, template: `<p>{{ processed() }}</p>` })
class Ex46Child {
  items = input<string[]>([]);
  processed = computed(() => this.items().map(i => i.toUpperCase()).join(', '));
}
@Component({ selector: 'ex-46', standalone: true, imports: [Ex46Child], template: `<ex-46-child [items]="list" />` })
class Ex46 { list = ['apple', 'banana', 'cherry']; }

// 47. Two-way binding with model() — full form field
@Component({ selector: 'ex-47-field', standalone: true, template: `<div><label style="font-size:12px;font-weight:bold;display:block">{{ label() }}</label><input [value]="value()" (input)="value.set($any($event).target.value)" style="border:1px solid #ccc;padding:6px;width:180px" /><small style="color:#888"> ({{ value().length }} chars)</small></div>` })
class Ex47Field { label = input('Label'); value = model(''); }
@Component({ selector: 'ex-47', standalone: true, imports: [Ex47Field], template: `<ex-47-field label="Bio" [(value)]="bio" /><p>Preview: {{ bio }}</p>` })
class Ex47 { bio = ''; }

// 48. Type-safe generic input pattern
@Component({ selector: 'ex-48-list', standalone: true, template: `<ul>@for (item of items; track $index) { <li>{{ stringify(item) }}</li> }</ul>` })
class Ex48List<T = unknown> { @Input() items: T[] = []; stringify(v: T) { return JSON.stringify(v); } }
@Component({ selector: 'ex-48', standalone: true, imports: [Ex48List], template: `<ex-48-list [items]="data" />` })
class Ex48 { data = [{ id: 1, val: 'a' }, { id: 2, val: 'b' }]; }

// 49. Dynamic component input binding
@Component({ selector: 'ex-49-card', standalone: true, template: `<div style="border:1px solid #ddd;padding:8px;border-radius:4px"><strong>{{ config().title }}</strong><p style="margin:4px 0">{{ config().body }}</p></div>` })
class Ex49Card { config = input<{ title: string; body: string }>({ title: '', body: '' }); }
@Component({ selector: 'ex-49', standalone: true, imports: [Ex49Card], template: `@for (c of cards; track c.title) { <ex-49-card [config]="c" style="margin-bottom:8px;display:block" /> }` })
class Ex49 { cards = [{ title: 'Card A', body: 'First body' }, { title: 'Card B', body: 'Second body' }]; }

// 50. Signal-based event bus pattern with input/output
@Component({ selector: 'ex-50-producer', standalone: true, template: `<button (click)="event.emit({ type: 'update', payload: counter++ })">Emit Event ({{ counter }})</button>` })
class Ex50Producer { event = output<{ type: string; payload: number }>(); counter = 0; }
@Component({ selector: 'ex-50-consumer', standalone: true, template: `<p>Last event: {{ lastEvent() | json }}</p>` })
class Ex50Consumer { lastEvent = signal<{ type: string; payload: number } | null>(null); @Input() set event(e: { type: string; payload: number } | null) { if (e) this.lastEvent.set(e); } }
import { JsonPipe } from '@angular/common';
@Component({ selector: 'ex-50', standalone: true, imports: [Ex50Producer, Ex50Consumer, JsonPipe], template: `<ex-50-producer (event)="latest = $event" /><ex-50-consumer [event]="latest" />` })
class Ex50 { latest: { type: string; payload: number } | null = null; }

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
      <h1>Examples 1.3 — Input &amp; Output</h1>
      <h4>1. Simple @Input() string property</h4><ex-01 /><hr />
      <h4>2. @Input() with default value</h4><ex-02 /><hr />
      <h4>3. @Input() with required: true</h4><ex-03 /><hr />
      <h4>4. @Input() number property</h4><ex-04 /><hr />
      <h4>5. @Input() boolean (toggle)</h4><ex-05 /><hr />
      <h4>6. @Input() object</h4><ex-06 /><hr />
      <h4>7. @Input() array</h4><ex-07 /><hr />
      <h4>8. @Output() EventEmitter&lt;void&gt;</h4><ex-08 /><hr />
      <h4>9. @Output() EventEmitter&lt;string&gt;</h4><ex-09 /><hr />
      <h4>10. @Output() EventEmitter&lt;number&gt;</h4><ex-10 /><hr />
      <h4>11. @Output() EventEmitter&lt;object&gt;</h4><ex-11 /><hr />
      <h4>12. Parent listening to child @Output</h4><ex-12 /><hr />
      <h4>13. Two-way pattern @Input + @Output (valueChange)</h4><ex-13 /><hr />
      <h4>14. input() signal — new API</h4><ex-14 /><hr />
      <h4>15. input.required&lt;string&gt;()</h4><ex-15 /><hr />
      <h4>16. input() with transform</h4><ex-16 /><hr />
      <h4>17. input() with alias</h4><ex-17 /><hr />
      <h4>18. output() — new API</h4><ex-18 /><hr />
      <h4>19. output() with alias</h4><ex-19 /><hr />
      <h4>20. model() for two-way binding</h4><ex-20 /><hr />
      <h4>21. Parent → child → grandchild prop drilling</h4><ex-21 /><hr />
      <h4>22. @Input() with ngOnChanges detection</h4><ex-22 /><hr />
      <h4>23. @Output() with $event data</h4><ex-23 /><hr />
      <h4>24. Conditional @Input() rendering</h4><ex-24 /><hr />
      <h4>25. Multiple @Output() events from one component</h4><ex-25 /><hr />
      <h4>26. @Input() alias usage</h4><ex-26 /><hr />
      <h4>27. Deep prop drilling — 3 levels</h4><ex-27 /><hr />
      <h4>28. Parent broadcasts to multiple children</h4><ex-28 /><hr />
      <h4>29. Multiple children emit to parent</h4><ex-29 /><hr />
      <h4>30. Sibling communication via parent state</h4><ex-30 /><hr />
      <h4>31. Reusable button component with (click) output</h4><ex-31 /><hr />
      <h4>32. Reusable input component with (valueChange) output</h4><ex-32 /><hr />
      <h4>33. List with item that emits select/delete</h4><ex-33 /><hr />
      <h4>34. Form field wrapping with input/output</h4><ex-34 /><hr />
      <h4>35. Card with title @Input + close @Output</h4><ex-35 /><hr />
      <h4>36. Badge with count @Input + dismiss @Output</h4><ex-36 /><hr />
      <h4>37. Pagination component — page/pageChange</h4><ex-37 /><hr />
      <h4>38. Search box — query @Input, search @Output</h4><ex-38 /><hr />
      <h4>39. model() with computed display</h4><ex-39 /><hr />
      <h4>40. input() with transform (string to number)</h4><ex-40 /><hr />
      <h4>41. input() with transform (coerceBoolean)</h4><ex-41 /><hr />
      <h4>42. output() replacing EventEmitter</h4><ex-42 /><hr />
      <h4>43. Input + output + computed + effect composition</h4><ex-43 /><hr />
      <h4>44. Parent uses child via @ViewChild to call methods</h4><ex-44 /><hr />
      <h4>45. Child queries parent via inject() pattern</h4><ex-45 /><hr />
      <h4>46. input() with signal chaining</h4><ex-46 /><hr />
      <h4>47. Two-way binding with model() — full form field</h4><ex-47 /><hr />
      <h4>48. Type-safe generic input pattern</h4><ex-48 /><hr />
      <h4>49. Dynamic component input binding</h4><ex-49 /><hr />
      <h4>50. Signal-based event bus pattern</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
