import { ConfluenceAuth, ConfluenceConfig } from "@config/confluenceConfig";
import { joinUrl } from "@utils/url";

type OnPremSearchResponse = {
  totalCount?: number;
  results?: Array<{
    title?: string;
    excerpt?: string;
    url?: string;
    lastModified?: string;
    resultGlobalContainer?: { title?: string; displayUrl?: string };
    resultParentContainer?: { title?: string; displayUrl?: string };
    entity?: unknown;
  }>;
  start?: number;
  limit?: number;
  size?: number;
};

function authHeaders(auth: ConfluenceAuth): Record<string, string> {
  if (auth.kind === "bearer") return { Authorization: `Bearer ${auth.token}` };
  if (auth.kind === "basic") {
    const token = Buffer.from(`${auth.email}:${auth.apiToken}`).toString(
      "base64",
    );
    return { Authorization: `Basic ${token}` };
  }
  return {};
}

async function fetchJson<T>(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<T> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...init, signal: ac.signal });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

export class OnPremConfluenceClient {
  constructor(private readonly cfg: ConfluenceConfig) {}

  // On-Prem: 例) /rest/api/search?cql=...&limit=...&start=...
  async searchRaw(params: {
    cql: string;
    limit: number;
    start: number;
  }): Promise<OnPremSearchResponse> {
    const url = new URL(joinUrl(this.cfg.baseUrl, "/rest/api/search"));
    url.searchParams.set("cql", params.cql);
    url.searchParams.set("limit", String(params.limit));
    url.searchParams.set("start", String(params.start));

    return fetchJson<OnPremSearchResponse>(
      url.toString(),
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...authHeaders(this.cfg.auth),
        },
      },
      this.cfg.timeoutMs,
    );
  }
}
