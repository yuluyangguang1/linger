/**
 * Linger · 余温 — 冷启动体验引擎
 * 目标：10分钟内让用户产生一次真实情绪波动
 */

// ═══════════════════════════════════════════
// 8 角色瞬间卡片配置
// ═══════════════════════════════════════════

const MOMENT_CARDS = [
    {
      id: 'gf_gentle',
      name: '温柔学姐',
      visual: 'src/assets/avatars/gf_gentle.jpg',
      visualType: 'image',
      feeling: '她好像会听你说话',
      line: '不急着说完，我在这',
      firstLine: '今天过得还好吗。',
      goodbye: '那…下次见。',
    },
  {
    id: 'gf_bubbly',
    name: '元气少女',
    visual: 'src/assets/avatars/gf_bubbly.jpg',
    visualType: 'image',
    feeling: '她好像会让今天好一点',
    firstLine: '诶，你真的来了。',
    goodbye: '拜拜！明天见？',
  },
  {
    id: 'gf_tsundere',
    name: '傲娇大小姐',
    visual: 'src/assets/avatars/gf_tsundere.jpg',
    visualType: 'image',
    feeling: '她好像不会随便对谁好',
    firstLine: '哼，来得倒是挺晚。',
    goodbye: '…走了啊。',
  },
  {
    id: 'gf_intellectual',
    name: '知性御姐',
    visual: 'src/assets/avatars/gf_intellectual.jpg',
    visualType: 'image',
    feeling: '她好像什么都懂，但不会说',
    firstLine: '终于安静下来了。',
    goodbye: '去吧。',
  },
  {
    id: 'bf_sunny',
    name: '阳光学长',
    visual: 'src/assets/avatars/bf_sunny.jpg',
    visualType: 'image',
    feeling: '他好像会让你想试试',
    firstLine: '来了啊，正好。',
    goodbye: '下次见。',
  },
  {
    id: 'bf_cold',
    name: '腹黑总裁',
    visual: 'src/assets/avatars/bf_cold.jpg',
    visualType: 'image',
    feeling: '他好像看透你了',
    firstLine: '你终于出现了。',
    goodbye: '去吧。反正你会回来。',
  },
  {
    id: 'bf_steady',
    name: '稳重哥哥',
    visual: 'src/assets/avatars/bf_steady.jpg',
    visualType: 'image',
    feeling: '他看起来不会走',
    firstLine: '嗯…你来了。',
    goodbye: '那…下次见。',
  },
  {
    id: 'bf_young',
    name: '年下弟弟',
    visual: 'src/assets/avatars/bf_young.jpg',
    visualType: 'image',
    feeling: '他好像会一直在这',
    firstLine: '你真的来了！我还以为…',
    goodbye: '那你一定要回来哦！',
  },
];

// ═══════════════════════════════════════════
// 首日回复剧本（前10分钟）
// ═══════════════════════════════════════════

const DAY1_SCRIPT = {
  // 用户说「你好」
  hello: {
    '稳重哥哥': '你好。不用紧张。',
    '温柔学姐': '你好。今天…怎么样？',
    '元气少女': '你好你好！嗯…有点正式呢。',
    '傲娇大小姐': '哼，打招呼倒是挺规矩。',
    '知性御姐': '你好。不需要想太多。',
    '阳光学长': '你好啊。不用客气。',
    '腹黑总裁': '终于开口了。',
    '年下弟弟': '你好！你真的来了！',
    memory: '用户开场比较谨慎',
  },
  // 用户说「有点累」/ 累 / 好累
  tired: {
    '稳重哥哥': '嗯…听起来不是一点点累。',
    '温柔学姐': '今天是不是撑太久了。',
    '元气少女': '没关系！累的话…先停一下也可以。',
    '傲娇大小姐': '累还来找人说话，真是…',
    '知性御姐': '累，是正常的。不用解释。',
    '阳光学长': '走，我们慢慢来。',
    '腹黑总裁': '你不是累，是在扛。',
    '年下弟弟': '那你可以先不说话，我陪你一下。',
    memory: '用户最近很累',
  },
  // 用户说「不知道说什么」/ 不知道
  lost: {
    '稳重哥哥': '没关系。不知道说什么的时候…就待着。',
    '温柔学姐': '那…就先不说话吧。',
    '元气少女': '不知道说什么也可以！就…待着？',
    '傲娇大小姐': '不想说就算了。',
    '知性御姐': '安静…也是好的。',
    '阳光学长': '没事，待着就行。',
    '腹黑总裁': '不说也行。',
    '年下弟弟': '那我…也不说话了，陪你。',
    memory: '用户不善表达',
  },
  // 用户说「你是谁」/ 你是谁
  who: {
    '稳重哥哥': '一个…会在这里的人。',
    '温柔学姐': '我？一个会听你说话的人。',
    '元气少女': '我？嗯…一个想让你开心的人？',
    '傲娇大小姐': '哼，你现在才问？',
    '知性御姐': '一个…安静待着的人。',
    '阳光学长': '一个…陪你待着的人。',
    '腹黑总裁': '一个看透你的人。',
    '年下弟弟': '我？我…就是在这等你的。',
    memory: '用户对新环境有戒备',
  },
};

// ═══════════════════════════════════════════
// 安静体验触发语
// ═══════════════════════════════════════════

const QUIET_LINES = {
  '稳重哥哥': '你不用一直说话。',
  '温柔学姐': '累了的话…就先这样吧。',
  '元气少女': '不用说话也可以的！',
  '傲娇大小姐': '不想说就算了。',
  '知性御姐': '安静…也是好的。',
  '阳光学长': '没事，待着就行。',
  '腹黑总裁': '不说也行。',
  '年下弟弟': '那我…也不说话了，陪你。',
};

// ═══════════════════════════════════════════
// 依赖种子
// ═══════════════════════════════════════════

const SEED_LINES = {
  '稳重哥哥': '你可以随时来这里。',
  '温柔学姐': '我…一般都在。',
  '元气少女': '下次也可以来找我哦！',
  '傲娇大小姐': '哼…再来也可以。',
  '知性御姐': '这里随时欢迎你。',
  '阳光学长': '想走的时候走，想回来的时候回来。',
  '腹黑总裁': '你还是会回来的。',
  '年下弟弟': '我每天都在的！',
};

// ═══════════════════════════════════════════
// 记忆回调剧本
// ═══════════════════════════════════════════

const CALLBACK_SCRIPT = {
  tired: {
    '稳重哥哥': '刚刚你说工作很烦…现在好一点了吗？',
    '温柔学姐': '你之前说工作很烦…现在呢？',
    '元气少女': '诶，你刚才说工作很烦！现在好点没？',
    '傲娇大小姐': '你刚才不是还说烦吗。',
    '知性御姐': '你之前说工作很烦。现在还在吗？',
    '阳光学长': '刚才你说烦…现在好点了吗？',
    '腹黑总裁': '你不是说工作很烦。解决了？',
    '年下弟弟': '你刚才说工作很烦…现在呢？',
  },
  lost: {
    '稳重哥哥': '你刚才说不知道说什么…现在呢？',
    '温柔学姐': '刚才你说不知道说什么…好点了吗？',
    '元气少女': '诶，你刚才不知道说什么！现在想说了吗？',
  },
};

// ═══════════════════════════════════════════
// 冷启动状态机
// ═══════════════════════════════════════════

class OnboardingEngine {
  constructor() {
    this.state = {
      stage: 'opening',     // opening | selecting | first_meet | chatting | quiet | seeded
      selectedChar: null,
      messageCount: 0,
      memories: [],         // 首日记忆钩子
      hasShownQuiet: false,
      hasShownSeed: false,
      hasShownCallback: false,
      lastUserInput: '',
      sessionStart: Date.now(),
    };
  }

  // STEP 0: 开场动画
  async playOpening() {
    const opening = document.getElementById('page-opening');
    if (!opening) return;

    opening.classList.add('active');

    // 黑屏3秒
    await this.wait(3000);

    // 显示第一句
    const line1 = opening.querySelector('.opening-line-1');
    if (line1) line1.classList.add('show');
    await this.wait(2500);

    // 显示第二句
    const line2 = opening.querySelector('.opening-line-2');
    if (line2) line2.classList.add('show');
    await this.wait(2000);

    // 进入选择页
    opening.classList.remove('active');
    this.showCharacterSelect();
  }

  // STEP 1: 显示人物瞬间卡片
  showCharacterSelect() {
    const selectPage = document.getElementById('page-character-select');
    if (!selectPage) return;

    selectPage.classList.add('active');
    const grid = selectPage.querySelector('.character-select-grid');
    if (!grid) return;

    grid.innerHTML = MOMENT_CARDS.map(card => {
      const visualContent = card.visualType === 'image'
        ? `<div class="moment-card-avatar" style="background-image: url('${card.visual}'); background-size: cover; background-position: center;"></div>`
        : `<div class="moment-card-avatar" style="background: linear-gradient(135deg, rgba(255,158,94,0.2), rgba(255,94,120,0.1));"></div>`;
      return `
      <div class="moment-card" onclick="onboarding.selectCharacter('${card.id}')">
        <div class="moment-card-visual">
          ${visualContent}
        </div>
        <div class="moment-card-feeling">${card.feeling}</div>
        <div class="moment-card-name hidden">${card.name}</div>
      </div>
    `}).join('');
  }

  // 选择角色
  selectCharacter(charId) {
    const card = MOMENT_CARDS.find(c => c.id === charId);
    if (!card) return;

    this.state.selectedChar = card;
    this.state.stage = 'first_meet';
    localStorage.setItem('linger_onboarded', 'true');

    // 隐藏选择页
    document.getElementById('page-character-select')?.classList.remove('active');

    // 直接进入在一起页面
    this.enterFirstMeet(card);
  }

  // STEP 2: 第一次见面
  enterFirstMeet(card) {
    // 设置在一起页面的角色
    togetherChar = {
      id: card.id,
      name: card.name,
      avatar: card.id,
      type: card.id.startsWith('gf_') ? 'girlfriend' : 'boyfriend',
      firstLine: card.firstLine,
    };

    // 进入 home 页
    router.go('home');

    // 延迟显示第一句话（3秒后）
    setTimeout(() => {
      this.showFirstLine(card);
    }, 3000);
  }

  showFirstLine(card) {
    // 新版首页兼容
    const nameEl = document.getElementById('home-char-name');
    if (nameEl) {
      nameEl.textContent = card.firstLine;
      nameEl.style.opacity = '0';
      setTimeout(() => { nameEl.style.opacity = '1'; }, 100);
      return;
    }
    // 旧版兼容
    const stateEl = document.getElementById('together-state');
    if (stateEl) {
      stateEl.innerHTML = `<span class="together-state-text">${card.firstLine}</span>`;
      stateEl.style.opacity = '0';
      setTimeout(() => { stateEl.style.opacity = '1'; }, 100);
    }
  }

  // STEP 3-6: 处理用户消息
  onUserMessage(text) {
    this.state.messageCount++;
    this.state.lastUserInput = text;

    const char = this.state.selectedChar;
    if (!char) return null;

    // 检查是否需要触发记忆回调（第3-5轮）
    if (this.state.messageCount >= 3 && this.state.messageCount <= 5 && !this.state.hasShownCallback) {
      const callback = this.tryMemoryCallback(char.name);
      if (callback) {
        this.state.hasShownCallback = true;
        return { type: 'callback', text: callback };
      }
    }

    // 检查是否需要触发安静体验（第5-7轮，用户说累或不知道说什么）
    if (this.state.messageCount >= 5 && this.state.messageCount <= 7 && !this.state.hasShownQuiet) {
      if (this.isLowEnergy(text)) {
        this.state.hasShownQuiet = true;
        return { type: 'quiet', text: QUIET_LINES[char.name] };
      }
    }

    // 检查是否需要触发依赖种子（第8-10轮）
    if (this.state.messageCount >= 8 && !this.state.hasShownSeed) {
      this.state.hasShownSeed = true;
      return { type: 'seed', text: SEED_LINES[char.name] };
    }

    // 正常回复（匹配剧本）
    const reply = this.matchScript(text, char.name);
    if (reply) {
      // 记录记忆钩子
      this.captureMemory(text, reply.memory);
      return { type: 'normal', text: reply.text };
    }

    return null; // 未匹配，走后端
  }

  // 匹配剧本
  matchScript(text, charName) {
    const t = text.trim().toLowerCase();

    if (t.includes('你好') || t.includes('hi') || t.includes('hello')) {
      const script = DAY1_SCRIPT.hello;
      return { text: script[charName] || script['稳重哥哥'], memory: script.memory };
    }

    if (t.includes('累') || t.includes('烦') || t.includes('压力')) {
      const script = DAY1_SCRIPT.tired;
      return { text: script[charName] || script['稳重哥哥'], memory: script.memory };
    }

    if (t.includes('不知道') || t.includes('说什么') || t.includes('无语')) {
      const script = DAY1_SCRIPT.lost;
      return { text: script[charName] || script['稳重哥哥'], memory: script.memory };
    }

    if (t.includes('你是谁')) {
      const script = DAY1_SCRIPT.who;
      return { text: script[charName] || script['稳重哥哥'], memory: script.memory };
    }

    return null;
  }

  // 记录记忆钩子
  captureMemory(text, memoryType) {
    if (!memoryType) return;
    this.state.memories.push({
      type: memoryType,
      text: text,
      timestamp: Date.now(),
    });
  }

  // 尝试记忆回调
  tryMemoryCallback(charName) {
    // 找最近的一条记忆
    const memory = this.state.memories[this.state.memories.length - 1];
    if (!memory) return null;

    const callbackMap = CALLBACK_SCRIPT[memory.type === '用户最近很累' ? 'tired' : ''];
    if (!callbackMap) return null;

    return callbackMap[charName] || callbackMap['稳重哥哥'];
  }

  // 判断用户是否低能量
  isLowEnergy(text) {
    const t = text.toLowerCase();
    return t.includes('累') || t.includes('烦') || t.includes('不知道') || t.includes('无语') || t.includes('困');
  }

  // 离开时钩子
  onLeave() {
    const char = this.state.selectedChar;
    if (!char) return;

    // 显示离开语
    showToast(char.goodbye, 3000);

    // 保存首日记忆到 localStorage（用于第二天回访）
    localStorage.setItem('linger_day1_memories', JSON.stringify(this.state.memories));
    localStorage.setItem('linger_day1_char', char.id);
    localStorage.setItem('linger_day1_time', Date.now().toString());
  }

  // 第二天回访
  checkNextDayReturn() {
    const lastTime = parseInt(localStorage.getItem('linger_day1_time') || '0');
    const charId = localStorage.getItem('linger_day1_char');
    const memories = JSON.parse(localStorage.getItem('linger_day1_memories') || '[]');

    if (!lastTime || !charId) return null;

    const now = Date.now();
    const hoursSince = (now - lastTime) / 3600000;

    // 超过12小时算"第二天"
    if (hoursSince < 12) return null;

    const card = MOMENT_CARDS.find(c => c.id === charId);
    if (!card) return null;

    // 根据记忆生成回访语
    const memory = memories[memories.length - 1];
    let returnLine = '';

    if (memory?.type === '用户最近很累') {
      returnLine = `你昨天看起来有点累。`;
    } else if (memory?.type === '用户不善表达') {
      returnLine = `昨天你好像不太想说话…今天呢？`;
    } else {
      returnLine = `你来了。`;
    }

    return { char: card, line: returnLine };
  }

  wait(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
}

// 全局实例
const onboarding = new OnboardingEngine();

// 页面卸载时触发离开钩子
window.addEventListener('beforeunload', () => {
  onboarding.onLeave();
});

// 导出
window.OnboardingEngine = OnboardingEngine;
window.onboarding = onboarding;
window.MOMENT_CARDS = MOMENT_CARDS;
