# 環境変数について

> [!note]
> ここでは、`.vscode/mcp.json` に記載する環境変数について説明します。
>
> `mcp.json` 上では値は文字列として書くことが多いですが、`CONFLUENCE_TIMEOUT_MS` / `CONFLUENCE_BODY_MAX_CHARS` などは内部で数値として解釈されます。

## 設定値

| 定数名 | * | 説明 | 型 |
| ----- | :--: | ---- | -- |
| `CONFLUENCE_HOSTING` | <img alt="必須" src="https://img.shields.io/badge/必須-red.svg"> | 接続先の種別を指定します。`cloud`（Confluence Cloud）または `onprem`（Data Center/Server）を指定します。 | String |
| `CONFLUENCE_BASE_URL` | <img alt="必須" src="https://img.shields.io/badge/必須-red.svg"> | Confluence のベース URL を指定します（末尾のスラッシュは不要）。<br>例：Cloud は `https://your-domain.atlassian.net/wiki`、オンプレは `https://confluence.example.com` など。 | String |
| `CONFLUENCE_EMAIL` | <img alt="必須" src="https://img.shields.io/badge/必須-red.svg"> | Cloud での Basic 認証（`email:apiToken`）に使う Atlassian アカウントのメールアドレスです。<br>※ `CONFLUENCE_PERSONAL_ACCESS_TOKEN` を使う場合は不要です。 | String |
| `CONFLUENCE_API_TOKEN` | <img alt="必須" src="https://img.shields.io/badge/必須-red.svg"> | Cloud での Basic 認証に使う API トークンです（パスワードではなく API token を使用）。`CONFLUENCE_EMAIL` とセットで指定します。<br>※ `CONFLUENCE_PERSONAL_ACCESS_TOKEN` を使う場合は不要です。 | String |
| `CONFLUENCE_PERSONAL_ACCESS_TOKEN` | <img alt="必須" src="https://img.shields.io/badge/必須-red.svg"> | Confluence の Personal Access Token（PAT）です。主にオンプレ（Data Center/Server）向けで、`Authorization: Bearer <token>` として送信します。<br>これを指定した場合、`CONFLUENCE_EMAIL` / `CONFLUENCE_API_TOKEN` は未設定でもOKです。 | String |
| `CONFLUENCE_TIMEOUT_MS` | <img alt="任意" src="https://img.shields.io/badge/任意-blue.svg"> | Confluence REST API 呼び出しのタイムアウト（ミリ秒）です。省略時は `15000`（15秒）。 | Number |
| `CONFLUENCE_SEARCH_MAX_LIMIT` | <img alt="任意" src="https://img.shields.io/badge/任意-blue.svg"> | 検索 API 実行時に取得する最大件数です。<br>大きすぎる Limit が指定されたときに、上限として強制的に丸める値です。 | Number |
| `CONFLUENCE_DEFAULT_CQL` | <img alt="任意" src="https://img.shields.io/badge/任意-blue.svg"> | 検索 API 実行時の CQL に必ず組み込む CQL です。<br>概ね `(<default_cql>) AND (<user_cql>)` の形で合成され、ユーザー CQL に `ORDER BY` がある場合はユーザー側を優先して末尾に保持します。 | String |
| `CONFLUENCE_BODY_MAX_CHARS` | <img alt="任意" src="https://img.shields.io/badge/任意-blue.svg"> | ページ本文取得時の最大文字数です。指定した値を超える本文は切り捨てられます。省略時は `20000`。 | Number |
