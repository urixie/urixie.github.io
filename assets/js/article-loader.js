(function () {
  const body = document.body;
  const source = body?.dataset.articleSource;
  const rootPrefix = body?.dataset.rootPrefix || '../../../';
  const topicHref = body?.dataset.topicHref;
  const topicLabel = body?.dataset.topicLabel;

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function rewriteArticleTopbar(html) {
    let nextHtml = html;

    nextHtml = nextHtml.replace(/\.\.\/\.\.\/\.\.\/assets\//g, `${rootPrefix}assets/`);

    nextHtml = nextHtml.replace(
      /<a\s+href="[^"]*index\.html[^"]*">\s*←\s*返回首页\s*<\/a>/,
      `<a href="${rootPrefix}index.html?v=704b803539b3">← 返回首页</a>`
    );

    if (topicHref && topicLabel) {
      nextHtml = nextHtml.replace(
        /<a\s+href="[^"]*index\.html[^"]*#[^"]*">\s*返回\s*[^<]+<\/a>/,
        `<a href="${topicHref}">${topicLabel}</a>`
      );
    }

    return nextHtml;
  }

  async function loadArticle() {
    if (!source) {
      throw new Error('Missing data-article-source.');
    }

    const response = await fetch(source, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`Failed to load article source: ${source}`);
    }

    const html = rewriteArticleTopbar(await response.text());
    document.open();
    document.write(html);
    document.close();
  }

  loadArticle().catch(error => {
    const message = escapeHtml(error.message || '文章加载失败');
    document.body.innerHTML = `<main class="article-page-shell"><article class="article card"><h1>文章加载失败</h1><p>${message}</p><p><a href="${rootPrefix}index.html?v=704b803539b3">返回首页</a></p></article></main>`;
  });
})();
