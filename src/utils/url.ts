export function ensureNoTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export function joinUrl(base: string, path: string): string {
  return `${ensureNoTrailingSlash(base)}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function joinUrlWithExpand(
  base: string,
  path: string,
  expand?: string,
): string {
  const url = new URL(joinUrl(base, path));
  if (expand && expand.length > 0) {
    url.searchParams.set("expand", expand);
  }
  return url.toString();
}

export function toWebUrl(baseUrl: string, webui?: string): string | undefined {
  if (!webui) return undefined;

  if (/^https?:\/\//i.test(webui)) return webui;

  const base = baseUrl.replace(/\/+$/, "") + "/";
  return new URL(webui.replace(/^\/+/, ""), base).toString();
}
