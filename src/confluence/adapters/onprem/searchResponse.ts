/**
 * ref: https://developer.atlassian.com/server/confluence/rest/v9213/api-group-search/#api-group-search
 */
export type SearchResponse = {
  totalCount?: number;

  results: SearchResult[];

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

type SearchResult = {
  id?: string;
  status?: string;

  title?: string;
  excerpt?: string;
  url?: string;

  space?: {
    id?: number;
    key?: string;
    name?: string;
  }

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

  content?: {
    id?: string;
    type?: string;
    status?: string;
    title?: string;
    _links?: Record<string, string>;
    _expandable?: Record<string, string>;
  };
};
