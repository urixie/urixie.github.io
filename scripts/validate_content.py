#!/usr/bin/env python3
"""Validate basic content quality for production HTML pages."""

from __future__ import annotations

import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ARTICLES_DIR = ROOT / "articles"
TEMPLATES_DIR = ARTICLES_DIR / "templates"


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.in_title = False
        self.title_parts: list[str] = []
        self.description: str | None = None
        self.h1_count = 0
        self.ids: list[str] = []
        self.images_without_alt = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        tag = tag.lower()

        element_id = values.get("id")
        if element_id:
            self.ids.append(element_id)

        if tag == "title":
            self.in_title = True
        elif tag == "meta" and (values.get("name") or "").lower() == "description":
            self.description = (values.get("content") or "").strip()
        elif tag == "h1":
            self.h1_count += 1
        elif tag == "img" and "alt" not in values:
            self.images_without_alt += 1

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "title":
            self.in_title = False

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)

    @property
    def title(self) -> str:
        return "".join(self.title_parts).strip()


def is_within(path: Path, directory: Path) -> bool:
    try:
        path.relative_to(directory)
    except ValueError:
        return False
    return True


def production_pages() -> list[Path]:
    pages = [ROOT / "index.html"]
    if ARTICLES_DIR.exists():
        pages.extend(
            page
            for page in sorted(ARTICLES_DIR.glob("**/*.html"))
            if not is_within(page, TEMPLATES_DIR)
        )
    return [page for page in pages if page.is_file()]


def validate_page(path: Path) -> list[str]:
    parser = PageParser()
    parser.feed(path.read_text(encoding="utf-8"))
    relative = path.relative_to(ROOT).as_posix()
    errors: list[str] = []

    if not parser.title:
        errors.append(f"{relative}: 缺少非空 <title>")
    if not parser.description:
        errors.append(f"{relative}: 缺少非空 meta description")
    if parser.h1_count != 1:
        errors.append(f"{relative}: 应恰好包含 1 个 <h1>，当前为 {parser.h1_count}")
    if parser.images_without_alt:
        errors.append(f"{relative}: 有 {parser.images_without_alt} 个 <img> 缺少 alt 属性")

    duplicate_ids = sorted(key for key, count in Counter(parser.ids).items() if count > 1)
    if duplicate_ids:
        errors.append(f"{relative}: 存在重复 id: {', '.join(duplicate_ids)}")

    return errors


def main() -> int:
    errors: list[str] = []
    pages = production_pages()
    for page in pages:
        errors.extend(validate_page(page))

    if errors:
        print("Content validation failed:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    print(f"Content validation passed: {len(pages)} production HTML pages checked.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
