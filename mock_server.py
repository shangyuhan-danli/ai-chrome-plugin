"""
AI Chat Extension - Mock Server
用于测试浏览器工具的模拟后端服务器
"""

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import json
import time
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# 模拟 Agent 数据
MOCK_AGENTS = [
    {
        "id": "browser-assistant",
        "name": "浏览器助手",
        "description": "帮助你在网页上执行各种操作，如点击、输入、滚动等",
        "tags": ["browser", "automation", "web"],
        "avatar": None
    },
    {
        "id": "form-filler",
        "name": "表单填写助手",
        "description": "专门帮助填写网页表单，支持自动识别和填写各种输入字段",
        "tags": ["form", "input", "automation"],
        "avatar": None
    },
    {
        "id": "web-navigator",
        "name": "网页导航助手",
        "description": "帮助你在网页间导航，滚动页面，查找内容",
        "tags": ["navigation", "scroll", "search"],
        "avatar": None
    },
    {
        "id": "data-extractor",
        "name": "数据提取助手",
        "description": "帮助从网页中提取和收集数据",
        "tags": ["extraction", "data", "scraping"],
        "avatar": None
    }
]

# 模拟会话存储
sessions = {}

# 浏览器工具定义
BROWSER_TOOLS = [
    {
        "name": "browser_click",
        "description": "在网页上点击指定元素",
        "parameters": {
            "type": "object",
            "properties": {
                "index": {
                    "type": "integer",
                    "description": "要点击的元素索引"
                },
                "selector": {
                    "type": "string",
                    "description": "CSS 选择器（可选）"
                },
                "description": {
                    "type": "string",
                    "description": "元素的描述"
                }
            },
            "required": ["index"]
        }
    },
    {
        "name": "browser_input",
        "description": "在网页输入框中输入文本",
        "parameters": {
            "type": "object",
            "properties": {
                "index": {
                    "type": "integer",
                    "description": "输入框元素的索引"
                },
                "content": {
                    "type": "string",
                    "description": "要输入的内容"
                },
                "selector": {
                    "type": "string",
                    "description": "CSS 选择器（可选）"
                },
                "description": {
                    "type": "string",
                    "description": "输入框的描述"
                }
            },
            "required": ["index", "content"]
        }
    },
    {
        "name": "browser_scroll",
        "description": "滚动网页",
        "parameters": {
            "type": "object",
            "properties": {
                "direction": {
                    "type": "string",
                    "enum": ["up", "down", "left", "right"],
                    "description": "滚动方向"
                },
                "amount": {
                    "type": "integer",
                    "description": "滚动像素数"
                }
            },
            "required": ["direction"]
        }
    },
    {
        "name": "browser_get_text",
        "description": "获取网页上指定元素的文本内容",
        "parameters": {
            "type": "object",
            "properties": {
                "index": {
                    "type": "integer",
                    "description": "元素索引"
                },
                "selector": {
                    "type": "string",
                    "description": "CSS 选择器"
                }
            },
            "required": ["index"]
        }
    },
    {
        "name": "browser_go_back",
        "description": "返回上一页",
        "parameters": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "browser_refresh",
        "description": "刷新当前页面",
        "parameters": {
            "type": "object",
            "properties": {}
        }
    }
]


@app.route('/health', methods=['GET'])
def health_check():
    """健康检查端点"""
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()})


@app.route('/api/v1/agent/list', methods=['GET'])
def get_agents():
    """
    获取 Agent 列表
    支持查询参数: user_id, url, title (或 userId, pageUrl, pageTitle)
    """
    user_id = request.args.get('user_id') or request.args.get('userId', 'default_user')
    page_url = request.args.get('url') or request.args.get('pageUrl', '')
    page_title = request.args.get('title') or request.args.get('pageTitle', '')
    
    # 简单的意图识别逻辑：根据页面内容推荐 Agent
    recommended = None
    if page_url or page_title:
        # 如果页面包含表单相关内容，推荐表单助手
        if any(keyword in page_title.lower() or keyword in page_url.lower() 
               for keyword in ['form', 'login', 'signup', 'register', 'input']):
            recommended = 'form-filler'
        # 如果页面需要导航，推荐导航助手
        elif any(keyword in page_title.lower() 
                for keyword in ['search', 'list', 'catalog', 'browse']):
            recommended = 'web-navigator'
        else:
            # 默认推荐浏览器助手
            recommended = 'browser-assistant'
    
    return jsonify({
        "success": True,
        "data": {
            "agents": MOCK_AGENTS,
            "recommended": recommended,
            "total": len(MOCK_AGENTS)
        }
    })


@app.route('/api/v1/agent/chat', methods=['POST'])
def chat():
    """
    处理聊天请求
    支持流式响应 (SSE)
    """
    data = request.json
    agent_id = data.get('agentId', '')
    session_id = data.get('sessionId', str(uuid.uuid4()))
    message = data.get('message', '')
    user_id = data.get('userId', 'default_user')
    role = data.get('role', 'user')
    current_page_info = data.get('currentPageInfo', {})
    
    # 存储会话
    if session_id not in sessions:
        sessions[session_id] = {
            "id": session_id,
            "messages": [],
            "createdAt": datetime.now().isoformat()
        }
    
    # 添加用户消息
    sessions[session_id]["messages"].append({
        "role": role,
        "content": message,
        "timestamp": datetime.now().isoformat()
    })
    
    # 检查是否是流式请求
    if request.headers.get('Accept') == 'text/event-stream':
        return Response(
            stream_chat_response(agent_id, message, current_page_info),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'X-Accel-Buffering': 'no'
            }
        )
    else:
        # 非流式响应
        response_data = generate_chat_response(agent_id, message, current_page_info)
        return jsonify({
            "success": True,
            "data": response_data
        })


def stream_chat_response(agent_id, message, page_info):
    """
    生成流式聊天响应 (SSE 格式)
    """
    # 模拟思考过程
    think_content = f"用户正在询问关于: {message}\n当前页面: {page_info.get('title', '未知')}\n\n让我分析一下应该使用什么工具..."
    
    # 发送思考过程
    yield f"data: {json.dumps({'type': 'think', 'content': think_content})}\n\n"
    time.sleep(0.5)
    
    # 根据消息内容决定如何响应
    message_lower = message.lower()
    
    # 检测工具调用意图
    if any(keyword in message_lower for keyword in ['点击', 'click', '按下', 'button']):
        # 模拟点击工具调用
        tool_call = {
            "type": "tool_call",
            "tool_call": {
                "tool_name": "browser_click",
                "arguments": json.dumps({
                    "index": 1,
                    "description": "用户请求点击的按钮"
                })
            }
        }
        yield f"data: {json.dumps(tool_call)}\n\n"
        time.sleep(0.3)
        
        # 发送说明文本
        text_parts = [
            "我将帮您点击指定的元素。",
            "请确认是否执行此操作？"
        ]
        for part in text_parts:
            yield f"data: {json.dumps({'type': 'content', 'content': part})}\n\n"
            time.sleep(0.2)
    
    elif any(keyword in message_lower for keyword in ['输入', '填写', 'input', 'type', 'fill']):
        # 模拟输入工具调用
        tool_call = {
            "type": "tool_call",
            "tool_call": {
                "tool_name": "browser_input",
                "arguments": json.dumps({
                    "index": 2,
                    "content": "测试输入内容",
                    "description": "输入框"
                })
            }
        }
        yield f"data: {json.dumps(tool_call)}\n\n"
        time.sleep(0.3)
        
        text_parts = ["我将帮您在输入框中填写内容。", "请确认是否执行？"]
        for part in text_parts:
            yield f"data: {json.dumps({'type': 'content', 'content': part})}\n\n"
            time.sleep(0.2)
    
    elif any(keyword in message_lower for keyword in ['滚动', 'scroll', '下滑', '上滑']):
        # 模拟滚动工具调用
        direction = "down" if any(kw in message_lower for kw in ['下', 'down']) else "up"
        tool_call = {
            "type": "tool_call",
            "tool_call": {
                "tool_name": "browser_scroll",
                "arguments": json.dumps({
                    "direction": direction,
                    "amount": 500
                })
            }
        }
        yield f"data: {json.dumps(tool_call)}\n\n"
        time.sleep(0.3)
        
        text_parts = [f"我将帮您向{direction}滚动页面。", "请确认是否执行？"]
        for part in text_parts:
            yield f"data: {json.dumps({'type': 'content', 'content': part})}\n\n"
            time.sleep(0.2)
    
    elif any(keyword in message_lower for keyword in ['获取', '提取', 'text', '内容', 'read']):
        # 模拟获取文本工具调用
        tool_call = {
            "type": "tool_call",
            "tool_call": {
                "tool_name": "browser_get_text",
                "arguments": json.dumps({
                    "index": 0,
                    "description": "要获取文本的元素"
                })
            }
        }
        yield f"data: {json.dumps(tool_call)}\n\n"
        time.sleep(0.3)
        
        text_parts = ["我将帮您获取指定元素的文本内容。", "请确认是否执行？"]
        for part in text_parts:
            yield f"data: {json.dumps({'type': 'content', 'content': part})}\n\n"
            time.sleep(0.2)
    
    elif any(keyword in message_lower for keyword in ['返回', 'back', '后退', '上一页']):
        # 模拟返回工具调用
        tool_call = {
            "type": "tool_call",
            "tool_call": {
                "tool_name": "browser_go_back",
                "arguments": json.dumps({})
            }
        }
        yield f"data: {json.dumps(tool_call)}\n\n"
        time.sleep(0.3)
        
        text_parts = ["我将帮您返回上一页。", "请确认是否执行？"]
        for part in text_parts:
            yield f"data: {json.dumps({'type': 'content', 'content': part})}\n\n"
            time.sleep(0.2)
    
    elif any(keyword in message_lower for keyword in ['刷新', 'refresh', 'reload', '重新加载']):
        # 模拟刷新工具调用
        tool_call = {
            "type": "tool_call",
            "tool_call": {
                "tool_name": "browser_refresh",
                "arguments": json.dumps({})
            }
        }
        yield f"data: {json.dumps(tool_call)}\n\n"
        time.sleep(0.3)
        
        text_parts = ["我将帮您刷新当前页面。", "请确认是否执行？"]
        for part in text_parts:
            yield f"data: {json.dumps({'type': 'content', 'content': part})}\n\n"
            time.sleep(0.2)
    
    else:
        # 普通对话响应
        responses = [
            "我可以帮您执行各种浏览器操作。",
            "试试对我说：",
            "• \"点击第一个按钮\" - 测试 browser_click",
            "• \"在搜索框输入内容\" - 测试 browser_input",
            "• \"向下滚动页面\" - 测试 browser_scroll",
            "• \"获取这个元素的文本\" - 测试 browser_get_text",
            "• \"返回上一页\" - 测试 browser_go_back",
            "• \"刷新页面\" - 测试 browser_refresh"
        ]
        
        for part in responses:
            newline = '\n'
            yield f"data: {json.dumps({'type': 'content', 'content': part + newline})}\n\n"
            time.sleep(0.1)
    
    # 发送完成标记
    yield f"data: {json.dumps({'type': 'done'})}\n\n"


def generate_chat_response(agent_id, message, page_info):
    """
    生成非流式聊天响应
    """
    return {
        "response": f"收到消息: {message}。这是一个测试响应。",
        "blocks": [{"type": "text", "text": f"收到消息: {message}"}],
        "isComplete": True,
        "timestamp": datetime.now().isoformat()
    }


@app.route('/api/v1/agent/chat/stream', methods=['POST'])
def chat_stream():
    """
    专门的流式聊天端点
    """
    data = request.json
    agent_id = data.get('agentId', '')
    message = data.get('message', '')
    page_info = data.get('currentPageInfo', {})
    
    def generate():
        yield from stream_chat_response(agent_id, message, page_info)
    
    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no'
        }
    )


@app.route('/api/v1/sessions/<session_id>', methods=['GET'])
def get_session(session_id):
    """获取会话信息"""
    if session_id in sessions:
        return jsonify({
            "success": True,
            "data": sessions[session_id]
        })
    return jsonify({
        "success": False,
        "error": "Session not found"
    }), 404


@app.route('/api/v1/tools/definitions', methods=['GET'])
def get_tool_definitions():
    """获取浏览器工具定义"""
    return jsonify({
        "success": True,
        "data": {
            "tools": BROWSER_TOOLS
        }
    })


if __name__ == '__main__':
    print("=" * 60)
    print("AI Chat Extension Mock Server")
    print("=" * 60)
    print("\n可用端点:")
    print("  GET  /health           - 健康检查")
    print("  GET  /api/v1/agent/list  - 获取 Agent 列表")
    print("  POST /api/v1/agent/chat  - 聊天接口 (支持 SSE)")
    print("  POST /api/v1/agent/chat/stream - 流式聊天接口")
    print("  GET  /api/v1/tools/definitions - 工具定义")
    print("\n测试命令:")
    print("  curl http://localhost:5001/api/v1/agent/list")
    print("  curl -X POST http://localhost:5001/api/v1/agent/chat \\")
    print("    -H 'Content-Type: application/json' \\")
    print("    -d '{\"message\": \"点击按钮\", \"agent_id\": \"browser-assistant\"}'")
    print("\n服务器启动在: http://localhost:5001")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=5001, debug=True)
