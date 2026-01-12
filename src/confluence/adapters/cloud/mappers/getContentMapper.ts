import { GetContentResponse } from "@cloud/api/getContentResponse";
import {
  BodyRepresentation,
  GetContentParams,
  GetContentResultDto,
} from "@core/getContentTypes";
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
  if (body.export_view?.value != null) {
    return { representation: "export_view", value: body.export_view.value };
  }

  return undefined;
}

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
        ?.map((x) => x.name)
        .filter((x): x is string => typeof x === "string" && x.length > 0) ??
      [],
  };
}
