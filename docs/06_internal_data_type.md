# 06. 内部データ型の最小定義（Phase 1-2）

## 目的

既存CSVをアプリ内部で扱うための最小データ型を固定する。本ドキュメントはdocs作成のみを目的とし、TypeScriptファイルはまだ作成しない（`05_csv_inventory.md` の確認結果を踏まえた次段階の定義）。

## 1. Phase 1の内部データ型名

`GQuestion`

## 2. GQuestionの最小フィールド

```
id: string
category: string
difficulty: string
question: string
choices: {
  A: string
  B: string
  C: string
  D: string
}
answer: "A" | "B" | "C" | "D"
explanation: string
sourceFile: string
usedStatus: string
```

## 3. 各フィールドのCSV対応

| GQuestionフィールド | CSV列 |
|---|---|
| id | id |
| category | 分野 |
| difficulty | 難易度 |
| question | 問題 |
| choices.A | A |
| choices.B | B |
| choices.C | C |
| choices.D | D |
| answer | 正解 |
| explanation | 解説 |
| sourceFile | 読み込み元ファイル名 |
| usedStatus | 出題済み（列がない場合は空文字） |

## 4. Phase 1でまだ持たない項目

- term
- search_tags
- trap_point
- memory_story
- wrong_a / wrong_b / wrong_c / wrong_d
- duplicate_group_id
- duplicate_level
- standard_csv_status

**理由**：既存CSVに存在しないため。Phase 1は検索体験の検証が目的であり、標準CSV v1完全対応はまだ行わないため。

## 5. 検索対象フィールド

Phase 1の検索対象は以下とする。

- category
- difficulty
- question
- choices.A
- choices.B
- choices.C
- choices.D
- answer
- explanation

`sourceFile` と `usedStatus` は検索対象に含めない。ただし表示やデバッグには使える。

## 6. answer正規化ルール

- CSV上の正解はA/B/C/Dのみであることが確認済み（`05_csv_inventory.md` 参照）
- 読み込み時はtrimする
- A/B/C/D以外が来た場合は、その行を変換失敗扱いにする
- 勝手に推測補正しない

## 7. choicesの表示ルール

- カード表示ではA〜Dを常に表示する
- 正解選択肢はanswerに基づいて強調表示する予定
- Phase 1では選択肢の正誤理由は持たない

## 8. sourceFileの用途

- 同じidの重複確認
- 表示上の出典確認
- デバッグ
- 将来のインポートログ用

## 9. usedStatusの扱い

- Phase 1では検索・スコアリングに使わない
- 表示するかどうかはUI実装時に判断する
- ファイル5には出題済み列がないため、空文字を許容する

## 10. TypeScript定義案（参考）

docs内に参考として型定義案を記載する。ただし、まだsrcファイルは作成しない。

```typescript
export type AnswerKey = "A" | "B" | "C" | "D";

export type GQuestion = {
  id: string;
  category: string;
  difficulty: string;
  question: string;
  choices: Record<AnswerKey, string>;
  answer: AnswerKey;
  explanation: string;
  sourceFile: string;
  usedStatus: string;
};
```
