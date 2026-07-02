# Phase 1 問題データ管理の方針ドキュメント

本ドキュメントは、問題データの追加・削除・ON/OFFを可能にするための実装前の方針整理である。この時点ではまだ実装を行わない。

## 1. 現状

- `public/data`配下の固定CSV10ファイルを起動時に読み込んでいる
- 合計1000問
- `GQuestion`型に変換してブラウザ上で検索している
- データ追加・削除・ON/OFF機能はまだない

## 2. 今後のゴール

- CSVファイルを追加インポートできる
- 追加した問題セットをON/OFFできる
- 不要な問題セットを削除できる
- 初期1000問は標準データとして残す
- iPadで使いやすいことを優先する

## 3. 推奨構成

- 初期1000問：`public/data`から読み込み（現状維持）
- 追加CSV：ブラウザ内ストレージに保存
- 保存先候補：IndexedDB
- localStorageは大容量CSV保存には向かないため、設定・ON/OFF状態など小さい情報に限定する

## 4. 問題セットの概念

```
ProblemSet {
  id
  name
  sourceType: "built-in" | "imported"
  enabled
  questionCount
  createdAt
}
```

## 5. 問題IDの扱い

- CSV内idだけでは衝突する可能性がある
- 内部的には`problemSetId + originalId`で一意扱いにする案
- 表示上は元idを残してよい

## 6. CSVインポート時の検証

- 必須列チェック
- answerがA/B/C/Dか
- 空欄チェック
- 重複IDチェック
- 出題済み列は任意
- 既存の`loadQuestionsFromCsv`の検証ロジックを活かす

## 7. UI案

- 「データ管理」エリアを追加
  - 標準1000問
  - 追加CSV一覧
  - ON/OFF
  - 削除
  - インポート
  - 件数表示

## 8. 実装順案

- Phase 1-23：データ管理UIの空枠
- Phase 1-24：標準1000問をProblemSetとして表示
- Phase 1-25：追加CSVインポートの検証だけ
- Phase 1-26：IndexedDB保存
- Phase 1-27：ON/OFF切替
- Phase 1-28：削除
- Phase 1-29：エクスポート/バックアップ検討

## 9. 注意点

- 既存検索UIを壊さない
- まず標準1000問の検索体験を維持する
- PWA化とは分けて考える
- ネイティブiPadアプリ化とも分けて考える
- 問題データ管理を先に固める
