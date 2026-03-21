import { Component, signal, computed, Input, Output, EventEmitter, ChangeDetectionStrategy, inject } from '@angular/core';

// ============================================================
// Examples 6.5 — Angular Testing Patterns (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. TestBed.configureTestingModule structure
@Component({ selector: 'ex-01', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>TestBed.configureTestingModule structure</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex01 {
  code = `import { TestBed } from '@angular/core/testing';

describe('MyComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MyComponent,     // standalone component
        RouterTestingModule,
        HttpClientTestingModule,
      ],
      providers: [
        { provide: MyService, useValue: mockService }
      ]
    }).compileComponents();
  });
});`;
}

// 2. ComponentFixture pattern
@Component({ selector: 'ex-02', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>ComponentFixture pattern</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex02 {
  code = `let fixture: ComponentFixture<MyComponent>;
let component: MyComponent;

beforeEach(() => {
  fixture = TestBed.createComponent(MyComponent);
  component = fixture.componentInstance;
  // fixture.nativeElement — the DOM element
  // fixture.debugElement — DebugElement wrapper
  // fixture.changeDetectorRef — manual CD
});`;
}

// 3. fixture.detectChanges() when to call
@Component({ selector: 'ex-03', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>fixture.detectChanges() — when to call</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex03 {
  code = `// fixture.detectChanges() triggers:
// 1. ngOnInit() (first call)
// 2. Re-renders template
// 3. Updates bindings

it('should render title', () => {
  fixture.detectChanges(); // triggers ngOnInit + initial render

  const h1 = fixture.nativeElement.querySelector('h1');
  expect(h1.textContent).toBe('Hello World');
});

it('should update after signal change', () => {
  fixture.detectChanges(); // initial
  component.title.set('Updated');
  fixture.detectChanges(); // re-render
  expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Updated');
});`;
}

// 4. debugElement.query(By.css()) pattern
@Component({ selector: 'ex-04', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>debugElement.query(By.css()) pattern</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex04 {
  code = `import { By } from '@angular/platform-browser';

// Query single element
const btn = fixture.debugElement.query(By.css('button'));
const title = fixture.debugElement.query(By.css('.title'));

// Query all elements
const items = fixture.debugElement.queryAll(By.css('li'));

// Query by directive
const myDirs = fixture.debugElement.queryAll(By.directive(MyDirective));

// Access native element
btn.nativeElement.click();
expect(btn.nativeElement.textContent).toContain('Submit');`;
}

// 5. nativeElement access pattern
@Component({ selector: 'ex-05', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>nativeElement access pattern</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex05 {
  code = `const el: HTMLElement = fixture.nativeElement;

// Text content
expect(el.querySelector('h1')?.textContent).toBe('Title');

// Classes
expect(el.querySelector('.card')?.classList).toContain('active');

// Attributes
expect(el.querySelector('input')?.getAttribute('type')).toBe('email');

// Visibility
const hidden = el.querySelector('.modal');
expect(hidden).toBeNull(); // not rendered when condition false`;
}

// 6. fixture.componentInstance access
@Component({ selector: 'ex-06', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>fixture.componentInstance access</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex06 {
  code = `const component = fixture.componentInstance;

// Read signal value
expect(component.count()).toBe(0);

// Call methods
component.increment();
fixture.detectChanges();
expect(component.count()).toBe(1);

// Set inputs
component.title = 'Test Title';
fixture.detectChanges();

// Access injected services
const service = component['myService']; // private field`;
}

// 7. Testing a signal value in component
@Component({ selector: 'ex-07', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>Testing a signal value in component</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex07 {
  code = `// Component:
@Component({...})
class CounterComponent {
  count = signal(0);
  double = computed(() => this.count() * 2);
  increment() { this.count.update(c => c + 1); }
}

// Spec:
it('should update signal value', () => {
  fixture.detectChanges();

  expect(component.count()).toBe(0);         // read signal
  expect(component.double()).toBe(0);        // read computed

  component.increment();
  expect(component.count()).toBe(1);         // no detectChanges needed
  expect(component.double()).toBe(2);        // computed auto-updates
});`;
}

// 8. Testing @Input() property
@Component({ selector: 'ex-08', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>Testing @Input() property</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex08 {
  code = `// Component:
@Component({ template: '<h2>{{ title }}</h2>' })
class CardComponent {
  @Input() title = '';
  @Input() color = 'blue';
}

// Spec:
it('should display @Input title', () => {
  component.title = 'Test Card';
  component.color = 'red';
  fixture.detectChanges();

  const h2 = fixture.nativeElement.querySelector('h2');
  expect(h2.textContent).toBe('Test Card');
});`;
}

// 9. Testing @Output() EventEmitter
@Component({ selector: 'ex-09', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>Testing @Output() EventEmitter</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex09 {
  code = `// Component:
@Component({ template: '<button (click)="save()">Save</button>' })
class FormComponent {
  @Output() saved = new EventEmitter<string>();
  save() { this.saved.emit('form-data'); }
}

// Spec:
it('should emit saved event', () => {
  fixture.detectChanges();

  let emittedValue: string | undefined;
  component.saved.subscribe(v => emittedValue = v);

  const btn = fixture.nativeElement.querySelector('button');
  btn.click();

  expect(emittedValue).toBe('form-data');
});`;
}

// 10. Testing button click → method call
@Component({ selector: 'ex-10', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>Testing button click → method call</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex10 {
  code = `it('should call submit() on button click', () => {
  fixture.detectChanges();

  // Spy on the method
  spyOn(component, 'submit');

  const btn = fixture.debugElement.query(By.css('[data-testid="submit-btn"]'));
  btn.nativeElement.click();
  // or: btn.triggerEventHandler('click', null);

  expect(component.submit).toHaveBeenCalled();
  expect(component.submit).toHaveBeenCalledTimes(1);
});`;
}

// 11. Testing template rendering (textContent)
@Component({ selector: 'ex-11', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>Testing template rendering (textContent)</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex11 {
  code = `it('should render user list', () => {
  component.users = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ];
  fixture.detectChanges();

  const items = fixture.nativeElement.querySelectorAll('li');
  expect(items.length).toBe(2);
  expect(items[0].textContent.trim()).toBe('Alice');
  expect(items[1].textContent.trim()).toBe('Bob');

  // Also useful:
  expect(fixture.nativeElement.textContent).toContain('Alice');
});`;
}

// 12. Basic component spec structure
@Component({ selector: 'ex-12', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>Basic component spec structure</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex12 {
  code = `// my-component.spec.ts
describe('MyComponent', () => {
  let fixture: ComponentFixture<MyComponent>;
  let component: MyComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render title', () => {
    expect(fixture.nativeElement.querySelector('h1')).toBeTruthy();
  });
});`;
}

// 13. describe/it/expect pattern
@Component({ selector: 'ex-13', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>describe / it / expect pattern</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex13 {
  code = `describe('CounterComponent', () => {
  describe('increment', () => {
    it('should increase count by 1', () => {
      component.count.set(5);
      component.increment();
      expect(component.count()).toBe(6);
    });

    it('should not exceed max', () => {
      component.count.set(10); // max
      component.increment();
      expect(component.count()).toBe(10); // capped
    });
  });

  describe('reset', () => {
    it('should set count to 0', () => {
      component.count.set(7);
      component.reset();
      expect(component.count()).toBe(0);
    });
  });
});`;
}

// ─── INTERMEDIATE (14–26) ───────────────────────────────────

// 14. HttpClientTestingModule setup
@Component({ selector: 'ex-14', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>HttpClientTestingModule setup (code display)</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex14 {
  code = `import { HttpClientTestingModule, HttpTestingController }
  from '@angular/common/http/testing';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // ensure no unexpected requests
  });
});`;
}

// 15. HttpTestingController expectOne
@Component({ selector: 'ex-15', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>HttpTestingController expectOne (code display)</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex15 {
  code = `it('should fetch users', () => {
  const mockUsers = [{ id: 1, name: 'Alice' }];

  // Trigger the HTTP call
  service.getUsers().subscribe(users => {
    expect(users).toEqual(mockUsers);
  });

  // Intercept the request
  const req = httpMock.expectOne('/api/users');
  expect(req.request.method).toBe('GET');

  // Flush the mock response
  req.flush(mockUsers);
});`;
}

// 16. fakeAsync + tick pattern
@Component({ selector: 'ex-16', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>fakeAsync + tick pattern (code display)</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex16 {
  code = `import { fakeAsync, tick } from '@angular/core/testing';

it('should update after 1 second delay', fakeAsync(() => {
  fixture.detectChanges();
  component.startCountdown(); // sets a setTimeout(fn, 1000)

  expect(component.timeLeft()).toBe(10);

  tick(1000); // advance virtual time by 1000ms
  fixture.detectChanges();

  expect(component.timeLeft()).toBe(9);
}));`;
}

// 17. fakeAsync + flush
@Component({ selector: 'ex-17', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>fakeAsync + flush (code display)</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex17 {
  code = `import { fakeAsync, flush } from '@angular/core/testing';

it('should complete all pending async ops', fakeAsync(() => {
  fixture.detectChanges();
  component.loadData(); // triggers setTimeout, setInterval, promises

  flush(); // drains ALL pending macrotasks
  fixture.detectChanges();

  expect(component.loaded()).toBe(true);
  // flush() vs tick(n):
  // tick(n) — advance exactly n ms
  // flush() — advance until no more pending tasks`;
}

// 18. waitForAsync pattern
@Component({ selector: 'ex-18', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>waitForAsync pattern</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex18 {
  code = `import { waitForAsync } from '@angular/core/testing';

it('should load component async', waitForAsync(() => {
  fixture.detectChanges();

  // Works with real Promises and async operations
  component.loadUser(1).then(() => {
    fixture.detectChanges();
    expect(component.user()?.name).toBe('Alice');
  });
}));

// Alternative: async/await in test
it('should work with async/await', async () => {
  fixture.detectChanges();
  await component.loadUser(1);
  fixture.detectChanges();
  expect(component.user()?.name).toBe('Alice');
});`;
}

// 19. Spy on service method (spyOn)
@Component({ selector: 'ex-19', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>Spy on service method (spyOn)</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex19 {
  code = `it('should call service.save on submit', () => {
  const service = TestBed.inject(UserService);
  const saveSpy = spyOn(service, 'save').and.returnValue(of({ success: true }));

  component.name.set('Alice');
  component.submit();

  expect(saveSpy).toHaveBeenCalledWith({ name: 'Alice' });
  expect(saveSpy).toHaveBeenCalledTimes(1);
});

// Spying on return values:
spyOn(service, 'getData').and.returnValue(of([1, 2, 3]));
spyOn(service, 'post').and.rejectWith(new Error('Network fail'));`;
}

// 20. Mock service with signal
@Component({ selector: 'ex-20', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>Mock service with signal</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex20 {
  code = `// Create a mock that uses signals
const mockAuthService = {
  isLoggedIn: signal(false),
  user: signal<User | null>(null),
  login: jasmine.createSpy('login').and.callFake(() => {
    mockAuthService.isLoggedIn.set(true);
    mockAuthService.user.set({ id: 1, name: 'Alice' });
  }),
  logout: jasmine.createSpy('logout')
};

TestBed.configureTestingModule({
  providers: [
    { provide: AuthService, useValue: mockAuthService }
  ]
});`;
}

// 21. Test async Observable with fakeAsync
@Component({ selector: 'ex-21', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>Test async Observable with fakeAsync</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex21 {
  code = `import { fakeAsync, tick } from '@angular/core/testing';
import { of, delay } from 'rxjs';

it('should handle delayed observable', fakeAsync(() => {
  const service = TestBed.inject(DataService);
  spyOn(service, 'getItems').and.returnValue(
    of(['a', 'b', 'c']).pipe(delay(500))
  );

  fixture.detectChanges();
  expect(component.items()).toEqual([]);

  tick(500); // advance past the delay
  fixture.detectChanges();

  expect(component.items()).toEqual(['a', 'b', 'c']);
}));`;
}

// 22. Test form validation state
@Component({ selector: 'ex-22', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>Test form validation state</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex22 {
  code = `it('should be invalid when email is missing', () => {
  fixture.detectChanges();
  const form = component.form;

  form.get('email')?.setValue('');
  form.get('email')?.markAsTouched();

  expect(form.valid).toBeFalse();
  expect(form.get('email')?.errors?.['required']).toBeTrue();

  fixture.detectChanges();
  const errorMsg = fixture.nativeElement.querySelector('.error-msg');
  expect(errorMsg?.textContent).toContain('Email is required');
});`;
}

// 23. Test component with @Input signal
@Component({ selector: 'ex-23', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>Test component with @Input signal (input())</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex23 {
  code = `// Component with signal input:
@Component({ template: '<h2>{{ title() }}</h2>' })
class CardComponent {
  title = input<string>('Default');
}

// Spec — use setInput() to set signal inputs:
it('should display input title', () => {
  fixture.componentRef.setInput('title', 'Test Title');
  fixture.detectChanges();

  const h2 = fixture.nativeElement.querySelector('h2');
  expect(h2.textContent).toBe('Test Title');
});`;
}

// 24. Test computed signal result
@Component({ selector: 'ex-24', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>Test computed signal result</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex24 {
  code = `// Component:
class CartComponent {
  items = signal<CartItem[]>([]);
  total = computed(() =>
    this.items().reduce((sum, i) => sum + i.price * i.qty, 0)
  );
}

// Spec:
it('should compute total correctly', () => {
  component.items.set([
    { id: 1, price: 10, qty: 2 },
    { id: 2, price: 5,  qty: 3 }
  ]);

  expect(component.total()).toBe(35); // 20 + 15
});`;
}

// 25. Test effect side effect
@Component({ selector: 'ex-25', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>Test effect side effect</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex25 {
  code = `import { fakeAsync, TestBed, tick } from '@angular/core/testing';

it('should log when count changes (effect)', fakeAsync(() => {
  const logSpy = spyOn(console, 'log');

  // Signal effects run asynchronously (microtask)
  component.count.set(5);
  tick(); // flush microtasks so effect runs

  expect(logSpy).toHaveBeenCalledWith('Count changed to: 5');
}));

// Note: effects are scheduled as microtasks
// Use tick() or flushMicrotasks() to run them`;
}

// 26. Component harness concept
@Component({ selector: 'ex-26', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>Component harness concept (@angular/cdk/testing)</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex26 {
  code = `import { MatButtonHarness } from '@angular/material/button/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';

it('should click submit via harness', async () => {
  const loader: HarnessLoader =
    TestbedHarnessEnvironment.loader(fixture);

  const btn = await loader.getHarness(
    MatButtonHarness.with({ text: 'Submit' })
  );
  expect(await btn.isDisabled()).toBeFalse();
  await btn.click();

  expect(component.submitted()).toBeTrue();
});`;
}

// ─── NESTED (27–38) ─────────────────────────────────────────

// 27. Testing parent-child interaction
@Component({ selector: 'ex-27', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>Testing parent-child interaction</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex27 {
  code = `// Test parent renders child and passes @Input
it('should pass title to child', () => {
  component.title = 'Parent Title';
  fixture.detectChanges();

  // Find child debug element
  const child = fixture.debugElement.query(By.directive(ChildComponent));
  const childInstance = child.componentInstance as ChildComponent;

  expect(childInstance.title).toBe('Parent Title');
});

// Test parent reacts to child @Output
it('should handle child event', () => {
  fixture.detectChanges();
  const child = fixture.debugElement.query(By.directive(ChildComponent));
  child.triggerEventHandler('selected', { id: 42 });
  fixture.detectChanges();

  expect(component.selectedId()).toBe(42);
});`;
}

// 28. Testing @ViewChild in spec
@Component({ selector: 'ex-28', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>Testing @ViewChild in spec</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex28 {
  code = `// Component:
@Component({
  template: '<input #myInput type="text" />'
})
class MyComponent {
  @ViewChild('myInput') inputEl!: ElementRef;
  focus() { this.inputEl.nativeElement.focus(); }
}

// Spec:
it('should focus input via ViewChild', () => {
  fixture.detectChanges(); // ViewChild resolved after first detectChanges

  spyOn(component.inputEl.nativeElement, 'focus');
  component.focus();

  expect(component.inputEl.nativeElement.focus).toHaveBeenCalled();
});`;
}

// 29. Testing @ContentChild
@Component({ selector: 'ex-29', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>Testing @ContentChild</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex29 {
  code = `// Card component that uses @ContentChild:
@Component({
  selector: 'app-card',
  template: '<div><ng-content></ng-content></div>'
})
class CardComponent {
  @ContentChild(CardHeaderComponent) header?: CardHeaderComponent;
}

// Spec — wrap in a test host:
@Component({
  template: '<app-card><app-card-header title="Test"/></app-card>',
  standalone: true,
  imports: [CardComponent, CardHeaderComponent]
})
class TestHostComponent {}

it('should have header content child', () => {
  const hostFixture = TestBed.createComponent(TestHostComponent);
  hostFixture.detectChanges();
  const card = hostFixture.debugElement.query(By.directive(CardComponent));
  expect(card.componentInstance.header).toBeTruthy();
});`;
}

// 30. Testing signal-based component (full)
@Component({ selector: 'ex-30', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>Testing signal-based component (full)</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex30 {
  code = `describe('TodoComponent', () => {
  it('should add todo', () => {
    component.newTodo.set('Buy milk');
    component.addTodo();

    expect(component.todos().length).toBe(1);
    expect(component.todos()[0].text).toBe('Buy milk');
    expect(component.newTodo()).toBe(''); // cleared after add
  });

  it('should toggle todo complete', () => {
    component.todos.set([{ id: 1, text: 'Task', done: false }]);
    component.toggle(1);
    expect(component.todos()[0].done).toBeTrue();
  });

  it('should count incomplete', () => {
    component.todos.set([
      { id: 1, text: 'A', done: true },
      { id: 2, text: 'B', done: false }
    ]);
    expect(component.incomplete()).toBe(1);
  });
});`;
}

// 31. Testing OnPush component
@Component({ selector: 'ex-31', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>Testing OnPush component</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex31 {
  code = `// OnPush component doesn't re-render on every call
// Must trigger CD via: input change, event, markForCheck, signals

it('should update view when @Input changes', () => {
  component.title = 'Initial';
  fixture.detectChanges(); // renders 'Initial'

  // For OnPush, assign new reference to trigger CD
  component.title = 'Updated';
  fixture.detectChanges(); // re-renders with 'Updated'

  expect(fixture.nativeElement.querySelector('h1').textContent)
    .toBe('Updated');
});

it('should update view when signal changes', () => {
  component.count.set(99); // signal triggers CD in OnPush too
  fixture.detectChanges();
  expect(fixture.nativeElement.textContent).toContain('99');
});`;
}

// 32. Testing reactive form submission
@Component({ selector: 'ex-32', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>Testing reactive form submission</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex32 {
  code = `it('should submit valid form', () => {
  fixture.detectChanges();
  const service = TestBed.inject(UserService);
  const saveSpy = spyOn(service, 'save').and.returnValue(of(null));

  component.form.setValue({
    name: 'Alice',
    email: 'alice@example.com'
  });

  expect(component.form.valid).toBeTrue();

  const submitBtn = fixture.nativeElement.querySelector('[type="submit"]');
  submitBtn.click();

  expect(saveSpy).toHaveBeenCalledWith({ name: 'Alice', email: 'alice@example.com' });
});`;
}

// 33. Testing template-driven form
@Component({ selector: 'ex-33', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>Testing template-driven form</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex33 {
  code = `import { fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

it('should validate template-driven form', fakeAsync(() => {
  // Template-driven forms need FormsModule + tick for ngModel to settle
  fixture.detectChanges();

  const input = fixture.nativeElement.querySelector('input[name="email"]');
  input.value = '';
  input.dispatchEvent(new Event('input'));
  input.dispatchEvent(new Event('blur'));
  fixture.detectChanges();
  tick(); // ngModel update

  fixture.detectChanges();
  const error = fixture.nativeElement.querySelector('.error');
  expect(error?.textContent).toContain('required');
}));`;
}

// 34. Testing HTTP request in component
@Component({ selector: 'ex-34', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>Testing HTTP request in component</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex34 {
  code = `it('should load and display users', () => {
  fixture.detectChanges(); // triggers ngOnInit → service.getUsers()

  const req = httpMock.expectOne('/api/users');
  expect(req.request.method).toBe('GET');

  req.flush([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]);
  fixture.detectChanges();

  const items = fixture.nativeElement.querySelectorAll('li');
  expect(items.length).toBe(2);
  expect(items[0].textContent).toContain('Alice');
});`;
}

// 35. Testing router navigation
@Component({ selector: 'ex-35', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>Testing router navigation</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex35 {
  code = `import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

TestBed.configureTestingModule({
  imports: [RouterTestingModule.withRoutes(routes), MyComponent]
});

it('should navigate to /login on logout', () => {
  const router = TestBed.inject(Router);
  const navSpy = spyOn(router, 'navigate');

  component.logout();

  expect(navSpy).toHaveBeenCalledWith(['/login']);
});

// Test navigation actually happens:
it('should navigate via routerLink', fakeAsync(() => {
  fixture.nativeElement.querySelector('a[routerLink="/about"]').click();
  tick();
  expect(router.url).toBe('/about');
}));`;
}

// 36. Testing with custom providers
@Component({ selector: 'ex-36', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>Testing with custom providers</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex36 {
  code = `// Override tokens, services, and environment in tests:
TestBed.configureTestingModule({
  providers: [
    // Override service
    { provide: AuthService, useClass: MockAuthService },
    // Override with value
    { provide: API_URL, useValue: 'http://test-api.local' },
    // Override with factory
    { provide: ConfigService, useFactory: () => ({
      theme: signal('dark'),
      locale: signal('en'),
    })},
  ]
});

// Or override after setup:
TestBed.overrideProvider(MyService, { useValue: mockService });`;
}

// 37. Testing dynamic component creation
@Component({ selector: 'ex-37', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>Testing dynamic component creation</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex37 {
  code = `it('should create dynamic component on button click', () => {
  fixture.detectChanges();

  const btn = fixture.nativeElement.querySelector('#add-widget');
  btn.click();
  fixture.detectChanges();

  // Check ViewContainerRef has a view
  expect(component.vcr.length).toBe(1);

  // Check DOM
  const widget = fixture.nativeElement.querySelector('app-widget');
  expect(widget).toBeTruthy();
});

it('should destroy dynamic component', () => {
  component.createWidget();
  fixture.detectChanges();

  component.clearWidgets();
  fixture.detectChanges();

  expect(component.vcr.length).toBe(0);
});`;
}

// 38. Full integration test pattern
@Component({ selector: 'ex-38', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>Full integration test pattern</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex38 {
  code = `// Full spec for a CRUD feature:
describe('ProductListComponent integration', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProductListComponent,
        HttpClientTestingModule,
        RouterTestingModule
      ]
    }).compileComponents();
    // ... setup
  });

  it('should load, display, and delete a product', fakeAsync(() => {
    fixture.detectChanges();                       // triggers load
    const req = httpMock.expectOne('/api/products');
    req.flush([{ id: 1, name: 'Widget' }]);

    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.product').length).toBe(1);

    fixture.nativeElement.querySelector('.delete-btn').click();
    fixture.detectChanges();

    const delReq = httpMock.expectOne('/api/products/1');
    expect(delReq.request.method).toBe('DELETE');
    delReq.flush(null);

    tick();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.product').length).toBe(0);
  }));
});`;
}

// ─── ADVANCED (39–50) ────────────────────────────────────────

// 39. Component harness pattern (@angular/cdk/testing)
@Component({ selector: 'ex-39', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>Component harness pattern (@angular/cdk/testing)</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex39 {
  code = `// Create a harness for your custom component:
import { ComponentHarness } from '@angular/cdk/testing';

class CardHarness extends ComponentHarness {
  static hostSelector = 'app-card';

  private getTitle = this.locatorFor('.card-title');
  private getBtn   = this.locatorFor('button');

  async getTitleText() {
    return (await this.getTitle()).text();
  }

  async clickButton() {
    return (await this.getBtn()).click();
  }
}

// In spec:
const card = await loader.getHarness(CardHarness);
expect(await card.getTitleText()).toBe('My Card');
await card.clickButton();`;
}

// 40. Testing signal effects with fakeAsync
@Component({ selector: 'ex-40', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>Testing signal effects with fakeAsync</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex40 {
  code = `import { fakeAsync, flushMicrotasks } from '@angular/core/testing';

// Component:
class MyComponent {
  query = signal('');
  effect(() => {
    if (this.query()) {
      this.searchService.search(this.query()); // side effect
    }
  });
}

// Spec:
it('should call search when query changes', fakeAsync(() => {
  const searchSpy = spyOn(component['searchService'], 'search');

  component.query.set('angular');
  flushMicrotasks(); // effects are microtasks

  expect(searchSpy).toHaveBeenCalledWith('angular');
}));`;
}

// 41. Testing with marble testing concept
@Component({ selector: 'ex-41', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>Testing with marble testing concept</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex41 {
  code = `import { TestScheduler } from 'rxjs/testing';

describe('debounce search', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should debounce input by 300ms', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const input$  = cold('a-b-c----|', { a: 'a', b: 'ab', c: 'abc' });
      const expected =     '----------(c|)';

      const result$ = input$.pipe(debounceTime(300, scheduler));
      expectObservable(result$).toBe(expected, { c: 'abc' });
    });
  });
});`;
}

// 42. Testing ComponentStore pattern
@Component({ selector: 'ex-42', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>Testing ComponentStore pattern</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex42 {
  code = `// Component with local store:
class TodoStore extends ComponentStore<TodoState> {
  constructor() { super({ todos: [], loading: false }); }

  readonly todos$ = this.select(s => s.todos);
  readonly addTodo = this.updater((state, todo: Todo) => ({
    ...state, todos: [...state.todos, todo]
  }));
}

// Spec:
it('should add todo to store', () => {
  const store = new TodoStore();
  store.addTodo({ id: 1, text: 'Test', done: false });

  store.todos$.subscribe(todos => {
    expect(todos.length).toBe(1);
    expect(todos[0].text).toBe('Test');
  });
});`;
}

// 43. Testing NgRx with provideMockStore
@Component({ selector: 'ex-43', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>Testing NgRx with provideMockStore (code display)</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex43 {
  code = `import { provideMockStore, MockStore } from '@ngrx/store/testing';

describe('ProductsComponent with NgRx', () => {
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProductsComponent],
      providers: [
        provideMockStore({
          initialState: { products: { items: [], loading: false } }
        })
      ]
    });
    store = TestBed.inject(MockStore);
  });

  it('should dispatch loadProducts on init', () => {
    const dispatchSpy = spyOn(store, 'dispatch');
    fixture.detectChanges();
    expect(dispatchSpy).toHaveBeenCalledWith(loadProducts());
  });
});`;
}

// 44. Testing NgRx effects
@Component({ selector: 'ex-44', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>Testing NgRx effects (code display)</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex44 {
  code = `import { provideMockActions } from '@ngrx/effects/testing';
import { ReplaySubject } from 'rxjs';

describe('ProductEffects', () => {
  let actions$ = new ReplaySubject<Action>();
  let effects: ProductEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProductEffects,
        provideMockActions(() => actions$),
        { provide: ProductService, useValue: mockProductService }
      ]
    });
    effects = TestBed.inject(ProductEffects);
  });

  it('should load products on loadProducts action', () => {
    mockProductService.getAll.and.returnValue(of([{id:1}]));
    actions$.next(loadProducts());

    effects.loadProducts$.subscribe(action => {
      expect(action).toEqual(loadProductsSuccess({ products: [{id:1}] }));
    });
  });
});`;
}

// 45. Testing HTTP interceptors
@Component({ selector: 'ex-45', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>Testing HTTP interceptors</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex45 {
  code = `it('should add Authorization header via interceptor', () => {
  // Setup: auth service returns a token
  const authService = TestBed.inject(AuthService);
  spyOnProperty(authService, 'token', 'get').and.returnValue('my-jwt-token');

  // Make HTTP call
  http.get('/api/data').subscribe();

  const req = httpMock.expectOne('/api/data');
  expect(req.request.headers.get('Authorization'))
    .toBe('Bearer my-jwt-token');

  req.flush({ ok: true });
});`;
}

// 46. Testing route guards
@Component({ selector: 'ex-46', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>Testing route guards</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex46 {
  code = `// Functional guard:
const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.createUrlTree(['/login']);
};

// Spec:
it('should return true when logged in', () => {
  TestBed.runInInjectionContext(() => {
    const auth = TestBed.inject(AuthService);
    spyOnProperty(auth, 'isLoggedIn').and.returnValue(signal(true));

    const result = authGuard({} as any, {} as any);
    expect(result).toBeTrue();
  });
});`;
}

// 47. Testing route resolvers
@Component({ selector: 'ex-47', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>Testing route resolvers</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex47 {
  code = `// Functional resolver:
const productResolver: ResolveFn<Product> = (route) => {
  return inject(ProductService).getById(route.params['id']);
};

// Spec:
it('should resolve product by id', (done) => {
  TestBed.runInInjectionContext(() => {
    const service = TestBed.inject(ProductService);
    spyOn(service, 'getById').and.returnValue(of({ id: '5', name: 'Widget' }));

    const mockRoute = { params: { id: '5' } } as any;
    const result$ = productResolver(mockRoute, {} as any) as Observable<Product>;

    result$.subscribe(product => {
      expect(product.name).toBe('Widget');
      done();
    });
  });
});`;
}

// 48. TDD component development pattern
@Component({ selector: 'ex-48', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>TDD component development pattern</strong>
    <div style="display:flex;gap:8px">
      @for(step of steps; track step.n) {
        <div [style]="'flex:1;padding:8px;border-radius:6px;text-align:center;background:' + step.color">
          <div style="font-weight:bold;font-size:13px">{{ step.n }}</div>
          <div style="font-size:11px">{{ step.label }}</div>
          <div style="font-size:10px;opacity:0.9;margin-top:2px">{{ step.desc }}</div>
        </div>
      }
    </div>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px;margin-top:8px">{{ code }}</pre>
  </div>
` })
class Ex48 {
  steps = [
    { n: '1', label: 'RED', desc: 'Write failing test', color: '#fee2e2' },
    { n: '2', label: 'GREEN', desc: 'Minimal code to pass', color: '#dcfce7' },
    { n: '3', label: 'REFACTOR', desc: 'Clean up', color: '#e0e7ff' },
  ];
  code = `// 1. RED — write spec first:
it('should add todo', () => {
  component.newTodo.set('Buy milk');
  component.add();
  expect(component.todos()[0].text).toBe('Buy milk');
});
// → Test fails (component doesn't exist yet)

// 2. GREEN — implement minimum to pass:
newTodo = signal('');
todos = signal<{text:string}[]>([]);
add() { this.todos.update(t => [...t, { text: this.newTodo() }]); }

// 3. REFACTOR — improve without breaking tests`;
}

// 49. Snapshot testing concept
@Component({ selector: 'ex-49', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>Snapshot testing concept</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex49 {
  code = `// Snapshot testing (Jest):
it('should match snapshot', () => {
  fixture.detectChanges();
  expect(fixture.nativeElement.innerHTML).toMatchSnapshot();
  // First run: creates __snapshots__/spec.snap
  // Subsequent runs: compares against saved snapshot
});

// Update snapshot when UI intentionally changes:
// jest --updateSnapshot

// Snapshot pros: catches unintended UI regressions
// Snapshot cons: brittle, needs frequent updates
// Best for: stable UI components (buttons, badges, etc.)

// Alternative — targeted assertions (usually better):
expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Title');`;
}

// 50. Full test suite for a CRUD component
@Component({ selector: 'ex-50', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>Full test suite for a CRUD component</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex50 {
  code = `describe('UserCrudComponent', () => {
  // Setup omitted for brevity...

  describe('Read', () => {
    it('should load users on init');
    it('should show empty state when no users');
    it('should show loading indicator while fetching');
    it('should handle load error gracefully');
  });

  describe('Create', () => {
    it('should open create modal on button click');
    it('should POST new user and refresh list');
    it('should show validation errors on invalid input');
  });

  describe('Update', () => {
    it('should pre-fill edit form with user data');
    it('should PUT updated user on save');
    it('should close modal on cancel');
  });

  describe('Delete', () => {
    it('should show confirm dialog before delete');
    it('should DELETE user on confirm');
    it('should NOT delete on cancel');
    it('should remove user from list after delete');
  });

  describe('Search', () => {
    it('should filter list on search input');
    it('should debounce search by 300ms');
    it('should reset list when search cleared');
  });
});`;
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
      <h1>Examples 6.5 — Angular Testing Patterns</h1>

      <h4>1. TestBed.configureTestingModule structure</h4><ex-01 /><hr />
      <h4>2. ComponentFixture pattern</h4><ex-02 /><hr />
      <h4>3. fixture.detectChanges() — when to call</h4><ex-03 /><hr />
      <h4>4. debugElement.query(By.css()) pattern</h4><ex-04 /><hr />
      <h4>5. nativeElement access pattern</h4><ex-05 /><hr />
      <h4>6. fixture.componentInstance access</h4><ex-06 /><hr />
      <h4>7. Testing a signal value in component</h4><ex-07 /><hr />
      <h4>8. Testing @Input() property</h4><ex-08 /><hr />
      <h4>9. Testing @Output() EventEmitter</h4><ex-09 /><hr />
      <h4>10. Testing button click → method call</h4><ex-10 /><hr />
      <h4>11. Testing template rendering (textContent)</h4><ex-11 /><hr />
      <h4>12. Basic component spec structure</h4><ex-12 /><hr />
      <h4>13. describe/it/expect pattern</h4><ex-13 /><hr />

      <h4>14. HttpClientTestingModule setup</h4><ex-14 /><hr />
      <h4>15. HttpTestingController expectOne</h4><ex-15 /><hr />
      <h4>16. fakeAsync + tick pattern</h4><ex-16 /><hr />
      <h4>17. fakeAsync + flush</h4><ex-17 /><hr />
      <h4>18. waitForAsync pattern</h4><ex-18 /><hr />
      <h4>19. Spy on service method (spyOn)</h4><ex-19 /><hr />
      <h4>20. Mock service with signal</h4><ex-20 /><hr />
      <h4>21. Test async Observable with fakeAsync</h4><ex-21 /><hr />
      <h4>22. Test form validation state</h4><ex-22 /><hr />
      <h4>23. Test component with @Input signal</h4><ex-23 /><hr />
      <h4>24. Test computed signal result</h4><ex-24 /><hr />
      <h4>25. Test effect side effect</h4><ex-25 /><hr />
      <h4>26. Component harness concept</h4><ex-26 /><hr />

      <h4>27. Testing parent-child interaction</h4><ex-27 /><hr />
      <h4>28. Testing @ViewChild in spec</h4><ex-28 /><hr />
      <h4>29. Testing @ContentChild</h4><ex-29 /><hr />
      <h4>30. Testing signal-based component (full)</h4><ex-30 /><hr />
      <h4>31. Testing OnPush component</h4><ex-31 /><hr />
      <h4>32. Testing reactive form submission</h4><ex-32 /><hr />
      <h4>33. Testing template-driven form</h4><ex-33 /><hr />
      <h4>34. Testing HTTP request in component</h4><ex-34 /><hr />
      <h4>35. Testing router navigation</h4><ex-35 /><hr />
      <h4>36. Testing with custom providers</h4><ex-36 /><hr />
      <h4>37. Testing dynamic component creation</h4><ex-37 /><hr />
      <h4>38. Full integration test pattern</h4><ex-38 /><hr />

      <h4>39. Component harness pattern (@angular/cdk/testing)</h4><ex-39 /><hr />
      <h4>40. Testing signal effects with fakeAsync</h4><ex-40 /><hr />
      <h4>41. Testing with marble testing concept</h4><ex-41 /><hr />
      <h4>42. Testing ComponentStore pattern</h4><ex-42 /><hr />
      <h4>43. Testing NgRx with provideMockStore</h4><ex-43 /><hr />
      <h4>44. Testing NgRx effects</h4><ex-44 /><hr />
      <h4>45. Testing HTTP interceptors</h4><ex-45 /><hr />
      <h4>46. Testing route guards</h4><ex-46 /><hr />
      <h4>47. Testing route resolvers</h4><ex-47 /><hr />
      <h4>48. TDD component development pattern</h4><ex-48 /><hr />
      <h4>49. Snapshot testing concept</h4><ex-49 /><hr />
      <h4>50. Full test suite for a CRUD component</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
