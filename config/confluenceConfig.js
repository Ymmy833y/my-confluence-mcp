"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfluenceConfig = exports.ConfluenceAuth = exports.CONFLUENCE_HOSTING_VALUES = void 0;
exports.createConfluenceConfig = createConfluenceConfig;
exports.CONFLUENCE_HOSTING_VALUES = ["cloud", "onprem"];
exports.ConfluenceAuth = {
    bearer: (token) => ({ kind: "bearer", token }),
    basic: (email, apiToken) => ({ kind: "basic", email, apiToken }),
};
exports.ConfluenceConfig = {};
function stripTrailingSlash(url) {
    return url.replace(/\/+$/, "");
}
function createConfluenceConfig(env) {
    const baseUrl = stripTrailingSlash(env.CONFLUENCE_BASE_URL);
    // env.tsのsuperRefineで成立が保証される前提（PAT優先）
    const auth = env.CONFLUENCE_PERSONAL_ACCESS_TOKEN
        ? exports.ConfluenceAuth.bearer(env.CONFLUENCE_PERSONAL_ACCESS_TOKEN)
        : exports.ConfluenceAuth.basic(env.CONFLUENCE_EMAIL, env.CONFLUENCE_API_TOKEN);
    return {
        baseUrl,
        hosting: env.CONFLUENCE_HOSTING,
        auth,
        timeoutMs: env.CONFLUENCE_TIMEOUT_MS,
        bodyMaxChars: env.CONFLUENCE_BODY_MAX_CHARS,
    };
}
