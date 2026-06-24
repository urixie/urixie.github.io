---
name: website-article-privacy
description: 为本仓库新增、整理、迁移或修改静态网站文章时，保持现有文章风格并自动执行 noindex 隐私保护校验。
---

# 网站文章隐私保护

## when_to_use

当用户要求新增、整理、迁移、修改本仓库的网站文章，或调整文章首页入口时使用本 Skill。

## rules

1. 新文章必须沿用本站现有视觉风格与文章结构：`article-page-shell`、`article-topbar`、`article card`。
2. 新文章页面位于 `articles/<分类>/<slug>/<slug>.html`，必须引用现有 `assets/css/style.css`，使用相对路径 `../../../assets/css/style.css`。
3. 每个文章 `<head>` 必须包含以下三条 meta：

   ```html
   <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex">
   <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet, noimageindex">
   <meta name="bingbot" content="noindex, nofollow, noarchive, nosnippet, noimageindex">
   ```

4. 不新增 sitemap；不在 `robots.txt` 写入 `Disallow: /`。
5. 如需在首页增加入口，沿用现有 `stack-card` / `platform-item` 风格。
6. 文章图片统一放在文章目录的 `images/` 中，例如 `articles/mcu/<slug>/images/`；附件放在同级 `docs/`，文章专用脚本放在同级 `scripts/`。可以先写本地占位路径，但不得引用 CSDN 外链图片。
7. 不改变既有 CSS、JS、布局或无关文章内容，除非用户明确要求。

## workflow

1. 先查看同分类现有文章和首页对应入口，确认相对路径、缓存版本与卡片结构。
2. 以 `articles/templates/article-template.html` 为起点，在 `articles/<分类>/<slug>/` 创建同名 HTML 页面，再替换标题、摘要、正文和图片路径。
3. 如用户要求首页入口，在对应平台区新增与邻近项目一致的卡片。
4. 修改完成后必须运行：

   ```powershell
   python scripts/website_privacy_guard.py --fix
   python scripts/website_privacy_guard.py --check
   ```

## verification

- 确认新文章可由本地相对链接直接打开。
- 确认 noindex 检查命令返回成功。
- 确认没有新增 sitemap、没有修改 `robots.txt` 为 `Disallow: /`，且没有 CSDN 图片外链。

## final_response_template

```text
新增文章路径：<路径或无>
首页入口：<已添加 / 未添加，说明位置>
noindex 检查：<通过 / 未通过及原因>
图片占位路径：<路径列表或无>
后续需手动下载的图片：<列表或无>
```
