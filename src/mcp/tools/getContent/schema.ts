import { z } from "zod";

/**
 * Confluence のコンテンツ取得入力を厳密に検証するためのスキーマを定義する
 */
export const GetContentInputSchema = z
  .object({
    id: z.preprocess((v) => {
      // tool から "123" のように文字列で来るケースを許容する
      if (typeof v === "string") {
        const s = v.trim();
        if (/^\d+$/.test(s)) return Number(s);
      }
      return v;
    }, z.number().int().min(1).describe("Confluence content ID (number)")),
    representation: z
      .enum(["storage", "view", "export_view"])
      .default("storage")
      .describe(
        "Preferred body representation to return. If the preferred representation is not available, the tool falls back automatically: Cloud: storage → view → export_view, On-prem: storage → view.",
      ),
    includeLabels: z
      .boolean()
      .default(false)
      .describe("If true, include labels in the response."),
    bodyMaxChars: z
      .number()
      .int()
      .optional()
      .describe(
        "Max chars for body text in the tool output. Large bodies may be truncated.",
      ),
    asMarkdown: z
      .boolean()
      .default(true)
      .describe("If true, returns body converted to Markdown when possible."),
  })
  .strict(); // 期待しない入力を拒否して仕様外のパラメータ混入を防止する

/**
 * Confluence のコンテンツ取得結果を扱うためのスキーマを定義する
 * 取得元の欠損や未対応フィールドが混在しても安全に処理できる形にする
 */
export const GetContentSchema = z
  .object({
    id: z.string().min(1).describe("Content ID"),
    title: z.string().min(1).describe("Content title"),

    type: z
      .string()
      .min(1)
      .nullable()
      .describe(
        "Content type (nullable: may be missing depending on API / permissions)",
      ),

    url: z
      .url()
      .nullable()
      .describe(
        "Web UI URL for the content (nullable: may be missing on some environments)",
      ),

    spaceKey: z
      .string()
      .min(1)
      .nullable()
      .describe(
        "Space key (nullable: may be missing depending on API / permissions)",
      ),

    spaceName: z
      .string()
      .min(1)
      .nullable()
      .describe(
        "Space name (nullable: may be missing depending on API / permissions)",
      ),

    updated: z
      .string()
      .nullable()
      .describe(
        "Last updated timestamp string (nullable: format differs by environment)",
      ),

    version: z
      .union([z.string(), z.number()])
      .nullable()
      .describe(
        "Version identifier (nullable). Union is used to absorb type differences across environments.",
      ),

    body: z
      .object({
        representation: z
          .string()
          .describe(
            "Representation of the returned body (e.g., storage/view/export_view)",
          ),
        value: z
          .string()
          .describe(
            "Body content (HTML/XHTML or converted text depending on options)",
          ),
      })
      .nullable()
      .describe(
        "Body object (nullable: may be missing due to permissions, API behavior, or mapping constraints).",
      ),

    labels: z
      .array(z.string())
      .nullable()
      .describe(
        "Labels list (nullable: present only when includeLabels=true and supported by environment)",
      ),
  })
  .strict(); // 期待しない出力を拒否して境界の不整合を早期検知する

/**
 * Confluence のコンテンツ取得出力を厳密に検証するためのスキーマを定義する
 * 返却形を固定して呼び出し側の分岐を減らす
 */
export const GetContentOutputSchema = z
  .object({
    content: GetContentSchema.describe(
      "Normalized content object for tool consumers",
    ),
  })
  .strict(); // 期待しない出力を拒否して境界の不整合を早期検知する
