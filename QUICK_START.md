# 🚀 快速启动指南

## 📋 前置要求

- Node.js >= 16
- npm >= 8
- Chrome 浏览器 >= 88

## ⚡ 5分钟快速开始

### 步骤 1: 构建项目

```bash
cd /Users/lidan/Desktop/code/ai-chat-extension
npm run build
```

**预期输出**:
```
✓ 24 modules transformed.
✓ Moved popup.html to root
✓ Moved options.html to root
✓ Cleaned up src directory
✓ built in 490ms
```

### 步骤 2: 验证构建

```bash
cd dist
./verify.sh
```

**预期输出**:
```
🎉 所有检查通过！扩展可以加载了。
```

### 步骤 3: 加载到 Chrome

1. **打开扩展管理页面**
   ```
   在 Chrome 地址栏输入: chrome://extensions/
   或者: 菜单 → 更多工具 → 扩展程序
   ```

2. **启用开发者模式**
   - 点击右上角的"开发者模式"开关

3. **加载扩展**
   - 点击"加载已解压的扩展程序"
   - 选择目录: `/Users/lidan/Desktop/code/ai-chat-extension/dist`
   - 点击"选择"

4. **确认安装成功**
   - 扩展列表中出现 "AI Chat Assistant"
   - 工具栏出现扩展图标
   - 状态显示为"已启用"

### 步骤 4: 测试功能

#### 测试 1: Popup 页面
1. 点击工具栏中的扩展图标
2. 应该看到：
   - 渐变色的标题栏
   - 统计信息（会话数: 1, 消息数: 0）
   - 三个操作按钮
   - 显示模式选择器

#### 测试 2: 打开聊天窗口
1. 在 Popup 中点击"打开聊天窗口"
2. 当前页面上应该出现聊天窗口
3. 窗口显示"开始对话吧！"

#### 测试 3: 发送消息
1. 在聊天窗口输入框输入"你好"
2. 按 Enter 发送
3. 应该看到：
   - 用户消息立即显示（蓝色气泡）
   - 加载动画（三个跳动的点）
   - 约1秒后显示 AI 回复（灰色气泡）

#### 测试 4: 切换显示模式
1. 在 Popup 中选择"侧边栏"模式
2. 关闭聊天窗口
3. 重新打开聊天窗口
4. 窗口应该固定在页面右侧

#### 测试 5: Options 页面
1. 在 Popup 中点击"设置与管理"
2. 应该打开新标签页显示 Options 页面
3. 可以看到：
   - 左侧导航栏（4个标签）
   - 会话管理界面
   - 显示1个默认会话

## 🎯 核心功能演示

### 功能 1: 多会话管理

```
1. 打开 Options 页面
2. 点击"新建会话"按钮
3. 会话列表中出现新会话
4. 可以查看、删除会话
```

### 功能 2: 悬浮窗口拖拽

```
1. 确保显示模式为"悬浮窗口"
2. 打开聊天窗口
3. 按住标题栏拖动
4. 窗口可以在页面上自由移动
```

### 功能 3: 数据持久化

```
1. 发送几条消息
2. 刷新页面（F5）
3. 重新打开聊天窗口
4. 消息历史仍然存在
```

### 功能 4: API 配置

```
1. 打开 Options 页面
2. 切换到"API 配置"标签
3. 输入 API 端点和密钥
4. 点击"保存设置"
5. 设置被保存到 IndexedDB
```

## 🐛 故障排除

### 问题 1: 构建失败

**症状**: `npm run build` 报错

**解决**:
```bash
# 清理依赖重新安装
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 问题 2: 扩展加载失败

**症状**: Chrome 提示"无法加载扩展"

**检查清单**:
- [ ] 确认选择的是 `dist` 目录（不是项目根目录）
- [ ] 确认 `dist/manifest.json` 存在
- [ ] 运行 `cd dist && ./verify.sh` 检查构建产物

**解决**:
```bash
# 重新构建
npm run build
# 在 Chrome 中点击扩展的"重新加载"按钮
```

### 问题 3: Popup 页面空白

**症状**: 点击扩展图标，弹出窗口是空白的

**调试步骤**:
```
1. 右键点击扩展图标 → "检查弹出内容"
2. 查看 Console 是否有错误
3. 检查 Network 标签，确认资源加载成功
```

**常见原因**:
- `dist/popup.html` 路径引用错误
- `dist/popup.js` 或 `dist/popup.css` 缺失
- Vue 组件加载失败

**解决**:
```bash
# 检查文件是否存在
ls -la dist/popup.*
# 查看 popup.html 内容
cat dist/popup.html
# 确认路径是 ./popup.js 而不是 ../../popup.js
```

### 问题 4: 聊天窗口打不开

**症状**: 点击"打开聊天窗口"按钮无反应

**调试步骤**:
```
1. 在网页上右键 → 检查 → Console
2. 查看是否有 content.js 加载错误
3. 检查是否有权限错误
```

**常见原因**:
- Content script 注入失败
- manifest.json 权限配置错误
- content.js 不是 IIFE 格式

**解决**:
```bash
# 检查 content.js 格式
head -1 dist/content.js
# 应该输出: (function(){

# 检查是否有 import 语句
grep "^import " dist/content.js
# 应该无输出

# 重新构建
npm run build
```

### 问题 5: 消息发送失败

**症状**: 输入消息后无响应或报错

**调试步骤**:
```
1. 打开 chrome://extensions/
2. 找到 AI Chat Assistant
3. 点击 "Service Worker" 链接
4. 查看 Console 日志
```

**常见原因**:
- Background service worker 未运行
- IndexedDB 初始化失败
- 消息通信被阻止

**解决**:
```
1. 在扩展管理页面点击"重新加载"
2. 刷新网页
3. 重新打开聊天窗口
```

### 问题 6: 设置无法保存

**症状**: 在 Options 页面修改设置后，刷新页面设置丢失

**调试步骤**:
```
1. 打开 Options 页面
2. F12 打开 DevTools
3. 切换到 Application 标签
4. 查看 IndexedDB → ai-chat-db → settings
```

**解决**:
- 确认 background.js 正常运行
- 检查 Console 是否有错误
- 尝试清除 IndexedDB 重新初始化

## 📊 性能检查

### 检查内存占用

```
1. 打开 Chrome 任务管理器 (Shift + Esc)
2. 找到 "扩展: AI Chat Assistant"
3. 查看内存占用
```

**正常范围**: 20-40 MB

### 检查加载速度

```
1. 右键点击扩展图标 → "检查弹出内容"
2. 切换到 Network 标签
3. 重新打开 Popup
4. 查看加载时间
```

**正常范围**: < 100ms

### 检查 IndexedDB 数据

```
1. 在任意页面按 F12
2. 切换到 Application 标签
3. 展开 IndexedDB → ai-chat-db
4. 查看三个表：sessions, messages, settings
```

## 🎓 开发模式

### 监听文件变化

```bash
# 开启开发模式（自动重新构建）
npm run dev
```

**注意**: 每次构建后需要在 Chrome 中手动重新加载扩展

### 调试技巧

#### 调试 Popup
```
右键点击扩展图标 → 检查弹出内容
```

#### 调试 Content Script
```
在网页上右键 → 检查 → Console
```

#### 调试 Background
```
chrome://extensions/ → AI Chat Assistant → Service Worker
```

#### 调试 Options
```
打开 Options 页面 → F12
```

### 查看日志

所有组件都有 console.log 输出，可以在对应的 DevTools 中查看：

```javascript
// Popup
console.log('加载统计信息失败:', error)

// Content Script
console.log('Content script未注入，正在注入...')

// Background
console.error('Background error:', error)
```

## 🔄 更新扩展

### 修改代码后

```bash
# 1. 重新构建
npm run build

# 2. 在 Chrome 中重新加载扩展
chrome://extensions/ → AI Chat Assistant → 点击刷新图标 🔄

# 3. 刷新正在使用扩展的网页
```

### 修改 manifest.json 后

```bash
# 必须重新加载扩展
chrome://extensions/ → AI Chat Assistant → 点击刷新图标 🔄
```

## 📝 下一步

### 接入真实 AI API

编辑 `src/background/index.ts`:

```typescript
// 找到 simulateAIResponse 函数
async function simulateAIResponse(message: string): Promise<string> {
  // 替换为真实 API 调用
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }]
    })
  })
  
  const data = await response.json()
  return data.choices[0].message.content
}
```

### 添加新功能

1. 在 `src/` 目录下修改代码
2. 运行 `npm run build`
3. 在 Chrome 中重新加载扩展
4. 测试新功能

### 发布到 Chrome Web Store

1. 准备图标和截图
2. 编写商店描述
3. 打包 `dist` 目录为 zip
4. 上传到 Chrome Web Store

## 🎉 完成！

现在你已经成功运行了 AI Chat Assistant 扩展！

**快速访问**:
- 项目目录: `/Users/lidan/Desktop/code/ai-chat-extension`
- 构建输出: `/Users/lidan/Desktop/code/ai-chat-extension/dist`
- 扩展管理: `chrome://extensions/`

**文档**:
- [README.md](./README.md) - 项目说明
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 架构文档
- [TEST_GUIDE.md](./TEST_GUIDE.md) - 测试指南
- [SUMMARY.md](./SUMMARY.md) - 项目总结

**需要帮助?**
- 查看 Console 日志
- 运行 `cd dist && ./verify.sh`
- 阅读故障排除部分
