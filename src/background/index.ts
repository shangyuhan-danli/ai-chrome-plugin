// Background Service Worker
import { chatDB } from '../utils/db'
import { apiService } from '../utils/api'
import type { ChromeMessage } from '../utils/types'

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

// 监听流式会话的长连接
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'chat-stream') {
    port.onMessage.addListener(async (request) => {
      const { agentId, sessionId, message, context } = request

      // 保存用户消息到本地
      await chatDB.addMessage(sessionId, 'user', message)

      // 调用流式 API
      await apiService.chatStream(
        { agentId, sessionId: String(sessionId), message, context },
        (content) => port.postMessage({ type: 'content', content }),
        (messageId) => port.postMessage({ type: 'done', messageId }),
        (error) => port.postMessage({ type: 'error', error: error.message })
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
          aiResponse = await getFullResponse(agentId, sessionId, content, payload.context)
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
  context?: { url: string; title: string }
): Promise<string> {
  return new Promise((resolve, reject) => {
    let fullContent = ''

    apiService.chatStream(
      { agentId, sessionId: String(sessionId), message, context },
      (content) => { fullContent += content },
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
