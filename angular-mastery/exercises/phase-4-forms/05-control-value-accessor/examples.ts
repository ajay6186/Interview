import {
  Component, signal, computed, forwardRef, HostListener,
  Input, Output, EventEmitter, OnInit, inject, OnDestroy
} from '@angular/core';
import {
  ReactiveFormsModule, FormsModule, FormBuilder, FormControl, FormGroup,
  NG_VALUE_ACCESSOR, ControlValueAccessor, Validators, NgControl, AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { CommonModule } from '@angular/common';

// ============================================================
// Examples 4.5 — ControlValueAccessor (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. Minimal CVA — text input wrapper
@Component({
  selector: 'ex-01', standalone: true, imports: [ReactiveFormsModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex01), multi: true }],
  template: `<input [value]="value" (input)="onInput($event)" (blur)="onTouched()" />`
})
class Ex01 implements ControlValueAccessor {
  value = '';
  onChange = (_: string) => {};
  onTouched = () => {};
  writeValue(v: string) { this.value = v ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  onInput(e: Event) { this.value = (e.target as HTMLInputElement).value; this.onChange(this.value); }
}

// 2. CVA writeValue implementation
@Component({
  selector: 'ex-02', standalone: true, imports: [ReactiveFormsModule, FormsModule, Ex01],
  template: `
    <div>
      <ex-01 [formControl]="ctrl" />
      <button (click)="ctrl.setValue('Hello from writeValue')">Set Value</button>
      <p>{{ ctrl.value }}</p>
    </div>`
})
class Ex02 {
  ctrl = new FormControl('initial');
}

// 3. CVA registerOnChange implementation
@Component({
  selector: 'ex-03-inner', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex03Inner), multi: true }],
  template: `<input [value]="val" (input)="onInput($event)" placeholder="type here" />`
})
class Ex03Inner implements ControlValueAccessor {
  val = '';
  onChange = (_: string) => {};
  onTouched = () => {};
  writeValue(v: string) { this.val = v ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  onInput(e: Event) { this.val = (e.target as HTMLInputElement).value; this.onChange(this.val); }
}

@Component({
  selector: 'ex-03', standalone: true, imports: [ReactiveFormsModule, Ex03Inner],
  template: `
    <div>
      <ex-03-inner [formControl]="ctrl" />
      <p>Parent sees: {{ ctrl.value }}</p>
    </div>`
})
class Ex03 { ctrl = new FormControl(''); }

// 4. CVA registerOnTouched implementation
@Component({
  selector: 'ex-04-inner', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex04Inner), multi: true }],
  template: `<input [value]="val" (input)="onInput($event)" (blur)="onTouched()" placeholder="blur to touch" />`
})
class Ex04Inner implements ControlValueAccessor {
  val = '';
  onChange = (_: string) => {};
  onTouched = () => {};
  writeValue(v: string) { this.val = v ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  onInput(e: Event) { this.val = (e.target as HTMLInputElement).value; this.onChange(this.val); }
}

@Component({
  selector: 'ex-04', standalone: true, imports: [ReactiveFormsModule, Ex04Inner],
  template: `
    <div>
      <ex-04-inner [formControl]="ctrl" />
      <p>Touched: {{ ctrl.touched }}</p>
    </div>`
})
class Ex04 { ctrl = new FormControl(''); }

// 5. CVA setDisabledState implementation
@Component({
  selector: 'ex-05-inner', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex05Inner), multi: true }],
  template: `<input [value]="val" [disabled]="disabled" (input)="onInput($event)" />`
})
class Ex05Inner implements ControlValueAccessor {
  val = ''; disabled = false;
  onChange = (_: string) => {};
  onTouched = () => {};
  writeValue(v: string) { this.val = v ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  setDisabledState(d: boolean) { this.disabled = d; }
  onInput(e: Event) { this.val = (e.target as HTMLInputElement).value; this.onChange(this.val); }
}

@Component({
  selector: 'ex-05', standalone: true, imports: [ReactiveFormsModule, Ex05Inner],
  template: `
    <div>
      <ex-05-inner [formControl]="ctrl" />
      <button (click)="toggle()">Toggle Disabled</button>
      <p>Disabled: {{ ctrl.disabled }}</p>
    </div>`
})
class Ex05 {
  ctrl = new FormControl('hello');
  toggle() { this.ctrl.disabled ? this.ctrl.enable() : this.ctrl.disable(); }
}

// 6. Providing NG_VALUE_ACCESSOR token
@Component({
  selector: 'ex-06-widget', standalone: true,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => Ex06Widget),
    multi: true
  }],
  template: `
    <div style="border:1px solid #888;padding:4px;cursor:pointer" (click)="increment()">
      Count: {{ count }} (click to increment)
    </div>`
})
class Ex06Widget implements ControlValueAccessor {
  count = 0;
  onChange = (_: number) => {};
  onTouched = () => {};
  writeValue(v: number) { this.count = v ?? 0; }
  registerOnChange(fn: (v: number) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  increment() { this.count++; this.onChange(this.count); this.onTouched(); }
}

@Component({
  selector: 'ex-06', standalone: true, imports: [ReactiveFormsModule, Ex06Widget],
  template: `
    <div>
      <ex-06-widget [formControl]="ctrl" />
      <p>FormControl value: {{ ctrl.value }}</p>
    </div>`
})
class Ex06 { ctrl = new FormControl(0); }

// 7. CVA used with FormControl in reactive form
@Component({
  selector: 'ex-07-input', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex07Input), multi: true }],
  template: `<input [value]="val" (input)="emit($event)" (blur)="touch()" style="border:2px solid #4CAF50" />`
})
class Ex07Input implements ControlValueAccessor {
  val = '';
  onChange = (_: string) => {};
  touch = () => {};
  writeValue(v: string) { this.val = v ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.touch = fn; }
  emit(e: Event) { this.val = (e.target as HTMLInputElement).value; this.onChange(this.val); }
}

@Component({
  selector: 'ex-07', standalone: true, imports: [ReactiveFormsModule, Ex07Input],
  template: `
    <form [formGroup]="form">
      <ex-07-input formControlName="name" />
      <p>{{ form.value | json }}</p>
    </form>`
})
class Ex07 {
  fb = new FormBuilder();
  form = this.fb.group({ name: ['World'] });
}

// 8. CVA used with [(ngModel)] in template-driven
@Component({
  selector: 'ex-08-input', standalone: true, imports: [FormsModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex08Input), multi: true }],
  template: `<input [value]="val" (input)="emit($event)" (blur)="touch()" style="border:2px solid #2196F3" />`
})
class Ex08Input implements ControlValueAccessor {
  val = '';
  onChange = (_: string) => {};
  touch = () => {};
  writeValue(v: string) { this.val = v ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.touch = fn; }
  emit(e: Event) { this.val = (e.target as HTMLInputElement).value; this.onChange(this.val); }
}

@Component({
  selector: 'ex-08', standalone: true, imports: [FormsModule, Ex08Input],
  template: `
    <div>
      <ex-08-input [(ngModel)]="name" />
      <p>ngModel value: {{ name }}</p>
    </div>`
})
class Ex08 { name = 'Angular'; }

// 9. CVA for number input
@Component({
  selector: 'ex-09-num', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex09Num), multi: true }],
  template: `<input type="number" [value]="val" (input)="emit($event)" (blur)="touch()" />`
})
class Ex09Num implements ControlValueAccessor {
  val = 0;
  onChange = (_: number) => {};
  touch = () => {};
  writeValue(v: number) { this.val = v ?? 0; }
  registerOnChange(fn: (v: number) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.touch = fn; }
  emit(e: Event) { this.val = +(e.target as HTMLInputElement).value; this.onChange(this.val); }
}

@Component({
  selector: 'ex-09', standalone: true, imports: [ReactiveFormsModule, Ex09Num],
  template: `
    <div>
      <ex-09-num [formControl]="ctrl" />
      <p>Value: {{ ctrl.value }} (type: {{ typeof(ctrl.value) }})</p>
    </div>`
})
class Ex09 {
  ctrl = new FormControl(42);
  typeof(v: unknown) { return typeof v; }
}

// 10. CVA for checkbox wrapper
@Component({
  selector: 'ex-10-check', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex10Check), multi: true }],
  template: `
    <label>
      <input type="checkbox" [checked]="checked" (change)="emit($event)" (blur)="touch()" />
      Custom Checkbox
    </label>`
})
class Ex10Check implements ControlValueAccessor {
  checked = false;
  onChange = (_: boolean) => {};
  touch = () => {};
  writeValue(v: boolean) { this.checked = v ?? false; }
  registerOnChange(fn: (v: boolean) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.touch = fn; }
  emit(e: Event) { this.checked = (e.target as HTMLInputElement).checked; this.onChange(this.checked); }
}

@Component({
  selector: 'ex-10', standalone: true, imports: [ReactiveFormsModule, Ex10Check],
  template: `
    <div>
      <ex-10-check [formControl]="ctrl" />
      <p>Checked: {{ ctrl.value }}</p>
    </div>`
})
class Ex10 { ctrl = new FormControl(false); }

// 11. CVA for select/dropdown wrapper
@Component({
  selector: 'ex-11-select', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex11Select), multi: true }],
  template: `
    <select [value]="val" (change)="emit($event)" (blur)="touch()">
      @for (opt of options; track opt) {
        <option [value]="opt">{{ opt }}</option>
      }
    </select>`
})
class Ex11Select implements ControlValueAccessor {
  val = '';
  options = ['Angular', 'React', 'Vue', 'Svelte'];
  onChange = (_: string) => {};
  touch = () => {};
  writeValue(v: string) { this.val = v ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.touch = fn; }
  emit(e: Event) { this.val = (e.target as HTMLSelectElement).value; this.onChange(this.val); }
}

@Component({
  selector: 'ex-11', standalone: true, imports: [ReactiveFormsModule, Ex11Select],
  template: `
    <div>
      <ex-11-select [formControl]="ctrl" />
      <p>Selected: {{ ctrl.value }}</p>
    </div>`
})
class Ex11 { ctrl = new FormControl('Angular'); }

// 12. CVA for textarea wrapper
@Component({
  selector: 'ex-12-ta', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex12Ta), multi: true }],
  template: `<textarea [value]="val" (input)="emit($event)" (blur)="touch()" rows="3"></textarea>`
})
class Ex12Ta implements ControlValueAccessor {
  val = '';
  onChange = (_: string) => {};
  touch = () => {};
  writeValue(v: string) { this.val = v ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.touch = fn; }
  emit(e: Event) { this.val = (e.target as HTMLTextAreaElement).value; this.onChange(this.val); }
}

@Component({
  selector: 'ex-12', standalone: true, imports: [ReactiveFormsModule, Ex12Ta],
  template: `
    <div>
      <ex-12-ta [formControl]="ctrl" />
      <p>Length: {{ ctrl.value?.length ?? 0 }}</p>
    </div>`
})
class Ex12 { ctrl = new FormControl('Hello World'); }

// 13. CVA that emits null when input cleared
@Component({
  selector: 'ex-13-null', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex13Null), multi: true }],
  template: `<input [value]="val ?? ''" (input)="emit($event)" placeholder="Clear to emit null" />`
})
class Ex13Null implements ControlValueAccessor {
  val: string | null = '';
  onChange = (_: string | null) => {};
  onTouched = () => {};
  writeValue(v: string | null) { this.val = v; }
  registerOnChange(fn: (v: string | null) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  emit(e: Event) {
    const v = (e.target as HTMLInputElement).value;
    this.val = v === '' ? null : v;
    this.onChange(this.val);
  }
}

@Component({
  selector: 'ex-13', standalone: true, imports: [ReactiveFormsModule, Ex13Null],
  template: `
    <div>
      <ex-13-null [formControl]="ctrl" />
      <p>Value: {{ ctrl.value === null ? 'null' : ctrl.value }}</p>
    </div>`
})
class Ex13 { ctrl = new FormControl<string | null>('hello'); }

// ─── INTERMEDIATE (14–26) ───────────────────────────────────

// 14. Star rating CVA (1–5 stars)
@Component({
  selector: 'ex-14-stars', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex14Stars), multi: true }],
  template: `
    <span>
      @for (s of [1,2,3,4,5]; track s) {
        <span (click)="set(s)" [style.color]="s <= rating ? '#FFD700' : '#ccc'" style="cursor:pointer;font-size:24px">★</span>
      }
    </span>`
})
class Ex14Stars implements ControlValueAccessor {
  rating = 0;
  onChange = (_: number) => {};
  onTouched = () => {};
  writeValue(v: number) { this.rating = v ?? 0; }
  registerOnChange(fn: (v: number) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  set(n: number) { this.rating = n; this.onChange(n); this.onTouched(); }
}

@Component({
  selector: 'ex-14', standalone: true, imports: [ReactiveFormsModule, Ex14Stars],
  template: `
    <div>
      <ex-14-stars [formControl]="ctrl" />
      <p>Rating: {{ ctrl.value }} / 5</p>
    </div>`
})
class Ex14 { ctrl = new FormControl(3); }

// 15. Toggle switch CVA
@Component({
  selector: 'ex-15-toggle', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex15Toggle), multi: true }],
  template: `
    <div (click)="toggle()"
      style="display:inline-block;width:50px;height:26px;border-radius:13px;cursor:pointer;position:relative"
      [style.background]="on ? '#4CAF50' : '#ccc'">
      <span style="position:absolute;top:3px;width:20px;height:20px;border-radius:50%;background:white;transition:left 0.2s"
        [style.left]="on ? '27px' : '3px'"></span>
    </div>`
})
class Ex15Toggle implements ControlValueAccessor {
  on = false;
  onChange = (_: boolean) => {};
  onTouched = () => {};
  writeValue(v: boolean) { this.on = v ?? false; }
  registerOnChange(fn: (v: boolean) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  toggle() { this.on = !this.on; this.onChange(this.on); this.onTouched(); }
}

@Component({
  selector: 'ex-15', standalone: true, imports: [ReactiveFormsModule, Ex15Toggle],
  template: `
    <div>
      <ex-15-toggle [formControl]="ctrl" />
      <p>Toggle: {{ ctrl.value }}</p>
    </div>`
})
class Ex15 { ctrl = new FormControl(false); }

// 16. Range slider CVA
@Component({
  selector: 'ex-16-range', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex16Range), multi: true }],
  template: `
    <input type="range" min="0" max="100" [value]="val"
      (input)="emit($event)" (change)="touch()" style="width:200px" />`
})
class Ex16Range implements ControlValueAccessor {
  val = 50;
  onChange = (_: number) => {};
  touch = () => {};
  writeValue(v: number) { this.val = v ?? 50; }
  registerOnChange(fn: (v: number) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.touch = fn; }
  emit(e: Event) { this.val = +(e.target as HTMLInputElement).value; this.onChange(this.val); }
}

@Component({
  selector: 'ex-16', standalone: true, imports: [ReactiveFormsModule, Ex16Range],
  template: `
    <div>
      <ex-16-range [formControl]="ctrl" />
      <p>Value: {{ ctrl.value }}</p>
    </div>`
})
class Ex16 { ctrl = new FormControl(50); }

// 17. Color picker CVA
@Component({
  selector: 'ex-17-color', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex17Color), multi: true }],
  template: `
    <div style="display:flex;align-items:center;gap:8px">
      <input type="color" [value]="val" (input)="emit($event)" />
      <span [style.background]="val" style="width:30px;height:30px;border-radius:4px;border:1px solid #ccc"></span>
    </div>`
})
class Ex17Color implements ControlValueAccessor {
  val = '#ff0000';
  onChange = (_: string) => {};
  onTouched = () => {};
  writeValue(v: string) { this.val = v ?? '#000000'; }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  emit(e: Event) { this.val = (e.target as HTMLInputElement).value; this.onChange(this.val); }
}

@Component({
  selector: 'ex-17', standalone: true, imports: [ReactiveFormsModule, Ex17Color],
  template: `
    <div>
      <ex-17-color [formControl]="ctrl" />
      <p>Color: {{ ctrl.value }}</p>
    </div>`
})
class Ex17 { ctrl = new FormControl('#3f51b5'); }

// 18. Tag/chip input CVA (type + Enter to add)
@Component({
  selector: 'ex-18-tags', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex18Tags), multi: true }],
  template: `
    <div style="border:1px solid #ccc;padding:4px;display:flex;flex-wrap:wrap;gap:4px">
      @for (tag of tags; track tag) {
        <span style="background:#e3f2fd;padding:2px 6px;border-radius:12px;font-size:12px">
          {{ tag }} <button (click)="remove(tag)" style="border:none;background:none;cursor:pointer">×</button>
        </span>
      }
      <input #inp placeholder="Type + Enter" (keydown.enter)="add(inp.value); inp.value=''"
        style="border:none;outline:none;min-width:80px" />
    </div>`
})
class Ex18Tags implements ControlValueAccessor {
  tags: string[] = [];
  onChange = (_: string[]) => {};
  onTouched = () => {};
  writeValue(v: string[]) { this.tags = v ?? []; }
  registerOnChange(fn: (v: string[]) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  add(v: string) { if (v.trim()) { this.tags = [...this.tags, v.trim()]; this.onChange(this.tags); } }
  remove(t: string) { this.tags = this.tags.filter(x => x !== t); this.onChange(this.tags); }
}

@Component({
  selector: 'ex-18', standalone: true, imports: [ReactiveFormsModule, Ex18Tags],
  template: `
    <div>
      <ex-18-tags [formControl]="ctrl" />
      <p>Tags: {{ ctrl.value | json }}</p>
    </div>`
})
class Ex18 { ctrl = new FormControl<string[]>(['angular', 'rxjs']); }

// 19. Phone number formatter CVA (xxx-xxx-xxxx)
@Component({
  selector: 'ex-19-phone', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex19Phone), multi: true }],
  template: `<input [value]="display" (input)="emit($event)" placeholder="555-123-4567" maxlength="12" />`
})
class Ex19Phone implements ControlValueAccessor {
  display = '';
  onChange = (_: string) => {};
  onTouched = () => {};
  writeValue(v: string) { this.display = v ? this.format(v) : ''; }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  format(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 10);
    if (d.length >= 7) return `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`;
    if (d.length >= 4) return `${d.slice(0,3)}-${d.slice(3)}`;
    return d;
  }
  emit(e: Event) {
    const raw = (e.target as HTMLInputElement).value;
    this.display = this.format(raw);
    (e.target as HTMLInputElement).value = this.display;
    this.onChange(this.display);
  }
}

@Component({
  selector: 'ex-19', standalone: true, imports: [ReactiveFormsModule, Ex19Phone],
  template: `
    <div>
      <ex-19-phone [formControl]="ctrl" />
      <p>Value: {{ ctrl.value }}</p>
    </div>`
})
class Ex19 { ctrl = new FormControl(''); }

// 20. Date-only string CVA (YYYY-MM-DD)
@Component({
  selector: 'ex-20-date', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex20Date), multi: true }],
  template: `<input type="date" [value]="val" (change)="emit($event)" (blur)="touch()" />`
})
class Ex20Date implements ControlValueAccessor {
  val = '';
  onChange = (_: string) => {};
  touch = () => {};
  writeValue(v: string) { this.val = v ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.touch = fn; }
  emit(e: Event) { this.val = (e.target as HTMLInputElement).value; this.onChange(this.val); }
}

@Component({
  selector: 'ex-20', standalone: true, imports: [ReactiveFormsModule, Ex20Date],
  template: `
    <div>
      <ex-20-date [formControl]="ctrl" />
      <p>Date string: {{ ctrl.value }}</p>
    </div>`
})
class Ex20 { ctrl = new FormControl('2026-01-15'); }

// 21. Currency input CVA (strip $ on edit)
@Component({
  selector: 'ex-21-currency', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex21Currency), multi: true }],
  template: `
    <div style="display:flex;align-items:center">
      <span>$</span>
      <input type="number" step="0.01" [value]="val" (input)="emit($event)" (blur)="touch()" style="width:80px" />
    </div>`
})
class Ex21Currency implements ControlValueAccessor {
  val = 0;
  onChange = (_: number) => {};
  touch = () => {};
  writeValue(v: number) { this.val = v ?? 0; }
  registerOnChange(fn: (v: number) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.touch = fn; }
  emit(e: Event) { this.val = +((e.target as HTMLInputElement).value); this.onChange(this.val); }
}

@Component({
  selector: 'ex-21', standalone: true, imports: [ReactiveFormsModule, Ex21Currency],
  template: `
    <div>
      <ex-21-currency [formControl]="ctrl" />
      <p>Amount: ${{ ctrl.value?.toFixed(2) }}</p>
    </div>`
})
class Ex21 { ctrl = new FormControl(9.99); }

// 22. Percentage input CVA (0-100)
@Component({
  selector: 'ex-22-pct', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex22Pct), multi: true }],
  template: `
    <div style="display:flex;align-items:center;gap:4px">
      <input type="number" min="0" max="100" [value]="val" (input)="emit($event)" style="width:60px" />
      <span>%</span>
    </div>`
})
class Ex22Pct implements ControlValueAccessor {
  val = 0;
  onChange = (_: number) => {};
  onTouched = () => {};
  writeValue(v: number) { this.val = Math.max(0, Math.min(100, v ?? 0)); }
  registerOnChange(fn: (v: number) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  emit(e: Event) {
    const v = Math.max(0, Math.min(100, +(e.target as HTMLInputElement).value));
    this.val = v; this.onChange(v);
  }
}

@Component({
  selector: 'ex-22', standalone: true, imports: [ReactiveFormsModule, Ex22Pct],
  template: `
    <div>
      <ex-22-pct [formControl]="ctrl" />
      <p>Percentage: {{ ctrl.value }}%</p>
    </div>`
})
class Ex22 { ctrl = new FormControl(75); }

// 23. Password strength CVA
@Component({
  selector: 'ex-23-pw', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex23Pw), multi: true }],
  template: `
    <div>
      <input type="password" [value]="val" (input)="emit($event)" placeholder="Password" />
      <div style="margin-top:4px">
        @for (s of strengthBars(); track $index) {
          <span [style.background]="s" style="display:inline-block;width:30px;height:6px;margin-right:2px;border-radius:3px"></span>
        }
        <span style="font-size:12px;margin-left:4px">{{ strengthLabel() }}</span>
      </div>
    </div>`
})
class Ex23Pw implements ControlValueAccessor {
  val = '';
  onChange = (_: string) => {};
  onTouched = () => {};
  writeValue(v: string) { this.val = v ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  emit(e: Event) { this.val = (e.target as HTMLInputElement).value; this.onChange(this.val); }
  strength() {
    let s = 0;
    if (this.val.length >= 8) s++;
    if (/[A-Z]/.test(this.val)) s++;
    if (/[0-9]/.test(this.val)) s++;
    if (/[^A-Za-z0-9]/.test(this.val)) s++;
    return s;
  }
  strengthBars() {
    const s = this.strength();
    const colors = ['#f44336', '#FF9800', '#FFC107', '#4CAF50'];
    return [1,2,3,4].map(i => i <= s ? colors[s - 1] : '#e0e0e0');
  }
  strengthLabel() { return ['', 'Weak', 'Fair', 'Good', 'Strong'][this.strength()]; }
}

@Component({
  selector: 'ex-23', standalone: true, imports: [ReactiveFormsModule, Ex23Pw],
  template: `
    <div>
      <ex-23-pw [formControl]="ctrl" />
      <p>Has value: {{ !!ctrl.value }}</p>
    </div>`
})
class Ex23 { ctrl = new FormControl(''); }

// 24. CVA emitting null for empty value
@Component({
  selector: 'ex-24-nullable', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex24Nullable), multi: true }],
  template: `<input [value]="val ?? ''" (input)="emit($event)" placeholder="Empty = null" />`
})
class Ex24Nullable implements ControlValueAccessor {
  val: string | null = null;
  onChange = (_: string | null) => {};
  onTouched = () => {};
  writeValue(v: string | null) { this.val = v; }
  registerOnChange(fn: (v: string | null) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  emit(e: Event) {
    const v = (e.target as HTMLInputElement).value;
    this.val = v.trim() === '' ? null : v;
    this.onChange(this.val);
  }
}

@Component({
  selector: 'ex-24', standalone: true, imports: [ReactiveFormsModule, Ex24Nullable],
  template: `
    <div>
      <ex-24-nullable [formControl]="ctrl" />
      <p>Is null: {{ ctrl.value === null }}</p>
    </div>`
})
class Ex24 { ctrl = new FormControl<string | null>(null); }

// 25. CVA forwarding validation state
@Component({
  selector: 'ex-25-validated', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex25Validated), multi: true }],
  template: `
    <div>
      <input [value]="val" (input)="emit($event)" (blur)="touch()"
        [style.border]="isInvalid ? '2px solid red' : '2px solid #ccc'" />
      @if (isInvalid) { <small style="color:red">Required</small> }
    </div>`
})
class Ex25Validated implements ControlValueAccessor {
  val = '';
  isInvalid = false;
  onChange = (_: string) => {};
  touch = () => {};
  writeValue(v: string) { this.val = v ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) {
    this.touch = () => { fn(); this.isInvalid = !this.val; };
  }
  emit(e: Event) { this.val = (e.target as HTMLInputElement).value; this.onChange(this.val); this.isInvalid = !this.val; }
}

@Component({
  selector: 'ex-25', standalone: true, imports: [ReactiveFormsModule, Ex25Validated],
  template: `
    <div>
      <ex-25-validated [formControl]="ctrl" />
      <p>Valid: {{ ctrl.valid }}</p>
    </div>`
})
class Ex25 { ctrl = new FormControl('', Validators.required); }

// 26. CVA with inject(NgControl) for self-validation
@Component({
  selector: 'ex-26-self-val', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex26SelfVal), multi: true }],
  template: `
    <div>
      <input [value]="val" (input)="emit($event)" (blur)="touch()"
        [style.border]="hasError ? '2px solid red' : '2px solid green'" />
      @if (hasError) { <small style="color:red">{{ errorMsg }}</small> }
    </div>`
})
class Ex26SelfVal implements ControlValueAccessor, OnInit {
  val = ''; hasError = false; errorMsg = '';
  onChange = (_: string) => {};
  touch = () => {};
  writeValue(v: string) { this.val = v ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.touch = fn; }
  emit(e: Event) {
    this.val = (e.target as HTMLInputElement).value;
    this.onChange(this.val);
    this.checkErrors();
  }
  checkErrors() {
    this.hasError = this.val.length > 0 && this.val.length < 3;
    this.errorMsg = this.hasError ? 'Min 3 characters' : '';
  }
  ngOnInit() { this.checkErrors(); }
}

@Component({
  selector: 'ex-26', standalone: true, imports: [ReactiveFormsModule, Ex26SelfVal],
  template: `
    <div>
      <ex-26-self-val [formControl]="ctrl" />
      <p>Value: {{ ctrl.value }}</p>
    </div>`
})
class Ex26 { ctrl = new FormControl('hi'); }

// ─── NESTED (27–38) ─────────────────────────────────────────

// 27. CVA used in nested FormGroup
@Component({
  selector: 'ex-27-inp', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex27Inp), multi: true }],
  template: `<input [value]="v" (input)="e($event)" style="border:1px solid #999" />`
})
class Ex27Inp implements ControlValueAccessor {
  v = '';
  fn = (_: string) => {};
  t = () => {};
  writeValue(x: string) { this.v = x ?? ''; }
  registerOnChange(f: (v: string) => void) { this.fn = f; }
  registerOnTouched(f: () => void) { this.t = f; }
  e(ev: Event) { this.v = (ev.target as HTMLInputElement).value; this.fn(this.v); }
}

@Component({
  selector: 'ex-27', standalone: true, imports: [ReactiveFormsModule, Ex27Inp],
  template: `
    <form [formGroup]="form">
      <div formGroupName="personal">
        <ex-27-inp formControlName="first" />
        <ex-27-inp formControlName="last" />
      </div>
      <p>{{ form.value | json }}</p>
    </form>`
})
class Ex27 {
  fb = new FormBuilder();
  form = this.fb.group({
    personal: this.fb.group({ first: ['Alice'], last: ['Smith'] })
  });
}

// 28. CVA used inside FormArray row
@Component({
  selector: 'ex-28-inp', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex28Inp), multi: true }],
  template: `<input [value]="v" (input)="e($event)" style="border:2px solid #4CAF50;border-radius:4px" />`
})
class Ex28Inp implements ControlValueAccessor {
  v = '';
  fn = (_: string) => {};
  t = () => {};
  writeValue(x: string) { this.v = x ?? ''; }
  registerOnChange(f: (v: string) => void) { this.fn = f; }
  registerOnTouched(f: () => void) { this.t = f; }
  e(ev: Event) { this.v = (ev.target as HTMLInputElement).value; this.fn(this.v); }
}

@Component({
  selector: 'ex-28', standalone: true, imports: [ReactiveFormsModule, Ex28Inp],
  template: `
    <div [formGroup]="form">
      <div formArrayName="names">
        @for (c of names.controls; track $index) {
          <ex-28-inp [formControlName]="$index" />
        }
      </div>
      <button (click)="add()">+</button>
      <p>{{ names.value | json }}</p>
    </div>`
})
class Ex28 {
  fb = new FormBuilder();
  form = this.fb.group({ names: this.fb.array(['Alice', 'Bob']) });
  get names() { return this.form.get('names') as any; }
  add() { this.names.push(new FormControl('')); }
}

// 29. CVA wrapping multiple inputs (name: {first, last})
@Component({
  selector: 'ex-29-name', standalone: true, imports: [ReactiveFormsModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex29Name), multi: true }],
  template: `
    <div [formGroup]="inner">
      <input formControlName="first" placeholder="First" />
      <input formControlName="last" placeholder="Last" />
    </div>`
})
class Ex29Name implements ControlValueAccessor, OnInit {
  fb = new FormBuilder();
  inner = this.fb.group({ first: [''], last: [''] });
  onChange = (_: { first: string; last: string }) => {};
  onTouched = () => {};
  writeValue(v: { first: string; last: string }) { if (v) this.inner.setValue(v, { emitEvent: false }); }
  registerOnChange(fn: (v: { first: string; last: string }) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  ngOnInit() { this.inner.valueChanges.subscribe(v => this.onChange(v as { first: string; last: string })); }
}

@Component({
  selector: 'ex-29', standalone: true, imports: [ReactiveFormsModule, Ex29Name],
  template: `
    <div>
      <ex-29-name [formControl]="ctrl" />
      <p>{{ ctrl.value | json }}</p>
    </div>`
})
class Ex29 { ctrl = new FormControl({ first: 'John', last: 'Doe' }); }

// 30. CVA for address ({street, city, zip})
@Component({
  selector: 'ex-30-addr', standalone: true, imports: [ReactiveFormsModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex30Addr), multi: true }],
  template: `
    <div [formGroup]="inner" style="display:flex;flex-direction:column;gap:4px">
      <input formControlName="street" placeholder="Street" />
      <input formControlName="city" placeholder="City" />
      <input formControlName="zip" placeholder="ZIP" />
    </div>`
})
class Ex30Addr implements ControlValueAccessor, OnInit {
  fb = new FormBuilder();
  inner = this.fb.group({ street: [''], city: [''], zip: [''] });
  onChange = (_: any) => {};
  onTouched = () => {};
  writeValue(v: any) { if (v) this.inner.setValue(v, { emitEvent: false }); }
  registerOnChange(fn: (v: any) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  ngOnInit() { this.inner.valueChanges.subscribe(v => this.onChange(v)); }
}

@Component({
  selector: 'ex-30', standalone: true, imports: [ReactiveFormsModule, Ex30Addr],
  template: `
    <div>
      <ex-30-addr [formControl]="ctrl" />
      <p>{{ ctrl.value | json }}</p>
    </div>`
})
class Ex30 { ctrl = new FormControl({ street: '123 Main', city: 'Springfield', zip: '12345' }); }

// 31. CVA for date range ({start: string, end: string})
@Component({
  selector: 'ex-31-range', standalone: true, imports: [ReactiveFormsModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex31Range), multi: true }],
  template: `
    <div [formGroup]="inner" style="display:flex;gap:8px;align-items:center">
      <input type="date" formControlName="start" />
      <span>to</span>
      <input type="date" formControlName="end" />
    </div>`
})
class Ex31Range implements ControlValueAccessor, OnInit {
  fb = new FormBuilder();
  inner = this.fb.group({ start: [''], end: [''] });
  onChange = (_: any) => {};
  onTouched = () => {};
  writeValue(v: any) { if (v) this.inner.setValue(v, { emitEvent: false }); }
  registerOnChange(fn: (v: any) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  ngOnInit() { this.inner.valueChanges.subscribe(v => this.onChange(v)); }
}

@Component({
  selector: 'ex-31', standalone: true, imports: [ReactiveFormsModule, Ex31Range],
  template: `
    <div>
      <ex-31-range [formControl]="ctrl" />
      <p>{{ ctrl.value | json }}</p>
    </div>`
})
class Ex31 { ctrl = new FormControl({ start: '2026-01-01', end: '2026-12-31' }); }

// 32. CVA that contains child CVA
@Component({
  selector: 'ex-32-inner', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex32Inner), multi: true }],
  template: `<input type="number" [value]="v" (input)="e($event)" style="width:60px" />`
})
class Ex32Inner implements ControlValueAccessor {
  v = 0;
  fn = (_: number) => {};
  t = () => {};
  writeValue(x: number) { this.v = x ?? 0; }
  registerOnChange(f: (v: number) => void) { this.fn = f; }
  registerOnTouched(f: () => void) { this.t = f; }
  e(ev: Event) { this.v = +(ev.target as HTMLInputElement).value; this.fn(this.v); }
}

@Component({
  selector: 'ex-32-outer', standalone: true, imports: [ReactiveFormsModule, Ex32Inner],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex32Outer), multi: true }],
  template: `
    <div style="border:1px solid #ccc;padding:4px">
      <ex-32-inner [formControl]="innerCtrl" />
      <span> × 2 = {{ innerCtrl.value * 2 }}</span>
    </div>`
})
class Ex32Outer implements ControlValueAccessor {
  innerCtrl = new FormControl(0);
  onChange = (_: number) => {};
  onTouched = () => {};
  writeValue(v: number) { this.innerCtrl.setValue(v ?? 0, { emitEvent: false }); }
  registerOnChange(fn: (v: number) => void) {
    this.onChange = fn;
    this.innerCtrl.valueChanges.subscribe(v => fn(v ?? 0));
  }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
}

@Component({
  selector: 'ex-32', standalone: true, imports: [ReactiveFormsModule, Ex32Outer],
  template: `
    <div>
      <ex-32-outer [formControl]="ctrl" />
      <p>FormControl: {{ ctrl.value }}</p>
    </div>`
})
class Ex32 { ctrl = new FormControl(5); }

// 33. CVA with async validation forwarding
@Component({
  selector: 'ex-33-async', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex33Async), multi: true }],
  template: `
    <div>
      <input [value]="val" (input)="emit($event)" placeholder="Type username" />
      @if (checking()) { <span style="color:#999">Checking...</span> }
      @if (taken()) { <span style="color:red">Username taken</span> }
      @if (!checking() && !taken() && val) { <span style="color:green">Available</span> }
    </div>`
})
class Ex33Async implements ControlValueAccessor {
  val = '';
  checking = signal(false);
  taken = signal(false);
  onChange = (_: string) => {};
  onTouched = () => {};
  writeValue(v: string) { this.val = v ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  emit(e: Event) {
    this.val = (e.target as HTMLInputElement).value;
    this.onChange(this.val);
    this.simulate();
  }
  simulate() {
    this.checking.set(true); this.taken.set(false);
    setTimeout(() => {
      this.checking.set(false);
      this.taken.set(['admin', 'root', 'user'].includes(this.val));
    }, 600);
  }
}

@Component({
  selector: 'ex-33', standalone: true, imports: [ReactiveFormsModule, Ex33Async],
  template: `
    <div>
      <ex-33-async [formControl]="ctrl" />
      <p>Value: {{ ctrl.value }}</p>
    </div>`
})
class Ex33 { ctrl = new FormControl(''); }

// 34. Multiple CVAs in one form
@Component({
  selector: 'ex-34-txt', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex34Txt), multi: true }],
  template: `<input [value]="v" (input)="f((($event.target as HTMLInputElement).value))" style="border:1px solid #999" />`
})
class Ex34Txt implements ControlValueAccessor {
  v = '';
  f = (_: string) => {};
  t = () => {};
  writeValue(x: string) { this.v = x ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.f = fn; }
  registerOnTouched(fn: () => void) { this.t = fn; }
}

@Component({
  selector: 'ex-34-num', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex34Num), multi: true }],
  template: `<input type="number" [value]="v" (input)="f(+(($event.target as HTMLInputElement).value))" style="width:70px;border:1px solid #999" />`
})
class Ex34Num implements ControlValueAccessor {
  v = 0;
  f = (_: number) => {};
  t = () => {};
  writeValue(x: number) { this.v = x ?? 0; }
  registerOnChange(fn: (v: number) => void) { this.f = fn; }
  registerOnTouched(fn: () => void) { this.t = fn; }
}

@Component({
  selector: 'ex-34', standalone: true, imports: [ReactiveFormsModule, Ex34Txt, Ex34Num],
  template: `
    <form [formGroup]="form">
      <ex-34-txt formControlName="name" />
      <ex-34-num formControlName="age" />
      <p>{{ form.value | json }}</p>
    </form>`
})
class Ex34 {
  fb = new FormBuilder();
  form = this.fb.group({ name: ['Alice'], age: [30] });
}

// 35. CVA inside a dialog/modal form
@Component({
  selector: 'ex-35-modal-input', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex35ModalInput), multi: true }],
  template: `
    <div style="border:2px solid #3f51b5;padding:4px;border-radius:4px">
      <input [value]="v" (input)="f((($event.target as HTMLInputElement).value))" placeholder="Modal input" />
    </div>`
})
class Ex35ModalInput implements ControlValueAccessor {
  v = '';
  f = (_: string) => {};
  t = () => {};
  writeValue(x: string) { this.v = x ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.f = fn; }
  registerOnTouched(fn: () => void) { this.t = fn; }
}

@Component({
  selector: 'ex-35', standalone: true, imports: [ReactiveFormsModule, Ex35ModalInput],
  template: `
    <div>
      <button (click)="open.set(true)">Open Modal</button>
      @if (open()) {
        <div style="position:fixed;inset:0;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;z-index:10">
          <div style="background:white;padding:20px;border-radius:8px;min-width:250px">
            <h4 style="margin:0 0 12px">Edit Name</h4>
            <ex-35-modal-input [formControl]="ctrl" />
            <div style="margin-top:12px;display:flex;gap:8px">
              <button (click)="open.set(false)">Close</button>
            </div>
          </div>
        </div>
      }
      <p>Value: {{ ctrl.value }}</p>
    </div>`
})
class Ex35 {
  open = signal(false);
  ctrl = new FormControl('John Doe');
}

// 36. CVA used in template-driven nested ngModelGroup
@Component({
  selector: 'ex-36-inp', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex36Inp), multi: true }],
  template: `<input [value]="v" (input)="f((($event.target as HTMLInputElement).value))" style="border:1px solid #ccc" />`
})
class Ex36Inp implements ControlValueAccessor {
  v = '';
  f = (_: string) => {};
  t = () => {};
  writeValue(x: string) { this.v = x ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.f = fn; }
  registerOnTouched(fn: () => void) { this.t = fn; }
}

@Component({
  selector: 'ex-36', standalone: true, imports: [FormsModule, Ex36Inp],
  template: `
    <form #f="ngForm">
      <div ngModelGroup="address">
        <ex-36-inp name="city" ngModel />
        <ex-36-inp name="zip" ngModel />
      </div>
      <p>{{ f.value | json }}</p>
    </form>`
})
class Ex36 {}

// 37. CVA with reactive form and cross-field validation
@Component({
  selector: 'ex-37-range', standalone: true, imports: [ReactiveFormsModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex37Range), multi: true }],
  template: `
    <div [formGroup]="inner" style="display:flex;gap:8px">
      <input type="number" formControlName="min" placeholder="Min" style="width:60px" />
      <input type="number" formControlName="max" placeholder="Max" style="width:60px" />
      @if (inner.errors?.['invalidRange']) { <span style="color:red">Max must be ≥ Min</span> }
    </div>`
})
class Ex37Range implements ControlValueAccessor, OnInit {
  fb = new FormBuilder();
  inner = this.fb.group({ min: [0], max: [100] }, {
    validators: (g: AbstractControl): ValidationErrors | null => {
      const { min, max } = g.value;
      return +max < +min ? { invalidRange: true } : null;
    }
  });
  onChange = (_: any) => {};
  onTouched = () => {};
  writeValue(v: any) { if (v) this.inner.setValue(v, { emitEvent: false }); }
  registerOnChange(fn: (v: any) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  ngOnInit() { this.inner.valueChanges.subscribe(v => this.onChange(v)); }
}

@Component({
  selector: 'ex-37', standalone: true, imports: [ReactiveFormsModule, Ex37Range],
  template: `
    <div>
      <ex-37-range [formControl]="ctrl" />
      <p>{{ ctrl.value | json }}</p>
    </div>`
})
class Ex37 { ctrl = new FormControl({ min: 10, max: 50 }); }

// 38. CVA library pattern (multiple custom controls in one file)
@Component({
  selector: 'ex-38-email', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex38Email), multi: true }],
  template: `
    <div>
      <input type="email" [value]="v" (input)="f((($event.target as HTMLInputElement).value))" placeholder="Email" />
      @if (v && !valid()) { <small style="color:red">Invalid email</small> }
    </div>`
})
class Ex38Email implements ControlValueAccessor {
  v = '';
  f = (_: string) => {};
  t = () => {};
  writeValue(x: string) { this.v = x ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.f = (v) => { this.v = v; fn(v); }; }
  registerOnTouched(fn: () => void) { this.t = fn; }
  valid() { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.v); }
}

@Component({
  selector: 'ex-38-url', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex38Url), multi: true }],
  template: `
    <div>
      <input type="url" [value]="v" (input)="f((($event.target as HTMLInputElement).value))" placeholder="https://..." />
      @if (v && !valid()) { <small style="color:red">Invalid URL</small> }
    </div>`
})
class Ex38Url implements ControlValueAccessor {
  v = '';
  f = (_: string) => {};
  t = () => {};
  writeValue(x: string) { this.v = x ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.f = (v) => { this.v = v; fn(v); }; }
  registerOnTouched(fn: () => void) { this.t = fn; }
  valid() { try { new URL(this.v); return true; } catch { return false; } }
}

@Component({
  selector: 'ex-38', standalone: true, imports: [ReactiveFormsModule, Ex38Email, Ex38Url],
  template: `
    <form [formGroup]="form">
      <ex-38-email formControlName="email" />
      <ex-38-url formControlName="website" />
      <p>{{ form.value | json }}</p>
    </form>`
})
class Ex38 {
  fb = new FormBuilder();
  form = this.fb.group({ email: ['test@test.com'], website: ['https://angular.dev'] });
}

// ─── ADVANCED (39–50) ────────────────────────────────────────

// 39. CVA using inject(ControlContainer) — no NG_VALUE_ACCESSOR
@Component({
  selector: 'ex-39', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div>
      <p>Pattern: inject(ControlContainer) binds directly to parent form</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex39 {
  code = `@Component({ selector: 'my-field', ... })
class MyField {
  private cc = inject(ControlContainer);
  // Access parent form:
  get ctrl() {
    return (this.cc.control as FormGroup).get('myField');
  }
}`;
}

// 40. CVA with signal internal state
@Component({
  selector: 'ex-40-sig', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex40Sig), multi: true }],
  template: `
    <div>
      <input [value]="internalVal()" (input)="update($event)" style="border:2px solid #9c27b0" />
      <span style="color:#666;font-size:12px"> chars: {{ internalVal().length }}</span>
    </div>`
})
class Ex40Sig implements ControlValueAccessor {
  internalVal = signal('');
  onChange = (_: string) => {};
  onTouched = () => {};
  writeValue(v: string) { this.internalVal.set(v ?? ''); }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  update(e: Event) {
    const v = (e.target as HTMLInputElement).value;
    this.internalVal.set(v);
    this.onChange(v);
  }
}

@Component({
  selector: 'ex-40', standalone: true, imports: [ReactiveFormsModule, Ex40Sig],
  template: `
    <div>
      <ex-40-sig [formControl]="ctrl" />
      <p>{{ ctrl.value }}</p>
    </div>`
})
class Ex40 { ctrl = new FormControl('signal-powered'); }

// 41. CVA with HostListener keyboard navigation
@Component({
  selector: 'ex-41-kbd', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex41Kbd), multi: true }],
  template: `
    <div tabindex="0" style="border:1px solid #ccc;padding:8px;cursor:pointer;outline:none"
      [style.background]="focused() ? '#e3f2fd' : 'white'">
      Value: {{ val() }} (focus + ↑/↓ to change)
    </div>`
})
class Ex41Kbd implements ControlValueAccessor {
  val = signal(0);
  focused = signal(false);
  onChange = (_: number) => {};
  onTouched = () => {};
  writeValue(v: number) { this.val.set(v ?? 0); }
  registerOnChange(fn: (v: number) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  @HostListener('focus') onFocus() { this.focused.set(true); }
  @HostListener('blur') onBlur() { this.focused.set(false); this.onTouched(); }
  @HostListener('keydown.arrowup') inc() { this.val.update(v => v + 1); this.onChange(this.val()); }
  @HostListener('keydown.arrowdown') dec() { this.val.update(v => v - 1); this.onChange(this.val()); }
}

@Component({
  selector: 'ex-41', standalone: true, imports: [ReactiveFormsModule, Ex41Kbd],
  template: `
    <div>
      <ex-41-kbd [formControl]="ctrl" />
      <p>Value: {{ ctrl.value }}</p>
    </div>`
})
class Ex41 { ctrl = new FormControl(5); }

// 42. CVA with ARIA accessibility attributes
@Component({
  selector: 'ex-42-aria', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex42Aria), multi: true }],
  template: `
    <div role="spinbutton" [attr.aria-valuenow]="val()" aria-valuemin="0" aria-valuemax="100"
      tabindex="0" style="display:inline-flex;align-items:center;gap:8px;border:1px solid #ccc;padding:4px 8px"
      (keydown.arrowup)="change(1)" (keydown.arrowdown)="change(-1)">
      <button (click)="change(-1)" aria-label="Decrease">−</button>
      <span [attr.aria-label]="'Current value: ' + val()">{{ val() }}</span>
      <button (click)="change(1)" aria-label="Increase">+</button>
    </div>`
})
class Ex42Aria implements ControlValueAccessor {
  val = signal(0);
  onChange = (_: number) => {};
  onTouched = () => {};
  writeValue(v: number) { this.val.set(v ?? 0); }
  registerOnChange(fn: (v: number) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  change(delta: number) {
    const next = Math.max(0, Math.min(100, this.val() + delta));
    this.val.set(next); this.onChange(next); this.onTouched();
  }
}

@Component({
  selector: 'ex-42', standalone: true, imports: [ReactiveFormsModule, Ex42Aria],
  template: `
    <div>
      <ex-42-aria [formControl]="ctrl" />
      <p>Value: {{ ctrl.value }}</p>
    </div>`
})
class Ex42 { ctrl = new FormControl(42); }

// 43. CVA generic typed value<T>
@Component({
  selector: 'ex-43-json', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex43Json), multi: true }],
  template: `
    <div>
      <textarea [value]="display()" (input)="parse($event)" rows="3" style="width:100%;font-family:monospace;font-size:12px"></textarea>
      @if (parseError()) { <small style="color:red">{{ parseError() }}</small> }
    </div>`
})
class Ex43Json implements ControlValueAccessor {
  raw = signal('{}');
  parseError = signal('');
  onChange = (_: unknown) => {};
  onTouched = () => {};
  writeValue(v: unknown) { this.raw.set(JSON.stringify(v, null, 2)); }
  registerOnChange(fn: (v: unknown) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  display() { return this.raw(); }
  parse(e: Event) {
    const text = (e.target as HTMLTextAreaElement).value;
    this.raw.set(text);
    try { this.onChange(JSON.parse(text)); this.parseError.set(''); }
    catch { this.parseError.set('Invalid JSON'); }
  }
}

@Component({
  selector: 'ex-43', standalone: true, imports: [ReactiveFormsModule, Ex43Json],
  template: `
    <div>
      <ex-43-json [formControl]="ctrl" />
      <p>Keys: {{ ctrl.value ? Object.keys(ctrl.value).join(', ') : '—' }}</p>
    </div>`
})
class Ex43 {
  ctrl = new FormControl<object>({ name: 'Angular', version: 17 });
  Object = Object;
}

// 44. CVA with debounced onChange
@Component({
  selector: 'ex-44-debounced', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex44Debounced), multi: true }],
  template: `
    <div>
      <input [value]="val" (input)="onInput($event)" placeholder="Debounced (300ms)" />
      <span style="color:#666;font-size:12px"> emits after 300ms pause</span>
    </div>`
})
class Ex44Debounced implements ControlValueAccessor {
  val = '';
  onChange = (_: string) => {};
  onTouched = () => {};
  private timer: ReturnType<typeof setTimeout> | null = null;
  writeValue(v: string) { this.val = v ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  onInput(e: Event) {
    this.val = (e.target as HTMLInputElement).value;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.onChange(this.val), 300);
  }
}

@Component({
  selector: 'ex-44', standalone: true, imports: [ReactiveFormsModule, Ex44Debounced],
  template: `
    <div>
      <ex-44-debounced [formControl]="ctrl" />
      <p>FormControl: {{ ctrl.value }}</p>
    </div>`
})
class Ex44 { ctrl = new FormControl(''); }

// 45. CVA with real-time validation display
@Component({
  selector: 'ex-45-live-val', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex45LiveVal), multi: true }],
  template: `
    <div>
      <input [value]="val" (input)="emit($event)" [style.border]="borderColor()" />
      <div style="font-size:12px;margin-top:2px">
        @for (rule of rules; track rule.label) {
          <div [style.color]="rule.pass(val) ? 'green' : 'red'">
            {{ rule.pass(val) ? '✓' : '✗' }} {{ rule.label }}
          </div>
        }
      </div>
    </div>`
})
class Ex45LiveVal implements ControlValueAccessor {
  val = '';
  rules = [
    { label: 'At least 8 characters', pass: (v: string) => v.length >= 8 },
    { label: 'Contains uppercase', pass: (v: string) => /[A-Z]/.test(v) },
    { label: 'Contains number', pass: (v: string) => /[0-9]/.test(v) }
  ];
  onChange = (_: string) => {};
  onTouched = () => {};
  writeValue(v: string) { this.val = v ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  emit(e: Event) { this.val = (e.target as HTMLInputElement).value; this.onChange(this.val); }
  allPass() { return this.rules.every(r => r.pass(this.val)); }
  borderColor() { return this.val ? (this.allPass() ? '2px solid green' : '2px solid red') : '1px solid #ccc'; }
}

@Component({
  selector: 'ex-45', standalone: true, imports: [ReactiveFormsModule, Ex45LiveVal],
  template: `
    <div>
      <ex-45-live-val [formControl]="ctrl" />
    </div>`
})
class Ex45 { ctrl = new FormControl(''); }

// 46. CVA for rich text (contenteditable div)
@Component({
  selector: 'ex-46-rich', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex46Rich), multi: true }],
  template: `
    <div>
      <div style="border:1px solid #ccc;padding:8px;min-height:60px;border-radius:4px"
        contenteditable="true"
        (input)="onInput($event)"
        (blur)="onTouched()"
        [innerHTML]="htmlVal">
      </div>
    </div>`
})
class Ex46Rich implements ControlValueAccessor {
  htmlVal = '';
  onChange = (_: string) => {};
  onTouched = () => {};
  writeValue(v: string) { this.htmlVal = v ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  onInput(e: Event) {
    const html = (e.target as HTMLElement).innerHTML;
    this.onChange(html);
  }
}

@Component({
  selector: 'ex-46', standalone: true, imports: [ReactiveFormsModule, Ex46Rich],
  template: `
    <div>
      <ex-46-rich [formControl]="ctrl" />
      <p>Length: {{ ctrl.value?.length ?? 0 }}</p>
    </div>`
})
class Ex46 { ctrl = new FormControl('<b>Hello</b> World'); }

// 47. CVA with touch/focus ripple feedback
@Component({
  selector: 'ex-47-ripple', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex47Ripple), multi: true }],
  template: `
    <div style="position:relative;display:inline-block">
      <input [value]="val" (input)="emit($event)"
        (focus)="focused.set(true)" (blur)="focused.set(false); onTouched()"
        style="padding:8px 12px;transition:box-shadow 0.2s"
        [style.boxShadow]="focused() ? '0 0 0 3px rgba(63,81,181,0.3)' : 'none'"
        [style.border]="focused() ? '2px solid #3f51b5' : '1px solid #ccc'" />
    </div>`
})
class Ex47Ripple implements ControlValueAccessor {
  val = '';
  focused = signal(false);
  onChange = (_: string) => {};
  onTouched = () => {};
  writeValue(v: string) { this.val = v ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  emit(e: Event) { this.val = (e.target as HTMLInputElement).value; this.onChange(this.val); }
}

@Component({
  selector: 'ex-47', standalone: true, imports: [ReactiveFormsModule, Ex47Ripple],
  template: `
    <div>
      <ex-47-ripple [formControl]="ctrl" />
      <p>{{ ctrl.value }}</p>
    </div>`
})
class Ex47 { ctrl = new FormControl('Focus me!'); }

// 48. CVA with custom error state matcher
@Component({
  selector: 'ex-48-err', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex48Err), multi: true }],
  template: `
    <div>
      <input [value]="val" (input)="emit($event)" (blur)="touch()"
        [style.border]="showError() ? '2px solid red' : '1px solid #ccc'" />
      @if (showError()) {
        <div style="color:red;font-size:12px">{{ errorMsg() }}</div>
      }
    </div>`
})
class Ex48Err implements ControlValueAccessor {
  val = '';
  touched = false;
  onChange = (_: string) => {};
  onTouched = () => {};
  writeValue(v: string) { this.val = v ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  emit(e: Event) { this.val = (e.target as HTMLInputElement).value; this.onChange(this.val); }
  touch() { this.touched = true; this.onTouched(); }
  showError() { return this.touched && this.val.length < 3; }
  errorMsg() { return this.val.length === 0 ? 'Required' : 'Min 3 characters'; }
}

@Component({
  selector: 'ex-48', standalone: true, imports: [ReactiveFormsModule, Ex48Err],
  template: `
    <div>
      <ex-48-err [formControl]="ctrl" />
      <p>Valid: {{ ctrl.value.length >= 3 }}</p>
    </div>`
})
class Ex48 { ctrl = new FormControl('', Validators.minLength(3)); }

// 49. CVA unit test pattern
@Component({
  selector: 'ex-49', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">CVA Unit Test Pattern</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:11px;overflow-x:auto">{{ code }}</pre>
    </div>`
})
class Ex49 {
  code = `// test file: my-input.component.spec.ts
describe('MyInputCVA', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let ctrl: FormControl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, MyInput, TestHostComponent]
    });
    fixture = TestBed.createComponent(TestHostComponent);
    ctrl = fixture.componentInstance.ctrl;
  });

  it('writeValue — updates display', () => {
    ctrl.setValue('hello');
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input');
    expect(input.value).toBe('hello');
  });

  it('user input — updates FormControl', () => {
    const input = fixture.nativeElement.querySelector('input');
    input.value = 'world';
    input.dispatchEvent(new Event('input'));
    expect(ctrl.value).toBe('world');
  });

  it('setDisabledState — disables input', () => {
    ctrl.disable();
    fixture.detectChanges();
    expect(input.disabled).toBeTrue();
  });
});`;
}

// 50. Full custom form control library (3 CVA controls + form using them)
@Component({
  selector: 'ex-50-text-field', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex50TextField), multi: true }],
  template: `
    <div style="margin-bottom:8px">
      <label style="display:block;font-size:12px;color:#666;margin-bottom:2px">{{ label }}</label>
      <input [value]="val" (input)="emit($event)" (blur)="touch()"
        [placeholder]="placeholder" [disabled]="disabled"
        style="width:100%;padding:6px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box"
        [style.border]="touched && !val ? '1px solid red' : '1px solid #ccc'" />
      @if (touched && !val) { <small style="color:red">Required</small> }
    </div>`
})
class Ex50TextField implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  val = ''; touched = false; disabled = false;
  onChange = (_: string) => {};
  onTouched = () => {};
  writeValue(v: string) { this.val = v ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  setDisabledState(d: boolean) { this.disabled = d; }
  emit(e: Event) { this.val = (e.target as HTMLInputElement).value; this.onChange(this.val); }
  touch() { this.touched = true; this.onTouched(); }
}

@Component({
  selector: 'ex-50-num-field', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex50NumField), multi: true }],
  template: `
    <div style="margin-bottom:8px">
      <label style="display:block;font-size:12px;color:#666;margin-bottom:2px">{{ label }}</label>
      <input type="number" [value]="val" (input)="emit($event)"
        style="width:100%;padding:6px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box" />
    </div>`
})
class Ex50NumField implements ControlValueAccessor {
  @Input() label = '';
  val = 0;
  onChange = (_: number) => {};
  onTouched = () => {};
  writeValue(v: number) { this.val = v ?? 0; }
  registerOnChange(fn: (v: number) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  emit(e: Event) { this.val = +(e.target as HTMLInputElement).value; this.onChange(this.val); }
}

@Component({
  selector: 'ex-50-toggle-field', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ex50ToggleField), multi: true }],
  template: `
    <div style="margin-bottom:8px;display:flex;align-items:center;gap:8px">
      <div (click)="toggle()"
        style="width:44px;height:24px;border-radius:12px;cursor:pointer;position:relative;transition:background 0.2s"
        [style.background]="on ? '#4CAF50' : '#ccc'">
        <span style="position:absolute;top:2px;width:20px;height:20px;border-radius:50%;background:white;transition:left 0.2s"
          [style.left]="on ? '22px' : '2px'"></span>
      </div>
      <label style="font-size:12px;color:#666">{{ label }}</label>
    </div>`
})
class Ex50ToggleField implements ControlValueAccessor {
  @Input() label = '';
  on = false;
  onChange = (_: boolean) => {};
  onTouched = () => {};
  writeValue(v: boolean) { this.on = v ?? false; }
  registerOnChange(fn: (v: boolean) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  toggle() { this.on = !this.on; this.onChange(this.on); this.onTouched(); }
}

@Component({
  selector: 'ex-50', standalone: true,
  imports: [ReactiveFormsModule, Ex50TextField, Ex50NumField, Ex50ToggleField],
  template: `
    <form [formGroup]="form" style="max-width:300px;border:1px solid #ddd;padding:16px;border-radius:8px">
      <h4 style="margin:0 0 12px">User Profile</h4>
      <ex-50-text-field label="Full Name" placeholder="John Doe" formControlName="name" />
      <ex-50-text-field label="Email" placeholder="john@example.com" formControlName="email" />
      <ex-50-num-field label="Age" formControlName="age" />
      <ex-50-toggle-field label="Subscribe to newsletter" formControlName="newsletter" />
      <button (click)="submit()" [disabled]="form.invalid" style="width:100%;padding:8px;background:#3f51b5;color:white;border:none;border-radius:4px;cursor:pointer">
        Submit
      </button>
      <p [style.color]="form.valid ? 'green' : 'red'" style="font-size:12px;margin:8px 0 0">
        {{ form.valid ? 'Form valid' : 'Form invalid' }}
      </p>
    </form>`
})
class Ex50 {
  fb = new FormBuilder();
  form = this.fb.group({
    name: ['Alice Johnson', Validators.required],
    email: ['alice@example.com', [Validators.required, Validators.email]],
    age: [28, [Validators.required, Validators.min(1)]],
    newsletter: [true]
  });
  submit() { alert(JSON.stringify(this.form.value)); }
}

@Component({
  selector: 'app-root', standalone: true,
  imports: [
    Ex01, Ex02, Ex03, Ex04, Ex05, Ex06, Ex07, Ex08, Ex09, Ex10,
    Ex11, Ex12, Ex13, Ex14, Ex15, Ex16, Ex17, Ex18, Ex19, Ex20,
    Ex21, Ex22, Ex23, Ex24, Ex25, Ex26, Ex27, Ex28, Ex29, Ex30,
    Ex31, Ex32, Ex33, Ex34, Ex35, Ex36, Ex37, Ex38, Ex39, Ex40,
    Ex41, Ex42, Ex43, Ex44, Ex45, Ex46, Ex47, Ex48, Ex49, Ex50
  ],
  template: `
    <div style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:20px">
      <h1>Examples 4.5 — ControlValueAccessor</h1>
      <h4>1. Minimal CVA — text input wrapper</h4><ex-01 /><hr />
      <h4>2. CVA writeValue implementation</h4><ex-02 /><hr />
      <h4>3. CVA registerOnChange implementation</h4><ex-03 /><hr />
      <h4>4. CVA registerOnTouched implementation</h4><ex-04 /><hr />
      <h4>5. CVA setDisabledState implementation</h4><ex-05 /><hr />
      <h4>6. Providing NG_VALUE_ACCESSOR token</h4><ex-06 /><hr />
      <h4>7. CVA used with FormControl in reactive form</h4><ex-07 /><hr />
      <h4>8. CVA used with [(ngModel)] in template-driven</h4><ex-08 /><hr />
      <h4>9. CVA for number input</h4><ex-09 /><hr />
      <h4>10. CVA for checkbox wrapper</h4><ex-10 /><hr />
      <h4>11. CVA for select/dropdown wrapper</h4><ex-11 /><hr />
      <h4>12. CVA for textarea wrapper</h4><ex-12 /><hr />
      <h4>13. CVA that emits null when input cleared</h4><ex-13 /><hr />
      <h4>14. Star rating CVA (1–5 stars)</h4><ex-14 /><hr />
      <h4>15. Toggle switch CVA</h4><ex-15 /><hr />
      <h4>16. Range slider CVA</h4><ex-16 /><hr />
      <h4>17. Color picker CVA (input[type=color])</h4><ex-17 /><hr />
      <h4>18. Tag/chip input CVA (type + Enter to add)</h4><ex-18 /><hr />
      <h4>19. Phone number formatter CVA (xxx-xxx-xxxx)</h4><ex-19 /><hr />
      <h4>20. Date-only string CVA (YYYY-MM-DD)</h4><ex-20 /><hr />
      <h4>21. Currency input CVA (strip $ on edit)</h4><ex-21 /><hr />
      <h4>22. Percentage input CVA (0-100)</h4><ex-22 /><hr />
      <h4>23. Password strength CVA</h4><ex-23 /><hr />
      <h4>24. CVA emitting null for empty value</h4><ex-24 /><hr />
      <h4>25. CVA forwarding validation state</h4><ex-25 /><hr />
      <h4>26. CVA with inject(NgControl) for self-validation</h4><ex-26 /><hr />
      <h4>27. CVA used in nested FormGroup</h4><ex-27 /><hr />
      <h4>28. CVA used inside FormArray row</h4><ex-28 /><hr />
      <h4>29. CVA wrapping multiple inputs (name: {first, last})</h4><ex-29 /><hr />
      <h4>30. CVA for address ({street, city, zip})</h4><ex-30 /><hr />
      <h4>31. CVA for date range ({start: string, end: string})</h4><ex-31 /><hr />
      <h4>32. CVA that contains child CVA</h4><ex-32 /><hr />
      <h4>33. CVA with async validation forwarding</h4><ex-33 /><hr />
      <h4>34. Multiple CVAs in one form</h4><ex-34 /><hr />
      <h4>35. CVA inside a dialog/modal form</h4><ex-35 /><hr />
      <h4>36. CVA used in template-driven nested ngModelGroup</h4><ex-36 /><hr />
      <h4>37. CVA with reactive form and cross-field validation</h4><ex-37 /><hr />
      <h4>38. CVA library pattern (multiple custom controls in one file)</h4><ex-38 /><hr />
      <h4>39. CVA using inject(ControlContainer) — no NG_VALUE_ACCESSOR</h4><ex-39 /><hr />
      <h4>40. CVA with signal internal state</h4><ex-40 /><hr />
      <h4>41. CVA with HostListener keyboard navigation</h4><ex-41 /><hr />
      <h4>42. CVA with ARIA accessibility attributes</h4><ex-42 /><hr />
      <h4>43. CVA generic typed value&lt;T&gt;</h4><ex-43 /><hr />
      <h4>44. CVA with debounced onChange</h4><ex-44 /><hr />
      <h4>45. CVA with real-time validation display</h4><ex-45 /><hr />
      <h4>46. CVA for rich text (contenteditable div)</h4><ex-46 /><hr />
      <h4>47. CVA with touch/focus ripple feedback</h4><ex-47 /><hr />
      <h4>48. CVA with custom error state matcher</h4><ex-48 /><hr />
      <h4>49. CVA unit test pattern</h4><ex-49 /><hr />
      <h4>50. Full custom form control library (3 CVA controls + form using them)</h4><ex-50 /><hr />
    </div>`
})
export class AppComponent {}
