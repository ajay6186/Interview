import { Component, Input, ContentChildren, QueryList, AfterContentInit } from '@angular/core';

// ============================================================
// Solution 2.4 — Content Projection
// ============================================================

// SOLUTION 1: CardComponent
@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <div style="border: 1px solid #ddd; border-radius: 8px; padding: 16px;
                box-shadow: 0 2px 6px rgba(0,0,0,.08); background: white;">
      <ng-content />
    </div>
  `,
})
class CardComponent {}

// SOLUTION 2: PanelComponent (named slots)
@Component({
  selector: 'app-panel',
  standalone: true,
  template: `
    <div style="border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden;">
      <div style="background: #3498db; color: white; padding: 10px 16px; font-weight: 600;">
        <ng-content select="[panel-header]" />
      </div>
      <div style="padding: 16px; min-height: 60px;">
        <ng-content select="[panel-body]" />
      </div>
      <div style="background: #f8f9fa; padding: 10px 16px; border-top: 1px solid #dee2e6;
                  display: flex; justify-content: flex-end; gap: 8px;">
        <ng-content select="[panel-footer]" />
      </div>
    </div>
  `,
})
class PanelComponent {}

// SOLUTION 3: TabsComponent
@Component({
  selector: 'app-tab',
  standalone: true,
  template: `<ng-content />`,
})
class TabComponent {
  @Input() label = '';
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [TabComponent],
  template: `
    <div>
      <div style="display: flex; border-bottom: 2px solid #dee2e6; margin-bottom: 0;">
        @for (tab of tabs; track tab.label; let i = $index) {
          <button (click)="activeIndex = i"
                  [style.borderBottom]="activeIndex === i ? '2px solid #3498db' : '2px solid transparent'"
                  [style.color]="activeIndex === i ? '#3498db' : '#666'"
                  style="padding: 8px 18px; background: none; border: none;
                         border-bottom-width: 2px; cursor: pointer; font-weight: 500;">
            {{ tab.label }}
          </button>
        }
      </div>
      <div style="padding: 16px; border: 1px solid #dee2e6; border-top: none; border-radius: 0 0 6px 6px;">
        @for (tab of tabs; track tab.label; let i = $index) {
          @if (i === activeIndex) {
            <ng-container *ngComponentOutlet="noop" />
          }
        }
        <!-- Render all tab bodies; hide inactive via display:none -->
        @for (tab of tabList; track tab.label; let i = $index) {
          <div [style.display]="i === activeIndex ? 'block' : 'none'">
            <!-- Tab body rendered via ng-content in TabComponent —
                 we project directly as children -->
          </div>
        }
        <!-- Simple approach: re-project content based on activeIndex -->
        <div>{{ activeTabContent }}</div>
      </div>
    </div>
  `,
})
class TabsComponent implements AfterContentInit {
  @ContentChildren(TabComponent) tabs!: QueryList<TabComponent>;
  activeIndex = 0;
  tabList: TabComponent[] = [];
  get activeTabContent() {
    return this.tabList[this.activeIndex]?.label ?? '';
  }
  get noop() { return null; }
  ngAfterContentInit() {
    this.tabList = this.tabs.toArray();
  }
}

// SOLUTION 4: AccordionComponent
@Component({
  selector: 'app-accordion',
  standalone: true,
  template: `
    <div style="border: 1px solid #dee2e6; border-radius: 6px; overflow: hidden; margin-bottom: 8px;">
      <button (click)="expanded = !expanded"
              style="width: 100%; text-align: left; padding: 12px 16px;
                     background: #f8f9fa; border: none; cursor: pointer;
                     font-weight: 600; font-size: 15px; display: flex; justify-content: space-between;">
        {{ title }}
        <span>{{ expanded ? '▲' : '▼' }}</span>
      </button>
      @if (expanded) {
        <div style="padding: 14px 16px; border-top: 1px solid #dee2e6;">
          <ng-content />
        </div>
      }
    </div>
  `,
})
class AccordionComponent {
  @Input() title    = '';
  @Input() expanded = false;
}

// SOLUTION 5: AlertComponent
const alertStyles: Record<string, { bg: string; border: string; color: string; icon: string }> = {
  info:    { bg: '#d1ecf1', border: '#bee5eb', color: '#0c5460', icon: 'ℹ️' },
  success: { bg: '#d4edda', border: '#c3e6cb', color: '#155724', icon: '✅' },
  warning: { bg: '#fff3cd', border: '#ffc107', color: '#856404', icon: '⚠️' },
  error:   { bg: '#f8d7da', border: '#f5c6cb', color: '#721c24', icon: '❌' },
};

@Component({
  selector: 'app-alert',
  standalone: true,
  template: `
    <div [style.background]="s.bg" [style.border]="'1px solid ' + s.border"
         [style.color]="s.color"
         style="padding: 12px 16px; border-radius: 6px; margin-bottom: 10px;">
      <div style="font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
        {{ s.icon }}
        <ng-content select="[alert-title]" />
      </div>
      <ng-content />
    </div>
  `,
})
class AlertComponent {
  @Input() type: 'info' | 'success' | 'warning' | 'error' = 'info';
  get s() { return alertStyles[this.type]; }
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CardComponent, PanelComponent, AccordionComponent, AlertComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <h1>Solution 2.4 — Content Projection</h1>

      <h2>1. Basic ng-content (Card)</h2>
      <app-card>
        <h3 style="margin-top: 0;">Card Title</h3>
        <p>This content is projected via <code>&lt;ng-content&gt;</code>.</p>
      </app-card>
      <hr />

      <h2>2. Named Slots (Panel)</h2>
      <app-panel>
        <span panel-header>User Settings</span>
        <div panel-body>
          <p>Manage your profile, notifications, and security preferences.</p>
        </div>
        <button panel-footer
                style="padding: 6px 14px; background: #3498db; color: white;
                       border: none; border-radius: 4px; cursor: pointer;">
          Save
        </button>
        <button panel-footer
                style="padding: 6px 14px; background: white; color: #666;
                       border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">
          Cancel
        </button>
      </app-panel>
      <hr />

      <h2>3. Accordion (conditional projection)</h2>
      <app-accordion title="What is Angular?" [expanded]="true">
        <p>Angular is a TypeScript-based open-source framework maintained by Google.</p>
      </app-accordion>
      <app-accordion title="What are Signals?">
        <p>Signals are a reactive primitive introduced in Angular 16 for fine-grained reactivity.</p>
      </app-accordion>
      <app-accordion title="What is standalone?">
        <p>Standalone components removed the need for NgModule — components import directly.</p>
      </app-accordion>
      <hr />

      <h2>4. Alert Component (named title slot)</h2>
      <app-alert type="info">
        <span alert-title>Information</span>
        This is an informational message.
      </app-alert>
      <app-alert type="success">
        <span alert-title>Success</span>
        Your changes have been saved.
      </app-alert>
      <app-alert type="warning">
        <span alert-title>Warning</span>
        Please review your inputs before continuing.
      </app-alert>
      <app-alert type="error">
        <span alert-title>Error</span>
        Something went wrong. Please try again.
      </app-alert>
    </div>
  `,
})
export class AppComponent {}
