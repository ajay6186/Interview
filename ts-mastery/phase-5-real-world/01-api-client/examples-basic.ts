export {};

// ============================================================
// BASIC EXAMPLES — API Client (50 Examples)
// ============================================================

// 1. Simple fetch wrapper with typed response
async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  return res.json() as Promise<T>;
}

// 2. Typed User response shape
interface User { id: number; name: string; email: string; }
async function getUser(id: number): Promise<User> {
  return fetchJson<User>(`/api/users/${id}`);
}

// 3. HTTP method type
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// 4. Typed request options
interface RequestOptions {
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: string;
}

// 5. Base API response wrapper
interface ApiResponse<T> { data: T; status: number; message: string; }

// 6. GET request helper
async function get<T>(url: string): Promise<ApiResponse<T>> {
  const res = await fetch(url);
  const data = await res.json();
  return { data, status: res.status, message: res.statusText };
}

// 7. POST request helper
async function post<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { data, status: res.status, message: res.statusText };
}

// 8. Error response type
interface ApiError { code: string; message: string; details?: string; }

// 9. Result type — success or error
type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

// 10. Safe fetch returning ApiResult
async function safeFetch<T>(url: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url);
    if (!res.ok) return { ok: false, error: { code: String(res.status), message: res.statusText } };
    const data: T = await res.json();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: { code: "NETWORK_ERROR", message: String(e) } };
  }
}

// 11. Typed paginated response
interface PaginatedResponse<T> { items: T[]; total: number; page: number; pageSize: number; }

// 12. Fetch paginated list
async function fetchList<T>(url: string, page = 1, pageSize = 10): Promise<PaginatedResponse<T>> {
  return fetchJson<PaginatedResponse<T>>(`${url}?page=${page}&pageSize=${pageSize}`);
}

// 13. Headers map type
type Headers = Record<string, string>;

// 14. Auth token header helper
function authHeader(token: string): Headers {
  return { Authorization: `Bearer ${token}` };
}

// 15. Merge headers
function mergeHeaders(...headerMaps: Headers[]): Headers {
  return Object.assign({}, ...headerMaps);
}

// 16. Typed query params
type QueryParams = Record<string, string | number | boolean>;
function buildQueryString(params: QueryParams): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
}

// 17. URL builder
function buildUrl(base: string, path: string, params?: QueryParams): string {
  const qs = params ? `?${buildQueryString(params)}` : "";
  return `${base}${path}${qs}`;
}

// 18. Simple API client class
class ApiClient {
  constructor(private baseUrl: string, private token?: string) {}
  private headers(): Headers {
    return this.token ? authHeader(this.token) : {};
  }
  async get<T>(path: string): Promise<T> {
    const res = await fetch(buildUrl(this.baseUrl, path), { headers: this.headers() });
    return res.json();
  }
}

// 19. PUT request helper
async function put<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { data: await res.json(), status: res.status, message: res.statusText };
}

// 20. DELETE request helper
async function del(url: string): Promise<{ status: number }> {
  const res = await fetch(url, { method: "DELETE" });
  return { status: res.status };
}

// 21. PATCH request helper
async function patch<T>(url: string, body: Partial<T>): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { data: await res.json(), status: res.status, message: res.statusText };
}

// 22. Typed Post model
interface Post { id: number; title: string; body: string; userId: number; }

// 23. Fetch all posts
async function getAllPosts(): Promise<Post[]> {
  return fetchJson<Post[]>("/api/posts");
}

// 24. Create post payload type
type CreatePostPayload = Omit<Post, "id">;

// 25. Create post
async function createPost(payload: CreatePostPayload): Promise<Post> {
  const result = await post<Post>("/api/posts", payload);
  return result.data;
}

// 26. Update post payload — all fields optional except id
type UpdatePostPayload = Partial<Omit<Post, "id">>;

// 27. Update post
async function updatePost(id: number, payload: UpdatePostPayload): Promise<Post> {
  const result = await patch<Post>(`/api/posts/${id}`, payload);
  return result.data;
}

// 28. Typed 404 Not Found error
const notFoundError: ApiError = { code: "NOT_FOUND", message: "Resource not found" };

// 29. Typed 401 Unauthorized error
const unauthorizedError: ApiError = { code: "UNAUTHORIZED", message: "Authentication required" };

// 30. Check response status
function isSuccess(status: number): boolean {
  return status >= 200 && status < 300;
}

// 31. Typed response status categories
type StatusCategory = "success" | "redirect" | "client-error" | "server-error";
function categorizeStatus(status: number): StatusCategory {
  if (status < 300) return "success";
  if (status < 400) return "redirect";
  if (status < 500) return "client-error";
  return "server-error";
}

// 32. Typed fetch with timeout
async function fetchWithTimeout<T>(url: string, ms: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

// 33. Retry helper type
type RetryOptions = { retries: number; delayMs: number };

// 34. Simple retry fetch
async function fetchWithRetry<T>(url: string, opts: RetryOptions): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i <= opts.retries; i++) {
    try { return await fetchJson<T>(url); }
    catch (e) {
      lastError = e;
      if (i < opts.retries) await new Promise(r => setTimeout(r, opts.delayMs));
    }
  }
  throw lastError;
}

// 35. Typed response interceptor
type ResponseInterceptor<T> = (res: ApiResponse<T>) => ApiResponse<T>;

// 36. Logging interceptor
const loggingInterceptor: ResponseInterceptor<unknown> = (res) => {
  console.log(`[API] Status: ${res.status}`);
  return res;
};

// 37. Typed request interceptor
type RequestInterceptor = (opts: RequestOptions) => RequestOptions;

// 38. Add auth token via request interceptor
function createAuthInterceptor(token: string): RequestInterceptor {
  return (opts) => ({
    ...opts,
    headers: { ...opts.headers, Authorization: `Bearer ${token}` },
  });
}

// 39. Content-Type JSON header constant
const JSON_HEADERS: Headers = { "Content-Type": "application/json", Accept: "application/json" };

// 40. Typed endpoint enum
const Endpoints = {
  USERS: "/api/users",
  POSTS: "/api/posts",
  COMMENTS: "/api/comments",
} as const;
type Endpoint = (typeof Endpoints)[keyof typeof Endpoints];

// 41. Typed Comment model
interface Comment { id: number; postId: number; body: string; email: string; }

// 42. Fetch comments by post
async function getCommentsByPost(postId: number): Promise<Comment[]> {
  return fetchJson<Comment[]>(`${Endpoints.COMMENTS}?postId=${postId}`);
}

// 43. Typed list response with metadata
interface ListMeta { total: number; page: number; perPage: number; lastPage: number; }
interface ListResponse<T> { data: T[]; meta: ListMeta; }

// 44. Fetch users list with metadata
async function getUsersList(page = 1): Promise<ListResponse<User>> {
  return fetchJson<ListResponse<User>>(`${Endpoints.USERS}?page=${page}`);
}

// 45. Typed search params
interface SearchParams { q: string; page?: number; limit?: number; }

// 46. Search users
async function searchUsers(params: SearchParams): Promise<User[]> {
  const qs = buildQueryString(params as QueryParams);
  return fetchJson<User[]>(`${Endpoints.USERS}/search?${qs}`);
}

// 47. Upload file type
interface UploadResponse { url: string; size: number; name: string; }

// 48. Upload file fetch
async function uploadFile(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  return res.json();
}

// 49. Typed batch request
async function batchFetch<T>(urls: string[]): Promise<T[]> {
  return Promise.all(urls.map(url => fetchJson<T>(url)));
}

// 50. Simple client factory
function createClient(baseUrl: string, token?: string): ApiClient {
  return new ApiClient(baseUrl, token);
}
