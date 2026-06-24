---
name: markdown-article-publisher
description: 将本仓库中的中文 Markdown 技术资料整理为可部署的静态文章目录，并把远程图片下载为文章本地资源、自动生成文章目录、更新首页入口和缓存版本。用于新增或更新 `articles/**/<slug>/*.md` 技术文档、含 Feishu 等远程图片链接的长文、需要发布到 `articles/` 的文章。
---

# Markdown 文章发布

将 Markdown 作为唯一正文来源，生成的 HTML 与图片资源可重复构建，不手工维护两份长文。

## 工作流

1. 先读取文章目录中的 Markdown，统计一级至三级标题、图片链接、列表和代码块；确认文章归属平台及输出 slug。
2. 在 `articles/<platform>/<slug>/scripts/` 新建或更新 `build_<slug>_article.py`：
   - UTF-8 读取 Markdown；不要用 PowerShell 文本管道重写中文内容。
   - 将远程图片下载到 `articles/<platform>/<slug>/images/`，按稳定序号命名；已存在且非空的文件默认复用，提供 `--refresh-images` 强制重下与 `--skip-download` 仅重建页面。
   - 生成 `articles/<platform>/<slug>/<slug>.html`，图片只能引用同目录的 `images/...`；附件放在 `docs/`，不保留远程临时 URL。
   - 把 Markdown 标题转为稳定 `id`，并以同一组 `id` 生成 `article-sidebar`、返回首页/平台链接和 `article-nav` 目录。
3. 在 `index.html` 对应的平台分类加入文章入口，使用现有 `platform-item` 结构；不要恢复已经删除的首页卡片或章节。
4. 运行构建脚本，再运行 `python scripts/bump_cache_version_from_git.py`，让新文章、图片和首页入口使用同一缓存版本。

## 页面约定

- 复用 `article-page-shell`、`article-sidebar`、`article-nav-card`、`article`、`article-footer` 等现有样式，不引入框架、CDN 或外部字体。
- 页面只有一个 `h1`；源文档后续一级标题从 `h2` 开始映射。
- 中文正文段落使用站点既有的首行缩进、两端对齐和长词换行规则；不要给目录、标题、标签、代码块加首行缩进。
- 为图片提供本地化 `alt` 与图注；下载失败时在生成页保留明确提示，并让脚本以非零状态退出。

## 验证

至少检查：

```powershell
python articles/<platform>/<slug>/scripts/build_<slug>_article.py
python scripts/bump_cache_version_from_git.py
git diff --check
```

再验证生成页没有远程图片域名、图片数量与 Markdown 图片数一致、目录锚点都对应正文标题 ID、首页含带 `v=` 的新文章链接。参考现有实现：`scripts/build_pic16f18854_article.py`。
