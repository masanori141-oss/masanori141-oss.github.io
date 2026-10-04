"""3F 支払う（クレジットカード比較）のページを cards/cards.json から生成する。

  cards/index.html           … 主要カードの比較（一覧表・使い方での試算・カード別の詳細）
  cards/nisa-tsumitate.html  … クレカ積立 × NISA（2F 増やす と 3F 支払う の橋渡し）

検索エンジンにも内容が読めるよう、表や本文はHTMLに直接書き出す。
試算機能（cards/cards.js）はページに埋め込んだJSONを読んで動く。

usage: python tools/build_cards.py
"""
import json
from datetime import date
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "cards" / "cards.json"
OUT_DIR = ROOT / "cards"
SITE = "https://masanori141-oss.github.io"

KIND_LABEL = {"shop": "店舗・ネット", "code": "コード決済", "telecom": "通信", "group": "経済圏"}
KIND_ORDER = ["shop", "code", "telecom", "group"]


def e(s):
    return escape(str(s), quote=True)


def jp_date(iso):
    d = date.fromisoformat(iso)
    return f"{d.year}年{d.month}月{d.day}日"


def tsumitate_points(card, amount, alt=False):
    """月の積立額に対して付与されるポイント（円相当）。cards.js と同じ計算。"""
    t = card["tsumitate"]
    if alt and t.get("altRate"):
        tiers = [{"upTo": t["monthlyLimit"], "rate": t["altRate"]}]
    else:
        tiers = t["tiers"]
    base = (amount // t.get("unit", 1)) * t.get("unit", 1)
    pts, prev = 0.0, 0
    for tier in tiers:
        part = max(0, min(base, tier["upTo"]) - prev)
        pts += part * tier["rate"] / 100
        prev = tier["upTo"]
    if t.get("pointCap"):
        pts = min(pts, t["pointCap"])
    return int(pts)


HEAD = """<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<!-- 自動生成ファイル：cards/cards.json を編集し tools/build_cards.py で再生成してください -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-MVQZEB89RS"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', 'G-MVQZEB89RS');
  gtag('config', 'G-N2JHBP892C');
</script>
<title>{title}</title>
<meta name="description" content="{description}">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="お金の総合デパート">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:url" content="{canonical}">
<meta property="og:locale" content="ja_JP">
<meta name="twitter:card" content="summary">
<script type="application/ld+json">{jsonld}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@700;800&family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/gnav/gnav.css">
<script src="/assets/gnav/registry.js" defer></script>
<script src="/assets/gnav/gnav.js" defer></script>
<link rel="stylesheet" href="/assets/portal.css">
<link rel="stylesheet" href="/cards/cards.css">
</head>
<body>
<div id="mh-gnav"></div>
"""

FOOT = """
<script type="application/json" id="card-data">{data}</script>
<script src="/cards/cards.js" defer></script>
</body>
</html>
"""


def breadcrumb(items):
    return {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": n, "item": u} for i, (n, u) in enumerate(items)
        ],
    }


def card_chip(c):
    return f'<span class="cc-name" style="--cc:{e(c["color"])}"><i aria-hidden="true"></i>{e(c["name"])}</span>'


def feature(c, kind):
    for f in c["features"]:
        if f["kind"] == kind:
            return f
    return None


# ---------------------------------------------------------------- 比較ページ
def build_index(data):
    cards = data["cards"]
    checked = jp_date(data["checkedAt"])
    title = "クレジットカード比較｜三菱UFJ・三井住友（Olive）・dカード・楽天・PayPayの還元率と経済圏 ｜ お金の総合デパート"
    desc = (f"年会費無料の主要クレジットカード5枚（三菱ＵＦＪカード、三井住友カード（NL）／Olive、dカード、楽天カード、PayPayカード）を、"
            f"基本還元率・コンビニ等の優遇・コード決済・通信・経済圏・クレカ積立で比較。各社公式サイトで確認した情報（{checked}時点）。")
    canonical = f"{SITE}/cards/index.html"
    jsonld = json.dumps({
        "@context": "https://schema.org",
        "@graph": [
            breadcrumb([("お金の総合デパート", f"{SITE}/"), ("3F 支払う", canonical), ("クレジットカード比較", canonical)]),
            {"@type": "ItemList", "name": "比較対象のクレジットカード",
             "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": c["name"]} for i, c in enumerate(cards)]},
        ],
    }, ensure_ascii=False)

    head_cells = "".join(f'<th scope="col">{card_chip(c)}<small>{e(c["issuer"])}</small></th>' for c in cards)

    def row(label, cells, cls=""):
        return f'<tr class="{cls}"><th scope="row">{label}</th>{"".join(f"<td>{x}</td>" for x in cells)}</tr>'

    rows = [
        row("年会費", [e(c["annualFee"]) for c in cards]),
        row("国際ブランド", [e("・".join(c["brands"])) for c in cards]),
        row("ポイント", [f'{e(c["point"])}<small>{e(c["pointValue"])}</small>' for c in cards]),
        row("基本還元率", [
            f'<b class="rate">{c["baseRate"]:g}%</b>'
            + (f'<small class="warn">2027年1月利用分から{c["baseRateAfter"]:g}%</small>' if c.get("baseRateAfter") else "")
            + (f'<small>条件達成で最大{c["baseRate"] + c["stepBonus"]:g}%</small>' if c.get("stepBonus") else "")
            for c in cards], "is-key"),
        row("得意な場面", [e(c["headline"]) for c in cards]),
    ]
    for kind in KIND_ORDER:
        rows.append(row(KIND_LABEL[kind], [
            (lambda f: f'<strong>{e(f["title"])}</strong>' if f else "—")(feature(c, kind)) for c in cards]))
    rows.append(row("クレカ積立", [
        f'<strong>{e(c["tsumitate"]["broker"])}</strong><small>{e(c["tsumitate"]["rateText"])}</small>' for c in cards], "is-key"))
    rows.append(row("公式サイト", [
        f'<a href="{e(c["sources"][0]["url"])}" target="_blank" rel="noopener nofollow">{e(c["sources"][0]["label"])} ↗</a>' for c in cards]))

    details = []
    for c in cards:
        feats = "".join(
            f'<li class="f-{e(f["kind"])}"><span class="kind">{e(KIND_LABEL[f["kind"]])}</span><div><strong>{e(f["title"])}</strong><p>{e(f["text"])}</p></div></li>'
            for f in sorted(c["features"], key=lambda f: KIND_ORDER.index(f["kind"])))
        t = c["tsumitate"]
        srcs = "".join(f'<li><a href="{e(s["url"])}" target="_blank" rel="noopener nofollow">{e(s["label"])} ↗</a></li>' for s in c["sources"])
        notice = (f'<p class="notice"><strong>改定予定：</strong>{e(c["notice"])} '
                  f'<a href="{e(c["noticeSource"])}" target="_blank" rel="noopener nofollow">公式のお知らせ ↗</a></p>') if c.get("notice") else ""
        details.append(f"""
<article class="cc-detail" id="card-{e(c['id'])}" style="--cc:{e(c['color'])}">
  <header>
    <h3>{e(c['name'])}</h3>
    <p class="lead">{e(c['headline'])}</p>
    <dl class="specs">
      <div><dt>年会費</dt><dd>{e(c['annualFee'])}</dd></div>
      <div><dt>基本還元率</dt><dd>{e(c['baseRateText'])}</dd></div>
      <div><dt>ポイント</dt><dd>{e(c['point'])}（{e(c['pointValue'])}）</dd></div>
      <div><dt>経済圏</dt><dd>{e(c['economy'])}</dd></div>
    </dl>
  </header>
  {notice}
  <ul class="feats">{feats}</ul>
  <div class="tsumi">
    <span class="chip-2f">2F 増やす と連携</span>
    <strong>クレカ積立：{e(t['broker'])}　{e(t['rateText'])}</strong>
    <p>{e(t['conditions'])}</p>
    <a href="/cards/nisa-tsumitate.html#tsumi-{e(c['id'])}" data-mh-ev="cards_click" data-mh-id="pay.tsumitate">NISAのクレカ積立で比較する →</a>
  </div>
  <details class="src"><summary>情報の出典（公式サイト）</summary><ul>{srcs}</ul></details>
</article>""")

    notices = "".join(
        f'<div class="notice-box"><strong>{e(c["name"])}の改定予定</strong><p>{e(c["notice"])}</p>'
        f'<a href="{e(c["noticeSource"])}" target="_blank" rel="noopener nofollow">公式のお知らせを見る ↗</a></div>'
        for c in cards if c.get("notice"))

    body = f"""
<header class="cc-hero">
  <div class="wrap">
    <div class="eyebrow">3F PAY ｜ クレジットカード比較</div>
    <h1><span class="nb">年会費無料の</span><span class="nb">主要5カードを、</span><br><span class="nb">還元率と「経済圏」で</span><span class="nb">比べる。</span></h1>
    <p class="lede">クレジットカードの差は、基本の還元率よりも「どこで・何と組み合わせて使うか」で大きく開きます。コンビニでのタッチ決済、コード決済、スマホの料金、銀行・証券とのセット。各社の公式サイトで確認した内容を、同じ物差しで並べました。</p>
    <ul class="cc-meta">
      <li>対象：{"・".join(e(c["name"]) for c in cards)}</li>
      <li>公式サイトで確認：{checked}時点</li>
      <li>入会キャンペーンは含みません</li>
    </ul>
    <nav class="cc-jump" aria-label="ページ内メニュー">
      <a href="#compare">一覧で比較</a><a href="#simulate">使い方で試算</a><a href="#details">カード別の詳細</a><a href="/cards/nisa-tsumitate.html" data-mh-ev="cards_click" data-mh-id="pay.tsumitate">クレカ積立×NISA</a>
    </nav>
  </div>
</header>

<main class="wrap">
  {notices}

  <section class="cc-sec" id="compare" aria-labelledby="h-compare">
    <div class="block-head"><span class="eyebrow">COMPARE</span><h2 id="h-compare">一覧で比較</h2>
      <p>表は横にスクロールできます。各項目の詳しい条件は、下の「カード別の詳細」と各社公式サイトでご確認ください。</p></div>
    <div class="cc-table-wrap" tabindex="0" role="region" aria-label="クレジットカード比較表">
      <table class="cc-table">
        <thead><tr><th scope="col" class="corner">比較項目</th>{head_cells}</tr></thead>
        <tbody>{"".join(rows)}</tbody>
      </table>
    </div>
  </section>

  <section class="cc-sec" id="simulate" aria-labelledby="h-sim">
    <div class="block-head"><span class="eyebrow">SIMULATOR</span><h2 id="h-sim">あなたの使い方で、もらえるポイントを試算</h2>
      <p>毎月のカード利用額を入れると、各カードで受け取れるポイント（1ポイント＝1円相当、三菱ＵＦＪカードは1ポイント＝5円相当で換算）の目安を計算します。条件付きの上乗せ（銀行・証券との連携など）は含めず、カードそのものの還元で比べています。</p></div>
    <div class="sim-grid">
      <form class="sim-form" id="sim-form" onsubmit="return false">
        <label>ふだんのカード払い（下記以外）<span class="in"><input type="number" id="s-general" min="0" step="1000" value="50000" inputmode="numeric"><em>円/月</em></span></label>
        <label>セブン‐イレブン・ローソンでの支払い<span class="in"><input type="number" id="s-conv" min="0" step="500" value="10000" inputmode="numeric"><em>円/月</em></span><small>三菱ＵＦＪカードはカード・タッチ決済・Apple Pay（QUICPay）、三井住友カードはスマホのタッチ決済で支払った場合</small></label>
        <label>楽天市場での買い物<span class="in"><input type="number" id="s-rakuten" min="0" step="1000" value="5000" inputmode="numeric"><em>円/月</em></span></label>
        <label>Yahoo!ショッピング・LOHACOでの買い物<span class="in"><input type="number" id="s-yahoo" min="0" step="1000" value="5000" inputmode="numeric"><em>円/月</em></span></label>
        <fieldset>
          <legend>条件</legend>
          <label class="chk"><input type="checkbox" id="s-olive"> 三井住友はOliveフレキシブルペイ（クレジットモード）で支払う</label>
          <label class="chk"><input type="checkbox" id="s-step" checked> PayPayステップの条件（200円以上30回＆10万円以上）を達成</label>
          <label class="chk"><input type="checkbox" id="s-d2027"> dカードを2027年1月以降の改定後の還元率で計算</label>
        </fieldset>
      </form>
      <div class="sim-result" aria-live="polite">
        <div class="sim-total">合計のカード利用額 <b id="s-sum">—</b> /月</div>
        <ol id="sim-bars" class="sim-bars"></ol>
        <p class="sim-note">※ 目安です。端数処理・付与上限・対象外の取引・ポイントの有効期限などにより実際とは異なります。楽天市場・Yahoo!ショッピングの通常ポイントなど、カード以外から付与される分は含みません。</p>
      </div>
    </div>
  </section>

  <section class="cc-sec" id="details" aria-labelledby="h-details">
    <div class="block-head"><span class="eyebrow">DETAILS</span><h2 id="h-details">カード別の詳細</h2>
      <p>「店舗・ネット」「コード決済」「通信」「経済圏」の4つの観点で、公式サイトに記載されている特典をまとめています。</p></div>
    {"".join(details)}
  </section>

  <section class="cc-bridge">
    <div>
      <span class="eyebrow">2F 増やす × 3F 支払う</span>
      <h2>カード選びは、NISAの証券会社選びでもある。</h2>
      <p>5枚とも、提携する証券会社で投資信託をクレジットカードで積み立てると（クレカ積立）ポイントが付きます。NISA口座は1人1口座なので、どのカードを選ぶかは、どこでNISAをするかとつながっています。</p>
    </div>
    <a class="btn btn-ink" href="/cards/nisa-tsumitate.html" data-mh-ev="cards_click" data-mh-id="pay.tsumitate">クレカ積立×NISAで比較する →</a>
  </section>

  <p class="cc-disclaimer">掲載内容は各カード会社・証券会社の公式サイトで{checked}時点に確認したものです。入会キャンペーンや期間限定の特典は含みません。還元率・条件は予告なく変更されることがあります。お申込みの前に必ず各社の公式サイトで最新の情報をご確認ください。本ページは特定のカードの申込みを勧誘・推奨するものではなく、掲載順に優劣の意味はありません。</p>
</main>
"""
    return HEAD.format(title=e(title), description=e(desc), canonical=canonical, jsonld=jsonld) + body + FOOT.format(data=client_data(data))


# ---------------------------------------------------------------- クレカ積立 × NISA
def build_tsumitate(data):
    cards = data["cards"]
    checked = jp_date(data["checkedAt"])
    title = "クレカ積立でNISA｜5大カードのポイント還元と証券会社を比較 ｜ お金の総合デパート"
    desc = (f"NISAのつみたて投資枠をクレジットカード決済で積み立てる「クレカ積立」。三菱ＵＦＪカード、三井住友カード（NL）／Olive、dカード、楽天カード、PayPayカードの"
            f"ポイント還元率と提携証券会社を比較し、月の積立額ごとのポイントを試算。公式サイトで確認した情報（{checked}時点）。")
    canonical = f"{SITE}/cards/nisa-tsumitate.html"
    jsonld = json.dumps({
        "@context": "https://schema.org",
        "@graph": [
            breadcrumb([("お金の総合デパート", f"{SITE}/"), ("3F 支払う", f"{SITE}/cards/index.html"), ("クレカ積立×NISA", canonical)]),
            {"@type": "FAQPage", "mainEntity": [
                {"@type": "Question", "name": "クレカ積立は毎月いくらまでできますか？",
                 "acceptedAnswer": {"@type": "Answer", "text": "本ページで比較している5つのサービスは、いずれも毎月合計10万円が上限です。NISAのつみたて投資枠の年間上限120万円は、月10万円にあたります。"}},
                {"@type": "Question", "name": "NISA口座は複数の証券会社で作れますか？",
                 "acceptedAnswer": {"@type": "Answer", "text": "NISA口座は1人1口座です。クレカ積立はカードと提携する証券会社で行うため、カードを選ぶことはNISA口座を開く証券会社を選ぶことにつながります。"}},
            ]},
        ],
    }, ensure_ascii=False)

    rows = []
    for c in cards:
        t = c["tsumitate"]
        p5, p10 = tsumitate_points(c, 50000), tsumitate_points(c, 100000)
        rows.append(f"""<tr id="tsumi-{e(c['id'])}">
  <th scope="row">{card_chip(c)}</th>
  <td><strong>{e(t['broker'])}</strong></td>
  <td><b class="rate">{e(t['rateText'])}</b></td>
  <td class="num">{p5 * 12:,}<small>円相当/年</small></td>
  <td class="num">{p10 * 12:,}<small>円相当/年</small></td>
  <td class="cond">{e(t['conditions'])} <a href="{e(t['source'])}" target="_blank" rel="noopener nofollow">公式 ↗</a></td>
</tr>""")

    body = f"""
<header class="cc-hero is-bridge">
  <div class="wrap">
    <div class="eyebrow">2F 増やす × 3F 支払う ｜ クレカ積立</div>
    <h1><span class="nb">NISAの積立を、</span><br><span class="nb">クレジットカードで。</span><span class="nb">ポイントも一緒に。</span></h1>
    <p class="lede">証券会社の投資信託の積立代金をクレジットカードで支払う「クレカ積立」なら、積み立てた金額に応じてポイントが付きます。上限は月10万円で、NISAのつみたて投資枠（年120万円）とちょうど同じ。ふだん使うカードと、積み立てる投資信託を、ひとつの流れで選べます。</p>
    <ol class="flow" aria-label="クレカ積立の流れ">
      <li><span>3F 支払う</span><strong>カードを選ぶ</strong><small>ふだんの還元・経済圏</small></li>
      <li><span>提携先</span><strong>証券会社でNISA口座</strong><small>カードごとに決まる</small></li>
      <li><span>2F 増やす</span><strong>投資信託を選んで積立</strong><small>信託報酬・リターンで比較</small></li>
    </ol>
  </div>
</header>

<main class="wrap">
  <section class="cc-sec" aria-labelledby="h-t-compare">
    <div class="block-head"><span class="eyebrow">COMPARE</span><h2 id="h-t-compare">カード別　クレカ積立のポイント還元</h2>
      <p>一般カード（年会費無料のカード）の場合です。年間のポイントは、毎月同じ額を12か月積み立てたときの目安です（{checked}時点、公式サイトで確認）。</p></div>
    <div class="cc-table-wrap" tabindex="0" role="region" aria-label="クレカ積立の比較表">
      <table class="cc-table t-tsumi">
        <thead><tr><th scope="col">カード</th><th scope="col">証券会社</th><th scope="col">還元率</th><th scope="col">月5万円の場合</th><th scope="col">月10万円の場合</th><th scope="col">条件・注意</th></tr></thead>
        <tbody>{"".join(rows)}</tbody>
      </table>
    </div>
  </section>

  <section class="cc-sec" id="simulate" aria-labelledby="h-t-sim">
    <div class="block-head"><span class="eyebrow">SIMULATOR</span><h2 id="h-t-sim">積立額と期間で試算する</h2>
      <p>毎月の積立額に対して受け取れるポイントと、積み立てた投資信託の評価額の目安を並べて計算します。ポイントは再投資しない前提です。</p></div>
    <div class="sim-grid">
      <form class="sim-form" id="tsumi-form" onsubmit="return false">
        <label>毎月の積立額<span class="in"><input type="number" id="t-amount" min="1000" max="100000" step="1000" value="50000" inputmode="numeric"><em>円/月</em></span>
          <input type="range" id="t-range" min="1000" max="100000" step="1000" value="50000" aria-label="毎月の積立額"></label>
        <label>積立期間<span class="in"><input type="number" id="t-years" min="1" max="40" step="1" value="20" inputmode="numeric"><em>年</em></span></label>
        <label>想定利回り（年）<span class="in"><input type="number" id="t-return" min="-5" max="15" step="0.1" value="3" inputmode="decimal"><em>%</em></span><small>仮の値です。将来の運用成果を示すものではありません。</small></label>
        <fieldset><legend>条件</legend>
          <label class="chk"><input type="checkbox" id="t-rakuten-alt"> 楽天証券で代行手数料0.4%以上のファンドを積み立てる（1%）</label>
        </fieldset>
      </form>
      <div class="sim-result" aria-live="polite">
        <div class="sim-total">積立元本 <b id="t-principal">—</b>　評価額の目安 <b id="t-fv">—</b></div>
        <ol id="tsumi-bars" class="sim-bars"></ol>
        <p class="sim-note">※ 期間中に還元率・条件が変わらない前提の単純計算です。三井住友カードは2年目以降に年間10万円以上のカード利用がある前提、PayPayカードは月700ポイントの上限を反映しています。</p>
      </div>
    </div>
  </section>

  <section class="cc-sec" aria-labelledby="h-t-funds">
    <div class="block-head"><span class="eyebrow">FROM 2F</span><h2 id="h-t-funds">積み立てる投資信託を探す</h2>
      <p>2F「増やす」のNISA投信比較から、つみたて投資枠の対象で信託報酬の低い順に並べています（データの単純な並べ替えで、おすすめではありません）。証券会社によって取り扱いの有無が異なります。</p></div>
    <ol class="fund-list" id="fund-list"><li class="loading">読み込み中…</li></ol>
    <a class="btn btn-invest" href="/nisa-fund-compare/index.html" data-mh-ev="cards_click" data-mh-id="invest.nisa-search">NISA投信を条件で絞り込む（2F 増やす） →</a>
  </section>

  <section class="cc-sec qa" aria-labelledby="h-t-qa">
    <div class="block-head"><span class="eyebrow">Q&amp;A</span><h2 id="h-t-qa">クレカ積立の基本</h2></div>
    <details open><summary>毎月いくらまで積み立てられますか？</summary><p>このページで比較している5つのサービスは、いずれも毎月合計10万円が上限です。NISAのつみたて投資枠の年間上限120万円は、月10万円にあたります。</p></details>
    <details><summary>NISA口座は複数の証券会社で作れますか？</summary><p>NISA口座は1人1口座です（年単位で金融機関を変更する手続きはあります）。クレカ積立はカードと提携する証券会社で行うため、カードを選ぶことが、NISA口座を開く証券会社を選ぶことにつながります。</p></details>
    <details><summary>クレカ積立の分は、ふだんのカードのポイントも付きますか？</summary><p>クレカ積立のポイントは、通常のショッピングのポイントとは別のルールで付与されます。たとえばdカード積立では「通常のdカードのご利用でたまる100円につき1ポイントはたまりません」とされています。各社の条件をご確認ください。</p></details>
    <details><summary>ポイントが付くなら、投資信託はどれでも同じですか？</summary><p>ポイントの差は積立額の1%前後ですが、投資信託の信託報酬は保有している資産全体に毎年かかります。積立期間が長いほど、信託報酬の差の影響も大きくなります。2Fの投信比較で、コストとリターンもあわせて確認してください。</p></details>
  </section>

  <section class="cc-bridge">
    <div>
      <span class="eyebrow">3F 支払う</span>
      <h2>ふだんの買い物の還元も、あわせて比較。</h2>
      <p>クレカ積立のポイントだけでなく、コンビニやネット通販、スマホ料金など、毎月の支払い全体でどれだけ還元されるかも確認しましょう。</p>
    </div>
    <a class="btn btn-ink" href="/cards/index.html#simulate" data-mh-ev="cards_click" data-mh-id="pay.card">使い方でカードを試算する →</a>
  </section>

  <p class="cc-disclaimer">掲載内容は各カード会社・証券会社の公式サイトで{checked}時点に確認したもので、入会キャンペーンや期間限定の特典は含みません。投資信託は元本保証のない金融商品で、ポイント還元は投資の損失を補うものではありません。投資判断は目論見書等をご確認のうえご自身で行ってください。本ページは特定のカード・証券会社・投資信託を推奨するものではありません。</p>
</main>
"""
    return HEAD.format(title=e(title), description=e(desc), canonical=canonical, jsonld=jsonld) + body + FOOT.format(data=client_data(data))


def client_data(data):
    """試算スクリプト用に必要な項目だけを埋め込む（</script> 対策でエスケープ）。"""
    slim = [{
        "id": c["id"], "name": c["name"], "color": c["color"],
        "baseRate": c["baseRate"], "baseRateAfter": c.get("baseRateAfter"), "stepBonus": c.get("stepBonus"),
        "rates": c.get("rates", {}), "tsumitate": c["tsumitate"],
    } for c in data["cards"]]
    return json.dumps({"checkedAt": data["checkedAt"], "cards": slim}, ensure_ascii=False).replace("</", "<\\/")


def main():
    data = json.loads(DATA.read_text(encoding="utf-8"))
    (OUT_DIR / "index.html").write_text(build_index(data), encoding="utf-8", newline="\n")
    (OUT_DIR / "nisa-tsumitate.html").write_text(build_tsumitate(data), encoding="utf-8", newline="\n")
    print(f"生成: cards/index.html, cards/nisa-tsumitate.html（{len(data['cards'])}枚・確認日 {data['checkedAt']}）")


if __name__ == "__main__":
    main()
