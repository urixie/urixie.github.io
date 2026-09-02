#!/usr/bin/env python3
"""Add native lazy-loading and async-decoding hints to production article images."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTICLES = ROOT / "articles"
TEMPLATES = ARTICLES / "templates"
IMG_RE = re.compile(r"<img\b[^>]*>", re.I)
ATTR_RE_TEMPLATE = r"\b{}\s*="


def is_template(path: Path) -> bool:
    try:
        path.relative_to(TEMPLATES)
    except ValueError:
        return False
    return True


def enrich_img(tag: str) -> tuple[str, bool]:
    additions: list[str] = []
    if not re.search(ATTR_RE_TEMPLATE.format("loading"), tag, re.I):
        additions.append('loading="lazy"')
    if not re.search(ATTR_RE_TEMPLATE.format("decoding"), tag, re.I):
        additions.append('decoding="async"')
    if not additions:
        return tag, False

    suffix = " />" if tag.rstrip().endswith("/>") else ">"
    body = tag.rstrip()
    body = body[:-2].rstrip() if suffix == " />" else body[:-1].rstrip()
    return f"{body} {' '.join(additions)}{suffix}", True


def main() -> int:
    changed_files = 0
    changed_images = 0

    for path in sorted(ARTICLES.glob("**/*.html")):
        if is_template(path):
            continue
        text = path.read_text(encoding="utf-8")
        local_changes = 0

        def replace(match: re.Match[str]) -> str:
            nonlocal local_changes
            updated, changed = enrich_img(match.group(0))
            if changed:
                local_changes += 1
            return updated

        updated = IMG_RE.sub(replace, text)
        if local_changes:
            path.write_text(updated, encoding="utf-8", newline="\n")
            changed_files += 1
            changed_images += local_changes
            print(f"Updated {local_changes:3d} image(s): {path.relative_to(ROOT).as_posix()}")

    print(f"Added loading hints to {changed_images} image(s) across {changed_files} article file(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
