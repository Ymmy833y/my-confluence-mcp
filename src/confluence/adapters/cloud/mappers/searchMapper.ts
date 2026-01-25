import { SearchResponse } from "@cloud/api/searchResponse";
import {
  SearchRequestParams,
  SearchResponseDto,
  SearchResultDto,
} from "@core/searchTypes";
import { logger } from "@utils/logger";
import { toWebUrl } from "@utils/url";

/**
 * SearchResponse を API 利用側の DTO に変換する
 * API の欠損値があってもリクエスト値や実データから妥当な値を補完する
 *
 * @param p 検索リクエストパラメータ
 * @param r 検索レスポンス
 * @param baseUrl Web URL 生成に使うベース URL
 * @returns DTO 形式の検索レスポンス
 */
export function toSearchResponseDto(
  p: SearchRequestParams,
  r: SearchResponse,
  baseUrl: string,
): SearchResponseDto {
  const results = toSearchResultDto(r.results, baseUrl);
  return {
    total: r.totalSize ?? results.length,
    start: r.start ?? p.start,
    limit: r.limit ?? p.limit,
    results,
  };
}

/**
 * 検索結果一覧を DTO 配列に変換する
 * 必須項目が欠ける要素は後続処理を壊さないために除外する
 *
 * @param results 検索結果の配列
 * @param baseUrl Web URL 生成に使うベース URL
 * @returns DTO 形式の検索結果配列
 */
function toSearchResultDto(
  results: SearchResponse["results"],
  baseUrl: string,
): SearchResultDto[] {
  return (
    results
      .map((r) => {
        const id = r.content?.id;
        const title = r.title ?? r.content?.title;

        if (!id || !title) {
          // 不完全なデータを混ぜると利用側で例外や表示崩れを起こしやすいため除外する
          logger.warn(
            `Skip item: missing required fields (id/title): ${JSON.stringify({ id: id, title: title })}`,
          );
          return null;
        }

        return {
          id,
          title,
          type: r.entityType ?? r.content?.type,
          url: toWebUrl(baseUrl, r.url ?? r.resultGlobalContainer?.displayUrl),
          spaceKey: r.content?.space?.key,
          spaceName: r.content?.space?.name,
          excerpt: r.excerpt,
          lastModified: r.lastModified,
        };
      })
      // null を残すと返却型が不安定になり利用側の分岐が増えるためここで確定的に除去する
      .filter((x): x is NonNullable<typeof x> => x !== null) ?? []
  );
}
