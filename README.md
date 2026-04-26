# AI Music DJ

智能音乐播放器，根据**心情、天气、时间**自动推荐并播放音乐。

![AI Music DJ](https://img.shields.io/badge/AI-DJ-blue) ![React](https://img.shields.io/badge/React-18-green) ![Express](https://img.shields.io/badge/Express-4-orange) ![NetEase](https://img.shields.io/badge/NetEase-API-red)

## 功能特性

### 🤖 AI 智能推荐
- 基于**心情 (Mood)**、**天气 (Weather)**、**时间 (Time)** 动态推荐音乐
- 使用 MiniMax AI 生成个性化播放建议
- 播放理由智能解释

### 🎵 网易云音乐集成
- 歌单浏览与搜索
- Cookie 登录保活
- 流式音频代理（解决 CORS）
- VIP 歌曲支持

### 🎛️ DJ 控制台
- 双轨混音 (Deck A/B)
- EQ 调节 (High/Mid/Low)
- 效果器 (Reverb/Delay/Filter)
- BPM 检测与同步

### 🔊 音频引擎
- HTML5 Audio 原生播放
- 播放队列管理
- 自动连播
- 音量控制

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │DJ 控制台  │  │网易云歌单 │  │ AI DJ    │  │AI 工作室 │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
└───────┼─────────────┼─────────────┼─────────────┼─────────┘
        │             │             │             │
┌───────┴─────────────┴─────────────┴─────────────┴─────────┐
│                    State Layer (Zustand)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   djStore    │  │contextStore  │  │preferenceStore│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                  Audio Engine (HTML5 Audio)                │
│  loadAudio() │ play() │ pause() │ seek() │ setVolume()    │
└─────────────────────────────────────────────────────────────┘
```

## 四层架构

### Layer 1: 外部上下文 (传感器)

```
外部数据源 ─────┬──────▶ Context Store
                │
    ┌───────────┼───────────┬───────────┐
    ▼           ▼           ▼           ▼
 Weather     DateTime    Calendar    Device
   API         Service     API       State
```

| 服务 | 数据 | 映射到 |
|------|------|--------|
| OpenWeatherMap | 天气状况、温度 | Mood/Energy |
| DateTimeService | 时间段、季节、节假日 | Activity Context |
| (可选) 飞书日历 | 日程安排 | Music Preference |

### Layer 2: 本地大脑 (决策核心)

```
taste.md ──┬──▶ 用户音乐偏好
           │    (风格、BPM、乐器、回避元素)
           │
routines.md┴──▶ 日常作息习惯
               (工作时间、休息时间、运动时间)

           │
           ▼
    claude -p (Markdown → JSON)
           │
           ▼
    System Prompt 构建
```

- `taste.md` - 用户音乐品味模板
- `routines.md` - 作息与音乐习惯
- `claudeLocalService.js` - Claude CLI 子进程封装

### Layer 3: 运行时聚合 (Context Assembly)

```
┌────────────────────────────────────────────┐
│              6 片上下文拼接                  │
├────────────────────────────────────────────┤
│ 1. System Config     - 服务器配置           │
│ 2. User Preferences  - taste.json          │
│ 3. Real-time API     - weather, calendar    │
│ 4. Device State      - amp status           │
│ 5. History          - 最近 10 首           │
│ 6. Session State    - mood, energy         │
└────────────────────────────────────────────┘
           │
           ▼
    MoodMapper.js
    (天气/时间/日历 → mood + energy)
           │
           ▼
    PlaylistSelector.js
    (mood → 歌单选择 + 评分排序)
```

### Layer 4: 交互表层 (UI/UX)

```
┌─────────────────────────────────────────────┐
│              SmartPlaySelector               │
│  ┌─────────┐ ┌──────────┐ ┌─────────────┐ │
│  │Mood Banner│ │推荐理由  │ │标签云       │ │
│  └─────────┘ └──────────┘ └─────────────┘ │
│  ┌─────────┐ ┌─────────────────────────┐  │
│  │播放按钮 │ │    歌曲列表 (10首)      │  │
│  └─────────┘ └─────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## 技术栈

### 前端
- **React 18** - UI 框架
- **Zustand** - 状态管理
- **TailwindCSS** - 样式
- **Vite** - 构建工具

### 后端
- **Express.js** - API 服务
- **axios** - HTTP 客户端
- **claude -p** - 本地大脑解析

### 外部 API
- **网易云音乐 API** - 歌曲搜索、播放
- **MiniMax AI** - 智能推荐
- **OpenWeatherMap** - 天气数据

## 项目结构

```
ai-music-dj/
├── server/
│   ├── index.js              # Express 服务器入口
│   ├── routes/
│   │   ├── netease.js        # 网易云 API 代理
│   │   ├── smartplay.js      # AI 推荐引擎
│   │   ├── ai.js             # MiniMax AI
│   │   ├── context.js        # 上下文 API
│   │   └── brain.js          # 本地大脑
│   └── services/
│       ├── weatherService.js  # 天气服务
│       └── datetimeService.js # 时间服务
├── src/
│   ├── audio/
│   │   └── AudioEngine.js    # 音频引擎
│   ├── brain/
│   │   ├── taste.md          # 用户偏好
│   │   └── routines.md        # 作息习惯
│   ├── components/
│   │   ├── SmartPlaySelector.jsx  # AI 推荐选择器
│   │   ├── Deck.jsx          # DJ 轨道
│   │   ├── Mixer.jsx         # 混音器
│   │   ├── Effects.jsx       # 效果器
│   │   └── PlaylistBrowser.jsx   # 歌单浏览
│   ├── context/
│   │   ├── MoodMapper.js     # 心情映射
│   │   └── PlaylistSelector.js    # 歌单选择
│   ├── hooks/
│   │   ├── useAudioEngine.js # 音频引擎 Hook
│   │   ├── useContextAggregator.js  # 上下文聚合
│   │   └── useAudioDucking.js    # 音频闪避
│   └── stores/
│       ├── djStore.js        # DJ 状态
│       └── contextStore.js    # 上下文状态
├── data/
│   ├── holidays.json         # 节假日数据
│   └── netease_cookie.json  # 网易云 Cookie
└── index.html
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```bash
MINIMAX_API_KEY=your_minimax_api_key
OPENWEATHERMAP_API_KEY=your_openweathermap_key
```

### 3. 配置网易云 Cookie

在浏览器中登录网易云音乐，复制 Cookie 填入应用界面。

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 核心流程

### AI 智能播放流程

```
用户点击 "AI 模式"
       │
       ▼
获取当前上下文 (天气 + 时间 + 心情)
       │
       ▼
调用 MiniMax AI 推荐 API
       │
       ▼
返回推荐标签 + 播放理由
       │
       ▼
根据标签搜索网易云歌曲
       │
       ▼
展示推荐歌曲列表
       │
       ▼
用户点击播放 → 自动连播
```

### 音频加载流程

```
歌曲点击
   │
   ▼
fetch /api/netease/song/url/:id
   │
   ▼
后端调用网易云 API 获取播放 URL
   │
   ▼
返回相对路径 /api/netease/stream/:id
   │
   ▼
前端拼接完整 URL
   │
   ▼
AudioEngine.loadAudio(完整URL)
   │
   ▼
HTML5 Audio 播放
```

## API 端点

### 网易云音乐
| 端点 | 说明 |
|------|------|
| `GET /api/netease/search` | 搜索歌曲 |
| `GET /api/netease/song/url/:id` | 获取播放 URL |
| `GET /api/netease/stream/:id` | 流式音频代理 |
| `GET /api/netease/playlist/:id` | 获取歌单 |
| `POST /api/netease/cookie` | 设置 Cookie |

### AI 功能
| 端点 | 说明 |
|------|------|
| `GET /api/smartplay/recommend` | AI 智能推荐 |
| `GET /api/context` | 获取上下文 |
| `POST /api/ai/chat` | AI 对话 |

## License

MIT
