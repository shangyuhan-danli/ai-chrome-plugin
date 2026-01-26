# AI Chat Extension - 安装和使用指南

## 🎉 项目已完成！

你的 AI 聊天助手浏览器插件已经成功构建，可以直接使用了。

## 📦 安装步骤

### 1. 加载插件到 Chrome

1. 打开 Chrome 浏览器
2. 在地址栏输入：`chrome://extensions/`
3. 开启右上角的 **"开发者模式"** 开关
4. 点击 **"加载已解压的扩展程序"**
5. 选择目录：`/Users/lidan/Desktop/code/ai-chat-extension/dist`
6. 插件加载成功！工具栏会出现插件图标

### 2. 开始使用

#### 方式一：通过 Popup 快速操作
1. 点击浏览器工具栏的插件图标
2. 查看统计信息（会话数、消息数）
3. 点击 **"打开聊天窗口"** 开始对话
4. 点击 **"设置与管理"** 进入后台管理
5. 点击 **"新建会话"** 创建新对话
6. 选择显示模式（悬浮窗口/侧边栏）

#### 方式二：直接在网页使用
1. 打开任意网页（如 https://www.baidu.com）
2. 点击插件图标 → "打开聊天窗口"
3. 聊天窗口会出现在页面上
4. 开始输入消息并对话

## ✨ 主要功能

### 1. Popup 弹窗（已优化）
- ✅ 美观的渐变设计
- ✅ 实时统计信息展示
- ✅ 快捷操作按钮
- ✅ 显示模式切换
- ✅ 一键进入后台管理

### 2. 聊天窗口
- ✅ 悬浮窗口模式（可拖拽）
- ✅ 侧边栏模式（固定右侧）
- ✅ 最小化/展开功能
- ✅ 实时消息发送
- ✅ 打字动画效果
- ✅ 消息时间戳
- ✅ 自动滚动到最新消息

### 3. 后台管理页面（全新）
- ✅ 会话管理
  - 查看所有会话
  - 创建新会话
  - 删除会话
  - 查看会话详情
- ✅ API 配置
  - 设置 API 端点
  - 配置 API 密钥
  - 选择 AI 模型
  - 测试连接
- ✅ 通用设置
  - 默认显示模式
  - 自动打开选项
  - 历史记录保存
- ✅ 关于页面
  - 版本信息
  - 统计数据
  - 帮助链接

### 4. 数据存储
- ✅ IndexedDB 本地存储
- ✅ 聊天历史持久化
- ✅ 用户设置保存
- ✅ 多会话管理

## 🎨 界面优化

### Popup 界面改进
- 更大的尺寸（380px）
- 渐变背景设计
- 统计卡片展示
- 图标化按钮
- 更好的视觉层次

### Options 管理页面
- 侧边栏导航
- 多标签页设计
- 表单验证
- 响应式布局
- 现代化 UI 风格

## 🔧 测试清单

### 基础功能测试
- [ ] 点击插件图标打开 Popup
- [ ] Popup 显示正确的统计信息
- [ ] 点击"打开聊天窗口"成功显示聊天界面
- [ ] 发送消息并收到 AI 回复
- [ ] 消息正确保存到 IndexedDB

### 窗口模式测试
- [ ] 悬浮窗口模式正常工作
- [ ] 可以拖拽悬浮窗口
- [ ] 最小化/展开功能正常
- [ ] 切换到侧边栏模式
- [ ] 侧边栏固定在右侧

### 后台管理测试
- [ ] 点击"设置与管理"打开 Options 页面
- [ ] 会话管理页面显示所有会话
- [ ] 可以创建新会话
- [ ] 可以删除会话
- [ ] API 配置保存成功
- [ ] 通用设置保存成功

### 数据持久化测试
- [ ] 刷新页面后聊天记录保持
- [ ] 关闭浏览器重新打开后数据仍在
- [ ] 设置项正确保存和加载

## 📝 已知限制

1. **AI 响应是模拟的**
   - 当前使用随机模拟响应
   - 需要接入真实 AI API（在 `src/background/index.ts:65` 修改）

2. **图标使用 SVG**
   - 某些浏览器可能不支持 SVG 图标
   - 如需要可以转换为 PNG 格式

## 🚀 下一步开发建议

### 1. 接入真实 AI API
```typescript
// 在 src/background/index.ts 中修改
async function callRealAI(userMessage: string): Promise<string> {
  const apiKey = await chatDB.getSetting('apiKey')
  const endpoint = await chatDB.getSetting('apiEndpoint')

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: userMessage }]
    })
  })

  const data = await response.json()
  return data.choices[0].message.content
}
```

### 2. 增强功能
- 添加 Markdown 渲染支持
- 支持代码高亮
- 添加消息编辑/删除功能
- 支持图片上传
- 添加语音输入
- 支持多语言

### 3. 性能优化
- 虚拟滚动优化长列表
- 消息分页加载
- 图片懒加载
- 缓存优化

### 4. 用户体验
- 添加快捷键支持
- 主题切换（深色/浅色）
- 字体大小调整
- 导出聊天记录
- 搜索历史消息

## 📂 项目结构

```
ai-chat-extension/
├── dist/                      # 构建输出（可直接加载）
│   ├── background.js
│   ├── content.js
│   ├── popup.js
│   ├── options.js
│   ├── *.css
│   ├── manifest.json
│   └── src/
│       ├── popup/index.html
│       └── options/index.html
├── src/
│   ├── background/           # 后台服务
│   ├── content/              # 内容脚本
│   ├── popup/                # 弹窗页面
│   ├── options/              # 设置页面
│   └── utils/                # 工具类
├── manifest.json
├── vite.config.ts
├── package.json
└── README.md
```

## 🐛 问题排查

### 插件无法加载
- 检查是否开启了开发者模式
- 确认选择的是 `dist` 目录
- 查看控制台错误信息

### 聊天窗口不显示
- 打开浏览器控制台（F12）
- 查看 Console 标签的错误信息
- 检查 content script 是否正确注入

### 消息发送失败
- 打开插件的 Service Worker 控制台
- 在 `chrome://extensions/` 页面点击插件的"Service Worker"链接
- 查看错误日志

### 数据丢失
- 检查 IndexedDB 是否正常工作
- 在控制台 Application → IndexedDB 查看数据
- 确认浏览器没有清除数据

## 💡 提示

1. **开发模式**：运行 `npm run dev` 可以实时编译
2. **生产构建**：运行 `npm run build` 生成优化后的代码
3. **类型检查**：运行 `npm run type-check` 检查 TypeScript 类型
4. **重新加载**：修改代码后需要在 `chrome://extensions/` 点击刷新按钮

## 📞 支持

如有问题，请检查：
1. 浏览器控制台错误信息
2. Service Worker 日志
3. IndexedDB 数据状态

---

**祝你使用愉快！** 🎉
