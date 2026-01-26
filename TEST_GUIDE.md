# 测试指南

## 安装步骤

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 启用右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目的 `dist` 目录

## 功能测试清单

### ✅ Popup 页面测试
- [ ] 点击扩展图标，popup 正常显示
- [ ] 统计信息显示（会话数、消息数）
- [ ] 显示模式切换（悬浮窗口/侧边栏）
- [ ] "设置与管理"按钮打开 options 页面

### ✅ 聊天窗口测试
- [ ] 点击"打开聊天窗口"按钮
- [ ] 聊天窗口在页面上显示
- [ ] 悬浮窗口模式：可拖拽移动
- [ ] 侧边栏模式：固定在右侧
- [ ] 最小化/展开功能
- [ ] 关闭按钮

### ✅ 消息发送测试
- [ ] 输入消息并按 Enter 发送
- [ ] 用户消息显示在左侧（蓝色气泡）
- [ ] AI 回复显示在右侧（灰色气泡）
- [ ] 加载动画（三个跳动的点）
- [ ] 消息时间戳显示
- [ ] 自动滚动到底部

### ✅ Options 页面测试
- [ ] 会话管理：查看会话列表
- [ ] 会话管理：创建新会话
- [ ] 会话管理：删除会话
- [ ] API 配置：保存设置
- [ ] 通用设置：切换显示模式
- [ ] 关于页面：统计信息

### ✅ 数据持久化测试
- [ ] 发送消息后刷新页面，消息仍然存在
- [ ] 关闭浏览器重新打开，数据未丢失
- [ ] 切换显示模式后，设置被保存

## 常见问题排查

### 问题1：Popup 页面空白
**检查**：
```bash
# 打开 Chrome DevTools (F12)
# 查看 Console 是否有错误
# 检查 Network 标签，确认资源加载成功
```

**解决**：
- 确认 `dist/popup.html` 存在
- 确认 `dist/popup.js` 和 `dist/popup.css` 存在
- 检查 manifest.json 中的路径

### 问题2：聊天窗口打不开
**检查**：
```bash
# 在页面上右键 -> 检查 -> Console
# 查看是否有 content.js 加载错误
```

**解决**：
- 确认 `dist/content.js` 是 IIFE 格式（不含 import 语句）
- 确认 manifest.json 中 web_accessible_resources 配置正确
- 尝试刷新页面后重新打开

### 问题3：消息发送失败
**检查**：
```bash
# 打开扩展的 Service Worker 控制台
# chrome://extensions/ -> AI Chat Assistant -> Service Worker
# 查看是否有错误日志
```

**解决**：
- 确认 background.js 正常运行
- 检查 IndexedDB 是否初始化成功
- 查看 Chrome DevTools -> Application -> IndexedDB

### 问题4：设置无法保存
**检查**：
- 打开 options 页面的 DevTools
- 查看 Console 错误信息
- 确认 background.js 的消息处理正常

## 调试技巧

### 1. 查看 Background Service Worker 日志
```
chrome://extensions/ 
→ AI Chat Assistant 
→ 点击 "Service Worker" 链接
```

### 2. 查看 Content Script 日志
```
在任意网页上右键 -> 检查 -> Console
```

### 3. 查看 Popup 日志
```
右键点击扩展图标 -> 检查弹出内容
```

### 4. 查看 IndexedDB 数据
```
F12 -> Application -> Storage -> IndexedDB -> ai-chat-db
```

### 5. 重新加载扩展
```
chrome://extensions/ 
→ 找到 AI Chat Assistant 
→ 点击刷新图标 🔄
```

## 预期行为

### 首次安装
1. 扩展图标出现在工具栏
2. 点击图标显示 popup（会话数: 1, 消息数: 0）
3. 点击"打开聊天窗口"，页面上出现聊天窗口
4. 显示"开始对话吧！"的空状态

### 发送消息
1. 输入"你好"并按 Enter
2. 用户消息立即显示
3. 出现加载动画（约1秒）
4. AI 回复显示（模拟回复，包含用户输入的内容）

### 切换显示模式
1. 在 popup 中选择"侧边栏"
2. 关闭并重新打开聊天窗口
3. 窗口固定在页面右侧，不可拖拽

## 性能指标

- Popup 打开速度: < 100ms
- 聊天窗口注入: < 200ms
- 消息发送响应: < 1.5s（含模拟延迟）
- 内存占用: < 50MB

## 下一步开发

- [ ] 接入真实 AI API（替换 simulateAIResponse）
- [ ] 添加 Markdown 渲染支持
- [ ] 实现代码高亮
- [ ] 添加消息编辑/删除功能
- [ ] 支持文件上传
- [ ] 添加快捷键支持
