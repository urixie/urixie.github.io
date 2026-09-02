#!/usr/bin/env python3
"""Generate the browser runtime site map from the canonical JSON manifest."""

from __future__ import annotations

import argparse
import copy
import json
import sys
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data" / "site-map.json"
OUTPUT = ROOT / "assets" / "js" / "home-data.js"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate assets/js/home-data.js from data/site-map.json.")
    parser.add_argument(
        "--check",
        action="store_true",
        help="verify that home-data.js matches the manifest without modifying files",
    )
    return parser.parse_args()


def require_text(value: object, context: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{context} must be a non-empty string")
    return value.strip()


def validate_manifest(site_map: object) -> list[dict]:
    if not isinstance(site_map, list) or not site_map:
        raise ValueError("site-map.json must contain a non-empty top-level array")

    topic_ids: set[str] = set()
    article_hrefs: set[str] = set()

    for topic_index, topic in enumerate(site_map):
        context = f"topic[{topic_index}]"
        if not isinstance(topic, dict):
            raise ValueError(f"{context} must be an object")

        topic_id = require_text(topic.get("id"), f"{context}.id")
        require_text(topic.get("title"), f"{context}.title")
        require_text(topic.get("desc"), f"{context}.desc")
        if topic_id in topic_ids:
            raise ValueError(f"duplicate topic id: {topic_id}")
        topic_ids.add(topic_id)

        children = topic.get("children", [])
        if not isinstance(children, list):
            raise ValueError(f"{context}.children must be an array")

        category_ids: set[str] = set()
        for category_index, category in enumerate(children):
            category_context = f"{context}.children[{category_index}]"
            if not isinstance(category, dict):
                raise ValueError(f"{category_context} must be an object")

            category_id = require_text(category.get("id"), f"{category_context}.id")
            require_text(category.get("title"), f"{category_context}.title")
            require_text(category.get("desc"), f"{category_context}.desc")
            if category_id in category_ids:
                raise ValueError(f"duplicate category id under {topic_id}: {category_id}")
            category_ids.add(category_id)

            placeholders = category.get("placeholders")
            if placeholders is not None and (
                not isinstance(placeholders, list)
                or any(not isinstance(item, str) or not item.strip() for item in placeholders)
            ):
                raise ValueError(f"{category_context}.placeholders must contain non-empty strings")

            articles = category.get("articles", [])
            if not isinstance(articles, list):
                raise ValueError(f"{category_context}.articles must be an array")

            for article_index, article in enumerate(articles):
                article_context = f"{category_context}.articles[{article_index}]"
                if not isinstance(article, dict):
                    raise ValueError(f"{article_context} must be an object")

                nav_title = require_text(article.get("navTitle"), f"{article_context}.navTitle")
                nav_desc = require_text(article.get("navDesc"), f"{article_context}.navDesc")
                href = require_text(article.get("href"), f"{article_context}.href")
                tags = article.get("tags", [])
                if not isinstance(tags, list) or any(
                    not isinstance(tag, str) or not tag.strip() for tag in tags
                ):
                    raise ValueError(f"{article_context}.tags must contain non-empty strings")

                parsed = urlsplit(href)
                if parsed.scheme or parsed.netloc or parsed.query or parsed.fragment:
                    raise ValueError(f"{article_context}.href must be a pure local path: {href}")
                if not href.startswith("articles/") or not href.endswith(".html"):
                    raise ValueError(f"{article_context}.href is not a canonical article path: {href}")
                if href in article_hrefs:
                    raise ValueError(f"duplicate article href: {href}")
                article_hrefs.add(href)
                if not (ROOT / href).is_file():
                    raise ValueError(f"article file does not exist: {href}")

                # Keep the explicit reads above so failures point to the exact field.
                _ = nav_title, nav_desc

    return site_map


def runtime_site_map(manifest: list[dict]) -> list[dict]:
    runtime = copy.deepcopy(manifest)
    for topic in runtime:
        for category in topic.get("children", []):
            converted_articles = []
            for article in category.get("articles", []):
                converted_articles.append(
                    {
                        "title": article["navTitle"],
                        "desc": article["navDesc"],
                        "href": article["href"],
                        "tags": article.get("tags", []),
                    }
                )
            category["articles"] = converted_articles
    return runtime


def render_home_data(site_map: list[dict]) -> str:
    payload = json.dumps(runtime_site_map(site_map), ensure_ascii=False, indent=2)
    payload = payload.replace("\n", "\n  ")
    return (
        "// Generated by scripts/generate_home_data.py. Do not edit this file directly.\n"
        "(function () {\n"
        f"  const siteMap = {payload};\n\n"
        "  window.siteMap = siteMap;\n"
        "})();\n"
    )


def main() -> int:
    args = parse_args()
    if not MANIFEST.is_file():
        print(f"Error: missing manifest: {MANIFEST.relative_to(ROOT)}", file=sys.stderr)
        return 1

    try:
        site_map = validate_manifest(json.loads(MANIFEST.read_text(encoding="utf-8")))
    except (json.JSONDecodeError, ValueError) as error:
        print(f"Error: invalid site map manifest: {error}", file=sys.stderr)
        return 1

    expected = render_home_data(site_map)
    current = OUTPUT.read_text(encoding="utf-8") if OUTPUT.is_file() else ""

    if args.check:
        if current != expected:
            print(
                "Generated home data is stale. Run: python scripts/generate_home_data.py",
                file=sys.stderr,
            )
            return 1
        print("Generated home data is up to date.")
        return 0

    if current == expected:
        print("home-data.js is already up to date.")
        return 0

    OUTPUT.write_text(expected, encoding="utf-8", newline="\n")
    print(f"Generated: {OUTPUT.relative_to(ROOT).as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
