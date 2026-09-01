#!/usr/bin/env python3
"""Build the PIC16F18854 datasheet article and download its referenced images.

Run from the repository root:
    python articles/mcu/pic16f18854-datasheet-notes/scripts/build_pic16f18854_article.py

The source Markdown stays authoritative.  Remote Feishu images are saved locally
so the published GitHub Pages article does not rely on those temporary URLs.
"""

from __future__ import annotations

import argparse
import html
import mimetypes
import re
import shutil
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ARTICLE_DIRECTORY = Path(__file__).resolve().parents[1]
REPO_ROOT = next(
    candidate for candidate in (ARTICLE_DIRECTORY, *ARTICLE_DIRECTORY.parents)
    if (candidate / ".git").exists()
)
SOURCE_PATH = next(ARTICLE_DIRECTORY.glob("*.md"), None)
ARTICLE_PATH = ARTICLE_DIRECTORY / f"{ARTICLE_DIRECTORY.name}.html"
IMAGE_DIRECTORY = ARTICLE_DIRECTORY / "images"
IMAGE_RE = re.compile(r"^!\[(?P<alt>[^]]*)\]\((?P<url>https?://[^)]+)\)\s*$", re.MULTILINE)
HEADING_RE = re.compile(r"^(?P<marks>#{1,3})\s+(?P<text>.+?)\s*$", re.MULTILINE)
UNORDERED_RE = re.compile(r"^(?P<indent>\s*)[-*]\s+(?P<text>.+)$")
ORDERED_RE = re.compile(r"^(?P<indent>\s*)\d+[.)]\s+(?P<text>.+)$")


def image_extension(content_type: str | None, filename: Path) -> str:
    """Choose a useful extension even when the remote service omits one."""
    if content_type:
        content_type = content_type.split(";", 1)[0].strip().lower()
        extension = mimetypes.guess_extension(content_type)
        if extension == ".jpe":
            return ".jpg"
        if extension:
            return extension
    return filename.suffix if filename.suffix else ".png"


def download_images(urls: list[str], refresh: bool) -> tuple[dict[str, Path], list[str]]:
    """Download every unique image URL and return its local path mapping."""
    IMAGE_DIRECTORY.mkdir(parents=True, exist_ok=True)
    downloaded: dict[str, Path] = {}
    failures: list[str] = []
    for number, url in enumerate(dict.fromkeys(urls), start=1):
        existing = next(IMAGE_DIRECTORY.glob(f"{number:02d}-*"), None)
        if existing and existing.stat().st_size and not refresh:
            downloaded[url] = existing
            continue
        request = Request(url, headers={"User-Agent": "Mozilla/5.0 (article asset downloader)"})
        try:
            with urlopen(request, timeout=45) as response:
                extension = image_extension(response.headers.get_content_type(), Path(response.url))
                destination = IMAGE_DIRECTORY / f"{number:02d}-pic16f18854{extension}"
                temporary = destination.with_suffix(destination.suffix + ".part")
                with temporary.open("wb") as output:
                    shutil.copyfileobj(response, output)
                temporary.replace(destination)
        except (HTTPError, URLError, TimeoutError, OSError) as error:
            failures.append(f"{number:02d}: {error}")
            continue
        downloaded[url] = destination
    return downloaded, failures


def inline_markdown(value: str) -> str:
    """Render the small Markdown subset used by the supplied notes."""
    value = html.escape(value.strip())
    value = re.sub(r"\\([.#*+\-()&lt;&gt;])", r"\1", value)
    value = re.sub(r"`([^`]+)`", r"<code>\1</code>", value)
    value = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", value)
    value = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<em>\1</em>", value)
    return value


def heading_id(text: str, seen: dict[str, int]) -> str:
    base = re.sub(r"[^a-zA-Z0-9\u4e00-\u9fff]+", "-", re.sub(r"<.*?>", "", text)).strip("-").lower() or "section"
    seen[base] = seen.get(base, 0) + 1
    return base if seen[base] == 1 else f"{base}-{seen[base]}"


def render_markdown(source: str, local_images: dict[str, Path]) -> str:
    """Convert headings, paragraphs, lists, and images to article HTML."""
    output: list[str] = []
    paragraph: list[str] = []
    list_stack: list[str] = []
    seen_ids: dict[str, int] = {}
    image_number = 0
    first_heading = True

    def flush_paragraph() -> None:
        if paragraph:
            output.append(f"      <p>{inline_markdown(' '.join(paragraph))}</p>")
            paragraph.clear()

    def close_lists() -> None:
        while list_stack:
            output.append(f"      </{list_stack.pop()}>")

    for raw_line in source.splitlines():
        line = raw_line.rstrip()
        image_match = IMAGE_RE.match(line)
        heading_match = HEADING_RE.match(line)
        list_match = UNORDERED_RE.match(line) or ORDERED_RE.match(line)
        if image_match:
            flush_paragraph()
            close_lists()
            image_number += 1
            local_path = local_images.get(image_match.group("url"))
            if local_path:
                src = local_path.relative_to(ARTICLE_PATH.parent).as_posix()
                caption = f"图 {image_number}：PIC16F18854 数据手册资料图。"
                output.extend((
                    "      <figure>",
                    f"        <img src=\"{src}\" alt=\"{html.escape(image_match.group('alt') or caption)}\">",
                    f"        <figcaption>{caption}</figcaption>",
                    "      </figure>",
                ))
            else:
                output.append(f"      <p class=\"article-warning\">图 {image_number} 下载失败，请重新运行图片下载脚本。</p>")
            continue
        if heading_match:
            flush_paragraph()
            close_lists()
            raw_heading = inline_markdown(heading_match.group("text"))
            level = len(heading_match.group("marks"))
            if first_heading:
                first_heading = False
                continue
            tag = f"h{min(level + 1, 4)}"
            identifier = heading_id(raw_heading, seen_ids)
            output.append(f"      <{tag} id=\"{identifier}\">{raw_heading}</{tag}>")
            continue
        if not line.strip():
            flush_paragraph()
            close_lists()
            continue
        if list_match:
            flush_paragraph()
            kind = "ol" if ORDERED_RE.match(line) else "ul"
            depth = len(list_match.group("indent").expandtabs(2)) // 2 + 1
            while len(list_stack) > depth:
                output.append(f"      </{list_stack.pop()}>")
            while len(list_stack) < depth:
                list_stack.append(kind)
                output.append(f"      <{kind}>")
            output.append(f"        <li>{inline_markdown(list_match.group('text'))}</li>")
            continue
        paragraph.append(line)
    flush_paragraph()
    close_lists()
    return "\n".join(output)


def build_navigation(source: str) -> str:
    """Create the article sidebar from the same Markdown headings as the body."""
    entries: list[str] = []
    seen_ids: dict[str, int] = {}
    first_heading = True
    for match in HEADING_RE.finditer(source):
        title = inline_markdown(match.group("text"))
        if first_heading:
            first_heading = False
            continue
        identifier = heading_id(title, seen_ids)
        entries.append(f"          <a href=\"#{identifier}\">{title}</a>")
    return "\n".join(entries)


def build_article(body: str, navigation: str) -> str:
    return f"""<!doctype html>
<html lang=\"zh-CN\">
<head>
  <meta charset=\"UTF-8\">
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
  <meta name=\"robots\" content=\"noindex, nofollow, noarchive, nosnippet, noimageindex\">
  <meta name=\"googlebot\" content=\"noindex, nofollow, noarchive, nosnippet, noimageindex\">
  <meta name=\"bingbot\" content=\"noindex, nofollow, noarchive, nosnippet, noimageindex\">
  <meta name=\"description\" content=\"PIC16F18854 数据手册中断、PPS、PWM、定时器、CCP 与 CLC 模块资料整理。\">
  <title>PIC16F18854 单片机数据手册资料整理 - XYJ</title>
  <link rel=\"stylesheet\" href=\"../../assets/css/style.css\">
</head>
<body>
  <main class=\"article-page-shell\">
    <aside class=\"article-sidebar\" aria-label=\"文章导航\">
      <div class=\"article-nav-card\">
        <div class=\"article-nav-actions\">
          <a href=\"../../index.html\">← 返回首页</a>
          <a href=\"../../index.html#mcu-stack\">返回 MCU 平台</a>
        </div>
        <div class=\"article-nav-title\">文章目录</div>
        <nav class=\"article-nav\" aria-label=\"文章目录\">
{navigation}
        </nav>
      </div>
    </aside>
    <article class=\"article card\">
      <div class=\"post-meta\">PIC16F18854 · INTERRUPT · PPS · PWM · TIMER · CCP · CLC</div>
      <h1>PIC16F18854 单片机数据手册资料整理</h1>
      <p>本文依据资料原文整理 PIC16F18854 的中断、外设引脚选择、PWM、定时器、CCP 与可配置逻辑单元等关键模块，便于工程开发时快速查阅。</p>
{body}
      <section class=\"article-footer\">
        <h2>资料说明</h2>
        <p>本文由仓库内 Markdown 源文件自动生成。图片保存在本站本地资源目录，可通过构建脚本重新下载和更新。</p>
      </section>
    </article>
  </main>
  <script src=\"../../assets/js/main.js\"></script>
</body>
</html>
"""


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--skip-download", action="store_true", help="Reuse local images and only regenerate HTML.")
    parser.add_argument("--refresh-images", action="store_true", help="Download images again even when local files exist.")
    arguments = parser.parse_args()
    if SOURCE_PATH is None:
        print("Error: PIC16F18854 Markdown source was not found.", file=sys.stderr)
        return 1
    source = SOURCE_PATH.read_text(encoding="utf-8")
    urls = [match.group("url") for match in IMAGE_RE.finditer(source)]
    local_images: dict[str, Path] = {}
    failures: list[str] = []
    if arguments.skip_download:
        for number, url in enumerate(dict.fromkeys(urls), start=1):
            existing = next(IMAGE_DIRECTORY.glob(f"{number:02d}-*"), None)
            if existing:
                local_images[url] = existing
            else:
                failures.append(f"{number:02d}: local image is missing")
    else:
        local_images, failures = download_images(urls, arguments.refresh_images)
    ARTICLE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with ARTICLE_PATH.open("w", encoding="utf-8", newline="\n") as output:
        output.write(build_article(render_markdown(source, local_images), build_navigation(source)))
    print(f"Generated: {ARTICLE_PATH.relative_to(REPO_ROOT).as_posix()}")
    print(f"Images: {len(local_images)}/{len(dict.fromkeys(urls))} ready")
    if failures:
        print("Image download issues:", file=sys.stderr)
        print("\n".join(f"  {failure}" for failure in failures), file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
