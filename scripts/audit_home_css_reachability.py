#!/usr/bin/env python3
"""Report home.css class selectors with no references in production HTML/JS."""

from __future__ import annotations

import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS = ROOT / "assets/css/home.css"
CLASS_RE = re.compile(r"\.([A-Za-z_][A-Za-z0-9_-]*)")
COMMENT_RE = re.compile(r"/\*.*?\*/", re.S)


def production_sources() -> list[Path]:
    files: list[Path] = [ROOT / "index.html"]
    files.extend((ROOT / "assets/js").glob("*.js"))
    files.extend((ROOT / "articles").rglob("*.html"))
    return [path for path in files if path.is_file()]


def main() -> int:
    css = COMMENT_RE.sub("", CSS.read_text(encoding="utf-8"))
    classes = sorted(set(CLASS_RE.findall(css)))

    references: dict[str, list[str]] = defaultdict(list)
    for path in production_sources():
        text = path.read_text(encoding="utf-8", errors="ignore")
        for class_name in classes:
            if re.search(rf"(?<![A-Za-z0-9_-]){re.escape(class_name)}(?![A-Za-z0-9_-])", text):
                references[class_name].append(str(path.relative_to(ROOT)))

    unused = [name for name in classes if not references.get(name)]
    print(f"home.css class selectors: {len(classes)}")
    print(f"classes referenced by production HTML/JS: {len(classes) - len(unused)}")
    print(f"zero-reference candidates: {len(unused)}")
    for name in unused:
        print(f"  .{name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
