#!/usr/bin/env python3
"""Build this article from its public Markdown source using the site template.

Run from the repository root:
  python articles/soc-linux/linux-basic/linux-sd-card-format-copy/scripts/build_linux_sd_card_format_copy_article.py
Then synchronize cache versions with scripts/bump_cache_version_from_git.py.

Only the Markdown constructs used by this article are supported. No third-party
packages, network access, raw HTML, or remote assets are needed.
"""
from __future__ import annotations

import argparse
import html
import os
import re
from pathlib import Path
from urllib.parse import urlsplit

ARTICLE = Path(__file__).resolve().parents[1]
ROOT = ARTICLE.parents[3]
SOURCE = ARTICLE / "docs" / "linux-sd-card-format-copy.md"
OUTPUT = ARTICLE / "linux-sd-card-format-copy.html"
INLINE = re.compile(r"\x60([^\x60]+)\x60|\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)")


def inline(text: str) -> str:
    parts: list[str] = []
    offset = 0
    for match in INLINE.finditer(text):
        parts.append(html.escape(text[offset:match.start()]))
        if match.group(1) is not None:
            parts.append("<code>" + html.escape(match.group(1)) + "</code>")
        elif match.group(2) is not None:
            parts.append("<strong>" + html.escape(match.group(2)) + "</strong>")
        else:
            url = match.group(4)
            if urlsplit(url).scheme not in {"", "https", "http"}:
                raise ValueError("Unsupported link scheme")
            parts.append(
                '<a href="' + html.escape(url, quote=True) + '">'
                + html.escape(match.group(3)) + "</a>"
            )
        offset = match.end()
    parts.append(html.escape(text[offset:]))
    return "".join(parts)


def cells(line: str) -> list[str]:
    return [value.strip() for value in line.strip().strip("|").split("|")]


def render(lines: list[str]) -> str:
    output: list[str] = []
    index = 0
    while index < len(lines):
        line = lines[index]
        if not line.strip():
            index += 1
            continue
        if line.startswith("\x60\x60\x60"):
            language = line[3:].strip()
            if not re.fullmatch(r"[a-z0-9-]*", language):
                raise ValueError("Invalid fenced code language")
            index += 1
            code: list[str] = []
            while index < len(lines) and lines[index] != "\x60\x60\x60":
                code.append(lines[index])
                index += 1
            if index == len(lines):
                raise ValueError("Unclosed fenced code block")
            output.append(
                '<pre><code class="language-' + language + '">'
                + html.escape("\n".join(code) + "\n") + "</code></pre>"
            )
            index += 1
            continue
        heading = re.fullmatch(r"(#{2,3}) (.+)", line)
        if heading:
            level = len(heading.group(1))
            output.append(f"<h{level}>" + inline(heading.group(2)) + f"</h{level}>")
            index += 1
            continue
        if line.startswith("#"):
            raise ValueError("Only h2 and h3 are supported in the body")
        if line.startswith("|"):
            headers = cells(line)
            index += 1
            if index == len(lines) or not all(
                re.fullmatch(r":?-{3,}:?", cell) for cell in cells(lines[index])
            ):
                raise ValueError("Missing Markdown table separator")
            if len(cells(lines[index])) != len(headers):
                raise ValueError("Table separator width does not match")
            output.append("<table><thead><tr>" + "".join(
                '<th scope="col">' + inline(cell) + "</th>" for cell in headers
            ) + "</tr></thead><tbody>")
            index += 1
            while index < len(lines) and lines[index].startswith("|"):
                row = cells(lines[index])
                if len(row) != len(headers):
                    raise ValueError("Table row width does not match")
                output.append("<tr>" + "".join(
                    "<td>" + inline(cell) + "</td>" for cell in row
                ) + "</tr>")
                index += 1
            output.append("</tbody></table>")
            continue
        if line.startswith("- "):
            output.append("<ul>")
            while index < len(lines) and lines[index].startswith("- "):
                output.append("<li>" + inline(lines[index][2:]) + "</li>")
                index += 1
            output.append("</ul>")
            continue
        if line.startswith("> "):
            quote: list[str] = []
            while index < len(lines) and lines[index].startswith("> "):
                quote.append(lines[index][2:])
                index += 1
            output.append("<blockquote><p>" + inline(" ".join(quote)) + "</p></blockquote>")
            continue
        paragraph: list[str] = []
        while index < len(lines) and lines[index].strip():
            if paragraph and lines[index].startswith(("#", "\x60\x60\x60", "|", "- ", "> ")):
                break
            paragraph.append(lines[index])
            index += 1
        output.append("<p>" + inline(" ".join(paragraph)) + "</p>")
    return "\n".join("      " + block for block in output)


def build() -> str:
    lines = SOURCE.read_text(encoding="utf-8").splitlines()
    if not lines or not lines[0].startswith("# "):
        raise ValueError("The source must start with one h1 title")
    title = lines[0][2:]
    summary_index = next(i for i in range(1, len(lines)) if lines[i].strip())
    summary = lines[summary_index]
    body = render(lines[summary_index + 1:])
    prefix = Path(os.path.relpath(ROOT, ARTICLE)).as_posix() + "/"
    template = (ROOT / "articles" / "templates" / "article-template.html").read_text(encoding="utf-8")
    values = {
        "ROOT": prefix,
        "TITLE": html.escape(title),
        "DESCRIPTION": html.escape(summary, quote=True),
        "TOPIC": "soc-linux",
        "CATEGORY": "linux-basic",
        "META": "SOC/Linux开发 · Linux基础 · 2026-10-19",
    }
    for key, value in values.items():
        template = template.replace("{{" + key + "}}", value)
    start = template.index("      <!-- 本文图片")
    end = template.index('      <div class="article-footer">', start)
    rendered = template[:start] + body + "\n\n" + template[end:]
    if re.search(r"\{\{[A-Z_]+\}\}", rendered):
        raise ValueError("Unresolved template token")
    return rendered


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    result = build()
    if args.check:
        current = OUTPUT.read_text(encoding="utf-8")
        normalized = re.sub(r"\?v=[a-f0-9]{12}", "", current)
        if normalized != result:
            print("Article HTML differs from its Markdown source.")
            return 1
        print("Article HTML matches its Markdown source.")
        return 0
    OUTPUT.write_text(result, encoding="utf-8", newline="\n")
    print(f"Built {OUTPUT.relative_to(ROOT).as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
