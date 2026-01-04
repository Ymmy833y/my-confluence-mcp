import type { Env } from "./env";

export const CONFLUENCE_HOSTING_VALUES = ["cloud", "onprem"] as const;
export type ConfluenceHosting = (typeof CONFLUENCE_HOSTING_VALUES)[number];

export const ConfluenceAuth = {
  bearer: (token: string) => ({ kind: "bearer", token }) as const,
  basic: (email: string, apiToken: string) =>
    ({ kind: "basic", email, apiToken }) as const,
} as const;

export type ConfluenceAuth =
  | ReturnType<(typeof ConfluenceAuth)["bearer"]>
  | ReturnType<(typeof ConfluenceAuth)["basic"]>;

export interface ConfluenceConfig {
  baseUrl: string;
  hosting: ConfluenceHosting;
  auth: ConfluenceAuth;
  timeoutMs: number;
  bodyMaxChars: number;
}

export const ConfluenceConfig = {} as const;

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export function createConfluenceConfig(env: Env): ConfluenceConfig {
  const baseUrl = stripTrailingSlash(env.CONFLUENCE_BASE_URL);

  // env.tsのsuperRefineで成立が保証される前提（PAT優先）
  const auth: ConfluenceAuth = env.CONFLUENCE_PERSONAL_ACCESS_TOKEN
    ? ConfluenceAuth.bearer(env.CONFLUENCE_PERSONAL_ACCESS_TOKEN)
    : ConfluenceAuth.basic(env.CONFLUENCE_EMAIL!, env.CONFLUENCE_API_TOKEN!);

  return {
    baseUrl,
    hosting: env.CONFLUENCE_HOSTING,
    auth,
    timeoutMs: env.CONFLUENCE_TIMEOUT_MS,
    bodyMaxChars: env.CONFLUENCE_BODY_MAX_CHARS,
  };
}
