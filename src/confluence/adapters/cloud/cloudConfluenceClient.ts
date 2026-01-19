import { ConfluenceConfig } from "@config/confluenceConfig";
import { authHeaders } from "@utils/auth";
import { fetchJson } from "@utils/http";
import { ensureNoTrailingSlash, joinUrl, joinUrlWithExpand } from "@utils/url";

import { GetContentResponse } from "./api/getContentResponse";
import { SearchResponse } from "./api/searchResponse";

/**
 * Cloud 環境で baseUrl に /wiki が付与されない設定にも対応するため URL 形を統一する
 *
 * @param baseUrl Confluence Cloud の baseUrl を受け取る
 * @returns /wiki を含む baseUrl を返す
 */
function cloudWikiBase(baseUrl: string): string {
  // 設定値の揺れによる URL 二重スラッシュや /wiki 重複を避けて API の組み立てを安定させる
  const b = ensureNoTrailingSlash(baseUrl);
  return b.endsWith("/wiki") ? b : `${b}/wiki`;
}

export class CloudConfluenceClient {
  constructor(private readonly cfg: ConfluenceConfig) {}

  /**
   * Cloud の search API を呼び出すための URL と認証ヘッダを組み立てて取得する
   *
   * @param params cql とページング情報を受け取る
   * @returns 検索結果を返す
   * @throws fetchJson が送出する例外をそのまま送出する
   */
  async searchRaw(params: {
    cql: string;
    limit: number;
    start: number;
  }): Promise<SearchResponse> {
    const base = cloudWikiBase(this.cfg.baseUrl);
    const url = new URL(joinUrl(base, "/rest/api/search"));

    // URLSearchParams を使いクエリのエンコード漏れを防ぎ CQL に特殊文字が含まれても安全に送る
    url.searchParams.set("cql", params.cql);
    url.searchParams.set("limit", String(params.limit));
    url.searchParams.set("start", String(params.start));

    return fetchJson<SearchResponse>(
      url.toString(),
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...authHeaders(this.cfg.auth),
        },
      },
      this.cfg.timeoutMs,
    );
  }

  /**
   * Cloud の content API を呼び出すための URL と認証ヘッダを組み立てて取得する
   *
   * @param params id と expand を受け取る
   * @returns コンテンツ取得結果を返す
   * @throws fetchJson が送出する例外をそのまま送出する
   */
  async getContentRaw(params: {
    id: number;
    expand?: string;
  }): Promise<GetContentResponse> {
    const base = cloudWikiBase(this.cfg.baseUrl);

    // パスパラメータ由来の予約文字混入でパス解釈が壊れるのを防ぐ
    const encodedId = encodeURIComponent(params.id);
    const url = new URL(
      joinUrlWithExpand(base, `/rest/api/content/${encodedId}`, params.expand),
    );

    return fetchJson<GetContentResponse>(
      url.toString(),
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...authHeaders(this.cfg.auth),
        },
      },
      this.cfg.timeoutMs,
    );
  }
}
