#!/usr/bin/env python3
"""Lower remaining obsolete selector specificity in home.css."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS = ROOT / "assets/css/home.css"

REPLACEMENTS = (
    (
        ".home-content,\n.content {\n  max-width: none;\n}\n",
        ".home-content {\n  max-width: none;\n}\n",
        "duplicate content/home-content selector",
    ),
    (
        ".home-content .home-panel {\n  min-height: calc(100vh - 48px);\n}\n",
        ".home-panel {\n  min-height: calc(100vh - 48px);\n}\n",
        "root home-panel wrapper",
    ),
)


def main() -> None:
    text = CSS.read_text(encoding="utf-8")
    for old, new, label in REPLACEMENTS:
        count = text.count(old)
        if count != 1:
            raise RuntimeError(f"{label}: expected exactly one match, found {count}")
        text = text.replace(old, new, 1)
    CSS.write_text(text, encoding="utf-8")
    print(f"Simplified {len(REPLACEMENTS)} remaining high-specificity selector forms in home.css.")


if __name__ == "__main__":
    main()
