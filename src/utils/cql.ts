const WORD_CHARS = /[A-Za-z0-9_]/;

function isWordChar(ch: string | undefined): boolean {
  return ch != null && WORD_CHARS.test(ch);
}

function eqAtCI(s: string, i: number, word: string): boolean {
  return s.slice(i, i + word.length).toUpperCase() === word.toUpperCase();
}

function matchWordCI(s: string, i: number, word: string): boolean {
  if (!eqAtCI(s, i, word)) return false;
  const before = s[i - 1];
  const after = s[i + word.length];
  return !isWordChar(before) && !isWordChar(after);
}

function skipWs(s: string, i: number): number {
  while (i < s.length && /\s/.test(s[i]!)) i++;
  return i;
}

function scanOutsideQuotes(
  s: string,
  onToken: (i: number) => { len: number; kind: string } | null,
): { i: number; len: number; kind: string } | null {
  let inQ = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]!;
    if (ch === '"' && s[i - 1] !== "\\") {
      inQ = !inQ;
      continue;
    }
    if (inQ) continue;

    const tok = onToken(i);
    if (tok) return { i, len: tok.len, kind: tok.kind };
  }
  return null;
}

function findOrderByOutsideQuotes(s: string): number {
  const hit = scanOutsideQuotes(s, (i) => {
    if (!matchWordCI(s, i, "ORDER")) return null;
    let j = i + "ORDER".length;
    j = skipWs(s, j);
    if (!matchWordCI(s, j, "BY")) return null;
    // "ORDER BY" の開始位置
    return { len: 0, kind: "ORDER_BY" };
  });
  return hit ? hit.i : -1;
}

type Op = "=" | "!=" | "~" | "!~" | ">" | ">=" | "<" | "<=" | "IN" | "NOT IN";

function findOperatorOutsideQuotes(
  s: string,
): { idx: number; len: number; op: Op } | null {
  const hit = scanOutsideQuotes(s, (i) => {
    // word ops (NOT IN must be checked before IN)
    if (matchWordCI(s, i, "NOT")) {
      let j = i + 3;
      if (!/\s/.test(s[j] ?? "")) return null; // "NOTIN" は不可
      j = skipWs(s, j);
      if (matchWordCI(s, j, "IN")) {
        const end = j + 2;
        return { len: end - i, kind: "NOT IN" };
      }
    }
    if (matchWordCI(s, i, "IN")) {
      return { len: 2, kind: "IN" };
    }

    // symbol ops (longer first)
    const two = s.slice(i, i + 2);
    if (two === "!=") return { len: 2, kind: "!=" };
    if (two === "!~") return { len: 2, kind: "!~" };
    if (two === ">=") return { len: 2, kind: ">=" };
    if (two === "<=") return { len: 2, kind: "<=" };

    const one = s[i];
    if (one === "=") return { len: 1, kind: "=" };
    if (one === "~") return { len: 1, kind: "~" };
    if (one === ">") return { len: 1, kind: ">" };
    if (one === "<") return { len: 1, kind: "<" };

    return null;
  });

  if (!hit) return null;
  return { idx: hit.i, len: hit.len, op: hit.kind as Op };
}

type kind = "AND" | "OR" | "NOT" | "ORDER_BY";
function hasStrayKeywordOutsideQuotes(
  s: string,
  allowedSpans: Array<{ start: number; end: number }>,
): { kind: kind; at: number } | null {
  const inAllowed = (pos: number) =>
    allowedSpans.some((sp) => sp.start <= pos && pos < sp.end);

  // ORDER BY
  const ob = scanOutsideQuotes(s, (i) => {
    if (!matchWordCI(s, i, "ORDER")) return null;
    let j = i + 5;
    j = skipWs(s, j);
    if (!matchWordCI(s, j, "BY")) return null;
    return { len: 1, kind: "ORDER_BY" };
  });
  if (ob && !inAllowed(ob.i)) return { kind: "ORDER_BY", at: ob.i };

  // AND / OR / NOT
  const other = scanOutsideQuotes(s, (i) => {
    if (matchWordCI(s, i, "AND")) return { len: 3, kind: "AND" };
    if (matchWordCI(s, i, "OR")) return { len: 2, kind: "OR" };
    if (matchWordCI(s, i, "NOT")) return { len: 3, kind: "NOT" };
    return null;
  });
  if (other && !inAllowed(other.i))
    return { kind: other.kind as kind, at: other.i };

  return null;
}

function parseConditionSegment(
  seg: string,
): { ok: true } | { ok: false; message: string } {
  const raw = seg.trim();
  if (!raw) return { ok: false, message: "Empty condition" };

  // unary NOT (先頭だけ許可)
  let notStart = -1;
  let notEnd = -1;
  let s = raw;
  if (matchWordCI(s, 0, "NOT")) {
    let j = 3;
    j = skipWs(s, j);
    notStart = 0;
    notEnd = j;
    s = s.slice(j).trimStart();
    if (!s)
      return { ok: false, message: "NOT must be followed by a condition" };
  }

  const opHit = findOperatorOutsideQuotes(s);
  if (!opHit) return { ok: false, message: "Missing operator" };

  const a = s.slice(0, opHit.idx).trim();
  const b = s.slice(opHit.idx + opHit.len).trim();

  if (!a) return { ok: false, message: "Missing left operand (A)" };
  if (!b) return { ok: false, message: "Missing right operand (B)" };

  // seg 内に AND/OR/NOT/ORDER BY が紛れ込んでいないか（構造の曖昧さ回避）
  // 例: "a=b NOT c=d" は NOT が stray 条件の区切りとして正しい位置に無いため NG
  const spans: Array<{ start: number; end: number }> = [];
  if (notStart === 0) spans.push({ start: 0, end: notEnd }); // unary NOT
  // operator span（NOT IN の "NOT" を stray 扱いしないため）
  // s は raw から unary NOT を剥いだものに変わっているので、raw 上の span に補正する
  const offset = raw.length - s.length; // ざっくり補正（trimStart 分）
  spans.push({
    start: offset + opHit.idx,
    end: offset + opHit.idx + opHit.len,
  });

  const stray = hasStrayKeywordOutsideQuotes(raw, spans);
  if (stray) {
    return {
      ok: false,
      message: `Unexpected keyword "${stray.kind}" inside a condition`,
    };
  }

  return { ok: true };
}

/**
 * CQL の文法全体を厳密に解釈せず、MCPが扱う最小の構造要件のみを検証する
 * Confluence側の環境差により正当なCQLまで拒否するリスクを抑えつつ明らかな不正入力を早期に弾く
 *
 * @param cql 構造検証の対象となるCQL文字列
 * @returns 構造要件を満たす場合は ok:true を返し 満たさない場合は ok:false と理由を返す
 */
export function validateCql(
  cql: string,
): { ok: true } | { ok: false; message: string } {
  const input = cql.trim();
  // CQLは必ず渡されるものとする
  if (!input) return { ok: false, message: "CQL is empty" };

  // ORDER BY を末尾に 0/1 回だけ許可
  const orderIdx = findOrderByOutsideQuotes(input);
  let condPart = input;
  let orderPart: string | null = null;

  if (orderIdx >= 0) {
    condPart = input.slice(0, orderIdx).trim();
    orderPart = input.slice(orderIdx);

    // ORDER BY の後ろが空は NG
    const after = orderPart.replace(/^ORDER\s+BY\b\s*/i, "").trim();
    if (!after)
      return {
        ok: false,
        message: "ORDER BY must have a following expression",
      };

    // 2回目の ORDER BY は NG
    const second = findOrderByOutsideQuotes(after);
    if (second >= 0)
      return { ok: false, message: "Multiple ORDER BY is not allowed" };
  }

  if (!condPart)
    return { ok: false, message: "Missing condition before ORDER BY" };

  // 条件を AND/OR で連結（各条件先頭の NOT は parseConditionSegment が扱う）
  let rest = condPart.trim();
  while (true) {
    // 次の AND/OR を探す（クォート外のみ）
    const next = scanOutsideQuotes(rest, (i) => {
      if (matchWordCI(rest, i, "AND")) return { len: 3, kind: "AND" };
      if (matchWordCI(rest, i, "OR")) return { len: 2, kind: "OR" };
      return null;
    });

    const seg = next ? rest.slice(0, next.i) : rest;
    const r = parseConditionSegment(seg);
    if (!r.ok) return r;

    if (!next) break;

    // connector の後ろに次の条件が必要
    rest = rest.slice(next.i + next.len).trim();
    if (!rest)
      return {
        ok: false,
        message: `"${next.kind}" must be followed by a condition`,
      };
  }

  // orderPart は中身を見ない
  return { ok: true };
}
