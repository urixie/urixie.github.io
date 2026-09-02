(function () {
  function decodeHash(value) {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  function readHash() {
    return decodeHash(window.location.hash.replace(/^#/, '').trim());
  }

  function normalizeLegacyHash(rawHash) {
    const nextHash = window.resolveLegacyHomeRoute?.(rawHash);
    if (!nextHash || nextHash === rawHash) return rawHash;

    const nextUrl = `${window.location.pathname}${window.location.search}#${nextHash}`;
    window.history.replaceState(null, '', nextUrl);
    return nextHash;
  }

  function isHomeRouteHash(rawHash) {
    if (!rawHash) return true;

    const firstPart = rawHash.split('/').filter(Boolean)[0];
    const topics = Array.isArray(window.siteMap) ? window.siteMap : [];
    return topics.some(topic => topic.id === firstPart);
  }

  function normalizeCurrentHash() {
    return normalizeLegacyHash(readHash());
  }

  normalizeCurrentHash();

  window.addEventListener('hashchange', event => {
    const normalizedHash = normalizeCurrentHash();
    if (isHomeRouteHash(normalizedHash)) return;

    // 文章正文内部锚点不属于首页路由，避免首页路由监听器误处理。
    event.stopImmediatePropagation();
  }, true);
})();
