// Phase 7 - Exercise 05: Animations
// Topics: @angular/animations, trigger(), state(), transition(), animate(), group(), query(), stagger()

import { Component } from '@angular/core';

// ─────────────────────────────────────────────
// TODO 1: FadeComponent — simple fade in/out trigger
//
// Import from '@angular/animations':
//   trigger, state, style, transition, animate
//
// Create FadeComponent:
// - Add animations: [ trigger('fade', [
//     state('visible', style({ opacity: 1 })),
//     state('hidden',  style({ opacity: 0 })),
//     transition('visible => hidden', animate('300ms ease-out')),
//     transition('hidden => visible', animate('300ms ease-in')),
//     // Shorthand: transition('visible <=> hidden', animate('300ms ease'))
//   ]) ]
// - Template: <div [@fade]="state">Content</div>
// - Button to toggle state between 'visible' and 'hidden'
// ─────────────────────────────────────────────

// TODO 1: FadeComponent
// @Component({ animations: [...], ... })
// export class FadeComponent { }

// ─────────────────────────────────────────────
// TODO 2: SlideComponent — slide in from left/right
//
// Create SlideComponent with animations:
// - trigger('slideIn', [
//     transition(':enter', [
//       style({ transform: 'translateX(-100%)', opacity: 0 }),
//       animate('400ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
//     ]),
//     transition(':leave', [
//       animate('400ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
//     ])
//   ])
// - :enter = element added to DOM, :leave = element removed
// - Show a toggled <div @slideIn *ngIf="show">
// ─────────────────────────────────────────────

// TODO 2: SlideComponent
// @Component({ animations: [...], ... })
// export class SlideComponent { }

// ─────────────────────────────────────────────
// TODO 3: ListAnimationComponent — stagger animation on @for list
//
// Import: query, stagger, animateChild
//
// Create ListAnimationComponent:
// - Has a list of items
// - trigger('listAnim', [
//     transition('* => *', [
//       query(':enter', [
//         style({ opacity: 0, transform: 'translateY(-20px)' }),
//         stagger('100ms', animate('300ms ease-out', style({ opacity: 1, transform: 'none' })))
//       ], { optional: true })
//     ])
//   ])
// - Apply to the container: <ul [@listAnim]="items.length">
// - Add button to add/remove items
// ─────────────────────────────────────────────

// TODO 3: ListAnimationComponent
// @Component({ animations: [...], ... })
// export class ListAnimationComponent { }

// ─────────────────────────────────────────────
// TODO 4: RouterAnimationComponent — page transition animations
//
// Create RouterAnimationComponent:
// - Add routeAnimation trigger to router-outlet wrapper
// - Use @HostBinding('@routeAnim') on a host element
// - Or use:
//   <div [@routeAnim]="getRouteAnim(outlet)" style="...">
//     <router-outlet #outlet="outlet" />
//   </div>
// - Animate: fade + slide up on enter, fade out on leave
// - Show a simple tabs demo (without real routing) to demonstrate the transition
// ─────────────────────────────────────────────

// TODO 4: RouterAnimationComponent
// @Component({ animations: [...], ... })
// export class RouterAnimationComponent { }

// ─────────────────────────────────────────────
// TODO 5: ComplexAnimationComponent — group() + query() for coordinated animations
//
// Create ComplexAnimationComponent:
// - group() runs multiple animations in parallel
// - sequence() runs animations one after another
//
// Example:
//   transition('* => open', [
//     group([
//       animate('300ms', style({ height: '*' })),   // height expands
//       animate('200ms', style({ opacity: 1 })),    // fades in simultaneously
//     ])
//   ])
//
// Also show query() + animateChild():
//   transition(':enter', [
//     query('.icon', animate('200ms', style({ transform: 'rotate(360deg)' }))),
//     query('.text', animate('300ms ease-out', style({ opacity: 1 }))),
//   ])
// ─────────────────────────────────────────────

// TODO 5: ComplexAnimationComponent
// @Component({ animations: [...], ... })
// export class ComplexAnimationComponent { }

// ─────────────────────────────────────────────
// TODO 6: Add all components to imports[] in AppComponent
// ─────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO 6: import components here
  ],
  template: `
    <h1>Animations Exercise</h1>
    <!-- TODO 6: render components here -->
  `,
})
export class AppComponent {}
