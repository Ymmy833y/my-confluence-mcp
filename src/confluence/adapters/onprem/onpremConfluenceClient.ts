import { ConfluenceConfig } from "@config/confluenceConfig";
import { authHeaders } from "@utils/auth";
import { fetchJson } from "@utils/http";
import { joinUrl, joinUrlWithExpand } from "@utils/url";

import type { GetContentResponse } from "./api/getContentResponse";
import { SearchResponse } from "./api/searchResponse";

export class OnPremConfluenceClient {
  constructor(private readonly cfg: ConfluenceConfig) {}

  // On-Prem: 例) /rest/api/search?cql=...&limit=...&start=...
  async searchRaw(params: {
    cql: string;
    limit: number;
    start: number;
  }): Promise<SearchResponse> {
    const url = new URL(joinUrl(this.cfg.baseUrl, "/rest/api/search"));

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
   * On-Prem: 例) /rest/api/content/{id}?expand=space,version,body.storage
   */
  async getContentRaw(params: {
    id: string;
    expand?: string;
  }): Promise<GetContentResponse> {
    const encodedId = encodeURIComponent(params.id);
    const url = new URL(
      joinUrlWithExpand(
        this.cfg.baseUrl,
        `/rest/api/content/${encodedId}`,
        params.expand,
      ),
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
