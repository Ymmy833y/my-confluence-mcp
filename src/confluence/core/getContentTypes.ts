export const BODY_REPRESENTATIONS = ["storage", "view", "export_view"] as const;
export type BodyRepresentation = (typeof BODY_REPRESENTATIONS)[number];

export interface GetContentParams {
  id: string;
  bodyRepresentation: BodyRepresentation;
  includeLabels: boolean;
}

export interface GetContentResultDto {
  id: string;
  title: string;

  type?: string;
  url?: string;

  spaceKey?: string;
  spaceName?: string;

  updated?: string;
  version?: string;

  body?: {
    representation: string;
    value: string;
  };

  labels?: string[];
}
