#!/usr/bin/env python3
"""Validate article catalog consistency, automatic TOC shells, and local article assets."""

from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ARTICLES = ROOT / "articles"
MANIFEST = ROOT / "data" / "site-map.json"
TEXT_SUFFIXES = {".html", ".htm", ".md", ".py", ".js", ".css", ".txt", ".json", ".yml", ".yaml"}
KNOWN_BAD_TEXT = {
    "职责单1": "职责单一",
}


class ArticleParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.in_h1 = False
        self.h1_parts: list[str] = []
        self.description = ""
        self.has_sidebar = False
        self.has_auto_toc = False
        self.has_main_script = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        tag = tag.lower()
        classes = set((values.get("class") or "").split())
        if tag == "h1":
            self.in_h1 = True
        elif tag == "meta" and (values.get("name") or "").lower() == "description":
            self.description = re.sub(r"\s+", " ", values.get("content") or "").strip()
        elif tag == "aside" and "article-sidebar" in classes:
            self.has_sidebar = True
        elif tag == "nav" and values.get("id") == "articleToc" and "data-auto-toc" in values:
            self.has_auto_toc = True
        elif tag == "script":
            src = values.get("src") or ""
            if src.split("?", 1)[0].endswith("assets/js/main.js"):
                self.has_main_script = True

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "h1":
            self.in_h1 = False

    def handle_data(self, data: str) -> None:
        if self.in_h1:
            self.h1_parts.append(data)

    @property
    def h1(self) -> str:
        return re.sub(r"\s+", " ", "".join(self.h1_parts)).strip()


def load_manifest_articles() -> list[tuple[str, str, str]]:
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    result: list[tuple[str, str, str]] = []
    for topic in data:
        for category in topic.get("children", []):
            for article in category.get("articles", []):
                result.append((str(article["href"]), str(topic["id"]), str(category["id"])))
    return result


def parse_article(path: Path) -> ArticleParser:
    parser = ArticleParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser


def article_text_corpus(article_dir: Path) -> str:
    chunks: list[str] = []
    for source in article_dir.rglob("*"):
        if not source.is_file() or source.suffix.lower() not in TEXT_SUFFIXES:
            continue
        if any(part.startswith(".") for part in source.relative_to(article_dir).parts):
            continue
        try:
            chunks.append(source.read_text(encoding="utf-8"))
        except UnicodeDecodeError:
            continue
    return "\n".join(chunks)


def validate_local_assets(article_path: Path) -> list[str]:
    errors: list[str] = []
    article_dir = article_path.parent
    corpus = article_text_corpus(article_dir)
    for folder_name in ("images", "docs"):
        folder = article_dir / folder_name
        if not folder.is_dir():
            continue
        for asset in sorted(folder.rglob("*")):
            if not asset.is_file() or asset.name.startswith("."):
                continue
            relative = asset.relative_to(article_dir).as_posix()
            if relative not in corpus:
                errors.append(
                    f"{article_path.relative_to(ROOT).as_posix()}: 未引用的文章资源: {relative}"
                )
    return errors


def main() -> int:
    errors: list[str] = []
    title_paths: dict[str, list[str]] = defaultdict(list)
    description_paths: dict[str, list[str]] = defaultdict(list)
    articles = load_manifest_articles()

    for href, topic_id, category_id in articles:
        path = ROOT / href
        relative = path.relative_to(ROOT).as_posix()
        if not path.is_file():
            errors.append(f"站点清单文章不存在: {href}")
            continue

        source_text = path.read_text(encoding="utf-8")
        parser = parse_article(path)
        if not parser.has_sidebar:
            errors.append(f"{relative}: 缺少统一 article-sidebar")
        if not parser.has_auto_toc:
            errors.append(f"{relative}: 缺少 #articleToc[data-auto-toc]")
        if not parser.has_main_script:
            errors.append(f"{relative}: 未加载 assets/js/main.js，自动目录不会初始化")
        if parser.h1:
            title_paths[parser.h1].append(relative)
        if parser.description:
            description_paths[parser.description].append(relative)

        for bad_text, replacement in KNOWN_BAD_TEXT.items():
            if bad_text in source_text:
                errors.append(f"{relative}: 发现已知错误文本 {bad_text!r}，应为 {replacement!r}")

        expected_parts = ("articles", topic_id, category_id)
        actual_parts = path.relative_to(ROOT).parts[:3]
        if actual_parts != expected_parts:
            errors.append(
                f"{relative}: 文件目录与 site-map 分类不一致，期望 {'/'.join(expected_parts)}"
            )

        errors.extend(validate_local_assets(path))

    for title, paths in sorted(title_paths.items()):
        if len(paths) > 1:
            errors.append(f"重复文章 H1 {title!r}: {', '.join(paths)}")
    for description, paths in sorted(description_paths.items()):
        if len(paths) > 1:
            errors.append(f"重复 meta description: {', '.join(paths)}")

    if errors:
        print("Article catalog validation failed:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    print(
        f"Article catalog validation passed: {len(articles)} registered articles have unified automatic TOC shells, "
        "unique metadata, consistent catalog paths, no known typo regressions, and no unreferenced images/docs assets."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
