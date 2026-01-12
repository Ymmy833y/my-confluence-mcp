import { ConfluenceConfig } from "@config/confluenceConfig";
import { authHeaders } from "@utils/auth";
import { fetchJson } from "@utils/http";
import { ensureNoTrailingSlash, joinUrl, joinUrlWithExpand } from "@utils/url";

import { GetContentResponse } from "./api/getContentResponse";
import { SearchResponse } from "./api/searchResponse";

// Cloud は baseUrl が https://xxx.atlassian.net/wiki のことも、https://xxx.atlassian.net のこともあるので補正
function cloudWikiBase(baseUrl: string): string {
  const b = ensureNoTrailingSlash(baseUrl);
  return b.endsWith("/wiki") ? b : `${b}/wiki`;
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
  }): Promise<SearchResponse> {
    const base = cloudWikiBase(this.cfg.baseUrl);
    const url = new URL(joinUrl(base, "/rest/api/search"));

    url.searchParams.set("cql", params.cql);
    url.searchParams.set("limit", String(params.limit));
    url.searchParams.set("start", String(params.start));

    return fetchJson<SearchResponse>(
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

  /**
   * Cloud: 例) /wiki/rest/api/content/{id}?expand=space,version,body.storage
   */
  async getContentRaw(params: {
    id: string;
    expand?: string;
  }): Promise<GetContentResponse> {
    const base = cloudWikiBase(this.cfg.baseUrl);
    const encodedId = encodeURIComponent(params.id);
    const url = new URL(
      joinUrlWithExpand(base, `/rest/api/content/${encodedId}`, params.expand),
    );

    return fetchJson<GetContentResponse>(
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
