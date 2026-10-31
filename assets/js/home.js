/* 首页：导航树、路由（专题/分类/文章/章节）、整篇阅读、右侧目录、手机抽屉与搜索。 */

const homeState = {
  topicId: '',
  categoryId: '',
  articleSlug: '',
  sectionId: ''
};

const expandedTopics = new Set();
let activeArticleController = null;
let articleRenderVersion = 0;
let routeRestoreQueued = false;
let loadedArticlePath = '';
let activeHeadings = [];
let activeTocLinks = [];
let activeSpy = null;
let readerDock = null;
let progress = null;

const ui = () => window.siteUi;
const $ = selector => document.querySelector(selector);

/* ---------- 数据 ---------- */

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
  return getHomeTopics().find(topic => topic.id === topicId) || null;
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

function getFlatArticles() {
  const list = [];
  getHomeTopics().forEach(topic => {
    (topic.children || []).forEach(category => {
      (category.articles || []).forEach(article => list.push({ topic, category, article }));
    });
  });
  return list;
}

function createCountLabel(count) {
  return count > 0 ? String(count) : '暂无';
}

/* ---------- 路由 ---------- */

function buildHomeHash(topic, category, article, sectionId = '') {
  if (!topic) return '#foundation/c-basic';
  if (category && article) {
    const base = `#${topic.id}/${category.id}/${getArticleSlug(article)}`;
    return sectionId ? `${base}/${sectionId}` : base;
  }
  if (category) return `#${topic.id}/${category.id}`;
  return `#${topic.id}`;
}

function updateHomeHash(topic, category, article, options = {}) {
  if (options.skipHash) return;
  const nextHash = buildHomeHash(topic, category, article, options.sectionId || '');
  if (safeDecode(window.location.hash) === nextHash) return;
  const method = options.replace ? 'replaceState' : 'pushState';
  window.history[method](null, '', nextHash);
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
}

function parseHomeHash() {
  const rawHash = safeDecode(window.location.hash.replace(/^#/, '').trim());
  if (!rawHash) return { topicId: 'foundation', categoryId: 'c-basic', articleSlug: '', sectionId: '' };

  const canonicalHash = window.resolveLegacyHomeRoute?.(rawHash) || rawHash;
  const [topicId, categoryId, articleSlug, ...rest] = canonicalHash.split('/').filter(Boolean);
  return {
    topicId: topicId || 'foundation',
    categoryId: categoryId || null,
    articleSlug: articleSlug || '',
    sectionId: rest.join('/')
  };
}

function currentSelection() {
  const topic = findTopic(homeState.topicId);
  const category = topic ? (topic.children || []).find(item => item.id === homeState.categoryId) || null : null;
  const article = category ? findArticle(category, homeState.articleSlug) : null;
  return { topic, category, article };
}

/* ---------- 导航树：一次构建，之后只同步状态，保留侧栏滚动位置 ---------- */

function createNavArticleLink(topic, category, article) {
  const link = document.createElement('a');
  const slug = getArticleSlug(article);
  link.className = 'nav-article';
  link.href = article.href;
  link.dataset.topicId = topic.id;
  link.dataset.categoryId = category.id;
  link.dataset.articleSlug = slug;
  link.textContent = article.title;
  link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) return;
    event.preventDefault();
    ui()?.closePanels({ restoreFocus: false });
    selectArticle(topic.id, category.id, slug);
  });
  return link;
}

function buildSiteNav() {
  const nav = $('#siteNav');
  if (!nav) return;
  nav.replaceChildren();

  getHomeTopics().forEach(topic => {
    const hasChildren = Array.isArray(topic.children) && topic.children.length > 0;
    const group = document.createElement('div');
    group.className = 'nav-topic';
    group.dataset.topicId = topic.id;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'nav-topic-button';
    button.dataset.topicId = topic.id;
    if (hasChildren) {
      button.setAttribute('aria-controls', `nav-topic-${topic.id}`);
      button.appendChild(ui()?.createIcon('chevron') || document.createElement('span'));
    }
    const title = document.createElement('span');
    title.className = 'nav-topic-title';
    title.textContent = topic.title;
    const count = document.createElement('span');
    count.className = 'nav-count';
    count.textContent = hasChildren ? createCountLabel(getTopicArticleCount(topic)) : '';
    button.append(title, count);
    button.addEventListener('click', () => {
      if (!hasChildren) {
        ui()?.closePanels({ restoreFocus: false });
        switchTopic(topic.id);
        return;
      }
      if (expandedTopics.has(topic.id)) expandedTopics.delete(topic.id);
      else expandedTopics.add(topic.id);
      syncSiteNav();
    });
    group.appendChild(button);

    if (hasChildren) {
      const body = document.createElement('div');
      body.className = 'nav-topic-body';
      body.id = `nav-topic-${topic.id}`;
      topic.children.forEach(category => {
        const section = document.createElement('div');
        section.className = 'nav-category';
        const heading = document.createElement('div');
        heading.className = 'nav-category-title';
        heading.textContent = category.title;
        section.appendChild(heading);
        const articles = Array.isArray(category.articles) ? category.articles : [];
        if (articles.length) {
          articles.forEach(article => section.appendChild(createNavArticleLink(topic, category, article)));
        } else {
          const empty = document.createElement('p');
          empty.className = 'nav-empty';
          empty.textContent = Array.isArray(category.placeholders) && category.placeholders.length
            ? `${category.placeholders.join('、')}，后续补充`
            : '后续补充';
          section.appendChild(empty);
        }
        body.appendChild(section);
      });
      group.appendChild(body);
    }
    nav.appendChild(group);
  });
}

function syncSiteNav(options = {}) {
  const nav = $('#siteNav');
  if (!nav) return;
  nav.querySelectorAll('.nav-topic').forEach(group => {
    const topicId = group.dataset.topicId;
    const expanded = expandedTopics.has(topicId);
    const current = topicId === homeState.topicId;
    group.classList.toggle('is-expanded', expanded);
    group.classList.toggle('is-current', current);
    const button = group.querySelector('.nav-topic-button');
    if (button?.hasAttribute('aria-controls')) button.setAttribute('aria-expanded', String(expanded));
    else if (button) button.setAttribute('aria-current', current ? 'page' : 'false');
    const body = group.querySelector('.nav-topic-body');
    if (body) body.hidden = !expanded;
  });

  let activeLink = null;
  nav.querySelectorAll('.nav-article').forEach(link => {
    const active = link.dataset.topicId === homeState.topicId
      && link.dataset.categoryId === homeState.categoryId
      && link.dataset.articleSlug === homeState.articleSlug;
    link.classList.toggle('active', active);
    if (active) {
      link.setAttribute('aria-current', 'page');
      activeLink = link;
    } else {
      link.removeAttribute('aria-current');
    }
  });

  const revealTarget = activeLink || nav.querySelector('.nav-topic.is-current > .nav-topic-button');
  if (options.reveal && revealTarget) revealInScrollParent(revealTarget);
}

function revealInScrollParent(element) {
  const container = element.closest('.site-sidebar');
  if (!container || container.scrollHeight <= container.clientHeight) return;
  const elementTop = element.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
  if (elementTop < container.scrollTop + 80 || elementTop > container.scrollTop + container.clientHeight - 80) {
    container.scrollTop = Math.max(0, elementTop - container.clientHeight / 3);
  }
}

/* ---------- 正文区 ---------- */

function setMobileTitle(text) {
  const title = $('#mobileTitle');
  if (title) title.textContent = text || 'XYJ';
}

function createPlaceholder(className, titleText, descText) {
  const wrapper = document.createElement('div');
  wrapper.className = `view-placeholder ${className || ''}`.trim();
  if (titleText) {
    const title = document.createElement('h2');
    title.textContent = titleText;
    wrapper.appendChild(title);
  }
  if (descText) {
    const desc = document.createElement('p');
    desc.textContent = descText;
    wrapper.appendChild(desc);
  }
  return wrapper;
}

function createLoadingView() {
  const wrapper = createPlaceholder('is-loading', '', '');
  wrapper.setAttribute('aria-busy', 'true');
  for (let i = 0; i < 6; i += 1) {
    const line = document.createElement('span');
    line.className = 'skeleton-line';
    wrapper.appendChild(line);
  }
  return wrapper;
}

function createBreadcrumb(topic, category) {
  const crumb = document.createElement('nav');
  crumb.className = 'breadcrumb';
  crumb.setAttribute('aria-label', '当前位置');
  [topic?.title, category?.title].filter(Boolean).forEach((text, index) => {
    if (index > 0) {
      const sep = document.createElement('span');
      sep.className = 'breadcrumb-sep';
      sep.textContent = '/';
      sep.setAttribute('aria-hidden', 'true');
      crumb.appendChild(sep);
    }
    const item = document.createElement('span');
    item.textContent = text;
    crumb.appendChild(item);
  });
  return crumb;
}

function createPagerLink(entry, direction) {
  const link = document.createElement('a');
  link.className = `pager-link is-${direction}`;
  link.href = entry.article.href;
  const label = document.createElement('span');
  label.className = 'pager-label';
  label.textContent = direction === 'prev' ? '← 上一篇' : '下一篇 →';
  const title = document.createElement('span');
  title.className = 'pager-title';
  title.textContent = entry.article.title;
  link.append(label, title);
  link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    selectArticle(entry.topic.id, entry.category.id, getArticleSlug(entry.article));
  });
  return link;
}

function createArticleFooter(topic, category, article) {
  const footer = document.createElement('footer');
  footer.className = 'article-end';
  const flat = getFlatArticles();
  const index = flat.findIndex(entry => entry.article.href === article.href);

  const pager = document.createElement('nav');
  pager.className = 'article-pager';
  pager.setAttribute('aria-label', '上一篇与下一篇');
  if (index > 0) pager.appendChild(createPagerLink(flat[index - 1], 'prev'));
  if (index >= 0 && index < flat.length - 1) pager.appendChild(createPagerLink(flat[index + 1], 'next'));
  if (pager.children.length) footer.appendChild(pager);

  const siblings = (category.articles || []).filter(item => item.href !== article.href);
  if (siblings.length) {
    const related = document.createElement('section');
    related.className = 'related-articles';
    const heading = document.createElement('h2');
    heading.textContent = `同分类：${category.title}`;
    const list = document.createElement('div');
    list.className = 'related-list';
    siblings.forEach(item => {
      const link = createNavArticleLink(topic, category, item);
      link.className = 'related-link';
      list.appendChild(link);
    });
    related.append(heading, list);
    footer.appendChild(related);
  }
  return footer;
}

function createOverview(topic) {
  const wrapper = document.createElement('div');
  wrapper.className = 'topic-overview';
  const title = document.createElement('h1');
  title.textContent = topic.title;
  wrapper.appendChild(title);
  if (topic.desc) {
    const desc = document.createElement('p');
    desc.className = 'topic-overview-desc';
    desc.textContent = topic.desc;
    wrapper.appendChild(desc);
  }
  (topic.children || []).forEach(category => {
    const card = document.createElement('section');
    card.className = 'overview-card';
    const heading = document.createElement('h2');
    heading.textContent = category.title;
    card.appendChild(heading);
    if (category.desc) {
      const desc = document.createElement('p');
      desc.textContent = category.desc;
      card.appendChild(desc);
    }
    const articles = category.articles || [];
    if (articles.length) {
      const list = document.createElement('div');
      list.className = 'related-list';
      articles.forEach(item => {
        const link = createNavArticleLink(topic, category, item);
        link.className = 'related-link';
        list.appendChild(link);
      });
      card.appendChild(list);
    } else {
      const empty = document.createElement('p');
      empty.className = 'overview-empty';
      empty.textContent = Array.isArray(category.placeholders) && category.placeholders.length
        ? `计划补充：${category.placeholders.join('、')}`
        : '暂无文章，后续补充。';
      card.appendChild(empty);
    }
    wrapper.appendChild(card);
  });
  return wrapper;
}

function createAboutView(topic) {
  const wrapper = document.createElement('div');
  wrapper.className = 'about-view';
  const title = document.createElement('h1');
  title.textContent = topic.title;
  const card = document.createElement('div');
  card.className = 'about-card';
  (topic.content || [topic.desc]).forEach(text => {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    card.appendChild(paragraph);
  });
  wrapper.append(title, card);
  return wrapper;
}

function cancelActiveArticleLoad() {
  if (activeArticleController) {
    activeArticleController.abort();
    activeArticleController = null;
  }
}

function resetReader() {
  activeSpy?.destroy();
  activeSpy = null;
  activeHeadings = [];
  activeTocLinks = [];
  loadedArticlePath = '';
  const toc = $('#tocNav');
  if (toc) toc.replaceChildren();
  document.body.classList.remove('has-article', 'has-toc');
  syncDock();
}

function showStaticView(node, titleText) {
  const view = $('#articleView');
  if (!view) return;
  cancelActiveArticleLoad();
  articleRenderVersion += 1;
  resetReader();
  view.replaceChildren(node);
  document.title = titleText ? `${titleText} - XYJ` : 'XYJ';
  progress?.refresh();
}

/* ---------- 目录与滚动高亮 ---------- */

function getAnchorOffset() {
  const value = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--anchor-offset'));
  return (Number.isFinite(value) ? value : 24) + 24;
}

function findHeadingForSection(sectionId) {
  if (!sectionId) return null;
  return activeHeadings.find(heading => heading.id === sectionId)
    || activeHeadings.find(heading => heading.textContent.replace(/\s+/g, ' ').trim() === sectionId)
    || null;
}

function goToSection(index, options = {}) {
  const heading = activeHeadings[index];
  if (!heading) return;
  ui().closePanels({ restoreFocus: false });
  if (options.instant) heading.scrollIntoView({ block: 'start' });
  else ui().scrollToHeading(heading);
  ui().setActiveTocLink(activeTocLinks, index);
  homeState.sectionId = heading.id;
  const { topic, category, article } = currentSelection();
  updateHomeHash(topic, category, article, { replace: true, sectionId: heading.id });
  syncDock(index);
  window.setTimeout(() => activeSpy?.refresh(), 450);
}

function setupReader(headings) {
  activeHeadings = headings;
  const toc = $('#tocNav');
  activeTocLinks = toc ? ui().renderTocLinks(toc, headings, 'toc-sub') : [];
  document.body.classList.toggle('has-toc', headings.length > 0);
  document.body.classList.add('has-article');

  activeSpy = ui().createScrollSpy(headings, {
    offset: getAnchorOffset,
    onChange: (index, heading) => {
      ui().setActiveTocLink(activeTocLinks, index);
      syncDock(index);
      const passed = heading && (index > 0 || heading.getBoundingClientRect().top - getAnchorOffset() <= 1);
      const sectionId = passed ? heading.id : '';
      if (sectionId === homeState.sectionId) return;
      homeState.sectionId = sectionId;
      const { topic, category, article } = currentSelection();
      if (article) updateHomeHash(topic, category, article, { replace: true, sectionId });
    }
  });
}

function syncDock(index = activeSpy?.index ?? -1) {
  if (!readerDock) return;
  const prev = readerDock.querySelector('[data-action="prev-section"]');
  const next = readerDock.querySelector('[data-action="next-section"]');
  if (prev) prev.disabled = !(index > 0);
  if (next) next.disabled = !(activeHeadings.length && index < activeHeadings.length - 1);
}

async function renderInlineArticle(topic, category, article, options = {}) {
  const view = $('#articleView');
  if (!view || !article) return;

  if (loadedArticlePath === article.href && !options.reload) {
    const heading = findHeadingForSection(options.sectionId);
    if (heading) goToSection(activeHeadings.indexOf(heading), { instant: options.instantSection });
    else if (options.scroll !== false) ui().scrollPageToTop();
    return;
  }

  cancelActiveArticleLoad();
  resetReader();
  const controller = new AbortController();
  activeArticleController = controller;
  const renderVersion = ++articleRenderVersion;

  document.title = `${article.title} - XYJ`;
  setMobileTitle(category.title);
  view.replaceChildren(createLoadingView());
  if (options.scroll !== false) window.scrollTo({ top: 0 });

  try {
    const articleRoot = await window.articleReader.fetchInlineArticleRoot(article, { signal: controller.signal });
    if (controller.signal.aborted || renderVersion !== articleRenderVersion) return;
    const { element, headings } = window.articleReader.createInlineArticle(articleRoot);
    view.replaceChildren(createBreadcrumb(topic, category), element, createArticleFooter(topic, category, article));
    loadedArticlePath = article.href;
    setupReader(headings);
    progress?.refresh();

    const heading = findHeadingForSection(options.sectionId);
    if (heading) goToSection(headings.indexOf(heading), { instant: true });
  } catch (error) {
    if (controller.signal.aborted || renderVersion !== articleRenderVersion || error?.name === 'AbortError') return;
    view.replaceChildren(createPlaceholder('is-error', '文章加载失败', error.message || '请稍后刷新页面重试。'));
  } finally {
    if (activeArticleController === controller) activeArticleController = null;
  }
}

/* ---------- 选择逻辑 ---------- */

function applySelection(topic, category, article, options = {}) {
  if (topic && topic.id !== homeState.topicId) expandedTopics.clear();
  homeState.topicId = topic?.id || '';
  homeState.categoryId = category?.id || '';
  homeState.articleSlug = article ? getArticleSlug(article) : '';
  homeState.sectionId = options.sectionId || '';
  if (topic) expandedTopics.add(topic.id);
  syncSiteNav({ reveal: true });

  if (article) {
    updateHomeHash(topic, category, article, options);
    renderInlineArticle(topic, category, article, options);
    return;
  }

  setMobileTitle(topic?.title);
  updateHomeHash(topic, category, null, options);
  if (!topic) return;
  if (!Array.isArray(topic.children) || topic.children.length === 0) showStaticView(createAboutView(topic), topic.title);
  else showStaticView(createOverview(topic), topic.title);
  if (options.scroll !== false) window.scrollTo({ top: 0 });
}

function switchTopic(topicId, options = {}) {
  const topic = findTopic(topicId) || findTopic('foundation') || getHomeTopics()[0];
  if (!topic) return;
  const category = findCategory(topic, options.categoryId);
  const article = findArticle(category, options.articleSlug || '');
  applySelection(topic, category, article, options);
}

function switchCategory(categoryId, options = {}) {
  switchTopic(homeState.topicId, { ...options, categoryId });
}

function selectArticle(topicId, categoryId, articleSlug, options = {}) {
  const topic = findTopic(topicId);
  const category = findCategory(topic, categoryId);
  const article = findArticle(category, articleSlug);
  if (!topic || !category || !article) return;
  applySelection(topic, category, article, options);
}

function restoreHomeFromHash(options = {}) {
  const parsed = parseHomeHash();
  switchTopic(parsed.topicId, {
    categoryId: parsed.categoryId,
    articleSlug: parsed.articleSlug,
    sectionId: parsed.sectionId,
    instantSection: true,
    replace: options.replace,
    skipHash: options.skipHash,
    scroll: options.scroll
  });
}

function scheduleRouteRestore() {
  if (routeRestoreQueued) return;
  routeRestoreQueued = true;
  queueMicrotask(() => {
    routeRestoreQueued = false;
    restoreHomeFromHash({ skipHash: true, scroll: false });
  });
}

/* ---------- 正文内锚点：在首页内滚动并写入章节路由 ---------- */

function bindArticleAnchors() {
  const view = $('#articleView');
  view?.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || !view.contains(link)) return;
    const id = safeDecode(link.getAttribute('href').slice(1));
    const target = id && view.querySelector(`[id="${CSS.escape(id)}"]`);
    if (!target) return;
    event.preventDefault();
    const index = activeHeadings.indexOf(target);
    if (index >= 0) goToSection(index);
    else ui().scrollToHeading(target);
  });

  $('#tocNav')?.addEventListener('click', event => {
    const link = event.target.closest('a');
    const index = activeTocLinks.indexOf(link);
    if (index < 0) return;
    event.preventDefault();
    goToSection(index);
  });
}

/* ---------- 手机顶栏：下滑隐藏、上滑出现 ---------- */

function initMobileHeader() {
  const header = $('#mobileHeader');
  if (!header) return;
  let lastY = window.scrollY;
  let frame = 0;
  const update = () => {
    frame = 0;
    const y = window.scrollY;
    const delta = y - lastY;
    if (Math.abs(delta) < 6) return;
    const hide = delta > 0 && y > 120 && !document.documentElement.classList.contains('is-scroll-locked');
    header.classList.toggle('is-hidden', hide);
    document.body.classList.toggle('header-hidden', hide);
    lastY = y;
  };
  window.addEventListener('scroll', () => {
    if (!frame) frame = window.requestAnimationFrame(update);
  }, { passive: true });
}

/* ---------- 搜索 ---------- */

let searchRecords = null;
let searchOptions = [];
let searchActiveIndex = -1;

function getSearchRecords() {
  if (searchRecords) return searchRecords;
  searchRecords = getFlatArticles().map(entry => {
    const { topic, category, article } = entry;
    const sections = Array.isArray(article.sections) ? article.sections : [];
    return {
      ...entry,
      title: article.title,
      titleKey: article.title.toLowerCase(),
      haystack: [article.title, article.desc, (article.tags || []).join(' '), category.title, topic.title]
        .join(' ')
        .toLowerCase(),
      sections: sections.map(text => ({ text, key: text.toLowerCase() }))
    };
  });
  return searchRecords;
}

function appendHighlighted(target, text, terms) {
  const lower = text.toLowerCase();
  const marks = [];
  terms.forEach(term => {
    let from = 0;
    while (term && (from = lower.indexOf(term, from)) >= 0) {
      marks.push([from, from + term.length]);
      from += term.length;
    }
  });
  marks.sort((a, b) => a[0] - b[0]);
  let cursor = 0;
  marks.forEach(([start, end]) => {
    if (start < cursor) return;
    if (start > cursor) target.appendChild(document.createTextNode(text.slice(cursor, start)));
    const mark = document.createElement('mark');
    mark.textContent = text.slice(start, end);
    target.appendChild(mark);
    cursor = end;
  });
  if (cursor < text.length) target.appendChild(document.createTextNode(text.slice(cursor)));
}

function searchArticles(query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const records = getSearchRecords();
  if (!terms.length) {
    return records
      .filter(record => record.topic.id === homeState.topicId)
      .slice(0, 12)
      .map(record => ({ record, sections: [], score: 0 }));
  }
  const results = [];
  records.forEach(record => {
    const matchesAll = text => terms.every(term => text.includes(term));
    const sections = record.sections.filter(section => matchesAll(`${record.titleKey} ${section.key}`) && terms.some(term => section.key.includes(term)));
    const articleHit = matchesAll(record.haystack);
    if (!articleHit && !sections.length) return;
    let score = articleHit ? 10 : 4;
    if (matchesAll(record.titleKey)) score += 20;
    results.push({ record, sections: sections.slice(0, 3), score });
  });
  return results.sort((a, b) => b.score - a.score).slice(0, 30);
}

function renderSearchResults(query) {
  const list = $('#searchResults');
  if (!list) return;
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const results = searchArticles(query);
  list.replaceChildren();
  searchOptions = [];

  if (!results.length) {
    const empty = document.createElement('li');
    empty.className = 'search-empty';
    empty.textContent = '没有找到相关文章，换个关键词试试。';
    list.appendChild(empty);
  }

  const addOption = (record, section, className) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.id = `search-option-${searchOptions.length}`;
    button.setAttribute('role', 'option');
    const main = document.createElement('span');
    main.className = 'search-result-title';
    appendHighlighted(main, section ? section.text : record.title, terms);
    button.appendChild(main);
    if (!section) {
      const meta = document.createElement('span');
      meta.className = 'search-result-meta';
      meta.textContent = `${record.topic.title} / ${record.category.title}`;
      button.appendChild(meta);
    }
    const open = () => {
      closeSearch();
      selectArticle(record.topic.id, record.category.id, getArticleSlug(record.article), section ? { sectionId: section.text } : {});
    };
    button.addEventListener('click', open);
    button.addEventListener('mousemove', () => setSearchActive(searchOptions.indexOf(button)));
    item.appendChild(button);
    list.appendChild(item);
    searchOptions.push(button);
  };

  results.forEach(({ record, sections }) => {
    addOption(record, null, 'search-result');
    sections.forEach(section => addOption(record, section, 'search-result is-section'));
  });
  setSearchActive(searchOptions.length ? 0 : -1);
}

function setSearchActive(index) {
  searchActiveIndex = index;
  const input = $('#searchInput');
  searchOptions.forEach((button, buttonIndex) => {
    const active = buttonIndex === index;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
    if (active) {
      input?.setAttribute('aria-activedescendant', button.id);
      button.scrollIntoView({ block: 'nearest' });
    }
  });
  if (index < 0) input?.removeAttribute('aria-activedescendant');
}

function openSearch() {
  const dialog = $('#searchDialog');
  const input = $('#searchInput');
  if (!dialog || !input) return;
  ui().closePanels({ restoreFocus: false });
  if (!dialog.open) {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }
  document.documentElement.classList.add('is-scroll-locked');
  input.select();
  renderSearchResults(input.value);
}

function closeSearch() {
  const dialog = $('#searchDialog');
  if (!dialog) return;
  if (dialog.open && typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
  document.documentElement.classList.remove('is-scroll-locked');
}

function initSearch() {
  const dialog = $('#searchDialog');
  const input = $('#searchInput');
  if (!dialog || !input) return;
  document.querySelectorAll('[data-search-open]').forEach(button => button.addEventListener('click', openSearch));
  $('#searchClose')?.addEventListener('click', closeSearch);
  dialog.addEventListener('close', () => document.documentElement.classList.remove('is-scroll-locked'));
  dialog.addEventListener('click', event => {
    if (event.target === dialog) closeSearch();
  });
  input.addEventListener('input', () => renderSearchResults(input.value));
  input.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!searchOptions.length) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setSearchActive((searchActiveIndex + step + searchOptions.length) % searchOptions.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      searchOptions[searchActiveIndex]?.click();
    }
  });
  document.addEventListener('keydown', event => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName || '') || event.target?.isContentEditable;
    if ((event.key === 'k' || event.key === 'K') && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      openSearch();
    } else if (event.key === '/' && !typing && !dialog.open) {
      event.preventDefault();
      openSearch();
    }
  });
}

/* ---------- 初始化 ---------- */

function initReaderChrome() {
  const siteUi = ui();
  if (!siteUi) return;
  siteUi.registerPanel('nav', $('#siteSidebar'), { media: '(max-width: 899px)' });
  siteUi.registerPanel('toc', $('#tocPanel'), { media: '(max-width: 1279px)' });
  siteUi.bindPanelToggles();
  progress = siteUi.initReadingProgress();
  if (!$('#tocPanel')) return;
  readerDock = siteUi.createReaderDock([
    {
      label: '上一章节', text: '上一节', icon: 'prev', action: 'prev-section',
      onClick: () => goToSection(Math.max(0, (activeSpy?.index ?? 0) - 1))
    },
    { label: '打开本文目录', text: '目录', icon: 'toc', panel: 'toc' },
    {
      label: '下一章节', text: '下一节', icon: 'next', action: 'next-section',
      onClick: () => goToSection(Math.min(activeHeadings.length - 1, (activeSpy?.index ?? -1) + 1))
    },
    { label: '回到顶部', text: '顶部', icon: 'up', action: 'top', onClick: siteUi.scrollPageToTop }
  ]);
  syncDock();
}

function initHome() {
  const homeShell = document.querySelector('.home-shell');
  if (!homeShell || getHomeTopics().length === 0) return;
  buildSiteNav();
  initReaderChrome();
  bindArticleAnchors();
  initMobileHeader();
  initSearch();
  document.querySelector('[data-skip-to-main]')?.addEventListener('click', () => $('#main')?.focus());
  restoreHomeFromHash({ replace: true, scroll: false });
  window.addEventListener('popstate', scheduleRouteRestore);
  window.addEventListener('hashchange', scheduleRouteRestore);
}

window.homeNav = {
  buildSiteNav,
  syncSiteNav,
  switchTopic,
  switchCategory,
  selectArticle,
  openSearch,
  closeSearch,
  initHome
};
window.switchTopic = switchTopic;
window.switchCategory = switchCategory;
window.selectArticle = selectArticle;

initHome();
