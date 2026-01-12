import { SearchResponse } from "@cloud/api/searchResponse";
import {
  SearchRequestParams,
  SearchResponseDto,
  SearchResultDto,
} from "@core/searchTypes";
import { logger } from "@utils/logger";
import { toWebUrl } from "@utils/url";

export function toSearchResponseDto(
  p: SearchRequestParams,
  r: SearchResponse,
  baseUrl: string,
): SearchResponseDto {
  const results = toSearchResultDto(r.results, baseUrl);
  return {
    total: r.totalSize ?? results.length,
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
        const id = r.content?.id;
        const title = r.title ?? r.content?.title;

        if (!id || !title) {
          logger.warn(
            `Skip item: missing required fields (id/title): ${JSON.stringify({ id: id, title: title })}`,
          );
          return null;
        }

        return {
          id,
          title,
          type: r.entityType ?? r.content?.type,
          url: toWebUrl(baseUrl, r.url ?? r.resultGlobalContainer?.displayUrl),
          spaceKey: r.content?.space?.key,
          spaceName: r.content?.space?.name,
          excerpt: r.excerpt,
          lastModified: r.lastModified,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null) ?? []
  );
}
