const homeState = {
  topicId: '',
  categoryId: '',
  articleSlug: '',
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

  const canonicalHash = window.resolveLegacyHomeRoute?.(rawHash) || rawHash;
  const [topicId, categoryId, articleSlug] = canonicalHash.split('/').filter(Boolean);
  return { topicId: topicId || 'foundation', categoryId: categoryId || null, articleSlug: articleSlug || '' };
}

function scrollHomeToTop() {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
}

function createCountLabel(count) {
  return count > 0 ? `${count}篇` : '暂无';
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

async function renderInlineArticle(topic, category, article, options = {}) {
  const articleList = document.querySelector('#articleList');
  const articleEmpty = document.querySelector('#articleEmpty');
  const contentTitle = document.querySelector('#contentTitle');

  if (!articleList || !article) return;

  homeState.topicId = topic?.id || '';
  homeState.categoryId = category?.id || '';
  homeState.articleSlug = getArticleSlug(article);
  if (contentTitle) contentTitle.textContent = article.title;
  if (articleEmpty) articleEmpty.classList.add('hidden');

  articleList.replaceChildren(createLoadingCard());
  renderPrimaryNav();
  renderSecondaryNav(topic);
  updateHomeHash(topic, category, article, options);

  try {
    const articleRoot = await window.articleReader.fetchInlineArticleRoot(article);
    articleList.replaceChildren(window.articleReader.createSectionedArticleReader(articleRoot));
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
  const secondaryNav = document.querySelector('#secondaryNav');

  if (!topic || !homeShell || !secondarySidebar || !secondaryNav) return;

  const hasChildren = Array.isArray(topic.children) && topic.children.length > 0;
  homeShell.classList.toggle('is-about', !hasChildren);
  secondarySidebar.hidden = !hasChildren;

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
        link.textContent = article.title;

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
  const contentTitle = document.querySelector('#contentTitle');
  const articleList = document.querySelector('#articleList');
  const articleEmpty = document.querySelector('#articleEmpty');

  if (!topic || !articleList || !articleEmpty) return;

  articleList.replaceChildren();
  articleEmpty.classList.add('hidden');

  if (!category) {
    if (contentTitle) contentTitle.textContent = topic.title;
    renderAboutContent(topic);
    return;
  }

  const article = findArticle(category, homeState.articleSlug);

  if (!article) {
    if (contentTitle) contentTitle.textContent = category.title;
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

initHome();
