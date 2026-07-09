(function () {
  function isHomeRouteHash(rawHash) {
    if (!rawHash) return true;

    const firstPart = rawHash.split('/').filter(Boolean)[0];
    const topics = Array.isArray(window.siteMap) ? window.siteMap : [];
    if (topics.some(topic => topic.id === firstPart)) return true;

    const legacyHashMap = new Set([
      'hardware-stack',
      'c-basic', 'c-pointer', 'c-data-storage', 'c-stack-heap', 'c-struct', 'c-embedded', 'c-debug',
      'verilog-basic', 'verilog-logic', 'verilog-fsm', 'verilog-sim',
      'windows-uqitong', 'windows-iventoy',
      'linux-basic', 'linux-process', 'linux-shell', 'linux-embedded', 'linux-uboot', 'linux-kernel-build', 'linux-rootfs-build',
      'freertos-basic', 'freertos-task', 'freertos-ipc', 'freertos-debug',
      'mcu-stack', 'mcu-st', 'mcu-wh', 'mcu-microchip', 'mcu-sl', 'mcu-espressif', 'mcu-xilinx',
      'soc-stack', 'soc-orbit', 'soc-rockchip',
      'fpga-stack', 'fpga-microchip', 'fpga-lattice', 'fpga-anlogic',
      'gui-stack', 'gui-nxp', 'gui-dfc',
      'host-stack', 'host-wireless', 'host-debug',
      'about'
    ]);

    return legacyHashMap.has(rawHash);
  }

  window.addEventListener('hashchange', event => {
    const rawHash = decodeURIComponent(window.location.hash.replace(/^#/, '').trim());
    if (isHomeRouteHash(rawHash)) return;
    event.stopImmediatePropagation();
  }, true);
})();
