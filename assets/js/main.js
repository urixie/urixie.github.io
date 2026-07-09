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
  'hardware-stack': ['c', 'basic'],
  'c-basic': ['c', 'basic'],
  'c-pointer': ['c', 'pointer'],
  'c-data-storage': ['c', 'data-storage'],
  'c-stack-heap': ['c', 'stack-heap'],
  'c-struct': ['c', 'struct'],
  'c-embedded': ['c', 'embedded'],
  'c-debug': ['c', 'debug'],
  'verilog-basic': ['verilog', 'basic'],
  'verilog-logic': ['verilog', 'logic'],
  'verilog-fsm': ['verilog', 'fsm'],
  'verilog-sim': ['verilog', 'simulation'],
  'windows-uqitong': ['windows', 'uqitong'],
  'windows-iventoy': ['windows', 'iventoy'],
  'linux-basic': ['linux', 'basic'],
  'linux-process': ['linux', 'process'],
  'linux-shell': ['linux', 'shell'],
  'linux-embedded': ['linux', 'embedded'],
  'linux-uboot': ['linux', 'uboot'],
  'linux-kernel-build': ['linux', 'kernel'],
  'linux-rootfs-build': ['linux', 'rootfs'],
  'freertos-basic': ['freertos', 'scheduler'],
  'freertos-task': ['freertos', 'task'],
  'freertos-ipc': ['freertos', 'ipc'],
  'freertos-debug': ['freertos', 'timer'],
  'mcu-stack': ['mcu', 'microchip'],
  'mcu-st': ['mcu', 'st'],
  'mcu-wh': ['mcu', 'wh'],
  'mcu-microchip': ['mcu', 'microchip'],
  'mcu-sl': ['mcu', 'silicon-labs'],
  'mcu-espressif': ['mcu', 'espressif'],
  'mcu-xilinx': ['mcu', 'xilinx'],
  'soc-stack': ['soc', 'rockchip'],
  'soc-orbit': ['soc', 'orbit'],
  'soc-rockchip': ['soc', 'rockchip'],
  'fpga-stack': ['fpga', 'anlogic'],
  'fpga-microchip': ['fpga', 'microchip'],
  'fpga-lattice': ['fpga', 'lattice'],
  'fpga-anlogic': ['fpga', 'anlogic'],
  'gui-stack': ['gui', 'nxp'],
  'gui-nxp': ['gui', 'nxp'],
  'gui-dfc': ['gui', 'dfc'],
  'host-stack': ['host', 'debug'],
  'host-wireless': ['host', 'wireless'],
  'host-debug': ['host', 'debug'],
  'about': ['about', null]
};

const homeState = {
  topicId: '',
  categoryId: ''
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

function buildHomeHash(topic, category) {
  if (!topic) return '#c/basic';
  return category ? `#${topic.id}/${category.id}` : `#${topic.id}`;
}

function updateHomeHash(topic, category, options = {}) {
  if (options.skipHash) return;
  const nextHash = buildHomeHash(topic, category);
  if (window.location.hash === nextHash) return;
  const method = options.replace ? 'replaceState' : 'pushState';
  window.history[method](null, '', nextHash);
}

function parseHomeHash() {
  const rawHash = decodeURIComponent(window.location.hash.replace(/^#/, '').trim());
  if (!rawHash) return { topicId: 'c', categoryId: 'basic' };

  if (legacyHomeHashMap[rawHash]) {
    const [topicId, categoryId] = legacyHomeHashMap[rawHash];
    return { topicId, categoryId };
  }

  const [topicId, categoryId] = rawHash.split('/').filter(Boolean);
  return { topicId: topicId || 'c', categoryId: categoryId || null };
}

function scrollHomeToTop() {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
}

function createCountLabel(count) {
  return count > 0 ? `${count}篇` : '暂无';
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
    const button = document.createElement('button');
    const active = category.id === homeState.categoryId;
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
    secondaryNav.appendChild(button);
  });
}

function renderArticleCard(article) {
  const card = document.createElement('a');
  card.className = 'article-card';
  card.href = article.href;

  const heading = document.createElement('h3');
  heading.textContent = article.title;

  const desc = document.createElement('p');
  desc.textContent = article.desc;

  const tags = document.createElement('div');
  tags.className = 'article-tags';

  (article.tags || []).forEach(tag => {
    const tagItem = document.createElement('span');
    tagItem.textContent = tag;
    tags.appendChild(tagItem);
  });

  card.append(heading, desc, tags);
  return card;
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

  const categoryIndex = topic.children.findIndex(item => item.id === category.id);
  const articles = Array.isArray(category.articles) ? category.articles : [];
  const placeholders = Array.isArray(category.placeholders) ? category.placeholders : [];

  if (contentIndex) contentIndex.textContent = String(categoryIndex + 1).padStart(2, '0');
  if (contentTitle) contentTitle.textContent = category.title;
  if (contentDesc) contentDesc.textContent = category.desc || topic.desc || '';

  if (articles.length === 0) {
    articleEmpty.textContent = placeholders.length > 0
      ? `${placeholders.join('、')} 暂无文章，后续补充。`
      : '当前分类暂无文章，后续补充。';
    articleEmpty.classList.remove('hidden');
    return;
  }

  articles.forEach(article => {
    articleList.appendChild(renderArticleCard(article));
  });
}

function switchTopic(topicId, options = {}) {
  const topic = findTopic(topicId) || findTopic('c');
  if (!topic) return;

  const category = findCategory(topic, options.categoryId);
  homeState.topicId = topic.id;
  homeState.categoryId = category?.id || '';

  renderPrimaryNav();
  renderSecondaryNav(topic);
  renderArticles(topic, category);
  updateHomeHash(topic, category, options);

  if (options.scroll !== false) {
    scrollHomeToTop();
  }
}

function switchCategory(categoryId, options = {}) {
  const topic = findTopic(homeState.topicId);
  if (!topic) return;

  const category = findCategory(topic, categoryId);
  homeState.categoryId = category?.id || '';

  renderSecondaryNav(topic);
  renderArticles(topic, category);
  updateHomeHash(topic, category, options);

  if (options.scroll !== false) {
    scrollHomeToTop();
  }
}

function restoreHomeFromHash(options = {}) {
  const parsed = parseHomeHash();
  switchTopic(parsed.topicId, {
    categoryId: parsed.categoryId,
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
  initHome
};
window.switchTopic = switchTopic;
window.switchCategory = switchCategory;

function normalizeHeadingId(index) {
  return `article-section-${index + 1}`;
}

function getMainScriptUrl() {
  const scripts = Array.from(document.scripts);
  const currentScript = document.currentScript || scripts.find(script => /\/assets\/js\/main\.js(?:\?|$)/.test(script.src));
  return currentScript?.src || new URL('/assets/js/main.js', window.location.origin).href;
}

function getSiteRootUrl() {
  return new URL('../../index.html', getMainScriptUrl()).href;
}

function getAssetUrl(relativePath) {
  return new URL(relativePath, getMainScriptUrl()).href;
}

function loadStylesheetOnce(id, href) {
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function loadScriptOnce(id, src) {
  if (document.getElementById(id)) {
    return Promise.resolve();
  }

  return new Promise(resolve => {
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}

function ensureHomeData() {
  if (getHomeTopics().length > 0) {
    return Promise.resolve(getHomeTopics());
  }

  if (!window.__homeDataLoading) {
    window.__homeDataLoading = loadScriptOnce(
      'home-data-dynamic',
      getAssetUrl('home-data.js?v=704b803539b3')
    ).then(() => getHomeTopics());
  }

  return window.__homeDataLoading;
}

function normalizePathname(pathname) {
  return decodeURIComponent(pathname || '')
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '');
}

function getArticlePathFromHref(href) {
  try {
    return normalizePathname(new URL(href, getSiteRootUrl()).pathname);
  } catch (error) {
    return '';
  }
}

function findArticleContextByPath() {
  const currentPath = normalizePathname(window.location.pathname);
  let matched = null;

  getHomeTopics().forEach(topic => {
    (topic.children || []).forEach(category => {
      (category.articles || []).forEach(article => {
        if (matched || !article?.href) return;
        const articlePath = getArticlePathFromHref(article.href);
        if (articlePath && articlePath === currentPath) {
          matched = { topic, category, article };
        }
      });
    });
  });

  return matched;
}

function findArticleContextByTopbar(articleTopbar) {
  if (!articleTopbar) return null;

  const links = Array.from(articleTopbar.querySelectorAll('a'));
  for (const link of links) {
    const href = link.getAttribute('href') || '';
    const hash = href.includes('#') ? href.split('#').pop() : '';
    if (!hash) continue;

    const [topicId, categoryId] = legacyHomeHashMap[hash] || hash.split('/').filter(Boolean);
    const topic = findTopic(topicId);
    const category = findCategory(topic, categoryId);
    if (topic) return { topic, category, article: null };
  }

  return null;
}

function getCurrentArticleContext(articleTopbar) {
  return findArticleContextByPath() || findArticleContextByTopbar(articleTopbar) || {
    topic: findTopic('c') || getHomeTopics()[0] || null,
    category: null,
    article: null
  };
}

function buildTopicHomeHref(topic) {
  const category = findCategory(topic, null);
  return `${getSiteRootUrl()}${buildHomeHash(topic, category)}`;
}

function createProfileBlock() {
  const profile = document.createElement('div');
  profile.className = 'profile-compact';
  profile.innerHTML = `
    <div class="profile-compact-top">
      <div class="profile-compact-avatar">
        <img src="${getAssetUrl('../img/avatar-surf.jpg?v=704b803539b3')}" alt="XYJ 网站头像">
      </div>
      <div class="profile-identity">
        <h1>XYJ</h1>
        <p class="profile-summary">嵌入式软件工程师，${getWorkExperience(2022, 1)}经验。</p>
      </div>
    </div>
    <a class="profile-email" href="mailto:xyj.work@qq.com" aria-label="发送邮件到 xyj.work@qq.com">
      <svg class="profile-email-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5h16c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2Zm0 2v.4l8 5.1 8-5.1V7H4Zm0 2.7V17h16V9.7l-7.46 4.76a1 1 0 0 1-1.08 0L4 9.7Z"/>
      </svg>
      <span>xyj.work@qq.com</span>
    </a>
  `;
  return profile;
}

function buildArticlePrimarySidebar() {
  const articleShell = document.querySelector('.article-page-shell');
  if (!articleShell || articleShell.querySelector('.article-primary-sidebar')) return;

  const context = getCurrentArticleContext(document.querySelector('.article-topbar'));
  const activeTopicId = context.topic?.id || '';
  const topics = getHomeTopics();
  if (topics.length === 0) return;

  const sidebar = document.createElement('aside');
  sidebar.className = 'article-primary-sidebar';
  sidebar.setAttribute('aria-label', '站点一级导航');

  const top = document.createElement('div');
  const primaryNav = document.createElement('nav');
  primaryNav.className = 'primary-nav';
  primaryNav.setAttribute('aria-label', '一级目录');

  topics.forEach((topic, index) => {
    const link = document.createElement('a');
    const active = topic.id === activeTopicId;
    link.className = 'primary-nav-button';
    link.href = buildTopicHomeHref(topic);
    link.title = topic.title;
    link.classList.toggle('active', active);
    link.setAttribute('aria-current', active ? 'page' : 'false');

    const code = document.createElement('span');
    code.className = 'primary-nav-code';
    code.textContent = topic.shortTitle || String(index + 1).padStart(2, '0');

    const title = document.createElement('span');
    title.className = 'primary-nav-title';
    title.textContent = topic.title;

    const count = document.createElement('span');
    count.className = 'primary-nav-count';
    count.textContent = topic.id === 'about' ? 'INFO' : createCountLabel(getTopicArticleCount(topic));

    link.append(code, title, count);
    primaryNav.appendChild(link);
  });

  top.append(createProfileBlock(), primaryNav);

  const footer = document.createElement('div');
  footer.className = 'sidebar-footer';
  footer.innerHTML = `<span>© ${new Date().getFullYear()} XYJ。</span>`;

  sidebar.append(top, footer);
  articleShell.insertBefore(sidebar, articleShell.firstElementChild);
}

function getInitialArticleSectionIndex(sections) {
  const hash = decodeURIComponent(window.location.hash.replace(/^#/, '').trim());
  if (!hash) return 0;

  const index = sections.findIndex(section => section.id === hash);
  return index >= 0 ? index : 0;
}

function dedupeArticleLinks(links) {
  const seen = new Set();
  return links.filter(item => {
    if (!item?.href || !item?.text) return false;
    const key = `${item.text}|${item.href}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function createArticleReaderActions(links) {
  const actionItems = dedupeArticleLinks(links);
  if (actionItems.length === 0) return null;

  const actions = document.createElement('div');
  actions.className = 'article-reader-actions';
  actions.setAttribute('aria-label', '文章操作');

  actionItems.forEach(item => {
    const a = document.createElement('a');
    a.href = item.href;
    a.textContent = item.text;
    actions.appendChild(a);
  });

  return actions;
}

function createArticleActionSidebar(links) {
  const actions = createArticleReaderActions(links);
  if (!actions) return null;

  const actionSidebar = document.createElement('aside');
  actionSidebar.className = 'article-action-sidebar';
  actionSidebar.setAttribute('aria-label', '文章操作');

  const actionTitle = document.createElement('div');
  actionTitle.className = 'article-action-title';
  actionTitle.textContent = '文章操作';

  actionSidebar.append(actionTitle, actions);
  return actionSidebar;
}

function buildArticleNav() {
  const articleShell = document.querySelector('.article-page-shell');
  const article = document.querySelector('.article');
  const articleTopbar = document.querySelector('.article-topbar');

  if (!articleShell || !article) return;
  if (articleShell.querySelector('.article-sidebar')) return;

  const headings = Array.from(article.querySelectorAll('section h2'));
  if (headings.length === 0) return;

  headings.forEach((heading, index) => {
    const section = heading.closest('section');
    if (!section) return;

    if (!section.id) {
      section.id = normalizeHeadingId(index);
    }
  });

  const articleSections = headings
    .map(heading => heading.closest('section'))
    .filter(Boolean);

  if (articleSections.length === 0) return;

  const articleFooter = article.querySelector('.article-footer');
  const topbarLinks = articleTopbar
    ? Array.from(articleTopbar.querySelectorAll('a')).map(link => ({
        text: link.textContent.trim(),
        href: link.getAttribute('href')
      }))
    : [];
  const footerLinks = articleFooter
    ? Array.from(articleFooter.querySelectorAll('a')).map(link => ({
        text: link.textContent.trim(),
        href: link.getAttribute('href')
      }))
    : [];

  const articleTitle = article.querySelector('h1')?.textContent.trim() || document.title.replace(/\s*-\s*XYJ\s*$/, '');
  const articleMeta = article.querySelector('.post-meta')?.textContent.trim() || '';

  articleTopbar?.remove();
  articleFooter?.remove();

  const sectionViewer = document.createElement('div');
  sectionViewer.className = 'article-section-viewer';
  sectionViewer.setAttribute('aria-live', 'polite');

  const sectionInner = document.createElement('div');
  sectionInner.className = 'article-section-inner';
  sectionViewer.appendChild(sectionInner);

  const actionSidebar = createArticleActionSidebar([...topbarLinks, ...footerLinks]);

  article.classList.add('article-section-mode');
  article.insertBefore(sectionViewer, articleSections[0]);

  articleSections.forEach((section, index) => {
    section.classList.add('article-reader-section');
    section.dataset.sectionIndex = String(index);
    section.hidden = true;
    sectionInner.appendChild(section);
  });

  const articleSidebar = document.createElement('aside');
  articleSidebar.className = 'article-sidebar';
  articleSidebar.setAttribute('aria-label', '文章导航');

  const articleNavCard = document.createElement('div');
  articleNavCard.className = 'article-nav-card';

  const contextBlock = document.createElement('div');
  contextBlock.className = 'article-nav-context';

  const contextEyebrow = document.createElement('span');
  contextEyebrow.textContent = '当前文章';

  const contextTitle = document.createElement('h2');
  contextTitle.textContent = articleTitle;

  contextBlock.append(contextEyebrow, contextTitle);
  if (articleMeta) {
    const contextMeta = document.createElement('p');
    contextMeta.textContent = articleMeta;
    contextBlock.appendChild(contextMeta);
  }

  const navTitle = document.createElement('div');
  navTitle.className = 'article-nav-title';
  navTitle.textContent = '文章目录';

  const articleNav = document.createElement('nav');
  articleNav.className = 'article-nav';

  headings.forEach((heading, index) => {
    const section = articleSections[index];
    if (!section) return;

    const link = document.createElement('a');
    link.href = `#${section.id}`;
    link.textContent = heading.textContent.trim();
    link.dataset.sectionIndex = String(index);

    if (index === 0) {
      link.classList.add('active');
    }

    articleNav.appendChild(link);
  });

  articleNavCard.appendChild(contextBlock);
  articleNavCard.appendChild(navTitle);
  articleNavCard.appendChild(articleNav);
  articleSidebar.appendChild(articleNavCard);

  articleShell.insertBefore(articleSidebar, article);
  if (actionSidebar) {
    articleShell.insertBefore(actionSidebar, article.nextSibling);
  }

  const articleNavLinks = Array.from(articleNav.querySelectorAll('a'));

  function switchArticleSection(index, options = {}) {
    const nextIndex = Math.max(0, Math.min(index, articleSections.length - 1));
    const activeSection = articleSections[nextIndex];
    if (!activeSection) return;

    articleSections.forEach((section, sectionIndex) => {
      const active = sectionIndex === nextIndex;
      section.hidden = !active;
      section.classList.toggle('active', active);
    });

    articleNavLinks.forEach((link, linkIndex) => {
      const active = linkIndex === nextIndex;
      link.classList.toggle('active', active);
      link.setAttribute('aria-current', active ? 'page' : 'false');
    });

    if (options.updateHash !== false) {
      const nextHash = `#${activeSection.id}`;
      if (window.location.hash !== nextHash) {
        window.history.pushState(null, '', nextHash);
      }
    }

    if (options.scrollViewer !== false) {
      sectionViewer.scrollTo({ top: 0, behavior: 'auto' });
    }
  }

  articleNavLinks.forEach((link, index) => {
    link.addEventListener('click', event => {
      event.preventDefault();
      switchArticleSection(index);
    });
  });

  window.addEventListener('hashchange', () => {
    const hash = decodeURIComponent(window.location.hash.replace(/^#/, '').trim());
    const index = articleSections.findIndex(section => section.id === hash);
    if (index >= 0) {
      switchArticleSection(index, { updateHash: false });
    }
  });

  document.body.classList.add('article-reader-page');
  switchArticleSection(getInitialArticleSectionIndex(articleSections), {
    updateHash: false,
    scrollViewer: false
  });
}

async function initArticlePage() {
  const articleShell = document.querySelector('.article-page-shell');
  if (!articleShell) return;

  articleShell.classList.add('article-layout-shell');
  loadStylesheetOnce(
    'article-layout-tuning',
    getAssetUrl('../css/article-layout-tuning.css?v=20260709-article1')
  );
  loadStylesheetOnce(
    'article-section-reader',
    getAssetUrl('../css/article-section-reader.css?v=20260709-section3')
  );

  await ensureHomeData();
  buildArticlePrimarySidebar();
  buildArticleNav();
}

initHome();
initArticlePage();
