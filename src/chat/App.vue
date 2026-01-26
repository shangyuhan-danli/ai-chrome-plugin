<template>
  <div class="chat-container">
    <div class="chat-header">
      <div class="header-left">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h3>AI Chat Assistant</h3>
      </div>
      <div class="header-right">
        <button v-if="isInIframe" class="icon-btn" :class="{ active: isPinned }" @click="togglePin" title="固定窗口">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M16 4v8l3 3-2 2-3-3-4 4-2-2 4-4-3-3 2-2 3 3V4h2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button v-if="isInIframe" class="icon-btn" @click="openFullscreen" title="全屏打开">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="icon-btn" @click="closeChat" title="关闭">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18" stroke-width="2" stroke-linecap="round"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <div v-if="messages.length === 0" class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p>开始对话吧！</p>
      </div>

      <div
        v-for="message in messages"
        :key="message.id"
        class="message"
        :class="message.role"
      >
        <div class="message-avatar">
          <svg v-if="message.role === 'user'" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
          </svg>
        </div>
        <div class="message-content-wrapper">
          <div class="message-content">{{ message.content }}</div>
          <div class="message-time">{{ formatTime(message.createdAt) }}</div>
        </div>
      </div>

      <div v-if="isLoading" class="message assistant">
        <div class="message-avatar">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
          </svg>
        </div>
        <div class="message-content-wrapper">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-input-area">
      <textarea
        v-model="inputMessage"
        @keydown.enter.exact.prevent="sendMessage"
        placeholder="输入消息... (Enter发送)"
        rows="1"
        ref="inputArea"
      ></textarea>
      <button class="send-btn" @click="sendMessage" :disabled="!inputMessage.trim() || isLoading">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="22" y1="2" x2="11" y2="13" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'

interface Message {
  id?: number
  sessionId: number
  role: 'user' | 'assistant'
  content: string
  createdAt: number
}

const messagesContainer = ref<HTMLElement>()
const inputArea = ref<HTMLTextAreaElement>()
const inputMessage = ref('')
const isLoading = ref(false)
const messages = ref<Message[]>([])
const currentSessionId = ref(1)
const isPinned = ref(false)

// 检测是否在 iframe 中
const isInIframe = computed(() => window.self !== window.top)

onMounted(async () => {
  // 从URL参数获取sessionId
  const urlParams = new URLSearchParams(window.location.search)
  const sid = urlParams.get('sessionId')
  if (sid) {
    currentSessionId.value = parseInt(sid)
  }

  // 加载历史消息
  await loadMessages()

  // 聚焦输入框
  nextTick(() => {
    inputArea.value?.focus()
  })

  // 监听来自 content script 的消息
  window.addEventListener('message', (event) => {
    if (event.data.type === 'PIN_STATUS_CHANGED') {
      isPinned.value = event.data.isPinned
    }
  })
})

const loadMessages = async () => {
  const response = await chrome.runtime.sendMessage({
    type: 'GET_MESSAGES',
    payload: { sessionId: currentSessionId.value }
  })
  if (response.success) {
    messages.value = response.data
    nextTick(scrollToBottom)
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return

  const content = inputMessage.value.trim()
  inputMessage.value = ''

  // 添加用户消息
  messages.value.push({
    sessionId: currentSessionId.value,
    role: 'user',
    content,
    createdAt: Date.now()
  })

  nextTick(scrollToBottom)

  // 发送到后台处理
  isLoading.value = true
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'SEND_MESSAGE',
      payload: { sessionId: currentSessionId.value, content }
    })

    if (response.success) {
      messages.value.push({
        sessionId: currentSessionId.value,
        role: 'assistant',
        content: response.response,
        createdAt: Date.now()
      })
      nextTick(scrollToBottom)
    }
  } catch (error) {
    console.error('发送消息失败:', error)
  } finally {
    isLoading.value = false
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const togglePin = () => {
  console.log('togglePin clicked, current isPinned:', isPinned.value)
  // 通知 content script 切换固定状态
  if (window.parent && window.parent !== window) {
    console.log('Sending PIN_CHAT message to parent')
    window.parent.postMessage({ type: 'PIN_CHAT' }, '*')
    // 先乐观更新 UI
    isPinned.value = !isPinned.value
  } else {
    console.log('Not in iframe, cannot pin')
  }
}

const closeChat = () => {
  if (window.parent && window.parent !== window) {
    // 在 iframe 中，通知父窗口关闭
    window.parent.postMessage({ type: 'CLOSE_CHAT' }, '*')
  } else {
    // 在独立标签页中，关闭标签页
    window.close()
  }
}

const openFullscreen = () => {
  // 在新标签页打开聊天页面
  const url = chrome.runtime.getURL(`chat.html?sessionId=${currentSessionId.value}`)
  chrome.tabs.create({ url })

  // 关闭当前 iframe
  if (window.parent) {
    window.parent.postMessage({ type: 'CLOSE_CHAT' }, '*')
  }
}
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  user-select: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon svg {
  width: 20px;
  height: 20px;
  stroke: white;
}

.header-left h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.header-right {
  display: flex;
  gap: 4px;
}

.icon-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.icon-btn.active {
  background: rgba(255, 255, 255, 0.4);
}

.icon-btn.active svg {
  fill: white;
}

.icon-btn svg {
  width: 16px;
  height: 16px;
  stroke: white;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: white;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
}

.empty-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  stroke: #d1d5db;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.message {
  display: flex;
  gap: 12px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message.user .message-avatar {
  background: #667eea;
  color: white;
}

.message.assistant .message-avatar {
  background: #f3f4f6;
  color: #6b7280;
}

.message-avatar svg {
  width: 18px;
  height: 18px;
}

.message-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-content {
  background: #f3f4f6;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  color: #1f2937;
  word-wrap: break-word;
}

.message.user .message-content {
  background: #667eea;
  color: white;
}

.message-time {
  font-size: 11px;
  color: #9ca3af;
  padding: 0 4px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 10px 14px;
  background: #f3f4f6;
  border-radius: 12px;
  width: fit-content;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #9ca3af;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

.chat-input-area {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  background: white;
}

.chat-input-area textarea {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  outline: none;
  max-height: 120px;
}

.chat-input-area textarea:focus {
  border-color: #667eea;
}

.send-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: #667eea;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  background: #5568d3;
}

.send-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.send-btn svg {
  width: 18px;
  height: 18px;
  stroke: white;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
