// Background Service Worker
import { chatDB } from '../utils/db'
import type { ChromeMessage } from '../utils/types'

// 初始化数据库
chatDB.init().catch(console.error)

// 监听来自content script和popup的消息
chrome.runtime.onMessage.addListener((message: ChromeMessage, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse)
  return true // 保持消息通道开启
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
        // 处理AI消息
        const { sessionId, content } = payload

        // 保存用户消息
        await chatDB.addMessage(sessionId, 'user', content)

        // 模拟AI回复（实际应该调用AI API）
        const aiResponse = await simulateAIResponse(content)
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
        return { success: true }

      case 'GET_SETTING':
        const value = await chatDB.getSetting(payload.key)
        return { success: true, data: value }

      default:
        return { success: false, error: 'Unknown message type' }
    }
  } catch (error) {
    console.error('Background error:', error)
    return { success: false, error: String(error) }
  }
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
