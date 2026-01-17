import { SearchRequestParams, SearchResponseDto } from "@core/searchTypes";

import { SearchToolInput, SearchToolOutput } from "./types";

/**
 * ツール入力とコア層の検索パラメータの形を揃えて責務の境界を明確にするために変換する
 *
 * @param input ツール側の入力
 * @returns コア層の検索パラメータ
 */
export function toSearchRequestParams(
  input: SearchToolInput,
): SearchRequestParams {
  return {
    cql: input.cql,
    limit: input.limit,
    start: input.start,
  };
}

/**
 * 外部向けの出力形式を固定してレスポンス差分の影響範囲を最小化するために変換する
 *
 * @param response コア層の検索結果
 * @returns ツールの出力
 */
export function toToolOutput(response: SearchResponseDto): SearchToolOutput {
  return {
    results: response.results.map((r): SearchToolOutput["results"][number] => {
      return {
        id: r.id,
        title: r.title,

        // 呼び出し側で欠損チェックの分岐を増やさないため null に正規化する
        type: r.type ?? null,
        url: r.url ?? null,

        // 未設定と空文字を区別して扱いやすくするため null に正規化する
        spaceKey: r.spaceKey ?? null,
        spaceName: r.spaceName ?? null,

        // 欠損時に表示や整形の条件分岐を増やさないため null に正規化する
        excerpt: r.excerpt ?? null,
        lastModified: r.lastModified ?? null,
      };
    }),
    page: {
      total: response.total,
      start: response.start,
      limit: response.limit,
    },
  };
}
