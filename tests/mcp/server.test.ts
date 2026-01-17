import type { Env } from "@config/env";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const createConfluenceConfig = vi.fn();
  const createConfluenceGateway = vi.fn();

  const serverConnect = vi.fn();

  const McpServer = vi.fn().mockImplementation(function () {
    return { connect: serverConnect };
  });

  const StdioServerTransport = vi.fn().mockImplementation(function () {
    return {};
  });

  const registerSearchTool = vi.fn();
  const registerGetContentTool = vi.fn();

  const logger = {
    info: vi.fn(),
  };

  return {
    createConfluenceConfig,
    createConfluenceGateway,
    McpServer,
    serverConnect,
    StdioServerTransport,
    registerSearchTool,
    registerGetContentTool,
    logger,
  };
});

vi.mock("@config/confluenceConfig", () => ({
  createConfluenceConfig: mocks.createConfluenceConfig,
}));

vi.mock("@confluence", () => ({
  createConfluenceGateway: mocks.createConfluenceGateway,
}));

vi.mock("@modelcontextprotocol/sdk/server/mcp.js", () => ({
  McpServer: mocks.McpServer,
}));

vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
  StdioServerTransport: mocks.StdioServerTransport,
}));

vi.mock("@utils/logger", () => ({
  logger: mocks.logger,
}));

vi.mock("../../src/mcp/tools/search/index.ts", () => ({
  registerSearchTool: mocks.registerSearchTool,
}));

vi.mock("../../src/mcp/tools/getContent/index.ts", () => ({
  registerGetContentTool: mocks.registerGetContentTool,
}));

vi.mock("../../package.json", () => ({
  default: { name: "test-pkg", version: "0.0.0" },
}));

describe("mcp/server", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.createConfluenceConfig.mockReset();
    mocks.createConfluenceGateway.mockReset();
    mocks.McpServer.mockClear();
    mocks.serverConnect.mockReset();
    mocks.StdioServerTransport.mockClear();
    mocks.registerSearchTool.mockReset();
    mocks.registerGetContentTool.mockReset();
    mocks.logger.info.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("startMcpServer", () => {
    it("設定値を元にツール登録→stdio接続→起動ログ出力を行う", async () => {
      // Arrange
      const env = {} as unknown as Env;

      const confluenceCfg = {
        hosting: "cloud",
        baseUrl: "https://example.atlassian.net/wiki",
        timeoutMs: 12345,
        searchMaxLimit: 50,
        searchDefaultCql: 'type="page"',
        bodyMaxChars: 1000,
        auth: { kind: "token" as const },
      };

      const confluence = { kind: "mock-confluence" };

      mocks.createConfluenceConfig.mockReturnValue(confluenceCfg);
      mocks.createConfluenceGateway.mockReturnValue(confluence);

      const { startMcpServer } = await import("@mcp/server.js");

      // Act
      await startMcpServer(env);

      // Assert
      expect(mocks.createConfluenceConfig).toHaveBeenCalledWith(env);
      expect(mocks.createConfluenceGateway).toHaveBeenCalledWith(confluenceCfg);

      expect(mocks.McpServer).toHaveBeenCalledWith({
        name: "test-pkg",
        version: "0.0.0",
      });

      const serverInstance = mocks.McpServer.mock.results[0]?.value;

      expect(mocks.registerSearchTool).toHaveBeenCalledWith(
        serverInstance,
        confluence,
        {
          maxLimit: confluenceCfg.searchMaxLimit,
          defaultCql: confluenceCfg.searchDefaultCql,
        },
      );

      expect(mocks.registerGetContentTool).toHaveBeenCalledWith(
        serverInstance,
        confluence,
        {
          maxBodyMaxChars: confluenceCfg.bodyMaxChars,
        },
      );

      expect(mocks.StdioServerTransport).toHaveBeenCalledTimes(1);

      const transportInstance =
        mocks.StdioServerTransport.mock.results[0]?.value;

      expect(mocks.serverConnect).toHaveBeenCalledWith(transportInstance);

      expect(mocks.logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Confluence MCP Server running on stdio"),
      );
      expect(mocks.logger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          '"baseUrl":"https://example.atlassian.net/wiki"',
        ),
      );
      expect(mocks.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('"auth":"token"'),
      );
    });
  });
});
