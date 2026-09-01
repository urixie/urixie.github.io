#!/usr/bin/env python3
"""Report style.css selectors that have no runtime references in repository HTML/JS."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS_PATH = ROOT / "assets/css/style.css"
RUNTIME_SUFFIXES = {".html", ".js"}

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


def main() -> int:
    css = CSS_PATH.read_text(encoding="utf-8")
    runtime_files = [
        path
        for path in ROOT.rglob("*")
        if path.is_file()
        and path.suffix.lower() in RUNTIME_SUFFIXES
        and ".git" not in path.parts
    ]
    corpus = "\n".join(path.read_text(encoding="utf-8", errors="ignore") for path in runtime_files)

    rules = scan_rules(css)
    dead_rules = []
    partial = []
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

    for rule in rules:
        groups = selector_groups(rule["selector"])
        group_states = []
        for group in groups:
            tokens = [(m.group("kind"), m.group("name")) for m in CLASS_OR_ID_RE.finditer(group)]
            if not tokens:
                group_states.append((group, None, []))
                continue
            refs = [(kind, name, token_is_referenced(kind, name)) for kind, name in tokens]
            live = any(ref for _, _, ref in refs)
            group_states.append((group, live, refs))

        actionable = [state for state in group_states if state[1] is not None]
        if actionable and all(state[1] is False for state in actionable) and len(actionable) == len(group_states):
            dead_rules.append((rule, group_states))
        elif any(state[1] is False for state in actionable):
            partial.append((rule, group_states))

    print(f"Scanned {len(rules)} style.css rules against {len(runtime_files)} HTML/JS files.")
    print(f"Fully dead candidate rules: {len(dead_rules)}")
    for rule, states in dead_rules:
        tokens = sorted({f"{kind}{name}" for _, _, refs in states for kind, name, _ in refs})
        print(f"DEAD line {rule['line']:>4} [{rule['scope']}] {rule['selector']} :: {', '.join(tokens)}")

    print(f"Partially dead selector groups: {len(partial)}")
    for rule, states in partial:
        dead_groups = [group for group, live, _ in states if live is False]
        if dead_groups:
            print(f"PARTIAL line {rule['line']:>4} [{rule['scope']}] dead={dead_groups} full={rule['selector']}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
