(function () {
  const legacyRoutes = Object.freeze({
    'hardware-stack': 'foundation/c-basic',
    'c-basic': 'foundation/c-basic',
    'c-pointer': 'foundation/pointer-memory',
    'c-data-storage': 'foundation/pointer-memory',
    'c-stack-heap': 'foundation/pointer-memory',
    'c-struct': 'foundation/data-structure',
    'c-embedded': 'foundation/embedded-c',
    'c-debug': 'foundation/debug-engineering',

    'verilog-basic': 'fpga/hdl-basic',
    'verilog-logic': 'fpga/hdl-basic',
    'verilog-fsm': 'fpga/hdl-basic',
    'verilog-sim': 'fpga/verification',

    'windows-uqitong': 'dev-tools/windows-install',
    'windows-iventoy': 'dev-tools/pxe-iventoy',

    'linux-basic': 'soc-linux/linux-basic',
    'linux-process': 'soc-linux/linux-basic',
    'linux-shell': 'soc-linux/linux-basic',
    'linux-embedded': 'soc-linux/driver-debug',
    'linux-uboot': 'soc-linux/boot-kernel-rootfs',
    'linux-kernel-build': 'soc-linux/boot-kernel-rootfs',
    'linux-rootfs-build': 'soc-linux/boot-kernel-rootfs',

    'freertos-basic': 'realtime/freertos-basic',
    'freertos-task': 'realtime/task-management',
    'freertos-ipc': 'realtime/ipc-sync',
    'freertos-debug': 'realtime/timer-memory-debug',

    'mcu-stack': 'mcu/common',
    'mcu-st': 'mcu/st',
    'mcu-wh': 'mcu/wh',
    'mcu-microchip': 'mcu/microchip',
    'mcu-sl': 'mcu/silicon-labs',
    'mcu-espressif': 'mcu/espressif',
    'mcu-xilinx': 'fpga/xilinx',

    'soc-stack': 'soc-linux/rockchip',
    'soc-orbit': 'soc-linux/other-soc',
    'soc-rockchip': 'soc-linux/rockchip',

    'fpga-stack': 'fpga/hdl-basic',
    'fpga-microchip': 'fpga/microchip',
    'fpga-lattice': 'fpga/lattice',
    'fpga-anlogic': 'fpga/anlogic',

    'gui-stack': 'gui/lvgl',
    'gui-nxp': 'gui/nxp',
    'gui-dfc': 'gui/dfc',

    'host-stack': 'host-tools/debug-config',
    'host-wireless': 'host-tools/wireless-client',
    'host-debug': 'host-tools/debug-config',
    'about': 'about'
  });

  function resolveLegacyRoute(rawHash) {
    const key = String(rawHash || '').trim();
    return legacyRoutes[key] || '';
  }

  function isLegacyRoute(rawHash) {
    return Boolean(resolveLegacyRoute(rawHash));
  }

  window.siteLegacyRoutes = legacyRoutes;
  window.resolveLegacyHomeRoute = resolveLegacyRoute;
  window.isLegacyHomeRoute = isLegacyRoute;
})();
