import {
  Component,
  ContentChild,
  ContentChildren,
  QueryList,
  TemplateRef,
  Input,
  Output,
  EventEmitter,
  AfterContentInit,
  signal,
  computed,
  ViewContainerRef,
  inject,
  Directive,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

// ============================================================
// Examples 2.4 — Content Projection (ng-content) (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. Simple <ng-content> default slot — wrap any content
@Component({
  selector: 'ex-01',
  standalone: true,
  template: `<div style="border:1px solid #ccc;padding:8px"><ng-content /></div>`,
})
class Ex01 {}

// 2. <ng-content select="[header]"> named slot
@Component({
  selector: 'ex-02',
  standalone: true,
  template: `
    <div style="border:1px solid #0af;padding:8px">
      <div style="background:#e8f4ff;padding:4px"><ng-content select="[header]" /></div>
      <div style="padding:4px"><ng-content /></div>
    </div>
  `,
})
class Ex02 {}

// 3. <ng-content select=".title"> class selector slot
@Component({
  selector: 'ex-03',
  standalone: true,
  template: `
    <div style="border:1px solid #0c0;padding:8px">
      <strong><ng-content select=".title" /></strong>
      <div><ng-content /></div>
    </div>
  `,
})
class Ex03 {}

// 4. <ng-content select="h2"> element tag selector
@Component({
  selector: 'ex-04',
  standalone: true,
  template: `
    <section style="border:1px solid #f80;padding:8px">
      <ng-content select="h2" />
      <ng-content />
    </section>
  `,
})
class Ex04 {}

// 5. Multi-slot card: header + body + footer
@Component({
  selector: 'ex-05',
  standalone: true,
  template: `
    <div style="border:1px solid #888;border-radius:4px;overflow:hidden">
      <div style="background:#f0f0f0;padding:8px;border-bottom:1px solid #888"><ng-content select="[card-header]" /></div>
      <div style="padding:8px"><ng-content select="[card-body]" /></div>
      <div style="background:#f0f0f0;padding:8px;border-top:1px solid #888"><ng-content select="[card-footer]" /></div>
    </div>
  `,
})
class Ex05 {}

// 6. Button wrapper projecting label text
@Component({
  selector: 'ex-06',
  standalone: true,
  template: `<button style="background:#4CAF50;color:#fff;border:none;padding:6px 14px;border-radius:3px;cursor:pointer"><ng-content /></button>`,
})
class Ex06 {}

// 7. Alert component projecting message
@Component({
  selector: 'ex-07',
  standalone: true,
  template: `<div style="background:#fff3cd;border:1px solid #ffc107;padding:8px;border-radius:4px">⚠️ <ng-content /></div>`,
})
class Ex07 {}

// 8. Panel component with projected content
@Component({
  selector: 'ex-08',
  standalone: true,
  template: `<div style="background:#f9f9f9;border-left:4px solid #2196F3;padding:10px"><ng-content /></div>`,
})
class Ex08 {}

// 9. Wrapper div with projected children
@Component({
  selector: 'ex-09',
  standalone: true,
  template: `<div style="display:flex;gap:8px;flex-wrap:wrap"><ng-content /></div>`,
})
class Ex09 {}

// 10. Badge projecting count/label
@Component({
  selector: 'ex-10',
  standalone: true,
  template: `<span style="background:#e91e63;color:#fff;border-radius:12px;padding:2px 8px;font-size:12px"><ng-content /></span>`,
})
class Ex10 {}

// 11. Tooltip anchor projecting trigger element
@Component({
  selector: 'ex-11',
  standalone: true,
  template: `<span style="position:relative;display:inline-block" title="I am a tooltip"><ng-content /><span style="font-size:10px;color:#999"> [hover]</span></span>`,
})
class Ex11 {}

// 12. Section component with projected heading + body
@Component({
  selector: 'ex-12',
  standalone: true,
  template: `
    <section style="border:1px solid #ddd;padding:10px;margin-bottom:8px">
      <div style="font-weight:bold;margin-bottom:6px"><ng-content select="[section-title]" /></div>
      <div><ng-content select="[section-body]" /></div>
    </section>
  `,
})
class Ex12 {}

// 13. Callout box with icon slot + text slot
@Component({
  selector: 'ex-13',
  standalone: true,
  template: `
    <div style="display:flex;align-items:center;gap:10px;background:#e3f2fd;padding:10px;border-radius:4px">
      <span style="font-size:20px"><ng-content select="[callout-icon]" /></span>
      <span><ng-content select="[callout-text]" /></span>
    </div>
  `,
})
class Ex13 {}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────

// 14. ngProjectAs — project as different selector
@Component({
  selector: 'ex-14-inner',
  standalone: true,
  template: `<ng-content select="[slot-a]" />`,
})
class Ex14Inner {}

@Component({
  selector: 'ex-14',
  standalone: true,
  imports: [Ex14Inner],
  template: `
    <p style="font-size:12px;color:#555">ngProjectAs: the span below is projected as [slot-a]</p>
    <ex-14-inner>
      <span ngProjectAs="[slot-a]" style="color:green;font-weight:bold">I was projected as [slot-a]!</span>
    </ex-14-inner>
  `,
})
class Ex14 {}

// 15. Default slot fallback (shown when nothing projected)
@Component({
  selector: 'ex-15-wrapper',
  standalone: true,
  template: `
    <div style="border:1px dashed #999;padding:8px">
      <ng-content>
        <span style="color:#aaa;font-style:italic">Nothing projected — fallback text shown.</span>
      </ng-content>
    </div>
  `,
})
class Ex15Wrapper {}

@Component({
  selector: 'ex-15',
  standalone: true,
  imports: [Ex15Wrapper],
  template: `
    <ex-15-wrapper></ex-15-wrapper>
    <ex-15-wrapper><span>Actual projected content</span></ex-15-wrapper>
  `,
})
class Ex15 {}

// 16. Card with optional header slot (ng-content + @if)
@Component({
  selector: 'ex-16-card',
  standalone: true,
  template: `
    <div style="border:1px solid #2196F3;border-radius:4px;overflow:hidden">
      <div style="background:#2196F3;color:#fff;padding:6px"><ng-content select="[opt-header]" /></div>
      <div style="padding:8px"><ng-content /></div>
    </div>
  `,
})
class Ex16Card {}

@Component({
  selector: 'ex-16',
  standalone: true,
  imports: [Ex16Card],
  template: `
    <ex-16-card><span opt-header>Optional Header</span><p>Body content here.</p></ex-16-card>
    <ex-16-card><p>No header projected here.</p></ex-16-card>
  `,
})
class Ex16 {}

// 17. Tab panel projecting tab label + content
@Component({
  selector: 'ex-17-tab',
  standalone: true,
  template: `
    <div>
      <div style="background:#673AB7;color:#fff;padding:4px 10px;display:inline-block;border-radius:3px 3px 0 0"><ng-content select="[tab-label]" /></div>
      <div style="border:1px solid #673AB7;padding:8px"><ng-content select="[tab-content]" /></div>
    </div>
  `,
})
class Ex17Tab {}

@Component({
  selector: 'ex-17',
  standalone: true,
  imports: [Ex17Tab],
  template: `
    <ex-17-tab>
      <span tab-label>Tab One</span>
      <div tab-content>Content for Tab One</div>
    </ex-17-tab>
  `,
})
class Ex17 {}

// 18. Accordion item with projected title + body
@Component({
  selector: 'ex-18-accordion',
  standalone: true,
  template: `
    <div style="border:1px solid #ddd;margin-bottom:4px">
      <div style="background:#eee;padding:6px;font-weight:bold"><ng-content select="[acc-title]" /></div>
      <div style="padding:8px"><ng-content select="[acc-body]" /></div>
    </div>
  `,
})
class Ex18Accordion {}

@Component({
  selector: 'ex-18',
  standalone: true,
  imports: [Ex18Accordion],
  template: `
    <ex-18-accordion>
      <span acc-title>Section A</span>
      <p acc-body>Content for section A.</p>
    </ex-18-accordion>
  `,
})
class Ex18 {}

// 19. Dialog with title + content + actions
@Component({
  selector: 'ex-19-dialog',
  standalone: true,
  template: `
    <div style="border:2px solid #333;border-radius:6px;max-width:320px;overflow:hidden">
      <div style="background:#333;color:#fff;padding:8px"><ng-content select="[dlg-title]" /></div>
      <div style="padding:12px"><ng-content select="[dlg-content]" /></div>
      <div style="background:#f5f5f5;padding:8px;text-align:right"><ng-content select="[dlg-actions]" /></div>
    </div>
  `,
})
class Ex19Dialog {}

@Component({
  selector: 'ex-19',
  standalone: true,
  imports: [Ex19Dialog],
  template: `
    <ex-19-dialog>
      <span dlg-title>Confirm Action</span>
      <p dlg-content>Are you sure you want to proceed?</p>
      <button dlg-actions>Cancel</button>
    </ex-19-dialog>
  `,
})
class Ex19 {}

// 20. Form field wrapper projecting label + input + error
@Component({
  selector: 'ex-20-field',
  standalone: true,
  template: `
    <div style="display:flex;flex-direction:column;gap:3px;margin-bottom:8px">
      <div style="font-size:12px;font-weight:bold;color:#555"><ng-content select="[field-label]" /></div>
      <div><ng-content select="[field-input]" /></div>
      <div style="font-size:11px;color:red"><ng-content select="[field-error]" /></div>
    </div>
  `,
})
class Ex20Field {}

@Component({
  selector: 'ex-20',
  standalone: true,
  imports: [Ex20Field],
  template: `
    <ex-20-field>
      <label field-label>Email</label>
      <input field-input type="email" placeholder="you@example.com" />
      <span field-error>Email is required</span>
    </ex-20-field>
  `,
})
class Ex20 {}

// 21. Layout: sidebar + main content projection
@Component({
  selector: 'ex-21-layout',
  standalone: true,
  template: `
    <div style="display:flex;gap:10px;border:1px solid #ccc;padding:8px">
      <nav style="width:120px;background:#f0f0f0;padding:8px"><ng-content select="[sidebar]" /></nav>
      <main style="flex:1;padding:8px"><ng-content select="[main-content]" /></main>
    </div>
  `,
})
class Ex21Layout {}

@Component({
  selector: 'ex-21',
  standalone: true,
  imports: [Ex21Layout],
  template: `
    <ex-21-layout>
      <ul sidebar style="list-style:none;padding:0;margin:0"><li>Nav 1</li><li>Nav 2</li></ul>
      <p main-content>Main area content projected here.</p>
    </ex-21-layout>
  `,
})
class Ex21 {}

// 22. Header with logo + nav + actions slots
@Component({
  selector: 'ex-22-header',
  standalone: true,
  template: `
    <header style="display:flex;align-items:center;gap:12px;background:#1a1a2e;color:#fff;padding:8px;border-radius:4px">
      <div><ng-content select="[logo]" /></div>
      <nav style="flex:1"><ng-content select="[nav]" /></nav>
      <div><ng-content select="[actions]" /></div>
    </header>
  `,
})
class Ex22Header {}

@Component({
  selector: 'ex-22',
  standalone: true,
  imports: [Ex22Header],
  template: `
    <ex-22-header>
      <strong logo>MyApp</strong>
      <span nav style="color:#aaa">Home | About | Contact</span>
      <button actions>Login</button>
    </ex-22-header>
  `,
})
class Ex22 {}

// 23. Article with aside + main slots
@Component({
  selector: 'ex-23-article',
  standalone: true,
  template: `
    <div style="display:flex;gap:10px">
      <aside style="width:150px;background:#fafafa;border:1px solid #eee;padding:8px"><ng-content select="[aside]" /></aside>
      <article style="flex:1"><ng-content select="[main]" /></article>
    </div>
  `,
})
class Ex23Article {}

@Component({
  selector: 'ex-23',
  standalone: true,
  imports: [Ex23Article],
  template: `
    <ex-23-article>
      <div aside><strong>Related Links</strong><ul><li>Link A</li></ul></div>
      <div main><h3>Article Title</h3><p>Article body text here.</p></div>
    </ex-23-article>
  `,
})
class Ex23 {}

// 24. Modal with projected trigger + content
@Component({
  selector: 'ex-24-modal',
  standalone: true,
  template: `
    <div>
      <div style="margin-bottom:6px"><ng-content select="[modal-trigger]" /></div>
      <div style="border:2px solid #333;padding:12px;background:#fff;border-radius:6px">
        <ng-content select="[modal-content]" />
      </div>
    </div>
  `,
})
class Ex24Modal {}

@Component({
  selector: 'ex-24',
  standalone: true,
  imports: [Ex24Modal],
  template: `
    <ex-24-modal>
      <button modal-trigger>Open Modal</button>
      <div modal-content><p>Modal body content projected.</p></div>
    </ex-24-modal>
  `,
})
class Ex24 {}

// 25. Stepper with projected step components
@Component({
  selector: 'ex-25-step',
  standalone: true,
  template: `
    <div style="display:flex;align-items:center;gap:8px;padding:6px;border:1px solid #ddd;margin-bottom:4px">
      <div style="background:#4CAF50;color:#fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px"><ng-content select="[step-num]" /></div>
      <div><ng-content select="[step-label]" /></div>
    </div>
  `,
})
class Ex25Step {}

@Component({
  selector: 'ex-25',
  standalone: true,
  imports: [Ex25Step],
  template: `
    <ex-25-step><span step-num>1</span><span step-label>Choose Plan</span></ex-25-step>
    <ex-25-step><span step-num>2</span><span step-label>Payment</span></ex-25-step>
    <ex-25-step><span step-num>3</span><span step-label>Confirm</span></ex-25-step>
  `,
})
class Ex25 {}

// 26. Multi-slot container with conditional slot display
@Component({
  selector: 'ex-26-container',
  standalone: true,
  template: `
    <div style="border:1px solid #ccc;padding:8px">
      <div style="background:#fffde7;padding:4px;margin-bottom:4px"><ng-content select="[slot-top]" /></div>
      <div style="padding:4px"><ng-content /></div>
      <div style="background:#e8f5e9;padding:4px;margin-top:4px"><ng-content select="[slot-bottom]" /></div>
    </div>
  `,
})
class Ex26Container {}

@Component({
  selector: 'ex-26',
  standalone: true,
  imports: [Ex26Container],
  template: `
    <ex-26-container>
      <span slot-top>Top Slot</span>
      <p>Default slot content</p>
      <span slot-bottom>Bottom Slot</span>
    </ex-26-container>
  `,
})
class Ex26 {}

// ─── NESTED (27–38) ──────────────────────────────────────────

// 27. Three-level projection (grandparent→parent→child)
@Component({
  selector: 'ex-27-child',
  standalone: true,
  template: `<div style="border:1px solid #e91e63;padding:4px">Child: <ng-content /></div>`,
})
class Ex27Child {}

@Component({
  selector: 'ex-27-parent',
  standalone: true,
  imports: [Ex27Child],
  template: `<div style="border:1px solid #9c27b0;padding:4px">Parent: <ex-27-child><ng-content /></ex-27-child></div>`,
})
class Ex27Parent {}

@Component({
  selector: 'ex-27',
  standalone: true,
  imports: [Ex27Parent],
  template: `<ex-27-parent><strong>Grand-projected content</strong></ex-27-parent>`,
})
class Ex27 {}

// 28. Card grid where each card uses projection
@Component({
  selector: 'ex-28-card',
  standalone: true,
  template: `<div style="border:1px solid #2196F3;border-radius:4px;padding:8px"><ng-content /></div>`,
})
class Ex28Card {}

@Component({
  selector: 'ex-28',
  standalone: true,
  imports: [Ex28Card],
  template: `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
      @for (item of items; track item) {
        <ex-28-card><strong>{{ item }}</strong></ex-28-card>
      }
    </div>
  `,
})
class Ex28 {
  items = ['Card A', 'Card B', 'Card C'];
}

// 29. Tabs component with projected tab panels
@Component({
  selector: 'ex-29-panel',
  standalone: true,
  template: `
    <div style="border:1px solid #673AB7;padding:8px">
      <div style="background:#673AB7;color:#fff;padding:3px 8px;font-size:12px"><ng-content select="[panel-title]" /></div>
      <div style="padding:6px"><ng-content select="[panel-body]" /></div>
    </div>
  `,
})
class Ex29Panel {}

@Component({
  selector: 'ex-29-tabs',
  standalone: true,
  imports: [Ex29Panel],
  template: `<div style="display:flex;flex-direction:column;gap:4px"><ng-content /></div>`,
})
class Ex29Tabs {}

@Component({
  selector: 'ex-29',
  standalone: true,
  imports: [Ex29Tabs, Ex29Panel],
  template: `
    <ex-29-tabs>
      <ex-29-panel>
        <span panel-title>Tab 1</span>
        <span panel-body>Tab 1 body</span>
      </ex-29-panel>
      <ex-29-panel>
        <span panel-title>Tab 2</span>
        <span panel-body>Tab 2 body</span>
      </ex-29-panel>
    </ex-29-tabs>
  `,
})
class Ex29 {}

// 30. Projected content inside @for loop
@Component({
  selector: 'ex-30-item',
  standalone: true,
  template: `<li style="padding:4px;border-bottom:1px solid #eee"><ng-content /></li>`,
})
class Ex30Item {}

@Component({
  selector: 'ex-30',
  standalone: true,
  imports: [Ex30Item],
  template: `
    <ul style="list-style:none;padding:0;border:1px solid #ccc">
      @for (fruit of fruits; track fruit) {
        <ex-30-item><span>{{ fruit }}</span></ex-30-item>
      }
    </ul>
  `,
})
class Ex30 {
  fruits = ['Apple', 'Banana', 'Cherry'];
}

// 31. Accordion with multiple projected items
@Component({
  selector: 'ex-31-acc-item',
  standalone: true,
  template: `
    <div style="border:1px solid #FF9800;margin-bottom:2px">
      <div style="background:#FF9800;color:#fff;padding:4px"><ng-content select="[acc-hd]" /></div>
      <div style="padding:6px"><ng-content select="[acc-bd]" /></div>
    </div>
  `,
})
class Ex31AccItem {}

@Component({
  selector: 'ex-31',
  standalone: true,
  imports: [Ex31AccItem],
  template: `
    <div>
      @for (item of sections; track item.title) {
        <ex-31-acc-item>
          <span acc-hd>{{ item.title }}</span>
          <span acc-bd>{{ item.body }}</span>
        </ex-31-acc-item>
      }
    </div>
  `,
})
class Ex31 {
  sections = [
    { title: 'FAQ 1', body: 'Answer to FAQ 1' },
    { title: 'FAQ 2', body: 'Answer to FAQ 2' },
  ];
}

// 32. Page layout with nested slot-based sections
@Component({
  selector: 'ex-32-section',
  standalone: true,
  template: `<section style="border:1px solid #607D8B;padding:8px;margin-bottom:4px"><ng-content /></section>`,
})
class Ex32Section {}

@Component({
  selector: 'ex-32-page',
  standalone: true,
  imports: [Ex32Section],
  template: `
    <div style="border:2px solid #37474F;padding:8px">
      <ng-content select="[page-header]" />
      <ng-content select="[page-body]" />
      <ng-content select="[page-footer]" />
    </div>
  `,
})
class Ex32Page {}

@Component({
  selector: 'ex-32',
  standalone: true,
  imports: [Ex32Page, Ex32Section],
  template: `
    <ex-32-page>
      <ex-32-section page-header><h4 style="margin:0">Header Section</h4></ex-32-section>
      <ex-32-section page-body><p style="margin:0">Body Section Content</p></ex-32-section>
      <ex-32-section page-footer><small>Footer Section</small></ex-32-section>
    </ex-32-page>
  `,
})
class Ex32 {}

// 33. Table with projected header/row/footer
@Component({
  selector: 'ex-33-table',
  standalone: true,
  template: `
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead style="background:#f5f5f5"><ng-content select="[t-head]" /></thead>
      <tbody><ng-content select="[t-body]" /></tbody>
      <tfoot style="background:#f5f5f5"><ng-content select="[t-foot]" /></tfoot>
    </table>
  `,
})
class Ex33Table {}

@Component({
  selector: 'ex-33',
  standalone: true,
  imports: [Ex33Table],
  template: `
    <ex-33-table>
      <tr t-head><th style="padding:4px;border:1px solid #ddd">Name</th><th style="padding:4px;border:1px solid #ddd">Score</th></tr>
      <tr t-body><td style="padding:4px;border:1px solid #ddd">Alice</td><td style="padding:4px;border:1px solid #ddd">95</td></tr>
      <tr t-body><td style="padding:4px;border:1px solid #ddd">Bob</td><td style="padding:4px;border:1px solid #ddd">87</td></tr>
      <tr t-foot><td style="padding:4px;border:1px solid #ddd" colspan="2">Total: 2 rows</td></tr>
    </ex-33-table>
  `,
})
class Ex33 {}

// 34. Form wizard with projected step content
@Component({
  selector: 'ex-34-wizard-step',
  standalone: true,
  template: `
    <div style="border:1px solid #03A9F4;padding:8px;margin-bottom:4px">
      <div style="color:#03A9F4;font-weight:bold;margin-bottom:4px"><ng-content select="[wiz-title]" /></div>
      <div><ng-content select="[wiz-content]" /></div>
    </div>
  `,
})
class Ex34WizardStep {}

@Component({
  selector: 'ex-34',
  standalone: true,
  imports: [Ex34WizardStep],
  template: `
    <ex-34-wizard-step>
      <span wiz-title>Step 1: Account</span>
      <div wiz-content><input placeholder="Username" /></div>
    </ex-34-wizard-step>
    <ex-34-wizard-step>
      <span wiz-title>Step 2: Profile</span>
      <div wiz-content><input placeholder="Full name" /></div>
    </ex-34-wizard-step>
  `,
})
class Ex34 {}

// 35. Dashboard with projected widget slots
@Component({
  selector: 'ex-35-widget',
  standalone: true,
  template: `
    <div style="border:1px solid #9E9E9E;border-radius:4px;padding:8px;background:#fafafa">
      <div style="font-size:11px;color:#9E9E9E;margin-bottom:4px"><ng-content select="[widget-title]" /></div>
      <div><ng-content select="[widget-body]" /></div>
    </div>
  `,
})
class Ex35Widget {}

@Component({
  selector: 'ex-35',
  standalone: true,
  imports: [Ex35Widget],
  template: `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <ex-35-widget>
        <span widget-title>USERS</span>
        <span widget-body style="font-size:24px;font-weight:bold">1,204</span>
      </ex-35-widget>
      <ex-35-widget>
        <span widget-title>REVENUE</span>
        <span widget-body style="font-size:24px;font-weight:bold">$8,430</span>
      </ex-35-widget>
    </div>
  `,
})
class Ex35 {}

// 36. Drawer/sidebar with projected menu items
@Component({
  selector: 'ex-36-drawer',
  standalone: true,
  template: `
    <aside style="width:180px;background:#263238;color:#fff;padding:10px;border-radius:4px;min-height:80px">
      <div style="font-size:12px;opacity:0.6;margin-bottom:6px">MENU</div>
      <ng-content />
    </aside>
  `,
})
class Ex36Drawer {}

@Component({
  selector: 'ex-36',
  standalone: true,
  imports: [Ex36Drawer],
  template: `
    <ex-36-drawer>
      <div style="padding:4px 0;cursor:pointer">📊 Dashboard</div>
      <div style="padding:4px 0;cursor:pointer">👤 Profile</div>
      <div style="padding:4px 0;cursor:pointer">⚙️ Settings</div>
    </ex-36-drawer>
  `,
})
class Ex36 {}

// 37. Notification with projected icon + message + actions
@Component({
  selector: 'ex-37-notif',
  standalone: true,
  template: `
    <div style="display:flex;align-items:center;gap:10px;background:#e8f5e9;border:1px solid #4CAF50;padding:8px;border-radius:4px">
      <span style="font-size:18px"><ng-content select="[notif-icon]" /></span>
      <span style="flex:1"><ng-content select="[notif-msg]" /></span>
      <span><ng-content select="[notif-actions]" /></span>
    </div>
  `,
})
class Ex37Notif {}

@Component({
  selector: 'ex-37',
  standalone: true,
  imports: [Ex37Notif],
  template: `
    <ex-37-notif>
      <span notif-icon>✅</span>
      <span notif-msg>Your changes have been saved successfully.</span>
      <button notif-actions style="font-size:11px">Dismiss</button>
    </ex-37-notif>
  `,
})
class Ex37 {}

// 38. Breadcrumb wrapper with projected items
@Component({
  selector: 'ex-38-breadcrumb',
  standalone: true,
  template: `
    <nav style="font-size:13px;color:#666">
      <ng-content />
    </nav>
  `,
})
class Ex38Breadcrumb {}

@Component({
  selector: 'ex-38',
  standalone: true,
  imports: [Ex38Breadcrumb],
  template: `
    <ex-38-breadcrumb>
      <span>Home</span>
      <span style="margin:0 4px">›</span>
      <span>Products</span>
      <span style="margin:0 4px">›</span>
      <span style="color:#333;font-weight:bold">Detail</span>
    </ex-38-breadcrumb>
  `,
})
class Ex38 {}

// ─── ADVANCED (39–50) ────────────────────────────────────────

// 39. @ContentChild to access projected component ref
@Component({
  selector: 'ex-39-projected',
  standalone: true,
  template: `<div style="border:1px solid #E91E63;padding:4px">Projected Item</div>`,
})
class Ex39Projected {
  label = 'I am projected';
}

@Component({
  selector: 'ex-39-host',
  standalone: true,
  template: `
    <div style="border:1px solid #9C27B0;padding:8px">
      <ng-content />
      <p style="font-size:11px;color:#9C27B0;margin:4px 0 0">ContentChild label: "{{ childLabel }}"</p>
    </div>
  `,
})
class Ex39Host implements AfterContentInit {
  @ContentChild(Ex39Projected) projected!: Ex39Projected;
  childLabel = '';
  ngAfterContentInit() {
    this.childLabel = this.projected?.label ?? '(none)';
  }
}

@Component({
  selector: 'ex-39',
  standalone: true,
  imports: [Ex39Host, Ex39Projected],
  template: `<ex-39-host><ex-39-projected /></ex-39-host>`,
})
class Ex39 {}

// 40. @ContentChildren to query all projected items
@Component({
  selector: 'ex-40-chip',
  standalone: true,
  template: `<span style="background:#E0E0E0;border-radius:12px;padding:2px 8px;font-size:12px"><ng-content /></span>`,
})
class Ex40Chip {
  value = '';
}

@Component({
  selector: 'ex-40-host',
  standalone: true,
  template: `
    <div style="border:1px solid #3F51B5;padding:8px">
      <div style="display:flex;gap:4px;flex-wrap:wrap"><ng-content /></div>
      <p style="font-size:11px;margin:6px 0 0">Total chips: {{ count }}</p>
    </div>
  `,
})
class Ex40Host implements AfterContentInit {
  @ContentChildren(Ex40Chip) chips!: QueryList<Ex40Chip>;
  count = 0;
  ngAfterContentInit() {
    this.count = this.chips.length;
  }
}

@Component({
  selector: 'ex-40',
  standalone: true,
  imports: [Ex40Host, Ex40Chip],
  template: `
    <ex-40-host>
      <ex-40-chip>Angular</ex-40-chip>
      <ex-40-chip>React</ex-40-chip>
      <ex-40-chip>Vue</ex-40-chip>
    </ex-40-host>
  `,
})
class Ex40 {}

// 41. ng-template as projected slot (TemplateRef)
@Component({
  selector: 'ex-41-host',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    <div style="border:1px solid #009688;padding:8px">
      <p style="font-size:12px;color:#009688">Custom template projected via ng-template:</p>
      @if (tplRef) {
        <ng-container [ngTemplateOutlet]="tplRef" />
      }
    </div>
  `,
})
class Ex41Host implements AfterContentInit {
  @ContentChild(TemplateRef) tplRef!: TemplateRef<unknown>;
  ngAfterContentInit() {}
}

@Component({
  selector: 'ex-41',
  standalone: true,
  imports: [Ex41Host],
  template: `
    <ex-41-host>
      <ng-template><strong style="color:#009688">I am a projected ng-template!</strong></ng-template>
    </ex-41-host>
  `,
})
class Ex41 {}

// 42. Dynamic slot selection via @Input() string
@Component({
  selector: 'ex-42-panel',
  standalone: true,
  template: `
    <div style="border:1px solid #FF5722;padding:8px">
      <div style="background:#FF5722;color:#fff;padding:4px;margin-bottom:6px">
        Slot: {{ activeSlot }}
      </div>
      <ng-content select="[primary]" />
      <ng-content select="[secondary]" />
    </div>
  `,
})
class Ex42Panel {
  @Input() activeSlot = 'primary';
}

@Component({
  selector: 'ex-42',
  standalone: true,
  imports: [Ex42Panel],
  template: `
    <ex-42-panel activeSlot="primary">
      <div primary style="color:green">Primary slot content</div>
      <div secondary style="color:blue">Secondary slot content</div>
    </ex-42-panel>
  `,
})
class Ex42 {}

// 43. Projected content with @Output communication
@Component({
  selector: 'ex-43-wrapper',
  standalone: true,
  template: `
    <div style="border:1px solid #795548;padding:8px">
      <ng-content />
      <p style="font-size:11px;color:#795548;margin-top:6px">Last event: {{ lastEvent }}</p>
    </div>
  `,
})
class Ex43Wrapper {
  lastEvent = '(none)';
  handleEvent(msg: string) {
    this.lastEvent = msg;
  }
}

@Component({
  selector: 'ex-43-inner',
  standalone: true,
  template: `<button (click)="notify.emit('clicked at ' + time())">Emit Event</button>`,
})
class Ex43Inner {
  @Output() notify = new EventEmitter<string>();
  time() { return new Date().toLocaleTimeString(); }
}

@Component({
  selector: 'ex-43',
  standalone: true,
  imports: [Ex43Wrapper, Ex43Inner],
  template: `
    <ex-43-wrapper #w>
      <ex-43-inner (notify)="w.handleEvent($event)" />
    </ex-43-wrapper>
  `,
})
class Ex43 {}

// 44. ContentChild with signal update on projection
@Component({
  selector: 'ex-44-item',
  standalone: true,
  template: `<div style="border:1px solid #00BCD4;padding:4px">Signal Item</div>`,
})
class Ex44Item {
  name = signal('Projected Component');
}

@Component({
  selector: 'ex-44-host',
  standalone: true,
  template: `
    <div style="border:1px solid #0097A7;padding:8px">
      <ng-content />
      <p style="font-size:11px;color:#0097A7;margin-top:6px">Signal value: {{ projectedName() }}</p>
    </div>
  `,
})
class Ex44Host implements AfterContentInit {
  @ContentChild(Ex44Item) item!: Ex44Item;
  projectedName = signal('(waiting...)');
  ngAfterContentInit() {
    if (this.item) {
      this.projectedName.set(this.item.name());
    }
  }
}

@Component({
  selector: 'ex-44',
  standalone: true,
  imports: [Ex44Host, Ex44Item],
  template: `<ex-44-host><ex-44-item /></ex-44-host>`,
})
class Ex44 {}

// 45. ngProjectAs with component type selector
@Component({
  selector: 'ex-45-slot-target',
  standalone: true,
  template: `<div style="border:1px solid #8BC34A;padding:4px">I am the slot target component</div>`,
})
class Ex45SlotTarget {}

@Component({
  selector: 'ex-45-host',
  standalone: true,
  template: `
    <div style="border:1px solid #558B2F;padding:8px">
      <p style="font-size:12px;margin:0 0 4px">Content projected as ex-45-slot-target:</p>
      <ng-content select="ex-45-slot-target" />
    </div>
  `,
})
class Ex45Host {}

@Component({
  selector: 'ex-45',
  standalone: true,
  imports: [Ex45Host, Ex45SlotTarget],
  template: `
    <ex-45-host>
      <div ngProjectAs="ex-45-slot-target" style="background:#DCEDC8;padding:4px">
        I am a div acting as ex-45-slot-target via ngProjectAs
      </div>
    </ex-45-host>
  `,
})
class Ex45 {}

// 46. Multi-content with conditional slot fallback
@Component({
  selector: 'ex-46-box',
  standalone: true,
  template: `
    <div style="border:1px solid #F44336;padding:8px">
      <div style="font-size:12px;color:#F44336">Slot A:</div>
      <ng-content select="[slot-a]">
        <em style="color:#aaa">No slot-a content</em>
      </ng-content>
      <div style="font-size:12px;color:#F44336;margin-top:4px">Slot B:</div>
      <ng-content select="[slot-b]">
        <em style="color:#aaa">No slot-b content</em>
      </ng-content>
    </div>
  `,
})
class Ex46Box {}

@Component({
  selector: 'ex-46',
  standalone: true,
  imports: [Ex46Box],
  template: `
    <ex-46-box>
      <span slot-a>Content for slot A</span>
    </ex-46-box>
    <ex-46-box></ex-46-box>
  `,
})
class Ex46 {}

// 47. Slot with type-safe projected component
@Directive({ selector: '[ex47Badge]', standalone: true })
class Ex47BadgeDirective {
  @Input('ex47Badge') label = '';
}

@Component({
  selector: 'ex-47-host',
  standalone: true,
  template: `
    <div style="border:1px solid #9C27B0;padding:8px">
      <ng-content select="[ex47Badge]" />
      <p style="font-size:11px;color:#9C27B0;margin-top:6px">Badge label: "{{ badge?.label ?? '(none)' }}"</p>
    </div>
  `,
})
class Ex47Host implements AfterContentInit {
  @ContentChild(Ex47BadgeDirective) badge?: Ex47BadgeDirective;
  ngAfterContentInit() {}
}

@Component({
  selector: 'ex-47',
  standalone: true,
  imports: [Ex47Host, Ex47BadgeDirective],
  template: `
    <ex-47-host>
      <span [ex47Badge]="'Premium'" style="background:#9C27B0;color:#fff;padding:2px 8px;border-radius:12px">Premium</span>
    </ex-47-host>
  `,
})
class Ex47 {}

// 48. Content projection + ViewContainerRef combination
@Component({
  selector: 'ex-48-host',
  standalone: true,
  template: `
    <div style="border:1px solid #3F51B5;padding:8px">
      <ng-content />
      <div #dynamicSlot></div>
    </div>
  `,
})
class Ex48Host implements AfterContentInit {
  private vcr = inject(ViewContainerRef);
  ngAfterContentInit() {
    // ViewContainerRef is available; projected content already placed by Angular
  }
}

@Component({
  selector: 'ex-48',
  standalone: true,
  imports: [Ex48Host],
  template: `
    <ex-48-host>
      <p style="font-size:13px">Projected content + ViewContainerRef both available in host.</p>
    </ex-48-host>
  `,
})
class Ex48 {}

// 49. Lazy projected content (ng-template defer)
@Component({
  selector: 'ex-49-lazy-host',
  standalone: true,
  template: `
    <div style="border:1px solid #FF9800;padding:8px">
      <p style="font-size:12px;margin:0 0 4px;color:#FF9800">Deferred projected template:</p>
      <ng-content />
    </div>
  `,
})
class Ex49LazyHost {}

@Component({
  selector: 'ex-49',
  standalone: true,
  imports: [Ex49LazyHost],
  template: `
    <ex-49-lazy-host>
      @defer (on idle) {
        <div style="background:#FFF3E0;padding:6px;border-radius:3px">
          Lazily rendered projected content (loaded on idle)
        </div>
      } @placeholder {
        <span style="color:#aaa;font-style:italic">Loading deferred content...</span>
      }
    </ex-49-lazy-host>
  `,
})
class Ex49 {}

// 50. Full compound component with rich content projection
@Component({
  selector: 'ex-50-compound-header',
  standalone: true,
  template: `<div style="background:#1565C0;color:#fff;padding:10px 12px;display:flex;align-items:center;gap:10px"><ng-content select="[brand]" /><nav style="flex:1"><ng-content select="[nav]" /></nav><ng-content select="[cta]" /></div>`,
})
class Ex50CompoundHeader {}

@Component({
  selector: 'ex-50-compound-hero',
  standalone: true,
  template: `<div style="background:linear-gradient(135deg,#1976D2,#42A5F5);color:#fff;padding:30px 20px;text-align:center"><ng-content /></div>`,
})
class Ex50CompoundHero {}

@Component({
  selector: 'ex-50-compound-body',
  standalone: true,
  template: `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;padding:12px"><ng-content /></div>`,
})
class Ex50CompoundBody {}

@Component({
  selector: 'ex-50-compound-card',
  standalone: true,
  template: `<div style="border:1px solid #90CAF9;border-radius:6px;padding:10px;background:#E3F2FD"><ng-content select="[card-icon]" /><div style="font-weight:bold;margin:4px 0"><ng-content select="[card-title]" /></div><div style="font-size:12px;color:#555"><ng-content select="[card-desc]" /></div></div>`,
})
class Ex50CompoundCard {}

@Component({
  selector: 'ex-50-compound-footer',
  standalone: true,
  template: `<footer style="background:#1a1a2e;color:#aaa;padding:10px;text-align:center;font-size:12px"><ng-content /></footer>`,
})
class Ex50CompoundFooter {}

@Component({
  selector: 'ex-50',
  standalone: true,
  imports: [Ex50CompoundHeader, Ex50CompoundHero, Ex50CompoundBody, Ex50CompoundCard, Ex50CompoundFooter],
  template: `
    <div style="border:2px solid #1565C0;border-radius:6px;overflow:hidden">
      <ex-50-compound-header>
        <strong brand>MyBrand</strong>
        <span nav style="font-size:13px;color:rgba(255,255,255,0.8)">Home · Products · Docs</span>
        <button cta style="background:#fff;color:#1565C0;border:none;padding:4px 10px;border-radius:3px;cursor:pointer">Get Started</button>
      </ex-50-compound-header>
      <ex-50-compound-hero>
        <h2 style="margin:0 0 8px">Welcome to the Platform</h2>
        <p style="margin:0;opacity:0.9">Build powerful apps with Angular content projection.</p>
      </ex-50-compound-hero>
      <ex-50-compound-body>
        <ex-50-compound-card>
          <span card-icon style="font-size:20px">⚡</span>
          <span card-title>Fast</span>
          <span card-desc>Optimized rendering pipeline</span>
        </ex-50-compound-card>
        <ex-50-compound-card>
          <span card-icon style="font-size:20px">🔒</span>
          <span card-title>Secure</span>
          <span card-desc>Built-in security practices</span>
        </ex-50-compound-card>
        <ex-50-compound-card>
          <span card-icon style="font-size:20px">🧩</span>
          <span card-title>Modular</span>
          <span card-desc>Composable component system</span>
        </ex-50-compound-card>
      </ex-50-compound-body>
      <ex-50-compound-footer>© 2026 MyBrand · All Rights Reserved</ex-50-compound-footer>
    </div>
  `,
})
class Ex50 {}

// ─── App Root ────────────────────────────────────────────────

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
      <h1>Examples 2.4 — Content Projection (ng-content)</h1>

      <h4>1. Simple &lt;ng-content&gt; default slot</h4>
      <ex-01><span>Hello from default slot!</span></ex-01><hr />

      <h4>2. &lt;ng-content select="[header]"&gt; named slot</h4>
      <ex-02><span header>Header Text</span><span>Body Text</span></ex-02><hr />

      <h4>3. &lt;ng-content select=".title"&gt; class selector slot</h4>
      <ex-03><span class="title">My Title</span><span>Body content</span></ex-03><hr />

      <h4>4. &lt;ng-content select="h2"&gt; element tag selector</h4>
      <ex-04><h2>Section Heading</h2><p>Paragraph body</p></ex-04><hr />

      <h4>5. Multi-slot card: header + body + footer</h4>
      <ex-05>
        <span card-header>Card Header</span>
        <p card-body>Card body content here.</p>
        <span card-footer>Card Footer</span>
      </ex-05><hr />

      <h4>6. Button wrapper projecting label text</h4>
      <ex-06>Click Me!</ex-06><hr />

      <h4>7. Alert component projecting message</h4>
      <ex-07>Low disk space warning</ex-07><hr />

      <h4>8. Panel component with projected content</h4>
      <ex-08>Important panel information displayed here.</ex-08><hr />

      <h4>9. Wrapper div with projected children</h4>
      <ex-09><span>Item A</span><span>Item B</span><span>Item C</span></ex-09><hr />

      <h4>10. Badge projecting count/label</h4>
      <ex-10>42</ex-10><hr />

      <h4>11. Tooltip anchor projecting trigger element</h4>
      <ex-11>Hover over me</ex-11><hr />

      <h4>12. Section component with projected heading + body</h4>
      <ex-12>
        <span section-title>Section Title</span>
        <p section-body>Section body paragraph.</p>
      </ex-12><hr />

      <h4>13. Callout box with icon slot + text slot</h4>
      <ex-13>
        <span callout-icon>💡</span>
        <span callout-text>Pro tip: Use content projection for flexible components.</span>
      </ex-13><hr />

      <h4>14. ngProjectAs — project as different selector</h4>
      <ex-14 /><hr />

      <h4>15. Default slot fallback (shown when nothing projected)</h4>
      <ex-15 /><hr />

      <h4>16. Card with optional header slot</h4>
      <ex-16 /><hr />

      <h4>17. Tab panel projecting tab label + content</h4>
      <ex-17 /><hr />

      <h4>18. Accordion item with projected title + body</h4>
      <ex-18 /><hr />

      <h4>19. Dialog with title + content + actions</h4>
      <ex-19 /><hr />

      <h4>20. Form field wrapper projecting label + input + error</h4>
      <ex-20 /><hr />

      <h4>21. Layout: sidebar + main content projection</h4>
      <ex-21 /><hr />

      <h4>22. Header with logo + nav + actions slots</h4>
      <ex-22 /><hr />

      <h4>23. Article with aside + main slots</h4>
      <ex-23 /><hr />

      <h4>24. Modal with projected trigger + content</h4>
      <ex-24 /><hr />

      <h4>25. Stepper with projected step components</h4>
      <ex-25 /><hr />

      <h4>26. Multi-slot container with conditional slot display</h4>
      <ex-26 /><hr />

      <h4>27. Three-level projection (grandparent→parent→child)</h4>
      <ex-27 /><hr />

      <h4>28. Card grid where each card uses projection</h4>
      <ex-28 /><hr />

      <h4>29. Tabs component with projected tab panels</h4>
      <ex-29 /><hr />

      <h4>30. Projected content inside @for loop</h4>
      <ex-30 /><hr />

      <h4>31. Accordion with multiple projected items</h4>
      <ex-31 /><hr />

      <h4>32. Page layout with nested slot-based sections</h4>
      <ex-32 /><hr />

      <h4>33. Table with projected header/row/footer</h4>
      <ex-33 /><hr />

      <h4>34. Form wizard with projected step content</h4>
      <ex-34 /><hr />

      <h4>35. Dashboard with projected widget slots</h4>
      <ex-35 /><hr />

      <h4>36. Drawer/sidebar with projected menu items</h4>
      <ex-36 /><hr />

      <h4>37. Notification with projected icon + message + actions</h4>
      <ex-37 /><hr />

      <h4>38. Breadcrumb wrapper with projected items</h4>
      <ex-38 /><hr />

      <h4>39. @ContentChild to access projected component ref</h4>
      <ex-39 /><hr />

      <h4>40. @ContentChildren to query all projected items</h4>
      <ex-40 /><hr />

      <h4>41. ng-template as projected slot (TemplateRef)</h4>
      <ex-41 /><hr />

      <h4>42. Dynamic slot selection via @Input() string</h4>
      <ex-42 /><hr />

      <h4>43. Projected content with @Output communication</h4>
      <ex-43 /><hr />

      <h4>44. ContentChild with signal update on projection</h4>
      <ex-44 /><hr />

      <h4>45. ngProjectAs with component type selector</h4>
      <ex-45 /><hr />

      <h4>46. Multi-content with conditional slot fallback</h4>
      <ex-46 /><hr />

      <h4>47. Slot with type-safe projected component</h4>
      <ex-47 /><hr />

      <h4>48. Content projection + ViewContainerRef combination</h4>
      <ex-48 /><hr />

      <h4>49. Lazy projected content (ng-template defer)</h4>
      <ex-49 /><hr />

      <h4>50. Full compound component with rich content projection</h4>
      <ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
