import {
  ensureNoTrailingSlash,
  joinUrl,
  joinUrlWithExpand,
  toWebUrl,
} from "@utils/url";
import { describe, expect, it } from "vitest";

describe("utils/url", () => {
  describe("ensureNoTrailingSlash", () => {
    it.each([
      [
        "末尾スラッシュなしはそのまま",
        "https://example.com",
        "https://example.com",
      ],
      [
        "末尾スラッシュ1つを除去できる",
        "https://example.com/",
        "https://example.com",
      ],
      [
        "末尾スラッシュ複数を全て除去できる",
        "https://example.com///",
        "https://example.com",
      ],
      ["空文字は空文字のまま", "", ""],
      ["スラッシュのみは空文字になる", "/", ""],
      [
        "パス末尾のスラッシュも除去する",
        "https://example.com/a/b/",
        "https://example.com/a/b",
      ],
    ])("%s", (_title, input, expected) => {
      // Arrange
      // Act
      const actual = ensureNoTrailingSlash(input);

      // Assert
      expect(actual).toBe(expected);
    });
  });

  describe("joinUrl", () => {
    it.each([
      [
        "base が / で終わらず path が / で始まる場合、区切り / を増やさない",
        "https://example.com",
        "/api",
        "https://example.com/api",
      ],
      [
        "base が / で終わらず path が / で始まらない場合、区切り / を1つ補う",
        "https://example.com",
        "api",
        "https://example.com/api",
      ],
      [
        "base が / で終わる場合、末尾 / を除去してから結合する",
        "https://example.com/",
        "api",
        "https://example.com/api",
      ],
      [
        "base が / で複数終わる場合も同様に除去して結合する",
        "https://example.com///",
        "/api",
        "https://example.com/api",
      ],
      [
        "path が空でも末尾 / を補って結合する",
        "https://example.com",
        "",
        "https://example.com/",
      ],
      [
        "base が空で path が / で始まる場合はそのまま結合される",
        "",
        "/api",
        "/api",
      ],
      [
        "base が空で path が / で始まらない場合は / を補って結合される",
        "",
        "api",
        "/api",
      ],
    ])("%s", (_title, base, path, expected) => {
      // Arrange
      // Act
      const actual = joinUrl(base, path);

      // Assert
      expect(actual).toBe(expected);
    });
  });

  describe("joinUrlWithExpand", () => {
    it("expand を指定しない場合、クエリなしの URL を返す", () => {
      // Arrange
      const base = "https://example.com/";
      const path = "/api/content";

      // Act
      const actual = joinUrlWithExpand(base, path);

      // Assert
      expect(actual).toBe("https://example.com/api/content");
    });

    it("expand が空文字の場合、クエリを付与しない", () => {
      // Arrange
      const base = "https://example.com";
      const path = "api/content";

      // Act
      const actual = joinUrlWithExpand(base, path, "");

      // Assert
      expect(actual).toBe("https://example.com/api/content");
    });

    it("expand を指定した場合、expand クエリを付与した URL を返す", () => {
      // Arrange
      const base = "https://example.com";
      const path = "/api/content";
      const expand = "body.storage,version";

      // Act
      const actual = joinUrlWithExpand(base, path, expand);

      // Assert
      expect(actual).toBe(
        "https://example.com/api/content?expand=body.storage%2Cversion",
      );
    });

    it("path に既存クエリがある場合、expand を追加する（既存クエリは保持する）", () => {
      // Arrange
      const base = "https://example.com";
      const path = "/api/content?limit=10";
      const expand = "body.storage";

      // Act
      const actual = joinUrlWithExpand(base, path, expand);

      // Assert
      // URLSearchParams により順序が変わりうるため、URL で検証する
      const url = new URL(actual);
      expect(url.origin + url.pathname).toBe("https://example.com/api/content");
      expect(url.searchParams.get("limit")).toBe("10");
      expect(url.searchParams.get("expand")).toBe("body.storage");
    });
  });

  describe("toWebUrl", () => {
    it("webui が undefined の場合は undefined を返す", () => {
      // Arrange
      const baseUrl = "https://example.com";

      // Act
      const actual = toWebUrl(baseUrl, undefined);

      // Assert
      expect(actual).toBeUndefined();
    });

    it("webui が空文字の場合は undefined を返す", () => {
      // Arrange
      const baseUrl = "https://example.com";

      // Act
      const actual = toWebUrl(baseUrl, "");

      // Assert
      expect(actual).toBeUndefined();
    });

    it("webui が http/https の絶対 URL の場合はそのまま返す", () => {
      // Arrange
      const baseUrl = "https://base.example.com";
      const webui = "https://web.example.com/pages/123";

      // Act
      const actual = toWebUrl(baseUrl, webui);

      // Assert
      expect(actual).toBe("https://web.example.com/pages/123");
    });

    it("webui が先頭 / の相対パスの場合、baseUrl に対して解決した URL を返す", () => {
      // Arrange
      const baseUrl = "https://example.com/wiki";
      const webui = "/pages/123";

      // Act
      const actual = toWebUrl(baseUrl, webui);

      // Assert
      expect(actual).toBe("https://example.com/wiki/pages/123");
    });

    it("webui が先頭 / なしの相対パスの場合も、baseUrl に対して解決した URL を返す", () => {
      // Arrange
      const baseUrl = "https://example.com/wiki/";
      const webui = "pages/123";

      // Act
      const actual = toWebUrl(baseUrl, webui);

      // Assert
      expect(actual).toBe("https://example.com/wiki/pages/123");
    });

    it("baseUrl に末尾 / が複数あっても 1 つに正規化してから解決する", () => {
      // Arrange
      const baseUrl = "https://example.com/wiki///";
      const webui = "pages/123";

      // Act
      const actual = toWebUrl(baseUrl, webui);

      // Assert
      expect(actual).toBe("https://example.com/wiki/pages/123");
    });

    it("webui の先頭 / が複数あっても 1 つに正規化して解決する", () => {
      // Arrange
      const baseUrl = "https://example.com/wiki";
      const webui = "///pages/123";

      // Act
      const actual = toWebUrl(baseUrl, webui);

      // Assert
      expect(actual).toBe("https://example.com/wiki/pages/123");
    });
  });
});
