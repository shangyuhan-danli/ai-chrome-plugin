# 网站 Skill 创建指南

本模板展示了如何为特定网站创建 skill，以提高 DOM 操作的准确性。

## 快速开始

### 1. 复制模板

```bash
# 复制模板到新目录
cp -r website-skill-template your-website-skill
cd your-website-skill
```

### 2. 修改 SKILL.md

编辑 `SKILL.md` 文件：

- **修改 frontmatter**: 更新 `name` 和 `description`
- **更新适用页面**: 修改 URL 匹配模式
- **添加选择器**: 根据目标网站添加实际的 DOM 选择器

### 3. 完善参考资料

- **dom-selectors.md**: 添加完整的 DOM 选择器列表
- **workflows.md**: 添加常见操作流程示例

### 4. 测试和迭代

- 在实际网站上测试选择器
- 根据测试结果调整选择器
- 添加备用选择器提高容错性

## 如何发现 DOM 选择器

### 方法 1: 浏览器开发者工具

1. 打开目标网站
2. 按 `F12` 打开开发者工具
3. 使用元素选择器（左上角图标）点击目标元素
4. 在 Elements 面板中查看元素的属性
5. 优先选择：
   - `name` 属性（最稳定）
   - `id` 属性（如果存在）
   - `aria-label` 属性（语义化）
   - `data-*` 属性（自定义属性，通常较稳定）

### 方法 2: 使用项目内置的元素收集器

你的项目已经有 `elementCollector.ts`，可以：

1. 在目标网站上运行元素收集器
2. 查看收集到的元素信息
3. 根据元素的描述和属性确定选择器

### 方法 3: 测试选择器

在浏览器控制台中测试选择器：

```javascript
// 测试选择器是否有效
document.querySelector('input[name="q"]')

// 测试多个备用选择器
document.querySelector('#search-input') || 
document.querySelector('.search-box input') ||
document.querySelector('input[type="search"]')
```

## Skill 集成到项目

### 方式 1: 直接使用（当前方式）

Skill 文件存储在 `skills/` 目录下，AI 会根据页面 URL 自动匹配并加载对应的 skill。

### 方式 2: 在 AI 提示词中引用

当 AI 需要操作特定网站时，可以：

1. 检测当前页面 URL
2. 查找匹配的 skill
3. 加载 skill 中的选择器信息
4. 使用预定义的选择器生成 `page_action` 工具调用

### 示例：在 AI 提示词中使用

```javascript
// 伪代码示例
const currentUrl = window.location.href;
const matchingSkill = findMatchingSkill(currentUrl);

if (matchingSkill) {
  // 加载 skill 中的选择器信息
  const selectors = loadSkillSelectors(matchingSkill);
  
  // 在提示词中包含选择器信息
  const prompt = `
    当前网站: ${currentUrl}
    可用选择器: ${JSON.stringify(selectors)}
    
    用户请求: ${userRequest}
    
    请使用上述选择器生成 page_action 工具调用。
  `;
}
```

## 选择器最佳实践

### ✅ 推荐做法

1. **使用稳定的属性**: `name`, `id`, `aria-label`
2. **提供备用选择器**: 为关键元素提供多个备用选择器
3. **组合选择器**: 当单个选择器不够精确时，组合多个属性
4. **文档化**: 在注释中说明选择器的用途和为什么选择它

### ❌ 避免做法

1. **避免使用不稳定的 class**: 很多网站的 class 名称会变化
2. **避免使用位置选择器**: `:nth-child()`, `:first-child` 等容易失效
3. **避免使用文本内容**: `:contains()` 等基于文本的选择器不稳定
4. **避免过度具体**: 选择器应该足够具体，但不要过度

## 示例：为淘宝创建 Skill

```markdown
---
name: taobao-actions
description: 在淘宝网站上执行常见操作，包括搜索商品、添加到购物车、下单等。包含预定义的 DOM 选择器信息，提高操作准确性。
---

# 淘宝操作 Skill

## 适用页面
- `https://www.taobao.com/**`
- `https://item.taobao.com/**`

## 核心操作

### 1. 搜索商品

```javascript
{
  searchInput: {
    selector: '#q',
    description: '搜索输入框',
    type: 'input'
  },
  searchButton: {
    selector: '.btn-search',
    description: '搜索按钮',
    type: 'button'
  }
}
```
```

## 维护和更新

### 定期检查

- 网站改版时，检查选择器是否仍然有效
- 添加新的操作流程
- 更新备用选择器

### 版本管理

建议为 skill 添加版本号：

```yaml
---
name: website-skill
version: 1.0.0
description: ...
---
```

## 常见问题

### Q: 选择器失效了怎么办？

A: 
1. 检查网站是否改版
2. 使用浏览器开发者工具重新查找元素
3. 更新选择器并添加备用选择器
4. 测试新的选择器

### Q: 如何处理动态加载的内容？

A: 
1. 使用 `wait` 操作等待元素出现
2. 设置合理的超时时间
3. 检查元素是否可见

### Q: 如何处理 iframe 中的元素？

A: 
1. 使用 `switchFrame` 操作切换到对应的 frame
2. 操作完成后切换回主 frame

### Q: 如何提高选择器的稳定性？

A: 
1. 优先使用语义化的属性（name, id, aria-label）
2. 避免使用可能变化的 class 名称
3. 提供多个备用选择器
4. 定期测试和更新
