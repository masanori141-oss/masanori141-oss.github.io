"""cards/cards.json の各カードの verify（公式サイトのURLと、そこに書かれているはずの文言）を照合する。

還元率や条件が変わると公式サイトの文言も変わるため、文言が見つからなくなったら
「情報の見直しが必要」として一覧を出力する（GitHub Actions では Issue を作成）。

usage: python tools/verify_cards.py [--markdown 出力先.md]
終了コード: 0=差分なし / 1=文言が見つからない項目あり（要見直し）
取得エラー（アクセス制限など）は「未確認」として報告するだけで、差分扱いにはしない。
（GitHub Actions のサーバーからはアクセスを拒否するサイトがあるため）
"""
import json
import re
import ssl
import sys
import time
import unicodedata
import urllib.request
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "cards" / "cards.json"
# 一部のカード会社サイトはブラウザ以外のUAを拒否するため、一般的なブラウザのUAを名乗る（週1回・1秒間隔の照合のみ）
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36"
# 一部サイト（dカード）は古いTLS再ネゴシエーションを要求するため許可する
SSL_CTX = ssl.create_default_context()
SSL_CTX.options |= getattr(ssl, "OP_LEGACY_SERVER_CONNECT", 0x4)


def normalize(s):
    s = unicodedata.normalize("NFKC", s)  # 全角・半角（％/%、（/(）の揺れを吸収
    return re.sub(r"\s+", "", s)


def page_text(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "ja", "Accept": "text/html,application/xhtml+xml"})
    with urllib.request.urlopen(req, timeout=30, context=SSL_CTX) as r:
        raw = r.read()
        charset = r.headers.get_content_charset() or "utf-8"
    html = raw.decode(charset, errors="replace")
    html = re.sub(r"(?is)<(script|style|noscript)[^>]*>.*?</\1>", " ", html)
    return normalize(unescape(re.sub(r"(?s)<[^>]+>", " ", html)))


def main():
    data = json.loads(DATA.read_text(encoding="utf-8"))
    cache, problems, unchecked, checked = {}, [], [], 0
    for card in data["cards"]:
        for v in card.get("verify", []):
            checked += 1
            url = v["url"]
            try:
                if url not in cache:
                    cache[url] = page_text(url)
                    time.sleep(1)
            except Exception as ex:  # noqa: BLE001
                cache[url] = ex
            text = cache[url]
            if isinstance(text, Exception):
                print(f"--  {card['name']} | {v['contains']} | {url} | 未確認（取得エラー: {text}）")
                unchecked.append((card["name"], v["contains"], url, f"取得エラー: {text}"))
            elif normalize(v["contains"]) in text:
                print(f"OK  {card['name']} | {v['contains']} | {url}")
            else:
                print(f"NG  {card['name']} | {v['contains']} | {url} | 文言が見つかりません")
                problems.append((card["name"], v["contains"], url, "文言が見つかりません（内容が変わった可能性）"))

    if "--markdown" in sys.argv:
        out = Path(sys.argv[sys.argv.index("--markdown") + 1])
        lines = [
            f"週次チェックで、3F 支払う（クレジットカード比較）の掲載情報と公式サイトの記載に {len(problems)} 件の差分が見つかりました（掲載情報の確認日: {data['checkedAt']}）。",
            "",
            "| カード | 確認していた文言 | 公式ページ | 状況 |",
            "|---|---|---|---|",
        ]
        lines += [f"| {n} | {c} | {u} | {r} |" for n, c, u, r in problems]
        if unchecked:
            lines += ["", f"このほか {len(unchecked)} 件はアクセス制限等で取得できず未確認です（手元のPCからは確認できる場合があります）："]
            lines += [f"- {n}：{u}" for n, c, u, r in unchecked]
        lines += ["", "公式ページを確認し、必要に応じて `cards/cards.json`（内容・`checkedAt`・`verify`）を更新してください。更新をpushするとページは自動で再生成されます。"]
        out.write_text("\n".join(lines), encoding="utf-8")

    print(f"\n{checked}件中 一致 {checked - len(problems) - len(unchecked)}件 / 差分 {len(problems)}件 / 未確認 {len(unchecked)}件")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
