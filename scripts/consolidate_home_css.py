#!/usr/bin/env python3
"""Consolidate home-only override styles without changing cascade order."""

from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CSS_DIR = ROOT / "assets/css"
INDEX = ROOT / "index.html"
VALIDATOR = ROOT / "scripts/validate_site_structure.py"
HOME_CSS = CSS_DIR / "home.css"

SOURCE_CSS = [
    CSS_DIR / "home-layout-tuning.css",
    CSS_DIR / "inline-section-reader.css",
    CSS_DIR / "nav-compact-layout.css",
    CSS_DIR / "article-fixed-scroll-override.css",
]


def build_home_css() -> None:
    sections = []
    for path in SOURCE_CSS:
        if not path.is_file():
            raise FileNotFoundError(path)
        content = path.read_text(encoding="utf-8").strip()
        sections.append(f"/* Consolidated from {path.name}; keep section order stable. */\n{content}")

    HOME_CSS.write_text("\n\n".join(sections) + "\n", encoding="utf-8")


def update_index() -> None:
    text = INDEX.read_text(encoding="utf-8")
    lines = text.splitlines()
    old_names = {path.name for path in SOURCE_CSS}
    lines = [line for line in lines if not any(name in line for name in old_names)]

    home_link = '  <link rel="stylesheet" href="assets/css/home.css?v=20260901-modules">'
    if not any("assets/css/home.css" in line for line in lines):
        for index, line in enumerate(lines):
            if "assets/css/style.css" in line:
                lines.insert(index + 1, home_link)
                break
        else:
            raise RuntimeError("style.css link not found in index.html")

    text = "\n".join(lines) + "\n"
    text = text.replace("?v=20260901-modules", "?v=20260901-homecss")
    INDEX.write_text(text, encoding="utf-8")


def update_validator() -> None:
    text = VALIDATOR.read_text(encoding="utf-8")

    anchor = '    text = INDEX.read_text(encoding="utf-8")\n    scripts = [urlsplit(item).path for item in SCRIPT_RE.findall(text)]\n'
    style_check = '''    required_styles = ["assets/css/style.css", "assets/css/home.css"]
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

'''
    if style_check.strip() not in text:
        if anchor not in text:
            raise RuntimeError("validate_index anchor not found")
        text = text.replace(anchor, anchor + style_check, 1)

    layout_anchor = '    if ARTICLE_PATH_MAP.exists():\n        errors.append("article layout: assets/js/article-path-map.js must not exist")\n'
    file_check = '''
    for legacy_stylesheet in (
        "home-layout-tuning.css",
        "inline-section-reader.css",
        "nav-compact-layout.css",
        "article-fixed-scroll-override.css",
    ):
        if (ROOT / "assets/css" / legacy_stylesheet).exists():
            errors.append(f"stylesheet layout: legacy home stylesheet must not exist: {legacy_stylesheet}")
'''
    if file_check.strip() not in text:
        if layout_anchor not in text:
            raise RuntimeError("canonical layout anchor not found")
        text = text.replace(layout_anchor, layout_anchor + file_check, 1)

    VALIDATOR.write_text(text, encoding="utf-8")


def remove_sources() -> None:
    for path in SOURCE_CSS:
        path.unlink()


def main() -> None:
    build_home_css()
    update_index()
    update_validator()
    remove_sources()
    print("home css consolidation complete")


if __name__ == "__main__":
    main()
