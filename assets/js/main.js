function injectFreeRtosTopic() {
  const nav = document.querySelector('.nav#site-nav');
  const stackList = document.querySelector('#hardware-stack .stack-list');
  const tagCloud = document.querySelector('.tag-cloud');

  if (!nav || !stackList) return;
  if (document.querySelector('#freertos-group') || document.querySelector('#freertos-basic')) return;

  const freeRtosNavGroup = document.createElement('div');
  freeRtosNavGroup.className = 'nav-group';
  freeRtosNavGroup.id = 'freertos-group';
  freeRtosNavGroup.innerHTML = `
    <button class="nav-group-toggle" type="button" aria-expanded="false">
      <span>FreeRTOS专题</span>
      <svg class="nav-group-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5"/></svg>
    </button>
    <div class="nav-group-items">
      <a class="nav-sub" href="#freertos-basic">基础与调度</a>
      <a class="nav-sub" href="#freertos-task">任务管理</a>
      <a class="nav-sub" href="#freertos-ipc">队列与同步</a>
      <a class="nav-sub" href="#freertos-debug">定时器与调试</a>
    </div>
  `;

  const mcuGroup = document.querySelector('#mcu-group');
  if (mcuGroup) {
    nav.insertBefore(freeRtosNavGroup, mcuGroup);
  } else {
    nav.appendChild(freeRtosNavGroup);
  }

  const freeRtosCards = document.createElement('template');
  freeRtosCards.innerHTML = `
    <article class="stack-card" id="freertos-basic">
      <div class="post-meta">FreeRTOS专题</div>
      <div class="platform-category">
        <h4>基础与调度</h4>
        <div class="platform-items">
          <a class="platform-item" href="articles/freertos/freertos-basic-scheduler/freertos-basic-scheduler.html?v=bb7d9a57684e">
            <strong>FreeRTOS · 基础概念与调度机制</strong>
            <span>RTOS / 任务状态 / 抢占式调度 / 时间片 / Tick / 中断优先级 · 建立 FreeRTOS 整体认知</span>
          </a>
        </div>
      </div>
    </article>

    <article class="stack-card" id="freertos-task">
      <div class="post-meta">FreeRTOS专题</div>
      <div class="platform-category">
        <h4>任务管理</h4>
        <div class="platform-items">
          <a class="platform-item" href="articles/freertos/freertos-task-management/freertos-task-management.html?v=bb7d9a57684e">
            <strong>FreeRTOS · 任务管理与栈空间</strong>
            <span>xTaskCreate / 任务优先级 / vTaskDelayUntil / 任务栈 / 栈水位检测 · 适合嵌入式任务拆分设计</span>
          </a>
        </div>
      </div>
    </article>

    <article class="stack-card" id="freertos-ipc">
      <div class="post-meta">FreeRTOS专题</div>
      <div class="platform-category">
        <h4>队列与同步</h4>
        <div class="platform-items">
          <a class="platform-item" href="articles/freertos/freertos-ipc-sync/freertos-ipc-sync.html?v=bb7d9a57684e">
            <strong>FreeRTOS · 队列、信号量与互斥锁</strong>
            <span>Queue / Semaphore / Mutex / FromISR / 任务通知 / 优先级继承 · 梳理任务间通信和共享资源保护</span>
          </a>
        </div>
      </div>
    </article>

    <article class="stack-card" id="freertos-debug">
      <div class="post-meta">FreeRTOS专题</div>
      <div class="platform-category">
        <h4>定时器与调试</h4>
        <div class="platform-items">
          <a class="platform-item" href="articles/freertos/freertos-timer-memory-debug/freertos-timer-memory-debug.html?v=bb7d9a57684e">
            <strong>FreeRTOS · 软件定时器、内存与调试</strong>
            <span>Software Timer / heap_4 / 静态创建 / 栈溢出检测 / vTaskList / 运行统计 · 面向工程排错</span>
          </a>
        </div>
      </div>
    </article>
  `;

  const cStructCard = document.querySelector('#c-struct');
  if (cStructCard) {
    cStructCard.before(freeRtosCards.content);
  } else {
    stackList.prepend(freeRtosCards.content);
  }

  if (tagCloud && !tagCloud.querySelector('[data-topic="freertos"]')) {
    const tags = [
      ['FreeRTOS', 'articles/freertos/freertos-basic-scheduler/freertos-basic-scheduler.html?v=bb7d9a57684e'],
      ['RTOS', 'articles/freertos/freertos-basic-scheduler/freertos-basic-scheduler.html?v=bb7d9a57684e'],
      ['任务调度', 'articles/freertos/freertos-basic-scheduler/freertos-basic-scheduler.html?v=bb7d9a57684e'],
      ['任务栈', 'articles/freertos/freertos-task-management/freertos-task-management.html?v=bb7d9a57684e'],
      ['队列', 'articles/freertos/freertos-ipc-sync/freertos-ipc-sync.html?v=bb7d9a57684e'],
      ['信号量', 'articles/freertos/freertos-ipc-sync/freertos-ipc-sync.html?v=bb7d9a57684e'],
      ['互斥锁', 'articles/freertos/freertos-ipc-sync/freertos-ipc-sync.html?v=bb7d9a57684e'],
      ['任务通知', 'articles/freertos/freertos-ipc-sync/freertos-ipc-sync.html?v=bb7d9a57684e'],
      ['软件定时器', 'articles/freertos/freertos-timer-memory-debug/freertos-timer-memory-debug.html?v=bb7d9a57684e'],
      ['heap_4', 'articles/freertos/freertos-timer-memory-debug/freertos-timer-memory-debug.html?v=bb7d9a57684e']
    ];

    tags.forEach(([text, href], index) => {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = text;
      if (index === 0) {
        link.dataset.topic = 'freertos';
      }
      tagCloud.appendChild(link);
    });
  }
}

injectFreeRtosTopic();

const navLinks = document.querySelectorAll('.nav a');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const yearTargets = document.querySelectorAll('[data-current-year]');
const navGroupToggles = document.querySelectorAll('.nav-group-toggle');

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

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('is-open', !expanded);
  });
}

navGroupToggles.forEach(toggle => {
  const groupItems = toggle.parentElement.querySelector('.nav-group-items');

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    if (groupItems) {
      groupItems.classList.toggle('is-open', !expanded);
    }
  });
});

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    if (menuToggle && nav) {
      menuToggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
    }
  });
});

const sections = Array.from(navLinks)
  .map(link => {
    const href = link.getAttribute('href');
    return href && href.startsWith('#') ? document.querySelector(href) : null;
  })
  .filter(Boolean);

function updateActiveNav() {
  const current = sections
    .slice()
    .reverse()
    .find(section => window.scrollY >= section.offsetTop - 160);

  if (!current) return;

  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current.id}`);
  });
}

if (sections.length > 0) {
  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();
}

/*
 * Article navigation
 * 自动为文章页生成目录。
 *
 * 文章页原本的 article-topbar 只作为数据源：
 * - 读取里面的“返回首页 / 返回分类”等链接
 * - 复制到文章导航卡片中
 * - 然后删除 article-topbar
 *
 * 最终效果：
 * 电脑端：左侧文章导航 + 右侧正文
 * 手机端：顶部文章导航 + 下方正文
 */
function normalizeHeadingId(index) {
  return `article-section-${index + 1}`;
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

  const topbarLinks = articleTopbar
    ? Array.from(articleTopbar.querySelectorAll('a')).map(link => ({
        text: link.textContent.trim(),
        href: link.getAttribute('href')
      }))
    : [];

  /*
   * 关键点：
   * 必须删除文章正文顶部按钮。
   * 返回入口只保留在文章导航卡片里。
   */
  articleTopbar?.remove();

  const articleSidebar = document.createElement('aside');
  articleSidebar.className = 'article-sidebar';
  articleSidebar.setAttribute('aria-label', '文章导航');

  const articleNavCard = document.createElement('div');
  articleNavCard.className = 'article-nav-card';

  const quickLinks = document.createElement('div');
  quickLinks.className = 'article-nav-actions';

  topbarLinks.forEach(item => {
    if (!item.href || !item.text) return;

    const a = document.createElement('a');
    a.href = item.href;
    a.textContent = item.text;
    quickLinks.appendChild(a);
  });

  const navTitle = document.createElement('div');
  navTitle.className = 'article-nav-title';
  navTitle.textContent = '文章目录';

  const articleNav = document.createElement('nav');
  articleNav.className = 'article-nav';

  headings.forEach((heading, index) => {
    const section = heading.closest('section');
    if (!section) return;

    const link = document.createElement('a');
    link.href = `#${section.id}`;
    link.textContent = heading.textContent.trim();

    if (index === 0) {
      link.classList.add('active');
    }

    articleNav.appendChild(link);
  });

  if (quickLinks.children.length > 0) {
    articleNavCard.appendChild(quickLinks);
  }

  articleNavCard.appendChild(navTitle);
  articleNavCard.appendChild(articleNav);
  articleSidebar.appendChild(articleNavCard);

  articleShell.insertBefore(articleSidebar, articleShell.firstElementChild);

  const articleNavLinks = Array.from(articleNav.querySelectorAll('a'));
  const articleSections = headings
    .map(heading => heading.closest('section'))
    .filter(Boolean);

  function updateActiveArticleNav() {
    const current = articleSections
      .slice()
      .reverse()
      .find(section => window.scrollY >= section.offsetTop - 170);

    if (!current) return;

    articleNavLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current.id}`);
    });
  }

  articleNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      articleNavLinks.forEach(item => item.classList.remove('active'));
      link.classList.add('active');
    });
  });

  window.addEventListener('scroll', updateActiveArticleNav, { passive: true });
  updateActiveArticleNav();
}

buildArticleNav();