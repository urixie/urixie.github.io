#!/usr/bin/env python3
"""Repair stale local references and route hashes in legacy article pages."""

from __future__ import annotations

import json
import os
import re
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parents[1]
ARTICLES = ROOT / "articles"
TEMPLATES = ARTICLES / "templates"
SITE_MAP = ROOT / "data" / "site-map.json"
LEGACY_ROUTES = ROOT / "assets" / "js" / "legacy-routes.js"
ATTR_RE = re.compile(r"(?P<prefix>\b(?:href|src)\s*=\s*)(?P<quote>['\"])(?P<value>[^'\"]+)(?P=quote)", re.I)
LEGACY_ROUTE_RE = re.compile(r"^\s*['\"]([^'\"]+)['\"]\s*:\s*['\"]([^'\"]+)['\"]\s*,?\s*$", re.MULTILINE)
EXTERNAL = {"http", "https", "mailto", "tel", "data", "javascript"}


def is_template(path: Path) -> bool:
    try:
        path.relative_to(TEMPLATES)
    except ValueError:
        return False
    return True


def route_aliases() -> dict[str, str]:
    aliases = dict(LEGACY_ROUTE_RE.findall(LEGACY_ROUTES.read_text(encoding="utf-8")))
    site_map = json.loads(SITE_MAP.read_text(encoding="utf-8"))
    flattened: dict[str, list[str]] = {}
    for topic in site_map:
        topic_id = str(topic.get("id") or "").strip()
        for category in topic.get("children") or []:
            category_id = str(category.get("id") or "").strip()
            if not topic_id or not category_id:
                continue
            key = f"{topic_id}-{category_id}"
            flattened.setdefault(key, []).append(f"{topic_id}/{category_id}")
    for key, targets in flattened.items():
        if len(targets) == 1:
            aliases.setdefault(key, targets[0])
    return aliases


def repair_value(source: Path, value: str, aliases: dict[str, str]) -> str:
    parsed = urlsplit(value)
    if parsed.scheme.lower() in EXTERNAL or parsed.netloc:
        return value

    path_part = parsed.path
    if path_part.startswith("../"):
        current_target = (source.parent / path_part).resolve()
        if not current_target.exists():
            remainder = path_part
            while remainder.startswith("../"):
                remainder = remainder[3:]
            if remainder:
                root_target = (ROOT / remainder).resolve()
                try:
                    root_target.relative_to(ROOT.resolve())
                except ValueError:
                    pass
                else:
                    if root_target.exists():
                        path_part = Path(os.path.relpath(root_target, source.parent)).as_posix()

    fragment = parsed.fragment
    target = (source.parent / path_part).resolve() if path_part and not path_part.startswith("/") else None
    if target == (ROOT / "index.html").resolve() and fragment in aliases:
        fragment = aliases[fragment]

    return urlunsplit((parsed.scheme, parsed.netloc, path_part, parsed.query, fragment))


def repair_known_heading_error(path: Path, text: str) -> tuple[str, int]:
    target = "articles/mcu/microchip/pic16f18854-datasheet-notes/pic16f18854-datasheet-notes.html"
    if path.relative_to(ROOT).as_posix() != target:
        return text, 0

    pattern = re.compile(r'<h4(?P<attrs>\s+id="29-[123]-[^"]*"[^>]*)>(?P<body>.*?)</h4>', re.S)
    updated, count = pattern.subn(r'<h3\g<attrs>>\g<body></h3>', text)
    return updated, count


def main() -> int:
    aliases = route_aliases()
    changed_files = 0
    changed_refs = 0
    changed_headings = 0

    for path in sorted(ARTICLES.glob("**/*.html")):
        if is_template(path):
            continue
        text = path.read_text(encoding="utf-8")
        local_changes = 0

        def replace(match: re.Match[str]) -> str:
            nonlocal local_changes
            value = match.group("value")
            repaired = repair_value(path, value, aliases)
            if repaired == value:
                return match.group(0)
            local_changes += 1
            return f"{match.group('prefix')}{match.group('quote')}{repaired}{match.group('quote')}"

        updated = ATTR_RE.sub(replace, text)
        updated, heading_changes = repair_known_heading_error(path, updated)
        total_local = local_changes + heading_changes
        if total_local:
            path.write_text(updated, encoding="utf-8", newline="\n")
            changed_files += 1
            changed_refs += local_changes
            changed_headings += heading_changes
            print(
                f"Repaired {local_changes:2d} reference(s), {heading_changes:2d} heading(s): "
                f"{path.relative_to(ROOT).as_posix()}"
            )

    print(
        f"Repaired {changed_refs} local reference(s) and {changed_headings} heading(s) "
        f"across {changed_files} article file(s)."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
