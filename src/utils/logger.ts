import { format as nodeFormat } from "node:util";

import { TransformableInfo } from "logform";
import { config, createLogger, format, transports } from "winston";

function customPrintfFormat(info: TransformableInfo): string {
  return `${info.timestamp} [${info.level}]: ${info.message}`;
}

const ALL_LEVELS = Object.keys(config.npm.levels);

const consoleFormat = process.stderr.isTTY
  ? format.combine(
      format.colorize({ all: true }),
      format.printf(customPrintfFormat),
    )
  : format.combine(format.uncolorize(), format.printf(customPrintfFormat));

export const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.splat(),
  ),
  transports: [
    new transports.Console({
      stderrLevels: ALL_LEVELS, // stdout汚染防止
      format: consoleFormat,
    }),
    new transports.File({
      filename: "log/my-confluence-mcp.log",
      level: "debug",
      format: format.printf(customPrintfFormat),
    }),
  ],
});

/**
 * console の出力を logger に転送する
 * （logger が stderr に出るようになっていれば stdout 汚染しない）
 */
export function bindConsoleToLogger(): void {
  const systemConsole = globalThis.console;

  systemConsole.log = (...args: unknown[]) => logger.info(nodeFormat(...args));
  systemConsole.info = (...args: unknown[]) => logger.info(nodeFormat(...args));
  systemConsole.warn = (...args: unknown[]) => logger.warn(nodeFormat(...args));
  systemConsole.error = (...args: unknown[]) =>
    logger.error(nodeFormat(...args));
  systemConsole.debug = (...args: unknown[]) =>
    logger.debug(nodeFormat(...args));
}
