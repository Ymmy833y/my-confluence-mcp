"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSearchTool = registerSearchTool;
const logger_1 = require("../../utils/logger");
const zod_1 = require("zod");
const inputSchema = {
    cql: zod_1.z.string().min(1).max(4000),
    limit: zod_1.z.number().int().min(1).max(50).optional(),
    start: zod_1.z.number().int().min(0).optional(),
    asMarkdown: zod_1.z.boolean().optional(),
};
// 成功/失敗で同一 schema
// - isError: true なら error を返す
// - isError: false なら page を返す
const outputSchema = {
    isError: zod_1.z.boolean(),
    page: zod_1.z
        .object({
        total: zod_1.z.number().int().nonnegative(),
        start: zod_1.z.number().int().nonnegative(),
        limit: zod_1.z.number().int().positive(),
        results: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string().min(1),
            title: zod_1.z.string().min(1),
            url: zod_1.z.string().url().nullable(),
            spaceKey: zod_1.z.string().nullable(),
            updated: zod_1.z.string().nullable(),
            excerpt: zod_1.z.string().nullable(),
        })),
    })
        .optional(),
    error: zod_1.z.string().optional(),
};
function clampInt(n, min, max) {
    return Math.min(max, Math.max(min, n));
}
function toStructuredPage(page) {
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
function toMarkdown(page) {
    const lines = [];
    lines.push(`見つかった件数: ${page.total}`);
    lines.push(`start=${page.start}, limit=${page.limit}`);
    lines.push("");
    for (const r of page.results) {
        const line = r.url ? `- [${r.title}](${r.url})` : `- ${r.title}`;
        lines.push(line);
        if (r.excerpt)
            lines.push(`  - ${r.excerpt}`);
        if (r.updated)
            lines.push(`  - updated: ${r.updated}`);
        if (r.spaceKey)
            lines.push(`  - space: ${r.spaceKey}`);
    }
    return lines.join("\n");
}
function registerSearchTool(server, gateway, options = {}) {
    const defaultLimit = options.defaultLimit ?? 25;
    const maxLimit = options.maxLimit ?? 50;
    server.registerTool("confluence_search", {
        title: "Confluence Search",
        description: "Run a Confluence CQL search and return normalized results.",
        annotations: {
            readOnlyHint: true,
            openWorldHint: false,
        },
        inputSchema,
        outputSchema,
    }, async (input, ctx) => {
        const requestId = ctx.requestId;
        // exactOptionalPropertyTypes 対策
        const limit = clampInt(input.limit ?? defaultLimit, 1, maxLimit);
        const start = Math.max(0, input.start ?? 0);
        const params = {
            cql: input.cql,
            limit,
            start,
        };
        logger_1.logger.info(`tool called: ${JSON.stringify({ tool: "confluence_search", required: requestId, params })}`);
        try {
            const page = await gateway.search(params);
            const structured = {
                isError: false,
                page: toStructuredPage(page),
            };
            const asMarkdown = input.asMarkdown ?? true;
            const text = asMarkdown
                ? toMarkdown(page)
                : JSON.stringify(structured, null, 2);
            return {
                content: [{ type: "text", text }],
                structuredContent: structured,
                isError: false,
            };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger_1.logger.error(`tool error: ${JSON.stringify({ tool: "confluence_search", requestId, message })}`);
            const structured = {
                isError: true,
                error: message,
            };
            return {
                content: [
                    { type: "text", text: JSON.stringify(structured, null, 2) },
                ],
                structuredContent: structured,
                isError: true,
            };
        }
    });
}
