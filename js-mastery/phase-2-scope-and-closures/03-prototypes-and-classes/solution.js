// ============================================================================
// Solution 2.3 — Prototypes & Classes
// ============================================================================

"use strict";

function Animal(name, sound) {
  this.name = name;
  this.sound = sound;
}
Animal.prototype.speak = function() {
  return `${this.name} says ${this.sound}!`;
};

class AnimalClass {
  constructor(name, sound) {
    this.name = name;
    this.sound = sound;
  }
  speak() { return `${this.name} says ${this.sound}!`; }
}

class Dog extends AnimalClass {
  constructor(name) { super(name, "Woof"); }
  fetch(item) { return `${this.name} fetches the ${item}!`; }
}

class MathUtils {
  static add(a, b) { return a + b; }
  static multiply(a, b) { return a * b; }
  static PI = 3.14159;
}

class SecureCounter {
  #count;
  constructor(initial = 0) { this.#count = initial; }
  increment() { this.#count++; return this; }
  get value() { return this.#count; }
}

// Assertions
const cat = new Animal("Cat", "Meow");
console.assert(cat.speak() === "Cat says Meow!", "Animal.speak failed");
console.assert(cat instanceof Animal, "instanceof Animal failed");

const dog1 = new AnimalClass("Dog", "Woof");
console.assert(dog1.speak() === "Dog says Woof!", "AnimalClass.speak failed");

const rex = new Dog("Rex");
console.assert(rex.speak() === "Rex says Woof!", "Dog.speak failed");
console.assert(rex.fetch("ball") === "Rex fetches the ball!", "Dog.fetch failed");
console.assert(rex instanceof Dog && rex instanceof AnimalClass, "instanceof failed");

console.assert(MathUtils.add(3, 4) === 7, "MathUtils.add failed");
console.assert(MathUtils.multiply(3, 4) === 12, "MathUtils.multiply failed");
console.assert(MathUtils.PI === 3.14159, "MathUtils.PI failed");

const sc = new SecureCounter(5);
sc.increment().increment().increment();
console.assert(sc.value === 8, "SecureCounter failed");

console.log("Solution 2.3 — All assertions passed!");
