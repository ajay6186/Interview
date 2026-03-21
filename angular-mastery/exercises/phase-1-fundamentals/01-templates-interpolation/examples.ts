import { Component, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe, JsonPipe, PercentPipe, SlicePipe, UpperCasePipe } from '@angular/common';

// ============================================================
// Examples 1.1 — Templates & Interpolation (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ────────────────────────────────────────────

// 1. String interpolation
@Component({ selector: 'ex-01', standalone: true, template: `<p>{{ name }}</p>` })
class Ex01 { name = 'Angular'; }

// 2. Number interpolation
@Component({ selector: 'ex-02', standalone: true, template: `<p>Count: {{ count }}</p>` })
class Ex02 { count = 42; }

// 3. Arithmetic in template
@Component({ selector: 'ex-03', standalone: true, template: `<p>Total: {{ price * qty }}</p>` })
class Ex03 { price = 9.99; qty = 3; }

// 4. Ternary expression
@Component({ selector: 'ex-04', standalone: true, template: `<p>Status: {{ isOnline ? 'Online' : 'Offline' }}</p>` })
class Ex04 { isOnline = true; }

// 5. Method call in template
@Component({ selector: 'ex-05', standalone: true, template: `<p>{{ formatName() }}</p>` })
class Ex05 {
  first = 'Jane'; last = 'Doe';
  formatName() { return `${this.last}, ${this.first}`; }
}

// 6. Property binding — [disabled]
@Component({ selector: 'ex-06', standalone: true, template: `<button [disabled]="isDisabled">Submit</button>` })
class Ex06 { isDisabled = true; }

// 7. Class binding — [class.active]
@Component({ selector: 'ex-07', standalone: true, template: `<div [class.active]="isActive" style="padding:4px">Box</div>` })
class Ex07 { isActive = true; }

// 8. Style binding — [style.color]
@Component({ selector: 'ex-08', standalone: true, template: `<p [style.color]="color">Colored text</p>` })
class Ex08 { color = 'tomato'; }

// 9. Attribute binding — [attr.aria-label]
@Component({ selector: 'ex-09', standalone: true, template: `<button [attr.aria-label]="label">🔍</button>` })
class Ex09 { label = 'Search'; }

// 10. Event binding (click)
@Component({ selector: 'ex-10', standalone: true, template: `<button (click)="count = count + 1">Clicked {{ count }} times</button>` })
class Ex10 { count = 0; }

// 11. Two-way (fake) — input + (input) event
@Component({ selector: 'ex-11', standalone: true, template: `<input [value]="val" (input)="val = $any($event).target.value" /><p>{{ val }}</p>` })
class Ex11 { val = 'type here'; }

// 12. Safe navigation operator
@Component({ selector: 'ex-12', standalone: true, template: `<p>{{ user?.name }}</p>` })
class Ex12 { user: { name: string } | null = null; }

// 13. Nullish coalescing
@Component({ selector: 'ex-13', standalone: true, template: `<p>{{ user?.name ?? 'Guest' }}</p>` })
class Ex13 { user: { name: string } | null = null; }

// ─── INTERMEDIATE (14–26) ─────────────────────────────────────

// 14. Uppercase pipe
@Component({ selector: 'ex-14', standalone: true, imports: [UpperCasePipe], template: `<p>{{ name | uppercase }}</p>` })
class Ex14 { name = 'angular'; }

// 15. Date pipe
@Component({ selector: 'ex-15', standalone: true, imports: [DatePipe], template: `<p>{{ date | date:'mediumDate' }}</p>` })
class Ex15 { date = new Date(); }

// 16. Decimal pipe
@Component({ selector: 'ex-16', standalone: true, imports: [DecimalPipe], template: `<p>{{ 3.14159 | number:'1.2-2' }}</p>` })
class Ex16 {}

// 17. Currency pipe
@Component({ selector: 'ex-17', standalone: true, imports: [CurrencyPipe], template: `<p>{{ price | currency:'USD' }}</p>` })
class Ex17 { price = 49.99; }

// 18. Percent pipe
@Component({ selector: 'ex-18', standalone: true, imports: [PercentPipe], template: `<p>{{ ratio | percent }}</p>` })
class Ex18 { ratio = 0.75; }

// 19. Slice pipe
@Component({ selector: 'ex-19', standalone: true, imports: [SlicePipe], template: `<p>{{ longText | slice:0:50 }}...</p>` })
class Ex19 { longText = 'Angular is a TypeScript-based open-source front-end web application framework.'; }

// 20. JSON pipe (debug)
@Component({ selector: 'ex-20', standalone: true, imports: [JsonPipe], template: `<pre>{{ obj | json }}</pre>` })
class Ex20 { obj = { id: 1, name: 'Widget', active: true }; }

// 21. Multiple pipes chained
@Component({ selector: 'ex-21', standalone: true, imports: [UpperCasePipe, SlicePipe], template: `<p>{{ name | uppercase | slice:0:5 }}</p>` })
class Ex21 { name = 'angular framework'; }

// 22. Template expression with array length
@Component({ selector: 'ex-22', standalone: true, template: `<p>{{ items.length }} items</p>` })
class Ex22 { items = ['a', 'b', 'c', 'd']; }

// 23. Nested object property access
@Component({ selector: 'ex-23', standalone: true, template: `<p>{{ user.address.city }}</p>` })
class Ex23 { user = { address: { city: 'New York' } }; }

// 24. Array index access
@Component({ selector: 'ex-24', standalone: true, template: `<p>First color: {{ colors[0] }}</p>` })
class Ex24 { colors = ['red', 'green', 'blue']; }

// 25. Method returning current date string
@Component({ selector: 'ex-25', standalone: true, template: `<p>{{ now() }}</p>` })
class Ex25 { now() { return new Date().toLocaleDateString(); } }

// 26. Computed display with conditional styling
@Component({
  selector: 'ex-26', standalone: true,
  template: `<p [style.fontWeight]="score >= 50 ? 'bold' : 'normal'" [style.color]="score >= 50 ? 'green' : 'red'">Score: {{ score }}</p>`
})
class Ex26 { score = 72; }

// ─── NESTED (27–38) ───────────────────────────────────────────

// 27. Nested object interpolation — address object
@Component({ selector: 'ex-27', standalone: true, template: `<p>{{ addr.street }}, {{ addr.city }}, {{ addr.zip }}</p>` })
class Ex27 { addr = { street: '123 Main St', city: 'Boston', zip: '02101' }; }

// 28. Combined property + class binding
@Component({ selector: 'ex-28', standalone: true, template: `<button [disabled]="!enabled" [class.primary]="enabled">Go</button>` })
class Ex28 { enabled = true; }

// 29. Combined event + style binding
@Component({
  selector: 'ex-29', standalone: true,
  template: `<div [style.background]="bg" (click)="toggle()" style="padding:8px;cursor:pointer">Click me</div>`
})
class Ex29 {
  bg = 'lightblue';
  toggle() { this.bg = this.bg === 'lightblue' ? 'lightgreen' : 'lightblue'; }
}

// 30. Button toggle with class + disabled
@Component({
  selector: 'ex-30', standalone: true,
  template: `
    <button (click)="active = !active" [class.active]="active" [disabled]="locked">
      {{ active ? 'ON' : 'OFF' }}
    </button>
    <button (click)="locked = !locked" style="margin-left:8px">{{ locked ? 'Unlock' : 'Lock' }}</button>
  `
})
class Ex30 { active = false; locked = false; }

// 31. Input event with display update
@Component({
  selector: 'ex-31', standalone: true,
  template: `
    <input [value]="text" (input)="text = $any($event).target.value" placeholder="Type..." />
    <p>Length: {{ text.length }} | Upper: {{ text.toUpperCase() }}</p>
  `
})
class Ex31 { text = ''; }

// 32. Multiple bindings on one element
@Component({
  selector: 'ex-32', standalone: true,
  template: `<input [value]="val" [class.error]="val.length === 0" [attr.aria-invalid]="val.length === 0" (input)="val = $any($event).target.value" placeholder="Required" />`
})
class Ex32 { val = ''; }

// 33. Form field with label binding and value
@Component({
  selector: 'ex-33', standalone: true,
  template: `
    <label [attr.for]="fieldId">{{ labelText }}</label>
    <input [id]="fieldId" [value]="value" (input)="value = $any($event).target.value" />
    <small>{{ value || 'Empty' }}</small>
  `
})
class Ex33 { fieldId = 'username'; labelText = 'Username'; value = ''; }

// 34. Image with [src] [alt] [width] bindings
@Component({ selector: 'ex-34', standalone: true, template: `<img [src]="imgSrc" [alt]="imgAlt" [width]="imgWidth" />` })
class Ex34 { imgSrc = 'https://angular.io/assets/images/logos/angular/angular.svg'; imgAlt = 'Angular logo'; imgWidth = 80; }

// 35. Link with [href] [target] bindings
@Component({ selector: 'ex-35', standalone: true, template: `<a [href]="url" [target]="target">{{ linkText }}</a>` })
class Ex35 { url = 'https://angular.dev'; target = '_blank'; linkText = 'Angular Docs'; }

// 36. Table row with dynamic class based on index
@Component({
  selector: 'ex-36', standalone: true,
  template: `
    <table border="1" cellpadding="4">
      @for (row of rows; track row.id; let i = $index) {
        <tr [class]="i % 2 === 0 ? 'even' : 'odd'"><td>{{ row.id }}</td><td>{{ row.name }}</td></tr>
      }
    </table>
  `
})
class Ex36 { rows = [{ id: 1, name: 'Alpha' }, { id: 2, name: 'Beta' }, { id: 3, name: 'Gamma' }]; }

// 37. Progress bar with [style.width] binding
@Component({
  selector: 'ex-37', standalone: true,
  template: `
    <div style="background:#eee;border-radius:4px;height:20px;width:200px">
      <div [style.width.%]="progress" style="background:steelblue;height:100%;border-radius:4px;transition:width .3s"></div>
    </div>
    <p>{{ progress }}%</p>
    <button (click)="progress = progress < 100 ? progress + 10 : 0">+10%</button>
  `
})
class Ex37 { progress = 40; }

// 38. Badge with conditional class and count
@Component({
  selector: 'ex-38', standalone: true,
  template: `
    <span [class]="count > 0 ? 'badge-active' : 'badge-empty'"
          [style.background]="count > 0 ? 'crimson' : 'gray'"
          style="color:white;padding:2px 8px;border-radius:10px;font-size:12px">
      {{ count > 99 ? '99+' : count }}
    </span>
    <button (click)="count = count + 1" style="margin-left:8px">Add</button>
  `
})
class Ex38 { count = 3; }

// ─── ADVANCED (39–50) ─────────────────────────────────────────

// 39. Signal-based interpolation
@Component({ selector: 'ex-39', standalone: true, template: `<p>{{ count() }}</p><button (click)="count.set(count() + 1)">Increment</button>` })
class Ex39 { count = signal(0); }

// 40. Computed signal in template
@Component({ selector: 'ex-40', standalone: true, template: `<p>Value: {{ value() }} | Doubled: {{ doubled() }}</p><button (click)="value.set(value() + 1)">+1</button>` })
class Ex40 { value = signal(5); doubled = computed(() => this.value() * 2); }

// 41. Signal with conditional display
@Component({
  selector: 'ex-41', standalone: true,
  template: `
    @if (isVisible()) { <p>Visible content</p> }
    @else { <p style="color:gray">Hidden</p> }
    <button (click)="isVisible.set(!isVisible())">Toggle</button>
  `
})
class Ex41 { isVisible = signal(true); }

// 42. Template variable with event
@Component({
  selector: 'ex-42', standalone: true,
  template: `
    <input #nameInput (input)="onInput(nameInput.value)" placeholder="Type name" />
    <p>Hello, {{ displayName || 'stranger' }}!</p>
  `
})
class Ex42 { displayName = ''; onInput(val: string) { this.displayName = val; } }

// 43. Host binding via property binding on wrapper
@Component({
  selector: 'ex-43', standalone: true,
  host: { '[class.highlighted]': 'highlighted', '[style.border]': '"2px solid " + borderColor' },
  template: `<p>Host-bound element (check border)</p><button (click)="highlighted = !highlighted">Toggle</button>`
})
class Ex43 { highlighted = true; borderColor = 'purple'; }

// 44. Dynamic style object with [style]
@Component({
  selector: 'ex-44', standalone: true,
  template: `<div [style]="boxStyles">Styled box</div><button (click)="toggleStyle()">Toggle</button>`
})
class Ex44 {
  isDark = false;
  get boxStyles() { return { background: this.isDark ? '#333' : '#fff', color: this.isDark ? '#fff' : '#333', padding: '8px', border: '1px solid #ccc' }; }
  toggleStyle() { this.isDark = !this.isDark; }
}

// 45. Dynamic class object — multiple conditional classes
@Component({
  selector: 'ex-45', standalone: true,
  template: `
    <div [class]="classes">Multi-class element</div>
    <button (click)="large = !large">Toggle large</button>
    <button (click)="error = !error">Toggle error</button>
  `
})
class Ex45 {
  large = false; error = false;
  get classes() { return { base: true, large: this.large, error: this.error }; }
}

// 46. Getter used in template
@Component({ selector: 'ex-46', standalone: true, template: `<p>Full name: {{ fullName }}</p>` })
class Ex46 {
  firstName = 'John'; lastName = 'Doe';
  get fullName() { return `${this.firstName} ${this.lastName}`; }
}

// 47. Pure method memoization pattern
@Component({ selector: 'ex-47', standalone: true, template: `<p>{{ expensiveResult }}</p>` })
class Ex47 {
  private _input = 'hello world';
  private _cache: string | null = null;
  get expensiveResult() {
    if (!this._cache) { this._cache = this._input.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' '); }
    return this._cache;
  }
}

// 48. Nested signal access
@Component({ selector: 'ex-48', standalone: true, template: `<p>{{ user().name }} — {{ user().role }}</p><button (click)="promote()">Promote</button>` })
class Ex48 {
  user = signal({ name: 'Alice', role: 'viewer' });
  promote() { this.user.set({ ...this.user(), role: 'admin' }); }
}

// 49. String interpolation in attributes
@Component({ selector: 'ex-49', standalone: true, template: `<div id="{{ prefix }}-{{ id }}">Element id = {{ prefix }}-{{ id }}</div>` })
class Ex49 { prefix = 'section'; id = 7; }

// 50. Complex expression: pipe + ternary
@Component({
  selector: 'ex-50', standalone: true, imports: [DecimalPipe],
  template: `<p>{{ (score | number:'1.0-0') + (passed ? ' ✓' : ' ✗') }}</p>`
})
class Ex50 { score = 87.4; passed = true; }

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
      <h1>Examples 1.1 — Templates &amp; Interpolation</h1>
      <h4>1. String interpolation</h4><ex-01 /><hr />
      <h4>2. Number interpolation</h4><ex-02 /><hr />
      <h4>3. Arithmetic in template</h4><ex-03 /><hr />
      <h4>4. Ternary expression</h4><ex-04 /><hr />
      <h4>5. Method call in template</h4><ex-05 /><hr />
      <h4>6. Property binding — [disabled]</h4><ex-06 /><hr />
      <h4>7. Class binding — [class.active]</h4><ex-07 /><hr />
      <h4>8. Style binding — [style.color]</h4><ex-08 /><hr />
      <h4>9. Attribute binding — [attr.aria-label]</h4><ex-09 /><hr />
      <h4>10. Event binding (click)</h4><ex-10 /><hr />
      <h4>11. Two-way (fake) input event</h4><ex-11 /><hr />
      <h4>12. Safe navigation operator</h4><ex-12 /><hr />
      <h4>13. Nullish coalescing</h4><ex-13 /><hr />
      <h4>14. Uppercase pipe</h4><ex-14 /><hr />
      <h4>15. Date pipe</h4><ex-15 /><hr />
      <h4>16. Decimal pipe</h4><ex-16 /><hr />
      <h4>17. Currency pipe</h4><ex-17 /><hr />
      <h4>18. Percent pipe</h4><ex-18 /><hr />
      <h4>19. Slice pipe</h4><ex-19 /><hr />
      <h4>20. JSON pipe (debug)</h4><ex-20 /><hr />
      <h4>21. Multiple pipes chained</h4><ex-21 /><hr />
      <h4>22. Array length in template</h4><ex-22 /><hr />
      <h4>23. Nested object property access</h4><ex-23 /><hr />
      <h4>24. Array index access</h4><ex-24 /><hr />
      <h4>25. Method returning current date</h4><ex-25 /><hr />
      <h4>26. Computed display with conditional styling</h4><ex-26 /><hr />
      <h4>27. Nested object interpolation — address</h4><ex-27 /><hr />
      <h4>28. Combined property + class binding</h4><ex-28 /><hr />
      <h4>29. Combined event + style binding</h4><ex-29 /><hr />
      <h4>30. Button toggle with class + disabled</h4><ex-30 /><hr />
      <h4>31. Input event with display update</h4><ex-31 /><hr />
      <h4>32. Multiple bindings on one element</h4><ex-32 /><hr />
      <h4>33. Form field with label binding</h4><ex-33 /><hr />
      <h4>34. Image with [src] [alt] [width]</h4><ex-34 /><hr />
      <h4>35. Link with [href] [target]</h4><ex-35 /><hr />
      <h4>36. Table row with dynamic class</h4><ex-36 /><hr />
      <h4>37. Progress bar with [style.width]</h4><ex-37 /><hr />
      <h4>38. Badge with conditional class and count</h4><ex-38 /><hr />
      <h4>39. Signal-based interpolation</h4><ex-39 /><hr />
      <h4>40. Computed signal in template</h4><ex-40 /><hr />
      <h4>41. Signal with conditional display</h4><ex-41 /><hr />
      <h4>42. Template variable with event</h4><ex-42 /><hr />
      <h4>43. Host binding via host: {}</h4><ex-43 /><hr />
      <h4>44. Dynamic style object with [style]</h4><ex-44 /><hr />
      <h4>45. Dynamic class object — multiple conditionals</h4><ex-45 /><hr />
      <h4>46. Getter used in template</h4><ex-46 /><hr />
      <h4>47. Pure method memoization pattern</h4><ex-47 /><hr />
      <h4>48. Nested signal access</h4><ex-48 /><hr />
      <h4>49. String interpolation in attributes</h4><ex-49 /><hr />
      <h4>50. Complex expression: pipe + ternary</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
