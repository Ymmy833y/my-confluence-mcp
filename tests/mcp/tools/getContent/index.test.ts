/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GetContentOutput } from "@mcp/tools/getContent/types";
import { logger } from "@utils/logger";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

vi.mock("@utils/logger");

describe("mcp/tools/getContent/index", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("registerGetContentTool", () => {
    it("server.registerTool に正しい tool 名とメタ情報で登録する", async () => {
      // Arrange
      const registerTool = vi.fn();
      const server = { registerTool } as unknown as {
        registerTool: typeof registerTool;
      };

      const gateway = {
        getContent: vi.fn(),
      } as unknown as { getContent: (params: unknown) => Promise<unknown> };

      // Act
      const { registerGetContentTool, GET_CONTENT_TOOL_NAME } =
        await import("@mcp/tools/getContent/index.js");

      registerGetContentTool(server as any, gateway as any, {
        maxBodyMaxChars: 20000,
      });

      // Assert
      expect(registerTool).toHaveBeenCalledTimes(1);

      const [toolName, meta, handler] = registerTool.mock
        .calls[0] as unknown as [string, Record<string, unknown>, unknown];

      expect(toolName).toBe(GET_CONTENT_TOOL_NAME);
      expect(meta).toMatchObject({
        title: "Confluence Get Content",
        annotations: {
          readOnlyHint: true,
          openWorldHint: false,
        },
      });
      expect(typeof handler).toBe("function");
    });

    it("正常系: asMarkdown 未指定の場合、JSON 文字列を返す", async () => {
      // Arrange
      const registerTool = vi.fn();
      const server = { registerTool } as unknown as {
        registerTool: typeof registerTool;
      };

      const gateway = {
        getContent: vi.fn().mockResolvedValue({
          id: "1",
          title: "Title",
          type: "page",
          url: "https://example.com/wiki/pages/1",
          spaceKey: "SPACE",
          spaceName: "Space",
          updated: "2025-01-01T00:00:00Z",
          version: "2",
          body: { representation: "storage", value: "<p>Hello</p>" },
          labels: ["a", "b"],
        }),
      } as unknown as { getContent: (params: unknown) => Promise<unknown> };

      const { registerGetContentTool } =
        await import("@mcp/tools/getContent/index.js");

      registerGetContentTool(server as any, gateway as any, {
        maxBodyMaxChars: 100,
      });

      const handler = registerTool.mock.calls[0]?.[2] as (
        input: unknown,
        ctx: { requestId: string },
      ) => Promise<{
        content: Array<{ type: "text"; text: string }>;
        structuredContent: GetContentOutput;
        isError: boolean;
      }>;

      // Act
      const actual = await handler(
        { id: "1", representation: "storage", includeLabels: true },
        { requestId: "req-1" },
      );

      // Assert
      expect(gateway.getContent).toHaveBeenCalledWith({
        id: "1",
        bodyRepresentation: "storage",
        includeLabels: true,
      });

      expect(actual.isError).toBe(false);
      expect(actual.content).toHaveLength(1);
      expect(actual.content[0]?.type).toBe("text");
      expect(actual.content[0]?.text).toContain('"content"');
      expect(actual.content[0]?.text).toContain('"id": "1"');
    });

    it("正常系: asMarkdown=true の場合、Markdown 文字列を返す", async () => {
      // Arrange
      const registerTool = vi.fn();
      const server = { registerTool } as unknown as {
        registerTool: typeof registerTool;
      };

      const gateway = {
        getContent: vi.fn().mockResolvedValue({
          id: "1",
          title: "Title",
          type: "page",
          url: "https://example.com/wiki/pages/1",
          spaceKey: "SPACE",
          spaceName: "Space",
          updated: "2025-01-01T00:00:00Z",
          version: 2,
          body: { representation: "storage", value: "<p>Hello</p>" },
          labels: ["a", "b"],
        }),
      } as unknown as { getContent: (params: unknown) => Promise<unknown> };

      const { registerGetContentTool } =
        await import("@mcp/tools/getContent/index.js");

      registerGetContentTool(server as any, gateway as any, {
        maxBodyMaxChars: 100,
      });

      const handler = registerTool.mock.calls[0]?.[2] as (
        input: unknown,
        ctx: { requestId: string },
      ) => Promise<{
        content: Array<{ type: "text"; text: string }>;
        structuredContent: GetContentOutput;
        isError: boolean;
      }>;

      // Act
      const actual = await handler(
        {
          id: "1",
          representation: "storage",
          includeLabels: true,
          asMarkdown: true,
        },
        { requestId: "req-2" },
      );

      // Assert
      expect(actual.isError).toBe(false);

      const text = actual.content[0]?.text ?? "";
      expect(text).toContain("# [Title](https://example.com/wiki/pages/1)");
      expect(text).toContain("- id: 1");
      expect(text).toContain("- type: page");
      expect(text).toContain("- spaceKey: SPACE");
      expect(text).toContain("- spaceName: Space");
      expect(text).toContain("- updated: 2025-01-01T00:00:00Z");
      expect(text).toContain("- version: 2");
      expect(text).toContain("- labels: a, b");
      expect(text).toContain("Hello");
    });

    it("bodyMaxChars は options の上限で clamp され、logger.info の params に反映される", async () => {
      // Arrange
      const registerTool = vi.fn();
      const server = { registerTool } as unknown as {
        registerTool: typeof registerTool;
      };

      const gateway = {
        getContent: vi.fn().mockResolvedValue({
          id: "1",
          title: "Title",
          type: null,
          url: null,
          spaceKey: null,
          spaceName: null,
          updated: null,
          version: null,
          body: null,
          labels: null,
        }),
      } as unknown as { getContent: (params: unknown) => Promise<unknown> };

      const { registerGetContentTool } =
        await import("@mcp/tools/getContent/index.js");

      registerGetContentTool(server as any, gateway as any, {
        maxBodyMaxChars: 100,
      });

      const handler = registerTool.mock.calls[0]?.[2] as (
        input: unknown,
        ctx: { requestId: string },
      ) => Promise<unknown>;

      // Act
      await handler(
        {
          id: "1",
          representation: "storage",
          includeLabels: false,
          bodyMaxChars: 99999,
        },
        { requestId: "req-3" },
      );

      // Assert
      expect(logger.info).toHaveBeenCalled();
      const msgs = (logger.info as any).mock.calls.map((c: unknown[]) =>
        String(c[0]),
      );
      expect(msgs.some((m: string) => m.includes('"bodyMaxChars":100'))).toBe(
        true,
      );
    });

    it("異常系: 出力のスキーマ検証が失敗した場合 isError=true を返す", async () => {
      // Arrange
      const registerTool = vi.fn();
      const server = { registerTool } as unknown as {
        registerTool: typeof registerTool;
      };

      const gateway = {
        getContent: vi.fn().mockResolvedValue({
          id: "1",
          title: "Title",
        }),
      } as unknown as { getContent: (params: unknown) => Promise<unknown> };

      const schemaMod = await import("@mcp/tools/getContent/schema.js");
      vi.spyOn(schemaMod.GetContentOutputSchema, "parse").mockImplementation(
        () => {
          throw new ZodError([]);
        },
      );

      const { registerGetContentTool } =
        await import("@mcp/tools/getContent/index.js");

      registerGetContentTool(server as any, gateway as any, {
        maxBodyMaxChars: 100,
      });

      const handler = registerTool.mock.calls[0]?.[2] as (
        input: unknown,
        ctx: { requestId: string },
      ) => Promise<{
        content: Array<{ type: "text"; text: string }>;
        isError: boolean;
      }>;

      // Act
      const actual = await handler(
        { id: "1", representation: "storage", includeLabels: false },
        { requestId: "req-4" },
      );

      // Assert
      expect(actual.isError).toBe(true);
      expect(actual.content[0]?.text).toContain(
        "Tool output validation failed",
      );
      expect(logger.error).toHaveBeenCalled();
    });

    it("異常系: gateway.getContent が例外を投げた場合 isError=true を返す", async () => {
      // Arrange
      const registerTool = vi.fn();
      const server = { registerTool } as unknown as {
        registerTool: typeof registerTool;
      };

      const gateway = {
        getContent: vi.fn().mockRejectedValue(new Error("boom")),
      } as unknown as { getContent: (params: unknown) => Promise<unknown> };

      const { registerGetContentTool } =
        await import("@mcp/tools/getContent/index.js");

      registerGetContentTool(server as any, gateway as any, {
        maxBodyMaxChars: 100,
      });

      const handler = registerTool.mock.calls[0]?.[2] as (
        input: unknown,
        ctx: { requestId: string },
      ) => Promise<{
        content: Array<{ type: "text"; text: string }>;
        isError: boolean;
      }>;

      // Act
      const actual = await handler(
        { id: "1", representation: "storage", includeLabels: false },
        { requestId: "req-5" },
      );

      // Assert
      expect(actual.isError).toBe(true);
      expect(actual.content[0]?.text).toContain('"isError": true');
      expect(actual.content[0]?.text).toContain('"error": "boom"');
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
