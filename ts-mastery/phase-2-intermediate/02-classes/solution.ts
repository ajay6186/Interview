// ============================================================================
// Solution 2.2 — Classes
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Basic class with access modifiers
// ---------------------------------------------------------------------------

class BankAccount {
  private balance: number = 0;

  constructor(public owner: string) {}

  deposit(amount: number): void {
    this.balance += amount;
  }

  withdraw(amount: number): boolean {
    if (amount > this.balance) return false;
    this.balance -= amount;
    return true;
  }

  getBalance(): number {
    return this.balance;
  }
}

// ---------------------------------------------------------------------------
// 2. Interface implementation
// ---------------------------------------------------------------------------

interface Serializable {
  serialize(): string;
  deserialize(data: string): void;
}

class UserProfile implements Serializable {
  constructor(public name: string, public age: number) {}

  serialize(): string {
    return JSON.stringify({ name: this.name, age: this.age });
  }

  deserialize(data: string): void {
    const parsed = JSON.parse(data);
    this.name = parsed.name;
    this.age = parsed.age;
  }
}

// ---------------------------------------------------------------------------
// 3. Abstract class
// ---------------------------------------------------------------------------

abstract class Shape {
  abstract getArea(): number;
  abstract getPerimeter(): number;

  describe(): string {
    return `Area: ${this.getArea()}, Perimeter: ${this.getPerimeter()}`;
  }
}

class CircleShape extends Shape {
  constructor(public radius: number) {
    super();
  }

  getArea(): number {
    return Math.PI * this.radius ** 2;
  }

  getPerimeter(): number {
    return 2 * Math.PI * this.radius;
  }
}

class RectangleShape extends Shape {
  constructor(public width: number, public height: number) {
    super();
  }

  getArea(): number {
    return this.width * this.height;
  }

  getPerimeter(): number {
    return 2 * (this.width + this.height);
  }
}

// ---------------------------------------------------------------------------
// 4. Parameter properties
// ---------------------------------------------------------------------------

class Point {
  constructor(public readonly x: number, public readonly y: number) {}

  distanceTo(other: Point): number {
    return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
  }
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------
const account = new BankAccount("Alice");
account.deposit(100);
console.assert(account.getBalance() === 100, "balance after deposit");
console.assert(account.withdraw(30) === true, "withdraw 30");
console.assert(account.getBalance() === 70, "balance after withdraw");
console.assert(account.withdraw(100) === false, "withdraw too much");
console.assert(account.getBalance() === 70, "balance unchanged");

const profile = new UserProfile("Alice", 30);
const serialized = profile.serialize();
console.assert(serialized === '{"name":"Alice","age":30}', "serialize");
profile.deserialize('{"name":"Bob","age":25}');
console.assert(profile.name === "Bob", "deserialize name");

const circle = new CircleShape(5);
console.assert(Math.abs(circle.getArea() - 78.539) < 0.01, "circle area");
const rect = new RectangleShape(4, 5);
console.assert(rect.getArea() === 20, "rect area");
console.assert(rect.getPerimeter() === 18, "rect perimeter");

const p1 = new Point(0, 0);
const p2 = new Point(3, 4);
console.assert(p1.distanceTo(p2) === 5, "distance");

console.log("Solution 2.2 — All assertions passed!");

export {};
