import { config as dotenvConfig } from "dotenv";
import { z } from "zod";

import { CONFLUENCE_HOSTING_VALUES } from "./confluenceConfig";

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_SEARCH_MAX_LIMIT = 50;
const DEFAULT_MAX_BODY_MAX_CHARS = 20000;

const envSchema = z
  .object({
    CONFLUENCE_HOSTING: z.enum(CONFLUENCE_HOSTING_VALUES),

    CONFLUENCE_BASE_URL: z.url(),

    CONFLUENCE_EMAIL: z.string().min(3).optional(),
    CONFLUENCE_API_TOKEN: z.string().min(5).optional(),
    CONFLUENCE_PERSONAL_ACCESS_TOKEN: z.string().min(5).optional(),

    CONFLUENCE_TIMEOUT_MS: z.preprocess((v) => {
      if (v == null || v === "") return DEFAULT_TIMEOUT_MS;
      const n = Number(v);
      return Number.isFinite(n) ? n : v;
    }, z.number().int().default(DEFAULT_TIMEOUT_MS)),

    CONFLUENCE_SEARCH_MAX_LIMIT: z.preprocess((v) => {
      if (v == null || v === "") return DEFAULT_SEARCH_MAX_LIMIT;
      const n = Number(v);
      return Number.isFinite(n) ? n : v;
    }, z.number().int().default(DEFAULT_SEARCH_MAX_LIMIT)),

    CONFLUENCE_DEFAULT_CQL: z.string().trim().default(""),

    CONFLUENCE_BODY_MAX_CHARS: z.preprocess((v) => {
      if (v == null || v === "") return DEFAULT_MAX_BODY_MAX_CHARS;
      const n = Number(v);
      return Number.isFinite(n) ? n : v;
    }, z.number().int().default(DEFAULT_MAX_BODY_MAX_CHARS)),
  })
  .superRefine((env, ctx) => {
    // PAT があるなら OK（email/token は不要）
    if (env.CONFLUENCE_PERSONAL_ACCESS_TOKEN) return;

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

export type Env = z.infer<typeof envSchema>;

export function loadEnv(options?: { path?: string }): Env {
  if (options?.path) {
    dotenvConfig({ path: options.path });
  } else {
    dotenvConfig();
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map(
      (e) => `${e.path.join(".")}: ${e.message}`,
    );
    throw new Error(`Invalid environment variables: ${msg}`);
  }
  return parsed.data;
}
