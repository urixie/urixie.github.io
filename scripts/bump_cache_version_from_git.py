#!/usr/bin/env python3
"""Write the current Git HEAD short hash into local HTML resource URLs.

This script deliberately does not stage, commit, or push anything.  It is
intended to be run immediately before a manual VS Code Git commit.
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit


RESOURCE_SUFFIXES = {
    ".css", ".js", ".html", ".png", ".jpg", ".jpeg", ".webp",
    ".gif", ".svg", ".pdf",
}
SKIP_PREFIXES = ("http://", "https://", "mailto:", "tel:", "#", "data:", "javascript:")
ATTRIBUTE_RE = re.compile(r"(?P<attr>\b(?:href|src))(?P<space>\s*=\s*)(?P<quote>['\"])(?P<url>.*?)(?P=quote)", re.IGNORECASE)


def git_output(repo_hint: Path, *args: str) -> str:
    """Run git and return its trimmed standard output, with a friendly error."""
    try:
        result = subprocess.run(
            ["git", *args], cwd=repo_hint, text=True, encoding="utf-8",
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True,
        )
    except FileNotFoundError:
        raise RuntimeError("git was not found. Install Git and ensure it is available on PATH.")
    except subprocess.CalledProcessError as error:
        detail = error.stderr.strip() or error.stdout.strip()
        raise RuntimeError(detail or "git command failed")
    return result.stdout.strip()


def is_local_versionable_url(url: str) -> bool:
    value = url.strip()
    lower_value = value.lower()
    if not value or lower_value.startswith(SKIP_PREFIXES) or value.startswith("//"):
        return False
    parts = urlsplit(value)
    return not parts.scheme and Path(parts.path).suffix.lower() in RESOURCE_SUFFIXES


def with_version(url: str, version: str) -> str:
    """Replace every v query item, retaining all other raw query items and #fragment."""
    parts = urlsplit(url)
    remaining = []
    for item in filter(None, parts.query.split("&")):
        key = item.split("=", 1)[0]
        if key != "v":
            remaining.append(item)
    remaining.append(f"v={version}")
    return urlunsplit((parts.scheme, parts.netloc, parts.path, "&".join(remaining), parts.fragment))


def replace_attribute(match: re.Match[str], version: str) -> str:
    url = match.group("url")
    if not is_local_versionable_url(url):
        return match.group(0)
    updated = with_version(url, version)
    if updated == url:
        return match.group(0)
    return f"{match.group('attr')}{match.group('space')}{match.group('quote')}{updated}{match.group('quote')}"


def main() -> int:
    try:
        repo_root = Path(git_output(Path.cwd(), "rev-parse", "--show-toplevel"))
        version = git_output(repo_root, "rev-parse", "--short=12", "HEAD")
    except RuntimeError as error:
        print(f"Error: unable to determine the Git repository or current HEAD: {error}", file=sys.stderr)
        return 1

    html_files = [repo_root / "index.html"]
    articles = repo_root / "articles"
    if articles.exists():
        html_files.extend(sorted(articles.glob("**/*.html")))

    changed_files: list[Path] = []
    for html_file in html_files:
        if not html_file.is_file():
            continue
        original = html_file.read_text(encoding="utf-8")
        updated = ATTRIBUTE_RE.sub(lambda match: replace_attribute(match, version), original)
        if updated != original:
            # newline="\n" keeps output consistent even when run on Windows.
            with html_file.open("w", encoding="utf-8", newline="\n") as output:
                output.write(updated)
            changed_files.append(html_file.relative_to(repo_root))

    print(f"Cache version: {version}")
    if changed_files:
        print("Modified HTML files:")
        for html_file in changed_files:
            print(f"  {html_file.as_posix()}")
    else:
        print("no files changed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
