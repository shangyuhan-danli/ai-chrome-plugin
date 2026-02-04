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
              <!-- <span v-if="currentModel" class="model-badge">{{ currentModel }}</span> -->
            </div>
          </div>
        </div>
        <div class="header-right">
          <!-- 会话选择器 -->
          <div class="session-selector" @click.stop="toggleSessionDropdown">
            <button class="icon-btn" :class="{ active: showSessionDropdown }" title="切换会话">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <!-- 会话下拉列表 -->
            <div v-if="showSessionDropdown" class="session-dropdown-menu">
              <div class="session-dropdown-header">
                <span>历史会话</span>
                <button class="session-new-btn" @click.stop="createNewSession">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="12" y1="5" x2="12" y2="19" stroke-width="2" stroke-linecap="round"/>
                    <line x1="5" y1="12" x2="19" y2="12" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  新建
                </button>
              </div>
              <div class="session-dropdown-list">
                <div v-if="sessionsLoading" class="session-dropdown-loading">
                  <div class="loading-spinner"></div>
                  <span>加载中...</span>
                </div>
                <div v-else-if="sessions.length === 0" class="session-dropdown-empty">
                  暂无历史会话
                </div>
                <div
                  v-else
                  v-for="session in sessions"
                  :key="session.id"
                  class="session-dropdown-item"
                  :class="{ selected: currentSessionId === session.id }"
                  @click.stop="switchSession(session)"
                >
                  <div class="session-dropdown-info">
                    <div class="session-dropdown-title">{{ session.title || session.pageTitle || '未命名会话' }}</div>
                    <div class="session-dropdown-meta">
                      <span v-if="session.pageUrl" class="session-url">{{ getDomain(session.pageUrl) }}</span>
                      <span class="session-time">{{ formatSessionTime(session.updatedAt) }}</span>
                    </div>
                  </div>
                  <div class="session-dropdown-actions">
                    <button class="session-action-btn" @click.stop="startRenameSession(session)" title="重命名">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                    <button class="session-action-btn" @click.stop="exportSession(session.id)" title="导出">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <polyline points="7 10 12 15 17 10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <line x1="12" y1="15" x2="12" y2="3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                    <button class="session-action-btn delete" @click.stop="confirmDeleteSession(session)" title="删除">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14">
                        <polyline points="3 6 5 6 21 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <div v-if="currentSessionId === session.id" class="session-check">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="20 6 9 17 4 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
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

      <!-- 重命名对话框 -->
      <div v-if="renamingSession" class="modal-overlay" @click="cancelRename">
        <div class="modal-dialog" @click.stop>
          <div class="modal-header">重命名会话</div>
          <div class="modal-body">
            <input
              type="text"
              class="rename-input"
              v-model="renameInput"
              @keyup.enter="confirmRename"
              @keyup.esc="cancelRename"
              placeholder="输入新名称"
            />
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="cancelRename">取消</button>
            <button class="btn btn-primary" @click="confirmRename">确定</button>
          </div>
        </div>
      </div>

      <!-- 删除确认对话框 -->
      <div v-if="sessionToDelete" class="modal-overlay" @click="cancelDelete">
        <div class="modal-dialog" @click.stop>
          <div class="modal-header">确认删除</div>
          <div class="modal-body">
            <p>确定要删除会话 "{{ sessionToDelete.title || sessionToDelete.pageTitle || '未命名会话' }}" 吗？</p>
            <p class="modal-warning">此操作不可恢复</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="cancelDelete">取消</button>
            <button class="btn btn-danger" @click="deleteSession">删除</button>
          </div>
        </div>
      </div>

      <div class="chat-messages" ref="messagesContainer">
      <div v-if="streamMessages.length === 0" class="empty-state">
        <p>开始对话吧</p>
      </div>

      <!-- 消息列表 -->
      <div v-for="msg in streamMessages" :key="msg.id || msg.createdAt" :class="['message', msg.role, 'message-in']">
        <!-- 用户消息 -->
        <template v-if="msg.role === 'user'">
          <div class="message-box user-box">{{ getMessageText(msg) }}</div>
          <span class="message-time">{{ formatTime(msg.createdAt) }}</span>
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
                <!-- 工具参数 - 可折叠的 JSON -->
                <div class="tool-params-container">
                  <div class="tool-params-header" @click="toggleJsonCollapse($event)">
                    <svg class="collapse-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="6 9 12 15 18 9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="tool-params-label">参数</span>
                  </div>
                  <pre class="tool-params" :class="{ collapsed: false }"><code v-html="formatJsonWithHighlight(block.input)"></code></pre>
                </div>
                <div v-if="block.status === 'pending' && !isLoading" class="tool-actions">
                  <button class="btn btn-approve" @click="handleToolResponse(block.id, true)">Approve</button>
                  <button class="btn btn-reject" @click="handleToolResponse(block.id, false)">Reject</button>
                </div>
              </div>

              <!-- 任务完成总结块 -->
              <div v-else-if="block.type === 'summary'" class="summary-block">
                <div class="summary-header">
                  <span class="summary-icon">✅</span>
                  <span class="summary-label">任务完成</span>
                </div>
                <div class="summary-content">{{ block.text }}</div>
              </div>

              <!-- AI提问块 -->
              <div v-else-if="block.type === 'question'" class="question-block">
                <div class="question-header">
                  <span class="question-icon">❓</span>
                  <span class="question-label">AI 想问你</span>
                </div>
                <div class="question-content">{{ block.text }}</div>
                <div class="question-hint">请在下方输入框回复</div>
              </div>

              <!-- 工具执行结果块 -->
              <div v-else-if="block.type === 'tool_result'" class="tool-result-block" :class="{ success: (block as ToolResultBlock).success, error: !(block as ToolResultBlock).success, loading: (block as ToolResultBlock).isLoading }">
                <div class="tool-result-header">
                  <span class="tool-result-icon">
                    <svg v-if="(block as ToolResultBlock).isLoading" class="spinning" viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                      <path d="M12 2v4m0 12v4m-8-10H2m20 0h-2m-2.93-6.07l-1.41 1.41m-9.32 9.32l-1.41 1.41m12.14 0l-1.41-1.41M6.34 6.34L4.93 4.93" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <svg v-else-if="(block as ToolResultBlock).success" viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <polyline points="22 4 12 14.01 9 11.01" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                      <circle cx="12" cy="12" r="10" stroke-width="2"/>
                      <line x1="15" y1="9" x2="9" y2="15" stroke-width="2" stroke-linecap="round"/>
                      <line x1="9" y1="9" x2="15" y2="15" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </span>
                  <span class="tool-result-name">{{ (block as ToolResultBlock).toolName }}</span>
                  <span class="tool-result-status">
                    {{ (block as ToolResultBlock).isLoading ? '执行中...' : ((block as ToolResultBlock).success ? '成功' : '失败') }}
                  </span>
                </div>
                <div class="tool-result-content">
                  <pre>{{ (block as ToolResultBlock).result }}</pre>
                </div>
              </div>

              <!-- 图片块（截图结果） -->
              <div v-else-if="block.type === 'image'" class="image-block">
                <div class="image-container">
                  <img :src="(block as any).url" :alt="(block as any).alt || '图片'" class="screenshot-image" />
                  <div class="image-actions">
                    <button 
                      class="btn btn-download" 
                      @click="downloadScreenshot((block as any).url)"
                      title="下载图片"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <polyline points="7 10 12 15 17 10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <line x1="12" y1="15" x2="12" y2="3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      下载图片
                    </button>
                    <span class="image-hint">已保存到剪贴板，可直接粘贴</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
          <span class="message-time">{{ formatTime(msg.createdAt) }}</span>
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

      <!-- Token 使用统计栏 -->
      <div v-if="tokenUsage.total > 0 || isStreaming" class="token-stats-bar">
        <div class="token-stats-content">
          <div class="token-stats-info">
            <span class="token-used">已用 {{ formatNumber(tokenUsage.total) }}</span>
            <span class="token-separator">/</span>
            <span class="token-limit">{{ formatNumber(TOKEN_LIMIT) }}</span>
            <span class="token-remaining" :class="{ warning: tokenUsagePercent > 80 }">
              (剩余 {{ formatNumber(TOKEN_LIMIT - tokenUsage.total) }})
            </span>
          </div>
          <span v-if="tokenUsagePercent > 80" class="token-warning-text">建议开启新会话</span>
        </div>
        <div class="token-progress-bar">
          <div
            class="token-progress-fill"
            :class="{ warning: tokenUsagePercent > 80, danger: tokenUsagePercent > 95 }"
            :style="{ width: Math.min(tokenUsagePercent, 100) + '%' }"
          ></div>
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
        <button v-if="isStreaming" class="stop-btn" @click="stopStreaming" title="停止生成">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        </button>
        <button v-else class="send-btn" @click="sendMessage" :disabled="!inputMessage.trim() || isLoading">
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
import type { StreamMessage, ToolUseBlock, ToolResultBlock, ContentBlock } from '../utils/types'
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

// 会话选择器相关状态
const sessions = ref<any[]>([])
const showSessionDropdown = ref(false)
const sessionsLoading = ref(false)

// Token 使用统计
const tokenUsage = ref({
  total: 0,
  prompt: 0,
  completion: 0
})

// Token 上限（200K）
const TOKEN_LIMIT = 200000

// Token 使用百分比
const tokenUsagePercent = computed(() => {
  return (tokenUsage.value.total / TOKEN_LIMIT) * 100
})

// 格式化数字
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// 当前使用的模型
const currentModel = ref('gpt-3.5-turbo')

// 流式响应相关
const streamingContent = ref('')
const isStreaming = ref(false)
const currentPort = ref<chrome.runtime.Port | null>(null)

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
    if (!target.closest('.session-selector')) {
      showSessionDropdown.value = false
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

// 切换会话下拉框
const toggleSessionDropdown = async () => {
  showSessionDropdown.value = !showSessionDropdown.value
  if (showSessionDropdown.value) {
    await loadSessions()
  }
}

// 加载会话列表
const loadSessions = async () => {
  sessionsLoading.value = true
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_SESSIONS'
    })
    if (response.success) {
      // 按更新时间倒序排列
      sessions.value = (response.data || []).sort((a: any, b: any) => b.updatedAt - a.updatedAt)
    }
  } catch (error) {
    console.error('加载会话列表失败:', error)
  } finally {
    sessionsLoading.value = false
  }
}

// 切换会话
const switchSession = async (session: any) => {
  currentSessionId.value = session.id
  showSessionDropdown.value = false
  // 更新页面信息
  if (session.pageUrl) currentPageUrl.value = session.pageUrl
  if (session.pageTitle) currentPageTitle.value = session.pageTitle
  // 加载该会话的消息
  await loadMessages()
}

// 获取域名
const getDomain = (url: string): string => {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return url
  }
}

// 格式化会话时间
const formatSessionTime = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return new Date(timestamp).toLocaleDateString('zh-CN')
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

// JSON 语法高亮格式化
const formatJsonWithHighlight = (obj: Record<string, any>): string => {
  const json = JSON.stringify(obj, null, 2)
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g, (match) => {
      let cls = 'json-string'
      if (/:$/.test(match)) {
        cls = 'json-key'
        match = match.replace(/:$/, '')
        return `<span class="${cls}">${match}</span>:`
      }
      return `<span class="${cls}">${match}</span>`
    })
    .replace(/\b(true|false)\b/g, '<span class="json-boolean">$1</span>')
    .replace(/\b(null)\b/g, '<span class="json-null">$1</span>')
    .replace(/\b(-?\d+\.?\d*)\b/g, '<span class="json-number">$1</span>')
}

// 切换 JSON 折叠状态
const toggleJsonCollapse = (event: Event) => {
  const header = event.currentTarget as HTMLElement
  const container = header.parentElement
  const pre = container?.querySelector('.tool-params')
  const icon = header.querySelector('.collapse-icon')

  if (pre && icon) {
    pre.classList.toggle('collapsed')
    icon.classList.toggle('rotated')
  }
}

// 获取当前页面上下文
const getPageContext = async (userMessage: string = ''): Promise<PageContext | null> => {
  // 如果不在 iframe 中，使用已保存的页面信息构建基本上下文
  if (!isInIframe.value) {
    console.log('[getPageContext] 聊天窗口不在 iframe 中，使用已保存的页面信息')
    if (currentPageUrl.value) {
      return {
        url: currentPageUrl.value,
        title: currentPageTitle.value || '',
        elements: []
      }
    }
    console.warn('[getPageContext] 没有可用的页面信息')
    return null
  }

  try {
    // 获取当前活动标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) {
      console.warn('[getPageContext] 无法获取活动标签页')
      // 回退到已保存的页面信息
      if (currentPageUrl.value) {
        return {
          url: currentPageUrl.value,
          title: currentPageTitle.value || '',
          elements: []
        }
      }
      return null
    }

    console.log('[getPageContext] 尝试获取页面上下文，标签页:', tab.url)

    // 尝试发送消息，如果失败则尝试注入 content script
    let response
    try {
      response = await chrome.tabs.sendMessage(tab.id, {
        type: 'GET_PAGE_CONTEXT',
        payload: { userMessage }
      })
    } catch (error: any) {
      // 如果消息发送失败，可能是 content script 未注入，尝试注入
      if (error?.message?.includes('Could not establish connection') ||
          error?.message?.includes('Receiving end does not exist')) {
        console.log('[getPageContext] Content script 未注入，尝试注入...')
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          })
          await chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ['content.css']
          })
          // 等待 content script 初始化
          await new Promise(resolve => setTimeout(resolve, 200))
          // 重试发送消息
          response = await chrome.tabs.sendMessage(tab.id, {
            type: 'GET_PAGE_CONTEXT',
            payload: { userMessage }
          })
        } catch (injectError) {
          console.error('[getPageContext] 注入 content script 失败:', injectError)
          // 回退到已保存的页面信息
          if (currentPageUrl.value) {
            return {
              url: currentPageUrl.value,
              title: currentPageTitle.value || '',
              elements: []
            }
          }
          return null
        }
      } else {
        throw error
      }
    }

    // 检查响应是否有效
    if (!response) {
      console.warn('[getPageContext] Content script 返回 undefined，可能未正确响应')
      // 回退到已保存的页面信息
      if (currentPageUrl.value) {
        return {
          url: currentPageUrl.value,
          title: currentPageTitle.value || '',
          elements: []
        }
      }
      return null
    }

    if (response.success) {
      console.log('[getPageContext] 成功获取页面上下文，元素数量:', response.data?.elements?.length || 0)
      cachedPageContext.value = response.data
      return response.data
    } else {
      console.warn('[getPageContext] Content script 返回失败:', response)
      // 回退到已保存的页面信息
      if (currentPageUrl.value) {
        return {
          url: currentPageUrl.value,
          title: currentPageTitle.value || '',
          elements: []
        }
      }
      return null
    }
  } catch (error) {
    console.error('[getPageContext] 获取页面上下文失败:', error)
    // 回退到已保存的页面信息
    if (currentPageUrl.value) {
      return {
        url: currentPageUrl.value,
        title: currentPageTitle.value || '',
        elements: []
      }
    }
  }
  return null
}

// 执行浏览器工具调用
const executeBrowserTool = async (toolName: string, argsJson: string): Promise<string> => {
  return await browserToolService.execute(toolName, argsJson)
}

// 发送截图结果（带图片预览和下载按钮）
// 下载截图
const downloadScreenshot = (dataUrl: string, filename?: string) => {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename || `screenshot_${Date.now()}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const sendScreenshotResult = async (toolName: string, resultObj: any) => {
  // 添加带图片的消息
  const imageMessage: StreamMessage = {
    sessionId: currentSessionId.value,
    role: 'assistant',  // 作为 assistant 消息显示
    blocks: [
      { 
        type: 'text', 
        text: `✅ ${resultObj.message || '截图已保存到剪贴板，你可以直接粘贴使用（Ctrl+V/Cmd+V）'}` 
      },
      {
        type: 'image',
        url: resultObj.data,  // base64 图片数据
        alt: '页面截图'
      } as any
    ],
    createdAt: Date.now()
  }
  streamMessages.value.push(imageMessage)
  nextTick(scrollToBottom)

  // 下载图片函数
  const downloadImage = () => {
    const link = document.createElement('a')
    link.href = resultObj.data
    link.download = `screenshot_${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 保存下载函数到消息中供模板使用
  ;(imageMessage as any).downloadImage = downloadImage

  // 发送给后端（不包含图片数据，只发送文本描述）
  const resultForBackend = {
    success: true,
    message: resultObj.message,
    clipboardSaved: resultObj.clipboardSaved,
    autoDownload: resultObj.autoDownload,
    imageDataLength: resultObj.data?.length || 0
  }

  await sendBrowserToolResultAsUser(toolName, JSON.stringify(resultForBackend), resultObj.message)
}

// 发送浏览器工具执行结果给后端（作为 user 消息）
const sendBrowserToolResultAsUser = async (toolName: string, result: string, resultSummary: string) => {
  // 解析结果判断成功/失败
  let isSuccess = true
  try {
    const parsed = JSON.parse(result)
    isSuccess = parsed.success !== false
  } catch {
    // 解析失败默认成功
  }

  // 添加一个工具结果消息
  const toolResultMessage: StreamMessage = {
    sessionId: currentSessionId.value,
    role: 'assistant',
    blocks: [{
      type: 'tool_result',
      toolName: toolName,
      success: isSuccess,
      result: resultSummary
    } as ToolResultBlock],
    createdAt: Date.now()
  }
  streamMessages.value.push(toolResultMessage)
  nextTick(scrollToBottom)

  // 发送给后端
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
  let lastCompleteMessage: any = null

  try {
    // 获取最新的页面上下文
    const pageContext = await getPageContext()

    const port = chrome.runtime.connect({ name: 'chat-stream' })

    port.onMessage.addListener(async (msg) => {
      if (msg.type === 'data') {
        const data = msg.data
        lastCompleteMessage = data

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

        if (data.statistic && data.statistic.token_usage) {
          tokenUsage.value = {
            total: data.statistic.token_usage.total_tokens || 0,
            prompt: data.statistic.token_usage.prompt_tokens || 0,
            completion: data.statistic.token_usage.completion_tokens || 0
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
          // 所有工具都需要用户确认，不自动执行
        } else if (lastCompleteMessage?.answer?.result) {
          streamMessages.value[messageIndex].blocks.push({
            type: 'summary',
            text: lastCompleteMessage.answer.result
          })
          streamMessages.value[messageIndex].isComplete = true
        } else if (lastCompleteMessage?.ask?.question) {
          streamMessages.value[messageIndex].blocks.push({
            type: 'question',
            text: lastCompleteMessage.ask.question
          })
          streamMessages.value[messageIndex].isComplete = true
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

    // 发送工具执行结果作为 user 消息
    port.postMessage({
      agentId: selectedAgent.value?.id || '',
      sessionId: currentSessionId.value,
      message: `浏览器工具 ${toolName} 执行结果: ${result}`,
      model: currentModel.value,
      userId: 'default_user',
      role: 'user',  // DOM 工具结果作为 user 消息
      currentPageInfo: pageContext,
      browserTools: browserToolService.getToolDefinitions()
    })
  } catch (error) {
    console.error('发送工具结果失败:', error)
    isStreaming.value = false
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value || isStreaming.value) return

  let content = inputMessage.value.trim()
  inputMessage.value = ''

  // 检查是否有待确认的工具调用，如果有则自动拒绝
  const pendingToolInfo = getPendingToolInfo()
  if (pendingToolInfo) {
    // 标记工具为已拒绝
    markPendingToolAsRejected()
    // 在消息前追加拒绝说明
    content = `[用户拒绝了工具 "${pendingToolInfo.toolName}" 的执行，并发送了新指令]\n\n${content}`
  }

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

/**
 * 获取待确认的工具信息
 */
const getPendingToolInfo = (): { toolName: string; toolId: string } | null => {
  if (streamMessages.value.length === 0) return null
  const lastMsg = streamMessages.value[streamMessages.value.length - 1]
  if (lastMsg.role !== 'assistant') return null

  const pendingBlock = lastMsg.blocks.find(
    (block) => block.type === 'tool_use' && (block as ToolUseBlock).status === 'pending'
  ) as ToolUseBlock | undefined

  if (pendingBlock) {
    return { toolName: pendingBlock.name, toolId: pendingBlock.id }
  }
  return null
}

/**
 * 将待确认的工具标记为已拒绝
 */
const markPendingToolAsRejected = () => {
  if (streamMessages.value.length === 0) return
  const lastMsg = streamMessages.value[streamMessages.value.length - 1]
  if (lastMsg.role !== 'assistant') return

  lastMsg.blocks.forEach((block) => {
    if (block.type === 'tool_use' && (block as ToolUseBlock).status === 'pending') {
      (block as ToolUseBlock).status = 'rejected'
    }
  })
  // 标记消息为完成状态
  ;(lastMsg as ExtendedStreamMessage).isComplete = true
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

  // 存储最后一条完整消息，用于最终渲染
  let lastCompleteMessage: any = null

  try {
    const port = chrome.runtime.connect({ name: 'chat-stream' })
    currentPort.value = port

    port.onMessage.addListener((msg) => {
      // 调试：打印收到的消息
      console.log('[Chat Stream] 收到消息:', msg)

      if (msg.type === 'data') {
        const data = msg.data
        console.log('[Chat Stream] data 内容:', data)

        // 存储每一条消息，最后一条用于最终渲染
        lastCompleteMessage = data

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

        // 处理统计信息
        if (data.statistic && data.statistic.token_usage) {
          tokenUsage.value = {
            total: data.statistic.token_usage.total_tokens || 0,
            prompt: data.statistic.token_usage.prompt_tokens || 0,
            completion: data.statistic.token_usage.completion_tokens || 0
          }
        }
      } else if (msg.type === 'done') {
        console.log('[Chat Stream] 流式传输完成, lastCompleteMessage:', lastCompleteMessage)
        isStreaming.value = false

        // 清空 blocks，基于最后一条消息进行定制化渲染
        streamMessages.value[messageIndex].blocks = []

        if (lastCompleteMessage) {
          // 1. 如果有 think，显示 think.reasoning_content
          if (lastCompleteMessage.think && lastCompleteMessage.think.reasoning_content) {
            streamMessages.value[messageIndex].think = lastCompleteMessage.think.reasoning_content
          }

          // 2. 如果有 tool_call，渲染工具调用块
          if (lastCompleteMessage.toolCall && lastCompleteMessage.toolCall.tool_name) {
            try {
              const toolBlock: ToolUseBlock = {
                type: 'tool_use',
                id: `tool_${Date.now()}`,
                name: lastCompleteMessage.toolCall.tool_name,
                input: JSON.parse(lastCompleteMessage.toolCall.arguments || '{}'),
                status: 'pending'
              }
              streamMessages.value[messageIndex].blocks.push(toolBlock)
              streamMessages.value[messageIndex].isComplete = false
            } catch (e) {
              console.error('解析工具参数失败:', e)
            }
          }
          // 3. 如果有 answer，显示 answer.result
          else if (lastCompleteMessage.answer && lastCompleteMessage.answer.result) {
            streamMessages.value[messageIndex].blocks.push({
              type: 'summary',
              text: lastCompleteMessage.answer.result
            })
            streamMessages.value[messageIndex].isComplete = true
          }
          // 4. 如果有 ask，显示 ask.question
          else if (lastCompleteMessage.ask && lastCompleteMessage.ask.question) {
            streamMessages.value[messageIndex].blocks.push({
              type: 'question',
              text: lastCompleteMessage.ask.question
            })
            streamMessages.value[messageIndex].isComplete = true
          }
          // 5. 否则显示普通文本（如果没有 think）
          else if (!lastCompleteMessage.think && streamingContent.value) {
            streamMessages.value[messageIndex].blocks.push({ type: 'text', text: streamingContent.value })
            streamMessages.value[messageIndex].isComplete = true
          }
          // 6. 只有 think 没有其他内容
          else {
            streamMessages.value[messageIndex].isComplete = true
          }
        } else {
          // 没有收到任何消息，显示原始内容
          if (streamingContent.value) {
            streamMessages.value[messageIndex].blocks.push({ type: 'text', text: streamingContent.value })
          }
          streamMessages.value[messageIndex].isComplete = true
        }

        port.disconnect()
        currentPort.value = null
        nextTick(scrollToBottom)
      } else if (msg.type === 'error') {
        console.error('流式响应错误:', msg.error)
        const textBlock = streamMessages.value[messageIndex].blocks.find(b => b.type === 'text')
        if (textBlock && textBlock.type === 'text') {
          textBlock.text = `错误: ${msg.error}`
        }
        isStreaming.value = false
        port.disconnect()
        currentPort.value = null
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
    currentPort.value = null
  }
}

// 停止流式响应
const stopStreaming = () => {
  if (currentPort.value) {
    currentPort.value.disconnect()
    currentPort.value = null
  }
  isStreaming.value = false

  // 标记最后一条消息为已完成，并保留当前内容
  if (streamMessages.value.length > 0) {
    const lastMsg = streamMessages.value[streamMessages.value.length - 1]
    if (lastMsg.role === 'assistant') {
      // 如果有流式内容，确保显示
      if (streamingContent.value) {
        const textBlock = lastMsg.blocks.find(b => b.type === 'text')
        if (textBlock && textBlock.type === 'text') {
          textBlock.text = streamingContent.value + ' [已停止]'
        } else if (lastMsg.blocks.length === 0) {
          lastMsg.blocks.push({ type: 'text', text: streamingContent.value + ' [已停止]' })
        }
      }
      lastMsg.isComplete = true
    }
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

// 处理工具响应（用户点击 Approve/Reject 后调用）
const handleToolResponse = async (toolId: string, approved: boolean) => {
  // 找到对应的工具调用
  const lastMsg = streamMessages.value[streamMessages.value.length - 1]
  let toolBlock: ToolUseBlock | undefined

  if (lastMsg && lastMsg.role === 'assistant') {
    toolBlock = lastMsg.blocks.find(
      (b) => b.type === 'tool_use' && (b as ToolUseBlock).id === toolId
    ) as ToolUseBlock | undefined

    if (toolBlock) {
      toolBlock.status = approved ? 'approved' : 'rejected'
    }
  }

  // 如果用户拒绝，不执行任何操作
  if (!approved) {
    return
  }

  // 根据工具类型决定执行方式
  if (toolBlock && browserToolService.isBrowserTool(toolBlock.name)) {
    // 浏览器工具：本地执行，然后发 role: 'user'
    await handleBrowserToolApproved(toolBlock)
  } else {
    // 非浏览器工具：发 role: 'function' 给后端执行
    await handleNonBrowserToolApproved(toolId)
  }
}

// 处理浏览器工具批准（本地执行，发 role: 'user'）
const handleBrowserToolApproved = async (toolBlock: ToolUseBlock) => {
  // 执行工具
  const result = await executeBrowserTool(toolBlock.name, JSON.stringify(toolBlock.input))

  // 解析结果
  let resultObj: any = {}
  try {
    resultObj = JSON.parse(result)
  } catch {
    resultObj = { success: false, error: result }
  }

  // 特殊处理截图工具 - 显示图片
  if (toolBlock.name === 'screenshot' && resultObj.success && resultObj.data) {
    await sendScreenshotResult(toolBlock.name, resultObj)
    return
  }

  // 其他工具 - 普通处理
  const resultSummary = resultObj.summary || resultObj.message || (resultObj.success ? '执行成功' : '执行失败')
  await sendBrowserToolResultAsUser(toolBlock.name, result, resultSummary)
}

// 处理非浏览器工具批准（发 role: 'function' 给后端执行）
const handleNonBrowserToolApproved = async (toolId: string) => {
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
  let toolResultContent = ''  // 收集工具执行结果
  let lastCompleteMessage: any = null

  try {
    const port = chrome.runtime.connect({ name: 'chat-stream' })

    port.onMessage.addListener(async (msg) => {
      console.log('[NonBrowserTool] 收到消息:', msg)

      if (msg.type === 'data') {
        const data = msg.data
        lastCompleteMessage = data

        console.log('[NonBrowserTool] data 内容:', JSON.stringify(data))

        // 检查是否是工具执行结果（role=tool）
        if (data.role === 'tool') {
          toolResultContent += data.content || ''
          console.log('[NonBrowserTool] 收集工具执行结果:', toolResultContent)
          // 显示工具执行中状态
          streamMessages.value[messageIndex].blocks = [{
            type: 'tool_result',
            toolName: pendingToolCall?.name || '工具',
            success: true,
            result: toolResultContent.substring(0, 100) + (toolResultContent.length > 100 ? '...' : ''),
            isLoading: true
          } as ToolResultBlock]
          nextTick(scrollToBottom)
          return  // 不继续处理其他逻辑
        }

        if (data.content) {
          streamingContent.value += data.content
          const textBlock = streamMessages.value[messageIndex].blocks.find(b => b.type === 'text')
          if (textBlock && textBlock.type === 'text') {
            textBlock.text = streamingContent.value
          }
          nextTick(scrollToBottom)
        }

        if (data.think && data.think.reasoning_content) {
          currentThink += data.think.reasoning_content
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

        if (data.statistic && data.statistic.token_usage) {
          tokenUsage.value = {
            total: data.statistic.token_usage.total_tokens || 0,
            prompt: data.statistic.token_usage.prompt_tokens || 0,
            completion: data.statistic.token_usage.completion_tokens || 0
          }
        }
      } else if (msg.type === 'done') {
        console.log('[NonBrowserTool] 流式传输完成')
        console.log('[NonBrowserTool] toolResultContent:', toolResultContent)

        port.disconnect()

        // 如果收到了工具执行结果，需要继续发送给后端
        if (toolResultContent) {
          console.log('[NonBrowserTool] 检测到工具结果，继续发送请求...')
          // 更新当前消息显示工具结果
          streamMessages.value[messageIndex].blocks = [{
            type: 'tool_result',
            toolName: pendingToolCall?.name || '工具',
            success: true,
            result: toolResultContent.substring(0, 200) + (toolResultContent.length > 200 ? '...' : ''),
            isLoading: false
          } as ToolResultBlock]
          streamMessages.value[messageIndex].isComplete = true
          nextTick(scrollToBottom)

          // 继续发送给后端，让 AI 继续处理
          await sendToolResultToBackend(toolId, toolResultContent)
          return
        }

        isStreaming.value = false
        streamMessages.value[messageIndex].blocks = []

        if (currentThink) {
          streamMessages.value[messageIndex].think = currentThink
        }

        if (pendingToolCall) {
          streamMessages.value[messageIndex].blocks.push(pendingToolCall)
          streamMessages.value[messageIndex].isComplete = false
        } else if (lastCompleteMessage?.answer?.result) {
          streamMessages.value[messageIndex].blocks.push({
            type: 'summary',
            text: lastCompleteMessage.answer.result
          })
          streamMessages.value[messageIndex].isComplete = true
        } else if (lastCompleteMessage?.ask?.question) {
          streamMessages.value[messageIndex].blocks.push({
            type: 'question',
            text: lastCompleteMessage.ask.question
          })
          streamMessages.value[messageIndex].isComplete = true
        } else {
          if (!currentThink && streamingContent.value) {
            streamMessages.value[messageIndex].blocks.push({ type: 'text', text: streamingContent.value })
          }
          streamMessages.value[messageIndex].isComplete = true
        }

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

    const pageContext = await getPageContext()
    const browserTools = browserToolService.getToolDefinitions()

    // 非浏览器工具：发 role: 'function' 给后端执行
    port.postMessage({
      agentId: selectedAgent.value?.id || '',
      sessionId: currentSessionId.value,
      message: JSON.stringify({ toolId, approved: true }),
      model: currentModel.value,
      userId: 'default_user',
      role: 'function',  // 非浏览器工具用 function
      currentPageInfo: pageContext,
      browserTools: browserTools
    })
  } catch (error) {
    console.error('处理工具响应失败:', error)
    isStreaming.value = false
  }
}

// 发送工具执行结果给后端，让 AI 继续处理
const sendToolResultToBackend = async (toolId: string, result: string) => {
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
  let lastCompleteMessage: any = null

  try {
    const port = chrome.runtime.connect({ name: 'chat-stream' })

    port.onMessage.addListener((msg) => {
      console.log('[SendToolResult] 收到消息:', msg)

      if (msg.type === 'data') {
        const data = msg.data
        lastCompleteMessage = data
        console.log('[SendToolResult] data 内容:', data)

        if (data.content) {
          streamingContent.value += data.content
          const textBlock = streamMessages.value[messageIndex].blocks.find(b => b.type === 'text')
          if (textBlock && textBlock.type === 'text') {
            textBlock.text = streamingContent.value
          }
          nextTick(scrollToBottom)
        }

        if (data.think && data.think.reasoning_content) {
          currentThink += data.think.reasoning_content
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

        if (data.statistic && data.statistic.token_usage) {
          tokenUsage.value = {
            total: data.statistic.token_usage.total_tokens || 0,
            prompt: data.statistic.token_usage.prompt_tokens || 0,
            completion: data.statistic.token_usage.completion_tokens || 0
          }
        }
      } else if (msg.type === 'done') {
        console.log('[SendToolResult] 流式传输完成')
        isStreaming.value = false
        streamMessages.value[messageIndex].blocks = []

        if (currentThink) {
          streamMessages.value[messageIndex].think = currentThink
        }

        if (pendingToolCall) {
          streamMessages.value[messageIndex].blocks.push(pendingToolCall)
          streamMessages.value[messageIndex].isComplete = false
        } else if (lastCompleteMessage?.answer?.result) {
          streamMessages.value[messageIndex].blocks.push({
            type: 'summary',
            text: lastCompleteMessage.answer.result
          })
          streamMessages.value[messageIndex].isComplete = true
        } else if (lastCompleteMessage?.ask?.question) {
          streamMessages.value[messageIndex].blocks.push({
            type: 'question',
            text: lastCompleteMessage.ask.question
          })
          streamMessages.value[messageIndex].isComplete = true
        } else {
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

    const pageContext = await getPageContext()
    const browserTools = browserToolService.getToolDefinitions()

    // 发送空消息，role 为 user，让 AI 继续处理
    port.postMessage({
      agentId: selectedAgent.value?.id || '',
      sessionId: currentSessionId.value,
      message: '',  // 空消息
      model: currentModel.value,
      userId: 'default_user',
      role: 'user',  // 改为 user
      currentPageInfo: pageContext,
      browserTools: browserTools
    })
  } catch (error) {
    console.error('发送工具结果失败:', error)
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
  try {
    // 获取当前页面信息
    const pageUrl = currentPageUrl.value
    const pageTitle = currentPageTitle.value || '新对话'

    // 创建新会话
    const response = await chrome.runtime.sendMessage({
      type: 'CREATE_SESSION',
      payload: {
        title: pageTitle,
        pageUrl,
        pageTitle
      }
    })

    if (response.success) {
      currentSessionId.value = response.data.id
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
  } catch (error) {
    console.error('创建新会话失败:', error)
  }
}

// 重命名会话相关
const renamingSession = ref<any>(null)
const renameInput = ref('')

const startRenameSession = (session: any) => {
  renamingSession.value = session
  renameInput.value = session.title || session.pageTitle || ''
  // 显示重命名对话框
  nextTick(() => {
    const input = document.querySelector('.rename-input') as HTMLInputElement
    input?.focus()
    input?.select()
  })
}

const confirmRename = async () => {
  if (!renamingSession.value || !renameInput.value.trim()) return

  try {
    await chrome.runtime.sendMessage({
      type: 'RENAME_SESSION',
      payload: {
        sessionId: renamingSession.value.id,
        title: renameInput.value.trim()
      }
    })
    // 更新本地列表
    const session = sessions.value.find(s => s.id === renamingSession.value.id)
    if (session) {
      session.title = renameInput.value.trim()
    }
    renamingSession.value = null
    renameInput.value = ''
  } catch (error) {
    console.error('重命名会话失败:', error)
  }
}

const cancelRename = () => {
  renamingSession.value = null
  renameInput.value = ''
}

// 导出会话
const exportSession = async (sessionId: number) => {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'EXPORT_SESSION',
      payload: { sessionId }
    })

    if (response.success && response.data) {
      const data = response.data
      const filename = `chat-session-${data.session.title || sessionId}-${new Date().toISOString().slice(0, 10)}.json`
      downloadJson(data, filename)
    }
  } catch (error) {
    console.error('导出会话失败:', error)
  }
}

// 导出所有会话
const exportAllSessions = async () => {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'EXPORT_ALL_SESSIONS'
    })

    if (response.success && response.data) {
      const filename = `chat-all-sessions-${new Date().toISOString().slice(0, 10)}.json`
      downloadJson(response.data, filename)
    }
  } catch (error) {
    console.error('导出所有会话失败:', error)
  }
}

// 下载 JSON 文件
const downloadJson = (data: any, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 删除会话确认
const sessionToDelete = ref<any>(null)

const confirmDeleteSession = (session: any) => {
  sessionToDelete.value = session
}

const deleteSession = async () => {
  if (!sessionToDelete.value) return

  try {
    await chrome.runtime.sendMessage({
      type: 'DELETE_SESSION',
      payload: { sessionId: sessionToDelete.value.id }
    })

    // 从列表中移除
    sessions.value = sessions.value.filter(s => s.id !== sessionToDelete.value.id)

    // 如果删除的是当前会话，创建新会话
    if (currentSessionId.value === sessionToDelete.value.id) {
      await createNewSession()
    }

    sessionToDelete.value = null
  } catch (error) {
    console.error('删除会话失败:', error)
  }
}

const cancelDelete = () => {
  sessionToDelete.value = null
}
</script>

<style scoped>

/* 整体布局 */
.chat-wrapper {
  display: flex;
  height: 100vh;
  font-family: var(--font-sans);
  position: relative;
  background: var(--bg-primary);
}

.chat-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100vh;
  background: var(--bg-primary);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  background: var(--gradient-primary);
  color: var(--text-inverse);
  user-select: none;
  box-shadow: var(--shadow-md);
  position: relative;
  z-index: 100;
  overflow: visible;
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
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

.icon-btn::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.3) 10%, transparent 10.01%);
  background-repeat: no-repeat;
  background-position: 50%;
  transform: scale(10, 10);
  opacity: 0;
  transition: transform 0.5s, opacity 1s;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.icon-btn:active {
  transform: translateY(0);
}

.icon-btn:active::after {
  transform: scale(0, 0);
  opacity: 0.3;
  transition: 0s;
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
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background: var(--bg-secondary);
  scroll-behavior: smooth;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}

.chat-messages::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: var(--radius-full);
  transition: background var(--transition-base);
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
  font-size: var(--text-md);
}

.empty-state p {
  margin: 0;
}

.message {
  display: flex;
  flex-direction: column;
  transition: all var(--transition-base);
}

.message.user {
  align-items: flex-end;
}

.message.assistant {
  align-items: flex-start;
}

.message-time {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-top: var(--space-1);
  opacity: 0;
  transition: opacity var(--transition-base);
}

.message:hover .message-time {
  opacity: 1;
}

.message-box {
  max-width: 100%;
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-md);
  line-height: 1.5;
  word-wrap: break-word;
  word-break: break-word;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  overflow-wrap: break-word;
}

.message-box:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.user-box {
  background: var(--user-bg);
  color: var(--user-text);
  border-bottom-right-radius: var(--radius-sm);
  max-width: 85%;
}

.assistant-box {
  background: var(--assistant-bg);
  color: var(--assistant-text);
  border: 1px solid var(--assistant-border);
  border-bottom-left-radius: var(--radius-sm);
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
}

.assistant-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: 100%;
  width: 100%;
  overflow: hidden;
}

.block-content {
  flex: 1;
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
}

/* 思考块样式 */
.think-block {
  background: var(--think-bg);
  border: 1px solid var(--think-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  font-size: var(--text-sm);
  margin-bottom: var(--space-1);
  transition: all var(--transition-base);
}

.think-block:hover {
  box-shadow: var(--shadow-sm);
  border-color: var(--primary-500);
}

.think-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.think-icon {
  font-size: var(--text-md);
  animation: breathe 2s ease-in-out infinite;
}

.think-label {
  font-weight: 600;
  color: var(--think-text);
}

.think-content {
  color: var(--text-secondary);
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

/* 任务完成总结块样式 */
.summary-block {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border: 1px solid #10b981;
  border-radius: var(--radius-md);
  padding: var(--space-3);
  font-size: var(--text-base);
  margin-top: var(--space-2);
  transition: all var(--transition-base);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
}

.summary-block:hover {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
  border-color: #059669;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.summary-icon {
  font-size: var(--text-lg);
}

.summary-label {
  font-weight: 700;
  color: #059669;
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-content {
  color: #065f46;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  font-weight: 500;
}

/* 暗色模式下的总结块样式 */
@media (prefers-color-scheme: dark) {
  .summary-block {
    background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);
    border-color: #10b981;
  }

  .summary-label {
    color: #34d399;
  }

  .summary-content {
    color: #a7f3d0;
  }
}

/* AI提问块样式 */
.question-block {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 1px solid #3b82f6;
  border-radius: var(--radius-md);
  padding: var(--space-3);
  font-size: var(--text-base);
  margin-top: var(--space-2);
  transition: all var(--transition-base);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.question-block:hover {
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
  border-color: #2563eb;
}

.question-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.question-icon {
  font-size: var(--text-lg);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.question-label {
  font-weight: 700;
  color: #2563eb;
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.question-content {
  color: #1e40af;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  font-weight: 500;
  font-size: var(--text-md);
  padding: var(--space-2) 0;
}

.question-hint {
  font-size: var(--text-xs);
  color: #6b7280;
  margin-top: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px dashed #93c5fd;
}

/* 暗色模式下的提问块样式 */
@media (prefers-color-scheme: dark) {
  .question-block {
    background: linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%);
    border-color: #3b82f6;
  }

  .question-label {
    color: #60a5fa;
  }

  .question-content {
    color: #bfdbfe;
  }

  .question-hint {
    color: #9ca3af;
    border-top-color: #3b82f6;
  }
}

/* 工具块样式 */
.tool-block {
  background: var(--tool-bg);
  border: 1px solid var(--tool-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  font-size: var(--text-base);
  transition: all var(--transition-base);
  overflow: hidden;
}

.tool-block:hover {
  box-shadow: var(--shadow-sm);
  border-color: var(--warning-500);
}

.tool-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.tool-name {
  font-weight: 600;
  color: var(--tool-text);
}

.tool-badge {
  margin-left: auto;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tool-badge.approved {
  background: var(--success-500);
  color: white;
}

.tool-badge.rejected {
  background: var(--error-500);
  color: white;
}

/* 工具参数容器 */
.tool-params-container {
  margin-top: var(--space-2);
}

.tool-params-header {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) 0;
  cursor: pointer;
  user-select: none;
  color: var(--text-tertiary);
  font-size: var(--text-xs);
  font-weight: 500;
  transition: color var(--transition-base);
}

.tool-params-header:hover {
  color: var(--text-secondary);
}

.collapse-icon {
  width: 14px;
  height: 14px;
  transition: transform var(--transition-base);
}

.collapse-icon.rotated {
  transform: rotate(-90deg);
}

.tool-params-label {
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tool-params {
  background: var(--tool-params-bg);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  margin: 0;
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
  transition: max-height 0.3s ease, padding 0.3s ease, opacity 0.3s ease;
  line-height: 1.5;
}

.tool-params.collapsed {
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  opacity: 0;
  overflow: hidden;
}

.tool-params::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.tool-params::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: var(--radius-full);
}

/* JSON 语法高亮 */
.tool-params .json-key {
  color: #881391;
}

.tool-params .json-string {
  color: #1a73e8;
}

.tool-params .json-number {
  color: #098658;
}

.tool-params .json-boolean {
  color: #d63384;
}

/* 图片块样式（截图结果） */
.image-block {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  margin: var(--space-2) 0;
  transition: all var(--transition-base);
}

.image-block:hover {
  border-color: var(--primary-500);
  box-shadow: var(--shadow-sm);
}

.image-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.screenshot-image {
  max-width: 100%;
  max-height: 400px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  object-fit: contain;
  background: white;
}

.image-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.btn-download {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--primary-500);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-download:hover {
  background: var(--primary-600);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.btn-download:active {
  transform: translateY(0);
}

.btn-download svg {
  stroke: currentColor;
}

.image-hint {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-style: italic;
}

/* 响应式：小屏幕时调整图片块布局 */
@media (max-width: 640px) {
  .image-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
  
  .screenshot-image {
    max-height: 250px;
  }
}

.tool-params .json-null {
  color: #6c757d;
}

/* 工具执行结果块样式 */
.tool-result-block {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  margin: var(--space-2) 0;
  transition: all var(--transition-base);
}

.tool-result-block.success {
  border-left: 3px solid var(--success-500);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, var(--bg-tertiary) 100%);
}

.tool-result-block.error {
  border-left: 3px solid var(--error-500);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, var(--bg-tertiary) 100%);
}

.tool-result-block.loading {
  border-left: 3px solid var(--primary-500);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, var(--bg-tertiary) 100%);
}

.tool-result-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.tool-result-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.tool-result-block.success .tool-result-icon {
  background: rgba(16, 185, 129, 0.15);
  color: var(--success-500);
}

.tool-result-block.error .tool-result-icon {
  background: rgba(239, 68, 68, 0.15);
  color: var(--error-500);
}

.tool-result-block.loading .tool-result-icon {
  background: rgba(59, 130, 246, 0.15);
  color: var(--primary-500);
}

.tool-result-icon svg {
  stroke: currentColor;
}

.tool-result-icon .spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.tool-result-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: var(--text-sm);
}

.tool-result-status {
  margin-left: auto;
  font-size: var(--text-xs);
  font-weight: 500;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.tool-result-block.success .tool-result-status {
  background: rgba(16, 185, 129, 0.15);
  color: var(--success-500);
}

.tool-result-block.error .tool-result-status {
  background: rgba(239, 68, 68, 0.15);
  color: var(--error-500);
}

.tool-result-block.loading .tool-result-status {
  background: rgba(59, 130, 246, 0.15);
  color: var(--primary-500);
}

.tool-result-content {
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  max-height: 150px;
  overflow-y: auto;
}

.tool-result-content pre {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
}

.tool-result-content::-webkit-scrollbar {
  width: 4px;
}

.tool-result-content::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: var(--radius-full);
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .tool-result-block.success {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, var(--bg-tertiary) 100%);
  }

  .tool-result-block.error {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, var(--bg-tertiary) 100%);
  }

  .tool-result-block.loading {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, var(--bg-tertiary) 100%);
  }
}

.tool-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
  justify-content: flex-end;
}

.btn {
  padding: 6px 16px;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

.btn::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.4) 10%, transparent 10.01%);
  background-repeat: no-repeat;
  background-position: 50%;
  transform: scale(10, 10);
  opacity: 0;
  transition: transform 0.5s, opacity 1s;
}

.btn:active {
  transform: translateY(1px);
}

.btn:active::after {
  transform: scale(0, 0);
  opacity: 0.3;
  transition: 0s;
}

.btn-approve {
  background: var(--success-500);
  color: #fff;
}

.btn-approve:hover {
  background: var(--success-600);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-reject {
  background: var(--error-500);
  color: #fff;
}

.btn-reject:hover {
  background: var(--error-600);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

/* 打字动画 */
.message-box.typing {
  display: flex;
  gap: var(--space-1);
  padding: var(--space-3) var(--space-4);
}

.message-box.typing span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-muted);
  animation: typing 1.2s infinite;
}

.message-box.typing span:nth-child(2) {
  animation-delay: 0.15s;
}

.message-box.typing span:nth-child(3) {
  animation-delay: 0.3s;
}

.chat-input-area {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--border-primary);
  background: var(--surface-primary);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.chat-input-area textarea {
  flex: 1;
  border: 1px solid var(--input-border);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-md);
  font-family: inherit;
  resize: none;
  outline: none;
  max-height: 120px;
  background: var(--input-bg);
  color: var(--text-primary);
  transition: all var(--transition-base);
}

.chat-input-area textarea:focus {
  border-color: var(--input-focus);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.send-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: var(--gradient-primary);
  border-radius: var(--radius-lg);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

.send-btn::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.4) 10%, transparent 10.01%);
  background-repeat: no-repeat;
  background-position: 50%;
  transform: scale(10, 10);
  opacity: 0;
  transition: transform 0.5s, opacity 1s;
}

.send-btn:hover:not(:disabled) {
  background: var(--gradient-hover);
  box-shadow: var(--shadow-glow);
  transform: translateY(-2px);
}

.send-btn:active:not(:disabled) {
  transform: translateY(0);
}

.send-btn:active::after {
  transform: scale(0, 0);
  opacity: 0.3;
  transition: 0s;
}

.send-btn:disabled {
  background: var(--border-primary);
  cursor: not-allowed;
  opacity: 0.6;
}

.send-btn svg {
  width: 18px;
  height: 18px;
  stroke: white;
}

/* 停止按钮样式 */
.stop-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: #ef4444;
  border-radius: var(--radius-lg);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.stop-btn:hover {
  background: #dc2626;
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.4);
  transform: translateY(-2px);
}

.stop-btn:active {
  transform: translateY(0);
}

.stop-btn svg {
  width: 16px;
  height: 16px;
  fill: white;
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
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--text-secondary);
}

.match-badge {
  font-size: var(--text-xs);
  padding: var(--space-1) var(--space-2);
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-600);
  border-radius: var(--radius-full);
}

.no-agent {
  font-size: var(--text-base);
  color: var(--text-tertiary);
}

.dropdown-arrow {
  width: 16px;
  height: 16px;
  stroke: var(--text-tertiary);
  transition: transform var(--transition-base);
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
  background: var(--surface-primary);
  border-bottom: 1px solid var(--border-primary);
  box-shadow: var(--shadow-lg);
  z-index: 100;
  max-height: 300px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-md);
}

.agent-search {
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--border-primary);
}

.agent-search input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--input-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  outline: none;
  background: var(--input-bg);
  color: var(--text-primary);
  transition: all var(--transition-base);
}

.agent-search input:focus {
  border-color: var(--input-focus);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.agent-list {
  flex: 1;
  overflow-y: auto;
}

.agent-list::-webkit-scrollbar {
  width: 4px;
}

.agent-list::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: var(--radius-full);
}

.agent-loading,
.agent-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-6);
  color: var(--text-tertiary);
  font-size: var(--text-base);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-primary);
  border-top-color: var(--primary-500);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.agent-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
  transition: all var(--transition-base);
}

.agent-item:hover {
  background: var(--bg-hover);
}

.agent-item.selected {
  background: rgba(102, 126, 234, 0.1);
}

.agent-item.recommended {
  border-left: 3px solid var(--primary-500);
}

.agent-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--gradient-primary);
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
  font-size: var(--text-md);
  font-weight: 500;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.recommended-tag {
  font-size: var(--text-xs);
  padding: 1px 5px;
  background: var(--gradient-primary);
  color: white;
  border-radius: var(--radius-md);
  font-weight: normal;
}

.agent-desc {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agent-score {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--success-600);
  background: rgba(16, 185, 129, 0.1);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
}

/* Agent 选择器 - 输入框旁边 */
.agent-selector {
  position: relative;
  flex-shrink: 0;
}

.agent-selector-btn {
  width: 40px;
  height: 40px;
  border: 1px solid var(--input-border);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
  position: relative;
  color: var(--text-tertiary);
}

.agent-selector-btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-secondary);
  transform: translateY(-1px);
}

.agent-selector-btn.active {
  background: var(--gradient-primary);
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
  background: var(--success-500);
  border-radius: 50%;
  border: 2px solid var(--bg-secondary);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.agent-selector-btn.active .agent-selected-indicator {
  border-color: var(--primary-500);
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
  padding: var(--space-3);
  border-bottom: 1px solid var(--border-primary);
}

.agent-dropdown-header input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--input-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  outline: none;
  box-sizing: border-box;
  background: var(--input-bg);
  color: var(--text-primary);
  transition: all var(--transition-base);
}

.agent-dropdown-header input:focus {
  border-color: var(--input-focus);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.agent-dropdown-list {
  max-height: 280px;
  overflow-y: auto;
}

.agent-dropdown-list::-webkit-scrollbar {
  width: 4px;
}

.agent-dropdown-list::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: var(--radius-full);
}

.agent-dropdown-loading,
.agent-dropdown-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-6);
  color: var(--text-tertiary);
  font-size: var(--text-base);
}

.agent-dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  transition: all var(--transition-base);
}

.agent-dropdown-item:hover {
  background: var(--bg-hover);
}

.agent-dropdown-item.selected {
  background: rgba(102, 126, 234, 0.1);
}

.agent-dropdown-item.selected .agent-dropdown-name {
  color: var(--primary-600);
  font-weight: 600;
}

.agent-dropdown-item.recommended {
  border-left: 3px solid var(--primary-500);
}

.agent-dropdown-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--gradient-primary);
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
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.agent-dropdown-desc {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.agent-check {
  width: 20px;
  height: 20px;
  color: var(--primary-500);
}

.agent-check svg {
  width: 20px;
  height: 20px;
  stroke: var(--primary-500);
}

/* 会话选择器样式 */
.session-selector {
  position: relative;
}

.session-dropdown-menu {
  position: absolute;
  top: 36px;
  right: 0;
  width: 320px;
  background: var(--surface-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
}

.session-dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-primary);
  background: var(--bg-secondary);
}

.session-dropdown-header span {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-secondary);
}

.session-new-btn {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
}

.session-new-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.session-new-btn svg {
  width: 12px;
  height: 12px;
  stroke: white;
}

.session-dropdown-list {
  max-height: 300px;
  overflow-y: auto;
}

.session-dropdown-list::-webkit-scrollbar {
  width: 4px;
}

.session-dropdown-list::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: var(--radius-full);
}

.session-dropdown-loading,
.session-dropdown-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-6);
  color: var(--text-tertiary);
  font-size: var(--text-sm);
}

.session-dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
  transition: all var(--transition-base);
  border-bottom: 1px solid var(--border-primary);
}

.session-dropdown-item:last-child {
  border-bottom: none;
}

.session-dropdown-item:hover {
  background: var(--bg-hover);
}

.session-dropdown-item.selected {
  background: rgba(102, 126, 234, 0.1);
}

.session-dropdown-info {
  flex: 1;
  min-width: 0;
}

.session-dropdown-title {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.session-dropdown-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.session-url {
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-time {
  flex-shrink: 0;
}

.session-check {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.session-check svg {
  width: 18px;
  height: 18px;
  stroke: var(--primary-500);
}

/* 会话操作按钮 */
.session-dropdown-actions {
  display: flex;
  gap: var(--space-1);
  opacity: 0;
  transition: opacity var(--transition-base);
}

.session-dropdown-item:hover .session-dropdown-actions {
  opacity: 1;
}

.session-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-muted);
  transition: all var(--transition-base);
}

.session-action-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.session-action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error-500);
}

/* 模态对话框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2147483647;
}

.modal-dialog {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 320px;
  max-width: 90%;
}

.modal-header {
  padding: var(--space-4);
  font-weight: 600;
  font-size: var(--text-md);
  border-bottom: 1px solid var(--border-primary);
}

.modal-body {
  padding: var(--space-4);
}

.modal-body p {
  margin: 0 0 var(--space-2) 0;
  color: var(--text-secondary);
}

.modal-warning {
  color: var(--error-500) !important;
  font-size: var(--text-sm);
}

.modal-footer {
  padding: var(--space-3) var(--space-4);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  border-top: 1px solid var(--border-primary);
}

.rename-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  background: var(--bg-secondary);
  color: var(--text-primary);
  outline: none;
}

.rename-input:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.btn-primary {
  background: var(--primary-500);
  color: white;
  border: none;
}

.btn-primary:hover {
  background: var(--primary-600);
}

.btn-danger {
  background: var(--error-500);
  color: white;
  border: none;
}

.btn-danger:hover {
  background: var(--error-600);
}

/* Token 统计栏样式 */
.token-stats-bar {
  padding: var(--space-2) var(--space-4);
  background: var(--surface-secondary);
  border-top: 1px solid var(--border-primary);
  font-size: var(--text-xs);
}

.token-stats-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-1);
}

.token-stats-info {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-family: var(--font-mono);
}

.token-used {
  color: var(--text-primary);
  font-weight: 600;
}

.token-separator {
  color: var(--text-muted);
}

.token-limit {
  color: var(--text-tertiary);
}

.token-remaining {
  color: var(--text-tertiary);
  margin-left: var(--space-1);
}

.token-remaining.warning {
  color: var(--warning-500);
  font-weight: 500;
}

.token-warning-text {
  color: var(--warning-500);
  font-weight: 500;
  font-size: var(--text-xs);
}

.token-progress-bar {
  height: 4px;
  background: var(--border-primary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.token-progress-fill {
  height: 100%;
  background: var(--primary-500);
  transition: width 0.3s ease;
}

.token-progress-fill.warning {
  background: var(--warning-500);
}

.token-progress-fill.danger {
  background: var(--error-500);
}
</style>

<!-- 全局CSS变量 - 非scoped以确保全局可用 -->
<style>
@import '../styles/variables.css';
@import '../styles/animations.css';
</style>
