import { loadEnv } from "@config/env";
import { startMcpServer } from "@mcp/server";
import { bindConsoleToLogger, logger } from "@utils/logger";

async function main() {
  bindConsoleToLogger();

  try {
    const env = loadEnv();
    await startMcpServer(env);
  } catch (e) {
    logger.error(e);
    process.exitCode = 1;
  }
}

void main();
