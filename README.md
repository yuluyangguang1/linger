# Linger · 余温

> 有些人，不会真的离开。
> AI 情感陪伴原型 — 纯静态、零服务器、自带 API Key（BYOK）。

## 这是什么

Linger 是一个情感陪伴类交互原型。当前版本 **完全运行在浏览器里**，不需要你搭服务器、不需要买 App Store 开发者账号 — 只要一个 GitHub Pages 站点就够了。

聊天回复走 **BYOK**（Bring Your Own Key）：你自己去 OpenRouter / DeepSeek / 硅基流动 / OpenAI 任一服务商申请一个 API Key，在 App 里「我 → 设置」填进去，浏览器会直接调用这些接口。Key 只保存在你的 `localStorage`，不经过任何中间服务器。

没填 Key 时，App 会退化成"演示模式" — 用预置剧本回复，足以走完新用户冷启动流程。

## 访问

打开 GitHub Pages 部署好的站点即可。推送到 `main` 会自动触发 `.github/workflows/pages.yml` 重新部署。

默认地址形如：`https://<你的用户名>.github.io/linger/`

## 目录结构

```
linger/
├── index.html                 # 单页入口
├── src/
│   ├── app.js                 # 主应用（路由、页面钩子、聊天、宠物、设置）
│   ├── llm-client.js          # BYOK 流式 LLM 客户端（OpenAI 兼容）
│   ├── local-store.js         # localStorage 数据层（角色/宠物/聊天历史）
│   ├── onboarding.js          # 冷启动剧本引擎
│   ├── style.css              # 主样式
│   ├── liquid-glass.css       # 苹果液态玻璃风格辅助样式
│   ├── pages.js               # 预留
│   └── assets/
│       ├── avatars/           # 角色头像
│       ├── icons/             # Tab 图标
│       └── logo-*             # Logo 各尺寸
├── .github/workflows/pages.yml  # GitHub Pages 自动部署
├── docs/                        # 设计文档（不参与部署）
├── backend/                     # 旧版 FastAPI 后端（已废弃，仅保留做参考）
└── scripts/                     # 辅助脚本
```

## 本地预览

```bash
# 任意静态服务器都行，比如：
python -m http.server 8000
# 然后访问 http://localhost:8000
```

直接用 `file://` 打开 `index.html` 会遇到跨域限制，**必须走 HTTP 服务器**。

## 配置 API Key（BYOK）

1. 打开 App → 底部 tab「我」→ 点「设置（API Key）」
2. 选一个服务商，推荐按以下顺序尝试：

| 服务商 | 国内直连 | 免费额度 | Key 申请 |
|---|---|---|---|
| **DeepSeek** | ✅ | 有注册送 | https://platform.deepseek.com/api_keys |
| **硅基流动 SiliconFlow** | ✅ | 有免费模型 | https://cloud.siliconflow.cn/account/ak |
| **OpenRouter** | 需梯子 | 有免费模型 | https://openrouter.ai/keys |
| **OpenAI** | 需梯子 + 卡 | 无 | https://platform.openai.com/api-keys |
| **自定义** | 任何 OpenAI 兼容接口 | — | — |

3. 粘贴 Key，点「测试连接」，绿色勾就成功了。
4. 点「保存」。之后所有聊天会走你填的模型。

### Key 安全说明

- Key **仅保存在浏览器 localStorage**，不会上传到任何服务器（包括这个仓库的 GitHub Pages）。
- 仓库是公开的；**别把你的 Key 直接写进代码然后推上去**。
- 如果你在共享电脑上用完，记得在设置页点「清除 API Key」。

## 架构说明

```
┌─────────────────────────────────────────────────────────┐
│  浏览器 (GitHub Pages 托管的纯静态 HTML/JS/CSS)          │
│                                                         │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────┐  │
│  │  UI 层      │→│ local-store │→│ localStorage      │  │
│  │ (app.js)   │  │   .js       │  │  角色/宠物/历史    │  │
│  └────────────┘  └─────────────┘  └──────────────────┘  │
│         ↓                                                │
│  ┌───────────────┐                                       │
│  │ llm-client.js │── fetch ──► OpenAI 兼容接口          │
│  └───────────────┘             (用户自带的 API Key)      │
└─────────────────────────────────────────────────────────┘
```

没有中间服务器，没有数据库，没有后端部署，没有账号体系。

## 功能

- 8 种预置角色人设（温柔学姐 / 傲娇大小姐 / 腹黑总裁 …），每种有独立 system prompt 和说话风格
- 流式聊天（SSE），回复逐字显示
- 聊天历史本地留存（最近 40 条）
- 亲密度 / 等级系统（本地状态机）
- 宠物养成（喂食、玩耍、清洁、对话），本地属性衰减
- 纪念模式（数字怀念）
- 冷启动剧本：首次访问会演播开场 + 角色瞬间选择

## 旧版后端

`backend/` 下的 FastAPI 实现已不再使用，保留做以下用途：
- 人设数据源（`backend/config/personas.json` → `src/local-store.js` 里的静态数据）
- 未来如果你想上一个"代理服务器模式"，可以把它捡起来

部署时 `pages.yml` 会显式跳过 `backend/`，不会被推到 Pages。

## License

MIT
