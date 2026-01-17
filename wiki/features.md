# 機能一覧

> [!note]
> このページでは、`my-confluence-mcp` が提供する機能を「何ができるのか／どう使うのか／どんな点に注意すべきか」という観点で整理します。  

---

## 🔎 Confluence 内のページ検索：`confluence_search`

### できること
- Confluence内のページを **CQL（Confluence Query Language）** を使って検索できます。
- キーワード検索だけでなく、**CQL で条件を組み合わせた検索（例：スペース指定、タイトル条件、更新日条件など）** ができます。
- 検索結果は、AI が扱いやすい形で「候補一覧」として返します（ページを特定するための情報が含まれます）。

### 使い方（イメージ）
- AI（Copilot など）に「Confluence で `◯◯` を探して」と依頼すると、内部的に検索ツールが実行されます。
- より正確に絞り込みたい場合は、CQL の条件（スペース・タイトル・ラベルなど）を意識した依頼が有効です。

### デフォルト CQL（環境変数 `CONFLUENCE_DEFAULT_CQL`）
検索時に「必ず適用したい CQL」を、環境変数として固定できます。  
これにより、ツール利用者（AI やユーザー）が入力した CQL に関わらず、常に組織ルールに沿った絞り込み（例：特定スペースのみ、ページのみ、機密ラベル除外など）を強制できます。

- 設定方法（例）
  ```json
  "CONFLUENCE_DEFAULT_CQL": "space = SAMPLE AND type = page AND status = current"
  ```
- 実際の検索では、概ね次のように合成されます（概念図）
  ```text
  (<default_cql>) AND (<user_cql>)
  ```

なお、ユーザーの CQL に `ORDER BY` が含まれている場合は、**`ORDER BY` はユーザー側を優先して末尾に保持** します（例：`ORDER BY lastmodified DESC`）。

> [!tip]
> CQL およびフィールド値は公式リファレンスを参照してください。
> - Cloud: https://developer.atlassian.com/cloud/confluence/cql-fields/
> - Onprem: https://developer.atlassian.com/server/confluence/cql-field-reference/

#### 設定の良い例（推奨）

**常に適用したいフィルタ条件** だけをデフォルトに寄せるのが基本です。

* 特定スペースに固定して、AI の検索ブレを抑える\
  `mcp.json`:
  ```json
  "CONFLUENCE_DEFAULT_CQL": "space = SAMPLE"
  ```
  ユーザー入力（例）:
  ```sql
  text ~ "手順書" ORDER BY lastmodified DESC
  ```
  合成イメージ:
  ```sql
  (space = DVA) AND (text ~ "手順書") ORDER BY lastmodified DESC
  ```

* 「ページのみ」「現行のみ」などの安全な共通条件を強制する\
  `mcp.json`:
  ```json
  "CONFLUENCE_DEFAULT_CQL": "type = page AND status = current"
  ```

* 機密ラベルを除外（運用に合わせて）\
  `mcp.json`:
  ```json
  "CONFLUENCE_DEFAULT_CQL": "label != secret AND label != confidential"
  ```

* 特定配下のページのみ取得する\
  `mcp.json`:
  ```json
  "CONFLUENCE_DEFAULT_CQL": "ancestor = <page id>"
  ```

#### 悪い例（避けたい）

デフォルト CQL は **常に強制される** ため、入れ方を誤ると検索体験が壊れやすいです。

* `ORDER BY` をデフォルトに入れてしまう\
  デフォルト側に `ORDER BY` を含めると、ユーザーCQLの `ORDER BY` と衝突・二重化しやすく、意図しないクエリになりがちです。
  ```json
  # 悪い例
  "CONFLUENCE_DEFAULT_CQL": "space = SAMPLE ORDER BY lastmodified DESC"
  ```
* **強すぎる絞り込み** をデフォルトに入れてしまう\
  例：特定ラベル必須、特定タイトル必須などは、検索ヒットが極端に減って「検索できない」に見えやすいです。
  ```json
  # 悪い例（運用上の狙いがない限り避ける）
  "CONFLUENCE_DEFAULT_CQL": "label = must-have-label"
  ```
* 長大な CQL を詰め込みすぎる\
  CQLには長さ上限があり、デフォルトとユーザー入力を合成すると上限を超えて失敗することがあります（運用ルールは短く・要点だけにするのがおすすめです）。
  ```json
  # 悪い例（長すぎる/複雑すぎる）
  "CONFLUENCE_DEFAULT_CQL": "(...非常に長い条件...)"
  ```

### 取得件数について

tool では、以下のオプションを受け取ります。

| オプション | 概要 |
| --------- | ---- |
| defalut_limit | ユーザーが明示的に取得件数を指定しない場合に内部で採用する規定値です。<br>規定値は 10 件となります。 |
| max_limit | ユーザーが大きすぎる limit を指定した場合に強制的に丸める値です。<br>環境変数 `CONFLUENCE_SEARCH_MAX_LIMIT` にて指定可能です。無指定の場合は 50 件となります。 |

#### 実際のユースケースごとの取得件数
| プロンプト（default_limit） | SEARCH_MAX_LIMIT | 取得件数 |
| --------- | ---------------- | ------- |
| 無指定（10 件） | 無指定（50件） | 10 件 |
| 無指定（10 件） | 5 件 | 5 件 |
| 20 件 | 無指定（50件） | 20 件 |
| 20 件 | 5 件  | 5 件 |

### 出力（イメージ）
- 検索結果は **ページの候補一覧** として返ります。
- 候補が複数ある場合、ユーザーは「このページを開いて」といった形で次の「ページ内容の取得」に進めます。

### 注意点
- 検索の自由度は高い一方で、CQL の指定が曖昧だと候補が多くなりがちです。
- 検索結果は、Confluence 側の権限に依存します（閲覧権限がないページは取得できません）。
- `CONFLUENCE_DEFAULT_CQL` を設定している場合、検索は常にその条件で **追加フィルタ** されます（ユーザー入力だけでは解除できません）。\
  「検索できない」「想定よりヒットが少ない」場合は、まずデフォルトCQLの条件を確認してください。

---

## 📄 ページ内容の取得（ページ ID 指定）：`confluence_get_content`

### できること
- 検索結果などで得た **ページ ID** を指定して、対象ページの内容を取得できます。
- 取得できる情報の例：
  - ページのタイトル
  - ページ本文（主にHTML形式）
  - 付随情報（環境により取得できる範囲は変わります）

### 使い方（イメージ）
1. 検索でページ候補を見つける  
2. 「このページを開いて」「このページの内容を要約して」と依頼する  
3. AI がページ内容取得ツールを使って内容を取得し、要約や引用を返す

### 文字数制限
- 取得する本文は長くなりがちなので、**本文長の上限** を設けて必要十分な範囲に絞って返します。
- 文字数の上限値は `CONFLUENCE_BODY_MAX_CHARS` で設定が可能です。デフォルト値は 20000。\
  `mcp.json`:
  ```json
  "CONFLUENCE_BODY_MAX_CHARS": "20000"
  ```

### 注意点
- ページ本文は HTML を含む場合があります。AI 側では必要に応じて整形・要約して利用します。
- 大規模ページの場合、上限により末尾が切り捨てられることがあります。
