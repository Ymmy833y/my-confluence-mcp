import { ConfluenceConfig } from "@config/confluenceConfig";
import { authHeaders } from "@utils/auth";
import { fetchJson } from "@utils/http";
import { joinUrl, joinUrlWithExpand } from "@utils/url";

import type { GetContentResponse } from "./api/getContentResponse";
import { SearchResponse } from "./api/searchResponse";

export class OnPremConfluenceClient {
  constructor(private readonly cfg: ConfluenceConfig) {}

  /**
   * On-Prem の search API を呼び出すための URL と認証ヘッダを組み立てて取得する
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
    const url = new URL(joinUrl(this.cfg.baseUrl, "/rest/api/search"));

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
   * On-Prem の content API を呼び出すための URL と認証ヘッダを組み立てて取得する
   *
   * @param params id と expand を受け取る
   * @returns コンテンツ取得結果を返す
   * @throws fetchJson が送出する例外をそのまま送出する
   */
  async getContentRaw(params: {
    id: number;
    expand?: string;
  }): Promise<GetContentResponse> {
    // パスパラメータ由来の予約文字混入でパス解釈が壊れるのを防ぐ
    const encodedId = encodeURIComponent(params.id);
    const url = new URL(
      joinUrlWithExpand(
        this.cfg.baseUrl,
        `/rest/api/content/${encodedId}`,
        params.expand,
      ),
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
