import {
  ConfluenceGateway,
  SearchParams,
  SearchResultPage,
} from "@confluence/core/confluenceGateway";

import { OnPremConfluenceClient } from "./onpremConfluenceClient";

function absoluteUrlMaybe(baseUrl: string, url?: string): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  const base = baseUrl.replace(/\/+$/, "");
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

function stableIdFromUrl(url: string | null): string | null {
  if (!url) return null;
  // オンプレの search 結果は id が無いことがある（らしい）ので暫定IDを生成
  // 例: .../display/SPACEKEY/Page+Title
  return `url:${url}`;
}

export class OnPremGateway implements ConfluenceGateway {
  constructor(
    private readonly client: OnPremConfluenceClient,
    private readonly baseUrl: string,
  ) {}

  async search(params: SearchParams): Promise<SearchResultPage> {
    const limit = params.limit ?? 25;
    const start = params.start ?? 0;

    const raw = await this.client.searchRaw({ cql: params.cql, limit, start });

    const results =
      raw.results
        ?.map((r) => {
          const url = absoluteUrlMaybe(
            this.baseUrl,
            r.url ??
              r.resultParentContainer?.displayUrl ??
              r.resultGlobalContainer?.displayUrl,
          );
          const id = stableIdFromUrl(url);
          const title = r.title ?? "";

          if (!id || !title) return null;

          return {
            id,
            title,
            url,
            spaceKey: undefined,
            updated: r.lastModified,
            excerpt: r.excerpt,
          };
        })
        ?.filter((x): x is NonNullable<typeof x> => x !== null) ?? [];

    return {
      total: raw.totalCount ?? results.length,
      start: raw.start ?? start,
      limit: raw.limit ?? limit,
      results,
    };
  }
}
