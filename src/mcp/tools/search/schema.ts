import { validateCql } from "@utils/cql";
import { z } from "zod";

/**
 * Confluence の検索入力を厳密に検証するためのスキーマを定義する
 */
export const SearchInputSchema = z
  .object({
    cql: z
      .string()
      .min(1)
      .superRefine((val, ctx) => {
        const r = validateCql(val);
        if (!r.ok) ctx.addIssue({ code: "custom", message: r.message });
      })
      .describe(
        'Confluence Query Language (CQL). Example: type=page AND space.key=ABC AND text~"keyword"',
      ),

    limit: z
      .number()
      .int()
      .min(1)
      .describe(
        "Max number of results to return per request. Note: the backend may cap the effective limit depending on expansions and environment.",
      ),

    start: z
      .number()
      .int()
      .min(0)
      .default(0)
      .describe(
        "Start index for pagination (0-based). On some environments, response may not include start; the tool may rely on request value.",
      ),

    asMarkdown: z
      .boolean()
      .default(true)
      .describe(
        "If true, returns excerpt in Markdown-friendly form when possible.",
      ),
  })
  .strict(); // 期待しない入力を拒否して仕様外のパラメータ混入を防止する

/**
 * Confluence の検索結果1件を扱うためのスキーマを定義する
 * 欠損しうるフィールドを nullable として明示して後段での分岐と例外を抑制する
 */
export const SearchResultSchema = z
  .object({
    id: z.string().min(1).describe("Content ID for the search hit"),
    title: z.string().min(1).describe("Title of the content"),

    type: z
      .string()
      .min(1)
      .nullable()
      .describe(
        "Entity type (nullable). The set of possible values may vary, so it is not enumerated.",
      ),

    url: z
      .url()
      .nullable()
      .describe(
        "Web UI URL for the content (nullable: may be missing depending on API / permissions / environment).",
      ),

    spaceKey: z
      .string()
      .min(1)
      .nullable()
      .describe("Space key (nullable: may be missing on some results)"),

    spaceName: z
      .string()
      .min(1)
      .nullable()
      .describe("Space name (nullable: may be missing on some results)"),

    excerpt: z
      .string()
      .nullable()
      .describe(
        "Excerpt/snippet for the hit (nullable: may be absent or empty depending on API and search configuration).",
      ),

    lastModified: z
      .string()
      .nullable()
      .describe(
        "Last modified timestamp string (nullable). Kept as string to tolerate format differences across environments.",
      ),
  })
  .strict(); // 期待しない入力を拒否して仕様外のパラメータ混入を防止する

/**
 * Confluence の検索出力を厳密に検証するためのスキーマを定義する
 */
export const SearchOutputSchema = z
  .object({
    page: z
      .object({
        total: z
          .number()
          .int()
          .nonnegative()
          .describe("Total number of matches for the query"),

        start: z
          .number()
          .int()
          .nonnegative()
          .describe(
            "Start index used/returned by the tool. If the API response lacks start, request value may be used.",
          ),

        limit: z
          .number()
          .int()
          .positive()
          .describe(
            "Limit used/returned by the tool. If the API response lacks limit, request value may be used.",
          ),
      })
      .strict()
      .describe("Pagination information"),

    results: z.array(SearchResultSchema).describe("Search result list"),
  })
  .strict(); // 期待しない入力を拒否して仕様外のパラメータ混入を防止する
