// Phase 6 - Solution 05: Testing Patterns
// Topics: TestBed, ComponentFixture, fakeAsync, tick,
//         HttpClientTestingModule, HttpTestingController, testing signals
//
// NOTE: This file contains the components and services to test.
//       The actual test code is shown as exported string constants (test patterns)
//       so the file compiles cleanly without jasmine/jest globals.
//       In a real project, copy the test code into *.spec.ts files.

import {
  Component, Input, Output, EventEmitter, signal, computed,
  inject, Injectable, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ─────────────────────────────────────────────────────────────────────────────
// 1. GreetingComponent + TestBed pattern
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-greeting',
  standalone: true,
  template: `<h2>Hello, {{ name }}!</h2>`,
})
export class GreetingComponent {
  @Input() name = 'World';
}

export const GREETING_TEST = `
// greeting.component.spec.ts
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { GreetingComponent } from './greeting.component';

describe('GreetingComponent', () => {
  let fixture: ComponentFixture<GreetingComponent>;
  let component: GreetingComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GreetingComponent],  // standalone: import directly (not declarations)
    }).compileComponents();

    fixture   = TestBed.createComponent(GreetingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();  // runs ngOnInit + initial template binding
  });

  it('shows default greeting', () => {
    const h2 = fixture.nativeElement.querySelector('h2') as HTMLElement;
    expect(h2.textContent).toBe('Hello, World!');
  });

  it('shows custom name when @Input is set', () => {
    component.name = 'Angular';
    fixture.detectChanges();  // re-run change detection after input change
    const h2 = fixture.nativeElement.querySelector('h2') as HTMLElement;
    expect(h2.textContent).toBe('Hello, Angular!');
  });

  it('uses fixture.debugElement for semantic queries', () => {
    component.name = 'Developer';
    fixture.detectChanges();
    const h2 = fixture.debugElement.nativeElement.querySelector('h2');
    expect(h2.textContent).toContain('Developer');
  });
});
`;

// ─────────────────────────────────────────────────────────────────────────────
// 2. CounterButtonComponent + @Input / @Output test patterns
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-counter-button',
  standalone: true,
  template: `
    <div style="display:flex; align-items:center; gap:0.5rem">
      <button (click)="increment()"
              style="padding:0.4rem 0.75rem; background:#1565c0; color:white; border:none; border-radius:4px; cursor:pointer">
        {{ label }}: {{ count }}
      </button>
    </div>
  `,
})
export class CounterButtonComponent {
  @Input() label = 'Click';
  @Input() count = 0;
  @Output() countChange = new EventEmitter<number>();

  increment() {
    this.count++;
    this.countChange.emit(this.count);
  }
}

export const COUNTER_BUTTON_TEST = `
// counter-button.component.spec.ts
describe('CounterButtonComponent', () => {
  let fixture: ComponentFixture<CounterButtonComponent>;
  let component: CounterButtonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterButtonComponent],
    }).compileComponents();
    fixture   = TestBed.createComponent(CounterButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders with default label', () => {
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.textContent).toContain('Click');
  });

  it('reflects @Input count', () => {
    component.count = 5;
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.textContent).toContain('5');
  });

  it('emits countChange on click', () => {
    const emitted: number[] = [];
    component.countChange.subscribe(v => emitted.push(v));

    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();

    expect(emitted).toEqual([1]);
  });

  it('increments count on multiple clicks', () => {
    const btn = fixture.nativeElement.querySelector('button');
    btn.click(); btn.click(); btn.click();
    fixture.detectChanges();
    expect(component.count).toBe(3);
  });
});
`;

// ─────────────────────────────────────────────────────────────────────────────
// 3. PostsService + HttpClientTestingModule pattern
// ─────────────────────────────────────────────────────────────────────────────

interface Post { id: number; title: string; body?: string; }

@Injectable({ providedIn: 'root' })
export class PostsService {
  // Real: private http = inject(HttpClient);
  // Shim (no actual HTTP in demo):
  getPosts(): Post[] { return []; }
  getPost(_id: number): Post { return { id: _id, title: '' }; }
}

export const POSTS_SERVICE_TEST = `
// posts.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PostsService } from './posts.service';

describe('PostsService', () => {
  let service: PostsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PostsService],
    });
    service  = TestBed.inject(PostsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();  // assert no unexpected HTTP calls were made
  });

  it('fetches posts', () => {
    const mockPosts = [{ id: 1, title: 'Post A' }, { id: 2, title: 'Post B' }];

    service.getPosts().subscribe(posts => {
      expect(posts).toHaveSize(2);
      expect(posts[0].title).toBe('Post A');
    });

    const req = httpMock.expectOne('/api/posts');
    expect(req.request.method).toBe('GET');
    req.flush(mockPosts);       // resolve the request with mock data
  });

  it('handles HTTP error', () => {
    service.getPosts().subscribe({
      next: () => fail('should have errored'),
      error: (err) => expect(err.status).toBe(500),
    });

    const req = httpMock.expectOne('/api/posts');
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
  });

  it('fetches single post by id', () => {
    service.getPost(42).subscribe(post => {
      expect(post.id).toBe(42);
    });
    const req = httpMock.expectOne('/api/posts/42');
    req.flush({ id: 42, title: 'The answer' });
  });
});
`;

// ─────────────────────────────────────────────────────────────────────────────
// 4. SignalCounterService + signal testing
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class SignalCounterService {
  count   = signal(0);
  doubled = computed(() => this.count() * 2);

  increment() { this.count.update(c => c + 1); }
  decrement() { this.count.update(c => c - 1); }
  reset()     { this.count.set(0); }
}

export const SIGNAL_SERVICE_TEST = `
// signal-counter.service.spec.ts
describe('SignalCounterService', () => {
  let service: SignalCounterService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SignalCounterService] });
    service = TestBed.inject(SignalCounterService);
  });

  it('starts at 0', () => {
    expect(service.count()).toBe(0);
    expect(service.doubled()).toBe(0);
  });

  it('increments', () => {
    service.increment();
    expect(service.count()).toBe(1);
    expect(service.doubled()).toBe(2);
  });

  it('decrements', () => {
    service.increment();
    service.decrement();
    expect(service.count()).toBe(0);
  });

  it('resets', () => {
    service.increment();
    service.increment();
    service.reset();
    expect(service.count()).toBe(0);
  });

  // Signals are synchronous — no fakeAsync needed!
  it('computed updates immediately', () => {
    service.count.set(5);
    expect(service.doubled()).toBe(10);  // no tick() needed
  });
});
`;

// ─────────────────────────────────────────────────────────────────────────────
// 5. TimerService + fakeAsync + tick
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class TimerService {
  elapsed = signal(0);
  private id: ReturnType<typeof setInterval> | null = null;

  start() {
    this.id = setInterval(() => this.elapsed.update(e => e + 1), 1000);
  }

  stop() {
    if (this.id) { clearInterval(this.id); this.id = null; }
  }
}

export const TIMER_SERVICE_TEST = `
// timer.service.spec.ts
import { fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';

describe('TimerService', () => {
  let service: TimerService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [TimerService] });
    service = TestBed.inject(TimerService);
  });

  it('starts at 0', () => {
    expect(service.elapsed()).toBe(0);
  });

  it('increments every second', fakeAsync(() => {
    service.start();

    tick(1000);                    // advance fake clock by 1000ms
    expect(service.elapsed()).toBe(1);

    tick(3000);                    // advance by 3 more seconds
    expect(service.elapsed()).toBe(4);

    service.stop();
    discardPeriodicTasks();        // clean up any remaining periodic timers
  }));

  it('stops when stop() is called', fakeAsync(() => {
    service.start();
    tick(2000);
    service.stop();
    const countAtStop = service.elapsed();

    tick(5000);                    // 5 more seconds — timer is stopped, shouldn't change
    expect(service.elapsed()).toBe(countAtStop);
    discardPeriodicTasks();
  }));
});

// Other useful testing utilities:
// flushMicrotasks() — flush pending Promises/microtasks
// flush()           — run ALL pending timers to completion
// jasmine.createSpy() — create a spy function
// spyOn(obj, 'method').and.returnValue(mockValue)
// spyOn(obj, 'method').and.callFake((arg) => ...)
`;

// ─────────────────────────────────────────────────────────────────────────────
// Display component — shows test patterns side-by-side with the components
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-test-pattern-viewer',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div style="padding:1.5rem; background:#f5f5f5; border-radius:8px; margin-bottom:1rem">
      <h3>Testing Pattern: {{ title }}</h3>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem">
        <div>
          <strong>Live Component/Service:</strong>
          <div style="margin-top:0.5rem">
            <ng-content />
          </div>
        </div>
        <div>
          <strong>Test Code (.spec.ts):</strong>
          <pre style="background:#1e1e1e; color:#d4d4d4; padding:0.75rem; border-radius:4px;
                      font-size:0.75rem; overflow:auto; max-height:300px; margin-top:0.5rem">{{ testCode }}</pre>
        </div>
      </div>
    </div>
  `,
})
export class TestPatternViewerComponent {
  @Input() title = '';
  @Input() testCode = '';
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    GreetingComponent, CounterButtonComponent,
    TestPatternViewerComponent,
  ],
  template: `
    <div style="font-family:sans-serif; max-width:1100px; margin:2rem auto; padding:0 1rem">
      <h1>Phase 6 – Testing Patterns</h1>
      <p style="color:#555">
        Components and services are shown live on the left; their corresponding test code on the right.
        Copy test code into <code>*.spec.ts</code> files to run them.
      </p>

      <!-- 1: TestBed setup -->
      <app-test-pattern-viewer title="1. TestBed + ComponentFixture" [testCode]="greetingTest">
        <app-greeting name="Angular" />
        <p style="font-size:0.85rem; color:#555; margin-top:0.4rem">
          Change name input → fixture.detectChanges() updates the DOM.
        </p>
      </app-test-pattern-viewer>

      <!-- 2: @Input / @Output -->
      <app-test-pattern-viewer title="2. Testing @Input / @Output" [testCode]="counterButtonTest">
        <app-counter-button label="My Button" />
      </app-test-pattern-viewer>

      <!-- 3: HTTP testing -->
      <app-test-pattern-viewer title="3. HttpClientTestingModule" [testCode]="postsServiceTest">
        <div style="padding:0.75rem; background:white; border-radius:4px">
          <strong>PostsService</strong> — makes GET /api/posts and /api/posts/:id<br/>
          <small>Test intercepts the requests and flushes mock data.</small>
        </div>
      </app-test-pattern-viewer>

      <!-- 4: Signals -->
      <app-test-pattern-viewer title="4. Testing Signals" [testCode]="signalTest">
        <div style="padding:0.75rem; background:white; border-radius:4px">
          <strong>SignalCounterService</strong><br/>
          <small>Signals are synchronous — no async/fakeAsync needed!</small>
        </div>
      </app-test-pattern-viewer>

      <!-- 5: fakeAsync -->
      <app-test-pattern-viewer title="5. fakeAsync + tick" [testCode]="timerTest">
        <div style="padding:0.75rem; background:white; border-radius:4px">
          <strong>TimerService</strong><br/>
          <small>fakeAsync + tick() controls setTimeout/setInterval timing.</small>
        </div>
      </app-test-pattern-viewer>
    </div>
  `,
})
export class AppComponent {
  greetingTest     = GREETING_TEST;
  counterButtonTest= COUNTER_BUTTON_TEST;
  postsServiceTest = POSTS_SERVICE_TEST;
  signalTest       = SIGNAL_SERVICE_TEST;
  timerTest        = TIMER_SERVICE_TEST;
}
