#!/usr/bin/env python3
"""Move MCU common architecture articles from articles/mcu/mcu to articles/mcu/common."""

from __future__ import annotations

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "articles/mcu/mcu"
TARGET = ROOT / "articles/mcu/common"
OLD_PREFIX = "articles/mcu/mcu/"
NEW_PREFIX = "articles/mcu/common/"
EXPECTED_DIRS = {
    "8051-architecture",
    "arm-cortex-m0",
    "arm-cortex-m3-m4",
    "avr-architecture",
    "esp32-risc-v",
    "esp32-xtensa",
    "msp430-architecture",
    "pic-architecture",
    "pic32-mips",
    "stm8-architecture",
}
TEXT_SUFFIXES = {".html", ".js", ".py", ".md", ".yml", ".yaml"}


def main() -> None:
    if not SOURCE.is_dir():
        raise RuntimeError(f"source directory missing: {SOURCE.relative_to(ROOT)}")
    if TARGET.exists():
        raise RuntimeError(f"target directory already exists: {TARGET.relative_to(ROOT)}")

    actual_dirs = {path.name for path in SOURCE.iterdir() if path.is_dir()}
    if actual_dirs != EXPECTED_DIRS:
        raise RuntimeError(
            "unexpected MCU common source set:\n"
            f"  expected={sorted(EXPECTED_DIRS)}\n"
            f"  actual={sorted(actual_dirs)}"
        )
    loose_files = [path.name for path in SOURCE.iterdir() if path.is_file()]
    if loose_files:
        raise RuntimeError(f"unexpected files under articles/mcu/mcu: {loose_files}")

    shutil.move(str(SOURCE), str(TARGET))

    changed_files = []
    replacements = 0
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES or ".git" in path.parts:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        count = text.count(OLD_PREFIX)
        if not count:
            continue
        updated = text.replace(OLD_PREFIX, NEW_PREFIX)
        path.write_text(updated, encoding="utf-8")
        changed_files.append(path.relative_to(ROOT).as_posix())
        replacements += count

    home_data = ROOT / "assets/js/home-data.js"
    if OLD_PREFIX in home_data.read_text(encoding="utf-8"):
        raise RuntimeError("old MCU common path still appears in home-data.js")

    validator = ROOT / "scripts/validate_site_structure.py"
    validator_text = validator.read_text(encoding="utf-8")
    marker = '        "articles/mcu/mcu/microchip",\n'
    if marker not in validator_text:
        raise RuntimeError("validator insertion marker not found")
    validator_text = validator_text.replace(
        marker,
        '        "articles/mcu/mcu",\n' + marker,
        1,
    )
    validator.write_text(validator_text, encoding="utf-8")

    if not TARGET.is_dir() or SOURCE.exists():
        raise RuntimeError("MCU common directory move did not complete cleanly")

    html_files = sorted(TARGET.glob("*/*.html"))
    if len(html_files) != len(EXPECTED_DIRS):
        raise RuntimeError(
            f"expected {len(EXPECTED_DIRS)} canonical MCU article HTML files, found {len(html_files)}"
        )

    print(
        f"Moved {len(EXPECTED_DIRS)} MCU architecture article directories to articles/mcu/common; "
        f"updated {replacements} path reference(s) across {len(changed_files)} text file(s)."
    )
    if changed_files:
        print("Updated path references:")
        for item in changed_files:
            print(f"  - {item}")


if __name__ == "__main__":
    main()
