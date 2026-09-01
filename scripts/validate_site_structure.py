#!/usr/bin/env python3
"""Validate static site routing and article layout consistency."""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
HOME_DATA = ROOT / "assets/js/home-data.js"
ARTICLE_PATH_MAP = ROOT / "assets/js/article-path-map.js"
LEGACY_ROUTES = ROOT / "assets/js/legacy-routes.js"
INDEX = ROOT / "index.html"

HOME_HREF_RE = re.compile(r"href\s*:\s*withVersion\(\s*['\"]([^'\"]+)['\"]\s*\)")
PATH_MAP_RE = re.compile(r"['\"]([^'\"]+\.html)['\"]\s*:\s*['\"]([^'\"]+\.html)['\"]")
LEGACY_ROUTE_RE = re.compile(r"^\s*['\"]([^'\"]+)['\"]\s*:\s*['\"]([^'\"]+)['\"]\s*,?\s*$", re.MULTILINE)
SCRIPT_RE = re.compile(r"<script\s+[^>]*src=['\"]([^'\"]+)['\"][^>]*>", re.IGNORECASE)
ARTICLE_SOURCE_RE = re.compile(r"data-article-source=['\"]([^'\"]+)['\"]", re.IGNORECASE)


def local_path(value: str) -> Path:
    path = urlsplit(value).path.lstrip("/")
    return ROOT / path


def require_file(path: Path, errors: list[str], context: str) -> None:
    if not path.is_file():
        errors.append(f"{context}: missing file: {path.relative_to(ROOT).as_posix()}")


def read_article_path_map() -> dict[str, str]:
    text = ARTICLE_PATH_MAP.read_text(encoding="utf-8")
    return dict(PATH_MAP_RE.findall(text))


def effective_article_path(href: str, path_map: dict[str, str]) -> str:
    clean_href = urlsplit(href).path
    return path_map.get(clean_href, clean_href)


def validate_index(errors: list[str]) -> None:
    text = INDEX.read_text(encoding="utf-8")
    scripts = [urlsplit(item).path for item in SCRIPT_RE.findall(text)]
    for script in scripts:
        require_file(ROOT / script, errors, "index script")

    required_order = [
        "assets/js/home-data.js",
        "assets/js/article-path-map.js",
        "assets/js/legacy-routes.js",
        "assets/js/hash-compat.js",
        "assets/js/main.js",
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


def validate_home_data(errors: list[str], path_map: dict[str, str]) -> None:
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
        effective = effective_article_path(href, path_map)
        require_file(local_path(effective), errors, "home-data effective route")


def validate_article_path_map(errors: list[str], path_map: dict[str, str]) -> None:
    sources: set[str] = set()
    targets: set[str] = set()

    for source, target in path_map.items():
        if source in sources:
            errors.append(f"article-path-map: duplicate source: {source}")
        if target in targets:
            errors.append(f"article-path-map: duplicate target: {target}")
        sources.add(source)
        targets.add(target)

        # Source paths are compatibility aliases and are allowed to be virtual.
        # Targets are canonical routes and must always exist.
        require_file(local_path(target), errors, "article-path-map target")


def validate_proxy_sources(errors: list[str]) -> None:
    for html_file in sorted((ROOT / "articles").glob("**/*.html")):
        text = html_file.read_text(encoding="utf-8")
        match = ARTICLE_SOURCE_RE.search(text)
        if not match:
            continue
        source = match.group(1)
        resolved = (html_file.parent / urlsplit(source).path).resolve()
        try:
            resolved.relative_to(ROOT.resolve())
        except ValueError:
            errors.append(
                f"article proxy: source escapes repository: {html_file.relative_to(ROOT).as_posix()} -> {source}"
            )
            continue
        if not resolved.is_file():
            errors.append(
                f"article proxy: missing source: {html_file.relative_to(ROOT).as_posix()} -> {source}"
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


def validate_known_duplicate_trees(errors: list[str]) -> None:
    duplicate_paths = [
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
        "articles/mcu/mcu/microchip",
        "articles/mcu/mcu/silicon-labs",
        "articles/mcu/mcu/wh",
    ]
    for relative in duplicate_paths:
        if (ROOT / relative).exists():
            errors.append(f"article layout: duplicated tree must not exist: {relative}")


def main() -> int:
    errors: list[str] = []

    for required in (HOME_DATA, ARTICLE_PATH_MAP, LEGACY_ROUTES, INDEX):
        require_file(required, errors, "site structure")

    if not errors:
        path_map = read_article_path_map()
        validate_index(errors)
        validate_home_data(errors, path_map)
        validate_article_path_map(errors, path_map)
        validate_proxy_sources(errors)
        validate_legacy_routes(errors)
        validate_known_duplicate_trees(errors)

    if errors:
        print("Site structure validation failed:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    print("Site structure validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
