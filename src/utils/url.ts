/**
 * URL末尾のスラッシュを除去して同一URLとして扱えるように正規化する
 *
 * @param url 正規化対象のURL文字列
 * @returns 末尾のスラッシュを除去したURL文字列を返す
 */
export function ensureNoTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * baseとpathを結合して余計なスラッシュの揺れを吸収したURL文字列を作る
 *
 * @param base ベースURL文字列
 * @param path 結合するパス文字列
 * @returns 結合後のURL文字列を返す
 */
export function joinUrl(base: string, path: string): string {
  // 呼び出し側のbase指定に依存せず常に単一の区切りになるようにする
  return `${ensureNoTrailingSlash(base)}${path.startsWith("/") ? "" : "/"}${path}`;
}

/**
 * baseとpathを結合して必要なときだけexpandクエリを付与したURL文字列を作る
 *
 * @param base ベースURL文字列
 * @param path 結合するパス文字列
 * @param expand expandクエリに設定する値
 * @returns expandを反映したURL文字列を返す
 */
export function joinUrlWithExpand(
  base: string,
  path: string,
  expand?: string,
): string {
  const url = new URL(joinUrl(base, path));
  // 空文字を設定すると意図しないクエリ付与になるため値があるときだけ付与する
  if (expand && expand.length > 0) {
    url.searchParams.set("expand", expand);
  }
  return url.toString();
}

/**
 * webuiが絶対URLならそのまま返し相対指定ならbaseUrlを基準に絶対URLへ変換する
 *
 * @param baseUrl 相対webuiの解決に使うベースURL文字列
 * @param webui WebUIのURLまたはパス文字列
 * @returns 解決後のWebUI用URL文字列を返す
 */
export function toWebUrl(baseUrl: string, webui?: string): string | undefined {
  if (!webui) return undefined;

  if (/^https?:\/\//i.test(webui)) return webui;

  // baseの末尾スラッシュ有無で解決結果が揺れないようにディレクトリ基準を固定する
  const base = baseUrl.replace(/\/+$/, "") + "/";
  return new URL(webui.replace(/^\/+/, ""), base).toString();
}
