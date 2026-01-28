<template>
  <div class="chat-wrapper">
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
        <!-- Agent 选择器 -->
        <div class="agent-selector" @click="toggleAgentDropdown">
          <div class="agent-selector-btn" :class="{ active: showAgentDropdown }">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
            <span v-if="selectedAgent" class="agent-selected-indicator"></span>
          </div>
          <!-- Agent 下拉列表 -->
          <div v-if="showAgentDropdown" class="agent-dropdown-menu">
            <div class="agent-dropdown-header">
              <input
                type="text"
                v-model="agentSearchQuery"
                placeholder="搜索 Agent..."
                @click.stop
              />
            </div>
            <div class="agent-dropdown-list">
              <div v-if="agentsLoading" class="agent-dropdown-loading">
                <div class="loading-spinner"></div>
                <span>加载中...</span>
              </div>
              <div v-else-if="filteredAgents.length === 0" class="agent-dropdown-empty">
                暂无可用 Agent
              </div>
              <div
                v-else
                v-for="agent in filteredAgents"
                :key="agent.id"
                class="agent-dropdown-item"
                :class="{ selected: selectedAgent?.id === agent.id, recommended: agent.id === recommendedAgentId }"
                @click.stop="selectAgent(agent)"
              >
                <div class="agent-dropdown-avatar">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                  </svg>
                </div>
                <div class="agent-dropdown-info">
                  <div class="agent-dropdown-name">
                    {{ agent.name }}
                    <span v-if="agent.id === recommendedAgentId" class="recommended-tag">推荐</span>
                  </div>
                  <div class="agent-dropdown-desc">{{ agent.description }}</div>
                </div>
                <div v-if="selectedAgent?.id === agent.id" class="agent-check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="20 6 9 17 4 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
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
import { ref, computed, onMounted, nextTick, watch } from 'vue'

interface Agent {
  id: string
  name: string
  description: string
  avatar?: string
  tags?: string[]
  matchScore?: number
}

interface Message {
  id?: number
  sessionId: number
  role: 'user' | 'assistant'
  content: string
  createdAt: number
}

interface Session {
  id: number
  title: string
  createdAt: number
}

const messagesContainer = ref<HTMLElement>()
const inputArea = ref<HTMLTextAreaElement>()
const inputMessage = ref('')
const isLoading = ref(false)
const messages = ref<Message[]>([])
const currentSessionId = ref(1)
const isPinned = ref(false)

// Agent 相关状态
const agents = ref<Agent[]>([])
const selectedAgent = ref<Agent | null>(null)
const showAgentDropdown = ref(false)
const agentSearchQuery = ref('')
const agentsLoading = ref(false)
const recommendedAgentId = ref<string | null>(null)
const currentPageUrl = ref('')
const currentPageTitle = ref('')

// 流式响应相关
const streamingContent = ref('')
const isStreaming = ref(false)

// 检测是否在 iframe 中
const isInIframe = computed(() => window.self !== window.top)

// 过滤后的 Agent 列表
const filteredAgents = computed(() => {
  if (!agentSearchQuery.value) return agents.value
  const query = agentSearchQuery.value.toLowerCase()
  return agents.value.filter(
    agent =>
      agent.name.toLowerCase().includes(query) ||
      agent.description.toLowerCase().includes(query) ||
      agent.tags?.some(tag => tag.toLowerCase().includes(query))
  )
})

onMounted(async () => {
  // 从URL参数获取sessionId
  const urlParams = new URLSearchParams(window.location.search)
  const sid = urlParams.get('sessionId')
  if (sid) {
    currentSessionId.value = parseInt(sid)
  }

  // 获取当前页面信息
  const pageUrl = urlParams.get('pageUrl')
  const pageTitle = urlParams.get('pageTitle')
  if (pageUrl) currentPageUrl.value = decodeURIComponent(pageUrl)
  if (pageTitle) currentPageTitle.value = decodeURIComponent(pageTitle)

  // 加载历史消息
  await loadMessages()

  // 加载 Agent 列表并进行意图识别
  await loadAgents()

  // 聚焦输入框
  nextTick(() => {
    inputArea.value?.focus()
  })

  // 监听来自 content script 的消息
  window.addEventListener('message', (event) => {
    if (event.data.type === 'PIN_STATUS_CHANGED') {
      isPinned.value = event.data.isPinned
    }
    if (event.data.type === 'PAGE_INFO') {
      currentPageUrl.value = event.data.url
      currentPageTitle.value = event.data.title
      // 页面变化时重新加载 Agent 并识别意图
      loadAgents()
    }
  })

  // 点击外部关闭下拉框
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target.closest('.agent-selector')) {
      showAgentDropdown.value = false
    }
  })
})

// 加载 Agent 列表
const loadAgents = async () => {
  agentsLoading.value = true
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_AGENTS',
      payload: { url: currentPageUrl.value }
    })

    if (response.success && response.data) {
      agents.value = response.data.agents || []
      recommendedAgentId.value = response.data.recommended || null

      // 自动选中推荐的 Agent
      if (recommendedAgentId.value && !selectedAgent.value) {
        const recommended = agents.value.find(a => a.id === recommendedAgentId.value)
        if (recommended) {
          selectedAgent.value = recommended
        }
      }

      // 如果没有推荐且有 Agent，选中第一个
      if (!selectedAgent.value && agents.value.length > 0) {
        selectedAgent.value = agents.value[0]
      }
    }
  } catch (error) {
    console.error('加载 Agent 列表失败:', error)
  } finally {
    agentsLoading.value = false
  }
}

// 切换 Agent 下拉框
const toggleAgentDropdown = () => {
  showAgentDropdown.value = !showAgentDropdown.value
  if (showAgentDropdown.value) {
    agentSearchQuery.value = ''
  }
}

// 选择 Agent
const selectAgent = (agent: Agent) => {
  selectedAgent.value = agent
  showAgentDropdown.value = false
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
  if (!inputMessage.value.trim() || isLoading.value || isStreaming.value) return

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

  // 如果选择了 Agent，使用流式响应
  if (selectedAgent.value) {
    await sendStreamMessage(content)
  } else {
    // 使用原有的非流式方式
    await sendNonStreamMessage(content)
  }
}

// 流式发送消息
const sendStreamMessage = async (content: string) => {
  isStreaming.value = true
  streamingContent.value = ''

  // 添加一个空的 assistant 消息用于显示流式内容
  const assistantMessage: Message = {
    sessionId: currentSessionId.value,
    role: 'assistant',
    content: '',
    createdAt: Date.now()
  }
  messages.value.push(assistantMessage)
  const messageIndex = messages.value.length - 1

  try {
    const port = chrome.runtime.connect({ name: 'chat-stream' })

    port.onMessage.addListener((msg) => {
      if (msg.type === 'content') {
        streamingContent.value += msg.content
        // 更新消息内容
        messages.value[messageIndex].content = streamingContent.value
        nextTick(scrollToBottom)
      } else if (msg.type === 'done') {
        isStreaming.value = false
        port.disconnect()
      } else if (msg.type === 'error') {
        console.error('流式响应错误:', msg.error)
        messages.value[messageIndex].content = `错误: ${msg.error}`
        isStreaming.value = false
        port.disconnect()
      }
    })

    port.postMessage({
      agentId: selectedAgent.value!.id,
      sessionId: currentSessionId.value,
      message: content,
      context: {
        url: currentPageUrl.value,
        title: currentPageTitle.value
      }
    })
  } catch (error) {
    console.error('发送流式消息失败:', error)
    messages.value[messageIndex].content = `发送失败: ${error}`
    isStreaming.value = false
  }
}

// 非流式发送消息
const sendNonStreamMessage = async (content: string) => {
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
/* 整体布局 */
.chat-wrapper {
  display: flex;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  position: relative;
}

.chat-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100vh;
  background: white;
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

/* Agent 选择器样式 */
.agent-selector-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: background 0.2s;
}

.agent-selector-bar:hover {
  background: #f0f1f3;
}

.selected-agent {
  display: flex;
  align-items: center;
  gap: 8px;
}

.agent-avatar-mini {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.agent-avatar-mini svg {
  width: 16px;
  height: 16px;
  fill: white;
}

.agent-name-text {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.match-badge {
  font-size: 11px;
  padding: 2px 6px;
  background: #dcfce7;
  color: #166534;
  border-radius: 10px;
}

.no-agent {
  font-size: 13px;
  color: #6b7280;
}

.dropdown-arrow {
  width: 16px;
  height: 16px;
  stroke: #6b7280;
  transition: transform 0.2s;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

/* Agent 下拉列表 */
.agent-dropdown {
  position: absolute;
  top: 100px;
  left: 0;
  right: 0;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  max-height: 300px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.agent-search {
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
}

.agent-search input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
}

.agent-search input:focus {
  border-color: #667eea;
}

.agent-list {
  flex: 1;
  overflow-y: auto;
}

.agent-loading,
.agent-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: #6b7280;
  font-size: 13px;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.agent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.agent-item:hover {
  background: #f3f4f6;
}

.agent-item.selected {
  background: #eff6ff;
}

.agent-item.recommended {
  border-left: 3px solid #667eea;
}

.agent-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.agent-avatar svg {
  width: 22px;
  height: 22px;
  fill: white;
}

.agent-info {
  flex: 1;
  min-width: 0;
}

.agent-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 6px;
}

.recommended-tag {
  font-size: 10px;
  padding: 1px 5px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  font-weight: normal;
}

.agent-desc {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agent-score {
  font-size: 12px;
  font-weight: 500;
  color: #059669;
  background: #d1fae5;
  padding: 2px 8px;
  border-radius: 10px;
}

/* 流式响应时的光标效果 */
.message.assistant .message-content.streaming::after {
  content: '▋';
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* Agent 选择器 - 输入框旁边 */
.agent-selector {
  position: relative;
  flex-shrink: 0;
}

.agent-selector-btn {
  width: 40px;
  height: 40px;
  border: 1px solid #e5e7eb;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  position: relative;
  color: #6b7280;
}

.agent-selector-btn:hover {
  background: #f0f1f3;
  border-color: #d1d5db;
}

.agent-selector-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
}

.agent-selector-btn svg {
  width: 20px;
  height: 20px;
}

.agent-selected-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  border: 2px solid #f8f9fa;
}

.agent-selector-btn.active .agent-selected-indicator {
  border-color: #667eea;
}

/* Agent 下拉菜单 */
.agent-dropdown-menu {
  position: absolute;
  bottom: 48px;
  left: 0;
  width: 300px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
}

.agent-dropdown-header {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.agent-dropdown-header input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
}

.agent-dropdown-header input:focus {
  border-color: #667eea;
}

.agent-dropdown-list {
  max-height: 280px;
  overflow-y: auto;
}

.agent-dropdown-loading,
.agent-dropdown-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: #6b7280;
  font-size: 13px;
}

.agent-dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.agent-dropdown-item:hover {
  background: #f3f4f6;
}

.agent-dropdown-item.selected {
  background: #eff6ff;
}

.agent-dropdown-item.recommended {
  border-left: 3px solid #667eea;
}

.agent-dropdown-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.agent-dropdown-avatar svg {
  width: 18px;
  height: 18px;
  fill: white;
}

.agent-dropdown-info {
  flex: 1;
  min-width: 0;
}

.agent-dropdown-name {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 6px;
}

.agent-dropdown-desc {
  font-size: 11px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.agent-check {
  width: 20px;
  height: 20px;
  color: #667eea;
}

.agent-check svg {
  width: 20px;
  height: 20px;
  stroke: #667eea;
}
</style>
