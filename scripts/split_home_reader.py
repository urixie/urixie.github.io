#!/usr/bin/env python3
"""Split inline article reader logic out of assets/js/home.js."""

from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HOME_JS = ROOT / "assets/js/home.js"
READER_JS = ROOT / "assets/js/article-reader.js"
INDEX = ROOT / "index.html"
VALIDATOR = ROOT / "scripts/validate_site_structure.py"

MOVED_FUNCTIONS = [
    "isAbsoluteOrSpecialUrl",
    "getDirectoryPath",
    "resolveRelativeUrl",
    "extractArticleSourceFromRoute",
    "getCleanArticleRoot",
    "fetchInlineArticleRoot",
    "isSkippableArticleNode",
    "getSectionTitle",
    "getSectionId",
    "cloneNodes",
    "createSectionFromContainer",
    "extractDirectSectionBlocks",
    "extractSiblingSections",
    "extractDeepSections",
    "extractFullArticle",
    "extractArticleSections",
    "renderSectionInto",
    "createSectionedArticleReader",
]

FUNCTION_RE = re.compile(r"(?m)^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(")


def split_functions(text: str) -> tuple[str, str]:
    matches = list(FUNCTION_RE.finditer(text))
    positions = {match.group(1): (match.start(), matches[index + 1].start() if index + 1 < len(matches) else len(text))
                 for index, match in enumerate(matches)}

    missing = [name for name in MOVED_FUNCTIONS if name not in positions]
    if missing:
        raise RuntimeError(f"home.js missing reader functions: {', '.join(missing)}")

    blocks = []
    spans = []
    for name in MOVED_FUNCTIONS:
        start, end = positions[name]
        blocks.append(text[start:end].rstrip())
        spans.append((start, end))

    next_home = text
    for start, end in sorted(spans, reverse=True):
        next_home = next_home[:start] + next_home[end:]

    next_home = re.sub(r"\n{3,}", "\n\n", next_home).strip() + "\n"
    reader = (
        "/* Inline article loading and section reader. Loaded after main.js and before home.js. */\n\n"
        + "\n\n".join(blocks)
        + "\n\nwindow.articleReader = {\n"
        + "  fetchInlineArticleRoot,\n"
        + "  createSectionedArticleReader\n"
        + "};\n"
    )
    return next_home, reader


def update_home(text: str) -> str:
    text = text.replace(
        "    const articleRoot = await fetchInlineArticleRoot(article);\n"
        "    articleList.replaceChildren(createSectionedArticleReader(articleRoot));",
        "    const articleRoot = await window.articleReader.fetchInlineArticleRoot(article);\n"
        "    articleList.replaceChildren(window.articleReader.createSectionedArticleReader(articleRoot));",
    )
    direct_fetch = re.search(r"(?<![.\w])fetchInlineArticleRoot\s*\(", text)
    direct_create = re.search(r"(?<![.\w])createSectionedArticleReader\s*\(", text)
    if direct_fetch or direct_create:
        raise RuntimeError("home.js still contains unqualified reader calls")
    return text


def update_index(text: str) -> str:
    old = (
        '  <script src="assets/js/main.js?v=20260901-homecss"></script>\n'
        '  <script src="assets/js/home.js?v=20260901-homecss"></script>'
    )
    new = (
        '  <script src="assets/js/main.js?v=20260901-reader"></script>\n'
        '  <script src="assets/js/article-reader.js?v=20260901-reader"></script>\n'
        '  <script src="assets/js/home.js?v=20260901-reader"></script>'
    )
    if old not in text:
        raise RuntimeError("index.html main/home script sequence not found")
    text = text.replace(old, new)
    text = text.replace("20260901-homecss", "20260901-reader")
    return text


def update_validator(text: str) -> str:
    text = text.replace(
        'HOME_DATA = ROOT / "assets/js/home-data.js"\n',
        'HOME_DATA = ROOT / "assets/js/home-data.js"\nARTICLE_READER = ROOT / "assets/js/article-reader.js"\n',
    )
    text = text.replace(
        '        "assets/js/main.js",\n        "assets/js/home.js",',
        '        "assets/js/main.js",\n        "assets/js/article-reader.js",\n        "assets/js/home.js",',
    )
    text = text.replace(
        '    main_js = (ROOT / "assets/js/main.js").read_text(encoding="utf-8")\n'
        '    home_js = (ROOT / "assets/js/home.js").read_text(encoding="utf-8")\n',
        '    main_js = (ROOT / "assets/js/main.js").read_text(encoding="utf-8")\n'
        '    reader_js = ARTICLE_READER.read_text(encoding="utf-8") if ARTICLE_READER.is_file() else ""\n'
        '    home_js = (ROOT / "assets/js/home.js").read_text(encoding="utf-8")\n',
    )
    text = text.replace(
        '    if "legacyHomeHashMap" in home_js:\n'
        '        errors.append("javascript layout: home.js must consume legacy-routes.js instead of duplicating legacy routes")\n',
        '    if "legacyHomeHashMap" in home_js:\n'
        '        errors.append("javascript layout: home.js must consume legacy-routes.js instead of duplicating legacy routes")\n'
        '    if "fetchInlineArticleRoot" in home_js or "extractArticleSections" in home_js:\n'
        '        errors.append("javascript layout: home.js must not contain article reader implementation")\n'
        '    if "window.articleReader" not in reader_js or "createSectionedArticleReader" not in reader_js:\n'
        '        errors.append("javascript layout: article-reader.js must own inline article reader implementation")\n'
        '    if "initCopyButtons" not in reader_js or "enhanceArticleImageZoom" not in reader_js:\n'
        '        errors.append("javascript layout: article-reader.js must reuse article enhancements from main.js")\n',
    )
    text = text.replace(
        '    for required in (HOME_DATA, LEGACY_ROUTES, INDEX):',
        '    for required in (HOME_DATA, ARTICLE_READER, LEGACY_ROUTES, INDEX):',
    )
    return text


def main() -> None:
    home_text = HOME_JS.read_text(encoding="utf-8")
    next_home, reader_text = split_functions(home_text)
    next_home = update_home(next_home)

    HOME_JS.write_text(next_home, encoding="utf-8")
    READER_JS.write_text(reader_text, encoding="utf-8")
    INDEX.write_text(update_index(INDEX.read_text(encoding="utf-8")), encoding="utf-8")
    VALIDATOR.write_text(update_validator(VALIDATOR.read_text(encoding="utf-8")), encoding="utf-8")

    print(f"home.js: {len(home_text.splitlines())} -> {len(next_home.splitlines())} lines")
    print(f"article-reader.js: {len(reader_text.splitlines())} lines")


if __name__ == "__main__":
    main()
