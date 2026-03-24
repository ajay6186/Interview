// ============================================================================
// Examples 2.5 — Destructuring & Spread  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================

"use strict";

function ex01() { const [a,b,c] = [1,2,3]; console.log("Ex01 —",a,b,c); }
function ex02() { const [,second,,fourth] = [1,2,3,4]; console.log("Ex02 —",second,fourth); }
function ex03() { const [first,...rest] = [1,2,3,4,5]; console.log("Ex03 — first:",first,"rest:",rest); }
function ex04() { const [a=10,b=20] = [1]; console.log("Ex04 — defaults:",a,b); }
function ex05() { let a=1,b=2; [a,b]=[b,a]; console.log("Ex05 — swap:",a,b); }
function ex06() { const {name,age} = {name:"Alice",age:30}; console.log("Ex06 —",name,age); }
function ex07() { const {name:n, age:a=0} = {name:"Bob"}; console.log("Ex07 — rename+default:",n,a); }
function ex08() { const {a,...rest} = {a:1,b:2,c:3}; console.log("Ex08 — obj rest:",rest); }
function ex09() { const {x:{y:{z}}} = {x:{y:{z:42}}}; console.log("Ex09 — nested:",z); }
function ex10() {
  function greet({name,greeting="Hello"}) { return `${greeting}, ${name}!`; }
  console.log("Ex10 —",greet({name:"Alice"}),greet({name:"Bob",greeting:"Hi"}));
}
function ex11() { const merged = [...[1,2,3],...[4,5,6]]; console.log("Ex11 — spread merge:",merged); }
function ex12() { function f(a,b,c){return a+b+c;} console.log("Ex12 — spread call:",f(...[10,20,30])); }
function ex13() { const copy = {...{a:1,b:2},c:3}; console.log("Ex13 — spread obj:",copy); }
function ex14() {
  // Destructure function return value
  function minMax(arr) { return [Math.min(...arr), Math.max(...arr)]; }
  const [min, max] = minMax([3,1,4,1,5,9,2]);
  console.log("Ex14 —",min,max);
}
function ex15() {
  // Destructure in for...of
  const pairs = [[1,"a"],[2,"b"],[3,"c"]];
  for (const [n,l] of pairs) console.log(`Ex15 — ${n}: ${l}`);
}
function ex16() {
  // Object destructure in for...of
  const users = [{name:"Alice",age:30},{name:"Bob",age:25}];
  for (const {name,age} of users) console.log(`Ex16 — ${name}: ${age}`);
}
function ex17() {
  // Spread to clone and modify
  const original = {a:1,b:2,c:3};
  const modified = {...original, b:99, d:4};
  console.log("Ex17 — original:",original, "modified:",modified);
}
function ex18() {
  // Array spread to avoid mutation
  const original = [1,2,3];
  const withFour = [...original, 4];
  console.log("Ex18 — original:",original,"new:",withFour);
}
function ex19() {
  // Spread in Math functions
  const nums = [5,2,8,1,9,3];
  console.log("Ex19 — max:",Math.max(...nums),"min:",Math.min(...nums));
}
function ex20() {
  // Computed key destructure
  const key = "name";
  const {[key]: value} = {name:"Alice"};
  console.log("Ex20 — computed key destructure:",value);
}
function ex21() {
  // Default values in params destructure
  function createUser({name="Anonymous",role="user",active=true}={}) {
    return {name,role,active};
  }
  console.log("Ex21 —",createUser(),createUser({name:"Alice",role:"admin"}));
}
function ex22() {
  // Spread new Date (can't directly, but spread array of args)
  const dateParts = [2024, 0, 15]; // year, month, day
  const date = new Date(...dateParts);
  console.log("Ex22 — date:",date.toISOString().split("T")[0]);
}
function ex23() {
  // Iterable destructure
  const [a, b, c] = new Set([10,20,30]);
  console.log("Ex23 — Set destructure:",a,b,c);
}
function ex24() {
  // Generator destructure
  function* gen() { yield 1; yield 2; yield 3; }
  const [x,y,z] = gen();
  console.log("Ex24 — generator:",x,y,z);
}
function ex25() {
  // String destructure (chars)
  const [first,...rest] = "hello";
  console.log("Ex25 — string:",first,rest.join(""));
}
function ex26() {
  // Map destructure via entries
  const map = new Map([["a",1],["b",2]]);
  for (const [k,v] of map.entries()) {
    console.log(`Ex26 — ${k}=${v}`);
  }
}
function ex27() {
  // Deep nested object destructure
  const {
    user: { name, address: { city, country: { code } = {} } = {} }
  } = { user: { name: "Alice", address: { city: "NYC", country: { code: "US" } } } };
  console.log("Ex27 —",name,city,code);
}
function ex28() {
  // Destructure + rename + default combo
  const { a: x = 10, b: y = 20, c: z = 30 } = { a: 1, c: 99 };
  console.log("Ex28 —",x,y,z);
}
function ex29() {
  // Destructure class instance
  class Point { constructor(x,y){this.x=x;this.y=y;} }
  const {x,y} = new Point(3,4);
  console.log("Ex29 — class instance:",x,y);
}
function ex30() {
  // Array destructure in params
  function first([head]) { return head; }
  function last([,...tail]) { return tail.at(-1); }
  console.log("Ex30 —",first([10,20,30]),last([10,20,30]));
}
function ex31() {
  // Spread to pass config
  const defaults = {timeout:5000,retries:3,verbose:false};
  function request(url, {timeout=5000,retries=3,verbose=false}={}) {
    return {url,timeout,retries,verbose};
  }
  console.log("Ex31 —",request("/api",{...defaults,timeout:1000}));
}
function ex32() {
  // Rest in object (pick remaining)
  const {password, ...safeUser} = {name:"Alice",email:"a@b.com",password:"secret"};
  console.log("Ex32 — safe user:",safeUser);
}
function ex33() {
  // Spread to merge arrays without duplicates
  const a=[1,2,3], b=[3,4,5];
  const unique = [...new Set([...a,...b])];
  console.log("Ex33 —",unique);
}
function ex34() {
  // Nested array destructure
  const matrix = [[1,2,3],[4,5,6],[7,8,9]];
  const [[a,b],[,e],[,,i]] = matrix;
  console.log("Ex34 — corners:",a,b,e,i);
}
function ex35() {
  // Spread with getters
  const obj = { get computed() { return 42; } };
  const copy = { ...obj };
  console.log("Ex35 — getter spread:",copy.computed); // getter evaluated
}
function ex36() {
  // Destructure with transformation via function
  function parseCoord(str) {
    const [lat, lon] = str.split(",").map(Number);
    return { lat, lon };
  }
  const {lat, lon} = parseCoord("40.7128,-74.0060");
  console.log("Ex36 —",lat,lon);
}
function ex37() {
  // Spread to flatten one level
  const nested = [[1,2],[3,4],[5,6]];
  const flat = [].concat(...nested);
  console.log("Ex37 —",flat);
}
function ex38() {
  // Immutable array update with spread
  function updateAt(arr, i, val) { return [...arr.slice(0,i), val, ...arr.slice(i+1)]; }
  function removeAt(arr, i) { return [...arr.slice(0,i), ...arr.slice(i+1)]; }
  const arr = [1,2,3,4,5];
  console.log("Ex38 — update:", updateAt(arr,2,99), "remove:", removeAt(arr,2));
}
function ex39() {
  // Named tuple via destructure
  function makeRect(x,y,w,h) { return [x,y,w,h]; }
  const [x,y,width,height] = makeRect(10,20,100,50);
  console.log("Ex39 —",{x,y,width,height});
}
function ex40() {
  // Optional property destructure with ||
  function getConfig({host="localhost",port=3000,ssl=false}={}) {
    return `${ssl?"https":"http"}://${host}:${port}`;
  }
  console.log("Ex40 —",getConfig(),getConfig({host:"example.com",ssl:true}));
}
function ex41() {
  // Lens pattern using destructure
  const view = path => obj => path.reduce((o,k) => o?.[k], obj);
  const set = path => val => obj => {
    if (path.length === 0) return val;
    const [k,...rest] = path;
    return {...obj, [k]: set(rest)(val)(obj[k]||{})};
  };
  const state = {user:{name:"Alice",age:30}};
  console.log("Ex41 — view:", view(["user","name"])(state));
  console.log("Ex41 — set:", set(["user","name"])("Bob")(state));
}
function ex42() {
  // Record update pattern
  const update = (obj, changes) => ({...obj, ...changes});
  const updatePath = (obj, [key, ...path], val) =>
    path.length === 0 ? update(obj, {[key]: val})
      : update(obj, {[key]: updatePath(obj[key]||{}, path, val)});
  const state = {a:{b:{c:1}}};
  console.log("Ex42 —", updatePath(state, ["a","b","c"], 99));
}
function ex43() {
  // Structural pattern matching simulation
  function match(pattern, value) {
    if (typeof pattern !== "object") return pattern === value;
    return Object.entries(pattern).every(([k,v]) => match(v, value[k]));
  }
  const user = {name:"Alice",role:"admin",age:30};
  console.log("Ex43 — match admin:", match({role:"admin"}, user));
  console.log("Ex43 — match user:", match({role:"user"}, user));
}
function ex44() {
  // Variadic function with structured args
  function createTag(tag, {className="",id="",...attrs}={}, ...children) {
    const attrStr = Object.entries(attrs).map(([k,v]) => ` ${k}="${v}"`).join("");
    const classStr = className ? ` class="${className}"` : "";
    const idStr = id ? ` id="${id}"` : "";
    return `<${tag}${idStr}${classStr}${attrStr}>${children.join("")}</${tag}>`;
  }
  console.log("Ex44 —", createTag("div", {className:"box",id:"main"}, "Hello", " World"));
}
function ex45() {
  // Spread for function composition
  const pipe = (...fns) => x => fns.reduce((v,f) => f(v), x);
  const compose = (...fns) => x => fns.reduceRight((v,f) => f(v), x);
  const transform = pipe(x => x*2, x => x+1, x => `result:${x}`);
  console.log("Ex45 —", transform(5));
}
function ex46() {
  // Destructure iterator manually
  function take(iterable, n) {
    const result = [];
    for (const v of iterable) { result.push(v); if (result.length >= n) break; }
    return result;
  }
  function* naturals() { let i=1; while(true) yield i++; }
  console.log("Ex46 —", take(naturals(), 5));
}
function ex47() {
  // Spread to clone and extend class data
  class Config {
    constructor(opts) { Object.assign(this, opts); }
    extend(more) { return new Config({...this, ...more}); }
  }
  const base = new Config({host:"localhost",port:3000});
  const prod = base.extend({host:"prod.example.com",ssl:true});
  console.log("Ex47 — base:",{...base}, "prod:",{...prod});
}
function ex48() {
  // Destructuring with Symbol.iterator
  class Pair {
    constructor(a,b){this.a=a;this.b=b;}
    [Symbol.iterator]() { return [this.a,this.b][Symbol.iterator](); }
  }
  const [x,y] = new Pair(10,20);
  console.log("Ex48 —",x,y);
}
function ex49() {
  // Spread + reduce for deep flatten
  const deepFlatten = arr => arr.reduce((acc,v) => acc.concat(Array.isArray(v) ? deepFlatten(v) : v), []);
  console.log("Ex49 —", deepFlatten([1,[2,[3,[4,[5]]]]]));
}
function ex50() {
  // Full destructuring showcase
  const data = {
    users: [
      {id:1, name:"Alice", scores:[95,87,92]},
      {id:2, name:"Bob", scores:[78,85,90]},
    ],
    meta: {total:2, page:1}
  };
  const {users:[{name:firstName,scores:[topScore]},...otherUsers], meta:{total}} = data;
  console.log("Ex50 — first user:", firstName, "top score:", topScore, "total:", total, "others:", otherUsers.length);
}

function main() {
  console.log("=".repeat(60));
  console.log("Examples 2.5 — Destructuring & Spread");
  console.log("=".repeat(60));
  console.log("\n--- BASIC (1-13) ---");
  ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07();
  ex08(); ex09(); ex10(); ex11(); ex12(); ex13();
  console.log("\n--- INTERMEDIATE (14-26) ---");
  ex14(); ex15(); ex16(); ex17(); ex18(); ex19(); ex20();
  ex21(); ex22(); ex23(); ex24(); ex25(); ex26();
  console.log("\n--- NESTED (27-38) ---");
  ex27(); ex28(); ex29(); ex30(); ex31(); ex32(); ex33();
  ex34(); ex35(); ex36(); ex37(); ex38();
  console.log("\n--- ADVANCED (39-50) ---");
  ex39(); ex40(); ex41(); ex42(); ex43(); ex44(); ex45();
  ex46(); ex47(); ex48(); ex49(); ex50();
}

main();
