# scripts/download_pic16_images.py
# 用途：
# 1. 自动查找仓库中的 PIC16(L)F188XX 存储器编程规范 Markdown 文件
# 2. 提取 Markdown 中的图片链接
# 3. 下载到 articles/mcu/pic16f188xx-memory-programming/images/
# 4. 自动按网站文章需要的名称重命名
#
# 直接运行即可：
# python scripts/download_pic16_images.py

import os
import re
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path


# 修复 Windows / VSCode 输出中文乱码问题
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass


IMAGE_NAMES = [
    "01-memory-map.png",
    "02-deviceid-register.png",
    "03-revisionid-register.png",
    "04-hvp-entry-exit-timing.png",
    "05-lvp-entry-exit-timing.png",
    "06-icsp-command-data-timing.png",
    "07-load-data-pfm.png",
    "08-load-data-dfm.png",
    "09-read-data-pfm.png",
    "10-increment-address.png",
    "11-load-pc-address.png",
    "12-begin-internal-timed-programming.png",
    "13-begin-external-timed-programming.png",
    "14-end-external-timed-programming.png",
    "15-bulk-erase-timing.png",
    "16-row-erase-timing.png",
    "17-programming-flow-overview.png",
    "18-user-id-config-programming-flow.png",
    "19-program-flash-row-flow.png",
    "20-eeprom-row-flow.png",
    "21-program-flash-verify-flow.png",
    "22-data-eeprom-verify-flow.png",
    "23-electrical-spec-table-1.png",
    "24-electrical-spec-table-2.png",
    "25-electrical-spec-table-3.png",
    "26-electrical-spec-table-4.png",
    "27-electrical-spec-table-5.png",
    "28-electrical-spec-table-6.png",
    "29-electrical-spec-table-7.png",
    "30-config-word-1-fosc.png",
    "31-config-word-2-debug-bor-mclr.png",
    "32-config-word-3-wdt.png",
    "33-config-word-4-lvp-wrt.png",
    "34-config-word-5-code-protection.png",
]


def get_repo_root() -> Path:
    """
    当前脚本位于 scripts/ 下时，仓库根目录就是 scripts 的上一级。
    如果脚本不在 scripts 下，也尽量向上查找 index.html。
    """
    script_path = Path(__file__).resolve()
    current = script_path.parent

    for parent in [current, *current.parents]:
        if (parent / "index.html").exists():
            return parent

    return script_path.parent.parent


def read_text_auto_encoding(path: Path) -> str:
    """
    尝试用常见编码读取 Markdown。
    """
    encodings = ["utf-8", "utf-8-sig", "gbk", "gb18030"]

    for enc in encodings:
        try:
            return path.read_text(encoding=enc)
        except UnicodeDecodeError:
            continue

    raise RuntimeError(f"无法识别文件编码：{path}")


def extract_image_urls(markdown_text: str):
    """
    提取 Markdown 图片链接：
    ![Image](https://xxx)
    """
    pattern = r"!\[[^\]]*\]\((https?://[^)]+)\)"
    return re.findall(pattern, markdown_text)


def find_markdown_file(repo_root: Path) -> Path:
    """
    自动寻找包含 PIC16 和图片链接的 Markdown 文件。
    优先找文件名包含 PIC16 的 md。
    """
    candidates = []

    for path in repo_root.rglob("*.md"):
        # 跳过 .git、node_modules 等目录
        parts = set(path.parts)
        if ".git" in parts or "node_modules" in parts:
            continue

        name_upper = path.name.upper()
        if "PIC16" in name_upper or "F188" in name_upper:
            candidates.append(path)

    # 如果文件名没匹配到，再扫描所有 md 内容
    if not candidates:
        candidates = list(repo_root.rglob("*.md"))

    matched = []

    for path in candidates:
        try:
            text = read_text_auto_encoding(path)
        except Exception:
            continue

        urls = extract_image_urls(text)
        text_upper = text.upper()

        if urls and ("PIC16" in text_upper or "F188" in text_upper):
            matched.append((path, len(urls)))

    if not matched:
        raise FileNotFoundError(
            "没有找到包含 PIC16/F188 且带图片链接的 Markdown 文件。\n"
            "请把《PIC16 (L) F188XX 存储器编程规范.md》放到仓库根目录，或手动传参运行。"
        )

    # 选择图片数量最多的那个
    matched.sort(key=lambda item: item[1], reverse=True)
    return matched[0][0]


def download_file(url: str, output_path: Path, index: int, total: int):
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0 Safari/537.36"
        )
    }

    request = urllib.request.Request(url, headers=headers)

    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            data = response.read()

        if not data:
            raise RuntimeError("下载内容为空")

        output_path.write_bytes(data)

        size_kb = len(data) / 1024
        print(f"[{index:02d}/{total}] 成功：{output_path}  ({size_kb:.1f} KB)")
        return True

    except urllib.error.HTTPError as e:
        print(f"[{index:02d}/{total}] 失败：HTTP {e.code}")
        print(f"链接：{url}")
        return False

    except urllib.error.URLError as e:
        print(f"[{index:02d}/{total}] 失败：URL 错误：{e.reason}")
        print(f"链接：{url}")
        return False

    except Exception as e:
        print(f"[{index:02d}/{total}] 失败：{e}")
        print(f"链接：{url}")
        return False


def main():
    repo_root = get_repo_root()

    output_dir = repo_root / "articles" / "mcu" / "pic16f188xx-memory-programming" / "images"
    output_dir.mkdir(parents=True, exist_ok=True)

    # 支持手动传参；如果没传参，就自动查找
    if len(sys.argv) >= 2:
        md_path = Path(sys.argv[1])
        if not md_path.is_absolute():
            md_path = repo_root / md_path
    else:
        md_path = find_markdown_file(repo_root)

    if not md_path.exists():
        print(f"错误：找不到 Markdown 文件：{md_path}")
        sys.exit(1)

    print(f"仓库根目录：{repo_root}")
    print(f"Markdown 文件：{md_path}")
    print(f"图片输出目录：{output_dir}")
    print()

    markdown_text = read_text_auto_encoding(md_path)
    urls = extract_image_urls(markdown_text)

    print(f"发现图片链接数量：{len(urls)}")
    print(f"预设图片文件名数量：{len(IMAGE_NAMES)}")
    print()

    if len(urls) == 0:
        print("错误：Markdown 中没有找到图片链接。")
        sys.exit(1)

    if len(urls) != len(IMAGE_NAMES):
        print("警告：图片链接数量和预设文件名数量不一致。")
        print("脚本会按较少的数量继续下载，请下载后检查是否漏图。")
        print()

    total = min(len(urls), len(IMAGE_NAMES))
    success_count = 0

    for i in range(total):
        output_path = output_dir / IMAGE_NAMES[i]
        ok = download_file(urls[i], output_path, i + 1, total)

        if ok:
            success_count += 1

        time.sleep(0.3)

    print()
    print("处理完成。")
    print(f"成功下载：{success_count}/{total}")
    print(f"图片目录：{output_dir}")

    if success_count < total:
        print()
        print("有图片下载失败。")
        print("常见原因：飞书图片链接已过期。")
        print("解决方法：重新从飞书导出 Markdown，或重新复制带有效图片链接的 Markdown 后再运行。")


if __name__ == "__main__":
    main()
