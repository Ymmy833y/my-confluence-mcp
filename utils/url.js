"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureNoTrailingSlash = ensureNoTrailingSlash;
exports.joinUrl = joinUrl;
function ensureNoTrailingSlash(url) {
    return url.replace(/\/+$/, "");
}
function joinUrl(base, path) {
    return `${ensureNoTrailingSlash(base)}${path.startsWith("/") ? "" : "/"}${path}`;
}
