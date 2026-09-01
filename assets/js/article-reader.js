/* Inline article loading and section reader. Loaded after main.js and before home.js. */

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

async function fetchInlineArticleRoot(article) {
  const articleHref = article.href;
  const response = await fetch(articleHref, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`无法读取文章：${articleHref}`);
  }

  return getCleanArticleRoot(await response.text(), articleHref);
}

function isSkippableArticleNode(node) {
  return node.matches?.('.article-footer, .article-topbar, .topbar, script, style, link');
}

function getSectionTitle(heading, index) {
  return heading?.textContent?.trim() || `章节 ${index + 1}`;
}

function getSectionId(container, heading, index) {
  if (heading?.id) return heading.id;
  if (container?.id) return container.id;
  return `article-section-${index + 1}`;
}

function cloneNodes(nodes) {
  return nodes.map(node => node.cloneNode(true));
}

function createSectionFromContainer(container, index) {
  const heading = container.matches?.('h2') ? container : container.querySelector?.('h2');
  return {
    id: getSectionId(container, heading, index),
    title: getSectionTitle(heading, index),
    nodes: [container.cloneNode(true)]
  };
}

function extractDirectSectionBlocks(children) {
  const sections = [];

  children.forEach(node => {
    if (isSkippableArticleNode(node)) return;
    if (node.matches?.('section') && node.querySelector('h2')) {
      sections.push(createSectionFromContainer(node, sections.length));
    }
  });

  return sections;
}

function extractSiblingSections(children) {
  const sections = [];
  let current = null;

  children.forEach(node => {
    if (isSkippableArticleNode(node)) return;

    if (node.matches?.('h2')) {
      current = {
        id: getSectionId(node, node, sections.length),
        title: getSectionTitle(node, sections.length),
        nodes: [node.cloneNode(true)]
      };
      sections.push(current);
      return;
    }

    if (current) {
      current.nodes.push(node.cloneNode(true));
    }
  });

  return sections;
}

function extractDeepSections(articleRoot) {
  const sections = [];
  const headings = Array.from(articleRoot.querySelectorAll('h2'));

  headings.forEach(heading => {
    const container = heading.closest('section') || heading.parentElement || heading;
    if (!container || isSkippableArticleNode(container)) return;
    if (sections.some(section => section.source === container)) return;

    const section = createSectionFromContainer(container, sections.length);
    section.source = container;
    sections.push(section);
  });

  return sections.map(({ source, ...section }) => section);
}

function extractFullArticle(articleRoot) {
  const nodes = Array.from(articleRoot.children).filter(node => !isSkippableArticleNode(node));
  return [{
    id: 'article-full',
    title: '全文',
    nodes: cloneNodes(nodes)
  }];
}

function extractArticleSections(articleRoot) {
  const children = Array.from(articleRoot.children).filter(node => !isSkippableArticleNode(node));

  const directSectionBlocks = extractDirectSectionBlocks(children);
  if (directSectionBlocks.length > 0) return directSectionBlocks;

  const siblingSections = extractSiblingSections(children);
  if (siblingSections.length > 0) return siblingSections;

  const deepSections = extractDeepSections(articleRoot);
  if (deepSections.length > 0) return deepSections;

  return extractFullArticle(articleRoot);
}

function renderSectionInto(content, section) {
  content.replaceChildren();
  section.nodes.forEach(node => content.appendChild(node.cloneNode(true)));
  content.scrollTop = 0;
  initCopyButtons(content);
  enhanceArticleTables(content);
  enhanceArticleImageZoom(content);
}

function createSectionedArticleReader(articleRoot) {
  const sections = extractArticleSections(articleRoot);
  const reader = document.createElement('div');
  reader.className = 'inline-article-reader card';

  const nav = document.createElement('aside');
  nav.className = 'inline-section-nav';

  const navTitle = document.createElement('div');
  navTitle.className = 'inline-section-nav-title';
  navTitle.textContent = '文章目录';
  nav.appendChild(navTitle);

  const navList = document.createElement('div');
  navList.className = 'inline-section-list';
  nav.appendChild(navList);

  const content = document.createElement('article');
  content.className = 'inline-section-content article';

  const buttons = sections.map((section, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'inline-section-button';
    button.textContent = section.title;
    button.dataset.sectionId = section.id;
    button.addEventListener('click', () => {
      buttons.forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      renderSectionInto(content, section);
    });
    navList.appendChild(button);
    return button;
  });

  if (buttons[0]) buttons[0].classList.add('active');
  renderSectionInto(content, sections[0]);

  reader.append(nav, content);
  return reader;
}

window.articleReader = {
  fetchInlineArticleRoot,
  createSectionedArticleReader
};
