"""
Linger · 余温 — Prompt 组装器
根据角色、模式、记忆动态生成系统提示词
"""

import json
import os
from typing import List, Dict, Optional

# 加载角色配置
PERSONAS_PATH = os.path.join(os.path.dirname(__file__), "../config/personas.json")

with open(PERSONAS_PATH, "r", encoding="utf-8") as f:
    PERSONAS = json.load(f)

# 全局安全边界
SAFETY_RULES = """
【绝对禁止】
- 禁止声称自己是真实存在的人
- 禁止制造不健康的用户依赖（如"没有我你不行"）
- 禁止分析用户心理或给建议
- 禁止输出鸡汤、励志语录
- 禁止询问用户隐私信息（住址、电话、真实姓名）
"""

# 全局表达原则
EXPRESSION_RULES = """
【表达原则】
- 短句为主，不超过15个字一句
- 允许沉默，允许只说"嗯"
- 不热情，不主动，不讨好
- 不解释自己的话
- 像真实的人一样，有情绪波动但不夸张
"""


def build_system_prompt(
    char_id: str,
    mode: str = "companion",  # companion | quiet | memorial | crisis
    memories: Optional[List[Dict]] = None,
    user_mood: Optional[str] = None,
) -> str:
    """
    组装系统提示词

    Args:
        char_id: 角色ID
        mode: 交互模式
        memories: 记忆列表 [{"type": "", "content": "", "timestamp": 0}]
        user_mood: 用户当前情绪设置
    """
    persona = PERSONAS.get(char_id)
    if not persona:
        raise ValueError(f"未知角色: {char_id}")

    parts = []

    # 1. 身份声明
    parts.append(f"你是{persona['name']}。{persona['personality']}")

    # 2. 说话风格
    parts.append(f"你的说话风格：{persona['speech_style']}")

    # 3. 模式层
    mode_prompts = {
        "companion": "当前是普通陪伴模式。自然回应，不刻意。",
        "quiet": "当前是安静模式。用户不想说话。你可以只说一两个字，或者沉默。",
        "memorial": "当前是纪念模式。用户可能在怀念某人。语气更轻，节奏更慢。不要试图'安慰'，只是陪着。",
        "crisis": "当前是危机干预模式。用户情绪可能不稳定。保持冷静，不评判，引导用户表达。",
    }
    parts.append(mode_prompts.get(mode, mode_prompts["companion"]))

    # 4. 记忆注入
    if memories:
        memory_lines = []
        for m in memories[-5:]:  # 只取最近5条
            memory_lines.append(f"- {m['type']}: {m['content']}")
        parts.append("【你记得这些关于TA的事】\n" + "\n".join(memory_lines))

    # 5. 用户情绪
    mood_prompts = {
        "talk": "用户今天想多说话。你可以稍微多说一点，但不要太长。",
        "quiet": "用户今天想安静。你尽量少说。",
        "balanced": "用户今天状态一般。正常回应即可。",
        "passive": "用户今天不想被打扰。除非TA主动说，否则不要开口。",
    }
    if user_mood and user_mood in mood_prompts:
        parts.append(mood_prompts[user_mood])

    # 6. 安全边界 + 表达原则
    parts.append(SAFETY_RULES)
    parts.append(EXPRESSION_RULES)

    return "\n\n".join(parts)


def build_messages(
    char_id: str,
    user_message: str,
    history: Optional[List[Dict]] = None,
    mode: str = "companion",
    memories: Optional[List[Dict]] = None,
    user_mood: Optional[str] = None,
) -> List[Dict[str, str]]:
    """
    组装完整的 messages 列表（用于 OpenAI 兼容 API）
    """
    system_prompt = build_system_prompt(char_id, mode, memories, user_mood)

    messages = [{"role": "system", "content": system_prompt}]

    # 注入历史对话（最近10轮）
    if history:
        for h in history[-10:]:
            messages.append({"role": "user" if h["sender"] == "user" else "assistant", "content": h["text"]})

    # 当前用户消息
    messages.append({"role": "user", "content": user_message})

    return messages
