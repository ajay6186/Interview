import { Component, signal, computed, effect } from '@angular/core';

// ============================================================
// Examples 1.4 — Conditional Rendering (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ────────────────────────────────────────────

// 1. @if (condition) — basic show/hide
@Component({ selector: 'ex-01', standalone: true, template: `@if (show) { <p>Visible</p> } <button (click)="show = !show">Toggle</button>` })
class Ex01 { show = true; }

// 2. @if / @else
@Component({ selector: 'ex-02', standalone: true, template: `@if (loggedIn) { <p>Welcome back!</p> } @else { <p>Please log in.</p> } <button (click)="loggedIn = !loggedIn">Toggle</button>` })
class Ex02 { loggedIn = false; }

// 3. @if / @else if / @else chain
@Component({
  selector: 'ex-03', standalone: true,
  template: `
    @if (score >= 90) { <p style="color:green">A</p> }
    @else if (score >= 80) { <p style="color:blue">B</p> }
    @else if (score >= 70) { <p style="color:orange">C</p> }
    @else { <p style="color:red">F</p> }
    <input type="range" min="0" max="100" [value]="score" (input)="score = +$any($event).target.value" />
  `
})
class Ex03 { score = 85; }

// 4. @switch / @case / @default
@Component({
  selector: 'ex-04', standalone: true,
  template: `
    @switch (day) {
      @case ('Mon') { <p>Start of the week</p> }
      @case ('Fri') { <p>Almost weekend!</p> }
      @case ('Sat') { <p>Weekend!</p> }
      @case ('Sun') { <p>Weekend!</p> }
      @default { <p>Midweek</p> }
    }
    <select [value]="day" (change)="day = $any($event).target.value">
      @for (d of days; track d) { <option>{{ d }}</option> }
    </select>
  `
})
class Ex04 { day = 'Mon'; days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; }

// 5. @if with boolean signal
@Component({ selector: 'ex-05', standalone: true, template: `@if (active()) { <span style="color:green">Active</span> } @else { <span style="color:gray">Inactive</span> } <button (click)="active.set(!active())">Toggle</button>` })
class Ex05 { active = signal(false); }

// 6. @if with null check
@Component({ selector: 'ex-06', standalone: true, template: `@if (user !== null) { <p>{{ user!.name }}</p> } @else { <p style="color:gray">No user loaded</p> } <button (click)="load()">Load</button>` })
class Ex06 { user: { name: string } | null = null; load() { this.user = { name: 'Alice' }; } }

// 7. @if with string length check
@Component({ selector: 'ex-07', standalone: true, template: `<input [value]="text" (input)="text = $any($event).target.value" placeholder="Type at least 5 chars" /><br/>@if (text.length >= 5) { <p style="color:green">Long enough!</p> } @else { <p style="color:red">Too short ({{ text.length }}/5)</p> }` })
class Ex07 { text = ''; }

// 8. @if with number comparison
@Component({ selector: 'ex-08', standalone: true, template: `<p>Age: {{ age }}</p>@if (age >= 18) { <p style="color:green">Adult</p> } @else { <p style="color:orange">Minor</p> }<button (click)="age = age + 1">Birthday</button>` })
class Ex08 { age = 16; }

// 9. @switch with string value
@Component({
  selector: 'ex-09', standalone: true,
  template: `
    @switch (status) {
      @case ('active') { <span style="color:green">● Active</span> }
      @case ('idle') { <span style="color:orange">● Idle</span> }
      @case ('offline') { <span style="color:red">● Offline</span> }
    }
    <br/><select (change)="status = $any($event).target.value">
      <option>active</option><option>idle</option><option>offline</option>
    </select>
  `
})
class Ex09 { status = 'active'; }

// 10. @switch with number
@Component({
  selector: 'ex-10', standalone: true,
  template: `
    @switch (step) {
      @case (1) { <p>Step 1: Fill details</p> }
      @case (2) { <p>Step 2: Review</p> }
      @case (3) { <p>Step 3: Confirm</p> }
    }
    <button [disabled]="step <= 1" (click)="step = step - 1">Prev</button>
    <button [disabled]="step >= 3" (click)="step = step + 1">Next</button>
  `
})
class Ex10 { step = 1; }

// 11. @switch with enum-like string union
@Component({
  selector: 'ex-11', standalone: true,
  template: `
    @switch (role) {
      @case ('admin') { <p style="color:red">Admin Panel</p> }
      @case ('editor') { <p style="color:blue">Editor Tools</p> }
      @case ('viewer') { <p style="color:gray">Read-only View</p> }
    }
    <select (change)="role = $any($event).target.value as any">
      <option>admin</option><option>editor</option><option>viewer</option>
    </select>
  `
})
class Ex11 { role: 'admin' | 'editor' | 'viewer' = 'viewer'; }

// 12. @if hiding a form section
@Component({
  selector: 'ex-12', standalone: true,
  template: `
    <label><input type="checkbox" [checked]="showAddress" (change)="showAddress = $any($event).target.checked" /> Add shipping address</label>
    @if (showAddress) {
      <div style="margin-top:8px;padding:8px;border:1px solid #ddd">
        <input placeholder="Street" style="display:block;margin-bottom:4px" />
        <input placeholder="City" style="display:block" />
      </div>
    }
  `
})
class Ex12 { showAddress = false; }

// 13. @if showing loading spinner vs content
@Component({
  selector: 'ex-13', standalone: true,
  template: `
    @if (loading) {
      <p style="color:gray">⏳ Loading...</p>
    } @else {
      <p>Data loaded: {{ data }}</p>
    }
    <button (click)="toggle()">{{ loading ? 'Stop' : 'Load' }}</button>
  `
})
class Ex13 { loading = false; data = 'Hello, World!'; toggle() { this.loading = !this.loading; } }

// ─── INTERMEDIATE (14–26) ─────────────────────────────────────

// 14. @if with template reference — as syntax
@Component({ selector: 'ex-14', standalone: true, template: `@if (getUser(); as u) { <p>User: {{ u.name }}, Role: {{ u.role }}</p> } @else { <p>No user</p> } <button (click)="hasUser = !hasUser">Toggle</button>` })
class Ex14 {
  hasUser = true;
  getUser() { return this.hasUser ? { name: 'Bob', role: 'admin' } : null; }
}

// 15. Nested @if blocks
@Component({
  selector: 'ex-15', standalone: true,
  template: `
    @if (isLoggedIn) {
      <p>Logged in</p>
      @if (isAdmin) { <p style="color:red">Admin features visible</p> }
      @else { <p style="color:gray">Normal user</p> }
    } @else {
      <p>Please log in</p>
    }
    <button (click)="isLoggedIn = !isLoggedIn">Login toggle</button>
    <button (click)="isAdmin = !isAdmin">Admin toggle</button>
  `
})
class Ex15 { isLoggedIn = true; isAdmin = false; }

// 16. @if with async data (signal)
@Component({
  selector: 'ex-16', standalone: true,
  template: `
    @if (data()) {
      <p>Loaded: {{ data() }}</p>
    } @else {
      <p style="color:gray">Fetching...</p>
    }
    <button (click)="fetch()">Fetch</button>
  `
})
class Ex16 {
  data = signal<string | null>(null);
  fetch() { this.data.set(null); setTimeout(() => this.data.set('API result ✓'), 800); }
}

// 17. @switch with HTTP status codes
@Component({
  selector: 'ex-17', standalone: true,
  template: `
    @switch (code) {
      @case (200) { <p style="color:green">200 OK</p> }
      @case (404) { <p style="color:orange">404 Not Found</p> }
      @case (500) { <p style="color:red">500 Server Error</p> }
      @default { <p>Unknown: {{ code }}</p> }
    }
    <select (change)="code = +$any($event).target.value">
      <option value="200">200</option><option value="404">404</option><option value="500">500</option><option value="301">301</option>
    </select>
  `
})
class Ex17 { code = 200; }

// 18. @if for role-based UI
@Component({
  selector: 'ex-18', standalone: true,
  template: `
    @if (role === 'admin') { <button style="color:red">Delete All</button> }
    @if (role === 'admin' || role === 'editor') { <button>Edit</button> }
    <p>Always visible content</p>
    <select (change)="role = $any($event).target.value">
      <option>viewer</option><option>editor</option><option>admin</option>
    </select>
  `
})
class Ex18 { role = 'viewer'; }

// 19. @if for feature flags
@Component({
  selector: 'ex-19', standalone: true,
  template: `
    <nav>
      <a href="#">Home</a>
      @if (flags.analytics) { <a href="#" style="margin-left:8px">Analytics</a> }
      @if (flags.beta) { <a href="#" style="margin-left:8px;color:orange">Beta Features</a> }
    </nav>
    <button (click)="flags.analytics = !flags.analytics">Toggle Analytics</button>
    <button (click)="flags.beta = !flags.beta">Toggle Beta</button>
  `
})
class Ex19 { flags = { analytics: true, beta: false }; }

// 20. @if with form validity
@Component({
  selector: 'ex-20', standalone: true,
  template: `
    <input [value]="email" (input)="email = $any($event).target.value" placeholder="Email" />
    @if (email.length > 0 && !isValid()) {
      <p style="color:red;font-size:12px">Invalid email</p>
    }
    @if (isValid()) {
      <button>Submit</button>
    }
  `
})
class Ex20 { email = ''; isValid() { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email); } }

// 21. @if with error state
@Component({
  selector: 'ex-21', standalone: true,
  template: `
    <button (click)="simulateError()">Simulate Error</button>
    <button (click)="error = null">Clear</button>
    @if (error) {
      <div style="color:white;background:crimson;padding:8px;border-radius:4px;margin-top:8px">Error: {{ error }}</div>
    } @else {
      <p style="color:green">No errors</p>
    }
  `
})
class Ex21 { error: string | null = null; simulateError() { this.error = 'Something went wrong!'; } }

// 22. Toggle visibility with button + @if
@Component({
  selector: 'ex-22', standalone: true,
  template: `
    <button (click)="visible = !visible">{{ visible ? 'Hide' : 'Show' }} Details</button>
    @if (visible) {
      <div style="margin-top:8px;padding:8px;background:#f5f5f5;border-radius:4px">
        <p>Name: John Doe</p><p>Email: john@example.com</p>
      </div>
    }
  `
})
class Ex22 { visible = false; }

// 23. @if with multiple conditions (&&, ||)
@Component({
  selector: 'ex-23', standalone: true,
  template: `
    @if (hasName && hasAge) { <p style="color:green">Both name and age provided</p> }
    @if (!hasName || !hasAge) { <p style="color:orange">Missing: {{ !hasName ? 'name ' : '' }}{{ !hasAge ? 'age' : '' }}</p> }
    <label><input type="checkbox" [checked]="hasName" (change)="hasName = $any($event).target.checked" /> Has Name</label>
    <label><input type="checkbox" [checked]="hasAge" (change)="hasAge = $any($event).target.checked" /> Has Age</label>
  `
})
class Ex23 { hasName = true; hasAge = false; }

// 24. @if rendering different component variants
@Component({ selector: 'ex-24-a', standalone: true, template: `<div style="padding:8px;background:steelblue;color:white;border-radius:4px">Primary Button</div>` })
class Ex24A {}
@Component({ selector: 'ex-24-b', standalone: true, template: `<div style="padding:8px;background:#eee;border:1px solid #ccc;border-radius:4px">Secondary Button</div>` })
class Ex24B {}
@Component({ selector: 'ex-24', standalone: true, imports: [Ex24A, Ex24B], template: `@if (variant === 'primary') { <ex-24-a /> } @else { <ex-24-b /> } <button (click)="variant = variant === 'primary' ? 'secondary' : 'primary'" style="margin-top:8px;display:block">Switch</button>` })
class Ex24 { variant = 'primary'; }

// 25. @switch for theme selection
@Component({
  selector: 'ex-25', standalone: true,
  template: `
    @switch (theme) {
      @case ('light') { <div style="background:white;color:black;padding:8px;border:1px solid #ddd">Light theme preview</div> }
      @case ('dark') { <div style="background:#222;color:white;padding:8px">Dark theme preview</div> }
      @case ('solarized') { <div style="background:#fdf6e3;color:#657b83;padding:8px">Solarized preview</div> }
    }
    <select (change)="theme = $any($event).target.value" style="margin-top:8px">
      <option>light</option><option>dark</option><option>solarized</option>
    </select>
  `
})
class Ex25 { theme = 'light'; }

// 26. @if for empty state vs content
@Component({
  selector: 'ex-26', standalone: true,
  template: `
    @if (items.length > 0) {
      <ul>@for (i of items; track i) { <li>{{ i }}</li> }</ul>
    } @else {
      <div style="text-align:center;padding:20px;color:gray;border:2px dashed #ddd;border-radius:4px">No items yet. Add some!</div>
    }
    <button (click)="add()">Add item</button>
    <button (click)="items = []">Clear</button>
  `
})
class Ex26 { items: string[] = []; n = 0; add() { this.items = [...this.items, `Item ${++this.n}`]; } }

// ─── NESTED (27–38) ───────────────────────────────────────────

// 27. Nested @if inside @for loop
@Component({
  selector: 'ex-27', standalone: true,
  template: `
    <ul>
      @for (p of products; track p.id) {
        <li>
          {{ p.name }}
          @if (p.inStock) { <span style="color:green"> ✓ In Stock</span> }
          @else { <span style="color:red"> ✗ Out of Stock</span> }
        </li>
      }
    </ul>
  `
})
class Ex27 { products = [{ id: 1, name: 'Widget', inStock: true }, { id: 2, name: 'Gadget', inStock: false }, { id: 3, name: 'Doohickey', inStock: true }]; }

// 28. @switch inside @if
@Component({
  selector: 'ex-28', standalone: true,
  template: `
    @if (isAuthenticated) {
      @switch (plan) {
        @case ('free') { <p>Free tier: 5 projects</p> }
        @case ('pro') { <p style="color:blue">Pro tier: unlimited projects</p> }
        @case ('enterprise') { <p style="color:gold">Enterprise: custom solutions</p> }
      }
    } @else {
      <p>Log in to see your plan</p>
    }
    <button (click)="isAuthenticated = !isAuthenticated">Toggle auth</button>
    <select (change)="plan = $any($event).target.value"><option>free</option><option>pro</option><option>enterprise</option></select>
  `
})
class Ex28 { isAuthenticated = true; plan = 'pro'; }

// 29. @if inside @switch case
@Component({
  selector: 'ex-29', standalone: true,
  template: `
    @switch (view) {
      @case ('profile') {
        <div>
          <h4 style="margin:0">Profile</h4>
          @if (isEditing) { <input placeholder="Edit name" /> <button (click)="isEditing = false">Save</button> }
          @else { <p>John Doe</p> <button (click)="isEditing = true">Edit</button> }
        </div>
      }
      @case ('settings') { <p>Settings panel</p> }
      @default { <p>Select a view</p> }
    }
    <select (change)="view = $any($event).target.value"><option value="">Select</option><option value="profile">Profile</option><option value="settings">Settings</option></select>
  `
})
class Ex29 { view = 'profile'; isEditing = false; }

// 30. Three-level nested conditionals
@Component({
  selector: 'ex-30', standalone: true,
  template: `
    @if (a) {
      <p>A is true</p>
      @if (b) {
        <p>B is also true</p>
        @if (c) { <p style="color:green">All three true!</p> }
        @else { <p style="color:orange">C is false</p> }
      } @else { <p style="color:orange">B is false</p> }
    } @else { <p style="color:red">A is false</p> }
    <label><input type="checkbox" [checked]="a" (change)="a=$any($event).target.checked" /> A</label>
    <label><input type="checkbox" [checked]="b" (change)="b=$any($event).target.checked" /> B</label>
    <label><input type="checkbox" [checked]="c" (change)="c=$any($event).target.checked" /> C</label>
  `
})
class Ex30 { a = true; b = true; c = false; }

// 31. Conditional rendering of child components
@Component({ selector: 'ex-31-chart', standalone: true, template: `<div style="background:#e8f4fd;padding:8px;border-radius:4px">📊 Bar Chart</div>` })
class Ex31Chart {}
@Component({ selector: 'ex-31-table', standalone: true, template: `<div style="background:#f0fde8;padding:8px;border-radius:4px">📋 Data Table</div>` })
class Ex31Table {}
@Component({ selector: 'ex-31', standalone: true, imports: [Ex31Chart, Ex31Table], template: `@if (viewMode === 'chart') { <ex-31-chart /> } @else { <ex-31-table /> } <button (click)="viewMode = viewMode === 'chart' ? 'table' : 'chart'" style="margin-top:8px;display:block">Switch to {{ viewMode === 'chart' ? 'Table' : 'Chart' }}</button>` })
class Ex31 { viewMode = 'chart'; }

// 32. @if with @for (empty state pattern)
@Component({
  selector: 'ex-32', standalone: true,
  template: `
    @if (filtered.length > 0) {
      @for (item of filtered; track item) { <div style="padding:4px;border-bottom:1px solid #eee">{{ item }}</div> }
    } @else {
      <p style="color:gray;text-align:center">No results for "{{ query }}"</p>
    }
    <input [value]="query" (input)="query = $any($event).target.value" placeholder="Filter..." style="margin-top:8px;display:block" />
  `
})
class Ex32 {
  items = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];
  query = '';
  get filtered() { return this.items.filter(i => i.toLowerCase().includes(this.query.toLowerCase())); }
}

// 33. Modal shown/hidden with @if
@Component({
  selector: 'ex-33', standalone: true,
  template: `
    <button (click)="open = true">Open Modal</button>
    @if (open) {
      <div style="position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:100">
        <div style="background:white;padding:24px;border-radius:8px;max-width:300px">
          <h3 style="margin:0 0 8px">Modal Title</h3>
          <p>Modal content here.</p>
          <button (click)="open = false">Close</button>
        </div>
      </div>
    }
  `
})
class Ex33 { open = false; }

// 34. Accordion expand/collapse with @if
@Component({
  selector: 'ex-34', standalone: true,
  template: `
    @for (item of sections; track item.title) {
      <div style="border:1px solid #ddd;margin-bottom:4px;border-radius:4px;overflow:hidden">
        <div (click)="item.open = !item.open" style="padding:8px;cursor:pointer;background:#f5f5f5;display:flex;justify-content:space-between">
          <span>{{ item.title }}</span><span>{{ item.open ? '▲' : '▼' }}</span>
        </div>
        @if (item.open) { <div style="padding:8px">{{ item.content }}</div> }
      </div>
    }
  `
})
class Ex34 { sections = [{ title: 'Section 1', content: 'Content for section 1', open: false }, { title: 'Section 2', content: 'Content for section 2', open: true }, { title: 'Section 3', content: 'Content for section 3', open: false }]; }

// 35. Step wizard with @switch
@Component({
  selector: 'ex-35', standalone: true,
  template: `
    <div style="display:flex;margin-bottom:12px">
      @for (s of [1,2,3]; track s) {
        <div [style.fontWeight]="step === s ? 'bold' : 'normal'" [style.color]="step >= s ? 'steelblue' : 'gray'" style="flex:1;text-align:center;padding:4px;border-bottom:2px solid" [style.borderColor]="step >= s ? 'steelblue' : '#eee'">Step {{ s }}</div>
      }
    </div>
    @switch (step) {
      @case (1) { <p>Enter your name: <input placeholder="Name" /></p> }
      @case (2) { <p>Enter your email: <input placeholder="Email" /></p> }
      @case (3) { <p style="color:green">Review & Submit ✓</p> }
    }
    <div style="margin-top:8px">
      <button [disabled]="step <= 1" (click)="step = step - 1">Back</button>
      <button [disabled]="step >= 3" (click)="step = step + 1" style="margin-left:8px">Next</button>
    </div>
  `
})
class Ex35 { step = 1; }

// 36. Tab panel with @switch
@Component({
  selector: 'ex-36', standalone: true,
  template: `
    <div style="display:flex;border-bottom:2px solid #ddd;margin-bottom:8px">
      @for (tab of tabs; track tab) {
        <button (click)="active = tab" [style.borderBottom]="active === tab ? '2px solid steelblue' : 'none'" [style.fontWeight]="active === tab ? 'bold' : 'normal'" style="padding:6px 12px;background:none;border:none;cursor:pointer;margin-bottom:-2px">{{ tab }}</button>
      }
    </div>
    @switch (active) {
      @case ('Overview') { <p>Overview content: project summary and stats.</p> }
      @case ('Details') { <p>Details content: full specifications.</p> }
      @case ('History') { <p>History content: changelog and activity.</p> }
    }
  `
})
class Ex36 { tabs = ['Overview', 'Details', 'History']; active = 'Overview'; }

// 37. Alert types with @switch
@Component({
  selector: 'ex-37', standalone: true,
  template: `
    @switch (type) {
      @case ('info') { <div style="background:#e8f4fd;border-left:4px solid steelblue;padding:8px;border-radius:2px">ℹ️ Informational message</div> }
      @case ('success') { <div style="background:#e8fde8;border-left:4px solid green;padding:8px;border-radius:2px">✅ Success! Action completed.</div> }
      @case ('warning') { <div style="background:#fff8e1;border-left:4px solid orange;padding:8px;border-radius:2px">⚠️ Warning: check your input.</div> }
      @case ('error') { <div style="background:#fde8e8;border-left:4px solid crimson;padding:8px;border-radius:2px">❌ Error: something went wrong.</div> }
    }
    <select (change)="type = $any($event).target.value" style="margin-top:8px"><option>info</option><option>success</option><option>warning</option><option>error</option></select>
  `
})
class Ex37 { type = 'info'; }

// 38. Dashboard cards with @if feature flags
@Component({
  selector: 'ex-38', standalone: true,
  template: `
    <div style="display:flex;flex-wrap:wrap;gap:8px">
      <div style="border:1px solid #ddd;padding:8px;border-radius:4px;min-width:100px">Users: 1,240</div>
      @if (features.revenue) { <div style="border:1px solid #ddd;padding:8px;border-radius:4px;min-width:100px">Revenue: $8,320</div> }
      @if (features.analytics) { <div style="border:1px solid #ddd;padding:8px;border-radius:4px;min-width:100px">Pageviews: 42k</div> }
      @if (features.beta) { <div style="border:1px solid orange;padding:8px;border-radius:4px;min-width:100px;color:orange">Beta Widget</div> }
    </div>
    <div style="margin-top:8px">
      <label><input type="checkbox" [checked]="features.revenue" (change)="features.revenue=$any($event).target.checked" /> Revenue</label>
      <label><input type="checkbox" [checked]="features.analytics" (change)="features.analytics=$any($event).target.checked" /> Analytics</label>
      <label><input type="checkbox" [checked]="features.beta" (change)="features.beta=$any($event).target.checked" /> Beta</label>
    </div>
  `
})
class Ex38 { features = { revenue: true, analytics: true, beta: false }; }

// ─── ADVANCED (39–50) ─────────────────────────────────────────

// 39. @if with signal computed result
@Component({
  selector: 'ex-39', standalone: true,
  template: `
    <input type="number" [value]="n()" (input)="n.set(+$any($event).target.value)" />
    @if (isPrime()) { <p style="color:green">{{ n() }} is prime</p> }
    @else { <p style="color:gray">{{ n() }} is not prime</p> }
  `
})
class Ex39 {
  n = signal(7);
  isPrime = computed(() => {
    const v = this.n(); if (v < 2) return false;
    for (let i = 2; i <= Math.sqrt(v); i++) { if (v % i === 0) return false; }
    return true;
  });
}

// 40. @if with effect-driven state change
@Component({
  selector: 'ex-40', standalone: true,
  template: `
    <input type="range" min="0" max="100" [value]="temp()" (input)="temp.set(+$any($event).target.value)" />
    <p>Temp: {{ temp() }}°C</p>
    @if (alert()) { <p style="color:red;font-weight:bold">{{ alert() }}</p> }
  `
})
class Ex40 {
  temp = signal(20);
  alert = signal('');
  constructor() {
    effect(() => {
      const t = this.temp();
      this.alert.set(t > 80 ? 'DANGER: Critical temperature!' : t > 60 ? 'WARNING: High temperature' : '');
    });
  }
}

// 41. @if (loadedData(); as data) pattern with signal
@Component({
  selector: 'ex-41', standalone: true,
  template: `
    @if (loadData(); as data) {
      <div style="background:#f0fde8;padding:8px;border-radius:4px">
        <strong>{{ data.title }}</strong><br />{{ data.body }}
      </div>
    } @else {
      <p style="color:gray">No data loaded</p>
    }
    <button (click)="toggle()">{{ loaded() ? 'Clear' : 'Load' }} Data</button>
  `
})
class Ex41 {
  loaded = signal(false);
  toggle() { this.loaded.set(!this.loaded()); }
  loadData() { return this.loaded() ? { title: 'Result', body: 'Fetched successfully' } : null; }
}

// 42. Permission directive pattern using @if
@Component({
  selector: 'ex-42', standalone: true,
  template: `
    <p>Current role: <strong>{{ role }}</strong></p>
    @if (can('view')) { <button>View</button> }
    @if (can('edit')) { <button>Edit</button> }
    @if (can('delete')) { <button style="color:red">Delete</button> }
    <br/><select (change)="role = $any($event).target.value" style="margin-top:8px"><option>guest</option><option>user</option><option>editor</option><option>admin</option></select>
  `
})
class Ex42 {
  role = 'user';
  private perms: Record<string, string[]> = { guest: ['view'], user: ['view'], editor: ['view', 'edit'], admin: ['view', 'edit', 'delete'] };
  can(action: string) { return this.perms[this.role]?.includes(action); }
}

// 43. Skeleton loading pattern with @if
@Component({
  selector: 'ex-43', standalone: true,
  template: `
    @if (!loaded) {
      <div style="animation:pulse 1.5s ease-in-out infinite">
        <div style="height:16px;background:#eee;border-radius:4px;margin-bottom:8px;width:80%"></div>
        <div style="height:12px;background:#eee;border-radius:4px;margin-bottom:6px"></div>
        <div style="height:12px;background:#eee;border-radius:4px;width:60%"></div>
      </div>
    } @else {
      <div><strong>John Doe</strong><p style="margin:4px 0;color:#666">Software Engineer at Acme Corp</p></div>
    }
    <button (click)="loaded = !loaded" style="margin-top:8px;display:block">Toggle skeleton</button>
  `
})
class Ex43 { loaded = false; }

// 44. @if with RxJS toSignal async data simulation
import { toSignal } from '@angular/core/rxjs-interop';
import { timer, map } from 'rxjs';
@Component({
  selector: 'ex-44', standalone: true,
  template: `
    @if (data()) {
      <p style="color:green">Stream value: {{ data() }}</p>
    } @else {
      <p style="color:gray">Waiting for stream...</p>
    }
  `
})
class Ex44 {
  data = toSignal(timer(1000, 2000).pipe(map(n => `Tick ${n + 1}`)), { initialValue: null as string | null });
}

// 45. Progressive disclosure UI with @if chains
@Component({
  selector: 'ex-45', standalone: true,
  template: `
    <button (click)="level = level < 3 ? level + 1 : 0">Level {{ level }} — click to advance</button>
    @if (level >= 1) {
      <div style="margin-top:8px;padding:8px;background:#f5f5f5;border-radius:4px">Basic info revealed</div>
    }
    @if (level >= 2) {
      <div style="margin-top:4px;padding:8px;background:#eef;border-radius:4px">Intermediate details shown</div>
    }
    @if (level >= 3) {
      <div style="margin-top:4px;padding:8px;background:#ffe;border-radius:4px">Advanced options unlocked</div>
    }
  `
})
class Ex45 { level = 0; }

// 46. A/B test component selection with @if
@Component({ selector: 'ex-46-a', standalone: true, template: `<div style="background:steelblue;color:white;padding:8px;border-radius:4px">Variant A: Blue CTA</div>` })
class Ex46A {}
@Component({ selector: 'ex-46-b', standalone: true, template: `<div style="background:green;color:white;padding:8px;border-radius:4px">Variant B: Green CTA</div>` })
class Ex46B {}
@Component({ selector: 'ex-46', standalone: true, imports: [Ex46A, Ex46B], template: `<p>User segment: {{ segment }}</p>@if (segment === 'A') { <ex-46-a /> } @else { <ex-46-b /> }<button (click)="segment = segment === 'A' ? 'B' : 'A'" style="margin-top:8px;display:block">Switch variant</button>` })
class Ex46 { segment: 'A' | 'B' = Math.random() > 0.5 ? 'A' : 'B'; }

// 47. @switch with dynamic component rendering
@Component({ selector: 'ex-47-home', standalone: true, template: `<div style="background:#e8f4fd;padding:8px">🏠 Home page</div>` })
class Ex47Home {}
@Component({ selector: 'ex-47-about', standalone: true, template: `<div style="background:#fde8f4;padding:8px">👤 About page</div>` })
class Ex47About {}
@Component({ selector: 'ex-47-contact', standalone: true, template: `<div style="background:#fdf4e8;padding:8px">📧 Contact page</div>` })
class Ex47Contact {}
@Component({
  selector: 'ex-47', standalone: true, imports: [Ex47Home, Ex47About, Ex47Contact],
  template: `
    @switch (page) {
      @case ('home') { <ex-47-home /> }
      @case ('about') { <ex-47-about /> }
      @case ('contact') { <ex-47-contact /> }
    }
    <nav style="margin-top:8px">
      @for (p of pages; track p) { <button (click)="page = p" [style.fontWeight]="page === p ? 'bold' : 'normal'" style="margin-right:4px">{{ p }}</button> }
    </nav>
  `
})
class Ex47 { page = 'home'; pages = ['home', 'about', 'contact']; }

// 48. Conditional form sections with @if
@Component({
  selector: 'ex-48', standalone: true,
  template: `
    <label><input type="radio" name="type" value="individual" [checked]="type === 'individual'" (change)="type = 'individual'" /> Individual</label>
    <label><input type="radio" name="type" value="company" [checked]="type === 'company'" (change)="type = 'company'" /> Company</label>
    <div style="margin-top:8px">
      @if (type === 'individual') {
        <input placeholder="First name" style="display:block;margin-bottom:4px" />
        <input placeholder="Last name" style="display:block" />
      }
      @if (type === 'company') {
        <input placeholder="Company name" style="display:block;margin-bottom:4px" />
        <input placeholder="Tax ID" style="display:block" />
      }
    </div>
  `
})
class Ex48 { type = 'individual'; }

// 49. Error boundary pattern with @if
@Component({
  selector: 'ex-49', standalone: true,
  template: `
    @if (hasError()) {
      <div style="background:#fde8e8;border:1px solid crimson;padding:12px;border-radius:4px">
        <strong>Something went wrong</strong>
        <p style="margin:4px 0;font-size:12px">{{ errorMsg() }}</p>
        <button (click)="retry()">Retry</button>
      </div>
    } @else if (loading()) {
      <p style="color:gray">Loading...</p>
    } @else {
      <p style="color:green">Content loaded successfully</p>
    }
    <button (click)="simulate('error')" style="margin-right:4px">Trigger Error</button>
    <button (click)="simulate('load')">Simulate Load</button>
  `
})
class Ex49 {
  hasError = signal(false); loading = signal(false); errorMsg = signal('');
  simulate(t: string) {
    if (t === 'error') { this.loading.set(false); this.hasError.set(true); this.errorMsg.set('Network request failed'); }
    else { this.hasError.set(false); this.loading.set(true); setTimeout(() => this.loading.set(false), 1000); }
  }
  retry() { this.hasError.set(false); this.simulate('load'); }
}

// 50. Deferred rendering with @defer (Angular 17)
@Component({ selector: 'ex-50-heavy', standalone: true, template: `<div style="background:#e8fde8;padding:8px;border-radius:4px">Heavy component rendered!</div>` })
class Ex50Heavy {}
@Component({
  selector: 'ex-50', standalone: true, imports: [Ex50Heavy],
  template: `
    @defer (on interaction) {
      <ex-50-heavy />
    } @placeholder {
      <button>Click to load deferred component</button>
    } @loading {
      <p style="color:gray">Loading...</p>
    }
  `
})
class Ex50 {}

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
      <h1>Examples 1.4 — Conditional Rendering</h1>
      <h4>1. @if (condition) — basic show/hide</h4><ex-01 /><hr />
      <h4>2. @if / @else</h4><ex-02 /><hr />
      <h4>3. @if / @else if / @else chain</h4><ex-03 /><hr />
      <h4>4. @switch / @case / @default</h4><ex-04 /><hr />
      <h4>5. @if with boolean signal</h4><ex-05 /><hr />
      <h4>6. @if with null check</h4><ex-06 /><hr />
      <h4>7. @if with string length check</h4><ex-07 /><hr />
      <h4>8. @if with number comparison</h4><ex-08 /><hr />
      <h4>9. @switch with string value</h4><ex-09 /><hr />
      <h4>10. @switch with number</h4><ex-10 /><hr />
      <h4>11. @switch with enum-like string union</h4><ex-11 /><hr />
      <h4>12. @if hiding a form section</h4><ex-12 /><hr />
      <h4>13. @if showing loading spinner vs content</h4><ex-13 /><hr />
      <h4>14. @if with template reference — as syntax</h4><ex-14 /><hr />
      <h4>15. Nested @if blocks</h4><ex-15 /><hr />
      <h4>16. @if with async data (signal)</h4><ex-16 /><hr />
      <h4>17. @switch with HTTP status codes</h4><ex-17 /><hr />
      <h4>18. @if for role-based UI</h4><ex-18 /><hr />
      <h4>19. @if for feature flags</h4><ex-19 /><hr />
      <h4>20. @if with form validity</h4><ex-20 /><hr />
      <h4>21. @if with error state</h4><ex-21 /><hr />
      <h4>22. Toggle visibility with button + @if</h4><ex-22 /><hr />
      <h4>23. @if with multiple conditions (&amp;&amp;, ||)</h4><ex-23 /><hr />
      <h4>24. @if rendering different component variants</h4><ex-24 /><hr />
      <h4>25. @switch for theme selection</h4><ex-25 /><hr />
      <h4>26. @if for empty state vs content</h4><ex-26 /><hr />
      <h4>27. Nested @if inside @for loop</h4><ex-27 /><hr />
      <h4>28. @switch inside @if</h4><ex-28 /><hr />
      <h4>29. @if inside @switch case</h4><ex-29 /><hr />
      <h4>30. Three-level nested conditionals</h4><ex-30 /><hr />
      <h4>31. Conditional rendering of child components</h4><ex-31 /><hr />
      <h4>32. @if with @for (empty state pattern)</h4><ex-32 /><hr />
      <h4>33. Modal shown/hidden with @if</h4><ex-33 /><hr />
      <h4>34. Accordion expand/collapse with @if</h4><ex-34 /><hr />
      <h4>35. Step wizard with @switch</h4><ex-35 /><hr />
      <h4>36. Tab panel with @switch</h4><ex-36 /><hr />
      <h4>37. Alert types with @switch</h4><ex-37 /><hr />
      <h4>38. Dashboard cards with @if feature flags</h4><ex-38 /><hr />
      <h4>39. @if with signal computed result</h4><ex-39 /><hr />
      <h4>40. @if with effect-driven state change</h4><ex-40 /><hr />
      <h4>41. @if (loadedData(); as data) pattern</h4><ex-41 /><hr />
      <h4>42. Permission directive pattern using @if</h4><ex-42 /><hr />
      <h4>43. Skeleton loading pattern with @if</h4><ex-43 /><hr />
      <h4>44. @if with RxJS toSignal async data</h4><ex-44 /><hr />
      <h4>45. Progressive disclosure UI with @if chains</h4><ex-45 /><hr />
      <h4>46. A/B test component selection with @if</h4><ex-46 /><hr />
      <h4>47. @switch with dynamic component rendering</h4><ex-47 /><hr />
      <h4>48. Conditional form sections with @if</h4><ex-48 /><hr />
      <h4>49. Error boundary pattern with @if</h4><ex-49 /><hr />
      <h4>50. Deferred rendering with @defer (Angular 17)</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
