import { Component } from '@angular/core';
import { NgClass, NgStyle, NgSwitch, NgSwitchCase, NgSwitchDefault, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ============================================================
// Solution 2.1 — Built-in Directives
// ============================================================

// SOLUTION 1: StyleDemoComponent
@Component({
  selector: 'app-style-demo',
  standalone: true,
  imports: [NgStyle, NgClass, FormsModule],
  template: `
    <div style="padding: 12px; border: 1px solid #ddd; border-radius: 8px;">
      <p [ngStyle]="{ color: color, 'font-size': fontSize + 'px' }"
         [ngClass]="{ 'bold-text': bold }">
        The quick brown fox jumps over the lazy dog.
      </p>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <label>Color: <input type="color" [(ngModel)]="color" /></label>
        <label>Size: <input type="range" min="12" max="32" [(ngModel)]="fontSize" /> {{ fontSize }}px</label>
        <label><input type="checkbox" [(ngModel)]="bold" /> Bold</label>
      </div>
    </div>
  `,
  styles: [`.bold-text { font-weight: bold; }`],
})
class StyleDemoComponent {
  color    = '#3498db';
  fontSize = 16;
  bold     = false;
}

// SOLUTION 2: ClassBindingComponent
@Component({
  selector: 'app-class-binding',
  standalone: true,
  imports: [NgClass],
  template: `
    <div [ngClass]="{ success: status === 'success', warning: status === 'warning', error: status === 'error' }"
         style="padding: 12px; border-radius: 6px; margin-bottom: 8px; font-weight: 600;">
      Status: {{ status }}
    </div>
    <button (click)="cycleStatus()" style="padding: 6px 14px; cursor: pointer;">
      Cycle Status ({{ status }})
    </button>
  `,
  styles: [`
    .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .warning { background: #fff3cd; color: #856404; border: 1px solid #ffc107; }
    .error   { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
  `],
})
class ClassBindingComponent {
  status: 'success' | 'warning' | 'error' = 'success';
  private readonly order = ['success', 'warning', 'error'] as const;
  cycleStatus() {
    const idx = this.order.indexOf(this.status);
    this.status = this.order[(idx + 1) % this.order.length];
  }
}

// SOLUTION 3: TwoWayBindingComponent
@Component({
  selector: 'app-two-way',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div style="display: flex; flex-direction: column; gap: 8px; max-width: 320px;">
      <label>Name:
        <input [(ngModel)]="name" name="name"
               style="margin-left: 8px; padding: 4px 8px; border-radius: 4px; border: 1px solid #ccc;" />
      </label>
      <label>Age:
        <input type="number" [(ngModel)]="age" name="age" min="1" max="120"
               style="margin-left: 8px; padding: 4px 8px; border-radius: 4px; border: 1px solid #ccc; width: 60px;" />
      </label>
      <label>
        <input type="checkbox" [(ngModel)]="agree" name="agree" />
        I accept the terms
      </label>
      <div style="background: #f0f4ff; padding: 10px; border-radius: 6px; margin-top: 8px;">
        Hello, <strong>{{ name }}</strong>! Age: {{ age }}.
        Terms: <em>{{ agree ? 'accepted' : 'not accepted' }}</em>
      </div>
    </div>
  `,
})
class TwoWayBindingComponent {
  name  = 'Angular';
  age   = 17;
  agree = false;
}

// SOLUTION 4: NgForFeaturesComponent
@Component({
  selector: 'app-ngfor-features',
  standalone: true,
  imports: [NgFor],
  template: `
    <ul style="padding: 0; list-style: none;">
      <li *ngFor="let item of items; let i = index; let first = first; let last = last; let even = even"
          [style.background]="even ? '#f8f9fa' : '#fff'"
          style="display: flex; align-items: center; gap: 8px;
                 padding: 6px 10px; border-bottom: 1px solid #eee;">
        <span style="color: #999; min-width: 24px;">{{ i + 1 }}.</span>
        <span style="flex: 1;">{{ item }}</span>
        @if (first) { <span style="font-size: 11px; background: #3498db; color: white; border-radius: 4px; padding: 1px 5px;">FIRST</span> }
        @if (last)  { <span style="font-size: 11px; background: #9b59b6; color: white; border-radius: 4px; padding: 1px 5px;">LAST</span>  }
        <button (click)="removeItem(i)"
                style="background: #e74c3c; color: white; border: none;
                       border-radius: 4px; padding: 2px 8px; cursor: pointer; font-size: 12px;">
          ✕
        </button>
      </li>
    </ul>
  `,
})
class NgForFeaturesComponent {
  items = ['Angular', 'React', 'Vue', 'Svelte', 'Solid'];
  removeItem(index: number) { this.items = this.items.filter((_, i) => i !== index); }
}

// SOLUTION 5: NgSwitchComponent
@Component({
  selector: 'app-ngswitch',
  standalone: true,
  imports: [NgSwitch, NgSwitchCase, NgSwitchDefault],
  template: `
    <div>
      <div style="display: flex; gap: 4px; margin-bottom: 12px;">
        @for (t of tabs; track t.value) {
          <button (click)="tab = t.value"
                  [style.background]="tab === t.value ? '#3498db' : '#fff'"
                  [style.color]="tab === t.value ? '#fff' : '#333'"
                  style="padding: 6px 16px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">
            {{ t.label }}
          </button>
        }
      </div>
      <div [ngSwitch]="tab" style="padding: 16px; border: 1px solid #ddd; border-radius: 6px;">
        <div *ngSwitchCase="'overview'">
          <h3 style="margin-top: 0;">Overview</h3>
          <p>Angular is a TypeScript-based web application framework maintained by Google.</p>
        </div>
        <div *ngSwitchCase="'details'">
          <h3 style="margin-top: 0;">Details</h3>
          <ul>
            <li>Version: 17+</li>
            <li>Language: TypeScript</li>
            <li>Rendering: server + client</li>
          </ul>
        </div>
        <div *ngSwitchCase="'settings'">
          <h3 style="margin-top: 0;">Settings</h3>
          <p>No settings available in this demo.</p>
        </div>
        <div *ngSwitchDefault>
          <p style="color: gray;">Select a tab above.</p>
        </div>
      </div>
    </div>
  `,
})
class NgSwitchComponent {
  tab: 'overview' | 'details' | 'settings' = 'overview';
  tabs = [
    { value: 'overview' as const, label: 'Overview' },
    { value: 'details'  as const, label: 'Details'  },
    { value: 'settings' as const, label: 'Settings' },
  ];
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    StyleDemoComponent,
    ClassBindingComponent,
    TwoWayBindingComponent,
    NgForFeaturesComponent,
    NgSwitchComponent,
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <h1>Solution 2.1 — Built-in Directives</h1>

      <h2>1. NgStyle + NgClass</h2>
      <app-style-demo />
      <hr />

      <h2>2. NgClass (status badge)</h2>
      <app-class-binding />
      <hr />

      <h2>3. Two-Way Binding (NgModel)</h2>
      <app-two-way />
      <hr />

      <h2>4. NgFor with context variables</h2>
      <app-ngfor-features />
      <hr />

      <h2>5. NgSwitch / NgSwitchCase</h2>
      <app-ngswitch />
    </div>
  `,
})
export class AppComponent {}
