"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudGateway = void 0;
function toWebUrl(baseUrl, webui) {
    if (!webui)
        return null;
    // webui が "/spaces/..." みたいな相対のことがあるので baseUrl にぶら下げる
    const base = baseUrl.replace(/\/+$/, "");
    if (webui.startsWith("http://") || webui.startsWith("https://"))
        return webui;
    return `${base}${webui.startsWith("/") ? "" : "/"}${webui}`;
}
class CloudGateway {
    client;
    baseUrl;
    constructor(client, baseUrl) {
        this.client = client;
        this.baseUrl = baseUrl;
    }
    async search(params) {
        const limit = params.limit ?? 25;
        const start = params.start ?? 0;
        const raw = await this.client.searchRaw({ cql: params.cql, limit, start });
        const results = raw.results
            ?.map((r) => {
            const c = r.content;
            const id = c?.id ?? ""; // 取れないケースは後で調整
            const title = c?.title ?? r.title ?? "";
            const url = toWebUrl(this.baseUrl, c?._links?.webui ?? r.url);
            const spaceKey = c?.space?.key;
            const updated = c?.version?.when;
            const excerpt = r.excerpt;
            if (!id || !title)
                return null;
            return { id, title, url, spaceKey, updated, excerpt };
        })
            ?.filter((x) => x !== null) ?? [];
        return {
            total: raw.totalSize ?? results.length,
            start: raw.start ?? start,
            limit: raw.limit ?? limit,
            results,
        };
    }
}
exports.CloudGateway = CloudGateway;
