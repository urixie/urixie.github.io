#!/usr/bin/env python3
"""Audit assets/css/home.css for consolidation opportunities without modifying it."""

from __future__ import annotations

import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS = ROOT / "assets/css/home.css"


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
        c = text[i]
        if quote:
            if c == "\\":
                i += 2
                continue
            if c == quote:
                quote = ""
        elif c in {'"', "'"}:
            quote = c
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    raise RuntimeError("unclosed CSS block")


def scan_items(text: str, start: int = 0, end: int | None = None, scope: str = "root"):
    if end is None:
        end = len(text)
    items = []
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
            c = text[i]
            if quote:
                if c == "\\":
                    i += 2
                    continue
                if c == quote:
                    quote = ""
            elif c in {'"', "'"}:
                quote = c
            elif c == ";":
                i += 1
                break
            elif c == "{":
                header = re.sub(r"\s+", " ", text[header_start:i]).strip()
                close = find_block_end(text, i)
                kind = "at" if header.startswith("@") else "rule"
                item = {
                    "kind": kind,
                    "header": header,
                    "start": header_start,
                    "open": i,
                    "end": close + 1,
                    "scope": scope,
                    "start_line": text.count("\n", 0, header_start) + 1,
                    "end_line": text.count("\n", 0, close) + 1,
                }
                items.append(item)
                if kind == "at" and header.lower().startswith(("@media", "@supports", "@layer", "@container")):
                    child_scope = f"{scope} > {header}"
                    items.extend(scan_items(text, i + 1, close, child_scope))
                i = close + 1
                break
            i += 1
    return items


def main() -> None:
    text = CSS.read_text(encoding="utf-8")
    items = scan_items(text)
    rules = [i for i in items if i["kind"] == "rule"]
    ats = [i for i in items if i["kind"] == "at"]

    by_scope_selector = defaultdict(list)
    for rule in rules:
        by_scope_selector[(rule["scope"], rule["header"])].append(rule)

    repeated = [(key, value) for key, value in by_scope_selector.items() if len(value) > 1]
    repeated.sort(key=lambda kv: (-len(kv[1]), kv[0][0], kv[0][1]))

    root_items = [i for i in items if i["scope"] == "root"]
    adjacent_same = []
    for a, b in zip(root_items, root_items[1:]):
        if a["kind"] == b["kind"] == "rule" and a["header"] == b["header"]:
            adjacent_same.append((a, b))

    media_counts = Counter(
        i["header"] for i in ats
        if i["scope"] == "root" and i["header"].lower().startswith("@media")
    )

    print(f"home.css lines: {len(text.splitlines())}")
    print(f"rules: {len(rules)}; at-rules: {len(ats)}")
    print(f"repeated selector/scope groups: {len(repeated)}")
    print(f"adjacent identical selector pairs at root: {len(adjacent_same)}")
    print("\nTop repeated selector groups:")
    for (scope, selector), occurrences in repeated[:60]:
        lines = ", ".join(str(o["start_line"]) for o in occurrences)
        print(f"  {len(occurrences)}x | {scope} | {selector} | lines {lines}")

    print("\nRepeated top-level media blocks:")
    for media, count in media_counts.most_common():
        if count > 1:
            print(f"  {count}x | {media}")

    if adjacent_same:
        print("\nAdjacent identical selector pairs:")
        for a, b in adjacent_same:
            print(f"  {a['header']} | lines {a['start_line']} and {b['start_line']}")


if __name__ == "__main__":
    main()
