import { ConfluenceConfig } from "@config/confluenceConfig";
import { authHeaders } from "@utils/auth";
import { fetchJson } from "@utils/http";
import { joinUrl } from "@utils/url";

import { SearchResponse } from "./searchResponse";

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
}
