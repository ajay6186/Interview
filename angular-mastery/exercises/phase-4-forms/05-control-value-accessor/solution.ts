import { Component, forwardRef, signal, ChangeDetectionStrategy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule,
         FormGroup, FormControl, Validators } from '@angular/forms';
import { JsonPipe } from '@angular/common';

// ============================================================
// Solution 4.5 — ControlValueAccessor
// ============================================================

// SOLUTION 1: StarRatingComponent
@Component({
  selector: 'app-star-rating',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StarRatingComponent), multi: true }],
  template: `
    <span>
      @for (star of stars; track star) {
        <span (click)="select(star)" style="cursor:pointer;font-size:1.5rem;color:gold;">
          {{ star <= (value() ?? 0) ? '★' : '☆' }}
        </span>
      }
    </span>
  `,
})
class StarRatingComponent implements ControlValueAccessor {
  stars   = [1, 2, 3, 4, 5];
  value   = signal<number>(0);
  private onChange  = (_: number) => {};
  private onTouched = () => {};

  select(star: number) { this.value.set(star); this.onChange(star); this.onTouched(); }
  writeValue(val: number)     { this.value.set(val ?? 0); }
  registerOnChange(fn: (_: number) => void)  { this.onChange = fn; }
  registerOnTouched(fn: () => void)          { this.onTouched = fn; }
}

// SOLUTION 2: PhoneInputComponent
@Component({
  selector: 'app-phone-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhoneInputComponent), multi: true }],
  template: `<input [value]="display()" (input)="onInput($event)" (blur)="onTouched()" placeholder="(555) 555-5555" />`,
})
class PhoneInputComponent implements ControlValueAccessor {
  display  = signal('');
  onTouched = () => {};
  private onChange = (_: string) => {};

  format(digits: string): string {
    const d = digits.replace(/\D/g, '').slice(0, 10);
    if (d.length < 4)  return d;
    if (d.length < 7)  return `(${d.slice(0,3)}) ${d.slice(3)}`;
    return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
  }

  onInput(e: Event) {
    const raw = (e.target as HTMLInputElement).value;
    const formatted = this.format(raw);
    this.display.set(formatted);
    this.onChange(formatted);
  }

  writeValue(val: string) { this.display.set(val ? this.format(val) : ''); }
  registerOnChange(fn: (_: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void)         { this.onTouched = fn; }
}

// SOLUTION 3: ColorPickerComponent
@Component({
  selector: 'app-color-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ColorPickerComponent), multi: true }],
  template: `
    <span>
      @for (color of palette; track color) {
        <span (click)="pick(color)"
              [style.background]="color"
              [style.outline]="selected() === color ? '3px solid #333' : 'none'"
              style="display:inline-block;width:28px;height:28px;border-radius:50%;margin:2px;cursor:pointer;">
        </span>
      }
      <span style="margin-left:8px">{{ selected() }}</span>
    </span>
  `,
})
class ColorPickerComponent implements ControlValueAccessor {
  palette  = ['#e74c3c','#e67e22','#2ecc71','#3498db','#9b59b6','#1abc9c'];
  selected = signal('#3498db');
  private onChange  = (_: string) => {};
  private onTouched = () => {};

  pick(color: string) { this.selected.set(color); this.onChange(color); this.onTouched(); }
  writeValue(val: string)               { this.selected.set(val ?? '#3498db'); }
  registerOnChange(fn: (_: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void)         { this.onTouched = fn; }
}

// SOLUTION 4: ChipInputComponent
@Component({
  selector: 'app-chip-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ChipInputComponent), multi: true }],
  template: `
    <div style="display:flex;flex-wrap:wrap;gap:4px;border:1px solid #ccc;padding:4px;border-radius:4px;">
      @for (chip of chips(); track chip) {
        <span style="background:#3498db;color:#fff;padding:2px 8px;border-radius:12px;font-size:0.85rem;">
          {{ chip }} <span (click)="remove(chip)" style="cursor:pointer;margin-left:4px;">×</span>
        </span>
      }
      <input #inp placeholder="Type + Enter" (keydown.enter)="add(inp.value); inp.value=''"
             style="border:none;outline:none;min-width:100px;" />
    </div>
  `,
})
class ChipInputComponent implements ControlValueAccessor {
  chips    = signal<string[]>([]);
  private onChange  = (_: string[]) => {};
  private onTouched = () => {};

  add(val: string)    { if (val.trim()) { this.chips.update(c => [...c, val.trim()]); this.emit(); } }
  remove(chip: string){ this.chips.update(c => c.filter(x => x !== chip)); this.emit(); }
  private emit()      { this.onChange(this.chips()); this.onTouched(); }

  writeValue(val: string[])                  { this.chips.set(val ?? []); }
  registerOnChange(fn: (_: string[]) => void){ this.onChange = fn; }
  registerOnTouched(fn: () => void)          { this.onTouched = fn; }
}

// SOLUTION 5: DateRangeComponent
@Component({
  selector: 'app-date-range',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DateRangeComponent), multi: true }],
  template: `
    <div style="display:flex;gap:8px;align-items:center;">
      <label>Start: <input type="date" [value]="range().start" (change)="onStart($event)" /></label>
      <label>End:   <input type="date" [value]="range().end"   (change)="onEnd($event)" /></label>
      @if (range().start && range().end && range().end < range().start) {
        <span style="color:red">End must be after start</span>
      }
    </div>
  `,
})
class DateRangeComponent implements ControlValueAccessor {
  range     = signal({ start: '', end: '' });
  private onChange  = (_: { start: string; end: string }) => {};
  private onTouched = () => {};

  onStart(e: Event) { this.range.update(r => ({ ...r, start: (e.target as HTMLInputElement).value })); this.emit(); }
  onEnd(e: Event)   { this.range.update(r => ({ ...r, end:   (e.target as HTMLInputElement).value })); this.emit(); }
  private emit()    { this.onChange(this.range()); this.onTouched(); }

  writeValue(val: { start: string; end: string })     { this.range.set(val ?? { start: '', end: '' }); }
  registerOnChange(fn: (_: { start: string; end: string }) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void)                                  { this.onTouched = fn; }
}

// Demo wrapper
@Component({
  selector: 'app-cva-demo',
  standalone: true,
  imports: [ReactiveFormsModule, JsonPipe, StarRatingComponent, PhoneInputComponent,
            ColorPickerComponent, ChipInputComponent, DateRangeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form">
      <div><h4>Star Rating</h4><app-star-rating formControlName="rating" /></div>
      <div><h4>Phone</h4><app-phone-input formControlName="phone" /></div>
      <div><h4>Color</h4><app-color-picker formControlName="color" /></div>
      <div><h4>Chips</h4><app-chip-input formControlName="tags" /></div>
      <div><h4>Date Range</h4><app-date-range formControlName="dateRange" /></div>
    </form>
    <pre style="background:#f4f4f4;padding:8px;border-radius:4px;margin-top:8px;font-size:12px;">{{ form.value | json }}</pre>
  `,
})
class CvaDemoComponent {
  form = new FormGroup({
    rating:    new FormControl(0),
    phone:     new FormControl(''),
    color:     new FormControl('#3498db'),
    tags:      new FormControl<string[]>([]),
    dateRange: new FormControl({ start: '', end: '' }),
  });
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CvaDemoComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 4.5 — ControlValueAccessor</h1>
      <app-cva-demo />
    </div>
  `,
})
export class AppComponent {}
