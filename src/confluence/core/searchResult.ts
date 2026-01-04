export interface NormalizedSearchItem {
  id: string;
  title: string;
  url: string | null;

  spaceKey?: string;
  updated?: string;
  excerpt?: string;
}

export interface SearchResultPage {
  total: number;
  start: number;
  limit: number;
  results: NormalizedSearchItem[];
}
