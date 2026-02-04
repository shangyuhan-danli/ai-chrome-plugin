# Skill 沙箱操作能力说明

## 一、沙箱中可以直接操作的内容

### ✅ 1. JavaScript 基本功能

```javascript
// ✅ 变量和数据类型
const name = "iPhone";
const price = 9999;
const isAvailable = true;
const items = [1, 2, 3];
const obj = { name: "iPhone", price: 9999 };

// ✅ 基本运算
const total = price * 1.1;  // 计算
const text = name + " 16";   // 字符串拼接

// ✅ 控制流
if (isAvailable) {
  console.log("有货");
} else {
  console.log("缺货");
}

for (let i = 0; i < items.length; i++) {
  console.log(items[i]);
}

// ✅ 函数定义
function calculateTotal(price, tax) {
  return price * (1 + tax);
}

// ✅ 数组操作
const filtered = items.filter(x => x > 1);
const mapped = items.map(x => x * 2);

// ✅ 对象操作
const keys = Object.keys(obj);
const values = Object.values(obj);
```

### ✅ 2. 上下文数据（context）

```javascript
// ✅ 访问注入的上下文
const url = context.url;              // 当前页面 URL
const pageTitle = context.pageTitle;  // 页面标题
const elements = context.elements;     // 页面元素列表

// ✅ 访问自定义上下文数据
const keyword = context.keyword;      // 用户传入的自定义数据
const userId = context.userId;        // 用户 ID
```

### ✅ 3. 数据处理和计算

```javascript
// ✅ 字符串处理
const text = "iPhone 16 Pro Max";
const words = text.split(" ");
const upper = text.toUpperCase();
const match = text.match(/iPhone/);

// ✅ 数字计算
const sum = [1, 2, 3].reduce((a, b) => a + b, 0);
const max = Math.max(1, 2, 3);
const random = Math.random();

// ✅ 日期处理
const now = new Date();
const timestamp = Date.now();

// ✅ JSON 操作
const jsonStr = JSON.stringify({ name: "iPhone" });
const obj = JSON.parse(jsonStr);
```

### ✅ 4. 逻辑判断和条件处理

```javascript
// ✅ 条件判断
if (context.elements && context.elements.length > 0) {
  // 处理元素
}

// ✅ 类型检查
if (typeof value === 'string') {
  // 字符串处理
}

// ✅ 存在性检查
if (value !== null && value !== undefined) {
  // 处理值
}
```

## 二、沙箱中不能直接操作的内容

### ❌ 1. 主页面 DOM

```javascript
// ❌ 这些操作都被阻止
document.getElementById('input')        // 无法访问
window.document                         // 无法访问
parent.document                         // 无法访问（在严格沙箱中）
document.querySelector('.class')        // 无法访问
```

### ❌ 2. Chrome/Browser API

```javascript
// ❌ 这些操作都被阻止
chrome.storage                          // 无法访问
chrome.tabs                             // 无法访问
browser.storage                         // 无法访问
localStorage                            // 无法访问（沙箱中的 localStorage 是隔离的）
sessionStorage                          // 无法访问
```

### ❌ 3. 网络请求

```javascript
// ❌ 这些操作都被阻止（在脚本验证阶段）
fetch('https://api.example.com')        // 被验证阻止
XMLHttpRequest                          // 被验证阻止
```

### ❌ 4. 危险操作

```javascript
// ❌ 这些操作都被验证阻止
eval('code')                            // 被验证阻止
new Function('code')                    // 被验证阻止
document.write('html')                  // 被验证阻止
setTimeout(() => {}, 1000)              // 被验证阻止（可选）
```

### ❌ 5. 弹窗和表单

```javascript
// ❌ 这些操作被 sandbox 属性阻止
window.open('url')                      // 被 sandbox 阻止
alert('message')                        // 被 sandbox 阻止（如果没有 allow-modals）
form.submit()                           // 被 sandbox 阻止（如果没有 allow-forms）
```

## 三、通过 safeAPI 可以操作的内容

### ✅ 当前提供的 safeAPI

```javascript
// ✅ 1. 通过 ID 获取元素信息
const element = await safeAPI.getElementById('search-input');
// 返回: { tagName, textContent, value, placeholder, getAttribute }

// ✅ 2. 通过选择器获取元素信息
const element = await safeAPI.querySelector('#search-input');
// 返回: { tagName, textContent, value, placeholder, getAttribute }

// ✅ 3. 获取页面元素列表
const elements = safeAPI.getElements();
// 返回: 页面元素数组（从 context 中获取）

// ✅ 4. 获取上下文数据
const context = safeAPI.getContext();
// 返回: 完整的上下文对象
```

### 📝 safeAPI 使用示例

```javascript
// 示例 1: 查找搜索框
const searchInput = await safeAPI.getElementById('q');
if (searchInput) {
  return {
    found: true,
    placeholder: searchInput.placeholder,
    currentValue: searchInput.value
  };
}

// 示例 2: 查找多个元素
const elements = safeAPI.getElements();
const buttons = elements.filter(el => 
  el.desc && el.desc.includes('按钮')
);

// 示例 3: 使用选择器
const submitBtn = await safeAPI.querySelector('button[type="submit"]');
if (submitBtn) {
  return { buttonText: submitBtn.textContent };
}
```

## 四、可以扩展的 safeAPI 功能

### 🔮 未来可以添加的功能

```javascript
// 1. 安全点击元素
await safeAPI.clickElement('button-id');

// 2. 安全填充输入框
await safeAPI.fillInput('input-id', 'value');

// 3. 安全滚动到元素
await safeAPI.scrollToElement('element-id');

// 4. 安全获取元素属性
const href = await safeAPI.getAttribute('link-id', 'href');

// 5. 安全读取文本内容
const text = await safeAPI.getTextContent('element-id');

// 6. 安全检查元素状态
const isVisible = await safeAPI.isVisible('element-id');
const isEnabled = await safeAPI.isEnabled('element-id');

// 7. 安全等待元素出现
await safeAPI.waitForElement('element-id', { timeout: 5000 });

// 8. 安全执行页面操作（通过 page_action 工具）
await safeAPI.executeAction({
  action: 'fill',
  target: { elementId: 'input-id' },
  params: { value: 'iPhone' }
});
```

## 五、完整示例

### 示例 1: 简单的数据提取

```javascript
// Skill: 提取搜索框信息
const searchInput = await safeAPI.getElementById('search-input');
const submitBtn = await safeAPI.querySelector('button[type="submit"]');

return {
  searchInput: {
    placeholder: searchInput?.placeholder || '',
    currentValue: searchInput?.value || ''
  },
  submitButton: {
    text: submitBtn?.textContent || '',
    exists: !!submitBtn
  }
};
```

### 示例 2: 复杂的逻辑处理

```javascript
// Skill: 分析页面结构
const elements = safeAPI.getElements();
const context = safeAPI.getContext();

// 统计不同类型的元素
const stats = {
  inputs: 0,
  buttons: 0,
  links: 0
};

elements.forEach(el => {
  if (el.desc?.includes('输入框')) stats.inputs++;
  if (el.desc?.includes('按钮')) stats.buttons++;
  if (el.desc?.includes('链接')) stats.links++;
});

// 查找特定元素
const searchInput = elements.find(el => 
  el.desc?.includes('搜索') || 
  el.desc?.includes('search')
);

return {
  pageUrl: context.url,
  pageTitle: context.pageTitle,
  elementStats: stats,
  searchInputFound: !!searchInput,
  searchInputId: searchInput?.id
};
```

### 示例 3: 数据处理和转换

```javascript
// Skill: 处理商品列表
const elements = safeAPI.getElements();

// 提取商品信息
const products = elements
  .filter(el => el.desc?.includes('商品') || el.desc?.includes('product'))
  .map((el, index) => ({
    id: el.id,
    index: index + 1,
    description: el.desc
  }));

// 计算统计信息
const stats = {
  total: products.length,
  hasProducts: products.length > 0,
  productIds: products.map(p => p.id)
};

return {
  products,
  stats,
  summary: `找到 ${stats.total} 个商品`
};
```

## 六、操作能力总结表

| 操作类型 | 是否支持 | 说明 |
|---------|---------|------|
| **JavaScript 基本功能** | ✅ | 变量、函数、控制流、数组、对象等 |
| **数据处理** | ✅ | 字符串、数字、日期、JSON 等 |
| **上下文数据** | ✅ | context.url, context.elements 等 |
| **主页面 DOM** | ❌ | 需要通过 safeAPI |
| **Chrome API** | ❌ | 完全无法访问 |
| **网络请求** | ❌ | 被验证阻止 |
| **危险操作** | ❌ | eval, Function 等被阻止 |
| **弹窗/表单** | ❌ | 被 sandbox 阻止 |
| **safeAPI** | ✅ | getElementById, querySelector 等 |

## 七、最佳实践

### ✅ 推荐做法

```javascript
// 1. 使用 async/await 处理 safeAPI 调用
const element = await safeAPI.getElementById('input-id');

// 2. 检查元素是否存在
if (element) {
  // 处理元素
}

// 3. 使用上下文数据
const elements = safeAPI.getElements();
const context = safeAPI.getContext();

// 4. 处理错误
try {
  const element = await safeAPI.getElementById('input-id');
  return { success: true, element };
} catch (error) {
  return { success: false, error: error.message };
}
```

### ❌ 避免做法

```javascript
// ❌ 不要尝试直接访问 DOM
const el = document.getElementById('input');  // 不会工作

// ❌ 不要使用同步方式调用 safeAPI
const el = safeAPI.getElementById('input');  // 错误，需要 await

// ❌ 不要尝试访问 Chrome API
chrome.storage.get('key');  // 不会工作

// ❌ 不要使用危险操作
eval('code');  // 会被验证阻止
```

## 八、总结

**沙箱中可以：**
- ✅ 使用 JavaScript 基本功能
- ✅ 处理数据和逻辑
- ✅ 访问上下文数据
- ✅ 通过 safeAPI 安全访问主页面元素

**沙箱中不能：**
- ❌ 直接操作主页面 DOM
- ❌ 访问 Chrome API
- ❌ 执行网络请求
- ❌ 使用危险操作（eval, Function 等）

**设计理念：**
- 提供足够的灵活性来完成自动化任务
- 同时确保安全性，防止恶意代码
- 通过 safeAPI 提供受控的访问方式
