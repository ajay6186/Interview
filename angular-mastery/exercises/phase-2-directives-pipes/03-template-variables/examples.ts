import {
  Component, signal, computed, ViewChild, ViewChildren, ContentChild, ContentChildren,
  ElementRef, QueryList, AfterViewInit, AfterContentInit, input, output,
  viewChild, viewChildren, contentChild, contentChildren,
  TemplateRef, ViewContainerRef, EmbeddedViewRef, DestroyRef, inject,
  afterNextRender
} from '@angular/core';

// ============================================================
// Examples 2.3 — Template Variables (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. Template reference #myInput reading .value
@Component({
  selector: 'ex-01', standalone: true,
  template: `
    <input #myInput placeholder="Type something..." style="padding:6px;border-radius:4px;border:1px solid #ccc;" />
    <button (click)="log(myInput.value)" style="margin-left:8px;padding:6px 12px;">Log</button>
    <p>Last value: {{ last }}</p>`
})
class Ex01 { last = ''; log(v: string) { this.last = v; } }

// 2. #btn to access button element
@Component({
  selector: 'ex-02', standalone: true,
  template: `
    <button #btn (click)="inspect(btn)" style="padding:6px 12px;border-radius:4px;border:1px solid #ccc;">Inspect Me</button>
    <p style="font-size:13px;color:#555;">{{ info }}</p>`
})
class Ex02 {
  info = '';
  inspect(btn: HTMLButtonElement) {
    this.info = `tag=${btn.tagName}, text="${btn.textContent?.trim()}", offsetWidth=${btn.offsetWidth}`;
  }
}

// 3. Template variable on component — #child to call method
@Component({
  selector: 'ex-03-child', standalone: true,
  template: `<p>Counter: <strong>{{ count }}</strong></p>`
})
class Ex03Child { count = 0; increment() { this.count++; } reset() { this.count = 0; } }

@Component({
  selector: 'ex-03', standalone: true, imports: [Ex03Child],
  template: `
    <ex-03-child #child />
    <button (click)="child.increment()">Increment</button>
    <button (click)="child.reset()">Reset</button>`
})
class Ex03 {}

// 4. (click)="logValue(myInput.value)" pattern
@Component({
  selector: 'ex-04', standalone: true,
  template: `
    <input #searchInput placeholder="Search..." (keydown.enter)="search(searchInput.value)"
      style="padding:6px;border-radius:4px;border:1px solid #ccc;width:200px;" />
    <button (click)="search(searchInput.value)" style="margin-left:6px;padding:6px 12px;">Search</button>
    <p>Query: <strong>{{ query }}</strong></p>`
})
class Ex04 { query = ''; search(v: string) { this.query = v; } }

// 5. Template variable in same template for multiple interactions
@Component({
  selector: 'ex-05', standalone: true,
  template: `
    <input #a placeholder="First name" style="padding:6px;border:1px solid #ccc;border-radius:4px;" />
    <input #b placeholder="Last name" style="padding:6px;border:1px solid #ccc;border-radius:4px;margin-left:6px;" />
    <button (click)="greet(a.value, b.value)" style="margin-left:6px;padding:6px 12px;">Greet</button>
    <p>{{ message }}</p>`
})
class Ex05 { message = ''; greet(a: string, b: string) { this.message = `Hello, ${a} ${b}!`; } }

// 6. #form="ngForm" — access NgForm state (no-forms version)
@Component({
  selector: 'ex-06', standalone: true,
  template: `
    <div style="border:1px solid #ddd;padding:12px;border-radius:8px;max-width:280px;">
      <input #emailRef placeholder="Email" (input)="emailVal = emailRef.value"
        style="padding:6px;border:1px solid #ccc;border-radius:4px;width:100%;box-sizing:border-box;" />
      <p style="font-size:13px;margin-top:6px;">
        Valid: {{ emailVal.includes('@') ? '✅' : '❌' }} |
        Dirty: {{ emailVal.length > 0 ? 'yes' : 'no' }}
      </p>
    </div>`
})
class Ex06 { emailVal = ''; }

// 7. Auto-focus with template ref on init
@Component({
  selector: 'ex-07', standalone: true,
  template: `
    <p style="font-size:13px;color:#555;">Input is auto-focused via ViewChild on init.</p>
    <input #focusMe placeholder="Auto-focused!" style="padding:6px;border:1px solid #ccc;border-radius:4px;" />`
})
class Ex07 implements AfterViewInit {
  @ViewChild('focusMe') focusMe!: ElementRef<HTMLInputElement>;
  ngAfterViewInit() { this.focusMe.nativeElement.focus(); }
}

// 8. Input character count with template ref
@Component({
  selector: 'ex-08', standalone: true,
  template: `
    <div style="position:relative;display:inline-block;">
      <textarea #ta (input)="count = ta.value.length" maxlength="140"
        placeholder="What's happening? (max 140)"
        style="padding:8px;border:1px solid #ccc;border-radius:4px;width:280px;height:80px;resize:none;"></textarea>
      <span style="position:absolute;bottom:6px;right:8px;font-size:12px;color:#888;">{{ count }}/140</span>
    </div>`
})
class Ex08 { count = 0; }

// 9. Password show/hide with template ref
@Component({
  selector: 'ex-09', standalone: true,
  template: `
    <div style="display:flex;gap:6px;align-items:center;">
      <input #passInput type="password" value="s3cr3tP@ss!"
        style="padding:6px;border:1px solid #ccc;border-radius:4px;" />
      <button (click)="toggle(passInput)" style="padding:6px 10px;border-radius:4px;border:1px solid #ccc;">
        {{ visible ? 'Hide' : 'Show' }}
      </button>
    </div>`
})
class Ex09 {
  visible = false;
  toggle(inp: HTMLInputElement) {
    this.visible = !this.visible;
    inp.type = this.visible ? 'text' : 'password';
  }
}

// 10. Copy-to-clipboard with template ref
@Component({
  selector: 'ex-10', standalone: true,
  template: `
    <div style="display:flex;gap:6px;align-items:center;">
      <input #copyInput value="npm install @angular/core" readonly
        style="padding:6px;border:1px solid #ccc;border-radius:4px;width:220px;" />
      <button (click)="copy(copyInput)" style="padding:6px 10px;border-radius:4px;border:none;background:#007bff;color:#fff;cursor:pointer;">
        {{ copied ? '✅ Copied' : '📋 Copy' }}
      </button>
    </div>`
})
class Ex10 {
  copied = false;
  copy(inp: HTMLInputElement) {
    navigator.clipboard?.writeText(inp.value).catch(() => {});
    this.copied = true;
    setTimeout(() => this.copied = false, 2000);
  }
}

// 11. Reset input via template ref .value = ''
@Component({
  selector: 'ex-11', standalone: true,
  template: `
    <div style="display:flex;gap:6px;align-items:center;">
      <input #inp placeholder="Type something..." style="padding:6px;border:1px solid #ccc;border-radius:4px;" />
      <button (click)="inp.value = ''; lastReset = true" style="padding:6px 10px;border:1px solid #ccc;border-radius:4px;">Clear</button>
    </div>
    @if (lastReset) { <p style="color:green;font-size:13px;">Input cleared!</p> }`
})
class Ex11 { lastReset = false; }

// 12. Read select element value via template ref
@Component({
  selector: 'ex-12', standalone: true,
  template: `
    <select #sel (change)="selected = sel.value" style="padding:6px;border-radius:4px;border:1px solid #ccc;">
      <option>--</option>
      <option value="angular">Angular</option>
      <option value="react">React</option>
      <option value="vue">Vue</option>
    </select>
    <p>Selected: <strong>{{ selected }}</strong></p>`
})
class Ex12 { selected = '--'; }

// 13. Read textarea value via template ref
@Component({
  selector: 'ex-13', standalone: true,
  template: `
    <textarea #notes placeholder="Write notes..." rows="4"
      style="padding:8px;border:1px solid #ccc;border-radius:4px;width:100%;box-sizing:border-box;resize:vertical;"></textarea>
    <button (click)="save(notes.value)" style="margin-top:6px;padding:6px 14px;border-radius:4px;border:none;background:#28a745;color:#fff;cursor:pointer;">Save</button>
    @if (saved) { <p style="color:green;">Saved: "{{ preview }}"</p> }`
})
class Ex13 {
  saved = false; preview = '';
  save(v: string) { this.saved = true; this.preview = v.slice(0, 40); }
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────

// 14. @ViewChild — get reference to component
@Component({ selector: 'ex-14-child', standalone: true, template: `<p>Child count: {{ n }}</p>` })
class Ex14Child { n = 0; add(x = 1) { this.n += x; } }
@Component({
  selector: 'ex-14', standalone: true, imports: [Ex14Child],
  template: `
    <ex-14-child />
    <button (click)="addToChild()">Add via ViewChild</button>`
})
class Ex14 implements AfterViewInit {
  @ViewChild(Ex14Child) child!: Ex14Child;
  ngAfterViewInit() {}
  addToChild() { this.child.add(5); }
}

// 15. @ViewChild — get reference to directive (ElementRef via selector)
@Component({
  selector: 'ex-15', standalone: true,
  template: `
    <p #targetPara style="padding:8px;border:1px solid transparent;border-radius:4px;">Target paragraph</p>
    <button (click)="highlight()">Highlight</button>
    <button (click)="reset()">Reset</button>`
})
class Ex15 implements AfterViewInit {
  @ViewChild('targetPara') para!: ElementRef<HTMLParagraphElement>;
  ngAfterViewInit() {}
  highlight() { this.para.nativeElement.style.cssText = 'background:#fff3cd;border-color:#ffc107;padding:8px;border-radius:4px;'; }
  reset() { this.para.nativeElement.style.cssText = 'padding:8px;border:1px solid transparent;border-radius:4px;'; }
}

// 16. @ViewChild — get ElementRef to native element
@Component({
  selector: 'ex-16', standalone: true,
  template: `
    <div #box style="width:100px;height:100px;background:#dbeafe;border-radius:4px;transition:all 0.3s;"></div>
    <button style="margin-top:8px;" (click)="measure()">Measure</button>
    <p style="font-size:13px;">{{ info }}</p>`
})
class Ex16 implements AfterViewInit {
  @ViewChild('box') box!: ElementRef<HTMLDivElement>;
  info = '';
  ngAfterViewInit() {}
  measure() {
    const r = this.box.nativeElement.getBoundingClientRect();
    this.info = `w=${Math.round(r.width)}, h=${Math.round(r.height)}, top=${Math.round(r.top)}`;
  }
}

// 17. @ViewChild({ static: true }) vs default
@Component({
  selector: 'ex-17', standalone: true,
  template: `
    <h5 #staticTitle>Static title (available in ngOnInit)</h5>
    @if (show) { <p #dynamicPara>Dynamic paragraph (needs ngAfterViewInit)</p> }
    <button (click)="show = !show">Toggle paragraph</button>
    <p style="font-size:13px;">Static: {{ staticText }} | Dynamic: {{ dynamicText }}</p>`
})
class Ex17 implements AfterViewInit {
  show = true;
  staticText = '';
  dynamicText = '';
  @ViewChild('staticTitle', { static: true }) staticTitle!: ElementRef;
  @ViewChild('dynamicPara') dynamicPara?: ElementRef;
  ngAfterViewInit() {
    this.staticText = this.staticTitle.nativeElement.textContent.trim().slice(0, 12);
    this.dynamicText = this.dynamicPara?.nativeElement?.textContent?.trim()?.slice(0, 12) ?? 'n/a';
  }
}

// 18. @ViewChildren — QueryList of elements
@Component({
  selector: 'ex-18', standalone: true,
  template: `
    <div style="display:flex;gap:6px;">
      @for (item of items; track item) {
        <div #card style="padding:10px;background:#e0e7ff;border-radius:4px;cursor:pointer;"
          (click)="select(card)">{{ item }}</div>
      }
    </div>
    <button style="margin-top:8px;" (click)="highlightAll()">Highlight All</button>
    <p style="font-size:13px;">Count: {{ count }}</p>`
})
class Ex18 implements AfterViewInit {
  @ViewChildren('card') cards!: QueryList<ElementRef>;
  items = ['A', 'B', 'C', 'D'];
  count = 0;
  ngAfterViewInit() { this.count = this.cards.length; }
  highlightAll() { this.cards.forEach(c => { c.nativeElement.style.background = '#fef3c7'; }); }
  select(el: HTMLElement) { el.style.background = '#d1fae5'; }
}

// 19. @ContentChild — project and query child
@Component({
  selector: 'ex-19-wrapper', standalone: true,
  template: `
    <div style="border:2px solid #3b82f6;border-radius:8px;padding:12px;">
      <ng-content />
    </div>`
})
class Ex19Wrapper implements AfterContentInit {
  @ContentChild('projectedBtn') btn?: ElementRef;
  ngAfterContentInit() {
    if (this.btn) { this.btn.nativeElement.style.background = '#3b82f6'; this.btn.nativeElement.style.color = '#fff'; }
  }
}
@Component({
  selector: 'ex-19', standalone: true, imports: [Ex19Wrapper],
  template: `
    <ex-19-wrapper>
      <button #projectedBtn style="padding:6px 14px;border:none;border-radius:4px;cursor:pointer;">Projected Button (styled by ContentChild)</button>
    </ex-19-wrapper>`
})
class Ex19 {}

// 20. @ContentChildren — QueryList of projected
@Component({
  selector: 'ex-20-list', standalone: true,
  template: `<div style="border:1px solid #ddd;border-radius:8px;padding:12px;"><ng-content /></div>`
})
class Ex20List implements AfterContentInit {
  @ContentChildren('item') items!: QueryList<ElementRef>;
  ngAfterContentInit() {
    this.items.forEach((el, i) => {
      el.nativeElement.style.background = `hsl(${i * 40}, 70%, 90%)`;
      el.nativeElement.style.borderRadius = '4px';
    });
  }
}
@Component({
  selector: 'ex-20', standalone: true, imports: [Ex20List],
  template: `
    <ex-20-list>
      <p #item style="padding:6px 10px;margin:4px 0;">Item Alpha</p>
      <p #item style="padding:6px 10px;margin:4px 0;">Item Beta</p>
      <p #item style="padding:6px 10px;margin:4px 0;">Item Gamma</p>
    </ex-20-list>`
})
class Ex20 {}

// 21. @ViewChild to call child method
@Component({ selector: 'ex-21-toast', standalone: true, template: `@if (show) { <div style="padding:10px;background:#333;color:#fff;border-radius:6px;display:inline-block;">{{ msg }}</div> }` })
class Ex21Toast { show = false; msg = ''; display(m: string) { this.msg = m; this.show = true; setTimeout(() => this.show = false, 2000); } }
@Component({
  selector: 'ex-21', standalone: true, imports: [Ex21Toast],
  template: `
    <ex-21-toast />
    <button style="padding:6px 14px;border-radius:4px;border:none;background:#333;color:#fff;cursor:pointer;" (click)="toast.display('Hello from ViewChild!')">Show Toast</button>`
})
class Ex21 implements AfterViewInit {
  @ViewChild(Ex21Toast) toast!: Ex21Toast;
  ngAfterViewInit() {}
}

// 22. @ViewChild to read child signal
@Component({ selector: 'ex-22-counter', standalone: true, template: `<p>Internal count: {{ count() }}</p>` })
class Ex22Counter { count = signal(0); increment() { this.count.update(v => v + 1); } }
@Component({
  selector: 'ex-22', standalone: true, imports: [Ex22Counter],
  template: `
    <ex-22-counter />
    <button (click)="inc()">Increment child</button>
    <p style="font-size:13px;">Parent reads child signal: {{ childCount() }}</p>`
})
class Ex22 implements AfterViewInit {
  @ViewChild(Ex22Counter) child!: Ex22Counter;
  childCount = signal(0);
  ngAfterViewInit() {}
  inc() { this.child.increment(); this.childCount.set(this.child.count()); }
}

// 23. Template ref + @if visibility trick
@Component({
  selector: 'ex-23', standalone: true,
  template: `
    <button (click)="visible = !visible">{{ visible ? 'Hide' : 'Show' }} Details</button>
    @if (visible) {
      <div #details style="margin-top:8px;padding:12px;background:#f0f9ff;border-radius:6px;border:1px solid #bae6fd;">
        Revealed content! (DOM ref available only while shown)
      </div>
    }`
})
class Ex23 { visible = false; }

// 24. Template ref with keyboard shortcut (focus)
@Component({
  selector: 'ex-24', standalone: true,
  template: `
    <p style="font-size:13px;color:#888;">Press Ctrl+K to focus the search bar</p>
    <input #search placeholder="Search (Ctrl+K)..."
      style="padding:6px;border:1px solid #ccc;border-radius:4px;width:220px;"
      (keydown.escape)="search.blur()" />`,
  host: { '(document:keydown.control.k)': 'focusSearch($event)' }
})
class Ex24 {
  @ViewChild('search') searchEl!: ElementRef<HTMLInputElement>;
  focusSearch(e: Event) { e.preventDefault(); this.searchEl?.nativeElement?.focus(); }
}

// 25. Multiple template refs in one template
@Component({
  selector: 'ex-25', standalone: true,
  template: `
    <input #first placeholder="First" style="padding:6px;border:1px solid #ccc;border-radius:4px;" (keydown.tab)="second.focus()" />
    <input #second placeholder="Second" style="padding:6px;border:1px solid #ccc;border-radius:4px;margin-left:6px;" (keydown.tab)="third.focus()" />
    <input #third placeholder="Third" style="padding:6px;border:1px solid #ccc;border-radius:4px;margin-left:6px;" />
    <button (click)="collect(first.value, second.value, third.value)" style="margin-left:6px;padding:6px 12px;border-radius:4px;border:1px solid #ccc;">Collect</button>
    <p>{{ result }}</p>`
})
class Ex25 { result = ''; collect(a: string, b: string, c: string) { this.result = [a, b, c].join(' | '); } }

// 26. Template ref on <ng-template> for TemplateRef
@Component({
  selector: 'ex-26', standalone: true,
  template: `
    <ng-template #myTpl let-name>
      <div style="padding:10px;background:#ecfdf5;border-radius:6px;border:1px solid #6ee7b7;">
        Hello, <strong>{{ name }}</strong>! (rendered from ng-template)
      </div>
    </ng-template>
    <div #outlet></div>
    <button (click)="render()" style="margin-top:8px;padding:6px 14px;border-radius:4px;border:1px solid #ccc;">Render Template</button>
    <button (click)="clear()" style="margin-left:6px;padding:6px 14px;border-radius:4px;border:1px solid #ccc;">Clear</button>`
})
class Ex26 implements AfterViewInit {
  @ViewChild('myTpl') tpl!: TemplateRef<any>;
  @ViewChild('outlet', { read: ViewContainerRef }) outlet!: ViewContainerRef;
  ngAfterViewInit() {}
  render() { this.outlet.clear(); this.outlet.createEmbeddedView(this.tpl, { $implicit: 'Angular Dev' }); }
  clear() { this.outlet.clear(); }
}

// ─── NESTED (27–38) ─────────────────────────────────────────

// 27. Parent @ViewChild accessing child component's signal
@Component({ selector: 'ex-27-child', standalone: true, template: `<p>Items: {{ items().join(', ') }}</p>` })
class Ex27Child { items = signal(['A', 'B', 'C']); addItem(x: string) { this.items.update(l => [...l, x]); } }
@Component({
  selector: 'ex-27', standalone: true, imports: [Ex27Child],
  template: `
    <ex-27-child />
    <div style="display:flex;gap:6px;margin-top:8px;">
      <input #newItem placeholder="New item" style="padding:6px;border:1px solid #ccc;border-radius:4px;" />
      <button (click)="addViaViewChild(newItem)" style="padding:6px 12px;border-radius:4px;border:1px solid #ccc;">Add</button>
    </div>`
})
class Ex27 implements AfterViewInit {
  @ViewChild(Ex27Child) child!: Ex27Child;
  ngAfterViewInit() {}
  addViaViewChild(inp: HTMLInputElement) { if (inp.value) { this.child.addItem(inp.value); inp.value = ''; } }
}

// 28. @ViewChildren iterating all child refs
@Component({ selector: 'ex-28-item', standalone: true, template: `<div style="padding:8px;background:#e0e7ff;border-radius:4px;">{{ label }}</div>` })
class Ex28Item { label = ''; }
@Component({
  selector: 'ex-28', standalone: true, imports: [Ex28Item],
  template: `
    <div style="display:flex;gap:6px;flex-wrap:wrap;">
      @for (l of labels; track l) { <ex-28-item [label]="l" /> }
    </div>
    <button style="margin-top:8px;" (click)="logAll()">Log All Labels</button>
    <p style="font-size:13px;">{{ logged }}</p>`
})
class Ex28 implements AfterViewInit {
  @ViewChildren(Ex28Item) items!: QueryList<Ex28Item>;
  labels = ['One', 'Two', 'Three', 'Four'];
  logged = '';
  ngAfterViewInit() {}
  logAll() { this.logged = this.items.map(i => i.label).join(', '); }
}

// 29. @ContentChild for custom wrapper component
@Component({
  selector: 'ex-29-card', standalone: true,
  template: `
    <div style="border:1px solid #ddd;border-radius:8px;overflow:hidden;">
      <div style="padding:10px;background:#f8fafc;border-bottom:1px solid #eee;font-weight:bold;" #header>
        <ng-content select="[slot=header]" />
      </div>
      <div style="padding:12px;"><ng-content /></div>
    </div>`
})
class Ex29Card {}
@Component({
  selector: 'ex-29', standalone: true, imports: [Ex29Card],
  template: `
    <ex-29-card>
      <span slot="header">Card Title via Projection</span>
      <p>Body content goes here. ContentChild can access projected elements.</p>
    </ex-29-card>`
})
class Ex29 {}

// 30. Template ref passed to another component
@Component({
  selector: 'ex-30-host', standalone: true,
  template: `
    <div style="border:2px dashed #94a3b8;padding:12px;border-radius:8px;min-height:40px;">
      @if (tpl) {
        <ng-container [ngTemplateOutlet]="tpl" [ngTemplateOutletContext]="{ $implicit: 'Injected!' }" />
      } @else {
        <span style="color:#94a3b8;">No template provided</span>
      }
    </div>`,
  imports: []
})
class Ex30Host {
  tpl: TemplateRef<any> | null = null;
}
@Component({
  selector: 'ex-30', standalone: true, imports: [Ex30Host],
  template: `
    <ng-template #myTpl let-ctx>
      <p style="background:#fef3c7;padding:8px;border-radius:4px;margin:0;">Template context: {{ ctx }}</p>
    </ng-template>
    <ex-30-host #host />
    <button style="margin-top:8px;" (click)="inject()">Inject Template</button>
    <button style="margin-left:6px;" (click)="host.tpl = null">Clear</button>`
})
class Ex30 implements AfterViewInit {
  @ViewChild('myTpl') myTpl!: TemplateRef<any>;
  @ViewChild(Ex30Host) host!: Ex30Host;
  ngAfterViewInit() {}
  inject() { this.host.tpl = this.myTpl; }
}

// 31. @ViewChild on dynamically added element (via @if)
@Component({
  selector: 'ex-31', standalone: true,
  template: `
    <button (click)="show = !show">{{ show ? 'Hide' : 'Show' }} Target</button>
    @if (show) { <div #dynamic style="padding:10px;background:#dbeafe;border-radius:4px;margin-top:8px;">Dynamic element</div> }
    <button (click)="measure()" style="margin-top:8px;display:block;">Measure</button>
    <p style="font-size:13px;">{{ info }}</p>`
})
class Ex31 implements AfterViewInit {
  @ViewChild('dynamic') dynamic?: ElementRef;
  show = false;
  info = '';
  ngAfterViewInit() {}
  measure() {
    if (this.dynamic) {
      const r = this.dynamic.nativeElement.getBoundingClientRect();
      this.info = `w=${Math.round(r.width)}, h=${Math.round(r.height)}`;
    } else {
      this.info = 'Element not in DOM yet';
    }
  }
}

// 32. @ViewChild to measure element size
@Component({
  selector: 'ex-32', standalone: true,
  template: `
    <div #measurable [style.width]="width() + 'px'" style="background:#e0e7ff;height:60px;border-radius:4px;display:flex;align-items:center;justify-content:center;transition:width 0.3s;">
      {{ width() }}px wide
    </div>
    <input type="range" min="100" max="600" [value]="width()" (input)="width.set(+$any($event.target).value)" style="width:100%;margin-top:8px;" />`
})
class Ex32 { width = signal(300); }

// 33. @ViewChild for scrollTo behavior
@Component({
  selector: 'ex-33', standalone: true,
  template: `
    <div #container style="height:150px;overflow-y:auto;border:1px solid #ddd;border-radius:4px;">
      @for (item of items; track item) {
        <div style="padding:10px;border-bottom:1px solid #eee;">Item {{ item }}</div>
      }
    </div>
    <div style="display:flex;gap:6px;margin-top:8px;">
      <button (click)="scrollTop()">Top</button>
      <button (click)="scrollBottom()">Bottom</button>
    </div>`
})
class Ex33 implements AfterViewInit {
  @ViewChild('container') container!: ElementRef<HTMLDivElement>;
  items = Array.from({ length: 20 }, (_, i) => i + 1);
  ngAfterViewInit() {}
  scrollTop() { this.container.nativeElement.scrollTo({ top: 0, behavior: 'smooth' }); }
  scrollBottom() { this.container.nativeElement.scrollTo({ top: 9999, behavior: 'smooth' }); }
}

// 34. @ViewChildren with changes subscription
@Component({
  selector: 'ex-34', standalone: true,
  template: `
    <ul style="list-style:none;padding:0;">
      @for (item of items(); track item) {
        <li #listItem style="padding:6px 10px;border-bottom:1px solid #eee;">{{ item }}</li>
      }
    </ul>
    <button (click)="addItem()" style="margin-top:8px;">Add Item</button>
    <p style="font-size:13px;">ViewChildren count: {{ itemCount }}</p>`
})
class Ex34 implements AfterViewInit {
  @ViewChildren('listItem') listItems!: QueryList<ElementRef>;
  items = signal(['First', 'Second', 'Third']);
  itemCount = 0;
  ngAfterViewInit() {
    this.itemCount = this.listItems.length;
    this.listItems.changes.subscribe(() => { this.itemCount = this.listItems.length; });
  }
  addItem() { this.items.update(l => [...l, `Item ${l.length + 1}`]); }
}

// 35. Template refs for form fields validation
@Component({
  selector: 'ex-35', standalone: true,
  template: `
    <form style="display:flex;flex-direction:column;gap:8px;max-width:280px;" (submit)="submit($event)">
      <input #name placeholder="Name" required
        style="padding:6px;border:2px solid #ccc;border-radius:4px;"
        [style.border-color]="submitted && !name.value ? 'red' : '#ccc'" />
      <input #email placeholder="Email" type="email"
        style="padding:6px;border:2px solid #ccc;border-radius:4px;"
        [style.border-color]="submitted && !email.value.includes('@') ? 'red' : '#ccc'" />
      <button type="submit" style="padding:8px;border-radius:4px;border:none;background:#007bff;color:#fff;cursor:pointer;">Submit</button>
      @if (submitted && result) { <p style="color:green;">{{ result }}</p> }
    </form>`
})
class Ex35 {
  submitted = false;
  result = '';
  submit(e: Event) {
    e.preventDefault();
    this.submitted = true;
    const form = (e.target as HTMLFormElement);
    const name = (form.elements[0] as HTMLInputElement).value;
    const email = (form.elements[1] as HTMLInputElement).value;
    if (name && email.includes('@')) this.result = `Submitted: ${name} <${email}>`;
  }
}

// 36. @ContentChildren for tab panel pattern
@Component({ selector: 'ex-36-tab', standalone: true, template: `@if (active) { <div style="padding:12px;"><ng-content /></div> }` })
class Ex36Tab { title = ''; active = false; }
@Component({
  selector: 'ex-36-tabs', standalone: true, imports: [Ex36Tab],
  template: `
    <div style="display:flex;border-bottom:2px solid #ddd;">
      @for (tab of tabs; track tab.title) {
        <div (click)="activate(tab)" style="padding:8px 16px;cursor:pointer;"
          [style.border-bottom]="tab.active ? '2px solid #3b82f6' : 'none'"
          [style.color]="tab.active ? '#3b82f6' : '#333'"
          [style.font-weight]="tab.active ? 'bold' : 'normal'"
          [style.margin-bottom]="'-2px'">{{ tab.title }}</div>
      }
    </div>
    <ng-content />`
})
class Ex36Tabs implements AfterContentInit {
  @ContentChildren(Ex36Tab) tabs!: QueryList<Ex36Tab>;
  ngAfterContentInit() { this.activate(this.tabs.first); }
  activate(tab: Ex36Tab) { this.tabs.forEach(t => t.active = false); tab.active = true; }
}
@Component({
  selector: 'ex-36', standalone: true, imports: [Ex36Tabs, Ex36Tab],
  template: `
    <ex-36-tabs>
      <ex-36-tab title="Overview">Overview content goes here.</ex-36-tab>
      <ex-36-tab title="Details">Details and specifications.</ex-36-tab>
      <ex-36-tab title="Reviews">Customer reviews (4.5 stars).</ex-36-tab>
    </ex-36-tabs>`
})
class Ex36 {}

// 37. @ViewChild for canvas drawing
@Component({
  selector: 'ex-37', standalone: true,
  template: `
    <canvas #canvas width="280" height="100" style="border:1px solid #ddd;border-radius:4px;cursor:crosshair;"></canvas>
    <div style="display:flex;gap:6px;margin-top:6px;">
      <button (click)="drawCircle()">Circle</button>
      <button (click)="drawRect()">Rect</button>
      <button (click)="clear()">Clear</button>
    </div>`
})
class Ex37 implements AfterViewInit {
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  ngAfterViewInit() { this.ctx = this.canvas.nativeElement.getContext('2d')!; }
  drawCircle() {
    this.ctx.beginPath();
    this.ctx.arc(Math.random() * 260 + 10, Math.random() * 80 + 10, 20, 0, Math.PI * 2);
    this.ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 60%)`;
    this.ctx.fill();
  }
  drawRect() {
    this.ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 60%)`;
    this.ctx.fillRect(Math.random() * 220, Math.random() * 60, 40, 30);
  }
  clear() { this.ctx.clearRect(0, 0, 280, 100); }
}

// 38. Nested template refs — parent-child-grandchild
@Component({ selector: 'ex-38-gchild', standalone: true, template: `<span style="padding:4px 8px;background:#fef9c3;border-radius:4px;font-size:13px;">Grandchild: {{ val }}</span>` })
class Ex38GChild { val = 'initial'; update(v: string) { this.val = v; } }
@Component({ selector: 'ex-38-child', standalone: true, imports: [Ex38GChild], template: `<div style="padding:8px;border:1px solid #ddd;border-radius:4px;">Child → <ex-38-gchild #gc /></div>` })
class Ex38Child implements AfterViewInit {
  @ViewChild('gc') gc!: Ex38GChild;
  ngAfterViewInit() {}
  updateGrandchild(v: string) { this.gc.update(v); }
}
@Component({
  selector: 'ex-38', standalone: true, imports: [Ex38Child],
  template: `
    <div style="padding:8px;border:1px solid #ccc;border-radius:6px;">
      Parent → <ex-38-child #child />
    </div>
    <div style="margin-top:8px;display:flex;gap:6px;">
      <input #msg placeholder="New value" style="padding:6px;border:1px solid #ccc;border-radius:4px;" />
      <button (click)="child.updateGrandchild(msg.value)">Update Grandchild</button>
    </div>`
})
class Ex38 {}

// ─── ADVANCED (39–50) ────────────────────────────────────────

// 39. ViewChild with signal-based timing (afterNextRender)
@Component({
  selector: 'ex-39', standalone: true,
  template: `
    <div #box style="padding:12px;background:#dbeafe;border-radius:4px;transition:opacity 0.5s;"
      [style.opacity]="opacity()">Box (fades in after render)</div>
    <p style="font-size:13px;">afterNextRender set opacity from 0 → 1</p>`
})
class Ex39 {
  @ViewChild('box') box?: ElementRef;
  opacity = signal(0);
  constructor() {
    afterNextRender(() => { setTimeout(() => this.opacity.set(1), 100); });
  }
}

// 40. Template ref as TemplateRef<any> — render manually
@Component({
  selector: 'ex-40', standalone: true,
  template: `
    <ng-template #cardTpl let-item>
      <div style="padding:12px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;">
        <strong>{{ item.title }}</strong>
        <p style="margin:4px 0 0;font-size:13px;color:#555;">{{ item.desc }}</p>
      </div>
    </ng-template>
    <div style="display:flex;flex-direction:column;gap:8px;" #outlet></div>
    <button style="margin-top:8px;" (click)="renderAll()">Render All Cards</button>
    <button style="margin-left:6px;" (click)="clearAll()">Clear</button>`
})
class Ex40 implements AfterViewInit {
  @ViewChild('cardTpl') cardTpl!: TemplateRef<any>;
  @ViewChild('outlet', { read: ViewContainerRef }) outlet!: ViewContainerRef;
  cards = [
    { title: 'Signals', desc: 'Fine-grained reactivity' },
    { title: 'Control Flow', desc: 'Built-in @if, @for, @switch' },
    { title: 'Defer', desc: 'Lazy loading blocks' },
  ];
  ngAfterViewInit() {}
  renderAll() {
    this.outlet.clear();
    this.cards.forEach(c => this.outlet.createEmbeddedView(this.cardTpl, { $implicit: c }));
  }
  clearAll() { this.outlet.clear(); }
}

// 41. ViewContainerRef for dynamic component creation
@Component({ selector: 'ex-41-dynamic', standalone: true, template: `<div style="padding:10px;background:#ecfdf5;border-radius:6px;border:1px solid #6ee7b7;margin-bottom:4px;">Dynamic Component #{{ id }}</div>` })
class Ex41Dynamic { id = 0; }
@Component({
  selector: 'ex-41', standalone: true,
  template: `
    <div #host></div>
    <div style="display:flex;gap:6px;margin-top:8px;">
      <button (click)="add()">Add Component</button>
      <button (click)="removeLast()">Remove Last</button>
    </div>
    <p style="font-size:13px;">Components: {{ count }}</p>`
})
class Ex41 implements AfterViewInit {
  @ViewChild('host', { read: ViewContainerRef }) host!: ViewContainerRef;
  count = 0;
  ngAfterViewInit() {}
  add() {
    const ref = this.host.createComponent(Ex41Dynamic);
    ref.instance.id = ++this.count;
    ref.changeDetectorRef.detectChanges();
  }
  removeLast() { if (this.host.length > 0) { this.host.remove(this.host.length - 1); this.count--; } }
}

// 42. EmbeddedView from ng-template
@Component({
  selector: 'ex-42', standalone: true,
  template: `
    <ng-template #rowTpl let-row let-i="index">
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">{{ i + 1 }}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">{{ row.name }}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">{{ row.score }}</td>
      </tr>
    </ng-template>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead><tr style="background:#f1f5f9;"><th style="padding:6px 10px;">#</th><th style="padding:6px 10px;">Name</th><th style="padding:6px 10px;">Score</th></tr></thead>
      <tbody #tableBody></tbody>
    </table>
    <button style="margin-top:8px;" (click)="populate()">Populate via EmbeddedView</button>`
})
class Ex42 implements AfterViewInit {
  @ViewChild('rowTpl') rowTpl!: TemplateRef<any>;
  @ViewChild('tableBody', { read: ViewContainerRef }) tableBody!: ViewContainerRef;
  rows = [{ name: 'Alice', score: 95 }, { name: 'Bob', score: 82 }, { name: 'Carol', score: 88 }];
  ngAfterViewInit() {}
  populate() {
    this.tableBody.clear();
    this.rows.forEach((row, i) => this.tableBody.createEmbeddedView(this.rowTpl, { $implicit: row, index: i }));
  }
}

// 43. ViewChild with DestroyRef cleanup
@Component({
  selector: 'ex-43', standalone: true,
  template: `
    <div #tickEl style="padding:12px;background:#f0fdf4;border-radius:6px;">Ticks: {{ ticks() }}</div>
    <div style="display:flex;gap:6px;margin-top:8px;">
      <button (click)="start()">Start</button>
      <button (click)="stop()">Stop</button>
    </div>
    <p style="font-size:12px;color:#888;">Timer cleaned up via DestroyRef on component destroy</p>`
})
class Ex43 {
  ticks = signal(0);
  private timer?: ReturnType<typeof setInterval>;
  private destroyRef = inject(DestroyRef);
  constructor() { this.destroyRef.onDestroy(() => this.stop()); }
  start() { this.stop(); this.timer = setInterval(() => this.ticks.update(v => v + 1), 500); }
  stop() { clearInterval(this.timer); }
}

// 44. ContentChild with signal update
@Component({
  selector: 'ex-44-wrapper', standalone: true,
  template: `<div style="border:2px solid #3b82f6;border-radius:8px;padding:12px;"><ng-content /></div>`
})
class Ex44Wrapper implements AfterContentInit {
  @ContentChild('badge') badge?: ElementRef;
  count = signal(0);
  ngAfterContentInit() {
    if (this.badge) this.badge.nativeElement.textContent = `Badge (${this.count()})`;
  }
  updateBadge(n: number) {
    this.count.set(n);
    if (this.badge) this.badge.nativeElement.textContent = `Badge (${n})`;
  }
}
@Component({
  selector: 'ex-44', standalone: true, imports: [Ex44Wrapper],
  template: `
    <ex-44-wrapper #w>
      <span #badge style="background:#3b82f6;color:#fff;padding:2px 10px;border-radius:12px;font-size:13px;">Badge</span>
      <p>ContentChild updates the projected badge via signal.</p>
    </ex-44-wrapper>
    <button style="margin-top:8px;" (click)="w.updateBadge(notifications)">Set {{ notifications }} Notifications</button>
    <button style="margin-left:6px;" (click)="notifications = notifications + 1">+</button>`
})
class Ex44 { notifications = 3; }

// 45. QueryList changes subscription with takeUntilDestroyed
@Component({
  selector: 'ex-45', standalone: true,
  template: `
    <ul style="list-style:none;padding:0;">
      @for (t of tags(); track t) {
        <li #tagEl style="display:inline-block;margin:4px;padding:4px 10px;background:#e0e7ff;border-radius:12px;font-size:13px;">{{ t }}</li>
      }
    </ul>
    <div style="display:flex;gap:6px;margin-top:8px;">
      <input #newTag placeholder="New tag" style="padding:6px;border:1px solid #ccc;border-radius:4px;" />
      <button (click)="add(newTag)">Add</button>
    </div>
    <p style="font-size:13px;">Total tags in DOM: {{ domCount }}</p>`
})
class Ex45 implements AfterViewInit {
  @ViewChildren('tagEl') tagEls!: QueryList<ElementRef>;
  tags = signal(['angular', 'signals', 'rxjs']);
  domCount = 0;
  ngAfterViewInit() {
    this.domCount = this.tagEls.length;
    this.tagEls.changes.subscribe(() => { this.domCount = this.tagEls.length; });
  }
  add(inp: HTMLInputElement) { if (inp.value) { this.tags.update(t => [...t, inp.value]); inp.value = ''; } }
}

// 46. Template ref forwarding pattern
@Component({
  selector: 'ex-46-modal', standalone: true,
  template: `
    @if (open()) {
      <div style="position:fixed;inset:0;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;z-index:100;">
        <div style="background:#fff;border-radius:12px;padding:24px;max-width:320px;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
          <ng-content />
          <button style="margin-top:12px;padding:6px 16px;border:none;border-radius:4px;background:#ef4444;color:#fff;cursor:pointer;"
            (click)="open.set(false)">Close</button>
        </div>
      </div>
    }`
})
class Ex46Modal { open = signal(false); show() { this.open.set(true); } }
@Component({
  selector: 'ex-46', standalone: true, imports: [Ex46Modal],
  template: `
    <ex-46-modal #modal>
      <h3 style="margin:0 0 8px;">Modal Title</h3>
      <p>Template ref forwarding lets parent control child modal.</p>
    </ex-46-modal>
    <button (click)="modal.show()" style="padding:8px 16px;border-radius:4px;border:none;background:#3b82f6;color:#fff;cursor:pointer;">Open Modal</button>`
})
class Ex46 {}

// 47. @ViewChild ElementRef for Intersection Observer
@Component({
  selector: 'ex-47', standalone: true,
  template: `
    <div style="height:80px;overflow:auto;border:1px solid #ddd;border-radius:4px;padding:8px;">
      <div style="height:200px;display:flex;align-items:flex-end;">
        <div #target style="padding:10px;border-radius:4px;transition:background 0.3s;"
          [style.background]="visible() ? '#d1fae5' : '#fee2e2'">
          {{ visible() ? '✅ Visible' : '❌ Not Visible' }}
        </div>
      </div>
    </div>
    <p style="font-size:13px;color:#888;">Scroll inside the box to see Intersection Observer update.</p>`
})
class Ex47 implements AfterViewInit {
  @ViewChild('target') target!: ElementRef;
  visible = signal(false);
  ngAfterViewInit() {
    const observer = new IntersectionObserver(
      ([entry]) => this.visible.set(entry.isIntersecting),
      { threshold: 0.5 }
    );
    observer.observe(this.target.nativeElement);
  }
}

// 48. Dynamic portal with ViewContainerRef
@Component({ selector: 'ex-48-portal-content', standalone: true, template: `<div style="padding:12px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border-radius:8px;">Portal Content at {{ time }}</div>` })
class Ex48PortalContent { time = new Date().toLocaleTimeString(); }
@Component({
  selector: 'ex-48', standalone: true,
  template: `
    <div #portalA style="border:2px dashed #ccc;border-radius:8px;padding:12px;min-height:50px;margin-bottom:8px;">
      <p style="color:#ccc;margin:0;font-size:13px;">Portal A</p>
    </div>
    <div #portalB style="border:2px dashed #ccc;border-radius:8px;padding:12px;min-height:50px;margin-bottom:8px;">
      <p style="color:#ccc;margin:0;font-size:13px;">Portal B</p>
    </div>
    <div style="display:flex;gap:6px;">
      <button (click)="mountTo(vcA)">Mount to A</button>
      <button (click)="mountTo(vcB)">Mount to B</button>
      <button (click)="unmount()">Unmount</button>
    </div>`
})
class Ex48 implements AfterViewInit {
  @ViewChild('portalA', { read: ViewContainerRef }) vcA!: ViewContainerRef;
  @ViewChild('portalB', { read: ViewContainerRef }) vcB!: ViewContainerRef;
  private current?: ViewContainerRef;
  ngAfterViewInit() {}
  mountTo(vc: ViewContainerRef) {
    this.current?.clear();
    vc.clear();
    const ref = vc.createComponent(Ex48PortalContent);
    ref.changeDetectorRef.detectChanges();
    this.current = vc;
  }
  unmount() { this.current?.clear(); }
}

// 49. ViewChild in ngAfterViewInit vs afterRender
@Component({
  selector: 'ex-49', standalone: true,
  template: `
    <div #el style="padding:12px;background:#f0f9ff;border-radius:6px;">Measured element</div>
    <p style="font-size:13px;">ngAfterViewInit width: <strong>{{ avWidth }}</strong></p>
    <p style="font-size:13px;">afterNextRender width: <strong>{{ arWidth() }}</strong></p>`
})
class Ex49 implements AfterViewInit {
  @ViewChild('el') el!: ElementRef;
  avWidth = 0;
  arWidth = signal(0);
  constructor() {
    afterNextRender(() => { this.arWidth.set(this.el?.nativeElement?.offsetWidth ?? 0); });
  }
  ngAfterViewInit() { this.avWidth = this.el?.nativeElement?.offsetWidth ?? 0; }
}

// 50. ContentChildren for polymorphic slot pattern
@Component({ selector: 'ex-50-slot', standalone: true, template: `<ng-content />` })
class Ex50Slot { name = ''; }
@Component({
  selector: 'ex-50-layout', standalone: true, imports: [Ex50Slot],
  template: `
    <div style="display:grid;grid-template-columns:200px 1fr;gap:12px;">
      @for (slot of slots; track slot.name) {
        @if (slot.name === 'sidebar') {
          <aside style="background:#f1f5f9;padding:12px;border-radius:8px;"><ng-content select="[slot=sidebar]" /></aside>
        }
        @if (slot.name === 'main') {
          <main style="background:#fff;padding:12px;border:1px solid #e2e8f0;border-radius:8px;"><ng-content select="[slot=main]" /></main>
        }
      }
    </div>`,
})
class Ex50Layout implements AfterContentInit {
  @ContentChildren(Ex50Slot) slotEls!: QueryList<Ex50Slot>;
  slots: Ex50Slot[] = [];
  ngAfterContentInit() { this.slots = this.slotEls.toArray(); }
}
@Component({
  selector: 'ex-50', standalone: true, imports: [Ex50Layout, Ex50Slot],
  template: `
    <ex-50-layout>
      <ex-50-slot name="sidebar" slot="sidebar">
        <p><strong>Navigation</strong></p>
        <ul style="padding-left:16px;font-size:13px;"><li>Home</li><li>About</li><li>Contact</li></ul>
      </ex-50-slot>
      <ex-50-slot name="main" slot="main">
        <p><strong>Main Content</strong></p>
        <p style="font-size:13px;">ContentChildren queries the projected slot components for a polymorphic layout.</p>
      </ex-50-slot>
    </ex-50-layout>`
})
class Ex50 {}

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
      <h1>Examples 2.3 — Template Variables</h1>

      <h4>1. Template reference #myInput reading .value</h4><ex-01 /><hr />
      <h4>2. #btn to access button element</h4><ex-02 /><hr />
      <h4>3. Template variable on component — #child to call method</h4><ex-03 /><hr />
      <h4>4. (click)="logValue(myInput.value)" pattern</h4><ex-04 /><hr />
      <h4>5. Template variable in same template for multiple interactions</h4><ex-05 /><hr />
      <h4>6. #form="ngForm" — access form state</h4><ex-06 /><hr />
      <h4>7. Auto-focus with template ref on init</h4><ex-07 /><hr />
      <h4>8. Input character count with template ref</h4><ex-08 /><hr />
      <h4>9. Password show/hide with template ref</h4><ex-09 /><hr />
      <h4>10. Copy-to-clipboard with template ref</h4><ex-10 /><hr />
      <h4>11. Reset input via template ref .value = ''</h4><ex-11 /><hr />
      <h4>12. Read select element value via template ref</h4><ex-12 /><hr />
      <h4>13. Read textarea value via template ref</h4><ex-13 /><hr />

      <h4>14. @ViewChild — get reference to component</h4><ex-14 /><hr />
      <h4>15. @ViewChild — get reference via #selector</h4><ex-15 /><hr />
      <h4>16. @ViewChild — get ElementRef to native element</h4><ex-16 /><hr />
      <h4>17. @ViewChild({ static: true }) vs default</h4><ex-17 /><hr />
      <h4>18. @ViewChildren — QueryList of elements</h4><ex-18 /><hr />
      <h4>19. @ContentChild — project and query child</h4><ex-19 /><hr />
      <h4>20. @ContentChildren — QueryList of projected</h4><ex-20 /><hr />
      <h4>21. @ViewChild to call child method</h4><ex-21 /><hr />
      <h4>22. @ViewChild to read child signal</h4><ex-22 /><hr />
      <h4>23. Template ref + @if visibility trick</h4><ex-23 /><hr />
      <h4>24. Template ref with keyboard shortcut (focus)</h4><ex-24 /><hr />
      <h4>25. Multiple template refs in one template</h4><ex-25 /><hr />
      <h4>26. Template ref on ng-template for TemplateRef</h4><ex-26 /><hr />

      <h4>27. Parent @ViewChild accessing child component's signal</h4><ex-27 /><hr />
      <h4>28. @ViewChildren iterating all child refs</h4><ex-28 /><hr />
      <h4>29. @ContentChild for custom wrapper component</h4><ex-29 /><hr />
      <h4>30. Template ref passed to another component</h4><ex-30 /><hr />
      <h4>31. @ViewChild on dynamically added element (via @if)</h4><ex-31 /><hr />
      <h4>32. @ViewChild to measure element size</h4><ex-32 /><hr />
      <h4>33. @ViewChild for scrollTo behavior</h4><ex-33 /><hr />
      <h4>34. @ViewChildren with changes subscription</h4><ex-34 /><hr />
      <h4>35. Template refs for form fields validation</h4><ex-35 /><hr />
      <h4>36. @ContentChildren for tab panel pattern</h4><ex-36 /><hr />
      <h4>37. @ViewChild for canvas drawing</h4><ex-37 /><hr />
      <h4>38. Nested template refs — parent-child-grandchild</h4><ex-38 /><hr />

      <h4>39. ViewChild with signal-based timing (afterNextRender)</h4><ex-39 /><hr />
      <h4>40. Template ref as TemplateRef — render manually</h4><ex-40 /><hr />
      <h4>41. ViewContainerRef for dynamic component creation</h4><ex-41 /><hr />
      <h4>42. EmbeddedView from ng-template</h4><ex-42 /><hr />
      <h4>43. ViewChild with DestroyRef cleanup</h4><ex-43 /><hr />
      <h4>44. ContentChild with signal update</h4><ex-44 /><hr />
      <h4>45. QueryList changes subscription with takeUntilDestroyed</h4><ex-45 /><hr />
      <h4>46. Template ref forwarding pattern</h4><ex-46 /><hr />
      <h4>47. @ViewChild ElementRef for Intersection Observer</h4><ex-47 /><hr />
      <h4>48. Dynamic portal with ViewContainerRef</h4><ex-48 /><hr />
      <h4>49. ViewChild in ngAfterViewInit vs afterRender</h4><ex-49 /><hr />
      <h4>50. ContentChildren for polymorphic slot pattern</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
