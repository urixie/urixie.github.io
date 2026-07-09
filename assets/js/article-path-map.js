(function () {
  const articlePathMap = {
    'articles/c/c-basic-syntax/c-basic-syntax.html': 'articles/foundation/c-basic/c-basic-syntax/c-basic-syntax.html',
    'articles/c/c-pointer-memory/c-pointer-memory.html': 'articles/foundation/pointer-memory/c-pointer-memory/c-pointer-memory.html',
    'articles/c/c-data-storage-pointer/c-data-storage-pointer.html': 'articles/foundation/pointer-memory/c-data-storage-pointer/c-data-storage-pointer.html',
    'articles/c/c-stack-heap-memory/c-stack-heap-memory.html': 'articles/foundation/pointer-memory/c-stack-heap-memory/c-stack-heap-memory.html',
    'articles/c/c-struct-data-layout/c-struct-data-layout.html': 'articles/foundation/data-structure/c-struct-data-layout/c-struct-data-layout.html',
    'articles/c/c-embedded-c/c-embedded-c.html': 'articles/foundation/embedded-c/c-embedded-c/c-embedded-c.html',
    'articles/c/c-debug-engineering/c-debug-engineering.html': 'articles/foundation/debug-engineering/c-debug-engineering/c-debug-engineering.html',

    'articles/mcu/cw32l011-ntc-adc-pwm/cw32l011-ntc-adc-pwm.html': 'articles/mcu/wh/cw32l011-ntc-adc-pwm/cw32l011-ntc-adc-pwm.html',
    'articles/mcu/pic16f18854-datasheet-notes/pic16f18854-datasheet-notes.html': 'articles/mcu/microchip/pic16f18854-datasheet-notes/pic16f18854-datasheet-notes.html',
    'articles/mcu/pic16f188xx-memory-programming/pic16f188xx-memory-programming.html': 'articles/mcu/microchip/pic16f188xx-memory-programming/pic16f188xx-memory-programming.html',
    'articles/mcu/efm8bb10f8i-qfn20-development-notes/efm8bb10f8i-qfn20-development-notes.html': 'articles/mcu/silicon-labs/efm8bb10f8i-qfn20-development-notes/efm8bb10f8i-qfn20-development-notes.html',
    'articles/mcu/esp32-c2-efm8-flash-programming/esp32-c2-efm8-flash-programming.html': 'articles/mcu/silicon-labs/esp32-c2-efm8-flash-programming/esp32-c2-efm8-flash-programming.html',

    'articles/verilog/verilog-basic-syntax/verilog-basic-syntax.html': 'articles/fpga/hdl-basic/verilog-basic-syntax/verilog-basic-syntax.html',
    'articles/verilog/verilog-combinational-sequential/verilog-combinational-sequential.html': 'articles/fpga/hdl-basic/verilog-combinational-sequential/verilog-combinational-sequential.html',
    'articles/verilog/verilog-fsm-design/verilog-fsm-design.html': 'articles/fpga/hdl-basic/verilog-fsm-design/verilog-fsm-design.html',
    'articles/verilog/verilog-testbench-debug/verilog-testbench-debug.html': 'articles/fpga/verification/verilog-testbench-debug/verilog-testbench-debug.html',
    'articles/fpga/aht20-iic-verilog/aht20-iic-verilog.html': 'articles/fpga/anlogic/aht20-iic-verilog/aht20-iic-verilog.html',
    'articles/fpga/ef2-single-port-ram/ef2-single-port-ram.html': 'articles/fpga/anlogic/ef2-single-port-ram/ef2-single-port-ram.html',

    'articles/linux/linux-basic-filesystem/linux-basic-filesystem.html': 'articles/soc-linux/linux-basic/linux-basic-filesystem/linux-basic-filesystem.html',
    'articles/linux/linux-process-memory-thread/linux-process-memory-thread.html': 'articles/soc-linux/linux-basic/linux-process-memory-thread/linux-process-memory-thread.html',
    'articles/linux/linux-shell-systemd/linux-shell-systemd.html': 'articles/soc-linux/linux-basic/linux-shell-systemd/linux-shell-systemd.html',
    'articles/linux/uboot-structure-build/uboot-structure-build.html': 'articles/soc-linux/boot-kernel-rootfs/uboot-structure-build/uboot-structure-build.html',
    'articles/linux/kernel-structure-build/kernel-structure-build.html': 'articles/soc-linux/boot-kernel-rootfs/kernel-structure-build/kernel-structure-build.html',
    'articles/linux/rootfs-structure-build/rootfs-structure-build.html': 'articles/soc-linux/boot-kernel-rootfs/rootfs-structure-build/rootfs-structure-build.html',
    'articles/linux/linux-embedded-debug/linux-embedded-debug.html': 'articles/soc-linux/driver-debug/linux-embedded-debug/linux-embedded-debug.html',
    'articles/soc/rk3568-usb-ethernet-gadget/rk3568-usb-ethernet-gadget.html': 'articles/soc-linux/rockchip/rk3568-usb-ethernet-gadget/rk3568-usb-ethernet-gadget.html',
    'articles/soc/rk3568-spi-spidev/rk3568-spi-spidev.html': 'articles/soc-linux/rockchip/rk3568-spi-spidev/rk3568-spi-spidev.html',

    'articles/freertos/freertos-basic-scheduler/freertos-basic-scheduler.html': 'articles/realtime/freertos-basic/freertos-basic-scheduler/freertos-basic-scheduler.html',
    'articles/freertos/freertos-task-management/freertos-task-management.html': 'articles/realtime/task-management/freertos-task-management/freertos-task-management.html',
    'articles/freertos/freertos-ipc-sync/freertos-ipc-sync.html': 'articles/realtime/ipc-sync/freertos-ipc-sync/freertos-ipc-sync.html',
    'articles/freertos/freertos-timer-memory-debug/freertos-timer-memory-debug.html': 'articles/realtime/timer-memory-debug/freertos-timer-memory-debug/freertos-timer-memory-debug.html',

    'articles/host/windows-vscode-remote-linux-cpp-debug/windows-vscode-remote-linux-cpp-debug.html': 'articles/host-tools/debug-config/windows-vscode-remote-linux-cpp-debug/windows-vscode-remote-linux-cpp-debug.html',

    'articles/windows/uqitong-usb-win-install/uqitong-usb-win-install.html': 'articles/dev-tools/windows-install/uqitong-usb-win-install/uqitong-usb-win-install.html',
    'articles/windows/iventoy-pxe-win-install/iventoy-pxe-win-install.html': 'articles/dev-tools/pxe-iventoy/iventoy-pxe-win-install/iventoy-pxe-win-install.html'
  };

  function rewriteHref(href) {
    if (!href) return href;

    const [pathPart, queryPart = ''] = href.split('?');
    const nextPath = articlePathMap[pathPart] || pathPart;
    return queryPart ? `${nextPath}?${queryPart}` : nextPath;
  }

  function applyArticlePathMap(siteMap) {
    if (!Array.isArray(siteMap)) return;

    siteMap.forEach(topic => {
      (topic.children || []).forEach(category => {
        (category.articles || []).forEach(article => {
          article.href = rewriteHref(article.href);
        });
      });
    });
  }

  window.articlePathMap = articlePathMap;
  window.applyArticlePathMap = applyArticlePathMap;

  applyArticlePathMap(window.siteMap);
})();
