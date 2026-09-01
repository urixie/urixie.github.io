(function () {
  function normalizeLegacyHash() {
    const rawHash = decodeURIComponent(window.location.hash.replace(/^#/, '').trim());
    const nextHash = window.resolveLegacyHomeRoute?.(rawHash);

    if (!nextHash || nextHash === rawHash) return false;

    const nextUrl = `${window.location.pathname}${window.location.search}#${nextHash}`;
    window.history.replaceState(null, '', nextUrl);
    return true;
  }

  normalizeLegacyHash();
  window.addEventListener('hashchange', normalizeLegacyHash, true);
})();
