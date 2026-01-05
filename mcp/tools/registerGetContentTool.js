"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGetContentTool = registerGetContentTool;
const logger_1 = require("../../utils/logger");
const zod_1 = require("zod");
const inputSchema = {
    id: zod_1.z.string().min(1).max(128),
    representation: zod_1.z
        .enum(["storage", "view", "export_view"])
        .optional(),
    includeLabels: zod_1.z.boolean().optional(),
    bodyMaxChars: zod_1.z.number().int().min(100).max(200000).optional(),
    asMarkdown: zod_1.z.boolean().optional(),
};
const outputSchema = {
    isError: zod_1.z.boolean(),
    content: zod_1.z
        .object({
        id: zod_1.z.string().min(1),
        type: zod_1.z.string().min(1),
        title: zod_1.z.string().min(1),
        url: zod_1.z.url().nullable(),
        spaceKey: zod_1.z.string().nullable(),
        updated: zod_1.z.string().nullable(),
        version: zod_1.z.string().nullable(),
        body: zod_1.z
            .object({
            representation: zod_1.z.string(),
            value: zod_1.z.string(),
        })
            .nullable(),
        labels: zod_1.z.array(zod_1.z.string()).nullable(),
    })
        .optional(),
    error: zod_1.z.string().optional(),
};
function clampInt(n, min, max) {
    return Math.min(max, Math.max(min, n));
}
function truncateText(s, maxChars) {
    if (s.length <= maxChars)
        return { value: s, truncated: false };
    return { value: s.slice(0, maxChars), truncated: true };
}
function toStructuredContent(r, bodyMaxChars) {
    const body = r.body?.value != null
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
function toMarkdown(c) {
    const lines = [];
    const titleLine = c.url ? `# [${c.title}](${c.url})` : `# ${c.title}`;
    lines.push(titleLine);
    lines.push("");
    lines.push(`- id: ${c.id}`);
    lines.push(`- type: ${c.type}`);
    if (c.spaceKey)
        lines.push(`- spaceKey: ${c.spaceKey}`);
    if (c.updated)
        lines.push(`- updated: ${c.updated}`);
    if (c.version != null)
        lines.push(`- version: ${c.version}`);
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
function registerGetContentTool(server, gateway, options = {}) {
    const defaultBodyMaxChars = options.defaultBodyMaxChars ?? 20000;
    const maxBodyMaxChars = options.maxBodyMaxChars ?? 20000;
    server.registerTool("confluence_get_content", {
        title: "Confluence Get Content",
        description: "Get a Confluence content by id and return normalized result. Read-only, with body truncation.",
        annotations: {
            readOnlyHint: true,
            openWorldHint: false,
        },
        inputSchema,
        outputSchema,
    }, async (input, ctx) => {
        const requestId = ctx.requestId;
        const representation = input.representation ?? "storage";
        const includeLabels = input.includeLabels ?? false;
        const bodyMaxChars = clampInt(input.bodyMaxChars ?? defaultBodyMaxChars, 100, maxBodyMaxChars);
        logger_1.logger.info(`tool called: ${JSON.stringify({
            tool: "confluence_get_content",
            requestId,
            params: {
                id: input.id,
                representation,
                includeLabels,
                bodyMaxChars,
            },
        })}`);
        try {
            const result = await gateway.getContent({
                id: input.id,
                bodyRepresentation: representation,
                includeLabels,
            });
            const structuredContent = {
                isError: false,
                content: toStructuredContent(result, bodyMaxChars),
            };
            const asMarkdown = input.asMarkdown ?? true;
            const text = asMarkdown
                ? toMarkdown(structuredContent.content)
                : JSON.stringify(structuredContent, null, 2);
            return {
                content: [{ type: "text", text }],
                structuredContent,
                isError: false,
            };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger_1.logger.error(`tool error: ${JSON.stringify({
                tool: "confluence_get_content",
                requestId,
                message,
            })}`);
            const structuredContent = {
                isError: true,
                error: message,
            };
            return {
                content: [
                    { type: "text", text: JSON.stringify(structuredContent, null, 2) },
                ],
                structuredContent,
                isError: true,
            };
        }
    });
}
