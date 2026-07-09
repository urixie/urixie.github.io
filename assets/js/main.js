const yearTargets = document.querySelectorAll('[data-current-year]');

yearTargets.forEach(target => {
  target.textContent = new Date().getFullYear();
});

function getWorkExperience(startYear, startMonth) {
  const now = new Date();
  const months = (now.getFullYear() - startYear) * 12 + (now.getMonth() - startMonth);
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return remainingMonths ? `${years}年${remainingMonths}个月` : `${years}年`;
}

document.querySelectorAll('#work-experience, #work-experience-about').forEach(target => {
  target.textContent = getWorkExperience(2022, 1);
});

const legacyHomeHashMap = {
  'hardware-stack': ['foundation', 'c-basic'],
  'c-basic': ['foundation', 'c-basic'],
  'c-pointer': ['foundation', 'pointer-memory'],
  'c-data-storage': ['foundation', 'pointer-memory'],
  'c-stack-heap': ['foundation', 'pointer-memory'],
  'c-struct': ['foundation', 'data-structure'],
  'c-embedded': ['foundation', 'embedded-c'],
  'c-debug': ['foundation', 'debug-engineering'],
  'verilog-basic': ['fpga', 'hdl-basic'],
  'verilog-logic': ['fpga', 'hdl-basic'],
  'verilog-fsm': ['fpga', 'hdl-basic'],
  'verilog-sim': ['fpga', 'verification'],
  'windows-uqitong': ['dev-tools', 'windows-install'],
  'windows-iventoy': ['dev-tools', 'pxe-iventoy'],
  'linux-basic': ['soc-linux', 'linux-basic'],
  'linux-process': ['soc-linux', 'linux-basic'],
  'linux-shell': ['soc-linux', 'linux-basic'],
  'linux-embedded': ['soc-linux', 'driver-debug'],
  'linux-uboot': ['soc-linux', 'boot-kernel-rootfs'],
  'linux-kernel-build': ['soc-linux', 'boot-kernel-rootfs'],
  'linux-rootfs-build': ['soc-linux', 'boot-kernel-rootfs'],
  'freertos-basic': ['realtime', 'freertos-basic'],
  'freertos-task': ['realtime', 'task-management'],
  'freertos-ipc': ['realtime', 'ipc-sync'],
  'freertos-debug': ['realtime', 'timer-memory-debug'],
  'mcu-stack': ['mcu', 'common'],
  'mcu-st': ['mcu', 'st'],
  'mcu-wh': ['mcu', 'wh'],
  'mcu-microchip': ['mcu', 'microchip'],
  'mcu-sl': ['mcu', 'silicon-labs'],
  'mcu-espressif': ['mcu', 'espressif'],
  'mcu-xilinx': ['fpga', 'xilinx'],
  'soc-stack': ['soc-linux', 'rockchip'],
  'soc-orbit': ['soc-linux', 'other-soc'],
  'soc-rockchip': ['soc-linux', 'rockchip'],
  'fpga-stack': ['fpga', 'hdl-basic'],
  'fpga-microchip': ['fpga', 'microchip'],
  'fpga-lattice': ['fpga', 'lattice'],
  'fpga-anlogic': ['fpga', 'anlogic'],
  'gui-stack': ['gui', 'lvgl'],
  'gui-nxp': ['gui', 'nxp'],
  'gui-dfc': ['gui', 'dfc'],
  'host-stack': ['host-tools', 'debug-config'],
  'host-wireless': ['host-tools', 'wireless-client'],
  'host-debug': ['host-tools', 'debug-config'],
  'about': ['about', null]
};

const homeState = {
  topicId: '',
  categoryId: '',
  articleSlug: '',
  articleHref: ''
};

function getHomeTopics() {
  return Array.isArray(window.siteMap) ? window.siteMap : [];
}

function getArticleCount(category) {
  return Array.isArray(category?.articles) ? category.articles.length : 0;
}

function getTopicArticleCount(topic) {
  if (!Array.isArray(topic?.children)) return 0;
  return topic.children.reduce((total, category) => total + getArticleCount(category), 0);
}

function findTopic(topicId) {
  return getHomeTopics().find(topic => topic.id === topicId) || getHomeTopics()[0] || null;
}

function findCategory(topic, categoryId) {
  if (!Array.isArray(topic?.children) || topic.children.length === 0) return null;
  return topic.children.find(category => category.id === categoryId) || topic.children[0];
}

function getArticleSlug(article) {
  if (!article?.href) return '';
  const cleanHref = article.href.split('#')[0].split('?')[0];
  const filename = cleanHref.split('/').filter(Boolean).pop() || '';
  return filename.replace(/\.html$/i, '');
}

function findArticle(category, articleSlug) {
  const articles = Array.isArray(category?.articles) ? category.articles : [];
  if (!articles.length) return null;
  return articles.find(article => getArticleSlug(article) === articleSlug) || articles[0];
}

function buildHomeHash(topic, category, article) {
  if (!topic) return '#foundation/c-basic';
  if (category && article) return `#${topic.id}/${category.id}/${getArticleSlug(article)}`;
  if (category) return `#${topic.id}/${category.id}`;
  return `#${topic.id}`;
}

function updateHomeHash(topic, category, article, options = {}) {
  if (options.skipHash) return;
  const nextHash = buildHomeHash(topic, category, article);
  if (window.location.hash === nextHash) return;
  const method = options.replace ? 'replaceState' : 'pushState';
  window.history[method](null, '', nextHash);
}

function parseHomeHash() {
  const rawHash = decodeURIComponent(window.location.hash.replace(/^#/, '').trim());
  if (!rawHash) return { topicId: 'foundation', categoryId: 'c-basic', articleSlug: '' };

  if (legacyHomeHashMap[rawHash]) {
    const [topicId, categoryId] = legacyHomeHashMap[rawHash];
    return { topicId, categoryId, articleSlug: '' };
  }

  const [topicId, categoryId, articleSlug] = rawHash.split('/').filter(Boolean);
  return { topicId: topicId || 'foundation', categoryId: categoryId || null, articleSlug: articleSlug || '' };
}

function scrollHomeToTop() {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
}

function createCountLabel(count) {
  return count > 0 ? `${count}篇` : '暂无';
}

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

function createLoadingCard(message = '正在加载文章...') {
  const wrapper = document.createElement('div');
  wrapper.className = 'inline-article-placeholder card';
  wrapper.innerHTML = `<p>${message}</p>`;
  return wrapper;
}

function createErrorCard(message) {
  const wrapper = document.createElement('div');
  wrapper.className = 'inline-article-placeholder card is-error';
  const title = document.createElement('h2');
  title.textContent = '文章加载失败';
  const desc = document.createElement('p');
  desc.textContent = message || '请稍后刷新页面重试。';
  wrapper.append(title, desc);
  return wrapper;
}

function createArticleWelcome(topic, category) {
  const wrapper = document.createElement('div');
  wrapper.className = 'inline-article-placeholder card';

  const eyebrow = document.createElement('span');
  eyebrow.className = 'inline-article-eyebrow';
  eyebrow.textContent = topic?.title || '文章阅读';

  const title = document.createElement('h2');
  title.textContent = category ? category.title : '选择左侧文章开始阅读';

  const desc = document.createElement('p');
  desc.textContent = category?.desc || topic?.desc || '左侧二级导航已经整合文章索引，点击任意文章后将在这里直接加载正文。';

  wrapper.append(eyebrow, title, desc);
  return wrapper;
}

function extractArticleSourceFromRoute(html, routeHref) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const body = doc.body;
  const source = body?.dataset.articleSource;
  if (!source) return null;
  const routeBase = getDirectoryPath(routeHref);
  return resolveRelativeUrl(routeBase, source);
}

function rewriteInlineArticleHtml(html, sourceHref) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const sourceBase = getDirectoryPath(sourceHref);

  doc.querySelectorAll('script').forEach(script => script.remove());
  doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => link.remove());
  doc.querySelectorAll('.topbar, .article-topbar').forEach(nav => nav.remove());

  doc.querySelectorAll('[src]').forEach(node => {
    const value = node.getAttribute('src');
    const nextValue = resolveRelativeUrl(sourceBase, value);
    if (nextValue) node.setAttribute('src', nextValue);
  });

  doc.querySelectorAll('[href]').forEach(node => {
    const value = node.getAttribute('href');
    if (!value || value.includes('index.html')) return;
    const nextValue = resolveRelativeUrl(sourceBase, value);
    if (nextValue) node.setAttribute('href', nextValue);
  });

  const article = doc.querySelector('article') || doc.querySelector('main') || doc.body;
  return article.innerHTML;
}

async function fetchInlineArticleHtml(article) {
  const routeHref = article.href;
  const routeResponse = await fetch(routeHref, { cache: 'no-cache' });
  if (!routeResponse.ok) {
    throw new Error(`无法读取文章入口：${routeHref}`);
  }

  const routeHtml = await routeResponse.text();
  const sourceHref = extractArticleSourceFromRoute(routeHtml, routeHref) || routeHref;
  const sourceResponse = await fetch(sourceHref, { cache: 'no-cache' });
  if (!sourceResponse.ok) {
    throw new Error(`无法读取文章源文件：${sourceHref}`);
  }

  return rewriteInlineArticleHtml(await sourceResponse.text(), sourceHref);
}

async function renderInlineArticle(topic, category, article, options = {}) {
  const articleList = document.querySelector('#articleList');
  const articleEmpty = document.querySelector('#articleEmpty');
  const contentIndex = document.querySelector('#contentIndex');
  const contentTitle = document.querySelector('#contentTitle');
  const contentDesc = document.querySelector('#contentDesc');

  if (!articleList || !article) return;

  homeState.topicId = topic?.id || '';
  homeState.categoryId = category?.id || '';
  homeState.articleSlug = getArticleSlug(article);
  homeState.articleHref = article.href;

  if (contentIndex) contentIndex.textContent = 'READ';
  if (contentTitle) contentTitle.textContent = article.title;
  if (contentDesc) contentDesc.textContent = article.desc || category?.desc || '';
  if (articleEmpty) articleEmpty.classList.add('hidden');

  articleList.replaceChildren(createLoadingCard());
  renderPrimaryNav();
  renderSecondaryNav(topic);
  updateHomeHash(topic, category, article, options);

  try {
    const html = await fetchInlineArticleHtml(article);
    const articleShell = document.createElement('article');
    articleShell.className = 'inline-article article card';
    articleShell.innerHTML = html;
    articleList.replaceChildren(articleShell);

    if (window.initArticlePage) {
      window.initArticlePage(articleShell);
    }
  } catch (error) {
    articleList.replaceChildren(createErrorCard(error.message));
  }

  if (options.scroll !== false) {
    scrollHomeToTop();
  }
}

function renderPrimaryNav() {
  const primaryNav = document.querySelector('#primaryNav');
  if (!primaryNav) return;

  primaryNav.replaceChildren();

  getHomeTopics().forEach((topic, index) => {
    const button = document.createElement('button');
    const active = topic.id === homeState.topicId;
    button.type = 'button';
    button.className = 'primary-nav-button';
    button.dataset.topicId = topic.id;
    button.title = topic.title;
    button.setAttribute('aria-current', active ? 'page' : 'false');
    button.setAttribute('aria-selected', String(active));
    button.classList.toggle('active', active);

    const code = document.createElement('span');
    code.className = 'primary-nav-code';
    code.textContent = topic.shortTitle || String(index + 1).padStart(2, '0');

    const title = document.createElement('span');
    title.className = 'primary-nav-title';
    title.textContent = topic.title;

    const count = document.createElement('span');
    count.className = 'primary-nav-count';
    count.textContent = topic.id === 'about' ? 'INFO' : createCountLabel(getTopicArticleCount(topic));

    button.append(code, title, count);
    button.addEventListener('click', () => switchTopic(topic.id));
    primaryNav.appendChild(button);
  });
}

function renderSecondaryNav(topic) {
  const homeShell = document.querySelector('.home-shell');
  const secondarySidebar = document.querySelector('.secondary-sidebar');
  const secondaryEyebrow = document.querySelector('#secondaryEyebrow');
  const secondaryTitle = document.querySelector('#secondaryTitle');
  const secondaryDesc = document.querySelector('#secondaryDesc');
  const secondaryNav = document.querySelector('#secondaryNav');

  if (!topic || !homeShell || !secondarySidebar || !secondaryNav) return;

  const hasChildren = Array.isArray(topic.children) && topic.children.length > 0;
  homeShell.classList.toggle('is-about', !hasChildren);
  secondarySidebar.hidden = !hasChildren;

  if (secondaryEyebrow) secondaryEyebrow.textContent = hasChildren ? '当前专题' : '专题说明';
  if (secondaryTitle) secondaryTitle.textContent = topic.title;
  if (secondaryDesc) secondaryDesc.textContent = topic.desc || '';

  secondaryNav.replaceChildren();
  if (!hasChildren) return;

  topic.children.forEach(category => {
    const card = document.createElement('section');
    const active = category.id === homeState.categoryId;
    card.className = 'secondary-nav-card';
    card.classList.toggle('active', active);
    card.dataset.categoryId = category.id;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'secondary-nav-button';
    button.dataset.categoryId = category.id;
    button.setAttribute('aria-current', active ? 'page' : 'false');
    button.setAttribute('aria-selected', String(active));
    button.classList.toggle('active', active);

    const title = document.createElement('span');
    title.className = 'secondary-nav-title';
    title.textContent = category.title;

    const count = document.createElement('span');
    count.className = 'secondary-nav-count';
    count.textContent = createCountLabel(getArticleCount(category));

    button.append(title, count);
    button.addEventListener('click', () => switchCategory(category.id));
    card.appendChild(button);

    const articles = Array.isArray(category.articles) ? category.articles : [];
    if (articles.length > 0) {
      const list = document.createElement('div');
      list.className = 'secondary-article-list';

      articles.forEach(article => {
        const link = document.createElement('a');
        const slug = getArticleSlug(article);
        const selected = active && slug === homeState.articleSlug;
        link.className = 'secondary-article-link';
        link.classList.toggle('active', selected);
        link.href = article.href;
        link.dataset.articleSlug = slug;
        link.setAttribute('aria-current', selected ? 'page' : 'false');

        const linkTitle = document.createElement('span');
        linkTitle.className = 'secondary-article-title';
        linkTitle.textContent = article.title;

        const linkDesc = document.createElement('span');
        linkDesc.className = 'secondary-article-desc';
        linkDesc.textContent = article.desc || '';

        link.append(linkTitle, linkDesc);
        link.addEventListener('click', event => {
          event.preventDefault();
          selectArticle(topic.id, category.id, slug);
        });
        list.appendChild(link);
      });

      card.appendChild(list);
    } else {
      const empty = document.createElement('p');
      empty.className = 'secondary-article-empty';
      empty.textContent = Array.isArray(category.placeholders) && category.placeholders.length > 0
        ? `${category.placeholders.join('、')} 后续补充。`
        : '暂无文章，后续补充。';
      card.appendChild(empty);
    }

    secondaryNav.appendChild(card);
  });
}

function renderAboutContent(topic) {
  const articleList = document.querySelector('#articleList');
  if (!articleList) return;

  const aboutCard = document.createElement('div');
  aboutCard.className = 'about-card card';

  (topic.content || [topic.desc]).forEach(text => {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    aboutCard.appendChild(paragraph);
  });

  articleList.appendChild(aboutCard);
}

function renderArticles(topic, category) {
  const contentIndex = document.querySelector('#contentIndex');
  const contentTitle = document.querySelector('#contentTitle');
  const contentDesc = document.querySelector('#contentDesc');
  const articleList = document.querySelector('#articleList');
  const articleEmpty = document.querySelector('#articleEmpty');

  if (!topic || !articleList || !articleEmpty) return;

  articleList.replaceChildren();
  articleEmpty.classList.add('hidden');

  if (!category) {
    if (contentIndex) contentIndex.textContent = 'INFO';
    if (contentTitle) contentTitle.textContent = topic.title;
    if (contentDesc) contentDesc.textContent = topic.desc || '';
    renderAboutContent(topic);
    return;
  }

  const article = findArticle(category, homeState.articleSlug);

  if (!article) {
    if (contentIndex) contentIndex.textContent = String(topic.children.findIndex(item => item.id === category.id) + 1).padStart(2, '0');
    if (contentTitle) contentTitle.textContent = category.title;
    if (contentDesc) contentDesc.textContent = category.desc || topic.desc || '';
    articleList.appendChild(createArticleWelcome(topic, category));
    return;
  }

  renderInlineArticle(topic, category, article, { replace: true, scroll: false });
}

function switchTopic(topicId, options = {}) {
  const topic = findTopic(topicId) || findTopic('foundation');
  if (!topic) return;

  const category = findCategory(topic, options.categoryId);
  const article = options.articleSlug ? findArticle(category, options.articleSlug) : findArticle(category, '');

  homeState.topicId = topic.id;
  homeState.categoryId = category?.id || '';
  homeState.articleSlug = article ? getArticleSlug(article) : '';
  homeState.articleHref = article?.href || '';

  renderPrimaryNav();
  renderSecondaryNav(topic);

  if (!category) {
    renderArticles(topic, null);
    updateHomeHash(topic, null, null, options);
    return;
  }

  if (article) {
    renderInlineArticle(topic, category, article, options);
  } else {
    renderArticles(topic, category);
    updateHomeHash(topic, category, null, options);
  }

  if (options.scroll !== false) {
    scrollHomeToTop();
  }
}

function switchCategory(categoryId, options = {}) {
  const topic = findTopic(homeState.topicId);
  if (!topic) return;

  const category = findCategory(topic, categoryId);
  const article = findArticle(category, options.articleSlug || '');

  homeState.categoryId = category?.id || '';
  homeState.articleSlug = article ? getArticleSlug(article) : '';
  homeState.articleHref = article?.href || '';

  renderSecondaryNav(topic);

  if (article) {
    renderInlineArticle(topic, category, article, options);
  } else {
    renderArticles(topic, category);
    updateHomeHash(topic, category, null, options);
  }

  if (options.scroll !== false) {
    scrollHomeToTop();
  }
}

function selectArticle(topicId, categoryId, articleSlug, options = {}) {
  const topic = findTopic(topicId);
  const category = findCategory(topic, categoryId);
  const article = findArticle(category, articleSlug);
  if (!topic || !category || !article) return;
  renderInlineArticle(topic, category, article, options);
}

function restoreHomeFromHash(options = {}) {
  const parsed = parseHomeHash();
  switchTopic(parsed.topicId, {
    categoryId: parsed.categoryId,
    articleSlug: parsed.articleSlug,
    replace: options.replace,
    skipHash: options.skipHash,
    scroll: options.scroll
  });
}

function initHome() {
  const homeShell = document.querySelector('.home-shell');
  if (!homeShell || getHomeTopics().length === 0) return;

  restoreHomeFromHash({ replace: true, scroll: false });

  window.addEventListener('popstate', () => {
    restoreHomeFromHash({ skipHash: true, scroll: false });
  });

  window.addEventListener('hashchange', () => {
    restoreHomeFromHash({ skipHash: true, scroll: false });
  });
}

window.homeNav = {
  renderPrimaryNav,
  renderSecondaryNav,
  renderArticles,
  switchTopic,
  switchCategory,
  selectArticle,
  initHome
};
window.switchTopic = switchTopic;
window.switchCategory = switchCategory;
window.selectArticle = selectArticle;

function normalizeHeadingId(index) {
  return `section-${index + 1}`;
}

function buildArticleToc(root = document) {
  const toc = root.querySelector('#articleToc');
  const article = root.querySelector('.article');
  if (!toc || !article) return;

  const headings = Array.from(article.querySelectorAll('h2'));
  toc.replaceChildren();

  headings.forEach((heading, index) => {
    if (!heading.id) heading.id = normalizeHeadingId(index);
    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;
    toc.appendChild(link);
  });
}

function initCopyButtons(root = document) {
  const codeBlocks = root.querySelectorAll('pre');
  codeBlocks.forEach((pre, index) => {
    if (pre.parentElement?.classList.contains('code-block-wrap')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrap';
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    const button = document.createElement('button');
    button.className = 'copy-code-button';
    button.type = 'button';
    button.textContent = '复制';
    button.setAttribute('aria-label', `复制第 ${index + 1} 段代码`);

    button.addEventListener('click', async () => {
      const text = pre.textContent;
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = '已复制';
        setTimeout(() => {
          button.textContent = '复制';
        }, 1500);
      } catch (error) {
        button.textContent = '复制失败';
        setTimeout(() => {
          button.textContent = '复制';
        }, 1500);
      }
    });

    wrapper.appendChild(button);
  });
}

function enhanceArticleTables(root = document) {
  const tables = root.querySelectorAll('.article table');
  tables.forEach(table => {
    if (table.parentElement?.classList.contains('table-scroll')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'table-scroll';
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
}

function initArticlePage(root = document) {
  buildArticleToc(root);
  initCopyButtons(root);
  enhanceArticleTables(root);
}

window.initArticlePage = initArticlePage;

initHome();
initArticlePage();
