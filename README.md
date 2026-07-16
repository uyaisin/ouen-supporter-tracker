# 全国サポーターマップ（サポーター数トラッカー）

都道府県別のサポーター数を集計して見せるトラッカー。既存の「47都道府県 主催・運営マップ」（`ouen-quest-tracker`）とは**別レイヤー**。あっちは主催者・運営、こっちは**サポーター数**。将来的に合体させる可能性あり。

## 見せ方
- **1,000人ゲージ**：全国サポーター数の目標達成バー
- **増えた瞬間**：前回集計から増えた県を「福岡 +3人！」とバナー＆バッジで表示
- **都道府県別タイル**：人数が多いほど色が濃くなる
- サマリーカード：総サポーター / 応援が届いた県数 / 直近の増加

## 仕組み（47トラッカーと同型）
```
シート（報告フォーム回答の「都道府県」列を集計） 
  → Apps Script doGet が { prefs: {都道府県: 人数}, goal:1000 } を返す
  → pull_data.js が取得。前回との差分から「増えた分(delta)」を自動計算
  → build.js が supporter-tracker.html / index.html を生成
  → render_png.js が supporter-tracker.png を書き出し
  → GitHub Pages で公開（Fandy等には <img> で貼る）
```

## いまの状態
- **仕組みとビジュアルは完成**。data.json はサンプル値で動作確認済み。
- **シート連携は未接続**（シートは別の人が作成中）。完成したら:
  1. シート側に doGet を追加し `{ prefs:{都道府県:人数} }` を返すようにデプロイ
  2. `scripts/config.example.json` を `scripts/config.json` にして `dataEndpoint` にexec URLを入れる
  3. `bash scripts/update_and_publish.sh` で通し確認
  4. GitHub Pages公開 & launchd登録（`sheets-launchd-automation` スキル参照）

## コマンド
- ビルド: `node build.js`
- プレビュー画像: `node scripts/render_png.js`
- 全部（取得→生成→画像）: `npm run update`
