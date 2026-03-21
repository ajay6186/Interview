import {
  Component, signal, computed, effect, inject, DestroyRef,
  ViewChild, ContentChild, ElementRef, ChangeDetectionStrategy,
  ViewEncapsulation, afterRender, afterNextRender, input, output, model,
  OnInit, OnChanges, OnDestroy, AfterViewInit, SimpleChanges,
} from '@angular/core';

// ============================================================
// Examples 1.2 — Components (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ────────────────────────────────────────────

// 1. Simplest standalone component
@Component({ selector: 'ex-01', standalone: true, template: `<p>Hello from Ex01</p>` })
class Ex01 {}

// 2. Component with a property
@Component({ selector: 'ex-02', standalone: true, template: `<p>{{ title }}</p>` })
class Ex02 { title = 'My Component'; }

// 3. Component with a method
@Component({ selector: 'ex-03', standalone: true, template: `<p>{{ greet() }}</p>` })
class Ex03 { greet() { return 'Hello, World!'; } }

// 4. Component with inline styles
@Component({ selector: 'ex-04', standalone: true, styles: [`p { color: steelblue; font-weight: bold; }`], template: `<p>Styled inline</p>` })
class Ex04 {}

// 5. Component with styles array
@Component({
  selector: 'ex-05', standalone: true,
  styles: [`h3 { margin: 0; }`, `span { background: yellow; padding: 2px 4px; }`],
  template: `<h3>Styles Array</h3><span>Highlighted</span>`
})
class Ex05 {}

// 6. Component with ViewEncapsulation.None
@Component({ selector: 'ex-06', standalone: true, encapsulation: ViewEncapsulation.None, template: `<p class="ve-none">No encapsulation</p>` })
class Ex06 {}

// 7. Component with ViewEncapsulation.ShadowDom
@Component({ selector: 'ex-07', standalone: true, encapsulation: ViewEncapsulation.ShadowDom, styles: [`p { color: darkviolet; }`], template: `<p>Shadow DOM</p>` })
class Ex07 {}

// 8. Component with changeDetection: OnPush
@Component({ selector: 'ex-08', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush, template: `<p>OnPush CD: {{ label }}</p>` })
class Ex08 { label = 'Efficient'; }

// 9. Component with host binding via host: {}
@Component({ selector: 'ex-09', standalone: true, host: { 'style': 'display:block;border:1px dashed #aaa;padding:4px' }, template: `<p>Host-styled block</p>` })
class Ex09 {}

// 10. Component with templateUrl pattern (inline simulation)
@Component({ selector: 'ex-10', standalone: true, template: `<article><h3>Article Title</h3><p>Article body content here.</p></article>` })
class Ex10 {}

// 11. Component that renders another component
@Component({ selector: 'ex-11-child', standalone: true, template: `<span>I am the child</span>` })
class Ex11Child {}
@Component({ selector: 'ex-11', standalone: true, imports: [Ex11Child], template: `<p>Parent contains: <ex-11-child /></p>` })
class Ex11 {}

// 12. Component with conditional template
@Component({ selector: 'ex-12', standalone: true, template: `@if (show) { <p>Visible!</p> } @else { <p style="color:gray">Hidden</p> } <button (click)="show = !show">Toggle</button>` })
class Ex12 { show = true; }

// 13. Component with computed class name
@Component({ selector: 'ex-13', standalone: true, template: `<div [class]="cardClass" style="padding:8px;border-radius:4px">{{ label }}</div>` })
class Ex13 {
  active = true;
  label = 'Dynamic Card';
  get cardClass() { return this.active ? 'card-active' : 'card-inactive'; }
}

// ─── INTERMEDIATE (14–26) ─────────────────────────────────────

// 14. Parent-child composition
@Component({ selector: 'ex-14-child', standalone: true, template: `<span style="color:green">Child Component</span>` })
class Ex14Child {}
@Component({ selector: 'ex-14', standalone: true, imports: [Ex14Child], template: `<p>Parent → <ex-14-child /></p>` })
class Ex14 {}

// 15. Component with signal state
@Component({ selector: 'ex-15', standalone: true, template: `<p>{{ count() }}</p><button (click)="count.set(count() + 1)">+1</button>` })
class Ex15 { count = signal(0); }

// 16. Component with computed
@Component({ selector: 'ex-16', standalone: true, template: `<p>Base: {{ n() }} | Square: {{ square() }}</p><button (click)="n.set(n() + 1)">+1</button>` })
class Ex16 { n = signal(3); square = computed(() => this.n() ** 2); }

// 17. Component with effect
@Component({ selector: 'ex-17', standalone: true, template: `<p>Count: {{ count() }} (check console)</p><button (click)="count.set(count() + 1)">+1</button>` })
class Ex17 {
  count = signal(0);
  constructor() { effect(() => console.log('[Ex17] count =', this.count())); }
}

// 18. Component with DestroyRef cleanup
@Component({ selector: 'ex-18', standalone: true, template: `<p>DestroyRef cleanup (check console on destroy)</p>` })
class Ex18 {
  constructor() {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => console.log('[Ex18] destroyed'));
  }
}

// 19. Component using inject()
@Component({ selector: 'ex-19', standalone: true, template: `<p>ElementRef: {{ tagName }}</p>` })
class Ex19 {
  private el = inject(ElementRef);
  get tagName() { return this.el.nativeElement.tagName; }
}

// 20. Component with afterRender callback
@Component({ selector: 'ex-20', standalone: true, template: `<p>afterRender hook (check console)</p>` })
class Ex20 {
  constructor() { afterRender(() => console.log('[Ex20] rendered')); }
}

// 21. Component with @ViewChild
@Component({
  selector: 'ex-21', standalone: true,
  template: `<input #myInput placeholder="Type here" /><button (click)="focus()">Focus</button>`
})
class Ex21 {
  @ViewChild('myInput') inputRef!: ElementRef<HTMLInputElement>;
  focus() { this.inputRef.nativeElement.focus(); }
}

// 22. Component with @ContentChild
@Component({ selector: 'ex-22-wrapper', standalone: true, template: `<div style="border:1px solid #ccc;padding:8px"><ng-content /></div>` })
class Ex22Wrapper {
  @ContentChild('label') labelRef?: ElementRef;
}
@Component({ selector: 'ex-22', standalone: true, imports: [Ex22Wrapper], template: `<ex-22-wrapper><span #label>Projected label</span></ex-22-wrapper>` })
class Ex22 {}

// 23. Component with multiple @ViewChild refs
@Component({
  selector: 'ex-23', standalone: true,
  template: `<input #first placeholder="First" /><input #second placeholder="Second" style="margin-left:8px" /><button (click)="swapFocus(step)">Next</button>`
})
class Ex23 {
  @ViewChild('first') firstRef!: ElementRef<HTMLInputElement>;
  @ViewChild('second') secondRef!: ElementRef<HTMLInputElement>;
  step = 0;
  swapFocus(s: number) { s === 0 ? this.firstRef.nativeElement.focus() : this.secondRef.nativeElement.focus(); this.step = 1 - s; }
}

// 24. Component with ng-container
@Component({
  selector: 'ex-24', standalone: true,
  template: `<ng-container><p>ng-container wraps without DOM element</p><span>Sibling inside container</span></ng-container>`
})
class Ex24 {}

// 25. Component with ng-template
@Component({
  selector: 'ex-25', standalone: true,
  template: `
    <ng-template #tmpl><span style="color:purple">From template</span></ng-template>
    @if (show) { <ng-container *ngTemplateOutlet="tmpl" /> }
    <button (click)="show = !show">Toggle template</button>
  `,
  imports: [CommonModule],
})
class Ex25 { show = true; }

import { CommonModule } from '@angular/common';

// 26. Component with dynamic title via signal
@Component({
  selector: 'ex-26', standalone: true,
  template: `<h3>{{ title() }}</h3><input [value]="title()" (input)="title.set($any($event).target.value)" />`
})
class Ex26 { title = signal('Edit me'); }

// ─── NESTED (27–38) ───────────────────────────────────────────

// 27. Three-level component hierarchy
@Component({ selector: 'ex-27-c', standalone: true, template: `<em>Grandchild</em>` })
class Ex27C {}
@Component({ selector: 'ex-27-b', standalone: true, imports: [Ex27C], template: `<span>Child → <ex-27-c /></span>` })
class Ex27B {}
@Component({ selector: 'ex-27', standalone: true, imports: [Ex27B], template: `<p>Parent → <ex-27-b /></p>` })
class Ex27 {}

// 28. Sibling components sharing parent state
@Component({ selector: 'ex-28-a', standalone: true, template: `<p style="color:blue">Sibling A sees: {{ val }}</p>` })
class Ex28A { val = ''; }
@Component({ selector: 'ex-28-b', standalone: true, template: `<p style="color:red">Sibling B sees: {{ val }}</p>` })
class Ex28B { val = ''; }
@Component({
  selector: 'ex-28', standalone: true, imports: [Ex28A, Ex28B],
  template: `
    <input [value]="shared" (input)="shared = $any($event).target.value" placeholder="Shared state" />
    <ex-28-a [val]="shared" /><ex-28-b [val]="shared" />
  `
})
class Ex28 { shared = 'hello'; }

// 29. Component with header/body/footer slots
@Component({
  selector: 'ex-29-card', standalone: true,
  template: `<div style="border:1px solid #ddd;border-radius:4px;overflow:hidden"><div style="background:#f0f0f0;padding:8px"><ng-content select="[slot=header]" /></div><div style="padding:8px"><ng-content /></div><div style="background:#f0f0f0;padding:8px;font-size:12px"><ng-content select="[slot=footer]" /></div></div>`
})
class Ex29Card {}
@Component({
  selector: 'ex-29', standalone: true, imports: [Ex29Card],
  template: `<ex-29-card><span slot="header">Card Header</span><p>Main content here</p><span slot="footer">Footer info</span></ex-29-card>`
})
class Ex29 {}

// 30. List component using child item component
@Component({ selector: 'ex-30-item', standalone: true, template: `<li style="padding:4px">{{ text }}</li>` })
class Ex30Item { text = ''; }
@Component({
  selector: 'ex-30', standalone: true, imports: [Ex30Item],
  template: `<ul>@for (item of items; track item) { <ex-30-item [text]="item" /> }</ul>`
})
class Ex30 { items = ['Angular', 'React', 'Vue']; }

// 31. Card component wrapping content
@Component({ selector: 'ex-31-card', standalone: true, styles: [`.card{border:1px solid #ddd;border-radius:8px;padding:16px;margin:4px}`], template: `<div class="card"><ng-content /></div>` })
class Ex31Card {}
@Component({ selector: 'ex-31', standalone: true, imports: [Ex31Card], template: `<ex-31-card><h3 style="margin:0">Card Title</h3><p>Card body text.</p></ex-31-card>` })
class Ex31 {}

// 32. Shell component with dynamic slot
@Component({ selector: 'ex-32-shell', standalone: true, template: `<header style="background:#333;color:#fff;padding:8px">Header</header><main style="padding:8px"><ng-content /></main><footer style="background:#eee;padding:8px;font-size:12px">Footer</footer>` })
class Ex32Shell {}
@Component({ selector: 'ex-32', standalone: true, imports: [Ex32Shell], template: `<ex-32-shell><p>Page content in the shell</p></ex-32-shell>` })
class Ex32 {}

// 33. Dashboard with multiple widget components
@Component({ selector: 'ex-33-widget', standalone: true, template: `<div style="border:1px solid #aaa;padding:8px;border-radius:4px;min-width:100px;text-align:center"><strong>{{ title }}</strong><p style="font-size:24px;margin:4px">{{ value }}</p></div>` })
class Ex33Widget { title = ''; value = ''; }
@Component({
  selector: 'ex-33', standalone: true, imports: [Ex33Widget],
  template: `<div style="display:flex;gap:8px"><ex-33-widget title="Users" value="1,240" /><ex-33-widget title="Sales" value="$8,320" /><ex-33-widget title="Uptime" value="99.9%" /></div>`
})
class Ex33 {}

// 34. Form with reusable field component
@Component({ selector: 'ex-34-field', standalone: true, template: `<div style="margin-bottom:8px"><label style="display:block;font-weight:bold;font-size:12px">{{ label }}</label><input [placeholder]="placeholder" style="border:1px solid #ccc;padding:4px;width:100%;box-sizing:border-box" /></div>` })
class Ex34Field { label = ''; placeholder = ''; }
@Component({ selector: 'ex-34', standalone: true, imports: [Ex34Field], template: `<form><ex-34-field label="Name" placeholder="Enter name" /><ex-34-field label="Email" placeholder="Enter email" /></form>` })
class Ex34 {}

// 35. Table with reusable row component
@Component({ selector: 'ex-35-row', standalone: true, template: `<tr><td style="padding:4px 8px">{{ col1 }}</td><td style="padding:4px 8px">{{ col2 }}</td></tr>` })
class Ex35Row { col1 = ''; col2 = ''; }
@Component({ selector: 'ex-35', standalone: true, imports: [Ex35Row], template: `<table border="1" cellspacing="0"><tr style="background:#eee"><th>Name</th><th>Role</th></tr><ex-35-row col1="Alice" col2="Admin" /><ex-35-row col1="Bob" col2="User" /></table>` })
class Ex35 {}

// 36. Nav with reusable link component
@Component({ selector: 'ex-36-link', standalone: true, template: `<a [href]="href" style="margin-right:12px;text-decoration:none;color:steelblue">{{ label }}</a>` })
class Ex36Link { href = '#'; label = ''; }
@Component({ selector: 'ex-36', standalone: true, imports: [Ex36Link], template: `<nav><ex-36-link href="#home" label="Home" /><ex-36-link href="#about" label="About" /><ex-36-link href="#contact" label="Contact" /></nav>` })
class Ex36 {}

// 37. Accordion with multiple panel components
@Component({ selector: 'ex-37-panel', standalone: true, template: `<div style="border:1px solid #ddd;margin-bottom:4px"><div (click)="open = !open" style="padding:8px;cursor:pointer;background:#f5f5f5;font-weight:bold">{{ title }} {{ open ? '▲' : '▼' }}</div>@if (open) { <div style="padding:8px"><ng-content /></div> }</div>` })
class Ex37Panel { title = ''; open = false; }
@Component({ selector: 'ex-37', standalone: true, imports: [Ex37Panel], template: `<ex-37-panel title="Section 1"><p>Content for section 1</p></ex-37-panel><ex-37-panel title="Section 2"><p>Content for section 2</p></ex-37-panel>` })
class Ex37 {}

// 38. Tabs with panel components
@Component({ selector: 'ex-38-tab', standalone: true, template: `@if (active) { <div style="padding:8px;border:1px solid #ccc;border-top:none"><ng-content /></div> }` })
class Ex38Tab { active = false; label = ''; }
@Component({
  selector: 'ex-38', standalone: true, imports: [Ex38Tab],
  template: `
    <div style="display:flex;gap:0">
      @for (t of tabs; track t; let i = $index) {
        <button (click)="active = i" [style.fontWeight]="active === i ? 'bold' : 'normal'" style="padding:6px 12px;border:1px solid #ccc;background:#f5f5f5;cursor:pointer">{{ t }}</button>
      }
    </div>
    @switch (active) {
      @case (0) { <div style="padding:8px;border:1px solid #ccc">Tab 1 content</div> }
      @case (1) { <div style="padding:8px;border:1px solid #ccc">Tab 2 content</div> }
      @case (2) { <div style="padding:8px;border:1px solid #ccc">Tab 3 content</div> }
    }
  `
})
class Ex38 { tabs = ['Tab 1', 'Tab 2', 'Tab 3']; active = 0; }

// ─── ADVANCED (39–50) ─────────────────────────────────────────

// 39. OnPush + signals — only re-renders when signal changes
@Component({ selector: 'ex-39', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush, template: `<p>Signal: {{ val() }}</p><button (click)="val.set(val() + 1)">Update Signal</button>` })
class Ex39 { val = signal(0); }

// 40. Component with afterNextRender
@Component({ selector: 'ex-40', standalone: true, template: `<p>afterNextRender fired once (check console)</p>` })
class Ex40 {
  constructor() { afterNextRender(() => console.log('[Ex40] afterNextRender fired once')); }
}

// 41. Component with input.required<string>()
@Component({ selector: 'ex-41-inner', standalone: true, template: `<p>Required input: {{ name() }}</p>` })
class Ex41Inner { name = input.required<string>(); }
@Component({ selector: 'ex-41', standalone: true, imports: [Ex41Inner], template: `<ex-41-inner name="Angular" />` })
class Ex41 {}

// 42. Component with model() for two-way binding
@Component({ selector: 'ex-42-field', standalone: true, template: `<input [value]="value()" (input)="value.set($any($event).target.value)" />` })
class Ex42Field { value = model(''); }
@Component({ selector: 'ex-42', standalone: true, imports: [Ex42Field], template: `<ex-42-field [(value)]="text" /><p>Parent sees: {{ text }}</p>` })
class Ex42 { text = 'hello'; }

// 43. Component with output() using OutputEmitterRef
@Component({ selector: 'ex-43-btn', standalone: true, template: `<button (click)="clicked.emit('ping')">Emit</button>` })
class Ex43Btn { clicked = output<string>(); }
@Component({ selector: 'ex-43', standalone: true, imports: [Ex43Btn], template: `<ex-43-btn (clicked)="onMsg($event)" /><p>{{ msg }}</p>` })
class Ex43 { msg = 'waiting...'; onMsg(m: string) { this.msg = m + ' at ' + new Date().toLocaleTimeString(); } }

// 44. Generic component pattern (type-safe list)
@Component({
  selector: 'ex-44', standalone: true,
  template: `<ul>@for (item of items; track item) { <li>{{ item }}</li> }</ul>`
})
class Ex44<T = string> { items: T[] = ['one', 'two', 'three'] as T[]; }

// 45. Component demonstrating zoneless-aware signals
@Component({ selector: 'ex-45', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush, template: `<p>Zoneless-ready count: {{ count() }}</p><button (click)="count.set(count() + 1)">+1</button>` })
class Ex45 { count = signal(0); }

// 46. Self-referential (recursive) component tree
@Component({ selector: 'ex-46-tree', standalone: true, template: `<div style="padding-left:12px"><span>{{ node.name }}</span>@if (node.children?.length) { @for (child of node.children; track child.name) { <ex-46-tree [node]="child" /> } }</div>` })
class Ex46Tree { node: { name: string; children?: typeof this.node[] } = { name: '' }; }
// Register self-reference after declaration
(Ex46Tree as any).ɵcmp.dependencies = [Ex46Tree];
@Component({ selector: 'ex-46', standalone: true, imports: [Ex46Tree], template: `<ex-46-tree [node]="tree" />` })
class Ex46 { tree = { name: 'Root', children: [{ name: 'Child A', children: [{ name: 'Grandchild' }] }, { name: 'Child B' }] }; }

// 47. Component with dynamic import simulation
@Component({ selector: 'ex-47', standalone: true, template: `<p>Dynamic load pattern: <strong>{{ status }}</strong></p><button (click)="load()">Load</button>` })
class Ex47 { status = 'not loaded'; load() { Promise.resolve('Loaded!').then(r => this.status = r); } }

// 48. Component that uses HOST_ELEMENT injection
@Component({ selector: 'ex-48', standalone: true, host: { '[attr.data-component]': '"ex-48"', '[style.display]': '"block"' }, template: `<p>Host element has data-component attribute set via host: {}</p>` })
class Ex48 {}

// 49. Hybrid component — signals + observable via toSignal
import { toSignal } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
@Component({ selector: 'ex-49', standalone: true, template: `<p>Tick: {{ tick() }}</p>` })
class Ex49 {
  tick = toSignal(interval(1000), { initialValue: 0 });
}

// 50. Full lifecycle component
@Component({ selector: 'ex-50', standalone: true, template: `<p>Lifecycle: {{ phase }}</p>` })
class Ex50 implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  phase = 'constructed';
  ngOnChanges(_: SimpleChanges) { this.phase = 'onChanges'; }
  ngOnInit() { this.phase = 'onInit'; }
  ngAfterViewInit() { this.phase = 'afterViewInit'; }
  ngOnDestroy() { console.log('[Ex50] destroyed'); }
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
      <h1>Examples 1.2 — Components</h1>
      <h4>1. Simplest standalone component</h4><ex-01 /><hr />
      <h4>2. Component with a property</h4><ex-02 /><hr />
      <h4>3. Component with a method</h4><ex-03 /><hr />
      <h4>4. Component with inline styles</h4><ex-04 /><hr />
      <h4>5. Component with styles array</h4><ex-05 /><hr />
      <h4>6. Component with ViewEncapsulation.None</h4><ex-06 /><hr />
      <h4>7. Component with ViewEncapsulation.ShadowDom</h4><ex-07 /><hr />
      <h4>8. Component with changeDetection: OnPush</h4><ex-08 /><hr />
      <h4>9. Component with host binding via host: {}</h4><ex-09 /><hr />
      <h4>10. Component with templateUrl pattern (inline)</h4><ex-10 /><hr />
      <h4>11. Component that renders another component</h4><ex-11 /><hr />
      <h4>12. Component with conditional template</h4><ex-12 /><hr />
      <h4>13. Component with computed class name</h4><ex-13 /><hr />
      <h4>14. Parent-child composition</h4><ex-14 /><hr />
      <h4>15. Component with signal state</h4><ex-15 /><hr />
      <h4>16. Component with computed</h4><ex-16 /><hr />
      <h4>17. Component with effect</h4><ex-17 /><hr />
      <h4>18. Component with DestroyRef cleanup</h4><ex-18 /><hr />
      <h4>19. Component using inject()</h4><ex-19 /><hr />
      <h4>20. Component with afterRender callback</h4><ex-20 /><hr />
      <h4>21. Component with @ViewChild</h4><ex-21 /><hr />
      <h4>22. Component with @ContentChild</h4><ex-22 /><hr />
      <h4>23. Component with multiple @ViewChild refs</h4><ex-23 /><hr />
      <h4>24. Component with ng-container</h4><ex-24 /><hr />
      <h4>25. Component with ng-template</h4><ex-25 /><hr />
      <h4>26. Component with dynamic title via signal</h4><ex-26 /><hr />
      <h4>27. Three-level component hierarchy</h4><ex-27 /><hr />
      <h4>28. Sibling components sharing parent state</h4><ex-28 /><hr />
      <h4>29. Component with header/body/footer slots</h4><ex-29 /><hr />
      <h4>30. List component using child item component</h4><ex-30 /><hr />
      <h4>31. Card component wrapping content</h4><ex-31 /><hr />
      <h4>32. Shell component with dynamic slot</h4><ex-32 /><hr />
      <h4>33. Dashboard with multiple widget components</h4><ex-33 /><hr />
      <h4>34. Form with reusable field component</h4><ex-34 /><hr />
      <h4>35. Table with reusable row component</h4><ex-35 /><hr />
      <h4>36. Nav with reusable link component</h4><ex-36 /><hr />
      <h4>37. Accordion with multiple panel components</h4><ex-37 /><hr />
      <h4>38. Tabs with panel components</h4><ex-38 /><hr />
      <h4>39. OnPush + signals</h4><ex-39 /><hr />
      <h4>40. Component with afterNextRender</h4><ex-40 /><hr />
      <h4>41. input.required&lt;string&gt;()</h4><ex-41 /><hr />
      <h4>42. model() for two-way binding</h4><ex-42 /><hr />
      <h4>43. output() using OutputEmitterRef</h4><ex-43 /><hr />
      <h4>44. Generic component pattern</h4><ex-44 /><hr />
      <h4>45. Zoneless-aware component</h4><ex-45 /><hr />
      <h4>46. Recursive component tree</h4><ex-46 /><hr />
      <h4>47. Dynamic import simulation</h4><ex-47 /><hr />
      <h4>48. HOST_ELEMENT via host: {}</h4><ex-48 /><hr />
      <h4>49. Hybrid signals + observable (toSignal)</h4><ex-49 /><hr />
      <h4>50. Full lifecycle: init, change, destroy, afterView</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
