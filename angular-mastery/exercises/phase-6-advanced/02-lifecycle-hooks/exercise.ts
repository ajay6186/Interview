// Phase 6 - Exercise 02: Lifecycle Hooks
// Topics: ngOnInit, ngOnChanges(SimpleChanges), ngOnDestroy, ngAfterViewInit,
//         ngAfterContentInit, DestroyRef
//
// Docs: https://angular.dev/guide/components/lifecycle

import { Component } from '@angular/core';

// ─────────────────────────────────────────────
// TODO 1: LifecycleLogComponent — logs every lifecycle hook
//
// Create LifecycleLogComponent that implements ALL lifecycle interfaces:
//   OnInit, OnChanges, DoCheck, AfterContentInit, AfterContentChecked,
//   AfterViewInit, AfterViewChecked, OnDestroy
//
// - Keep a logs: string[] array
// - Each hook pushes a timestamped message: e.g. 'ngOnInit @ 12:34:56.789'
// - Display the log array in the template using @for
// - @Input() value: string — so ngOnChanges fires when parent changes it
// ─────────────────────────────────────────────

// TODO 1: LifecycleLogComponent
// @Component({ ... })
// export class LifecycleLogComponent implements OnInit, OnChanges, ... { }

// ─────────────────────────────────────────────
// TODO 2: OnChangesDemo — show previousValue/currentValue/firstChange
//
// Parent:
// - Has an input field that binds to a message signal
// - Passes message to child via @Input()
// - Button to toggle between two values
//
// Child (OnChangesChildComponent):
// - Implements OnChanges
// - ngOnChanges(changes: SimpleChanges):
//     const c = changes['message'];
//     this.history.push({
//       prev: c.previousValue,
//       curr: c.currentValue,
//       first: c.firstChange,
//     });
// - Display the history table
// ─────────────────────────────────────────────

// TODO 2: OnChangesDemoComponent + OnChangesChildComponent
// @Component({ ... })
// export class OnChangesDemoComponent { }
// @Component({ ... })
// export class OnChangesChildComponent implements OnChanges { }

// ─────────────────────────────────────────────
// TODO 3: DestroyRefDemo — inject DestroyRef for cleanup
//
// Create DestroyRefDemoComponent:
// - Inject DestroyRef with inject(DestroyRef)
// - Register cleanup: destroyRef.onDestroy(() => clearInterval(id))
// - Start a setInterval that updates a counter every 500ms
// - Show the counter value (signal)
// - Show a "Remove Component" button in the parent to test cleanup
//
// Why DestroyRef > ngOnDestroy:
// - Works in standalone providers (services, resolvers)
// - Can be used in constructor/injection context (not just in component class)
// ─────────────────────────────────────────────

// TODO 3: DestroyRefDemoComponent
// @Component({ ... })
// export class DestroyRefDemoComponent { }

// ─────────────────────────────────────────────
// TODO 4: AfterViewInitDemo — access ViewChild only after ngAfterViewInit
//
// Create AfterViewInitDemoComponent:
// - Template has a canvas element: <canvas #myCanvas></canvas>
// - @ViewChild('myCanvas') canvasEl!: ElementRef<HTMLCanvasElement>
// - ngAfterViewInit: draw a simple shape on the canvas context
// - Show what happens if you try to access canvasEl in ngOnInit:
//   canvasEl will be undefined → log a warning
// ─────────────────────────────────────────────

// TODO 4: AfterViewInitDemoComponent
// @Component({ ... })
// export class AfterViewInitDemoComponent { }

// ─────────────────────────────────────────────
// TODO 5: ContentChildDemo — @ContentChild available in ngAfterContentInit
//
// Create a wrapper component (CardComponent) and a content child (CardHeaderComponent):
//
// CardHeaderComponent: selector 'app-card-header', template: <h4>{{ title }}</h4>
//
// CardComponent:
// - Uses <ng-content> in its template
// - @ContentChild(CardHeaderComponent) header!: CardHeaderComponent
// - ngAfterContentInit: this.header is now available → read header.title
// - ngOnInit: this.header is undefined → show a warning
//
// Parent:
//   <app-card>
//     <app-card-header title="My Card" />
//   </app-card>
// ─────────────────────────────────────────────

// TODO 5: CardHeaderComponent + CardComponent (with @ContentChild)
// @Component({ ... })
// export class CardHeaderComponent { }
// @Component({ ... })
// export class CardComponent implements AfterContentInit { }

// ─────────────────────────────────────────────
// TODO 6: Add all components to imports[] and render them in AppComponent
// ─────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO 6: import components here
  ],
  template: `
    <h1>Lifecycle Hooks Exercise</h1>
    <!-- TODO 6: render components here -->
  `,
})
export class AppComponent {}
