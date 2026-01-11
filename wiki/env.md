# 環境編素について

> [!note]
> ここでは、`.vscode/mcp.json` に記載する環境変数について説明します。

## 設定値
| 定数名 | 説明 | 型 |
| ----- | ---- | -- |
| `CONFLUENCE_SEARCH_MAX_LIMIT` | 検索 API 実行時に取得する最大件数です。<br>大きすぎる Limit が指定されたときに、上限として強制的に丸める値です。| Number |
| `CONFLUENCE_DEFAULT_CQL` | 検索 API 実行時の CQL に必ず組み込む CQL です。| String |
