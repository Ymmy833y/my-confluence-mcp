import { GetContentParams, GetContentResultDto } from "./getContentTypes";
import { SearchRequestParams, SearchResponseDto } from "./searchTypes";
export interface ConfluenceGateway {
  search(params: SearchRequestParams): Promise<SearchResponseDto>;
  getContent(params: GetContentParams): Promise<GetContentResultDto>;
}
