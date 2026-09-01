#!/usr/bin/env python3
"""Fail when style.css contains selectors with no production HTML/JS references."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS_PATH = ROOT / "assets/css/style.css"
RUNTIME_SUFFIXES = {".html", ".js"}
EXCLUDED_TOP_LEVEL = {"tests"}
CLASS_OR_ID_RE = re.compile(r"(?P<kind>[.#])(?P<name>[A-Za-z_][A-Za-z0-9_-]*)")


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
                header = re.sub(r"\s+", " ", text[header_start:i]).strip()
                close = find_block_end(text, i)
                if header.startswith("@"):
                    if header.lower().startswith(("@media", "@supports", "@layer", "@container")):
                        rules.extend(scan_rules(text, i + 1, close, f"{scope} > {header}"))
                else:
                    rules.append(
                        {
                            "selector": header,
                            "scope": scope,
                            "line": text.count("\n", 0, header_start) + 1,
                        }
                    )
                i = close + 1
                break
            i += 1
    return rules


def selector_groups(selector: str) -> list[str]:
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


def is_production_runtime_file(path: Path) -> bool:
    if not path.is_file() or path.suffix.lower() not in RUNTIME_SUFFIXES:
        return False
    relative = path.relative_to(ROOT)
    if relative.parts and relative.parts[0] in EXCLUDED_TOP_LEVEL:
        return False
    return ".git" not in relative.parts


def main() -> int:
    css = CSS_PATH.read_text(encoding="utf-8")
    runtime_files = [path for path in ROOT.rglob("*") if is_production_runtime_file(path)]
    corpus = "\n".join(path.read_text(encoding="utf-8", errors="ignore") for path in runtime_files)
    token_reference_cache: dict[tuple[str, str], bool] = {}

    def token_is_referenced(kind: str, name: str) -> bool:
        key = (kind, name)
        if key in token_reference_cache:
            return token_reference_cache[key]
        if kind == ".":
            patterns = (
                rf"class\s*=\s*['\"][^'\"]*\b{re.escape(name)}\b",
                rf"classList\.(?:add|remove|toggle|contains)\([^)]*['\"]{re.escape(name)}['\"]",
                rf"['\"]{re.escape(name)}['\"]",
                rf"\b{re.escape(name)}\b",
            )
        else:
            patterns = (
                rf"id\s*=\s*['\"]{re.escape(name)}['\"]",
                rf"getElementById\(['\"]{re.escape(name)}['\"]\)",
                rf"querySelector\([^)]*#{re.escape(name)}",
                rf"['\"]#{re.escape(name)}['\"]",
            )
        referenced = any(re.search(pattern, corpus) for pattern in patterns)
        token_reference_cache[key] = referenced
        return referenced

    errors = []
    rules = scan_rules(css)
    for rule in rules:
        groups = selector_groups(rule["selector"])
        group_states = []
        for group in groups:
            tokens = [(m.group("kind"), m.group("name")) for m in CLASS_OR_ID_RE.finditer(group)]
            if not tokens:
                group_states.append((group, None))
                continue
            live = any(token_is_referenced(kind, name) for kind, name in tokens)
            group_states.append((group, live))

        actionable = [state for state in group_states if state[1] is not None]
        if actionable and all(live is False for _, live in actionable) and len(actionable) == len(group_states):
            errors.append(
                f"dead rule: line {rule['line']} [{rule['scope']}] {rule['selector']}"
            )
            continue
        dead_groups = [group for group, live in actionable if live is False]
        if dead_groups:
            errors.append(
                f"dead selector branch: line {rule['line']} [{rule['scope']}] "
                f"{dead_groups!r} within {rule['selector']}"
            )

    if errors:
        print("Style CSS usage validation failed:")
        for error in errors:
            print(f"  - {error}")
        return 1

    print(
        f"Style CSS usage validation passed: {len(rules)} rules have production references "
        f"across {len(runtime_files)} HTML/JS files."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
