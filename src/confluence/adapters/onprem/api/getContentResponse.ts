/**
 * ref: https://developer.atlassian.com/server/confluence/rest/v9213/api-group-content-resource/#api-rest-api-content-id-get
 */
export interface GetContentResponse {
  id: string;
  type?: string;
  title?: string;

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
        prefix?: string;
        name?: string;
        id?: string;
        label?: string;
      }[];
    };
    [key: string]: unknown;
  };

  _links?: {
    base?: string;
    context?: string;
    self?: string;
    webui?: string;
  };

  data?: {
    id?: string;

    type?: string;
    status?: string;
    title?: string;

    space?: {
      id?: string;
      key?: string;
      name?: string;
      type?: string;
    };

    version?: {
      when?: string;
      message?: string;

      number?: string;

      by?: {
        username?: string;
        userkey?: string;
        displayName?: string;
      };
    };

    body?: {
      storage?: {
        value?: string;
        representation?: string;
      };
    };

    metadata?: {
      labels?: string[];
      [key: string]: unknown;
    };

    _links?: {
      base?: string;
      context?: string;
      self?: string;
      webui?: string;
    };
  };
}
