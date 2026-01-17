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

  /**
   * Confluence Cloud の検索結果を取得してドメイン向けの形式に変換して返す
   * 呼び出し側の検索条件と整合するページ情報に揃えるために変換処理を挟む
   *
   * @param params 検索条件
   * @returns 検索結果
   */
  async search(params: SearchRequestParams): Promise<SearchResponseDto> {
    const response = await this.client.searchRaw(params);
    return toSearchResponseDto(params, response, this.baseUrl);
  }

  /**
   * Confluence Cloud のコンテンツを取得してドメイン向けの形式に変換して返す
   * 必要な情報だけを取得してレスポンスサイズと取得コストを抑えるために expand を組み立てる
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
