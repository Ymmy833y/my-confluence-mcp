import { ConfluenceAuth, ConfluenceConfig } from "@config/confluenceConfig";
import { ensureNoTrailingSlash, joinUrl } from "@utils/url";

type CloudSearchResponse = {
  totalSize?: number;
  size?: number;
  limit?: number;
  start?: number;
  results?: Array<{
    content?: {
      id?: string;
      title?: string;
      _links?: { webui?: string; self?: string };
      space?: { key?: string };
      version?: { when?: string };
    };
    title?: string;
    excerpt?: string;
    url?: string; // 場合によってはある
  }>;
  _links?: { base?: string; context?: string };
};

// Cloud は baseUrl が https://xxx.atlassian.net/wiki のことも、https://xxx.atlassian.net のこともあるので補正
function cloudWikiBase(baseUrl: string): string {
  const b = ensureNoTrailingSlash(baseUrl);
  return b.endsWith("/wiki") ? b : `${b}/wiki`;
}

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

export class CloudConfluenceClient {
  constructor(private readonly cfg: ConfluenceConfig) {}

  /**
   * Cloud: 例) /wiki/rest/api/search?cql=...&limit=...&start=...
   */
  async searchRaw(params: {
    cql: string;
    limit: number;
    start: number;
  }): Promise<CloudSearchResponse> {
    const base = cloudWikiBase(this.cfg.baseUrl);
    const url = new URL(joinUrl(base, "/rest/api/search"));

    url.searchParams.set("cql", params.cql);
    url.searchParams.set("limit", String(params.limit));
    url.searchParams.set("start", String(params.start));

    // 必要になったらここで expand を増やす
    // url.searchParams.set("expand", "content.space,content.version");

    return fetchJson<CloudSearchResponse>(
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
