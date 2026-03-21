import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormArray, FormControl, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// ============================================================
// Solution 4.4 — FormArray
// ============================================================

// SOLUTION 1: FormArray of strings (tags)
@Component({
  selector: 'app-tags-array',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Tags (FormArray of strings)</h3>
      <input #tagInput placeholder="New tag..." />
      <button (click)="addTag(tagInput.value); tagInput.value=''">Add Tag</button>
      @for (ctrl of tags.controls; track $index) {
        <div>
          <input [formControl]="asCtrl(ctrl)" />
          <button (click)="tags.removeAt($index)">×</button>
        </div>
      }
      <p>Tags: {{ tags.value.join(', ') }}</p>
    </section>
  `,
})
class TagsArrayComponent {
  tags = new FormArray<FormControl<string>>([]);
  addTag(val: string) { if (val.trim()) this.tags.push(new FormControl(val.trim()) as FormControl<string>); }
  asCtrl(c: AbstractControl) { return c as FormControl; }
}

// SOLUTION 2: FormArray of FormGroups (phones)
@Component({
  selector: 'app-phone-numbers',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Phone Numbers (FormArray of FormGroups)</h3>
      <form [formGroup]="form">
        <div formArrayName="phones">
          @for (phone of phones.controls; track $index) {
            <div [formGroupName]="$index" style="display:flex;gap:8px;margin-bottom:4px;">
              <select formControlName="type">
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="mobile">Mobile</option>
              </select>
              <input formControlName="number" placeholder="Number" />
              <button type="button" (click)="phones.removeAt($index)">×</button>
            </div>
          }
        </div>
      </form>
      <button (click)="addPhone()">+ Add Phone</button>
    </section>
  `,
})
class PhoneNumbersComponent {
  form  = new FormGroup({ phones: new FormArray<FormGroup>([]) });
  get phones() { return this.form.controls.phones; }
  addPhone() {
    this.phones.push(new FormGroup({
      type:   new FormControl('mobile'),
      number: new FormControl(''),
    }));
  }
}

// SOLUTION 3: Dynamic questions
@Component({
  selector: 'app-dynamic-questions',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Dynamic Questions</h3>
      <div formArrayName="questions" [formGroup]="form">
        @for (q of questions.controls; track $index) {
          <div [formGroupName]="$index" style="border:1px solid #ddd;padding:8px;margin-bottom:8px;border-radius:4px;">
            <input formControlName="question" placeholder="Question text" />&nbsp;
            <select formControlName="type">
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="boolean">Yes/No</option>
            </select>&nbsp;
            @switch (q.get('type')?.value) {
              @case ('number')  { <input type="number" formControlName="answer" /> }
              @case ('boolean') { <select formControlName="answer"><option value="yes">Yes</option><option value="no">No</option></select> }
              @default          { <input formControlName="answer" placeholder="Answer" /> }
            }
            <button (click)="questions.removeAt($index)" style="margin-left:4px">×</button>
          </div>
        }
      </div>
      <button (click)="addQuestion()">+ Add Question</button>
    </section>
  `,
})
class DynamicQuestionsComponent {
  form = new FormGroup({ questions: new FormArray<FormGroup>([]) });
  get questions() { return this.form.controls['questions'] as FormArray; }
  addQuestion() {
    this.questions.push(new FormGroup({
      question: new FormControl('', Validators.required),
      type:     new FormControl('text'),
      answer:   new FormControl(''),
    }));
  }
}

// SOLUTION 4: Order items with computed total
@Component({
  selector: 'app-order-items',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Order Items (computed total)</h3>
      <div [formGroup]="form">
        <div formArrayName="items">
          @for (item of items.controls; track $index) {
            <div [formGroupName]="$index" style="display:flex;gap:8px;margin-bottom:4px;">
              <input formControlName="name" placeholder="Item" />
              <input formControlName="quantity" type="number" style="width:60px" />
              <input formControlName="price" type="number" style="width:80px" />
              <button type="button" (click)="items.removeAt($index)">×</button>
            </div>
          }
        </div>
      </div>
      <button (click)="addItem()">+ Add Item</button>
      <p><strong>Total: ${{ total() }}</strong></p>
    </section>
  `,
})
class OrderItemsComponent {
  form  = new FormGroup({ items: new FormArray<FormGroup>([]) });
  total = signal('0.00');
  get items() { return this.form.controls['items'] as FormArray; }

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      const t = (this.items.value as { quantity: number; price: number }[])
        .reduce((s, i) => s + (i.quantity || 0) * (i.price || 0), 0);
      this.total.set(t.toFixed(2));
    });
  }

  addItem() {
    this.items.push(new FormGroup({
      name:     new FormControl(''),
      quantity: new FormControl(1),
      price:    new FormControl(0),
    }));
  }
}

// SOLUTION 5: Nested FormArrays
@Component({
  selector: 'app-nested-form-array',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Nested FormArrays</h3>
      <div [formGroup]="form">
        <div formArrayName="categories">
          @for (cat of categories.controls; track $index) {
            <div [formGroupName]="$index" style="border:1px solid #ccc;padding:8px;margin-bottom:8px;border-radius:4px;">
              <input formControlName="name" placeholder="Category name" />&nbsp;
              <button type="button" (click)="categories.removeAt($index)">Remove Category</button>
              <div formArrayName="items" style="margin-top:8px;margin-left:16px;">
                @for (item of getItems($index).controls; track $index) {
                  <div style="display:flex;gap:4px;margin-bottom:4px;">
                    <input [formControlName]="$index" placeholder="Item" />
                    <button type="button" (click)="getItems($index).removeAt($index)">×</button>
                  </div>
                }
                <button type="button" (click)="addItem($index)">+ Item</button>
              </div>
            </div>
          }
        </div>
      </div>
      <button (click)="addCategory()">+ Add Category</button>
    </section>
  `,
})
class NestedFormArrayComponent {
  form = new FormGroup({ categories: new FormArray<FormGroup>([]) });
  get categories() { return this.form.controls['categories'] as FormArray; }
  getItems(i: number) { return (this.categories.at(i) as FormGroup).controls['items'] as FormArray; }
  addCategory() {
    this.categories.push(new FormGroup({ name: new FormControl(''), items: new FormArray([]) }));
  }
  addItem(catIdx: number) { this.getItems(catIdx).push(new FormControl('')); }
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TagsArrayComponent, PhoneNumbersComponent, DynamicQuestionsComponent,
            OrderItemsComponent, NestedFormArrayComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 4.4 — FormArray</h1>
      <app-tags-array /><hr />
      <app-phone-numbers /><hr />
      <app-dynamic-questions /><hr />
      <app-order-items /><hr />
      <app-nested-form-array />
    </div>
  `,
})
export class AppComponent {}
