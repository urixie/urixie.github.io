#!/usr/bin/env python3
"""Consolidate provably equivalent duplicate home.css breakpoint blocks."""

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
    before_lines = len(text.splitlines())

    text = replace_once(
        text,
        """@media (min-width: 981px) {
  .home-content .home-panel {
    gap: 0;
  }
}

""",
        "",
        "standalone desktop home-panel gap block",
    )
    text = replace_once(
        text,
        """  .home-content .home-panel {
    box-sizing: border-box !important;
""",
        """  .home-content .home-panel {
    box-sizing: border-box !important;
    gap: 0;
""",
        "desktop home-panel gap insertion",
    )

    text = replace_once(
        text,
        """  .home-content {
    margin-left: 22px;
  }
}

@media (min-width: 901px) and (max-width: 1400px) {
""",
        """  .home-content {
    margin-left: 22px;
  }

  .secondary-nav {
    margin-top: 0 !important;
  }
}

@media (min-width: 901px) and (max-width: 1400px) {
""",
        "desktop navigation block merge",
    )
    text = replace_once(
        text,
        """/* 首页：二级导航目录整体上移，删除 secondary-head 占用的间距。 */
@media (min-width: 901px) {
  .secondary-nav {
    margin-top: 0 !important;
  }
}

""",
        "",
        "redundant >=901px secondary-nav block",
    )

    text = replace_once(
        text,
        """  .inline-section-nav {
    position: static !important;
    height: 100% !important;
    max-height: 100% !important;
    min-height: 0 !important;
    overflow: hidden !important;
    border-top-left-radius: 0 !important;
    border-bottom-left-radius: 0 !important;
  }
}

/* 桌面端让文章目录紧贴二级导航；目录与正文之间仍保持独立列间距。 */
@media (min-width: 981px) {
  .content.home-content,
  .home-content {
    margin-left: 0 !important;
  }

  .inline-article-reader {
    padding-left: 0 !important;
    padding-right: 0 !important;
    column-gap: clamp(18px, 2.4vw, 32px) !important;
  }
}
""",
        """  .inline-section-nav {
    position: static !important;
    height: 100% !important;
    max-height: 100% !important;
    min-height: 0 !important;
    overflow: hidden !important;
    border-top-left-radius: 0 !important;
    border-bottom-left-radius: 0 !important;
  }

  .content.home-content,
  .home-content {
    margin-left: 0 !important;
  }

  .inline-article-reader {
    padding-left: 0 !important;
    padding-right: 0 !important;
    column-gap: clamp(18px, 2.4vw, 32px) !important;
  }
}
""",
        "adjacent >=981px reader block merge",
    )

    after_lines = len(text.splitlines())
    CSS.write_text(text, encoding="utf-8")
    print(f"home.css: {before_lines} -> {after_lines} lines")
    print("Merged duplicate >=901px and >=981px breakpoint blocks without moving conflicting declarations.")


if __name__ == "__main__":
    main()
