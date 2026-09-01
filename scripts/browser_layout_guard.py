#!/usr/bin/env python3
"""Run zero-dependency browser layout regression checks with headless Chrome."""

from __future__ import annotations

import contextlib
import http.server
import os
import re
import shutil
import socketserver
import subprocess
import threading
from pathlib import Path
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parents[1]
HOME_HARNESS = "tests/layout-regression.html"
ARTICLE_HARNESS = "tests/article-layout-regression.html"
HOME_SCENARIOS = (
    {"mode": "desktop", "width": 1440, "height": 900},
    {"mode": "narrow", "width": 920, "height": 820},
    {"mode": "mobile", "width": 390, "height": 844},
)
ARTICLE_SCENARIOS = (
    {"mode": "article-desktop", "width": 1280, "height": 900},
    {"mode": "article-mobile", "width": 390, "height": 844},
)


def find_chrome() -> str:
    candidates = [
        os.environ.get("CHROME_BIN"),
        shutil.which("google-chrome"),
        shutil.which("google-chrome-stable"),
        shutil.which("chromium"),
        shutil.which("chromium-browser"),
    ]
    for candidate in candidates:
        if candidate:
            return candidate
    raise RuntimeError("Chrome/Chromium executable not found on PATH")


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:  # noqa: D401
        pass


@contextlib.contextmanager
def local_server():
    previous_cwd = Path.cwd()
    os.chdir(ROOT)
    server = socketserver.ThreadingTCPServer(("127.0.0.1", 0), QuietHandler)
    server.daemon_threads = True
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield server.server_address[1]
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)
        os.chdir(previous_cwd)


def extract_result(dom: str) -> tuple[str, str]:
    match = re.search(
        r'<pre[^>]*id="layout-result"[^>]*data-status="([^"]+)"[^>]*>(.*?)</pre>',
        dom,
        flags=re.S,
    )
    if not match:
        return "missing", "layout result marker not found in Chrome DOM dump"
    status = match.group(1)
    body = re.sub(r"<[^>]+>", "", match.group(2)).strip()
    return status, body


def run_scenario(
    chrome: str,
    port: int,
    harness: str,
    scenario: dict[str, int | str],
) -> tuple[bool, str]:
    query = urlencode(scenario)
    url = f"http://127.0.0.1:{port}/{harness}?{query}"
    command = [
        chrome,
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--run-all-compositor-stages-before-draw",
        "--window-size=1800,1200",
        "--virtual-time-budget=15000",
        "--dump-dom",
        url,
    ]
    completed = subprocess.run(
        command,
        check=False,
        capture_output=True,
        text=True,
        timeout=35,
    )
    if completed.returncode != 0:
        stderr = completed.stderr.strip()
        return False, f"Chrome exited with {completed.returncode}: {stderr[-2000:]}"

    status, report = extract_result(completed.stdout)
    if status != "pass":
        return False, report or f"layout harness returned status={status}"
    return True, report


def main() -> int:
    chrome = find_chrome()
    print(f"Browser layout guard using: {chrome}")
    failures = []

    suites = (
        ("home", HOME_HARNESS, HOME_SCENARIOS),
        ("article", ARTICLE_HARNESS, ARTICLE_SCENARIOS),
    )

    with local_server() as port:
        for suite_name, harness, scenarios in suites:
            for scenario in scenarios:
                label = f"{suite_name} {scenario['mode']} {scenario['width']}x{scenario['height']}"
                ok, report = run_scenario(chrome, port, harness, scenario)
                if ok:
                    print(f"PASS {label}")
                else:
                    failures.append((label, report))
                    print(f"FAIL {label}\n{report}")

    if failures:
        print("\nBrowser layout regression check failed:")
        for label, report in failures:
            print(f"\n[{label}]\n{report}")
        return 1

    print(
        "Browser layout regression check passed for home desktop/narrow/mobile "
        "and standalone article desktop/mobile viewports."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
