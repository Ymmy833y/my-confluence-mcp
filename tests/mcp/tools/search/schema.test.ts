import {
  SearchInputSchema,
  SearchOutputSchema,
} from "@mcp/tools/search/schema.js";
import { describe, expect, it } from "vitest";

describe("mcp/tools/search/schema", () => {
  describe("SearchInputSchema", () => {
    it("start と asMarkdown は default が適用される", () => {
      // Arrange
      const input = {
        cql: "type=page",
        limit: 10,
      };

      // Act
      const actual = SearchInputSchema.parse(input);

      // Assert
      expect(actual).toEqual({
        cql: "type=page",
        limit: 10,
        start: 0,
        asMarkdown: true,
      });
    });

    it("cql が空文字の場合はエラーになる", () => {
      // Arrange
      const input = {
        cql: "",
        limit: 10,
        start: 0,
        asMarkdown: true,
      };

      // Act
      const result = SearchInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("strict のため未知のキーがある場合はエラーになる", () => {
      // Arrange
      const input = {
        cql: "type=page",
        limit: 10,
        start: 0,
        asMarkdown: true,
        extra: "nope",
      };

      // Act
      const result = SearchInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("limit は int かつ 1 以上である必要がある", () => {
      // Arrange
      const cases: Array<{ name: string; input: unknown }> = [
        {
          name: "0 は不可",
          input: { cql: "type=page", limit: 0, start: 0, asMarkdown: true },
        },
        {
          name: "-1 は不可",
          input: { cql: "type=page", limit: -1, start: 0, asMarkdown: true },
        },
        {
          name: "小数は不可",
          input: { cql: "type=page", limit: 1.5, start: 0, asMarkdown: true },
        },
      ];

      for (const c of cases) {
        // Act
        const result = SearchInputSchema.safeParse(c.input);

        // Assert
        expect(result.success).toBe(false);
      }
    });
  });

  describe("SearchOutputSchema", () => {
    it("null 許容フィールドが null の場合でも parse できる", () => {
      // Arrange
      const output = {
        page: { total: 0, start: 0, limit: 10 },
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
      };

      // Act
      const actual = SearchOutputSchema.parse(output);

      // Assert
      expect(actual).toEqual(output);
    });

    it("url が不正な場合はエラーになる", () => {
      // Arrange
      const output = {
        page: { total: 0, start: 0, limit: 10 },
        results: [
          {
            id: "1",
            title: "T",
            type: "page",
            url: "not-a-url",
            spaceKey: null,
            spaceName: null,
            excerpt: null,
            lastModified: null,
          },
        ],
      };

      // Act
      const result = SearchOutputSchema.safeParse(output);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});
