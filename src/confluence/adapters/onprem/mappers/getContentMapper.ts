import {
  BodyRepresentation,
  GetContentParams,
  GetContentResultDto,
} from "@core/getContentTypes";
import { GetContentResponse } from "@onprem/api/getContentResponse";
import { toWebUrl } from "@utils/url";

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
  if (body.storage?.value != null) {
    return { representation: "storage", value: body.storage.value };
  }
  if (body.view?.value != null) {
    return { representation: "view", value: body.view.value };
  }

  return undefined;
}

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
  const labels = r.data?.metadata?.labels ?? r.metadata?.labels;

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
