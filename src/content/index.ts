import './style.css'
import './actionStyles.css'
import { getPageContext, requestMoreElements, getElementById } from './elementCollector'
import { executeAction, executeBatchActions, clearAllStyles } from './actionExecutor'
import type { PageAction } from '../utils/pageActionTypes'

let chatFrame: HTMLIFrameElement | null = null
let chatContainer: HTMLDivElement | null = null
let currentSessionId: number | null = null
let currentTabId: number | null = null
let isPinned: boolean = false
let styleElement: HTMLStyleElement | null = null
let resizeHandle: HTMLDivElement | null = null
let currentWidth: number = 480  // 默认宽度
const MIN_WIDTH = 320
const MAX_WIDTH = 800
let isResizing = false

// 更新布局样式
function updateLayoutStyle(width: number) {
  if (styleElement) {
    styleElement.textContent = `
      /* 核心：缩小 html 宽度，让页面内容自然收缩 */
      html {
        width: calc(100% - ${width}px) !important;
        min-width: auto !important;
        overflow-x: hidden !important;
        position: relative !important;
      }

      /* 确保 body 跟随 html 宽度 */
      body {
        width: 100% !important;
        min-width: auto !important;
        max-width: 100% !important;
        overflow-x: hidden !important;
        position: relative !important;
      }

      /* 确保聊天容器不受影响，固定在视口右侧 */
      #ai-chat-container {
        position: fixed !important;
        right: 0 !important;
        top: 0 !important;
        width: ${width}px !important;
        height: 100vh !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
      }
    `
  }
}

// 设置拖拽事件处理
function setupResizeHandlers() {
  if (!resizeHandle) return

  let startX = 0
  let startWidth = 0

  const onMouseDown = (e: MouseEvent) => {
    e.preventDefault()
    isResizing = true
    startX = e.clientX
    startWidth = currentWidth

    // 添加遮罩层防止 iframe 捕获鼠标事件
    const overlay = document.createElement('div')
    overlay.id = 'ai-chat-resize-overlay'
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 2147483646;
      cursor: ew-resize;
    `
    document.body.appendChild(overlay)

    if (resizeHandle) {
      resizeHandle.style.background = 'rgba(102, 126, 234, 0.5)'
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const onMouseMove = (e: MouseEvent) => {
    if (!isResizing) return

    const deltaX = startX - e.clientX
    let newWidth = startWidth + deltaX

    // 限制宽度范围
    newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth))
    currentWidth = newWidth

    // 更新容器宽度
    if (chatContainer) {
      chatContainer.style.width = `${newWidth}px`
    }

    // 更新页面布局
    updateLayoutStyle(newWidth)
  }

  const onMouseUp = () => {
    isResizing = false

    // 移除遮罩层
    const overlay = document.getElementById('ai-chat-resize-overlay')
    if (overlay) {
      overlay.remove()
    }

    if (resizeHandle) {
      resizeHandle.style.background = 'transparent'
    }

    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)

    // 保存宽度到 storage
    chrome.storage.local.set({ chatWidth: currentWidth })
  }

  resizeHandle.addEventListener('mousedown', onMouseDown)
}

// 获取当前页面信息
function getPageInfo() {
  return {
    url: window.location.href,
    title: document.title
  }
}

// 获取或创建当前标签页的会话
async function getOrCreateSessionForTab(tabId?: number): Promise<number> {
  const pageInfo = getPageInfo()

  if (!tabId) {
    // 如果无法获取 tabId，创建一个基于时间戳的会话
    const response = await chrome.runtime.sendMessage({
      type: 'CREATE_SESSION',
      payload: {
        title: pageInfo.title || '新对话',
        pageUrl: pageInfo.url,
        pageTitle: pageInfo.title
      }
    })
    return response.data.id
  }

  currentTabId = tabId

  // 检查该标签页是否已有会话
  const existingSession = await chrome.runtime.sendMessage({
    type: 'GET_SESSION_BY_TAB',
    payload: { tabId }
  })

  if (existingSession.success && existingSession.data) {
    // 已有会话，更新页面信息
    await chrome.runtime.sendMessage({
      type: 'UPDATE_SESSION',
      payload: {
        sessionId: existingSession.data.id,
        updates: {
          pageUrl: pageInfo.url,
          pageTitle: pageInfo.title
        }
      }
    })
    return existingSession.data.id
  }

  // 没有会话，创建新会话
  const response = await chrome.runtime.sendMessage({
    type: 'CREATE_SESSION',
    payload: {
      title: pageInfo.title || '新对话',
      tabId,
      pageUrl: pageInfo.url,
      pageTitle: pageInfo.title
    }
  })

  return response.data.id
}

function createChatFrame(sessionId: number) {
  const pageInfo = getPageInfo()
  const chatUrl = chrome.runtime.getURL(
    `chat.html?sessionId=${sessionId}&pageUrl=${encodeURIComponent(pageInfo.url)}&pageTitle=${encodeURIComponent(pageInfo.title)}`
  )

  if (chatFrame) {
    chatFrame.src = chatUrl
    // 通知 chat 页面更新页面信息
    setTimeout(() => {
      if (chatFrame?.contentWindow) {
        chatFrame.contentWindow.postMessage({
          type: 'PAGE_INFO',
          url: pageInfo.url,
          title: pageInfo.title
        }, '*')
      }
    }, 500)
    return
  }

  // 创建聊天容器 - 使用相对定位，不覆盖页面
  chatContainer = document.createElement('div')
  chatContainer.id = 'ai-chat-container'
  chatContainer.style.cssText = `
    position: fixed;
    width: ${currentWidth}px;
    height: 100vh;
    right: 0;
    top: 0;
    z-index: 2147483647;
    background: white;
    border-left: 1px solid #e5e7eb;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  `

  // 创建拖拽手柄
  resizeHandle = document.createElement('div')
  resizeHandle.id = 'ai-chat-resize-handle'
  resizeHandle.style.cssText = `
    position: absolute;
    left: 0;
    top: 0;
    width: 6px;
    height: 100%;
    cursor: ew-resize;
    background: transparent;
    z-index: 2147483648;
    transition: background 0.2s;
  `
  resizeHandle.addEventListener('mouseenter', () => {
    if (resizeHandle) resizeHandle.style.background = 'rgba(102, 126, 234, 0.3)'
  })
  resizeHandle.addEventListener('mouseleave', () => {
    if (resizeHandle && !isResizing) resizeHandle.style.background = 'transparent'
  })

  chatFrame = document.createElement('iframe')
  chatFrame.src = chatUrl
  chatFrame.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
  `

  chatContainer.appendChild(resizeHandle)
  chatContainer.appendChild(chatFrame)
  document.body.appendChild(chatContainer)

  // 设置拖拽事件
  setupResizeHandlers()

  // 调整页面布局 - 将页面内容挤压到左侧
  styleElement = document.createElement('style')
  styleElement.id = 'ai-chat-layout-style'
  updateLayoutStyle(currentWidth)
  document.head.appendChild(styleElement)

  // 监听窗口大小变化，自动调整聊天容器高度
  const resizeObserver = new ResizeObserver(() => {
    if (chatContainer) {
      chatContainer.style.height = `${window.innerHeight}px`
    }
  })
  resizeObserver.observe(document.documentElement)

  // 保存 resizeObserver 以便后续清理
  ;(chatContainer as any).__resizeObserver = resizeObserver

  // 监听来自chat页面的消息
  window.addEventListener('message', handleChatMessage)

  // 保存固定状态到 storage
  if (isPinned) {
    chrome.storage.local.set({ chatPinned: true, chatSessionId: sessionId })
  }
}

// 监听页面 URL 变化 (SPA 应用)
let lastUrl = window.location.href
const urlObserver = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href
    // URL 变化时通知 chat 页面
    if (chatFrame?.contentWindow) {
      const pageInfo = getPageInfo()
      chatFrame.contentWindow.postMessage({
        type: 'PAGE_INFO',
        url: pageInfo.url,
        title: pageInfo.title
      }, '*')
    }
  }
})
urlObserver.observe(document.body, { childList: true, subtree: true })

function handleChatMessage(event: MessageEvent) {
  if (event.source !== chatFrame?.contentWindow) return

  console.log('Received message from chat:', event.data)

  if (event.data.type === 'CLOSE_CHAT') {
    closeChat()
  } else if (event.data.type === 'PIN_CHAT') {
    console.log('Handling PIN_CHAT')
    togglePin()
  }
}

function togglePin() {
  isPinned = !isPinned
  console.log('togglePin called, new isPinned:', isPinned)

  if (isPinned) {
    // 固定：保存状态到 storage
    chrome.storage.local.set({
      chatPinned: true,
      chatSessionId: currentSessionId
    }, () => {
      console.log('Saved pin state to storage')
    })

    // 通知 chat 页面更新按钮状态
    if (chatFrame?.contentWindow) {
      chatFrame.contentWindow.postMessage({
        type: 'PIN_STATUS_CHANGED',
        isPinned: true
      }, '*')
      console.log('Sent PIN_STATUS_CHANGED: true to chat')
    }
  } else {
    // 取消固定：清除状态
    chrome.storage.local.remove(['chatPinned', 'chatSessionId'], () => {
      console.log('Removed pin state from storage')
    })

    // 通知 chat 页面更新按钮状态
    if (chatFrame?.contentWindow) {
      chatFrame.contentWindow.postMessage({
        type: 'PIN_STATUS_CHANGED',
        isPinned: false
      }, '*')
      console.log('Sent PIN_STATUS_CHANGED: false to chat')
    }
  }
}

function closeChat() {
  if (chatContainer) {
    // 断开 ResizeObserver
    const resizeObserver = (chatContainer as any).__resizeObserver
    if (resizeObserver) {
      resizeObserver.disconnect()
    }

    chatContainer.remove()
    chatContainer = null
    chatFrame = null
    resizeHandle = null

    // 移除样式
    if (styleElement) {
      styleElement.remove()
      styleElement = null
    }

    // 移除可能残留的遮罩层
    const overlay = document.getElementById('ai-chat-resize-overlay')
    if (overlay) {
      overlay.remove()
    }

    // 如果不是固定状态，清除 storage
    if (!isPinned) {
      chrome.storage.local.remove(['chatPinned', 'chatSessionId'])
    }
  }
}

// 页面加载时检查是否有固定的聊天窗口
chrome.storage.local.get(['chatPinned', 'chatSessionId', 'chatWidth'], (result) => {
  // 恢复保存的宽度
  if (result.chatWidth) {
    currentWidth = result.chatWidth
  }

  if (result.chatPinned && result.chatSessionId) {
    isPinned = true
    currentSessionId = result.chatSessionId
    // 等待 DOM 加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        createChatFrame(result.chatSessionId)
      })
    } else {
      createChatFrame(result.chatSessionId)
    }
  }
})

// 监听来自popup或background的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_CHAT') {
    // 如果传入了 sessionId，使用传入的；否则自动获取或创建
    if (message.sessionId) {
      currentSessionId = message.sessionId
      if (chatContainer) {
        chatFrame!.src = chrome.runtime.getURL(`chat.html?sessionId=${message.sessionId}`)
      } else {
        createChatFrame(message.sessionId)
      }
      sendResponse({ success: true })
    } else {
      // 自动获取或创建当前标签页的会话，tabId 由 popup 传入
      const tabId = message.tabId
      getOrCreateSessionForTab(tabId).then(sessionId => {
        currentSessionId = sessionId
        if (chatContainer) {
          chatFrame!.src = chrome.runtime.getURL(`chat.html?sessionId=${sessionId}`)
        } else {
          createChatFrame(sessionId)
        }
        sendResponse({ success: true, sessionId })
      }).catch(err => {
        console.error('Failed to get/create session:', err)
        sendResponse({ success: false, error: err.message })
      })
      return true // 异步响应
    }
  } else if (message.type === 'CLOSE_CHAT') {
    closeChat()
    sendResponse({ success: true })
  } else if (message.type === 'CHECK_CHAT_STATUS') {
    sendResponse({
      isOpen: !!chatContainer,
      isPinned: isPinned,
      sessionId: currentSessionId
    })
  }
  // ========== 页面操作相关消息处理 ==========
  else if (message.type === 'GET_PAGE_CONTEXT') {
    // 获取页面上下文（包含可交互元素）
    const userMessage = message.payload?.userMessage || ''
    const context = getPageContext(userMessage)
    sendResponse({ success: true, data: context })
  }
  else if (message.type === 'REQUEST_MORE_ELEMENTS') {
    // 请求更多元素
    const params = message.payload || {}
    const elements = requestMoreElements(params)
    sendResponse({ success: true, data: elements })
  }
  else if (message.type === 'EXECUTE_PAGE_ACTION') {
    // 执行单个页面操作
    const action = message.payload as PageAction
    executeAction(action).then(result => {
      sendResponse({ success: result.success, data: result })
    })
    return true // 异步响应
  }
  else if (message.type === 'EXECUTE_BATCH_ACTIONS') {
    // 批量执行页面操作
    const actions = message.payload as PageAction[]
    executeBatchActions(actions).then(result => {
      sendResponse({ success: result.success, data: result })
    })
    return true // 异步响应
  }
  else if (message.type === 'CLEAR_AI_STYLES') {
    // 清除 AI 添加的样式
    clearAllStyles()
    sendResponse({ success: true })
  }
  else if (message.type === 'GET_SELECTED_TEXT') {
    // 获取用户选中的文字
    const selectedText = window.getSelection()?.toString() || ''
    sendResponse({ success: true, data: selectedText })
  }
  return true
})
