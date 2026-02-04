# 选择器策略参考

本文档提供了 DOM 选择器提取和优化的详细策略。

## 选择器优先级策略

### 优先级排序

| 优先级 | 选择器类型 | 稳定性 | 示例 |
|--------|-----------|--------|------|
| 1 | `name` 属性 | ⭐⭐⭐⭐⭐ | `input[name="username"]` |
| 2 | `id` 属性 | ⭐⭐⭐⭐ | `#username` |
| 3 | `aria-label` 属性 | ⭐⭐⭐⭐ | `button[aria-label="登录"]` |
| 4 | `type` 属性 | ⭐⭐⭐ | `input[type="password"]` |
| 5 | `role` 属性 | ⭐⭐⭐ | `[role="button"]` |
| 6 | `placeholder` 属性 | ⭐⭐ | `input[placeholder*="用户名"]` |
| 7 | 文本内容 | ⭐⭐ | `button:contains("登录")` |
| 8 | `class` 属性 | ⭐ | `.login-btn` |
| 9 | 位置选择器 | ⭐ | `:nth-child(2)` |

### 选择器稳定性评估

#### 高稳定性选择器

**特征**:
- 不会因为样式变化而改变
- 不会因为内容更新而改变
- 通常与功能相关而非样式相关

**示例**:
```javascript
// ✅ 高稳定性
input[name="username"]        // name 属性通常与后端字段绑定
#user-login-form              // id 通常用于功能标识
button[type="submit"]         // type 属性是HTML标准
[aria-label="登录"]           // aria-label 用于无障碍访问
```

#### 中稳定性选择器

**特征**:
- 可能因为重构而改变
- 但通常保持相对稳定

**示例**:
```javascript
// ⚠️ 中稳定性
input[type="email"]           // type 可能变化
[role="button"]               // role 可能被移除
input[placeholder*="邮箱"]    // placeholder 可能变化
```

#### 低稳定性选择器

**特征**:
- 经常因为样式更新而改变
- 与视觉设计相关

**示例**:
```javascript
// ❌ 低稳定性
.btn-primary                  // class 可能因样式更新而改变
.container .row .col          // 布局相关的 class
:nth-child(2)                 // 位置可能因内容变化而改变
```

## 选择器提取模式

### 模式 1: 单一属性选择器

**适用场景**: 元素有稳定的唯一属性

**提取步骤**:
1. 检查元素的 `name` 属性
2. 如果没有，检查 `id` 属性
3. 如果没有，检查 `aria-label` 属性
4. 生成选择器字符串

**示例**:
```javascript
// 元素: <input name="email" id="user-email" class="form-control">
{
  selector: 'input[name="email"]',  // 优先使用 name
  fallback: ['#user-email']         // id 作为备用
}
```

### 模式 2: 组合属性选择器

**适用场景**: 单一属性不够精确，需要组合多个属性

**提取步骤**:
1. 识别多个稳定属性
2. 组合成更精确的选择器
3. 提供单一属性版本作为备用

**示例**:
```javascript
// 元素: <button type="submit" class="btn" aria-label="提交表单">
{
  selector: 'button[type="submit"][aria-label="提交表单"]',  // 组合选择器
  fallback: [
    'button[type="submit"]',           // 单一属性备用
    'button[aria-label="提交表单"]'
  ]
}
```

### 模式 3: 上下文选择器

**适用场景**: 元素本身属性不稳定，但父元素稳定

**提取步骤**:
1. 识别稳定的父元素
2. 使用后代选择器或子选择器
3. 提供直接选择器作为备用

**示例**:
```javascript
// 结构: <form id="login-form"><input name="username"></form>
{
  selector: '#login-form input[name="username"]',  // 上下文选择器
  fallback: ['input[name="username"]']              // 直接选择器备用
}
```

### 模式 4: 语义化选择器

**适用场景**: 使用语义化HTML标签和属性

**提取步骤**:
1. 识别语义化标签（`main`、`article`、`nav`等）
2. 识别 `role` 属性
3. 识别 `aria-*` 属性
4. 生成语义化选择器

**示例**:
```javascript
// 元素: <main role="main"><button aria-label="搜索">搜索</button></main>
{
  selector: 'main[role="main"] button[aria-label="搜索"]',  // 语义化选择器
  fallback: [
    'main button[aria-label="搜索"]',
    'button[aria-label="搜索"]'
  ]
}
```

## 备用选择器策略

### 为什么需要备用选择器？

1. **提高容错性**: 当主选择器失效时，可以使用备用选择器
2. **适应变化**: 网站更新时，备用选择器可能仍然有效
3. **提高成功率**: 不同页面可能使用不同的选择器

### 备用选择器生成规则

1. **优先级递减**: 按稳定性从高到低排列
2. **数量限制**: 通常提供 2-3 个备用选择器
3. **类型多样**: 使用不同类型的属性作为备用

**示例**:
```javascript
{
  selector: 'input[name="username"]',        // 主选择器（最高优先级）
  fallback: [
    '#username',                             // 备用1：id 选择器
    'input[type="text"][placeholder*="用户名"]',  // 备用2：组合选择器
    '.form-input'                            // 备用3：class 选择器（最低优先级）
  ]
}
```

## 选择器优化技巧

### 技巧 1: 避免过度具体化

**问题**: 选择器过于具体，容易失效

```javascript
// ❌ 过于具体
div.container > div.row > div.col-md-6 > form#login-form > input[name="username"]

// ✅ 简化
input[name="username"]
// 或
#login-form input[name="username"]
```

### 技巧 2: 使用部分匹配

**场景**: 属性值可能包含动态部分

```javascript
// ✅ 使用部分匹配
input[placeholder*="用户名"]     // 匹配包含"用户名"的 placeholder
a[href*="/login"]                // 匹配包含"/login"的 href
button[class*="btn"]             // 匹配包含"btn"的 class
```

### 技巧 3: 避免位置选择器

**问题**: 位置选择器容易因内容变化而失效

```javascript
// ❌ 位置选择器
.form-group:nth-child(2) input
.container > div:first-child

// ✅ 使用属性选择器
input[name="email"]
.form-group input[type="email"]
```

### 技巧 4: 处理动态 class

**场景**: class 名称包含动态部分（如 BEM 命名）

```javascript
// ❌ 完整 class（可能失效）
.button--primary--active

// ✅ 部分匹配
button[class*="button--primary"]
// 或使用其他稳定属性
button[type="submit"]
```

## 特殊场景处理

### 场景 1: React/Vue 动态内容

**问题**: 框架生成的元素可能没有稳定的属性

**策略**:
1. 查找数据属性（`data-*`）
2. 查找测试属性（`data-testid`、`data-cy`）
3. 使用文本内容作为最后手段

**示例**:
```javascript
// React 组件可能生成: <button data-testid="login-button">登录</button>
{
  selector: 'button[data-testid="login-button"]',  // 优先使用测试属性
  fallback: ['button:contains("登录")']            // 文本内容备用
}
```

### 场景 2: 动态 ID

**问题**: ID 可能包含动态部分（如 UUID）

**策略**:
1. 使用部分匹配
2. 使用其他稳定属性
3. 使用父元素作为上下文

**示例**:
```javascript
// 动态 ID: <input id="username-abc123xyz">
{
  selector: 'input[id^="username-"]',  // 前缀匹配
  fallback: ['input[name="username"]']  // 使用 name 属性
}
```

### 场景 3: 多语言网站

**问题**: 文本内容可能因语言而异

**策略**:
1. 优先使用非文本属性（`name`、`id`、`aria-label`）
2. 如果必须使用文本，提供多语言版本

**示例**:
```javascript
{
  selector: 'button[type="submit"]',  // 优先使用 type
  fallback: [
    'button:contains("登录")',        // 中文
    'button:contains("Login")',       // 英文
    'button[aria-label="登录"]'       // 无障碍标签
  ]
}
```

## 验证选择器有效性

### 验证步骤

1. **语法检查**: 确保选择器语法正确
2. **唯一性检查**: 确保选择器只匹配一个元素（如需要）
3. **存在性检查**: 确保选择器能匹配到元素
4. **稳定性检查**: 检查选择器在不同页面状态下的有效性

### 验证方法

```javascript
// 在浏览器控制台中验证
document.querySelector('input[name="username"]')  // 检查是否存在
document.querySelectorAll('input[name="username"]').length  // 检查是否唯一

// 检查备用选择器
document.querySelector('#username')  // 备用1
document.querySelector('.form-input')  // 备用2
```

## 最佳实践总结

1. **优先使用稳定属性**: `name` > `id` > `aria-label` > `type` > `class`
2. **提供备用选择器**: 至少提供 2-3 个备用选择器
3. **避免位置选择器**: 不使用 `:nth-child()` 等位置选择器
4. **使用部分匹配**: 对于动态属性值，使用 `*=`、`^=`、`$=` 等
5. **语义化优先**: 优先使用语义化标签和属性
6. **验证选择器**: 在实际页面中验证选择器的有效性
7. **文档化选择器**: 在 skill 文档中清晰说明选择器的用途和优先级
