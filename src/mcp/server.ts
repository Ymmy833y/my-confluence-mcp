import { createConfluenceConfig } from "@config/confluenceConfig";
import type { Env } from "@config/env";
import { createConfluenceGateway } from "@confluence";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { logger } from "@utils/logger";

import pkg from "../../package.json";

import { registerGetContentTool } from "./tools/getContent/index";
import { registerSearchTool } from "./tools/search/index";

/**
 * Confluence 向けの MCP Server を stdio で起動して利用可能なツールを登録する
 * 設定値を集約して起動時ログに出すことで実行環境の差分を追跡可能にする
 *
 * @param env 実行環境の設定値
 * @returns 接続完了まで待機する Promise を返す
 * @throws Confluence 設定の生成や Gateway 初期化に失敗した場合に例外を投げる
 * @throws MCP Server の接続に失敗した場合に例外を投げる
 */
export async function startMcpServer(env: Env) {
  const confluenceCfg = createConfluenceConfig(env);

  const confluence = createConfluenceGateway(confluenceCfg);

  const server = new McpServer({
    name: pkg.name,
    version: pkg.version,
  });

  registerSearchTool(server, confluence, {
    maxLimit: confluenceCfg.searchMaxLimit,
    defaultCql: confluenceCfg.searchDefaultCql,
  });

  registerGetContentTool(server, confluence, {
    maxBodyMaxChars: confluenceCfg.bodyMaxChars,
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info(
    `Confluence MCP Server running on stdio ${JSON.stringify({
      hosting: confluenceCfg.hosting,
      baseUrl: confluenceCfg.baseUrl,
      timeoutMs: confluenceCfg.timeoutMs,
      maxLimit: confluenceCfg.searchMaxLimit,
      defaultCql: confluenceCfg.searchDefaultCql,
      bodyMaxChars: confluenceCfg.bodyMaxChars,
      auth: confluenceCfg.auth.kind,
    })}`,
  );
}
