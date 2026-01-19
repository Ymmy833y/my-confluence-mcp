import {
  BodyRepresentation,
  GetContentParams,
  GetContentResultDto,
} from "@core/getContentTypes";
import { GetContentResponse } from "@onprem/api/getContentResponse";
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
  // 指定表現が欠落していても互換性を保つため storage を先に採用する
  if (body.storage?.value != null) {
    return { representation: "storage", value: body.storage.value };
  }
  // storage も無いケースに備えて最終フォールバックとして view を採用する
  if (body.view?.value != null) {
    return { representation: "view", value: body.view.value };
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
  const type = r.data?.type ?? r.type;
  const url = toWebUrl(baseUrl, r.data?._links?.webui ?? r._links?.webui);

  const spaceKey = r.data?.space?.key ?? r.space?.key;
  const spaceName = r.data?.space?.name ?? r.space?.name;

  const updated = r.data?.version?.when ?? r.version?.when;
  const version = r.data?.version?.number ?? r.version?.number;

  const body = pickBodyValue(p.bodyRepresentation, r.data?.body ?? r.body);
  const labels =
    r.data?.metadata?.labels ??
    r.metadata?.labels?.results
      ?.map((x) => {
        const v = x?.name ?? x?.label;
        return typeof v === "string" ? v.trim() : "";
      })
      .filter((x) => x.length > 0);

  return {
    id: r.data?.id ?? r.id,
    title: r.data?.title ?? r.title ?? "",

    ...(type != null ? { type } : {}),
    ...(url != null ? { url } : {}),

    ...(spaceKey != null ? { spaceKey } : {}),
    ...(spaceName != null ? { spaceName } : {}),

    ...(updated != null ? { updated } : {}),
    ...(version != null ? { version } : {}),

    ...(body != null ? { body } : {}),
    ...(labels != null ? { labels } : {}),
  };
}
