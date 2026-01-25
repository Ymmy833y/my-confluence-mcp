import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("utils/htmlToMarkdown", () => {
  describe("htmlToMarkdown", () => {
    it("入力が空（空文字/空白のみ）の場合は空文字を返し、Turndown を呼ばない", async () => {
      // Arrange
      const turndownFn = vi.fn();
      const removeFn = vi.fn();
      const addRuleFn = vi.fn();

      vi.doMock("turndown", () => {
        return {
          default: function TurndownService() {
            return {
              remove: removeFn,
              addRule: addRuleFn,
              turndown: turndownFn,
            };
          },
        };
      });

      const { htmlToMarkdown } = await import("@utils/htmlToMarkdown.js");

      // Act
      const actual1 = htmlToMarkdown("");
      const actual2 = htmlToMarkdown("   \n\t  ");

      // Assert
      expect(actual1).toBe("");
      expect(actual2).toBe("");
      expect(turndownFn).not.toHaveBeenCalled();
    });

    it("属性 allowlist による削除を行った HTML を Turndown に渡し、戻り値を正規化して返す", async () => {
      // Arrange
      const turndownFn = vi.fn().mockReturnValue("A  \n\n\nB\n");
      const removeFn = vi.fn();
      const addRuleFn = vi.fn();

      vi.doMock("turndown", () => {
        return {
          default: function TurndownService() {
            return {
              remove: removeFn,
              addRule: addRuleFn,
              turndown: turndownFn,
            };
          },
        };
      });

      const { htmlToMarkdown } = await import("@utils/htmlToMarkdown.js");

      const input =
        '<a href="https://example.com" title="t" onclick="evil()" data-x="1">Link</a>';

      // Act
      const actual = htmlToMarkdown(input);

      // Assert
      expect(removeFn).toHaveBeenCalledWith(["script", "style"]);
      expect(addRuleFn).toHaveBeenCalledWith(
        "confluence_br",
        expect.any(Object),
      );
      expect(turndownFn).toHaveBeenCalledWith(
        '<a href="https://example.com" title="t">Link</a>',
      );
      expect(actual).toBe("A\n\nB");
    });

    it("Turndown が例外の場合は cleaned HTML を html コードブロックとして返す（属性は allowlist で削除される）", async () => {
      // Arrange
      const turndownFn = vi.fn().mockImplementation(() => {
        throw new Error("boom");
      });
      const removeFn = vi.fn();
      const addRuleFn = vi.fn();

      vi.doMock("turndown", () => {
        return {
          default: function TurndownService() {
            return {
              remove: removeFn,
              addRule: addRuleFn,
              turndown: turndownFn,
            };
          },
        };
      });

      const { htmlToMarkdown } = await import("@utils/htmlToMarkdown.js");

      const input =
        '<a href="https://example.com" title="t" onclick="evil()" data-x="1">Link</a>';

      // Act
      const actual = htmlToMarkdown(input);

      // Assert
      expect(actual).toContain("````html");
      expect(actual).toContain(
        '<a href="https://example.com" title="t">Link</a>',
      );
      expect(actual).toContain("````");
      expect(actual).not.toContain("onclick=");
      expect(actual).not.toContain("data-x=");
    });

    it("self-closing は維持され、allowlist 外属性は削除される（例: <p local-id=... /> -> <p />）", async () => {
      // Arrange
      const turndownFn = vi.fn().mockImplementation(() => {
        throw new Error("boom");
      });
      const removeFn = vi.fn();
      const addRuleFn = vi.fn();

      vi.doMock("turndown", () => {
        return {
          default: function TurndownService() {
            return {
              remove: removeFn,
              addRule: addRuleFn,
              turndown: turndownFn,
            };
          },
        };
      });

      const { htmlToMarkdown } = await import("@utils/htmlToMarkdown.js");

      const input = '<p local-id="7d9050eb-2164-4641-a68b-52245e875c11" />';

      // Act
      const actual = htmlToMarkdown(input);

      // Assert
      expect(actual).toContain("````html");
      expect(actual).toContain("<p />");
      expect(actual).toContain("````");
      expect(actual).not.toContain("local-id=");
    });

    it("boolean属性は allowlist に含まれるものだけ保持される（checked/disabled のみ残し、小文字化される）", async () => {
      // Arrange
      const turndownFn = vi.fn().mockImplementation(() => {
        throw new Error("boom");
      });
      const removeFn = vi.fn();
      const addRuleFn = vi.fn();

      vi.doMock("turndown", () => {
        return {
          default: function TurndownService() {
            return {
              remove: removeFn,
              addRule: addRuleFn,
              turndown: turndownFn,
            };
          },
        };
      });

      const { htmlToMarkdown } = await import("@utils/htmlToMarkdown.js");

      const input =
        '<input type="checkbox" CHECKED disabled selected readonly multiple data-x="1" />';

      // Act
      const actual = htmlToMarkdown(input);

      // Assert
      expect(actual).toContain("````html");
      expect(actual).toContain("<input checked disabled />");
      expect(actual).toContain("````");
      expect(actual).not.toContain('type="checkbox"');
      expect(actual).not.toContain("selected");
      expect(actual).not.toContain("readonly");
      expect(actual).not.toContain("multiple");
      expect(actual).not.toContain("data-x=");
    });
  });
});
