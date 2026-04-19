# Prototypes & Classes in JavaScript

## What is it?
JavaScript uses **prototype-based inheritance** — objects inherit from other objects via a prototype chain, not from class blueprints. ES6 `class` syntax is syntactic sugar over this prototype system — it doesn't introduce a new OOP model. Understanding prototypes is essential for debugging inheritance issues and understanding how `class`, `extends`, and `instanceof` work under the hood.

## Key Concepts
- **Prototype chain**: every object has a `[[Prototype]]` link to another object (eventually `null`)
- **Property lookup**: JS walks up the chain until it finds the property or hits `null`
- **`__proto__`** / `Object.getPrototypeOf()`: access an object's prototype
- **`prototype` property**: function's property that becomes `[[Prototype]]` of instances created with `new`
- **`class`**: syntactic sugar — translates to prototype-based constructor functions
- **`extends`**: sets up prototype chain between classes
- **`super`**: calls parent class constructor or methods
- **`static`**: properties/methods on the class itself, not instances
- **Private fields (`#`)**: true privacy (not on prototype, not accessible outside class)

## Syntax / Patterns

```js
// ─── PROTOTYPE-BASED (Old way) ───────────────────────────────────────────────
function Animal(name) {
  this.name = name;
}
Animal.prototype.speak = function() {
  return `${this.name} makes a noise.`;
};
Animal.prototype.toString = function() {
  return `Animal(${this.name})`;
};

function Dog(name) {
  Animal.call(this, name); // call parent constructor
}
Dog.prototype = Object.create(Animal.prototype); // inherit
Dog.prototype.constructor = Dog;                 // fix constructor ref
Dog.prototype.bark = function() {
  return `${this.name} barks!`;
};

const d = new Dog("Rex");
d.bark();   // "Rex barks!"
d.speak();  // "Rex makes a noise." (inherited from Animal.prototype)
d instanceof Dog;    // true
d instanceof Animal; // true

// ─── ES6 CLASS SYNTAX ────────────────────────────────────────────────────────
class Animal {
  #sound; // private field
  
  constructor(name, sound = "...") {
    this.name = name;   // public
    this.#sound = sound; // private
  }
  
  speak() {
    return `${this.name} says ${this.#sound}`;
  }
  
  static create(name) { // static factory
    return new Animal(name);
  }
  
  get info() {           // getter
    return `${this.name} (${this.#sound})`;
  }
  
  set sound(val) {       // setter
    if (typeof val !== "string") throw new TypeError("Sound must be string");
    this.#sound = val;
  }
}

class Dog extends Animal {
  #tricks = [];  // private with initializer
  
  constructor(name) {
    super(name, "Woof"); // MUST call super() before using 'this'
  }
  
  learn(trick) {
    this.#tricks.push(trick);
    return this;  // chainable
  }
  
  perform() {
    return this.#tricks.join(", ") || "No tricks learned";
  }
  
  speak() {
    return super.speak() + "!"; // call parent method
  }
}

const dog = new Dog("Buddy");
dog.speak();          // "Buddy says Woof!"
dog.learn("sit").learn("shake");
dog.perform();        // "sit, shake"
dog.name;             // "Buddy"
dog.#sound;           // SyntaxError — private!

// ─── Object.create ────────────────────────────────────────────────────────────
const animalProto = {
  speak() { return `${this.name} speaks`; }
};
const cat = Object.create(animalProto);
cat.name = "Whiskers";
cat.speak(); // "Whiskers speaks"
```

## How It Works Internally

```js
// Under the hood, class is just sugar:
class Foo {}
typeof Foo;         // "function"
Foo === Foo.prototype.constructor; // true

// Property lookup chain
const obj = new Dog("Rex");
// obj → Dog.prototype → Animal.prototype → Object.prototype → null

// Checking prototype chain
Object.getPrototypeOf(dog) === Dog.prototype;      // true
Object.getPrototypeOf(Dog.prototype) === Animal.prototype; // true

// instanceof check
dog instanceof Dog;    // true
dog instanceof Animal; // true
dog instanceof Object; // true (everything is)

// hasOwnProperty vs inherited
dog.hasOwnProperty("name");  // true (set in constructor)
dog.hasOwnProperty("speak"); // false (on prototype)
```

## Common Use Cases

```js
// Mixin pattern (multiple inheritance simulation)
const Serializable = {
  serialize() { return JSON.stringify(this); },
  toJSON() { return { type: this.constructor.name, ...this }; }
};

const Validatable = {
  validate() { return Object.keys(this).every(k => this[k] !== null); }
};

class User extends Animal {
  constructor(name, email) {
    super(name);
    this.email = email;
    Object.assign(this, Serializable, Validatable); // mixin
  }
}

// Abstract base class simulation
class Shape {
  area() { throw new Error("area() must be implemented"); }
  toString() { return `${this.constructor.name}(area=${this.area()})`; }
}

class Circle extends Shape {
  constructor(r) { super(); this.r = r; }
  area() { return Math.PI * this.r ** 2; }
}

// Class with static registry
class Registry {
  static #instances = new Map();
  
  static register(key, value) { this.#instances.set(key, value); }
  static get(key) { return this.#instances.get(key); }
}
```

## Gotchas & Traps

```js
// 1. 'class' is NOT hoisted like function declarations
const p = new Person(); // ❌ ReferenceError
class Person {}

// 2. Must call super() before 'this' in subclass constructor
class Child extends Parent {
  constructor() {
    this.x = 1;  // ❌ ReferenceError: must call super first
    super();
    this.x = 1;  // ✅
  }
}

// 3. Methods on the class (prototype) are shared, not copied
class Foo {
  bar() { return 42; }
}
const a = new Foo();
const b = new Foo();
a.bar === b.bar; // true — same function on prototype

// Arrow function properties create per-instance copies (more memory)
class Foo2 {
  bar = () => 42; // each instance gets its OWN copy of bar
}

// 4. Private fields (#) are truly private — no workaround
class Secret {
  #value = 42;
}
const s = new Secret();
s["#value"]; // undefined — not the same thing
s.#value;    // SyntaxError

// 5. instanceof breaks with multiple realms (iframes, vm.runInNewContext)
// The Array from an iframe is not instanceof your page's Array

// 6. Prototype mutations affect all instances
class Dog {}
Dog.prototype.sound = "woof";
const d1 = new Dog();
const d2 = new Dog();
Dog.prototype.sound = "bark"; // changes for ALL instances!
d1.sound; // "bark"
```

## Interview Questions

**Q1: What is the prototype chain?**
> Every JavaScript object has an internal `[[Prototype]]` link to another object (its prototype). When you access a property, JS first looks on the object itself, then follows the chain upward through each prototype until it finds the property or reaches `null` (the end of the chain). This is how inheritance works in JavaScript.

**Q2: What is the difference between `prototype` and `__proto__`?**
> `prototype` is a property on **constructor functions/classes** — it's the object that becomes the `[[Prototype]]` of instances created with `new`. `__proto__` (or `Object.getPrototypeOf(obj)`) is the **actual prototype link** on an object instance. `Foo.prototype` is what `new Foo().__proto__` points to.

**Q3: How does ES6 `class` relate to prototypes?**
> `class` is syntactic sugar — it still uses prototype-based inheritance. `class Foo {}` creates a function where `typeof Foo === "function"`. Methods defined in the class body are placed on `Foo.prototype`. `extends` sets up the prototype chain. `super` calls the parent's constructor or method. No new inheritance model — just cleaner syntax.

**Q4: What is the difference between `static` and instance methods?**
> Instance methods are defined on the prototype and available on each instance (`obj.method()`). Static methods are defined on the class itself and called on the class (`ClassName.method()`). Static methods can't access `this` as an instance — `this` refers to the class itself. Static methods are useful for factories, utility functions, and class-level state.

**Q5: What are private class fields (`#`) and how do they differ from "private by convention" (`_`)?**
> Private fields (prefixed with `#`) are **truly private** — they can only be accessed from within the class body. They don't appear in `Object.keys()`, can't be accessed via bracket notation, and accessing them externally throws a SyntaxError. `_property` is just a naming convention indicating "treat as private" — it's still fully accessible from outside.

**Q6: When would you use `Object.create()` vs a class?**
> `Object.create(proto)` creates an object with a specific prototype, without calling a constructor. It's useful for: pure delegation patterns, creating objects without the overhead of a constructor, implementing `Object.create(null)` for prototype-free dictionaries. Classes are better for: typical OOP, readable hierarchies, TypeScript compatibility, and code that other developers will maintain.

**Q7: What happens when you call a method via a prototype?**
> When you call `dog.speak()`, JS first looks for `speak` on the `dog` instance directly. Not found → looks on `Dog.prototype`. Found → executes it with `this` = `dog`. The method lives on the prototype but `this` inside it always refers to the calling instance — this is how all instances share one method but operate on their own data.
