import { toSearchResponseDto } from "@cloud/mappers/searchMapper";
import { SearchRequestParams } from "@core/searchTypes";
import { logger } from "@utils/logger";
import { toWebUrl } from "@utils/url";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@utils/logger");

vi.mock("@utils/url", () => ({
  toWebUrl: vi.fn(() => "WEB_URL"),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("confluence/adapters/cloud/mappers/searchMapper", () => {
  describe("toSearchResponseDto", () => {
    it("SearchResponse を SearchResponseDto に正しく変換できる（レスポンス値が優先される）", () => {
      // Arrange
      const p = { start: 0, limit: 25 } as SearchRequestParams;

      const r = {
        totalSize: 100,
        start: 5,
        limit: 10,
        results: [
          {
            title: undefined,
            entityType: undefined,
            url: "/wiki/spaces/ABC/pages/1",
            excerpt: "excerpt-1",
            lastModified: "2026-01-01T00:00:00.000Z",
            content: {
              id: "1",
              title: "Title-1",
              type: "page",
              space: { key: "ABC", name: "Space-ABC" },
            },
          },
        ],
      } as unknown;

      // Act
      const actual = toSearchResponseDto(
        p,
        r as never,
        "https://example.atlassian.net",
      );

      // Assert
      expect(actual).toEqual({
        total: 100,
        start: 5,
        limit: 10,
        results: [
          {
            id: "1",
            title: "Title-1",
            type: "page",
            url: "WEB_URL",
            spaceKey: "ABC",
            spaceName: "Space-ABC",
            excerpt: "excerpt-1",
            lastModified: "2026-01-01T00:00:00.000Z",
          },
        ],
      });

      expect(toWebUrl).toHaveBeenCalledTimes(1);
      expect(toWebUrl).toHaveBeenCalledWith(
        "https://example.atlassian.net",
        "/wiki/spaces/ABC/pages/1",
      );
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it("totalSize/start/limit が欠ける場合、results.length とリクエストパラメータへフォールバックする", () => {
      // Arrange
      const p = { start: 10, limit: 5 } as SearchRequestParams;

      const r = {
        totalSize: undefined,
        start: undefined,
        limit: undefined,
        results: [
          {
            title: "A",
            entityType: "page",
            url: "/a",
            content: { id: "1" },
          },
          {
            title: "B",
            entityType: "page",
            url: "/b",
            content: { id: "2" },
          },
        ],
      } as unknown;

      // Act
      const actual = toSearchResponseDto(p, r as never, "https://base");

      // Assert
      expect(actual.total).toBe(2);
      expect(actual.start).toBe(10);
      expect(actual.limit).toBe(5);
      expect(actual.results).toHaveLength(2);

      expect(toWebUrl).toHaveBeenCalledTimes(2);
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it("id または title が欠ける要素はスキップし、logger.warn が呼ばれる", () => {
      // Arrange
      const p = { start: 0, limit: 25 } as SearchRequestParams;

      const r = {
        results: [
          {
            title: "Valid",
            entityType: "page",
            url: "/valid",
            content: { id: "ok" },
          },
          {
            title: "MissingId",
            entityType: "page",
            url: "/missing-id",
            content: undefined,
          },
          {
            title: undefined,
            entityType: "page",
            url: "/missing-title",
            content: { id: "no-title", title: undefined },
          },
        ],
      } as unknown;

      // Act
      const actual = toSearchResponseDto(p, r as never, "https://base");

      // Assert
      expect(actual.results).toHaveLength(1);
      expect(actual.results[0]).toMatchObject({
        id: "ok",
        title: "Valid",
      });

      expect(logger.warn).toHaveBeenCalledTimes(2);
      expect(toWebUrl).toHaveBeenCalledTimes(1);
      expect(toWebUrl).toHaveBeenCalledWith("https://base", "/valid");
    });
  });
});
