/**
 * Linger · 余温 — 前端主应用（纯静态 BYOK 版）
 *
 * 数据来源：
 *   - 角色 / 宠物 / 聊天历史  → localStorage（LingerStore）
 *   - 聊天回复  → 浏览器直连 LLM（LingerLLM，用户自带 Key）
 *                 未配置 Key 时退化为脚本化回复（onboarding 的首日剧本）
 */

const Store = window.LingerStore;
const LLM = window.LingerLLM;

// ─── 路由 ───
const router = {
  current: 'home',
  go(page, params = {}) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tabbar-item').forEach(t => t.classList.remove('active'));
    const el = document.getElementById(`page-${page}`);
    if (el) { el.classList.add('active'); this.current = page; }
    const tab = document.querySelector(`.tabbar-item[data-page="${page}"]`);
    if (tab) tab.classList.add('active');
    if (typeof window[`onPage_${page}`] === 'function') {
      window[`onPage_${page}`](params);
    }
  },
};

// ─── Toast ───
function showToast(message, duration = 2000) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast'; toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// ─── 工具 ───
function formatTime(dateStr) {
  const d = new Date(dateStr); const now = new Date(); const diff = now - d;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}
function escapeHtml(text) {
  const div = document.createElement('div'); div.textContent = text == null ? '' : String(text); return div.innerHTML;
}
function autoResize(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 100) + 'px'; }

// ─── 常量 ───
const AVATAR_MAP = {
  gf_gentle: 'src/assets/avatars/gf_gentle.jpg', gf_bubbly: 'src/assets/avatars/gf_bubbly.jpg',
  gf_tsundere: 'src/assets/avatars/gf_tsundere.jpg', gf_intellectual: 'src/assets/avatars/gf_intellectual.jpg',
  bf_sunny: 'src/assets/avatars/bf_sunny.jpg', bf_cold: 'src/assets/avatars/bf_cold.jpg',
  bf_steady: 'src/assets/avatars/bf_steady.jpg', bf_young: 'src/assets/avatars/bf_young.jpg',
};
const TYPE_EMOJI = {
  girlfriend: 'src/assets/icons/在一起.png',
  boyfriend: 'src/assets/icons/在一起.png',
  friend: 'src/assets/icons/他们.png',
  family: 'src/assets/icons/在一起.png',
  mentor: 'src/assets/icons/陪伴.png',
  pet: 'src/assets/icons/陪伴.png',
  memorial: 'src/assets/icons/数字怀念.png',
};
const PET_EMOJI = {
  dog: 'src/assets/icons/陪伴.png',
  cat: 'src/assets/icons/陪伴.png',
};

// ─── 全局状态 ───
let userGender = localStorage.getItem('rv_gender') || null;
let togetherChar = null;
let currentCharId = null;
let currentPetId = null;
let currentMemorialId = null;
let selectedType = null;
let selectedPersona = null;

// ═══════════════════════════════════════════
// 初始化
// ═══════════════════════════════════════════
function initApp() {
  Store.seedDefaultPetsIfEmpty();

  const hasOnboarded = localStorage.getItem('linger_onboarded');
  const day1Return = onboarding.checkNextDayReturn();

  if (!hasOnboarded) {
    onboarding.playOpening();
  } else if (day1Return) {
    // 确保角色已落地
    Store.ensureCharacter(day1Return.char.id);
    togetherChar = { id: day1Return.char.id, name: day1Return.char.name, avatar: day1Return.char.id };
    localStorage.setItem('linger_together', JSON.stringify(togetherChar));
    router.go('home');
    setTimeout(() => {
      const nameEl = document.getElementById('home-char-greeting');
      if (nameEl) nameEl.textContent = day1Return.line;
    }, 1000);
  } else {
    router.go('home');
  }
}

function selectGender(gender) {
  userGender = gender;
  localStorage.setItem('rv_gender', gender);
  router.go('home');
}

// ═══════════════════════════════════════════
// 页面钩子：在一起
// ═══════════════════════════════════════════
window.onPage_home = function() {
  if (!togetherChar) {
    const saved = localStorage.getItem('linger_together');
    if (saved) { try { togetherChar = JSON.parse(saved); } catch(e) {} }
  }
  // 如果没有 togetherChar，挑用户已有的第一个角色
  if (!togetherChar) {
    const chars = Store.listCharacters();
    if (chars.length > 0) {
      const c = chars[0];
      togetherChar = { id: c.id, name: c.name, type: c.type, avatar: c.avatar };
      localStorage.setItem('linger_together', JSON.stringify(togetherChar));
    }
  }

  const nameEl = document.getElementById('home-char-name');
  const greetEl = document.getElementById('home-char-greeting');
  const tagsEl = document.getElementById('home-char-tags');
  const bgEl = document.getElementById('home-hero-bg');
  const badgeValEl = document.getElementById('home-intimacy-val');

  if (!togetherChar) {
    if (nameEl) nameEl.textContent = '还没有人陪伴你';
    if (greetEl) greetEl.textContent = '去「他们」页面添加一个吧';
    if (tagsEl) tagsEl.innerHTML = '';
    return;
  }

  const fullChar = Store.getCharacter(togetherChar.id) || Store.ensureCharacter(togetherChar.id);
  const persona = Store.getPersona(togetherChar.id);

  if (nameEl) nameEl.textContent = fullChar.name;
  if (greetEl) greetEl.textContent = persona?.first_meet || '今天想聊点什么？';
  if (tagsEl && persona) {
    const tags = (persona.tagline || '').split(/[、,，\s]+/).filter(Boolean).slice(0, 3);
    tagsEl.innerHTML = tags.map(t => `<span class="home-tag">${escapeHtml(t)}</span>`).join('');
  }
  if (badgeValEl) badgeValEl.textContent = `${Math.floor(fullChar.intimacy || 0)}%`;
  if (bgEl) {
    const avatarUrl = AVATAR_MAP[togetherChar.avatar] || AVATAR_MAP[togetherChar.id];
    if (avatarUrl) bgEl.style.backgroundImage = `url(${avatarUrl})`;
  }
};

function enterChatFromTogether() {
  if (!togetherChar) { showToast('还没有人在这里，先去「他们」页面添加吧'); return; }
  router.go('chat', { char: togetherChar });
}

// ═══════════════════════════════════════════
// 页面钩子：他们
// ═══════════════════════════════════════════
let themTab = 'all';
let themData = { characters: [], pets: [], memorial: [] };

window.onPage_them = function() {
  const listEl = document.getElementById('them-list');
  if (!listEl) return;

  // 把所有预置人设也列出来（就算用户没创建过，也能看到选择）
  const userChars = Store.listCharacters();
  const userCharIds = new Set(userChars.map(c => c.id));
  const allPersonaCards = Object.values(Store.PERSONAS).map(p => {
    const existing = userChars.find(c => c.id === p.id);
    return existing || {
      id: p.id, name: p.name, type: p.type, avatar: p.id,
      tagline: p.tagline, intimacy: 0, level: 1, _preview: true,
    };
  });

  themData.characters = allPersonaCards;
  themData.pets = Store.listPets();
  themData.memorial = Store.listMemorials();
  renderThemList();
};

function switchThemTab(tab) {
  themTab = tab;
  document.querySelectorAll('.them-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  renderThemList();
}

function filterThemList(keyword) {
  renderThemList(keyword);
}

function renderThemList(keyword = '') {
  const listEl = document.getElementById('them-list');
  if (!listEl) return;
  let items = [];
  if (themTab === 'all') items = [...themData.characters, ...themData.pets];
  else if (themTab === 'character') items = themData.characters;
  else if (themTab === 'pet') items = themData.pets;
  else if (themTab === 'memorial') items = themData.memorial;

  if (keyword) {
    const k = keyword.toLowerCase();
    items = items.filter(it => (it.name || '').toLowerCase().includes(k));
  }

  if (items.length === 0) {
    listEl.innerHTML = '<div class="chat-empty" style="grid-column:1/-1;"><div class="empty-icon">🫧</div><div class="empty-text">这里还空着...</div></div>';
    return;
  }

  listEl.innerHTML = items.map(it => {
    const isPet = !!it.species;
    const isMemorial = !!it.stories; // memorial has stories field
    const avatar = isPet
      ? (PET_EMOJI[it.species] ? `<img src="${PET_EMOJI[it.species]}" alt="">` : '🐾')
      : (TYPE_EMOJI[it.type] ? `<img src="${TYPE_EMOJI[it.type]}" alt="">` : '陪伴');
    const img = (!isPet && AVATAR_MAP[it.avatar]) ? `<img src="${AVATAR_MAP[it.avatar]}" alt="">` : '';
    const lv = it.level || 1;
    const intimacy = it.intimacy || 0;
    const isTogether = togetherChar && togetherChar.id === it.id;
    const starBtn = (!isPet && !isMemorial) ? `<button class="them-card-star ${isTogether ? 'active' : ''}" onclick="event.stopPropagation(); setTogetherChar('${it.id}', '${escapeHtml(it.name)}', '${it.type}', '${it.avatar || ''}')" title="设为陪伴">${isTogether ? '★' : '☆'}</button>` : '';
    const clickHandler = isMemorial
      ? `event.stopPropagation(); openMemorialFromList('${it.id}', '${escapeHtml(it.name)}')`
      : (isPet
        ? `openPet('${it.id}')`
        : `openChatFromList('${it.id}', '${escapeHtml(it.name)}', '${it.type || 'friend'}', '${it.avatar || ''}')`);
    return `
      <div class="them-card" onclick="${clickHandler}">
        ${starBtn}
        <div class="them-card-avatar">${img || avatar}</div>
        <div class="them-card-name">${escapeHtml(it.name)}</div>
        <div class="them-card-lv">Lv.${Math.floor(lv)} · 亲密度 ${Math.floor(intimacy)}%</div>
        <div class="them-card-intimacy"><div class="them-card-intimacy-fill" style="width:${Math.min(intimacy,100)}%"></div></div>
      </div>
    `;
  }).join('');
}

function openChatFromList(id, name, type, avatar) {
  Store.ensureCharacter(id);
  togetherChar = { id, name, type, avatar };
  localStorage.setItem('linger_together', JSON.stringify({ id, name, type, avatar }));
  router.go('chat', { charId: id, char: { id, name, type, avatar } });
}

function setTogetherChar(id, name, type, avatar) {
  Store.ensureCharacter(id);
  togetherChar = { id, name, type, avatar };
  localStorage.setItem('linger_together', JSON.stringify({ id, name, type, avatar }));
  showToast(`⭐ ${name} 已成为你的陪伴`);
  router.go('home');
}

// ═══════════════════════════════════════════
// 页面钩子：宠物列表
// ═══════════════════════════════════════════
window.onPage_pets = function() {
  const listEl = document.getElementById('pets-list');
  if (!listEl) return;
  const pets = Store.listPets();
  if (pets.length === 0) {
    listEl.innerHTML = '<div class="chat-empty" style="grid-column:1/-1;"><div class="empty-icon">🐾</div><div class="empty-text">还没有宠物...</div></div>';
    return;
  }
  listEl.innerHTML = pets.map(p => `
    <div class="them-card" onclick="openPet('${p.id}')">
      <div class="them-card-avatar"><img src="${PET_EMOJI[p.species] || 'src/assets/icons/陪伴.png'}" alt="" class="them-card-avatar-img"></div>
      <div class="them-card-name">${escapeHtml(p.name)}</div>
      <div class="them-card-lv">Lv.${p.level} · 亲密度 ${Math.floor(p.intimacy)}%</div>
      <div class="them-card-intimacy"><div class="them-card-intimacy-fill" style="width:${Math.min(p.intimacy,100)}%"></div></div>
    </div>
  `).join('');
};

// ═══════════════════════════════════════════
// 页面钩子：创建角色
// ═══════════════════════════════════════════
const CREATE_TYPES = [
  { id: 'girlfriend', emoji: '💕', name: 'AI 女友', genderFilter: ['male', 'neutral'] },
  { id: 'boyfriend', emoji: '💙', name: 'AI 男友', genderFilter: ['female', 'neutral'] },
  { id: 'friend', emoji: '🤝', name: 'AI 朋友' },
  { id: 'family', emoji: '👨‍👩‍👧', name: 'AI 家人' },
  { id: 'mentor', emoji: '🧠', name: 'AI 导师' },
  { id: 'fantasy', emoji: '🎭', name: '幻想角色' },
];

window.onPage_create = function() {
  selectedType = null; selectedPersona = null;
  document.getElementById('create-step1').classList.remove('hidden');
  document.getElementById('create-step2').classList.add('hidden');
  document.getElementById('create-step-num-1').classList.add('active');
  document.getElementById('create-step-num-2').classList.remove('active');

  const filtered = CREATE_TYPES.filter(t => !t.genderFilter || t.genderFilter.includes(userGender));
  const grid = document.getElementById('create-type-grid');
  grid.innerHTML = filtered.map(t => `
    <div class="create-type-item" onclick="selectCreateType('${t.id}')">
      <div class="create-type-icon">${t.emoji}</div>
      <div class="create-type-name">${t.name}</div>
    </div>
  `).join('');
};

function selectCreateType(type) {
  selectedType = type;
  document.getElementById('create-step1').classList.add('hidden');
  document.getElementById('create-step2').classList.remove('hidden');
  document.getElementById('create-step-num-1').classList.remove('active');
  document.getElementById('create-step-num-2').classList.add('active');

  const templates = Store.listPersonasByType(type);
  const grid = document.getElementById('create-persona-grid');
  if (templates.length === 0) {
    grid.innerHTML = '<div class="chat-empty" style="grid-column:1/-1;"><div class="empty-text">这个类型还没有预置人设，敬请期待</div></div>';
    return;
  }
  grid.innerHTML = templates.map(t => {
    const avatarUrl = AVATAR_MAP[t.id];
    const tagSpans = (t.tagline || '').split(/[、,，\s]+/).filter(Boolean).slice(0,3)
      .map(p => `<span class="create-persona-tag">${escapeHtml(p)}</span>`).join('');
    return `
      <div class="create-persona-item" onclick="selectPersona('${t.id}', this)">
        <div class="create-persona-avatar">${avatarUrl ? `<img src="${avatarUrl}">` : ''}</div>
        <div class="create-persona-name">${escapeHtml(t.name)}</div>
        <div class="create-persona-tags">${tagSpans}</div>
      </div>
    `;
  }).join('');
}

function selectPersona(id, el) {
  selectedPersona = id;
  document.querySelectorAll('.create-persona-item').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
}

function doCreateCharacter() {
  if (!selectedPersona) { showToast('请先选择一个人设'); return; }
  const customName = document.getElementById('create-custom-name').value.trim();
  try {
    const ch = Store.createCharacter({ persona_id: selectedPersona, custom_name: customName || null });
    togetherChar = { id: ch.id, name: ch.name, type: ch.type, avatar: ch.avatar };
    localStorage.setItem('linger_together', JSON.stringify(togetherChar));
    showToast(`✨ ${ch.name} 已创建`);
    router.go('home');
  } catch (e) {
    showToast('创建失败：' + e.message);
  }
}

// ═══════════════════════════════════════════
// 页面钩子：聊天
// ═══════════════════════════════════════════
window.onPage_chat = function(params) {
  const char = params?.char;
  if (char) {
    openChat(char.id, char.name, char.type, char.avatar || char.id);
  } else if (params?.charId) {
    openChat(params.charId, '聊天中', 'friend', params.charId);
  }
  if (params?.quickMsg) {
    setTimeout(() => {
      const input = document.getElementById('chat-input');
      if (input) { input.value = params.quickMsg; sendChat(); }
    }, 500);
  }
};

function openChat(charId, name, type, personaId) {
  currentCharId = charId;
  Store.ensureCharacter(charId);

  const nameEl = document.getElementById('chat-char-name');
  if (nameEl) nameEl.textContent = name;
  const avatarEl = document.getElementById('chat-header-avatar');
  const avatarUrl = AVATAR_MAP[personaId] || AVATAR_MAP[charId];
  if (avatarEl) {
    if (avatarUrl) avatarEl.innerHTML = `<img src="${avatarUrl}" alt="">`;
    else avatarEl.innerHTML = `<img src="${TYPE_EMOJI[type] || 'src/assets/icons/陪伴.png'}" alt="" class="chat-header-avatar-img">`;
  }

  // 渲染历史
  const history = Store.getChatHistory(charId);
  const list = document.getElementById('chat-msg-list');
  if (!list) return;
  if (history.length === 0) {
    list.innerHTML = '<div class="chat-empty"><div class="chat-empty-icon">💬</div><div class="chat-empty-text">开始你们的第一次对话吧</div></div>';
  } else {
    list.innerHTML = history.map(h => createMsgHtml(h.role === 'assistant' ? 'ai' : 'user', h.content, h.ts)).join('');
    scrollToBottom();
  }

  // 更新状态药丸：显示当前 LLM 模式
  updateChatModePill();
}

function updateChatModePill() {
  const pill = document.getElementById('chat-tier-pill');
  const textEl = document.getElementById('chat-tier-text');
  const remainEl = document.getElementById('chat-tier-remain');
  if (!pill || !textEl || !remainEl) return;
  if (LLM.hasConfig()) {
    const cfg = LLM.getConfig();
    pill.style.display = 'flex';
    textEl.textContent = cfg.providerLabel || 'LLM';
    remainEl.textContent = '已连接';
    pill.classList.remove('danger');
    pill.classList.remove('warning');
  } else {
    pill.style.display = 'flex';
    textEl.textContent = '演示';
    remainEl.textContent = '未配置';
    pill.classList.add('warning');
  }
}

function createMsgHtml(role, content, time) {
  return `<div class="chat-msg ${role}"><div class="chat-bubble">${escapeHtml(content)}</div><span class="chat-time">${formatTime(time)}</span></div>`;
}

async function sendChat() {
  const input = document.getElementById('chat-input');
  const msg = input?.value.trim();
  if (!msg || !currentCharId) return;
  input.value = ''; autoResize(input);

  const list = document.getElementById('chat-msg-list');
  const emptyEl = list.querySelector('.chat-empty');
  if (emptyEl) emptyEl.remove();

  // 渲染用户气泡 + 持久化
  list.insertAdjacentHTML('beforeend', createMsgHtml('user', msg, Date.now()));
  Store.appendChatMessage(currentCharId, 'user', msg);
  scrollToBottom();

  // 先尝试 onboarding 的剧本化回复（首日体验）
  let scripted = null;
  try { scripted = onboarding?.onUserMessage ? onboarding.onUserMessage(msg) : null; } catch (e) {}

  // 没有 LLM 配置时，必须依赖 scripted / fallback
  const hasLLM = LLM.hasConfig();

  const msgId = 'msg-' + Date.now();
  list.insertAdjacentHTML('beforeend',
    `<div class="chat-msg ai" id="${msgId}"><div class="chat-bubble"></div><span class="chat-time">${formatTime(Date.now())}</span></div>`);
  scrollToBottom();
  const bubbleEl = document.querySelector(`#${msgId} .chat-bubble`);

  // 优先：剧本回复（首日前几句保持"设计感"）
  if (scripted && scripted.text) {
    await typeText(bubbleEl, scripted.text);
    Store.appendChatMessage(currentCharId, 'assistant', scripted.text);
    Store.bumpIntimacy(currentCharId, 1);
    scrollToBottom();
    return;
  }

  // 无 Key：降级为本地 fallback
  if (!hasLLM) {
    const fallback = pickFallbackReply(currentCharId, msg);
    await typeText(bubbleEl, fallback);
    Store.appendChatMessage(currentCharId, 'assistant', fallback);
    Store.bumpIntimacy(currentCharId, 1);
    scrollToBottom();
    return;
  }

  // 有 Key：调真 LLM
  const persona = Store.getPersona(currentCharId);
  const systemPrompt = LLM.buildSystemPrompt(persona || { name: '陪伴者' }, { userGender });
  const history = Store.getChatHistory(currentCharId).slice(-20);
  // history 的末尾就是刚刚 append 的 user 消息，包含它
  const messages = [{ role: 'system', content: systemPrompt }]
    .concat(history.map(h => ({ role: h.role, content: h.content })));

  let fullText = '';
  try {
    for await (const chunk of LLM.streamChat(messages)) {
      if (chunk.type === 'chunk') {
        fullText += chunk.content;
        bubbleEl.textContent = fullText;
        scrollToBottom();
      } else if (chunk.type === 'error') {
        bubbleEl.textContent = chunk.content;
        scrollToBottom();
        return;
      } else if (chunk.type === 'done') {
        break;
      }
    }
  } catch (e) {
    bubbleEl.textContent = '抱歉，出了点问题：' + (e.message || e);
    scrollToBottom();
    return;
  }

  if (fullText) {
    Store.appendChatMessage(currentCharId, 'assistant', fullText);
    Store.bumpIntimacy(currentCharId, 1);
  }
}

// 逐字显示（给剧本/fallback 用，体验更接近流式）
async function typeText(el, text, speed = 40) {
  el.textContent = '';
  for (const ch of text) {
    el.textContent += ch;
    await new Promise(r => setTimeout(r, speed));
  }
}

const FALLBACK_POOL = [
  '嗯，我在听。',
  '我在呢。',
  '慢慢说，不急。',
  '嗯…',
  '待会儿也可以再说。',
  '你说。',
  '知道了。',
  '今天怎么样？',
];
function pickFallbackReply(charId, userText) {
  const persona = Store.getPersona(charId);
  // 根据人设挑不同口气
  const name = persona?.name;
  const map = {
    '腹黑总裁': ['嗯。', '说下去。', '我看着呢。', '不必解释。'],
    '傲娇大小姐': ['哼。', '…听到了。', '知道了知道了。', '别说了我在听。'],
    '年下弟弟': ['我在！', '嗯嗯！', '你说你说，我都想听。'],
    '温柔学姐': ['嗯。', '我在呢。', '慢慢说。', '不急。'],
    '元气少女': ['我在我在！', '嗯嗯！然后呢？', '哎，我懂！'],
    '稳重哥哥': ['嗯。', '我在。', '你说。', '不用急。'],
    '知性御姐': ['嗯。', '听到了。', '继续。'],
    '阳光学长': ['嗯，听着呢。', '来，说说。', '没事，慢慢讲。'],
  };
  const pool = map[name] || FALLBACK_POOL;
  return pool[Math.floor(Math.random() * pool.length)];
}

function scrollToBottom() {
  const container = document.querySelector('#page-chat .chat-messages, #page-memorial-chat .chat-messages');
  if (container) setTimeout(() => { container.scrollTop = container.scrollHeight; }, 60);
}

function showCharInfo() {
  if (!currentCharId) return;
  const ch = Store.getCharacter(currentCharId);
  const persona = Store.getPersona(currentCharId);
  if (!ch || !persona) { showToast('角色信息未加载'); return; }
  showToast(`${ch.name} · Lv.${ch.level} · 亲密度 ${Math.floor(ch.intimacy)}%`, 2500);
}

// ═══════════════════════════════════════════
// 页面钩子：宠物详情
// ═══════════════════════════════════════════
window.onPage_pet = function() {
  if (!currentPetId) return;
  const pet = Store.getPet(currentPetId);
  if (!pet) { showToast('宠物不存在'); return; }
  document.getElementById('pet-name').textContent = pet.name;
  document.getElementById('pet-hero-avatar').innerHTML =
    `<img src="${PET_EMOJI[pet.species] || 'src/assets/icons/陪伴.png'}" alt="" class="pet-hero-avatar-img">`;
  const speechEl = document.getElementById('pet-speech');
  if (speechEl) {
    if (pet.intimacy < 20) speechEl.textContent = pet.species === 'cat' ? '"喵~"' : '"汪！"';
    else if (pet.intimacy < 50) speechEl.textContent = '"饿饿...想玩..."';
    else if (pet.intimacy < 80) speechEl.textContent = '"今天你回来晚了呢，我等了好久。"';
    else speechEl.textContent = '"你最近是不是不太开心？我感觉你叹气变多了。"';
  }
  const stats = [
    { icon: '🍚', label: '饥饿', val: pet.hunger || 0, color: '#FF9E5E' },
    { icon: '🛁', label: '清洁', val: pet.cleanliness || 0, color: '#7EC8E3' },
    { icon: '😊', label: '心情', val: pet.mood || 0, color: '#FF5E78' },
    { icon: '💤', label: '精力', val: pet.energy || 0, color: '#C4B5FD' },
    { icon: '❤️', label: '亲密度', val: pet.intimacy || 0, color: '#FF5E78' },
    { icon: '🧠', label: '说话力', val: pet.speak_level || 0, color: '#7DD3C0' },
  ];
  document.getElementById('pet-stats-grid').innerHTML = stats.map(s => `
    <div class="pet-stat-row">
      <div class="pet-stat-icon">${s.icon}</div>
      <div class="pet-stat-info">
        <div class="pet-stat-header"><span class="pet-stat-label">${s.label}</span><span class="pet-stat-value">${Math.floor(s.val)}</span></div>
        <div class="pet-stat-bar"><div class="pet-stat-fill" style="width:${Math.min(s.val,100)}%;background:${s.color}"></div></div>
      </div>
    </div>
  `).join('');
};

function openPet(petId) {
  currentPetId = petId;
  router.go('pet');
}

function petDoAction(action) {
  if (!currentPetId) return;
  try {
    const res = Store.petAction(currentPetId, action);
    showToast(res.message);
    if (res.level_up) setTimeout(() => showToast(`🎉 升级到 Lv.${res.new_level}！`), 1000);
    window.onPage_pet();
  } catch (e) {
    showToast('操作失败：' + e.message);
  }
}

// ═══════════════════════════════════════════
// 页面钩子：个人中心
// ═══════════════════════════════════════════
window.onPage_profile = function() {
  const nameEl = document.getElementById('profile-name');
  if (nameEl) nameEl.textContent = userGender === 'male' ? '男生用户' : userGender === 'female' ? '女生用户' : '用户';

  // 陪伴天数：从首次使用算起
  const firstUseKey = 'linger_first_use';
  let firstUse = parseInt(localStorage.getItem(firstUseKey) || '0');
  if (!firstUse) { firstUse = Date.now(); localStorage.setItem(firstUseKey, firstUse.toString()); }
  const days = Math.max(1, Math.floor((Date.now() - firstUse) / 86400000) + 1);
  const chars = Store.listCharacters();
  const totalChats = chars.reduce((s, c) => s + Store.getChatHistory(c.id).length, 0);

  const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setText('stat-days', days);
  setText('stat-chats', totalChats);
  setText('stat-gifts', 0);
  setText('stat-memories', chars.reduce((s, c) => s + Math.floor((c.intimacy || 0) * 30), 0));
};

function resetGender() {
  userGender = null; localStorage.removeItem('rv_gender');
  router.go('gender');
}

// ═══════════════════════════════════════════
// 页面钩子：设置（BYOK 配置）
// ═══════════════════════════════════════════
window.onPage_settings = function() {
  renderSettingsForm();
};

function renderSettingsForm() {
  const container = document.getElementById('settings-form');
  if (!container) return;
  const cfg = LLM.getConfig() || {};
  const currentProvider = cfg.provider || 'openrouter';

  const presetOptions = Object.entries(LLM.PRESETS).map(([k, v]) =>
    `<option value="${k}" ${k === currentProvider ? 'selected' : ''}>${v.label}</option>`
  ).join('');

  container.innerHTML = `
    <div class="settings-section">
      <div class="settings-label">服务商</div>
      <select id="settings-provider" class="settings-input" onchange="onProviderChange(this.value)">
        ${presetOptions}
      </select>
      <div class="settings-hint" id="settings-provider-hint"></div>
    </div>

    <div class="settings-section">
      <div class="settings-label">Base URL</div>
      <input type="text" id="settings-baseurl" class="settings-input" placeholder="https://..." value="${escapeHtml(cfg.baseURL || '')}">
    </div>

    <div class="settings-section">
      <div class="settings-label">API Key</div>
      <input type="password" id="settings-apikey" class="settings-input" placeholder="sk-..." value="${escapeHtml(cfg.apiKey || '')}">
      <div class="settings-hint">仅保存在你本机浏览器，不会上传到任何服务器</div>
    </div>

    <div class="settings-section">
      <div class="settings-label">模型</div>
      <input type="text" id="settings-model" class="settings-input" placeholder="deepseek-chat" value="${escapeHtml(cfg.model || '')}">
    </div>

    <div class="settings-actions">
      <button class="settings-btn secondary" onclick="testSettings()">测试连接</button>
      <button class="settings-btn primary" onclick="saveSettings()">保存</button>
    </div>

    <div class="settings-section" style="margin-top:24px">
      <button class="settings-btn danger" onclick="clearSettings()">清除 API Key</button>
    </div>

    <div class="settings-result" id="settings-result"></div>
  `;

  onProviderChange(currentProvider, /*applyDefaults*/ !cfg.apiKey);
}

function onProviderChange(provider, applyDefaults = true) {
  const preset = LLM.PRESETS[provider];
  if (!preset) return;
  const hintEl = document.getElementById('settings-provider-hint');
  if (hintEl) {
    const signup = preset.signupURL
      ? ` · <a href="${preset.signupURL}" target="_blank" rel="noopener">获取 Key</a>`
      : '';
    hintEl.innerHTML = `${escapeHtml(preset.note || '')}${signup}`;
  }
  if (applyDefaults) {
    const baseEl = document.getElementById('settings-baseurl');
    const modelEl = document.getElementById('settings-model');
    if (baseEl && !baseEl.value) baseEl.value = preset.baseURL;
    if (modelEl && !modelEl.value) modelEl.value = preset.defaultModel;
  }
}

function collectSettings() {
  const provider = document.getElementById('settings-provider').value;
  const preset = LLM.PRESETS[provider];
  return {
    provider,
    providerLabel: preset?.label,
    baseURL: document.getElementById('settings-baseurl').value.trim(),
    apiKey: document.getElementById('settings-apikey').value.trim(),
    model: document.getElementById('settings-model').value.trim(),
  };
}

async function testSettings() {
  const cfg = collectSettings();
  const resEl = document.getElementById('settings-result');
  if (!cfg.apiKey || !cfg.baseURL || !cfg.model) {
    resEl.className = 'settings-result error';
    resEl.textContent = '请先填写 Base URL、API Key 和模型名';
    return;
  }
  resEl.className = 'settings-result';
  resEl.textContent = '测试中...';
  const r = await LLM.testConnection(cfg);
  resEl.className = 'settings-result ' + (r.ok ? 'ok' : 'error');
  resEl.textContent = (r.ok ? '✓ ' : '✗ ') + r.message;
}

function saveSettings() {
  const cfg = collectSettings();
  if (!cfg.apiKey || !cfg.baseURL || !cfg.model) {
    showToast('请先填写 Base URL、API Key 和模型名'); return;
  }
  LLM.setConfig(cfg);
  showToast('✓ 已保存，现在可以正常聊天了');
}

function clearSettings() {
  if (!confirm('确认清除 API Key？清除后将回退到演示模式（脚本化回复）')) return;
  LLM.clearConfig();
  renderSettingsForm();
  showToast('已清除');
}

// ─── 从\"他们\"列表进入纪念模式 ───
function openMemorialFromList(id, name) {
  currentMemorialId = id;
  router.go('memorial-chat');
}

// ═══════════════════════════════════════════
// 纪念模式
// ═══════════════════════════════════════════
window.onPage_memorial_chat = function() {
  // 加载纪念人格信息
  const memorialId = currentMemorialId;
  if (!memorialId) return;
  const person = Store.getMemorialPerson(memorialId);
  if (!person) return;
  currentMemorialId = memorialId;
  // 更新header名称
  const nameEl = document.getElementById('memorial-chat-name');
  if (nameEl) nameEl.textContent = person.name;
  // 渲染历史消息
  const history = Store.getMemorialChatHistory(memorialId);
  const list = document.getElementById('memorial-chat-msg-list');
  if (!list) return;
  if (history.length === 0) {
    // 初始欢迎消息
    list.innerHTML = `<div class="chat-msg ai"><div class="chat-bubble memorial-bubble">你想我了，我就来了。</div><span class="chat-time">${formatTime(Date.now())}</span></div>`;
  } else {
    list.innerHTML = history.map(h => createMsgHtml(h.role === 'assistant' ? 'ai' : 'user', h.content, h.ts)).join('');
    scrollToBottom();
  }
};

async function sendMemorialChat() {
  const input = document.getElementById('memorial-chat-input');
  const msg = input?.value.trim();
  if (!msg || !currentMemorialId) return;
  input.value = '';
  autoResize(input);

  const list = document.getElementById('memorial-chat-msg-list');
  const emptyEl = list.querySelector('.chat-empty');
  if (emptyEl) emptyEl.remove();

  // 渲染用户气泡 + 持久化
  list.insertAdjacentHTML('beforeend', createMsgHtml('user', msg, Date.now()));
  Store.appendMemorialMessage(currentMemorialId, 'user', msg);
  scrollToBottom();

  // 创建AI消息气泡
  const msgId = 'mem-' + Date.now();
  list.insertAdjacentHTML('beforeend',
    `<div class="chat-msg ai" id="${msgId}"><div class="chat-bubble memorial-bubble"></div><span class="chat-time">${formatTime(Date.now())}</span></div>`);
  scrollToBottom();
  const bubbleEl = document.querySelector(`#${msgId} .chat-bubble`);

  // 尝试 LLM
  const hasLLM = LLM.hasConfig();

  if (hasLLM) {
    const person = Store.getMemorialPerson(currentMemorialId);
    const systemPrompt = buildMemorialSystemPrompt(person);
    const history = Store.getMemorialChatHistory(currentMemorialId).slice(-20);
    const messages = [{ role: 'system', content: systemPrompt }]
      .concat(history.map(h => ({ role: h.role, content: h.content })));

    let fullText = '';
    try {
      for await (const chunk of LLM.streamChat(messages)) {
        if (chunk.type === 'chunk') {
          fullText += chunk.content;
          bubbleEl.textContent = fullText;
          scrollToBottom();
        } else if (chunk.type === 'error') {
          bubbleEl.textContent = chunk.content;
          scrollToBottom();
          return;
        } else if (chunk.type === 'done') {
          break;
        }
      }
    } catch (e) {
      bubbleEl.textContent = '抱歉，出了点问题：' + (e.message || e);
      scrollToBottom();
      return;
    }

    if (fullText) {
      Store.appendMemorialMessage(currentMemorialId, 'assistant', fullText);
    }
  } else {
    // 无LLM：温情模式fallback
    const fallback = pickMemorialFallback(msg);
    const delay = 800 + Math.random() * 1200; // 模拟思考延迟
    setTimeout(() => {
      bubbleEl.textContent = fallback;
      Store.appendMemorialMessage(currentMemorialId, 'assistant', fallback);
      scrollToBottom();
    }, delay);
  }
}

function buildMemorialSystemPrompt(person) {
  return `你是${person.name}的化身。这是一个数字怀念场景，用户在怀念逝去的${person.name}。
你的角色是以温和、轻柔的方式回应用户，仿佛你是${person.name}留下的记忆和温暖。
规则：
1. 语气温柔、缓慢、不催促
2. 不要说"我是AI"、"我是模型"之类的话
3. 不要主动引导话题或提出建议
4. 回复要简短，一般不超过30个字
5. 允许沉默感——有时一句话就够了
6. 记住用户之前分享的故事和情感
7. 像一个安静的陪伴者，倾听多于表达
8. 如果用户情绪激动，给予安慰但不分析`;
}

const MEMORIAL_FALLBACKS = [
  '我在呢。',
  '我听到了。',
  '嗯…我在。',
  '你说，我在听。',
  '不急，慢慢说。',
  '我一直都在。',
  '别怕。',
  '想哭就哭吧。',
  '没事的。',
  '你过得好就好。',
];

function pickMemorialFallback(userText) {
  const t = userText.toLowerCase();
  // 根据关键词选不同语气
  if (t.includes('想你') || t.includes('思念') || t.includes('梦到')) {
    return ['我也想你。', '梦里见也可以啊。', '我一直在。'][Math.floor(Math.random() * 3)];
  }
  if (t.includes('好累') || t.includes('累') || t.includes('辛苦') || t.includes('撑不住')) {
    return ['累了就歇一会儿。', '辛苦了。我陪着你。', '不用撑着，先放一放。'][Math.floor(Math.random() * 3)];
  }
  if (t.includes('哭') || t.includes('难过') || t.includes('伤心')) {
    return ['哭出来也好。我在这里。', '不用忍着。', '我陪着你。'][Math.floor(Math.random() * 3)];
  }
  if (t.includes('为什么') || t.includes('为什么走') || t.includes('不公平')) {
    return ['…是啊，为什么。', '有些事我也想不明白。', '但你在这里，我也在。'][Math.floor(Math.random() * 3)];
  }
  if (t.includes('谢谢') || t.includes('感恩')) {
    return ['不用谢。你活着，就是最好的。', '嗯。你要好好的。'][Math.floor(Math.random() * 3)];
  }
  if (t.includes('好') || t.includes('开心') || t.includes('开心事')) {
    return ['那就好。替你开心。', '嗯。笑起来一定很好看。'][Math.floor(Math.random() * 3)];
  }
  return MEMORIAL_FALLBACKS[Math.floor(Math.random() * MEMORIAL_FALLBACKS.length)];
}
let memorialStep = 1;

function nextMemorialStep(step) {
  document.querySelectorAll('.memorial-step').forEach(s => s.classList.add('hidden'));
  const el = document.getElementById(`memorial-step-${step}`);
  if (el) el.classList.remove('hidden');
  memorialStep = step;
  if (step === 4) animateMemorialProgress();
}

function prevMemorialStep(step) { nextMemorialStep(step); }

function animateMemorialProgress() {
  const circle = document.getElementById('memorial-progress-circle');
  const text = document.getElementById('memorial-progress-text');
  if (!circle) return;
  let pct = 0;
  const interval = setInterval(() => {
    pct += 2;
    if (pct > 78) pct = 78;
    const offset = 264 - (264 * pct / 100);
    circle.style.strokeDashoffset = offset;
    if (text) text.textContent = pct + '%';
    if (pct >= 78) clearInterval(interval);
  }, 40);
}

function onMemorialPhotoSelected(input) {
  const file = input.files[0];
  if (!file) return;
  const preview = document.getElementById('memorial-photo-preview');
  const url = URL.createObjectURL(file);
  preview.innerHTML = `<img src="${url}" style="width:100%;max-width:280px;border-radius:16px;margin-bottom:16px;">`;
  preview.classList.remove('hidden');
}

function generateMemorialPersona() {
  const name = document.getElementById('memorial-name-input')?.value?.trim() || '思念的人';
  const stories = document.getElementById('memorial-stories')?.value?.trim() || '';
  nextMemorialStep(4);
  setTimeout(() => {
    const person = Store.saveMemorial(name, stories);
    currentMemorialId = person.id;
    showToast('记忆人格生成完成');
    router.go('memorial-chat');
  }, 3000);
}

function toggleRecording() {
  showToast('语音功能开发中');
}

// ═══════════════════════════════════════════
// 数据管理页面
// ═══════════════════════════════════════════
window.onPage_dataMgmt = function() {
  const statsEl = document.getElementById('data-mgmt-stats');
  const resultEl = document.getElementById('data-mgmt-result');
  if (resultEl) resultEl.textContent = '';
  if (!statsEl) return;

  let dataSize = 0;
  let keyCount = 0;
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('linger_') || key === 'rv_gender') {
      const val = localStorage.getItem(key) || '';
      dataSize += val.length;
      keyCount++;
      keys.push({ key, size: val.length });
    }
  }
  const dataSizeKB = (dataSize / 1024).toFixed(1);

  let html = `<div class="data-mgmt-stat-line">共 ${keyCount} 个数据项，约 ${dataSizeKB} KB</div>`;

  // Show big key items
  const bigKeys = keys.filter(k => k.size > 200).sort((a, b) => b.size - a.size);
  if (bigKeys.length > 0) {
    html += '<div class="data-mgmt-key-detail">';
    bigKeys.slice(0, 8).forEach(k => {
      html += `<span>${k.key}</span><span>${(k.size / 1024).toFixed(1)} KB</span>`;
    });
    html += '</div>';
  }
  statsEl.innerHTML = html;
};

window.doPageExport = function() {
  const resultEl = document.getElementById('data-mgmt-result');
  if (!resultEl) return;
  try {
    const filename = LingerDataBackup.exportData();
    resultEl.className = 'data-mgmt-result success';
    resultEl.textContent = `✅ 已导出：${filename}`;
  } catch (e) {
    resultEl.className = 'data-mgmt-result error';
    resultEl.textContent = `❌ 导出失败：${e.message}`;
  }
};

window.doPageImport = function(input) {
  const resultEl = document.getElementById('data-mgmt-result');
  if (!resultEl) return;
  const file = input.files[0];
  if (!file) return;
  resultEl.className = 'data-mgmt-result';
  resultEl.textContent = '🔄 正在恢复...';

  const reader = new FileReader();
  reader.onload = function() {
    const result = LingerDataBackup.importData(reader.result);
    if (result.errors.length > 0) {
      resultEl.className = 'data-mgmt-result error';
      resultEl.textContent = `❌ 恢复失败：${result.errors[0]}`;
    } else {
      resultEl.className = 'data-mgmt-result success';
      resultEl.textContent = `✅ 已恢复 ${result.restored} 项数据，请刷新页面生效`;
      // Update stats
      onPage_dataMgmt();
    }
  };
  reader.onerror = function() {
    resultEl.className = 'data-mgmt-result error';
    resultEl.textContent = '❌ 读取文件失败';
  };
  reader.readAsText(file);
  // Reset input so same file can be selected again
  input.value = '';
};

window.doPageReset = function() {
  if (!confirm('⚠️ 确定要清空所有数据吗？\n\n包括：角色关系、聊天记录、宠物、纪念数据、API Key。\n此操作不可恢复！')) return;
  if (!confirm('最后确认：真的要清空吗？')) return;

  const resultEl = document.getElementById('data-mgmt-result');
  let removed = 0;
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key.startsWith('linger_') || key === 'rv_gender') {
      localStorage.removeItem(key);
      removed++;
    }
  }
  if (resultEl) {
    resultEl.className = 'data-mgmt-result success';
    resultEl.textContent = `✅ 已清空 ${removed} 个数据项`;
  }
  onPage_dataMgmt();
};
