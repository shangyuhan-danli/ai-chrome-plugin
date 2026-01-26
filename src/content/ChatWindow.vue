<template>
  <div v-if="isVisible" :class="['chat-window', displayMode, { minimized: isMinimized }]" :style="windowStyle">
    <!-- 标题栏 -->
    <div class="chat-header" @mousedown="startDrag">
      <div class="header-left">
        <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="title">AI Chat</span>
      </div>
      <div class="header-actions">
        <button class="icon-btn" @click="toggleMinimize" title="最小化">
          <svg v-if="!isMinimized" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="5" y1="12" x2="19" y2="12" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="18" height="18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="icon-btn" @click="closeWindow" title="关闭">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18" stroke-width="2" stroke-linecap="round"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 聊天内容区 -->
    <div v-show="!isMinimized" class="chat-body">
      <div class="messages-container" ref="messagesContainer">
        <div v-if="messages.length === 0" class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <p>开始对话吧！</p>
        </div>

        <div v-for="msg in messages" :key="msg.id" :class="['message', msg.role]">
          <div class="message-avatar">
            <svg v-if="msg.role === 'user'" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
          </div>
          <div class="message-content">
            <div class="message-text">{{ msg.content }}</div>
            <div class="message-time">{{ formatTime(msg.createdAt) }}</div>
          </div>
        </div>

        <div v-if="isLoading" class="message assistant">
          <div class="message-avatar">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
          </div>
          <div class="message-content">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区 -->
      <div class="chat-input">
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import type { Message } from '../utils/types'

const isVisible = ref(false)
const isMinimized = ref(false)
const displayMode = ref<'float' | 'sidebar'>('float')
const messages = ref<Message[]>([])
const inputMessage = ref('')
const isLoading = ref(false)
const currentSessionId = ref(1)

// 悬浮窗位置
const position = ref({ x: window.innerWidth - 420, y: 100 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

const messagesContainer = ref<HTMLElement>()
const inputArea = ref<HTMLTextAreaElement>()

const windowStyle = ref({})

onMounted(async () => {
  // 加载显示模式
  const response = await chrome.runtime.sendMessage({
    type: 'GET_SETTING',
    payload: { key: 'displayMode' }
  })
  if (response.success && response.data) {
    displayMode.value = response.data
  }

  // 加载历史消息
  await loadMessages()

  // 监听窗口消息
  window.addEventListener('message', (event) => {
    if (event.data.source === 'ai-chat-extension') {
      if (event.data.type === 'TOGGLE_CHAT') {
        toggleWindow()
      } else if (event.data.type === 'UPDATE_MODE') {
        displayMode.value = event.data.payload.mode
      }
    }
  })

  // 监听拖拽
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
})

// 组件卸载时清理
const cleanup = () => {
  document.body.style.transform = ''
  document.body.style.transition = ''
  document.body.style.width = ''
  document.body.classList.remove('ai-chat-sidebar-open')
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// 监听页面卸载
window.addEventListener('beforeunload', cleanup)

watch(displayMode, (newMode, oldMode) => {
  updateWindowStyle()
  updatePageLayout(newMode, oldMode)
})

watch(isVisible, (newVisible) => {
  if (displayMode.value === 'sidebar') {
    updatePageLayout(displayMode.value, displayMode.value, newVisible)
  }
})

const updateWindowStyle = () => {
  if (displayMode.value === 'float') {
    windowStyle.value = {
      left: `${position.value.x}px`,
      top: `${position.value.y}px`
    }
  } else {
    windowStyle.value = {}
  }
}

const updatePageLayout = (newMode: string, oldMode?: string, visible?: boolean) => {
  const shouldShift = newMode === 'sidebar' && (visible !== false ? isVisible.value : visible)

  if (shouldShift) {
    // 侧边栏模式且可见 - 页面左移
    document.body.style.transform = 'translateX(-400px)'
    document.body.style.transition = 'transform 0.3s ease'
    document.body.style.width = 'calc(100% + 400px)'
    document.body.classList.add('ai-chat-sidebar-open')
  } else {
    // 恢复页面位置
    document.body.style.transform = ''
    document.body.style.transition = 'transform 0.3s ease'
    document.body.style.width = ''
    document.body.classList.remove('ai-chat-sidebar-open')
  }
}

const toggleWindow = () => {
  isVisible.value = !isVisible.value
  if (isVisible.value) {
    isMinimized.value = false
    nextTick(() => {
      inputArea.value?.focus()
      scrollToBottom()
    })
  }
}

const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value
}

const closeWindow = () => {
  isVisible.value = false
  // 侧边栏模式下关闭时恢复页面位置
  if (displayMode.value === 'sidebar') {
    updatePageLayout('float')
  }
}

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

// 拖拽功能
const startDrag = (e: MouseEvent) => {
  if (displayMode.value !== 'float') return
  isDragging.value = true
  dragStart.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  }
}

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return
  position.value = {
    x: e.clientX - dragStart.value.x,
    y: e.clientY - dragStart.value.y
  }
  updateWindowStyle()
}

const stopDrag = () => {
  isDragging.value = false
}
</script>

<style scoped>
.chat-window {
  position: fixed;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  z-index: 2147483647;
  overflow: hidden;
}

.chat-window.float {
  width: 400px;
  height: 600px;
}

.chat-window.float.minimized {
  height: 48px;
}

.chat-window.sidebar {
  right: 0;
  top: 0;
  width: 400px;
  height: 100vh;
  border-radius: 0;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  cursor: move;
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
}

.title {
  font-size: 14px;
  font-weight: 600;
}

.header-actions {
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

.icon-btn svg {
  width: 16px;
  height: 16px;
  stroke: white;
}

.chat-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.message-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-text {
  background: #f3f4f6;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  color: #1f2937;
  word-wrap: break-word;
}

.message.user .message-text {
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

.chat-input {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  background: white;
}

.chat-input textarea {
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

.chat-input textarea:focus {
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

.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
