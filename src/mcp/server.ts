import { createConfluenceConfig } from "@config/confluenceConfig";
import type { Env } from "@config/env";
import { createConfluenceGateway } from "@confluence";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { logger } from "@utils/logger";

import pkg from "../../package.json";

import { registerSearchTool } from "./tools/searchTool";

export async function startMcpServer(env: Env) {
  const confluenceCfg = createConfluenceConfig(env);

  const confluence = createConfluenceGateway(confluenceCfg);

  const server = new McpServer({
    name: pkg.name,
    version: pkg.version,
  });

  registerSearchTool(server, confluence);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info(
    `Confluence MCP Server running on stdio ${JSON.stringify({
      hosting: confluenceCfg.hosting,
      baseUrl: confluenceCfg.baseUrl,
      timeoutMs: confluenceCfg.timeoutMs,
      bodyMaxChars: confluenceCfg.bodyMaxChars,
      auth: confluenceCfg.auth.kind,
    })}`,
  );
}
