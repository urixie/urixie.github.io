#!/usr/bin/env python3
"""Migrate registered legacy articles to the unified automatic TOC shell."""

from __future__ import annotations

import json
import os
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data" / "site-map.json"
MAIN_OPEN_RE = re.compile(r'(<main\s+class=["\']article-page-shell["\']\s*>)', re.IGNORECASE)
SIDEBAR_RE = re.compile(r'<aside\s+class=["\']article-sidebar["\'][^>]*>.*?</aside>\s*', re.IGNORECASE | re.DOTALL)
NAV_RE = re.compile(r'<nav\s+class=["\']article-nav["\'][^>]*>.*?</nav>', re.IGNORECASE | re.DOTALL)


def root_prefix(article_dir: Path) -> str:
    relative = Path(os.path.relpath(ROOT, article_dir)).as_posix()
    return "./" if relative == "." else f"{relative}/"


def render_sidebar(article_dir: Path, topic_id: str, category_id: str) -> str:
    root = root_prefix(article_dir)
    return (
        '    <aside class="article-sidebar" aria-label="文章导航">\n'
        '      <div class="article-nav-card">\n'
        '        <div class="article-nav-actions">\n'
        f'          <a href="{root}index.html">← 返回首页</a>\n'
        f'          <a href="{root}index.html#{topic_id}/{category_id}">返回对应专题</a>\n'
        '        </div>\n'
        '        <div class="article-nav-title">文章目录</div>\n'
        '        <nav id="articleToc" class="article-nav" data-auto-toc aria-label="文章目录"></nav>\n'
        '      </div>\n'
        '    </aside>\n\n'
    )


def migrate_page(path: Path, topic_id: str, category_id: str) -> bool:
    text = path.read_text(encoding="utf-8")
    if 'id="articleToc"' in text and "data-auto-toc" in text and 'class="article-sidebar"' in text:
        return False

    sidebar = render_sidebar(path.parent, topic_id, category_id)
    if 'class="article-sidebar"' in text:
        updated, count = SIDEBAR_RE.subn(sidebar, text, count=1)
        if count != 1:
            raise RuntimeError(f"unable to replace existing article sidebar: {path.relative_to(ROOT)}")
    else:
        updated, count = MAIN_OPEN_RE.subn(lambda match: f"{match.group(1)}\n{sidebar}", text, count=1)
        if count != 1:
            raise RuntimeError(f"missing article-page-shell main element: {path.relative_to(ROOT)}")

    # Defensive cleanup for unusual legacy sidebars where a manual nav survived outside the replaced aside.
    if 'id="articleToc"' not in updated:
        updated, count = NAV_RE.subn(
            '<nav id="articleToc" class="article-nav" data-auto-toc aria-label="文章目录"></nav>',
            updated,
            count=1,
        )
        if count != 1:
            raise RuntimeError(f"unable to install automatic TOC nav: {path.relative_to(ROOT)}")

    path.write_text(updated, encoding="utf-8", newline="\n")
    return True


def main() -> int:
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    changed: list[str] = []
    for topic in data:
        topic_id = str(topic["id"])
        for category in topic.get("children", []):
            category_id = str(category["id"])
            for article in category.get("articles", []):
                path = ROOT / str(article["href"])
                if migrate_page(path, topic_id, category_id):
                    changed.append(path.relative_to(ROOT).as_posix())

    if changed:
        print(f"Migrated {len(changed)} article(s) to automatic TOC shells:")
        for path in changed:
            print(f"  {path}")
    else:
        print("All registered articles already use automatic TOC shells.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
