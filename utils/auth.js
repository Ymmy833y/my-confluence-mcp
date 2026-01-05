"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authHeaders = authHeaders;
function authHeaders(auth) {
    if (auth.kind === "bearer")
        return { Authorization: `Bearer ${auth.token}` };
    if (auth.kind === "basic") {
        const token = Buffer.from(`${auth.email}:${auth.apiToken}`).toString("base64");
        return { Authorization: `Basic ${token}` };
    }
    return {};
}
