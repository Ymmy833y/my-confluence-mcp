import { GetContentParams, GetContentResult } from "./getContentResult";
import { SearchRequestParams, SearchResponseDto } from "./searchTypes";
export interface ConfluenceGateway {
  search(params: SearchRequestParams): Promise<SearchResponseDto>;
  getContent(params: GetContentParams): Promise<GetContentResult>;
}
