// ============================================================================
// Solution 4.1 — Builder Pattern
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
// Type-safe builder using generics to track set fields
// ---------------------------------------------------------------------------

type RequiredFields = "url" | "method" | "headers";

class RequestBuilder<Set extends string = never> {
  private config: Partial<RequestConfig> = {};

  setUrl(url: string): RequestBuilder<Set | "url"> {
    this.config.url = url;
    return this as any;
  }

  setMethod(method: RequestConfig["method"]): RequestBuilder<Set | "method"> {
    this.config.method = method;
    return this as any;
  }

  setHeaders(headers: Record<string, string>): RequestBuilder<Set | "headers"> {
    this.config.headers = headers;
    return this as any;
  }

  setBody(body: string): RequestBuilder<Set | "body"> {
    this.config.body = body;
    return this as any;
  }

  build(this: RequestBuilder<RequiredFields>): RequestConfig;
  build(): RequestConfig {
    if (!this.config.url || !this.config.method || !this.config.headers) {
      throw new Error("Missing required fields: url, method, and headers are required");
    }
    return this.config as RequestConfig;
  }
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------
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

// Without body (optional) — should still work
const config2 = new RequestBuilder()
  .setUrl("https://api.example.com")
  .setMethod("GET")
  .setHeaders({})
  .build();

console.assert(config2.method === "GET", "GET method");

// Should throw without required fields
let threw = false;
try {
  (new RequestBuilder().setUrl("x") as any).build();
} catch {
  threw = true;
}
console.assert(threw, "should throw without required fields");

console.log("Solution 4.1 — All assertions passed!");

export {};
