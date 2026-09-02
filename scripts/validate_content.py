#!/usr/bin/env python3
"""Validate content quality and local navigation integrity for production HTML pages."""

from __future__ import annotations

import json
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
SITE_MAP = ROOT / "data" / "site-map.json"
LEGACY_ROUTES = ROOT / "assets" / "js" / "legacy-routes.js"
EXTERNAL_SCHEMES = {"http", "https", "mailto", "tel", "data", "javascript"}
LEGACY_ROUTE_RE = re.compile(r"^\s*['\"]([^'\"]+)['\"]\s*:\s*['\"]([^'\"]+)['\"]\s*,?\s*$", re.MULTILINE)


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.in_title = False
        self.in_h1 = False
        self.in_article_summary = False
        self.title_parts: list[str] = []
        self.h1_parts: list[str] = []
        self.article_summary_parts: list[str] = []
        self.description: str | None = None
        self.h1_count = 0
        self.ids: list[str] = []
        self.images_without_alt = 0
        self.images_without_lazy = 0
        self.images_without_async_decoding = 0
        self.links: list[str] = []
        self.resources: list[tuple[str, str]] = []
        self.headings: list[tuple[int, int]] = []

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
            self.headings.append((level, self.getpos()[0]))
            if level == 1:
                self.h1_count += 1
                self.in_h1 = True
        elif tag == "p":
            classes = set((values.get("class") or "").split())
            if "article-summary" in classes:
                self.in_article_summary = True
        elif tag == "img":
            if "alt" not in values:
                self.images_without_alt += 1
            if (values.get("loading") or "").strip().lower() != "lazy":
                self.images_without_lazy += 1
            if (values.get("decoding") or "").strip().lower() != "async":
                self.images_without_async_decoding += 1
            src = (values.get("src") or "").strip()
            if src:
                self.resources.append(("图片", src))
        elif tag == "a":
            href = (values.get("href") or "").strip()
            if href:
                self.links.append(href)
        elif tag == "link":
            href = (values.get("href") or "").strip()
            if href:
                self.resources.append(("link 资源", href))
        elif tag in {"script", "source", "video", "audio"}:
            src = (values.get("src") or "").strip()
            if src:
                self.resources.append((f"{tag} 资源", src))

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag == "title":
            self.in_title = False
        elif tag == "h1":
            self.in_h1 = False
        elif tag == "p" and self.in_article_summary:
            self.in_article_summary = False

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)
        if self.in_h1:
            self.h1_parts.append(data)
        if self.in_article_summary:
            self.article_summary_parts.append(data)

    @staticmethod
    def normalized_text(parts: list[str]) -> str:
        return re.sub(r"\s+", " ", "".join(parts)).strip()

    @property
    def title(self) -> str:
        return self.normalized_text(self.title_parts)

    @property
    def h1_text(self) -> str:
        return self.normalized_text(self.h1_parts)

    @property
    def article_summary(self) -> str:
        return self.normalized_text(self.article_summary_parts)


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


@lru_cache(maxsize=1)
def valid_home_routes() -> set[str]:
    routes = {"about"}
    if SITE_MAP.is_file():
        site_map = json.loads(SITE_MAP.read_text(encoding="utf-8"))
        for topic in site_map:
            topic_id = str(topic.get("id") or "").strip()
            if not topic_id:
                continue
            routes.add(topic_id)
            for category in topic.get("children") or []:
                category_id = str(category.get("id") or "").strip()
                if not category_id:
                    continue
                category_route = f"{topic_id}/{category_id}"
                routes.add(category_route)
                for article in category.get("articles") or []:
                    href = str(article.get("href") or "")
                    slug = Path(urlsplit(href).path).stem
                    if slug:
                        routes.add(f"{category_route}/{slug}")

    if LEGACY_ROUTES.is_file():
        routes.update(key for key, _target in LEGACY_ROUTE_RE.findall(LEGACY_ROUTES.read_text(encoding="utf-8")))
    return routes


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

    target = target.resolve()
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
        if target == (ROOT / "index.html").resolve():
            if fragment not in valid_home_routes():
                errors.append(f"{relative}: {kind} 指向未知首页路由 '#{fragment}': {raw}")
        elif not target.is_file() or target.suffix.lower() not in {".html", ".htm"}:
            errors.append(f"{relative}: {kind} 在非 HTML 目标上使用锚点: {raw}")
        else:
            target_parser = parse_page(target)
            if fragment not in target_parser.ids:
                errors.append(f"{relative}: {kind} 指向不存在的锚点 '#{fragment}': {raw}")

    return errors


def validate_heading_order(path: Path, headings: list[tuple[int, int]]) -> list[str]:
    relative = path.relative_to(ROOT).as_posix()
    errors: list[str] = []
    previous: tuple[int, int] | None = None
    for level, line in headings:
        if previous is not None and level > previous[0] + 1:
            errors.append(
                f"{relative}:{line}: 标题层级从 h{previous[0]} 跳到 h{level}，应逐级递进"
            )
        previous = (level, line)
    return errors


def validate_article_metadata(path: Path, parser: PageParser) -> list[str]:
    relative = path.relative_to(ROOT).as_posix()
    errors: list[str] = []
    if parser.h1_text:
        expected_title = f"{parser.h1_text} - XYJ"
        if parser.title != expected_title:
            errors.append(
                f"{relative}: <title> 与 H1 不一致，应为 {expected_title!r}，当前为 {parser.title!r}"
            )

    if parser.article_summary:
        if not parser.description:
            errors.append(f"{relative}: article-summary 存在，但 meta description 为空")
        elif parser.article_summary != parser.description:
            errors.append(
                f"{relative}: article-summary 必须与 meta description 完全一致"
            )
    return errors


def validate_page(path: Path) -> list[str]:
    parser = parse_page(path)
    relative = path.relative_to(ROOT).as_posix()
    errors: list[str] = []
    source_text = path.read_text(encoding="utf-8")
    is_article = is_within(path, ARTICLES_DIR) and not is_within(path, TEMPLATES_DIR)

    if not parser.title:
        errors.append(f"{relative}: 缺少非空 <title>")
    if not parser.description:
        errors.append(f"{relative}: 缺少非空 meta description")
    if parser.h1_count != 1:
        errors.append(f"{relative}: 应恰好包含 1 个 <h1>，当前为 {parser.h1_count}")
    if parser.images_without_alt:
        errors.append(f"{relative}: 有 {parser.images_without_alt} 个 <img> 缺少 alt 属性")
    if is_article and parser.images_without_lazy:
        errors.append(f"{relative}: 有 {parser.images_without_lazy} 个文章图片未设置 loading=\"lazy\"")
    if is_article and parser.images_without_async_decoding:
        errors.append(f"{relative}: 有 {parser.images_without_async_decoding} 个文章图片未设置 decoding=\"async\"")
    if is_article:
        errors.extend(validate_article_metadata(path, parser))

    duplicate_ids = sorted(key for key, count in Counter(parser.ids).items() if count > 1)
    if duplicate_ids:
        errors.append(f"{relative}: 存在重复 id: {', '.join(duplicate_ids)}")

    unresolved_tokens = sorted(set(re.findall(r"\{\{[A-Z][A-Z0-9_]*\}\}", source_text)))
    if unresolved_tokens:
        errors.append(f"{relative}: 存在未替换模板标记: {', '.join(unresolved_tokens)}")

    errors.extend(validate_heading_order(path, parser.headings))
    for href in parser.links:
        errors.extend(validate_local_reference(path, href, "链接"))
    for kind, src in parser.resources:
        errors.extend(validate_local_reference(path, src, kind))

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
        f"Content validation passed: {len(pages)} production HTML pages checked for metadata/body consistency, "
        "headings, ids, local links, routes, anchors, assets, article image loading hints, and template tokens."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
