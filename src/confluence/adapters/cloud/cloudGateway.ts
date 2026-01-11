import type { ConfluenceGateway } from "@core/confluenceGateway";
import type {
  GetContentParams,
  GetContentResult,
} from "@core/getContentResult";
import { SearchRequestParams, SearchResponseDto } from "@core/searchTypes";

import { CloudConfluenceClient } from "./cloudConfluenceClient";
import { toSearchResponseDto } from "./mappers/searchMapper";

function toWebUrl(baseUrl: string, webui?: string): string | null {
  if (!webui) return null;

  // webui が "/spaces/..." みたいな相対のことがあるので baseUrl にぶら下げる
  const base = baseUrl.replace(/\/+$/, "");
  if (webui.startsWith("http://") || webui.startsWith("https://")) return webui;
  return `${base}${webui.startsWith("/") ? "" : "/"}${webui}`;
}

function pickBodyValue(
  rep: string,
  body:
    | {
        storage?: { value?: string };
        view?: { value?: string };
        export_view?: { value?: string };
      }
    | undefined,
): string | undefined {
  if (!body) return undefined;
  if (rep === "storage") return body.storage?.value;
  if (rep === "view") return body.view?.value;
  return body.export_view?.value;
}

export class CloudGateway implements ConfluenceGateway {
  constructor(
    private readonly client: CloudConfluenceClient,
    private readonly baseUrl: string,
  ) {}

  async search(params: SearchRequestParams): Promise<SearchResponseDto> {
    const response = await this.client.searchRaw(params);
    return toSearchResponseDto(params, response);
  }

  async getContent(params: GetContentParams): Promise<GetContentResult> {
    const rep = params.bodyRepresentation ?? "storage";
    const includeLabels = params.includeLabels ?? false;

    const expandParts: string[] = ["space", "version", `body.${rep}`];
    if (includeLabels) expandParts.push("metadata.labels");

    const raw = await this.client.getContentRaw({
      id: params.id,
      expand: expandParts.join(","),
    });

    const url = toWebUrl(this.baseUrl, raw._links?.webui);
    const spaceKey = raw.space?.key;
    const spaceName = raw.space?.name;
    const updated = raw.version?.when;
    const versionRaw = raw.version?.number;
    const version = versionRaw != null ? String(versionRaw) : undefined;

    const bodyValue = pickBodyValue(rep, raw.body);
    const labels =
      raw.metadata?.labels?.results
        ?.map((x) => x.name)
        .filter((x): x is string => typeof x === "string" && x.length > 0) ??
      [];

    const result: GetContentResult = {
      id: raw.id,
      type: raw.type,
      title: raw.title,

      ...(raw.status ? { status: raw.status } : {}),
      url,
      ...(spaceKey ? { spaceKey } : {}),
      ...(spaceName ? { spaceName } : {}),
      ...(updated ? { updated } : {}),
      ...(version != null ? { version } : {}),
      ...(bodyValue ? { body: { representation: rep, value: bodyValue } } : {}),
      ...(includeLabels ? { labels } : {}),
    };

    return result;
  }
}
