import { z } from "zod";

export const SearchInputSchema = z
  .object({
    cql: z.string().min(1),
    limit: z.number().int().min(1),
    start: z.number().int().min(0).default(0),
    asMarkdown: z.boolean().default(true),
  })
  .strict();

export const SearchResultSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),

    type: z.string().min(1).nullable(), // "page" | "blogpost" | "attachment" など
    url: z.url().nullable(),

    spaceKey: z.string().min(1).nullable(),
    spaceName: z.string().min(1).nullable(),

    excerpt: z.string().nullable(),
    lastModified: z.string().nullable(), // ISO8601 文字列
  })
  .strict();

export const SearchOutputSchema = z
  .object({
    page: z
      .object({
        total: z.number().int().nonnegative(),
        start: z.number().int().nonnegative(),
        limit: z.number().int().positive(),
      })
      .strict(),
    results: z.array(SearchResultSchema),
  })
  .strict();
