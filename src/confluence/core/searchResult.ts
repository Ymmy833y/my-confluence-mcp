export interface SearchParams {
  cql: string;
  limit?: number;
  start?: number;
}

export interface NormalizedSearchItem {
  id: string;
  title: string;
  url: string | null;
  spaceKey: string | undefined;
  updated: string | undefined;
  excerpt: string | undefined;
}

export interface SearchResultPage {
  total: number;
  start: number;
  limit: number;
  results: NormalizedSearchItem[];
}
