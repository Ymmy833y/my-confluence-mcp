/**
 * ref: https://developer.atlassian.com/server/confluence/rest/v9213/api-group-search/#api-group-search
 */
export type ConfluenceSearchResponse = {
  totalCount?: number;

  results: ConfluenceSearchResult[];

  start?: number;
  limit?: number;
  size?: number;

  _links?: {
    base?: string;
    context?: string;
    self?: string;
    next?: string;
    prev?: string;
  };
};

export type ConfluenceSearchResult = {
  title?: string;
  excerpt?: string;
  url?: string;

  resultParentContainer?: {
    title?: string;
    displayUrl?: string;
  };

  resultGlobalContainer?: {
    title?: string;
    displayUrl?: string;
  };

  iconCssClass?: string;
  lastModified?: string;
  friendlyLastModified?: string;

  entityType?: string;

  resourceType?: unknown;
};
