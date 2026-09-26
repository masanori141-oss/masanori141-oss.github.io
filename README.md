# お金の総合デパート（ポータル＋共通グローバルナビ）

## 価値提案

**「借りる・増やす・支払う・備える」を、ワンストップで比較検討できるサイト。**

サイトは「デパート」に見立てて構成しています。

| フロア | 売り場 | 状態 |
|---|---|---|
| 1F 借りる | ローン比較（住宅・教育・自動車・カードほか） | 公開中（sme-support-japan/loans） |
| 2F 増やす | NISA投信比較 | 公開中（nisa-fund-compare） |
| 3F 支払う | クレジットカード比較など | 近日オープン |
| 4F 備える | 保険比較 | 近日オープン |
| 別館 事業の資金 | 補助金・制度融資・共済 | 公開中（sme-support-japan） |

フロアをまたぐ回遊は、グローバルナビ・「あわせて比較されています」・ポータルTOPの「目的から探す」の3つの仕組みでつくっています。

## このリポジトリ

`https://masanori141-oss.github.io/` の直下で公開される、GitHubのユーザーサイト用リポジトリです。
各比較サイトは別リポジトリのまま（クローラー・データ生成も各リポジトリで独立）、
**ウェブサイト上だけを統合**するための「玄関（ポータル）」と「共通グローバルナビ」を持ちます。

```
https://masanori141-oss.github.io/                     ← このリポジトリ（ポータルTOP・ツール・共通ナビ）
https://masanori141-oss.github.io/nisa-fund-compare/   ← 増やす：NISA投信比較（別リポジトリ）
https://masanori141-oss.github.io/sme-support-japan/   ← 借りる／事業の資金：ローン比較・補助金台帳（別リポジトリ）
```

同一ドメインなので、どのサイトからも `/assets/gnav/...` で共通ファイルを読み込めます。

## ファイル構成

| パス | 役割 |
|---|---|
| `assets/gnav/registry.js` | **サイト全体の目次**。分類・ページ・相互送客・ライフイベントの定義。新サイト追加時はここを編集 |
| `assets/gnav/gnav.js` | 上の定義からグローバルナビ・相互送客ブロック・共通フッターを描画（通常編集不要） |
| `assets/gnav/gnav.css` | 上記の見た目（`.mh-` 接頭辞で既存サイトのCSSと分離） |
| `index.html` / `assets/portal.*` | ポータルTOP（分類／目的から探す／きょうの比較台帳） |
| `tools/simulator.html` | 返済・積立シミュレーター（借りると増やすの橋渡し） |
| `robots.txt` / `sitemap.xml` | ドメイン直下のrobots.txt（各サイトのサイトマップをまとめて通知） |
| `tools/dev_server.py` | ローカル確認用。3リポジトリを本番と同じURL配置で配信 |

## 各サイト側に入れているタグ（1ページにつき一度だけ）

```html
<head>
  ...
  <link rel="stylesheet" href="/assets/gnav/gnav.css">
  <script src="/assets/gnav/registry.js" defer></script>
  <script src="/assets/gnav/gnav.js" defer></script>
</head>
<body>
<div id="mh-gnav"></div>   <!-- ナビの表示位置（高さを先に確保してガタつきを防ぐ） -->
```

- 相互送客ブロックは既存の `<footer>` の直前に、共通フッターは末尾に自動で追加されます。
  位置を変えたいときは `<div id="mh-cross"></div>` を置いてください。
- 現在地（どの分類・ページか）は URL から自動判定します（`registry.js` の `match`）。
- 自動生成しているページは、生成スクリプト側のテンプレートにも同じタグを入れてあるため、
  毎日の自動更新でも消えません。

## 新しい比較サイト（例：クレジットカード）を追加する手順

1. 新しいリポジトリ（例 `credit-card-compare`）を作り、GitHub Pagesで公開する
   → `https://masanori141-oss.github.io/credit-card-compare/`
2. そのサイトの全ページに上記のタグを入れる
3. `assets/gnav/registry.js` の `pay` 分類を編集：
   ```js
   { id: "pay", label: "支払う", ..., status: "live",            // "soon" → "live"
     href: "/credit-card-compare/index.html",
     match: ["/credit-card-compare/"],
     groups: [{ title: "クレジットカード", items: [
       { id: "pay.card", label: "クレジットカード比較", href: "/credit-card-compare/index.html" },
     ]}] }
   ```
4. 必要に応じて `crossSell`（例：`"pay"` から `"invest"` へ、`"borrow.card"` から `"pay.card"` へ）と
   `lifeEvents` にリンクを追加
5. このリポジトリをpushすると、**既存の全サイトのナビ・フッター・ポータルTOPに一斉反映**されます

保険（`protect`）も同じ手順です。分類そのものを増やす場合は `sections` に1ブロック追加します。

## 計測

GA4が読み込まれているページでは、次のイベントを送信します（`gtag` が無ければ何もしない）。

| イベント | 発生箇所 |
|---|---|
| `hub_gnav_click` | グローバルナビのリンク |
| `hub_cross_click` | 「あわせて比較されています」のカード（相互送客の効果測定） |
| `hub_footer_click` | 共通フッターのリンク |
| `hub_portal_click` / `hub_life_click` / `hub_sim_click` | ポータルTOP・シミュレーター内のリンク |

パラメータ：`link_id`（遷移先のid）、`from_section`、`from_page`。

## ローカル確認

```bash
python tools/dev_server.py 8800
```

`nisa-fund-compare` と `sme-support-japan` をこのリポジトリと同じ階層に置いておくと、
http://localhost:8800/ で3サイトをまとめて確認できます。
