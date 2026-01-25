ようこそ **my-confluence-mcp** プロジェクトWikiへ！\
本 Wiki では概要 使い方 仕様 参考資料をまとめます。

---

## my-confluence-mcp とは

**my-confluence-mcp** は GitHub Copilot などの AI アシスタントから Confluence のコンテンツを検索 参照するための **MCP サーバー** です。  
Confluence Cloud および オンプレミス版（Data Center Server）に対応し 社内 Wiki に蓄積された知見を開発支援 AI が活用できるようにします。

---

## できること

- 🔎 **Confluenceページの検索（CQL）**  
  条件に一致するページ一覧を取得し、タイトル・抜粋・更新日時などを返します
- 📄 **Confluenceページ内容の取得**  
  ページ ID から本文（HTML）やメタデータを取得し、AI が要約や引用に利用できます
- 🧾 **出力の整形**  
  取得結果は JSON に加え、読みやすい Markdown としても出力します
- 🔒 **読み取り専用**  
  作成／更新／削除などの書き込み操作は行いません

---

## 次に読む

- 🚀 **[入門ガイド](./getting-started)**  
  導入手順と最短の動作確認
- 🔑 **[環境変数について](./env)**  
  認証設定と接続先の指定方法
- 📚 **[機能一覧](./features)**  
  機能の詳細 仕様 制約

---

## 参考資料

- 📎 **[参考資料](./reference)**  
  CQL や API など 公式ドキュメントのリンク集

---

## よくある利用フロー

1. MCPクライアント（例 GitHub Copilot Chat）に本サーバーを登録する
2. ユーザーが Confluence 検索を依頼する
3. AI が検索結果から対象ページを選び、内容を取得する
4. AI が要約、引用して回答する

---

## サポートする環境

- ☁️ Confluence Cloud（REST API v1）
- 🏢 Confluence Data Center Server（REST API v9213 相当）
