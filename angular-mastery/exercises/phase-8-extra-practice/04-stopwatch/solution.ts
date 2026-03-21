import { Component, Injectable, inject, signal, computed,
         OnDestroy, ChangeDetectionStrategy } from '@angular/core';

// ============================================================
// Solution 8.4 — Stopwatch
// ============================================================

// SOLUTION 1: TimerService
@Injectable({ providedIn: 'root' })
class TimerService implements OnDestroy {
  elapsed   = signal(0);
  isRunning = signal(false);
  laps      = signal<number[]>([]);
  private startTime  = 0;
  private accumulated = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  start() {
    if (this.isRunning()) return;
    this.startTime = Date.now();
    this.isRunning.set(true);
    this.intervalId = setInterval(() => {
      this.elapsed.set(this.accumulated + (Date.now() - this.startTime));
    }, 10);
  }

  stop() {
    if (!this.isRunning()) return;
    this.accumulated = this.elapsed();
    clearInterval(this.intervalId!);
    this.isRunning.set(false);
  }

  reset() {
    this.stop();
    this.accumulated = 0;
    this.elapsed.set(0);
    this.laps.set([]);
  }

  lap() {
    if (this.isRunning()) this.laps.update(l => [...l, this.elapsed()]);
  }

  ngOnDestroy() { if (this.intervalId) clearInterval(this.intervalId); }
}

// Helper
function formatTime(ms: number): string {
  const mins   = Math.floor(ms / 60000);
  const secs   = Math.floor((ms % 60000) / 1000);
  const centis = Math.floor((ms % 1000) / 10);
  return `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}.${String(centis).padStart(2,'0')}`;
}

// SOLUTION 2: Display
@Component({
  selector: 'app-stopwatch-display',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="font-size:3rem;font-family:monospace;letter-spacing:2px;margin:16px 0;">
      {{ formatted() }}
    </div>
  `,
})
class StopwatchDisplayComponent {
  timer     = inject(TimerService);
  formatted = computed(() => formatTime(this.timer.elapsed()));
}

// SOLUTION 3: Controls
@Component({
  selector: 'app-stopwatch-controls',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display:flex;gap:8px;justify-content:center;margin-bottom:16px;">
      <button (click)="toggleStartStop()"
              [style.background]="timer.isRunning() ? '#e74c3c' : '#2ecc71'"
              style="color:#fff;border:none;padding:8px 20px;border-radius:4px;cursor:pointer;font-size:1rem;">
        {{ timer.isRunning() ? 'Stop' : 'Start' }}
      </button>
      <button (click)="timer.reset()" [disabled]="timer.isRunning()"
              style="padding:8px 16px;border-radius:4px;cursor:pointer;">Reset</button>
      <button (click)="timer.lap()" [disabled]="!timer.isRunning()"
              style="padding:8px 16px;border-radius:4px;cursor:pointer;">Lap</button>
    </div>
  `,
})
class ControlsComponent {
  timer = inject(TimerService);
  toggleStartStop() { this.timer.isRunning() ? this.timer.stop() : this.timer.start(); }
}

// SOLUTION 4: Lap list
@Component({
  selector: 'app-lap-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      @for (lap of lapsWithDelta(); track $index) {
        <div style="display:flex;justify-content:space-between;padding:4px 8px;border-bottom:1px solid #eee;font-family:monospace;">
          <span>Lap {{ $index + 1 }}</span>
          <span>{{ lap.time }}</span>
          <span style="color:#666">+{{ lap.delta }}</span>
        </div>
      }
    </div>
  `,
})
class LapListComponent {
  timer = inject(TimerService);
  lapsWithDelta = computed(() => {
    const laps = this.timer.laps();
    return laps.map((ms, i) => ({
      time:  formatTime(ms),
      delta: formatTime(i === 0 ? ms : ms - laps[i - 1]),
    }));
  });
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [StopwatchDisplayComponent, ControlsComponent, LapListComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; text-align: center;">
      <h1>Stopwatch</h1>
      <app-stopwatch-display />
      <app-stopwatch-controls />
      <app-lap-list />
    </div>
  `,
})
export class AppComponent {}
