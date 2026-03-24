// ============================================================================
// Examples 4.5 — Immutability  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================
"use strict";

// ─── BASIC (1–13) ────────────────────────────────────────────────────────────

/** Object.freeze: prevent property modification */
function ex01() {
  const config = Object.freeze({ host: "localhost", port: 3000 });
  try { config.port = 9999; } catch (e) { /* strict mode throws */ }
  console.log("Ex01 — Object.freeze port unchanged:", config.port);
}

/** frozen mutation attempt: silently fails (or throws in strict) */
function ex02() {
  const point = Object.freeze({ x: 1, y: 2 });
  const moved = { ...point, x: point.x + 5 }; // create new instead
  console.log("Ex02 — original frozen:", point.x, "new moved:", moved.x);
}

/** freeze array: prevent push/pop */
function ex03() {
  const arr = Object.freeze([1, 2, 3]);
  try { arr.push(4); } catch (e) { /* throws in strict mode */ }
  console.log("Ex03 — freeze array length unchanged:", arr.length);
}

/** const vs freeze: const prevents rebinding, freeze prevents mutation */
function ex04() {
  const obj = { count: 0 };
  obj.count = 1; // allowed: rebinding the property, not the variable
  console.log("Ex04 — const allows property mutation:", obj.count);
  Object.freeze(obj);
  try { obj.count = 99; } catch (e) { /* frozen now */ }
  console.log("Ex04 — frozen prevents mutation:", obj.count);
}

/** spread copy array: non-mutating add */
function ex05() {
  const original = [1, 2, 3];
  const withFour = [...original, 4];
  const withZero = [0, ...original];
  console.log("Ex05 — spread add:", withFour, withZero, "original:", original);
}

/** spread copy object: non-mutating update */
function ex06() {
  const user = { name: "Alice", age: 30, role: "user" };
  const promoted = { ...user, role: "admin" };
  console.log("Ex06 — spread update role:", promoted.role, "original:", user.role);
}

/** immutable remove from array: filter */
function ex07() {
  const items = ["apple", "banana", "cherry", "date"];
  const withoutBanana = items.filter(i => i !== "banana");
  console.log("Ex07 — immutable remove:", withoutBanana, "original:", items);
}

/** immutable update array element: map */
function ex08() {
  const scores = [85, 72, 90, 68];
  const updated = scores.map((s, i) => i === 2 ? 95 : s);
  console.log("Ex08 — immutable update:", updated, "original:", scores);
}

/** immutable add object property via spread */
function ex09() {
  const base = { a: 1, b: 2 };
  const extended = { ...base, c: 3, d: 4 };
  console.log("Ex09 — immutable add prop:", extended, "original keys:", Object.keys(base));
}

/** immutable remove object property via destructuring */
function ex10() {
  const user = { id: 1, name: "Alice", password: "secret", age: 30 };
  const { password, ...safeUser } = user;
  console.log("Ex10 — immutable remove prop:", safeUser, "password removed:", !("password" in safeUser));
}

/** immutable sort: spread then sort */
function ex11() {
  const names = ["Charlie", "Alice", "Bob", "Dave"];
  const sorted = [...names].sort();
  console.log("Ex11 — immutable sort:", sorted, "original:", names);
}

/** immutable reverse: spread then reverse */
function ex12() {
  const nums = [1, 2, 3, 4, 5];
  const reversed = [...nums].reverse();
  console.log("Ex12 — immutable reverse:", reversed, "original:", nums);
}

/** Object.assign for shallow copy */
function ex13() {
  const defaults = { theme: "light", fontSize: 14, language: "en" };
  const userPrefs = { theme: "dark", fontSize: 16 };
  const merged = Object.assign({}, defaults, userPrefs);
  console.log("Ex13 — Object.assign:", merged, "defaults unchanged:", defaults.theme);
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────────────────────

/** deepFreeze: recursively freeze nested objects */
function ex14() {
  function deepFreeze(obj) {
    if (obj === null || typeof obj !== "object") return obj;
    Object.getOwnPropertyNames(obj).forEach(k => deepFreeze(obj[k]));
    return Object.freeze(obj);
  }
  const config = deepFreeze({ db: { host: "localhost", port: 5432 }, app: { debug: false } });
  try { config.db.port = 9999; } catch (e) { /* throws */ }
  console.log("Ex14 — deepFreeze port:", config.db.port);
}

/** immutable stack: push/pop without mutation */
function ex15() {
  const push  = (stack, item) => [...stack, item];
  const pop   = stack => stack.slice(0, -1);
  const peek  = stack => stack[stack.length - 1];
  const isEmpty = stack => stack.length === 0;

  let s = [];
  s = push(s, 10);
  s = push(s, 20);
  s = push(s, 30);
  console.log("Ex15 — immutable stack peek:", peek(s));
  s = pop(s);
  console.log("Ex15 — after pop peek:", peek(s), "len:", s.length);
}

/** immutable queue: enqueue/dequeue without mutation */
function ex16() {
  const enqueue = (queue, item) => [...queue, item];
  const dequeue = queue => [queue[0], queue.slice(1)];
  const front   = queue => queue[0];

  let q = [];
  q = enqueue(q, "task1");
  q = enqueue(q, "task2");
  q = enqueue(q, "task3");
  const [first, rest] = dequeue(q);
  console.log("Ex16 — immutable queue dequeue:", first, "rest:", rest);
}

/** immutable set operations */
function ex17() {
  const setAdd    = (set, item)  => set.has(item) ? set : new Set([...set, item]);
  const setRemove = (set, item)  => new Set([...set].filter(x => x !== item));
  const setUnion  = (a, b)       => new Set([...a, ...b]);
  const setIntersect = (a, b)    => new Set([...a].filter(x => b.has(x)));

  let s = new Set([1, 2, 3]);
  s = setAdd(s, 4);
  s = setAdd(s, 2); // no-op
  s = setRemove(s, 1);
  console.log("Ex17 — immutable set:", [...s]);
  console.log("Ex17 — union:", [...setUnion(new Set([1,2,3]), new Set([3,4,5]))]);
}

/** immutable map (object) operations */
function ex18() {
  const mapSet    = (m, k, v) => ({ ...m, [k]: v });
  const mapRemove = (m, k)    => { const { [k]: _, ...rest } = m; return rest; };
  const mapUpdate = (m, k, fn) => ({ ...m, [k]: fn(m[k]) });
  const mapMerge  = (a, b)    => ({ ...a, ...b });

  let inventory = {};
  inventory = mapSet(inventory, "apples", 5);
  inventory = mapSet(inventory, "bananas", 3);
  inventory = mapUpdate(inventory, "apples", n => n + 2);
  inventory = mapRemove(inventory, "bananas");
  console.log("Ex18 — immutable map:", inventory);
}

/** immutable update at path */
function ex19() {
  function updateNested(obj, path, value) {
    if (path.length === 0) return value;
    const [head, ...tail] = path;
    return { ...obj, [head]: updateNested(obj[head] || {}, tail, value) };
  }
  const state = { user: { name: "Alice", prefs: { theme: "dark", fontSize: 14 } } };
  const next1 = updateNested(state, ["user", "prefs", "theme"], "light");
  const next2 = updateNested(state, ["user", "name"], "Bob");
  console.log("Ex19 — updateNested theme:", next1.user.prefs.theme, "original:", state.user.prefs.theme);
  console.log("Ex19 — updateNested name:", next2.user.name, "original:", state.user.name);
}

/** produce-like pattern: draft-based immutable update */
function ex20() {
  function produce(base, recipe) {
    const draft = JSON.parse(JSON.stringify(base)); // deep clone as draft
    recipe(draft);
    return Object.freeze(draft);
  }
  const state = { items: [1, 2, 3], count: 3 };
  const next = produce(state, draft => {
    draft.items.push(4);
    draft.count = draft.items.length;
  });
  console.log("Ex20 — produce original:", state.count, "next:", next.count, "items:", next.items);
}

/** immutable prepend/append */
function ex21() {
  const prepend = (arr, item) => [item, ...arr];
  const append  = (arr, item) => [...arr, item];
  const concat  = (a, b) => [...a, ...b];

  const base = [3, 4, 5];
  console.log("Ex21 — prepend:", prepend(base, 2));
  console.log("Ex21 — append:", append(base, 6));
  console.log("Ex21 — concat:", concat([1, 2], base));
  console.log("Ex21 — original:", base);
}

/** immutable insert at index */
function ex22() {
  const insertAt = (arr, index, item) => [
    ...arr.slice(0, index),
    item,
    ...arr.slice(index)
  ];
  const removeAt = (arr, index) => [
    ...arr.slice(0, index),
    ...arr.slice(index + 1)
  ];
  const replaceAt = (arr, index, item) => arr.map((x, i) => i === index ? item : x);

  const nums = [1, 2, 4, 5];
  console.log("Ex22 — insertAt:", insertAt(nums, 2, 3));
  console.log("Ex22 — removeAt:", removeAt(nums, 1));
  console.log("Ex22 — replaceAt:", replaceAt(nums, 0, 99));
}

/** immutable sort (stable) */
function ex23() {
  const sortBy = (arr, keyFn) => [...arr].sort((a, b) => {
    const ka = keyFn(a), kb = keyFn(b);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
  const people = [
    { name: "Charlie", age: 25 },
    { name: "Alice",   age: 30 },
    { name: "Bob",     age: 25 }
  ];
  const byAge  = sortBy(people, p => p.age);
  const byName = sortBy(people, p => p.name);
  console.log("Ex23 — sortBy age:", byAge.map(p => p.name));
  console.log("Ex23 — sortBy name:", byName.map(p => p.name));
  console.log("Ex23 — original:", people.map(p => p.name));
}

/** immutable reverse */
function ex24() {
  const reverse = arr => [...arr].reverse();
  const reverseStr = s => s.split("").reverse().join("");

  const nums = [1, 2, 3, 4, 5];
  console.log("Ex24 — reverse array:", reverse(nums), "original:", nums);
  console.log("Ex24 — reverse string:", reverseStr("hello world"));
}

/** copy-on-write: only copy changed path */
function ex25() {
  // Structural sharing: unchanged parts share references
  const state = { a: { x: 1 }, b: { y: 2 }, c: { z: 3 } };
  const next  = { ...state, a: { ...state.a, x: 99 } }; // only 'a' is new
  console.log("Ex25 — copy-on-write a changed:", state.a === next.a, "(false = new)");
  console.log("Ex25 — b shared:", state.b === next.b, "(true = same ref)");
  console.log("Ex25 — c shared:", state.c === next.c, "(true = same ref)");
}

/** immutable record pattern */
function ex26() {
  function createRecord(fields) {
    return Object.freeze({ ...fields });
  }
  function updateRecord(record, changes) {
    return Object.freeze({ ...record, ...changes });
  }
  const alice = createRecord({ id: 1, name: "Alice", age: 30, active: true });
  const older  = updateRecord(alice, { age: 31 });
  const retired = updateRecord(older, { active: false });
  console.log("Ex26 — immutable record:", alice.age, older.age, retired.active);
}

// ─── NESTED (27–38) ──────────────────────────────────────────────────────────

/** persistent linked list: share tail on prepend */
function ex27() {
  const empty   = null;
  const cons    = (head, tail) => Object.freeze({ head, tail });
  const toArray = list => {
    const arr = [];
    let node = list;
    while (node) { arr.push(node.head); node = node.tail; }
    return arr;
  };

  const list1 = cons(3, cons(2, cons(1, empty)));
  const list2 = cons(4, list1); // shares list1's tail — no copy
  const list3 = cons(5, list1); // also shares list1

  console.log("Ex27 — persistent list list1:", toArray(list1));
  console.log("Ex27 — persistent list list2:", toArray(list2));
  console.log("Ex27 — persistent list list3:", toArray(list3));
  console.log("Ex27 — shared tail:", list2.tail === list3.tail); // true
}

/** structural sharing: update one branch, share others */
function ex28() {
  const tree = {
    val: 1,
    left:  { val: 2, left: { val: 4, left: null, right: null }, right: { val: 5, left: null, right: null } },
    right: { val: 3, left: { val: 6, left: null, right: null }, right: { val: 7, left: null, right: null } }
  };

  // Update leftmost leaf value — only left spine is copied
  function updateLeft(node, newVal) {
    if (!node.left) return { ...node, val: newVal };
    return { ...node, left: updateLeft(node.left, newVal) };
  }

  const updated = updateLeft(tree, 99);
  console.log("Ex28 — structural sharing root:", updated.val);
  console.log("Ex28 — updated left leaf:", updated.left.left.val);
  console.log("Ex28 — right subtree shared:", tree.right === updated.right);
}

/** immutable record update: multiple fields */
function ex29() {
  function Record(schema) {
    return function(values) {
      const validated = {};
      for (const [key, defaultVal] of Object.entries(schema)) {
        validated[key] = key in values ? values[key] : defaultVal;
      }
      return Object.freeze(validated);
    };
  }
  const User = Record({ name: "", age: 0, role: "user", active: true });
  const alice = User({ name: "Alice", age: 30 });
  const bob   = User({ name: "Bob",   age: 25, role: "admin" });
  console.log("Ex29 — Record alice:", alice);
  console.log("Ex29 — Record bob:", bob);
}

/** immutable lens: view/set/over for nested data */
function ex30() {
  const lens  = (get, set) => ({ get, set });
  const view  = (l, s)    => l.get(s);
  const set   = (l, v, s) => l.set(v, s);
  const over  = (l, fn, s) => set(l, fn(view(l, s)), s);
  const composeLens = (l1, l2) => lens(
    s => l2.get(l1.get(s)),
    (v, s) => l1.set(l2.set(v, l1.get(s)), s)
  );

  const addressLens = lens(u => u.address, (v, u) => ({ ...u, address: v }));
  const zipLens     = lens(a => a.zip,     (v, a) => ({ ...a, zip: v }));
  const userZipLens = composeLens(addressLens, zipLens);

  const user    = { name: "Alice", address: { city: "NYC", zip: "10001" } };
  const updated = set(userZipLens, "90210", user);
  const upped   = over(userZipLens, z => z.replace("1", "9"), user);
  console.log("Ex30 — lens view:", view(userZipLens, user));
  console.log("Ex30 — lens set:", updated.address.zip);
  console.log("Ex30 — lens over:", upped.address.zip);
}

/** immutable diff: compute what changed */
function ex31() {
  function diff(oldObj, newObj) {
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    const changes = {};
    for (const key of allKeys) {
      if (!(key in oldObj)) changes[key] = { type: "added",   value: newObj[key] };
      else if (!(key in newObj)) changes[key] = { type: "removed", value: oldObj[key] };
      else if (oldObj[key] !== newObj[key]) changes[key] = { type: "changed", from: oldObj[key], to: newObj[key] };
    }
    return changes;
  }
  const before = { name: "Alice", age: 30, role: "user" };
  const after  = { name: "Alice", age: 31, active: true };
  console.log("Ex31 — diff:", JSON.stringify(diff(before, after)));
}

/** immutable patch: apply changes from diff */
function ex32() {
  function patch(obj, changes) {
    return Object.entries(changes).reduce((acc, [key, change]) => {
      if (change.type === "added" || change.type === "changed")
        return { ...acc, [key]: change.type === "changed" ? change.to : change.value };
      if (change.type === "removed") {
        const { [key]: _, ...rest } = acc;
        return rest;
      }
      return acc;
    }, obj);
  }
  const original = { name: "Alice", age: 30, role: "user" };
  const changes  = {
    age:    { type: "changed", from: 30, to: 31 },
    active: { type: "added",   value: true },
    role:   { type: "removed", value: "user" }
  };
  const patched = patch(original, changes);
  console.log("Ex32 — immutable patch:", patched, "original:", original);
}

/** undo/redo stack with immutable state */
function ex33() {
  function createHistory(initial) {
    let past    = [];
    let present = initial;
    let future  = [];

    return {
      getState: () => present,
      push: newState => {
        past    = [...past, present];
        present = newState;
        future  = [];
      },
      undo: () => {
        if (!past.length) return;
        future  = [present, ...future];
        present = past[past.length - 1];
        past    = past.slice(0, -1);
      },
      redo: () => {
        if (!future.length) return;
        past    = [...past, present];
        present = future[0];
        future  = future.slice(1);
      },
      canUndo: () => past.length > 0,
      canRedo: () => future.length > 0
    };
  }

  const h = createHistory({ count: 0 });
  h.push({ count: 1 }); h.push({ count: 2 }); h.push({ count: 3 });
  console.log("Ex33 — history state:", h.getState().count);
  h.undo();
  console.log("Ex33 — after undo:", h.getState().count);
  h.undo();
  console.log("Ex33 — after undo:", h.getState().count);
  h.redo();
  console.log("Ex33 — after redo:", h.getState().count);
}

/** event sourcing with immutable state */
function ex34() {
  const handlers = {
    UserCreated:  (state, e) => ({ ...state, users: [...state.users, { id: e.id, name: e.name }] }),
    UserRenamed:  (state, e) => ({ ...state, users: state.users.map(u => u.id === e.id ? { ...u, name: e.name } : u) }),
    UserDeleted:  (state, e) => ({ ...state, users: state.users.filter(u => u.id !== e.id) })
  };
  const applyEvent = (state, event) => (handlers[event.type] || (s => s))(state, event);

  const events = [
    { type: "UserCreated", id: 1, name: "Alice" },
    { type: "UserCreated", id: 2, name: "Bob"   },
    { type: "UserRenamed", id: 1, name: "Alice Smith" },
    { type: "UserDeleted", id: 2 }
  ];
  const finalState = events.reduce(applyEvent, { users: [] });
  console.log("Ex34 — event sourcing:", finalState.users);
}

/** immutable update helpers: assoc/dissoc/update */
function ex35() {
  const assoc    = (key, val, obj) => ({ ...obj, [key]: val });
  const dissoc   = (key, obj)      => { const { [key]: _, ...rest } = obj; return rest; };
  const update   = (key, fn, obj)  => ({ ...obj, [key]: fn(obj[key]) });
  const assocIn  = (path, val, obj) => {
    if (path.length === 1) return assoc(path[0], val, obj);
    return assoc(path[0], assocIn(path.slice(1), val, obj[path[0]] || {}), obj);
  };
  const dissocIn = (path, obj) => {
    if (path.length === 1) return dissoc(path[0], obj);
    return assoc(path[0], dissocIn(path.slice(1), obj[path[0]] || {}), obj);
  };

  let state = { user: { name: "Alice", prefs: { theme: "dark" } } };
  state = assocIn(["user", "prefs", "fontSize"], 16, state);
  state = dissocIn(["user", "prefs", "theme"], state);
  console.log("Ex35 — immutable helpers:", JSON.stringify(state.user.prefs));
}

/** immutable memoization: cache by args (pure + immutable) */
function ex36() {
  function memoize(fn) {
    const cache = Object.create(null);
    return function(...args) {
      const key = JSON.stringify(args);
      if (key in cache) return cache[key];
      return (cache[key] = fn(...args));
    };
  }
  const fib = memoize(function f(n) {
    return n <= 1 ? n : fib(n - 1) + fib(n - 2);
  });
  console.log("Ex36 — memoized fib:", [0,1,2,3,4,5,6,7,8,9,10].map(fib));
}

/** copy-on-write array segment: update a range */
function ex37() {
  function updateRange(arr, start, end, mapper) {
    return [
      ...arr.slice(0, start),
      ...arr.slice(start, end).map(mapper),
      ...arr.slice(end)
    ];
  }
  const scores = [70, 80, 60, 90, 55, 95, 75];
  const curved = updateRange(scores, 2, 5, s => Math.min(100, s + 10)); // curve items 2-4
  console.log("Ex37 — updateRange:", curved, "original:", scores);
}

/** time-travel debugging: record state snapshots */
function ex38() {
  function createTimeMachine(reducer, initial) {
    const snapshots = [initial];
    let current = 0;

    return {
      dispatch: action => {
        const next = reducer(snapshots[current], action);
        snapshots.splice(current + 1);
        snapshots.push(next);
        current = snapshots.length - 1;
        return next;
      },
      travelTo: index => {
        current = Math.max(0, Math.min(index, snapshots.length - 1));
        return snapshots[current];
      },
      getState: () => snapshots[current],
      history:  () => [...snapshots]
    };
  }
  const reducer = (state = { n: 0 }, action) =>
    action.type === "INC" ? { n: state.n + 1 } : state;

  const tm = createTimeMachine(reducer, { n: 0 });
  tm.dispatch({ type: "INC" });
  tm.dispatch({ type: "INC" });
  tm.dispatch({ type: "INC" });
  console.log("Ex38 — time machine current:", tm.getState().n);
  console.log("Ex38 — travel to 1:", tm.travelTo(1).n);
  console.log("Ex38 — history:", tm.history().map(s => s.n));
}

// ─── ADVANCED (39–50) ────────────────────────────────────────────────────────

/** hash array mapped trie concept: efficient persistent vector */
function ex39() {
  // Simplified: demonstrate O(log n) path copying
  class PersistentNode {
    constructor(values, children) {
      this.values   = Object.freeze([...values]);
      this.children = Object.freeze([...children]);
    }
  }
  // For demo: a simple path-copy tree with branching factor 2
  function createLeaf(value) { return Object.freeze({ type: "leaf", value }); }
  function createBranch(left, right) { return Object.freeze({ type: "branch", left, right }); }

  const leaf1 = createLeaf(10);
  const leaf2 = createLeaf(20);
  const branch1 = createBranch(leaf1, leaf2);
  // "Update" leaf1 → create new path, share leaf2
  const newLeaf1 = createLeaf(99);
  const newBranch = createBranch(newLeaf1, branch1.right); // share right
  console.log("Ex39 — HAMT shared right:", branch1.right === newBranch.right, "new left:", newBranch.left.value);
}

/** persistent vector: O(log n) update with path copying */
function ex40() {
  // Simplified persistent array using copy-on-write chunks
  function PVector(arr = []) {
    const data = Object.freeze([...arr]);
    return {
      get:    i   => data[i],
      set:    (i, v) => PVector([...data.slice(0,i), v, ...data.slice(i+1)]),
      push:   v   => PVector([...data, v]),
      length: data.length,
      toArray: () => [...data]
    };
  }
  const v0 = PVector([1, 2, 3, 4, 5]);
  const v1 = v0.set(2, 99);
  const v2 = v1.push(6);
  console.log("Ex40 — PVector v0:", v0.toArray());
  console.log("Ex40 — PVector v1:", v1.toArray());
  console.log("Ex40 — PVector v2:", v2.toArray());
}

/** zipper data structure: navigate and update trees */
function ex41() {
  // List zipper: focus + context for immutable list navigation
  function Zipper(left, focus, right) {
    return { left, focus, right };
  }
  const fromArray = arr => Zipper([], arr[0], arr.slice(1));
  const moveRight = z  => z.right.length ? Zipper([...z.left, z.focus], z.right[0], z.right.slice(1)) : z;
  const moveLeft  = z  => z.left.length  ? Zipper(z.left.slice(0,-1), z.left[z.left.length-1], [z.focus, ...z.right]) : z;
  const replace   = (z, v) => Zipper(z.left, v, z.right);
  const toArray   = z  => [...z.left, z.focus, ...z.right];

  let z = fromArray([1, 2, 3, 4, 5]);
  z = moveRight(z);
  z = moveRight(z);
  z = replace(z, 99);
  z = moveLeft(z);
  console.log("Ex41 — zipper focus:", z.focus, "array:", toArray(z));
}

/** functional queue: two-stack immutable queue */
function ex42() {
  function Queue(inbox = [], outbox = []) {
    return Object.freeze({ inbox, outbox });
  }
  function enqueue(q, item) { return Queue([...q.inbox, item], q.outbox); }
  function dequeue(q) {
    if (q.outbox.length) {
      return [q.outbox[0], Queue(q.inbox, q.outbox.slice(1))];
    }
    const reversed = [...q.inbox].reverse();
    return [reversed[0], Queue([], reversed.slice(1))];
  }
  function queueSize(q) { return q.inbox.length + q.outbox.length; }

  let q = Queue();
  q = enqueue(q, "a");
  q = enqueue(q, "b");
  q = enqueue(q, "c");
  const [item1, q2] = dequeue(q);
  const [item2, q3] = dequeue(q2);
  console.log("Ex42 — functional queue dequeue:", item1, item2, "size:", queueSize(q3));
}

/** CRDT basics: last-write-wins register */
function ex43() {
  // LWW Register: state-based CRDT
  function lwwRegister(id) {
    return { id, value: null, timestamp: 0 };
  }
  function lwwWrite(reg, value, timestamp) {
    if (timestamp > reg.timestamp) return { ...reg, value, timestamp };
    return reg; // discard older write
  }
  function lwwMerge(a, b) {
    return a.timestamp >= b.timestamp ? a : b;
  }
  const r1 = lwwRegister("r1");
  const r2 = lwwRegister("r1");
  const r1a = lwwWrite(r1, "hello", 1);
  const r2a = lwwWrite(r2, "world", 2);
  const merged = lwwMerge(r1a, r2a);
  console.log("Ex43 — CRDT LWW merged:", merged.value, "(timestamp:", merged.timestamp + ")");
}

/** immutable state machine: transitions as pure data */
function ex44() {
  const machine = Object.freeze({
    states: Object.freeze({
      idle:    Object.freeze({ on: Object.freeze({ FETCH: "loading" }) }),
      loading: Object.freeze({ on: Object.freeze({ RESOLVE: "success", REJECT: "failure" }) }),
      success: Object.freeze({ on: Object.freeze({ RESET: "idle" }) }),
      failure: Object.freeze({ on: Object.freeze({ RETRY: "loading", RESET: "idle" }) })
    })
  });

  function transition(currentState, event) {
    const stateNode = machine.states[currentState];
    return (stateNode && stateNode.on[event]) || currentState;
  }

  let state = "idle";
  state = transition(state, "FETCH");
  state = transition(state, "RESOLVE");
  state = transition(state, "RESET");
  state = transition(state, "FETCH");
  state = transition(state, "REJECT");
  state = transition(state, "RETRY");
  console.log("Ex44 — immutable state machine final:", state);
}

/** persistent segment tree concept: range queries with updates */
function ex45() {
  // Simplified: persistent prefix sum array
  function buildPrefixSum(arr) {
    const sums = [0];
    for (const n of arr) sums.push(sums[sums.length - 1] + n);
    return Object.freeze(sums);
  }
  function rangeSum(prefix, l, r) { return prefix[r + 1] - prefix[l]; }
  function updateAt(arr, idx, val) {
    const newArr = [...arr];
    newArr[idx] = val;
    return buildPrefixSum(newArr);
  }

  const arr    = [1, 3, 5, 7, 9, 11];
  const prefix = buildPrefixSum(arr);
  console.log("Ex45 — prefix sum range[1,4]:", rangeSum(prefix, 1, 4));
  const updated = updateAt(arr, 2, 99);
  console.log("Ex45 — after update [1,4]:", rangeSum(updated, 1, 4));
}

/** immutable memoization table: pure computation cache */
function ex46() {
  function memoTable(fn) {
    let table = Object.freeze({});
    return function(key) {
      if (key in table) return table[key];
      const result = fn(key);
      table = Object.freeze({ ...table, [key]: result }); // immutable update
      return result;
    };
  }
  let calls = 0;
  const sq = memoTable(n => { calls++; return n * n; });
  sq(3); sq(4); sq(3); sq(5); sq(4);
  console.log("Ex46 — immutable memo calls (expected 3):", calls);
}

/** functional reactive: immutable event stream transforms */
function ex47() {
  // Simple immutable stream (just arrays for demo)
  const stream = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const mapStream    = (s, fn)   => Object.freeze(s.map(fn));
  const filterStream = (s, pred) => Object.freeze(s.filter(pred));
  const scanStream   = (s, fn, init) => Object.freeze(
    s.reduce((acc, x) => Object.freeze([...acc, fn(acc[acc.length-1] ?? init, x)]), Object.freeze([]))
  );

  const evens   = filterStream(stream, x => x % 2 === 0);
  const doubled = mapStream(evens, x => x * 2);
  const running = scanStream(stream, (a, b) => a + b, 0);
  console.log("Ex47 — stream evens doubled:", [...doubled]);
  console.log("Ex47 — stream running sum:", [...running]);
}

/** tree-walking with immutable updates */
function ex48() {
  function treeMap(node, fn) {
    if (!node) return null;
    return Object.freeze({
      val:   fn(node.val),
      left:  treeMap(node.left,  fn),
      right: treeMap(node.right, fn)
    });
  }
  function treeToArray(node) {
    if (!node) return [];
    return [...treeToArray(node.left), node.val, ...treeToArray(node.right)];
  }

  const node = (v, l = null, r = null) => Object.freeze({ val: v, left: l, right: r });
  const bst = node(4, node(2, node(1), node(3)), node(6, node(5), node(7)));
  const doubled = treeMap(bst, x => x * 2);
  console.log("Ex48 — immutable treeMap in-order:", treeToArray(doubled));
}

/** deep equality without mutation */
function ex49() {
  function deepEqual(a, b) {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (typeof a !== "object" || a === null || b === null) return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const keysA = Object.keys(a), keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(k => deepEqual(a[k], b[k]));
  }

  const obj1 = { a: 1, b: { c: [1, 2, 3], d: { e: "hello" } } };
  const obj2 = { a: 1, b: { c: [1, 2, 3], d: { e: "hello" } } };
  const obj3 = { a: 1, b: { c: [1, 2, 4], d: { e: "hello" } } };
  console.log("Ex49 — deepEqual obj1===obj2:", deepEqual(obj1, obj2));
  console.log("Ex49 — deepEqual obj1===obj3:", deepEqual(obj1, obj3));
}

/** immutable priority queue: sorted insertion */
function ex50() {
  function PQueue(items = []) {
    return Object.freeze({
      items: Object.freeze([...items].sort((a, b) => a.priority - b.priority)),
      push:  item => PQueue([...items, item]),
      pop:   () => {
        const sorted = [...items].sort((a, b) => a.priority - b.priority);
        return [sorted[0], PQueue(sorted.slice(1))];
      },
      peek:  () => [...items].sort((a, b) => a.priority - b.priority)[0],
      size:  items.length
    });
  }

  let pq = PQueue();
  pq = pq.push({ task: "low",    priority: 10 });
  pq = pq.push({ task: "high",   priority: 1  });
  pq = pq.push({ task: "medium", priority: 5  });
  const [top, rest] = pq.pop();
  console.log("Ex50 — priority queue peek:", pq.peek().task, "pop:", top.task, "next:", rest.peek().task);
}

// ─── main ────────────────────────────────────────────────────────────────────

function main() {
  console.log("=== Examples 4.5 — Immutability ===\n");
  console.log("--- BASIC (1–13) ---");
  ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07();
  ex08(); ex09(); ex10(); ex11(); ex12(); ex13();
  console.log("\n--- INTERMEDIATE (14–26) ---");
  ex14(); ex15(); ex16(); ex17(); ex18(); ex19(); ex20();
  ex21(); ex22(); ex23(); ex24(); ex25(); ex26();
  console.log("\n--- NESTED (27–38) ---");
  ex27(); ex28(); ex29(); ex30(); ex31(); ex32(); ex33();
  ex34(); ex35(); ex36(); ex37(); ex38();
  console.log("\n--- ADVANCED (39–50) ---");
  ex39(); ex40(); ex41(); ex42(); ex43(); ex44(); ex45();
  ex46(); ex47(); ex48(); ex49(); ex50();
}

main();
