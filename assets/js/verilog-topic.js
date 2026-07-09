function injectVerilogTopic() {
  const nav = document.querySelector('.nav#site-nav');
  const stackList = document.querySelector('#hardware-stack .stack-list');
  const tagCloud = document.querySelector('.tag-cloud');

  if (!nav || !stackList) return;
  if (document.querySelector('#verilog-group') || document.querySelector('#verilog-basic')) return;

  const verilogNavGroup = document.createElement('div');
  verilogNavGroup.className = 'nav-group';
  verilogNavGroup.id = 'verilog-group';
  verilogNavGroup.innerHTML = `
    <button class="nav-group-toggle" type="button" aria-expanded="false">
      <span>Verilog专题</span>
      <svg class="nav-group-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5"/></svg>
    </button>
    <div class="nav-group-items">
      <a class="nav-sub" href="#verilog-basic">基础语法</a>
      <a class="nav-sub" href="#verilog-logic">组合与时序</a>
      <a class="nav-sub" href="#verilog-fsm">状态机设计</a>
      <a class="nav-sub" href="#verilog-sim">仿真与调试</a>
    </div>
  `;

  const mcuGroup = document.querySelector('#mcu-group');
  if (mcuGroup) {
    nav.insertBefore(verilogNavGroup, mcuGroup);
  } else {
    nav.appendChild(verilogNavGroup);
  }

  const verilogCards = document.createElement('template');
  verilogCards.innerHTML = `
    <article class="stack-card" id="verilog-basic">
      <div class="post-meta">Verilog专题</div>
      <div class="platform-category">
        <h4>基础语法</h4>
        <div class="platform-items">
          <a class="platform-item" href="articles/verilog/verilog-basic-syntax/verilog-basic-syntax.html?v=bb7d9a57684e">
            <strong>Verilog · 基础语法与硬件描述思维</strong>
            <span>module / wire / reg / assign / always / 阻塞赋值 / 非阻塞赋值 / parameter · 从硬件角度理解语法</span>
          </a>
        </div>
      </div>
    </article>

    <article class="stack-card" id="verilog-logic">
      <div class="post-meta">Verilog专题</div>
      <div class="platform-category">
        <h4>组合逻辑与时序逻辑</h4>
        <div class="platform-items">
          <a class="platform-item" href="articles/verilog/verilog-combinational-sequential/verilog-combinational-sequential.html?v=bb7d9a57684e">
            <strong>Verilog · 组合逻辑与时序逻辑</strong>
            <span>组合逻辑 / latch / 寄存器 / 复位 / 计数器 / 边沿检测 / 流水线 · 区分电路行为和代码写法</span>
          </a>
        </div>
      </div>
    </article>

    <article class="stack-card" id="verilog-fsm">
      <div class="post-meta">Verilog专题</div>
      <div class="platform-category">
        <h4>状态机设计</h4>
        <div class="platform-items">
          <a class="platform-item" href="articles/verilog/verilog-fsm-design/verilog-fsm-design.html?v=bb7d9a57684e">
            <strong>Verilog · 状态机设计方法</strong>
            <span>FSM / 状态编码 / 三段式状态机 / Moore / Mealy / default安全状态 · 适合协议和采样流程控制</span>
          </a>
        </div>
      </div>
    </article>

    <article class="stack-card" id="verilog-sim">
      <div class="post-meta">Verilog专题</div>
      <div class="platform-category">
        <h4>仿真与调试</h4>
        <div class="platform-items">
          <a class="platform-item" href="articles/verilog/verilog-testbench-debug/verilog-testbench-debug.html?v=bb7d9a57684e">
            <strong>Verilog · Testbench仿真与调试</strong>
            <span>Testbench / 时钟复位 / task / $display / VCD / 自检查 / 上板调试 · 先仿真再上板</span>
          </a>
        </div>
      </div>
    </article>
  `;

  const windowsCard = document.querySelector('#windows-uqitong');
  const linuxCard = document.querySelector('#linux-basic');
  const freeRtosCard = document.querySelector('#freertos-basic');
  const cStructCard = document.querySelector('#c-struct');
  if (windowsCard) {
    windowsCard.before(verilogCards.content);
  } else if (linuxCard) {
    linuxCard.before(verilogCards.content);
  } else if (freeRtosCard) {
    freeRtosCard.before(verilogCards.content);
  } else if (cStructCard) {
    cStructCard.before(verilogCards.content);
  } else {
    stackList.prepend(verilogCards.content);
  }

  if (tagCloud && !tagCloud.querySelector('[data-topic="verilog"]')) {
    const tags = [
      ['Verilog', 'articles/verilog/verilog-basic-syntax/verilog-basic-syntax.html?v=bb7d9a57684e'],
      ['HDL', 'articles/verilog/verilog-basic-syntax/verilog-basic-syntax.html?v=bb7d9a57684e'],
      ['module', 'articles/verilog/verilog-basic-syntax/verilog-basic-syntax.html?v=bb7d9a57684e'],
      ['wire/reg', 'articles/verilog/verilog-basic-syntax/verilog-basic-syntax.html?v=bb7d9a57684e'],
      ['组合逻辑', 'articles/verilog/verilog-combinational-sequential/verilog-combinational-sequential.html?v=bb7d9a57684e'],
      ['时序逻辑', 'articles/verilog/verilog-combinational-sequential/verilog-combinational-sequential.html?v=bb7d9a57684e'],
      ['状态机', 'articles/verilog/verilog-fsm-design/verilog-fsm-design.html?v=bb7d9a57684e'],
      ['FSM', 'articles/verilog/verilog-fsm-design/verilog-fsm-design.html?v=bb7d9a57684e'],
      ['Testbench', 'articles/verilog/verilog-testbench-debug/verilog-testbench-debug.html?v=bb7d9a57684e'],
      ['仿真', 'articles/verilog/verilog-testbench-debug/verilog-testbench-debug.html?v=bb7d9a57684e']
    ];

    tags.forEach(([text, href], index) => {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = text;
      if (index === 0) link.dataset.topic = 'verilog';
      tagCloud.appendChild(link);
    });
  }

  const toggle = verilogNavGroup.querySelector('.nav-group-toggle');
  const groupItems = verilogNavGroup.querySelector('.nav-group-items');
  if (toggle && groupItems) {
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      groupItems.classList.toggle('is-open', !expanded);
    });
  }
}

injectVerilogTopic();