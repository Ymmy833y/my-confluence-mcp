/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

vi.mock("@utils/logger");

describe("mcp/tools/search/index", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registerSearchTool: サーバへツール名・メタ情報・スキーマを登録できる", async () => {
    // Arrange
    const mod = await import("@mcp/tools/search/index.js");
    const { SearchInputSchema, SearchOutputSchema } =
      await import("@mcp/tools/search/schema.js");
    const { logger } = await import("@utils/logger.js");

    const server = { registerTool: vi.fn() } as any;
    const gateway = { search: vi.fn() } as any;

    // Act
    mod.registerSearchTool(server, gateway, {
      maxLimit: 50,
      defaultCql: "space=ABC",
    });

    // Assert
    expect(server.registerTool).toHaveBeenCalledTimes(1);

    const call = (server.registerTool as any).mock.calls[0];
    expect(call[0]).toBe(mod.SEARCH_TOOL_NAME);
    expect(call[1]).toEqual({
      title: "Confluence Search",
      description:
        "Search Confluence contents and return minimal normalized results.",
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: SearchInputSchema.shape,
      outputSchema: SearchOutputSchema.shape,
    });
    expect(typeof call[2]).toBe("function");

    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("正常系: defaultCql を ORDER BY を維持して結合し、limit を maxLimit でクランプして検索する", async () => {
    // Arrange
    const mod = await import("@mcp/tools/search/index.js");

    const server = { registerTool: vi.fn() } as any;
    const gateway = {
      search: vi.fn().mockResolvedValue({
        total: 1,
        start: 0,
        limit: 50,
        results: [],
      }),
    } as any;

    mod.registerSearchTool(server, gateway, {
      maxLimit: 50,
      defaultCql: "space=ABC",
    });
    const handler = (server.registerTool as any).mock.calls[0][2];

    // Act
    const actual = await handler(
      {
        cql: "type=page order by created desc",
        limit: 100,
        start: 0,
        asMarkdown: false,
      },
      { requestId: "req-1" },
    );

    // Assert
    expect(gateway.search).toHaveBeenCalledTimes(1);
    expect(gateway.search).toHaveBeenCalledWith({
      cql: "(space=ABC) AND (type=page) order by created desc",
      limit: 50,
      start: 0,
    });

    const out = {
      results: [],
      page: { total: 1, start: 0, limit: 50 },
    };

    expect(actual.isError).toBe(false);
    expect(actual.structuredContent).toEqual(out);
    expect(actual.content).toHaveLength(1);
    expect(actual.content[0]?.type).toBe("text");

    const parsedText = JSON.parse(actual.content[0]?.text ?? "{}");
    expect(parsedText).toEqual(out);
  });

  it("正常系: asMarkdown=true のとき Markdown 形式で返す", async () => {
    // Arrange
    const mod = await import("@mcp/tools/search/index.js");

    const server = { registerTool: vi.fn() } as any;
    const gateway = {
      search: vi.fn().mockResolvedValue({
        total: 7,
        start: 0,
        limit: 10,
        results: [
          {
            id: "123",
            title: "Hello",
            type: "page",
            url: "https://example.com",
            spaceKey: "ABC",
            spaceName: "Space",
            excerpt: "Excerpt",
            lastModified: "2026-01-01",
          },
        ],
      }),
    } as any;

    mod.registerSearchTool(server, gateway, { maxLimit: 50, defaultCql: "" });
    const handler = (server.registerTool as any).mock.calls[0][2];

    // Act
    const actual = await handler(
      { cql: "type=page", limit: 10, start: 0, asMarkdown: true },
      { requestId: "req-2" },
    );

    // Assert
    const out = {
      results: [
        {
          id: "123",
          title: "Hello",
          type: "page",
          url: "https://example.com",
          spaceKey: "ABC",
          spaceName: "Space",
          excerpt: "Excerpt",
          lastModified: "2026-01-01",
        },
      ],
      page: { total: 7, start: 0, limit: 10 },
    };

    expect(actual).toEqual({
      content: [
        {
          type: "text",
          text: [
            "total size: 7",
            "size=1, limit=10",
            "",
            "- [Hello id=123](https://example.com)",
            "  - Excerpt",
            "  - updated: 2026-01-01",
            "  - space: ABC",
          ].join("\n"),
        },
      ],
      structuredContent: out,
      isError: false,
    });
  });

  it("異常系: 出力のスキーマ検証が失敗した場合 isError=true を返す", async () => {
    // Arrange
    const mod = await import("@mcp/tools/search/index.js");
    const schemaMod = await import("@mcp/tools/search/schema.js");
    const { logger } = await import("@utils/logger.js");

    const server = { registerTool: vi.fn() } as any;
    const gateway = {
      search: vi.fn().mockResolvedValue({
        total: 1,
        start: 0,
        limit: 10,
        results: [],
      }),
    } as any;

    vi.spyOn(schemaMod.SearchOutputSchema, "parse").mockImplementation(() => {
      throw new ZodError([]);
    });

    mod.registerSearchTool(server, gateway, { maxLimit: 50, defaultCql: "" });
    const handler = (server.registerTool as any).mock.calls[0][2];

    // Act
    const actual = await handler(
      { cql: "type=page", limit: 10, start: 0, asMarkdown: false },
      { requestId: "req-3" },
    );

    // Assert
    expect(actual.isError).toBe(true);
    expect(actual.content[0]?.text).toContain("Tool output validation failed");
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it("異常系: gateway.search が失敗したら isError=true を返す", async () => {
    // Arrange
    const mod = await import("@mcp/tools/search/index.js");
    const { logger } = await import("@utils/logger.js");

    const server = { registerTool: vi.fn() } as any;
    const gateway = {
      search: vi.fn().mockRejectedValue(new Error("boom")),
    } as any;

    mod.registerSearchTool(server, gateway, {
      maxLimit: 5,
      defaultCql: "space=ABC",
    });
    const handler = (server.registerTool as any).mock.calls[0][2];

    // Act
    const actual = await handler(
      { cql: "type=page", limit: 100, start: 20, asMarkdown: false },
      { requestId: "req-4" },
    );

    // Assert
    expect(gateway.search).toHaveBeenCalledTimes(1);
    expect(gateway.search).toHaveBeenCalledWith({
      cql: "(space=ABC) AND (type=page)",
      limit: 5,
      start: 20,
    });

    expect(logger.error).toHaveBeenCalledTimes(1);

    expect(actual).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify({ isError: true, error: "boom" }, null, 2),
        },
      ],
      isError: true,
    });
  });
});
