import {
  SearchRequestParams,
  SearchResponseDto,
  SearchResultDto,
} from "@core/searchTypes";
import { SearchResponse } from "@onprem/searchResponse";

export function toSearchResponseDto(
  p: SearchRequestParams,
  r: SearchResponse,
): SearchResponseDto {
  const results = toSearchResultDto(r.results);
  return {
    total: r.totalCount ?? results.length,
    start: r.start ?? p.start,
    limit: r.limit ?? p.limit,
    results,
  };
}

function toSearchResultDto(
  results: SearchResponse["results"],
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
          url: r.url ?? r.resultGlobalContainer?.displayUrl,
          spaceKey: r.space?.key,
          spaceName: r.space?.name,
          excerpt: r.excerpt,
          lastModified: r.lastModified,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null) ?? []
  );
}
