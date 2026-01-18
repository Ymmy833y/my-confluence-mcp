import { GetContentParams, GetContentResultDto } from "@core/getContentTypes";

import { GetContentInput, GetContentOutput } from "./types";

/**
 * ツール入力とコア層の取得パラメータの形を揃えて責務の境界を明確にするために変換する
 *
 * @param input ツール側の入力
 * @returns コア層の取得パラメータ
 */
export function toGetContentParams(input: GetContentInput): GetContentParams {
  return {
    id: input.id,
    bodyRepresentation: input.representation,
    includeLabels: input.includeLabels,
  };
}

/**
 * 外部向けの出力形式を固定してレスポンス差分の影響範囲を最小化するために変換する
 *
 * @param response コア層の取得結果
 * @returns ツールの出力
 */
export function toToolOutput(response: GetContentResultDto): GetContentOutput {
  // body の欠損時に中途半端な形を返すと呼び出し側の分岐が増えるため null に正規化する
  const body = response.body?.value
    ? {
        representation: response.body.representation,
        value: response.body.value,
      }
    : null;

  return {
    content: {
      id: response.id,
      title: response.title,
      type: response.type ?? null,
      url: response.url ?? null,
      spaceKey: response.spaceKey ?? null,
      spaceName: response.spaceName ?? null,
      updated: response.updated ?? null,
      version: response.version ?? null,
      body,
      labels: response.labels ?? null,
    },
  };
}
