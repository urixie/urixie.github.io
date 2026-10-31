/* 在首屏渲染前应用用户手动选择的主题，避免深浅色闪烁；未选择时由 CSS 跟随系统。 */
(function () {
  try {
    var theme = window.localStorage.getItem('xyj-theme');
    if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
  } catch (error) {
    /* 无法读取存储时保持跟随系统。 */
  }
})();
