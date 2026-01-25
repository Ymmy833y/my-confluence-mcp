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

    CONFLUENCE_EMAIL: z.string().optional(),
    CONFLUENCE_API_TOKEN: z.string().optional(),
    CONFLUENCE_PERSONAL_ACCESS_TOKEN: z.string().optional(),

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

/**
 * 実行環境に応じて読み込む .env ファイルを切り替えつつ、環境変数をスキーマ検証して型安全に扱える状態にする
 *
 * @param options 読み込む .env ファイルのパスを指定するためのオプションを渡す
 * @returns スキーマ検証に成功した環境変数を返す
 * @throws 環境変数がスキーマ検証に失敗した場合に、失敗理由をまとめて例外を投げる
 */
export function loadEnv(options?: { path?: string }): Env {
  if (options?.path) {
    // デプロイ先や実行モードごとに設定ファイルを切り替えられるよう、明示指定がある場合は優先して読み込む
    dotenvConfig({ path: options.path });
  } else {
    dotenvConfig();
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // 起動時に不足・誤設定を一括で発見できるよう、全エラーを収集して診断しやすいメッセージに整形する
    const msg = parsed.error.issues.map(
      (e) => `${e.path.join(".")}: ${e.message}`,
    );
    throw new Error(`Invalid environment variables: ${msg}`);
  }
  return parsed.data;
}
