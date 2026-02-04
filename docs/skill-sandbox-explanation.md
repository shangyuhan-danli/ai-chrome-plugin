# Skill 沙箱执行机制详解

## 一、什么是沙箱（Sandbox）？

沙箱是一种安全机制，用于隔离代码执行环境，防止恶意代码影响主环境。

### 类比理解

想象一下：
- **主页面** = 你的房子
- **沙箱 iframe** = 一个完全隔离的玻璃房间
- **Skill 脚本** = 在玻璃房间里工作的人

这个玻璃房间：
- ✅ 可以执行代码（allow-scripts）
- ✅ 可以与你的房子通信（allow-same-origin + postMessage）
- ❌ 不能直接操作你的房子（只能通过安全接口）
- ❌ 不能打开弹窗（no allow-popups）
- ❌ 不能提交表单（no allow-forms）

## 二、沙箱实现原理

### 2.1 使用 iframe sandbox 属性

```typescript
const iframe = document.createElement('iframe')
iframe.sandbox.add('allow-scripts')      // 允许执行 JavaScript
iframe.sandbox.add('allow-same-origin')  // 允许访问父页面（用于通信）
// 注意：不添加 allow-forms, allow-popups, allow-modals 等危险权限
```

**sandbox 属性的作用：**
- 创建一个隔离的执行环境
- 限制 iframe 可以执行的操作
- 防止恶意代码影响主页面

### 2.2 通信机制：postMessage

由于沙箱隔离，Skill 脚本无法直接访问主页面 DOM，需要通过 `postMessage` 通信：

```
┌─────────────────┐         postMessage          ┌──────────────┐
│   主页面        │ ◄─────────────────────────── │  沙箱 iframe │
│  (你的房子)     │ ───────────────────────────► │  (玻璃房间)  │
└─────────────────┘         postMessage          └──────────────┘
```

### 2.3 安全 API（safeAPI）

Skill 脚本不能直接操作 DOM，只能通过 `safeAPI` 请求：

```javascript
// ❌ 这样不行（在沙箱中）
const el = parent.document.getElementById('input')  // 被阻止

// ✅ 这样可以（通过 safeAPI）
const el = await safeAPI.getElementById('input')    // 安全
```

## 三、执行流程详解

### 步骤 1：创建沙箱 iframe

```typescript
const iframe = document.createElement('iframe')
iframe.sandbox.add('allow-scripts')
iframe.sandbox.add('allow-same-origin')
iframe.src = 'about:blank'
document.body.appendChild(iframe)
```

### 步骤 2：注入脚本到沙箱

```typescript
const sandboxScript = `
  // 1. 注入上下文数据
  const context = ${JSON.stringify(context)};
  
  // 2. 创建 safeAPI（通过 postMessage 通信）
  const safeAPI = {
    getElementById: async (id) => {
      return await sendRequest('getElementById', { id });
    },
    querySelector: async (selector) => {
      return await sendRequest('querySelector', { selector });
    }
  };
  
  // 3. 执行用户脚本
  ${userScript}
  
  // 4. 发送结果
  parent.postMessage({ type: 'SKILL_RESULT', result }, '*');
`

iframe.contentDocument.body.appendChild(scriptElement)
```

### 步骤 3：处理 safeAPI 请求

当 Skill 调用 `safeAPI.getElementById()` 时：

```typescript
// 沙箱中发送请求
parent.postMessage({
  type: 'SKILL_REQUEST',
  requestType: 'getElementById',
  data: { id: 'input' }
}, '*')

// 主页面接收请求
window.addEventListener('message', (event) => {
  if (event.data.type === 'SKILL_REQUEST') {
    const el = document.getElementById(event.data.data.id)
    // 只返回安全的数据（不返回 DOM 对象本身）
    event.source.postMessage({
      type: 'SKILL_RESPONSE',
      result: {
        tagName: el.tagName,
        textContent: el.textContent,
        value: el.value
      }
    }, '*')
  }
})
```

### 步骤 4：返回执行结果

```typescript
// 沙箱发送结果
parent.postMessage({
  type: 'SKILL_RESULT',
  result: { found: true, value: 'iPhone' }
}, '*')

// 主页面接收结果
window.addEventListener('message', (event) => {
  if (event.data.type === 'SKILL_RESULT') {
    resolve(event.data.result)  // 返回给调用者
  }
})
```

## 四、安全机制

### 4.1 脚本验证（执行前）

```typescript
const dangerousPatterns = [
  /eval\s*\(/,           // 禁止 eval
  /Function\s*\(/,        // 禁止 Function 构造器
  /document\.write/,      // 禁止直接写入 DOM
  /chrome\./,            // 禁止访问 Chrome API
  /fetch\s*\(/,          // 禁止网络请求
]
```

### 4.2 沙箱隔离（执行时）

- 脚本在隔离的 iframe 中执行
- 无法直接访问主页面 DOM
- 无法访问 Chrome API
- 无法打开弹窗或提交表单

### 4.3 安全 API（受控访问）

- 只能通过 `safeAPI` 访问 DOM
- 只返回安全的数据（不返回 DOM 对象）
- 限制可执行的操作

### 4.4 超时保护

```typescript
setTimeout(() => {
  reject(new Error('Skill 执行超时'))
}, 10000)  // 10秒超时
```

## 五、完整示例

### 示例 1：简单的 Skill

```typescript
// 注册 Skill
skillManager.registerSkill({
  id: 'get-input-value',
  name: '获取输入框值',
  script: `
    // 使用 safeAPI 获取元素
    const input = await safeAPI.getElementById('search-input');
    if (input) {
      return { value: input.value, found: true };
    }
    return { found: false };
  `
})

// 执行 Skill
const result = await skillManager.executeSkill('get-input-value', {
  url: window.location.href,
  pageTitle: document.title
})
```

### 示例 2：带上下文的 Skill

```typescript
skillManager.registerSkill({
  id: 'search-product',
  name: '搜索商品',
  matchPatterns: ['https://www.taobao.com/*'],
  script: `
    // 使用上下文数据
    const keyword = context.keyword || 'iPhone';
    
    // 查找搜索框
    const searchInput = await safeAPI.querySelector('#q');
    if (searchInput) {
      return {
        found: true,
        placeholder: searchInput.placeholder,
        canSearch: true
      };
    }
    return { found: false };
  `
})
```

## 六、为什么这样设计？

### 6.1 为什么使用 iframe sandbox？

- ✅ 真正的隔离环境
- ✅ 浏览器原生支持
- ✅ 可以精确控制权限

### 6.2 为什么使用 postMessage？

- ✅ 跨域安全通信
- ✅ 不直接暴露 DOM
- ✅ 可以验证消息来源

### 6.3 为什么需要 safeAPI？

- ✅ 限制可执行的操作
- ✅ 防止直接操作 DOM
- ✅ 可以记录和审计

## 七、限制和注意事项

### 7.1 当前限制

1. **异步操作**：safeAPI 调用是异步的（因为需要 postMessage）
2. **数据序列化**：只能传递可序列化的数据
3. **性能开销**：postMessage 通信有性能开销

### 7.2 安全注意事项

1. **消息验证**：始终验证消息来源
2. **超时设置**：设置合理的超时时间
3. **错误处理**：妥善处理错误情况

## 八、改进方向

### 8.1 使用 Web Worker（更安全）

```typescript
const worker = new Worker(URL.createObjectURL(
  new Blob([script], { type: 'application/javascript' })
))
```

### 8.2 使用 Content Security Policy (CSP)

```html
<meta http-equiv="Content-Security-Policy" 
      content="script-src 'self' 'unsafe-inline';">
```

### 8.3 添加更多安全 API

- `safeAPI.clickElement(id)` - 安全点击
- `safeAPI.fillInput(id, value)` - 安全填充
- `safeAPI.scrollToElement(id)` - 安全滚动

## 九、总结

沙箱执行机制通过以下方式确保安全：

1. **隔离环境**：iframe sandbox 创建隔离的执行环境
2. **受限访问**：只能通过 safeAPI 访问主页面
3. **通信验证**：postMessage 通信，验证消息来源
4. **超时保护**：防止脚本无限执行
5. **脚本验证**：执行前检查危险操作

这样既保证了功能的灵活性，又确保了安全性。
