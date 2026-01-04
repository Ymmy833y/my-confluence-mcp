import {
  ConfluenceGateway,
  SearchParams,
  SearchResultPage,
} from "@confluence/core/confluenceGateway";

import { CloudConfluenceClient } from "./cloudConfluenceClient";

function toWebUrl(baseUrl: string, webui?: string): string | null {
  if (!webui) return null;

  // webui が "/spaces/..." みたいな相対のことがあるので baseUrl にぶら下げる
  const base = baseUrl.replace(/\/+$/, "");
  if (webui.startsWith("http://") || webui.startsWith("https://")) return webui;
  return `${base}${webui.startsWith("/") ? "" : "/"}${webui}`;
}

export class CloudGateway implements ConfluenceGateway {
  constructor(
    private readonly client: CloudConfluenceClient,
    private readonly baseUrl: string,
  ) {}

  async search(params: SearchParams): Promise<SearchResultPage> {
    const limit = params.limit ?? 25;
    const start = params.start ?? 0;

    const raw = await this.client.searchRaw({ cql: params.cql, limit, start });

    const results =
      raw.results
        ?.map((r) => {
          const c = r.content;
          const id = c?.id ?? ""; // 取れないケースは後で調整
          const title = c?.title ?? r.title ?? "";
          const url = toWebUrl(this.baseUrl, c?._links?.webui ?? r.url);
          const spaceKey = c?.space?.key;
          const updated = c?.version?.when;
          const excerpt = r.excerpt;

          if (!id || !title) return null;

          return { id, title, url, spaceKey, updated, excerpt };
        })
        ?.filter((x): x is NonNullable<typeof x> => x !== null) ?? [];

    return {
      total: raw.totalSize ?? results.length,
      start: raw.start ?? start,
      limit: raw.limit ?? limit,
      results,
    };
  }
}
