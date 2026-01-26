# AI Chat Extension - 架构说明

## 核心代码位置

### 1. Content Script（聊天窗口）
**入口文件**: `src/content/index.ts`
- 创建 DOM 容器 `#ai-chat-extension-root`
- 挂载 Vue 应用（ChatWindow 组件）
- 监听来自 popup/background 的消息（TOGGLE_CHAT, UPDATE_MODE）

**UI 组件**: `src/content/ChatWindow.vue`
- 完整的聊天窗口实现
- 支持两种显示模式：
  - `float`: 悬浮窗口（可拖拽）
  - `sidebar`: 侧边栏（固定右侧）
- 功能：消息发送、历史记录、最小化、关闭

### 2. Popup 页面
**入口文件**: `src/popup/App.vue`
- 统计信息展示（会话数、消息数）
- 快捷操作按钮：
  - 打开聊天窗口（手动注入 content script）
  - 设置与管理
  - 新建会话
- 显示模式切换

**Content Script 注入逻辑** (`src/popup/App.vue:171-199`):
```typescript
const toggleChat = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.id) {
    try {
      // 尝试发送消息
      await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_CHAT' })
    } catch (e) {
      // Content script 未注入，手动注入
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      })
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['content.css']
      })
      await new Promise(resolve => setTimeout(resolve, 100))
      await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_CHAT' })
    }
  }
}
```

### 3. Background Service Worker
**入口文件**: `src/background/index.ts`
- 消息路由处理
- IndexedDB 数据操作
- 支持的消息类型：
  - `TOGGLE_CHAT`: 切换聊天窗口
  - `SEND_MESSAGE`: 发送消息（含 AI 模拟回复）
  - `GET_MESSAGES`: 获取会话消息
  - `GET_SESSIONS`: 获取所有会话
  - `CREATE_SESSION`: 创建新会话
  - `DELETE_SESSION`: 删除会话
  - `SAVE_SETTING`: 保存设置
  - `GET_SETTING`: 获取设置

### 4. Options 页面
**入口文件**: `src/options/App.vue`
- 会话管理（查看、删除）
- API 配置（端点、密钥、模型）
- 通用设置（显示模式、自动打开、历史记录）
- 关于信息

### 5. 数据存储
**工具类**: `src/utils/db.ts`
- IndexedDB 封装
- 三个 Object Store：
  - `sessions`: 会话列表
  - `messages`: 消息记录
  - `settings`: 用户设置

## 加载流程

### 初次安装
1. 用户安装扩展
2. `background.js` 初始化 IndexedDB
3. 创建默认会话

### 打开聊天窗口
1. 用户点击扩展图标 → 打开 `popup.html`
2. 用户点击"打开聊天窗口"按钮
3. Popup 尝试向当前标签页发送 `TOGGLE_CHAT` 消息
4. 如果失败（content script 未注入）：
   - 使用 `chrome.scripting.executeScript()` 注入 `content.js`
   - 使用 `chrome.scripting.insertCSS()` 注入 `content.css`
   - 等待 100ms 让 content script 初始化
   - 重新发送 `TOGGLE_CHAT` 消息
5. Content script 接收消息，通过 `window.postMessage` 通知 Vue 组件
6. ChatWindow 组件切换 `isVisible` 状态，显示聊天窗口

### 发送消息
1. 用户在聊天窗口输入消息并发送
2. ChatWindow 组件调用 `chrome.runtime.sendMessage()` 发送到 background
3. Background 接收 `SEND_MESSAGE` 消息：
   - 保存用户消息到 IndexedDB
   - 调用 `simulateAIResponse()` 生成回复（当前是模拟）
   - 保存 AI 回复到 IndexedDB
   - 返回响应给 content script
4. ChatWindow 更新消息列表，显示 AI 回复

## 构建配置

### Vite 自定义插件

**1. inlineContentScript()** (`vite.config.ts:9-56`)
- 将 content.js 的所有依赖内联到单个文件
- 移除 ES Module import 语句
- 包装成 IIFE 格式
- 解决 Chrome 扩展不支持 ES Module 的问题

**2. moveHtmlToRoot()** (`vite.config.ts:58-95`)
- 将 HTML 文件从 `dist/src/popup/index.html` 移动到 `dist/popup.html`
- 修正路径引用（`../../` → `./`）
- 删除临时的 `dist/src` 目录
- 确保 manifest.json 能正确引用 HTML 文件

### 构建输出结构
```
dist/
├── manifest.json          # 扩展配置
├── background.js          # 后台服务
├── popup.html            # Popup 页面
├── popup.js
├── popup.css
├── options.html          # 设置页面
├── options.js
├── options.css
├── content.js            # Content script（IIFE 格式）
├── content.css
├── chunks/               # 共享代码块
│   ├── modulepreload-polyfill-B5Qt9EMX.js
│   └── _plugin-vue_export-helper-CLx6sli7.js
└── icons/                # 图标资源
    └── icon.svg
```

## 关键技术点

1. **Content Script 注入方式**: 手动注入（非 manifest 自动注入）
   - 优点：按需加载，不影响所有页面性能
   - 缺点：需要处理注入失败的情况

2. **消息通信机制**:
   - Popup ↔ Background: `chrome.runtime.sendMessage()`
   - Popup → Content Script: `chrome.tabs.sendMessage()`
   - Content Script → Vue 组件: `window.postMessage()`

3. **IIFE 包装**: Content script 必须是 IIFE 格式，不能使用 ES Module

4. **路径处理**: HTML 文件必须在 dist 根目录，且使用相对路径引用资源

## 测试步骤

1. 构建项目: `npm run build`
2. 打开 Chrome 扩展管理页面: `chrome://extensions/`
3. 启用"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `dist` 目录
6. 点击扩展图标测试功能
