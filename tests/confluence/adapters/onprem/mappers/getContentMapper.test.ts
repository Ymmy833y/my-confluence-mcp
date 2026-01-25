import type { GetContentParams } from "@core/getContentTypes";
import type { GetContentResponse } from "@onprem/api/getContentResponse";
import { toGetContentResultDto } from "@onprem/mappers/getContentMapper.js";
import { toWebUrl } from "@utils/url";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@utils/url", () => ({
  toWebUrl: vi.fn(),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("confluence/adapters/onprem/mappers/getContentMapper", () => {
  describe("toGetContentResultDto", () => {
    it("data 側の値を優先し、必要なフィールドのみを返す（url は toWebUrl を使用）", () => {
      // Arrange
      vi.mocked(toWebUrl).mockReturnValue("WEB_URL");

      const p = { bodyRepresentation: "view" } as GetContentParams;

      const r = {
        id: "root-id",
        title: "root-title",
        type: "root-type",
        _links: { webui: "/root-webui" },
        space: { key: "ROOT", name: "Root Space" },
        version: { when: "root-when", number: 1 },
        body: { view: { value: "<p>root</p>" } },
        metadata: { labels: ["root-label"] },

        data: {
          id: "data-id",
          title: "data-title",
          type: "data-type",
          _links: { webui: "/data-webui" },
          space: { key: "DATA", name: "Data Space" },
          version: { when: "data-when", number: 2 },
          body: { view: { value: "<p>data</p>" } },
          metadata: { labels: ["data-label"] },
        },
      } as unknown as GetContentResponse;

      // Act
      const actual = toGetContentResultDto(p, r, "https://example.com");

      // Assert
      expect(toWebUrl).toHaveBeenCalledWith(
        "https://example.com",
        "/data-webui",
      );
      expect(actual).toEqual({
        id: "data-id",
        title: "data-title",
        type: "data-type",
        url: "WEB_URL",
        spaceKey: "DATA",
        spaceName: "Data Space",
        updated: "data-when",
        version: 2,
        body: { representation: "view", value: "<p>data</p>" },
        labels: ["data-label"],
      });
    });

    it("title が存在しない場合は空文字を返す", () => {
      // Arrange
      vi.mocked(toWebUrl).mockReturnValue(undefined);

      const p = { bodyRepresentation: "storage" } as GetContentParams;
      const r = { id: "1" } as unknown as GetContentResponse;

      // Act
      const actual = toGetContentResultDto(p, r, "https://example.com");

      // Assert
      expect(actual).toEqual({ id: "1", title: "" });
    });
    it.each([
      [
        "指定した representation の value があればそれを使う",
        "view",
        {
          view: { value: "<p>view</p>" },
          storage: { value: "<p>storage</p>" },
        },
        { representation: "view", value: "<p>view</p>" },
      ],
      [
        "指定した representation が無い場合は storage を優先する",
        "view",
        { storage: { value: "<p>storage</p>" } }, // ✅ view を入れない（ここが修正点）
        { representation: "storage", value: "<p>storage</p>" },
      ],
      [
        "storage も無い場合は view を使う",
        "storage",
        { view: { value: "<p>view</p>" } },
        { representation: "view", value: "<p>view</p>" },
      ],
    ] as const)(
      "body の選択: %s",
      (_, bodyRepresentation, body, expectedBody) => {
        // Arrange
        vi.mocked(toWebUrl).mockReturnValue(undefined);

        const p = { bodyRepresentation } as unknown as GetContentParams;
        const r = {
          id: "1",
          title: "t",
          body,
        } as unknown as GetContentResponse;

        // Act
        const actual = toGetContentResultDto(p, r, "https://example.com");

        // Assert
        expect(actual).toEqual({
          id: "1",
          title: "t",
          body: expectedBody,
        });
      },
    );

    it("body が無い場合は body フィールドを含めない", () => {
      // Arrange
      vi.mocked(toWebUrl).mockReturnValue(undefined);

      const p = { bodyRepresentation: "view" } as GetContentParams;
      const r = {
        id: "1",
        title: "t",
        body: undefined,
      } as unknown as GetContentResponse;

      // Act
      const actual = toGetContentResultDto(p, r, "https://example.com");

      // Assert
      expect(actual).toEqual({ id: "1", title: "t" });
      expect(actual).not.toHaveProperty("body");
    });

    it("type / url / space / version などが undefined の場合はフィールドを含めない", () => {
      // Arrange
      vi.mocked(toWebUrl).mockReturnValue(undefined);

      const p = { bodyRepresentation: "view" } as GetContentParams;
      const r = {
        id: "1",
        title: "t",
        type: undefined,
        _links: undefined,
        space: undefined,
        version: undefined,
        metadata: undefined,
        body: undefined,
      } as unknown as GetContentResponse;

      // Act
      const actual = toGetContentResultDto(p, r, "https://example.com");

      // Assert
      expect(actual).toEqual({ id: "1", title: "t" });
      expect(actual).not.toHaveProperty("type");
      expect(actual).not.toHaveProperty("url");
      expect(actual).not.toHaveProperty("spaceKey");
      expect(actual).not.toHaveProperty("spaceName");
      expect(actual).not.toHaveProperty("updated");
      expect(actual).not.toHaveProperty("version");
      expect(actual).not.toHaveProperty("labels");
    });
  });
});
