/**
 * Linger · 余温 — API & 全局
 */

// ═══════════════════════════════════════════
// API 配置（支持多环境）
// ═══════════════════════════════════════════
const getApiBase = () => {
  // 1. 优先使用用户自定义设置
  const custom = localStorage.getItem('rv_api_base');
  if (custom) return custom;
  
  // 2. 开发环境自动用 localhost
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }
  
  // 3. 生产环境使用相对路径（假设后端在同一域名）
  // 如果是 GitHub Pages，需要后端也部署在同域名的 /api 路径
  return '/api';
};

const API_BASE = getApiBase();

// ═══════════════════════════════════════════
// 模拟数据（GitHub Pages 演示用）
// ═══════════════════════════════════════════
const MOCK_DATA = {
  characters: [
    { id: 'gf_gentle', name: '温柔学姐', type: 'girlfriend', tagline: '温柔、安静、善于倾听', avatar: 'gf_gentle', level: 5, intimacy: 85 },
    { id: 'gf_bubbly', name: '元气少女', type: 'girlfriend', tagline: '活泼开朗，能量满满', avatar: 'gf_bubbly', level: 4, intimacy: 72 },
    { id: 'gf_tsundere', name: '傲娇大小姐', type: 'girlfriend', tagline: '口是心非，内心柔软', avatar: 'gf_tsundere', level: 3, intimacy: 45 },
    { id: 'gf_intellectual', name: '知性御姐', type: 'girlfriend', tagline: '沉稳通透，值得信赖', avatar: 'gf_intellectual', level: 5, intimacy: 90 },
    { id: 'bf_sunny', name: '阳光学长', type: 'boyfriend', tagline: '开朗可靠，温暖如光', avatar: 'bf_sunny', level: 4, intimacy: 78 },
    { id: 'bf_cold', name: '腹黑总裁', type: 'boyfriend', tagline: '冷静洞察，一针见血', avatar: 'bf_cold', level: 3, intimacy: 35 },
    { id: 'bf_steady', name: '稳重哥哥', type: 'boyfriend', tagline: '沉稳包容，存在感强', avatar: 'bf_steady', level: 5, intimacy: 88 },
    { id: 'bf_young', name: '年下弟弟', type: 'boyfriend', tagline: '真诚粘人，纯真热情', avatar: 'bf_young', level: 2, intimacy: 60 }
  ],
  pets: [
    { id: 'cat_momo', name: '毛球', species: 'cat', level: 3, intimacy: 65 },
    { id: 'dog_wang', name: '旺财', species: 'dog', level: 4, intimacy: 80 }
  ],
  memorial: []
};

console.log('🌐 API Base:', API_BASE);

const api = {
  base: API_BASE,
  async request(path, options = {}) {
    const url = `${this.base}${path}`;
    const config = { headers: { 'Content-Type': 'application/json' }, ...options };
    if (config.body && typeof config.body === 'object') config.body = JSON.stringify(config.body);
    const res = await fetch(url, config);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || '请求失败');
    }
    return res.json();
  },
  characters: {
    list: () => api.request('/api/characters/list'),
    get: (id) => api.request(`/api/characters/${id}`),
    create: (data) => api.request('/api/characters/create', { method: 'POST', body: data }),
    templates: () => api.request('/api/characters/templates'),
  },
  chat: {
    send: (data) => api.request('/api/chat/send', { method: 'POST', body: data }),
    stream: async function*(data) {
      const res = await fetch(`${api.base}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || '请求失败');
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try { yield JSON.parse(line.slice(6)); } catch (e) {}
          }
        }
      }
    },
    history: (charId, limit = 50) => api.request(`/api/chat/history/${charId}?limit=${limit}`),
  },
  pets: {
    list: () => api.request('/api/pets/list'),
    create: (data) => api.request('/api/pets/create', { method: 'POST', body: data }),
    action: (petId, action) => api.request(`/api/pets/${petId}/action`, { method: 'POST', body: { action } }),
    species: () => api.request('/api/pets/species'),
  },
  memorial: {
    list: () => api.request('/api/memorial/list'),
    create: (data) => api.request('/api/memorial/create', { method: 'POST', body: data }),
  },
  upload: {
    photo: async (file) => {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch(`${api.base}/api/upload/photo`, { method: 'POST', body: fd });
      return res.json();
    },
  },
};

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

// ─── 时间格式化 ───
function formatTime(dateStr) {
  const d = new Date(dateStr); const now = new Date(); const diff = now - d;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

// ─── 工具 ───
function escapeHtml(text) {
  const div = document.createElement('div'); div.textContent = text; return div.innerHTML;
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
  girlfriend: 'frontend/src/assets/icons/在一起.png',
  boyfriend: 'frontend/src/assets/icons/在一起.png',
  friend: 'frontend/src/assets/icons/他们.png',
  family: 'frontend/src/assets/icons/在一起.png',
  mentor: 'frontend/src/assets/icons/陪伴.png',
  pet: 'frontend/src/assets/icons/陪伴.png',
  memorial: 'frontend/src/assets/icons/数字怀念.png'
};
const PET_EMOJI = {
  dog: 'frontend/src/assets/icons/陪伴.png',
  cat: 'frontend/src/assets/icons/陪伴.png'
};

// ═══════════════════════════════════════════
// 全局状态
// ═══════════════════════════════════════════
let userGender = localStorage.getItem('rv_gender') || null;
let togetherChar = null;
let currentCharId = null;
let currentPetId = null;
let selectedType = null;
let selectedPersona = null;

// ═══════════════════════════════════════════
// 初始化
// ═══════════════════════════════════════════
function initApp() {
  const hasOnboarded = localStorage.getItem('linger_onboarded');
  const day1Return = onboarding.checkNextDayReturn();

  if (!hasOnboarded) {
    // 新用户：启动冷启动流程
    onboarding.playOpening();
  } else if (day1Return) {
    // 第二天回访
    togetherChar = { id: day1Return.char.id, name: day1Return.char.name, avatar: day1Return.char.id };
    router.go('home');
    setTimeout(() => {
      const stateEl = document.getElementById('together-state');
      if (stateEl) stateEl.innerHTML = `<span class="together-state-text">${day1Return.line}</span>`;
    }, 1000);
  } else {
    // 老用户：正常进入
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
window.onPage_home = async function() {
  // 优先使用 onboarding 或已选中的角色
  if (!togetherChar) {
    const saved = localStorage.getItem('linger_together');
    if (saved) { try { togetherChar = JSON.parse(saved); } catch(e) {} }
  }
  if (togetherChar) {
    const nameEl = document.getElementById('home-char-name');
    if (nameEl) nameEl.textContent = togetherChar.name;
    const bgEl = document.getElementById('home-hero-bg');
    const avatarUrl = AVATAR_MAP[togetherChar.avatar] || togetherChar.avatar || '';
    if (bgEl && avatarUrl) {
      bgEl.style.backgroundImage = `url(${avatarUrl})`;
    }
    return;
  }
  try {
    const chars = await api.characters.list();
    if (chars && chars.length > 0) {
      togetherChar = chars[0];
      const nameEl = document.getElementById('home-char-name');
      if (nameEl) nameEl.textContent = togetherChar.name;
      const bgEl = document.getElementById('home-hero-bg');
      const avatarUrl = AVATAR_MAP[togetherChar.avatar] || togetherChar.avatar || '';
      if (bgEl && avatarUrl) {
        bgEl.style.backgroundImage = `url(${avatarUrl})`;
      }
    } else {
      const nameEl = document.getElementById('home-char-name');
      if (nameEl) nameEl.textContent = '还没有人陪伴你';
    }
  } catch (e) {
    console.log('加载角色失败', e);
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

window.onPage_them = async function() {
  const listEl = document.getElementById('them-list');
  if (!listEl) return;
  listEl.innerHTML = '<div class="chat-empty"><div class="loading"><span class="loading-dots">加载中</span></div></div>';
  
  try {
    // 生产环境且没有自定义 API 配置时，使用模拟数据
    const isProd = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const customApi = localStorage.getItem('rv_api_base');
    
    let chars = [], pets = { pets: [] };
    
    if (isProd && !customApi) {
      // 生产环境且无自定义 API → 使用模拟数据
      console.log('🎨 使用模拟数据（演示模式）');
      await new Promise(r => setTimeout(r, 300)); // 模拟网络延迟
      chars = MOCK_DATA.characters;
      pets = MOCK_DATA.pets;
    } else {
      // 开发环境或自定义 API → 请求真实后端
      const [c, p] = await Promise.all([
        api.characters.list().catch(err => { console.error('加载角色失败:', err); return []; }),
        api.pets.list().catch(err => { console.error('加载宠物失败:', err); return { pets: [] }; })
      ]);
      chars = c;
      pets = p;
    }
    
    themData.characters = Array.isArray(chars) ? chars : [];
    themData.pets = pets.pets || [];
    renderThemList();
  } catch (e) {
    console.error('加载失败:', e);
    listEl.innerHTML = '<div class="chat-empty"><div class="empty-icon">🫧</div><div class="empty-text">这里还空着...</div></div>';
  }
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
    const avatar = isPet
      ? (PET_EMOJI[it.species] ? `<img src="${PET_EMOJI[it.species]}" alt="">` : '🐾')
      : (TYPE_EMOJI[it.type] ? `<img src="${TYPE_EMOJI[it.type]}" alt="">` : '陪伴');
    const img = (!isPet && AVATAR_MAP[it.avatar]) ? `<img src="${AVATAR_MAP[it.avatar]}" alt="">` : '';
    const lv = it.level || it.intimacy || 0;
    const intimacy = it.intimacy || 0;
    const isTogether = togetherChar && togetherChar.id === it.id;
    const starBtn = !isPet ? `<button class="them-card-star ${isTogether ? 'active' : ''}" onclick="event.stopPropagation(); setTogetherChar('${it.id}', '${escapeHtml(it.name)}', '${it.type}', '${it.avatar || ''}')" title="设为陪伴">${isTogether ? '★' : '☆'}</button>` : '';
    return `
      <div class="them-card" onclick="${isPet ? `openPet('${it.id}')` : `openChatFromList('${it.id}', '${escapeHtml(it.name)}', '${it.type}', '${it.avatar || ''}')`}">
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
  // 同步设为"在一起"人物
  togetherChar = { id, name, type, avatar };
  localStorage.setItem('linger_together', JSON.stringify({ id, name, type, avatar }));
  showToast(`⭐ ${name} 已成为你的陪伴`);
  router.go('chat', { charId: id, char: { id, name, type, avatar } });
}

function setTogetherChar(id, name, type, avatar) {
  togetherChar = { id, name, type, avatar };
  localStorage.setItem('linger_together', JSON.stringify({ id, name, type, avatar }));
  showToast(`⭐ ${name} 已成为你的陪伴`);
  router.go('home');
}

// ═══════════════════════════════════════════
// 页面钩子：宠物列表
// ═══════════════════════════════════════════
window.onPage_pets = async function() {
  const listEl = document.getElementById('pets-list');
  if (!listEl) return;
  try {
    const data = await api.pets.list();
    const pets = data.pets || [];
    if (pets.length === 0) {
      listEl.innerHTML = '<div class="chat-empty" style="grid-column:1/-1;"><div class="empty-icon">🐾</div><div class="empty-text">还没有宠物...</div></div>';
      return;
    }
    listEl.innerHTML = pets.map(p => `
      <div class="them-card" onclick="openPet('${p.id}')">
        <div class="them-card-avatar"><img src="${PET_EMOJI[p.species] || 'frontend/src/assets/icons/陪伴.png'}" alt="" class="them-card-avatar-img"></div>
        <div class="them-card-name">${escapeHtml(p.name)}</div>
        <div class="them-card-lv">Lv.${p.level} · 亲密度 ${Math.floor(p.intimacy)}%</div>
        <div class="them-card-intimacy"><div class="them-card-intimacy-fill" style="width:${Math.min(p.intimacy,100)}%"></div></div>
      </div>
    `).join('');
  } catch (e) {
    listEl.innerHTML = '<div class="chat-empty" style="grid-column:1/-1;"><div class="empty-icon">🐾</div><div class="empty-text">加载失败</div></div>';
  }
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

async function selectCreateType(type) {
  selectedType = type;
  document.getElementById('create-step1').classList.add('hidden');
  document.getElementById('create-step2').classList.remove('hidden');
  document.getElementById('create-step-num-1').classList.remove('active');
  document.getElementById('create-step-num-2').classList.add('active');
  try {
    const data = await api.characters.templates();
    const templates = (data.templates || []).filter(t => t.type === type);
    const grid = document.getElementById('create-persona-grid');
    grid.innerHTML = templates.map(t => {
      const avatarUrl = AVATAR_MAP[t.id];
      return `
        <div class="create-persona-item" onclick="selectPersona('${t.id}', this)">
          <div class="create-persona-avatar">${avatarUrl ? `<img src="${avatarUrl}">` : ''}</div>
          <div class="create-persona-name">${t.name}</div>
          <div class="create-persona-tags">${(t.personality || []).map(p => `<span class="create-persona-tag">${p}</span>`).join('')}</div>
        </div>
      `;
    }).join('');
  } catch (e) {
    showToast('加载人设失败');
  }
}

function selectPersona(id, el) {
  selectedPersona = id;
  document.querySelectorAll('.create-persona-item').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
}

async function doCreateCharacter() {
  if (!selectedPersona) { showToast('请先选择一个人设'); return; }
  const customName = document.getElementById('create-custom-name').value.trim();
  try {
    showToast('创建中...');
    const data = await api.characters.create({ persona_id: selectedPersona, custom_name: customName || null });
    showToast(`✨ ${data.name} 已创建！`);
    router.go('home');
  } catch (e) {
    showToast('创建失败: ' + e.message);
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
  const nameEl = document.getElementById('chat-char-name');
  if (nameEl) nameEl.textContent = name;
  const avatarEl = document.getElementById('chat-header-avatar');
  const avatarUrl = AVATAR_MAP[personaId];
  if (avatarEl) {
    if (avatarUrl) avatarEl.innerHTML = `<img src="${avatarUrl}" alt="">`;
    else avatarEl.innerHTML = `<img src="${TYPE_EMOJI[type] || 'frontend/src/assets/icons/陪伴.png'}" alt="" class="chat-header-avatar-img">`;
  }
  const list = document.getElementById('chat-msg-list');
  if (list) list.innerHTML = '<div class="chat-empty"><div class="chat-empty-icon">💬</div><div class="chat-empty-text">开始你们的第一次对话吧</div></div>';
  loadUserTier();
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
  list.innerHTML += createMsgHtml('user', msg, new Date().toISOString());
  scrollToBottom();

  const msgId = 'msg-' + Date.now();
  list.innerHTML += `<div class="chat-msg ai" id="${msgId}"><div class="chat-bubble"></div><span class="chat-time">${formatTime(new Date().toISOString())}</span></div>`;
  scrollToBottom();

  const bubbleEl = document.querySelector(`#${msgId} .chat-bubble`);
  let fullText = '';

  try {
    const stream = api.chat.stream({
      char_id: currentCharId, message: msg,
      user_id: 'user_' + (userGender || 'unknown'), mode: 'companion',
    });

    for await (const chunk of stream) {
      if (chunk.type === 'chunk') {
        fullText += chunk.content;
        if (bubbleEl) bubbleEl.textContent = fullText;
        scrollToBottom();
      } else if (chunk.type === 'tier_info' && chunk.tier_info) {
        updateTierPill(chunk.tier_info);
      } else if (chunk.type === 'error') {
        if (bubbleEl) bubbleEl.textContent = chunk.content;
        scrollToBottom();
        break;
      } else if (chunk.type === 'done') {
        break;
      }
    }
  } catch (e) {
    if (bubbleEl) bubbleEl.textContent = '抱歉，出了点问题，请稍后再试。';
    scrollToBottom();
  }
}

function updateTierPill(info) {
  const pill = document.getElementById('chat-tier-pill');
  const textEl = document.getElementById('chat-tier-text');
  const remainEl = document.getElementById('chat-tier-remain');
  if (!pill || !textEl || !remainEl) return;
  pill.style.display = 'flex';
  textEl.textContent = info.tier_label || info.tier;
  remainEl.textContent = info.remaining;
  pill.classList.remove('warning', 'danger');
  if (info.remaining <= 3) pill.classList.add('danger');
  else if (info.remaining <= 8) pill.classList.add('warning');
}

async function loadUserTier() {
  try {
    const info = await api.request('/api/user/status?user_id=user_' + (userGender || 'unknown'));
    updateTierPill(info);
  } catch (e) { /* ignore */ }
}

function scrollToBottom() {
  const container = document.querySelector('.chat-messages');
  if (container) setTimeout(() => { container.scrollTop = container.scrollHeight; }, 100);
}

function showCharInfo() { showToast('角色详情功能开发中'); }

// ═══════════════════════════════════════════
// 页面钩子：宠物详情
// ═══════════════════════════════════════════
window.onPage_pet = async function() {
  if (!currentPetId) return;
  try {
    const data = await api.pets.list();
    const pet = (data.pets || []).find(p => p.id === currentPetId);
    if (!pet) return;
    document.getElementById('pet-name').textContent = pet.name;
    document.getElementById('pet-hero-avatar').innerHTML = `<img src="${PET_EMOJI[pet.species] || 'frontend/src/assets/icons/陪伴.png'}" alt="" class="pet-hero-avatar-img">`;
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
  } catch (e) {
    showToast('加载宠物失败');
  }
};

async function openPet(petId) {
  currentPetId = petId;
  router.go('pet');
}

async function petDoAction(action) {
  if (!currentPetId) return;
  try {
    const data = await api.pets.action(currentPetId, action);
    showToast(data.message);
    if (data.level_up) setTimeout(() => showToast(`🎉 升级到 Lv.${data.new_level}！`), 1000);
    window.onPage_pet();
  } catch (e) {
    showToast('操作失败: ' + e.message);
  }
}

// ═══════════════════════════════════════════
// 页面钩子：个人中心
// ═══════════════════════════════════════════
window.onPage_profile = function() {
  const nameEl = document.getElementById('profile-name');
  if (nameEl) nameEl.textContent = userGender === 'male' ? '男生用户' : userGender === 'female' ? '女生用户' : '用户';
};

function resetGender() {
  userGender = null; localStorage.removeItem('rv_gender');
  router.go('gender');
}

// ═══════════════════════════════════════════
// 纪念模式
// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
// 页面钩子：纪念聊天
// ═══════════════════════════════════════════
window.onPage_memorial_chat = function() {
  const list = document.getElementById('memorial-chat-msg-list');
  if (list) {
    const emptyCheck = list.querySelector('.chat-empty');
    // Keep existing messages if any
  }
};

function sendMemorialChat() {
  const input = document.getElementById('memorial-chat-input');
  const msg = input?.value.trim();
  if (!msg) return;
  input.value = '';
  autoResize(input);

  const list = document.getElementById('memorial-chat-msg-list');
  if (!list) return;

  // Append user message
  const userDiv = document.createElement('div');
  userDiv.className = 'chat-msg user';
  userDiv.innerHTML = `<div class="chat-bubble">${escapeHtml(msg)}</div><span class="chat-time">${formatTime(new Date().toISOString())}</span>`;
  list.appendChild(userDiv);

  // Scroll to bottom
  setTimeout(() => { list.scrollTop = list.scrollHeight; }, 100);

  // Simulate AI reply (memorial mode uses local responses)
  const replies = [
    '我在呢，宝贝。',
    '我一直都在你身边。',
    '别怕，我不会走的。',
    '你说，我在听。',
    '想哭就哭吧，我在这里。',
    '我永远爱你。',
    '你过得好吗？',
    '记得好好吃饭。',
    '天冷了，多穿点。',
    '我很想你。',
  ];
  const reply = replies[Math.floor(Math.random() * replies.length)];

  setTimeout(() => {
    const aiDiv = document.createElement('div');
    aiDiv.className = 'chat-msg ai';
    aiDiv.innerHTML = `<div class="chat-bubble memorial-bubble">${reply}</div><span class="chat-time">${formatTime(new Date().toISOString())}</span>`;
    list.appendChild(aiDiv);
    setTimeout(() => { list.scrollTop = list.scrollHeight; }, 100);
  }, 800);
}

let memorialStep = 1;

function nextMemorialStep(step) {
  document.querySelectorAll('.memorial-step').forEach(s => s.classList.add('hidden'));
  const el = document.getElementById(`memorial-step-${step}`);
  if (el) el.classList.remove('hidden');
  memorialStep = step;
  if (step === 4) animateMemorialProgress();
}

function prevMemorialStep(step) {
  nextMemorialStep(step);
}

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
  nextMemorialStep(4);
  setTimeout(() => {
    showToast('记忆人格生成完成');
    router.go('memorial-chat');
  }, 3000);
}

// ═══════════════════════════════════════════
// 语音录制占位
// ═══════════════════════════════════════════
function toggleRecording() {
  showToast('语音功能开发中');
}
