import type { ConfluenceGateway } from "@core/confluenceGateway";
import type {
  GetContentParams,
  GetContentResultDto,
} from "@core/getContentTypes";
import { SearchRequestParams, SearchResponseDto } from "@core/searchTypes";

import { toGetContentResultDto } from "./mappers/getContentMapper";
import { toSearchResponseDto } from "./mappers/searchMapper";
import { OnPremConfluenceClient } from "./onpremConfluenceClient";

export class OnPremGateway implements ConfluenceGateway {
  constructor(
    private readonly client: OnPremConfluenceClient,
    private readonly baseUrl: string,
  ) {}

  /**
   * Confluence On-Prem の検索結果を取得してドメイン向けの形式に変換して返す
   * クライアントの生レスポンスを呼び出し側が扱いやすい形に統一するために変換処理を挟む
   *
   * @param params 検索条件
   * @returns 検索結果
   */
  async search(params: SearchRequestParams): Promise<SearchResponseDto> {
    const response = await this.client.searchRaw(params);
    return toSearchResponseDto(params, response, this.baseUrl);
  }

  /**
   * Confluence On-Prem のコンテンツを取得してドメイン向けの形式に変換して返す
   * 取得対象を最小化してレスポンスサイズと取得コストを抑えるために expand を組み立てる
   *
   * @param params 取得条件
   * @returns コンテンツ
   */
  async getContent(params: GetContentParams): Promise<GetContentResultDto> {
    const expandParts: string[] = [
      "space",
      "version",
      `body.${params.bodyRepresentation}`,
    ];
    // ラベルが不要なケースで無駄な展開を避けるために指定がある場合のみ expand に含める
    if (params.includeLabels) expandParts.push("metadata.labels");

    const response = await this.client.getContentRaw({
      id: params.id,
      expand: expandParts.join(","),
    });
    return toGetContentResultDto(params, response, this.baseUrl);
  }
}
