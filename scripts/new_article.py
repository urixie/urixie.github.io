#!/usr/bin/env python3
"""Create a canonical article page from the repository template."""

from __future__ import annotations

import argparse
import html
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "articles" / "templates" / "article-template.html"
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def identifier(value: str, label: str) -> str:
    value = value.strip()
    if not ID_RE.fullmatch(value):
        raise ValueError(f"{label} 必须使用小写字母、数字和连字符: {value!r}")
    return value


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create a new static article skeleton.")
    parser.add_argument("--topic", required=True, help="一级目录 id，例如 mcu")
    parser.add_argument("--category", required=True, help="二级目录 id，例如 espressif")
    parser.add_argument("--slug", required=True, help="文章 slug，例如 esp-idf-task-scheduling")
    parser.add_argument("--title", required=True, help="文章标题")
    parser.add_argument("--description", required=True, help="文章摘要 / meta description")
    parser.add_argument("--meta", default="TECH NOTE", help="文章顶部技术标签文本")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        topic = identifier(args.topic, "topic")
        category = identifier(args.category, "category")
        slug = identifier(args.slug, "slug")
    except ValueError as error:
        print(f"Error: {error}", file=sys.stderr)
        return 2

    if not SLUG_RE.fullmatch(slug):
        print(f"Error: invalid slug: {slug}", file=sys.stderr)
        return 2

    title = args.title.strip()
    description = args.description.strip()
    meta = args.meta.strip() or "TECH NOTE"
    if not title or not description:
        print("Error: title and description must not be empty.", file=sys.stderr)
        return 2

    target_dir = ROOT / "articles" / topic / category / slug
    target_file = target_dir / f"{slug}.html"
    if target_file.exists():
        print(f"Error: article already exists: {target_file.relative_to(ROOT)}", file=sys.stderr)
        return 1

    template = TEMPLATE.read_text(encoding="utf-8")
    replacements = {
        "{{ROOT}}": "../../../../",
        "{{TOPIC}}": topic,
        "{{CATEGORY}}": category,
        "{{TITLE}}": html.escape(title, quote=True),
        "{{DESCRIPTION}}": html.escape(description, quote=True),
        "{{META}}": html.escape(meta, quote=True),
    }
    content = template
    for token, value in replacements.items():
        content = content.replace(token, value)

    unresolved = sorted(set(re.findall(r"\{\{[A-Z_]+\}\}", content)))
    if unresolved:
        print(f"Error: unresolved template tokens: {', '.join(unresolved)}", file=sys.stderr)
        return 1

    target_dir.mkdir(parents=True, exist_ok=True)
    target_file.write_text(content, encoding="utf-8", newline="\n")

    print(f"Created: {target_file.relative_to(ROOT).as_posix()}")
    print("Next steps:")
    print("  1. Fill in the article body.")
    print("  2. Register the article in assets/js/home-data.js.")
    print("  3. Run: python scripts/bump_cache_version_from_git.py")
    print("  4. Run the repository validation scripts before committing.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
