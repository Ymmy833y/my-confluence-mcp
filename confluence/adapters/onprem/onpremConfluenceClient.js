"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnPremConfluenceClient = void 0;
const auth_1 = require("../../../utils/auth");
const http_1 = require("../../../utils/http");
const url_1 = require("../../../utils/url");
class OnPremConfluenceClient {
    cfg;
    constructor(cfg) {
        this.cfg = cfg;
    }
    // On-Prem: 例) /rest/api/search?cql=...&limit=...&start=...
    async searchRaw(params) {
        const url = new URL((0, url_1.joinUrl)(this.cfg.baseUrl, "/rest/api/search"));
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
exports.OnPremConfluenceClient = OnPremConfluenceClient;
