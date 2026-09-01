#!/usr/bin/env python3
"""Remove unreachable and semantically dead legacy rules from home.css."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS = ROOT / "assets/css/home.css"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


def main() -> None:
    text = CSS.read_text(encoding="utf-8")
    before = len(text.splitlines())

    for block, label in (
        (
            ".article-list {\n  grid-template-columns: repeat(auto-fit, minmax(340px, 520px));\n  align-items: stretch;\n}\n\n",
            "legacy article-list grid",
        ),
        (
            ".article-card {\n  width: 100%;\n  max-width: 520px;\n  min-height: 190px;\n}\n\n",
            "unused article-card",
        ),
        (
            "  .article-list {\n    grid-template-columns: repeat(auto-fit, minmax(300px, 520px));\n  }\n",
            "legacy mobile article-list grid",
        ),
        (
            ".secondary-article-title {\n  font-size: 14px;\n  line-height: 1.45;\n  font-weight: 700;\n  color: rgba(245, 248, 255, 0.94);\n}\n\n",
            "unused secondary article title",
        ),
        (
            ".secondary-article-desc {\n  font-size: 12px;\n  line-height: 1.55;\n  color: rgba(214, 225, 255, 0.66);\n  display: -webkit-box;\n  -webkit-line-clamp: 2;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n}\n\n",
            "unused secondary article description",
        ),
        (
            ".inline-article.article {\n  padding: clamp(20px, 3.5vw, 46px);\n  max-width: none;\n}\n\n.inline-article.article h1:first-child,\n.inline-article.article h2:first-child {\n  margin-top: 0;\n}\n\n.inline-article .article-meta,\n.inline-article .article-lead {\n  max-width: 860px;\n}\n\n.inline-article img {\n  max-width: 100%;\n  height: auto;\n}\n\n",
            "unused inline-article legacy rules",
        ),
        (
            ".secondary-article-title,\n.secondary-article-desc {\n  display: none !important;\n}\n\n",
            "unused hidden secondary article metadata",
        ),
    ):
        text = replace_once(text, block, "", label)

    text = replace_once(
        text,
        ".secondary-article-link {\n  gap: 5px;\n",
        ".secondary-article-link {\n",
        "secondary article block gap",
    )

    after = len(text.splitlines())
    CSS.write_text(text, encoding="utf-8")
    print(f"home.css: {before} -> {after} lines")
    print("Removed unreachable legacy classes and layout declarations made inert by the current block-based reader.")


if __name__ == "__main__":
    main()
