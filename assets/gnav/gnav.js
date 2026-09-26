/*
 * グローバルナビ・相互送客ブロック・共通フッターを描画するスクリプト。
 * 中身（リンク先・分類）は registry.js で定義する。このファイルは通常編集不要。
 *
 * 各ページ側での読み込み方（<head> 内。defer のため読み込み順どおりに実行される）:
 *   <link rel="stylesheet" href="/assets/gnav/gnav.css">
 *   <script src="/assets/gnav/registry.js" defer></script>
 *   <script src="/assets/gnav/gnav.js" defer></script>
 * さらに <body> 直後に <div id="mh-gnav"></div> を置くと、表示前の高さが確保され
 * ページのガタつき（レイアウトシフト）を防げる。無ければ <body> 先頭に自動挿入する。
 * 相互送客ブロックの位置を指定したい場合は <div id="mh-cross"></div> を置く
 * （無ければ既存の <footer> の直前に自動挿入）。
 */
(function () {
  "use strict";
  var HUB = window.MONEY_HUB;
  if (!HUB) return;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- 索引づくり（id → ページ情報） ---------- */
  var byId = {};
  HUB.sections.forEach(function (sec) {
    byId[sec.id] = { id: sec.id, label: sec.label, href: sec.href, section: sec, status: sec.status };
    (sec.groups || []).forEach(function (g) {
      g.items.forEach(function (it) {
        it.section = sec;
        byId[it.id] = it;
      });
    });
  });
  var toolSection = { id: "tool", label: "ツール", color: "#5B5D5F", status: "live" };
  (HUB.tools || []).forEach(function (t) {
    t.section = toolSection;
    byId[t.id] = t;
  });

  /* ---------- 現在地の判定（最長一致） ---------- */
  function patternsOf(it) {
    if (it.match) return it.match;
    if (!it.href) return [];
    return [it.href.split("#")[0]];
  }
  function hit(path, pat) {
    if (pat.slice(-1) === "$") return path === pat.slice(0, -1);
    return path.indexOf(pat) === 0;
  }
  function detectCurrent() {
    var path = location.pathname;
    var best = null, bestLen = -1;
    Object.keys(byId).forEach(function (id) {
      var it = byId[id];
      if (!it.section || it === byId[it.section.id]) return;
      patternsOf(it).forEach(function (p) {
        if (hit(path, p) && p.length > bestLen) { best = it; bestLen = p.length; }
      });
    });
    if (best) return { item: best, section: best.section };
    // 分類単位のURLプレフィックスで判定（例: /nisa-fund-compare/ 配下の未登録ページ）
    var sec = null; bestLen = -1;
    HUB.sections.forEach(function (s) {
      (s.match || []).forEach(function (p) {
        if (hit(path, p) && p.length > bestLen) { sec = s; bestLen = p.length; }
      });
    });
    return { item: null, section: sec };
  }
  var current = detectCurrent();
  var curSecId = current.section ? current.section.id : (location.pathname === "/" || location.pathname === "/index.html" ? "home" : null);
  var curItemId = current.item ? current.item.id : null;

  /* ---------- 計測（GA4が読み込まれていれば送信） ---------- */
  function track(name, params) {
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", (HUB.analytics && HUB.analytics.eventPrefix || "") + name, params);
      }
    } catch (e) { /* 計測失敗は無視 */ }
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-mh-ev]");
    if (!a) return;
    track(a.getAttribute("data-mh-ev"), {
      link_id: a.getAttribute("data-mh-id") || "",
      from_section: curSecId || "",
      from_page: curItemId || location.pathname,
    });
  });

  /* ---------- グローバルヘッダー ---------- */
  function itemLink(it, ev) {
    if (it.hidden) return "";
    if (it.status === "soon" || !it.href) {
      return '<li><span class="mh-link is-soon">' + esc(it.label) + '<em class="mh-soon">近日オープン</em></span></li>';
    }
    var cur = it.id === curItemId ? ' aria-current="page"' : "";
    return '<li><a class="mh-link" href="' + esc(it.href) + '" data-mh-ev="' + ev + '" data-mh-id="' + esc(it.id) + '"' + cur + ">" +
      esc(it.label) + (it.desc ? '<small>' + esc(it.desc) + "</small>" : "") + "</a></li>";
  }

  function renderHeader() {
    var secs = HUB.sections.map(function (sec) {
      var active = sec.id === curSecId;
      var soon = sec.status === "soon";
      var groups = (sec.groups || []).map(function (g) {
        var lis = g.items.map(function (it) { return itemLink(it, "gnav_click"); }).join("");
        return lis ? '<div class="mh-group"><div class="mh-group-title">' + esc(g.title) + "</div><ul>" + lis + "</ul></div>" : "";
      }).join("");
      var en = (sec.floor ? sec.floor + " " : "") + sec.en;
      var head = soon
        ? '<div class="mh-panel-head"><span class="mh-panel-en">' + esc(en) + '</span><p>' + esc(sec.lede) + '</p><span class="mh-panel-soon">このフロアは近日オープンです</span></div>'
        : '<div class="mh-panel-head"><span class="mh-panel-en">' + esc(en) + '</span><p>' + esc(sec.lede) + '</p>' +
          '<a class="mh-panel-top" href="' + esc(sec.href) + '" data-mh-ev="gnav_click" data-mh-id="' + esc(sec.id) + '">「' + esc(sec.label) + "」のフロアへ →</a></div>";
      return '<div class="mh-sec' + (active ? " is-active" : "") + (soon ? " is-soon" : "") + (sec.annex ? " is-annex" : "") + '" style="--mh-sec:' + esc(sec.color) + '">' +
        '<button type="button" class="mh-sec-btn" aria-expanded="false" aria-controls="mh-panel-' + esc(sec.id) + '">' +
        (sec.floor ? '<span class="mh-floor" aria-hidden="true">' + esc(sec.floor) + "</span>" : "") + esc(sec.label) + (soon ? '<em class="mh-soon">近日</em>' : "") +
        '<svg class="mh-caret" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></button>' +
        '<div class="mh-panel" id="mh-panel-' + esc(sec.id) + '" hidden><div class="mh-panel-inner">' + head +
        '<div class="mh-groups">' + groups + "</div></div></div></div>";
    }).join("");

    var tools = (HUB.tools || []).map(function (t) {
      return '<a class="mh-tool' + (t.id === curItemId ? " is-active" : "") + '" href="' + esc(t.href) + '" data-mh-ev="gnav_click" data-mh-id="' + esc(t.id) + '">' +
        '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2.5" y="1.5" width="11" height="13" rx="1.5" fill="none" stroke="currentColor"/><path d="M5 4.5h6M5 8h1.5M9.5 8H11M5 11h1.5M9.5 11H11" stroke="currentColor"/></svg>' +
        '<span class="mh-l">' + esc(t.label) + '</span><span class="mh-s">' + esc(t.short || t.label) + "</span></a>";
    }).join("");

    return '<header class="mh-gnav" role="banner"><div class="mh-bar">' +
      '<a class="mh-brand" href="' + esc(HUB.brand.href) + '" data-mh-ev="gnav_click" data-mh-id="home"><span class="mh-mark" aria-hidden="true">¥</span>' + esc(HUB.brand.name) + "</a>" +
      '<nav class="mh-sections" aria-label="サイト全体のメニュー">' + secs + "</nav>" +
      '<div class="mh-tools">' + tools + "</div>" +
      "</div></header>";
  }

  function mountHeader() {
    var host = document.getElementById("mh-gnav");
    if (!host) {
      host = document.createElement("div");
      host.id = "mh-gnav";
      document.body.insertBefore(host, document.body.firstChild);
    }
    host.innerHTML = renderHeader();
    host.classList.add("is-ready");

    var secsEls = host.querySelectorAll(".mh-sec");
    function closeAll(except) {
      secsEls.forEach(function (s) {
        if (s === except) return;
        s.classList.remove("is-open");
        s.querySelector(".mh-sec-btn").setAttribute("aria-expanded", "false");
        s.querySelector(".mh-panel").hidden = true;
      });
    }
    function open(s) {
      closeAll(s);
      s.classList.add("is-open");
      s.querySelector(".mh-sec-btn").setAttribute("aria-expanded", "true");
      s.querySelector(".mh-panel").hidden = false;
    }
    var hoverable = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    secsEls.forEach(function (s) {
      var btn = s.querySelector(".mh-sec-btn");
      btn.addEventListener("click", function () {
        if (s.classList.contains("is-open")) closeAll(); else open(s);
      });
      if (hoverable) {
        var t;
        s.addEventListener("mouseenter", function () { clearTimeout(t); t = setTimeout(function () { open(s); }, 120); });
        s.addEventListener("mouseleave", function () { clearTimeout(t); t = setTimeout(function () { if (s.classList.contains("is-open")) closeAll(); }, 220); });
      }
    });
    document.addEventListener("click", function (e) { if (!host.contains(e.target)) closeAll(); });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      var openEl = host.querySelector(".mh-sec.is-open");
      if (openEl) { closeAll(); openEl.querySelector(".mh-sec-btn").focus(); }
    });
  }

  /* ---------- 相互送客ブロック ---------- */
  function crossSellFor() {
    var cs = HUB.crossSell || {};
    return (curItemId && cs[curItemId]) || (curSecId && cs[curSecId]) || (curSecId === "home" ? null : cs["default"]);
  }
  function renderCross(list) {
    var cards = list.map(function (c) {
      var it = byId[c.to];
      if (!it || !it.href || it.status === "soon" || it.id === curItemId) return "";
      var sec = it.section || it;
      return '<a class="mh-card" style="--mh-sec:' + esc(sec.color) + '" href="' + esc(it.href + (c.query || "")) + '" data-mh-ev="cross_click" data-mh-id="' + esc(it.id) + '">' +
        '<span class="mh-chip">' + esc(sec.label) + "</span>" +
        '<strong>' + esc(it.label) + "</strong>" +
        "<span>" + esc(c.text) + "</span>" +
        '<span class="mh-card-go" aria-hidden="true">→</span></a>';
    }).join("");
    if (!cards) return "";
    return '<section class="mh-cross" aria-labelledby="mh-cross-title"><div class="mh-cross-inner">' +
      '<div class="mh-cross-head"><span class="mh-eyebrow">' + esc(HUB.brand.name) + '</span><h2 id="mh-cross-title">あわせて比較されています</h2></div>' +
      '<div class="mh-cards">' + cards + "</div></div></section>";
  }
  function hostFooter() {
    var kids = document.body.children;
    for (var i = kids.length - 1; i >= 0; i--) {
      if (kids[i].tagName === "FOOTER" && !kids[i].classList.contains("mh-footer")) return kids[i];
    }
    return null;
  }
  function mountCross() {
    var list = crossSellFor();
    if (!list) return;
    var html = renderCross(list);
    if (!html) return;
    var slot = document.getElementById("mh-cross");
    if (slot) { slot.innerHTML = html; return; }
    var wrap = document.createElement("div");
    wrap.id = "mh-cross";
    wrap.innerHTML = html;
    var f = hostFooter();
    if (f) f.parentNode.insertBefore(wrap, f); else document.body.appendChild(wrap);
  }

  /* ---------- 共通フッター（サイトマップ） ---------- */
  function mountFooter() {
    if (document.querySelector(".mh-footer")) return;
    var cols = HUB.sections.map(function (sec) {
      var lis = [];
      (sec.groups || []).forEach(function (g) {
        g.items.forEach(function (it) {
          if (it.hidden) return;
          lis.push(it.status === "soon" || !it.href
            ? '<li class="is-soon">' + esc(it.label) + "（近日オープン）</li>"
            : '<li><a href="' + esc(it.href) + '" data-mh-ev="footer_click" data-mh-id="' + esc(it.id) + '">' + esc(it.label) + "</a></li>");
        });
      });
      return '<div class="mh-fcol" style="--mh-sec:' + esc(sec.color) + '"><div class="mh-ftitle">' + (sec.floor ? '<span class="mh-ffloor">' + esc(sec.floor) + "</span>" : "") + esc(sec.label) + "</div><ul>" + lis.join("") + "</ul></div>";
    }).join("");
    var tools = (HUB.tools || []).map(function (t) {
      return '<li><a href="' + esc(t.href) + '" data-mh-ev="footer_click" data-mh-id="' + esc(t.id) + '">' + esc(t.label) + "</a></li>";
    }).join("");
    cols += '<div class="mh-fcol" style="--mh-sec:#5B5D5F"><div class="mh-ftitle">ツール</div><ul>' + tools + "</ul></div>";

    var f = document.createElement("footer");
    f.className = "mh-footer";
    f.innerHTML = '<div class="mh-footer-inner">' +
      '<a class="mh-brand" href="' + esc(HUB.brand.href) + '"><span class="mh-mark" aria-hidden="true">¥</span>' + esc(HUB.brand.name) + "</a>" +
      '<p class="mh-ftag">' + esc(HUB.brand.tagline) + "</p>" +
      '<div class="mh-fcols">' + cols + "</div>" +
      '<p class="mh-fnote">当サイトは、公的機関・各金融機関の公開情報をもとに自動収集・整理した非公式の比較情報サイトです。特定の金融商品・金融機関を推奨・勧誘するものではありません。お申込み・投資判断の前に、必ず各社の公式サイト・目論見書等で最新の条件をご確認ください。</p>' +
      "</div>";
    document.body.appendChild(f);
  }

  function init() {
    mountHeader();
    mountCross();
    mountFooter();
    document.documentElement.setAttribute("data-mh-section", curSecId || "");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  // ポータル側のページ（TOP等）から索引を再利用できるように公開
  window.MONEY_HUB_API = { byId: byId, current: current, track: track, esc: esc };
})();
