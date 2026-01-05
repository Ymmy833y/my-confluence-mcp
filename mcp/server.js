"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMcpServer = startMcpServer;
const confluenceConfig_1 = require("../config/confluenceConfig");
const _confluence_1 = require("../confluence/index.js");
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const logger_1 = require("../utils/logger");
const package_json_1 = __importDefault(require("../../package.json"));
const searchTool_1 = require("./tools/searchTool");
async function startMcpServer(env) {
    const confluenceCfg = (0, confluenceConfig_1.createConfluenceConfig)(env);
    const confluence = (0, _confluence_1.createConfluenceGateway)(confluenceCfg);
    const server = new mcp_js_1.McpServer({
        name: package_json_1.default.name,
        version: package_json_1.default.version,
    });
    (0, searchTool_1.registerSearchTool)(server, confluence);
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    logger_1.logger.info(`Confluence MCP Server running on stdio ${JSON.stringify({
        hosting: confluenceCfg.hosting,
        baseUrl: confluenceCfg.baseUrl,
        timeoutMs: confluenceCfg.timeoutMs,
        bodyMaxChars: confluenceCfg.bodyMaxChars,
        auth: confluenceCfg.auth.kind,
    })}`);
}
