# -*- coding: utf-8 -*-
# articles/mcu/efm8bb10f8i-qfn20-development-notes/scripts/download_efm8bb10_images.py
# 用途：
# 1. 自动查找仓库中的 EFM8BB10F8I-A-QFN20 开发笔记 Markdown 文件
# 2. 提取 Markdown 中的图片链接
# 3. 下载到 articles/mcu/efm8bb10f8i-qfn20-development-notes/images/
# 4. 自动按网站文章需要的名称重命名

import re
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path


try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass


IMAGE_NAMES = [
    "01-part-number.png",
    "02-ordering-guide.png",
    "03-block-diagram.png",
    "04-interrupt-vector-table.png",
    "05-port-io-overview.png",
    "06-port-io-cell.png",
    "07-crossbar-priority-example.png",
    "08-crossbar-function-map.png",
    "09-pca-block-diagram.png",
    "10-pca-edge-capture.png",
    "11-pca-software-timer.png",
    "12-pca-high-speed-output.png",
    "13-pca-frequency-output.png",
    "14-pca-edge-aligned-pwm-1.png",
    "15-pca-edge-aligned-pwm-2.png",
    "16-pca-edge-aligned-pwm-3.png",
    "17-pca-center-aligned-pwm-1.png",
    "18-pca-center-aligned-pwm-2.png",
    "19-pca-comparator-clear-1.png",
    "20-pca-comparator-clear-2.png",
    "21-timer0-mode0.png",
    "22-timer1-mode0.png",
    "23-timer0-mode1.png",
    "24-timer0-mode2-rate.png",
    "25-timer0-mode2-flow.png",
    "26-timer0-mode3-low-rate.png",
    "27-timer0-mode3-high-rate.png",
    "28-timer0-mode3.png",
    "29-timer2-3-overview.png",
    "30-timer2-3-clock.png",
    "31-timer2-3-capture.png",
    "32-timer16-reload-rate-1.png",
    "33-timer16-reload-rate-2.png",
    "34-timer8-split-low-rate.png",
    "35-timer8-split-high-rate.png",
    "36-timer8-split-mode.png",
    "37-timer-capture-mode.png",
    "38-adc-overview.png",
    "39-adc-input-mux.png",
    "40-bootloader-flash-map.png",
    "41-c2-debug-connection.png",
    "42-c2-pin-sharing-resistors.png",
    "43-c2-debug-adapter.png",
    "44-example-adc-external-input.png",
    "45-example-adc-lib-polled.png",
    "46-example-adc-temp-sensor.png",
    "47-example-blinky-simple.png",
    "48-example-cpt112s-demo.png",
    "49-example-external-interrupts.png",
    "50-example-oscillators-hfosc.png",
    "51-example-pca-frequency-output.png",
    "52-example-pca-frequency-output-waveform-1.png",
    "53-example-pca-frequency-output-waveform-2.png",
    "54-example-pca-lib-frequency-output.png",
    "55-example-portio-switch-led.png",
    "56-example-timer0-16bit.png",
    "57-example-timer2-two8bit.png",
    "58-example-voltmeter.png",
]


def get_repo_root() -> Path:
    script_path = Path(__file__).resolve()
    current = script_path.parent

    for parent in [current, *current.parents]:
        if (parent / "index.html").exists():
            return parent

    return script_path.parent.parent


def read_text_auto_encoding(path: Path) -> str:
    encodings = ["utf-8", "utf-8-sig", "gbk", "gb18030"]

    for enc in encodings:
        try:
            return path.read_text(encoding=enc)
        except UnicodeDecodeError:
            continue

    raise RuntimeError(f"无法识别文件编码：{path}")


def extract_image_urls(markdown_text: str):
    pattern = r"!\[[^\]]*\]\((https?://[^)]+)\)"
    return re.findall(pattern, markdown_text)


def find_markdown_file(repo_root: Path) -> Path:
    candidates = []

    for path in repo_root.rglob("*.md"):
        parts = set(path.parts)
        if ".git" in parts or "node_modules" in parts:
            continue

        name_upper = path.name.upper()

        if "EFM8" in name_upper or "BB10" in name_upper or "QFN20" in name_upper:
            candidates.append(path)

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

        if urls and ("EFM8" in text_upper or "BB10" in text_upper or "QFN20" in text_upper):
            matched.append((path, len(urls)))

    if not matched:
        raise FileNotFoundError(
            "没有找到包含 EFM8/BB10/QFN20 且带图片链接的 Markdown 文件。\n"
            "请把《EFM8BB10F8I-A-QFN20开发笔记.md》放到仓库根目录，或手动传参运行。"
        )

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

    output_dir = repo_root / "articles" / "mcu" / "efm8bb10f8i-qfn20-development-notes" / "images"
    output_dir.mkdir(parents=True, exist_ok=True)

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
