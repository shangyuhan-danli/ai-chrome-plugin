# 浏览器工具后端集成指南

## 一、概述

浏览器插件会在每次聊天请求中动态传递其支持的工具定义（`browser_tools`），后端需要将这些工具注入到 Agent 的系统提示词中，使 AI 能够在合适的时机调用这些工具来操作网页。

## 二、工具执行流程

### 2.1 核心流程说明

**所有工具都需要用户点击 Approve 后才会执行**，区别在于执行位置：

```
┌─────────────────────────────────────────────────────────────┐
│                    后端返回 tool_call                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              前端显示工具调用，等待用户确认                    │
│                  [Approve]  [Reject]                        │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│    浏览器工具 (DOM)      │     │    非浏览器工具          │
│                         │     │                         │
│  1. 浏览器本地执行       │     │  1. 发送 role: function │
│  2. 发送 role: user     │     │  2. 后端执行工具         │
│     (包含执行结果)       │     │  3. 返回执行结果         │
└─────────────────────────┘     └─────────────────────────┘
```

### 2.2 两种工具类型对比

| 特性 | 浏览器工具 (DOM) | 非浏览器工具 |
|-----|-----------------|-------------|
| 执行位置 | 浏览器插件本地执行 | 后端服务执行 |
| 用户确认 | 需要点击 Approve | 需要点击 Approve |
| 结果发送 | `role: "user"` | `role: "function"` |
| 示例 | page_action, request_more_elements | search_web, query_database |

## 三、请求格式

### 3.1 Chat API 请求结构

```python
# POST /api/v1/agent/chat
{
    "message": "帮我在搜索框输入 iPhone 16 然后点击搜索",
    "role": "user",  # "user" 或 "function"
    "model": "claude-3-opus",
    "agent_id": "agent_xxx",
    "session_id": "uuid-xxx",
    "user_id": "user_xxx",
    "current_page_info": {
        "url": "https://www.taobao.com",
        "title": "淘宝网 - 首页",
        "elements": [
            {"id": "e_1706789012_abc123", "desc": "输入框:搜索(placeholder:搜索)"},
            {"id": "e_1706789012_def456", "desc": "按钮:搜索"},
            {"id": "e_1706789012_ghi789", "desc": "链接:登录"}
        ],
        "selectedText": ""  # 用户选中的文字（可选）
    },
    "browser_tools": [
        # 工具定义列表，见下文
    ]
}
```

### 3.2 browser_tools 完整结构

```python
browser_tools = [
    {
        "name": "page_action",
        "description": "在用户当前浏览的网页上执行操作，如填充输入框、点击按钮、高亮文字等。可以批量执行多个操作。",
        "parameters": {
            "type": "object",
            "properties": {
                "actions": {
                    "type": "array",
                    "description": "要执行的操作列表",
                    "items": {
                        "type": "object",
                        "properties": {
                            "action": {
                                "type": "string",
                                "enum": ["fill", "click", "highlight", "underline", "select", "check", "scroll", "read"],
                                "description": "操作类型: fill(填充输入框), click(点击), highlight(高亮), underline(下划线), select(选择下拉), check(勾选), scroll(滚动), read(读取内容)"
                            },
                            "target": {
                                "type": "object",
                                "description": "目标元素",
                                "properties": {
                                    "elementId": {"type": "string", "description": "元素ID (从页面上下文获取)"},
                                    "selector": {"type": "string", "description": "CSS选择器 (备用)"},
                                    "description": {"type": "string", "description": "元素描述 (用于确认)"}
                                }
                            },
                            "params": {
                                "type": "object",
                                "description": "操作参数",
                                "properties": {
                                    "value": {"type": "string", "description": "填充的值或选择的选项"},
                                    "color": {"type": "string", "description": "高亮颜色 (如 #ffeb3b)"},
                                    "direction": {"type": "string", "enum": ["up", "down", "top", "bottom"], "description": "滚动方向"}
                                }
                            }
                        },
                        "required": ["action", "target"]
                    }
                }
            },
            "required": ["actions"]
        }
    },
    {
        "name": "request_more_elements",
        "description": "当前页面元素信息不足以完成用户请求时，请求特定区域或类型的更多元素。",
        "parameters": {
            "type": "object",
            "properties": {
                "region": {
                    "type": "string",
                    "enum": ["form", "header", "sidebar", "footer", "below_viewport"],
                    "description": "页面区域: form(表单区域), header(页头), sidebar(侧边栏), footer(页脚), below_viewport(视口下方)"
                },
                "elementType": {
                    "type": "string",
                    "enum": ["input", "button", "link", "select", "all"],
                    "description": "元素类型: input(输入框), button(按钮), link(链接), select(下拉框), all(所有)"
                },
                "keyword": {
                    "type": "string",
                    "description": "关键词筛选，匹配元素的文本、placeholder、label等"
                }
            }
        }
    },
    {
        "name": "get_selected_text",
        "description": "获取用户在页面上选中的文字，用于对选中内容进行操作。",
        "parameters": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "clear_ai_styles",
        "description": "清除 AI 在页面上添加的所有高亮和下划线样式，恢复页面原始状态。",
        "parameters": {
            "type": "object",
            "properties": {}
        }
    }
]
```

## 四、后端处理逻辑

### 4.1 工具注入到系统提示词

由于 Agent 框架采用 JSON 格式输出工具调用，提示词需要明确规定输出格式，确保 AI 能正确输出工具名称和参数。

```python
import json
from typing import List, Dict, Any, Optional


def generate_tools_prompt(browser_tools: List[Dict[str, Any]]) -> str:
    """
    根据浏览器工具定义生成提示词片段

    生成的提示词会明确规定：
    1. 可用的工具列表及其参数 Schema
    2. 严格的 JSON 输出格式
    3. 具体的调用示例
    """
    if not browser_tools:
        return ""

    prompt = """

## 浏览器操作工具

你可以使用以下工具来操作用户当前浏览的网页。当用户请求涉及网页操作时（如填写表单、点击按钮、高亮文字等），请使用这些工具。

### 可用工具列表

"""

    for tool in browser_tools:
        prompt += f"#### 工具名称: `{tool['name']}`\n\n"
        prompt += f"**功能描述**: {tool['description']}\n\n"
        prompt += f"**参数 Schema (JSON Schema 格式)**:\n```json\n{json.dumps(tool['parameters'], ensure_ascii=False, indent=2)}\n```\n\n"

    prompt += """
---

### 工具调用规范

当你需要调用工具时，**必须严格按照以下 JSON 格式输出**：

```json
{
    "tool_call": {
        "tool_name": "<工具名称，必须是上述列表中的一个>",
        "arguments": "<参数对象的 JSON 字符串>"
    }
}
```

**重要说明**：
1. `tool_name` 必须**完全匹配**上述工具列表中的名称，区分大小写
2. `arguments` 必须是**字符串类型**，内容为参数对象的 JSON 序列化结果
3. 参数必须**严格遵循**对应工具的参数 Schema

---

### 调用示例

#### 示例 1: 填充输入框并点击按钮

用户请求: "帮我在搜索框输入 iPhone 16 然后点击搜索"

正确的工具调用输出:
```json
{
    "tool_call": {
        "tool_name": "page_action",
        "arguments": "{\\"actions\\":[{\\"action\\":\\"fill\\",\\"target\\":{\\"elementId\\":\\"e_xxx\\"},\\"params\\":{\\"value\\":\\"iPhone 16\\"}},{\\"action\\":\\"click\\",\\"target\\":{\\"elementId\\":\\"e_yyy\\"}}]}"
    }
}
```

等价的 arguments 解析后:
```json
{
    "actions": [
        {
            "action": "fill",
            "target": {"elementId": "e_xxx"},
            "params": {"value": "iPhone 16"}
        },
        {
            "action": "click",
            "target": {"elementId": "e_yyy"}
        }
    ]
}
```

#### 示例 2: 请求更多页面元素

当页面元素信息不足时:
```json
{
    "tool_call": {
        "tool_name": "request_more_elements",
        "arguments": "{\\"region\\":\\"form\\",\\"elementType\\":\\"button\\"}"
    }
}
```

#### 示例 3: 高亮选中文字

```json
{
    "tool_call": {
        "tool_name": "page_action",
        "arguments": "{\\"actions\\":[{\\"action\\":\\"highlight\\",\\"target\\":{},\\"params\\":{\\"color\\":\\"#ffeb3b\\"}}]}"
    }
}
```

---

### 使用说明

1. **优先使用 elementId**: 从 `current_page_info.elements` 中获取元素 ID，这是最可靠的定位方式
2. **批量操作**: 可以在一次 `page_action` 调用中执行多个操作，按顺序执行
3. **信息不足时**: 如果页面元素信息不足以完成任务，使用 `request_more_elements` 请求更多元素
4. **操作确认**: 在执行敏感操作前，先向用户确认
5. **错误处理**: 如果找不到目标元素，告知用户并尝试使用 `request_more_elements` 获取更多信息

"""

    return prompt


def generate_page_context_prompt(page_info: Optional[Dict[str, Any]]) -> str:
    """
    根据页面上下文生成提示词片段
    """
    if not page_info:
        return ""

    prompt = f"""
---

## 当前页面信息

- **URL**: {page_info.get('url', '未知')}
- **标题**: {page_info.get('title', '未知')}

### 可交互元素列表

以下是当前页面的可交互元素，使用 `elementId` 来定位元素：

"""

    elements = page_info.get('elements', [])
    if elements:
        prompt += "| elementId | 元素描述 |\n"
        prompt += "|-----------|----------|\n"
        for el in elements:
            prompt += f"| `{el['id']}` | {el['desc']} |\n"
    else:
        prompt += "（暂无可交互元素信息，可使用 `request_more_elements` 工具获取）\n"

    selected_text = page_info.get('selectedText')
    if selected_text:
        prompt += f"\n### 用户选中的文字\n\n```\n{selected_text}\n```\n"

    return prompt


def inject_browser_context(
    system_prompt: str,
    page_info: Optional[Dict[str, Any]] = None,
    browser_tools: Optional[List[Dict[str, Any]]] = None
) -> str:
    """
    将浏览器上下文注入到系统提示词中

    Args:
        system_prompt: 原始系统提示词
        page_info: 页面上下文信息 (current_page_info)
        browser_tools: 浏览器工具定义列表

    Returns:
        注入后的系统提示词
    """
    # 注入工具定义
    tools_prompt = generate_tools_prompt(browser_tools)

    # 注入页面上下文
    page_prompt = generate_page_context_prompt(page_info)

    return system_prompt + tools_prompt + page_prompt


# ============ 工具定义转换为 OpenAI Function Calling 格式 ============

def convert_to_openai_tools(browser_tools: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    将浏览器工具定义转换为 OpenAI Function Calling 格式

    如果你的 Agent 框架使用 OpenAI 的 tools 参数，可以用这个函数转换
    """
    if not browser_tools:
        return []

    openai_tools = []
    for tool in browser_tools:
        openai_tools.append({
            "type": "function",
            "function": {
                "name": tool["name"],
                "description": tool["description"],
                "parameters": tool["parameters"]
            }
        })

    return openai_tools


def convert_to_anthropic_tools(browser_tools: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    将浏览器工具定义转换为 Anthropic Claude 的 tools 格式
    """
    if not browser_tools:
        return []

    anthropic_tools = []
    for tool in browser_tools:
        anthropic_tools.append({
            "name": tool["name"],
            "description": tool["description"],
            "input_schema": tool["parameters"]
        })

    return anthropic_tools
```

### 4.2 处理工具调用响应

当 AI 返回工具调用时，需要以特定格式返回给前端：

```python
from dataclasses import dataclass
from typing import Optional
import json


@dataclass
class ToolCall:
    tool_name: str
    arguments: str  # JSON 字符串


def format_tool_call_response(tool_name: str, arguments: dict) -> dict:
    """
    格式化工具调用响应
    """
    return {
        "tool_call": {
            "tool_name": tool_name,
            "arguments": json.dumps(arguments, ensure_ascii=False)
        }
    }


# 示例：AI 决定执行页面操作
def handle_ai_response(ai_output: str) -> dict:
    """
    处理 AI 输出，提取工具调用
    """
    # 解析 AI 输出中的工具调用
    # 这里的实现取决于你使用的 AI 模型和输出格式

    # 假设 AI 输出了工具调用
    tool_call = {
        "tool_name": "page_action",
        "arguments": {
            "actions": [
                {
                    "action": "fill",
                    "target": {"elementId": "e_1706789012_abc123"},
                    "params": {"value": "iPhone 16"}
                },
                {
                    "action": "click",
                    "target": {"elementId": "e_1706789012_def456"}
                }
            ]
        }
    }

    return format_tool_call_response(
        tool_call["tool_name"],
        tool_call["arguments"]
    )
```

### 4.3 处理工具执行结果

根据工具类型，前端会以不同的 role 发送结果：

#### 4.3.1 浏览器工具结果 (role: "user")

浏览器工具由插件本地执行，执行完后以 `role: "user"` 发送结果：

```python
# 前端发送的请求
{
    "message": "浏览器工具 page_action 执行结果: {\"success\": true, \"results\": [...], \"summary\": \"执行了 2 个操作，成功 2 个\"}",
    "role": "user",  # 注意：浏览器工具用 user
    "agent_id": "agent_xxx",
    "session_id": "uuid-xxx",
    ...
}
```

后端处理：
```python
def handle_browser_tool_result(request: ChatRequest) -> str:
    """
    处理浏览器工具执行结果（role: user）

    浏览器工具的结果作为普通用户消息处理，
    AI 会根据结果继续对话
    """
    # message 格式: "浏览器工具 {tool_name} 执行结果: {json_result}"
    message = request.message

    # 直接作为用户消息添加到对话历史
    # AI 会看到这个结果并继续响应
    return message
```

#### 4.3.2 非浏览器工具结果 (role: "function")

非浏览器工具由后端执行，前端只发送确认信息：

```python
# 前端发送的请求
{
    "message": "{\"toolId\": \"tool_xxx\", \"approved\": true}",
    "role": "function",  # 注意：非浏览器工具用 function
    "agent_id": "agent_xxx",
    "session_id": "uuid-xxx",
    ...
}
```

后端处理：
```python
def handle_non_browser_tool_approved(request: ChatRequest):
    """
    处理非浏览器工具确认（role: function）

    后端需要自己执行工具，然后返回结果
    """
    data = json.loads(request.message)
    tool_id = data.get("toolId")
    approved = data.get("approved")

    if not approved:
        # 用户拒绝，返回拒绝消息
        return {"content": "用户取消了工具执行"}

    # 从会话上下文中获取待执行的工具调用
    pending_tool = get_pending_tool_call(request.session_id, tool_id)

    # 执行工具
    result = execute_tool(pending_tool.tool_name, pending_tool.arguments)

    # 将结果添加到对话上下文，继续 AI 响应
    return continue_conversation_with_tool_result(request.session_id, result)
```

## 五、完整示例

### 5.1 FastAPI 路由示例

```python
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import asyncio

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    role: str = "user"
    model: str = "claude-3-opus"
    agent_id: str
    session_id: str
    user_id: str
    current_page_info: Optional[Dict[str, Any]] = None
    browser_tools: Optional[List[Dict[str, Any]]] = None


@router.post("/api/v1/agent/chat")
async def chat(request: ChatRequest):
    """
    流式聊天接口
    """
    async def generate():
        # 1. 获取 Agent 的基础系统提示词
        base_system_prompt = await get_agent_system_prompt(request.agent_id)

        # 2. 注入浏览器上下文
        system_prompt = inject_browser_context(
            base_system_prompt,
            page_info=request.current_page_info,
            browser_tools=request.browser_tools
        )

        # 3. 调用 AI 模型
        async for chunk in call_ai_model(
            system_prompt=system_prompt,
            message=request.message,
            role=request.role,
            model=request.model,
            session_id=request.session_id
        ):
            # 4. 返回 SSE 格式的响应
            yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"

        # 5. 发送完成消息
        yield f"data: {json.dumps({'message': '对话完成'})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )


async def get_agent_system_prompt(agent_id: str) -> str:
    """
    获取 Agent 的基础系统提示词
    """
    # 从数据库或配置中获取
    return "你是一个智能助手，可以帮助用户完成各种任务。"


async def call_ai_model(
    system_prompt: str,
    message: str,
    role: str,
    model: str,
    session_id: str
):
    """
    调用 AI 模型（示例）
    """
    # 这里实现具体的 AI 调用逻辑
    # 返回流式响应

    # 示例：返回文本内容
    yield {"content": "好的，我来帮你"}
    await asyncio.sleep(0.1)
    yield {"content": "操作网页。"}

    # 示例：返回工具调用
    yield {
        "tool_call": {
            "tool_name": "page_action",
            "arguments": json.dumps({
                "actions": [
                    {
                        "action": "fill",
                        "target": {"elementId": "e_xxx"},
                        "params": {"value": "iPhone 16"}
                    }
                ]
            }, ensure_ascii=False)
        }
    }
```

## 六、注意事项

1. **兼容性处理**: 如果 `browser_tools` 为空或不存在，不要注入工具相关的提示词
2. **Token 优化**: 页面元素列表可能很长，前端已经做了智能筛选（最多 30 个），但仍需注意 Token 消耗
3. **安全考虑**:
   - 不要在日志中记录敏感的页面信息
   - 对于密码框等敏感元素，前端不会传递 value 值
4. **错误处理**: 工具执行可能失败，需要优雅处理并告知用户

## 七、工具执行结果格式

前端执行工具后返回的结果格式：

```python
# 成功
{
    "success": True,
    "results": [
        {"success": True, "message": "已填充: iPhone 16"},
        {"success": True, "message": "已点击: 搜索按钮"}
    ],
    "summary": "执行了 2 个操作，成功 2 个，失败 0 个"
}

# 失败
{
    "success": False,
    "error": "未找到目标元素"
}

# request_more_elements 结果
{
    "success": True,
    "elements": [
        {"id": "e_xxx", "desc": "按钮:提交"},
        {"id": "e_yyy", "desc": "按钮:取消"}
    ]
}
```
