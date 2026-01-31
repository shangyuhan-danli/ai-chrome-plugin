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
          <div class="header-title">
            <h3>AI Chat Assistant</h3>
            <div class="header-badges">
              <span v-if="selectedAgent" class="agent-badge" :title="selectedAgent.name">{{ selectedAgent.name }}</span>
              <span v-if="currentModel" class="model-badge">{{ currentModel }}</span>
            </div>
          </div>
        </div>
        <div class="header-right">
          <button class="icon-btn" @click="createNewSession" title="新建会话">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="12" y1="5" x2="12" y2="19" stroke-width="2" stroke-linecap="round"/>
              <line x1="5" y1="12" x2="19" y2="12" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          <button class="icon-btn" @click="openHelp" title="帮助文档">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" stroke-width="2"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="12" y1="17" x2="12.01" y2="17" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          <button class="icon-btn" @click="openSettings" title="设置">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="3" stroke-width="2"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
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
      <div v-if="streamMessages.length === 0" class="empty-state">
        <p>开始对话吧</p>
      </div>

      <!-- 消息列表 -->
      <div v-for="msg in streamMessages" :key="msg.id || msg.createdAt" :class="['message', msg.role]">
        <!-- 用户消息 -->
        <template v-if="msg.role === 'user'">
          <div class="message-box user-box">{{ getMessageText(msg) }}</div>
        </template>

        <!-- AI 消息 -->
        <template v-else>
          <div class="assistant-content">
            <!-- 思考过程 -->
            <div v-if="msg.think" class="think-block">
              <div class="think-header">
                <span class="think-icon">💭</span>
                <span class="think-label">思考过程</span>
              </div>
              <div class="think-content">{{ msg.think }}</div>
            </div>

            <template v-for="(block, index) in msg.blocks" :key="index">
              <!-- 文本块 -->
              <div v-if="block.type === 'text'" class="message-box assistant-box">
                <span class="block-indicator text-indicator">▶</span>
                <span class="block-content">{{ block.text }}</span>
              </div>

              <!-- 工具调用块 -->
              <div v-else-if="block.type === 'tool_use'" class="tool-block">
                <div class="tool-header">
                  <span class="block-indicator tool-indicator">⚙</span>
                  <span class="tool-name">{{ block.name }}</span>
                  <span v-if="block.status === 'approved'" class="tool-badge approved">已批准</span>
                  <span v-else-if="block.status === 'rejected'" class="tool-badge rejected">已拒绝</span>
                </div>
                <pre class="tool-params">{{ formatToolInput(block.input) }}</pre>
                <div v-if="block.status === 'pending' && !isLoading" class="tool-actions">
                  <button class="btn btn-approve" @click="handleToolResponse(block.id, true)">Approve</button>
                  <button class="btn btn-reject" @click="handleToolResponse(block.id, false)">Reject</button>
                </div>
              </div>
            </template>
          </div>
        </template>
      </div>

      <!-- 加载指示器 -->
      <div v-if="isLoading" class="message assistant">
        <div class="assistant-content">
          <div class="message-box assistant-box typing">
            <span></span><span></span><span></span>
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
import type { StreamMessage, ToolUseBlock, ContentBlock } from '../utils/types'
import type { PageContext, PageAction, ActionResult, BatchActionResult } from '../utils/pageActionTypes'
import { browserToolService } from '../utils/browserToolService'

// 扩展 StreamMessage 类型以支持 think
interface ExtendedStreamMessage extends StreamMessage {
  think?: string
}

interface Agent {
  id: string
  name: string
  description: string
  avatar?: string
  tags?: string[]
  matchScore?: number
}

const messagesContainer = ref<HTMLElement>()
const inputArea = ref<HTMLTextAreaElement>()
const inputMessage = ref('')
const isLoading = ref(false)
const streamMessages = ref<ExtendedStreamMessage[]>([])
const currentSessionId = ref(1)
const isPinned = ref(false)

// 计算是否在等待工具响应
const waitingForToolResponse = computed(() => {
  if (streamMessages.value.length === 0) return false
  const lastMsg = streamMessages.value[streamMessages.value.length - 1]
  if (lastMsg.role !== 'assistant') return false
  return lastMsg.blocks.some(
    (block) => block.type === 'tool_use' && (block as ToolUseBlock).status === 'pending'
  )
})

// Agent 相关状态
const agents = ref<Agent[]>([])
const selectedAgent = ref<Agent | null>(null)
const showAgentDropdown = ref(false)
const agentSearchQuery = ref('')
const agentsLoading = ref(false)
const recommendedAgentId = ref<string | null>(null)
const currentPageUrl = ref('')
const currentPageTitle = ref('')

// 当前使用的模型
const currentModel = ref('gpt-3.5-turbo')

// 流式响应相关
const streamingContent = ref('')
const isStreaming = ref(false)

// 页面上下文缓存
const cachedPageContext = ref<PageContext | null>(null)

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

  // 加载当前模型设置
  await loadCurrentModel()

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
      payload: { userId: 'default_user' }
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

// 加载当前模型设置
const loadCurrentModel = async () => {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_SETTING',
      payload: { key: 'model' }
    })
    if (response?.success && response.data) {
      currentModel.value = response.data
    } else {
      // 默认模型
      currentModel.value = 'gpt-3.5-turbo'
    }
  } catch (error) {
    console.error('加载模型设置失败:', error)
    currentModel.value = 'gpt-3.5-turbo'
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
    streamMessages.value = response.data.map((msg: any) => ({
      ...msg,
      blocks: msg.blocks || [{ type: 'text', text: msg.content }]
    }))
    nextTick(scrollToBottom)
  }
}

const getMessageText = (msg: StreamMessage): string => {
  const textBlocks = msg.blocks.filter((b) => b.type === 'text')
  return textBlocks.map((b) => (b as any).text).join('')
}

const formatToolInput = (input: Record<string, any>): string => {
  return JSON.stringify(input, null, 2)
}

// 获取当前页面上下文
const getPageContext = async (userMessage: string = ''): Promise<PageContext | null> => {
  // 只有在 iframe 中才能获取页面上下文
  if (!isInIframe.value) {
    return null
  }

  try {
    // 获取当前活动标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) return null

    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'GET_PAGE_CONTEXT',
      payload: { userMessage }
    })

    if (response?.success) {
      cachedPageContext.value = response.data
      return response.data
    }
  } catch (error) {
    console.error('获取页面上下文失败:', error)
  }
  return null
}

// 执行浏览器工具调用
const executeBrowserTool = async (toolName: string, argsJson: string): Promise<string> => {
  return await browserToolService.execute(toolName, argsJson)
}

// 自动处理浏览器工具调用
const handleBrowserToolCall = async (toolCall: ToolUseBlock, messageIndex: number) => {
  // 标记为已批准（浏览器工具自动执行）
  toolCall.status = 'approved'

  // 执行工具
  const result = await executeBrowserTool(toolCall.name, JSON.stringify(toolCall.input))

  // 将结果作为 function 消息发送给后端
  await sendToolResultToBackend(toolCall.id, result)
}

// 发送工具执行结果给后端
const sendToolResultToBackend = async (toolId: string, result: string) => {
  isStreaming.value = true
  streamingContent.value = ''

  const assistantMessage: ExtendedStreamMessage = {
    sessionId: currentSessionId.value,
    role: 'assistant',
    blocks: [{ type: 'text', text: '' }],
    createdAt: Date.now()
  }
  streamMessages.value.push(assistantMessage)
  const messageIndex = streamMessages.value.length - 1

  let currentThink = ''
  let pendingToolCall: ToolUseBlock | null = null

  try {
    // 获取最新的页面上下文
    const pageContext = await getPageContext()

    const port = chrome.runtime.connect({ name: 'chat-stream' })

    port.onMessage.addListener(async (msg) => {
      if (msg.type === 'data') {
        const data = msg.data

        if (data.content) {
          streamingContent.value += data.content
          const textBlock = streamMessages.value[messageIndex].blocks.find(b => b.type === 'text')
          if (textBlock && textBlock.type === 'text') {
            textBlock.text = streamingContent.value
          }
          nextTick(scrollToBottom)
        }

        if (data.think && data.think.reasoning_content) {
          currentThink = data.think.reasoning_content
        }

        if (data.toolCall && data.toolCall.tool_name) {
          try {
            pendingToolCall = {
              type: 'tool_use',
              id: `tool_${Date.now()}`,
              name: data.toolCall.tool_name,
              input: JSON.parse(data.toolCall.arguments || '{}'),
              status: 'pending'
            }
          } catch (e) {
            console.error('解析工具参数失败:', e)
          }
        }
      } else if (msg.type === 'done') {
        isStreaming.value = false
        streamMessages.value[messageIndex].blocks = []

        if (currentThink) {
          streamMessages.value[messageIndex].think = currentThink
        }

        if (pendingToolCall) {
          streamMessages.value[messageIndex].blocks.push(pendingToolCall)
          streamMessages.value[messageIndex].isComplete = false

          // 如果是浏览器工具，自动执行
          if (browserToolService.isBrowserTool(pendingToolCall.name)) {
            port.disconnect()
            nextTick(() => {
              handleBrowserToolCall(pendingToolCall!, messageIndex)
            })
            return
          }
        } else {
          if (streamingContent.value) {
            streamMessages.value[messageIndex].blocks.push({ type: 'text', text: streamingContent.value })
          }
          streamMessages.value[messageIndex].isComplete = true
        }

        port.disconnect()
        nextTick(scrollToBottom)
      } else if (msg.type === 'error') {
        console.error('流式响应错误:', msg.error)
        const textBlock = streamMessages.value[messageIndex].blocks.find(b => b.type === 'text')
        if (textBlock && textBlock.type === 'text') {
          textBlock.text = `错误: ${msg.error}`
        }
        isStreaming.value = false
        port.disconnect()
      }
    })

    // 发送工具执行结果
    port.postMessage({
      agentId: selectedAgent.value?.id || '',
      sessionId: currentSessionId.value,
      message: JSON.stringify({ tool_id: toolId, result }),
      model: currentModel.value,
      userId: 'default_user',
      role: 'function',
      currentPageInfo: pageContext,
      browserTools: browserToolService.getToolDefinitions()
    })
  } catch (error) {
    console.error('发送工具结果失败:', error)
    isStreaming.value = false
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value || isStreaming.value || waitingForToolResponse.value) return

  const content = inputMessage.value.trim()
  inputMessage.value = ''

  // 添加用户消息
  const userMessage: StreamMessage = {
    sessionId: currentSessionId.value,
    role: 'user',
    blocks: [{ type: 'text', text: content }],
    createdAt: Date.now()
  }
  streamMessages.value.push(userMessage)

  nextTick(scrollToBottom)

  // 如果选择了 Agent 且 id 有效，使用流式响应
  if (selectedAgent.value && selectedAgent.value.id) {
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
  const assistantMessage: ExtendedStreamMessage = {
    sessionId: currentSessionId.value,
    role: 'assistant',
    blocks: [{ type: 'text', text: '' }],
    createdAt: Date.now()
  }
  streamMessages.value.push(assistantMessage)
  const messageIndex = streamMessages.value.length - 1

  let lastThink = ''
  let lastToolCall: ToolUseBlock | null = null

  try {
    const port = chrome.runtime.connect({ name: 'chat-stream' })

    port.onMessage.addListener((msg) => {
      if (msg.type === 'data') {
        const data = msg.data

        // 处理文本内容 - 流式过程中不断拼接显示
        if (data.content) {
          streamingContent.value += data.content
          // 更新消息内容
          const textBlock = streamMessages.value[messageIndex].blocks.find(b => b.type === 'text')
          if (textBlock && textBlock.type === 'text') {
            textBlock.text = streamingContent.value
          }
          nextTick(scrollToBottom)
        }

        // 收集思考内容 - 替换策略，取最后一次
        if (data.think && data.think.reasoning_content) {
          lastThink = data.think.reasoning_content
        }

        // 收集工具调用 - 替换策略，取最后一次
        if (data.toolCall && data.toolCall.tool_name) {
          try {
            lastToolCall = {
              type: 'tool_use',
              id: `tool_${Date.now()}`,
              name: data.toolCall.tool_name,
              input: JSON.parse(data.toolCall.arguments || '{}'),
              status: 'pending'
            }
          } catch (e) {
            console.error('解析工具参数失败:', e)
          }
        }

        // 处理统计信息
        if (data.statistic) {
          console.log('Token 使用统计:', data.statistic.token_usage)
        }
      } else if (msg.type === 'done') {
        // 流式传输完成 - 用 think 和 tool_call 替换原始 content 显示
        isStreaming.value = false

        // 清空 blocks，重新构建
        streamMessages.value[messageIndex].blocks = []

        // 如果有思考内容，添加 think
        if (lastThink) {
          streamMessages.value[messageIndex].think = lastThink
        }

        // 如果有工具调用，添加 tool_call 块
        if (lastToolCall) {
          streamMessages.value[messageIndex].blocks.push(lastToolCall)
          streamMessages.value[messageIndex].isComplete = false

          // 如果是浏览器工具，自动执行
          if (browserToolService.isBrowserTool(lastToolCall.name)) {
            port.disconnect()
            nextTick(() => {
              handleBrowserToolCall(lastToolCall!, messageIndex)
            })
            return
          }
        } else {
          // 没有工具调用，保留文本内容（如果没有 think 和 tool_call，说明是普通回复）
          if (!lastThink && streamingContent.value) {
            streamMessages.value[messageIndex].blocks.push({ type: 'text', text: streamingContent.value })
          }
          streamMessages.value[messageIndex].isComplete = true
        }

        port.disconnect()
        nextTick(scrollToBottom)
      } else if (msg.type === 'error') {
        console.error('流式响应错误:', msg.error)
        const textBlock = streamMessages.value[messageIndex].blocks.find(b => b.type === 'text')
        if (textBlock && textBlock.type === 'text') {
          textBlock.text = `错误: ${msg.error}`
        }
        isStreaming.value = false
        port.disconnect()
      }
    })

    // 获取页面上下文
    const pageContext = await getPageContext(content)

    // 获取浏览器工具定义
    const browserTools = browserToolService.getToolDefinitions()

    port.postMessage({
      agentId: selectedAgent.value!.id,
      sessionId: currentSessionId.value,
      message: content,
      model: currentModel.value,
      userId: 'default_user',
      role: 'user',
      currentPageInfo: pageContext,
      browserTools: browserTools
    })
  } catch (error) {
    console.error('发送流式消息失败:', error)
    const textBlock = streamMessages.value[messageIndex].blocks.find(b => b.type === 'text')
    if (textBlock && textBlock.type === 'text') {
      textBlock.text = `发送失败: ${error}`
    }
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
      const assistantMessage: StreamMessage = {
        sessionId: currentSessionId.value,
        role: 'assistant',
        blocks: response.blocks || [{ type: 'text', text: response.response }],
        createdAt: Date.now(),
        isComplete: response.isComplete !== false
      }
      streamMessages.value.push(assistantMessage)
      nextTick(scrollToBottom)
    }
  } catch (error) {
    console.error('发送消息失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 处理工具响应
const handleToolResponse = async (toolId: string, approved: boolean) => {
  const lastMsg = streamMessages.value[streamMessages.value.length - 1]
  if (lastMsg && lastMsg.role === 'assistant') {
    const toolBlock = lastMsg.blocks.find(
      (b) => b.type === 'tool_use' && (b as ToolUseBlock).id === toolId
    ) as ToolUseBlock | undefined

    if (toolBlock) {
      toolBlock.status = approved ? 'approved' : 'rejected'
    }
  }

  // 使用流式接口发送工具响应
  isStreaming.value = true
  streamingContent.value = ''

  // 添加一个空的 assistant 消息用于显示流式内容
  const assistantMessage: ExtendedStreamMessage = {
    sessionId: currentSessionId.value,
    role: 'assistant',
    blocks: [{ type: 'text', text: '' }],
    createdAt: Date.now()
  }
  streamMessages.value.push(assistantMessage)
  const messageIndex = streamMessages.value.length - 1

  let currentThink = ''
  let pendingToolCall: ToolUseBlock | null = null

  try {
    const port = chrome.runtime.connect({ name: 'chat-stream' })

    port.onMessage.addListener((msg) => {
      if (msg.type === 'data') {
        const data = msg.data

        // 处理文本内容 - 流式过程中不断拼接显示
        if (data.content) {
          streamingContent.value += data.content
          const textBlock = streamMessages.value[messageIndex].blocks.find(b => b.type === 'text')
          if (textBlock && textBlock.type === 'text') {
            textBlock.text = streamingContent.value
          }
          nextTick(scrollToBottom)
        }

        // 收集思考内容
        if (data.think && data.think.reasoning_content) {
          currentThink += data.think.reasoning_content
        }

        // 收集工具调用
        if (data.toolCall && data.toolCall.tool_name) {
          try {
            pendingToolCall = {
              type: 'tool_use',
              id: `tool_${Date.now()}`,
              name: data.toolCall.tool_name,
              input: JSON.parse(data.toolCall.arguments || '{}'),
              status: 'pending'
            }
          } catch (e) {
            console.error('解析工具参数失败:', e)
          }
        }

        // 处理统计信息
        if (data.statistic) {
          console.log('Token 使用统计:', data.statistic.token_usage)
        }
      } else if (msg.type === 'done') {
        // 流式传输完成 - 用 think 和 tool_call 替换原始 content 显示
        isStreaming.value = false

        // 清空 blocks，重新构建
        streamMessages.value[messageIndex].blocks = []

        // 如果有思考内容，添加 think
        if (currentThink) {
          streamMessages.value[messageIndex].think = currentThink
        }

        // 如果有工具调用，添加 tool_call 块
        if (pendingToolCall) {
          streamMessages.value[messageIndex].blocks.push(pendingToolCall)
          streamMessages.value[messageIndex].isComplete = false

          // 如果是浏览器工具，自动执行
          if (browserToolService.isBrowserTool(pendingToolCall.name)) {
            port.disconnect()
            nextTick(() => {
              handleBrowserToolCall(pendingToolCall!, messageIndex)
            })
            return
          }
        } else {
          // 没有工具调用，保留文本内容
          if (!currentThink && streamingContent.value) {
            streamMessages.value[messageIndex].blocks.push({ type: 'text', text: streamingContent.value })
          }
          streamMessages.value[messageIndex].isComplete = true
        }

        port.disconnect()
        nextTick(scrollToBottom)
      } else if (msg.type === 'error') {
        console.error('流式响应错误:', msg.error)
        const textBlock = streamMessages.value[messageIndex].blocks.find(b => b.type === 'text')
        if (textBlock && textBlock.type === 'text') {
          textBlock.text = `错误: ${msg.error}`
        }
        isStreaming.value = false
        port.disconnect()
      }
    })

    // 获取页面上下文
    const pageContext = await getPageContext()

    // 获取浏览器工具定义
    const browserTools = browserToolService.getToolDefinitions()

    // 发送工具响应
    port.postMessage({
      agentId: selectedAgent.value?.id || '',
      sessionId: currentSessionId.value,
      message: JSON.stringify({ toolId, approved }),
      model: currentModel.value,
      userId: 'default_user',
      role: 'function',
      currentPageInfo: pageContext,
      browserTools: browserTools
    })
  } catch (error) {
    console.error('处理工具响应失败:', error)
    const textBlock = streamMessages.value[messageIndex].blocks.find(b => b.type === 'text')
    if (textBlock && textBlock.type === 'text') {
      textBlock.text = `发送失败: ${error}`
    }
    isStreaming.value = false
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

const openHelp = () => {
  // 打开帮助文档页面
  chrome.tabs.create({ url: 'https://github.com/anthropics/claude-code/issues' })
}

const openSettings = () => {
  // 打开设置页面
  const url = chrome.runtime.getURL('options.html')
  chrome.tabs.create({ url })
}

// 新建会话
const createNewSession = async () => {
  // 生成新的 sessionId
  currentSessionId.value = Date.now()
  // 清空当前消息
  streamMessages.value = []
  // 重置流式状态
  streamingContent.value = ''
  isStreaming.value = false
  isLoading.value = false
  // 聚焦输入框
  nextTick(() => {
    inputArea.value?.focus()
  })
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

.header-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-title h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
}

.header-badges {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.agent-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.35);
  border-radius: 4px;
  font-weight: 500;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 4px;
  font-weight: 400;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  gap: 12px;
  background: #fafafa;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 14px;
}

.empty-state p {
  margin: 0;
}

.message {
  display: flex;
  flex-direction: column;
}

.message.user {
  align-items: flex-end;
}

.message.assistant {
  align-items: flex-start;
}

.message-box {
  max-width: 85%;
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}

.user-box {
  background: #1a73e8;
  color: #fff;
  border-radius: 4px;
}

.assistant-box {
  background: #fff;
  color: #333;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.assistant-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 85%;
}

/* 思考块样式 */
.think-block {
  background: #f0f7ff;
  border: 1px solid #91caff;
  border-radius: 4px;
  padding: 10px;
  font-size: 12px;
  margin-bottom: 4px;
}

.think-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.think-icon {
  font-size: 14px;
}

.think-label {
  font-weight: 500;
  color: #1677ff;
}

.think-content {
  color: #4b5563;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.block-indicator {
  flex-shrink: 0;
  font-size: 12px;
}

.text-indicator {
  color: #1a73e8;
}

.tool-indicator {
  color: #f59e0b;
}

.block-content {
  flex: 1;
}

/* 工具块样式 */
.tool-block {
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 4px;
  padding: 12px;
  font-size: 13px;
}

.tool-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.tool-name {
  font-weight: 600;
  color: #b45309;
}

.tool-badge {
  margin-left: auto;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.tool-badge.approved {
  background: #d1fae5;
  color: #065f46;
}

.tool-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.tool-params {
  background: #fef3c7;
  border-radius: 4px;
  padding: 8px 10px;
  margin: 0;
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  color: #78350f;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-x: auto;
}

.tool-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  justify-content: flex-end;
}

.btn {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-approve {
  background: #10b981;
  color: #fff;
}

.btn-approve:hover {
  background: #059669;
}

.btn-reject {
  background: #ef4444;
  color: #fff;
}

.btn-reject:hover {
  background: #dc2626;
}

/* 打字动画 */
.message-box.typing {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
}

.message-box.typing span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #9ca3af;
  animation: typing 1.2s infinite;
}

.message-box.typing span:nth-child(2) {
  animation-delay: 0.15s;
}

.message-box.typing span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-6px);
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
  background: #dbeafe;
}

.agent-dropdown-item.selected .agent-dropdown-name {
  color: #1d4ed8;
  font-weight: 600;
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
