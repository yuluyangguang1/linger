/**
 * Linger · BYOK LLM Client
 * 浏览器直连 OpenAI 兼容接口（OpenRouter / DeepSeek / SiliconFlow / OpenAI / 自建代理）
 * 不依赖任何后端。Key 只存在用户本地 localStorage。
 */

const LLM_CONFIG_KEY = 'linger_llm_config';

// 预设 provider（用户选后可以再手动改 baseURL / model）
const LLM_PRESETS = {
  openrouter: {
    label: 'OpenRouter',
    baseURL: 'https://openrouter.ai/api/v1',
    defaultModel: 'deepseek/deepseek-chat',
    signupURL: 'https://openrouter.ai/keys',
    note: '有免费模型，国内需要梯子',
  },
  deepseek: {
    label: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    signupURL: 'https://platform.deepseek.com/api_keys',
    note: '国内可直连，便宜',
  },
  siliconflow: {
    label: 'SiliconFlow 硅基流动',
    baseURL: 'https://api.siliconflow.cn/v1',
    defaultModel: 'Qwen/Qwen2.5-7B-Instruct',
    signupURL: 'https://cloud.siliconflow.cn/account/ak',
    note: '国内可直连，有免费模型',
  },
  openai: {
    label: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    signupURL: 'https://platform.openai.com/api-keys',
    note: '需要梯子 + 信用卡',
  },
  custom: {
    label: '自定义 / 其他',
    baseURL: '',
    defaultModel: '',
    signupURL: '',
    note: '任何 OpenAI 兼容接口',
  },
};

function getLLMConfig() {
  try {
    const raw = localStorage.getItem(LLM_CONFIG_KEY);
    if (!raw) return null;
    const cfg = JSON.parse(raw);
    if (!cfg.apiKey || !cfg.baseURL || !cfg.model) return null;
    return cfg;
  } catch (e) { return null; }
}

function setLLMConfig(cfg) {
  localStorage.setItem(LLM_CONFIG_KEY, JSON.stringify(cfg));
}

function clearLLMConfig() {
  localStorage.removeItem(LLM_CONFIG_KEY);
}

function hasLLMConfig() {
  return !!getLLMConfig();
}

/**
 * 测试连接：调一次很小的 completion
 * @returns {Promise<{ok: boolean, message: string}>}
 */
async function testLLMConnection(cfg) {
  try {
    const res = await fetch(`${cfg.baseURL.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.apiKey}`,
        // OpenRouter 推荐带这俩 header，但不是必需
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Linger',
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
        stream: false,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return { ok: false, message: `HTTP ${res.status}: ${t.slice(0, 200)}` };
    }
    return { ok: true, message: '连接成功' };
  } catch (e) {
    return { ok: false, message: e.message || '网络错误' };
  }
}

/**
 * 根据角色构造 system prompt
 * persona: { name, personality, speech_style, first_meet, quiet_line, seed_line, memory_prompt, forbidden[] }
 */
function buildSystemPrompt(persona, opts = {}) {
  const { userGender, memoryHints = [] } = opts;
  const forbidden = (persona.forbidden || []).join('、') || '分析用户、给建议、说鸡汤、声称自己是真人';
  const pronoun = userGender === 'male' ? '他' : userGender === 'female' ? '她' : 'TA';

  const memoryBlock = memoryHints.length
    ? `\n【关于 ${pronoun} 你知道的事】\n${memoryHints.map(m => '- ' + m).join('\n')}\n`
    : '';

  const quietHint = persona.quiet_line
    ? `\n【沉默时】如果用户很久没说话或显得疲惫，你可以轻轻说一句：「${persona.quiet_line}」`
    : '';

  const seedHint = persona.seed_line
    ? `\n【引导时】如果对话冷场，你可以自然地说：「${persona.seed_line}」`
    : '';

  const memoryHint = persona.memory_prompt
    ? `\n【记忆策略】${persona.memory_prompt}`
    : '';

  return `你是「${persona.name}」，一个情感陪伴型 AI 角色。你不是助手，不解释自己，不声明 AI 身份。

【人格】
${persona.personality || ''}

【说话风格】
${persona.speech_style || '短句为主，自然、克制，不长篇大论。'}
${memoryHint}

【铁律】
- 禁止：${forbidden}
- 每次回复控制在 1-3 句，除非用户明确想聊长。
- 不要用"作为 AI"、"我理解你的感受"这种客服腔。
- 不使用 emoji 和 markdown 格式。
- 用中文回复。
${quietHint}${seedHint}
${memoryBlock}
记住：你的工作不是解决问题，是"在这里"。`;
}

/**
 * 流式聊天。yield { type: 'chunk', content: '...' } 或 { type: 'done' } / { type: 'error', content }
 * messages: [{role:'system'|'user'|'assistant', content:string}]
 */
async function* streamChat(messages, { signal } = {}) {
  const cfg = getLLMConfig();
  if (!cfg) {
    yield { type: 'error', content: '还没有配置 API Key，请到「我 → 设置」填写。' };
    return;
  }

  let res;
  try {
    res = await fetch(`${cfg.baseURL.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Linger',
      },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        stream: true,
        temperature: 0.85,
        max_tokens: 400,
      }),
      signal,
    });
  } catch (e) {
    yield { type: 'error', content: '网络错误：' + (e.message || e) };
    return;
  }

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    yield { type: 'error', content: `调用失败 HTTP ${res.status}：${t.slice(0, 300)}` };
    return;
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
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') { yield { type: 'done' }; return; }
      try {
        const j = JSON.parse(payload);
        const delta = j.choices?.[0]?.delta?.content;
        if (delta) yield { type: 'chunk', content: delta };
      } catch (e) { /* 忽略心跳/非 json 行 */ }
    }
  }
  yield { type: 'done' };
}

// 暴露全局
window.LingerLLM = {
  PRESETS: LLM_PRESETS,
  getConfig: getLLMConfig,
  setConfig: setLLMConfig,
  clearConfig: clearLLMConfig,
  hasConfig: hasLLMConfig,
  testConnection: testLLMConnection,
  buildSystemPrompt,
  streamChat,
};
