#!/usr/bin/env python3
"""检查或修复静态站点 HTML 页面的搜索引擎 noindex 指令。"""

from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRECTORIES = {".git", "node_modules", "dist", "build", ".venv", "venv"}
DIRECTIVE = "noindex, nofollow, noarchive, nosnippet, noimageindex"
TARGET_META_NAMES = ("robots", "googlebot", "bingbot")
HEAD_PATTERN = re.compile(r"(<head\b[^>]*>)(.*?)(</head\s*>)", re.IGNORECASE | re.DOTALL)
META_PATTERN = re.compile(r"<meta\b[^>]*>", re.IGNORECASE | re.DOTALL)
TITLE_PATTERN = re.compile(r"<title\b", re.IGNORECASE)


def get_attribute(tag: str, attribute: str) -> str | None:
    """Return one HTML attribute value without rewriting unrelated markup."""
    pattern = re.compile(
        rf"\b{re.escape(attribute)}\s*=\s*(?:\"([^\"]*)\"|'([^']*)'|([^\s\"'=<>`]+))",
        re.IGNORECASE | re.DOTALL,
    )
    match = pattern.search(tag)
    if not match:
        return None
    return next(value for value in match.groups() if value is not None)


def meta_name(tag: str) -> str | None:
    name = get_attribute(tag, "name")
    return name.lower() if name else None


def find_html_files(root: Path) -> list[Path]:
    html_files: list[Path] = []
    for directory, directory_names, file_names in os.walk(root):
        directory_names[:] = sorted(
            name for name in directory_names if name.lower() not in SKIP_DIRECTORIES
        )
        current_directory = Path(directory)
        html_files.extend(
            current_directory / name
            for name in sorted(file_names)
            if Path(name).suffix.lower() == ".html"
        )
    return sorted(html_files)


def analyze_html(content: str) -> tuple[bool, list[str]]:
    """Return whether every target meta appears once with the canonical directive."""
    head_match = HEAD_PATTERN.search(content)
    if not head_match:
        return False, ["缺少 <head> 区域"]

    values: dict[str, list[str | None]] = {name: [] for name in TARGET_META_NAMES}
    for match in META_PATTERN.finditer(head_match.group(2)):
        name = meta_name(match.group(0))
        if name in values:
            values[name].append(get_attribute(match.group(0), "content"))

    problems: list[str] = []
    for name in TARGET_META_NAMES:
        entries = values[name]
        if len(entries) != 1:
            problems.append(f"{name} meta 数量为 {len(entries)}")
        elif entries[0] is None or entries[0].strip() != DIRECTIVE:
            problems.append(f"{name} meta 内容不正确")
    return not problems, problems


def infer_indent(head_body: str, position: int) -> str:
    line_start = head_body.rfind("\n", 0, position) + 1
    prefix = head_body[line_start:position]
    return prefix if prefix.strip() == "" else "  "


def remove_target_meta_tags(head_body: str) -> str:
    """Remove target tags so they can be reinserted once in the preferred slot."""
    parts: list[str] = []
    cursor = 0
    for match in META_PATTERN.finditer(head_body):
        if meta_name(match.group(0)) not in TARGET_META_NAMES:
            continue

        start, end = match.span()
        line_start = head_body.rfind("\n", 0, start) + 1
        line_end = head_body.find("\n", end)
        if (
            line_end != -1
            and head_body[line_start:start].strip() == ""
            and head_body[end:line_end].strip() == ""
        ):
            start, end = line_start, line_end + 1

        parts.append(head_body[cursor:start])
        cursor = end
    parts.append(head_body[cursor:])
    return "".join(parts)


def canonical_meta_lines(indent: str, newline: str) -> str:
    return newline.join(
        f'{indent}<meta name="{name}" content="{DIRECTIVE}">' for name in TARGET_META_NAMES
    )


def insert_canonical_meta_tags(head_body: str, newline: str) -> str:
    """Insert canonical tags after charset/viewport, or immediately before title."""
    last_preferred_meta_end: int | None = None
    indent = "  "
    for match in META_PATTERN.finditer(head_body):
        tag = match.group(0)
        is_charset = get_attribute(tag, "charset") is not None
        is_viewport = meta_name(tag) == "viewport"
        if is_charset or is_viewport:
            last_preferred_meta_end = match.end()
            indent = infer_indent(head_body, match.start())

    if last_preferred_meta_end is not None:
        block = newline + canonical_meta_lines(indent, newline)
        return (
            head_body[:last_preferred_meta_end]
            + block
            + head_body[last_preferred_meta_end:]
        )

    title_match = TITLE_PATTERN.search(head_body)
    if title_match:
        insert_at = title_match.start()
        indent = infer_indent(head_body, insert_at)
        block = canonical_meta_lines(indent, newline) + newline
        return head_body[:insert_at] + block + head_body[insert_at:]

    closing_indent = "  "
    if head_body.endswith(newline):
        return head_body + canonical_meta_lines(closing_indent, newline) + newline
    return head_body + newline + canonical_meta_lines(closing_indent, newline) + newline


def fix_html(content: str) -> tuple[str, bool, list[str]]:
    """Return repaired content, modification flag, and any unrecoverable problems."""
    head_match = HEAD_PATTERN.search(content)
    if not head_match:
        return content, False, ["缺少 <head> 区域，无法自动插入 meta"]

    is_valid, _ = analyze_html(content)
    if is_valid:
        return content, False, []

    newline = "\r\n" if "\r\n" in content else "\n"
    cleaned_body = remove_target_meta_tags(head_match.group(2))
    fixed_body = insert_canonical_meta_tags(cleaned_body, newline)
    fixed_content = (
        content[: head_match.start(2)] + fixed_body + content[head_match.end(2) :]
    )
    fixed_valid, problems = analyze_html(fixed_content)
    if not fixed_valid:
        return content, False, problems
    return fixed_content, fixed_content != content, []


def read_utf8(path: Path) -> str:
    with path.open("r", encoding="utf-8", newline="") as file:
        return file.read()


def write_utf8(path: Path, content: str) -> None:
    with path.open("w", encoding="utf-8", newline="") as file:
        file.write(content)


def relative_path(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--check", action="store_true", help="仅检查，不修改文件")
    mode.add_argument("--fix", action="store_true", help="自动修复所有 HTML 文件")
    arguments = parser.parse_args()

    invalid_files: list[tuple[Path, list[str]]] = []
    modified_files: list[Path] = []

    for path in find_html_files(ROOT):
        try:
            content = read_utf8(path)
        except UnicodeDecodeError:
            invalid_files.append((path, ["不是有效 UTF-8 文件"] ))
            continue

        if arguments.check:
            is_valid, problems = analyze_html(content)
            if not is_valid:
                invalid_files.append((path, problems))
            continue

        fixed_content, changed, problems = fix_html(content)
        if problems:
            invalid_files.append((path, problems))
            continue
        if changed:
            write_utf8(path, fixed_content)
            modified_files.append(path)

    if invalid_files:
        for path, problems in invalid_files:
            print(f"FAIL {relative_path(path)}: {'；'.join(problems)}")
        if arguments.check:
            print("HTML noindex 检查失败：请运行 python tools/website_privacy_guard.py --fix")
        else:
            print("HTML noindex 修复未完成：请先处理以上页面结构问题")
        return 1

    if arguments.fix:
        for path in modified_files:
            print(f"FIXED {relative_path(path)}")
        if modified_files:
            print(f"已修复 {len(modified_files)} 个 HTML 文件的 noindex 配置。")
        else:
            print("所有 HTML 文件的 noindex 配置均已正确，无需修改。")
    else:
        print("HTML noindex 检查通过：所有 HTML 文件均使用规范配置。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
