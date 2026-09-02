---
name: markdown-article-publisher
description: 将本仓库中的中文 Markdown 技术资料整理为可部署的静态文章目录，并把远程图片下载为文章本地资源、自动生成文章目录、更新首页入口和缓存版本。用于新增或更新 articles 下按 slug 组织的 Markdown 技术文档、含 Feishu 等远程图片链接的长文、需要发布到 articles/ 的文章。
---

# Markdown 文章发布

将 Markdown 作为唯一正文来源，生成的 HTML 与图片资源可重复构建，不手工维护两份长文。普通短文可以直接使用 `scripts/new_article.py` 生成骨架；长篇 Markdown 文章仍以专用构建脚本负责正文转换和图片本地化。

## 新文章入口

先用统一脚手架注册文章，避免手工计算相对路径、手工修改首页导航或漏掉模板约定：

```powershell
python scripts/new_article.py `
  --topic mcu `
  --category espressif `
  --slug esp32-s3-example `
  --title "ESP32-S3 示例文章" `
  --description "文章摘要，同时作为 meta description。" `
  --tags ESP32-S3 ESP-IDF
```

该命令会创建 `articles/<topic>/<category>/<slug>/<slug>.html`，在本地创建 `images/` 与 `docs/` 目录，更新 `data/site-map.json`，重新生成 `assets/js/home-data.js`，同步缓存版本并执行内容检查。需要只验证参数和模板时使用 `--dry-run`。

## Markdown 长文工作流

1. 先读取文章目录中的 Markdown，统计一级至三级标题、图片链接、列表和代码块；确认文章归属平台及输出 slug。
2. 若文章尚未注册，先运行 `scripts/new_article.py` 创建规范目录和站点入口；随后保留 Markdown 为唯一正文来源。
3. 在文章目录的 `scripts/` 中新建或更新 `build_<slug>_article.py`：
   - UTF-8 读取 Markdown；不要用 PowerShell 文本管道重写中文内容。
   - 将远程图片下载到同级 `images/`，按稳定序号命名；已存在且非空的文件默认复用，提供 `--refresh-images` 强制重下与 `--skip-download` 仅重建页面。
   - 如需用 Python/Pillow 生成本地图、时序图或流程图，不要通过 PowerShell here-string / 管道传递含中文的绘图脚本；优先把脚本作为 UTF-8 文件运行，或在内联脚本中用 `\uXXXX` Unicode 转义构造中文文本，并显式加载中文字体。生成后必须抽查图片，确认中文没有变成 `?`。
   - 生成同目录 `<slug>.html`，图片只能引用 `images/...`；附件放在 `docs/`，不保留远程临时 URL。
   - 页面使用模板中的 `article-sidebar` 与 `<nav id="articleToc" data-auto-toc>`。正文 `h2` / `h3` 可以保留显式稳定 id；没有 id 时 `assets/js/main.js` 会依据标题文本自动生成稳定锚点，并同步生成目录。
4. 构建正文后运行缓存版本同步脚本和仓库检查。

## 页面约定

- 复用 `article-page-shell`、`article-sidebar`、`article-nav-card`、`article`、`article-footer` 等现有样式，不引入框架、CDN 或外部字体。
- 页面只有一个 `h1`；`<title>` 必须严格等于 `<h1> - XYJ`。
- 新模板使用 `<p class="article-summary">` 作为摘要时，其文本必须与 `meta description` 完全一致。
- 源文档后续一级标题映射为 `h2`，二级标题映射为 `h3`；不要从 `h2` 直接跳到 `h4`。
- 中文正文段落使用站点既有的首行缩进、两端对齐和长词换行规则；不要给目录、标题、标签、代码块加首行缩进。
- 图片必须本地化并提供有效 `alt`，同时使用 `loading="lazy" decoding="async"`；下载失败时构建脚本以非零状态退出。
- 首页分类、文章路径和标签只维护在 `data/site-map.json`；`assets/js/home-data.js` 是生成文件，不直接编辑。

## 验证

至少检查：

```powershell
python scripts/generate_home_data.py --check
python scripts/bump_cache_version_from_git.py --check
python scripts/validate_content.py
python scripts/browser_layout_guard.py
```

Markdown 构建脚本执行后若静态资源发生变化，应先运行：

```powershell
python scripts/bump_cache_version_from_git.py
```

再执行上述 `--check`。验证生成页没有远程图片域名、图片数量与 Markdown 图片数一致、目录锚点都对应正文标题、首页路由可打开目标文章。参考既有长文构建方式时，应优先复用当前模板与公共校验脚本，而不是复制旧文章中的历史路径或手写缓存版本。
