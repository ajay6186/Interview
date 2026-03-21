// Phase 6 - Solution 03: Dynamic Components
// Topics: ViewContainerRef.createComponent(), ComponentRef, NgComponentOutlet,
//         ComponentRef.setInput()

import {
  Component, Input, Output, EventEmitter, ViewChild, ViewContainerRef,
  ComponentRef, signal, inject, Injectable, Type, OnInit, OnDestroy
} from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ─────────────────────────────────────────────────────────────────────────────
// 1. AlertComponent + DynamicLoaderComponent
// ─────────────────────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  info:    'background:#e3f2fd; border-left:4px solid #1565c0; color:#0d47a1',
  success: 'background:#e8f5e9; border-left:4px solid #2e7d32; color:#1b5e20',
  warning: 'background:#fff8e1; border-left:4px solid #f57f17; color:#e65100',
  error:   'background:#ffebee; border-left:4px solid #c62828; color:#b71c1c',
};

@Component({
  selector: 'app-alert',
  standalone: true,
  template: `
    <div [style]="alertStyle" style="padding:0.75rem 1rem; border-radius:4px; margin-bottom:0.4rem">
      <strong>{{ type | titlecase }}:</strong> {{ message }}
    </div>
  `,
})
export class AlertComponent {
  @Input() type: 'info' | 'success' | 'warning' | 'error' = 'info';
  @Input() message = 'A notification message';
  get alertStyle() { return ALERT_STYLES[this.type] ?? ALERT_STYLES['info']; }
}

@Component({
  selector: 'app-dynamic-loader',
  standalone: true,
  template: `
    <div style="padding:1.5rem; background:#e8eaf6; border-radius:8px; margin-bottom:1rem">
      <h3>ViewContainerRef.createComponent()</h3>

      <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.75rem">
        <button (click)="showAlert('info',    'This is an info message')"
                style="padding:0.3rem 0.75rem; background:#1565c0; color:white; border:none; border-radius:4px; cursor:pointer">
          + Info
        </button>
        <button (click)="showAlert('success', 'Operation succeeded!')"
                style="padding:0.3rem 0.75rem; background:#2e7d32; color:white; border:none; border-radius:4px; cursor:pointer">
          + Success
        </button>
        <button (click)="showAlert('warning', 'Check your inputs')"
                style="padding:0.3rem 0.75rem; background:#f57f17; color:white; border:none; border-radius:4px; cursor:pointer">
          + Warning
        </button>
        <button (click)="showAlert('error', 'Something went wrong')"
                style="padding:0.3rem 0.75rem; background:#c62828; color:white; border:none; border-radius:4px; cursor:pointer">
          + Error
        </button>
        <button (click)="clearAll()"
                style="padding:0.3rem 0.75rem; background:#555; color:white; border:none; border-radius:4px; cursor:pointer">
          Clear All
        </button>
      </div>

      <!-- Insertion point for dynamically created components -->
      <div #container></div>

      <div style="margin-top:0.75rem; font-size:0.85rem; background:#e8eaf6; padding:0.75rem; border-radius:4px">
        <pre style="margin:0; font-size:0.8rem">{{ codeSnippet }}</pre>
      </div>
    </div>
  `,
})
export class DynamicLoaderComponent {
  @ViewChild('container', { read: ViewContainerRef }) container!: ViewContainerRef;

  showAlert(type: AlertComponent['type'], message: string) {
    const ref: ComponentRef<AlertComponent> = this.container.createComponent(AlertComponent);
    // setInput() is the recommended way to pass inputs to dynamically created components
    ref.setInput('type', type);
    ref.setInput('message', message);
    // ref.instance.type = type;      ← also works but bypasses input transform/OnChanges
  }

  clearAll() { this.container.clear(); }

  codeSnippet = `
// @ViewChild('container', { read: ViewContainerRef }) container!: ViewContainerRef;

const ref = this.container.createComponent(AlertComponent);
ref.setInput('type', 'success');
ref.setInput('message', 'Done!');

// To remove one component:
ref.destroy();

// To remove all:
this.container.clear();`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. NgComponentOutlet — switch between components
// ─────────────────────────────────────────────────────────────────────────────

@Component({ selector: 'app-widget-a', standalone: true,
  template: `<div style="padding:0.75rem; background:#e3f2fd; border-radius:4px"><strong>Widget A</strong> — Charts dashboard</div>` })
export class WidgetAComponent {}

@Component({ selector: 'app-widget-b', standalone: true,
  template: `<div style="padding:0.75rem; background:#e8f5e9; border-radius:4px"><strong>Widget B</strong> — Data table</div>` })
export class WidgetBComponent {}

@Component({ selector: 'app-widget-c', standalone: true,
  template: `<div style="padding:0.75rem; background:#fce4ec; border-radius:4px"><strong>Widget C</strong> — User settings</div>` })
export class WidgetCComponent {}

@Component({
  selector: 'app-component-switcher',
  standalone: true,
  imports: [NgComponentOutlet, CommonModule],
  template: `
    <div style="padding:1.5rem; background:#f3e5f5; border-radius:8px; margin-bottom:1rem">
      <h3>NgComponentOutlet</h3>

      <div style="display:flex; gap:0.5rem; margin-bottom:0.75rem">
        @for (btn of buttons; track btn.label) {
          <button (click)="selected.set(btn.comp)"
                  [style.background]="selected() === btn.comp ? '#7b1fa2' : '#e0e0e0'"
                  [style.color]="selected() === btn.comp ? 'white' : '#333'"
                  style="padding:0.4rem 0.75rem; border:none; border-radius:4px; cursor:pointer">
            {{ btn.label }}
          </button>
        }
        <button (click)="selected.set(null)"
                style="padding:0.4rem 0.75rem; background:#555; color:white; border:none; border-radius:4px; cursor:pointer">
          None
        </button>
      </div>

      @if (selected()) {
        <ng-container *ngComponentOutlet="selected()!" />
      } @else {
        <p style="color:#888; font-style:italic">No component selected</p>
      }

      <div style="margin-top:0.75rem; font-size:0.85rem; background:#f8f4ff; padding:0.75rem; border-radius:4px">
        Template: <code>&lt;ng-container *ngComponentOutlet="selectedComp" /&gt;</code><br/>
        With inputs (Angular 16+): <code>*ngComponentOutlet="comp; inputs: inputObj"</code>
      </div>
    </div>
  `,
})
export class ComponentSwitcherComponent {
  selected = signal<Type<unknown> | null>(null);
  buttons = [
    { label: 'Widget A', comp: WidgetAComponent as Type<unknown> },
    { label: 'Widget B', comp: WidgetBComponent as Type<unknown> },
    { label: 'Widget C', comp: WidgetCComponent as Type<unknown> },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. DynamicFormComponent — create inputs from config array
// ─────────────────────────────────────────────────────────────────────────────

export interface FieldConfig {
  type: 'text' | 'email' | 'number' | 'select';
  label: string;
  key: string;
  options?: string[];
}

@Component({
  selector: 'app-text-field',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div style="margin-bottom:0.5rem">
      <label style="display:block; font-size:0.85rem; margin-bottom:0.2rem; font-weight:500">
        {{ config.label }}
      </label>
      <input [type]="config.type" [(ngModel)]="value"
             (ngModelChange)="valueChange.emit({ key: config.key, value: $event })"
             style="width:100%; padding:0.4rem; border:1px solid #ccc; border-radius:4px; box-sizing:border-box" />
    </div>
  `,
})
export class TextFieldComponent {
  @Input() config: FieldConfig = { type: 'text', label: '', key: '' };
  @Output() valueChange = new EventEmitter<{ key: string; value: string }>();
  value = '';
}

@Component({
  selector: 'app-select-field',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div style="margin-bottom:0.5rem">
      <label style="display:block; font-size:0.85rem; margin-bottom:0.2rem; font-weight:500">
        {{ config.label }}
      </label>
      <select [(ngModel)]="value"
              (ngModelChange)="valueChange.emit({ key: config.key, value: $event })"
              style="width:100%; padding:0.4rem; border:1px solid #ccc; border-radius:4px">
        @for (opt of config.options ?? []; track opt) {
          <option [value]="opt">{{ opt }}</option>
        }
      </select>
    </div>
  `,
})
export class SelectFieldComponent {
  @Input() config: FieldConfig = { type: 'select', label: '', key: '' };
  @Output() valueChange = new EventEmitter<{ key: string; value: string }>();
  value = '';
}

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  template: `
    <div style="padding:1.5rem; background:#fff8e1; border-radius:8px; margin-bottom:1rem">
      <h3>Dynamic Form Fields</h3>
      <div #formContainer></div>
      <div style="margin-top:0.75rem; background:#f5f5f5; padding:0.75rem; border-radius:4px; font-size:0.85rem">
        <strong>Form values:</strong>
        @for (entry of formValues | keyvalue; track entry.key) {
          <div><code>{{ entry.key }}</code>: {{ entry.value }}</div>
        }
      </div>
    </div>
  `,
})
export class DynamicFormComponent implements OnInit {
  @ViewChild('formContainer', { read: ViewContainerRef }) formContainer!: ViewContainerRef;

  formValues: Record<string, string> = {};

  fields: FieldConfig[] = [
    { type: 'text',   label: 'Full Name', key: 'name' },
    { type: 'email',  label: 'Email',     key: 'email' },
    { type: 'number', label: 'Age',       key: 'age' },
    { type: 'select', label: 'Country',   key: 'country', options: ['USA', 'UK', 'Germany', 'France'] },
  ];

  ngOnInit() {
    // ViewChild not available in ngOnInit — use AfterViewInit
  }

  ngAfterViewInit() {
    for (const fieldConfig of this.fields) {
      let ref: ComponentRef<TextFieldComponent | SelectFieldComponent>;

      if (fieldConfig.type === 'select') {
        ref = this.formContainer.createComponent(SelectFieldComponent);
      } else {
        ref = this.formContainer.createComponent(TextFieldComponent);
      }

      ref.setInput('config', fieldConfig);
      ref.instance.valueChange.subscribe((change: { key: string; value: string }) => {
        this.formValues = { ...this.formValues, [change.key]: change.value };
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Portal pattern
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class PortalService {
  private _outlet: ViewContainerRef | null = null;

  register(vcr: ViewContainerRef) { this._outlet = vcr; }

  createComponent<T>(component: Type<T>): ComponentRef<T> | null {
    if (!this._outlet) return null;
    this._outlet.clear();
    return this._outlet.createComponent(component);
  }

  clear() { this._outlet?.clear(); }
}

@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    <div style="position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1000">
      <div style="background:white; padding:2rem; border-radius:8px; max-width:400px; width:90%">
        <h3 style="margin-top:0">Modal via Portal</h3>
        <p>I was rendered into the portal outlet, outside the component tree!</p>
        <button (click)="close()" style="padding:0.4rem 1rem; background:#c62828; color:white; border:none; border-radius:4px; cursor:pointer">
          Close
        </button>
      </div>
    </div>
  `,
})
export class ModalComponent {
  private portal = inject(PortalService);
  close() { this.portal.clear(); }
}

@Component({
  selector: 'app-portal-outlet',
  standalone: true,
  template: `<div #outlet></div>`,
})
export class PortalOutletComponent implements OnInit {
  @ViewChild('outlet', { read: ViewContainerRef, static: true }) outlet!: ViewContainerRef;
  private portal = inject(PortalService);
  ngOnInit() { this.portal.register(this.outlet); }
}

@Component({
  selector: 'app-portal-trigger',
  standalone: true,
  template: `
    <div style="padding:1.5rem; background:#e0f7fa; border-radius:8px; margin-bottom:1rem">
      <h3>Portal Pattern</h3>
      <p style="font-size:0.9rem; color:#555">
        The modal renders outside this component's DOM, into a dedicated portal outlet.
      </p>
      <button (click)="openModal()"
              style="padding:0.4rem 0.75rem; background:#00838f; color:white; border:none; border-radius:4px; cursor:pointer">
        Open Modal
      </button>
    </div>
  `,
})
export class PortalTriggerComponent {
  private portal = inject(PortalService);
  openModal() { this.portal.createComponent(ModalComponent); }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. ComponentRef.setInput() + animated progress
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  template: `
    <div style="background:#e0e0e0; border-radius:4px; height:24px; overflow:hidden">
      <div [style.width.%]="progress"
           [style.background]="progress >= 100 ? '#2e7d32' : '#1565c0'"
           style="height:100%; transition:width 0.1s; display:flex; align-items:center; padding-left:8px; color:white; font-size:0.85rem">
        {{ progress }}%
      </div>
    </div>
  `,
})
export class ProgressBarComponent {
  @Input() progress = 0;
}

@Component({
  selector: 'app-dynamic-progress',
  standalone: true,
  template: `
    <div style="padding:1.5rem; background:#fce4ec; border-radius:8px; margin-bottom:1rem">
      <h3>ComponentRef.setInput() Animation</h3>
      <div #progressContainer></div>
      <div style="display:flex; gap:0.5rem; margin-top:0.75rem">
        <button (click)="start()" [disabled]="running"
                style="padding:0.4rem 0.75rem; background:#2e7d32; color:white; border:none; border-radius:4px; cursor:pointer">
          Start
        </button>
        <button (click)="stop()"
                style="padding:0.4rem 0.75rem; background:#c62828; color:white; border:none; border-radius:4px; cursor:pointer">
          Destroy Component
        </button>
      </div>
      <p style="font-size:0.85rem; color:#555; margin-top:0.5rem">
        <code>ref.setInput('progress', value)</code> updates the @Input without triggering full re-creation.
      </p>
    </div>
  `,
})
export class DynamicProgressComponent implements OnDestroy {
  @ViewChild('progressContainer', { read: ViewContainerRef }) container!: ViewContainerRef;
  private ref: ComponentRef<ProgressBarComponent> | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  running = false;

  ngAfterViewInit() {
    this.ref = this.container.createComponent(ProgressBarComponent);
    this.ref.setInput('progress', 0);
  }

  start() {
    if (this.running || !this.ref) return;
    this.running = true;
    let p = 0;
    this.intervalId = setInterval(() => {
      p = Math.min(p + 2, 100);
      this.ref?.setInput('progress', p);
      if (p >= 100) { this.running = false; clearInterval(this.intervalId!); }
    }, 50);
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.ref?.destroy();
    this.ref = null;
    this.running = false;
  }

  ngOnDestroy() { this.stop(); }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    DynamicLoaderComponent,
    ComponentSwitcherComponent,
    DynamicFormComponent,
    PortalOutletComponent,
    PortalTriggerComponent,
    DynamicProgressComponent,
  ],
  template: `
    <div style="font-family:sans-serif; max-width:800px; margin:2rem auto; padding:0 1rem">
      <h1>Phase 6 – Dynamic Components</h1>
      <!-- Portal outlet goes at the top-level to render modals "over" everything -->
      <app-portal-outlet />
      <app-dynamic-loader />
      <app-component-switcher />
      <app-dynamic-form />
      <app-portal-trigger />
      <app-dynamic-progress />
    </div>
  `,
})
export class AppComponent {}
