#!/usr/bin/env python3
"""Keep homepage-only selectors out of the shared stylesheet."""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
STYLE = ROOT / "assets" / "css" / "style.css"
HOME = ROOT / "assets" / "css" / "home.css"

HOME_ONLY_CLASSES = (
    "home-shell",
    "primary-sidebar",
    "secondary-sidebar",
    "profile-compact",
    "profile-compact-top",
    "profile-compact-avatar",
    "profile-identity",
    "primary-nav",
    "primary-nav-button",
    "primary-nav-code",
    "primary-nav-title",
    "primary-nav-count",
    "secondary-nav",
    "secondary-nav-button",
    "secondary-nav-title",
    "secondary-nav-count",
    "secondary-nav-card",
    "secondary-article-list",
    "secondary-article-link",
    "secondary-article-empty",
    "home-content",
    "home-panel",
    "article-list",
    "inline-article-placeholder",
    "inline-article-eyebrow",
    "inline-article-reader",
    "inline-section-nav",
    "inline-section-nav-title",
    "inline-section-list",
    "inline-section-button",
    "inline-section-content",
    "empty",
)


def production_html() -> list[Path]:
    return [
        path
        for path in ROOT.rglob("*.html")
        if "tests" not in path.relative_to(ROOT).parts
        and "templates" not in path.relative_to(ROOT).parts
    ]


def main() -> int:
    errors: list[str] = []
    style = STYLE.read_text(encoding="utf-8")
    home = HOME.read_text(encoding="utf-8")

    for class_name in HOME_ONLY_CLASSES:
        pattern = rf"\.{re.escape(class_name)}(?![A-Za-z0-9_-])"
        if re.search(pattern, style):
            errors.append(f"style.css contains homepage-only selector '.{class_name}'")

    if not any(re.search(rf"\.{re.escape(name)}(?![A-Za-z0-9_-])", home) for name in HOME_ONLY_CLASSES):
        errors.append("home.css does not contain any recognized homepage-only selectors")

    home_consumers: list[str] = []
    for page in production_html():
        text = page.read_text(encoding="utf-8", errors="ignore")
        for match in re.finditer(r"<link\b[^>]*href=['\"]([^'\"]*home\.css(?:\?[^'\"]*)?)['\"][^>]*>", text, re.I):
            href = urlsplit(match.group(1)).path
            if href:
                home_consumers.append(page.relative_to(ROOT).as_posix())

    unexpected = sorted(set(home_consumers) - {"index.html"})
    if unexpected:
        errors.append("home.css must only be loaded by index.html; found: " + ", ".join(unexpected))
    if "index.html" not in home_consumers:
        errors.append("index.html must load assets/css/home.css")

    if errors:
        print("CSS ownership validation failed:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    print(
        f"CSS ownership validation passed: {len(HOME_ONLY_CLASSES)} homepage selector families "
        "are isolated in home.css, which is loaded only by index.html."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
