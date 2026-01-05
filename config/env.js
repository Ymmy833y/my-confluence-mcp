"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEnv = loadEnv;
const dotenv_1 = require("dotenv");
const zod_1 = require("zod");
const confluenceConfig_1 = require("./confluenceConfig");
const envSchema = zod_1.z
    .object({
    CONFLUENCE_HOSTING: zod_1.z.enum(confluenceConfig_1.CONFLUENCE_HOSTING_VALUES),
    CONFLUENCE_BASE_URL: zod_1.z.url(),
    CONFLUENCE_EMAIL: zod_1.z.string().min(3).optional(),
    CONFLUENCE_API_TOKEN: zod_1.z.string().min(5).optional(),
    CONFLUENCE_PERSONAL_ACCESS_TOKEN: zod_1.z.string().min(5).optional(),
    CONFLUENCE_TIMEOUT_MS: zod_1.z.preprocess((v) => {
        if (v == null || v === "")
            return 15000;
        const n = Number(v);
        return Number.isFinite(n) ? n : v;
    }, zod_1.z.number().int().min(1000).max(120000)),
    CONFLUENCE_BODY_MAX_CHARS: zod_1.z.preprocess((v) => {
        if (v == null || v === "")
            return 20000;
        const n = Number(v);
        return Number.isFinite(n) ? n : v;
    }, zod_1.z.number().int().min(1000).max(200000)),
})
    .superRefine((env, ctx) => {
    // PAT があるなら OK（email/token は不要）
    if (env.CONFLUENCE_PERSONAL_ACCESS_TOKEN)
        return;
    // PAT がないなら email + api token を必須
    if (!env.CONFLUENCE_EMAIL) {
        ctx.addIssue({
            code: "custom",
            path: ["CONFLUENCE_EMAIL"],
            message: "CONFLUENCE_PERSONAL_ACCESS_TOKEN が無い場合は必須です。",
        });
    }
    if (!env.CONFLUENCE_API_TOKEN) {
        ctx.addIssue({
            code: "custom",
            path: ["CONFLUENCE_API_TOKEN"],
            message: "CONFLUENCE_PERSONAL_ACCESS_TOKEN が無い場合は必須です。",
        });
    }
});
function loadEnv(options) {
    if (options?.path) {
        (0, dotenv_1.config)({ path: options.path });
    }
    else {
        (0, dotenv_1.config)();
    }
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
        const msg = parsed.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`);
        throw new Error(`Invalid environment variables: ${msg}`);
    }
    return parsed.data;
}
