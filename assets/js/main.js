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

function buildArticleToc(root = document) {
  const toc = root.querySelector('#articleToc[data-auto-toc], [data-auto-toc].article-nav');
  const article = root.querySelector('.article');
  if (!toc || !article) return;

  const headings = Array.from(article.querySelectorAll('h2, h3'));
  assignStableHeadingIds(headings, article);
  toc.replaceChildren();

  headings.forEach(heading => {
    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;
    if (heading.tagName === 'H3') link.classList.add('article-nav-sub');
    toc.appendChild(link);
  });

  toc.hidden = headings.length === 0;
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

function initArticlePage(root = document) {
  buildArticleToc(root);
  initCopyButtons(root);
  enhanceArticleTables(root);
  enhanceArticleImageZoom(root);
}

window.initArticlePage = initArticlePage;

initArticlePage();
