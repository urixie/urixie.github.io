#!/usr/bin/env python3
"""Create a new article page and register it in the canonical site map.

Typical usage::

    python scripts/new_article.py \
      --topic mcu --category espressif --slug esp32-s3-gpio-notes \
      --title "ESP32-S3 GPIO 开发笔记" \
      --description "整理 ESP32-S3 GPIO 配置、中断与常见排错方法。" \
      --tags ESP32-S3 GPIO

The command creates ``articles/<topic>/<category>/<slug>/<slug>.html``, creates
``images/`` and ``docs/`` directories locally, appends the article to
``data/site-map.json``, regenerates ``assets/js/home-data.js`` and finally
synchronizes cache-buster versions and validates the result.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data" / "site-map.json"
TEMPLATE = ROOT / "articles" / "templates" / "article-template.html"
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
TOKEN_RE = re.compile(r"\{\{([A-Z][A-Z0-9_]*)\}\}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create and register a new static article.")
    parser.add_argument("--topic", required=True, help="topic id from data/site-map.json")
    parser.add_argument("--category", required=True, help="category id under the selected topic")
    parser.add_argument("--slug", required=True, help="lowercase kebab-case article slug")
    parser.add_argument("--title", required=True, help="article H1 title")
    parser.add_argument("--description", required=True, help="meta description and lead summary")
    parser.add_argument("--nav-title", help="homepage navigation title; defaults to --title")
    parser.add_argument("--nav-desc", help="homepage navigation description; defaults to --description")
    parser.add_argument("--meta", help="post-meta text; defaults to '<topic> · <category>'")
    parser.add_argument("--tags", nargs="*", default=[], help="zero or more article tags")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="validate inputs and render the page in memory without modifying the repository",
    )
    return parser.parse_args()


def require_text(value: str, label: str) -> str:
    value = value.strip()
    if not value:
        raise ValueError(f"{label} must not be empty")
    return value


def load_manifest() -> list[dict]:
    try:
        value = json.loads(MANIFEST.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise ValueError(f"unable to read site map: {error}") from error
    if not isinstance(value, list):
        raise ValueError("data/site-map.json must contain a top-level array")
    return value


def find_topic_category(site_map: list[dict], topic_id: str, category_id: str) -> tuple[dict, dict]:
    topic = next((item for item in site_map if item.get("id") == topic_id), None)
    if topic is None:
        raise ValueError(f"unknown topic id: {topic_id}")
    category = next(
        (item for item in topic.get("children", []) if item.get("id") == category_id),
        None,
    )
    if category is None:
        raise ValueError(f"unknown category id under {topic_id}: {category_id}")
    return topic, category


def destination_for(topic_id: str, category_id: str, slug: str) -> tuple[Path, Path]:
    article_dir = ROOT / "articles" / topic_id / category_id / slug
    return article_dir, article_dir / f"{slug}.html"


def root_prefix(article_dir: Path) -> str:
    relative = Path(os.path.relpath(ROOT, article_dir)).as_posix()
    return "./" if relative == "." else f"{relative}/"


def render_template(replacements: dict[str, str]) -> str:
    source = TEMPLATE.read_text(encoding="utf-8")
    rendered = TOKEN_RE.sub(lambda match: replacements.get(match.group(1), match.group(0)), source)
    unresolved = sorted(set(TOKEN_RE.findall(rendered)))
    if unresolved:
        raise ValueError(f"article template contains unresolved tokens: {', '.join(unresolved)}")
    return rendered


def run_repo_script(script_name: str, *args: str) -> None:
    command = [sys.executable, str(ROOT / "scripts" / script_name), *args]
    subprocess.run(command, cwd=ROOT, check=True)


def main() -> int:
    args = parse_args()
    try:
        topic_id = require_text(args.topic, "topic")
        category_id = require_text(args.category, "category")
        slug = require_text(args.slug, "slug")
        title = require_text(args.title, "title")
        description = require_text(args.description, "description")
        if not SLUG_RE.fullmatch(slug):
            raise ValueError("slug must use lowercase kebab-case: [a-z0-9]+(-[a-z0-9]+)*")

        tags = [require_text(tag, "tag") for tag in args.tags]
        if len(tags) != len(set(tags)):
            raise ValueError("tags must not contain duplicates")

        site_map = load_manifest()
        topic, category = find_topic_category(site_map, topic_id, category_id)
        article_dir, article_file = destination_for(topic_id, category_id, slug)
        href = article_file.relative_to(ROOT).as_posix()

        for current_topic in site_map:
            for current_category in current_topic.get("children", []):
                for article in current_category.get("articles", []):
                    if article.get("href") == href:
                        raise ValueError(f"article is already registered: {href}")
        if article_file.exists():
            raise ValueError(f"article file already exists: {href}")

        replacements = {
            "ROOT": root_prefix(article_dir),
            "TOPIC": html.escape(topic_id, quote=True),
            "CATEGORY": html.escape(category_id, quote=True),
            "TITLE": html.escape(title),
            "DESCRIPTION": html.escape(description, quote=True),
            "META": html.escape(
                require_text(args.meta, "meta")
                if args.meta
                else f"{topic.get('title', topic_id)} · {category.get('title', category_id)}"
            ),
        }
        rendered = render_template(replacements)

        nav_title = require_text(args.nav_title, "nav-title") if args.nav_title else title
        nav_desc = require_text(args.nav_desc, "nav-desc") if args.nav_desc else description
        article_entry = {
            "navTitle": nav_title,
            "navDesc": nav_desc,
            "href": href,
            "tags": tags,
        }

        print(f"Article path : {href}")
        print(f"Home route   : #{topic_id}/{category_id}/{slug}")
        print(f"Category     : {topic.get('title', topic_id)} / {category.get('title', category_id)}")
        print(f"Tags         : {', '.join(tags) if tags else '(none)'}")

        if args.dry_run:
            if '<nav id="articleToc"' not in rendered or 'class="article-summary"' not in rendered:
                raise ValueError("rendered template is missing automatic TOC or summary markers")
            print("Dry run passed; no files were modified.")
            return 0

        article_dir.mkdir(parents=True, exist_ok=False)
        (article_dir / "images").mkdir()
        (article_dir / "docs").mkdir()
        article_file.write_text(rendered, encoding="utf-8", newline="\n")

        category.setdefault("articles", []).append(article_entry)
        MANIFEST.write_text(
            json.dumps(site_map, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
            newline="\n",
        )

        try:
            run_repo_script("generate_home_data.py")
            run_repo_script("bump_cache_version_from_git.py")
            run_repo_script("validate_content.py")
        except (subprocess.CalledProcessError, OSError) as error:
            print(
                "Article files were created, but a follow-up generator/validator failed. "
                "Review the working tree before committing.",
                file=sys.stderr,
            )
            return error.returncode if isinstance(error, subprocess.CalledProcessError) else 1

        print("Article scaffold created and registered successfully.")
        print("Next: write the body, place local images under images/, then run the normal checks.")
        return 0
    except (OSError, ValueError) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
