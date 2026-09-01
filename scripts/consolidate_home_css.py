#!/usr/bin/env python3
"""Remove provably dead home.css declarations without moving rule positions."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS = ROOT / "assets/css/home.css"
WORKFLOW = ROOT / ".github/workflows/noindex-check.yml"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


def update_css(text: str) -> str:
    # A later root rule sets max-width:none for this exact selector group.
    text = replace_once(
        text,
        ".home-content,\n.content {\n  max-width: 980px;\n}\n\n",
        "",
        "obsolete home content max-width",
    )

    # The later .secondary-article-link rule changes display to block in the same root scope.
    text = replace_once(
        text,
        ".secondary-article-link {\n  display: grid;\n  gap: 5px;",
        ".secondary-article-link {\n  gap: 5px;",
        "obsolete secondary article display",
    )

    # Within the same @media (min-width:981px) scope, the later fixed-scroll block
    # redefines these properties with !important. Keep only gap, which is not redefined.
    old_desktop_block = """@media (min-width: 981px) {
  .home-content .home-panel {
    height: calc(100dvh - 48px);
    min-height: 0;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0;
    overflow: hidden;
  }

  .home-content .section-title {
    flex: 0 0 auto;
    margin-bottom: 0;
    padding-bottom: 18px;
  }

  .home-content .article-list {
    min-height: 0;
    overflow: hidden;
  }
}
"""
    new_desktop_block = """@media (min-width: 981px) {
  .home-content .home-panel {
    gap: 0;
  }
}
"""
    text = replace_once(text, old_desktop_block, new_desktop_block, "obsolete desktop reader declarations")

    for legacy_name in (
        "home-layout-tuning.css",
        "inline-section-reader.css",
        "nav-compact-layout.css",
        "article-fixed-scroll-override.css",
    ):
        text = replace_once(
            text,
            f"/* Consolidated from {legacy_name}; keep section order stable. */\n",
            "",
            f"legacy migration comment {legacy_name}",
        )

    return text


def update_workflow(text: str) -> str:
    if "python scripts/validate_home_css.py" in text:
        return text
    needle = "      - name: 检查站点目录与路由一致性\n        run: python scripts/validate_site_structure.py"
    replacement = needle + "\n      - name: 检查首页 CSS 无效覆盖\n        run: python scripts/validate_home_css.py"
    return replace_once(text, needle, replacement, "static workflow css validator insertion")


def main() -> None:
    css_before = CSS.read_text(encoding="utf-8")
    css_after = update_css(css_before)
    CSS.write_text(css_after, encoding="utf-8")

    workflow_before = WORKFLOW.read_text(encoding="utf-8")
    workflow_after = update_workflow(workflow_before)
    WORKFLOW.write_text(workflow_after, encoding="utf-8")

    print(f"home.css: {len(css_before.splitlines())} -> {len(css_after.splitlines())} lines")
    print("Removed only same-selector declarations proven dead by later rules in the same scope.")


if __name__ == "__main__":
    main()
