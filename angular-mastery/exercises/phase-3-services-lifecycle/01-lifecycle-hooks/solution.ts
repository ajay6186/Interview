import { Component, Input, OnInit, OnChanges, OnDestroy, AfterViewInit,
         DoCheck, SimpleChanges, ViewChild, ElementRef, DestroyRef,
         ChangeDetectionStrategy, inject, Injectable } from '@angular/core';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// ============================================================
// Solution 3.1 — Lifecycle Hooks
// ============================================================

// Mock service for OnInit demo
@Injectable({ providedIn: 'root' })
class MockDataService {
  loadData(): string[] {
    return ['Item A', 'Item B', 'Item C'];
  }
}

// SOLUTION 1: ngOnInit
@Component({
  selector: 'app-on-init',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>ngOnInit — Data Loaded on Init</h3>
      <ul>
        @for (item of data; track item) {
          <li>{{ item }}</li>
        }
      </ul>
    </section>
  `,
})
class OnInitComponent implements OnInit {
  private dataService = inject(MockDataService);
  data: string[] = [];

  ngOnInit() {
    this.data = this.dataService.loadData();
  }
}

// SOLUTION 2: ngOnChanges
@Component({
  selector: 'app-on-changes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>ngOnChanges — Input Tracking</h3>
      <p>Current: <strong>{{ currName }}</strong></p>
      <p>Previous: <em>{{ prevName || '(none)' }}</em></p>
    </section>
  `,
})
class OnChangesComponent implements OnChanges {
  @Input() name: string = '';
  prevName = '';
  currName = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['name']) {
      this.prevName = changes['name'].previousValue ?? '';
      this.currName = changes['name'].currentValue;
    }
  }
}

// Host wrapper to drive OnChangesComponent
@Component({
  selector: 'app-on-changes-host',
  standalone: true,
  imports: [OnChangesComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>ngOnChanges Demo</h3>
      <button (click)="cycle()">Cycle Name</button>
      <app-on-changes [name]="names[idx]" />
    </section>
  `,
})
class OnChangesHostComponent {
  names = ['Alice', 'Bob', 'Carol'];
  idx = 0;
  cycle() { this.idx = (this.idx + 1) % this.names.length; }
}

// SOLUTION 3: takeUntilDestroyed
@Component({
  selector: 'app-on-destroy',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>ngOnDestroy — Auto-Unsubscribe</h3>
      <p>Tick: <strong>{{ tick }}</strong></p>
      <p><em>Unsubscribes automatically on destroy via takeUntilDestroyed.</em></p>
    </section>
  `,
})
class OnDestroyComponent {
  tick = 0;
  private destroyRef = inject(DestroyRef);

  constructor() {
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(n => (this.tick = n));
  }
}

// SOLUTION 4: ngAfterViewInit
@Component({
  selector: 'app-after-view-init',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>ngAfterViewInit — Auto-Focus</h3>
      <label>Focused on mount: <input #myInput placeholder="type here..." /></label>
    </section>
  `,
})
class AfterViewInitComponent implements AfterViewInit {
  @ViewChild('myInput') myInput!: ElementRef<HTMLInputElement>;

  ngAfterViewInit() {
    this.myInput.nativeElement.focus();
  }
}

// SOLUTION 5: ngDoCheck
@Component({
  selector: 'app-do-check',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>ngDoCheck — Mutable Object Detection</h3>
      <p>obj.value = {{ obj.value }}</p>
      <p>Changes detected: {{ changeCount }}</p>
      <button (click)="mutate()">Mutate obj.value</button>
      <p><em>ngDoCheck fires every CD cycle; we detect real changes manually.</em></p>
    </section>
  `,
})
class DoCheckComponent implements DoCheck {
  obj = { value: 0 };
  lastValue = 0;
  changeCount = 0;

  mutate() { this.obj.value++; }

  ngDoCheck() {
    if (this.obj.value !== this.lastValue) {
      this.changeCount++;
      this.lastValue = this.obj.value;
    }
  }
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    OnInitComponent,
    OnChangesHostComponent,
    OnDestroyComponent,
    AfterViewInitComponent,
    DoCheckComponent,
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 3.1 — Lifecycle Hooks</h1>
      <app-on-init />
      <hr />
      <app-on-changes-host />
      <hr />
      <app-on-destroy />
      <hr />
      <app-after-view-init />
      <hr />
      <app-do-check />
    </div>
  `,
})
export class AppComponent {}
