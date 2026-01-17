# オンプレ環境の REST API レスポンス検証

> [!important]
> オンプレ（Confluence Server / Data Center）環境では、REST API のレスポンスがバージョン・設定等により揺れる可能性があります。\
> そのため、各 API 実装において **Tool 側が依存する必須項目が実レスポンスから確実に生成できること** を事前に検証してください。\
> 生成できない場合は、**型定義／Mapper** を修正する必要があります。

---

## 1. 共通方針（検証の観点）

- **「正規化後の必要項目」**（Tool 側で必要となるフィールド）が満たせることを最優先で確認する
- 対象環境から **実レスポンスを取得** し 既存実装の **型定義** と **mapper の変換結果** が必須項目を満たすか確認する
  - 型定義が実レスポンスとズレている場合 mapper 側で参照ミスや null access が起こりやすい
  - mapper の出力は Tool 側が参照する正規化 DTO として安定している必要がある
- 環境差分が出やすい項目は **任意扱い** にし 欠落時のフォールバックを設計する
  - Cloud と OnPrem で同名フィールドでも配置・ネスト・命名・型が異なることがある
  - OnPrem でもバージョンや設定により返却可否が変わることがある
  - フォールバックの優先順位を決め 一貫した採用ルールを mapper に閉じ込める
- 期待値と実装のズレが判明した場合は **Tool 側の期待を変えず adapters 側で吸収する**
  - 差分吸収の責務を adapters 内に集約することで 改修箇所と影響範囲が限定される

> [!tip]
> 期待値と実際値との差分発生時の修正箇所については、下記理由より adapters 内の mapper を修正することが推奨されます。
> 1. Tool 側に環境差分の知識を持たせずに済むため
> 2. 差分吸収の責務を境界層に閉じ込められるため
> 3. 将来 Cloud OnPrem どちらの仕様変更があっても、影響範囲を adapters に限定できるため 
> 4. 正規化結果の契約を保ったまま内部実装だけを差し替えられるため

---

## 2. 検証対象：Search API（`confluence_search`）

### 2.1 実レスポンス取得

対象オンプレ環境に対して Search API を実行し **JSON を確認** してください（1 件以上ヒットする条件で実施）。

---

### 2.2 実レスポンスの確認

実レスポンスと既存実装の型定義（`src\confluence\adapters\onprem\api\searchResponse.ts`）の構造を突合し、以下を中心に **存在有無、型、ネスト** を確認する。  
ここでは、まず実レスポンスの構造を事実として確定し、型定義の整合を取る。

#### ルート

* `totalCount`, `results`, `start`, `limit`, `size`, `_links`

確認ポイント
- `results` が配列であるか、もしくは別キー配下にあるか
- `start`, `limit` がレスポンスに存在しない場合があるか

#### `results[]` の要素

* 直接項目:
  * `id`, `title`, `excerpt`, `url`, `lastModified`
* コンテナ情報:
  * `resultGlobalContainer.displayUrl`
* スペース:
  * `space.key`, `space.name`
* 種別:
  * `entityType`, `resourceType`
* `content`（存在する場合）:
  * `content.id`, `content.type`, `content.title`

確認ポイント
- `title` が常に存在するか、空文字の可能性があるか
- `excerpt` が未返却の場合 null か undefined か 空文字か
- `url` が相対、もしくは絶対のどちらか
- `lastModified` が、ISO文字列か
- `space` が存在しない結果があるか（権限不足など）
- `content` が存在する場合としない場合で、どの項目が信頼できるか

---
z
### 2.3 必須項目が生成できるか

実レスポンスから `src\confluence\adapters\onprem\mappers\searchMapper.ts` の変換で、下表の正規化後の必要項目が **作れる** ことを確認する。
ここでのゴールは、欠落や揺れがあるフィールドに対して、変換ルールとフォールバックが成立している状態にする。

| 項目名 | 必須 | 補足 |
| --- | :---: | --- |
| total | ✅ | 検索の合計件数 |
| start | ✅ | 実レスポンスにない場合はリクエストパラメータを採用する |
| limit | ✅ | 実レスポンスにない場合はリクエストパラメータを採用する |
| result.id | ✅ | ページID |
| result.title | ✅ | ページタイトル |
| result.type |  | 例 page など |
| result.url |  | Confluence上の表示URL |
| result.spaceKey |  | スペースキー |
| result.spaceName |  | スペース名 |
| result.excerpt |  | 検索結果の抜粋<br>必須ではないが、結果の判別に有用なため可能なら返却する |
| result.lastModified |  | 最終更新日時 |

---

### 2.4 期待値と実際値に差分がある場合

* フィールドの欠落、追加、型の違い、ネスト違いがある場合は **型定義** と **mapper の変換処理** を実レスポンスに合わせて修正する
  - 型定義は、実レスポンスに合わせて optional と union を適切に付与する
  - mapper は optional chaining とフォールバックで、安定した正規化結果を作る

* その結果、必要項目が安定して生成できる状態にする
  - 想定外の欠落があっても、処理が落ちない
  - 出力が揺れない
  - Tool 側が分岐を増やさずに済む

---

## 3. 検証対象：Get Content API（`confluence_get_content`）

### 3.1 実レスポンス取得

対象オンプレ環境に対して Get Content API を実行し **JSON を確認** してください。

---

### 3.2 実レスポンスの確認

実レスポンスと既存実装の型定義（`src\confluence\adapters\onprem\api\getContentResponse.ts`）の構造を突合し、以下を中心に **存在有無、型、ネスト** を確認する。
ここでは、まず実レスポンスの構造を事実として確定し、型定義の整合を取る。

#### ルート

* `id`, `title`, `type`, `_links`, `space`, `version`, `body`, `metadata`

確認ポイント
- ルート直下に `id`, `title`, `type` が常に存在するか
- ルート直下に `data` が存在する場合としない場合があるか
- レスポンスが `data` 包み（`{ data: {...} }`）で返るパターンがあるか
- `title` が null になり得るか、空文字になり得るか

#### URL

* `_links.webui`

確認ポイント
- `_links.webui` が存在するか
- `webui` 以外に `self`, `base` 相当があるか（URL組み立ての材料になるか）

#### スペース

* `space.key`, `space.name`

確認ポイント
- `space` が常に存在するか（権限やAPI挙動で欠ける可能性があるか）
- `key`, `name` の型が string で確定しているか

#### バージョン

* `version.when`, `version.number`

確認ポイント
- `version.when` が ISO文字列か
- `when` または `number` のどちらかだけ欠けるケースがあるか

#### body

* `body.storage.representation`, `body.storage.value`
* `body.view.representation`, `body.view.value`
* （存在する場合）`body.export_view.representation`, `body.export_view.value`

確認ポイント
- `body` 自体が欠けることがあるか（権限 取得条件など）
- `storage`,`view`, `export_view` のうちどれが実際に返るか
- `representation` が常に返るか、返らない場合があるか
- `value` が空文字になる可能性があるか

#### ラベル

* `metadata.labels`

確認ポイント
- `metadata` が欠けることがあるか
- `labels` が配列か、もしくは別構造（オブジェクト配列など）か
- `includeLabels` の指定によって返却有無が変わるか
- ラベルなしの場合 `[]` か null か undefined か

---

#### `data`（存在する場合）

レスポンスが `data` 配下に実体を持つ場合、ルートと同様に `data.*` も確認する

##### ルート
* `data.id`, `data.title`, `data.type`

##### URL
* `data._links.webui`

##### スペース
* `data.space.key`, `data.space.name`

##### バージョン
* `data.version.when`, `data.version.number`

##### body
* `data.body.storage.representation`, `data.body.storage.value`
* `data.body.view.representation`, `data.body.view.value`
* （存在する場合）`data.body.export_view.representation`, `data.body.export_view.value`

##### ラベル
* `data.metadata.labels`

確認ポイント
- ルート直下と `data` 配下で同名フィールドの中身が一致するか
- `data` がある場合ルート直下が空やダミーになっていないか
- `data` が部分的にしか埋まらないケースがあるか

---

### 3.3 必須項目が生成できるか

実レスポンスから `src\confluence\adapters\onprem\mappers\getContentMapper.ts` の変換で、下表の正規化後の必要項目が **作れる** ことを確認する。  
ここでのゴールは、欠落や揺れがあるフィールドに対して、変換ルールとフォールバックが成立している状態にする。

| 項目名 | 必須 | 補足 |
| --- | :---: | --- |
| id | ✅ | ページ ID |
| title | ✅ | ページタイトル |
| type |  | 例 page など |
| url |  | Confluence 上の表示URL |
| spaceKey |  | スペースキー |
| spaceName |  | スペース名 |
| updated |  | 最終更新日時 |
| version |  | バージョン |
| body.representation |  | 取得できた本文の representation |
| body.value |  | 本文 HTML <br>必須ではないが、結果の判別に有用なため可能なら返却する |
| labels |  | ラベル一覧 |

---

### 3.4 期待値と実際値に差分がある場合

* フィールドの欠落、追加、型の違い、ネスト違いがある場合は **型定義** と **mapper の変換処理** を実レスポンスに合わせて修正する
  - 型定義は、実レスポンスに合わせて optional と union を適切に付与する
  - mapper は optional chaining とフォールバックで、安定した正規化結果を作る
  - ルート直下と `data` 配下の両対応が必要な場合は 採用優先順位を固定して分岐を増やしすぎない
* その結果、必要項目が安定して生成できる状態にする
  - 想定外の欠落があっても、処理が落ちない
  - 出力が揺れない
  - Tool 側が分岐を増やさずに済む
