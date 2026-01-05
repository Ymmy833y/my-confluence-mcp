# オンプレ環境の REST API レスポンス検証

オンプレ（Confluence Server / Data Center）では、REST API のレスポンスが環境（バージョン・設定）により揺れる可能性があります。  
そのため、各 API 実装において **利用側が依存する必須項目が実レスポンスから確実に生成できること** を事前に検証してください。  
生成できない場合は、**型定義／adapter の変換処理／利用側の前提** を修正する必要があります。

---

## 1. 共通方針（検証の観点）
- **「正規化後の必須項目」** （利用側で必須となるフィールド）を先に定義する
- 実レスポンスを取得し、adapter の変換結果が必須項目を満たすか確認する
- 環境差分が出やすい項目は **任意扱い** にし、欠落時のフォールバックを設計する

---

## 2. 検証対象：Search API

### 2.1 正規化後の必須項目（NormalizedSearchItem）
`src/confluence/core/searchResult.ts`

```ts
export interface NormalizedSearchItem {
  id: string;
  title: string;
  url: string | null;

  spaceKey?: string;
  updated?: string;
  excerpt?: string;
}
```

必須:

* `id: string`
* `title: string`
* `url: string | null`（null 許容だが、項目としては必須）

任意:

* `spaceKey?: string`
* `updated?: string`
* `excerpt?: string`

---

### 2.2 期待値（オンプレ Search API レスポンス型）

`src/confluence/adapters/onprem/searchResponse.ts`

> ref: [https://developer.atlassian.com/server/confluence/rest/v9213/api-group-search/#api-group-search](https://developer.atlassian.com/server/confluence/rest/v9213/api-group-search/#api-group-search)

---

### 2.3 実レスポンス取得

* 対象オンプレ環境に対して Search API を実行し、JSON を保存してください（1件以上ヒットする条件で実施）

---

### 2.4 具体的な確認点（SearchResponse の突合）

実レスポンスと `SearchResponse` の構造を突合し、以下を中心に **存在有無・型・ネスト** を確認してください。

#### ルート

* `totalCount`, `results`, `start`, `limit`, `size`, `_links`

#### `results[]` の要素

* 直接項目:

  * `id`, `status`, `title`, `excerpt`, `url`
* コンテナ情報:

  * `resultParentContainer.title`, `resultParentContainer.displayUrl`
  * `resultGlobalContainer.title`, `resultGlobalContainer.displayUrl`
* 表示・更新系:

  * `iconCssClass`, `lastModified`, `friendlyLastModified`
* 種別:

  * `entityType`, `resourceType`
* `content`（存在する場合）:

  * `content.id`, `content.type`, `content.status`, `content.title`
  * `content._links`, `content._expandable`

---

### 2.5 必須項目が生成できるか（NormalizedSearchItem 観点）

実レスポンスから adapter の変換で、以下が **必ず作れる** ことを確認してください。

* `id` の元データが存在するか

  * 例：`results[].id` または `results[].content.id` 等、実装が参照する経路に値があるか
* `title` の元データが存在するか

  * 例：`results[].title` または `results[].content.title` 等
* `url` の元データが存在するか（無い場合は `null` で成立するか）

  * 例：`results[].url`、または `_links` を使った組み立てをしている場合は必要情報があるか

---

### 2.6 期待値と実際値に差分がある場合

* フィールドの欠落／追加、型の違い、ネスト違いがある場合は、**型定義（SearchResponse）と adapter の変換処理** を実レスポンスに合わせて修正してください。
* その結果、`NormalizedSearchItem` の必須項目（`id/title/url`）が安定して生成できる状態にします。

---

## 3. 検証対象：Get Content API

### 3.1 正規化後の必須項目（GetContentResult）

`src/confluence/core/getContentResult.ts`

```ts
export interface GetContentParams {
  id: string;
  bodyRepresentation?: string;
  includeLabels?: boolean;
}

export interface GetContentResult {
  id: string;
  type: string;
  title: string;
  url?: string | null;

  spaceKey?: string;
  updated?: string;
  version?: string;

  body?: {
    representation: string;
    value: string;
  };

  labels?: string[];
}
```

必須:

* `id: string`
* `type: string`
* `title: string`

任意:

* `url?: string | null`（adapter 実装では `null` になり得る）
* `spaceKey?: string`
* `updated?: string`
* `version?: string`
* `body?: { representation: string; value: string }`
* `labels?: string[]`（`includeLabels: true` のときのみ付与される想定）

> 補足：Get Content は本文取得が主目的になりがちなので、利用側が `body` を前提にしている場合は **`body.*.value` が取得できること** を必ず検証してください（後述）。

---

### 3.2 期待値（オンプレ Get Content API レスポンス型）

`src/confluence/adapters/onprem/getContentResponse.ts`

> ref: [https://developer.atlassian.com/server/confluence/rest/v9213/api-group-content-resource/#api-rest-api-content-id-get](https://developer.atlassian.com/server/confluence/rest/v9213/api-group-content-resource/#api-rest-api-content-id-get)

---

### 3.3 実レスポンス取得

* 対象オンプレ環境に対して Get Content API を実行し、JSON を保存してください（権限があり、本文を取得できるページを対象にする）

* adapter 実装では `expand` を付ける前提のため、最低限以下の `expand` を付与して取得してください（例）

  * `space,version,body.storage`
  * `includeLabels: true` 相当の確認も行う場合は `metadata.labels` も追加して取得してください

* `bodyRepresentation` を切り替えて利用する可能性がある場合は、利用予定の表現（例：`storage` / `view` / `export_view`）でも取得してください

---

### 3.4 具体的な確認点（GetContentResponse の突合）

実レスポンスと `GetContentResponse` の構造を突合し、以下を中心に **存在有無・型・ネスト** を確認してください。

#### ルート

* `id`, `type`, `status`, `title`
* `space`（`expand=space` を付けた場合）:

  * `space.key`, `space.name`, `space.id`
* `version`（`expand=version` を付けた場合）:

  * `version.when`, `version.number`, `version.by.*`
* `body`（`expand=body.<rep>` を付けた場合）:

  * `body.storage.value`（`rep=storage` の場合）
  * `body.view.value`（`rep=view` の場合）
  * `body.export_view.value`（`rep=export_view` の場合）
* `metadata.labels`（`expand=metadata.labels` を付けた場合）:

  * `metadata.labels` の **型が `string[]` として扱えるか**
* `_links`:

  * `_links.webui`（URL 組み立てに使用）
  * `_links.base`, `_links.context`（存在する場合）

#### `data` ラッパ（存在する場合）

オンプレ環境によっては、同等の情報が `data` 配下に入って返るケースがあります。
adapter 実装では **`raw.data ?? raw` を参照** しているため、以下も必ず確認してください。

* `data.id`, `data.type`, `data.status`, `data.title`
* `data.space.key`, `data.space.name`, `data.space.id`
* `data.version.when`, `data.version.number`, `data.version.by.*`
* `data.body.storage.value`（少なくとも `storage`）
* `data._links.webui`

> 補足：labels については `raw.data.metadata.labels` も拾う実装になっているため、`data.metadata.labels` が返る構造の可能性も確認対象に含めます。

---

### 3.5 必須項目が生成できるか（GetContentResult 観点）

`src/confluence/adapters/onprem/onpremGateway.ts` の変換（`getContent`）で、以下が **必ず作れる** ことを確認してください。

* `id` が生成できるか

  * 参照経路：`raw.data.id` または `raw.id`
* `type` が生成できるか（空文字にならないか）

  * 参照経路：`raw.data.type` または `raw.type`
* `title` が生成できるか（空文字にならないか）

  * 参照経路：`raw.data.title` または `raw.title`
* `url` が生成できるか（無い場合は `null` で成立するか）

  * 参照経路：`(raw.data ?? raw)._links.webui`
  * `webui` が相対パスでも `baseUrl` と連結して期待どおりの URL になるか（`toWebUrl` の仕様に沿うか）
* `spaceKey` が生成できるか（任意だが、期待している場合）

  * 参照経路：`(raw.data ?? raw).space.key`
* `updated` / `version` が生成できるか（任意だが、期待している場合）

  * 参照経路：`(raw.data ?? raw).version.when`, `(raw.data ?? raw).version.number`
  * `version.number` は環境によって数値/文字列の揺れがあり得るため、実レスポンスの型を確認する（adapter 側は `String()` 化している）
* `body` が生成できるか（利用側で本文が必要な場合は重点確認）

  * 参照経路：`(raw.data ?? raw).body.<rep>.value`
  * `bodyRepresentation` の既定は `storage` のため、まず `body.storage.value` が取れるか確認する
  * `view` / `export_view` を利用する場合はそれぞれでも取得できるか確認する
* `labels` が生成できるか（`includeLabels: true` で利用する場合）

  * 参照経路：

    * `raw.data.metadata.labels`（存在する場合）
    * `raw.metadata.labels`
  * `metadata.labels` の型（`string[]` として扱えるか）と、`expand=metadata.labels` が必須かを確認する

---

### 3.6 期待値と実際値に差分がある場合

* フィールドの欠落／追加、型の違い、ネスト違いがある場合は、**型定義（GetContentResponse）と adapter の変換処理** を実レスポンスに合わせて修正してください。

* 特に以下は環境差分が出やすいため、差分が見つかった場合は優先的に扱いを決めて修正してください。

  * `data` ラッパの有無（`raw` 直下か `raw.data` 配下か）
  * `version.number` の型（数値/文字列）
  * `body.<rep>` の構造差（`storage/view/export_view` の有無・ネスト）
  * `metadata.labels` の型（`string[]` でない場合の扱い）

* その結果、`GetContentResult` の必須項目（`id/type/title`）が安定して生成でき、必要に応じて `body` / `labels` も安定して取得できる状態にします。
