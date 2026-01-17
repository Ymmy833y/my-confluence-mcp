import { toGetContentParams, toToolOutput } from "@mcp/tools/getContent/mapper";
import { describe, expect, it } from "vitest";

describe("mcp/tools/getContent/mapper", () => {
  describe("toGetContentParams", () => {
    it("入力を Confluence 取得パラメータへ変換できる", () => {
      // Arrange
      const input = {
        id: "123",
        representation: "view" as const,
        includeLabels: true,
      };

      // Act
      const actual = toGetContentParams(input);

      // Assert
      expect(actual).toEqual({
        id: "123",
        bodyRepresentation: "view",
        includeLabels: true,
      });
    });

    it("includeLabels=false の場合も正しく変換できる", () => {
      // Arrange
      const input = {
        id: "abc",
        representation: "storage" as const,
        includeLabels: false,
      };

      // Act
      const actual = toGetContentParams(input);

      // Assert
      expect(actual).toEqual({
        id: "abc",
        bodyRepresentation: "storage",
        includeLabels: false,
      });
    });
  });

  describe("toToolOutput", () => {
    it("任意項目が欠けている場合は null で正規化して返す", () => {
      // Arrange
      const dto = {
        id: "1",
        title: "T",
      };

      // Act
      const actual = toToolOutput(dto);

      // Assert
      expect(actual).toEqual({
        content: {
          id: "1",
          title: "T",
          type: null,
          url: null,
          spaceKey: null,
          spaceName: null,
          updated: null,
          version: null,
          body: null,
          labels: null,
        },
      });
    });

    it("labels がある場合はそのまま配列で返す", () => {
      // Arrange
      const dto = {
        id: "1",
        title: "T",
        labels: ["a", "b"],
      };

      // Act
      const actual = toToolOutput(dto);

      // Assert
      expect(actual.content?.labels).toEqual(["a", "b"]);
    });

    it("body が未指定の場合は body=null を返す", () => {
      // Arrange
      const dto = {
        id: "1",
        title: "T",
      };

      // Act
      const actual = toToolOutput(dto);

      // Assert
      expect(actual.content?.body).toBeNull();
    });

    it("body.value が空文字の場合は body=null を返す（境界値）", () => {
      // Arrange
      const dto = {
        id: "1",
        title: "T",
        body: { representation: "storage", value: "" },
      };

      // Act
      const actual = toToolOutput(dto);

      // Assert
      expect(actual.content?.body).toBeNull();
    });

    it("body.value がある場合は body を生成して返す", () => {
      // Arrange
      const dto = {
        id: "1",
        title: "T",
        body: { representation: "storage", value: "<p>Hello</p>" },
      };

      // Act
      const actual = toToolOutput(dto);

      // Assert
      expect(actual.content?.body).toEqual({
        representation: "<p>Hello</p>",
        value: "<p>Hello</p>",
      });
    });
  });
});
