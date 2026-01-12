import {
  SearchRequestParams,
  SearchResponseDto,
  SearchResultDto,
} from "@core/searchTypes";
import { SearchResponse } from "@onprem/api/searchResponse";
import { toWebUrl } from "@utils/url";

export function toSearchResponseDto(
  p: SearchRequestParams,
  r: SearchResponse,
  baseUrl: string,
): SearchResponseDto {
  const results = toSearchResultDto(r.results, baseUrl);
  return {
    total: r.totalCount ?? results.length,
    start: r.start ?? p.start,
    limit: r.limit ?? p.limit,
    results,
  };
}

function toSearchResultDto(
  results: SearchResponse["results"],
  baseUrl: string,
): SearchResultDto[] {
  return (
    results
      .map((r) => {
        const id = r.id ?? r.content?.id;
        const title = r.title ?? r.content?.title;

        if (!id || !title) {
          return null;
        }

        return {
          id,
          title,
          type: r.entityType ?? r.content?.type,
          url: toWebUrl(baseUrl, r.url ?? r.resultGlobalContainer?.displayUrl),
          spaceKey: r.space?.key,
          spaceName: r.space?.name,
          excerpt: r.excerpt,
          lastModified: r.lastModified,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null) ?? []
  );
}
