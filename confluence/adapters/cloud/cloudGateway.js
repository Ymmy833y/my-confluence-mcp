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
function pickBodyValue(rep, body) {
    if (!body)
        return undefined;
    if (rep === "storage")
        return body.storage?.value;
    if (rep === "view")
        return body.view?.value;
    return body.export_view?.value;
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
    async getContent(params) {
        const rep = params.bodyRepresentation ?? "storage";
        const includeLabels = params.includeLabels ?? false;
        const expandParts = ["space", "version", `body.${rep}`];
        if (includeLabels)
            expandParts.push("metadata.labels");
        const raw = await this.client.getContentRaw({
            id: params.id,
            expand: expandParts.join(","),
        });
        const url = toWebUrl(this.baseUrl, raw._links?.webui);
        const spaceKey = raw.space?.key;
        const spaceName = raw.space?.name;
        const updated = raw.version?.when;
        const versionRaw = raw.version?.number;
        const version = versionRaw != null ? String(versionRaw) : undefined;
        const bodyValue = pickBodyValue(rep, raw.body);
        const labels = raw.metadata?.labels?.results
            ?.map((x) => x.name)
            .filter((x) => typeof x === "string" && x.length > 0) ??
            [];
        const result = {
            id: raw.id,
            type: raw.type,
            title: raw.title,
            ...(raw.status ? { status: raw.status } : {}),
            url,
            ...(spaceKey ? { spaceKey } : {}),
            ...(spaceName ? { spaceName } : {}),
            ...(updated ? { updated } : {}),
            ...(version != null ? { version } : {}),
            ...(bodyValue ? { body: { representation: rep, value: bodyValue } } : {}),
            ...(includeLabels ? { labels } : {}),
        };
        return result;
    }
}
exports.CloudGateway = CloudGateway;
