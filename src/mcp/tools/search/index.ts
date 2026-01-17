import { ConfluenceGateway } from "@core/confluenceGateway";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { logger } from "@utils/logger";

import { toSearchRequestParams, toToolOutput } from "./mapper";
import { SearchInputSchema, SearchOutputSchema } from "./schema";
import type { SearchToolInput, SearchToolOutput } from "./types";

export const SEARCH_TOOL_NAME = "confluence_search";

const DEFAULT_LIMIT = 10;

export type RegisterSearchToolOptions = {
  maxLimit: number; // default: 50
  defaultCql: string;
};

/**
 * デフォルトCQLを追加しつつ ORDER BY の位置を維持して検索結果の意図しない並び替えを避ける
 * ORDER BY を後段に残すことで追加条件がソート句を壊さないようにする
 *
 * @param inputCql 入力されたCQL
 * @param defaultCql 既定で付与するCQL
 * @returns 結合後のCQL
 */
function mergeCql(inputCql: string, defaultCql?: string) {
  if (!defaultCql) {
    return inputCql;
  }

  // ORDER BY を最初に見つけた箇所で分割（case-insensitive）
  const m = /(^|\s)order\s+by\s/i.exec(inputCql);
  if (!m || m.index == null) {
    const merged = `(${defaultCql}) AND (${inputCql})`;
    return merged;
  }

  const idx = m.index;
  const main = inputCql.slice(0, idx).trim();
  const orderBy = inputCql.slice(idx).trim();

  const mergedMain = `(${defaultCql}) AND (${main})`;
  return `${mergedMain} ${orderBy}`.trim();
}

/**
 * ツール出力を人が読みやすい Markdown 形式に整形する
 * 検索結果をリンク付き箇条書きにしてモデルやユーザーの参照コストを下げる
 *
 * @param out ツール出力
 * @returns Markdown 文字列
 */
function toMarkdown(out: SearchToolOutput): string {
  const lines: string[] = [];
  lines.push(`total size: ${out.page.total}`);
  lines.push(`size=${out.results.length}, limit=${out.page.limit}`);
  lines.push("");

  for (const r of out.results) {
    const line = r.url ? `- [${r.title} id=${r.id}](${r.url})` : `- ${r.title}`;
    lines.push(line);

    if (r.excerpt) lines.push(`  - ${r.excerpt}`);
    if (r.lastModified) lines.push(`  - updated: ${r.lastModified}`);
    if (r.spaceKey) lines.push(`  - space: ${r.spaceKey}`);
  }
  return lines.join("\n");
}

/**
 * Confluence の検索ツールをサーバに登録する
 * リミット上限と既定CQLを強制して意図しない高負荷検索やスコープ逸脱を避ける
 *
 * @param server MCP サーバ
 * @param gateway Confluence 検索ゲートウェイ
 * @param options 登録オプション
 */
export function registerSearchTool(
  server: McpServer,
  gateway: ConfluenceGateway,
  options: RegisterSearchToolOptions,
): void {
  const inputSchema = SearchInputSchema.shape;
  const outputSchema = SearchOutputSchema.shape;

  server.registerTool(
    SEARCH_TOOL_NAME,
    {
      title: "Confluence Search",
      description:
        "Search Confluence contents and return minimal normalized results.",
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
      inputSchema,
      outputSchema,
    },
    async (input, ctx) => {
      const requestId = ctx.requestId;
      const typedInput = input as SearchToolInput;

      const cql = mergeCql(typedInput.cql, options.defaultCql);

      // 既定値と上限値からリミットを確定して過大な取得要求を抑止する
      const limit = Math.min(
        typedInput.limit ?? DEFAULT_LIMIT,
        options.maxLimit,
      );

      const searchRequestParams = toSearchRequestParams({
        ...typedInput,
        cql,
        limit,
      });

      logger.info(
        `tool called: ${JSON.stringify({
          tool: SEARCH_TOOL_NAME,
          requestId,
          input: typedInput,
          searchRequestParams,
        })}`,
      );

      try {
        const searchResponse = await gateway.search(searchRequestParams);

        const out = toToolOutput(searchResponse) satisfies SearchToolOutput;

        // 既存クライアント互換のため text も返しつつ構造化データも同時に返す
        const text = typedInput.asMarkdown
          ? toMarkdown(out)
          : JSON.stringify(out, null, 2);

        return {
          content: [{ type: "text", text }],
          structuredContent: out,
          isError: false,
        };
      } catch (err: unknown) {
        // 例外の型に依存すると観測不能な失敗になるため必ず文字列化する
        const message = err instanceof Error ? err.message : String(err);

        logger.error(
          `tool error: ${JSON.stringify({
            tool: SEARCH_TOOL_NAME,
            requestId,
            message,
          })}`,
        );

        const fallback: SearchToolOutput = {
          results: [],
          page: {
            total: 0,
            start: typedInput.start,
            limit,
          },
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ isError: true, error: message }, null, 2),
            },
          ],
          structuredContent: fallback,
          isError: true,
        };
      }
    },
  );
}
