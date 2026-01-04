import { logger } from "./logger";

export async function fetchJson<T>(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<T> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...init, signal: ac.signal });

    logger.debug(
      `[fetchJson] response:, ${JSON.stringify({
        url,
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        redirected: res.redirected,
        type: res.type,
        contentType: res.headers.get("content-type"),
        contentLength: res.headers.get("content-length"),
      })}`,
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
    }

    const data = (await res.json()) as T;
    logger.debug(`[fetchJson] response body:, ${JSON.stringify(data)}`);
    return data;
  } finally {
    clearTimeout(t);
  }
}
