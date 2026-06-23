const navLinks = document.querySelectorAll('.nav a');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const yearTargets = document.querySelectorAll('[data-current-year]');

yearTargets.forEach(target => {
  target.textContent = new Date().getFullYear();
});

function getWorkExperience(startYear, startMonth) {
  const now = new Date();
  const months = (now.getFullYear() - startYear) * 12 + (now.getMonth() - startMonth);
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return remainingMonths ? `${years} 年 ${remainingMonths} 个月` : `${years} 年`;
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
 * 电脑端：左侧 sticky 目录
 * 手机端：顶部目录块
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

  if (articleTopbar) {
    articleTopbar.insertAdjacentElement('afterend', articleSidebar);
  } else {
    articleShell.insertBefore(articleSidebar, articleShell.firstElementChild);
  }

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