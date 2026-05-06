"""
Linger — 简单开发后端（无数据库）
用于前端开发和测试
"""

import os
import json
import uuid
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(title="Linger · 余温 Dev API", version="0.1.0")

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── 模拟数据 ───
CHARACTERS = [
    {
        "id": "char-1",
        "name": "小雪",
        "type": "girlfriend",
        "persona_id": "gf_gentle",
        "personality": ["温柔", "体贴"],
        "relationship_stage": "friend",
        "intimacy_level": 35,
        "total_messages": 42,
        "last_active": "2024-01-15T10:30:00Z",
    },
    {
        "id": "char-2",
        "name": "阿阳",
        "type": "boyfriend",
        "persona_id": "bf_sunny",
        "personality": ["阳光", "幽默"],
        "relationship_stage": "flirting",
        "intimacy_level": 55,
        "total_messages": 78,
        "last_active": "2024-01-15T14:20:00Z",
    },
]

# 存储聊天历史
CHAT_HISTORY = {
    "char-1": [
        {"role": "user", "content": "你好呀！", "created_at": "2024-01-15T10:00:00Z"},
        {"role": "ai", "content": "你好～今天过得怎么样？", "created_at": "2024-01-15T10:01:00Z"},
        {"role": "user", "content": "还不错，刚下班", "created_at": "2024-01-15T10:02:00Z"},
        {"role": "ai", "content": "辛苦啦～要不要听首歌放松一下？", "created_at": "2024-01-15T10:03:00Z"},
    ],
    "char-2": [
        {"role": "user", "content": "在干嘛呢？", "created_at": "2024-01-15T14:00:00Z"},
        {"role": "ai", "content": "刚打完球，出了一身汗", "created_at": "2024-01-15T14:01:00Z"},
    ],
}

# AI 回复模板
AI_RESPONSES = [
    "嗯嗯，我理解你的感受～",
    "真的吗？那太好了！",
    "哈哈，你真有趣～",
    "我也这么觉得呢",
    "要不要一起做点什么？",
    "今天天气真好，想出去走走吗？",
    "你最近好像很忙呢，要注意休息哦",
    "我一直在想你呢～",
    "这个想法很棒！",
    "谢谢你告诉我这些",
]


@app.get("/")
async def root():
    return {"name": "Linger · 余温 Dev API", "version": "0.1.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}


# ─── 角色 API ───
@app.get("/api/characters/list")
async def list_characters():
    return {"characters": CHARACTERS}


@app.get("/api/characters/{char_id}")
async def get_character(char_id: str):
    for char in CHARACTERS:
        if char["id"] == char_id:
            return char
    return JSONResponse(status_code=404, content={"detail": "角色不存在"})


@app.get("/api/characters/templates")
async def get_templates():
    return {
        "templates": [
            {"id": "gf_gentle", "name": "温柔学姐", "type": "girlfriend"},
            {"id": "gf_bubbly", "name": "元气少女", "type": "girlfriend"},
            {"id": "bf_sunny", "name": "阳光学长", "type": "boyfriend"},
            {"id": "bf_cold", "name": "高冷总裁", "type": "boyfriend"},
        ]
    }


@app.post("/api/characters/create")
async def create_character(data: dict):
    new_char = {
        "id": f"char-{uuid.uuid4().hex[:8]}",
        "name": data.get("name", "新角色"),
        "type": data.get("type", "friend"),
        "persona_id": data.get("persona_id", ""),
        "personality": [],
        "relationship_stage": "stranger",
        "intimacy_level": 0,
        "total_messages": 0,
        "last_active": None,
    }
    CHARACTERS.append(new_char)
    CHAT_HISTORY[new_char["id"]] = []
    return new_char


# ─── 聊天 API ───
@app.get("/api/chat/history/{char_id}")
async def get_chat_history(char_id: str, limit: int = 50):
    messages = CHAT_HISTORY.get(char_id, [])
    return {"messages": messages[-limit:]}


@app.post("/api/chat/send")
async def send_message(data: dict):
    char_id = data.get("character_id")
    message = data.get("message", "")

    if not char_id:
        return JSONResponse(status_code=400, content={"detail": "缺少角色ID"})

    # 添加用户消息到历史
    user_msg = {
        "role": "user",
        "content": message,
        "created_at": datetime.utcnow().isoformat() + "Z",
    }

    if char_id not in CHAT_HISTORY:
        CHAT_HISTORY[char_id] = []
    CHAT_HISTORY[char_id].append(user_msg)

    # 生成 AI 回复
    import random
    reply = random.choice(AI_RESPONSES)

    # 添加 AI 回复到历史
    ai_msg = {
        "role": "ai",
        "content": reply,
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    CHAT_HISTORY[char_id].append(ai_msg)

    # 更新角色统计
    for char in CHARACTERS:
        if char["id"] == char_id:
            char["total_messages"] += 2
            char["last_active"] = datetime.utcnow().isoformat() + "Z"
            char["intimacy_level"] = min(100, char["intimacy_level"] + 1)
            break

    return {"reply": reply, "message_id": str(uuid.uuid4())}


# ─── 宠物 API ───
@app.get("/api/pets/list")
async def list_pets():
    return {"pets": []}


@app.get("/api/pets/species")
async def get_species():
    return {
        "species": [
            {"id": "cat", "name": "猫咪", "emoji": "🐱"},
            {"id": "dog", "name": "狗狗", "emoji": "🐶"},
            {"id": "rabbit", "name": "兔子", "emoji": "🐰"},
        ]
    }


@app.post("/api/pets/create")
async def create_pet(data: dict):
    return {"id": f"pet-{uuid.uuid4().hex[:8]}", "name": data.get("name", "宠物")}


@app.post("/api/pets/{pet_id}/action")
async def pet_action(pet_id: str, data: dict):
    return {"success": True, "action": data.get("action")}


# ─── 数字怀念 API ───
@app.get("/api/memorial/list")
async def list_memorials():
    return {"memorials": []}


@app.post("/api/memorial/create")
async def create_memorial(data: dict):
    return {"id": f"mem-{uuid.uuid4().hex[:8]}", "name": data.get("name", "纪念")}


# ─── 认证 API ───
@app.post("/api/auth/login")
async def login(data: dict):
    return {"token": "dev-token-123", "user": {"id": "user-1", "name": "开发者"}}


@app.post("/api/auth/register")
async def register(data: dict):
    return {"token": "dev-token-123", "user": {"id": "user-1", "name": "开发者"}}


@app.get("/api/users/me")
async def get_current_user():
    return {"id": "user-1", "name": "开发者", "email": "dev@example.com"}


# ─── 上传 API ───
@app.post("/api/upload/photo")
async def upload_photo():
    return {"url": "https://via.placeholder.com/150"}


@app.post("/api/upload/voice")
async def upload_voice():
    return {"url": "https://example.com/voice.mp3"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
