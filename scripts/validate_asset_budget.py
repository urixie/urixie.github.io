#!/usr/bin/env python3
"""Keep the static site lightweight by enforcing simple source-size budgets."""

from __future__ import annotations

import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
KIB = 1024
FILE_BUDGETS = {
    "assets/js/home-data.js": 100 * KIB,
    "assets/js/home.js": 40 * KIB,
    "assets/js/main.js": 30 * KIB,
    "assets/js/article-reader.js": 30 * KIB,
    "assets/css/style.css": 50 * KIB,
    "assets/css/home.css": 40 * KIB,
}
TOTAL_BUDGETS = {
    "JavaScript": (ROOT / "assets" / "js", "*.js", 200 * KIB),
    "CSS": (ROOT / "assets" / "css", "*.css", 150 * KIB),
}


def format_kib(size: int) -> str:
    return f"{size / KIB:.1f} KiB"


def main() -> int:
    errors: list[str] = []

    for relative, limit in FILE_BUDGETS.items():
        path = ROOT / relative
        if not path.is_file():
            errors.append(f"{relative}: 文件不存在")
            continue
        size = path.stat().st_size
        if size > limit:
            errors.append(f"{relative}: {format_kib(size)} 超过预算 {format_kib(limit)}")

    for label, (directory, pattern, limit) in TOTAL_BUDGETS.items():
        files = sorted(directory.glob(pattern)) if directory.exists() else []
        total = sum(path.stat().st_size for path in files)
        if total > limit:
            errors.append(f"{label} 总量: {format_kib(total)} 超过预算 {format_kib(limit)}")
        else:
            print(f"{label} total: {format_kib(total)} / {format_kib(limit)}")

    if errors:
        print("Asset budget validation failed:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    print("Asset budget validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
