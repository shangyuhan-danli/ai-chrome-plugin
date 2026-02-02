# AI Chat Extension - Mock Server

用于测试 AI Chat Extension 浏览器工具的模拟后端服务器。

## 快速开始

### 方法一：Python (推荐，简单快速)

**1. 安装依赖**
```bash
cd /Users/lidan/Desktop/github-codes/ai-chrome-plugin
pip install flask flask-cors
```

**2. 启动服务器**
```bash
python mock_server.py
```

### 方法二：TypeScript/Node.js

**1. 安装依赖**
```bash
cd /Users/lidan/Desktop/github-codes/ai-chrome-plugin/mock-server
npm install
```

**2. 启动服务器**
```bash
# 开发模式
npm run dev

# 或构建后运行
npm run build
npm start
```

## 可用端点

### 1. 健康检查
```bash
GET http://localhost:5000/health
```

### 2. 获取 Agent 列表
```bash
GET http://localhost:5000/api/v1/agent/list?userId=default_user&pageUrl=<url>&pageTitle=<title>
```

**返回示例:**
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "browser-assistant",
        "name": "浏览器助手",
        "description": "帮助你在网页上执行各种操作...",
        "tags": ["browser", "automation", "web"]
      }
    ],
    "recommended": "browser-assistant",
    "total": 4
  }
}
```

### 3. 聊天接口 (SSE 流式)
```bash
POST http://localhost:5000/api/v1/agent/chat
Content-Type: application/json
Accept: text/event-stream
```

**请求体:**
```json
{
  "agentId": "browser-assistant",
  "sessionId": "12345",
  "message": "点击按钮",
  "userId": "default_user",
  "role": "user",
  "currentPageInfo": {
    "url": "https://example.com",
    "title": "Example Page",
    "elements": []
  }
}
```

**响应:**
支持 Server-Sent Events (SSE) 流式响应

### 4. 获取工具定义
```bash
GET http://localhost:5000/api/v1/tools/definitions
```

## 支持的浏览器工具

服务器会自动根据用户消息触发相应的工具：

1. **browser_click** - 点击元素
   - 触发关键词: "点击", "click", "按下", "button"

2. **browser_input** - 输入文本
   - 触发关键词: "输入", "填写", "input", "type", "fill"

3. **browser_scroll** - 滚动页面
   - 触发关键词: "滚动", "scroll", "下滑", "上滑"

4. **browser_get_text** - 获取文本
   - 触发关键词: "获取", "提取", "text", "内容", "read"

5. **browser_go_back** - 返回上一页
   - 触发关键词: "返回", "back", "后退", "上一页"

6. **browser_refresh** - 刷新页面
   - 触发关键词: "刷新", "refresh", "reload", "重新加载"

## 测试命令

### 测试 Agent 列表
```bash
curl http://localhost:5000/api/v1/agent/list
```

### 测试聊天 (普通模式)
```bash
curl -X POST http://localhost:5000/api/v1/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "你好", "agentId": "browser-assistant"}'
```

### 测试聊天 (流式模式)
```bash
curl -X POST http://localhost:5000/api/v1/agent/chat \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"message": "点击按钮", "agentId": "browser-assistant"}'
```

### 测试浏览器点击工具
```bash
curl -X POST http://localhost:5000/api/v1/agent/chat \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"message": "帮我点击第一个按钮", "agentId": "browser-assistant"}'
```

### 测试浏览器输入工具
```bash
curl -X POST http://localhost:5000/api/v1/agent/chat \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"message": "在搜索框输入测试内容", "agentId": "browser-assistant"}'
```

### 测试浏览器滚动工具
```bash
curl -X POST http://localhost:5000/api/v1/agent/chat \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"message": "向下滚动页面", "agentId": "browser-assistant"}'
```

### 测试工具定义
```bash
curl http://localhost:5000/api/v1/tools/definitions
```

## 配置 Chrome 扩展

1. 打开扩展的 **设置页面**
2. 在 **API 配置** 中设置:
   - **API 端点**: `http://localhost:5000/api/v1/agent/chat`
   - **模型**: 可以选择任意模型（服务器会忽略此设置）
3. 保存设置
4. 打开聊天窗口测试浏览器工具

## 日志调试

服务器会在控制台输出所有请求和响应信息，方便调试。

## 停止服务器

- Python: `Ctrl+C`
- Node.js: `Ctrl+C`
