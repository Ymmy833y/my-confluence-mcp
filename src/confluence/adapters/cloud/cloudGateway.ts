import type { ConfluenceGateway } from "@core/confluenceGateway";
import type {
  GetContentParams,
  GetContentResultDto,
} from "@core/getContentTypes";
import { SearchRequestParams, SearchResponseDto } from "@core/searchTypes";

import { CloudConfluenceClient } from "./cloudConfluenceClient";
import { toGetContentResultDto } from "./mappers/getContentMapper";
import { toSearchResponseDto } from "./mappers/searchMapper";

export class CloudGateway implements ConfluenceGateway {
  constructor(
    private readonly client: CloudConfluenceClient,
    private readonly baseUrl: string,
  ) {}

  async search(params: SearchRequestParams): Promise<SearchResponseDto> {
    const response = await this.client.searchRaw(params);
    return toSearchResponseDto(params, response, this.baseUrl);
  }

  async getContent(params: GetContentParams): Promise<GetContentResultDto> {
    const expandParts: string[] = [
      "space",
      "version",
      `body.${params.bodyRepresentation}`,
    ];
    if (params.includeLabels) expandParts.push("metadata.labels");

    const response = await this.client.getContentRaw({
      id: params.id,
      expand: expandParts.join(","),
    });
    return toGetContentResultDto(params, response, this.baseUrl);
  }
}
