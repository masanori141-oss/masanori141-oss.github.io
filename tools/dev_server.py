"""ローカル確認用サーバー：GitHub Pages上の配置（同一ドメイン）を再現する。
  /                     → このリポジトリ（masanori141-oss.github.io）
  /nisa-fund-compare/   → ../nisa-fund-compare/site
  /sme-support-japan/   → ../sme-support-japan/docs
usage: python tools/dev_server.py [port]
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MOUNTS = {
    "/nisa-fund-compare/": ROOT.parent / "nisa-fund-compare" / "site",
    "/sme-support-japan/": ROOT.parent / "sme-support-japan" / "docs",
}


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        clean = path.split("?", 1)[0].split("#", 1)[0]
        for prefix, base in MOUNTS.items():
            if clean.startswith(prefix):
                return str(base / clean[len(prefix):].lstrip("/"))
        return super().translate_path(path)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8800
    ThreadingHTTPServer(("127.0.0.1", port), partial(Handler, directory=str(ROOT))).serve_forever()
