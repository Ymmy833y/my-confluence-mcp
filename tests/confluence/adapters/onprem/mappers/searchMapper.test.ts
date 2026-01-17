import type { SearchRequestParams, SearchResponseDto } from "@core/searchTypes";
import type { SearchResponse } from "@onprem/api/searchResponse";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@utils/url");

import { toSearchResponseDto } from "@onprem/mappers/searchMapper";
import { toWebUrl } from "@utils/url";

describe("confluence/adapters/onprem/mappers/searchMapper", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("toSearchResponseDto", () => {
    it("start/limit/total のデフォルト値を補完し、無効な result（id/title 欠落）を除外して変換できる", () => {
      // Arrange
      const p = { start: 10, limit: 25 } as unknown as SearchRequestParams;
      const baseUrl = "https://example.com";

      vi.mocked(toWebUrl)
        .mockReturnValueOnce("https://example.com/web/1")
        .mockReturnValueOnce("https://example.com/web/2");

      const r = {
        totalCount: undefined,
        start: undefined,
        limit: undefined,
        results: [
          {
            id: undefined,
            title: "From top-level title",
            entityType: "page",
            url: "/display/AAA/FromUrl",
            space: { key: "AAA", name: "Space AAA" },
            excerpt: "excerpt-1",
            lastModified: "2026-01-01",
            content: {
              id: "C1",
              title: "Content title (unused)",
              type: "page",
            },
          },
          {
            id: "X2",
            title: undefined,
            entityType: "blogpost",
            url: "/display/BBB/MissingTitle",
          },
          {
            id: "X3",
            title: "From top-level title 3",
            entityType: undefined,
            url: undefined,
            resultGlobalContainer: { displayUrl: "/spaces/CCC/pages/123" },
            space: { key: "CCC", name: "Space CCC" },
            excerpt: "excerpt-3",
            lastModified: "2026-01-02",
            content: { id: "C3-unused", title: "C3-unused", type: "blogpost" },
          },
        ],
      } as unknown as SearchResponse;

      // Act
      const actual = toSearchResponseDto(p, r, baseUrl);

      // Assert
      expect(actual).toEqual({
        total: 2,
        start: 10,
        limit: 25,
        results: [
          {
            id: "C1",
            title: "From top-level title",
            type: "page",
            url: "https://example.com/web/1",
            spaceKey: "AAA",
            spaceName: "Space AAA",
            excerpt: "excerpt-1",
            lastModified: "2026-01-01",
          },
          {
            id: "X3",
            title: "From top-level title 3",
            type: "blogpost",
            url: "https://example.com/web/2",
            spaceKey: "CCC",
            spaceName: "Space CCC",
            excerpt: "excerpt-3",
            lastModified: "2026-01-02",
          },
        ],
      } satisfies SearchResponseDto);

      expect(toWebUrl).toHaveBeenCalledTimes(2);
      expect(toWebUrl).toHaveBeenNthCalledWith(
        1,
        baseUrl,
        "/display/AAA/FromUrl",
      );
      expect(toWebUrl).toHaveBeenNthCalledWith(
        2,
        baseUrl,
        "/spaces/CCC/pages/123",
      );
    });

    it("レスポンス側の totalCount/start/limit がある場合はそれを優先して返す", () => {
      // Arrange
      const p = { start: 123, limit: 456 } as unknown as SearchRequestParams;
      const baseUrl = "https://example.com";

      const r = {
        totalCount: 999,
        start: 0,
        limit: 5,
        results: [],
      } as unknown as SearchResponse;

      // Act
      const actual = toSearchResponseDto(p, r, baseUrl);

      // Assert
      expect(actual).toEqual({
        total: 999,
        start: 0,
        limit: 5,
        results: [],
      } satisfies SearchResponseDto);

      expect(toWebUrl).not.toHaveBeenCalled();
    });
  });
});
