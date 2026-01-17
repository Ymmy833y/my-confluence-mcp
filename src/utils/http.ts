import { logger } from "./logger";

/**
 * タイムアウト制御とエラーメッセージの充実により通信失敗時の原因特定を容易にするためにJSON取得処理を共通化する
 *
 * @param url リクエスト先URL
 * @param init fetchに渡す初期化オプション
 * @param timeoutMs タイムアウト時間ミリ秒
 * @returns レスポンスJSONを型付けして返す
 * @throws HTTPステータスが成功以外の場合に本文を含めて例外を投げる
 * @throws タイムアウトによりAbortされた場合に例外を投げる
 */
export async function fetchJson<T>(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<T> {
  const ac = new AbortController();
  // fetch自体に標準タイムアウトが無いため呼び出し側の期待時間内に必ず中断できるようにする
  const t = setTimeout(() => ac.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...init, signal: ac.signal });

    logger.debug(
      `[fetchJson] response:, ${JSON.stringify({
        url,
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        redirected: res.redirected,
        type: res.type,
        contentType: res.headers.get("content-type"),
        contentLength: res.headers.get("content-length"),
      })}`,
    );

    if (!res.ok) {
      // 上位で原因を判断できるようにレスポンス本文を可能な限り例外に含める
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
    }

    const data = (await res.json()) as T;
    logger.debug(`[fetchJson] response body:, ${JSON.stringify(data)}`);
    return data;
  } finally {
    // 例外時もタイマーを必ず解除して不要なAbortやリソース保持を防ぐ
    clearTimeout(t);
  }
}
