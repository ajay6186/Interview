// ============================================================================
// Exercise 4.1 — Builder Pattern
// ============================================================================
// Implement a type-safe builder that tracks which properties have been set
// at the type level, ensuring `build()` is only callable when all required
// fields are provided.
//
// Instructions: Fill in every TODO so the file compiles and all assertions pass.
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// Target type
// ---------------------------------------------------------------------------

interface RequestConfig {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers: Record<string, string>;
  body?: string;
}

// ---------------------------------------------------------------------------
// TODO: Implement a RequestBuilder class that:
// - Has methods: setUrl, setMethod, setHeaders, setBody
// - Each setter returns `this` for chaining
// - build() returns a RequestConfig
//
// BONUS (advanced): Use generics to track which fields have been set,
// so build() is only available when url, method, and headers are set.
// ---------------------------------------------------------------------------

// Simple version:
class RequestBuilder {
  private config: Partial<RequestConfig> = {};

  // TODO: implement setUrl(url: string): this

  // TODO: implement setMethod(method: RequestConfig["method"]): this

  // TODO: implement setHeaders(headers: Record<string, string>): this

  // TODO: implement setBody(body: string): this

  // TODO: implement build(): RequestConfig
  // Should throw if url, method, or headers are missing
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------

/*
const config = new RequestBuilder()
  .setUrl("https://api.example.com")
  .setMethod("POST")
  .setHeaders({ "Content-Type": "application/json" })
  .setBody('{"key":"value"}')
  .build();

console.assert(config.url === "https://api.example.com", "url");
console.assert(config.method === "POST", "method");
console.assert(config.headers["Content-Type"] === "application/json", "headers");
console.assert(config.body === '{"key":"value"}', "body");

// Should throw
let threw = false;
try {
  new RequestBuilder().setUrl("x").build();
} catch {
  threw = true;
}
console.assert(threw, "should throw without required fields");
*/

console.log("Exercise 4.1 — All assertions passed!");

export {};
