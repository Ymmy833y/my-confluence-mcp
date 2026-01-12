/**
 * ref: https://developer.atlassian.com/cloud/confluence/rest/v1/api-group-search/#api-group-search
 */
export type SearchResponse = {
  results: SearchResult[];

  start?: number;
  limit?: number;
  size?: number;

  totalSize?: number;
  cqlQuery?: string;
  searchDuration?: number;
  archivedResultCount?: number;

  _links?: {
    base?: string;
    context?: string;
    next?: string;
    prev?: string;
    self?: string;
  };
};

type SearchResult = {
  content?: {
    id?: string;
    type?: string;
    status?: string;
    title?: string;

    space?: {
      key?: string;
      name?: string;
      type?: string;
      status?: string;
    };

    version?: {
      number?: number;
      when?: string;
      minorEdit?: boolean;
    };

    history?: {
      latest?: boolean;
    };

    _links?: Record<string, string>;
    _expandable?: Record<string, string>;
  };

  title?: string;
  excerpt?: string;
  url?: string;

  entityType?: string;
  iconCssClass?: string;
  lastModified?: string;
  friendlyLastModified?: string;
  score?: number;

  user?: unknown;
  space?: unknown;

  resultParentContainer?: { title?: string; displayUrl?: string };
  resultGlobalContainer?: { title?: string; displayUrl?: string };
  breadcrumbs?: Array<{ label?: string; url?: string; separator?: string }>;
};
