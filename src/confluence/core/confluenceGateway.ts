import { GetContentParams, GetContentResult } from "./getContentResult";
import { SearchParams, SearchResultPage } from "./searchResult";
export interface ConfluenceGateway {
  search(params: SearchParams): Promise<SearchResultPage>;
  getContent(params: GetContentParams): Promise<GetContentResult>;
}
