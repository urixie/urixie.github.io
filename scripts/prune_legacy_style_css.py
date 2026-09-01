#!/usr/bin/env python3
"""Remove only audited legacy selector families from style.css."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS_PATH = ROOT / "assets/css/style.css"

DEAD_CLASSES = {
    "article-card",
    "article-tags",
    "english-subtitle",
    "menu-toggle",
    "nav-group-title",
    "nav-group-toggle",
    "nav-group-arrow",
    "nav-group-items",
    "hero",
    "hero-actions",
    "stack-list",
    "stack-grid",
    "stack-card",
    "chip-list",
    "chip",
    "platform-category",
    "platform-items",
    "platform-item",
    "post-list",
    "post-card",
    "tag-cloud",
    "rightbar",
    "widget",
    "secondary-head",
}

CLASS_RE = re.compile(r"\.([A-Za-z_][A-Za-z0-9_-]*)")
EXPECTED_FULL_RULES = 59
EXPECTED_PARTIAL_RULES = 5
EXPECTED_PARTIAL_GROUPS = 11


def skip_comment(text: str, index: int) -> int:
    end = text.find("*/", index + 2)
    return len(text) if end < 0 else end + 2


def find_block_end(text: str, open_index: int) -> int:
    depth = 1
    quote = ""
    i = open_index + 1
    while i < len(text):
        if not quote and text.startswith("/*", i):
            i = skip_comment(text, i)
            continue
        ch = text[i]
        if quote:
            if ch == "\\":
                i += 2
                continue
            if ch == quote:
                quote = ""
        elif ch in {'"', "'"}:
            quote = ch
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    raise RuntimeError("style.css contains an unclosed block")


def split_selector_groups(selector: str) -> list[str]:
    groups = []
    token = []
    paren = 0
    bracket = 0
    quote = ""
    for ch in selector:
        if quote:
            token.append(ch)
            if ch == quote:
                quote = ""
            continue
        if ch in {'"', "'"}:
            quote = ch
            token.append(ch)
        elif ch == "(":
            paren += 1
            token.append(ch)
        elif ch == ")":
            paren = max(0, paren - 1)
            token.append(ch)
        elif ch == "[":
            bracket += 1
            token.append(ch)
        elif ch == "]":
            bracket = max(0, bracket - 1)
            token.append(ch)
        elif ch == "," and paren == 0 and bracket == 0:
            groups.append("".join(token).strip())
            token.clear()
        else:
            token.append(ch)
    tail = "".join(token).strip()
    if tail:
        groups.append(tail)
    return groups


def group_is_dead(group: str) -> bool:
    return any(class_name in DEAD_CLASSES for class_name in CLASS_RE.findall(group))


def scan_rules(text: str, start: int = 0, end: int | None = None):
    if end is None:
        end = len(text)
    rules = []
    i = start
    while i < end:
        while i < end:
            if text.startswith("/*", i):
                i = skip_comment(text, i)
                continue
            if text[i].isspace():
                i += 1
                continue
            break
        if i >= end:
            break

        header_start = i
        quote = ""
        while i < end:
            if not quote and text.startswith("/*", i):
                i = skip_comment(text, i)
                continue
            ch = text[i]
            if quote:
                if ch == "\\":
                    i += 2
                    continue
                if ch == quote:
                    quote = ""
            elif ch in {'"', "'"}:
                quote = ch
            elif ch == ";":
                i += 1
                break
            elif ch == "{":
                header_raw = text[header_start:i]
                header = re.sub(r"\s+", " ", header_raw).strip()
                close = find_block_end(text, i)
                if header.startswith("@"):
                    if header.lower().startswith(("@media", "@supports", "@layer", "@container")):
                        rules.extend(scan_rules(text, i + 1, close))
                else:
                    rules.append(
                        {
                            "start": header_start,
                            "header_end": i,
                            "end": close + 1,
                            "header": header,
                            "header_raw": header_raw,
                        }
                    )
                i = close + 1
                break
            i += 1
    return rules


def format_live_selector(header_raw: str, live_groups: list[str]) -> str:
    indent_match = re.match(r"\s*", header_raw)
    indent = indent_match.group(0) if indent_match else ""
    multiline = "\n" in header_raw
    if multiline:
        return indent + (",\n" + indent).join(live_groups) + " "
    return indent + ", ".join(live_groups) + " "


def main() -> None:
    text = CSS_PATH.read_text(encoding="utf-8")
    rules = scan_rules(text)
    edits: list[tuple[int, int, str]] = []
    full_removed = 0
    partial_rules = 0
    partial_groups = 0

    for rule in rules:
        groups = split_selector_groups(rule["header"])
        dead_flags = [group_is_dead(group) for group in groups]
        if not any(dead_flags):
            continue
        if all(dead_flags):
            start = rule["start"]
            end = rule["end"]
            while end < len(text) and text[end] in " \t":
                end += 1
            if end < len(text) and text[end] == "\r":
                end += 1
            if end < len(text) and text[end] == "\n":
                end += 1
            edits.append((start, end, ""))
            full_removed += 1
            continue

        live_groups = [group for group, dead in zip(groups, dead_flags) if not dead]
        removed_here = sum(dead_flags)
        edits.append(
            (
                rule["start"],
                rule["header_end"],
                format_live_selector(rule["header_raw"], live_groups),
            )
        )
        partial_rules += 1
        partial_groups += removed_here

    if full_removed != EXPECTED_FULL_RULES:
        raise RuntimeError(f"expected {EXPECTED_FULL_RULES} fully dead rules, found {full_removed}")
    if partial_rules != EXPECTED_PARTIAL_RULES:
        raise RuntimeError(f"expected {EXPECTED_PARTIAL_RULES} partial rules, found {partial_rules}")
    if partial_groups != EXPECTED_PARTIAL_GROUPS:
        raise RuntimeError(f"expected {EXPECTED_PARTIAL_GROUPS} dead selector groups in partial rules, found {partial_groups}")

    for start, end, replacement in sorted(edits, reverse=True):
        text = text[:start] + replacement + text[end:]

    remaining = sorted(
        class_name
        for class_name in DEAD_CLASSES
        if re.search(rf"\.{re.escape(class_name)}(?![A-Za-z0-9_-])", text)
    )
    if remaining:
        raise RuntimeError(f"legacy selector families remain after pruning: {remaining}")

    text = re.sub(r"\n{3,}", "\n\n", text).rstrip() + "\n"
    CSS_PATH.write_text(text, encoding="utf-8")
    print(
        f"Pruned {full_removed} fully dead rules and {partial_groups} dead selector groups "
        f"across {partial_rules} mixed rules from style.css."
    )


if __name__ == "__main__":
    main()
