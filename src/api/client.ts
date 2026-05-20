export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export const AUTH_TOKEN_KEY = "ishua_token";
const AUTH_USER_KEY = "ishua_user";

export type Result<T> = {
  code: number;
  message: string;
  data: T;
};

export class ApiError<T = unknown> extends Error {
  code: number;
  data: T | null;
  response: Response;

  constructor(result: Result<T | null>, response: Response) {
    super(result.message || `请求失败：${result.code}`);
    this.name = "ApiError";
    this.code = result.code;
    this.data = result.data;
    this.response = response;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown> | unknown[] | null;
  query?: Record<string, string | number | boolean | null | undefined>;
};

const PUBLIC_ENDPOINTS: Array<{
  method: string;
  pattern: RegExp;
}> = [
  { method: "POST", pattern: /^\/api\/v1\/users\/register$/ },
  { method: "POST", pattern: /^\/api\/v1\/users\/login$/ },
  { method: "GET", pattern: /^\/api\/v1\/question-banks\/public$/ },
  {
    method: "GET",
    pattern: /^\/api\/v1\/question-banks\/[^/]+\/hot-practice-detail$/,
  },
];

export function isPublicEndpoint(pathname: string, method = "GET") {
  const normalizedMethod = method.toUpperCase();

  return PUBLIC_ENDPOINTS.some(
    (endpoint) =>
      endpoint.method === normalizedMethod && endpoint.pattern.test(pathname),
  );
}

function clearAuthStorage() {
  try {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
  } catch {
    // Ignore storage errors.
  }
}

function redirectToLogin() {
  const { pathname, search } = window.location;

  if (pathname === "/login") {
    return;
  }

  const redirect = encodeURIComponent(`${pathname}${search}`);
  window.location.assign(`/login?redirect=${redirect}`);
}

function readToken() {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function createUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(path, API_BASE_URL);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url;
}

function createBodyAndHeaders(
  body: RequestOptions["body"],
  headers: Headers,
) {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (body instanceof FormData || body instanceof Blob) {
    return body;
  }

  headers.set("Content-Type", "application/json");
  return JSON.stringify(body);
}

export async function request<T>(
  path: string,
  { body, headers: initHeaders, method = "GET", query, ...init }: RequestOptions = {},
) {
  const url = createUrl(path, query);
  const headers = new Headers(initHeaders);
  const normalizedMethod = method.toUpperCase();

  if (!isPublicEndpoint(url.pathname, normalizedMethod)) {
    const token = readToken();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...init,
    body: createBodyAndHeaders(body, headers),
    headers,
    method: normalizedMethod,
  });

  const result = (await response.json()) as Result<T | null>;

  if (result.code === 401 && !isPublicEndpoint(url.pathname, normalizedMethod)) {
    clearAuthStorage();
    redirectToLogin();
  }

  if (result.code !== 200) {
    throw new ApiError(result, response);
  }

  return result.data as T;
}
