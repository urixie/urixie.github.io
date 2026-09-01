#!/usr/bin/env python3
"""Validate static site routing and canonical article layout consistency."""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
HOME_DATA = ROOT / "assets/js/home-data.js"
ARTICLE_READER = ROOT / "assets/js/article-reader.js"
ARTICLE_PATH_MAP = ROOT / "assets/js/article-path-map.js"
LEGACY_ROUTES = ROOT / "assets/js/legacy-routes.js"
INDEX = ROOT / "index.html"

HOME_HREF_RE = re.compile(r"href\s*:\s*withVersion\(\s*['\"]([^'\"]+)['\"]\s*\)")
LEGACY_ROUTE_RE = re.compile(r"^\s*['\"]([^'\"]+)['\"]\s*:\s*['\"]([^'\"]+)['\"]\s*,?\s*$", re.MULTILINE)
SCRIPT_RE = re.compile(r"<script\s+[^>]*src=['\"]([^'\"]+)['\"][^>]*>", re.IGNORECASE)


def local_path(value: str) -> Path:
    return ROOT / urlsplit(value).path.lstrip("/")


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
        "assets/js/hash-compat.js",
        "assets/js/main.js",
        "assets/js/article-reader.js",
        "assets/js/home.js",
        "assets/js/inline-reader-guard.js",
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


def validate_home_data(errors: list[str]) -> None:
    text = HOME_DATA.read_text(encoding="utf-8")
    hrefs = HOME_HREF_RE.findall(text)
    if not hrefs:
        errors.append("home-data: no article href entries found")
        return

    seen: set[str] = set()
    for href in hrefs:
        if href in seen:
            errors.append(f"home-data: duplicate article href: {href}")
        seen.add(href)
        require_file(local_path(href), errors, "home-data route")


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

    consumers = {
        ROOT / "assets/js/hash-compat.js": "resolveLegacyHomeRoute",
        ROOT / "assets/js/inline-reader-guard.js": "isLegacyHomeRoute",
    }
    for consumer, helper in consumers.items():
        text = consumer.read_text(encoding="utf-8")
        if helper not in text:
            errors.append(f"{consumer.name}: must consume {helper} from legacy-routes.js")


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

    for required in (HOME_DATA, ARTICLE_READER, LEGACY_ROUTES, INDEX):
        require_file(required, errors, "site structure")

    if not errors:
        validate_index(errors)
        validate_home_data(errors)
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
