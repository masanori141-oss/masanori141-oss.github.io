/* 3F 支払う：カード比較・クレカ積立の試算（データはページに埋め込まれた #card-data） */
(function () {
  "use strict";
  var el = document.getElementById("card-data");
  if (!el) return;
  var DATA = JSON.parse(el.textContent);
  var CARDS = DATA.cards;
  var $ = function (id) { return document.getElementById(id); };
  var num = function (id) { var n = $(id); var v = n ? parseFloat(n.value) : 0; return isFinite(v) && v > 0 ? v : 0; };
  var on = function (id) { var n = $(id); return !!(n && n.checked); };
  var yen = function (v) { return Math.round(v).toLocaleString("ja-JP") + "円"; };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function renderBars(listEl, rows, unit) {
    var max = Math.max.apply(null, rows.map(function (r) { return r.value; }).concat([1]));
    listEl.innerHTML = rows.slice().sort(function (a, b) { return b.value - a.value; }).map(function (r) {
      return '<li style="--cc:' + esc(r.color) + '"><div class="bar-head"><span class="cc-name"><i aria-hidden="true"></i>' + esc(r.name) + "</span><b>" + yen(r.value) + "<small>相当" + unit + "</small></b></div>" +
        '<div class="bar"><span style="width:' + (100 * r.value / max).toFixed(1) + '%"></span></div>' +
        '<p class="bar-note">' + esc(r.note) + "</p></li>";
    }).join("");
  }

  /* ---------------- 使い方での試算（cards/index.html） ---------------- */
  function cardPoints() {
    var g = num("s-general"), conv = num("s-conv"), rk = num("s-rakuten"), yh = num("s-yahoo");
    var total = g + conv + rk + yh;
    $("s-sum").textContent = yen(total);
    var rows = CARDS.map(function (c) {
      var base = c.baseRate;
      if (c.id === "dcard" && on("s-d2027") && c.baseRateAfter) base = c.baseRateAfter;
      if (c.stepBonus && on("s-step")) base += c.stepBonus;
      var pts = 0, notes = [];
      // ふだんの支払い
      pts += g * base / 100;
      // セブン‐イレブン・ローソン
      if (c.rates.seven_lawson) {
        var r = (c.id === "smbc" && on("s-olive") && c.rates.seven_lawson_olive) ? c.rates.seven_lawson_olive : c.rates.seven_lawson;
        var cap = c.rates.seven_lawson_cap || Infinity;
        var boosted = Math.min(conv, cap);
        pts += boosted * r / 100 + (conv - boosted) * base / 100;
        notes.push("コンビニ" + r + "%" + (cap !== Infinity && conv > cap ? "（月" + (cap / 10000) + "万円まで）" : ""));
      } else {
        pts += conv * base / 100;
      }
      // 楽天市場
      if (c.rates.rakuten_ichiba) {
        var bonus = Math.min(rk * (c.rates.rakuten_ichiba - base) / 100, 1000);
        pts += rk * base / 100 + bonus;
        notes.push("楽天市場" + c.rates.rakuten_ichiba + "%");
      } else {
        pts += rk * base / 100;
      }
      // Yahoo!ショッピング
      if (c.rates.yahoo) {
        var yRate = c.rates.yahoo - c.baseRate + base;
        pts += yh * yRate / 100;
        notes.push("Yahoo!ショッピング" + yRate + "%");
      } else {
        pts += yh * base / 100;
      }
      notes.unshift("基本" + base + "%");
      return { name: c.name, color: c.color, value: pts, note: notes.join("・") };
    });
    renderBars($("sim-bars"), rows, "/月");
  }

  /* ---------------- クレカ積立の試算（cards/nisa-tsumitate.html） ---------------- */
  function tsumiPoints(c, amount, alt) {
    var t = c.tsumitate;
    var tiers = (alt && t.altRate) ? [{ upTo: t.monthlyLimit, rate: t.altRate }] : t.tiers;
    var unit = t.unit || 1;
    var base = Math.floor(Math.min(amount, t.monthlyLimit) / unit) * unit;
    var pts = 0, prev = 0;
    tiers.forEach(function (tier) {
      var part = Math.max(0, Math.min(base, tier.upTo) - prev);
      pts += part * tier.rate / 100;
      prev = tier.upTo;
    });
    if (t.pointCap) pts = Math.min(pts, t.pointCap);
    return Math.floor(pts);
  }
  function tsumiSim() {
    var amount = Math.min(num("t-amount"), 100000);
    var years = Math.max(1, Math.round(num("t-years")) || 1);
    var ret = parseFloat($("t-return").value) || 0;
    var m = ret / 100 / 12, n = years * 12, v = 0;
    for (var k = 0; k < n; k++) v = v * (1 + m) + amount;
    $("t-principal").textContent = yen(amount * n);
    $("t-fv").textContent = yen(v);
    var rows = CARDS.map(function (c) {
      var alt = c.id === "rakuten" && on("t-rakuten-alt");
      var month = tsumiPoints(c, amount, alt);
      var eff = amount ? (month / amount * 100) : 0;
      return {
        name: c.name + "（" + c.tsumitate.broker + "）", color: c.color, value: month * 12,
        note: "毎月" + month.toLocaleString("ja-JP") + "円相当（実質" + eff.toFixed(2) + "%）・" + years + "年で" + yen(month * n) + "相当",
      };
    });
    renderBars($("tsumi-bars"), rows, "/年");
  }

  function loadFunds() {
    var list = $("fund-list");
    if (!list) return;
    var s = document.createElement("script");
    s.src = "/nisa-fund-compare/data.js";
    s.onload = function () {
      /* global FUNDS */
      if (typeof FUNDS === "undefined") return;
      var picks = FUNDS.filter(function (f) { return f.nisaTsumitate && typeof f.trustRewardPct === "number"; })
        .sort(function (a, b) { return a.trustRewardPct - b.trustRewardPct || (b.return1yPct || 0) - (a.return1yPct || 0); })
        .slice(0, 5);
      list.innerHTML = picks.map(function (f) {
        var r1 = typeof f.return1yPct === "number" ? (f.return1yPct >= 0 ? "+" : "") + f.return1yPct.toFixed(2) + "%" : "—";
        return '<li><a href="/nisa-fund-compare/funds/' + encodeURIComponent(f.isinCd) + '.html" data-mh-ev="cards_click" data-mh-id="invest.nisa-fund">' +
          '<span class="nm">' + esc(f.name) + "<small>" + esc(f.company) + "</small></span>" +
          '<span class="v"><small>信託報酬</small>' + f.trustRewardPct.toFixed(3) + "%</span>" +
          '<span class="v"><small>1年リターン</small>' + r1 + "</span></a></li>";
      }).join("");
    };
    s.onerror = function () { list.innerHTML = '<li class="loading">データを読み込めませんでした</li>'; };
    document.body.appendChild(s);
  }

  if ($("sim-form")) {
    $("sim-form").addEventListener("input", cardPoints);
    cardPoints();
  }
  if ($("tsumi-form")) {
    var range = $("t-range"), amt = $("t-amount");
    range.addEventListener("input", function () { amt.value = range.value; tsumiSim(); });
    amt.addEventListener("input", function () { range.value = amt.value; });
    $("tsumi-form").addEventListener("input", tsumiSim);
    tsumiSim();
    if ("requestIdleCallback" in window) requestIdleCallback(loadFunds, { timeout: 1500 }); else setTimeout(loadFunds, 300);
  }
})();
