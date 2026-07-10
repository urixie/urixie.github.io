(function () {
  const stylesheet = document.querySelector('link[href*="assets/css/style.css"]');
  const cacheVersion = stylesheet
    ? new URL(stylesheet.href, window.location.href).searchParams.get('v')
    : '';
  const withVersion = path => cacheVersion ? `${path}?v=${cacheVersion}` : path;

  const siteMap = [
    {
      id: 'foundation',
      title: '嵌入式基础',
      shortTitle: 'Base',
      desc: '沉淀跨平台、跨芯片通用的 C 语言、内存模型、数据组织、编译调试和工程规范。',
      children: [
        {
          id: 'c-basic',
          title: 'C语言基础',
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
          id: 'pointer-memory',
          title: '指针与内存',
          desc: '梳理 C 语言中最容易出错的指针、数组、栈、堆和数据存储问题。',
          articles: [
            {
              title: 'C语言 · 指针与内存模型',
              desc: '数组与指针 / 指针函数 / 函数指针 / 栈 / 堆 / 越界访问 · 梳理 C 语言最容易出错的内存问题',
              href: withVersion('articles/c/c-pointer-memory/c-pointer-memory.html'),
              tags: ['指针', '内存模型']
            },
            {
              title: 'C语言 · 数据存储与指针',
              desc: '大小端 / 有符号与无符号 / 数据对齐 / size_t / typedef / enum / 数组与指针 / 二维指针 / void',
              href: withVersion('articles/c/c-data-storage-pointer/c-data-storage-pointer.html'),
              tags: ['数据存储', '数据对齐']
            },
            {
              title: 'C语言 · 内存堆栈管理',
              desc: '进程 / 栈 / 堆 / mmap / 内存泄漏 / core dump / mprotect / Valgrind · 面向嵌入式 Linux 和 C 工程排错',
              href: withVersion('articles/c/c-stack-heap-memory/c-stack-heap-memory.html'),
              tags: ['栈', '堆', 'Valgrind']
            }
          ]
        },
        {
          id: 'data-structure',
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
          id: 'embedded-c',
          title: '嵌入式C实践',
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
          id: 'debug-engineering',
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
      id: 'mcu',
      title: 'MCU开发',
      shortTitle: 'MCU',
      desc: '按单片机通用外设、厂商系列、调试接口和量产烧写流程整理 MCU 工程经验。',
      children: [
        {
          id: 'common',
          title: '通用基础',
          desc: 'GPIO、Timer、ADC、UART、SPI、IIC、Flash 和 Bootloader 相关内容后续补充。',
          placeholders: ['GPIO', 'Timer', 'ADC', 'UART/SPI/IIC', 'Flash', 'Bootloader'],
          articles: [
            {
              title: 'ARM Cortex-M3 与 Cortex-M4 架构详解',
              desc: 'ARMv7-M · 寄存器模型 · 运行模式 · 存储映射 · NVIC 中断 · DSP/FPU · MPU · 调试组件',
              href: withVersion('articles/mcu/mcu/arm-cortex-m3-m4/arm-cortex-m3-m4.html'),
              tags: ['ARM', 'Cortex-M3', 'Cortex-M4', '架构']
            }
          ]
        },
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
        }
      ]
    },
    {
      id: 'fpga',
      title: 'FPGA开发',
      shortTitle: 'FPGA',
      desc: '以 FPGA 工程为主线，把 HDL 基础、仿真验证、时序约束、接口实践和厂商差异放在同一知识域内整理。',
      children: [
        {
          id: 'hdl-basic',
          title: 'HDL基础',
          desc: 'Verilog 是 FPGA 开发的基础能力，集中整理语法、电路行为、组合逻辑、时序逻辑和状态机。',
          articles: [
            {
              title: 'Verilog · 基础语法与硬件描述思维',
              desc: 'module / wire / reg / assign / always / 阻塞赋值 / 非阻塞赋值 / parameter · 从硬件角度理解语法',
              href: withVersion('articles/verilog/verilog-basic-syntax/verilog-basic-syntax.html'),
              tags: ['Verilog', '基础语法']
            },
            {
              title: 'Verilog · 组合逻辑与时序逻辑',
              desc: '组合逻辑 / latch / 寄存器 / 复位 / 计数器 / 边沿检测 / 流水线 · 区分电路行为和代码写法',
              href: withVersion('articles/verilog/verilog-combinational-sequential/verilog-combinational-sequential.html'),
              tags: ['组合逻辑', '时序逻辑']
            },
            {
              title: 'Verilog · 状态机设计方法',
              desc: 'FSM / 状态编码 / 三段式状态机 / Moore / Mealy / default安全状态 · 适合协议和采样流程控制',
              href: withVersion('articles/verilog/verilog-fsm-design/verilog-fsm-design.html'),
              tags: ['FSM', '状态机']
            }
          ]
        },
        {
          id: 'verification',
          title: '仿真验证',
          desc: '用 Testbench、自检查和波形分析把问题尽量留在上板之前。',
          articles: [
            {
              title: 'Verilog · Testbench仿真与调试',
              desc: 'Testbench / 时钟复位 / task / $display / VCD / 自检查 / 上板调试 · 先仿真再上板',
              href: withVersion('articles/verilog/verilog-testbench-debug/verilog-testbench-debug.html'),
              tags: ['Testbench', '仿真']
            }
          ]
        },
        {
          id: 'timing',
          title: '时序与约束',
          desc: '时钟约束、IO 约束、跨时钟域和时序收敛相关内容后续补充。',
          placeholders: ['时钟约束', 'IO约束', 'CDC', '时序收敛'],
          articles: []
        },
        {
          id: 'interfaces',
          title: '接口与外设',
          desc: 'ADC、SPI、IIC、UART、FIFO、RAM 和数据缓存传输相关内容后续补充。',
          placeholders: ['ADC采集', 'SPI/IIC/UART', 'FIFO/RAM', '数据缓存'],
          articles: []
        },
        {
          id: 'xilinx',
          title: 'Xilinx',
          desc: 'Vivado、IP核、Block Design 和调试经验后续补充。',
          placeholders: ['Vivado', 'IP核', 'Block Design'],
          articles: []
        },
        {
          id: 'anlogic',
          title: '安路科技',
          desc: '基于 Anlogic EF2L45LG144B 的 IIC、CRC、BRAM、TD 软件和板级验证实践。',
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
        },
        {
          id: 'lattice',
          title: 'Lattice',
          desc: 'MachXO2、工具链和器件差异相关内容后续补充。',
          placeholders: ['MachXO2', '工具链', '器件差异'],
          articles: []
        },
        {
          id: 'microchip',
          title: 'Microchip FPGA',
          desc: 'SmartFusion2、Libero 和器件资料相关内容后续补充。',
          placeholders: ['SmartFusion2', 'Libero'],
          articles: []
        }
      ]
    },
    {
      id: 'soc-linux',
      title: 'SOC/Linux开发',
      shortTitle: 'SoC',
      desc: '把 Linux 基础、Bootloader、Kernel、RootFS、驱动调试和具体 SoC 平台放在同一条板级系统链路下整理。',
      children: [
        {
          id: 'linux-basic',
          title: 'Linux基础',
          desc: '建立嵌入式 Linux 调试常用命令、目录结构、进程内存和服务部署基础。',
          articles: [
            {
              title: 'Linux · 基础命令与文件系统',
              desc: '目录结构 / 权限 / grep / find / tar / scp / /proc / /sys · 建立嵌入式 Linux 调试基础',
              href: withVersion('articles/linux/linux-basic-filesystem/linux-basic-filesystem.html'),
              tags: ['Linux', '文件系统']
            },
            {
              title: 'Linux · 进程、线程与内存管理',
              desc: 'process / thread / maps / fd / signal / strace / core dump / gdb · 面向用户态程序排错',
              href: withVersion('articles/linux/linux-process-memory-thread/linux-process-memory-thread.html'),
              tags: ['process', 'strace']
            },
            {
              title: 'Linux · Shell 脚本与 systemd 服务',
              desc: 'Shell / 变量 / 重定向 / 日志 / crontab / systemd / journalctl · 适合部署和开机自启',
              href: withVersion('articles/linux/linux-shell-systemd/linux-shell-systemd.html'),
              tags: ['Shell', 'systemd']
            }
          ]
        },
        {
          id: 'boot-kernel-rootfs',
          title: '启动链路与系统构建',
          desc: '从 U-Boot、Kernel 到 RootFS 的构建流程和镜像组成。',
          articles: [
            {
              title: 'U-Boot · 组成与构建流程',
              desc: 'ROM Code / SPL / U-Boot proper / defconfig / bootcmd / bootargs / u-boot.bin · 梳理 Bootloader 构建和启动参数',
              href: withVersion('articles/linux/uboot-structure-build/uboot-structure-build.html'),
              tags: ['U-Boot', 'Bootloader']
            },
            {
              title: 'Linux Kernel · 组成与构建流程',
              desc: 'Kconfig / defconfig / Image / zImage / dtb / modules / System.map / vmlinux · 面向内核和驱动构建',
              href: withVersion('articles/linux/kernel-structure-build/kernel-structure-build.html'),
              tags: ['Kernel', 'Kconfig']
            },
            {
              title: 'RootFS · 根文件系统组成与构建',
              desc: 'BusyBox / Buildroot / Ubuntu Base / init / devtmpfs / rootfs.ext4 / squashfs · 梳理用户态文件系统构建',
              href: withVersion('articles/linux/rootfs-structure-build/rootfs-structure-build.html'),
              tags: ['RootFS', 'Buildroot']
            }
          ]
        },
        {
          id: 'driver-debug',
          title: '驱动与系统调试',
          desc: '设备树、dmesg、sysfs、procfs、内核模块、交叉编译和远程调试。',
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
          id: 'rockchip',
          title: 'Rockchip',
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
        },
        {
          id: 'other-soc',
          title: '其它SOC平台',
          desc: '欧比特玉龙810A、NXP、全志等平台内容后续补充。',
          placeholders: ['玉龙810A', 'NXP', '全志'],
          articles: []
        }
      ]
    },
    {
      id: 'realtime',
      title: '实时系统',
      shortTitle: 'RTOS',
      desc: '以实时系统为一级入口，当前集中整理 FreeRTOS，后续可扩展 RT-Thread、Zephyr 等系统。',
      children: [
        {
          id: 'freertos-basic',
          title: 'FreeRTOS基础',
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
          id: 'task-management',
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
          id: 'ipc-sync',
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
          id: 'timer-memory-debug',
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
      id: 'gui',
      title: '嵌入式GUI',
      shortTitle: 'GUI',
      desc: '面向嵌入式图形界面工具、屏幕模组、LVGL、GUI Guider 和串口屏交互开发的资料入口。',
      children: [
        {
          id: 'lvgl',
          title: 'LVGL',
          desc: 'LVGL 控件、布局、主题和屏幕交互相关内容后续补充。',
          placeholders: ['LVGL控件', '主题配色', '屏幕交互'],
          articles: []
        },
        {
          id: 'nxp',
          title: 'NXP GUI Guider',
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
      id: 'host-tools',
      title: '上位机与工具',
      shortTitle: 'Host',
      desc: '整理上位机技术栈、调试配置工具、数据查看、设备控制和远程开发链路。',
      children: [
        {
          id: 'tauri-rust',
          title: 'Rust/Tauri',
          desc: 'Rust/Tauri 上位机、文件解析、加密配置和设备通信内容后续补充。',
          placeholders: ['Rust/Tauri', '文件解析', '加密配置'],
          articles: []
        },
        {
          id: 'wireless-client',
          title: '无线通信客户端',
          desc: '无线通信客户端资料暂未发布。',
          placeholders: ['无线通信客户端'],
          articles: []
        },
        {
          id: 'debug-config',
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
      id: 'dev-tools',
      title: '开发环境与工具',
      shortTitle: 'Tools',
      desc: 'Windows 装机、PXE、U盘启动、开发环境搭建、Git/Codex/Claude Code 等工具经验。',
      children: [
        {
          id: 'windows-install',
          title: 'Windows装机',
          desc: '手动重装 Win10 / Win11 的 U 盘启动盘、PE、分区和引导修复流程。',
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
          id: 'pxe-iventoy',
          title: 'PXE/iVentoy',
          desc: 'PXE 启动安装 Windows 时的镜像和网卡驱动处理。',
          articles: [
            {
              title: 'iVentoy · PXE安装Windows与网卡驱动处理',
              desc: 'PXE启动 / 原版ISO / boot.wim / install.wim / USB转网口 / 注入网卡驱动 · 解决安装环境没网问题',
              href: withVersion('articles/windows/iventoy-pxe-win-install/iventoy-pxe-win-install.html'),
              tags: ['iVentoy', 'PXE装机']
            }
          ]
        },
        {
          id: 'coding-agent',
          title: 'AI与代码工具',
          desc: 'Git、Codex、Claude Code、远程开发和自动化工具相关内容后续补充。',
          placeholders: ['Git', 'Codex', 'Claude Code', '远程开发'],
          articles: []
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
