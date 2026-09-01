#!/usr/bin/env python3
"""Move shared article interaction styles from home.css into style.css unchanged."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HOME = ROOT / "assets/css/home.css"
STYLE = ROOT / "assets/css/style.css"
MARKER = "/* 代码块复制按钮悬浮在右上角，避免打断正文阅读节奏。 */"
REQUIRED = (
    ".code-block-wrap",
    ".copy-code-button",
    ".article-image-zoom-container",
    ".article-image-zoom-controls",
    ".article-image-zoom-control",
)


def main() -> None:
    home = HOME.read_text(encoding="utf-8")
    style = STYLE.read_text(encoding="utf-8")

    marker_index = home.find(MARKER)
    if marker_index < 0:
        raise RuntimeError("common article style marker not found in home.css")

    block = home[marker_index:].strip()
    for selector in REQUIRED:
        if selector not in block:
            raise RuntimeError(f"expected selector missing from migration block: {selector}")
        if selector in style:
            raise RuntimeError(f"selector already exists in style.css: {selector}")

    HOME.write_text(home[:marker_index].rstrip() + "\n", encoding="utf-8")
    STYLE.write_text(style.rstrip() + "\n\n" + block + "\n", encoding="utf-8")
    print(f"Moved {len(block.splitlines())} lines of shared article interaction CSS to style.css unchanged.")


if __name__ == "__main__":
    main()
