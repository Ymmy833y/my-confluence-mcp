"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./config/env");
const server_1 = require("./mcp/server");
const logger_1 = require("./utils/logger");
async function main() {
    (0, logger_1.bindConsoleToLogger)();
    try {
        const env = (0, env_1.loadEnv)();
        await (0, server_1.startMcpServer)(env);
    }
    catch (e) {
        logger_1.logger.error(e);
        process.exitCode = 1;
    }
}
void main();
