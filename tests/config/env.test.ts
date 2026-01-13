import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("dotenv");

import { CONFLUENCE_HOSTING_VALUES } from "@config/confluenceConfig";
import { loadEnv } from "@config/env";
import { config as dotenvConfig } from "dotenv";

const ORIGINAL_ENV = process.env;

function baseEnv() {
  return {
    CONFLUENCE_HOSTING: CONFLUENCE_HOSTING_VALUES[0],
    CONFLUENCE_BASE_URL: "https://example.atlassian.net/wiki",

    // optional: email/token/PAT はテストごとに設定
    CONFLUENCE_EMAIL: undefined,
    CONFLUENCE_API_TOKEN: undefined,
    CONFLUENCE_PERSONAL_ACCESS_TOKEN: undefined,

    // 任意（未設定でもデフォルトが入る想定）
    CONFLUENCE_TIMEOUT_MS: undefined,
    CONFLUENCE_SEARCH_MAX_LIMIT: undefined,
    CONFLUENCE_DEFAULT_CQL: undefined,
    CONFLUENCE_BODY_MAX_CHARS: undefined,
  } as Record<string, string | undefined>;
}

function setProcessEnv(env: Record<string, string | undefined>) {
  process.env = { ...process.env, ...env };
}

describe("config/env", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.mocked(dotenvConfig).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = ORIGINAL_ENV;
  });

  describe("loadEnv", () => {
    it("options.path が指定されていない場合、dotenv.config() を引数なしで呼ぶ", () => {
      // Arrange
      setProcessEnv({
        ...baseEnv(),
        CONFLUENCE_PERSONAL_ACCESS_TOKEN: "pat_xxxxx",
      });

      // Act
      loadEnv();

      // Assert
      expect(dotenvConfig).toHaveBeenCalledTimes(1);
      expect(dotenvConfig).toHaveBeenCalledWith();
    });

    it("options.path が指定されている場合、dotenv.config({ path }) を呼ぶ", () => {
      // Arrange
      setProcessEnv({
        ...baseEnv(),
        CONFLUENCE_PERSONAL_ACCESS_TOKEN: "pat_xxxxx",
      });

      // Act
      loadEnv({ path: ".env.test" });

      // Assert
      expect(dotenvConfig).toHaveBeenCalledTimes(1);
      expect(dotenvConfig).toHaveBeenCalledWith({ path: ".env.test" });
    });

    it("PAT がある場合、email/api token が無くても読み込みできる", () => {
      // Arrange
      setProcessEnv({
        ...baseEnv(),
        CONFLUENCE_PERSONAL_ACCESS_TOKEN: "pat_xxxxx",
      });

      // Act
      const actual = loadEnv();

      // Assert
      expect(actual.CONFLUENCE_PERSONAL_ACCESS_TOKEN).toBe("pat_xxxxx");
      expect(actual.CONFLUENCE_EMAIL).toBeUndefined();
      expect(actual.CONFLUENCE_API_TOKEN).toBeUndefined();
    });

    it("PAT が無い場合、email + api token があれば読み込みできる", () => {
      // Arrange
      setProcessEnv({
        ...baseEnv(),
        CONFLUENCE_EMAIL: "user@example.com",
        CONFLUENCE_API_TOKEN: "token_12345",
      });

      // Act
      const actual = loadEnv();

      // Assert
      expect(actual.CONFLUENCE_PERSONAL_ACCESS_TOKEN).toBeUndefined();
      expect(actual.CONFLUENCE_EMAIL).toBe("user@example.com");
      expect(actual.CONFLUENCE_API_TOKEN).toBe("token_12345");
    });

    it("PAT が無い場合、email が無いとエラーになる", () => {
      // Arrange
      setProcessEnv({
        ...baseEnv(),
        CONFLUENCE_API_TOKEN: "token_12345",
      });

      // Act
      const act = () => loadEnv();

      // Assert
      expect(act).toThrow(/Invalid environment variables:/i);
      expect(act).toThrow(/CONFLUENCE_EMAIL/i);
    });

    it("PAT が無い場合、api token が無いとエラーになる", () => {
      // Arrange
      setProcessEnv({
        ...baseEnv(),
        CONFLUENCE_EMAIL: "user@example.com",
      });

      // Act
      const act = () => loadEnv();

      // Assert
      expect(act).toThrow(/Invalid environment variables:/i);
      expect(act).toThrow(/CONFLUENCE_API_TOKEN/i);
    });

    it("数値系 env が未設定の場合、デフォルト値が入る", () => {
      // Arrange
      setProcessEnv({
        ...baseEnv(),
        CONFLUENCE_PERSONAL_ACCESS_TOKEN: "pat_xxxxx",
        // 数値系は未設定（undefined）
        CONFLUENCE_TIMEOUT_MS: undefined,
        CONFLUENCE_SEARCH_MAX_LIMIT: undefined,
        CONFLUENCE_BODY_MAX_CHARS: undefined,
        // default string も未設定
        CONFLUENCE_DEFAULT_CQL: undefined,
      });

      // Act
      const actual = loadEnv();

      // Assert
      expect(actual.CONFLUENCE_TIMEOUT_MS).toBe(15000);
      expect(actual.CONFLUENCE_SEARCH_MAX_LIMIT).toBe(50);
      expect(actual.CONFLUENCE_BODY_MAX_CHARS).toBe(20000);
      expect(actual.CONFLUENCE_DEFAULT_CQL).toBe("");
    });

    it.each([
      ["CONFLUENCE_TIMEOUT_MS", "15000"],
      ["CONFLUENCE_SEARCH_MAX_LIMIT", "50"],
      ["CONFLUENCE_BODY_MAX_CHARS", "20000"],
    ] as const)(
      "数値系 env が空文字の場合、デフォルト値にフォールバックする",
      (key, _) => {
        // Arrange
        const env = baseEnv();
        env.CONFLUENCE_PERSONAL_ACCESS_TOKEN = "pat_xxxxx";
        env[key] = "";

        setProcessEnv(env);

        // Act
        const actual = loadEnv();

        // Assert
        if (key === "CONFLUENCE_TIMEOUT_MS")
          expect(actual.CONFLUENCE_TIMEOUT_MS).toBe(15000);
        if (key === "CONFLUENCE_SEARCH_MAX_LIMIT")
          expect(actual.CONFLUENCE_SEARCH_MAX_LIMIT).toBe(50);
        if (key === "CONFLUENCE_BODY_MAX_CHARS")
          expect(actual.CONFLUENCE_BODY_MAX_CHARS).toBe(20000);
      },
    );

    it.each([
      ["CONFLUENCE_TIMEOUT_MS", "abc"],
      ["CONFLUENCE_SEARCH_MAX_LIMIT", "not-a-number"],
      ["CONFLUENCE_BODY_MAX_CHARS", "12.34"], // int 制約によりエラーを期待（number にはなるが int ではない）
    ] as const)("数値系 env が不正値の場合、エラーになる", (key, value) => {
      // Arrange
      const env = baseEnv();
      env.CONFLUENCE_PERSONAL_ACCESS_TOKEN = "pat_xxxxx";
      env[key] = value;

      setProcessEnv(env);

      // Act
      const act = () => loadEnv();

      // Assert
      expect(act).toThrow(/Invalid environment variables:/i);
      expect(act).toThrow(new RegExp(key, "i"));
    });

    it("CONFLUENCE_BASE_URL が不正な URL の場合、エラーになる", () => {
      // Arrange
      setProcessEnv({
        ...baseEnv(),
        CONFLUENCE_PERSONAL_ACCESS_TOKEN: "pat_xxxxx",
        CONFLUENCE_BASE_URL: "not-a-url",
      });

      // Act
      const act = () => loadEnv();

      // Assert
      expect(act).toThrow(/Invalid environment variables:/i);
      expect(act).toThrow(/CONFLUENCE_BASE_URL/i);
    });

    it("CONFLUENCE_HOSTING が enum 外の値の場合、エラーになる", () => {
      // Arrange
      setProcessEnv({
        ...baseEnv(),
        CONFLUENCE_PERSONAL_ACCESS_TOKEN: "pat_xxxxx",
        CONFLUENCE_HOSTING: "UNKNOWN_HOSTING",
      });

      // Act
      const act = () => loadEnv();

      // Assert
      expect(act).toThrow(/Invalid environment variables:/i);
      expect(act).toThrow(/CONFLUENCE_HOSTING/i);
    });
  });
});
