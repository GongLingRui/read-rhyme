# Read-Rhyme Frontend

<div align="center">

AI-powered audiobook generation platform frontend application.

![React](https://img.shields.io/badge/React-18+-cyan)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)
![Vite](https://img.shields.io/badge/Vite-5+-purple)
![License](https://img.shields.io/badge/license-MIT-orange)

作者：宫灵瑞

</div>

---

## 目录

- [项目概述](#项目概述)
- [核心功能](#核心功能)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [安装指南](#安装指南)
- [开发指南](#开发指南)
- [构建部署](#构建部署)

---

## 项目概述

Read-Rhyme 前端是基于 React 18 和 TypeScript 构建的现代化单页应用（SPA），为 AI 驱动有声书生成平台提供完整的用户界面。采用 Vite 作为构建工具，提供极速的开发体验。

### 主要特性

- 现代化 UI 设计，基于 shadcn/ui 组件库
- 完全响应式布局，支持多设备访问
- TypeScript 类型安全
- WebSocket 实时通信
- 音频波形可视化
- 优雅的状态管理

---

## 核心功能

### 1. 书籍管理
- 书籍列表展示和筛选
- 书籍上传（支持拖拽）
- 书籍详情查看
- 阅读进度跟踪

### 2. 项目管理
- 项目列表和状态管理
- 创建新有声书项目
- 项目详情和配置
- 实时进度跟踪

### 3. 阅读器
- 文本阅读界面
- 高亮标注功能
- 音频同步播放
- 波形可视化
- 笔记编辑

### 4. 语音配置
- 语音列表和选择
- 语音预览
- 情感设置
- 高级参数调整

### 5. AI 功能
- 脚本生成配置
- 脚本编辑器
- RAG 问答界面
- LoRA 训练管理

### 6. 用户设置
- 用户信息管理
- 偏好设置
- 主题切换

---

## 技术栈

### 核心框架
- **React 18**: 用户界面库
- **TypeScript 5+**: 类型安全
- **Vite 5**: 构建工具

### UI 组件和样式
- **shadcn/ui**: 高质量 React 组件
- **Radix UI**: 无障碍组件基础
- **Tailwind CSS**: 实用优先的 CSS 框架
- **Lucide Icons**: 图标库

### 状态管理和数据
- **Zustand**: 轻量级状态管理
- **React Query**: 服务端状态管理（可选）
- **Axios**: HTTP 客户端
- **React Hook Form**: 表单处理
- **Zod**: Schema 验证

### 路由和导航
- **React Router DOM**: 客户端路由

### 音频和媒体
- **wavesurfer.js**: 音频波形可视化
- **Howler.js**: 音频播放（可选）

### 开发工具
- **ESLint**: 代码检查
- **Prettier**: 代码格式化
- **Vitest**: 单元测试

---

## 项目结构

```
read-rhyme/
├── src/
│   ├── pages/                   # 页面组件
│   │   ├── Index.tsx            # 首页（书籍列表）
│   │   ├── Projects.tsx         # 项目列表页
│   │   ├── ProjectDetail.tsx    # 项目详情页
│   │   ├── Reader.tsx           # 阅读器页面
│   │   ├── VoiceStyling.tsx     # 语音样式设置
│   │   ├── LoRATraining.tsx     # LoRA 训练页面
│   │   ├── RAGQA.tsx            # RAG 问答页面
│   │   ├── Settings.tsx         # 设置页面
│   │   ├── Login.tsx            # 登录页面
│   │   ├── AudioPreview.tsx     # 音频预览
│   │   └── CosyVoice.tsx        # CosyVoice 页面
│   │
│   ├── components/              # 可复用组件
│   │   ├── ui/                  # shadcn/ui 基础组件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   └── ...
│   │   ├── BookCard.tsx         # 书籍卡片
│   │   ├── Player.tsx           # 音频播放器
│   │   ├── ReaderView.tsx       # 阅读视图
│   │   ├── UploadModal.tsx      # 上传模态框
│   │   ├── Waveform.tsx         # 波形显示
│   │   └── HighlightToolbar.tsx # 高亮工具栏
│   │
│   ├── services/                # API 服务层
│   │   ├── api.ts               # API 客户端配置
│   │   ├── auth.ts              # 认证服务
│   │   ├── books.ts             # 书籍服务
│   │   ├── projects.ts          # 项目服务
│   │   ├── voices.ts            # 语音服务
│   │   ├── rag.ts               # RAG 服务
│   │   └── websocket.ts         # WebSocket 服务
│   │
│   ├── stores/                  # Zustand 状态管理
│   │   ├── authStore.ts         # 认证状态
│   │   ├── bookStore.ts         # 书籍状态
│   │   ├── projectStore.ts      # 项目状态
│   │   ├── highlightStore.ts    # 高亮状态
│   │   └── thoughtStore.ts      # 思维状态
│   │
│   ├── hooks/                   # 自定义 Hooks
│   │   ├── useAuth.ts           # 认证 Hook
│   │   ├── useBooks.ts          # 书籍 Hook
│   │   ├── useProjects.ts       # 项目 Hook
│   │   ├── useWebSocket.ts      # WebSocket Hook
│   │   └── useAudioPlayer.ts    # 音频播放 Hook
│   │
│   ├── lib/                     # 外部库封装
│   │   └── utils.ts             # 工具函数
│   │
│   ├── types/                   # TypeScript 类型定义
│   │   ├── auth.ts
│   │   ├── book.ts
│   │   ├── project.ts
│   │   └── ...
│   │
│   ├── App.tsx                  # 根组件
│   ├── main.tsx                 # 应用入口
│   └── vite-env.d.ts            # Vite 类型声明
│
├── public/                      # 静态资源
│   ├── favicon.ico
│   └── ...
│
├── .env.example                 # 环境变量示例
├── Dockerfile                   # Docker 配置
├── nginx.conf                   # Nginx 配置
├── package.json                 # 依赖配置
├── tsconfig.json                # TypeScript 配置
├── vite.config.ts               # Vite 配置
├── tailwind.config.ts           # Tailwind 配置
└── README.md                    # 本文档
```

---

## 安装指南

### 前置要求

- Node.js 18 或更高版本
- pnpm（推荐）或 npm

### 安装步骤

1. **克隆仓库**
```bash
git clone <repository-url>
cd read-rhyme
```

2. **安装依赖**
```bash
pnpm install
# 或
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_BASE_URL=ws://localhost:8000/ws
```

4. **启动开发服务器**
```bash
pnpm run dev
# 或
npm run dev
```

5. **访问应用**

打开浏览器访问 http://localhost:5173

---

## 开发指南

### 可用脚本

```bash
# 启动开发服务器
pnpm run dev

# 构建生产版本
pnpm run build

# 预览生产构建
pnpm run preview

# 运行测试
pnpm test

# 代码检查
pnpm run lint

# 代码格式化
pnpm run format
```

### 代码规范

- 使用 TypeScript 类型注解
- 遵循 ESLint 规则
- 使用 Prettier 格式化
- 组件使用函数式组件和 Hooks
- 状态管理优先使用 Zustand

### 添加新页面

1. 在 `src/pages/` 创建新组件
2. 在 `src/App.tsx` 添加路由
3. 在导航组件中添加链接

示例：
```tsx
// src/pages/NewPage.tsx
import { useState } from 'react';

export function NewPage() {
  return (
    <div>
      <h1>New Page</h1>
    </div>
  );
}

// src/App.tsx
import { NewPage } from './pages/NewPage';

// 在路由中添加
<Route path="/new" element={<NewPage />} />
```

### 添加 API 服务

1. 在 `src/services/` 创建服务文件
2. 在 `src/types/` 定义类型
3. 使用 `useQuery` 或自定义 Hook

示例：
```ts
// src/services/example.ts
import api from './api';

export const exampleService = {
  async getData() {
    const response = await api.get('/example');
    return response.data;
  }
};
```

---

## 构建部署

### Docker 构建

```bash
# 构建镜像
docker build -t read-rhyme-frontend .

# 运行容器
docker run -p 80:80 read-rhyme-frontend
```

### 静态部署

```bash
# 构建静态文件
pnpm run build

# 将 dist/ 目录部署到静态文件服务器
# 例如 Nginx、Apache、Vercel、Netlify 等
```

### 环境变量

生产环境需要配置以下环境变量：

| 变量 | 说明 | 默认值 |
|-----|------|--------|
| `VITE_API_BASE_URL` | 后端 API 地址 | http://localhost:8000/api |
| `VITE_WS_BASE_URL` | WebSocket 地址 | ws://localhost:8000/ws |

---

## 组件使用示例

### 书籍卡片

```tsx
import { BookCard } from '@/components/BookCard';

<BookCard
  book={bookData}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

### 音频播放器

```tsx
import { Player } from '@/components/Player';

<Player
  src="/audio/file.mp3"
  waveColor="#4f46e5"
  progressColor="#818cf8"
/>
```

### 对话框

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>对话框标题</DialogTitle>
    </DialogHeader>
    <p>对话框内容</p>
  </DialogContent>
</Dialog>
```

---

## 常见问题

### Q: 开发服务器启动失败？
A: 检查 Node.js 版本是否 >= 18，尝试删除 node_modules 重新安装

### Q: 构建后页面空白？
A: 检查环境变量配置，确保 API 地址正确

### Q: WebSocket 连接失败？
A: 检查后端服务是否运行，防火墙是否阻止连接

### Q: 样式不生效？
A: 确保安装了所有依赖，重启开发服务器

---

## 性能优化

### 代码分割

使用 React.lazy 进行路由级别的代码分割：

```tsx
const Projects = lazy(() => import('./pages/Projects'));
```

### 图片优化

使用 WebP 格式，添加懒加载：

```tsx
<img loading="lazy" src="..." alt="..." />
```

### 缓存策略

使用 Service Worker 缓存静态资源

---

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

---

## 贡献指南

1. Fork 本仓库
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

---

## 许可证

MIT License

---

## 联系方式

- 作者：宫灵瑞
- 项目主页：[GitHub Repository]
- 问题反馈：[GitHub Issues]

<div align="center">

**Made with ❤️ by 宫灵瑞**

</div>
