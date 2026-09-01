(function () {
  function isHomeRouteHash(rawHash) {
    if (!rawHash) return true;

    const firstPart = rawHash.split('/').filter(Boolean)[0];
    const topics = Array.isArray(window.siteMap) ? window.siteMap : [];
    if (topics.some(topic => topic.id === firstPart)) return true;

    return Boolean(window.isLegacyHomeRoute?.(rawHash));
  }

  window.addEventListener('hashchange', event => {
    const rawHash = decodeURIComponent(window.location.hash.replace(/^#/, '').trim());
    if (isHomeRouteHash(rawHash)) return;
    event.stopImmediatePropagation();
  }, true);
})();
