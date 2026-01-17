import {
  GetContentInputSchema,
  GetContentOutputSchema,
} from "@mcp/tools/getContent/schema";
import { describe, expect, it } from "vitest";

describe("mcp/tools/getContent/schema", () => {
  describe("GetContentInputSchema", () => {
    it("id だけ指定すると default が適用される", () => {
      // Arrange
      const input = { id: "123" };

      // Act
      const actual = GetContentInputSchema.parse(input);

      // Assert
      expect(actual).toEqual({
        id: "123",
        representation: "storage",
        includeLabels: false,
      });
    });

    it("strict: 未定義のキーがあるとエラーになる", () => {
      // Arrange
      const input = { id: "123", unknownKey: "x" };

      // Act & Assert
      expect(() => GetContentInputSchema.parse(input)).toThrow();
    });

    it("id が空文字の場合はエラーになる", () => {
      // Arrange
      const input = { id: "" };

      // Act & Assert
      expect(() => GetContentInputSchema.parse(input)).toThrow();
    });

    it("bodyMaxChars は int 以外を拒否する", () => {
      // Arrange
      const input = { id: "1", bodyMaxChars: 1.5 };

      // Act & Assert
      expect(() => GetContentInputSchema.parse(input)).toThrow();
    });

    it("asMarkdown は boolean を許容する", () => {
      // Arrange
      const input = { id: "1", asMarkdown: true };

      // Act
      const actual = GetContentInputSchema.parse(input);

      // Assert
      expect(actual.asMarkdown).toBe(true);
    });
  });

  describe("GetContentOutputSchema", () => {
    it("content は undefined を許容する（optional）", () => {
      // Arrange
      const input = {};

      // Act
      const actual = GetContentOutputSchema.parse(input);

      // Assert
      expect(actual).toEqual({ content: undefined });
    });

    it("content.url は URL 形式でないとエラーになる", () => {
      // Arrange
      const input = {
        content: {
          id: "1",
          title: "T",
          type: null,
          url: "not-a-url",
          spaceKey: null,
          spaceName: null,
          updated: null,
          version: null,
          body: null,
          labels: null,
        },
      };

      // Act & Assert
      expect(() => GetContentOutputSchema.parse(input)).toThrow();
    });

    it("content が揃っている場合は parse できる", () => {
      // Arrange
      const input = {
        content: {
          id: "1",
          title: "T",
          type: "page",
          url: "https://example.com/wiki/pages/1",
          spaceKey: "SPACE",
          spaceName: "Space Name",
          updated: "2025-01-01T00:00:00Z",
          version: 2,
          body: null,
          labels: ["a"],
        },
      };

      // Act
      const actual = GetContentOutputSchema.parse(input);

      // Assert
      expect(actual).toEqual(input);
    });
  });
});
