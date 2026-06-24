# 网站文章隐私保护工作流

本站的文章页面仍然可以通过已知 URL 直接访问，但所有 HTML 页面都会在 `<head>` 中声明 `noindex`，以要求搜索引擎不收录页面。`robots.txt` 保持允许抓取，让搜索引擎能读取该指令；它不用于隐藏页面。

## 日常检查与修复

在新增或修改 `index.html`、`articles/**/*.html` 或其他 HTML 页面后执行：

```powershell
python tools/website_privacy_guard.py --fix
python tools/website_privacy_guard.py --check
```

`--check` 只检查，不改动文件；发现缺失、重复或内容错误的 `robots`、`googlebot`、`bingbot` meta 时会列出路径并以非 0 状态退出。`--fix` 会在 charset / viewport 后、title 前插入或统一修复这三条 meta，并尽量保留原有 UTF-8 编码与换行风格。

## 启用提交前检查

在仓库根目录运行一次：

```powershell
git config core.hooksPath .githooks
```

之后每次 `git commit` 都会自动执行 noindex 检查；如果失败，按提示运行：

```powershell
python tools/website_privacy_guard.py --fix
```

修复后再提交。GitHub Actions 也会在每次 push 和 pull request 中运行同一项检查。

## 使用仓库内 Codex Skill

项目内 Skill 统一位于 `.codex/skills/`。隐私保护 Skill 的源文件是 `.codex/skills/website-article-privacy/SKILL.md`；如需让当前 Windows 环境中的 Codex 自动发现它，可复制到用户 Skill 目录：

```powershell
Copy-Item -Recurse -Force .\.codex\skills\website-article-privacy "$env:USERPROFILE\.codex\skills\website-article-privacy"
```

也可以在写文章请求中明确指定“使用仓库内 `.codex/skills/website-article-privacy/SKILL.md`”。

## robots.txt 规则

根目录 `robots.txt` 固定为：

```text
User-agent: *
Allow: /
```

不要添加 `Disallow: /` 或 `Sitemap:`。如果今后需要 sitemap，应先确认它不会主动暴露不希望被发现的文章 URL。
