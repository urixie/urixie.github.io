#!/usr/bin/env python3
"""Validate repository JavaScript syntax with Node.js."""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JS_ROOT = ROOT / "assets/js"


def main() -> int:
    node = shutil.which("node")
    if not node:
        print("JavaScript syntax validation failed: Node.js is required.", file=sys.stderr)
        return 1

    files = sorted(JS_ROOT.rglob("*.js"))
    if not files:
        print("JavaScript syntax validation failed: no JavaScript files found.", file=sys.stderr)
        return 1

    errors: list[str] = []
    for path in files:
        result = subprocess.run(
            [node, "--check", str(path)],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode != 0:
            detail = (result.stderr or result.stdout).strip()
            errors.append(f"{path.relative_to(ROOT).as_posix()}:\n{detail}")

    if errors:
        print("JavaScript syntax validation failed:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    print(f"JavaScript syntax validation passed: {len(files)} file(s) checked with Node.js.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
