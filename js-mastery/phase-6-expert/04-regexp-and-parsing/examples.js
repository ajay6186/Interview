// ============================================================================
// Examples 6.4 — RegExp & Parsing  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================
"use strict";

// ─── BASIC (1–13) ────────────────────────────────────────────────────────────

/** test: check if string matches pattern */
function ex01() {
  const re = /^\d{4}-\d{2}-\d{2}$/;
  console.log("Ex01 — test:", re.test("2024-03-15"), re.test("not-a-date"));
}

/** match: extract matches from string */
function ex02() {
  const str = "The price is $12.99 and $5.50";
  const matches = str.match(/\$\d+\.\d+/g);
  console.log("Ex02 — match:", matches);
}

/** replace: replace first/all matches */
function ex03() {
  const str = "foo bar foo baz foo";
  const once = str.replace("foo", "qux");
  const all = str.replace(/foo/g, "qux");
  console.log("Ex03 — replace once:", once);
  console.log("Ex03 — replace all:", all);
}

/** split with regex: split on multiple delimiters */
function ex04() {
  const csv = "one,two;three|four::five";
  const parts = csv.split(/[,;|:]+/);
  console.log("Ex04 — split regex:", parts);
}

/** global flag: find all occurrences */
function ex05() {
  const text = "cat, bat, sat, hat, mat";
  const rhymes = text.match(/\b\w+at\b/g);
  console.log("Ex05 — global flag matches:", rhymes);
}

/** case-insensitive: i flag */
function ex06() {
  const html = "Hello WORLD hello World";
  const matches = html.match(/hello/gi);
  console.log("Ex06 — case-insensitive:", matches);
}

/** multiline: m flag — ^ and $ match line boundaries */
function ex07() {
  const lines = "first line\nsecond line\nthird line";
  const lineStarts = lines.match(/^\w+/gm);
  console.log("Ex07 — multiline starts:", lineStarts);
}

/** anchors: ^ and $ for full-string match */
function ex08() {
  const isHex = str => /^#[0-9a-fA-F]{6}$/.test(str);
  console.log("Ex08 — anchors hex:", isHex("#ff0099"), isHex("#ff009"), isHex("ff0099"));
}

/** character classes: \d \w \s and negations */
function ex09() {
  const str = "Hello World 123!";
  console.log("Ex09 — \\d:", str.match(/\d+/g));
  console.log("Ex09 — \\W:", str.match(/\W+/g));
  console.log("Ex09 — \\s:", str.match(/\s+/g));
}

/** quantifiers: +, *, ?, {n,m} */
function ex10() {
  const tests = ["color", "colour", "colouur", "colr"];
  tests.forEach(t => {
    const match = /colou?r/.test(t);
    console.log(`Ex10 — '${t}' matches colou?r:`, match);
  });
}

/** character set: [abc] and ranges [a-z] */
function ex11() {
  const isVowel = c => /^[aeiou]$/i.test(c);
  const str = "Hello";
  const vowels = str.split("").filter(isVowel);
  console.log("Ex11 — vowels in Hello:", vowels);
}

/** alternation: a|b patterns */
function ex12() {
  const re = /\b(cat|dog|bird)\b/gi;
  const text = "I have a Cat and a Dog. My bird flew away.";
  const animals = text.match(re);
  console.log("Ex12 — alternation:", animals);
}

/** dot and escaping: . matches any except newline */
function ex13() {
  const re = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
  const ip = "Server at 192.168.1.100 is online";
  const match = ip.match(re);
  console.log("Ex13 — IP address:", match && match[0]);
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────────────────────

/** groups and capturing: (group) syntax */
function ex14() {
  const re = /(\d{4})-(\d{2})-(\d{2})/;
  const match = "Date: 2024-03-15".match(re);
  if (match) {
    const [, year, month, day] = match;
    console.log("Ex14 — capture groups:", year, month, day);
  }
}

/** non-capturing groups: (?:) */
function ex15() {
  const re = /(?:https?|ftp):\/\/([^\s/]+)/;
  const url = "Visit https://example.com/path";
  const match = url.match(re);
  console.log("Ex15 — non-capturing group host:", match && match[1]);
}

/** named groups: (?<name>) */
function ex16() {
  const re = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
  const match = re.exec("2024-03-15");
  console.log("Ex16 — named groups:", match && match.groups);
}

/** backreferences: \1 refers to capture group 1 */
function ex17() {
  const re = /\b(\w+)\s+\1\b/;
  console.log("Ex17 — backreference (dup word):", re.test("the the cat"), re.test("hello world"));
}

/** non-greedy quantifiers: *? +? */
function ex18() {
  const html = "<b>bold</b> and <i>italic</i>";
  const greedy = html.match(/<.+>/g);
  const nonGreedy = html.match(/<.+?>/g);
  console.log("Ex18 — greedy:", greedy);
  console.log("Ex18 — non-greedy:", nonGreedy);
}

/** lookahead (?=...): positive lookahead */
function ex19() {
  const prices = "Price: $100 Discount: $20 Total: $80";
  // Match numbers followed by (no space) end of string or another $ context
  const amounts = prices.match(/\d+(?=\b)/g);
  console.log("Ex19 — lookahead numbers:", amounts);
}

/** negative lookahead (?!...): must NOT be followed by */
function ex20() {
  const text = "color colour colored colouring";
  // Match 'color' not followed by 'e' (so just bare 'color' and 'colour')
  const matches = text.match(/colou?r(?!e)/g);
  console.log("Ex20 — negative lookahead:", matches);
}

/** lookbehind (?<=...): positive lookbehind */
function ex21() {
  const text = "USD100 EUR200 GBP300 USD150";
  const usdAmounts = text.match(/(?<=USD)\d+/g);
  console.log("Ex21 — lookbehind USD amounts:", usdAmounts);
}

/** negative lookbehind (?<!...): must NOT be preceded by */
function ex22() {
  const text = "123 $456 789 $012";
  // Match numbers NOT preceded by $
  const nonPrices = text.match(/(?<!\$)\b\d+\b/g);
  console.log("Ex22 — negative lookbehind (no $):", nonPrices);
}

/** sticky flag (y): match at lastIndex position */
function ex23() {
  const re = /\w+/y;
  const str = "hello world";
  re.lastIndex = 6;
  const match = re.exec(str);
  console.log("Ex23 — sticky flag:", match && match[0], "lastIndex after:", re.lastIndex);
}

/** unicode flag (u): handle Unicode code points */
function ex24() {
  const emoji = "Hello 😀 World 🎉!";
  const emojiMatches = emoji.match(/\p{Emoji}/gu);
  console.log("Ex24 — unicode emoji:", emojiMatches);
}

/** dotAll flag (s): . matches newlines too */
function ex25() {
  const html = "<p>\n  Hello World\n</p>";
  const withoutS = html.match(/<p>(.+)<\/p>/);
  const withS = html.match(/<p>(.+)<\/p>/s);
  console.log("Ex25 — dotAll without s:", withoutS && withoutS[1]);
  console.log("Ex25 — dotAll with s:", withS && withS[1].trim());
}

/** hasIndices flag (d): provides start/end indices of groups */
function ex26() {
  const re = /(?<word>\w+)/d;
  const match = re.exec("hello world");
  if (match && match.indices) {
    console.log("Ex26 — hasIndices:", match[0], "at", match.indices[0]);
  } else {
    console.log("Ex26 — hasIndices: indices =", match && match.indices);
  }
}

// ─── NESTED (27–38) ──────────────────────────────────────────────────────────

/** replace with function: dynamic replacement */
function ex27() {
  const template = "Hello, {name}! You have {count} messages.";
  const data = { name: "Alice", count: 5 };
  const result = template.replace(/\{(\w+)\}/g, (_, key) => data[key] ?? `{${key}}`);
  console.log("Ex27 — replace with fn:", result);
}

/** matchAll: get all match objects with groups */
function ex28() {
  const re = /(?<word>\b\w{4,}\b)/g;
  const str = "The quick brown fox jumps over the lazy dog";
  const longWords = [...str.matchAll(re)].map(m => m.groups.word);
  console.log("Ex28 — matchAll long words:", longWords);
}

/** exec in loop: manual iteration for complex scenarios */
function ex29() {
  const re = /(\w+)=(\w+)/g;
  const str = "a=1&b=2&c=3";
  const params = {};
  let match;
  while ((match = re.exec(str)) !== null) {
    params[match[1]] = match[2];
  }
  console.log("Ex29 — exec loop params:", params);
}

/** email validator: RFC-ish email validation */
function ex30() {
  function isValidEmail(str) {
    return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(str);
  }
  const emails = ["user@example.com", "bad@", "a.b+c@foo.co.uk", "@nouser.com", "plain"];
  emails.forEach(e => console.log(`Ex30 — email '${e}':`, isValidEmail(e)));
}

/** URL parser regex: extract protocol, host, path */
function ex31() {
  function parseURL(url) {
    const re = /^(?<protocol>https?|ftp):\/\/(?<host>[^\/\?#]+)(?<path>\/[^\?#]*)?(?:\?(?<query>[^#]*))?(?:#(?<hash>.*))?$/;
    const m = re.exec(url);
    return m ? m.groups : null;
  }
  const result = parseURL("https://example.com/path/to/page?q=hello&lang=en#section");
  console.log("Ex31 — URL parser:", result);
}

/** date parser regex: parse various date formats */
function ex32() {
  function parseFlexDate(str) {
    const patterns = [
      { re: /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/, fmt: "ISO" },
      { re: /^(?<month>\d{2})\/(?<day>\d{2})\/(?<year>\d{4})$/, fmt: "US" },
      { re: /^(?<day>\d{2})\.(?<month>\d{2})\.(?<year>\d{4})$/, fmt: "EU" }
    ];
    for (const { re, fmt } of patterns) {
      const m = re.exec(str);
      if (m) return { ...m.groups, format: fmt };
    }
    return null;
  }
  ["2024-03-15", "03/15/2024", "15.03.2024"].forEach(d => {
    console.log("Ex32 — flex date:", d, "→", parseFlexDate(d));
  });
}

/** simple tokenizer: tokenize arithmetic expressions */
function ex33() {
  function tokenize(expr) {
    const tokens = [];
    const re = /\s*(\d+(?:\.\d+)?|[a-zA-Z_]\w*|[+\-*/^%=<>!&|]+|[(),;{}[\]])\s*/g;
    let m;
    while ((m = re.exec(expr)) !== null) {
      const value = m[1];
      let type = "unknown";
      if (/^\d/.test(value)) type = "number";
      else if (/^[a-zA-Z_]/.test(value)) type = "identifier";
      else if (/^[+\-*/^%=<>!&|]+$/.test(value)) type = "operator";
      else type = "punctuation";
      tokens.push({ type, value });
    }
    return tokens;
  }
  const tokens = tokenize("x = 3 * (y + 2)");
  console.log("Ex33 — tokenizer:", tokens.map(t => `${t.type}:${t.value}`).join(" "));
}

/** markdown inline parser: parse bold/italic/code */
function ex34() {
  function parseInlineMarkdown(text) {
    return text
      .replace(/`([^`]+)`/g, (_, code) => `<code>${code}</code>`)
      .replace(/\*\*([^*]+)\*\*/g, (_, bold) => `<strong>${bold}</strong>`)
      .replace(/\*([^*]+)\*/g, (_, italic) => `<em>${italic}</em>`);
  }
  const md = "Hello **world**, this is *italic* and `code`!";
  console.log("Ex34 — markdown inline:", parseInlineMarkdown(md));
}

/** CSV parser: handle quoted fields and commas */
function ex35() {
  function parseCSVLine(line) {
    const fields = [];
    const re = /("(?:[^"]|"")*"|[^,]*)(,|$)/g;
    let m;
    while ((m = re.exec(line)) !== null) {
      let field = m[1];
      if (field.startsWith('"') && field.endsWith('"')) {
        field = field.slice(1, -1).replace(/""/g, '"');
      }
      fields.push(field);
      if (!m[2]) break;
    }
    return fields;
  }
  const row = `Alice,"Smith, Jr.",30,"He said ""hello"""`;
  console.log("Ex35 — CSV parser:", parseCSVLine(row));
}

/** query string parser: parse URL query parameters */
function ex36() {
  function parseQueryString(qs) {
    const params = {};
    const re = /([^&=]+)=([^&]*)/g;
    let m;
    while ((m = re.exec(qs)) !== null) {
      params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
    }
    return params;
  }
  const qs = "name=Alice&age=30&city=New%20York&active=true";
  console.log("Ex36 — query string:", parseQueryString(qs));
}

/** log file parser: extract structured data from log lines */
function ex37() {
  function parseLogLine(line) {
    const re = /^\[(?<timestamp>[^\]]+)\]\s+(?<level>INFO|WARN|ERROR)\s+(?<message>.+)$/;
    const m = re.exec(line);
    return m ? m.groups : null;
  }
  const logs = [
    "[2024-03-15 10:23:45] INFO Server started on port 3000",
    "[2024-03-15 10:24:01] WARN Memory usage high: 85%",
    "[2024-03-15 10:24:30] ERROR Database connection failed"
  ];
  logs.forEach(line => console.log("Ex37 — log parse:", parseLogLine(line)));
}

/** phone number normalizer: various formats to standard */
function ex38() {
  function normalizePhone(phone) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
    if (digits.length === 11 && digits[0] === "1") return `+1 (${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
    return phone; // unrecognized format
  }
  const numbers = ["555-123-4567", "(555) 123-4567", "5551234567", "1-555-123-4567", "+1 (555) 123-4567"];
  numbers.forEach(n => console.log("Ex38 — normalize phone:", n, "→", normalizePhone(n)));
}

// ─── ADVANCED (39–50) ────────────────────────────────────────────────────────

/** recursive descent parser concept: parse simple expressions */
function ex39() {
  // Grammar: expr = term (('+' | '-') term)*; term = factor (('*' | '/') factor)*; factor = NUMBER | '(' expr ')'
  function parse(tokens) {
    let pos = 0;
    function peek() { return tokens[pos]; }
    function consume() { return tokens[pos++]; }
    function parseNumber() {
      const tok = consume();
      if (!tok || tok.type !== "number") throw new Error("Expected number");
      return parseFloat(tok.value);
    }
    function parseFactor() {
      if (peek() && peek().type === "paren" && peek().value === "(") {
        consume(); // (
        const val = parseExpr();
        consume(); // )
        return val;
      }
      return parseNumber();
    }
    function parseTerm() {
      let left = parseFactor();
      while (peek() && peek().type === "operator" && /[*/]/.test(peek().value)) {
        const op = consume().value;
        const right = parseFactor();
        left = op === "*" ? left * right : left / right;
      }
      return left;
    }
    function parseExpr() {
      let left = parseTerm();
      while (peek() && peek().type === "operator" && /[+\-]/.test(peek().value)) {
        const op = consume().value;
        const right = parseTerm();
        left = op === "+" ? left + right : left - right;
      }
      return left;
    }
    return parseExpr();
  }

  function tokenize(expr) {
    const tokens = [];
    const re = /\s*(\d+(?:\.\d+)?|[+\-*/]|[()])\s*/g;
    let m;
    while ((m = re.exec(expr)) !== null) {
      const v = m[1];
      tokens.push({ type: /^\d/.test(v) ? "number" : /[+\-*/]/.test(v) ? "operator" : "paren", value: v });
    }
    return tokens;
  }

  const exprs = ["2 + 3 * 4", "(2 + 3) * 4", "10 / 2 - 3"];
  exprs.forEach(e => console.log(`Ex39 — parser '${e}' =`, parse(tokenize(e))));
}

/** PEG parser concept: Parsing Expression Grammar style */
function ex40() {
  function createParser(input) {
    let pos = 0;
    const skipWs = () => { while (pos < input.length && /\s/.test(input[pos])) pos++; };
    const match = re => {
      skipWs();
      const m = input.slice(pos).match(re);
      if (m && m.index === 0) { pos += m[0].length; return m[0]; }
      return null;
    };
    function parseExpr() {
      let left = parseTerm();
      let op;
      while ((op = match(/^[+\-]/))) {
        const right = parseTerm();
        left = op === "+" ? left + right : left - right;
      }
      return left;
    }
    function parseTerm() {
      let left = parsePrimary();
      let op;
      while ((op = match(/^[*/]/))) {
        const right = parsePrimary();
        left = op === "*" ? left * right : left / right;
      }
      return left;
    }
    function parsePrimary() {
      if (match(/^\(/)) { const v = parseExpr(); match(/^\)/); return v; }
      const num = match(/^\d+(\.\d+)?/);
      if (num !== null) return parseFloat(num);
      throw new Error(`Unexpected char at ${pos}: '${input[pos]}'`);
    }
    return { parse: parseExpr };
  }
  const exprs = ["1 + 2 * 3", "(4 - 1) * (2 + 3)", "100 / (5 * 4)"];
  exprs.forEach(e => console.log(`Ex40 — PEG parser '${e}' =`, createParser(e).parse()));
}

/** tokenizer for mini language: keywords + identifiers + literals */
function ex41() {
  const KEYWORDS = new Set(["if", "else", "while", "return", "let", "const", "function"]);
  function tokenizeLang(src) {
    const tokens = [];
    const re = /(\s+|\/\/[^\n]*|\d+(?:\.\d+)?|"[^"]*"|'[^']*'|[a-zA-Z_]\w*|[+\-*/=<>!&|]+|[(){},;[\].])/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      const v = m[1];
      if (/^\s/.test(v) || v.startsWith("//")) continue;
      let type;
      if (/^\d/.test(v)) type = "NUMBER";
      else if (v.startsWith('"') || v.startsWith("'")) type = "STRING";
      else if (/^[a-zA-Z_]/.test(v)) type = KEYWORDS.has(v) ? "KEYWORD" : "IDENT";
      else if (/^[+\-*/=<>!&|]+$/.test(v)) type = "OP";
      else type = "PUNCT";
      tokens.push({ type, value: v });
    }
    return tokens;
  }
  const src = `function add(x, y) { return x + y; }`;
  const tokens = tokenizeLang(src);
  console.log("Ex41 — language tokenizer:", tokens.map(t => `${t.type}(${t.value})`).join(" "));
}

/** AST builder for expressions: build expression tree */
function ex42() {
  function buildAST(tokens) {
    let pos = 0;
    const peek = () => tokens[pos];
    const consume = () => tokens[pos++];
    function primary() {
      const tok = consume();
      if (tok.type === "number") return { type: "Literal", value: parseFloat(tok.value) };
      if (tok.type === "paren" && tok.value === "(") {
        const node = expr();
        consume(); // ")"
        return node;
      }
      throw new Error("Unexpected token");
    }
    function term() {
      let node = primary();
      while (peek() && peek().type === "operator" && /[*/]/.test(peek().value)) {
        const op = consume().value;
        node = { type: "BinaryExpr", op, left: node, right: primary() };
      }
      return node;
    }
    function expr() {
      let node = term();
      while (peek() && peek().type === "operator" && /[+\-]/.test(peek().value)) {
        const op = consume().value;
        node = { type: "BinaryExpr", op, left: node, right: term() };
      }
      return node;
    }
    return expr();
  }
  function tokenize(src) {
    const re = /\s*(\d+(?:\.\d+)?|[+\-*/]|[()])\s*/g, toks = []; let m;
    while ((m = re.exec(src)) !== null) {
      const v = m[1]; toks.push({ type: /^\d/.test(v) ? "number" : /[+\-*/]/.test(v) ? "operator" : "paren", value: v });
    }
    return toks;
  }
  const ast = buildAST(tokenize("2 + 3 * 4"));
  console.log("Ex42 — AST:", JSON.stringify(ast, null, 2).slice(0, 120));
}

/** expression evaluator (arithmetic): evaluate from string */
function ex43() {
  function evaluate(expr) {
    function tokenize(src) {
      const re = /\s*(-?\d+(?:\.\d+)?|[+\-*/^()])\s*/g, toks = []; let m;
      while ((m = re.exec(src)) !== null) {
        const v = m[1]; toks.push({ type: /^-?\d/.test(v) ? "number" : /[+\-*/^]/.test(v) ? "op" : "paren", value: v });
      }
      return toks;
    }
    const toks = tokenize(expr);
    let pos = 0;
    const peek = () => toks[pos];
    const consume = () => toks[pos++];
    function primary() {
      if (peek()?.type === "paren" && peek().value === "(") { consume(); const v = addSub(); consume(); return v; }
      const n = parseFloat(consume().value); return n;
    }
    function power() {
      let left = primary();
      if (peek()?.value === "^") { consume(); left = left ** power(); }
      return left;
    }
    function mulDiv() {
      let l = power();
      while (peek()?.type === "op" && /[*/]/.test(peek().value)) { const op = consume().value; l = op === "*" ? l * power() : l / power(); }
      return l;
    }
    function addSub() {
      let l = mulDiv();
      while (peek()?.type === "op" && /[+\-]/.test(peek().value)) { const op = consume().value; l = op === "+" ? l + mulDiv() : l - mulDiv(); }
      return l;
    }
    return addSub();
  }
  ["2 + 3 * 4", "(2 + 3) * 4", "2 ^ 10", "100 / (5 * 4)"].forEach(e => {
    console.log(`Ex43 — evaluate '${e}' =`, evaluate(e));
  });
}

/** template string parser: parse {{variable}} templates */
function ex44() {
  function parseTemplate(template, context) {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path) => {
      const keys = path.split(".");
      let val = context;
      for (const key of keys) val = val?.[key];
      return val !== undefined ? String(val) : `{{${path}}}`;
    });
  }
  const tpl = "Hello, {{user.name}}! You have {{count}} new messages from {{user.email}}.";
  const ctx = { user: { name: "Alice", email: "alice@example.com" }, count: 3 };
  console.log("Ex44 — template parser:", parseTemplate(tpl, ctx));
}

/** markdown inline parser: full inline element support */
function ex45() {
  function parseMarkdown(text) {
    const rules = [
      [/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => `<img src="${src}" alt="${alt}">`],
      [/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => `<a href="${href}">${text}</a>`],
      [/`([^`]+)`/g, (_, code) => `<code>${code}</code>`],
      [/\*\*\*([^*]+)\*\*\*/g, (_, t) => `<strong><em>${t}</em></strong>`],
      [/\*\*([^*]+)\*\*/g, (_, t) => `<strong>${t}</strong>`],
      [/\*([^*]+)\*/g, (_, t) => `<em>${t}</em>`],
      [/~~([^~]+)~~/g, (_, t) => `<del>${t}</del>`]
    ];
    return rules.reduce((str, [re, fn]) => str.replace(re, fn), text);
  }
  const md = "Visit [Google](https://google.com) for **bold** and *italic* and `code` and ~~strikethrough~~.";
  console.log("Ex45 — markdown parser:", parseMarkdown(md));
}

/** JSON partial parser: parse JSON subset (no nesting limit) */
function ex46() {
  function parseJSON(src) {
    let pos = 0;
    const skipWs = () => { while (pos < src.length && /\s/.test(src[pos])) pos++; };
    function parseValue() {
      skipWs();
      const ch = src[pos];
      if (ch === '"') return parseString();
      if (ch === "[") return parseArray();
      if (ch === "{") return parseObject();
      if (ch === "t") { pos += 4; return true; }
      if (ch === "f") { pos += 5; return false; }
      if (ch === "n") { pos += 4; return null; }
      return parseNumber();
    }
    function parseString() {
      let str = "";
      pos++; // opening "
      while (src[pos] !== '"') {
        if (src[pos] === "\\") { pos++; str += src[pos] === "n" ? "\n" : src[pos]; }
        else str += src[pos];
        pos++;
      }
      pos++; // closing "
      return str;
    }
    function parseNumber() {
      const m = src.slice(pos).match(/^-?\d+(\.\d+)?([eE][+-]?\d+)?/);
      if (!m) throw new Error("Expected number at " + pos);
      pos += m[0].length;
      return parseFloat(m[0]);
    }
    function parseArray() {
      const arr = []; pos++; skipWs(); // [
      if (src[pos] === "]") { pos++; return arr; }
      arr.push(parseValue());
      skipWs();
      while (src[pos] === ",") { pos++; arr.push(parseValue()); skipWs(); }
      pos++; // ]
      return arr;
    }
    function parseObject() {
      const obj = {}; pos++; skipWs(); // {
      if (src[pos] === "}") { pos++; return obj; }
      const key = parseString(); skipWs(); pos++; // :
      obj[key] = parseValue(); skipWs();
      while (src[pos] === ",") { pos++; skipWs(); const k = parseString(); skipWs(); pos++; obj[k] = parseValue(); skipWs(); }
      pos++; // }
      return obj;
    }
    return parseValue();
  }
  const json = '{"name":"Alice","age":30,"scores":[95,87,92],"active":true}';
  console.log("Ex46 — JSON parser:", parseJSON(json));
}

/** CSV parser: multi-row CSV with headers */
function ex47() {
  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    const headers = lines[0].split(",").map(h => h.trim());
    return lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim());
      return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
    });
  }
  const csv = `name,age,city
Alice,30,NYC
Bob,25,LA
Carol,35,Chicago`;
  const records = parseCSV(csv);
  console.log("Ex47 — CSV parser:", records);
}

/** query string parser: bidirectional serialize/parse */
function ex48() {
  function parseQS(qs) {
    return Object.fromEntries(
      qs.split("&")
        .filter(Boolean)
        .map(pair => pair.split("=").map(decodeURIComponent))
    );
  }
  function serializeQS(obj) {
    return Object.entries(obj)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
  }
  const qs = "name=Alice+Smith&age=30&city=New%20York";
  const parsed = parseQS(qs);
  console.log("Ex48 — QS parsed:", parsed);
  console.log("Ex48 — QS serialized:", serializeQS({ name: "Bob", role: "admin" }));
}

/** highlight: multiple patterns with different markers */
function ex49() {
  function multiHighlight(text, rules) {
    // rules: [{pattern, wrapper}]
    return rules.reduce((str, { pattern, wrapper }) => {
      return str.replace(pattern, m => wrapper(m));
    }, text);
  }
  const text = "Error: connection refused. Warning: high latency. Info: cache hit.";
  const result = multiHighlight(text, [
    { pattern: /Error:[^.]+/g, wrapper: m => `[ERROR: ${m.slice(7).trim()}]` },
    { pattern: /Warning:[^.]+/g, wrapper: m => `[WARN: ${m.slice(9).trim()}]` },
    { pattern: /Info:[^.]+/g, wrapper: m => `[INFO: ${m.slice(6).trim()}]` }
  ]);
  console.log("Ex49 — multi highlight:", result);
}

/** DSL parser: parse a mini config DSL */
function ex50() {
  function parseConfig(src) {
    const config = {};
    let currentSection = config;
    let currentKey = null;
    const lines = src.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#"));
    for (const line of lines) {
      // Section header: [section]
      const sectionM = line.match(/^\[(\w+)\]$/);
      if (sectionM) { config[sectionM[1]] = {}; currentSection = config[sectionM[1]]; continue; }
      // Key = value (with optional string or number value)
      const kvM = line.match(/^(\w+)\s*=\s*(.+)$/);
      if (kvM) {
        let val = kvM[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        else if (!isNaN(val)) val = Number(val);
        else if (val === "true") val = true;
        else if (val === "false") val = false;
        currentSection[kvM[1]] = val;
      }
    }
    return config;
  }
  const cfg = `
# Database config
[database]
host = "localhost"
port = 5432
name = "mydb"

[server]
port = 3000
debug = true
timeout = 30
  `;
  console.log("Ex50 — config DSL parser:", parseConfig(cfg));
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

function main() {
  console.log("=== BASIC (1–13) ===");
  ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07(); ex08(); ex09(); ex10();
  ex11(); ex12(); ex13();
  console.log("=== INTERMEDIATE (14–26) ===");
  ex14(); ex15(); ex16(); ex17(); ex18(); ex19(); ex20(); ex21(); ex22(); ex23();
  ex24(); ex25(); ex26();
  console.log("=== NESTED (27–38) ===");
  ex27(); ex28(); ex29(); ex30(); ex31(); ex32(); ex33(); ex34(); ex35(); ex36();
  ex37(); ex38();
  console.log("=== ADVANCED (39–50) ===");
  ex39(); ex40(); ex41(); ex42(); ex43(); ex44(); ex45(); ex46(); ex47(); ex48();
  ex49(); ex50();
}

main();
