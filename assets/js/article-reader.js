/* 首页内联文章：抓取规范文章页并整篇渲染（连续阅读），目录与滚动高亮由 main.js 的共享组件提供。
   加载顺序：main.js 之后、home.js 之前。 */

function isAbsoluteOrSpecialUrl(value) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#|mailto:|tel:)/i.test(value);
}

function getDirectoryPath(path) {
  return String(path || '').split('#')[0].split('?')[0].replace(/[^/]*$/, '');
}

function resolveRelativeUrl(base, value) {
  if (!value || isAbsoluteOrSpecialUrl(value)) return value;
  try {
    return new URL(value, new URL(base, window.location.href)).pathname.replace(/^\//, '');
  } catch (error) {
    return `${base}${value}`;
  }
}

function getCleanArticleRoot(html, articleHref) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const articleBase = getDirectoryPath(articleHref);

  doc.querySelectorAll('script').forEach(script => script.remove());
  doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => link.remove());
  doc.querySelectorAll('.topbar, .article-topbar, #articleToc, .article-toc, .article-toc-panel').forEach(nav => nav.remove());

  doc.querySelectorAll('[src]').forEach(node => {
    const value = node.getAttribute('src');
    const nextValue = resolveRelativeUrl(articleBase, value);
    if (nextValue) node.setAttribute('src', nextValue);
  });

  doc.querySelectorAll('[href]').forEach(node => {
    const value = node.getAttribute('href');
    if (!value || value.includes('index.html')) return;
    const nextValue = resolveRelativeUrl(articleBase, value);
    if (nextValue) node.setAttribute('href', nextValue);
  });

  return doc.querySelector('article') || doc.querySelector('main') || doc.body;
}

async function fetchInlineArticleRoot(article, options = {}) {
  const articleHref = article.href;
  const response = await fetch(articleHref, { signal: options.signal });
  if (!response.ok) {
    throw new Error(`无法读取文章：${articleHref}`);
  }

  return getCleanArticleRoot(await response.text(), articleHref);
}

function isSkippableArticleNode(node) {
  return node.matches?.('.article-footer, .article-topbar, .topbar, script, style, link');
}

function createInlineArticle(articleRoot) {
  const article = document.createElement('article');
  article.className = 'article inline-article-body';
  Array.from(articleRoot.children).forEach(node => {
    if (!isSkippableArticleNode(node)) article.appendChild(node.cloneNode(true));
  });

  const headings = window.siteUi.getArticleHeadings(article);
  initCopyButtons(article);
  enhanceArticleTables(article);
  enhanceArticleImageZoom(article);
  return { element: article, headings };
}

window.articleReader = {
  fetchInlineArticleRoot,
  createInlineArticle
};
