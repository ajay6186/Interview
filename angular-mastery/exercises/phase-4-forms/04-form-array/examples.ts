import { Component, signal, computed, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormArray, FormBuilder, FormControl, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';

// ============================================================
// Examples 4.4 — FormArray (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. FormArray of FormControls (tags list)
@Component({
  selector: 'ex-01', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div>
      <div [formGroup]="form">
        <div formArrayName="tags">
          @for (ctrl of tags.controls; track $index) {
            <input [formControlName]="$index" placeholder="tag" />
          }
        </div>
      </div>
      <p>Tags: {{ tags.value | json }}</p>
    </div>`
})
class Ex01 implements OnInit {
  fb = new FormBuilder();
  form = this.fb.group({ tags: this.fb.array(['angular', 'rxjs']) });
  get tags() { return this.form.get('tags') as FormArray; }
  ngOnInit() {}
}

// 2. Add item to FormArray (.push)
@Component({
  selector: 'ex-02', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div>
      <div formArrayName="items" [formGroup]="form">
        @for (c of items.controls; track $index) {
          <input [formControlName]="$index" />
        }
      </div>
      <button (click)="add()">Add</button>
      <p>{{ items.value | json }}</p>
    </div>`
})
class Ex02 {
  fb = new FormBuilder();
  form = this.fb.group({ items: this.fb.array(['item1']) });
  get items() { return this.form.get('items') as FormArray; }
  add() { this.items.push(new FormControl('new item')); }
}

// 3. Remove item (.removeAt)
@Component({
  selector: 'ex-03', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div>
      <div [formGroup]="form" formArrayName="list">
        @for (c of list.controls; track $index) {
          <span>{{ c.value }} <button (click)="remove($index)">x</button> </span>
        }
      </div>
      <p>{{ list.value | json }}</p>
    </div>`
})
class Ex03 {
  fb = new FormBuilder();
  form = this.fb.group({ list: this.fb.array(['A', 'B', 'C']) });
  get list() { return this.form.get('list') as FormArray; }
  remove(i: number) { this.list.removeAt(i); }
}

// 4. FormArray .length
@Component({
  selector: 'ex-04', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div>
      <p>Length: {{ arr.length }}</p>
      <button (click)="arr.push(fc())">Push</button>
      <button (click)="arr.removeAt(arr.length-1)" [disabled]="arr.length===0">Pop</button>
    </div>`
})
class Ex04 {
  fb = new FormBuilder();
  arr = this.fb.array(['x', 'y', 'z']);
  fc() { return new FormControl('new'); }
}

// 5. FormArray .at(index)
@Component({
  selector: 'ex-05', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div>
      <input type="number" #idx placeholder="index" />
      <button (click)="read(+idx.value)">Read</button>
      <p>Value at index: {{ result() }}</p>
    </div>`
})
class Ex05 {
  fb = new FormBuilder();
  arr = this.fb.array(['alpha', 'beta', 'gamma']);
  result = signal('—');
  read(i: number) {
    const ctrl = this.arr.at(i);
    this.result.set(ctrl ? ctrl.value : 'out of range');
  }
}

// 6. FormArray in @for with index
@Component({
  selector: 'ex-06', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="scores">
        @for (c of scores.controls; track $index) {
          <label>Score {{ $index + 1 }}: <input [formControlName]="$index" type="number" /></label>
        }
      </div>
      <p>Values: {{ scores.value | json }}</p>
    </div>`
})
class Ex06 {
  fb = new FormBuilder();
  form = this.fb.group({ scores: this.fb.array([10, 20, 30]) });
  get scores() { return this.form.get('scores') as FormArray; }
}

// 7. FormArray of strings (email list)
@Component({
  selector: 'ex-07', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="emails">
        @for (c of emails.controls; track $index) {
          <input [formControlName]="$index" type="email" placeholder="email" />
        }
      </div>
      <button (click)="add()">+ Email</button>
      <p>{{ emails.value | json }}</p>
    </div>`
})
class Ex07 {
  fb = new FormBuilder();
  form = this.fb.group({ emails: this.fb.array(['a@a.com', 'b@b.com']) });
  get emails() { return this.form.get('emails') as FormArray; }
  add() { this.emails.push(new FormControl('', [Validators.email])); }
}

// 8. FormArray push/removeAt buttons
@Component({
  selector: 'ex-08', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div>
      @for (c of arr.controls; track $index) {
        <span>{{ c.value }}</span>
        <button (click)="arr.removeAt($index)">Remove</button>
      }
      <button (click)="push()">Push</button>
      <p>Length: {{ arr.length }}</p>
    </div>`
})
class Ex08 {
  count = 0;
  arr = new FormArray([new FormControl('item-0')]);
  push() { this.arr.push(new FormControl(`item-${++this.count}`)); }
}

// 9. FormArray setValue(array)
@Component({
  selector: 'ex-09', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="names">
        @for (c of names.controls; track $index) {
          <input [formControlName]="$index" />
        }
      </div>
      <button (click)="setValues()">Set Values</button>
      <p>{{ names.value | json }}</p>
    </div>`
})
class Ex09 {
  fb = new FormBuilder();
  form = this.fb.group({ names: this.fb.array(['', '', '']) });
  get names() { return this.form.get('names') as FormArray; }
  setValues() { this.names.setValue(['Alice', 'Bob', 'Charlie']); }
}

// 10. FormArray reset()
@Component({
  selector: 'ex-10', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="fields">
        @for (c of fields.controls; track $index) {
          <input [formControlName]="$index" placeholder="field" />
        }
      </div>
      <button (click)="reset()">Reset</button>
      <p>{{ fields.value | json }}</p>
    </div>`
})
class Ex10 {
  fb = new FormBuilder();
  form = this.fb.group({ fields: this.fb.array(['one', 'two', 'three']) });
  get fields() { return this.form.get('fields') as FormArray; }
  reset() { this.fields.reset(['', '', '']); }
}

// 11. FormArray with initial values from array
@Component({
  selector: 'ex-11', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="items">
        @for (c of items.controls; track $index) {
          <input [formControlName]="$index" />
        }
      </div>
      <p>{{ items.value | json }}</p>
    </div>`
})
class Ex11 {
  initialData = ['React', 'Angular', 'Vue'];
  fb = new FormBuilder();
  form = this.fb.group({
    items: this.fb.array(this.initialData.map(v => new FormControl(v)))
  });
  get items() { return this.form.get('items') as FormArray; }
}

// 12. FormArray inside a FormGroup
@Component({
  selector: 'ex-12', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <input formControlName="title" placeholder="Title" />
      <div formArrayName="tags">
        @for (c of tags.controls; track $index) {
          <input [formControlName]="$index" placeholder="tag" />
        }
      </div>
      <button (click)="addTag()">+ Tag</button>
      <p>{{ form.value | json }}</p>
    </div>`
})
class Ex12 {
  fb = new FormBuilder();
  form = this.fb.group({
    title: ['My Post'],
    tags: this.fb.array(['tech', 'news'])
  });
  get tags() { return this.form.get('tags') as FormArray; }
  addTag() { this.tags.push(new FormControl('')); }
}

// 13. FormArray required validator (minLength)
@Component({
  selector: 'ex-13', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div>
      <div [formGroup]="form" formArrayName="items">
        @for (c of items.controls; track $index) {
          <input [formControlName]="$index" placeholder="item" />
        }
      </div>
      <button (click)="add()">Add</button>
      <p [style.color]="items.errors ? 'red' : 'green'">
        {{ items.errors ? 'Need at least 2 items' : 'Valid' }}
      </p>
    </div>`
})
class Ex13 {
  fb = new FormBuilder();
  minLengthArray = (min: number) => (c: AbstractControl): ValidationErrors | null =>
    (c as FormArray).length >= min ? null : { minLength: true };
  form = this.fb.group({
    items: this.fb.array([''], [this.minLengthArray(2)])
  });
  get items() { return this.form.get('items') as FormArray; }
  add() { this.items.push(new FormControl('')); }
}

// ─── INTERMEDIATE (14–26) ───────────────────────────────────

// 14. FormArray of FormGroups (name + phone list)
@Component({
  selector: 'ex-14', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="contacts">
        @for (grp of contacts.controls; track $index) {
          <div [formGroupName]="$index" style="display:flex;gap:8px;margin:4px 0">
            <input formControlName="name" placeholder="Name" />
            <input formControlName="phone" placeholder="Phone" />
          </div>
        }
      </div>
      <button (click)="add()">+ Contact</button>
      <p>{{ form.value | json }}</p>
    </div>`
})
class Ex14 {
  fb = new FormBuilder();
  form = this.fb.group({
    contacts: this.fb.array([
      this.fb.group({ name: ['Alice'], phone: ['555-1234'] }),
      this.fb.group({ name: ['Bob'], phone: ['555-5678'] })
    ])
  });
  get contacts() { return this.form.get('contacts') as FormArray; }
  add() { this.contacts.push(this.fb.group({ name: [''], phone: [''] })); }
}

// 15. Add/remove FormGroup rows dynamically
@Component({
  selector: 'ex-15', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="rows">
        @for (grp of rows.controls; track $index) {
          <div [formGroupName]="$index" style="display:flex;gap:8px;margin:4px 0">
            <input formControlName="first" placeholder="First" />
            <input formControlName="last" placeholder="Last" />
            <button (click)="remove($index)">✕</button>
          </div>
        }
      </div>
      <button (click)="add()">+ Row</button>
    </div>`
})
class Ex15 {
  fb = new FormBuilder();
  form = this.fb.group({ rows: this.fb.array([this.newRow()]) });
  get rows() { return this.form.get('rows') as FormArray; }
  newRow() { return this.fb.group({ first: [''], last: [''] }); }
  add() { this.rows.push(this.newRow()); }
  remove(i: number) { this.rows.removeAt(i); }
}

// 16. Per-row validation (each row has Validators.required)
@Component({
  selector: 'ex-16', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="skills">
        @for (grp of skills.controls; track $index) {
          <div [formGroupName]="$index">
            <input formControlName="skill" placeholder="Skill (required)" />
            @if (getSkill($index).invalid && getSkill($index).touched) {
              <span style="color:red">Required</span>
            }
          </div>
        }
      </div>
      <button (click)="add()">+ Skill</button>
    </div>`
})
class Ex16 {
  fb = new FormBuilder();
  form = this.fb.group({
    skills: this.fb.array([this.fb.group({ skill: ['', Validators.required] })])
  });
  get skills() { return this.form.get('skills') as FormArray; }
  getSkill(i: number) { return (this.skills.at(i) as FormGroup).get('skill')!; }
  add() { this.skills.push(this.fb.group({ skill: ['', Validators.required] })); }
}

// 17. Computed total from FormArray number values
@Component({
  selector: 'ex-17', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="amounts">
        @for (c of amounts.controls; track $index) {
          <input [formControlName]="$index" type="number" (input)="updateTotal()" />
        }
      </div>
      <button (click)="add()">+ Amount</button>
      <p><strong>Total: {{ total() }}</strong></p>
    </div>`
})
class Ex17 {
  fb = new FormBuilder();
  form = this.fb.group({ amounts: this.fb.array([10, 20, 30]) });
  get amounts() { return this.form.get('amounts') as FormArray; }
  total = signal(60);
  updateTotal() { this.total.set(this.amounts.value.reduce((s: number, v: number) => s + (+v || 0), 0)); }
  add() { this.amounts.push(new FormControl(0)); }
}

// 18. Dynamic question generator (FormArray of FormControls)
@Component({
  selector: 'ex-18', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div>
      <div [formGroup]="form" formArrayName="answers">
        @for (q of questions; track $index) {
          <div>
            <label>{{ q }}</label>
            <input [formControlName]="$index" />
          </div>
        }
      </div>
      <button (click)="submit()">Submit</button>
      <p>{{ result() }}</p>
    </div>`
})
class Ex18 {
  questions = ['What is Angular?', 'What is RxJS?', 'What is a signal?'];
  fb = new FormBuilder();
  form = this.fb.group({ answers: this.fb.array(this.questions.map(() => '')) });
  get answers() { return this.form.get('answers') as FormArray; }
  result = signal('');
  submit() { this.result.set(JSON.stringify(this.answers.value)); }
}

// 19. Reorder by swapping (removeAt + insert)
@Component({
  selector: 'ex-19', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="list">
        @for (c of list.controls; track $index) {
          <span>{{ c.value }}
            @if ($index > 0) { <button (click)="moveUp($index)">↑</button> }
            @if ($index < list.length - 1) { <button (click)="moveDown($index)">↓</button> }
          </span>
        }
      </div>
    </div>`
})
class Ex19 {
  fb = new FormBuilder();
  form = this.fb.group({ list: this.fb.array(['A', 'B', 'C', 'D']) });
  get list() { return this.form.get('list') as FormArray; }
  moveUp(i: number) { const c = this.list.at(i); this.list.removeAt(i); this.list.insert(i - 1, c); }
  moveDown(i: number) { const c = this.list.at(i); this.list.removeAt(i); this.list.insert(i + 1, c); }
}

// 20. Delete with confirmation signal
@Component({
  selector: 'ex-20', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form" formArrayName="items">
      @for (c of items.controls; track $index) {
        <div>
          {{ c.value }}
          @if (confirmIndex() === $index) {
            <button (click)="confirmDelete($index)">Confirm?</button>
            <button (click)="cancelDelete()">Cancel</button>
          } @else {
            <button (click)="requestDelete($index)">Delete</button>
          }
        </div>
      }
    </div>`
})
class Ex20 {
  fb = new FormBuilder();
  form = this.fb.group({ items: this.fb.array(['Item A', 'Item B', 'Item C']) });
  get items() { return this.form.get('items') as FormArray; }
  confirmIndex = signal<number | null>(null);
  requestDelete(i: number) { this.confirmIndex.set(i); }
  confirmDelete(i: number) { this.items.removeAt(i); this.confirmIndex.set(null); }
  cancelDelete() { this.confirmIndex.set(null); }
}

// 21. FormArray min/max items validator
@Component({
  selector: 'ex-21', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div>
      <div [formGroup]="form" formArrayName="list">
        @for (c of list.controls; track $index) {
          <span>{{ c.value }} <button (click)="remove($index)">x</button></span>
        }
      </div>
      <button (click)="add()">Add</button>
      <p [style.color]="list.errors ? 'red' : 'green'">
        {{ list.errors | json }} Count: {{ list.length }}
      </p>
    </div>`
})
class Ex21 {
  fb = new FormBuilder();
  minMax = (min: number, max: number) => (c: AbstractControl): ValidationErrors | null => {
    const len = (c as FormArray).length;
    if (len < min) return { min: true };
    if (len > max) return { max: true };
    return null;
  };
  form = this.fb.group({ list: this.fb.array(['A', 'B'], [this.minMax(2, 4)]) });
  get list() { return this.form.get('list') as FormArray; }
  add() { this.list.push(new FormControl('item')); }
  remove(i: number) { this.list.removeAt(i); }
}

// 22. FormArray of checkboxes (multi-select)
@Component({
  selector: 'ex-22', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="checks">
        @for (opt of options; track $index) {
          <label>
            <input type="checkbox" [formControlName]="$index" />
            {{ opt }}
          </label>
        }
      </div>
      <p>Selected: {{ selected() | json }}</p>
    </div>`
})
class Ex22 {
  options = ['Angular', 'React', 'Vue', 'Svelte'];
  fb = new FormBuilder();
  form = this.fb.group({ checks: this.fb.array(this.options.map(() => false)) });
  get checks() { return this.form.get('checks') as FormArray; }
  selected() { return this.options.filter((_, i) => this.checks.at(i).value); }
}

// 23. FormArray of radio options
@Component({
  selector: 'ex-23', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div>
      @for (q of questions; track $index) {
        <div>
          <p>{{ q.text }}</p>
          @for (opt of q.options; track opt) {
            <label>
              <input type="radio" [name]="'q'+$index" [value]="opt"
                (change)="setAnswer($index, opt)" />
              {{ opt }}
            </label>
          }
        </div>
      }
      <p>Answers: {{ answers.value | json }}</p>
    </div>`
})
class Ex23 {
  questions = [
    { text: 'Best framework?', options: ['Angular', 'React', 'Vue'] },
    { text: 'Best language?', options: ['TypeScript', 'JavaScript', 'Rust'] }
  ];
  answers = new FormArray(this.questions.map(() => new FormControl('')));
  setAnswer(i: number, v: string) { this.answers.at(i).setValue(v); }
}

// 24. FormArray with @for + track by index
@Component({
  selector: 'ex-24', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="tasks">
        @for (c of tasks.controls; track $index) {
          <div style="display:flex;gap:6px;margin:3px 0">
            <span style="min-width:20px">{{ $index + 1 }}.</span>
            <input [formControlName]="$index" placeholder="Task" />
            <button (click)="remove($index)">✕</button>
          </div>
        }
      </div>
      <button (click)="add()">+ Task</button>
    </div>`
})
class Ex24 {
  fb = new FormBuilder();
  form = this.fb.group({ tasks: this.fb.array(['Buy milk', 'Write code']) });
  get tasks() { return this.form.get('tasks') as FormArray; }
  add() { this.tasks.push(new FormControl('')); }
  remove(i: number) { this.tasks.removeAt(i); }
}

// 25. FormArray getRawValue() including disabled
@Component({
  selector: 'ex-25', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div>
      <div [formGroup]="form" formArrayName="items">
        @for (c of items.controls; track $index) {
          <input [formControlName]="$index" />
        }
      </div>
      <button (click)="toggle()">Toggle disable #1</button>
      <p>value(): {{ items.value | json }}</p>
      <p>getRawValue(): {{ items.getRawValue() | json }}</p>
    </div>`
})
class Ex25 {
  fb = new FormBuilder();
  form = this.fb.group({ items: this.fb.array(['A', 'B', 'C']) });
  get items() { return this.form.get('items') as FormArray; }
  toggle() {
    const ctrl = this.items.at(1);
    ctrl.disabled ? ctrl.enable() : ctrl.disable();
  }
}

// 26. FormArray markAllAsTouched()
@Component({
  selector: 'ex-26', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="fields">
        @for (c of fields.controls; track $index) {
          <div>
            <input [formControlName]="$index" placeholder="Required" />
            @if (fields.at($index).invalid && fields.at($index).touched) {
              <span style="color:red">Required</span>
            }
          </div>
        }
      </div>
      <button (click)="submit()">Submit</button>
    </div>`
})
class Ex26 {
  fb = new FormBuilder();
  form = this.fb.group({
    fields: this.fb.array([
      new FormControl('', Validators.required),
      new FormControl('', Validators.required),
      new FormControl('', Validators.required)
    ])
  });
  get fields() { return this.form.get('fields') as FormArray; }
  submit() { this.fields.markAllAsTouched(); }
}

// ─── NESTED (27–38) ─────────────────────────────────────────

// 27. FormArray inside FormArray (categories → items)
@Component({
  selector: 'ex-27', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="categories">
        @for (cat of categories.controls; track $index) {
          <div [formGroupName]="$index" style="border:1px solid #ccc;padding:8px;margin:4px 0">
            <input formControlName="name" placeholder="Category" />
            <div formArrayName="items">
              @for (item of getItems($index).controls; track $innerIndex) {
                <input [formControlName]="$innerIndex" placeholder="Item" style="margin-left:16px;display:block" />
              }
            </div>
            <button (click)="addItem($index)">+ Item</button>
          </div>
        }
      </div>
      <button (click)="addCategory()">+ Category</button>
    </div>`
})
class Ex27 {
  fb = new FormBuilder();
  form = this.fb.group({
    categories: this.fb.array([
      this.fb.group({ name: ['Electronics'], items: this.fb.array(['Laptop', 'Phone']) }),
      this.fb.group({ name: ['Books'], items: this.fb.array(['Angular Guide']) })
    ])
  });
  get categories() { return this.form.get('categories') as FormArray; }
  getItems(i: number) { return (this.categories.at(i) as FormGroup).get('items') as FormArray; }
  addItem(i: number) { this.getItems(i).push(new FormControl('')); }
  addCategory() {
    this.categories.push(this.fb.group({ name: [''], items: this.fb.array(['']) }));
  }
}

// 28. FormArray of complex objects (address book)
@Component({
  selector: 'ex-28', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="addresses">
        @for (g of addresses.controls; track $index) {
          <div [formGroupName]="$index" style="border:1px solid #ddd;padding:8px;margin:4px 0">
            <input formControlName="street" placeholder="Street" />
            <input formControlName="city" placeholder="City" />
            <input formControlName="zip" placeholder="ZIP" />
            <button (click)="remove($index)">Remove</button>
          </div>
        }
      </div>
      <button (click)="add()">+ Address</button>
    </div>`
})
class Ex28 {
  fb = new FormBuilder();
  form = this.fb.group({
    addresses: this.fb.array([
      this.fb.group({ street: ['123 Main St'], city: ['Springfield'], zip: ['12345'] })
    ])
  });
  get addresses() { return this.form.get('addresses') as FormArray; }
  add() { this.addresses.push(this.fb.group({ street: [''], city: [''], zip: [''] })); }
  remove(i: number) { this.addresses.removeAt(i); }
}

// 29. FormArray with child component per row
@Component({
  selector: 'ex-29-row', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="group" style="display:flex;gap:6px">
      <input formControlName="product" placeholder="Product" />
      <input formControlName="qty" type="number" placeholder="Qty" />
      <button (click)="remove.emit()">✕</button>
    </div>`,
})
class Ex29Row {
  group = new FormGroup({ product: new FormControl(''), qty: new FormControl(1) });
  remove = new (class extends EventTarget {
    listeners: (() => void)[] = [];
    emit() { this.listeners.forEach(l => l()); }
    subscribe(fn: () => void) { this.listeners.push(fn); }
  })();
}

@Component({
  selector: 'ex-29', standalone: true, imports: [ReactiveFormsModule, Ex29Row],
  template: `
    <div>
      @for (row of rows; track $index) {
        <div style="display:flex;gap:6px;margin:3px 0">
          <input [(ngModel)]="row.product" placeholder="Product" />
          <input [(ngModel)]="row.qty" type="number" placeholder="Qty" />
          <button (click)="remove($index)">✕</button>
        </div>
      }
      <button (click)="add()">+ Row</button>
      <p>{{ rows | json }}</p>
    </div>`,
  imports: [ReactiveFormsModule, CommonModule]
})
class Ex29 {
  rows = signal([{ product: 'Widget', qty: 2 }]);
  add() { this.rows.update(r => [...r, { product: '', qty: 1 }]); }
  remove(i: number) { this.rows.update(r => r.filter((_, idx) => idx !== i)); }
}

// 30. FormArray in service (shared across components)
@Component({
  selector: 'ex-30-display', standalone: true, imports: [ReactiveFormsModule],
  template: `<p>Shared items: {{ sharedArr.value | json }}</p>`
})
class Ex30Display {
  sharedArr = new FormArray([new FormControl('shared-A'), new FormControl('shared-B')]);
}

@Component({
  selector: 'ex-30', standalone: true, imports: [ReactiveFormsModule, Ex30Display],
  template: `
    <div>
      <div [formGroup]="form" formArrayName="list">
        @for (c of list.controls; track $index) {
          <input [formControlName]="$index" />
        }
      </div>
      <button (click)="add()">+ Item</button>
      <ex-30-display />
    </div>`
})
class Ex30 {
  fb = new FormBuilder();
  form = this.fb.group({ list: this.fb.array(['shared-A', 'shared-B']) });
  get list() { return this.form.get('list') as FormArray; }
  add() { this.list.push(new FormControl('new')); }
}

// 31. FormArray with signal-based row count display
@Component({
  selector: 'ex-31', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="rows">
        @for (c of rows.controls; track $index) {
          <div style="display:flex;gap:6px">
            <input [formControlName]="$index" />
            <button (click)="remove($index)">✕</button>
          </div>
        }
      </div>
      <button (click)="add()">+ Row</button>
      <p>Row count (signal): {{ rowCount() }}</p>
    </div>`
})
class Ex31 {
  fb = new FormBuilder();
  form = this.fb.group({ rows: this.fb.array(['row1', 'row2']) });
  get rows() { return this.form.get('rows') as FormArray; }
  rowCount = signal(2);
  add() { this.rows.push(new FormControl('')); this.rowCount.set(this.rows.length); }
  remove(i: number) { this.rows.removeAt(i); this.rowCount.set(this.rows.length); }
}

// 32. FormArray of FormGroups with nested FormGroup
@Component({
  selector: 'ex-32', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="employees">
        @for (g of employees.controls; track $index) {
          <div [formGroupName]="$index" style="border:1px solid #ccc;padding:8px;margin:4px 0">
            <input formControlName="name" placeholder="Name" />
            <div formGroupName="address">
              <input formControlName="city" placeholder="City" />
              <input formControlName="country" placeholder="Country" />
            </div>
          </div>
        }
      </div>
      <button (click)="add()">+ Employee</button>
    </div>`
})
class Ex32 {
  fb = new FormBuilder();
  form = this.fb.group({
    employees: this.fb.array([
      this.fb.group({
        name: ['Alice'],
        address: this.fb.group({ city: ['London'], country: ['UK'] })
      })
    ])
  });
  get employees() { return this.form.get('employees') as FormArray; }
  add() {
    this.employees.push(this.fb.group({
      name: [''],
      address: this.fb.group({ city: [''], country: [''] })
    }));
  }
}

// 33. FormArray with auto-generated IDs
@Component({
  selector: 'ex-33', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="entries">
        @for (g of entries.controls; track $index) {
          <div [formGroupName]="$index">
            <span style="color:#666">ID: {{ getGroup($index).get('id')?.value }}</span>
            <input formControlName="label" placeholder="Label" />
            <button (click)="remove($index)">✕</button>
          </div>
        }
      </div>
      <button (click)="add()">+ Entry</button>
    </div>`
})
class Ex33 {
  nextId = 1;
  fb = new FormBuilder();
  form = this.fb.group({ entries: this.fb.array([this.newEntry()]) });
  get entries() { return this.form.get('entries') as FormArray; }
  getGroup(i: number) { return this.entries.at(i) as FormGroup; }
  newEntry() { return this.fb.group({ id: [this.nextId++], label: [''] }); }
  add() { this.entries.push(this.newEntry()); }
  remove(i: number) { this.entries.removeAt(i); }
}

// 34. FormArray with validation summary
@Component({
  selector: 'ex-34', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="fields">
        @for (g of fields.controls; track $index) {
          <div [formGroupName]="$index">
            <input formControlName="name" placeholder="Name (required)" />
          </div>
        }
      </div>
      <button (click)="add()">+ Field</button>
      <button (click)="validate()">Validate</button>
      <ul>
        @for (err of errors(); track err) {
          <li style="color:red">{{ err }}</li>
        }
      </ul>
    </div>`
})
class Ex34 {
  fb = new FormBuilder();
  form = this.fb.group({
    fields: this.fb.array([
      this.fb.group({ name: ['', Validators.required] }),
      this.fb.group({ name: ['', Validators.required] })
    ])
  });
  get fields() { return this.form.get('fields') as FormArray; }
  errors = signal<string[]>([]);
  add() { this.fields.push(this.fb.group({ name: ['', Validators.required] })); }
  validate() {
    this.fields.markAllAsTouched();
    const errs: string[] = [];
    this.fields.controls.forEach((g, i) => {
      if ((g as FormGroup).get('name')!.invalid) errs.push(`Row ${i + 1}: Name required`);
    });
    this.errors.set(errs);
  }
}

// 35. FormArray with undo (store previous state)
@Component({
  selector: 'ex-35', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="notes">
        @for (c of notes.controls; track $index) {
          <input [formControlName]="$index" placeholder="Note" />
        }
      </div>
      <button (click)="add()">Add</button>
      <button (click)="undo()" [disabled]="history().length === 0">Undo</button>
      <p>{{ notes.value | json }}</p>
    </div>`
})
class Ex35 {
  fb = new FormBuilder();
  form = this.fb.group({ notes: this.fb.array(['Note 1', 'Note 2']) });
  get notes() { return this.form.get('notes') as FormArray; }
  history = signal<string[][]>([]);
  add() {
    this.history.update(h => [...h, [...this.notes.value]]);
    this.notes.push(new FormControl('New note'));
  }
  undo() {
    const prev = this.history().at(-1);
    if (!prev) return;
    this.history.update(h => h.slice(0, -1));
    while (this.notes.length) this.notes.removeAt(0);
    prev.forEach(v => this.notes.push(new FormControl(v)));
  }
}

// 36. FormArray real-time total display (computed)
@Component({
  selector: 'ex-36', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="prices">
        @for (g of prices.controls; track $index) {
          <div [formGroupName]="$index" style="display:flex;gap:8px">
            <input formControlName="item" placeholder="Item" />
            <input formControlName="price" type="number" placeholder="Price" (input)="sync()" />
          </div>
        }
      </div>
      <button (click)="add()">+ Line</button>
      <p><strong>Total: ${{ total() }}</strong></p>
    </div>`
})
class Ex36 {
  fb = new FormBuilder();
  form = this.fb.group({
    prices: this.fb.array([
      this.fb.group({ item: ['Widget'], price: [10] }),
      this.fb.group({ item: ['Gadget'], price: [25] })
    ])
  });
  get prices() { return this.form.get('prices') as FormArray; }
  total = signal(35);
  sync() {
    this.total.set(this.prices.controls.reduce((s, g) => s + (+((g as FormGroup).get('price')?.value) || 0), 0));
  }
  add() { this.prices.push(this.fb.group({ item: [''], price: [0] })); }
}

// 37. FormArray of file entries (filename + size)
@Component({
  selector: 'ex-37', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div>
      <input type="file" multiple (change)="onFiles($event)" />
      <div [formGroup]="form" formArrayName="files">
        @for (g of files.controls; track $index) {
          <div [formGroupName]="$index" style="display:flex;gap:8px">
            <input formControlName="name" placeholder="Name" readonly />
            <input formControlName="size" placeholder="Size" readonly />
          </div>
        }
      </div>
      <p>{{ files.value | json }}</p>
    </div>`
})
class Ex37 {
  fb = new FormBuilder();
  form = this.fb.group({ files: this.fb.array([]) });
  get files() { return this.form.get('files') as FormArray; }
  onFiles(event: Event) {
    const input = event.target as HTMLInputElement;
    while (this.files.length) this.files.removeAt(0);
    Array.from(input.files || []).forEach(f => {
      this.files.push(this.fb.group({ name: [f.name], size: [`${(f.size / 1024).toFixed(1)} KB`] }));
    });
  }
}

// 38. Invoice form: FormArray line items + totals
@Component({
  selector: 'ex-38', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form" style="font-size:14px">
      <input formControlName="client" placeholder="Client Name" />
      <div formArrayName="lines" style="margin-top:8px">
        @for (g of lines.controls; track $index) {
          <div [formGroupName]="$index" style="display:flex;gap:6px;margin:3px 0">
            <input formControlName="desc" placeholder="Description" style="flex:2" />
            <input formControlName="qty" type="number" placeholder="Qty" style="width:50px" (input)="calc()" />
            <input formControlName="rate" type="number" placeholder="Rate" style="width:60px" (input)="calc()" />
            <span style="width:60px">{{ lineTotal($index) | number:'1.2-2' }}</span>
            <button (click)="removeLine($index)">✕</button>
          </div>
        }
      </div>
      <button (click)="addLine()">+ Line</button>
      <p><strong>Subtotal: {{ subtotal() | number:'1.2-2' }}</strong></p>
    </div>`
})
class Ex38 {
  fb = new FormBuilder();
  form = this.fb.group({
    client: ['Acme Corp'],
    lines: this.fb.array([
      this.fb.group({ desc: ['Consulting'], qty: [8], rate: [150] }),
      this.fb.group({ desc: ['Design'], qty: [4], rate: [100] })
    ])
  });
  get lines() { return this.form.get('lines') as FormArray; }
  subtotal = signal(1600);
  lineTotal(i: number): number {
    const g = this.lines.at(i) as FormGroup;
    return +(g.get('qty')?.value || 0) * +(g.get('rate')?.value || 0);
  }
  calc() { this.subtotal.set(this.lines.controls.reduce((s, _, i) => s + this.lineTotal(i), 0)); }
  addLine() { this.lines.push(this.fb.group({ desc: [''], qty: [1], rate: [0] })); }
  removeLine(i: number) { this.lines.removeAt(i); this.calc(); }
}

// ─── ADVANCED (39–50) ────────────────────────────────────────

// 39. Typed FormArray<FormControl<string>>
@Component({
  selector: 'ex-39', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div>
      @for (c of typedArr.controls; track $index) {
        <input [value]="c.value" (input)="c.setValue(($event.target as HTMLInputElement).value)" />
      }
      <button (click)="add()">+</button>
      <p>{{ typedArr.value | json }}</p>
    </div>`
})
class Ex39 {
  typedArr = new FormArray<FormControl<string>>([
    new FormControl<string>('TypeScript', { nonNullable: true }),
    new FormControl<string>('Angular', { nonNullable: true })
  ]);
  add() { this.typedArr.push(new FormControl<string>('', { nonNullable: true })); }
}

// 40. Typed FormArray<FormGroup<{name: FormControl<string>}>>
@Component({
  selector: 'ex-40', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div>
      @for (g of typedArr.controls; track $index) {
        <div [formGroup]="g">
          <input formControlName="name" placeholder="Name" />
        </div>
      }
      <button (click)="add()">+</button>
      <p>{{ typedArr.value | json }}</p>
    </div>`
})
class Ex40 {
  typedArr = new FormArray<FormGroup<{ name: FormControl<string> }>>([
    new FormGroup({ name: new FormControl('Alice', { nonNullable: true }) }),
    new FormGroup({ name: new FormControl('Bob', { nonNullable: true }) })
  ]);
  add() {
    this.typedArr.push(new FormGroup({ name: new FormControl('', { nonNullable: true }) }));
  }
}

// 41. FormArray with generic type helper
@Component({
  selector: 'ex-41', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div>
      <p>String array: {{ stringArr.value | json }}</p>
      <p>Number array: {{ numArr.value | json }}</p>
      <button (click)="stringArr.push(makeStr('new'))">+ String</button>
      <button (click)="numArr.push(makeNum(0))">+ Number</button>
    </div>`
})
class Ex41 {
  makeStr = (v: string) => new FormControl<string>(v, { nonNullable: true });
  makeNum = (v: number) => new FormControl<number>(v, { nonNullable: true });
  stringArr = new FormArray(['a', 'b'].map(this.makeStr));
  numArr = new FormArray([1, 2, 3].map(this.makeNum));
}

// 42. FormArray + signal sync (mirror to signal)
@Component({
  selector: 'ex-42', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="tags">
        @for (c of tags.controls; track $index) {
          <input [formControlName]="$index" (input)="sync()" />
        }
      </div>
      <button (click)="add()">+</button>
      <p>Signal mirror: {{ mirror() | json }}</p>
    </div>`
})
class Ex42 {
  fb = new FormBuilder();
  form = this.fb.group({ tags: this.fb.array(['ng', 'rxjs']) });
  get tags() { return this.form.get('tags') as FormArray; }
  mirror = signal<string[]>(['ng', 'rxjs']);
  sync() { this.mirror.set([...this.tags.value]); }
  add() { this.tags.push(new FormControl('')); this.sync(); }
}

// 43. FormArray with server error per row
@Component({
  selector: 'ex-43', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="emails">
        @for (c of emails.controls; track $index) {
          <div>
            <input [formControlName]="$index" placeholder="Email" />
            @if (serverErrors()[$index]) {
              <span style="color:red">{{ serverErrors()[$index] }}</span>
            }
          </div>
        }
      </div>
      <button (click)="add()">+</button>
      <button (click)="simulate()">Simulate server errors</button>
    </div>`
})
class Ex43 {
  fb = new FormBuilder();
  form = this.fb.group({ emails: this.fb.array(['bad-email', 'good@test.com']) });
  get emails() { return this.form.get('emails') as FormArray; }
  serverErrors = signal<Record<number, string>>({});
  add() { this.emails.push(new FormControl('')); }
  simulate() {
    const errs: Record<number, string> = {};
    this.emails.value.forEach((v: string, i: number) => {
      if (!v.includes('@')) errs[i] = 'Invalid email format';
    });
    this.serverErrors.set(errs);
  }
}

// 44. FormArray with drag-to-reorder simulation
@Component({
  selector: 'ex-44', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="items">
        @for (c of items.controls; track $index) {
          <div style="display:flex;gap:6px;margin:3px 0;background:#f5f5f5;padding:4px">
            <span>☰</span>
            <input [formControlName]="$index" />
            <button (click)="moveUp($index)" [disabled]="$index===0">↑</button>
            <button (click)="moveDown($index)" [disabled]="$index===items.length-1">↓</button>
          </div>
        }
      </div>
      <p>Order: {{ items.value | json }}</p>
    </div>`
})
class Ex44 {
  fb = new FormBuilder();
  form = this.fb.group({ items: this.fb.array(['Alpha', 'Beta', 'Gamma', 'Delta']) });
  get items() { return this.form.get('items') as FormArray; }
  moveUp(i: number) { if (i === 0) return; const c = this.items.at(i); this.items.removeAt(i); this.items.insert(i - 1, c); }
  moveDown(i: number) { if (i === this.items.length - 1) return; const c = this.items.at(i); this.items.removeAt(i); this.items.insert(i + 1, c); }
}

// 45. FormArray with sorting (computed sorted view)
@Component({
  selector: 'ex-45', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="names">
        @for (c of names.controls; track $index) {
          <input [formControlName]="$index" (input)="updateSorted()" placeholder="Name" />
        }
      </div>
      <button (click)="add()">+</button>
      <p>Sorted view: {{ sorted() | json }}</p>
    </div>`
})
class Ex45 {
  fb = new FormBuilder();
  form = this.fb.group({ names: this.fb.array(['Charlie', 'Alice', 'Bob']) });
  get names() { return this.form.get('names') as FormArray; }
  sorted = signal([...['Charlie', 'Alice', 'Bob']].sort());
  updateSorted() { this.sorted.set([...this.names.value].sort()); }
  add() { this.names.push(new FormControl('')); this.updateSorted(); }
}

// 46. FormArray bulk select + delete
@Component({
  selector: 'ex-46', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="items">
        @for (c of items.controls; track $index) {
          <div style="display:flex;gap:6px">
            <input type="checkbox" [checked]="selected().has($index)" (change)="toggle($index)" />
            <input [formControlName]="$index" />
          </div>
        }
      </div>
      <button (click)="add()">+ Item</button>
      <button (click)="deleteSelected()" [disabled]="selected().size === 0">Delete Selected</button>
      <p>Selected: {{ selected().size }}</p>
    </div>`
})
class Ex46 {
  fb = new FormBuilder();
  form = this.fb.group({ items: this.fb.array(['A', 'B', 'C', 'D']) });
  get items() { return this.form.get('items') as FormArray; }
  selected = signal<Set<number>>(new Set());
  toggle(i: number) {
    this.selected.update(s => { const ns = new Set(s); ns.has(i) ? ns.delete(i) : ns.add(i); return ns; });
  }
  add() { this.items.push(new FormControl('new')); }
  deleteSelected() {
    const indices = [...this.selected()].sort((a, b) => b - a);
    indices.forEach(i => this.items.removeAt(i));
    this.selected.set(new Set());
  }
}

// 47. FormArray factory function
@Component({
  selector: 'ex-47', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="products">
        @for (g of products.controls; track $index) {
          <div [formGroupName]="$index" style="display:flex;gap:6px">
            <input formControlName="name" placeholder="Name" />
            <input formControlName="price" type="number" placeholder="Price" />
            <input formControlName="sku" placeholder="SKU" />
          </div>
        }
      </div>
      <button (click)="add()">+ Product</button>
      <p>{{ form.value | json }}</p>
    </div>`
})
class Ex47 {
  fb = new FormBuilder();
  createProduct(name = '', price = 0, sku = '') {
    return this.fb.group({
      name: [name, Validators.required],
      price: [price, [Validators.required, Validators.min(0)]],
      sku: [sku]
    });
  }
  form = this.fb.group({
    products: this.fb.array([
      this.createProduct('Widget', 9.99, 'WGT-001'),
      this.createProduct('Gadget', 29.99, 'GDG-001')
    ])
  });
  get products() { return this.form.get('products') as FormArray; }
  add() { this.products.push(this.createProduct()); }
}

// 48. FormArray change diff (original vs current)
@Component({
  selector: 'ex-48', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="items">
        @for (c of items.controls; track $index) {
          <input [formControlName]="$index" placeholder="Item" />
        }
      </div>
      <button (click)="add()">Add</button>
      <button (click)="showDiff()">Show Diff</button>
      <p>Added: {{ diff().added | json }}</p>
      <p>Removed: {{ diff().removed | json }}</p>
    </div>`
})
class Ex48 {
  original = ['A', 'B', 'C'];
  fb = new FormBuilder();
  form = this.fb.group({ items: this.fb.array([...this.original]) });
  get items() { return this.form.get('items') as FormArray; }
  diff = signal({ added: [] as string[], removed: [] as string[] });
  add() { this.items.push(new FormControl('D')); }
  showDiff() {
    const current: string[] = this.items.value;
    const added = current.filter(v => !this.original.includes(v));
    const removed = this.original.filter(v => !current.includes(v));
    this.diff.set({ added, removed });
  }
}

// 49. FormArray reset to server data
@Component({
  selector: 'ex-49', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form">
      <div formArrayName="items">
        @for (c of items.controls; track $index) {
          <div style="display:flex;gap:6px">
            <input [formControlName]="$index" />
            <button (click)="remove($index)">✕</button>
          </div>
        }
      </div>
      <button (click)="add()">Add</button>
      <button (click)="resetToServer()">Reset to Server</button>
      <p>{{ items.value | json }}</p>
    </div>`
})
class Ex49 {
  serverData = ['Server A', 'Server B', 'Server C'];
  fb = new FormBuilder();
  form = this.fb.group({ items: this.fb.array([...this.serverData]) });
  get items() { return this.form.get('items') as FormArray; }
  add() { this.items.push(new FormControl('local item')); }
  remove(i: number) { this.items.removeAt(i); }
  resetToServer() {
    while (this.items.length) this.items.removeAt(0);
    this.serverData.forEach(v => this.items.push(new FormControl(v)));
  }
}

// 50. Full order form: header FormGroup + FormArray lines + computed totals + validation
@Component({
  selector: 'ex-50', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="form" style="font-size:13px;max-width:500px">
      <h4 style="margin:4px 0">Order Form</h4>
      <div formGroupName="header" style="display:flex;gap:8px;margin-bottom:8px">
        <input formControlName="orderId" placeholder="Order ID" />
        <input formControlName="customer" placeholder="Customer" />
      </div>
      <div formArrayName="lines">
        @for (g of lines.controls; track $index) {
          <div [formGroupName]="$index" style="display:flex;gap:4px;margin:3px 0">
            <input formControlName="product" placeholder="Product" style="flex:2" />
            <input formControlName="qty" type="number" placeholder="Qty" style="width:50px" (input)="recalc()" />
            <input formControlName="unit" type="number" placeholder="Unit$" style="width:55px" (input)="recalc()" />
            <span style="width:55px;text-align:right">{{ rowTotal($index) | number:'1.2-2' }}</span>
            <button (click)="removeLine($index)">✕</button>
          </div>
        }
      </div>
      <button (click)="addLine()" style="margin-top:4px">+ Line</button>
      <div style="margin-top:8px;border-top:1px solid #ccc;padding-top:8px">
        <p>Subtotal: <strong>{{ subtotal() | number:'1.2-2' }}</strong></p>
        <p>Tax (10%): <strong>{{ tax() | number:'1.2-2' }}</strong></p>
        <p>Total: <strong>{{ total() | number:'1.2-2' }}</strong></p>
      </div>
      <p [style.color]="form.valid ? 'green' : 'red'">Form: {{ form.valid ? 'Valid' : 'Invalid' }}</p>
    </div>`
})
class Ex50 {
  fb = new FormBuilder();
  form = this.fb.group({
    header: this.fb.group({
      orderId: ['ORD-001', Validators.required],
      customer: ['Acme Corp', Validators.required]
    }),
    lines: this.fb.array([
      this.fb.group({ product: ['Widget', Validators.required], qty: [10], unit: [5.99] }),
      this.fb.group({ product: ['Gadget', Validators.required], qty: [3], unit: [24.99] })
    ])
  });
  get lines() { return this.form.get('lines') as FormArray; }
  subtotal = signal(134.87);
  tax = computed(() => this.subtotal() * 0.1);
  total = computed(() => this.subtotal() + this.tax());
  rowTotal(i: number): number {
    const g = this.lines.at(i) as FormGroup;
    return +(g.get('qty')?.value || 0) * +(g.get('unit')?.value || 0);
  }
  recalc() { this.subtotal.set(this.lines.controls.reduce((s, _, i) => s + this.rowTotal(i), 0)); }
  addLine() { this.lines.push(this.fb.group({ product: ['', Validators.required], qty: [1], unit: [0] })); }
  removeLine(i: number) { this.lines.removeAt(i); this.recalc(); }
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
      <h1>Examples 4.4 — FormArray</h1>
      <h4>1. FormArray of FormControls (tags list)</h4><ex-01 /><hr />
      <h4>2. Add item to FormArray (.push)</h4><ex-02 /><hr />
      <h4>3. Remove item (.removeAt)</h4><ex-03 /><hr />
      <h4>4. FormArray .length</h4><ex-04 /><hr />
      <h4>5. FormArray .at(index)</h4><ex-05 /><hr />
      <h4>6. FormArray in @for with index</h4><ex-06 /><hr />
      <h4>7. FormArray of strings (email list)</h4><ex-07 /><hr />
      <h4>8. FormArray push/removeAt buttons</h4><ex-08 /><hr />
      <h4>9. FormArray setValue(array)</h4><ex-09 /><hr />
      <h4>10. FormArray reset()</h4><ex-10 /><hr />
      <h4>11. FormArray with initial values from array</h4><ex-11 /><hr />
      <h4>12. FormArray inside a FormGroup</h4><ex-12 /><hr />
      <h4>13. FormArray required validator (minLength)</h4><ex-13 /><hr />
      <h4>14. FormArray of FormGroups (name + phone list)</h4><ex-14 /><hr />
      <h4>15. Add/remove FormGroup rows dynamically</h4><ex-15 /><hr />
      <h4>16. Per-row validation (each row has Validators.required)</h4><ex-16 /><hr />
      <h4>17. Computed total from FormArray number values</h4><ex-17 /><hr />
      <h4>18. Dynamic question generator (FormArray of FormControls)</h4><ex-18 /><hr />
      <h4>19. Reorder by swapping (removeAt + insert)</h4><ex-19 /><hr />
      <h4>20. Delete with confirmation signal</h4><ex-20 /><hr />
      <h4>21. FormArray min/max items validator</h4><ex-21 /><hr />
      <h4>22. FormArray of checkboxes (multi-select)</h4><ex-22 /><hr />
      <h4>23. FormArray of radio options</h4><ex-23 /><hr />
      <h4>24. FormArray with @for + track by index</h4><ex-24 /><hr />
      <h4>25. FormArray getRawValue() including disabled</h4><ex-25 /><hr />
      <h4>26. FormArray markAllAsTouched()</h4><ex-26 /><hr />
      <h4>27. FormArray inside FormArray (categories → items)</h4><ex-27 /><hr />
      <h4>28. FormArray of complex objects (address book)</h4><ex-28 /><hr />
      <h4>29. FormArray with child component per row</h4><ex-29 /><hr />
      <h4>30. FormArray in service (shared across components)</h4><ex-30 /><hr />
      <h4>31. FormArray with signal-based row count display</h4><ex-31 /><hr />
      <h4>32. FormArray of FormGroups with nested FormGroup</h4><ex-32 /><hr />
      <h4>33. FormArray with auto-generated IDs</h4><ex-33 /><hr />
      <h4>34. FormArray with validation summary</h4><ex-34 /><hr />
      <h4>35. FormArray with undo (store previous state)</h4><ex-35 /><hr />
      <h4>36. FormArray real-time total display (computed)</h4><ex-36 /><hr />
      <h4>37. FormArray of file entries (filename + size)</h4><ex-37 /><hr />
      <h4>38. Invoice form: FormArray line items + totals</h4><ex-38 /><hr />
      <h4>39. Typed FormArray&lt;FormControl&lt;string&gt;&gt;</h4><ex-39 /><hr />
      <h4>40. Typed FormArray&lt;FormGroup&lt;{name: FormControl&lt;string&gt;}&gt;&gt;</h4><ex-40 /><hr />
      <h4>41. FormArray with generic type helper</h4><ex-41 /><hr />
      <h4>42. FormArray + signal sync (mirror to signal)</h4><ex-42 /><hr />
      <h4>43. FormArray with server error per row</h4><ex-43 /><hr />
      <h4>44. FormArray with drag-to-reorder simulation</h4><ex-44 /><hr />
      <h4>45. FormArray with sorting (computed sorted view)</h4><ex-45 /><hr />
      <h4>46. FormArray bulk select + delete</h4><ex-46 /><hr />
      <h4>47. FormArray factory function</h4><ex-47 /><hr />
      <h4>48. FormArray change diff (original vs current)</h4><ex-48 /><hr />
      <h4>49. FormArray reset to server data</h4><ex-49 /><hr />
      <h4>50. Full order form: header FormGroup + FormArray lines + computed totals + validation</h4><ex-50 /><hr />
    </div>`
})
export class AppComponent {}
