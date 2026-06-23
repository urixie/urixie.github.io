#!/usr/bin/env python3
"""Write a current site-content version into local HTML resource URLs.

This script deliberately does not stage, commit, or push anything.  It is
intended to be run immediately before a manual VS Code Git commit.
"""

from __future__ import annotations

import re
import subprocess
import sys
from hashlib import sha256
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


def without_version(url: str) -> str:
    """Remove cache-buster items before calculating the site-content version."""
    parts = urlsplit(url)
    remaining = [item for item in filter(None, parts.query.split("&")) if item.split("=", 1)[0] != "v"]
    return urlunsplit((parts.scheme, parts.netloc, parts.path, "&".join(remaining), parts.fragment))


def version_source(match: re.Match[str]) -> str:
    """Normalize generated cache-buster values out of an HTML attribute."""
    url = match.group("url")
    if not is_local_versionable_url(url):
        return match.group(0)
    normalized_url = without_version(url)
    return f"{match.group('attr')}{match.group('space')}{match.group('quote')}{normalized_url}{match.group('quote')}"


def replace_attribute(match: re.Match[str], version: str) -> str:
    url = match.group("url")
    if not is_local_versionable_url(url):
        return match.group(0)
    updated = with_version(url, version)
    if updated == url:
        return match.group(0)
    return f"{match.group('attr')}{match.group('space')}{match.group('quote')}{updated}{match.group('quote')}"


def collect_html_files(repo_root: Path) -> list[Path]:
    """Return every page whose content participates in the cache version."""
    html_files = [repo_root / "index.html"]
    articles = repo_root / "articles"
    if articles.exists():
        html_files.extend(sorted(articles.glob("**/*.html")))
    return [html_file for html_file in html_files if html_file.is_file()]


def collect_version_sources(repo_root: Path, html_files: list[Path]) -> list[Path]:
    """Include local cacheable assets so their edits also rotate ``v`` values."""
    assets = repo_root / "assets"
    asset_files = []
    if assets.exists():
        asset_files = [
            file for file in assets.glob("**/*")
            if file.is_file() and file.suffix.lower() in RESOURCE_SUFFIXES
        ]
    return sorted({*html_files, *asset_files})


def read_html(html_file: Path) -> str:
    """Read a page without normalizing its existing line endings."""
    with html_file.open(encoding="utf-8", newline="") as source:
        return source.read()


def content_version(repo_root: Path, sources: list[Path]) -> str:
    """Hash site-source paths and contents, excluding generated ``v`` parameters.

    Including relative paths makes article additions and removals affect the
    version.  Including local cacheable assets refreshes their URL when they
    change.  Removing only generated cache-buster parameters keeps repeated
    runs stable when no source content has changed.
    """
    digest = sha256()
    for source_file in sources:
        relative_path = source_file.relative_to(repo_root).as_posix()
        digest.update(relative_path.encode("utf-8"))
        digest.update(b"\0")
        if source_file.suffix.lower() == ".html":
            content = read_html(source_file)
            normalized_content = ATTRIBUTE_RE.sub(version_source, content)
            digest.update(normalized_content.encode("utf-8"))
        else:
            digest.update(source_file.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()[:12]


def main() -> int:
    try:
        repo_root = Path(git_output(Path.cwd(), "rev-parse", "--show-toplevel"))
    except RuntimeError as error:
        print(f"Error: unable to determine the Git repository: {error}", file=sys.stderr)
        return 1

    html_files = collect_html_files(repo_root)
    version = content_version(repo_root, collect_version_sources(repo_root, html_files))

    changed_files: list[Path] = []
    for html_file in html_files:
        original = read_html(html_file)
        updated = ATTRIBUTE_RE.sub(lambda match: replace_attribute(match, version), original)
        if updated != original:
            # newline="" preserves each page's existing line-ending convention.
            with html_file.open("w", encoding="utf-8", newline="") as output:
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
