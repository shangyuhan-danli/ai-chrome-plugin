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
            <select v-model="apiSettings.model" class="form-select">
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              <option value="claude-3-opus">Claude 3 Opus</option>
            </select>
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

const apiSettings = ref({
  endpoint: '',
  apiKey: '',
  model: 'gpt-3.5-turbo'
})

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
    if (modelResponse?.success && modelResponse.data) {
      apiSettings.value.model = modelResponse.data
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

const viewSession = async (sessionId: number) => {
  // 可以实现查看会话详情的功能
  alert(`查看会话 ${sessionId} 的功能待实现`)
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
    await chrome.runtime.sendMessage({
      type: 'SAVE_SETTING',
      payload: { key: 'model', value: apiSettings.value.model }
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
  background: #f9fafb;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.sidebar {
  width: 260px;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 32px 0;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-header {
  padding: 0 24px 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.logo {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.logo svg {
  width: 32px;
  height: 32px;
  stroke: white;
}

.sidebar-header h1 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.sidebar-header p {
  font-size: 13px;
  opacity: 0.9;
}

.sidebar-nav {
  padding: 24px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
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
  padding: 40px;
}

.content-section {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f3f4f6;
}

.section-header h2 {
  font-size: 24px;
  color: #1f2937;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}

.btn-primary svg {
  width: 18px;
  height: 18px;
  stroke: white;
}

.btn-secondary {
  padding: 10px 20px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.sessions-list {
  display: grid;
  gap: 16px;
}

.session-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.session-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.session-info h3 {
  font-size: 16px;
  color: #1f2937;
  margin-bottom: 8px;
}

.session-info p {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
}

.session-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  border-color: #667eea;
  background: #f9fafb;
}

.btn-icon svg {
  width: 18px;
  height: 18px;
  stroke: #6b7280;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-state svg {
  width: 64px;
  height: 64px;
  stroke: #d1d5db;
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 20px;
}

.form-section {
  max-width: 600px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-hint {
  font-size: 12px;
  color: #6b7280;
  margin-top: 6px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
}

.radio-group {
  display: flex;
  gap: 16px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.radio-option input[type="radio"] {
  cursor: pointer;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.alert {
  padding: 12px 16px;
  border-radius: 8px;
  margin-top: 16px;
  font-size: 14px;
}

.alert-success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.about-content {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.about-logo {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
}

.about-logo svg {
  width: 48px;
  height: 48px;
  stroke: white;
}

.about-content h3 {
  font-size: 28px;
  color: #1f2937;
  margin-bottom: 8px;
}

.version {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 20px;
}

.description {
  font-size: 15px;
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 32px;
}

.about-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  padding: 24px;
  background: linear-gradient(135deg, #f6f8fb 0%, #f1f3f9 100%);
  border-radius: 12px;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

.about-links {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.link-btn {
  padding: 10px 20px;
  background: #f3f4f6;
  color: #374151;
  text-decoration: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.link-btn:hover {
  background: #e5e7eb;
}
</style>
