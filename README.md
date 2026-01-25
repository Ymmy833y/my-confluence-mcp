<h1 align="center">My Confluence MCP</h1>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg"></a>
  <a href="https://github.com/Ymmy833y/my-confluence-mcp/releases/tag/v1.0.0"><img alt="Version 1.0.0" src="https://img.shields.io/badge/Version-1.0.0-red.svg"></a>
  <img alt="TypeScript" src="https://img.shields.io/badge/-TypeScript-blue?style=flat-square&logo=typescript&logoColor=white">
</p>

## 概要
**My Confluence MCP** は、GitHub Copilot などのコーディング支援 AI と Atlassian Confluence を連携させるための **MCP (Model Context Protocol) サーバー** です。\
Confluence 上の情報を検索・取得して提供するリードオンリー（読み取り専用）のサーバーで、Confluence Cloud 環境およびオンプレミス (Data Center/Server) 環境の両方に対応しています。

## 主な機能

- 🔎 **Confluenceページの検索**\
  Confluence Query Language (CQL) を用いたページ全文検索機能。検索クエリに一致するページ一覧を取得できます。検索結果は件数やページタイトル、更新日時、抜粋などのメタデータ付きで返されます。
- 📄 **Confluenceページ内容の取得**\
  ページの ID を指定して、そのページの詳細内容（タイトルや本文、ラベル等）を取得します。本文は HTML 形式で取得され、長大な場合は上限文字数までを返します（超過分は適宜切り詰め）。
- 🧾 **結果データの整形**\
  検索結果やページ内容は **構造化データ（JSON）** として提供されるほか、閲覧しやすい **Markdown 形式** でも出力されます。例えば検索結果はページ一覧を Markdown のリストとして整形します。ページ内容の取得では、本文解釈に不要な HTML タグや属性を可能な範囲で除去しつつ Markdown へ変換します（変換が難しい場合は、HTML 本文をコードブロックとして埋め込みます）。
- ☁️🏢 **Confluence Cloud＆オンプレミス対応**\
  Atlassian Cloud版 Confluence (REST API v1) と Data Center/Server 版 Confluence (REST API v9213 相当) の両方に対応しており、環境差異はアダプター層で吸収されています。

> [!tip]
> 🔒 **読み取り専用**  
> ページの新規作成・更新・削除などの書き込みは一切行いません。

## インストールと設定

> [!important]
> 本ツールを利用する上での **前提条件** は以下の通りです。
> * **Node.js および npm**\
>   本ツールは Node.js 上で動作します。Node.js 22 以上の環境で動作確認されています。事前に Node.js と npm をインストールしてください。
> * **Confluence 環境**\
>   Confluence Cloud またはオンプレミスの利用資格（閲覧権限）と、必要に応じてAPIトークンや Personal Access Token (PAT) を用意してください。

セットアップは、**利用者向け**（ビルド済み成果物を使ってMCPとして利用する人）と、**開発者向け**（このリポジトリを改修・ビルドする人）で手順が異なります。\
目的に応じて該当手順を参照してください。

---

### 利用者向け（ビルド済み成果物を使ってMCPとして利用する）

1. **ビルド済み成果物を入手する**\
   [build ブランチ](https://github.com/Ymmy833y/my-confluence-mcp/tree/build) から、ビルド済みの成果物を含むリポジトリをダウンロードします。

2. **ダウンロードしたフォルダーを展開する**\
   zip等で取得した場合は、任意の場所に展開してください。
   （例: `C:/Users/[your]/Downloads/my-confluence-mcp-build/`）

3. **MCPを利用するリポジトリに mcp.json を設定する**\
   MCPを利用したいプロジェクト側の `.vscode/mcp.json` に、以下を追記します。
   ```json
   {
     "servers": {
       "my-confluence-mcp": {
         "command": "node",
         "args": [
           "C:/Users/[your]/Downloads/my-confluence-mcp-build/my-confluence-mcp-build/index.js"
         ],
         "env": {
           "CONFLUENCE_HOSTING": "cloud",
           "CONFLUENCE_BASE_URL": "https://your-domain.atlassian.net/wiki",
           "CONFLUENCE_EMAIL": "you@example.com",
           "CONFLUENCE_API_TOKEN": "xxxxxxxxxx",
           "CONFLUENCE_PERSONAL_ACCESS_TOKEN": "xxxxxxxxxx",
           "CONFLUENCE_BODY_MAX_CHARS": "20000",
           "CONFLUENCE_DEFAULT_CQL": "space = SAMPLE"
         }
       }
     }
   }
   ```

   * `args` の `index.js` パスは、**展開したフォルダーの配置場所に合わせて** 必ず修正してください。
   * `CONFLUENCE_HOSTING` は `"cloud"` または `"onprem"` を指定します。
   * `CONFLUENCE_PERSONAL_ACCESS_TOKEN` を利用しない場合は、**`CONFLUENCE_EMAIL` / `CONFLUENCE_API_TOKEN`** を設定してください。
   * その他、環境変数については、[Wiki／環境変数について](https://github.com/Ymmy833y/my-confluence-mcp/wiki/env) を確認してください。

4. **MCP を起動する**\
   上記設定後、利用しているMCPクライアント（例: VS Code / GitHub Copilot など）側で MCP を起動（または再読み込み）すれば利用できます。

> [!note]
> 導入手順については、[Wiki／入門ガイド](https://github.com/Ymmy833y/my-confluence-mcp/wiki/getting-started) にも記載しています。

---

### 開発者向け（リポジトリを開発・ビルドする）
<details><summary>Click here...</summary>

1. **リポジトリの取得**\
   本リポジトリ（`my-confluence-mcp`）をクローンするか、ソースコードをダウンロードします。
2. **依存関係のインストール**\
   プロジェクトのディレクトリで次のコマンドを実行し、必要なパッケージをインストールします。
   ```sh
   npm install
   ```
3. **環境変数の設定**\
   Confluence 接続に必要な設定を環境変数で指定します。プロジェクトルートに `.env` ファイルを作成するか、環境に以下の変数を設定してください（dotenv対応）。
   > [!note]
   > 環境変数については、[Wiki／環境変数について](https://github.com/Ymmy833y/my-confluence-mcp/wiki/env) を確認してください。
4. **ビルドと起動**\
   環境変数を設定したら、以下のコマンドでサーバーを起動できます。
   - 開発モードで実行する場合
     ```sh
     npm run dev
     ```
     このモードでは `src/index.ts` からアプリケーションを起動し、コンソールにログを出力します。
    - ビルドして実行する場合（成果物をコンパイルしてから実行）
      ```sh
      npm run build
      npm run bundle
      npm run start
      ```
      上記により `dist/` ディレクトリ以下にコンパイルされた JavaScript ファイルが出力され、それを用いてサーバーが起動します。
  
    初回実行時には、STDOUT 上にサーバー起動ログが表示され、設定された Confluence 環境が出力されます。例えば以下のようなログです。
    ```sh
    Confluence MCP Server running on stdio {"hosting":"cloud","baseUrl":"https://xxxx.atlassian.net/wiki","timeoutMs":15000,"bodyMaxChars":20000,"auth":"basic"}
    ```
</details>

## 使い方（利用方法）

My Confluence MCP サーバーは単体でユーザーと対話するものではなく **GitHub Copilot Chat** 等の MCP クライアントから呼び出されて利用されます。\
Copilotなど対応クライアントに My Confluence MCP を登録（連携）することで、ユーザーの質問に応じて Confluence から情報を取得し、AI の回答に引用・反映されます。

### 登録されるMCPツール

| ツール                     | 役割               | 返却形式                                                             |
| -------------------------- | ------------------ | -------------------------------------------------------------------- |
| 🔎 `confluence_search`      | CQLでページ検索    | ページ一覧をMarkdownリストで返却（タイトル 抜粋 更新日時等）         |
| 📄 `confluence_get_content` | ページIDで詳細取得 | タイトル 更新日時 ラベル＋本文HTMLをコードブロック付きMarkdownで返却 |

### 利用シナリオ例
Copilot Chat で「プロジェクトの設計書を検索して」→ `confluence_search`\
「このページを開いて」→ `confluence_get_content`\
取得内容を元に、AI が要約して回答。

このようにMy Confluence MCPは、Copilot などの AI アシスタントが社内 Wiki から必要な情報を引き出す役割を担います。

> [!note]
> 利用方法の詳細については、[Wiki／機能一覧](https://github.com/Ymmy833y/my-confluence-mcp/wiki/features) を確認してください。

## ライセンス

本プロジェクトは**MITライセンス**の下で公開されています。\
詳しくはリポジトリ内の [LICENSE](LICENSE) ファイルを参照してください。
