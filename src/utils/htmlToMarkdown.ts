import TurndownService from "turndown";

const ATTR_ALLOWLIST = new Set<string>([
  // links
  "href",
  "title",
  // images
  "src",
  "alt",
  "width",
  "height",
  // anchors
  "id",
  "class",
  // checkbox
  "checked",
  "disabled",
]);

/**
 * 開始タグ内の属性を allowlist 方式で削除する
 *
 * - allowlist に含まれる属性のみ残す
 * - 正規表現による軽量処理のため「開始タグ」を対象にし、本文テキストは触らない
 */
function stripAttrsByAllowlist(
  html: string,
  allow: ReadonlySet<string>,
): string {
  return html.replace(
    /<([a-zA-Z][\w:-]*)(\s[^<>]*?)?\s*(\/?)>/g,
    (_full, tagName: string, attrPart?: string, selfClosing?: string) => {
      const isSelfClosing = selfClosing === "/";

      if (!attrPart) {
        // 属性がない場合でも self-closing を維持
        return isSelfClosing ? `<${tagName} />` : `<${tagName}>`;
      }

      const kept: string[] = [];
      const attrSrc = attrPart;

      // 1) 引用符付き属性: name="..."
      const quotedAttrRe = /([\w:-]+)\s*=\s*(?:"[^"]*"|'[^']*')/g;
      while (true) {
        const match = quotedAttrRe.exec(attrSrc);
        if (!match) break;

        const rawName = match[1];
        if (!rawName) continue;

        const name = rawName.toLowerCase();
        if (allow.has(name)) kept.push(match[0]); // 属性全体（name="..."）を保持
      }

      // 2) boolean属性: checked / disabled など（必要なものだけ allowlist に入れて残す）
      const booleanAttrRe =
        /(^|\s)(checked|disabled|selected|readonly|multiple)\b/gi;
      while (true) {
        const match = booleanAttrRe.exec(attrSrc);
        if (!match) break;

        const rawName = match[2];
        if (!rawName) continue;

        const name = rawName.toLowerCase();
        if (allow.has(name)) kept.push(name);
      }

      const attrs = kept.length ? " " + kept.join(" ") : "";
      return isSelfClosing ? `<${tagName}${attrs} />` : `<${tagName}${attrs}>`;
    },
  );
}

/**
 * Confluence 由来の HTML を Markdown に変換するユーティリティ
 *
 * - 変換に失敗した場合でも、既存互換のため HTML をコードブロックとして返す
 * - Markdown 出力を読みやすくするため、改行や不要タグの扱いを最低限整える
 */
const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  fence: "~~~",
  bulletListMarker: "-",
  emDelimiter: "_",
  strongDelimiter: "**",
  hr: "---",
  linkStyle: "inlined",
  linkReferenceStyle: "collapsed",
  preformattedCode: true,
});

// 明らかに不要/危険なものは除去（本文として意味が薄い）
turndown.remove(["script", "style"]);

// <br> は改行にする（Confluence の本文で頻出）
turndown.addRule("confluence_br", {
  filter: "br",
  replacement: () => "\n",
});

/**
 * 空の段落や不要な空白を減らす
 *
 * @param md markdown
 * @returns
 */
function normalizeMarkdown(md: string): string {
  return md
    .replace(/[ \t]+\n/g, "\n") // 行末の空白を削除
    .replace(/\n{3,}/g, "\n\n") // 空行が3行以上続く場合は2行に圧縮
    .trim();
}

/**
 * HTML を Markdown に変換する
 * 失敗した場合は HTML をコードブロックとして返す
 */
export function htmlToMarkdown(html: string): string {
  const src = html ?? "";
  if (src.trim().length === 0) return "";

  const cleaned = stripAttrsByAllowlist(src, ATTR_ALLOWLIST);

  try {
    const md = turndown.turndown(cleaned);
    return normalizeMarkdown(md);
  } catch {
    return normalizeMarkdown(["````html", cleaned, "````"].join("\n"));
  }
}
