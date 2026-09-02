#!/usr/bin/env python3
"""Create a canonical article page and register it in the site map."""

from __future__ import annotations

import argparse
import html
import json
import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "articles" / "templates" / "article-template.html"
SITE_MAP = ROOT / "data" / "site-map.json"
GENERATOR = ROOT / "scripts" / "generate_home_data.py"
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def identifier(value: str, label: str) -> str:
    value = value.strip()
    if not ID_RE.fullmatch(value):
        raise ValueError(f"{label} 必须使用小写字母、数字和连字符: {value!r}")
    return value


def parse_tags(raw: str) -> list[str]:
    return [item.strip() for item in raw.split(",") if item.strip()]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create and register a new static article skeleton.")
    parser.add_argument("--topic", required=True, help="一级目录 id，例如 mcu")
    parser.add_argument("--category", required=True, help="二级目录 id，例如 espressif")
    parser.add_argument("--slug", required=True, help="文章 slug，例如 esp-idf-task-scheduling")
    parser.add_argument("--title", required=True, help="文章标题")
    parser.add_argument("--description", required=True, help="文章摘要 / meta description")
    parser.add_argument("--nav-title", help="首页导航标题；默认与文章标题一致")
    parser.add_argument("--nav-description", help="首页导航摘要；默认与文章摘要一致")
    parser.add_argument("--tags", default="", help="逗号分隔的首页标签，例如 ESP-IDF,FreeRTOS")
    parser.add_argument("--meta", default="TECH NOTE", help="文章顶部技术标签文本")
    return parser.parse_args()


def load_manifest() -> list[dict]:
    data = json.loads(SITE_MAP.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError("data/site-map.json 顶层必须是数组")
    return data


def find_category(site_map: list[dict], topic_id: str, category_id: str) -> dict | None:
    for topic in site_map:
        if topic.get("id") != topic_id:
            continue
        for category in topic.get("children", []):
            if category.get("id") == category_id:
                return category
        return None
    return None


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
    nav_title = (args.nav_title or title).strip()
    nav_description = (args.nav_description or description).strip()
    meta = args.meta.strip() or "TECH NOTE"
    tags = parse_tags(args.tags)
    if not title or not description or not nav_title or not nav_description:
        print("Error: title/description and navigation metadata must not be empty.", file=sys.stderr)
        return 2

    target_dir = ROOT / "articles" / topic / category / slug
    target_file = target_dir / f"{slug}.html"
    href = target_file.relative_to(ROOT).as_posix()
    if target_file.exists():
        print(f"Error: article already exists: {href}", file=sys.stderr)
        return 1

    try:
        site_map = load_manifest()
    except (OSError, json.JSONDecodeError, ValueError) as error:
        print(f"Error: unable to load site map: {error}", file=sys.stderr)
        return 1

    category_entry = find_category(site_map, topic, category)
    if category_entry is None:
        print(f"Error: site map category does not exist: {topic}/{category}", file=sys.stderr)
        return 1

    for topic_entry in site_map:
        for category_item in topic_entry.get("children", []):
            for article in category_item.get("articles", []):
                if article.get("href") == href:
                    print(f"Error: site map already contains: {href}", file=sys.stderr)
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

    original_manifest = SITE_MAP.read_text(encoding="utf-8")
    target_dir.mkdir(parents=True, exist_ok=True)
    target_file.write_text(content, encoding="utf-8", newline="\n")
    category_entry.setdefault("articles", []).append(
        {
            "navTitle": nav_title,
            "navDesc": nav_description,
            "href": href,
            "tags": tags,
        }
    )
    SITE_MAP.write_text(
        json.dumps(site_map, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )

    try:
        subprocess.run([sys.executable, str(GENERATOR)], cwd=ROOT, check=True)
    except subprocess.CalledProcessError as error:
        SITE_MAP.write_text(original_manifest, encoding="utf-8", newline="\n")
        target_file.unlink(missing_ok=True)
        try:
            target_dir.rmdir()
        except OSError:
            pass
        print(f"Error: failed to regenerate home-data.js: {error}", file=sys.stderr)
        return 1

    print(f"Created: {href}")
    print(f"Registered: {topic}/{category} -> {nav_title}")
    print("Next steps:")
    print("  1. Fill in the article body.")
    print("  2. Run: python scripts/bump_cache_version_from_git.py")
    print("  3. Run the repository validation scripts before committing.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
