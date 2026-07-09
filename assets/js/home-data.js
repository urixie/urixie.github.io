(function () {
  const stylesheet = document.querySelector('link[href*="assets/css/style.css"]');
  const cacheVersion = stylesheet
    ? new URL(stylesheet.href, window.location.href).searchParams.get('v')
    : '';
  const withVersion = path => cacheVersion ? `${path}?v=${cacheVersion}` : path;

  const siteMap = [
    {
      id: 'c',
      title: 'C语言专题',
      shortTitle: 'C',
      desc: '面向嵌入式工程的 C 语言基础、内存、结构体和调试经验。',
      children: [
        {
          id: 'basic',
          title: '基础语法',
          desc: '变量、类型、运算符、流程控制和函数的工程化整理。',
          articles: [
            {
              title: 'C语言 · 基础语法整理',
              desc: '变量 / 类型 / 运算符 / 流程控制 / 函数 · 面向嵌入式工程的 C 语言基础整理',
              href: withVersion('articles/c/c-basic-syntax/c-basic-syntax.html'),
              tags: ['C语言', '基础语法']
            }
          ]
        },
        {
          id: 'pointer',
          title: '指针与内存',
          desc: '梳理 C 语言中最容易出错的指针、数组、栈和堆问题。',
          articles: [
            {
              title: 'C语言 · 指针与内存模型',
              desc: '数组与指针 / 指针函数 / 函数指针 / 栈 / 堆 / 越界访问 · 梳理 C 语言最容易出错的内存问题',
              href: withVersion('articles/c/c-pointer-memory/c-pointer-memory.html'),
              tags: ['指针', '内存模型']
            }
          ]
        },
        {
          id: 'data-storage',
          title: '数据存储与指针',
          desc: '围绕数据表示、对齐、大小端和指针关系建立底层视角。',
          articles: [
            {
              title: 'C语言 · 数据存储与指针',
              desc: '大小端 / 有符号与无符号 / 数据对齐 / size_t / typedef / enum / 数组与指针 / 二维指针 / void',
              href: withVersion('articles/c/c-data-storage-pointer/c-data-storage-pointer.html'),
              tags: ['数据存储', '数据对齐']
            }
          ]
        },
        {
          id: 'stack-heap',
          title: '内存堆栈管理',
          desc: '面向嵌入式 Linux 和 C 工程排错的内存管理整理。',
          articles: [
            {
              title: 'C语言 · 内存堆栈管理',
              desc: '进程 / 栈 / 堆 / mmap / 内存泄漏 / core dump / mprotect / Valgrind · 面向嵌入式 Linux 和 C 工程排错',
              href: withVersion('articles/c/c-stack-heap-memory/c-stack-heap-memory.html'),
              tags: ['栈', '堆', 'Valgrind']
            }
          ]
        },
        {
          id: 'struct',
          title: '结构体与数据组织',
          desc: '适合参数配置、寄存器映射和通信协议设计的数据组织方式。',
          articles: [
            {
              title: 'C语言 · 结构体与数据组织',
              desc: 'struct / union / enum / 位域 / 协议帧 / 寄存器映射 · 适合参数配置和通信协议设计',
              href: withVersion('articles/c/c-struct-data-layout/c-struct-data-layout.html'),
              tags: ['struct', '协议帧']
            }
          ]
        },
        {
          id: 'embedded',
          title: '嵌入式 C',
          desc: '贴近 STM32、ESP32 和驱动开发场景的 C 语言实践。',
          articles: [
            {
              title: '嵌入式 C · GNU C 扩展与工程实践',
              desc: 'volatile / static / const / GNU C / __attribute__ / 中断 / 寄存器操作 · 贴近 STM32、ESP32 和驱动开发场景',
              href: withVersion('articles/c/c-embedded-c/c-embedded-c.html'),
              tags: ['嵌入式 C', 'GNU C']
            }
          ]
        },
        {
          id: 'debug',
          title: '调试与工程实践',
          desc: '沉淀编译、日志、异常和工程规范相关的排错经验。',
          articles: [
            {
              title: 'C语言 · 调试与工程排错',
              desc: '断点调试 / 日志 / map 文件 / HardFault / 编译告警 / 代码规范 · 沉淀实际项目排错经验',
              href: withVersion('articles/c/c-debug-engineering/c-debug-engineering.html'),
              tags: ['调试', 'HardFault']
            }
          ]
        }
      ]
    },
    {
      id: 'verilog',
      title: 'Verilog专题',
      shortTitle: 'HDL',
      desc: '从语法、电路行为、状态机到 Testbench 的 HDL 工程整理。',
      children: [
        {
          id: 'basic',
          title: '基础语法',
          desc: '从硬件角度理解 module、wire、reg、assign 和 always。',
          articles: [
            {
              title: 'Verilog · 基础语法与硬件描述思维',
              desc: 'module / wire / reg / assign / always / 阻塞赋值 / 非阻塞赋值 / parameter · 从硬件角度理解语法',
              href: withVersion('articles/verilog/verilog-basic-syntax/verilog-basic-syntax.html'),
              tags: ['Verilog', '基础语法']
            }
          ]
        },
        {
          id: 'logic',
          title: '组合逻辑与时序逻辑',
          desc: '区分组合逻辑、锁存器、寄存器、复位和流水线行为。',
          articles: [
            {
              title: 'Verilog · 组合逻辑与时序逻辑',
              desc: '组合逻辑 / latch / 寄存器 / 复位 / 计数器 / 边沿检测 / 流水线 · 区分电路行为和代码写法',
              href: withVersion('articles/verilog/verilog-combinational-sequential/verilog-combinational-sequential.html'),
              tags: ['组合逻辑', '时序逻辑']
            }
          ]
        },
        {
          id: 'fsm',
          title: '状态机设计',
          desc: '适合协议、采样和控制流程的状态机设计方法。',
          articles: [
            {
              title: 'Verilog · 状态机设计方法',
              desc: 'FSM / 状态编码 / 三段式状态机 / Moore / Mealy / default安全状态 · 适合协议和采样流程控制',
              href: withVersion('articles/verilog/verilog-fsm-design/verilog-fsm-design.html'),
              tags: ['FSM', '状态机']
            }
          ]
        },
        {
          id: 'simulation',
          title: '仿真与调试',
          desc: '用 Testbench、自检查和波形先把问题留在上板之前。',
          articles: [
            {
              title: 'Verilog · Testbench仿真与调试',
              desc: 'Testbench / 时钟复位 / task / $display / VCD / 自检查 / 上板调试 · 先仿真再上板',
              href: withVersion('articles/verilog/verilog-testbench-debug/verilog-testbench-debug.html'),
              tags: ['Testbench', '仿真']
            }
          ]
        }
      ]
    },
    {
      id: 'windows',
      title: 'Windows装机专题',
      shortTitle: 'Win',
      desc: '围绕 U 盘、PXE、镜像、驱动和引导修复的装机记录。',
      children: [
        {
          id: 'uqitong',
          title: '优启通U盘装机',
          desc: '手动重装 Win10 / Win11 的 U 盘启动盘和 PE 流程。',
          articles: [
            {
              title: '优启通 · U盘启动盘与Windows重装教程',
              desc: 'U盘启动盘 / 进入PE / 原版ISO / 分区 / 引导修复 / 驱动处理 · 适合手动重装 Win10 / Win11',
              href: withVersion('articles/windows/uqitong-usb-win-install/uqitong-usb-win-install.html'),
              tags: ['优启通', 'U盘启动盘']
            }
          ]
        },
        {
          id: 'iventoy',
          title: 'iVentoy PXE装机',
          desc: 'PXE 启动安装 Windows 时的镜像和网卡驱动处理。',
          articles: [
            {
              title: 'iVentoy · PXE安装Windows与网卡驱动处理',
              desc: 'PXE启动 / 原版ISO / boot.wim / install.wim / USB转网口 / 注入网卡驱动 · 解决安装环境没网问题',
              href: withVersion('articles/windows/iventoy-pxe-win-install/iventoy-pxe-win-install.html'),
              tags: ['iVentoy', 'PXE装机']
            }
          ]
        }
      ]
    },
    {
      id: 'linux',
      title: 'Linux专题',
      shortTitle: 'Linux',
      desc: '覆盖 Linux 基础、进程内存、服务部署、板级调试和系统构建。',
      children: [
        {
          id: 'basic',
          title: '基础与文件系统',
          desc: '建立嵌入式 Linux 调试常用命令和目录结构基础。',
          articles: [
            {
              title: 'Linux · 基础命令与文件系统',
              desc: '目录结构 / 权限 / grep / find / tar / scp / /proc / /sys · 建立嵌入式 Linux 调试基础',
              href: withVersion('articles/linux/linux-basic-filesystem/linux-basic-filesystem.html'),
              tags: ['Linux', '文件系统']
            }
          ]
        },
        {
          id: 'process',
          title: '进程与内存',
          desc: '面向用户态程序排错的进程、线程和内存工具整理。',
          articles: [
            {
              title: 'Linux · 进程、线程与内存管理',
              desc: 'process / thread / maps / fd / signal / strace / core dump / gdb · 面向用户态程序排错',
              href: withVersion('articles/linux/linux-process-memory-thread/linux-process-memory-thread.html'),
              tags: ['process', 'strace']
            }
          ]
        },
        {
          id: 'shell',
          title: 'Shell与服务',
          desc: '适合部署、日志和开机自启的 Shell 与 systemd 记录。',
          articles: [
            {
              title: 'Linux · Shell 脚本与 systemd 服务',
              desc: 'Shell / 变量 / 重定向 / 日志 / crontab / systemd / journalctl · 适合部署和开机自启',
              href: withVersion('articles/linux/linux-shell-systemd/linux-shell-systemd.html'),
              tags: ['Shell', 'systemd']
            }
          ]
        },
        {
          id: 'embedded',
          title: '嵌入式调试',
          desc: '面向板级调试的设备树、内核模块和远程调试整理。',
          articles: [
            {
              title: '嵌入式 Linux · 驱动与系统调试',
              desc: '设备树 / dmesg / sysfs / procfs / 内核模块 / 交叉编译 / gdbserver · 面向板级调试',
              href: withVersion('articles/linux/linux-embedded-debug/linux-embedded-debug.html'),
              tags: ['设备树', '板级调试']
            }
          ]
        },
        {
          id: 'uboot',
          title: 'U-Boot构建',
          desc: '梳理 Bootloader 构建、启动参数和镜像组成。',
          articles: [
            {
              title: 'U-Boot · 组成与构建流程',
              desc: 'ROM Code / SPL / U-Boot proper / defconfig / bootcmd / bootargs / u-boot.bin · 梳理 Bootloader 构建和启动参数',
              href: withVersion('articles/linux/uboot-structure-build/uboot-structure-build.html'),
              tags: ['U-Boot', 'Bootloader']
            }
          ]
        },
        {
          id: 'kernel',
          title: 'Kernel构建',
          desc: '面向内核和驱动构建的 Kconfig、镜像和模块记录。',
          articles: [
            {
              title: 'Linux Kernel · 组成与构建流程',
              desc: 'Kconfig / defconfig / Image / zImage / dtb / modules / System.map / vmlinux · 面向内核和驱动构建',
              href: withVersion('articles/linux/kernel-structure-build/kernel-structure-build.html'),
              tags: ['Kernel', 'Kconfig']
            }
          ]
        },
        {
          id: 'rootfs',
          title: '文件系统构建',
          desc: '梳理 BusyBox、Buildroot、Ubuntu Base 和 rootfs 镜像。',
          articles: [
            {
              title: 'RootFS · 根文件系统组成与构建',
              desc: 'BusyBox / Buildroot / Ubuntu Base / init / devtmpfs / rootfs.ext4 / squashfs · 梳理用户态文件系统构建',
              href: withVersion('articles/linux/rootfs-structure-build/rootfs-structure-build.html'),
              tags: ['RootFS', 'Buildroot']
            }
          ]
        }
      ]
    },
    {
      id: 'freertos',
      title: 'FreeRTOS专题',
      shortTitle: 'RTOS',
      desc: '整理任务调度、任务管理、队列同步、定时器和调试经验。',
      children: [
        {
          id: 'scheduler',
          title: '调度基础',
          desc: '建立 FreeRTOS 任务状态、抢占式调度和 Tick 基础认知。',
          articles: [
            {
              title: 'FreeRTOS · 基础概念与调度机制',
              desc: 'RTOS / 任务状态 / 抢占式调度 / 时间片 / Tick / 中断优先级 · 建立 FreeRTOS 整体认知',
              href: withVersion('articles/freertos/freertos-basic-scheduler/freertos-basic-scheduler.html'),
              tags: ['FreeRTOS', '调度']
            }
          ]
        },
        {
          id: 'task',
          title: '任务管理',
          desc: '适合嵌入式任务拆分设计的任务创建和栈空间记录。',
          articles: [
            {
              title: 'FreeRTOS · 任务管理与栈空间',
              desc: 'xTaskCreate / 任务优先级 / vTaskDelayUntil / 任务栈 / 栈水位检测 · 适合嵌入式任务拆分设计',
              href: withVersion('articles/freertos/freertos-task-management/freertos-task-management.html'),
              tags: ['任务管理', '任务栈']
            }
          ]
        },
        {
          id: 'ipc',
          title: '队列与同步',
          desc: '梳理任务间通信和共享资源保护。',
          articles: [
            {
              title: 'FreeRTOS · 队列、信号量与互斥锁',
              desc: 'Queue / Semaphore / Mutex / FromISR / 任务通知 / 优先级继承 · 梳理任务间通信和共享资源保护',
              href: withVersion('articles/freertos/freertos-ipc-sync/freertos-ipc-sync.html'),
              tags: ['队列', '互斥锁']
            }
          ]
        },
        {
          id: 'timer',
          title: '定时器与调试',
          desc: '围绕软件定时器、内存、栈溢出检测和运行统计排错。',
          articles: [
            {
              title: 'FreeRTOS · 软件定时器、内存与调试',
              desc: 'Software Timer / heap_4 / 静态创建 / 栈溢出检测 / vTaskList / 运行统计 · 面向工程排错',
              href: withVersion('articles/freertos/freertos-timer-memory-debug/freertos-timer-memory-debug.html'),
              tags: ['软件定时器', '调试']
            }
          ]
        }
      ]
    },
    {
      id: 'mcu',
      title: 'MCU',
      shortTitle: 'MCU',
      desc: '按厂商和芯片系列整理单片机资料、调试接口和工程笔记。',
      children: [
        {
          id: 'st',
          title: 'ST',
          desc: 'STM32F103、STM32F407 相关资料暂未发布。',
          placeholders: ['STM32F103', 'STM32F407'],
          articles: []
        },
        {
          id: 'wh',
          title: '武汉芯源半导体',
          desc: 'CW32 外设采样、PWM 和控制类项目记录。',
          articles: [
            {
              title: 'CW32L011K8U6 · NTC 热敏电阻采集与 PWM 频率输出',
              desc: 'ARM Cortex-M0+ · ADC 多通道采样 / NTC 阻值换算 / GTIM2 PWM 输出',
              href: withVersion('articles/mcu/cw32l011-ntc-adc-pwm/cw32l011-ntc-adc-pwm.html'),
              tags: ['CW32L011', 'ADC', 'PWM']
            }
          ]
        },
        {
          id: 'microchip',
          title: 'Microchip',
          desc: 'PIC16 数据手册、ICSP 和存储器编程规范整理。',
          articles: [
            {
              title: 'PIC16F18854 · 数据手册资料整理',
              desc: 'Microchip PIC16 · 中断 / PPS / PWM / Timer / CCP / CLC · 已整理模块资料',
              href: withVersion('articles/mcu/pic16f18854-datasheet-notes/pic16f18854-datasheet-notes.html'),
              tags: ['PIC16F18854', '数据手册']
            },
            {
              title: 'PIC16(L)F188XX · ICSP 存储器编程',
              desc: 'Microchip PIC16 · ICSP / SPI / NVM / EEPROM · 已整理存储器编程规范',
              href: withVersion('articles/mcu/pic16f188xx-memory-programming/pic16f188xx-memory-programming.html'),
              tags: ['PIC16', 'ICSP', 'NVM']
            }
          ]
        },
        {
          id: 'silicon-labs',
          title: 'Silicon Labs',
          desc: 'EFM8 开发笔记和 C2 接口烧写流程整理。',
          articles: [
            {
              title: 'EFM8BB10F8I-A-QFN20 · 开发笔记',
              desc: 'Silicon Labs 8051 / CIP-51 · C2 调试 / I/O / PCA / Timer / ADC · 已整理开发笔记',
              href: withVersion('articles/mcu/efm8bb10f8i-qfn20-development-notes/efm8bb10f8i-qfn20-development-notes.html'),
              tags: ['EFM8', '8051', 'C2 Debug']
            },
            {
              title: 'ESP32 · C2 接口模拟烧写 EFM8 Flash',
              desc: 'ESP32-S3 GPIO Bit-Bang · C2CK / C2D 时序 · 擦除 / 写入 / 读回校验',
              href: withVersion('articles/mcu/esp32-c2-efm8-flash-programming/esp32-c2-efm8-flash-programming.html'),
              tags: ['ESP32-S3', 'C2', 'Flash']
            }
          ]
        },
        {
          id: 'espressif',
          title: 'Espressif',
          desc: 'ESP32、ESP32-S3、ESP32-P4 相关资料暂未发布。',
          placeholders: ['ESP32', 'ESP32-S3', 'ESP32-P4'],
          articles: []
        },
        {
          id: 'xilinx',
          title: 'Xilinx',
          desc: 'MicroBlaze 相关资料暂未发布。',
          placeholders: ['MicroBlaze'],
          articles: []
        }
      ]
    },
    {
      id: 'soc',
      title: 'SOC',
      shortTitle: 'SOC',
      desc: '按 SoC 平台整理板级 Linux、驱动接口和系统集成记录。',
      children: [
        {
          id: 'orbit',
          title: '欧比特宇航科技',
          desc: '玉龙810A 相关资料暂未发布。',
          placeholders: ['玉龙810A'],
          articles: []
        },
        {
          id: 'rockchip',
          title: '瑞芯微电子',
          desc: 'RK3568 平台 USB Gadget、SPI 和 spidev 调试记录。',
          articles: [
            {
              title: 'RK3568 · USB Ethernet Gadget',
              desc: 'Linux 4.19 / USB Gadget / RNDIS / Ubuntu Base 22 · 已整理虚拟网卡配置记录',
              href: withVersion('articles/soc/rk3568-usb-ethernet-gadget/rk3568-usb-ethernet-gadget.html'),
              tags: ['RK3568', 'USB Gadget']
            },
            {
              title: 'RK3568 · SPI / spidev',
              desc: 'Linux 5.10 / SPI / spidev / Ubuntu Base 22 · 已整理 SPI 功能调试记录',
              href: withVersion('articles/soc/rk3568-spi-spidev/rk3568-spi-spidev.html'),
              tags: ['RK3568', 'SPI', 'spidev']
            }
          ]
        }
      ]
    },
    {
      id: 'fpga',
      title: 'FPGA',
      shortTitle: 'FPGA',
      desc: '按 FPGA 厂商和器件整理 HDL、IP、传感器接口和板级验证记录。',
      children: [
        {
          id: 'microchip',
          title: 'Microchip',
          desc: 'SmartFusion2 相关资料暂未发布。',
          placeholders: ['SmartFusion2'],
          articles: []
        },
        {
          id: 'lattice',
          title: 'Lattice',
          desc: 'MachXO2 相关资料暂未发布。',
          placeholders: ['MachXO2'],
          articles: []
        },
        {
          id: 'anlogic',
          title: '安路科技',
          desc: '基于 Anlogic EF2L45LG144B 的 IIC、CRC 和 BRAM 实践。',
          articles: [
            {
              title: 'AHT20 · IIC / CRC8 / Verilog',
              desc: '基于 Anlogic EF2L45LG144B 实现 IIC 主机、AHT20 温湿度读取、CRC8 校验和数据滤波',
              href: withVersion('articles/fpga/aht20-iic-verilog/aht20-iic-verilog.html'),
              tags: ['AHT20', 'IIC', 'CRC8']
            },
            {
              title: 'EF2L45 · Single Port RAM',
              desc: '基于 Anlogic EF2L45LG144B 的 IP Generator 配置单口 BRAM，完成 8bit x 200 深度 RAM 的写入、读出和 Verilog 自检',
              href: withVersion('articles/fpga/ef2-single-port-ram/ef2-single-port-ram.html'),
              tags: ['EF2L45', 'BRAM']
            }
          ]
        }
      ]
    },
    {
      id: 'gui',
      title: 'GUI',
      shortTitle: 'GUI',
      desc: '面向嵌入式图形界面工具、屏幕模组和交互开发的资料入口。',
      children: [
        {
          id: 'nxp',
          title: 'NXP',
          desc: 'GUI Guider 相关资料暂未发布。',
          placeholders: ['GUI Guider'],
          articles: []
        },
        {
          id: 'dfc',
          title: '广州大彩',
          desc: 'DC10600M070 相关资料暂未发布。',
          placeholders: ['DC10600M070'],
          articles: []
        }
      ]
    },
    {
      id: 'host',
      title: '上位机',
      shortTitle: 'Host',
      desc: '整理无线通信客户端、调试配置工具和远程开发链路。',
      children: [
        {
          id: 'wireless',
          title: '无线通信客户端',
          desc: '无线通信客户端资料暂未发布。',
          placeholders: ['无线通信客户端'],
          articles: []
        },
        {
          id: 'debug',
          title: '调试与配置工具',
          desc: '参数配置、数据查看、设备控制和远程调试工具记录。',
          articles: [
            {
              title: '调试上位机',
              desc: '参数配置、数据查看、设备控制 · VS Code 远程调试 Linux C/C++ 程序',
              href: withVersion('articles/host/windows-vscode-remote-linux-cpp-debug/windows-vscode-remote-linux-cpp-debug.html'),
              tags: ['VS Code', '远程调试']
            }
          ]
        }
      ]
    },
    {
      id: 'about',
      title: '关于本站',
      shortTitle: 'About',
      desc: '本网站用于沉淀项目经验、调试记录、技术文章和工程工具。',
      content: [
        '本网站用于沉淀项目经验、调试记录、技术文章和工程工具。',
        '后续会按具体芯片型号、开发平台和工程方向持续补充文章。'
      ],
      children: []
    }
  ];

  window.siteMap = siteMap;
})();
