// ============================================================================
// Solution 2.4 — ES6+ Features
// ============================================================================

"use strict";

function blockScopeDemo() {
  let inside;
  let outside = null;
  if (true) {
    let x = true;
    inside = x;
  }
  // x is not accessible here
  return { inside, outside };
}

function format(name, score, total) {
  const percent = Math.round(score / total * 100);
  return `Name: ${name} | Score: ${score}/${total} (${percent}%)`;
}

function multiLine(lines) {
  return lines.join("\n");
}

function wordCount(str) {
  const map = new Map();
  for (const word of str.split(" ")) {
    map.set(word, (map.get(word) || 0) + 1);
  }
  return map;
}

function uniqueValues(arr) { return [...new Set(arr)]; }

function setIntersection(a, b) {
  const sb = new Set(b);
  return a.filter(x => sb.has(x));
}

function setUnion(a, b) { return [...new Set([...a, ...b])]; }

const ID_SYMBOL = Symbol("id");
const item = { [ID_SYMBOL]: 42, name: "Widget" };

// Assertions
const demo = blockScopeDemo();
console.assert(demo.inside === true, "blockScopeDemo.inside failed");
console.assert(demo.outside === null, "blockScopeDemo.outside failed");
console.assert(format("Alice", 45, 50) === "Name: Alice | Score: 45/50 (90%)", "format failed");
const ml = multiLine(["line1", "line2", "line3"]);
console.assert(ml.includes("\n"), "multiLine failed");
const wc = wordCount("the cat sat on the mat");
console.assert(wc.get("the") === 2 && wc.get("cat") === 1, "wordCount failed");
console.assert(JSON.stringify(uniqueValues([1,2,2,3,3,3])) === "[1,2,3]", "uniqueValues failed");
const inter = setIntersection([1,2,3,4], [2,4,6]);
console.assert(inter.includes(2) && inter.length === 2, "intersection failed");
const union = setUnion([1,2,3], [2,3,4,5]);
console.assert(union.length === 5, "union failed");
console.assert(!Object.keys(item).includes("Symbol(id)"), "Symbol key failed");
console.assert(item[ID_SYMBOL] === 42, "Symbol access failed");

console.log("Solution 2.4 — All assertions passed!");
