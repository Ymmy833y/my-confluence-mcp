import type { ConfluenceGateway } from "@core/confluenceGateway";
import type {
  GetContentParams,
  GetContentResult,
} from "@core/getContentResult";
import { SearchRequestParams, SearchResponseDto } from "@core/searchTypes";

import { toSearchResponseDto } from "./mappers/searchMapper";
import { OnPremConfluenceClient } from "./onpremConfluenceClient";

function toWebUrl(baseUrl: string, webui?: string): string | null {
  if (!webui) return null;

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

export class OnPremGateway implements ConfluenceGateway {
  constructor(
    private readonly client: OnPremConfluenceClient,
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

    // data がある場合は data を優先して参照する
    const src = raw.data ?? raw;

    const url = toWebUrl(this.baseUrl, src._links?.webui);
    const spaceKey = src.space?.key;
    const spaceName = src.space?.name;
    const updated = src.version?.when;

    const versionRaw = src.version?.number;
    const version = versionRaw != null ? String(versionRaw) : undefined;

    const bodyValue = pickBodyValue(rep, src.body);

    // onprem は metadata.labels が string[] の想定
    // (data 側に metadata が入ってくるケースも念のため拾う)
    const labels = ((
      raw.data as unknown as { metadata?: { labels?: string[] } }
    )?.metadata?.labels ??
      raw.metadata?.labels ??
      []) as string[];

    const result: GetContentResult = {
      id: src.id ?? raw.id,
      type: src.type ?? "",
      title: src.title ?? "",

      ...(src.status ? { status: src.status } : {}),
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
