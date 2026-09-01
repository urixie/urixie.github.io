#!/usr/bin/env python3
"""Update static CSS cache-busting query tokens across HTML pages."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "20260901-styleclean"
STYLE_RE = re.compile(r"(?P<path>[^\"']*assets/css/style\.css)\?v=[^\"']+")
HOME_RE = re.compile(r"(?P<path>[^\"']*assets/css/home\.css)\?v=[^\"']+")


def replace_version(text: str, pattern: re.Pattern[str]) -> tuple[str, int]:
    return pattern.subn(lambda match: f"{match.group('path')}?v={VERSION}", text)


def main() -> None:
    changed_files = 0
    style_refs = 0
    home_refs = 0

    for path in sorted(ROOT.rglob("*.html")):
        if ".git" in path.parts:
            continue
        text = path.read_text(encoding="utf-8")
        updated, style_count = replace_version(text, STYLE_RE)
        updated, home_count = replace_version(updated, HOME_RE)
        style_refs += style_count
        home_refs += home_count
        if updated != text:
            path.write_text(updated, encoding="utf-8")
            changed_files += 1

    if style_refs < 2:
        raise RuntimeError(f"expected multiple style.css cache refs, found {style_refs}")
    if home_refs != 1:
        raise RuntimeError(f"expected exactly one home.css cache ref, found {home_refs}")

    stale = []
    for path in ROOT.rglob("*.html"):
        text = path.read_text(encoding="utf-8", errors="ignore")
        for match in re.finditer(r"assets/css/(?:style|home)\.css\?v=([^\"']+)", text):
            if match.group(1) != VERSION:
                stale.append(f"{path.relative_to(ROOT)}:{match.group(0)}")
    if stale:
        raise RuntimeError("stale CSS cache tokens remain:\n" + "\n".join(stale))

    print(
        f"Updated CSS cache version to {VERSION} in {changed_files} HTML files "
        f"({style_refs} style.css refs, {home_refs} home.css refs)."
    )


if __name__ == "__main__":
    main()
