export function ensureNoTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export function joinUrl(base: string, path: string): string {
  return `${ensureNoTrailingSlash(base)}${path.startsWith("/") ? "" : "/"}${path}`;
}
