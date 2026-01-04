import type { NormalizedSearchItem } from "./searchResult";

// Adapter 側では DTO から取り出した値が `string | undefined` になりがち
// exactOptionalPropertyTypes: true のときは `spaceKey?: string` に `spaceKey: undefined` を入れられないので、ここで「undefined のキーは付けない」形に統一
export type NormalizedSearchItemDraft = {
  id: string;
  title: string;
  url: string | null;
  spaceKey?: string | undefined;
  updated?: string | undefined;
  excerpt?: string | undefined;
};

export function toNormalizedSearchItem(
  draft: NormalizedSearchItemDraft,
): NormalizedSearchItem {
  const { id, title, url, spaceKey, updated, excerpt } = draft;

  if (!id) throw new Error("NormalizedSearchItem.id is required");
  if (!title) throw new Error("NormalizedSearchItem.title is required");

  return {
    id,
    title,
    url,
    ...(spaceKey !== undefined ? { spaceKey } : {}),
    ...(updated !== undefined ? { updated } : {}),
    ...(excerpt !== undefined ? { excerpt } : {}),
  };
}
