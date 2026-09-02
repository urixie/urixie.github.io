#!/usr/bin/env python3
"""Repair legacy article references that are one directory level short of repository root."""

from __future__ import annotations

import os
import re
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parents[1]
ARTICLES = ROOT / "articles"
TEMPLATES = ARTICLES / "templates"
ATTR_RE = re.compile(r"(?P<prefix>\b(?:href|src)\s*=\s*)(?P<quote>['\"])(?P<value>[^'\"]+)(?P=quote)", re.I)
EXTERNAL = {"http", "https", "mailto", "tel", "data", "javascript"}


def is_template(path: Path) -> bool:
    try:
        path.relative_to(TEMPLATES)
    except ValueError:
        return False
    return True


def repair_value(source: Path, value: str) -> str:
    parsed = urlsplit(value)
    if parsed.scheme.lower() in EXTERNAL or parsed.netloc or not parsed.path.startswith("../"):
        return value

    current_target = (source.parent / parsed.path).resolve()
    if current_target.exists():
        return value

    remainder = parsed.path
    while remainder.startswith("../"):
        remainder = remainder[3:]
    if not remainder:
        return value

    root_target = (ROOT / remainder).resolve()
    try:
        root_target.relative_to(ROOT.resolve())
    except ValueError:
        return value
    if not root_target.exists():
        return value

    repaired_path = Path(os.path.relpath(root_target, source.parent)).as_posix()
    return urlunsplit(("", "", repaired_path, parsed.query, parsed.fragment))


def main() -> int:
    changed_files = 0
    changed_refs = 0

    for path in sorted(ARTICLES.glob("**/*.html")):
        if is_template(path):
            continue
        text = path.read_text(encoding="utf-8")
        local_changes = 0

        def replace(match: re.Match[str]) -> str:
            nonlocal local_changes
            value = match.group("value")
            repaired = repair_value(path, value)
            if repaired == value:
                return match.group(0)
            local_changes += 1
            return f"{match.group('prefix')}{match.group('quote')}{repaired}{match.group('quote')}"

        updated = ATTR_RE.sub(replace, text)
        if local_changes:
            path.write_text(updated, encoding="utf-8", newline="\n")
            changed_files += 1
            changed_refs += local_changes
            print(f"Repaired {local_changes:2d} reference(s): {path.relative_to(ROOT).as_posix()}")

    print(f"Repaired {changed_refs} local reference(s) across {changed_files} article file(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
