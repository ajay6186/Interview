import { Component, signal } from '@angular/core';
import {
  trigger, state, style, animate, transition,
  keyframes, group, sequence, stagger, query,
  animateChild, animation, useAnimation,
} from '@angular/animations';

// ============================================================
// Examples 7.5 — Angular Animations (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================
// Note: Use provideAnimations() in app.config.ts (standalone API).
// BrowserAnimationsModule is the NgModule equivalent.
// These examples use @Component animations: [...] decorator array.
// ─────────────────────────────────────────────────────────────

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. trigger concept — what triggers are and how they work
@Component({
  selector: 'ex-01',
  standalone: true,
  template: `
    <div style="background:#e8f4f8;padding:12px;border-radius:6px">
      <strong>trigger() concept</strong>
      <p>A trigger binds an animation to a named variable in the template.</p>
      <pre style="background:#f0f0f0;padding:8px;font-size:0.8rem;border-radius:4px">{{ code }}</pre>
      <div [@myTrigger]="active() ? 'on' : 'off'"
           style="padding:8px;background:#4a90d9;color:white;border-radius:4px;display:inline-block;margin-top:6px">
        Animated box
      </div>
      <br/><button (click)="active.update(v=>!v)" style="margin-top:6px">Toggle</button>
    </div>
  `,
  animations: [
    trigger('myTrigger', [
      state('on', style({ opacity: 1, transform: 'scale(1)' })),
      state('off', style({ opacity: 0.4, transform: 'scale(0.8)' })),
      transition('on <=> off', animate('300ms ease-in-out')),
    ]),
  ],
})
class Ex01 {
  active = signal(true);
  code = `[@myTrigger]="state"\nanimations: [trigger('myTrigger', [...])]`;
}

// 2. state() and style() — defining named states
@Component({
  selector: 'ex-02',
  standalone: true,
  template: `
    <div style="background:#f0f4e8;padding:12px;border-radius:6px">
      <strong>state() and style()</strong>
      <p>Named states with associated style maps:</p>
      <div [@colorState]="colorState()"
           style="width:60px;height:60px;border-radius:8px;display:inline-block;margin:6px 0;cursor:pointer"
           (click)="cycle()">
      </div>
      <p style="font-size:0.85rem">State: {{ colorState() }}</p>
      <button (click)="cycle()">Cycle State</button>
    </div>
  `,
  animations: [
    trigger('colorState', [
      state('red', style({ background: '#e74c3c' })),
      state('green', style({ background: '#2ecc71' })),
      state('blue', style({ background: '#3498db' })),
      transition('* => *', animate('400ms ease')),
    ]),
  ],
})
class Ex02 {
  states = ['red', 'green', 'blue'];
  idx = signal(0);
  colorState = signal('red');
  cycle() {
    const next = (this.idx() + 1) % this.states.length;
    this.idx.set(next);
    this.colorState.set(this.states[next]);
  }
}

// 3. animate() timing — duration, delay, easing
@Component({
  selector: 'ex-03',
  standalone: true,
  template: `
    <div style="background:#f8f0e8;padding:12px;border-radius:6px">
      <strong>animate() timing</strong>
      <p>Format: <code>'duration delay easing'</code></p>
      @for (box of boxes; track box.label) {
        <div [@slideRight]="active()" style="margin:3px 0">
          <div style="display:inline-block;padding:4px 10px;background:#9b59b6;color:white;border-radius:4px">
            {{ box.label }}
          </div>
        </div>
      }
      <br/><button (click)="active.update(v=>!v)" style="margin-top:6px">Toggle</button>
    </div>
  `,
  animations: [
    trigger('slideRight', [
      state('false', style({ transform: 'translateX(0)', opacity: 1 })),
      state('true', style({ transform: 'translateX(80px)', opacity: 0.5 })),
      transition('false => true', animate('300ms 0ms ease-out')),
      transition('true => false', animate('500ms 100ms ease-in-out')),
    ]),
  ],
})
class Ex03 {
  active = signal(false);
  boxes = [{ label: '300ms ease-out' }, { label: '500ms 100ms ease-in-out' }];
}

// 4. Open/Closed toggle
@Component({
  selector: 'ex-04',
  standalone: true,
  template: `
    <div style="background:#e8e8f8;padding:12px;border-radius:6px">
      <strong>Open / Closed Toggle</strong>
      <div [@openClose]="isOpen() ? 'open' : 'closed'"
           style="background:#3498db;color:white;padding:8px 14px;border-radius:6px;display:inline-block;cursor:pointer"
           (click)="isOpen.update(v=>!v)">
        {{ isOpen() ? 'OPEN' : 'CLOSED' }}
      </div>
      <p style="font-size:0.85rem">opacity: {{ isOpen() ? '1' : '0.5' }}, height: {{ isOpen() ? '48px' : '32px' }}</p>
    </div>
  `,
  animations: [
    trigger('openClose', [
      state('open', style({ opacity: 1, height: '48px', background: '#2ecc71' })),
      state('closed', style({ opacity: 0.5, height: '32px', background: '#e74c3c' })),
      transition('open <=> closed', animate('250ms ease-in-out')),
    ]),
  ],
})
class Ex04 {
  isOpen = signal(false);
}

// 5. Fade in/out
@Component({
  selector: 'ex-05',
  standalone: true,
  template: `
    <div style="background:#f8e8f0;padding:12px;border-radius:6px">
      <strong>Fade In / Out</strong>
      <div [@fadeInOut]="visible()"
           style="background:#e67e22;color:white;padding:12px;border-radius:6px;margin:8px 0">
        I fade in and out
      </div>
      <button (click)="visible.update(v=>!v)">Toggle Fade</button>
    </div>
  `,
  animations: [
    trigger('fadeInOut', [
      state('true', style({ opacity: 1 })),
      state('false', style({ opacity: 0 })),
      transition('true <=> false', animate('500ms ease-in-out')),
    ]),
  ],
})
class Ex05 {
  visible = signal(true);
}

// 6. Slide up/down
@Component({
  selector: 'ex-06',
  standalone: true,
  template: `
    <div style="background:#e8f8e8;padding:12px;border-radius:6px">
      <strong>Slide Up / Down</strong>
      <button (click)="shown.update(v=>!v)">{{ shown() ? 'Slide Up' : 'Slide Down' }}</button>
      <div [@slideUpDown]="shown()"
           style="background:#27ae60;color:white;padding:10px;border-radius:4px;margin-top:8px;overflow:hidden">
        Sliding content panel
      </div>
    </div>
  `,
  animations: [
    trigger('slideUpDown', [
      state('true', style({ height: '*', opacity: 1, transform: 'translateY(0)' })),
      state('false', style({ height: '0', opacity: 0, transform: 'translateY(-20px)' })),
      transition('true <=> false', animate('350ms ease-in-out')),
    ]),
  ],
})
class Ex06 {
  shown = signal(true);
}

// 7. Scale in/out
@Component({
  selector: 'ex-07',
  standalone: true,
  template: `
    <div style="background:#f8f8e8;padding:12px;border-radius:6px">
      <strong>Scale In / Out</strong>
      <div style="min-height:60px;display:flex;align-items:center;justify-content:center">
        <div [@scaleInOut]="visible()"
             style="background:#8e44ad;color:white;padding:12px 24px;border-radius:50px">
          Scaled
        </div>
      </div>
      <button (click)="visible.update(v=>!v)">Toggle Scale</button>
    </div>
  `,
  animations: [
    trigger('scaleInOut', [
      state('true', style({ transform: 'scale(1)', opacity: 1 })),
      state('false', style({ transform: 'scale(0.2)', opacity: 0 })),
      transition('true <=> false', animate('400ms cubic-bezier(0.175, 0.885, 0.32, 1.275)')),
    ]),
  ],
})
class Ex07 {
  visible = signal(true);
}

// 8. Rotate animation
@Component({
  selector: 'ex-08',
  standalone: true,
  template: `
    <div style="background:#f0e8f8;padding:12px;border-radius:6px">
      <strong>Rotate Animation</strong>
      <div style="display:flex;gap:12px;align-items:center;margin:8px 0">
        <div [@rotate]="rotated()"
             style="width:50px;height:50px;background:#e74c3c;border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem">
          ★
        </div>
        <button (click)="rotated.update(v=>!v)">Rotate</button>
      </div>
    </div>
  `,
  animations: [
    trigger('rotate', [
      state('false', style({ transform: 'rotate(0deg)' })),
      state('true', style({ transform: 'rotate(180deg)' })),
      transition('false <=> true', animate('500ms ease-in-out')),
    ]),
  ],
})
class Ex08 {
  rotated = signal(false);
}

// 9. Color transition
@Component({
  selector: 'ex-09',
  standalone: true,
  template: `
    <div style="background:#e8f4f8;padding:12px;border-radius:6px">
      <strong>Color Transition</strong>
      <div [@colorTransition]="active()"
           style="padding:14px;border-radius:8px;color:white;text-align:center;font-weight:bold;margin:8px 0;cursor:pointer"
           (click)="active.update(v=>!v)">
        Click me — {{ active() ? 'Active' : 'Inactive' }}
      </div>
    </div>
  `,
  animations: [
    trigger('colorTransition', [
      state('true', style({ background: '#2ecc71', boxShadow: '0 4px 12px rgba(46,204,113,0.5)' })),
      state('false', style({ background: '#95a5a6', boxShadow: 'none' })),
      transition('true <=> false', animate('400ms ease')),
    ]),
  ],
})
class Ex09 {
  active = signal(false);
}

// 10. Height animation
@Component({
  selector: 'ex-10',
  standalone: true,
  template: `
    <div style="background:#f0f4e8;padding:12px;border-radius:6px">
      <strong>Height Animation (collapsed/expanded)</strong>
      <div style="background:#3498db;overflow:hidden;border-radius:4px;margin:8px 0"
           [@expandHeight]="expanded()">
        <div style="padding:10px;color:white">
          <p style="margin:0">Expandable content here</p>
          <p style="margin:4px 0 0">More content visible when expanded</p>
        </div>
      </div>
      <button (click)="expanded.update(v=>!v)">{{ expanded() ? 'Collapse' : 'Expand' }}</button>
    </div>
  `,
  animations: [
    trigger('expandHeight', [
      state('true', style({ height: '*' })),
      state('false', style({ height: '0px' })),
      transition('true <=> false', animate('300ms ease-in-out')),
    ]),
  ],
})
class Ex10 {
  expanded = signal(false);
}

// 11. Opacity animation
@Component({
  selector: 'ex-11',
  standalone: true,
  template: `
    <div style="background:#f8f0e8;padding:12px;border-radius:6px">
      <strong>Opacity Animation</strong>
      <p>Opacity: {{ opacity() }}</p>
      <div [@opacityAnim]="level()"
           style="background:#e74c3c;color:white;padding:12px;border-radius:6px;margin:6px 0">
        Opacity level {{ level() }}
      </div>
      <input type="range" [value]="level()" (input)="level.set(+$any($event.target).value)" min="1" max="5" style="width:100%"/>
    </div>
  `,
  animations: [
    trigger('opacityAnim', [
      state('1', style({ opacity: 0.2 })),
      state('2', style({ opacity: 0.4 })),
      state('3', style({ opacity: 0.6 })),
      state('4', style({ opacity: 0.8 })),
      state('5', style({ opacity: 1.0 })),
      transition('* => *', animate('300ms ease')),
    ]),
  ],
})
class Ex11 {
  level = signal(5);
  opacity = computed(() => (this.level() * 0.2).toFixed(1));
}

// 12. Visibility animation
@Component({
  selector: 'ex-12',
  standalone: true,
  template: `
    <div style="background:#e8e8f8;padding:12px;border-radius:6px">
      <strong>Visibility Animation (shown/hidden)</strong>
      <p>Unlike display:none, visibility animation keeps layout space.</p>
      <div [@visibilityAnim]="visible()"
           style="background:#9b59b6;color:white;padding:12px;border-radius:6px;margin:6px 0">
        I animate visibility (layout preserved when hidden)
      </div>
      <button (click)="visible.update(v=>!v)">Toggle</button>
    </div>
  `,
  animations: [
    trigger('visibilityAnim', [
      state('true', style({ visibility: 'visible', opacity: 1 })),
      state('false', style({ visibility: 'hidden', opacity: 0 })),
      transition('true <=> false', animate('400ms ease')),
    ]),
  ],
})
class Ex12 {
  visible = signal(true);
}

// 13. :enter / :leave animation
@Component({
  selector: 'ex-13',
  standalone: true,
  template: `
    <div style="background:#fff8e8;padding:12px;border-radius:6px">
      <strong>:enter / :leave (void ↔ *)</strong>
      <button (click)="toggle()">{{ shown() ? 'Remove' : 'Add' }} Element</button>
      <div style="min-height:50px;margin-top:8px">
        @if (shown()) {
          <div @enterLeave
               style="background:#f39c12;color:white;padding:12px;border-radius:6px">
            I animate on enter and leave DOM
          </div>
        }
      </div>
    </div>
  `,
  animations: [
    trigger('enterLeave', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('250ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' })),
      ]),
    ]),
  ],
})
class Ex13 {
  shown = signal(false);
  toggle() { this.shown.update(v => !v); }
}

// ─── INTERMEDIATE (14–26) ───────────────────────────────────

// 14. :enter/:leave transitions — ngIf equivalent with @if
@Component({
  selector: 'ex-14',
  standalone: true,
  template: `
    <div style="background:#e8f4f8;padding:12px;border-radius:6px">
      <strong>:enter/:leave with @if</strong>
      <button (click)="show.update(v=>!v)">{{ show() ? 'Hide' : 'Show' }}</button>
      <div style="min-height:60px;margin-top:8px">
        @if (show()) {
          <div @fadeSlide
               style="background:#1abc9c;color:white;padding:12px;border-radius:6px">
            Fades and slides on enter/leave
          </div>
        }
      </div>
    </div>
  `,
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-30px)' }),
        animate('350ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('250ms ease-in', style({ opacity: 0, transform: 'translateX(30px)' })),
      ]),
    ]),
  ],
})
class Ex14 {
  show = signal(false);
}

// 15. void state — alias for :enter/:leave
@Component({
  selector: 'ex-15',
  standalone: true,
  template: `
    <div style="background:#f0f4e8;padding:12px;border-radius:6px">
      <strong>void state</strong>
      <p style="font-size:0.85rem"><code>void =&gt; *</code> is equivalent to <code>:enter</code></p>
      <p style="font-size:0.85rem"><code>* =&gt; void</code> is equivalent to <code>:leave</code></p>
      <button (click)="present.update(v=>!v)">Toggle</button>
      <div style="min-height:60px;margin-top:8px">
        @if (present()) {
          <div @voidAnim
               style="background:#2980b9;color:white;padding:12px;border-radius:6px">
            void ↔ * animation
          </div>
        }
      </div>
    </div>
  `,
  animations: [
    trigger('voidAnim', [
      transition('void => *', [
        style({ transform: 'scale(0)', opacity: 0 }),
        animate('400ms ease-out', style({ transform: 'scale(1)', opacity: 1 })),
      ]),
      transition('* => void', [
        animate('300ms ease-in', style({ transform: 'scale(0)', opacity: 0 })),
      ]),
    ]),
  ],
})
class Ex15 {
  present = signal(false);
}

// 16. Wildcard transitions
@Component({
  selector: 'ex-16',
  standalone: true,
  template: `
    <div style="background:#f8f0e8;padding:12px;border-radius:6px">
      <strong>Wildcard Transitions (* =&gt; *)</strong>
      <p>Catches any state change:</p>
      <div [@wildcard]="step()"
           style="padding:10px 16px;border-radius:6px;color:white;display:inline-block;cursor:pointer"
           (click)="next()">
        Step {{ step() }}
      </div>
      <p style="font-size:0.85rem">Click to advance</p>
    </div>
  `,
  animations: [
    trigger('wildcard', [
      state('1', style({ background: '#e74c3c' })),
      state('2', style({ background: '#f39c12' })),
      state('3', style({ background: '#2ecc71' })),
      state('4', style({ background: '#3498db' })),
      transition('* => *', animate('400ms ease-in-out')),
    ]),
  ],
})
class Ex16 {
  step = signal(1);
  next() { this.step.update(s => (s % 4) + 1); }
}

// 17. keyframes() — multi-step animation
@Component({
  selector: 'ex-17',
  standalone: true,
  template: `
    <div style="background:#e8e8f8;padding:12px;border-radius:6px">
      <strong>keyframes() — multi-step animation</strong>
      <div [@bounceIn]="trigger()"
           style="background:#8e44ad;color:white;padding:12px;border-radius:6px;margin:8px 0;display:inline-block">
        Bounce me!
      </div>
      <br/><button (click)="fire()">Play keyframes</button>
    </div>
  `,
  animations: [
    trigger('bounceIn', [
      transition('* => active', [
        animate('600ms', keyframes([
          style({ transform: 'scale(0.3)', opacity: 0, offset: 0 }),
          style({ transform: 'scale(1.1)', opacity: 0.8, offset: 0.6 }),
          style({ transform: 'scale(0.9)', opacity: 0.9, offset: 0.8 }),
          style({ transform: 'scale(1)', opacity: 1, offset: 1 }),
        ])),
      ]),
      transition('active => idle', animate('1ms')),
    ]),
  ],
})
class Ex17 {
  trigger = signal('idle');
  fire() {
    this.trigger.set('active');
    setTimeout(() => this.trigger.set('idle'), 700);
  }
}

// 18. Multi-step keyframes
@Component({
  selector: 'ex-18',
  standalone: true,
  template: `
    <div style="background:#f8e8f0;padding:12px;border-radius:6px">
      <strong>Multi-step Keyframes — color wave</strong>
      <div [@colorWave]="playing()"
           style="padding:14px;border-radius:8px;color:white;text-align:center;font-weight:bold;margin:8px 0">
        Color Wave
      </div>
      <button (click)="play()">Play</button>
    </div>
  `,
  animations: [
    trigger('colorWave', [
      transition('idle => playing', [
        animate('1200ms', keyframes([
          style({ background: '#3498db', offset: 0 }),
          style({ background: '#9b59b6', offset: 0.25 }),
          style({ background: '#e74c3c', offset: 0.5 }),
          style({ background: '#f39c12', offset: 0.75 }),
          style({ background: '#2ecc71', offset: 1 }),
        ])),
      ]),
      transition('playing => idle', animate('1ms', style({ background: '#3498db' }))),
    ]),
  ],
})
class Ex18 {
  playing = signal('idle');
  play() {
    this.playing.set('playing');
    setTimeout(() => this.playing.set('idle'), 1300);
  }
}

// 19. group() — parallel animations
@Component({
  selector: 'ex-19',
  standalone: true,
  template: `
    <div style="background:#e8f8e8;padding:12px;border-radius:6px">
      <strong>group() — parallel animations</strong>
      <p style="font-size:0.85rem">Move + fade + scale all at once:</p>
      <div style="min-height:60px;margin:8px 0">
        @if (show()) {
          <div @groupAnim
               style="background:#27ae60;color:white;padding:12px;border-radius:6px;display:inline-block">
            Parallel: move + fade + scale
          </div>
        }
      </div>
      <button (click)="show.update(v=>!v)">Toggle</button>
    </div>
  `,
  animations: [
    trigger('groupAnim', [
      transition(':enter', [
        group([
          animate('400ms ease-out', style({ opacity: 1 })),
          animate('500ms ease-out', style({ transform: 'translateX(0)' })),
          animate('600ms ease-out', style({ transform: 'scale(1)' })),
        ]),
      ]),
      transition(':leave', [
        style({ opacity: 1, transform: 'translateX(0) scale(1)' }),
        group([
          animate('300ms ease-in', style({ opacity: 0 })),
          animate('400ms ease-in', style({ transform: 'translateX(40px) scale(0.8)' })),
        ]),
      ]),
    ]),
  ],
})
class Ex19 {
  show = signal(false);
}

// 20. sequence() — serial animations
@Component({
  selector: 'ex-20',
  standalone: true,
  template: `
    <div style="background:#f8f8e8;padding:12px;border-radius:6px">
      <strong>sequence() — serial (one after another)</strong>
      <div style="min-height:60px;margin:8px 0">
        @if (show()) {
          <div @sequenceAnim
               style="background:#d35400;color:white;padding:12px;border-radius:6px;display:inline-block">
            First fade, then slide
          </div>
        }
      </div>
      <button (click)="show.update(v=>!v)">Toggle</button>
    </div>
  `,
  animations: [
    trigger('sequenceAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        sequence([
          animate('300ms', style({ opacity: 1 })),
          animate('300ms ease-out', style({ transform: 'translateY(0)' })),
        ]),
      ]),
      transition(':leave', [
        sequence([
          animate('200ms', style({ transform: 'translateY(20px)' })),
          animate('200ms', style({ opacity: 0 })),
        ]),
      ]),
    ]),
  ],
})
class Ex20 {
  show = signal(false);
}

// 21. Animation timing functions
@Component({
  selector: 'ex-21',
  standalone: true,
  template: `
    <div style="background:#f0e8f8;padding:12px;border-radius:6px">
      <strong>Animation Timing Functions</strong>
      <button (click)="go.update(v=>!v)" style="margin-bottom:8px;display:block">Animate all</button>
      @for (item of timings; track item.label) {
        <div style="display:flex;align-items:center;gap:8px;margin:3px 0">
          <span style="width:180px;font-size:0.8rem">{{ item.label }}</span>
          <div [@move]="{ value: go(), params: { timing: item.timing } }"
               style="width:24px;height:24px;background:#8e44ad;border-radius:4px">
          </div>
        </div>
      }
    </div>
  `,
  animations: [
    trigger('move', [
      state('false', style({ transform: 'translateX(0)' })),
      state('true', style({ transform: 'translateX(150px)' })),
      transition('false <=> true', animate('600ms {{ timing }}'), { params: { timing: 'ease' } }),
    ]),
  ],
})
class Ex21 {
  go = signal(false);
  timings = [
    { label: 'ease', timing: 'ease' },
    { label: 'ease-in', timing: 'ease-in' },
    { label: 'ease-out', timing: 'ease-out' },
    { label: 'ease-in-out', timing: 'ease-in-out' },
    { label: 'linear', timing: 'linear' },
  ];
}

// 22. Bounce effect
@Component({
  selector: 'ex-22',
  standalone: true,
  template: `
    <div style="background:#e8f4f8;padding:12px;border-radius:6px">
      <strong>Bounce Effect</strong>
      <div [@bounce]="state()"
           style="background:#e74c3c;color:white;width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.5rem;cursor:pointer;margin:8px 0"
           (click)="fire()">
        🏀
      </div>
      <button (click)="fire()">Bounce</button>
    </div>
  `,
  animations: [
    trigger('bounce', [
      transition('idle => bounce', [
        animate('700ms', keyframes([
          style({ transform: 'translateY(0)', offset: 0 }),
          style({ transform: 'translateY(-40px)', offset: 0.3 }),
          style({ transform: 'translateY(0)', offset: 0.5 }),
          style({ transform: 'translateY(-20px)', offset: 0.7 }),
          style({ transform: 'translateY(0)', offset: 0.85 }),
          style({ transform: 'translateY(-8px)', offset: 0.93 }),
          style({ transform: 'translateY(0)', offset: 1 }),
        ])),
      ]),
      transition('bounce => idle', animate('1ms')),
    ]),
  ],
})
class Ex22 {
  state = signal('idle');
  fire() {
    this.state.set('bounce');
    setTimeout(() => this.state.set('idle'), 750);
  }
}

// 23. Shake effect
@Component({
  selector: 'ex-23',
  standalone: true,
  template: `
    <div style="background:#f0f4e8;padding:12px;border-radius:6px">
      <strong>Shake Effect</strong>
      <div style="margin:8px 0">
        <input [class.invalid]="shaking()" [@shake]="shaking()"
               placeholder="Enter something..."
               style="padding:8px;border-radius:4px;border:2px solid #ccc;width:200px"
               [style.border-color]="shaking() ? '#e74c3c' : '#ccc'"/>
      </div>
      <button (click)="triggerShake()">Shake (invalid)</button>
    </div>
  `,
  animations: [
    trigger('shake', [
      transition('false => true', [
        animate('400ms', keyframes([
          style({ transform: 'translateX(0)', offset: 0 }),
          style({ transform: 'translateX(-10px)', offset: 0.15 }),
          style({ transform: 'translateX(10px)', offset: 0.3 }),
          style({ transform: 'translateX(-10px)', offset: 0.45 }),
          style({ transform: 'translateX(10px)', offset: 0.6 }),
          style({ transform: 'translateX(-5px)', offset: 0.75 }),
          style({ transform: 'translateX(5px)', offset: 0.9 }),
          style({ transform: 'translateX(0)', offset: 1 }),
        ])),
      ]),
    ]),
  ],
})
class Ex23 {
  shaking = signal(false);
  triggerShake() {
    this.shaking.set(true);
    setTimeout(() => this.shaking.set(false), 500);
  }
}

// 24. Pulse effect
@Component({
  selector: 'ex-24',
  standalone: true,
  template: `
    <div style="background:#f8f0e8;padding:12px;border-radius:6px">
      <strong>Pulse Effect</strong>
      <div [@pulse]="pulsing()"
           style="background:#e74c3c;color:white;display:inline-flex;align-items:center;justify-content:center;width:50px;height:50px;border-radius:50%;font-size:1.4rem;margin:8px 0;cursor:pointer"
           (click)="toggle()">
        ♥
      </div>
      <p>{{ pulsing() ? 'Pulsing...' : 'Click to pulse' }}</p>
    </div>
  `,
  animations: [
    trigger('pulse', [
      state('false', style({ transform: 'scale(1)' })),
      state('true', style({ transform: 'scale(1)' })),
      transition('false => true', [
        animate('600ms', keyframes([
          style({ transform: 'scale(1)', offset: 0 }),
          style({ transform: 'scale(1.3)', offset: 0.25 }),
          style({ transform: 'scale(0.9)', offset: 0.5 }),
          style({ transform: 'scale(1.1)', offset: 0.75 }),
          style({ transform: 'scale(1)', offset: 1 }),
        ])),
      ]),
    ]),
  ],
})
class Ex24 {
  pulsing = signal(false);
  toggle() {
    this.pulsing.set(true);
    setTimeout(() => this.pulsing.set(false), 700);
  }
}

// 25. Flip card animation
@Component({
  selector: 'ex-25',
  standalone: true,
  template: `
    <div style="background:#e8e8f8;padding:12px;border-radius:6px">
      <strong>Flip Card</strong>
      <div style="perspective:600px;margin:8px 0;cursor:pointer" (click)="flipped.update(v=>!v)">
        <div [@flipCard]="flipped()"
             style="background:{{ flipped() ? '#2ecc71' : '#3498db' }};color:white;padding:20px;border-radius:8px;text-align:center">
          @if (!flipped()) { Front — Click to flip! }
          @if (flipped()) { Back — Click to flip back! }
        </div>
      </div>
    </div>
  `,
  animations: [
    trigger('flipCard', [
      state('false', style({ transform: 'rotateY(0deg)' })),
      state('true', style({ transform: 'rotateY(180deg)' })),
      transition('false <=> true', animate('500ms ease-in-out')),
    ]),
  ],
})
class Ex25 {
  flipped = signal(false);
}

// 26. Accordion
@Component({
  selector: 'ex-26',
  standalone: true,
  template: `
    <div style="background:#f8e8f0;padding:12px;border-radius:6px">
      <strong>Accordion Animation</strong>
      @for (item of items; track item.title) {
        <div style="border:1px solid #ddd;border-radius:4px;margin:4px 0;overflow:hidden">
          <div style="padding:8px 12px;cursor:pointer;background:#f8f8f8;display:flex;justify-content:space-between"
               (click)="toggle(item)">
            {{ item.title }}
            <span>{{ item.open ? '▲' : '▼' }}</span>
          </div>
          <div [@accordionBody]="item.open" style="overflow:hidden">
            <div style="padding:10px 12px">{{ item.body }}</div>
          </div>
        </div>
      }
    </div>
  `,
  animations: [
    trigger('accordionBody', [
      state('true', style({ height: '*', opacity: 1 })),
      state('false', style({ height: '0', opacity: 0 })),
      transition('true <=> false', animate('250ms ease-in-out')),
    ]),
  ],
})
class Ex26 {
  items = [
    { title: 'Section 1', body: 'Angular Animations use the Web Animations API.', open: false },
    { title: 'Section 2', body: 'trigger(), state(), animate() are the main building blocks.', open: false },
    { title: 'Section 3', body: 'Standalone components use animations: [] in @Component.', open: false },
  ];
  toggle(item: { open: boolean }) { item.open = !item.open; }
}

// ─── NESTED (27–38) ─────────────────────────────────────────

// 27. stagger() — list enter animation
@Component({
  selector: 'ex-27',
  standalone: true,
  template: `
    <div style="background:#e8f4f8;padding:12px;border-radius:6px">
      <strong>stagger() — list stagger enter</strong>
      <button (click)="reload()" style="margin-bottom:8px">Reload list</button>
      @if (shown()) {
        <ul [@listStagger]="items.length" style="list-style:none;margin:0;padding:0">
          @for (item of items; track item) {
            <li @listItem
                style="background:#3498db;color:white;padding:6px 10px;margin:3px 0;border-radius:4px">
              {{ item }}
            </li>
          }
        </ul>
      }
    </div>
  `,
  animations: [
    trigger('listStagger', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-30px)' }),
          stagger(80, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
          ]),
        ], { optional: true }),
      ]),
    ]),
    trigger('listItem', []),
  ],
})
class Ex27 {
  shown = signal(true);
  items = ['Item Alpha', 'Item Beta', 'Item Gamma', 'Item Delta', 'Item Epsilon'];
  reload() {
    this.shown.set(false);
    setTimeout(() => this.shown.set(true), 50);
  }
}

// 28. query() + stagger()
@Component({
  selector: 'ex-28',
  standalone: true,
  template: `
    <div style="background:#f0f4e8;padding:12px;border-radius:6px">
      <strong>query() + stagger()</strong>
      <button (click)="animate()" style="margin-bottom:8px;display:block">Animate grid</button>
      <div [@gridAnim]="trigger()" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">
        @for (i of cells; track i) {
          <div class="cell"
               style="background:#9b59b6;color:white;height:40px;border-radius:4px;display:flex;align-items:center;justify-content:center">
            {{ i }}
          </div>
        }
      </div>
    </div>
  `,
  animations: [
    trigger('gridAnim', [
      transition('* => animate', [
        query('.cell', [
          style({ opacity: 0, transform: 'scale(0.5)' }),
          stagger(50, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
          ]),
        ]),
      ]),
    ]),
  ],
})
class Ex28 {
  cells = [1, 2, 3, 4, 5, 6, 7, 8];
  trigger = signal('idle');
  animate() {
    this.trigger.set('animate');
    setTimeout(() => this.trigger.set('idle'), 600);
  }
}

// 29. animateChild() — child animations
@Component({
  selector: 'ex-29',
  standalone: true,
  template: `
    <div style="background:#f8f0e8;padding:12px;border-radius:6px">
      <strong>animateChild() — coordinate parent-child</strong>
      <div [@parent]="open()" style="overflow:hidden">
        <div style="padding:10px;background:#e8f4f8;border-radius:4px">
          <p [@child]="open()" style="margin:0;padding:6px;background:#3498db;color:white;border-radius:4px">
            Child animates separately
          </p>
        </div>
      </div>
      <button (click)="open.update(v=>!v)" style="margin-top:8px">Toggle</button>
    </div>
  `,
  animations: [
    trigger('parent', [
      state('true', style({ height: '*', opacity: 1 })),
      state('false', style({ height: '0', opacity: 0 })),
      transition('true <=> false', [
        animate('300ms ease'),
        query('@child', animateChild(), { optional: true }),
      ]),
    ]),
    trigger('child', [
      state('true', style({ transform: 'translateX(0)' })),
      state('false', style({ transform: 'translateX(-20px)' })),
      transition('true <=> false', animate('300ms 100ms ease')),
    ]),
  ],
})
class Ex29 {
  open = signal(true);
}

// 30. Parent-child coordination
@Component({
  selector: 'ex-30',
  standalone: true,
  template: `
    <div style="background:#e8e8f8;padding:12px;border-radius:6px">
      <strong>Parent-child Coordination</strong>
      <div [@container]="expanded()" style="overflow:hidden">
        <div style="padding:8px">
          @for (i of [1,2,3]; track i) {
            <div [@item]="expanded()"
                 style="background:#8e44ad;color:white;padding:6px;margin:3px 0;border-radius:4px">
              Child {{ i }}
            </div>
          }
        </div>
      </div>
      <button (click)="expanded.update(v=>!v)" style="margin-top:6px">
        {{ expanded() ? 'Collapse' : 'Expand' }}
      </button>
    </div>
  `,
  animations: [
    trigger('container', [
      state('true', style({ height: '*' })),
      state('false', style({ height: '0' })),
      transition('true <=> false', animate('300ms ease-in-out')),
    ]),
    trigger('item', [
      state('true', style({ opacity: 1, transform: 'translateX(0)' })),
      state('false', style({ opacity: 0, transform: 'translateX(-20px)' })),
      transition('true <=> false', animate('200ms ease')),
    ]),
  ],
})
class Ex30 {
  expanded = signal(true);
}

// 31. Route transition animation simulation
@Component({
  selector: 'ex-31',
  standalone: true,
  template: `
    <div style="background:#f8e8f0;padding:12px;border-radius:6px">
      <strong>Route Transition Animation</strong>
      <div style="display:flex;gap:8px;margin-bottom:8px">
        @for (page of pages; track page) {
          <button (click)="navigate(page)" [style.fontWeight]="current()===page?'bold':'normal'">{{ page }}</button>
        }
      </div>
      <div style="min-height:80px;overflow:hidden">
        <div [@routeAnim]="current()"
             style="background:#2c3e50;color:white;padding:16px;border-radius:6px">
          <strong>{{ current() }}</strong>
          <p style="margin:4px 0 0;font-size:0.85rem">Page content loaded with animation</p>
        </div>
      </div>
    </div>
  `,
  animations: [
    trigger('routeAnim', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateX(30px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
    ]),
  ],
})
class Ex31 {
  pages = ['Home', 'Products', 'About', 'Contact'];
  current = signal('Home');
  navigate(page: string) { this.current.set(page); }
}

// 32. Tab switching animation
@Component({
  selector: 'ex-32',
  standalone: true,
  template: `
    <div style="background:#fff8e8;padding:12px;border-radius:6px">
      <strong>Tab Switching Animation</strong>
      <div style="display:flex;border-bottom:2px solid #ddd;margin-bottom:8px">
        @for (tab of tabs; track tab) {
          <div (click)="active.set(tab)"
               style="padding:6px 14px;cursor:pointer"
               [style.border-bottom]="active()===tab ? '2px solid #3498db' : 'none'"
               [style.font-weight]="active()===tab ? 'bold' : 'normal'">
            {{ tab }}
          </div>
        }
      </div>
      <div style="min-height:60px;overflow:hidden">
        <div [@tabAnim]="active()"
             style="background:#ecf0f1;padding:12px;border-radius:4px">
          Content for: <strong>{{ active() }}</strong>
        </div>
      </div>
    </div>
  `,
  animations: [
    trigger('tabAnim', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
class Ex32 {
  tabs = ['Overview', 'Details', 'Reviews'];
  active = signal('Overview');
}

// 33. Modal enter/leave
@Component({
  selector: 'ex-33',
  standalone: true,
  template: `
    <div style="background:#e8f8e8;padding:12px;border-radius:6px">
      <strong>Modal Enter / Leave</strong>
      <button (click)="open.set(true)">Open Modal</button>
      @if (open()) {
        <div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:100"
             @modalBackdrop (click)="open.set(false)">
          <div @modalPanel
               style="background:white;padding:24px;border-radius:12px;max-width:320px;width:90%"
               (click)="$event.stopPropagation()">
            <h3 style="margin:0 0 12px">Modal</h3>
            <p>Click outside or button to close.</p>
            <button (click)="open.set(false)">Close</button>
          </div>
        </div>
      }
    </div>
  `,
  animations: [
    trigger('modalBackdrop', [
      transition(':enter', [style({ opacity: 0 }), animate('200ms', style({ opacity: 1 }))]),
      transition(':leave', [animate('150ms', style({ opacity: 0 }))]),
    ]),
    trigger('modalPanel', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8) translateY(-20px)' }),
        animate('250ms ease-out', style({ opacity: 1, transform: 'scale(1) translateY(0)' })),
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.9) translateY(-10px)' })),
      ]),
    ]),
  ],
})
class Ex33 {
  open = signal(false);
}

// 34. Dropdown animation
@Component({
  selector: 'ex-34',
  standalone: true,
  template: `
    <div style="background:#f8e8e8;padding:12px;border-radius:6px">
      <strong>Dropdown Animation</strong>
      <div style="position:relative;display:inline-block">
        <button (click)="open.update(v=>!v)" style="padding:6px 14px;border-radius:4px">
          Menu {{ open() ? '▲' : '▼' }}
        </button>
        <div [@dropdownAnim]="open()"
             style="position:absolute;top:36px;left:0;background:white;border:1px solid #ddd;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.1);min-width:140px;overflow:hidden;z-index:10">
          @for (item of items; track item) {
            <div style="padding:8px 14px;cursor:pointer;border-bottom:1px solid #f0f0f0"
                 (click)="select(item)">{{ item }}</div>
          }
        </div>
      </div>
      @if (selected()) { <p style="margin-top:8px">Selected: <strong>{{ selected() }}</strong></p> }
    </div>
  `,
  animations: [
    trigger('dropdownAnim', [
      state('true', style({ height: '*', opacity: 1 })),
      state('false', style({ height: '0', opacity: 0 })),
      transition('true <=> false', animate('200ms ease-in-out')),
    ]),
  ],
})
class Ex34 {
  open = signal(false);
  selected = signal('');
  items = ['Dashboard', 'Profile', 'Settings', 'Logout'];
  select(item: string) { this.selected.set(item); this.open.set(false); }
}

// 35. Sidebar slide animation
@Component({
  selector: 'ex-35',
  standalone: true,
  template: `
    <div style="background:#e8f4f8;padding:12px;border-radius:6px;position:relative;overflow:hidden;min-height:100px">
      <strong>Sidebar Slide</strong>
      <button (click)="sidebarOpen.update(v=>!v)" style="position:relative;z-index:2">
        {{ sidebarOpen() ? '← Close' : '→ Open' }} Sidebar
      </button>
      <div [@sidebar]="sidebarOpen()"
           style="position:absolute;top:0;left:0;bottom:0;width:160px;background:#2c3e50;color:white;padding:12px;z-index:1">
        <p style="margin:0 0 8px;font-weight:bold">Sidebar</p>
        <p style="font-size:0.85rem;margin:2px 0">Nav item 1</p>
        <p style="font-size:0.85rem;margin:2px 0">Nav item 2</p>
        <p style="font-size:0.85rem;margin:2px 0">Nav item 3</p>
      </div>
    </div>
  `,
  animations: [
    trigger('sidebar', [
      state('true', style({ transform: 'translateX(0)' })),
      state('false', style({ transform: 'translateX(-100%)' })),
      transition('true <=> false', animate('300ms ease-in-out')),
    ]),
  ],
})
class Ex35 {
  sidebarOpen = signal(false);
}

// 36. Card hover animations
@Component({
  selector: 'ex-36',
  standalone: true,
  template: `
    <div style="background:#f0f4e8;padding:12px;border-radius:6px">
      <strong>Card Hover Animations</strong>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px">
        @for (card of cards; track card.title) {
          <div [@cardHover]="card.hovered ? 'hovered' : 'normal'"
               (mouseenter)="card.hovered = true"
               (mouseleave)="card.hovered = false"
               style="background:white;border:1px solid #ddd;border-radius:8px;padding:10px;cursor:pointer;text-align:center">
            <div style="font-size:1.5rem">{{ card.icon }}</div>
            <p style="margin:4px 0;font-size:0.85rem">{{ card.title }}</p>
          </div>
        }
      </div>
    </div>
  `,
  animations: [
    trigger('cardHover', [
      state('normal', style({ transform: 'translateY(0)', boxShadow: 'none' })),
      state('hovered', style({ transform: 'translateY(-4px)', boxShadow: '0 8px 20px rgba(0,0,0,0.12)' })),
      transition('normal <=> hovered', animate('200ms ease')),
    ]),
  ],
})
class Ex36 {
  cards = [
    { title: 'Analytics', icon: '📊', hovered: false },
    { title: 'Users', icon: '👤', hovered: false },
    { title: 'Settings', icon: '⚙️', hovered: false },
  ];
}

// 37. List item reorder animation
@Component({
  selector: 'ex-37',
  standalone: true,
  template: `
    <div style="background:#f8f0e8;padding:12px;border-radius:6px">
      <strong>List Item Add / Remove with Animation</strong>
      <button (click)="addItem()" style="margin-bottom:8px">Add Item</button>
      <ul style="list-style:none;margin:0;padding:0">
        @for (item of items(); track item.id) {
          <li @listItemAnim
              style="background:#e67e22;color:white;padding:6px 10px;margin:3px 0;border-radius:4px;display:flex;justify-content:space-between;align-items:center">
            {{ item.text }}
            <button (click)="remove(item.id)" style="background:rgba(255,255,255,0.2);border:none;color:white;cursor:pointer;border-radius:3px;padding:1px 6px">✕</button>
          </li>
        }
      </ul>
    </div>
  `,
  animations: [
    trigger('listItemAnim', [
      transition(':enter', [
        style({ opacity: 0, height: '0', transform: 'translateX(-20px)' }),
        animate('250ms ease-out', style({ opacity: 1, height: '*', transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, height: '0', transform: 'translateX(20px)' })),
      ]),
    ]),
  ],
})
class Ex37 {
  items = signal([{ id: 1, text: 'Item 1' }, { id: 2, text: 'Item 2' }]);
  counter = 3;
  addItem() { this.items.update(i => [...i, { id: this.counter, text: `Item ${this.counter++}` }]); }
  remove(id: number) { this.items.update(i => i.filter(item => item.id !== id)); }
}

// 38. Data loading animation
@Component({
  selector: 'ex-38',
  standalone: true,
  template: `
    <div style="background:#e8e8f8;padding:12px;border-radius:6px">
      <strong>Data Loading Animation</strong>
      <button (click)="load()" [disabled]="loading()">Load Data</button>
      <div style="margin-top:8px;min-height:60px">
        @if (loading()) {
          <div @fadeIn style="display:flex;gap:6px;padding:12px">
            @for (i of [1,2,3]; track i) {
              <div style="flex:1;height:40px;background:#ddd;border-radius:4px;animation:pulse 1.2s infinite"
                   [style.animation-delay]="(i*0.2) + 's'">
              </div>
            }
          </div>
        }
        @if (data() && !loading()) {
          <div @fadeIn style="background:#27ae60;color:white;padding:12px;border-radius:6px">
            Data loaded: {{ data() }}
          </div>
        }
      </div>
    </div>
  `,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 })),
      ]),
    ]),
  ],
})
class Ex38 {
  loading = signal(false);
  data = signal<string | null>(null);
  load() {
    this.data.set(null); this.loading.set(true);
    setTimeout(() => { this.loading.set(false); this.data.set('{ "items": 42 }'); }, 1200);
  }
}

// ─── ADVANCED (39–50) ────────────────────────────────────────

// 39. Reusable animation (animation() factory)
@Component({
  selector: 'ex-39',
  standalone: true,
  template: `
    <div style="background:#e8f4f8;padding:12px;border-radius:6px">
      <strong>Reusable animation() factory</strong>
      <p style="font-size:0.85rem">Define once, reuse with useAnimation():</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0">
        @if (show1()) {
          <div @reusable1 style="background:#3498db;color:white;padding:8px 14px;border-radius:4px">Box 1</div>
        }
        @if (show2()) {
          <div @reusable2 style="background:#e74c3c;color:white;padding:8px 14px;border-radius:4px">Box 2</div>
        }
      </div>
      <button (click)="show1.update(v=>!v)">Toggle 1</button>
      <button (click)="show2.update(v=>!v)" style="margin-left:8px">Toggle 2</button>
    </div>
  `,
  animations: [
    trigger('reusable1', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-15px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [animate('200ms', style({ opacity: 0 }))]),
    ]),
    trigger('reusable2', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-15px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [animate('200ms', style({ opacity: 0 }))]),
    ]),
  ],
})
class Ex39 {
  show1 = signal(true);
  show2 = signal(true);
}

// 40. useAnimation() with parameters
@Component({
  selector: 'ex-40',
  standalone: true,
  template: `
    <div style="background:#f0f4e8;padding:12px;border-radius:6px">
      <strong>useAnimation() with params</strong>
      <p style="font-size:0.85rem">Pass duration/delay as params:</p>
      <div [@paramAnim]="{ value: state(), params: { dur: dur(), del: '0ms' } }"
           style="background:#2ecc71;color:white;padding:12px;border-radius:6px;margin:8px 0">
        Duration: {{ dur() }}
      </div>
      <select (change)="dur.set($any($event.target).value)">
        <option value="200ms">200ms (fast)</option>
        <option value="500ms" selected>500ms (medium)</option>
        <option value="1000ms">1000ms (slow)</option>
      </select>
      <button (click)="toggle()" style="margin-left:8px">Animate</button>
    </div>
  `,
  animations: [
    trigger('paramAnim', [
      state('on', style({ opacity: 1, transform: 'translateX(0)' })),
      state('off', style({ opacity: 0.4, transform: 'translateX(40px)' })),
      transition('on <=> off', animate('{{ dur }} {{ del }} ease-in-out'), { params: { dur: '300ms', del: '0ms' } }),
    ]),
  ],
})
class Ex40 {
  state = signal('on');
  dur = signal('500ms');
  toggle() { this.state.update(s => s === 'on' ? 'off' : 'on'); }
}

// 41. Complex state machine (4+ states)
@Component({
  selector: 'ex-41',
  standalone: true,
  template: `
    <div style="background:#f8f0e8;padding:12px;border-radius:6px">
      <strong>Complex State Machine (4 states)</strong>
      <div [@stateMachine]="status()"
           style="padding:14px;border-radius:8px;color:white;text-align:center;font-weight:bold;margin:8px 0">
        {{ status().toUpperCase() }}
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        <button (click)="status.set('idle')">idle</button>
        <button (click)="status.set('loading')">loading</button>
        <button (click)="status.set('success')">success</button>
        <button (click)="status.set('error')">error</button>
      </div>
    </div>
  `,
  animations: [
    trigger('stateMachine', [
      state('idle', style({ background: '#95a5a6', transform: 'scale(1)' })),
      state('loading', style({ background: '#3498db', transform: 'scale(1.02)' })),
      state('success', style({ background: '#2ecc71', transform: 'scale(1)' })),
      state('error', style({ background: '#e74c3c', transform: 'scale(1)' })),
      transition('idle => loading', animate('200ms ease-in')),
      transition('loading => success', animate('300ms ease-out')),
      transition('loading => error', animate('300ms ease-out')),
      transition('* => idle', animate('400ms ease-in-out')),
    ]),
  ],
})
class Ex41 {
  status = signal('idle');
}

// 42. Hero animation concept
@Component({
  selector: 'ex-42',
  standalone: true,
  template: `
    <div style="background:#e8e8f8;padding:12px;border-radius:6px">
      <strong>Hero Animation Concept</strong>
      <p style="font-size:0.85rem">Shared element transitions between views:</p>
      <div style="display:flex;gap:12px;align-items:start">
        <div [@heroSource]="selected()"
             (click)="selected.update(v=>!v)"
             style="background:#8e44ad;color:white;padding:12px;border-radius:8px;cursor:pointer;width:80px;text-align:center">
          <div style="font-size:{{ selected() ? '2rem' : '1rem' }}">★</div>
          <div style="font-size:{{ selected() ? '1rem' : '0.75rem' }}">Hero</div>
        </div>
        <p style="font-size:0.85rem;margin:0">In real hero animations, Angular Router's RouteAnimations move an element between two route views. Click to simulate expand/contract.</p>
      </div>
    </div>
  `,
  animations: [
    trigger('heroSource', [
      state('false', style({ transform: 'scale(1)' })),
      state('true', style({ transform: 'scale(1.5)', transformOrigin: 'top left' })),
      transition('false <=> true', animate('400ms cubic-bezier(0.4, 0, 0.2, 1)')),
    ]),
  ],
})
class Ex42 {
  selected = signal(false);
}

// 43. Scroll-triggered animation simulation
@Component({
  selector: 'ex-43',
  standalone: true,
  template: `
    <div style="background:#f8e8f0;padding:12px;border-radius:6px">
      <strong>Scroll-triggered Animation Simulation</strong>
      <p style="font-size:0.85rem">Use IntersectionObserver + signal to trigger on scroll:</p>
      <button (click)="trigger()" style="margin-bottom:8px;display:block">Simulate scroll into view</button>
      @for (item of items; track item.label) {
        <div [@scrollReveal]="item.visible ? 'visible' : 'hidden'"
             style="background:#c0392b;color:white;padding:8px;margin:4px 0;border-radius:4px">
          {{ item.label }}
        </div>
      }
    </div>
  `,
  animations: [
    trigger('scrollReveal', [
      state('hidden', style({ opacity: 0, transform: 'translateY(30px)' })),
      state('visible', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('hidden => visible', animate('400ms ease-out')),
    ]),
  ],
})
class Ex43 {
  items = [
    { label: 'Section A', visible: false },
    { label: 'Section B', visible: false },
    { label: 'Section C', visible: false },
  ];
  private idx = 0;
  trigger() {
    if (this.idx < this.items.length) {
      this.items[this.idx++].visible = true;
    } else {
      this.items.forEach(i => i.visible = false);
      this.idx = 0;
    }
  }
}

// 44. CSS variable animation
@Component({
  selector: 'ex-44',
  standalone: true,
  template: `
    <div style="background:#fff8e8;padding:12px;border-radius:6px">
      <strong>CSS Variable + Angular Animation</strong>
      <div [@cssVarAnim]="theme()"
           style="padding:14px;border-radius:8px;color:white;font-weight:bold;text-align:center;margin:8px 0;cursor:pointer"
           (click)="theme.update(t => t === 'primary' ? 'accent' : t === 'accent' ? 'danger' : 'primary')">
        {{ theme() }} theme — click to cycle
      </div>
    </div>
  `,
  animations: [
    trigger('cssVarAnim', [
      state('primary', style({ background: '#3498db', transform: 'skewX(0deg)' })),
      state('accent', style({ background: '#9b59b6', transform: 'skewX(-3deg)' })),
      state('danger', style({ background: '#e74c3c', transform: 'skewX(0deg)' })),
      transition('* => *', animate('350ms ease-in-out')),
    ]),
  ],
})
class Ex44 {
  theme = signal('primary');
}

// 45. GPU layer performance (will-change)
@Component({
  selector: 'ex-45',
  standalone: true,
  template: `
    <div style="background:#e8f8f0;padding:12px;border-radius:6px">
      <strong>Performance: GPU Layers (will-change)</strong>
      <ul style="font-size:0.85rem;margin:4px 0">
        <li>Use <code>will-change: transform, opacity</code> for GPU compositing</li>
        <li>Angular animations promote layers automatically for transforms/opacity</li>
        <li>Avoid animating layout-triggering props: width, height, top, left</li>
        <li>Prefer: transform (translate/scale/rotate) and opacity</li>
        <li>Use <code>style(&#123;'will-change': 'transform'&#125;)</code> at animation start</li>
      </ul>
      <div [@gpuAnim]="moving()"
           style="background:#16a085;color:white;padding:8px 14px;border-radius:4px;display:inline-block;will-change:transform">
        GPU-composited box
      </div>
      <br/><button (click)="moving.update(v=>!v)" style="margin-top:6px">Move</button>
    </div>
  `,
  animations: [
    trigger('gpuAnim', [
      state('false', style({ transform: 'translateX(0)', opacity: 1 })),
      state('true', style({ transform: 'translateX(100px)', opacity: 0.8 })),
      transition('false <=> true', animate('400ms ease')),
    ]),
  ],
})
class Ex45 {
  moving = signal(false);
}

// 46. Reduced-motion media query
@Component({
  selector: 'ex-46',
  standalone: true,
  template: `
    <div style="background:#f8e8e8;padding:12px;border-radius:6px">
      <strong>Reduced Motion Respect</strong>
      <p>prefers-reduced-motion: <strong>{{ prefersReduced() ? 'reduce' : 'no-preference' }}</strong></p>
      <div [@respectMotion]="{ value: active(), params: { dur: prefersReduced() ? '1ms' : '500ms' } }"
           style="background:#c0392b;color:white;padding:10px;border-radius:6px;margin:8px 0">
        Animation {{ prefersReduced() ? 'disabled (respecting user preference)' : 'enabled' }}
      </div>
      <button (click)="active.update(v=>!v)">Animate</button>
      <button (click)="prefersReduced.update(v=>!v)" style="margin-left:8px">Toggle reduced</button>
    </div>
  `,
  animations: [
    trigger('respectMotion', [
      state('false', style({ opacity: 1, transform: 'scale(1)' })),
      state('true', style({ opacity: 0.7, transform: 'scale(0.95)' })),
      transition('false <=> true', animate('{{ dur }} ease'), { params: { dur: '300ms' } }),
    ]),
  ],
})
class Ex46 {
  active = signal(true);
  prefersReduced = signal(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

// 47. Animation testing patterns
@Component({
  selector: 'ex-47',
  standalone: true,
  template: `
    <div style="background:#e8f4f8;padding:12px;border-radius:6px">
      <strong>Animation Testing Patterns</strong>
      <pre style="background:#f0f0f0;padding:8px;font-size:0.75rem;border-radius:4px;overflow:auto">{{ code }}</pre>
    </div>
  `,
})
class Ex47 {
  code = `// Option 1: NoopAnimationsModule (disables all animations)
TestBed.configureTestingModule({
  imports: [NoopAnimationsModule, MyComponent],
});

// Option 2: BrowserAnimationsModule (real animations, use fakeAsync)
TestBed.configureTestingModule({
  imports: [BrowserAnimationsModule, MyComponent],
});
fakeAsync(() => {
  component.open = true;
  fixture.detectChanges();
  tick(300); // animation duration
  fixture.detectChanges();
  expect(...);
});`;
}

// 48. Animation with signals state
@Component({
  selector: 'ex-48',
  standalone: true,
  template: `
    <div style="background:#f0f4e8;padding:12px;border-radius:6px">
      <strong>Animation driven by signals</strong>
      <p>Signal state → template binding → animation trigger</p>
      <p>Items: {{ count() }}</p>
      <div [@countAnim]="count()"
           style="font-size:2rem;font-weight:bold;color:#27ae60;text-align:center;padding:8px">
        {{ count() }}
      </div>
      <button (click)="count.update(c=>c+1)">+</button>
      <button (click)="count.update(c=>Math.max(0,c-1))" style="margin-left:8px">-</button>
    </div>
  `,
  animations: [
    trigger('countAnim', [
      transition(':increment', [
        style({ transform: 'translateY(-20px)', color: '#2ecc71', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', color: '#27ae60', opacity: 1 })),
      ]),
      transition(':decrement', [
        style({ transform: 'translateY(20px)', color: '#e74c3c', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', color: '#27ae60', opacity: 1 })),
      ]),
    ]),
  ],
})
class Ex48 {
  count = signal(0);
}

// 49. Full notification animation system
@Component({
  selector: 'ex-49',
  standalone: true,
  template: `
    <div style="background:#f8f0e8;padding:12px;border-radius:6px">
      <strong>Full Notification Animation System</strong>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
        <button (click)="add('success')">✓ Success</button>
        <button (click)="add('error')">✗ Error</button>
        <button (click)="add('info')">ℹ Info</button>
        <button (click)="add('warning')">⚠ Warning</button>
      </div>
      <div [@notifList]="notifications().length">
        @for (n of notifications(); track n.id) {
          <div @notifItem
               [style.background]="colors[n.type]"
               style="padding:8px 12px;margin:4px 0;border-radius:6px;display:flex;justify-content:space-between;align-items:center;color:#333">
            <span>{{ n.icon }} {{ n.msg }}</span>
            <span (click)="dismiss(n.id)" style="cursor:pointer;padding:0 4px">✕</span>
          </div>
        }
      </div>
    </div>
  `,
  animations: [
    trigger('notifList', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(100%)' }),
          stagger(60, animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))),
        ], { optional: true }),
      ]),
    ]),
    trigger('notifItem', [
      transition(':leave', [
        animate('250ms ease-in', style({ opacity: 0, transform: 'translateX(100%)', height: '0', margin: '0' })),
      ]),
    ]),
  ],
})
class Ex49 {
  colors: Record<string, string> = { success: '#c6f6d5', error: '#fed7d7', info: '#bee3f8', warning: '#fefcbf' };
  notifications = signal<{ id: number; type: string; msg: string; icon: string }[]>([]);
  iconMap: Record<string, string> = { success: '✓', error: '✗', info: 'ℹ', warning: '⚠' };
  add(type: string) {
    const id = Date.now();
    this.notifications.update(ns => [...ns, { id, type, msg: `${type} notification`, icon: this.iconMap[type] }]);
    setTimeout(() => this.dismiss(id), 3000);
  }
  dismiss(id: number) { this.notifications.update(ns => ns.filter(n => n.id !== id)); }
}

// 50. Production animation architecture
@Component({
  selector: 'ex-50',
  standalone: true,
  template: `
    <div style="background:#e8e8f8;padding:12px;border-radius:6px">
      <strong>Production Animation Architecture</strong>
      <ul style="font-size:0.85rem;margin:4px 0">
        @for (point of points; track point) { <li>{{ point }}</li> }
      </ul>
      <div [@architecture]="step()"
           style="background:#2c3e50;color:white;padding:10px;border-radius:6px;margin:8px 0;text-align:center">
        Step {{ step() }}: {{ stepLabels[step()-1] }}
      </div>
      <button (click)="step.update(s => s % 4 + 1)">Next step</button>
    </div>
  `,
  animations: [
    trigger('architecture', [
      state('1', style({ background: '#2c3e50' })),
      state('2', style({ background: '#8e44ad' })),
      state('3', style({ background: '#16a085' })),
      state('4', style({ background: '#c0392b' })),
      transition('* => *', animate('350ms ease-in-out')),
    ]),
  ],
})
class Ex50 {
  step = signal(1);
  stepLabels = ['provideAnimations()', 'Define triggers', 'Bind in template', 'Test with NoopAnimations'];
  points = [
    'Use provideAnimations() in app.config.ts (standalone)',
    'Define triggers in @Component animations: [] decorator',
    'Extract reusable animations to separate files with animation()',
    'Use useAnimation() + params for configurable animations',
    'Respect prefers-reduced-motion via signal + param duration',
    'Test: NoopAnimationsModule for unit tests, BrowserAnimationsModule + fakeAsync for integration',
    'Prefer transform/opacity (GPU compositing) over layout props',
    'stagger() for list animations, query() for parent-child coordination',
    'animateChild() for nested component animation orchestration',
    'Angular CDK OverlayModule provides animation hooks for dialogs/popovers',
  ];
}

// ─── AppComponent ────────────────────────────────────────────

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
      <h1>Examples 7.5 — Angular Animations</h1>

      <h4>1. trigger() concept</h4><ex-01 /><hr />
      <h4>2. state() and style()</h4><ex-02 /><hr />
      <h4>3. animate() timing</h4><ex-03 /><hr />
      <h4>4. Open / Closed toggle</h4><ex-04 /><hr />
      <h4>5. Fade in / out</h4><ex-05 /><hr />
      <h4>6. Slide up / down</h4><ex-06 /><hr />
      <h4>7. Scale in / out</h4><ex-07 /><hr />
      <h4>8. Rotate animation</h4><ex-08 /><hr />
      <h4>9. Color transition</h4><ex-09 /><hr />
      <h4>10. Height animation</h4><ex-10 /><hr />
      <h4>11. Opacity animation</h4><ex-11 /><hr />
      <h4>12. Visibility animation</h4><ex-12 /><hr />
      <h4>13. :enter / :leave animation</h4><ex-13 /><hr />

      <h4>14. :enter/:leave with @if</h4><ex-14 /><hr />
      <h4>15. void state</h4><ex-15 /><hr />
      <h4>16. Wildcard transitions</h4><ex-16 /><hr />
      <h4>17. keyframes() — multi-step</h4><ex-17 /><hr />
      <h4>18. Multi-step keyframes — color wave</h4><ex-18 /><hr />
      <h4>19. group() — parallel animations</h4><ex-19 /><hr />
      <h4>20. sequence() — serial animations</h4><ex-20 /><hr />
      <h4>21. Animation timing functions</h4><ex-21 /><hr />
      <h4>22. Bounce effect</h4><ex-22 /><hr />
      <h4>23. Shake effect</h4><ex-23 /><hr />
      <h4>24. Pulse effect</h4><ex-24 /><hr />
      <h4>25. Flip card</h4><ex-25 /><hr />
      <h4>26. Accordion</h4><ex-26 /><hr />

      <h4>27. stagger() — list stagger enter</h4><ex-27 /><hr />
      <h4>28. query() + stagger()</h4><ex-28 /><hr />
      <h4>29. animateChild()</h4><ex-29 /><hr />
      <h4>30. Parent-child coordination</h4><ex-30 /><hr />
      <h4>31. Route transition animation</h4><ex-31 /><hr />
      <h4>32. Tab switching animation</h4><ex-32 /><hr />
      <h4>33. Modal enter / leave</h4><ex-33 /><hr />
      <h4>34. Dropdown animation</h4><ex-34 /><hr />
      <h4>35. Sidebar slide</h4><ex-35 /><hr />
      <h4>36. Card hover animations</h4><ex-36 /><hr />
      <h4>37. List item add / remove</h4><ex-37 /><hr />
      <h4>38. Data loading animation</h4><ex-38 /><hr />

      <h4>39. Reusable animation factory</h4><ex-39 /><hr />
      <h4>40. useAnimation() with params</h4><ex-40 /><hr />
      <h4>41. Complex state machine</h4><ex-41 /><hr />
      <h4>42. Hero animation concept</h4><ex-42 /><hr />
      <h4>43. Scroll-triggered animation simulation</h4><ex-43 /><hr />
      <h4>44. CSS variable animation</h4><ex-44 /><hr />
      <h4>45. GPU layer performance</h4><ex-45 /><hr />
      <h4>46. Reduced-motion media query</h4><ex-46 /><hr />
      <h4>47. Animation testing patterns</h4><ex-47 /><hr />
      <h4>48. Animation with signals state</h4><ex-48 /><hr />
      <h4>49. Full notification animation system</h4><ex-49 /><hr />
      <h4>50. Production animation architecture</h4><ex-50 />
    </div>
  `,
})
export class AppComponent {}
