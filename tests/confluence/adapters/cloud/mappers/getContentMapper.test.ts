import type { GetContentResponse } from "@cloud/api/getContentResponse";
import type { GetContentParams } from "@core/getContentTypes";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@utils/url");

import { toGetContentResultDto } from "@cloud/mappers/getContentMapper";
import { toWebUrl } from "@utils/url";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("confluence/adapters/cloud/mappers/getContentMapper", () => {
  describe("toGetContentResultDto", () => {
    it("必須フィールドと、存在する optional フィールドを DTO に詰められる", () => {
      // Arrange
      vi.mocked(toWebUrl).mockReturnValue(
        "https://example.atlassian.net/wiki/spaces/ABC/pages/1",
      );

      const p = { bodyRepresentation: "view" } as unknown as GetContentParams;

      const r = {
        id: "1",
        title: "T",
        type: "page",
        _links: { webui: "/spaces/ABC/pages/1" },
        space: { key: "ABC", name: "Space ABC" },
        version: { when: "2026-01-01T00:00:00.000Z", number: 3 },
        body: {
          view: { value: "<p>view</p>" },
        },
        metadata: {
          labels: {
            results: [
              { name: "l1" },
              { name: "" },
              { name: undefined },
              { name: 123 as unknown as string },
            ],
          },
        },
      } as unknown as GetContentResponse;

      // Act
      const actual = toGetContentResultDto(
        p,
        r,
        "https://example.atlassian.net/wiki",
      );

      // Assert
      expect(actual).toEqual({
        id: "1",
        title: "T",
        type: "page",
        url: "https://example.atlassian.net/wiki/spaces/ABC/pages/1",
        spaceKey: "ABC",
        spaceName: "Space ABC",
        updated: "2026-01-01T00:00:00.000Z",
        version: 3,
        body: { representation: "view", value: "<p>view</p>" },
        labels: ["l1"],
      });
    });

    it("webui が無い場合 url を出力しない", () => {
      // Arrange
      vi.mocked(toWebUrl).mockReturnValue(undefined);

      const p = { bodyRepresentation: "view" } as unknown as GetContentParams;

      const r = {
        id: "1",
        title: "T",
        type: "page",
        _links: {},
      } as unknown as GetContentResponse;

      // Act
      const actual = toGetContentResultDto(
        p,
        r,
        "https://example.atlassian.net/wiki",
      );

      // Assert
      expect(actual).toEqual({
        id: "1",
        title: "T",
        type: "page",
      });
    });

    it("body: preferred 表現が無い場合 storage をフォールバックに使う", () => {
      // Arrange
      vi.mocked(toWebUrl).mockReturnValue(undefined);

      const p = { bodyRepresentation: "view" } as unknown as GetContentParams;

      const r = {
        id: "1",
        title: "T",
        type: "page",
        body: {
          storage: { value: "<p>storage</p>" },
        },
      } as unknown as GetContentResponse;

      // Act
      const actual = toGetContentResultDto(
        p,
        r,
        "https://example.atlassian.net/wiki",
      );

      // Assert
      expect(actual).toEqual({
        id: "1",
        title: "T",
        type: "page",
        body: { representation: "storage", value: "<p>storage</p>" },
      });
    });

    it("body: storage も無い場合 view をフォールバックに使う", () => {
      // Arrange
      vi.mocked(toWebUrl).mockReturnValue(undefined);

      const p = {
        bodyRepresentation: "storage",
      } as unknown as GetContentParams;

      const r = {
        id: "1",
        title: "T",
        type: "page",
        body: {
          view: { value: "<p>view</p>" },
        },
      } as unknown as GetContentResponse;

      // Act
      const actual = toGetContentResultDto(
        p,
        r,
        "https://example.atlassian.net/wiki",
      );

      // Assert
      expect(actual).toEqual({
        id: "1",
        title: "T",
        type: "page",
        body: { representation: "view", value: "<p>view</p>" },
      });
    });

    it("body: view も無い場合 export_view をフォールバックに使う", () => {
      // Arrange
      vi.mocked(toWebUrl).mockReturnValue(undefined);

      const p = {
        bodyRepresentation: "storage",
      } as unknown as GetContentParams;

      const r = {
        id: "1",
        title: "T",
        type: "page",
        body: {
          export_view: { value: "<p>export</p>" },
        },
      } as unknown as GetContentResponse;

      // Act
      const actual = toGetContentResultDto(
        p,
        r,
        "https://example.atlassian.net/wiki",
      );

      // Assert
      expect(actual).toEqual({
        id: "1",
        title: "T",
        type: "page",
        body: { representation: "export_view", value: "<p>export</p>" },
      });
    });

    it("body が無い場合 body を出力しない", () => {
      // Arrange
      vi.mocked(toWebUrl).mockReturnValue(undefined);

      const p = { bodyRepresentation: "view" } as unknown as GetContentParams;

      const r = {
        id: "1",
        title: "T",
        type: "page",
        body: undefined,
      } as unknown as GetContentResponse;

      // Act
      const actual = toGetContentResultDto(
        p,
        r,
        "https://example.atlassian.net/wiki",
      );

      // Assert
      expect(actual).toEqual({
        id: "1",
        title: "T",
        type: "page",
      });
    });
  });
});
