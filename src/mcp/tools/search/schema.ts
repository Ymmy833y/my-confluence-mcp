import { z } from "zod";

/**
 * Confluence の検索入力を厳密に検証するためのスキーマを定義する
 */
export const SearchInputSchema = z
  .object({
    cql: z.string().min(1),
    limit: z.number().int().min(1),
    start: z.number().int().min(0).default(0),
    asMarkdown: z.boolean().default(true),
  })
  .strict(); // 期待しない入力を拒否して仕様外のパラメータ混入を防止する

/**
 * Confluence の検索結果1件を扱うためのスキーマを定義する
 * 欠損しうるフィールドを nullable として明示して後段での分岐と例外を抑制する
 */
export const SearchResultSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),

    type: z.string().min(1).nullable(), // 検索対象の種別は増減し得るため列挙せず文字列として受ける
    url: z.url().nullable(),

    spaceKey: z.string().min(1).nullable(),
    spaceName: z.string().min(1).nullable(),

    excerpt: z.string().nullable(),
    lastModified: z.string().nullable(), // 表現差を許容して変換責務を後段に寄せるため文字列で受ける
  })
  .strict(); // 期待しない入力を拒否して仕様外のパラメータ混入を防止する

/**
 * Confluence の検索出力を厳密に検証するためのスキーマを定義する
 */
export const SearchOutputSchema = z
  .object({
    page: z
      .object({
        total: z.number().int().nonnegative(),
        start: z.number().int().nonnegative(),
        limit: z.number().int().positive(),
      })
      .strict(), // 期待しない入力を拒否して仕様外のパラメータ混入を防止する
    results: z.array(SearchResultSchema),
  })
  .strict(); // 期待しない入力を拒否して仕様外のパラメータ混入を防止する
