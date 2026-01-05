"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudConfluenceClient = void 0;
const auth_1 = require("../../../utils/auth");
const http_1 = require("../../../utils/http");
const url_1 = require("../../../utils/url");
// Cloud は baseUrl が https://xxx.atlassian.net/wiki のことも、https://xxx.atlassian.net のこともあるので補正
function cloudWikiBase(baseUrl) {
    const b = (0, url_1.ensureNoTrailingSlash)(baseUrl);
    return b.endsWith("/wiki") ? b : `${b}/wiki`;
}
class CloudConfluenceClient {
    cfg;
    constructor(cfg) {
        this.cfg = cfg;
    }
    /**
     * Cloud: 例) /wiki/rest/api/search?cql=...&limit=...&start=...
     */
    async searchRaw(params) {
        const base = cloudWikiBase(this.cfg.baseUrl);
        const url = new URL((0, url_1.joinUrl)(base, "/rest/api/search"));
        url.searchParams.set("cql", params.cql);
        url.searchParams.set("limit", String(params.limit));
        url.searchParams.set("start", String(params.start));
        return (0, http_1.fetchJson)(url.toString(), {
            method: "GET",
            headers: {
                Accept: "application/json",
                ...(0, auth_1.authHeaders)(this.cfg.auth),
            },
        }, this.cfg.timeoutMs);
    }
}
exports.CloudConfluenceClient = CloudConfluenceClient;
