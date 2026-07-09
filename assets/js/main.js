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

function injectWindowsTopic() {
  const nav = document.querySelector('.nav#site-nav');
  const stackList = document.querySelector('#hardware-stack .stack-list');
  const tagCloud = document.querySelector('.tag-cloud');

  if (!nav || !stackList) return;
  if (document.querySelector('#windows-group') || document.querySelector('#windows-uqitong')) return;

  const windowsNavGroup = document.createElement('div');
  windowsNavGroup.className = 'nav-group';
  windowsNavGroup.id = 'windows-group';
  windowsNavGroup.innerHTML = `
    <button class="nav-group-toggle" type="button" aria-expanded="false">
      <span>Windows装机专题</span>
      <svg class="nav-group-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5"/></svg>
    </button>
    <div class="nav-group-items">
      <a class="nav-sub" href="#windows-uqitong">优启通U盘装机</a>
      <a class="nav-sub" href="#windows-iventoy">iVentoy PXE装机</a>
    </div>
  `;

  const mcuGroup = document.querySelector('#mcu-group');
  if (mcuGroup) {
    nav.insertBefore(windowsNavGroup, mcuGroup);
  } else {
    nav.appendChild(windowsNavGroup);
  }

  const windowsCards = document.createElement('template');
  windowsCards.innerHTML = `
    <article class="stack-card" id="windows-uqitong">
      <div class="post-meta">Windows装机专题</div>
      <div class="platform-category">
        <h4>优启通U盘装机</h4>
        <div class="platform-items">
          <a class="platform-item" href="articles/windows/uqitong-usb-win-install/uqitong-usb-win-install.html?v=bb7d9a57684e">
            <strong>优启通 · U盘启动盘与Windows重装教程</strong>
            <span>U盘启动盘 / 进入PE / 原版ISO / 分区 / 引导修复 / 驱动处理 · 适合手动重装 Win10 / Win11</span>
          </a>
        </div>
      </div>
    </article>

    <article class="stack-card" id="windows-iventoy">
      <div class="post-meta">Windows装机专题</div>
      <div class="platform-category">
        <h4>iVentoy PXE装机</h4>
        <div class="platform-items">
          <a class="platform-item" href="articles/windows/iventoy-pxe-win-install/iventoy-pxe-win-install.html?v=bb7d9a57684e">
            <strong>iVentoy · PXE安装Windows与网卡驱动处理</strong>
            <span>PXE启动 / 原版ISO / boot.wim / install.wim / USB转网口 / 注入网卡驱动 · 解决安装环境没网问题</span>
          </a>
        </div>
      </div>
    </article>
  `;

  const linuxCard = document.querySelector('#linux-basic');
  const freeRtosCard = document.querySelector('#freertos-basic');
  const cStructCard = document.querySelector('#c-struct');
  if (linuxCard) {
    linuxCard.before(windowsCards.content);
  } else if (freeRtosCard) {
    freeRtosCard.before(windowsCards.content);
  } else if (cStructCard) {
    cStructCard.before(windowsCards.content);
  } else {
    stackList.prepend(windowsCards.content);
  }

  appendTagLinks(tagCloud, 'windows-install', [
    ['Windows装机', 'articles/windows/uqitong-usb-win-install/uqitong-usb-win-install.html?v=bb7d9a57684e'],
    ['优启通', 'articles/windows/uqitong-usb-win-install/uqitong-usb-win-install.html?v=bb7d9a57684e'],
    ['PE系统', 'articles/windows/uqitong-usb-win-install/uqitong-usb-win-install.html?v=bb7d9a57684e'],
    ['U盘启动盘', 'articles/windows/uqitong-usb-win-install/uqitong-usb-win-install.html?v=bb7d9a57684e'],
    ['重装Win10', 'articles/windows/uqitong-usb-win-install/uqitong-usb-win-install.html?v=bb7d9a57684e'],
    ['重装Win11', 'articles/windows/uqitong-usb-win-install/uqitong-usb-win-install.html?v=bb7d9a57684e'],
    ['iVentoy', 'articles/windows/iventoy-pxe-win-install/iventoy-pxe-win-install.html?v=bb7d9a57684e'],
    ['PXE装机', 'articles/windows/iventoy-pxe-win-install/iventoy-pxe-win-install.html?v=bb7d9a57684e'],
    ['boot.wim', 'articles/windows/iventoy-pxe-win-install/iventoy-pxe-win-install.html?v=bb7d9a57684e'],
    ['install.wim', 'articles/windows/iventoy-pxe-win-install/iventoy-pxe-win-install.html?v=bb7d9a57684e'],
    ['网卡驱动', 'articles/windows/iventoy-pxe-win-install/iventoy-pxe-win-install.html?v=bb7d9a57684e'],
    ['USB转网口', 'articles/windows/iventoy-pxe-win-install/iventoy-pxe-win-install.html?v=bb7d9a57684e']
  ]);
}

function injectLinuxTopic() {
  const nav = document.querySelector('.nav#site-nav');
  const stackList = document.querySelector('#hardware-stack .stack-list');
  const tagCloud = document.querySelector('.tag-cloud');

  if (!nav || !stackList) return;
  if (document.querySelector('#linux-group') || document.querySelector('#linux-basic')) return;

  const linuxNavGroup = document.createElement('div');
  linuxNavGroup.className = 'nav-group';
  linuxNavGroup.id = 'linux-group';
  linuxNavGroup.innerHTML = `
    <button class="nav-group-toggle" type="button" aria-expanded="false">
      <span>Linux专题</span>
      <svg class="nav-group-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5"/></svg>
    </button>
    <div class="nav-group-items">
      <a class="nav-sub" href="#linux-basic">基础与文件系统</a>
      <a class="nav-sub" href="#linux-process">进程与内存</a>
      <a class="nav-sub" href="#linux-shell">Shell与服务</a>
      <a class="nav-sub" href="#linux-embedded">嵌入式调试</a>
      <a class="nav-sub" href="#linux-uboot">U-Boot构建</a>
      <a class="nav-sub" href="#linux-kernel-build">Kernel构建</a>
      <a class="nav-sub" href="#linux-rootfs-build">文件系统构建</a>
    </div>
  `;

  const mcuGroup = document.querySelector('#mcu-group');
  if (mcuGroup) {
    nav.insertBefore(linuxNavGroup, mcuGroup);
  } else {
    nav.appendChild(linuxNavGroup);
  }

  const linuxCards = document.createElement('template');
  linuxCards.innerHTML = `
    <article class="stack-card" id="linux-basic">
      <div class="post-meta">Linux专题</div>
      <div class="platform-category">
        <h4>基础与文件系统</h4>
        <div class="platform-items">
          <a class="platform-item" href="articles/linux/linux-basic-filesystem/linux-basic-filesystem.html?v=bb7d9a57684e">
            <strong>Linux · 基础命令与文件系统</strong>
            <span>目录结构 / 权限 / grep / find / tar / scp / /proc / /sys · 建立嵌入式 Linux 调试基础</span>
          </a>
        </div>
      </div>
    </article>

    <article class="stack-card" id="linux-process">
      <div class="post-meta">Linux专题</div>
      <div class="platform-category">
        <h4>进程与内存</h4>
        <div class="platform-items">
          <a class="platform-item" href="articles/linux/linux-process-memory-thread/linux-process-memory-thread.html?v=bb7d9a57684e">
            <strong>Linux · 进程、线程与内存管理</strong>
            <span>process / thread / maps / fd / signal / strace / core dump / gdb · 面向用户态程序排错</span>
          </a>
        </div>
      </div>
    </article>

    <article class="stack-card" id="linux-shell">
      <div class="post-meta">Linux专题</div>
      <div class="platform-category">
        <h4>Shell与服务</h4>
        <div class="platform-items">
          <a class="platform-item" href="articles/linux/linux-shell-systemd/linux-shell-systemd.html?v=bb7d9a57684e">
            <strong>Linux · Shell 脚本与 systemd 服务</strong>
            <span>Shell / 变量 / 重定向 / 日志 / crontab / systemd / journalctl · 适合部署和开机自启</span>
          </a>
        </div>
      </div>
    </article>

    <article class="stack-card" id="linux-embedded">
      <div class="post-meta">Linux专题</div>
      <div class="platform-category">
        <h4>嵌入式调试</h4>
        <div class="platform-items">
          <a class="platform-item" href="articles/linux/linux-embedded-debug/linux-embedded-debug.html?v=bb7d9a57684e">
            <strong>嵌入式 Linux · 驱动与系统调试</strong>
            <span>设备树 / dmesg / sysfs / procfs / 内核模块 / 交叉编译 / gdbserver · 面向板级调试</span>
          </a>
        </div>
      </div>
    </article>

    <article class="stack-card" id="linux-uboot">
      <div class="post-meta">Linux专题</div>
      <div class="platform-category">
        <h4>U-Boot组成与构建</h4>
        <div class="platform-items">
          <a class="platform-item" href="articles/linux/uboot-structure-build/uboot-structure-build.html?v=bb7d9a57684e">
            <strong>U-Boot · 组成与构建流程</strong>
            <span>ROM Code / SPL / U-Boot proper / defconfig / bootcmd / bootargs / u-boot.bin · 梳理 Bootloader 构建和启动参数</span>
          </a>
        </div>
      </div>
    </article>

    <article class="stack-card" id="linux-kernel-build">
      <div class="post-meta">Linux专题</div>
      <div class="platform-category">
        <h4>Kernel组成与构建</h4>
        <div class="platform-items">
          <a class="platform-item" href="articles/linux/kernel-structure-build/kernel-structure-build.html?v=bb7d9a57684e">
            <strong>Linux Kernel · 组成与构建流程</strong>
            <span>Kconfig / defconfig / Image / zImage / dtb / modules / System.map / vmlinux · 面向内核和驱动构建</span>
          </a>
        </div>
      </div>
    </article>

    <article class="stack-card" id="linux-rootfs-build">
      <div class="post-meta">Linux专题</div>
      <div class="platform-category">
        <h4>文件系统组成与构建</h4>
        <div class="platform-items">
          <a class="platform-item" href="articles/linux/rootfs-structure-build/rootfs-structure-build.html?v=bb7d9a57684e">
            <strong>RootFS · 根文件系统组成与构建</strong>
            <span>BusyBox / Buildroot / Ubuntu Base / init / devtmpfs / rootfs.ext4 / squashfs · 梳理用户态文件系统构建</span>
          </a>
        </div>
      </div>
    </article>
  `;

  const freeRtosCard = document.querySelector('#freertos-basic');
  const cStructCard = document.querySelector('#c-struct');
  if (freeRtosCard) {
    freeRtosCard.before(linuxCards.content);
  } else if (cStructCard) {
    cStructCard.before(linuxCards.content);
  } else {
    stackList.prepend(linuxCards.content);
  }

  appendTagLinks(tagCloud, 'linux', [
    ['Linux', 'articles/linux/linux-basic-filesystem/linux-basic-filesystem.html?v=bb7d9a57684e'],
    ['文件系统', 'articles/linux/linux-basic-filesystem/linux-basic-filesystem.html?v=bb7d9a57684e'],
    ['/proc', 'articles/linux/linux-basic-filesystem/linux-basic-filesystem.html?v=bb7d9a57684e'],
    ['/sys', 'articles/linux/linux-basic-filesystem/linux-basic-filesystem.html?v=bb7d9a57684e'],
    ['进程', 'articles/linux/linux-process-memory-thread/linux-process-memory-thread.html?v=bb7d9a57684e'],
    ['线程', 'articles/linux/linux-process-memory-thread/linux-process-memory-thread.html?v=bb7d9a57684e'],
    ['strace', 'articles/linux/linux-process-memory-thread/linux-process-memory-thread.html?v=bb7d9a57684e'],
    ['systemd', 'articles/linux/linux-shell-systemd/linux-shell-systemd.html?v=bb7d9a57684e'],
    ['Shell脚本', 'articles/linux/linux-shell-systemd/linux-shell-systemd.html?v=bb7d9a57684e'],
    ['设备树', 'articles/linux/linux-embedded-debug/linux-embedded-debug.html?v=bb7d9a57684e'],
    ['dmesg', 'articles/linux/linux-embedded-debug/linux-embedded-debug.html?v=bb7d9a57684e'],
    ['gdbserver', 'articles/linux/linux-embedded-debug/linux-embedded-debug.html?v=bb7d9a57684e'],
    ['U-Boot', 'articles/linux/uboot-structure-build/uboot-structure-build.html?v=bb7d9a57684e'],
    ['SPL', 'articles/linux/uboot-structure-build/uboot-structure-build.html?v=bb7d9a57684e'],
    ['Kernel构建', 'articles/linux/kernel-structure-build/kernel-structure-build.html?v=bb7d9a57684e'],
    ['DTB', 'articles/linux/kernel-structure-build/kernel-structure-build.html?v=bb7d9a57684e'],
    ['RootFS', 'articles/linux/rootfs-structure-build/rootfs-structure-build.html?v=bb7d9a57684e'],
    ['Buildroot', 'articles/linux/rootfs-structure-build/rootfs-structure-build.html?v=bb7d9a57684e'],
    ['BusyBox', 'articles/linux/rootfs-structure-build/rootfs-structure-build.html?v=bb7d9a57684e']
  ]);
}

function injectFreeRtosTopic() {
  const nav = document.querySelector('.nav#site-nav');
  const stackList = document.querySelector('#hardware-stack .stack-list');
  const tagCloud = document.querySelector('.tag-cloud');

  if (!nav || !stackList) return;
  if (document.querySelector('#freertos-group') || document.querySelector('#freertos-basic')) return;

  const freeRtosNavGroup = document.createElement('div');
  freeRtosNavGroup.className = 'nav-group';
  freeRtosNavGroup.id = 'freertos-group';
  freeRtosNavGroup.innerHTML = `
    <button class="nav-group-toggle" type="button" aria-expanded="false">
      <span>FreeRTOS专题</span>
      <svg class="nav-group-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5"/></svg>
    </button>
    <div class="nav-group-items">
      <a class="nav-sub" href="#freertos-basic">基础与调度</a>
      <a class="nav-sub" href="#freertos-task">任务管理</a>
      <a class="nav-sub" href="#freertos-ipc">队列与同步</a>
      <a class="nav-sub" href="#freertos-debug">定时器与调试</a>
    </div>
  `;

  const mcuGroup = document.querySelector('#mcu-group');
  if (mcuGroup) {
    nav.insertBefore(freeRtosNavGroup, mcuGroup);
  } else {
    nav.appendChild(freeRtosNavGroup);
  }

  const freeRtosCards = document.createElement('template');
  freeRtosCards.innerHTML = `
    <article class="stack-card" id="freertos-basic">
      <div class="post-meta">FreeRTOS专题</div>
      <div class="platform-category">
        <h4>基础与调度</h4>
        <div class="platform-items">
          <a class="platform-item" href="articles/freertos/freertos-basic-scheduler/freertos-basic-scheduler.html?v=bb7d9a57684e">
            <strong>FreeRTOS · 基础概念与调度机制</strong>
            <span>RTOS / 任务状态 / 抢占式调度 / 时间片 / Tick / 中断优先级 · 建立 FreeRTOS 整体认知</span>
          </a>
        </div>
      </div>
    </article>

    <article class="stack-card" id="freertos-task">
      <div class="post-meta">FreeRTOS专题</div>
      <div class="platform-category">
        <h4>任务管理</h4>
        <div class="platform-items">
          <a class="platform-item" href="articles/freertos/freertos-task-management/freertos-task-management.html?v=bb7d9a57684e">
            <strong>FreeRTOS · 任务管理与栈空间</strong>
            <span>xTaskCreate / 任务优先级 / vTaskDelayUntil / 任务栈 / 栈水位检测 · 适合嵌入式任务拆分设计</span>
          </a>
        </div>
      </div>
    </article>

    <article class="stack-card" id="freertos-ipc">
      <div class="post-meta">FreeRTOS专题</div>
      <div class="platform-category">
        <h4>队列与同步</h4>
        <div class="platform-items">
          <a class="platform-item" href="articles/freertos/freertos-ipc-sync/freertos-ipc-sync.html?v=bb7d9a57684e">
            <strong>FreeRTOS · 队列、信号量与互斥锁</strong>
            <span>Queue / Semaphore / Mutex / FromISR / 任务通知 / 优先级继承 · 梳理任务间通信和共享资源保护</span>
          </a>
        </div>
      </div>
    </article>

    <article class="stack-card" id="freertos-debug">
      <div class="post-meta">FreeRTOS专题</div>
      <div class="platform-category">
        <h4>定时器与调试</h4>
        <div class="platform-items">
          <a class="platform-item" href="articles/freertos/freertos-timer-memory-debug/freertos-timer-memory-debug.html?v=bb7d9a57684e">
            <strong>FreeRTOS · 软件定时器、内存与调试</strong>
            <span>Software Timer / heap_4 / 静态创建 / 栈溢出检测 / vTaskList / 运行统计 · 面向工程排错</span>
          </a>
        </div>
      </div>
    </article>
  `;

  const cStructCard = document.querySelector('#c-struct');
  if (cStructCard) {
    cStructCard.before(freeRtosCards.content);
  } else {
    stackList.prepend(freeRtosCards.content);
  }

  appendTagLinks(tagCloud, 'freertos', [
    ['FreeRTOS', 'articles/freertos/freertos-basic-scheduler/freertos-basic-scheduler.html?v=bb7d9a57684e'],
    ['RTOS', 'articles/freertos/freertos-basic-scheduler/freertos-basic-scheduler.html?v=bb7d9a57684e'],
    ['任务调度', 'articles/freertos/freertos-basic-scheduler/freertos-basic-scheduler.html?v=bb7d9a57684e'],
    ['任务栈', 'articles/freertos/freertos-task-management/freertos-task-management.html?v=bb7d9a57684e'],
    ['队列', 'articles/freertos/freertos-ipc-sync/freertos-ipc-sync.html?v=bb7d9a57684e'],
    ['信号量', 'articles/freertos/freertos-ipc-sync/freertos-ipc-sync.html?v=bb7d9a57684e'],
    ['互斥锁', 'articles/freertos/freertos-ipc-sync/freertos-ipc-sync.html?v=bb7d9a57684e'],
    ['任务通知', 'articles/freertos/freertos-ipc-sync/freertos-ipc-sync.html?v=bb7d9a57684e'],
    ['软件定时器', 'articles/freertos/freertos-timer-memory-debug/freertos-timer-memory-debug.html?v=bb7d9a57684e'],
    ['heap_4', 'articles/freertos/freertos-timer-memory-debug/freertos-timer-memory-debug.html?v=bb7d9a57684e']
  ]);
}

injectWindowsTopic();
injectLinuxTopic();
injectFreeRtosTopic();

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