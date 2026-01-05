/**
 * ref: https://developer.atlassian.com/cloud/confluence/rest/v1/api-group-content/#api-wiki-rest-api-content-id-get
 */
export interface GetContentResponse {
  id: string;
  type: string;
  title: string;

  space?: {
    id?: string;
    key?: string;
    name?: string;
  };

  status?: string;

  version?: {
    number?: string;
    when?: string;
    message?: string;
    by?: {
      displayName?: string;
      accountId?: string;
      username?: string;
    };
  };

  body?: {
    storage?: {
      value?: string;
      representation?: string;
    };

    view?: {
      value?: string;
      representation?: string;
    };

    export_view?: {
      value?: string;
      representation?: string;
    };
  };

  metadata?: {
    labels?: {
      results?: {
        name?: string;
        id?: string;
        label?: string;
      }[];
    };
  };

  _links?: {
    base?: string;
    context?: string;
    self?: string;
    webui?: string;
  };
}
