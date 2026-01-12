import { ConfluenceGateway } from "@core/confluenceGateway";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { logger } from "@utils/logger";

import { toGetContentParams, toToolOutput } from "./mapper";
import { GetContentInputSchema, GetContentOutputSchema } from "./schema";
import { GetContentInput, GetContentOutput } from "./types";

export const GET_CONTENT_TOOL_NAME = "confluence_get_content";

const DEFAULT_BODY_MAX_CHARS = 20000;

export type RegisterGetContentToolOptions = {
  maxBodyMaxChars: number; // default: 20000
};

function toMarkdown(out: NonNullable<GetContentOutput["content"]>): string {
  const lines: string[] = [];

  const titleLine = out.url ? `# [${out.title}](${out.url})` : `# ${out.title}`;
  lines.push(titleLine);
  lines.push("");

  lines.push(`- id: ${out.id}`);
  lines.push(`- type: ${out.type}`);
  if (out.spaceKey) lines.push(`- spaceKey: ${out.spaceKey}`);
  if (out.spaceName) lines.push(`- spaceName: ${out.spaceName}`);
  if (out.updated) lines.push(`- updated: ${out.updated}`);
  if (out.version != null) lines.push(`- version: ${out.version}`);

  if (out.labels && out.labels.length > 0) {
    lines.push(`- labels: ${out.labels.join(", ")}`);
  }

  if (out.body) {
    lines.push("");
    lines.push(`## body (${out.body.representation})`);
    lines.push("");
    lines.push("````html");
    lines.push(out.body.value);
    lines.push("````");
  }

  return lines.join("\n");
}

export function registerGetContentTool(
  server: McpServer,
  gateway: ConfluenceGateway,
  options: RegisterGetContentToolOptions,
) {
  const inputSchema = GetContentInputSchema.shape;
  const outputSchema = GetContentOutputSchema.shape;

  server.registerTool(
    GET_CONTENT_TOOL_NAME,
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
      const typedInput = input as GetContentInput;

      const bodyMaxChars = Math.min(
        input.bodyMaxChars ?? DEFAULT_BODY_MAX_CHARS,
        options.maxBodyMaxChars,
      );

      const getContentParams = toGetContentParams(typedInput);

      logger.info(
        `tool called: ${JSON.stringify({
          tool: "confluence_get_content",
          requestId,
          params: { ...typedInput, bodyMaxChars },
        })}`,
      );

      try {
        const getContentResponse = await gateway.getContent(getContentParams);

        const out = toToolOutput(getContentResponse) satisfies GetContentOutput;

        const text = typedInput.asMarkdown
          ? toMarkdown(out.content!)
          : JSON.stringify(out, null, 2);

        return {
          content: [{ type: "text", text }],
          structuredContent: out,
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

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ isError: true, error: message }, null, 2),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
