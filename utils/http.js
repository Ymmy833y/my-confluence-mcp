"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchJson = fetchJson;
const logger_1 = require("./logger");
async function fetchJson(url, init, timeoutMs) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), timeoutMs);
    try {
        const res = await fetch(url, { ...init, signal: ac.signal });
        logger_1.logger.debug(`[fetchJson] response:, ${JSON.stringify({
            url,
            status: res.status,
            statusText: res.statusText,
            ok: res.ok,
            redirected: res.redirected,
            type: res.type,
            contentType: res.headers.get("content-type"),
            contentLength: res.headers.get("content-length"),
        })}`);
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
        }
        const data = (await res.json());
        logger_1.logger.debug(`[fetchJson] response body:, ${JSON.stringify(data)}`);
        return data;
    }
    finally {
        clearTimeout(t);
    }
}
