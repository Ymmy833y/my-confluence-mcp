# My Confluence MCP

## プロジェクト概要

**My Confluence MCP** は、GitHub Copilot などのコーディング支援AIと Atlassian Confluence を連携させるための **MCP (Model Context Protocol) サーバー** です。\
Confluence 上の情報を検索・取得して提供するリードオンリー（読み取り専用）のサーバーで、Confluence Cloud 環境およびオンプレミス (Data Center/Server) 環境の両方に対応しています。

## 機能

* **Confluenceページの検索** – Confluence Query Language (CQL) を用いたページ全文検索機能。検索クエリに一致するページ一覧を取得できます。検索結果は件数やページタイトル、更新日時、抜粋などのメタデータ付きで返されます。
* **Confluenceページ内容の取得** – ページのIDを指定して、そのページの詳細内容（タイトルや本文、ラベル等）を取得します。本文はHTML形式で取得され、長大な場合は上限文字数までを返します（超過分は適宜切り詰め）。
* **結果データの整形** – 上記の検索結果やページ内容は、構造化データ（JSON）として提供されるとともに、読みやすいMarkdown形式のテキストでも出力されます。例えば検索結果ではページ一覧をMarkdownのリストとして整形し、ページ本文取得ではHTML本文をコードブロック内に埋め込んだMarkdownを生成します。
* **Confluence Cloud＆オンプレミス対応** – Atlassian Cloud版 Confluence (REST API v1) と Data Center/Server版 Confluence (REST API v9213相当) の両方に対応しており、環境差異はアダプター層で吸収されています。
* **読み取り専用設計** – Confluence 上のデータを参照する専用であり、ページの新規作成・更新・削除など書き込み操作は一切行いません。安全性のため、検索件数や本文長に上限を設け、機密情報が出力されないよう配慮しています。

## インストールと設定

### 前提条件

* **Node.js および npm** – 本ツールは Node.js 上で動作します。Node.js 22 以上の環境で動作確認されています。事前に Node.js と npm をインストールしてください。
* **Confluence 環境** – Confluence Cloud またはオンプレミスの利用資格（閲覧権限）と、必要に応じてAPIトークンや Personal Access Token (PAT) を用意してください。

### セットアップ手順

本プロジェクトのセットアップは、**開発者向け**（このリポジトリを改修・ビルドする人）と、**利用者向け**（ビルド済み成果物を使ってMCPとして利用する人）で手順が異なります。目的に応じて該当手順を参照してください。

---

## 利用者向け（ビルド済み成果物を使ってMCPとして利用する）

1. **ビルド済み成果物を入手する**
   `build` ブランチから、ビルド済みの成果物を含むリポジトリをダウンロードします。

   * 取得元: `https://github.com/Ymmy833y/my-confluence-mcp/tree/build`

2. **ダウンロードしたフォルダーを展開する**
   zip等で取得した場合は、任意の場所に展開してください。
   （例: `C:/Users/[your]/Downloads/my-confluence-mcp-build/`）

3. **MCPを利用するリポジトリに mcp.json を設定する**
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
           "CONFLUENCE_BODY_MAX_CHARS": "20000"
         }
       }
     }
   }
   ```

   * `args` の `index.js` パスは、**展開したフォルダーの配置場所に合わせて**必ず修正してください。
   * `CONFLUENCE_HOSTING` は `"cloud"` または `"onprem"` を指定します。
   * `CONFLUENCE_PERSONAL_ACCESS_TOKEN` を利用しない場合は、**`CONFLUENCE_BASE_URL` / `CONFLUENCE_EMAIL` / `CONFLUENCE_API_TOKEN`** を設定してください。

4. **MCPを起動する**
   上記設定後、利用しているMCPクライアント（例: VS Code / GitHub Copilot など）側でMCPを起動（または再読み込み）すれば利用できます。

> [!note]
> 導入手順の詳細については、[wiki](https://github.com/Ymmy833y/my-confluence-mcp/wiki) にも記載しています。

---

## 開発者向け（リポジトリを開発・ビルドする）

1. **リポジトリの取得**: 本リポジトリ（`my-confluence-mcp`）をクローンするか、ソースコードをダウンロードします。
2. **依存関係のインストール**: プロジェクトのディレクトリで次のコマンドを実行し、必要なパッケージをインストールします。

   ```
   npm install
   ```

   使用している主要ライブラリには、TypeScript 5.9や`@modelcontextprotocol/sdk` (MCP SDK) 1.25.1 などがあります。
3. **環境変数の設定**: Confluence 接続に必要な設定を環境変数で指定します。プロジェクトルートに `.env` ファイルを作成するか、環境に以下の変数を設定してください（dotenv対応）。各変数の意味は次の通りです：

   * `CONFLUENCE_HOSTING`：接続先の種別を指定します。**Confluence Cloud** の場合は `"cloud"`、**オンプレミス (Data Center/Server)** の場合は `"onprem"` を指定してください。
   * `CONFLUENCE_BASE_URL`：Confluence のベースURLを指定します（末尾のスラッシュは不要）。例）Cloud の場合: `https://.atlassian.net/wiki`、オンプレミスの場合: `https://`。
   * **認証情報**：以下のいずれかを設定します：

     * `CONFLUENCE_PERSONAL_ACCESS_TOKEN`：Confluence の Personal Access Token (PAT)。オンプレミス版をご利用の場合や、特別にPATを発行している場合はこちらを使用します。指定した場合、後述のメールアドレス・APIトークンは不要です。オンプレミス版では PAT をベアラートークンとして送信し認証します。
     * `CONFLUENCE_EMAIL` と `CONFLUENCE_API_TOKEN`：Cloud 環境をご利用の場合はこちらを使用します。ご自身の Atlassian アカウントのメールアドレスと、発行したAPIトークンをそれぞれ設定してください。**Cloud版のAPIでは** Basic認証として「`メールアドレス:APIトークン`」の組み合わせを使用します（パスワードではなくAPIトークンを使用）。なおオンプレミス環境でPATを使用しない場合も、同様にユーザー名（メールアドレス）とAPIトークン（またはアプリパスワード）を指定してBasic認証を行います。
       (**注:** `CONFLUENCE_PERSONAL_ACCESS_TOKEN` を指定しない場合、`CONFLUENCE_EMAIL` と `CONFLUENCE_API_TOKEN` の両方が必須です。逆にPATを設定した場合はメールアドレスとAPIトークンを省略できます。)
   * `CONFLUENCE_TIMEOUT_MS`：Confluence REST API呼び出し時のタイムアウト値（ミリ秒）。省略時はデフォルト **15000** (15秒) が適用されます。
   * `CONFLUENCE_BODY_MAX_CHARS`：ページ本文取得時の最大文字数。指定した値を超える本文は切り捨てられます。省略時はデフォルト **20000** 文字です。非常に大きなページでもこの上限以内で返すことで、応答が肥大化しないようにしています。
4. **ビルドと起動**: 環境変数を設定したら、以下のコマンドでサーバーを起動できます。

   * 開発モードで実行する場合（TypeScriptファイルを直接実行しホットリロードなし）:

     ```
     npm run dev
     ```

     このモードでは `src/index.ts` からアプリケーションを起動し、コンソールにログを出力します。
   * ビルドして実行する場合（成果物をコンパイルしてから実行）:

     ```
     npm run build
     npm run bundle
     npm run start
     ```

     上記により `dist/` ディレクトリ以下にコンパイルされた JavaScript ファイルが出力され、それを用いてサーバーが起動します。初回実行時には、STDOUT上にサーバー起動ログが表示され、設定された Confluence 環境（ホスティング種別やベースURL、タイムアウト値、認証方式など）が出力されます。例えば以下のようなログです：

     ```
     Confluence MCP Server running on stdio {"hosting":"cloud","baseUrl":"https://xxxx.atlassian.net/wiki","timeoutMs":15000,"bodyMaxChars":20000,"auth":"basic"}
     ```

     ※上記の通り、本サーバーは **標準入出力（STDIO）** 経由で動作するプロトコルサーバーです。HTTPポートを開放するのではなく、親プロセス（AIクライアント）とSTDIOでメッセージをやり取りする設計になっています。


## 使い方 (利用方法)

My Confluence MCPサーバーは単体でユーザーと対話するものではなく、**GitHub Copilot Chat** 等のMCPクライアント（AIアシスタント側）から呼び出されて利用されます。\
Copilotなど対応クライアントに本サーバーを登録（連携）することで、ユーザーが「Confluence上の○○に関するドキュメントを探して」と質問した際に、本サーバーが検索機能を通じてConfluenceから該当情報を取得し、Copilotの回答に引用・反映されます。
本サーバー起動時に登録される MCP ツールは次の2つです：

* **`confluence_search`** – CQLクエリ文字列を受け取り、Confluence上で該当するページを検索します。検索結果の一覧（タイトル、抜粋、更新日時等）はMarkdownのリストとしてAIアシスタントに返され、AIはそれをユーザーに提示します。必要に応じてユーザーは検索結果の中から参照したいページを選択できます。
* **`confluence_get_content`** – ページのIDを受け取り、該当ページの詳細（本文やメタデータ）を取得します。取得結果はページタイトルや更新日時、ラベルなどの情報とともに、ページ本文（HTML）をMarkdownコードブロック内に埋め込んだ形で返されます。AIアシスタントはこの内容を解析し、ユーザーにページ内容の要約や該当部分を回答できます。

**利用シナリオ例**: \
Copilot Chatにおいて、ユーザーが「ConfluenceでプロジェクトXの設計書を検索して」と依頼すると、AI（Copilot）はまず `confluence_search` ツールを使いConfluence内を検索します。続いて「ではこの設計書ページを開いて」と指示すると、AIは該当ページのIDを使って `confluence_get_content` ツールを呼び出し、ページ内容を取得します。取得した情報を元に、Copilotはユーザーに設計書の内容を要約した回答を提示します。このように本プロジェクトは、CopilotなどのAIアシスタントが社内Wikiから必要な情報を引き出す役割を担います。

## ライセンス

本プロジェクトは **MITライセンス** の下で公開されています。詳しくはリポジトリ内のLICENSEファイルを参照してください。