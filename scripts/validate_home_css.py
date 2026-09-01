#!/usr/bin/env python3
"""Validate home.css for dead declarations hidden by later identical selectors."""

from __future__ import annotations

import re
from collections import defaultdict
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


def scan_rules(text: str, start: int = 0, end: int | None = None, scope: str = "root"):
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
            char = text[i]
            if quote:
                if char == "\\":
                    i += 2
                    continue
                if char == quote:
                    quote = ""
            elif char in {'"', "'"}:
                quote = char
            elif char == ";":
                i += 1
                break
            elif char == "{":
                header = re.sub(r"\s+", " ", text[header_start:i]).strip()
                close = find_block_end(text, i)
                if header.startswith("@"):
                    if header.lower().startswith(("@media", "@supports", "@layer", "@container")):
                        rules.extend(scan_rules(text, i + 1, close, f"{scope} > {header}"))
                else:
                    rules.append({
                        "selector": header,
                        "scope": scope,
                        "body": text[i + 1:close],
                        "line": text.count("\n", 0, header_start) + 1,
                    })
                i = close + 1
                break
            i += 1
    return rules


def parse_declarations(body: str):
    declarations = []
    token = []
    quote = ""
    paren_depth = 0
    i = 0

    def flush() -> None:
        raw = "".join(token).strip()
        token.clear()
        if not raw or ":" not in raw:
            return
        name, value = raw.split(":", 1)
        name = name.strip().lower()
        value = value.strip()
        if not name:
            return
        important = bool(re.search(r"!important\s*$", value, flags=re.I))
        declarations.append((name, important))

    while i < len(body):
        if not quote and body.startswith("/*", i):
            i = skip_comment(body, i)
            continue
        char = body[i]
        if quote:
            token.append(char)
            if char == "\\" and i + 1 < len(body):
                i += 1
                token.append(body[i])
            elif char == quote:
                quote = ""
        elif char in {'"', "'"}:
            quote = char
            token.append(char)
        elif char == "(":
            paren_depth += 1
            token.append(char)
        elif char == ")":
            paren_depth = max(0, paren_depth - 1)
            token.append(char)
        elif char == ";" and paren_depth == 0:
            flush()
        else:
            token.append(char)
        i += 1
    flush()
    return declarations


def main() -> int:
    text = CSS.read_text(encoding="utf-8")
    rules = scan_rules(text)
    groups = defaultdict(list)
    for rule in rules:
        rule["declarations"] = parse_declarations(rule["body"])
        groups[(rule["scope"], rule["selector"])].append(rule)

    errors = []
    for (scope, selector), occurrences in groups.items():
        if len(occurrences) < 2:
            continue
        for index, earlier in enumerate(occurrences[:-1]):
            later_occurrences = occurrences[index + 1:]
            for prop, earlier_important in earlier["declarations"]:
                for later in later_occurrences:
                    later_matches = [important for later_prop, important in later["declarations"] if later_prop == prop]
                    if not later_matches:
                        continue
                    # Same selector + same effective conditional scope: later normal overrides
                    # earlier normal; later !important overrides both normal and !important.
                    if any(important or not earlier_important for important in later_matches):
                        errors.append(
                            f"dead declaration: {selector} [{scope}] line {earlier['line']} property '{prop}' "
                            f"is overridden by the same selector at line {later['line']}"
                        )
                        break

    if "Consolidated from " in text:
        errors.append("home.css still contains migration-history comments ('Consolidated from ...')")

    if errors:
        print("Home CSS validation failed:")
        for error in errors:
            print(f"  - {error}")
        return 1

    print("Home CSS validation passed: no dead same-selector declarations found.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
