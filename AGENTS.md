# my-confluence-mcp CodeX Agent ガイド

## 0. 目的（このファイルの役割）

* Codex（および類似のコーディングエージェント）が **my-confluence-mcp の規約・設計・変更方針** を毎回同じ前提で理解できるようにする。
* 迷ったら「既存コードの流儀に寄せる」。不確かな点は **リポジトリ内の実装を探索** し、判断が必要ならユーザーに確認する。
* 本プロジェクトは **Confluence（Cloud / On-Prem）両対応の MCP サーバー**であり、**hosting 差分（レスポンス差分など）を adapters 層に閉じ込める**。

---

## 1. 前提（最重要ルール）

* **回答・コメント・ドキュメントは常に日本語**
* 本プロジェクトは **Confluence の MCP サーバー（GitHub Copilot 等で利用）**
* **Read-only**：ページの作成/更新/削除など「書き込み系」は実装しない（追加要求が来たら必ず確認を取る）
* hosting（cloud / onprem）差分は必ず `src/confluence/adapters/*` に隔離し、**MCP ツール層に hosting 分岐を書かない**
* 変更が大きい場合：

  * 先に **実行計画（何を/なぜ/どの順で）** を短く提示
  * ユーザーから修正要求があれば計画を直して再提示

---

## 2. プロジェクト概要

### 主な機能

* 文字列検索（CQL 等）
* 特定ページの取得（将来追加しうる）
* （必要に応じて）ページ本文の整形/Markdown化などの表示用加工
* ※ページの作成/更新/削除は行わない

### 技術スタック

* TypeScript 5.9
* @modelcontextprotocol/sdk 1.25.1（MCP SDK）
* npm
* ESLint
* Vitest

> 注意：MCP TypeScript SDK は世代差（v1.x / v2）がある。本プロジェクトでは安定版の **1.25.1** を使用する。
> `server.tool(...)` の旧シグネチャは deprecate されやすいため、基本は **`server.registerTool(...)` を利用**する。

---

## 3. ディレクトリ構成（参照範囲）

```
my-confluence-mcp/
├── src/
│  ├── config/
│  │  ├── env.ts                      # dotenv + zod による env 読み込み/検証
│  │  └── confluenceConfig.ts         # Env -> ConfluenceConfig（認証/timeout/body上限等）
│  ├── confluence/
│  │  ├── core/
│  │  │  ├── ConfluenceGateway.ts     # MCP ツールが依存する共通IF（ports）
│  │  │  ├── SearchResult.ts          # 正規化された共通モデル（Normalized*）
│  │  │  └── normalize.ts             # DTO -> 正規化モデルの共通補助（optional対策など）
│  │  ├── adapters/
│  │  │  ├── cloud/
│  │  │  │  ├── cloudConfluenceClient.ts  # HTTP実行・DTO取得（cloud）
│  │  │  │  ├── searchResponse.ts         # cloud DTO（レスポンス型）
│  │  │  │  └── cloudGateway.ts           # ConfluenceGateway 実装（cloud）
│  │  │  └── onprem/
│  │  │     ├── onpremConfluenceClient.ts # HTTP実行・DTO取得（onprem）
│  │  │     ├── searchResponse.ts         # onprem DTO（レスポンス型）
│  │  │     └── onpremGateway.ts          # ConfluenceGateway 実装（onprem）
│  │  └── factory/
│  │     └── createConfluenceGateway.ts   # hosting に応じて gateway を選択
│  ├── mcp/
│  │  ├── tools/
│  │  │  └── registerSearchTool.ts    # 例：ツール登録（server.registerTool）
│  │  └── server.ts                   # MCP server（ツール登録・transport起動）
│  ├── utils/                         # ユーティリティー
│  │  └── logger.ts                   # logger（redact 等含む）
│  └── index.ts                       # エントリーポイント
├── eslint.config.mjs
├── tsconfig.eslint.json
├── package.json
└── tsconfig.json
```

* Agent が参照するのは **上記のファイル/ディレクトリ内** とする（node_modules 等は参照外）
* 追加ファイルは原則 `src/` 配下に作る
* `adapters` 配下に DTO と hosting 差分を閉じる（core や mcp 層に漏らさない）

---

## 4. アーキテクチャ設計

### 4.1 レイヤー（責務分離）

**Tool → Gateway → Client** の流れを基本とする。

#### (A) MCP ツール層：`src/mcp/tools/*`

* 目的：MCP から呼ばれる「機能」を提供する（入力検証、出力整形、制約適用）
* 主な責務

  * 入力スキーマ（Zod）による厳密な検証
  * limit/start/bodyMaxChars 等の **安全制約**（暴発防止）
  * `structuredContent`（JSON）/ Markdown 等の返却形式整形
  * エラーの安全な要約（秘密情報は返さない）
* 禁止事項

  * Confluence エンドポイントや DTO に直接触れない
  * hosting 分岐（cloud/onprem）を書かない
  * `fetch` を直接叩かない

#### (B) Gateway 層（adapter）：`src/confluence/adapters/*/*Gateway.ts`

* 目的：hosting 差分（レスポンス構造、URL差、メタデータ差）を吸収し、**共通IF（ConfluenceGateway）** を満たす
* 主な責務

  * `ConfluenceGateway` を implements
  * Client から受け取った DTO を **正規化モデル（SearchResultPage/NormalizedSearchItem）** に変換
  * total/start/limit の補完、URL の絶対化、欠損時の扱い統一
  * `exactOptionalPropertyTypes` を壊さない整形（undefined のプロパティを付与しない等）
* 禁止事項

  * MCP 用の Markdown 整形（ツール層で行う）
  * env 読み取り（config 層で作る）
  * 低レイヤの HTTP 設定（timeout/auth/retry 等は client）

#### (C) Client 層（HTTP）：`src/confluence/adapters/*/*ConfluenceClient.ts`

* 目的：Confluence の HTTP API を叩き、**生レスポンス（DTO）** を返す
* 主な責務

  * URL 組み立て（パス・クエリ）
  * 認証ヘッダ付与（Basic / Bearer）
  * timeout / HTTP status ハンドリング（必要なら最小のリトライ）
  * JSON を DTO 型（`searchResponse.ts`）として返す
* 禁止事項

  * 正規化モデルへの変換
  * 返却フィールドの取捨選択（それは gateway/tool の責務）

#### (D) Core（Interface・モデル）：`src/confluence/core/*`

* 目的：ツール層が依存する **安定したInterfaceと正規化モデル**を提供
* 主な責務

  * `ConfluenceGateway`（ports）定義
  * `SearchResultPage`/`NormalizedSearchItem` 等の正規化モデル定義
  * 正規化補助（normalize）
* 禁止事項

  * adapters の DTO を import しない（依存逆流）

#### (E) Factory：`src/confluence/factory/*`

* 目的：`hosting` に応じた gateway を一箇所で組み立てる（if 分岐の集約）
* 主な責務

  * `createConfluenceGateway(config)` のみで分岐
* 禁止事項

  * ツール登録や MCP サーバ起動に関与しない

---

### 4.2 依存方向（逆流禁止）

依存の向きは必ず以下を守る：

* `mcp/tools` → `confluence/core`（IF/モデル）に依存してよい
* `mcp/tools` → `confluence/adapters` には **依存しない**
* `confluence/adapters` → `confluence/core` へは依存してよい（implements/変換）
* `confluence/core` → `confluence/adapters` へは **依存しない**
* `config` は下位層（confluence, mcp）から参照されるが、逆向き参照はしない

これにより「DTO が core に混入」「ツールに hosting 分岐が散在」などの劣化を防ぐ。

---

### 4.3 データフロー（基本形）

```
[MCP Client]
   ↓ tool call
[src/mcp/tools/*]
   - Zod で入力検証
   - 制約（limit/start/bodyMaxChars 等）
   ↓
[src/confluence/core/ConfluenceGateway]（共通IF）
   ↓
[src/confluence/adapters/{cloud|onprem}/*Gateway]
   - DTO → 正規化（SearchResultPage）
   ↓
[src/confluence/adapters/{cloud|onprem}/*ConfluenceClient]
   - fetch / auth / timeout
   ↓
[Confluence REST API]
```

* hosting に応じた差し替えは `createConfluenceGateway.ts` で完結する
* ツール層は `ConfluenceGateway` しか知らない

---

## 5. 設計指針（ベストプラクティス）

### 5.1 ツール設計（MCP）

* **1ツール = 1ファイル**（`src/mcp/tools/registerXxxTool.ts` など）
* ツールは以下を必ず持つ：

  * `name`：一意・短く・動詞から（例: `confluence_search` / `confluence_get_page`）
  * `description`：モデルが誤用しないための **制約を明記**

    * 例：「read-only」「limit最大」「本文の上限」「ページ配下のみ」など
  * `inputSchema`：Zod で厳密に（曖昧な any を排除）
  * `outputSchema`：可能なら定義し、`structuredContent` の形を固定する
* 返す情報は **最小限** を基本にする（トークン節約・漏洩リスク低減）
* `server.registerTool(...)` を利用し、旧 `server.tool(...)` は基本使わない
* ログ相関は **`ctx.requestId` を優先**（あるなら必ずログに含める）

### 5.2 入力検証・制約

* URL/spaceKey/pageId などは **allowlist/正規表現** で縛る
* 文字列入力は trim・長さ上限を設定
* スコープ制御（例：特定 spaceKey のみ）をする場合、**ツール側で必ず保証**（呼び出し元に委ねない）
* `limit` はツールで最大値を設ける（例：max 50）

### 5.3 正規化モデル設計（SearchResult）

* Cloud/OnPrem の差分を吸収するため、ツールが使うのは **Normalized モデルのみ**
* `exactOptionalPropertyTypes: true` を前提にする場合：

  * `spaceKey?: string` のような optional は **`spaceKey: undefined` を付けない**
  * JSON 出力（structuredContent）では `undefined` が落ちるため、必要なら `null` に寄せる（スキーマも nullable）
* DTO の型は adapters 側の `searchResponse.ts` に閉じる（core に持ち込まない）

### 5.4 エラーハンドリング方針

* 例外を握りつぶさないが、**生の stack / token / header を Tool Result に返さない**
* Tool Result は「安全な要約」を返す（詳細はログ）
* Confluence API の典型（401/403/404/429/5xx）を想定し、メッセージを分ける
* 429 は「待機/回数制限」に誘導できる文言にする
* `isError: true` と安全な `structuredContent`（error message）を返し、クライアントが扱えるようにする

### 5.5 ネットワーク品質（タイムアウト/リトライ）

* HTTP タイムアウト必須（`CONFLUENCE_TIMEOUT_MS`）
* リトライは必要最小限（5xx/一時的失敗のみ、上限回数 + バックオフ）
* ページネーション・上限（limit）を設ける（巨大レスポンス禁止）
* `bodyMaxChars` を設け、本文系ツールは必ず上限で切る

### 5.6 セキュリティ（最優先）

* PAT/Token は **環境変数のみ**（ハードコード禁止）
* ログに token / Authorization / Cookie / 個人情報 を出さない（redact）
* SSRF になり得る URL 入力は原則禁止（受けるなら allowlist 必須）
* Read-only でも情報漏洩の面では高リスク：返却情報を制御、必要ならマスク

### 5.7 テスト方針（Vitest）

* core：

  * `normalize.ts` の変換（optional/undefined 対応）を単体テスト
* adapters/gateway：

  * DTO → 正規化の変換をテスト（Cloud/OnPremの差分吸収）
* adapters/client：

  * fetch をモックして HTTP status ごとの挙動をテスト
* tools：

  * 入力検証、limit 制約、出力整形（structuredContent/Markdown）をテスト
* 失敗系（401/403/404/429/5xx、タイムアウト）を必ず用意

---

## 6. アンチパターン（禁止・非推奨）

### 6.1 責務混在

* ツールから直接 `fetch` して Confluence API を叩く（責務混在）
* Gateway が Markdown 生成など UI 寄り整形を始める（ツール層の責務）
* Client で正規化モデルを返し始める（client が肥大化・差分が混ざる）

### 6.2 依存逆流

* core が adapters の DTO 型を import する
* tools が adapters（cloud/onprem）を直接 import する
* hosting 分岐が tools 内に散在する（必ず factory に集約）

### 6.3 型・スキーマの劣化

* `any` / `unknown` を濫用し、スキーマ検証なしで通す
* `exactOptionalPropertyTypes` を無視して `optional?:` に `undefined` を付与する
* tool 名や引数仕様を頻繁に変える（クライアント互換性が壊れる）

### 6.4 性能・安全性の劣化

* 返却に本文全文/巨大JSONをそのまま返す（性能・漏洩・コスト悪化）
* 例外の stack / token / request header を Tool Result に含める
* 無制限リトライ、無限待ち、ページネーション無し

---

## 7. 実装ルール（コーディング規約の補完）

### 7.1 TypeScript

* `strict` 前提で型を明確にする。不要な `any` は避ける
* `exactOptionalPropertyTypes: true` を意識し、optional プロパティに `undefined` を代入しない

  * 例：`{ ...(v !== undefined ? { key: v } : {}) }`
* `import type` を適切に使う（型専用 import は type に寄せる）
* 既存ファイル名や import パスを不用意に変更しない（typo を含む可能性があるため）

### 7.2 命名・ファイル規約

* core は PascalCase（`ConfluenceGateway.ts` / `SearchResult.ts`）を基本
* adapters 配下の実装は hosting 接頭辞を付け、役割が一目で分かる名前にする

  * `cloudConfluenceClient.ts`, `cloudGateway.ts`, `searchResponse.ts`
* DTO ファイルは `searchResponse.ts` のように用途で命名し、外に漏らさない

### 7.3 TSDoc

* 公開 Class / 公開関数（export）には TSDoc を記載（簡潔）

  * 概要、制約、例外（必要なら）
* gateway/client は「責務（何をしないか）」も短く書く

### 7.4 ESLint

* ESLint を優先（詳細は `eslint.config.mjs` を正とする）
* 既存ルールに反する場合は「ルール変更」より「実装調整」を優先

### 7.5 ログ

* デバッグ容易性のために要所でログは残す（ただし secrets は必ずマスク）
* 相関情報は `ctx.requestId` を採用し、可能な範囲でログに含める
* Confluence API 呼び出し時は status / endpoint 種別（search 等）/ limit/start をログに残す（token は出さない）

---

## 8. セットアップ（コマンド）

### アプリケーションの起動

```sh
npm run start
```

### 開発

```sh
npm run dev
```

### ビルド

```sh
npm run build
```

### 静的解析

```sh
npm run lint
```

### テスト

```sh
npm test
```

---

## 9. まとめ（Codex向けチェックリスト）

* Read-only を維持しているか（書き込み系を混ぜていないか）
* hosting 差分（cloud/onprem）を adapters に閉じ込めているか
* tools が `ConfluenceGateway` のみへ依存し、DTO や hosting 分岐に触れていないか
* `server.registerTool(...)` を使い、入力は zod で厳密に検証しているか
* limit/start/bodyMaxChars など安全制約をツール側で保証しているか
* 返却量を最小化しているか（巨大本文・巨大JSONを返していないか）
* `exactOptionalPropertyTypes` を壊していないか（optional に undefined を付与していないか）
* token/Authorization/個人情報をログ・レスポンスに出していないか
* 失敗系（401/403/404/429/5xx、timeout）を想定しているか
* 大きい変更は計画→合意→実装の順で進めているか
