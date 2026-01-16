import { GetContentResponse } from "@cloud/api/getContentResponse";
import {
  BodyRepresentation,
  GetContentParams,
  GetContentResultDto,
} from "@core/getContentTypes";
import { toWebUrl } from "@utils/url";

/**
 * 指定した representation が無い場合でも本文を返す必要があるため代替順序を設けて値を選択する
 *
 * @param representation 優先して取得したい本文の表現形式
 * @param body APIレスポンスに含まれる本文オブジェクト
 * @returns 選択された表現形式と本文のペアを返す 取得できない場合は undefined を返す
 */
function pickBodyValue(
  representation: BodyRepresentation,
  body: GetContentResponse["body"],
):
  | {
      representation: BodyRepresentation;
      value: string;
    }
  | undefined {
  if (!body) return undefined;

  const preferred = body[representation];
  if (preferred?.value != null) {
    return { representation, value: preferred.value };
  }
  // 呼び出し側が期待する representation が無い場合でも表示可能な本文を返すため storage を優先する
  if (body.storage?.value != null) {
    return { representation: "storage", value: body.storage.value };
  }
  // storage が無い場合に UI 表示へ近い内容を返すため view を次点とする
  if (body.view?.value != null) {
    return { representation: "view", value: body.view.value };
  }
  // 最後の手段として書き出し用表現を採用して本文欠落を避ける
  if (body.export_view?.value != null) {
    return { representation: "export_view", value: body.export_view.value };
  }

  return undefined;
}

/**
 * 欠落しがちなフィールドを許容しつつ必要な情報だけを返すため DTO に変換する
 *
 * @param p 取得条件
 * @param r APIレスポンス
 * @param baseUrl WebURL 生成に使うベースURL
 * @returns 取得結果DTOを返す
 */
export function toGetContentResultDto(
  p: GetContentParams,
  r: GetContentResponse,
  baseUrl: string,
): GetContentResultDto {
  const url = toWebUrl(baseUrl, r._links?.webui);
  const body = pickBodyValue(p.bodyRepresentation, r.body);

  return {
    id: r.id,
    title: r.title,
    type: r.type,

    ...(url != null ? { url } : {}),

    ...(r.space?.key != null ? { spaceKey: r.space.key } : {}),
    ...(r.space?.name != null ? { spaceName: r.space.name } : {}),

    ...(r.version?.when != null ? { updated: r.version.when } : {}),
    ...(r.version?.number != null ? { version: r.version.number } : {}),

    ...(body != null ? { body } : {}),

    labels:
      r.metadata?.labels?.results
        // 不正なデータ混入によりラベル処理全体が崩れるのを避けるため文字列のみを採用する
        ?.map((x) => x.name)
        .filter((x): x is string => typeof x === "string" && x.length > 0) ??
      [],
  };
}
