// Phase 6 - Exercise 05: Testing Patterns
// Topics: TestBed, ComponentFixture, fakeAsync, tick,
//         HttpClientTestingModule, HttpTestingController, testing signals

import { Component } from '@angular/core';

// ─────────────────────────────────────────────
// TODO 1: TestBed setup pattern for a standalone component
//
// Create GreetingComponent:
//   @Input() name = 'World'
//   Renders: <h1>Hello, {{ name }}!</h1>
//
// Show the test pattern:
//   describe('GreetingComponent', () => {
//     let fixture: ComponentFixture<GreetingComponent>;
//     let component: GreetingComponent;
//
//     beforeEach(async () => {
//       await TestBed.configureTestingModule({
//         imports: [GreetingComponent],  // standalone: import directly
//       }).compileComponents();
//
//       fixture = TestBed.createComponent(GreetingComponent);
//       component = fixture.componentInstance;
//       fixture.detectChanges();  // run ngOnInit, initial binding
//     });
//
//     it('shows default greeting', () => {
//       const h1 = fixture.nativeElement.querySelector('h1');
//       expect(h1.textContent).toBe('Hello, World!');
//     });
//   });
// ─────────────────────────────────────────────

// TODO 1: GreetingComponent
// @Component({ ... })
// export class GreetingComponent { }

// ─────────────────────────────────────────────
// TODO 2: Test @Input() / @Output() with ComponentFixture
//
// Create CounterButtonComponent:
//   @Input() label = 'Click'
//   @Input() count = 0
//   @Output() countChange = new EventEmitter<number>()
//   Button that increments count and emits countChange
//
// Test patterns:
//   // Set Input
//   component.count = 5;
//   component.label = 'My Button';
//   fixture.detectChanges();
//   expect(fixture.nativeElement.querySelector('button').textContent).toContain('My Button');
//
//   // Test Output emission
//   let emitted: number | undefined;
//   component.countChange.subscribe(v => emitted = v);
//   fixture.nativeElement.querySelector('button').click();
//   fixture.detectChanges();
//   expect(emitted).toBe(1);
// ─────────────────────────────────────────────

// TODO 2: CounterButtonComponent
// @Component({ ... })
// export class CounterButtonComponent { }

// ─────────────────────────────────────────────
// TODO 3: Test a service with HttpClientTestingModule
//
// Create PostsService:
//   inject HttpClient
//   getPosts(): Observable<Post[]> { return this.http.get<Post[]>('/api/posts'); }
//   getPost(id: number): Observable<Post> { return this.http.get<Post>('/api/posts/' + id); }
//
// Test pattern:
//   TestBed.configureTestingModule({
//     imports: [HttpClientTestingModule],
//     providers: [PostsService],
//   });
//   const service = TestBed.inject(PostsService);
//   const httpMock = TestBed.inject(HttpTestingController);
//
//   service.getPosts().subscribe(posts => expect(posts).toHaveLength(2));
//   const req = httpMock.expectOne('/api/posts');
//   expect(req.request.method).toBe('GET');
//   req.flush([{ id: 1, title: 'Post A' }, { id: 2, title: 'Post B' }]);
//   httpMock.verify();  // ensure no unexpected requests
// ─────────────────────────────────────────────

// TODO 3: PostsService
// @Injectable({ providedIn: 'root' })
// export class PostsService { }

// ─────────────────────────────────────────────
// TODO 4: Test signals and computed values
//
// Create a SignalCounterService:
//   count = signal(0)
//   doubled = computed(() => count() * 2)
//   increment() { count.update(c => c + 1) }
//   decrement() { count.update(c => c - 1) }
//
// Test pattern (no async needed for signals):
//   it('increments count', () => {
//     const service = TestBed.inject(SignalCounterService);
//     service.increment();
//     expect(service.count()).toBe(1);
//     expect(service.doubled()).toBe(2);
//   });
//
//   it('decorates component with signal input', () => {
//     // In Angular 17.1+: component.myInput = input(initialValue)
//     // Test: TestBed.runInInjectionContext(() => { ... })
//   });
// ─────────────────────────────────────────────

// TODO 4: SignalCounterService
// @Injectable({ providedIn: 'root' })
// export class SignalCounterService { }

// ─────────────────────────────────────────────
// TODO 5: fakeAsync + tick for timer-based tests
//
// Create a TimerService:
//   elapsed = signal(0)
//   start() { setInterval(() => elapsed.update(e => e + 1), 1000) }
//
// Test pattern:
//   it('increments every second', fakeAsync(() => {
//     const service = TestBed.inject(TimerService);
//     service.start();
//
//     tick(1000);  // advance fake clock by 1s
//     expect(service.elapsed()).toBe(1);
//
//     tick(3000);  // advance by 3 more seconds
//     expect(service.elapsed()).toBe(4);
//
//     discardPeriodicTasks();  // clean up pending timers
//   }));
//
//   // flushMicrotasks(): flush pending microtasks (Promises)
//   // flush():           run all pending timers
// ─────────────────────────────────────────────

// TODO 5: TimerService
// @Injectable({ providedIn: 'root' })
// export class TimerService { }

// ─────────────────────────────────────────────
// TODO 6: Create AppComponent that demonstrates all patterns
// (Tests would live in *.spec.ts files — this file shows the components/services to test)
// ─────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO 6: import components here
  ],
  template: `
    <h1>Testing Patterns Exercise</h1>
    <!-- TODO 6: render components here -->
  `,
})
export class AppComponent {}
