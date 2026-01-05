"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureNoTrailingSlash = ensureNoTrailingSlash;
exports.joinUrl = joinUrl;
exports.joinUrlWithExpand = joinUrlWithExpand;
function ensureNoTrailingSlash(url) {
    return url.replace(/\/+$/, "");
}
function joinUrl(base, path) {
    return `${ensureNoTrailingSlash(base)}${path.startsWith("/") ? "" : "/"}${path}`;
}
function joinUrlWithExpand(base, path, expand) {
    const url = new URL(joinUrl(base, path));
    if (expand && expand.length > 0) {
        url.searchParams.set("expand", expand);
    }
    return url.toString();
}
