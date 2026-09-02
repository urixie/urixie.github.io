#!/usr/bin/env python3
"""Fail when production JS/CSS assets are no longer referenced by production pages."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSET_DIRS = (ROOT / "assets/js", ROOT / "assets/css")
PRODUCTION_SUFFIXES = {".html", ".js"}
EXCLUDED_TOP_LEVEL = {"tests", ".git"}


def is_production_source(path: Path) -> bool:
    if not path.is_file() or path.suffix.lower() not in PRODUCTION_SUFFIXES:
        return False
    relative = path.relative_to(ROOT)
    return not (relative.parts and relative.parts[0] in EXCLUDED_TOP_LEVEL)


def main() -> int:
    sources = [path for path in ROOT.rglob("*") if is_production_source(path)]
    source_text = {
        path: path.read_text(encoding="utf-8", errors="ignore")
        for path in sources
    }

    errors: list[str] = []
    checked = 0
    for asset_dir in ASSET_DIRS:
        for asset in sorted(asset_dir.glob("*")):
            if not asset.is_file() or asset.suffix.lower() not in {".js", ".css"}:
                continue
            checked += 1
            relative = asset.relative_to(ROOT).as_posix()
            needle = relative
            referenced = any(
                path != asset and needle in text
                for path, text in source_text.items()
            )
            if not referenced:
                errors.append(f"orphan runtime asset: {relative}")

    if errors:
        print("Orphan asset validation failed:")
        for error in errors:
            print(f"  - {error}")
        return 1

    print(f"Orphan asset validation passed: {checked} JS/CSS assets are referenced.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
