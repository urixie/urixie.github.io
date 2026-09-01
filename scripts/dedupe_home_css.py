#!/usr/bin/env python3
"""Remove only provably identical top-level CSS rules and dead home state."""

from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HOME_CSS = ROOT / "assets/css/home.css"
HOME_JS = ROOT / "assets/js/home.js"
VALIDATOR = ROOT / "scripts/validate_site_structure.py"


def skip_comment(text: str, index: int) -> int:
    end = text.find("*/", index + 2)
    return len(text) if end < 0 else end + 2


def scan_to_block_start(text: str, index: int) -> tuple[int, str]:
    quote = ""
    i = index
    while i < len(text):
        if not quote and text.startswith("/*", i):
            i = skip_comment(text, i)
            continue
        char = text[i]
        if quote:
            if char == "\\":
                i += 2
                continue
            if char == quote:
                quote = ""
        elif char in {'"', "'"}:
            quote = char
        elif char in "{;":
            return i, char
        i += 1
    return len(text), ""


def find_block_end(text: str, open_index: int) -> int:
    depth = 1
    quote = ""
    i = open_index + 1
    while i < len(text):
        if not quote and text.startswith("/*", i):
            i = skip_comment(text, i)
            continue
        char = text[i]
        if quote:
            if char == "\\":
                i += 2
                continue
            if char == quote:
                quote = ""
        elif char in {'"', "'"}:
            quote = char
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    raise RuntimeError("home.css contains an unclosed block")


def normalize_rule_text(value: str) -> str:
    value = re.sub(r"/\*.*?\*/", "", value, flags=re.DOTALL)
    return re.sub(r"\s+", " ", value).strip()


def top_level_rules(css: str) -> list[tuple[int, int, str, str]]:
    rules = []
    i = 0
    while i < len(css):
        while i < len(css):
            if css.startswith("/*", i):
                i = skip_comment(css, i)
                continue
            if css[i].isspace():
                i += 1
                continue
            break
        if i >= len(css):
            break

        header_start = i
        token_index, token = scan_to_block_start(css, i)
        if not token:
            break
        if token == ";":
            i = token_index + 1
            continue

        header = css[header_start:token_index].strip()
        close_index = find_block_end(css, token_index)
        if not header.startswith("@"):
            body = css[token_index + 1:close_index]
            rules.append((header_start, close_index + 1, normalize_rule_text(header), normalize_rule_text(body)))
        i = close_index + 1
    return rules


def dedupe_css(css: str) -> tuple[str, int]:
    rules = top_level_rules(css)
    seen: dict[tuple[str, str], list[tuple[int, int]]] = {}
    for start, end, selector, body in rules:
        seen.setdefault((selector, body), []).append((start, end))

    remove_spans = []
    for spans in seen.values():
        if len(spans) > 1:
            remove_spans.extend(spans[:-1])

    next_css = css
    for start, end in sorted(remove_spans, reverse=True):
        next_css = next_css[:start] + next_css[end:]

    next_css = re.sub(r"\n{4,}", "\n\n\n", next_css).rstrip() + "\n"
    return next_css, len(remove_spans)


def remove_dead_home_state(text: str) -> tuple[str, int]:
    patterns = [
        r"^\s*articleHref:\s*'',?\s*\n",
        r"^\s*homeState\.articleHref\s*=\s*article\.href;\s*\n",
        r"^\s*homeState\.articleHref\s*=\s*article\?\.href\s*\|\|\s*'';\s*\n",
    ]
    removed = 0
    for pattern in patterns:
        text, count = re.subn(pattern, "", text, flags=re.MULTILINE)
        removed += count
    if "articleHref" in text:
        raise RuntimeError("articleHref still exists after dead-state cleanup")
    return text, removed


def update_validator(text: str) -> str:
    needle = (
        '    if "legacyHomeHashMap" in home_js:\n'
        '        errors.append("javascript layout: home.js must consume legacy-routes.js instead of duplicating legacy routes")\n'
    )
    replacement = needle + (
        '    if "articleHref" in home_js:\n'
        '        errors.append("javascript layout: home.js must not keep unused articleHref state")\n'
    )
    if needle not in text:
        raise RuntimeError("validator insertion point not found")
    return text.replace(needle, replacement, 1)


def main() -> None:
    css_before = HOME_CSS.read_text(encoding="utf-8")
    css_after, duplicate_count = dedupe_css(css_before)
    HOME_CSS.write_text(css_after, encoding="utf-8")

    home_before = HOME_JS.read_text(encoding="utf-8")
    home_after, dead_state_count = remove_dead_home_state(home_before)
    HOME_JS.write_text(home_after, encoding="utf-8")

    validator = VALIDATOR.read_text(encoding="utf-8")
    VALIDATOR.write_text(update_validator(validator), encoding="utf-8")

    print(f"Removed {duplicate_count} identical top-level CSS rule(s).")
    print(f"Removed {dead_state_count} dead articleHref state line(s).")
    print(f"home.css: {len(css_before.splitlines())} -> {len(css_after.splitlines())} lines")
    print(f"home.js: {len(home_before.splitlines())} -> {len(home_after.splitlines())} lines")


if __name__ == "__main__":
    main()
