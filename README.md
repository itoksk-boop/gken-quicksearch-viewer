# G検定クイック検索ビューアー

G検定4択問題をすばやく検索・確認するための、PWA対応ビューアーです。

## 公開URL

https://gken-quicksearch-viewer.itoksk-gken.workers.dev

公開直後は、DNSやTLS証明書の反映に数分かかる場合があります。

## 主な機能

- 標準データ4,150問の検索
- 2文字以上で即時検索
- 複数キーワードのAND検索
- 関連度順の検索結果表示
- 問題タイプ別フィルタ
- CSV追加インポート
- 追加データのIndexedDB保存
- PWA最小対応
- Chrome / iPadホーム画面利用を想定

## データに関する注意

このアプリは、標準データを `public/data` 配下のCSVとして配信します。

そのため、公開URLを知っている人は、アプリ画面だけでなくCSVファイルも取得できます。

追加CSVはブラウザのIndexedDBに保存されます。
追加CSVは端末・ブラウザごとの保存であり、iPadとChrome、または別端末間では自動共有されません。
ブラウザのサイトデータ削除、キャッシュ削除、シークレットモード利用などにより、追加CSVが消える可能性があります。

## ローカル開発

```bash
npm install
npm run dev
npm run build
```

## Cloudflare Workers Static Assets

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- `wrangler.jsonc` の `assets.directory` は `./dist`

## 現在の構成

- React
- Vite
- TypeScript
- PapaParse
- IndexedDB
- Cloudflare Workers Static Assets

## ライセンス

現時点では未設定です。
