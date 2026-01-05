import type { ConfluenceGateway } from "@core/confluenceGateway";
import type { GetContentResult } from "@core/getContentResult";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { logger } from "@utils/logger";
import { z } from "zod";

export type RegisterGetContentToolOptions = {
  defaultBodyMaxChars?: number; // default: 20000
  maxBodyMaxChars?: number; // default: 20000（環境側上限に合わせて渡す想定）
};

const inputSchema = {
  id: z.string().min(1).max(128),
  representation: z
    .enum(["storage", "view", "export_view"])
    .optional() satisfies z.ZodType<string | undefined>,
  includeLabels: z.boolean().optional(),
  bodyMaxChars: z.number().int().min(100).max(200000).optional(),
  asMarkdown: z.boolean().optional(),
};

const outputSchema = {
  isError: z.boolean(),
  content: z
    .object({
      id: z.string().min(1),
      type: z.string().min(1),
      title: z.string().min(1),
      url: z.url().nullable(),
      spaceKey: z.string().nullable(),
      updated: z.string().nullable(),
      version: z.string().nullable(),
      body: z
        .object({
          representation: z.string(),
          value: z.string(),
        })
        .nullable(),
      labels: z.array(z.string()).nullable(),
    })
    .optional(),
  error: z.string().optional(),
};

function clampInt(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function truncateText(
  s: string,
  maxChars: number,
): { value: string; truncated: boolean } {
  if (s.length <= maxChars) return { value: s, truncated: false };
  return { value: s.slice(0, maxChars), truncated: true };
}

function toStructuredContent(
  r: GetContentResult,
  bodyMaxChars: number,
): z.infer<z.ZodObject<typeof outputSchema>>["content"] {
  const body =
    r.body?.value != null
      ? (() => {
          const t = truncateText(r.body.value, bodyMaxChars);
          return {
            representation: r.body.representation,
            value: t.value,
          };
        })()
      : null;

  return {
    id: r.id,
    type: r.type,
    title: r.title,
    url: r.url ?? null,
    spaceKey: r.spaceKey ?? null,
    updated: r.updated ?? null,
    version: r.version ?? null,
    body,
    labels: r.labels ?? null,
  };
}

function toMarkdown(
  c: NonNullable<z.infer<z.ZodObject<typeof outputSchema>>["content"]>,
): string {
  const lines: string[] = [];

  const titleLine = c.url ? `# [${c.title}](${c.url})` : `# ${c.title}`;
  lines.push(titleLine);
  lines.push("");

  lines.push(`- id: ${c.id}`);
  lines.push(`- type: ${c.type}`);
  if (c.spaceKey) lines.push(`- spaceKey: ${c.spaceKey}`);
  if (c.updated) lines.push(`- updated: ${c.updated}`);
  if (c.version != null) lines.push(`- version: ${c.version}`);

  if (c.labels && c.labels.length > 0) {
    lines.push(`- labels: ${c.labels.join(", ")}`);
  }

  if (c.body) {
    lines.push("");
    lines.push(`## body (${c.body.representation})`);
    lines.push("");
    lines.push("```html");
    lines.push(c.body.value);
    lines.push("```");
  }

  return lines.join("\n");
}

export function registerGetContentTool(
  server: McpServer,
  gateway: ConfluenceGateway,
  options: RegisterGetContentToolOptions = {},
) {
  const defaultBodyMaxChars = options.defaultBodyMaxChars ?? 20000;
  const maxBodyMaxChars = options.maxBodyMaxChars ?? 20000;

  server.registerTool(
    "confluence_get_content",
    {
      title: "Confluence Get Content",
      description:
        "Get a Confluence content by id and return normalized result. Read-only, with body truncation.",
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
      inputSchema,
      outputSchema,
    },
    async (input, ctx) => {
      const requestId = ctx.requestId;

      const representation = input.representation ?? "storage";
      const includeLabels = input.includeLabels ?? false;

      const bodyMaxChars = clampInt(
        input.bodyMaxChars ?? defaultBodyMaxChars,
        100,
        maxBodyMaxChars,
      );

      logger.info(
        `tool called: ${JSON.stringify({
          tool: "confluence_get_content",
          requestId,
          params: {
            id: input.id,
            representation,
            includeLabels,
            bodyMaxChars,
          },
        })}`,
      );

      try {
        const result = await gateway.getContent({
          id: input.id,
          bodyRepresentation: representation,
          includeLabels,
        });

        const structuredContent = {
          isError: false,
          content: toStructuredContent(result, bodyMaxChars),
        } satisfies z.infer<z.ZodObject<typeof outputSchema>>;

        const asMarkdown = input.asMarkdown ?? true;
        const text = asMarkdown
          ? toMarkdown(structuredContent.content!)
          : JSON.stringify(structuredContent, null, 2);

        return {
          content: [{ type: "text", text }],
          structuredContent,
          isError: false,
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);

        logger.error(
          `tool error: ${JSON.stringify({
            tool: "confluence_get_content",
            requestId,
            message,
          })}`,
        );

        const structuredContent = {
          isError: true,
          error: message,
        } satisfies z.infer<z.ZodObject<typeof outputSchema>>;

        return {
          content: [
            { type: "text", text: JSON.stringify(structuredContent, null, 2) },
          ],
          structuredContent,
          isError: true,
        };
      }
    },
  );
}
