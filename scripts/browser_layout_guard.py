#!/usr/bin/env python3
"""Run zero-dependency browser layout and interaction regression checks with headless Chrome."""

from __future__ import annotations

import contextlib
import http.server
import os
import re
import shutil
import socketserver
import subprocess
import tempfile
import threading
from pathlib import Path
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parents[1]
HOME_HARNESS = "tests/layout-regression.html"
ARTICLE_HARNESS = "tests/article-layout-regression.html"
ARTICLE_RACE_HARNESS = "tests/article-loading-race.html"
ROUTE_HARNESS = "tests/route-compat-regression.html"
ARTICLE_TOC_HARNESS = "tests/article-toc-regression.html"
HOME_SCENARIOS = (
    {"mode": "desktop", "width": 1440, "height": 900},
    {"mode": "narrow", "width": 920, "height": 820},
    {"mode": "mobile", "width": 390, "height": 844},
)
ARTICLE_SCENARIOS = (
    {"mode": "article-desktop", "width": 1280, "height": 900},
    {"mode": "article-mobile", "width": 390, "height": 844},
)
INTERACTION_SCENARIOS = (
    {"mode": "article-race", "width": 1024, "height": 768},
)
ROUTE_SCENARIOS = (
    {"mode": "route-compat", "width": 1024, "height": 768},
)
ARTICLE_TOC_SCENARIOS = (
    {"mode": "article-toc", "width": 1024, "height": 768},
)
CHROME_TIMEOUT_SECONDS = 35
CHROME_TIMEOUT_ATTEMPTS = 2


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

    for attempt in range(1, CHROME_TIMEOUT_ATTEMPTS + 1):
        with tempfile.TemporaryDirectory(prefix="layout-chrome-") as profile_dir:
            command = [
                chrome,
                "--headless=new",
                "--no-sandbox",
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--disable-background-networking",
                "--disable-extensions",
                "--no-first-run",
                "--no-default-browser-check",
                f"--user-data-dir={profile_dir}",
                "--run-all-compositor-stages-before-draw",
                "--window-size=1800,1200",
                "--virtual-time-budget=15000",
                "--dump-dom",
                url,
            ]
            try:
                completed = subprocess.run(
                    command,
                    check=False,
                    capture_output=True,
                    text=True,
                    timeout=CHROME_TIMEOUT_SECONDS,
                )
            except subprocess.TimeoutExpired:
                if attempt < CHROME_TIMEOUT_ATTEMPTS:
                    print(
                        f"RETRY Chrome timeout for {scenario['mode']} "
                        f"after {CHROME_TIMEOUT_SECONDS}s "
                        f"(attempt {attempt}/{CHROME_TIMEOUT_ATTEMPTS})"
                    )
                    continue
                return (
                    False,
                    f"Chrome timed out after {CHROME_TIMEOUT_SECONDS}s "
                    f"for {CHROME_TIMEOUT_ATTEMPTS} attempt(s)",
                )

            if completed.returncode != 0:
                stderr = completed.stderr.strip()
                return False, f"Chrome exited with {completed.returncode}: {stderr[-2000:]}"

            status, report = extract_result(completed.stdout)
            if status != "pass":
                return False, report or f"browser harness returned status={status}"
            return True, report

    return False, "Chrome browser scenario did not produce a result"


def main() -> int:
    chrome = find_chrome()
    print(f"Browser regression guard using: {chrome}")
    failures = []

    suites = (
        ("home", HOME_HARNESS, HOME_SCENARIOS),
        ("article", ARTICLE_HARNESS, ARTICLE_SCENARIOS),
        ("interaction", ARTICLE_RACE_HARNESS, INTERACTION_SCENARIOS),
        ("route", ROUTE_HARNESS, ROUTE_SCENARIOS),
        ("article-toc", ARTICLE_TOC_HARNESS, ARTICLE_TOC_SCENARIOS),
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
        print("\nBrowser regression check failed:")
        for label, report in failures:
            print(f"\n[{label}]\n{report}")
        return 1

    print(
        "Browser regression check passed for home desktop/narrow/mobile, standalone article "
        "desktop/mobile, inline article race handling, hash-route compatibility, automatic article TOC, "
        "and keyboard image zoom."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
