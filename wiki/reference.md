# Reference

このページは **my-confluence-mcp の検索・ページ取得** に必要な公式ドキュメントへのリンク集です。

---

## Cloud（REST API v1）
> [!tip]
> 本プロジェクトは **Confluence Cloud は v1 のみ** を対象とし、v2 は意図的に使用しません。

### API
- ページ検索（CQL）: https://developer.atlassian.com/cloud/confluence/rest/v1/api-group-search/#api-wiki-rest-api-search-get
- ページ取得（ID指定）: https://developer.atlassian.com/cloud/confluence/rest/v1/api-group-content/#api-wiki-rest-api-content-id-get

### 認証
- **Basic 認証（Atlassian アカウント + API token）**
  - Cloud の「Basic 認証」は *パスワードではなく API token を使用* します（`email:apiToken` を Base64 で Authorization に載せる）。
  - 公式: https://developer.atlassian.com/cloud/confluence/basic-auth-for-rest-apis/
  - API token の管理: https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/

> [!note]
> Cloud には、オンプレの PAT と同等の「Confluence の PAT」を前提とした説明は基本的に出てきません。\
> Cloud でのスクリプト用途は API token を使うのが標準。

---

## オンプレ（Data Center / Server、REST API は v9213 をベース）

### API
- ページ検索（CQL）: https://developer.atlassian.com/server/confluence/rest/v9213/api-group-search/#api-rest-api-search-get
- ページ取得（ID指定）: https://developer.atlassian.com/server/confluence/rest/v9213/api-group-content-resource/#api-rest-api-content-id-get

### 認証（環境設定に依存）
- **Personal Access Token（PAT, Bearer）**
  - オンプレでは PAT を **Bearer トークン** として利用できます（`Authorization: Bearer <token>`）。
  - 公式: https://confluence.atlassian.com/enterprise/using-personal-access-tokens-1026032365.html
- **Basic 認証（ユーザー名 + パスワード）**
  - 組織のセキュリティ設定で **API コールでの Basic 認証が無効化** されている場合があります。
    - 無効化について: https://confluence.atlassian.com/enterprise/disabling-basic-authentication-1044776464.html
    - 無効化時の allowlist（例外許可）について: https://confluence.atlassian.com/spaces/ENTERPRISE/pages/1044106574/Creating

※オンプレの PAT と、Cloud の API token は **別物** です（作成場所・用途・ヘッダー形式が異なります）。

## CQL
CQL およびフィールド値は公式リファレンスを参照してください。
- Cloud: https://developer.atlassian.com/cloud/confluence/cql-fields/
- オンプレ: https://developer.atlassian.com/server/confluence/cql-field-referen
