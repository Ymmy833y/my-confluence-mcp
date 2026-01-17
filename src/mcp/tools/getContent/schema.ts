import { z } from "zod";

/**
 * Confluence のコンテンツ取得入力を厳密に検証するためのスキーマを定義する
 */
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
  .strict(); // 期待しない入力を拒否して仕様外のパラメータ混入を防止する

/**
 * Confluence のコンテンツ取得結果を扱うためのスキーマを定義する
 * 取得元の欠損や未対応フィールドが混在しても安全に処理できる形にする
 */
export const GetContentSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),

    type: z.string().min(1).nullable(),
    url: z.url().nullable(),

    spaceKey: z.string().min(1).nullable(),
    spaceName: z.string().min(1).nullable(),

    updated: z.string().nullable(),
    version: z.union([z.string(), z.number()]).nullable(), // 型揺れを吸収して後段の変換責務を局所化する

    body: z
      .object({
        representation: z.string(),
        value: z.string(),
      })
      .nullable(),

    labels: z.array(z.string()).nullable(),
  })
  .optional(); // 未取得時のレスポンスを区別できるようにする

/**
 * Confluence のコンテンツ取得出力を厳密に検証するためのスキーマを定義する
 * 返却形を固定して呼び出し側の分岐を減らす
 */
export const GetContentOutputSchema = z
  .object({
    content: GetContentSchema,
  })
  .strict(); // 期待しない出力を拒否して境界の不整合を早期検知する
