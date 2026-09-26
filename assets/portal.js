/* ポータルTOP：registry.js の定義から分類カード・ライフイベントを描画し、
 * 各サイトの公開データ（同一ドメイン）から件数とピックアップを表示する。 */
(function () {
  "use strict";
  var HUB = window.MONEY_HUB, API = window.MONEY_HUB_API;
  if (!HUB || !API) return;
  var esc = API.esc, byId = API.byId;

  var ICONS = {
    house: '<path d="M4 16 16 6l12 10M7 14v12h18V14M13 26v-7h6v7"/>',
    school: '<path d="M3 12 16 6l13 6-13 6-13-6ZM8 15v6c0 2 4 4 8 4s8-2 8-4v-6M29 12v7"/>',
    car: '<path d="M5 20v-4l3-6h16l3 6v4M5 20h22v4H5zM9 24v2M23 24v2"/><circle cx="10" cy="20" r="1.3"/><circle cx="22" cy="20" r="1.3"/>',
    sprout: '<path d="M16 27V15M16 15c0-5-4-8-10-8 0 6 4 8 10 8ZM16 18c0-5 4-8 10-8 0 6-4 8-10 8ZM9 27h14"/>',
    coins: '<ellipse cx="13" cy="9" rx="8" ry="3"/><path d="M5 9v5c0 1.7 3.6 3 8 3s8-1.3 8-3V9M5 14v5c0 1.7 3.6 3 8 3M19 17.5c1.5-.5 2-.9 2-1.5"/><ellipse cx="21" cy="20" rx="6" ry="2.4"/><path d="M15 20v4c0 1.3 2.7 2.4 6 2.4s6-1.1 6-2.4v-4"/>',
    card: '<rect x="4" y="8" width="24" height="16" rx="2"/><path d="M4 13h24M8 19h6"/>',
    store: '<path d="M5 12 7 6h18l2 6M5 12h22M5 12c0 2 1.5 3 3.5 3S12 14 12 12c0 2 1.5 3 4 3s4-1 4-3c0 2 1.5 3 3.5 3S27 14 27 12M7 15v11h18V15M13 26v-6h6v6"/>',
  };

  /* フロアガイド（ヒーロー右側。上の階から順に並べる＝館内案内板の見立て） */
  var STAT = { borrow: "st-borrow", invest: "st-invest", business: "st-business" };
  var UNIT = { borrow: "件", invest: "本", business: "件" };
  var floors = HUB.sections.filter(function (s) { return !s.annex; }).slice().reverse()
    .concat(HUB.sections.filter(function (s) { return s.annex; }));
  document.getElementById("directory").innerHTML = floors.map(function (sec) {
    var soon = sec.status === "soon";
    var right = soon ? '<span class="dir-soon">近日オープン</span>'
      : '<span class="dir-num"><b id="' + (STAT[sec.id] || "") + '">—</b>' + (UNIT[sec.id] || "") + "</span>";
    var inner = '<span class="dir-floor">' + esc(sec.floor || "") + '</span><span class="dir-name"><strong>' + esc(sec.label) +
      "</strong><small>" + esc(sec.lede) + "</small></span>" + right;
    return '<li class="' + (soon ? "is-soon" : "") + (sec.annex ? " is-annex" : "") + '" style="--c:' + esc(sec.color) + '">' +
      (soon ? '<div class="dir-row">' + inner + "</div>"
            : '<a class="dir-row" href="' + esc(sec.href) + '" data-mh-ev="portal_click" data-mh-id="' + esc(sec.id) + '">' + inner + "</a>") + "</li>";
  }).join("");

  /* フロアカード */
  document.getElementById("sec-grid").innerHTML = HUB.sections.map(function (sec) {
    var soon = sec.status === "soon";
    var chips = [];
    (sec.groups || []).forEach(function (g) {
      g.items.forEach(function (it) {
        if (it.hidden || it.status === "soon" || !it.href) return;
        chips.push('<li><a href="' + esc(it.href) + '" data-mh-ev="portal_click" data-mh-id="' + esc(it.id) + '">' + esc(it.label) + "</a></li>");
      });
    });
    var soonItems = [];
    (sec.groups || []).forEach(function (g) {
      g.items.forEach(function (it) { if (it.status === "soon") soonItems.push('<li><span>' + esc(it.label) + "</span></li>"); });
    });
    return '<article class="sec-card' + (soon ? " is-soon" : "") + (sec.annex ? " is-annex" : "") + '" style="--c:' + esc(sec.color) + '">' +
      '<span class="en">' + esc((sec.floor || "") + " " + sec.en) + "</span><h3>" + esc(sec.label) + "</h3><p>" + esc(sec.lede) + "</p>" +
      (soon && soonItems.length ? '<ul class="soon-list">' + soonItems.join("") + "</ul>" : "") +
      (chips.length ? "<ul>" + chips.join("") + "</ul>" : "") +
      (soon ? '<span class="soon">このフロアは近日オープン</span>'
            : '<a class="go" href="' + esc(sec.href) + '" data-mh-ev="portal_click" data-mh-id="' + esc(sec.id) + '">「' + esc(sec.label) + "」のフロアへ →</a>") +
      "</article>";
  }).join("");

  /* ライフイベント */
  document.getElementById("life-grid").innerHTML = (HUB.lifeEvents || []).map(function (ev) {
    var links = ev.links.map(function (id) {
      var it = byId[id];
      if (!it) return "";
      var sec = it.section || {};
      var tag = '<span class="chip">' + esc(sec.floor ? sec.floor + " " + sec.label : sec.label) + "</span>";
      if (it.status === "soon" || !it.href) {
        return '<li class="is-soon" style="--c:' + esc(sec.color) + '"><span class="row">' + tag + "<strong>" + esc(it.label) + '</strong><em>近日オープン</em></span></li>';
      }
      return '<li style="--c:' + esc(sec.color) + '"><a href="' + esc(it.href) + '" data-mh-ev="life_click" data-mh-id="' + esc(id) + '">' +
        tag + "<strong>" + esc(it.label) + '</strong><span class="arrow" aria-hidden="true">→</span></a></li>';
    }).join("");
    return '<article class="life"><div class="life-title"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">' +
      (ICONS[ev.icon] || "") + "</svg><h3>" + esc(ev.title) + "</h3></div><ul>" + links + "</ul></article>";
  }).join("");

  function setText(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }
  function fmtRate(v) { return (Math.round(v * 1000) / 1000).toString(); }

  /* ローン：件数と住宅ローン金利ピックアップ */
  fetch("/sme-support-japan/loans/loan-data.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (items) {
      var gov = items.filter(function (i) { return i.loanCategory === "government"; }).length;
      setText("st-borrow", (items.length - gov).toLocaleString("ja-JP"));
      setText("st-business", gov.toLocaleString("ja-JP"));
      var m = items.filter(function (i) { return i.loanCategory === "mortgage" && typeof i.rateMin === "number"; })
        .sort(function (a, b) { return a.rateMin - b.rateMin; }).slice(0, 3);
      document.getElementById("pick-mortgage").innerHTML = m.map(function (i) {
        return '<li><div class="nm"><a href="/sme-support-japan/loans/mortgage.html" data-mh-ev="portal_click" data-mh-id="borrow.mortgage">' + esc(i.productName) +
          "</a><small>" + esc(i.institution) + "</small></div>" +
          '<div class="val"><small>年</small>' + fmtRate(i.rateMin) + "%〜</div></li>";
      }).join("") || '<li class="loading">データがありません</li>';
    })
    .catch(function () {
      document.getElementById("pick-mortgage").innerHTML = '<li class="loading">データを読み込めませんでした</li>';
    });

  /* 投信：data.js は NISA比較ページと同じファイル（読み込めばブラウザにキャッシュされ、遷移後の表示も速くなる） */
  function loadFunds() {
    var s = document.createElement("script");
    s.src = "/nisa-fund-compare/data.js";
    s.onload = function () {
      /* global FUNDS, GENERATED_AT */
      if (typeof FUNDS === "undefined") return;
      setText("st-invest", FUNDS.length.toLocaleString("ja-JP"));
      if (typeof GENERATED_AT !== "undefined") setText("st-updated", "（最終更新 " + GENERATED_AT + "）");
      var picks = FUNDS.filter(function (f) { return f.nisaTsumitate && typeof f.trustRewardPct === "number"; })
        .sort(function (a, b) { return a.trustRewardPct - b.trustRewardPct || (b.return1yPct || 0) - (a.return1yPct || 0); })
        .slice(0, 3);
      document.getElementById("pick-funds").innerHTML = picks.map(function (f) {
        return '<li><div class="nm"><a href="/nisa-fund-compare/funds/' + encodeURIComponent(f.isinCd) + '.html" data-mh-ev="portal_click" data-mh-id="invest.nisa-fund">' + esc(f.name) +
          "</a><small>" + esc(f.company) + "</small></div>" +
          '<div class="val"><small>信託報酬</small>' + f.trustRewardPct.toFixed(3) + "%</div></li>";
      }).join("");
    };
    s.onerror = function () {
      document.getElementById("pick-funds").innerHTML = '<li class="loading">データを読み込めませんでした</li>';
    };
    document.body.appendChild(s);
  }
  if ("requestIdleCallback" in window) requestIdleCallback(loadFunds, { timeout: 1500 }); else setTimeout(loadFunds, 300);
})();
