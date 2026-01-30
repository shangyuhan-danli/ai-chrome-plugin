// Background Service Worker
import { chatDB } from '../utils/db'
import { apiService } from '../utils/api'
import type { ChatStreamRequest, StreamCallbackData } from '../utils/api'
import type { ChromeMessage, ContentBlock, ToolUseBlock } from '../utils/types'

// 生成 UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// 初始化数据库和 API 配置
chatDB.init().catch(console.error)

// 从存储中加载 API 配置
async function loadApiConfig() {
  const apiEndpoint = await chatDB.getSetting('apiEndpoint')
  const apiKey = await chatDB.getSetting('apiKey')
  if (apiEndpoint) {
    apiService.setBaseUrl(apiEndpoint)
  }
  if (apiKey) {
    apiService.setToken(apiKey)
  }
}
loadApiConfig().catch(console.error)

// 监听来自content script和popup的消息
chrome.runtime.onMessage.addListener((message: ChromeMessage, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse)
  return true // 保持消息通道开启
})

// 存储会话的 session_id 映射 (本地sessionId -> UUID)
const sessionIdMap = new Map<number, string>()

// 获取或创建 session UUID
function getSessionUUID(localSessionId: number): string {
  if (!sessionIdMap.has(localSessionId)) {
    sessionIdMap.set(localSessionId, generateUUID())
  }
  return sessionIdMap.get(localSessionId)!
}

// 监听流式会话的长连接
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'chat-stream') {
    port.onMessage.addListener(async (request) => {
      const { agentId, sessionId, message, model, userId, role } = request

      // 如果是用户消息，保存到本地
      if (role === 'user') {
        await chatDB.addMessage(sessionId, 'user', message)
      }

      // 获取或生成 session UUID
      const sessionUUID = getSessionUUID(sessionId)

      // 构建请求参数
      const chatRequest: ChatStreamRequest = {
        message,
        role: role || 'user',
        model: model || 'claude-3-opus',
        agent_id: agentId,
        session_id: sessionUUID,
        user_id: userId || 'default_user'
      }

      // 调用流式 API
      await apiService.chatStream(
        chatRequest,
        (data: StreamCallbackData) => {
          // 发送流式数据到前端
          port.postMessage({ type: 'data', data })
        },
        () => {
          // 完成
          port.postMessage({ type: 'done' })
        },
        (error) => {
          port.postMessage({ type: 'error', error: error.message })
        }
      )
    })
  }
})

async function handleMessage(message: ChromeMessage, sender: chrome.runtime.MessageSender) {
  const { type, payload } = message

  try {
    switch (type) {
      case 'TOGGLE_CHAT':
        // 通知content script切换聊天窗口
        if (sender.tab?.id) {
          chrome.tabs.sendMessage(sender.tab.id, { type: 'TOGGLE_CHAT' })
        }
        return { success: true }

      case 'SEND_MESSAGE':
        // 处理AI消息 (非流式，保留兼容)
        const { sessionId, content, agentId } = payload

        // 保存用户消息
        await chatDB.addMessage(sessionId, 'user', content)

        // 如果有 agentId，使用真实 API；否则使用模拟响应
        let aiResponse: string
        if (agentId) {
          // 使用同步方式获取完整响应
          aiResponse = await getFullResponse(agentId, sessionId, content, payload.model, payload.userId)
        } else {
          aiResponse = await simulateAIResponse(content)
        }

        await chatDB.addMessage(sessionId, 'assistant', aiResponse)
        return { success: true, response: aiResponse }

      case 'GET_MESSAGES':
        const messages = await chatDB.getMessages(payload.sessionId)
        return { success: true, data: messages }

      case 'GET_SESSIONS':
        const sessions = await chatDB.getSessions()
        return { success: true, data: sessions }

      case 'CREATE_SESSION':
        const newSessionId = await chatDB.addSession(payload.title || '新对话')
        return { success: true, data: { id: newSessionId } }

      case 'DELETE_SESSION':
        await chatDB.deleteSession(payload.sessionId)
        return { success: true }

      case 'SAVE_SETTING':
        await chatDB.saveSetting(payload.key, payload.value)
        // 如果是 API 配置，同步更新 apiService
        if (payload.key === 'apiEndpoint') {
          apiService.setBaseUrl(payload.value)
        } else if (payload.key === 'apiKey') {
          apiService.setToken(payload.value)
        }
        return { success: true }

      case 'GET_SETTING':
        const value = await chatDB.getSetting(payload.key)
        return { success: true, data: value }

      // 处理工具响应 - 用户点击 approve/reject 后调用
      case 'TOOL_RESPONSE':
        const { toolResponse, agentId: toolAgentId, model: toolModel, userId: toolUserId } = payload
        const toolSessionUUID = getSessionUUID(payload.sessionId)

        // 构建 function 角色的请求
        const toolRequest: ChatStreamRequest = {
          message: JSON.stringify({
            tool_id: toolResponse.toolId,
            approved: toolResponse.approved,
            result: toolResponse.result || ''
          }),
          role: 'function',
          model: toolModel || 'claude-3-opus',
          agent_id: toolAgentId || '',
          session_id: toolSessionUUID,
          user_id: toolUserId || 'default_user'
        }

        // 返回一个 Promise，通过流式 API 获取响应
        return new Promise((resolve) => {
          const blocks: ContentBlock[] = []
          let currentContent = ''
          let currentThink = ''
          let currentToolCall: ToolUseBlock | null = null

          apiService.chatStream(
            toolRequest,
            (data: StreamCallbackData) => {
              if (data.content) {
                currentContent += data.content
              }
              if (data.think && !data.think.partial) {
                currentThink = data.think.reasoning_content
              }
              if (data.toolCall && !data.toolCall.partial) {
                currentToolCall = {
                  type: 'tool_use',
                  id: `tool_${Date.now()}`,
                  name: data.toolCall.tool_name,
                  input: JSON.parse(data.toolCall.arguments || '{}'),
                  status: 'pending'
                }
              }
            },
            () => {
              // 完成时构建 blocks
              if (currentContent) {
                blocks.push({ type: 'text', text: currentContent })
              }
              if (currentToolCall) {
                blocks.push(currentToolCall)
              }
              resolve({
                success: true,
                blocks,
                isComplete: !currentToolCall,
                think: currentThink
              })
            },
            (error) => {
              resolve({
                success: false,
                error: error.message
              })
            }
          )
        })

      // 新增: 获取 Agent 列表
      case 'GET_AGENTS':
        const agentsResult = await apiService.getAgents(payload?.url)
        return { success: true, data: agentsResult }

      // 新增: 获取会话历史 (从远程服务)
      case 'GET_HISTORY':
        const historyResult = await apiService.getHistory(
          payload.sessionId,
          payload.page,
          payload.pageSize
        )
        return { success: true, data: historyResult }

      // 新增: 意图识别
      case 'RECOGNIZE_INTENT':
        const intentResult = await apiService.recognizeIntent(payload.url)
        return { success: true, data: intentResult }

      default:
        return { success: false, error: 'Unknown message type' }
    }
  } catch (error) {
    console.error('Background error:', error)
    return { success: false, error: String(error) }
  }
}

// 获取完整响应 (非流式)
async function getFullResponse(
  agentId: string,
  sessionId: number,
  message: string,
  model?: string,
  userId?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    let fullContent = ''
    const sessionUUID = getSessionUUID(sessionId)

    const request: ChatStreamRequest = {
      message,
      role: 'user',
      model: model || 'claude-3-opus',
      agent_id: agentId,
      session_id: sessionUUID,
      user_id: userId || 'default_user'
    }

    apiService.chatStream(
      request,
      (data: StreamCallbackData) => {
        if (data.content) {
          fullContent += data.content
        }
      },
      () => resolve(fullContent),
      (error) => reject(error)
    )
  })
}

// 模拟AI响应（实际项目中应该调用真实的AI API）
async function simulateAIResponse(userMessage: string): Promise<string> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000))

  const responses = [
    `我理解你说的"${userMessage}"。这是一个很好的问题！`,
    `关于"${userMessage}"，让我来帮你分析一下...`,
    `收到你的消息："${userMessage}"。我会尽力帮助你。`,
    `针对"${userMessage}"这个问题，我的建议是...`
  ]

  return responses[Math.floor(Math.random() * responses.length)]
}

// 处理工具响应（模拟）
// 实际项目中应该调用后台 API 继续对话
async function processToolResponse(
  sessionId: number,
  toolId: string,
  approved: boolean
): Promise<{ blocks: ContentBlock[]; isComplete: boolean }> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 800))

  if (!approved) {
    // 用户拒绝了工具调用
    return {
      blocks: [
        { type: 'text', text: '好的，我不会执行这个操作。请问还有什么我可以帮助您的吗？' }
      ],
      isComplete: true
    }
  }

  // 模拟工具执行后的响应
  // 随机决定是否继续调用工具或完成
  const shouldContinue = Math.random() > 0.5

  if (shouldContinue) {
    // 继续调用另一个工具
    return {
      blocks: [
        { type: 'text', text: '工具执行成功。现在我需要执行下一步操作...' },
        {
          type: 'tool_use',
          id: `tool_${Date.now()}`,
          name: 'read_file',
          input: { path: '/example/config.json' },
          status: 'pending'
        } as ToolUseBlock
      ],
      isComplete: false
    }
  } else {
    // 完成任务 (attempt_completion)
    return {
      blocks: [
        { type: 'text', text: '任务已完成！我已经成功执行了您请求的操作。' }
      ],
      isComplete: true
    }
  }
}

// 插件安装时创建默认会话
chrome.runtime.onInstalled.addListener(async () => {
  console.log('AI Chat Extension installed')
  await chatDB.init()

  // 创建默认会话
  const sessions = await chatDB.getSessions()
  if (sessions.length === 0) {
    await chatDB.addSession('默认对话')
  }
})
