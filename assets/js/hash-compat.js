(function () {
  const rawHash = decodeURIComponent(window.location.hash.replace(/^#/, '').trim());
  const nextHash = window.resolveLegacyHomeRoute?.(rawHash);

  if (!nextHash || nextHash === rawHash) return;

  const nextUrl = `${window.location.pathname}${window.location.search}#${nextHash}`;
  window.history.replaceState(null, '', nextUrl);
})();
