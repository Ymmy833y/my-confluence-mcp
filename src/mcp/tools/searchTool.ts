import { ConfluenceGateway } from "@core/confluenceGateway";
import { SearchParams, SearchResultPage } from "@core/searchResult";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { logger } from "@utils/logger";
import { z } from "zod";

export type RegisterSearchToolOptions = {
  defaultLimit?: number; // default: 25
  maxLimit?: number; // default: 50
  defaultCql?: string;
};

const inputSchema = {
  cql: z.string().min(1).max(4000),
  limit: z.number().int().min(1).max(50).optional(),
  start: z.number().int().min(0).optional(),
  asMarkdown: z.boolean().optional(),
};

// 成功/失敗で同一 schema
// - isError: true なら error を返す
// - isError: false なら page を返す
const outputSchema = {
  isError: z.boolean(),
  page: z
    .object({
      total: z.number().int().nonnegative(),
      start: z.number().int().nonnegative(),
      limit: z.number().int().positive(),
      results: z.array(
        z.object({
          id: z.string().min(1),
          title: z.string().min(1),
          url: z.string().url().nullable(),
          spaceKey: z.string().nullable(),
          updated: z.string().nullable(),
          excerpt: z.string().nullable(),
        }),
      ),
    })
    .optional(),
  error: z.string().optional(),
};

function clampInt(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function toStructuredPage(page: SearchResultPage) {
  return {
    total: page.total,
    start: page.start,
    limit: page.limit,
    results: page.results.map((r) => ({
      id: r.id,
      title: r.title,
      url: r.url,
      spaceKey: r.spaceKey ?? null,
      updated: r.updated ?? null,
      excerpt: r.excerpt ?? null,
    })),
  };
}

function toMarkdown(page: SearchResultPage): string {
  const lines: string[] = [];
  lines.push(`見つかった件数: ${page.total}`);
  lines.push(`start=${page.start}, limit=${page.limit}`);
  lines.push("");

  for (const r of page.results) {
    const line = r.url ? `- [${r.title}](${r.url})` : `- ${r.title}`;
    lines.push(line);
    if (r.excerpt) lines.push(`  - ${r.excerpt}`);
    if (r.updated) lines.push(`  - updated: ${r.updated}`);
    if (r.spaceKey) lines.push(`  - space: ${r.spaceKey}`);
  }
  return lines.join("\n");
}
function mergeCql(defaultCql: string | undefined, userCql: string): string {
  const d = defaultCql?.trim();
  const u = userCql.trim();
  if (!d) return u;

  // ORDER BY を最初に見つけた箇所で分割（case-insensitive）
  const m = /(^|\s)order\s+by\s/i.exec(u);
  if (!m || m.index == null) {
    const merged = `(${d}) AND (${u})`;
    return merged;
  }

  const idx = m.index;
  const main = u.slice(0, idx).trim();
  const orderBy = u.slice(idx).trim();

  const mergedMain = `(${d}) AND (${main})`;
  return `${mergedMain} ${orderBy}`.trim();
}

export function registerSearchTool(
  server: McpServer,
  gateway: ConfluenceGateway,
  options: RegisterSearchToolOptions = {},
) {
  const defaultLimit = options.defaultLimit ?? 25;
  const maxLimit = options.maxLimit ?? 50;
  const defaultCql = options.defaultCql?.trim() || undefined;

  server.registerTool(
    "confluence_search",
    {
      title: "Confluence Search",
      description: "Run a Confluence CQL search and return normalized results.",
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
      inputSchema,
      outputSchema,
    },
    async (input, ctx) => {
      const requestId = ctx.requestId;

      // exactOptionalPropertyTypes 対策
      const limit = clampInt(input.limit ?? defaultLimit, 1, maxLimit);
      const start = Math.max(0, input.start ?? 0);

      const mergedCql = mergeCql(defaultCql, input.cql);
      if (mergedCql.length > 4000) {
        throw new Error(
          `CQL is too long after merging default CQL (len=${mergedCql.length}). Reduce CONFLUENCE_DEFAULT_CQL or input cql.`,
        );
      }

      const params: SearchParams = {
        cql: mergedCql,
        limit,
        start,
      };

      logger.info(
        `tool called: ${JSON.stringify({
          tool: "confluence_search",
          requestId,
          params: {
            ...params,
            userCql: input.cql,
            defaultCql: defaultCql ?? null,
          },
        })}`,
      );

      try {
        const page = await gateway.search(params);

        const structured = {
          isError: false,
          page: toStructuredPage(page),
        } satisfies z.infer<z.ZodObject<typeof outputSchema>>;

        const asMarkdown = input.asMarkdown ?? true;
        const text = asMarkdown
          ? toMarkdown(page)
          : JSON.stringify(structured, null, 2);

        return {
          content: [{ type: "text", text }],
          structuredContent: structured,
          isError: false,
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);

        logger.error(
          `tool error: ${JSON.stringify({ tool: "confluence_search", requestId, message })}`,
        );

        const structured = {
          isError: true,
          error: message,
        } satisfies z.infer<z.ZodObject<typeof outputSchema>>;

        return {
          content: [
            { type: "text", text: JSON.stringify(structured, null, 2) },
          ],
          structuredContent: structured,
          isError: true,
        };
      }
    },
  );
}
