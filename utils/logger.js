"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.bindConsoleToLogger = bindConsoleToLogger;
const node_util_1 = require("node:util");
const winston_1 = require("winston");
function customPrintfFormat(info) {
    return `${info.timestamp} [${info.level}]: ${info.message}`;
}
const ALL_LEVELS = Object.keys(winston_1.config.npm.levels);
const consoleFormat = process.stderr.isTTY
    ? winston_1.format.combine(winston_1.format.colorize({ all: true }), winston_1.format.printf(customPrintfFormat))
    : winston_1.format.combine(winston_1.format.uncolorize(), winston_1.format.printf(customPrintfFormat));
exports.logger = (0, winston_1.createLogger)({
    level: "info",
    format: winston_1.format.combine(winston_1.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston_1.format.errors({ stack: true }), winston_1.format.splat()),
    transports: [
        new winston_1.transports.Console({
            stderrLevels: ALL_LEVELS, // stdout汚染防止
            format: consoleFormat,
        }),
        new winston_1.transports.File({
            filename: "log/app.log",
            level: "debug",
            format: winston_1.format.printf(customPrintfFormat),
        }),
    ],
});
/**
 * console の出力を logger に転送する
 * （logger が stderr に出るようになっていれば stdout 汚染しない）
 */
function bindConsoleToLogger() {
    const systemConsole = globalThis.console;
    systemConsole.log = (...args) => exports.logger.info((0, node_util_1.format)(...args));
    systemConsole.info = (...args) => exports.logger.info((0, node_util_1.format)(...args));
    systemConsole.warn = (...args) => exports.logger.warn((0, node_util_1.format)(...args));
    systemConsole.error = (...args) => exports.logger.error((0, node_util_1.format)(...args));
    systemConsole.debug = (...args) => exports.logger.debug((0, node_util_1.format)(...args));
}
