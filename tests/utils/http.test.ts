import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@utils/logger");

import { fetchJson } from "@utils/http";

type MockHeaders = { get: (key: string) => string | null };
type MockResponse = {
  status: number;
  statusText: string;
  ok: boolean;
  redirected: boolean;
  type: string;
  headers: MockHeaders;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
};

function createMockResponse(params: {
  status: number;
  statusText: string;
  ok: boolean;
  jsonData?: unknown;
  textData?: string;
  headers?: Record<string, string>;
  textShouldReject?: boolean;
}): MockResponse {
  const headerMap = new Map<string, string>(
    Object.entries(params.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]),
  );

  return {
    status: params.status,
    statusText: params.statusText,
    ok: params.ok,
    redirected: false,
    type: "basic",
    headers: {
      get: (key: string) => headerMap.get(key.toLowerCase()) ?? null,
    },
    json: async () => params.jsonData,
    text: params.textShouldReject
      ? async () => {
          throw new Error("text failed");
        }
      : async () => params.textData ?? "",
  };
}

describe("utils/http", () => {
  describe("fetchJson", () => {
    const ORIGINAL_ENV = process.env;

    beforeEach(() => {
      process.env = { ...ORIGINAL_ENV };
    });

    afterEach(() => {
      process.env = ORIGINAL_ENV;
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
      vi.useRealTimers();
    });

    it("OK レスポンスを JSON として返す（init に signal が付与される）", async () => {
      // Arrange
      const url = "https://example.test/api";
      const init: RequestInit = {
        method: "GET",
        headers: { "x-test": "1" },
      };
      const timeoutMs = 1000;

      const expected = { hello: "world" };

      const fetchMock = vi.fn().mockResolvedValue(
        createMockResponse({
          status: 200,
          statusText: "OK",
          ok: true,
          jsonData: expected,
          headers: {
            "content-type": "application/json",
            "content-length": "17",
          },
        }),
      );
      vi.stubGlobal("fetch", fetchMock);

      // Act
      const actual = await fetchJson<typeof expected>(url, init, timeoutMs);

      // Assert
      expect(actual).toEqual(expected);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [, options] = fetchMock.mock.calls[0] as [
        string,
        RequestInit & { signal?: unknown },
      ];

      expect(options.method).toBe("GET");
      expect(options.headers).toEqual({ "x-test": "1" });

      // AbortSignal が渡されていること
      expect(options.signal).toBeTruthy();
      expect(typeof (options.signal as { aborted?: unknown }).aborted).toBe(
        "boolean",
      );
    });

    it("レスポンスが ok=false の場合、HTTP ステータスと本文を含む Error を throw する", async () => {
      // Arrange
      const url = "https://example.test/notfound";
      const init: RequestInit = { method: "GET" };
      const timeoutMs = 1000;

      const fetchMock = vi.fn().mockResolvedValue(
        createMockResponse({
          status: 404,
          statusText: "Not Found",
          ok: false,
          textData: "nope",
        }),
      );
      vi.stubGlobal("fetch", fetchMock);

      // Act & Assert
      await expect(fetchJson(url, init, timeoutMs)).rejects.toThrow(
        /HTTP 404 Not Found: nope/,
      );
    });

    it("ok=false かつ res.text() が失敗する場合でも、Error を throw できる（本文は空として扱う）", async () => {
      // Arrange
      const url = "https://example.test/error";
      const init: RequestInit = { method: "POST" };
      const timeoutMs = 1000;

      const fetchMock = vi.fn().mockResolvedValue(
        createMockResponse({
          status: 500,
          statusText: "Boom",
          ok: false,
          textShouldReject: true,
        }),
      );
      vi.stubGlobal("fetch", fetchMock);

      // Act & Assert
      await expect(fetchJson(url, init, timeoutMs)).rejects.toThrow(
        /HTTP 500 Boom: ?$/,
      );
    });

    it("タイムアウトすると AbortController により abort され、fetch の拒否が伝播する（タイマーも残らない）", async () => {
      // Arrange
      vi.useFakeTimers();

      const url = "https://example.test/slow";
      const init: RequestInit = { method: "GET" };
      const timeoutMs = 50;

      const fetchMock = vi
        .fn()
        .mockImplementation((_url: string, options?: RequestInit) => {
          const signal = options?.signal as AbortSignal | undefined;

          return new Promise((_resolve, reject) => {
            const abortError = Object.assign(new Error("Aborted"), {
              name: "AbortError",
            });

            if (!signal) {
              reject(new Error("signal is required"));
              return;
            }

            if (signal.aborted) {
              reject(abortError);
              return;
            }

            signal.addEventListener("abort", () => reject(abortError), {
              once: true,
            });
          });
        });

      vi.stubGlobal("fetch", fetchMock);

      // Act
      const p = fetchJson(url, init, timeoutMs);
      const assertion = expect(p).rejects.toMatchObject({ name: "AbortError" });
      await vi.advanceTimersByTimeAsync(timeoutMs);

      // Assert
      await assertion;
      expect(vi.getTimerCount()).toBe(0);
    });
  });
});
