/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  toSearchRequestParams,
  toToolOutput,
} from "@mcp/tools/search/mapper.js";
import { describe, expect, it } from "vitest";

describe("mcp/tools/search/mapper", () => {
  describe("toSearchRequestParams", () => {
    it("SearchToolInput から SearchRequestParams へフィールドをそのまま転送する", () => {
      // Arrange
      const input = {
        cql: 'text ~ "hello"',
        limit: 10,
        start: 2,
        asMarkdown: true,
      };

      // Act
      const actual = toSearchRequestParams(input as any);

      // Assert
      expect(actual).toEqual({
        cql: 'text ~ "hello"',
        limit: 10,
        start: 2,
      });
    });
  });

  describe("toToolOutput", () => {
    it("undefined を null に正規化して SearchToolOutput へ変換する", () => {
      // Arrange
      const response = {
        total: 1,
        start: 0,
        limit: 10,
        results: [
          {
            id: "1",
            title: "T",
            type: undefined,
            url: undefined,
            spaceKey: undefined,
            spaceName: undefined,
            excerpt: undefined,
            lastModified: undefined,
          },
        ],
      };

      // Act
      const actual = toToolOutput(response as any);

      // Assert
      expect(actual).toEqual({
        results: [
          {
            id: "1",
            title: "T",
            type: null,
            url: null,
            spaceKey: null,
            spaceName: null,
            excerpt: null,
            lastModified: null,
          },
        ],
        page: {
          total: 1,
          start: 0,
          limit: 10,
        },
      });
    });

    it("値があるフィールドはそのまま保持する", () => {
      // Arrange
      const response = {
        total: 1,
        start: 3,
        limit: 5,
        results: [
          {
            id: "123",
            title: "Hello",
            type: "page",
            url: "https://example.com/123",
            spaceKey: "ABC",
            spaceName: "Space ABC",
            excerpt: "excerpt",
            lastModified: "2026-01-01T00:00:00Z",
          },
        ],
      };

      // Act
      const actual = toToolOutput(response as any);

      // Assert
      expect(actual.results[0]).toEqual({
        id: "123",
        title: "Hello",
        type: "page",
        url: "https://example.com/123",
        spaceKey: "ABC",
        spaceName: "Space ABC",
        excerpt: "excerpt",
        lastModified: "2026-01-01T00:00:00Z",
      });
      expect(actual.page).toEqual({ total: 1, start: 3, limit: 5 });
    });
  });
});
