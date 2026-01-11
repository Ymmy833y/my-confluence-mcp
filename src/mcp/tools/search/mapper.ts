import { SearchRequestParams, SearchResponseDto } from "@core/searchTypes";

import { SearchToolOutput } from "./types";
import { SearchToolInput } from "./types";

export function toSearchRequestParams(
  input: SearchToolInput,
): SearchRequestParams {
  return {
    cql: input.cql,
    limit: input.limit,
    start: input.start,
  };
}

export function toToolOutput(response: SearchResponseDto): SearchToolOutput {
  return {
    results: response.results.map((r): SearchToolOutput["results"][number] => {
      return {
        id: r.id,
        title: r.title,

        type: r.type ?? null,
        url: r.url ?? null,

        spaceKey: r.spaceKey ?? null,
        spaceName: r.spaceName ?? null,

        excerpt: r.excerpt ?? null,
        lastModified: r.lastModified ?? null,
      };
    }),
    page: {
      total: response.total,
      start: response.start,
      limit: response.limit,
    },
  };
}
