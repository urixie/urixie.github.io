#!/usr/bin/env python3
"""Validate static site routing and canonical article layout consistency."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
SITE_MAP = ROOT / "data/site-map.json"
HOME_DATA = ROOT / "assets/js/home-data.js"
ARTICLE_READER = ROOT / "assets/js/article-reader.js"
ARTICLE_PATH_MAP = ROOT / "assets/js/article-path-map.js"
LEGACY_ROUTES = ROOT / "assets/js/legacy-routes.js"
ROUTE_COMPAT = ROOT / "assets/js/route-compat.js"
INDEX = ROOT / "index.html"

LEGACY_ROUTE_RE = re.compile(r"^\s*['\"]([^'\"]+)['\"]\s*:\s*['\"]([^'\"]+)['\"]\s*,?\s*$", re.MULTILINE)
SCRIPT_RE = re.compile(r"<script\s+[^>]*src=['\"]([^'\"]+)['\"][^>]*>", re.IGNORECASE)


def require_file(path: Path, errors: list[str], context: str) -> None:
    if not path.is_file():
        errors.append(f"{context}: missing file: {path.relative_to(ROOT).as_posix()}")


def validate_index(errors: list[str]) -> None:
    text = INDEX.read_text(encoding="utf-8")
    scripts = [urlsplit(item).path for item in SCRIPT_RE.findall(text)]
    required_styles = ["assets/css/style.css", "assets/css/home.css"]
    for stylesheet in required_styles:
        if stylesheet not in text:
            errors.append(f"index style: missing required stylesheet: {stylesheet}")
    for legacy_stylesheet in (
        "assets/css/home-layout-tuning.css",
        "assets/css/inline-section-reader.css",
        "assets/css/nav-compact-layout.css",
        "assets/css/article-fixed-scroll-override.css",
    ):
        if legacy_stylesheet in text:
            errors.append(f"index style: legacy stylesheet must not be loaded: {legacy_stylesheet}")

    for script in scripts:
        require_file(ROOT / script, errors, "index script")

    required_order = [
        "assets/js/home-data.js",
        "assets/js/legacy-routes.js",
        "assets/js/route-compat.js",
        "assets/js/main.js",
        "assets/js/article-reader.js",
        "assets/js/home.js",
    ]
    positions = []
    for script in required_order:
        if script not in scripts:
            errors.append(f"index script: missing required script: {script}")
            continue
        positions.append(scripts.index(script))
    if len(positions) == len(required_order) and positions != sorted(positions):
        errors.append("index script: routing scripts are not loaded in the required order")

    if any("article-path-map.js" in script for script in scripts):
        errors.append("index script: article-path-map.js must not be loaded")

    main_js = (ROOT / "assets/js/main.js").read_text(encoding="utf-8")
    reader_js = ARTICLE_READER.read_text(encoding="utf-8") if ARTICLE_READER.is_file() else ""
    home_js = (ROOT / "assets/js/home.js").read_text(encoding="utf-8")
    if "homeState" in main_js or "renderPrimaryNav" in main_js:
        errors.append("javascript layout: main.js must not contain home navigation state/rendering")
    if "window.homeNav" not in home_js or "initHome();" not in home_js:
        errors.append("javascript layout: home.js must own and initialize home navigation")
    if "legacyHomeHashMap" in home_js:
        errors.append("javascript layout: home.js must consume legacy-routes.js instead of duplicating legacy routes")
    if "articleHref" in home_js:
        errors.append("javascript layout: home.js must not keep unused articleHref state")
    if "function fetchInlineArticleRoot" in home_js or "function extractArticleSections" in home_js:
        errors.append("javascript layout: home.js must not contain article reader implementation")
    if "window.articleReader" not in reader_js or "function createSectionedArticleReader" not in reader_js:
        errors.append("javascript layout: article-reader.js must own inline article reader implementation")
    if "initCopyButtons" not in reader_js or "enhanceArticleImageZoom" not in reader_js:
        errors.append("javascript layout: article-reader.js must reuse article enhancements from main.js")
    if "extractArticleSourceFromRoute" in reader_js or "articleSource" in reader_js:
        errors.append("javascript layout: article-reader.js must fetch canonical articles directly without proxy-source parsing")


def validate_site_map(errors: list[str]) -> None:
    try:
        site_map = json.loads(SITE_MAP.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        errors.append(f"site-map: invalid JSON: {error}")
        return

    if not isinstance(site_map, list) or not site_map:
        errors.append("site-map: top-level value must be a non-empty array")
        return

    topic_ids: set[str] = set()
    article_hrefs: set[str] = set()

    for topic in site_map:
        if not isinstance(topic, dict):
            errors.append("site-map: every topic must be an object")
            continue
        topic_id = topic.get("id")
        if not isinstance(topic_id, str) or not topic_id:
            errors.append("site-map: topic id must be a non-empty string")
            continue
        if topic_id in topic_ids:
            errors.append(f"site-map: duplicate topic id: {topic_id}")
        topic_ids.add(topic_id)

        category_ids: set[str] = set()
        children = topic.get("children", [])
        if not isinstance(children, list):
            errors.append(f"site-map: children must be an array for topic: {topic_id}")
            continue

        for category in children:
            if not isinstance(category, dict):
                errors.append(f"site-map: category under {topic_id} must be an object")
                continue
            category_id = category.get("id")
            if not isinstance(category_id, str) or not category_id:
                errors.append(f"site-map: category id under {topic_id} must be non-empty")
                continue
            if category_id in category_ids:
                errors.append(f"site-map: duplicate category id under {topic_id}: {category_id}")
            category_ids.add(category_id)

            articles = category.get("articles", [])
            if not isinstance(articles, list):
                errors.append(f"site-map: articles must be an array for {topic_id}/{category_id}")
                continue

            for article in articles:
                if not isinstance(article, dict):
                    errors.append(f"site-map: article under {topic_id}/{category_id} must be an object")
                    continue
                href = article.get("href")
                if not isinstance(href, str) or not href:
                    errors.append(f"site-map: article href missing under {topic_id}/{category_id}")
                    continue

                parsed = urlsplit(href)
                if parsed.scheme or parsed.netloc or parsed.query or parsed.fragment:
                    errors.append(f"site-map: article href must be a pure canonical path: {href}")
                    continue
                if not href.startswith("articles/") or not href.endswith(".html"):
                    errors.append(f"site-map: invalid canonical article path: {href}")
                    continue
                if href in article_hrefs:
                    errors.append(f"site-map: duplicate article href: {href}")
                article_hrefs.add(href)
                require_file(ROOT / href, errors, "site-map route")

    home_data = HOME_DATA.read_text(encoding="utf-8")
    if not home_data.startswith("// Generated by scripts/generate_home_data.py"):
        errors.append("home-data: runtime data must be generated from data/site-map.json")
    for marker in ("withVersion(", "cacheVersion", "assets/css/style.css"):
        if marker in home_data:
            errors.append(f"home-data: article routing must not depend on asset cache versions: {marker}")


def validate_no_article_proxies(errors: list[str]) -> None:
    for html_file in sorted((ROOT / "articles").glob("**/*.html")):
        text = html_file.read_text(encoding="utf-8")
        if "data-article-source" in text:
            errors.append(
                f"article layout: proxy wrapper marker must not exist: {html_file.relative_to(ROOT).as_posix()}"
            )


def validate_legacy_routes(errors: list[str]) -> None:
    text = LEGACY_ROUTES.read_text(encoding="utf-8")
    pairs = LEGACY_ROUTE_RE.findall(text)
    if not pairs:
        errors.append("legacy-routes: no compatibility routes found")
        return

    keys: set[str] = set()
    for key, target in pairs:
        if key in keys:
            errors.append(f"legacy-routes: duplicate route key: {key}")
        keys.add(key)
        if not target:
            errors.append(f"legacy-routes: empty route target for: {key}")

    if not ROUTE_COMPAT.is_file():
        errors.append("route-compat.js: consolidated hash compatibility layer is missing")
        return

    route_text = ROUTE_COMPAT.read_text(encoding="utf-8")
    required_markers = (
        "resolveLegacyHomeRoute",
        "decodeURIComponent",
        "stopImmediatePropagation",
    )
    for marker in required_markers:
        if marker not in route_text:
            errors.append(f"route-compat.js: missing routing safety marker: {marker}")


def validate_canonical_layout(errors: list[str]) -> None:
    forbidden_paths = [
        "articles/c",
        "articles/linux",
        "articles/freertos",
        "articles/windows",
        "articles/foundation/foundation",
        "articles/dev-tools/dev-tools",
        "articles/fpga/fpga",
        "articles/realtime/realtime",
        "articles/soc/linux",
        "articles/soc/linux-basic",
        "articles/soc/linux-build",
        "articles/soc/linux-driver-debug",
        "articles/soc/linux-rockchip",
        "articles/host/tools",
        "articles/host/tools-debug-config",
        "articles/mcu/mcu",
    ]
    for relative in forbidden_paths:
        if (ROOT / relative).exists():
            errors.append(f"article layout: legacy/duplicated tree must not exist: {relative}")

    if ARTICLE_PATH_MAP.exists():
        errors.append("article layout: assets/js/article-path-map.js must not exist")

    for legacy_script in ("hash-compat.js", "inline-reader-guard.js"):
        if (ROOT / "assets/js" / legacy_script).exists():
            errors.append(f"javascript layout: superseded routing helper must not exist: {legacy_script}")

    for legacy_stylesheet in (
        "home-layout-tuning.css",
        "inline-section-reader.css",
        "nav-compact-layout.css",
        "article-fixed-scroll-override.css",
    ):
        if (ROOT / "assets/css" / legacy_stylesheet).exists():
            errors.append(f"stylesheet layout: legacy home stylesheet must not exist: {legacy_stylesheet}")


def main() -> int:
    errors: list[str] = []

    for required in (SITE_MAP, HOME_DATA, ARTICLE_READER, LEGACY_ROUTES, ROUTE_COMPAT, INDEX):
        require_file(required, errors, "site structure")

    if not errors:
        validate_index(errors)
        validate_site_map(errors)
        validate_no_article_proxies(errors)
        validate_legacy_routes(errors)
        validate_canonical_layout(errors)

    if errors:
        print("Site structure validation failed:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    print("Site structure validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
