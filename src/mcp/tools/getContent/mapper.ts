import { GetContentParams, GetContentResultDto } from "@core/getContentTypes";

import { GetContentInput, GetContentOutput } from "./types";

export function toGetContentParams(input: GetContentInput): GetContentParams {
  return {
    id: input.id,
    bodyRepresentation: input.representation,
    includeLabels: input.includeLabels,
  };
}

export function toToolOutput(response: GetContentResultDto): GetContentOutput {
  const body = response.body?.value
    ? { representation: response.body.value, value: response.body.value }
    : null;

  return {
    content: {
      id: response.id,
      title: response.title,
      type: response.type ?? null,
      url: response.url ?? null,
      spaceKey: response.spaceKey ?? null,
      spaceName: response.spaceName ?? null,
      updated: response.updated ?? null,
      version: response.version ?? null,
      body,
      labels: response.labels ?? null,
    },
  };
}
