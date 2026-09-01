#!/usr/bin/env python3
"""Lower obsolete selector specificity in home.css without changing declaration values."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS = ROOT / "assets/css/home.css"

REPLACEMENTS = (
    ("  .content.home-content {\n", "  .home-content {\n", "content.home-content"),
    ("  .home-content .home-panel {\n", "  .home-panel {\n", "home-panel wrapper"),
    ("  .home-content .section-title {\n", "  .section-title {\n", "section-title wrapper"),
    ("  .home-content .section-title h2 {\n", "  .section-title h2 {\n", "section-title h2 wrapper"),
    ("  .home-content .article-list {\n", "  .article-list {\n", "article-list wrapper"),
    ("  .content.home-content,\n  .home-content {\n", "  .home-content {\n", "duplicate home-content selector"),
)


def main() -> None:
    text = CSS.read_text(encoding="utf-8")
    for old, new, label in REPLACEMENTS:
        count = text.count(old)
        if count != 1:
            raise RuntimeError(f"{label}: expected exactly one match, found {count}")
        text = text.replace(old, new, 1)
    CSS.write_text(text, encoding="utf-8")
    print(f"Simplified {len(REPLACEMENTS)} high-specificity selector forms in home.css.")


if __name__ == "__main__":
    main()
