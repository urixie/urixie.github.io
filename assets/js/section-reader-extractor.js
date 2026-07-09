(function () {
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

  function extractWrappedSections(children) {
    const sections = [];

    children.forEach(node => {
      if (isSkippableArticleNode(node)) return;
      if (node.matches?.('section') && node.querySelector('h2')) {
        sections.push(createSectionFromContainer(node, sections.length));
        return;
      }

      if (!node.matches?.('section') && node.querySelector?.('h2')) {
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

    headings.forEach((heading, index) => {
      const container = heading.closest('section') || heading.parentElement || heading;
      if (!container || sections.some(section => section.source === container)) return;
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

  window.extractArticleSections = function extractArticleSections(articleRoot) {
    const children = Array.from(articleRoot.children).filter(node => !isSkippableArticleNode(node));

    const wrappedSections = extractWrappedSections(children);
    if (wrappedSections.length > 0) return wrappedSections;

    const siblingSections = extractSiblingSections(children);
    if (siblingSections.length > 0) return siblingSections;

    const deepSections = extractDeepSections(articleRoot);
    if (deepSections.length > 0) return deepSections;

    return extractFullArticle(articleRoot);
  };
})();
