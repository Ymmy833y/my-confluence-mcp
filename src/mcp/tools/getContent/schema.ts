import { z } from "zod";

export const GetContentInputSchema = z
  .object({
    id: z.string().min(1).max(128),
    representation: z
      .enum(["storage", "view", "export_view"])
      .default("storage"),
    includeLabels: z.boolean().default(false),
    bodyMaxChars: z.number().int().optional(),
    asMarkdown: z.boolean().optional(),
  })
  .strict();

export const GetContentSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),

    type: z.string().min(1).nullable(),
    url: z.url().nullable(),

    spaceKey: z.string().min(1).nullable(),
    spaceName: z.string().min(1).nullable(),

    updated: z.string().nullable(),
    version: z.union([z.string(), z.number()]).nullable(),

    body: z
      .object({
        representation: z.string(),
        value: z.string(),
      })
      .nullable(),

    labels: z.array(z.string()).nullable(),
  })
  .optional();

export const GetContentOutputSchema = z
  .object({
    content: GetContentSchema,
  })
  .strict();
