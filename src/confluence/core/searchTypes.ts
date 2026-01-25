export interface SearchRequestParams {
  cql: string;
  limit: number;
  start: number;
}

export interface SearchResultDto {
  id: string;
  title: string;
  type: string | undefined;
  url: string | undefined;
  spaceKey: string | undefined;
  spaceName: string | undefined;
  excerpt: string | undefined;
  lastModified: string | undefined;
}

export interface SearchResponseDto {
  total: number;
  start: number;
  limit: number;
  results: SearchResultDto[];
}
