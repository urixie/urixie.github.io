#!/usr/bin/env python3
"""Remove obsolete !important flags from home.css without changing declarations."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS = ROOT / "assets/css/home.css"


def main() -> None:
    text = CSS.read_text(encoding="utf-8")
    before = text.count("!important")
    if before == 0:
        raise SystemExit("home.css already has no !important declarations")
    text = text.replace(" !important", "")
    remaining = text.count("!important")
    if remaining:
        raise RuntimeError(f"unexpected !important spellings remain: {remaining}")
    CSS.write_text(text, encoding="utf-8")
    print(f"Removed {before} !important flags from home.css; declaration values unchanged.")


if __name__ == "__main__":
    main()
