#!/usr/bin/env python3
"""Move homepage-only CSS from style.css into home.css without changing cascade order."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STYLE = ROOT / "assets/css/style.css"
HOME = ROOT / "assets/css/home.css"


def extract_between(text: str, start_marker: str, end_marker: str) -> tuple[str, str]:
    start = text.index(start_marker)
    end = text.index(end_marker, start)
    return text[:start] + text[end:], text[start:end]


def find_block_end(text: str, open_index: int) -> int:
    depth = 1
    quote = ""
    i = open_index + 1
    while i < len(text):
        if not quote and text.startswith("/*", i):
            end = text.find("*/", i + 2)
            i = len(text) if end < 0 else end + 2
            continue
        ch = text[i]
        if quote:
            if ch == "\\":
                i += 2
                continue
            if ch == quote:
                quote = ""
        elif ch in {'\"', "'"}:
            quote = ch
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    raise RuntimeError("unclosed CSS block")


def extract_media_containing(text: str, media_header: str, needle: str) -> tuple[str, str]:
    search_from = 0
    while True:
        start = text.find(media_header, search_from)
        if start < 0:
            raise RuntimeError(f"missing media block {media_header!r} containing {needle!r}")
        open_index = text.find("{", start)
        close_index = find_block_end(text, open_index)
        block = text[start:close_index + 1]
        if needle in block:
            before = text[:start].rstrip() + "\n\n"
            after = text[close_index + 1:].lstrip("\n")
            return before + after, block
        search_from = close_index + 1


def extract_home_prefix_from_1280(text: str) -> tuple[str, str]:
    header = "@media (max-width: 1280px)"
    start = text.index(header)
    open_index = text.index("{", start)
    close_index = find_block_end(text, open_index)
    body = text[open_index + 1:close_index]
    split = body.index("  .page-shell {")
    home_body = body[:split].rstrip()
    remaining_body = body[split:].strip("\n")
    replacement = f"{header} {{\n{remaining_body}\n}}"
    new_text = text[:start] + replacement + text[close_index + 1:]
    extracted = f"{header} {{\n{home_body}\n}}"
    return new_text, extracted


def main() -> int:
    style = STYLE.read_text(encoding="utf-8")
    home = HOME.read_text(encoding="utf-8")

    style, base = extract_between(style, ".home-shell {", ".page-shell {")

    old_focus = ".primary-nav-button:focus-visible,\n.secondary-nav-button:focus-visible,\nbutton:focus-visible,\na:focus-visible {"
    new_focus = "button:focus-visible,\na:focus-visible {"
    if old_focus not in style:
        raise RuntimeError("homepage focus selector group not found in style.css")
    style = style.replace(old_focus, new_focus, 1)
    home_focus = ".primary-nav-button:focus-visible,\n.secondary-nav-button:focus-visible {\n  outline: 2px solid var(--accent);\n  outline-offset: 3px;\n}"

    style, media_1280 = extract_home_prefix_from_1280(style)
    style, media_900 = extract_media_containing(style, "@media (max-width: 900px)", ".home-shell")
    style, media_640 = extract_media_containing(style, "@media (max-width: 640px)", ".home-shell")

    prelude = "\n\n".join(
        [
            "/* 首页专属基础布局与导航：从公共 style.css 收口，保持原始级联顺序。 */\n" + base.strip(),
            home_focus,
            media_1280.strip(),
            media_900.strip(),
            media_640.strip(),
        ]
    )

    if "首页专属基础布局与导航：从公共 style.css 收口" in home:
        raise RuntimeError("home.css already contains migrated homepage base rules")

    STYLE.write_text(style.rstrip() + "\n", encoding="utf-8", newline="\n")
    HOME.write_text(prelude + "\n\n" + home.lstrip(), encoding="utf-8", newline="\n")

    forbidden = (
        ".home-shell",
        ".primary-sidebar",
        ".secondary-sidebar",
        ".profile-compact",
        ".primary-nav",
        ".secondary-nav",
        ".home-content",
        ".home-panel",
        ".article-list",
        ".empty",
    )
    migrated_style = STYLE.read_text(encoding="utf-8")
    leftovers = [token for token in forbidden if token in migrated_style]
    if leftovers:
        raise RuntimeError(f"homepage selectors remain in style.css: {', '.join(leftovers)}")

    print("Migrated homepage-only CSS ownership into home.css.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
