#!/usr/bin/env python3
"""Move homepage-only CSS from style.css into home.css without changing effective styles."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STYLE = ROOT / "assets/css/style.css"
HOME = ROOT / "assets/css/home.css"


HOME_PRELUDE = r'''/* 首页专属基础布局与导航：公共 style.css 只保留全局与文章共享样式。 */
.home-shell {
  display: grid;
  width: 100%;
  min-height: 100dvh;
  justify-content: start;
}

.primary-sidebar,
.secondary-sidebar {
  position: sticky;
  top: 24px;
  height: calc(100dvh - 48px);
  border: 1px solid var(--border);
  background: rgba(17, 24, 34, 0.86);
  backdrop-filter: blur(18px);
  box-shadow: var(--shadow);
}

.primary-sidebar {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: 0 24px 24px 0;
}

.secondary-sidebar {
  border-radius: 24px;
}

.profile-compact-avatar {
  overflow: hidden;
}

.primary-nav {
  display: grid;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 3px;
}

.primary-nav-button,
.secondary-nav-button {
  border: 1px solid rgba(125, 211, 252, 0.13);
  color: var(--muted);
  background: rgba(125, 211, 252, 0.035);
  cursor: pointer;
  transition: 0.2s ease;
}

.primary-nav-button {
  position: relative;
}

.primary-nav-button::before {
  content: "";
  position: absolute;
  left: 0;
  border-radius: 0 999px 999px 0;
  background: transparent;
}

.primary-nav-title {
  display: block;
  overflow-wrap: anywhere;
}

.primary-nav-count {
  font-family: Consolas, "JetBrains Mono", monospace;
}

.primary-nav-button:hover,
.secondary-nav-button:hover {
  border-color: rgba(0, 230, 118, 0.34);
  background: rgba(0, 230, 118, 0.07);
  transform: translateY(-1px);
}

.primary-nav-button.active,
.secondary-nav-button.active {
  color: var(--accent);
  border-color: rgba(0, 230, 118, 0.46);
  background: var(--accent-soft);
}

.primary-nav-button.active::before {
  background: var(--accent);
}

.secondary-nav {
  display: grid;
  max-height: calc(100dvh - 210px);
  margin-top: 18px;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 4px;
}

.secondary-nav-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 14px;
  text-align: left;
}

.secondary-nav-title {
  color: var(--text);
  font-size: 12.6px;
  font-weight: 700;
  line-height: 1.35;
}

.secondary-nav-count {
  flex: 0 0 auto;
  color: var(--weak);
  font-family: Consolas, "JetBrains Mono", monospace;
  font-size: 11px;
}

.secondary-nav-button.active .secondary-nav-count {
  color: #b8f7d0;
}

.primary-nav::-webkit-scrollbar,
.secondary-nav::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.primary-nav::-webkit-scrollbar-thumb,
.secondary-nav::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(125, 211, 252, 0.22);
}

.primary-nav-button:focus-visible,
.secondary-nav-button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.home-content {
  min-width: 0;
  width: 100%;
}

.home-panel {
  margin-top: 0;
}

.empty {
  padding: 28px;
  border: 1px dashed rgba(125, 211, 252, 0.28);
  border-radius: 18px;
  color: #aeb8c5;
  background: rgba(125, 211, 252, 0.045);
  text-align: center;
}

@media (max-width: 1280px) {
  .primary-sidebar,
  .secondary-sidebar {
    top: 20px;
    height: calc(100dvh - 40px);
  }
}'''

MEDIA_900 = r'''
  .home-shell,
  .home-shell.is-about {
    min-height: 100dvh;
  }

  .secondary-sidebar {
    border-radius: 18px;
  }

  .primary-nav,
  .secondary-nav {
    display: flex;
    gap: 10px;
    max-height: none;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0 0 5px;
    scroll-snap-type: x proximity;
  }

  .primary-nav-button {
    scroll-snap-align: start;
  }

  .secondary-nav-button {
    flex: 0 0 auto;
    min-width: 156px;
    scroll-snap-align: start;
  }
'''

MEDIA_640 = r'''
  .home-shell,
  .home-shell.is-about {
    padding: 12px;
  }

  .primary-sidebar,
  .secondary-sidebar {
    border-radius: 16px;
  }

  .primary-nav-count {
    display: none;
  }

  .secondary-nav-button {
    min-width: 138px;
    padding: 9px 10px;
  }

  .secondary-nav-count {
    font-size: 10px;
  }

  .section-title {
    gap: 10px;
  }

  .section-title h2 {
    font-size: 22px;
  }
'''


def extract_between(text: str, start_marker: str, end_marker: str) -> str:
    start = text.index(start_marker)
    end = text.index(end_marker, start)
    return text[:start] + text[end:]


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


def remove_media_containing(text: str, media_header: str, needle: str) -> str:
    search_from = 0
    while True:
        start = text.find(media_header, search_from)
        if start < 0:
            raise RuntimeError(f"missing media block {media_header!r} containing {needle!r}")
        open_index = text.find("{", start)
        close_index = find_block_end(text, open_index)
        block = text[start:close_index + 1]
        if needle in block:
            return text[:start].rstrip() + "\n\n" + text[close_index + 1:].lstrip("\n")
        search_from = close_index + 1


def remove_home_prefix_from_1280(text: str) -> str:
    header = "@media (max-width: 1280px)"
    start = text.index(header)
    open_index = text.index("{", start)
    close_index = find_block_end(text, open_index)
    body = text[open_index + 1:close_index]
    split = body.index("  .page-shell {")
    remaining_body = body[split:].strip("\n")
    replacement = f"{header} {{\n{remaining_body}\n}}"
    return text[:start] + replacement + text[close_index + 1:]


def inject_media_prefix(text: str, media_header: str, rules: str) -> str:
    start = text.index(media_header)
    open_index = text.index("{", start)
    return text[:open_index + 1] + rules.rstrip() + "\n" + text[open_index + 1:]


def main() -> int:
    style = STYLE.read_text(encoding="utf-8")
    home = HOME.read_text(encoding="utf-8")

    style = extract_between(style, ".home-shell {", ".page-shell {")

    old_focus = ".primary-nav-button:focus-visible,\n.secondary-nav-button:focus-visible,\nbutton:focus-visible,\na:focus-visible {"
    if old_focus not in style:
        raise RuntimeError("homepage focus selector group not found in style.css")
    style = style.replace(old_focus, "button:focus-visible,\na:focus-visible {", 1)

    style = remove_home_prefix_from_1280(style)
    style = remove_media_containing(style, "@media (max-width: 900px)", ".home-shell")
    style = remove_media_containing(style, "@media (max-width: 640px)", ".home-shell")

    marker = "首页专属基础布局与导航：公共 style.css 只保留全局与文章共享样式。"
    if marker in home:
        raise RuntimeError("home.css already contains migrated homepage base rules")

    home = inject_media_prefix(home, "@media (max-width: 900px)", MEDIA_900)
    home = inject_media_prefix(home, "@media (max-width: 640px)", MEDIA_640)
    home = HOME_PRELUDE + "\n\n" + home.lstrip()

    STYLE.write_text(style.rstrip() + "\n", encoding="utf-8", newline="\n")
    HOME.write_text(home, encoding="utf-8", newline="\n")

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
