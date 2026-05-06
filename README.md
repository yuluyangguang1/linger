# Linger — 余温

> Linger · 余温 — AI 陪伴，永恒温暖

## 项目结构

```
Linger/
├── backend/              # FastAPI 后端
│   ├── api/              # API 路由
│   ├── core/             # 核心配置
│   ├── models/           # 数据模型
│   ├── schemas/          # 请求/响应 Schema
│   ├── services/         # 业务逻辑
│   └── database/         # 数据库相关
├── characters/           # 角色人设
│   ├── girlfriend/       # AI 女友
│   ├── boyfriend/        # AI 男友
│   ├── pet/              # AI 宠物
│   ├── memorial/         # 数字怀念
│   ├── friend/           # AI 朋友
│   ├── family/           # AI 家人
│   ├── mentor/           # AI 导师
│   └── fantasy/          # 幻想角色
├── frontend/             # 前端 (Vue3)
│   ├── src/
│   └── public/
├── data/                 # 用户数据
│   ├── uploads/          # 上传文件
│   └── ...
├── docs/                 # 文档
└── scripts/              # 工具脚本
```

## 快速开始

```bash
# 1. 安装依赖
cd backend
pip install -r requirements.txt

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 填入 API Key

# 3. 启动后端
python main.py

# 4. 启动前端
cd frontend
npm install
npm run dev
```

## 技术栈

| 层面 | 技术 |
|------|------|
| AI 引擎 | hermes-agent |
| 后端 | FastAPI + Python |
| 数据库 | PostgreSQL + Redis + Qdrant |
| 前端 | Vue3 + Vite |
| TTS | ChatTTS / ElevenLabs |
| STT | faster-whisper |
| 图片 | Stable Diffusion |
| 语音克隆 | GPT-SoVITS |

## License

MIT
