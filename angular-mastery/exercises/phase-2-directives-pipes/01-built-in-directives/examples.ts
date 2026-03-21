import { Component, signal, computed } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';

// ============================================================
// Examples 2.1 — Built-in Directives (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. NgClass — single class string
@Component({
  selector: 'ex-01', standalone: true, imports: [NgClass],
  template: `<p [ngClass]="'highlight'">Single class string</p>
  <style>.highlight { color: royalblue; font-weight: bold; }</style>`
})
class Ex01 {}

// 2. NgClass — object syntax { 'active': isActive }
@Component({
  selector: 'ex-02', standalone: true, imports: [NgClass],
  template: `<p [ngClass]="{ 'active': isActive }">Object syntax (active={{ isActive }})</p>
  <style>.active { background: #d4f5d4; padding: 4px 8px; border-radius: 4px; }</style>`
})
class Ex02 { isActive = true; }

// 3. NgClass — array syntax ['btn', 'btn-primary']
@Component({
  selector: 'ex-03', standalone: true, imports: [NgClass],
  template: `<button [ngClass]="['btn', 'btn-primary']">Array syntax</button>
  <style>.btn { padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; }
  .btn-primary { background: #007bff; color: #fff; }</style>`
})
class Ex03 {}

// 4. NgStyle — single style { 'color': 'red' }
@Component({
  selector: 'ex-04', standalone: true, imports: [NgStyle],
  template: `<p [ngStyle]="{ 'color': 'red' }">NgStyle single style — red text</p>`
})
class Ex04 {}

// 5. NgStyle — multiple styles object
@Component({
  selector: 'ex-05', standalone: true, imports: [NgStyle],
  template: `<p [ngStyle]="{ 'color': 'white', 'background': '#333', 'padding': '8px', 'border-radius': '4px' }">
    Multiple styles object
  </p>`
})
class Ex05 {}

// 6. NgStyle — dynamic color from variable
@Component({
  selector: 'ex-06', standalone: true, imports: [NgStyle],
  template: `<p [ngStyle]="{ 'color': textColor }">Dynamic color: {{ textColor }}</p>`
})
class Ex06 { textColor = 'darkorange'; }

// 7. NgClass toggled by button click
@Component({
  selector: 'ex-07', standalone: true, imports: [NgClass],
  template: `
    <p [ngClass]="{ 'on': active }">Status: {{ active ? 'ON' : 'OFF' }}</p>
    <button (click)="active = !active">Toggle</button>
    <style>.on { color: green; font-weight: bold; }</style>`
})
class Ex07 { active = false; }

// 8. NgStyle width as percentage signal
@Component({
  selector: 'ex-08', standalone: true, imports: [NgStyle],
  template: `
    <div style="background:#eee;height:20px;border-radius:4px;">
      <div [ngStyle]="{ 'width': width() + '%', 'background': '#4caf50', 'height': '20px', 'border-radius': '4px' }"></div>
    </div>
    <p>{{ width() }}%</p>
    <button (click)="increase()">+10%</button>
    <button (click)="decrease()">-10%</button>`
})
class Ex08 {
  width = signal(40);
  increase() { if (this.width() < 100) this.width.update(v => v + 10); }
  decrease() { if (this.width() > 0) this.width.update(v => v - 10); }
}

// 9. NgClass conditional with ternary
@Component({
  selector: 'ex-09', standalone: true, imports: [NgClass],
  template: `
    <p [ngClass]="score >= 50 ? 'pass' : 'fail'">Score {{ score }} — {{ score >= 50 ? 'PASS' : 'FAIL' }}</p>
    <style>.pass { color: green; } .fail { color: red; }</style>`
})
class Ex09 { score = 72; }

// 10. NgClass with multiple conditions
@Component({
  selector: 'ex-10', standalone: true, imports: [NgClass],
  template: `
    <p [ngClass]="{ 'bold': isBold, 'italic': isItalic, 'underline': isUnderline }">
      Styled text (bold={{ isBold }}, italic={{ isItalic }}, underline={{ isUnderline }})
    </p>
    <style>.bold { font-weight: bold; } .italic { font-style: italic; } .underline { text-decoration: underline; }</style>`
})
class Ex10 { isBold = true; isItalic = true; isUnderline = false; }

// 11. NgStyle font-size from signal
@Component({
  selector: 'ex-11', standalone: true, imports: [NgStyle],
  template: `
    <p [ngStyle]="{ 'font-size': fontSize() + 'px' }">Font size: {{ fontSize() }}px</p>
    <button (click)="fontSize.update(v => v + 2)">A+</button>
    <button (click)="fontSize.update(v => v - 2)">A-</button>`
})
class Ex11 { fontSize = signal(16); }

// 12. NgClass active nav item
@Component({
  selector: 'ex-12', standalone: true, imports: [NgClass],
  template: `
    <nav style="display:flex;gap:8px;">
      @for (item of navItems; track item) {
        <a [ngClass]="{ 'nav-active': item === active }" (click)="active = item" style="cursor:pointer;padding:4px 8px;">{{ item }}</a>
      }
    </nav>
    <style>.nav-active { border-bottom: 2px solid #007bff; font-weight: bold; color: #007bff; }</style>`
})
class Ex12 {
  navItems = ['Home', 'About', 'Contact'];
  active = 'Home';
}

// 13. NgStyle background color picker
@Component({
  selector: 'ex-13', standalone: true, imports: [NgStyle],
  template: `
    <div [ngStyle]="{ 'background': selectedColor, 'padding': '20px', 'border-radius': '8px', 'color': '#fff' }">
      Background: {{ selectedColor }}
    </div>
    <div style="margin-top:8px;display:flex;gap:8px;">
      @for (c of colors; track c) {
        <button [ngStyle]="{ 'background': c, 'border': 'none', 'width': '30px', 'height': '30px', 'border-radius': '50%', 'cursor': 'pointer' }"
          (click)="selectedColor = c"></button>
      }
    </div>`
})
class Ex13 {
  colors = ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12'];
  selectedColor = '#3498db';
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────

// 14. NgClass based on form validity
@Component({
  selector: 'ex-14', standalone: true, imports: [NgClass],
  template: `
    <input #inp (input)="value = inp.value" placeholder="Type at least 3 chars"
      [ngClass]="{ 'valid-input': value.length >= 3, 'invalid-input': value.length > 0 && value.length < 3 }"
      style="padding:6px;border-radius:4px;border:2px solid #ccc;" />
    <p>{{ value.length >= 3 ? 'Valid' : value.length > 0 ? 'Too short' : '' }}</p>
    <style>.valid-input { border-color: green !important; } .invalid-input { border-color: red !important; }</style>`
})
class Ex14 { value = ''; }

// 15. NgStyle animation trigger (transition)
@Component({
  selector: 'ex-15', standalone: true, imports: [NgStyle],
  template: `
    <div [ngStyle]="{ 'width': expanded ? '300px' : '100px', 'height': '60px', 'background': '#5c6bc0',
      'transition': 'width 0.4s ease', 'border-radius': '8px', 'display': 'flex',
      'align-items': 'center', 'justify-content': 'center', 'color': '#fff' }">
      {{ expanded ? 'Expanded!' : 'Click me' }}
    </div>
    <button style="margin-top:8px;" (click)="expanded = !expanded">Toggle</button>`
})
class Ex15 { expanded = false; }

// 16. NgClass for status badges (success/error/warning/info)
@Component({
  selector: 'ex-16', standalone: true, imports: [NgClass],
  template: `
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      @for (s of statuses; track s) {
        <span [ngClass]="'badge badge-' + s" class="badge">{{ s }}</span>
      }
    </div>
    <style>
      .badge { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
      .badge-success { background: #d4edda; color: #155724; }
      .badge-error { background: #f8d7da; color: #721c24; }
      .badge-warning { background: #fff3cd; color: #856404; }
      .badge-info { background: #d1ecf1; color: #0c5460; }
    </style>`
})
class Ex16 { statuses = ['success', 'error', 'warning', 'info']; }

// 17. NgStyle for progress bar fill
@Component({
  selector: 'ex-17', standalone: true, imports: [NgStyle],
  template: `
    <div style="background:#eee;height:24px;border-radius:12px;overflow:hidden;">
      <div [ngStyle]="{ 'width': progress + '%', 'height': '100%',
        'background': 'linear-gradient(90deg,#4facfe,#00f2fe)', 'transition': 'width 0.3s' }"></div>
    </div>
    <p>{{ progress }}%</p>
    <input type="range" min="0" max="100" [value]="progress" (input)="progress = +$any($event.target).value" />`
})
class Ex17 { progress = 65; }

// 18. NgClass alternating row colors
@Component({
  selector: 'ex-18', standalone: true, imports: [NgClass],
  template: `
    <table style="width:100%;border-collapse:collapse;">
      @for (row of rows; track row; let i = $index) {
        <tr [ngClass]="i % 2 === 0 ? 'row-even' : 'row-odd'">
          <td style="padding:6px 12px;">{{ row }}</td>
        </tr>
      }
    </table>
    <style>.row-even { background: #f9f9f9; } .row-odd { background: #e9e9e9; }</style>`
})
class Ex18 { rows = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank']; }

// 19. NgStyle for dynamic grid columns
@Component({
  selector: 'ex-19', standalone: true, imports: [NgStyle],
  template: `
    <div [ngStyle]="{ 'display': 'grid', 'grid-template-columns': 'repeat(' + cols() + ', 1fr)', 'gap': '8px' }">
      @for (item of items; track item) {
        <div style="background:#667eea;color:#fff;padding:12px;border-radius:4px;text-align:center;">{{ item }}</div>
      }
    </div>
    <div style="margin-top:8px;">
      Columns: <input type="range" min="1" max="4" [value]="cols()" (input)="cols.set(+$any($event.target).value)" /> {{ cols() }}
    </div>`
})
class Ex19 {
  cols = signal(3);
  items = [1, 2, 3, 4, 5, 6];
}

// 20. NgClass focus/hover simulation with signals
@Component({
  selector: 'ex-20', standalone: true, imports: [NgClass],
  template: `
    <div [ngClass]="{ 'card-hover': hovered() }"
      (mouseenter)="hovered.set(true)" (mouseleave)="hovered.set(false)"
      style="padding:16px;border:1px solid #ddd;border-radius:8px;display:inline-block;transition:all 0.2s;cursor:pointer;">
      Hover over me!
    </div>
    <style>.card-hover { box-shadow: 0 4px 12px rgba(0,0,0,0.15); transform: translateY(-2px); }</style>`
})
class Ex20 { hovered = signal(false); }

// 21. NgStyle with calc() expression
@Component({
  selector: 'ex-21', standalone: true, imports: [NgStyle],
  template: `
    <div [ngStyle]="{ 'width': 'calc(100% - ' + margin() + 'px)', 'background': '#f0e6ff',
      'padding': '12px', 'border-radius': '4px' }">
      Width = calc(100% - {{ margin() }}px)
    </div>
    <label>Margin: <input type="range" min="0" max="100"
      [value]="margin()" (input)="margin.set(+$any($event.target).value)" /> {{ margin() }}px</label>`
})
class Ex21 { margin = signal(20); }

// 22. NgClass disabled state
@Component({
  selector: 'ex-22', standalone: true, imports: [NgClass],
  template: `
    <button [ngClass]="{ 'btn-disabled': disabled }" [disabled]="disabled"
      style="padding:8px 16px;border-radius:4px;border:none;cursor:pointer;">
      {{ disabled ? 'Disabled' : 'Enabled' }}
    </button>
    <button (click)="disabled = !disabled" style="margin-left:8px;padding:8px 16px;border-radius:4px;border:none;cursor:pointer;background:#eee;">
      Toggle
    </button>
    <style>.btn-disabled { opacity: 0.5; cursor: not-allowed !important; background: #ccc !important; }</style>`
})
class Ex22 { disabled = true; }

// 23. NgStyle for avatar initials background
@Component({
  selector: 'ex-23', standalone: true, imports: [NgStyle],
  template: `
    <div style="display:flex;gap:12px;">
      @for (user of users; track user.name) {
        <div [ngStyle]="{ 'background': user.color, 'color': '#fff', 'width': '48px', 'height': '48px',
          'border-radius': '50%', 'display': 'flex', 'align-items': 'center',
          'justify-content': 'center', 'font-weight': 'bold' }">
          {{ user.initials }}
        </div>
      }
    </div>`
})
class Ex23 {
  users = [
    { name: 'Alice', initials: 'AL', color: '#e74c3c' },
    { name: 'Bob', initials: 'BO', color: '#3498db' },
    { name: 'Carol', initials: 'CA', color: '#2ecc71' },
  ];
}

// 24. NgClass for tab active state
@Component({
  selector: 'ex-24', standalone: true, imports: [NgClass],
  template: `
    <div style="display:flex;border-bottom:2px solid #ddd;">
      @for (tab of tabs; track tab) {
        <div [ngClass]="{ 'tab-active': tab === activeTab }"
          (click)="activeTab = tab"
          style="padding:8px 20px;cursor:pointer;">{{ tab }}</div>
      }
    </div>
    <div style="padding:12px;">Content for: <strong>{{ activeTab }}</strong></div>
    <style>.tab-active { border-bottom: 2px solid #007bff; color: #007bff; margin-bottom: -2px; font-weight: bold; }</style>`
})
class Ex24 { tabs = ['Tab 1', 'Tab 2', 'Tab 3']; activeTab = 'Tab 1'; }

// 25. NgStyle for rating stars fill
@Component({
  selector: 'ex-25', standalone: true, imports: [NgStyle],
  template: `
    <div style="display:flex;gap:4px;">
      @for (star of stars; track star) {
        <span [ngStyle]="{ 'color': star <= rating ? '#f1c40f' : '#ddd', 'font-size': '28px', 'cursor': 'pointer' }"
          (click)="rating = star">★</span>
      }
    </div>
    <p>Rating: {{ rating }} / 5</p>`
})
class Ex25 { stars = [1, 2, 3, 4, 5]; rating = 3; }

// 26. NgClass for accordion open state
@Component({
  selector: 'ex-26', standalone: true, imports: [NgClass],
  template: `
    @for (item of items; track item.title) {
      <div style="border:1px solid #ddd;border-radius:4px;margin-bottom:4px;overflow:hidden;">
        <div [ngClass]="{ 'accordion-open': item.open }"
          (click)="item.open = !item.open"
          style="padding:10px 14px;cursor:pointer;background:#f5f5f5;display:flex;justify-content:space-between;">
          <span>{{ item.title }}</span><span>{{ item.open ? '▲' : '▼' }}</span>
        </div>
        @if (item.open) {
          <div style="padding:10px 14px;">{{ item.body }}</div>
        }
      </div>
    }
    <style>.accordion-open { background: #e8f0fe !important; color: #1a73e8; font-weight: bold; }</style>`
})
class Ex26 {
  items = [
    { title: 'Section 1', body: 'Content for section 1.', open: false },
    { title: 'Section 2', body: 'Content for section 2.', open: true },
    { title: 'Section 3', body: 'Content for section 3.', open: false },
  ];
}

// ─── NESTED (27–38) ─────────────────────────────────────────

// 27. NgClass in @for list (selected item highlight)
@Component({
  selector: 'ex-27', standalone: true, imports: [NgClass],
  template: `
    <ul style="list-style:none;padding:0;">
      @for (item of items; track item) {
        <li [ngClass]="{ 'selected': item === selected }"
          (click)="selected = item"
          style="padding:8px 12px;cursor:pointer;border-radius:4px;margin-bottom:2px;">{{ item }}</li>
      }
    </ul>
    <style>.selected { background: #007bff; color: #fff; }</style>`
})
class Ex27 { items = ['Apple', 'Banana', 'Cherry', 'Date']; selected = 'Banana'; }

// 28. NgStyle in @for (gradient based on index)
@Component({
  selector: 'ex-28', standalone: true, imports: [NgStyle],
  template: `
    <div style="display:flex;gap:4px;">
      @for (item of items; track item; let i = $index) {
        <div [ngStyle]="{ 'background': 'hsl(' + (i * 45) + ', 70%, 60%)',
          'padding': '12px', 'border-radius': '4px', 'color': '#fff', 'font-weight': 'bold' }">
          {{ item }}
        </div>
      }
    </div>`
})
class Ex28 { items = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']; }

// 29. NgClass inside @if block
@Component({
  selector: 'ex-29', standalone: true, imports: [NgClass],
  template: `
    <button (click)="show = !show">{{ show ? 'Hide' : 'Show' }} Alert</button>
    @if (show) {
      <div [ngClass]="'alert alert-' + type" style="margin-top:8px;padding:10px;border-radius:4px;">
        This is a {{ type }} alert!
      </div>
    }
    <select [(ngModel)]="type" style="margin-top:8px;padding:4px;">
      <option>success</option><option>warning</option><option>danger</option>
    </select>
    <style>
      .alert-success { background: #d4edda; color: #155724; }
      .alert-warning { background: #fff3cd; color: #856404; }
      .alert-danger { background: #f8d7da; color: #721c24; }
    </style>`,
  imports: [NgClass, ...([] as any[])]
})
class Ex29 { show = true; type = 'success'; }

// 30. NgClass applied to child component host
@Component({
  selector: 'ex-30-child', standalone: true,
  template: `<div style="padding:8px;border-radius:4px;" [ngClass]="theme" >Themed child ({{ theme }})</div>`,
  imports: [NgClass]
})
class Ex30Child { theme = 'light'; }

@Component({
  selector: 'ex-30', standalone: true, imports: [Ex30Child, NgClass],
  template: `
    <ex-30-child [ngClass]="isDark() ? 'dark-wrapper' : 'light-wrapper'"></ex-30-child>
    <button style="margin-top:8px;" (click)="isDark.update(v => !v)">Toggle Theme</button>
    <style>
      .dark-wrapper { background: #333; color: #fff; border-radius: 4px; display: block; }
      .light-wrapper { background: #f5f5f5; color: #333; border-radius: 4px; display: block; }
    </style>`
})
class Ex30 { isDark = signal(false); }

// 31. Multiple NgClass conditions on one element
@Component({
  selector: 'ex-31', standalone: true, imports: [NgClass],
  template: `
    <div [ngClass]="{ 'featured': isFeatured, 'sold-out': isSoldOut, 'on-sale': isOnSale }"
      style="padding:12px;border:1px solid #ddd;border-radius:8px;display:inline-block;">
      Product Card
    </div>
    <div style="margin-top:8px;display:flex;flex-direction:column;gap:4px;">
      <label><input type="checkbox" [(ngModel)]="isFeatured"> Featured</label>
      <label><input type="checkbox" [(ngModel)]="isSoldOut"> Sold Out</label>
      <label><input type="checkbox" [(ngModel)]="isOnSale"> On Sale</label>
    </div>
    <style>
      .featured { border-color: gold !important; box-shadow: 0 0 0 2px gold; }
      .sold-out { opacity: 0.5; text-decoration: line-through; }
      .on-sale { background: #fff3cd; }
    </style>`,
  imports: [NgClass, ...([] as any[])]
})
class Ex31 { isFeatured = true; isSoldOut = false; isOnSale = true; }

// 32. NgStyle + NgClass together on same element
@Component({
  selector: 'ex-32', standalone: true, imports: [NgClass, NgStyle],
  template: `
    <div [ngClass]="{ 'card': true, 'elevated': elevated() }"
      [ngStyle]="{ 'border-left': '4px solid ' + accent() }"
      style="padding:16px;border-radius:8px;background:#fff;transition:box-shadow 0.2s;">
      Combined NgClass + NgStyle
    </div>
    <button style="margin-top:8px;" (click)="elevated.update(v => !v)">Toggle Elevation</button>
    <style>.card { border: 1px solid #ddd; } .elevated { box-shadow: 0 6px 20px rgba(0,0,0,0.15); }</style>`
})
class Ex32 { elevated = signal(false); accent = signal('#007bff'); }

// 33. NgClass with computed signal
@Component({
  selector: 'ex-33', standalone: true, imports: [NgClass],
  template: `
    <p [ngClass]="statusClass()">Computed class: {{ status() }}</p>
    <div style="display:flex;gap:4px;margin-top:4px;">
      @for (s of statuses; track s) {
        <button (click)="status.set(s)">{{ s }}</button>
      }
    </div>
    <style>
      .cls-active { color: green; font-weight: bold; }
      .cls-inactive { color: gray; }
      .cls-pending { color: orange; }
    </style>`
})
class Ex33 {
  statuses = ['active', 'inactive', 'pending'];
  status = signal('active');
  statusClass = computed(() => 'cls-' + this.status());
}

// 34. NgStyle with computed signal
@Component({
  selector: 'ex-34', standalone: true, imports: [NgStyle],
  template: `
    <div [ngStyle]="barStyle()">Progress: {{ value() }}%</div>
    <input type="range" min="0" max="100" [value]="value()"
      (input)="value.set(+$any($event.target).value)" style="width:100%;margin-top:8px;" />`
})
class Ex34 {
  value = signal(50);
  barStyle = computed(() => ({
    'width': this.value() + '%',
    'background': `hsl(${this.value() * 1.2}, 70%, 50%)`,
    'padding': '8px',
    'border-radius': '4px',
    'color': '#fff',
    'transition': 'all 0.3s',
    'min-width': '80px',
  }));
}

// 35. Themed cards using NgClass
@Component({
  selector: 'ex-35', standalone: true, imports: [NgClass],
  template: `
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      @for (card of cards; track card.title) {
        <div [ngClass]="'card theme-' + card.theme"
          style="padding:16px;border-radius:8px;min-width:120px;text-align:center;">
          <div style="font-size:24px;">{{ card.icon }}</div>
          <div>{{ card.title }}</div>
        </div>
      }
    </div>
    <style>
      .card { border: 1px solid transparent; }
      .theme-blue { background: #dbeafe; color: #1e40af; border-color: #93c5fd; }
      .theme-green { background: #dcfce7; color: #166534; border-color: #86efac; }
      .theme-red { background: #fee2e2; color: #991b1b; border-color: #fca5a5; }
      .theme-purple { background: #ede9fe; color: #5b21b6; border-color: #c4b5fd; }
    </style>`
})
class Ex35 {
  cards = [
    { title: 'Info', icon: 'ℹ️', theme: 'blue' },
    { title: 'Success', icon: '✅', theme: 'green' },
    { title: 'Error', icon: '❌', theme: 'red' },
    { title: 'Magic', icon: '✨', theme: 'purple' },
  ];
}

// 36. Status list with NgClass per row
@Component({
  selector: 'ex-36', standalone: true, imports: [NgClass],
  template: `
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr style="background:#f5f5f5;"><th style="padding:8px;text-align:left;">Service</th><th>Status</th></tr></thead>
      <tbody>
        @for (svc of services; track svc.name) {
          <tr [ngClass]="'row-' + svc.status" style="border-top:1px solid #eee;">
            <td style="padding:8px;">{{ svc.name }}</td>
            <td style="padding:8px;text-align:center;">
              <span [ngClass]="'badge-' + svc.status" style="padding:2px 8px;border-radius:10px;font-size:12px;">{{ svc.status }}</span>
            </td>
          </tr>
        }
      </tbody>
    </table>
    <style>
      .row-up { } .row-down { background: #fff5f5; } .row-degraded { background: #fffbeb; }
      .badge-up { background: #d4edda; color: #155724; }
      .badge-down { background: #f8d7da; color: #721c24; }
      .badge-degraded { background: #fff3cd; color: #856404; }
    </style>`
})
class Ex36 {
  services = [
    { name: 'API Gateway', status: 'up' },
    { name: 'Database', status: 'degraded' },
    { name: 'Cache', status: 'down' },
    { name: 'CDN', status: 'up' },
  ];
}

// 37. Navigation with active link NgClass
@Component({
  selector: 'ex-37', standalone: true, imports: [NgClass],
  template: `
    <nav style="background:#1e293b;padding:12px;border-radius:8px;display:flex;gap:4px;">
      @for (link of links; track link.path) {
        <a [ngClass]="{ 'nav-link': true, 'nav-link-active': link.path === current }"
          (click)="current = link.path" style="cursor:pointer;">{{ link.label }}</a>
      }
    </nav>
    <p style="margin-top:8px;">Current: <code>{{ current }}</code></p>
    <style>
      .nav-link { padding: 6px 14px; border-radius: 4px; color: #94a3b8; text-decoration: none; }
      .nav-link-active { background: #3b82f6; color: #fff !important; }
    </style>`
})
class Ex37 {
  links = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Users', path: '/users' },
    { label: 'Settings', path: '/settings' },
  ];
  current = '/dashboard';
}

// 38. Form validation NgClass on input borders
@Component({
  selector: 'ex-38', standalone: true, imports: [NgClass],
  template: `
    <form style="display:flex;flex-direction:column;gap:10px;max-width:300px;">
      <div>
        <label>Email</label>
        <input #emailInp (input)="email = emailInp.value"
          [ngClass]="{ 'input-valid': email.includes('@'), 'input-invalid': email.length > 0 && !email.includes('@') }"
          placeholder="you@example.com"
          style="width:100%;padding:6px;border:2px solid #ccc;border-radius:4px;" />
      </div>
      <div>
        <label>Password</label>
        <input #passInp type="password" (input)="password = passInp.value"
          [ngClass]="{ 'input-valid': password.length >= 8, 'input-invalid': password.length > 0 && password.length < 8 }"
          placeholder="Min 8 characters"
          style="width:100%;padding:6px;border:2px solid #ccc;border-radius:4px;" />
      </div>
    </form>
    <style>.input-valid { border-color: green !important; } .input-invalid { border-color: red !important; }</style>`
})
class Ex38 { email = ''; password = ''; }

// ─── ADVANCED (39–50) ────────────────────────────────────────

// 39. NgClass with signal-derived object
@Component({
  selector: 'ex-39', standalone: true, imports: [NgClass],
  template: `
    <div [ngClass]="classObj()">Signal-derived NgClass object</div>
    <div style="margin-top:8px;display:flex;gap:8px;">
      <label><input type="checkbox" (change)="large.update(v => !v)"> Large</label>
      <label><input type="checkbox" (change)="primary.update(v => !v)"> Primary</label>
      <label><input type="checkbox" (change)="rounded.update(v => !v)"> Rounded</label>
    </div>
    <style>
      .sz-large { font-size: 1.5em; padding: 12px 24px; }
      .cl-primary { background: #007bff; color: #fff; padding: 8px; }
      .sh-rounded { border-radius: 24px; }
    </style>`
})
class Ex39 {
  large = signal(false);
  primary = signal(true);
  rounded = signal(false);
  classObj = computed(() => ({
    'sz-large': this.large(),
    'cl-primary': this.primary(),
    'sh-rounded': this.rounded(),
  }));
}

// 40. NgStyle with signal-derived object
@Component({
  selector: 'ex-40', standalone: true, imports: [NgStyle],
  template: `
    <div [ngStyle]="styleObj()">Signal-derived NgStyle object</div>
    <div style="margin-top:8px;display:flex;flex-direction:column;gap:6px;">
      <label>Font size: <input type="range" min="12" max="32" [value]="fontSize()"
        (input)="fontSize.set(+$any($event.target).value)" /> {{ fontSize() }}px</label>
      <label>Padding: <input type="range" min="4" max="32" [value]="pad()"
        (input)="pad.set(+$any($event.target).value)" /> {{ pad() }}px</label>
      <label>Hue: <input type="range" min="0" max="360" [value]="hue()"
        (input)="hue.set(+$any($event.target).value)" /></label>
    </div>`
})
class Ex40 {
  fontSize = signal(16);
  pad = signal(12);
  hue = signal(200);
  styleObj = computed(() => ({
    'font-size': this.fontSize() + 'px',
    'padding': this.pad() + 'px',
    'background': `hsl(${this.hue()}, 60%, 90%)`,
    'border-radius': '6px',
    'transition': 'all 0.2s',
  }));
}

// 41. Dynamic class list with spread
@Component({
  selector: 'ex-41', standalone: true, imports: [NgClass],
  template: `
    <div [ngClass]="dynamicClasses()">Dynamic class array from signal</div>
    <div style="margin-top:8px;">
      @for (cls of availableClasses; track cls.name) {
        <label style="margin-right:10px;">
          <input type="checkbox" (change)="toggleClass(cls.name)" [checked]="activeClasses().includes(cls.name)">
          {{ cls.name }}
        </label>
      }
    </div>
    <style>
      .c-bold { font-weight: bold; }
      .c-italic { font-style: italic; }
      .c-blue { color: #1a73e8; }
      .c-bg { background: #e8f0fe; padding: 8px; border-radius: 4px; }
    </style>`
})
class Ex41 {
  availableClasses = [{ name: 'c-bold' }, { name: 'c-italic' }, { name: 'c-blue' }, { name: 'c-bg' }];
  activeClasses = signal<string[]>(['c-bold']);
  dynamicClasses = computed(() => this.activeClasses());
  toggleClass(name: string) {
    this.activeClasses.update(list =>
      list.includes(name) ? list.filter(c => c !== name) : [...list, name]
    );
  }
}

// 42. NgClass with CSS custom properties via NgStyle
@Component({
  selector: 'ex-42', standalone: true, imports: [NgClass, NgStyle],
  template: `
    <div [ngStyle]="{ '--accent': accent(), '--radius': radius() + 'px' } as any"
      [ngClass]="'themed-box'"
      style="padding:16px;">
      CSS custom properties + NgClass theme
    </div>
    <div style="margin-top:8px;display:flex;gap:8px;">
      @for (color of colors; track color) {
        <button [ngStyle]="{ background: color }" (click)="accent.set(color)"
          style="width:24px;height:24px;border:none;border-radius:50%;cursor:pointer;"></button>
      }
    </div>
    <label style="margin-top:8px;display:block;">Radius: <input type="range" min="0" max="24" [value]="radius()"
      (input)="radius.set(+$any($event.target).value)" /> {{ radius() }}px</label>
    <style>
      .themed-box { border: 2px solid var(--accent, #007bff); border-radius: var(--radius, 4px); background: color-mix(in srgb, var(--accent, #007bff) 10%, white); }
    </style>`
})
class Ex42 {
  accent = signal('#007bff');
  radius = signal(8);
  colors = ['#007bff', '#e74c3c', '#2ecc71', '#9b59b6', '#f39c12'];
}

// 43. Responsive NgClass (mobile vs desktop via signal)
@Component({
  selector: 'ex-43', standalone: true, imports: [NgClass],
  template: `
    <div [ngClass]="isMobile() ? 'layout-mobile' : 'layout-desktop'">
      <div class="sidebar">Sidebar</div>
      <div class="main">Main Content</div>
    </div>
    <button style="margin-top:8px;" (click)="isMobile.update(v => !v)">
      Simulate {{ isMobile() ? 'Desktop' : 'Mobile' }}
    </button>
    <style>
      .layout-desktop { display: flex; gap: 16px; }
      .layout-desktop .sidebar { width: 200px; background: #f0f0f0; padding: 12px; border-radius: 4px; }
      .layout-desktop .main { flex: 1; background: #e8f0fe; padding: 12px; border-radius: 4px; }
      .layout-mobile { display: flex; flex-direction: column; gap: 8px; }
      .layout-mobile .sidebar { background: #f0f0f0; padding: 8px; border-radius: 4px; }
      .layout-mobile .main { background: #e8f0fe; padding: 8px; border-radius: 4px; }
    </style>`
})
class Ex43 { isMobile = signal(false); }

// 44. NgClass driving CSS animations
@Component({
  selector: 'ex-44', standalone: true, imports: [NgClass],
  template: `
    <div [ngClass]="{ 'shake': shaking(), 'pulse': pulsing() }"
      style="display:inline-block;padding:16px;background:#fee2e2;border-radius:8px;">
      Animated element
    </div>
    <div style="margin-top:8px;display:flex;gap:8px;">
      <button (click)="triggerShake()">Shake</button>
      <button (click)="pulsing.update(v => !v)">{{ pulsing() ? 'Stop' : 'Start' }} Pulse</button>
    </div>
    <style>
      @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
      @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
      .shake { animation: shake 0.4s ease; }
      .pulse { animation: pulse 0.8s ease infinite; }
    </style>`
})
class Ex44 {
  shaking = signal(false);
  pulsing = signal(false);
  triggerShake() {
    this.shaking.set(true);
    setTimeout(() => this.shaking.set(false), 400);
  }
}

// 45. NgStyle driving CSS transitions
@Component({
  selector: 'ex-45', standalone: true, imports: [NgStyle],
  template: `
    <div [ngStyle]="boxStyle()" style="transition: all 0.5s cubic-bezier(0.34,1.56,0.64,1);">Box</div>
    <div style="margin-top:8px;display:flex;gap:8px;">
      @for (preset of presets; track preset.label) {
        <button (click)="current.set(preset)">{{ preset.label }}</button>
      }
    </div>`
})
class Ex45 {
  presets = [
    { label: 'Small', size: '60px', bg: '#fee2e2', radius: '4px' },
    { label: 'Medium', size: '120px', bg: '#d1fae5', radius: '8px' },
    { label: 'Large', size: '200px', bg: '#dbeafe', radius: '50%' },
  ];
  current = signal(this.presets[0]);
  boxStyle = computed(() => ({
    'width': this.current().size,
    'height': this.current().size,
    'background': this.current().bg,
    'border-radius': this.current().radius,
    'display': 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    'font-weight': 'bold',
  }));
}

// 46. NgClass with HostBinding pattern (shown in component)
@Component({
  selector: 'ex-46-box', standalone: true, imports: [NgClass],
  template: `<ng-content />`,
  host: { '[class.box-active]': 'active', '[class.box-featured]': 'featured' }
})
class Ex46Box { active = false; featured = false; }

@Component({
  selector: 'ex-46', standalone: true, imports: [Ex46Box],
  template: `
    <ex-46-box [active]="isActive()" [featured]="isFeatured()" style="display:block;padding:12px;border:1px solid #ddd;border-radius:8px;">
      HostBinding pattern with class
    </ex-46-box>
    <div style="margin-top:8px;display:flex;gap:8px;">
      <button (click)="isActive.update(v => !v)">Toggle Active</button>
      <button (click)="isFeatured.update(v => !v)">Toggle Featured</button>
    </div>
    <style>
      .box-active { background: #e8f5e9 !important; border-color: #4caf50 !important; }
      .box-featured { box-shadow: 0 0 0 3px gold; }
    </style>`
})
class Ex46 { isActive = signal(false); isFeatured = signal(false); }

// 47. NgStyle with HostBinding pattern
@Component({
  selector: 'ex-47-panel', standalone: true,
  template: `<ng-content />`,
  host: { '[style.background]': 'bg', '[style.padding]': '"16px"', '[style.border-radius]': '"8px"', '[style.display]': '"block"' }
})
class Ex47Panel { bg = '#f0f4ff'; }

@Component({
  selector: 'ex-47', standalone: true, imports: [Ex47Panel],
  template: `
    <ex-47-panel [bg]="bgColor()">HostBinding style via host property binding</ex-47-panel>
    <div style="margin-top:8px;display:flex;gap:4px;">
      @for (c of colors; track c) {
        <button [style.background]="c" (click)="bgColor.set(c)"
          style="width:24px;height:24px;border:none;border-radius:50%;cursor:pointer;"></button>
      }
    </div>`
})
class Ex47 {
  bgColor = signal('#f0f4ff');
  colors = ['#f0f4ff', '#fff0f0', '#f0fff4', '#fffdf0', '#faf0ff'];
}

// 48. Theme switcher using NgClass
@Component({
  selector: 'ex-48', standalone: true, imports: [NgClass],
  template: `
    <div [ngClass]="'theme-' + theme()">
      <div class="theme-header">{{ theme() | titlecase }} Theme</div>
      <div class="theme-body">The quick brown fox jumps over the lazy dog.</div>
      <button class="theme-btn" (click)="nextTheme()">Switch Theme</button>
    </div>
    <style>
      .theme-light .theme-header { background: #f1f5f9; padding: 8px; font-weight: bold; }
      .theme-light .theme-body { background: #fff; padding: 8px; color: #1e293b; }
      .theme-light .theme-btn { background: #e2e8f0; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin: 8px; display: block; }
      .theme-dark .theme-header { background: #1e293b; padding: 8px; font-weight: bold; color: #f8fafc; }
      .theme-dark .theme-body { background: #0f172a; padding: 8px; color: #cbd5e1; }
      .theme-dark .theme-btn { background: #334155; color: #f8fafc; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin: 8px; display: block; }
      .theme-sepia .theme-header { background: #c8a97a; padding: 8px; font-weight: bold; color: #3b2a1a; }
      .theme-sepia .theme-body { background: #f4e5c2; padding: 8px; color: #3b2a1a; }
      .theme-sepia .theme-btn { background: #c8a97a; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin: 8px; display: block; color: #3b2a1a; }
    </style>`
})
class Ex48 {
  themes = ['light', 'dark', 'sepia'];
  themeIndex = signal(0);
  theme = computed(() => this.themes[this.themeIndex()]);
  nextTheme() { this.themeIndex.update(i => (i + 1) % this.themes.length); }
}

// 49. Zebra table with alternating NgClass
@Component({
  selector: 'ex-49', standalone: true, imports: [NgClass],
  template: `
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="background:#1e293b;color:#fff;">
          <th style="padding:8px 12px;text-align:left;">Name</th>
          <th style="padding:8px 12px;">Score</th>
          <th style="padding:8px 12px;">Grade</th>
        </tr>
      </thead>
      <tbody>
        @for (student of students; track student.name; let i = $index) {
          <tr [ngClass]="{ 'row-even': i % 2 === 0, 'row-odd': i % 2 !== 0, 'row-top': student.score >= 90 }">
            <td style="padding:8px 12px;">{{ student.name }}</td>
            <td style="padding:8px 12px;text-align:center;">{{ student.score }}</td>
            <td style="padding:8px 12px;text-align:center;">{{ student.grade }}</td>
          </tr>
        }
      </tbody>
    </table>
    <style>
      .row-even { background: #f8fafc; }
      .row-odd { background: #f1f5f9; }
      .row-top { font-weight: bold; color: #166534; }
    </style>`
})
class Ex49 {
  students = [
    { name: 'Alice', score: 95, grade: 'A+' },
    { name: 'Bob', score: 82, grade: 'B' },
    { name: 'Carol', score: 91, grade: 'A' },
    { name: 'Dave', score: 74, grade: 'C+' },
    { name: 'Eve', score: 88, grade: 'B+' },
  ];
}

// 50. Data visualization bar with NgStyle width
@Component({
  selector: 'ex-50', standalone: true, imports: [NgStyle],
  template: `
    <div style="display:flex;flex-direction:column;gap:8px;">
      @for (item of data(); track item.label) {
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="width:80px;font-size:13px;color:#555;">{{ item.label }}</span>
          <div style="flex:1;background:#e2e8f0;border-radius:4px;overflow:hidden;height:24px;">
            <div [ngStyle]="{
              'width': (item.value / maxValue() * 100) + '%',
              'height': '100%',
              'background': item.color,
              'transition': 'width 0.5s ease',
              'display': 'flex',
              'align-items': 'center',
              'padding-left': '8px',
              'color': '#fff',
              'font-size': '12px',
              'font-weight': 'bold'
            }">{{ item.value }}</div>
          </div>
        </div>
      }
    </div>
    <button style="margin-top:8px;" (click)="randomize()">Randomize</button>`
})
class Ex50 {
  data = signal([
    { label: 'TypeScript', value: 85, color: '#3178c6' },
    { label: 'Angular', value: 72, color: '#dd0031' },
    { label: 'React', value: 64, color: '#61dafb' },
    { label: 'Vue', value: 48, color: '#42b883' },
    { label: 'Svelte', value: 35, color: '#ff3e00' },
  ]);
  maxValue = computed(() => Math.max(...this.data().map(d => d.value)));
  randomize() {
    this.data.update(items => items.map(item => ({ ...item, value: Math.floor(Math.random() * 90) + 10 })));
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
      <h1>Examples 2.1 — Built-in Directives (NgClass &amp; NgStyle)</h1>

      <h4>1. NgClass — single class string</h4><ex-01 /><hr />
      <h4>2. NgClass — object syntax</h4><ex-02 /><hr />
      <h4>3. NgClass — array syntax</h4><ex-03 /><hr />
      <h4>4. NgStyle — single style</h4><ex-04 /><hr />
      <h4>5. NgStyle — multiple styles object</h4><ex-05 /><hr />
      <h4>6. NgStyle — dynamic color from variable</h4><ex-06 /><hr />
      <h4>7. NgClass toggled by button click</h4><ex-07 /><hr />
      <h4>8. NgStyle width as percentage signal</h4><ex-08 /><hr />
      <h4>9. NgClass conditional with ternary</h4><ex-09 /><hr />
      <h4>10. NgClass with multiple conditions</h4><ex-10 /><hr />
      <h4>11. NgStyle font-size from signal</h4><ex-11 /><hr />
      <h4>12. NgClass active nav item</h4><ex-12 /><hr />
      <h4>13. NgStyle background color picker</h4><ex-13 /><hr />

      <h4>14. NgClass based on form validity</h4><ex-14 /><hr />
      <h4>15. NgStyle animation trigger (transition)</h4><ex-15 /><hr />
      <h4>16. NgClass for status badges</h4><ex-16 /><hr />
      <h4>17. NgStyle for progress bar fill</h4><ex-17 /><hr />
      <h4>18. NgClass alternating row colors</h4><ex-18 /><hr />
      <h4>19. NgStyle for dynamic grid columns</h4><ex-19 /><hr />
      <h4>20. NgClass focus/hover simulation with signals</h4><ex-20 /><hr />
      <h4>21. NgStyle with calc() expression</h4><ex-21 /><hr />
      <h4>22. NgClass disabled state</h4><ex-22 /><hr />
      <h4>23. NgStyle for avatar initials background</h4><ex-23 /><hr />
      <h4>24. NgClass for tab active state</h4><ex-24 /><hr />
      <h4>25. NgStyle for rating stars fill</h4><ex-25 /><hr />
      <h4>26. NgClass for accordion open state</h4><ex-26 /><hr />

      <h4>27. NgClass in @for list (selected item highlight)</h4><ex-27 /><hr />
      <h4>28. NgStyle in @for (gradient based on index)</h4><ex-28 /><hr />
      <h4>29. NgClass inside @if block</h4><ex-29 /><hr />
      <h4>30. NgClass applied to child component host</h4><ex-30 /><hr />
      <h4>31. Multiple NgClass conditions on one element</h4><ex-31 /><hr />
      <h4>32. NgStyle + NgClass together on same element</h4><ex-32 /><hr />
      <h4>33. NgClass with computed signal</h4><ex-33 /><hr />
      <h4>34. NgStyle with computed signal</h4><ex-34 /><hr />
      <h4>35. Themed cards using NgClass</h4><ex-35 /><hr />
      <h4>36. Status list with NgClass per row</h4><ex-36 /><hr />
      <h4>37. Navigation with active link NgClass</h4><ex-37 /><hr />
      <h4>38. Form validation NgClass on input borders</h4><ex-38 /><hr />

      <h4>39. NgClass with signal-derived object</h4><ex-39 /><hr />
      <h4>40. NgStyle with signal-derived object</h4><ex-40 /><hr />
      <h4>41. Dynamic class list with spread</h4><ex-41 /><hr />
      <h4>42. NgClass with CSS custom properties via NgStyle</h4><ex-42 /><hr />
      <h4>43. Responsive NgClass (mobile vs desktop via signal)</h4><ex-43 /><hr />
      <h4>44. NgClass driving CSS animations</h4><ex-44 /><hr />
      <h4>45. NgStyle driving CSS transitions</h4><ex-45 /><hr />
      <h4>46. NgClass with HostBinding pattern</h4><ex-46 /><hr />
      <h4>47. NgStyle with HostBinding pattern</h4><ex-47 /><hr />
      <h4>48. Theme switcher using NgClass</h4><ex-48 /><hr />
      <h4>49. Zebra table with alternating NgClass</h4><ex-49 /><hr />
      <h4>50. Data visualization bar with NgStyle width</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
