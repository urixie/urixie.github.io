#!/usr/bin/env python3
"""One-shot migration from legacy article roots to canonical knowledge paths."""

from __future__ import annotations

import re
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ARTICLES = ROOT / "articles"
HOME_DATA = ROOT / "assets/js/home-data.js"
ARTICLE_PATH_MAP = ROOT / "assets/js/article-path-map.js"
INDEX = ROOT / "index.html"
VALIDATOR = ROOT / "scripts/validate_site_structure.py"

MIGRATIONS = {
    "c/c-basic-syntax": "foundation/c-basic/c-basic-syntax",
    "c/c-pointer-memory": "foundation/pointer-memory/c-pointer-memory",
    "c/c-data-storage-pointer": "foundation/pointer-memory/c-data-storage-pointer",
    "c/c-stack-heap-memory": "foundation/pointer-memory/c-stack-heap-memory",
    "c/c-struct-data-layout": "foundation/data-structure/c-struct-data-layout",
    "c/c-embedded-c": "foundation/embedded-c/c-embedded-c",
    "c/c-debug-engineering": "foundation/debug-engineering/c-debug-engineering",
    "linux/linux-basic-filesystem": "soc-linux/linux-basic/linux-basic-filesystem",
    "linux/linux-process-memory-thread": "soc-linux/linux-basic/linux-process-memory-thread",
    "linux/linux-shell-systemd": "soc-linux/linux-basic/linux-shell-systemd",
    "linux/uboot-structure-build": "soc-linux/boot-kernel-rootfs/uboot-structure-build",
    "linux/kernel-structure-build": "soc-linux/boot-kernel-rootfs/kernel-structure-build",
    "linux/rootfs-structure-build": "soc-linux/boot-kernel-rootfs/rootfs-structure-build",
    "linux/linux-embedded-debug": "soc-linux/driver-debug/linux-embedded-debug",
    "freertos/freertos-basic-scheduler": "realtime/freertos-basic/freertos-basic-scheduler",
    "freertos/freertos-task-management": "realtime/task-management/freertos-task-management",
    "freertos/freertos-ipc-sync": "realtime/ipc-sync/freertos-ipc-sync",
    "freertos/freertos-timer-memory-debug": "realtime/timer-memory-debug/freertos-timer-memory-debug",
    "windows/uqitong-usb-win-install": "dev-tools/windows-install/uqitong-usb-win-install",
    "windows/iventoy-pxe-win-install": "dev-tools/pxe-iventoy/iventoy-pxe-win-install",
}

PATH_MAP_RE = re.compile(r"['\"]([^'\"]+\.html)['\"]\s*:\s*['\"]([^'\"]+\.html)['\"]")

VALIDATOR_SOURCE = r'''#!/usr/bin/env python3
"""Validate static site routing and canonical article layout consistency."""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
HOME_DATA = ROOT / "assets/js/home-data.js"
ARTICLE_PATH_MAP = ROOT / "assets/js/article-path-map.js"
LEGACY_ROUTES = ROOT / "assets/js/legacy-routes.js"
INDEX = ROOT / "index.html"

HOME_HREF_RE = re.compile(r"href\s*:\s*withVersion\(\s*['\"]([^'\"]+)['\"]\s*\)")
LEGACY_ROUTE_RE = re.compile(r"^\s*['\"]([^'\"]+)['\"]\s*:\s*['\"]([^'\"]+)['\"]\s*,?\s*$", re.MULTILINE)
SCRIPT_RE = re.compile(r"<script\s+[^>]*src=['\"]([^'\"]+)['\"][^>]*>", re.IGNORECASE)
ARTICLE_SOURCE_RE = re.compile(r"data-article-source=['\"]([^'\"]+)['\"]", re.IGNORECASE)


def local_path(value: str) -> Path:
    return ROOT / urlsplit(value).path.lstrip("/")


def require_file(path: Path, errors: list[str], context: str) -> None:
    if not path.is_file():
        errors.append(f"{context}: missing file: {path.relative_to(ROOT).as_posix()}")


def validate_index(errors: list[str]) -> None:
    text = INDEX.read_text(encoding="utf-8")
    scripts = [urlsplit(item).path for item in SCRIPT_RE.findall(text)]
    for script in scripts:
        require_file(ROOT / script, errors, "index script")

    required_order = [
        "assets/js/home-data.js",
        "assets/js/legacy-routes.js",
        "assets/js/hash-compat.js",
        "assets/js/main.js",
        "assets/js/inline-reader-guard.js",
    ]
    positions = []
    for script in required_order:
        if script not in scripts:
            errors.append(f"index script: missing required script: {script}")
            continue
        positions.append(scripts.index(script))
    if len(positions) == len(required_order) and positions != sorted(positions):
        errors.append("index script: routing scripts are not loaded in the required order")

    if any("article-path-map.js" in script for script in scripts):
        errors.append("index script: article-path-map.js must not be loaded")


def validate_home_data(errors: list[str]) -> None:
    text = HOME_DATA.read_text(encoding="utf-8")
    hrefs = HOME_HREF_RE.findall(text)
    if not hrefs:
        errors.append("home-data: no article href entries found")
        return

    seen: set[str] = set()
    for href in hrefs:
        if href in seen:
            errors.append(f"home-data: duplicate article href: {href}")
        seen.add(href)
        require_file(local_path(href), errors, "home-data route")


def validate_proxy_sources(errors: list[str]) -> None:
    for html_file in sorted((ROOT / "articles").glob("**/*.html")):
        text = html_file.read_text(encoding="utf-8")
        match = ARTICLE_SOURCE_RE.search(text)
        if not match:
            continue
        source = match.group(1)
        resolved = (html_file.parent / urlsplit(source).path).resolve()
        try:
            resolved.relative_to(ROOT.resolve())
        except ValueError:
            errors.append(
                f"article proxy: source escapes repository: {html_file.relative_to(ROOT).as_posix()} -> {source}"
            )
            continue
        if not resolved.is_file():
            errors.append(
                f"article proxy: missing source: {html_file.relative_to(ROOT).as_posix()} -> {source}"
            )


def validate_legacy_routes(errors: list[str]) -> None:
    text = LEGACY_ROUTES.read_text(encoding="utf-8")
    pairs = LEGACY_ROUTE_RE.findall(text)
    if not pairs:
        errors.append("legacy-routes: no compatibility routes found")
        return

    keys: set[str] = set()
    for key, target in pairs:
        if key in keys:
            errors.append(f"legacy-routes: duplicate route key: {key}")
        keys.add(key)
        if not target:
            errors.append(f"legacy-routes: empty route target for: {key}")

    consumers = {
        ROOT / "assets/js/hash-compat.js": "resolveLegacyHomeRoute",
        ROOT / "assets/js/inline-reader-guard.js": "isLegacyHomeRoute",
    }
    for consumer, helper in consumers.items():
        text = consumer.read_text(encoding="utf-8")
        if helper not in text:
            errors.append(f"{consumer.name}: must consume {helper} from legacy-routes.js")


def validate_canonical_layout(errors: list[str]) -> None:
    forbidden_paths = [
        "articles/c",
        "articles/linux",
        "articles/freertos",
        "articles/windows",
        "articles/foundation/foundation",
        "articles/dev-tools/dev-tools",
        "articles/fpga/fpga",
        "articles/realtime/realtime",
        "articles/soc/linux",
        "articles/soc/linux-basic",
        "articles/soc/linux-build",
        "articles/soc/linux-driver-debug",
        "articles/soc/linux-rockchip",
        "articles/host/tools",
        "articles/host/tools-debug-config",
        "articles/mcu/mcu/microchip",
        "articles/mcu/mcu/silicon-labs",
        "articles/mcu/mcu/wh",
    ]
    for relative in forbidden_paths:
        if (ROOT / relative).exists():
            errors.append(f"article layout: legacy/duplicated tree must not exist: {relative}")

    if ARTICLE_PATH_MAP.exists():
        errors.append("article layout: assets/js/article-path-map.js must not exist")


def main() -> int:
    errors: list[str] = []

    for required in (HOME_DATA, LEGACY_ROUTES, INDEX):
        require_file(required, errors, "site structure")

    if not errors:
        validate_index(errors)
        validate_home_data(errors)
        validate_proxy_sources(errors)
        validate_legacy_routes(errors)
        validate_canonical_layout(errors)

    if errors:
        print("Site structure validation failed:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    print("Site structure validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
'''


def move_article_tree(source_rel: str, target_rel: str) -> None:
    source = ARTICLES / source_rel
    target = ARTICLES / target_rel

    if not source.exists():
        if target.exists():
            print(f"skip migrated: {target_rel}")
            return
        raise FileNotFoundError(f"missing source and target: {source_rel} -> {target_rel}")

    if target.exists():
        shutil.rmtree(target)
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(source), str(target))

    html_files = list(target.glob("*.html"))
    if not html_files:
        raise RuntimeError(f"no article html in migrated tree: {target_rel}")

    for html_file in html_files:
        text = html_file.read_text(encoding="utf-8")
        # All four legacy roots are one directory level shallower than their
        # canonical destinations. Local images/docs stay unchanged; only
        # repository-root links need one additional ../ segment.
        text = text.replace("../../../assets/", "../../../../assets/")
        text = text.replace("../../../index.html", "../../../../index.html")
        html_file.write_text(text, encoding="utf-8")

    print(f"migrated: {source_rel} -> {target_rel}")


def prune_empty_legacy_roots() -> None:
    for relative in ("c", "linux", "freertos", "windows"):
        path = ARTICLES / relative
        if path.exists():
            try:
                path.rmdir()
            except OSError as exc:
                raise RuntimeError(f"legacy root is not empty: {relative}") from exc


def canonicalize_home_data() -> None:
    if not ARTICLE_PATH_MAP.is_file():
        raise FileNotFoundError(ARTICLE_PATH_MAP)

    path_map_text = ARTICLE_PATH_MAP.read_text(encoding="utf-8")
    path_map = dict(PATH_MAP_RE.findall(path_map_text))
    if not path_map:
        raise RuntimeError("article-path-map.js did not contain any mappings")

    text = HOME_DATA.read_text(encoding="utf-8")
    changed = 0
    for source, target in path_map.items():
        count = text.count(source)
        if count:
            text = text.replace(source, target)
            changed += count
    HOME_DATA.write_text(text, encoding="utf-8")
    print(f"home-data canonicalized: {changed} href reference(s)")


def remove_path_map_loader() -> None:
    text = INDEX.read_text(encoding="utf-8")
    lines = [line for line in text.splitlines() if "assets/js/article-path-map.js" not in line]
    text = "\n".join(lines) + "\n"
    # Force clients to fetch the canonical home-data/script set instead of a
    # cached pre-migration set that still contains legacy article hrefs.
    text = re.sub(r"\?v=bc26d38b1d83", "?v=20260901-canonical", text)
    INDEX.write_text(text, encoding="utf-8")


def main() -> None:
    for source, target in MIGRATIONS.items():
        move_article_tree(source, target)

    prune_empty_legacy_roots()
    canonicalize_home_data()
    remove_path_map_loader()
    ARTICLE_PATH_MAP.unlink()
    VALIDATOR.write_text(VALIDATOR_SOURCE, encoding="utf-8")

    leftovers = [source for source in MIGRATIONS if (ARTICLES / source).exists()]
    if leftovers:
        raise RuntimeError(f"legacy article trees still exist: {leftovers}")

    print("canonical article migration complete")


if __name__ == "__main__":
    main()
