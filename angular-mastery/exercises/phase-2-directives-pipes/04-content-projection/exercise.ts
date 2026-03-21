import { Component } from '@angular/core';

// ============================================================
// Exercise 2.4 — Content Projection
// ============================================================
// Topics:
//   • <ng-content> — default slot
//   • <ng-content select="[slot-name]"> — named slots
//   • Multiple content slots in one component
//   • @ContentChild / @ContentChildren
//   • Conditional content projection with <ng-template>
//   • Providing default content when slot is empty
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: CardComponent (basic ng-content)
// ---------------------------------------------------------------------------
// selector='app-card'
// Template: a styled card wrapper with a single <ng-content>.
// Usage in root: <app-card><p>Hello!</p></app-card>

// ---------------------------------------------------------------------------
// TODO 2: PanelComponent (named slots)
// ---------------------------------------------------------------------------
// selector='app-panel'
// Template has three named slots:
//   <ng-content select="[panel-header]"> — sticky top bar
//   <ng-content select="[panel-body]">   — scrollable body
//   <ng-content select="[panel-footer]"> — bottom action bar
// Usage:
//   <app-panel>
//     <h3 panel-header>Title</h3>
//     <p panel-body>Content…</p>
//     <button panel-footer>OK</button>
//   </app-panel>

// ---------------------------------------------------------------------------
// TODO 3: TabsComponent (content projection with @ContentChildren)
// ---------------------------------------------------------------------------
// Create a TabComponent: selector='app-tab'
//   @Input() label = ''
//   Has a single <ng-content> in its template.
// Create a TabsComponent: selector='app-tabs'
//   @ContentChildren(TabComponent) tabs!: QueryList<TabComponent>
//   activeIndex = 0
//   Template: renders tab buttons from the QueryList labels,
//             and the active tab's content via ng-content within the right tab.
//   Hint: Use *ngFor + ngTemplateOutlet or just hide/show the tab bodies.

// ---------------------------------------------------------------------------
// TODO 4: AccordionComponent (conditional projection)
// ---------------------------------------------------------------------------
// selector='app-accordion'
// @Input() title = ''
// @Input() expanded = false
// Template: a header bar (click toggles expanded) and
//   <ng-content> shown only when expanded via @if.

// ---------------------------------------------------------------------------
// TODO 5: AlertComponent (default content fallback)
// ---------------------------------------------------------------------------
// selector='app-alert'
// @Input() type: 'info' | 'success' | 'warning' | 'error' = 'info'
// Template: coloured alert box. Uses named slots:
//   <ng-content select="[alert-title]"> (optional header)
//   <ng-content>                         (body text)
// Provide a default fallback in the template for when no content is projected.

// ---------------------------------------------------------------------------
// ROOT COMPONENT
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  template: `
    <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 2.4 — Content Projection</h1>
      <!-- TODO 6: add all components to imports[] and demonstrate them -->
    </div>
  `,
})
export class AppComponent {}
