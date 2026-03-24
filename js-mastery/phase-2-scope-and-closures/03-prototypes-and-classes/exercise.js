// ============================================================================
// Exercise 2.3 — Prototypes & Classes
// ============================================================================
// Understand the prototype chain, constructor functions, and ES6 classes
// including inheritance and static members.
//
// Instructions: Fill in every TODO so the file runs and all assertions pass.
// Run with: node exercise.js
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Constructor function with prototype method
// ---------------------------------------------------------------------------

// TODO: Create a constructor function `Animal(name, sound)` that sets
//       this.name and this.sound. Add a prototype method `speak()` that
//       returns "{name} says {sound}!"
function Animal(name, sound) {
  // TODO: implement
}
// TODO: add Animal.prototype.speak

// ---------------------------------------------------------------------------
// 2. ES6 Class
// ---------------------------------------------------------------------------

// TODO: Rewrite Animal as an ES6 class `AnimalClass`
class AnimalClass {
  // TODO: constructor(name, sound)
  // TODO: speak() method
}

// ---------------------------------------------------------------------------
// 3. Inheritance
// ---------------------------------------------------------------------------

// TODO: Create class `Dog` extending AnimalClass:
//       - Constructor takes name (sound is always "Woof")
//       - Additional method fetch(item) returning "{name} fetches the {item}!"
class Dog extends AnimalClass {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// 4. Static methods and properties
// ---------------------------------------------------------------------------

// TODO: Create class `MathUtils` with:
//       - static add(a, b) returning a + b
//       - static multiply(a, b) returning a * b
//       - static PI = 3.14159
class MathUtils {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// 5. Private fields
// ---------------------------------------------------------------------------

// TODO: Create class `SecureCounter` with a private field #count:
//       - constructor(initial = 0)
//       - increment() — increments #count, returns this
//       - get value() — returns #count
class SecureCounter {
  // TODO: implement (use #count private field)
}

// ---------------------------------------------------------------------------
// Runtime assertions
// ---------------------------------------------------------------------------

const cat = new Animal("Cat", "Meow");
console.assert(cat.speak() === "Cat says Meow!", "Animal.speak failed");
console.assert(cat instanceof Animal, "instanceof Animal failed");

const dog1 = new AnimalClass("Dog", "Woof");
console.assert(dog1.speak() === "Dog says Woof!", "AnimalClass.speak failed");

const rex = new Dog("Rex");
console.assert(rex.speak() === "Rex says Woof!", "Dog.speak failed");
console.assert(rex.fetch("ball") === "Rex fetches the ball!", "Dog.fetch failed");
console.assert(rex instanceof Dog, "rex instanceof Dog failed");
console.assert(rex instanceof AnimalClass, "rex instanceof AnimalClass failed");

console.assert(MathUtils.add(3, 4) === 7, "MathUtils.add failed");
console.assert(MathUtils.multiply(3, 4) === 12, "MathUtils.multiply failed");
console.assert(MathUtils.PI === 3.14159, "MathUtils.PI failed");

const sc = new SecureCounter(5);
sc.increment().increment().increment();
console.assert(sc.value === 8, "SecureCounter failed");
try {
  sc["#count"]; // should not expose #count
} catch(e) {}

console.log("Exercise 2.3 — All assertions passed!");
