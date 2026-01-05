export interface GetContentParams {
  id: string;
  bodyRepresentation?: string;
  includeLabels?: boolean;
}

export interface GetContentResult {
  id: string;
  type: string;
  title: string;
  url?: string | null;

  spaceKey?: string;
  updated?: string;
  version?: string;

  body?: {
    representation: string;
    value: string;
  };

  labels?: string[];
}
