// Phase 7 - Solution 05: Animations
// Topics: @angular/animations, trigger(), state(), transition(), animate(), group(), query(), stagger()
//
// Setup: provideAnimations() in bootstrapApplication providers
// Import: BrowserAnimationsModule or provideAnimations()

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  trigger, state, style, transition, animate,
  query, stagger, group, sequence, animateChild, keyframes
} from '@angular/animations';

// ─────────────────────────────────────────────────────────────────────────────
// 1. FadeComponent — fade in/out trigger
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-fade',
  standalone: true,
  animations: [
    trigger('fade', [
      // Explicit states
      state('visible', style({ opacity: 1, display: 'block' })),
      state('hidden',  style({ opacity: 0, display: 'none'  })),

      // Directional transitions
      transition('visible => hidden', animate('300ms ease-out')),
      transition('hidden => visible', animate('300ms ease-in')),

      // Shorthand for both directions:
      // transition('visible <=> hidden', animate('300ms ease'))
    ]),
  ],
  template: `
    <div style="padding:1.5rem; background:#e8f5e9; border-radius:8px; margin-bottom:1rem">
      <h3>Fade Animation (state-based)</h3>
      <button (click)="toggle()"
              style="padding:0.4rem 0.75rem; background:#2e7d32; color:white; border:none; border-radius:4px; cursor:pointer; margin-bottom:0.75rem">
        {{ fadeState === 'visible' ? 'Hide' : 'Show' }}
      </button>

      <div [@fade]="fadeState"
           style="padding:1rem; background:white; border-radius:4px; border-left:4px solid #2e7d32">
        <strong>Fading content</strong>
        <p style="margin:0.25rem 0 0">This content fades in and out smoothly using Angular animations.</p>
      </div>

      <pre style="margin-top:0.75rem; background:#1e1e1e; color:#d4d4d4; padding:0.75rem; border-radius:4px; font-size:0.8rem">{{ code }}</pre>
    </div>
  `,
})
export class FadeComponent {
  fadeState: 'visible' | 'hidden' = 'visible';
  toggle() { this.fadeState = this.fadeState === 'visible' ? 'hidden' : 'visible'; }

  code = `
animations: [
  trigger('fade', [
    state('visible', style({ opacity: 1 })),
    state('hidden',  style({ opacity: 0 })),
    transition('visible => hidden', animate('300ms ease-out')),
    transition('hidden => visible', animate('300ms ease-in')),
  ])
]
// Template: <div [@fade]="fadeState">...</div>`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SlideComponent — :enter / :leave transitions
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-slide',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        // Start state when element is added to DOM
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate('400ms cubic-bezier(0.25, 0.8, 0.25, 1)',
          style({ transform: 'translateX(0)', opacity: 1 })
        ),
      ]),
      transition(':leave', [
        // End state when element is removed from DOM
        animate('300ms ease-in',
          style({ transform: 'translateX(100%)', opacity: 0 })
        ),
      ]),
    ]),
    trigger('fadeInDown', [
      transition(':enter', [
        style({ transform: 'translateY(-20px)', opacity: 0 }),
        animate('350ms ease-out', style({ transform: 'none', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateY(20px)', opacity: 0 })),
      ]),
    ]),
  ],
  template: `
    <div style="padding:1.5rem; background:#fff3e0; border-radius:8px; margin-bottom:1rem">
      <h3>:enter / :leave Transitions</h3>
      <div style="display:flex; gap:0.5rem; margin-bottom:0.75rem">
        <button (click)="showSlide = !showSlide"
                style="padding:0.4rem 0.75rem; background:#e65100; color:white; border:none; border-radius:4px; cursor:pointer">
          Toggle Slide
        </button>
        <button (click)="showFade = !showFade"
                style="padding:0.4rem 0.75rem; background:#1565c0; color:white; border:none; border-radius:4px; cursor:pointer">
          Toggle Fade+Down
        </button>
      </div>

      <div style="min-height:80px; position:relative; overflow:hidden">
        @if (showSlide) {
          <div @slideIn style="padding:1rem; background:#fff3e0; border-left:4px solid #e65100; border-radius:4px">
            Slides in from left, leaves to right
          </div>
        }
      </div>

      <div style="min-height:80px">
        @if (showFade) {
          <div @fadeInDown style="padding:1rem; background:#e3f2fd; border-left:4px solid #1565c0; border-radius:4px">
            Fades in from above
          </div>
        }
      </div>

      <p style="font-size:0.85rem; color:#555; margin-top:0.5rem">
        <code>:enter</code> fires when element is <em>added</em> to DOM (@if becomes true).<br/>
        <code>:leave</code> fires when element is <em>removed</em> from DOM (@if becomes false).
      </p>
    </div>
  `,
})
export class SlideComponent {
  showSlide = true;
  showFade  = true;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ListAnimationComponent — stagger
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-list-animation',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('listAnim', [
      transition('* => *', [
        // Animate entering children with a stagger
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(-20px)' }),
          stagger('80ms', [
            animate('300ms ease-out', style({ opacity: 1, transform: 'none' })),
          ]),
        ], { optional: true }),

        // Animate leaving children
        query(':leave', [
          stagger('50ms', [
            animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(20px)' })),
          ]),
        ], { optional: true }),
      ]),
    ]),
  ],
  template: `
    <div style="padding:1.5rem; background:#f3e5f5; border-radius:8px; margin-bottom:1rem">
      <h3>Stagger Animation (list)</h3>

      <div style="display:flex; gap:0.5rem; margin-bottom:0.75rem">
        <button (click)="addItem()"
                style="padding:0.4rem 0.75rem; background:#7b1fa2; color:white; border:none; border-radius:4px; cursor:pointer">
          Add Item
        </button>
        <button (click)="removeItem()"
                style="padding:0.4rem 0.75rem; background:#c62828; color:white; border:none; border-radius:4px; cursor:pointer">
          Remove Last
        </button>
        <button (click)="shuffle()"
                style="padding:0.4rem 0.75rem; background:#1565c0; color:white; border:none; border-radius:4px; cursor:pointer">
          Shuffle (re-enter all)
        </button>
      </div>

      <!-- [@listAnim]="items.length" triggers transition on length change -->
      <ul [@listAnim]="items.length"
          style="list-style:none; padding:0; display:flex; flex-direction:column; gap:0.4rem">
        @for (item of items; track item.id) {
          <li style="padding:0.6rem 0.75rem; background:white; border-radius:4px; display:flex; justify-content:space-between; align-items:center">
            <span>{{ item.text }}</span>
            <span style="color:#888; font-size:0.8rem">#{{ item.id }}</span>
          </li>
        }
      </ul>

      <p style="font-size:0.85rem; color:#555; margin-top:0.5rem">
        <code>stagger('80ms', animate(...))</code> delays each item's animation by 80ms.
        <code>query(':enter', ...)</code> selects newly added DOM children.
      </p>
    </div>
  `,
})
export class ListAnimationComponent {
  private nextId = 4;
  items = [
    { id: 1, text: 'First item' },
    { id: 2, text: 'Second item' },
    { id: 3, text: 'Third item' },
  ];

  addItem() {
    this.items = [...this.items, { id: this.nextId++, text: `Item ${this.nextId - 1}` }];
  }

  removeItem() {
    this.items = this.items.slice(0, -1);
  }

  shuffle() {
    this.items = [...this.items].sort(() => Math.random() - 0.5);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. RouterAnimationComponent — page transitions
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_TRANSITION = trigger('pageTransition', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(10px)' }),
    animate('300ms ease-out', style({ opacity: 1, transform: 'none' })),
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' })),
  ]),
]);

@Component({
  selector: 'app-page-a',
  standalone: true,
  animations: [PAGE_TRANSITION],
  template: `<div @pageTransition style="padding:1rem; background:#e3f2fd; border-radius:4px"><h4>Page A</h4><p>Angular routing with animated transitions.</p></div>`,
})
export class PageAComponent {}

@Component({
  selector: 'app-page-b',
  standalone: true,
  animations: [PAGE_TRANSITION],
  template: `<div @pageTransition style="padding:1rem; background:#e8f5e9; border-radius:4px"><h4>Page B</h4><p>Switch pages to see the animation.</p></div>`,
})
export class PageBComponent {}

@Component({
  selector: 'app-router-anim',
  standalone: true,
  imports: [CommonModule, PageAComponent, PageBComponent],
  template: `
    <div style="padding:1.5rem; background:#e0f7fa; border-radius:8px; margin-bottom:1rem">
      <h3>Router Page Transitions</h3>

      <div style="display:flex; gap:0.5rem; margin-bottom:0.75rem">
        @for (tab of tabs; track tab) {
          <button (click)="current.set(tab)"
                  [style.background]="current() === tab ? '#00838f' : '#e0e0e0'"
                  [style.color]="current() === tab ? 'white' : '#333'"
                  style="padding:0.4rem 0.75rem; border:none; border-radius:4px; cursor:pointer">
            {{ tab }}
          </button>
        }
      </div>

      <!-- Content area with position:relative for transitions -->
      <div style="position:relative; min-height:80px; overflow:hidden">
        @if (current() === 'Page A') { <app-page-a /> }
        @if (current() === 'Page B') { <app-page-b /> }
      </div>

      <div style="margin-top:0.75rem; font-size:0.85rem; background:#e0f2f1; padding:0.75rem; border-radius:4px">
        <strong>Real router animation:</strong>
        <pre style="margin:0.4rem 0 0; font-size:0.8rem">{{ routerCode }}</pre>
      </div>
    </div>
  `,
})
export class RouterAnimComponent {
  tabs  = ['Page A', 'Page B'];
  current = signal('Page A');

  routerCode = `
// In AppComponent:
getRouteAnim(outlet: RouterOutlet) {
  return outlet.activatedRouteData?.['animation'] ?? '';
}

// Template:
<div [@routeAnimation]="getRouteAnim(outlet)"
     style="position:absolute; width:100%">
  <router-outlet #outlet="outlet" />
</div>

// Route config:
{ path: 'home',  component: HomeComponent,  data: { animation: 'HomePage'  } }
{ path: 'about', component: AboutComponent, data: { animation: 'AboutPage' } }`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. ComplexAnimationComponent — group() + sequence() + query()
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-complex-anim',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('accordion', [
      state('open',   style({ height: '*', opacity: 1, overflow: 'hidden' })),
      state('closed', style({ height: '0px', opacity: 0, overflow: 'hidden' })),
      transition('closed => open', [
        // group: run multiple animations in parallel
        group([
          animate('300ms ease-out', style({ height: '*'  })),
          animate('400ms ease-out', style({ opacity: 1   })),
        ]),
      ]),
      transition('open => closed', [
        group([
          animate('300ms ease-in', style({ opacity: 0    })),
          animate('350ms ease-in', style({ height: '0px' })),
        ]),
      ]),
    ]),
    trigger('bounce', [
      transition(':enter', [
        animate('500ms', keyframes([
          style({ transform: 'scale(0)',   offset: 0   }),
          style({ transform: 'scale(1.2)', offset: 0.6 }),
          style({ transform: 'scale(0.9)', offset: 0.8 }),
          style({ transform: 'scale(1)',   offset: 1   }),
        ])),
      ]),
    ]),
  ],
  template: `
    <div style="padding:1.5rem; background:#fce4ec; border-radius:8px; margin-bottom:1rem">
      <h3>group() + sequence() + keyframes()</h3>

      <!-- Accordion using group() -->
      <div style="border:1px solid #f48fb1; border-radius:4px; overflow:hidden; margin-bottom:1rem">
        <div (click)="accordionOpen = !accordionOpen"
             style="padding:0.75rem 1rem; background:#f48fb1; cursor:pointer; display:flex; justify-content:space-between; user-select:none">
          <strong>Accordion Panel</strong>
          <span>{{ accordionOpen ? '▲' : '▼' }}</span>
        </div>
        <div [@accordion]="accordionOpen ? 'open' : 'closed'">
          <div style="padding:1rem; background:white">
            This content expands and collapses using <code>group()</code> to animate
            height and opacity simultaneously.
          </div>
        </div>
      </div>

      <!-- Keyframes bounce -->
      <div style="margin-bottom:0.75rem">
        <button (click)="showBounce = !showBounce"
                style="padding:0.4rem 0.75rem; background:#ad1457; color:white; border:none; border-radius:4px; cursor:pointer; margin-bottom:0.5rem">
          Toggle Bounce
        </button>
        @if (showBounce) {
          <div @bounce style="display:inline-block; padding:0.75rem 1.5rem; background:#f48fb1; border-radius:8px; margin-left:0.5rem">
            Bouncy! (keyframes)
          </div>
        }
      </div>

      <!-- Reference -->
      <pre style="background:#1e1e1e; color:#d4d4d4; padding:0.75rem; border-radius:4px; font-size:0.8rem">{{ complexCode }}</pre>
    </div>
  `,
})
export class ComplexAnimComponent {
  accordionOpen = false;
  showBounce    = false;

  complexCode = `
// group(): parallel animations
transition('closed => open', [
  group([
    animate('300ms ease-out', style({ height: '*'  })),
    animate('400ms ease-out', style({ opacity: 1   })),
  ]),
])

// sequence(): sequential animations
transition(':enter', sequence([
  animate('200ms', style({ opacity: 1 })),     // first
  animate('300ms', style({ height: '*' })),    // then
]))

// keyframes(): multi-step animation
animate('500ms', keyframes([
  style({ transform: 'scale(0)',   offset: 0   }),
  style({ transform: 'scale(1.2)', offset: 0.6 }),
  style({ transform: 'scale(1)',   offset: 1   }),
]))

// query() + stagger(): child animations
query('.list-item', stagger('100ms', animate('300ms ease-out', style({ ... }))))`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FadeComponent,
    SlideComponent,
    ListAnimationComponent,
    RouterAnimComponent,
    ComplexAnimComponent,
  ],
  template: `
    <div style="font-family:sans-serif; max-width:900px; margin:2rem auto; padding:0 1rem">
      <h1>Phase 7 – Animations</h1>
      <p style="color:#555; font-size:0.9rem">
        Add <code>provideAnimations()</code> to your bootstrapApplication providers to enable animations.
      </p>
      <app-fade />
      <app-slide />
      <app-list-animation />
      <app-router-anim />
      <app-complex-anim />
    </div>
  `,
})
export class AppComponent {}
