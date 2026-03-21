import { Component } from '@angular/core';

// ============================================================
// Exercise 2.3 — Template Variables & ViewChild
// ============================================================
// Topics:
//   • Template reference variables: #myRef
//   • Accessing DOM elements: #inputRef → inputRef.value
//   • Accessing child component instances via #ref on component tag
//   • @ViewChild / @ViewChildren
//   • ElementRef, ViewContainerRef (basics)
//   • Template outlet: <ng-template #tpl> + [ngTemplateOutlet]
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: DomRefComponent
// ---------------------------------------------------------------------------
// selector='app-dom-ref'
// Template: an input with #emailInput, a button that calls focus() on
//   the ref, and a div that shows emailInput.value live (without ngModel —
//   use (input) event to capture it into a local class property).
// Demonstrate: no class property needed to focus; template var gives direct DOM access.

// ---------------------------------------------------------------------------
// TODO 2: ViewChildComponent
// ---------------------------------------------------------------------------
// selector='app-viewchild-demo'
// Create a small child component: selector='app-counter-box'
//   Has a count = 0 property, increment() and reset() methods.
//   Template: shows the count.
// In ViewChildComponent:
//   @ViewChild(CounterBoxComponent) counterBox!: CounterBoxComponent
//   Two buttons in the parent template: "Increment" and "Reset"
//   that call the child's methods directly (after ngAfterViewInit).
//   (Import AfterViewInit from @angular/core)

// ---------------------------------------------------------------------------
// TODO 3: TemplateOutletComponent
// ---------------------------------------------------------------------------
// selector='app-template-outlet'
// Import NgTemplateOutlet from @angular/common
// Template:
//   Define two <ng-template>s: #loadingTpl and #dataTable.
//   A boolean isLoading = true.
//   Use [ngTemplateOutlet] to switch between them based on isLoading.
//   Button to toggle isLoading.

// ---------------------------------------------------------------------------
// TODO 4: MultipleViewChildrenComponent
// ---------------------------------------------------------------------------
// selector='app-viewchildren-demo'
// Create a small HighlightBoxComponent with selector='app-highlight-box'
//   @Input() label = ''  and a highlighted = false toggle.
// In MultipleViewChildrenComponent:
//   @ViewChildren(HighlightBoxComponent) boxes!: QueryList<HighlightBoxComponent>
//   A "Highlight All" button that loops through QueryList and sets highlighted = true on each.
//   A "Clear All" button that resets them.

// ---------------------------------------------------------------------------
// TODO 5: ElementRefComponent
// ---------------------------------------------------------------------------
// selector='app-element-ref'
// Inject: private el: ElementRef, private renderer: Renderer2
//   (from @angular/core)
// Method shakeIt(): uses renderer.setStyle / removeStyle to add a CSS
//   animation class or inline styles to el.nativeElement.
// Template: a card div and a "Shake" button.

// ---------------------------------------------------------------------------
// ROOT COMPONENT
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  template: `
    <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 2.3 — Template Variables &amp; ViewChild</h1>
      <!-- TODO 6: add all components to imports[] and render them -->
    </div>
  `,
})
export class AppComponent {}
