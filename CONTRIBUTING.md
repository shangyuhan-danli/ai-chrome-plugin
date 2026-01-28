# AI Chrome Plugin 开发贡献指南

本文档旨在帮助开发者快速了解项目结构，并指导如何对接生产环境后台服务。

## 目录

- [项目架构](#项目架构)
- [核心代码位置](#核心代码位置)
- [后台服务对接指南](#后台服务对接指南)
- [API 接口规范](#api-接口规范)
- [已实现的功能](#已实现的功能)
- [开发流程](#开发流程)

---

## 项目架构

```
┌─────────────────────────────────────────────────────────────┐
│                      用户交互层                              │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
    ┌────────┐  ┌────────┐  ┌──────────┐
    │ Popup  │  │  Chat  │  │ Options  │
    │ (Vue)  │  │ (Vue)  │  │  (Vue)   │
    └────┬───┘  └────┬───┘  └────┬─────┘
         │           │           │
         └───────────┼───────────┘
                     │
         chrome.runtime.sendMessage()
                     │
                     ▼
         ┌──────────────────────────┐
         │ Background Service Worker│◄──── 核心逻辑层
         │   (消息处理中心)          │
         └────────────┬─────────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
         ▼            ▼            ▼
    ┌─────────┐  ┌──────────┐  ┌──────────┐
    │IndexedDB│  │  API     │  │ Storage  │
    │(本地存储)│  │ Service  │  │ (状态)   │
    └─────────┘  └──────────┘  └──────────┘
                      │
                      ▼
              ┌──────────────┐
              │  后台服务     │
              │ (生产环境)    │
              └──────────────┘
```

**技术栈:**
- 框架: Vue 3 + TypeScript
- 构建工具: Vite
- 本地存储: IndexedDB
- 扩展规范: Chrome Extension Manifest V3

---

## 核心代码位置

### 1. 入口文件

| 模块 | 路径 | 说明 |
|------|------|------|
| Popup | `src/popup/App.vue` | 点击扩展图标弹出的面板 |
| Chat | `src/chat/App.vue` | 聊天界面主组件 (含 Agent 选择器) |
| Options | `src/options/App.vue` | 设置页面 |
| Content Script | `src/content/index.ts` | 注入到网页的脚本 |
| Background | `src/background/index.ts` | 后台服务工作线程 |

### 2. 工具类

| 文件 | 路径 | 说明 |
|------|------|------|
| 数据库操作 | `src/utils/db.ts` | IndexedDB 封装类 |
| 类型定义 | `src/utils/types.ts` | TypeScript 接口定义 |
| API 服务 | `src/utils/api.ts` | 后台服务对接层 |

### 3. 消息通信协议

所有组件间通信通过 `chrome.runtime.sendMessage` 进行，消息类型定义在 `src/utils/types.ts`:

```typescript
export type MessageType =
  | 'TOGGLE_CHAT'
  | 'SEND_MESSAGE'
  | 'GET_MESSAGES'
  | 'GET_SESSIONS'
  | 'CREATE_SESSION'
  | 'DELETE_SESSION'
  | 'SAVE_SETTING'
  | 'GET_SETTING'
  | 'UPDATE_MODE'
  | 'GET_AGENTS'           // 获取 Agent 列表
  | 'GET_HISTORY'          // 获取会话历史
  | 'RECOGNIZE_INTENT'     // 意图识别
```

---

## 后台服务对接指南

### 需要对接的接口

后台服务需提供以下三个核心接口:

#### 1. Agent 查询接口

```
GET /api/agents?url={currentPageUrl}
```

**请求参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| url | string | 否 | 当前页面 URL，用于意图识别和智能排序 |

**响应格式:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "agents": [
      {
        "id": "agent_001",
        "name": "代码助手",
        "description": "帮助你编写和调试代码",
        "avatar": "https://example.com/avatar.png",
        "tags": ["coding", "debug"],
        "matchScore": 95
      }
    ],
    "recommended": "agent_001"
  }
}
```

#### 2. 实时会话接口 (流式响应)

```
POST /api/chat/stream
Content-Type: application/json
```

**请求体:**
```json
{
  "agentId": "agent_001",
  "sessionId": "session_123",
  "message": "用户输入的消息",
  "context": {
    "url": "https://current-page.com",
    "title": "当前页面标题",
    "selection": "用户选中的文本（可选）"
  }
}
```

**响应格式 (SSE - Server-Sent Events):**
```
event: message
data: {"type": "content", "content": "这是"}

event: message
data: {"type": "content", "content": "流式"}

event: message
data: {"type": "content", "content": "响应"}

event: message
data: {"type": "done", "messageId": "msg_123"}
```

**错误响应:**
```
event: message
data: {"type": "error", "message": "错误信息"}
```

#### 3. 会话历史查询接口

```
GET /api/sessions/{sessionId}/history?page=1&pageSize=20
```

**响应格式:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "messages": [
      {
        "id": "msg_001",
        "role": "user",
        "content": "你好",
        "createdAt": "2024-01-01T12:00:00Z",
        "agentId": "agent_001"
      }
    ],
    "total": 100,
    "hasMore": true
  }
}
```

---

## 已实现的功能

### 1. Agent 选择器 (src/chat/App.vue)

- 下拉式 Agent 选择器，支持搜索过滤
- 根据当前页面 URL 自动识别意图，推荐最匹配的 Agent
- 显示匹配度分数和推荐标签
- 选中的 Agent 会在聊天时传递给后台

### 2. 流式响应处理 (src/background/index.ts)

- 使用 `chrome.runtime.connect` 建立长连接
- 支持 SSE (Server-Sent Events) 流式响应
- 实时更新聊天界面显示

### 3. 页面上下文传递 (src/content/index.ts)

- 自动获取当前页面 URL 和标题
- 监听 SPA 应用的 URL 变化
- 将页面信息传递给聊天组件

---

## 配置 API 地址

### 方式一：通过设置页面配置

用户可以在 Options 页面配置 API 地址和密钥：
- API Endpoint: 后台服务地址
- API Key: 认证密钥

### 方式二：修改默认配置

编辑 `src/utils/api.ts`:

```typescript
const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: 'https://your-api-domain.com'  // 修改为你的后台服务地址
}
```

---

## 开发流程

### 本地开发

```bash
# 安装依赖
npm install

# 开发模式 (监听文件变化)
npm run dev

# 构建生产版本
npm run build

# 类型检查
npm run type-check
```

### 加载扩展

1. 打开 Chrome，访问 `chrome://extensions/`
2. 开启 "开发者模式"
3. 点击 "加载已解压的扩展程序"
4. 选择项目的 `dist` 目录

### 调试技巧

- **Popup 调试**: 右键点击扩展图标 → 检查弹出内容
- **Background 调试**: 扩展管理页 → 点击 "Service Worker"
- **Content Script 调试**: 在目标网页按 F12，在 Sources 面板找到扩展脚本
- **Chat UI 调试**: 在 iframe 中右键 → 检查

---

## 关键代码说明

### API 服务层 (src/utils/api.ts)

```typescript
// 获取 Agent 列表（带意图识别）
const result = await apiService.getAgents(currentPageUrl)
// result.agents: Agent 列表
// result.recommended: 推荐的 Agent ID

// 流式会话
await apiService.chatStream(
  { agentId, sessionId, message, context },
  (content) => { /* 处理流式内容 */ },
  (messageId) => { /* 完成回调 */ },
  (error) => { /* 错误处理 */ }
)
```

### 流式消息处理 (src/background/index.ts)

```typescript
// 监听流式会话的长连接
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'chat-stream') {
    port.onMessage.addListener(async (request) => {
      await apiService.chatStream(
        request,
        (content) => port.postMessage({ type: 'content', content }),
        (messageId) => port.postMessage({ type: 'done', messageId }),
        (error) => port.postMessage({ type: 'error', error: error.message })
      )
    })
  }
})
```

### Chat 组件流式发送 (src/chat/App.vue)

```typescript
const sendStreamMessage = async (content: string) => {
  const port = chrome.runtime.connect({ name: 'chat-stream' })

  port.onMessage.addListener((msg) => {
    if (msg.type === 'content') {
      // 实时更新消息内容
      streamingContent.value += msg.content
    } else if (msg.type === 'done') {
      port.disconnect()
    }
  })

  port.postMessage({
    agentId: selectedAgent.value.id,
    sessionId: currentSessionId.value,
    message: content,
    context: { url: currentPageUrl.value, title: currentPageTitle.value }
  })
}
```

---

## 注意事项

1. **CORS 问题**: Chrome 扩展的 Background Service Worker 不受 CORS 限制，但需要在 `manifest.json` 中声明 `host_permissions`

2. **Service Worker 生命周期**: Background Service Worker 可能被浏览器休眠，需要处理重新激活的情况

3. **消息大小限制**: Chrome 消息传递有大小限制，大数据应使用 IndexedDB 中转

4. **流式响应**: SSE 在 Service Worker 中需要特殊处理，已使用 `chrome.runtime.connect` 建立长连接解决

---

## 联系方式

如有问题，请提交 Issue 或联系项目维护者。
