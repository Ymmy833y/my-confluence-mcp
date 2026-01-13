import {
  ConfluenceAuth,
  createConfluenceConfig,
} from "@config/confluenceConfig";
import type { Env } from "@config/env";
import { describe, expect, it } from "vitest";

describe("config/confluenceConfig", () => {
  describe("createConfluenceConfig", () => {
    it.each([
      {
        title: "末尾にスラッシュがない場合はそのまま",
        input: "https://example.atlassian.net/wiki",
        expected: "https://example.atlassian.net/wiki",
      },
      {
        title: "末尾のスラッシュを1つ除去できる",
        input: "https://example.atlassian.net/wiki/",
        expected: "https://example.atlassian.net/wiki",
      },
      {
        title: "末尾のスラッシュを複数まとめて除去できる",
        input: "https://example.atlassian.net/wiki///",
        expected: "https://example.atlassian.net/wiki",
      },
    ])("$title", ({ input, expected }) => {
      // Arrange
      const env = {
        CONFLUENCE_BASE_URL: input,
        CONFLUENCE_HOSTING: "cloud",
        CONFLUENCE_PERSONAL_ACCESS_TOKEN: "pat_xxx",
        CONFLUENCE_TIMEOUT_MS: 10_000,
        CONFLUENCE_SEARCH_MAX_LIMIT: 25,
        CONFLUENCE_DEFAULT_CQL: "type=page order by created desc",
        CONFLUENCE_BODY_MAX_CHARS: 50_000,
      } as unknown as Env;

      // Act
      const actual = createConfluenceConfig(env);

      // Assert
      expect(actual.baseUrl).toBe(expected);
    });

    it("PAT が指定されている場合、bearer 認証が優先される（email/apiToken があっても）", () => {
      // Arrange
      const env = {
        CONFLUENCE_BASE_URL: "https://example.atlassian.net/wiki/",
        CONFLUENCE_HOSTING: "cloud",
        CONFLUENCE_PERSONAL_ACCESS_TOKEN: "pat_123",
        CONFLUENCE_EMAIL: "user@example.com",
        CONFLUENCE_API_TOKEN: "api_token_should_be_ignored",
        CONFLUENCE_TIMEOUT_MS: 30_000,
        CONFLUENCE_SEARCH_MAX_LIMIT: 100,
        CONFLUENCE_DEFAULT_CQL: "type=page",
        CONFLUENCE_BODY_MAX_CHARS: 12345,
      } as unknown as Env;

      // Act
      const actual = createConfluenceConfig(env);

      // Assert
      expect(actual.auth).toEqual(ConfluenceAuth.bearer("pat_123"));
    });

    it("PAT が未指定（または空文字）の場合、basic 認証が使われる", () => {
      // Arrange
      const env = {
        CONFLUENCE_BASE_URL: "https://confluence.example.com/",
        CONFLUENCE_HOSTING: "onprem",
        CONFLUENCE_PERSONAL_ACCESS_TOKEN: "", // falsy -> basic になることを確認
        CONFLUENCE_EMAIL: "user@example.com",
        CONFLUENCE_API_TOKEN: "api_token_123",
        CONFLUENCE_TIMEOUT_MS: 5_000,
        CONFLUENCE_SEARCH_MAX_LIMIT: 50,
        CONFLUENCE_DEFAULT_CQL: "type=blogpost",
        CONFLUENCE_BODY_MAX_CHARS: 9_999,
      } as unknown as Env;

      // Act
      const actual = createConfluenceConfig(env);

      // Assert
      expect(actual.auth).toEqual(
        ConfluenceAuth.basic("user@example.com", "api_token_123"),
      );
    });

    it("env の各値が ConfluenceConfig に正しくマッピングされる", () => {
      // Arrange
      const env = {
        CONFLUENCE_BASE_URL: "https://example.atlassian.net/wiki/",
        CONFLUENCE_HOSTING: "cloud",
        CONFLUENCE_PERSONAL_ACCESS_TOKEN: "pat_abc",
        CONFLUENCE_TIMEOUT_MS: 12_345,
        CONFLUENCE_SEARCH_MAX_LIMIT: 77,
        CONFLUENCE_DEFAULT_CQL: "space = ABC AND type = page",
        CONFLUENCE_BODY_MAX_CHARS: 54_321,
      } as unknown as Env;

      // Act
      const actual = createConfluenceConfig(env);

      // Assert
      expect(actual).toEqual({
        baseUrl: "https://example.atlassian.net/wiki",
        hosting: "cloud",
        auth: ConfluenceAuth.bearer("pat_abc"),
        timeoutMs: 12_345,
        searchMaxLimit: 77,
        searchDefaultCql: "space = ABC AND type = page",
        bodyMaxChars: 54_321,
      });
    });
  });
});
