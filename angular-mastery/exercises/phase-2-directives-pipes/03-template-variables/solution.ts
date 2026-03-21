import {
  Component, Input, ViewChild, ViewChildren, QueryList,
  AfterViewInit, ElementRef, Renderer2,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

// ============================================================
// Solution 2.3 — Template Variables & ViewChild
// ============================================================

// SOLUTION 1: DomRefComponent
@Component({
  selector: 'app-dom-ref',
  standalone: true,
  template: `
    <div style="display: flex; flex-direction: column; gap: 8px; max-width: 320px;">
      <input #emailInput type="email" placeholder="Enter email…"
             (input)="liveValue = emailInput.value"
             style="padding: 8px; border-radius: 4px; border: 1px solid #ccc;" />
      <button (click)="emailInput.focus()"
              style="padding: 6px 14px; cursor: pointer; border-radius: 4px; border: 1px solid #3498db; color: #3498db;">
        Focus Input
      </button>
      <p>Live value: <code>{{ liveValue || '(empty)' }}</code></p>
    </div>
  `,
})
class DomRefComponent {
  liveValue = '';
}

// SOLUTION 2: ViewChildComponent (with child CounterBoxComponent)
@Component({
  selector: 'app-counter-box',
  standalone: true,
  template: `
    <div style="font-size: 2rem; font-weight: bold; text-align: center;
                background: #f0f4ff; padding: 16px; border-radius: 8px;">
      {{ count }}
    </div>
  `,
})
class CounterBoxComponent {
  count = 0;
  increment() { this.count++; }
  reset()     { this.count = 0; }
}

@Component({
  selector: 'app-viewchild-demo',
  standalone: true,
  imports: [CounterBoxComponent],
  template: `
    <app-counter-box #box />
    <div style="display: flex; gap: 8px; margin-top: 8px;">
      <button (click)="box.increment()"
              style="padding: 6px 16px; background: #27ae60; color: white;
                     border: none; border-radius: 4px; cursor: pointer;">
        Increment (template ref)
      </button>
      <button (click)="counterBox.increment()"
              style="padding: 6px 16px; background: #3498db; color: white;
                     border: none; border-radius: 4px; cursor: pointer;">
        Increment (@ViewChild)
      </button>
      <button (click)="counterBox.reset()"
              style="padding: 6px 16px; background: #e74c3c; color: white;
                     border: none; border-radius: 4px; cursor: pointer;">
        Reset
      </button>
    </div>
  `,
})
class ViewChildComponent implements AfterViewInit {
  @ViewChild(CounterBoxComponent) counterBox!: CounterBoxComponent;

  ngAfterViewInit() {
    console.log('ViewChild ready, initial count:', this.counterBox.count);
  }
}

// SOLUTION 3: TemplateOutletComponent
@Component({
  selector: 'app-template-outlet',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    <ng-template #loadingTpl>
      <div style="padding: 20px; text-align: center; color: gray;">
        ⏳ Loading data…
      </div>
    </ng-template>

    <ng-template #dataTable>
      <table style="width: 100%; border-collapse: collapse;">
        @for (row of rows; track row.id) {
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 6px;">{{ row.id }}</td>
            <td style="padding: 6px;">{{ row.name }}</td>
            <td style="padding: 6px; color: green;">{{ row.score }}</td>
          </tr>
        }
      </table>
    </ng-template>

    <div style="border: 1px solid #ddd; border-radius: 6px; padding: 12px; min-height: 80px;">
      <ng-container [ngTemplateOutlet]="isLoading ? loadingTpl : dataTable" />
    </div>
    <button (click)="isLoading = !isLoading" style="margin-top: 8px; padding: 6px 14px; cursor: pointer;">
      {{ isLoading ? 'Show Data' : 'Show Loading' }}
    </button>
  `,
})
class TemplateOutletComponent {
  isLoading = true;
  rows = [
    { id: 1, name: 'Alice', score: 95 },
    { id: 2, name: 'Bob',   score: 87 },
    { id: 3, name: 'Carol', score: 91 },
  ];
}

// SOLUTION 4: MultipleViewChildrenComponent
@Component({
  selector: 'app-highlight-box',
  standalone: true,
  template: `
    <div [style.background]="highlighted ? '#fff3cd' : '#f8f9fa'"
         [style.border]="highlighted ? '2px solid #ffc107' : '2px solid #dee2e6'"
         style="padding: 10px 14px; border-radius: 6px; text-align: center;">
      {{ label }}
    </div>
  `,
})
class HighlightBoxComponent {
  @Input() label   = '';
  highlighted = false;
}

@Component({
  selector: 'app-viewchildren-demo',
  standalone: true,
  imports: [HighlightBoxComponent],
  template: `
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px;">
      <app-highlight-box label="Box A" />
      <app-highlight-box label="Box B" />
      <app-highlight-box label="Box C" />
    </div>
    <div style="display: flex; gap: 8px;">
      <button (click)="highlightAll()"
              style="padding: 6px 14px; background: #f39c12; color: white;
                     border: none; border-radius: 4px; cursor: pointer;">
        Highlight All
      </button>
      <button (click)="clearAll()"
              style="padding: 6px 14px; background: #95a5a6; color: white;
                     border: none; border-radius: 4px; cursor: pointer;">
        Clear All
      </button>
    </div>
  `,
})
class MultipleViewChildrenComponent {
  @ViewChildren(HighlightBoxComponent) boxes!: QueryList<HighlightBoxComponent>;
  highlightAll() { this.boxes.forEach((b) => (b.highlighted = true));  }
  clearAll()     { this.boxes.forEach((b) => (b.highlighted = false)); }
}

// SOLUTION 5: ElementRefComponent
@Component({
  selector: 'app-element-ref',
  standalone: true,
  template: `
    <div style="padding: 20px; border: 2px solid #9b59b6; border-radius: 8px;
                text-align: center; margin-bottom: 10px;">
      <p style="margin: 0; font-size: 1.1rem;">I can be shaken!</p>
    </div>
    <button (click)="shakeIt()"
            style="padding: 6px 16px; background: #9b59b6; color: white;
                   border: none; border-radius: 4px; cursor: pointer;">
      Shake!
    </button>
  `,
  styles: [`@keyframes shake {
    0%,100% { transform: translateX(0); }
    20%,60% { transform: translateX(-8px); }
    40%,80% { transform: translateX(8px); }
  }`],
})
class ElementRefComponent {
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  shakeIt() {
    const host = this.el.nativeElement as HTMLElement;
    this.renderer.setStyle(host, 'animation', 'shake 0.4s ease');
    setTimeout(() => this.renderer.removeStyle(host, 'animation'), 450);
  }
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    DomRefComponent,
    ViewChildComponent,
    TemplateOutletComponent,
    MultipleViewChildrenComponent,
    ElementRefComponent,
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <h1>Solution 2.3 — Template Variables &amp; ViewChild</h1>

      <h2>1. Template Reference Variable (#ref)</h2>
      <app-dom-ref />
      <hr />

      <h2>2. @ViewChild — access child component API</h2>
      <app-viewchild-demo />
      <hr />

      <h2>3. ng-template + NgTemplateOutlet</h2>
      <app-template-outlet />
      <hr />

      <h2>4. @ViewChildren (QueryList)</h2>
      <app-viewchildren-demo />
      <hr />

      <h2>5. ElementRef + Renderer2</h2>
      <app-element-ref />
    </div>
  `,
})
export class AppComponent {}
