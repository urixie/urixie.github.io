/* 全站共享：主题、目录、滚动高亮、阅读进度、浮动工具条、面板（抽屉 / 底部弹层）与文章增强。
   首页（index.html）与独立文章页共用这一套阅读组件。 */

const THEME_STORAGE_KEY = 'xyj-theme';
const ICONS = {
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'M6 6l12 12M18 6L6 18',
  search: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm9 16-4.35-4.35',
  toc: 'M4 6h2M9 6h11M4 12h2M9 12h11M4 18h2M9 18h11',
  up: 'M12 19V5M5 12l7-7 7 7',
  prev: 'M15 18l-6-6 6-6',
  next: 'M9 18l6-6-6-6',
  home: 'M3 11l9-7 9 7M5 10v10h5v-6h4v6h5V10',
  sun: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0-6v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z',
  chevron: 'M9 6l6 6-6 6'
};

function createIcon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'ui-icon');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', ICONS[name] || '');
  svg.appendChild(path);
  return svg;
}

/* 滚动相关的更新优先放在下一帧；后台标签页、隐藏 iframe 等不触发 requestAnimationFrame 的场景
   由定时器兜底，保证目录高亮与章节路由不会停在旧状态。 */
function createFrameScheduler(callback, fallbackMs = 120) {
  let frame = 0;
  let timer = 0;
  const run = () => {
    if (frame) window.cancelAnimationFrame(frame);
    if (timer) window.clearTimeout(timer);
    frame = 0;
    timer = 0;
    callback();
  };
  return {
    schedule() {
      if (frame || timer) return;
      frame = window.requestAnimationFrame(run);
      timer = window.setTimeout(run, fallbackMs);
    },
    cancel() {
      if (frame) window.cancelAnimationFrame(frame);
      if (timer) window.clearTimeout(timer);
      frame = 0;
      timer = 0;
    }
  };
}

function prefersReducedMotion() {
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

document.querySelectorAll('[data-current-year]').forEach(target => {
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

/* ---------- 主题：默认跟随系统，手动切换后记住选择 ---------- */

function readStoredTheme() {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : '';
  } catch (error) {
    return '';
  }
}

function getEffectiveTheme() {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === 'light' || explicit === 'dark') return explicit;
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function syncThemeToggles() {
  const theme = getEffectiveTheme();
  document.querySelectorAll('[data-theme-toggle]').forEach(button => {
    const next = theme === 'dark' ? '浅色' : '深色';
    button.setAttribute('aria-label', `切换到${next}主题`);
    button.title = `切换到${next}主题`;
    const icon = button.querySelector('.ui-icon');
    const replacement = createIcon(theme === 'dark' ? 'sun' : 'moon');
    if (icon) icon.replaceWith(replacement);
    else button.prepend(replacement);
  });
}

function toggleTheme() {
  const next = getEffectiveTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch (error) {
    /* 隐私模式下无法写入时，本次会话仍然生效。 */
  }
  syncThemeToggles();
}

function initThemeToggles(root = document) {
  const stored = readStoredTheme();
  if (stored) document.documentElement.dataset.theme = stored;
  root.querySelectorAll('[data-theme-toggle]').forEach(button => {
    if (button.dataset.themeBound) return;
    button.dataset.themeBound = 'true';
    button.addEventListener('click', toggleTheme);
  });
  syncThemeToggles();
}

/* ---------- 标题锚点与目录 ---------- */

function headingSlug(text) {
  const normalized = String(text || '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'section';
}

function assignStableHeadingIds(headings, article) {
  const usedIds = new Set(
    Array.from(article.querySelectorAll('[id]'))
      .filter(element => !headings.includes(element))
      .map(element => element.id)
      .filter(Boolean)
  );

  headings.forEach(heading => {
    if (heading.id) {
      usedIds.add(heading.id);
      return;
    }

    const base = headingSlug(heading.textContent);
    let candidate = base;
    let suffix = 2;
    while (usedIds.has(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    heading.id = candidate;
    usedIds.add(candidate);
  });
}

function getArticleHeadings(article) {
  const headings = Array.from(article.querySelectorAll('h2, h3'));
  assignStableHeadingIds(headings, article);
  return headings;
}

function renderTocLinks(toc, headings, linkClass = 'article-nav-sub') {
  toc.replaceChildren();
  const links = headings.map(heading => {
    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent.trim();
    if (heading.tagName === 'H3') link.classList.add(linkClass);
    toc.appendChild(link);
    return link;
  });
  toc.hidden = headings.length === 0;
  return links;
}

function buildArticleToc(root = document) {
  const toc = root.querySelector('#articleToc[data-auto-toc], [data-auto-toc].article-nav');
  const article = root.querySelector('.article');
  if (!toc || !article) return null;
  const headings = getArticleHeadings(article);
  return { toc, headings, links: renderTocLinks(toc, headings) };
}

function setActiveTocLink(links, index) {
  links.forEach((link, linkIndex) => {
    const active = linkIndex === index;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });

  const activeLink = links[index];
  const container = activeLink?.parentElement;
  if (!activeLink || !container || container.scrollHeight <= container.clientHeight) return;
  const top = activeLink.offsetTop - container.offsetTop;
  if (top < container.scrollTop || top + activeLink.offsetHeight > container.scrollTop + container.clientHeight) {
    container.scrollTop = Math.max(0, top - container.clientHeight / 3);
  }
}

function scrollToHeading(heading) {
  if (!heading) return;
  heading.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
}

/* 滚动高亮：取最后一个越过顶部阈值的标题作为当前章节；滚到底时高亮最后一节。 */
function createScrollSpy(headings, options = {}) {
  const getOffset = options.offset || (() => 120);
  let current = -1;

  const update = () => {
    if (!headings.length) return;
    const limit = getOffset();
    let index = 0;
    for (let i = 0; i < headings.length; i += 1) {
      if (headings[i].getBoundingClientRect().top - limit <= 1) index = i;
      else break;
    }
    const root = document.documentElement;
    const scrollable = root.scrollHeight > window.innerHeight + 4;
    if (scrollable && window.innerHeight + window.scrollY >= root.scrollHeight - 2) {
      index = headings.length - 1;
    }
    if (index !== current) {
      current = index;
      options.onChange?.(index, headings[index]);
    }
  };

  const scheduler = createFrameScheduler(update);
  const schedule = scheduler.schedule;

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  update();

  return {
    get index() {
      return current;
    },
    refresh: update,
    destroy() {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      scheduler.cancel();
    }
  };
}

/* ---------- 阅读进度条 ---------- */

function initReadingProgress() {
  let bar = document.querySelector('.reading-progress');
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'reading-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.prepend(bar);
  }
  const update = () => {
    const root = document.documentElement;
    const total = root.scrollHeight - window.innerHeight;
    const ratio = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
    bar.style.transform = `scaleX(${ratio})`;
  };
  const { schedule } = createFrameScheduler(update);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  update();
  return { refresh: schedule };
}

/* ---------- 面板：手机导航抽屉、目录底部弹层，共用一个遮罩 ---------- */

const sitePanels = new Map();
const PANEL_OPEN_CLASSES = { nav: 'nav-open', toc: 'toc-open' };

function panelOpenClass(name) {
  return PANEL_OPEN_CLASSES[name] || `${name}-open`;
}
let panelReturnFocus = null;

function getOverlay() {
  let overlay = document.querySelector('.page-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'page-overlay';
    overlay.hidden = true;
    overlay.addEventListener('click', () => closePanels());
    document.body.appendChild(overlay);
  }
  return overlay;
}

function registerPanel(name, element, options = {}) {
  if (!element) return;
  sitePanels.set(name, { element, media: options.media || '' });
  element.dataset.panel = name;
  if (options.media && window.matchMedia) {
    window.matchMedia(options.media).addEventListener?.('change', event => {
      if (!event.matches && document.body.classList.contains(panelOpenClass(name))) closePanels({ restoreFocus: false });
    });
  }
}

function isPanelActive(name) {
  const panel = sitePanels.get(name);
  if (!panel) return false;
  return !panel.media || Boolean(window.matchMedia?.(panel.media).matches);
}

function syncPanelToggles() {
  document.querySelectorAll('[data-panel-toggle]').forEach(button => {
    const open = document.body.classList.contains(panelOpenClass(button.dataset.panelToggle));
    button.setAttribute('aria-expanded', String(open));
  });
}

function openPanel(name) {
  const panel = sitePanels.get(name);
  if (!panel || !isPanelActive(name)) return false;
  closePanels({ restoreFocus: false });
  panelReturnFocus = document.activeElement;
  document.body.classList.add(panelOpenClass(name));
  document.documentElement.classList.add('is-scroll-locked');
  getOverlay().hidden = false;
  syncPanelToggles();
  const focusTarget = panel.element.querySelector('[data-panel-focus]')
    || panel.element.querySelector('a.active, button, a[href], input');
  focusTarget?.focus({ preventScroll: true });
  return true;
}

function closePanels(options = {}) {
  let closed = false;
  sitePanels.forEach((_, name) => {
    if (document.body.classList.contains(panelOpenClass(name))) {
      document.body.classList.remove(panelOpenClass(name));
      closed = true;
    }
  });
  if (!closed) return;
  document.documentElement.classList.remove('is-scroll-locked');
  getOverlay().hidden = true;
  syncPanelToggles();
  if (options.restoreFocus !== false && panelReturnFocus?.focus) panelReturnFocus.focus({ preventScroll: true });
  panelReturnFocus = null;
}

function togglePanel(name) {
  if (document.body.classList.contains(panelOpenClass(name))) closePanels();
  else openPanel(name);
}

function bindPanelToggles(root = document) {
  root.querySelectorAll('[data-panel-toggle]').forEach(button => {
    if (button.dataset.panelBound) return;
    button.dataset.panelBound = 'true';
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', () => togglePanel(button.dataset.panelToggle));
  });
}

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closePanels();
});

/* ---------- 浮动阅读工具条（窄屏显示） ---------- */

function createReaderDock(items) {
  const dock = document.createElement('nav');
  dock.className = 'reader-dock';
  dock.setAttribute('aria-label', '阅读工具');
  items.forEach(item => {
    const control = document.createElement(item.href ? 'a' : 'button');
    control.className = 'reader-dock-button';
    if (item.href) control.href = item.href;
    else control.type = 'button';
    if (item.action) control.dataset.action = item.action;
    if (item.panel) control.dataset.panelToggle = item.panel;
    if (item.theme) control.dataset.themeToggle = '';
    control.setAttribute('aria-label', item.label);
    control.appendChild(createIcon(item.icon));
    const text = document.createElement('span');
    text.textContent = item.text || item.label;
    control.appendChild(text);
    if (item.onClick) control.addEventListener('click', item.onClick);
    dock.appendChild(control);
  });
  document.body.appendChild(dock);
  bindPanelToggles(dock);
  initThemeToggles(dock);
  return dock;
}

function scrollPageToTop() {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

/* ---------- 文章增强：代码复制、表格横向滚动、图片缩放 ---------- */

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

function enhanceArticleImageZoom(root = document) {
  const images = root.querySelectorAll('.article img');

  images.forEach(image => {
    if (image.closest('.article-image-zoom-container')) return;

    const container = document.createElement('div');
    container.className = 'article-image-zoom-container';
    container.tabIndex = 0;
    container.setAttribute('aria-label', '文章图片，可使用滚轮或加减键缩放，按 0 或 Escape 复位');
    container.title = '滚轮或 +/- 缩放，放大后可拖拽，按 0 复位';
    image.parentNode.insertBefore(container, image);
    container.appendChild(image);

    const controls = document.createElement('div');
    controls.className = 'article-image-zoom-controls';
    const zoomOutButton = document.createElement('button');
    const resetButton = document.createElement('button');
    const zoomInButton = document.createElement('button');
    zoomOutButton.type = 'button';
    resetButton.type = 'button';
    zoomInButton.type = 'button';
    zoomOutButton.className = 'article-image-zoom-control';
    resetButton.className = 'article-image-zoom-control article-image-zoom-reset';
    zoomInButton.className = 'article-image-zoom-control';
    zoomOutButton.textContent = '−';
    resetButton.textContent = '100%';
    zoomInButton.textContent = '+';
    zoomOutButton.setAttribute('aria-label', '缩小图片');
    resetButton.setAttribute('aria-label', '恢复图片原始大小');
    zoomInButton.setAttribute('aria-label', '放大图片');
    controls.append(zoomOutButton, resetButton, zoomInButton);
    container.appendChild(controls);

    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    const applyTransform = () => {
      image.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
      container.classList.toggle('is-zoomed', scale > 1);
      zoomOutButton.disabled = scale <= 1;
      zoomInButton.disabled = scale >= 4;
      resetButton.textContent = `${Math.round(scale * 100)}%`;
    };

    const setScale = (nextScale, clientX, clientY) => {
      scale = Number(Math.min(4, Math.max(1, nextScale)).toFixed(2));
      if (scale === 1) {
        offsetX = 0;
        offsetY = 0;
        image.style.transformOrigin = 'center center';
      } else if (clientX !== undefined && clientY !== undefined) {
        const rect = container.getBoundingClientRect();
        const originX = ((clientX - rect.left) / rect.width) * 100;
        const originY = ((clientY - rect.top) / rect.height) * 100;
        image.style.transformOrigin = `${originX}% ${originY}%`;
      }
      applyTransform();
    };

    container.addEventListener('wheel', event => {
      const deltaY = event.deltaY || (event.wheelDelta ? -event.wheelDelta : 0);
      if (!deltaY || (scale === 1 && deltaY > 0)) return;
      event.preventDefault();
      setScale(scale + (deltaY < 0 ? 0.2 : -0.2), event.clientX, event.clientY);
    }, { passive: false });

    container.addEventListener('keydown', event => {
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        setScale(scale + 0.2);
      } else if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        setScale(scale - 0.2);
      } else if (event.key === '0' || event.key === 'Escape') {
        event.preventDefault();
        setScale(1);
      }
    });

    zoomOutButton.addEventListener('click', () => setScale(scale - 0.2));
    resetButton.addEventListener('click', () => setScale(1));
    zoomInButton.addEventListener('click', () => setScale(scale + 0.2));

    image.addEventListener('dblclick', event => {
      event.preventDefault();
      setScale(scale > 1 ? 1 : 2, event.clientX, event.clientY);
    });

    image.addEventListener('pointerdown', event => {
      if (scale <= 1) return;
      event.preventDefault();
      isDragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      container.classList.add('is-dragging');
      image.setPointerCapture(event.pointerId);
    });

    image.addEventListener('pointermove', event => {
      if (!isDragging) return;
      offsetX += event.clientX - lastX;
      offsetY += event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      applyTransform();
    });

    const stopDragging = event => {
      if (!isDragging) return;
      isDragging = false;
      container.classList.remove('is-dragging');
      if (event.pointerId !== undefined && image.hasPointerCapture(event.pointerId)) {
        image.releasePointerCapture(event.pointerId);
      }
    };

    image.addEventListener('pointerup', stopDragging);
    image.addEventListener('pointercancel', stopDragging);
    applyTransform();
  });
}

/* ---------- 独立文章页：与首页共用目录、滚动高亮、进度条和工具条 ---------- */

function initStandaloneReader(tocResult) {
  const shell = document.querySelector('.article-page-shell');
  const sidebar = document.querySelector('.article-sidebar');
  if (!shell || !sidebar || shell.dataset.readerReady) return;
  shell.dataset.readerReady = 'true';
  document.body.classList.add('article-page');

  const actions = sidebar.querySelector('.article-nav-actions');
  const homeLink = actions?.querySelector('a');
  if (actions && !actions.querySelector('[data-theme-toggle]')) {
    const themeButton = document.createElement('button');
    themeButton.type = 'button';
    themeButton.className = 'article-theme-toggle';
    themeButton.dataset.themeToggle = '';
    const label = document.createElement('span');
    label.textContent = '切换主题';
    themeButton.appendChild(label);
    actions.appendChild(themeButton);
  }

  const sheetMedia = '(max-width: 1079px)';
  registerPanel('toc', sidebar, { media: sheetMedia });
  initReadingProgress();

  if (tocResult && tocResult.headings.length) {
    const { headings, links, toc } = tocResult;
    const spy = createScrollSpy(headings, {
      offset: () => 96,
      onChange: index => setActiveTocLink(links, index)
    });
    toc.addEventListener('click', event => {
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;
      const index = links.indexOf(link);
      if (index < 0) return;
      event.preventDefault();
      closePanels({ restoreFocus: false });
      scrollToHeading(headings[index]);
      window.history.replaceState(null, '', `#${headings[index].id}`);
      setActiveTocLink(links, index);
      window.setTimeout(() => spy.refresh(), 400);
    });
  }

  createReaderDock([
    { label: '返回首页', text: '首页', icon: 'home', href: homeLink?.getAttribute('href') || '../../../../index.html' },
    { label: '打开文章目录', text: '目录', icon: 'toc', panel: 'toc' },
    { label: '切换主题', text: '主题', icon: 'sun', theme: true },
    { label: '回到顶部', text: '顶部', icon: 'up', action: 'top', onClick: scrollPageToTop }
  ]);
}

function initArticlePage(root = document) {
  initThemeToggles(root);
  const tocResult = buildArticleToc(root);
  initCopyButtons(root);
  enhanceArticleTables(root);
  enhanceArticleImageZoom(root);
  if (root === document) initStandaloneReader(tocResult);
}

window.siteUi = {
  createIcon,
  initThemeToggles,
  toggleTheme,
  headingSlug,
  getArticleHeadings,
  renderTocLinks,
  setActiveTocLink,
  scrollToHeading,
  createScrollSpy,
  initReadingProgress,
  registerPanel,
  openPanel,
  closePanels,
  togglePanel,
  bindPanelToggles,
  createReaderDock,
  scrollPageToTop,
  prefersReducedMotion
};
window.initArticlePage = initArticlePage;

initArticlePage();
