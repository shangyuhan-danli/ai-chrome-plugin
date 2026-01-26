# 侧边栏页面左移功能 - 快速测试指南

## 测试前准备

### 1. 确认构建成功
```bash
cd /Users/lidan/Desktop/code/ai-chat-extension
npm run build
```

### 2. 加载扩展到 Chrome
```
1. 打开 chrome://extensions/
2. 启用"开发者模式"（右上角开关）
3. 点击"加载已解压的扩展程序"
4. 选择项目的 dist 目录
5. 确认扩展图标出现在工具栏
```

## 测试步骤

### 测试 1: 悬浮窗模式（默认）

**步骤**:
1. 打开任意网页（如 https://www.google.com）
2. 点击扩展图标
3. 点击"打开聊天窗口"按钮

**预期结果**:
- ✅ 聊天窗口以悬浮窗形式出现
- ✅ 窗口可以拖动
- ✅ 页面内容**不会**左移
- ✅ 窗口位置在页面右侧中间

**验证方法**:
```javascript
// 在浏览器控制台执行
console.log(document.body.style.transform) // 应该是空字符串 ""
console.log(document.body.classList.contains('ai-chat-sidebar-open')) // 应该是 false
```

---

### 测试 2: 切换到侧边栏模式

**步骤**:
1. 右键点击扩展图标
2. 选择"选项"
3. 在"显示模式"中选择"侧边栏模式"
4. 点击"保存设置"
5. 返回测试网页
6. 点击扩展图标
7. 点击"打开聊天窗口"

**预期结果**:
- ✅ 页面内容向左平移 400px（有 0.3s 动画）
- ✅ 侧边栏从右侧固定显示
- ✅ 侧边栏宽度 400px，高度占满整个视口
- ✅ 侧边栏不可拖动
- ✅ 页面不出现横向滚动条

**验证方法**:
```javascript
// 在浏览器控制台执行
console.log(document.body.style.transform) // 应该是 "translateX(-400px)"
console.log(document.body.classList.contains('ai-chat-sidebar-open')) // 应该是 true
console.log(document.body.style.width) // 应该是 "calc(100% + 400px)"
```

---

### 测试 3: 关闭侧边栏

**步骤**:
1. 在侧边栏模式下，点击聊天窗口右上角的"关闭"按钮

**预期结果**:
- ✅ 侧边栏消失
- ✅ 页面内容向右恢复到原位（有 0.3s 动画）
- ✅ 页面布局完全恢复正常

**验证方法**:
```javascript
// 在浏览器控制台执行
console.log(document.body.style.transform) // 应该是空字符串 ""
console.log(document.body.classList.contains('ai-chat-sidebar-open')) // 应该是 false
console.log(document.body.style.width) // 应该是空字符串 ""
```

---

### 测试 4: 最小化侧边栏

**步骤**:
1. 在侧边栏模式下打开聊天窗口
2. 点击右上角的"最小化"按钮

**预期结果**:
- ✅ 聊天内容区域隐藏
- ✅ 只显示标题栏
- ✅ 页面**仍然保持**左移状态
- ✅ 侧边栏高度变为 48px

**验证方法**:
```javascript
// 在浏览器控制台执行
console.log(document.body.style.transform) // 应该仍然是 "translateX(-400px)"
console.log(document.querySelector('.chat-window.sidebar.minimized')) // 应该存在
```

---

### 测试 5: 切换回悬浮窗模式

**步骤**:
1. 在侧边栏模式下打开聊天窗口
2. 右键点击扩展图标 → 选项
3. 切换回"悬浮窗模式"
4. 保存设置
5. 返回测试网页

**预期结果**:
- ✅ 页面立即恢复到原位（有动画）
- ✅ 聊天窗口变为可拖动的悬浮窗
- ✅ 窗口位置在页面右侧

**验证方法**:
```javascript
// 在浏览器控制台执行
console.log(document.body.style.transform) // 应该是空字符串 ""
console.log(document.querySelector('.chat-window.float')) // 应该存在
```

---

### 测试 6: 页面刷新后状态保持

**步骤**:
1. 设置为侧边栏模式
2. 打开聊天窗口
3. 刷新页面（F5）
4. 再次点击扩展图标打开聊天窗口

**预期结果**:
- ✅ 刷新后仍然是侧边栏模式
- ✅ 页面再次左移
- ✅ 历史消息保留

---

### 测试 7: 多标签页独立性

**步骤**:
1. 在标签页 A 打开侧边栏
2. 切换到标签页 B
3. 在标签页 B 打开侧边栏

**预期结果**:
- ✅ 每个标签页的侧边栏独立
- ✅ 每个标签页的页面左移独立
- ✅ 切换标签页时状态正确

---

### 测试 8: 固定定位元素处理

**步骤**:
1. 打开一个有固定定位元素的网页（如导航栏）
2. 切换到侧边栏模式
3. 打开聊天窗口

**预期结果**:
- ✅ 固定定位元素跟随页面左移
- ✅ 或者通过 CSS 补偿保持在原位
- ✅ 不会出现布局错乱

**测试网页建议**:
- GitHub (有固定顶部导航)
- Twitter (有固定侧边栏)
- YouTube (有固定顶部栏)

---

### 测试 9: 响应式测试

**步骤**:
1. 打开侧边栏
2. 调整浏览器窗口大小
3. 从全屏拖到小窗口

**预期结果**:
- ✅ 侧边栏始终占据 400px
- ✅ 页面左移距离始终是 400px
- ✅ 不会出现布局错乱

---

### 测试 10: 性能测试

**步骤**:
1. 打开 Chrome DevTools → Performance 标签
2. 开始录制
3. 切换到侧边栏模式并打开聊天窗口
4. 停止录制

**预期结果**:
- ✅ 动画流畅，60fps
- ✅ 没有明显的重排（reflow）
- ✅ 使用 GPU 加速（Composite Layers）

**验证方法**:
```javascript
// 检查是否使用了 transform（GPU 加速）
const body = document.body
const computedStyle = window.getComputedStyle(body)
console.log(computedStyle.transform) // 应该是 "matrix(1, 0, 0, 1, -400, 0)"
```

---

## 常见问题排查

### 问题 1: 页面没有左移

**检查**:
```javascript
// 1. 检查显示模式
chrome.runtime.sendMessage({
  type: 'GET_SETTING',
  payload: { key: 'displayMode' }
}, (response) => {
  console.log('Display mode:', response.data) // 应该是 "sidebar"
})

// 2. 检查窗口是否可见
console.log(document.querySelector('.chat-window.sidebar')) // 应该存在

// 3. 检查 body 样式
console.log(document.body.style.transform) // 应该是 "translateX(-400px)"
```

**可能原因**:
- displayMode 没有正确设置为 'sidebar'
- isVisible 为 false
- updatePageLayout 函数没有执行

---

### 问题 2: 页面左移但侧边栏没显示

**检查**:
```javascript
// 1. 检查容器是否存在
console.log(document.getElementById('ai-chat-extension-root')) // 应该存在

// 2. 检查 Vue 组件是否挂载
console.log(document.querySelector('.chat-window')) // 应该存在

// 3. 检查 z-index
const chatWindow = document.querySelector('.chat-window')
console.log(window.getComputedStyle(chatWindow).zIndex) // 应该是 "2147483647"
```

---

### 问题 3: 关闭后页面没有恢复

**检查**:
```javascript
// 1. 检查 closeWindow 是否执行
// 在 ChatWindow.vue 的 closeWindow 函数中添加 console.log

// 2. 手动恢复
document.body.style.transform = ''
document.body.style.width = ''
document.body.classList.remove('ai-chat-sidebar-open')
```

---

### 问题 4: 动画不流畅

**检查**:
```javascript
// 1. 检查 transition 是否设置
console.log(document.body.style.transition) // 应该是 "transform 0.3s ease"

// 2. 检查是否有其他 CSS 冲突
const body = document.body
const computedStyle = window.getComputedStyle(body)
console.log(computedStyle.transition)
```

---

## 调试技巧

### 1. 实时查看 body 样式变化

```javascript
// 在控制台执行，监听 body 样式变化
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'style') {
      console.log('Body style changed:', document.body.style.cssText)
    }
  })
})

observer.observe(document.body, {
  attributes: true,
  attributeFilter: ['style', 'class']
})
```

### 2. 查看所有扩展相关元素

```javascript
// 查找所有扩展注入的元素
console.log('Extension root:', document.getElementById('ai-chat-extension-root'))
console.log('Chat window:', document.querySelector('.chat-window'))
console.log('Body classes:', document.body.className)
console.log('Body transform:', document.body.style.transform)
```

### 3. 手动触发页面左移

```javascript
// 手动测试页面左移效果
document.body.style.transform = 'translateX(-400px)'
document.body.style.transition = 'transform 0.3s ease'
document.body.style.width = 'calc(100% + 400px)'
document.body.classList.add('ai-chat-sidebar-open')

// 恢复
setTimeout(() => {
  document.body.style.transform = ''
  document.body.style.width = ''
  document.body.classList.remove('ai-chat-sidebar-open')
}, 3000)
```

---

## 测试清单

打印此清单，逐项测试：

- [ ] 测试 1: 悬浮窗模式正常
- [ ] 测试 2: 侧边栏模式页面左移
- [ ] 测试 3: 关闭侧边栏页面恢复
- [ ] 测试 4: 最小化功能正常
- [ ] 测试 5: 模式切换正常
- [ ] 测试 6: 刷新后状态保持
- [ ] 测试 7: 多标签页独立
- [ ] 测试 8: 固定定位元素正常
- [ ] 测试 9: 响应式布局正常
- [ ] 测试 10: 性能表现良好

---

## 成功标准

所有测试通过后，你应该看到：

1. ✅ 悬浮窗模式：窗口可拖动，页面不移动
2. ✅ 侧边栏模式：页面平滑左移 400px，侧边栏固定右侧
3. ✅ 动画流畅：0.3s ease 过渡效果
4. ✅ 状态保持：刷新后设置不丢失
5. ✅ 清理完整：关闭后页面完全恢复
6. ✅ 兼容性好：各种网页都能正常工作
7. ✅ 性能优秀：60fps 流畅动画

---

## 下一步

测试通过后，可以考虑：

1. **自定义侧边栏宽度**: 在 Options 页面添加宽度设置
2. **支持左侧边栏**: 添加侧边栏位置选项
3. **响应式宽度**: 根据屏幕大小自动调整
4. **记住窗口状态**: 保存最小化/展开状态
5. **快捷键支持**: 添加键盘快捷键切换

---

## 反馈

如果遇到问题，请提供：

1. Chrome 版本
2. 测试的网页 URL
3. 控制台错误信息
4. 预期行为 vs 实际行为
5. 复现步骤

祝测试顺利！🎉
