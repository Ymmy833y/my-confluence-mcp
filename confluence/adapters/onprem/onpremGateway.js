"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnPremGateway = void 0;
function toWebUrl(baseUrl, webui) {
    if (!webui)
        return null;
    const base = baseUrl.replace(/\/+$/, "");
    if (webui.startsWith("http://") || webui.startsWith("https://"))
        return webui;
    return `${base}${webui.startsWith("/") ? "" : "/"}${webui}`;
}
function stableIdFromUrl(url) {
    if (!url)
        return null;
    // オンプレの search 結果は id が無いことがある（らしい）ので暫定IDを生成
    // 例: .../display/SPACEKEY/Page+Title
    return `url:${url}`;
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
class OnPremGateway {
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
            const url = toWebUrl(this.baseUrl, r.url ??
                r.resultParentContainer?.displayUrl ??
                r.resultGlobalContainer?.displayUrl);
            const id = r.id ?? stableIdFromUrl(url);
            const title = r.title ?? r.content?.title ?? "";
            if (!id || !title)
                return null;
            return {
                id,
                title,
                url,
                spaceKey: r.space?.key,
                updated: r.lastModified,
                excerpt: r.excerpt,
            };
        })
            ?.filter((x) => x !== null) ?? [];
        return {
            total: raw.totalCount ?? results.length,
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
        // data がある場合は data を優先して参照する
        const src = raw.data ?? raw;
        const url = toWebUrl(this.baseUrl, src._links?.webui);
        const spaceKey = src.space?.key;
        const spaceName = src.space?.name;
        const updated = src.version?.when;
        const versionRaw = src.version?.number;
        const version = versionRaw != null ? String(versionRaw) : undefined;
        const bodyValue = pickBodyValue(rep, src.body);
        // onprem は metadata.labels が string[] の想定
        // (data 側に metadata が入ってくるケースも念のため拾う)
        const labels = (raw.data?.metadata?.labels ??
            raw.metadata?.labels ??
            []);
        const result = {
            id: src.id ?? raw.id,
            type: src.type ?? "",
            title: src.title ?? "",
            ...(src.status ? { status: src.status } : {}),
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
exports.OnPremGateway = OnPremGateway;
