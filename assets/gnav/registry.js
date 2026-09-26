/*
 * ============================================================
 *  サイト全体の「目次」（グローバルナビの定義ファイル）
 * ============================================================
 *  新しい比較サイト（クレジットカード・保険など）を追加するときは、
 *  基本的にこのファイルだけを編集します。
 *
 *  ・sections … グローバルナビの大分類＝デパートの「フロア」
 *      本館4フロア（借りる／増やす／支払う／備える）がサイトの価値提案の柱。
 *      floor   … フロア表示（"1F" など）。annex: true は「別館」として柱の後ろに区切って表示
 *      status: "live"  … 公開中（リンクが有効になる）
 *      status: "soon"  … 準備中（ナビに「準備中」として表示・リンクなし）
 *      match   … この分類に属するURLの前方一致（items に無いページの現在地判定用）
 *  ・items    … 各分類の中のページ
 *      id     … ページの識別子（クロスセルの指定に使う）
 *      match  … このページとみなすURLの前方一致パターン（現在地の判定用）
 *  ・crossSell … 「このページを見た人に、別分類のどのページを案内するか」
 *      キーは items の id か sections の id（ページ個別 → 分類 → default の順で探す）
 *      query を付けるとリンク先URLの末尾に付与（例: シミュレーターのローン種類指定）
 *
 *  既存サイト側は <head> に3行（registry.js / gnav.js / gnav.css）を
 *  入れておくだけで、ここでの変更が全ページに自動反映されます。
 * ============================================================
 */
window.MONEY_HUB = {
  brand: {
    name: "お金の総合デパート",
    tagline: "借りる・増やす・支払う・備える。お金のことを、ワンストップで比較検討。",
    href: "/",
  },

  sections: [
    {
      id: "borrow",
      floor: "1F",
      label: "借りる",
      en: "BORROW",
      lede: "住宅・教育・車・カードローンまで、金利と限度額で比較",
      color: "#B93C28",
      status: "live",
      href: "/sme-support-japan/loans/index.html",
      match: ["/sme-support-japan/loans/"],
      groups: [
        {
          title: "住まい",
          items: [
            { id: "borrow.mortgage", label: "住宅ローン", href: "/sme-support-japan/loans/mortgage.html", desc: "変動・固定の金利を横並び比較" },
            { id: "borrow.reform", label: "リフォームローン", href: "/sme-support-japan/loans/reform-loan.html" },
            { id: "borrow.real-estate", label: "不動産担保ローン", href: "/sme-support-japan/loans/real-estate-loan.html" },
            { id: "borrow.investment-property", label: "投資不動産ローン", href: "/sme-support-japan/loans/investment-property-loan.html" },
          ],
        },
        {
          title: "暮らし・家族",
          items: [
            { id: "borrow.education", label: "教育ローン", href: "/sme-support-japan/loans/education-loan.html" },
            { id: "borrow.auto", label: "自動車ローン", href: "/sme-support-japan/loans/auto-loan.html" },
            { id: "borrow.card", label: "カードローン", href: "/sme-support-japan/loans/card-loan.html" },
            { id: "borrow.purpose", label: "目的型ローン", href: "/sme-support-japan/loans/purpose-loan.html" },
            { id: "borrow.other", label: "その他ローン", href: "/sme-support-japan/loans/other-loan.html" },
          ],
        },
        {
          title: "資産を活かす",
          items: [
            { id: "borrow.securities", label: "証券担保ローン", href: "/sme-support-japan/loans/securities-loan.html", desc: "保有株・投信を売らずに資金化" },
            { id: "borrow.all", label: "ローン総合台帳（全分類）", href: "/sme-support-japan/loans/index.html", match: ["/sme-support-japan/loans/index.html", "/sme-support-japan/loans/$"] },
          ],
        },
      ],
    },
    {
      id: "invest",
      floor: "2F",
      label: "増やす",
      en: "GROW",
      lede: "NISA対象の投資信託を、コストとリターンで比較",
      color: "#1E6B41",
      status: "live",
      href: "/nisa-fund-compare/index.html",
      match: ["/nisa-fund-compare/"],
      groups: [
        {
          title: "NISA・投資信託",
          items: [
            { id: "invest.nisa-search", label: "NISA投信を絞り込み検索", href: "/nisa-fund-compare/index.html", match: ["/nisa-fund-compare/index.html", "/nisa-fund-compare/$"], desc: "信託報酬・1年/3年リターンで絞り込み" },
            { id: "invest.nisa-list", label: "NISA対象ファンド全一覧", href: "/nisa-fund-compare/list/page-1.html", match: ["/nisa-fund-compare/list/"] },
            { id: "invest.nisa-fund", label: "ファンド詳細", href: null, match: ["/nisa-fund-compare/funds/"], hidden: true },
            { id: "invest.nisa-guide", label: "NISAまるわかりガイド", href: "/nisa-fund-compare/index.html#nisa-guide", match: [] },
          ],
        },
        {
          title: "これから追加予定",
          items: [
            { id: "invest.ideco", label: "iDeCo 比較", status: "soon" },
            { id: "invest.brokers", label: "ネット証券 比較", status: "soon" },
          ],
        },
      ],
    },
    {
      id: "pay",
      floor: "3F",
      label: "支払う",
      en: "PAY",
      lede: "クレジットカードを、ポイント還元率・年会費で比較",
      color: "#8A6A22",
      status: "soon",
      groups: [{ title: "キャッシュレス", items: [
        { id: "pay.card", label: "クレジットカード比較", status: "soon" },
        { id: "pay.debit", label: "デビット・プリペイド比較", status: "soon" },
      ] }],
    },
    {
      id: "protect",
      floor: "4F",
      label: "備える",
      en: "PROTECT",
      lede: "生命保険・医療保険などを、保障内容と保険料で比較",
      color: "#1E6B6B",
      status: "soon",
      groups: [{ title: "保険", items: [
        { id: "protect.life", label: "生命保険比較", status: "soon" },
        { id: "protect.medical", label: "医療保険比較", status: "soon" },
        { id: "protect.fire", label: "火災保険比較", status: "soon" },
      ] }],
    },
    {
      id: "business",
      label: "事業の資金",
      floor: "別館",
      annex: true,
      en: "BUSINESS",
      lede: "経営者・個人事業主のための、補助金・制度融資・共済の台帳",
      color: "#173250",
      status: "live",
      href: "/sme-support-japan/index.html",
      match: ["/sme-support-japan/"],
      groups: [
        {
          title: "補助金・制度融資",
          items: [
            { id: "business.ledger", label: "補助金台帳（一覧）", href: "/sme-support-japan/index.html", match: ["/sme-support-japan/index.html", "/sme-support-japan/$"] },
            { id: "business.search", label: "補助金を条件で探す", href: "/sme-support-japan/search.html" },
            { id: "business.government", label: "政府系補助金・融資", href: "/sme-support-japan/loans/government.html" },
            { id: "business.about", label: "補助金台帳について", href: "/sme-support-japan/about.html", hidden: true },
          ],
        },
      ],
    },
  ],

  tools: [
    { id: "tool.simulator", label: "返済・積立シミュレーター", short: "試算", href: "/tools/simulator.html", desc: "ローン返済と積立投資を同時に試算" },
  ],

  /* ライフイベント（ポータルTOPで使用）
   * 1つの目的に対して、複数フロア（借りる・増やす・支払う・備える）の売り場を束ねる。
   * 準備中（status: "soon"）のページは「近日オープン」として表示される。 */
  lifeEvents: [
    { title: "家を買う", icon: "house", links: ["borrow.mortgage", "invest.nisa-search", "protect.fire", "tool.simulator"] },
    { title: "子どもの教育費", icon: "school", links: ["borrow.education", "invest.nisa-guide", "protect.life", "tool.simulator"] },
    { title: "車を買う", icon: "car", links: ["borrow.auto", "pay.card", "tool.simulator"] },
    { title: "老後にそなえる", icon: "sprout", links: ["invest.nisa-search", "invest.nisa-guide", "protect.medical"] },
    { title: "毎日の支払いを見直す", icon: "card", links: ["pay.card", "pay.debit", "invest.nisa-search"] },
    { title: "事業をはじめる・広げる", icon: "store", links: ["business.ledger", "business.government", "borrow.all"] },
  ],

  /* 相互送客（ページ下部に「あわせて比較されています」として表示）
   * text は中立的な情報提供の表現にとどめる（特定商品の推奨はしない） */
  crossSell: {
    "borrow.mortgage": [
      { to: "tool.simulator", query: "?type=mortgage", text: "住宅ローンの月々返済と、つみたて投資の積立額をまとめて試算できます。" },
      { to: "invest.nisa-search", text: "住宅購入後の家計づくりに。NISA対象の投資信託をコストで比較。" },
      { to: "borrow.reform", text: "中古購入・住み替えなら、リフォームローンの金利もあわせて確認。" },
    ],
    "borrow.education": [
      { to: "invest.nisa-guide", text: "教育費は「借りる」前に「準備する」選択肢も。NISAの仕組みを解説。" },
      { to: "tool.simulator", query: "?type=education-loan", text: "教育ローンの返済額と、積立で準備した場合の金額を並べて試算。" },
    ],
    "borrow.auto": [
      { to: "tool.simulator", query: "?type=auto-loan", text: "自動車ローンの毎月の返済額と、並行して積み立てた場合の金額を試算。" },
      { to: "invest.nisa-search", text: "車の買い替え資金づくりに。NISA対象の投資信託を比較。" },
    ],
    "borrow.reform": [
      { to: "tool.simulator", query: "?type=reform-loan", text: "リフォームローンの返済額を、金利・期間を変えて試算できます。" },
      { to: "borrow.mortgage", text: "住宅ローンの借り換えと一体で検討するなら、住宅ローンの金利も比較。" },
    ],
    "borrow.securities": [
      { to: "invest.nisa-search", text: "担保となる投資信託の比較はこちら。NISA対象ファンドを一覧で。" },
      { to: "invest.nisa-list", text: "NISA対象ファンドを全件、1年リターン順に一覧できます。" },
    ],
    "borrow.investment-property": [
      { to: "invest.nisa-search", text: "不動産以外の資産形成も比較。NISA対象の投資信託を条件で検索。" },
      { to: "borrow.real-estate", text: "保有不動産を担保にする場合は、不動産担保ローンを比較。" },
    ],
    "borrow.card": [
      { to: "tool.simulator", query: "?type=card-loan", text: "借入額・金利・期間から、毎月の返済額と利息の総額を試算できます。" },
      { to: "borrow.purpose", text: "使いみちが決まっているなら、目的型ローンの金利も比較。" },
    ],
    "borrow": [
      { to: "tool.simulator", text: "返済額と積立額を同じ画面で試算。借りる・増やすのバランスを確認。" },
      { to: "invest.nisa-search", text: "資産形成も同じ物差しで。NISA対象の投資信託を比較。" },
    ],
    "invest": [
      { to: "borrow.mortgage", text: "住宅購入を検討中なら、住宅ローンの金利を金融機関横断で比較。" },
      { to: "borrow.securities", text: "保有する株式・投資信託を売らずに資金化する、証券担保ローン。" },
      { to: "tool.simulator", text: "積立の将来額と、ローン返済額を同時に試算できます。" },
    ],
    "business": [
      { to: "borrow.all", text: "民間金融機関の融資もあわせて。ローン総合台帳で金利を比較。" },
      { to: "invest.nisa-guide", text: "経営者・個人事業主の資産形成に。NISA制度の基本を解説。" },
    ],
    "tool": [
      { to: "borrow.mortgage", text: "試算に使う金利は、実際の住宅ローン金利の比較から。" },
      { to: "invest.nisa-search", text: "積立先の候補を、信託報酬とリターンで絞り込み。" },
    ],
    "default": [
      { to: "borrow.all", text: "住宅・教育・カードローンまで、ローンを金利で比較。" },
      { to: "invest.nisa-search", text: "NISA対象の投資信託を、コストとリターンで比較。" },
    ],
  },

  analytics: { eventPrefix: "hub_" },
};
