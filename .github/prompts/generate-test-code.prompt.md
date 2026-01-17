---
agent: 'agent'
description: 'Creates test code for the specified file and code.'
---

## 依頼内容
貴方には、[対象コード]のテストコードを作成してもらいます。

## 目的
このリポジトリにおけるテストコードは、以下を満たすことを目的とする。

- コアロジックの正しさを自動で担保する（回帰防止）
- 実装の意図と仕様を、テストが読めば理解できる状態にする
- I/O（HTTP / MCP transport / Confluence API 等）の不確実性を排除し、安定して高速に実行できるテストにする

---

## 前提（技術スタック / 実行環境）
- 言語: TypeScript
- モジュール: NodeNext（ESM）
- テストランナー: Vitest
- テスト環境: Node
- import は ESM 形式で記述する
- tsconfig の `paths` を使用している（`@core/*` 等）

---

## テストの配置規約
### 推奨
- テストファイルは実装と同じ階層に置く
  - ただし `src` は `tests` に読み替える
  - 例: `src/utils/foo.ts` に対して `tests/utils/foo.test.ts`

### 命名
- `*.test.ts` を用いる

---

## テスト対象の優先順位（重要）
1. **純粋関数 / 変換処理 / mapper**
   - DTO ⇄ Schema、adapter ⇄ core 型変換など
2. **バリデーション / スキーマ**
   - Zod schema の parse / safeParse
3. **サービス層（副作用を含むが外部 I/O は mock）**
4. **エントリポイント（src/index.ts）や transport の結合**
   - 原則、最小限。ユニットテストで担保できる部分を優先する

---

## 基本方針（テスト設計）
### 1. AAA パターンで書く
- Arrange: 前提データ・mock 準備
- Act: 対象関数実行
- Assert: 期待値の検証

### 2. 1テスト = 1つの観点
- 1つのテスト内で複数の観点を詰め込まない
- 複数ケースが必要なら `it.each` を使う

### 3. 実装詳細ではなく「振る舞い」を検証する
- private 実装や内部変数に依存しない
- 入出力、例外、ログ出力（必要なら）を検証する

### 4. 外部 I/O を直接叩かない
- Confluence API 呼び出し、ファイル、ネットワーク、時刻、環境変数などは mock/stub する
- flaky（不安定）なテストを作らない

---

## Vitest のコーディング規約
### import
- `globals: true` 前提にしない（原則、明示 import）
- 例:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
```

### spy / mock

* spy は最小限（必要な呼び出しのみ）
* `vi.restoreAllMocks()` / `vi.resetAllMocks()` の使い分けに注意

  * 基本は `afterEach(() => vi.restoreAllMocks())`

---

## tsconfig paths（alias）利用ルール

* テストでも `@core/*`, `@utils/*` など alias import を優先する
* 相対パスでの深い import（`../../..`）は避ける
* 例:

  * ✅ `import { foo } from "@utils/foo.js";`
  * ❌ `import { foo } from "../../../utils/foo.js";`

> 注意: NodeNext なので、ローカルファイル import の拡張子ルールはリポジトリ規約に従うこと。
> ただし、テストでは「alias import」を優先し、拡張子差異で壊れないよう統一する。

---

## 例外・エラーのテスト

* `throw` を期待する場合は `toThrow` を使う
* エラーメッセージに依存しすぎない（必要最小限の一致）

  * 例: `toThrow(/invalid/i)` のように正規表現で検証する

---

## ログ（winston）の扱い

* ログ出力は基本テストしない
* ただし「エラー時に logger.error を必ず呼ぶ」等の要件がある場合のみ spy する

  * spy する場合も `logger` の外部公開 API に対して行い、内部実装には触れない

---

## 環境変数・dotenv の扱い

* `process.env` を直接変更する場合は必ず退避/復元する

推奨パターン:

```ts
const ORIGINAL_ENV = process.env;

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
});
```

---

## HTTP / fetch の扱い

* Node の `fetch` を直接叩かない
* HTTP 層が必要な場合は、呼び出し関数を module 化し、その module を mock する

---

## 期待するテスト粒度（ユニットテストの基準）

### Unit Test

* 依存は mock され、対象モジュールの内部ロジックを検証できる
* 1〜50ms 程度で終わる

### Integration Test（必要な場合のみ）

* adapter + mapper + core を繋ぐ等、数モジュール単位
* 外部 API は still mock（ネットワークなし）

---

## テストケース設計のテンプレ

テストを書く前に、最低限以下を列挙すること:

1. 正常系（happy path）
2. 異常系（入力不足 / 不正値 / 想定外）
3. 境界値（空配列、null/undefined、最大長、0、1、桁数など）
4. 互換性（旧命名・旧フィールドが残る場合）

---

## PR 品質基準（テストコード）

* テストは「何を保証しているか」が読める
* 余計な mock をしない
* flaky になり得る要素（時刻、ネットワーク、順序依存）がない
* 可能な限り型安全（`any` を避ける）
* `describe` / `it` の名前は日本語でも良いが、仕様が明確になる表現にする

---

## 出力物ルール（Agent が生成する内容）

Agent はテストコード生成時に以下を必ず満たすこと。

* 追加/修正したファイル一覧を提示する
* 各テストが何を担保するかを短く説明する
* テスト実行コマンド（例: `npm test`）を提示する
* テストが失敗する可能性のある前提（環境依存）があれば明記する

---

## 最小サンプル

```tests/mcp/mappers/someMapper.test.ts
import { describe, it, expect } from "vitest";
import { someMapper } from "@mcp/mappers/someMapper";
describe("mcp/mappers/someMapper", () => {    // ここはファイル名
  describe("someMapper", () => {  // ここは関数名
    it("正しい入力を期待する型へ変換できる", () => {
      // Arrange
      const input = { /* ... */ };

      // Act
      const actual = someMapper(input);

      // Assert
      expect(actual).toEqual({ /* ... */ });
    });
  });
});
```

# 出力形式
ファイル名: xxxx/xxxx.test.ts
テストコード:
```ts
...
```

# 最重要（以下については必ず遵守してください）
- テストコードは最小限であるべきです。
- テストコード内でロジックは書いてはいけません。if 文はもちろんのことテストでのみ使用するclassやtype、interfaceも同様です。

# 対象コード
${input:code}
