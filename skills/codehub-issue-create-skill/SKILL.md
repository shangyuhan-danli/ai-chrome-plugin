---
name: codehub-issue-create-skill
description: 在 CodeHub 平台上根据用户需求自动生成和创建 Issue。当用户在 CodeHub 网站上提到创建或生成 issue 时，根据用户提到的关键词（如重构、安全问题整改）自动选择合适的模板，生成标准的 Issue 标题和描述。
---

# CodeHub Issue 创建 Skill

本 skill 提供了在 CodeHub 平台上创建 Issue 的模板化方案，帮助用户快速生成标准化的 Issue 内容。

## 适用页面

- `https://*codehub*/**` - 所有包含 "codehub" 的域名页面
- `https://codehub.*/**` - CodeHub 子域名页面

## 触发条件

当满足以下条件时，应使用本 skill：

1. **域名匹配**: 当前页面 URL 包含 "codehub"
2. **用户意图**: 用户明确提到以下任一关键词：
   - "创建 issue"
   - "生成 issue"
   - "新建 issue"
   - "创建问题"
   - "生成问题"
   - "提 issue"
   - "提问题"

## 模板选择逻辑

根据用户输入中的关键词，自动选择合适的模板：

### 1. 重构模板

**触发关键词**:
- "重构"
- "refactor"
- "代码重构"
- "优化代码"
- "代码优化"
- "改进代码结构"
- "代码清理"

**使用模板**: `references/issue-templates.md#重构模板`

### 2. 安全问题整改模板

**触发关键词**:
- "安全"
- "安全问题"
- "安全整改"
- "安全漏洞"
- "security"
- "vulnerability"
- "安全风险"
- "安全修复"

**使用模板**: `references/issue-templates.md#安全问题整改模板`

## 使用流程

### 步骤 1: 识别用户意图

1. 检查当前页面 URL 是否包含 "codehub"
2. 检查用户输入是否包含创建 issue 的意图
3. 识别用户提到的模板类型关键词

### 步骤 2: 选择模板

根据识别到的关键词，从 `references/issue-templates.md` 中选择对应的模板。

### 步骤 3: 生成 Issue 内容

使用选定的模板生成：
- **标题**: 使用模板中的标题格式
- **描述**: 使用模板中的描述格式，并根据用户的具体需求进行适当调整

### 步骤 4: 填充 Issue 表单

如果用户要求创建 Issue，执行以下操作：

1. **导航到创建 Issue 页面**（如果需要）
   ```javascript
   {
     action: 'navigate',
     params: {
       url: '{current_domain}/issues/new'
     }
   }
   ```

2. **等待页面加载**
   ```javascript
   {
     action: 'wait',
     params: {
       duration: 2000
     }
   }
   ```

3. **填写标题**
   ```javascript
   {
     action: 'fill',
     target: {
       selector: 'input[name="issue[title]"]'
       // 或者根据实际页面结构调整选择器
     },
     params: {
       value: '{生成的标题}'
     }
   }
   ```

4. **填写描述**
   ```javascript
   {
     action: 'fill',
     target: {
       selector: 'textarea[name="issue[body]"]'
       // 或者根据实际页面结构调整选择器
     },
     params: {
       value: '{生成的描述}'
     }
   }
   ```

5. **提交 Issue**
   ```javascript
   {
     action: 'click',
     target: {
       selector: 'button[type="submit"]'
       // 或者根据实际页面结构调整选择器
     }
   }
   ```

## 模板结构

所有 Issue 模板存储在 `references/issue-templates.md` 文件中，每个模板包含：

- **标题模板**: Issue 标题的标准格式
- **描述模板**: Issue 描述的详细结构，包括：
  - 背景说明
  - 目标/范围
  - 预期结果
  - 验收标准（如适用）

## 使用示例

### 示例 1: 用户提到重构

**用户输入**: "我想创建一个关于重构用户服务模块的 issue"

**处理流程**:
1. 检测到 "创建...issue" 和 "重构" 关键词
2. 选择重构模板
3. 生成标题: "重构: 用户服务模块代码优化"
4. 生成描述: 使用重构模板，填充用户服务模块相关信息

### 示例 2: 用户提到安全问题

**用户输入**: "需要生成一个安全整改的 issue，关于 SQL 注入漏洞修复"

**处理流程**:
1. 检测到 "生成...issue" 和 "安全整改" 关键词
2. 选择安全问题整改模板
3. 生成标题: "安全整改: SQL 注入漏洞修复"
4. 生成描述: 使用安全问题整改模板，填充 SQL 注入相关信息

## 注意事项

1. **域名检测**: 必须确保当前页面包含 "codehub" 才使用本 skill
2. **模板匹配**: 如果用户输入中包含多个模板关键词，优先选择更具体的关键词对应的模板
3. **内容定制**: 模板是基础框架，应根据用户的具体需求进行适当调整和填充
4. **DOM 选择器**: CodeHub 的实际 DOM 结构可能与 GitHub 不同，需要根据实际页面调整选择器
5. **权限检查**: 创建 Issue 需要相应权限，操作前应确认用户权限

## 扩展信息

- [references/issue-templates.md](references/issue-templates.md) - 完整的 Issue 模板参考

## 最佳实践

1. **关键词识别**: 使用模糊匹配识别用户意图，提高容错性
2. **模板填充**: 尽量从用户输入中提取具体信息填充到模板中
3. **内容预览**: 在创建 Issue 前，可以向用户展示生成的标题和描述，确认无误后再创建
4. **错误处理**: 如果无法识别模板类型，可以询问用户或使用通用模板
