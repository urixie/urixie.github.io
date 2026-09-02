#!/usr/bin/env python3
"""Validate content quality and local navigation integrity for production HTML pages."""

from __future__ import annotations

import re
import sys
from collections import Counter
from functools import lru_cache
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
ARTICLES_DIR = ROOT / "articles"
TEMPLATES_DIR = ARTICLES_DIR / "templates"
EXTERNAL_SCHEMES = {"http", "https", "mailto", "tel", "data", "javascript"}


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.in_title = False
        self.title_parts: list[str] = []
        self.description: str | None = None
        self.h1_count = 0
        self.ids: list[str] = []
        self.images_without_alt = 0
        self.links: list[str] = []
        self.images: list[str] = []
        self.headings: list[int] = []

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
        elif tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            level = int(tag[1])
            self.headings.append(level)
            if level == 1:
                self.h1_count += 1
        elif tag == "img":
            if "alt" not in values:
                self.images_without_alt += 1
            src = (values.get("src") or "").strip()
            if src:
                self.images.append(src)
        elif tag == "a":
            href = (values.get("href") or "").strip()
            if href:
                self.links.append(href)

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


@lru_cache(maxsize=None)
def parse_page(path: Path) -> PageParser:
    parser = PageParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser


def resolve_local_reference(source: Path, raw: str) -> tuple[Path | None, str]:
    parsed = urlsplit(raw)
    if parsed.scheme.lower() in EXTERNAL_SCHEMES or parsed.netloc:
        return None, ""

    decoded_path = unquote(parsed.path)
    if decoded_path:
        if decoded_path.startswith("/"):
            target = ROOT / decoded_path.lstrip("/")
        else:
            target = source.parent / decoded_path
    else:
        target = source

    try:
        target = target.resolve()
        target.relative_to(ROOT.resolve())
    except ValueError:
        return target, unquote(parsed.fragment)

    return target, unquote(parsed.fragment)


def validate_local_reference(source: Path, raw: str, kind: str) -> list[str]:
    target, fragment = resolve_local_reference(source, raw)
    if target is None:
        return []

    relative = source.relative_to(ROOT).as_posix()
    try:
        target_relative = target.relative_to(ROOT.resolve()).as_posix()
    except ValueError:
        return [f"{relative}: {kind} 越出仓库根目录: {raw}"]

    errors: list[str] = []
    if not target.exists():
        errors.append(f"{relative}: {kind} 指向不存在的本地资源: {raw} -> {target_relative}")
        return errors

    if fragment:
        if not target.is_file() or target.suffix.lower() not in {".html", ".htm"}:
            errors.append(f"{relative}: {kind} 在非 HTML 目标上使用锚点: {raw}")
        else:
            target_parser = parse_page(target)
            if fragment not in target_parser.ids:
                errors.append(f"{relative}: {kind} 指向不存在的锚点 '#{fragment}': {raw}")

    return errors


def validate_heading_order(path: Path, headings: list[int]) -> list[str]:
    relative = path.relative_to(ROOT).as_posix()
    errors: list[str] = []
    previous: int | None = None
    for level in headings:
        if previous is not None and level > previous + 1:
            errors.append(
                f"{relative}: 标题层级从 h{previous} 跳到 h{level}，应逐级递进"
            )
        previous = level
    return errors


def validate_page(path: Path) -> list[str]:
    parser = parse_page(path)
    relative = path.relative_to(ROOT).as_posix()
    errors: list[str] = []
    source_text = path.read_text(encoding="utf-8")

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

    unresolved_tokens = sorted(set(re.findall(r"\{\{[A-Z][A-Z0-9_]*\}\}", source_text)))
    if unresolved_tokens:
        errors.append(f"{relative}: 存在未替换模板标记: {', '.join(unresolved_tokens)}")

    errors.extend(validate_heading_order(path, parser.headings))

    for href in parser.links:
        errors.extend(validate_local_reference(path, href, "链接"))
    for src in parser.images:
        errors.extend(validate_local_reference(path, src, "图片"))

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

    print(
        f"Content validation passed: {len(pages)} production HTML pages checked for metadata, "
        "headings, ids, images, local links, anchors, and template tokens."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
