import { ConfluenceAuth } from "@config/confluenceConfig";

/**
 * Confluence の認証種別に合わせて Authorization ヘッダーを生成する
 * 呼び出し側の分岐をなくして認証方式の違いをこの関数に閉じ込めるために用意する
 *
 * @param auth Confluence の認証情報
 * @returns Authorization を含むヘッダーオブジェクト 認証不要の場合は空オブジェクト
 */
export function authHeaders(auth: ConfluenceAuth): Record<string, string> {
  if (auth.kind === "bearer") return { Authorization: `Bearer ${auth.token}` };
  if (auth.kind === "basic") {
    // Basic 認証は RFC に従い email と apiToken を base64 化して送る必要があるためここで変換する
    const token = Buffer.from(`${auth.email}:${auth.apiToken}`).toString(
      "base64",
    );
    return { Authorization: `Basic ${token}` };
  }
  return {};
}
