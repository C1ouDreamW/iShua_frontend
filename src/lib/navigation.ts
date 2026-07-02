/** 站内路径白名单，防止开放重定向 */
export function sanitizeRedirect(
  raw: string | null | undefined,
  fallback = "/",
): string {
  if (!raw) {
    return fallback;
  }

  let decoded = raw;

  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return fallback;
  }

  if (!decoded.startsWith("/") || decoded.startsWith("//")) {
    return fallback;
  }

  if (decoded.startsWith("/login") || decoded.startsWith("/register")) {
    return fallback;
  }

  return decoded;
}

export function buildLoginRedirect(pathname: string, search = ""): string {
  const target = sanitizeRedirect(`${pathname}${search}`);
  return `/login?redirect=${encodeURIComponent(target)}`;
}

export function buildPracticePath(
  nodeId: number,
  isAuthenticated: boolean,
): string {
  return isAuthenticated
    ? `/app/practice/${nodeId}`
    : `/practice/guest/${nodeId}`;
}

export function buildRecitePath(
  nodeId: number,
  isAuthenticated: boolean,
): string {
  return isAuthenticated
    ? `/app/recite/${nodeId}`
    : `/recite/guest/${nodeId}`;
}
