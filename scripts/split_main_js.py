#!/usr/bin/env python3
"""Split home-only logic out of main.js without changing runtime behavior."""

from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MAIN_JS = ROOT / "assets/js/main.js"
HOME_JS = ROOT / "assets/js/home.js"
INDEX = ROOT / "index.html"
VALIDATOR = ROOT / "scripts/validate_site_structure.py"


def split_main() -> None:
    text = MAIN_JS.read_text(encoding="utf-8")
    home_start = text.index("const legacyHomeHashMap = {")
    article_start = text.index("function normalizeHeadingId(index) {")

    meta = text[:home_start].rstrip() + "\n\n"
    home = text[home_start:article_start].rstrip() + "\n"
    article = text[article_start:]

    home, count = re.subn(
        r"const legacyHomeHashMap = \{.*?\n\};\n\n",
        "",
        home,
        count=1,
        flags=re.DOTALL,
    )
    if count != 1:
        raise RuntimeError("failed to remove duplicated legacyHomeHashMap")

    parse_pattern = re.compile(r"function parseHomeHash\(\) \{.*?\n\}\n", re.DOTALL)
    parse_replacement = """function parseHomeHash() {
  const rawHash = decodeURIComponent(window.location.hash.replace(/^#/, '').trim());
  if (!rawHash) return { topicId: 'foundation', categoryId: 'c-basic', articleSlug: '' };

  const canonicalHash = window.resolveLegacyHomeRoute?.(rawHash) || rawHash;
  const [topicId, categoryId, articleSlug] = canonicalHash.split('/').filter(Boolean);
  return { topicId: topicId || 'foundation', categoryId: categoryId || null, articleSlug: articleSlug || '' };
}
"""
    home, count = parse_pattern.subn(parse_replacement, home, count=1)
    if count != 1:
        raise RuntimeError("failed to replace parseHomeHash")

    home = home.rstrip() + "\n\ninitHome();\n"

    main = meta + article
    main = main.replace("\ninitHome();\ninitArticlePage();", "\ninitArticlePage();")
    if "initHome();" in main:
        raise RuntimeError("main.js still contains home bootstrap")
    if "homeState" in main or "renderPrimaryNav" in main:
        raise RuntimeError("main.js still contains home navigation logic")
    if "legacyHomeHashMap" in home:
        raise RuntimeError("home.js still contains duplicated legacy map")

    MAIN_JS.write_text(main, encoding="utf-8")
    HOME_JS.write_text(home, encoding="utf-8")


def update_index() -> None:
    text = INDEX.read_text(encoding="utf-8")
    if "assets/js/home.js" not in text:
        marker = '  <script src="assets/js/main.js?v=20260901-canonical"></script>'
        replacement = marker + '\n  <script src="assets/js/home.js?v=20260901-canonical"></script>'
        if marker not in text:
            raise RuntimeError("main.js script marker not found in index.html")
        text = text.replace(marker, replacement, 1)
    text = text.replace("?v=20260901-canonical", "?v=20260901-modules")
    INDEX.write_text(text, encoding="utf-8")


def update_validator() -> None:
    text = VALIDATOR.read_text(encoding="utf-8")
    old = '        "assets/js/main.js",\n        "assets/js/inline-reader-guard.js",'
    new = '        "assets/js/main.js",\n        "assets/js/home.js",\n        "assets/js/inline-reader-guard.js",'
    if old not in text:
        raise RuntimeError("validator script order marker not found")
    text = text.replace(old, new, 1)

    hook = '''\n    main_js = (ROOT / "assets/js/main.js").read_text(encoding="utf-8")
    home_js = (ROOT / "assets/js/home.js").read_text(encoding="utf-8")
    if "homeState" in main_js or "renderPrimaryNav" in main_js:
        errors.append("javascript layout: main.js must not contain home navigation state/rendering")
    if "window.homeNav" not in home_js or "initHome();" not in home_js:
        errors.append("javascript layout: home.js must own and initialize home navigation")
    if "legacyHomeHashMap" in home_js:
        errors.append("javascript layout: home.js must consume legacy-routes.js instead of duplicating legacy routes")
'''
    anchor = '    if any("article-path-map.js" in script for script in scripts):\n        errors.append("index script: article-path-map.js must not be loaded")\n'
    if hook.strip() not in text:
        if anchor not in text:
            raise RuntimeError("validator index anchor not found")
        text = text.replace(anchor, anchor + hook, 1)

    VALIDATOR.write_text(text, encoding="utf-8")


def main() -> None:
    split_main()
    update_index()
    update_validator()
    print("main.js split complete")


if __name__ == "__main__":
    main()
