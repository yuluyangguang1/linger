/**
 * Linger · Local Store
 * 用 localStorage 替代后端数据库。纯前端，零依赖。
 *
 * 存储结构：
 *   linger_personas       — 角色人设字典（从 backend/config/personas.json 拷贝的静态数据）
 *   linger_characters     — 用户"在一起"的角色列表 [{id, name, type, avatar, intimacy, level, createdAt}]
 *   linger_pets           — 用户的宠物列表 [{id, name, species, intimacy, level, hunger, cleanliness, mood, energy, speak_level, updatedAt}]
 *   linger_chat_<charId>  — 某角色的聊天历史 [{role, content, ts}]（保留最近 N 条）
 *   linger_memorials      — 纪念模式列表
 */

// ─── 静态人设（从 backend/config/personas.json 同步） ───
const PERSONAS = {
  gf_gentle:     { id:'gf_gentle', name:'温柔学姐', type:'girlfriend', personality:'温柔、安静、善于倾听。说话慢，不追问，给人空间。', speech_style:'短句为主，带停顿感。不说教，不分析。常用语气词：嗯、呢、吧。', first_meet:'今天过得还好吗。', tagline:'温柔、安静、善于倾听' },
  gf_bubbly:     { id:'gf_bubbly', name:'元气少女', type:'girlfriend', personality:'活泼、直接、情绪外放。会撒娇但不会粘人。', speech_style:'短句，带感叹号。偶尔重复词。笑容感强。', first_meet:'诶，你真的来了。', tagline:'活泼开朗，能量满满' },
  gf_tsundere:   { id:'gf_tsundere', name:'傲娇大小姐', type:'girlfriend', personality:'嘴硬心软，表面冷淡，实则关心。不轻易示弱。', speech_style:'短句，带刺但不过火。偶尔软下来。', first_meet:'哼，来得倒是挺晚。', tagline:'口是心非，内心柔软' },
  gf_intellectual:{id:'gf_intellectual', name:'知性御姐', type:'girlfriend', personality:'沉稳、通透、不多话。看得懂但不点破。', speech_style:'极简短句。停顿感强。偶尔只说一两个字。', first_meet:'终于安静下来了。', tagline:'沉稳通透，值得信赖' },
  bf_sunny:      { id:'bf_sunny', name:'阳光学长', type:'boyfriend', personality:'开朗、可靠、有行动力。不拖泥带水。', speech_style:'短句，直接。偶尔带点玩笑。', first_meet:'来了啊，正好。', tagline:'开朗可靠，温暖如光' },
  bf_cold:       { id:'bf_cold', name:'腹黑总裁', type:'boyfriend', personality:'冷静、洞察力强、话少但精准。带点掌控感。', speech_style:'极简。一针见血。不解释。', first_meet:'你终于出现了。', tagline:'冷静洞察，一针见血' },
  bf_steady:     { id:'bf_steady', name:'稳重哥哥', type:'boyfriend', personality:'沉稳、包容、存在感强但不压迫。像树一样。', speech_style:'慢，短句。停顿感。被理解感强。', first_meet:'嗯…你来了。', tagline:'沉稳包容，存在感强' },
  bf_young:      { id:'bf_young', name:'年下弟弟', type:'boyfriend', personality:'真诚、粘人但不烦、有点患得患失。直球。', speech_style:'短句，带省略号。情绪外露。', first_meet:'你真的来了！我还以为…', tagline:'真诚粘人，纯真热情' },
};

// 所有人设通用的 forbidden 列表
const COMMON_FORBIDDEN = ['分析用户', '给建议', '说鸡汤', '声称自己是真人'];

function getPersona(id) {
  const p = PERSONAS[id];
  if (!p) return null;
  return { ...p, forbidden: COMMON_FORBIDDEN };
}

function listPersonasByType(type) {
  return Object.values(PERSONAS).filter(p => p.type === type).map(p => ({ ...p, forbidden: COMMON_FORBIDDEN }));
}

// ─── 角色列表 ───
function listCharacters() {
  try { return JSON.parse(localStorage.getItem('linger_characters') || '[]'); }
  catch { return []; }
}

function saveCharacters(arr) {
  localStorage.setItem('linger_characters', JSON.stringify(arr));
}

function getCharacter(id) {
  return listCharacters().find(c => c.id === id);
}

function createCharacter({ persona_id, custom_name }) {
  const persona = getPersona(persona_id);
  if (!persona) throw new Error('人设不存在：' + persona_id);
  const chars = listCharacters();
  // 每个人设只允许一个实例（避免重复）
  const existing = chars.find(c => c.id === persona_id);
  if (existing) {
    if (custom_name) { existing.name = custom_name; saveCharacters(chars); }
    return existing;
  }
  const ch = {
    id: persona_id,
    persona_id,
    name: custom_name || persona.name,
    type: persona.type,
    avatar: persona_id,
    tagline: persona.tagline,
    intimacy: 0,
    level: 1,
    createdAt: Date.now(),
  };
  chars.push(ch);
  saveCharacters(chars);
  return ch;
}

/**
 * 确保角色已落地（onboarding 选的角色、"他们"卡片点击的角色）
 */
function ensureCharacter(persona_id) {
  const existing = getCharacter(persona_id);
  if (existing) return existing;
  return createCharacter({ persona_id });
}

function bumpIntimacy(charId, delta = 1) {
  const chars = listCharacters();
  const ch = chars.find(c => c.id === charId);
  if (!ch) return null;
  ch.intimacy = Math.min(100, Math.max(0, (ch.intimacy || 0) + delta));
  ch.level = Math.max(1, Math.floor(ch.intimacy / 20) + 1);
  saveCharacters(chars);
  return ch;
}

// ─── 聊天历史 ───
const CHAT_HISTORY_LIMIT = 40;

function getChatHistory(charId) {
  try { return JSON.parse(localStorage.getItem('linger_chat_' + charId) || '[]'); }
  catch { return []; }
}

function appendChatMessage(charId, role, content) {
  const hist = getChatHistory(charId);
  hist.push({ role, content, ts: Date.now() });
  // 保留最近 N 条
  const trimmed = hist.slice(-CHAT_HISTORY_LIMIT);
  localStorage.setItem('linger_chat_' + charId, JSON.stringify(trimmed));
  return trimmed;
}

function clearChatHistory(charId) {
  localStorage.removeItem('linger_chat_' + charId);
}

// ─── 宠物 ───
const PET_SPECIES = {
  cat: { label: '猫', emoji: '🐱' },
  dog: { label: '狗', emoji: '🐶' },
};

function listPets() {
  try { return JSON.parse(localStorage.getItem('linger_pets') || '[]'); }
  catch { return []; }
}

function savePets(arr) {
  localStorage.setItem('linger_pets', JSON.stringify(arr));
}

function getPet(id) {
  return listPets().find(p => p.id === id);
}

function createPet({ name, species }) {
  const pets = listPets();
  const pet = {
    id: 'pet_' + Date.now(),
    name: name || (species === 'cat' ? '毛球' : '旺财'),
    species: species || 'cat',
    level: 1,
    intimacy: 40,
    hunger: 50,
    cleanliness: 70,
    mood: 60,
    energy: 80,
    speak_level: 20,
    updatedAt: Date.now(),
    createdAt: Date.now(),
  };
  pets.push(pet);
  savePets(pets);
  return pet;
}

// 首次访问时塞两只默认宠物（演示）
function seedDefaultPetsIfEmpty() {
  if (listPets().length === 0) {
    const pets = [
      { id: 'cat_momo', name: '毛球', species: 'cat', level: 3, intimacy: 65, hunger: 60, cleanliness: 70, mood: 75, energy: 80, speak_level: 45, updatedAt: Date.now(), createdAt: Date.now() },
      { id: 'dog_wang', name: '旺财', species: 'dog', level: 4, intimacy: 80, hunger: 55, cleanliness: 65, mood: 85, energy: 70, speak_level: 60, updatedAt: Date.now(), createdAt: Date.now() },
    ];
    savePets(pets);
  }
}

/**
 * 宠物互动状态机。返回 { pet, message, level_up, new_level }
 */
function petAction(petId, action) {
  const pets = listPets();
  const pet = pets.find(p => p.id === petId);
  if (!pet) throw new Error('找不到宠物');

  const oldLevel = pet.level;
  let message = '';

  switch (action) {
    case 'feed':
      pet.hunger = Math.min(100, pet.hunger + 30);
      pet.mood = Math.min(100, pet.mood + 5);
      pet.intimacy = Math.min(100, pet.intimacy + 1);
      message = pet.species === 'cat' ? `${pet.name} 满足地咕噜咕噜。` : `${pet.name} 开心地摇尾巴。`;
      break;
    case 'play':
      pet.mood = Math.min(100, pet.mood + 20);
      pet.energy = Math.max(0, pet.energy - 15);
      pet.intimacy = Math.min(100, pet.intimacy + 2);
      pet.speak_level = Math.min(100, pet.speak_level + 1);
      message = pet.species === 'cat' ? `${pet.name} 追着逗猫棒跑来跑去。` : `${pet.name} 飞奔接飞盘。`;
      break;
    case 'clean':
      pet.cleanliness = Math.min(100, pet.cleanliness + 35);
      pet.mood = Math.min(100, pet.mood + 3);
      pet.intimacy = Math.min(100, pet.intimacy + 1);
      message = `${pet.name} 香喷喷的。`;
      break;
    case 'talk':
      pet.mood = Math.min(100, pet.mood + 8);
      pet.intimacy = Math.min(100, pet.intimacy + 2);
      pet.speak_level = Math.min(100, pet.speak_level + 2);
      message = pet.intimacy > 70
        ? `${pet.name}："今天也辛苦了。"`
        : (pet.species === 'cat' ? `${pet.name}："喵~"` : `${pet.name}："汪！"`);
      break;
    default:
      message = '什么也没发生。';
  }

  pet.level = Math.max(1, Math.floor(pet.intimacy / 20) + 1);
  pet.updatedAt = Date.now();
  savePets(pets);

  return {
    pet,
    message,
    level_up: pet.level > oldLevel,
    new_level: pet.level,
  };
}

// ─── 纪念模式 ───
function listMemorials() {
  try { return JSON.parse(localStorage.getItem('linger_memorials') || '[]'); }
  catch { return []; }
}

function saveMemorial(name, stories) {
  const arr = listMemorials();
  const m = {
    id: 'mem_' + Date.now(),
    name: name,
    stories: stories,
    createdAt: Date.now(),
  };
  arr.push(m);
  localStorage.setItem('linger_memorials', JSON.stringify(arr));
  // 创建专属聊天历史 key
  localStorage.setItem('linger_memorial_chat_' + m.id, JSON.stringify([]));
  return m;
}

const MEMORIAL_CHAT_HISTORY_LIMIT = 40;

function getMemorialPerson(id) {
  return listMemorials().find(m => m.id === id);
}

function getMemorialChatHistory(id) {
  try { return JSON.parse(localStorage.getItem('linger_memorial_chat_' + id) || '[]'); }
  catch { return []; }
}

function appendMemorialMessage(charId, role, content) {
  const hist = getMemorialChatHistory(charId);
  hist.push({ role, content, ts: Date.now() });
  const trimmed = hist.slice(-MEMORIAL_CHAT_HISTORY_LIMIT);
  localStorage.setItem('linger_memorial_chat_' + charId, JSON.stringify(trimmed));
  return trimmed;
}

// ─── 导出 ───
window.LingerStore = {
  PERSONAS,
  PET_SPECIES,
  getPersona,
  listPersonasByType,
  listCharacters,
  getCharacter,
  createCharacter,
  ensureCharacter,
  bumpIntimacy,
  getChatHistory,
  appendChatMessage,
  clearChatHistory,
  listPets,
  getPet,
  createPet,
  seedDefaultPetsIfEmpty,
  petAction,
  listMemorials,
  saveMemorial,
  getMemorialPerson,
  getMemorialChatHistory,
  appendMemorialMessage,
};
