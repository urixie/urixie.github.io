function appendTagLinks(tagCloud, topic, tags) {
  if (!tagCloud || tagCloud.querySelector(`[data-topic="${topic}"]`)) return;

  tags.forEach(([text, href], index) => {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = text;
    if (index === 0) link.dataset.topic = topic;
    tagCloud.appendChild(link);
  });
}

function injectTopic(config) {
  const nav = document.querySelector('.nav#site-nav');
  const stackList = document.querySelector('#hardware-stack .stack-list');
  const tagCloud = document.querySelector('.tag-cloud');

  if (!nav || !stackList) return;
  if (document.querySelector(`#${config.groupId}`) || document.querySelector(`#${config.firstCardId}`)) return;

  const navGroup = document.createElement('div');
  navGroup.className = 'nav-group';
  navGroup.id = config.groupId;
  navGroup.innerHTML = `
    <button class="nav-group-toggle" type="button" aria-expanded="false">
      <span>${config.title}</span>
      <svg class="nav-group-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5"/></svg>
    </button>
    <div class="nav-group-items">
      ${config.navItems.map(item => `<a class="nav-sub" href="#${item.id}">${item.text}</a>`).join('')}
    </div>
  `;

  const navAnchor = document.querySelector('#mcu-group');
  if (navAnchor) {
    nav.insertBefore(navGroup, navAnchor);
  } else {
    nav.appendChild(navGroup);
  }

  const topicCard = document.createElement('article');
  topicCard.className = 'stack-card';
  topicCard.id = config.topicCardId || `${config.tagTopic}-topic`;
  topicCard.innerHTML = `<div class="post-meta">${config.title}</div>`;

  config.cards.forEach(card => {
    const category = document.createElement('div');
    category.className = 'platform-category';
    category.id = card.id;
    category.innerHTML = `
      <h4>${card.category}</h4>
      <div class="platform-items">
        <a class="platform-item" href="${card.href}">
          <strong>${card.strong}</strong>
          <span>${card.desc}</span>
        </a>
      </div>
    `;
    topicCard.appendChild(category);
  });

  const cardAnchor = document.querySelector('#c-struct') || document.querySelector('#mcu-st');
  if (cardAnchor) {
    cardAnchor.before(topicCard);
  } else {
    stackList.prepend(topicCard);
  }

  appendTagLinks(tagCloud, config.tagTopic, config.tags);
}

function consolidateStaticTopicCards(config) {
  const cards = config.cardIds
    .map(id => document.getElementById(id))
    .filter(Boolean);

  if (cards.length <= 1 || document.getElementById(config.topicCardId)) return;

  const topicCard = document.createElement('article');
  topicCard.className = 'stack-card';
  topicCard.id = config.topicCardId;
  topicCard.innerHTML = `<div class="post-meta">${config.title}</div>`;

  cards[0].before(topicCard);

  cards.forEach(card => {
    const originalId = card.id;
    const category = card.querySelector('.platform-category');

    if (category) {
      card.removeAttribute('id');
      category.id = originalId;
      topicCard.appendChild(category);
    }

    card.remove();
  });
}

const cacheVer = 'v=bb7d9a57684e';

injectTopic({
  title: 'Verilog专题',
  groupId: 'verilog-group',
  firstCardId: 'verilog-basic',
  topicCardId: 'verilog-topic-card',
  tagTopic: 'verilog',
  navItems: [
    { id: 'verilog-basic', text: '基础语法' },
    { id: 'verilog-logic', text: '组合与时序' },
    { id: 'verilog-fsm', text: '状态机设计' },
    { id: 'verilog-sim', text: '仿真与调试' }
  ],
  cards: [
    {
      id: 'verilog-basic',
      category: '基础语法',
      href: `articles/verilog/verilog-basic-syntax/verilog-basic-syntax.html?${cacheVer}`,
      strong: 'Verilog · 基础语法与硬件描述思维',
      desc: 'module / wire / reg / assign / always / 阻塞赋值 / 非阻塞赋值 / parameter · 从硬件角度理解语法'
    },
    {
      id: 'verilog-logic',
      category: '组合逻辑与时序逻辑',
      href: `articles/verilog/verilog-combinational-sequential/verilog-combinational-sequential.html?${cacheVer}`,
      strong: 'Verilog · 组合逻辑与时序逻辑',
      desc: '组合逻辑 / latch / 寄存器 / 复位 / 计数器 / 边沿检测 / 流水线 · 区分电路行为和代码写法'
    },
    {
      id: 'verilog-fsm',
      category: '状态机设计',
      href: `articles/verilog/verilog-fsm-design/verilog-fsm-design.html?${cacheVer}`,
      strong: 'Verilog · 状态机设计方法',
      desc: 'FSM / 状态编码 / 三段式状态机 / Moore / Mealy / default安全状态 · 适合协议和采样流程控制'
    },
    {
      id: 'verilog-sim',
      category: '仿真与调试',
      href: `articles/verilog/verilog-testbench-debug/verilog-testbench-debug.html?${cacheVer}`,
      strong: 'Verilog · Testbench仿真与调试',
      desc: 'Testbench / 时钟复位 / task / $display / VCD / 自检查 / 上板调试 · 先仿真再上板'
    }
  ],
  tags: [
    ['Verilog', `articles/verilog/verilog-basic-syntax/verilog-basic-syntax.html?${cacheVer}`],
    ['HDL', `articles/verilog/verilog-basic-syntax/verilog-basic-syntax.html?${cacheVer}`],
    ['module', `articles/verilog/verilog-basic-syntax/verilog-basic-syntax.html?${cacheVer}`],
    ['wire/reg', `articles/verilog/verilog-basic-syntax/verilog-basic-syntax.html?${cacheVer}`],
    ['组合逻辑', `articles/verilog/verilog-combinational-sequential/verilog-combinational-sequential.html?${cacheVer}`],
    ['时序逻辑', `articles/verilog/verilog-combinational-sequential/verilog-combinational-sequential.html?${cacheVer}`],
    ['状态机', `articles/verilog/verilog-fsm-design/verilog-fsm-design.html?${cacheVer}`],
    ['FSM', `articles/verilog/verilog-fsm-design/verilog-fsm-design.html?${cacheVer}`],
    ['Testbench', `articles/verilog/verilog-testbench-debug/verilog-testbench-debug.html?${cacheVer}`],
    ['仿真', `articles/verilog/verilog-testbench-debug/verilog-testbench-debug.html?${cacheVer}`]
  ]
});

injectTopic({
  title: 'Windows装机专题',
  groupId: 'windows-group',
  firstCardId: 'windows-uqitong',
  topicCardId: 'windows-topic-card',
  tagTopic: 'windows-install',
  navItems: [
    { id: 'windows-uqitong', text: '优启通U盘装机' },
    { id: 'windows-iventoy', text: 'iVentoy PXE装机' }
  ],
  cards: [
    {
      id: 'windows-uqitong',
      category: '优启通U盘装机',
      href: `articles/windows/uqitong-usb-win-install/uqitong-usb-win-install.html?${cacheVer}`,
      strong: '优启通 · U盘启动盘与Windows重装教程',
      desc: 'U盘启动盘 / 进入PE / 原版ISO / 分区 / 引导修复 / 驱动处理 · 适合手动重装 Win10 / Win11'
    },
    {
      id: 'windows-iventoy',
      category: 'iVentoy PXE装机',
      href: `articles/windows/iventoy-pxe-win-install/iventoy-pxe-win-install.html?${cacheVer}`,
      strong: 'iVentoy · PXE安装Windows与网卡驱动处理',
      desc: 'PXE启动 / 原版ISO / boot.wim / install.wim / USB转网口 / 注入网卡驱动 · 解决安装环境没网问题'
    }
  ],
  tags: [
    ['Windows装机', `articles/windows/uqitong-usb-win-install/uqitong-usb-win-install.html?${cacheVer}`],
    ['优启通', `articles/windows/uqitong-usb-win-install/uqitong-usb-win-install.html?${cacheVer}`],
    ['PE系统', `articles/windows/uqitong-usb-win-install/uqitong-usb-win-install.html?${cacheVer}`],
    ['U盘启动盘', `articles/windows/uqitong-usb-win-install/uqitong-usb-win-install.html?${cacheVer}`],
    ['iVentoy', `articles/windows/iventoy-pxe-win-install/iventoy-pxe-win-install.html?${cacheVer}`],
    ['PXE装机', `articles/windows/iventoy-pxe-win-install/iventoy-pxe-win-install.html?${cacheVer}`],
    ['boot.wim', `articles/windows/iventoy-pxe-win-install/iventoy-pxe-win-install.html?${cacheVer}`],
    ['网卡驱动', `articles/windows/iventoy-pxe-win-install/iventoy-pxe-win-install.html?${cacheVer}`]
  ]
});

injectTopic({
  title: 'Linux专题',
  groupId: 'linux-group',
  firstCardId: 'linux-basic',
  topicCardId: 'linux-topic-card',
  tagTopic: 'linux',
  navItems: [
    { id: 'linux-basic', text: '基础与文件系统' },
    { id: 'linux-process', text: '进程与内存' },
    { id: 'linux-shell', text: 'Shell与服务' },
    { id: 'linux-embedded', text: '嵌入式调试' },
    { id: 'linux-uboot', text: 'U-Boot构建' },
    { id: 'linux-kernel-build', text: 'Kernel构建' },
    { id: 'linux-rootfs-build', text: '文件系统构建' }
  ],
  cards: [
    {
      id: 'linux-basic',
      category: '基础与文件系统',
      href: `articles/linux/linux-basic-filesystem/linux-basic-filesystem.html?${cacheVer}`,
      strong: 'Linux · 基础命令与文件系统',
      desc: '目录结构 / 权限 / grep / find / tar / scp / /proc / /sys · 建立嵌入式 Linux 调试基础'
    },
    {
      id: 'linux-process',
      category: '进程与内存',
      href: `articles/linux/linux-process-memory-thread/linux-process-memory-thread.html?${cacheVer}`,
      strong: 'Linux · 进程、线程与内存管理',
      desc: 'process / thread / maps / fd / signal / strace / core dump / gdb · 面向用户态程序排错'
    },
    {
      id: 'linux-shell',
      category: 'Shell与服务',
      href: `articles/linux/linux-shell-systemd/linux-shell-systemd.html?${cacheVer}`,
      strong: 'Linux · Shell 脚本与 systemd 服务',
      desc: 'Shell / 变量 / 重定向 / 日志 / crontab / systemd / journalctl · 适合部署和开机自启'
    },
    {
      id: 'linux-embedded',
      category: '嵌入式调试',
      href: `articles/linux/linux-embedded-debug/linux-embedded-debug.html?${cacheVer}`,
      strong: '嵌入式 Linux · 驱动与系统调试',
      desc: '设备树 / dmesg / sysfs / procfs / 内核模块 / 交叉编译 / gdbserver · 面向板级调试'
    },
    {
      id: 'linux-uboot',
      category: 'U-Boot组成与构建',
      href: `articles/linux/uboot-structure-build/uboot-structure-build.html?${cacheVer}`,
      strong: 'U-Boot · 组成与构建流程',
      desc: 'ROM Code / SPL / U-Boot proper / defconfig / bootcmd / bootargs / u-boot.bin · 梳理 Bootloader 构建和启动参数'
    },
    {
      id: 'linux-kernel-build',
      category: 'Kernel组成与构建',
      href: `articles/linux/kernel-structure-build/kernel-structure-build.html?${cacheVer}`,
      strong: 'Linux Kernel · 组成与构建流程',
      desc: 'Kconfig / defconfig / Image / zImage / dtb / modules / System.map / vmlinux · 面向内核和驱动构建'
    },
    {
      id: 'linux-rootfs-build',
      category: '文件系统组成与构建',
      href: `articles/linux/rootfs-structure-build/rootfs-structure-build.html?${cacheVer}`,
      strong: 'RootFS · 根文件系统组成与构建',
      desc: 'BusyBox / Buildroot / Ubuntu Base / init / devtmpfs / rootfs.ext4 / squashfs · 梳理用户态文件系统构建'
    }
  ],
  tags: [
    ['Linux', `articles/linux/linux-basic-filesystem/linux-basic-filesystem.html?${cacheVer}`],
    ['/proc', `articles/linux/linux-basic-filesystem/linux-basic-filesystem.html?${cacheVer}`],
    ['/sys', `articles/linux/linux-basic-filesystem/linux-basic-filesystem.html?${cacheVer}`],
    ['strace', `articles/linux/linux-process-memory-thread/linux-process-memory-thread.html?${cacheVer}`],
    ['systemd', `articles/linux/linux-shell-systemd/linux-shell-systemd.html?${cacheVer}`],
    ['设备树', `articles/linux/linux-embedded-debug/linux-embedded-debug.html?${cacheVer}`],
    ['U-Boot', `articles/linux/uboot-structure-build/uboot-structure-build.html?${cacheVer}`],
    ['Kernel构建', `articles/linux/kernel-structure-build/kernel-structure-build.html?${cacheVer}`],
    ['RootFS', `articles/linux/rootfs-structure-build/rootfs-structure-build.html?${cacheVer}`],
    ['Buildroot', `articles/linux/rootfs-structure-build/rootfs-structure-build.html?${cacheVer}`]
  ]
});

injectTopic({
  title: 'FreeRTOS专题',
  groupId: 'freertos-group',
  firstCardId: 'freertos-basic',
  topicCardId: 'freertos-topic-card',
  tagTopic: 'freertos',
  navItems: [
    { id: 'freertos-basic', text: '基础与调度' },
    { id: 'freertos-task', text: '任务管理' },
    { id: 'freertos-ipc', text: '队列与同步' },
    { id: 'freertos-debug', text: '定时器与调试' }
  ],
  cards: [
    {
      id: 'freertos-basic',
      category: '基础与调度',
      href: `articles/freertos/freertos-basic-scheduler/freertos-basic-scheduler.html?${cacheVer}`,
      strong: 'FreeRTOS · 基础概念与调度机制',
      desc: 'RTOS / 任务状态 / 抢占式调度 / 时间片 / Tick / 中断优先级 · 建立 FreeRTOS 整体认知'
    },
    {
      id: 'freertos-task',
      category: '任务管理',
      href: `articles/freertos/freertos-task-management/freertos-task-management.html?${cacheVer}`,
      strong: 'FreeRTOS · 任务管理与栈空间',
      desc: 'xTaskCreate / 任务优先级 / vTaskDelayUntil / 任务栈 / 栈水位检测 · 适合嵌入式任务拆分设计'
    },
    {
      id: 'freertos-ipc',
      category: '队列与同步',
      href: `articles/freertos/freertos-ipc-sync/freertos-ipc-sync.html?${cacheVer}`,
      strong: 'FreeRTOS · 队列、信号量与互斥锁',
      desc: 'Queue / Semaphore / Mutex / FromISR / 任务通知 / 优先级继承 · 梳理任务间通信和共享资源保护'
    },
    {
      id: 'freertos-debug',
      category: '定时器与调试',
      href: `articles/freertos/freertos-timer-memory-debug/freertos-timer-memory-debug.html?${cacheVer}`,
      strong: 'FreeRTOS · 软件定时器、内存与调试',
      desc: 'Software Timer / heap_4 / 静态创建 / 栈溢出检测 / vTaskList / 运行统计 · 面向工程排错'
    }
  ],
  tags: [
    ['FreeRTOS', `articles/freertos/freertos-basic-scheduler/freertos-basic-scheduler.html?${cacheVer}`],
    ['RTOS', `articles/freertos/freertos-basic-scheduler/freertos-basic-scheduler.html?${cacheVer}`],
    ['任务调度', `articles/freertos/freertos-basic-scheduler/freertos-basic-scheduler.html?${cacheVer}`],
    ['任务栈', `articles/freertos/freertos-task-management/freertos-task-management.html?${cacheVer}`],
    ['队列', `articles/freertos/freertos-ipc-sync/freertos-ipc-sync.html?${cacheVer}`],
    ['信号量', `articles/freertos/freertos-ipc-sync/freertos-ipc-sync.html?${cacheVer}`],
    ['互斥锁', `articles/freertos/freertos-ipc-sync/freertos-ipc-sync.html?${cacheVer}`],
    ['软件定时器', `articles/freertos/freertos-timer-memory-debug/freertos-timer-memory-debug.html?${cacheVer}`]
  ]
});

consolidateStaticTopicCards({
  title: 'C语言专题',
  topicCardId: 'c-language-topic-card',
  cardIds: [
    'c-basic',
    'c-pointer',
    'c-data-storage',
    'c-stack-heap',
    'c-struct',
    'c-embedded',
    'c-debug'
  ]
});

const navLinks = document.querySelectorAll('.nav a');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const yearTargets = document.querySelectorAll('[data-current-year]');
const navGroupToggles = document.querySelectorAll('.nav-group-toggle');

yearTargets.forEach(target => {
  target.textContent = new Date().getFullYear();
});

function getWorkExperience(startYear, startMonth) {
  const now = new Date();
  const months = (now.getFullYear() - startYear) * 12 + (now.getMonth() - startMonth);
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return remainingMonths ? `${years}年${remainingMonths}个月` : `${years}年`;
}

document.querySelectorAll('#work-experience, #work-experience-about').forEach(target => {
  target.textContent = getWorkExperience(2022, 1);
});

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('is-open', !expanded);
  });
}

navGroupToggles.forEach(toggle => {
  const groupItems = toggle.parentElement.querySelector('.nav-group-items');

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    if (groupItems) {
      groupItems.classList.toggle('is-open', !expanded);
    }
  });
});

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    if (menuToggle && nav) {
      menuToggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
    }
  });
});

const sections = Array.from(navLinks)
  .map(link => {
    const href = link.getAttribute('href');
    return href && href.startsWith('#') ? document.querySelector(href) : null;
  })
  .filter(Boolean);

function updateActiveNav() {
  const current = sections
    .slice()
    .reverse()
    .find(section => window.scrollY >= section.offsetTop - 160);

  if (!current) return;

  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current.id}`);
  });
}

if (sections.length > 0) {
  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();
}

function normalizeHeadingId(index) {
  return `article-section-${index + 1}`;
}

function buildArticleNav() {
  const articleShell = document.querySelector('.article-page-shell');
  const article = document.querySelector('.article');
  const articleTopbar = document.querySelector('.article-topbar');

  if (!articleShell || !article) return;
  if (articleShell.querySelector('.article-sidebar')) return;

  const headings = Array.from(article.querySelectorAll('section h2'));
  if (headings.length === 0) return;

  headings.forEach((heading, index) => {
    const section = heading.closest('section');
    if (!section) return;

    if (!section.id) {
      section.id = normalizeHeadingId(index);
    }
  });

  const topbarLinks = articleTopbar
    ? Array.from(articleTopbar.querySelectorAll('a')).map(link => ({
        text: link.textContent.trim(),
        href: link.getAttribute('href')
      }))
    : [];

  articleTopbar?.remove();

  const articleSidebar = document.createElement('aside');
  articleSidebar.className = 'article-sidebar';
  articleSidebar.setAttribute('aria-label', '文章导航');

  const articleNavCard = document.createElement('div');
  articleNavCard.className = 'article-nav-card';

  const quickLinks = document.createElement('div');
  quickLinks.className = 'article-nav-actions';

  topbarLinks.forEach(item => {
    if (!item.href || !item.text) return;

    const a = document.createElement('a');
    a.href = item.href;
    a.textContent = item.text;
    quickLinks.appendChild(a);
  });

  const navTitle = document.createElement('div');
  navTitle.className = 'article-nav-title';
  navTitle.textContent = '文章目录';

  const articleNav = document.createElement('nav');
  articleNav.className = 'article-nav';

  headings.forEach((heading, index) => {
    const section = heading.closest('section');
    if (!section) return;

    const link = document.createElement('a');
    link.href = `#${section.id}`;
    link.textContent = heading.textContent.trim();

    if (index === 0) {
      link.classList.add('active');
    }

    articleNav.appendChild(link);
  });

  if (quickLinks.children.length > 0) {
    articleNavCard.appendChild(quickLinks);
  }

  articleNavCard.appendChild(navTitle);
  articleNavCard.appendChild(articleNav);
  articleSidebar.appendChild(articleNavCard);

  articleShell.insertBefore(articleSidebar, articleShell.firstElementChild);

  const articleNavLinks = Array.from(articleNav.querySelectorAll('a'));
  const articleSections = headings
    .map(heading => heading.closest('section'))
    .filter(Boolean);

  function updateActiveArticleNav() {
    const current = articleSections
      .slice()
      .reverse()
      .find(section => window.scrollY >= section.offsetTop - 170);

    if (!current) return;

    articleNavLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current.id}`);
    });
  }

  articleNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      articleNavLinks.forEach(item => item.classList.remove('active'));
      link.classList.add('active');
    });
  });

  window.addEventListener('scroll', updateActiveArticleNav, { passive: true });
  updateActiveArticleNav();
}

buildArticleNav();