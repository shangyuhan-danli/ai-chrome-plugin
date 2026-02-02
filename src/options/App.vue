<template>
  <div class="options-container">
    <!-- 侧边栏 -->
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h1>AI Chat Assistant</h1>
        <p>设置与管理</p>
      </div>

      <nav class="sidebar-nav">
        <a
          v-for="tab in tabs"
          :key="tab.id"
          :class="['nav-item', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" v-html="tab.icon"></svg>
          <span>{{ tab.label }}</span>
        </a>
      </nav>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 会话管理 -->
      <div v-if="activeTab === 'sessions'" class="content-section">
        <div class="section-header">
          <h2>会话管理</h2>
        </div>

        <div class="sessions-list">
          <div v-if="sessions.length === 0" class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <p>暂无会话记录</p>
          </div>

          <div v-for="session in sessions" :key="session.id" class="session-card">
            <div class="session-info">
              <h3>{{ session.title }}</h3>
              <p>创建时间: {{ formatDate(session.createdAt) }}</p>
              <p>更新时间: {{ formatDate(session.updatedAt) }}</p>
            </div>
            <div class="session-actions">
              <button class="btn-icon" @click="viewSession(session.id)" title="查看">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" stroke-width="2"/>
                </svg>
              </button>
              <button class="btn-icon" @click="deleteSession(session.id)" title="删除">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="3 6 5 6 21 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 历史会话模态框 -->
      <div v-if="showSessionModal" class="modal-overlay" @click.self="closeSessionModal">
        <div class="modal-container">
          <div class="modal-header">
            <h3>{{ currentViewSession?.title || '会话详情' }}</h3>
            <button class="modal-close" @click="closeSessionModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18" stroke-width="2" stroke-linecap="round"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div v-if="sessionMessages.length === 0" class="modal-empty">
              暂无消息记录
            </div>
            <div v-else class="messages-list">
              <div
                v-for="msg in sessionMessages"
                :key="msg.id || msg.createdAt"
                :class="['message-item', msg.role]"
              >
                <div class="message-role">{{ msg.role === 'user' ? '用户' : 'AI' }}</div>
                <div class="message-content">
                  <!-- 思考过程 -->
                  <div v-if="msg.think" class="think-block">
                    <div class="think-header">
                      <span class="think-icon">💭</span>
                      <span class="think-label">思考过程</span>
                    </div>
                    <div class="think-content">{{ msg.think }}</div>
                  </div>
                  <!-- 消息内容块 -->
                  <template v-if="msg.blocks && msg.blocks.length > 0">
                    <template v-for="(block, index) in msg.blocks" :key="index">
                      <div v-if="block.type === 'text'" class="text-block">{{ block.text }}</div>
                      <div v-else-if="block.type === 'tool_use'" class="tool-block">
                        <div class="tool-header">
                          <span class="tool-icon">⚙</span>
                          <span class="tool-name">{{ block.name }}</span>
                          <span v-if="block.status" :class="['tool-badge', block.status]">
                            {{ block.status === 'approved' ? '已批准' : block.status === 'rejected' ? '已拒绝' : '待处理' }}
                          </span>
                        </div>
                        <pre class="tool-params">{{ JSON.stringify(block.input, null, 2) }}</pre>
                      </div>
                    </template>
                  </template>
                  <!-- 兼容旧格式：只有 content 字段 -->
                  <div v-else-if="msg.content" class="text-block">{{ msg.content }}</div>
                </div>
                <div class="message-time">{{ formatDate(msg.createdAt) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- API设置 -->
      <div v-if="activeTab === 'api'" class="content-section">
        <div class="section-header">
          <h2>API 配置</h2>
        </div>

        <div class="form-section">
          <div class="form-group">
            <label>API 端点</label>
            <input
              type="text"
              v-model="apiSettings.endpoint"
              placeholder="https://api.openai.com/v1/chat/completions"
              class="form-input"
            />
            <p class="form-hint">输入你的 AI API 端点地址</p>
          </div>

          <div class="form-group">
            <label>API 密钥</label>
            <input
              type="password"
              v-model="apiSettings.apiKey"
              placeholder="sk-..."
              class="form-input"
            />
            <p class="form-hint">你的 API 密钥将被安全存储</p>
          </div>

          <div class="form-group">
            <label>模型</label>
            <select v-model="apiSettings.model" class="form-select" @change="onModelChange">
              <optgroup label="OpenAI">
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
              </optgroup>
              <optgroup label="Anthropic">
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                <option value="claude-3-opus">Claude 3 Opus</option>
                <option value="claude-3-haiku">Claude 3 Haiku</option>
                <option value="claude-3.5-sonnet">Claude 3.5 Sonnet</option>
              </optgroup>
              <optgroup label="其他">
                <option value="deepseek-chat">DeepSeek Chat</option>
                <option value="deepseek-coder">DeepSeek Coder</option>
                <option value="qwen-turbo">Qwen Turbo</option>
                <option value="qwen-plus">Qwen Plus</option>
                <option value="custom">自定义模型...</option>
              </optgroup>
            </select>
            <p class="form-hint">选择要使用的 AI 模型</p>
          </div>

          <div class="form-group" v-if="apiSettings.model === 'custom'">
            <label>自定义模型名称</label>
            <input
              type="text"
              v-model="apiSettings.customModel"
              placeholder="输入模型名称，如 llama-3-70b"
              class="form-input"
            />
            <p class="form-hint">输入你的自定义模型标识符</p>
          </div>

          <div class="form-actions">
            <button class="btn-primary" @click="saveApiSettings">保存设置</button>
            <button class="btn-secondary" @click="testApiConnection">测试连接</button>
          </div>

          <div v-if="apiTestResult" :class="['alert', apiTestResult.success ? 'alert-success' : 'alert-error']">
            {{ apiTestResult.message }}
          </div>
        </div>
      </div>

      <!-- 通用设置 -->
      <div v-if="activeTab === 'general'" class="content-section">
        <div class="section-header">
          <h2>通用设置</h2>
        </div>

        <div class="form-section">
          <div class="form-group">
            <label>默认显示模式</label>
            <div class="radio-group">
              <label class="radio-option">
                <input type="radio" value="float" v-model="generalSettings.displayMode" />
                <span>悬浮窗口</span>
              </label>
              <label class="radio-option">
                <input type="radio" value="sidebar" v-model="generalSettings.displayMode" />
                <span>侧边栏</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="generalSettings.autoOpen" />
              <span>页面加载时自动打开聊天窗口</span>
            </label>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="generalSettings.saveHistory" />
              <span>保存聊天历史记录</span>
            </label>
          </div>

          <div class="form-actions">
            <button class="btn-primary" @click="saveGeneralSettings">保存设置</button>
          </div>
        </div>
      </div>

      <!-- 关于 -->
      <div v-if="activeTab === 'about'" class="content-section">
        <div class="section-header">
          <h2>关于</h2>
        </div>

        <div class="about-content">
          <div class="about-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3>AI Chat Assistant</h3>
          <p class="version">版本 1.0.0</p>
          <p class="description">
            一个基于 Vue3 + TypeScript 的浏览器 AI 聊天助手插件，
            支持悬浮窗口和侧边栏两种显示模式，提供智能对话功能。
          </p>

          <div class="about-stats">
            <div class="stat-card">
              <div class="stat-value">{{ sessions.length }}</div>
              <div class="stat-label">总会话数</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ totalMessages }}</div>
              <div class="stat-label">总消息数</div>
            </div>
          </div>

          <div class="about-links">
            <a href="#" class="link-btn">使用文档</a>
            <a href="#" class="link-btn">反馈问题</a>
            <a href="#" class="link-btn">开源地址</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const activeTab = ref('sessions')

const tabs = [
  {
    id: 'sessions',
    label: '会话管理',
    icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  {
    id: 'api',
    label: 'API 配置',
    icon: '<circle cx="12" cy="12" r="3" stroke-width="2"/><path d="M12 1v6m0 6v6M1 12h6m6 0h6" stroke-width="2" stroke-linecap="round"/>'
  },
  {
    id: 'general',
    label: '通用设置',
    icon: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  {
    id: 'about',
    label: '关于',
    icon: '<circle cx="12" cy="12" r="10" stroke-width="2"/><line x1="12" y1="16" x2="12" y2="12" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="8" x2="12.01" y2="8" stroke-width="2" stroke-linecap="round"/>'
  }
]

const sessions = ref<any[]>([])
const totalMessages = ref(0)

// 模态框相关状态
const showSessionModal = ref(false)
const currentViewSession = ref<any>(null)
const sessionMessages = ref<any[]>([])

const apiSettings = ref({
  endpoint: '',
  apiKey: '',
  model: 'gpt-3.5-turbo',
  customModel: ''
})

const onModelChange = () => {
  if (apiSettings.value.model !== 'custom') {
    apiSettings.value.customModel = ''
  }
}

const generalSettings = ref({
  displayMode: 'float' as 'float' | 'sidebar',
  autoOpen: false,
  saveHistory: true
})

const apiTestResult = ref<{ success: boolean; message: string } | null>(null)

onMounted(async () => {
  await loadSessions()
  await loadSettings()
})

const loadSessions = async () => {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SESSIONS' })
    if (response?.success) {
      sessions.value = response.data || []

      // 计算总消息数
      let total = 0
      for (const session of sessions.value) {
        const msgResponse = await chrome.runtime.sendMessage({
          type: 'GET_MESSAGES',
          payload: { sessionId: session.id }
        })
        if (msgResponse?.success) {
          total += msgResponse.data?.length || 0
        }
      }
      totalMessages.value = total
    }
  } catch (error) {
    console.error('加载会话失败:', error)
  }
}

const loadSettings = async () => {
  try {
    const displayModeResponse = await chrome.runtime.sendMessage({
      type: 'GET_SETTING',
      payload: { key: 'displayMode' }
    })
    if (displayModeResponse?.success && displayModeResponse.data) {
      generalSettings.value.displayMode = displayModeResponse.data
    }

    const apiKeyResponse = await chrome.runtime.sendMessage({
      type: 'GET_SETTING',
      payload: { key: 'apiKey' }
    })
    if (apiKeyResponse?.success && apiKeyResponse.data) {
      apiSettings.value.apiKey = apiKeyResponse.data
    }

    const endpointResponse = await chrome.runtime.sendMessage({
      type: 'GET_SETTING',
      payload: { key: 'apiEndpoint' }
    })
    if (endpointResponse?.success && endpointResponse.data) {
      apiSettings.value.endpoint = endpointResponse.data
    }

    const modelResponse = await chrome.runtime.sendMessage({
      type: 'GET_SETTING',
      payload: { key: 'model' }
    })
    const isCustomModelResponse = await chrome.runtime.sendMessage({
      type: 'GET_SETTING',
      payload: { key: 'isCustomModel' }
    })

    if (modelResponse?.success && modelResponse.data) {
      // 检查是否是自定义模型
      if (isCustomModelResponse?.success && isCustomModelResponse.data) {
        apiSettings.value.model = 'custom'
        apiSettings.value.customModel = modelResponse.data
      } else {
        // 检查模型是否在预设列表中
        const presetModels = [
          'gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini',
          'claude-3-sonnet', 'claude-3-opus', 'claude-3-haiku', 'claude-3.5-sonnet',
          'deepseek-chat', 'deepseek-coder', 'qwen-turbo', 'qwen-plus'
        ]
        if (presetModels.includes(modelResponse.data)) {
          apiSettings.value.model = modelResponse.data
        } else {
          apiSettings.value.model = 'custom'
          apiSettings.value.customModel = modelResponse.data
        }
      }
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

const viewSession = async (sessionId: number) => {
  try {
    // 找到当前会话信息
    currentViewSession.value = sessions.value.find(s => s.id === sessionId)

    // 获取会话消息
    const response = await chrome.runtime.sendMessage({
      type: 'GET_MESSAGES',
      payload: { sessionId }
    })

    if (response?.success) {
      sessionMessages.value = response.data || []
    } else {
      sessionMessages.value = []
    }

    // 显示模态框
    showSessionModal.value = true
  } catch (error) {
    console.error('加载会话消息失败:', error)
    alert('加载会话消息失败')
  }
}

const closeSessionModal = () => {
  showSessionModal.value = false
  currentViewSession.value = null
  sessionMessages.value = []
}

const deleteSession = async (sessionId: number) => {
  if (!confirm('确定要删除这个会话吗？')) return

  try {
    await chrome.runtime.sendMessage({
      type: 'DELETE_SESSION',
      payload: { sessionId }
    })
    await loadSessions()
  } catch (error) {
    console.error('删除会话失败:', error)
  }
}

const saveApiSettings = async () => {
  try {
    await chrome.runtime.sendMessage({
      type: 'SAVE_SETTING',
      payload: { key: 'apiKey', value: apiSettings.value.apiKey }
    })
    await chrome.runtime.sendMessage({
      type: 'SAVE_SETTING',
      payload: { key: 'apiEndpoint', value: apiSettings.value.endpoint }
    })
    // 如果是自定义模型，保存自定义模型名称
    const modelToSave = apiSettings.value.model === 'custom'
      ? apiSettings.value.customModel
      : apiSettings.value.model
    await chrome.runtime.sendMessage({
      type: 'SAVE_SETTING',
      payload: { key: 'model', value: modelToSave }
    })
    await chrome.runtime.sendMessage({
      type: 'SAVE_SETTING',
      payload: { key: 'isCustomModel', value: apiSettings.value.model === 'custom' }
    })
    alert('API 设置已保存')
  } catch (error) {
    console.error('保存 API 设置失败:', error)
  }
}

const testApiConnection = async () => {
  apiTestResult.value = { success: true, message: '连接测试功能待实现' }
  setTimeout(() => {
    apiTestResult.value = null
  }, 3000)
}

const saveGeneralSettings = async () => {
  try {
    await chrome.runtime.sendMessage({
      type: 'SAVE_SETTING',
      payload: { key: 'displayMode', value: generalSettings.value.displayMode }
    })
    await chrome.runtime.sendMessage({
      type: 'SAVE_SETTING',
      payload: { key: 'autoOpen', value: generalSettings.value.autoOpen }
    })
    await chrome.runtime.sendMessage({
      type: 'SAVE_SETTING',
      payload: { key: 'saveHistory', value: generalSettings.value.saveHistory }
    })
    alert('通用设置已保存')
  } catch (error) {
    console.error('保存通用设置失败:', error)
  }
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}
</script>

<style scoped>

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.options-container {
  display: flex;
  min-height: 100vh;
  background: var(--bg-secondary);
  font-family: var(--font-sans);
}

.sidebar {
  width: 260px;
  background: var(--gradient-primary);
  color: var(--text-inverse);
  padding: var(--space-8) 0;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-header {
  padding: 0 var(--space-6) var(--space-8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.logo {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-4);
}

.logo svg {
  width: 32px;
  height: 32px;
  stroke: white;
}

.sidebar-header h1 {
  font-size: var(--text-xl);
  font-weight: 600;
  margin-bottom: var(--space-1);
}

.sidebar-header p {
  font-size: var(--text-base);
  opacity: 0.9;
}

.sidebar-nav {
  padding: var(--space-6) 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-6);
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all var(--transition-base);
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  padding-left: calc(var(--space-6) + 2px);
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border-left-color: white;
}

.nav-item svg {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  flex-shrink: 0;
}

.main-content {
  margin-left: 260px;
  flex: 1;
  padding: var(--space-10);
}

.content-section {
  background: var(--surface-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}

.content-section:hover {
  box-shadow: var(--shadow-md);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-8);
  padding-bottom: var(--space-5);
  border-bottom: 2px solid var(--border-primary);
}

.section-header h2 {
  font-size: var(--text-2xl);
  color: var(--text-primary);
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 10px var(--space-5);
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-glow);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary svg {
  width: 18px;
  height: 18px;
  stroke: white;
}

.btn-secondary {
  padding: 10px var(--space-5);
  background: var(--surface-secondary);
  color: var(--text-secondary);
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.sessions-list {
  display: grid;
  gap: 16px;
}

.session-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-5);
  background: var(--surface-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-primary);
  transition: all var(--transition-base);
}

.session-card:hover {
  border-color: var(--primary-500);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.session-info h3 {
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.session-info p {
  font-size: var(--text-base);
  color: var(--text-tertiary);
  margin-bottom: var(--space-1);
}

.session-actions {
  display: flex;
  gap: var(--space-2);
}

.btn-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-icon:hover {
  border-color: var(--primary-500);
  background: var(--bg-hover);
  transform: translateY(-1px);
}

.btn-icon svg {
  width: 18px;
  height: 18px;
  stroke: var(--text-tertiary);
  transition: stroke var(--transition-base);
}

.btn-icon:hover svg {
  stroke: var(--primary-500);
}

.empty-state {
  text-align: center;
  padding: var(--space-10) var(--space-5);
}

.empty-state svg {
  width: 64px;
  height: 64px;
  stroke: var(--border-secondary);
  margin-bottom: var(--space-4);
}

.empty-state p {
  font-size: var(--text-lg);
  color: var(--text-tertiary);
  margin-bottom: var(--space-5);
}

.form-section {
  max-width: 600px;
}

.form-group {
  margin-bottom: var(--space-6);
}

.form-group label {
  display: block;
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}

.form-input,
.form-select {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--input-border);
  border-radius: var(--radius-lg);
  font-size: var(--text-md);
  font-family: inherit;
  background: var(--input-bg);
  color: var(--text-primary);
  transition: all var(--transition-base);
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--input-focus);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-hint {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  margin-top: var(--space-1);
}

.form-actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-8);
}

.radio-group {
  display: flex;
  gap: var(--space-4);
}

.radio-option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  transition: background var(--transition-base);
}

.radio-option:hover {
  background: var(--bg-hover);
}

.radio-option input[type="radio"] {
  cursor: pointer;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  font-weight: normal;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  transition: background var(--transition-base);
}

.checkbox-label:hover {
  background: var(--bg-hover);
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.alert {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  margin-top: var(--space-4);
  font-size: var(--text-md);
  animation: fadeInUp var(--transition-base) ease-out;
}

.alert-success {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-600);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.alert-error {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error-600);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.about-content {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.about-logo {
  width: 80px;
  height: 80px;
  background: var(--gradient-primary);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-6);
  box-shadow: var(--shadow-md);
}

.about-logo svg {
  width: 48px;
  height: 48px;
  stroke: white;
}

.about-content h3 {
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.version {
  font-size: var(--text-md);
  color: var(--text-tertiary);
  margin-bottom: var(--space-5);
}

.description {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: var(--space-8);
}

.about-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-5);
  margin-bottom: var(--space-8);
}

.stat-card {
  padding: var(--space-6);
  background: var(--surface-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-primary);
  transition: all var(--transition-base);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-500);
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: var(--primary-500);
  margin-bottom: var(--space-2);
}

.stat-label {
  font-size: var(--text-md);
  color: var(--text-tertiary);
}

.about-links {
  display: flex;
  justify-content: center;
  gap: var(--space-4);
}

.link-btn {
  padding: 10px var(--space-5);
  background: var(--surface-secondary);
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-md);
  font-weight: 500;
  transition: all var(--transition-base);
  border: 1px solid var(--border-primary);
}

.link-btn:hover {
  background: var(--bg-hover);
  border-color: var(--primary-500);
  color: var(--primary-500);
  transform: translateY(-1px);
}

/* 模态框样式 */
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
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.modal-container {
  background: var(--surface-primary);
  border-radius: var(--radius-xl);
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
  animation: slideUp 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--border-primary);
  background: var(--gradient-primary);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: var(--text-lg);
  color: white;
  font-weight: 600;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.modal-close svg {
  width: 18px;
  height: 18px;
  stroke: white;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5);
}

.modal-empty {
  text-align: center;
  padding: var(--space-10);
  color: var(--text-tertiary);
  font-size: var(--text-md);
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.message-item {
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-primary);
  transition: all var(--transition-base);
}

.message-item:hover {
  box-shadow: var(--shadow-sm);
}

.message-item.user {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-color: rgba(102, 126, 234, 0.2);
}

.message-item.assistant {
  background: var(--surface-secondary);
}

.message-role {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--primary-500);
  margin-bottom: var(--space-2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.message-item.assistant .message-role {
  color: var(--success-600);
}

.message-content {
  font-size: var(--text-md);
  color: var(--text-primary);
  line-height: 1.6;
}

.message-time {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-top: var(--space-2);
  text-align: right;
}

.text-block {
  white-space: pre-wrap;
  word-break: break-word;
}

/* 模态框中的思考块 */
.modal-body .think-block {
  background: var(--think-bg, #f0f7ff);
  border: 1px solid var(--think-border, #91caff);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  margin-bottom: var(--space-3);
}

.modal-body .think-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.modal-body .think-icon {
  font-size: var(--text-md);
}

.modal-body .think-label {
  font-weight: 600;
  color: var(--primary-500);
  font-size: var(--text-sm);
}

.modal-body .think-content {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: 1.5;
  white-space: pre-wrap;
}

/* 模态框中的工具块 */
.modal-body .tool-block {
  background: var(--tool-bg, #fff8e6);
  border: 1px solid var(--tool-border, #ffe58f);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  margin-top: var(--space-2);
}

.modal-body .tool-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.modal-body .tool-icon {
  color: var(--warning-500);
}

.modal-body .tool-name {
  font-weight: 600;
  color: var(--tool-text, #d48806);
  font-size: var(--text-sm);
}

.modal-body .tool-badge {
  margin-left: auto;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 600;
}

.modal-body .tool-badge.approved {
  background: var(--success-500);
  color: white;
}

.modal-body .tool-badge.rejected {
  background: var(--error-500);
  color: white;
}

.modal-body .tool-badge.pending {
  background: var(--warning-500);
  color: white;
}

.modal-body .tool-params {
  background: rgba(0, 0, 0, 0.05);
  border-radius: var(--radius-sm);
  padding: var(--space-2);
  margin: 0;
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  white-space: pre-wrap;
  word-break: break-all;
  overflow-x: auto;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<!-- 全局CSS变量 - 非scoped以确保全局可用 -->
<style>
@import '../styles/variables.css';
@import '../styles/animations.css';
</style>
