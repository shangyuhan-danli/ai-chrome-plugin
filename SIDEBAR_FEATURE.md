# 侧边栏页面左移功能说明

## 功能概述

当聊天窗口切换到**侧边栏模式**时，整个网页会向左平移 400px，为侧边栏腾出空间，实现类似 IDE 侧边栏的效果。

## 实现原理

### 1. CSS Transform 方案

使用 `transform: translateX(-400px)` 实现页面左移，优点：
- ✅ 不破坏原页面布局
- ✅ 性能好，使用 GPU 加速
- ✅ 平滑动画过渡
- ✅ 兼容性强

### 2. 核心代码

#### ChatWindow.vue 中的实现

```typescript
// 监听显示模式变化
watch(displayMode, (newMode, oldMode) => {
  updateWindowStyle()
  updatePageLayout(newMode, oldMode)
})

// 监听窗口可见性变化
watch(isVisible, (newVisible) => {
  if (displayMode.value === 'sidebar') {
    updatePageLayout(displayMode.value, displayMode.value, newVisible)
  }
})

// 更新页面布局
const updatePageLayout = (newMode: string, oldMode?: string, visible?: boolean) => {
  const shouldShift = newMode === 'sidebar' && (visible !== false ? isVisible.value : visible)

  if (shouldShift) {
    // 侧边栏模式且可见 - 页面左移
    document.body.style.transform = 'translateX(-400px)'
    document.body.style.transition = 'transform 0.3s ease'
    document.body.style.width = 'calc(100% + 400px)'
    document.body.classList.add('ai-chat-sidebar-open')
  } else {
    // 恢复页面位置
    document.body.style.transform = ''
    document.body.style.transition = 'transform 0.3s ease'
    document.body.style.width = ''
    document.body.classList.remove('ai-chat-sidebar-open')
  }
}
```

#### style.css 中的辅助样式

```css
/* 侧边栏模式下的页面布局调整 */
body.ai-chat-sidebar-open {
  overflow-x: hidden;
}

/* 防止固定定位元素跟随页面移动 */
body.ai-chat-sidebar-open > *:not(#ai-chat-extension-root) {
  position: relative;
}

/* 保持某些特殊元素不受影响 */
body.ai-chat-sidebar-open > [style*="position: fixed"]:not(#ai-chat-extension-root) {
  transform: translateX(400px);
  transition: transform 0.3s ease;
}
```

## 使用方法

### 1. 加载扩展

```bash
1. 打开 Chrome 浏览器
2. 访问 chrome://extensions/
3. 启用"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 dist 目录
```

### 2. 切换到侧边栏模式

**方法 1: 通过 Options 页面**
```
1. 右键点击扩展图标
2. 选择"选项"
3. 在"显示模式"中选择"侧边栏模式"
4. 点击"保存设置"
```

**方法 2: 通过 Popup 页面**
```
1. 点击扩展图标
2. 在 Popup 中找到显示模式切换按钮
3. 选择"侧边栏模式"
```

### 3. 打开聊天窗口

```
1. 点击扩展图标
2. 点击"打开聊天窗口"按钮
3. 页面会自动向左移动 400px
4. 侧边栏从右侧滑入
```

## 效果演示

### 悬浮窗模式 (float)
```
┌─────────────────────────────────┐
│                                 │
│        网页内容                  │
│                                 │
│              ┌──────────┐       │
│              │ 聊天窗口  │       │
│              │ (可拖动)  │       │
│              └──────────┘       │
└─────────────────────────────────┘
```

### 侧边栏模式 (sidebar) - 页面左移
```
┌──────────────────────┬──────────┐
│                      │          │
│   网页内容 (左移)     │  侧边栏   │
│                      │  (固定)   │
│                      │          │
│                      │  聊天窗口 │
│                      │          │
└──────────────────────┴──────────┘
        ← 400px →
```

## 技术细节

### 1. 动画时序

```
用户点击"打开聊天窗口"
    ↓
isVisible.value = true
    ↓
watch(isVisible) 触发
    ↓
updatePageLayout('sidebar', 'sidebar', true)
    ↓
document.body.style.transform = 'translateX(-400px)'
    ↓
CSS transition 执行 (0.3s ease)
    ↓
页面平滑左移完成
```

### 2. 清理机制

```typescript
// 组件卸载时清理
const cleanup = () => {
  document.body.style.transform = ''
  document.body.style.transition = ''
  document.body.style.width = ''
  document.body.classList.remove('ai-chat-sidebar-open')
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// 监听页面卸载
window.addEventListener('beforeunload', cleanup)
```

### 3. 关闭窗口时恢复

```typescript
const closeWindow = () => {
  isVisible.value = false
  // 侧边栏模式下关闭时恢复页面位置
  if (displayMode.value === 'sidebar') {
    updatePageLayout('float')
  }
}
```

## 兼容性处理

### 1. 固定定位元素

原页面中的 `position: fixed` 元素会跟随页面左移，通过 CSS 规则补偿：

```css
body.ai-chat-sidebar-open > [style*="position: fixed"]:not(#ai-chat-extension-root) {
  transform: translateX(400px);
  transition: transform 0.3s ease;
}
```

### 2. 横向滚动条

通过设置 `overflow-x: hidden` 防止出现横向滚动条：

```css
body.ai-chat-sidebar-open {
  overflow-x: hidden;
}
```

### 3. 页面宽度调整

```typescript
document.body.style.width = 'calc(100% + 400px)'
```

确保页面内容不会被压缩，而是整体左移。

## 常见问题

### Q1: 页面左移后，某些固定定位元素位置不对？

**A**: 这是因为原页面的固定定位元素跟随了 body 的 transform。可以通过以下方式修复：

```css
/* 在 style.css 中添加 */
body.ai-chat-sidebar-open .your-fixed-element {
  transform: translateX(400px) !important;
}
```

### Q2: 页面左移后出现横向滚动条？

**A**: 检查是否有元素宽度超过了视口。已通过 `overflow-x: hidden` 处理。

### Q3: 切换模式时动画不流畅？

**A**: 确保 CSS transition 正确设置：

```typescript
document.body.style.transition = 'transform 0.3s ease'
```

### Q4: 关闭侧边栏后页面没有恢复？

**A**: 检查 `closeWindow()` 函数是否正确调用了 `updatePageLayout('float')`。

## 性能优化

### 1. 使用 Transform 而非 Margin

```typescript
// ✅ 推荐: 使用 transform (GPU 加速)
document.body.style.transform = 'translateX(-400px)'

// ❌ 不推荐: 使用 margin (触发重排)
document.body.style.marginLeft = '-400px'
```

### 2. 使用 requestAnimationFrame

```typescript
// 确保动画在下一帧执行
requestAnimationFrame(() => {
  document.body.style.transform = 'translateX(-400px)'
})
```

### 3. 避免频繁切换

通过 watch 监听，只在必要时更新布局。

## 扩展功能

### 1. 自定义侧边栏宽度

修改 `ChatWindow.vue`:

```typescript
const sidebarWidth = ref(400) // 可配置

const updatePageLayout = (newMode: string, oldMode?: string, visible?: boolean) => {
  const shouldShift = newMode === 'sidebar' && (visible !== false ? isVisible.value : visible)

  if (shouldShift) {
    document.body.style.transform = `translateX(-${sidebarWidth.value}px)`
    document.body.style.width = `calc(100% + ${sidebarWidth.value}px)`
  } else {
    document.body.style.transform = ''
    document.body.style.width = ''
  }
}
```

### 2. 支持左侧边栏

```typescript
const sidebarPosition = ref<'left' | 'right'>('right')

const updatePageLayout = (newMode: string, oldMode?: string, visible?: boolean) => {
  const shouldShift = newMode === 'sidebar' && (visible !== false ? isVisible.value : visible)

  if (shouldShift) {
    const direction = sidebarPosition.value === 'right' ? '-' : ''
    document.body.style.transform = `translateX(${direction}400px)`
  } else {
    document.body.style.transform = ''
  }
}
```

### 3. 响应式宽度

```typescript
const getSidebarWidth = () => {
  return window.innerWidth < 768 ? 300 : 400
}

watch(() => window.innerWidth, () => {
  if (displayMode.value === 'sidebar' && isVisible.value) {
    updatePageLayout('sidebar', 'sidebar', true)
  }
})
```

## 总结

侧边栏页面左移功能通过以下技术实现：

1. **CSS Transform**: 使用 GPU 加速的 transform 属性
2. **Vue Watch**: 响应式监听显示模式和可见性变化
3. **平滑动画**: 0.3s ease 过渡效果
4. **清理机制**: 页面卸载时自动恢复
5. **兼容性处理**: 处理固定定位元素和滚动条

这种实现方式性能好、兼容性强，适合在浏览器扩展中使用。
